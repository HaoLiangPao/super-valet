'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useT } from '@/lib/i18n';
import type { MessageKey } from '@/lib/i18n';

const TABS: { href: string; glyph: string; labelKey: MessageKey }[] = [
  { href: '/', glyph: '◎', labelKey: 'nav.roll' },
  { href: '/pool', glyph: '▤', labelKey: 'nav.pool' },
  { href: '/history', glyph: '▦', labelKey: 'nav.history' },
  { href: '/explore', glyph: '✦', labelKey: 'nav.explore' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const t = useT();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30">
      <div className="tabbar mx-auto max-w-md">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="tab-btn"
              style={{ color: active ? 'var(--color-accent-700)' : 'var(--color-neutral-500)' }}
            >
              <span className="tab-glyph">{tab.glyph}</span>
              <span className="tab-label">{t(tab.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
