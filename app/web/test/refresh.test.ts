import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ANCHORS, SEED_RESTAURANTS } from '../src/data/seed-restaurants';
import type { SeedRestaurant } from '../src/data/seed-restaurants';
import { archiveRestaurant, archivedEntries } from '../src/lib/catalog/archive';
import { staticCatalog } from '../src/lib/catalog/catalog';
import { localizedPool, poolRestaurants } from '../src/lib/catalog/localize';
import { setRadius } from '../src/lib/catalog/location';
import {
  DISCOVERY_PREVIEW_LIMIT, closedDaysKey, diffFacts, discoverNearby, discoveryQueries,
  fetchedAtOf, isStalePlace, mergeFacts, recentRefreshReports, refreshExisting, refreshTargets,
  runRefresh, shouldAutoRefresh, windowsKey,
} from '../src/lib/catalog/refresh';
import type { DetailsOutcome, DiscoverOutcome, RefreshPort } from '../src/lib/catalog/refresh';
import {
  REFRESH_REPORT_LIMIT, canAutoRefresh, lastAutoRefreshAt, refreshCounts,
  sanitizeRefreshReport, sanitizeRefreshReports,
} from '../src/lib/catalog/refresh-report';
import {
  AUTO_REFRESH_MIN_INTERVAL_MS, MANUAL_DISCOVERY_QUERY_LIMIT, REFRESH_BATCH_LIMIT,
} from '../src/lib/catalog/refresh-types';
import type { RefreshReport } from '../src/lib/catalog/refresh-types';
import { DETOUR, PARKING_MIN, SPEED_KMH, WALK_MAX_KM, travelEstimate } from '../src/lib/catalog/travel';
import { defaultLocationPrefs } from '../src/lib/catalog/types';
import type { LocationPrefs } from '../src/lib/catalog/types';
import {
  addToSelection, effectiveSelection, saveSelection,
} from '../src/lib/catalog/selection';
import {
  CATEGORY_QUERY_TERMS, codesWithoutQuery, nonCategoryTerms, unknownQueryCodes,
} from '../src/lib/places/category-queries';
import type { ImportPreview, PlaceCandidate, PlaceDetails } from '../src/lib/places/contract';
import { createProfile, setActiveProfile } from '../src/lib/profiles/profiles';
import { currentBackend, setStoreBackend } from '../src/lib/store/backend';
import { isInPool, recentFetchLog } from '../src/lib/store/pool';

/**
 * 刷新引擎（design/0009 §4.2–§4.4、S4）。
 *
 * 这一组测试锁死的是**政策**，不是实现细节：
 *   节制条款四条   —— 批次 20 家、自动每天至多一次、类目查询 ≤ 8、自动不发现
 *   只记真变化     —— 没变的进 unchanged，报告里不许有噪音
 *   失败必须可见   —— 抓失败的店一家不许从报告里消失
 *   绝不替用户做主 —— 发现不入池（ADR-0008）、停业不归档（ADR-0009）
 *   驾车估算       —— 边界与 WALK 档位同一个阈值
 *
 * provider 一律注入假实现：**不打真网、不需要密钥**。
 */

/* localStorage shim（vitest 跑在 node 环境，自带没有） */
function createStorageShim(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    key: (i: number) => [...map.keys()][i] ?? null,
    removeItem: (k: string) => void map.delete(k),
    setItem: (k: string, v: string) => void map.set(k, String(v)),
  } as Storage;
}

const DM = ANCHORS.downtownMarkham;
/**
 * 「现在」。刻意取在静态目录生成时间（2026-09-26）之后 30 天以上 ——
 * 于是整个目录在这一刻都是过期的，刷新队列才有东西可测。
 */
const T0 = new Date('2026-11-01T18:00:00.000Z');
const seed = (i: number): SeedRestaurant => SEED_RESTAURANTS[i];

/** 一家**从来没抓过**的店（不在 CATALOG_FETCHED_AT 里的种子） */
function seedNeverFetched(): SeedRestaurant {
  const r = SEED_RESTAURANTS.find((x) => fetchedAtOf(x.placeId) === null);
  expect(r).toBeTruthy();
  return r!;
}

function atDowntown(over: Partial<LocationPrefs> = {}): LocationPrefs {
  return {
    ...defaultLocationPrefs(),
    source: { kind: 'anchor', id: 'downtownMarkham', lat: DM.lat, lng: DM.lng },
    ...over,
  };
}

/** 一份「与目录里完全一致」的 Details —— 不传 over 就是「什么都没变」 */
function detailsOf(r: SeedRestaurant, over: Partial<PlaceDetails> = {}): PlaceDetails {
  return {
    placeId: r.placeId,
    name: r.name,
    address: r.address,
    lat: r.lat,
    lng: r.lng,
    priceLevel: r.priceLevel,
    rating: r.rating,
    ratingCount: r.ratingCount,
    serviceWindows: r.serviceWindows,
    closedDays: r.closedDays,
    dineIn: r.dineIn,
    ...over,
  };
}

function candidateOf(placeId: string, name: string, over: Partial<PlaceCandidate> = {}): PlaceCandidate {
  return { placeId, name, address: `${name} 的地址`, ...over };
}

/** 候选 → 已分类的餐厅（模拟 /api/explore/preview 的产出） */
function previewOf(placeId: string, name: string, at: { lat: number; lng: number }): ImportPreview {
  return {
    restaurant: {
      placeId, name, address: `${name} 的地址`, lat: at.lat, lng: at.lng,
      primary: 'CN_SICHUAN', tags: ['CN_SICHUAN'], soloFriendly: true, slotLock: [],
      isMainMeal: true, priorBias: 1, dineIn: true, priceLevel: 2, rating: 4.4,
      ratingCount: 120, closedDays: [], serviceWindows: [{ day: null, open: '11:00', close: '21:00' }],
      distanceKm: 0, bucket: 'WALK', confidence: 0.9, reason: '测试',
    },
    fetchedAt: T0.toISOString(),
    summary: `${name} 的摘要`,
    dishes: [],
    alreadyInPool: false,
    demo: true,
  };
}

interface FakePort extends RefreshPort {
  /** 每次 detailsBatch 收到的 placeId 批次 */
  batches: string[][];
  /** 每次 discover 收到的查询组 */
  queryRuns: string[][];
  previewed: string[];
}

function fakePort(over: {
  details?: (placeId: string) => DetailsOutcome;
  detailsThrows?: string;
  discover?: (query: string) => DiscoverOutcome;
  discoverThrows?: string;
  preview?: (placeId: string) => ImportPreview;
  previewThrows?: (placeId: string) => string | null;
  providerName?: string;
} = {}): FakePort {
  return {
    providerName: over.providerName ?? 'fixture',
    batches: [],
    queryRuns: [],
    previewed: [],
    async detailsBatch(placeIds) {
      this.batches.push([...placeIds]);
      if (over.detailsThrows) throw new Error(over.detailsThrows);
      const make = over.details ?? ((id: string) => {
        const r = SEED_RESTAURANTS.find((x) => x.placeId === id);
        return r ? { placeId: id, details: detailsOf(r) } : { placeId: id, error: '没抓到' };
      });
      return placeIds.map(make);
    },
    async discover(queries) {
      this.queryRuns.push([...queries]);
      if (over.discoverThrows) throw new Error(over.discoverThrows);
      const make = over.discover ?? ((q: string) => ({ query: q, candidates: [] }));
      return queries.map(make);
    },
    async preview(placeId) {
      this.previewed.push(placeId);
      const boom = over.previewThrows?.(placeId);
      if (boom) throw new Error(boom);
      return (over.preview ?? ((id: string) => previewOf(id, id, DM)))(placeId);
    },
  };
}

beforeEach(() => {
  globalThis.localStorage = createStorageShim();
  const p = createProfile('测试', '🍚');
  setActiveProfile(p.id);
});

afterEach(() => {
  setStoreBackend(null);
});

/* ------------------------------------------------------------------ *
 * 1. 过期判定（>30 天，用 isStale）
 * ------------------------------------------------------------------ */

describe('过期判定', () => {
  it('从来没问过 Places 的店永远算过期（不假装刚抓过）', () => {
    const never = SEED_RESTAURANTS.filter((r) => fetchedAtOf(r.placeId) === null);
    expect(never.length).toBeGreaterThan(0);
    for (const r of never) {
      expect(isStalePlace(r.placeId, new Date('2020-01-01T00:00:00.000Z'))).toBe(true);
      expect(isStalePlace(r.placeId, T0)).toBe(true);
    }
    // T0 取在目录生成 30 天之后，所以此刻整个目录都过期
    for (const r of staticCatalog()) expect(isStalePlace(r.placeId, T0)).toBe(true);
  });

  it('静态目录用生成时间判过期：30 天内不刷，超过才刷', () => {
    const onlyCatalog = staticCatalog().find((r) => !SEED_RESTAURANTS.some((s) => s.placeId === r.placeId));
    expect(onlyCatalog).toBeTruthy();
    const at = fetchedAtOf(onlyCatalog!.placeId);
    expect(at).toBeTruthy();
    const fetchedAt = new Date(Date.parse(at!));
    const in29Days = new Date(fetchedAt.getTime() + 29 * 86_400_000);
    const in31Days = new Date(fetchedAt.getTime() + 31 * 86_400_000);
    expect(isStalePlace(onlyCatalog!.placeId, in29Days)).toBe(false);
    expect(isStalePlace(onlyCatalog!.placeId, in31Days)).toBe(true);
  });

  it('刷新过一次之后 fetchedAt 前移 —— 否则同一批店每天被反复抓', async () => {
    const target = seed(0).placeId;
    await refreshExisting({ port: fakePort(), placeIds: [target], now: T0 });
    expect(fetchedAtOf(target)).toBe(T0.toISOString());
    expect(isStalePlace(target, T0)).toBe(false);
    expect(isStalePlace(target, new Date(T0.getTime() + 31 * 86_400_000))).toBe(true);
  });

  it('「没变化」的店也要落 fetchedAt（不然它永远过期）', async () => {
    const target = seed(1).placeId;
    const result = await refreshExisting({ port: fakePort(), placeIds: [target], now: T0 });
    expect(result.updated).toEqual([]);
    expect(result.unchanged).toBe(1);
    expect(isStalePlace(target, T0)).toBe(false);
  });

  it('最旧的先刷：多天之内整个池子会被轮完', async () => {
    const never = seedNeverFetched();
    const [a, b] = [seed(0).placeId, seed(1).placeId];
    saveSelection([a, b, never.placeId]);
    // a 刚刷过（不过期），b 半年前刷过，never 从来没抓过 → 顺序 never, b
    await refreshExisting({ port: fakePort(), placeIds: [a], now: T0 });
    currentBackend().addToPool({
      restaurant: seed(1), dishes: [], addedAt: '2026-04-01T00:00:00.000Z',
      fetchedAt: '2026-04-01T00:00:00.000Z',
    });
    expect(refreshTargets({ now: T0 })).toEqual([never.placeId, b]);
  });

  it('已归档的不刷 —— 用户已经说过「去不了了」', () => {
    const [a, b] = [seed(0).placeId, seed(1).placeId];
    saveSelection([a, b]);
    archiveRestaurant(b, 'manual', T0);
    expect(refreshTargets({ now: T0 })).toEqual([a]);
  });
});

/* ------------------------------------------------------------------ *
 * 2. diff 只记真正变了的字段
 * ------------------------------------------------------------------ */

describe('diff：只记真正变了的字段', () => {
  it('完全一致 → 零变化', () => {
    expect(diffFacts(seed(0), detailsOf(seed(0)))).toEqual([]);
  });

  it('评分变了记一条，浮点噪声不算变', () => {
    const changes = diffFacts(seed(0), detailsOf(seed(0), { rating: seed(0).rating + 0.1 }));
    expect(changes).toHaveLength(1);
    expect(changes[0]).toEqual({
      field: 'rating', before: seed(0).rating, after: Math.round((seed(0).rating + 0.1) * 10) / 10,
    });
    expect(diffFacts(seed(0), detailsOf(seed(0), { rating: seed(0).rating + 0.000001 }))).toEqual([]);
  });

  it('评价数 / 价位 / 堂食 / 名称 / 地址各记一条', () => {
    const changes = diffFacts(seed(0), detailsOf(seed(0), {
      ratingCount: seed(0).ratingCount + 7,
      priceLevel: 4,
      dineIn: !seed(0).dineIn,
      name: '改了名的店',
      address: '搬去了别处',
    }));
    expect(changes.map((c) => c.field).sort())
      .toEqual(['address', 'dineIn', 'name', 'priceLevel', 'ratingCount']);
  });

  it('价位从 null 变成数字也算变（不是「没变」）', () => {
    const r: SeedRestaurant = { ...seed(0), priceLevel: null };
    const changes = diffFacts(r, detailsOf(r, { priceLevel: 2 }));
    expect(changes).toEqual([{ field: 'priceLevel', before: null, after: 2 }]);
  });

  it('营业时间是结构性变化：换顺序不算变，真变了才记，且 before/after 不含中文', () => {
    const windows = [
      { day: 1, open: '11:00', close: '14:00' },
      { day: 2, open: '17:00', close: '21:00' },
    ];
    const r: SeedRestaurant = { ...seed(0), serviceWindows: windows };
    expect(diffFacts(r, detailsOf(r, { serviceWindows: [...windows].reverse() }))).toEqual([]);

    const changes = diffFacts(r, detailsOf(r, { serviceWindows: [windows[0]] }));
    expect(changes).toHaveLength(1);
    expect(changes[0].field).toBe('serviceWindows');
    expect(changes[0].structural).toBe(true);
    expect(String(changes[0].before)).toBe('1:11:00-14:00|2:17:00-21:00');
    expect(String(changes[0].after)).toBe('1:11:00-14:00');
    // 文案由前端配合 i18n 出：这里一个中文字都不许有
    expect(`${changes[0].before}${changes[0].after}`).not.toMatch(/[一-鿿]/);
  });

  it('休息日同为结构性变化：[1] → [2] 家数一样也认得出来', () => {
    const r: SeedRestaurant = { ...seed(0), closedDays: [1] };
    const changes = diffFacts(r, detailsOf(r, { closedDays: [2] }));
    expect(changes).toEqual([
      { field: 'closedDays', before: '1', after: '2', structural: true },
    ]);
    expect(closedDaysKey([3, 1])).toBe('1,3');
    expect(windowsKey([{ day: null, open: '00:00', close: '26:00' }])).toBe('*:00:00-26:00');
  });

  it('businessStatus 变化记一条（缺失 = OPERATIONAL）', () => {
    expect(diffFacts(seed(0), detailsOf(seed(0), { businessStatus: 'CLOSED_PERMANENTLY' })))
      .toEqual([{ field: 'businessStatus', before: 'OPERATIONAL', after: 'CLOSED_PERMANENTLY' }]);
    expect(diffFacts(seed(0), detailsOf(seed(0), { businessStatus: 'OPERATIONAL' }))).toEqual([]);
  });

  it('分类字段绝不被刷新覆盖（primary/tags/slotLock/confidence 原样）', () => {
    const before = { ...seed(0), primary: 'CN_SICHUAN', confidence: 0.42, reason: '用户亲手改的' };
    const after = mergeFacts(before, detailsOf(seed(0), { rating: 3.1 }));
    expect(after.primary).toBe('CN_SICHUAN');
    expect(after.tags).toEqual(before.tags);
    expect(after.slotLock).toEqual(before.slotLock);
    expect(after.confidence).toBe(0.42);
    expect(after.reason).toBe('用户亲手改的');
    expect(after.rating).toBe(3.1);
  });

  it('重新开门 → businessStatus 字段被删掉，而不是留着旧的 CLOSED_*', () => {
    const closed = { ...seed(0), businessStatus: 'CLOSED_TEMPORARILY' as const };
    const reopened = mergeFacts(closed, detailsOf(seed(0)));
    expect('businessStatus' in reopened).toBe(false);
  });

  it('没变化的店不进 updated（报告里不许有噪音）', async () => {
    saveSelection([seed(0).placeId, seed(1).placeId]);
    const port = fakePort({
      details: (id) => (id === seed(0).placeId
        ? { placeId: id, details: detailsOf(seed(0), { ratingCount: 9999 }) }
        : { placeId: id, details: detailsOf(seed(1)) }),
    });
    const result = await refreshExisting({ port, now: T0 });
    expect(result.updated.map((d) => d.placeId)).toEqual([seed(0).placeId]);
    expect(result.unchanged).toBe(1);
  });
});

/* ------------------------------------------------------------------ *
 * 3. 节制条款四条
 * ------------------------------------------------------------------ */

describe('节制条款 ①：单次至多 REFRESH_BATCH_LIMIT 家', () => {
  it('池子里 30 家过期，一次只碰 20 家，且调用方抬不高上限', async () => {
    const ids = staticCatalog().slice(0, 30).map((r) => r.placeId);
    saveSelection(ids);
    expect(refreshTargets({ now: T0, limit: 500 })).toHaveLength(REFRESH_BATCH_LIMIT);

    const port = fakePort();
    const result = await refreshExisting({ port, now: T0, limit: 500 });
    expect(port.batches).toHaveLength(1);
    expect(port.batches[0]).toHaveLength(REFRESH_BATCH_LIMIT);
    expect(result.fetchCount).toBe(REFRESH_BATCH_LIMIT);
  });

  it('显式指定条目也受同一个上限约束', () => {
    const ids = staticCatalog().slice(0, 25).map((r) => r.placeId);
    expect(refreshTargets({ placeIds: ids, now: T0 })).toHaveLength(REFRESH_BATCH_LIMIT);
  });
});

describe('节制条款 ②：自动刷新每天至多一次', () => {
  it('同一天第二次自动刷新什么都不做，也不落一份空报告', async () => {
    const first = await runRefresh('auto', { port: fakePort(), now: T0 });
    expect(first).not.toBeNull();
    expect(first!.trigger).toBe('auto');
    expect(recentRefreshReports()).toHaveLength(1);

    const port = fakePort();
    const second = await runRefresh('auto', { port, now: new Date(T0.getTime() + 3600_000) });
    expect(second).toBeNull();
    expect(port.batches).toEqual([]);
    expect(recentRefreshReports()).toHaveLength(1);
  });

  it('满 24 小时之后放行，但还得真有过期条目才会抓（两层节制）', async () => {
    await runRefresh('auto', { port: fakePort(), now: T0 });
    const justBefore = new Date(T0.getTime() + AUTO_REFRESH_MIN_INTERVAL_MS - 1000);
    const justAfter = new Date(T0.getTime() + AUTO_REFRESH_MIN_INTERVAL_MS);
    expect(shouldAutoRefresh(justBefore)).toBe(false);
    expect(shouldAutoRefresh(justAfter)).toBe(true);

    // 第二层：24 小时之后，昨天刚刷过的店还不到 30 天，所以照样不抓
    const idle = fakePort();
    expect(await runRefresh('auto', { port: idle, now: justAfter })).toBeNull();
    expect(idle.batches).toEqual([]);

    // 31 天之后它们真过期了 → 放行
    const due = fakePort();
    const report = await runRefresh('auto', { port: due, now: new Date(T0.getTime() + 31 * 86_400_000) });
    expect(report).not.toBeNull();
    expect(due.batches[0].length).toBeGreaterThan(0);
  });

  it('手动重扫不占用自动刷新的额度（那是用户自己要的）', async () => {
    await runRefresh('manual', { port: fakePort(), now: T0 });
    expect(shouldAutoRefresh(new Date(T0.getTime() + 1000))).toBe(true);
    expect(lastAutoRefreshAt(recentRefreshReports())).toBeNull();
  });

  it('没有过期条目时自动刷新不落报告（手动仍然给回执）', async () => {
    saveSelection([]);
    expect(await runRefresh('auto', { port: fakePort(), now: T0 })).toBeNull();
    expect(recentRefreshReports()).toHaveLength(0);

    const manual = await runRefresh('manual', { port: fakePort(), now: T0 });
    expect(manual).not.toBeNull();
    expect(recentRefreshReports()).toHaveLength(1);
  });
});

describe('节制条款 ③：手动类目查询每次至多 8 个', () => {
  it('discoveryQueries 与 discoverNearby 都卡在 8', async () => {
    expect(discoveryQueries({ limit: 50 })).toHaveLength(MANUAL_DISCOVERY_QUERY_LIMIT);
    const port = fakePort();
    await discoverNearby({ port, prefs: atDowntown(), queryLimit: 50, now: T0 });
    expect(port.queryRuns).toHaveLength(1);
    expect(port.queryRuns[0]).toHaveLength(MANUAL_DISCOVERY_QUERY_LIMIT);
  });

  it('类目词从目录里已有的 primary 反推，并按天轮转覆盖长尾', () => {
    const catalog = [
      { ...seed(0), primary: 'CN_HOTPOT' },
      { ...seed(1), primary: 'CN_HOTPOT' },
      { ...seed(2), primary: 'AS_SUSHI' },
      { ...seed(3), primary: '不存在的菜系' },
    ];
    const day0 = discoveryQueries({ catalog, limit: 1, rotation: 0 });
    const day1 = discoveryQueries({ catalog, limit: 1, rotation: 1 });
    // 出现次数多的排前面；轮转让第二天换到下一个类目
    expect(day0).toEqual([{ code: 'CN_HOTPOT', term: CATEGORY_QUERY_TERMS.CN_HOTPOT }]);
    expect(day1).toEqual([{ code: 'AS_SUSHI', term: CATEGORY_QUERY_TERMS.AS_SUSHI }]);
    // 没有搜索词的 code 不参与
    expect(discoveryQueries({ catalog, limit: 8 }).map((q) => q.code))
      .toEqual(['CN_HOTPOT', 'AS_SUSHI']);
  });

  it('「候选 → 分类」也有上限（每次都是 1 Details + 1 LLM）', async () => {
    const many = Array.from({ length: 30 }, (_, i) => candidateOf(`new-${i}`, `新店${i}`));
    const port = fakePort({
      discover: (q) => ({ query: q, candidates: many }),
      preview: (id) => previewOf(id, id, DM),
    });
    const result = await discoverNearby({ port, prefs: atDowntown(), now: T0 });
    expect(port.previewed).toHaveLength(DISCOVERY_PREVIEW_LIMIT);
    expect(result.discovered).toHaveLength(DISCOVERY_PREVIEW_LIMIT);
  });
});

describe('节制条款 ④：自动触发只刷新，不发现', () => {
  it('自动刷新不做任何类目搜索，即使调用方传 discover: true', async () => {
    const port = fakePort({ discover: (q) => ({ query: q, candidates: [candidateOf('x', '新店')] }) });
    const report = await runRefresh('auto', { port, prefs: atDowntown(), discover: true, now: T0 });
    expect(report).not.toBeNull();
    expect(port.queryRuns).toEqual([]);
    expect(port.previewed).toEqual([]);
    expect(report!.discovered).toEqual([]);
  });

  it('手动触发会发现（同一条流水线，区别只在触发方式）', async () => {
    const port = fakePort({
      discover: (q) => ({ query: q, candidates: [candidateOf('new-1', '新店一')] }),
    });
    const report = await runRefresh('manual', { port, prefs: atDowntown(), now: T0 });
    expect(port.queryRuns[0].length).toBeGreaterThan(0);
    expect(report!.discovered.map((d) => d.restaurant.placeId)).toEqual(['new-1']);
    expect(report!.discovered[0].viaCategory).not.toBe('');
  });

  it('落库的自动报告里即使被塞了候选，读回来也是空的', () => {
    const forged = sanitizeRefreshReport({
      id: 'r1', trigger: 'auto', startedAt: T0.toISOString(), finishedAt: T0.toISOString(),
      updated: [], needsAttention: [], failed: [], fetchCount: 0, unchanged: 0,
      discovered: [{ restaurant: { ...seed(0) }, viaCategory: 'CN_HOTPOT', distanceKm: 1 }],
    });
    expect(forged!.discovered).toEqual([]);
  });
});

/* ------------------------------------------------------------------ *
 * 4. 失败必须可见
 * ------------------------------------------------------------------ */

describe('失败必须可见', () => {
  it('单家抓失败：进 failed，不进 updated，其余照常更新', async () => {
    const [ok, bad] = [seed(0).placeId, seed(1).placeId];
    saveSelection([ok, bad]);
    const port = fakePort({
      details: (id) => (id === bad
        ? { placeId: id, error: '网络问题，下次再试' }
        : { placeId: id, details: detailsOf(seed(0), { rating: 4.1 }) }),
    });
    const result = await refreshExisting({ port, now: T0 });
    expect(result.failed).toEqual([
      { placeId: bad, name: seed(1).name, message: '网络问题，下次再试' },
    ]);
    expect(result.updated.map((d) => d.placeId)).toEqual([ok]);
    // 失败的那家 fetchedAt 不许前移，下次还得刷它
    expect(isStalePlace(bad, T0)).toBe(true);
  });

  it('整批挂掉（断网）：每一家都在 failed 里露面，不是一句「刷新失败」', async () => {
    const ids = [seed(0).placeId, seed(1).placeId, seed(2).placeId];
    saveSelection(ids);
    const port = fakePort({ detailsThrows: '连不上地图服务，稍后再试' });
    const result = await refreshExisting({ port, now: T0 });
    expect(result.failed.map((f) => f.placeId).sort()).toEqual([...ids].sort());
    expect(result.failed.every((f) => f.message === '连不上地图服务，稍后再试')).toBe(true);
    expect(result.fetchCount).toBe(ids.length);
    expect(result.updated).toEqual([]);
  });

  it('失败进了落库的报告，回看时还在', async () => {
    saveSelection([seed(0).placeId]);
    const port = fakePort({ details: (id) => ({ placeId: id, error: '配额用完了' }) });
    const report = await runRefresh('manual', { port, prefs: atDowntown(), now: T0 });
    expect(report!.failed).toHaveLength(1);
    const stored = recentRefreshReports();
    expect(stored[0].failed[0].message).toBe('配额用完了');
    expect(refreshCounts(stored[0]).failed).toBe(1);
  });

  it('发现阶段的失败也要露面：一个类目挂了不连坐，其余照常', async () => {
    const port = fakePort({
      discover: (q) => (q === CATEGORY_QUERY_TERMS.CN_HOTPOT
        ? { query: q, candidates: [], error: '这个类目没搜到' }
        : { query: q, candidates: [] }),
    });
    const result = await discoverNearby({ port, prefs: atDowntown(), now: T0 });
    const failed = result.failed.filter((f) => f.message === '这个类目没搜到');
    // 只有命中的那个类目失败（可能不在今天的轮转里，那就一条都没有）
    expect(failed.length).toBeLessThanOrEqual(1);
    for (const f of failed) expect(f.placeId).toMatch(/^query:/);
  });

  it('候选分类失败只丢那一家', async () => {
    const port = fakePort({
      discover: (q) => ({ query: q, candidates: [candidateOf('good', '好店'), candidateOf('boom', '坏店')] }),
      previewThrows: (id) => (id === 'boom' ? 'LLM 不可用' : null),
    });
    const result = await discoverNearby({ port, prefs: atDowntown(), now: T0 });
    expect(result.discovered.map((d) => d.restaurant.placeId)).toEqual(['good']);
    expect(result.failed).toEqual([{ placeId: 'boom', name: '坏店', message: 'LLM 不可用' }]);
  });

  it('每次对外抓取都记进既有的抓取台账（kind = refresh）', async () => {
    saveSelection([seed(0).placeId, seed(1).placeId]);
    await runRefresh('manual', { port: fakePort(), prefs: atDowntown(), now: T0 });
    const log = recentFetchLog();
    expect(log.length).toBeGreaterThanOrEqual(2);
    expect(log.every((e) => e.kind === 'refresh')).toBe(true);
    expect(log.filter((e) => e.placeId === seed(0).placeId)).toHaveLength(1);
  });
});

/* ------------------------------------------------------------------ *
 * 5. 绝不替用户做主
 * ------------------------------------------------------------------ */

describe('绝不替用户做主', () => {
  it('发现到的新店不入池、不进目录、不进归档', async () => {
    const before = effectiveSelection();
    const port = fakePort({
      discover: (q) => ({ query: q, candidates: [candidateOf('new-1', '新店一')] }),
    });
    const result = await discoverNearby({ port, prefs: atDowntown(), now: T0 });
    expect(result.discovered).not.toHaveLength(0);
    expect(effectiveSelection()).toEqual(before);
    expect(isInPool('new-1')).toBe(false);
    expect(archivedEntries()).toEqual([]);
  });

  it('永久停业只进「需要你确认」，不归档，而且照样摇得出来（ADR-0009）', async () => {
    const target = seed(0).placeId;
    saveSelection([target]);
    const port = fakePort({
      details: (id) => ({ placeId: id, details: detailsOf(seed(0), { businessStatus: 'CLOSED_PERMANENTLY' }) }),
    });
    const result = await refreshExisting({ port, now: T0 });
    expect(result.needsAttention).toEqual([{
      placeId: target, name: seed(0).name,
      businessStatus: 'CLOSED_PERMANENTLY', suggestedReason: 'closed_permanently',
    }]);
    expect(archivedEntries()).toEqual([]);
    setRadius('ALL');
    expect(poolRestaurants(atDowntown()).map((r) => r.placeId)).toContain(target);
  });

  it('状态没变但仍然不营业 → 还是要问（用户上次可能点了「先留着」）', async () => {
    const target = seed(0).placeId;
    saveSelection([target]);
    currentBackend().addToPool({
      restaurant: { ...seed(0), businessStatus: 'CLOSED_TEMPORARILY' },
      dishes: [], addedAt: T0.toISOString(),
    });
    const port = fakePort({
      details: (id) => ({ placeId: id, details: detailsOf(seed(0), { businessStatus: 'CLOSED_TEMPORARILY' }) }),
    });
    const result = await refreshExisting({ port, placeIds: [target], now: T0 });
    expect(result.updated).toEqual([]);
    expect(result.unchanged).toBe(1);
    expect(result.needsAttention.map((a) => a.placeId)).toEqual([target]);
  });

  it('已在目录/池子/归档里的 placeId 不算「新发现」', async () => {
    const known = seed(0).placeId;
    const archived = 'archived-1';
    archiveRestaurant(archived, 'manual', T0);
    addToSelection(['selected-1']);
    const port = fakePort({
      discover: (q) => ({
        query: q,
        candidates: [
          candidateOf(known, '已在目录'), candidateOf(archived, '已归档'),
          candidateOf('selected-1', '已在池子'), candidateOf('new-1', '真新店'),
        ],
      }),
      preview: (id) => previewOf(id, id, DM),
    });
    const result = await discoverNearby({ port, prefs: atDowntown(), now: T0 });
    expect(result.discovered.map((d) => d.restaurant.placeId)).toEqual(['new-1']);
  });

  it('Places 说永久停业的候选不作为新店推给用户', async () => {
    const port = fakePort({
      discover: (q) => ({
        query: q,
        candidates: [
          candidateOf('closed-1', '已停业', { businessStatus: 'CLOSED_PERMANENTLY' }),
          candidateOf('temp-1', '临时停业', { businessStatus: 'CLOSED_TEMPORARILY' }),
        ],
      }),
    });
    const result = await discoverNearby({ port, prefs: atDowntown(), now: T0 });
    expect(result.discovered.map((d) => d.restaurant.placeId)).toEqual(['temp-1']);
  });

  it('发现结果按半径过滤（超出当前半径的不列出）', async () => {
    const far = { lat: DM.lat + 0.9, lng: DM.lng };  // ≈ 100 km
    const port = fakePort({
      discover: (q) => ({ query: q, candidates: [candidateOf('near-1', '近的'), candidateOf('far-1', '远的')] }),
      preview: (id) => previewOf(id, id, id === 'far-1' ? far : DM),
    });
    const result = await discoverNearby({
      port, prefs: atDowntown({ radius: 'NEAR' }), now: T0,
    });
    expect(result.discovered.map((d) => d.restaurant.placeId)).toEqual(['near-1']);
    expect(result.discovered[0].distanceKm).toBeLessThan(5);
  });

  it('自定义半径覆盖档位（design/0009 §4.5 的 1–50 输入）', async () => {
    const at2km = { lat: DM.lat + 0.018, lng: DM.lng };
    const port = fakePort({
      discover: (q) => ({ query: q, candidates: [candidateOf('mid-1', '两公里外')] }),
      preview: (id) => previewOf(id, id, at2km),
    });
    const tight = await discoverNearby({ port, prefs: atDowntown(), withinKm: 1, now: T0 });
    expect(tight.discovered).toEqual([]);
    const loose = await discoverNearby({ port, prefs: atDowntown(), withinKm: 10, now: T0 });
    expect(loose.discovered.map((d) => d.restaurant.placeId)).toEqual(['mid-1']);
  });
});

/* ------------------------------------------------------------------ *
 * 6. 报告：形状、净化、本地持久化与按身份隔离
 * ------------------------------------------------------------------ */

function reportOf(over: Partial<RefreshReport> = {}): RefreshReport {
  return {
    id: 'rep-1', trigger: 'manual',
    startedAt: T0.toISOString(), finishedAt: T0.toISOString(),
    updated: [], discovered: [], needsAttention: [], failed: [],
    fetchCount: 0, unchanged: 0,
    ...over,
  };
}

describe('刷新报告的落库与净化', () => {
  it('本地后端：最近的在前，按身份隔离，有上限', () => {
    const backend = currentBackend();
    backend.appendRefreshReport(reportOf({ id: 'a' }));
    backend.appendRefreshReport(reportOf({ id: 'b' }));
    expect(backend.loadRefreshReports().map((r) => r.id)).toEqual(['b', 'a']);

    // 同 id 再写一次是覆盖，不是两条
    backend.appendRefreshReport(reportOf({ id: 'b', unchanged: 3 }));
    expect(backend.loadRefreshReports()).toHaveLength(2);
    expect(backend.loadRefreshReports()[0].unchanged).toBe(3);

    for (let i = 0; i < REFRESH_REPORT_LIMIT + 5; i++) {
      backend.appendRefreshReport(reportOf({ id: `x-${i}` }));
    }
    expect(backend.loadRefreshReports()).toHaveLength(REFRESH_REPORT_LIMIT);

    // 换一个 Profile：看不到上一个人的刷新历史
    const other = createProfile('另一个人', '🍜');
    setActiveProfile(other.id);
    expect(currentBackend().loadRefreshReports()).toEqual([]);
  });

  it('脏数据不带崩刷新历史', () => {
    expect(sanitizeRefreshReport(null)).toBeNull();
    expect(sanitizeRefreshReport({ trigger: 'manual' })).toBeNull();
    const cleaned = sanitizeRefreshReport({
      id: 'r', trigger: '乱写', startedAt: '不是时间', finishedAt: null,
      updated: [{ placeId: 'p', changes: [{ field: '不存在的字段' }, { field: 'rating', before: 4.5, after: 4.6 }] }, 42],
      discovered: [{ restaurant: { placeId: 'x' } }],
      needsAttention: ['垃圾'],
      failed: [{ placeId: 'p', name: 'n', message: 'm' }],
      fetchCount: -3, unchanged: 2.7,
    })!;
    expect(cleaned.trigger).toBe('manual');
    expect(cleaned.updated).toHaveLength(1);
    expect(cleaned.updated[0].changes).toEqual([{ field: 'rating', before: 4.5, after: 4.6 }]);
    expect(cleaned.updated[0].businessStatus).toBe('OPERATIONAL');
    expect(cleaned.discovered).toEqual([]);
    expect(cleaned.needsAttention).toEqual([]);
    expect(cleaned.failed).toHaveLength(1);
    expect(cleaned.fetchCount).toBe(0);
    expect(cleaned.unchanged).toBe(2);
  });

  it('同 id 的报告只留一份；非数组一律空', () => {
    expect(sanitizeRefreshReports('不是数组')).toEqual([]);
    expect(sanitizeRefreshReports([reportOf({ id: 'a' }), reportOf({ id: 'a' })])).toHaveLength(1);
  });

  it('canAutoRefresh 只看自动那几份', () => {
    expect(canAutoRefresh([], T0)).toBe(true);
    const manual = reportOf({ id: 'm', trigger: 'manual' });
    expect(canAutoRefresh([manual], T0)).toBe(true);
    const auto = reportOf({ id: 'a', trigger: 'auto' });
    expect(canAutoRefresh([auto], new Date(T0.getTime() + 1000))).toBe(false);
    expect(canAutoRefresh([auto], new Date(T0.getTime() + AUTO_REFRESH_MIN_INTERVAL_MS))).toBe(true);
    // 时间戳坏掉的那份不该把自动刷新永久卡死
    expect(canAutoRefresh([reportOf({ id: 'z', trigger: 'auto', startedAt: '坏' })], T0)).toBe(true);
  });

  it('报告落库失败不让「刷新成功」变成异常', async () => {
    const backend = currentBackend();
    const broken = {
      ...backend,
      appendRefreshReport() { throw new Error('存储满了'); },
    };
    setStoreBackend(broken);
    const report = await runRefresh('manual', { port: fakePort(), prefs: atDowntown(), now: T0 });
    expect(report).not.toBeNull();
  });
});

/* ------------------------------------------------------------------ *
 * 7. 驾车 / 步行时间估算
 * ------------------------------------------------------------------ */

describe('travelEstimate', () => {
  it('1.19 km 走路、1.21 km 开车（边界与 WALK 档位同一个阈值）', () => {
    expect(travelEstimate(1.19).mode).toBe('walk');
    expect(travelEstimate(1.21).mode).toBe('drive');
    expect(travelEstimate(WALK_MAX_KM).mode).toBe('drive');
    expect(travelEstimate(WALK_MAX_KM - 0.0001).mode).toBe('walk');
  });

  it('走路 = km × 12', () => {
    expect(travelEstimate(1).minutes).toBe(12);
    expect(travelEstimate(0.5).minutes).toBe(6);
  });

  it('开车 = km × DETOUR / SPEED × 60 + 停车', () => {
    const km = 5;
    expect(travelEstimate(km).minutes)
      .toBe(Math.round((km * DETOUR / SPEED_KMH) * 60 + PARKING_MIN));
    expect(travelEstimate(5.3).minutes).toBe(15);
  });

  it('同一种模式内距离越远分钟数单调不减', () => {
    // 跨模式**故意**不单调：走 1.19 km 要 14 分钟，开车 1.2 km 只要 6 分钟。
    // 这不是 bug，是「走路比开车慢」这件事本身；界面显示的是两种不同的模式。
    let walk = -1;
    let drive = -1;
    for (let km = 0; km <= 30; km += 0.1) {
      const { mode, minutes } = travelEstimate(km);
      if (mode === 'walk') {
        expect(minutes).toBeGreaterThanOrEqual(walk);
        walk = minutes;
      } else {
        expect(minutes).toBeGreaterThanOrEqual(drive);
        drive = minutes;
      }
    }
    expect(travelEstimate(1.19).minutes).toBeGreaterThan(travelEstimate(1.21).minutes);
  });

  it('脏输入不把 NaN 摆到界面上', () => {
    expect(travelEstimate(Number.NaN)).toEqual({ mode: 'walk', minutes: 0 });
    expect(travelEstimate(-5)).toEqual({ mode: 'walk', minutes: 0 });
    expect(travelEstimate(0)).toEqual({ mode: 'walk', minutes: 0 });
    expect(travelEstimate(Number.POSITIVE_INFINITY)).toEqual({ mode: 'walk', minutes: 0 });
  });

  it('一个中文字都不返回（文案由前端配合 i18n 出）', () => {
    expect(JSON.stringify([travelEstimate(0.8), travelEstimate(9)])).not.toMatch(/[一-鿿]/);
  });
});

/* ------------------------------------------------------------------ *
 * 8. 类目查询词表与 relevance 的耦合
 * ------------------------------------------------------------------ */

describe('类目查询词表', () => {
  it('每个词都被认成类目查询 —— 否则那个类目的候选会被整组误杀', () => {
    expect(nonCategoryTerms()).toEqual([]);
  });

  it('词表与 CATEGORY_OF 两边不许漂移', () => {
    expect(unknownQueryCodes()).toEqual([]);
    expect(codesWithoutQuery()).toEqual([]);
  });

  it('不带城市名（换个城市的用户也能用）', () => {
    for (const term of Object.values(CATEGORY_QUERY_TERMS)) {
      expect(term.toLowerCase()).not.toContain('markham');
      expect(term).not.toContain('万锦');
    }
  });
});

/* ------------------------------------------------------------------ *
 * 9. 与摇一摇同源：刷新之后摇得到新的事实
 * ------------------------------------------------------------------ */

describe('刷新改变的是摇一摇看到的东西', () => {
  it('刷完一家店，摇一摇拿到的是新事实（同一个 localizedPool）', async () => {
    const target = seed(0).placeId;
    saveSelection([target]);
    setRadius('ALL');
    const port = fakePort({
      details: (id) => ({
        placeId: id,
        details: detailsOf(seed(0), { rating: 2.2, name: '改过名的店', closedDays: [1, 2] }),
      }),
    });
    const report = await runRefresh('manual', { port, prefs: atDowntown(), now: T0 });

    const pool = localizedPool(atDowntown({ radius: 'ALL' }));
    const got = pool.restaurants.find((r) => r.placeId === target)!;
    expect(got.rating).toBe(2.2);
    expect(got.closedDays).toEqual([1, 2]);

    // 店名**刻意不覆盖**（创始人裁决 2026-09-28，见 mergeFacts 的注释）：
    // Places 的 displayName 随语言与格式漂移，悄悄冲掉人工校对过的名字
    // 是零决策价值的困惑。
    expect(got.name).toBe(seed(0).name);

    // 但改名必须**照样出现在报告里**，让用户自己判断要不要重新导入 ——
    // 「不自动应用」和「假装没发生」是两回事。
    const entry = report!.updated.find((u) => u.placeId === target)!;
    const nameChange = entry.changes.find((c) => c.field === 'name')!;
    expect(nameChange.before).toBe(seed(0).name);
    expect(nameChange.after).toBe('改过名的店');
  });
});
