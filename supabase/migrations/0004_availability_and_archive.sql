-- =====================================================================
-- Supper Valet · 0004_availability_and_archive
-- 可用性状态与归档集合的数据底座（design/0008 S3、ADR-0009）。
--
-- 两件事：
--   1. restaurants.business_status —— Places 的 `businessStatus`（可空事实列）。
--   2. user_archived_restaurants  —— 用户确认「去不了了」的店。
--
-- 为什么归档是**另一张表**，而不是给 user_pool_selection 加个 archived 布尔列：
--   归档 ≠ 移除。移除是从 selection 拿掉，归档是「它还在我的世界里，只是去不了了」。
--   加布尔列的话，「归档一家从没显式选进池子的店」（老用户池子还是默认 15 家种子，
--   selection 里压根没有行）就得先伪造一条 selection 行 —— 那会顺手把用户从
--   「从没选过」推进「显式选过」，直接破掉 ADR-0008 的向后兼容保证。
--   两张表并存，谁也不删谁的行，语义才干净：
--     摇一摇 = selection − archived      统计 = selection ∪ archived
--
-- 原则沿用 0001/0002/0003：业务表第一列 user_id，RLS 一律 auth.uid() = user_id，
-- 并从 anon 收回全部权限。
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. restaurants.business_status —— 共享事实表加一列
--
-- **可空**是刻意的：0004 之前建的行、以及 Places 压根没给这个字段的店都是
-- null。运行时一律按 'OPERATIONAL' 处理（ADR-0009：宁可推荐一家可能关门的店，
-- 也不要因为数据缺失把好店藏起来）。不写 default 'OPERATIONAL'，因为
-- 「Places 说它开着」和「我们没问过」在排查数据时是两件不同的事。
-- ---------------------------------------------------------------------
alter table public.restaurants
  add column if not exists business_status text
    check (business_status in ('OPERATIONAL', 'CLOSED_TEMPORARILY', 'CLOSED_PERMANENTLY'));

comment on column public.restaurants.business_status is
  'Places 的 businessStatus；null = 未知，运行时按 OPERATIONAL 处理（ADR-0009）';

-- ---------------------------------------------------------------------
-- 2. user_archived_restaurants —— 归档集合
--
-- place_id **刻意不加外键**指向 public.restaurants，理由与 0003 的
-- user_pool_selection 完全相同：目录里的 74 家是静态数据文件，从来不进
-- restaurants 表，加了外键「归档一家目录里的店」会直接违反约束。
-- ---------------------------------------------------------------------
create table if not exists public.user_archived_restaurants (
  user_id     uuid        not null references auth.users (id) on delete cascade,
  place_id    text        not null,
  archived_at timestamptz not null default now(),
  -- 只有这三种；没有任何 auto_* 原因，因为**永不自动归档**（ADR-0009）
  reason      text        not null default 'manual'
    check (reason in ('closed_permanently', 'closed_temporarily', 'manual')),
  primary key (user_id, place_id)
);

comment on table public.user_archived_restaurants is
  '用户归档的餐厅（ADR-0009）：不参与摇一摇，但统计与历史全部保留；归档 ≠ 移除';

create index if not exists user_archived_at_idx
  on public.user_archived_restaurants (user_id, archived_at desc);

alter table public.user_archived_restaurants enable row level security;

drop policy if exists archived_select on public.user_archived_restaurants;
create policy archived_select on public.user_archived_restaurants
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists archived_insert on public.user_archived_restaurants;
create policy archived_insert on public.user_archived_restaurants
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists archived_update on public.user_archived_restaurants;
create policy archived_update on public.user_archived_restaurants
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists archived_delete on public.user_archived_restaurants;
create policy archived_delete on public.user_archived_restaurants
  for delete to authenticated using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 3. 中央可见性：谁归档了什么、为什么（security_invoker，不绕过 RLS）
-- ---------------------------------------------------------------------
create or replace view public.admin_archive_feed
with (security_invoker = on) as
select a.user_id,
       p.email,
       a.place_id,
       r.name,
       r.primary_cuisine,
       r.business_status,
       a.reason,
       a.archived_at
from public.user_archived_restaurants a
left join public.profiles p on p.id = a.user_id
left join public.restaurants r on r.place_id = a.place_id;

revoke all on public.user_archived_restaurants from anon;
revoke all on public.admin_archive_feed from anon;
