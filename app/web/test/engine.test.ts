import { describe, expect, it } from 'vitest';

import { SEED_RESTAURANTS } from '../src/data/seed-restaurants';
import { categoryOf } from '../src/lib/engine/cuisine';
import { eligible, rollOnce } from '../src/lib/engine/engine';
import { isOpenAtMinutes } from '../src/lib/engine/openHours';
import { applyFeedback, applySkip, decayAll, markEaten } from '../src/lib/engine/posterior';
import { sampleBeta, seededRng } from '../src/lib/engine/random';
import {
  cuisinePenalty, freshness, scoreCandidates, storePrior,
} from '../src/lib/engine/scoring';
import { DINNER, emptyState } from '../src/lib/engine/types';

const byName = (part: string) =>
  SEED_RESTAURANTS.find((r) => r.name.includes(part))!;

describe('openHours（修复版，research/0001 §5）', () => {
  it('海底捞 day:null 26:00 —— 周三凌晨 1:00 应营业', () => {
    expect(isOpenAtMinutes(byName('Haidilao'), 3, 60)).toBe(true);
  });
  it('海底捞凌晨 2:30 已打烊', () => {
    expect(isOpenAtMinutes(byName('Haidilao'), 3, 150)).toBe(false);
  });
  it('N1BBQ 周五 27:30 延伸到周六凌晨 2:30', () => {
    expect(isOpenAtMinutes(byName('Number One'), 6, 150)).toBe(true);
  });
  it('N1BBQ 周一凌晨 2:30 关（周日只到 26:00）', () => {
    expect(isOpenAtMinutes(byName('Number One'), 1, 150)).toBe(false);
  });
  it('Sushi Umi 周一 12:00 未开（12:30 开）、周日休', () => {
    expect(isOpenAtMinutes(byName('Sushi Umi'), 1, 720)).toBe(false);
    expect(isOpenAtMinutes(byName('Sushi Umi'), 1, 760)).toBe(true);
    expect(isOpenAtMinutes(byName('Sushi Umi'), 0, 780)).toBe(false);
  });
  it('24 小时店任何时间都开', () => {
    expect(isOpenAtMinutes(byName('Magic Noodle'), 2, 240)).toBe(true);
  });
});

describe('随机数', () => {
  it('Beta(8,2) 样本均值 ≈ 0.8', () => {
    const rng = seededRng(42);
    let sum = 0;
    const n = 4000;
    for (let i = 0; i < n; i++) sum += sampleBeta(8, 2, rng);
    expect(sum / n).toBeGreaterThan(0.77);
    expect(sum / n).toBeLessThan(0.83);
  });
  it('seededRng 可复现', () => {
    const a = seededRng(7);
    const b = seededRng(7);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});

describe('eligible（晚餐硬过滤）', () => {
  it('排除纯外带、只做午市 slotLock、当天定休', () => {
    const tue = eligible(SEED_RESTAURANTS, emptyState(), DINNER, 2);
    const names = tue.map((r) => r.name);
    expect(names.some((n) => n.includes('Sung Won'))).toBe(false); // dineIn=false
    expect(names.some((n) => n.includes('Yu Seafood'))).toBe(false); // 早茶 slotLock
    expect(names.some((n) => n.includes('良心冰室'))).toBe(false); // 周二休 + slotLock
    expect(names.some((n) => n.includes('美濃'))).toBe(false); // 周二休
    expect(names.some((n) => n.includes('Haidilao'))).toBe(true);
  });
  it('几何坍缩现实检查：周二晚餐池 ≤ 10 家（research/0001 §3）', () => {
    expect(eligible(SEED_RESTAURANTS, emptyState(), DINNER, 2).length)
      .toBeLessThanOrEqual(10);
  });
});

describe('scoring / posterior', () => {
  it('刚吃过的店 freshness 显著下降', () => {
    expect(freshness(10, 9)).toBeLessThan(0.1);
    expect(freshness(10, undefined)).toBe(1);
  });
  it('3 天内同菜系触发冷却', () => {
    expect(cuisinePenalty(10, 8)).toBe(0.4);
    expect(cuisinePenalty(10, 5)).toBe(1);
  });
  it('priorBias 低的店先验更保守', () => {
    const hdl = byName('Haidilao');
    const biased = { ...hdl, priorBias: 0.35 };
    const p1 = storePrior(hdl);
    const p2 = storePrior(biased);
    expect(p1.alpha / (p1.alpha + p1.beta)).toBeGreaterThan(p2.alpha / (p2.alpha + p2.beta));
  });
  it('good 评分同时更新单店与类别；wrong_cuisine 只动类别', () => {
    const s = emptyState();
    const hdl = byName('Haidilao');
    applyFeedback(s, hdl, 'good');
    expect(s.stores[hdl.placeId].alpha).toBeCloseTo(3); // 2 + 1
    expect(s.categories[categoryOf(hdl)].alpha).toBeCloseTo(2); // 1 + 1

    const before = { ...s.stores[hdl.placeId] };
    applySkip(s, hdl, 'wrong_cuisine');
    expect(s.stores[hdl.placeId]).toEqual(before);
    expect(s.categories[categoryOf(hdl)].beta).toBeCloseTo(2); // 1 + 1
  });
  it('too_far / just_ate 不动任何后验', () => {
    const s = emptyState();
    const hdl = byName('Haidilao');
    applySkip(s, hdl, 'too_far');
    applySkip(s, hdl, 'just_ate');
    expect(Object.keys(s.stores)).toHaveLength(0);
    expect(Object.keys(s.categories)).toHaveLength(0);
  });
  it('decayAll 让历史衰减', () => {
    const s = emptyState();
    const hdl = byName('Haidilao');
    applyFeedback(s, hdl, 'good');
    decayAll(s, 0.95);
    expect(s.stores[hdl.placeId].alpha).toBeCloseTo(3 * 0.95);
  });
});

describe('rollOnce', () => {
  it('返回快照且 pick 是快照中最高分', () => {
    const rng = seededRng(1);
    const res = rollOnce(SEED_RESTAURANTS, emptyState(), DINNER, 100, 3, new Set(), rng)!;
    expect(res).not.toBeNull();
    const top = [...res.snapshot].sort((a, b) => b.score - a.score)[0];
    expect(res.pick.placeId).toBe(top.placeId);
  });
  it('excludeIds 生效（换一个不会重复）', () => {
    const rng = seededRng(2);
    const first = rollOnce(SEED_RESTAURANTS, emptyState(), DINNER, 100, 3, new Set(), rng)!;
    const second = rollOnce(
      SEED_RESTAURANTS, emptyState(), DINNER, 100, 3, new Set([first.pick.placeId]), rng,
    )!;
    expect(second.pick.placeId).not.toBe(first.pick.placeId);
  });
  it('昨天刚吃过的店今天几乎不可能再被推(freshness≈0)', () => {
    const s = emptyState();
    const hdl = byName('Haidilao');
    markEaten(s, hdl, 99);
    let hits = 0;
    for (let seed = 0; seed < 50; seed++) {
      const res = rollOnce(SEED_RESTAURANTS, s, DINNER, 100, 3, new Set(), seededRng(seed))!;
      if (res.pick.placeId === hdl.placeId) hits++;
    }
    expect(hits).toBeLessThanOrEqual(2);
  });
  it('scoreCandidates 快照字段齐全（rolls 表的 candidates_snapshot）', () => {
    const snap = scoreCandidates(
      eligible(SEED_RESTAURANTS, emptyState(), DINNER, 3),
      emptyState(), DINNER, 100, 3, seededRng(3),
    );
    expect(snap.length).toBeGreaterThan(5);
    for (const c of snap) {
      expect(c.thetaStore).toBeGreaterThan(0);
      expect(c.thetaCat).toBeGreaterThan(0);
      expect(c.score).toBeGreaterThan(0);
    }
  });
});
