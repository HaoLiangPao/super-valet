import { isOpenAtMinutes } from './openHours';
import { scoreCandidates } from './scoring';
import type { Rng } from './random';
import type {
  CandidateSnapshot, EngineState, MealConfig, Restaurant,
} from './types';

export function eligible(
  restaurants: Restaurant[],
  state: EngineState,
  cfg: MealConfig,
  weekday: number,
): Restaurant[] {
  const weekend = weekday === 0 || weekday === 6;
  return restaurants.filter((r) => {
    if (state.paused[r.placeId]) return false;
    if (!r.isMainMeal || !r.dineIn) return false;
    if (r.slotLock.length > 0 && !r.slotLock.includes(cfg.slot)) return false;
    if (cfg.soloOnWeekdays && !weekend && !r.soloFriendly) return false;
    return isOpenAtMinutes(r, weekday, cfg.decisionMinutes);
  });
}

export interface RollResult {
  pick: Restaurant;
  snapshot: CandidateSnapshot[];
}

/** 一次「摇」：软乘积打分后取 argmax（随机性来自 θ 采样，ADR-0005） */
export function rollOnce(
  restaurants: Restaurant[],
  state: EngineState,
  cfg: MealConfig,
  day: number,
  weekday: number,
  excludeIds: Set<string> = new Set(),
  rng: Rng = Math.random,
): RollResult | null {
  const pool = eligible(restaurants, state, cfg, weekday).filter(
    (r) => !excludeIds.has(r.placeId),
  );
  if (pool.length === 0) return null;
  const snapshot = scoreCandidates(pool, state, cfg, day, weekday, rng);
  let best = 0;
  for (let i = 1; i < snapshot.length; i++) {
    if (snapshot[i].score > snapshot[best].score) best = i;
  }
  const pick = pool.find((r) => r.placeId === snapshot[best].placeId)!;
  return { pick, snapshot };
}

/** 结果卡上的「为什么是它」一行字 */
export function reasonLine(
  state: EngineState,
  pick: Restaurant,
  day: number,
): string {
  const last = state.lastEatenDay[pick.placeId];
  const parts: string[] = [];
  if (last === undefined) parts.push('还没试过这家');
  else {
    const d = day - last;
    parts.push(d >= 14 ? `${Math.floor(d / 7)} 周没吃了` : `${d} 天没吃了`);
  }
  if (pick.rating >= 4.5) parts.push(`Google ${pick.rating}★`);
  if (pick.distanceKm <= 2.5) parts.push('就在附近');
  return parts.join(' · ');
}
