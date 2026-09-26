---
name: design-doc
description: 新建或更新 Supper Valet 的设计文档 / ADR / 研究报告 —— 选目录、取编号、填 frontmatter、重建索引、跑 CI。当需要写 design doc、记录架构决策（ADR）、写轮次收尾报告、或修改已有文档状态（accepted / superseded）时使用。
---

# 写一篇 Supper Valet 的文档

文档是本项目的交付单位（`AGENTS.md` §设计文档纪律）。本 skill 只管机械步骤，
**内容判断归创始人**。

## 一、选目录

| 要写的东西 | 目录 | 模板 | 起始 status |
| ---------- | ---- | ---- | ----------- |
| 一个功能/模块的设计：问题、方案、取舍 | `docs/design/` | `docs/design/TEMPLATE.md` | `draft` |
| 一个架构/选型**决策**及其代价 | `docs/decisions/` | `docs/decisions/TEMPLATE.md` | `proposed` |
| 评审、模拟、调研、轮次收尾报告 | `docs/research/` | 无模板，仿 `research/0003` | `review` |

拿不准就问：**这是「我们要做什么」（design）、「我们为什么这么选」（decisions），
还是「我们查到了什么」（research）？**

## 二、取编号

编号在**每个目录内**各自递增、四位、不跨目录复用：

```bash
ls docs/design docs/decisions docs/research
```

文件名 `NNNN-kebab-case-slug.md`，slug 用英文。

## 三、填 frontmatter（CI 会逐项校验）

必填：`id` `title` `status` `author` `created` `updated`，日期格式 `YYYY-MM-DD`。

```yaml
---
id: 0007                      # 与文件名前缀一致，目录内唯一
title: 一句话说清这篇在讲什么   # ADR 用祈使句：「用 X 做 Y」
status: proposed              # 合法值见下
author: Codex-opus-5         # 实际执笔者
created: 2026-09-18
updated: 2026-09-18
superseded_by:                # 仅当 status 是 superseded / deprecated，必填
related: [design/0003, ADR-0005]
tags: [infra]
---
```

合法 status：`draft` `proposed` `review` `accepted` `implemented`
`superseded` `deprecated` `rejected`。

**两条硬规矩：**

- 改动既有文档时**同时更新 `updated`**，并在文末 Changelog 加一行。
- **创始人不得自行把新决策转成 `accepted`** —— 那是 Hao 的裁决权
  （`AGENTS.md` §授权状态）。写 `proposed`，列进跟进清单。

## 四、内容要求（别写成流水账）

- design doc：**非目标**和**备选方案表**是最值钱的两节，半年后全靠它们。
- ADR：必须写「**付出的代价**」和「**什么情况下该重新考虑这个决定**」。
- research 报告：先给结论，再给证据；末尾附**按优先级排序的跟进清单**。

## 五、收尾（必须跑，否则 CI 红）

```bash
python3 scripts/gen_docs_index.py      # 重新生成 docs/README.md
python3 scripts/check_frontmatter.py   # 校验 frontmatter
```

`docs/README.md` 是**生成物，不要手改**。两条命令都绿了再 commit。

## 六、作废一篇文档

不删除、不改写历史。把旧文档改成：

```yaml
status: superseded
superseded_by: design/0009-new-approach.md
updated: <今天>
```

然后在新文档的 `related` 里回链，并在旧文 Changelog 记一行原因。
