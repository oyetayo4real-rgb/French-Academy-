-- Cross-device progress document for authenticated French Academy learners.
-- A user can only read or modify the row whose student_id matches auth.uid().
begin;
create table if not exists public.user_state (
  student_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb
    check (jsonb_typeof(data) = 'object'),
  updated_at timestamptz not null default now()
);
alter table public.user_state enable row level security;
revoke all on table public.user_state from public, anon;
grant select, insert, update on table public.user_state to authenticated;
drop policy if exists user_state_select_own on public.user_state;
create policy user_state_select_own on public.user_state
  for select to authenticated using (student_id = (select auth.uid()));
drop policy if exists user_state_insert_own on public.user_state;
create policy user_state_insert_own on public.user_state
  for insert to authenticated with check (student_id = (select auth.uid()));
drop policy if exists user_state_update_own on public.user_state;
create policy user_state_update_own on public.user_state
  for update to authenticated
  using (student_id = (select auth.uid()))
  with check (student_id = (select auth.uid()));
commit;
