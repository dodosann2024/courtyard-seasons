const V="014e7e-ab5f210478",CORE=["assets/app.e39f7116fb.js", "assets/ui.c5c3998a62.js", "assets/thumbs/def.81d03a6673.webp", "assets/thumbs/jp.f47a498518.webp", "assets/thumbs/cn.ee3d2450aa.webp", "assets/thumbs/kr.f3a9e00359.webp", "assets/thumbs/eu.5833743157.webp", "assets/thumbs/sea.9ec97c1685.webp", "assets/thumbs/desert.1382f4c8a1.webp"];
self.addEventListener("install",e=>{e.waitUntil(caches.open("cy-"+V).then(c=>c.addAll(CORE)).catch(()=>{}).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith("cy-")&&k!=="cy-"+V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
/* only whole, non-empty same-origin 200s are kept: a failed, partial or empty response must never be served again from the cache */
const keep=res=>res.ok&&res.status===200&&res.type==="basic"&&res.headers.get("content-length")!=="0";
self.addEventListener("fetch",e=>{
  const r=e.request;if(r.method!=="GET")return;
  const u=new URL(r.url);if(u.origin!==location.origin)return;
  const scope=new URL(self.registration.scope).pathname;if(!u.pathname.startsWith(scope))return;
  const rest=u.pathname.slice(scope.length);
  /* Safari plays media with Range requests and refuses a whole 200 from the cache for them */
  if(r.headers.has("range"))return;
  if(rest.startsWith("assets/")){
    e.respondWith(caches.open("cy-"+V).then(c=>c.match(r,{ignoreSearch:true}).then(hit=>hit||fetch(r).then(res=>{if(keep(res))c.put(r,res.clone());return res}))));
    return;
  }
  if(r.mode==="navigate"){
    /* the page names the hashed bundles, so it is revalidated past the HTTP cache (GitHub Pages lets it sit there 10 minutes);
       a redirected answer (/desert -> /desert/) goes back through the plain navigation, which Safari accepts */
    const net=fetch(u.href,{cache:"no-cache",credentials:"same-origin"}).then(res=>res.redirected?fetch(r):res).catch(()=>fetch(r));
    e.respondWith(net.then(res=>{if(keep(res)&&!res.redirected){const cl=res.clone();caches.open("cy-"+V).then(c=>c.put(u.pathname,cl))}return res}).catch(()=>caches.open("cy-"+V).then(c=>c.match(u.pathname)).then(h=>h||caches.match(scope))));
  }
});
