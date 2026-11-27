begin;
select set_config('test.voice_uid', :'test_uid', false);

do $$
declare
  uid uuid := current_setting('test.voice_uid')::uuid;
  allowed boolean;
  used integer;
begin
  if public.ai_use_voice_preflight(null) is distinct from false then
    raise exception 'null user id must fail closed';
  end if;

  delete from public.ai_usage where user_id = uid and day = current_date;
  insert into public.ai_usage(user_id, day, n) values (uid, current_date, 23);
  allowed := public.ai_use_voice_preflight(uid);
  select n into used from public.ai_usage where user_id = uid and day = current_date;
  if allowed is distinct from true or used <> 24 then
    raise exception 'student with two remaining uses must reserve one: allowed %, used %', allowed, used;
  end if;

  allowed := public.ai_use_voice_preflight(uid);
  select n into used from public.ai_usage where user_id = uid and day = current_date;
  if allowed is distinct from false or used <> 24 then
    raise exception 'student with only one remaining use must be rejected without increment: allowed %, used %', allowed, used;
  end if;

  update public.profiles set role = 'lecturer' where id = uid;
  update public.ai_usage set n = 148 where user_id = uid and day = current_date;
  allowed := public.ai_use_voice_preflight(uid);
  select n into used from public.ai_usage where user_id = uid and day = current_date;
  if allowed is distinct from true or used <> 149 then
    raise exception 'lecturer limit must preserve one response unit: allowed %, used %', allowed, used;
  end if;

  allowed := public.ai_use_voice_preflight(uid);
  select n into used from public.ai_usage where user_id = uid and day = current_date;
  if allowed is distinct from false or used <> 149 then
    raise exception 'lecturer at one remaining unit must be rejected: allowed %, used %', allowed, used;
  end if;

  if has_function_privilege('anon', 'public.ai_use_voice_preflight(uuid)', 'EXECUTE') then
    raise exception 'anon must not execute voice quota preflight';
  end if;
  if has_function_privilege('authenticated', 'public.ai_use_voice_preflight(uuid)', 'EXECUTE') then
    raise exception 'authenticated must not execute voice quota preflight';
  end if;
  if not has_function_privilege('service_role', 'public.ai_use_voice_preflight(uuid)', 'EXECUTE') then
    raise exception 'service_role must execute voice quota preflight';
  end if;
  if not exists (
    select 1 from pg_proc
    where oid = 'public.ai_use_voice_preflight(uuid)'::regprocedure
      and prosecdef = true
      and coalesce(array_to_string(proconfig, ','), '') like '%search_path=%'
  ) then
    raise exception 'quota preflight must be SECURITY DEFINER with an explicit search_path';
  end if;
end;
$$;

rollback;
