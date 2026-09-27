'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';

import ProfileBadge from '@/components/ProfileBadge';
import { personaTemplateLabel, useT } from '@/lib/i18n';
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
 *
 * `onRequestLogin`（ADR-0006）：配了 Supabase 时由 AuthGate 传进来，
 * 在选人页底部长出一个「用账号登录」入口。不传 = 纯本地模式，行为与之前一致。
 */
export default function ProfileGate({
  children,
  onRequestLogin,
}: {
  children: ReactNode;
  onRequestLogin?: () => void;
}) {
  const router = useRouter();
  const t = useT();
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
    if (!window.confirm(t('profile.deleteConfirm', { name: profile.name }))) return;
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
    const tpl = PERSONA_TEMPLATES.find((p) => p.key === key);
    if (tpl && !draftName.trim()) {
      setDraftName(personaTemplateLabel(t, tpl.key, tpl.name));
      setDraftEmoji(tpl.emoji);
    }
  }

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted">{t('common.loading')}</div>
    );
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
        <h1 className="font-heading text-[28px] leading-tight tracking-tight">{t('profile.pickTitle')}</h1>
        {profiles.length > 0 && (
          <button type="button" onClick={() => setManaging((v) => !v)} className="btn btn-ghost">
            {managing ? t('profile.manageDone') : t('profile.manage')}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {profiles.map((p, i) => (
          <div
            key={p.id}
            className="fx-pop flex flex-col items-center gap-2"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <button
              type="button"
              onClick={() => enter(p.id)}
              className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-[28px] transition-transform active:scale-95"
              style={{
                background: 'var(--color-neutral-100)',
                border: '1px solid var(--color-divider)',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <span className="text-5xl" aria-hidden="true">
                {p.emoji}
              </span>
              <span className="font-heading text-lg">{p.name}</span>
            </button>
            {managing && (
              <button
                type="button"
                onClick={() => handleDelete(p)}
                className="text-xs underline underline-offset-2"
                style={{ color: 'var(--color-accent-700)' }}
              >
                {t('profile.delete')}
              </button>
            )}
          </div>
        ))}

        {!creating && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-[28px] border border-dashed transition-transform active:scale-95"
            style={{ borderColor: 'var(--color-neutral-400)', color: 'var(--color-neutral-600)' }}
          >
            <span className="text-4xl" aria-hidden="true">
              ＋
            </span>
            <span className="text-sm">{t('profile.create')}</span>
          </button>
        )}
      </div>

      {creating && (
        <form onSubmit={handleCreate} className="fx-pop card elev-md flex flex-col gap-4">
          <label className="field flex flex-col gap-1">
            <span>{t('profile.form.nameLabel')}</span>
            <input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              maxLength={12}
              placeholder={t('profile.form.namePlaceholder')}
              className="input"
            />
          </label>

          <div className="field flex flex-col gap-2">
            <span>{t('profile.form.avatarLabel')}</span>
            <div className="flex flex-wrap gap-2">
              {EMOJI_CHOICES.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setDraftEmoji(e)}
                  aria-pressed={draftEmoji === e}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border text-2xl transition-colors"
                  style={{
                    borderColor: draftEmoji === e ? 'var(--color-accent)' : 'var(--color-divider)',
                    background: draftEmoji === e ? 'var(--color-accent-100)' : 'transparent',
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <label className="field flex flex-col gap-1">
            <span>{t('profile.form.personaLabel')}</span>
            <select
              value={draftPersona}
              onChange={(e) => pickTemplate(e.target.value)}
              className="input"
            >
              <option value="">{t('profile.form.personaNone')}</option>
              {PERSONA_TEMPLATES.map((tpl) => (
                <option key={tpl.key} value={tpl.key}>
                  {tpl.emoji} {personaTemplateLabel(t, tpl.key, tpl.name)}
                </option>
              ))}
            </select>
          </label>

          <div className="flex gap-3">
            <button type="submit" className="btn btn-primary btn-block" style={{ height: 48 }}>
              {t('profile.form.submit')}
            </button>
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="btn btn-secondary btn-block"
              style={{ height: 48 }}
            >
              {t('profile.form.cancel')}
            </button>
          </div>
        </form>
      )}

      <p className="text-center text-xs text-muted">
        {t('profile.isolationNote')}
      </p>

      {onRequestLogin && (
        <div
          className="flex flex-col items-center gap-1 border-t pt-4"
          style={{ borderColor: 'var(--color-divider)' }}
        >
          <button type="button" onClick={onRequestLogin} className="btn btn-ghost">
            {t('profile.loginEntry')}
          </button>
          <span className="text-center text-[11.5px]" style={{ color: 'var(--color-neutral-600)' }}>
            {t('profile.loginNote')}
          </span>
        </div>
      )}
    </div>
  );
}
