---
name: ship-check
description: Supper Valet 的验收与上线关卡 —— 验收子代理交付、跑全套检查、commit、部署到 Vercel 生产并冒烟。当要验收一个 Unit、合入子代理的产出、或把新版本部署上线时使用。
---

# 验收与上线关卡

**原则：子代理说它跑过了不算数，创始人自己跑过才算数。**
历史上每次质量事故都源于跳过本清单。

## 关卡一：创始人验收（不可外包）

依次执行，任何一条不过就打回，不要「小问题先合入」：

```bash
cd app/web
npm test          # 1. 全绿，且总数不少于上一轮（当前基线 55）
npm run build     # 2. 零错误；ESLint 在 build 内执行
```

```bash
cd /home/hao/Desktop/github/supper-valet
git diff --stat HEAD -- app/web/src/lib/engine/   # 3. 禁改目录必须为空（除非 spec 明确允许）
git status --short                                # 4. 改动范围与报告一致，无意外文件
python3 scripts/gen_docs_index.py && python3 scripts/check_frontmatter.py   # 5. 文档 CI
```

6. **亲手走关键路径**：起 dev server，用 Playwright 点完整条主流程，
   截图存 `docs/assets/`，确认 console **零 error**。
   小贴士：牌堆区域有动效，元素「not stable」点不中时改用 Tab + Enter。
7. **逐条处理报告里的「自主决定」**：接受 / 要求改 / 记入跟进清单。三选一，不许略过。

验收的本质是**找它没说的东西**。报告说「隔离没问题」，你要验的是
「B 冒名改 A 的数据是否 0 行生效」。

## 关卡二：提交

```bash
git add -A && git commit -m "..."   # 一个 Unit 一个 commit，CI 绿了才提交
```

commit message 用英文，正文写清：**为什么做 / 谁实现 / 谁验收 / 验收证据**。
`git push` 需要 Hao 当次确认，不要自行推送。

## 关卡三：QA 独立复检（涉及上线时必做）

派一个独立 Sonnet QA，**只验证不修改**，要求产出分级缺陷（阻塞/严重/一般/建议）
与明确的 **Go / No-Go**。QA 的 spec 必须包含：

- 回归项（上一版已上线的功能，任何退化算严重缺陷）
- 本次新增功能的完整流程
- 移动视口 390×844（无横向滚动）
- console 卫生
- 用完 `browser_close` 释放浏览器，测完停掉 dev server

## 关卡四：部署（需 Hao 当次确认）

```bash
cd app/web && npx vercel deploy --prod --yes
curl -s -o /dev/null -w "%{http_code}\n" https://supper-valet.vercel.app
```

- 对外只发**主域** `supper-valet.vercel.app`；
  `*-haoliangpaos-projects.vercel.app` 长链接受部署保护返回 302，属正常。
- 新增 `NEXT_PUBLIC_*` 环境变量要先配进 Vercel：
  `npx vercel env add NAME production`（值走 stdin，**不要回显**）。

## 关卡五：上线后冒烟（创始人亲自做）

生产站上真实走一遍：游客模式主流程 + 登录一个测试账号
（`test+1@supper-valet.local`）+ 检查 console。
**这一步抓到过 QA 环境测不出的问题**，不要因为 QA 说 Go 就省略。

## 关卡六：收尾

按 `INSTRUCTION.md` §5 写 research 收尾报告 + 状态卫生检查 + 给 Hao 的汇报
（先结论、后细节、跟进项写清「需要你做什么」）。
