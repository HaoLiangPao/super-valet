import { categoryOf } from './cuisine';
import { sampleBeta, type Rng } from './random';
import type {
  ArmPosterior, CandidateSnapshot, EngineState, MealConfig, Restaurant,
} from './types';

export const GAMMA = 0.5; // ADR-0005 软乘积里类别层的指数

/** 单店先验：priorBias=1 → Beta(2,1)（乐观）；低 bias（美式中餐）起点更保守 */
export function storePrior(r: Restaurant): ArmPosterior {
  return { alpha: 2 * r.priorBias, beta: 1 + (1 - r.priorBias) };
}

export const CAT_PRIOR: ArmPosterior = { alpha: 1, beta: 1 };

export function storePosterior(state: EngineState, r: Restaurant): ArmPosterior {
  return state.stores[r.placeId] ?? storePrior(r);
}

export function catPosterior(state: EngineState, cat: string): ArmPosterior {
  return state.categories[cat] ?? CAT_PRIOR;
}

export function freshness(day: number, lastEaten: number | undefined): number {
  if (lastEaten === undefined) return 1;
  return 1 - Math.exp(-(day - lastEaten) / 14);
}

export function cuisinePenalty(day: number, catLastEaten: number | undefined): number {
  return catLastEaten !== undefined && day - catLastEaten <= 3 ? 0.4 : 1;
}

export function distanceWeight(km: number, d0Km: number): number {
  return Math.exp(-km / d0Km);
}

export function d0For(cfg: MealConfig, weekday: number): number {
  return weekday === 0 || weekday === 6 ? cfg.d0WeekendKm : cfg.d0WeekdayKm;
}

export function scoreCandidates(
  pool: Restaurant[],
  state: EngineState,
  cfg: MealConfig,
  day: number,
  weekday: number,
  rng: Rng = Math.random,
): CandidateSnapshot[] {
  const d0 = d0For(cfg, weekday);
  return pool.map((r) => {
    const cat = categoryOf(r);
    const sp = storePosterior(state, r);
    const cp = catPosterior(state, cat);
    const thetaStore = sampleBeta(sp.alpha, sp.beta, rng);
    const thetaCat = sampleBeta(cp.alpha, cp.beta, rng);
    const f = freshness(day, state.lastEatenDay[r.placeId]);
    const pen = cuisinePenalty(day, state.catLastEatenDay[cat]);
    const dw = distanceWeight(r.distanceKm, d0);
    const base = state.baseWeight[r.placeId] ?? 1;
    return {
      placeId: r.placeId,
      name: r.name,
      thetaStore,
      thetaCat,
      freshness: f,
      cuisinePenalty: pen,
      distanceWeight: dw,
      score: base * thetaStore * Math.pow(thetaCat, GAMMA) * f * pen * dw,
    };
  });
}
