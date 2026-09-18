---
id: 0005
title: 两层 Bandit：菜系类别层进 schema，打分用软乘积
status: accepted
author: claude-fable-5
created: 2026-09-17
updated: 2026-09-17
superseded_by:
related: [ADR-0002, design/0002, research/0001, research/0002]
tags: [algorithm, bandit, schema]
---

# ADR-0005: 两层 Bandit —— 菜系类别层进 schema，打分用软乘积

## 背景 / Context

样本预算决定单店级后验在人类时间尺度内近似不收敛（research/0001 §1）；
类别层（12 个 category）是唯一每月能摊到 2–5 个样本、真正能学习的层。
模拟裁决：软乘积在全部 6 个场景 ≥ 单店 TS，菜系可迁移性弱（σ=0.25）时
依然成立（research/0002 发现 2）。Hao 于 2026-09-17 批准（原 OPEN-QUESTIONS Q1）。

## 决策 / Decision

**我们决定采用两层 Bandit：**

1. schema 增加 `user_cuisine_categories(user_id, category, alpha, beta)`，
   与 `user_restaurants` 平行；category 用 design/0002 §7 的 12 类中间层。
2. 打分用**软乘积**，不做硬两阶段采样：

   ```
   final_i = θ_store,i × θ_cat(i)^γ × freshness_i × cuisine_penalty_i × distanceWeight_i
   θ ~ Beta 后验采样；γ = 0.5（默认）
   ```

3. 先验：单店 `Beta(2, 1)`（乐观）；类别 `Beta(1, 1)`。吃后评分同时更新
   两层；skip 原因按 design/0002 §5.3 的映射分流（`wrong_cuisine` 只更新
   类别层，`recently_ate`/`too_far` 不更新任何后验）。

## 理由 / Rationale

- 学习真正发生在类别层；单店层长期近似先验，作用是店间的有原则随机化。
- 软乘积对「类别只有 1–2 家店」的小池子稳健，硬两阶段会放大方差。
- γ 是唯一新增超参，可由 sim 重校准，风险可控。

## 备选 / Options considered

| 选项 | 优点 | 缺点 | 结论 |
| ---- | ---- | ---- | ---- |
| 仅单店 TS | 简单 | 样本预算下不收敛，类别信息浪费 | ❌ |
| 硬两阶段（先抽菜系再抽店） | 直觉清晰 | 小类别方差爆炸，难调试 | ❌ |
| 软乘积（本决策） | 全场景不劣、常更优 | 多一个 γ 超参 | ✅ |

## 后果 / Consequences

**得到**
- schema 从第一天就能承接类别级学习，无需日后迁移。

**付出 / 接受的代价**
- `rolls.candidates_snapshot` 必须同时记录两层 θ，快照略大。
- γ=0.5 是模拟值，池子扩到 30–40 家后需用 sim 重校。

**什么情况下应该重新考虑这个决定**
- 多用户化（出现协同信号，层级结构可能改变）。
- 真实数据显示类别内口味方差远大于模拟假设（σ_store ≫ 0.25）。
