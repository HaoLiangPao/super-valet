import { currentBackend } from '@/lib/store/backend';
import { catalogIndex } from './catalog';
import { addToSelection, effectiveSelection, removeFromSelection } from './selection';
import { businessStatusOf, suggestedReason } from './availability';
import type { ArchiveEntry, ArchiveReason, CatalogRestaurant } from './availability';

/**
 * 归档集合（ADR-0009）—— 「它还在我的世界里，只是去不了了」。
 *
 * 三个集合的分工，搞混会出人命（说的是数据）：
 *   目录 catalog    我们知道的全部餐厅（静态 + 用户导入）
 *   池子 selection  用户显式选中的 placeId（`selection.ts`）
 *   归档 archive    用户确认「去不了了」的 placeId（本文件）
 *
 * 归档 **≠** 移除：
 *   移除 = 从 selection 拿掉 → 这家店与你再无关系
 *   归档 = selection 原样保留，另记一条归档记录 → 摇一摇看不到，统计照样看得到
 * 所以恢复是无损往返：把归档记录删掉，它就回到池子里的老位置上。
 *
 * ⚠️ **永不自动归档。** 本文件里没有任何一条路径能在用户没点之前写归档记录，
 * `businessStatus` 也不会。理由见 ADR-0009：Google 的停业数据会滞后，
 * 误判等于静默删掉用户最珍惜的那家店。
 */

/** 归档记录全量；顺序与写入顺序一致（本地后端），云端按 archived_at 排 */
export function archivedEntries(): ArchiveEntry[] {
  return currentBackend().loadArchive();
}

export function archivedPlaceIds(): Set<string> {
  return new Set(archivedEntries().map((e) => e.placeId));
}

export function isArchived(placeId: string): boolean {
  return archivedEntries().some((e) => e.placeId === placeId);
}

export function archivedEntry(placeId: string): ArchiveEntry | null {
  return archivedEntries().find((e) => e.placeId === placeId) ?? null;
}

export function archiveSize(): number {
  return archivedEntries().length;
}

/**
 * 归档一家店。`reason` 不传时按我们**当下看到的** `businessStatus` 推断 ——
 * 归档列表要能回答「它当初为什么不见了」，一律记成 manual 就答不上来了。
 *
 * 幂等：已经归档过的会被覆盖成新的原因与时间（用户从「临时停业」改判成
 * 「永久停业」时，记录应该跟着走）。
 */
export function archiveRestaurant(
  placeId: string,
  reason?: ArchiveReason,
  now: Date = new Date(),
): ArchiveEntry {
  const known = catalogIndex().get(placeId);
  const entry: ArchiveEntry = {
    placeId,
    archivedAt: now.toISOString(),
    reason: reason ?? (known ? suggestedReason(businessStatusOf(known)) : 'manual'),
  };
  currentBackend().addToArchive(entry);
  return entry;
}

/**
 * 恢复到池子（S6 的「恢复」按钮）。
 *
 * 除了删归档记录，还会**保证它真的在 selection 里**：绝大多数情况下它本来就在
 * （归档不动 selection），但用户完全可能在归档之后又去池子页把它移除了。
 * 那时候只删归档记录的话，按钮写着「恢复到池子」而池子里什么都没多出来 ——
 * 界面说的话必须是真的。
 */
export function restoreFromArchive(placeId: string): void {
  currentBackend().removeFromArchive(placeId);
  if (!effectiveSelection().includes(placeId)) addToSelection([placeId]);
}

/**
 * 归档列表里的「彻底删除」：不再归档，也不再在池子里。
 *
 * 刻意**不碰**后验（`state.stores[placeId]`）、摇号历史与导入记录 ——
 * 与 `removeFromSelection()` 的既定语义一致（design/0006 §4.4）：
 * 用户删的是「我要摇哪些店」，不是「我这辈子吃过什么」。
 * 真要抹掉历史，那是「删除账号/Profile」的事。
 */
export function forgetArchived(placeId: string): void {
  currentBackend().removeFromArchive(placeId);
  removeFromSelection(placeId);
}

/** 归档记录 ∩ 目录 —— 归档列表页要显示店名/菜系，得把事实拼回来 */
export interface ArchivedRestaurant {
  entry: ArchiveEntry;
  /** 目录里已经查不到这家店时为 null（导入记录被删过），界面要能只显示 placeId */
  restaurant: CatalogRestaurant | null;
}

export function archivedRestaurants(): ArchivedRestaurant[] {
  const catalog = catalogIndex();
  return archivedEntries().map((entry) => ({
    entry,
    restaurant: catalog.get(entry.placeId) ?? null,
  }));
}

/**
 * 统计用的全集（S7）：**池子 ∪ 归档**，按 placeId 去重。
 *
 * 归档的店必须在里面 —— 一家吃了十年的老店倒闭后，从「你最爱的餐厅」里凭空
 * 消失是说不通的，这正是 Hao 要归档而不是删除的原因（ADR-0009）。
 *
 * 注意这里**不做半径过滤、不重算距离**：统计问的是「我吃过什么」，
 * 与「今天从这个位置能不能走到」无关。要距离请用 `localize.ts`。
 */
export interface StatsUniverse {
  /** 池子里的 + 归档的，去重后的餐厅事实 */
  restaurants: CatalogRestaurant[];
  /** placeId → 归档记录；界面据此给统计条目打「已歇业」标 */
  archived: Map<string, ArchiveEntry>;
  /** 选择/归档里指向目录已查不到的店的 placeId —— 统计只能按次数计，没有店名 */
  unknownPlaceIds: string[];
}

export function poolWithArchived(): StatsUniverse {
  const catalog = catalogIndex();
  const archived = new Map(archivedEntries().map((e) => [e.placeId, e]));
  const restaurants: CatalogRestaurant[] = [];
  const unknownPlaceIds: string[] = [];
  const seen = new Set<string>();

  for (const placeId of [...effectiveSelection(), ...archived.keys()]) {
    if (seen.has(placeId)) continue;
    seen.add(placeId);
    const r = catalog.get(placeId);
    if (r) restaurants.push(r);
    else unknownPlaceIds.push(placeId);
  }

  return { restaurants, archived, unknownPlaceIds };
}
