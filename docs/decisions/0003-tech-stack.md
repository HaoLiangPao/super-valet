---
id: 0003
title: 技术栈：Next.js + Supabase + Vercel（移动网页形态）
status: accepted
author: HaoLiangPao
created: 2026-09-17
updated: 2026-10-01
superseded_by:
related: [design/0001, design/0002, research/0001, ADR-0006, ADR-0007, ADR-0008]
tags: [infra, stack]
---

# ADR-0003: 技术栈：Next.js + Supabase + Vercel（移动网页形态）

> status: **accepted** —— Hao 2026-10-01 读过 2026-09-30 的修订稿后通过。

## 2026-09-30 修订：原文与现实对不上的地方

原文是开工前（2026-09-17）写的计划。到 Round 7 上线时，六处已经不是原来写的那样。
逐条列出来，而不是悄悄改掉：

| 条目 | 原文（2026-09-17） | 实际（2026-09-30 对照 `app/web/package.json` 与代码核过） | 依据 |
| ---- | ------------------ | -------------------------------------------------------- | ---- |
| 框架版本 | Next.js 15 | **Next.js 16.3.5** + React 19 | 开工时 16 已发布 |
| UI | Tailwind + shadcn/ui | **Tailwind 4，没有 shadcn/ui** —— 界面是照设计稿手写的 Organic 风格组件与动效 | design/0004 |
| ORM | Drizzle 全覆盖 | **没有 Drizzle。** 客户端用 `supabase-js`，schema 是 `supabase/migrations/` 下的手写 SQL | ADR-0006 |
| 地理查询 | Supabase PostGIS + RPC | **没有 PostGIS。** 应用层按经纬度算距离 | Q3 裁决、ADR-0008 |
| LLM | Claude API (Haiku) | **DeepSeek，经 OpenRouter**，直接 fetch，不装 SDK | Hao 2026-09-25 指定、ADR-0007 |
| 形态与定时 | PWA + Vercel Cron + Web Push | **普通移动网页。** 没有 manifest、service worker、Cron、推送；月度刷新由用户打开应用时触发（`AutoRefresh` 组件） | Q4 裁决、design/0008 |

没变的：TypeScript、Supabase（Postgres + Auth + RLS）、Vercel 托管、Google Places API (New)。

## 背景 / Context

单人业余时间维护、月预算 0–25 美金、决策场景在手机上（「站在楼下饿着」）。
要求低运维、免费额度友好、AI 辅助编码高效的主流技术栈。

## 决策 / Decision

**我们决定采用**：Next.js 16 (App Router) + React 19 + TypeScript / Tailwind 4 /
Supabase（Postgres + Auth + RLS，经 `supabase-js`，手写 SQL 迁移）/
Vercel（托管 + serverless Route Handler）/ DeepSeek 经 OpenRouter /
Google Places API (New)；产品形态为**普通移动网页**，不做 PWA 安装与推送。

细节各有专门的 ADR，本文只定大盘：账号与云端数据见 ADR-0006，
服务端运行时与外部 provider 见 ADR-0007，目录/池子与运行时距离见 ADR-0008。

## 理由 / Rationale

- 前后端一体，省一层 API 样板；Vercel 零配置托管。
- Supabase 免费额度对自用绰绰有余，自带 Auth / RLS。
- 网页免 App Store 审核、免双端开发，满足「两秒出结果」。
- 不上 ORM：五个迁移、二十张表以内，手写 SQL 加 `supabase-js` 比多一层抽象更直接，
  RLS 策略本来也只能写 SQL。
- 不上 PWA 推送：research/0002 的模拟显示反馈回收率 30% 与 90% 对结果无影响，
  推送链路（iOS 上要求安装 + 16.4+ + 授权）的脆弱换不来相称的收益。

## 备选 / Options considered

| 选项 | 优点 | 缺点 | 结论 |
| ---- | ---- | ---- | ---- |
| 本方案 | 低运维、生态成熟 | 锁进 Vercel/Supabase | ✅ 采纳 |
| FastAPI + React 双仓库 | 算法侧 numpy/scipy 顺手 | 两套部署 | ❌ 单人维护成本高 |
| 纯前端 + localStorage | 半天可用 | 无跨端 | 游客模式保留了这条路（ADR-0006） |
| 原生 iOS App | 推送可靠 | 审核 + 双端 + 开发量 | ❌ |

## 争议项（已全部落定）

| # | 条目 | 企划书方案 | Fable 立场（research/0001 §4） | 裁决 |
|---|------|-----------|------------------------------|------|
| 1 | 地理查询 | Supabase PostGIS + RPC | 反对：≤100 家店应用层算距离足够 | **不上 PostGIS**（Q3，Hao 2026-09-30） |
| 2 | 推送/反馈通道 | iOS PWA Web Push | 全案最大技术风险；反馈通道改 Telegram bot | **不做推送**，下次打开时补问（Q4，Hao 2026-09-30）。Fable 的 Telegram 主张被他自己的模拟否掉了 |
| 3 | ORM 范围 | Drizzle 全覆盖 | Drizzle 可用，但算法查询直接写 SQL | **不用 ORM**，事实上从未引入 |

## 后果 / Consequences

**得到**
- 一周内从零到部署；实际月成本 $0（Vercel Hobby + Supabase 免费档 + Places 免费额度，
  LLM 每次导入约 0.02 美分）。

**付出 / 接受的代价**
- 锁进 Vercel/Supabase 生态（自用规模下可接受）。
- 算法迭代在 TypeScript 里做，数值生态弱于 Python —— 用独立的
  `sim.py` 做离线模拟来补。
- 没有服务端定时任务：用户一个月不打开应用，他的数据就一个月不刷新。
  目前可接受（不打开就不需要新数据），要做「到点提醒」时这条会先撞墙。

**什么情况下应该重新考虑这个决定**
- 用户规模化（RLS/成本模型改变）。
- 目录涨到几千家，需要召回层与地理索引（届时重审 PostGIS）。
- pilot 数据显示用户「忘了用」，需要主动提醒（届时重审推送与定时任务）。

## 变更记录 / Changelog

| 日期 | 改了什么 | 谁 |
| ---- | -------- | -- |
| 2026-09-17 | 初稿：Next.js 15 + Supabase + Drizzle + Vercel（PWA 形态） | HaoLiangPao |
| 2026-09-30 | 按实际技术栈修订（六处差异逐条列出）；三个争议项随 Q3/Q4 裁决落定；状态保持 `proposed` 等 Hao 复核 | claude-opus-5-5 |
| 2026-10-01 | Hao 复核修订稿：`proposed` → `accepted` | claude-opus-5-5 |
