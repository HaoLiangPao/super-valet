'use client';

import { useEffect, useRef } from 'react';

import { swatchFor } from '@/components/cuisineSwatch';
import { businessStatusOf } from '@/lib/catalog/availability';
import { categoryOf } from '@/lib/engine/cuisine';
import { isOpenAtMinutes } from '@/lib/engine/openHours';
import type { Restaurant } from '@/lib/engine/types';
import { useT } from '@/lib/i18n';
import type { MessageKey } from '@/lib/i18n';

/**
 * 附近列表——本页主体（Hao 的最低要求，design/0009 §4.5）。
 *
 * 数据源纪律：调用方必须传入 `localizedPool().restaurants` 算出来的 `restaurants`，
 * 这个组件自己**不做任何半径/选择过滤**，只管怎么显示——两套过滤逻辑就是
 * 上一轮事故的复刻（CLAUDE.md 已知的坑之外，design/0009 §4.5 也重复强调）。
 */

const BUSINESS_STATUS_KEY: Record<string, MessageKey> = {
  OPERATIONAL: 'nearby.businessStatus.operational',
  CLOSED_TEMPORARILY: 'nearby.businessStatus.closedTemporarily',
  CLOSED_PERMANENTLY: 'nearby.businessStatus.closedPermanently',
};

export type TravelEstimateFn = (km: number) => { mode: 'walk' | 'drive'; minutes: number };

interface NearbyListProps {
  restaurants: Restaurant[];
  nowInfo: { weekday: number; minutes: number } | null;
  selectedPlaceId: string | null;
  onSelect: (placeId: string) => void;
  travelEstimate: TravelEstimateFn;
}

export default function NearbyList({
  restaurants,
  nowInfo,
  selectedPlaceId,
  onSelect,
  travelEstimate,
}: NearbyListProps) {
  const t = useT();
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!selectedPlaceId) return;
    rowRefs.current[selectedPlaceId]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedPlaceId]);

  if (restaurants.length === 0) {
    return (
      <p className="px-1 py-6 text-center text-[12.5px]" style={{ color: 'var(--color-neutral-600)' }}>
        {t('nearby.list.empty')}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {restaurants.map((r, i) => {
        const swatch = swatchFor(categoryOf(r));
        const status = businessStatusOf(r);
        const travel = travelEstimate(r.distanceKm);
        const travelKey = travel.mode === 'walk' ? 'nearby.list.walk' : 'nearby.list.drive';
        const selected = r.placeId === selectedPlaceId;

        let statusLabel: string;
        let statusTone: 'warn' | 'open' | 'closed';
        if (status !== 'OPERATIONAL') {
          statusLabel = `⚠️ ${t(BUSINESS_STATUS_KEY[status])}`;
          statusTone = 'warn';
        } else if (nowInfo) {
          const open = isOpenAtMinutes(r, nowInfo.weekday, nowInfo.minutes);
          statusLabel = t(open ? 'nearby.status.openNow' : 'nearby.status.closedNow');
          statusTone = open ? 'open' : 'closed';
        } else {
          statusLabel = '';
          statusTone = 'closed';
        }
        const statusBg = statusTone === 'warn'
          ? 'var(--color-accent-200)'
          : statusTone === 'open'
            ? 'var(--color-accent-2-200)'
            : 'var(--color-neutral-200)';
        const statusColor = statusTone === 'warn' ? 'var(--color-accent-800)' : 'var(--color-neutral-800)';

        return (
          <div
            key={r.placeId}
            ref={(el) => { rowRefs.current[r.placeId] = el; }}
            className="fx-pop"
            style={{ animationDelay: `${Math.min(i, 10) * 25}ms` }}
          >
            <button
              type="button"
              onClick={() => onSelect(r.placeId)}
              className="flex w-full flex-col gap-1.5 rounded-[14px] p-3 text-left"
              style={{
                background: selected ? 'var(--color-accent-100)' : 'var(--color-neutral-100)',
                border: selected ? '1px solid var(--color-accent)' : '1px solid var(--color-divider)',
              }}
            >
              <div className="flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: swatch.bg }} />
                <span className="font-heading flex-1 truncate text-[15px]">{r.name}</span>
                <span className="flex-none text-[11.5px] font-bold" style={{ color: 'var(--color-neutral-600)' }}>
                  {r.distanceKm}km
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 pl-5">
                <span className="text-[11.5px]" style={{ color: 'var(--color-neutral-600)' }}>
                  {t(travelKey, { minutes: travel.minutes })}
                  <span className="ml-1" style={{ color: 'var(--color-neutral-500)', fontSize: 10 }}>
                    · {t('nearby.list.estimateNote')}
                  </span>
                </span>
                {statusLabel && (
                  <span
                    className="tag flex-none"
                    style={{ background: statusBg, color: statusColor }}
                  >
                    {statusLabel}
                  </span>
                )}
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
}
