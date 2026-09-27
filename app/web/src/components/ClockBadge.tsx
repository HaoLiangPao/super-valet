'use client';

import { useEffect, useState } from 'react';

import { useT } from '@/lib/i18n';
import type { TFunc } from '@/lib/i18n';

function slotKey(hour: number): Parameters<TFunc>[0] {
  if (hour < 6) return 'clock.slot.dawn';
  if (hour < 11) return 'clock.slot.morning';
  if (hour < 14) return 'clock.slot.noon';
  if (hour < 17) return 'clock.slot.afternoon';
  if (hour < 22) return 'clock.slot.evening';
  return 'clock.slot.night';
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/**
 * 顶部时钟条：纯展示，对齐设计稿里的 clockLabel。
 * new Date() 只在 effect 触发的 tick() 里读，不在渲染体内直接调用，
 * 避免 React Compiler 的 purity 检查把渲染函数标成非纯。
 */
export default function ClockBadge() {
  const [label, setLabel] = useState('');
  const t = useT();

  useEffect(() => {
    function tick() {
      const now = new Date();
      setLabel(`${pad(now.getHours())}:${pad(now.getMinutes())} · ${t(slotKey(now.getHours()))}`);
    }
    const id = setInterval(tick, 30_000);
    Promise.resolve().then(tick);
    return () => clearInterval(id);
  }, [t]);

  return (
    <span className="text-[11.5px] font-semibold" style={{ color: 'var(--color-neutral-600)' }}>
      {label}
    </span>
  );
}
