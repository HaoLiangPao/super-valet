export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/keepalive —— 每天由 Vercel Cron 调一次（`vercel.json`），让 Supabase 看到活动。
 *
 * 为什么要有它：Supabase 免费档闲置 7 天会**自动暂停**项目。2026-10-15 真的发生了：
 * 网站照常返回 200、游客模式照常能用，但登录与云端数据全部失败，
 * 而 pilot 还没开始，正是最容易「一周没人用」的阶段。
 *
 * 做的事尽量小：用 publishable key 对 `restaurants` 做一次 `limit=1` 的 select。
 * 匿名请求被 RLS 挡下、返回空数组也没关系 —— 查询照样落到了 Postgres 上，这就算活动。
 * 不读任何用户数据，也不写任何东西。
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
    const res = await fetch(`${url}/rest/v1/restaurants?select=*&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: 'no-store',
    });
    if (!res.ok) {
      // 暂停中的项目会在这里报 5xx：日志里留一笔，Vercel 的 cron 面板也会显示失败
      console.error(`[keepalive] Supabase 返回 HTTP ${res.status}`);
      return Response.json({ ok: false, upstream: res.status }, { status: 503 });
    }
    return Response.json({ ok: true });
  } catch (err) {
    console.error('[keepalive] Supabase 不可达', err);
    return Response.json({ ok: false, reason: 'unreachable' }, { status: 503 });
  }
}
