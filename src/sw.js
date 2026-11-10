const V="{{VERSION}}",CORE={{CORE}};
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
