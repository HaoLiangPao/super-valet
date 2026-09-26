import { PRESET_PACKAGES } from '@/data/packages';
import type { RestaurantPackage } from './types';
import { effectiveSelection } from './selection';

/**
 * 预设套餐（design/0006 §4.2）—— 我们自己维护的「目录的命名子集」。
 *
 * 成员是显式挑选的 placeId，不是动态条件：「精选中餐」要由人挑过才敢叫精选，
 * `rating > 4.5` 会把刷分店和奶茶店卷进来。
 *
 * 数据由 `@/data/packages` 提供，可能还是空占位（创始人那条线生成）——
 * 空的时候套餐入口自然为空，不影响池子与摇一摇。
 */

export function allPackages(): RestaurantPackage[] {
  return Array.isArray(PRESET_PACKAGES) ? PRESET_PACKAGES : [];
}

export function findPackage(id: string): RestaurantPackage | null {
  return allPackages().find((p) => p.id === id) ?? null;
}

export interface PackageStats {
  /** 套餐一共几家（去重后） */
  total: number;
  /** 其中已经在你池子里的几家 —— UI 显示「共 N 家 · 你已有 M 家」 */
  alreadyInPool: number;
}

export function packageStats(pkg: RestaurantPackage): PackageStats {
  const ids = new Set(pkg.placeIds);
  const selected = new Set(effectiveSelection());
  let alreadyInPool = 0;
  for (const id of ids) if (selected.has(id)) alreadyInPool += 1;
  return { total: ids.size, alreadyInPool };
}
