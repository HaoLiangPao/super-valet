import { personaSeedState } from '../profiles/personas';
import type { StoreBackend, PoolEntry } from '../store/backend';
import { emptyState } from '../engine/types';
import type { FetchLogEntry } from '../places/contract';
import type { EngineState, FeedbackRecord, RollRecord } from '../engine/types';
import type { CloudGateway } from './gateway';
import {
  changedRows,
  feedbackToRow,
  fetchLogToRow,
  indexBy,
  locationPrefsToRow,
  rollToRow,
  rowToFeedback,
  rowToFetchLog,
  rowToLocationPrefs,
  rowToRoll,
  rowsToPool,
  rowsToSelection,
  rowsToState,
  stateToCategoryRows,
  stateToRestaurantRows,
  toImportPayload,
} from './rows';
import type { CategoryRow, RestaurantRow } from './rows';
import type { LocationPrefs, PoolSelection } from '../catalog/types';

export interface CloudIdentity {
  userId: string;
  email: string | null;
  displayName: string | null;
  emoji: string;
  personaKey: string | null;
  onboardedAt: string | null;
}

interface WriteOp {
  label: string;
  run: () => Promise<void>;
  onFail?: () => void;
}

/** 失败重试队列的上限：再积压下去说明是账号/网络级故障，不如早点报错 */
const MAX_RETRY_BACKLOG = 50;

function clone<T>(value: T): T {
  return structuredClone(value);
}

/**
 * 云模式的存储后端（ADR-0006）。
 *
 * 契约要求 `engine/store.ts` 的 8 个函数保持同步签名，而 Supabase 是异步的，
 * 所以这里走 write-through：
 *   - 登录时一次性把该账号的全量数据拉进内存（`openCloudStore`）；
 *   - 读 = 读内存快照（同步，返回副本，调用方随便 mutate）；
 *   - 写 = 先改内存快照（同步生效，UI 立即正确），再进串行写队列落库。
 *
 * 队列串行是刻意的：rolls 必须先于 feedbacks 落库（DB 有外键），
 * 并发 upsert 会把这个顺序打散。
 */
export class CloudStore implements StoreBackend {
  private state: EngineState;
  private rolls: RollRecord[];
  private feedbacks: FeedbackRecord[];
  private pool: PoolEntry[];
  private fetchLog: FetchLogEntry[];
  private selection: PoolSelection;
  private locationPrefs: LocationPrefs;

  /** 上一次成功推上去的行，用来做差分：整份 state 存进来，只推真正变了的行 */
  private lastRestaurantRows: Map<string, RestaurantRow>;
  private lastCategoryRows: Map<string, CategoryRow>;

  private chain: Promise<void> = Promise.resolve();
  private retryable: WriteOp[] = [];

  identity: CloudIdentity;
  lastError: string | null = null;

  constructor(
    private readonly gateway: CloudGateway,
    identity: CloudIdentity,
    snapshot: {
      state: EngineState;
      rolls: RollRecord[];
      feedbacks: FeedbackRecord[];
      pool: PoolEntry[];
      fetchLog: FetchLogEntry[];
      selection: PoolSelection;
      locationPrefs: LocationPrefs;
    },
  ) {
    this.identity = identity;
    this.state = snapshot.state;
    this.rolls = snapshot.rolls;
    this.feedbacks = snapshot.feedbacks;
    this.pool = snapshot.pool;
    this.fetchLog = snapshot.fetchLog;
    this.selection = snapshot.selection;
    this.locationPrefs = snapshot.locationPrefs;
    this.lastRestaurantRows = indexBy(stateToRestaurantRows(this.state), (r) => r.place_id);
    this.lastCategoryRows = indexBy(stateToCategoryRows(this.state), (r) => r.category);
  }

  /* ---------------- StoreBackend ---------------- */

  loadState(): EngineState {
    return clone(this.state);
  }

  saveState(state: EngineState): void {
    this.state = clone(state);

    const restaurants = stateToRestaurantRows(this.state);
    const categories = stateToCategoryRows(this.state);
    const dirtyRestaurants = changedRows(this.lastRestaurantRows, restaurants, (r) => r.place_id);
    const dirtyCategories = changedRows(this.lastCategoryRows, categories, (r) => r.category);
    if (dirtyRestaurants.length === 0 && dirtyCategories.length === 0) return;

    for (const row of dirtyRestaurants) this.lastRestaurantRows.set(row.place_id, row);
    for (const row of dirtyCategories) this.lastCategoryRows.set(row.category, row);

    if (dirtyRestaurants.length > 0) {
      this.enqueue({
        label: '单店后验',
        run: () => this.gateway.upsertRestaurants(dirtyRestaurants),
        // 没推上去就别记成「已同步」，让下一次 saveState 重新算成脏行
        onFail: () => {
          for (const row of dirtyRestaurants) this.lastRestaurantRows.delete(row.place_id);
        },
      });
    }
    if (dirtyCategories.length > 0) {
      this.enqueue({
        label: '类别后验',
        run: () => this.gateway.upsertCategories(dirtyCategories),
        onFail: () => {
          for (const row of dirtyCategories) this.lastCategoryRows.delete(row.category);
        },
      });
    }
  }

  loadRolls(): RollRecord[] {
    return clone(this.rolls);
  }

  appendRoll(record: RollRecord): void {
    const copy = clone(record);
    this.rolls.push(copy);
    this.enqueue({ label: '摇号记录', run: () => this.gateway.insertRoll(rollToRow(copy)) });
  }

  loadFeedbacks(): FeedbackRecord[] {
    return clone(this.feedbacks);
  }

  appendFeedback(record: FeedbackRecord): void {
    const copy = clone(record);
    this.feedbacks.push(copy);
    this.enqueue({ label: '反馈', run: () => this.gateway.upsertFeedback(feedbackToRow(copy)) });
  }

  loadPool(): PoolEntry[] {
    return this.pool.map((e) => clone(e));
  }

  addToPool(entry: PoolEntry): void {
    this.pool = [...this.pool.filter((e) => e.restaurant.placeId !== entry.restaurant.placeId), clone(entry)];
    const payload = toImportPayload(entry);
    this.enqueue({
      label: `导入 ${entry.restaurant.name}`,
      run: () => this.gateway.importRestaurant(payload),
    });
  }

  removeFromPool(placeId: string): void {
    this.pool = this.pool.filter((e) => e.restaurant.placeId !== placeId);
    this.enqueue({
      label: `移出 ${placeId}`,
      run: () => this.gateway.deleteFromPool(placeId),
    });
  }

  loadFetchLog(): FetchLogEntry[] {
    return this.fetchLog.map((e) => clone(e));
  }

  appendFetchLog(entry: FetchLogEntry): void {
    this.fetchLog = [clone(entry), ...this.fetchLog].slice(0, 200);
    const row = fetchLogToRow(entry);
    this.enqueue({
      label: '记录抓取台账',
      run: () => this.gateway.insertFetchLog(row),
    });
  }

  loadSelection(): PoolSelection {
    return this.selection === null ? null : [...this.selection];
  }

  saveSelection(selection: PoolSelection): void {
    this.selection = selection === null ? null : [...selection];
    const payload = this.selection === null ? null : [...this.selection];
    this.enqueue({
      label: '池子选择',
      run: () => this.gateway.replaceSelection(payload),
    });
  }

  loadLocationPrefs(): LocationPrefs {
    return clone(this.locationPrefs);
  }

  saveLocationPrefs(prefs: LocationPrefs): void {
    this.locationPrefs = clone(prefs);
    const row = locationPrefsToRow(this.locationPrefs);
    this.enqueue({
      label: '位置偏好',
      run: () => this.gateway.saveLocationPrefs(row),
    });
  }

  exportIdentity(): unknown {
    return {
      mode: 'cloud',
      userId: this.identity.userId,
      email: this.identity.email,
      name: this.identity.displayName,
      emoji: this.identity.emoji,
      personaKey: this.identity.personaKey,
    };
  }

  /* ---------------- 云模式专有 ---------------- */

  /** 首登选完 persona（或「从零开始」传 null）：种类别层先验 + 标记已引导 */
  async completeOnboarding(personaKey: string | null, emoji: string): Promise<void> {
    const seed = personaKey ? personaSeedState(personaKey) : null;
    if (seed) this.saveState({ ...emptyState(), ...seed });

    const onboardedAt = new Date().toISOString();
    const displayName = this.identity.displayName
      ?? (this.identity.email ? this.identity.email.split('@')[0] : null);
    this.identity = { ...this.identity, personaKey, emoji, onboardedAt, displayName };
    this.enqueue({
      label: '账号档案',
      run: () => this.gateway.updateProfile({
        persona_key: personaKey,
        emoji,
        display_name: displayName,
        onboarded_at: onboardedAt,
      }),
    });
    await this.flush();
  }

  /** 等所有排队中的写落库（测试、以及「导出/离开页面前」用） */
  flush(): Promise<void> {
    this.enqueue({ label: 'flush', run: async () => {} });
    return this.chain;
  }

  /* ---------------- 写队列 ---------------- */

  private enqueue(op: WriteOp): void {
    this.chain = this.chain.then(async () => {
      // 先补跑上次失败的，保住 rolls → feedbacks 的先后次序
      const pending = this.retryable.splice(0);
      for (const p of pending) await this.attempt(p);
      await this.attempt(op);
    });
  }

  private async attempt(op: WriteOp): Promise<void> {
    try {
      await op.run();
      return;
    } catch {
      // 一次立即重试：绝大多数失败是瞬时网络抖动
    }
    try {
      await op.run();
      return;
    } catch (err) {
      op.onFail?.();
      this.lastError = `${op.label}同步失败：${err instanceof Error ? err.message : String(err)}`;
      console.error('[supper-valet] 云端写入失败', op.label, err);
      if (this.retryable.length < MAX_RETRY_BACKLOG) this.retryable.push(op);
    }
  }
}

/** 登录后调用：拉全量数据，装配出一个可以同步读写的 CloudStore */
export async function openCloudStore(
  gateway: CloudGateway,
  userId: string,
  email: string | null,
): Promise<CloudStore> {
  // 核心数据（口味/摇号/反馈）拿不到就该报错登录失败；
  // 但**附属数据拿不到不该让人进不去**：EXPLORE 的四张表是后加的，
  // 迁移比部署晚一步时，旧账号会 404 —— 那时候用户仍然应该能正常摇一摇。
  const [profile, restaurants, categories, rollRows, feedbackRows] = await Promise.all([
    gateway.fetchProfile(),
    gateway.fetchRestaurants(),
    gateway.fetchCategories(),
    gateway.fetchRolls(),
    gateway.fetchFeedbacks(),
  ]);

  async function optional<T>(what: string, run: () => Promise<T[]>): Promise<T[]> {
    try {
      return await run();
    } catch (err) {
      console.warn(`[cloud] ${what} 读取失败，按空处理（EXPLORE 相关表可能还没迁移）`, err);
      return [];
    }
  }

  async function optionalOne<T>(what: string, run: () => Promise<T | null>): Promise<T | null> {
    try {
      return await run();
    } catch (err) {
      console.warn(`[cloud] ${what} 读取失败，按未设置处理（相关表可能还没迁移）`, err);
      return null;
    }
  }

  const [poolRows, dishRows, sourceRows, fetchLogRows, selectionRows, prefsRow] = await Promise.all([
    optional('餐厅池', () => gateway.fetchPool()),
    optional('菜品', () => gateway.fetchDishes()),
    optional('笔记原文', () => gateway.fetchSources()),
    optional('抓取台账', () => gateway.fetchFetchLog()),
    optional('池子选择', () => gateway.fetchSelection()),
    optionalOne('位置偏好', () => gateway.fetchLocationPrefs()),
  ]);

  const identity: CloudIdentity = {
    userId,
    email: profile?.email ?? email,
    displayName: profile?.display_name ?? null,
    emoji: profile?.emoji ?? '🍚',
    personaKey: profile?.persona_key ?? null,
    onboardedAt: profile?.onboarded_at ?? null,
  };

  return new CloudStore(gateway, identity, {
    state: rowsToState(restaurants, categories),
    rolls: rollRows.map(rowToRoll),
    feedbacks: feedbackRows.map(rowToFeedback),
    pool: rowsToPool(poolRows, dishRows, sourceRows),
    fetchLog: fetchLogRows.map(rowToFetchLog),
    // 迁移还没跑时 prefsRow 是 null → selection 也是 null → 池子默认成 15 家种子，
    // 与目录轮之前的行为一致，用户不会被锁在门外（openCloudStore 的既定原则）
    selection: rowsToSelection(selectionRows, prefsRow?.selection_set === true),
    locationPrefs: rowToLocationPrefs(prefsRow),
  });
}
