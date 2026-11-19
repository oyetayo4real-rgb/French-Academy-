import fs from "node:fs";
import { URL } from "node:url";

const rawUrl = process.env.FA_SUPABASE_URL;
const anonKey = process.env.FA_SUPABASE_ANON_KEY;
if (!rawUrl || !anonKey) {
  throw new Error("Missing FA_SUPABASE_URL or FA_SUPABASE_ANON_KEY; refusing to build without an explicit backend.");
}
const parsed = new URL(rawUrl);
if (parsed.protocol !== "https:" || parsed.pathname !== "/" || parsed.search || parsed.hash) {
  throw new Error("FA_SUPABASE_URL must be a clean HTTPS project URL.");
}
if (process.env.VERCEL_ENV === "preview" && parsed.hostname !== "pagytaefoumwdvwaohft.supabase.co") {
  throw new Error("Preview builds are restricted to the French Academy staging Supabase project.");
}
if (!anonKey.startsWith("sb_publishable_") && !/^eyJ[A-Za-z0-9_-]+\\./.test(anonKey)) {
  throw new Error("FA_SUPABASE_ANON_KEY is not a recognized Supabase public key.");
}
const config = { supabaseUrl: parsed.origin, supabaseAnonKey: anonKey };
fs.writeFileSync("runtime-config.js", "window.FA_CONFIG = " + JSON.stringify(config) + ";\\n", { mode: 0o644 });
console.log("Generated runtime backend config for " + parsed.hostname);
