import { CATEGORY_OF } from '@/lib/engine/cuisine';
import type { Classification, DishMention } from '@/lib/places/contract';
import type { Slot } from '@/lib/engine/types';

/**
 * 分类 code 的唯一真相来源与净化器。
 *
 * design/0002 §8.2 的两步法在这里落地：
 *   Step 1 —— `TYPE_MAP` 规则映射，Google 的 primaryType 能直接确定的就不问 LLM；
 *   Step 2 —— 未命中才交给 LLM（见 `src/lib/notes/anthropic.ts`）。
 *
 * 最关键的一条：**LLM 不许自创 code**。它返回什么都要过 `sanitizeClassification`，
 * 任何不在 `CATEGORY_OF` 里的 code 一律丢弃并压低 confidence，
 * 否则一个幻觉 code 会让这家店掉进 `categoryOf()` 的兜底分支，
 * 污染整条类别层的学习（ADR-0005 里类别层才是真正在学的那层）。
 */

/** design/0002 §7 的全部 subCuisine code，从中间层映射表反推，保证两边永不漂移 */
export const SUBCUISINE_CODES: readonly string[] = Object.keys(CATEGORY_OF).sort();

const CODE_SET = new Set(SUBCUISINE_CODES);

export function isValidCode(code: unknown): code is string {
  return typeof code === 'string' && CODE_SET.has(code);
}

/** design/0002 §8.2 Step 1：Google type → 子菜系；`chinese_restaurant` 故意不在表里 */
export const TYPE_MAP: Readonly<Record<string, string>> = {
  sushi_restaurant: 'AS_SUSHI',
  ramen_restaurant: 'AS_RAMEN',
  korean_restaurant: 'AS_KOREAN',
  vietnamese_restaurant: 'AS_VIETNAM',
  indian_restaurant: 'AS_INDIAN',
  thai_restaurant: 'AS_THAI',
  pizza_restaurant: 'WS_PIZZA',
  hamburger_restaurant: 'WS_BURGER',
  brunch_restaurant: 'WS_BRUNCH',
  breakfast_restaurant: 'WS_BRUNCH',
  italian_restaurant: 'WS_ITALIAN',
  steak_house: 'WS_STEAK',
  mexican_restaurant: 'WS_MEXICAN',
  greek_restaurant: 'WS_GREEK',
  middle_eastern_restaurant: 'WS_MIDEAST',
  mediterranean_restaurant: 'WS_MIDEAST',
  cafe: 'WS_CAFE',
  coffee_shop: 'WS_CAFE',
  bakery: 'WS_CAFE',
  dessert_shop: 'CN_DESSERT',
  buffet_restaurant: 'WS_BUFFET',
};

/** 规则命中返回 code，未命中返回 null（→ 交给 LLM） */
export function ruleClassify(primaryType?: string): string | null {
  if (!primaryType) return null;
  return TYPE_MAP[primaryType] ?? null;
}

export const VALID_SLOTS: readonly Slot[] = ['breakfast', 'lunch', 'dinner', 'latenight'];
const SLOT_SET = new Set<string>(VALID_SLOTS);

/**
 * 什么都判断不出来时的兜底：低 confidence + 明确的 reason，
 * 逼前端走「人工确认分类」那条路（design/0005 §4.3，confidence < 0.7）。
 * 刻意不编一个看起来像模像样的分类 —— 用户改一次，比默默错一年便宜。
 */
export const UNKNOWN_FALLBACK: Classification = {
  primary: 'CN_FAST',
  tags: ['CN_FAST'],
  soloFriendly: true,
  slotLock: [],
  isMainMeal: true,
  priorBias: 1.0,
  confidence: 0.35,
  reason: '无法判断菜系，请手动选择',
};

function clamp(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value));
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

export interface SanitizeOptions {
  /** 规则表命中的 code；命中时它**压过** LLM 的 primary（design/0002 §8.2 Step 1 先行） */
  ruleCode?: string | null;
}

/**
 * 把「任何形状的 LLM 输出」收敛成合法的 `Classification`。
 * 永不抛异常 —— 上游拿到垃圾也应该降级成低置信度结果，而不是让整条导入流水线挂掉。
 */
export function sanitizeClassification(raw: unknown, options: SanitizeOptions = {}): Classification {
  const obj = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  const ruleCode = isValidCode(options.ruleCode) ? options.ruleCode : null;

  const llmPrimary = isValidCode(obj.primary) ? obj.primary : null;
  const primary = ruleCode ?? llmPrimary;
  if (primary === null) {
    return {
      ...UNKNOWN_FALLBACK,
      reason: typeof obj.reason === 'string' && obj.reason.trim()
        ? `${obj.reason.trim().slice(0, 20)}（分类无效，请手动选择）`
        : UNKNOWN_FALLBACK.reason,
    };
  }

  const tags = [primary, ...asStringArray(obj.tags).filter(isValidCode)]
    .filter((c, i, arr) => arr.indexOf(c) === i)
    .slice(0, 3);

  const slotLock = asStringArray(obj.slotLock)
    .filter((s): s is Slot => SLOT_SET.has(s))
    .filter((s, i, arr) => arr.indexOf(s) === i);

  let confidence = clamp(asNumber(obj.confidence, 0.5), 0, 1);
  // 规则表是确定性的，不该被模型的谦虚拖低；模型自创了 tags 又被我们丢掉，
  // 说明它对这家店的把握没它说的那么高，压到 0.5 以下让前端强制人工确认。
  if (ruleCode !== null) confidence = Math.max(confidence, 0.9);
  else if (asStringArray(obj.tags).some((t) => !isValidCode(t))) {
    confidence = Math.min(confidence, 0.5);
  }

  const reason = (typeof obj.reason === 'string' ? obj.reason.trim() : '').slice(0, 20)
    || (ruleCode ? 'Google 类型直接命中' : '模型判断');

  return {
    primary,
    tags,
    soloFriendly: asBoolean(obj.soloFriendly, true),
    slotLock,
    isMainMeal: asBoolean(obj.isMainMeal, true),
    priorBias: clamp(asNumber(obj.priorBias, 1.0), 0.6, 1.0),
    confidence,
    reason,
  };
}

/**
 * 菜品提及的净化：名字必填、长度设上限、情感只认三个值。
 * 同样永不抛异常。
 */
export function sanitizeDishes(raw: unknown, limit = 20): DishMention[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: DishMention[] = [];
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue;
    const d = item as Record<string, unknown>;
    const name = typeof d.name === 'string' ? d.name.trim().slice(0, 40) : '';
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const quote = typeof d.quote === 'string' && d.quote.trim()
      ? d.quote.trim().slice(0, 120)
      : undefined;
    const sentiment = d.sentiment === 'positive' || d.sentiment === 'neutral' || d.sentiment === 'negative'
      ? d.sentiment
      : undefined;
    out.push({ name, ...(quote ? { quote } : {}), ...(sentiment ? { sentiment } : {}) });
    if (out.length >= limit) break;
  }
  return out;
}
