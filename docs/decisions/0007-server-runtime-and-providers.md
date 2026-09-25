---
id: 0007
title: 用 Next.js Route Handler 做服务端，外部数据源走 provider 抽象
status: proposed
author: claude-opus-5
created: 2026-09-20
updated: 2026-09-20
superseded_by:
related: [ADR-0003, ADR-0006, design/0005]
tags: [infra, api, secrets]
---

# ADR-0007: 用 Next.js Route Handler 做服务端，外部数据源走 provider 抽象

> status: **proposed** —— 这是本项目第一次引入服务端运行时与按量计费的外部
> API，会改变部署形态与成本结构，请 Hao 复核后转 accepted。

## 背景 / Context

design/0005（EXPLORE 导入）需要调用两个带密钥的外部服务：Google Places API
与一个 LLM（经 OpenRouter 调 DeepSeek）。当前应用是**纯静态站**（四条路由全部预渲染，见 research/0004），
没有任何服务端代码。密钥绝不能进浏览器，因此必须引入服务端运行时。

约束：单人维护、月预算个位数美金、不增加新的托管平台。

## 决策 / Decision

**我们决定：**

1. 在现有 Next.js 应用内新增 **Route Handler**（`src/app/api/**/route.ts`），
   部署为 Vercel 的 serverless function，与前端同仓同域，不新增托管平台。
2. 密钥用**非** `NEXT_PUBLIC_` 前缀的服务端环境变量
   （`GOOGLE_PLACES_API_KEY`、`OPENROUTER_API_KEY`），只在 Route Handler 内读取。
3. 外部数据源一律经 **provider 接口**访问（`PlaceProvider` / `NoteAnalyzer`），
   随包提供 `fixture` 实现；缺少密钥时自动回落 fixture，并在 UI 标注「演示数据」。
4. 餐厅数据落 Supabase 新表（`restaurants` 共享事实 + `user_restaurant_pool` 按用户），
   RLS 规则沿用 ADR-0006：池子表 `auth.uid() = user_id`；
   `restaurants` 事实表登录用户只读、写入只经服务端。

### LLM 选型（Hao 2026-09-25 指定）

用 **DeepSeek（`deepseek/deepseek-chat`，经 OpenRouter）**，不装 SDK，直接
fetch 打 OpenAI 兼容接口。实测一次笔记抽取约 190 输入 + 180 输出 token，
按 OpenRouter 报价合每次约 0.02 美分 —— 导入这种低频操作的模型成本可以忽略。
模型名走 `OPENROUTER_MODEL` 环境变量，换模型不改代码。

## 理由 / Rationale

- **Route Handler 是最小增量**：不引新平台、不改部署流程、与现有 Supabase
  客户端会话天然同域。Supabase Edge Function 要多维护一套部署与密钥体系，
  对单人团队是净负债。
- **provider 抽象不是过度设计**：单元测试绝不该打真实计费 API；
  而且它让 UI/schema/流程在密钥到位**之前**就能完整开发与验收 —— 本轮正是如此。
- **fixture 回落**比报错更好：新试玩者在密钥缺失时仍能看懂这个功能要干什么。

## 备选 / Options considered

| 选项 | 优点 | 缺点 | 结论 |
| ---- | ---- | ---- | ---- |
| Next.js Route Handler（本决策） | 同仓同域、零新平台、Vercel 原生 | 站点从纯静态变混合，冷启动几百毫秒 | ✅ |
| Supabase Edge Function | 与数据库同侧 | 第二套部署与密钥体系，单人维护成本翻倍 | ❌ |
| 浏览器直连外部 API | 无服务端 | 密钥必然泄露 | ❌ 不可接受 |
| 预先批量导入、应用内不调 API | 零运行时成本 | 用户带不进自己的店，等于没做这个功能 | ❌ 与 design/0005 目标冲突 |

## 后果 / Consequences

**得到**
- 用户可以把自己的餐厅带进来，池子终于能增长（解 research/0001 §3 的几何坍缩）。
- 有了服务端，未来的定时任务、推送通道、菜品抽取都有了落点。

**付出 / 接受的代价**
- 部署形态从纯静态变混合：`/api/*` 冷启动约数百毫秒（导入是低频操作，可接受）。
- 引入按量计费依赖：Places 每月 5,000 次 Text Search 免费额度之外产生费用；
  必须做字段掩码、结果缓存、预算告警三件事来兜住成本。
- 多一层 provider 抽象要维护：新增数据类型时接口/真实实现/fixture 三处同改。
- 密钥管理面扩大：本机 `.env.local` + Vercel 三个环境。

**什么情况下应该重新考虑这个决定**
- 服务端逻辑增长到需要独立后端（定时任务、队列、长任务）。
- Places 成本超出免费额度一个数量级，需要换数据源或自建缓存层。
