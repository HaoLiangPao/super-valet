/**
 * 只读核对线上 Supabase 状态：注册开关、public 表清单、账号数。
 *
 * 用法：node scripts/prod-status.mjs
 * 走 Management API，只发 GET 与 select，**不改任何东西**。
 * 凭证从 app/web/.env.local 读，**不打印任何值**。
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnv() {
  const txt = readFileSync(resolve(root, 'app/web/.env.local'), 'utf8');
  for (const line of txt.split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^"|"$/g, '');
  }
}

loadEnv();
const ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0];
const headers = {
  Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`,
  'Content-Type': 'application/json',
};
const api = `https://api.supabase.com/v1/projects/${ref}`;

async function select(query) {
  const r = await fetch(`${api}/database/query`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, read_only: true }),
  });
  if (!r.ok) throw new Error(`query HTTP ${r.status}`);
  return r.json();
}

const auth = await fetch(`${api}/config/auth`, { headers });
if (!auth.ok) {
  console.error(`✗ auth config HTTP ${auth.status}（access token 可能已过期）`);
  process.exit(1);
}
const cfg = await auth.json();
console.log(`disable_signup     = ${cfg.disable_signup}`);
console.log(`mailer_autoconfirm = ${cfg.mailer_autoconfirm}`);

const tables = await select(
  "select table_name from information_schema.tables where table_schema = 'public' order by 1",
);
console.log(`public tables (${tables.length}): ${tables.map((t) => t.table_name).join(', ')}`);

const [{ n }] = await select('select count(*)::int as n from auth.users');
console.log(`auth.users         = ${n}`);
