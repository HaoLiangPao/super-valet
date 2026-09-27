'use client';

import { useState } from 'react';

import { personaTemplateLabel, useT } from '@/lib/i18n';
import type { TFunc } from '@/lib/i18n';
import { PERSONA_TEMPLATES } from '@/lib/profiles/personas';
import type { CloudIdentity } from '@/lib/cloud/store';

function personaName(t: TFunc, key: string | null): string {
  if (!key) return t('account.persona.scratch');
  const tpl = PERSONA_TEMPLATES.find((p) => p.key === key);
  return tpl ? personaTemplateLabel(t, tpl.key, tpl.name) : key;
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
  const t = useT();

  async function handleSignOut() {
    if (busy) return;
    setBusy(true);
    await onSignOut();
  }

  const emailOrSignedIn = identity.email ?? t('account.badge.noEmail');

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={t('account.badge.title', { email: emailOrSignedIn })}
        className="fx-pop fixed right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full text-xl transition-transform active:scale-95"
        style={{
          background: 'var(--color-neutral-100)',
          border: '1px solid var(--color-accent-400)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <span aria-hidden="true">{identity.emoji}</span>
        <span className="sr-only">{t('account.badge.srLabel', { email: emailOrSignedIn })}</span>
      </button>

      {open && (
        <>
          <div className="sheet-backdrop" onClick={() => setOpen(false)} />
          <div className="sheet-panel fx-sheet">
            <div className="sheet-grabber" />
            <div className="font-heading text-[22px] leading-[1.2]">{t('account.sheet.title')}</div>
            <p className="mt-1.5 mb-4 text-[12.5px] leading-relaxed" style={{ color: 'var(--color-neutral-600)' }}>
              {t('account.sheet.desc')}
            </p>

            <div className="mb-4 flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[12px]" style={{ color: 'var(--color-neutral-600)' }}>{t('account.sheet.emailLabel')}</span>
                <span className="truncate text-[13.5px] font-semibold">{identity.email ?? '—'}</span>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[12px]" style={{ color: 'var(--color-neutral-600)' }}>{t('account.sheet.personaLabel')}</span>
                <span className="tag tag-accent">{identity.emoji} {personaName(t, identity.personaKey)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              disabled={busy}
              className="btn btn-secondary btn-block"
              style={{ height: 46 }}
            >
              {busy ? t('account.sheet.signingOut') : t('account.sheet.signOut')}
            </button>
          </div>
        </>
      )}
    </>
  );
}
