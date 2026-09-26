import { CATALOG } from '@/data/catalog';
import { SEED_RESTAURANTS } from '@/data/seed-restaurants';
import type { Restaurant } from '@/lib/engine/types';
import { currentBackend } from '@/lib/store/backend';

/**
 * 目录（catalog）—— 「我们知道的全部餐厅」，与「用户选进池子的餐厅」严格分开
 * （ADR-0008 决策 1）。池子那一半在 `selection.ts`。
 *
 * 三个来源，后面的覆盖前面的（同 placeId 以更新的事实为准）：
 *   1. `SEED_RESTAURANTS`  —— 15 家种子，**永远在目录里**
 *   2. `@/data/catalog` 的 `CATALOG` —— 离线脚本批量抓取生成的静态目录
 *   3. 当前身份自己导入的（`loadPool()`）—— 用户亲手抓的，最权威
 *
 * 为什么把种子当「地板」而不是「CATALOG 存在就整体替换」：
 * 老用户的默认池子就是这 15 个 placeId（见 `selection.ts`）。如果生成的
 * CATALOG 漏了其中任何一家，向后兼容保证会当场破掉、而且症状是「池子莫名变小」
 * 这种很难追的问题。把种子并进来，这条保证与目录数据怎么生成无关。
 */

function staticList(): Restaurant[] {
  // CATALOG 由另一条线生成，可能还是空占位；也可能哪天生成脚本出错导出了非数组
  return Array.isArray(CATALOG) ? CATALOG : [];
}

/** 静态目录：CATALOG（若已生成）叠在 15 家种子之上；不含用户导入的 */
export function staticCatalog(): Restaurant[] {
  const byId = new Map<string, Restaurant>();
  for (const r of SEED_RESTAURANTS) byId.set(r.placeId, r);
  for (const r of staticList()) byId.set(r.placeId, r);
  return [...byId.values()];
}

/** 目录全量 = 静态目录 ∪ 当前身份导入的 */
export function allCatalog(): Restaurant[] {
  const byId = catalogIndex();
  return [...byId.values()];
}

/** 同上，但给出按 placeId 的索引 —— 选择集要按 id 查表，别 O(n²) */
export function catalogIndex(): Map<string, Restaurant> {
  const byId = new Map<string, Restaurant>();
  for (const r of staticCatalog()) byId.set(r.placeId, r);
  for (const e of currentBackend().loadPool()) byId.set(e.restaurant.placeId, e.restaurant);
  return byId;
}

export function findInCatalog(placeId: string): Restaurant | null {
  return catalogIndex().get(placeId) ?? null;
}

/** 目录里有这家店（≠ 在池子里，后者问 `selection.isSelected`） */
export function isInCatalog(placeId: string): boolean {
  return catalogIndex().has(placeId);
}
