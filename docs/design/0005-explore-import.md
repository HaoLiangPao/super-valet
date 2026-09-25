---
id: 0005
title: EXPLORE 页：按店名或粘贴笔记导入餐厅
status: accepted
author: claude-opus-5
created: 2026-09-20
updated: 2026-09-20
superseded_by:
related: [design/0001, design/0002, ADR-0006, ADR-0007, research/0001]
tags: [explore, places, llm, data-pipeline]
---

# EXPLORE 页：按店名或粘贴笔记导入餐厅

## 1. 问题 / Problem

**目前没有任何餐厅信息采集机制。** 池子是 2026-08 手工抓取的 15 家店，
冻结在 `src/data/seed-restaurants.ts`，全体用户共享、永不增长。后果：

- **几何坍缩**（research/0001 §3）：工作日晚餐硬过滤后只剩个位数候选，
  多样性机制失去意义。唯一解法是池子扩到 30–40 家。
- **persona 测不了**：晚餐池零西餐店，🥩 西餐控无从展示（research/0004 §三）。
- **用户带不进自己的口味**：试玩者看到的是别人的 Markham 餐厅，与自己无关。
- design/0001 §5 早已设计好「手动粘贴 + AI 抽取」的合规数据源，一直没落地。

## 2. 目标与非目标 / Goals & Non-goals

**Goals**

- [ ] 新增 **EXPLORE 页**（底部第四个 Tab），两条入口收敛到同一条导入流水线：
      ① 输入店名 → Google Places 查询；② 粘贴笔记正文（小红书/大众点评/任何文本）
      → LLM 抽出候选店名 → 同样走 Places。
- [ ] 导入的餐厅**只进当前身份的池子**：登录态入 Supabase，游客态入 localStorage。
- [ ] 补齐引擎要求的 18 个字段：Places 给事实字段，LLM 给分类字段（design/0002 §8）。
- [ ] 粘贴笔记时顺带抽取**招牌菜提及**，落 `dishes`（design/0001 §5 的资产，本轮只存不展示）。
- [ ] 无 API key 时整条流程仍可开发与测试（fixture provider）。

**Non-goals（本轮明确不做）**

- **爬取小红书/大众点评** —— 违反其用户协议，design/0001 §5 已定案：只处理用户主动粘贴的内容。
- 招牌菜展示 UI、餐厅照片、编辑已导入餐厅（本轮只做增/删）。
- 批量导入、导入他人池子、餐厅共享社区。

## 3. 成功长什么样 / Success criteria

- 输入「海底捞 Markham」→ 10 秒内出候选 → 选中 → 预览卡字段齐全 → 入池 → 摇一摇能摇到它。
- 粘贴一篇真实笔记 → 抽出 ≥1 家可定位的店 + 若干菜名。
- 两个账号各自导入，互不可见（沿用 ADR-0006 的 RLS）。
- 池子从 15 家扩到 30+ 家后，工作日晚餐候选数明显上升（对照 research/0001 §3）。

## 4. 方案 / Proposed design

### 4.1 一条流水线，两个入口

```
[输入店名]  ─────────────────────────┐
                                     ├─→ ① Places Text Search（候选列表）
[粘贴笔记] → ⓪ LLM 抽取店名/城市 ───┘            ↓
                                        用户选中一家
                                                 ↓
                                        ② Places Details（字段掩码控成本）
                                                 ↓
                                        ③ LLM 分类 → 菜系/场景字段
                                                 ↓
                                        ④ 本地计算距离与 bucket
                                                 ↓
                                        预览卡（可改分类）→ 确认 → 入池
```

### 4.2 防幻觉硬边界（本设计最重要的一条）

**LLM 只做两件事：把散文变成搜索词、把 Places 结果映射到我们的分类表。**

**坐标、营业时间、评分、价位、place_id 一律只能来自 Google Places，
禁止 LLM 生成或补全。** 理由：`isOpenAt()` 直接决定「推给你的店是不是关着门」，
这是最伤信任的一类错误（种子文件 v2 变更说明里已有血泪记录）。
分类字段可以错（用户能改），事实字段不能编。

### 4.3 字段来源对照

| 字段 | 来源 |
| ---- | ---- |
| `placeId` `name` `address` `lat` `lng` `priceLevel` `rating` `ratingCount` | Places Details |
| `serviceWindows` `closedDays` | Places `regularOpeningHours` → 转换器（含跨零点处理） |
| `primary` `tags` `soloFriendly` `slotLock` `isMainMeal` `priorBias` `confidence` `reason` | LLM 分类器（design/0002 §8 的两步法：规则表先行，未命中才问 LLM） |
| `distanceKm` `bucket` | 本地 Haversine，锚点 Downtown Markham（ADR-0003 的既定做法，不引 PostGIS） |
| `dineIn` | Places 的 `dineIn` 字段，缺失则默认 `true` |

`confidence < 0.7` → 预览卡标黄并要求用户确认分类（design/0002 §8 Step 3 的人工复核，
在 20–100 家店的规模下就该由用户点两下完成，不建自动化复核流程）。

### 4.4 去重

`placeId` 是唯一键。已在池中 → 提示「已经在你的池子里了」，提供「去看看」而不是重复插入。

### 4.5 身份与存储

沿用 ADR-0006 的双后端：登录态走 Supabase（新增 `restaurants` / `user_restaurant_pool`
/ `dishes` / `sources`，RLS 同现有规则），游客态走 localStorage 命名空间。
`StoreBackend` 接口新增餐厅池读写方法，引擎侧仍只看到一个 `Restaurant[]`。

### 4.6 Provider 抽象（无密钥也能开发）

```ts
interface PlaceProvider {
  search(query: string, bias?: LatLng): Promise<PlaceCandidate[]>;
  details(placeId: string): Promise<PlaceDetails>;
}
interface NoteAnalyzer {
  extractCandidates(text: string): Promise<{ queries: string[]; dishes: DishMention[] }>;
  classify(input: ClassifyInput): Promise<Classification>;
}
```

两套实现：`google`/`anthropic`（真实）与 `fixture`（确定性、离线、单测用）。
由环境变量决定注入哪套，缺密钥自动回落 fixture 并在 UI 顶部标注「演示数据」。

### 4.7 抓取台账（Hao 2026-09-25 追加）

每一次对外抓取都记一行 `FetchLogEntry`（时间、类型、查询词、命中的店、
provider、结果数、结果状态、一句备注），按身份存：登录走 Supabase `fetch_log`，
游客走 localStorage。用途有三：**成本观察**（谁在烧 Places 配额）、
**排查**（分类不对时回看当时抓到了什么）、**新店比例统计**（`not_found` 的占比）。

同时每家导入的餐厅带一条 `fetch_summary` 一行摘要，例如：

```
云尚米线 · CN_NOODLE(0.80) · ★4.8/1204 · 价位1 · 1段营业 · 无固定休 · 有堂食 · 菜品1道
```

目的是在 Supabase Dashboard 里扫一眼就知道「这条是什么时候抓的、抓到了什么」，
不必 join 几张表看原始字段。

### 4.8 事实数据的 30 天 TTL（Hao 2026-09-25 追加）

营业时间、评分、价位都会变（实测：云尚米线的评价数一个月从 1187 涨到 1204）。
`restaurants.fetched_at` 记录抓取时间，超过 `FACTS_TTL_DAYS = 30` 视为过期。
本轮实现**惰性刷新**：重新预览同一家店就会重抓并覆盖；池子页用 `staleEntries()`
标出过期项。等流量上来再上 Vercel Cron 做批量定时刷新 —— 现在做定时任务
是在没有流量的情况下替自己制造运维负担。

## 5. 备选方案 / Alternatives considered

| 方案 | 优点 | 缺点 | 为什么没选 |
| ---- | ---- | ---- | ---------- |
| 爬小红书 | 数据最丰富 | 违反 ToS、反爬维护成本高、法律风险 | design/0001 §5 已否决 |
| 纯手工表单录入 | 零 API 成本 | 18 个字段手填，营业时间尤其劝退 | 作为兜底保留，不作主路径 |
| 让 LLM 直接输出全部字段 | 一次调用搞定 | 会编造坐标与营业时间 → 推荐已关门的店 | §4.2 明确禁止 |
| 在客户端直连 Places | 少一层服务端 | API key 必然暴露在浏览器 | 安全上不可接受 → ADR-0007 |

## 6. 风险与未决问题 / Risks & open questions

- **Risk:** 导入的店分类错 → 推荐变差。**缓解:** 低置信度强制用户确认；`reason` 字段留痕可回溯。
- **Risk:** Places 免费额度用尽产生费用。**缓解:** 字段掩码只取必要字段；
  Details 结果缓存 30 天；给项目设预算告警（见 `docs/GO-LIVE.md`）。
- **Risk:** 用户粘贴超长文本 → LLM 成本失控。**缓解:** 前端截断到 8000 字符，服务端再校验。
- **Risk（实测发现，2026-09-25）:** Places 的 Text Search 是模糊匹配，**几乎从不返回空** ——
  搜一个不存在的店也会返回沾边的店（「阿巴阿巴烧烤 Markham」→「南波万」「BBQ House」）。
  照「返回空才算没找到」实现的话，用户会把一家**根本不是他要的店**导进池子，
  而且当时未必看得出来。**缓解:** `src/lib/places/relevance.ts` 做名称相关性校验，
  全部候选都不相关才判定「还没上 Google 地图」。阈值 0.5 对 4 字短店名偏松
  （「廿一筷子」会匹配到「拈一筷子」），但候选列表会展示店名与地址交给用户判断。
- **Open（实测发现，2026-09-25）:** 目前「Places 没给营业时间」与「24 小时营业」
  都表示成空 `serviceWindows`，引擎一律判定为营业中，UI 还会对用户断言
  「全年 24 小时营业」——这可能是假话，也可能导致凌晨推荐一家关着门的店，
  与 §4.2 的初衷相悖。修法是加一个 `hoursKnown` 字段区分两者，涉及契约、
  转换器、`isOpenAt` 与 UI 文案，留到下一轮。
- **Open:** 导入的店要不要给 `base_weight` 加成？design/0001 §5 主张「愿意粘贴笔记 = 真想去」。
  本轮先不加，等试玩反馈（记入 OPEN-QUESTIONS）。

## 7. 落地计划 / Rollout

Unit A（CTO）：ADR-0007 + 服务端路由 + provider 双实现 + schema 迁移 + 存储层扩展 + 测试。
Unit B（前端）：EXPLORE 页 UI（Organic 风格）+ 第四个 Tab + 预览卡交互。
两单并行，接口契约由创始人先行冻结在 `src/lib/places/contract.ts`。
之后：创始人验收 → QA 复检 → 合入 `feat/explore-import` → 拿到密钥后切真实 provider → 上线。

## 8. 变更记录 / Changelog

| 日期 | 改了什么 | 谁 |
| ---- | -------- | -- |
| 2026-09-20 | 初稿并开工（Round 4 Unit 0） | claude-opus-5 |
| 2026-09-25 | LLM 改用 DeepSeek（经 OpenRouter）；新增 §4.7 抓取台账、§4.8 30 天 TTL；补记相关性校验与营业时间未知两个实测发现 | claude-opus-5 |
