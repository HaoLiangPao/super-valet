import { categoryOf } from './cuisine';
import { CAT_PRIOR, storePrior } from './scoring';
import type { EngineState, Restaurant, SkipReason } from './types';

function bump(
  state: EngineState,
  r: Restaurant,
  layer: 'store' | 'cat' | 'both',
  dAlpha: number,
  dBeta: number,
): void {
  if (layer !== 'cat') {
    const p = state.stores[r.placeId] ?? storePrior(r);
    state.stores[r.placeId] = { alpha: p.alpha + dAlpha, beta: p.beta + dBeta };
  }
  if (layer !== 'store') {
    const cat = categoryOf(r);
    const p = state.categories[cat] ?? CAT_PRIOR;
    state.categories[cat] = { alpha: p.alpha + dAlpha, beta: p.beta + dBeta };
  }
}

/** 吃后评分同时更新两层（ADR-0005） */
export function applyFeedback(state: EngineState, r: Restaurant, rating: 'good' | 'ok' | 'bad'): void {
  if (rating === 'good') bump(state, r, 'both', 1, 0);
  else if (rating === 'ok') bump(state, r, 'both', 0.3, 0.3);
  else bump(state, r, 'both', 0, 1);
}

/**
 * skip 原因分流（design/0002 §5.3）：
 * 只有口味性 skip 惩罚单店；菜系不对惩罚类别层；上下文原因不动后验。
 */
export function applySkip(state: EngineState, r: Restaurant, reason: SkipReason): void {
  switch (reason) {
    case 'no_mood':
    case 'other':
      bump(state, r, 'store', 0, 0.3);
      break;
    case 'wrong_cuisine':
      bump(state, r, 'cat', 0, 1);
      break;
    default:
      // too_far / too_pricey / just_ate / closed：纯上下文，不更新后验
      break;
  }
}

export function markEaten(state: EngineState, r: Restaurant, day: number): void {
  state.lastEatenDay[r.placeId] = day;
  state.catLastEatenDay[categoryOf(r)] = day;
}

/** 口味会变：定期对全部 (α,β) 衰减（design/0001 §4 的 0.95/月） */
export function decayAll(state: EngineState, factor = 0.95): void {
  for (const k of Object.keys(state.stores)) {
    state.stores[k] = { alpha: state.stores[k].alpha * factor, beta: state.stores[k].beta * factor };
  }
  for (const k of Object.keys(state.categories)) {
    state.categories[k] = {
      alpha: state.categories[k].alpha * factor,
      beta: state.categories[k].beta * factor,
    };
  }
}
