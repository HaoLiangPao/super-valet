import type { CatalogRestaurant } from '@/lib/catalog/availability';
import type {
  AttentionItem,
  DiscoveredCandidate,
  RefreshFailure,
  RefreshReport,
  RefreshTrigger,
  RestaurantDiff,
} from '@/lib/catalog/refresh-types';

/**
 * ⚠️ 开发期自测专用（S5 spec「自测策略」）。CTO 的 `src/lib/catalog/refresh.ts`
 * / `src/lib/catalog/travel.ts` 交付前，用这份契约形状的假数据完成 UI 走查。
 *
 * 不在生产路径上：`dataSource.ts` 的 `USE_STUB` 为 `false` 时这个文件不会被调用。
 * 交付前不删除这个文件——它仍然是往后二次自测最快的路径，只是不再被引用。
 */

let stubFetchCount = 0;
const stubReports: RefreshReport[] = [];

function fakeCatalogRestaurant(overrides: Partial<CatalogRestaurant>): CatalogRestaurant {
  return {
    placeId: 'stub-unknown',
    name: '未命名',
    address: 'Markham, ON',
    lat: 43.8536,
    lng: -79.3227,
    primary: 'CN_HOTPOT',
    tags: ['CN_HOTPOT'],
    soloFriendly: true,
    slotLock: ['dinner'],
    isMainMeal: true,
    priorBias: 1,
    dineIn: true,
    priceLevel: 2,
    rating: 4.3,
    ratingCount: 120,
    closedDays: [],
    serviceWindows: [],
    distanceKm: 3.2,
    bucket: 'NEAR',
    confidence: 0.9,
    reason: 'stub',
    ...overrides,
  };
}

const STUB_UPDATED: RestaurantDiff[] = [
  {
    placeId: 'stub-haidilao',
    name: '海底捞火锅',
    changes: [{ field: 'rating', before: 4.8, after: 4.7 }],
    businessStatus: 'OPERATIONAL',
    fetchedAt: new Date().toISOString(),
  },
  {
    placeId: 'stub-liangxin',
    name: '良心冰室',
    changes: [{ field: 'serviceWindows', before: '3 段', after: '2 段', structural: true }],
    businessStatus: 'OPERATIONAL',
    fetchedAt: new Date().toISOString(),
  },
];

const STUB_DISCOVERED: DiscoveredCandidate[] = [
  {
    restaurant: fakeCatalogRestaurant({
      placeId: 'stub-new-1',
      name: '新发现·川味小馆（stub）',
      primary: 'CN_SICHUAN',
      tags: ['CN_SICHUAN'],
      distanceKm: 2.1,
    }),
    viaCategory: 'CN_SPICY',
    distanceKm: 2.1,
  },
  {
    restaurant: fakeCatalogRestaurant({
      placeId: 'stub-new-2',
      name: '新发现·寿司吧（stub）',
      primary: 'AS_SUSHI',
      tags: ['AS_SUSHI'],
      distanceKm: 4.4,
    }),
    viaCategory: 'AS_JAPANESE',
    distanceKm: 4.4,
  },
];

const STUB_ATTENTION: AttentionItem[] = [
  {
    placeId: 'stub-shutdown',
    name: '廿一筷子（stub）',
    businessStatus: 'CLOSED_PERMANENTLY',
    suggestedReason: 'closed_permanently',
  },
];

const STUB_FAILED: RefreshFailure[] = [
  { placeId: 'stub-fail-1', name: '某某茶餐厅（stub）', message: '网络问题，下次再试' },
];

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function stubRunRefresh(trigger: RefreshTrigger): Promise<RefreshReport> {
  await delay(1400); // 模拟真实抓取的耗时，让雷达动画有意义
  const startedAt = new Date(Date.now() - 1400).toISOString();
  const finishedAt = new Date().toISOString();
  stubFetchCount += STUB_UPDATED.length + STUB_DISCOVERED.length + 1;
  const report: RefreshReport = {
    id: `stub-${stubFetchCount}`,
    trigger,
    startedAt,
    finishedAt,
    updated: STUB_UPDATED,
    discovered: trigger === 'manual' ? STUB_DISCOVERED : [],
    needsAttention: STUB_ATTENTION,
    failed: STUB_FAILED,
    fetchCount: STUB_UPDATED.length + STUB_DISCOVERED.length + STUB_FAILED.length,
    unchanged: 8,
  };
  stubReports.unshift(report);
  return report;
}

export function stubLoadReports(): RefreshReport[] {
  return stubReports;
}

export function stubTravelEstimate(km: number): { mode: 'walk' | 'drive'; minutes: number } {
  // design/0009 §4.4 的启发式公式，仅供自测用；正式实现在 CTO 的 travel.ts。
  if (km < 1.2) return { mode: 'walk', minutes: Math.max(1, Math.round(km * 12)) };
  return { mode: 'drive', minutes: Math.max(1, Math.round((km * 1.3) / 35 * 60 + 3)) };
}
