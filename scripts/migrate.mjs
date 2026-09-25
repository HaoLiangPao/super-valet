/**
 * 跑 supabase/migrations/ 下的 SQL。
 *
 * 用法：node scripts/migrate.mjs 0002_explore_import.sql
 * 凭证从 app/web/.env.local 的 SUPABASE_DB_URL 读，**不打印任何值**。
 * 迁移写成幂等（create if not exists / drop policy if exists），重复跑安全。
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from './../app/web/node_modules/pg/lib/index.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnv() {
  const txt = readFileSync(resolve(root, 'app/web/.env.local'), 'utf8');
  for (const line of txt.split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^"|"$/g, '');
  }
}

const file = process.argv[2];
if (!file) {
  console.error('用法: node scripts/migrate.mjs <migration.sql>');
  process.exit(1);
}

loadEnv();
const url = process.env.SUPABASE_DB_URL;
if (!url) {
  console.error('缺少 SUPABASE_DB_URL');
  process.exit(1);
}

const sql = readFileSync(resolve(root, 'supabase/migrations', file), 'utf8');
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  await client.query(sql);
  console.log(`✅ ${file} 执行成功`);
} catch (err) {
  console.error(`❌ ${file} 失败:`, err.message);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
