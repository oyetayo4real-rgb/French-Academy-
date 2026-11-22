-- Reserve one Tutor quota slot for the follow-up text generation before paying for Groq transcription.
-- The subsequent Tutor V2 request consumes the final slot through the existing ai_use(uuid) contract.
create or replace function public.ai_use_voice_preflight(p_uid uuid)
returns boolean
language plpgsql
security definer
set search_path to ''
as $function$
declare
  lim integer := 25;
  consumed integer;
begin
  if p_uid is null then
    return false;
  end if;

  if exists (
    select 1
    from public.profiles
    where id = p_uid and role = 'lecturer'
  ) then
    lim := 150;
  end if;

  insert into public.ai_usage (user_id, day, n)
  values (p_uid, current_date, 1)
  on conflict (user_id, day)
  do update
    set n = public.ai_usage.n + 1
    where public.ai_usage.n < lim - 1
  returning n into consumed;

  return consumed is not null;
end;
$function$;

revoke all on function public.ai_use_voice_preflight(uuid) from public, anon, authenticated;
grant execute on function public.ai_use_voice_preflight(uuid) to service_role;

comment on function public.ai_use_voice_preflight(uuid) is
  'Atomically consumes one daily AI quota unit only when one additional unit remains for the Tutor V2 response; callable only by service_role.';
