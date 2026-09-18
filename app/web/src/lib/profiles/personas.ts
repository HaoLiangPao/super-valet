import { emptyState } from '../engine/types';
import type { ArmPosterior, EngineState } from '../engine/types';

/**
 * 预置 persona：只在「类别层」下种先验。
 *
 * 引擎打分是 base · θ_store · θ_cat^0.5 · freshness · penalty · distance（ADR-0005），
 * 类别 Beta 从这里的 (α, β) 采样，所以一开局就能摇出可感知的口味差异，
 * 又不会锁死单店学习（θ_store 仍从各店自己的先验起步）。
 *
 * 数值是 design/0004 §6 拍的，等试玩反馈再调。
 */
export const PERSONA_CATEGORY_PRIORS: Record<string, Record<string, ArmPosterior>> = {
  western: {
    WS_WESTERN: { alpha: 8, beta: 2 },
    WS_CASUAL: { alpha: 6, beta: 2 },
    WS_CAFE: { alpha: 4, beta: 2 },
    CN_SPICY: { alpha: 2, beta: 4 },
    CN_CANTONESE: { alpha: 2, beta: 4 },
  },
  japanese: {
    AS_JAPANESE: { alpha: 8, beta: 2 },
    AS_KOREAN: { alpha: 4, beta: 2 },
    WS_WESTERN: { alpha: 3, beta: 3 },
  },
  chinese: {
    CN_SPICY: { alpha: 6, beta: 2 },
    CN_CANTONESE: { alpha: 6, beta: 2 },
    CN_NORTHERN: { alpha: 5, beta: 2 },
    CN_SOUTHERN: { alpha: 5, beta: 2 },
    WS_WESTERN: { alpha: 2, beta: 4 },
  },
};

export interface PersonaTemplate {
  key: string;
  name: string;
  emoji: string;
}

/** 选人页「+ 新建」里的模板下拉，也是首次启动时预置的三个 Profile */
export const PERSONA_TEMPLATES: PersonaTemplate[] = [
  { key: 'western', name: '西餐控', emoji: '🥩' },
  { key: 'japanese', name: '日料控', emoji: '🍣' },
  { key: 'chinese', name: '中餐控', emoji: '🥟' },
];

export function isPersonaKey(key: string): boolean {
  return Object.prototype.hasOwnProperty.call(PERSONA_CATEGORY_PRIORS, key);
}

/** 建 persona Profile 时写进该 Profile 命名空间的初始 EngineState；未知 key 返回 null */
export function personaSeedState(personaKey: string): EngineState | null {
  if (!isPersonaKey(personaKey)) return null;
  const priors = PERSONA_CATEGORY_PRIORS[personaKey];
  const categories: Record<string, ArmPosterior> = {};
  for (const [cat, p] of Object.entries(priors)) {
    categories[cat] = { alpha: p.alpha, beta: p.beta };
  }
  return { ...emptyState(), categories };
}
