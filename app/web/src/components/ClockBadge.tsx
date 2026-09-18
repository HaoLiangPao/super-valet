'use client';

import { useEffect, useState } from 'react';

function slotLabel(hour: number): string {
  if (hour < 6) return '凌晨';
  if (hour < 11) return '早';
  if (hour < 14) return '午';
  if (hour < 17) return '下午';
  if (hour < 22) return '晚';
  return '夜';
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

  useEffect(() => {
    function tick() {
      const now = new Date();
      setLabel(`${pad(now.getHours())}:${pad(now.getMinutes())} · ${slotLabel(now.getHours())}`);
    }
    const id = setInterval(tick, 30_000);
    Promise.resolve().then(tick);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="text-[11.5px] font-semibold" style={{ color: 'var(--color-neutral-600)' }}>
      {label}
    </span>
  );
}
