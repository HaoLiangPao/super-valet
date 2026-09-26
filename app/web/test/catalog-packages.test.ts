import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ANCHORS, SEED_RESTAURANTS } from '../src/data/seed-restaurants';
import type { SeedRestaurant } from '../src/data/seed-restaurants';
import type { RestaurantPackage } from '../src/lib/catalog/types';

/**
 * 目录数据与套餐数据都由创始人那条线生成（`scripts/build-catalog.mjs` /
 * `build-packages.mjs`），本文件把它们换成**合成数据**：
 * 数据层的行为不能依赖某一版目录里恰好有哪几家店，否则目录一更新测试就红。
 */

const DM = ANCHORS.downtownMarkham;

/** 以第一家种子店为模板造合成餐厅，只改 placeId / 名字 / 坐标 */
function at(placeId: string, km: number, over: Partial<SeedRestaurant> = {}): SeedRestaurant {
  const base = SEED_RESTAURANTS[0];
  // 1° 纬度 ≈ 111.19km，正北方向偏移，横向不动
  return { ...base, placeId, name: `合成店 ${placeId}`, lat: DM.lat + km / 111.19, lng: DM.lng, ...over };
}

const NEARBY = at('syn-walk', 0.8);
const FARAWAY = at('syn-far', 20);
/** 与种子第一家同 placeId，用来验证「目录数据覆盖种子」 */
const SEED_OVERRIDE: SeedRestaurant = { ...SEED_RESTAURANTS[0], name: '15th Ave Cafe（目录版）' };

vi.mock('@/data/catalog', () => ({
  CATALOG: [SEED_OVERRIDE, NEARBY, FARAWAY],
}));

const PKG_A: RestaurantPackage = {
  id: 'cn_top',
  nameZh: '精选中餐',
  nameEn: 'Highly Rated Chinese',
  descZh: '人挑过的',
  descEn: 'hand picked',
  placeIds: [SEED_RESTAURANTS[0].placeId, NEARBY.placeId, FARAWAY.placeId],
};
const PKG_B: RestaurantPackage = {
  id: 'ws_value',
  nameZh: '高性价比西餐',
  nameEn: 'Best-Value Western',
  descZh: '便宜好吃',
  descEn: 'cheap and good',
  placeIds: [NEARBY.placeId, NEARBY.placeId],
};

vi.mock('@/data/packages', () => ({
  PRESET_PACKAGES: [PKG_A, PKG_B],
}));

const { allCatalog, findInCatalog } = await import('../src/lib/catalog/catalog');
const { localizedPool } = await import('../src/lib/catalog/localize');
const { allPackages, findPackage, packageStats } = await import('../src/lib/catalog/packages');
const {
  SEED_PLACE_IDS, applyPackage, effectiveSelection, removeFromSelection, saveSelection,
} = await import('../src/lib/catalog/selection');
const { defaultLocationPrefs } = await import('../src/lib/catalog/types');
const { createProfile, setActiveProfile } = await import('../src/lib/profiles/profiles');
const { setStoreBackend } = await import('../src/lib/store/backend');

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

beforeEach(() => {
  globalThis.localStorage = createStorageShim();
  setActiveProfile(createProfile('测试', '🍚').id);
});

afterEach(() => {
  setStoreBackend(null);
});

describe('目录 = 种子 ∪ 静态目录', () => {
  it('静态目录的店进目录，且同 placeId 覆盖种子', () => {
    expect(allCatalog()).toHaveLength(SEED_RESTAURANTS.length + 2);
    expect(findInCatalog(NEARBY.placeId)?.name).toBe(NEARBY.name);
    expect(findInCatalog(SEED_RESTAURANTS[0].placeId)?.name).toBe('15th Ave Cafe（目录版）');
  });

  it('目录变大不会自动改变任何人的池子（ADR-0008 的核心分离）', () => {
    expect(effectiveSelection()).toEqual(SEED_PLACE_IDS);
    expect(localizedPool().restaurants).toHaveLength(15);
    expect(localizedPool().restaurants.map((r) => r.placeId)).not.toContain(NEARBY.placeId);
  });
});

describe('套餐', () => {
  it('packageStats：共 N 家 · 你已有 M 家（N 去重）', () => {
    expect(allPackages()).toHaveLength(2);
    expect(findPackage('cn_top')?.nameZh).toBe('精选中餐');
    expect(findPackage('nope')).toBeNull();

    // 默认池子里只有种子第一家，合成的两家不在
    expect(packageStats(PKG_A)).toEqual({ total: 3, alreadyInPool: 1 });
    expect(packageStats(PKG_B)).toEqual({ total: 1, alreadyInPool: 0 });
  });

  it('加入套餐 → 池子变大，只加缺的那几家', () => {
    const before = effectiveSelection().length;
    const res = applyPackage('cn_top');
    expect(res.added).toBe(2);
    expect(res.selection).toHaveLength(before + 2);
    expect(localizedPool().restaurants).toHaveLength(17);
    expect(packageStats(PKG_A)).toEqual({ total: 3, alreadyInPool: 3 });
  });

  it('再加一次不重复；加入后仍可单独移除其中一家', () => {
    applyPackage('cn_top');
    expect(applyPackage('cn_top').added).toBe(0);

    removeFromSelection(FARAWAY.placeId);
    expect(effectiveSelection()).toHaveLength(16);
    expect(effectiveSelection()).toContain(NEARBY.placeId);
    expect(effectiveSelection()).not.toContain(FARAWAY.placeId);
    expect(packageStats(PKG_A)).toEqual({ total: 3, alreadyInPool: 2 });
  });

  it('套餐 id 不存在 → 什么都不发生', () => {
    const res = applyPackage('no-such-package');
    expect(res.added).toBe(0);
    expect(res.selection).toEqual(SEED_PLACE_IDS);
  });

  it('从空池子加套餐：冷启动一键可用', () => {
    saveSelection([]);
    const res = applyPackage('ws_value');
    expect(res.added).toBe(1);
    expect(localizedPool().restaurants.map((r) => r.placeId)).toEqual([NEARBY.placeId]);
  });
});

describe('半径过滤（合成坐标，距离完全可控）', () => {
  it('0.8km 的店留在 WALK 里，20km 的店被挡掉并计入 filteredOut', () => {
    saveSelection([NEARBY.placeId, FARAWAY.placeId]);

    const walk = localizedPool({ ...defaultLocationPrefs(), radius: 'WALK' });
    expect(walk.restaurants.map((r) => r.placeId)).toEqual([NEARBY.placeId]);
    expect(walk.restaurants[0].distanceKm).toBe(0.8);
    expect(walk.restaurants[0].bucket).toBe('WALK');
    expect(walk.filteredOut).toBe(1);

    const mid = localizedPool({ ...defaultLocationPrefs(), radius: 'MID' });
    expect(mid.filteredOut).toBe(1);

    const all = localizedPool({ ...defaultLocationPrefs(), radius: 'ALL' });
    expect(all.restaurants).toHaveLength(2);
    expect(all.filteredOut).toBe(0);
    expect(all.restaurants[1].distanceKm).toBe(20);
    expect(all.restaurants[1].bucket).toBe('FAR');
  });
});
