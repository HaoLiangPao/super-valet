import { sanitizeDishes } from '@/lib/notes/codes';
import type { ImportPreview } from '@/lib/places/contract';
import { ValidationError } from '@/lib/places/errors';
import { readJsonBody, requireString, withApiErrors } from '@/lib/places/http';
import { buildPreview } from '@/lib/places/preview';
import { resolveProviders } from '@/lib/places/providers';

export const runtime = 'nodejs';

const MAX_PLACE_ID_CHARS = 200;

/**
 * POST /api/explore/preview { placeId, dishes? } → ImportPreview
 * 契约见 `src/lib/places/contract.ts` §5。
 *
 * 这个端点是整条流水线的收口：
 *   Details（事实）→ 分类（LLM/规则）→ 本地算距离与 bucket → 查重 → 拼预览卡。
 *
 * ⚠️ `alreadyInPool` 在服务端只能判到「种子 15 家」这一层 ——
 * 服务端没有用户会话（ADR-0006 不做 SSR 取数），用户自己导入的那部分只有浏览器知道。
 * 前端必须再 OR 一次本地池子，见 `src/lib/places/preview.ts` 里的说明。
 */
export async function POST(request: Request): Promise<Response> {
  return withApiErrors(async () => {
    const body = await readJsonBody(request);
    const placeId = requireString(body, 'placeId', {
      label: '餐厅',
      maxChars: MAX_PLACE_ID_CHARS,
    });
    if (body.dishes !== undefined && !Array.isArray(body.dishes)) {
      throw new ValidationError('菜品格式不对');
    }
    const dishes = sanitizeDishes(body.dishes ?? []);

    const { places, analyzer, placesDemo, analyzerDemo } = resolveProviders();
    const details = await places.details(placeId);
    const classification = await analyzer.classify({
      name: details.name,
      ...(details.primaryType ? { primaryType: details.primaryType } : {}),
      ...(details.editorialSummary ? { editorialSummary: details.editorialSummary } : {}),
      ...(details.reviewSnippets ? { reviewSnippets: details.reviewSnippets } : {}),
    });

    const payload: ImportPreview = buildPreview({
      details,
      classification,
      dishes,
      demo: placesDemo || analyzerDemo,
    });
    return Response.json(payload);
  });
}
