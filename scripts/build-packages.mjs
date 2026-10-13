/**
 * 生成预设套餐 → app/web/src/data/packages.ts（design/0006 §4.2）。
 *
 * 条件只在**生成时**跑一次，产出显式 placeId 名单。运行时不再按条件筛 ——
 * 「精选」意味着有人为它背书；动态条件会把刷分店和新开的坑卷进来。
 * 要调整成员，改条件重跑，或直接手改生成出来的名单（会被下次重跑覆盖，谨慎）。
 */
import { readFileSync, writeFileSync } from 'node:fs';

const src = readFileSync('app/web/src/data/catalog.ts', 'utf8');
const imported = JSON.parse(
  src.match(/IMPORTED_CATALOG: CatalogEntry\[\] = (\[[\s\S]*?\n\]);/)[1],
).map((e) => e.restaurant);

const seedSrc = readFileSync('app/web/src/data/seed-restaurants.ts', 'utf8');
const seedIds = [...seedSrc.matchAll(/placeId:\s*'([^']+)'/g)].map((m) => m[1]);
const seedNames = [...seedSrc.matchAll(/name:\s*'([^']+)'/g)].map((m) => m[1]);
const seeds = seedIds.map((id, i) => ({ placeId: id, name: seedNames[i] }));

// 种子的完整字段不在这里解析（格式不同），套餐只用导入目录挑，
// 种子 15 家本来就默认在每个人池子里，不需要靠套餐带进去。
const all = imported;

const CANTO_EXCLUDE = ['Big Beef Bowl', 'QJD Peking Duck', "Yang's Braised Chicken"];

const isDinner = (r) => (!r.slotLock.length || r.slotLock.includes('dinner')) && r.dineIn;

const defs = [
  {
    id: 'cn_top',
    nameZh: '精选中餐', nameEn: 'Highly Rated Chinese',
    descZh: '评分和口碑都站得住的中餐，够你吃一阵子不重样。',
    descEn: 'Chinese places with both high ratings and enough reviews to trust them.',
    pick: (r) => r.primary.startsWith('CN_') && r.rating >= 4.5 && r.ratingCount >= 300 && isDinner(r),
  },
  {
    id: 'ws_value',
    nameZh: '高性价比西餐', nameEn: 'Best-Value Western',
    descZh: '人均不贵又不将就的西式正餐 —— 补上晚餐池里最缺的一块。',
    descEn: 'Western dinner spots that are easy on the wallet without being a compromise.',
    // 不收 WS_BUFFET：分类器把亚洲自助（Mandarin、Gyu Gyu）也标成了 WS_BUFFET，
    // 收进来「西餐」包就名不副实（2026-10-12 导入时发现，台账 Q19）
    pick: (r) => r.primary.startsWith('WS_') && r.primary !== 'WS_BUFFET'
      && (r.priceLevel ?? 2) <= 2 && r.rating >= 4.2 && isDinner(r),
  },
  {
    id: 'cn_canto',
    nameZh: '粤味与茶餐厅', nameEn: 'Cantonese & HK Cafés',
    descZh: '煲仔饭、粥粉面、焗饭、小炒 —— Markham 最拿手的那一路。',
    descEn: 'Claypot rice, congee, baked rice and wok dishes — what Markham does best.',
    // 粤菜在 Google 上普遍评分偏低（大店 3.9–4.2 很常见），所以门槛比「精选中餐」低一档，
    // 用评价数兜住可信度。EXCLUDE 是分类器标错进 CN_CANTON 的店（台账 Q19）：
    // 兰州拉面、北京烤鸭、黄焖鸡都不是粤菜。
    pick: (r) => ['CN_CANTON', 'CN_HK_CAFE', 'CN_CONGEE'].includes(r.primary)
      && r.rating >= 4.0 && r.ratingCount >= 200 && isDinner(r)
      && !CANTO_EXCLUDE.some((n) => r.name.includes(n)),
  },
  {
    id: 'solo_quick',
    nameZh: '一人食快手', nameEn: 'Quick Solo Meal',
    descZh: '一个人进去不尴尬、不用等人、坐下就能吃 —— 面、米线、丼饭那一类。',
    descEn: 'Noodles, rice bowls and the like: sit down alone, eat, leave.',
    // 只收「快手正餐」品类：光看 soloFriendly 会把大半个目录都收进来，
    // 那样这个套餐就不成其为精选了（实测 59 家里有 36 家 soloFriendly）。
    pick: (r) => r.soloFriendly && r.rating >= 4.3 && isDinner(r)
      && ['CN_NOODLE', 'AS_RAMEN', 'CN_YUNNAN', 'CN_TAIWAN', 'AS_DONBURI',
          'CN_FAST', 'WS_DELI', 'CN_CONGEE', 'AS_VIETNAM', 'CN_BBQ_MEAT',
          'CN_DUMPLING'].includes(r.primary),
  },
  {
    id: 'late_night',
    nameZh: '深夜食堂', nameEn: 'Late Night',
    descZh: '加班到很晚、或者就是不想睡的时候。',
    descEn: 'For the nights that run long.',
    pick: (r) => r.slotLock.includes('latenight') || r.serviceWindows.length === 0,
  },
];

const packages = defs.map((d) => {
  const members = all.filter(d.pick);
  return {
    id: d.id, nameZh: d.nameZh, nameEn: d.nameEn,
    descZh: d.descZh, descEn: d.descEn,
    placeIds: members.map((r) => r.placeId),
    _names: members.map((r) => r.name),
  };
});

for (const p of packages) {
  console.log(`${p.id.padEnd(12)} ${p.nameZh.padEnd(8)} ${String(p.placeIds.length).padStart(2)} 家`);
  for (const n of p._names) console.log(`    · ${n}`);
}

const out = `/**
 * 预设套餐 —— 我们自己维护的命名名单（design/0006 §4.2、ADR-0008）。
 *
 * ⚠️ 本文件由 \`node scripts/build-packages.mjs\` 生成。
 * 成员是**显式 placeId 名单**，不是运行时条件：
 * 「精选」意味着有人为它背书，动态条件（rating > 4.5）会把刷分店卷进来。
 *
 * 生成于 ${new Date().toISOString()}
 */
import type { RestaurantPackage } from '@/lib/catalog/types';

export const PRESET_PACKAGES: RestaurantPackage[] = ${JSON.stringify(
  packages.map(({ _names, ...p }) => p), null, 2)};
`;
writeFileSync('app/web/src/data/packages.ts', out);
console.log(`\n写入 app/web/src/data/packages.ts（${packages.length} 个套餐，种子 ${seeds.length} 家默认已在池中）`);
