import { currentBackend } from '../store/backend';
import type { EngineState, FeedbackRecord, RollRecord } from './types';

/**
 * 引擎与页面唯一的存储入口。
 *
 * 函数签名（全同步）是与上层的契约，不随后端变化：
 * 游客模式落 localStorage 命名空间，登录后落 Supabase（ADR-0006）。
 * 真正的实现见 `src/lib/store/backend.ts` 与 `src/lib/cloud/store.ts`。
 */

export function loadState(): EngineState {
  return currentBackend().loadState();
}

export function saveState(state: EngineState): void {
  currentBackend().saveState(state);
}

export function loadRolls(): RollRecord[] {
  return currentBackend().loadRolls();
}

export function appendRoll(record: RollRecord): void {
  currentBackend().appendRoll(record);
}

export function loadFeedbacks(): FeedbackRecord[] {
  return currentBackend().loadFeedbacks();
}

export function appendFeedback(record: FeedbackRecord): void {
  currentBackend().appendFeedback(record);
}

/** 一键导出当前身份的全部数据（design/0001 §6 的 rolls 快照是离线回放的资产） */
export function exportAll(): string {
  const backend = currentBackend();
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      profile: backend.exportIdentity(),
      state: backend.loadState(),
      rolls: backend.loadRolls(),
      feedbacks: backend.loadFeedbacks(),
    },
    null,
    2,
  );
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
