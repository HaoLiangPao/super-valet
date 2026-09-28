import { REFRESH_BATCH_LIMIT } from '@/lib/catalog/refresh-types';
import type {
  PlaceProvider,
  RefreshDetailsItem,
  RefreshDetailsResponse,
} from '@/lib/places/contract';
import { ProviderError, ValidationError } from '@/lib/places/errors';
import { readJsonBody, withApiErrors } from '@/lib/places/http';
import { resolveProviders } from '@/lib/places/providers';

export const runtime = 'nodejs';

const MAX_PLACE_ID_CHARS = 200;

/**
 * POST /api/refresh/details { placeIds } → { results, demo }
 * 契约见 `src/lib/places/contract.ts` §5b。
 *
 * 为什么刷新要有自己的端点，而不是把 `/api/explore/preview` 调 20 次：
 *   1. preview 每次都带一次 **LLM 分类**。刷新只该更新事实 —— 分类是我们和
 *      用户的判断，被 Places 刷新覆盖是最招骂的那种 bug；顺带省掉 20 次 LLM。
 *   2. 一个请求拿 20 家，让「这次对外抓了几次」有唯一的计数点（成本可审计）。
 *
 * 两条纪律：
 *   - **节制条款在服务端也要挡**：客户端的 `REFRESH_BATCH_LIMIT` 是约定，
 *     这里的 400 才是护栏。绕过前端直接 POST 100 个 placeId 应该被拒。
 *   - **绝不整批失败**：一家抓不到只标这一家（`results[i].error`），
 *     其余照常返回。失败连坐等于把「更新了 12 家」变成一句空话。
 */
export async function POST(request: Request): Promise<Response> {
  return withApiErrors(async () => {
    const body = await readJsonBody(request);
    const placeIds = requirePlaceIds(body.placeIds);

    const { places, placesDemo } = resolveProviders();
    const results = await Promise.all(placeIds.map((id) => fetchOne(places, id)));

    const payload: RefreshDetailsResponse = { results, demo: placesDemo };
    return Response.json(payload);
  });
}

function requirePlaceIds(raw: unknown): string[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new ValidationError('请给出要刷新的餐厅', 'validation.required');
  }
  if (raw.length > REFRESH_BATCH_LIMIT) {
    throw new ValidationError(
      `一次最多刷新 ${REFRESH_BATCH_LIMIT} 家`,
      'validation.too_long',
    );
  }
  const ids: string[] = [];
  for (const v of raw) {
    if (typeof v !== 'string' || v.trim().length === 0 || v.length > MAX_PLACE_ID_CHARS) {
      throw new ValidationError('餐厅标识不对', 'validation.invalid');
    }
    const id = v.trim();
    if (!ids.includes(id)) ids.push(id);
  }
  return ids;
}

/** 一家店一条结果；抛出的异常在这里就地收敛成 `error`，不往外扩散 */
async function fetchOne(places: PlaceProvider, placeId: string): Promise<RefreshDetailsItem> {
  try {
    return { placeId, details: await places.details(placeId) };
  } catch (err) {
    // 上游 4xx 的 body 里可能回显请求参数（含 key）：只进日志，不进响应
    console.error(`[refresh] ${placeId} 重拉失败`, err);
    if (err instanceof ProviderError) {
      return {
        placeId,
        error: { message: err.userMessage, ...(err.code ? { code: err.code } : { code: 'places.upstream' }) },
      };
    }
    return { placeId, error: { message: '这家店没抓到，下次再试', code: 'places.upstream' } };
  }
}
