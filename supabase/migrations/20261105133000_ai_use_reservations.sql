-- T1 quota reservations. This migration is intentionally reviewed in source only;
-- it is NOT applied by this change.
begin;

create table public.ai_usage_reservations (
  request_id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_day date not null,
  status text not null check (status in ('reserved', 'succeeded', 'failed', 'expired')),
  created_at timestamptz not null default now(),
  settled_at timestamptz
);

create index ai_usage_reservations_user_day_status_created_idx
  on public.ai_usage_reservations (user_id, usage_day, status, created_at);

alter table public.ai_usage_reservations enable row level security;

revoke all on table public.ai_usage_reservations from public, anon, authenticated;

create or replace function public.ai_use_reserve(p_uid uuid, p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_day date := current_date;
  v_limit integer := 25;
  v_used bigint := 0;
  v_reserved bigint := 0;
  v_failures bigint := 0;
  v_existing public.ai_usage_reservations%rowtype;
  v_role text;
begin
  if p_uid is null or p_request_id is null then
    return jsonb_build_object('allowed', false, 'reason', 'quota_exceeded');
  end if;

  -- Match ai_use(uuid)'s database-local current_date boundary and serialize
  -- reservation decisions for this user/day.
  perform pg_advisory_xact_lock(
    hashtextextended(p_uid::text || ':' || v_day::text, 0)
  );

  select r.* into v_existing
  from public.ai_usage_reservations r
  where r.request_id = p_request_id;

  if found then
    if v_existing.user_id = p_uid
       and v_existing.usage_day = v_day
       and v_existing.status = 'reserved'
       and v_existing.created_at > now() - interval '2 minutes' then
      return jsonb_build_object(
        'allowed', true, 'reason', null, 'idempotent', true,
        'usage_day', v_day
      );
    end if;

    return jsonb_build_object(
      'allowed', false,
      'reason', case when v_existing.status = 'failed'
                     then 'too_many_failures' else 'quota_exceeded' end,
      'idempotent', true,
      'usage_day', v_day
    );
  end if;

  -- Reservations older than two minutes no longer consume quota.
  update public.ai_usage_reservations
     set status = 'expired', settled_at = coalesce(settled_at, now())
   where user_id = p_uid
     and usage_day = v_day
     and status = 'reserved'
     and created_at <= now() - interval '2 minutes';

  select p.role into v_role
  from public.profiles p
  where p.id = p_uid;

  if v_role = 'lecturer' then
    v_limit := 150;
  end if;

  select coalesce(u.n, 0)::bigint into v_used
  from (select 1) seed
  left join public.ai_usage u
    on u.user_id = p_uid and u.day = v_day;

  select count(*) into v_failures
  from public.ai_usage_reservations r
  where r.user_id = p_uid
    and r.usage_day = v_day
    and r.status = 'failed';

  if v_failures >= 100 then
    return jsonb_build_object(
      'allowed', false, 'reason', 'too_many_failures',
      'failed_attempts', v_failures, 'usage_day', v_day
    );
  end if;

  select count(*) into v_reserved
  from public.ai_usage_reservations r
  where r.user_id = p_uid
    and r.usage_day = v_day
    and r.status = 'reserved'
    and r.created_at > now() - interval '2 minutes';

  if v_used + v_reserved >= v_limit then
    return jsonb_build_object(
      'allowed', false, 'reason', 'quota_exceeded',
      'used', v_used, 'reserved', v_reserved,
      'limit', v_limit, 'usage_day', v_day
    );
  end if;

  insert into public.ai_usage_reservations
    (request_id, user_id, usage_day, status)
  values
    (p_request_id, p_uid, v_day, 'reserved');

  return jsonb_build_object(
    'allowed', true, 'reason', null, 'idempotent', false,
    'used', v_used, 'reserved', v_reserved + 1,
    'limit', v_limit, 'usage_day', v_day
  );
end;
$function$;

create or replace function public.ai_use_settle(
  p_uid uuid,
  p_request_id uuid,
  p_success boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_day date;
  v_status text;
begin
  if p_uid is null or p_request_id is null or p_success is null then
    return jsonb_build_object('settled', false, 'reason', 'invalid_request');
  end if;

  select r.usage_day into v_day
  from public.ai_usage_reservations r
  where r.request_id = p_request_id
    and r.user_id = p_uid;

  if not found then
    return jsonb_build_object('settled', false, 'reason', 'reservation_not_found');
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(p_uid::text || ':' || v_day::text, 0)
  );

  select r.status into v_status
  from public.ai_usage_reservations r
  where r.request_id = p_request_id
    and r.user_id = p_uid
  for update;

  if not found or v_status <> 'reserved' then
    return jsonb_build_object('settled', false, 'reason', 'already_settled');
  end if;

  if p_success then
    update public.ai_usage_reservations
       set status = 'succeeded', settled_at = now()
     where request_id = p_request_id and user_id = p_uid
       and status = 'reserved';

    insert into public.ai_usage (user_id, day, n)
    values (p_uid, v_day, 1)
    on conflict (user_id, day)
    do update set n = public.ai_usage.n + 1;

    return jsonb_build_object('settled', true, 'status', 'succeeded', 'usage_day', v_day);
  end if;

  update public.ai_usage_reservations
     set status = 'failed', settled_at = now()
   where request_id = p_request_id and user_id = p_uid
     and status = 'reserved';

  return jsonb_build_object('settled', true, 'status', 'failed', 'usage_day', v_day);
end;
$function$;

revoke all on function public.ai_use_reserve(uuid, uuid) from public, anon, authenticated;
revoke all on function public.ai_use_settle(uuid, uuid, boolean) from public, anon, authenticated;
grant execute on function public.ai_use_reserve(uuid, uuid) to service_role;
grant execute on function public.ai_use_settle(uuid, uuid, boolean) to service_role;

commit;
