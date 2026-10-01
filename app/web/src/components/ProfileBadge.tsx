'use client';

import { useState } from 'react';

import { useT } from '@/lib/i18n';
import type { Profile } from '@/lib/profiles/profiles';

import MeSheet, { MeSheetRow } from './MeSheet';

/**
 * 游客模式右上角小头像：点开是「我的」面板（语言 / 当前 Profile / 位置与半径 /
 * 切换身份，见 `MeSheet`）。「切换身份」退回选人页（只清活跃标记，数据保留）。
 */
export default function ProfileBadge({
  profile,
  onSwitch,
}: {
  profile: Profile;
  onSwitch: () => void;
}) {
  const [open, setOpen] = useState(false);
  const t = useT();
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={t('profile.badge.title', { name: profile.name })}
        className="fx-pop fixed right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full text-xl transition-transform active:scale-95"
        style={{
          background: 'var(--color-neutral-100)',
          border: '1px solid var(--color-divider)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <span aria-hidden="true">{profile.emoji}</span>
        <span className="sr-only">{t('profile.badge.srLabel', { name: profile.name })}</span>
      </button>

      {open && (
        <MeSheet
          onClose={() => setOpen(false)}
          footer={(
            <button
              type="button"
              onClick={() => { setOpen(false); onSwitch(); }}
              className="btn btn-secondary btn-block"
              style={{ height: 46 }}
            >
              {t('me.switchProfile')}
            </button>
          )}
        >
          <MeSheetRow label={t('me.profileLabel')}>
            <span className="tag tag-accent">{profile.emoji} {profile.name}</span>
          </MeSheetRow>
        </MeSheet>
      )}
    </>
  );
}
