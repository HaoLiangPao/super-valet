---
id: 0003
title: P0 Web App：Next.js 脚手架 + 两层 Bandit 引擎 + 牌堆 UI（本地优先）
status: accepted
author: claude-fable-5
created: 2026-09-17
updated: 2026-09-17
superseded_by:
related: [design/0001, design/0002, ADR-0003, ADR-0004, ADR-0005, research/0002]
tags: [p0, web, engine]
---

# P0 Web App：Next.js 脚手架 + 引擎 + 牌堆 UI

> 范围由 Hao 于 2026-09-17 出差前批准（「直上 P0：Next.js 脚手架」）；
> 实现细节由创始人在自动驾驶授权下决定，回来后可评审推翻。
> UI 蓝本：`docs/assets/p1-prototype-design-canvas.html`（Hao 提供的牌堆设计稿）。

## 1. 问题 / Problem

设计已冻结（0001/0002 + ADR 0002–0005 + sim 裁决），代码为零。需要在
无外部账号（Supabase / Vercel / Places API 都等 Hao 回来开）的约束下，
把 P0 做到「回来当晚就能真用」。

## 2. 目标与非目标 / Goals & Non-goals

**Goals**

- [ ] `app/web`：Next.js 15 (App Router) + TypeScript + Tailwind，`npm run build` 绿。
- [ ] 推荐引擎 `app/web/src/lib/engine/`：**对餐次无感知**（ADR-0004），
      两层软乘积打分（ADR-0005），修复版营业时间判断，skip 原因分流。
- [ ] 数据层**本地优先**：localStorage + JSON 导出/导入；`rolls` 快照含
      `candidates_snapshot`（两层 θ）与 `algo_version: 'v2-soft'` —— schema 对齐
      design/0001 §6，日后换 Supabase 只动持久化层。
- [ ] UI 按牌堆设计稿：摇一摇 → 结果卡 → OK/换一个（原因 chips）→
      三摇降级三选一 → 锁定页；池子页（新鲜度条）；历史页。
- [ ] 引擎单元测试（vitest）+ Playwright 冒烟自测通过。

**Non-goals（本轮不做）**

- Auth、Supabase、推送、Google Places 接入、招牌菜抽取、午餐 meal 配置。

## 3. 成功长什么样 / Success criteria

- `npm test`、`npm run build` 全绿；Playwright 走通「摇→接受→锁定」并在
  localStorage 里留下含快照的 roll 记录。
- Hao 回来打开 `npm run dev` 即可当晚选餐。

## 4. 方案 / Proposed design

```
app/web/src/lib/engine/
  types.ts       Restaurant / MealConfig / RollRecord / PosteriorState
  cuisine.ts     primary → category 映射（design/0002 §7 中间层）
  openHours.ts   isOpenAt 修复版（research/0001 §5）
  random.ts      可注种子的 RNG + Beta 采样（Marsaglia-Tsang Gamma）
  scoring.ts     freshness × cuisinePenalty × distanceWeight × θ_store × θ_cat^0.5
  posterior.ts   评分/skip → (α,β) 更新（ADR-0005 映射表）
  engine.ts      rollOnce / accept / skip / feedback 主流程（meal 作参数）
  store.ts       localStorage 持久化 + JSON 导出
app/web/src/data/seed-restaurants.ts   种子数据（源自 data/，构建需在 root 内故复制）
app/web/src/app/  page.tsx(牌堆) · pool/ · history/
```

MealConfig 先只注册 `dinner`（18:30 判定、d0 工作日 6km / 周末 15km，
锚点 Downtown Markham）；午餐日后加一份配置即可（ADR-0004）。

## 5. 备选方案 / Alternatives considered

| 方案 | 优点 | 缺点 | 为什么没选 |
| ---- | ---- | ---- | ---------- |
| 先接 Supabase | 少一次迁移 | 需要账号，出差期间办不了 | 外部服务越界 |
| 纯离线单页（P-1） | 半天 | Hao 已明确选 P0 | 投资人拍板 |
| 引擎放独立 npm 包 | 复用给 bot | monorepo 工装成本 | 单应用阶段过度工程 |

## 6. 风险与未决问题 / Risks & open questions

- **Risk:** localStorage 换 Supabase 时 schema 漂移 → **缓解:** store.ts 的记录
  形状 1:1 对齐 design/0001 §6 的表结构。
- **Open:** Q6（推送默认 vs 摇一摇）—— 本轮按设计稿做摇一摇，不预判。

## 7. 落地计划 / Rollout

Unit 1 脚手架 → Unit 2 引擎+测试 → Unit 3 UI → Unit 4 build+Playwright 冒烟
→ Unit 5 研究报告收尾。每个 Unit 一个 commit，CI 绿才提交。

## 8. 变更记录 / Changelog

| 日期 | 改了什么 | 谁 |
| ---- | -------- | -- |
| 2026-09-17 | 初稿并开工（自动驾驶 Unit 0） | claude-fable-5 |
