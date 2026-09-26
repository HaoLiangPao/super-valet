'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';

import { swatchFor } from '@/components/cuisineSwatch';
import { ANCHOR_LIST, loadLocationPrefs } from '@/lib/catalog/location';
import { localizedPool } from '@/lib/catalog/localize';
import { removeFromSelection } from '@/lib/catalog/selection';
import type { LocalizedPool, LocationPrefs } from '@/lib/catalog/types';
import { CATEGORY_LABELS, categoryOf } from '@/lib/engine/cuisine';
import { eligible } from '@/lib/engine/engine';
import { freshness } from '@/lib/engine/scoring';
import { loadState, saveState } from '@/lib/engine/store';
import { DINNER, epochDay } from '@/lib/engine/types';
import type { EngineState, Restaurant } from '@/lib/engine/types';

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

/** 「距离基于：xxx」里的那个 xxx —— anchor 找不到名字时兜底成通用文案 */
function anchorLabel(prefs: LocationPrefs): string {
  const source = prefs.source;
  if (!source) return ANCHOR_LIST[0]?.labelZh ?? '默认锚点';
  if (source.kind === 'gps') return '你的当前位置';
  const anchor = ANCHOR_LIST.find((a) => a.id === source.id);
  return anchor?.labelZh ?? '所选锚点';
}

function RemoveConfirmSheet({
  name,
  busy,
  onCancel,
  onConfirm,
}: {
  name: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <>
      <div className="sheet-backdrop" onClick={onCancel} />
      <div className="sheet-panel fx-sheet">
        <div className="sheet-grabber" />
        <div className="font-heading text-[20px] leading-[1.2]">从池子移除「{name}」？</div>
        <p className="mt-1.5 mb-5 text-[12.5px] leading-relaxed" style={{ color: 'var(--color-neutral-600)' }}>
          移除后它不再参与摇一摇，但历史记录和口味数据会保留 —— 之后加回来，之前学到的偏好还在。
        </p>
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="btn btn-secondary"
            style={{ flex: 1, height: 46 }}
          >
            再想想
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="btn btn-primary"
            style={{ flex: 1, height: 46 }}
          >
            确认移除
          </button>
        </div>
      </div>
    </>
  );
}

export default function PoolPage() {
  const [state, setState] = useState<EngineState | null>(null);
  const [pool, setPool] = useState<LocalizedPool | null>(null);
  const [prefs, setPrefs] = useState<LocationPrefs | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Restaurant | null>(null);
  const [removing, setRemoving] = useState(false);

  // 挂载时一次性拉三份状态；microtask 延后 setState 规避 react-compiler
  // 对「effect 里直接 setState」的判定（CLAUDE.md §7）。
  useEffect(() => {
    Promise.resolve().then(() => {
      setState(loadState());
      setPool(localizedPool());
      setPrefs(loadLocationPrefs());
    });
  }, []);

  if (!state || !pool || !prefs) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted">加载中…</div>
    );
  }

  const today = epochDay();
  const weekday = new Date().getDay();
  const eligibleToday = eligible(pool.restaurants, state, DINNER, weekday);
  const cuisineCount = new Set(pool.restaurants.map((r) => categoryOf(r))).size;
  const totalInPool = pool.restaurants.length + pool.filteredOut;

  function togglePause(placeId: string) {
    if (!state) return;
    const next: EngineState = structuredClone(state);
    next.paused[placeId] = !next.paused[placeId];
    saveState(next);
    setState(next);
  }

  function confirmRemove() {
    if (!confirmTarget) return;
    setRemoving(true);
    removeFromSelection(confirmTarget.placeId);
    setConfirmTarget(null);
    setRemoving(false);
    setPool(localizedPool());
  }

  return (
    <div className="flex flex-1 flex-col gap-3 pb-3">
      <div className="flex gap-2">
        <StatTile value={totalInPool} label="家在池子里" />
        <StatTile value={eligibleToday.length} label="今晚可选" />
        <StatTile value={cuisineCount} label="种菜系" />
      </div>

      <p className="px-1 text-center text-[11.5px] leading-relaxed" style={{ color: 'var(--color-neutral-600)' }}>
        距离基于：{anchorLabel(prefs)}
        {' '}
        <Link href="/settings" style={{ color: 'var(--color-accent-700)', fontWeight: 700 }}>
          换一个
        </Link>
      </p>
      {pool.filteredOut > 0 && (
        <p
          className="fx-rise px-1 text-center text-[11.5px] leading-relaxed"
          style={{ color: 'var(--color-accent-700)' }}
        >
          有 {pool.filteredOut} 家超出当前半径，
          <Link href="/settings" style={{ fontWeight: 700 }}>去放宽</Link>
        </p>
      )}

      <div className="flex gap-2">
        <Link
          href="/explore"
          className="btn text-center"
          style={{
            flex: 1,
            height: 46,
            border: '1px dashed var(--color-accent-400)',
            color: 'var(--color-accent-700)',
            background: 'var(--color-accent-100)',
          }}
        >
          ＋ 添加餐厅
        </Link>
        <Link href="/packages" className="btn btn-secondary text-center" style={{ flex: 1, height: 46 }}>
          套餐
        </Link>
      </div>

      {totalInPool === 0 && (
        <div
          className="fx-rise flex flex-col items-center gap-3 rounded-[20px] p-6 text-center"
          style={{ background: 'var(--color-neutral-100)', border: '1px dashed var(--color-neutral-400)' }}
        >
          <div className="text-[32px]">🍽️</div>
          <div className="font-heading text-[17px]">池子空空如也</div>
          <p className="max-w-[260px] text-[12.5px] leading-relaxed" style={{ color: 'var(--color-neutral-600)' }}>
            先去套餐里一键加几家，或者自己搜一家喜欢的店。
          </p>
          <div className="flex w-full gap-2.5">
            <Link href="/packages" className="btn btn-primary text-center" style={{ flex: 1, height: 44 }}>
              看套餐
            </Link>
            <Link href="/explore" className="btn btn-secondary text-center" style={{ flex: 1, height: 44 }}>
              去探索
            </Link>
          </div>
        </div>
      )}

      {totalInPool > 0 && pool.restaurants.length === 0 && (
        <div
          className="fx-rise flex flex-col items-center gap-3 rounded-[20px] p-6 text-center"
          style={{ background: 'var(--color-neutral-100)', border: '1px dashed var(--color-neutral-400)' }}
        >
          <div className="text-[32px]">📍</div>
          <div className="font-heading text-[17px]">当前半径内没有店</div>
          <p className="max-w-[260px] text-[12.5px] leading-relaxed" style={{ color: 'var(--color-neutral-600)' }}>
            池子里其实有 {totalInPool} 家，只是都超出了你设的半径。
          </p>
          <Link href="/settings" className="btn btn-primary" style={{ height: 44 }}>
            去设置放宽半径
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {pool.restaurants.map((r, i) => {
          const f = freshness(today, state.lastEatenDay[r.placeId]);
          const paused = !!state.paused[r.placeId];
          const swatch = swatchFor(categoryOf(r));
          const last = state.lastEatenDay[r.placeId];
          const daysLabel = last === undefined ? '没吃过' : `${today - last} 天前`;
          return (
            // 外层只管入场动效（fx-pop 的 opacity 0→1 在 forwards 下会永久盖住同元素的行内
            // opacity），暂停时的常驻半透明必须放在不参与动画的内层元素上（CLAUDE.md §7）。
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
                <div className="flex items-center justify-end gap-2">
                  {paused && (
                    <span className="tag tag-neutral" style={{ marginRight: 'auto' }}>
                      已暂停 · 不参与摇一摇
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => togglePause(r.placeId)}
                    className="btn btn-ghost"
                    style={{ height: 32, fontSize: 12 }}
                  >
                    {paused ? '恢复' : '暂停'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmTarget(r)}
                    className="btn btn-ghost"
                    style={{ height: 32, fontSize: 12, color: 'var(--color-accent-700)' }}
                  >
                    移除
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="px-1 text-center text-[11.5px] leading-relaxed" style={{ color: 'var(--color-neutral-600)' }}>
        进度条 = 新鲜度 1−e^(−d/τ)，满格代表该吃了。暂停不参与摇一摇但记录保留；
        移除需要确认，历史和口味数据都会留着。
      </p>

      {confirmTarget && (
        <RemoveConfirmSheet
          name={confirmTarget.name}
          busy={removing}
          onCancel={() => setConfirmTarget(null)}
          onConfirm={confirmRemove}
        />
      )}
    </div>
  );
}
