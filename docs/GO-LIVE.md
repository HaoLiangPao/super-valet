# 上线采购清单 / Go-live checklist

> 给 Hao：按顺序办，办完哪项在方框里打勾。金额都按最省的算。

## 🟢 已上线（2026-09-18）

**生产地址：https://supper-valet.vercel.app** （Vercel 项目 `supper-valet`，
Hobby 档；`*-projects.vercel.app` 长链接受 Vercel Authentication 保护返回 302
属正常，对外分享主域即可。）

## 1. 必须 —— 本轮上线（总花费 $0）

- [x] **Vercel 账号**（Hobby 免费档，够用）：https://vercel.com/signup 用 GitHub 登录即可。
      ✅ 2026-09-18 已办，`vercel whoami` = haoliangpao。
- [x] **给我部署凭证**，二选一：（已用方式 A `npx vercel login`）
  - **A（推荐，最安全）**：在这台机器上跑一次
    ```bash
    cd app/web && npx vercel login
    ```
    浏览器里确认后，凭证存在本机 `~/.vercel`，之后我就能自己
    `npx vercel deploy --prod`，你不用把 token 发给任何人。
  - **B**：vercel.com → Account Settings → Tokens → Create，
    把 token 写进 `app/web/.env.deploy.local`（内容一行：`VERCEL_TOKEN=xxxx`）。
    该文件已被 `.gitignore` 覆盖，不会进仓库。

上线形态说明：本轮应用是**纯静态 + 浏览器本地存储**，部署即可用；
每个试玩用户用自己手机打开网址，数据天然互不干扰；同一台设备上再用
**Profile 选人页**（西餐控 / 日料控 / 中餐控 / 自建）做 persona 对照测试。

## 2. 下一轮 —— 真实账号 + 中央数据收集（总花费 $0）

- [x] **Supabase 项目**：✅ 2026-09-18 已建（fgulhrxeskssrjigrxai），
  Project URL + publishable key 已入 `app/web/.env.local`。
- [x] **数据库密码 + full access token**：✅ 2026-09-18 Hao 已填入
  `app/web/.env.local`（已规整为 `SUPABASE_DB_URL` / `SUPABASE_DB_PASSWORD` /
  `SUPABASE_ACCESS_TOKEN`，文件不进仓库）。账号轮已解除全部阻塞。
  ⚠️ full access token 权限很大，只留在本机 env 文件里，不要贴进任何对话/工单。
- [x] **账号轮已实现**（2026-09-18，ADR-0006）：邮箱密码登录（项目已开
  `mailer_autoconfirm`，不依赖邮件送达）、`supabase/migrations/0001_init.sql`
  已在项目上执行、五张表 RLS 全开并实测、`NEXT_PUBLIC_*` 两个值已配进 Vercel
  三个环境。待创始人验收 + QA 复检后 commit 与部署。
  - 试玩名单固定后记得收口公开注册：Management API `PATCH /v1/projects/<ref>/config/auth`
    传 `{"disable_signup": true}`。

## 3. 可选

- [ ] 域名（约 $12/年）。不买也行，`supper-valet.vercel.app` 这类免费子域够 POC。

## 4. EXPLORE 导入轮（2026-09-25）

- [x] **Google Places API key**：✅ Hao 已提供，实测可用（Text Search
      每月 5,000 次免费额度足够我们的量级）。
- [x] **OpenRouter API key**：✅ Hao 已提供，用 `deepseek/deepseek-chat`，
      实测一次笔记抽取约 0.02 美分。
- [ ] **⚠️ 待你做：在 Supabase SQL Editor 里跑一次建表 SQL**
      —— 复制 `supabase/migrations/0002_explore_import.sql` 全文，
      粘进 Dashboard → SQL Editor → Run。**登录态的导入功能在这之前用不了**
      （游客模式不受影响）。
      原因：`SUPABASE_ACCESS_TOKEN` 现在返回 401（可能已过期），
      而直连 Postgres 的 `db.<ref>.supabase.co` 只有 IPv6，这台机器没有 IPv6 路由。
      要让我以后能自己跑迁移，二选一：① 给一个新的 access token；
      ② 在 Dashboard → Settings → Database 里找到 **Connection pooler** 的
      连接串（形如 `postgres.<ref>@aws-N-<region>.pooler.supabase.com:5432`）
      填进 `.env.local` 的 `SUPABASE_DB_URL`。之后 `node scripts/migrate.mjs <file>.sql` 即可。

## 5. 明确不用买

- Claude API —— LLM 已改用 OpenRouter 上的 DeepSeek。
- Vercel Pro / Supabase Pro —— 试玩规模离付费线很远。
