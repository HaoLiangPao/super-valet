'use client';

import { useState } from 'react';

import { personaTemplateLabel, useT } from '@/lib/i18n';
import { PERSONA_TEMPLATES } from '@/lib/profiles/personas';

/**
 * 首次登录的口味起点选择（ADR-0006）。
 *
 * 选模板 = 把 persona 的类别层先验（personas.ts，与游客模式同一份数值）
 * 写进该账号的 user_cuisine_categories；「从零开始」只标记已引导。
 */
export default function PersonaPicker({
  email,
  onPick,
}: {
  email: string | null;
  onPick: (personaKey: string | null, emoji: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const t = useT();

  async function choose(personaKey: string | null, emoji: string) {
    if (busy) return;
    setBusy(personaKey ?? 'scratch');
    setError(null);
    try {
      await onPick(personaKey, emoji);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 pt-6">
      <div className="fx-pop">
        <h1 className="font-heading text-[28px] leading-tight tracking-tight">{t('persona.title')}</h1>
        <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: 'var(--color-neutral-600)' }}>
          {t('persona.desc', {
            prefix: email
              ? t('persona.firstLogin.withEmail', { email })
              : t('persona.firstLogin.noEmail'),
          })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {PERSONA_TEMPLATES.map((tpl, i) => (
          <button
            key={tpl.key}
            type="button"
            disabled={busy !== null}
            onClick={() => choose(tpl.key, tpl.emoji)}
            className="fx-pop flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-[28px] transition-transform active:scale-95"
            style={{
              background: 'var(--color-neutral-100)',
              border: '1px solid var(--color-divider)',
              boxShadow: 'var(--shadow-md)',
              opacity: busy !== null && busy !== tpl.key ? 0.5 : 1,
              animationDelay: `${i * 60}ms`,
            }}
          >
            <span className="text-5xl" aria-hidden="true">{tpl.emoji}</span>
            <span className="font-heading text-lg">
              {busy === tpl.key ? t('persona.preparing') : personaTemplateLabel(t, tpl.key, tpl.name)}
            </span>
          </button>
        ))}

        <button
          type="button"
          disabled={busy !== null}
          onClick={() => choose(null, '🍚')}
          className="fx-pop flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-[28px] border border-dashed transition-transform active:scale-95"
          style={{
            borderColor: 'var(--color-neutral-400)',
            color: 'var(--color-neutral-600)',
            opacity: busy !== null && busy !== 'scratch' ? 0.5 : 1,
            animationDelay: '180ms',
          }}
        >
          <span className="text-4xl" aria-hidden="true">🍚</span>
          <span className="text-sm">{busy === 'scratch' ? t('persona.preparing') : t('persona.scratchButton')}</span>
        </button>
      </div>

      {error && (
        <p className="text-center text-[12.5px]" style={{ color: 'var(--color-accent-700)' }}>
          {error}
        </p>
      )}

      <p className="text-center text-xs text-muted">
        {t('persona.footerNote')}
      </p>
    </div>
  );
}
