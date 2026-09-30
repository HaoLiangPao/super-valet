---
id: 0005
title: 交接笔记：Round 4–7 收尾与下一任创始人的接手清单
status: review
author: claude-opus-5
created: 2026-09-29
updated: 2026-09-30
superseded_by:
related: [design/0008, design/0009, ADR-0008, ADR-0009]
tags: [handover, report]
---

# 交接笔记

> 给下一个会话：**先读 [`CLAUDE.md`](../../CLAUDE.md)（自动加载）和
> [`INSTRUCTION.md`](../../INSTRUCTION.md)**，那里是常驻规则与做法。
> 本文件只写**它们没有、而你接手第一天就需要知道**的东西：现在到哪一步了、
> 接下来做什么、有哪些坑是这几轮刚踩出来的。

## 1. 三十秒现状

| | |
| --- | --- |
| 线上 | https://supper-valet.vercel.app（已是最新，含 Round 7） |
| 分支 | `claude-version`（已推到 `0f01e74`）。**`main` 归 Hao，不许推** |
| 竞赛 | 与 Codex 团队同台竞投资。**绝不看** 根目录 `AGENTS.md`、`.agents/`、`codex/*` |
| 规模 | 74 家餐厅目录 · 7 个页面 · 5 个 API 路由 · 5 个迁移 · 273 个测试 · 22 篇文档 |
| 试玩账号 | `test+1/2/3@supper-valet.local`，口令在 `app/web/.env.local` |

## 2. 已经做完的（按路线图 design/0008）

| 步 | 内容 | 状态 |
| -- | ---- | ---- |
| S1 | 界面语言（中/英，各 312 条） | ✅ |
| S2 | 池子引导（<20 家时提示去套餐/探索） | ✅ |
| S3 | 可用性与归档**数据模型**（ADR-0009） | ✅ 数据层 |
| S4 | 刷新引擎、发现新店、报告落库、节制条款 | ✅ |
| S5 | SVG 雷达、附近列表、驾车估算、刷新报告界面 | ✅ |
| **S6** | **归档列表界面** | ⬜ **下一步** |
| **S7** | **行为统计页** | ⬜ |

**S6 不是可选项。** ADR-0009 定了「永不自动归档」，用户归档的店必须有地方看得到、
能恢复 —— 否则我们只是把 Google 的黑洞换成自己造的（这话是 CTO 在 S3 汇报里自己说的）。
所以 **S6 优先于 S7**。

## 3. 接手第一天要知道的三个坑（这几轮刚踩的）

**① 跨层断裂是本项目的头号事故模式，连续踩了两轮。**

- Round 5：数据层的池子/套餐/目录全做对了、测试全绿、池子页数字也对，
  但摇一摇页还在 `rollOnce(SEED_RESTAURANTS, ...)` —— 加套餐**完全不改变摇出来的结果**，
  还上了生产。
- Round 7：刷新引擎、节制条款、报告落库全写好并测绿，但 `maybeAutoRefresh()`
  **零调用点** —— Hao 点名要的「每月自动刷新」根本不会发生。

两次都是「数据层全绿 ≠ 功能存在」。现在有两条回归测试钉着
（`pool-roll-wiring.test.ts`、`auto-refresh-wiring.test.ts`，都反向验证过）。
**做任何跨层功能，验收必须跑那条端到端的路，别只看承载状态的页面**（INSTRUCTION.md §3）。

**② 不要在子代理还在跑的时候提交整棵树。** 我犯过两次，第二次把 CTO 的半成品
提交成了 `58dc18f`，它的报告里专门指了出来。等它交报告，或者只 `git add` 自己的文件。

**③ 验收要跑真实 API。** fixture 过了不代表真的通。这几轮所有外部集成
（Places、DeepSeek、Supabase RLS）都是拿真凭证实测过的，保持这个标准。

## 4. 等 Hao 裁决的事（别自行决定）

> **2026-09-30 更新：本节已清空，待办一律看 [`OPEN-QUESTIONS.md`](../OPEN-QUESTIONS.md)。**
> Hao 当天把这里列的事逐条裁决了：ADR-0006/0007/0008/0009 转 `accepted`
> （原文写「4 条 proposed」漏数了 0007，实际 5 条）；ADR-0003 因正文与现实不符，
> 修订后仍 `proposed` 待复核；design/0001、0002 转 `accepted`，
> 其余已上线的 design 转 `implemented`；Q2–Q6、Q10 关闭
> （原文写「共 10 条」，实际 11 条）；Q8、Q9、Q11–Q13 保留在台账里。
> 权限也重新定了一遍，见 `CLAUDE.md` §授权状态。

## 5. 杂项

- ~~**1.3 GB 临时文件没删掉**：`/tmp/claude-1000/-home-hao-Desktop-github-supper-valet/
  720e881f-.../scratchpad/{headcheck,buildcheck}`。`rm -rf` 被权限规则挡了
  （路径以 `/tmp` 开头命中 `Bash(rm -rf /*)`），没绕过，需要 Hao 手动删。~~
  **2026-09-30：已不存在，不用管。** 那个会话的整个临时目录都没了
  （`/tmp` 下本项目只剩 5 个空的会话目录，合计 4 KB），是系统清 `/tmp` 时带走的。
- **迁移怎么跑**：`node scripts/migrate.mjs <file>.sql`，或 Supabase Management API
  （两条路都验证可用，凭证在 `.env.local`）。
- **目录怎么重建**：`npm run dev` 之后 `node scripts/build-catalog.mjs`
  （走我们自己的 API 路由，保证与用户导入同一条流水线）；
  套餐 `node scripts/build-packages.mjs`。
- **不要续这个会话**：transcript 已 6.3 MB。仓库就是为「换会话接手」设计的 ——
  新会话读 CLAUDE.md + INSTRUCTION.md + 本文件即可开工。

## 6. 变更记录

| 日期 | 改了什么 | 谁 |
| ---- | -------- | -- |
| 2026-09-29 | Round 4–7 收尾与交接 | claude-opus-5 |
| 2026-09-30 | §4 清空并指向台账（Hao 已逐条裁决）；§5 临时文件一条作废 | claude-opus-5-5 |
