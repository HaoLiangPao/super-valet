import { emptyState } from '../engine/types';
import type {
  CandidateSnapshot,
  EngineState,
  FeedbackRecord,
  Meal,
  RollRecord,
  SkipReason,
} from '../engine/types';

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
