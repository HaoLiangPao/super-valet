import { emptyState } from './types';
import type { EngineState, FeedbackRecord, RollRecord } from './types';

const KEY_STATE = 'sv.state.v1';
const KEY_ROLLS = 'sv.rolls.v1';
const KEY_FEEDBACKS = 'sv.feedbacks.v1';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 存不进去（隐私模式等）就当内存态跑
  }
}

export function loadState(): EngineState {
  return { ...emptyState(), ...read<Partial<EngineState>>(KEY_STATE, {}) };
}

export function saveState(state: EngineState): void {
  write(KEY_STATE, state);
}

export function loadRolls(): RollRecord[] {
  return read<RollRecord[]>(KEY_ROLLS, []);
}

export function appendRoll(record: RollRecord): void {
  const rolls = loadRolls();
  rolls.push(record);
  write(KEY_ROLLS, rolls);
}

export function loadFeedbacks(): FeedbackRecord[] {
  return read<FeedbackRecord[]>(KEY_FEEDBACKS, []);
}

export function appendFeedback(record: FeedbackRecord): void {
  const all = loadFeedbacks();
  all.push(record);
  write(KEY_FEEDBACKS, all);
}

/** 一键导出全部数据（design/0001 §6 的 rolls 快照是未来做离线回放的资产） */
export function exportAll(): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
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
