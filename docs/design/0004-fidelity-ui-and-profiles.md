---
id: 0004
title: 第二轮：设计保真 UI（Organic + 动效）+ 多 Profile 隔离 + Vercel 就绪
status: accepted
author: claude-fable-5
created: 2026-09-18
updated: 2026-09-18
superseded_by:
related: [design/0003, ADR-0005, research/0003]
tags: [ui, profiles, deploy]
---

# 第二轮：设计保真 UI + 多 Profile + Vercel 就绪

> Hao 2026-09-18 拍板：① P0 的 UI 与设计稿差距过大且无动效，按设计稿重做；
> ② 要多账号（不同账号独立学习偏好，可造 persona 做测试，互不干扰）；
> ③ 上线 Vercel，采购清单见 `docs/GO-LIVE.md`。算法讨论推迟到 POC 之后。

## 1. 问题 / Problem

- P0 UI 只取了设计稿的底色，未采用其设计系统（Organic tokens、Caprasimo/Figtree
  字体、9 组 keyframes 动效），「摇一摇」没有翻牌仪式感 —— 而 design/0001 §7
  明确「摇骰子的翻牌动效是产品的情绪价值所在」。
- 单一 localStorage 命名空间：无法做 persona 对照测试，试玩会互相污染。

## 2. 目标与非目标 / Goals & Non-goals

**Goals**

- [ ] UI 按解包出的设计模板重做（tokens/字体/组件类/动效逐项对齐），
      结果卡用「不要照片」变体（本轮无图片数据源）。
- [ ] 本地多 Profile：选人页进入；预置 3 个 persona（西餐控 🥩 / 日料控 🍣 /
      中餐控 🥟，用类别层先验 α/β 造出偏好差异）+ 自定义新建；
      **数据按 Profile 命名空间完全隔离**；现有数据迁移为「默认」Profile。
- [ ] Vercel 可部署（静态即可）；部署步骤与采购清单落 `docs/GO-LIVE.md`。

**Non-goals（本轮不做）**

- 跨设备真实账号 / Supabase（等 Hao 提供项目凭证，schema 已在 design/0001 §6）。
- 算法改动（投资人明确推迟）。餐厅照片（需 Places API）。

## 3. 成功长什么样 / Success criteria

- 并排对比设计稿与实现，视觉一致（字体、双强调色、卡片、动效节奏）。
- 切换 persona 后摇 10 次，西餐控明显更常出西餐（先验生效的肉眼验证）。
- 一个 Profile 的摇/反馈完全不影响另一个（存储隔离测试通过）。
- `npx vercel deploy` 在拿到账号后一步上线。

## 4. 方案 / Proposed design

- 设计参考：`docs/assets/p1-prototype-design-canvas.html` 解包出的模板
  （tokens 行 12–341，fx 行 344–363，屏幕 markup 行 364–859）。
- 字体经 `next/font/google`（Caprasimo + Figtree）自托管；CJK 回退系统栈。
- `src/lib/profiles/`：Profile 注册表 + 活跃 Profile + 命名空间化存储 +
  persona 先验种子；`store.ts` 全部 key 变为 `sv.<profileId>.*`。
- 动效尊重 `prefers-reduced-motion`。

## 5. 备选方案 / Alternatives considered

| 方案 | 优点 | 缺点 | 为什么没选 |
| ---- | ---- | ---- | ---------- |
| 直接上 Supabase 账号 | 一步到位 | 凭证未就绪，阻塞本轮 | 列入 GO-LIVE 下一轮 |
| iframe 嵌设计稿原型 | 像素级一致 | 与引擎/数据层割裂，死路 | 否 |

## 6. 风险与未决问题 / Risks & open questions

- **Risk:** Caprasimo 无 CJK 字形 → 中文标题回退系统字体，与设计稿轻微不一致。
  → 接受；标题里的拉丁字符仍出效果。
- **Open:** persona 先验的具体 α/β 数值是拍的，等试玩反馈再调。

## 7. 落地计划 / Rollout

Unit A（Opus 技术负责人）Profile 层 + 迁移 + 测试 → Unit B（Sonnet 前端）
保真 UI + 动效 → 创始人 Playwright 验收 + 截图对比 → GO-LIVE 清单交付。

## 8. 变更记录 / Changelog

| 日期 | 改了什么 | 谁 |
| ---- | -------- | -- |
| 2026-09-18 | 初稿并开工 | claude-fable-5 |
