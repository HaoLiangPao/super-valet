import type { SearchResponse } from '@/lib/places/contract';
import { NotFoundError } from '@/lib/places/errors';
import { readJsonBody, requireString, withApiErrors } from '@/lib/places/http';
import { resolveProviders } from '@/lib/places/providers';
import { filterRelevant } from '@/lib/places/relevance';

export const runtime = 'nodejs';

/** 店名搜索能有多长；只是防滥用的护栏，契约里没有约束 */
const MAX_QUERY_CHARS = 120;

/** Hao 2026-09-25 指定的话术：查不到就说清楚「可能是新店，过阵子再试」 */
export const NOT_ON_MAPS_MESSAGE =
  '这家店在 Google 地图上还查不到 —— 可能是刚开的新店，还没被收录。过阵子再试试吧。';

/**
 * POST /api/explore/search  { query } → { candidates, demo }
 * 契约见 `src/lib/places/contract.ts` §5。
 *
 * ⚠️ 这里必须做相关性过滤，不能直接把 Places 的返回丢给用户：
 * Text Search 是模糊匹配，搜一个不存在的店也会返回沾边的店
 * （实测「阿巴阿巴烧烤 Markham」→「南波万」「BBQ House」）。
 * 不过滤的话用户会把**一家根本不是他要的店**导进池子，永久污染推荐。
 * 详见 `src/lib/places/relevance.ts` 的注释。
 */
export async function POST(request: Request): Promise<Response> {
  return withApiErrors(async () => {
    const body = await readJsonBody(request);
    const query = requireString(body, 'query', { label: '店名', maxChars: MAX_QUERY_CHARS });

    const { places, placesDemo } = resolveProviders();
    const raw = await places.search(query);
    const { relevant, rejected } = filterRelevant(query, raw);

    if (relevant.length === 0) {
      console.info(
        `[explore] 「${query}」无相关候选；Places 返回 ${raw.length} 家但都不匹配：`,
        rejected.map((r) => r.name),
      );
      throw new NotFoundError(NOT_ON_MAPS_MESSAGE);
    }

    const payload: SearchResponse = { candidates: relevant, demo: placesDemo };
    return Response.json(payload);
  });
}
