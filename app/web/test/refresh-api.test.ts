import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { POST as detailsRoute } from '../src/app/api/refresh/details/route';
import { POST as discoverRoute } from '../src/app/api/refresh/discover/route';
import { POST as previewRoute } from '../src/app/api/explore/preview/route';
import {
  MANUAL_DISCOVERY_QUERY_LIMIT, REFRESH_BATCH_LIMIT,
} from '../src/lib/catalog/refresh-types';
import { FIXTURE_PLACES } from '../src/lib/places/fixture';
import { LLM_KEY_ENV, PLACES_KEY_ENV } from '../src/lib/places/providers';
import { httpRefreshPort } from '../src/lib/places/refresh-fetch';
import type {
  ApiError, RefreshDetailsResponse, RefreshDiscoverResponse,
} from '../src/lib/places/contract';

/**
 * 两个刷新端点（`/api/refresh/details`、`/api/refresh/discover`）。
 *
 * **不打真网**：测试里把 `GOOGLE_PLACES_API_KEY` 摘掉，`resolveProviders()`
 * 因此回落到 `FixturePlaceProvider`（这正是「缺密钥也能开发验收」的设计，
 * ADR-0007 §3）。有密钥的机器上也不会误调计费 API。
 *
 * 这一组锁死两件事：
 *   1. **节制条款在服务端也挡得住** —— 客户端的常量是约定，400 才是护栏；
 *   2. **一家（一个类目）失败不连坐** —— 其余照常返回，失败进 `error` 字段。
 */

const HOTPOT = FIXTURE_PLACES.find((p) => p.keywords.includes('火锅'))!;

function post(url: string, body: unknown): Request {
  return new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

let savedKey: string | undefined;

beforeEach(() => {
  savedKey = process.env[PLACES_KEY_ENV];
  delete process.env[PLACES_KEY_ENV];
});

afterEach(() => {
  if (savedKey === undefined) delete process.env[PLACES_KEY_ENV];
  else process.env[PLACES_KEY_ENV] = savedKey;
});

describe('POST /api/refresh/details', () => {
  it('批量返回事实，并如实标注这是演示数据', async () => {
    const res = await detailsRoute(post('http://t/api/refresh/details', {
      placeIds: [HOTPOT.placeId],
    }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as RefreshDetailsResponse;
    expect(body.demo).toBe(true);
    expect(body.results).toHaveLength(1);
    expect(body.results[0].placeId).toBe(HOTPOT.placeId);
    expect(body.results[0].details?.name).toBe(HOTPOT.name);
    // 刷新端点**不做分类**：返回的是 PlaceDetails，没有 primary 这种判断字段
    expect(body.results[0].details).not.toHaveProperty('primary');
  });

  it('查不到的那一家只标自己，其余照常返回（不整批失败）', async () => {
    const res = await detailsRoute(post('http://t/api/refresh/details', {
      placeIds: ['不存在的-place-id', HOTPOT.placeId],
    }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as RefreshDetailsResponse;
    expect(body.results).toHaveLength(2);
    const bad = body.results.find((r) => r.placeId === '不存在的-place-id')!;
    expect(bad.details).toBeUndefined();
    expect(bad.error?.message).toBeTruthy();
    expect(bad.error?.code).toBe('places.not_found');
    expect(body.results.find((r) => r.placeId === HOTPOT.placeId)?.details).toBeTruthy();
  });

  it('节制条款：超过 REFRESH_BATCH_LIMIT 直接 400（服务端才是护栏）', async () => {
    const tooMany = Array.from({ length: REFRESH_BATCH_LIMIT + 1 }, (_, i) => `p-${i}`);
    const res = await detailsRoute(post('http://t/api/refresh/details', { placeIds: tooMany }));
    expect(res.status).toBe(400);
    const body = (await res.json()) as ApiError & { code?: string };
    expect(body.error).toBe(true);
    expect(body.code).toBe('validation.too_long');
  });

  it('空列表 / 脏输入 400，且不泄漏异常栈', async () => {
    for (const bad of [{}, { placeIds: [] }, { placeIds: 'x' }, { placeIds: [42] }, { placeIds: [''] }]) {
      const res = await detailsRoute(post('http://t/api/refresh/details', bad));
      expect(res.status).toBe(400);
      const body = (await res.json()) as ApiError;
      expect(body.error).toBe(true);
      expect(body.message).not.toMatch(/Error|at /);
    }
  });

  it('重复的 placeId 只抓一次', async () => {
    const res = await detailsRoute(post('http://t/api/refresh/details', {
      placeIds: [HOTPOT.placeId, HOTPOT.placeId],
    }));
    const body = (await res.json()) as RefreshDetailsResponse;
    expect(body.results).toHaveLength(1);
  });
});

describe('POST /api/refresh/discover', () => {
  it('按类目词返回候选（只到候选为止，不返回可入池的餐厅）', async () => {
    const res = await discoverRoute(post('http://t/api/refresh/discover', {
      queries: ['火锅'],
      bias: { lat: 43.8536, lng: -79.3227 },
    }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as RefreshDiscoverResponse;
    expect(body.demo).toBe(true);
    expect(body.results).toHaveLength(1);
    expect(body.results[0].query).toBe('火锅');
    expect(body.results[0].candidates.map((c) => c.placeId)).toContain(HOTPOT.placeId);
    // 候选没有分类字段 —— 分类要等用户勾选后走 preview
    expect(body.results[0].candidates[0]).not.toHaveProperty('primary');
  });

  it('类目查询会被相关性过滤原样放行（店名校验只对店名查询生效）', async () => {
    const res = await discoverRoute(post('http://t/api/refresh/discover', { queries: ['寿司'] }));
    const body = (await res.json()) as RefreshDiscoverResponse;
    expect(body.results[0].candidates.length).toBeGreaterThan(0);
  });

  it('节制条款：超过 MANUAL_DISCOVERY_QUERY_LIMIT 直接 400', async () => {
    const tooMany = Array.from({ length: MANUAL_DISCOVERY_QUERY_LIMIT + 1 }, (_, i) => `类目${i}`);
    const res = await discoverRoute(post('http://t/api/refresh/discover', { queries: tooMany }));
    expect(res.status).toBe(400);
    expect(((await res.json()) as { code?: string }).code).toBe('validation.too_long');
  });

  it('位置格式不对 400（不会把脏坐标当偏置发出去）', async () => {
    for (const bias of [{ lat: 'x', lng: 0 }, { lat: 200, lng: 0 }, { lat: Number.NaN, lng: 0 }]) {
      const res = await discoverRoute(post('http://t/api/refresh/discover', {
        queries: ['火锅'], bias,
      }));
      expect(res.status).toBe(400);
    }
  });

  it('不给 bias 也能跑（退回导入锚点）', async () => {
    const res = await discoverRoute(post('http://t/api/refresh/discover', { queries: ['火锅'] }));
    expect(res.status).toBe(200);
  });
});

/* ------------------------------------------------------------------ *
 * httpRefreshPort ↔ Route Handler 的对接（两半必须说同一种话）
 * ------------------------------------------------------------------ */

describe('httpRefreshPort 与端点对接', () => {
  let savedFetch: typeof globalThis.fetch;
  let savedLlmKey: string | undefined;

  beforeEach(() => {
    savedLlmKey = process.env[LLM_KEY_ENV];
    delete process.env[LLM_KEY_ENV];
    savedFetch = globalThis.fetch;
    // 把 fetch 接到真正的 Route Handler 上：端口 → HTTP body → 路由校验 →
    // fixture provider → 响应 JSON → 端口解析，整条线在进程内跑通，**零配额**。
    globalThis.fetch = (async (input: string, init?: RequestInit) => {
      const url = String(input);
      const req = new Request(`http://test${url}`, init);
      if (url.startsWith('/api/refresh/details')) return detailsRoute(req);
      if (url.startsWith('/api/refresh/discover')) return discoverRoute(req);
      if (url.startsWith('/api/explore/preview')) return previewRoute(req);
      throw new Error(`没接上的端点: ${url}`);
    }) as typeof globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = savedFetch;
    if (savedLlmKey === undefined) delete process.env[LLM_KEY_ENV];
    else process.env[LLM_KEY_ENV] = savedLlmKey;
  });

  it('detailsBatch 拿到事实，失败的那一条带着可读的短句', async () => {
    const port = httpRefreshPort();
    const outcomes = await port.detailsBatch([HOTPOT.placeId, '查无此店']);
    expect(outcomes).toHaveLength(2);
    const ok = outcomes.find((o) => o.placeId === HOTPOT.placeId)!;
    expect(ok.details?.rating).toBe(HOTPOT.rating);
    expect(ok.error).toBeUndefined();
    const bad = outcomes.find((o) => o.placeId === '查无此店')!;
    expect(bad.details).toBeUndefined();
    expect(bad.error).toBeTruthy();
    // 服务端告知这是 fixture → 台账如实记 provider
    expect(port.providerName).toBe('fixture');
  });

  it('discover + preview 串起来：候选 → 已分类的餐厅', async () => {
    const port = httpRefreshPort();
    const found = await port.discover(['火锅'], { lat: 43.8536, lng: -79.3227 });
    expect(found).toHaveLength(1);
    expect(found[0].candidates.map((c) => c.placeId)).toContain(HOTPOT.placeId);

    const preview = await port.preview(HOTPOT.placeId);
    expect(preview.restaurant.placeId).toBe(HOTPOT.placeId);
    expect(preview.restaurant.primary).toBeTruthy();
    expect(preview.demo).toBe(true);
  });

  it('整批失败（端点 4xx）抛出可读的错误，让流水线把每一家都记成失败', async () => {
    const port = httpRefreshPort();
    const tooMany = Array.from({ length: REFRESH_BATCH_LIMIT + 1 }, (_, i) => `p-${i}`);
    // 端口按 design/0007 §4 优先查 i18n 字典（`apiError.validation.too_long`），
    // 所以抛出来的是字典里那句而不是服务端的「一次最多刷新 20 家」——
    // 用户碰不到这条（界面永远按 REFRESH_BATCH_LIMIT 切批），它是给开发者的护栏。
    await expect(port.detailsBatch(tooMany)).rejects.toThrow(/太长/);
  });

  it('空输入不发请求（省一次往返）', async () => {
    const port = httpRefreshPort();
    globalThis.fetch = (() => {
      throw new Error('不该发请求');
    }) as typeof globalThis.fetch;
    expect(await port.detailsBatch([])).toEqual([]);
    expect(await port.discover([], { lat: 0, lng: 0 })).toEqual([]);
  });
});
