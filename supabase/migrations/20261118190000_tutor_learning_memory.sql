-- Persistent, privacy-minimised learner memory for tutor-v2.
-- Stores aggregate learning signals only; never stores prompts or chat transcripts.
begin;

create table if not exists public.tutor_learning_memory (
  user_id pg_catalog.uuid primary key
    references auth.users(id) on delete cascade,
  enabled pg_catalog.bool not null default false,
  cefr_level pg_catalog.text
    check (cefr_level is null or cefr_level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  topic_counts pg_catalog.jsonb not null default '{}'::pg_catalog.jsonb
    check (pg_catalog.jsonb_typeof(topic_counts) = 'object'),
  mode_counts pg_catalog.jsonb not null default '{}'::pg_catalog.jsonb
    check (pg_catalog.jsonb_typeof(mode_counts) = 'object'),
  interaction_count pg_catalog.int4 not null default 0
    check (interaction_count >= 0),
  last_interaction_at pg_catalog.timestamptz,
  created_at pg_catalog.timestamptz not null default pg_catalog.now(),
  updated_at pg_catalog.timestamptz not null default pg_catalog.now()
);

alter table public.tutor_learning_memory enable row level security;

-- Access is server-only. The Edge Function uses the service-role key and
-- derives user_id from the authenticated Supabase JWT, never from request JSON.
revoke all on table public.tutor_learning_memory from public, anon, authenticated;
grant select, insert, update, delete on table public.tutor_learning_memory to service_role;

commit;
