import type { AnalyzeResponse } from '@/lib/places/contract';
import { MAX_NOTE_CHARS } from '@/lib/places/contract';
import { readJsonBody, requireString, withApiErrors } from '@/lib/places/http';
import { resolveProviders } from '@/lib/places/providers';

export const runtime = 'nodejs';

/**
 * POST /api/explore/analyze { text } → { queries, dishes, demo }
 * 契约见 `src/lib/places/contract.ts` §5。
 *
 * `MAX_NOTE_CHARS` 前端也会截断，这里再校验一次 —— 成本护栏不能只靠客户端
 * （design/0005 §6：粘贴超长文本会把 LLM 成本打上天）。
 */
export async function POST(request: Request): Promise<Response> {
  return withApiErrors(async () => {
    const body = await readJsonBody(request);
    const text = requireString(body, 'text', {
      label: '笔记内容',
      maxChars: MAX_NOTE_CHARS,
      tooLongMessage: `笔记太长了，最多 ${MAX_NOTE_CHARS} 个字，删掉一些再试`,
    });

    const { analyzer, analyzerDemo } = resolveProviders();
    const extraction = await analyzer.extractCandidates(text);

    const payload: AnalyzeResponse = { ...extraction, demo: analyzerDemo };
    return Response.json(payload);
  });
}
