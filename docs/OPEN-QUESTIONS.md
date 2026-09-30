# 待办台账 / Open Questions

> **这是全仓库唯一的待办清单**（Hao 2026-09-30 裁决）。等 Hao 裁决的、等 Hao 动手的、
> 创始人欠着的，全部记在这里。交接笔记、收尾报告、GO-LIVE、ADR 只许**链接**过来，
> 不许另列清单 —— 上一次清单散在五个地方，结果有的过期了没人删，有的挂了十几天没人看见。
>
> 规则：
> 1. 一条办完或拍板后，把结论写进 ADR / design doc，然后**从这里删掉**，在文末留一行去向。
>    本文件是唯一允许「删」的文档 —— 因为结论都沉淀在别处。
> 2. 每轮收尾逐条核对还挂着的是否仍然成立（INSTRUCTION.md §5）。
> 3. 编号只增不复用：`Q` = 产品/技术问题，`H` = 要 Hao 动手，`F` = 创始人待办。
>
> 立场栏：🅗 = Hao 的倾向，🅕 = 创始人的倾向。

最近一次全量核对：**2026-09-30**（对照代码与线上状态逐条核过）。

---

## A. 等 Hao 裁决

### A1 ADR-0003（技术栈）修订稿待复核

原文写的是 Next.js 15 + Drizzle + Claude Haiku + PostGIS + Web Push，与实际建出来的
东西对不上。2026-09-30 已按现实修订（见 [ADR-0003](decisions/0003-tech-stack.md) 的
「2026-09-30 修订」一节），三个争议项也已随 Q3/Q4 的裁决落定。
- 🅕 修订稿读过没问题就转 `accepted`。这是最后一条 `proposed` 的 ADR。

### Q8 `exportAll()` 不含池子选择、位置偏好与导入记录

「导出全部数据」实际导不全：它住在 `src/lib/engine/store.ts`，只导 profile / state /
rolls / feedbacks，而池子选择（selection）、位置偏好、导入的餐厅、归档都是后加的。
导出再导入会丢掉用户辛苦挑的池子。（2026-09-30 复核：仍然成立。）
- 🅕 把 `exportAll` 从 engine 目录挪到 `src/lib/store/`，补齐后加的四类数据。
- 优先级：中 —— 现在没人真的在用导出恢复数据，但「导出」这个承诺是假的。排在 S6 之后。

### Q9 导入的餐厅没有彻底删除的入口

池子页的「移除」只调 `removeFromSelection`，不动导入记录（餐厅事实/菜品/笔记原文）。
`removeImported` 写好了但**零调用点**（2026-09-30 复核）。用户导错一家店之后，
那份数据永远留在存储里，没有任何界面能清掉。
- 🅕 并进 S6：归档列表本来就要有「彻底删除」操作（design/0008 §3 S6），那里就是它的入口。
- 优先级：低。

### Q11 「发现新店」的半径不该跟着池子半径一起「不限」

池子半径默认 `ALL`（design/0006 §4.3 刻意选的：新用户不该因为没设过的筛选看到空池子）。
但 `discoverNearby` 复用了同一个半径，于是手动重扫会**扫遍整个 GTA** ——
2026-09-28 实测一次重扫发现 8 家，其中多家在 16–23 km 外。

两个「不限」语义不同：
- **池子不限** = 「显示我选过的全部」→ 合理。
- **发现不限** = 「去全城找」→ 把 Places 配额烧在引擎几乎不会推荐的店上。
  工作日晚餐 `d0=6`，20 km 的店距离权重 `exp(-20/6)=0.036`，
  2 km 的是 `0.72` —— 相差 20 倍，等于往池子里塞噪音。

- 🅕 发现用**独立上限** `min(池子半径, DISCOVERY_MAX_KM=15)`，
  并在报告里写明「在 15 km 内找到 N 家」。约 3 行改动，可逆。
- 优先级：中 —— 功能可用，但每次重扫都在浪费配额并稀释池子。**创始人建议排在 S6 之前先修。**

### Q12 刷新失败的兜底文案是中文硬编码，英文界面会看到中文

`RefreshFailure.message` 在契约里被定义成「中文短句」。端口层出的失败会查字典
本地化，但流水线自己的兜底句（如「这家店没抓到，下次再试」）是硬编码中文。
- 🅕 给 `RefreshFailure` 加 `code`（同 `ApiError` 的做法），客户端优先按 code 查字典，
  message 退为兜底。要动契约。
- 优先级：中 —— 只在刷新失败时可见，但英文用户一旦碰到就很突兀。

### Q13 归档的店不参与刷新，重开了也不会被发现

一家「临时停业」被归档后就不再刷新，所以它重新营业我们永远不知道。
- 🅕 S6 归档列表上给一个「查一下它重开没有」的按钮，按需刷新单家，
  而不是把归档的店塞回自动刷新（那会让每月配额花在用户已经放弃的店上）。
- 优先级：低 —— 随 S6 一并做。

### Q14 persona 先验幅度要不要加大

三个试玩 persona（中餐控/西餐控/从零开始）前几摇「显灵」不够明显，是概率抽样使然
（research/0004）。
- 🅕 不凭感觉调。等 pilot 用户进来后用多账号做对照，看数据再定。
- 优先级：低 —— 被 pilot 启动卡着。

### Q15 本地分支 `feat/explore-import` 删不删

已完全合入 `claude-version`（停在 `8fa554d`），留着只是噪音。
- 🅕 删（`git branch -d`，已合入的分支删了可以从 commit 恢复）。等 Hao 点头。

---

## B. 等 Hao 动手

### H1 pilot 名单定了之后收口公开注册

**现在故意开着**（Hao 2026-09-30：还在为 pilot 做准备，用户尚未邀请）。
线上实测 `disable_signup = false`。名单固定后说一声，创始人用
Management API `PATCH /v1/projects/<ref>/config/auth` 传 `{"disable_signup": true}` 收口。

### H2 确认线上 6 个账号都是自己人

2026-09-30 线上 `auth.users` 共 6 个。已知的只有 `test+1/2/3@supper-valet.local` 三个，
另外 3 个来历未记录（可能是 Hao 自己注册的，也可能是 QA 走查时建的）。
注册是公开的，pilot 又还没开始，所以值得看一眼：Supabase Dashboard → Authentication → Users。

### H3 「导出 JSON」按钮在真机上点一次

无头浏览器测不了文件下载。请在 iOS Safari 上打开 历史页 → 导出，确认真的下载到了文件。
自 2026-09-18 挂到现在。（导出的内容不全是另一回事，见 Q8。）

### H4 `main` 落后 `claude-version` 14 个 commit

`main` 归 Hao 掌管，合不合、什么时候合由 Hao 定。创始人不碰。

### H5 域名（可选，约 $12/年）

不买也行，`supper-valet.vercel.app` 够 POC 用。详见 [GO-LIVE.md](GO-LIVE.md) §3。

---

## C. 创始人待办

| # | 事 | 备注 |
| - | -- | ---- |
| F1 | **S6 归档列表界面** | 路线图下一步（[design/0008](design/0008-refresh-archive-and-stats.md) §3）。ADR-0009 定了「永不自动归档」，归档的店必须有地方看得到、能恢复。连带 Q9、Q12、Q13 |
| F2 | S7 行为统计页 | S6 之后 |
| F3 | 登录后首拉偶发 401 `JWT issued at future` | 重试内自愈、用户无感，但生产也复现过。方案：登录成功后首拉前加 300ms 缓冲，或提高重试预算（research/0004） |
| F4 | 新建 Profile 空名字没有行内提示 | 小 UX（research/0004） |
| F5 | 核实晚餐池是否仍然零西餐店 | research/0004 时种子 15 家里唯一的西餐店只做午市。目录涨到 74 家、有了套餐之后可能已经不成立，没人回头核过 |
| F6 | 删掉没用的依赖 `@anthropic-ai/sdk` | `app/web/package.json` 里还装着，但 `src/` 零引用 —— LLM 早改成直接 fetch OpenRouter 了（ADR-0007） |

---

## 已拍板并移除

| 题 | 结论 | 去向 | 日期 |
| -- | ---- | ---- | ---- |
| Q1 | 两层 Bandit、软乘积 | [ADR-0005](decisions/0005-two-layer-bandit-soft-product.md) | 2026-09-17 |
| Q7 | 晚餐优先、内核不分餐段 | [ADR-0004](decisions/0004-dinner-first-meal-agnostic-core.md) | 2026-09-17 |
| Q2 | 位置双轨制：锚点为主、GPS 可选 | [ADR-0008](decisions/0008-catalog-pool-and-runtime-distance.md) §3 | 2026-09-30 |
| Q3 | 不上 PostGIS，应用层算距离 | [ADR-0003](decisions/0003-tech-stack.md) 修订、[design/0002](design/0002-cuisine-taxonomy-and-distance.md) 裁决记录 | 2026-09-30 |
| Q4 | 不做推送，反馈靠下次打开时补问；推送等真实使用数据再另开新题 | [ADR-0003](decisions/0003-tech-stack.md) 修订、[design/0001](design/0001-product-plan.md) 裁决记录 | 2026-09-30 |
| Q5 | 冷启动靠先验继承，不做配对问卷 | [design/0002](design/0002-cuisine-taxonomy-and-distance.md) 裁决记录 | 2026-09-30 |
| Q6 | 摇一摇是核心交互 | [design/0001](design/0001-product-plan.md) 裁决记录 | 2026-09-30 |
| Q10 | 不自动改老用户的池子，改用池子引导（S2 已上线） | [design/0008](design/0008-refresh-archive-and-stats.md) §3 S2 | 2026-09-30 |
| — | 0002–0005 迁移是否已在线上执行 | 已执行：线上 19 张表/视图齐全，见 [GO-LIVE.md](GO-LIVE.md) §4 | 2026-09-30 |
| — | 旧会话 1.3 GB 临时文件 | 系统已自动清掉，见 [research/0005](research/0005-handover.md) §5 | 2026-09-30 |
