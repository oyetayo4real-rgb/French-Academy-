// Live class room for Académie Française using Daily. Requires secret DAILY_API_KEY.
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
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const dk = Deno.env.get("DAILY_API_KEY");
    if (!dk) return J({ error: "not_configured" }, 503);
    const uid = subOf(req);
    if (!uid) return J({ error: "not_signed_in" }, 401);
    const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    const body = await req.json().catch(() => ({}));
    const cid = String(body.class_id || "");
    if (!/^[0-9a-f-]{36}$/i.test(cid)) return J({ error: "bad_request", message: "Missing class." }, 400);
    const SU = Deno.env.get("SUPABASE_URL")!, AK = Deno.env.get("SUPABASE_ANON_KEY")!;
    const ur = async (path: string) => {
      const response = await fetch(SU + path, { headers: { apikey: AK, Authorization: "Bearer " + jwt } });
      if (!response.ok) throw new Error("Supabase authorization lookup failed.");
      return response.json();
    };
    const cls = await ur("/rest/v1/classes?id=eq." + encodeURIComponent(cid) + "&select=id,name,lecturer_id");
    if (!Array.isArray(cls) || !cls[0]) return J({ error: "forbidden", message: "You are not in this class." }, 403);
    const owner = cls[0].lecturer_id === uid;
    const pr = await ur("/rest/v1/profiles?id=eq." + encodeURIComponent(uid) + "&select=full_name,role");
    if (!Array.isArray(pr) || !pr[0]) return J({ error: "profile_required", message: "Your profile is not ready. Please sign in again." }, 403);
    if (owner && pr[0].role !== "lecturer") return J({ error: "forbidden", message: "Only a lecturer account can host this class." }, 403);
    if (!owner) {
      const enrollment = await ur("/rest/v1/enrollments?class_id=eq." + encodeURIComponent(cid) + "&student_id=eq." + encodeURIComponent(uid) + "&select=student_id");
      if (!Array.isArray(enrollment) || enrollment.length === 0) return J({ error: "forbidden", message: "You must be enrolled in this class to join its live room." }, 403);
      if (pr[0].role !== "student") return J({ error: "forbidden", message: "This account is not authorized as a student in this class." }, 403);
    }
    const userName = String(pr[0].full_name || (owner ? "Lecturer" : "Student")).slice(0, 60);
    const D = (path: string, opt: RequestInit = {}) => fetch("https://api.daily.co/v1" + path, { ...opt, headers: { Authorization: "Bearer " + dk, "Content-Type": "application/json", ...((opt.headers as Record<string, string>) || {}) } });
    const name = "fa-" + cid;
    let room: { url: string } | null = null;
    const g = await D("/rooms/" + name);
    if (g.ok) room = await g.json();
    else if (g.status === 404) {
      if (!owner) return J({ error: "not_started", message: "The lecturer has not opened the room yet. Try again in a moment." }, 409);
      const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30;
      const maxParticipants = Number(Deno.env.get("MAX_PARTICIPANTS") || 200);
      if (!Number.isInteger(maxParticipants) || maxParticipants < 2 || maxParticipants > 200) {
        return J({ error: "large_class_not_configured", message: "This room is not configured for more than 200 participants. The dedicated large-class provider setup must be completed and verified first." }, 503);
      }
      const full = { name, privacy: "private", properties: { exp, enable_chat: true, enable_hand_raising: true, enable_people_ui: true, enable_screenshare: true, experimental_optimize_large_calls: true, max_participants: maxParticipants } };
      const c = await D("/rooms", { method: "POST", body: JSON.stringify(full) });
      if (!c.ok) return J({ error: "daily_error", message: "Could not open the room with the required settings. No fallback room was created." }, 502);
      room = await c.json();
    } else return J({ error: "daily_error", message: "The call service is unavailable right now." }, 502);
    const voice = !!body.voice;
    const rec = Deno.env.get("DAILY_RECORDING") || "local";
    const props: Record<string, unknown> = { room_name: name, user_name: userName, is_owner: owner, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 5, start_video_off: !owner || voice, start_audio_off: !owner, enable_screenshare: owner };
    if (owner && (rec === "cloud" || rec === "local")) props.enable_recording = rec;
    const t = await D("/meeting-tokens", { method: "POST", body: JSON.stringify({ properties: props }) });
    if (!t.ok) return J({ error: "daily_error", message: "Could not create your entry ticket." }, 502);
    const tj = await t.json();
    return J({ ok: true, url: room!.url, token: tj.token, owner });
  } catch (_e) {
    return J({ error: "server", message: "Something went wrong. Please try again." }, 500);
  }
});
