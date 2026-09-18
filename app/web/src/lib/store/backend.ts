import { getActiveProfile, getActiveProfileId, profileKey } from '../profiles/profiles';
import type { DataSuffix } from '../profiles/profiles';
import { emptyState } from '../engine/types';
import type { EngineState, FeedbackRecord, RollRecord } from '../engine/types';

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
