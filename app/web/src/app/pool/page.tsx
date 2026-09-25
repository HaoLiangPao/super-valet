'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';

import { swatchFor } from '@/components/cuisineSwatch';
import { SEED_RESTAURANTS } from '@/data/seed-restaurants';
import { CATEGORY_LABELS, categoryOf } from '@/lib/engine/cuisine';
import { eligible } from '@/lib/engine/engine';
import { freshness } from '@/lib/engine/scoring';
import { loadState, saveState } from '@/lib/engine/store';
import { DINNER, epochDay } from '@/lib/engine/types';
import type { EngineState } from '@/lib/engine/types';

function StatTile({ value, label }: { value: number; label: string }) {
  return (
    <div
      className="flex-1 rounded-[16px] p-3"
      style={{ background: 'var(--color-neutral-100)', border: '1px solid var(--color-divider)' }}
    >
      <div className="font-heading text-2xl">{value}</div>
      <div className="mt-1 text-[11px] leading-tight" style={{ color: 'var(--color-neutral-600)' }}>
        {label}
      </div>
    </div>
  );
}

export default function PoolPage() {
  const [state, setState] = useState<EngineState | null>(null);

  useEffect(() => {
    Promise.resolve().then(() => {
      setState(loadState());
    });
  }, []);

  if (!state) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted">加载中…</div>
    );
  }

  const today = epochDay();
  const weekday = new Date().getDay();
  const eligibleToday = eligible(SEED_RESTAURANTS, state, DINNER, weekday);
  const cuisineCount = new Set(SEED_RESTAURANTS.map((r) => categoryOf(r))).size;
  const avgDays = Math.round(
    SEED_RESTAURANTS.reduce((sum, r) => {
      const last = state.lastEatenDay[r.placeId];
      const d = last === undefined ? 40 : Math.min(today - last, 40);
      return sum + d;
    }, 0) / SEED_RESTAURANTS.length,
  );

  function togglePause(placeId: string) {
    if (!state) return;
    const next: EngineState = structuredClone(state);
    next.paused[placeId] = !next.paused[placeId];
    saveState(next);
    setState(next);
  }

  return (
    <div className="flex flex-1 flex-col gap-3 pb-3">
      <div className="flex gap-2">
        <StatTile value={SEED_RESTAURANTS.length} label="家在池子里" />
        <StatTile value={avgDays} label="天 · 平均冷却" />
        <StatTile value={cuisineCount} label="种菜系" />
      </div>

      <Link
        href="/explore"
        className="btn btn-block text-center"
        style={{
          height: 46,
          border: '1px dashed var(--color-accent-400)',
          color: 'var(--color-accent-700)',
          background: 'var(--color-accent-100)',
        }}
      >
        ＋ 搜 Google Places 添加
      </Link>

      <div className="flex flex-col gap-2">
        {SEED_RESTAURANTS.map((r, i) => {
          const f = freshness(today, state.lastEatenDay[r.placeId]);
          const paused = !!state.paused[r.placeId];
          const swatch = swatchFor(categoryOf(r));
          const last = state.lastEatenDay[r.placeId];
          const daysLabel = last === undefined ? '没吃过' : `${today - last} 天前`;
          return (
            // 外层只管入场动效（fx-pop 自己动 opacity 0→1，且 fill-mode 在动画结束后
            // 仍然「拿着」这个属性），暂停时的常驻半透明必须放在不参与动画的内层元素上，
            // 否则内联 opacity 会被动画结束态的 opacity:1 盖掉。
            <div key={r.placeId} className="fx-pop" style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}>
              <div
                className="flex flex-col gap-2 rounded-[16px] p-3.5"
                style={{
                  background: 'var(--color-neutral-100)',
                  border: '1px solid var(--color-divider)',
                  opacity: paused ? 0.55 : 1,
                }}
              >
                <div className="flex items-baseline gap-2.5">
                  <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: swatch.bg }} />
                  <span className="font-heading flex-1 truncate text-[16px]">{r.name}</span>
                  <span className="flex-none text-[11px] font-bold" style={{ color: 'var(--color-neutral-600)' }}>
                    {daysLabel}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--color-neutral-300)' }}>
                    <div
                      className="h-full rounded-full transition-[width]"
                      style={{ background: swatch.bg, width: `${Math.round(f * 100)}%` }}
                    />
                  </div>
                  <span className="flex-none text-[11px]" style={{ color: 'var(--color-neutral-600)' }}>
                    {CATEGORY_LABELS[categoryOf(r)] ?? categoryOf(r)} · {r.distanceKm}km
                  </span>
                </div>
                <label
                  className="flex items-center gap-1.5 self-end text-[11px]"
                  style={{ color: 'var(--color-neutral-600)' }}
                >
                  <input type="checkbox" checked={paused} onChange={() => togglePause(r.placeId)} />
                  下次再说
                </label>
              </div>
            </div>
          );
        })}
      </div>

      <p className="px-1 text-center text-[11.5px] leading-relaxed" style={{ color: 'var(--color-neutral-600)' }}>
        进度条 = 新鲜度 1−e^(−d/τ)，满格代表该吃了。今晚可选 {eligibleToday.length} 家。
      </p>
    </div>
  );
}
