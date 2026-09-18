'use client';

import { useState } from 'react';

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
        <h1 className="font-heading text-[28px] leading-tight tracking-tight">你大概是哪一挂的？</h1>
        <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: 'var(--color-neutral-600)' }}>
          {email ? `${email} · 第一次登录` : '第一次登录'}。选一个起点，第一摇就有口味；
          之后每次反馈都会把它改写成你自己的样子。
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {PERSONA_TEMPLATES.map((t, i) => (
          <button
            key={t.key}
            type="button"
            disabled={busy !== null}
            onClick={() => choose(t.key, t.emoji)}
            className="fx-pop flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-[28px] transition-transform active:scale-95"
            style={{
              background: 'var(--color-neutral-100)',
              border: '1px solid var(--color-divider)',
              boxShadow: 'var(--shadow-md)',
              opacity: busy !== null && busy !== t.key ? 0.5 : 1,
              animationDelay: `${i * 60}ms`,
            }}
          >
            <span className="text-5xl" aria-hidden="true">{t.emoji}</span>
            <span className="font-heading text-lg">{busy === t.key ? '准备中…' : t.name}</span>
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
          <span className="text-sm">{busy === 'scratch' ? '准备中…' : '从零开始'}</span>
        </button>
      </div>

      {error && (
        <p className="text-center text-[12.5px]" style={{ color: 'var(--color-accent-700)' }}>
          {error}
        </p>
      )}

      <p className="text-center text-xs text-muted">
        模板只是先验，不是标签 —— 摇出来不喜欢就点「换一个」，它学得很快。
      </p>
    </div>
  );
}
