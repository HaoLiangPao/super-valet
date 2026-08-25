# Supper Valet 🍽️

> 一个替你决定「今天晚上吃什么」的私人管家。
> A personal valet for the hardest question of the day: *what's for dinner?*

---

## 这个仓库是什么 / What this repo is

Monorepo。设计先行 —— **每一个功能都先有 design doc，再有代码**。

```
docs/            所有设计文档（single source of truth）
├── design/      Design docs / PRD：一个功能一篇
├── decisions/   ADR：架构与选型决策记录
├── research/    调研、竞品分析、用户访谈
└── assets/      图、线框稿、截图
app/             产品代码
scripts/         仓库维护脚本（索引生成等）
```

## 从哪开始 / Start here

| 你想…                     | 去看                                         |
| ------------------------- | -------------------------------------------- |
| 了解全部设计文档          | [`docs/README.md`](docs/README.md) — 自动生成的索引 |
| 知道为什么选了某个技术    | [`docs/decisions/`](docs/decisions/) — ADR    |
| 写一篇新 design doc       | [`docs/design/TEMPLATE.md`](docs/design/TEMPLATE.md) |
| 记一个架构决策            | [`docs/decisions/TEMPLATE.md`](docs/decisions/TEMPLATE.md) |

## 工作流 / Workflow

1. **提出** — 开一个 `design-doc` issue，写清楚要解决什么问题
2. **起草** — 从模板复制一份到 `docs/design/NNNN-slug.md`，`status: draft`
3. **评审** — 开 PR，讨论在 PR 里进行；定了就改 `status: accepted`
4. **实现** — 代码 PR 在描述里链回这篇 doc
5. **回顾** — 设计被推翻时不删除，改 `status: superseded` 并链到新文档

历史是资产。**文档只增不删。**

## 文档索引怎么维护 / Keeping the index fresh

索引由脚本从每篇文档的 frontmatter 生成，CI 会检查它是否过期：

```bash
python3 scripts/gen_docs_index.py         # 重新生成 docs/README.md
python3 scripts/gen_docs_index.py --check # 只检查，过期则失败（CI 用）
```

## 状态约定 / Status vocabulary

| status       | 含义                                     |
| ------------ | ---------------------------------------- |
| `draft`      | 在写，随时会变，别照着实现               |
| `review`     | 已开 PR，等评审意见                      |
| `accepted`   | 定稿，可以照着做                         |
| `implemented`| 代码已上线，doc 描述的是现状             |
| `superseded` | 被更新的文档取代（必须填 `superseded_by`）|
| `rejected`   | 讨论后决定不做（保留理由，避免重复讨论） |
