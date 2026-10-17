import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GET as keepalive } from '../src/app/api/keepalive/route';

/**
 * Supabase 免费档闲置 7 天会自动暂停（2026-10-15 真的发生了，生产登录全挂）。
 * 保活靠 Vercel Cron 每天调一次 /api/keepalive。
 *
 * 跨层断裂是本项目的头号事故模式（INSTRUCTION.md §3）：接口写好了但 cron 没指向它，
 * 和没写一样。所以先钉接线，再钉行为。
 */

describe('保活接线', () => {
  it('路由调用的函数确实在迁移里定义并授权给了匿名角色', () => {
    const sql = readFileSync(resolve(__dirname, '../../../supabase/migrations/0006_keepalive.sql'), 'utf8');
    expect(sql).toMatch(/create or replace function public\.keepalive\(\)/);
    expect(sql).toMatch(/grant execute on function public\.keepalive\(\) to anon/);
  });

  it('vercel.json 的 cron 指向一个真实存在的路由', () => {
    const cfg = JSON.parse(readFileSync(resolve(__dirname, '../vercel.json'), 'utf8'));
    const paths: string[] = cfg.crons.map((c: { path: string }) => c.path);
    expect(paths).toContain('/api/keepalive');
    for (const p of paths) {
      expect(existsSync(resolve(__dirname, `../src/app${p}/route.ts`))).toBe(true);
    }
  });

  it('每天至少一次（远小于 7 天的暂停阈值）', () => {
    const cfg = JSON.parse(readFileSync(resolve(__dirname, '../vercel.json'), 'utf8'));
    const cron = cfg.crons.find((c: { path: string }) => c.path === '/api/keepalive');
    // 分 时 日 月 周：日/月/周都是 * 才是每天
    expect(cron.schedule.split(' ').slice(2)).toEqual(['*', '*', '*']);
  });
});

describe('保活行为', () => {
  const req = (auth?: string) =>
    new Request('http://localhost/api/keepalive', auth ? { headers: { authorization: auth } } : {});

  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'pk_test');
    vi.stubEnv('CRON_SECRET', '');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('只调一次 keepalive() 函数，只带 apikey 头', async () => {
    const fetchMock = vi.fn(async () => new Response('1', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const res = await keepalive(req());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit | undefined];
    expect(url).toBe('https://example.supabase.co/rest/v1/rpc/keepalive');
    expect(init?.method).toBe('POST');
    const headers = init?.headers as Record<string, string>;
    expect(headers.apikey).toBe('pk_test');
    // 新版 publishable key 不是 JWT：塞进 Bearer 会被拒（实测）
    expect(headers.Authorization).toBeUndefined();
  });

  it('项目暂停（上游 5xx）时返回 503，让 cron 面板显示失败', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 544 })));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await keepalive(req());
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ ok: false, upstream: 544 });
  });

  it('设了 CRON_SECRET 就拒绝不带对的 Bearer 的请求', async () => {
    vi.stubEnv('CRON_SECRET', 's3cret');
    const fetchMock = vi.fn(async () => new Response('1', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    expect((await keepalive(req())).status).toBe(401);
    expect((await keepalive(req('Bearer wrong'))).status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
    expect((await keepalive(req('Bearer s3cret'))).status).toBe(200);
  });
});
