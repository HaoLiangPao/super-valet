-- =====================================================================
-- Supper Valet · 0005_refresh_reports
-- 刷新报告的落库（design/0009 §4.2 / §4.3）。
--
-- 一次刷新（自动或手动）产出一份 `RefreshReport`：更新了什么、新发现什么、
-- 哪些需要用户确认、哪些**失败**了。报告要能回看 —— 这是「失败必须可见」
-- 的唯一落点：失败悄悄消失的话，「更新了 12 家」就是假的。
--
-- 为什么明细存 jsonb，而汇总数各占一列：
--   ADR-0005 反对把**后验**存成 blob（中央可见性要能直接查 α/β）。报告不是后验，
--   它是一次事件的记录，明细的形状随 Places 返回而变（字段级 diff、候选餐厅、
--   失败原因），拆表只会得到一堆没人查的空表。`rolls.candidates_snapshot`
--   已经是这个先例。
--   但「跑了几次刷新 / 失败率多高 / 一共抓了几次」必须能不解 JSON 就查出来，
--   所以六个汇总数各占一列（成本与健康度的可审计面），明细留 jsonb。
--
-- 原则沿用 0001–0004：业务表第一列 user_id，主键 (user_id, id) 与 rolls 同构
-- （id 是客户端生成的 `newId()`，text 而不是 uuid），RLS 一律 auth.uid() = user_id，
-- 并从 anon 收回全部权限。
-- =====================================================================

create table if not exists public.refresh_reports (
  user_id          uuid        not null references auth.users (id) on delete cascade,
  -- 客户端生成（`lib/engine/store.ts` 的 newId()），与 rolls.id 同款
  id               text        not null,
  -- 自动（打开应用时后台跑）还是手动（用户点「重新扫描」）：报告必须区分
  trigger          text        not null check (trigger in ('auto', 'manual')),
  started_at       timestamptz not null,
  finished_at      timestamptz not null,
  -- 汇总数：不解 JSON 就能查「这个账号刷新过几次、失败多不多、烧了几次抓取」
  updated_count    integer     not null default 0 check (updated_count >= 0),
  unchanged_count  integer     not null default 0 check (unchanged_count >= 0),
  discovered_count integer     not null default 0 check (discovered_count >= 0),
  attention_count  integer     not null default 0 check (attention_count >= 0),
  failed_count     integer     not null default 0 check (failed_count >= 0),
  -- 这次一共对外抓了几次；与 fetch_log 的行数对得上，成本可审计
  fetch_count      integer     not null default 0 check (fetch_count >= 0),
  -- 完整报告（RefreshReport 原样）；读回来一律过 sanitizeRefreshReport()
  report           jsonb       not null default '{}'::jsonb,
  created_at       timestamptz not null default now(),
  primary key (user_id, id)
);

comment on table public.refresh_reports is
  '一次刷新的完整报告（design/0009）：更新/新发现/待确认/失败；汇总数占列，明细存 jsonb';
comment on column public.refresh_reports.trigger is
  'auto = 打开应用时的后台刷新（每天至多一次、只刷新不发现）；manual = 用户点「重新扫描」';
comment on column public.refresh_reports.failed_count is
  '抓失败的家数；失败不许悄悄消失，否则「更新了 12 家」是假的';

-- 报告列表按时间倒序看（最近一次排最前面）
create index if not exists refresh_reports_started_idx
  on public.refresh_reports (user_id, started_at desc);

alter table public.refresh_reports enable row level security;

-- 与前四个迁移同风格：四条策略都钉在 auth.uid() = user_id 上。
-- update 既 using 又 with check —— 少了 with check 就能把自己的行「改成别人的」。
drop policy if exists refresh_reports_select on public.refresh_reports;
create policy refresh_reports_select on public.refresh_reports
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists refresh_reports_insert on public.refresh_reports;
create policy refresh_reports_insert on public.refresh_reports
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists refresh_reports_update on public.refresh_reports;
create policy refresh_reports_update on public.refresh_reports
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists refresh_reports_delete on public.refresh_reports;
create policy refresh_reports_delete on public.refresh_reports
  for delete to authenticated using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 中央可见性：谁在什么时候刷新了什么（security_invoker，不绕过 RLS）
-- 明细不进视图 —— 视图是给「扫一眼健康度」用的，看明细去 report 列。
-- ---------------------------------------------------------------------
create or replace view public.admin_refresh_feed
with (security_invoker = on) as
select r.user_id,
       p.email,
       r.id,
       r.trigger,
       r.started_at,
       r.finished_at,
       r.updated_count,
       r.unchanged_count,
       r.discovered_count,
       r.attention_count,
       r.failed_count,
       r.fetch_count
from public.refresh_reports r
left join public.profiles p on p.id = r.user_id;

revoke all on public.refresh_reports from anon;
revoke all on public.admin_refresh_feed from anon;
