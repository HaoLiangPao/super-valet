/**
 * 菜系 code 的英文名映射（design/0007 §4）。
 *
 * `CATEGORY_LABELS`（中文名）活在不可改的 `src/lib/engine/cuisine.ts` 里，
 * 这份英文对照只在展示层用，key 必须与它保持一致 —— 漏一个不会编译报错
 * （不像 `MessageKey`），所以改 `cuisine.ts` 的类别表时记得回来对一下。
 */
export const CATEGORY_LABELS_EN: Record<string, string> = {
  CN_SPICY: 'Sichuan & Hunan Hotpot',
  CN_CANTONESE: 'Cantonese & HK',
  CN_NORTHERN: 'Northern Chinese',
  CN_SOUTHERN: 'Jiangnan & Taiwanese',
  CN_CASUAL: 'Chinese Fast Casual',
  CN_SWEET: 'Dessert & Bubble Tea',
  AS_JAPANESE: 'Japanese',
  AS_KOREAN: 'Korean',
  AS_SEA: 'Southeast Asian',
  WS_WESTERN: 'Western',
  WS_CASUAL: 'Casual Western',
  WS_CAFE: 'Cafe & Bakery',
};
