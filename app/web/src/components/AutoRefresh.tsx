'use client';

import { useEffect, useRef } from 'react';

import { maybeAutoRefresh } from '@/lib/catalog/refresh-run';

/**
 * 每月自动刷新的**接线点**（design/0009 §4.2 的 Goal 2）。
 *
 * 为什么需要这个组件：引擎、节制条款、报告落库在 S4 全都写好了，
 * 但 `maybeAutoRefresh()` 一度**零调用点** —— 功能存在于代码里，
 * 却不会在任何时刻发生。这和 2026-09-27 那次「摇一摇没接池子」
 * 是同一类跨层断裂（INSTRUCTION.md §3），所以：
 *   1. 这里是唯一的调用点，
 *   2. `test/auto-refresh-wiring.test.ts` 钉死它的存在。
 *
 * 行为约束：
 *   - 挂在身份门禁**之内**渲染，保证 Profile / 账号已就绪，否则会对着空身份跑。
 *   - 一次应用加载至多触发一次（`ref` 守卫，React 18 的 StrictMode 双挂载也只跑一次）。
 *   - 节制条款（每天至多一次、单次 ≤20 家、只刷新不发现）在 `maybeAutoRefresh()` 里，
 *     这里不重复实现，免得两处规则漂移。
 *   - **完全静默**：不渲染任何东西、不打断用户。结果在 /nearby 的报告列表里看。
 *   - 失败只记日志：后台任务绝不允许把应用带崩。
 */
export default function AutoRefresh() {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    // 推迟到微任务：避免在 effect 主体里同步触发外部副作用链
    Promise.resolve()
      .then(() => maybeAutoRefresh())
      .then((report) => {
        if (report) {
          console.info(
            `[auto-refresh] 更新 ${report.updated.length} 家 · 无变化 ${report.unchanged} · 失败 ${report.failed.length}`,
          );
        }
      })
      .catch((err) => {
        console.warn('[auto-refresh] 后台刷新失败，不影响使用', err);
      });
  }, []);

  return null;
}
