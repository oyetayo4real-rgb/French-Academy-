begin;
select pg_catalog.set_config('tutor.test_uid', :'test_uid', false);

select public.tutor_set_learning_memory_enabled(:'test_uid'::pg_catalog.uuid, true);

do $$
declare
  v_uid pg_catalog.uuid := pg_catalog.current_setting('tutor.test_uid')::pg_catalog.uuid;
  v_memory pg_catalog.jsonb;
begin
  if not exists (
    select 1 from public.tutor_learning_memory
    where user_id = v_uid and enabled = true
  ) then
    raise exception 'enabling learning memory did not create an enabled profile';
  end if;

  v_memory := public.tutor_record_learning_interaction(
    v_uid, 'A2', array['subjunctive','not_allowed'], 'chat'
  );

  if v_memory ->> 'cefr_level' <> 'A2' then
    raise exception 'CEFR level was not stored';
  end if;
  if (v_memory -> 'topic_counts' ->> 'subjunctive')::pg_catalog.int4 <> 1 then
    raise exception 'allow-listed topic count was not incremented';
  end if;
  if (v_memory -> 'topic_counts') ? 'not_allowed' then
    raise exception 'unapproved topic was stored';
  end if;
  if (v_memory -> 'mode_counts' ->> 'chat')::pg_catalog.int4 <> 1 then
    raise exception 'mode count was not incremented';
  end if;
  if (v_memory ->> 'interaction_count')::pg_catalog.int4 <> 1 then
    raise exception 'interaction count was not incremented';
  end if;

  if pg_catalog.has_function_privilege('anon', 'public.tutor_record_learning_interaction(uuid,text,text[],text)', 'EXECUTE') then
    raise exception 'anon unexpectedly has execute permission';
  end if;
  if pg_catalog.has_function_privilege('authenticated', 'public.tutor_record_learning_interaction(uuid,text,text[],text)', 'EXECUTE') then
    raise exception 'authenticated unexpectedly has execute permission';
  end if;
  if not pg_catalog.has_function_privilege('service_role', 'public.tutor_record_learning_interaction(uuid,text,text[],text)', 'EXECUTE') then
    raise exception 'service_role cannot execute learning memory RPC';
  end if;
  if exists (
    select 1 from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('tutor_set_learning_memory_enabled','tutor_clear_learning_memory','tutor_record_learning_interaction')
      and p.prosecdef = true
  ) then
    raise exception 'learning memory RPCs must remain SECURITY INVOKER';
  end if;
end;
$$;

select public.tutor_set_learning_memory_enabled(:'test_uid'::pg_catalog.uuid, false);

do $$
declare
  v_uid pg_catalog.uuid := pg_catalog.current_setting('tutor.test_uid')::pg_catalog.uuid;
  v_memory pg_catalog.jsonb;
begin
  if exists (
    select 1 from public.tutor_learning_memory
    where user_id = v_uid and enabled = true
  ) then
    raise exception 'disabling learning memory did not pause the profile';
  end if;

  v_memory := public.tutor_record_learning_interaction(
    v_uid, 'B1', array['vocabulary'], 'chat'
  );
  if v_memory is not null then
    raise exception 'an in-flight interaction re-enabled or wrote disabled memory';
  end if;
end;
$$;

select public.tutor_clear_learning_memory(:'test_uid'::pg_catalog.uuid);

do $$
begin
  if exists (
    select 1 from public.tutor_learning_memory
    where user_id = pg_catalog.current_setting('tutor.test_uid')::pg_catalog.uuid
  ) then
    raise exception 'clear learning memory did not delete the profile';
  end if;
end;
$$;

rollback;
