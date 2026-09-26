import { beforeEach, describe, expect, it } from 'vitest';

import { SEED_RESTAURANTS } from '../src/data/seed-restaurants';
import { FACTS_TTL_DAYS, isStale } from '../src/lib/places/contract';
import { summarize } from '../src/lib/places/preview';
import { RELEVANCE_THRESHOLD, filterRelevant, isCategoryQuery, relevanceScore } from '../src/lib/places/relevance';
import type { PlaceCandidate, PlaceDetails, Classification } from '../src/lib/places/contract';
import { allRestaurants, importPreview, isInPool, removeImported, staleEntries } from '../src/lib/store/pool';
import { createProfile, setActiveProfile } from '../src/lib/profiles/profiles';
import { setStoreBackend } from '../src/lib/store/backend';

/* localStorage shim（node 环境没有） */
class MemStorage {
  private m = new Map<string, string>();
  get length() { return this.m.size; }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
  clear() { this.m.clear(); }
}

function candidate(name: string): PlaceCandidate {
  return { placeId: `p-${name}`, name, address: 'somewhere' };
}

describe('relevance —— 「还没上 Google 地图」的判定', () => {
  it('中文店名被候选名包含 → 高分', () => {
    expect(relevanceScore('云尚米线 Markham', 'Yunshang Rice Noodle(Unionville)云尚米线'))
      .toBeGreaterThanOrEqual(1);
    expect(relevanceScore('海底捞 Markham', '海底捞火锅 Haidilao')).toBeGreaterThanOrEqual(1);
  });

  it('实测过的误配案例：不存在的店不该匹配到沾边的店', () => {
    // Places 对「阿巴阿巴烧烤 Markham」真的返回过这两家
    expect(relevanceScore('阿巴阿巴烧烤 Markham', '南波万Number One')).toBeLessThan(RELEVANCE_THRESHOLD);
    expect(relevanceScore('阿巴阿巴烧烤 Markham', 'BBQ House')).toBeLessThan(RELEVANCE_THRESHOLD);
  });

  it('只共享一个通用词（烧烤）不算匹配', () => {
    expect(relevanceScore('阿巴阿巴烧烤', '南波万烧烤酒馆')).toBeLessThan(RELEVANCE_THRESHOLD);
  });

  it('纯拉丁店名走 token 覆盖，城市词不参与打分', () => {
    expect(relevanceScore('Pizza Nova Markham', 'Pizza Nova')).toBeGreaterThanOrEqual(1);
    expect(relevanceScore('Pizza Nova Markham', 'Sushi Umi')).toBeLessThan(RELEVANCE_THRESHOLD);
  });

  it('filterRelevant 全不匹配时返回空 → 路由据此报「还没上地图」', () => {
    const { relevant, rejected } = filterRelevant('阿巴阿巴烧烤', [
      candidate('南波万Number One'), candidate('BBQ House'),
    ]);
    expect(relevant).toHaveLength(0);
    expect(rejected).toHaveLength(2);
  });

  it('filterRelevant 按相关度排序', () => {
    const { relevant } = filterRelevant('云尚米线', [
      candidate('别的店 米线'), candidate('云尚米线 Unionville'),
    ]);
    expect(relevant[0]?.name).toContain('云尚米线');
  });
});

describe('抓取摘要', () => {
  const details: PlaceDetails = {
    placeId: 'x', name: '测试店', address: 'a', lat: 43.85, lng: -79.32,
    priceLevel: 2, rating: 4.5, ratingCount: 100,
    serviceWindows: [{ day: null, open: '11:00', close: '22:00' }],
    closedDays: [2], dineIn: true,
  };
  const cls: Classification = {
    primary: 'CN_SICHUAN', tags: ['CN_SICHUAN'], soloFriendly: true, slotLock: [],
    isMainMeal: true, priorBias: 1, confidence: 0.92, reason: '店名含川',
  };

  it('一行覆盖关键事实，人能直接读懂', () => {
    const s = summarize(details, cls, 3, false);
    expect(s).toContain('测试店');
    expect(s).toContain('CN_SICHUAN(0.92)');
    expect(s).toContain('★4.5/100');
    expect(s).toContain('周2休');
    expect(s).toContain('菜品3道');
    expect(s).not.toContain('演示数据');
  });

  it('演示数据会明确标注', () => {
    expect(summarize(details, cls, 0, true)).toContain('演示数据');
  });
});

describe('30 天 TTL', () => {
  const now = new Date('2026-09-25T00:00:00Z');
  it('刚抓的不过期', () => {
    expect(isStale('2026-09-20T00:00:00Z', now)).toBe(false);
  });
  it(`超过 ${FACTS_TTL_DAYS} 天过期`, () => {
    expect(isStale('2026-08-01T00:00:00Z', now)).toBe(true);
  });
  it('时间戳坏掉时按过期处理（宁可重抓也不用错数据）', () => {
    expect(isStale('不是时间', now)).toBe(true);
  });
});

describe('餐厅池合并', () => {
  beforeEach(() => {
    (globalThis as { localStorage?: unknown }).localStorage = new MemStorage();
    setStoreBackend(null);
    const p = createProfile('测试', '🍚');
    setActiveProfile(p.id);
  });

  const imported = {
    ...SEED_RESTAURANTS[0],
    placeId: 'imported-1',
    name: '我自己导入的店',
  };

  it('种子 + 导入合并，摇一摇能摇到新店', () => {
    expect(allRestaurants()).toHaveLength(SEED_RESTAURANTS.length);
    importPreview({
      restaurant: imported, dishes: [], alreadyInPool: false, demo: false,
      fetchedAt: new Date().toISOString(), summary: 's',
    });
    const all = allRestaurants();
    expect(all).toHaveLength(SEED_RESTAURANTS.length + 1);
    expect(all.some((r) => r.placeId === 'imported-1')).toBe(true);
  });

  it('isInPool 对种子店与导入店都成立', () => {
    expect(isInPool(SEED_RESTAURANTS[0].placeId)).toBe(true);
    expect(isInPool('imported-1')).toBe(false);
    importPreview({
      restaurant: imported, dishes: [], alreadyInPool: false, demo: false,
      fetchedAt: new Date().toISOString(), summary: 's',
    });
    expect(isInPool('imported-1')).toBe(true);
  });

  it('重复导入同一家店不会出现两条', () => {
    const preview = {
      restaurant: imported, dishes: [], alreadyInPool: false, demo: false,
      fetchedAt: new Date().toISOString(), summary: 's',
    };
    importPreview(preview);
    importPreview(preview);
    expect(allRestaurants().filter((r) => r.placeId === 'imported-1')).toHaveLength(1);
  });

  it('移除后回到只剩种子', () => {
    importPreview({
      restaurant: imported, dishes: [], alreadyInPool: false, demo: false,
      fetchedAt: new Date().toISOString(), summary: 's',
    });
    removeImported('imported-1');
    expect(allRestaurants()).toHaveLength(SEED_RESTAURANTS.length);
  });

  it('staleEntries 找出超过 30 天没刷新的导入项', () => {
    importPreview({
      restaurant: imported, dishes: [], alreadyInPool: false, demo: false,
      fetchedAt: '2026-01-01T00:00:00Z', summary: 's',
    });
    expect(staleEntries(new Date('2026-09-25T00:00:00Z'))).toHaveLength(1);
    expect(staleEntries(new Date('2026-01-05T00:00:00Z'))).toHaveLength(0);
  });
});

describe('类目查询 vs 店名查询（2026-09-26 批量建目录时发现）', () => {
  it('菜系类目查询跳过名称校验 —— 没有店会叫「韩国烤肉」', () => {
    expect(isCategoryQuery('韩国烤肉 Markham')).toBe(true);
    expect(isCategoryQuery('泰国菜 Markham')).toBe(true);
    expect(isCategoryQuery('steakhouse Markham')).toBe(true);
    expect(isCategoryQuery('Italian restaurant dinner Markham')).toBe(true);
  });

  it('带专名的仍算店名查询，必须走校验', () => {
    expect(isCategoryQuery('云尚米线 Markham')).toBe(false);
    expect(isCategoryQuery('海底捞 Markham')).toBe(false);
    expect(isCategoryQuery('Pizza Nova Markham')).toBe(false);
    expect(isCategoryQuery('阿巴阿巴烧烤 Markham')).toBe(false);
  });

  it('类目查询下 filterRelevant 全部放行', () => {
    const { relevant } = filterRelevant('韩国烤肉 Markham', [
      candidate('Seoul House'), candidate('Kaya Korean BBQ'),
    ]);
    expect(relevant).toHaveLength(2);
  });

  it('店名查询下仍然拦得住不相干的店', () => {
    const { relevant } = filterRelevant('阿巴阿巴烧烤 Markham', [
      candidate('南波万Number One'), candidate('BBQ House'),
    ]);
    expect(relevant).toHaveLength(0);
  });
});
