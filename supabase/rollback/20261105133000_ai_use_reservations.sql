-- Rollback for 20261105133000_ai_use_reservations.sql.
-- Run only if the owner decides to reverse the migration.
begin;

revoke all on function public.ai_use_reserve(uuid, uuid) from public, anon, authenticated, service_role;
revoke all on function public.ai_use_settle(uuid, uuid, boolean) from public, anon, authenticated, service_role;

drop function if exists public.ai_use_reserve(uuid, uuid);
drop function if exists public.ai_use_settle(uuid, uuid, boolean);

drop table if exists public.ai_usage_reservations;

commit;
