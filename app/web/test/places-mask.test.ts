import { describe, expect, it } from 'vitest';

import { GooglePlaceProvider } from '../src/lib/places/google';

/**
 * 成本护栏（ADR-0007）：FieldMask 是 Places 唯一的成本旋钮。
 * 这里钉死两件 2026-10-01 的决定，免得有人顺手把字段加回去：
 *   - Q11：Text Search 带 `places.location`（不抬档），发现新店才能在 Details 之前按距离过滤；
 *   - Q16①：刷新走 `facts()`，不要 Atmosphere 档的 dineIn / editorialSummary / reviews。
 */

const PLACE = {
  id: 'p1',
  displayName: { text: '测试店' },
  formattedAddress: '1 Main St',
  location: { latitude: 43.85, longitude: -79.33 },
  rating: 4.5,
  userRatingCount: 100,
};

function recordingProvider(body: unknown) {
  const masks: string[] = [];
  const provider = new GooglePlaceProvider({
    apiKey: 'test-key',
    bias: { lat: 43.85, lng: -79.33 },
    fetchImpl: (async (_url: string, init?: RequestInit) => {
      masks.push(new Headers(init?.headers).get('X-Goog-FieldMask') ?? '');
      return new Response(JSON.stringify(body), { status: 200 });
    }) as typeof fetch,
  });
  return { provider, masks };
}

const ATMOSPHERE = ['dineIn', 'editorialSummary', 'reviews'];

describe('Places FieldMask', () => {
  it('刷新（facts）不要 Atmosphere 档字段，也不回传 dineIn', async () => {
    const { provider, masks } = recordingProvider(PLACE);
    const facts = await provider.facts('p1');
    const fields = masks[0].split(',');
    for (const f of ATMOSPHERE) expect(fields).not.toContain(f);
    expect(fields).toEqual(expect.arrayContaining(['regularOpeningHours', 'businessStatus', 'rating', 'location']));
    expect(facts).not.toHaveProperty('dineIn');
  });

  it('导入（details）仍带分类器输入与 dineIn，缺失按有堂食', async () => {
    const { provider, masks } = recordingProvider(PLACE);
    const details = await provider.details('p1');
    expect(masks[0].split(',')).toEqual(expect.arrayContaining(ATMOSPHERE));
    expect(details.dineIn).toBe(true);
  });

  it('Text Search 带坐标，候选上有 lat/lng', async () => {
    const { provider, masks } = recordingProvider({ places: [PLACE] });
    const [c] = await provider.search('川菜');
    expect(masks[0].split(',')).toContain('places.location');
    expect(c).toMatchObject({ lat: 43.85, lng: -79.33 });
  });
});
