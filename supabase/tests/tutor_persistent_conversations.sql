begin;

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$;

grant usage on schema auth to authenticated;
grant execute on function auth.uid() to authenticated;

insert into auth.users (id)
values ('00000000-0000-4000-8000-000000000099')
on conflict (id) do nothing;

insert into public.tutor_conversations (user_id, title, messages)
values ('00000000-0000-4000-8000-000000000099', 'Other learner private chat', '[]'::jsonb);

select pg_catalog.set_config('request.jwt.claim.sub', :'test_uid', true);
set local role authenticated;

insert into public.tutor_conversations (user_id, title, level, mode, depth, messages)
values (:'test_uid'::uuid, 'Persistence acceptance test', 'A1', 'chat', 'quick',
  '[{"role":"user","content":"Bonjour"},{"role":"assistant","content":"Bonjour !"}]'::jsonb);

insert into public.tutor_conversation_preferences (user_id, sync_enabled)
values (:'test_uid'::uuid, true)
on conflict (user_id) do update set sync_enabled = excluded.sync_enabled;

do $$
declare
  v_count integer;
  v_enabled boolean;
begin
  select count(*) into v_count from public.tutor_conversations;
  if v_count <> 1 then
    raise exception 'RLS must expose only the authenticated learner conversation; got %', v_count;
  end if;

  select sync_enabled into v_enabled
  from public.tutor_conversation_preferences
  where user_id = auth.uid();
  if v_enabled is distinct from true then
    raise exception 'Learner conversation sync preference was not persisted';
  end if;
end;
$$;

update public.tutor_conversations
set title = 'Updated acceptance test', updated_at = now()
where title = 'Persistence acceptance test';

do $$
begin
  if not exists (
    select 1 from public.tutor_conversations
    where user_id = auth.uid() and title = 'Updated acceptance test'
  ) then
    raise exception 'Authenticated learner could not update their own conversation';
  end if;
end;
$$;

delete from public.tutor_conversations
where title = 'Updated acceptance test';

do $$
begin
  if exists (
    select 1 from public.tutor_conversations
    where user_id = auth.uid()
  ) then
    raise exception 'Authenticated learner could not delete their own conversation';
  end if;
end;
$$;

reset role;
rollback;
