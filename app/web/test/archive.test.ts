import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ANCHORS, SEED_RESTAURANTS } from '../src/data/seed-restaurants';
import {
  archiveRestaurant, archiveSize, archivedEntries, archivedEntry, archivedPlaceIds,
  archivedRestaurants, forgetArchived, isArchived, poolWithArchived, restoreFromArchive,
} from '../src/lib/catalog/archive';
import {
  businessStatusOf, isOperational, sanitizeArchive, suggestedReason, toArchiveReason,
  toBusinessStatus, unavailableIn,
} from '../src/lib/catalog/availability';
import type { CatalogRestaurant } from '../src/lib/catalog/availability';
import { localizedPool, poolRestaurants } from '../src/lib/catalog/localize';
import { setRadius } from '../src/lib/catalog/location';
import {
  SEED_PLACE_IDS, addToSelection, effectiveSelection, removeFromSelection, saveSelection,
} from '../src/lib/catalog/selection';
import { defaultLocationPrefs } from '../src/lib/catalog/types';
import type { LocationPrefs } from '../src/lib/catalog/types';
import { eligible } from '../src/lib/engine/engine';
import { DINNER, emptyState } from '../src/lib/engine/types';
import { createProfile, profileKey, setActiveProfile } from '../src/lib/profiles/profiles';
import { currentBackend, setStoreBackend } from '../src/lib/store/backend';

/**
 * 可用性与归档（ADR-0009）。
 *
 * 这一组测试锁死的是**语义区分**，不是实现细节：
 *   归档 ≠ 移除            —— 归档不动 selection，恢复是无损往返
 *   归档 ≠ 超出半径        —— 归档的店不计进 filteredOut
 *   businessStatus ≠ 归档  —— 显示「永久停业」也照样摇得出来，永不自动归档
 *   统计 ⊇ 归档            —— 十年老店倒闭后不该从「你最爱的餐厅」里凭空消失
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

function atDowntown(over: Partial<LocationPrefs> = {}): LocationPrefs {
  return {
    ...defaultLocationPrefs(),
    source: { kind: 'anchor', id: 'downtownMarkham', lat: DM.lat, lng: DM.lng },
    ...over,
  };
}

/** 把一家种子店「重新导入」成带可用性状态的版本（导入记录覆盖静态目录） */
function importWithStatus(placeId: string, businessStatus: CatalogRestaurant['businessStatus']): void {
  const base = SEED_RESTAURANTS.find((r) => r.placeId === placeId)!;
  currentBackend().addToPool({
    restaurant: { ...base, ...(businessStatus ? { businessStatus } : {}) },
    dishes: [],
    addedAt: '2026-09-27T00:00:00.000Z',
  });
}

let profileId = '';

beforeEach(() => {
  globalThis.localStorage = createStorageShim();
  const p = createProfile('测试', '🍚');
  setActiveProfile(p.id);
  profileId = p.id;
});

afterEach(() => {
  setStoreBackend(null);
});

/* ------------------------------------------------------------------ *
 * 1. businessStatus：未知一律 OPERATIONAL
 * ------------------------------------------------------------------ */

describe('可用性状态：缺失一律按 OPERATIONAL', () => {
  it('既有数据（15 家种子）没有这个字段 → OPERATIONAL', () => {
    for (const r of SEED_RESTAURANTS) {
      expect(businessStatusOf(r)).toBe('OPERATIONAL');
      expect(isOperational(r)).toBe(true);
    }
  });

  it('undefined / null / 脏值 / Places 日后新增的枚举 → OPERATIONAL', () => {
    for (const raw of [undefined, null, '', 'closed', 'CLOSED', 42, {}, 'BUSINESS_STATUS_UNSPECIFIED']) {
      expect(toBusinessStatus(raw)).toBe('OPERATIONAL');
    }
  });

  it('三个合法值原样通过', () => {
    expect(toBusinessStatus('OPERATIONAL')).toBe('OPERATIONAL');
    expect(toBusinessStatus('CLOSED_TEMPORARILY')).toBe('CLOSED_TEMPORARILY');
    expect(toBusinessStatus('CLOSED_PERMANENTLY')).toBe('CLOSED_PERMANENTLY');
  });

  it('unavailableIn 只挑出非 OPERATIONAL 的（其余一家不漏）', () => {
    const list: CatalogRestaurant[] = [
      SEED_RESTAURANTS[0],
      { ...SEED_RESTAURANTS[1], businessStatus: 'CLOSED_PERMANENTLY' },
      { ...SEED_RESTAURANTS[2], businessStatus: 'CLOSED_TEMPORARILY' },
      { ...SEED_RESTAURANTS[3], businessStatus: 'OPERATIONAL' },
    ];
    expect(unavailableIn(list).map((r) => r.placeId))
      .toEqual([SEED_RESTAURANTS[1].placeId, SEED_RESTAURANTS[2].placeId]);
  });

  it('归档原因按当下看到的状态推断', () => {
    expect(suggestedReason('CLOSED_PERMANENTLY')).toBe('closed_permanently');
    expect(suggestedReason('CLOSED_TEMPORARILY')).toBe('closed_temporarily');
    expect(suggestedReason('OPERATIONAL')).toBe('manual');
  });
});

/* ------------------------------------------------------------------ *
 * 2. 永不自动归档 —— 本轮最要紧的一条（ADR-0009）
 * ------------------------------------------------------------------ */

describe('永不自动归档', () => {
  it('显示「永久停业」的店照样摇得出来，直到用户自己确认', () => {
    const placeId = SEED_PLACE_IDS[0];
    importWithStatus(placeId, 'CLOSED_PERMANENTLY');

    const pool = localizedPool(atDowntown());
    expect(pool.restaurants).toHaveLength(15);
    expect(pool.restaurants.some((r) => r.placeId === placeId)).toBe(true);
    expect(isArchived(placeId)).toBe(false);
    expect(archiveSize()).toBe(0);

    // 用户确认之后才消失
    archiveRestaurant(placeId);
    expect(localizedPool(atDowntown()).restaurants).toHaveLength(14);
  });

  it('不带 reason 归档时，原因取当下看到的 businessStatus', () => {
    const a = SEED_PLACE_IDS[0];
    const b = SEED_PLACE_IDS[1];
    importWithStatus(a, 'CLOSED_PERMANENTLY');
    importWithStatus(b, 'CLOSED_TEMPORARILY');

    expect(archiveRestaurant(a).reason).toBe('closed_permanently');
    expect(archiveRestaurant(b).reason).toBe('closed_temporarily');
    // 状态正常的店只能是用户自己的决定
    expect(archiveRestaurant(SEED_PLACE_IDS[2]).reason).toBe('manual');
  });

  it('目录里查不到的 placeId 也能归档（不崩），原因记 manual', () => {
    const entry = archiveRestaurant('ghost-place');
    expect(entry.reason).toBe('manual');
    expect(isArchived('ghost-place')).toBe(true);
    expect(archivedRestaurants().find((x) => x.entry.placeId === 'ghost-place')?.restaurant)
      .toBeNull();
  });
});

/* ------------------------------------------------------------------ *
 * 3. 归档的店不参与摇一摇，且不计进 filteredOut
 * ------------------------------------------------------------------ */

describe('归档的店摇不出来', () => {
  it('池子少一家，但 filteredOut 仍然是 0（那不是半径的错）', () => {
    const placeId = SEED_PLACE_IDS[4];
    archiveRestaurant(placeId, 'closed_permanently');

    const pool = localizedPool(atDowntown());
    expect(pool.restaurants).toHaveLength(14);
    expect(pool.restaurants.some((r) => r.placeId === placeId)).toBe(false);
    expect(pool.filteredOut).toBe(0);
    // selection 一个字没动 —— 归档 ≠ 移除
    expect(effectiveSelection()).toHaveLength(15);
    expect(effectiveSelection()).toContain(placeId);
  });

  it('半径与归档同时生效时，filteredOut 只数被半径挡掉的那些', () => {
    const wide = localizedPool(atDowntown({ radius: 'WALK' }));
    const survivor = wide.restaurants[0].placeId;
    archiveRestaurant(survivor, 'manual');

    const narrow = localizedPool(atDowntown({ radius: 'WALK' }));
    expect(narrow.restaurants).toHaveLength(wide.restaurants.length - 1);
    // 归档那家本来在半径内，所以 filteredOut 不该因为归档而变化
    expect(narrow.filteredOut).toBe(wide.filteredOut);
  });

  it('引擎拿不到归档的店（喂进去的列表里就没有它）', () => {
    const placeId = poolRestaurants(atDowntown())[0].placeId;
    archiveRestaurant(placeId, 'closed_permanently');

    const restaurants = poolRestaurants(atDowntown());
    expect(restaurants.some((r) => r.placeId === placeId)).toBe(false);
    const weekday = new Date('2026-09-28T18:30:00').getDay();
    expect(eligible(restaurants, emptyState(), DINNER, weekday)
      .some((r) => r.placeId === placeId)).toBe(false);
  });

  it('把整个池子都归档 → 池子空了，但 filteredOut 还是 0', () => {
    for (const id of SEED_PLACE_IDS) archiveRestaurant(id, 'manual');
    const pool = localizedPool(atDowntown());
    expect(pool.restaurants).toHaveLength(0);
    expect(pool.filteredOut).toBe(0);
    expect(archiveSize()).toBe(15);
  });
});

/* ------------------------------------------------------------------ *
 * 4. 归档 → 恢复往返
 * ------------------------------------------------------------------ */

describe('归档 → 恢复是无损往返', () => {
  it('恢复之后池子与归档前逐个 placeId 一致', () => {
    const before = localizedPool(atDowntown()).restaurants.map((r) => r.placeId);
    const placeId = before[6];

    archiveRestaurant(placeId, 'closed_temporarily');
    expect(localizedPool(atDowntown()).restaurants).toHaveLength(before.length - 1);

    restoreFromArchive(placeId);
    expect(localizedPool(atDowntown()).restaurants.map((r) => r.placeId)).toEqual(before);
    expect(isArchived(placeId)).toBe(false);
    expect(archivedEntries()).toEqual([]);
  });

  it('重复归档是幂等的：一条记录，原因与时间被覆盖', () => {
    const placeId = SEED_PLACE_IDS[0];
    archiveRestaurant(placeId, 'closed_temporarily', new Date('2026-09-01T00:00:00.000Z'));
    archiveRestaurant(placeId, 'closed_permanently', new Date('2026-09-27T00:00:00.000Z'));

    expect(archiveSize()).toBe(1);
    expect(archivedEntry(placeId)).toEqual({
      placeId,
      archivedAt: '2026-09-27T00:00:00.000Z',
      reason: 'closed_permanently',
    });
  });

  it('归档之后用户又把它从池子移除 → 恢复会把它加回池子（按钮说的话必须是真的）', () => {
    const placeId = SEED_PLACE_IDS[2];
    archiveRestaurant(placeId, 'closed_permanently');
    removeFromSelection(placeId);
    expect(effectiveSelection()).not.toContain(placeId);

    restoreFromArchive(placeId);
    expect(effectiveSelection()).toContain(placeId);
    expect(localizedPool(atDowntown()).restaurants.some((r) => r.placeId === placeId)).toBe(true);
  });

  it('归档一家从没显式选进池子的店 → 恢复把它加进池子，且不破坏其余选择', () => {
    saveSelection([SEED_PLACE_IDS[0], SEED_PLACE_IDS[1]]);
    const outsider = SEED_PLACE_IDS[9];
    archiveRestaurant(outsider, 'manual');
    expect(localizedPool(atDowntown()).restaurants).toHaveLength(2);

    restoreFromArchive(outsider);
    expect(effectiveSelection()).toEqual([SEED_PLACE_IDS[0], SEED_PLACE_IDS[1], outsider]);
    expect(localizedPool(atDowntown()).restaurants).toHaveLength(3);
  });

  it('彻底删除 = 既不归档也不在池子里（但不碰历史与后验）', () => {
    const placeId = SEED_PLACE_IDS[5];
    archiveRestaurant(placeId, 'closed_permanently');
    forgetArchived(placeId);

    expect(isArchived(placeId)).toBe(false);
    expect(effectiveSelection()).not.toContain(placeId);
    expect(localizedPool(atDowntown()).restaurants).toHaveLength(14);
    // 统计全集里也不该再有它 —— 用户明确说了「彻底删除」
    expect(poolWithArchived().restaurants.some((r) => r.placeId === placeId)).toBe(false);
  });

  it('恢复一个压根没归档过的 placeId 不报错', () => {
    expect(() => restoreFromArchive('never-archived')).not.toThrow();
    // 副作用是「保证它在池子里」，这与「恢复」的语义一致
    expect(effectiveSelection()).toContain('never-archived');
  });
});

/* ------------------------------------------------------------------ *
 * 5. 统计全集（S7 的原料）
 * ------------------------------------------------------------------ */

describe('统计全集 = 池子 ∪ 归档', () => {
  it('归档的店仍然在统计全集里（这正是归档而不是删除的意义）', () => {
    const placeId = SEED_PLACE_IDS[1];
    archiveRestaurant(placeId, 'closed_permanently');

    const universe = poolWithArchived();
    expect(universe.restaurants).toHaveLength(15);
    expect(universe.restaurants.some((r) => r.placeId === placeId)).toBe(true);
    expect(universe.archived.get(placeId)?.reason).toBe('closed_permanently');
    expect(universe.unknownPlaceIds).toEqual([]);
  });

  it('归档一家已经被移出池子的店 → 统计里仍在，摇一摇里仍然没有', () => {
    const placeId = SEED_PLACE_IDS[3];
    removeFromSelection(placeId);
    archiveRestaurant(placeId, 'closed_permanently');

    expect(poolWithArchived().restaurants.some((r) => r.placeId === placeId)).toBe(true);
    expect(localizedPool(atDowntown()).restaurants.some((r) => r.placeId === placeId)).toBe(false);
  });

  it('全集去重：同一家店既在池子又在归档只算一次', () => {
    archiveRestaurant(SEED_PLACE_IDS[0], 'manual');
    const ids = poolWithArchived().restaurants.map((r) => r.placeId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('归档/选择里指向目录查不到的店 → 进 unknownPlaceIds，不静默丢掉', () => {
    addToSelection(['ghost-1']);
    archiveRestaurant('ghost-2', 'manual');
    const universe = poolWithArchived();
    expect(universe.unknownPlaceIds).toEqual(['ghost-1', 'ghost-2']);
    expect(universe.restaurants).toHaveLength(15);
  });

  it('全集不做半径过滤：统计问的是「我吃过什么」，不是「今天走得到吗」', () => {
    setRadius('WALK');
    expect(localizedPool().restaurants.length).toBeLessThan(15);
    expect(poolWithArchived().restaurants).toHaveLength(15);
  });
});

/* ------------------------------------------------------------------ *
 * 6. 隔离与脏数据
 * ------------------------------------------------------------------ */

describe('归档按身份隔离', () => {
  it('两个 Profile 的归档互不可见', () => {
    const a = SEED_PLACE_IDS[0];
    archiveRestaurant(a, 'closed_permanently');
    expect(archivedPlaceIds().has(a)).toBe(true);

    const other = createProfile('另一个人', '🍜');
    setActiveProfile(other.id);
    expect(archivedEntries()).toEqual([]);
    expect(localizedPool(atDowntown()).restaurants).toHaveLength(15);

    setActiveProfile(profileId);
    expect(archivedPlaceIds().has(a)).toBe(true);
  });

  it('删 Profile 会一并抹掉它的归档数据（后缀已登记进 DATA_SUFFIXES）', () => {
    archiveRestaurant(SEED_PLACE_IDS[0], 'manual');
    expect(localStorage.getItem(profileKey(profileId, 'archive.v1'))).not.toBeNull();
  });
});

describe('归档的脏数据', () => {
  it('坏条目被丢掉，好条目留下；未知 reason 落成 manual', () => {
    localStorage.setItem(profileKey(profileId, 'archive.v1'), JSON.stringify([
      { placeId: 'good-1', archivedAt: '2026-09-27T00:00:00.000Z', reason: 'closed_permanently' },
      { placeId: '', archivedAt: '2026-09-27T00:00:00.000Z', reason: 'manual' },
      { archivedAt: '2026-09-27T00:00:00.000Z', reason: 'manual' },
      'not-an-object',
      null,
      { placeId: 'good-2', archivedAt: '2026-09-27T00:00:00.000Z', reason: 'robot_decided' },
    ]));

    expect(archivedEntries()).toEqual([
      { placeId: 'good-1', archivedAt: '2026-09-27T00:00:00.000Z', reason: 'closed_permanently' },
      { placeId: 'good-2', archivedAt: '2026-09-27T00:00:00.000Z', reason: 'manual' },
    ]);
  });

  it('存的整块不是数组 → 当成没有归档，不崩', () => {
    localStorage.setItem(profileKey(profileId, 'archive.v1'), '{"oops":true}');
    expect(archivedEntries()).toEqual([]);
    expect(localizedPool(atDowntown()).restaurants).toHaveLength(15);
  });

  it('sanitizeArchive / toArchiveReason 的纯函数行为', () => {
    expect(sanitizeArchive(null)).toEqual([]);
    expect(sanitizeArchive('nope')).toEqual([]);
    expect(toArchiveReason('manual')).toBe('manual');
    expect(toArchiveReason('closed_temporarily')).toBe('closed_temporarily');
    expect(toArchiveReason(undefined)).toBe('manual');
    // 同一个 placeId 两条 → 留最后一条
    expect(sanitizeArchive([
      { placeId: 'p', archivedAt: 'a', reason: 'manual' },
      { placeId: 'p', archivedAt: 'b', reason: 'closed_permanently' },
    ])).toEqual([{ placeId: 'p', archivedAt: 'b', reason: 'closed_permanently' }]);
  });
});

describe('归档列表的展示次序', () => {
  it('最近归档的排最前面（与云端 order by archived_at desc 一致）', () => {
    archiveRestaurant(SEED_PLACE_IDS[0], 'manual', new Date('2026-09-01T00:00:00.000Z'));
    archiveRestaurant(SEED_PLACE_IDS[1], 'manual', new Date('2026-09-15T00:00:00.000Z'));
    archiveRestaurant(SEED_PLACE_IDS[2], 'manual', new Date('2026-09-27T00:00:00.000Z'));
    expect(archivedEntries().map((e) => e.placeId))
      .toEqual([SEED_PLACE_IDS[2], SEED_PLACE_IDS[1], SEED_PLACE_IDS[0]]);
  });
});
