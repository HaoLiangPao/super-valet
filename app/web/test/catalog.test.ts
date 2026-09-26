import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ANCHORS, SEED_RESTAURANTS, haversineKm, toBucket } from '../src/data/seed-restaurants';
import { allCatalog, findInCatalog, isInCatalog } from '../src/lib/catalog/catalog';
import {
  ANCHOR_LIST, DEFAULT_ANCHOR, GPS_MAX_AGE_MS, clearGps, loadLocationPrefs, requestGps,
  resolveLocation, saveLocationPrefs, setAnchor, setRadius,
} from '../src/lib/catalog/location';
import { localizedPool, poolRestaurants } from '../src/lib/catalog/localize';
import { allPackages, packageStats } from '../src/lib/catalog/packages';
import {
  SEED_PLACE_IDS, addToSelection, applyPackage, effectiveSelection, isSelected, loadSelection,
  removeFromSelection, resetSelection, saveSelection,
} from '../src/lib/catalog/selection';
import { DEFAULT_RADIUS, defaultLocationPrefs } from '../src/lib/catalog/types';
import type { LocationPrefs, RadiusOption } from '../src/lib/catalog/types';
import { eligible, rollOnce } from '../src/lib/engine/engine';
import { seededRng } from '../src/lib/engine/random';
import { DINNER, emptyState, epochDay } from '../src/lib/engine/types';
import { createProfile, setActiveProfile } from '../src/lib/profiles/profiles';
import { setStoreBackend } from '../src/lib/store/backend';

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
const MV = ANCHORS.markhamVillage;

/** Downtown Markham 锚点；测试里不依赖「默认值恰好是它」这件事，显式写出来 */
function atDowntown(over: Partial<LocationPrefs> = {}): LocationPrefs {
  return {
    ...defaultLocationPrefs(),
    source: { kind: 'anchor', id: 'downtownMarkham', lat: DM.lat, lng: DM.lng },
    ...over,
  };
}

function withRadius(radius: RadiusOption): LocationPrefs {
  return atDowntown({ radius });
}

function kmFrom(at: { lat: number; lng: number }, placeId: string): number {
  const r = SEED_RESTAURANTS.find((x) => x.placeId === placeId)!;
  return haversineKm(at.lat, at.lng, r.lat, r.lng);
}

/** 实测过的边界样本（种子数据 + Downtown Markham 锚点） */
const SUSHI_UMI = 'ChIJk9HrBBXV1IkRbJCRb3lYFVk';   // DM 1.16km → WALK 边界内
const SUNG_WON = 'ChIJCSVLKujV1IkRE2jQGIG9xFA';    // DM 1.21km → WALK 边界外
const CAFE_15TH = 'ChIJ9UdHvp7V1IkRrzDFGuV0VBM';   // DM 0.49km / MV 5.84km

beforeEach(() => {
  globalThis.localStorage = createStorageShim();
  const p = createProfile('测试', '🍚');
  setActiveProfile(p.id);
});

afterEach(() => {
  setStoreBackend(null);
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/* ------------------------------------------------------------------ *
 * 1. 向后兼容 —— 本轮最重要的一条（ADR-0008）
 * ------------------------------------------------------------------ */

describe('没有选择记录 → 池子就是原来的 15 家种子', () => {
  it('loadSelection() 是 null，但生效的选择是 15 个种子 placeId', () => {
    expect(loadSelection()).toBeNull();
    expect(effectiveSelection()).toEqual(SEED_RESTAURANTS.map((r) => r.placeId));
    expect(SEED_PLACE_IDS).toHaveLength(15);
  });

  it('本地化池子 = 15 家，一家不多一家不少（默认半径不限）', () => {
    const pool = localizedPool();
    expect(pool.restaurants).toHaveLength(SEED_RESTAURANTS.length);
    expect(new Set(pool.restaurants.map((r) => r.placeId)))
      .toEqual(new Set(SEED_RESTAURANTS.map((r) => r.placeId)));
    expect(pool.filteredOut).toBe(0);
    expect(DEFAULT_RADIUS).toBe('ALL');
  });

  it('目录 ⊇ 种子；CATALOG 还没生成时目录就等于种子', () => {
    for (const r of SEED_RESTAURANTS) expect(isInCatalog(r.placeId)).toBe(true);
    expect(allCatalog().length).toBeGreaterThanOrEqual(SEED_RESTAURANTS.length);
    expect(findInCatalog(CAFE_15TH)?.name).toBe('15th Ave Cafe & Bistro');
  });

  it('引擎照常吃这份列表（ADR-0008 决策 2 的前提：引擎一行不改）', () => {
    const state = emptyState();
    const day = epochDay(new Date('2026-09-28T18:30:00'));
    const weekday = new Date('2026-09-28T18:30:00').getDay();
    const restaurants = poolRestaurants(atDowntown());
    expect(eligible(restaurants, state, DINNER, weekday).length).toBeGreaterThan(0);
    const result = rollOnce(restaurants, state, DINNER, day, weekday, new Set(), seededRng(7));
    expect(result).not.toBeNull();
    expect(restaurants.some((r) => r.placeId === result!.pick.placeId)).toBe(true);
  });
});

/* ------------------------------------------------------------------ *
 * 2. 池子可增可删
 * ------------------------------------------------------------------ */

describe('selection 增删', () => {
  it('老用户第一次加店：15 家原封不动地落成显式记录，再 +1', () => {
    const next = addToSelection(['new-place-1']);
    expect(next).toHaveLength(16);
    expect(next.slice(0, 15)).toEqual(SEED_PLACE_IDS);
    expect(loadSelection()).toHaveLength(16);
    expect(isSelected('new-place-1')).toBe(true);
  });

  it('重复加入是幂等的', () => {
    addToSelection([SEED_PLACE_IDS[0], 'x']);
    const again = addToSelection(['x', 'x']);
    expect(again.filter((id) => id === 'x')).toHaveLength(1);
    expect(again).toHaveLength(16);
  });

  it('移除单家 → 只少那一家，其余顺序不变', () => {
    const removed = removeFromSelection(SEED_PLACE_IDS[3]);
    expect(removed).toHaveLength(14);
    expect(removed).toEqual(SEED_PLACE_IDS.filter((id) => id !== SEED_PLACE_IDS[3]));
    expect(localizedPool().restaurants.map((r) => r.placeId)).not.toContain(SEED_PLACE_IDS[3]);
    expect(localizedPool().restaurants).toHaveLength(14);
  });

  it('删光 ≠ 没选过：显式清空之后不会自己弹回 15 家', () => {
    saveSelection([]);
    expect(loadSelection()).toEqual([]);
    expect(effectiveSelection()).toEqual([]);
    expect(localizedPool().restaurants).toHaveLength(0);
  });

  it('resetSelection() 回到「跟着种子走」', () => {
    saveSelection(['only-one']);
    resetSelection();
    expect(loadSelection()).toBeNull();
    expect(effectiveSelection()).toEqual(SEED_PLACE_IDS);
  });

  it('脏数据（非字符串 / 重复）在读写两端都被清掉', () => {
    saveSelection(['a', 'a', '', 'b'] as string[]);
    expect(loadSelection()).toEqual(['a', 'b']);
  });

  it('选择里指向目录里没有的店 → 跳过，且不计进 filteredOut', () => {
    saveSelection([SEED_PLACE_IDS[0], 'ghost-place']);
    const pool = localizedPool(atDowntown());
    expect(pool.restaurants.map((r) => r.placeId)).toEqual([SEED_PLACE_IDS[0]]);
    expect(pool.filteredOut).toBe(0);
  });
});

/* ------------------------------------------------------------------ *
 * 3. 距离按当前位置重算（ADR-0008 决策 2）
 * ------------------------------------------------------------------ */

describe('距离重算', () => {
  it('同一家店在两个位置下的 distanceKm / bucket 不同且数值正确', () => {
    const atMV: LocationPrefs = {
      ...defaultLocationPrefs(),
      source: { kind: 'anchor', id: 'markhamVillage', lat: MV.lat, lng: MV.lng },
    };

    const dm = localizedPool(atDowntown()).restaurants.find((r) => r.placeId === CAFE_15TH)!;
    const mv = localizedPool(atMV).restaurants.find((r) => r.placeId === CAFE_15TH)!;

    // 硬编码的期望值来自独立计算，不是把实现算出来的数抄回来
    expect(dm.distanceKm).toBe(0.5);
    expect(dm.bucket).toBe('WALK');
    expect(mv.distanceKm).toBe(5.8);
    expect(mv.bucket).toBe('MID');
  });

  it('每一家的 distanceKm / bucket 都与 haversine + toBucket 对得上', () => {
    for (const r of localizedPool(atDowntown()).restaurants) {
      const km = kmFrom(DM, r.placeId);
      expect(r.distanceKm).toBe(Math.round(km * 10) / 10);
      expect(r.bucket).toBe(toBucket(km));
    }
  });

  it('只动 distanceKm / bucket，其它字段原样（引擎其余逻辑不受影响）', () => {
    const base = SEED_RESTAURANTS.find((r) => r.placeId === CAFE_15TH)!;
    const localized = localizedPool(atDowntown()).restaurants.find((r) => r.placeId === CAFE_15TH)!;
    expect({ ...localized, distanceKm: 0, bucket: 'WALK' })
      .toEqual({ ...base, distanceKm: 0, bucket: 'WALK' });
  });

  it('usedLocation 报的是真正用来算的那个点', () => {
    const pool = localizedPool(atDowntown());
    expect(pool.usedLocation.label).toBe('anchor');
    expect(pool.usedLocation.lat).toBe(DM.lat);
    expect(pool.usedLocation.lng).toBe(DM.lng);
  });
});

/* ------------------------------------------------------------------ *
 * 4. 半径硬过滤
 * ------------------------------------------------------------------ */

describe('半径过滤', () => {
  it('ALL 不过滤', () => {
    const pool = localizedPool(withRadius('ALL'));
    expect(pool.restaurants).toHaveLength(15);
    expect(pool.filteredOut).toBe(0);
  });

  it('WALK 只剩 1.2km 内，且留下的正好是 bucket === WALK 的那些', () => {
    const pool = localizedPool(withRadius('WALK'));
    const expectedIds = SEED_RESTAURANTS
      .filter((r) => haversineKm(DM.lat, DM.lng, r.lat, r.lng) < 1.2)
      .map((r) => r.placeId);

    expect(pool.restaurants.map((r) => r.placeId)).toEqual(expectedIds);
    expect(pool.restaurants.length).toBeGreaterThan(0);
    expect(pool.restaurants.length).toBeLessThan(SEED_RESTAURANTS.length);
    for (const r of pool.restaurants) {
      expect(r.distanceKm).toBeLessThanOrEqual(1.2);
      expect(r.bucket).toBe('WALK');
    }
  });

  it('filteredOut = 池子里被半径挡掉的家数', () => {
    for (const radius of ['WALK', 'NEAR', 'MID', 'ALL'] as RadiusOption[]) {
      const pool = localizedPool(withRadius(radius));
      expect(pool.restaurants.length + pool.filteredOut).toBe(SEED_RESTAURANTS.length);
    }
  });

  it('边界：1.16km 的店在 WALK 里，1.21km 的店被挡掉、但在 NEAR 里回来', () => {
    expect(kmFrom(DM, SUSHI_UMI)).toBeLessThan(1.2);
    expect(kmFrom(DM, SUNG_WON)).toBeGreaterThan(1.2);

    const walk = localizedPool(withRadius('WALK')).restaurants.map((r) => r.placeId);
    expect(walk).toContain(SUSHI_UMI);
    expect(walk).not.toContain(SUNG_WON);

    const near = localizedPool(withRadius('NEAR')).restaurants.map((r) => r.placeId);
    expect(near).toContain(SUNG_WON);
  });

  it('换位置后同一个半径筛出来的是另一批店', () => {
    const atMV: LocationPrefs = {
      ...defaultLocationPrefs(),
      radius: 'NEAR',
      source: { kind: 'anchor', id: 'markhamVillage', lat: MV.lat, lng: MV.lng },
    };
    const dmIds = localizedPool(withRadius('NEAR')).restaurants.map((r) => r.placeId);
    const mvIds = localizedPool(atMV).restaurants.map((r) => r.placeId);
    expect(mvIds).not.toEqual(dmIds);
  });
});

/* ------------------------------------------------------------------ *
 * 5. 位置降级链（design/0006 §4.3）
 * ------------------------------------------------------------------ */

describe('位置降级链：GPS → lastGps → 当前锚点 → 默认锚点', () => {
  const NOW = 1_800_000_000_000;

  it('① 15 分钟内的 GPS 直接用', () => {
    const prefs: LocationPrefs = {
      source: { kind: 'gps', lat: 43.9, lng: -79.4, accuracy: 30, ts: NOW - 60_000 },
      radius: 'ALL',
      lastGps: { lat: 43.7, lng: -79.2, ts: NOW - 60_000 },
    };
    const at = resolveLocation(prefs, NOW);
    expect(at).toMatchObject({ lat: 43.9, lng: -79.4, label: 'gps', via: 'gps' });
  });

  it('② GPS 过期 → 退到 lastGps（更新的那个点）', () => {
    const prefs: LocationPrefs = {
      source: { kind: 'gps', lat: 43.9, lng: -79.4, accuracy: 30, ts: NOW - GPS_MAX_AGE_MS - 1 },
      radius: 'ALL',
      lastGps: { lat: 43.7, lng: -79.2, ts: NOW - 60_000 },
    };
    const at = resolveLocation(prefs, NOW);
    expect(at).toMatchObject({ lat: 43.7, lng: -79.2, label: 'gps', via: 'lastGps' });
  });

  it('② GPS 过期且没有更新的 lastGps → 仍然用上次的坐标，不给空', () => {
    const prefs: LocationPrefs = {
      source: { kind: 'gps', lat: 43.9, lng: -79.4, accuracy: 30, ts: NOW - GPS_MAX_AGE_MS - 1 },
      radius: 'ALL',
      lastGps: null,
    };
    expect(resolveLocation(prefs, NOW)).toMatchObject({ lat: 43.9, lng: -79.4, via: 'lastGps' });
  });

  it('③ 用户选了锚点 → 用锚点，即使手上有 lastGps 也不用（那是他的选择）', () => {
    const prefs: LocationPrefs = {
      source: { kind: 'anchor', id: 'unionville', lat: 0, lng: 0 },
      radius: 'ALL',
      lastGps: { lat: 43.7, lng: -79.2, ts: NOW },
    };
    const at = resolveLocation(prefs, NOW);
    // 坐标以锚点表为准，不信记录里抄错的那一份
    expect(at.lat).toBe(ANCHORS.unionville.lat);
    expect(at.label).toBe('anchor');
    expect(at.via).toBe('anchor');
    expect(at.anchor?.id).toBe('unionville');
  });

  it('③ 锚点 id 认不出来 → 用记录里的坐标兜底，不崩不空', () => {
    const prefs: LocationPrefs = {
      source: { kind: 'anchor', id: 'mars-base', lat: 43.5, lng: -79.5 },
      radius: 'ALL',
      lastGps: null,
    };
    expect(resolveLocation(prefs, NOW)).toMatchObject({ lat: 43.5, lng: -79.5, via: 'anchor' });
  });

  it('④ 什么都没设过 → 默认锚点 Downtown Markham', () => {
    const at = resolveLocation(defaultLocationPrefs(), NOW);
    expect(at).toMatchObject({ lat: DM.lat, lng: DM.lng, label: 'anchor', via: 'defaultAnchor' });
    expect(DEFAULT_ANCHOR.id).toBe('downtownMarkham');
    expect(ANCHOR_LIST).toHaveLength(3);
  });

  it('④ 没设过来源但用过定位 → 上次成功的位置优先于默认锚点', () => {
    const prefs: LocationPrefs = { source: null, radius: 'ALL', lastGps: { lat: 43.7, lng: -79.2, ts: NOW } };
    expect(resolveLocation(prefs, NOW)).toMatchObject({ lat: 43.7, via: 'lastGps' });
  });

  it('降级链的任何一环都不给空池子', () => {
    const chain: LocationPrefs[] = [
      { source: { kind: 'gps', lat: DM.lat, lng: DM.lng, accuracy: 20, ts: NOW }, radius: 'ALL', lastGps: null },
      { source: { kind: 'gps', lat: DM.lat, lng: DM.lng, accuracy: 20, ts: 0 }, radius: 'ALL', lastGps: { lat: DM.lat, lng: DM.lng, ts: NOW } },
      { source: { kind: 'anchor', id: 'markhamVillage', lat: MV.lat, lng: MV.lng }, radius: 'ALL', lastGps: null },
      defaultLocationPrefs(),
    ];
    for (const prefs of chain) {
      expect(localizedPool(prefs).restaurants.length).toBe(15);
    }
  });
});

describe('requestGps —— 只在显式调用时才碰权限', () => {
  function stubGeolocation(impl: Partial<Geolocation>): void {
    vi.stubGlobal('navigator', { geolocation: impl as Geolocation });
  }

  it('成功：写进 source 与 lastGps，之后 resolveLocation 走 GPS 档', async () => {
    const ts = Date.now();
    stubGeolocation({
      getCurrentPosition: (ok) => {
        (ok as PositionCallback)({
          coords: { latitude: 43.77, longitude: -79.41, accuracy: 42 },
          timestamp: ts,
        } as GeolocationPosition);
      },
    });

    const res = await requestGps();
    expect(res.ok).toBe(true);
    const prefs = loadLocationPrefs();
    expect(prefs.source).toMatchObject({ kind: 'gps', lat: 43.77, lng: -79.41, accuracy: 42 });
    expect(prefs.lastGps).toMatchObject({ lat: 43.77, lng: -79.41 });
    expect(resolveLocation(prefs, ts).via).toBe('gps');
  });

  it('被拒绝：一个字都不改，位置沿降级链退到 lastGps', async () => {
    saveLocationPrefs({ source: null, radius: 'NEAR', lastGps: { lat: 43.7, lng: -79.2, ts: 123 } });
    stubGeolocation({
      getCurrentPosition: (_ok, fail) => {
        (fail as PositionErrorCallback)({ code: 1, message: 'denied' } as GeolocationPositionError);
      },
    });

    const res = await requestGps();
    expect(res).toMatchObject({ ok: false, reason: 'denied' });
    const prefs = loadLocationPrefs();
    expect(prefs.source).toBeNull();
    expect(prefs.radius).toBe('NEAR');
    expect(resolveLocation(prefs, 200).via).toBe('lastGps');
  });

  it('超时 / 定位不可用 / 浏览器不支持，各自有名字', async () => {
    stubGeolocation({
      getCurrentPosition: (_ok, fail) => {
        (fail as PositionErrorCallback)({ code: 3, message: 'timeout' } as GeolocationPositionError);
      },
    });
    expect(await requestGps()).toMatchObject({ ok: false, reason: 'timeout' });

    stubGeolocation({
      getCurrentPosition: (_ok, fail) => {
        (fail as PositionErrorCallback)({ code: 2, message: 'unavailable' } as GeolocationPositionError);
      },
    });
    expect(await requestGps()).toMatchObject({ ok: false, reason: 'unavailable' });

    vi.stubGlobal('navigator', {});
    expect(await requestGps()).toMatchObject({ ok: false, reason: 'unsupported' });
  });

  it('失败之后位置沿降级链退到默认锚点（既没 source 也没 lastGps）', async () => {
    vi.stubGlobal('navigator', {});
    const res = await requestGps();
    expect(res.ok).toBe(false);
    expect(localizedPool().restaurants).toHaveLength(15);
    expect(localizedPool().usedLocation.label).toBe('anchor');
  });
});

describe('位置偏好读写', () => {
  it('setAnchor / setRadius / clearGps 各自只动自己那一块', () => {
    setRadius('MID');
    setAnchor('unionville');
    const prefs = loadLocationPrefs();
    expect(prefs.radius).toBe('MID');
    expect(prefs.source).toMatchObject({ kind: 'anchor', id: 'unionville' });

    saveLocationPrefs({ ...prefs, source: { kind: 'gps', lat: 1, lng: 2, accuracy: 3, ts: 4 } });
    expect(loadLocationPrefs().source?.kind).toBe('gps');
    expect(clearGps().source).toBeNull();
    expect(loadLocationPrefs().radius).toBe('MID');
  });

  it('存进来的脏偏好被清洗成合法值（半径词表之外的一律回 ALL）', () => {
    saveLocationPrefs({ source: null, radius: 'TELEPORT' as RadiusOption, lastGps: null });
    expect(loadLocationPrefs().radius).toBe('ALL');
  });

  it('没设过 → defaultLocationPrefs()', () => {
    expect(loadLocationPrefs()).toEqual(defaultLocationPrefs());
  });
});

/* ------------------------------------------------------------------ *
 * 6. 身份隔离（游客态）
 * ------------------------------------------------------------------ */

describe('两个 Profile 的 selection / 位置互不可见', () => {
  it('A 改了池子与半径，B 看到的还是默认', () => {
    const a = createProfile('A', '🥩');
    const b = createProfile('B', '🍣');

    setActiveProfile(a.id);
    addToSelection(['a-only']);
    removeFromSelection(SEED_PLACE_IDS[0]);
    setRadius('WALK');
    expect(effectiveSelection()).toHaveLength(15);
    expect(effectiveSelection()).toContain('a-only');

    setActiveProfile(b.id);
    expect(loadSelection()).toBeNull();
    expect(effectiveSelection()).toEqual(SEED_PLACE_IDS);
    expect(loadLocationPrefs().radius).toBe('ALL');

    setActiveProfile(a.id);
    expect(effectiveSelection()).toContain('a-only');
    expect(loadLocationPrefs().radius).toBe('WALK');
  });
});

/* ------------------------------------------------------------------ *
 * 7. 真实目录 / 套餐数据的完整性（不 mock；数据由创始人那条线生成）
 * ------------------------------------------------------------------ */

describe('真实目录与套餐数据', () => {
  it('目录包含全部种子，且不小于种子规模', () => {
    const ids = new Set(allCatalog().map((r) => r.placeId));
    for (const r of SEED_RESTAURANTS) expect(ids.has(r.placeId)).toBe(true);
    expect(ids.size).toBeGreaterThanOrEqual(SEED_RESTAURANTS.length);
  });

  it('每个套餐的成员都真的在目录里', () => {
    const inCatalog = new Set(allCatalog().map((r) => r.placeId));
    for (const pkg of allPackages()) {
      const missing = pkg.placeIds.filter((id) => !inCatalog.has(id));
      // 目录里没有的成员 = UI 显示「共 N 家」但加进池子只多了 N-k 家
      expect({ pkg: pkg.id, missing }).toEqual({ pkg: pkg.id, missing: [] });
    }
  });

  it('加入每一个真实套餐后，池子变大且引擎照常摇得出结果', () => {
    for (const pkg of allPackages()) {
      resetSelection();
      const before = effectiveSelection().length;
      const res = applyPackage(pkg.id);
      expect(res.selection.length).toBeGreaterThanOrEqual(before);
      expect(packageStats(pkg).alreadyInPool).toBe(packageStats(pkg).total);

      const restaurants = poolRestaurants(atDowntown());
      const day = epochDay(new Date('2026-09-28T18:30:00'));
      const weekday = new Date('2026-09-28T18:30:00').getDay();
      expect(rollOnce(restaurants, emptyState(), DINNER, day, weekday, new Set(), seededRng(3)))
        .not.toBeNull();
    }
  });
});
