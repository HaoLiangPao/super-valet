import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  appendFeedback, appendRoll, exportAll, loadFeedbacks, loadRolls, loadState, saveState,
} from '../src/lib/engine/store';
import { emptyState } from '../src/lib/engine/types';
import type { EngineState, FeedbackRecord, RollRecord } from '../src/lib/engine/types';
import { CloudStore, openCloudStore } from '../src/lib/cloud/store';
import type { CloudGateway } from '../src/lib/cloud/gateway';
import {
  changedRows, feedbackToRow, indexBy, rollToRow, rowToFeedback, rowToRoll, rowsToState,
  stateToCategoryRows, stateToRestaurantRows,
} from '../src/lib/cloud/rows';
import type {
  CategoryRow, DishRow, FeedbackRow, FetchLogRow, LocationPrefsRow, LocationPrefsWrite,
  PoolRow, ProfileRow, RestaurantRow, RollRow, SelectionRow, SourceRow,
} from '../src/lib/cloud/rows';
import { PERSONA_CATEGORY_PRIORS } from '../src/lib/profiles/personas';
import { createProfile, setActiveProfile } from '../src/lib/profiles/profiles';
import { currentBackend, isCloudMode, localBackend, setStoreBackend } from '../src/lib/store/backend';
import { localizedPool } from '../src/lib/catalog/localize';
import { loadLocationPrefs, saveLocationPrefs, setAnchor, setRadius } from '../src/lib/catalog/location';
import {
  SEED_PLACE_IDS, addToSelection, effectiveSelection, removeFromSelection, resetSelection,
  saveSelection,
} from '../src/lib/catalog/selection';
import { defaultLocationPrefs } from '../src/lib/catalog/types';

/* ------------------------------------------------------------------ *
 * 假 gateway：单测一律不打真网，也不 mock supabase-js 的链式 builder
 * ------------------------------------------------------------------ */

interface FakeState {
  profile: ProfileRow | null;
  restaurants: Map<string, RestaurantRow>;
  categories: Map<string, CategoryRow>;
  rolls: RollRow[];
  feedbacks: Map<string, FeedbackRow>;
  pool: Map<string, PoolRow>;
  dishes: DishRow[];
  sources: SourceRow[];
  fetchLog: FetchLogRow[];
  selection: Set<string>;
  prefs: LocationPrefsRow | null;
}

interface FakeGateway extends CloudGateway {
  db: FakeState;
  calls: string[];
  /** 接下来 n 次写调用失败（模拟瞬时抖动） */
  failNext: (times: number) => void;
  /** 一直失败 / 恢复（模拟断网） */
  setFailing: (value: boolean) => void;
}

function fakeGateway(seed: Partial<FakeState> = {}): FakeGateway {
  const db: FakeState = {
    profile: seed.profile ?? null,
    restaurants: seed.restaurants ?? new Map(),
    categories: seed.categories ?? new Map(),
    rolls: seed.rolls ?? [],
    feedbacks: seed.feedbacks ?? new Map(),
    pool: seed.pool ?? new Map(),
    dishes: seed.dishes ?? [],
    sources: seed.sources ?? [],
    fetchLog: seed.fetchLog ?? [],
    selection: seed.selection ?? new Set<string>(),
    prefs: seed.prefs ?? null,
  };
  const calls: string[] = [];
  let failures = 0;
  let failing = false;

  function guard(label: string): void {
    calls.push(label);
    if (failing) throw new Error(`模拟断网：${label}`);
    if (failures > 0) {
      failures -= 1;
      throw new Error(`模拟故障：${label}`);
    }
  }

  return {
    db,
    calls,
    failNext(times: number) {
      failures = times;
    },
    setFailing(value: boolean) {
      failing = value;
    },
    async fetchProfile() {
      return db.profile;
    },
    async fetchRestaurants() {
      return [...db.restaurants.values()];
    },
    async fetchCategories() {
      return [...db.categories.values()];
    },
    async fetchRolls() {
      return [...db.rolls];
    },
    async fetchFeedbacks() {
      return [...db.feedbacks.values()];
    },
    async upsertRestaurants(rows) {
      guard(`upsertRestaurants:${rows.map((r) => r.place_id).join(',')}`);
      for (const row of rows) db.restaurants.set(row.place_id, row);
    },
    async upsertCategories(rows) {
      guard(`upsertCategories:${rows.map((r) => r.category).join(',')}`);
      for (const row of rows) db.categories.set(row.category, row);
    },
    async insertRoll(row) {
      guard(`insertRoll:${row.id}`);
      db.rolls.push(row);
    },
    async upsertFeedback(row) {
      guard(`upsertFeedback:${row.roll_id}`);
      if (!db.rolls.some((r) => r.id === row.roll_id)) {
        // 与真库的外键约束同构：roll 没落库，feedback 也不许落
        throw new Error(`外键违例：roll ${row.roll_id} 不存在`);
      }
      db.feedbacks.set(row.roll_id, row);
    },
    async updateProfile(patch) {
      guard('updateProfile');
      db.profile = { id: 'u1', email: null, display_name: null, emoji: null, persona_key: null, onboarded_at: null, ...db.profile, ...patch };
    },

    async fetchPool() {
      return [...db.pool.values()];
    },
    async fetchDishes() {
      return [...db.dishes];
    },
    async fetchSources() {
      return [...db.sources];
    },
    async importRestaurant(payload) {
      guard(`importRestaurant:${payload.restaurant.place_id}`);
      const placeId = payload.restaurant.place_id;
      let sourceId: string | null = null;
      if (payload.source) {
        sourceId = `src-${placeId}`;
        db.sources = [
          ...db.sources.filter((x) => x.place_id !== placeId),
          { id: sourceId, place_id: placeId, raw_text: payload.source.raw_text },
        ];
      }
      db.pool.set(placeId, {
        place_id: placeId,
        added_at: '2026-09-25T00:00:00.000Z',
        source_id: sourceId,
        restaurants: payload.restaurant,
      });
      db.dishes = [
        ...db.dishes.filter((d) => d.place_id !== placeId),
        ...payload.dishes.map((d) => ({
          place_id: placeId,
          name_raw: d.name,
          quote: d.quote ?? null,
          sentiment: d.sentiment ?? null,
        })),
      ];
    },
    async deleteFromPool(placeId) {
      guard(`deleteFromPool:${placeId}`);
      db.pool.delete(placeId);
      db.dishes = db.dishes.filter((d) => d.place_id !== placeId);
      db.sources = db.sources.filter((x) => x.place_id !== placeId);
    },
    async fetchFetchLog() {
      return [...db.fetchLog];
    },
    async insertFetchLog(row) {
      guard('insertFetchLog');
      db.fetchLog = [row, ...db.fetchLog];
    },

    async fetchSelection() {
      return [...db.selection].map((place_id) => ({ place_id }) as SelectionRow);
    },
    async replaceSelection(placeIds) {
      guard(`replaceSelection:${placeIds === null ? 'null' : placeIds.join(',')}`);
      db.selection = new Set(placeIds ?? []);
      // 与真库同构：selection_set 住在 prefs 行里，且只有这一个 writer 会动它
      const base: LocationPrefsRow = db.prefs ?? {
        source_kind: null, anchor_id: null, lat: null, lng: null, accuracy: null,
        source_ts: null, radius: 'ALL', last_gps_lat: null, last_gps_lng: null,
        last_gps_ts: null, selection_set: false,
      };
      db.prefs = { ...base, selection_set: placeIds !== null };
    },
    async fetchLocationPrefs() {
      return db.prefs;
    },
    async saveLocationPrefs(row: LocationPrefsWrite) {
      guard('saveLocationPrefs');
      // 真库是 upsert：只覆盖传进来的列，selection_set 不受影响
      db.prefs = { selection_set: db.prefs?.selection_set ?? false, ...row };
    },
  };
}

function roll(id: string, restaurantId = 'rest-a', over: Partial<RollRecord> = {}): RollRecord {
  return {
    id,
    rolledAt: '2026-09-18T18:30:00.000Z',
    epochDay: 20714,
    meal: 'dinner',
    restaurantId,
    algoVersion: 'v2-soft',
    candidatesSnapshot: [
      {
        placeId: restaurantId,
        name: 'A 店',
        thetaStore: 0.7,
        thetaCat: 0.6,
        freshness: 1,
        cuisinePenalty: 1,
        distanceWeight: 0.8,
        score: 0.33,
      },
    ],
    rollIndex: 0,
    action: 'accepted',
    ...over,
  };
}

function feedback(rollId: string, over: Partial<FeedbackRecord> = {}): FeedbackRecord {
  return {
    rollId,
    restaurantId: 'rest-a',
    rating: 'good',
    createdAt: '2026-09-19T02:00:00.000Z',
    ...over,
  };
}

function richState(): EngineState {
  return {
    stores: { a: { alpha: 3, beta: 1 }, b: { alpha: 2.5, beta: 1.3 } },
    categories: { CN_SPICY: { alpha: 6, beta: 2 }, AS_JAPANESE: { alpha: 1, beta: 1 } },
    lastEatenDay: { a: 20700 },
    catLastEatenDay: { CN_SPICY: 20700 },
    baseWeight: { b: 0.5 },
    paused: { c: true },
  };
}

async function open(gateway: CloudGateway): Promise<CloudStore> {
  return openCloudStore(gateway, 'u1', 'a@supper-valet.local');
}

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
});

afterEach(() => {
  setStoreBackend(null);
  vi.restoreAllMocks();
});

/* ------------------------------------------------------------------ *
 * 1. 纯映射
 * ------------------------------------------------------------------ */

describe('EngineState ↔ 行映射', () => {
  it('往返不丢信息', () => {
    const state = richState();
    const back = rowsToState(stateToRestaurantRows(state), stateToCategoryRows(state));
    expect(back).toEqual(state);
  });

  it('空 state 映射出零行', () => {
    expect(stateToRestaurantRows(emptyState())).toEqual([]);
    expect(stateToCategoryRows(emptyState())).toEqual([]);
    expect(rowsToState([], [])).toEqual(emptyState());
  });

  it('四个单店 map 合并成一行，缺的字段写 null 而不是编造默认值', () => {
    const rows = stateToRestaurantRows(richState());
    expect(rows.map((r) => r.place_id)).toEqual(['a', 'b', 'c']);
    expect(rows[0]).toEqual({
      place_id: 'a', alpha: 3, beta: 1, base_weight: null, last_eaten_day: 20700, paused: false,
    });
    expect(rows[2]).toEqual({
      place_id: 'c', alpha: null, beta: null, base_weight: null, last_eaten_day: null, paused: true,
    });
  });

  it('paused=false 不占行（与本地模式「键不存在即未暂停」等价）', () => {
    const state = { ...emptyState(), paused: { x: false } };
    expect(stateToRestaurantRows(state)).toEqual([]);
    expect(rowsToState([], [])).toEqual(emptyState());
  });

  it('roll 往返：skip_reason 为 null 时不长出 skipReason 字段', () => {
    const accepted = roll('r1');
    expect(rowToRoll(rollToRow(accepted))).toEqual(accepted);
    expect(rollToRow(accepted).skip_reason).toBeNull();

    const skipped = roll('r2', 'rest-b', { action: 'skipped', skipReason: 'too_far' });
    expect(rowToRoll(rollToRow(skipped))).toEqual(skipped);
  });

  it('roll 快照原样进 jsonb（离线回放的资产不许被压扁）', () => {
    const row = rollToRow(roll('r1'));
    expect(row.candidates_snapshot).toHaveLength(1);
    expect(row.candidates_snapshot[0]).toMatchObject({ thetaStore: 0.7, thetaCat: 0.6, score: 0.33 });
  });

  it('feedback 往返', () => {
    const f = feedback('r1');
    expect(rowToFeedback(feedbackToRow(f))).toEqual(f);
    const withNote = feedback('r2', { note: '没去成', rating: 'ok' });
    expect(rowToFeedback(feedbackToRow(withNote))).toEqual(withNote);
  });

  it('changedRows 只挑出新增与真的变了的行', () => {
    const prev = indexBy(stateToRestaurantRows(richState()), (r) => r.place_id);
    const next = stateToRestaurantRows({
      ...richState(),
      stores: { a: { alpha: 4, beta: 1 }, b: { alpha: 2.5, beta: 1.3 } },
      paused: { c: true, d: true },
    });
    expect(changedRows(prev, next, (r) => r.place_id).map((r) => r.place_id)).toEqual(['a', 'd']);
  });
});

/* ------------------------------------------------------------------ *
 * 2. CloudStore：同步读 + 后台写
 * ------------------------------------------------------------------ */

describe('CloudStore', () => {
  it('登录时把云端数据拉成同步可读的快照', async () => {
    const gw = fakeGateway({
      profile: {
        id: 'u1', email: 'a@supper-valet.local', display_name: 'a',
        emoji: '🍣', persona_key: 'japanese', onboarded_at: '2026-09-18T00:00:00.000Z',
      },
      categories: new Map([['AS_JAPANESE', { category: 'AS_JAPANESE', alpha: 8, beta: 2, last_eaten_day: null }]]),
      rolls: [rollToRow(roll('r1'))],
      feedbacks: new Map([['r1', feedbackToRow(feedback('r1'))]]),
    });
    const store = await open(gw);

    expect(store.identity).toMatchObject({
      userId: 'u1', email: 'a@supper-valet.local', personaKey: 'japanese', emoji: '🍣',
    });
    expect(store.loadState().categories).toEqual({ AS_JAPANESE: { alpha: 8, beta: 2 } });
    expect(store.loadRolls().map((r) => r.id)).toEqual(['r1']);
    expect(store.loadFeedbacks().map((f) => f.rollId)).toEqual(['r1']);
  });

  it('读返回副本：调用方 mutate 不会污染内部快照', async () => {
    const store = await open(fakeGateway());
    const s = store.loadState();
    s.categories.CN_SPICY = { alpha: 99, beta: 1 };
    expect(store.loadState().categories).toEqual({});

    store.appendRoll(roll('r1'));
    const rolls = store.loadRolls();
    rolls.push(roll('ghost'));
    expect(store.loadRolls().map((r) => r.id)).toEqual(['r1']);
  });

  it('写是 write-through：内存立刻生效，队列 flush 后云端也有', async () => {
    const gw = fakeGateway();
    const store = await open(gw);

    store.appendRoll(roll('r1'));
    store.appendFeedback(feedback('r1'));
    // 同步读立刻看得到，不等网络
    expect(store.loadRolls().map((r) => r.id)).toEqual(['r1']);
    expect(store.loadFeedbacks().map((f) => f.rollId)).toEqual(['r1']);

    await store.flush();
    expect(gw.db.rolls.map((r) => r.id)).toEqual(['r1']);
    expect([...gw.db.feedbacks.keys()]).toEqual(['r1']);
    expect(store.lastError).toBeNull();
  });

  it('写队列串行，rolls 一定排在 feedbacks 前面（DB 有外键）', async () => {
    const gw = fakeGateway();
    const store = await open(gw);
    store.appendRoll(roll('r1'));
    store.appendFeedback(feedback('r1'));
    store.appendRoll(roll('r2', 'rest-b'));
    await store.flush();
    expect(gw.calls).toEqual(['insertRoll:r1', 'upsertFeedback:r1', 'insertRoll:r2']);
  });

  it('saveState 做差分，只推真正变了的行', async () => {
    const gw = fakeGateway();
    const store = await open(gw);

    const s1 = store.loadState();
    s1.categories.CN_SPICY = { alpha: 2, beta: 1 };
    s1.stores.a = { alpha: 3, beta: 1 };
    store.saveState(s1);
    await store.flush();
    expect(gw.calls).toEqual(['upsertRestaurants:a', 'upsertCategories:CN_SPICY']);

    // 原样再存一次：一个请求都不该发
    store.saveState(store.loadState());
    await store.flush();
    expect(gw.calls).toHaveLength(2);

    // 只动类别层：只推类别层
    const s2 = store.loadState();
    s2.categories.CN_SPICY = { alpha: 3, beta: 1 };
    store.saveState(s2);
    await store.flush();
    expect(gw.calls).toEqual([
      'upsertRestaurants:a', 'upsertCategories:CN_SPICY', 'upsertCategories:CN_SPICY',
    ]);
    expect(gw.db.categories.get('CN_SPICY')).toMatchObject({ alpha: 3, beta: 1 });
  });

  it('瞬时失败自动重试一次就过，不惊动用户', async () => {
    const gw = fakeGateway();
    const store = await open(gw);
    gw.failNext(1);
    store.appendRoll(roll('r1'));
    await store.flush();
    expect(gw.db.rolls.map((r) => r.id)).toEqual(['r1']);
    expect(store.lastError).toBeNull();
  });

  it('断网期间：记错、内存快照照常可用；恢复后补推，且补推排在新写之前', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const gw = fakeGateway();
    const store = await open(gw);

    gw.setFailing(true);
    const s = store.loadState();
    s.categories.CN_SPICY = { alpha: 2, beta: 1 };
    store.saveState(s);
    await store.flush();
    expect(store.lastError).toContain('类别后验');
    expect(gw.db.categories.size).toBe(0);
    // 内存里仍然是对的，用户继续摇不受影响
    expect(store.loadState().categories.CN_SPICY).toEqual({ alpha: 2, beta: 1 });

    // 断网期间照样能摇
    store.appendRoll(roll('r1'));
    await store.flush();
    expect(store.loadRolls().map((r) => r.id)).toEqual(['r1']);
    expect(gw.db.rolls).toEqual([]);

    gw.setFailing(false);
    store.appendFeedback(feedback('r1'));
    await store.flush();

    // 积压的按原顺序补完：类别后验 → roll → feedback（feedback 的外键才不会炸）
    expect(gw.db.categories.get('CN_SPICY')).toMatchObject({ alpha: 2, beta: 1 });
    expect(gw.db.rolls.map((r) => r.id)).toEqual(['r1']);
    expect([...gw.db.feedbacks.keys()]).toEqual(['r1']);
  });

  it('首登选 persona：类别先验落库 + 档案标记已引导', async () => {
    const gw = fakeGateway();
    const store = await open(gw);
    expect(store.identity.onboardedAt).toBeNull();

    await store.completeOnboarding('japanese', '🍣');

    expect(store.loadState().categories).toEqual(PERSONA_CATEGORY_PRIORS.japanese);
    expect([...gw.db.categories.keys()].sort())
      .toEqual(Object.keys(PERSONA_CATEGORY_PRIORS.japanese).sort());
    expect(gw.db.profile).toMatchObject({
      persona_key: 'japanese', emoji: '🍣', display_name: 'a',
    });
    expect(store.identity.onboardedAt).not.toBeNull();
  });

  it('首登选「从零开始」：不种先验，只标记已引导', async () => {
    const gw = fakeGateway();
    const store = await open(gw);
    await store.completeOnboarding(null, '🍚');
    expect(store.loadState()).toEqual(emptyState());
    expect(gw.db.categories.size).toBe(0);
    expect(gw.db.profile).toMatchObject({ persona_key: null, onboarded_at: expect.any(String) });
  });

  it('两个账号各自一套 store，互相看不见（客户端侧隔离；服务端侧由 RLS 保证）', async () => {
    const gwA = fakeGateway();
    const gwB = fakeGateway();
    const a = await openCloudStore(gwA, 'user-a', 'a@supper-valet.local');
    const b = await openCloudStore(gwB, 'user-b', 'b@supper-valet.local');

    a.appendRoll(roll('a1'));
    const sa = a.loadState();
    sa.categories.CN_SPICY = { alpha: 9, beta: 1 };
    a.saveState(sa);
    await a.flush();

    expect(b.loadRolls()).toEqual([]);
    expect(b.loadState()).toEqual(emptyState());
    expect(gwB.db.rolls).toEqual([]);
    expect(gwB.db.categories.size).toBe(0);
  });

  it('exportIdentity 标明这是云端账号的数据', async () => {
    const store = await open(fakeGateway());
    expect(store.exportIdentity()).toMatchObject({
      mode: 'cloud', userId: 'u1', email: 'a@supper-valet.local',
    });
  });
});

/* ------------------------------------------------------------------ *
 * 3. store.ts 的 8 个函数：后端切换对上层透明
 * ------------------------------------------------------------------ */

describe('store.ts 后端切换', () => {
  it('默认走本地后端；装上 CloudStore 后同样 8 个函数改走云端', async () => {
    const local = createProfile('游客', '🍚');
    setActiveProfile(local.id);
    appendRoll(roll('local-1'));
    saveState({ ...emptyState(), categories: { CN_SPICY: { alpha: 5, beta: 1 } } });

    expect(isCloudMode()).toBe(false);
    expect(currentBackend()).toBe(localBackend);
    expect(loadRolls().map((r) => r.id)).toEqual(['local-1']);

    const gw = fakeGateway();
    const cloud = await open(gw);
    setStoreBackend(cloud);

    expect(isCloudMode()).toBe(true);
    // 云端账号是全新的：看不到游客的任何东西
    expect(loadRolls()).toEqual([]);
    expect(loadFeedbacks()).toEqual([]);
    expect(loadState()).toEqual(emptyState());

    appendRoll(roll('cloud-1'));
    appendFeedback(feedback('cloud-1'));
    saveState({ ...emptyState(), categories: { AS_JAPANESE: { alpha: 8, beta: 2 } } });
    await cloud.flush();

    expect(gw.db.rolls.map((r) => r.id)).toEqual(['cloud-1']);
    expect([...gw.db.feedbacks.keys()]).toEqual(['cloud-1']);
    expect(gw.db.categories.get('AS_JAPANESE')).toMatchObject({ alpha: 8, beta: 2 });
    expect(JSON.parse(exportAll()).profile).toMatchObject({ mode: 'cloud' });

    // 登出：本地数据原封不动还在
    setStoreBackend(null);
    expect(isCloudMode()).toBe(false);
    expect(loadRolls().map((r) => r.id)).toEqual(['local-1']);
    expect(loadState().categories).toEqual({ CN_SPICY: { alpha: 5, beta: 1 } });
    expect(JSON.parse(exportAll()).profile.id).toBe(local.id);
  });

  it('云模式下写入不会落到 localStorage（两套存储互不串味）', async () => {
    const local = createProfile('游客', '🍚');
    setActiveProfile(local.id);
    const before = localStorage.length;

    const gw = fakeGateway();
    setStoreBackend(await open(gw));
    appendRoll(roll('cloud-1'));
    saveState({ ...emptyState(), stores: { a: { alpha: 3, beta: 1 } } });

    expect(localStorage.length).toBe(before);
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i)!);
    expect(keys.some((k) => k.includes('cloud-1'))).toBe(false);
  });
});

/* ------------------------------------------------------------------ *
 * 6. 池子选择与位置偏好（design/0006、ADR-0008）
 * ------------------------------------------------------------------ */

describe('云端的池子选择', () => {
  it('没有行 → null → 池子默认成 15 家种子（老账号升级后不变）', async () => {
    const gw = fakeGateway();
    const store = await open(gw);
    setStoreBackend(store);

    expect(store.loadSelection()).toBeNull();
    expect(effectiveSelection()).toEqual([...SEED_PLACE_IDS]);
    expect(localizedPool().restaurants).toHaveLength(15);
  });

  it('改了之后重新登录读回来的是同一份', async () => {
    const gw = fakeGateway();
    setStoreBackend(await open(gw));

    addToSelection(['extra-1']);
    removeFromSelection(SEED_PLACE_IDS[0]);
    await (currentBackend() as CloudStore).flush();

    const again = await open(gw);
    expect(again.loadSelection()).toHaveLength(15);
    expect(again.loadSelection()).toContain('extra-1');
    expect(again.loadSelection()).not.toContain(SEED_PLACE_IDS[0]);
  });

  it('显式清空 ≠ 从没选过：空池子重新登录后仍然是空的', async () => {
    const gw = fakeGateway();
    const store = await open(gw);
    setStoreBackend(store);

    saveSelection([]);
    await store.flush();
    expect(gw.db.selection.size).toBe(0);
    expect(gw.db.prefs?.selection_set).toBe(true);

    const again = await open(gw);
    expect(again.loadSelection()).toEqual([]);
    setStoreBackend(again);
    expect(effectiveSelection()).toEqual([]);
    expect(localizedPool().restaurants).toHaveLength(0);
  });

  it('resetSelection() 抹掉记录 → 重新登录回到 15 家种子', async () => {
    const gw = fakeGateway();
    const store = await open(gw);
    setStoreBackend(store);

    saveSelection(['x']);
    resetSelection();
    await store.flush();
    expect(gw.db.prefs?.selection_set).toBe(false);

    const again = await open(gw);
    expect(again.loadSelection()).toBeNull();
  });

  it('两个账号的池子选择互不可见', async () => {
    const gwA = fakeGateway();
    const gwB = fakeGateway();

    setStoreBackend(await open(gwA));
    addToSelection(['a-only']);
    await (currentBackend() as CloudStore).flush();

    setStoreBackend(await open(gwB));
    expect(effectiveSelection()).toEqual([...SEED_PLACE_IDS]);
    expect(effectiveSelection()).not.toContain('a-only');
    addToSelection(['b-only']);
    await (currentBackend() as CloudStore).flush();

    const backToA = await open(gwA);
    expect(backToA.loadSelection()).toContain('a-only');
    expect(backToA.loadSelection()).not.toContain('b-only');
  });

  it('云模式的选择不落 localStorage（游客态数据不串味）', async () => {
    const local = createProfile('游客', '🍚');
    setActiveProfile(local.id);
    addToSelection(['local-only']);

    setStoreBackend(await open(fakeGateway()));
    addToSelection(['cloud-only']);
    await (currentBackend() as CloudStore).flush();
    expect(effectiveSelection()).toContain('cloud-only');
    expect(effectiveSelection()).not.toContain('local-only');

    setStoreBackend(null);
    expect(effectiveSelection()).toContain('local-only');
    expect(effectiveSelection()).not.toContain('cloud-only');
  });
});

describe('云端的位置偏好', () => {
  it('锚点 / 半径 / lastGps 往返不丢（时间戳过 timestamptz 也不丢精度）', async () => {
    const gw = fakeGateway();
    const store = await open(gw);
    setStoreBackend(store);

    const ts = Date.parse('2026-09-26T04:05:06.007Z');
    saveLocationPrefs({
      source: { kind: 'gps', lat: 43.77, lng: -79.41, accuracy: 35, ts },
      radius: 'NEAR',
      lastGps: { lat: 43.77, lng: -79.41, ts },
    });
    await store.flush();

    const again = await open(gw);
    expect(again.loadLocationPrefs()).toEqual({
      source: { kind: 'gps', lat: 43.77, lng: -79.41, accuracy: 35, ts },
      radius: 'NEAR',
      lastGps: { lat: 43.77, lng: -79.41, ts },
    });
  });

  it('锚点来源往返；半径默认 ALL', async () => {
    const gw = fakeGateway();
    const store = await open(gw);
    setStoreBackend(store);
    setAnchor('unionville');
    await store.flush();

    const again = await open(gw);
    expect(again.loadLocationPrefs().source).toMatchObject({ kind: 'anchor', id: 'unionville' });
    expect(again.loadLocationPrefs().radius).toBe('ALL');
  });

  it('写位置偏好不会把 selection_set 抹掉（两个 writer 各写自己的列）', async () => {
    const gw = fakeGateway();
    const store = await open(gw);
    setStoreBackend(store);

    saveSelection([]);          // selection_set = true
    setRadius('WALK');          // 只写位置列
    await store.flush();

    expect(gw.db.prefs?.selection_set).toBe(true);
    expect(gw.db.prefs?.radius).toBe('WALK');
    const again = await open(gw);
    expect(again.loadSelection()).toEqual([]);
  });

  it('两个账号的位置偏好互不可见', async () => {
    const gwA = fakeGateway();
    const gwB = fakeGateway();

    const a = await open(gwA);
    setStoreBackend(a);
    setRadius('WALK');
    await a.flush();

    const b = await open(gwB);
    setStoreBackend(b);
    expect(loadLocationPrefs().radius).toBe('ALL');
  });

  it('新表还没迁移（读报错）→ 照常进得去，按「从没选过」处理', async () => {
    const gw = fakeGateway();
    gw.fetchSelection = async () => {
      throw new Error('relation "user_pool_selection" does not exist');
    };
    gw.fetchLocationPrefs = async () => {
      throw new Error('relation "user_location_prefs" does not exist');
    };

    const store = await open(gw);
    setStoreBackend(store);
    expect(store.loadSelection()).toBeNull();
    expect(store.loadLocationPrefs()).toEqual(defaultLocationPrefs());
    expect(localizedPool().restaurants).toHaveLength(15);
  });
});
