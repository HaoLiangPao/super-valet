'use client';

import { useEffect, useState } from 'react';

import { SEED_RESTAURANTS } from '@/data/seed-restaurants';
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

const RATING_EMOJI: Record<'good' | 'ok' | 'bad', string> = {
  good: '👍',
  ok: '😐',
  bad: '👎',
};

function findName(placeId: string): string {
  return SEED_RESTAURANTS.find((r) => r.placeId === placeId)?.name ?? placeId;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
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
      <div className="flex flex-1 items-center justify-center text-brown/60">加载中…</div>
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
    <div className="flex flex-col gap-4">
      <h1 className="font-serif text-2xl text-brown-dark">决策记录</h1>
      <div className="flex justify-between rounded-2xl bg-white px-4 py-3 text-sm text-brown-dark/80 shadow-sm">
        <span>共 {total} 次决策</span>
        <span>接受率 {acceptRate}%</span>
      </div>

      {sorted.length === 0 ? (
        <p className="mt-12 text-center text-brown/60">还没有摇过，去「摇」页面开始吧。</p>
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map((roll) => {
            const name = findName(roll.restaurantId);
            const dateStr = formatDate(roll.rolledAt);
            if (roll.action === 'accepted') {
              const fb = feedbacks.find((f) => f.rollId === roll.id);
              const emoji = fb ? (fb.note === '没去成' ? '🚫' : RATING_EMOJI[fb.rating]) : '';
              return (
                <div
                  key={roll.id}
                  className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm"
                >
                  <div>
                    <p className="font-medium text-brown-dark">{name}</p>
                    <p className="text-xs text-brown/60">{dateStr}</p>
                  </div>
                  <span className="text-lg">{emoji}</span>
                </div>
              );
            }
            return (
              <p key={roll.id} className="px-4 text-xs text-brown/50">
                跳过 {name} · {roll.skipReason ? SKIP_LABELS[roll.skipReason] : ''} · {dateStr}
              </p>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={handleExport}
        className="mt-4 rounded-3xl border border-brown-dark/30 py-3 font-medium text-brown-dark transition-colors active:bg-brown-dark/10"
      >
        导出全部数据 JSON
      </button>
    </div>
  );
}
