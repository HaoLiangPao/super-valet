import type { Restaurant } from './types';

function parseHm(s: string): number {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
}

/**
 * 修复版营业判断（research/0001 §5）：day:null 的跨零点窗口
 * 同时覆盖「昨天延伸到今天凌晨」。weekday 0=周日 … 6=周六。
 */
export function isOpenAtMinutes(r: Restaurant, weekday: number, minutes: number): boolean {
  if (r.closedDays.includes(weekday)) return false;
  const wins = r.serviceWindows;
  if (wins.length === 0) return true; // 24 小时

  return wins.some((win) => {
    const open = parseHm(win.open);
    const close = parseHm(win.close);
    if (win.day === null || win.day === weekday) {
      if (close <= 1440) return minutes >= open && minutes < close;
      return minutes >= open || (win.day === null && minutes < close - 1440);
    }
    const prev = (weekday + 6) % 7;
    return win.day === prev && close > 1440 && minutes < close - 1440;
  });
}
