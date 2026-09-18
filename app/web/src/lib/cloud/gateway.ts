import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  CategoryRow,
  FeedbackRow,
  ProfileRow,
  RestaurantRow,
  RollRow,
} from './rows';

/**
 * CloudStore 与 Supabase 之间的端口。
 *
 * 存在的理由只有一个：单元测试里塞一个假实现，就能把「内存快照 + 写队列 +
 * 差分」这套逻辑完整测掉，不用打真网、不用 mock supabase-js 的链式 builder。
 */
export interface CloudGateway {
  fetchProfile(): Promise<ProfileRow | null>;
  fetchRestaurants(): Promise<RestaurantRow[]>;
  fetchCategories(): Promise<CategoryRow[]>;
  fetchRolls(): Promise<RollRow[]>;
  fetchFeedbacks(): Promise<FeedbackRow[]>;
  upsertRestaurants(rows: RestaurantRow[]): Promise<void>;
  upsertCategories(rows: CategoryRow[]): Promise<void>;
  insertRoll(row: RollRow): Promise<void>;
  upsertFeedback(row: FeedbackRow): Promise<void>;
  updateProfile(patch: Partial<Omit<ProfileRow, 'id'>>): Promise<void>;
}

interface PostgrestLikeError {
  message: string;
}

function unwrap<T>(result: { data: T | null; error: PostgrestLikeError | null }, what: string): T {
  if (result.error) throw new Error(`${what}: ${result.error.message}`);
  return (result.data ?? []) as T;
}

function assertOk(result: { error: PostgrestLikeError | null }, what: string): void {
  if (result.error) throw new Error(`${what}: ${result.error.message}`);
}

/**
 * 真身：所有查询都显式带 user_id。
 * RLS 已经在服务端兜底（ADR-0006），这里的 eq/注入是为了让读到的东西与
 * 写进去的东西在客户端代码里也一眼可证。
 */
export function supabaseGateway(client: SupabaseClient, userId: string): CloudGateway {
  return {
    async fetchProfile() {
      const { data, error } = await client
        .from('profiles')
        .select('id, email, display_name, emoji, persona_key, onboarded_at')
        .eq('id', userId)
        .maybeSingle();
      if (error) throw new Error(`读取账号档案失败: ${error.message}`);
      return (data as ProfileRow | null) ?? null;
    },

    async fetchRestaurants() {
      return unwrap<RestaurantRow[]>(
        await client
          .from('user_restaurants')
          .select('place_id, alpha, beta, base_weight, last_eaten_day, paused')
          .eq('user_id', userId),
        '读取单店后验失败',
      );
    },

    async fetchCategories() {
      return unwrap<CategoryRow[]>(
        await client
          .from('user_cuisine_categories')
          .select('category, alpha, beta, last_eaten_day')
          .eq('user_id', userId),
        '读取类别后验失败',
      );
    },

    async fetchRolls() {
      return unwrap<RollRow[]>(
        await client
          .from('rolls')
          // 必须是单个字符串字面量：拼接出来的 select 会让 PostgREST 的类型推导失效
          .select('id, restaurant_id, rolled_at, epoch_day, meal, algo_version, candidates_snapshot, roll_index, action, skip_reason')
          .eq('user_id', userId)
          .order('rolled_at', { ascending: true }),
        '读取摇号记录失败',
      );
    },

    async fetchFeedbacks() {
      return unwrap<FeedbackRow[]>(
        await client
          .from('feedbacks')
          .select('roll_id, restaurant_id, rating, note, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: true }),
        '读取反馈失败',
      );
    },

    async upsertRestaurants(rows) {
      if (rows.length === 0) return;
      assertOk(
        await client
          .from('user_restaurants')
          .upsert(rows.map((r) => ({ ...r, user_id: userId })), { onConflict: 'user_id,place_id' }),
        '写入单店后验失败',
      );
    },

    async upsertCategories(rows) {
      if (rows.length === 0) return;
      assertOk(
        await client
          .from('user_cuisine_categories')
          .upsert(rows.map((r) => ({ ...r, user_id: userId })), { onConflict: 'user_id,category' }),
        '写入类别后验失败',
      );
    },

    async insertRoll(row) {
      assertOk(
        await client
          .from('rolls')
          .upsert({ ...row, user_id: userId }, { onConflict: 'user_id,id' }),
        '写入摇号记录失败',
      );
    },

    async upsertFeedback(row) {
      assertOk(
        await client
          .from('feedbacks')
          .upsert({ ...row, user_id: userId }, { onConflict: 'user_id,roll_id' }),
        '写入反馈失败',
      );
    },

    async updateProfile(patch) {
      assertOk(
        await client.from('profiles').upsert({ id: userId, ...patch }, { onConflict: 'id' }),
        '更新账号档案失败',
      );
    },
  };
}
