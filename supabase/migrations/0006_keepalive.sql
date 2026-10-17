-- 0006 保活函数（2026-10-16）
--
-- Supabase 免费档闲置 7 天会自动暂停项目（2026-10-15 发生过）。
-- Vercel Cron 每天调 /api/keepalive，它再调这个函数，让 Postgres 看到一次真实查询。
--
-- 为什么专门建一个函数：匿名角色对业务表没有 grant（实测 42501），
-- 而保活不该为了「能查」去给匿名角色开任何业务表的权限。
-- 这个函数不读任何表，只 `select 1`。
--
-- 只增不减、幂等，重复跑安全。

create or replace function public.keepalive()
returns integer
language sql
stable
security invoker
as $$ select 1 $$;

revoke all on function public.keepalive() from public;
grant execute on function public.keepalive() to anon, authenticated;

-- 让 PostgREST 立刻看到新函数（否则 /rest/v1/rpc/keepalive 会 404 PGRST202，实测）
notify pgrst, 'reload schema';
