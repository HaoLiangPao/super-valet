'use client';

import Link from 'next/link';

import { swatchFor } from '@/components/cuisineSwatch';
import { categoryOf } from '@/lib/engine/cuisine';
import { useLocale, useT } from '@/lib/i18n';
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
  const t = useT();
  const { locale } = useLocale();
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
          {categoryLabelOf(restaurant, locale)}
        </span>
        {lowConfidence && <span className="tag tag-outline">{t('explore.preview.lowConfidence')}</span>}
      </div>

      <div className="font-heading text-[24px] leading-[1.15]">{restaurant.name}</div>
      <div className="text-[12.5px]" style={{ color: 'var(--color-neutral-600)' }}>{restaurant.address}</div>

      <div
        className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b pb-3 text-[12.5px] font-semibold"
        style={{ borderColor: 'var(--color-divider)' }}
      >
        <span>★ {restaurant.rating.toFixed(1)}{t('common.parenCount', { count: restaurant.ratingCount })}</span>
        {price && <span>{price}</span>}
        <span>{restaurant.distanceKm} km</span>
      </div>

      {restaurant.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {restaurant.tags.map((tag) => (
            <span key={tag} className="tag tag-neutral">{tag}</span>
          ))}
        </div>
      )}

      <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--color-neutral-700)' }}>
        {t('explore.preview.businessHoursLine', { windows: formatServiceWindows(restaurant, t, locale) })}
      </p>

      {dishes.length > 0 && (
        <p className="text-[12px] leading-relaxed" style={{ color: 'var(--color-neutral-600)' }}>
          {t('explore.preview.dishesLine', { dishes: dishes.map((d) => d.name).join(locale === 'zh' ? '、' : ', ') })}
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
          {t('explore.preview.lowConfidenceAsk')}
        </p>
      )}

      {inPool ? (
        <>
          <p className="text-center text-[13px]" style={{ color: 'var(--color-neutral-600)' }}>
            {t('explore.preview.alreadyInPool')}
          </p>
          <Link href="/pool" className="btn btn-secondary btn-block" style={{ height: 48 }}>
            {t('explore.preview.goToPool')}
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
          {confirming
            ? t('explore.preview.confirming')
            : lowConfidence ? t('explore.preview.confirmLowConfidence') : t('explore.preview.confirm')}
        </button>
      )}
    </div>
  );
}
