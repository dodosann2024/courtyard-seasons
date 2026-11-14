const V="7879cbb1a8",CORE=["assets/app.2fae386664.js", "assets/ui.3dd1169e60.js", "assets/desert.1c6f5e999f.js", "assets/thumbs/def.81d03a6673.webp", "assets/thumbs/jp.f47a498518.webp", "assets/thumbs/cn.ee3d2450aa.webp", "assets/thumbs/kr.f3a9e00359.webp", "assets/thumbs/eu.5833743157.webp", "assets/thumbs/sea.9ec97c1685.webp", "assets/thumbs/desert.df9d24f7e4.webp", "assets/models/camel.glb", "assets/models/camel_rigged.glb", "assets/models/camel_v2.glb", "assets/models/camel_v3.glb", "assets/models/eagle.glb", "assets/models/eagle_perch.glb", "assets/models/eagle_perch_v2.glb", "assets/models/eagle_rigged.glb", "assets/models/eagle_v3.glb", "assets/models/island.glb", "assets/models/island_base.glb", "assets/models/manifest.json", "assets/models/palm.glb", "assets/models/saguaro.glb", "assets/models/snake.glb", "assets/models/snake_rigged.glb", "assets/models/snake_v3.glb", "assets/models/tent.glb", "assets/vendor/SkeletonUtils.js", "assets/vendor/des-gltf.js", "assets/vendor/three.module.min.js", "assets/vendor/GLTFLoader.js", "assets/tex/palm_bark.jpg", "assets/tex/palm_frond.png", "assets/tex/sandstone.jpg", "assets/tex/sky_backdrop_cloudsea.jpg", "assets/tex/sky_cloudsea.jpg"];
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
