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
      className="fixed right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-brown/20 bg-white text-xl shadow-sm transition-transform active:scale-95"
    >
      <span aria-hidden="true">{profile.emoji}</span>
      <span className="sr-only">切换 Profile（当前 {profile.name}）</span>
    </button>
  );
}
