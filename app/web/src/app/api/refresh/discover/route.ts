import { MANUAL_DISCOVERY_QUERY_LIMIT } from '@/lib/catalog/refresh-types';
import type {
  PlaceProvider,
  RefreshDiscoverItem,
  RefreshDiscoverResponse,
} from '@/lib/places/contract';
import { ProviderError, ValidationError } from '@/lib/places/errors';
import { readJsonBody, withApiErrors } from '@/lib/places/http';
import { IMPORT_ANCHOR, resolveProviders } from '@/lib/places/providers';
import { filterRelevant } from '@/lib/places/relevance';

export const runtime = 'nodejs';

const MAX_QUERY_CHARS = 120;

/**
 * POST /api/refresh/discover { queries, bias? } → { results, demo }
 * 契约见 `src/lib/places/contract.ts` §5b。
 *
 * 「发现新店」只到**候选**为止：返回 `PlaceCandidate[]`，不返回可入池的餐厅。
 * 用户勾选之后才走 `/api/explore/preview` 拿事实与分类 —— 不替用户做主
 * （ADR-0008），也顺便让「发现 40 家但只看 8 家」不花 40 次 Details 的钱。
 *
 * 三条纪律：
 *   - **节制条款服务端硬挡**：查询数 > `MANUAL_DISCOVERY_QUERY_LIMIT` 一律 400。
 *   - **一个查询挂了不连坐**：其余查询照常返回（`results[i].error`）。
 *   - 仍然过一遍 `filterRelevant`：类目查询会被原样放行，但万一有人传进来一个
 *     店名式的查询，名称校验还在 —— 2026-09-26 实测过，**类目词**被当店名查
 *     会被整组误杀，所以 `category-queries.ts` 的每个词都有测试锁定它是类目词。
 */
export async function POST(request: Request): Promise<Response> {
  return withApiErrors(async () => {
    const body = await readJsonBody(request);
    const queries = requireQueries(body.queries);
    const bias = optionalBias(body.bias);

    const { places, placesDemo } = resolveProviders();
    const results = await Promise.all(queries.map((q) => searchOne(places, q, bias)));

    const payload: RefreshDiscoverResponse = { results, demo: placesDemo };
    return Response.json(payload);
  });
}

function requireQueries(raw: unknown): string[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new ValidationError('请给出要搜索的类目', 'validation.required');
  }
  if (raw.length > MANUAL_DISCOVERY_QUERY_LIMIT) {
    throw new ValidationError(
      `一次最多搜 ${MANUAL_DISCOVERY_QUERY_LIMIT} 个类目`,
      'validation.too_long',
    );
  }
  const out: string[] = [];
  for (const v of raw) {
    if (typeof v !== 'string' || v.trim().length === 0 || v.length > MAX_QUERY_CHARS) {
      throw new ValidationError('类目词不对', 'validation.invalid');
    }
    const q = v.trim();
    if (!out.includes(q)) out.push(q);
  }
  return out;
}

/** 位置偏置：给了就用用户当前位置，没给退回导入锚点（Downtown Markham） */
function optionalBias(raw: unknown): { lat: number; lng: number } {
  if (raw === undefined || raw === null) return IMPORT_ANCHOR;
  if (typeof raw !== 'object') throw new ValidationError('位置格式不对', 'validation.invalid');
  const b = raw as { lat?: unknown; lng?: unknown };
  if (typeof b.lat !== 'number' || typeof b.lng !== 'number'
    || !Number.isFinite(b.lat) || !Number.isFinite(b.lng)
    || Math.abs(b.lat) > 90 || Math.abs(b.lng) > 180) {
    throw new ValidationError('位置格式不对', 'validation.invalid');
  }
  return { lat: b.lat, lng: b.lng };
}

async function searchOne(
  places: PlaceProvider,
  query: string,
  bias: { lat: number; lng: number },
): Promise<RefreshDiscoverItem> {
  try {
    const raw = await places.search(query, bias);
    const { relevant, rejected } = filterRelevant(query, raw);
    if (rejected.length > 0) {
      console.info(
        `[refresh] 类目「${query}」有 ${rejected.length} 家被名称校验挡掉`,
        rejected.map((r) => r.name),
      );
    }
    return { query, candidates: relevant };
  } catch (err) {
    console.error(`[refresh] 类目「${query}」搜索失败`, err);
    if (err instanceof ProviderError) {
      return {
        query,
        candidates: [],
        error: { message: err.userMessage, code: err.code ?? 'places.upstream' },
      };
    }
    return { query, candidates: [], error: { message: '这个类目没搜到，下次再试', code: 'places.upstream' } };
  }
}
