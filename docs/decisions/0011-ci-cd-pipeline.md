---
id: 0011
title: 用「GitHub CI + Vercel 预览 + 预构建生产、Hao 批准后切换」做部署流水线
status: proposed
author: claude-opus-5-5
created: 2026-10-16
updated: 2026-10-16
superseded_by:
related: [ADR-0003, ADR-0007]
tags: [infra, ci, deploy]
---

# ADR-0011: 用「GitHub CI + Vercel 预览 + 预构建生产、Hao 批准后切换」做部署流水线

> status: **proposed** —— 改的是部署形态与 Vercel 项目设置，等 Hao 裁决（台账 Q20）。

## 背景 / Context

Hao 2026-10-16 在 Vercel 面板上看到大量失败的部署。用 CLI 逐个查过（`vercel inspect --logs`），结论：

**9 次失败全是同一个病因，没有第二种错误。**
- Vercel 项目的 **Root Directory 是 `.`（仓库根目录）**，而应用在 `app/web`。
- 于是 GitHub 推送触发的构建在根目录找不到我们的 `tsconfig.json`，Vercel 自己生成了一份
  （日志原文：「We detected TypeScript in your project and created a tsconfig.json file for you」），
  `@/` 路径别名解析不了，满屏 `TS2307 Cannot find module '@/lib/…'`。
- 8 次来自推送 `claude-version`（每次 push 都触发一次），1 次（2026-09-25）来自推送 `main`，
  那次的目标是**生产**。
- 我们一直用 CLI 在 `app/web` 里手动部署，那条路是好的，所以线上从没坏过：
  失败的构建不会顶替正在服务的版本。

查的过程中还看到三件事：

1. **GitHub 上没有任何应用层的 CI。** 唯一的 workflow（`.github/workflows/docs.yml`）只查文档，
   而且只在推 `main` 和开 PR 时跑。我们推的是 `claude-version`，所以 CLAUDE.md 里
   「CI 绿了再提交」的「CI」，至今只是创始人在本机跑命令。
2. **Node 版本不一致**：Vercel 项目是 Node 24.x，本机是 22.6。
3. **`main` 推送会自动部署生产。** `main` 现在落后 `claude-version` 二十多个 commit。
   一旦修好 Root Directory，Hao 往 `main` 推一次，**线上就会退回到几周前的版本**，
   而且绕过了「生产要 Hao 当次批准」—— 虽然推的是 Hao 自己，但他推 `main` 的本意不是发版。

约束：Vercel Hobby（免费）、push 与生产部署每次都要 Hao 批准（CLAUDE.md §授权状态）、
同一个 Vercel 项目上可能还有别的分支在构建（竞赛中我们不看对方分支）。

## 决策 / Decision

**我们决定把部署拆成四段，每段只做一件事：**

```
① push claude-version（Hao 批准）
      │
      ├─▶ ② GitHub Actions CI：lint · test · build · 文档检查（无秘密，约 2 分钟）
      │
      └─▶ ③ Vercel 自动预览部署（每个 push 一个预览 URL）
                │
                ▼   创始人：CI 绿 + 预览上冒烟
      ④a 预构建生产：vercel deploy --prod --skip-domain
         （用生产环境变量构建，但**不切流量**，得到一个待发布 URL）
                │
                ▼   Hao 看过待发布 URL，批准
      ④b 切换：vercel promote <待发布 URL>   （秒级，只换域名指向，不重新构建）
                │
                ▼   创始人：生产冒烟；出问题 vercel rollback（秒级）
```

具体改动：

1. **Vercel Root Directory 改为 `app/web`**（项目设置，Hao 的 Vercel 账号操作或授权创始人用 CLI/API 改）。
   改完后 CLI 部署要从**仓库根目录**发起，`.vercel` 链接随之挪到根目录。
2. **生产分支改成一个没人推的分支名**（如 `production`），`main` 推送从此只产生预览，
   不再碰生产。生产只走 ④a → ④b。
3. **新增 `.github/workflows/ci.yml`**：推 `claude-version` 和开 PR 时跑
   `npm ci → npm run lint → npm test → npm run build`（在 `app/web`，Node 22）。
   `docs.yml` 的触发条件同时加上 `claude-version`。
4. **Node 版本钉成 22.x**：`app/web/package.json` 加 `"engines": { "node": "22.x" }`，
   Vercel、CI、本机三处一致。
5. ship-check skill 的关卡四改写为 ④a/④b，INSTRUCTION.md 链接过去。

## 理由 / Rationale

- **生产发的就是 Hao 看过的那一份。** ④a 构建出来的产物，就是 ④b 切上线的那一份，
  中间不重新构建。现在的做法是 Hao 批准后再 `deploy --prod`，等于批准了一份他没见过的构建。
- **批准变得便宜。** Hao 只需要点开一个 URL 看一眼、回一句「发」。切换是秒级的，回滚也是秒级的
  （`vercel rollback`），所以「发错了」的代价从「再构建一次」降到「一条命令」。
- **CI 是给 Hao 看的证据，不是给创始人的。** 「测试通过」现在只是报告里的一句话；
  有了 GitHub 上的绿勾，Hao 不用相信谁的转述（INSTRUCTION.md §0 第 4 条，换了个方向）。
- **不需要任何秘密进 GitHub。** Supabase 变量缺失时应用自动走游客模式，Places/LLM 的密钥只在
  服务端运行时读，所以构建与测试都不需要凭证 —— CI 里零秘密，不扩大泄露面。
- **`main` 不再是发版按钮。** 把「合并代码」和「发布上线」拆开，是这次 `main` 落后二十多个
  commit 却差点自动上生产的直接教训。

## 备选 / Options considered

| 选项 | 优点 | 缺点 | 结论 |
| ---- | ---- | ---- | ---- |
| **本方案**（CI + 预览 + 预构建、批准后切换） | 发的就是看过的；秒级发布与回滚；`main` 与发版解耦 | 要改两项 Vercel 项目设置；多一个 workflow | ✅ |
| 只修 Root Directory，其余照旧 | 改动最小，面板不再报红 | 仍然没有 CI；Hao 推 `main` 会让生产倒退 | ❌ 只修了症状 |
| 生产分支改成 `claude-version` | 全自动，push 即上线 | push 批准变成了生产批准，两件事被绑死；没有「先看一眼」的机会 | ❌ |
| 关掉 Git 集成，全靠 CLI | 不会再有失败的自动构建 | 失去每个 push 的预览 URL；CI 照样缺 | ❌ |
| 不动项目设置，在我们分支根目录加 `vercel.json` 把构建指到 `app/web` | 不影响其他分支 | Next.js 在非根目录的输出路径是已知的坑，函数识别不稳 | ❌ 不可靠 |
| Vercel Deployment Checks（等 GitHub CI 绿才允许切换） | 机器强制「CI 绿才能发」 | 不确定 Hobby 档是否可用，要先验证 | ⏸ 实施时验证，可用就加 |

## 后果 / Consequences

**得到**
- Vercel 面板不再每次 push 都报红；每个 push 自带预览 URL。
- GitHub 上每个 commit 都有 lint / test / build / 文档的检查结果。
- 生产发布与回滚都是秒级的一条命令；`main` 推送不再碰生产。
- Node 版本三处一致。

**付出 / 接受的代价**
- **Root Directory 是项目级设置**：同一个 Vercel 项目上如果还有别的分支（应用不在 `app/web` 的），
  它们的自动构建会受影响。竞赛规则下创始人不看对方分支，所以这一条**只能由 Hao 判断**。
- 每次发版多一步（④a 预构建），约 1 分钟。
- GitHub Actions 分钟数：每次 push 约 2–3 分钟，私有仓库免费额度每月 2,000 分钟，远用不完。
- CLI 的使用位置从 `app/web` 改到仓库根目录，旧习惯会踩一次坑（写进 ship-check）。

**什么情况下应该重新考虑这个决定**
- 有了第二个协作者或 PR 流程：那时应加分支保护，让 CI 成为合并的硬门槛。
- 升级 Vercel Pro：可以用 Deployment Checks 与更细的环境保护，把「CI 绿才能切换」交给机器。
- 发版频率高到「Hao 每次点开 URL」成了瓶颈：考虑把小改动（纯文档、纯数据）的批准降级。

## 附：`ci.yml` 草案（实施时以此为准，评审通过前不落地）

```yaml
name: ci
on:
  push:
    branches: [claude-version]
  pull_request:
jobs:
  web:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: app/web
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: app/web/package-lock.json
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build   # 不注入任何秘密：缺 Supabase 变量时走游客模式
```

## 变更记录 / Changelog

| 日期 | 改了什么 | 谁 |
| ---- | -------- | -- |
| 2026-10-16 | 初稿：9 次失败部署的病因与四段式流水线 | claude-opus-5-5 |
