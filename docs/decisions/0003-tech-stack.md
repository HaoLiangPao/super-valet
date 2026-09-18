---
id: 0003
title: 技术栈：Next.js 15 + Supabase + Drizzle + Vercel（PWA 形态）
status: proposed
author: HaoLiangPao
created: 2026-09-17
updated: 2026-09-17
superseded_by:
related: [design/0001, design/0002, research/0001]
tags: [infra, stack]
---

# ADR-0003: 技术栈：Next.js 15 + Supabase + Drizzle + Vercel（PWA 形态）

> ⚠️ **status: proposed** —— 主体方案无争议，但其中三项被 Fable 评审反对
> （见下），对应 OPEN-QUESTIONS Q3 / Q4，逐项裁决后才转 accepted。

## 背景 / Context

单人业余时间维护、月预算 0–25 美金、决策场景在手机上（「站在楼下饿着」）。
要求低运维、免费额度友好、AI 辅助编码高效的主流技术栈。

## 决策 / Decision

**我们决定采用**：Next.js 15 (App Router) + TypeScript / Tailwind + shadcn/ui /
Supabase (Postgres) / Drizzle / Vercel (托管 + Cron) / Claude API (Haiku) /
Google Places API (New)；产品形态为 PWA。

## 理由 / Rationale

- 前后端一体 + Server Actions，省一层 API 样板；Vercel 零配置托管。
- Supabase 免费额度对自用绰绰有余，自带 Auth / RLS。
- PWA 免 App Store 审核、免双端开发，满足「两秒出结果」。

## 备选 / Options considered

| 选项 | 优点 | 缺点 | 结论 |
| ---- | ---- | ---- | ---- |
| 本方案 | 低运维、生态成熟 | 见争议项 | ✅ 主体采纳 |
| FastAPI + React 双仓库 | 算法侧 numpy/scipy 顺手 | 两套部署 | ❌ 单人维护成本高 |
| 纯前端 + localStorage | 半天可用 | 无定时任务、无跨端 | 作为 P-1 原型保留 |
| 原生 iOS App | 推送可靠 | 审核 + 双端 + 开发量 | ❌ |

## 争议项（裁决前保持 proposed）

| # | 条目 | 企划书方案 | Fable 立场（research/0001 §4） | 状态 |
|---|------|-----------|------------------------------|------|
| 1 | 地理查询 | Supabase PostGIS + RPC | 反对：≤100 家店应用层 Haversine 足够 | Q3 未决 |
| 2 | 推送/反馈通道 | iOS PWA Web Push | 全案最大技术风险；反馈通道改 Telegram bot | Q4 未决 |
| 3 | ORM 范围 | Drizzle 全覆盖 | Drizzle 可用，但算法查询直接写 SQL，不追求 ORM 纯度 | 低优先级 |

## 后果 / Consequences

**得到**
- 一周内可从零到部署；月成本 $2–7。

**付出 / 接受的代价**
- 锁进 Vercel/Supabase 生态（自用规模下可接受）。
- 算法迭代在 TypeScript 里做，数值生态弱于 Python —— 用独立的
  `sim.py` 做离线模拟来补。

**什么情况下应该重新考虑这个决定**
- 用户规模化（RLS/成本模型改变）。
- 争议项 1–3 的裁决推翻主体假设（如放弃 PWA 形态）。
