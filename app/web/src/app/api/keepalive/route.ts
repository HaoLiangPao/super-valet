export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/keepalive —— 每天由 Vercel Cron 调一次（`vercel.json`），让 Supabase 看到活动。
 *
 * 为什么要有它：Supabase 免费档闲置 7 天会**自动暂停**项目。2026-10-15 真的发生了：
 * 网站照常返回 200、游客模式照常能用，但登录与云端数据全部失败，
 * 而 pilot 还没开始，正是最容易「一周没人用」的阶段。
 *
 * 做的事尽量小：用 publishable key 调 `public.keepalive()`（迁移 0006），它只 `select 1`，
 * 不读任何表、不写任何东西。
 *
 * ⚠️ 两个实测过的坑（2026-10-16，第一版上线后线上返回 503）：
 *   - 匿名角色对业务表**没有 grant**，直接 select `restaurants` 得 401 / 42501。
 *     所以走专门的函数，而不是给匿名角色开业务表权限。
 *   - 新版 publishable key（`sb_publishable_…`）不是 JWT，只放 `apikey` 头，
 *     不要再塞进 `Authorization: Bearer`。
 *
 * 设了 `CRON_SECRET` 就校验 Vercel Cron 带来的 Bearer；没设就放行（这个接口无害）。
 */
export async function GET(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ ok: false }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return Response.json({ ok: false, reason: 'not-configured' }, { status: 503 });

  try {
    const res = await fetch(`${url}/rest/v1/rpc/keepalive`, {
      method: 'POST',
      headers: { apikey: key, 'Content-Type': 'application/json' },
      body: '{}',
      cache: 'no-store',
    });
    if (!res.ok) {
      // 暂停中的项目会在这里报 5xx：日志里留一笔，Vercel 的 cron 面板也会显示失败。
      // 带上 PostgREST 的错误码（如 42501 / PGRST202）：只是一个码，不含敏感信息，
      // 但能把「没权限」「函数不存在」「项目暂停」一眼分开
      let code: string | undefined;
      try { code = ((await res.json()) as { code?: string }).code; } catch { /* 非 JSON 就算了 */ }
      console.error(`[keepalive] Supabase 返回 HTTP ${res.status}${code ? ` (${code})` : ''}`);
      return Response.json({ ok: false, upstream: res.status, ...(code ? { code } : {}) }, { status: 503 });
    }
    return Response.json({ ok: true });
  } catch (err) {
    console.error('[keepalive] Supabase 不可达', err);
    return Response.json({ ok: false, reason: 'unreachable' }, { status: 503 });
  }
}
