import type { PlaceCandidate } from './contract';

/**
 * 候选相关性校验 —— 「这家店还没上 Google 地图」这个判断的实现。
 *
 * 为什么需要它（2026-09-25 实测发现）：
 * Places 的 Text Search **几乎从不返回空**。拿一个不存在的店名去搜
 * （「阿巴阿巴烧烤 Markham」），它会模糊匹配出「南波万」「BBQ House」这类
 * 沾边的店。如果照着「返回空才算没找到」去实现，用户就会被引导导入
 * **一家根本不是他要的店** —— 这比报错糟得多：错误的店会永久污染推荐池，
 * 而且用户当时未必看得出来。
 *
 * 所以判定标准是「没有**足够相关**的候选」，不是「没有候选」。
 */

/** 城市/商圈/泛称：它们在查询串里是定位线索，不该参与「是不是同一家店」的判断 */
const STOPWORDS = new Set([
  'markham', 'toronto', 'scarborough', 'richmond', 'hill', 'unionville',
  'vaughan', 'north', 'york', 'downtown', 'ontario', 'canada', 'on',
  'restaurant', 'cafe', 'the', 'and',
]);

const CJK = /[㐀-䶿一-鿿぀-ヿ]/;

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
}

function cjkOnly(s: string): string {
  return [...s].filter((ch) => CJK.test(ch)).join('');
}

function latinTokens(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
}

/** 最长公共子串长度；店名很短（≤20 字），O(nm) 完全够用 */
function longestCommonSubstring(a: string, b: string): number {
  if (!a || !b) return 0;
  let best = 0;
  let prev = new Array<number>(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    const cur = new Array<number>(b.length + 1).fill(0);
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        cur[j] = prev[j - 1] + 1;
        if (cur[j] > best) best = cur[j];
      }
    }
    prev = cur;
  }
  return best;
}

/**
 * 0..1。查询里的店名有多少落在候选店名里。
 *
 * 中文走最长公共子串比例（「云尚米线」⊂「Yunshang Rice Noodle 云尚米线」= 1.0）；
 * 拉丁走去停用词后的 token 覆盖率（「pizza nova markham」vs「Pizza Nova」= 1.0）。
 * 两者取大：中英混排的店名任一路命中即可。
 */
export function relevanceScore(queryName: string, candidateName: string): number {
  const qCjk = cjkOnly(queryName);
  const cCjk = cjkOnly(candidateName);
  const cjkRatio = qCjk.length > 0
    ? longestCommonSubstring(qCjk, cCjk) / qCjk.length
    : 0;

  const qTok = latinTokens(queryName);
  const cTokSet = new Set(latinTokens(candidateName));
  const latinRatio = qTok.length > 0
    ? qTok.filter((t) => cTokSet.has(t)).length / qTok.length
    : 0;

  // 纯拉丁查询时给一次整串兜底：候选名里直接包含查询串也算命中
  const whole = qCjk.length === 0 && qTok.length > 0
    && normalize(candidateName).includes(normalize(qTok.join('')))
    ? 1
    : 0;

  return Math.max(cjkRatio, latinRatio, whole);
}

/**
 * 菜系/类目词。用来区分两种搜索意图（2026-09-26 批量建目录时发现）：
 *
 *   「云尚米线 Markham」 = 找**某一家店** → 必须做名称校验，
 *                          否则会把不相干的店当成它推给用户。
 *   「韩国烤肉 Markham」 = 按**菜系浏览**  → 没有餐厅会叫这个名字，
 *                          做名称校验会全军覆没（实测 9 个类目查询全被误杀）。
 *
 * 判据：去掉城市词和类目词之后**还剩下东西**的，才算店名查询。
 */
const CATEGORY_WORDS = [
  // 中文类目
  '火锅', '烧烤', '串串', '烤肉', '川菜', '湘菜', '粤菜', '小炒', '烧腊', '茶餐厅',
  '东北菜', '江浙菜', '上海菜', '米线', '牛肉面', '拉面', '拉条子', '饺子', '包子',
  '早茶', '点心', '麻辣烫', '黄焖鸡', '日料', '寿司', '刺身', '居酒屋', '韩餐',
  '韩国', '韩式', '炸鸡', '越南粉', '泰国菜', '泰餐', '印度菜', '马来西亚菜',
  '中餐', '西餐', '快餐', '甜品', '奶茶', '咖啡', '自助餐', '海鲜', '餐厅', '美食',
  // 英文类目
  'restaurant', 'cuisine', 'food', 'dinner', 'lunch', 'brunch', 'breakfast',
  'italian', 'steakhouse', 'steak', 'pizza', 'burger', 'mediterranean', 'greek',
  'mexican', 'shawarma', 'seafood', 'pub', 'bbq', 'ribs', 'bistro', 'french',
  'sushi', 'ramen', 'izakaya', 'korean', 'thai', 'indian', 'vietnamese', 'pho',
  'malaysian', 'chinese', 'japanese', 'noodle', 'dumpling', 'hotpot', 'grill',
  'dim', 'sum', 'taiwanese', 'cantonese', 'northern', 'buffet', 'kitchen', 'bar',
  'asian', 'western', 'halal', 'vegetarian', 'bakery', 'dessert', 'cafe',
];

/**
 * 这个查询是「按菜系浏览」而不是「找某一家店」吗？
 * 是的话跳过名称校验，直接信任 Places 的排序。
 */
export function isCategoryQuery(query: string): boolean {
  let rest = query.toLowerCase();
  for (const w of [...CATEGORY_WORDS, ...Array.from(STOPWORDS)]) {
    rest = rest.split(w).join(' ');
  }
  // 残留里还有中文字或 ≥2 位的字母数字，就说明带了专名
  return !/[\u3400-\u4dbf\u4e00-\u9fff]/.test(rest) && !/[a-z0-9]{2,}/.test(rest);
}

/** 低于这个分就认为「不是用户要找的那家」 */
export const RELEVANCE_THRESHOLD = 0.5;

export interface RelevanceResult {
  relevant: PlaceCandidate[];
  /** 被判定为不相关的候选，仅用于服务端日志排查，不回给浏览器 */
  rejected: PlaceCandidate[];
}

export function filterRelevant(
  queryName: string,
  candidates: PlaceCandidate[],
  threshold = RELEVANCE_THRESHOLD,
): RelevanceResult {
  // 按菜系浏览：没有店会叫「韩国烤肉」，名称校验在这里只会帮倒忙
  if (isCategoryQuery(queryName)) {
    return { relevant: candidates, rejected: [] };
  }
  const scored = candidates.map((c) => ({ c, score: relevanceScore(queryName, c.name) }));
  return {
    relevant: scored.filter((s) => s.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .map((s) => s.c),
    rejected: scored.filter((s) => s.score < threshold).map((s) => s.c),
  };
}
