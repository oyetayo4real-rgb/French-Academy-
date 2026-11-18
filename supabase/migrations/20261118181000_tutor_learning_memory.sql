-- Persistent, opt-in tutor memory.
-- Stores only structured learning metadata; never raw prompts, chat history, or generated answers.

create table public.tutor_learning_memory (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default false,
  cefr_level text check (cefr_level is null or cefr_level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  topic_counts jsonb not null default '{}'::jsonb check (pg_catalog.jsonb_typeof(topic_counts) = 'object'),
  mode_counts jsonb not null default '{}'::jsonb check (pg_catalog.jsonb_typeof(mode_counts) = 'object'),
  interaction_count integer not null default 0 check (interaction_count >= 0),
  last_interaction_at timestamptz,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now()
);

alter table public.tutor_learning_memory enable row level security;

-- This table is server-only. Browser roles have no table privileges or policies.
revoke all on table public.tutor_learning_memory from anon, authenticated;
grant select, insert, update, delete on table public.tutor_learning_memory to service_role;

create policy tutor_learning_memory_service_role
  on public.tutor_learning_memory
  for all
  to service_role
  using (true)
  with check (true);

create or replace function public.tutor_memory_record_interaction(
  p_user_id uuid,
  p_cefr_level text,
  p_mode text,
  p_topics text[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_mode text;
  v_level text;
begin
  if p_user_id is null then
    raise exception 'p_user_id is required';
  end if;

  v_level := case
    when p_cefr_level = any(array['A1', 'A2', 'B1', 'B2', 'C1', 'C2']::text[]) then p_cefr_level
    else null
  end;

  v_mode := case
    when p_mode = any(array['chat', 'translate', 'correct', 'practice', 'examples']::text[]) then p_mode
    else 'chat'
  end;

  update public.tutor_learning_memory as memory
  set
    cefr_level = coalesce(v_level, memory.cefr_level),
    topic_counts = memory.topic_counts || coalesce((
      select pg_catalog.jsonb_object_agg(
        grouped.topic,
        pg_catalog.to_jsonb(coalesce((memory.topic_counts ->> grouped.topic)::integer, 0) + grouped.n)
      )
      from (
        select topic, pg_catalog.count(*)::integer as n
        from pg_catalog.unnest(coalesce(p_topics, '{}'::text[])) as input(topic)
        where topic = any(array[
          'subjunctive', 'past_tenses', 'articles', 'pronouns', 'agreement',
          'prepositions', 'negation', 'vocabulary', 'pronunciation', 'writing',
          'literature', 'idioms', 'questions', 'verb_conjugation', 'listening',
          'translation', 'correction', 'conversation', 'examples'
        ]::text[])
        group by topic
      ) as grouped
    ), '{}'::jsonb),
    mode_counts = memory.mode_counts || pg_catalog.jsonb_build_object(
      v_mode,
      coalesce((memory.mode_counts ->> v_mode)::integer, 0) + 1
    ),
    interaction_count = memory.interaction_count + 1,
    last_interaction_at = pg_catalog.now(),
    updated_at = pg_catalog.now()
  where memory.user_id = p_user_id
    and memory.enabled = true;
end;
$$;

revoke all on function public.tutor_memory_record_interaction(uuid, text, text, text[]) from public, anon, authenticated;
grant execute on function public.tutor_memory_record_interaction(uuid, text, text, text[]) to service_role;

comment on table public.tutor_learning_memory is
  'Opt-in tutor learning profile. Stores CEFR level, topic/mode counters and timestamps only; no raw conversation content.';
