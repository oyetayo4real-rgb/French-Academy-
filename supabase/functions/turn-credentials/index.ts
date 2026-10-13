// Returns short-lived TURN relay credentials (Cloudflare) to signed-in users.
// Needs two secrets in Supabase: CF_TURN_KEY_ID and CF_TURN_API_TOKEN.
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const id = Deno.env.get("CF_TURN_KEY_ID");
  const token = Deno.env.get("CF_TURN_API_TOKEN");
  if (!id || !token) return json({ error: "TURN is not configured" }, 501);
  try {
    const r = await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${id}/credentials/generate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ttl: 86400 }),
    });
    const data = await r.json();
    if (!r.ok) return json({ error: "TURN provider error" }, 502);
    return json(data);
  } catch (_e) {
    return json({ error: "TURN request failed" }, 502);
  }
});
