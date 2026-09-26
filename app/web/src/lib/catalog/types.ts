import type { Restaurant } from '@/lib/engine/types';

/**
 * 目录 / 池子 / 位置的接口契约（design/0006、ADR-0008）。
 *
 * 这个文件由创始人冻结，数据层与界面层照它实现。**不要单方面改动**：
 * 要改先改 design/0006，再同步这里。
 *
 * 核心概念（ADR-0008）：
 *   目录 CATALOG   我们维护的全部餐厅（静态）+ 用户自己导入的
 *   池子 selection 用户显式选中的 placeId 子集
 *   距离           不是餐厅的属性，是「餐厅 × 当前位置」的函数，运行时算
 */

// ── 1. 预设套餐 ───────────────────────────────────────────────────────

export interface RestaurantPackage {
  id: string;
  nameZh: string;
  nameEn: string;
  descZh: string;
  descEn: string;
  /** 显式挑选的成员，不是动态条件（design/0006 §4.2 说明了为什么） */
  placeIds: string[];
}

// ── 2. 位置 ───────────────────────────────────────────────────────────

export interface Anchor {
  id: string;
  labelZh: string;
  labelEn: string;
  lat: number;
  lng: number;
}

export type LocationSource =
  | { kind: 'anchor'; id: string; lat: number; lng: number }
  | { kind: 'gps'; lat: number; lng: number; accuracy: number; ts: number };

/** 半径档位；`ALL` = 不限，且是默认值（design/0006 §4.3） */
export type RadiusOption = 'WALK' | 'NEAR' | 'MID' | 'ALL';

export const RADIUS_KM: Record<RadiusOption, number> = {
  WALK: 1.2,
  NEAR: 5,
  MID: 15,
  ALL: Number.POSITIVE_INFINITY,
};

export const DEFAULT_RADIUS: RadiusOption = 'ALL';

/** 用户的位置与筛选偏好；按身份存 */
export interface LocationPrefs {
  /** 未选过时用默认锚点 Downtown Markham */
  source: LocationSource | null;
  radius: RadiusOption;
  /** GPS 成功过的最后位置，用于降级链（design/0006 §4.3） */
  lastGps: { lat: number; lng: number; ts: number } | null;
}

export function defaultLocationPrefs(): LocationPrefs {
  return { source: null, radius: DEFAULT_RADIUS, lastGps: null };
}

// ── 3. 池子选择 ───────────────────────────────────────────────────────

/**
 * `null` = 用户从没做过选择 → 调用方必须默认成原来的 15 家种子。
 * 这是老用户的向后兼容保证（ADR-0008），改它等于让人一觉醒来池子变了。
 */
export type PoolSelection = string[] | null;

// ── 4. 本地化视图：喂给引擎的东西 ─────────────────────────────────────

/**
 * 按当前位置重算过距离、并按半径过滤过的餐厅列表。
 *
 * 引擎只认 `Restaurant[]`，所以这里返回的仍是 `Restaurant`，
 * 只是 `distanceKm` / `bucket` 已经换成「相对于 location」的值。
 * **引擎因此一行都不用改**（ADR-0008 决策 2）。
 */
export interface LocalizedPool {
  restaurants: Restaurant[];
  /** 池子里因为超出半径而被挡掉的家数，UI 用来提示「放宽半径还能看到 N 家」 */
  filteredOut: number;
  /** 实际用于计算的位置，UI 用来显示「距离基于：Downtown Markham」 */
  usedLocation: { lat: number; lng: number; label: 'gps' | 'anchor' };
}
