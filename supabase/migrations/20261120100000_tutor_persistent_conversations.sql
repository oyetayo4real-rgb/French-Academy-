-- Persistent tutor conversations with explicit per-account sync consent.
-- Chat transcripts are separate from the privacy-minimised learning-memory profile.
begin;

create table if not exists public.tutor_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New conversation'
    check (char_length(title) between 1 and 80),
  level text not null default 'A1'
    check (level in ('none','A1','A2','B1','B2','C1','C2')),
  mode text not null default 'chat'
    check (mode in ('chat','practice','correct','translate')),
  depth text not null default 'quick'
    check (depth in ('quick','deep')),
  messages jsonb not null default '[]'::jsonb
    check (
      jsonb_typeof(messages) = 'array'
      and jsonb_array_length(messages) <= 100
      and pg_column_size(messages) <= 524288
    ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tutor_conversations_user_updated_idx
  on public.tutor_conversations (user_id, updated_at desc);

alter table public.tutor_conversations enable row level security;
revoke all on table public.tutor_conversations from public, anon;
grant select, insert, update, delete on table public.tutor_conversations to authenticated;

drop policy if exists tutor_conversations_select_own on public.tutor_conversations;
create policy tutor_conversations_select_own on public.tutor_conversations
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists tutor_conversations_insert_own on public.tutor_conversations;
create policy tutor_conversations_insert_own on public.tutor_conversations
  for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists tutor_conversations_update_own on public.tutor_conversations;
create policy tutor_conversations_update_own on public.tutor_conversations
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists tutor_conversations_delete_own on public.tutor_conversations;
create policy tutor_conversations_delete_own on public.tutor_conversations
  for delete to authenticated using (user_id = (select auth.uid()));

create table if not exists public.tutor_conversation_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  sync_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.tutor_conversation_preferences enable row level security;
revoke all on table public.tutor_conversation_preferences from public, anon;
grant select, insert, update on table public.tutor_conversation_preferences to authenticated;

drop policy if exists tutor_conversation_preferences_select_own on public.tutor_conversation_preferences;
create policy tutor_conversation_preferences_select_own on public.tutor_conversation_preferences
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists tutor_conversation_preferences_insert_own on public.tutor_conversation_preferences;
create policy tutor_conversation_preferences_insert_own on public.tutor_conversation_preferences
  for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists tutor_conversation_preferences_update_own on public.tutor_conversation_preferences;
create policy tutor_conversation_preferences_update_own on public.tutor_conversation_preferences
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

commit;
