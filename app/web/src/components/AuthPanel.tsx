'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';

import { getSupabaseClient } from '@/lib/supabase/client';

type Tab = 'signin' | 'signup';

/** Supabase 的英文错误信息不适合给试玩用户看，常见的几条翻成人话 */
function friendlyError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return '邮箱或密码不对，再试一次。';
  if (m.includes('already registered') || m.includes('already been registered')) {
    return '这个邮箱已经注册过了，直接登录就行。';
  }
  if (m.includes('password should be at least')) return '密码至少 6 位。';
  if (m.includes('unable to validate email') || m.includes('invalid format')) {
    return '邮箱格式不对。';
  }
  if (m.includes('email rate limit') || m.includes('too many requests')) {
    return '操作太频繁了，等一会儿再试。';
  }
  if (m.includes('signups not allowed') || m.includes('signup is disabled')) {
    return '当前不开放注册，用 Hao 给你的账号登录。';
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const client = getSupabaseClient();
    if (!client) {
      setError('这个环境没有配置 Supabase，只能用游客模式。');
      return;
    }
    const mail = email.trim();
    if (!mail || !password) {
      setError('邮箱和密码都要填。');
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
        setError(friendlyError(result.error.message));
        return;
      }
      if (!result.data.session) {
        // 理论上不该出现（项目已开 autoconfirm），留一条能自救的提示
        setNotice('账号建好了，但还需要邮箱确认。找 Hao 在后台点一下确认。');
        return;
      }
      await onAuthenticated();
    } catch (err) {
      setError(friendlyError(err instanceof Error ? err.message : String(err)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col justify-center gap-5 pb-10">
      <div className="fx-pop">
        <h1 className="font-heading text-[28px] leading-tight tracking-tight">用账号登录</h1>
        <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: 'var(--color-neutral-600)' }}>
          登录后口味、摇号与反馈存在云端，换设备也跟着走；不登录就还用这台机器上的本地 Profile。
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
          登录
        </button>
        <button
          type="button"
          onClick={() => { setTab('signup'); setError(null); setNotice(null); }}
          aria-pressed={tab === 'signup'}
          className={tab === 'signup' ? 'btn btn-primary btn-block' : 'btn btn-secondary btn-block'}
          style={{ height: 42 }}
        >
          注册
        </button>
      </div>

      <form onSubmit={handleSubmit} className="fx-pop card elev-md flex flex-col gap-4" style={{ animationDelay: '110ms' }}>
        <label className="field flex flex-col gap-1">
          <span>邮箱</span>
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
          <span>密码</span>
          <input
            type="password"
            autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="至少 6 位"
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
          {busy ? '处理中…' : tab === 'signin' ? '登录' : '注册并登录'}
        </button>
      </form>

      <button type="button" onClick={onCancel} className="btn btn-ghost btn-block">
        先不登录，用游客模式
      </button>
    </div>
  );
}
