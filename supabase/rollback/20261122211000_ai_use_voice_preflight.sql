-- Roll back the Groq transcription quota preflight RPC after the Groq handler is rolled back.
drop function if exists public.ai_use_voice_preflight(uuid);
