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

最近一次全量核对：**2026-09-30**（对照代码与线上状态逐条核过）；2026-10-01 增补 Q16、Q17，关闭 Q11、Q16①、Q17。

---

## A. 等 Hao 裁决

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

### Q16 ADR-0010 待复核：餐厅事实归服务端，按店全局刷新

Hao 2026-10-01 在对话中同意了四点（共享事实表、服务端两档频率定时刷新、发现结果共享缓存、
用户「到了发现关门」作为信号）。已写成 [ADR-0010](decisions/0010-server-owned-place-facts.md)，
`proposed`。创始人在第 4 点里补了一条细则，请复核：**用户报告关门而 Places 说营业中时，
只引导这个用户归档，不改共享表** —— 一个人的报告不能替所有人下结论。
- 复核通过后转 `accepted`；实现排在 S6 之后（见 C. F7）。

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
| F7 | 实现 [ADR-0010](decisions/0010-server-owned-place-facts.md) | S6 之后、pilot 扩大之前；含一次改写已有数据的迁移，上线前要 Hao 当次批准。Q13 并入其中 |

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
| A1 | ADR-0003 修订稿复核通过 | [ADR-0003](decisions/0003-tech-stack.md) 转 `accepted` | 2026-10-01 |
| — | 店名用哪种语言：Google 有中文名就用，没有就保留英文 | 现行做法本来就是这样，实测结果见 [design/0007](design/0007-i18n.md) 裁决记录 | 2026-10-01 |
| Q11 | 发现新店半径封顶 15 km，Text Search 带坐标、Details 之前按距离过滤 | [design/0009](design/0009-refresh-radar-and-travel-time.md) §6.1 | 2026-10-01 |
| Q16① | 刷新改用窄 mask（去掉 dineIn / editorialSummary / reviews），降到 Enterprise 档 | [design/0009](design/0009-refresh-radar-and-travel-time.md) §6.1 | 2026-10-01 |
| Q17 | 语言切换并入右上角头像的「我的」面板，设置页去掉语言段 | [design/0007](design/0007-i18n.md) §6 | 2026-10-01 |
| — | 0002–0005 迁移是否已在线上执行 | 已执行：线上 19 张表/视图齐全，见 [GO-LIVE.md](GO-LIVE.md) §4 | 2026-09-30 |
| — | 旧会话 1.3 GB 临时文件 | 系统已自动清掉，见 [research/0005](research/0005-handover.md) §5 | 2026-09-30 |
