import type { ServiceWindow } from '../../data/seed-restaurants';
import { emptyState } from '../engine/types';
import type {
  CandidateSnapshot,
  EngineState,
  FeedbackRecord,
  Meal,
  Restaurant,
  RollRecord,
  SkipReason,
} from '../engine/types';
import type { DishMention, FetchLogEntry } from '../places/contract';
import type { PoolEntry } from '../store/backend';

/**
 * EngineState / RollRecord / FeedbackRecord 与 Supabase 行之间的纯映射。
 *
 * 为什么不存 JSON blob：中央可见性要求 Hao 能在 Supabase 里直接查后验
 * （「日料控这半个月的 AS_JAPANESE 学成什么样了」），blob 查不动。
 * 所以按 ADR-0005 的两层拆表，一层一张（supabase/migrations/0001_init.sql）。
 */

export interface RestaurantRow {
  place_id: string;
  alpha: number | null;
  beta: number | null;
  base_weight: number | null;
  last_eaten_day: number | null;
  paused: boolean;
}

export interface CategoryRow {
  category: string;
  alpha: number | null;
  beta: number | null;
  last_eaten_day: number | null;
}

export interface RollRow {
  id: string;
  restaurant_id: string;
  rolled_at: string;
  epoch_day: number;
  meal: string;
  algo_version: string;
  candidates_snapshot: CandidateSnapshot[];
  roll_index: number;
  action: string;
  skip_reason: string | null;
}

export interface FeedbackRow {
  roll_id: string;
  restaurant_id: string;
  rating: string;
  note: string | null;
  created_at: string;
}

export interface ProfileRow {
  id: string;
  email: string | null;
  display_name: string | null;
  emoji: string | null;
  persona_key: string | null;
  onboarded_at: string | null;
}

/* ---------------------------------------------------------------- *
 * EngineState → 行
 * ---------------------------------------------------------------- */

/**
 * 单店层的四个 map（stores / lastEatenDay / baseWeight / paused）键都是 placeId，
 * 合并成一行。某个字段在 map 里不存在就写 null —— 引擎那边 `?? storePrior(r)`、
 * `?? 1`、`undefined` 的语义与 null 一一对应，不需要在 DB 里编造默认值。
 */
export function stateToRestaurantRows(state: EngineState): RestaurantRow[] {
  const ids = new Set<string>([
    ...Object.keys(state.stores),
    ...Object.keys(state.lastEatenDay),
    ...Object.keys(state.baseWeight),
    ...Object.keys(state.paused).filter((k) => state.paused[k]),
  ]);
  return [...ids].sort().map((placeId) => {
    const arm = state.stores[placeId];
    return {
      place_id: placeId,
      alpha: arm ? arm.alpha : null,
      beta: arm ? arm.beta : null,
      base_weight: state.baseWeight[placeId] ?? null,
      last_eaten_day: state.lastEatenDay[placeId] ?? null,
      paused: state.paused[placeId] === true,
    };
  });
}

export function stateToCategoryRows(state: EngineState): CategoryRow[] {
  const cats = new Set<string>([
    ...Object.keys(state.categories),
    ...Object.keys(state.catLastEatenDay),
  ]);
  return [...cats].sort().map((category) => {
    const arm = state.categories[category];
    return {
      category,
      alpha: arm ? arm.alpha : null,
      beta: arm ? arm.beta : null,
      last_eaten_day: state.catLastEatenDay[category] ?? null,
    };
  });
}

/* ---------------------------------------------------------------- *
 * 行 → EngineState
 * ---------------------------------------------------------------- */

export function rowsToState(
  restaurants: RestaurantRow[],
  categories: CategoryRow[],
): EngineState {
  const state = emptyState();
  for (const row of restaurants) {
    if (row.alpha !== null && row.beta !== null) {
      state.stores[row.place_id] = { alpha: row.alpha, beta: row.beta };
    }
    if (row.base_weight !== null) state.baseWeight[row.place_id] = row.base_weight;
    if (row.last_eaten_day !== null) state.lastEatenDay[row.place_id] = row.last_eaten_day;
    if (row.paused) state.paused[row.place_id] = true;
  }
  for (const row of categories) {
    if (row.alpha !== null && row.beta !== null) {
      state.categories[row.category] = { alpha: row.alpha, beta: row.beta };
    }
    if (row.last_eaten_day !== null) state.catLastEatenDay[row.category] = row.last_eaten_day;
  }
  return state;
}

/* ---------------------------------------------------------------- *
 * rolls / feedbacks
 * ---------------------------------------------------------------- */

export function rollToRow(r: RollRecord): RollRow {
  return {
    id: r.id,
    restaurant_id: r.restaurantId,
    rolled_at: r.rolledAt,
    epoch_day: r.epochDay,
    meal: r.meal,
    algo_version: r.algoVersion,
    candidates_snapshot: r.candidatesSnapshot,
    roll_index: r.rollIndex,
    action: r.action,
    skip_reason: r.skipReason ?? null,
  };
}

export function rowToRoll(row: RollRow): RollRecord {
  return {
    id: row.id,
    rolledAt: row.rolled_at,
    epochDay: row.epoch_day,
    meal: row.meal as Meal,
    restaurantId: row.restaurant_id,
    algoVersion: row.algo_version as RollRecord['algoVersion'],
    candidatesSnapshot: row.candidates_snapshot ?? [],
    rollIndex: row.roll_index,
    action: row.action as RollRecord['action'],
    ...(row.skip_reason ? { skipReason: row.skip_reason as SkipReason } : {}),
  };
}

export function feedbackToRow(f: FeedbackRecord): FeedbackRow {
  return {
    roll_id: f.rollId,
    restaurant_id: f.restaurantId,
    rating: f.rating,
    note: f.note ?? null,
    created_at: f.createdAt,
  };
}

export function rowToFeedback(row: FeedbackRow): FeedbackRecord {
  return {
    rollId: row.roll_id,
    restaurantId: row.restaurant_id,
    rating: row.rating as FeedbackRecord['rating'],
    ...(row.note ? { note: row.note } : {}),
    createdAt: row.created_at,
  };
}

/* ---------------------------------------------------------------- *
 * 差分：saveState 拿到的是整份 state，只把真正变了的行推上去
 * ---------------------------------------------------------------- */

export function indexBy<T>(rows: T[], key: (row: T) => string): Map<string, T> {
  const map = new Map<string, T>();
  for (const row of rows) map.set(key(row), row);
  return map;
}

/** 返回 next 中「新增或字段有变化」的行（删除不处理：引擎从不删键） */
export function changedRows<T>(
  prev: Map<string, T>,
  next: T[],
  key: (row: T) => string,
): T[] {
  return next.filter((row) => {
    const before = prev.get(key(row));
    return before === undefined || JSON.stringify(before) !== JSON.stringify(row);
  });
}

/* ---------------------------------------------------------------- *
 * 餐厅池（design/0005 EXPLORE 导入）
 *
 * 三张表的分工（supabase/migrations/0002_explore_import.sql）：
 *   restaurants          —— 共享事实表，place_id 主键，登录用户只读，
 *                           写入只走 security definer 函数 import_restaurant()
 *   user_restaurant_pool —— 谁把哪家店放进了自己的池子，RLS auth.uid() = user_id
 *   dishes / sources     —— 用户粘贴的笔记及其抽取物，**按用户隔离**
 *                           （design/0001 §6 原本没有 user_id；粘贴的原文是私人内容，
 *                            共享表会把 A 的笔记泄漏给 B，这里刻意偏离）
 * ---------------------------------------------------------------- */

export interface RestaurantFactRow {
  place_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  primary_cuisine: string;
  tags: string[];
  solo_friendly: boolean;
  slot_lock: string[];
  is_main_meal: boolean;
  prior_bias: number;
  dine_in: boolean;
  price_level: number | null;
  rating: number;
  rating_count: number;
  closed_days: number[];
  service_windows: ServiceWindow[];
  distance_km: number;
  bucket: string;
  confidence: number;
  reason: string;
}

export interface PoolRow {
  place_id: string;
  added_at: string;
  source_id: string | null;
  /** PostgREST 的嵌套资源；关联行缺失时为 null */
  restaurants: RestaurantFactRow | null;
}

export interface DishRow {
  place_id: string;
  name_raw: string;
  quote: string | null;
  sentiment: string | null;
}

export interface SourceRow {
  id: string;
  place_id: string;
  raw_text: string | null;
}

export function restaurantToFactRow(r: Restaurant): RestaurantFactRow {
  return {
    place_id: r.placeId,
    name: r.name,
    address: r.address,
    lat: r.lat,
    lng: r.lng,
    primary_cuisine: r.primary,
    tags: r.tags,
    solo_friendly: r.soloFriendly,
    slot_lock: r.slotLock,
    is_main_meal: r.isMainMeal,
    prior_bias: r.priorBias,
    dine_in: r.dineIn,
    price_level: r.priceLevel,
    rating: r.rating,
    rating_count: r.ratingCount,
    closed_days: r.closedDays,
    service_windows: r.serviceWindows,
    distance_km: r.distanceKm,
    bucket: r.bucket,
    confidence: r.confidence,
    reason: r.reason,
  };
}

export function factRowToRestaurant(row: RestaurantFactRow): Restaurant {
  return {
    placeId: row.place_id,
    name: row.name,
    address: row.address,
    lat: row.lat,
    lng: row.lng,
    primary: row.primary_cuisine,
    tags: row.tags ?? [],
    soloFriendly: row.solo_friendly,
    slotLock: (row.slot_lock ?? []) as Restaurant['slotLock'],
    isMainMeal: row.is_main_meal,
    priorBias: row.prior_bias,
    dineIn: row.dine_in,
    priceLevel: row.price_level,
    rating: row.rating,
    ratingCount: row.rating_count,
    closedDays: row.closed_days ?? [],
    serviceWindows: row.service_windows ?? [],
    distanceKm: row.distance_km,
    bucket: row.bucket as Restaurant['bucket'],
    confidence: row.confidence,
    reason: row.reason,
  };
}

/** 一次导入打包成一个 RPC 调用：三张表的写在数据库里是一个事务 */
export interface ImportPayload {
  restaurant: RestaurantFactRow;
  dishes: Array<{ name: string; quote?: string; sentiment?: string }>;
  source: { type: string; raw_text: string } | null;
}

export function toImportPayload(entry: PoolEntry): ImportPayload {
  return {
    restaurant: restaurantToFactRow(entry.restaurant),
    dishes: entry.dishes.map((d) => ({
      name: d.name,
      ...(d.quote ? { quote: d.quote } : {}),
      ...(d.sentiment ? { sentiment: d.sentiment } : {}),
    })),
    source: entry.sourceText
      ? { type: 'manual_note', raw_text: entry.sourceText }
      : null,
  };
}

/** 三张表的行 → 运行时的 PoolEntry 列表 */
export function rowsToPool(
  pool: PoolRow[],
  dishes: DishRow[],
  sources: SourceRow[],
): PoolEntry[] {
  const dishesByPlace = new Map<string, DishMention[]>();
  for (const d of dishes) {
    const list = dishesByPlace.get(d.place_id) ?? [];
    list.push({
      name: d.name_raw,
      ...(d.quote ? { quote: d.quote } : {}),
      ...(d.sentiment === 'positive' || d.sentiment === 'neutral' || d.sentiment === 'negative'
        ? { sentiment: d.sentiment }
        : {}),
    });
    dishesByPlace.set(d.place_id, list);
  }
  const sourceById = new Map(sources.map((s) => [s.id, s]));

  return pool
    .filter((row): row is PoolRow & { restaurants: RestaurantFactRow } => row.restaurants !== null)
    .map((row) => {
      const source = row.source_id ? sourceById.get(row.source_id) : undefined;
      return {
        restaurant: factRowToRestaurant(row.restaurants),
        dishes: dishesByPlace.get(row.place_id) ?? [],
        addedAt: row.added_at,
        ...(source?.raw_text ? { sourceText: source.raw_text } : {}),
      };
    });
}

/* ── 抓取台账（design/0005 §4.7）──────────────────────────────────── */

export interface FetchLogRow {
  at: string;
  kind: string;
  query: string | null;
  place_id: string | null;
  place_name: string | null;
  provider: string;
  result_count: number | null;
  outcome: string;
  note: string | null;
}

export function fetchLogToRow(e: FetchLogEntry): FetchLogRow {
  return {
    at: e.at,
    kind: e.kind,
    query: e.query ?? null,
    place_id: e.placeId ?? null,
    place_name: e.placeName ?? null,
    provider: e.provider,
    result_count: e.resultCount ?? null,
    outcome: e.outcome,
    note: e.note ?? null,
  };
}

export function rowToFetchLog(row: FetchLogRow): FetchLogEntry {
  const kind: FetchLogEntry['kind'] =
    row.kind === 'analyze' || row.kind === 'preview' || row.kind === 'refresh' ? row.kind : 'search';
  const outcome: FetchLogEntry['outcome'] =
    row.outcome === 'not_found' || row.outcome === 'error' ? row.outcome : 'ok';
  return {
    at: row.at,
    kind,
    provider: row.provider,
    outcome,
    ...(row.query ? { query: row.query } : {}),
    ...(row.place_id ? { placeId: row.place_id } : {}),
    ...(row.place_name ? { placeName: row.place_name } : {}),
    ...(row.result_count !== null ? { resultCount: row.result_count } : {}),
    ...(row.note ? { note: row.note } : {}),
  };
}
