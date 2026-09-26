---
id: 0006
title: 餐厅目录、预设套餐、GPS 半径与池子管理
status: accepted
author: claude-opus-5
created: 2026-09-26
updated: 2026-09-26
superseded_by:
related: [ADR-0008, design/0002, design/0005, research/0001]
tags: [pool, packages, geo, catalog]
---

# 餐厅目录、预设套餐、GPS 半径与池子管理

> Hao 2026-09-26 的四项要求，数据模型前提见 [ADR-0008](../decisions/0008-catalog-pool-and-runtime-distance.md)。

## 1. 问题 / Problem

- **池子只能加不能减**：`removeImported()` 早就写好了，但界面上没有入口。
  用户导错一家店（比如上轮实测把「廿一筷子」搜成「拈一筷子」）就再也去不掉。
- **池子太小**：15 家，工作日晚餐硬过滤后剩个位数（research/0001 §3 的几何坍缩），
  且晚餐池零西餐店，🥩 西餐控 persona 至今无从演示。
- **冷启动太重**：新用户面对一个空池子，得一家一家导入才能开始用。
- **距离是假的**：`distanceKm` 按 Downtown Markham 写死，用户在别处看到的距离是错的。

## 2. 目标与非目标 / Goals & Non-goals

**Goals**

- [ ] **目录**扩到 50+ 家，跨菜系铺开，**必须补上西餐晚市店**。
- [ ] **池子管理**：池子页可增可删，删除有确认，删掉不影响历史记录。
- [ ] **预设套餐**：我们维护若干命名套餐，一键并入池子，之后可单独删减。
- [ ] **位置与半径**：可用 GPS 或手选锚点；可设半径（步行/顺路/专程/不限）；
      距离在运行时按当前位置重算。
- [ ] 生产环境带上新目录。

**Non-goals（本轮不做）**

- 按地理位置**自动发现**新餐厅（那是另一个产品，见 ADR-0008 后果一节）。
- 套餐的个性化生成、用户自建套餐并分享。
- 餐厅照片、菜品展示 UI。

## 3. 成功长什么样 / Success criteria

- 新用户进来一键加「精选中餐」，当场就能摇出结果。
- 把半径调到 2km，池子明显变小；调到不限，恢复全量 —— 数字对得上。
- 工作日晚餐候选数从个位数升到 20+ 家，且其中有西餐。
- 误导入的店能删掉，删完摇一摇不再出现，历史记录仍在。

## 4. 方案 / Proposed design

### 4.1 三层数据

```
目录 CATALOG        我们维护的全部餐厅（静态数据文件 + 用户导入的）
   ↓ 用户选择
池子 selection      一串 placeId
   ↓ 按当前位置本地化 + 半径过滤
引擎看到的 Restaurant[]   —— 引擎本身一行不改（ADR-0008）
```

### 4.2 预设套餐（我们自己维护）

`src/data/packages.ts`，每个套餐是一组显式 `placeId` —— **不是动态查询**。
理由：我们要对推荐质量负责，「评分高的中餐」由人挑过才敢叫精选；
动态条件（rating > 4.5）会把一堆刷分店和奶茶店卷进来。

首发套餐：

| id | 中文名 | 英文名 | 选取标准 |
| -- | ------ | ------ | -------- |
| `cn_top` | 精选中餐 | Highly Rated Chinese | 中餐，评分 ≥ 4.5 且评价数 ≥ 300 |
| `ws_value` | 高性价比西餐 | Best-Value Western | 西式，priceLevel ≤ 2 且评分 ≥ 4.2 |
| `solo_quick` | 一个人也自在 | Solo-Friendly | `soloFriendly` 且 15 分钟内能吃完的类型 |
| `late_night` | 深夜食堂 | Late Night | `slotLock` 含 latenight 或 24 小时营业 |

每个套餐带一句中英文说明，UI 显示「共 N 家 · 你已有 M 家」。

### 4.3 位置与半径

```ts
type LocationSource =
  | { kind: 'anchor'; id: string; label: string; lat: number; lng: number }
  | { kind: 'gps'; lat: number; lng: number; accuracy: number; ts: number };
```

- 锚点预置 Downtown Markham / Unionville / Markham Village（复用 `ANCHORS`）。
- GPS 仅在用户主动点「用我当前位置」时请求，`enableHighAccuracy: false`、
  超时 8s、`maximumAge` 15 分钟（design/0002 §6.1 的既定参数）。
- 半径档位：`WALK 1.2km / NEAR 5km / MID 15km / ALL 不限`，默认 `ALL`
  —— 默认不限是刻意的：**新用户不该因为一个他没设过的筛选而看到空池子**。
- 降级链：GPS 失败 → 上次成功位置 → 当前锚点 → 默认锚点。任何一环都不给空列表。

### 4.4 池子管理界面

池子页每家店一行：菜系点 + 名字 + 距离 + 新鲜度条 + 两个动作：
**暂停**（不参与摇，保留后验与历史）与 **移除**（从池子拿掉，需确认）。
种子店与导入店在这里一视同仁 —— 用户不需要知道我们内部怎么分类的。
顶部加「＋ 添加餐厅」（去 /explore）与「套餐」入口。

**删除不动历史**：`rolls`/`feedbacks` 按 placeId 记录，删店只改 selection，
历史照常显示。后验（α/β）也保留 —— 万一加回来，之前学到的东西还在。

### 4.5 目录怎么来（本轮的数据工作）

写一个离线脚本 `scripts/build-catalog.mjs`，复用**我们自己的** provider
（`GooglePlaceProvider` + `OpenRouterNoteAnalyzer`）批量抓取并分类，产出
`src/data/catalog.ts`。这样目录数据和用户导入走的是同一条流水线、同一套分类
标准，不会出现「种子数据和导入数据长得不一样」的分裂。

抓取清单按**菜系 × 场景**铺开，重点补 research/0004 点名的西餐晚市缺口。
每家店记 `fetchedAt`，30 天 TTL 同样适用（design/0005 §4.8）。

## 5. 备选方案 / Alternatives considered

| 方案 | 优点 | 缺点 | 为什么没选 |
| ---- | ---- | ---- | ---------- |
| 套餐用动态条件（rating>4.5） | 自动更新 | 刷分店、奶茶店混进来，精选就不精 | 显式挑选，质量可控 |
| 新店直接进所有人池子 | 零成本 | 替用户做主 | ADR-0008 已否决 |
| 一进来就要 GPS 权限 | 距离最准 | 首次体验就弹权限框，劝退 | 默认锚点，GPS 按需 |
| 半径默认 5km | 结果更贴身 | 新用户莫名看到空池子 | 默认不限 |

## 6. 风险与未决问题 / Risks & open questions

- **Risk:** 目录涨大后 Places 抓取成本上升。**缓解:** 目录是**离线一次性**生成的
  静态文件，运行时不调 Places；只有用户自己导入才花钱。
- **Risk:** 老用户的池子被意外改变。**缓解:** 无选择记录 → 默认成原 15 家种子，
  并写测试锁住这个行为。
- **Open:** 套餐要不要给 `base_weight` 加成（用户主动选的套餐 = 更想吃）？
  本轮不加，等试玩反馈。

## 7. 落地计划 / Rollout

Unit D（创始人）：目录生成脚本 + 50+ 家数据 + 套餐定义。
Unit A（CTO）：目录/池子/选择/位置的数据层、两个后端、迁移、本地化视图函数、测试。
Unit C（前端）：池子管理、套餐浏览、位置与半径设置界面。
之后 Unit B（前端）：界面语言支持（design/0007），放在 UI 定稿之后做。

## 8. 变更记录 / Changelog

| 日期 | 改了什么 | 谁 |
| ---- | -------- | -- |
| 2026-09-26 | 初稿并开工（Round 5） | claude-opus-5 |
