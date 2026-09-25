import { SEED_RESTAURANTS } from '@/data/seed-restaurants';
import type { Restaurant } from '@/lib/engine/types';
import type { FetchLogEntry, ImportPreview } from '@/lib/places/contract';
import { isStale } from '@/lib/places/contract';
import { currentBackend } from './backend';
import type { PoolEntry } from './backend';

/**
 * 餐厅池的唯一读取入口（design/0005 §4.5）。
 *
 * 引擎和页面只该调这里，不该再直接 import SEED_RESTAURANTS ——
 * 否则用户自己导入的店永远摇不到。
 */

/** 种子 15 家 + 当前身份导入的；同 placeId 以导入的为准（用户自己抓的更新） */
export function allRestaurants(): Restaurant[] {
  const imported = currentBackend().loadPool();
  const byId = new Map<string, Restaurant>();
  for (const r of SEED_RESTAURANTS) byId.set(r.placeId, r);
  for (const e of imported) byId.set(e.restaurant.placeId, e.restaurant);
  return [...byId.values()];
}

export function isInPool(placeId: string): boolean {
  if (SEED_RESTAURANTS.some((r) => r.placeId === placeId)) return true;
  return currentBackend().loadPool().some((e) => e.restaurant.placeId === placeId);
}

/** 把一次预览确认为导入 */
export function importPreview(preview: ImportPreview, sourceText?: string): void {
  const entry: PoolEntry = {
    restaurant: preview.restaurant,
    dishes: preview.dishes,
    addedAt: new Date().toISOString(),
    fetchedAt: preview.fetchedAt,
    summary: preview.summary,
    ...(sourceText ? { sourceText } : {}),
  };
  currentBackend().addToPool(entry);
}

export function removeImported(placeId: string): void {
  currentBackend().removeFromPool(placeId);
}

/**
 * 事实数据过期（>30 天）的导入项（design/0005 §4.8）。
 * 池子页拿它标「信息可能过时」并提供重新抓取。
 */
export function staleEntries(now: Date = new Date()): PoolEntry[] {
  return currentBackend()
    .loadPool()
    .filter((e) => isStale(e.fetchedAt ?? e.addedAt, now));
}

/** 记一行抓取台账；失败绝不能影响主流程 */
export function logFetch(entry: FetchLogEntry): void {
  try {
    currentBackend().appendFetchLog(entry);
  } catch {
    // 台账是观测用的，坏了就坏了，不许带崩导入
  }
}

export function recentFetchLog(): FetchLogEntry[] {
  return currentBackend().loadFetchLog();
}
