import type { ServiceWindow } from '@/data/seed-restaurants';

/**
 * Google Places API (New) 的 `regularOpeningHours` → 我们的 `ServiceWindow[] + closedDays`。
 *
 * 为什么单独一个文件：营业时间是**最伤信任的一类数据**（design/0005 §4.2）——
 * 推一家关着门的店比推错菜系严重得多，所以转换逻辑必须能被单测钉死。
 *
 * 两边的约定必须吻合（`src/lib/engine/openHours.ts` 是唯一的判定实现）：
 *   - weekday：0=周日 … 6=周六（Google 的 `period.open.day` 同一套编号，不需要换算）
 *   - 跨零点：用 `'26:00'` 表示次日 2:00；`'24:00'` 表示当天结束
 *   - `serviceWindows` 为空数组 = 24 小时营业
 *   - `closedDays` 在引擎里**先于**窗口判定生效，所以「某天没有任何窗口开始」
 *     才算 closedDay；周六延到周日凌晨的部分会被 closedDays 吃掉，
 *     这是既有引擎的语义，方向是安全的（少推一次，不会推到关门的店）。
 */

export interface GoogleTimePoint {
  day?: number;
  hour?: number;
  minute?: number;
}

export interface GooglePeriod {
  open?: GoogleTimePoint;
  close?: GoogleTimePoint;
}

export interface GoogleOpeningHours {
  periods?: GooglePeriod[];
  weekdayDescriptions?: string[];
}

export interface ConvertedHours {
  serviceWindows: ServiceWindow[];
  closedDays: number[];
}

const DAY_MINUTES = 1440;

/** 分钟数 → 'HH:mm'；允许 >= 24 小时（跨零点用 '26:00' 这种表示） */
export function minutesToHm(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function pointMinutes(p: GoogleTimePoint | undefined): number {
  return (p?.hour ?? 0) * 60 + (p?.minute ?? 0);
}

function isValidDay(d: unknown): d is number {
  return typeof d === 'number' && Number.isInteger(d) && d >= 0 && d <= 6;
}

/** 一条 period 展开成若干「某天的窗口」；跨天的 period 按天切开 */
function expandPeriod(period: GooglePeriod): ServiceWindow[] {
  const openDay = period.open?.day;
  if (!isValidDay(openDay)) return [];
  const openMin = pointMinutes(period.open);

  // 没有 close：Google 用「只有 open 没有 close」表示常开，按当天开到底处理
  if (!period.close) {
    return [{ day: openDay, open: minutesToHm(openMin), close: minutesToHm(DAY_MINUTES) }];
  }

  const closeDay = isValidDay(period.close.day) ? period.close.day : openDay;
  const closeMin = pointMinutes(period.close);
  const dayDelta = (closeDay - openDay + 7) % 7;

  if (dayDelta === 0) {
    // 同一天内；close <= open 是脏数据，按开到当天结束处理（宁可窄不可宽的反面，
    // 但这里只会出现在 Google 自己给了矛盾数据时，保留窗口比整天丢掉更接近事实）
    const close = closeMin > openMin ? closeMin : DAY_MINUTES;
    return [{ day: openDay, open: minutesToHm(openMin), close: minutesToHm(close) }];
  }

  if (dayDelta === 1) {
    // 跨零点：次日 2:00 记成 '26:00'，次日 0:00 记成 '24:00'
    return [{
      day: openDay,
      open: minutesToHm(openMin),
      close: minutesToHm(DAY_MINUTES + closeMin),
    }];
  }

  // 跨多天（如「周一 9:00 一直开到周五 22:00」）：按天切开，
  // 中间整天记成 00:00–24:00，引擎只会逐天判定，不需要理解跨天区间。
  const windows: ServiceWindow[] = [
    { day: openDay, open: minutesToHm(openMin), close: minutesToHm(DAY_MINUTES) },
  ];
  for (let i = 1; i < dayDelta; i++) {
    windows.push({
      day: (openDay + i) % 7,
      open: '00:00',
      close: minutesToHm(DAY_MINUTES),
    });
  }
  if (closeMin > 0) {
    windows.push({ day: closeDay, open: '00:00', close: minutesToHm(closeMin) });
  }
  return windows;
}

function windowKey(w: ServiceWindow): string {
  return `${w.open}-${w.close}`;
}

/**
 * 把 Google 的 periods 转成引擎认识的形状。
 *
 * 拿不到营业时间（`regularOpeningHours` 缺失或 periods 为空）时返回
 * `{ serviceWindows: [], closedDays: [] }` —— 即「不施加时间约束」。
 * 这是刻意的：design/0005 §4.2 禁止我们编造营业时间，而编一个
 * 「11:00–21:00 的通用窗口」正是那条红线；宁可不约束，也不假装知道。
 */
export function convertOpeningHours(hours?: GoogleOpeningHours | null): ConvertedHours {
  const periods = hours?.periods ?? [];
  if (periods.length === 0) return { serviceWindows: [], closedDays: [] };

  // Google 的 24/7 哨兵：唯一一条 period，open 是周日 00:00，且没有 close
  if (
    periods.length === 1
    && periods[0].close === undefined
    && periods[0].open?.day === 0
    && (periods[0].open?.hour ?? 0) === 0
    && (periods[0].open?.minute ?? 0) === 0
  ) {
    return { serviceWindows: [], closedDays: [] };
  }

  const expanded = periods.flatMap(expandPeriod);
  if (expanded.length === 0) return { serviceWindows: [], closedDays: [] };

  const byDay = new Map<number, ServiceWindow[]>();
  for (const w of expanded) {
    const day = w.day as number;
    const list = byDay.get(day) ?? [];
    // 同一天内重复窗口去重（Google 偶尔给重复 period）
    if (!list.some((x) => windowKey(x) === windowKey(w))) list.push(w);
    byDay.set(day, list);
  }
  for (const list of byDay.values()) {
    list.sort((a, b) => (a.open < b.open ? -1 : a.open > b.open ? 1 : 0));
  }

  const openDays = [...byDay.keys()].sort((a, b) => a - b);
  const closedDays = [0, 1, 2, 3, 4, 5, 6].filter((d) => !byDay.has(d));

  // 所有营业日窗口完全一致 → 收敛成 day:null 一组（与种子数据 `w()` 的写法对齐）
  const signature = (day: number) => byDay.get(day)!.map(windowKey).join('|');
  const allSame = openDays.length > 1
    && openDays.every((d) => signature(d) === signature(openDays[0]));

  if (allSame) {
    const serviceWindows = byDay.get(openDays[0])!.map((w) => ({
      day: null,
      open: w.open,
      close: w.close,
    }));
    return { serviceWindows, closedDays };
  }

  const serviceWindows = openDays.flatMap((d) => byDay.get(d)!);
  return { serviceWindows, closedDays };
}
