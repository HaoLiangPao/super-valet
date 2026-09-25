-- =====================================================================
-- Supper Valet · 0002_explore_import
-- EXPLORE 导入功能的数据底座（design/0005、ADR-0007）。
--
-- 四类东西：
--   1. restaurants        共享事实表 —— Places 抓回来的客观信息，谁抓到算谁的，
--                         别人导入同一家店时直接复用，不重复调 API。
--   2. user_restaurant_pool  「我的池子」—— 用户与餐厅的关系，RLS 按 user_id 隔离。
--   3. dishes / sources   用户粘贴笔记的产物（design/0001 §6）。
--   4. fetch_log          抓取台账 —— Hao 2026-09-25 要求「每次抓取留一份摘要」。
--
-- 原则沿用 0001_init：业务表第一列 user_id，RLS 一律 auth.uid() = user_id。
-- 唯一的例外是 restaurants：它是共享事实，登录用户可读可写（写入只经服务端
-- 校验过的 payload），但**不含任何个人信息**，所以不按 user 隔离。
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. restaurants —— 共享事实表
-- ---------------------------------------------------------------------
create table if not exists public.restaurants (
  place_id        text primary key,
  name            text        not null,
  address         text        not null default '',
  lat             double precision not null,
  lng             double precision not null,
  primary_cuisine text        not null,
  tags            text[]      not null default '{}',
  solo_friendly   boolean     not null default true,
  slot_lock       text[]      not null default '{}',
  is_main_meal    boolean     not null default true,
  prior_bias      real        not null default 1.0,
  dine_in         boolean     not null default true,
  price_level     smallint,
  rating          real        not null default 0,
  rating_count    integer     not null default 0,
  closed_days     smallint[]  not null default '{}',
  service_windows jsonb       not null default '[]'::jsonb,
  distance_km     real        not null default 0,
  bucket          text        not null default 'MID',
  confidence      real        not null default 0,
  reason          text        not null default '',
  -- 事实数据的抓取时间：超过 30 天视为过期，下次碰到时重抓（design/0005 §4.8）
  fetched_at      timestamptz not null default now(),
  -- 一行人话的抓取摘要，方便在 Dashboard 里直接看「抓到了什么」
  fetch_summary   text        not null default '',
  updated_at      timestamptz not null default now()
);

drop trigger if exists restaurants_touch on public.restaurants;
create trigger restaurants_touch before update on public.restaurants
  for each row execute function public.touch_updated_at();

alter table public.restaurants enable row level security;

drop policy if exists restaurants_read on public.restaurants;
create policy restaurants_read on public.restaurants
  for select to authenticated using (true);

drop policy if exists restaurants_write on public.restaurants;
create policy restaurants_write on public.restaurants
  for insert to authenticated with check (true);

drop policy if exists restaurants_update on public.restaurants;
create policy restaurants_update on public.restaurants
  for update to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------
-- 2. sources —— 用户粘贴的笔记原文（先于 pool 建，pool 要引用它）
-- ---------------------------------------------------------------------
create table if not exists public.sources (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  place_id   text        not null references public.restaurants(place_id) on delete cascade,
  type       text        not null default 'manual_note',
  raw_text   text,
  created_at timestamptz not null default now()
);

create index if not exists sources_user_place_idx on public.sources (user_id, place_id);

alter table public.sources enable row level security;

drop policy if exists sources_select on public.sources;
create policy sources_select on public.sources
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists sources_insert on public.sources;
create policy sources_insert on public.sources
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists sources_update on public.sources;
create policy sources_update on public.sources
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists sources_delete on public.sources;
create policy sources_delete on public.sources
  for delete to authenticated using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 3. user_restaurant_pool —— 我的池子
-- ---------------------------------------------------------------------
create table if not exists public.user_restaurant_pool (
  user_id   uuid        not null references auth.users(id) on delete cascade,
  place_id  text        not null references public.restaurants(place_id) on delete cascade,
  added_at  timestamptz not null default now(),
  source_id uuid        references public.sources(id) on delete set null,
  primary key (user_id, place_id)
);

alter table public.user_restaurant_pool enable row level security;

drop policy if exists pool_select on public.user_restaurant_pool;
create policy pool_select on public.user_restaurant_pool
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists pool_insert on public.user_restaurant_pool;
create policy pool_insert on public.user_restaurant_pool
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists pool_update on public.user_restaurant_pool;
create policy pool_update on public.user_restaurant_pool
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists pool_delete on public.user_restaurant_pool;
create policy pool_delete on public.user_restaurant_pool
  for delete to authenticated using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 4. dishes —— 从笔记里抽出的菜品提及
-- ---------------------------------------------------------------------
create table if not exists public.dishes (
  id         bigserial primary key,
  user_id    uuid        not null references auth.users(id) on delete cascade,
  place_id   text        not null references public.restaurants(place_id) on delete cascade,
  name_raw   text        not null,
  quote      text,
  sentiment  text,
  created_at timestamptz not null default now()
);

create index if not exists dishes_user_place_idx on public.dishes (user_id, place_id);

alter table public.dishes enable row level security;

drop policy if exists dishes_select on public.dishes;
create policy dishes_select on public.dishes
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists dishes_insert on public.dishes;
create policy dishes_insert on public.dishes
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists dishes_update on public.dishes;
create policy dishes_update on public.dishes
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists dishes_delete on public.dishes;
create policy dishes_delete on public.dishes
  for delete to authenticated using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 5. fetch_log —— 抓取台账
-- ---------------------------------------------------------------------
create table if not exists public.fetch_log (
  id           bigserial primary key,
  user_id      uuid        not null references auth.users(id) on delete cascade,
  at           timestamptz not null default now(),
  kind         text        not null,
  query        text,
  place_id     text,
  place_name   text,
  provider     text        not null,
  result_count integer,
  outcome      text        not null,
  note         text
);

create index if not exists fetch_log_user_at_idx on public.fetch_log (user_id, at desc);

alter table public.fetch_log enable row level security;

drop policy if exists fetch_log_select on public.fetch_log;
create policy fetch_log_select on public.fetch_log
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists fetch_log_insert on public.fetch_log;
create policy fetch_log_insert on public.fetch_log
  for insert to authenticated with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 6. 中央可见性：抓取台账 + 池子的只读视图（security_invoker，不绕过 RLS）
-- ---------------------------------------------------------------------
create or replace view public.admin_import_feed
with (security_invoker = on) as
select p.user_id, p.added_at, r.place_id, r.name, r.primary_cuisine,
       r.confidence, r.fetched_at, r.fetch_summary,
       (select count(*) from public.dishes d
         where d.user_id = p.user_id and d.place_id = r.place_id) as dish_count
from public.user_restaurant_pool p
join public.restaurants r on r.place_id = p.place_id;

revoke all on public.restaurants from anon;
revoke all on public.user_restaurant_pool from anon;
revoke all on public.dishes from anon;
revoke all on public.sources from anon;
revoke all on public.fetch_log from anon;
