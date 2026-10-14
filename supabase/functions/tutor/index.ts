// AI tutor + dictionary for Académie Française. Requires secret ANTHROPIC_API_KEY.
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const J = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
function subOf(req: Request): string | null {
  try {
    const t = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    const p = t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const j = JSON.parse(atob(p + "=".repeat((4 - (p.length % 4)) % 4)));
    return j.role === "authenticated" && j.sub ? String(j.sub) : null;
  } catch (_) { return null; }
}
const norm = (s: unknown) => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim().slice(0, 80);
const clip = (s: unknown, n: number) => String(s || "").slice(0, n);
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
function grabJson(t: string) {
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a < 0 || b <= a) return null;
  try { return JSON.parse(t.slice(a, b + 1)); } catch (_) { return null; }
}
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const key = Deno.env.get("ANTHROPIC_API_KEY");
    if (!key) return J({ error: "not_configured" }, 503);
    const uid = subOf(req);
    if (!uid) return J({ error: "not_signed_in" }, 401);
    const body = await req.json().catch(() => ({}));
    const mode = ["chat", "translate", "correct", "practice", "dict", "examples"].includes(body.mode) ? body.mode : "chat";
    const level = LEVELS.includes(body.level) ? body.level : "A1";
    const text = clip(body.text, 1500).trim();
    if (!text && mode !== "examples") return J({ error: "empty", message: "Type something first." }, 400);
    const SU = Deno.env.get("SUPABASE_URL")!, SK = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = (path: string, opt: RequestInit = {}) => fetch(SU + path, { ...opt, headers: { apikey: SK, Authorization: "Bearer " + SK, "Content-Type": "application/json", ...((opt.headers as Record<string, string>) || {}) } });
    let ck: string | null = null;
    if (mode === "dict") ck = "dict:" + norm(text);
    if (mode === "examples") ck = "lesson:" + clip(body.key, 20).replace(/[^A-Za-z0-9-]/g, "");
    if (ck) {
      const r = await sb("/rest/v1/dict_cache?word=eq." + encodeURIComponent(ck) + "&select=data");
      const j = await r.json().catch(() => null);
      if (Array.isArray(j) && j[0]) return J({ ok: true, data: j[0].data, cached: true });
    }
    const u = await sb("/rest/v1/rpc/ai_use", { method: "POST", body: JSON.stringify({ p_uid: uid }) });
    const allowed = await u.json().catch(() => false);
    if (allowed !== true) return J({ error: "limit", message: "You have reached today's limit for the AI tutor. Please try again tomorrow." }, 429);
    const base = "You are a warm, patient French tutor for university students. The student's level is " + level + " on the CEFR scale. Write mainly in English, show French examples with English translations, keep answers short and clear, and never invent facts. If unsure, say so.";
    let system = base, messages: { role: string; content: string }[] = [];
    const hist = () => {
      const out: { role: string; content: string }[] = [];
      const h = Array.isArray(body.history) ? body.history.slice(-8) : [];
      for (const m of h) if (m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string") out.push({ role: m.role, content: clip(m.content, 1500) });
      while (out.length && out[0].role !== "user") out.shift();
      if (out.length && out[out.length - 1].role === "user") out.pop();
      out.push({ role: "user", content: text });
      return out;
    };
    if (mode === "chat") {
      system += " Answer the student's question about French. Use at most about 150 words unless asked for more.";
      messages = hist();
    } else if (mode === "translate") {
      system += " Translate the student's text. If it is English, translate to French; if French, translate to English. Give the translation first, then at most 3 short notes on tricky words or grammar.";
      messages = [{ role: "user", content: text }];
    } else if (mode === "correct") {
      system += " The student wrote French. Give the corrected version first, then a short bullet list of each correction with a one-line reason. Be encouraging. If the text is already correct, say so.";
      messages = [{ role: "user", content: text }];
    } else if (mode === "practice") {
      system += " Role-play a simple everyday conversation in French at the student's level. Reply in French (short, 1-3 sentences) followed by an English translation in brackets, then ask one easy follow-up question. If the student made a mistake, add a one-line gentle correction at the end.";
      messages = hist();
    } else if (mode === "dict") {
      system = "You are a precise French-English dictionary for learners. Respond with ONLY a JSON object, no other text, in this shape: {\"headword\":\"French word\",\"input_language\":\"fr or en\",\"pos\":\"part of speech\",\"gender\":\"m, f, m/f or empty\",\"ipa\":\"/.../\",\"meanings\":[\"English meaning 1\",\"meaning 2\"],\"examples\":[{\"fr\":\"French sentence\",\"en\":\"English translation\"}],\"notes\":\"one short usage or grammar note\",\"related\":[\"word1\",\"word2\"]}. If the input is English, headword is the best French translation, and meanings list other French options. Give exactly 4 natural example sentences suited to level " + level + ". If the input is not a word or phrase, return {\"error\":\"not a word\"}.";
      messages = [{ role: "user", content: text }];
    } else {
      system = "You write extra practice material for a French lesson. Respond with ONLY a JSON object: {\"examples\":[{\"fr\":\"...\",\"en\":\"...\"}],\"tip\":\"one short study tip\"}. Write exactly 8 natural, correct example sentences at level " + level + " that practise the lesson's grammar and vocabulary, each with an English translation.";
      messages = [{ role: "user", content: "Lesson: " + clip(body.title, 120) + "\nGrammar and focus: " + clip(body.focus, 700) + "\nSome phrases from the lesson: " + clip(body.phrases, 600) }];
    }
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: Deno.env.get("TUTOR_MODEL") || "claude-haiku-5-5", max_tokens: mode === "chat" || mode === "practice" ? 700 : 1000, system, messages }),
    });
    if (!r.ok) { await r.text().catch(() => ""); return J({ error: "ai_error", message: "The tutor is unavailable right now. Please try again in a moment." }, 502); }
    const j = await r.json();
    const out = (j.content || []).filter((c: { type: string }) => c.type === "text").map((c: { text: string }) => c.text).join("").trim();
    if (mode === "dict" || mode === "examples") {
      const data = grabJson(out);
      if (!data || data.error) return J({ ok: true, raw: data && data.error ? "I could not find that as a word or phrase." : out });
      if (ck) await sb("/rest/v1/dict_cache?on_conflict=word", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ word: ck, data }) }).catch(() => {});
      return J({ ok: true, data });
    }
    return J({ ok: true, text: out });
  } catch (_e) {
    return J({ error: "server", message: "Something went wrong. Please try again." }, 500);
  }
});
