import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * 浏览器端 Supabase client（单例）。
 *
 * 整个 app 都是 client component，会话就放在 localStorage 里由 supabase-js
 * 自己续期，不引 @supabase/ssr、不做服务端渲染取数（ADR-0006）。
 *
 * 没配环境变量时返回 null —— 此时应用整体退化为游客模式，不崩、不白屏，
 * 预览环境 / 别人 clone 下来跑都还能用。
 */
let client: SupabaseClient | null = null;
let attempted = false;

export function getSupabaseClient(): SupabaseClient | null {
  if (attempted) return client;
  attempted = true;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || typeof window === 'undefined') return null;

  client = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // 没有 magic link / OAuth 回跳，别去解析 URL hash
      detectSessionInUrl: false,
    },
  });
  return client;
}

/** 环境里是否配了 Supabase（决定要不要显示登录入口） */
export function isCloudConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
