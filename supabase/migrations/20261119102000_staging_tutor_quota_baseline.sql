-- Staging baseline required by tutor-v2's existing legacy quota contract.
-- Mirrors the production schema contract without copying production data.
begin;
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'student',
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
revoke all on table public.profiles from public, anon;
grant select on table public.profiles to authenticated;
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create or replace function public.handle_new_user_profile()
returns trigger language plpgsql security definer set search_path = ''
as $function$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), 'student')
  on conflict (id) do nothing;
  return new;
end;
$function$;
drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile after insert on auth.users
  for each row execute function public.handle_new_user_profile();
insert into public.profiles (id, full_name, role)
select u.id, coalesce(u.raw_user_meta_data ->> 'full_name', ''), 'student'
from auth.users u on conflict (id) do nothing;
create table if not exists public.ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null default current_date,
  n integer not null default 0 check (n >= 0),
  primary key (user_id, day)
);
alter table public.ai_usage enable row level security;
revoke all on table public.ai_usage from public, anon, authenticated;
grant select, insert, update on table public.ai_usage to service_role;
create or replace function public.ai_use(p_uid uuid)
returns boolean language plpgsql security definer set search_path = ''
as $function$
declare lim integer := 25; c integer;
begin
  if exists (select 1 from public.profiles where id = p_uid and role = 'lecturer') then
    lim := 150;
  end if;
  insert into public.ai_usage (user_id, day, n) values (p_uid, current_date, 1)
  on conflict (user_id, day) do update set n = public.ai_usage.n + 1
  returning n into c;
  return c <= lim;
end;
$function$;
revoke all on function public.ai_use(uuid) from public, anon, authenticated;
grant execute on function public.ai_use(uuid) to service_role;
commit;
