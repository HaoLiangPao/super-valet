'use client';

import Link from 'next/link';

import { swatchFor } from '@/components/cuisineSwatch';
import { categoryOf } from '@/lib/engine/cuisine';
import type { ImportPreview } from '@/lib/places/contract';

import { categoryLabelOf, formatPrice, formatServiceWindows } from './format';
import { wasLocallyImported } from './localExploreCache';

export default function PreviewCard({
  preview,
  onConfirm,
  confirming,
}: {
  preview: ImportPreview;
  onConfirm: () => void;
  confirming: boolean;
}) {
  const { restaurant, dishes } = preview;
  const lowConfidence = restaurant.confidence < 0.7;
  const inPool = preview.alreadyInPool || wasLocallyImported(restaurant.placeId);
  const swatch = swatchFor(categoryOf(restaurant));
  const price = formatPrice(restaurant.priceLevel);

  return (
    <div
      className="fx-pop card elev-md"
      style={{
        border: lowConfidence ? '1.5px solid var(--color-accent-500)' : '1px solid var(--color-divider)',
        background: lowConfidence ? 'var(--color-accent-100)' : 'var(--color-neutral-100)',
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="tag" style={{ background: swatch.bg, color: swatch.ink }}>
          {categoryLabelOf(restaurant)}
        </span>
        {lowConfidence && <span className="tag tag-outline">分类不确定</span>}
      </div>

      <div className="font-heading text-[24px] leading-[1.15]">{restaurant.name}</div>
      <div className="text-[12.5px]" style={{ color: 'var(--color-neutral-600)' }}>{restaurant.address}</div>

      <div
        className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b pb-3 text-[12.5px] font-semibold"
        style={{ borderColor: 'var(--color-divider)' }}
      >
        <span>★ {restaurant.rating.toFixed(1)}（{restaurant.ratingCount}）</span>
        {price && <span>{price}</span>}
        <span>{restaurant.distanceKm} km</span>
      </div>

      {restaurant.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {restaurant.tags.map((t) => (
            <span key={t} className="tag tag-neutral">{t}</span>
          ))}
        </div>
      )}

      <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--color-neutral-700)' }}>
        营业时间：{formatServiceWindows(restaurant)}
      </p>

      {dishes.length > 0 && (
        <p className="text-[12px] leading-relaxed" style={{ color: 'var(--color-neutral-600)' }}>
          提到的菜：{dishes.map((d) => d.name).join('、')}
        </p>
      )}

      <p
        className="rounded-[14px] p-3 text-[13px] leading-relaxed"
        style={{ background: 'var(--color-accent-2-200)', color: 'var(--color-accent-2-800)' }}
      >
        {restaurant.reason}
      </p>

      {lowConfidence && (
        <p className="text-[12.5px] font-semibold" style={{ color: 'var(--color-accent-800)' }}>
          这家的菜系我不太确定，确认一下？
        </p>
      )}

      {inPool ? (
        <>
          <p className="text-center text-[13px]" style={{ color: 'var(--color-neutral-600)' }}>
            已经在你的池子里了
          </p>
          <Link href="/pool" className="btn btn-secondary btn-block" style={{ height: 48 }}>
            去池子看看
          </Link>
        </>
      ) : (
        <button
          type="button"
          onClick={onConfirm}
          disabled={confirming}
          className="btn btn-primary btn-block"
          style={{ height: 50, fontSize: 16 }}
        >
          {confirming ? '加入中…' : lowConfidence ? '分类没问题，加入池子' : '加入池子'}
        </button>
      )}
    </div>
  );
}
