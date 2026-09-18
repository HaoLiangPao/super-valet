'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/', glyph: '◎', label: '摇' },
  { href: '/pool', glyph: '▤', label: '池' },
  { href: '/history', glyph: '▦', label: '记录' },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

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
              <span className="tab-label">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
