import { getActiveProfile, getActiveProfileId, profileKey } from '../profiles/profiles';
import type { DataSuffix } from '../profiles/profiles';
import { emptyState } from './types';
import type { EngineState, FeedbackRecord, RollRecord } from './types';

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

export function loadState(): EngineState {
  return { ...emptyState(), ...read<Partial<EngineState>>('state.v1', {}) };
}

export function saveState(state: EngineState): void {
  write('state.v1', state);
}

export function loadRolls(): RollRecord[] {
  return read<RollRecord[]>('rolls.v1', []);
}

export function appendRoll(record: RollRecord): void {
  const rolls = loadRolls();
  rolls.push(record);
  write('rolls.v1', rolls);
}

export function loadFeedbacks(): FeedbackRecord[] {
  return read<FeedbackRecord[]>('feedbacks.v1', []);
}

export function appendFeedback(record: FeedbackRecord): void {
  const all = loadFeedbacks();
  all.push(record);
  write('feedbacks.v1', all);
}

/** 一键导出当前 Profile 的全部数据（design/0001 §6 的 rolls 快照是离线回放的资产） */
export function exportAll(): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      profile: getActiveProfile(),
      state: loadState(),
      rolls: loadRolls(),
      feedbacks: loadFeedbacks(),
    },
    null,
    2,
  );
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
