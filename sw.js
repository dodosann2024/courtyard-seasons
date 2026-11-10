const V="4fe8908448",CORE=["assets/app.a9b1f205f2.js", "assets/ui.ace789515c.js", "assets/thumbs/def.81d03a6673.webp", "assets/thumbs/jp.f47a498518.webp", "assets/thumbs/cn.ee3d2450aa.webp", "assets/thumbs/kr.f3a9e00359.webp", "assets/thumbs/eu.5833743157.webp"];
self.addEventListener("install",e=>{e.waitUntil(caches.open("cy-"+V).then(c=>c.addAll(CORE)).catch(()=>{}).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith("cy-")&&k!=="cy-"+V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  const r=e.request;if(r.method!=="GET")return;
  const u=new URL(r.url);if(u.origin!==location.origin)return;
  const scope=new URL(self.registration.scope).pathname;if(!u.pathname.startsWith(scope))return;
  const rest=u.pathname.slice(scope.length);
  if(rest.startsWith("assets/")){
    e.respondWith(caches.open("cy-"+V).then(c=>c.match(r,{ignoreSearch:true}).then(hit=>hit||fetch(r).then(res=>{if(res.ok&&res.status===200)c.put(r,res.clone());return res}))));
    return;
  }
  if(r.mode==="navigate"){
    e.respondWith(fetch(r).then(res=>{if(res.ok){const cl=res.clone();caches.open("cy-"+V).then(c=>c.put(u.pathname,cl))}return res}).catch(()=>caches.open("cy-"+V).then(c=>c.match(u.pathname)).then(h=>h||caches.match(scope))));
  }
});
