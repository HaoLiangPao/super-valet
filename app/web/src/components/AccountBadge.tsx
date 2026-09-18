'use client';

import { useState } from 'react';

import { PERSONA_TEMPLATES } from '@/lib/profiles/personas';
import type { CloudIdentity } from '@/lib/cloud/store';

function personaName(key: string | null): string {
  if (!key) return '从零开始';
  return PERSONA_TEMPLATES.find((t) => t.key === key)?.name ?? key;
}

/**
 * 云模式右上角的账号徽章：点开是账号面板（邮箱 / 口味起点 / 登出）。
 * 位置与游客模式的 ProfileBadge 一致，两者互斥出现。
 */
export default function AccountBadge({
  identity,
  onSignOut,
}: {
  identity: CloudIdentity;
  onSignOut: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSignOut() {
    if (busy) return;
    setBusy(true);
    await onSignOut();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={`${identity.email ?? '已登录'} · 账号`}
        className="fx-pop fixed right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full text-xl transition-transform active:scale-95"
        style={{
          background: 'var(--color-neutral-100)',
          border: '1px solid var(--color-accent-400)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <span aria-hidden="true">{identity.emoji}</span>
        <span className="sr-only">账号（{identity.email ?? '已登录'}）</span>
      </button>

      {open && (
        <>
          <div className="sheet-backdrop" onClick={() => setOpen(false)} />
          <div className="sheet-panel fx-sheet">
            <div className="sheet-grabber" />
            <div className="font-heading text-[22px] leading-[1.2]">账号</div>
            <p className="mt-1.5 mb-4 text-[12.5px] leading-relaxed" style={{ color: 'var(--color-neutral-600)' }}>
              数据存在云端，只有这个账号看得到。
            </p>

            <div className="mb-4 flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[12px]" style={{ color: 'var(--color-neutral-600)' }}>邮箱</span>
                <span className="truncate text-[13.5px] font-semibold">{identity.email ?? '—'}</span>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[12px]" style={{ color: 'var(--color-neutral-600)' }}>口味起点</span>
                <span className="tag tag-accent">{identity.emoji} {personaName(identity.personaKey)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              disabled={busy}
              className="btn btn-secondary btn-block"
              style={{ height: 46 }}
            >
              {busy ? '退出中…' : '退出登录（回到本机游客模式）'}
            </button>
          </div>
        </>
      )}
    </>
  );
}
