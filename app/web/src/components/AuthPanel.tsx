'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';

import { useT } from '@/lib/i18n';
import type { TFunc } from '@/lib/i18n';
import { getSupabaseClient } from '@/lib/supabase/client';

type Tab = 'signin' | 'signup';

/** Supabase 的英文错误信息不适合给试玩用户看，常见的几条翻成人话 */
function friendlyError(t: TFunc, message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return t('auth.error.invalidCreds');
  if (m.includes('already registered') || m.includes('already been registered')) {
    return t('auth.error.alreadyRegistered');
  }
  if (m.includes('password should be at least')) return t('auth.error.passwordTooShort');
  if (m.includes('unable to validate email') || m.includes('invalid format')) {
    return t('auth.error.badEmail');
  }
  if (m.includes('email rate limit') || m.includes('too many requests')) {
    return t('auth.error.rateLimited');
  }
  if (m.includes('signups not allowed') || m.includes('signup is disabled')) {
    return t('auth.error.signupDisabled');
  }
  return message;
}

/**
 * 登录 / 注册面板。
 *
 * 试玩账号的凭证由 Hao 线下分发，邮箱确认在项目侧已关掉（ADR-0006），
 * 所以注册提交完就是登录态，不需要去收信。
 */
export default function AuthPanel({
  onAuthenticated,
  onCancel,
}: {
  onAuthenticated: () => void | Promise<void>;
  onCancel: () => void;
}) {
  const [tab, setTab] = useState<Tab>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const t = useT();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const client = getSupabaseClient();
    if (!client) {
      setError(t('auth.error.noSupabase'));
      return;
    }
    const mail = email.trim();
    if (!mail || !password) {
      setError(t('auth.error.missingFields'));
      return;
    }

    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const result = tab === 'signin'
        ? await client.auth.signInWithPassword({ email: mail, password })
        : await client.auth.signUp({ email: mail, password });

      if (result.error) {
        setError(friendlyError(t, result.error.message));
        return;
      }
      if (!result.data.session) {
        // 理论上不该出现（项目已开 autoconfirm），留一条能自救的提示
        setNotice(t('auth.notice.needConfirm'));
        return;
      }
      await onAuthenticated();
    } catch (err) {
      setError(friendlyError(t, err instanceof Error ? err.message : String(err)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col justify-center gap-5 pb-10">
      <div className="fx-pop">
        <h1 className="font-heading text-[28px] leading-tight tracking-tight">{t('auth.title')}</h1>
        <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: 'var(--color-neutral-600)' }}>
          {t('auth.desc')}
        </p>
      </div>

      <div className="fx-pop flex gap-2" style={{ animationDelay: '60ms' }}>
        <button
          type="button"
          onClick={() => { setTab('signin'); setError(null); setNotice(null); }}
          aria-pressed={tab === 'signin'}
          className={tab === 'signin' ? 'btn btn-primary btn-block' : 'btn btn-secondary btn-block'}
          style={{ height: 42 }}
        >
          {t('auth.tab.signin')}
        </button>
        <button
          type="button"
          onClick={() => { setTab('signup'); setError(null); setNotice(null); }}
          aria-pressed={tab === 'signup'}
          className={tab === 'signup' ? 'btn btn-primary btn-block' : 'btn btn-secondary btn-block'}
          style={{ height: 42 }}
        >
          {t('auth.tab.signup')}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="fx-pop card elev-md flex flex-col gap-4" style={{ animationDelay: '110ms' }}>
        <label className="field flex flex-col gap-1">
          <span>{t('auth.email.label')}</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="input"
          />
        </label>
        <label className="field flex flex-col gap-1">
          <span>{t('auth.password.label')}</span>
          <input
            type="password"
            autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('auth.password.placeholder')}
            className="input"
          />
        </label>

        {error && (
          <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--color-accent-700)' }}>
            {error}
          </p>
        )}
        {notice && (
          <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--color-neutral-700)' }}>
            {notice}
          </p>
        )}

        <button type="submit" disabled={busy} className="btn btn-primary btn-block" style={{ height: 48 }}>
          {busy ? t('auth.submit.processing') : tab === 'signin' ? t('auth.submit.signin') : t('auth.submit.signup')}
        </button>
      </form>

      <button type="button" onClick={onCancel} className="btn btn-ghost btn-block">
        {t('auth.cancel')}
      </button>
    </div>
  );
}
