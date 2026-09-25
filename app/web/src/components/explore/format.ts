/**
 * EXPLORE 页专用的纯展示格式化函数。不接触任何打分/学习逻辑，
 * 只管「把 Restaurant 里的事实字段变成一行人话」。
 */
import { CATEGORY_LABELS, categoryOf } from '@/lib/engine/cuisine';
import type { Restaurant } from '@/lib/engine/types';

export function categoryLabelOf(r: Restaurant): string {
  const cat = categoryOf(r);
  return CATEGORY_LABELS[cat] ?? cat;
}

export function formatPrice(level: number | null): string | null {
  if (level == null || level <= 0) return null;
  return '$'.repeat(level);
}

const WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

/** '26:00' 这种跨零点表示法转成「次日 02:00」方便人看 */
function fmtHm(raw: string): string {
  const [hStr, mStr] = raw.split(':');
  const h = Number(hStr);
  const overflow = h >= 24;
  const displayH = h % 24;
  return `${overflow ? '次日 ' : ''}${String(displayH).padStart(2, '0')}:${mStr ?? '00'}`;
}

/** 营业时间摘要：design/0005 §4.1 预览卡要求的「营业时间摘要」一行 */
export function formatServiceWindows(r: Restaurant): string {
  const closedSuffix = r.closedDays.length > 0
    ? `；${r.closedDays.map((d) => WEEKDAY_LABELS[d]).join('、')}休息`
    : '';

  if (r.serviceWindows.length === 0) {
    return `全年 24 小时营业${closedSuffix}`;
  }

  const windows = r.serviceWindows
    .map((w) => {
      const dayLabel = w.day === null ? '' : `${WEEKDAY_LABELS[w.day]} `;
      return `${dayLabel}${fmtHm(w.open)}–${fmtHm(w.close)}`;
    })
    .join('、');
  return `${windows}${closedSuffix}`;
}
