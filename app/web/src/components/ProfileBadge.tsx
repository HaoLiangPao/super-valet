'use client';

import type { Profile } from '@/lib/profiles/profiles';

/** 右上角小头像：点一下退回选人页（只清活跃标记，数据保留） */
export default function ProfileBadge({
  profile,
  onSwitch,
}: {
  profile: Profile;
  onSwitch: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSwitch}
      title={`${profile.name} · 切换 Profile`}
      className="fx-pop fixed right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full text-xl transition-transform active:scale-95"
      style={{
        background: 'var(--color-neutral-100)',
        border: '1px solid var(--color-divider)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <span aria-hidden="true">{profile.emoji}</span>
      <span className="sr-only">切换 Profile（当前 {profile.name}）</span>
    </button>
  );
}
