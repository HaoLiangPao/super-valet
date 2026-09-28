import { CATEGORY_OF } from '@/lib/engine/cuisine';
import { isCategoryQuery } from './relevance';

/**
 * 子菜系 code → Places 类目搜索词（design/0009 §4.2 的「发现新店」）。
 *
 * 为什么是「从目录里已有的 `primary` 反推」而不是一张写死的查询清单：
 * 目录长什么样，就该按那个样子去找更多 —— 用户的世界是中餐为主，就别拿
 * 八个西餐词去烧配额。`scripts/build-catalog.mjs` 那份 36 条清单是**一次性**
 * 建目录用的，形态相同但用途不同（那次要铺满，这次要贴近）。
 *
 * 两条硬约束：
 *   1. **每个词都必须被 `isCategoryQuery()` 认成类目查询**（有测试锁死）。
 *      不然 `filterRelevant()` 会拿店名相关度去卡它，整个类目的候选会被误杀
 *      —— 2026-09-26 建目录时实测过，9 个类目查询全军覆没就是这么来的。
 *      所以用词只能从 `relevance.ts` 的 `CATEGORY_WORDS` / `STOPWORDS` 里取。
 *   2. **不带城市名**。地理范围靠 `locationBias` 的圆（当前位置），写死
 *      「Markham」会让搬到士嘉堡的用户永远搜不到自己家门口的店。
 */
export const CATEGORY_QUERY_TERMS: Readonly<Record<string, string>> = {
  // 中餐
  CN_SICHUAN: '川菜',
  CN_HOTPOT: '火锅',
  CN_SKEWER: '烧烤 串串',
  CN_HUNAN: '湘菜',
  CN_DIMSUM: '早茶 点心',
  CN_BBQ_MEAT: '烧腊',
  CN_HK_CAFE: '茶餐厅',
  CN_CANTON: '粤菜 小炒',
  CN_CONGEE: '粥 中餐',
  CN_NORTHEAST: '东北菜',
  CN_NOODLE: '牛肉面 拉面',
  CN_DUMPLING: '饺子',
  CN_XIBEI: '拉条子',
  CN_JIANGZHE: '江浙菜 上海菜',
  CN_YUNNAN: '米线',
  CN_TAIWAN: 'taiwanese restaurant',
  CN_FAST: '快餐 中餐',
  CN_BREAKFAST: 'breakfast 中餐',
  CN_VEG: 'vegetarian 中餐',
  CN_AMERICANIZED: 'chinese food',
  CN_DESSERT: '甜品',
  CN_BUBBLETEA: '奶茶',
  // 日韩东南亚
  AS_SUSHI: '寿司',
  AS_IZAKAYA: '居酒屋',
  AS_RAMEN: '拉面',
  AS_DONBURI: '日料',
  AS_KOREAN: '韩餐',
  AS_KBBQ: '韩国 烤肉',
  AS_KFC_KOREAN: '韩式 炸鸡',
  AS_VIETNAM: '越南粉',
  AS_THAI: '泰国菜',
  AS_MALAY: '马来西亚菜',
  AS_INDIAN: '印度菜',
  AS_FILIPINO: 'filipino food',
  // 西餐
  WS_BRUNCH: 'brunch',
  WS_ITALIAN: 'italian restaurant',
  WS_STEAK: 'steakhouse',
  WS_PIZZA: 'pizza',
  WS_BURGER: 'burger',
  WS_DELI: 'deli sandwich',
  WS_MEXICAN: 'mexican restaurant',
  WS_MIDEAST: 'shawarma mediterranean',
  WS_GREEK: 'greek restaurant',
  WS_CARIBBEAN: 'caribbean food',
  WS_BUFFET: '自助餐',
  WS_CANADIAN: 'canadian restaurant',
  WS_CAFE: '咖啡',
};

/** 一个 code 有没有对应的搜索词；没有的（脏 code、日后新增的）不参与发现 */
export function categoryQueryTerm(code: string): string | null {
  return CATEGORY_QUERY_TERMS[code] ?? null;
}

/** 有词的 code 里，没被 `CATEGORY_OF` 承认的（词表漂移的自检用） */
export function unknownQueryCodes(): string[] {
  return Object.keys(CATEGORY_QUERY_TERMS).filter((c) => !(c in CATEGORY_OF));
}

/** `CATEGORY_OF` 里还没配搜索词的 code（词表漂移的自检用） */
export function codesWithoutQuery(): string[] {
  return Object.keys(CATEGORY_OF).filter((c) => !(c in CATEGORY_QUERY_TERMS));
}

/** 每个词都得是类目查询（见文件头约束 1）；不满足的词会被相关性过滤误杀 */
export function nonCategoryTerms(): string[] {
  return Object.values(CATEGORY_QUERY_TERMS).filter((t) => !isCategoryQuery(t));
}
