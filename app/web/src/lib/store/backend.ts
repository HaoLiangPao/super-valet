import { getActiveProfile, getActiveProfileId, profileKey } from '../profiles/profiles';
import type { DataSuffix } from '../profiles/profiles';
import { emptyState } from '../engine/types';
import type { EngineState, FeedbackRecord, Restaurant, RollRecord } from '../engine/types';
import type { DishMention, FetchLogEntry } from '../places/contract';

/**
 * 存储后端抽象（ADR-0006）。
 *
 * 引擎与页面只认 `engine/store.ts` 的那 8 个同步函数；
 * 「数据到底躺在 localStorage 还是 Supabase」是这一层的事，上面无感知。
 *
 * 云模式之所以也能同步：CloudStore 在登录时把该账号的全量数据拉进内存，
 * 之后读走内存、写走「内存 + 后台队列」（write-through）。
 */
export interface StoreBackend {
  loadState(): EngineState;
  saveState(state: EngineState): void;
  loadRolls(): RollRecord[];
  appendRoll(record: RollRecord): void;
  loadFeedbacks(): FeedbackRecord[];
  appendFeedback(record: FeedbackRecord): void;
  /** 进 `exportAll()` 的 `profile` 字段，用来分辨这份导出是谁的 */
  exportIdentity(): unknown;

  /* ── 餐厅池（design/0005 EXPLORE 导入）──────────────────────────── */

  /** 当前身份**自己导入**的餐厅；不含种子 15 家（合并请用 `store/pool.ts`） */
  loadPool(): PoolEntry[];
  /** 幂等：同一个 placeId 再导入一次 = 覆盖，不会出现两条 */
  addToPool(entry: PoolEntry): void;
  removeFromPool(placeId: string): void;

  /* ── 抓取台账（design/0005 §4.7）──────────────────────────────── */

  /** 倒序返回最近的抓取记录 */
  loadFetchLog(): FetchLogEntry[];
  appendFetchLog(entry: FetchLogEntry): void;
}

/**
 * 一次导入落下来的全部东西。
 *
 * 为什么把 dishes / sourceText 和餐厅捆在一起，而不是各存各的：
 * 它们是同一次「用户主动粘贴」的产物，删餐厅就该一起删。
 * 云端那边拆成 `restaurants` / `dishes` / `sources` 三张表（design/0001 §6），
 * 这个形状是两个后端共同的运行时视图。
 */
export interface PoolEntry {
  restaurant: Restaurant;
  /** 与笔记一起抽到的菜品；按店名搜进来的为空数组 */
  dishes: DishMention[];
  addedAt: string;
  /** 用户粘贴的笔记原文（design/0001 §6 的 `sources.raw_text`），按店名导入时没有 */
  sourceText?: string;
  /** 事实数据的抓取时间，判断是否该按 30 天 TTL 重抓 */
  fetchedAt?: string;
  /** 一行抓取摘要 */
  summary?: string;
}

function isPoolEntry(v: unknown): v is PoolEntry {
  if (typeof v !== 'object' || v === null) return false;
  const e = v as Partial<PoolEntry>;
  return typeof e.restaurant === 'object'
    && e.restaurant !== null
    && typeof (e.restaurant as Restaurant).placeId === 'string';
}

/* ------------------------------------------------------------------ *
 * 本地后端（游客模式）—— 与账号轮之前的行为逐字节一致
 * ------------------------------------------------------------------ */

/**
 * 全部数据按活跃 Profile 命名空间存放：`sv.<profileId>.<suffix>`（design/0004 §4）。
 * 没有活跃 Profile 时读返回空、写 no-op —— 正常流程有 ProfileGate 门禁，
 * 这里是防御：任何漏网的调用都不许污染别人的数据。
 */
function keyFor(suffix: DataSuffix): string | null {
  const id = getActiveProfileId();
  return id ? profileKey(id, suffix) : null;
}

function read<T>(suffix: DataSuffix, fallback: T): T {
  const key = keyFor(suffix);
  if (!key) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(suffix: DataSuffix, value: unknown): void {
  const key = keyFor(suffix);
  if (!key) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 存不进去（隐私模式等）就当内存态跑
  }
}

export const localBackend: StoreBackend = {
  loadState() {
    return { ...emptyState(), ...read<Partial<EngineState>>('state.v1', {}) };
  },
  saveState(state) {
    write('state.v1', state);
  },
  loadRolls() {
    return read<RollRecord[]>('rolls.v1', []);
  },
  appendRoll(record) {
    write('rolls.v1', [...this.loadRolls(), record]);
  },
  loadFeedbacks() {
    return read<FeedbackRecord[]>('feedbacks.v1', []);
  },
  appendFeedback(record) {
    write('feedbacks.v1', [...this.loadFeedbacks(), record]);
  },
  exportIdentity() {
    return getActiveProfile();
  },

  loadPool() {
    // 存的是用户数据，不是我们写的：脏条目直接丢掉，不让一条坏记录带崩摇一摇
    return read<unknown[]>('pool.v1', []).filter(isPoolEntry);
  },
  addToPool(entry) {
    const next = this.loadPool().filter((e) => e.restaurant.placeId !== entry.restaurant.placeId);
    next.push(entry);
    write('pool.v1', next);
  },
  removeFromPool(placeId) {
    write('pool.v1', this.loadPool().filter((e) => e.restaurant.placeId !== placeId));
  },

  loadFetchLog() {
    return read<FetchLogEntry[]>('fetchlog.v1', []);
  },
  appendFetchLog(entry) {
    // 台账只用于排查与成本观察，不必无限增长：留最近 200 条
    write('fetchlog.v1', [entry, ...this.loadFetchLog()].slice(0, 200));
  },
};

/* ------------------------------------------------------------------ *
 * 当前后端
 * ------------------------------------------------------------------ */

let active: StoreBackend | null = null;

/** 登录成功时装上 CloudStore；登出传 null 退回本地 Profile 模式 */
export function setStoreBackend(backend: StoreBackend | null): void {
  active = backend;
}

export function currentBackend(): StoreBackend {
  return active ?? localBackend;
}

/** 当前是否处于云模式（UI 用来决定显示账号徽章还是 Profile 徽章） */
export function isCloudMode(): boolean {
  return active !== null;
}
