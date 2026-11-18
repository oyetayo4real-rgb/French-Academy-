-- Atomic, server-only operations for opt-in tutor learning memory.
-- Uses the existing Supabase project; no external service or paid API is added.
begin;

create or replace function public.tutor_set_learning_memory_enabled(
  p_uid pg_catalog.uuid,
  p_enabled pg_catalog.bool
)
returns pg_catalog.void
language sql
security invoker
set search_path = pg_catalog, public
as $$
  insert into public.tutor_learning_memory (user_id, enabled, updated_at)
  values (p_uid, p_enabled, pg_catalog.now())
  on conflict (user_id) do update
    set enabled = excluded.enabled,
        updated_at = pg_catalog.now();
$$;

create or replace function public.tutor_clear_learning_memory(
  p_uid pg_catalog.uuid
)
returns pg_catalog.void
language sql
security invoker
set search_path = pg_catalog, public
as $$
  delete from public.tutor_learning_memory where user_id = p_uid;
$$;

create or replace function public.tutor_record_learning_interaction(
  p_uid pg_catalog.uuid,
  p_cefr_level pg_catalog.text,
  p_topics pg_catalog.text[],
  p_mode pg_catalog.text
)
returns pg_catalog.jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_topic pg_catalog.text;
  v_row public.tutor_learning_memory;
begin
  -- The explicit opt-in action creates/enables the row. Never re-enable it
  -- during a response: this prevents an in-flight request undoing an opt-out.
  select * into v_row
  from public.tutor_learning_memory
  where user_id = p_uid and enabled = true
  for update;

  if not found then
    return null;
  end if;

  update public.tutor_learning_memory
  set cefr_level = case
        when p_cefr_level = any(array['A1','A2','B1','B2','C1','C2']::text[]) then p_cefr_level
        else cefr_level
      end,
      interaction_count = interaction_count + 1,
      last_interaction_at = pg_catalog.now(),
      updated_at = pg_catalog.now()
  where user_id = p_uid and enabled = true;

  foreach v_topic in array coalesce(p_topics, array[]::text[]) loop
    if v_topic = any(array[
      'subjunctive','past_tenses','articles','pronouns','agreement',
      'prepositions','negation','vocabulary','pronunciation','writing',
      'literature','idioms','questions','verb_conjugation','listening',
      'translation','correction','conversation','examples'
    ]::text[]) then
      update public.tutor_learning_memory
      set topic_counts = pg_catalog.jsonb_set(
        topic_counts,
        array[v_topic],
        pg_catalog.to_jsonb(coalesce((topic_counts ->> v_topic)::pg_catalog.int4, 0) + 1),
        true
      ),
      updated_at = pg_catalog.now()
      where user_id = p_uid and enabled = true;
    end if;
  end loop;

  if p_mode = any(array['chat','practice','correct','translate','examples']::text[]) then
    update public.tutor_learning_memory
    set mode_counts = pg_catalog.jsonb_set(
      mode_counts,
      array[p_mode],
      pg_catalog.to_jsonb(coalesce((mode_counts ->> p_mode)::pg_catalog.int4, 0) + 1),
      true
    ),
    updated_at = pg_catalog.now()
    where user_id = p_uid and enabled = true;
  end if;

  select * into v_row
  from public.tutor_learning_memory
  where user_id = p_uid and enabled = true;

  return pg_catalog.to_jsonb(v_row);
end;
$$;

revoke all on function public.tutor_set_learning_memory_enabled(pg_catalog.uuid, pg_catalog.bool) from public, anon, authenticated;
revoke all on function public.tutor_clear_learning_memory(pg_catalog.uuid) from public, anon, authenticated;
revoke all on function public.tutor_record_learning_interaction(pg_catalog.uuid, pg_catalog.text, pg_catalog.text[], pg_catalog.text) from public, anon, authenticated;

grant execute on function public.tutor_set_learning_memory_enabled(pg_catalog.uuid, pg_catalog.bool) to service_role;
grant execute on function public.tutor_clear_learning_memory(pg_catalog.uuid) to service_role;
grant execute on function public.tutor_record_learning_interaction(pg_catalog.uuid, pg_catalog.text, pg_catalog.text[], pg_catalog.text) to service_role;

commit;
