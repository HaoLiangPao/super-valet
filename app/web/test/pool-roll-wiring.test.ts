import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { beforeEach, describe, expect, it } from 'vitest';

import { PRESET_PACKAGES } from '../src/data/packages';
import { SEED_RESTAURANTS } from '../src/data/seed-restaurants';
import { rollOnce } from '../src/lib/engine/engine';
import { seededRng } from '../src/lib/engine/random';
import { DINNER, emptyState } from '../src/lib/engine/types';
import { applyPackage } from '../src/lib/catalog/selection';
import { poolRestaurants } from '../src/lib/catalog/localize';
import { createProfile, setActiveProfile } from '../src/lib/profiles/profiles';
import { setStoreBackend } from '../src/lib/store/backend';

/**
 * 跨层接线的回归测试 —— 钉死 2026-09-27 的那次事故（INSTRUCTION.md §3）。
 *
 * 当时的情况：数据层的池子/套餐/目录全部做对了、测试全绿、
 * 池子页显示的数字也对，但**摇一摇页压根没调数据层** ——
 * 它还在 `rollOnce(SEED_RESTAURANTS, ...)`，硬编码 15 家种子。
 * 于是「加套餐」改变了池子页和数据库，却完全不改变摇出来的结果，
 * 整个功能的意义落在了没人验的那道缝里，还上了生产。
 *
 * 只在数据层写测试挡不住这种断裂，所以这里从两头钉：
 *   1. 行为：加套餐之后，引擎**真的**摇得到套餐里的店；
 *   2. 接线：摇一摇页不许再把 `SEED_RESTAURANTS` 喂给 `rollOnce`。
 */

class MemStorage {
  private m = new Map<string, string>();
  get length() { return this.m.size; }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
  clear() { this.m.clear(); }
}

const WESTERN = PRESET_PACKAGES.find((p) => p.id === 'ws_value')!;

describe('池子 → 摇一摇 的接线（回归：2026-09-27 事故）', () => {
  beforeEach(() => {
    (globalThis as { localStorage?: unknown }).localStorage = new MemStorage();
    setStoreBackend(null);
    setActiveProfile(createProfile('接线测试', '🍚').id);
  });

  it('没加套餐时，候选池就是 15 家种子', () => {
    expect(poolRestaurants()).toHaveLength(SEED_RESTAURANTS.length);
  });

  it('加完套餐，候选池真的变大', () => {
    const before = poolRestaurants().length;
    applyPackage(WESTERN.id);
    expect(poolRestaurants().length).toBeGreaterThan(before);
  });

  it('★ 加完套餐后，引擎摇得到套餐里的店（当年漏掉的就是这一条）', () => {
    applyPackage(WESTERN.id);
    const members = new Set(WESTERN.placeIds);
    const pool = poolRestaurants();

    // 概率抽样，所以跨多个固定种子取并集；只要出现过就说明候选池真的接上了
    const seen = new Set<string>();
    for (let s = 0; s < 60; s++) {
      const res = rollOnce(pool, emptyState(), DINNER, 100, 5, new Set(), seededRng(s));
      if (res) seen.add(res.pick.placeId);
    }
    const fromPackage = [...seen].filter((id) => members.has(id));
    expect(fromPackage.length).toBeGreaterThan(0);
  });

  it('★ 摇一摇页不许把 SEED_RESTAURANTS 喂给 rollOnce', () => {
    const src = readFileSync(resolve(__dirname, '../src/app/page.tsx'), 'utf8');
    // 当年的原文就是 `rollOnce(SEED_RESTAURANTS, currentState, ...)`
    expect(src).not.toMatch(/rollOnce\(\s*SEED_RESTAURANTS/);
    expect(src).toMatch(/rollOnce\(\s*poolRestaurants\(\)/);
  });
});
