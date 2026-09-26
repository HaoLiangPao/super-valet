import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  CategoryRow,
  DishRow,
  FeedbackRow,
  FetchLogRow,
  ImportPayload,
  LocationPrefsRow,
  LocationPrefsWrite,
  PoolRow,
  ProfileRow,
  RestaurantRow,
  RollRow,
  SelectionRow,
  SourceRow,
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

  /* ── 餐厅池与抓取台账（design/0005）──────────────────────────── */

  fetchPool(): Promise<PoolRow[]>;
  fetchDishes(): Promise<DishRow[]>;
  fetchSources(): Promise<SourceRow[]>;
  /** 一次导入 = 事实表 upsert + 入池 + 菜品 + 笔记原文 */
  importRestaurant(payload: ImportPayload): Promise<void>;
  deleteFromPool(placeId: string): Promise<void>;
  fetchFetchLog(): Promise<FetchLogRow[]>;
  insertFetchLog(row: FetchLogRow): Promise<void>;

  /* ── 池子选择与位置偏好（design/0006、ADR-0008）──────────────── */

  fetchSelection(): Promise<SelectionRow[]>;
  /**
   * 整体替换选择列表；传 `null` = 抹掉记录，回到「从没选过」。
   * 顺序是**先补后删**：中间态永远是目标集的超集，半路失败也不会让用户的池子变小。
   */
  replaceSelection(placeIds: string[] | null): Promise<void>;
  fetchLocationPrefs(): Promise<LocationPrefsRow | null>;
  /** 只写位置相关的列，不碰 `selection_set`（那是 replaceSelection 的字段） */
  saveLocationPrefs(row: LocationPrefsWrite): Promise<void>;
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
    async fetchPool() {
      // PostgREST 把嵌套资源推断成数组，运行时这里是「一对一」的单个对象；
      // 只能在这一处收口成 PoolRow，别把 any 扩散出去。
      const res = (await client
        .from('user_restaurant_pool')
        .select('place_id, added_at, source_id, restaurants(*)')
        .eq('user_id', userId)) as unknown as {
        data: PoolRow[] | null;
        error: { message: string } | null;
      };
      return unwrap<PoolRow[]>(res, '读取餐厅池失败');
    },

    async fetchDishes() {
      return unwrap<DishRow[]>(
        await client
          .from('dishes')
          .select('place_id, name_raw, quote, sentiment')
          .eq('user_id', userId),
        '读取菜品失败',
      );
    },

    async fetchSources() {
      return unwrap<SourceRow[]>(
        await client
          .from('sources')
          .select('id, place_id, raw_text')
          .eq('user_id', userId),
        '读取笔记原文失败',
      );
    },

    async importRestaurant(payload: ImportPayload) {
      // 事实表是共享的：同一家店别人已经抓过就覆盖成最新一次，不重复建行
      assertOk(
        await client.from('restaurants').upsert(payload.restaurant, { onConflict: 'place_id' }),
        '写入餐厅事实失败',
      );

      let sourceId: string | null = null;
      if (payload.source) {
        const { data, error } = await client
          .from('sources')
          .insert({
            user_id: userId,
            place_id: payload.restaurant.place_id,
            type: payload.source.type,
            raw_text: payload.source.raw_text,
          })
          .select('id')
          .single();
        if (error) throw new Error(`写入笔记原文失败: ${error.message}`);
        sourceId = (data as { id: string }).id;
      }

      assertOk(
        await client.from('user_restaurant_pool').upsert(
          {
            user_id: userId,
            place_id: payload.restaurant.place_id,
            added_at: new Date().toISOString(),
            source_id: sourceId,
          },
          { onConflict: 'user_id,place_id' },
        ),
        '加入餐厅池失败',
      );

      if (payload.dishes.length > 0) {
        // 重新导入同一家店时先清掉旧菜品，避免同名菜越积越多
        assertOk(
          await client.from('dishes').delete()
            .eq('user_id', userId).eq('place_id', payload.restaurant.place_id),
          '清理旧菜品失败',
        );
        assertOk(
          await client.from('dishes').insert(
            payload.dishes.map((d) => ({
              user_id: userId,
              place_id: payload.restaurant.place_id,
              name_raw: d.name,
              quote: d.quote ?? null,
              sentiment: d.sentiment ?? null,
            })),
          ),
          '写入菜品失败',
        );
      }
    },

    async deleteFromPool(placeId: string) {
      // 只删「我和这家店的关系」，共享事实表留着给别人用
      assertOk(
        await client.from('user_restaurant_pool').delete()
          .eq('user_id', userId).eq('place_id', placeId),
        '移出餐厅池失败',
      );
      assertOk(
        await client.from('dishes').delete().eq('user_id', userId).eq('place_id', placeId),
        '删除菜品失败',
      );
      assertOk(
        await client.from('sources').delete().eq('user_id', userId).eq('place_id', placeId),
        '删除笔记原文失败',
      );
    },

    async fetchFetchLog() {
      return unwrap<FetchLogRow[]>(
        await client
          .from('fetch_log')
          .select('at, kind, query, place_id, place_name, provider, result_count, outcome, note')
          .eq('user_id', userId)
          .order('at', { ascending: false })
          .limit(200),
        '读取抓取台账失败',
      );
    },

    async insertFetchLog(row: FetchLogRow) {
      assertOk(
        await client.from('fetch_log').insert({ user_id: userId, ...row }),
        '写入抓取台账失败',
      );
    },

    async fetchSelection() {
      return unwrap<SelectionRow[]>(
        await client.from('user_pool_selection').select('place_id').eq('user_id', userId),
        '读取池子选择失败',
      );
    },

    async replaceSelection(placeIds: string[] | null) {
      if (placeIds === null) {
        assertOk(
          await client.from('user_pool_selection').delete().eq('user_id', userId),
          '清空池子选择失败',
        );
        assertOk(
          await client.from('user_location_prefs')
            .upsert({ user_id: userId, selection_set: false }, { onConflict: 'user_id' }),
          '标记池子选择失败',
        );
        return;
      }

      // place_id 只可能是 Google 的 [A-Za-z0-9_-]，这里仍然把引号/反斜杠挡掉：
      // 下面那条 not.in 过滤器是拼字符串的，脏值会把过滤条件整段搞歪。
      const ids = [...new Set(placeIds.filter((id) => !/["\\]/.test(id)))];

      if (ids.length > 0) {
        assertOk(
          await client.from('user_pool_selection').upsert(
            ids.map((place_id) => ({ user_id: userId, place_id })),
            { onConflict: 'user_id,place_id' },
          ),
          '写入池子选择失败',
        );
      }

      const prune = client.from('user_pool_selection').delete().eq('user_id', userId);
      assertOk(
        await (ids.length > 0
          ? prune.not('place_id', 'in', `(${ids.map((id) => `"${id}"`).join(',')})`)
          : prune),
        '清理池子选择失败',
      );

      assertOk(
        await client.from('user_location_prefs')
          .upsert({ user_id: userId, selection_set: true }, { onConflict: 'user_id' }),
        '标记池子选择失败',
      );
    },

    async fetchLocationPrefs() {
      const { data, error } = await client
        .from('user_location_prefs')
        .select('source_kind, anchor_id, lat, lng, accuracy, source_ts, radius, last_gps_lat, last_gps_lng, last_gps_ts, selection_set')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw new Error(`读取位置偏好失败: ${error.message}`);
      return (data as LocationPrefsRow | null) ?? null;
    },

    async saveLocationPrefs(row: LocationPrefsWrite) {
      assertOk(
        await client.from('user_location_prefs')
          .upsert({ user_id: userId, ...row }, { onConflict: 'user_id' }),
        '写入位置偏好失败',
      );
    },
  };
}
