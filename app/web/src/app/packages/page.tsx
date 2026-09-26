'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';

import { allPackages, packageStats } from '@/lib/catalog/packages';
import { applyPackage } from '@/lib/catalog/selection';
import type { RestaurantPackage } from '@/lib/catalog/types';

export default function PackagesPage() {
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
      <div className="flex flex-1 items-center justify-center text-muted">加载中…</div>
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
        我们挑好的套餐，一键加进池子；之后还能在池子页单独摘掉不合口味的那几家。
      </p>

      {packages.length === 0 && (
        <div
          className="rounded-[16px] p-4 text-center text-[13px]"
          style={{ background: 'var(--color-neutral-100)', color: 'var(--color-neutral-600)' }}
        >
          暂时没有套餐可用。
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {packages.map((pkg, i) => {
          const stats = packageStats(pkg);
          const full = stats.total > 0 && stats.alreadyInPool >= stats.total;
          const showSuccess = justApplied.has(pkg.id) && full;
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
                    {pkg.descZh}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="tag tag-accent-2">
                    共 {stats.total} 家 · 你已有 {stats.alreadyInPool} 家
                  </span>
                  <button
                    type="button"
                    onClick={() => handleApply(pkg.id)}
                    disabled={full}
                    className="btn btn-primary"
                    style={{ height: 40, flex: 'none' }}
                  >
                    {full ? '已全部在池子里' : '加入池子'}
                  </button>
                </div>
                {showSuccess && (
                  <div
                    className="fx-rise flex items-center justify-between rounded-[12px] px-3 py-2"
                    style={{ background: 'var(--color-accent-2-100)', color: 'var(--color-accent-2-800)' }}
                  >
                    <span className="text-[12.5px] font-semibold">✓ 已加入池子</span>
                    <Link href="/" className="btn btn-ghost" style={{ height: 28, fontSize: 12 }}>
                      去摇一摇
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
