---
id: 0000
title: <一句话说清这篇文档在设计什么>
status: draft            # draft | review | accepted | implemented | superseded | rejected
author: <github-handle>
created: YYYY-MM-DD
updated: YYYY-MM-DD
superseded_by:           # 仅当 status: superseded
related: []              # 例如 [ADR-0002, design/0003-ranking]
tags: []                 # 例如 [recommendation, onboarding, infra]
---

# <Title>

## 1. 问题 / Problem

现在是什么情况？用户（或我们）具体卡在哪？
**写现象和证据，不要在这里写方案。**

## 2. 目标与非目标 / Goals & Non-goals

**Goals**
- [ ] …

**Non-goals**（明确不做什么，防止范围蔓延）
- …

## 3. 成功长什么样 / Success criteria

怎么判断这个设计成了？尽量可观测：
- 指标：…
- 定性：…

## 4. 方案 / Proposed design

主流程、数据模型、接口、状态变化。图放 `docs/assets/`，在这里引用。

### 用户流程

### 数据模型

### 接口 / 契约

## 5. 备选方案 / Alternatives considered

| 方案 | 优点 | 缺点 | 为什么没选 |
| ---- | ---- | ---- | ---------- |
|      |      |      |            |

> 这一节是这篇文档最值钱的部分。半年后的你会感谢现在写清楚取舍的你。

## 6. 风险与未决问题 / Risks & open questions

- **Risk:** … → **缓解:** …
- **Open:** …（谁来定？什么时候定？）

## 7. 落地计划 / Rollout

分几步？怎么灰度？怎么回滚？

## 8. 变更记录 / Changelog

| 日期 | 改了什么 | 谁 |
| ---- | -------- | -- |
|      |          |    |
