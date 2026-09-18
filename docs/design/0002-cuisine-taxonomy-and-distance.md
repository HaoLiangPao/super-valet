---
id: 0002
title: GTA 菜系分类体系与距离模块规格 v1
status: draft
author: HaoLiangPao
created: 2026-09-17
updated: 2026-09-17
superseded_by:
related: [design/0001, ADR-0003]
tags: [taxonomy, geo, bandit]
---

# GTA 菜系分类体系 & 距离模块规格 v1
 
面向大多伦多地区（Toronto / Markham / Richmond Hill / Scarborough / Mississauga / Brampton）华人用户的每日选餐 App。
 
---
 
## 1. 设计原则
 
**1) 三层结构，而不是一层平铺**
 
```
cuisineGroup   (3 类)   →  中餐 / 亚洲其他 / 西餐
cuisineCategory (12 类) →  川湘 / 粤港 / 北方 / 日料 / 意式 …
subCuisine     (~45 类) →  川菜 / 火锅 / 烧腊 / 港式茶餐厅 …
```
 
理由：45 个子菜系直接当 Bandit 的 context 特征会极度稀疏（20–100 家店摊到 45 维，每维只有 1–2 个样本）。中间层是给模型用的，最细层是给 UI 和冷启动继承用的。
 
**2) 分类标准是"决策场景"，不是"菜谱学"**
 
八大菜系那套在这里没用。火锅严格说属于川渝菜系，但用户决策时它是完全独立的一类 —— 要凑人、要两小时、身上会有味道、工作日午餐基本不可能。同理，早茶（点心）必须从粤菜里拆出来，因为它有硬性时段绑定（多数店只做午市）。
 
判断标准：**如果两个标签在"什么时候去 / 和谁去 / 花多长时间"上表现不同，就该拆开。**
 
**3) 一店多标签，但必须有一个 primary**
 
`primary_sub_cuisine`（单值，用于算法）+ `tags`（多值，用于筛选和展示）。一家台式餐厅可以同时带 `CN_TAIWAN` / `CN_NOODLE` / `CN_BUBBLETEA`，但 primary 只有一个。
 
---
 
## 2. 中餐（CN_*）—— 主体分类
 
| code | 中文名 | 典型菜品 | GTA 主要分布 | 场景备注 |
|---|---|---|---|---|
| `CN_SICHUAN` | 川菜 | 水煮鱼、麻辣香锅、口水鸡、毛血旺 | Scarborough、North York (Yonge/Finch)、Markham | 全时段，出汗 |
| `CN_HOTPOT` | 火锅 | 川式/潮汕/猪肚鸡 | Markham Hwy 7、Scarborough、Downtown | **独立类**：需凑人、耗时长、有味道 |
| `CN_SKEWER` | 烧烤/串串 | 羊肉串、烤生蚝、麻辣烫 | North York、Downtown (学生区) | 夜宵场景，午餐几乎不选 |
| `CN_HUNAN` | 湘菜 | 剁椒鱼头、小炒肉 | Markham、North York | 与川菜可作近邻先验 |
| `CN_CANTON` | 粤菜小炒 | 干炒牛河、豉椒炒蚬、煲仔饭 | Markham、Scarborough Agincourt | |
| `CN_DIMSUM` | 早茶/点心 | 虾饺、烧卖、凤爪 | Markham、Richmond Hill、Scarborough | **硬时段**：多数仅 10:00–15:00 |
| `CN_BBQ_MEAT` | 烧腊 | 叉烧饭、烧鸭、油鸡、烧肉 | 全 GTA 华人区密度最高 | 快、便宜、单人友好 |
| `CN_CONGEE` | 粥粉面 | 生滚粥、云吞面、肠粉 | Scarborough、Downtown Chinatown | 早/宵夜 |
| `CN_HK_CAFE` | 港式茶餐厅 | 丝袜奶茶、菠萝油、干炒、焗饭 | **多伦多极强势**，Markham/Scarborough 遍地 | 独立成类，全时段万金油 |
| `CN_NORTHEAST` | 东北菜 | 锅包肉、地三鲜、铁锅炖、饺子 | North York、Markham、Downtown | 分量大，人少慎点 |
| `CN_JIANGZHE` | 江浙沪/本帮 | 小笼包、生煎、红烧肉、腌笃鲜 | Markham、Richmond Hill | |
| `CN_XIBEI` | 西北/新疆/清真 | 大盘鸡、拉条子、烤羊肉串、羊肉泡馍 | North York、Scarborough | |
| `CN_YUNNAN` | 云南菜 | 过桥米线、汽锅鸡、菌子 | Markham、Downtown | 米线店多为单人快餐 |
| `CN_TAIWAN` | 台湾菜 | 卤肉饭、牛肉面、便当、盐酥鸡 | Richmond Hill、Markham、North York | 单人友好 |
| `CN_NOODLE` | 面食 | 兰州拉面、刀削面、biangbiang 面 | 全 GTA | 快、单人、便宜 |
| `CN_DUMPLING` | 饺子/包子 | 水饺、蒸饺、汤包、生煎 | 全 GTA | |
| `CN_FAST` | 中式快餐 | 黄焖鸡、盖浇饭、麻辣烫、Food court | Mall food court、Pacific Mall | 午餐主力 |
| `CN_BREAKFAST` | 中式早餐 | 豆浆油条、烧饼、小笼 | Markham、Scarborough | 极强时段绑定 |
| `CN_VEG` | 中式素食 | 斋菜、素火锅 | 零散 | |
| `CN_DESSERT` | 中式甜品 | 糖水、豆花、杨枝甘露、双皮奶 | Markham、Downtown | 非正餐，建议独立池 |
| `CN_BUBBLETEA` | 奶茶饮品 | 珍奶、柠茶 | 全 GTA | 非正餐，独立池 |
| `CN_AMERICANIZED` | 美式中餐 | General Tso、Chop Suey、Egg Roll | Mall、郊区、Brampton 多 | **重要负向标签** |
 
### ⚠️ 关于 `CN_AMERICANIZED`
 
这是这套分类里最有实用价值的一个标签。Google Places 的 `chinese_restaurant` 类型里混了**大量**美式中餐（尤其在 Brampton / Mississauga 非华人区），而目标用户群体基本不会主动选择这类。
 
建议做法：不要在导入时直接过滤掉，而是打上标签、给一个很低的初始先验（比如 `Beta(1, 4)`）。让数据自己说话 —— 如果你偶尔确实想吃 General Tso，模型会学到；如果连续拒绝，它会自然沉底。硬过滤会永久损失信息。
 
---
 
## 3. 亚洲其他（AS_*）—— 中等粒度
 
| code | 中文名 | 备注 |
|---|---|---|
| `AS_SUSHI` | 寿司/刺身 | GTA 密度极高，AYCE 自助是独立场景 |
| `AS_RAMEN` | 日式拉面 | 单人友好 |
| `AS_IZAKAYA` | 居酒屋 | 夜间 + 社交 |
| `AS_DONBURI` | 丼饭/日式定食 | 午餐主力 |
| `AS_KBBQ` | 韩式烤肉 | 需凑人，与火锅同场景 |
| `AS_KOREAN` | 韩餐（汤饭/部队锅/拌饭） | North York (Bloor/Christie)、Thornhill |
| `AS_KFC_KOREAN` | 韩式炸鸡 | 夜宵/外带 |
| `AS_VIETNAM` | 越南菜 | Pho、法包；Chinatown、Mississauga |
| `AS_THAI` | 泰餐 | |
| `AS_MALAY` | 马来/新加坡 | 叻沙、海南鸡饭、肉骨茶；Scarborough |
| `AS_INDIAN` | 印度/南亚 | **Brampton 用户必备**，Punjabi / South Indian 可再拆 |
| `AS_FILIPINO` | 菲律宾菜 | Mississauga |
 
---
 
## 4. 西餐及其他（WS_*）—— 粗粒度即可
 
| code | 中文名 | 备注 |
|---|---|---|
| `WS_ITALIAN` | 意大利菜/意面 | |
| `WS_PIZZA` | 披萨 | 外卖场景为主 |
| `WS_BURGER` | 汉堡/美式快餐 | |
| `WS_STEAK` | 牛排/扒房 | 高价，特殊场合 |
| `WS_BRUNCH` | 早午餐 | **周末专属**，排队长 |
| `WS_DELI` | 三明治/Deli/沙拉 | 午餐单人 |
| `WS_MEXICAN` | 墨西哥 | Taco、Burrito |
| `WS_MIDEAST` | 中东/地中海 | Shawarma、Falafel；GTA 密度高、便宜 |
| `WS_GREEK` | 希腊菜 | Danforth |
| `WS_CARIBBEAN` | 加勒比/牙买加 | Jerk Chicken；Scarborough、Brampton |
| `WS_BUFFET` | 自助餐 | |
| `WS_CANADIAN` | 加式快餐 | Poutine、Tims 类 |
| `WS_CAFE` | 咖啡/烘焙 | 非正餐，独立池 |
 
---
 
## 5. 与 Bandit 算法的衔接
 
### 5.1 层次先验（Hierarchical Prior）—— 冷启动的关键
 
这是三层结构最主要的用途。新加一家川菜馆时**不要**从 `Beta(1, 1)` 开始，而是从父节点后验缩放继承：
 
```ts
// 父节点：该用户对 CN_SICHUAN 整体的后验
const parent = { alpha: 12, beta: 4 };   // 历史上川菜 12 次接受 / 4 次拒绝
 
// 新店的初始先验 = 父节点后验 × 收缩系数 κ
const KAPPA = 0.25;
const newArm = {
  alpha: 1 + KAPPA * parent.alpha,   // 1 + 3.0  = 4.0
  beta:  1 + KAPPA * parent.beta,    // 1 + 1.0  = 2.0
};
```
 
`κ` 控制"你有多相信同菜系可迁移"。建议起步 `0.25`，跑两个月后用留出数据调。κ 越大冷启动越快，但踩雷概率也越高。
 
**注意保持乐观**：初始 `alpha/(alpha+beta) = 0.67`，高于真实接受率，这是刻意的 —— 乐观先验驱动探索，正是你之前定的 V1 方案。
 
### 5.2 特征维度分配（V2 contextual）
 
```
cuisineCategory   one-hot  12 维   ← 用中间层，不用 subCuisine
distanceBucket    one-hot   4 维
mealSlot          one-hot   3 维   (早/午/晚)
isWeekend         binary    1 维
daysSinceLastVisit  连续    1 维   (log 变换)
recentSameCategory  连续    1 维   (近 7 天该 category 出现次数)
```
 
约 22 维，对应 20–100 家店的规模是合理的。上到 45 维 subCuisine 会过拟合。
 
### 5.3 跳过原因 → 更新目标的映射
 
你之前定的 skip-reason 分类在这里能精确落地：
 
| skip reason | 更新目标 | 说明 |
|---|---|---|
| `wrong_cuisine` | `subCuisine` 节点的 β +1，**不更新单店** | 是菜系不对，不是这家店不好 |
| `too_far` | 距离权重的 `d0` 下调，**不更新菜系/单店** | 纯上下文问题 |
| `too_expensive` | 价位维度，不更新菜系 | |
| `recently_ate` | **完全不更新**，只延长该店 cooldown | 最常见的误伤源 |
| `closed` | 更新营业时间数据，不更新任何后验 | 数据问题 |
| `no_reason` / OK 后差评 | 单店 β +1 | 唯一真正惩罚单店的信号 |
 
`recently_ate` 不更新后验这条特别重要 —— 否则你最爱的那家店会因为"吃太勤"被算法惩罚，这是个经典的反直觉 bug。
 
---
 
## 6. 距离模块
 
### 6.1 定位获取：锚点 > 实时 GPS
 
**这是 GTA 场景下最该反直觉的一点。**
 
实时 GPS 在这个 App 里经常是错的。用户做"今天吃什么"的决策通常发生在**出发前**：中午 11:40 坐在公司想晚上吃啥，或者晚上 5:00 还在 401 上堵着。这时候 GPS 返回的位置对推荐毫无意义。
 
建议方案：**双轨制**
 
```ts
type LocationSource =
  | { kind: 'anchor'; id: 'home' | 'work' | string; lat: number; lng: number }
  | { kind: 'gps'; lat: number; lng: number; accuracy: number; ts: number };
```
 
- 首次使用时引导设置 `home` / `work` 两个锚点（手动搜索地址，一次性）
- 默认按时段自动选锚点：工作日 11:00–14:00 用 `work`，其余用 `home`
- 顶部给一个可切换的位置选择器，第三个选项才是"使用当前位置"
- GPS 结果缓存 15 分钟，避免反复弹权限
实时 GPS 真正有用的场景其实很窄：出差、周末在外面临时决定。别为了这个场景牺牲 90% 的日常体验。
 
```ts
// GPS 获取（仅在用户主动选择时调用）
async function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,   // 选餐不需要米级精度，省电省时间
      timeout: 8000,
      maximumAge: 15 * 60 * 1000,  // 15 分钟内的缓存直接用
    });
  });
}
```
 
注意：`getCurrentPosition` 要求 HTTPS（`localhost` 除外）。Vercel 默认满足。iOS Safari 在 PWA 模式下权限会单独再问一次，需要在 UI 上做好引导，不要静默失败。
 
**降级链**：GPS 失败 → 上次成功位置 → 当前时段默认锚点 → `home` → 提示手动选择。任何一环都不要让用户看到空列表。
 
### 6.2 存储与查询（Supabase PostGIS）
 
```sql
create extension if not exists postgis;
 
alter table restaurants
  add column location geography(Point, 4326);
 
-- 从 Google Places 的 lat/lng 写入
update restaurants
set location = st_setsrid(st_makepoint(lng, lat), 4326)::geography;  -- 注意是 (lng, lat)
 
create index restaurants_location_idx
  on restaurants using gist (location);
```
 
半径内候选查询：
 
```sql
create or replace function nearby_restaurants(
  user_lat  double precision,
  user_lng  double precision,
  radius_m  double precision default 15000
)
returns table (id uuid, name text, distance_m double precision)
language sql stable
as $$
  select
    r.id,
    r.name,
    st_distance(r.location, st_setsrid(st_makepoint(user_lng, user_lat), 4326)::geography) as distance_m
  from restaurants r
  where r.is_active
    and st_dwithin(  -- 走 GIST 索引，不要用 st_distance(...) < x
      r.location,
      st_setsrid(st_makepoint(user_lng, user_lat), 4326)::geography,
      radius_m
    )
  order by distance_m;
$$;
```
 
Drizzle 侧直接用 `sql` 模板调这个 RPC 即可，不必给 geography 类型硬套 ORM。
 
### 6.3 距离分桶（GTA 特化）
 
GTA 是彻底的车轮城市，绝对距离的心理阈值和亚洲城市完全不同 —— 开车 15 分钟在这里叫"顺路"。
 
| bucket | 直线距离 | 语义 | 典型场景 |
|---|---|---|---|
| `WALK` | < 1.2 km | 步行可达 | 公司午餐 |
| `NEAR` | 1.2 – 5 km | 顺路 | 工作日任意一餐 |
| `MID` | 5 – 15 km | 专程 | 晚餐、周末 |
| `FAR` | > 15 km | 目的地型 | 周末专程去 Markham |
 
**Brampton 特别提示**：你的位置到 Markham / Richmond Hill 主要华人商圈基本都在 35–50 km，全部落进 `FAR`。如果不做处理，工作日几乎不会推出任何像样的中餐。
 
两个应对方案：
1. 把 `FAR` 的上界放宽，改用**分时段的距离容忍度**（见下）
2. 在候选池里刻意保留一批 Brampton / Mississauga 本地的中餐和南亚餐作为工作日主力，Markham 那批只在周末池激活
### 6.4 距离权重衰减
 
不要用硬截断（"超过 X km 就不推"），会让候选池在边界上剧烈抖动。用指数衰减：
 
```ts
// d: 直线距离(km)，d0: 半衰尺度(km)
const distanceWeight = (d: number, d0: number) => Math.exp(-d / d0);
 
// d0 按场景变化 —— 这是最需要用真实数据校准的参数
const D0_TABLE: Record<string, number> = {
  'weekday-lunch':   2,    // 中午只想就近解决
  'weekday-dinner':  6,
  'weekend-lunch':  12,
  'weekend-dinner': 15,    // 周末愿意开去 Markham
};
```
 
这几个 `d0` 和 cooldown 时长一样，是**必须靠 localStorage 原型跑真实数据校准**的参数，别指望一次拍准。原型阶段建议把每次 `too_far` 拒绝时的实际距离和时段都记下来，两周后直接拟合。
 
### 6.5 什么时候调 Distance Matrix
 
直线距离在 GTA 会系统性低估 —— 401/DVP/Gardiner 的堵车让实际时间和直线距离的相关性很差，跨 highway 的两点可能直线 8 km 但要开 30 分钟。
 
但 Distance Matrix API 按元素计费，不能对整池调用。建议：
 
```
全池 (20–100)  → Haversine 直线距离 → 加权 → Thompson 采样
                        ↓
              shortlist (Top 5)
                        ↓
      Distance Matrix 批量 1 次 → 拿真实 driving duration
                        ↓
              最终展示 + 二次微调排序
```
 
一天一次、5 个元素，成本可以忽略。Haversine 可以在 SQL 里由 PostGIS 直接算完（`ST_Distance` 用 geography 类型返回的就是球面米数），不用在应用层重算。
 
---
 
## 7. TypeScript 常量定义
 
```ts
// lib/cuisine.ts
 
export type CuisineGroup = 'CN' | 'AS' | 'WS';
 
export type CuisineCategory =
  | 'CN_SPICY'      // 川湘、火锅、烧烤
  | 'CN_CANTONESE'  // 粤港、点心、烧腊、茶餐厅
  | 'CN_NORTHERN'   // 东北、西北、面食、饺子
  | 'CN_SOUTHERN'   // 江浙、云南、台湾
  | 'CN_CASUAL'     // 快餐、早餐、素食
  | 'CN_SWEET'      // 甜品、奶茶
  | 'AS_JAPANESE'
  | 'AS_KOREAN'
  | 'AS_SEA'        // 东南亚 + 南亚
  | 'WS_WESTERN'    // 意/美/牛排/brunch
  | 'WS_CASUAL'     // 汉堡/deli/中东/加勒比
  | 'WS_CAFE';
 
export interface SubCuisineDef {
  code: string;
  labelZh: string;
  labelEn: string;
  group: CuisineGroup;
  category: CuisineCategory;
  /** 单人是否合适 —— 影响工作日午餐权重 */
  soloFriendly: boolean;
  /** 硬性时段限制，空数组表示全时段 */
  slotLock: Array<'breakfast' | 'lunch' | 'dinner' | 'latenight'>;
  /** 是否属于正餐池；甜品奶茶咖啡走独立池 */
  isMainMeal: boolean;
  /** 初始先验偏置：1.0 中性，<1 保守（如美式中餐） */
  priorBias: number;
}
 
export const SUB_CUISINES: SubCuisineDef[] = [
  { code: 'CN_SICHUAN', labelZh: '川菜', labelEn: 'Sichuan',
    group: 'CN', category: 'CN_SPICY',
    soloFriendly: false, slotLock: [], isMainMeal: true, priorBias: 1.0 },
 
  { code: 'CN_HOTPOT', labelZh: '火锅', labelEn: 'Hot Pot',
    group: 'CN', category: 'CN_SPICY',
    soloFriendly: false, slotLock: ['dinner'], isMainMeal: true, priorBias: 1.0 },
 
  { code: 'CN_SKEWER', labelZh: '烧烤串串', labelEn: 'Skewers / BBQ',
    group: 'CN', category: 'CN_SPICY',
    soloFriendly: false, slotLock: ['dinner', 'latenight'], isMainMeal: true, priorBias: 1.0 },
 
  { code: 'CN_DIMSUM', labelZh: '早茶点心', labelEn: 'Dim Sum',
    group: 'CN', category: 'CN_CANTONESE',
    soloFriendly: false, slotLock: ['breakfast', 'lunch'], isMainMeal: true, priorBias: 1.0 },
 
  { code: 'CN_BBQ_MEAT', labelZh: '烧腊', labelEn: 'BBQ Meats',
    group: 'CN', category: 'CN_CANTONESE',
    soloFriendly: true, slotLock: [], isMainMeal: true, priorBias: 1.0 },
 
  { code: 'CN_HK_CAFE', labelZh: '港式茶餐厅', labelEn: 'HK Cafe',
    group: 'CN', category: 'CN_CANTONESE',
    soloFriendly: true, slotLock: [], isMainMeal: true, priorBias: 1.0 },
 
  { code: 'CN_NOODLE', labelZh: '面食', labelEn: 'Noodles',
    group: 'CN', category: 'CN_NORTHERN',
    soloFriendly: true, slotLock: [], isMainMeal: true, priorBias: 1.0 },
 
  { code: 'CN_AMERICANIZED', labelZh: '美式中餐', labelEn: 'Americanized Chinese',
    group: 'CN', category: 'CN_CASUAL',
    soloFriendly: true, slotLock: [], isMainMeal: true, priorBias: 0.35 },
 
  { code: 'CN_BUBBLETEA', labelZh: '奶茶饮品', labelEn: 'Bubble Tea',
    group: 'CN', category: 'CN_SWEET',
    soloFriendly: true, slotLock: [], isMainMeal: false, priorBias: 1.0 },
 
  // … 其余按第 2–4 节表格补全
];
 
export const SUB_BY_CODE = new Map(SUB_CUISINES.map(c => [c.code, c]));
```
 
`soloFriendly` 和 `slotLock` 是两个便宜但收益很高的字段 —— 它们能在算法学会之前就避免掉最明显的荒谬推荐（周二中午一个人推火锅、晚上八点推早茶）。这类硬约束用规则处理，别指望 Bandit 去学，那是浪费样本。
 
---
 
## 8. Google Places 映射方案
 
### 8.1 问题
 
Places API (New) 的 `primaryType` 对中餐只有一个 `chinese_restaurant`，没有任何子菜系。可用的相关类型：
 
```
chinese_restaurant, japanese_restaurant, korean_restaurant,
thai_restaurant, vietnamese_restaurant, indian_restaurant,
italian_restaurant, american_restaurant, french_restaurant,
mexican_restaurant, mediterranean_restaurant, greek_restaurant,
ramen_restaurant, sushi_restaurant, pizza_restaurant,
hamburger_restaurant, brunch_restaurant, breakfast_restaurant,
cafe, bakery, dessert_shop, meal_takeaway
```
 
也就是说：**西餐和日韩基本能直接映射，中餐必须自己推断。**
 
### 8.2 两步法
 
**Step 1 — 规则映射**（Google type → category，覆盖非中餐的大部分）
 
```ts
const TYPE_MAP: Record<string, string> = {
  sushi_restaurant:      'AS_SUSHI',
  ramen_restaurant:      'AS_RAMEN',
  korean_restaurant:     'AS_KOREAN',
  vietnamese_restaurant: 'AS_VIETNAM',
  indian_restaurant:     'AS_INDIAN',
  pizza_restaurant:      'WS_PIZZA',
  hamburger_restaurant:  'WS_BURGER',
  brunch_restaurant:     'WS_BRUNCH',
  // chinese_restaurant 故意不在这里 → 进 Step 2
};
```
 
**Step 2 — Haiku 推断子菜系**（仅对 `chinese_restaurant` 及未命中项）
 
输入用店名 + `editorialSummary` + 前 5 条评论 + 菜单照片的 OCR（如果有）。中文店名信息量极大 ——「渝」「蜀」「川」→ 川菜，「潮」「粤」「港」→ 粤港，「东北」「铁锅」→ 东北菜。
 
```ts
const CLASSIFY_PROMPT = `你是餐厅菜系分类器。根据以下信息判断这家餐厅的子菜系。
 
店名：{name}
Google 简介：{editorialSummary}
用户评论摘录：{reviews}
 
可选 code（必须从中选择）：
{codeList}
 
只返回 JSON，不要任何解释或 Markdown 代码块：
{"primary":"CODE","tags":["CODE",...],"confidence":0.0-1.0,"reason":"20字以内"}
 
判断要点：
- 中文店名中的地名/字号是最强信号（渝蜀川→川菜，潮粤港→粤港，东北铁锅→东北菜）
- 出现 General Tso / Chop Suey / Egg Roll / Combo Plate → CN_AMERICANIZED
- 无法确定时 confidence 给低分，不要硬猜
- primary 只能有一个，tags 可含 primary 之外的 0-2 个`;
```
 
**Step 3 — 人工复核队列**
 
`confidence < 0.7` 的进复核队列。以 20–100 家店的规模，这大概是 10–20 家，手工点两下就完事了。别为这个规模建自动化复核流程 —— 那是典型的过度工程。
 
分类结果落库时把 `confidence` 和 `reason` 一起存下来，方便日后发现推荐不对劲时回溯是分类错了还是算法错了。
 
---
 
## 9. 与现有计划的衔接
 
这份分类不改变已定的四阶段算法演进路线，只是把 context 特征具体化了：
 
| 阶段 | 本文档中用到的部分 |
|---|---|
| **V0** 加权随机 + cooldown | `slotLock` / `soloFriendly` 硬过滤 + 距离指数衰减；`d0` 和 cooldown 一起在 localStorage 原型里校准 |
| **V1** Thompson Sampling | 层次先验（5.1），`priorBias` 用于美式中餐降权 |
| **V2** contextual Bandit | 22 维特征（5.2），`cuisineCategory` one-hot + 距离桶 |
| **V3** LLM 重排 | Haiku 分类器复用同一套 code 体系，做菜品级推荐时按 subCuisine 取菜单 |
 
**原型阶段建议先落这些**：subCuisine code 表（手填 20 家常去的店即可，不用接 Places API）、`slotLock`/`soloFriendly` 硬过滤、距离指数衰减。Haiku 分类器和 PostGIS 都可以等到 MVP 再上 —— 原型的目的是校准参数，不是验证技术栈。
 