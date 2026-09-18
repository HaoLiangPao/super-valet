'use client';

import { useEffect, useState } from 'react';

import { swatchFor } from '@/components/cuisineSwatch';
import { SEED_RESTAURANTS } from '@/data/seed-restaurants';
import { categoryOf } from '@/lib/engine/cuisine';
import { exportAll, loadFeedbacks, loadRolls } from '@/lib/engine/store';
import type { FeedbackRecord, RollRecord, SkipReason } from '@/lib/engine/types';

const SKIP_LABELS: Record<SkipReason, string> = {
  too_far: '太远了',
  too_pricey: '太贵了',
  just_ate: '刚吃过',
  wrong_cuisine: '不想吃这个菜系',
  closed: '关门了',
  no_mood: '就是不想吃',
  other: '不说',
};

const RATING_LABEL: Record<'good' | 'ok' | 'bad', string> = {
  good: '好吃',
  ok: '一般',
  bad: '不好吃',
};

const RATING_EMOJI: Record<'good' | 'ok' | 'bad', string> = {
  good: '👍',
  ok: '😐',
  bad: '👎',
};

function findRestaurant(placeId: string) {
  return SEED_RESTAURANTS.find((r) => r.placeId === placeId);
}

function formatDate(iso: string): { day: string; wd: string } {
  const d = new Date(iso);
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  return { day: `${d.getMonth() + 1}/${d.getDate()}`, wd: weekdays[d.getDay()] };
}

export default function HistoryPage() {
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
      <div className="flex flex-1 items-center justify-center text-muted">加载中…</div>
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
        <span>共 {total} 次决策</span>
        <span>接受率 {acceptRate}%</span>
      </div>

      {sorted.length === 0 ? (
        <p className="mt-12 text-center text-muted">还没有摇过，去「摇」页面开始吧。</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {sorted.map((roll, i) => {
            const restaurant = findRestaurant(roll.restaurantId);
            const name = restaurant?.name ?? roll.restaurantId;
            const { day, wd } = formatDate(roll.rolledAt);
            const swatch = restaurant ? swatchFor(categoryOf(restaurant)) : { bg: 'var(--color-neutral-400)', ink: 'var(--color-bg)' };

            if (roll.action === 'accepted') {
              const fb = feedbacks.find((f) => f.rollId === roll.id);
              const noShow = fb?.note === '没去成';
              const ratingLabel = fb ? (noShow ? '没去成' : RATING_LABEL[fb.rating]) : '待反馈';
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
                      {roll.meal === 'dinner' ? '晚餐' : '午餐'} · 第 {roll.rollIndex + 1} 摇
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
                跳过 {name} · {roll.skipReason ? SKIP_LABELS[roll.skipReason] : ''} · {day}
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
        导出全部数据 JSON
      </button>
    </div>
  );
}
