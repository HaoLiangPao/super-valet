-- =====================================================================
-- Supper Valet · 0003_catalog_selection_location
-- 目录 / 池子分离 + 位置偏好的数据底座（design/0006、ADR-0008）。
--
-- 两张表：
--   1. user_pool_selection —— 「我的池子」：用户**显式选中**的 placeId 列表。
--   2. user_location_prefs —— 位置来源（锚点 / GPS）、半径档位、上次成功定位。
--
-- 与 0002 的 user_restaurant_pool 的区别（很容易搞混，写清楚）：
--   user_restaurant_pool  = 「我导入过哪些店」（带 dishes / sources 的导入记录）
--   user_pool_selection   = 「我要摇哪些店」（可以包含从没导入过的目录静态店）
-- 导入 ≠ 选中：目录里的 50 家店是静态数据文件，从来不进 restaurants 表；
-- 用户把它们加进池子时，能落库的只有一个 place_id。
--
-- 所以 user_pool_selection.place_id **刻意不加外键**指向 public.restaurants：
-- 加了的话「把目录里的店加进池子」会直接违反外键，功能当场不成立。
--
-- 原则沿用 0001/0002：业务表第一列 user_id，RLS 一律 auth.uid() = user_id，
-- 并从 anon 收回全部权限。
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. user_pool_selection —— 用户显式选中的餐厅
-- ---------------------------------------------------------------------
create table if not exists public.user_pool_selection (
  user_id  uuid        not null references auth.users (id) on delete cascade,
  place_id text        not null,
  added_at timestamptz not null default now(),
  primary key (user_id, place_id)
);

comment on table public.user_pool_selection is
  '用户显式选中的餐厅 placeId（ADR-0008）；零行 + user_location_prefs.selection_set=false = 从没选过，按 15 家种子默认';

alter table public.user_pool_selection enable row level security;

drop policy if exists pool_selection_select on public.user_pool_selection;
create policy pool_selection_select on public.user_pool_selection
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists pool_selection_insert on public.user_pool_selection;
create policy pool_selection_insert on public.user_pool_selection
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists pool_selection_update on public.user_pool_selection;
create policy pool_selection_update on public.user_pool_selection
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists pool_selection_delete on public.user_pool_selection;
create policy pool_selection_delete on public.user_pool_selection
  for delete to authenticated using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 2. user_location_prefs —— 位置与半径偏好（每个账号一行）
--
-- selection_set 为什么住在这张表里：
--   「一家都没选」（空列表）和「从没选过」（默认 15 家种子）在行模型里长得
--   一样（都是零行），但语义完全不同 —— 后者是 ADR-0008 的向后兼容保证。
--   需要一个 per-user 单行的地方存这个标记，这张表正好是，不值得为一个布尔
--   再建第三张表。写入时位置列与 selection_set 由不同的 writer 各写各的列
--   （见 src/lib/cloud/gateway.ts 的 LocationPrefsWrite），不会互相覆盖。
-- ---------------------------------------------------------------------
create table if not exists public.user_location_prefs (
  user_id       uuid primary key references auth.users (id) on delete cascade,
  -- null = 从没设过来源，运行时按默认锚点（Downtown Markham）算
  source_kind   text check (source_kind in ('anchor', 'gps')),
  anchor_id     text,
  lat           double precision,
  lng           double precision,
  accuracy      real,
  source_ts     timestamptz,
  radius        text not null default 'ALL' check (radius in ('WALK', 'NEAR', 'MID', 'ALL')),
  -- 上次成功定位，降级链的第二环（design/0006 §4.3）
  last_gps_lat  double precision,
  last_gps_lng  double precision,
  last_gps_ts   timestamptz,
  selection_set boolean     not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on column public.user_location_prefs.selection_set is
  '用户是否已经显式设立过池子选择；false = 从没选过 → 池子默认成 15 家种子（ADR-0008）';

drop trigger if exists user_location_prefs_touch on public.user_location_prefs;
create trigger user_location_prefs_touch before update on public.user_location_prefs
  for each row execute function public.touch_updated_at();

alter table public.user_location_prefs enable row level security;

drop policy if exists location_prefs_select on public.user_location_prefs;
create policy location_prefs_select on public.user_location_prefs
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists location_prefs_insert on public.user_location_prefs;
create policy location_prefs_insert on public.user_location_prefs
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists location_prefs_update on public.user_location_prefs;
create policy location_prefs_update on public.user_location_prefs
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists location_prefs_delete on public.user_location_prefs;
create policy location_prefs_delete on public.user_location_prefs
  for delete to authenticated using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 3. 中央可见性：每个账号的池子规模与位置设置（security_invoker，不绕 RLS）
-- ---------------------------------------------------------------------
create or replace view public.admin_pool_selection_feed
with (security_invoker = on) as
select p.id                                  as user_id,
       p.email,
       (select count(*) from public.user_pool_selection s where s.user_id = p.id) as selected_count,
       l.source_kind,
       l.anchor_id,
       l.radius,
       l.selection_set,
       l.updated_at
from public.profiles p
left join public.user_location_prefs l on l.user_id = p.id;

revoke all on public.user_pool_selection from anon;
revoke all on public.user_location_prefs from anon;
revoke all on public.admin_pool_selection_feed from anon;
