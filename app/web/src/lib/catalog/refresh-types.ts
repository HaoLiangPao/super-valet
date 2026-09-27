import type { ArchiveReason, BusinessStatus, CatalogRestaurant } from './availability';

/**
 * 刷新流水线的**形状**（design/0008 §3 的 S4/S5）。
 *
 * ⚠️ 这个文件里**没有任何逻辑**，只有类型与两个政策常量。刷新引擎是 S4、
 * 雷达界面与报告是 S5，本文件先把两边共用的形状定下来，让它们并行开工，
 * 不必等对方合入再改一遍字段名。
 *
 * 当 S4 实现时发现形状不够用：改这里，并在 design/0008 的变更记录里记一行。
 */

/** 自动（打开应用时后台跑）还是手动（用户点「重新扫描」）—— 报告必须区分 */
export type RefreshTrigger = 'auto' | 'manual';

/**
 * 会被刷新流水线比对的字段。刻意只列**事实**字段：
 * 分类（primary/tags/slotLock…）是我们自己的判断，Places 刷新时不该覆盖用户的修正。
 */
export type RefreshableField =
  | 'name'
  | 'address'
  | 'rating'
  | 'ratingCount'
  | 'priceLevel'
  | 'dineIn'
  | 'closedDays'
  | 'serviceWindows'
  | 'businessStatus';

/**
 * 一个字段变了：从什么变成什么。
 *
 * `before` / `after` 只装标量，因为报告要显示的是「海底捞评分 4.8→4.7」这种人话。
 * 营业时间这类结构性字段（`serviceWindows` / `closedDays`）给不出有意义的标量，
 * 就用 `structural: true` + 一句摘要（「3 段 → 2 段」），界面只说「营业时间变了」。
 */
export interface FieldChange {
  field: RefreshableField;
  before: string | number | boolean | null;
  after: string | number | boolean | null;
  /** true = before/after 只是摘要，不是全量值；界面不要拿它算差值 */
  structural?: boolean;
}

/** 一家店这次刷新的全部变化；`changes` 为空的店**不进报告**（否则全是噪音） */
export interface RestaurantDiff {
  placeId: string;
  /** 刷新后的店名（店名本身也可能变，报告里用新的） */
  name: string;
  changes: FieldChange[];
  /** 刷新后 Places 给的可用性；缺失按 OPERATIONAL（ADR-0009） */
  businessStatus: BusinessStatus;
  /** 这次抓取的时间，写回 `fetchedAt`，30 天 TTL 的判据 */
  fetchedAt: string;
}

/**
 * 「新发现」的候选（仅手动重扫会有）。**不自动入池** —— 这是 ADR-0008
 * 「不替用户做主」的直接延续，界面必须让用户一家一家（或一键全部）确认。
 */
export interface DiscoveredCandidate {
  restaurant: CatalogRestaurant;
  /** 哪个类目查询把它带出来的（如 `CN_SICHUAN`），界面用来分组 */
  viaCategory: string;
  /** 与当前位置的距离，km；发现是按位置 + 半径做的，这个值不该让界面再算一遍 */
  distanceKm: number;
}

/** 用户在「需要你确认」里可以做的三个选择（design/0008 §3 S5 的三个按钮） */
export type AttentionDecision = 'archive' | 'remove' | 'keep';

/**
 * 需要用户拍板的一条：Places 说它不营业了。
 *
 * **绝不自动处理**（ADR-0009）。`suggestedReason` 只是「用户点归档时默认记什么原因」，
 * 不是「我们已经归档了」。
 */
export interface AttentionItem {
  placeId: string;
  name: string;
  businessStatus: BusinessStatus;
  suggestedReason: ArchiveReason;
}

/** 抓失败的店：报告要诚实，失败不许悄悄消失（否则「更新了 12 家」是假的） */
export interface RefreshFailure {
  placeId: string;
  name: string;
  /** 给用户看的中文短句，不是异常栈 */
  message: string;
}

/**
 * 一次刷新的完整报告。落库后可回看（design/0008 §3 的 S5 明确要求
 * 区分自动/手动、更新了什么、新增了什么）。
 */
export interface RefreshReport {
  /** 客户端生成的 id，与 rolls 同款（crypto.randomUUID） */
  id: string;
  trigger: RefreshTrigger;
  startedAt: string;
  finishedAt: string;
  /** 事实确实变了的店 */
  updated: RestaurantDiff[];
  /** 新发现的候选；自动刷新一律为空数组（自动刷新不做发现，只碰已有条目） */
  discovered: DiscoveredCandidate[];
  /** businessStatus 非 OPERATIONAL、等用户拍板的 */
  needsAttention: AttentionItem[];
  /** 抓取失败的 */
  failed: RefreshFailure[];
  /** 这次一共对外抓了几次 —— 与 `fetch_log` 的行数对得上，成本可审计 */
  fetchCount: number;
  /** 检查过但没有任何变化的家数；报告要能说「12 家更新，38 家没变」 */
  unchanged: number;
}

/* ── 节制政策（design/0008 §3 S4「自动刷新的节制」）──────────────────── */

/** 一次刷新最多碰几家店；再多就是在替用户烧 Places 配额 */
export const REFRESH_BATCH_LIMIT = 20;

/** 自动刷新的最小间隔：每天最多一次 */
export const AUTO_REFRESH_MIN_INTERVAL_MS = 24 * 60 * 60 * 1000;
