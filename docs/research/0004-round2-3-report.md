---
id: 0004
title: 第二、三轮收尾报告：保真 UI、多 Profile、真实账号上线
status: review
author: claude-fable-5
created: 2026-09-18
updated: 2026-09-18
superseded_by:
related: [design/0004, ADR-0006, research/0003]
tags: [report, autopilot, accounts, ui]
---

# 第二、三轮收尾报告

> **生产地址：https://supper-valet.vercel.app** （v2，含真实账号）
> 组织：Opus CTO 端到端负责账号轮，Sonnet 前端做保真 UI，Sonnet QA 两轮
> 独立验证（生产回归 + 部署前复检），创始人验收与部署。

## 一、交付（对应 commit）

| Commit | 内容 |
|--------|------|
| `0a23cf9` | design/0004 方案 + GO-LIVE 清单 + 组织扩编 |
| `7916c64` | 多 Profile 隔离层：命名空间存储、三 persona 先验、旧数据迁移（34 测试） |
| `fcfbbde` | Organic 保真 UI：设计 token / Caprasimo+Figtree / 九组动效逐字照搬 |
| `a9b9cb6` | v1 上线 + 组织升格 CTO+QA |
| `05e9f0f` | **真实账号**（ADR-0006）：邮箱密码登录、五表 RLS、云端 store、游客模式保留（55 测试） |

v1 与 v2 两次部署之间，QA 对生产做了独立回归（Go，0 阻塞 0 严重）；
账号轮部署前 QA 又做了 9 项复检（Go，8 全过 + 1 已知瑕疵）。

## 二、账号体系一页说明（给 Hao 试玩用）

- 试玩用户开 **邮箱+密码** 账号（注册即用，不发确认邮件）；现成测试号
  `test+1/2/3@supper-valet.local`（中餐控/西餐控/从零开始），密码见
  `app/web/.env.local`（不进仓库）。
- 每个账号数据在 Supabase 按 `auth.uid()` RLS 硬隔离（经对抗式验证：
  冒名读/写/删全部 0 生效）。**不登录 = 游客模式**，本机 Profile 原样保留。
- 你在 Supabase Dashboard（Table Editor / `admin_roll_feed` 视图）能直接看
  所有账号的 rolls（含两层 θ 快照）、feedbacks、口味后验 —— pilot 数据不用再问。

## 三、跟进清单（按优先级）

1. **登录后首拉偶发 401「JWT issued at future」**：重试内自愈、用户无感，
   但生产也复现（创始人部署后冒烟亲测 1 次）。非本机时钟问题 → 下轮修
   （方案：登录成功后首拉前 300ms 缓冲，或提高重试预算）。
2. **试玩名单固定后收口公开注册**：命令在 GO-LIVE.md。
3. **导出 JSON 按钮**：无头环境测不了下载，请 Hao 真机（iOS Safari）点一次确认。
4. **persona 倾斜前几摇不够「显灵」**：概率抽样使然，等 pilot 反馈决定
   是否加大先验幅度（这就是第一个可以用多账号做的对照实验）。
5. 新建 Profile 空名字无行内提示（小 UX）。
6. **晚餐池零西餐店**：西餐控 persona 晚餐无从展示，需补 Markham 西餐晚市店
   （数据工作，research/0001 §3 池子扩容的一部分）。
7. ADR-0006 status=proposed，待 Hao 过目转 accepted。

## 四、花费结构（本两轮子代理）

Opus（技术负责人→CTO）两单 ≈ 33.8 万 tokens；Sonnet（前端+QA×2）三单
≈ 56.4 万 tokens。创始人层：spec、四次验收、两次部署、冒烟。
符合「贵模型做复杂决策、中模型做实现与验证、创始人只做编排验收」的结构。

## 变更记录

| 日期 | 改了什么 | 谁 |
| ---- | -------- | -- |
| 2026-09-18 | 第二、三轮收尾 | claude-fable-5 |
