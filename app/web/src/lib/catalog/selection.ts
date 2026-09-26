import { PRESET_PACKAGES } from '@/data/packages';
import { SEED_RESTAURANTS } from '@/data/seed-restaurants';
import { currentBackend } from '@/lib/store/backend';
import type { PoolSelection } from './types';

/**
 * 池子选择（selection）—— 用户**显式选中**的 placeId 列表（ADR-0008 决策 1）。
 *
 * 与目录的关系：目录是库存，selection 是「我要哪些」。摇一摇看到的是
 * `localize.ts` 把两者相交、再按当前位置过滤之后的结果。
 *
 * ⚠️ 向后兼容的唯一保证都在 `effectiveSelection()` 上：
 * 没有选择记录（`null`）时池子 = 原来的 15 家种子，行为与目录轮之前逐字节一致。
 * 这条有测试锁死（test/catalog.test.ts「没有选择记录」一节），别绕过它。
 */

/** 老用户的默认池子：15 家种子，顺序与 `SEED_RESTAURANTS` 一致 */
export const SEED_PLACE_IDS: readonly string[] = SEED_RESTAURANTS.map((r) => r.placeId);

/** 去重 + 丢脏值；存的是用户数据，不能假设它长得对 */
function sanitize(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const v of raw) {
    if (typeof v === 'string' && v.length > 0 && !seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out;
}

/**
 * 原样读：`null` = 用户从没做过选择。
 * 需要「实际生效的池子」请用 `effectiveSelection()`，别自己判 null。
 */
export function loadSelection(): PoolSelection {
  const raw = currentBackend().loadSelection();
  return raw === null ? null : sanitize(raw);
}

/** 实际生效的池子 id 列表；`null` → 15 家种子 */
export function effectiveSelection(): string[] {
  return loadSelection() ?? [...SEED_PLACE_IDS];
}

/** 传 `null` = 抹掉选择记录，回到「跟着种子走」的默认态 */
export function saveSelection(selection: PoolSelection): void {
  currentBackend().saveSelection(selection === null ? null : sanitize(selection));
}

export function isSelected(placeId: string): boolean {
  return effectiveSelection().includes(placeId);
}

export function selectionSize(): number {
  return effectiveSelection().length;
}

/**
 * 并入若干 placeId，返回新的选择列表。
 *
 * 起点是 **effectiveSelection()** 而不是空列表：老用户第一次点「加入」时，
 * 必须先把默认的 15 家落成显式记录，否则加一家 = 池子从 15 掉到 1。
 */
export function addToSelection(ids: string[]): string[] {
  const next = effectiveSelection();
  const seen = new Set(next);
  for (const id of sanitize(ids)) {
    if (!seen.has(id)) {
      seen.add(id);
      next.push(id);
    }
  }
  saveSelection(next);
  return next;
}

/** 移除一家；只动 selection，不删导入记录/后验/历史（design/0006 §4.4） */
export function removeFromSelection(placeId: string): string[] {
  const next = effectiveSelection().filter((id) => id !== placeId);
  saveSelection(next);
  return next;
}

/** 回到「从没选过」的状态（UI 的「恢复默认池子」） */
export function resetSelection(): void {
  saveSelection(null);
}

export interface ApplyPackageResult {
  /** 这次真正新加进池子的家数（已有的不重复计） */
  added: number;
  selection: string[];
}

/**
 * 加入套餐 = 把套餐成员并进 selection（ADR-0008 决策 1）。
 * 之后用户可以单独删掉其中任何一家 —— 套餐只是一次批量操作，不是一层持久分组。
 *
 * 这里直接读 `PRESET_PACKAGES` 而不是走 `packages.ts`：`packages.ts` 的
 * `packageStats()` 要读 selection，反过来 import 会形成模块环。
 */
export function applyPackage(pkgId: string): ApplyPackageResult {
  const list = Array.isArray(PRESET_PACKAGES) ? PRESET_PACKAGES : [];
  const pkg = list.find((p) => p.id === pkgId);
  if (!pkg) return { added: 0, selection: effectiveSelection() };

  const before = effectiveSelection().length;
  const selection = addToSelection(pkg.placeIds);
  return { added: selection.length - before, selection };
}
