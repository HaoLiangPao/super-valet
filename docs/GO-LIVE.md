# 上线采购清单 / Go-live checklist

> 给 Hao：按顺序办，办完哪项在方框里打勾。金额都按最省的算。

## 1. 必须 —— 本轮上线（总花费 $0）

- [ ] **Vercel 账号**（Hobby 免费档，够用）：https://vercel.com/signup 用 GitHub 登录即可。
- [ ] **给我部署凭证**，二选一：
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

- [ ] **Supabase 项目**（Free 档）：https://supabase.com → New project（区域选
  us-east 即可）。建好后把三样东西写进 `app/web/.env.local`（同样不进仓库）：
  ```
  NEXT_PUBLIC_SUPABASE_URL=...        # Project Settings → API → Project URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # 同页 anon public key
  SUPABASE_SERVICE_ROLE_KEY=...       # 同页 service_role（保密）
  ```
  这一步做完，跨设备登录、同一账号多端同步、以及「我能直接看到全部试玩
  数据」才成立。数据库表结构已设计好（design/0001 §6），到时我来迁移。

## 3. 可选

- [ ] 域名（约 $12/年）。不买也行，`supper-valet.vercel.app` 这类免费子域够 POC。

## 4. 明确不用买

- Google Places API —— 本轮餐厅池是静态种子数据。
- Claude API —— 菜品抽取还没排上。
- Vercel Pro / Supabase Pro —— 试玩规模离付费线很远。
