import { httpRefreshPort } from '@/lib/places/refresh-fetch';
import { runRefresh, shouldAutoRefresh } from './refresh';
import type { RefreshReport } from './refresh-types';

/**
 * 界面唯一需要 import 的刷新入口（S5 用这两个函数，不必知道 `RefreshPort`）。
 *
 * 为什么单独一个文件：`refresh.ts` 是**纯流水线**，port 靠注入，所以它不认识
 * `fetch`、也不 import i18n（那条链会把 React 拖进单测）。把「装上真端口」
 * 这一步放这里，两边各自干净：测试用假端口测流水线，产品用这里的两个函数。
 */

export interface StartRefreshOptions {
  /** 自定义半径（km），design/0009 §4.5 的 1–50 输入；不传按用户的半径档位 */
  withinKm?: number;
  /** 只刷新已有、不做发现（例如用户只想更新事实） */
  discover?: boolean;
  /** 指定条目（池子页的「立刻重抓这一家」） */
  placeIds?: string[];
}

/**
 * 手动重扫：刷新已有 + 发现新店，**一定**返回一份报告（用户点了按钮就该有回执）。
 * 不占用自动刷新的每日额度 —— 那是用户自己要的。
 */
export function startRefresh(opts: StartRefreshOptions = {}): Promise<RefreshReport | null> {
  return runRefresh('manual', { port: httpRefreshPort(), ...opts });
}

/**
 * 打开应用时的后台刷新。三条节制条款在这条路上全生效：
 * 每天至多一次、单次至多 `REFRESH_BATCH_LIMIT` 家、**只刷新不发现**。
 * 没有过期条目或今天已经刷过 → 返回 `null`，什么都不做、不落报告。
 */
export function maybeAutoRefresh(): Promise<RefreshReport | null> {
  if (!shouldAutoRefresh()) return Promise.resolve(null);
  return runRefresh('auto', { port: httpRefreshPort() });
}
