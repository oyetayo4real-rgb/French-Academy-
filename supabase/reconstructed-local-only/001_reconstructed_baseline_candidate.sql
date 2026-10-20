-- RECONSTRUCTED LOCAL-ONLY BASELINE CANDIDATE
-- Generated from catalog snapshot captured 2026-10-20; NOT recovered historical migrations.
-- NOT YET REVIEWED OR REPLAY-VERIFIED. DO NOT apply to any hosted Supabase project.
-- Known omissions: role/database grants, non-table object ACLs, broader schema inventory, auth/storage integration assumptions, and canonical pg_dump parity.
BEGIN;
CREATE SCHEMA IF NOT EXISTS private;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public."ai_usage" (
  "user_id" uuid NOT NULL,
  "day" date NOT NULL,
  "n" integer DEFAULT 0 NOT NULL
);
CREATE TABLE IF NOT EXISTS public."app_secrets" (
  "name" text NOT NULL,
  "value" text NOT NULL
);
CREATE TABLE IF NOT EXISTS public."assignments" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "class_id" uuid NOT NULL,
  "title" text NOT NULL,
  "item_key" text NOT NULL,
  "due_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public."attempts" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "student_id" uuid NOT NULL,
  "key" text NOT NULL,
  "score" integer NOT NULL,
  "passed" boolean NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public."attendance" (
  "session_id" uuid NOT NULL,
  "student_id" uuid NOT NULL,
  "joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public."audio_clips" (
  "key" text NOT NULL,
  "path" text NOT NULL,
  "lecturer_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public."classes" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "lecturer_id" uuid NOT NULL,
  "name" text NOT NULL,
  "join_code" text DEFAULT upper(substr(md5(((random())::text || (clock_timestamp())::text)), 1, 6)) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public."custom_keys" (
  "lesson_id" uuid NOT NULL,
  "idx" integer NOT NULL,
  "answer" integer NOT NULL
);
CREATE TABLE IF NOT EXISTS public."custom_lessons" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "level" text NOT NULL,
  "title" text NOT NULL,
  "icon" text DEFAULT '📘'::text NOT NULL,
  "can" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "grammar" text DEFAULT ''::text NOT NULL,
  "scenes" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "quiz" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "video_path" text,
  "lecturer_id" uuid,
  "published" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public."dict_cache" (
  "word" text NOT NULL,
  "data" jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public."enrollments" (
  "class_id" uuid NOT NULL,
  "student_id" uuid NOT NULL,
  "joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public."exam_crit" (
  "level" text NOT NULL,
  "idx" integer NOT NULL,
  "label" text NOT NULL,
  "pattern" text NOT NULL
);
CREATE TABLE IF NOT EXISTS public."exam_keys" (
  "level" text NOT NULL,
  "section" text NOT NULL,
  "idx" integer NOT NULL,
  "answer" integer NOT NULL
);
CREATE TABLE IF NOT EXISTS public."lesson_media" (
  "key" text NOT NULL,
  "video_path" text NOT NULL,
  "updated_by" uuid,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public."live_sessions" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "class_id" uuid NOT NULL,
  "title" text NOT NULL,
  "starts_at" timestamp with time zone NOT NULL,
  "meet_url" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public."profiles" (
  "id" uuid NOT NULL,
  "full_name" text DEFAULT ''::text NOT NULL,
  "role" text DEFAULT 'student'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public."progress" (
  "student_id" uuid NOT NULL,
  "key" text NOT NULL,
  "best" integer DEFAULT 0 NOT NULL,
  "passed" boolean DEFAULT false NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public."quiz_keys" (
  "lesson_key" text NOT NULL,
  "idx" integer NOT NULL,
  "answer" integer NOT NULL
);
CREATE TABLE IF NOT EXISTS public."recordings" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "class_id" uuid NOT NULL,
  "title" text NOT NULL,
  "part" integer DEFAULT 1 NOT NULL,
  "path" text NOT NULL,
  "created_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public."signals" (
  "id" bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  "room" uuid NOT NULL,
  "from_id" uuid NOT NULL,
  "to_id" uuid,
  "kind" text NOT NULL,
  "payload" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public."submissions" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "student_id" uuid NOT NULL,
  "level" text NOT NULL,
  "writing" text DEFAULT ''::text NOT NULL,
  "scores" jsonb NOT NULL,
  "feedback" text,
  "graded_w" integer,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public."user_state" (
  "student_id" uuid NOT NULL,
  "data" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public."ai_usage" ADD CONSTRAINT "ai_usage_pkey" PRIMARY KEY (user_id, day);
ALTER TABLE public."ai_usage" ADD CONSTRAINT "ai_usage_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public."app_secrets" ADD CONSTRAINT "app_secrets_pkey" PRIMARY KEY (name);
ALTER TABLE public."assignments" ADD CONSTRAINT "assignments_class_id_fkey" FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE;
ALTER TABLE public."assignments" ADD CONSTRAINT "assignments_pkey" PRIMARY KEY (id);
ALTER TABLE public."attempts" ADD CONSTRAINT "attempts_pkey" PRIMARY KEY (id);
ALTER TABLE public."attempts" ADD CONSTRAINT "attempts_student_id_fkey" FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public."attendance" ADD CONSTRAINT "attendance_pkey" PRIMARY KEY (session_id, student_id);
ALTER TABLE public."attendance" ADD CONSTRAINT "attendance_session_id_fkey" FOREIGN KEY (session_id) REFERENCES live_sessions(id) ON DELETE CASCADE;
ALTER TABLE public."attendance" ADD CONSTRAINT "attendance_student_id_fkey" FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public."audio_clips" ADD CONSTRAINT "audio_clips_lecturer_id_fkey" FOREIGN KEY (lecturer_id) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public."audio_clips" ADD CONSTRAINT "audio_clips_pkey" PRIMARY KEY (key);
ALTER TABLE public."classes" ADD CONSTRAINT "classes_join_code_key" UNIQUE (join_code);
ALTER TABLE public."classes" ADD CONSTRAINT "classes_lecturer_id_fkey" FOREIGN KEY (lecturer_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public."classes" ADD CONSTRAINT "classes_pkey" PRIMARY KEY (id);
ALTER TABLE public."custom_keys" ADD CONSTRAINT "custom_keys_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES custom_lessons(id) ON DELETE CASCADE;
ALTER TABLE public."custom_keys" ADD CONSTRAINT "custom_keys_pkey" PRIMARY KEY (lesson_id, idx);
ALTER TABLE public."custom_lessons" ADD CONSTRAINT "custom_lessons_lecturer_id_fkey" FOREIGN KEY (lecturer_id) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public."custom_lessons" ADD CONSTRAINT "custom_lessons_level_check" CHECK (level = ANY (ARRAY['A1'::text, 'A2'::text, 'B1'::text, 'B2'::text, 'C1'::text, 'C2'::text]));
ALTER TABLE public."custom_lessons" ADD CONSTRAINT "custom_lessons_pkey" PRIMARY KEY (id);
ALTER TABLE public."dict_cache" ADD CONSTRAINT "dict_cache_pkey" PRIMARY KEY (word);
ALTER TABLE public."enrollments" ADD CONSTRAINT "enrollments_class_id_fkey" FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE;
ALTER TABLE public."enrollments" ADD CONSTRAINT "enrollments_pkey" PRIMARY KEY (class_id, student_id);
ALTER TABLE public."enrollments" ADD CONSTRAINT "enrollments_student_id_fkey" FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public."exam_crit" ADD CONSTRAINT "exam_crit_pkey" PRIMARY KEY (level, idx);
ALTER TABLE public."exam_keys" ADD CONSTRAINT "exam_keys_pkey" PRIMARY KEY (level, section, idx);
ALTER TABLE public."exam_keys" ADD CONSTRAINT "exam_keys_section_check" CHECK (section = ANY (ARRAY['l'::text, 'r'::text]));
ALTER TABLE public."lesson_media" ADD CONSTRAINT "lesson_media_pkey" PRIMARY KEY (key);
ALTER TABLE public."lesson_media" ADD CONSTRAINT "lesson_media_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public."live_sessions" ADD CONSTRAINT "live_sessions_class_id_fkey" FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE;
ALTER TABLE public."live_sessions" ADD CONSTRAINT "live_sessions_pkey" PRIMARY KEY (id);
ALTER TABLE public."profiles" ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public."profiles" ADD CONSTRAINT "profiles_pkey" PRIMARY KEY (id);
ALTER TABLE public."profiles" ADD CONSTRAINT "profiles_role_check" CHECK (role = ANY (ARRAY['student'::text, 'lecturer'::text]));
ALTER TABLE public."progress" ADD CONSTRAINT "progress_pkey" PRIMARY KEY (student_id, key);
ALTER TABLE public."progress" ADD CONSTRAINT "progress_student_id_fkey" FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public."quiz_keys" ADD CONSTRAINT "quiz_keys_pkey" PRIMARY KEY (lesson_key, idx);
ALTER TABLE public."recordings" ADD CONSTRAINT "recordings_class_id_fkey" FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE;
ALTER TABLE public."recordings" ADD CONSTRAINT "recordings_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public."recordings" ADD CONSTRAINT "recordings_pkey" PRIMARY KEY (id);
ALTER TABLE public."signals" ADD CONSTRAINT "signals_pkey" PRIMARY KEY (id);
ALTER TABLE public."signals" ADD CONSTRAINT "signals_room_fkey" FOREIGN KEY (room) REFERENCES classes(id) ON DELETE CASCADE;
ALTER TABLE public."submissions" ADD CONSTRAINT "submissions_pkey" PRIMARY KEY (id);
ALTER TABLE public."submissions" ADD CONSTRAINT "submissions_student_id_fkey" FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public."user_state" ADD CONSTRAINT "user_state_pkey" PRIMARY KEY (student_id);
ALTER TABLE public."user_state" ADD CONSTRAINT "user_state_student_id_fkey" FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE;

CREATE INDEX assignments_class_id_idx ON public.assignments USING btree (class_id);
CREATE INDEX attempts_student_id_idx ON public.attempts USING btree (student_id);
CREATE INDEX attendance_student_id_idx ON public.attendance USING btree (student_id);
CREATE INDEX audio_clips_lecturer_id_idx ON public.audio_clips USING btree (lecturer_id);
CREATE INDEX classes_lecturer_id_idx ON public.classes USING btree (lecturer_id);
CREATE INDEX custom_lessons_lecturer_id_idx ON public.custom_lessons USING btree (lecturer_id);
CREATE INDEX enrollments_student_id_idx ON public.enrollments USING btree (student_id);
CREATE INDEX lesson_media_updated_by_idx ON public.lesson_media USING btree (updated_by);
CREATE INDEX live_sessions_class_id_idx ON public.live_sessions USING btree (class_id);
CREATE INDEX recordings_class_id_idx ON public.recordings USING btree (class_id);
CREATE INDEX recordings_created_by_idx ON public.recordings USING btree (created_by);
CREATE INDEX signals_room_id_idx ON public.signals USING btree (room, id);
CREATE INDEX submissions_student_id_idx ON public.submissions USING btree (student_id);

CREATE OR REPLACE FUNCTION private.in_class(c uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (select 1 from public.enrollments where class_id = c and student_id = (select auth.uid())) $function$;
CREATE OR REPLACE FUNCTION private.in_session(sid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (select 1 from public.live_sessions s join public.enrollments e on e.class_id = s.class_id
                 where s.id = sid and e.student_id = (select auth.uid())) $function$;
CREATE OR REPLACE FUNCTION private.is_lecturer()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select coalesce((select role from public.profiles where id = (select auth.uid())) = 'lecturer', false) $function$;
CREATE OR REPLACE FUNCTION private.my_role()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select role from public.profiles where id = (select auth.uid()) $function$;
CREATE OR REPLACE FUNCTION private.owns_class(c uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (select 1 from public.classes where id = c and lecturer_id = (select auth.uid())) $function$;
CREATE OR REPLACE FUNCTION private.owns_session(sid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (select 1 from public.live_sessions s join public.classes c on c.id = s.class_id
                 where s.id = sid and c.lecturer_id = (select auth.uid())) $function$;
CREATE OR REPLACE FUNCTION private.teaches(s uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (select 1 from public.enrollments e join public.classes c on c.id = e.class_id
                 where e.student_id = s and c.lecturer_id = (select auth.uid())) $function$;
CREATE OR REPLACE FUNCTION public.ai_use(p_uid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare lim int := 25; c int;
begin
  if exists (select 1 from public.profiles where id = p_uid and role = 'lecturer') then lim := 150; end if;
  insert into public.ai_usage (user_id, day, n) values (p_uid, current_date, 1)
  on conflict (user_id, day) do update set n = public.ai_usage.n + 1 returning n into c;
  return c <= lim;
end $function$;
CREATE OR REPLACE FUNCTION public.become_lecturer(code text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare ok boolean;
begin
  select (value = code) into ok from public.app_secrets where name = 'lecturer_code';
  if coalesce(ok, false) then
    update public.profiles set role = 'lecturer' where id = (select auth.uid());
    return true;
  end if;
  return false;
end $function$;
CREATE OR REPLACE FUNCTION public.delete_my_account()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  delete from auth.users where id = (select auth.uid());
end $function$;
CREATE OR REPLACE FUNCTION public.grade_submission(p_id uuid, p_w integer, p_feedback text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare s record; l int; r int; sc int; w int; tot int; ok boolean;
begin
  select * into s from public.submissions where id = p_id;
  if not found or not private.teaches(s.student_id) then raise exception 'not allowed'; end if;
  w := least(greatest(coalesce(p_w, 0), 0), 25);
  l := (s.scores->>'l')::int; r := (s.scores->>'r')::int; sc := (s.scores->>'s')::int;
  tot := l + r + w + sc; ok := tot >= 50 and l >= 5 and r >= 5 and w >= 5 and sc >= 5;
  update public.submissions set graded_w = w, feedback = left(p_feedback, 2000) where id = p_id;
  insert into public.progress (student_id, key, best, passed, updated_at) values (s.student_id, s.level || '-exam', tot, ok, now())
    on conflict (student_id, key) do update set best = excluded.best, passed = excluded.passed, updated_at = now();
  return jsonb_build_object('t', tot, 'ok', ok);
end $function$;
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  insert into public.profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end $function$;
CREATE OR REPLACE FUNCTION public.join_class(code text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare cid uuid; cname text;
begin
  select id, name into cid, cname from public.classes where join_code = upper(trim(code));
  if cid is null then return null; end if;
  insert into public.enrollments (class_id, student_id) values (cid, (select auth.uid())) on conflict do nothing;
  return cname;
end $function$;
CREATE OR REPLACE FUNCTION public.save_custom_lesson(p jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare uid uuid := (select auth.uid()); lid uuid := nullif(p->>'id', '')::uuid; q jsonb; i int := 0; qn jsonb;
begin
  if not private.is_lecturer() then raise exception 'lecturers only'; end if;
  if jsonb_array_length(coalesce(p->'quiz', '[]'::jsonb)) < 3 then raise exception 'add at least 3 quiz questions'; end if;
  if jsonb_array_length(coalesce(p->'scenes', '[]'::jsonb)) < 3 then raise exception 'add at least 3 scenes'; end if;
  select jsonb_agg(e - 'a') into qn from jsonb_array_elements(p->'quiz') e;
  if lid is not null and not exists (select 1 from public.custom_lessons where id = lid and lecturer_id = uid) then raise exception 'not your lesson'; end if;
  if lid is null then
    insert into public.custom_lessons (level, title, icon, can, grammar, scenes, quiz, video_path, lecturer_id)
    values (p->>'level', left(p->>'title', 120), coalesce(nullif(p->>'icon', ''), '📘'), coalesce(p->'can', '[]'::jsonb), left(coalesce(p->>'grammar', ''), 4000), p->'scenes', qn, nullif(p->>'video_path', ''), uid) returning id into lid;
  else
    update public.custom_lessons set level = p->>'level', title = left(p->>'title', 120), icon = coalesce(nullif(p->>'icon', ''), '📘'), can = coalesce(p->'can', '[]'::jsonb),
      grammar = left(coalesce(p->>'grammar', ''), 4000), scenes = p->'scenes', quiz = qn, video_path = nullif(p->>'video_path', '') where id = lid;
    delete from public.custom_keys where lesson_id = lid;
  end if;
  for q in select * from jsonb_array_elements(p->'quiz') loop
    insert into public.custom_keys (lesson_id, idx, answer) values (lid, i, (q->>'a')::int); i := i + 1;
  end loop;
  return lid;
end $function$;
CREATE OR REPLACE FUNCTION public.submit_exam(p jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare uid uuid := (select auth.uid()); lv text := p->>'level'; l_sc int := 0; r_sc int := 0; w_sc int := 0; s_sc int; tot int; ok boolean;
  rec record; mw jsonb := '[]'::jsonb; lk jsonb := '[]'::jsonb; rk jsonb := '[]'::jsonb; sid uuid; best int; ever boolean; txt text := left(coalesce(p->>'w', ''), 6000);
begin
  if uid is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from public.exam_keys where level = lv) then raise exception 'unknown exam'; end if;
  for rec in select idx, answer from public.exam_keys where level = lv and section = 'l' order by idx loop
    lk := lk || to_jsonb(rec.answer);
    if (p->'l'->>rec.idx) is not null and (p->'l'->>rec.idx)::int = rec.answer then l_sc := l_sc + 5; end if;
  end loop;
  for rec in select idx, answer from public.exam_keys where level = lv and section = 'r' order by idx loop
    rk := rk || to_jsonb(rec.answer);
    if (p->'r'->>rec.idx) is not null and (p->'r'->>rec.idx)::int = rec.answer then r_sc := r_sc + 5; end if;
  end loop;
  for rec in select idx, pattern from public.exam_crit where level = lv order by idx loop
    if txt ~* rec.pattern then w_sc := w_sc + 5; mw := mw || to_jsonb(true); else mw := mw || to_jsonb(false); end if;
  end loop;
  s_sc := least(greatest(coalesce((p->>'s')::int, 0), 0), 5) * 5;
  tot := l_sc + r_sc + w_sc + s_sc;
  ok := tot >= 50 and l_sc >= 5 and r_sc >= 5 and w_sc >= 5 and s_sc >= 5;
  insert into public.submissions (student_id, level, writing, scores) values (uid, lv, txt, jsonb_build_object('l', l_sc, 'r', r_sc, 'w', w_sc, 's', s_sc, 't', tot, 'ok', ok)) returning id into sid;
  insert into public.attempts (student_id, key, score, passed) values (uid, lv || '-exam', tot, ok);
  insert into public.progress (student_id, key, best, passed, updated_at) values (uid, lv || '-exam', tot, ok, now())
    on conflict (student_id, key) do update set best = greatest(public.progress.best, excluded.best), passed = public.progress.passed or excluded.passed, updated_at = now();
  select pr.best, pr.passed into best, ever from public.progress pr where pr.student_id = uid and pr.key = lv || '-exam';
  return jsonb_build_object('l', l_sc, 'r', r_sc, 'w', w_sc, 's', s_sc, 't', tot, 'ok', ok, 'crit', mw, 'lkeys', lk, 'rkeys', rk, 'best', best, 'ever_passed', ever, 'submission', sid);
end $function$;
CREATE OR REPLACE FUNCTION public.submit_quiz(p_key text, p_answers jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare uid uuid := (select auth.uid()); n int; c int := 0; sc int; ok boolean; keys jsonb; i int; best int; ever boolean;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if p_key like 'C-%' then
    select jsonb_agg(answer order by idx), count(*) into keys, n from public.custom_keys where lesson_id = substr(p_key, 3)::uuid;
  else
    select jsonb_agg(answer order by idx), count(*) into keys, n from public.quiz_keys where lesson_key = p_key;
  end if;
  if coalesce(n, 0) = 0 then raise exception 'unknown lesson'; end if;
  for i in 0..n-1 loop
    if (p_answers->>i) is not null and (p_answers->>i)::int = (keys->>i)::int then c := c + 1; end if;
  end loop;
  sc := round(c * 100.0 / n); ok := sc >= 70;
  insert into public.attempts (student_id, key, score, passed) values (uid, p_key, sc, ok);
  insert into public.progress (student_id, key, best, passed, updated_at) values (uid, p_key, sc, ok, now())
    on conflict (student_id, key) do update set best = greatest(public.progress.best, excluded.best), passed = public.progress.passed or excluded.passed, updated_at = now();
  select pr.best, pr.passed into best, ever from public.progress pr where pr.student_id = uid and pr.key = p_key;
  return jsonb_build_object('score', sc, 'passed', ok, 'answers', keys, 'best', best, 'ever_passed', ever);
end $function$;

CREATE POLICY "assign_delete" ON "public"."assignments" AS PERMISSIVE FOR DELETE TO "authenticated" USING (private.owns_class(class_id));
CREATE POLICY "assign_insert" ON "public"."assignments" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (private.owns_class(class_id));
CREATE POLICY "assign_select" ON "public"."assignments" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((private.owns_class(class_id) OR private.in_class(class_id)));
CREATE POLICY "assign_update" ON "public"."assignments" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (private.owns_class(class_id)) WITH CHECK (private.owns_class(class_id));
CREATE POLICY "attempts_select" ON "public"."attempts" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((student_id = ( SELECT auth.uid() AS uid)) OR private.teaches(student_id)));
CREATE POLICY "att_insert" ON "public"."attendance" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((student_id = ( SELECT auth.uid() AS uid)) AND private.in_session(session_id)));
CREATE POLICY "att_select" ON "public"."attendance" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((student_id = ( SELECT auth.uid() AS uid)) OR private.owns_session(session_id)));
CREATE POLICY "clips_delete" ON "public"."audio_clips" AS PERMISSIVE FOR DELETE TO "authenticated" USING (private.is_lecturer());
CREATE POLICY "clips_insert" ON "public"."audio_clips" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((private.is_lecturer() AND (lecturer_id = ( SELECT auth.uid() AS uid))));
CREATE POLICY "clips_select" ON "public"."audio_clips" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);
CREATE POLICY "clips_update" ON "public"."audio_clips" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (private.is_lecturer()) WITH CHECK ((private.is_lecturer() AND (lecturer_id = ( SELECT auth.uid() AS uid))));
CREATE POLICY "classes_delete" ON "public"."classes" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((lecturer_id = ( SELECT auth.uid() AS uid)));
CREATE POLICY "classes_insert" ON "public"."classes" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((lecturer_id = ( SELECT auth.uid() AS uid)) AND private.is_lecturer()));
CREATE POLICY "classes_select" ON "public"."classes" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((lecturer_id = ( SELECT auth.uid() AS uid)) OR private.in_class(id)));
CREATE POLICY "classes_update" ON "public"."classes" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((lecturer_id = ( SELECT auth.uid() AS uid))) WITH CHECK ((lecturer_id = ( SELECT auth.uid() AS uid)));
CREATE POLICY "cl_delete" ON "public"."custom_lessons" AS PERMISSIVE FOR DELETE TO "authenticated" USING (((lecturer_id = ( SELECT auth.uid() AS uid)) AND private.is_lecturer()));
CREATE POLICY "cl_select" ON "public"."custom_lessons" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((published OR (lecturer_id = ( SELECT auth.uid() AS uid))));
CREATE POLICY "enroll_delete" ON "public"."enrollments" AS PERMISSIVE FOR DELETE TO "authenticated" USING (((student_id = ( SELECT auth.uid() AS uid)) OR private.owns_class(class_id)));
CREATE POLICY "enroll_select" ON "public"."enrollments" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((student_id = ( SELECT auth.uid() AS uid)) OR private.owns_class(class_id)));
CREATE POLICY "media_delete" ON "public"."lesson_media" AS PERMISSIVE FOR DELETE TO "authenticated" USING (private.is_lecturer());
CREATE POLICY "media_insert" ON "public"."lesson_media" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((private.is_lecturer() AND (updated_by = ( SELECT auth.uid() AS uid))));
CREATE POLICY "media_select" ON "public"."lesson_media" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);
CREATE POLICY "media_update" ON "public"."lesson_media" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (private.is_lecturer()) WITH CHECK ((private.is_lecturer() AND (updated_by = ( SELECT auth.uid() AS uid))));
CREATE POLICY "live_delete" ON "public"."live_sessions" AS PERMISSIVE FOR DELETE TO "authenticated" USING (private.owns_class(class_id));
CREATE POLICY "live_insert" ON "public"."live_sessions" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (private.owns_class(class_id));
CREATE POLICY "live_select" ON "public"."live_sessions" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((private.owns_class(class_id) OR private.in_class(class_id)));
CREATE POLICY "live_update" ON "public"."live_sessions" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (private.owns_class(class_id)) WITH CHECK (private.owns_class(class_id));
CREATE POLICY "profiles_select" ON "public"."profiles" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((id = ( SELECT auth.uid() AS uid)) OR private.teaches(id)));
CREATE POLICY "profiles_update" ON "public"."profiles" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((id = ( SELECT auth.uid() AS uid))) WITH CHECK (((id = ( SELECT auth.uid() AS uid)) AND (role = private.my_role())));
CREATE POLICY "progress_select" ON "public"."progress" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((student_id = ( SELECT auth.uid() AS uid)) OR private.teaches(student_id)));
CREATE POLICY "rec_delete" ON "public"."recordings" AS PERMISSIVE FOR DELETE TO "authenticated" USING (private.owns_class(class_id));
CREATE POLICY "rec_insert" ON "public"."recordings" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((private.owns_class(class_id) AND (created_by = ( SELECT auth.uid() AS uid))));
CREATE POLICY "rec_select" ON "public"."recordings" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((private.owns_class(class_id) OR private.in_class(class_id)));
CREATE POLICY "sig_delete" ON "public"."signals" AS PERMISSIVE FOR DELETE TO "authenticated" USING (private.owns_class(room));
CREATE POLICY "sig_insert" ON "public"."signals" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((from_id = ( SELECT auth.uid() AS uid)) AND (private.owns_class(room) OR private.in_class(room))));
CREATE POLICY "sig_select" ON "public"."signals" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((private.owns_class(room) OR private.in_class(room)) AND ((to_id IS NULL) OR (to_id = ( SELECT auth.uid() AS uid)))));
CREATE POLICY "sig_select_owner" ON "public"."signals" AS PERMISSIVE FOR SELECT TO "authenticated" USING (private.owns_class(room));
CREATE POLICY "subs_select" ON "public"."submissions" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((student_id = ( SELECT auth.uid() AS uid)) OR private.teaches(student_id)));
CREATE POLICY "state_all" ON "public"."user_state" AS PERMISSIVE FOR ALL TO "authenticated" USING ((student_id = ( SELECT auth.uid() AS uid))) WITH CHECK ((student_id = ( SELECT auth.uid() AS uid)));

REVOKE ALL PRIVILEGES ON TABLE public."ai_usage" FROM "anon", "authenticated", "postgres", "service_role";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."ai_usage" TO "anon";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."ai_usage" TO "authenticated";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."ai_usage" TO "postgres" WITH GRANT OPTION;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."ai_usage" TO "service_role";
REVOKE ALL PRIVILEGES ON TABLE public."app_secrets" FROM "anon", "authenticated", "postgres", "service_role";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."app_secrets" TO "anon";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."app_secrets" TO "authenticated";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."app_secrets" TO "postgres" WITH GRANT OPTION;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."app_secrets" TO "service_role";
REVOKE ALL PRIVILEGES ON TABLE public."assignments" FROM "anon", "authenticated", "postgres", "service_role";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."assignments" TO "anon";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."assignments" TO "authenticated";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."assignments" TO "postgres" WITH GRANT OPTION;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."assignments" TO "service_role";
REVOKE ALL PRIVILEGES ON TABLE public."attempts" FROM "anon", "authenticated", "postgres", "service_role";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."attempts" TO "anon";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."attempts" TO "authenticated";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."attempts" TO "postgres" WITH GRANT OPTION;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."attempts" TO "service_role";
REVOKE ALL PRIVILEGES ON TABLE public."attendance" FROM "anon", "authenticated", "postgres", "service_role";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."attendance" TO "anon";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."attendance" TO "authenticated";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."attendance" TO "postgres" WITH GRANT OPTION;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."attendance" TO "service_role";
REVOKE ALL PRIVILEGES ON TABLE public."audio_clips" FROM "anon", "authenticated", "postgres", "service_role";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."audio_clips" TO "anon";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."audio_clips" TO "authenticated";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."audio_clips" TO "postgres" WITH GRANT OPTION;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."audio_clips" TO "service_role";
REVOKE ALL PRIVILEGES ON TABLE public."classes" FROM "anon", "authenticated", "postgres", "service_role";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."classes" TO "anon";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."classes" TO "authenticated";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."classes" TO "postgres" WITH GRANT OPTION;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."classes" TO "service_role";
REVOKE ALL PRIVILEGES ON TABLE public."custom_keys" FROM "anon", "authenticated", "postgres", "service_role";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."custom_keys" TO "anon";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."custom_keys" TO "authenticated";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."custom_keys" TO "postgres" WITH GRANT OPTION;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."custom_keys" TO "service_role";
REVOKE ALL PRIVILEGES ON TABLE public."custom_lessons" FROM "anon", "authenticated", "postgres", "service_role";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."custom_lessons" TO "anon";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."custom_lessons" TO "authenticated";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."custom_lessons" TO "postgres" WITH GRANT OPTION;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."custom_lessons" TO "service_role";
REVOKE ALL PRIVILEGES ON TABLE public."dict_cache" FROM "anon", "authenticated", "postgres", "service_role";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."dict_cache" TO "anon";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."dict_cache" TO "authenticated";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."dict_cache" TO "postgres" WITH GRANT OPTION;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."dict_cache" TO "service_role";
REVOKE ALL PRIVILEGES ON TABLE public."enrollments" FROM "anon", "authenticated", "postgres", "service_role";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."enrollments" TO "anon";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."enrollments" TO "authenticated";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."enrollments" TO "postgres" WITH GRANT OPTION;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."enrollments" TO "service_role";
REVOKE ALL PRIVILEGES ON TABLE public."exam_crit" FROM "anon", "authenticated", "postgres", "service_role";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."exam_crit" TO "anon";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."exam_crit" TO "authenticated";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."exam_crit" TO "postgres" WITH GRANT OPTION;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."exam_crit" TO "service_role";
REVOKE ALL PRIVILEGES ON TABLE public."exam_keys" FROM "anon", "authenticated", "postgres", "service_role";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."exam_keys" TO "anon";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."exam_keys" TO "authenticated";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."exam_keys" TO "postgres" WITH GRANT OPTION;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."exam_keys" TO "service_role";
REVOKE ALL PRIVILEGES ON TABLE public."lesson_media" FROM "anon", "authenticated", "postgres", "service_role";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."lesson_media" TO "anon";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."lesson_media" TO "authenticated";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."lesson_media" TO "postgres" WITH GRANT OPTION;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."lesson_media" TO "service_role";
REVOKE ALL PRIVILEGES ON TABLE public."live_sessions" FROM "anon", "authenticated", "postgres", "service_role";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."live_sessions" TO "anon";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."live_sessions" TO "authenticated";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."live_sessions" TO "postgres" WITH GRANT OPTION;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."live_sessions" TO "service_role";
REVOKE ALL PRIVILEGES ON TABLE public."profiles" FROM "anon", "authenticated", "postgres", "service_role";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."profiles" TO "anon";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."profiles" TO "authenticated";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."profiles" TO "postgres" WITH GRANT OPTION;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."profiles" TO "service_role";
REVOKE ALL PRIVILEGES ON TABLE public."progress" FROM "anon", "authenticated", "postgres", "service_role";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."progress" TO "anon";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."progress" TO "authenticated";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."progress" TO "postgres" WITH GRANT OPTION;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."progress" TO "service_role";
REVOKE ALL PRIVILEGES ON TABLE public."quiz_keys" FROM "anon", "authenticated", "postgres", "service_role";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."quiz_keys" TO "anon";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."quiz_keys" TO "authenticated";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."quiz_keys" TO "postgres" WITH GRANT OPTION;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."quiz_keys" TO "service_role";
REVOKE ALL PRIVILEGES ON TABLE public."recordings" FROM "anon", "authenticated", "postgres", "service_role";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."recordings" TO "anon";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."recordings" TO "authenticated";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."recordings" TO "postgres" WITH GRANT OPTION;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."recordings" TO "service_role";
REVOKE ALL PRIVILEGES ON TABLE public."signals" FROM "anon", "authenticated", "postgres", "service_role";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."signals" TO "anon";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."signals" TO "authenticated";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."signals" TO "postgres" WITH GRANT OPTION;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."signals" TO "service_role";
REVOKE ALL PRIVILEGES ON TABLE public."submissions" FROM "anon", "authenticated", "postgres", "service_role";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."submissions" TO "anon";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."submissions" TO "authenticated";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."submissions" TO "postgres" WITH GRANT OPTION;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."submissions" TO "service_role";
REVOKE ALL PRIVILEGES ON TABLE public."user_state" FROM "anon", "authenticated", "postgres", "service_role";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."user_state" TO "anon";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."user_state" TO "authenticated";
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."user_state" TO "postgres" WITH GRANT OPTION;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."user_state" TO "service_role";

GRANT USAGE, CREATE ON SCHEMA "private" TO "postgres";
GRANT USAGE ON SCHEMA "private" TO "authenticated";
GRANT USAGE, CREATE ON SCHEMA "public" TO "pg_database_owner";
GRANT USAGE ON SCHEMA "public" TO PUBLIC;
GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

REVOKE ALL ON FUNCTION "private"."in_class"(c uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "private"."in_class"(c uuid) TO "authenticated";
GRANT EXECUTE ON FUNCTION "private"."in_class"(c uuid) TO "service_role";
REVOKE ALL ON FUNCTION "private"."in_session"(sid uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "private"."in_session"(sid uuid) TO "authenticated";
GRANT EXECUTE ON FUNCTION "private"."in_session"(sid uuid) TO "service_role";
REVOKE ALL ON FUNCTION "private"."is_lecturer"() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "private"."is_lecturer"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "private"."is_lecturer"() TO "service_role";
REVOKE ALL ON FUNCTION "private"."my_role"() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "private"."my_role"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "private"."my_role"() TO "service_role";
REVOKE ALL ON FUNCTION "private"."owns_class"(c uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "private"."owns_class"(c uuid) TO "authenticated";
GRANT EXECUTE ON FUNCTION "private"."owns_class"(c uuid) TO "service_role";
REVOKE ALL ON FUNCTION "private"."owns_session"(sid uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "private"."owns_session"(sid uuid) TO "authenticated";
GRANT EXECUTE ON FUNCTION "private"."owns_session"(sid uuid) TO "service_role";
REVOKE ALL ON FUNCTION "private"."teaches"(s uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "private"."teaches"(s uuid) TO "authenticated";
GRANT EXECUTE ON FUNCTION "private"."teaches"(s uuid) TO "service_role";
REVOKE ALL ON FUNCTION "public"."ai_use"(p_uid uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."ai_use"(p_uid uuid) TO "service_role";
REVOKE ALL ON FUNCTION "public"."become_lecturer"(code text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."become_lecturer"(code text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."become_lecturer"(code text) TO "service_role";
REVOKE ALL ON FUNCTION "public"."delete_my_account"() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."delete_my_account"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."delete_my_account"() TO "service_role";
REVOKE ALL ON FUNCTION "public"."grade_submission"(p_id uuid, p_w integer, p_feedback text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."grade_submission"(p_id uuid, p_w integer, p_feedback text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."grade_submission"(p_id uuid, p_w integer, p_feedback text) TO "service_role";
REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO "service_role";
REVOKE ALL ON FUNCTION "public"."join_class"(code text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."join_class"(code text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."join_class"(code text) TO "service_role";
REVOKE ALL ON FUNCTION "public"."save_custom_lesson"(p jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."save_custom_lesson"(p jsonb) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."save_custom_lesson"(p jsonb) TO "service_role";
REVOKE ALL ON FUNCTION "public"."submit_exam"(p jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."submit_exam"(p jsonb) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."submit_exam"(p jsonb) TO "service_role";
REVOKE ALL ON FUNCTION "public"."submit_quiz"(p_key text, p_answers jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."submit_quiz"(p_key text, p_answers jsonb) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."submit_quiz"(p_key text, p_answers jsonb) TO "service_role";
ALTER TABLE public."ai_usage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."app_secrets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."assignments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."attempts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."attendance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."audio_clips" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."classes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."custom_keys" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."custom_lessons" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."dict_cache" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."enrollments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."exam_crit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."exam_keys" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."lesson_media" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."live_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."progress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."quiz_keys" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."recordings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."signals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."submissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."user_state" ENABLE ROW LEVEL SECURITY;
COMMIT;

-- Mandatory before replay: manually inspect every statement, reconcile omissions above, then run only against a disposable local Supabase stack.