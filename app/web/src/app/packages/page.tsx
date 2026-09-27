'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';

import { allPackages, packageStats } from '@/lib/catalog/packages';
import { applyPackage } from '@/lib/catalog/selection';
import type { RestaurantPackage } from '@/lib/catalog/types';
import { useLocale, useT } from '@/lib/i18n';

export default function PackagesPage() {
  const t = useT();
  const { locale } = useLocale();
  const [packages, setPackages] = useState<RestaurantPackage[] | null>(null);
  const [justApplied, setJustApplied] = useState<Set<string>>(new Set());

  // 挂载时拉一次套餐清单；microtask 延后 setState 规避 react-compiler
  // 对「effect 里直接 setState」的判定（CLAUDE.md §7）。
  useEffect(() => {
    Promise.resolve().then(() => {
      setPackages(allPackages());
    });
  }, []);

  if (!packages) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted">{t('common.loading')}</div>
    );
  }

  function handleApply(pkgId: string) {
    applyPackage(pkgId);
    setJustApplied((prev) => {
      const next = new Set(prev);
      next.add(pkgId);
      return next;
    });
  }

  return (
    <div className="flex flex-1 flex-col gap-3 pb-3">
      <p className="px-1 text-[12.5px] leading-relaxed" style={{ color: 'var(--color-neutral-600)' }}>
        {t('packages.intro')}
      </p>

      {packages.length === 0 && (
        <div
          className="rounded-[16px] p-4 text-center text-[13px]"
          style={{ background: 'var(--color-neutral-100)', color: 'var(--color-neutral-600)' }}
        >
          {t('packages.empty')}
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {packages.map((pkg, i) => {
          const stats = packageStats(pkg);
          const full = stats.total > 0 && stats.alreadyInPool >= stats.total;
          const showSuccess = justApplied.has(pkg.id) && full;
          const desc = locale === 'en' ? pkg.descEn : pkg.descZh;
          return (
            <div key={pkg.id} className="fx-pop" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
              <div className="card elev-sm">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-heading text-[17px]">{pkg.nameZh}</span>
                    <span className="text-[11px]" style={{ color: 'var(--color-neutral-500)' }}>
                      {pkg.nameEn}
                    </span>
                  </div>
                  <p className="mt-1 text-[12.5px] leading-relaxed" style={{ color: 'var(--color-neutral-600)' }}>
                    {desc}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="tag tag-accent-2">
                    {t('packages.stats', { total: stats.total, already: stats.alreadyInPool })}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleApply(pkg.id)}
                    disabled={full}
                    className="btn btn-primary"
                    style={{ height: 40, flex: 'none' }}
                  >
                    {full ? t('packages.applied') : t('packages.apply')}
                  </button>
                </div>
                {showSuccess && (
                  <div
                    className="fx-rise flex items-center justify-between rounded-[12px] px-3 py-2"
                    style={{ background: 'var(--color-accent-2-100)', color: 'var(--color-accent-2-800)' }}
                  >
                    <span className="text-[12.5px] font-semibold">{t('packages.appliedBanner')}</span>
                    <Link href="/" className="btn btn-ghost" style={{ height: 28, fontSize: 12 }}>
                      {t('packages.goRoll')}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
