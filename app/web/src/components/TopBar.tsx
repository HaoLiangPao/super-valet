'use client';

import { usePathname } from 'next/navigation';

import { useT } from '@/lib/i18n';
import type { MessageKey } from '@/lib/i18n';

import ClockBadge from './ClockBadge';

const TITLE_KEYS: Record<string, MessageKey> = {
  '/': 'topbar.title.home',
  '/pool': 'topbar.title.pool',
  '/history': 'topbar.title.history',
  '/explore': 'topbar.title.explore',
  '/packages': 'topbar.title.packages',
  '/settings': 'topbar.title.settings',
  '/nearby': 'topbar.title.nearby',
};

export default function TopBar() {
  const pathname = usePathname();
  const t = useT();
  const title = t(TITLE_KEYS[pathname] ?? 'topbar.title.home');

  return (
    <div className="flex items-baseline justify-between px-1 pb-2 pr-14">
      <h1 className="font-heading text-[24px] leading-[1.1] tracking-tight">{title}</h1>
      <ClockBadge />
    </div>
  );
}
