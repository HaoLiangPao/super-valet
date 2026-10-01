'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';

import { swatchFor } from '@/components/cuisineSwatch';
import { CATEGORY_LABELS, categoryOf } from '@/lib/engine/cuisine';
import { categoryLabel, useLocale, useT } from '@/lib/i18n';
import type { MessageKey, TFunc } from '@/lib/i18n';
import type {
  AttentionDecision,
  AttentionItem,
  FieldChange,
  RefreshReport,
  RefreshableField,
} from '@/lib/catalog/refresh-types';

/**
 * 刷新报告——design/0009 §4.3 定的结构：触发方式+时间 → 更新/新发现/需确认/
 * 没变化/失败，五段缺一不可，失败**必须**显示（不许悄悄消失）。
 */

const FIELD_LABEL_KEY: Record<RefreshableField, MessageKey> = {
  name: 'nearby.field.name',
  address: 'nearby.field.address',
  rating: 'nearby.field.rating',
  ratingCount: 'nearby.field.ratingCount',
  priceLevel: 'nearby.field.priceLevel',
  dineIn: 'nearby.field.dineIn',
  closedDays: 'nearby.field.closedDays',
  serviceWindows: 'nearby.field.serviceWindows',
  businessStatus: 'nearby.field.businessStatus',
};

const BUSINESS_STATUS_KEY: Record<string, MessageKey> = {
  OPERATIONAL: 'nearby.businessStatus.operational',
  CLOSED_TEMPORARILY: 'nearby.businessStatus.closedTemporarily',
  CLOSED_PERMANENTLY: 'nearby.businessStatus.closedPermanently',
};

function formatScalar(field: RefreshableField, value: string | number | boolean | null, t: TFunc): string {
  if (value === null) return '—';
  if (typeof value === 'boolean') return t(value ? 'nearby.field.yes' : 'nearby.field.no');
  if (field === 'businessStatus' && typeof value === 'string') {
    const key = BUSINESS_STATUS_KEY[value];
    return key ? t(key) : value;
  }
  if (field === 'rating' && typeof value === 'number') return `${value}★`;
  if (field === 'priceLevel' && typeof value === 'number' && value >= 1 && value <= 4) return '$'.repeat(value);
  return String(value);
}

function formatDiffLine(change: FieldChange, t: TFunc): string {
  const field = t(FIELD_LABEL_KEY[change.field]);
  if (change.structural) return t('nearby.report.structuralChanged', { field });
  return t('nearby.report.diffLine', {
    field,
    before: formatScalar(change.field, change.before, t),
    after: formatScalar(change.field, change.after, t),
  });
}

function formatMeta(report: RefreshReport, t: TFunc): string {
  const trigger = t(report.trigger === 'manual' ? 'nearby.report.trigger.manual' : 'nearby.report.trigger.auto');
  const time = new Date(report.finishedAt).toLocaleString();
  const seconds = Math.max(0, Math.round(
    (new Date(report.finishedAt).getTime() - new Date(report.startedAt).getTime()) / 1000,
  ));
  return t('nearby.report.meta', { trigger, time, seconds });
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-[12.5px] font-bold" style={{ color: 'var(--color-neutral-700)' }}>{title}</div>
      {children}
    </div>
  );
}

interface AttentionRowProps {
  item: AttentionItem;
  decided: AttentionDecision | null;
  onDecide: (placeId: string, decision: AttentionDecision) => void;
  interactive: boolean;
}

function AttentionRow({ item, decided, onDecide, interactive }: AttentionRowProps) {
  const t = useT();
  const statusKey = BUSINESS_STATUS_KEY[item.businessStatus];
  const statusLabel = statusKey ? t(statusKey) : item.businessStatus;
  return (
    <div
      className="flex flex-col gap-2 rounded-[12px] p-3"
      style={{ background: 'var(--color-accent-100)', border: '1px solid var(--color-accent-300)' }}
    >
      <div className="text-[13.5px] font-bold">{item.name}</div>
      <div className="text-[11.5px]" style={{ color: 'var(--color-accent-800)' }}>
        {t('nearby.attention.statusPrefix', { status: statusLabel })}
      </div>
      {!interactive || decided ? (
        decided && <span className="tag tag-neutral self-start">{t('nearby.attention.decided')}</span>
      ) : (
        <div className="flex gap-2">
          <button type="button" className="btn btn-secondary" style={{ height: 32, fontSize: 11.5, flex: 1 }}
            onClick={() => onDecide(item.placeId, 'archive')}>
            {t('nearby.attention.archive')}
          </button>
          <button type="button" className="btn btn-secondary" style={{ height: 32, fontSize: 11.5, flex: 1 }}
            onClick={() => onDecide(item.placeId, 'remove')}>
            {t('nearby.attention.remove')}
          </button>
          <button type="button" className="btn btn-ghost" style={{ height: 32, fontSize: 11.5, flex: 1 }}
            onClick={() => onDecide(item.placeId, 'keep')}>
            {t('nearby.attention.keep')}
          </button>
        </div>
      )}
    </div>
  );
}

export interface RefreshReportPanelProps {
  report: RefreshReport;
  addedDiscoveredIds: Set<string>;
  onAddDiscovered: (placeIds: string[]) => void;
  decidedAttention: Map<string, AttentionDecision>;
  onAttentionDecision: (placeId: string, decision: AttentionDecision) => void;
  /** 只有最新报告可操作；历史报告只读展示（对着一份可能已经过期的 diff 点按钮没有意义） */
  interactive: boolean;
}

export default function RefreshReportPanel({
  report,
  addedDiscoveredIds,
  onAddDiscovered,
  decidedAttention,
  onAttentionDecision,
  interactive,
}: RefreshReportPanelProps) {
  const t = useT();
  const { locale } = useLocale();
  const [checked, setChecked] = useState<Set<string>>(new Set());

  function toggle(placeId: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(placeId)) next.delete(placeId); else next.add(placeId);
      return next;
    });
  }

  const pendingDiscovered = report.discovered.filter((d) => !addedDiscoveredIds.has(d.restaurant.placeId));
  const checkedCount = [...checked].filter((id) => pendingDiscovered.some((d) => d.restaurant.placeId === id)).length;

  return (
    <div className="flex flex-col gap-4 rounded-[16px] p-3.5" style={{ background: 'var(--color-neutral-100)', border: '1px solid var(--color-divider)' }}>
      <div className="text-[12px]" style={{ color: 'var(--color-neutral-600)' }}>{formatMeta(report, t)}</div>

      <Section title={t('nearby.report.updatedCount', { count: report.updated.length })}>
        {report.updated.length > 0 && (
          <ul className="flex flex-col gap-1">
            {report.updated.map((diff) => (
              <li key={diff.placeId} className="text-[12px]" style={{ color: 'var(--color-neutral-700)' }}>
                <span className="font-bold">{diff.name}</span>
                {' · '}
                {diff.changes.map((c) => formatDiffLine(c, t)).join(' · ')}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section
        title={report.discoverWithinKm === undefined
          ? t('nearby.report.discoveredCount', { count: report.discovered.length })
          : t('nearby.report.discoveredWithin', {
            count: report.discovered.length,
            km: Math.round(report.discoverWithinKm * 10) / 10,
          })}
      >
        {report.discovered.length > 0 && (
          <div className="flex flex-col gap-2">
            {report.discovered.map(({ restaurant, viaCategory, distanceKm }) => {
              const added = addedDiscoveredIds.has(restaurant.placeId);
              const swatch = swatchFor(categoryOf(restaurant));
              const catLabel = CATEGORY_LABELS[viaCategory]
                ? categoryLabel(viaCategory, locale, CATEGORY_LABELS)
                : viaCategory;
              return (
                <label
                  key={restaurant.placeId}
                  className="flex items-center gap-2.5 rounded-[10px] p-2"
                  style={{ background: 'var(--color-neutral-200)', opacity: added ? 0.6 : 1 }}
                >
                  <input
                    type="checkbox"
                    checked={added || checked.has(restaurant.placeId)}
                    disabled={added || !interactive}
                    onChange={() => toggle(restaurant.placeId)}
                  />
                  <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: swatch.bg }} />
                  <span className="flex-1 truncate text-[12.5px] font-bold">{restaurant.name}</span>
                  <span className="flex-none text-[11px]" style={{ color: 'var(--color-neutral-600)' }}>
                    {catLabel} · {distanceKm}km
                  </span>
                  {added && <span className="tag tag-accent-2 flex-none">{t('nearby.discovered.added')}</span>}
                </label>
              );
            })}
            {interactive && pendingDiscovered.length > 0 && (
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ height: 34, fontSize: 12, flex: 1 }}
                  disabled={checkedCount === 0}
                  onClick={() => onAddDiscovered([...checked].filter((id) => pendingDiscovered.some((d) => d.restaurant.placeId === id)))}
                >
                  {t('nearby.discovered.addSelected', { count: checkedCount })}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ height: 34, fontSize: 12, flex: 1 }}
                  onClick={() => onAddDiscovered(pendingDiscovered.map((d) => d.restaurant.placeId))}
                >
                  {t('nearby.discovered.addAll')}
                </button>
              </div>
            )}
          </div>
        )}
      </Section>

      <Section title={t('nearby.report.attentionCount', { count: report.needsAttention.length })}>
        {report.needsAttention.length > 0 && (
          <div className="flex flex-col gap-2">
            {report.needsAttention.map((item) => (
              <AttentionRow
                key={item.placeId}
                item={item}
                decided={decidedAttention.get(item.placeId) ?? null}
                onDecide={onAttentionDecision}
                interactive={interactive}
              />
            ))}
          </div>
        )}
      </Section>

      <div className="flex items-center justify-between text-[12px]" style={{ color: 'var(--color-neutral-600)' }}>
        <span>{t('nearby.report.unchangedCount', { count: report.unchanged })}</span>
        <span style={{ color: report.failed.length > 0 ? 'var(--color-accent-700)' : undefined }}>
          {t('nearby.report.failedCount', { count: report.failed.length })}
        </span>
      </div>

      {report.failed.length > 0 && (
        <ul className="flex flex-col gap-1">
          {report.failed.map((f) => (
            <li key={f.placeId} className="text-[11.5px]" style={{ color: 'var(--color-accent-700)' }}>
              {f.name} · {f.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
