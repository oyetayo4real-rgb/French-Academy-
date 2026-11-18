-- Server-only RPCs for privacy-minimised Tutor V2 learner memory.
-- The Edge Function supplies p_uid only after the Supabase gateway validates
-- the caller JWT. These functions are executable only by service_role.

begin;

create or replace function public.tutor_set_learning_memory_enabled(
  p_uid uuid,
  p_enabled boolean
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  if p_uid is null or p_enabled is null then
    raise exception 'invalid learning-memory settings';
  end if;

  insert into public.tutor_learning_memory (user_id, enabled)
  values (p_uid, p_enabled)
  on conflict (user_id) do update
    set enabled = excluded.enabled,
        updated_at = pg_catalog.now();

  return true;
end
$function$;

create or replace function public.tutor_clear_learning_memory(
  p_uid uuid
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  if p_uid is null then
    raise exception 'invalid learner';
  end if;

  delete from public.tutor_learning_memory
  where user_id = p_uid;

  return true;
end
$function$;

create or replace function public.tutor_record_learning_interaction(
  p_uid uuid,
  p_cefr_level text,
  p_topics text[],
  p_mode text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_topic text;
  v_topic_counts jsonb;
  v_mode_counts jsonb;
  v_result jsonb;
  v_allowed_topics constant text[] := array[
    'subjunctive', 'past_tenses', 'articles', 'pronouns', 'agreement',
    'prepositions', 'negation', 'vocabulary', 'pronunciation', 'writing',
    'literature', 'idioms', 'questions', 'verb_conjugation', 'listening',
    'translation', 'correction', 'conversation', 'examples'
  ];
  v_allowed_modes constant text[] := array[
    'chat', 'practice', 'correct', 'translate', 'examples'
  ];
begin
  if p_uid is null then
    raise exception 'invalid learner';
  end if;

  if p_cefr_level is not null
     and p_cefr_level <> all (array['A1', 'A2', 'B1', 'B2', 'C1', 'C2']) then
    raise exception 'invalid CEFR level';
  end if;

  if p_mode is null or p_mode <> all (v_allowed_modes) then
    raise exception 'invalid learning mode';
  end if;

  select topic_counts, mode_counts
    into v_topic_counts, v_mode_counts
  from public.tutor_learning_memory
  where user_id = p_uid and enabled = true
  for update;

  -- Do not silently enable memory or create a profile if the learner opted out.
  if not found then
    return null;
  end if;

  v_topic_counts := coalesce(v_topic_counts, '{}'::jsonb);
  v_mode_counts := coalesce(v_mode_counts, '{}'::jsonb);

  for v_topic in
    select distinct topic
    from pg_catalog.unnest(coalesce(p_topics, array[]::text[])) as topics(topic)
    where topic = any (v_allowed_topics)
  loop
    v_topic_counts := pg_catalog.jsonb_set(
      v_topic_counts,
      array[v_topic],
      pg_catalog.to_jsonb(
        least(100000, coalesce((v_topic_counts ->> v_topic)::integer, 0) + 1)
      ),
      true
    );
  end loop;

  v_mode_counts := pg_catalog.jsonb_set(
    v_mode_counts,
    array[p_mode],
    pg_catalog.to_jsonb(
      least(100000, coalesce((v_mode_counts ->> p_mode)::integer, 0) + 1)
    ),
    true
  );

  update public.tutor_learning_memory
  set cefr_level = coalesce(p_cefr_level, cefr_level),
      topic_counts = v_topic_counts,
      mode_counts = v_mode_counts,
      interaction_count = least(1000000, interaction_count + 1),
      last_interaction_at = pg_catalog.now(),
      updated_at = pg_catalog.now()
  where user_id = p_uid and enabled = true
  returning pg_catalog.jsonb_build_object(
    'enabled', enabled,
    'cefr_level', cefr_level,
    'topic_counts', topic_counts,
    'mode_counts', mode_counts,
    'interaction_count', interaction_count,
    'last_interaction_at', last_interaction_at
  ) into v_result;

  return v_result;
end
$function$;

revoke all on function public.tutor_set_learning_memory_enabled(uuid, boolean) from public, anon, authenticated;
revoke all on function public.tutor_clear_learning_memory(uuid) from public, anon, authenticated;
revoke all on function public.tutor_record_learning_interaction(uuid, text, text[], text) from public, anon, authenticated;

grant execute on function public.tutor_set_learning_memory_enabled(uuid, boolean) to service_role;
grant execute on function public.tutor_clear_learning_memory(uuid) to service_role;
grant execute on function public.tutor_record_learning_interaction(uuid, text, text[], text) to service_role;

commit;
