<!-- GENERATED FILE — edit the docs, then run scripts/gen_docs_index.py -->

# 设计文档索引 / Design Docs Index

所有 Supper Valet 的设计文档都登记在这里。新增文档后运行 `python3 scripts/gen_docs_index.py` 重新生成本文件。

## Design Docs

一个功能一篇：问题、方案、取舍。

| # | 标题 | 状态 | 作者 | 更新 |
| --- | --- | --- | --- | --- |
| 0001 | [「今天吃什么」产品企划书 v1.0](design/0001-product-plan.md) | 📝 draft | HaoLiangPao | 2026-09-17 |
| 0002 | [GTA 菜系分类体系与距离模块规格 v1](design/0002-cuisine-taxonomy-and-distance.md) | 📝 draft | HaoLiangPao | 2026-09-17 |
| 0003 | [P0 Web App：Next.js 脚手架 + 两层 Bandit 引擎 + 牌堆 UI（本地优先）](design/0003-p0-web-app.md) | ✅ accepted | claude-fable-5 | 2026-09-17 |
| 0004 | [第二轮：设计保真 UI（Organic + 动效）+ 多 Profile 隔离 + Vercel 就绪](design/0004-fidelity-ui-and-profiles.md) | ✅ accepted | claude-fable-5 | 2026-09-18 |

## Architecture Decisions (ADR)

为什么这么选，以及代价是什么。

| # | 标题 | 状态 | 作者 | 更新 |
| --- | --- | --- | --- | --- |
| 0001 | [用 ADR 记录架构决策](decisions/0001-record-architecture-decisions.md) | ✅ accepted | HaoLiangPao | 2026-08-25 |
| 0002 | [把推荐问题建模为 Multi-Armed Bandit](decisions/0002-model-recommendation-as-bandit.md) | ✅ accepted | HaoLiangPao | 2026-09-17 |
| 0003 | [技术栈：Next.js 15 + Supabase + Drizzle + Vercel（PWA 形态）](decisions/0003-tech-stack.md) | 📝 proposed | HaoLiangPao | 2026-09-17 |
| 0004 | [V1 范围只做晚餐，推荐内核对餐次无感知](decisions/0004-dinner-first-meal-agnostic-core.md) | ✅ accepted | HaoLiangPao | 2026-09-17 |
| 0005 | [两层 Bandit：菜系类别层进 schema，打分用软乘积](decisions/0005-two-layer-bandit-soft-product.md) | ✅ accepted | claude-fable-5 | 2026-09-17 |

## Research & Notes

调研、竞品、访谈、数据探索。

| # | 标题 | 状态 | 作者 | 更新 |
| --- | --- | --- | --- | --- |
| 0001 | [Fable 对产品企划与菜系/距离规格的设计评审](research/0001-fable-design-review.md) | 👀 review | claude-fable-5 | 2026-09-17 |
| 0002 | [sim.py 180 天模拟报告：算法路线、回收率与范围问题的数据裁决](research/0002-sim-180d-report.md) | 👀 review | claude-fable-5 | 2026-09-17 |
| 0003 | [种子轮第一轮收尾报告：P0 Web App 从零到可用](research/0003-p0-build-report.md) | 👀 review | claude-fable-5 | 2026-09-18 |

---

共 12 篇文档 · 索引生成于 2026-09-18 · 由 `scripts/gen_docs_index.py` 维护
