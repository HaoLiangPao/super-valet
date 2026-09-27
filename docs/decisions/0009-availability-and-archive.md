---
id: 0009
title: 归档而不是删除；可用性状态只提示不执行，永不自动归档
status: proposed
author: claude-opus-5
created: 2026-09-27
updated: 2026-09-27
superseded_by:
related: [ADR-0006, ADR-0007, ADR-0008, design/0005, design/0006, design/0008]
tags: [data-model, availability, archive, trust]
---

# ADR-0009: 归档而不是删除；可用性状态只提示不执行

> status: **proposed** —— 改的是用户数据的生命周期（什么情况下一家店会从
> 视野里消失），请 Hao 复核后转 accepted。

## 背景 / Context

design/0008 §1 点出两件互相拉扯的事实：

1. **餐厅会倒闭。** 推荐一家已经永久关门的店是最伤信任的错误
   （design/0005 §4.2 就是为这句话写的：事实字段只能来自 Places）。
2. **删掉就什么都没了。** 一家吃过十几次的店倒闭后直接删除，会把用户最有价值的
   历史一起抹掉 —— 而那恰恰是 S7「你最爱的餐厅」的原料。

新增的事实：Places (New) 的 `businessStatus` **实测可用**，取值
`OPERATIONAL` / `CLOSED_TEMPORARILY` / `CLOSED_PERMANENTLY`。
它在 Details 与 Text Search 里都是 **Pro 档**字段，而我们两个请求的 FieldMask
本来就已经落在 Enterprise（+ Atmosphere）档，所以**加它不抬高计费档**。

于是问题变成：拿到这个字段之后，谁有权让一家店从用户的视野里消失？

约束：

- `src/lib/engine/**` 与 `src/data/**` 本轮一行不许改（引擎不该知道「归档」这回事）。
- ADR-0008 的向后兼容保证不能破：**没有显式选择记录的用户，池子就是 15 家种子**。
- Google 的停业数据**会滞后**，也会错。这不是假设：一家店装修停业三周被标
  `CLOSED_TEMPORARILY`、开门后一个月才改回来，是常见现象。

## 决策 / Decision

**我们决定：**

1. **餐厅事实增加可用性状态 `businessStatus`**，唯一来源是 Places，未知/缺失
   **一律按 `OPERATIONAL` 处理**。
2. **用户侧增加一个独立的「归档集合」。** 归档的店不参与摇一摇，但仍在目录里、
   仍计入统计、可一键恢复。**归档 ≠ 移除**：移除是从 selection 拿掉，
   归档是「它还在我的世界里，只是去不了了」。
3. **永不自动归档。** 没有任何代码路径可以在用户点击之前写入一条归档记录。
   `businessStatus` 非 OPERATIONAL 时，我们**只提示**，并且必须提供
   「先留着」这个出口。
4. **归档的店仍然计入统计**（S7 的「你最爱的餐厅 / 菜系 / 拒绝理由」）。

## 理由 / Rationale

### 为什么归档 ≠ 移除（两个集合，而不是一个状态位）

摇一摇与统计要的是两个不同的集合：

```
摇一摇 = selection − archived        统计 = selection ∪ archived
```

如果把归档做成 `user_pool_selection` 上的一个 `archived` 布尔列，会出两个问题：

- **破向后兼容。** 老用户的 selection 是**零行**（「从没选过」→ 默认 15 家种子）。
  要给其中一家打 archived 标记，就得先伪造一条 selection 行，那会顺手把用户从
  「从没选过」推进「显式选过」—— 直接违反 ADR-0008 的保证，症状是「池子莫名变小」。
- **归档的对象不止池子里的店。** 目录里 74 家静态店从来不进 `restaurants` 表，
  用户完全可以归档一家从没显式选进池子的店。

所以是两张表并存、谁也不删谁的行。语义干净，向后兼容自动成立。

### 为什么永不自动归档

这是本 ADR 唯一真正重要的一条。两种错的代价**根本不对称**：

| | 用户看到的 | 代价 |
| -- | ---- | ---- |
| 不自动归档，但那家店真的关了 | 摇到一家关门的店 → 骂一句，点「归档」 | 一次糟糕的推荐，**可逆** |
| 自动归档，但 Google 判错了 | 那家吃了十年的店**凭空消失** | 用户不知道发生了什么，也不知道去哪里找回来；**静默的数据丢失** |

第二种是那种「用户永远不会来报 bug，只会安静地不再打开应用」的错误。
而且它会以最坏的形式出现：装修三周的老店被 `CLOSED_TEMPORARILY` 标记，
自动归档之后，用户在应用里再也看不到它，也不会想到「归档列表」这个概念。

再加一条：`businessStatus` 是**我们抓到的一个月前的快照**（30 天 TTL，
design/0005 §4.8）。用一个可能一个月没更新的字段去删用户的东西，说不过去。

**推论（写进代码，有测试锁死）**：显示「永久停业」的店**照样摇得出来**，
直到用户自己确认。看起来违反直觉，但它与上面那张表一致 —— 一次糟糕的推荐是可逆的，
静默删除不是。S5 的刷新报告负责把这件事摆到用户面前，让他点。

### 为什么未知/缺失按 OPERATIONAL

反过来（未知按「可能关门」处理）会把好店藏起来：`businessStatus` 缺失在我们的
数据里是**多数情况** —— 15 家种子和 74 家静态目录全都没有这个字段，
它们是 0004 迁移之前抓的。按「可能关门」处理等于一夜之间清空所有人的池子。

一句话：**宁可推荐一家可能关门的店，也不要因为数据缺失把好店藏起来。**
这个默认值只在一个地方实现（`toBusinessStatus()`），不许在别处再写一遍三元判断。

### 为什么归档的店仍然计入统计

这正是 Hao 要「归档」而不是「删除」的原因（design/0008 §4 的 Open 项）。
一家吃了十年的老店倒闭后，从「你最爱的餐厅」里凭空消失是说不通的 ——
那份历史是真实发生过的，统计是**回顾**，不是**可去清单**。

统计页因此读的是 `poolWithArchived()`（池子 ∪ 归档），并附带
`placeId → 归档记录` 的映射，让界面能给这些条目打「已歇业」标。

### 为什么归档不计进 `filteredOut`

`filteredOut` 的唯一用途是「放宽半径还能看到 N 家」。归档的店放宽半径也不会回来 ——
它要的是「恢复」。把它算进去就是在界面上说谎。归档几家请问 `archiveSize()`。

## 备选 / Options considered

| 选项 | 优点 | 缺点 | 结论 |
| ---- | ---- | ---- | ---- |
| **归档集合独立成表，永不自动写**（本决策） | 语义清晰；向后兼容自动成立；统计完整；误判可逆 | 多一份状态要在两个后端存；用户要点一下 | ✅ |
| `businessStatus != OPERATIONAL` 直接不参与摇一摇 | 零交互，「绝不推荐关门的店」 | 把 Google 的滞后数据变成静默删除；用户无处申诉；未知按什么算都不对 | ❌ 不对称的代价 |
| 给 selection 加 `archived` 布尔列 | 少一张表 | 破 ADR-0008 向后兼容（要伪造 selection 行）；没法归档未选进池子的店 | ❌ |
| 真删除（从 selection 移除 + 删记录） | 最简单 | 抹掉用户最有价值的历史；S7 统计当场失真 | ❌ design/0008 §1 的出发点 |
| 自动归档但给「撤销」 | 省一次点击 | 撤销只在当次会话有效；一周后发现店没了的用户找不到入口 | ❌ |
| 把 `businessStatus` 加进 `Restaurant`（`declare module` 类型增补） | 全项目都能直接读这个字段 | `Restaurant = SeedRestaurant` 住在本轮禁改的 `src/data/**`；从远处增补等于让引擎看见一个它永远不该依赖的字段 | ❌ 改用显式交叉类型 `CatalogRestaurant` |

## 后果 / Consequences

**得到**

- 一家店消失只有一个原因：**用户让它消失**。没有第二条路径。
- 归档 → 恢复是无损往返（selection 不动），有测试逐个 placeId 锁死。
- 统计拿得到完整历史，S7 的「你最爱的餐厅」不会因为倒闭而失真。
- S4/S5 的刷新报告有了确定的落点：`needsAttention` 这一组是**问句**，不是**通知**。
- `businessStatus` 加进两个 FieldMask 花费为零（Pro 档，请求本来就在更高档）。

**付出 / 接受的代价**

- **可能摇到一家已经关门的店。** 这是本决策自愿承担的代价，换的是「绝不静默
  删除用户的店」。缓解只有一条：S5 把它摆到用户面前，让他一次点完。
- 多一份归档状态要在两个后端存、要多一张表、多一组 RLS。
- 归档列表是一个**新的必须有人维护的界面**（S6）。没有它，归档的店就是消失了 ——
  只是换成我们自己造的黑洞。**S6 不做完，S3 的语义就是假的。**
- 未知按 OPERATIONAL，意味着 74 家静态目录在被刷新过一遍之前，
  我们对它们的营业状况**一无所知**，且不会承认这一点。
- `CatalogRestaurant` 这个交叉类型是个妥协：界面从 `localizedPool()` 拿到的仍是
  `Restaurant[]`，读可用性得走 `businessStatusOf()` 而不是 `r.businessStatus`。
  要彻底干净，得动 `catalog/types.ts` 的 `LocalizedPool` 契约（本轮刻意没动）。

**什么情况下应该重新考虑这个决定**

- **`businessStatus` 的准确率被实测证明很高**（比如连续三个月、几十家店、
  `CLOSED_PERMANENTLY` 零误判）：那时可以考虑「永久停业满 90 天且用户从没在
  提示里点过『先留着』→ 自动归档」。**先有数据，再谈自动。**
- 用户开始抱怨「我已经点过归档了为什么还问我」：说明提示的去重/记忆有问题，
  要给 `needsAttention` 加「用户已表态」的记录，而不是改成自动归档。
- 归档列表长到几十家、用户开始要求批量操作：那是 S6 的界面问题，不是本决策的问题。
- 有一天需要「团队共享的池子」：归档就得从 per-user 变成 per-user-per-pool，
  表结构要改。

## 附：数据形状

```
Restaurant（引擎）+ businessStatus?          → CatalogRestaurant（catalog/availability.ts）
ArchiveEntry { placeId, archivedAt, reason }  reason ∈ closed_permanently | closed_temporarily | manual
StoreBackend  loadArchive() / addToArchive() / removeFromArchive()
本地          localStorage  sv.<profileId>.archive.v1
云端          user_archived_restaurants (user_id, place_id, archived_at, reason)
              restaurants.business_status text null
读取入口      archivedEntries() / archivedRestaurants() / poolWithArchived()
```

`reason` 里**没有任何 `auto_*` 取值**，这是刻意的：词表本身就是「永不自动归档」
的证据，check 约束会挡掉任何试图绕过它的写入（已在真库验证）。

## 变更记录

| 日期 | 改了什么 | 谁 |
| ---- | -------- | -- |
| 2026-09-27 | 初稿：可用性状态、归档集合、永不自动归档、归档计入统计 | claude-opus-5 |
