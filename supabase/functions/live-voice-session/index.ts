// Authenticated broker for short-lived OpenAI Realtime client secrets.
const cors = {"Access-Control-Allow-Headers":"authorization, apikey, content-type, x-client-info","Access-Control-Allow-Methods":"POST, OPTIONS","Vary":"Origin"};
function allowed(origin:string, env:(n:string)=>string|undefined) {
  const configured=(env("ALLOWED_APP_ORIGINS")||"").split(",").map(x=>x.trim()).filter(Boolean);
  if(configured.includes(origin)) return true;
  try { const u=new URL(origin); return u.protocol==="https:" && /^french-academy-[a-z0-9-]+-vogtay\.vercel\.app$/.test(u.hostname); } catch { return false; }
}
function reply(body:unknown,status:number,origin:string|null) {
  return new Response(JSON.stringify(body),{status,headers:{...cors,...(origin?{"Access-Control-Allow-Origin":origin}:{}),"Content-Type":"application/json","Cache-Control":"no-store"}});
}
async function safetyId(uid:string) {
  const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(uid));
  return btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");
}
Deno.serve(async(req:Request)=>{
  const origin=req.headers.get("Origin"), allowedOrigin=origin&&allowed(origin,n=>Deno.env.get(n))?origin:null;
  if(req.method==="OPTIONS") return allowedOrigin?new Response(null,{status:204,headers:{...cors,"Access-Control-Allow-Origin":allowedOrigin}}):new Response(null,{status:403,headers:cors});
  if(req.method!=="POST") return reply({error:"method_not_allowed"},405,allowedOrigin);
  if(!allowedOrigin) return reply({error:"origin_not_allowed"},403,null);
  const authorization=req.headers.get("Authorization")||"";
  if(!/^Bearer\s+\S+$/i.test(authorization)) return reply({error:"not_signed_in"},401,allowedOrigin);
  const supabaseUrl=Deno.env.get("SUPABASE_URL"), anonKey=Deno.env.get("SUPABASE_ANON_KEY"), openAiKey=Deno.env.get("OPENAI_API_KEY");
  if(!supabaseUrl||!anonKey||!openAiKey) return reply({error:"voice_service_not_configured"},503,allowedOrigin);
  const auth=await fetch(new URL("/auth/v1/user",supabaseUrl),{headers:{apikey:anonKey,Authorization:authorization}});
  if(!auth.ok) return reply({error:"not_signed_in"},401,allowedOrigin);
  const user=await auth.json();
  if(!user||typeof user.id!=="string") return reply({error:"not_signed_in"},401,allowedOrigin);
  let input:Record<string,unknown>;
  try { input=await req.json(); } catch { return reply({error:"invalid_request"},400,allowedOrigin); }
  const level=["none","A1","A2","B1","B2","C1","C2"].includes(String(input.level))?String(input.level):"A1";
  const guided=input.mode!=="conversation", english=input.language!=="fr";
  const instructions=[
    "You are Académie AI Live, a patient expert French language tutor in a real spoken conversation.",
    level==="none"?"The learner is an absolute beginner and may know no French.":"The learner's CEFR guidance level is "+level+"; do not assume mastery from this label.",
    guided?"Use guided teaching: introduce one small idea, model it, invite the learner to try, then give gentle specific feedback. Teach before testing.":"Have a natural two-way conversation and adapt to the learner.",
    english?"Use clear English for explanations with short French examples; gradually increase French as confidence grows.":"Use French primarily, switching briefly to English when the learner is confused or asks.",
    "Speak calmly and naturally at a beginner-friendly pace. Keep turns concise and ask one question at a time.",
    "Correct the most useful one or two errors: acknowledge meaning, model corrected French, then briefly explain.",
    "Never claim to remember prior lessons, scores, or profile data unless explicitly supplied in this session.",
    "Do not claim to assess accent or phoneme accuracy beyond the audio evidence. Stay focused on French learning."
  ].join("\n");
  const session={type:"realtime",model:"gpt-realtime-2.1",output_modalities:["audio"],instructions,
    audio:{input:{transcription:{model:"gpt-4o-mini-transcribe"},turn_detection:{type:"server_vad",threshold:0.5,prefix_padding_ms:300,silence_duration_ms:650,create_response:true,interrupt_response:true}},output:{voice:"marin",speed:0.95}}};
  const upstream=await fetch("https://api.openai.com/v1/realtime/client_secrets",{method:"POST",headers:{Authorization:"Bearer "+openAiKey,"Content-Type":"application/json","OpenAI-Safety-Identifier":await safetyId(user.id)},body:JSON.stringify({expires_after:{anchor:"created_at",seconds:600},session})});
  const data=await upstream.json().catch(()=>({}));
  if(!upstream.ok||typeof data.value!=="string"){console.error("[live-voice] secret creation failed",{status:upstream.status});return reply({error:"voice_session_unavailable"},502,allowedOrigin);}
  return reply({client_secret:data.value,expires_at:data.expires_at,model:data.session?.model||session.model},200,allowedOrigin);
});
