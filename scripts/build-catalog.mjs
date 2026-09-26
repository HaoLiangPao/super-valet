/**
 * 批量生成餐厅目录 → app/web/src/data/catalog.ts（design/0006 §4.5）。
 *
 * 刻意走**我们自己的 API 路由**（/api/explore/search + /preview），
 * 不直接调 Places：这样目录数据与用户自己导入的数据经过同一条流水线、
 * 同一套分类标准、同一个防幻觉边界，不会出现「种子数据和导入数据长得不一样」。
 *
 * 用法：先 `npm run dev`，再 `node scripts/build-catalog.mjs`
 */
import { writeFileSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const PER_QUERY = 2;          // 每个搜索词取前 N 家
const DELAY_MS = 350;         // 对上游客气一点

/**
 * 按「菜系 × 场景」铺开。西餐晚市是已知缺口（research/0004 §三）：
 * 种子 15 家里唯一的西餐店只做早午市，🥩 西餐控 persona 至今无戏可唱，
 * 所以西餐这一组刻意找**正餐**而不是 brunch/咖啡。
 */
const QUERIES = [
  // 中餐
  '川菜 Markham', '火锅 Markham', '粤菜小炒 Markham', '烧腊 Markham',
  '港式茶餐厅 Markham', '东北菜 Markham', '江浙菜 上海菜 Markham',
  '云南米线 Markham', '台湾牛肉面 Markham', '兰州拉面 Markham',
  '饺子馆 Markham', '早茶 点心 Markham', '烧烤 串串 Markham', '麻辣烫 Markham',
  // 亚洲其它
  '寿司 Markham', '日式拉面 Markham', '居酒屋 Markham', '韩国烤肉 Markham',
  '韩式炸鸡 Markham', '越南粉 pho Markham', '泰国菜 Markham',
  'Indian restaurant Markham', 'Malaysian restaurant Markham',
  // 西餐正餐（重点补缺口）
  'Italian restaurant dinner Markham', 'steakhouse Markham',
  'pizza restaurant Markham', 'burger restaurant Markham',
  'Mediterranean restaurant Markham', 'Greek restaurant Markham',
  'Mexican restaurant Markham', 'shawarma Markham',
  'seafood restaurant Markham', 'pub restaurant Markham',
  'BBQ ribs restaurant Markham', 'French bistro Markham',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (json?.error) throw new Error(json.message ?? '未知错误');
  return json;
}

// 增量模式：已有目录先读进来，只补新的（避免重复烧 Places 配额）
const byId = new Map();
if (process.env.MERGE === '1') {
  try {
    const cur = await import('node:fs').then((fs) =>
      fs.readFileSync('app/web/src/data/catalog.ts', 'utf8'));
    const m = cur.match(/IMPORTED_CATALOG: CatalogEntry\[\] = (\[[\s\S]*?\n\]);/);
    if (m) for (const e of JSON.parse(m[1])) byId.set(e.restaurant.placeId, e);
    console.log(`合并模式：已有 ${byId.size} 家`);
  } catch { /* 没有就从头来 */ }
}
const log = { queries: 0, notFound: 0, previewed: 0, failed: 0 };

const RUN = process.env.QUERIES ? process.env.QUERIES.split('|') : QUERIES;
for (const q of RUN) {
  log.queries += 1;
  let candidates;
  try {
    ({ candidates } = await post('/api/explore/search', { query: q }));
  } catch (err) {
    log.notFound += 1;
    console.log(`  ⊘ ${q} —— ${err.message}`);
    await sleep(DELAY_MS);
    continue;
  }

  for (const c of candidates.slice(0, PER_QUERY)) {
    if (byId.has(c.placeId)) continue;
    try {
      const preview = await post('/api/explore/preview', { placeId: c.placeId });
      const r = preview.restaurant;
      // 非正餐（奶茶/甜品/咖啡）不进目录：目录是用来摇晚餐的
      if (!r.isMainMeal) { console.log(`  · 跳过非正餐 ${r.name}`); continue; }
      byId.set(r.placeId, { restaurant: r, fetchedAt: preview.fetchedAt, summary: preview.summary });
      log.previewed += 1;
      console.log(`  ✓ ${r.name} → ${r.primary} (${r.confidence})`);
    } catch (err) {
      log.failed += 1;
      console.log(`  ✗ ${c.name} —— ${err.message}`);
    }
    await sleep(DELAY_MS);
  }
  console.log(`[${log.queries}/${RUN.length}] ${q}`);
}

const entries = [...byId.values()].sort((a, b) =>
  a.restaurant.primary.localeCompare(b.restaurant.primary) ||
  a.restaurant.name.localeCompare(b.restaurant.name));

const header = `/**
 * 餐厅目录 —— 我们维护的全部餐厅（ADR-0008 的「目录」层）。
 *
 * ⚠️ 本文件由 \`node scripts/build-catalog.mjs\` 生成，**不要手改**。
 * 数据经过与用户导入完全相同的流水线：Google Places 出事实，
 * DeepSeek 出分类，防幻觉边界见 design/0005 §4.2。
 *
 * 生成于 ${new Date().toISOString()}
 * 共 ${entries.length} 家（不含种子 15 家；\`CATALOG\` 会把两者合并）
 *
 * 每家店的 \`fetchedAt\` 用于 30 天 TTL（design/0005 §4.8）。
 */
import { SEED_RESTAURANTS } from './seed-restaurants';
import type { SeedRestaurant } from './seed-restaurants';

export interface CatalogEntry {
  restaurant: SeedRestaurant;
  fetchedAt: string;
  summary: string;
}

export const IMPORTED_CATALOG: CatalogEntry[] = ${JSON.stringify(entries, null, 2)};

/** 目录 = 种子 15 家 + 批量导入的；同 placeId 以种子为准（人工校对过） */
export const CATALOG: SeedRestaurant[] = (() => {
  const byId = new Map<string, SeedRestaurant>();
  for (const e of IMPORTED_CATALOG) byId.set(e.restaurant.placeId, e.restaurant);
  for (const r of SEED_RESTAURANTS) byId.set(r.placeId, r);
  return [...byId.values()];
})();

export const CATALOG_FETCHED_AT: Record<string, string> =
  Object.fromEntries(IMPORTED_CATALOG.map((e) => [e.restaurant.placeId, e.fetchedAt]));
`;

writeFileSync('app/web/src/data/catalog.ts', header);
console.log(`\n=== 完成 ===`);
console.log(`搜索词 ${log.queries} · 未收录 ${log.notFound} · 入目录 ${log.previewed} · 失败 ${log.failed}`);
console.log(`写入 app/web/src/data/catalog.ts`);
