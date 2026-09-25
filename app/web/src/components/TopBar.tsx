'use client';

import { usePathname } from 'next/navigation';

import ClockBadge from './ClockBadge';

const TITLES: Record<string, string> = {
  '/': '今天吃什么',
  '/pool': '店铺池',
  '/history': '决策记录',
  '/explore': '探索',
};

export default function TopBar() {
  const pathname = usePathname();
  const title = TITLES[pathname] ?? '今天吃什么';

  return (
    <div className="flex items-baseline justify-between px-1 pb-2 pr-14">
      <h1 className="font-heading text-[24px] leading-[1.1] tracking-tight">{title}</h1>
      <ClockBadge />
    </div>
  );
}
