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
import { categoryLabel, useLocale, useT } from '@/lib/i18n';
import type { Locale, TFunc } from '@/lib/i18n';

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

/**
 * 「距离基于：xxx」里的那个 xxx —— 只能显示一种语言，所以按 locale 从
 * anchor 的 labelZh/labelEn 里选一个；anchor 是数据（design/0007 §1），
 * 不走字典，但「你的当前位置」「默认锚点」这些是界面 chrome，走 t()。
 */
function anchorLabel(prefs: LocationPrefs, locale: Locale, t: TFunc): string {
  const source = prefs.source;
  const fallbackAnchor: (typeof ANCHOR_LIST)[number] | undefined = ANCHOR_LIST[0];
  const pick = (a: (typeof ANCHOR_LIST)[number] | undefined) => (locale === 'en' ? a?.labelEn : a?.labelZh);
  if (!source) return pick(fallbackAnchor) ?? t('pool.anchor.defaultFallback');
  if (source.kind === 'gps') return t('pool.anchor.gpsCurrent');
  const anchor = ANCHOR_LIST.find((a) => a.id === source.id);
  return pick(anchor) ?? t('pool.anchor.defaultFallback');
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
  const t = useT();
  return (
    <>
      <div className="sheet-backdrop" onClick={onCancel} />
      <div className="sheet-panel fx-sheet">
        <div className="sheet-grabber" />
        <div className="font-heading text-[20px] leading-[1.2]">{t('pool.removeConfirm.title', { name })}</div>
        <p className="mt-1.5 mb-5 text-[12.5px] leading-relaxed" style={{ color: 'var(--color-neutral-600)' }}>
          {t('pool.removeConfirm.desc')}
        </p>
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="btn btn-secondary"
            style={{ flex: 1, height: 46 }}
          >
            {t('pool.removeConfirm.cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="btn btn-primary"
            style={{ flex: 1, height: 46 }}
          >
            {t('pool.removeConfirm.confirm')}
          </button>
        </div>
      </div>
    </>
  );
}

export default function PoolPage() {
  const t = useT();
  const { locale } = useLocale();
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
      <div className="flex flex-1 items-center justify-center text-muted">{t('common.loading')}</div>
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
        <StatTile value={totalInPool} label={t('pool.stat.total')} />
        <StatTile value={eligibleToday.length} label={t('pool.stat.eligibleToday')} />
        <StatTile value={cuisineCount} label={t('pool.stat.cuisineCount')} />
      </div>

      <p className="px-1 text-center text-[11.5px] leading-relaxed" style={{ color: 'var(--color-neutral-600)' }}>
        {t('pool.distanceBasedOn', { anchor: anchorLabel(prefs, locale, t) })}
        {' '}
        <Link href="/settings" style={{ color: 'var(--color-accent-700)', fontWeight: 700 }}>
          {t('pool.changeAnchor')}
        </Link>
      </p>
      {pool.filteredOut > 0 && (
        <p
          className="fx-rise px-1 text-center text-[11.5px] leading-relaxed"
          style={{ color: 'var(--color-accent-700)' }}
        >
          {t('pool.filteredOutHint', { count: pool.filteredOut })}
          <Link href="/settings" style={{ fontWeight: 700 }}>{t('pool.goWiden')}</Link>
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
          {t('pool.addRestaurant')}
        </Link>
        <Link href="/packages" className="btn btn-secondary text-center" style={{ flex: 1, height: 46 }}>
          {t('pool.packages')}
        </Link>
      </div>

      <Link
        href="/nearby"
        className="px-1 text-center text-[12px] font-bold"
        style={{ color: 'var(--color-accent-700)' }}
      >
        {t('pool.nearbyEntry')}
      </Link>

      {totalInPool === 0 && (
        <div
          className="fx-rise flex flex-col items-center gap-3 rounded-[20px] p-6 text-center"
          style={{ background: 'var(--color-neutral-100)', border: '1px dashed var(--color-neutral-400)' }}
        >
          <div className="text-[32px]">🍽️</div>
          <div className="font-heading text-[17px]">{t('pool.emptyPool.title')}</div>
          <p className="max-w-[260px] text-[12.5px] leading-relaxed" style={{ color: 'var(--color-neutral-600)' }}>
            {t('pool.emptyPool.desc')}
          </p>
          <div className="flex w-full gap-2.5">
            <Link href="/packages" className="btn btn-primary text-center" style={{ flex: 1, height: 44 }}>
              {t('pool.emptyPool.viewPackages')}
            </Link>
            <Link href="/explore" className="btn btn-secondary text-center" style={{ flex: 1, height: 44 }}>
              {t('pool.emptyPool.explore')}
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
          <div className="font-heading text-[17px]">{t('pool.emptyRadius.title')}</div>
          <p className="max-w-[260px] text-[12.5px] leading-relaxed" style={{ color: 'var(--color-neutral-600)' }}>
            {t('pool.emptyRadius.desc', { count: totalInPool })}
          </p>
          <Link href="/settings" className="btn btn-primary" style={{ height: 44 }}>
            {t('pool.emptyRadius.widen')}
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {pool.restaurants.map((r, i) => {
          const f = freshness(today, state.lastEatenDay[r.placeId]);
          const paused = !!state.paused[r.placeId];
          const swatch = swatchFor(categoryOf(r));
          const last = state.lastEatenDay[r.placeId];
          const daysSince = last === undefined ? null : today - last;
          const daysLabel = daysSince === null
            ? t('pool.item.neverEaten')
            : daysSince === 1 ? t('pool.item.dayAgo') : t('pool.item.daysAgo', { days: daysSince });
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
                    {categoryLabel(categoryOf(r), locale, CATEGORY_LABELS)} · {r.distanceKm}km
                  </span>
                </div>
                <div className="flex items-center justify-end gap-2">
                  {paused && (
                    <span className="tag tag-neutral" style={{ marginRight: 'auto' }}>
                      {t('pool.item.paused')}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => togglePause(r.placeId)}
                    className="btn btn-ghost"
                    style={{ height: 32, fontSize: 12 }}
                  >
                    {paused ? t('pool.item.resume') : t('pool.item.pause')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmTarget(r)}
                    className="btn btn-ghost"
                    style={{ height: 32, fontSize: 12, color: 'var(--color-accent-700)' }}
                  >
                    {t('pool.item.remove')}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="px-1 text-center text-[11.5px] leading-relaxed" style={{ color: 'var(--color-neutral-600)' }}>
        {t('pool.footerNote')}
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
