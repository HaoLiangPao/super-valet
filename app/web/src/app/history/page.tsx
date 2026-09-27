'use client';

import { useEffect, useState } from 'react';

import { swatchFor } from '@/components/cuisineSwatch';
import { findInCatalog } from '@/lib/catalog/catalog';
import { categoryOf } from '@/lib/engine/cuisine';
import { exportAll, loadFeedbacks, loadRolls } from '@/lib/engine/store';
import type { FeedbackRecord, RollRecord, SkipReason } from '@/lib/engine/types';
import { useT } from '@/lib/i18n';
import type { MessageKey, TFunc } from '@/lib/i18n';

const SKIP_KEYS: Record<SkipReason, MessageKey> = {
  too_far: 'skip.too_far',
  too_pricey: 'skip.too_pricey',
  just_ate: 'skip.just_ate',
  wrong_cuisine: 'skip.wrong_cuisine',
  closed: 'skip.closed',
  no_mood: 'skip.no_mood',
  other: 'skip.other',
};

const RATING_KEY: Record<'good' | 'ok' | 'bad', MessageKey> = {
  good: 'history.rating.good',
  ok: 'history.rating.ok',
  bad: 'history.rating.bad',
};

const RATING_EMOJI: Record<'good' | 'ok' | 'bad', string> = {
  good: '👍',
  ok: '😐',
  bad: '👎',
};

/** 找不到就返回 undefined——全量目录（含用户自己导入的），不只是 15 家种子 */
function findRestaurant(placeId: string) {
  return findInCatalog(placeId) ?? undefined;
}

const WEEKDAY_KEYS: MessageKey[] = [
  'history.weekday.sun', 'history.weekday.mon', 'history.weekday.tue', 'history.weekday.wed',
  'history.weekday.thu', 'history.weekday.fri', 'history.weekday.sat',
];

function formatDate(iso: string, t: TFunc): { day: string; wd: string } {
  const d = new Date(iso);
  return { day: `${d.getMonth() + 1}/${d.getDate()}`, wd: t(WEEKDAY_KEYS[d.getDay()]) };
}

export default function HistoryPage() {
  const t = useT();
  const [rolls, setRolls] = useState<RollRecord[] | null>(null);
  const [feedbacks, setFeedbacks] = useState<FeedbackRecord[] | null>(null);

  useEffect(() => {
    Promise.resolve().then(() => {
      setRolls(loadRolls());
      setFeedbacks(loadFeedbacks());
    });
  }, []);

  if (!rolls || !feedbacks) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted">{t('common.loading')}</div>
    );
  }

  const total = rolls.length;
  const acceptedCount = rolls.filter((r) => r.action === 'accepted').length;
  const acceptRate = total > 0 ? Math.round((acceptedCount / total) * 100) : 0;
  const sorted = [...rolls].sort((a, b) => b.rolledAt.localeCompare(a.rolledAt));

  function handleExport() {
    const blob = new Blob([exportAll()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `supper-valet-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-1 flex-col gap-3 pb-3">
      <div
        className="flex justify-between rounded-[16px] px-4 py-3 text-sm"
        style={{ background: 'var(--color-neutral-100)', border: '1px solid var(--color-divider)', color: 'var(--color-neutral-800)' }}
      >
        <span>{t('history.stat.total', { count: total })}</span>
        <span>{t('history.stat.acceptRate', { rate: acceptRate })}</span>
      </div>

      {sorted.length === 0 ? (
        <p className="mt-12 text-center text-muted">{t('history.empty')}</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {sorted.map((roll, i) => {
            const restaurant = findRestaurant(roll.restaurantId);
            const name = restaurant?.name ?? roll.restaurantId;
            const { day, wd } = formatDate(roll.rolledAt, t);
            const swatch = restaurant ? swatchFor(categoryOf(restaurant)) : { bg: 'var(--color-neutral-400)', ink: 'var(--color-bg)' };

            if (roll.action === 'accepted') {
              const fb = feedbacks.find((f) => f.rollId === roll.id);
              // '没去成' 是写入时的内部标记（page.tsx 的 appendFeedback），不是界面文案，
              // 存量数据也用它比对，不能跟着 locale 改——展示文字照样走 t()。
              const noShow = fb?.note === '没去成';
              const ratingLabel = fb ? (noShow ? t('history.rating.noShow') : t(RATING_KEY[fb.rating])) : t('history.rating.pending');
              const ratingBg = !fb
                ? 'var(--color-neutral-300)'
                : noShow
                  ? 'var(--color-neutral-300)'
                  : fb.rating === 'good'
                    ? 'var(--color-accent-2-300)'
                    : fb.rating === 'bad'
                      ? 'var(--color-neutral-300)'
                      : 'var(--color-accent-200)';
              return (
                <div
                  key={roll.id}
                  className="fx-pop flex items-start gap-3"
                  style={{ animationDelay: `${Math.min(i, 10) * 25}ms` }}
                >
                  <div className="w-11 flex-none pt-0.5 text-right">
                    <div className="font-heading text-[15px] leading-none">{day}</div>
                    <div className="mt-1 text-[10px]" style={{ color: 'var(--color-neutral-600)' }}>{wd}</div>
                  </div>
                  <div
                    className="flex-1 rounded-[10px] p-3"
                    style={{
                      background: 'var(--color-neutral-100)',
                      border: '1px solid var(--color-divider)',
                      borderLeft: `4px solid ${swatch.bg}`,
                    }}
                  >
                    <div className="flex items-baseline gap-2">
                      <span className="flex-1 text-[14.5px] font-bold">{name}</span>
                      <span
                        className="flex-none rounded-full px-2 py-0.5 text-[10.5px] font-bold"
                        style={{ background: ratingBg, color: 'var(--color-neutral-900)' }}
                      >
                        {fb ? (noShow ? '🚫' : RATING_EMOJI[fb.rating]) : ''} {ratingLabel}
                      </span>
                    </div>
                    <div className="mt-1 text-[11.5px]" style={{ color: 'var(--color-neutral-600)' }}>
                      {roll.meal === 'dinner' ? t('history.mealDinner') : t('history.mealLunch')} · {t('history.rollIndex', { n: roll.rollIndex + 1 })}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <p
                key={roll.id}
                className="fx-pop px-4 text-xs"
                style={{ color: 'var(--color-neutral-500)', animationDelay: `${Math.min(i, 10) * 25}ms` }}
              >
                {t('history.skipLine', {
                  name,
                  reason: roll.skipReason ? t(SKIP_KEYS[roll.skipReason]) : '',
                  date: day,
                })}
              </p>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={handleExport}
        className="btn btn-secondary btn-block mt-2"
        style={{ height: 48 }}
      >
        {t('history.export')}
      </button>
    </div>
  );
}
