---
id: 0003
title: 种子轮第一轮收尾报告：P0 Web App 从零到可用
status: review
author: claude-fable-5
created: 2026-09-18
updated: 2026-09-18
superseded_by:
related: [design/0003, ADR-0003, ADR-0004, ADR-0005, research/0002]
tags: [report, autopilot, p0]
---

# 种子轮第一轮收尾报告：P0 Web App

> 自动驾驶授权下完成（Hao 出差，2026-09-17 晚 ~ 09-18 凌晨）。
> 交付：**打开 `npm run dev` 当晚就能用的选餐应用**。截图见
> `docs/assets/p0-locked-screen.png`，逐 commit 记录见 git log。

## 一、交付了什么

| Unit | Commit | 内容 |
|------|--------|------|
| 0 | `d82fca1` | design/0003 方案书；P-1 设计画布归档 docs/assets/ |
| 1+2 | `416e84f` | Next.js 脚手架；两层 Bandit 引擎 + **20 个单测** |
| 3 | `8078cf9` | 牌堆 UI 三页；创始人 Playwright 验收通过 |

功能闭环（对照牌堆设计稿）：摇一摇 → 结果卡（评分/价位/距离/菜系/理由行）→
不OK 原因 chips（七类，按 design/0002 §5.3 分流更新后验）→ 三摇降级三选一 →
锁定页（决策秒数 + Google Maps 链接）→ **下次打开补问反馈**（Q4 方案 C 落地，
含「没去成」不动后验的规则）。池子页（新鲜度条 + 暂停开关）、记录页
（接受率统计 + JSON 全量导出，`candidates_snapshot` 齐全，未来可离线回放）。

## 二、决策与偏差（需要 Hao 知道的）

1. **Next.js 16 而非 ADR-0003 写的 15**：`create-next-app@latest` 现在交付
   16.3.5。按「不逆工具链」采纳。→ 建议：裁决 ADR-0003 争议项时顺手把版本
   号改成 16 并转 accepted。
2. **`eslint-plugin-react-hooks` v7 带来了 React Compiler 级 lint**：
   「effect 里 setState」的常规模式会挂 build。工程师用延迟 setState 模式
   绕过（运行时等价）。不算债，但读代码时会看到这个 pattern。
3. **单店先验实现**：`storePrior = Beta(2·priorBias, 1+(1−priorBias))`，
   priorBias=1 时即 ADR-0005 的 Beta(2,1)；低 bias 店（美式中餐）起点更保守。
   这是我对 design/0002 §2「Beta(1,4)」建议的连续化，回来可评审。
4. **「重新摇（变卦）」只清内存态**：不删已接受记录；刷新后仍显示原锁定，
   直到接受新的一摇。P0 够用，V1 若要严格覆盖需在记录上加 superseded 标记。

## 三、验收证据

- `npm run build`：4 条路由全部静态预渲染，零错误零 lint 警告。
- `npm test`：20/20（营业时间修复版含海底捞凌晨用例、后验分流、快照完整性）。
- Playwright 实测（创始人亲手，双份——工程师一份我一份）：完整决策流 +
  记录页持久化确认，全程 **0 console error/warning**。
- 数据文件的 `isOpenAt` 跨零点 bug 已在 `data/` 源头修复（review §5 的一行修）。

## 四、烧钱情况（种子轮纪律）

本轮子代理开销：Haiku 数据搬运 ~4.6 万 tokens；Sonnet UI 实现 ~22.5 万 tokens
（134 次工具调用，含它自己的 build/lint/test/浏览器冒烟）。创始人层主要花在
引擎实现、spec、两轮验收。结构符合「机械活便宜模型、实现中模型、设计与验收本体」。

## 五、Hao 回来后的建议议程

1. **真用一周** —— 每晚摇一次，反馈别偷懒。这是 P-1/P0 存在的全部意义：
   校准 τ=14、d0、冷却 3 天这些拍脑袋参数（design/0001 §12 的三个问题）。
2. 裁决 ADR-0003 三争议项（PostGIS/推送通道/ORM 范围）→ 转 accepted。
3. 池子从 15 家往 30–40 家铺（research/0001 §3，数据工作）。
4. 有 Supabase/Vercel 账号后：store.ts 换持久化层（shape 已对齐，改动面小）。

## 变更记录

| 日期 | 改了什么 | 谁 |
| ---- | -------- | -- |
| 2026-09-18 | 首轮收尾报告 | claude-fable-5 |
