import { beforeEach, describe, expect, it } from 'vitest';

import { SEED_RESTAURANTS } from '../src/data/seed-restaurants';
import { categoryOf } from '../src/lib/engine/cuisine';
import { rollOnce } from '../src/lib/engine/engine';
import { seededRng } from '../src/lib/engine/random';
import {
  appendFeedback, appendRoll, exportAll, loadFeedbacks, loadRolls, loadState, saveState,
} from '../src/lib/engine/store';
import { DINNER, emptyState } from '../src/lib/engine/types';
import type { FeedbackRecord, MealConfig, RollRecord } from '../src/lib/engine/types';
import { PERSONA_CATEGORY_PRIORS, personaSeedState } from '../src/lib/profiles/personas';
import {
  ACTIVE_KEY, LEGACY_KEYS, PROFILES_KEY, createProfile, deleteProfile, ensureBootstrapped,
  getActiveProfile, getActiveProfileId, listProfiles, profileKey, setActiveProfile,
} from '../src/lib/profiles/profiles';

/** vitest 跑在 node 环境，自带没有 localStorage —— 用 Map 装一个够用的 shim */
function createStorageShim(): Storage {
  const map = new Map<string, string>();
  const shim = {
    get length(): number {
      return map.size;
    },
    clear(): void {
      map.clear();
    },
    getItem(key: string): string | null {
      return map.has(key) ? map.get(key)! : null;
    },
    key(index: number): string | null {
      return [...map.keys()][index] ?? null;
    },
    removeItem(key: string): void {
      map.delete(key);
    },
    setItem(key: string, value: string): void {
      map.set(key, String(value));
    },
  };
  return shim as Storage;
}

function allKeys(): string[] {
  const out: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k !== null) out.push(k);
  }
  return out;
}

function roll(id: string, restaurantId: string, day = 100): RollRecord {
  return {
    id,
    rolledAt: new Date(2026, 0, 1).toISOString(),
    epochDay: day,
    meal: 'dinner',
    restaurantId,
    algoVersion: 'v2-soft',
    candidatesSnapshot: [],
    rollIndex: 0,
    action: 'accepted',
  };
}

function feedback(rollId: string, restaurantId: string): FeedbackRecord {
  return {
    rollId,
    restaurantId,
    rating: 'good',
    createdAt: new Date(2026, 0, 1).toISOString(),
  };
}

beforeEach(() => {
  globalThis.localStorage = createStorageShim();
});

describe('ensureBootstrapped', () => {
  it('全新设备预置三个 persona，且不预设活跃 Profile（让用户自己选人）', () => {
    ensureBootstrapped();
    const profiles = listProfiles();
    expect(profiles.map((p) => p.personaKey)).toEqual(['western', 'japanese', 'chinese']);
    expect(profiles.map((p) => p.name)).toEqual(['西餐控', '日料控', '中餐控']);
    expect(profiles.map((p) => p.emoji)).toEqual(['🥩', '🍣', '🥟']);
    expect(getActiveProfileId()).toBeNull();
  });

  it('persona 的类别先验写进了各自命名空间的 EngineState', () => {
    ensureBootstrapped();
    for (const p of listProfiles()) {
      const raw = localStorage.getItem(profileKey(p.id, 'state.v1'));
      expect(raw).not.toBeNull();
      const state = JSON.parse(raw!);
      expect(state.categories).toEqual(PERSONA_CATEGORY_PRIORS[p.personaKey!]);
      // 只种类别层，单店层仍从各店自己的先验起步
      expect(state.stores).toEqual({});
    }
    expect(personaSeedState('不存在的模板')).toBeNull();
  });

  it('幂等：重复调用不会重复预置', () => {
    ensureBootstrapped();
    ensureBootstrapped();
    expect(listProfiles()).toHaveLength(3);
  });

  it('已有注册表时什么都不做（哪怕用户把人全删了）', () => {
    localStorage.setItem(PROFILES_KEY, JSON.stringify([]));
    ensureBootstrapped();
    expect(listProfiles()).toHaveLength(0);
  });
});

describe('旧数据迁移', () => {
  it('P0 的全局 key 平移到「默认」Profile，数据一条不丢', () => {
    const oldState = emptyState();
    oldState.categories.CN_SPICY = { alpha: 3, beta: 1 };
    oldState.lastEatenDay.abc = 99;
    const oldRolls = [roll('r1', 'abc'), roll('r2', 'def')];
    const oldFeedbacks = [feedback('r1', 'abc')];
    localStorage.setItem(LEGACY_KEYS['state.v1'], JSON.stringify(oldState));
    localStorage.setItem(LEGACY_KEYS['rolls.v1'], JSON.stringify(oldRolls));
    localStorage.setItem(LEGACY_KEYS['feedbacks.v1'], JSON.stringify(oldFeedbacks));

    ensureBootstrapped();

    const profiles = listProfiles();
    expect(profiles).toHaveLength(1);
    expect(profiles[0].name).toBe('默认');
    expect(profiles[0].emoji).toBe('🍚');
    expect(profiles[0].personaKey).toBeUndefined();
    // 迁移场景下直接进应用，不用再选人
    expect(getActiveProfileId()).toBe(profiles[0].id);

    expect(loadState()).toEqual(oldState);
    expect(loadRolls()).toEqual(oldRolls);
    expect(loadFeedbacks()).toEqual(oldFeedbacks);

    // 旧 key 清干净，不留下会被再次迁移的残骸
    for (const legacy of Object.values(LEGACY_KEYS)) {
      expect(localStorage.getItem(legacy)).toBeNull();
    }
  });

  it('只有部分旧 key 时也迁移，缺的按空处理', () => {
    localStorage.setItem(LEGACY_KEYS['rolls.v1'], JSON.stringify([roll('r1', 'abc')]));
    ensureBootstrapped();
    expect(listProfiles()).toHaveLength(1);
    expect(loadRolls()).toHaveLength(1);
    expect(loadFeedbacks()).toEqual([]);
    expect(loadState()).toEqual(emptyState());
  });
});

describe('命名空间隔离', () => {
  it('两个 Profile 的摇号 / 反馈 / 后验互相看不见', () => {
    const a = createProfile('A', '🍚');
    const b = createProfile('B', '🍜');

    setActiveProfile(a.id);
    appendRoll(roll('a1', 'rest-a'));
    appendFeedback(feedback('a1', 'rest-a'));
    const stateA = emptyState();
    stateA.categories.CN_SPICY = { alpha: 9, beta: 1 };
    saveState(stateA);

    setActiveProfile(b.id);
    expect(loadRolls()).toEqual([]);
    expect(loadFeedbacks()).toEqual([]);
    expect(loadState()).toEqual(emptyState());

    appendRoll(roll('b1', 'rest-b'));
    const stateB = emptyState();
    stateB.categories.AS_JAPANESE = { alpha: 7, beta: 2 };
    saveState(stateB);

    expect(loadRolls().map((r) => r.id)).toEqual(['b1']);
    expect(loadState().categories).toEqual({ AS_JAPANESE: { alpha: 7, beta: 2 } });

    setActiveProfile(a.id);
    expect(loadRolls().map((r) => r.id)).toEqual(['a1']);
    expect(loadFeedbacks().map((f) => f.rollId)).toEqual(['a1']);
    expect(loadState().categories).toEqual({ CN_SPICY: { alpha: 9, beta: 1 } });

    // 写到的确实是命名空间 key
    expect(allKeys()).toContain(profileKey(a.id, 'rolls.v1'));
    expect(allKeys()).toContain(profileKey(b.id, 'rolls.v1'));
    expect(allKeys()).not.toContain('sv.rolls.v1');
  });

  it('没有活跃 Profile 时读空、写 no-op（门禁漏了也不会污染数据）', () => {
    const a = createProfile('A', '🍚');
    setActiveProfile(a.id);
    appendRoll(roll('a1', 'rest-a'));

    setActiveProfile(null);
    expect(getActiveProfileId()).toBeNull();
    expect(loadRolls()).toEqual([]);
    expect(loadState()).toEqual(emptyState());

    appendRoll(roll('ghost', 'rest-x'));
    saveState({ ...emptyState(), categories: { CN_SPICY: { alpha: 5, beta: 1 } } });
    expect(allKeys().filter((k) => k.includes('ghost'))).toEqual([]);

    setActiveProfile(a.id);
    expect(loadRolls().map((r) => r.id)).toEqual(['a1']);
    expect(loadState()).toEqual(emptyState());
  });

  it('活跃 id 指向已删除的 Profile 时按「没选人」处理', () => {
    const a = createProfile('A', '🍚');
    setActiveProfile(a.id);
    localStorage.setItem(PROFILES_KEY, JSON.stringify([]));
    expect(getActiveProfileId()).toBeNull();
    expect(getActiveProfile()).toBeNull();
  });

  it('exportAll 带上 Profile 信息', () => {
    const a = createProfile('A', '🍚', 'japanese');
    setActiveProfile(a.id);
    appendRoll(roll('a1', 'rest-a'));
    const dump = JSON.parse(exportAll());
    expect(dump.profile.id).toBe(a.id);
    expect(dump.profile.personaKey).toBe('japanese');
    expect(dump.rolls).toHaveLength(1);
    expect(dump.state.categories).toEqual(PERSONA_CATEGORY_PRIORS.japanese);
  });
});

describe('deleteProfile', () => {
  it('删掉注册表条目与该 Profile 的所有 key，不碰别人的数据', () => {
    const a = createProfile('A', '🍚');
    const b = createProfile('B', '🍜');

    setActiveProfile(a.id);
    appendRoll(roll('a1', 'rest-a'));
    appendFeedback(feedback('a1', 'rest-a'));
    saveState({ ...emptyState(), categories: { CN_SPICY: { alpha: 9, beta: 1 } } });
    // 未来新增的数据 key 也要被前缀扫掉
    localStorage.setItem(`sv.${a.id}.future.v1`, '"x"');

    setActiveProfile(b.id);
    appendRoll(roll('b1', 'rest-b'));

    deleteProfile(a.id);

    expect(listProfiles().map((p) => p.id)).toEqual([b.id]);
    expect(allKeys().filter((k) => k.startsWith(`sv.${a.id}.`))).toEqual([]);
    expect(loadRolls().map((r) => r.id)).toEqual(['b1']);
  });

  it('删的是当前活跃 Profile 时退回选人页', () => {
    const a = createProfile('A', '🍚');
    setActiveProfile(a.id);
    deleteProfile(a.id);
    expect(localStorage.getItem(ACTIVE_KEY)).toBeNull();
    expect(getActiveProfileId()).toBeNull();
  });
});

/**
 * persona 效应冒烟。
 *
 * ⚠️ 与 spec 的偏差：spec 要求「western profile 晚餐摇 20 次，WS_* > CN_*」，
 * 但种子数据里唯一的西餐店 15th Ave Cafe & Bistro 是 slotLock:['breakfast','lunch']，
 * **晚餐池里一家西餐都没有**（实测西餐控晚餐 40 摇，WS_* = 0）。
 * 所以改成两条等价且可证伪的对照：
 *   1) 西餐可选的餐次（lunch 配置）下，西餐控的 WS_* 命中数 > 中餐控；
 *   2) 晚餐（周五）下，日料控的 AS_JAPANESE 命中数 > 中餐控。
 * 两条都用固定种子；成文前跑过 200 组种子对照，分别 200/200 与 199/200 成立，
 * 不是挑种子挑出来的。
 */
describe('persona 效应冒烟', () => {
  const LUNCH: MealConfig = {
    meal: 'lunch',
    slot: 'lunch',
    decisionMinutes: 12 * 60 + 30,
    d0WeekdayKm: 6,
    d0WeekendKm: 15,
    soloOnWeekdays: false,
  };

  /** 在指定 persona 的 Profile 下连摇 n 次，统计命中的类别 */
  function tally(personaKey: string, cfg: MealConfig, n: number, seed: number): Record<string, number> {
    const p = createProfile(personaKey, '🍚', personaKey);
    setActiveProfile(p.id);
    const state = loadState();
    const rng = seededRng(seed);
    const counts: Record<string, number> = {};
    const weekday = 5; // 周五
    for (let i = 0; i < n; i++) {
      const res = rollOnce(SEED_RESTAURANTS, state, cfg, 100, weekday, new Set(), rng);
      if (!res) continue;
      const cat = categoryOf(res.pick);
      counts[cat] = (counts[cat] ?? 0) + 1;
    }
    return counts;
  }

  const sumOf = (counts: Record<string, number>, prefix: string) =>
    Object.entries(counts)
      .filter(([cat]) => cat.startsWith(prefix))
      .reduce((s, [, n]) => s + n, 0);

  it('西餐控在西餐可选的餐次里明显更常摇到西餐（对照：中餐控）', () => {
    const western = tally('western', LUNCH, 20, 11);
    const chinese = tally('chinese', LUNCH, 20, 11);
    expect(sumOf(western, 'WS_')).toBeGreaterThan(sumOf(chinese, 'WS_'));
    expect(sumOf(chinese, 'CN_')).toBeGreaterThan(sumOf(western, 'CN_'));
    // 池子里只有 1 家西餐 / 13 家候选，却能占到 20 摇里的 1/4 以上 —— 先验确实在起作用
    expect(sumOf(western, 'WS_')).toBeGreaterThanOrEqual(5);
  });

  it('日料控摇 20 次（晚餐、周五）出日料的次数远超中餐控', () => {
    const japanese = tally('japanese', DINNER, 20, 7);
    const chinese = tally('chinese', DINNER, 20, 7);
    expect(japanese.AS_JAPANESE ?? 0).toBeGreaterThan(chinese.AS_JAPANESE ?? 0);
    expect(sumOf(chinese, 'CN_')).toBeGreaterThan(sumOf(japanese, 'CN_'));
    expect(japanese.AS_JAPANESE ?? 0).toBeGreaterThanOrEqual(7);
  });
});
