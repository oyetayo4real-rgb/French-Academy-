-- Privacy-minimised, opt-in learner memory for Tutor V2.
-- This migration intentionally creates no transcript or prompt storage.
-- Client roles cannot read or mutate these records directly; Tutor V2 uses
-- its server-side service-role client after gateway JWT verification.

begin;

create table if not exists public.tutor_learning_memory (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default false,
  cefr_level text,
  topic_counts jsonb not null default '{}'::jsonb,
  mode_counts jsonb not null default '{}'::jsonb,
  interaction_count integer not null default 0,
  last_interaction_at timestamptz,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint tutor_learning_memory_cefr_check
    check (cefr_level is null or cefr_level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  constraint tutor_learning_memory_topic_counts_object
    check (pg_catalog.jsonb_typeof(topic_counts) = 'object'),
  constraint tutor_learning_memory_mode_counts_object
    check (pg_catalog.jsonb_typeof(mode_counts) = 'object'),
  constraint tutor_learning_memory_interaction_count_check
    check (interaction_count >= 0)
);

alter table public.tutor_learning_memory enable row level security;

revoke all on table public.tutor_learning_memory from public, anon, authenticated;
grant select, insert, update, delete on table public.tutor_learning_memory to service_role;

commit;
