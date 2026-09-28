import { runRefresh as engineRunRefresh, recentRefreshReports } from '@/lib/catalog/refresh';
import { travelEstimate as engineTravelEstimate } from '@/lib/catalog/travel';
import { httpRefreshPort } from '@/lib/places/refresh-fetch';
import type { RefreshReport, RefreshTrigger } from '@/lib/catalog/refresh-types';
import type { LocationPrefs } from '@/lib/catalog/types';
import { stubLoadReports, stubRunRefresh, stubTravelEstimate } from './stub';

/**
 * 单一开关：CTO 的刷新引擎完全就绪前，把这里改成 `true` 走 `stub.ts` 完成
 * UI 自测；**交付前必须是 `false`**（S5 spec「自测策略」）。
 *
 * 这个文件是 `/nearby` 页面拿刷新/驾车数据的唯一入口——真假数据切换只在这里，
 * 组件与页面代码永远只认 `runRefresh` / `loadReports` / `travelEstimate` 这三个名字。
 *
 * ⚠️ 交付时的真实状态（写清楚，别让下一个人猜）：
 * `src/lib/catalog/refresh.ts` / `src/lib/catalog/travel.ts` /
 * `src/lib/places/refresh-fetch.ts` 在本轮结束前已经落地，这里接的是
 * **真实**函数（不是占位），已用 Playwright 走过完整的手动重扫 → 更新事实 →
 * 发现新店 → 勾选加入池子 → 历史报告回看这一整条真实流程（不是 stub）：
 *   - `travelEstimate` —— 完全体，直接用。
 *   - `runRefresh(trigger, opts)` / `recentRefreshReports()`（对应契约里的
 *     `loadReports`，CTO 实现时改了名字，这里按实际签名接好）—— 走真实
 *     `httpRefreshPort()`，命中 `/api/refresh/details`、`/api/refresh/discover`、
 *     `/api/explore/preview`，`npm run build` 全绿。
 * `USE_STUB` 留着 `false` 即为交付状态；只在下次需要脱离真实引擎单独走查
 * UI 时临时切 `true`，验完记得切回来。
 */
export const USE_STUB = false;

export function runRefresh(
  trigger: RefreshTrigger,
  opts?: { prefs?: LocationPrefs; withinKm?: number },
): Promise<RefreshReport> {
  if (USE_STUB) return stubRunRefresh(trigger);
  return engineRunRefresh(trigger, {
    port: httpRefreshPort(),
    ...(opts?.prefs ? { prefs: opts.prefs } : {}),
    ...(opts?.withinKm !== undefined ? { withinKm: opts.withinKm } : {}),
  }).then((report) => {
    // 手动触发按 refresh.ts 自己的注释「一定产出报告」；null 只该出现在被节制
    // 条款拦下的自动触发。这里没有自动触发这条路，null 属于不该发生的情况，
    // 宁可抛出让上层 catch 住显示错误，也不要静默假装扫描完成了。
    if (report) return report;
    throw new Error('runRefresh 未产出报告（trigger=manual 理论上不会发生）');
  });
}

export function loadReports(): RefreshReport[] {
  return USE_STUB ? stubLoadReports() : recentRefreshReports();
}

export function travelEstimate(km: number): { mode: 'walk' | 'drive'; minutes: number } {
  return USE_STUB ? stubTravelEstimate(km) : engineTravelEstimate(km);
}
