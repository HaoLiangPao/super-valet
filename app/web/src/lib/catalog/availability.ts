import type { Restaurant } from '@/lib/engine/types';
import { toBusinessStatus } from '@/lib/places/contract';
import type { BusinessStatus } from '@/lib/places/contract';

/**
 * 可用性与归档的**类型层**（ADR-0009）。
 *
 * 这个文件刻意只有类型与纯函数，不 import `store/backend` / `catalog.ts`：
 * `store/backend.ts` 要用 `ArchiveEntry`，而 `catalog/catalog.ts` 又 import
 * backend —— 逻辑放这里就是循环依赖。逻辑在 `archive.ts`。
 *
 * 为什么不直接把 `businessStatus` 加进 `Restaurant`：
 * `Restaurant = SeedRestaurant`，定义在 `src/data/seed-restaurants.ts`，
 * 而 `src/data/**` 与 `src/lib/engine/**` 本轮**一行都不许改**。
 * 用 `declare module` 做类型增补能绕过这条线，但那等于从远处改掉引擎眼里的
 * 自身类型（引擎会看见一个它永远不该依赖的字段），属于隐形耦合。
 * 这里改成显式交叉类型：字段是**可选**的，所以
 *   - 既有 74 家目录数据与 15 家种子（没有这个字段）照样编译；
 *   - `CatalogRestaurant` 可以喂给任何吃 `Restaurant` 的地方（引擎不用改）；
 *   - 反过来 `Restaurant` 也能赋给 `CatalogRestaurant`（缺可选字段合法）。
 */

export type { BusinessStatus };
export { toBusinessStatus };

/** 目录层的餐厅：引擎认识的那份事实 + 可用性状态 */
export type CatalogRestaurant = Restaurant & {
  /** 缺失 = 按 `OPERATIONAL` 处理（ADR-0009）。读它请用 `businessStatusOf()` */
  businessStatus?: BusinessStatus;
};

/**
 * 读一家店的可用性状态。**永远给出一个合法值**：
 * 字段缺失 / 是脏值 / 是 Places 日后新增的枚举 → `OPERATIONAL`。
 *
 * 参数刻意收成 `Restaurant`（而不是 `CatalogRestaurant`）：界面拿到的多半是
 * `localizedPool().restaurants`（契约里是 `Restaurant[]`），不该为了读一个
 * 可选字段去写强制转换。
 */
export function businessStatusOf(r: Restaurant): BusinessStatus {
  return toBusinessStatus((r as CatalogRestaurant).businessStatus);
}

/** 只是「Places 说它还开着」；**与归档无关**，归档要问 `isArchived()` */
export function isOperational(r: Restaurant): boolean {
  return businessStatusOf(r) === 'OPERATIONAL';
}

/**
 * 池子里 Places 说已经不营业的那些 —— S5 刷新报告「需要你确认」那一组的原料。
 *
 * 注意它**不改变摇一摇**：非 OPERATIONAL 只是提示，归档与否一律由用户决定
 * （ADR-0009：永不自动归档）。
 */
export function unavailableIn(list: Restaurant[]): Restaurant[] {
  return list.filter((r) => !isOperational(r));
}

/* ── 归档 ─────────────────────────────────────────────────────────── */

/**
 * 为什么归档的原因只有三种：前两种是 Places 的 `businessStatus` 一对一映射
 * （用户在提示里点了「归档」），第三种是用户自己决定的（「搬走了」「太远了」）。
 * 不设 `auto_*` 原因是刻意的 —— 没有任何代码路径可以不问用户就归档。
 */
export type ArchiveReason = 'closed_permanently' | 'closed_temporarily' | 'manual';

export const ARCHIVE_REASONS: readonly ArchiveReason[] = [
  'closed_permanently', 'closed_temporarily', 'manual',
];

export interface ArchiveEntry {
  placeId: string;
  /** ISO 时间串 */
  archivedAt: string;
  reason: ArchiveReason;
}

export function toArchiveReason(raw: unknown): ArchiveReason {
  return typeof raw === 'string' && (ARCHIVE_REASONS as readonly string[]).includes(raw)
    ? (raw as ArchiveReason)
    : 'manual';
}

/** 存的是用户数据，不能假设它长得对；脏条目一律丢掉，不让一条坏记录带崩摇一摇 */
export function isArchiveEntry(v: unknown): v is ArchiveEntry {
  if (typeof v !== 'object' || v === null) return false;
  const e = v as Partial<ArchiveEntry>;
  return typeof e.placeId === 'string' && e.placeId.length > 0
    && typeof e.archivedAt === 'string'
    && typeof e.reason === 'string';
}

/** 洗成合法条目（reason 认不出来 → manual），顺序保留，同 placeId 留最后一条 */
export function sanitizeArchive(raw: unknown): ArchiveEntry[] {
  if (!Array.isArray(raw)) return [];
  const byId = new Map<string, ArchiveEntry>();
  for (const v of raw) {
    if (!isArchiveEntry(v)) continue;
    byId.set(v.placeId, {
      placeId: v.placeId,
      archivedAt: v.archivedAt,
      reason: toArchiveReason(v.reason),
    });
  }
  return [...byId.values()];
}

/**
 * 给界面用的「默认原因」：用户在提示里点「归档」时，原因应该与我们当时
 * 看到的 `businessStatus` 一致，而不是一律记成 manual —— 归档列表要能回答
 * 「它当初为什么不见了」。
 */
export function suggestedReason(status: BusinessStatus): ArchiveReason {
  if (status === 'CLOSED_PERMANENTLY') return 'closed_permanently';
  if (status === 'CLOSED_TEMPORARILY') return 'closed_temporarily';
  return 'manual';
}
