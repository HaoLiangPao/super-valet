import { CATALOG_FETCHED_AT } from '@/data/catalog';
import { haversineKm } from '@/data/seed-restaurants';
import type { ServiceWindow } from '@/data/seed-restaurants';
import { newId } from '@/lib/engine/store';
import { categoryQueryTerm } from '@/lib/places/category-queries';
import { isStale } from '@/lib/places/contract';
import type {
  Classification,
  ImportPreview,
  PlaceCandidate,
  PlaceDetails,
} from '@/lib/places/contract';
import { distanceFrom, summarize } from '@/lib/places/preview';
import { currentBackend } from '@/lib/store/backend';
import type { PoolEntry } from '@/lib/store/backend';
import { logFetch } from '@/lib/store/pool';
import { archivedPlaceIds } from './archive';
import { businessStatusOf, suggestedReason, toBusinessStatus } from './availability';
import type { CatalogRestaurant } from './availability';
import { catalogIndex } from './catalog';
import { loadLocationPrefs, radiusKm, resolveLocation } from './location';
import { canAutoRefresh, sanitizeRefreshReports } from './refresh-report';
import {
  MANUAL_DISCOVERY_QUERY_LIMIT,
  REFRESH_BATCH_LIMIT,
} from './refresh-types';
import type {
  AttentionItem,
  DiscoveredCandidate,
  FieldChange,
  RefreshFailure,
  RefreshReport,
  RefreshTrigger,
  RestaurantDiff,
} from './refresh-types';
import { effectiveSelection } from './selection';
import type { LocationPrefs } from './types';

/**
 * 刷新流水线（design/0009 §4.2）—— 「30 天 TTL 的执行者」。
 *
 * 一条路，两种触发：
 *   ① 刷新已有：对过期条目重拉 Places Details → 只记**真正变了**的事实字段
 *   ② 发现新店（**仅手动**）：按当前位置 + 半径做类目搜索 → 去重 → 分类 → 候选
 *   ③ 产出 `RefreshReport` 并落库
 *
 * 三条不许破的纪律：
 *   - **绝不自动入池、绝不自动归档**（ADR-0008 / ADR-0009）。本文件里没有任何
 *     一条路径会写 selection 或 archive，`needsAttention` 是**问句**不是通知。
 *   - **分类不被刷新覆盖**：`primary` / `tags` / `slotLock` / `confidence` 是我们
 *     （和用户）的判断，Places 只负责事实。刷新只动 `REFRESHABLE` 那几个字段。
 *   - **失败必须进报告**。一家抓失败就少更新一家，把它吞掉的话，「更新了 12 家」
 *     就是假的。
 *
 * provider 一律**注入**（`RefreshPort`）：单测不打真网，也不需要密钥。
 */

/* ── Port：流水线对外面世界的全部需求 ──────────────────────────────── */

export interface LatLng {
  lat: number;
  lng: number;
}

/** 一家店重拉事实的结果：成功给 details，失败给一句给用户看的短句 */
export interface DetailsOutcome {
  placeId: string;
  details?: PlaceDetails;
  /** 已本地化的失败短句（HTTP 端口负责翻译，流水线不拼文案） */
  error?: string;
}

/** 一个类目查询的结果 */
export interface DiscoverOutcome {
  query: string;
  candidates: PlaceCandidate[];
  error?: string;
}

/**
 * 刷新引擎需要的三件事。真身在 `lib/places/refresh-fetch.ts`（走我们自己的
 * Route Handler，密钥只在服务端），测试里塞假实现。
 *
 * 为什么 `detailsBatch` 是批量而 `preview` 是单个：Details 是一次刷新的主要
 * 成本，批量走一个请求能让服务端一次拿到 20 家、也让「这次抓了几次」有唯一
 * 的计数点；而 preview 每个都带一次 LLM 分类，失败必须**逐个**降级成候选缺失，
 * 不能一颗老鼠屎坏一锅汤。
 */
export interface RefreshPort {
  detailsBatch(placeIds: string[]): Promise<DetailsOutcome[]>;
  discover(queries: string[], at: LatLng): Promise<DiscoverOutcome[]>;
  preview(placeId: string): Promise<ImportPreview>;
  /** 进抓取台账的 provider 名：'google' / 'fixture'（≠ google 即演示数据） */
  providerName: string;
}

/* ── 事实字段的比对 ───────────────────────────────────────────────── */

/** 展示用一位小数：Places 的 rating 本来就是一位，4.7000001 不是「变了」 */
function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

/**
 * 营业时间的**语言中立**摘要键。
 *
 * 报告里「营业时间变了」只需要知道变没变，但 `FieldChange.before/after` 只装
 * 标量，所以把整组窗口压成一个确定性字符串（先排序，免得上游顺序抖动被当成
 * 变化）。**不在这里拼「3 段 → 2 段」这种中文** —— 界面拿到这两个键，
 * 按 i18n 出人话（`structural: true` 就是在告诉界面「别拿它算差值」）。
 */
export function windowsKey(windows: ServiceWindow[]): string {
  return [...windows]
    .map((w) => `${w.day === null ? '*' : w.day}:${w.open}-${w.close}`)
    .sort()
    .join('|');
}

/** 同上：'1,3' = 周一周三休，'' = 无固定休 */
export function closedDaysKey(days: number[]): string {
  return [...days].sort((a, b) => a - b).join(',');
}

function classificationOf(r: CatalogRestaurant): Classification {
  return {
    primary: r.primary,
    tags: r.tags,
    soloFriendly: r.soloFriendly,
    slotLock: r.slotLock,
    isMainMeal: r.isMainMeal,
    priorBias: r.priorBias,
    confidence: r.confidence,
    reason: r.reason,
  };
}

/**
 * 只记**真正变了**的字段（design/0009 §4.2）。
 * 一个字段都没变的店不进报告（否则 74 家全在列表里，报告就成了噪音），
 * 由调用方计进 `unchanged`。
 */
export function diffFacts(before: CatalogRestaurant, after: PlaceDetails): FieldChange[] {
  const changes: FieldChange[] = [];
  const push = (
    field: FieldChange['field'],
    b: FieldChange['before'],
    a: FieldChange['after'],
    structural = false,
  ): void => {
    if (b === a) return;
    changes.push({ field, before: b, after: a, ...(structural ? { structural: true } : {}) });
  };

  push('name', before.name, after.name);
  push('address', before.address, after.address);
  push('rating', round1(before.rating), round1(after.rating));
  push('ratingCount', before.ratingCount, after.ratingCount);
  push('priceLevel', before.priceLevel, after.priceLevel);
  push('dineIn', before.dineIn, after.dineIn);
  push('closedDays', closedDaysKey(before.closedDays), closedDaysKey(after.closedDays), true);
  push('serviceWindows', windowsKey(before.serviceWindows), windowsKey(after.serviceWindows), true);
  push('businessStatus', businessStatusOf(before), toBusinessStatus(after.businessStatus));

  return changes;
}

/**
 * 把新抓到的事实并回餐厅记录。**只动事实**：分类字段（primary/tags/slotLock/
 * confidence/reason/priorBias/soloFriendly/isMainMeal）一个都不碰 ——
 * 用户可能亲手改过分类，刷新一次就被 LLM 的判断覆盖是最招骂的那种 bug。
 *
 * `distanceKm` / `bucket` 跟着新坐标重算（仍是相对导入锚点的兜底值；真正展示
 * 用的距离由 `localize.ts` 按当前位置实时算）。
 */
export function mergeFacts(before: CatalogRestaurant, after: PlaceDetails): CatalogRestaurant {
  const geo = distanceFrom(after.lat, after.lng);
  const merged: CatalogRestaurant = {
    ...before,
    name: after.name,
    address: after.address,
    lat: after.lat,
    lng: after.lng,
    dineIn: after.dineIn,
    priceLevel: after.priceLevel,
    rating: after.rating,
    ratingCount: after.ratingCount,
    closedDays: after.closedDays,
    serviceWindows: after.serviceWindows,
    distanceKm: geo.distanceKm,
    bucket: geo.bucket,
  };
  const status = toBusinessStatus(after.businessStatus);
  // 重新开门了就要把字段**删掉**，不是留着旧的 CLOSED_*：
  // 缺失 = OPERATIONAL（ADR-0009），留着旧值会永久挂一个「已停业」的标
  if (status === 'OPERATIONAL') delete merged.businessStatus;
  else merged.businessStatus = status;
  return merged;
}

/* ── 过期判定 ────────────────────────────────────────────────────── */

function poolIndex(): Map<string, PoolEntry> {
  return new Map(currentBackend().loadPool().map((e) => [e.restaurant.placeId, e]));
}

/**
 * 这家店的事实是什么时候抓的。三个来源，越靠前越权威：
 *   1. 本身份导入/刷新过的记录（`fetchedAt`，退回 `addedAt`）
 *   2. 静态目录的生成时间（`CATALOG_FETCHED_AT`）
 *   3. 都没有 → `null`：15 家种子是手写的，我们**从来没问过 Places**，
 *      所以它们永远排在刷新队列最前面，而不是假装「刚抓过」。
 */
export function fetchedAtOf(placeId: string, pool = poolIndex()): string | null {
  const entry = pool.get(placeId);
  if (entry) return entry.fetchedAt ?? entry.addedAt;
  return CATALOG_FETCHED_AT[placeId] ?? null;
}

export function isStalePlace(placeId: string, now: Date = new Date()): boolean {
  const at = fetchedAtOf(placeId);
  return at === null || isStale(at, now);
}

export interface TargetOptions {
  /** 指定条目（池子页的「立刻重抓这一家」）；不传 = 池子里过期的 */
  placeIds?: string[];
  /** 上限；**永远不会超过** `REFRESH_BATCH_LIMIT`，调用方抬不高 */
  limit?: number;
  now?: Date;
}

/**
 * 这次要刷新哪些店。
 *
 * 范围是**用户的池子**（`effectiveSelection()`），不是整个 74 家目录：
 * 刷新的意义是「让摇出来的店的事实是真的」，用户没选进池子的店刷了也不影响
 * 任何一次推荐，纯烧配额。已归档的跳过 —— 用户已经说过「去不了了」。
 *
 * 排序是**最旧的先刷**（从没抓过的排最前），这样 20 家的批次上限在多天里
 * 会自然地把整个池子轮完，而不是每天重复刷同样的头 20 家。
 */
export function refreshTargets(opts: TargetOptions = {}): string[] {
  const limit = Math.min(opts.limit ?? REFRESH_BATCH_LIMIT, REFRESH_BATCH_LIMIT);
  if (limit <= 0) return [];
  const now = opts.now ?? new Date();
  const catalog = catalogIndex();
  const pool = poolIndex();

  if (opts.placeIds) {
    // 显式指定：不做过期判定（用户就是要现在重抓），但目录里查不到的跳过
    // —— 没有「之前的事实」就没法产出 diff，报告里只会是一条空记录
    return [...new Set(opts.placeIds)].filter((id) => catalog.has(id)).slice(0, limit);
  }

  const archived = archivedPlaceIds();
  return effectiveSelection()
    .filter((id) => !archived.has(id) && catalog.has(id))
    .map((id) => ({ id, at: fetchedAtOf(id, pool) }))
    .filter(({ at }) => at === null || isStale(at, now))
    .sort((a, b) => (a.at ?? '').localeCompare(b.at ?? '') || a.id.localeCompare(b.id))
    .slice(0, limit)
    .map((t) => t.id);
}

/* ── ① 刷新已有 ──────────────────────────────────────────────────── */

export interface RefreshExistingOptions extends TargetOptions {
  port: RefreshPort;
}

export interface RefreshExistingResult {
  updated: RestaurantDiff[];
  unchanged: number;
  needsAttention: AttentionItem[];
  failed: RefreshFailure[];
  fetchCount: number;
  /** 这次实际请求了哪些 placeId（测试与报告的可审计面） */
  targets: string[];
}

function persistRefreshed(
  restaurant: CatalogRestaurant,
  fetchedAt: string,
  summary: string,
  existing: PoolEntry | undefined,
): void {
  currentBackend().addToPool({
    restaurant,
    // 刷新不碰用户的笔记与菜品：它们是「用户主动粘贴」的产物，与 Places 无关
    dishes: existing?.dishes ?? [],
    addedAt: existing?.addedAt ?? fetchedAt,
    fetchedAt,
    ...(existing?.sourceText ? { sourceText: existing.sourceText } : {}),
    summary,
  });
}

/**
 * 对过期（或指定）的条目重拉 Places Details，产出 `RestaurantDiff[]`。
 *
 * **没变化的也会落库**：`fetchedAt` 必须往前走，否则这家店永远「过期」，
 * 每天的自动刷新会把同一批店反复抓一遍 —— 那是一个会自己烧钱的 bug。
 */
export async function refreshExisting(
  opts: RefreshExistingOptions,
): Promise<RefreshExistingResult> {
  const now = opts.now ?? new Date();
  const targets = refreshTargets(opts);
  const result: RefreshExistingResult = {
    updated: [], unchanged: 0, needsAttention: [], failed: [], fetchCount: 0, targets,
  };
  if (targets.length === 0) return result;

  const catalog = catalogIndex();
  const pool = poolIndex();

  let outcomes: DetailsOutcome[];
  try {
    outcomes = await opts.port.detailsBatch(targets);
  } catch (err) {
    // 整批挂掉（断网 / 端点 500）：**每一家都要在报告里露面**，
    // 不能只留一句「刷新失败」然后让用户以为没什么事发生
    const message = errorText(err);
    result.fetchCount = targets.length;
    for (const placeId of targets) {
      const name = catalog.get(placeId)?.name ?? placeId;
      result.failed.push({ placeId, name, message });
      logFetch({
        at: now.toISOString(), kind: 'refresh', placeId, placeName: name,
        provider: opts.port.providerName, outcome: 'error', note: message.slice(0, 120),
      });
    }
    return result;
  }

  // 每一个请求过的 placeId 都算一次对外抓取（失败也烧了配额，如实计数）
  result.fetchCount = outcomes.length;
  // provider 名要在抓完之后读：HTTP 端口是看了服务端的 `demo` 才知道
  // 这一批到底是 Places 的真数据还是 fixture 的演示数据
  const demo = opts.port.providerName !== 'google';

  for (const outcome of outcomes) {
    const before = catalog.get(outcome.placeId);
    const name = before?.name ?? outcome.placeId;

    if (!outcome.details || !before) {
      const message = outcome.error ?? '这家店没抓到，下次再试';
      result.failed.push({ placeId: outcome.placeId, name, message });
      logFetch({
        at: now.toISOString(), kind: 'refresh', placeId: outcome.placeId, placeName: name,
        provider: opts.port.providerName, outcome: 'error', note: message.slice(0, 120),
      });
      continue;
    }

    const details = outcome.details;
    const changes = diffFacts(before, details);
    const after = mergeFacts(before, details);
    const status = toBusinessStatus(details.businessStatus);
    const fetchedAt = now.toISOString();
    const summary = summarize(
      details, classificationOf(before), pool.get(outcome.placeId)?.dishes.length ?? 0, demo,
    );

    persistRefreshed(after, fetchedAt, summary, pool.get(outcome.placeId));

    if (changes.length > 0) {
      result.updated.push({
        placeId: outcome.placeId, name: after.name, changes, businessStatus: status, fetchedAt,
      });
    } else {
      result.unchanged += 1;
    }

    // 「需要你确认」= 现在不是 OPERATIONAL 的那些（不只是「这次变成的」）：
    // 用户上次可能点了「先留着」，状态还在，就还得问。**绝不自动归档**。
    if (status !== 'OPERATIONAL') {
      result.needsAttention.push({
        placeId: outcome.placeId,
        name: after.name,
        businessStatus: status,
        suggestedReason: suggestedReason(status),
      });
    }

    logFetch({
      at: fetchedAt, kind: 'refresh', placeId: outcome.placeId, placeName: after.name,
      provider: opts.port.providerName, outcome: 'ok', note: summary,
    });
  }

  return result;
}

/* ── ② 发现新店（仅手动）────────────────────────────────────────── */

/** 一次手动重扫最多做几次「候选 → 分类」（每次 = 1 Details + 1 LLM，成本护栏） */
export const DISCOVERY_PREVIEW_LIMIT = 8;

export interface CategoryQuery {
  /** 子菜系 code，进 `DiscoveredCandidate.viaCategory` */
  code: string;
  term: string;
}

/**
 * 类目查询词从**目录里已有的 `primary` 反推**（design/0009 §4.2）：
 * 目录里中餐多，就多用中餐词去找，而不是拿一张写死的清单去烧配额。
 *
 * 按出现次数排序后**按天轮转**（`rotation` = 天数）：只取前 8 个的话，
 * 尾部的类目（泰餐、加勒比）永远不会被搜到；轮转让整张表在几天里覆盖一遍，
 * 而且同一天内是确定的（可测、可复现）。
 */
export function discoveryQueries(opts: {
  limit?: number;
  rotation?: number;
  catalog?: CatalogRestaurant[];
} = {}): CategoryQuery[] {
  const limit = Math.min(opts.limit ?? MANUAL_DISCOVERY_QUERY_LIMIT, MANUAL_DISCOVERY_QUERY_LIMIT);
  if (limit <= 0) return [];
  const list = opts.catalog ?? [...catalogIndex().values()];

  const counts = new Map<string, number>();
  for (const r of list) {
    if (categoryQueryTerm(r.primary) === null) continue;
    counts.set(r.primary, (counts.get(r.primary) ?? 0) + 1);
  }
  const codes = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([code]) => code);
  if (codes.length === 0) return [];

  const start = ((opts.rotation ?? 0) % codes.length + codes.length) % codes.length;
  const out: CategoryQuery[] = [];
  const usedTerms = new Set<string>();
  for (let i = 0; i < codes.length && out.length < limit; i++) {
    const code = codes[(start + i) % codes.length];
    const term = categoryQueryTerm(code);
    if (term === null || usedTerms.has(term)) continue;
    usedTerms.add(term);
    out.push({ code, term });
  }
  return out;
}

/** 轮转用的天序号；与引擎的 epochDay 无关，只要每天 +1 且可注入即可 */
function dayIndex(now: Date): number {
  return Math.floor(now.getTime() / 86_400_000);
}

export interface DiscoverNearbyOptions {
  port: RefreshPort;
  prefs?: LocationPrefs;
  /** 覆盖半径（km），design/0009 §4.5 的自定义输入；不传按 prefs.radius */
  withinKm?: number;
  /** 类目查询上限；**永远不会超过** `MANUAL_DISCOVERY_QUERY_LIMIT` */
  queryLimit?: number;
  /** 「候选 → 分类」次数上限；永远不会超过 `DISCOVERY_PREVIEW_LIMIT` */
  candidateLimit?: number;
  now?: Date;
}

export interface DiscoverNearbyResult {
  discovered: DiscoveredCandidate[];
  failed: RefreshFailure[];
  fetchCount: number;
  /** 这次用了哪些类目查询（报告与排查用） */
  queries: CategoryQuery[];
}

/**
 * 按当前位置 + 半径做类目搜索，滤掉已知的，分类后作为**候选**返回。
 *
 * ⚠️ **绝不自动入池**（ADR-0008）：本函数不写 selection、不写归档，
 * 连 `addToPool` 都不调 —— 用户勾选后由界面走正常导入路径。
 * 「仅手动触发」由 `runRefresh()` 保证（自动触发根本不会走到这里）。
 */
export async function discoverNearby(
  opts: DiscoverNearbyOptions,
): Promise<DiscoverNearbyResult> {
  const now = opts.now ?? new Date();
  const prefs = opts.prefs ?? loadLocationPrefs();
  const at = resolveLocation(prefs, now.getTime());
  const within = opts.withinKm ?? radiusKm(prefs.radius);
  const queries = discoveryQueries({
    ...(opts.queryLimit === undefined ? {} : { limit: opts.queryLimit }),
    rotation: dayIndex(now),
  });
  const result: DiscoverNearbyResult = { discovered: [], failed: [], fetchCount: 0, queries };
  if (queries.length === 0) return result;

  let outcomes: DiscoverOutcome[];
  try {
    outcomes = await opts.port.discover(queries.map((q) => q.term), { lat: at.lat, lng: at.lng });
  } catch (err) {
    const message = errorText(err);
    result.fetchCount = queries.length;
    for (const q of queries) {
      result.failed.push({ placeId: `query:${q.term}`, name: q.term, message });
    }
    logFetch({
      at: now.toISOString(), kind: 'refresh', query: queries.map((q) => q.term).join(' / '),
      provider: opts.port.providerName, outcome: 'error', note: message.slice(0, 120),
    });
    return result;
  }
  result.fetchCount = outcomes.length;

  // 已知的一律不算「新发现」：目录里的、池子里的、归档里的（用户已经说过不去了）
  const known = new Set<string>([
    ...catalogIndex().keys(),
    ...effectiveSelection(),
    ...archivedPlaceIds(),
  ]);

  const byPlace = new Map<string, { candidate: PlaceCandidate; code: string; term: string }>();
  for (const outcome of outcomes) {
    const q = queries.find((x) => x.term === outcome.query);
    const code = q?.code ?? '';
    logFetch({
      at: now.toISOString(), kind: 'refresh', query: outcome.query,
      provider: opts.port.providerName,
      outcome: outcome.error ? 'error' : 'ok',
      resultCount: outcome.candidates.length,
      ...(outcome.error ? { note: outcome.error.slice(0, 120) } : {}),
    });
    if (outcome.error) {
      result.failed.push({
        // 失败的是一个**查询**而不是一家店：用 `query:` 前缀显式区分，
        // 界面拿它当 key 也不会与真 placeId 撞
        placeId: `query:${outcome.query}`, name: outcome.query, message: outcome.error,
      });
      continue;
    }
    for (const candidate of outcome.candidates) {
      if (known.has(candidate.placeId) || byPlace.has(candidate.placeId)) continue;
      // Places 说永久停业的新店没有推荐的道理（ADR-0009 只禁止**自动归档**，
      // 不禁止「不主动把一家关门的店塞给用户」）
      if (toBusinessStatus(candidate.businessStatus) === 'CLOSED_PERMANENTLY') continue;
      byPlace.set(candidate.placeId, { candidate, code, term: outcome.query });
    }
  }

  const limit = Math.min(opts.candidateLimit ?? DISCOVERY_PREVIEW_LIMIT, DISCOVERY_PREVIEW_LIMIT);
  for (const { candidate, code } of [...byPlace.values()].slice(0, limit)) {
    result.fetchCount += 1;
    let preview: ImportPreview;
    try {
      preview = await opts.port.preview(candidate.placeId);
    } catch (err) {
      const message = errorText(err);
      result.failed.push({ placeId: candidate.placeId, name: candidate.name, message });
      logFetch({
        at: now.toISOString(), kind: 'refresh', placeId: candidate.placeId,
        placeName: candidate.name, provider: opts.port.providerName,
        outcome: 'error', note: message.slice(0, 120),
      });
      continue;
    }

    const r = preview.restaurant as CatalogRestaurant;
    // 半径过滤只能放在 Details **之后**：Text Search 的候选不带坐标，
    // 拿不到距离。这是接受的浪费（最多 8 次），换的是不必新开一个计费 SKU。
    const km = haversineKm(at.lat, at.lng, r.lat, r.lng);
    logFetch({
      at: now.toISOString(), kind: 'refresh', placeId: r.placeId, placeName: r.name,
      provider: opts.port.providerName, outcome: 'ok', note: preview.summary,
    });
    if (Number.isFinite(within) && !(km < within)) continue;

    result.discovered.push({
      restaurant: { ...r, distanceKm: Math.round(km * 10) / 10 },
      viaCategory: code,
      distanceKm: Math.round(km * 10) / 10,
    });
  }

  return result;
}

/* ── ③ 编排 ──────────────────────────────────────────────────────── */

/** 报告台账（最近的在前）。存的是用户数据，读回来一律洗一遍 */
export function recentRefreshReports(): RefreshReport[] {
  return sanitizeRefreshReports(currentBackend().loadRefreshReports());
}

export function saveRefreshReport(report: RefreshReport): void {
  try {
    currentBackend().appendRefreshReport(report);
  } catch {
    // 台账落不进去不该让「刷新成功」变成一次异常：报告还在内存里，会显示出来
  }
}

/** 自动刷新今天还能不能跑（每天至多一次；手动重扫不占额度） */
export function shouldAutoRefresh(now: Date = new Date()): boolean {
  return canAutoRefresh(recentRefreshReports(), now);
}

export interface RunRefreshOptions extends DiscoverNearbyOptions, TargetOptions {
  /** 手动重扫时可以关掉发现（只刷新已有）；自动触发**恒为 false**，不可覆盖 */
  discover?: boolean;
}

/**
 * 编排一次刷新，产出 `RefreshReport`。
 *
 * 返回 `null` = **什么都没做**（自动触发被节制条款挡住，或没有过期条目）。
 * 刻意不返回一份空报告：空报告会在「刷新历史」里堆成一排毫无信息的行，
 * 还会把「上次自动刷新」推到今天 —— 等于用一次没发生的刷新吃掉当天的额度。
 * 手动触发**一定**产出报告（用户点了按钮，必须给他回执，哪怕是「没变化」）。
 */
export async function runRefresh(
  trigger: RefreshTrigger,
  opts: RunRefreshOptions,
): Promise<RefreshReport | null> {
  const now = opts.now ?? new Date();

  // 节制条款：自动刷新每天至多一次
  if (trigger === 'auto' && !shouldAutoRefresh(now)) return null;

  const startedAt = now.toISOString();
  const existing = await refreshExisting(opts);

  if (trigger === 'auto' && existing.targets.length === 0) return null;

  // 节制条款：**自动触发只刷新不发现**（design/0009 §4.2）。
  // 这一行是那条规则的全部实现，所以它不看 opts —— 调用方传 discover: true 也没用。
  const wantDiscover = trigger === 'manual' && opts.discover !== false;
  const found = wantDiscover
    ? await discoverNearby(opts)
    : { discovered: [], failed: [], fetchCount: 0, queries: [] };

  const report: RefreshReport = {
    id: newId(),
    trigger,
    startedAt,
    finishedAt: new Date().toISOString(),
    updated: existing.updated,
    discovered: found.discovered,
    needsAttention: existing.needsAttention,
    failed: [...existing.failed, ...found.failed],
    fetchCount: existing.fetchCount + found.fetchCount,
    unchanged: existing.unchanged,
  };
  saveRefreshReport(report);
  return report;
}

/* ── 杂项 ────────────────────────────────────────────────────────── */

/**
 * 异常 → 给用户看的短句。HTTP 端口抛出的 `Error.message` 已经是本地化过的
 * 人话（`refresh-fetch.ts` 走 `resolveApiErrorMessage`），这里只做兜底。
 */
function errorText(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return '刷新失败，稍后再试';
}
