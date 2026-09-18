-- =====================================================================
-- Supper Valet · 0001_init
-- 真实账号轮的数据底座：账号档案 + 两层 Bandit 状态 + rolls/feedbacks。
--
-- 对齐：design/0001 §6（数据模型）、ADR-0005（类别层进 schema）、
--       ADR-0006（账号与数据架构）、src/lib/engine/types.ts 的运行时形状。
--
-- 原则：
--   1. 每张业务表第一列是 user_id，RLS 一律 `auth.uid() = user_id`，
--      账号之间在数据库层面硬隔离（不靠前端自觉）。
--   2. 引擎状态按「层」normalize（单店层 / 类别层），不存 JSON blob ——
--      中央可见性要求 Hao 能在 Supabase 里直接查后验，blob 查不动。
--   3. rolls.candidates_snapshot 原样保留（离线回放的资产，design/0001 §6）。
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 通用：updated_at 自动刷新
-- ---------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 1. profiles —— 一个试玩账号一行，随 auth.users 自动创建
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text,
  display_name text,
  emoji        text        not null default '🍚',
  -- 首登选的 persona 模板；'从零开始' 记为 null + onboarded_at 有值
  persona_key  text check (persona_key in ('western', 'japanese', 'chinese')),
  onboarded_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.profiles is '试玩账号档案；persona_key 为首登选的口味模板，null + onboarded_at 非空 = 从零开始';

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- 注册即建档：把 email 抄一份到 public，方便中央查询时不必 join auth schema
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 2. user_restaurants —— 单店层（EngineState.stores / lastEatenDay /
--    baseWeight / paused 四个 map 合并成一行，键都是 placeId）
--    alpha/beta 为 null = 该店还没有后验，引擎用 storePrior() 兜底。
-- ---------------------------------------------------------------------
create table if not exists public.user_restaurants (
  user_id        uuid        not null references auth.users (id) on delete cascade,
  place_id       text        not null,
  alpha          double precision,
  beta           double precision,
  base_weight    double precision,
  last_eaten_day integer,
  paused         boolean     not null default false,
  updated_at     timestamptz not null default now(),
  primary key (user_id, place_id),
  constraint user_restaurants_ab_paired check ((alpha is null) = (beta is null)),
  constraint user_restaurants_ab_positive check (alpha is null or (alpha > 0 and beta > 0))
);

comment on table public.user_restaurants is '单店层 Beta 后验与冷却状态；alpha/beta 为 null 表示尚未学习，引擎回落到 storePrior()';

drop trigger if exists user_restaurants_touch on public.user_restaurants;
create trigger user_restaurants_touch before update on public.user_restaurants
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- 3. user_cuisine_categories —— 类别层（ADR-0005）
--    EngineState.categories + catLastEatenDay
-- ---------------------------------------------------------------------
create table if not exists public.user_cuisine_categories (
  user_id        uuid        not null references auth.users (id) on delete cascade,
  category       text        not null,
  alpha          double precision,
  beta           double precision,
  last_eaten_day integer,
  updated_at     timestamptz not null default now(),
  primary key (user_id, category),
  constraint user_categories_ab_paired check ((alpha is null) = (beta is null)),
  constraint user_categories_ab_positive check (alpha is null or (alpha > 0 and beta > 0))
);

comment on table public.user_cuisine_categories is 'ADR-0005 的类别层后验；真正发生学习的一层';

drop trigger if exists user_cuisine_categories_touch on public.user_cuisine_categories;
create trigger user_cuisine_categories_touch before update on public.user_cuisine_categories
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- 4. rolls —— 训练数据核心表
--    id 由客户端生成（RollRecord.id，base36 短串），主键带 user_id 前缀，
--    所以不同账号即使撞 id 也互不影响。
-- ---------------------------------------------------------------------
create table if not exists public.rolls (
  id                  text        not null,
  user_id             uuid        not null references auth.users (id) on delete cascade,
  restaurant_id       text        not null,
  rolled_at           timestamptz not null,
  epoch_day           integer     not null,
  meal                text        not null check (meal in ('lunch', 'dinner')),
  algo_version        text        not null,
  candidates_snapshot jsonb       not null default '[]'::jsonb,
  roll_index          integer     not null default 0,
  action              text        not null check (action in ('accepted', 'skipped')),
  skip_reason         text check (skip_reason in
                        ('too_far', 'too_pricey', 'just_ate', 'wrong_cuisine',
                         'closed', 'no_mood', 'other')),
  created_at          timestamptz not null default now(),
  primary key (user_id, id),
  constraint rolls_skip_reason_only_when_skipped
    check (action = 'skipped' or skip_reason is null)
);

comment on column public.rolls.candidates_snapshot is '当时全部候选及其两层 θ 与分数；离线回放对比算法版本用';

create index if not exists rolls_user_rolled_at_idx on public.rolls (user_id, rolled_at desc);
create index if not exists rolls_rolled_at_idx on public.rolls (rolled_at desc);

-- ---------------------------------------------------------------------
-- 5. feedbacks —— 一次 roll 最多一条反馈（与应用「补问队列」的语义一致）
-- ---------------------------------------------------------------------
create table if not exists public.feedbacks (
  user_id       uuid        not null,
  roll_id       text        not null,
  restaurant_id text        not null,
  rating        text        not null check (rating in ('good', 'ok', 'bad')),
  note          text,
  created_at    timestamptz not null default now(),
  primary key (user_id, roll_id),
  foreign key (user_id, roll_id) references public.rolls (user_id, id) on delete cascade
);

create index if not exists feedbacks_user_created_at_idx on public.feedbacks (user_id, created_at desc);

-- =====================================================================
-- RLS —— 账号隔离的唯一真相来源
-- =====================================================================
alter table public.profiles                enable row level security;
alter table public.user_restaurants        enable row level security;
alter table public.user_cuisine_categories enable row level security;
alter table public.rolls                   enable row level security;
alter table public.feedbacks               enable row level security;

-- profiles：只能看见/改自己那一行，且不允许把行改到别人名下
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- 其余四张表：模式完全一致
do $$
declare
  t text;
begin
  foreach t in array array['user_restaurants', 'user_cuisine_categories', 'rolls', 'feedbacks']
  loop
    execute format('drop policy if exists %I on public.%I', t || '_select_own', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using ((select auth.uid()) = user_id)',
      t || '_select_own', t);

    execute format('drop policy if exists %I on public.%I', t || '_insert_own', t);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)',
      t || '_insert_own', t);

    execute format('drop policy if exists %I on public.%I', t || '_update_own', t);
    execute format(
      'create policy %I on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',
      t || '_update_own', t);

    execute format('drop policy if exists %I on public.%I', t || '_delete_own', t);
    execute format(
      'create policy %I on public.%I for delete to authenticated using ((select auth.uid()) = user_id)',
      t || '_delete_own', t);
  end loop;
end;
$$;

-- 纵深防御：匿名角色对业务表一点权限都不给。
-- RLS 已经能挡住匿名读（没有 anon policy），这里再砍掉表级权限，
-- 万一将来有人手滑加了一条宽松 policy 也不至于漏数据。
revoke all on public.profiles                from anon;
revoke all on public.user_restaurants        from anon;
revoke all on public.user_cuisine_categories from anon;
revoke all on public.rolls                   from anon;
revoke all on public.feedbacks               from anon;

grant select, insert, update, delete on public.profiles                to authenticated;
grant select, insert, update, delete on public.user_restaurants        to authenticated;
grant select, insert, update, delete on public.user_cuisine_categories to authenticated;
grant select, insert, update, delete on public.rolls                   to authenticated;
grant select, insert, update, delete on public.feedbacks               to authenticated;

-- =====================================================================
-- 中央可见性：给 Hao / 创始人在 Supabase SQL Editor 里一眼看全的视图。
-- security_invoker = on —— 视图不得成为绕过 RLS 的后门；
-- 用 service_role / postgres（Dashboard 默认）查时照样看得到全部数据。
-- =====================================================================
create or replace view public.admin_roll_feed
with (security_invoker = on) as
select
  p.email,
  p.persona_key,
  r.rolled_at,
  r.epoch_day,
  r.meal,
  r.restaurant_id,
  r.roll_index,
  r.action,
  r.skip_reason,
  f.rating,
  f.note,
  jsonb_array_length(r.candidates_snapshot) as candidate_count,
  r.user_id,
  r.id as roll_id
from public.rolls r
left join public.profiles p on p.id = r.user_id
left join public.feedbacks f on f.user_id = r.user_id and f.roll_id = r.id
order by r.rolled_at desc;

comment on view public.admin_roll_feed is '中央可见性：全部试玩账号的摇号 + 反馈流水（security_invoker，不绕 RLS）';

revoke all on public.admin_roll_feed from anon;
grant select on public.admin_roll_feed to authenticated;
