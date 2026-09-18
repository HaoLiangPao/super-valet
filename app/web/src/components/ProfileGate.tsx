'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';

import ProfileBadge from '@/components/ProfileBadge';
import { PERSONA_TEMPLATES } from '@/lib/profiles/personas';
import {
  createProfile,
  deleteProfile,
  ensureBootstrapped,
  getActiveProfileId,
  listProfiles,
  setActiveProfile,
} from '@/lib/profiles/profiles';
import type { Profile } from '@/lib/profiles/profiles';

const EMOJI_CHOICES = ['🍚', '🍜', '🍣', '🥩', '🥟', '🍕', '🌮', '🍰'];

/**
 * Profile 门禁：没选人之前不渲染任何业务页面，
 * 避免 store 在「无活跃 Profile」状态下被页面调用。
 * 本轮只求功能完整，视觉留给保真 UI 那一轮。
 */
export default function ProfileGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [managing, setManaging] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftEmoji, setDraftEmoji] = useState(EMOJI_CHOICES[0]);
  const [draftPersona, setDraftPersona] = useState('');

  // localStorage 只在浏览器里有；效果里用微任务延后 setState，
  // 避免把「读取外部状态」写成 effect 主体里的同步 setState（React Compiler 规则）。
  useEffect(() => {
    Promise.resolve().then(() => {
      ensureBootstrapped();
      setProfiles(listProfiles());
      setActiveId(getActiveProfileId());
      setReady(true);
    });
  }, []);

  function enter(id: string) {
    setActiveProfile(id);
    setProfiles(listProfiles());
    setActiveId(id);
    // 选人页展示期间业务页面是卸载状态，这里重新挂载 = 重新读 localStorage，
    // 所以不需要整页重载也能拿到新 Profile 的数据。
    router.push('/');
  }

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    const name = draftName.trim();
    if (!name) return;
    createProfile(name, draftEmoji, draftPersona || undefined);
    setProfiles(listProfiles());
    setCreating(false);
    setDraftName('');
    setDraftEmoji(EMOJI_CHOICES[0]);
    setDraftPersona('');
  }

  function handleDelete(profile: Profile) {
    if (!window.confirm(`删除「${profile.name}」？这个 Profile 的摇号与反馈会一起删掉。`)) return;
    deleteProfile(profile.id);
    setProfiles(listProfiles());
  }

  function handleSwitch() {
    setActiveProfile(null);
    setProfiles(listProfiles());
    setActiveId(null);
    setManaging(false);
    setCreating(false);
  }

  function pickTemplate(key: string) {
    setDraftPersona(key);
    const t = PERSONA_TEMPLATES.find((p) => p.key === key);
    if (t && !draftName.trim()) {
      setDraftName(t.name);
      setDraftEmoji(t.emoji);
    }
  }

  if (!ready) {
    return <div className="flex flex-1 items-center justify-center text-brown/60">加载中…</div>;
  }

  if (activeId) {
    const active = profiles.find((p) => p.id === activeId);
    return (
      <>
        {children}
        {active && <ProfileBadge profile={active} onSwitch={handleSwitch} />}
      </>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 pt-6">
      <div className="flex items-baseline justify-between">
        <h1 className="font-serif text-2xl text-brown-dark">今晚谁在吃？</h1>
        {profiles.length > 0 && (
          <button
            type="button"
            onClick={() => setManaging((v) => !v)}
            className="text-sm text-brown/70 underline underline-offset-2"
          >
            {managing ? '完成' : '管理'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {profiles.map((p) => (
          <div key={p.id} className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => enter(p.id)}
              className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-3xl border border-brown-dark/10 bg-white shadow-md transition-transform active:scale-95"
            >
              <span className="text-5xl" aria-hidden="true">
                {p.emoji}
              </span>
              <span className="font-serif text-lg text-brown-dark">{p.name}</span>
            </button>
            {managing && (
              <button
                type="button"
                onClick={() => handleDelete(p)}
                className="text-xs text-brown/70 underline underline-offset-2"
              >
                删除
              </button>
            )}
          </div>
        ))}

        {!creating && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-brown/40 text-brown/70 transition-transform active:scale-95"
          >
            <span className="text-4xl" aria-hidden="true">
              ＋
            </span>
            <span className="text-sm">新建</span>
          </button>
        )}
      </div>

      {creating && (
        <form
          onSubmit={handleCreate}
          className="flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-md"
        >
          <label className="flex flex-col gap-1 text-sm text-brown-dark">
            名字
            <input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              maxLength={12}
              placeholder="比如：老张"
              className="rounded-2xl border border-brown/20 px-3 py-2 text-base text-brown-dark outline-none focus:border-brown"
            />
          </label>

          <div className="flex flex-col gap-2 text-sm text-brown-dark">
            头像
            <div className="flex flex-wrap gap-2">
              {EMOJI_CHOICES.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setDraftEmoji(e)}
                  aria-pressed={draftEmoji === e}
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl border text-2xl transition-colors ${
                    draftEmoji === e ? 'border-brown-dark bg-gold/25' : 'border-brown/20'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <label className="flex flex-col gap-1 text-sm text-brown-dark">
            口味模板（可选）
            <select
              value={draftPersona}
              onChange={(e) => pickTemplate(e.target.value)}
              className="rounded-2xl border border-brown/20 px-3 py-2 text-base text-brown-dark outline-none focus:border-brown"
            >
              <option value="">不预设，从零开始学</option>
              {PERSONA_TEMPLATES.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.emoji} {t.name}
                </option>
              ))}
            </select>
          </label>

          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 rounded-2xl bg-brown-dark py-3 font-medium text-cream transition-transform active:scale-95"
            >
              创建
            </button>
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="flex-1 rounded-2xl border border-brown-dark/30 py-3 font-medium text-brown-dark transition-colors active:bg-brown-dark/10"
            >
              取消
            </button>
          </div>
        </form>
      )}

      <p className="text-center text-xs text-brown/50">
        每个 Profile 的口味、记录、反馈完全隔离，互不影响。
      </p>
    </div>
  );
}
