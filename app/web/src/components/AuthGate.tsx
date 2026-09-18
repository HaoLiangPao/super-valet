'use client';

import { Fragment, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import AccountBadge from '@/components/AccountBadge';
import AuthPanel from '@/components/AuthPanel';
import PersonaPicker from '@/components/PersonaPicker';
import ProfileGate from '@/components/ProfileGate';
import { supabaseGateway } from '@/lib/cloud/gateway';
import { openCloudStore } from '@/lib/cloud/store';
import type { CloudIdentity, CloudStore } from '@/lib/cloud/store';
import { setStoreBackend } from '@/lib/store/backend';
import { getSupabaseClient, isCloudConfigured } from '@/lib/supabase/client';

type Mode =
  | { kind: 'loading' }
  | { kind: 'guest' }
  | { kind: 'auth' }
  | { kind: 'cloud'; store: CloudStore; identity: CloudIdentity }
  | { kind: 'error'; message: string; userId: string; email: string | null };

function Loading() {
  return <div className="flex flex-1 items-center justify-center text-muted">加载中…</div>;
}

/**
 * 刚注册完立刻拉数据，偶尔会撞上 PostgREST 的 "JWT issued at future"
 * —— 新签发的 token 的 iat 比校验方的时钟快了不到一秒。实测重试一次即可。
 */
const HYDRATE_RETRIES = 2;
const HYDRATE_RETRY_MS = 900;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 账号门禁（ADR-0006）。
 *
 * - 没登录 = 原样的本地 Profile 模式（ProfileGate），一行行为都没变；
 * - 登录后 = 把 CloudStore 装成存储后端，页面与引擎完全无感知地改写云端数据；
 * - 首次登录先选口味起点（persona 模板或从零开始）。
 *
 * 两种模式的数据互不迁移也互不覆盖：登出后本机游客数据原封不动还在。
 */
export default function AuthGate({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>({ kind: 'loading' });

  async function enterCloud(userId: string, email: string | null): Promise<void> {
    const client = getSupabaseClient();
    if (!client) {
      setMode({ kind: 'guest' });
      return;
    }
    const gateway = supabaseGateway(client, userId);
    for (let attempt = 0; ; attempt++) {
      try {
        const store = await openCloudStore(gateway, userId, email);
        setStoreBackend(store);
        setMode({ kind: 'cloud', store, identity: store.identity });
        return;
      } catch (err) {
        if (attempt < HYDRATE_RETRIES) {
          await sleep(HYDRATE_RETRY_MS);
          continue;
        }
        setStoreBackend(null);
        setMode({
          kind: 'error',
          message: err instanceof Error ? err.message : String(err),
          userId,
          email,
        });
        return;
      }
    }
  }

  // 挂载时判断有没有已登录的会话。读外部状态（localStorage 里的 session）
  // 一律在 await 之后才 setState，不在 effect 主体里同步写 state（React Compiler 规则）。
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const client = getSupabaseClient();
      if (!client) {
        if (!cancelled) setMode({ kind: 'guest' });
        return;
      }
      const { data } = await client.auth.getSession();
      if (cancelled) return;
      const user = data.session?.user;
      if (!user) {
        setMode({ kind: 'guest' });
        return;
      }
      await enterCloud(user.id, user.email ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleAuthenticated(): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;
    const { data } = await client.auth.getUser();
    if (!data.user) return;
    setMode({ kind: 'loading' });
    await enterCloud(data.user.id, data.user.email ?? null);
  }

  async function handleSignOut(): Promise<void> {
    const client = getSupabaseClient();
    if (mode.kind === 'cloud') await mode.store.flush();
    setStoreBackend(null);
    if (client) await client.auth.signOut();
    setMode({ kind: 'guest' });
  }

  async function handlePersona(personaKey: string | null, emoji: string): Promise<void> {
    if (mode.kind !== 'cloud') return;
    await mode.store.completeOnboarding(personaKey, emoji);
    setMode({ kind: 'cloud', store: mode.store, identity: mode.store.identity });
  }

  if (mode.kind === 'loading') return <Loading />;

  if (mode.kind === 'error') {
    const { userId, email } = mode;
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <p className="font-heading text-[20px]">云端数据没读出来</p>
        <p className="max-w-[280px] text-[12.5px] leading-relaxed" style={{ color: 'var(--color-neutral-600)' }}>
          {mode.message}
        </p>
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={() => {
              setMode({ kind: 'loading' });
              void enterCloud(userId, email);
            }}
            className="btn btn-primary"
            style={{ height: 44 }}
          >
            再试一次
          </button>
          <button type="button" onClick={handleSignOut} className="btn btn-secondary" style={{ height: 44 }}>
            退出登录
          </button>
        </div>
      </div>
    );
  }

  if (mode.kind === 'auth') {
    return (
      <AuthPanel
        onAuthenticated={handleAuthenticated}
        onCancel={() => setMode({ kind: 'guest' })}
      />
    );
  }

  if (mode.kind === 'guest') {
    return (
      <ProfileGate onRequestLogin={isCloudConfigured() ? () => setMode({ kind: 'auth' }) : undefined}>
        {children}
      </ProfileGate>
    );
  }

  if (!mode.identity.onboardedAt) {
    return <PersonaPicker email={mode.identity.email} onPick={handlePersona} />;
  }

  return (
    // key 保证「游客 ↔ 云」切换时业务页面整棵重挂载，重新从新后端读数据
    <Fragment key={`cloud-${mode.identity.userId}`}>
      {children}
      <AccountBadge identity={mode.identity} onSignOut={handleSignOut} />
    </Fragment>
  );
}
