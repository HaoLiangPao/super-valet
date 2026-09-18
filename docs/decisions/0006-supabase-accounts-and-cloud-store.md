---
id: 0006
title: 试玩账号用 Supabase 邮箱密码登录，云端数据按 RLS 硬隔离，游客模式原样保留
status: proposed
author: claude-opus-5
created: 2026-09-18
updated: 2026-09-18
superseded_by:
related: [design/0001, design/0004, ADR-0003, ADR-0005]
tags: [auth, schema, rls, supabase, storage]
---

# ADR-0006: 试玩账号与云端数据架构

## 背景 / Context

design/0004 把「跨设备真实账号 / Supabase」列为下一轮，理由是凭证未就绪。
凭证已于 2026-09-18 到位，本轮要把已上线的本地 Profile 版升级为真实账号：

- 试玩用户拿 Hao 线下分发的 email + 密码登录，**不能依赖邮件送达**
  （假域邮箱收不到信，试玩用户也不该被一封确认信卡住）。
- 试玩数据必须按账号隔离到「绝不互相污染」，同时 Hao 与创始人要能在
  Supabase 里直接查全部数据做分析（rolls 含 candidates_snapshot、feedbacks、口味后验）。
- **未登录必须原样保留现有本地 Profile 模式**：生产站已经在跑，行为不许退化。

硬约束：引擎内核（scoring/posterior/engine/openHours/random/cuisine/types）不动，
`store.ts` 的 8 个函数签名不动 —— 而它们**全是同步的**，Supabase 全是异步的。

## 决策 / Decision

**我们决定：用 Supabase 邮箱密码认证 + 关闭邮箱确认 + 按层 normalize 的
五张 RLS 表；在 `store.ts` 之下加一层存储后端抽象，登录时把该账号数据
一次性拉进内存，读同步、写 write-through 落库；本地与云端两套数据永不互相迁移。**

拆成五条：

### 1. 认证：email + 密码，`mailer_autoconfirm = true`

通过 Management API 打开项目的 `mailer_autoconfirm`，注册即确认，
不发信也不等信。试玩期保留应用内注册入口（交付要求），
**收口开关**是 `disable_signup`：等试玩名单固定，一条 PATCH 就关掉公开注册。

会话由 supabase-js 自己存 localStorage 并续期；不引 `@supabase/ssr`、
不做服务端取数 —— 全站是 client component + 静态导出，加一层 SSR
只会把 Vercel 上的静态站变成动态站，没有收益。

### 2. Schema：按「层」normalize，不存 JSON blob

`supabase/migrations/0001_init.sql`，五张表：

| 表 | 对应运行时形状 | 说明 |
| -- | -------------- | ---- |
| `profiles` | — | 随 `auth.users` 触发器自动建档；记 persona_key / onboarded_at / email |
| `user_restaurants` | `EngineState.stores` + `lastEatenDay` + `baseWeight` + `paused` | 键都是 placeId，四个 map 合并成一行 |
| `user_cuisine_categories` | `EngineState.categories` + `catLastEatenDay` | ADR-0005 要求的类别层，原样落地 |
| `rolls` | `RollRecord` | `candidates_snapshot jsonb` 原样保留 |
| `feedbacks` | `FeedbackRecord` | 主键 `(user_id, roll_id)`，外键指回 rolls |

设计取舍：

- **不存 JSON blob。** 一份 `engine_state jsonb` 实现起来最省，但中央可见性
  （「日料控这半个月 AS_JAPANESE 学成什么样」）就只能靠 jsonb 路径表达式硬拧。
  ADR-0005 早就写明类别层要进 schema，这里兑现。
- `alpha/beta` 可为 null = 「还没学过」，引擎用 `storePrior(r)` / `CAT_PRIOR` 兜底。
  不在 DB 里编造默认值，避免 DB 与 `scoring.ts` 各有一套先验、日后对不上。
- `rolls` 主键是 `(user_id, id)` 而不是单独的 `id`：客户端生成的 base36 短 id
  在不同账号之间撞车也互不影响，且不必改 `newId()`。
- 一次 roll 最多一条 feedback（主键约束），与应用「补问队列 = 没有反馈的历史 roll」
  的语义一致，重复提交自动幂等。
- `admin_roll_feed` 视图给中央查询用，**`security_invoker = on`**，
  绝不让视图成为绕过 RLS 的后门；Dashboard 用 service_role 查照样看得到全部。

### 3. RLS：五张表全开，策略一律 `auth.uid() = user_id`

四种操作（select/insert/update/delete）各一条，`to authenticated`，
insert/update 都带 `with check` —— 所以既读不到别人的行，也写不进别人名下。
另外对 `anon` 角色**收回全部表级权限**：RLS 已经能挡住匿名读，
再砍一刀是为了将来万一有人加错一条宽松 policy 也漏不出去。

### 4. 存储适配层：读同步、写 write-through

```
engine/store.ts（8 个同步函数，签名不变）
        └── store/backend.ts   StoreBackend 接口 + localBackend（游客模式，逐字节照搬）
                 └── cloud/store.ts  CloudStore：内存快照 + 串行写队列
                          └── cloud/gateway.ts  CloudGateway 端口 → supabase-js
```

- 登录时 `openCloudStore()` 一次性拉全量（5 个查询并发）装进内存快照；
- 读走内存并返回**副本**（调用方 `structuredClone` 后随便改，污染不到缓存）；
- 写先改内存（UI 立即正确），再进**串行**队列落库。串行是刻意的：
  rolls 必须先于 feedbacks 落库（外键），并发 upsert 会打散这个顺序。
- `saveState(整份 state)` 做行级差分，只推真正变了的行；
- 写失败自动重试一次；仍失败则记错、进补推队列、并把对应行重新标记为脏
  （两道保险），用户继续摇不受影响，网络恢复后下一次写顺带补齐。

`CloudGateway` 这个端口存在的唯一理由是可测：单测塞假实现就能覆盖
差分 / 队列 / 重试 / 断网，不打真网、不 mock supabase-js 的链式 builder。

### 5. 本地与云端：**不迁移、不合并、互不覆盖**

登录**不会**把本机 Profile 的数据搬到云端；登出后本机数据原封不动还在。

## 理由 / Rationale

- **为什么关邮箱确认而不是绕过**：凭证线下分发，假域邮箱根本收不到信；
  项目级 autoconfirm 是 Supabase 官方开关，比「用 service_role 脚本逐个确认用户」
  少一个需要长期保管的服务端密钥，也少一个能伪造任意身份的攻击面。
- **为什么读能同步**：一个试玩账号的全部数据是几十 KB 量级（15 家店的池子、
  一天一摇）。一次性拉进内存，比把 8 个函数改成 async、连带重写引擎和三个页面，
  代价小一个数量级 —— 而后者是约束明确禁止的。
- **为什么不迁移本地数据**：
  1. 数据溯源会变脏 —— 本地 roll 的 `candidates_snapshot` 是按本地 persona
     先验算出来的，混进云端账号后，离线回放分不清哪条属于哪套先验；
  2. 同一台机器上三个 persona Profile 是**对照组**，合并进某一个账号就毁了对照；
  3. 「登录会不会覆盖我云端的数据」是不可逆的疑虑，不迁移就没有这个问题。
  代价是换设备登录看不到本机游客数据 —— 试玩期可接受，真要迁再做一次性
  「导入本机数据」的显式动作（可逆、用户主动触发），比隐式合并安全得多。

## 备选 / Options considered

| 选项 | 优点 | 缺点 | 结论 |
| ---- | ---- | ---- | ---- |
| Magic link / OTP 登录 | 不用管密码 | 依赖邮件送达，假域邮箱直接死 | ❌ |
| service_role 脚本逐个确认用户 | 不改项目配置 | 多一个万能密钥要保管，攻击面更大 | ❌ |
| `engine_state jsonb` 单表 | 实现最省 | 中央可见性差，违背 ADR-0005 | ❌ |
| 把 store 的 8 个函数改成 async | 语义最直白 | 要动引擎与全部页面，约束明令禁止 | ❌ |
| 内存快照 + write-through（本决策） | 签名不变、读零延迟、离线也能摇 | 多一份内存状态；写失败要自己兜 | ✅ |
| 登录时合并本地数据 | 用户「数据不丢」的直觉 | 溯源脏、毁对照组、不可逆 | ❌ |
| 仅在服务端用 service_role 写 | 客户端拿不到数据 | 要建一整层 API，且 RLS 形同虚设 | ❌ |

## 后果 / Consequences

**得到**

- 账号隔离由数据库保证，不靠前端自觉：实测 B 的 JWT 定向查 A 的 user_id 回 0 行，
  PATCH/DELETE 影响 0 行，匿名 key 直接 401。
- 中央可见性：`admin_roll_feed` 一条 select 看全部试玩流水；后验按层可查可聚合。
- 游客模式零退化，登录/登出只是换了一个 `StoreBackend`。
- 引擎与页面一行没改（`store.ts` 只剩转发）。

**付出 / 接受的代价**

- 内存快照与云端之间存在一个写窗口：标签页在队列落库前被杀，最后一次写会丢。
  试玩期可接受（每次写 < 100ms）；真要收口就在 `visibilitychange` 里 `flush()`。
- 试玩期公开注册是开的，任何人拿到站点就能注册。数据是假的、风险有限，
  名单固定后用 `disable_signup` 收口。
- 跨设备登录看不到本机游客数据（见上面「不迁移」的理由）。
- 多一层抽象：新增数据类型要同时改 `StoreBackend`、`CloudGateway` 和迁移 SQL。

**什么情况下应该重新考虑这个决定**

- 单账号数据量涨到「一次性全量拉取」明显拖慢首屏（大致 > 几 MB，
  按现在一天一摇的节奏要好几年）。
- 出现多人共享一个口味档案（家庭/情侣）的需求 —— 那时 RLS 要从
  `auth.uid() = user_id` 换成成员表 join，schema 要动。
- 需要服务端定时任务（推送、月度衰减）改写用户数据 —— 那时要引入
  service_role + Vercel Cron，权限模型要重看一遍。

## 落地状态 / Status of rollout

- 迁移已在项目 `fgulhrxeskssrjigrxai` 执行成功；RLS 与匿名拒绝已实测。
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  已配到 Vercel 的 production / preview / development。
- 试玩账号：`test+1@supper-valet.local`（中餐控）、`test+2@…`（西餐控）、
  `test+3@…`（从零开始）为本轮验证账号，可随时删。
- **未 commit、未部署生产**，等创始人验收 + QA 复检后统一做。

## 变更记录 / Changelog

| 日期 | 改了什么 | 谁 |
| ---- | -------- | -- |
| 2026-09-18 | 初稿：认证方式、schema、RLS、存储适配层、不迁移本地数据 | claude-opus-5 |
