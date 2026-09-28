import { toArchiveReason, toBusinessStatus } from './availability';
import { AUTO_REFRESH_MIN_INTERVAL_MS } from './refresh-types';
import type {
  AttentionItem,
  DiscoveredCandidate,
  FieldChange,
  RefreshFailure,
  RefreshReport,
  RefreshTrigger,
  RefreshableField,
  RestaurantDiff,
} from './refresh-types';
import type { CatalogRestaurant } from './availability';

/**
 * 刷新报告的**净化器与政策判断**（design/0009 §4.2 / §4.3）。
 *
 * 这个文件刻意不 import 流水线（`refresh.ts`）也不 import 后端：
 *   - 读回来的报告是**存过的用户数据**（localStorage 或 Supabase 的 jsonb），
 *     一律当不可信输入洗一遍 —— 一条脏报告不许把「刷新历史」整页带崩；
 *   - 「自动刷新今天还能不能跑」这个判断是纯函数，测试不必装存储。
 * 落库与读取的入口在 `refresh.ts`（它才需要 `currentBackend()`）。
 */

/** 本地后端保留多少份报告；与 fetch_log 的 200 同理，观测用不必无限增长 */
export const REFRESH_REPORT_LIMIT = 50;

const REFRESHABLE_FIELDS: readonly RefreshableField[] = [
  'name', 'address', 'rating', 'ratingCount', 'priceLevel',
  'dineIn', 'closedDays', 'serviceWindows', 'businessStatus',
];
const FIELD_SET = new Set<string>(REFRESHABLE_FIELDS);

function str(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null;
}

function isoOr(v: unknown, fallback: string): string {
  const s = typeof v === 'string' ? v : '';
  return s && !Number.isNaN(Date.parse(s)) ? s : fallback;
}

function count(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0;
}

function scalar(v: unknown): FieldChange['before'] {
  if (v === null) return null;
  if (typeof v === 'string' || typeof v === 'boolean') return v;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  return null;
}

function sanitizeChange(raw: unknown): FieldChange | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const c = raw as Record<string, unknown>;
  if (typeof c.field !== 'string' || !FIELD_SET.has(c.field)) return null;
  return {
    field: c.field as RefreshableField,
    before: scalar(c.before),
    after: scalar(c.after),
    ...(c.structural === true ? { structural: true as const } : {}),
  };
}

function sanitizeDiff(raw: unknown): RestaurantDiff | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const d = raw as Record<string, unknown>;
  const placeId = str(d.placeId);
  if (!placeId) return null;
  const changes = Array.isArray(d.changes)
    ? d.changes.map(sanitizeChange).filter((c): c is FieldChange => c !== null)
    : [];
  return {
    placeId,
    name: str(d.name) ?? placeId,
    changes,
    businessStatus: toBusinessStatus(d.businessStatus),
    fetchedAt: isoOr(d.fetchedAt, new Date(0).toISOString()),
  };
}

/**
 * 候选餐厅只做**最低限度**的结构校验：placeId / 名字 / 坐标在，就留着。
 * 不逐字段重建一个 `Restaurant`（那是 40 行没人看的代码），因为报告里的候选
 * 只用于「显示 + 用户点确认后走正常导入路径」，真正入池那一步会自己校验。
 */
function sanitizeCandidate(raw: unknown): DiscoveredCandidate | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const c = raw as Record<string, unknown>;
  const r = c.restaurant;
  if (typeof r !== 'object' || r === null) return null;
  const rest = r as Record<string, unknown>;
  if (!str(rest.placeId) || !str(rest.name)) return null;
  if (typeof rest.lat !== 'number' || typeof rest.lng !== 'number') return null;
  return {
    restaurant: r as CatalogRestaurant,
    viaCategory: str(c.viaCategory) ?? '',
    distanceKm: typeof c.distanceKm === 'number' && Number.isFinite(c.distanceKm) ? c.distanceKm : 0,
  };
}

function sanitizeAttention(raw: unknown): AttentionItem | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const a = raw as Record<string, unknown>;
  const placeId = str(a.placeId);
  if (!placeId) return null;
  return {
    placeId,
    name: str(a.name) ?? placeId,
    businessStatus: toBusinessStatus(a.businessStatus),
    suggestedReason: toArchiveReason(a.suggestedReason),
  };
}

function sanitizeFailure(raw: unknown): RefreshFailure | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const f = raw as Record<string, unknown>;
  return {
    placeId: str(f.placeId) ?? '',
    name: str(f.name) ?? '',
    message: str(f.message) ?? '',
  };
}

function list<T>(raw: unknown, each: (v: unknown) => T | null): T[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(each).filter((v): v is T => v !== null);
}

/**
 * 任何形状 → 合法的 `RefreshReport`，或 `null`（连 id 都没有，留着也没用）。
 *
 * 缺 `trigger` 时按 `'manual'` 处理：报告存在本身说明有人跑过一次刷新，
 * 而把它记成 `'auto'` 会让「每天至多一次」的节制条款被一条脏数据劫持。
 */
export function sanitizeRefreshReport(raw: unknown): RefreshReport | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const id = str(r.id);
  if (!id) return null;

  const trigger: RefreshTrigger = r.trigger === 'auto' ? 'auto' : 'manual';
  const startedAt = isoOr(r.startedAt, new Date(0).toISOString());
  const updated = list(r.updated, sanitizeDiff);
  const discovered = list(r.discovered, sanitizeCandidate);
  const needsAttention = list(r.needsAttention, sanitizeAttention);
  const failed = list(r.failed, sanitizeFailure);

  return {
    id,
    trigger,
    startedAt,
    finishedAt: isoOr(r.finishedAt, startedAt),
    updated,
    // 自动刷新不做发现（design/0009 §4.2 的节制条款）。这里不是「顺手清理」：
    // 一份 trigger=auto 却带着候选的报告只能是坏数据或篡改，显示出来等于替
    // 用户背书一批他从没点过「重新扫描」的店。
    discovered: trigger === 'auto' ? [] : discovered,
    needsAttention,
    failed,
    fetchCount: count(r.fetchCount),
    unchanged: count(r.unchanged),
  };
}

export function sanitizeRefreshReports(raw: unknown): RefreshReport[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: RefreshReport[] = [];
  for (const v of raw) {
    const report = sanitizeRefreshReport(v);
    if (!report || seen.has(report.id)) continue;
    seen.add(report.id);
    out.push(report);
  }
  return out;
}

/** 汇总数（落库时占列，界面也用它出「更新 12 · 新发现 3 · 失败 1」这一行） */
export interface RefreshCounts {
  updated: number;
  unchanged: number;
  discovered: number;
  attention: number;
  failed: number;
  fetches: number;
}

export function refreshCounts(report: RefreshReport): RefreshCounts {
  return {
    updated: report.updated.length,
    unchanged: report.unchanged,
    discovered: report.discovered.length,
    attention: report.needsAttention.length,
    failed: report.failed.length,
    fetches: report.fetchCount,
  };
}

/* ── 自动刷新的节制（design/0009 §4.2）──────────────────────────────── */

/**
 * 上一次**自动**刷新是什么时候。
 *
 * 刻意从报告台账里推，而不是另存一个 `lastAutoRefreshAt` 时间戳：多一份状态
 * 就多一处会和事实对不上的地方（「时间戳说刷过，报告里没有」）。
 * 手动重扫**不占用**自动刷新的额度 —— 它是用户自己要的，不是我们替他花的钱。
 */
export function lastAutoRefreshAt(reports: RefreshReport[]): number | null {
  let latest: number | null = null;
  for (const r of reports) {
    if (r.trigger !== 'auto') continue;
    const t = Date.parse(r.startedAt);
    if (Number.isNaN(t)) continue;
    if (latest === null || t > latest) latest = t;
  }
  return latest;
}

/** 距离上次自动刷新是否已经超过 `AUTO_REFRESH_MIN_INTERVAL_MS`（每天至多一次） */
export function canAutoRefresh(reports: RefreshReport[], now: Date = new Date()): boolean {
  const last = lastAutoRefreshAt(reports);
  if (last === null) return true;
  return now.getTime() - last >= AUTO_REFRESH_MIN_INTERVAL_MS;
}
