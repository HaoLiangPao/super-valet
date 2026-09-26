import { haversineKm, toBucket } from '@/data/seed-restaurants';
import type { Restaurant } from '@/lib/engine/types';
import { allCatalog, catalogIndex } from './catalog';
import { loadLocationPrefs, radiusKm, resolveLocation } from './location';
import { effectiveSelection } from './selection';
import type { LocalizedPool, LocationPrefs } from './types';

/**
 * 本地化视图 —— 本轮的技术核心（ADR-0008 决策 2）。
 *
 * 距离不是餐厅的属性，是「餐厅 × 当前位置」的函数。记录里的 `distanceKm` 是
 * 导入时按 Downtown Markham 算的，只能当兜底展示；**推荐与筛选一律用这里重算的值**。
 *
 *   目录 ∩ selection → 按当前位置重算 distanceKm/bucket → 按半径硬过滤
 *
 * 返回的仍然是 `Restaurant`，所以 `eligible()` / `scoring` / `rollOnce`
 * 一行都不用改，71 个既有测试全部继续有效。
 */

/** 与 `recomputeDistances()` 保持一致：展示用一位小数，分档用未取整的真值 */
function withDistance(r: Restaurant, km: number): Restaurant {
  return { ...r, distanceKm: Math.round(km * 10) / 10, bucket: toBucket(km) };
}

/** 单家店按给定位置重算距离；只动 `distanceKm` / `bucket`，其余字段原样 */
export function localizeRestaurant(r: Restaurant, at: { lat: number; lng: number }): Restaurant {
  return withDistance(r, haversineKm(at.lat, at.lng, r.lat, r.lng));
}

export function localizeRestaurants(list: Restaurant[], at: { lat: number; lng: number }): Restaurant[] {
  return list.map((r) => localizeRestaurant(r, at));
}

/**
 * 池子的本地化视图：喂给引擎的就是 `localizedPool().restaurants`。
 *
 * 半径过滤用严格小于（`km < radiusKm`），于是「半径档位」与「bucket 档位」
 * 完全同构：WALK 留下的正好是 bucket==='WALK' 的那些，MID 留下 WALK/NEAR/MID。
 * 两套阈值同源（`RADIUS_KM` 与 `toBucket`），UI 上不会出现「显示 NEAR 却被
 * WALK 半径留下来」这种自相矛盾。
 *
 * `filteredOut` 只统计**因为超出半径**被挡掉的家数；选择记录里指向目录里
 * 已经不存在的店（导入后又删了原始记录）直接跳过，不算进去 —— 那不是半径的错，
 * 提示「放宽半径还能看到 N 家」时把它算进去就是说谎。
 */
export function localizedPool(prefs: LocationPrefs = loadLocationPrefs()): LocalizedPool {
  const usedLocation = resolveLocation(prefs);
  const limit = radiusKm(prefs.radius);
  const unlimited = !Number.isFinite(limit);
  const catalog = catalogIndex();

  const restaurants: Restaurant[] = [];
  let filteredOut = 0;
  for (const placeId of effectiveSelection()) {
    const base = catalog.get(placeId);
    if (!base) continue;
    const km = haversineKm(usedLocation.lat, usedLocation.lng, base.lat, base.lng);
    if (!unlimited && !(km < limit)) {
      filteredOut += 1;
      continue;
    }
    restaurants.push(withDistance(base, km));
  }

  return { restaurants, filteredOut, usedLocation };
}

/** 喂给引擎的那一份；`localizedPool().restaurants` 的简写 */
export function poolRestaurants(prefs?: LocationPrefs): Restaurant[] {
  return localizedPool(prefs).restaurants;
}

/**
 * 整个目录的本地化视图（不按 selection、不按半径过滤）。
 * 套餐浏览页与 EXPLORE 要给「还没进池子」的店显示距离，用这个。
 */
export function localizedCatalog(prefs: LocationPrefs = loadLocationPrefs()): Restaurant[] {
  return localizeRestaurants(allCatalog(), resolveLocation(prefs));
}
