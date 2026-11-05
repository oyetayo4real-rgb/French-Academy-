-- Transactional SQL acceptance checks for ai_usage_reservations.
-- Run after the migration in a disposable/staging database, never production.
-- Every mutation is rolled back before this script exits.
begin;

do $test$
declare
  -- Replace this with the UUID of a throwaway test user before execution.
  v_uid constant uuid := '00000000-0000-0000-0000-000000000000';
  v_request uuid;
  v_result jsonb;
  v_count integer;
  v_n integer;
begin
  if v_uid = '00000000-0000-0000-0000-000000000000'::uuid then
    raise exception 'TEST_FIXTURE_REQUIRED: replace v_uid with the UUID of a throwaway test user before running this script';
  end if;

  -- Isolate this user's current-day counter; transaction rollback restores it.
  insert into public.ai_usage (user_id, day, n)
  values (v_uid, current_date, 0)
  on conflict (user_id, day) do update set n = 0;

  -- Reserve is idempotent for the same live request_id.
  v_request := gen_random_uuid();
  v_result := public.ai_use_reserve(v_uid, v_request);
  if (v_result->>'allowed')::boolean is distinct from true then
    raise exception 'RESERVE_FAILED: %', v_result;
  end if;

  v_result := public.ai_use_reserve(v_uid, v_request);
  if (v_result->>'allowed')::boolean is distinct from true
     or (v_result->>'idempotent')::boolean is distinct from true then
    raise exception 'RESERVE_NOT_IDEMPOTENT: %', v_result;
  end if;

  -- Success settles exactly once and increments ai_usage.n exactly once.
  v_result := public.ai_use_settle(v_uid, v_request, true);
  if (v_result->>'settled')::boolean is distinct from true
     or v_result->>'status' <> 'succeeded' then
    raise exception 'SUCCESS_SETTLE_FAILED: %', v_result;
  end if;

  v_result := public.ai_use_settle(v_uid, v_request, false);
  if (v_result->>'settled')::boolean is distinct from false
     or v_result->>'reason' <> 'already_settled' then
    raise exception 'SETTLE_NOT_IDEMPOTENT: %', v_result;
  end if;

  select n into v_n from public.ai_usage
  where user_id = v_uid and day = current_date;
  if v_n <> 1 then
    raise exception 'SUCCESS_COUNTER_EXPECTED_1_GOT_%', v_n;
  end if;

  -- Ordinary-user quota remains 25 (the v37 ai_use limit).
  update public.ai_usage set n = 25
  where user_id = v_uid and day = current_date;
  v_result := public.ai_use_reserve(v_uid, gen_random_uuid());
  if (v_result->>'allowed')::boolean is distinct from false
     or v_result->>'reason' <> 'quota_exceeded' then
    raise exception 'QUOTA_LIMIT_NOT_ENFORCED: %', v_result;
  end if;

  -- 100 failed attempts form a separate daily circuit-breaker.
  update public.ai_usage set n = 0
  where user_id = v_uid and day = current_date;

  insert into public.ai_usage_reservations
    (request_id, user_id, usage_day, status, created_at, settled_at)
  select gen_random_uuid(), v_uid, current_date, 'failed',
         now() - interval '1 minute', now()
  from generate_series(1, 100);

  v_result := public.ai_use_reserve(v_uid, gen_random_uuid());
  if (v_result->>'allowed')::boolean is distinct from false
     or v_result->>'reason' <> 'too_many_failures' then
    raise exception 'FAILED_ATTEMPT_CAP_NOT_ENFORCED: %', v_result;
  end if;

  raise notice 'PASS: reservation idempotency, single success increment, quota limit, and 100-failure cap';
end;
$test$;

rollback;
