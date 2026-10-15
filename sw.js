const V="fa-v7",AUD="fa-audio",CORE=["/","/index.html","/manifest.webmanifest","/icon-192.png","/icon-512.png","/icon-180.png","/icon-maskable-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V&&k!==AUD).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
async function ranged(req,res){const h=req.headers.get("range");if(!h)return res;const b=await res.arrayBuffer(),m=/bytes=(\d+)-(\d*)/.exec(h);if(!m)return res;const s=+m[1],e=m[2]?Math.min(+m[2],b.byteLength-1):b.byteLength-1;
  return new Response(b.slice(s,e+1),{status:206,statusText:"Partial Content",headers:{"Content-Type":res.headers.get("Content-Type")||"audio/mp4","Content-Range":"bytes "+s+"-"+e+"/"+b.byteLength,"Content-Length":String(e-s+1)}})}
self.addEventListener("fetch",e=>{const r=e.request;if(r.method!=="GET")return;const u=new URL(r.url);
  if(u.pathname.includes("/storage/v1/object/public/lesson-audio/")){e.respondWith((async()=>{const c=await caches.open(AUD),m=await c.match(u.href);if(m)return ranged(r,m);try{const n=await fetch(r);if(n.status===200)c.put(u.href,n.clone());return n}catch(x){return Response.error()}})());return}
  if(u.origin!==location.origin)return;
  if(r.mode==="navigate"){e.respondWith(fetch(r).then(n=>{const cp=n.clone();caches.open(V).then(c=>c.put("/index.html",cp));return n}).catch(()=>caches.match("/index.html")));return}
  e.respondWith(caches.match(r).then(m=>m||fetch(r).then(n=>{if(n.ok){const cp=n.clone();caches.open(V).then(c=>c.put(r,cp))}return n})))});
