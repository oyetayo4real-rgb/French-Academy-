-- SECURITY PATCH PROPOSAL — APPLY TO STAGING FIRST.
-- The repository currently lacks the original migrations that created these RPCs,
-- so this lives under supabase/patches rather than pretending to be a complete
-- replayable migration history. Do not apply directly to production.
--
-- Change: never return the answer key arrays to the authenticated submitter.
-- The current app renders the student's scores/criteria only and does not consume
-- lkeys/rkeys/answers from the RPC response.

CREATE OR REPLACE FUNCTION public.submit_exam(p jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  uid uuid := (select auth.uid());
  lv text := p->>'level';
  l_sc int := 0;
  r_sc int := 0;
  w_sc int := 0;
  s_sc int;
  tot int;
  ok boolean;
  rec record;
  mw jsonb := '[]'::jsonb;
  sid uuid;
  best int;
  ever boolean;
  txt text := left(coalesce(p->>'w', ''), 6000);
begin
  if uid is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from public.exam_keys where level = lv) then raise exception 'unknown exam'; end if;

  for rec in select idx, answer from public.exam_keys where level = lv and section = 'l' order by idx loop
    if (p->'l'->>rec.idx) is not null and (p->'l'->>rec.idx)::int = rec.answer then l_sc := l_sc + 5; end if;
  end loop;

  for rec in select idx, answer from public.exam_keys where level = lv and section = 'r' order by idx loop
    if (p->'r'->>rec.idx) is not null and (p->'r'->>rec.idx)::int = rec.answer then r_sc := r_sc + 5; end if;
  end loop;

  for rec in select idx, pattern from public.exam_crit where level = lv order by idx loop
    if txt ~* rec.pattern then
      w_sc := w_sc + 5;
      mw := mw || to_jsonb(true);
    else
      mw := mw || to_jsonb(false);
    end if;
  end loop;

  s_sc := least(greatest(coalesce((p->>'s')::int, 0), 0), 5) * 5;
  tot := l_sc + r_sc + w_sc + s_sc;
  ok := tot >= 50 and l_sc >= 5 and r_sc >= 5 and w_sc >= 5 and s_sc >= 5;

  insert into public.submissions (student_id, level, writing, scores)
  values (uid, lv, txt, jsonb_build_object('l', l_sc, 'r', r_sc, 'w', w_sc, 's', s_sc, 't', tot, 'ok', ok))
  returning id into sid;

  insert into public.attempts (student_id, key, score, passed) values (uid, lv || '-exam', tot, ok);

  insert into public.progress (student_id, key, best, passed, updated_at)
  values (uid, lv || '-exam', tot, ok, now())
  on conflict (student_id, key) do update
    set best = greatest(public.progress.best, excluded.best),
        passed = public.progress.passed or excluded.passed,
        updated_at = now();

  select pr.best, pr.passed into best, ever
  from public.progress pr where pr.student_id = uid and pr.key = lv || '-exam';

  return jsonb_build_object(
    'l', l_sc, 'r', r_sc, 'w', w_sc, 's', s_sc,
    't', tot, 'ok', ok, 'crit', mw,
    'best', best, 'ever_passed', ever, 'submission', sid
  );
end
$function$;

CREATE OR REPLACE FUNCTION public.submit_quiz(p_key text, p_answers jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  uid uuid := (select auth.uid());
  n int;
  c int := 0;
  sc int;
  ok boolean;
  keys jsonb;
  i int;
  best int;
  ever boolean;
begin
  if uid is null then raise exception 'not signed in'; end if;

  if p_key like 'C-%' then
    select jsonb_agg(answer order by idx), count(*) into keys, n
    from public.custom_keys where lesson_id = substr(p_key, 3)::uuid;
  else
    select jsonb_agg(answer order by idx), count(*) into keys, n
    from public.quiz_keys where lesson_key = p_key;
  end if;
  if coalesce(n, 0) = 0 then raise exception 'unknown lesson'; end if;

  for i in 0..n-1 loop
    if (p_answers->>i) is not null and (p_answers->>i)::int = (keys->>i)::int then c := c + 1; end if;
  end loop;

  sc := round(c * 100.0 / n);
  ok := sc >= 70;
  insert into public.attempts (student_id, key, score, passed) values (uid, p_key, sc, ok);
  insert into public.progress (student_id, key, best, passed, updated_at)
  values (uid, p_key, sc, ok, now())
  on conflict (student_id, key) do update
    set best = greatest(public.progress.best, excluded.best),
        passed = public.progress.passed or excluded.passed,
        updated_at = now();

  select pr.best, pr.passed into best, ever
  from public.progress pr where pr.student_id = uid and pr.key = p_key;

  return jsonb_build_object('score', sc, 'passed', ok, 'best', best, 'ever_passed', ever);
end
$function$;

-- These RPCs are for signed-in learners only; retain their intended authenticated use.
REVOKE EXECUTE ON FUNCTION public.submit_exam(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_exam(jsonb) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.submit_quiz(text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_quiz(text, jsonb) TO authenticated;
