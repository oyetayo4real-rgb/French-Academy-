-- Transactional SQL acceptance checks for ai_usage_reservations.
-- Run only in a disposable database or isolated staging project after the migration.
-- The test user is a fixture created by CI/staging setup; every mutation is rolled back.
begin;

set local test.ai_use_uid = '11111111-1111-4111-8111-111111111111';

do $test$
declare
  v_uid constant pg_catalog.uuid := pg_catalog.current_setting('test.ai_use_uid')::pg_catalog.uuid;
  v_request pg_catalog.uuid;
  v_result pg_catalog.jsonb;
  v_n pg_catalog.int4;
begin
  if not exists (select 1 from auth.users u where u.id = v_uid) then
    raise exception 'TEST_FIXTURE_REQUIRED: create the disposable auth.users fixture before running this test';
  end if;

  insert into public.ai_usage (user_id, day, n)
  values (v_uid, current_date, 0)
  on conflict (user_id, day) do update set n = 0;

  v_request := pg_catalog.gen_random_uuid();
  v_result := public.ai_use_reserve(v_uid, v_request);
  if (v_result->>'allowed')::pg_catalog.bool is distinct from true then
    raise exception 'RESERVE_FAILED: %', v_result;
  end if;

  v_result := public.ai_use_reserve(v_uid, v_request);
  if (v_result->>'allowed')::pg_catalog.bool is distinct from true
     or (v_result->>'idempotent')::pg_catalog.bool is distinct from true then
    raise exception 'RESERVE_NOT_IDEMPOTENT: %', v_result;
  end if;

  v_result := public.ai_use_settle(v_uid, v_request, true);
  if (v_result->>'settled')::pg_catalog.bool is distinct from true
     or v_result->>'status' <> 'succeeded' then
    raise exception 'SUCCESS_SETTLE_FAILED: %', v_result;
  end if;

  v_result := public.ai_use_settle(v_uid, v_request, false);
  if (v_result->>'settled')::pg_catalog.bool is distinct from false
     or v_result->>'reason' <> 'already_settled' then
    raise exception 'SETTLE_NOT_IDEMPOTENT: %', v_result;
  end if;

  select u.n into v_n
  from public.ai_usage u
  where u.user_id = v_uid and u.day = current_date;
  if v_n <> 1 then
    raise exception 'SUCCESS_COUNTER_EXPECTED_1_GOT_%', v_n;
  end if;

  update public.ai_usage set n = 25
  where user_id = v_uid and day = current_date;
  v_result := public.ai_use_reserve(v_uid, pg_catalog.gen_random_uuid());
  if (v_result->>'allowed')::pg_catalog.bool is distinct from false
     or v_result->>'reason' <> 'quota_exceeded' then
    raise exception 'QUOTA_LIMIT_NOT_ENFORCED: %', v_result;
  end if;

  update public.ai_usage set n = 0
  where user_id = v_uid and day = current_date;

  insert into public.ai_usage_reservations
    (request_id, user_id, usage_day, status, created_at, settled_at)
  select pg_catalog.gen_random_uuid(), v_uid, current_date, 'failed',
         pg_catalog.now() - pg_catalog.interval '1 minute', pg_catalog.now()
  from pg_catalog.generate_series(1, 100);

  v_result := public.ai_use_reserve(v_uid, pg_catalog.gen_random_uuid());
  if (v_result->>'allowed')::pg_catalog.bool is distinct from false
     or v_result->>'reason' <> 'too_many_failures' then
    raise exception 'FAILED_ATTEMPT_CAP_NOT_ENFORCED: %', v_result;
  end if;

  raise notice 'PASS: reservation idempotency, single success increment, quota limit, and 100-failure cap';
end;
$test$;

rollback;
