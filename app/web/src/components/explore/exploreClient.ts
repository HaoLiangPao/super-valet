/**
 * EXPLORE 页的数据层——只认 src/lib/places/contract.ts §5 的三个端点。
 *
 * 默认真实 fetch。设环境变量 NEXT_PUBLIC_EXPLORE_MOCK=1 时改用本文件内的
 * 确定性假数据（用于 CTO 的 Route Handler 还没就绪时本地自测 UI），与契约里
 * 服务端自己的 `demo` 字段是两回事——这里全部固定返回 demo:true，
 * 因为「用的是本文件的假数据」本身就符合 demo 的语义。
 *
 * 交付前确认：默认（不设环境变量）就是真实 fetch，本文件不需要额外「关掉」的开关。
 *
 * mock 测试用的触发词（仅 NEXT_PUBLIC_EXPLORE_MOCK=1 时生效）：
 *   搜索 query 含「查无」或整串为空 → 空结果
 *   搜索 query 含「崩溃」          → 抛出 ApiError 形状的错误
 *   笔记 text 含「没有店名」        → 抽取结果 queries 为空
 *   候选 placeId = mock-lowconf-1  → 预览低置信度（<0.7）
 *   候选 placeId = mock-inpool-1   → 预览 alreadyInPool = true
 */
import { logFetch } from '@/lib/store/pool';
import type {
  AnalyzeResponse,
  DishMention,
  ImportPreview,
  PlaceCandidate,
  SearchResponse,
} from '@/lib/places/contract';

const USE_MOCK = process.env.NEXT_PUBLIC_EXPLORE_MOCK === '1';

function delay<T>(value: T, ms = 550): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), ms);
  });
}

async function postJson<TRes>(url: string, body: unknown): Promise<TRes> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('网络好像断了，检查一下连接再试试');
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new Error('服务器返回的内容没看懂，稍后再试');
  }

  const maybeError = data as { error?: boolean; message?: string };
  if (!res.ok || maybeError?.error) {
    throw new Error(maybeError?.message || '出错了，稍后再试');
  }
  return data as TRes;
}

// ── mock fixtures（仅自测用）─────────────────────────────────────────

const MOCK_CANDIDATES: PlaceCandidate[] = [
  {
    placeId: 'mock-normal-1',
    name: '蜀香园 Markham',
    address: '3255 Hwy 7, Markham',
    primaryType: 'restaurant',
    rating: 4.4,
    ratingCount: 612,
  },
  {
    placeId: 'mock-lowconf-1',
    name: '角落小馆',
    address: '88 Copper Creek Dr, Markham',
    primaryType: 'restaurant',
    rating: 4.1,
    ratingCount: 58,
  },
  {
    placeId: 'mock-inpool-1',
    name: '15th Ave Cafe & Bistro',
    address: '169 Enterprise Blvd, Markham',
    primaryType: 'cafe',
    rating: 4.2,
    ratingCount: 301,
  },
];

const MOCK_DISHES: DishMention[] = [
  { name: '水煮鱼', quote: '水煮鱼绝了，鱼片很嫩', sentiment: 'positive' },
  { name: '麻辣香锅', quote: '香锅也不错', sentiment: 'positive' },
];

type MockBaseFields = Omit<ImportPreview['restaurant'], 'name' | 'primary' | 'confidence' | 'reason'>;

function mockRestaurant(placeId: string): ImportPreview['restaurant'] {
  const base: MockBaseFields = {
    placeId,
    address: '3255 Hwy 7, Markham',
    lat: 43.8536,
    lng: -79.3227,
    tags: ['辣', '适合聚餐'],
    soloFriendly: false,
    slotLock: ['dinner'],
    isMainMeal: true,
    priorBias: 0,
    dineIn: true,
    priceLevel: 2,
    rating: 4.4,
    ratingCount: 612,
    closedDays: [],
    serviceWindows: [{ day: null, open: '11:00', close: '21:30' }],
    distanceKm: 3.2,
    bucket: 'NEAR',
  };
  if (placeId === 'mock-lowconf-1') {
    return {
      ...base,
      name: '角落小馆',
      primary: 'CN_FAST',
      confidence: 0.52,
      reason: '菜单信息少，规则表没命中，LLM 猜的',
    };
  }
  if (placeId === 'mock-inpool-1') {
    return {
      ...base,
      name: '15th Ave Cafe & Bistro',
      primary: 'WS_CAFE',
      confidence: 0.91,
      reason: '评论区常提到手冲和司康',
    };
  }
  return {
    ...base,
    name: '蜀香园 Markham',
    primary: 'CN_SICHUAN',
    confidence: 0.93,
    reason: '评论多次提到水煮鱼、麻辣香锅',
  };
}

// ── 三个契约端点 ────────────────────────────────────────────────────

function nowIso(): string {
  return new Date().toISOString();
}

export async function searchPlaces(query: string): Promise<SearchResponse> {
  if (USE_MOCK) {
    const trimmed = query.trim();
    if (trimmed.includes('崩溃')) {
      await delay(null, 200);
      throw new Error('演示：Places 配额用完了，稍后再试');
    }
    if (trimmed.includes('查无') || trimmed.length === 0) {
      return delay({ candidates: [], demo: true });
    }
    return delay({ candidates: MOCK_CANDIDATES, demo: true });
  }
  try {
    const res = await postJson<SearchResponse>('/api/explore/search', { query });
    logFetch({
      at: nowIso(), kind: 'search', query, outcome: 'ok',
      provider: res.demo ? 'fixture' : 'google', resultCount: res.candidates.length,
    });
    return res;
  } catch (err) {
    // 「没上 Google 地图」是 404，与真故障分开记，方便日后统计新店比例
    const notFound = err instanceof Error && /地图上还查不到/.test(err.message);
    logFetch({
      at: nowIso(), kind: 'search', query, provider: 'google',
      outcome: notFound ? 'not_found' : 'error',
      ...(err instanceof Error ? { note: err.message.slice(0, 120) } : {}),
    });
    throw err;
  }
}

export async function analyzeNote(text: string): Promise<AnalyzeResponse> {
  if (USE_MOCK) {
    if (text.includes('没有店名') || text.trim().length === 0) {
      return delay({ queries: [], dishes: [], demo: true });
    }
    return delay({
      queries: ['蜀香园 Markham', '角落小馆'],
      dishes: MOCK_DISHES,
      demo: true,
    });
  }
  try {
    const res = await postJson<AnalyzeResponse>('/api/explore/analyze', { text });
    logFetch({
      at: nowIso(), kind: 'analyze', query: text.slice(0, 80),
      provider: res.demo ? 'fixture-llm' : 'deepseek',
      resultCount: res.queries.length, outcome: 'ok',
      note: `菜品 ${res.dishes.length} 道`,
    });
    return res;
  } catch (err) {
    logFetch({
      at: nowIso(), kind: 'analyze', query: text.slice(0, 80),
      provider: 'deepseek', outcome: 'error',
      ...(err instanceof Error ? { note: err.message.slice(0, 120) } : {}),
    });
    throw err;
  }
}

export async function previewPlace(
  placeId: string,
  dishes?: DishMention[],
): Promise<ImportPreview> {
  if (USE_MOCK) {
    return delay({
      restaurant: mockRestaurant(placeId),
      dishes: dishes ?? [],
      fetchedAt: new Date().toISOString(),
    summary: '本地占位预览（未联网）',
    alreadyInPool: placeId === 'mock-inpool-1',
      demo: true,
    });
  }
  try {
    const res = await postJson<ImportPreview>('/api/explore/preview', { placeId, dishes });
    logFetch({
      at: nowIso(), kind: 'preview', placeId,
      placeName: res.restaurant.name,
      provider: res.demo ? 'fixture' : 'google',
      outcome: 'ok', note: res.summary,
    });
    return res;
  } catch (err) {
    logFetch({
      at: nowIso(), kind: 'preview', placeId, provider: 'google', outcome: 'error',
      ...(err instanceof Error ? { note: err.message.slice(0, 120) } : {}),
    });
    throw err;
  }
}
