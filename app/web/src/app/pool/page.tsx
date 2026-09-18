'use client';

import { useEffect, useState } from 'react';

import { SEED_RESTAURANTS } from '@/data/seed-restaurants';
import { CATEGORY_LABELS, categoryOf } from '@/lib/engine/cuisine';
import { eligible } from '@/lib/engine/engine';
import { freshness } from '@/lib/engine/scoring';
import { loadState, saveState } from '@/lib/engine/store';
import { DINNER, epochDay } from '@/lib/engine/types';
import type { EngineState } from '@/lib/engine/types';

export default function PoolPage() {
  const [state, setState] = useState<EngineState | null>(null);

  useEffect(() => {
    Promise.resolve().then(() => {
      setState(loadState());
    });
  }, []);

  if (!state) {
    return (
      <div className="flex flex-1 items-center justify-center text-brown/60">加载中…</div>
    );
  }

  const today = epochDay();
  const weekday = new Date().getDay();
  const eligibleToday = eligible(SEED_RESTAURANTS, state, DINNER, weekday);
  const cuisineCount = new Set(SEED_RESTAURANTS.map((r) => categoryOf(r))).size;

  function togglePause(placeId: string) {
    if (!state) return;
    const next: EngineState = structuredClone(state);
    next.paused[placeId] = !next.paused[placeId];
    saveState(next);
    setState(next);
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-serif text-2xl text-brown-dark">店铺池</h1>
      <div className="flex justify-between rounded-2xl bg-white px-4 py-3 text-sm text-brown-dark/80 shadow-sm">
        <span>{SEED_RESTAURANTS.length} 家在池子里</span>
        <span>{cuisineCount} 种菜系</span>
        <span>今晚可选 {eligibleToday.length} 家</span>
      </div>
      <div className="flex flex-col gap-3">
        {SEED_RESTAURANTS.map((r) => {
          const f = freshness(today, state.lastEatenDay[r.placeId]);
          const paused = !!state.paused[r.placeId];
          return (
            <div key={r.placeId} className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-serif text-lg text-brown-dark">{r.name}</p>
                  <p className="text-xs text-brown/70">
                    {CATEGORY_LABELS[categoryOf(r)] ?? categoryOf(r)} · {r.distanceKm} km
                  </p>
                </div>
                <label className="flex shrink-0 items-center gap-1 text-xs text-brown/70">
                  <input
                    type="checkbox"
                    checked={paused}
                    onChange={() => togglePause(r.placeId)}
                  />
                  下次再说
                </label>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-brown/10">
                <div
                  className="h-full bg-gold transition-all"
                  style={{ width: `${Math.round(f * 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-center text-xs text-brown/50">
        进度条 = 新鲜度 1−e^(−d/τ)，满格代表该吃了
      </p>
    </div>
  );
}
