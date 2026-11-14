/* 沙漠绿洲 · Desert Oasis (desert39) — from desert38: thin campfire smoke,
   muted faceted sandstone rocks, remove snake-trail white lines on sand,
   stronger puff cloud sea. HOLD MERGE. */
(()=>{
window.__desInit=getX=>{
const X=getX(),T=X.T,{Jt,De,Ce,Cn,Ta,Ue,Ct,qt,jt,pi,dc}=X,MOB=!!X.kn;
const V3=T.V3,C3=T.Color,TAU=Math.PI*2,R=9.4,L3=8;
let sd=20261112;const rnd=()=>{sd|=0;sd=sd+0x6D2B79F5|0;let t=Math.imul(sd^sd>>>15,1|sd);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const rr=(a,b)=>a+(b-a)*rnd(),cl=(x,a,b)=>x<a?a:x>b?b:x;
const ss=(a,b,x)=>{const t=cl((x-a)/(b-a),0,1);return t*t*(3-2*t)};
const ease=(k,dt)=>1-Math.exp(-dt*k);
const mix=(a,b,t)=>a+(b-a)*t;
const root=new T.Group();root.visible=false;Jt.add(root);
const onDes=o=>{o.traverse(c=>{c.layers.mask=1|L3})};
const M=(p,o)=>{const m=X.Wt(p,o||{snow:0,wet:0});return m};

/* ---------------- Tripo GLB — prefer rigged (AnimationMixer); procedural fallback ---------------- */
const MODEL={
  camel:"assets/models/camel_v3.glb",
  eagle:"assets/models/eagle_v3.glb",
  eagle_perch:"assets/models/eagle_perch_v2.glb",
  snake:"assets/models/snake_v3.glb",
  island:"assets/models/island.glb",
  island_base:"assets/models/island_base.glb", /* clean top + sandstone underside (drop-in when ready) */
  tent:"assets/models/tent.glb",palm:"assets/models/palm.glb",saguaro:"assets/models/saguaro.glb",
  cactus:"assets/models/saguaro.glb"};
/* Fit metres: island by XZ diameter≈2R; palm pair height; saguaro; tent */
/* camel_v3 1.98 m; eagle_v3 span 2.1 m; perch_v2 ~0.85 m tall; snake_v3 length 1.23 m */
const MODEL_FIT={camel:1.98,camel_v3:1.98,camel_v2:1.98,camel_rigged:1.08,
  eagle:2.1,eagle_v3:2.1,eagle_rigged:.62,eagle_perch:.85,eagle_perch_v2:.85,
  snake:1.23,snake_v3:1.23,snake_rigged:.55,
  island:18.8,island_base:18.8,tent:1.75,palm:4.4,saguaro:2.0,cactus:2.0};
/* island_base native ~1 unit wide; Y scale deepens sandstone tip (~0.6× width) */
const ISLAND_Y_SCALE=1.15;
let _man=null,_gltfMod=null,_VT=null;
function modelsManifest(){if(_man)return _man;const url=((window.CY&&CY.root)||"")+"assets/models/manifest.json";
 _man=fetch(url).then(r=>r.ok?r.json():{}).catch(()=>({}));return _man}
function gltfMod(){if(_gltfMod)return _gltfMod;
  const root=(window.CY&&CY.root)||"";
  const url=root?root+"assets/vendor/des-gltf.js":new URL("../assets/vendor/des-gltf.js",location.href).href;
  _gltfMod=import(url).then(m=>{_VT=m;return m}).catch(()=>{_gltfMod=null;return Promise.reject(0)});return _gltfMod}
function worldBox(scene){
  const box={min:[1e9,1e9,1e9],max:[-1e9,-1e9,-1e9]};
  scene.updateMatrixWorld(true);
  scene.traverse(o=>{if(!o.isMesh||!o.geometry)return;const g=o.geometry;if(!g.boundingBox)g.computeBoundingBox();const b=g.boundingBox;if(!b)return;
    const e=o.matrixWorld.elements;if(!e)return;
    for(let i=0;i<2;i++)for(let j=0;j<2;j++)for(let k=0;k<2;k++){
      const x=i?b.max.x:b.min.x,y=j?b.max.y:b.min.y,z=k?b.max.z:b.min.z;
      const wx=e[0]*x+e[4]*y+e[8]*z+e[12],wy=e[1]*x+e[5]*y+e[9]*z+e[13],wz=e[2]*x+e[6]*y+e[10]*z+e[14];
      if(!Number.isFinite(wx+wy+wz))continue;
      box.min[0]=Math.min(box.min[0],wx);box.min[1]=Math.min(box.min[1],wy);box.min[2]=Math.min(box.min[2],wz);
      box.max[0]=Math.max(box.max[0],wx);box.max[1]=Math.max(box.max[1],wy);box.max[2]=Math.max(box.max[2],wz)}});
  return box}
function fitGLB(scene,key){
  const box=worldBox(scene);
  const sx=Math.max(1e-3,box.max[0]-box.min[0]),sy=Math.max(1e-3,box.max[1]-box.min[1]),sz=Math.max(1e-3,box.max[2]-box.min[2]);
  const target=MODEL_FIT[key]||1;
  let span=sy;
  if(key==="island"||key==="island_base")span=Math.max(sx,sz);
  else if(key.indexOf("snake")>=0)span=Math.max(sx,sz);
  else if(key.indexOf("eagle")>=0&&key.indexOf("perch")<0)span=Math.max(sx,sy*.9);
  else if(key==="palm"||key==="saguaro"||key==="cactus"||key==="tent")span=sy;
  let sc=target/Math.max(1e-3,span);if(!Number.isFinite(sc))sc=1;
  const wrap=new T.Group();
  /* island: tip at minY, centre XZ; clean base gets Y*=0.75 so underside reads like ref */
  if(key==="island"||key==="island_base"){
    scene.position.set(-(box.min[0]+box.max[0])*.5,-box.min[1],-(box.min[2]+box.max[2])*.5);
    wrap.add(scene);
    const ySc=key==="island_base"?sc*ISLAND_Y_SCALE:sc;
    wrap.scale.set(sc,ySc,sc);
    wrap.position.y=0;
    wrap.userData.fitBox={sx:sx*sc,sy:sy*ySc,sz:sz*sc};
  }else{
    scene.position.set(-(box.min[0]+box.max[0])*.5,-box.min[1],-(box.min[2]+box.max[2])*.5);
    wrap.add(scene);wrap.scale.setScalar(sc);
    wrap.userData.fitBox={sx:sx*sc,sy:sy*sc,sz:sz*sc}}
  wrap.userData.fitKey=key;wrap.userData.fitScale=sc;
  return wrap}
function loadGLB(url,key){
  return gltfMod().then(m=>m.loadGLB(url)).then(({scene,animations})=>{
    if(!scene)throw 0;
    scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false}});
    const wrap=fitGLB(scene,key);
    wrap.userData.anims=animations||[];
    wrap.userData.scene=scene;
    return wrap})}
function tryModel(rel,procedural){
  const key=(rel.split("/").pop()||"").replace(/\.glb$/,"");
  return modelsManifest().then(man=>{
    if(!man||!man[key])return {root:procedural(),src:"procedural"};
    const url=((window.CY&&CY.root)||"")+rel;
    return loadGLB(url,key).then(g=>({root:g,src:"glb",key,anims:g.userData.anims||[]})).catch(()=>({root:procedural(),src:"procedural"}))
  }).catch(()=>({root:procedural(),src:"procedural"}))}
function adoptGLB(host,glb){
  if(!host||!glb)return;
  host.children.slice().forEach(ch=>{ch.visible=false});
  glb.visible=true;host.add(glb);host.userData.glb=glb;host.userData.useGlb=1;onDes(glb)}
/* Force Tripo animal albedo to read as authored (sRGB map, no metal wash / emissive).
   Snake: leave baseColor texture unmodified — only colorSpace + lighting. No tint. */
function gradeAnimalMat(m, kind){
  if(!m)return;
  if(m.map){
    try{m.map.colorSpace="srgb"; m.map.needsUpdate=true}catch(_){}
    if(m.color)m.color.set("#ffffff")}
  if(m.emissive){m.emissive.set("#000000"); m.emissiveIntensity=0}
  m.metalness=0;
  if(m.roughness==null||m.roughness>0.95)m.roughness=.82;
  else if(kind==="snake")m.roughness=Math.max(.72, Math.min(.88, m.roughness||.8));
  /* snake: slightly higher env fill so Tripo saddle blotches read under desert sunset (no albedo tint) */
  m.envMapIntensity=kind==="snake"?.28:.1;
  /* snake body: FrontSide only — DoubleSide would show hollow interior if clipped */
  if(kind==="snake"&&m.side!==undefined){
    const hex=m.color&&m.color.getHex?m.color.getHex():0;
    if(hex!==0xc43845)m.side=0}
  m.needsUpdate=true}
function gradeAnimalGLB(root, kind){
  if(!root)return;
  root.traverse(o=>{
    if(!o.isMesh||!o.material)return;
    const ms=Array.isArray(o.material)?o.material:[o.material];
    ms.forEach(m=>gradeAnimalMat(m, kind));
  })}

function mapBones(root){
  const by={};
  root.traverse(o=>{
    if(!o||!o.name)return;
    const n=o.name;
    if(!(o.isBone||/Head|Spine|Tail|Limb|Root|bone_|Armature/.test(n)))return;
    by[n]=o;
    if(!o.userData.restE)o.userData.restE={x:o.rotation.x,y:o.rotation.y,z:o.rotation.z};
  });
  return by}
function bonesMatching(by,re){const o=[];for(const k in by)if(re.test(k))o.push(by[k]);return o}
function slerpRest(bone,t){if(!bone||!bone.userData.restE)return;const r=bone.userData.restE,k=cl(t,0,1);
  bone.rotation.x=mix(bone.rotation.x,r.x,k);bone.rotation.y=mix(bone.rotation.y,r.y,k);bone.rotation.z=mix(bone.rotation.z,r.z,k)}
function addRot(bone,ax,ay,az,w){if(!bone)return;const k=cl(w,0,1);
  bone.rotation.x+=(ax-0)*k;bone.rotation.y+=(ay-0)*k;bone.rotation.z+=(az-0)*k}
function cloneRig(wrap){
  if(!_VT||!_VT.cloneSkinned)return wrap;
  const scene=wrap.userData.scene;if(!scene)return wrap;
  const cloned=_VT.cloneSkinned(scene);
  const nw=fitGLB(cloned,wrap.userData.fitKey||"camel");
  nw.userData.anims=wrap.userData.anims||[];
  nw.userData.scene=cloned;
  return nw}

function canvasTex(S,fn,opts){
  const c=document.createElement("canvas");c.width=c.height=S;const g=c.getContext("2d");
  const id=g.createImageData(S,S),d=id.data;for(let y=0;y<S;y++)for(let x=0;x<S;x++){const o=(y*S+x)*4,v=fn(x,y,S);d[o]=v[0];d[o+1]=v[1];d[o+2]=v[2];d[o+3]=255}
  g.putImageData(id,0,0);const t=new T.CTex(c);t.colorSpace="srgb";t.wrapS=t.wrapT=1000;t.anisotropy=MOB?4:8;
  if(opts&&opts.repeat)t.repeat.set(opts.repeat[0],opts.repeat[1]);return t}
function texUrl(rel){const root=(window.CY&&CY.root)||"";return root+rel}
function loadTex(rel,opts){
  return new Promise((res,rej)=>{
    const img=new Image();img.crossOrigin="anonymous";
    img.onload=()=>{const t=new T.CTex(img);t.colorSpace="srgb";t.wrapS=t.wrapT=(opts&&opts.clamp)?1001:1000;t.anisotropy=MOB?4:8;
      if(opts&&opts.repeat)t.repeat.set(opts.repeat[0],opts.repeat[1]);t.needsUpdate=true;res(t)};
    img.onerror=()=>rej(0);img.src=texUrl(rel)})}
/* SwiftShader/MeshStandard often ignores map.alpha — bake an explicit alphaMap (RGB=A) */
function alphaMapFromTex(tex,clamp){
  const img=tex&&tex.image; if(!img||!img.width)return null;
  const w=img.width,h=img.height,c=document.createElement("canvas");c.width=w;c.height=h;
  const ctx=c.getContext("2d");ctx.drawImage(img,0,0);const id=ctx.getImageData(0,0,w,h),d=id.data;
  for(let i=0;i<d.length;i+=4){const a=d[i+3];d[i]=d[i+1]=d[i+2]=a;d[i+3]=255}
  ctx.putImageData(id,0,0);
  const t=new T.CTex(c);t.colorSpace="";t.wrapS=t.wrapT=clamp?1001:1000;t.anisotropy=MOB?4:8;t.needsUpdate=true;return t}
function fillBlackAlpha(tex){
  /* where alpha is low, force RGB black so leftover samples don't tint */
  const img=tex&&tex.image; if(!img||!img.width)return tex;
  const w=img.width,h=img.height,c=document.createElement("canvas");c.width=w;c.height=h;
  const ctx=c.getContext("2d");ctx.drawImage(img,0,0);const id=ctx.getImageData(0,0,w,h),d=id.data;
  for(let i=0;i<d.length;i+=4){if(d[i+3]<12){d[i]=d[i+1]=d[i+2]=0}}
  ctx.putImageData(id,0,0);
  const t=new T.CTex(c);t.colorSpace="srgb";t.wrapS=tex.wrapS;t.wrapT=tex.wrapT;t.flipY=tex.flipY;t.anisotropy=tex.anisotropy;t.needsUpdate=true;return t}
const TEX={sky:"assets/tex/sky_backdrop_cloudsea.jpg",sandstone:"assets/tex/sandstone.jpg",
  palmBark:"assets/tex/palm_bark.jpg",palmFrond:"assets/tex/palm_frond.png"};
let sandTex=null,skyTex=null,palmBarkTex=null,palmFrondTex=null;
const sandMats=[]; /* cliff + boulder mats waiting for sandstone.jpg */
const palmTrunkMats=[]; /* wait for palm_bark.jpg */
const palmFrondMats=[]; /* wait for palm_frond.png */

/* ---------------- irregular sandstone island + golden dunes ---------------- */
const lakeC={x:-1.6,z:.55}; let lakeR=2.85;
const tentAnchor={x:.2,z:-2.2};
/* underside depth ≈ island width × 0.6 (ref) → tip ~−11.3 m */
const CLIFF_H=11.3;
/* Integer angular harmonics only — avoids u=0/TAU seam in skirt mesh */
function rimR(th){
  const c=Math.cos(th),s=Math.sin(th);
  /* jagged irregular outline (ref), not a smooth blob */
  const jag=.74+.16*Math.sin(th*2+.3)+.1*Math.sin(th*3-1)+.07*Math.sin(th*5+.8)
    +.05*Math.sin(th*7-1.4)+.035*Math.sin(th*9+.2)+.025*Math.sin(th*11-2.1)+.018*Math.sin(th*13+.7);
  const sq=Math.pow(Math.abs(c),1.2)+Math.pow(Math.abs(s),1.2);
  return R*jag*(.7+.3/Math.max(.42,Math.pow(sq,.38)))}
function hNoise(x,z){
  return .1*Math.sin(x*.26+.5)*Math.cos(z*.22-1)
       +.07*Math.sin(x*.55-z*.36+1.4)
       +.04*Math.sin(x*1.15+z*.9)
       +.018*Math.sin(x*2.3-z*1.7)}
/* dune lift only (metres) — crescent behind tent + secondary ridge; used to sculpt Tripo sand */
function duneLift(x,z){
  let h=0;
  /* big crescent behind/right of tent (ref) */
  {const cx=3.6,cz=-4.0, dx=x-cx,dz=z-cz;
   const along=dx*.9+dz*.25, across=-dx*.25+dz*.9;
   const crest=Math.exp(-across*across/(2*.7*.7))*Math.exp(-along*along/(2*2.8*2.8));
   const face=ss(-.15,.55,across); /* lit face vs shadowed lee */
   h+=1.05*crest*mix(.55,1.15,face)}
  /* secondary ridge toward far rim */
  {const cx=5.2,cz=1.2, dx=x-cx,dz=z-cz;
   const along=dx*.55+dz*.8, across=-dx*.8+dz*.55;
   h+=.55*Math.exp(-across*across/(2*.55*.55))*Math.exp(-along*along/(2*2.0*2.0))}
  /* soft wind ripples */
  h+=.045*Math.sin(x*3.1+z*.45)*Math.sin(z*2.8-x*.55)*ss(1.0,4.5,Math.hypot(x,z));
  /* keep tent pad + lake bowl flat */
  const dt=Math.hypot(x-tentAnchor.x,z-tentAnchor.z);
  h*=1-ss(3.2,.35,dt)*.98;
  const dl=Math.hypot(x-lakeC.x,z-lakeC.z);
  h*=1-ss(lakeR*1.35,lakeR*.55,dl)*.95;
  return Math.max(0,h)}
function hAtProc(x,z){
  const th=Math.atan2(z,x),r=Math.hypot(x,z),Rth=rimR(th),edge=ss(Rth*.72,Rth,r);
  let h=.08+hNoise(x,z)+duneLift(x,z);
  /* oasis bowl + wet band */
  const dl=Math.hypot(x-lakeC.x,z-lakeC.z);
  h=mix(h,-.08,ss(lakeR*1.3,lakeR*.25,dl));
  h=mix(h,.015,ss(lakeR*.9,lakeR*1.1,dl)*ss(lakeR*1.45,lakeR*1.15,dl)*.4);
  h*=1-edge;return Math.max(-.1,h)}
let islandMesh=null,islandRoot=null,_hfReady=0,_hf=null,_hfN=96,_hfHalf=R*1.15,_hfFull=null,_sandMed=0;
function alignIslandSand(wrap){
  /* baked palms/tent sit above sand — pin sand median to ≈0, not bbox max */
  const ys=[];
  wrap.updateMatrixWorld(true);
  wrap.traverse(o=>{
    if(!o.isMesh||!o.geometry)return;
    const g=o.geometry; if(!g.attributes.normal)g.computeVertexNormals();
    const pos=g.attributes.position, nor=g.attributes.normal, e=o.matrixWorld.elements;
    if(!pos||!nor)return;
    for(let i=0;i<pos.count;i+=2){
      const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
      const nx=nor.getX(i),ny=nor.getY(i),nz=nor.getZ(i);
      const wy=e[1]*x+e[5]*y+e[9]*z+e[13];
      const wny=e[1]*nx+e[5]*ny+e[9]*nz;
      if(wny>0.5)ys.push(wy)}});
  if(ys.length<50)return 0;
  ys.sort((a,b)=>a-b);
  /* drop tip/cliff lows and palm-crown highs — sand lives mid-upper */
  const lo=ys[(ys.length*.35)|0], hi=ys[(ys.length*.78)|0];
  const band=ys.filter(y=>y>=lo&&y<=hi);
  const med=band[(band.length*.55)|0];
  wrap.position.y-=med; _sandMed=0;
  wrap.updateMatrixWorld(true); return med}
function buildHeightField(mesh){
  /* sand-only max-Y grid (exclude baked prop crowns) + full max for feature detect */
  const N=_hfN, half=_hfHalf, cell=(half*2)/N;
  const grid=new Float32Array(N*N), full=new Float32Array(N*N);
  grid.fill(-1e9); full.fill(-1e9);
  const sandYs=[];
  mesh.updateMatrixWorld(true);
  mesh.traverse(o=>{
    if(!o.isMesh||!o.geometry)return;
    const g=o.geometry; if(!g.attributes.normal)g.computeVertexNormals();
    const pos=g.attributes.position, nor=g.attributes.normal; if(!pos)return;
    const e=o.matrixWorld.elements;
    for(let i=0;i<pos.count;i++){
      const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
      const wx=e[0]*x+e[4]*y+e[8]*z+e[12], wy=e[1]*x+e[5]*y+e[9]*z+e[13], wz=e[2]*x+e[6]*y+e[10]*z+e[14];
      const ix=((wx+half)/cell)|0, iz=((wz+half)/cell)|0;
      if(ix<0||iz<0||ix>=N||iz>=N)continue;
      const j=iz*N+ix; if(wy>full[j])full[j]=wy;
      if(nor){
        const wny=e[1]*nor.getX(i)+e[5]*nor.getY(i)+e[9]*nor.getZ(i);
        if(wny>0.48)sandYs.push(wy)}}});
  sandYs.sort((a,b)=>a-b);
  const med=sandYs.length?sandYs[(sandYs.length*.55)|0]:0;
  _sandMed=med;
  mesh.traverse(o=>{
    if(!o.isMesh||!o.geometry)return;
    const g=o.geometry, pos=g.attributes.position, nor=g.attributes.normal; if(!pos||!nor)return;
    const e=o.matrixWorld.elements;
    for(let i=0;i<pos.count;i++){
      const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
      const wx=e[0]*x+e[4]*y+e[8]*z+e[12], wy=e[1]*x+e[5]*y+e[9]*z+e[13], wz=e[2]*x+e[6]*y+e[10]*z+e[14];
      const wny=e[1]*nor.getX(i)+e[5]*nor.getY(i)+e[9]*nor.getZ(i);
      if(wny<0.45)continue;
      if(wy>med+0.45)continue; /* skip palm/tent crowns + orange lump (camel roof bug) */
      if(wy<med-1.4)continue;
      const ix=((wx+half)/cell)|0, iz=((wz+half)/cell)|0;
      if(ix<0||iz<0||ix>=N||iz>=N)continue;
      const j=iz*N+ix; if(wy>grid[j])grid[j]=wy}});
  for(let pass=0;pass<3;pass++)for(let iz=0;iz<N;iz++)for(let ix=0;ix<N;ix++){
    const j=iz*N+ix; if(grid[j]>-1e8)continue;
    let s=0,c=0;
    for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){
      const x=ix+dx,z=iz+dz; if(x<0||z<0||x>=N||z>=N)continue;
      const v=grid[z*N+x]; if(v>-1e8){s+=v;c++}}
    if(c)grid[j]=s/c}
  for(let i=0;i<grid.length;i++)if(grid[i]<-1e8)grid[i]=med;
  _hf={grid,N,half,cell}; _hfFull={grid:full,N,half,cell}; _hfReady=1; _hfCacheClear()}
let _hfCache=new Map();
function _hfCacheClear(){_hfCache.clear()}
function hAt(x,z){
  if(!_hfReady||!_hf)return hAtProc(x,z);
  const key=((x*5)|0)+':'+(z*5|0);
  if(_hfCache.has(key))return _hfCache.get(key);
  const {grid,N,half,cell}=_hf;
  const fx=(x+half)/cell, fz=(z+half)/cell;
  const ix=cl(fx|0,0,N-2), iz=cl(fz|0,0,N-2);
  const tx=fx-ix, tz=fz-iz;
  const y00=grid[iz*N+ix], y10=grid[iz*N+ix+1], y01=grid[(iz+1)*N+ix], y11=grid[(iz+1)*N+ix+1];
  let y=mix(mix(y00,y10,tx),mix(y01,y11,tx),tz);
  /* never let animals climb baked tent/palm crowns — clamp to sand band */
  if(_sandMed!=null)y=Math.min(y, _sandMed+0.42);
  /* never plant into sunk lake bowl — keep feet on shoreline sand */
  const dL=Math.hypot(x-lakeC.x,z-lakeC.z);
  if(dL<lakeR*1.35){
    const shore=lakeY+0.01;
    const k=ss(lakeR*1.35,lakeR*.95,dL);
    y=Math.max(y, mix(y,shore,k))}
  if(_hfCache.size>5000)_hfCache.clear();
  _hfCache.set(key,y);return y}
function nAt(x,z){const e=.06;const hx=hAt(x+e,z)-hAt(x-e,z),hz=hAt(x,z+e)-hAt(x,z-e);return new V3(-hx,2*e,-hz).normalize()}

/* ---------------- golden sand (ref lit #e3b36a / shade #a87a48) ---------------- */
function buildIsland(){
  const N=MOB?110:160,pos=[],nor=[],uv=[],idx=[],col=[];
  const litC=new C3("#e3b36a"),shC=new C3("#a87a48"),wetC=new C3("#7a5530");
  for(let j=0;j<=N;j++)for(let i=0;i<=N;i++){
    const u=i/N,v=j/N,th=u*TAU,rr0=Math.pow(v,.88)*rimR(th);
    const x=Math.cos(th)*rr0,z=Math.sin(th)*rr0,y=hAt(x,z);
    pos.push(x,y,z);uv.push(x*.32+2,z*.32+2);
    const n=nAt(x,z);nor.push(n.x,n.y,n.z);
    /* sun-grazing from the right (low sun) + soft dune shade */
    const dune=.5+.5*Math.sin(x*.55+z*.4)*Math.sin(z*.7-x*.3);
    const lit=cl(n.x*.9+n.y*.2+n.z*.12+.18+dune*.12,0,1);
    const dl=Math.hypot(x-lakeC.x,z-lakeC.z),wet=ss(lakeR*1.4,lakeR*.92,dl);
    /* kill cream rim: edge verts stay sand shade, never pale */
    const edge=ss(rimR(th)*.78,rimR(th),Math.hypot(x,z));
    const c=litC.clone().lerp(shC,1-lit*.85).lerp(wetC,wet*.7).lerp(shC,edge*.55);
    col.push(c.r,c.g,c.b)}
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){const a=j*(N+1)+i;idx.push(a,a+1,a+N+1,a+1,a+N+2,a+N+1)}
  const g=new T.BG();g.setAttribute("position",new T.BA(new Float32Array(pos),3));
  g.setAttribute("normal",new T.BA(new Float32Array(nor),3));
  g.setAttribute("uv",new T.BA(new Float32Array(uv),2));
  g.setAttribute("color",new T.BA(new Float32Array(col),3));g.setIndex(idx);
  /* near-white ripple map so vertexColors (#e6c48a / #b98d58) dominate — avoid brick multiply */
  const sandMap=canvasTex(256,(x,y,S)=>{
    const nx=x/S,ny=y/S;
    const rip=Math.sin((nx*3.2+ny*.2)*6.28)*.45+Math.sin((nx*.25-ny*2.4)*6.28)*.3;
    const grit=Math.abs(Math.sin(x*2.4+y*1.9)*Math.sin(x*3.6-y*2.5));
    const v=236+rip*10+grit*8+(Math.random()*4-2);return [Math.min(255,v),Math.min(255,v*.96),Math.min(255,v*.88)]},{repeat:[5,5]});
  const bump=canvasTex(128,(x,y)=>{
    const n=Math.sin(x*.12+y*.025)*6.28+Math.sin(x*.035-y*.11);const v=128+n*28+(Math.random()*5-2);return [v,v,v]},{repeat:[10,10]});
  const m=M({map:sandMap,bumpMap:bump,bumpScale:.1,vertexColors:true,roughness:.93,metalness:0,color:new C3("#ffffff")});
  m.onBeforeCompile=(sh)=>{
    sh.fragmentShader=sh.fragmentShader.replace('#include <map_fragment>',
      `#include <map_fragment>
       float spk=smoothstep(.88,.98,fract(sin(dot(vMapUv*140.,vec2(12.9,78.2)))*43758.5));
       diffuseColor.rgb+=spk*vec3(.14,.1,.05)*.28;`);
  };
  const mesh=new T.Mesh(g,m);mesh.receiveShadow=mesh.castShadow=true;return mesh}

/* ---------------- chunky sandstone skirt: painted sandstone.jpg, jagged inverted-cone tip ---------------- */
function buildUnderside(){
  /* desert10: keep desert9 world-triplanar cliff (no UV fan); fog:false so mist never washes skirt */
  const gRoot=new T.Group();
  const NR=MOB?120:180,NV=MOB?48:64;
  const prof=[
    [0.00,-CLIFF_H],[0.05,-CLIFF_H*.94],[0.12,-CLIFF_H*.86],[0.22,-CLIFF_H*.74],
    [0.36,-CLIFF_H*.60],[0.50,-CLIFF_H*.46],[0.64,-CLIFF_H*.32],[0.78,-CLIFF_H*.20],
    [0.88,-CLIFF_H*.11],[0.95,-CLIFF_H*.045],[0.99,-CLIFF_H*.012],[1.00,0.0],[1.03,0.06]
  ];
  const pos=[],uv=[],idx=[],col=[];
  /* ochre sandstone verts — NEVER pale cream (that was the white tip cone) */
  const baseCol=new C3("#b88958"),shadeCol=new C3("#8a5e38"),crevCol=new C3("#5c3c24");
  for(let j=0;j<=NV;j++)for(let i=0;i<=NR;i++){
    const u=i/NR,v=j/NV,th=u*TAU+1.1;
    const pi0=Math.min(prof.length-2,(v*(prof.length-1))|0),fv=v*(prof.length-1)-pi0;
    const p0=prof[pi0],p1=prof[pi0+1];
    let pr=mix(p0[0],p1[0],fv),py=mix(p0[1],p1[1],fv);
    const Rth=rimR(th);
    const deep=cl((-py)/CLIFF_H,0,1);
    const wx=Math.cos(th)*pr*Rth, wz=Math.sin(th)*pr*Rth;
    const o1=Math.sin(wx*.55+deep*2.1)*Math.cos(wz*.48-deep*1.7)*.22
      +Math.sin(wx*.9-wz*.4+deep*3.3)*.14;
    const o2=Math.sin(wx*1.6+wz*1.1)*.08+Math.sin(wz*2.2-wx*.7+deep*5)*.06;
    const o3=Math.sin(wx*3.4+wz*2.8)*.03+Math.sin(wx*5.1-wz*4.2)*.02;
    const crack=Math.pow(Math.abs(Math.sin(wx*.7+wz*.55)*.5+Math.sin(deep*6.2+wx*.3)*.5),1.6);
    const ledgeBand=Math.sin(deep*11.5+wx*.35+wz*.28);
    const ledge=Math.pow(Math.max(0,ledgeBand),2.2)*.16*(deep>.12&&deep<.88?1:0);
    const block=Math.pow(Math.max(0,Math.sin(wx*1.1+deep*5.5)*Math.cos(wz*.9-deep*3.2)),2)*.12;
    let rad=pr*Rth*(1+(o1+o2)*.75*Math.max(.2,deep))+o3*Rth*.6-crack*Rth*.12*deep+ledge*Rth*.28+block*Rth*.18;
    if(deep>.62){
      const tip=ss(.62,1,deep);
      const spikes=[Math.max(0,Math.sin(th*3.2+1.1)),Math.max(0,Math.sin(th*4.7-.9)),
        Math.max(0,Math.sin(th*6.4+.5)),Math.max(0,Math.sin(th*2.4-1.7)),
        Math.max(0,Math.sin(th*8.1+2.0)),Math.max(0,Math.sin(th*5.1+.8))];
      const spike2=Math.pow(Math.max(...spikes),1.25);
      rad*=mix(1,.08+spike2*.85,tip);
      rad+=Math.sin(th*11+deep*17)*.12*Rth*tip*(1-spike2);
      /* soft rocky tip only — no high-frequency spikes (those read as mesh/basket) */
      py-=spike2*CLIFF_H*.08*tip;
      py-=Math.max(0,Math.sin(th*3.1+1))*.08*CLIFF_H*tip}
    const y=py-(Math.abs(o1)*.7+Math.abs(o2)*.45)*deep*CLIFF_H*.09
      -Math.sin(th*3.2+py*.4)*.25*deep-crack*.28*deep-ledge*.15;
    pos.push(Math.cos(th)*rad,y,Math.sin(th)*rad);
    uv.push(u*3.0,deep*CLIFF_H/1.5);
    const lit=cl(.55+o1*.12-deep*.08-crack*.15,0,1);
    let c=baseCol.clone().lerp(shadeCol,1-lit).lerp(crevCol,crack*.22+ledge*.12);
    /* tip verts stay ochre — never pale cream */
    if(deep>.7){const tipC=new C3("#9e7048").lerp(new C3("#7a5230"),(deep-.7)/.3); c.lerp(tipC, ss(.7,1,deep)*.85)}
    col.push(c.r,c.g,c.b)}
  for(let j=0;j<=NV;j++){
    const a=j*(NR+1),b=a+NR;
    pos[b*3]=pos[a*3];pos[b*3+1]=pos[a*3+1];pos[b*3+2]=pos[a*3+2];
    col[b*3]=col[a*3];col[b*3+1]=col[a*3+1];col[b*3+2]=col[a*3+2];uv[b*2]=uv[a*2];uv[b*2+1]=uv[a*2+1]}
  for(let j=0;j<NV;j++)for(let i=0;i<NR;i++){const a=j*(NR+1)+i;idx.push(a,a+1,a+NR+1,a+1,a+NR+2,a+NR+1)}
  const geo=new T.BG();geo.setAttribute("position",new T.BA(new Float32Array(pos),3));
  geo.setAttribute("uv",new T.BA(new Float32Array(uv),2));geo.setAttribute("color",new T.BA(new Float32Array(col),3));
  geo.setIndex(idx);geo.computeVertexNormals();
  {const n=geo.attributes.normal.array;
   for(let j=0;j<=NV;j++){const a=j*(NR+1)*3,b=(j*(NR+1)+NR)*3;
     const nx=(n[a]+n[b])*.5,ny=(n[a+1]+n[b+1])*.5,nz=(n[a+2]+n[b+2])*.5,len=Math.hypot(nx,ny,nz)||1;
     n[a]=n[b]=nx/len;n[a+1]=n[b+1]=ny/len;n[a+2]=n[b+2]=nz/len}
   geo.attributes.normal.needsUpdate=true}
  /* soft sandstone strata — NEVER checker/mortar cells (those read as basket mesh on tip) */
  const rockMap=canvasTex(256,(x,y)=>{
    const nx=x/255,ny=y/255;
    const band=.55+.45*Math.sin(ny*18.0+Math.sin(nx*3.2)*.6);
    const grit=((Math.sin(x*1.7+y*2.3)*Math.sin(x*3.1-y*1.4))*.5+.5);
    const v=148+band*42+grit*18;
    /* warm tan-ochre (ref), not brick-red */
    return [Math.min(255,v*1.05), Math.min(255,v*.82), Math.min(255,v*.55)]},{repeat:[2.2,3.4]});
  rockMap.wrapS=rockMap.wrapT=1000;
  const rockU={map:{value:rockMap},sunDir:{value:new V3(.6,.35,.4)}};
  const rockM=new T.SM({lights:false,fog:false,uniforms:rockU,
    vertexShader:`attribute vec3 color;varying vec3 vW;varying vec3 vN;varying vec3 vC;
      void main(){vC=color;vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vN=normalize(mat3(modelMatrix)*normal);
      gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader:`uniform sampler2D map;uniform vec3 sunDir;varying vec3 vW;varying vec3 vN;varying vec3 vC;
      void main(){
        vec3 wn=normalize(vN);
        /* world triplanar — soft strata, elongated horizontally (sandstone beds) */
        float sY=1./2.4; float sX=1./1.8;
        vec3 blend=pow(abs(wn),vec3(4.)); blend/=(blend.x+blend.y+blend.z+1e-4);
        vec2 ux=vec2(vW.z*sX,vW.y*sY);
        vec2 uy=vec2(vW.x*sX,vW.z*sX*.6);
        vec2 uz=vec2(vW.x*sX,vW.y*sY);
        vec3 cx=texture2D(map,ux).rgb;
        vec3 cy=texture2D(map,uy).rgb;
        vec3 cz=texture2D(map,uz).rgb;
        vec3 tri=cx*blend.x+cy*blend.y+cz*blend.z;
        /* horizontal strata bands */
        float strata=.55+.45*sin(vW.y*2.8+sin(vW.x*.35)*.8);
        vec3 ochre=vec3(0.78,0.58,0.38);
        vec3 light=vec3(0.90,0.74,0.52);
        vec3 deep=vec3(0.48,0.32,0.20);
        vec3 bed=mix(deep,mix(ochre,light,strata),clamp(tri.r*.9+.2,0.,1.));
        float fr=pow(abs(sin(vW.x*.55)*sin(vW.y*.4)*sin(vW.z*.55)),1.4);
        bed=mix(bed*vec3(.72,.62,.52),bed,1.-fr*.28);
        float nd=max(.32,dot(wn,normalize(sunDir)));
        bed*=.55+.55*nd;
        /* continuous sandstone to tip — force ochre, never pale white cone */
        vec3 tipOchre=vec3(0.68,0.48,0.30);
        vec3 tipShade=vec3(0.48,0.32,0.18);
        float tipK=smoothstep(-1.2,-6.5,vW.y);
        bed=mix(bed, mix(tipOchre,tipShade,1.-nd), tipK*.95);
        float paleTip=smoothstep(.48,.78,dot(bed,vec3(.3,.5,.2)));
        bed=mix(bed, tipOchre, max(tipK,paleTip)*.98);
        bed.r=min(bed.r, bed.g*1.1+0.03);
        bed.b=min(bed.b, bed.g*.6);
        gl_FragColor=vec4(bed,1.);
        #include <colorspace_fragment>
      }`});
  const cliff=new T.Mesh(geo,rockM);cliff.castShadow=true;cliff.receiveShadow=true;cliff.frustumCulled=false;gRoot.add(cliff);
  gRoot.userData.rockU=rockU;window.__desCliffU=rockU;
  return gRoot}

/* ---------------- sky_backdrop_cloudsea.jpg — desert19 cumulus mapping, no cyl arc, no blowout ---------------- */
function buildCloudSea(){
  const g=new T.Group();
  /* Contrast-boosted cumulus: darken zenith, warm horizon, keep photo detail (no orange smear). */
  const skyU={uNight:{value:0},uStorm:{value:0},uDay:{value:0},uContrast:{value:1},map:{value:null}};
  const skyM=new T.MSM({
    color:0xffffff, map:null, emissive:0xffffff, emissiveMap:null, emissiveIntensity:1.05,
    roughness:1, metalness:0, side:1, depthWrite:false, depthTest:false, fog:false,
    toneMapped:false});
  skyM.userData.isSkyShader=1; skyM.userData.skyU=skyU;
  skyM.onBeforeCompile=(sh)=>{
    sh.uniforms.uContrast={value:1};
    sh.uniforms.uSkyMode={value:0}; /* 0 sunset, 1 day, 2 night, 3 storm */
    skyM.userData._skyGrade=sh.uniforms;
    if(!/desSkyGrade22/.test(sh.fragmentShader)){
      if(!/vSkyClipY/.test(sh.vertexShader)){
        sh.vertexShader="varying float vSkyClipY;\n"+sh.vertexShader;
        sh.vertexShader=sh.vertexShader.replace('#include <project_vertex>',
          `#include <project_vertex>\n vSkyClipY=gl_Position.y/max(1e-4,gl_Position.w);`);
        sh.fragmentShader="varying float vSkyClipY;\n"+sh.fragmentShader}
      sh.fragmentShader="uniform float uContrast; uniform float uSkyMode;\n"+sh.fragmentShader;
      sh.fragmentShader=sh.fragmentShader.replace('#include <map_fragment>',
        `#include <map_fragment>
         /* desSkyGrade22 */
         {
           float v=vMapUv.y;
           float sy=clamp(vSkyClipY*.5+.5,0.,1.); /* 1 = top of frame */
           vec3 col=diffuseColor.rgb;
           float lum=dot(col,vec3(.3,.55,.15));
           col=clamp((col-.42)*uContrast+.42,0.,1.);
           if(uSkyMode<.5){
             vec3 zen=vec3(0.14,0.12,0.36);
             vec3 lav=vec3(0.46,0.38,0.60);
             vec3 hor=vec3(0.98,0.55,0.28);
             vec3 grad=mix(hor, mix(lav,zen,smoothstep(.45,.92,sy)), smoothstep(.18,.72,sy));
             float cloud=smoothstep(.28,.65,lum);
             vec3 cloudLit=col*vec3(1.4,1.1,.7);
             vec3 cloudSh=mix(col, vec3(0.38,0.32,0.55), .6);
             vec3 cloudCol=mix(cloudSh, cloudLit, smoothstep(.32,.72,lum)*smoothstep(.2,.6,sy));
             col=mix(grad, cloudCol, .35+cloud*.4);
             /* screen-top zenith crush — kill milky wash regardless of UV */
             col=mix(col, zen, smoothstep(.55,.92,sy)*.55);
             col=mix(col, mix(col, lav, .4), smoothstep(.35,.65,sy)*.25);
             /* warm gold lower cloud sea */
             col=mix(col, mix(cloudSh, hor, .35), smoothstep(.55,.08,sy)*.5);
           }else if(uSkyMode<1.5){
             col=mix(col, col*vec3(.8,.9,1.1), smoothstep(.5,.95,sy)*.5);
             col=clamp((col-.5)*1.18+.5,0.,1.);
           }else if(uSkyMode>2.5){
             col=clamp((col-.5)*1.22+.5,0.,1.)*vec3(.8,.72,.64);
           }else{
             col=mix(col*vec3(.1,.12,.26), col*vec3(.26,.32,.48), smoothstep(.1,.85,sy));
           }
           diffuseColor.rgb=col;
         }`);
      sh.fragmentShader=sh.fragmentShader.replace('#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
         totalEmissiveRadiance=diffuseColor.rgb;`);
      sh.fragmentShader=sh.fragmentShader.replace('#include <opaque_fragment>',
        `outgoingLight=diffuseColor.rgb;\n#include <opaque_fragment>`);
    }
  };
  skyM.customProgramCacheKey=()=>"desSkyGrade22e";
  skyM.emissiveIntensity=1;
  const applySkyMap=v=>{
    skyU.map.value=v; skyM.map=v; skyM.emissiveMap=v; skyM.needsUpdate=true};
  const domeGeo=new T.Sphere(200,64,48);
  {const uv=domeGeo.attributes.uv; const arr=uv.array;
    for(let i=0;i<uv.count;i++){
      const v0=arr[i*2+1];
      if(v0>.46&&v0<.58){
        const t=(v0-.46)/.12;
        arr[i*2+1]=mix(v0, .34+.06*t, .55)}
    }
    uv.needsUpdate=true}
  const dome=new T.Mesh(domeGeo,skyM);
  dome.rotation.y=.85;
  dome.rotation.x=.16; /* more lower-hemisphere cloud sea in overview */
  dome.renderOrder=-200;dome.frustumCulled=false;dome.userData.isSky=1;dome.layers.mask=1|L3;
  g.add(dome);g.userData.skyM=skyM;g.userData.dome=dome;g.userData.skyU=skyU;
  g.userData.applySkyMap=applySkyMap;
  g.userData.cylU=null; g.userData.cylM=null; g.userData.applyCylMap=null;
  /* small bright disc (~30 px @1024) + moderate glow — NO hard ray lines */
  const sunCan=document.createElement("canvas");sunCan.width=sunCan.height=128;
  const sg=sunCan.getContext("2d");
  const grd=sg.createRadialGradient(64,64,1,64,64,42);
  grd.addColorStop(0,"rgba(255,252,245,1)");grd.addColorStop(.08,"rgba(255,245,210,1)");
  grd.addColorStop(.18,"rgba(255,220,150,.7)");grd.addColorStop(.4,"rgba(255,180,90,.2)");
  grd.addColorStop(.7,"rgba(255,150,60,.05)");grd.addColorStop(1,"rgba(255,140,50,0)");
  sg.fillStyle=grd;sg.fillRect(0,0,128,128);
  const sunTex=new T.CTex(sunCan);sunTex.colorSpace="srgb";
  const sunM=new T.MSM({
    map:sunTex, color:0xffffff, emissive:0xffe8b0, emissiveMap:sunTex, emissiveIntensity:1.7,
    transparent:true, depthWrite:false, depthTest:false, fog:false, side:2,
    roughness:1, metalness:0, toneMapped:false, opacity:.92});
  const sunDisc=new T.Mesh(new T.Plane(3.4,3.4),sunM);
  sunDisc.position.set(22,15,-40);
  sunDisc.renderOrder=-180;sunDisc.frustumCulled=false;sunDisc.layers.mask=1|L3;
  sunDisc.userData.isSun=1;
  g.add(sunDisc);g.userData.sunDisc=sunDisc;g.userData.sunM=sunM;
  g.userData.sprites=new T.Group(); g.userData.cumulus=[]; g.userData.seaMats=[];
  g.userData.setModeTint=(day,night,storm)=>{
    let c, ei, mode, contrast;
    if(night>.5){c=new C3("#ffffff"); ei=1; mode=2; contrast=1.2}
    else if(storm>.3){c=new C3("#ffffff"); ei=1; mode=3; contrast=1.18}
    else if(day){c=new C3("#ffffff"); ei=1; mode=1; contrast=1.2}
    else {c=new C3("#ffffff"); ei=1; mode=0; contrast=1.55} /* sunset: punchy cumulus */
    skyM.color.copy(c); skyM.emissive.copy(c); skyM.emissiveIntensity=ei;
    const gu=skyM.userData._skyGrade;
    if(gu){if(gu.uContrast)gu.uContrast.value=contrast; if(gu.uSkyMode)gu.uSkyMode.value=mode}
    if(sunDisc){
      sunDisc.visible=!(night>.5)&&!(storm>.3);
      if(sunM){sunM.emissiveIntensity=day?.9:1.8; sunM.opacity=day?.4:.92}}
    if(window.__desCloudFloor&&window.__desCloudFloor.userData.setTint)
      window.__desCloudFloor.userData.setTint(day,night,storm);
  };
  g.frustumCulled=false; g.layers.mask=1|L3;
  return g}
function placeSoftDepthCards(){ /* no vertical billboards */ }
function addCloudFloorLayers(){ /* far horizontal disc only */ }

/* puff cumulus bank below / around island — brighter sunlit tops, soft lavender shadows */
function buildPuffCloudBank(){
  const n=MOB?48:80;
  const can=document.createElement("canvas");can.width=can.height=128;
  {const g=can.getContext("2d");
    /* soft multi-lobe cumulus sprite: brighter core + lavender rim */
    for(let i=0;i<28;i++){const x=rr(24,104),y=rr(30,100),s=rr(18,46);
      const r=g.createRadialGradient(x,y,0,x,y,s);
      r.addColorStop(0,"rgba(255,252,248,.85)");r.addColorStop(.4,"rgba(242,228,214,.55)");
      r.addColorStop(.7,"rgba(186,168,198,.32)");r.addColorStop(1,"rgba(150,140,175,0)");
      g.fillStyle=r;g.fillRect(0,0,128,128)}}
  const tex=new T.CTex(can);tex.colorSpace="srgb";
  const p=new Float32Array(n*3),a=new Float32Array(n),s=new Float32Array(n);
  const g=new T.BG();g.setAttribute("position",new T.BA(p,3));g.setAttribute("aA",new T.BA(a,1));g.setAttribute("aS",new T.BA(s,1));
  /* sunlit warm top with soft lavender shadow tint */
  const uC={value:new C3(.98,.93,.88)};
  const m=new T.SM({transparent:true,depthWrite:false,fog:false,blending:1,
    uniforms:{tS:{value:tex},uSc:{value:760},uC},
    vertexShader:`attribute float aA,aS;uniform float uSc;varying float vA;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;float d=max(.5,-mv.z);gl_PointSize=aA<.003?0.:min(aS*uSc/d,720.);vA=aA;}`,
    fragmentShader:`uniform sampler2D tS;uniform vec3 uC;varying float vA;void main(){vec4 s=texture2D(tS,gl_PointCoord);float a=s.a*vA;if(a<.01)discard;float sh=smoothstep(.15,.85,length(gl_PointCoord-.5));gl_FragColor=vec4(mix(uC,vec3(.72,.64,.82),sh*.35),a);}`});
  const o=new T.Points(g,m);o.frustumCulled=false;o.renderOrder=-40;o.layers.mask=1|L3;
  const CB=[];
  for(let i=0;i<n;i++){
    /* denser bed under rim + wider field around island */
    const near=i<n*.45;
    const th=i/n*TAU+rr(-.08,.08), rad=near?rr(R*.55,R*1.35):rr(R*1.1,R*2.8);
    const y=near?rr(-CLIFF_H*.85,-CLIFF_H*.12):rr(-CLIFF_H-2.2,-CLIFF_H*.25);
    CB.push({th,rad,y,sz:near?rr(11,20):rr(10,19),ph:rnd()*TAU,w:rr(.003,.01)});
    p[i*3]=Math.cos(th)*rad;p[i*3+1]=y;p[i*3+2]=Math.sin(th)*rad;
    a[i]=rr(.58,.78); s[i]=CB[i].sz}
  root.add(o);onDes(o);
  window.__desPuffBank={o,p,a,s,g,m,uC,CB,n};
  return o}

const island=buildIsland(),under=buildUnderside(),cloudSea=buildCloudSea();
root.add(island);root.add(under);root.add(cloudSea);onDes(island);onDes(under);onDes(cloudSea);
buildPuffCloudBank();
/* ONE large horizontal cloud-sea disc FAR below island — never intersects deck.
   y ≈ underside tip − 25 m; radius ≥ 400 m; depthWrite false; draw before island. */
(function buildFarCloudSeaDisc(){
  const tipY=-10; /* island_base tip ≈ −8..−10; keep ≥6 m clear of underside */
  const y=tipY-25; /* ≈ −35 */
  const rad=420;
  /* placeholder until sky_backdrop loads */
  const fb=document.createElement("canvas");fb.width=fb.height=8;const fx=fb.getContext("2d");
  fx.fillStyle="#f0c090";fx.fillRect(0,0,8,8);
  const fbTex=new T.CTex(fb);fbTex.colorSpace="srgb";
  const floorU={map:{value:fbTex},op:{value:.92},tint:{value:new C3("#ffe8d0")}};
  const floorM=new T.SM({transparent:true,depthWrite:false,depthTest:true,fog:false,side:2,uniforms:floorU,
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform sampler2D map;uniform float op;uniform vec3 tint;varying vec2 vUv;
     void main(){
       /* desCloudFloor24 — gold-lavender tint + soft radial fade; mirrored cloud-sea tex */
       float r=length(vUv-.5)*2.;
       float fade=smoothstep(1.02,.52,r);
       vec3 col=texture2D(map,vUv).rgb*tint;
       float lum=dot(col,vec3(.3,.55,.15));
       vec3 lit=col*vec3(1.22,1.05,.72);
       vec3 shc=mix(col, vec3(0.42,0.34,0.58), .55);
       col=mix(shc, lit, smoothstep(.28,.7,lum));
       float a=op*fade;
       if(a<.02)discard;
       gl_FragColor=vec4(col,a);
     }`});
  const floor=new T.Mesh(new T.Plane(rad*2,rad*2),floorM);
  floor.rotation.x=-Math.PI*.5;
  floor.position.set(0,y,0);
  floor.renderOrder=-190; floor.frustumCulled=false; floor.layers.mask=1|L3;
  floor.userData.isCloudFloor=1;
  root.add(floor); onDes(floor);
  window.__desCloudFloor=floor; window.__desCloudFloorM=floor;
  cloudSea.userData.cloudFloor=floor;
  cloudSea.userData.applyCloudFloorMap=(tex)=>{
    if(!tex)return;
    const t=tex.clone?tex.clone():tex;
    t.wrapS=1002; t.wrapT=1002; /* MirroredRepeat */
    t.repeat.set(3.2,3.2); t.offset.set(0,.22); /* bias toward cloud-sea V band */
    t.colorSpace="srgb"; t.needsUpdate=true;
    floorU.map.value=t};
  /* mode tint via uniforms — setModeTint updates op/tint */
  floor.userData.setTint=(day,night,storm)=>{
    floor.visible=!(night>.5);
    floorU.op.value=night>.5?0:storm>.3?.5:day?.62:.92;
    floorU.tint.value.set(night>.5?"#6878a0":day?"#f2eee8":"#ffe8d0")};
})();
(function initSkyAndSea(){
  const fb=document.createElement("canvas");fb.width=fb.height=4;const fx=fb.getContext("2d");
  fx.fillStyle="#f0a868";fx.fillRect(0,0,4,4);
  const fbTex=new T.CTex(fb);fbTex.colorSpace="srgb";
  if(cloudSea.userData.applySkyMap)cloudSea.userData.applySkyMap(fbTex);
  else if(cloudSea.userData.skyU)cloudSea.userData.skyU.map.value=fbTex;
  loadTex(TEX.sky,{clamp:0}).then(tex=>{
    skyTex=tex; tex.colorSpace="srgb";
    /* MirroredRepeatWrapping — soft seams for side/below */
    tex.wrapS=1002; tex.wrapT=1002; tex.flipY=true; tex.needsUpdate=true;
    if(cloudSea.userData.applySkyMap)cloudSea.userData.applySkyMap(tex);
    if(cloudSea.userData.applyCloudFloorMap)cloudSea.userData.applyCloudFloorMap(tex);
  }).catch(()=>{});
})();
loadTex(TEX.sandstone).then(tex=>{
  sandTex=tex;tex.wrapS=tex.wrapT=1000;tex.colorSpace="srgb";
  sandMats.forEach(m=>{m.map=tex; if(m.color)m.color.set("#e3b36a"); m.needsUpdate=true});
  /* rim rocks keep muted procedural ochre — do NOT apply sandstone.jpg (reads tomato-red) */
  if(window.__desRockMats)window.__desRockMats.forEach(m=>{if(m.color)m.color.set("#a89068"); m.needsUpdate=true});
  /* feed real sandstone into cliff triplanar (replaces procedural strata canvas) */
  if(window.__desCliffU&&window.__desCliffU.map){window.__desCliffU.map.value=tex;tex.needsUpdate=true}
}).catch(()=>{});
loadTex(TEX.palmBark).then(tex=>{
  palmBarkTex=tex;tex.wrapS=tex.wrapT=1000;tex.colorSpace="srgb";
  /* Tube UV after swap: u=around, v=along; ~16 diamonds/tex → 12 cm ⇒ repeat circ/1.92 × len/1.92 */
  tex.repeat.set(0.55,2.15);
  palmTrunkMats.forEach(m=>{m.map=tex;m.color.set("#c8b49a");m.needsUpdate=true});
}).catch(()=>{});
loadTex(TEX.palmFrond,{clamp:1}).then(tex=>{
  /* darken frond RGB so stacked alpha strips never blow to white at the crown */
  let colorTex=fillBlackAlpha(tex);
  try{
    const img=colorTex.image; if(img&&img.width){
      const c=document.createElement("canvas");c.width=img.width;c.height=img.height;
      const ctx=c.getContext("2d");ctx.drawImage(img,0,0);
      const id=ctx.getImageData(0,0,c.width,c.height),d=id.data;
      for(let i=0;i<d.length;i+=4){
        if(d[i+3]<8)continue;
        d[i]=d[i]*.62|0;d[i+1]=d[i+1]*.68|0;d[i+2]=d[i+2]*.45|0;
        const lum=.3*d[i]+.55*d[i+1]+.15*d[i+2];
        if(lum>140){const k=140/lum;d[i]=d[i]*k|0;d[i+1]=d[i+1]*k|0;d[i+2]=d[i+2]*k|0}}
      ctx.putImageData(id,0,0);
      colorTex=new T.CTex(c);colorTex.colorSpace="srgb";colorTex.flipY=true;colorTex.needsUpdate=true}
  }catch(e){colorTex.flipY=true;colorTex.colorSpace="srgb"}
  const aMap=alphaMapFromTex(tex,1); if(aMap)aMap.flipY=true;
  palmFrondTex=colorTex; palmFrondTex.userData.alphaMap=aMap;
  palmFrondMats.forEach(m=>{
    if(m.uniforms){m.uniforms.map.value=colorTex; if(aMap){m.uniforms.alphaMap.value=aMap;m.uniforms.hasA.value=1}}
    m.map=colorTex; if(aMap)m.alphaMap=aMap;
    m.transparent=true;m.alphaTest=.55;m.depthWrite=true;m.needsUpdate=true});
}).catch(()=>{});

/* ---------------- oasis lake — larger irregular oval ---------------- */
let lakeY=-.04;
const lakeG=new T.BG();
{const N=64,pos=[],uv=[];for(let j=0;j<=N;j++)for(let i=0;i<=N;i++){
  const u=i/N,v=j/N,th=u*TAU;
  const e=.88+.08*Math.sin(th*2.3)+.05*Math.sin(th*5.1+.7); /* irregular oval */
  const rr0=v*lakeR*e*(1+.08*Math.sin(th*3.2));
  const x=lakeC.x+Math.cos(th)*rr0*1.15,z=lakeC.z+Math.sin(th)*rr0*.88;
  pos.push(x,lakeY,z);uv.push(u,v)}
 const idx=[];for(let j=0;j<N;j++)for(let i=0;i<N;i++){const a=j*(N+1)+i;idx.push(a,a+1,a+N+1,a+1,a+N+2,a+N+1)}
 lakeG.setAttribute("position",new T.BA(new Float32Array(pos),3));lakeG.setAttribute("uv",new T.BA(new Float32Array(uv),2));lakeG.setIndex(idx);lakeG.computeVertexNormals()}
/* soft shore: wet sand → light teal shallows → #2e7f86 centre; fog:false */
/* centre #237a82 → shore #6fb3ae by distance from shore — no muddy blob, no noise blotches */
const lakeU={uT:{value:0},uWind:{value:.04},uNight:{value:0},uSunDir:{value:new V3(.85,.18,.15)},uSunCol:{value:new C3(1,.72,.4)},uMoonC:{value:new C3(.55,.68,.95)},uSky:{value:new C3(.55,.48,.62)},uDeep:{value:new C3("#237a82")},uShal:{value:new C3("#6fb3ae")}};
/* depthTest:true, depthWrite:false — spit below waterY stays covered; soft rim must NOT write depth
   or shore grass (alpha) gets buried. Grass/props write depth so they occlude the lake. */
const lakeM=new T.SM({transparent:true,depthWrite:false,depthTest:true,fog:false,side:0,
 polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1,uniforms:lakeU,
 vertexShader:`varying vec3 vW;varying vec2 vUv;void main(){vUv=uv;vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
 fragmentShader:`uniform float uT,uWind,uNight;uniform vec3 uSunDir,uSunCol,uMoonC,uSky,uDeep,uShal;varying vec3 vW;varying vec2 vUv;
 void main(){
  float r=length(vUv-.5)*2.;
  if(r>1.005)discard;
  float edge=smoothstep(1.0,.82,r);
  float fromShore=1.-smoothstep(.12,.98,r);
  vec2 p=vW.xz*.28;
  float rip=.0002*(sin(p.x*1.5+uT*.035)+sin(p.y*1.3-uT*.03))*(.02+.05*uWind)*edge;
  vec3 N=normalize(vec3(-rip*2.2,1.,rip*2.0));
  vec3 V=normalize(cameraPosition-vW);
  float fres=pow(max(1e-4,1.-max(0.,dot(N,V))),2.8)*edge;
  float refl=min(.16, .03+.12*fres);
  /* uniform teal gradient — centre #237a82 → edge #6fb3ae; no brown */
  vec3 water=mix(uShal, uDeep, pow(fromShore,.55));
  vec3 skyR=mix(uSky*vec3(.75,.88,.92), uSunCol*.12+uSky*.5, .05+.08*max(0.,reflect(-V,N).y));
  skyR=min(skyR, vec3(.42,.5,.54));
  vec3 col=mix(water, skyR, refl*.35);
  col+=uMoonC*uNight*(.01+.025*fres);
  float sunSpec=pow(max(1e-4,dot(reflect(-normalize(uSunDir),N),V)),340.)*(.01+.025*(1.-uNight))*edge;
  col+=uSunCol*sunSpec;
  /* opaque over basin; soft only at outermost lip (must not cover shore grass) */
  float a=max(edge, fromShore>.04?1.:edge);
  gl_FragColor=vec4(col,a);
 }`});
const lake=new T.Mesh(lakeG,lakeM);lake.renderOrder=2;lake.frustumCulled=false;root.add(lake);onDes(lake);
lake.userData.ox=lakeC.x;lake.userData.oz=lakeC.z;
const lakeBed=new T.Mesh(lakeG.clone(),M({color:"#1a555c",roughness:1}));lakeBed.position.y=-.14;lakeBed.scale.set(1.01,1,1.01);root.add(lakeBed);onDes(lakeBed);
lakeBed.visible=false; /* hide flat dark disc under water */
/* NO wetRing dark green disc — was reading as flat dark green ring around lake */

/* thin natural grass fringe + reeds along shore (rebuilt after lake seats) */
const reedG=new T.Group();root.add(reedG);
let _shoreTuftM=null;
function makeShoreTuftM(){
  if(_shoreTuftM){_shoreTuftM.depthWrite=true;_shoreTuftM.alphaTest=.35;return _shoreTuftM}
  const lc=document.createElement("canvas");lc.width=lc.height=64;const lctx=lc.getContext("2d");
  const lid=lctx.createImageData(64,64);
  for(let y=0;y<64;y++)for(let x=0;x<64;x++){
    const u=x/64,v=y/64,edge=Math.min(u,1-u)*2;
    const a=Math.floor(ss(0,.18,edge)*ss(1,.02,v)*(1-Math.abs(u-.5)*1.2)*255);
    const dry=v>.65;const o=(y*64+x)*4;
    lid.data[o]=dry?140:70;lid.data[o+1]=dry?145:110;lid.data[o+2]=dry?55:40;lid.data[o+3]=a}
  lctx.putImageData(lid,0,0);
  const bladeMap=new T.CTex(lc);bladeMap.colorSpace="srgb";
  _shoreTuftM=M({map:bladeMap,color:"#5a7a3a",roughness:.92,side:2,transparent:true,alphaTest:.35,depthWrite:true});
  return _shoreTuftM}
function reseatShoreGreen(){
  while(reedG.children.length)reedG.remove(reedG.children[0]);
  const tuftM=makeShoreTuftM();
  const nTuft=MOB?34:52, nReed=MOB?8:14;
  for(let i=0;i<nTuft;i++){
    const a=rnd()*TAU,r=lakeR+rr(.22,.55);
    const e=.96+.04*Math.sin(a*2.2);
    const x=lakeC.x+Math.cos(a)*r*e,z=lakeC.z+Math.sin(a)*r*e*.98;
    if(Math.hypot(x-lakeC.x,z-lakeC.z)<lakeR+0.18)continue;
    if(Math.hypot(x,z)>R-0.5)continue;
    const y=Math.max(hAt(x,z),lakeY+.02);
    const g=new T.Group();g.position.set(x,y,z);
    const n=3+((rnd()*3)|0);
    for(let k=0;k<n;k++){
      const h=rr(.03,.09),w=rr(.005,.013);
      const blade=new T.Mesh(new T.Plane(w,h),tuftM);
      blade.position.set(rr(-.025,.025),h*.42,rr(-.025,.025));
      blade.rotation.y=rnd()*TAU;blade.rotation.z=rr(-.35,.35);blade.rotation.x=rr(.2,.5);
      g.add(blade)}
    g.userData.ph=rnd()*TAU;reedG.add(g)}
  /* reed/shrub clumps along part of the shore (ref) */
  for(let i=0;i<nReed;i++){
    const a=-.4+i*(2.4/Math.max(1,nReed-1))+rr(-.08,.08);
    const r=lakeR+rr(.18,.42);
    const x=lakeC.x+Math.cos(a)*r,z=lakeC.z+Math.sin(a)*r*.97;
    if(Math.hypot(x,z)>R-0.6)continue;
    const y=Math.max(hAt(x,z),lakeY+.02);
    const g=new T.Group();g.position.set(x,y,z);
    for(let k=0;k<5;k++){
      const h=rr(.14,.28),w=rr(.008,.015);
      const blade=new T.Mesh(new T.Plane(w,h),tuftM);
      blade.position.set(rr(-.035,.035),h*.45,rr(-.035,.035));
      blade.rotation.y=rnd()*TAU;blade.rotation.z=rr(-.25,.25);blade.rotation.x=rr(.05,.28);
      g.add(blade)}
    reedG.add(g)}
}
reseatShoreGreen();

/* sandstone boulders — muted cliff ochre, irregular facets, partly sunk (ref) */
const rockG=new T.Group();root.add(rockG);window.__desRockMats=[];window.__desRockG=rockG;
function placeRimRocks(){
  while(rockG.children.length)rockG.remove(rockG.children[0]);
  window.__desRockMats.length=0;
  /* muted tan/ochre matching cliff — solid (NO sandstone.jpg: that map reads tomato-red) */
  const rkCan=document.createElement("canvas");rkCan.width=rkCan.height=64;
  {const g=rkCan.getContext("2d"),id=g.createImageData(64,64);
    for(let y=0;y<64;y++)for(let x=0;x<64;x++){
      const n=.88+.12*Math.sin(x*.35+y*.2)*Math.sin(x*.15-y*.4);
      const o=(y*64+x)*4;
      id.data[o]=Math.floor(168*n);id.data[o+1]=Math.floor(138*n);id.data[o+2]=Math.floor(96*n);id.data[o+3]=255}
    g.putImageData(id,0,0)}
  const rkTex=new T.CTex(rkCan);rkTex.colorSpace="srgb";rkTex.wrapS=rkTex.wrapT=1000;
  const rockM=M({color:"#a89068",map:rkTex,roughness:.98,metalness:0,
    emissive:"#000000",emissiveIntensity:0});
  window.__desRockMats.push(rockM);
  const aoM=M({color:"#4a3828",roughness:1,transparent:true,opacity:.42,depthWrite:false});
  function rockMesh(s){
    /* low-segment sphere + vertex jitter → irregular faceted boulder (not a tomato) */
    const geo=new T.Sphere(s*.48,5,4);
    const pos=geo.attributes.position;
    for(let i=0;i<pos.count;i++){
      const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
      const n=1+rr(-.2,.28)+.1*Math.sin(x*6.5+z*4.2+y*3);
      pos.setXYZ(i,x*n*(.85+rr(0,.35)), y*n*(.5+rr(0,.25)), z*n*(.8+rr(0,.35)))}
    pos.needsUpdate=true; geo.computeVertexNormals();
    const rk=new T.Mesh(geo,rockM);
    rk.scale.set(rr(.95,1.25),rr(.5,.8),rr(.9,1.3));
    return rk}
  function placeAt(x,z,s){
    if(Math.hypot(x,z)>R-0.4)return;
    if(Math.hypot(x-lakeC.x,z-lakeC.z)<lakeR+.2)return;
    if(Math.hypot(x-tentAnchor.x,z-tentAnchor.z)<1.8)return;
    const y=hAt(x,z); const rk=rockMesh(s);
    /* sink ~30% into sand */
    rk.position.set(x, y - s*.28, z);
    rk.rotation.set(rr(0,1.2),rr(0,TAU),rr(0,1.0));
    rk.castShadow=rk.receiveShadow=true; onDes(rk); rockG.add(rk);
    /* soft AO contact disc */
    const ao=new T.Mesh(new T.Plane(s*1.15,s*1.15),aoM);
    ao.rotation.x=-Math.PI/2; ao.position.set(x,y+.006,z); ao.renderOrder=1;
    onDes(ao); rockG.add(ao)}
  /* rim clusters (ref) */
  const rimN=MOB?7:11;
  for(let i=0;i<rimN;i++){
    const th=(i/rimN)*TAU+rr(-.1,.1), rad=R*(.74+rr(0,.14));
    placeAt(Math.cos(th)*rad, Math.sin(th)*rad, rr(.35,1.15));
    if(rnd()<.45) placeAt(Math.cos(th+rr(-.08,.08))*(rad-rr(.15,.4)), Math.sin(th)*(rad-rr(.1,.35)), rr(.28,.7))}
  for(let i=0;i<(MOB?2:4);i++){
    const a=rnd()*TAU, rad=lakeR+rr(.7,2.4);
    placeAt(lakeC.x+Math.cos(a)*rad, lakeC.z+Math.sin(a)*rad*.95, rr(.3,.75))}
  for(let i=0;i<(MOB?1:3);i++){
    const a=rnd()*TAU, rad=rr(R*.4,R*.62);
    placeAt(Math.cos(a)*rad, Math.sin(a)*rad*.9, rr(.4,.95))}}
placeRimRocks();
const shrubs=[];
(function makeShrubs(){
  /* filled by rebuildShoreGreen after lake seats */
})();

/* ---------------- date palms — tapered curved trunk (palm_bark.jpg) + bent frond strips ---------------- */
function makeFrondMat(tex,tint){
  /* unlit — MeshStandard lit + alpha fringe was the crown white glow */
  let aMap=(tex&&tex.userData&&tex.userData.alphaMap)||null;
  const col=(tint&&tint.clone)?tint.clone():new C3(tint||"#4a6028");
  if(!tex){
    const c=document.createElement("canvas");c.width=c.height=4;const g=c.getContext("2d");
    g.fillStyle="#3a5020";g.fillRect(0,0,4,4);
    tex=new T.CTex(c);tex.colorSpace="srgb";tex.needsUpdate=true;
    const ac=document.createElement("canvas");ac.width=ac.height=4;const ag=ac.getContext("2d");
    ag.fillStyle="#fff";ag.fillRect(0,0,4,4);
    aMap=new T.CTex(ac);aMap.colorSpace="";aMap.needsUpdate=true}
  const m=new T.SM({transparent:false,depthWrite:true,fog:false,side:2,depthTest:true,
    uniforms:{map:{value:tex},alphaMap:{value:aMap},color:{value:col},hasA:{value:aMap?1:0}},
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform sampler2D map,alphaMap;uniform vec3 color;uniform float hasA;varying vec2 vUv;
      void main(){
        vec4 t=texture2D(map,vUv);
        float a=hasA>.5?texture2D(alphaMap,vUv).g:t.a;
        if(a<.55)discard;
        vec3 c=t.rgb*color;
        float lum=dot(c,vec3(.3,.55,.15));
        if(lum>.42)c*=.42/lum;
        gl_FragColor=vec4(c,1.);
        #include <colorspace_fragment>
      }`});
  m.userData.isFrond=1;m.userData.col=col;
  Object.defineProperty(m,"color",{get(){return m.userData.col},set(v){if(v&&v.isColor)m.userData.col.copy(v);else if(v)m.userData.col.set(v)},configurable:true});
  m.map=tex;m.alphaMap=aMap;m.transparent=false;m.alphaTest=.55;m.roughness=1;m.metalness=0;
  m.clone=function(){return makeFrondMat(this.map,this.color)};
  return m}

function makeFrondStrip(len,segs,wid0,mat){
  /* ribbon of quads: smooth arch up then droop; UV V stem-base→tip along length */
  const pos=[],uvs=[],idx=[];
  for(let i=0;i<=segs;i++){
    const t=i/segs;
    /* smooth curve: rise early, droop late — avoid jagged plank folds */
    const arch=Math.sin(Math.min(1,t*1.05)*Math.PI)*.55;
    const droop=t*t*(1.15+.35*t);
    const y=arch-droop;
    const z=t*len;
    const flare=.5+.5*Math.sin(Math.min(1,t*1.15)*Math.PI);
    const w=wid0*flare*(1-t*.12);
    pos.push(-w*.5,y,z, w*.5,y,z);
    uvs.push(0,t, 1,t)}
  for(let i=0;i<segs;i++){const a=i*2;idx.push(a,a+1,a+2, a+1,a+3,a+2)}
  const geo=new T.BG();
  geo.setAttribute("position",new T.BA(new Float32Array(pos),3));
  geo.setAttribute("uv",new T.BA(new Float32Array(uvs),2));
  geo.setIndex(idx);geo.computeVertexNormals();
  const mesh=new T.Mesh(geo,mat);mesh.castShadow=true;mesh.frustumCulled=false;return mesh}
function makePalm(leanDir){
  const g=new T.Group();
  const trunkM=M({color:palmBarkTex?"#c8b49a":"#8a7a62",map:palmBarkTex||null,roughness:.92,metalness:0,vertexColors:true});
  palmTrunkMats.push(trunkM);
  const frondM=makeFrondMat(palmFrondTex,new C3("#4a6028"));
  palmFrondMats.push(frondM);
  const dateM=M({color:"#7a3a18",roughness:.85});
  const lean=leanDir!=null?leanDir:rr(.1,.16),leanZ=rr(-.06,.06);
  const H=4.15,pts=[];
  for(let i=0;i<=28;i++){const t=i/28;
    /* gentle S-curve lean, tapered later via radius scale */
    pts.push(new V3(lean*t*t*3.6+Math.sin(t*Math.PI)*.1,t*H,leanZ*t*t*3.2+Math.sin(t*2.1)*.04))}
  const tube=new T.Tube(new T.Curve(pts),40,.16,14,false);
  /* cylindrical UV: Tube is u=along, v=around → swap so bark V runs up the trunk */
  {const uv=tube.attributes.uv,arr=uv.array;
    for(let i=0;i<arr.length;i+=2){const u=arr[i],v=arr[i+1];arr[i]=v;arr[i+1]=u}
    uv.needsUpdate=true}
  /* taper + darken toward base via vertex colours */
  {const arr=tube.attributes.position.array,n=arr.length/3;
    const cols=new Float32Array(n*3);
    for(let i=0;i<n;i++){
      const yy=cl(arr[i*3+1]/H,0,1),rScale=1-yy*.52;
      arr[i*3]*=rScale;arr[i*3+2]*=rScale;
      const dk=mix(.85,1.12,Math.pow(yy,.7)); /* slight darken toward base — keep bark readable */
      cols[i*3]=dk;cols[i*3+1]=dk*.98;cols[i*3+2]=dk*.92}
    tube.setAttribute("color",new T.BA(cols,3));
    tube.computeVertexNormals()}
  /* mid circumference ≈ 2π*0.11 ≈ 0.7 → ~0.55 tex repeats for 12 cm diamonds */
  if(palmBarkTex){trunkM.map=palmBarkTex;trunkM.color.set("#c8b49a")}
  const trunkMesh=new T.Mesh(tube,trunkM);trunkMesh.castShadow=true;trunkMesh.receiveShadow=true;g.add(trunkMesh);
  const tip=pts[pts.length-1];
  const crown=new T.Group();crown.position.copy(tip);crown.position.y+=.04;g.add(crown);
  const nFrond=MOB?16:20;
  for(let i=0;i<nFrond;i++){
    const fr=new T.Group();
    fr.rotation.y=(i/nFrond)*TAU+rr(-.08,.08);
    const low=i<3||rnd()<.12; /* lower drooping brown fronds */
    const elev=low?rr(1.05,1.45):rr(.22,.85);
    fr.rotation.x=elev;
    fr.rotation.z=rr(-.12,.12); /* slight twist */
    fr.userData.ph=rnd()*TAU;fr.userData.baseX=fr.rotation.x;fr.userData.baseZ=fr.rotation.z;
    const len=rr(2.6,3.5),segs=MOB?9:12,wid=rr(1.05,1.45);
    /* per-frond tint — multiply over palm_frond.png (keep near-white greens; brown for lower) */
    /* keep frond luminance well below white — stacked strips must not glow */
    const tint=low
      ? new C3(rr(.38,.5),rr(.28,.36),rr(.12,.18))
      : new C3(rr(.42,.55),rr(.48,.62),rr(.18,.28));
    const mat=makeFrondMat(palmFrondTex,tint);palmFrondMats.push(mat);
    if(palmFrondTex)mat.map=palmFrondTex;
    const strip=makeFrondStrip(len,segs,wid,mat);
    strip.rotation.z=rr(-.2,.2);
    fr.add(strip);crown.add(fr)}
  for(let i=0;i<5;i++){const d=new T.Mesh(new T.Sphere(.05,6,5),dateM);d.scale.set(1,1.8,1);d.position.set(Math.cos(i*1.4)*.1,-.22,Math.sin(i*1.4)*.1);crown.add(d)}
  g.userData={crown,kind:"palm"};return g}
const palms=[];
(function placePalms(){
  /* two palms leaning apart like the ref */
  const spots=[
    {x:lakeC.x+.75,z:lakeC.z+.7,lean:.14,yaw:-.25},
    {x:lakeC.x+1.45,z:lakeC.z-.55,lean:-.13,yaw:.35}
  ];
  spots.forEach(sp=>{const p=makePalm(sp.lean);p.scale.setScalar(1);p.position.set(sp.x,hAt(sp.x,sp.z),sp.z);p.rotation.y=sp.yaw;onDes(p);root.add(p);palms.push(p)})
})();

/* ---------------- saguaros — desaturated #6b8445 / #4f6a33, subtle rib shading ---------------- */
function makeCactus(opts){
  opts=opts||{};const g=new T.Group();
  /* desaturated olive — crest #6b8445, valley #4f6a33 (not toy green) */
  const ribMap=canvasTex(128,(x,y)=>{
    const th=(x/128)*Math.PI*2;const rib=.5+.5*Math.cos(th*12);
    const t=rib;
    const r=mix(58,82,t),gg=mix(78,100,t),b=mix(38,50,t);
    return [r,gg,b]},{repeat:[1,4]});
  const m=M({map:ribMap,color:new C3("#a8a898"),roughness:.97,emissive:new C3("#000000"),emissiveIntensity:0});
  m.onBeforeCompile=(sh)=>{
    sh.fragmentShader=sh.fragmentShader.replace('#include <map_fragment>',
      `#include <map_fragment>
       float rib=pow(abs(sin(vMapUv.x*37.7)),1.15);
       diffuseColor.rgb=mix(vec3(.22,.30,.14), diffuseColor.rgb, 1.-rib*.55);
       float sp=step(.95,fract(sin(dot(vMapUv*90.,vec2(12.1,78.3)))*43758.5))*step(.6,1.-rib);
       diffuseColor.rgb+=sp*vec3(.12,.12,.1);`);
  };
  const H=opts.h||1.35,R0=opts.r||.13;
  const trunk=new T.Mesh(new T.Cyl(R0,R0*1.08,H,MOB?18:24,1),m);
  const pa=trunk.geometry.attributes.position.array;
  for(let i=0;i<pa.length;i+=3){const th=Math.atan2(pa[i+2],pa[i]);const rib=.022*Math.sin(th*12);const rr2=Math.hypot(pa[i],pa[i+2])+rib;pa[i]=Math.cos(th)*rr2;pa[i+2]=Math.sin(th)*rr2}
  trunk.geometry.computeVertexNormals();trunk.position.y=H*.5;trunk.castShadow=true;trunk.receiveShadow=true;g.add(trunk);
  /* irregular ribbed cap — grooves continue over the dome (not a smooth toy ball) */
  const top=new T.Mesh(new T.Sphere(R0*1.08,20,16),m);
  {const tp=top.geometry.attributes.position.array;
   for(let i=0;i<tp.length;i+=3){
     const th=Math.atan2(tp[i+2],tp[i]);const yy=tp[i+1];
     const rib=.028*Math.sin(th*12)*(yy>-.15?1:.35);
     const rr2=Math.hypot(tp[i],tp[i+2])+rib;
     const wob=.02*Math.sin(th*5.3+yy*9)+.01*Math.sin(th*3.1);
     tp[i]=Math.cos(th)*(rr2+wob);tp[i+2]=Math.sin(th)*(rr2+wob);
     if(yy>0)tp[i+1]*=.78+.06*Math.sin(th*4)+rr(0,.05)}
   top.geometry.computeVertexNormals()}
  top.scale.set(1,.78,1);top.position.y=H-.02;g.add(top);
  g.userData.perch={x:0,y:H+.02,z:0};
  const arms=opts.arms!=null?opts.arms:2;
  for(let i=0;i<arms;i++){
    const side=i%2?1:-1,ah=rr(H*.35,H*.52),arm=new T.Group();arm.position.y=ah;
    const segs=10;let ax=0,ay=0,az=0;
    for(let s=0;s<segs;s++){
      const t=s/(segs-1);
      const ang=side*(Math.PI/2)*ss(0,1,Math.min(1,t*1.15))*(1-ss(.55,1,t)*.85);
      const len=.09;const c=new T.Mesh(new T.Cyl(R0*.5,R0*.48,len,14),m);
      const cpa=c.geometry.attributes.position.array;
      for(let j=0;j<cpa.length;j+=3){const th=Math.atan2(cpa[j+2],cpa[j]);const rib=.014*Math.sin(th*10);const rr2=Math.hypot(cpa[j],cpa[j+2])+rib;cpa[j]=Math.cos(th)*rr2;cpa[j+2]=Math.sin(th)*rr2}
      c.geometry.computeVertexNormals();
      ax+=Math.sin(ang)*len;ay+=Math.cos(ang)*len;
      c.position.set(ax,ay,az);c.rotation.z=-ang;arm.add(c)}
    const tip=new T.Mesh(new T.Sphere(R0*.55,14,12),m);
    {const tp=tip.geometry.attributes.position.array;
     for(let j=0;j<tp.length;j+=3){const th=Math.atan2(tp[j+2],tp[j]);const yy=tp[j+1];
       const rib=.018*Math.sin(th*10)*(yy>0?1:.4);const rr2=Math.hypot(tp[j],tp[j+2])+rib;
       tp[j]=Math.cos(th)*rr2;tp[j+2]=Math.sin(th)*rr2;if(yy>0)tp[j+1]*=.82}
     tip.geometry.computeVertexNormals()}
    tip.scale.set(1,.82,1);tip.position.set(ax,ay+.03,az);arm.add(tip);
    arm.rotation.y=rr(-.2,.2)+i*.15;g.add(arm)}
  return g}
const cacti=[];
(function placeCacti(){
  const spots=[
    {x:-5.8,z:3.6,h:1.55,r:.14,arms:2,perch:1},
    {x:4.6,z:1.6,h:1.35,r:.12,arms:2},
    {x:3.5,z:-3.5,h:1.2,r:.11,arms:1}
  ];
  spots.forEach(sp=>{if(Math.hypot(sp.x,sp.z)>R-0.6)return;
    if(!sp.perch&&Math.hypot(sp.x-lakeC.x,sp.z-lakeC.z)<lakeR*1.45)return;
    const c=makeCactus(sp);c.position.set(sp.x,hAt(sp.x,sp.z),sp.z);c.rotation.y=rr(0,TAU);onDes(c);root.add(c);cacti.push(c);
    if(sp.perch)c.userData.isPerch=1;
    /* keep procedural ribbed saguaro */});
})();
let eaglePerch=cacti.find(c=>c.userData.isPerch)||cacti[0];

/* ---------------- Bedouin tent — closed form: ridge, catenary roof, back+sides, open front flap ---------------- */
function makeTentProcedural(){
  const g=new T.Group();
  const clothMap=canvasTex(256,(x,y)=>{
    const stripe=((y/28)|0)%2;
    const weave=Math.sin(x*.85)*.5+Math.sin(y*.55)*.35;
    const v=stripe?182+weave:142+weave;
    return [v,v*.86,v*.68]},{repeat:[1,2.2]});
  const cloth=M({map:clothMap,color:"#e4d4bc",roughness:.95,side:2,metalness:0});
  const poleM=M({color:"#3a2818",roughness:.9}),ropeM=M({color:"#5a4830",roughness:.95});
  const w=2.4,d=2.15,ridge=1.18,eave=.22;
  const zF=d*.5,zM=0,zB=-d*.5;
  const hF=ridge*.9,hM=ridge,hB=ridge*.86;
  function ridgeY(z){
    if(z>=zM){const t=cl((z-zM)/(zF-zM),0,1);return mix(hM,hF,t)-.16*Math.sin(t*Math.PI)}
    const t=cl((z-zB)/(zM-zB),0,1);return mix(hB,hM,t)-.16*Math.sin(t*Math.PI)}
  function eaveYAt(z){return eave+.04*Math.sin(cl((z-zB)/(zF-zB),0,1)*Math.PI)}
  function makeClothMesh(pos,uvs,idx,flutter){
    const geo=new T.BG();geo.setAttribute("position",new T.BA(new Float32Array(pos),3));
    geo.setAttribute("uv",new T.BA(new Float32Array(uvs),2));geo.setIndex(idx);geo.computeVertexNormals();
    const mesh=new T.Mesh(geo,cloth);mesh.castShadow=mesh.receiveShadow=true;mesh.userData.flutter=flutter;return mesh}
  function roofPanel(side){
    const Nu=12,Nv=16,pos=[],uvs=[],idx=[],flutter=[];
    for(let j=0;j<=Nv;j++)for(let i=0;i<=Nu;i++){
      const u=i/Nu,v=j/Nv,z=mix(zF,zB,v),ry=ridgeY(z),ey=eaveYAt(z);
      const x=mix(0,side*w*.52,u);
      /* cloth sag across slope + along ridge */
      const y=mix(ry,ey,Math.pow(u,.9))-.08*Math.sin(u*Math.PI)-.04*Math.sin(v*Math.PI*2);
      pos.push(x,y,z);uvs.push(u*1.7+v*.15,v*2.2);
      flutter.push((v<.1&&u>.5)?1:0)}
    for(let j=0;j<Nv;j++)for(let i=0;i<Nu;i++){const a=j*(Nu+1)+i;
      if(side<0)idx.push(a,a+Nu+1,a+1,a+1,a+Nu+1,a+Nu+2);
      else idx.push(a,a+1,a+Nu+1,a+1,a+Nu+2,a+Nu+1)}
    return makeClothMesh(pos,uvs,idx,flutter)}
  const left=roofPanel(-1),right=roofPanel(1);
  g.add(left);g.add(right);g.userData.cloths=[left,right];
  /* triangular back wall fully closed to ground */
  {const Nu=12,Nv=10,pos=[],uvs=[],idx=[],flutter=[];
   for(let j=0;j<=Nv;j++)for(let i=0;i<=Nu;i++){
     const u=i/Nu,v=j/Nv,x=(u-.5)*w*.98;
     const across=Math.abs(u-.5)*2;
     const top=ridgeY(zB)*Math.max(0,1-Math.pow(across,1.15));
     const sag=Math.sin(u*Math.PI)*.06;
     const y=mix(.015,top,Math.pow(v,.8))-sag*(1-v);
     pos.push(x,y,zB-.02+sag*.1);uvs.push(u*2.1,v);flutter.push(0)}
   for(let j=0;j<Nv;j++)for(let i=0;i<Nu;i++){const a=j*(Nu+1)+i;idx.push(a,a+1,a+Nu+1,a+1,a+Nu+2,a+Nu+1)}
   const back=makeClothMesh(pos,uvs,idx,flutter);g.add(back);g.userData.cloths.push(back)}
  /* side walls: eave → ground, full depth except open front lip */
  function sideWall(side){
    const Nu=8,Nv=14,pos=[],uvs=[],idx=[],flutter=[];
    for(let j=0;j<=Nv;j++)for(let i=0;i<=Nu;i++){
      const u=i/Nu,v=j/Nv;
      const z=mix(zF*.55,zB*.98,v); /* leave front opening */
      const ey=eaveYAt(z);
      const xE=side*w*.52,xG=side*w*.72;
      const x=mix(xE,xG,Math.pow(1-u,.85));
      const y=mix(ey,.015,Math.pow(1-u,.9))+.02*Math.sin(v*Math.PI)*u;
      pos.push(x,y,z);uvs.push(u*1.3,v*2.2);flutter.push((v<.06||v>.94)?1:0)}
    for(let j=0;j<Nv;j++)for(let i=0;i<Nu;i++){const a=j*(Nu+1)+i;
      if(side<0)idx.push(a,a+Nu+1,a+1,a+1,a+Nu+1,a+Nu+2);
      else idx.push(a,a+1,a+Nu+1,a+1,a+Nu+2,a+Nu+1)}
    return makeClothMesh(pos,uvs,idx,flutter)}
  const swL=sideWall(-1),swR=sideWall(1);g.add(swL);g.add(swR);g.userData.cloths.push(swL,swR);
  /* front cheek walls either side of entrance */
  function cheek(side){
    const Nu=5,Nv=6,pos=[],uvs=[],idx=[],flutter=[];
    for(let j=0;j<=Nv;j++)for(let i=0;i<=Nu;i++){
      const u=i/Nu,v=j/Nv;
      const x=mix(side*w*.18,side*w*.52,u);
      const z=mix(zF*.55,zF*.92,v);
      const top=mix(ridgeY(z)*.55,eaveYAt(z),u);
      const y=mix(.015,top,Math.pow(j/Nv,.85));
      pos.push(x,y,z);uvs.push(u,v);flutter.push(v>.85?1:0)}
    for(let j=0;j<Nv;j++)for(let i=0;i<Nu;i++){const a=j*(Nu+1)+i;idx.push(a,a+1,a+Nu+1,a+1,a+Nu+2,a+Nu+1)}
    return makeClothMesh(pos,uvs,idx,flutter)}
  const chL=cheek(-1),chR=cheek(1);g.add(chL);g.add(chR);g.userData.cloths.push(chL,chR);
  /* rolled flap above open front */
  {const flap=new T.Mesh(new T.Cyl(.05,.05,w*.42,12,1,true),cloth);
   flap.rotation.z=Math.PI/2;flap.position.set(0,eave+.08,zF*.9);flap.castShadow=true;g.add(flap);
   const Nu=10,Nv=4,pos=[],uvs=[],idx=[],flutter=[];
   for(let j=0;j<=Nv;j++)for(let i=0;i<=Nu;i++){
     const u=i/Nu,v=j/Nv,x=(u-.5)*w*.4;
     const y=eave+.04-v*.32-.03*Math.sin(u*Math.PI);const z=zF*.86+v*.1;
     pos.push(x,y,z);uvs.push(u*1.6,v);flutter.push(1)}
   for(let j=0;j<Nv;j++)for(let i=0;i<Nu;i++){const a=j*(Nu+1)+i;idx.push(a,a+1,a+Nu+1,a+1,a+Nu+2,a+Nu+1)}
   const hang=makeClothMesh(pos,uvs,idx,flutter);g.add(hang);g.userData.cloths.push(hang)}
  /* ridge poles + eave poles */
  [[0,zF,hF],[0,zM,hM],[0,zB,hB]].forEach(([x,z,h])=>{
    const p=new T.Mesh(new T.Cyl(.015,.012,h,6),poleM);p.position.set(x,h*.5,z);p.castShadow=true;g.add(p)});
  /* ridge beam */
  {const beam=new T.Mesh(new T.Cyl(.01,.01,d*1.02,5),poleM);
   beam.rotation.x=Math.PI/2;beam.position.set(0,ridge*.93,0);g.add(beam)}
  [[-w*.5,zF*.45,eave],[w*.5,zF*.45,eave],[-w*.5,zB*.7,eave],[w*.5,zB*.7,eave]].forEach(([x,z,h])=>{
    const p=new T.Mesh(new T.Cyl(.01,.009,h,5),poleM);p.position.set(x,h*.5,z);g.add(p)});
  [[-w*.78,d*.55],[w*.78,d*.55],[-w*.78,-d*.55],[w*.78,-d*.55],[-w*.85,0],[w*.85,0]].forEach(([x,z])=>{
    const peg=new T.Mesh(new T.Cyl(.01,.01,.05,5),poleM);peg.position.set(x,.02,z);g.add(peg);
    const start=new V3(Math.sign(x)*w*.52,eave+.02,z*.55),end=new V3(x,.02,z);
    const len=start.distanceTo(end);
    const rope=new T.Mesh(new T.Cyl(.0035,.0035,len,4),ropeM);
    rope.position.copy(start.clone().add(end).multiplyScalar(.5));
    rope.lookAt(end);rope.rotateX(Math.PI/2);g.add(rope)});
  return g}
const tentY=hAt(tentAnchor.x,tentAnchor.z);
let tent=makeTentProcedural();tent.position.set(tentAnchor.x,tentY,tentAnchor.z);tent.rotation.y=-.35;onDes(tent);root.add(tent);
/* procedural tent is fallback only — hide until proven needed (Tripo tent preferred) */
tent.visible=false;

/* contact blob shadows — SwiftShader often skips real shadow maps; keep props grounded */
/* unlit soft contact shadows (ShaderMaterial — MeshStandard lit them orange) */
const blobM=new T.SM({transparent:true,depthWrite:false,fog:false,
  uniforms:{col:{value:new C3(.02,.015,.01)},op:{value:.22}},
  vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`uniform vec3 col;uniform float op;varying vec2 vUv;
    void main(){float r=length(vUv-.5)*2.;float a=op*pow(smoothstep(1.0,.05,r),2.2);gl_FragColor=vec4(col,a);}`});
function addBlob(x,z,sx,sz){
  const b=new T.Mesh(new T.Plane(sx,sz),blobM);b.rotation.x=-Math.PI/2;
  b.position.set(x,hAt(x,z)+.01,z);b.renderOrder=1;onDes(b);root.add(b);return b}
/* tiny soft grounding only — no large black/orange discs */
palms.forEach(p=>addBlob(p.position.x,p.position.z,.4,.32));
cacti.forEach(c=>addBlob(c.position.x,c.position.z,.22,.18));
/* tent blob removed — looked like a dirty orange lump in front of striped tent */

/* campfire — stone ring sitting ON sand + logs + flame + smoke */
const fireG=new T.Group();const firePos={x:tentAnchor.x-1.35,z:tentAnchor.z+.85};
fireG.position.set(firePos.x,hAt(firePos.x,firePos.z),firePos.z);root.add(fireG);onDes(fireG);
(function makeFire(){
  const stoneM=M({color:"#5a4a3a",map:sandTex||null,roughness:.97}),logM=M({color:"#2a1810",roughness:.95});
  const stoneGrey=M({color:"#8a8680",roughness:.96});
  for(let i=0;i<7;i++){
    /* small grey stones (ref) — not big black balls */
    const s=new T.Mesh(new T.Sphere(rr(.028,.042),7,5),stoneGrey);
    const a=i/7*TAU;
    s.position.set(Math.cos(a)*.18, rr(.018,.028), Math.sin(a)*.18);
    s.scale.set(rr(1.0,1.3), rr(.55,.75), rr(1.0,1.25));
    s.rotation.set(rr(0,.6),rr(0,TAU),rr(0,.6));
    s.castShadow=true; fireG.add(s)}
  for(let i=0;i<3;i++){
    const log=new T.Mesh(new T.Cyl(.022,.028,.22,6),logM);
    log.rotation.z=Math.PI/2+.06;log.rotation.y=i*TAU/3+.2;log.position.y=.04;fireG.add(log)}
  /* additive flame sprites ~40 cm tall */
  const flameCan=document.createElement("canvas");flameCan.width=flameCan.height=64;
  const fx=flameCan.getContext("2d");
  const grd=fx.createRadialGradient(32,52,1,32,28,26);
  grd.addColorStop(0,"rgba(255,245,180,1)");grd.addColorStop(.3,"rgba(255,150,40,.9)");
  grd.addColorStop(.65,"rgba(220,50,10,.4)");grd.addColorStop(1,"rgba(0,0,0,0)");
  fx.fillStyle=grd;fx.fillRect(0,0,64,64);
  fx.globalCompositeOperation="destination-in";
  fx.beginPath();fx.moveTo(32,60);fx.quadraticCurveTo(14,40,28,6);fx.quadraticCurveTo(36,6,50,40);fx.closePath();fx.fill();
  const flameTex=new T.CTex(flameCan);flameTex.colorSpace="srgb";
  const flames=[];
  for(let i=0;i<5;i++){
    const fm=new T.SM({transparent:true,depthWrite:false,fog:false,side:2,blending:2,
      uniforms:{map:{value:flameTex},op:{value:.7}},
      vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader:`uniform sampler2D map;uniform float op;varying vec2 vUv;void main(){vec4 c=texture2D(map,vUv);float a=c.a*op;if(a<.04)discard;gl_FragColor=vec4(c.rgb,a);}`});
    const fl=new T.Mesh(new T.Plane(.12+i*.025,.32+i*.04),fm); /* ~40cm */
    fl.position.set(rr(-.03,.03),.12+i*.035,rr(-.03,.03));fl.renderOrder=6;fireG.add(fl);flames.push(fl)}
  fireG.userData.flames=flames;fireG.userData.glow=null;
  const fireL=new T.PL(new C3("#ff9a4a"),0,6,2);fireL.position.set(0,.35,0);fireL.layers.mask=1|L3;fireG.add(fireL);fireG.userData.light=fireL;
  const tentL=new T.PL(new C3("#ffb070"),0,3.2,2);tentL.position.set(1.0,.4,-.5);tentL.layers.mask=1|L3;fireG.add(tentL);fireG.userData.tentL=tentL;
})();
/* campfire smoke — ONE thin wispy column (soft noise filaments, not round balls).
   Base ~0.15 m, widens slowly; opacity peaks ~0.32, fades out by ~3.5–4 m. */
const SMN=MOB?16:22;
const smCan=document.createElement("canvas");smCan.width=48;smCan.height=128;
{const g=smCan.getContext("2d"), id=g.createImageData(48,128);
  for(let y=0;y<128;y++)for(let x=0;x<48;x++){
    const u=(x-24)/24, v=y/128;
    /* filamentary wisps — elongated soft ribbons, not circular lobes */
    const wiggle=Math.sin(v*11+u*2.4)*.1+Math.sin(v*23+u*5.5)*.045;
    const half=.14+v*.38+wiggle;
    const d=Math.abs(u-Math.sin(v*7.5)*.08)/Math.max(.06,half);
    const filament=.35+.65*Math.pow(Math.max(0,Math.sin(x*1.1+y*.55)*Math.sin(x*.45-y*.9)),1.6);
    const a=Math.max(0,1-d*d)*Math.pow(1-v,1.25)*filament*.85;
    const o=(y*48+x)*4; id.data[o]=210;id.data[o+1]=208;id.data[o+2]=204;id.data[o+3]=Math.floor(cl(a,0,1)*255)}
  g.putImageData(id,0,0)}
const smTex=new T.CTex(smCan);smTex.colorSpace="srgb";
const smGroup=new T.Group(); root.add(smGroup); onDes(smGroup); window.__desSmoke=smGroup;
const SMF=[];
for(let i=0;i<SMN;i++){
  const mat=new T.SM({transparent:true,depthWrite:false,fog:false,side:2,blending:1,
    uniforms:{map:{value:smTex},op:{value:0},col:{value:new C3(.7,.69,.67)}},
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform sampler2D map;uniform float op;uniform vec3 col;varying vec2 vUv;
      void main(){float a=texture2D(map,vUv).a*op;if(a<.02)discard;gl_FragColor=vec4(col,a);}`});
  const mesh=new T.Mesh(new T.Plane(.14,.7),mat);
  mesh.renderOrder=7; mesh.frustumCulled=false; smGroup.add(mesh);
  SMF.push({mesh,mat,life:i/SMN, ph:rnd()*TAU, jx:rr(-1,1), jz:rr(-1,1)})}

/* ---------------- camel — barrel body, S-neck, knobby legs ---------------- */
function makeCamelProcedural(){
  const g=new T.Group();
  const fur=M({color:"#c4a06c",roughness:.88}),dark=M({color:"#6a4a32",roughness:.86}),pad=M({color:"#3a2a1c",roughness:.95});
  /* deep barrel body */
  const body=new T.Mesh(new T.Sphere(1,14,10),fur);body.scale.set(.42,.36,.72);body.position.y=.95;body.castShadow=true;g.add(body);
  /* one hump sitting on the back (not a floating egg) */
  const hump=new T.Mesh(new T.Sphere(.28,12,10),fur);hump.position.set(0,1.28,-.05);hump.scale.set(1.05,1.15,.9);hump.castShadow=true;g.add(hump);
  /* S-curved neck: rise then droop to head */
  const neck=new T.Group();neck.position.set(0,.95,.5);g.add(neck);
  const n1=new T.Mesh(new T.Cyl(.08,.07,.28,8),fur);n1.position.set(0,.14,.08);n1.rotation.x=.35;n1.castShadow=true;neck.add(n1);
  const n2=new T.Mesh(new T.Cyl(.07,.055,.32,8),fur);n2.position.set(0,.38,.22);n2.rotation.x=.95;n2.castShadow=true;neck.add(n2);
  const n3=new T.Mesh(new T.Cyl(.055,.045,.18,7),fur);n3.position.set(0,.52,.42);n3.rotation.x=1.35;neck.add(n3);
  const head=new T.Group();head.position.set(0,.55,.55);neck.add(head);
  const hd=new T.Mesh(new T.Sphere(.11,8,7),fur);hd.scale.set(.85,.65,1.55);hd.castShadow=true;head.add(hd);
  const sn=new T.Mesh(new T.Sphere(.055,6,5),dark);sn.position.set(0,-.02,.18);sn.scale.set(1,.6,1.3);head.add(sn);
  [[.07,.09,.0],[-.07,.09,.0]].forEach(([x,y,z])=>{const e=new T.Mesh(new T.Sphere(.028,5,4),fur);e.position.set(x,y,z);e.scale.set(.4,1.3,.3);head.add(e)});
  const legs=[];
  [[.18,.32],[.18,-.38],[-.18,.32],[-.18,-.38]].forEach(([lx,lz])=>{
    const L=new T.Group();L.position.set(lx,.92,lz);g.add(L);
    const up=new T.Mesh(new T.Cyl(.055,.048,.38,8),fur);up.position.y=-.16;up.castShadow=true;L.add(up);
    const knee=new T.Mesh(new T.Sphere(.055,7,6),dark);knee.position.y=-.36;L.add(knee);
    const lo=new T.Mesh(new T.Cyl(.042,.035,.4,7),fur);lo.position.y=-.58;L.add(lo);
    const foot=new T.Mesh(new T.Sphere(.055,8,6),pad);foot.scale.set(1.15,.7,1.2);foot.position.y=-.78;L.add(foot);
    legs.push({L,up,lo,knee,foot,side:lx>0?1:-1,fore:lz>0?1:0})});
  const tail=new T.Mesh(new T.Cyl(.02,.006,.35,5),dark);tail.position.set(0,.9,-.7);tail.rotation.x=.7;g.add(tail);
  g.userData={neck,head,legs,body,kind:"camel"};
  /* overall ~1.15m to hump top */
  g.scale.setScalar(1);return g}
function sampleGroundY(x,z){
  /* fresh HF sample every call — skip cache so ridge camels stay planted */
  if(!_hfReady||!_hf)return hAtProc(x,z);
  const {grid,N,half,cell}=_hf;
  const fx=(x+half)/cell, fz=(z+half)/cell;
  const ix=cl(fx|0,0,N-2), iz=cl(fz|0,0,N-2);
  const tx=fx-ix, tz=fz-iz;
  const y00=grid[iz*N+ix], y10=grid[iz*N+ix+1], y01=grid[(iz+1)*N+ix], y11=grid[(iz+1)*N+ix+1];
  let y=mix(mix(y00,y10,tx),mix(y01,y11,tx),tz);
  if(_sandMed!=null)y=Math.min(y, _sandMed+0.42);
  const dL=Math.hypot(x-lakeC.x,z-lakeC.z);
  if(dL<lakeR*1.35){
    const shore=lakeY+0.01;
    const k=ss(lakeR*1.35,lakeR*.95,dL);
    y=Math.max(y, mix(y,shore,k))}
  return y}
function plantFeet(cam,x,z,facing){
  const legs=cam.userData.legs;
  const off=.28; let sum=0,n=0;
  const samples=[[0,0],[off,0],[-off,0],[0,off],[0,-off]];
  if(!legs||cam.userData.useGlb){
    /* 4-point raycast average so ridge camels don't float */
    samples.forEach(([dx,dz])=>{
      const wx=x+Math.cos(facing)*dz+Math.sin(facing)*dx;
      const wz=z+Math.sin(facing)*dz-Math.cos(facing)*dx;
      sum+=sampleGroundY(wx,wz); n++});
    cam.position.set(x,sum/n,z);cam.rotation.y=facing;
  }else{
    legs.forEach(lg=>{
      const wx=x+Math.cos(facing)*lg.L.position.z+Math.sin(facing)*lg.L.position.x;
      const wz=z+Math.sin(facing)*lg.L.position.z-Math.cos(facing)*lg.L.position.x;sum+=sampleGroundY(wx,wz)});
    const base=sum/legs.length;cam.position.set(x,base,z);cam.rotation.y=facing;
    legs.forEach(lg=>{
      const wx=x+Math.cos(facing)*lg.L.position.z+Math.sin(facing)*lg.L.position.x;
      const wz=z+Math.sin(facing)*lg.L.position.z-Math.cos(facing)*lg.L.position.x;
      lg.L.position.y=.92+(sampleGroundY(wx,wz)-base)*.3})}
  /* mild root pitch/roll to terrain normal — keeps hooves planted on slopes */
  const e=.4;
  const yF=sampleGroundY(x+Math.sin(facing)*e, z+Math.cos(facing)*e);
  const yB=sampleGroundY(x-Math.sin(facing)*e, z-Math.cos(facing)*e);
  const yR=sampleGroundY(x+Math.cos(facing)*e, z-Math.sin(facing)*e);
  const yL=sampleGroundY(x-Math.cos(facing)*e, z+Math.sin(facing)*e);
  const pitch=Math.atan2(yB-yF, 2*e), roll=Math.atan2(yL-yR, 2*e);
  cam.rotation.x=cl(pitch,-.22,.22)*.65;
  cam.rotation.z=cl(roll,-.18,.18)*.55}
const camels=[];
let _camelProto=null,_camelLoad=null,_camelAdopt=0;
/* camel_v3: in-place walk; root speed 0.989 m/s × fitScale × timeScale (no foot slide).
   Body height identical across clips — no walk-sink compensation. */
const CAMEL_WALK_MPS=.989;
const CAMEL_WALK_LOOP=1.1; /* seconds */
const CAMEL_GRAZE_DUR=9;
const CAMEL_DRINK_DUR=7;
const CAMEL_MAX_TURN=Math.PI/3; /* ~60°/s heading slerp — never snap */
const CAMEL_XFADE=.4; /* 0.3–0.5 s crossFade (walk↔idle hoof spots differ slightly) */
const CAMEL_CLIP_NAMES=["walk","idle","graze","drink"];
function camelWaterY(){return (lake&&lake.userData.waterY!=null)?lake.userData.waterY:lakeY}
function camelFitScale(st){return (st&&st.rig&&st.rig.fitScale)||1}
function camelWalkSpeed(st,ts){return CAMEL_WALK_MPS*camelFitScale(st)*(ts==null?1:ts)}
function camelFindClip(anims,name){
  if(!anims)return null;
  for(let i=0;i<anims.length;i++){const a=anims[i];if((a.name||"")===name)return a}
  for(let i=0;i<anims.length;i++){const a=anims[i];if(new RegExp("^"+name+"$","i").test(a.name||""))return a}
  return null}
function setupCamelRig(st, wrap, anims){
  if(!_VT)return;
  const bones=mapBones(wrap);
  const head=bones["tripoHead_2"]||bones["tripo::Head_2"]||bones["tripoHead_0"]||bonesMatching(bones,/Head/)[0];
  const spines=bonesMatching(bones,/Spine/).sort((a,b)=> (a.name>b.name?1:-1));
  const mixer=_VT.makeMixer(wrap.userData.scene||wrap);
  const list=anims||wrap.userData.anims||[];
  const actions={};
  CAMEL_CLIP_NAMES.forEach(n=>{
    const clip=camelFindClip(list,n); if(!clip)return;
    const act=mixer.clipAction(clip);
    act.setLoop(_VT.LoopRepeat,Infinity);
    act.clampWhenFinished=false; act.enabled=true; act.setEffectiveWeight(0);
    act.play(); act.paused=false; actions[n]=act});
  const walk=actions.walk||null;
  if(walk){walk.setEffectiveWeight(1); walk.timeScale=1}
  const fitScale=(wrap.userData&&wrap.userData.fitScale)||1;
  st.rig={mixer,walk,actions,bones,head,spines,pose:"walk",current:"walk",fitScale,fade:CAMEL_XFADE};
  st.speed=camelWalkSpeed(st,1);
  st.glb=wrap}
function camelPlay(st,pose,fade){
  const r=st.rig; if(!r||!r.actions)return;
  const next=r.actions[pose]; if(!next)return;
  if(r.current===pose){
    if(pose==="walk"){next.paused=false; next.timeScale=st.walkTs||1}
    return}
  /* walk↔idle needs 0.3–0.5 s (hooves land in slightly different spots); others 0.35 s */
  let dur=fade;
  if(dur==null){
    const wi=(r.current==="walk"&&pose==="idle")||(r.current==="idle"&&pose==="walk");
    dur=wi?CAMEL_XFADE:.35}
  const cur=r.actions[r.current];
  next.enabled=true; next.setEffectiveWeight(1); next.paused=false;
  if(pose==="walk")next.timeScale=st.walkTs||1;
  else next.timeScale=1;
  next.reset().play();
  if(cur&&cur!==next){
    try{cur.crossFadeTo(next,dur,false)}catch(_){
      cur.setEffectiveWeight(0); next.setEffectiveWeight(1)}}
  else next.setEffectiveWeight(1);
  r.current=pose; r.pose=pose}
function ensureCamelProto(){
  if(_camelProto)return Promise.resolve(_camelProto);
  if(_camelLoad)return _camelLoad;
  _camelLoad=tryModel(MODEL.camel,()=>null).then(r=>{
    if(r.src==="glb"&&r.root){_camelProto=r.root;return _camelProto}
    return null});
  return _camelLoad}
function spawnCamel(x,z,facing,opts){
  const c=makeCamelProcedural();plantFeet(c,x,z,facing);onDes(c);root.add(c);
  const canDrink=!!(opts&&opts.canDrink);
  const idleFor=rr(4,10);
  const st={o:c,x,z,facing,mode:"walk",t:rr(0,6),speed:CAMEL_WALK_MPS,walkTs:1,
    tx:x,tz:z,drink:0,graze:0,idleFor,phase:rr(0,20),canDrink,rig:null};
  camels.push(st);
  ensureCamelProto().then(proto=>{
    if(!proto||st.rig)return;
    try{
      const wrap=(_camelAdopt++===0)?proto:cloneRig(proto);
      adoptGLB(c,wrap);gradeAnimalGLB(wrap,"camel");setupCamelRig(st,wrap,wrap.userData.anims);
      c.position.y=sampleGroundY(st.x,st.z)+.002}catch(_){}});
  return st}
/* 3 camels, desynchronised phases; only one may drink */
spawnCamel(-4.6,2.4,0.6,{canDrink:1});
spawnCamel(-5.4,1.0,-2.1,{canDrink:0});
spawnCamel(3.2,-2.8,2.4,{canDrink:0});
camels.forEach(c=>{
  const b=new T.Mesh(new T.Plane(.42,.28),blobM);b.rotation.x=-Math.PI/2;b.position.set(0,.01,0);b.renderOrder=1;
  c.o.add(b);onDes(b);c.blob=b});

function camelBlocked(x,z,drinkOk){
  /* never walk onto tent / palms / cactus / lake interior (drink only at shore) */
  if(Math.hypot(x,z)>R-1.1)return 1;
  const dLake=Math.hypot(x-lakeC.x,z-lakeC.z);
  if(drinkOk){if(dLake<lakeR*.92)return 1} /* too deep — feet must stay on sand */
  else if(dLake<lakeR*1.28)return 1;
  const tentX=(typeof tentAnchor!=="undefined"?tentAnchor.x:0), tentZ=(typeof tentAnchor!=="undefined"?tentAnchor.z:0);
  if(Math.hypot(x-tentX,z-tentZ)<2.85)return 1;
  if(fireG&&Math.hypot(x-fireG.position.x,z-fireG.position.z)<1.25)return 1;
  for(let i=0;i<palms.length;i++){const p=palms[i];if(!p||p.visible===false)continue;
    if(Math.hypot(x-p.position.x,z-p.position.z)<1.85)return 1}
  for(let i=0;i<cacti.length;i++){const p=cacti[i];if(!p||p.visible===false)continue;
    if(Math.hypot(x-p.position.x,z-p.position.z)<1.4)return 1}
  if(typeof tripo!=="undefined"&&tripo){
    if(tripo.tent&&Math.hypot(x-tripo.tent.position.x,z-tripo.tent.position.z)<2.9)return 1;
    if(tripo.palm&&Math.hypot(x-tripo.palm.position.x,z-tripo.palm.position.z)<1.9)return 1;
    for(let i=0;i<(tripo.sag||[]).length;i++){
      const s=tripo.sag[i];if(s&&Math.hypot(x-s.position.x,z-s.position.z)<1.45)return 1}}
  return 0}
function camelPickWalk(){
  for(let k=0;k<14;k++){
    const a=rnd()*TAU,rad=rr(2.2,R*.55);
    const x=Math.cos(a)*rad,z=Math.sin(a)*rad;
    if(!camelBlocked(x,z,0))return {x,z}}
  return {x:lakeC.x+lakeR*2.2,z:lakeC.z+1.5}}
function camelPickGraze(){
  for(let k=0;k<10;k++){
    const sh=shrubs.length?shrubs[(Math.random()*shrubs.length)|0]:null;
    if(sh&&!camelBlocked(sh.x,sh.z,0))return {x:sh.x,z:sh.z}}
  return camelPickWalk()}
function camelPickDrink(st){
  /* Feet on shore sand; drink clip brings muzzle to ~0.15 m above feet (= water).
     Muzzle ~0.91 m ahead of root along +Z — place so muzzle reaches water edge. */
  /* drink: muzzle ~0.52 m ahead of front toes (~0.9 m ahead of root) at y≈0.15 */
  const sc=camelFitScale(st), muzzleFwd=.9*sc, mouthH=.15*sc;
  const wy=camelWaterY();
  let best=null,bestScore=1e9;
  for(let i=0;i<24;i++){
    const a=(i/24)*TAU+rr(-.05,.05);
    const rad=lakeR+.18+rr(0,.35); /* feet just outside water */
    const x=lakeC.x+Math.cos(a)*rad, z=lakeC.z+Math.sin(a)*rad;
    if(camelBlocked(x,z,1))continue;
    const gy=sampleGroundY(x,z);
    const face=Math.atan2(lakeC.x-x,lakeC.z-z);
    const mx=x+Math.sin(face)*muzzleFwd, mz=z+Math.cos(face)*muzzleFwd;
    const md=Math.hypot(mx-lakeC.x,mz-lakeC.z);
    const yErr=Math.abs((gy+mouthH)-wy);
    const edgeErr=Math.abs(md-lakeR);
    const score=yErr*8+edgeErr*1.4+(gy<wy-.02?2:0);
    if(score<bestScore){bestScore=score;best={x,z,facing:face}}}
  if(best)return best;
  const a=Math.atan2(-1,0.2);
  return {x:lakeC.x+Math.cos(a)*(lakeR+.35),z:lakeC.z+Math.sin(a)*(lakeR+.35),
    facing:Math.atan2(lakeC.x-(lakeC.x+Math.cos(a)*(lakeR+.35)),lakeC.z-(lakeC.z+Math.sin(a)*(lakeR+.35)))}}
function camelBeginMode(st,mode){
  st.mode=mode; st.t=0; st.graze=0; st.drink=0;
  if(mode==="walk"){
    const p=camelPickWalk(); st.tx=p.x; st.tz=p.z; st.walkTs=1; st.speed=camelWalkSpeed(st,1)}
  else if(mode==="idle"){st.tx=st.x; st.tz=st.z; st.idleFor=rr(4,10)}
  else if(mode==="graze"){const p=camelPickGraze(); st.tx=p.x; st.tz=p.z}
  else if(mode==="drink"){const p=camelPickDrink(st); st.tx=p.x; st.tz=p.z;
    /* face lake via slerp during approach — seed facing toward target */
    if(p.facing!=null){/* keep current; update will slerp */}}
}
function camelUpdate(st,dt,t){
  st.t+=dt; st.phase=(st.phase||0)+dt;
  const c=st.o,ud=c.userData,glb=!!ud.useGlb,rig=st.rig;
  /* behaviour: walk → idle(4–10s) → graze; one drinker walks to shore + drink clip */
  if(st.walkFor==null)st.walkFor=5.5+((st.phase||0)%2.2);
  if(st.mode==="walk"&&st.t>st.walkFor){
    const roll=((st.phase*1.7+st.t*.3)%1);
    if(st.canDrink&&roll>.72&&!camels.some(o=>o!==st&&o.mode==="drink"))camelBeginMode(st,"drink");
    else if(roll>.38)camelBeginMode(st,"idle");
    else camelBeginMode(st,"graze");
    st.walkFor=5.5+((st.phase||0)%2.2)}
  else if(st.mode==="idle"&&st.t>(st.idleFor||6)){
    camelBeginMode(st, ((st.phase*3.1)%1)<.55?"graze":"walk")}
  else if(st.mode==="graze"&&st.graze>CAMEL_GRAZE_DUR+.15){camelBeginMode(st,"walk")}
  else if(st.mode==="drink"&&st.drink>CAMEL_DRINK_DUR+.15){camelBeginMode(st,"walk")}

  let moving=0;
  const seeking=(st.mode==="walk")||((st.mode==="graze"||st.mode==="drink")&&(st.mode==="graze"?st.graze:st.drink)<.02);
  if(st.mode==="walk"||st.mode==="graze"||st.mode==="drink"){
    const dx=st.tx-st.x,dz=st.tz-st.z,dist=Math.hypot(dx,dz);
    const atGoal=dist<=.32||(st.mode!=="walk"&&(st.graze>.02||st.drink>.02));
    if(!atGoal&&seeking){
      const want=Math.atan2(dx,dz);
      let dth=((want-st.facing+Math.PI*3)%TAU)-Math.PI;
      const maxT=CAMEL_MAX_TURN*dt; st.facing+=cl(dth,-maxT,maxT);
      const ts=st.mode==="walk"?1:.72;
      st.walkTs=ts; st.speed=camelWalkSpeed(st,ts);
      const nx=st.x+Math.sin(st.facing)*st.speed*dt, nz=st.z+Math.cos(st.facing)*st.speed*dt;
      if(camelBlocked(nx,nz,st.mode==="drink"?1:0)){
        if(st.mode==="drink"){const p=camelPickDrink(st);st.tx=p.x;st.tz=p.z}
        else{const p=camelPickWalk();st.tx=p.x;st.tz=p.z;if(st.mode!=="walk")camelBeginMode(st,"walk")}}
      else{st.x=nx;st.z=nz}
      moving=1;
      if(!glb&&ud.legs){
        const pace=t*(TAU/CAMEL_WALK_LOOP)*ts;
        ud.legs.forEach(lg=>{
          const swing=Math.sin(pace+(lg.side>0?0:Math.PI))*(lg.fore?.9:1);
          lg.L.rotation.x=swing*.48; lg.lo.rotation.x=Math.max(0,-swing)*.38})}
    }else{
      if(!glb&&ud.legs)ud.legs.forEach(lg=>{lg.L.rotation.x*=1-ease(6,dt);lg.lo.rotation.x*=1-ease(6,dt)});
      if(st.mode==="graze"){st.graze+=dt;
        if(!glb&&ud.neck){ud.neck.rotation.x=ss(0,1.2,Math.min(1.2,st.graze))*.9;ud.head.rotation.x=Math.sin(t*3.2)*.1}}
      else if(st.mode==="drink"){st.drink+=dt;
        const want=Math.atan2(lakeC.x-st.x,lakeC.z-st.z);
        let dth=((want-st.facing+Math.PI*3)%TAU)-Math.PI;
        const maxT=CAMEL_MAX_TURN*dt; st.facing+=cl(dth,-maxT,maxT);
        if(!glb&&ud.neck)ud.neck.rotation.x=ss(0,1.0,Math.min(1,st.drink))*.75}
      else if(st.mode==="walk"){/* arrived walk target → idle */ camelBeginMode(st,"idle")}}
  }

  if(rig){
    const wantPose=moving?"walk":(st.mode==="graze"||st.mode==="drink"||st.mode==="idle"?st.mode:"idle");
    camelPlay(st,wantPose,CAMEL_XFADE);
    if(rig.actions&&rig.actions.walk&&moving){
      rig.actions.walk.timeScale=st.walkTs||1; rig.actions.walk.paused=false}
    /* ALWAYS update mixer every frame (live + capture clock stepping) */
    if(rig.mixer)rig.mixer.update(dt);
  }else if(!moving&&!glb){
    if(ud.neck)ud.neck.rotation.x=mix(ud.neck.rotation.x||0, .04*Math.sin(t*1.3), ease(3,dt));
    if(ud.head)ud.head.rotation.y=.1*Math.sin(t*.55)}
  plantFeet(c,st.x,st.z,st.facing);
  if(glb)c.position.y+=.002}

/* ---------------- eagle_v3 (fly) + eagle_perch_v2 (perch/drink) ---------------- */
function makeEagleProcedural(){
  const g=new T.Group();
  const bodyM=M({color:"#6b4a32",roughness:.85}),wingM=M({color:"#4a3424",roughness:.88,side:2});
  const body=new T.Mesh(new T.Sphere(.14,8,6),bodyM);body.scale.set(1,.65,1.6);g.add(body);
  const wingL=new T.Group(),wingR=new T.Group();
  [[-1,wingL],[1,wingR]].forEach(([side,W])=>{W.position.set(0,.03,0);g.add(W);
    const wl=new T.Mesh(new T.Plane(.55,.2),wingM);wl.position.set(side*.3,0,0);W.add(wl)});
  g.userData={wingL,wingR,body};return g}
const EAGLE_XFADE=.35;
const EAGLE_FLARE_FWD=1.0, EAGLE_FLARE_DROP=.6, EAGLE_TO_FWD=1.4, EAGLE_TO_UP=.95;
const EAGLE_CONTACT_Y=.045; /* talon clearance above perch tip / shore */
const eagle={o:makeEagleProcedural(),mode:"soar",t:0,th:rnd()*TAU,rad:12,alt:5.5,flap:0,cry:0,
  blend:0,landed:0,rig:null,flyMixer:null,perchMixer:null,flyAct:{},perchAct:{},flyClip:"glide",
  perchFor:rr(8,15),facing:0,landTarget:null,climb:0,toStart:null,approachGoal:null};
root.add(eagle.o);onDes(eagle.o);

function eagleFindClip(anims,name){
  if(!anims)return null;
  for(let i=0;i<anims.length;i++)if((anims[i].name||"")===name)return anims[i];
  return null}
function eagleSetupFly(wrap){
  if(!_VT)return;
  const scene=wrap.userData.scene||wrap;
  const mixer=_VT.makeMixer(scene);
  const anims=wrap.userData.anims||[];
  const act={};
  ["flap","glide","landing_flare","take_off"].forEach(n=>{
    const c=eagleFindClip(anims,n); if(!c)return;
    const a=mixer.clipAction(c);
    if(n==="landing_flare"||n==="take_off"){
      a.setLoop(_VT.LoopOnce,1); a.clampWhenFinished=true}
    else a.setLoop(_VT.LoopRepeat,Infinity);
    a.enabled=true; a.setEffectiveWeight(0); a.play(); a.paused=true; act[n]=a});
  if(act.glide){act.glide.setEffectiveWeight(1); act.glide.paused=false}
  eagle.flyMixer=mixer; eagle.flyAct=act; eagle.flyClip="glide";
  eagle.rig={bones:mapBones(wrap), head:null};
  const bones=eagle.rig.bones;
  eagle.rig.head=bones["Head"]||bones["tripoHead_0"]||bonesMatching(bones,/Head/)[0]}
function eagleSetupPerch(wrap){
  if(!_VT)return;
  const scene=wrap.userData.scene||wrap;
  const mixer=_VT.makeMixer(scene);
  const anims=wrap.userData.anims||[];
  const act={};
  ["perch_idle","drink"].forEach(n=>{
    const c=eagleFindClip(anims,n); if(!c)return;
    const a=mixer.clipAction(c);
    if(n==="drink"){a.setLoop(_VT.LoopOnce,1); a.clampWhenFinished=true}
    else a.setLoop(_VT.LoopRepeat,Infinity);
    a.enabled=true; a.setEffectiveWeight(0); a.play(); a.paused=true; act[n]=a});
  eagle.perchMixer=mixer; eagle.perchAct=act}
function eagleShowFly(fly){
  const o=eagle.o;
  if(eagle.flyGlb)eagle.flyGlb.visible=!!fly;
  if(eagle.perchGlb)eagle.perchGlb.visible=!fly;
  o.children.forEach(ch=>{if(ch===eagle.flyGlb||ch===eagle.perchGlb)return; ch.visible=!eagle.flyGlb});
  eagle._flying=!!fly}
function eaglePlayFly(name, fade){
  const act=eagle.flyAct; if(!act||!act[name])return;
  const next=act[name], cur=act[eagle.flyClip];
  const dur=fade!=null?fade:EAGLE_XFADE;
  next.enabled=true; next.paused=false; next.setEffectiveWeight(1);
  if(name==="landing_flare"||name==="take_off")next.reset();
  else if(eagle.flyClip!==name)next.reset();
  next.play();
  if(cur&&cur!==next){try{cur.crossFadeTo(next,dur,false)}catch(_){cur.setEffectiveWeight(0)}}
  eagle.flyClip=name}
function eaglePlayPerch(name, fade){
  const act=eagle.perchAct; if(!act||!act[name])return;
  Object.keys(act).forEach(k=>{if(k!==name)act[k].setEffectiveWeight(0)});
  const next=act[name];
  next.enabled=true; next.paused=false; next.reset(); next.setEffectiveWeight(1); next.play();
  eagle.perchClip=name}

tryModel(MODEL.eagle,()=>null).then(r=>{
  if(r.src==="glb"&&r.root){
    eagle.o.children.slice().forEach(ch=>{ch.visible=false});
    eagle.flyGlb=r.root; eagle.o.add(r.root); eagle.o.userData.useGlb=1; onDes(r.root);
    gradeAnimalGLB(r.root,"eagle");
    eagleSetupFly(r.root); eagleShowFly(true); eaglePlayFly("glide",.05)}});
tryModel(MODEL.eagle_perch,()=>null).then(r=>{
  if(r.src==="glb"&&r.root){
    eagle.perchGlb=r.root; r.root.visible=false; eagle.o.add(r.root); onDes(r.root);
    gradeAnimalGLB(r.root,"eagle");
    eagleSetupPerch(r.root)}});

function eaglePerchTip(){
  const perch=cacti.find(c=>c&&c.userData&&c.userData.isPerch&&c.visible!==false)||eaglePerch;
  if(perch){
    perch.updateMatrixWorld(true);
    const box=worldBox(perch);
    return {x:perch.position.x, y:box.max[1]+EAGLE_CONTACT_Y, z:perch.position.z}}
  return {x:-5,y:hAt(-5,2.2)+1.55+EAGLE_CONTACT_Y,z:2.2}}
function eaglePerchWorld(){
  const tip=eaglePerchTip();
  return {x:tip.x,y:tip.y,z:tip.z, tip}}
function eagleLakeSpot(){
  /* feet on shore sand; perch drink beak ≈0.107 m above feet → water ≈ feet+0.107 */
  const wy=(lake&&lake.userData.waterY!=null)?lake.userData.waterY:lakeY;
  let best=null,bestScore=1e9;
  for(let i=0;i<16;i++){
    const a=(i/16)*TAU;
    const rad=lakeR+.35+rr(0,.25);
    const x=lakeC.x+Math.cos(a)*rad, z=lakeC.z+Math.sin(a)*rad;
    const gy=sampleGroundY(x,z)+EAGLE_CONTACT_Y;
    const score=Math.abs((gy+.107)-wy)+Math.abs(Math.hypot(x-lakeC.x,z-lakeC.z)-lakeR)*.3;
    if(score<bestScore){bestScore=score;best={x,y:gy,z,facing:Math.atan2(lakeC.x-x,lakeC.z-z)}}}
  return best||{x:lakeC.x+lakeR*1.1,y:Math.max(hAt(lakeC.x+lakeR*1.1,lakeC.z),lakeY)+.02+EAGLE_CONTACT_Y,z:lakeC.z,facing:Math.PI}}
function eagleSeatHost(spot,facing){
  const o=eagle.o;
  o.position.set(spot.x, spot.y, spot.z);
  o.rotation.set(0, facing!=null?facing:o.rotation.y, 0);
  eagle.facing=o.rotation.y}
function eagleWorldPos(){
  /* prefer Root bone world pos so baked flare/takeoff travel is continuous */
  const o=eagle.o;
  let rootBone=null;
  const src=eagle._flying!==false?(eagle.flyGlb||o):(eagle.perchGlb||o);
  if(src)src.traverse(b=>{if(!rootBone&&b.isBone&&(b.name==="Root"||b.name==="root"))rootBone=b});
  if(rootBone){o.updateMatrixWorld(true); const p=new V3(); rootBone.getWorldPosition(p); return p}
  return o.position.clone?o.position.clone():new V3(o.position.x,o.position.y,o.position.z)}
function eagleBeginLand(kind){
  /* kind: perch | drink — fly continuously to tip, then play flare in place */
  const tip=kind==="perch"?eaglePerchTip():eagleLakeSpot();
  const face=kind==="drink"&&tip.facing!=null?tip.facing:Math.atan2(tip.x-eagle.o.position.x, tip.z-eagle.o.position.z);
  eagle.landTarget={x:tip.x,y:tip.y,z:tip.z,kind,facing:face};
  eagle.facing=face;
  eagleShowFly(true);
  /* Root.position barely moves at flare t=0 — arrive at tip itself (no 1 m stand-off) */
  /* approach the tip itself — tip.y+.15 made the flare seat drop ~0.15 m */
  eagle.approachGoal={x:tip.x,y:tip.y,z:tip.z};
  eagle.mode=kind==="perch"?"approachPerch":"approachDrink";
  eagle.t=0; eagle.landed=0;
  eaglePlayFly("glide",.25)}
function eagleStartFlare(){
  const tip=eagle.landTarget;
  const face=tip.facing!=null?tip.facing:eagle.facing;
  const o=eagle.o;
  /* Soft seat (approach→flare): never snap more than ~0.12 m — desert35's
     hard eagleSeatHost at dist≈0.25 + y-bias made the ~0.51 m frame jump */
  const dx=tip.x-o.position.x, dy=tip.y-o.position.y, dz=tip.z-o.position.z;
  const d=Math.hypot(dx,dy,dz), maxSeat=.12;
  if(d>1e-6){const s=Math.min(1, maxSeat/d);
    o.position.x+=dx*s; o.position.y+=dy*s; o.position.z+=dz*s}
  o.rotation.set(0, face, 0); eagle.facing=face;
  /* lock landTarget to seated host so land* frames don't re-snap */
  eagle.landTarget={x:o.position.x,y:o.position.y,z:o.position.z,kind:tip.kind,facing:face};
  const act=eagle.flyAct;
  Object.keys(act).forEach(k=>{act[k].setEffectiveWeight(0); act[k].paused=true});
  if(act.landing_flare){
    const a=act.landing_flare;
    a.enabled=true; a.paused=false; a.reset(); a.setEffectiveWeight(1); a.play(); a.time=0}
  eagle.flyClip="landing_flare";
  if(eagle.flyMixer)eagle.flyMixer.update(0);
  eagle.mode=tip.kind==="perch"?"landPerch":"landDrink";
  eagle.t=0}
function eagleTouchdown(){
  const kind=eagle.landTarget&&eagle.landTarget.kind||"perch";
  const tip=eagle.landTarget||eaglePerchTip();
  eagleSeatHost(tip, eagle.facing);
  eagleShowFly(false);
  if(kind==="perch"){
    eagle.mode="perch"; eagle.t=0; eagle.landed=1; eagle.perchFor=rr(8,15);
    eaglePlayPerch("perch_idle",.05)}
  else{
    eagle.mode="drink"; eagle.t=0; eagle.landed=1;
    eaglePlayPerch("drink",.05)}}
function eagleBeginTakeoff(){
  eagleShowFly(true);
  const o=eagle.o;
  eagle.toStart={x:o.position.x,y:o.position.y,z:o.position.z};
  eagleSeatHost(eagle.toStart, eagle.facing);
  eaglePlayFly("take_off",.2);
  eagle.mode="takeoff"; eagle.t=0; eagle.landed=0}
function eagleFinishTakeoff(){
  const o=eagle.o, face=eagle.facing||o.rotation.y;
  /* Preserve Root world across takeoff→flap: move host by the Root bind delta */
  const before=eagleWorldPos();
  o.rotation.x=0; o.rotation.z=0; o.rotation.y=face; eagle.facing=face;
  const act=eagle.flyAct;
  Object.keys(act).forEach(k=>{act[k].setEffectiveWeight(0); act[k].paused=true});
  if(act.flap){const a=act.flap; a.enabled=true; a.paused=false; a.reset(); a.setEffectiveWeight(1); a.play()}
  eagle.flyClip="flap";
  if(eagle.flyMixer)eagle.flyMixer.update(0);
  const after=eagleWorldPos();
  o.position.x+=before.x-after.x;
  o.position.y+=before.y-after.y;
  o.position.z+=before.z-after.z;
  eagle.th=Math.atan2(o.position.x,o.position.z);
  eagle.rad=Math.max(8, Math.hypot(o.position.x,o.position.z)||12);
  eagle.alt=Math.max(3.5, o.position.y);
  eagle.mode="soar"; eagle.t=0; eagle.cry=1; eagle.climb=1}

function eagleUpdate(dt,t){
  const e=eagle,o=e.o; e.t+=dt;
  if(e.flyMixer)e.flyMixer.update(dt);
  if(e.perchMixer&&!e._flying)e.perchMixer.update(dt);

  if(e.mode==="soar"){
    eagleShowFly(true);
    /* lazy thermals — island-scale circles (~10–16 m); bank into turn; flap when climbing */
    e.rad=mix(e.rad, 10+6*((Math.sin(t*.07)+1)*.5), ease(.4,dt));
    e.alt=mix(e.alt, 4.2+1.6*Math.sin(t*.12), ease(.35,dt));
    const wantClimb=e.alt>o.position.y+.15||e.climb>0;
    if(e.climb>0)e.climb-=dt;
    const omega=.14; /* rad/s */
    e.th+=dt*omega;
    const x=Math.cos(e.th)*e.rad, z=Math.sin(e.th)*e.rad, y=e.alt;
    const px=o.position.x, pz=o.position.z, py=o.position.y;
    /* ease toward orbit but hard-cap step so world pos never jumps >0.45 m */
    let nx=mix(px,x,ease(1.8,dt)), nz=mix(pz,z,ease(1.8,dt)), ny=mix(py,y,ease(1.2,dt));
    const jump=Math.hypot(nx-px,ny-py,nz-pz), maxStep=.45;
    if(jump>maxStep){const s=maxStep/jump; nx=px+(nx-px)*s; ny=py+(ny-py)*s; nz=pz+(nz-pz)*s}
    o.position.x=nx; o.position.y=ny; o.position.z=nz;
    const yaw=Math.atan2(o.position.x-px,o.position.z-pz);
    if(Number.isFinite(yaw)){let d=((yaw-o.rotation.y+Math.PI*3)%TAU)-Math.PI;
      const maxT=CAMEL_MAX_TURN*1.4*dt; o.rotation.y+=cl(d,-maxT,maxT); e.facing=o.rotation.y}
    o.rotation.z=cl(-Math.sin(e.th)*.35,-.45,.45); /* bank into turn */
    o.rotation.x=0;
    const climbing=wantClimb||(o.position.y<e.alt-.2);
    if(climbing)eaglePlayFly("flap",EAGLE_XFADE); else eaglePlayFly("glide",EAGLE_XFADE);
    if(e.t>11){e.t=0; eagleBeginLand(rnd()<.62?"perch":"drink")}}
  else if(e.mode==="approachPerch"||e.mode==="approachDrink"){
    eagleShowFly(true);
    const g=e.approachGoal||e.landTarget;
    const tip=e.landTarget;
    const face=tip&&tip.facing!=null?tip.facing:e.facing;
    const px=o.position.x, py=o.position.y, pz=o.position.z;
    const dx=g.x-px, dy=g.y-py, dz=g.z-pz;
    const dist=Math.hypot(dx,dy,dz)||1;
    /* ~5 m/s approach, hard-capped at 0.45 m/frame */
    const maxStep=.45;
    const step=Math.min(dist, Math.min(5.0*dt, maxStep));
    o.position.x+=dx/dist*step; o.position.y+=dy/dist*step; o.position.z+=dz/dist*step;
    let d=((face-o.rotation.y+Math.PI*3)%TAU)-Math.PI;
    o.rotation.y+=cl(d,-CAMEL_MAX_TURN*1.2*dt,CAMEL_MAX_TURN*1.2*dt); e.facing=o.rotation.y;
    o.rotation.x=cl(-(dy/dist)*.25,-.35,.1); o.rotation.z=0;
    eaglePlayFly(dy<-.05||dist>3?"flap":"glide",EAGLE_XFADE);
    const dTip=Math.hypot(tip.x-o.position.x, tip.y-o.position.y, tip.z-o.position.z);
    /* flare only when host is nearly on the tip — soft seat ≤0.12 m */
    if(dist<.08||dTip<.1)eagleStartFlare()}
  else if(e.mode==="landPerch"||e.mode==="landDrink"){
    eagleShowFly(true);
    /* host fixed at tip; flare Root track is the approach */
    const tip=e.landTarget; if(tip)eagleSeatHost(tip, e.facing);
    const a=e.flyAct.landing_flare;
    if(a&&a.time>=(a.getClip().duration||2)-.02)eagleTouchdown();
    else if(e.t>2.4)eagleTouchdown()}
  else if(e.mode==="perch"){
    eagleShowFly(false);
    const tip=eaglePerchTip(); eagleSeatHost(tip, e.facing);
    if(e.t>(e.perchFor||10))eagleBeginTakeoff()}
  else if(e.mode==="drink"){
    eagleShowFly(false);
    const spot=eagle.landTarget||eagleLakeSpot();
    eagleSeatHost(spot, spot.facing!=null?spot.facing:e.facing);
    const a=e.perchAct.drink;
    if((a&&a.time>=(a.getClip().duration||7)-.05)||e.t>7.4)eagleBeginTakeoff()}
  else if(e.mode==="takeoff"){
    eagleShowFly(true);
    /* host stays at perch/shore; take_off Root track supplies +1.4 / +0.95 */
    const a=e.flyAct.take_off;
    o.rotation.x=0; o.rotation.z=0;
    if((a&&a.time>=(a.getClip().duration||1.8)-.02)||e.t>2.0)eagleFinishTakeoff()}
}

/* ---------------- snake_v3 — slither / sidewind / idle_coiled / strike ---------------- */
const SNAKE_SLITHER_MPS=.425, SNAKE_SIDEWIND_MPS=.55, SNAKE_XFADE=.4, SNAKE_STRIKE_DUR=3;
function makeSnakeProcedural(){
  const g=new T.Group();
  const m=M({color:"#c9a060",roughness:.82});
  const body=new T.Mesh(new T.Cyl(.04,.02,1.2,8),m); body.rotation.x=Math.PI/2; body.position.z=.1; g.add(body);
  g.userData={kind:"snake",segs:[]}; return g}
function makeSnakeTrigger(){
  /* small beetle/lizard pebble the coiled snake can aim at */
  const g=new T.Group();
  const rock=new T.Mesh(new T.Sphere(.028,6,5),M({color:"#6a5040",roughness:.95}));
  rock.scale.set(1.2,.55,1.6); g.add(rock);
  const spot=new T.Mesh(new T.Sphere(.012,5,4),M({color:"#3a2a1c",roughness:.9}));
  spot.position.set(.01,.01,.02); g.add(spot);
  g.visible=true; return g}
const snakes=[];
let _snakeProto=null,_snakeLoad=null,_snakeAdopt=0;
function snakeFindClip(anims,name){
  if(!anims)return null;
  for(let i=0;i<anims.length;i++)if((anims[i].name||"")===name)return anims[i];
  return null}
function setupSnakeRig(st, wrap){
  if(!_VT)return;
  const scene=wrap.userData.scene||wrap;
  const mixer=_VT.makeMixer(scene);
  const anims=wrap.userData.anims||[];
  const act={};
  ["slither","sidewind","idle_coiled","strike"].forEach(n=>{
    const c=snakeFindClip(anims,n); if(!c)return;
    const a=mixer.clipAction(c);
    if(n==="strike"){a.setLoop(_VT.LoopOnce,1); a.clampWhenFinished=true}
    else a.setLoop(_VT.LoopRepeat,Infinity);
    a.enabled=true; a.setEffectiveWeight(0);
    a.play(); a.paused=true; act[n]=a});
  if(act.slither){act.slither.setEffectiveWeight(1); act.slither.paused=false}
  st.rig={mixer,act,current:"slither",fitScale:(wrap.userData&&wrap.userData.fitScale)||1};
  st.glb=wrap; st.o.userData.useGlb=1}
function snakePlay(st,pose,fade){
  const r=st.rig; if(!r||!r.act||!r.act[pose])return;
  if(r.current===pose&&pose!=="strike"){r.act[pose].paused=false; return}
  const next=r.act[pose], cur=r.act[r.current];
  /* idle↔strike poses match — near-zero fade; others use SNAKE_XFADE */
  let dur=fade;
  if(dur==null){
    const match=(r.current==="idle_coiled"&&pose==="strike")||(r.current==="strike"&&pose==="idle_coiled");
    dur=match?.05:SNAKE_XFADE}
  next.enabled=true; next.paused=false; next.reset(); next.setEffectiveWeight(1); next.play();
  if(cur&&cur!==next){try{cur.crossFadeTo(next,dur,false)}catch(_){cur.setEffectiveWeight(0)}}
  r.current=pose}
function ensureSnakeProto(){
  if(_snakeProto)return Promise.resolve(_snakeProto);
  if(_snakeLoad)return _snakeLoad;
  _snakeLoad=tryModel(MODEL.snake,()=>null).then(r=>{
    if(r.src==="glb"&&r.root){_snakeProto=r.root;return _snakeProto}
    return null});
  return _snakeLoad}
function snakeAimYaw(fromX,fromZ,toX,toZ){
  /* strike heads toward model −X; yaw so −X points at target */
  const dx=toX-fromX, dz=toZ-fromZ;
  const len=Math.hypot(dx,dz)||1;
  const ax=dx/len, az=dz/len;
  return Math.atan2(az, -ax)}
/* Shoreline polygon (XZ) rebuilt with the lake disc — for PIP dry-sand asserts */
let lakePoly=null;
const SNAKE_LAKE_MARGIN=1.5; /* metres outside shoreline polygon */
function rebuildLakePoly(cx,cz,rad,n){
  const N=n||48, pts=[];
  for(let i=0;i<N;i++){
    const a=(i/N)*TAU;
    pts.push({x:cx+Math.cos(a)*rad, z:cz+Math.sin(a)*rad})}
  lakePoly=pts; return pts}
function pointInLakePoly(x,z){
  /* even-odd PIP against shoreline polygon (false = dry sand) */
  const pts=lakePoly;
  if(!pts||!pts.length){
    return Math.hypot(x-lakeC.x,z-lakeC.z)<lakeR}
  let inside=0;
  for(let i=0,j=pts.length-1;i<pts.length;j=i++){
    const xi=pts[i].x, zi=pts[i].z, xj=pts[j].x, zj=pts[j].z;
    const hit=((zi>z)!==(zj>z))&&(x<(xj-xi)*(z-zi)/((zj-zi)||1e-12)+xi);
    if(hit)inside^=1}
  return !!inside}
function snakeDryMargin(x,z){
  /* ≥1.5 m outside shoreline — circle proxy matches disc lake */
  return Math.hypot(x-lakeC.x,z-lakeC.z)>=lakeR+SNAKE_LAKE_MARGIN}
function snakeOpenSand(x,z){
  /* dry dune only: ≥1.5 m outside lake polygon, clear of tent/reeds/props */
  if(!snakeDryMargin(x,z)||pointInLakePoly(x,z))return 0;
  if(typeof tentAnchor!=="undefined"&&tentAnchor&&Math.hypot(x-tentAnchor.x,z-tentAnchor.z)<2.4)return 0;
  if(typeof fireG!=="undefined"&&fireG&&Math.hypot(x-fireG.position.x,z-fireG.position.z)<1.6)return 0;
  /* bleached rib props (desert props) */
  if(Math.hypot(x-(-5.8),z-3.6)<2.0)return 0;
  if(Math.hypot(x-4.6,z-1.6)<2.0)return 0;
  for(let i=0;i<(cacti||[]).length;i++){
    const c=cacti[i]; if(c&&Math.hypot(x-c.position.x,z-c.position.z)<1.3)return 0}
  for(let i=0;i<(palms||[]).length;i++){
    const p=palms[i]; if(p&&p.visible!==false&&Math.hypot(x-p.position.x,z-p.position.z)<1.6)return 0}
  /* tripo const is declared later — never touch it here (TDZ); tent/palms cover it */
  for(let i=0;i<reedG.children.length;i++){
    const g=reedG.children[i];
    if(g&&Math.hypot(x-g.position.x,z-g.position.z)<.7)return 0}
  return 1}
function snakeEndsWorld(st){
  /* head + tip-of-tail world XZ for lake PIP assertion */
  const out={head:null,tail:null};
  const wrap=st.glb||st.o; if(!wrap)return out;
  wrap.updateMatrixWorld(true);
  let head=null, tip=null, tipI=-1;
  wrap.traverse(b=>{
    if(!b.isBone)return;
    if(b.name==="Head"||/Head/i.test(b.name))head=b;
    const m=/^Body_(\d+)$/.exec(b.name);
    if(m){const i=+m[1]; if(i>tipI){tipI=i; tip=b}}});
  const _p=new V3();
  if(head){head.getWorldPosition(_p); out.head={x:_p.x,z:_p.z,y:_p.y}}
  else out.head={x:st.x,z:st.z,y:st.o?st.o.position.y:0};
  if(tip){tip.getWorldPosition(_p); out.tail={x:_p.x,z:_p.z,y:_p.y}}
  else out.tail={x:st.x,z:st.z,y:st.o?st.o.position.y:0};
  return out}
function snakeAssertDry(st){
  /* every frame: head + tail must be outside the lake polygon */
  const ends=snakeEndsWorld(st);
  const bad=[];
  if(ends.head&&pointInLakePoly(ends.head.x,ends.head.z))bad.push("head");
  if(ends.tail&&pointInLakePoly(ends.tail.x,ends.tail.z))bad.push("tail");
  if(!snakeDryMargin(st.x,st.z))bad.push("root");
  return {ok:!bad.length, bad, ends, lakeR, lakeC:{x:lakeC.x,z:lakeC.z}, margin:SNAKE_LAKE_MARGIN}}
rebuildLakePoly(lakeC.x,lakeC.z,lakeR,48);
function snakePlaceTrigger(st){
  if(!st.trigger){
    st.trigger=makeSnakeTrigger(); root.add(st.trigger); onDes(st.trigger)}
  /* place pebble ~0.55 m along strike −X from coil (camera-facing side by default) */
  const face=st.th, reach=.55;
  let tx=st.x+Math.cos(face)*reach, tz=st.z-Math.sin(face)*reach;
  if(!snakeOpenSand(tx,tz)){
    /* fall back: any open direction */
    for(let i=0;i<8;i++){
      const a=face+i*(Math.PI/4);
      const x=st.x+Math.cos(a)*reach, z=st.z-Math.sin(a)*reach;
      if(snakeOpenSand(x,z)){tx=x;tz=z;break}}}
  const gy=sampleGroundY(tx,tz);
  st.trigger.position.set(tx, gy+.012, tz);
  st.trigger.visible=true;
  st.strikeTarget={x:tx,z:tz};
  return st.strikeTarget}
function snakeBeginStrike(st){
  /* only from coiled idle; aim −X at trigger / camera-facing side */
  const tgt=snakePlaceTrigger(st);
  st.th=snakeAimYaw(st.x,st.z,tgt.x,tgt.z);
  st.mode="strike"; st.t=0; st.speed=0;
  snakePlay(st,"strike",.05);
  st.strikeCD=rr(40,90)}
function spawnSnake(){
  /* firmly dry dune SE/NE of lake — never near shoreline */
  const spots=[{x:5.4,z:3.6,th:.4},{x:5.8,z:2.4,th:-.3},{x:4.6,z:4.2,th:1.0}];
  let sp=spots[snakes.length%spots.length]||{x:5.2,z:3.4,th:0};
  if(!snakeOpenSand(sp.x,sp.z)){
    for(let k=0;k<24;k++){
      const a=rnd()*TAU,r=rr(lakeR+SNAKE_LAKE_MARGIN+1.2,R*.62),x=Math.cos(a)*r,z=Math.sin(a)*r;
      if(snakeOpenSand(x,z)){sp={x,z,th:sp.th};break}}}
  const host=makeSnakeProcedural();
  const s={o:host,x:sp.x,z:sp.z,th:sp.th,mode:"slither",t:rr(0,4),speed:SNAKE_SLITHER_MPS,
    rig:null,wave:rnd()*TAU,idleFor:rr(3,6),phase:rr(0,10),strikeCD:rr(40,90),trigger:null};
  host.position.set(sp.x,sampleGroundY(sp.x,sp.z)+.06,sp.z); host.rotation.y=sp.th;
  root.add(host); onDes(host); snakes.push(s);
  ensureSnakeProto().then(proto=>{
    if(!proto||s.rig)return;
    try{
      const wrap=(_snakeAdopt++===0)?proto:cloneRig(proto);
      adoptGLB(host,wrap); gradeAnimalGLB(wrap,"snake"); setupSnakeRig(s,wrap);
      snakePlay(s,"slither",.05)}catch(_){}});
  return s}
spawnSnake();if(!MOB)spawnSnake();

/* snake trail Points — DISABLED in desert39: at overview they read as bright white
   rim/shore lines (two snakes → two pale curves on the sand). Keep stubs so update is a no-op. */
const TRN=0,trP=new Float32Array(3),trA=new Float32Array(1),trG=new T.BG();let trI=0;
trG.setAttribute("position",new T.BA(trP,3));trG.setAttribute("a",new T.BA(trA,1));
const trTrailPts=null; /* was Points trail; removed — see artifacts/desert39/white-lines-note.txt */

function snakeSlope(x,z){
  const e=.18; const hx=sampleSnakeGroundY(x+e,z)-sampleSnakeGroundY(x-e,z);
  const hz=sampleSnakeGroundY(x,z+e)-sampleSnakeGroundY(x,z-e);
  return Math.hypot(hx,hz)/(2*e)}
/* Dedicated deck HF for the snake — main HF culls dunes (med+0.45) + sandMed
   clamp, so the coil sits ~0.5 m under the Tripo sand and reads hollow. */
let _snakeHF=null;
function buildSnakeHF(mesh){
  if(!mesh){_snakeHF=null;return}
  const N=72, half=_hfHalf, cell=(half*2)/N;
  const grid=new Float32Array(N*N); grid.fill(-1e9);
  mesh.updateMatrixWorld(true);
  mesh.traverse(o=>{
    if(!o.isMesh||!o.geometry)return;
    const g=o.geometry; if(!g.attributes.normal)g.computeVertexNormals();
    const pos=g.attributes.position, nor=g.attributes.normal; if(!pos||!nor)return;
    const e=o.matrixWorld.elements;
    for(let i=0;i<pos.count;i++){
      const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
      const wx=e[0]*x+e[4]*y+e[8]*z+e[12], wy=e[1]*x+e[5]*y+e[9]*z+e[13], wz=e[2]*x+e[6]*y+e[10]*z+e[14];
      const wny=e[1]*nor.getX(i)+e[5]*nor.getY(i)+e[9]*nor.getZ(i);
      if(wny<0.42)continue;
      /* keep dune tops; only skip extreme palm/tent crowns */
      if(_sandMed!=null&&wy>_sandMed+1.15)continue;
      if(_sandMed!=null&&wy<_sandMed-1.6)continue;
      const ix=((wx+half)/cell)|0, iz=((wz+half)/cell)|0;
      if(ix<0||iz<0||ix>=N||iz>=N)continue;
      const j=iz*N+ix; if(wy>grid[j])grid[j]=wy}});
  for(let pass=0;pass<4;pass++)for(let iz=0;iz<N;iz++)for(let ix=0;ix<N;ix++){
    const j=iz*N+ix; if(grid[j]>-1e8)continue;
    let s=0,c=0;
    for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){
      const x=ix+dx,z=iz+dz; if(x<0||z<0||x>=N||z>=N)continue;
      const v=grid[z*N+x]; if(v>-1e8){s+=v;c++}}
    if(c)grid[j]=s/c}
  for(let i=0;i<grid.length;i++)if(grid[i]<-1e8)grid[i]=_sandMed||0;
  _snakeHF={grid,N,half,cell}}
function sampleSnakeGroundY(x,z){
  let y=sampleGroundY(x,z);
  const src=_snakeHF||_hfFull||_hf;
  if(!src)return y;
  const {grid,N,half,cell}=src;
  const fx=(x+half)/cell, fz=(z+half)/cell;
  const ix=cl(fx|0,0,N-2), iz=cl(fz|0,0,N-2);
  const tx=fx-ix, tz=fz-iz;
  let yF=mix(mix(grid[iz*N+ix],grid[iz*N+ix+1],tx),mix(grid[(iz+1)*N+ix],grid[(iz+1)*N+ix+1],tx),tz);
  if(yF>-1e8)y=Math.max(y, yF);
  const dL=Math.hypot(x-lakeC.x,z-lakeC.z);
  if(dL<lakeR*1.35){
    const shore=lakeY+0.01;
    const k=ss(lakeR*1.35,lakeR*.95,dL);
    y=Math.max(y, mix(y,shore,k))}
  return y}
function snakeUpdate(st,dt,t){
  st.t+=dt; st.phase=(st.phase||0)+dt;
  if(st.strikeCD==null)st.strikeCD=rr(40,90);
  st.strikeCD-=dt;
  const o=st.o, rig=st.rig;

  if(st.mode==="strike"){
    /* hold position; wait for one-shot strike to finish → idle_coiled */
    const a=rig&&rig.act&&rig.act.strike;
    if((a&&a.time>=(a.getClip().duration||SNAKE_STRIKE_DUR)-.04)||st.t>SNAKE_STRIKE_DUR+.2){
      st.mode="idle"; st.t=0; st.idleFor=rr(3,6);
      snakePlay(st,"idle_coiled",.05);
      if(st.trigger)st.trigger.visible=false}
  }else if(st.mode==="slither"&&st.t>5.5){
    const slope=snakeSlope(st.x,st.z);
    if(slope>.18&&((st.phase*1.3)%1)>.45){st.mode="sidewind"; st.t=0}
    else if(((st.phase*2.1)%1)>.55){st.mode="idle"; st.t=0; st.idleFor=rr(4,8)}
    else st.t=0}
  else if(st.mode==="sidewind"&&st.t>4.2){st.mode="slither"; st.t=0}
  else if(st.mode==="idle"){
    /* occasional strike only while coiled, every 40–90 s */
    if(st.strikeCD<=0&&st.t>.8)snakeBeginStrike(st);
    else if(st.t>(st.idleFor||5)){st.mode="slither"; st.t=0}}

  if(st.mode!=="strike"){
    const wantPose=st.mode==="idle"?"idle_coiled":(st.mode==="sidewind"?"sidewind":"slither");
    if(rig)snakePlay(st,wantPose,SNAKE_XFADE)}

  /* smooth heading — frozen during strike (aim set at begin) */
  if(st.mode!=="strike"&&st.mode!=="idle"){
    let wantTh=st.th+Math.sin(t*.9+st.wave)*.35*dt;
    const maxT=CAMEL_MAX_TURN*dt;
    const r=Math.hypot(st.x,st.z);
    if(r>R*.7){const out=Math.atan2(st.x,st.z); let d=((out+Math.PI)-st.th+Math.PI*3)%TAU-Math.PI; wantTh=st.th+cl(d,-maxT,maxT)}
    if(!snakeDryMargin(st.x,st.z)){
      const away=Math.atan2(st.x-lakeC.x,st.z-lakeC.z); let d=(away-st.th+Math.PI*3)%TAU-Math.PI; wantTh=st.th+cl(d,-maxT,maxT)}
    let dth=((wantTh-st.th+Math.PI*3)%TAU)-Math.PI;
    st.th+=cl(dth,-maxT,maxT)}

  const sc=rig&&rig.fitScale||1;
  if(st.mode==="slither"||st.mode==="sidewind"){
    const sp=(st.mode==="sidewind"?SNAKE_SIDEWIND_MPS:SNAKE_SLITHER_MPS)*sc;
    let nx,nz;
    if(st.mode==="sidewind"){nx=st.x+Math.cos(st.th)*sp*dt; nz=st.z+-Math.sin(st.th)*sp*dt}
    else{nx=st.x+Math.sin(st.th)*sp*dt; nz=st.z+Math.cos(st.th)*sp*dt}
    if(snakeOpenSand(nx,nz)){st.x=nx; st.z=nz; st.speed=sp}
    else{
      /* steer onto open dry sand — try away-from-lake then compass */
      const away=Math.atan2(st.x-lakeC.x, st.z-lakeC.z);
      let found=0;
      for(let k=0;k<8;k++){
        const th=away+(k?((k%2?1:-1)*Math.ceil(k/2)*0.45):0);
        const tx=st.x+Math.sin(th)*sp*dt*4, tz=st.z+Math.cos(th)*sp*dt*4;
        if(snakeOpenSand(tx,tz)){st.th=th; found=1; break}}
      if(!found)st.th=away+rr(-.3,.3);
      st.speed=0}
  }else st.speed=0;

  /* plant on MAX visual ground under the whole coil/body */
  const maxG=snakeMaxGroundUnder(st);
  const belly=.08; /* body radius clearance — belly on sand, no hollow interior */
  const eT=.28;
  const yF=sampleSnakeGroundY(st.x+Math.sin(st.th)*eT, st.z+Math.cos(st.th)*eT);
  const yB=sampleSnakeGroundY(st.x-Math.sin(st.th)*eT, st.z-Math.cos(st.th)*eT);
  const yR=sampleSnakeGroundY(st.x+Math.cos(st.th)*eT, st.z-Math.sin(st.th)*eT);
  const yL=sampleSnakeGroundY(st.x-Math.cos(st.th)*eT, st.z+Math.sin(st.th)*eT);
  /* coiled poses: almost no pitch/roll — tilt was cutting the coil into the dune */
  const tilt=(st.mode==="idle"||st.mode==="strike")?.12:.75;
  o.position.set(st.x, maxG+belly, st.z);
  o.rotation.order="YXZ";
  o.rotation.y=st.th;
  o.rotation.x=cl(Math.atan2(yB-yF, 2*eT),-.35,.35)*tilt;
  o.rotation.z=cl(Math.atan2(yL-yR, 2*eT),-.3,.3)*tilt;
  if(rig&&rig.mixer)rig.mixer.update(dt);
  snakeHugBones(st);
  snakeLiftHostToBelly(st);

  /* trail Points removed (desert39) — were the pale white sand lines in overview */}
function snakeMaxGroundUnder(st){
  /* max of visual-ground samples under coil ring + body bones — not just the root */
  let maxG=sampleSnakeGroundY(st.x,st.z);
  const radii=[.12,.26,.4,.55];
  for(let ri=0;ri<radii.length;ri++){
    const r=radii[ri];
    for(let i=0;i<8;i++){
      const a=(i/8)*TAU+(st.th||0)*.15;
      maxG=Math.max(maxG, sampleSnakeGroundY(st.x+Math.cos(a)*r, st.z+Math.sin(a)*r))}}
  const wrap=st.glb;
  if(wrap){
    wrap.updateMatrixWorld(true);
    const _p=new V3();
    wrap.traverse(b=>{
      if(!b.isBone)return;
      if(!(b.name==="Head"||/^Body_/.test(b.name)))return;
      b.getWorldPosition(_p);
      maxG=Math.max(maxG, sampleSnakeGroundY(_p.x,_p.z))})}
  return maxG}
function snakeHugBones(st){
  /* after mixer: only push up when a segment digs into visual sand */
  const wrap=st.glb; if(!wrap)return;
  wrap.updateMatrixWorld(true);
  const half=.05*(st.rig&&st.rig.fitScale||1);
  const _p=new V3();
  wrap.traverse(b=>{
    if(!b.isBone)return;
    if(!(b.name==="Head"||/^Body_/.test(b.name)))return;
    b.getWorldPosition(_p);
    const gy=sampleSnakeGroundY(_p.x,_p.z)+half;
    const dy=gy-_p.y;
    if(dy>0.015)b.position.y+=Math.min(dy*.85, .12);
  });
  wrap.updateMatrixWorld(true)}
function snakeLiftHostToBelly(st){
  /* final host lift so the lowest body bone sits on max visual ground under the body */
  const wrap=st.glb; if(!wrap||!st.o)return;
  wrap.updateMatrixWorld(true);
  const half=.08*(st.rig&&st.rig.fitScale||1);
  const _p=new V3();
  let minY=1e9, maxG=sampleSnakeGroundY(st.x,st.z);
  wrap.traverse(b=>{
    if(!b.isBone)return;
    if(!(b.name==="Head"||/^Body_/.test(b.name)))return;
    b.getWorldPosition(_p);
    minY=Math.min(minY,_p.y);
    maxG=Math.max(maxG, sampleSnakeGroundY(_p.x,_p.z))});
  if(minY>1e8)return;
  const want=maxG+half;
  if(minY<want){st.o.position.y+=(want-minY); wrap.updateMatrixWorld(true)}}

/* ---------------- blowing sand / sandstorm ---------------- */
const SND=MOB?2000:3600,snR=R*.96;
const snG=new T.BG(),snP=new Float32Array(SND*3),snA=new Float32Array(SND),snA0=new Float32Array(SND),SNF=[];
snG.setAttribute("position",new T.BA(snP,3));snG.setAttribute("a",new T.BA(snA,1));
const snM=new T.SM({transparent:true,depthWrite:false,uniforms:{col:{value:new C3("#d4b07a")},scale:{value:1}},
 vertexShader:`attribute float a;varying float vA;uniform float scale;void main(){vA=a;vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=max(1.1,scale*(2.+3.*a)/max(.45,-mv.z));}`,
 fragmentShader:`uniform vec3 col;varying float vA;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(col,vA*smoothstep(.5,0.,d));}`});
root.add(Object.assign(new T.Points(snG,snM),{frustumCulled:false,renderOrder:4}));
function snSeed(i){
  const a=rnd()*TAU,r=Math.sqrt(rnd())*snR;const x=Math.cos(a)*r,z=Math.sin(a)*r;
  const y=rnd()<.6?hAt(x,z)+rr(.02,.3):rr(.3,3.2);
  SNF[i]={x,y,z,v:rr(.35,1.1),ph:rnd()*TAU};snP[i*3]=x;snP[i*3+1]=y;snP[i*3+2]=z;snA0[i]=rr(.12,.5);snA[i]=0}
for(let i=0;i<SND;i++)snSeed(i);
const STN=MOB?5:9,streamers=[];
(function(){
  for(let i=0;i<STN;i++){
    const g=new T.BG(),n=24,pos=new Float32Array(n*3),a=new Float32Array(n);
    g.setAttribute("position",new T.BA(pos,3));g.setAttribute("a",new T.BA(a,1));
    const m=new T.SM({transparent:true,depthWrite:false,uniforms:{col:{value:new C3("#e0c090")}},
      vertexShader:`attribute float a;varying float vA;void main(){vA=a;vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=max(1.4,6.5/max(.4,-mv.z));}`,
      fragmentShader:`uniform vec3 col;varying float vA;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(col,vA*smoothstep(.5,0.,d)*.65);}`});
    const pts=new T.Points(g,m);pts.frustumCulled=false;root.add(pts);
    streamers.push({pts,pos,a,n,th:rnd()*TAU,rad:rr(2,5),life:rnd()})}
})();

function sandUpdate(dt,t,wn,storm){
  const cam=De.position,wx=Math.sin(t*.05+1)*.15+wn*.9,wz=Math.cos(t*.04)*.08+wn*.2;
  for(let i=0;i<SND;i++){
    const q=SNF[i];q.x+=wx*(.7+q.v)*.85*dt;q.z+=wz*(.7+q.v)*.85*dt;q.y+=Math.sin(t*2+q.ph)*.015*dt;
    let dx=q.x-cam.x,dz=q.z-cam.z;const r2=dx*dx+dz*dz,R2=snR*snR;
    if(r2>R2){const s=snR/Math.sqrt(r2);q.x=cam.x-dx*s*.98;q.z=cam.z-dz*s*.98}
    if(q.y>3.8||q.y<hAt(q.x,q.z)-.05)snSeed(i);
    snP[i*3]=q.x;snP[i*3+1]=q.y;snP[i*3+2]=q.z;
    /* wrap + edge fade + near-camera size handled in shader scale */
    const edgeFade=1-ss(snR*.78,snR,Math.hypot(q.x,q.z));
    const nearCam=1-ss(2.5,8,Math.sqrt(r2)); /* damp alpha near camera */
    snA[i]=snA0[i]*(.18+wn*.5+storm*.9)*edgeFade*(.55+.45*nearCam)}
  snG.attributes.position.needsUpdate=snG.attributes.a.needsUpdate=true;
  /* near-camera size cap */
  const camDist=Math.hypot(cam.x,cam.z);snM.uniforms.scale.value=cl(1.15-camDist*.02,.55,1.2);
  snM.uniforms.col.value.set(0.9,.74,.52).multiplyScalar(1-st.night*.35);
  streamers.forEach((s,si)=>{
    s.life+=dt*(.35+storm*1.1);if(s.life>1){s.life=0;s.th=rnd()*TAU;s.rad=rr(2.5,6.2)}
    /* prefer dune crests on the right */
    const crestBias=ss(1,5,Math.cos(s.th)*s.rad);
    for(let i=0;i<s.n;i++){
      const u=i/(s.n-1);const x=Math.cos(s.th)*s.rad+u*wx*2.4,z=Math.sin(s.th)*s.rad+u*wz*2.2;
      const y=hAt(x,z)+.05+u*u*(.55+storm)+Math.sin(t*5+si+u*7)*.04;
      s.pos[i*3]=x;s.pos[i*3+1]=y;s.pos[i*3+2]=z;s.a[i]=(1-u)*(.12+storm*.65+crestBias*.2)*ss(0,.25,s.life)*ss(1,.7,s.life)}
    s.pts.geometry.attributes.position.needsUpdate=s.pts.geometry.attributes.a.needsUpdate=true;
    /* never show streamers in desert — calm or storm they read as white diagonal rays */
    s.pts.visible=false;
    if(s.pts.material&&s.pts.material.uniforms&&s.pts.material.uniforms.col)
      s.pts.material.uniforms.col.value.set(0.55,.42,.28)})}

/* ---------------- audio ---------------- */
const AU={ctx:null,master:null,wind:null,fire:null,ready:false,eagleT:0};
function SX(){return window.__sndX||null}
function ensureAudio(){
  const x=SX();if(!x||!x.s)return null;const ctx=x.s;
  if(!AU.ready){
    AU.ctx=ctx;AU.master=ctx.createGain();AU.master.gain.value=0;AU.master.connect(ctx.destination);
    const buf=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate),d=buf.getChannelData(0);
    for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*.35;
    const src=ctx.createBufferSource();src.buffer=buf;src.loop=true;
    const bp=ctx.createBiquadFilter();bp.type="bandpass";bp.frequency.value=380;bp.Q.value=.7;
    const g=ctx.createGain();g.gain.value=0;src.connect(bp);bp.connect(g);g.connect(AU.master);src.start();AU.wind={bp,g};
    const fb=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate),fd=fb.getChannelData(0);
    for(let i=0;i<fd.length;i++)fd[i]=(Math.random()*2-1)*Math.pow(Math.random(),8);
    const fs=ctx.createBufferSource();fs.buffer=fb;fs.loop=true;const fg=ctx.createGain();fg.gain.value=0;
    const ff=ctx.createBiquadFilter();ff.type="highpass";ff.frequency.value=800;fs.connect(ff);ff.connect(fg);fg.connect(AU.master);fs.start();AU.fire={g:fg};AU.ready=true}
  return AU}
function eagleCry(pos){
  const A=ensureAudio();if(!A||!A.ctx)return;const ctx=A.ctx,now=ctx.currentTime;
  const o=ctx.createOscillator(),o2=ctx.createOscillator(),g=ctx.createGain(),f=ctx.createBiquadFilter();
  o.type="sawtooth";o2.type="triangle";f.type="bandpass";f.frequency.value=1750;f.Q.value=4;
  o.frequency.setValueAtTime(1400,now);o.frequency.exponentialRampToValueAtTime(700,now+.5);
  o2.frequency.setValueAtTime(950,now);o2.frequency.exponentialRampToValueAtTime(460,now+.5);
  g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(.15,now+.03);g.gain.exponentialRampToValueAtTime(.001,now+.65);
  const p=ctx.createPanner();p.panningModel="HRTF";p.refDistance=4;
  if(pos){p.positionX.value=pos.x;p.positionY.value=pos.y;p.positionZ.value=pos.z}
  o.connect(f);o2.connect(f);f.connect(g);g.connect(p);p.connect(A.master);o.start(now);o2.start(now);o.stop(now+.7);o2.stop(now+.7)}
function snakeRustle(pos,spd){
  const A=ensureAudio();if(!A||!A.ctx||spd<.1)return;const ctx=A.ctx,now=ctx.currentTime;
  const n=ctx.createBuffer(1,ctx.sampleRate*.07,ctx.sampleRate),d=n.getChannelData(0);
  for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.exp(-i/d.length*3);
  const s=ctx.createBufferSource();s.buffer=n;const f=ctx.createBiquadFilter();f.type="bandpass";f.frequency.value=2100;f.Q.value=1.2;
  const g=ctx.createGain();g.gain.value=.018*cl(spd,0,1.5);const p=ctx.createPanner();p.panningModel="HRTF";p.refDistance=3;
  if(pos){p.positionX.value=pos.x;p.positionY.value=pos.y;p.positionZ.value=pos.z}
  s.connect(f);f.connect(g);g.connect(p);p.connect(A.master);s.start(now)}

/* ---------------- frame ---------------- */
const st={t:0,ts:1,wn:.35,night:0,storm:0};
let _capLock=false; /* when true, rAF skips — only __desQA().step drives sim */
function update(dt){
  if(_capLock)return;
  if(!root.visible)return;dt=Math.min(dt,.05)*st.ts;st.t+=dt;const t=st.t;
  const wn=Ue.uWind?Ue.uWind.value:(Ct.wind||.35);st.wn=wn;
  const night=qt.night||0;st.night=night;
  const rainy=/rain|storm|hail/.test(Ct.weather||"");
  const storm=cl(Math.max(rainy?.85:0,(Ct.weather==="storm"||wn>.78)?(wn-.5)*2:0),0,1);st.storm=storm;

  lakeU.uT.value=t;lakeU.uWind.value=wn*.4;lakeU.uNight.value=night;
  /* FrontSide water — hide when camera under deck (app clamps camY≥0.25) */
  if(lake){
    const camY=De&&De.position?De.position.y:99;
    const wy=lake.userData.waterY!=null?lake.userData.waterY:lakeY;
    const deck=(_sandMed!=null?_sandMed:wy+1.2);
    lake.visible=!!root.visible&&camY>wy+.12&&camY>deck*.35+.4}
  if(pi){lakeU.uSunDir.value.copy(pi.position).normalize();lakeU.uSunCol.value.copy(pi.color)}
  if(jt&&jt.top)lakeU.uSky.value.copy(jt.top.value);

  palms.forEach(p=>{const c=p.userData.crown;if(!c||p.userData.useGlb)return;c.children.forEach((fr,j)=>{
    if(fr.userData.baseX==null)fr.userData.baseX=fr.rotation.x;
    if(fr.userData.baseZ==null)fr.userData.baseZ=fr.rotation.z||0;
    const ph=fr.userData.ph||0;
    fr.rotation.z=fr.userData.baseZ+.14*wn*Math.sin(t*1.35+ph)+.04*Math.sin(t*.6+j);
    fr.rotation.x=fr.userData.baseX+.09*wn*Math.sin(t*1.1+ph)+.03*wn*Math.sin(t*2.1+ph*1.3);
    const strip=fr.children[0];if(strip&&strip.rotation)strip.rotation.x=.05*wn*Math.sin(t*1.6+ph)})});
  reedG.children.forEach(b=>{b.rotation.z=.14*wn*Math.sin(t*2+(b.userData.ph||0))});
  if(tent&&tent.userData.cloths&&!tent.userData.useGlb)tent.userData.cloths.forEach((c,i)=>{
    const geo=c.geometry,pos=geo.attributes.position;if(!pos)return;
    if(!c.userData.base)c.userData.base=new Float32Array(pos.array);
    const base=c.userData.base,fl=c.userData.flutter;
    for(let k=0;k<pos.count;k++){
      const o=k*3,mask=fl?fl[k]:0; if(!mask){pos.array[o]=base[o];pos.array[o+1]=base[o+1];pos.array[o+2]=base[o+2];continue}
      const wiggle=wn*.05*Math.sin(t*6.2+base[o]*3.5+i)*Math.sin(t*4.1+base[o+1]*4);
      pos.array[o]=base[o]+wiggle;pos.array[o+1]=base[o+1]+wiggle*.55;pos.array[o+2]=base[o+2]+wiggle*.4}
    pos.needsUpdate=true});

  /* thin single smoke column from campfire only — wispy filaments, peak α≈0.32, gone by ~3.5–4 m */
  {const fp=fireG.position;
  for(let i=0;i<SMN;i++){const k=SMF[i];
    k.life+=dt*.095; if(k.life>1){k.life=0;k.jx=rr(-1,1);k.jz=rr(-1,1);k.ph=rnd()*TAU}
    const u=k.life;
    const h=u*3.6;
    const widen=.15+h*.16; /* ~0.15 m base, slow flare */
    const driftX=wn*.5*h+k.jx*.06*h;
    const driftZ=wn*.16*h+k.jz*.06*h;
    const x=fp.x+driftX+Math.sin(t*1.05+k.ph)*.015*h;
    const y=fp.y+.1+h;
    const z=fp.z+driftZ+Math.cos(t*.85+k.ph)*.015*h;
    k.mesh.position.set(x,y,z);
    k.mesh.scale.set(widen/.14, (.55+h*.08)/.7, 1);
    if(De)k.mesh.quaternion.copy(De.quaternion);
    const birth=ss(0,.1,u), death=1-ss(.75,1,u);
    const hFade=1-ss(2.6,3.85,h);
    const peak=.30+night*.03;
    k.mat.uniforms.op.value=Math.max(0, peak*birth*death*hFade)}}
  (fireG.userData.flames||[]).forEach((fl,i)=>{
    const bob=.85+.15*Math.sin(t*14+i*1.7)+.08*Math.sin(t*23+i);
    fl.scale.set(bob,bob*1.1,1);
    if(fl.material.uniforms&&fl.material.uniforms.op)fl.material.uniforms.op.value=.4+.4*bob;
    fl.position.y=.1+i*.035+.02*Math.sin(t*11+i);
    if(De)fl.quaternion.copy(De.quaternion)});
  const fl=fireG.userData.light,tl=fireG.userData.tentL;
  if(tl)tl.intensity+=(night*1.0+.02-tl.intensity)*ease(3,dt);
  /* true skybox: follow camera; billboard sun disc to camera */
  if(cloudSea&&De&&root.visible){
    cloudSea.position.copy(De.position);
    if(cloudSea.userData.sunDisc){
      const sd=cloudSea.userData.sunDisc;
      /* place sun in camera upper-right (ref composition) — cloudSea is at De */
      const qx=De.quaternion.x,qy=De.quaternion.y,qz=De.quaternion.z,qw=De.quaternion.w;
      /* camera basis from quaternion */
      const rx=1-2*(qy*qy+qz*qz), ry=2*(qx*qy+qw*qz), rz=2*(qx*qz-qw*qy);
      const ux=2*(qx*qy-qw*qz), uy=1-2*(qx*qx+qz*qz), uz=2*(qy*qz+qw*qx);
      const fx=2*(qx*qz+qw*qy), fy=2*(qy*qz-qw*qx), fz=1-2*(qx*qx+qy*qy);
      /* small sun upper-right of frame (Three cam looks -Z) */
      sd.position.set(rx*14+ux*10+fx*(-36), ry*14+uy*10+fy*(-36), rz*14+uz*10+fz*(-36));
      sd.lookAt(De.position.x,De.position.y,De.position.z)}}
  /* gentle cloud puff drift + billboard to camera — edge-on planes were the white ray streaks */
  if(cloudSea&&cloudSea.userData.sprites&&De){
    cloudSea.userData.sprites.children.forEach(pl=>{
      const u=pl.userData;if(!u)return;
      const drift=u.drift||.01;
      const th=u.th0+t*drift+Math.sin(t*.08+u.ph)*.015;
      pl.position.x=Math.cos(th)*u.rad;pl.position.z=Math.sin(th)*u.rad;
      pl.position.y=u.y0+Math.sin(t*.1+u.ph)*.22;
      pl.lookAt(De.position.x,pl.position.y,De.position.z);
      pl.rotateX(-.08+Math.sin(t*.09+u.ph)*.03)})}
  /* puff cumulus bank under island */
  if(window.__desPuffBank){
    const B=window.__desPuffBank;
    for(let i=0;i<B.n;i++){
      const b=B.CB[i]; b.th+=b.w*dt;
      B.p[i*3]=Math.cos(b.th)*b.rad; B.p[i*3+2]=Math.sin(b.th)*b.rad;
      B.p[i*3+1]=b.y+.35*Math.sin(t*.08+b.ph);
      B.a[i]=.62+.14*Math.sin(t*.05+b.ph*2); B.s[i]=b.sz}
    B.g.attributes.position.needsUpdate=B.g.attributes.aA.needsUpdate=B.g.attributes.aS.needsUpdate=true;
    /* sunlit warm tops + soft lavender at night */
    const lit=night>.5?.45:1;
    B.uC.value.set(.96*lit*(1-night*.45)+.42*night, .9*lit*(1-night*.35)+.52*night, .86*lit*(1-night*.2)+.68*night)}

    /* Tripo prop wind uniforms */
  palmFrondMats.forEach(m=>{if(m&&m.userData&&m.userData._windU)m.userData._windU.value=t});
  if(tripo.tent)tripo.tent.traverse(o=>{const m=o.material; if(m&&m.userData&&m.userData._windU)m.userData._windU.value=t});
  sandUpdate(dt,t,wn,storm);
  /* desert lighting — HARD set each frame: app s0() overwrites pi/dc/fog before __desU,
     so lerp never accumulates. Invalid Ct.mode "night" is NOT in Iy{} → Se/qt NaN → black frames. */
  if(Ct.mode==="night"){Ct.mode="full";Ct.night=true}
  const isDay=Ct.mode==="day"||(Ct.mode==="manual"&&!Ct.night&&Ct.season===1&&(Ct.weather==="sun"||!Ct.weather)&&!storm);
  const wantNight=(Ct.night||Ct.mode==="full"||Ct.mode==="crescent"||Ct.mode==="half")?Math.max(night,.92):night;
  if(pi&&root.visible){
    /* sun matches backdrop: right-of-centre, low — long warm shadows across sand */
    const el=wantNight>.5?26:storm>.3?16:isDay?48:12;
    const az=wantNight>.5?-35:isDay?55:72; /* ~right of frame for overview */
    const rad=el*Math.PI/180,azr=az*Math.PI/180;
    const dist=wantNight>.5?28:30;
    pi.position.set(Math.cos(rad)*Math.sin(azr)*dist,Math.sin(rad)*dist,Math.cos(rad)*Math.cos(azr)*dist);
    if(pi.target){pi.target.position.set(0,-1,0);pi.target.updateMatrixWorld()}
    const fixCol=(c,hex)=>{if(!c||!Number.isFinite(c.r)||!Number.isFinite(c.g)||!Number.isFinite(c.b)){if(c)c.set(hex);return} c.set(hex)};
    if(!Number.isFinite(pi.intensity))pi.intensity=1;
    pi.color.set(wantNight>.5?"#a8c0ff":storm>.3?"#c4a070":isDay?"#fff2d8":"#ffb060");
    pi.intensity=wantNight>.5?.95:storm>.3?1.45:isDay?2.5:3.15; /* warmer gold key for sand glow */
    pi.castShadow=true;pi.shadow.autoUpdate=true;
    if(dc){
      fixCol(dc.color,wantNight>.5?"#1a2848":storm>.3?"#9a8878":isDay?"#d8e4f0":"#5a6888");
      if(dc.groundColor)fixCol(dc.groundColor,wantNight>.5?"#121820":storm>.3?"#6a5038":"#9a5030");
      dc.intensity=wantNight>.5?.42:storm>.3?.5:isDay?.48:.18}
    if(X.vd){X.vd.visible=false;X.vd.traverse(c=>{c.visible=false})}
    if(jt){
      if(jt.uGlowA)jt.uGlowA.value=0;if(jt.uSunVis)jt.uSunVis.value=0;
      if(wantNight>.5){jt.top&&jt.top.value.set("#030814");jt.bot&&jt.bot.value.set("#0a1428");
        if(jt.uNight)jt.uNight.value=1;if(jt.uMoonVis)jt.uMoonVis.value=.95;
        if(jt.uStarF)jt.uStarF.value=1.6}
      else if(storm>.3){jt.top&&jt.top.value.set("#6a5040");jt.bot&&jt.bot.value.set("#a88868");
        if(jt.uCover)jt.uCover.value=.95;if(jt.uDark)jt.uDark.value=.75}
      else if(isDay){jt.top&&jt.top.value.set("#5a9ada");jt.bot&&jt.bot.value.set("#c8e4f8");
        if(jt.uNight)jt.uNight.value=0;if(jt.uCover)jt.uCover.value=.1}
      else{jt.top&&jt.top.value.set("#4a6a98");jt.bot&&jt.bot.value.set("#f0a868");
        if(jt.uNight)jt.uNight.value=0}}
    /* photographic backdrop tint per mode */
    const skyU=cloudSea&&cloudSea.userData.skyU;
    if(skyU){skyU.uNight.value=wantNight>.5?1:0; skyU.uStorm.value=storm>.3?1:0; skyU.uDay.value=isDay?1:0}
    const cylU=cloudSea&&cloudSea.userData.cylU;
    if(cylU){cylU.uNight.value=wantNight>.5?1:0; cylU.uStorm.value=storm>.3?1:0; cylU.uDay.value=isDay?1:0}
    if(cloudSea&&cloudSea.userData.setModeTint)cloudSea.userData.setModeTint(isDay,wantNight,storm);
    /* sun disc shown by setModeTint for sunset/day; do not force-hide */
    ((cloudSea&&cloudSea.userData.seaMats)||[]).forEach((s)=>{
      if(s.pl)s.pl.visible=false; if(s.m)s.m.opacity=0});
    if(lakeU&&lakeU.uSky){
      /* subtle sky reflection — lavender/warm at sunset */
      lakeU.uSky.value.set(wantNight>.5?"#1a2438":storm>.3?"#6a6058":isDay?"#7a98a8":"#7a6888");
      if(lakeU.uSunDir&&pi){const d=pi.position; const len=Math.hypot(d.x,d.y,d.z)||1; lakeU.uSunDir.value.set(d.x/len,d.y/len,d.z/len)}
      if(lakeU.uNight)lakeU.uNight.value=wantNight}
    if(lakeU&&lakeU.uDeep){
      lakeU.uDeep.value.set(wantNight>.5?"#153e48":"#237a82");
      lakeU.uShal.value.set(wantNight>.5?"#2a5e68":"#6fb3ae")}
    [X.Dc,X.qc].forEach(o=>{if(!o)return; o.visible=false; o.traverse&&o.traverse(c=>{c.visible=false; if(c.layers)c.layers.disable(3)})});
    if(wantNight>.5){
      if(Cn){Cn.toneMappingExposure=.7; if(Cn.setClearColor)Cn.setClearColor(0x0a1528,1)}
      if(X.sr)X.sr.visible=true}
    else{
      if(X.sr)X.sr.visible=false;
      if(Cn){Cn.toneMappingExposure=storm>.3?.9:isDay?1.05:1.02;
        if(Cn.setClearColor)Cn.setClearColor(storm>.3?0x6a5040:isDay?0x9ab8d0:0x7a4a38,1)}}
  }
  if(Jt.fog&&root.visible){
    /* far haze only — island materials are fog:false */
    const fogHex=wantNight>.5?"#0a1528":storm>.3?"#9a8878":isDay?"#c8d8e8":"#c89868";
    if(!Number.isFinite(Jt.fog.color.r))Jt.fog.color.set(fogHex);
    else Jt.fog.color.set(fogHex);
    Jt.fog.near=wantNight>.5?180:storm>.3?140:isDay?130:120;
    Jt.fog.far=wantNight>.5?520:storm>.3?420:isDay?560:480}
  if(window.__desCliffU&&pi){
    const d=pi.position; const len=Math.hypot(d.x,d.y,d.z)||1;
    window.__desCliffU.sunDir.value.set(d.x/len,d.y/len,d.z/len)}
  /* campfire pool at night */
  if(fireG&&fireG.userData.light){
    const fl=fireG.userData.light;
    fl.intensity=wantNight>.4?3.4+Math.sin(t*9)*.4:.08}

  camels.forEach(c=>camelUpdate(c,dt,t));
  eagleUpdate(dt,t);
  snakes.forEach(s=>{snakeUpdate(s,dt,t);
    if((t*8|0)!==((t-dt)*8|0)){
      const p=s.o.userData.useGlb?s.o.position:(s.o.userData.segs&&s.o.userData.segs[0]?s.o.userData.segs[0].position:s.o.position);
      snakeRustle(p,s.speed||.45)}});

  AU.eagleT-=dt;if(eagle.cry||(eagle.mode==="soar"&&AU.eagleT<=0&&rnd()<.007)){eagleCry(eagle.o.position);AU.eagleT=rr(7,16);eagle.cry=0}

  const A=ensureAudio();
  if(A&&A.wind){const now=A.ctx.currentTime;A.wind.g.gain.setTargetAtTime((.02+wn*.1+storm*.15)*(root.visible?1:0),now,.3);A.wind.bp.frequency.setTargetAtTime(250+wn*650,now,.4)}
  if(A&&A.fire)A.fire.g.gain.setTargetAtTime(night*.045*(root.visible?1:0),A.ctx.currentTime,.4);
  if(A&&A.master){const x=SX();A.master.gain.setTargetAtTime((root.visible&&x&&x.on)?.7:0,A.ctx.currentTime,.3)}

  if(Jt.fog&&root.visible){
    if(storm>.2){Jt.fog.near=Math.max(Jt.fog.near,R*6);Jt.fog.far=Math.max(Jt.fog.far,R*16)}
    if(wantNight>.5||night>.5){Jt.fog.near=Math.max(Jt.fog.near,R*6);Jt.fog.far=Math.max(Jt.fog.far,R*18)}}
}

function show(on){
  root.visible=on;De.layers.set(on?3:0);window.__desA=on;
  /* painted sky replaces yard dome while desert is active */
  if(X.vd){X.vd.visible=!on;X.vd.traverse(c=>{c.visible=!on})}
  if(Jt){if(on){Jt.background=null;if(Jt.fog){Jt.fog.near=190;Jt.fog.far=560}}
    else if(X.vd)X.vd.visible=true}
  /* mild bloom for small sun disc only — high threshold avoids palm-crown ghosts */
  if(window.__bloom){
    if(on){
      if(window.__bloom._desSave==null)window.__bloom._desSave={t:window.__bloom.threshold,s:window.__bloom.strength,en:window.__bloom.enabled};
      window.__bloom.threshold=.94;window.__bloom.strength=.28;window.__bloom.enabled=true}
    else if(window.__bloom._desSave){
      window.__bloom.threshold=window.__bloom._desSave.t;window.__bloom.strength=window.__bloom._desSave.s;
      window.__bloom.enabled=window.__bloom._desSave.en!==false;window.__bloom._desSave=null}}
  if(on){
    /* Iy has no "night" — remap to full moon or NaN kills lights/fog (desert17 black frames) */
    if(Ct.mode==="night"){Ct.mode="full";Ct.night=true}
    /* coerce day→manual+summer (Ui/Ad blacks desert on mode=day); never clobber night/storm/sunset */
    if(Ct.mode==="day"){Ct.mode="manual";Ct.night=false;Ct.season=1}
    else if(!Ct.mode){Ct.mode="sunset";Ct.night=false}
    /* do NOT force sunset when caller set night/storm/manual */
    [X.Dc,X.qc].forEach(o=>{if(!o)return; o.visible=false; o.traverse&&o.traverse(c=>{c.visible=false; if(c.layers)c.layers.disable(3)})});
    const isN=!!(Ct.night||Ct.mode==="full"||Ct.mode==="crescent"||Ct.mode==="half");
    const isSt=/storm/.test(Ct.weather||"");
    if(Jt.fog){Jt.fog.near=isN?180:120;Jt.fog.far=isN?520:480;Jt.fog.color.set(isN?"#0a1528":isSt?"#b89068":"#c89868")}
    if(Cn&&Cn.setClearColor)Cn.setClearColor(isN?0x0a1528:isSt?0x6a5040:0xc47840,1);
    if(pi){
      if(isN)pi.position.set(-18,12,16); else pi.position.set(28,3.2,10);
      pi.intensity=isN?.95:isSt?1.55:3.85;pi.color.set(isN?"#a8c0ff":isSt?"#c4a070":"#ff9a40");
      pi.castShadow=true;pi.shadow.autoUpdate=true;
      Object.assign(pi.shadow.camera,{left:-30,right:30,top:30,bottom:-30,near:.5,far:120});
      pi.shadow.mapSize.set(2048,2048);pi.shadow.bias=-.0005;pi.shadow.normalBias=.035;pi.shadow.radius=2.8;
      pi.shadow.camera.updateProjectionMatrix();
      if(pi.target){pi.target.position.set(0,-.8,0);pi.target.updateMatrixWorld()}}
    if(dc){dc.color.set(isN?"#1a2848":"#6a78b0");dc.groundColor&&dc.groundColor.set(isN?"#121820":"#4a3840");dc.intensity=isN?.42:.28}
    if(jt){jt.top&&jt.top.value.set(isN?"#030814":"#3a2a68");jt.bot&&jt.bot.value.set(isN?"#0a1428":"#f0a868");
      if(jt.uSunVis)jt.uSunVis.value=0;if(jt.uGlowA)jt.uGlowA.value=0;if(jt.uNight)jt.uNight.value=isN?1:0;
      if(jt.uMoonVis)jt.uMoonVis.value=isN?.95:0; if(jt.uStarF)jt.uStarF.value=isN?1.6:0;
      if(jt.uSunDisk)jt.uSunDisk.value.set(1,.75,.4)}
    if(cloudSea&&cloudSea.userData.skyU){cloudSea.userData.skyU.uNight.value=isN?1:0;cloudSea.userData.skyU.uStorm.value=isSt?1:0;cloudSea.userData.skyU.uDay.value=0}
    if(cloudSea&&cloudSea.userData.cylU){cloudSea.userData.cylU.uNight.value=isN?1:0;cloudSea.userData.cylU.uStorm.value=isSt?1:0;cloudSea.userData.cylU.uDay.value=0}
    if(cloudSea&&cloudSea.userData.setModeTint)cloudSea.userData.setModeTint(false,isN?1:0,isSt?1:0);
    /* sun disc visible in sunset (setModeTint); hide only night/storm */
    if(cloudSea&&cloudSea.userData.sunDisc)cloudSea.userData.sunDisc.visible=!isN&&!isSt;
    ((cloudSea&&cloudSea.userData.seaMats)||[]).forEach(s=>{
      if(!s.cumulus){s.m.opacity=0;if(s.pl)s.pl.visible=false;return}
      if(s.m.emissive)s.m.emissive.set(isN?"#6878a0":"#ffe8c0");
      if(s.m.color)s.m.color.set(isN?"#405068":"#fff0e0");
      s.m.opacity=isN?s.baseOp*.22:s.baseOp*.55; if(s.m.emissiveIntensity!=null)s.m.emissiveIntensity=isN?.12:.28;
      if(s.pl)s.pl.visible=true});
    if(Cn){Cn.shadowMap.enabled=true;Cn.toneMappingExposure=isN?.7:isSt?.9:1.12}
    if(X.sr)X.sr.visible=!!isN;
    root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}})
  }
  const x=SX();if(x&&x.C)x.C();
  if(!on&&AU.master&&AU.ctx)AU.master.gain.setTargetAtTime(0,AU.ctx.currentTime,.25);
}

/* Sky dome, lights, stars on L3. Skip precip meshes (Dc/qc) — desert mutes rain/hail/snow. */
for(const o of[X.vd,pi,dc,X.sr,...(X.Ca||[]).map(c=>c.m)])o&&o.traverse(c=>c.layers.enable(3));
onDes(root);

/* QA hooks for motion review */
window.__desQA=()=>({camels,eagle,snakes,CAMEL_WALK_MPS,CAMEL_WALK_LOOP,CAMEL_XFADE,CAMEL_GRAZE_DUR,CAMEL_DRINK_DUR,De,Ce,
  get perch(){return eaglePerchWorld()},
  lookAt:(px,py,pz,tx,ty,tz)=>{
    /* hard lock — OrbitControls damping would otherwise keep prior high orbit */
    const damp=Ce.enableDamping, en=Ce.enabled;
    Ce.enableDamping=false; Ce.enabled=false;
    De.position.set(px,py,pz); Ce.target.set(tx,ty,tz);
    De.up.set(0,1,0); De.lookAt(Ce.target); De.updateMatrixWorld(true);
    Ce.enableDamping=damp; Ce.enabled=en},
  forceCamel:(i,mode)=>{const c=camels[i|0];if(!c)return;
    const m=mode||"walk"; c.graze=0; c.drink=0; c.t=0;
    if(m==="idle"){c.mode="idle"; c.tx=c.x; c.tz=c.z; c.idleFor=rr(4,10); camelPlay(c,"idle",.05)}
    else if(m==="graze"){const p=camelPickGraze(); c.x=p.x; c.z=p.z; c.tx=p.x; c.tz=p.z;
      c.mode="graze"; c.graze=.05; camelPlay(c,"graze",.05)}
    else if(m==="drink"){const p=camelPickDrink(c); c.x=p.x; c.z=p.z; c.tx=p.x; c.tz=p.z;
      if(p.facing!=null)c.facing=p.facing; /* QA plant already facing lake */
      c.mode="drink"; c.drink=.05; camelPlay(c,"drink",.05)}
    else{const p=camelPickWalk(); c.x=p.x; c.z=p.z; c.mode="walk"; c.walkTs=1; c.speed=camelWalkSpeed(c,1);
      c.tx=p.x+Math.sin(c.facing)*5.5; c.tz=p.z+Math.cos(c.facing)*5.5;
      if(camelBlocked(c.tx,c.tz,0)){const q=camelPickWalk();c.tx=q.x;c.tz=q.z}
      camelPlay(c,"walk",.05)}
    plantFeet(c.o,c.x,c.z,c.facing);
    if(c.o.userData.useGlb)c.o.position.y=sampleGroundY(c.x,c.z)+.002},
  forceEagle:(mode)=>{
    const m=mode||"soar"; eagle.t=0; eagle.blend=0; eagle.landed=0; eagle.climb=0;
    if(m==="perch"){eagleBeginLand("perch"); eagleStartFlare(); eagleTouchdown()}
    else if(m==="drink"){eagleBeginLand("drink"); eagleStartFlare(); eagleTouchdown()}
    else if(m==="landDrink"||m==="approachDrink"){eagleBeginLand("drink")}
    else if(m==="landPerch"||m==="approachPerch"){eagleBeginLand("perch")}
    else if(m==="flarePerch"){eagleBeginLand("perch"); eagleStartFlare()}
    else if(m==="flareDrink"){eagleBeginLand("drink"); eagleStartFlare()}
    else if(m==="takeoff"){eagleBeginTakeoff()}
    else{eagleShowFly(true); eagle.mode="soar"; eagle.rad=12; eagle.alt=5.5;
      eagle.th=rnd()*TAU; eaglePlayFly("glide",.05);
      eagle.o.position.set(Math.cos(eagle.th)*eagle.rad,eagle.alt,Math.sin(eagle.th)*eagle.rad)}},
  snakeClip:(i,mode)=>{const s=snakes[i|0];if(!s)return;
    if(mode==="strike"){s.mode="idle"; s.t=1; snakePlay(s,"idle_coiled",.05); snakeBeginStrike(s); return}
    s.mode=mode||"slither"; s.t=0;
    if(mode==="idle")snakePlay(s,"idle_coiled",.2);
    else if(mode==="sidewind")snakePlay(s,"sidewind",.2);
    else snakePlay(s,"slither",.2)},
  freeze:(on)=>{_capLock=!!on},
  step:(dt)=>{const was=_capLock; _capLock=false; try{update(dt||1/30)}finally{_capLock=was}},
  followCamel:(i,dist,h)=>{
    const c=camels[i|0];if(!c)return;
    const d=dist||4.2, hh=h||1.85;
    const x=c.x-Math.sin(c.facing)*d, z=c.z-Math.cos(c.facing)*d;
    De.position.set(x, sampleGroundY(c.x,c.z)+hh, z);
    Ce.target.set(c.x, sampleGroundY(c.x,c.z)+1.05, c.z); Ce.update()},
  followEagle:(dist)=>{
    const p=eagleWorldPos(); const d=dist||6.5;
    /* hard-lock follow — continuous as eagle moves; no lag that reads as cuts */
    De.position.set(p.x-d*.75, p.y+2.4, p.z+d*.55);
    Ce.target.set(p.x,p.y+.05,p.z); Ce.update()},
  followSnake:(i,dist,h)=>{
    const s=snakes[i|0];if(!s)return;
    const d=dist||2.2, hh=h||0.95;
    const y=sampleGroundY(s.x,s.z);
    De.position.set(s.x-Math.sin(s.th)*d, y+hh, s.z-Math.cos(s.th)*d);
    Ce.target.set(s.x, y+0.06, s.z); Ce.update()},
  /* true low side: ~1.2–1.5 m height, 2.5–3.5 m away, near-horizontal, snake ~1/3 frame */
  followSnakeLow:(i,dist,h)=>{
    const s=snakes[i|0];if(!s)return;
    const d=dist!=null?dist:3.0, hh=h!=null?h:1.2;
    const y=sampleSnakeGroundY(s.x,s.z);
    /* stand perpendicular to heading (true side profile); pick the dry side */
    let side=s.th+Math.PI/2;
    const a1=s.x+Math.sin(side)*d, b1=s.z+Math.cos(side)*d;
    const a2=s.x+Math.sin(side+Math.PI)*d, b2=s.z+Math.cos(side+Math.PI)*d;
    const dry1=!pointInLakePoly(a1,b1)&&Math.hypot(a1-lakeC.x,b1-lakeC.z)>=lakeR+0.6;
    const dry2=!pointInLakePoly(a2,b2)&&Math.hypot(a2-lakeC.x,b2-lakeC.z)>=lakeR+0.6;
    if(!dry1&&dry2)side+=Math.PI;
    else if(dry1&&dry2){
      /* prefer the side farther from lake centre so lake stays out of the hero plane */
      if(Math.hypot(a2-lakeC.x,b2-lakeC.z)>Math.hypot(a1-lakeC.x,b1-lakeC.z))side+=Math.PI}
    else if(!dry1&&!dry2){
      /* fallback: inland (away from lake) */
      side=Math.atan2(s.x-lakeC.x, s.z-lakeC.z)}
    const px=s.x+Math.sin(side)*d, pz=s.z+Math.cos(side)*d;
    /* look near sand so belly-to-sand contact reads; pitch ~10–18° */
    const ty=y+0.16;
    const damp=Ce.enableDamping, en=Ce.enabled;
    Ce.enableDamping=false; Ce.enabled=false;
    De.position.set(px, y+hh, pz);
    Ce.target.set(s.x, ty, s.z);
    De.up.set(0,1,0); De.lookAt(Ce.target); De.updateMatrixWorld(true);
    Ce.enableDamping=damp; Ce.enabled=en},
  eagleWorld:()=>{const p=eagleWorldPos(); return [p.x,p.y,p.z]},
  /* camel host/root world position (not logical x/hAt/z — that hid a stuck walk) */
  camelWorld:(i)=>{const c=camels[i|0];if(!c||!c.o)return null;
    const p=c.o.position; return [p.x,p.y,p.z]},
  snakeAssertDry:(i)=>snakeAssertDry(snakes[i|0]||snakes[0]),
  pointInLakePoly:(x,z)=>pointInLakePoly(x,z),
  snakeEnds:(i)=>snakeEndsWorld(snakes[i|0]||snakes[0]),
  get lakePoly(){return lakePoly},
  SNAKE_LAKE_MARGIN,
  boneSnap:(which)=>{
    if(which==="camel"){const c=camels[0];if(!c||!c.rig)return null;
      const keys=["tripo0_Left_Limb_0","tripo0_Left_Limb_3","tripo0_Right_Limb_0","tripo0_Right_Limb_3",
        "tripo1_Left_Limb_0","tripo1_Right_Limb_0","tripoSpine_4","tripoHead_0","tripoHead_2"];
      const act=c.rig.actions&&c.rig.actions[c.rig.current];
      const o={clip:c.rig.current,clipT:act&&act.time,mode:c.mode,walkTs:c.walkTs,speed:c.speed};
      keys.forEach(k=>{const b=c.rig.bones[k];if(b)o[k]=[b.quaternion.x,b.quaternion.y,b.quaternion.z,b.quaternion.w,b.rotation.x]});
      return o}
    if(which==="eagle"){
      const wp=eagleWorldPos();
      const o={mode:eagle.mode,flyClip:eagle.flyClip,perchClip:eagle.perchClip,flying:!!eagle._flying,
        pos:[eagle.o.position.x,eagle.o.position.y,eagle.o.position.z],
        world:[wp.x,wp.y,wp.z]};
      const bones=(eagle._flying?eagle.flyGlb:eagle.perchGlb);
      if(bones){let n=0; bones.traverse(b=>{if(b.isBone&&n<6){o[b.name]=[b.rotation.x,b.rotation.y,b.rotation.z];n++}})}
      return o}
    if(which==="snake"){const s=snakes[0];if(!s)return null;
      const o={x:s.x,z:s.z,th:s.th,mode:s.mode,clip:s.rig&&s.rig.current,speed:s.speed};
      if(s.rig&&s.glb){let n=0; s.glb.traverse(b=>{if(b.isBone&&n<6){o[b.name]=[b.rotation.x,b.rotation.y,b.rotation.z];n++}})}
      return o}
    return null},
  status:()=>({camel:camels.map(c=>({mode:c.mode,useGlb:!!c.o.userData.useGlb,rig:!!c.rig,
      clip:c.rig&&c.rig.current, walkW:c.rig&&c.rig.actions&&c.rig.actions.walk?c.rig.actions.walk.getEffectiveWeight():0,
      fitScale:c.rig&&c.rig.fitScale, speed:c.speed, walkTs:c.walkTs, x:c.x,z:c.z,facing:c.facing,canDrink:!!c.canDrink})),
    eagle:{mode:eagle.mode,useGlb:!!eagle.o.userData.useGlb,fly:!!eagle.flyGlb,perch:!!eagle.perchGlb,
      flyClip:eagle.flyClip,perchClip:eagle.perchClip,flying:!!eagle._flying,
      pos:[eagle.o.position.x,eagle.o.position.y,eagle.o.position.z],
      world:(()=>{const p=eagleWorldPos();return [p.x,p.y,p.z]})()},
    snake:snakes.map(s=>({useGlb:!!s.o.userData.useGlb,rig:!!s.rig,clip:s.rig&&s.rig.current,mode:s.mode,x:s.x,z:s.z,speed:s.speed})),
    perch:eaglePerchWorld(), lakeY, waterY:lake&&lake.userData.waterY,
    CAMEL_WALK_MPS})});

/* ---------------- desert15: Tripo island + hi-detail props (ref-match) ---------------- */
const tripo={island:null,palm:null,sag:[],tent:null,ready:0};
function gradeIslandMat(m){
  if(!m)return;
  /* ref deck: lit #d9a55a / shade #b07a40 / hi #f0c27a; underside warmer redder ochre */
  if(m.color)m.color.set("#ffffff");
  if(m.map){ /* neutralize grey albedo — grade supplies gold */ m.color.set("#ffffff")}
  if(m.emissive){m.emissive.set("#000000");m.emissiveIntensity=0}
  m.roughness=m.roughness!=null?Math.max(.78,Math.min(.94,m.roughness)):.86;
  m.metalness=0; m.envMapIntensity=.08;
  m.side=2; m.fog=false;
  if(!m.userData._rippleN){
    const c=document.createElement("canvas");c.width=c.height=128;const g=c.getContext("2d");
    const id=g.createImageData(128,128);
    for(let y=0;y<128;y++)for(let x=0;x<128;x++){
      const u=x/128,v=y/128;
      const r1=Math.sin(u*28.0+v*5.2)*.5+Math.sin(u*14.0-v*22.0)*.35;
      const r2=Math.sin(u*40.0+v*33.0)*.2;
      const nx=.5+r1*.14+r2*.06, ny=.5+r2*.12-r1*.08;
      const o=(y*128+x)*4;id.data[o]=nx*255;id.data[o+1]=ny*255;id.data[o+2]=255;id.data[o+3]=255}
    g.putImageData(id,0,0);
    const nt=new T.CTex(c);nt.wrapS=nt.wrapT=1000;nt.repeat.set(10,10);nt.needsUpdate=true;
    m.normalMap=nt; m.normalScale=new T.V2(.38,.38); m.userData._rippleN=1}
  m.onBeforeCompile=(sh)=>{
    sh.uniforms.uLakeC={value:new V3(lakeC.x,0,lakeC.z)};
    sh.uniforms.uLakeR={value:lakeR};
    m.userData._lakeU=sh.uniforms;
    if(!/vIslN/.test(sh.vertexShader)){
      sh.vertexShader="varying vec3 vIslN; varying vec3 vIslW;\n"+sh.vertexShader;
      sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>',
        `#include <begin_vertex>
         vIslN=normalize(mat3(modelMatrix)*normal);
         vIslW=(modelMatrix*vec4(transformed,1.)).xyz;`);
      sh.fragmentShader="varying vec3 vIslN; varying vec3 vIslW;\n"+sh.fragmentShader}
    if(!/desSandForce22/.test(sh.fragmentShader)){
      sh.fragmentShader="uniform vec3 uLakeC; uniform float uLakeR;\n"+sh.fragmentShader;
      sh.fragmentShader=sh.fragmentShader.replace('#include <map_fragment>',
        `#include <map_fragment>
         /* desSandForce22 — saturated warm gold + sun-facing glow + wet shore */
         {
           float up=smoothstep(.02,.38,vIslN.y);
           float deck=smoothstep(-1.0,.35,vIslW.y);
           float sandK=clamp(max(up*1.05, deck*.9),0.,1.);
           /* ref: lit #d9a55a / shade #b07a40 / hi #f0c27a — push sat hard */
           vec3 sandLit=vec3(0.92,0.70,0.35);
           vec3 sandSh=vec3(0.74,0.48,0.24);
           vec3 sandHot=vec3(1.0,0.82,0.48);
           vec3 ochre=vec3(0.82,0.48,0.26);
           vec3 ochreDeep=vec3(0.52,0.24,0.12);
           float lum0=max(dot(diffuseColor.rgb,vec3(.299,.587,.114)),.04);
           float ripple=.5+.5*sin(vIslW.x*2.8+vIslW.z*.95)*sin(vIslW.z*2.3-vIslW.x*.8);
           float dune=.5+.5*sin(vIslW.x*.5+vIslW.z*.35)*sin(vIslW.z*.65-vIslW.x*.28);
           float shade=mix(.75,1.22,smoothstep(.1,.82,lum0)*mix(.85,1.12,dune)*mix(.94,1.06,ripple));
           float sunF=smoothstep(.0,.7, vIslN.x*.65+vIslN.y*.3+vIslN.z*(-.12));
           vec3 sandT=mix(sandSh, mix(sandLit,sandHot,smoothstep(.3,.85,lum0)*sunF), shade);
           sandT=mix(sandT, sandHot, sunF*sandK*.45);
           float strata=smoothstep(.12,.68,lum0);
           vec3 rockT=mix(ochreDeep, ochre, strata);
           float down=smoothstep(.25,-.3,vIslN.y);
           float under=smoothstep(.2,-2.8,vIslW.y);
           float rockK=clamp(max(1.-sandK, max(down, under)),0.,1.);
           diffuseColor.rgb=mix(diffuseColor.rgb, sandT, sandK*.999);
           diffuseColor.rgb=mix(diffuseColor.rgb, rockT, rockK*.97);
           float dL=length(vIslW.xz-uLakeC.xz);
           /* underwater floor matches deep water (no sand tongue through disc) */
           /* desert27: no underW dark ellipse — was reading as the lake centre blob through water */
           float underW=0.;
           diffuseColor.rgb=mix(diffuseColor.rgb, vec3(0.18,0.48,0.52), underW);
           /* narrow ≤0.3 m slightly darker wet band only — keep desert22 sand grade otherwise */
           float wet=smoothstep(uLakeR+.28,uLakeR+.02,dL)*sandK*(1.-smoothstep(uLakeR+.02,uLakeR-.12,dL));
           diffuseColor.rgb=mix(diffuseColor.rgb, sandSh*vec3(.78,.68,.52), wet*.4);
         }`);}
  };
  m.customProgramCacheKey=()=>"desIslandGrade24a";
  m.needsUpdate=true}
/* warm sand tint — not cream (cream×pale tip = white cone) */
function warmIslandColor(m){ if(m&&m.color)m.color.set("#e3b36a") }
function gradePalmMat(m){
  if(!m)return;
  /* trunk vs frond: keep bark brown; lift fronds to fresh green + sunlit yellow tips */
  const hex=m.color?m.color.getHexString():"";
  const isFrond=(m.map&&m.map.image)||hex==="6f8f3a"||(m.color&&m.color.g>m.color.r&&m.color.g>m.color.b);
  if(isFrond){if(m.color)m.color.set("#8fbc4a")}
  else if(m.color)m.color.set("#c4a070");
  m.onBeforeCompile=(sh)=>{
    sh.uniforms.uWindT={value:0};
    sh.vertexShader="uniform float uWindT;\n"+sh.vertexShader;
    sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>',
      `#include <begin_vertex>
       float wPalm=smoothstep(.35,1.2,position.y);
       transformed.x+=sin(uWindT*1.1+position.y*2.2)*wPalm*.04;
       transformed.z+=cos(uWindT*.9+position.y*1.7)*wPalm*.03;`);
    sh.fragmentShader=sh.fragmentShader.replace('#include <map_fragment>',
      `#include <map_fragment>
       float g=diffuseColor.g, r=diffuseColor.r, b=diffuseColor.b;
       float leaf=smoothstep(.02,.12,g-r)*smoothstep(-.02,.1,g-b);
       vec3 fresh=vec3(0.45,0.62,0.22);
       vec3 tip=vec3(0.78,0.72,0.28);
       float tipK=smoothstep(.45,.85,g)*leaf;
       diffuseColor.rgb=mix(diffuseColor.rgb, mix(fresh,tip,tipK*.65), leaf*.55);
       /* don't crush highlights — keep sunlit tips */
       float lum=dot(diffuseColor.rgb,vec3(.3,.55,.15));
       if(lum>.78&&leaf<.3)diffuseColor.rgb*=.78/lum;`);
    m.userData._windU=sh.uniforms.uWindT;
  };
  m.customProgramCacheKey=()=>"desPalmWind15";
  m.needsUpdate=true; if(isFrond)palmFrondMats.push(m)}
function gradeSaguaroMat(m){
  if(!m)return;
  /* both saguaros: same mint-olive green (kill brown albedo / dark maps) */
  if(m.map){m.userData._sagMap=m.map; /* keep map for ribs but tint hard */}
  if(m.color)m.color.set("#6a8a45");
  if(m.emissive){m.emissive.set("#000000");m.emissiveIntensity=0}
  m.metalness=0; m.roughness=Math.max(.78,m.roughness||.88); m.envMapIntensity=.12;
  m.onBeforeCompile=(sh)=>{
    if(!/vSagW/.test(sh.vertexShader)){
      sh.vertexShader="varying vec3 vSagW;\n"+sh.vertexShader;
      sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>',
        `#include <begin_vertex>\n vSagW=(modelMatrix*vec4(transformed,1.)).xyz;`);
      sh.fragmentShader="varying vec3 vSagW;\n"+sh.fragmentShader}
    sh.fragmentShader=sh.fragmentShader.replace('#include <map_fragment>',
      `#include <map_fragment>
       vec3 want=vec3(0.42,0.55,0.28);
       float lum=max(dot(diffuseColor.rgb,vec3(.3,.5,.2)),.04);
       vec3 detail=diffuseColor.rgb/lum;
       diffuseColor.rgb=want*mix(vec3(.85), detail, .35);
       float ang=atan(vSagW.x,vSagW.z);
       float rib=pow(abs(sin(ang*10.0)),1.35);
       diffuseColor.rgb=mix(diffuseColor.rgb*vec3(.72,.78,.64), diffuseColor.rgb, 1.-rib*.4);`);
  };
  m.customProgramCacheKey=()=>"desSagRib15b";
  m.needsUpdate=true}
function gradeTentMat(m){
  if(!m)return;
  /* light beige/cream canvas + warm stripes — lit, not fogged */
  if(m.map){m.userData._tentMap=m.map; m.map=null}
  if(m.color)m.color.set("#f0e2c4");
  if(m.emissive){m.emissive.set("#2a1c0c");m.emissiveIntensity=.06}
  m.metalness=0; m.roughness=.88; m.envMapIntensity=.14;
  m.onBeforeCompile=(sh)=>{
    sh.uniforms.uWindT={value:0};
    if(!/vTentW/.test(sh.vertexShader)){
      sh.vertexShader="uniform float uWindT; varying vec3 vTentW; varying vec3 vTentN;\n"+sh.vertexShader;
      sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>',
        `#include <begin_vertex>
         vec4 wpTent=modelMatrix*vec4(transformed,1.); vTentW=wpTent.xyz;
         vTentN=normalize(mat3(modelMatrix)*normal);
         float edge=smoothstep(.4,1.1,abs(position.x))+smoothstep(.2,.9,position.y);
         transformed.y+=sin(uWindT*2.2+wpTent.x*3.+wpTent.z*2.)*edge*.025;
         transformed.x+=cos(uWindT*1.7+wpTent.z*2.5)*edge*.015;`);
      sh.fragmentShader="varying vec3 vTentW; varying vec3 vTentN;\n"+sh.fragmentShader}
    sh.fragmentShader=sh.fragmentShader.replace('#include <map_fragment>',
      `#include <map_fragment>
       /* cream/beige Bedouin stripes — warm sunlit */
       float stripe=step(.55,fract(vTentW.y*3.2+vTentW.x*.1+vTentW.z*.07));
       vec3 cream=vec3(0.94,0.88,0.74);
       vec3 warm=vec3(0.78,0.62,0.42);
       diffuseColor.rgb=mix(cream,warm,stripe*.48);
       float sunF=smoothstep(-.15,.9, vTentN.x*.5+vTentN.y*.55);
       diffuseColor.rgb*=mix(.9,1.16,sunF);`);
    m.userData._windU=sh.uniforms.uWindT;
  };
  m.customProgramCacheKey=()=>"desTentCream24a";
  m.needsUpdate=true}
function addTipSpikes(parent, tipY){
  /* only near the tip — never horizontal beams that float under the tent in below views */
  const spikeM=M({color:"#8a6a48",map:sandTex||null,roughness:.95,metalness:0,fog:false});
  sandMats.push(spikeM);
  const spikes=[
    [0,tipY-.15,0,.7,1.5],[.85,tipY-.45,.4,.5,1.15],[-.8,tipY-.55,.35,.45,1.05],
    [.4,tipY-.9,-.7,.4,.95],[-.55,tipY-1.15,-.25,.35,.85],[.55,tipY-1.45,.2,.28,.7]
  ];
  spikes.forEach(([x,y,z,r,h])=>{
    if(y>-1.2)return; /* refuse anything near the sand deck */
    const s=new T.Mesh(new T.Cyl(r*.28,r,h,8,1),spikeM);
    s.position.set(x,y,z);s.rotation.z=rr(-.25,.25);s.rotation.x=rr(-.2,.2);
    s.castShadow=true;s.frustumCulled=false;parent.add(s);
    const tip=new T.Mesh(new T.Sphere(r*.4,7,6),spikeM);tip.position.set(x,y-h*.5,z);tip.scale.set(1,1.5,1);parent.add(tip)})}
function detectPropPeaks(){
  /* rise of full max over sand grid → palm / saguaros / tent */
  if(!_hf||!_hfFull)return null;
  const {grid,N,half,cell}=_hf, full=_hfFull.grid;
  const raw=[];
  for(let iz=2;iz<N-2;iz++)for(let ix=2;ix<N-2;ix++){
    const j=iz*N+ix; if(full[j]<-1e8||grid[j]<-1e8)continue;
    const rise=full[j]-grid[j];
    if(rise<1.05)continue;
    raw.push({x:-half+ix*cell+cell*.5,z:-half+iz*cell+cell*.5,rise,top:full[j],sand:grid[j]})}
  raw.sort((a,b)=>b.rise-a.rise);
  const merged=[];
  raw.forEach(p=>{
    const hit=merged.find(m=>Math.hypot(m.x-p.x,m.z-p.z)<1.45);
    if(!hit)merged.push({x:p.x,z:p.z,rise:p.rise,top:p.top,sand:p.sand,n:1});
    else{if(p.rise>hit.rise){hit.x=p.x;hit.z=p.z;hit.rise=p.rise;hit.top=p.top;hit.sand=p.sand}hit.n++}});
  if(!merged.length)return null;
  const palm=merged[0];
  /* ignore canopy lobes around the palm pair */
  const rest=merged.slice(1).filter(p=>Math.hypot(p.x-palm.x,p.z-palm.z)>2.15);
  let sagL=null,sagR=null,tentP=null;
  rest.forEach(p=>{
    if(p.x<palm.x-2.2&&p.rise>1.4&&(!sagL||p.rise>sagL.rise))sagL=p;
  });
  rest.forEach(p=>{
    if(p===sagL)return;
    if(p.x>palm.x+1.8&&p.rise>=1.05&&p.rise<=2.0&&p.z<palm.z-0.4&&(!tentP||p.n>(tentP.n||0)))tentP=p;
  });
  rest.forEach(p=>{
    if(p===sagL||p===tentP)return;
    if(p.x>palm.x+2.0&&p.rise>=1.05&&(!sagR||p.rise>sagR.rise))sagR=p;
  });
  if(!sagL)sagL={x:palm.x-4.8,z:palm.z-.6,rise:2.1};
  if(!sagR)sagR={x:palm.x+3.5,z:palm.z+1.1,rise:1.3};
  if(!tentP)tentP={x:palm.x+2.6,z:palm.z-2.0,rise:1.4};
  if(Math.hypot(sagR.x-tentP.x,sagR.z-tentP.z)<1.5){
    /* keep higher-x as sag, lower-z as tent */
    if(sagR.z<tentP.z){const t=sagR;sagR=tentP;tentP=t}
    if(Math.hypot(sagR.x-tentP.x,sagR.z-tentP.z)<1.5)sagR={x:tentP.x+1.6,z:tentP.z+2.0,rise:1.25}}
  return {palm,sagL,sagR,tent:tentP}}
function findLakeOnIsland(){
  /* JPEG often kills cyan — find sand bowl near tallest (palm) peak */
  if(!_hf)return null;
  const {grid,N,half,cell}=_hf;
  const peaks=detectPropPeaks();
  const px=peaks?peaks.palm.x:lakeC.x, pz=peaks?peaks.palm.z:lakeC.z;
  let best=null;
  for(let iz=3;iz<N-3;iz++)for(let ix=3;ix<N-3;ix++){
    const j=iz*N+ix; if(grid[j]<-1e8)continue;
    let ring=0,rc=0;
    for(let dz=-3;dz<=3;dz++)for(let dx=-3;dx<=3;dx++){
      const d=Math.hypot(dx,dz); if(d<1.2||d>3.5)continue;
      const v=grid[(iz+dz)*N+ix+dx]; if(v<-1e8)continue; ring+=v; rc++}
    if(rc<8)continue;
    const dip=(ring/rc)-grid[j]; if(dip<.045)continue;
    const x=-half+ix*cell+cell*.5, z=-half+iz*cell+cell*.5;
    const dPalm=Math.hypot(x-px,z-pz);
    /* pond sits beside palms, not under trunks */
    if(dPalm>3.6||dPalm<1.1)continue;
    const score=dip*3.4-dPalm*.12-(x>px?0.15:0);
    if(!best||score>best.score)best={x,z,y:grid[j],dip,score,r:1.55}}
  if(!best){
    let sx=0,sz=0,sy=0,n=0,minY=1e9;
    for(let a=0;a<16;a++){
      const th=a/16*TAU;
      for(const rad of[1.5,2.0,2.5,3.0]){
        const x=px+Math.cos(th)*rad,z=pz+Math.sin(th)*rad,y=hAt(x,z);
        if(y<minY+0.08){if(y<minY-0.04){sx=x;sz=z;sy=y;n=1;minY=y}else{sx+=x;sz+=z;sy+=y;n++;minY=Math.min(minY,y)}}}}
    if(n)best={x:sx/n,z:sz/n,y:sy/n,dip:.2,score:1,r:1.55}}
  if(!best)return null;
  let maxR=1.1;
  for(let iz=0;iz<N;iz++)for(let ix=0;ix<N;ix++){
    const j=iz*N+ix; if(grid[j]<-1e8)continue;
    if(grid[j]<=best.y+.08){
      const x=-half+ix*cell+cell*.5,z=-half+iz*cell+cell*.5;
      const d=Math.hypot(x-best.x,z-best.z); if(d<2.8)maxR=Math.max(maxR,d)}}
  /* allow larger bowl so disc can cover baked pond (~⅕ island width) */
  best.r=cl(maxR*.75,1.45,2.55);
  return best}
function sinkLakeBowl(mesh,cx,cz,rad,yFloor){
  /* smooth bowl INSIDE lake only — centre ≥1.2 m below water, falloff to shoreline (no deck cliffs) */
  if(!mesh)return;
  try{
  mesh.updateMatrixWorld(true);
  const deep=Math.min(yFloor, lakeY-1.2);
  mesh.traverse(o=>{
    if(!o.isMesh||!o.geometry||!o.geometry.attributes.position)return;
    const pos=o.geometry.attributes.position, e=o.matrixWorld.elements;
    const yScale=Math.hypot(e[1],e[5],e[9])||1;
    let dirty=0;
    for(let i=0;i<pos.count;i++){
      const lx=pos.getX(i),ly=pos.getY(i),lz=pos.getZ(i);
      const wx=e[0]*lx+e[4]*ly+e[8]*lz+e[12];
      const wy=e[1]*lx+e[5]*ly+e[9]*lz+e[13];
      const wz=e[2]*lx+e[6]*ly+e[10]*lz+e[14];
      const d=Math.hypot(wx-cx,wz-cz);
      if(d>=rad)continue; /* strictly inside lake polygon — never touch deck rim */
      /* k: 0 at shoreline, 1 at centre */
      const k=ss(rad, rad*.12, d);
      const want=mix(lakeY-0.05, deep, Math.pow(k,1.15));
      if(wy>want){
        const dy=(want-wy)*.99;
        pos.setY(i, ly+dy/yScale); dirty=1}}
    if(dirty){pos.needsUpdate=true; o.geometry.computeVertexNormals()}})}
  catch(e){console.warn("sinkLakeBowl",e)}}
function crushBakedSpikes(mesh, anchors, sandY){
  /* flatten agave + cream slab leftovers near palms/lake into sand (single Tripo mesh) */
  if(!mesh||!anchors||!anchors.length)return;
  try{
  mesh.updateMatrixWorld(true);
  mesh.traverse(o=>{
    if(!o.isMesh||!o.geometry||!o.geometry.attributes.position)return;
    const pos=o.geometry.attributes.position, e=o.matrixWorld.elements;
    const yScale=Math.hypot(e[1],e[5],e[9])||1;
    let dirty=0;
    for(let i=0;i<pos.count;i++){
      const lx=pos.getX(i),ly=pos.getY(i),lz=pos.getZ(i);
      const wx=e[0]*lx+e[4]*ly+e[8]*lz+e[12];
      const wy=e[1]*lx+e[5]*ly+e[9]*lz+e[13];
      const wz=e[2]*lx+e[6]*ly+e[10]*lz+e[14];
      let hitR=0;
      for(let a=0;a<anchors.length;a++){
        const A=anchors[a]; const d=Math.hypot(wx-A.x,wz-A.z);
        if(d<(A.r||1.6)*1.35){hitR=A.r||1.6;break}}
      const dLake=Math.hypot(wx-lakeC.x,wz-lakeC.z);
      /* lake interior sand islands — bury deep; rim cream slabs */
      if(dLake<lakeR*1.2)hitR=Math.max(hitR,lakeR);
      if(dLake<lakeR*2.1&&dLake>lakeR*.15&&wy>sandY+0.12&&wy<sandY+3.0)hitR=Math.max(hitR,2.2);
      /* upright cream shards anywhere near shore */
      if(dLake<lakeR*2.6&&wy>sandY+0.35&&wy<sandY+2.2)hitR=Math.max(hitR,1.6);
      if(!hitR)continue;
      if(wy>sandY+4.0)continue;
      const inLake=dLake<lakeR*1.12;
      if(inLake){
        /* bury ALL rocks/debris inside lake well below water — no floating junk */
        const want=lakeY-0.55;
        if(wy>want){pos.setY(i, ly+(want-wy)*.999/yScale); dirty=1}
        continue}
      if(wy<=sandY+0.2)continue;
      const want=sandY+rr(.02,.16);
      pos.setY(i, ly+(want-wy)*.995/yScale); dirty=1}
    if(dirty){pos.needsUpdate=true; o.geometry.computeVertexNormals()}})}
  catch(e){console.warn("crushBakedSpikes",e)}}
function paintTipOchre(mesh){
  /* crush + recolour Tripo pale tip cone into sandstone stump */
  if(!mesh)return;
  try{
  mesh.updateMatrixWorld(true);
  mesh.traverse(o=>{
    if(!o.isMesh||!o.geometry||!o.geometry.attributes.position)return;
    const pos=o.geometry.attributes.position, e=o.matrixWorld.elements;
    const yScale=Math.hypot(e[1],e[5],e[9])||1;
    const xScale=Math.hypot(e[0],e[4],e[8])||1;
    const zScale=Math.hypot(e[2],e[6],e[10])||1;
    let dirty=0;
    for(let i=0;i<pos.count;i++){
      const lx=pos.getX(i),ly=pos.getY(i),lz=pos.getZ(i);
      const wx=e[0]*lx+e[4]*ly+e[8]*lz+e[12];
      const wy=e[1]*lx+e[5]*ly+e[9]*lz+e[13];
      const wz=e[2]*lx+e[6]*ly+e[10]*lz+e[14];
      if(wy>-1.2)continue;
      /* pull tip inward + up so pale cone disappears into rock mass */
      const t=cl((-wy-1.2)/6.0,0,1);
      if(t<.08)continue;
      const pull=t*.82;
      const nx=wx*(1-pull*.55), nz=wz*(1-pull*.55);
      const ny=mix(wy, -1.6-t*2.2, pull);
      pos.setXYZ(i,
        lx+(nx-wx)/xScale,
        ly+(ny-wy)/yScale,
        lz+(nz-wz)/zScale);
      dirty=1}
    if(dirty){pos.needsUpdate=true; o.geometry.computeVertexNormals()}
    /* force dark ochre on materials for tip region */
    [].concat(o.material||[]).forEach(m=>{
      if(!m||m.userData._tipOchre)return;
      m.userData._tipOchre=1;
      if(m.color)m.color.set("#b88958");
      const prev=m.onBeforeCompile;
      m.onBeforeCompile=(sh)=>{
        if(typeof prev==="function")prev(sh);
        if(/tipHide19/.test(sh.fragmentShader))return;
        if(!/vIslW/.test(sh.fragmentShader)){
          if(!/varying vec3 vIslW/.test(sh.vertexShader)){
            sh.vertexShader="varying vec3 vIslN; varying vec3 vIslW;\n"+sh.vertexShader;
            sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>',
              `#include <begin_vertex>
               vIslN=normalize(mat3(modelMatrix)*normal);
               vIslW=(modelMatrix*vec4(transformed,1.)).xyz;`);
            sh.fragmentShader="varying vec3 vIslN; varying vec3 vIslW;\n"+sh.fragmentShader}}
        sh.fragmentShader=sh.fragmentShader.replace('#include <opaque_fragment>',
          `/* tipHide19 */
           {
             float tipK=smoothstep(-1.0,-5.5,vIslW.y);
             if(tipK>.01){
               vec3 tipO=vec3(0.62,0.42,0.24);
               outgoingLight=mix(outgoingLight, tipO, tipK*.98);
             }
           }
           #include <opaque_fragment>`);
      };
      const pk=m.customProgramCacheKey;
      m.customProgramCacheKey=()=>((typeof pk==="function"?pk():"")+"|tipHide19b");
      m.needsUpdate=true})})}
  catch(e){console.warn("paintTipOchre",e)}}
function paintOutRedCrate(mesh){
  /* Tripo red crate is baked into island albedo — mute red→sand in shader */
  if(!mesh)return;
  mesh.traverse(o=>{
    if(!o.isMesh||!o.material)return;
    [].concat(o.material).forEach(m=>{
      if(!m||m.userData._redMute)return;
      m.userData._redMute=1;
      const prev=m.onBeforeCompile;
      m.onBeforeCompile=(sh)=>{
        if(typeof prev==="function")prev(sh);
        if(/redCrateMute/.test(sh.fragmentShader))return;
        sh.fragmentShader=sh.fragmentShader.replace('#include <map_fragment>',
          `#include <map_fragment>
           /* redCrateMute */
           float redMuteK=smoothstep(.05,.2,diffuseColor.r-diffuseColor.g)*smoothstep(.05,.2,diffuseColor.r-diffuseColor.b);
           vec3 sandMute=vec3(0.82,0.66,0.42);
           diffuseColor.rgb=mix(diffuseColor.rgb, sandMute, redMuteK*.95);`);
      };
      const pk=m.customProgramCacheKey;
      m.customProgramCacheKey=()=>((typeof pk==="function"?pk():"")+"|redMute17");
      m.needsUpdate=true})})}
function syncIslandLakeU(){
  const roots=[islandRoot,island].filter(Boolean);
  roots.forEach(root0=>{
    root0.traverse(o=>{
      [].concat(o.material||[]).forEach(m=>{
        if(!m||!m.userData||!m.userData._lakeU)return;
        const u=m.userData._lakeU;
        if(u.uLakeC)u.uLakeC.value.set(lakeC.x,0,lakeC.z);
        if(u.uLakeR)u.uLakeR.value=lakeR})})})}
function rebuildLakeDisc(cx,cz,rad,y){
  rebuildLakePoly(cx,cz,rad,48);
  /* shoreline fan at water height — stop at shore (no overspill onto grass).
     Spit verts sit below waterY so depthTest:true still hides them. */
  const N=72, softR=rad*0.995;
  const pos=[cx,y,cz], uv=[.5,.5], idx=[];
  for(let i=0;i<N;i++){
    const th=i/N*TAU;
    const e=.985+.012*Math.sin(th*2.1)+.008*Math.sin(th*4.7+.5);
    const rr0=softR*e;
    const x=cx+Math.cos(th)*rr0, z=cz+Math.sin(th)*rr0;
    pos.push(x,y,z);
    uv.push(.5+.5*Math.cos(th)*e, .5+.5*Math.sin(th)*e)}
  for(let i=0;i<N;i++){idx.push(0,1+((i+1)%N),1+i)} /* CCW from +Y */
  lake.geometry.dispose();
  const g=new T.BG();g.setAttribute("position",new T.BA(new Float32Array(pos),3));
  g.setAttribute("uv",new T.BA(new Float32Array(uv),2));g.setIndex(idx);g.computeVertexNormals();
  lake.geometry=g; lake.position.set(0,0,0);
  lake.userData.ox=cx; lake.userData.oz=cz; lake.userData.waterY=y;
  lake.renderOrder=2;
  lake.material.depthTest=true; lake.material.depthWrite=false; lake.material.side=0;
  lake.material.polygonOffset=true; lake.material.polygonOffsetFactor=1; lake.material.polygonOffsetUnits=1;
  if(lakeBed){lakeBed.visible=false}
  syncIslandLakeU()}
function sandCapAt(x,z,rad){
  /* desert15: no cream discs — hide baked props via flatten only */
  return null}
function declutterIslandMeshes(mesh){
  /* hide baked brick cubes / yellow agave / red crates / stray prop chunks on Tripo island */
  if(!mesh)return;
  mesh.updateMatrixWorld(true);
  mesh.traverse(o=>{
    if(!o.isMesh||!o.geometry)return;
    const n=o.geometry.attributes.position.count;
    if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();
    const b=o.geometry.boundingBox;
    const sx=b.max.x-b.min.x,sy=b.max.y-b.min.y,sz=b.max.z-b.min.z;
    const vol=sx*sy*sz;
    /* world center — hide junk near tent / deck */
    const e=o.matrixWorld.elements;
    const cx=(b.min.x+b.max.x)*.5, cy=(b.min.y+b.max.y)*.5, cz=(b.min.z+b.max.z)*.5;
    const wx=e[0]*cx+e[4]*cy+e[8]*cz+e[12];
    const wy=e[1]*cx+e[5]*cy+e[9]*cz+e[13];
    const wz=e[2]*cx+e[6]*cy+e[10]*cz+e[14];
    const nearTent=Math.hypot(wx-tentAnchor.x,wz-tentAnchor.z)<3.2;
    /* small separate chunks (bricks / gear / crates) — not the main sand/rock shell */
    if(n<1800&&vol<5&&sy<1.6){o.visible=false;return}
    if(nearTent&&n<6000&&vol<8&&sy<1.8&&n>20){ /* tent-area leftovers incl. red crate */
      const mats0=[].concat(o.material||[]);
      let redish=0;
      mats0.forEach(m=>{if(!m||!m.color)return; if(m.color.r>m.color.g*1.15&&m.color.r>m.color.b*1.15)redish++});
      if(redish||(sy<.9&&vol<3)){o.visible=false;return}}
    const mats=[].concat(o.material||[]);
    let yellow=0,red=0;
    mats.forEach(m=>{
      if(!m||!m.color)return;
      const r=m.color.r,g=m.color.g,b0=m.color.b;
      if(g>r*.85&&g>b0*1.15&&r>b0*.7&&(r+g)*.5>.3)yellow++;
      if(r>g*1.2&&r>b0*1.2&&r>.3)red++});
    /* tall thin yellow-green agave-like props — hide entirely */
    if(yellow&&sy>0.25&&n<8000){o.visible=false;return}
    /* red box/crate under tent */
    if(red&&vol<6&&n<5000){o.visible=false;return}
    /* long thin beams / poles floating near deck */
    if(n<2500&&((sx>1.8&&sy<.35&&sz<.35)||(sz>1.8&&sy<.35&&sx<.35))){o.visible=false}
    /* cream / pale slab leftovers near palms & lake (baked Tripo) */
    const nearLake=Math.hypot(wx-lakeC.x,wz-lakeC.z)<lakeR*3.2;
    let cream=0;
    mats.forEach(m=>{
      if(!m||!m.color)return;
      const r=m.color.r,g=m.color.g,b0=m.color.b;
      const lum=(r+g+b0)/3;
      if(lum>.45&&Math.abs(r-g)<.12&&Math.abs(g-b0)<.14&&r>b0*.85)cream++});
    if(cream&&nearLake&&n<12000&&sy<3.2&&vol<22){o.visible=false;return}
    if(cream&&n<6000&&sy>0.1&&sy<2.6&&vol<12){o.visible=false;return}
    /* upright thin cream shards */
    if(nearLake&&n<5000&&sy>0.35&&sy<2.8&&Math.max(sx,sz)<1.2&&vol<4){o.visible=false}});
}
function flattenBakedProps(mesh, anchors){
  if(!anchors||!anchors.length)return;
  /* shader arrays sized 6 — keep strongest unique sites */
  const uniq=[];
  anchors.forEach(a=>{
    if(!a)return;
    if(uniq.some(u=>Math.hypot(u.x-a.x,u.z-a.z)<.55))return;
    uniq.push(a)});
  const use=uniq.slice(0,6);
  mesh.traverse(o=>{
    if(!o.isMesh||!o.geometry||!o.material)return;
    if(o.geometry.attributes.position.count<1000)return;
    const mats=[].concat(o.material);
    mats.forEach(m=>{
      if(!m||m.userData._flatProps)return;
      m.userData._flatProps=1;
      const prev=m.onBeforeCompile;
      m.onBeforeCompile=(sh)=>{
        if(typeof prev==="function")prev(sh);
        sh.uniforms.uFlatN={value:Math.min(6,use.length)};
        sh.uniforms.uFlatA={value:use.slice(0,6).map(a=>new V3(a.x,a.z,a.r))};
        if(!/uFlatN/.test(sh.vertexShader)){
          sh.vertexShader="uniform float uFlatN; uniform vec3 uFlatA[6]; varying vec3 vFlatWp;\n"+sh.vertexShader;
          sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>',
            `#include <begin_vertex>
             vec4 wpF=modelMatrix*vec4(transformed,1.);
             for(int i=0;i<6;i++){
               if(float(i)>=uFlatN)break;
               vec3 a=uFlatA[i];
               float d=length(wpF.xz-a.xy);
               /* crush baked trunks/crowns/lump tents/beams into the ground plane */
               float k=smoothstep(a.z,a.z*.18,d)*smoothstep(.04,1.8,wpF.y);
               transformed.y=mix(transformed.y, .015, k*.97);
             }
             vFlatWp=(modelMatrix*vec4(transformed,1.)).xyz;`);}
        /* also mute bright disc albedo near anchors (cream sand caps in bake) */
        if(!/flatDisc/.test(sh.fragmentShader)){
          if(!/varying vec3 vFlatWp/.test(sh.fragmentShader))
            sh.fragmentShader="uniform float uFlatN; uniform vec3 uFlatA[6]; varying vec3 vFlatWp;\n"+sh.fragmentShader;
          sh.fragmentShader=sh.fragmentShader.replace('#include <map_fragment>',
            `#include <map_fragment>
             /* flatDisc: kill cream/white circular patches under baked props */
             for(int i=0;i<6;i++){
               if(float(i)>=uFlatN)break;
               vec3 a=uFlatA[i];
               float d=length(vFlatWp.xz-a.xy);
               float k=smoothstep(a.z*1.05,a.z*.2,d);
               float bright=smoothstep(.55,.85,dot(diffuseColor.rgb,vec3(.3,.5,.2)));
               diffuseColor.rgb=mix(diffuseColor.rgb, vec3(0.78,0.62,0.40), k*bright*.9);
             }`);}
      };
      const prevKey=m.customProgramCacheKey;
      m.customProgramCacheKey=()=>((typeof prevKey==="function"?prevKey():"")+"|flat15");
      m.needsUpdate=true})})}
/* sculpt wind dunes into Tripo sand deck (upward faces only); refresh HF after */
function sculptIslandDunes(wrap){
  if(!wrap||!T.Matrix4)return;
  wrap.updateMatrixWorld(true);
  const inv=new T.Matrix4();
  wrap.traverse(o=>{
    if(!o.isMesh||!o.geometry||!o.geometry.attributes.position)return;
    const g=o.geometry; if(!g.attributes.normal)g.computeVertexNormals();
    const pos=g.attributes.position, nor=g.attributes.normal;
    if(pos.count<500)return;
    const e=o.matrixWorld.elements;
    inv.copy(o.matrixWorld).invert(); const ie=inv.elements;
    let n=0;
    for(let i=0;i<pos.count;i++){
      const lx=pos.getX(i),ly=pos.getY(i),lz=pos.getZ(i);
      const wx=e[0]*lx+e[4]*ly+e[8]*lz+e[12];
      const wy=e[1]*lx+e[5]*ly+e[9]*lz+e[13];
      const wz=e[2]*lx+e[6]*ly+e[10]*lz+e[14];
      const wny=e[1]*nor.getX(i)+e[5]*nor.getY(i)+e[9]*nor.getZ(i);
      if(wny<.52)continue;
      if(Math.hypot(wx,wz)>R*.94)continue;
      const dh=duneLift(wx,wz);
      if(dh<.025)continue;
      const ny=wy+dh;
      const nlx=ie[0]*wx+ie[4]*ny+ie[8]*wz+ie[12];
      const nly=ie[1]*wx+ie[5]*ny+ie[9]*wz+ie[13];
      const nlz=ie[2]*wx+ie[6]*ny+ie[10]*wz+ie[14];
      pos.setXYZ(i,nlx,nly,nlz); n++}
    if(n){pos.needsUpdate=true; g.computeVertexNormals(); g.computeBoundingBox(); g.computeBoundingSphere()}
  });
  wrap.updateMatrixWorld(true)}
/* push Tripo underside verts deeper + jagged so tip ≈ −CLIFF_H; procedural under fills gaps */
function deepenTripoUnderside(wrap){
  if(!wrap)return;
  wrap.updateMatrixWorld(true);
  const inv=new T.Matrix4();
  const tipY=-CLIFF_H;
  wrap.traverse(o=>{
    if(!o.isMesh||!o.geometry||!o.geometry.attributes.position)return;
    const g=o.geometry; if(!g.attributes.normal)g.computeVertexNormals();
    const pos=g.attributes.position, nor=g.attributes.normal;
    if(pos.count<500)return;
    const e=o.matrixWorld.elements;
    inv.copy(o.matrixWorld).invert(); const ie=inv.elements;
    let n=0;
    for(let i=0;i<pos.count;i++){
      const lx=pos.getX(i),ly=pos.getY(i),lz=pos.getZ(i);
      const wx=e[0]*lx+e[4]*ly+e[8]*lz+e[12];
      const wy=e[1]*lx+e[5]*ly+e[9]*lz+e[13];
      const wz=e[2]*lx+e[6]*ly+e[10]*lz+e[14];
      const wny=e[1]*nor.getX(i)+e[5]*nor.getY(i)+e[9]*nor.getZ(i);
      if(wny>.18&&wy>-0.4)continue; /* keep deck */
      const th=Math.atan2(wz,wx), rr0=Math.hypot(wx,wz);
      const deep=cl((-Math.min(wy,0))/Math.max(1,Math.abs(tipY)*.55),0,1);
      const jag=.55+.45*Math.pow(Math.max(0,Math.sin(th*3.1+1.2),Math.sin(th*5.2-.7),Math.sin(th*2.4+2)),1.1);
      const target=mix(wy, tipY*deep*jag - Math.sin(th*4.2)*deep*.6, ss(.05,.85,deep));
      if(target>=wy-.02)continue;
      const ny=target;
      const radScale=mix(1, .12+jag*.7, ss(.55,1,deep));
      const nwx=wx*radScale, nwz=wz*radScale;
      const nlx=ie[0]*nwx+ie[4]*ny+ie[8]*nwz+ie[12];
      const nly=ie[1]*nwx+ie[5]*ny+ie[9]*nwz+ie[13];
      const nlz=ie[2]*nwx+ie[6]*ny+ie[10]*nwz+ie[14];
      pos.setXYZ(i,nlx,nly,nlz); n++}
    if(n){pos.needsUpdate=true; g.computeVertexNormals(); g.computeBoundingBox(); g.computeBoundingSphere()}
  });
  wrap.updateMatrixWorld(true)}
function resolveIslandModel(){
  /* desert21: island_base.glb permanently — never load baked island.glb */
  return Promise.resolve({rel:MODEL.island_base, key:"island_base", clean:1})}
function findCleanBasin(){
  /* Interior basin only (skip rim cliffs). Find deepest sand cells within R*0.55. */
  if(!_hf)return null;
  const {grid,N,half,cell}=_hf;
  const interior=[];
  for(let iz=3;iz<N-3;iz++)for(let ix=3;ix<N-3;ix++){
    const j=iz*N+ix; if(grid[j]<-1e8)continue;
    const x=-half+ix*cell+cell*.5, z=-half+iz*cell+cell*.5;
    if(Math.hypot(x,z)>R*.55)continue;
    interior.push({x,z,y:grid[j],ix,iz})}
  if(interior.length<20)return null;
  interior.sort((a,b)=>a.y-b.y);
  const deep=interior.slice(0, Math.max(12, (interior.length*.12)|0));
  let sx=0,sz=0,sy=0; deep.forEach(s=>{sx+=s.x;sz+=s.z;sy+=s.y});
  sx/=deep.length; sz/=deep.length; sy/=deep.length;
  /* ring height around basin → waterline */
  let ring=0,rc=0, maxR=1.4;
  for(let iz=3;iz<N-3;iz++)for(let ix=3;ix<N-3;ix++){
    const j=iz*N+ix; if(grid[j]<-1e8)continue;
    const x=-half+ix*cell+cell*.5, z=-half+iz*cell+cell*.5;
    const d=Math.hypot(x-sx,z-sz);
    if(d>1.2&&d<4.5){ring+=grid[j];rc++; if(grid[j]>sy+.08)maxR=Math.max(maxR,d)}
    if(d<3.8&&grid[j]<=sy+.12)maxR=Math.max(maxR,d)}
  const ringY=rc?ring/rc:sy+.55;
  /* seat water just below ring lip so shoreline follows basin; keep above deepest floor */
  const waterY=mix(sy+.04, ringY-.02, .72);
  return {x:sx,z:sz,y:sy,waterY,r:cl(maxR*.88, 2.5, 4.2)}}
function installTripoIsland(){
  return resolveIslandModel().then(spec=>tryModel(spec.rel,()=>null).then(r=>{
    if(!r||!r.root||r.src!=="glb")return null;
    const wrap=r.root; islandRoot=wrap; onDes(wrap); root.add(wrap);
    wrap.userData.islandKey=spec.key; wrap.userData.cleanBase=1;
    tripo.islandKey=spec.key; tripo.cleanBase=1;
    /* hide procedural deck; KEEP jagged procedural underside (ref depth) — Tripo tip is shallow */
    if(island){island.visible=false; island.traverse(o=>{o.visible=false})}
    if(under){under.visible=true; under.traverse(o=>{o.visible=true})}
    alignIslandSand(wrap);
    wrap.traverse(o=>{
      if(o.isMesh){
        if(!islandMesh&&o.geometry&&o.geometry.attributes.position.count>1000)islandMesh=o;
        [].concat(o.material||[]).forEach(m=>{gradeIslandMat(m)});
        o.castShadow=o.receiveShadow=true; o.frustumCulled=false}});
    try{sculptIslandDunes(wrap)}catch(e){}
    try{deepenTripoUnderside(wrap)}catch(e){}
    buildHeightField(wrap);
    const basin=findCleanBasin()||findLakeOnIsland();
    if(basin){
      lakeC.x=basin.x; lakeC.z=basin.z;
      lakeR=cl(basin.r||3.2, 2.8, 5.2);
      lakeY=(basin.waterY!=null?basin.waterY:basin.y)+0.02;
    }else{
      lakeR=Math.max(lakeR, 3.2);
      lakeY=hAt(lakeC.x,lakeC.z)+0.06}
    /* water slightly above basin floor/spit so depthTest:true covers brown without overpainting grass */
    rebuildLakeDisc(lakeC.x,lakeC.z,lakeR,lakeY+0.035);
    /* deep smooth bowl under water (≥1.2 m at centre) — lake polygon only */
    try{sinkLakeBowl(wrap, lakeC.x, lakeC.z, lakeR*.98, lakeY-1.25)}catch(e){}
    if(_hf&&_hf.grid){
      const {grid,N,half,cell}=_hf;
      for(let iz=0;iz<N;iz++)for(let ix=0;ix<N;ix++){
        const x=-half+ix*cell+cell*.5, z=-half+iz*cell+cell*.5;
        const d=Math.hypot(x-lakeC.x,z-lakeC.z);
        if(d<lakeR*.98){
          const k=ss(lakeR*.98, lakeR*.12, d);
          grid[iz*N+ix]=Math.min(grid[iz*N+ix], mix(lakeY-0.05, lakeY-1.25, Math.pow(k,1.15)))}}
      _hfCacheClear()}
    /* snake deck HF after bowl so shore samples match the deformed mesh */
    buildSnakeHF(wrap);
    lake.visible=true; lake.renderOrder=2;
    lake.material.depthTest=true; lake.material.depthWrite=false;
    lake.material.polygonOffset=true; lake.material.polygonOffsetFactor=1; lake.material.polygonOffsetUnits=1;
    if(lakeBed){lakeBed.visible=false}
    /* normal depth — grass/props occlude water */
    reedG.renderOrder=4; rockG.renderOrder=4;
    camels.forEach(c=>{if(c&&c.o)bumpLifeOrder(c.o)});
    palms.forEach(bumpLifeOrder); cacti.forEach(bumpLifeOrder);
    if(tent)bumpLifeOrder(tent);
    if(fireG)fireG.renderOrder=5;
    try{reseatShoreGreen()}catch(e){}
    if(typeof placeRimRocks==="function")try{placeRimRocks()}catch(e){}
    tripo.island=wrap; tripo.ready=1; window.__desTripo=tripo;
    return wrap})).catch(e=>{console.warn("island",e);return null})}
function installTripoProps(){
  const peaks=detectPropPeaks()||{
    palm:{x:lakeC.x+.2,z:lakeC.z+1.1},
    sagL:{x:lakeC.x-3.0,z:lakeC.z+.8},
    sagR:{x:lakeC.x+5.2,z:lakeC.z+2.4},
    tent:{x:lakeC.x+2.8,z:lakeC.z-1.6}};
  /* palms on shore like ref — back edge of basin toward tent */
  const palmX=lakeC.x+lakeR*.22, palmZ=lakeC.z-lakeR*.72;
  const tentX=lakeC.x+lakeR*1.45+0.6, tentZ=lakeC.z-lakeR*.25;
  /* saguaros on dune ring, clear of lake/tent */
  const sagLX=lakeC.x-lakeR*1.35-0.6, sagLZ=lakeC.z+lakeR*.55;
  const sagRX=Math.min(R*.72, lakeC.x+lakeR*1.6+1.2), sagRZ=lakeC.z+lakeR*.85;
  /* flatten BOTH placement sites and baked peak sites so leftover crowns/discs die */
  /* tent/fire first — only 6 flatten slots; orange lump + beam live here */
  const flatA=[
    {x:tentX,z:tentZ,r:2.8},
    {x:tentX-0.95,z:tentZ+1.15,r:1.8},
    {x:peaks.tent.x,z:peaks.tent.z,r:2.5},
    {x:palmX,z:palmZ,r:2.3},
    {x:peaks.palm.x,z:peaks.palm.z,r:2.1},
    {x:sagLX,z:sagLZ,r:1.2},
    {x:sagRX,z:sagRZ,r:1.05},
    {x:peaks.sagL.x,z:peaks.sagL.z,r:1.1},
    {x:peaks.sagR.x,z:peaks.sagR.z,r:1.0}];
  if(islandRoot){
    const clean=!!(islandRoot.userData&&islandRoot.userData.cleanBase);
    if(!clean){
      declutterIslandMeshes(islandRoot);
      flattenBakedProps(islandRoot, flatA);
      crushBakedSpikes(islandRoot, flatA, _sandMed||0);
      crushBakedSpikes(islandRoot, [
        {x:palmX,z:palmZ,r:3.2},{x:peaks.palm.x,z:peaks.palm.z,r:2.8},
        {x:tentX,z:tentZ,r:3.0},{x:tentX-0.9,z:tentZ+1.1,r:2.2}
      ], _sandMed||0);
      declutterIslandMeshes(islandRoot);
      paintTipOchre(islandRoot);
      paintOutRedCrate(islandRoot);
      sinkLakeBowl(islandRoot, lakeC.x, lakeC.z, lakeR, lakeY);
      crushBakedSpikes(islandRoot, [{x:lakeC.x,z:lakeC.z,r:lakeR*1.15}], _sandMed||0)}
    /* clean island_base: nothing baked — no flatten/sink/crush */
    /* raise HF cells in lake so animals never fall into bowl */
    if(_hf&&_hf.grid){
      const {grid,N,half,cell}=_hf;
      for(let iz=0;iz<N;iz++)for(let ix=0;ix<N;ix++){
        const x=-half+ix*cell+cell*.5, z=-half+iz*cell+cell*.5;
        if(Math.hypot(x-lakeC.x,z-lakeC.z)<lakeR*1.15)grid[iz*N+ix]=Math.max(grid[iz*N+ix], lakeY+0.02)}
      _hfCacheClear()}
    else{_hfCacheClear(); buildHeightField(islandRoot); buildSnakeHF(islandRoot)}}
  /* hide ALL procedural palms/cacti/tent before hi-detail lands */
  palms.forEach(p=>{if(p){p.visible=false;p.traverse(o=>{o.visible=false})}});
  cacti.forEach(c=>{if(c){c.visible=false;c.traverse(o=>{o.visible=false})}});
  if(tent){tent.visible=false;tent.traverse(o=>{o.visible=false})}
  const jobs=[];
  /* palm.glb is already a V-pair in one mesh (~7m native → MODEL_FIT 4.4 on 18.8m island) */
  jobs.push(tryModel(MODEL.palm,()=>null).then(r=>{
    if(!r||!r.root||r.src!=="glb")return;
    const p=r.root; onDes(p);
    p.traverse(o=>{if(o.isMesh){
      const mats=[].concat(o.material); mats.forEach(gradePalmMat)}});
    p.position.set(palmX,hAt(palmX,palmZ),palmZ); p.rotation.y=-.25;
    root.add(p); tripo.palm=p; palms.length=0; palms.push(p);
  }));
  const sagSpots=[
    {x:sagLX,z:sagLZ,yaw:.35,perch:1},
    {x:sagRX,z:sagRZ,yaw:-.45,perch:0}];
  sagSpots.forEach((sp)=>{
    jobs.push(tryModel(MODEL.saguaro,()=>null).then(r=>{
      if(!r||!r.root||r.src!=="glb")return;
      const obj=r.root;
      onDes(obj); obj.traverse(o=>{if(o.isMesh){
        const mats=[].concat(o.material); mats.forEach(mm=>gradeSaguaroMat(mm))}});
      const x=sp.x,z=sp.z; obj.position.set(x,hAt(x,z),z); obj.rotation.y=sp.yaw;
      root.add(obj); tripo.sag.push(obj); cacti.push(obj);
      if(sp.perch){obj.userData.isPerch=1; const box=worldBox(obj); obj.userData.perch={x:0,y:(box.max[1]-obj.position.y)*.98,z:0}}
    }));
  });
  jobs.push(tryModel(MODEL.tent,()=>null).then(r=>{
    if(!r||!r.root||r.src!=="glb")return;
    const t=r.root; onDes(t);
    /* keep the main striped canvas; drop dirty orange lump / stray beams / red crate in the GLB */
    const tentMeshes=[];
    t.traverse(o=>{if(o.isMesh&&o.geometry){
      if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();
      const b=o.geometry.boundingBox;
      const sx=b.max.x-b.min.x,sy=b.max.y-b.min.y,sz=b.max.z-b.min.z,n=o.geometry.attributes.position.count;
      tentMeshes.push({o,n,sx,sy,sz,vol:sx*sy*sz})}});
    tentMeshes.sort((a,b)=>b.vol-a.vol);
    /* ONE tent only (ref) — keep the largest fabric shell; hide every secondary lump/pole/flap/crate */
    tentMeshes.forEach((tm,i)=>{
      if(i===0){const mats=[].concat(tm.o.material); mats.forEach(gradeTentMat); return}
      tm.o.visible=false});
    /* also hide any small boxy leftover still on the kept mesh hierarchy */
    t.traverse(o=>{
      if(!o.isMesh||!o.geometry||o===tentMeshes[0].o)return;
      o.visible=false});
    tentAnchor.x=tentX; tentAnchor.z=tentZ;
    t.position.set(tentAnchor.x,hAt(tentAnchor.x,tentAnchor.z),tentAnchor.z); t.rotation.y=-.55;
    root.add(t); tripo.tent=t;
    if(tent){tent.visible=false; tent.traverse(o=>{o.visible=false})}
    if(fireG){const fx=tentAnchor.x-0.95,fz=tentAnchor.z+1.15; fireG.position.set(fx,hAt(fx,fz),fz)}
    /* hide island-baked red crate / black fire balls / stick-figure pole clusters near tent */
    if(islandRoot){
      islandRoot.updateMatrixWorld(true);
      islandRoot.traverse(o=>{
        if(!o.isMesh||!o.geometry)return;
        if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();
        const b=o.geometry.boundingBox, e=o.matrixWorld.elements;
        const cx=(b.min.x+b.max.x)*.5,cy=(b.min.y+b.max.y)*.5,cz=(b.min.z+b.max.z)*.5;
        const wx=e[0]*cx+e[4]*cy+e[8]*cz+e[12];
        const wz=e[2]*cx+e[6]*cy+e[10]*cz+e[14];
        if(Math.hypot(wx-tentX,wz-tentZ)>3.4)return;
        const sx=b.max.x-b.min.x,sy=b.max.y-b.min.y,sz=b.max.z-b.min.z,n=o.geometry.attributes.position.count;
        if(n>8000)return; /* keep main shell */
        if(sy<1.5&&sx*sy*sz<6)o.visible=false;
        /* thin upright poles / T-frames that read as stick figures */
        if(n<4000&&sy>.6&&sy<2.4&&Math.max(sx,sz)<.55&&Math.min(sx,sz)<.35)o.visible=false});
    }
    /* also hide thin leftover poles still inside the tent GLB hierarchy */
    t.traverse(o=>{
      if(!o.isMesh||!o.geometry||!o.visible)return;
      if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();
      const b=o.geometry.boundingBox;
      const sx=b.max.x-b.min.x,sy=b.max.y-b.min.y,sz=b.max.z-b.min.z,n=o.geometry.attributes.position.count;
      if(n<3500&&sy>.5&&Math.max(sx,sz)<.45)o.visible=false});
    try{placeDryingRack(tentAnchor.x+1.35, tentAnchor.z+.55)}catch(e){}
  }));
  return Promise.all(jobs)}
/* simple tent awning / drying rack — two posts + crossbar + hanging cloth (ref), never humanoid */
function placeDryingRack(x,z){
  if(window.__desRack){root.remove(window.__desRack); window.__desRack=null}
  const g=new T.Group();
  const wood=M({color:"#5a4030",roughness:.92,metalness:0});
  const cloth=M({color:"#c4a882",roughness:.88,side:2,transparent:true,opacity:.88});
  const y0=hAt(x,z);
  const h=1.35, span=1.05;
  [[-span*.5,0],[span*.5,0]].forEach(([px,pz])=>{
    const p=new T.Mesh(new T.Cyl(.028,.022,h,6),wood);
    p.position.set(px,y0+h*.5,pz); p.castShadow=true; g.add(p)});
  const bar=new T.Mesh(new T.Cyl(.018,.018,span*1.05,5),wood);
  bar.rotation.z=Math.PI/2; bar.position.set(0,y0+h*.92,0); bar.castShadow=true; g.add(bar);
  /* hanging cloth rectangle */
  const clothM=new T.Mesh(new T.Plane(.55,.7),cloth);
  clothM.position.set(0,y0+h*.55,.04); clothM.castShadow=true; g.add(clothM);
  /* short rope loops */
  for(let i=0;i<3;i++){
    const rope=new T.Mesh(new T.Cyl(.006,.006,.18,4),wood);
    rope.position.set(-.22+i*.22,y0+h*.82,.02); g.add(rope)}
  g.position.set(x,0,z); g.rotation.y=-.4;
  root.add(g); onDes(g); window.__desRack=g; return g}
function rebuildShoreGreen(){
  /* natural tufts: ~half olive #6f8a35, +30% denser fringe on palm side */
  while(reedG.children.length)reedG.remove(reedG.children[0]);
  reedG.visible=true;
  const lc=document.createElement("canvas");lc.width=lc.height=64;const lctx=lc.getContext("2d");
  const lid=lctx.createImageData(64,64);
  for(let y=0;y<64;y++)for(let x=0;x<64;x++){
    const u=x/64,v=y/64;
    const mid=1.-Math.abs(u-.5)*2.6;
    const taper=ss(0,.12,mid)*ss(1,.02,v)*ss(0,.08,1.-Math.abs(u-.5)*2.);
    const a=Math.floor(cl(taper,0,1)*255);
    const o=(y*64+x)*4;
    /* near-white luminance map — colour comes from material (#6f8a35 / #4e6a26), not double-multiply brown */
    const lum=v>.55?245:220;
    lid.data[o]=lum;lid.data[o+1]=lum;lid.data[o+2]=lum;lid.data[o+3]=a}
  lctx.putImageData(lid,0,0);
  const bladeMap=new T.CTex(lc);bladeMap.colorSpace="srgb";
  /* ~half tufts olive #6f8a35 (scene-lit); slight emissive so sunset doesn't brown them out */
  /* depthWrite:true so tufts occlude water (water does not write depth) */
  const oliveM=M({map:bladeMap,color:"#6f8a35",emissive:"#2a3814",emissiveIntensity:.22,roughness:.8,side:2,transparent:true,alphaTest:.35,depthWrite:true,fog:false});
  const deepM=M({map:bladeMap,color:"#4e6a26",emissive:"#1c2a10",emissiveIntensity:.12,roughness:.86,side:2,transparent:true,alphaTest:.35,depthWrite:true,fog:false});
  const shrubM=M({color:"#6f8a35",emissive:"#243210",emissiveIntensity:.15,roughness:.88,side:2,fog:false});
  function addTuft(x,z,oliveBias){
    if(Math.hypot(x-lakeC.x,z-lakeC.z)<lakeR+.1)return null;
    if(Math.hypot(x,z)>R-0.45)return null;
    const y=Math.max(hAt(x,z),lakeY+.04)+.01;
    const g=new T.Group();g.position.set(x,y,z);
    const n=8+((rnd()*7)|0); /* 8–14 blades */
    const oliveTuft=rnd()<(oliveBias!=null?oliveBias:.55); /* ~half tufts olive-green */
    for(let k=0;k<n;k++){
      const h=rr(.16,.42), w=rr(.007,.016);
      const mat=oliveTuft?(rnd()<.9?oliveM:deepM):(rnd()<.4?oliveM:deepM);
      const blade=new T.Mesh(new T.Plane(w,h),mat);
      blade.position.set(rr(-.045,.045),h*.48,rr(-.045,.045));
      blade.rotation.y=rnd()*TAU;
      blade.rotation.z=rr(-.5,.5);
      blade.rotation.x=rr(.06,.48);
      g.add(blade)}
    g.userData.ph=rnd()*TAU;onDes(g);reedG.add(g); return g}
  /* palm anchors — De.palms may hold 1 wrap; also use known palm shore locus */
  const palmPts=[];
  (palms||[]).forEach(p=>{if(p&&p.position)palmPts.push({x:p.position.x,z:p.position.z})});
  if(!palmPts.length)palmPts.push({x:lakeC.x+lakeR*.22,z:lakeC.z-lakeR*.72});
  /* irregular clumps — denser (~+30%) near palms / palm-side shore */
  const arc0=-.55+rr(-.15,.15), arcSpan=TAU*.6;
  const nClump=MOB?20:34;
  const seeds=[];
  for(let i=0;i<nClump;i++){
    const a=arc0+rnd()*arcSpan;
    const r=lakeR+rr(.16,.5);
    const cx=lakeC.x+Math.cos(a)*r, cz=lakeC.z+Math.sin(a)*r*.97;
    let dens=1;
    palmPts.forEach(p=>{if(Math.hypot(p.x-cx,p.z-cz)<2.4)dens=5});
    if(cz<lakeC.z-.2)dens=Math.max(dens,3); /* palm-side (negative Z) fringe */
    const nIn=4+((rnd()*3)|0)+dens;
    for(let j=0;j<nIn;j++){
      const ang=rnd()*TAU, rad=rr(0,.3);
      seeds.push({x:cx+Math.cos(ang)*rad, z:cz+Math.sin(ang)*rad, olive:.75})}
  }
  /* extra palm-side fringe belt */
  palmPts.forEach(p=>{
    for(let i=0;i<(MOB?10:18);i++){
      const ang=rnd()*TAU, rad=rr(.25,1.1);
      seeds.push({x:p.x+Math.cos(ang)*rad, z:p.z+Math.sin(ang)*rad, olive:.85})}
  });
  /* fill to ~90–130 tufts (desert26 ~60–90 + ≥30%) */
  while(seeds.length<(MOB?90:125)){
    const a=arc0+rnd()*arcSpan, r=lakeR+rr(.16,.65);
    const x=lakeC.x+Math.cos(a)*r+rr(-.1,.1), z=lakeC.z+Math.sin(a)*r*.97+rr(-.1,.1);
    seeds.push({x,z, olive:z<lakeC.z?.8:.5})}
  seeds.forEach(s=>addTuft(s.x,s.z,s.olive));
  /* 3 small round desert shrubs near palms / shore */
  const shrubPts=[];
  if(palms&&palms.length){
    for(let i=0;i<Math.min(3,palms.length);i++){
      const p=palms[i].position;
      shrubPts.push({x:p.x+rr(.3,.7)*(i%2?1:-.6), z:p.z+rr(.2,.55)})}}
  while(shrubPts.length<3){
    const a=arc0+rnd()*arcSpan*.5;
    shrubPts.push({x:lakeC.x+Math.cos(a)*(lakeR+rr(.5,1.0)), z:lakeC.z+Math.sin(a)*(lakeR+rr(.5,1.0))})}
  shrubPts.slice(0,3).forEach(p=>{
    if(Math.hypot(p.x-lakeC.x,p.z-lakeC.z)<lakeR+.15)return;
    const y=Math.max(hAt(p.x,p.z),lakeY+.02);
    const bush=new T.Mesh(new T.Sphere(rr(.06,.09),7,6),shrubM);
    bush.scale.set(1.3,rr(.7,1.0),1.15); bush.position.set(p.x,y+.05,p.z);
    bush.castShadow=true; onDes(bush); reedG.add(bush);
    addTuft(p.x+rr(-.1,.1), p.z+rr(-.1,.1), .8)});
  shrubs.length=0;
  for(let i=0;i<8;i++){
    const a=rnd()*TAU,rad=lakeR*1.45+rnd()*2.0;const x=lakeC.x+Math.cos(a)*rad,z=lakeC.z+Math.sin(a)*rad*.95;
    if(Math.hypot(x,z)>R-1.2)continue;
    shrubs.push({x,z,y:hAt(x,z),o:null})}
}
function bumpLifeOrder(o){
  /* normal depth — water uses depthTest:true so grass/props/dunes occlude the lake */
  if(!o)return; o.renderOrder=4;
  o.traverse(ch=>{if(ch.isMesh){ch.renderOrder=4;
    [].concat(ch.material||[]).forEach(m=>{if(m){m.depthTest=true}})}})}
function reanchorLife(){
  eaglePerch=cacti.find(c=>c&&c.userData&&c.userData.isPerch&&c.visible!==false)||eaglePerch;
  rebuildShoreGreen();
  placeRimRocks();
  reedG.renderOrder=6; rockG.renderOrder=6;
  camels.forEach(c=>{
    if(!c)return;
    const p=camelPickWalk();
    c.x=p.x; c.z=p.z; c.tx=p.x; c.tz=p.z; c.mode="walk";
    if(c.o){c.o.position.set(c.x,sampleGroundY(c.x,c.z),c.z); bumpLifeOrder(c.o); plantFeet(c.o,c.x,c.z,c.facing)}});
  palms.forEach(bumpLifeOrder); cacti.forEach(bumpLifeOrder);
  if(tripo&&tripo.tent)bumpLifeOrder(tripo.tent);
  if(tripo&&tripo.palm)bumpLifeOrder(tripo.palm);
  (tripo&&tripo.sag||[]).forEach(bumpLifeOrder);
  snakes.forEach(s=>{
    if(!s)return; s.x=rr(-3,5); s.z=rr(-4,4); s.mode="slither"; s.t=0;
    if(s.o){s.o.position.set(s.x,sampleGroundY(s.x,s.z),s.z); s.o.rotation.y=s.th||0; bumpLifeOrder(s.o)}});
  _hfCacheClear()}


/* kick Tripo island install — procedural remains until GLB ready */
installTripoIsland().then(()=>{
  return installTripoProps()}).then(()=>{
  palms.forEach(p=>{if(p&&p!==tripo.palm)p.visible=false});
  cacti.forEach(c=>{if(c&&tripo.sag.indexOf(c)<0)c.visible=false});
  reanchorLife();
  window.__desTripo=tripo;
}).catch(e=>{console.warn("tripo island",e)});

window.__desShow=show;window.__desU=update;
window.__des={root,hAt,camels,eagle,snakes,cacti,palms,MODEL,lakeC,get lakeR(){return lakeR},R,De,Ce:X.Ce,tripo};
window.__desReady=true;
};
})();
