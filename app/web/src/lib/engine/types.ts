import type { SeedRestaurant } from '../../data/seed-restaurants';

export type Restaurant = SeedRestaurant;
export type Slot = 'breakfast' | 'lunch' | 'dinner' | 'latenight';
export type Meal = 'lunch' | 'dinner';

/** ADR-0004：推荐内核对餐次无感知，一餐 = 一份配置 */
export interface MealConfig {
  meal: Meal;
  slot: Slot;
  /** 判定「当时是否营业」的时间点（当天 0 点起的分钟数） */
  decisionMinutes: number;
  d0WeekdayKm: number;
  d0WeekendKm: number;
  /** 工作日该餐是否只保留单人友好的店 */
  soloOnWeekdays: boolean;
}

export const DINNER: MealConfig = {
  meal: 'dinner',
  slot: 'dinner',
  decisionMinutes: 18 * 60 + 30,
  d0WeekdayKm: 6,
  d0WeekendKm: 15,
  soloOnWeekdays: false,
};

export interface ArmPosterior {
  alpha: number;
  beta: number;
}

/** 全部推荐状态；shape 对齐 design/0001 §6，日后 1:1 迁到 Supabase */
export interface EngineState {
  stores: Record<string, ArmPosterior>;
  categories: Record<string, ArmPosterior>;
  lastEatenDay: Record<string, number>;
  catLastEatenDay: Record<string, number>;
  baseWeight: Record<string, number>;
  paused: Record<string, boolean>;
}

export interface CandidateSnapshot {
  placeId: string;
  name: string;
  thetaStore: number;
  thetaCat: number;
  freshness: number;
  cuisinePenalty: number;
  distanceWeight: number;
  score: number;
}

export type SkipReason =
  | 'too_far'
  | 'too_pricey'
  | 'just_ate'
  | 'wrong_cuisine'
  | 'closed'
  | 'no_mood'
  | 'other';

export interface RollRecord {
  id: string;
  rolledAt: string;
  epochDay: number;
  meal: Meal;
  restaurantId: string;
  algoVersion: 'v2-soft';
  candidatesSnapshot: CandidateSnapshot[];
  rollIndex: number;
  action: 'accepted' | 'skipped';
  skipReason?: SkipReason;
}

export interface FeedbackRecord {
  rollId: string;
  restaurantId: string;
  rating: 'good' | 'ok' | 'bad';
  note?: string;
  createdAt: string;
}

export function emptyState(): EngineState {
  return {
    stores: {},
    categories: {},
    lastEatenDay: {},
    catLastEatenDay: {},
    baseWeight: {},
    paused: {},
  };
}

/** 本地日序号（不跨时区持久化，自用足够） */
export function epochDay(d: Date = new Date()): number {
  return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000);
}
