/**
 * EXPLORE 页专用的纯展示格式化函数。不接触任何打分/学习逻辑，
 * 只管「把 Restaurant 里的事实字段变成一行人话」。
 *
 * i18n（design/0007 §4）：这些是普通模块函数（不是组件/hook），
 * 拿不到 `useT()`，locale 相关的文案由调用方（组件）传 `t`/`locale` 进来。
 */
import { CATEGORY_LABELS, categoryOf } from '@/lib/engine/cuisine';
import type { Restaurant } from '@/lib/engine/types';
import { categoryLabel } from '@/lib/i18n';
import type { Locale, MessageKey, TFunc } from '@/lib/i18n';

export function categoryLabelOf(r: Restaurant, locale: Locale): string {
  return categoryLabel(categoryOf(r), locale, CATEGORY_LABELS);
}

export function formatPrice(level: number | null): string | null {
  if (level == null || level <= 0) return null;
  return '$'.repeat(level);
}

const WEEKDAY_KEYS: MessageKey[] = [
  'explore.weekday.sun', 'explore.weekday.mon', 'explore.weekday.tue', 'explore.weekday.wed',
  'explore.weekday.thu', 'explore.weekday.fri', 'explore.weekday.sat',
];

/** 列表分隔符：中文顿号、英文逗号 —— 不是字典文案，是标点习惯 */
function listJoin(items: string[], locale: Locale): string {
  return items.join(locale === 'zh' ? '、' : ', ');
}

/** '26:00' 这种跨零点表示法转成「次日 02:00」/「next day 02:00」方便人看 */
function fmtHm(raw: string, t: TFunc): string {
  const [hStr, mStr] = raw.split(':');
  const h = Number(hStr);
  const overflow = h >= 24;
  const displayH = h % 24;
  return `${overflow ? t('explore.hours.nextDayPrefix') : ''}${String(displayH).padStart(2, '0')}:${mStr ?? '00'}`;
}

/** 营业时间摘要：design/0005 §4.1 预览卡要求的「营业时间摘要」一行 */
export function formatServiceWindows(r: Restaurant, t: TFunc, locale: Locale): string {
  const closedSuffix = r.closedDays.length > 0
    ? t('explore.hours.closedSuffix', { days: listJoin(r.closedDays.map((d) => t(WEEKDAY_KEYS[d])), locale) })
    : '';

  if (r.serviceWindows.length === 0) {
    return `${t('explore.hours.open24')}${closedSuffix}`;
  }

  const windows = listJoin(
    r.serviceWindows.map((w) => {
      const dayLabel = w.day === null ? '' : `${t(WEEKDAY_KEYS[w.day])} `;
      return `${dayLabel}${fmtHm(w.open, t)}–${fmtHm(w.close, t)}`;
    }),
    locale,
  );
  return `${windows}${closedSuffix}`;
}
