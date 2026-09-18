/**
 * 展示层专用的菜系配色表——只管「这个类别用哪个色阶 + 哪种墨色对比」，
 * 不接触任何打分/学习逻辑。类别 key 来自 lib/engine/cuisine 的 categoryOf()。
 */
export interface Swatch {
  bg: string;
  ink: string;
}

const CATEGORY_SWATCH: Record<string, Swatch> = {
  CN_SPICY: { bg: 'var(--color-accent-700)', ink: 'var(--color-bg)' },
  CN_CANTONESE: { bg: 'var(--color-accent-500)', ink: 'var(--color-neutral-900)' },
  CN_NORTHERN: { bg: 'var(--color-accent-800)', ink: 'var(--color-bg)' },
  CN_SOUTHERN: { bg: 'var(--color-neutral-700)', ink: 'var(--color-bg)' },
  CN_CASUAL: { bg: 'var(--color-neutral-500)', ink: 'var(--color-neutral-900)' },
  CN_SWEET: { bg: 'var(--color-accent-300)', ink: 'var(--color-neutral-900)' },
  AS_JAPANESE: { bg: 'var(--color-accent-2-600)', ink: 'var(--color-bg)' },
  AS_KOREAN: { bg: 'var(--color-accent-2-700)', ink: 'var(--color-bg)' },
  AS_SEA: { bg: 'var(--color-accent-2-400)', ink: 'var(--color-neutral-900)' },
  WS_WESTERN: { bg: 'var(--color-neutral-600)', ink: 'var(--color-bg)' },
  WS_CASUAL: { bg: 'var(--color-neutral-500)', ink: 'var(--color-neutral-900)' },
  WS_CAFE: { bg: 'var(--color-neutral-400)', ink: 'var(--color-neutral-900)' },
};

const FALLBACK: Swatch = { bg: 'var(--color-neutral-600)', ink: 'var(--color-bg)' };

export function swatchFor(category: string): Swatch {
  return CATEGORY_SWATCH[category] ?? FALLBACK;
}
