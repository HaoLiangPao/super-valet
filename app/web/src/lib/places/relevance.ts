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
  const scored = candidates.map((c) => ({ c, score: relevanceScore(queryName, c.name) }));
  return {
    relevant: scored.filter((s) => s.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .map((s) => s.c),
    rejected: scored.filter((s) => s.score < threshold).map((s) => s.c),
  };
}
