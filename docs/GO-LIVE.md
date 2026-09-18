# 上线采购清单 / Go-live checklist

> 给 Hao：按顺序办，办完哪项在方框里打勾。金额都按最省的算。

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
- [ ] **还差两样（二选一即可开工账号轮）**：
  - **推荐**：什么都不用给我 —— 到时我把建表 SQL 写好放进仓库
    （`supabase/migrations/`），你在 Supabase Dashboard → SQL Editor
    里粘贴运行一次即可，数据库密码不经过任何对话。
  - 或者：把数据库密码填进 `app/web/.env.local` 的 `SUPABASE_DB_URL`
    （文件不进仓库），我可以直接跑迁移。
  另：`SUPABASE_SECRET_KEY`（Dashboard → API Keys → secret）目前**不需要**，
  等做服务端任务（定时推送等）再说。

## 3. 可选

- [ ] 域名（约 $12/年）。不买也行，`supper-valet.vercel.app` 这类免费子域够 POC。

## 4. 明确不用买

- Google Places API —— 本轮餐厅池是静态种子数据。
- Claude API —— 菜品抽取还没排上。
- Vercel Pro / Supabase Pro —— 试玩规模离付费线很远。
