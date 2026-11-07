-- Rollback for 20261105133000_ai_use_reservations.sql.
-- Run only if the owner decides to reverse the migration.
begin;

revoke all on function public.ai_use_reserve(pg_catalog.uuid, pg_catalog.uuid) from public, anon, authenticated, service_role;
revoke all on function public.ai_use_settle(pg_catalog.uuid, pg_catalog.uuid, pg_catalog.bool) from public, anon, authenticated, service_role;

drop function if exists public.ai_use_reserve(pg_catalog.uuid, pg_catalog.uuid);
drop function if exists public.ai_use_settle(pg_catalog.uuid, pg_catalog.uuid, pg_catalog.bool);

drop table if exists public.ai_usage_reservations;

commit;
