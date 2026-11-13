/* 沙漠绿洲 · Desert Oasis (desert13) — desert12 base; no bloom streaks, isotropic cliff, cumulus, lake, saguaro.
   Lazy-loaded on camera layer 3; yards + sea never see this content. */
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
  camel:"assets/models/camel_rigged.glb",
  eagle:"assets/models/eagle_rigged.glb",
  eagle_perch:"assets/models/eagle_perch.glb",
  snake:"assets/models/snake_rigged.glb",
  tent:"assets/models/tent.glb",palm:"assets/models/palm.glb",cactus:"assets/models/cactus.glb"};
/* Fit metres: camel under palms; eagle by height; snake by footprint */
const MODEL_FIT={camel:1.08,camel_rigged:1.08,eagle:.62,eagle_rigged:.62,eagle_perch:.48,snake:.55,snake_rigged:.55,tent:1.5,palm:2.9,cactus:1.2};
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
  const span=key.indexOf("snake")>=0?Math.max(sx,sz):key.indexOf("eagle")>=0&&key.indexOf("perch")<0?Math.max(sx,sy*.9):sy;
  let sc=target/Math.max(1e-3,span);if(!Number.isFinite(sc))sc=1;
  const wrap=new T.Group();
  scene.position.set(-(box.min[0]+box.max[0])*.5,-box.min[1],-(box.min[2]+box.max[2])*.5);
  wrap.add(scene);wrap.scale.setScalar(sc);wrap.userData.fitKey=key;wrap.userData.fitScale=sc;
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
const TEX={sky:"assets/tex/sky_cloudsea.jpg",sandstone:"assets/tex/sandstone.jpg",
  palmBark:"assets/tex/palm_bark.jpg",palmFrond:"assets/tex/palm_frond.png"};
let sandTex=null,skyTex=null,palmBarkTex=null,palmFrondTex=null;
const sandMats=[]; /* cliff + boulder mats waiting for sandstone.jpg */
const palmTrunkMats=[]; /* wait for palm_bark.jpg */
const palmFrondMats=[]; /* wait for palm_frond.png */

/* ---------------- irregular sandstone island + golden dunes ---------------- */
const lakeC={x:-1.6,z:.55},lakeR=2.85;
const tentAnchor={x:.2,z:-2.2};
/* Cliff depth ≈0.6× island width (2R≈18.8 → tip ~−11.3) */
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
function hAt(x,z){
  const th=Math.atan2(z,x),r=Math.hypot(x,z),Rth=rimR(th),edge=ss(Rth*.72,Rth,r);
  let h=.12+hNoise(x,z);
  /* sculpted dunes on the RIGHT half (ref) — taller crests */
  const right=ss(-1.2,3.2,x);
  const d1=Math.exp(-Math.pow((z-x*.15+1.2)/1.05,2))*Math.exp(-Math.pow((x-3.2)/2.5,2));
  const d2=Math.exp(-Math.pow((z+x*.2-2.0)/.8,2))*Math.exp(-Math.pow((x-4.5)/1.9,2));
  const d3=Math.exp(-Math.pow((z-x*.1+.4)/1.35,2))*Math.exp(-Math.pow((x-5.5)/3.0,2));
  const d4=Math.exp(-Math.pow((z+1.8)/1.2,2))*Math.exp(-Math.pow((x-2.4)/2.2,2));
  h+=(.85*d1+.65*d2+.5*d3+.4*d4)*right;
  /* low crescent dune away from tent pad (ref: tent on flat sand near lake) */
  const cx=4.2,cz=-3.2;
  const dx=x-cx,dz=z-cz;
  const along=dx*.85+dz*.3,across=-dx*.3+dz*.85;
  h+=.38*Math.exp(-across*across/(2*.55*.55))*Math.exp(-along*along/(2*2.2*2.2));
  /* flatten pad under tent */
  const dt=Math.hypot(x-tentAnchor.x,z-tentAnchor.z);
  h=mix(h,.01,ss(4.0,.25,dt)*.98);
  /* also suppress nearby right-side dunes that bury the tent in close-ups */
  const dDune=Math.exp(-Math.pow((z+1.2)/1.1,2))*Math.exp(-Math.pow((x-2.0)/2.0,2));
  h-=.35*dDune*ss(-.5,2.5,x);
  /* soft wind ripples (height) */
  h+=.05*Math.sin(x*2.8+z*.4)*Math.sin(z*3.1-x*.5)*right;
  /* oasis bowl + wet band */
  const dl=Math.hypot(x-lakeC.x,z-lakeC.z);
  h=mix(h,-.08,ss(lakeR*1.3,lakeR*.25,dl));
  h=mix(h,.015,ss(lakeR*.9,lakeR*1.1,dl)*ss(lakeR*1.45,lakeR*1.15,dl)*.4);
  h*=1-edge;return Math.max(-.1,h)}
function nAt(x,z){const e=.06;const hx=hAt(x+e,z)-hAt(x-e,z),hz=hAt(x,z+e)-hAt(x,z-e);return new V3(-hx,2*e,-hz).normalize()}

/* ---------------- golden sand (#e6c48a lit / #b98d58 shade) ---------------- */
function buildIsland(){
  const N=MOB?110:160,pos=[],nor=[],uv=[],idx=[],col=[];
  const litC=new C3("#e6c48a"),shC=new C3("#b98d58"),wetC=new C3("#7a5a38");
  for(let j=0;j<=N;j++)for(let i=0;i<=N;i++){
    const u=i/N,v=j/N,th=u*TAU,rr0=Math.pow(v,.88)*rimR(th);
    const x=Math.cos(th)*rr0,z=Math.sin(th)*rr0,y=hAt(x,z);
    pos.push(x,y,z);uv.push(x*.32+2,z*.32+2);
    const n=nAt(x,z);nor.push(n.x,n.y,n.z);
    /* sun-grazing from the right (low sun) */
    const lit=cl(n.x*.85+n.y*.25+n.z*.1+.22,0,1);
    const dl=Math.hypot(x-lakeC.x,z-lakeC.z),wet=ss(lakeR*1.4,lakeR*.92,dl);
    const c=litC.clone().lerp(shC,1-lit*.9).lerp(wetC,wet*.75);
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
  const baseCol=new C3("#e8d4c0"),shadeCol=new C3("#c4a888"),crevCol=new C3("#7a5a42");
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
      py-=spike2*CLIFF_H*.18*tip;
      py-=Math.max(0,Math.sin(th*5.5+1))*.22*CLIFF_H*tip;
      py-=Math.pow(Math.max(0,Math.sin(th*9.3-0.4)),2.2)*CLIFF_H*.1*tip}
    const y=py-(Math.abs(o1)*.7+Math.abs(o2)*.45)*deep*CLIFF_H*.09
      -Math.sin(th*3.2+py*.4)*.25*deep-crack*.28*deep-ledge*.15;
    pos.push(Math.cos(th)*rad,y,Math.sin(th)*rad);
    uv.push(u*3.0,deep*CLIFF_H/1.5);
    const lit=cl(.55+o1*.12-deep*.08-crack*.15,0,1);
    const c=baseCol.clone().lerp(shadeCol,1-lit).lerp(crevCol,crack*.22+ledge*.12);
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
  /* square cells so triplanar checker / blocks read ~1.5 m isotropic */
  const rockMap=canvasTex(256,(x,y)=>{
    const BS=32; /* 8×8 equal squares on 256 → with scale 1/1.5 ≈ 1.5 m */
    const bx=(x/BS)|0,by=(y/BS)|0;
    const h=((bx*73856093)^(by*19349663))>>>0;
    const cell=.42+((h%1000)/1000)*.58;
    const fx=(x%BS)/BS,fy=(y%BS)/BS;
    const edge=Math.min(fx,1-fx,fy,1-fy);
    const mortar=Math.pow(1-Math.min(1,edge*7),2.2);
    const grit=((x*13+y*7)%17)/17;
    const v=125+cell*58-mortar*48+grit*10;return [v*1.02,v*.76,v*.5]});
  rockMap.wrapS=rockMap.wrapT=1000;
  const rockU={map:{value:rockMap},sunDir:{value:new V3(.6,.35,.4)}};
  const rockM=new T.SM({lights:false,fog:false,uniforms:rockU,
    vertexShader:`attribute vec3 color;varying vec3 vW;varying vec3 vN;varying vec3 vC;
      void main(){vC=color;vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vN=normalize(mat3(modelMatrix)*normal);
      gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader:`uniform sampler2D map;uniform vec3 sunDir;varying vec3 vW;varying vec3 vN;varying vec3 vC;
      void main(){
        /* world triplanar — ~1.5 m blocks; slightly denser on horizontal axes so
           foreshortened cone sides still read roughly square in side views */
        vec3 wn=normalize(vN);
        float sY=1./1.5; float sX=1./1.05;
        vec3 blend=pow(abs(wn),vec3(5.)); blend/=(blend.x+blend.y+blend.z+1e-4);
        vec2 ux=vec2(vW.z*sX,vW.y*sY);
        vec2 uy=vec2(vW.x*sX,vW.z*sX);
        vec2 uz=vec2(vW.x*sX,vW.y*sY);
        vec3 cx=texture2D(map,ux+vec2(.13,.07)).rgb;
        vec3 cy=texture2D(map,uy+vec2(.05,.19)).rgb;
        vec3 cz=texture2D(map,uz+vec2(.21,.09)).rgb;
        vec3 tri=cx*blend.x+cy*blend.y+cz*blend.z;
        float fr=pow(abs(sin(vW.x*.42)*sin(vW.y*.42)*sin(vW.z*.42)),1.15);
        float ledge=smoothstep(-.35,.55,wn.y);
        vec3 col=tri*mix(vec3(1.),vC,.5);
        col=mix(col*vec3(.55,.42,.32),col,1.-fr*.35);
        col=mix(col*vec3(.7,.58,.48),col,ledge);
        float nd=max(.28,dot(wn,normalize(sunDir)));
        col*=.52+.58*nd;
        gl_FragColor=vec4(col,1.);
        #include <colorspace_fragment>
      }`});
  const cliff=new T.Mesh(geo,rockM);cliff.castShadow=true;cliff.receiveShadow=true;cliff.frustumCulled=false;gRoot.add(cliff);
  /* hanging rock spikes at the tip — chunky separate masses, readable from overview/side */
  const spikeM=M({color:"#7a5a40",roughness:.95,metalness:0,fog:false});
  sandMats.push(spikeM);
  const tipY=-CLIFF_H+.15;
  const spikes=[
    [0,tipY-.15,0,1.2,2.4],[1.55,tipY-.4,.65,.9,2.0],[-1.4,tipY-.55,.55,.82,1.85],
    [.7,tipY-.95,-1.15,.75,1.7],[-.95,tipY-1.2,-.45,.68,1.55],[1.15,tipY-1.55,.4,.58,1.35],
    [-.55,tipY-1.95,.95,.52,1.2],[.4,tipY-2.35,-.6,.45,1.05],[.9,tipY-2.75,.2,.36,.85],
    [-1.05,tipY-2.15,.2,.48,1.1],[.2,tipY-3.05,.5,.32,.72],[-.2,tipY-3.35,-.25,.28,.62]
  ];
  spikes.forEach(([x,y,z,r,h])=>{
    const s=new T.Mesh(new T.Cyl(r*.25,r,h,8,1),spikeM);
    s.position.set(x,y,z);s.rotation.z=rr(-.4,.4);s.rotation.x=rr(-.35,.35);
    s.castShadow=true;s.frustumCulled=false;gRoot.add(s);
    const tip=new T.Mesh(new T.Sphere(r*.5,7,6),spikeM);tip.position.set(x,y-h*.52,z);tip.scale.set(1,1.85,1);gRoot.add(tip)});
  gRoot.userData.rockU=rockU;window.__desCliffU=rockU;
  return gRoot}

/* ---------------- painted sky + soft layers + distinct cumulus sprites below tip ---------------- */
function buildCloudSea(){
  const g=new T.Group();
  const skyM=M({color:new C3("#ffffff"),emissive:new C3("#ffd0b0"),emissiveIntensity:1.05,roughness:1,metalness:0,fog:false,side:0,depthWrite:false});
  skyM.depthTest=false; skyM.toneMapped=true;
  const dome=new T.Mesh(new T.Sphere(80,64,48),skyM);
  dome.scale.set(-1,1,1);
  dome.rotation.set(-.22,Math.PI*.55,0);
  dome.renderOrder=-100;dome.frustumCulled=false;dome.userData.isSky=1;dome.layers.mask=1|L3;
  g.add(dome);g.userData.skyM=skyM;g.userData.dome=dome;
  /* soft radial-alpha cloud layers — MeshStandard+alphaMap, emissive only (no specular floor) */
  const radialAlpha=canvasTex(256,(x,y)=>{
    const u=x/255-.5,v=y/255-.5,r=Math.hypot(u,v)*2;
    const a=Math.floor(Math.pow(Math.max(0,1-r),1.85)*255);
    return [a,a,a]},{repeat:[1,1]});
  radialAlpha.colorSpace=""; /* data */
  const seaMats=[];
  function addCloudLayer(y,sz,op,col){
    const m=M({color:new C3(col),emissive:new C3(col),emissiveIntensity:.7,roughness:1,metalness:0,
      transparent:true,opacity:op,depthWrite:false,fog:false,side:2,alphaMap:radialAlpha});
    m.depthTest=true;m.toneMapped=true;
    const pl=new T.Mesh(new T.Plane(sz,sz),m);
    pl.rotation.x=-Math.PI/2;pl.position.y=y;
    pl.renderOrder=-90;pl.frustumCulled=false;pl.layers.mask=1|L3;
    pl.rotation.z=rr(-.15,.15);
    g.add(pl);seaMats.push({m,pl,baseOp:op});return m}
  /* no soft haze discs — they washed out cumulus and edged into white ray streaks */
  const sprites=new T.Group();g.add(sprites);g.userData.sprites=sprites;
  g.userData.cumulus=[]; /* filled once sky_cloudsea crops are ready */
  g.userData.seaMats=seaMats;
  return g}
function cropCumulusPuffs(img){
  /* distinct puffy shapes from sky_cloudsea.jpg → RGBA alpha sprites */
  const W=img.width|0,H=img.height|0; if(!W||!H)return [];
  const regions=[
    [.08,.35,.32,.68],[.30,.32,.55,.65],[.52,.30,.78,.62],[.70,.35,.95,.70],
    [.05,.55,.28,.88],[.28,.58,.52,.92],[.50,.60,.76,.95],[.72,.55,.98,.90],
    [.15,.22,.42,.52],[.40,.18,.68,.48],[.62,.20,.90,.50],[.22,.45,.48,.75]
  ];
  const out=[];
  for(let i=0;i<regions.length;i++){
    const [u0,v0,u1,v1]=regions[i];
    const x0=(u0*W)|0,y0=(v0*H)|0,x1=(u1*W)|0,y1=(v1*H)|0;
    const cw=Math.max(8,x1-x0),ch=Math.max(8,y1-y0);
    const c=document.createElement("canvas");c.width=256;c.height=192;
    const ctx=c.getContext("2d");
    ctx.drawImage(img,x0,y0,cw,ch,0,0,256,192);
    const id=ctx.getImageData(0,0,256,192),d=id.data;
    /* soft irregular blob alpha from luminance */
    for(let y=0;y<192;y++)for(let x=0;x<256;x++){
      const o=(y*256+x)*4;
      const lum=(d[o]*.3+d[o+1]*.55+d[o+2]*.15)/255;
      const nx=(x/255-.5)*2,ny=(y/191-.5)*2;
      const r=Math.hypot(nx*1.0,ny*1.1);
      const lobe=.7*Math.exp(-((nx+.2)*(nx+.2)+(ny+.12)*(ny+.12))*1.4)
        +.55*Math.exp(-((nx-.3)*(nx-.3)+(ny-.08)*(ny-.08))*1.8)
        +.5*Math.exp(-((nx+.05)*(nx+.05)+(ny-.3)*(ny-.3))*2.0);
      const vig=Math.pow(Math.max(0,1-Math.max(0,r-.02)),1.35);
      const a=cl((.35+lum*1.1)*lobe*1.5*vig,0,1);
      /* peach lift on upper rows */
      const lift=1.12-y/192*.18;
      d[o]=cl(d[o]*lift|0,0,255);d[o+1]=cl(d[o+1]*lift*.98|0,0,255);d[o+2]=cl(d[o+2]*lift*.92|0,0,255);
      d[o+3]=(a*255)|0}
    ctx.putImageData(id,0,0);
    const t=new T.CTex(c);t.colorSpace="srgb";t.wrapS=t.wrapT=1001;t.needsUpdate=true;
    t.userData.alphaMap=alphaMapFromTex(t,1);out.push(t)}
  return out}
function makeCumulusMat(tex,tint,op,emissive){
  /* unlit SM — Standard emissive stacked into white lines when planes grazed the view */
  const aMap=tex.userData.alphaMap||alphaMapFromTex(tex,1);
  const col=new C3(tint), em=new C3(emissive||"#e0b898");
  const m=new T.SM({transparent:true,depthWrite:false,fog:false,side:2,depthTest:true,
    uniforms:{map:{value:tex},alphaMap:{value:aMap},color:{value:col},em:{value:em},opacity:{value:op}},
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform sampler2D map,alphaMap;uniform vec3 color,em;uniform float opacity;varying vec2 vUv;
      void main(){
        vec3 texc=texture2D(map,vUv).rgb;
        float a=texture2D(alphaMap,vUv).g*opacity;
        if(a<.28)discard;
        vec3 c=texc*color+em*.16;
        float lum=dot(c,vec3(.3,.55,.15));
        if(lum>.68)c*=.68/lum;
        gl_FragColor=vec4(c,a);
        #include <colorspace_fragment>
      }`});
  m.userData.isCumulus=1;m.userData.baseOp=op;m.userData.col=col;m.userData.em=em;
  Object.defineProperty(m,"opacity",{get(){return m.uniforms.opacity.value},set(v){m.uniforms.opacity.value=v},configurable:true});
  Object.defineProperty(m,"emissive",{get(){return m.userData.em},set(v){if(v&&v.isColor)m.userData.em.copy(v);else if(v)m.userData.em.set(v)},configurable:true});
  Object.defineProperty(m,"color",{get(){return m.userData.col},set(v){if(v&&v.isColor)m.userData.col.copy(v);else if(v)m.userData.col.set(v)},configurable:true});
  m.emissiveIntensity=.2;m.baseOp=op;return m}
function placeCumulusSprites(puffTexs){
  const g=cloudSea; if(!g||!puffTexs||!puffTexs.length)return;
  const sprites=g.userData.sprites; const seaMats=g.userData.seaMats;
  while(sprites.children.length)sprites.remove(sprites.children[0]);
  g.userData.cumulus.length=0;
  /* separate peach-top / lavender-base puffs — fill overview lower third below/behind tip */
  const N=MOB?36:56;
  for(let i=0;i<N;i++){
    const th=rr(-1.4,2.9);
    const rad=rr(10,38);
    const y=-CLIFF_H-rr(0.4,8.5);
    const sz=rr(11,20), op=rr(.7,.9);
    const tex=puffTexs[i%puffTexs.length];
    const peach=i%3!==1;
    const tint=peach?"#ffd4a8":"#d8b8d8";
    const em=peach?"#ffe8c8":"#e8c8e0";
    const m=makeCumulusMat(tex,tint,op,em);
    m.emissiveIntensity=peach?.65:.45;
    const pl=new T.Mesh(new T.Plane(sz,sz*.72),m);
    const face=Math.atan2(-Math.sin(th),-Math.cos(th));
    pl.rotation.order="YXZ";
    pl.rotation.y=face+rr(-.45,.45);
    pl.rotation.x=-rr(.08,.45); /* more upright = readable puffs, not haze discs */
    pl.rotation.z=rr(-.18,.18);
    pl.position.set(Math.cos(th)*rad,y,Math.sin(th)*rad);
    pl.renderOrder=-82;pl.frustumCulled=false;pl.layers.mask=1|L3;
    pl.userData={ph:rnd()*TAU,rad,th0:th,y0:y,baseOp:op,face,drift:rr(.008,.018)};
    sprites.add(pl);seaMats.push({m,pl,baseOp:op,cumulus:1});g.userData.cumulus.push(pl)}
  /* denser pack under tip for overview lower-third fill */
  for(let i=0;i<22;i++){
    const th=rnd()*TAU, rad=rr(4,16);
    const y=-CLIFF_H-rr(0.6,6.5);
    const sz=rr(11,20), op=rr(.8,.98);
    const tex=puffTexs[i%puffTexs.length];
    const peach=i%2===0;
    const m=makeCumulusMat(tex,peach?"#e8c090":"#c8a0c0",op,peach?"#f0d0a8":"#d8b0d0");
    m.emissiveIntensity=peach?.7:.48;
    const pl=new T.Mesh(new T.Plane(sz,sz*.7),m);
    pl.rotation.order="YXZ";pl.rotation.y=rr(0,TAU);pl.rotation.x=-rr(.05,.4);
    pl.position.set(Math.cos(th)*rad,y,Math.sin(th)*rad);
    pl.renderOrder=-81;pl.frustumCulled=false;pl.layers.mask=1|L3;
    pl.userData={ph:rnd()*TAU,rad,th0:th,y0:y,baseOp:op,drift:rr(.007,.016)};
    sprites.add(pl);seaMats.push({m,pl,baseOp:op,cumulus:1});g.userData.cumulus.push(pl)}
}

const island=buildIsland(),under=buildUnderside(),cloudSea=buildCloudSea();
root.add(island);root.add(under);root.add(cloudSea);onDes(island);onDes(under);onDes(cloudSea);
loadTex(TEX.sky,{clamp:1}).then(tex=>{
  /* clamp sun core + kill near-white streak pixels baked into sky_cloudsea */
  try{
    const img=tex.image; if(img&&img.width){
      const c=document.createElement("canvas");c.width=img.width;c.height=img.height;
      const ctx=c.getContext("2d");ctx.drawImage(img,0,0);
      const id=ctx.getImageData(0,0,c.width,c.height),d=id.data;
      for(let i=0;i<d.length;i+=4){
        const lum=.3*d[i]+.55*d[i+1]+.15*d[i+2];
        if(lum>195){const k=195/lum;d[i]=d[i]*k|0;d[i+1]=d[i+1]*k|0;d[i+2]=d[i+2]*k|0}
        /* kill thin bright ray leftovers (high L, low chroma) */
        const mx=Math.max(d[i],d[i+1],d[i+2]),mn=Math.min(d[i],d[i+1],d[i+2]);
        if(mx>200&&(mx-mn)<18){d[i]=d[i]*180/mx|0;d[i+1]=d[i+1]*180/mx|0;d[i+2]=d[i+2]*180/mx|0}}
      ctx.putImageData(id,0,0);tex.image=c;tex.needsUpdate=true}
  }catch(e){}
  skyTex=tex;tex.colorSpace="srgb";tex.flipY=true;
  const m=cloudSea.userData.skyM;if(m){m.map=tex;m.emissiveMap=tex;m.emissive.set("#ffe0c8");m.emissiveIntensity=.62;m.color.set("#ffe8d8");m.needsUpdate=true}
  const img=tex.image; if(img&&img.width){
    /* distinct cumulus only — soft haze layers removed */
    placeCumulusSprites(cropCumulusPuffs(img))}
}).catch(()=>{});
loadTex(TEX.sandstone).then(tex=>{
  sandTex=tex;tex.wrapS=tex.wrapT=1000;tex.colorSpace="srgb";
  sandMats.forEach(m=>{m.map=tex; if(m.color)m.color.set("#e8d0b0"); m.needsUpdate=true});
  if(window.__desRockMats)window.__desRockMats.forEach(m=>{m.map=tex;m.color.set("#c8955e");m.needsUpdate=true});
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
const lakeY=-.04;
const lakeG=new T.BG();
{const N=64,pos=[],uv=[];for(let j=0;j<=N;j++)for(let i=0;i<=N;i++){
  const u=i/N,v=j/N,th=u*TAU;
  const e=.88+.08*Math.sin(th*2.3)+.05*Math.sin(th*5.1+.7); /* irregular oval */
  const rr0=v*lakeR*e*(1+.08*Math.sin(th*3.2));
  const x=lakeC.x+Math.cos(th)*rr0*1.15,z=lakeC.z+Math.sin(th)*rr0*.88;
  pos.push(x,lakeY,z);uv.push(u,v)}
 const idx=[];for(let j=0;j<N;j++)for(let i=0;i<N;i++){const a=j*(N+1)+i;idx.push(a,a+1,a+N+1,a+1,a+N+2,a+N+1)}
 lakeG.setAttribute("position",new T.BA(new Float32Array(pos),3));lakeG.setAttribute("uv",new T.BA(new Float32Array(uv),2));lakeG.setIndex(idx);lakeG.computeVertexNormals()}
/* saturated turquoise → teal (no pale cyan shore wash) */
const lakeU={uT:{value:0},uWind:{value:.12},uNight:{value:0},uSunDir:{value:new V3(.85,.18,.15)},uSunCol:{value:new C3(1,.72,.4)},uMoonC:{value:new C3(.55,.68,.95)},uSky:{value:new C3(.98,.62,.42)},uDeep:{value:new C3("#046068")},uShal:{value:new C3("#0e8878")}};
const lakeM=new T.SM({transparent:true,depthWrite:false,uniforms:lakeU,
 vertexShader:`varying vec3 vW;varying vec2 vUv;void main(){vUv=uv;vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
 fragmentShader:`uniform float uT,uWind,uNight;uniform vec3 uSunDir,uSunCol,uMoonC,uSky,uDeep,uShal;varying vec3 vW;varying vec2 vUv;
 void main(){
  float r=length(vUv-.5)*2.;if(r>1.02)discard;
  float edge=smoothstep(1.02,.88,r);
  vec2 p=vW.xz*.55;
  float rip=.004*(sin(p.x*3.5+uT*.12)+sin(p.y*3.-uT*.1))*(.15+.25*uWind)*edge;
  vec3 N=normalize(vec3(-rip*10.,1.,rip*8.));
  vec3 V=normalize(cameraPosition-vW);
  float fres=pow(max(1e-4,1.-max(0.,dot(N,V))),5.)*edge;
  float depth=smoothstep(.95,.1,r);
  /* whole lake saturated turquoise→teal — hard opaque edge (no pale cyan rim) */
  vec3 water=mix(uShal,uDeep,pow(depth,.48));
  vec3 Rdir=reflect(-V,N);
  vec3 skyR=mix(uSky*.22,uSunCol*.2,.15+.3*max(0.,Rdir.y));
  skyR=mix(skyR,water,.9);
  vec3 col=mix(water,skyR,.02+.08*fres);
  col+=uMoonC*uNight*(.05+.15*fres);
  float sunSpec=pow(max(1e-4,dot(reflect(-normalize(uSunDir),N),V)),180.)*(.04+.12*(1.-uNight));
  col+=uSunCol*sunSpec;
  float a=min(1.,(.98)*edge);
  gl_FragColor=vec4(col,a);
  #include <colorspace_fragment>
 }`});
const lake=new T.Mesh(lakeG,lakeM);lake.renderOrder=2;root.add(lake);onDes(lake);
const lakeBed=new T.Mesh(lakeG.clone(),M({color:"#045a5e",roughness:1}));lakeBed.position.y=-.1;lakeBed.scale.set(1.04,1,1.04);root.add(lakeBed);onDes(lakeBed);
/* darker damp sand ring at shoreline */
(function wetRing(){
  const N=96,pos=[],idx=[],col=[];
  for(let i=0;i<=N;i++){
    const th=i/N*TAU,e=.9+.07*Math.sin(th*2.4)+.04*Math.sin(th*5.2+.6);
    for(let k=0;k<3;k++){
      const rad=lakeR*(1.06+k*.22)*e;const x=lakeC.x+Math.cos(th)*rad*1.2,z=lakeC.z+Math.sin(th)*rad*.9;
      pos.push(x,hAt(x,z)+.007,z);
      /* darker damp toward water */
      const d=.22-k*.06;col.push(d*.85,d*.55,d*.35)}}
  for(let i=0;i<N;i++){const a=i*3;idx.push(a,a+1,a+3,a+1,a+4,a+3, a+1,a+2,a+4,a+2,a+5,a+4)}
  const g=new T.BG();g.setAttribute("position",new T.BA(new Float32Array(pos),3));g.setAttribute("color",new T.BA(new Float32Array(col),3));g.setIndex(idx);g.computeVertexNormals();
  const mesh=new T.Mesh(g,M({vertexColors:true,roughness:.78}));root.add(mesh);onDes(mesh)})();

/* desert grass — thin curved dry yellow-green clumps near oasis only */
const reedG=new T.Group();root.add(reedG);
(function makeShoreGreen(){
  const lc=document.createElement("canvas");lc.width=lc.height=64;const lctx=lc.getContext("2d");
  const lid=lctx.createImageData(64,64);
  for(let y=0;y<64;y++)for(let x=0;x<64;x++){
    const u=x/64,v=y/64,edge=Math.min(u,1-u)*2;
    const a=Math.floor(ss(0,.2,edge)*ss(1,.02,v)*(1-Math.abs(u-.5)*1.2)*255);
    const dry=v>.7;const o=(y*64+x)*4;
    lid.data[o]=dry?170:90;lid.data[o+1]=dry?150:130;lid.data[o+2]=dry?60:40;lid.data[o+3]=a}
  lctx.putImageData(lid,0,0);
  const bladeMap=new T.CTex(lc);bladeMap.colorSpace="srgb";
  const tuftM=M({map:bladeMap,color:"#c4b060",roughness:.92,side:2,transparent:true,alphaTest:.35,depthWrite:false});
  const reedM=M({color:"#6a7a38",roughness:.9,side:2});
  /* grass ONLY in a ring near water + a few clumps by tent — never whole island */
  for(let i=0;i<(MOB?28:48);i++){
    const a=rnd()*TAU,r=lakeR*(.98+rr(0,.28));
    const e=.9+.07*Math.sin(a*2);
    const x=lakeC.x+Math.cos(a)*r*e*1.2,z=lakeC.z+Math.sin(a)*r*e*.9;
    if(Math.hypot(x,z)>R-0.5)continue;
    const y=Math.max(hAt(x,z),lakeY);
    const g=new T.Group();g.position.set(x,y,z);
    const n=5+((rnd()*4)|0);
    for(let k=0;k<n;k++){
      const h=rr(.05,.14),w=rr(.008,.016);
      const blade=new T.Mesh(new T.Plane(w,h),tuftM);
      blade.position.set(rr(-.035,.035),h*.45,rr(-.035,.035));
      blade.rotation.y=rnd()*TAU;blade.rotation.z=rr(-.5,.5);blade.rotation.x=rr(.15,.5);
      g.add(blade)}
    if(rnd()<.2){const rh=rr(.22,.4);const reed=new T.Mesh(new T.Cyl(.0035,.0012,rh,4),reedM);reed.position.y=rh*.5;reed.rotation.z=rr(-.12,.12);g.add(reed)}
    g.userData.ph=rnd()*TAU;reedG.add(g)}
  /* few small clumps near tent entrance only */
  for(let i=0;i<6;i++){
    const x=tentAnchor.x+rr(.6,1.4),z=tentAnchor.z+rr(.4,1.1);
    const g=new T.Group();g.position.set(x,hAt(x,z),z);
    for(let k=0;k<4;k++){
      const h=rr(.05,.12),blade=new T.Mesh(new T.Plane(rr(.007,.014),h),tuftM);
      blade.position.set(rr(-.03,.03),h*.45,rr(-.03,.03));
      blade.rotation.y=rnd()*TAU;blade.rotation.z=rr(-.45,.45);blade.rotation.x=rr(.1,.45);g.add(blade)}
    reedG.add(g)}
})();

/* desert8: NO scatter rock eggs — they always read mint/white in stills */
const rockG=new T.Group();root.add(rockG);window.__desRockMats=[];
/* desert8: no shrub egg-spheres — graze targets use shore grass positions */
const shrubs=[];
(function makeShrubs(){
  for(let i=0;i<10;i++){
    const a=rnd()*TAU,rad=lakeR*1.15+rnd()*1.6;const x=lakeC.x+Math.cos(a)*rad,z=lakeC.z+Math.sin(a)*rad*.9;
    if(Math.hypot(x,z)>R-1)continue;
    shrubs.push({x,z,y:hAt(x,z),o:null})}
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
const eaglePerch=cacti.find(c=>c.userData.isPerch)||cacti[0];

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
/* keep procedural fabric tent — tent.glb was fence/board look */

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
/* small soft grounding only — large orange ovals looked like discs */
palms.forEach(p=>addBlob(p.position.x,p.position.z,.55,.42));
cacti.forEach(c=>addBlob(c.position.x,c.position.z,.32,.28));
addBlob(tentAnchor.x,tentAnchor.z,1.4,1.1);

/* campfire — stones + logs + flame sprites + grey smoke; NO orange sphere, NO rug */
const fireG=new T.Group();const firePos={x:tentAnchor.x-1.35,z:tentAnchor.z+.85};
fireG.position.set(firePos.x,hAt(firePos.x,firePos.z),firePos.z);root.add(fireG);onDes(fireG);
(function makeFire(){
  const stoneM=M({color:"#3a3028",roughness:.97}),logM=M({color:"#2a1810",roughness:.95});
  for(let i=0;i<8;i++){
    const s=new T.Mesh(new T.Sphere(rr(.04,.07),8,6),stoneM);
    const a=i/8*TAU;s.position.set(Math.cos(a)*.2,.03,Math.sin(a)*.2);s.scale.set(1.15,.65,1.05);fireG.add(s)}
  for(let i=0;i<3;i++){
    const log=new T.Mesh(new T.Cyl(.025,.032,.26,6),logM);
    log.rotation.z=Math.PI/2+.06;log.rotation.y=i*TAU/3+.2;log.position.y=.045;fireG.add(log)}
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
const SMN=MOB?64:100,smP=new Float32Array(SMN*3),smA=new Float32Array(SMN),smG=new T.BG();
smG.setAttribute("position",new T.BA(smP,3));smG.setAttribute("a",new T.BA(smA,1));
const smM=new T.SM({transparent:true,depthWrite:false,fog:false,uniforms:{col:{value:new C3(.58,.58,.6)},scale:{value:1.3}},
 vertexShader:`attribute float a;varying float vA;uniform float scale;void main(){vA=a;vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=max(3.,scale*(10.+a*20.)/max(.5,-mv.z));}`,
 fragmentShader:`uniform vec3 col;varying float vA;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(col,vA*smoothstep(.5,0.,d)*.5);}`});
{const smPts=new T.Points(smG,smM);smPts.frustumCulled=false;smPts.renderOrder=5;smPts.layers.mask=1|L3;root.add(smPts)}
const SMF=[];for(let i=0;i<SMN;i++)SMF.push({x:0,y:rr(0,2.5),z:0,v:rr(.18,.45),life:rnd()});

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
function plantFeet(cam,x,z,facing){
  const legs=cam.userData.legs;if(!legs||cam.userData.useGlb){cam.position.set(x,hAt(x,z),z);cam.rotation.y=facing;return}
  let sum=0;legs.forEach(lg=>{
    const wx=x+Math.cos(facing)*lg.L.position.z+Math.sin(facing)*lg.L.position.x;
    const wz=z+Math.sin(facing)*lg.L.position.z-Math.cos(facing)*lg.L.position.x;sum+=hAt(wx,wz)});
  const base=sum/legs.length;cam.position.set(x,base,z);cam.rotation.y=facing;
  legs.forEach(lg=>{
    const wx=x+Math.cos(facing)*lg.L.position.z+Math.sin(facing)*lg.L.position.x;
    const wz=z+Math.sin(facing)*lg.L.position.z-Math.cos(facing)*lg.L.position.x;
    lg.L.position.y=.92+(hAt(wx,wz)-base)*.3})}
const camels=[];
let _camelProto=null,_camelLoad=null,_camelAdopt=0;
const CAMEL_STRIDE=.72; /* metres travelled per walk-cycle at timeScale 1 — tune vs clip */
function setupCamelRig(st, wrap, anims){
  if(!_VT)return;
  const bones=mapBones(wrap);
  const head=bones["tripoHead_0"]||bones["tripo::Head_0"]||bonesMatching(bones,/Head/)[0];
  const spines=bonesMatching(bones,/Spine/).sort((a,b)=> (a.name>b.name?1:-1));
  const neck=spines.length?spines[spines.length-1]:null;
  const mixer=_VT.makeMixer(wrap.userData.scene||wrap);
  let walkClip=null;
  for(const a of (anims||wrap.userData.anims||[])){if(/walk|quadruped/i.test(a.name||""))walkClip=a}
  if(!walkClip&&anims&&anims[0])walkClip=anims[0];
  let walk=null;
  if(walkClip){walk=mixer.clipAction(walkClip);walk.setLoop(_VT.LoopRepeat,Infinity);walk.clampWhenFinished=false;walk.enabled=true;walk.setEffectiveWeight(1);walk.play()}
  st.rig={mixer,walk,bones,head,neck,spines,pose:"walk",fade:0};
  st.glb=wrap}
function ensureCamelProto(){
  if(_camelProto)return Promise.resolve(_camelProto);
  if(_camelLoad)return _camelLoad;
  _camelLoad=tryModel(MODEL.camel,()=>null).then(r=>{
    if(r.src==="glb"&&r.root){_camelProto=r.root;return _camelProto}
    return null});
  return _camelLoad}
function spawnCamel(x,z,facing){
  const c=makeCamelProcedural();plantFeet(c,x,z,facing);onDes(c);root.add(c);
  const st={o:c,x,z,facing,mode:"walk",t:rr(0,8),speed:.38,tx:x,tz:z,drink:0,graze:0,step:rnd()*TAU,rig:null};
  camels.push(st);
  ensureCamelProto().then(proto=>{
    if(!proto||st.rig)return;
    try{
      const wrap=(_camelAdopt++===0)?proto:cloneRig(proto);
      adoptGLB(c,wrap);setupCamelRig(st,wrap,wrap.userData.anims);
      c.position.y=hAt(st.x,st.z)+.004}catch(_){}});
  return st}
spawnCamel(-4.6,2.4,0.6);spawnCamel(-5.4,1.0,-2.1);
camels.forEach(c=>{
  const b=new T.Mesh(new T.Plane(.35,.22),blobM);b.rotation.x=-Math.PI/2;b.position.set(0,.01,0);b.renderOrder=1;
  c.o.add(b);onDes(b);c.blob=b});

function camelSetPose(st,pose,dt){
  const r=st.rig;if(!r)return;
  r.pose=pose;
  if(r.walk){
    const want=pose==="walk"?1:0;
    const w=r.walk.getEffectiveWeight();
    const nw=mix(w,want,ease(3.6,dt));
    r.walk.setEffectiveWeight(nw);
    if(pose==="walk"){if(!r.walk.isRunning())r.walk.play();r.walk.paused=false}
    else if(nw<.015){r.walk.paused=true}}
  if(pose!=="walk"){for(const k in r.bones){if(/Limb/.test(k))slerpRest(r.bones[k],ease(5.5,dt))}}
}
function camelBendNeck(rig,amt,chew,t,drink){
  if(!rig||amt<.001&&Math.abs(chew)<.001)return;
  const spines=rig.spines||[];
  const n=spines.length;
  const k=drink?1.55:1.15;
  for(let i=0;i<n;i++){
    const b=spines[i];if(!b)continue;const re=b.userData.restE||{x:0,y:0,z:0};
    const u=n>1?i/(n-1):1; /* more bend toward head */
    const pitch=amt*(.55+.9*u)*k;
    b.rotation.x=re.x+pitch;b.rotation.y=re.y+Math.sin(t*.55+i)*.04*amt;b.rotation.z=re.z}
  if(rig.head){const re=rig.head.userData.restE||{x:0,y:0,z:0};
    rig.head.rotation.x=re.x+amt*(drink?.85:.6)+chew;
    rig.head.rotation.y=re.y+Math.sin(t*.7)*.08;
    rig.head.rotation.z=re.z+Math.sin(t*3.2)*.03*chew}}
function camelUpdate(st,dt,t){
  st.t+=dt;const c=st.o,ud=c.userData,glb=!!ud.useGlb,rig=st.rig;
  if(st.mode==="walk"&&st.t>5.5){st.mode=rnd()<.45?"graze":rnd()<.5?"drink":"walk";st.t=0;st.graze=0;st.drink=0;
    if(st.mode==="graze"){const sh=shrubs[(Math.random()*shrubs.length)|0];if(sh){st.tx=sh.x;st.tz=sh.z}}
    else if(st.mode==="drink"){const a=rnd()*TAU;st.tx=lakeC.x+Math.cos(a)*lakeR*1.12;st.tz=lakeC.z+Math.sin(a)*lakeR*1.12}
    else{const a=rnd()*TAU,rad=rr(2.5,R*.6);st.tx=Math.cos(a)*rad;st.tz=Math.sin(a)*rad}}
  let moving=0,neckAmt=0,chew=0;
  if(st.mode==="walk"||st.mode==="graze"||st.mode==="drink"){
    const dx=st.tx-st.x,dz=st.tz-st.z,dist=Math.hypot(dx,dz);
    if(dist>.28){const want=Math.atan2(dx,dz);let dth=((want-st.facing+Math.PI*3)%TAU)-Math.PI;st.facing+=dth*ease(3,dt);
      const sp=st.speed*(st.mode==="walk"?1:.55);st.x+=Math.sin(st.facing)*sp*dt;st.z+=Math.cos(st.facing)*sp*dt;
      st.step+=dt*sp*5.2;moving=1;
      if(!glb&&ud.legs)ud.legs.forEach(lg=>{const pace=st.step+(lg.side>0?0:Math.PI);const swing=Math.sin(pace);lg.L.rotation.x=swing*.45;lg.lo.rotation.x=Math.max(0,-swing)*.35});
      if(!glb&&ud.neck)ud.neck.rotation.x=ss(0,1,Math.sin(t*.7)*.08)}
    else{
      if(!glb&&ud.legs)ud.legs.forEach(lg=>{lg.L.rotation.x*=1-ease(6,dt);lg.lo.rotation.x*=1-ease(6,dt)});
      if(st.mode==="graze"){st.graze+=dt;neckAmt=ss(0,1.1,Math.min(1.1,st.graze))*0.92;chew=Math.sin(t*3.4)*.1;
        if(!glb&&ud.neck){ud.neck.rotation.x=neckAmt;ud.head.rotation.x=chew}
        if(st.graze>4.5){st.mode="walk";st.t=0;st.graze=0}}
      else if(st.mode==="drink"){st.drink+=dt;neckAmt=ss(0,1.2,Math.min(1.2,st.drink))*1.15;chew=Math.sin(t*2.2)*.05;
        if(!glb&&ud.neck)ud.neck.rotation.x=neckAmt;if(st.drink>5){st.mode="walk";st.t=0;st.drink=0}}
      else{st.mode="walk";st.t=0}}}
  if(rig){
    camelSetPose(st,moving?"walk":"idle",dt);
    if(rig.walk){
      const groundSp=moving?st.speed*(st.mode==="walk"?1:.55):0;
      const ts=cl(groundSp/CAMEL_STRIDE,.0,1.4);
      rig.walk.timeScale=Number.isFinite(ts)?ts:1}
    if(rig.mixer)rig.mixer.update(dt);
    camelBendNeck(rig,neckAmt,chew,t,st.mode==="drink");
    if(!moving){for(const k in rig.bones)if(/Limb/.test(k))slerpRest(rig.bones[k],ease(6,dt))}}
  plantFeet(c,st.x,st.z,st.facing);
  const gy=hAt(st.x,st.z);
  if(glb)c.position.y=gy+.004;
  else if(st.mode==="drink"&&st.drink>0)c.position.y=gy-ss(0,1,Math.min(1,st.drink*.8))*.18}

/* ---------------- eagle — body, beak, fingered primaries, fanned tail ---------------- */
function makeEagleProcedural(){
  const g=new T.Group();
  const bodyM=M({color:"#6b4a32",roughness:.85}),wingM=M({color:"#4a3424",roughness:.88,side:2});
  const headM=M({color:"#cfc6b8",roughness:.8}),beakM=M({color:"#d4a03a",roughness:.7}),primM=M({color:"#2a1c14",roughness:.9,side:2});
  const body=new T.Mesh(new T.Sphere(.14,8,6),bodyM);body.scale.set(1,.65,1.6);body.castShadow=true;g.add(body);
  const head=new T.Mesh(new T.Sphere(.08,6,5),headM);head.position.set(0,.03,.2);g.add(head);
  const beak=new T.Mesh(new T.Cone(.028,.09,5),beakM);beak.rotation.x=Math.PI/2;beak.position.set(0,-.01,.3);g.add(beak);
  const wingL=new T.Group(),wingR=new T.Group();
  function buildWing(side){
    const W=side<0?wingL:wingR;W.position.set(0,.03,0);g.add(W);
    const wl=new T.Mesh(new T.Plane(.55,.2),wingM);wl.position.set(side*.3,0,0);W.add(wl);
    for(let i=0;i<7;i++){const p=new T.Mesh(new T.Plane(.04,.2),primM);
      p.position.set(side*(.55+i*.035),-.015,-.01-i*.012);p.rotation.z=side*(.12+i*.07);p.rotation.x=-.08;W.add(p)}
    return W}
  buildWing(-1);buildWing(1);
  for(let i=-2;i<=2;i++){const t=new T.Mesh(new T.Plane(.06,.22),wingM);t.position.set(i*.04,0,-.28);t.rotation.x=.35;t.rotation.z=i*.08;g.add(t)}
  g.userData={wingL,wingR,head,body};return g}
const eagle={o:makeEagleProcedural(),mode:"soar",t:0,th:rnd()*TAU,rad:5.0,alt:3.8,flap:0,cry:0,blend:0,landed:0,rig:null};
eagle.o.scale.setScalar(.95);root.add(eagle.o);onDes(eagle.o);
function eagleShowFly(on){
  const o=eagle.o;
  if(eagle.flyGlb)eagle.flyGlb.visible=!!on;
  if(eagle.perchGlb)eagle.perchGlb.visible=!on;
  if(!eagle.flyGlb&&!eagle.perchGlb)return;
  o.children.forEach(ch=>{if(ch===eagle.flyGlb||ch===eagle.perchGlb)return;ch.visible=!(eagle.flyGlb||eagle.perchGlb)})}
function setupEagleRig(wrap){
  const bones=mapBones(wrap);
  const L=bonesMatching(bones,/0_Left_Limb/).sort((a,b)=>a.name.localeCompare(b.name));
  const R=bonesMatching(bones,/0_Right_Limb/).sort((a,b)=>a.name.localeCompare(b.name));
  const tail=bonesMatching(bones,/Tail/);
  const legs=bonesMatching(bones,/1_Left_Limb|1_Right_Limb|Left_Limb|Right_Limb/).filter(b=>L.indexOf(b)<0&&R.indexOf(b)<0);
  eagle.rig={bones,L,R,tail,legs,head:bones["tripoHead_0"]||bones["tripoHead_1"]||bones["tripo::Head_0"]||bonesMatching(bones,/Head/)[0]};
}
tryModel(MODEL.eagle,()=>null).then(r=>{
  if(r.src==="glb"&&r.root){
    eagle.o.children.slice().forEach(ch=>{ch.visible=false});
    eagle.flyGlb=r.root;eagle.o.add(r.root);eagle.o.userData.useGlb=1;onDes(r.root);
    setupEagleRig(r.root);eagleShowFly(true)}});
tryModel(MODEL.eagle_perch,()=>null).then(r=>{
  if(r.src==="glb"&&r.root){
    eagle.perchGlb=r.root;r.root.visible=false;eagle.o.add(r.root);eagle.o.userData.useGlb=1;onDes(r.root);
    if(eagle.mode==="perch"||eagle.mode==="drink")eagleShowFly(false)}});

function eaglePerchWorld(){
  if(eaglePerch&&eaglePerch.userData&&eaglePerch.userData.perch){
    const p=eaglePerch.position,tip=eaglePerch.userData.perch,s=eaglePerch.scale.x||1;
    return {x:p.x+tip.x*s,y:p.y+tip.y*s+.01,z:p.z+tip.z*s}}
  return {x:-5,y:hAt(-5,2.2)+1.3,z:2.2}}
function eagleLakeSpot(){
  const x=lakeC.x+lakeR*1.08,z=lakeC.z+.2;return {x,y:Math.max(hAt(x,z),lakeY)+.02,z}}

/* Asymmetric flap: faster downstroke. phase in [0,1). */
function flapAngle(phase){
  const p=((phase%1)+1)%1;
  if(p<.42){const u=p/.42;return mix(.55,-.75,u*u)} /* down */
  const u=(p-.42)/.58;return mix(-.75,.55,Math.sqrt(u))} /* up */
function driveEagleWings(mode,t,bank,flare){
  const r=eagle.rig;if(!r)return;
  const L=r.L,R=r.R;
  const n=Math.max(L.length,R.length);
  for(let i=0;i<n;i++){
    const lb=L[i],rb=R[i];
    const along=n>1?i/(n-1):0;
    let ax=0,az=0,ay=0;
    if(mode==="flap"){
      const ph=t*1.35+along*.08;const a=flapAngle(ph);
      ax=a*(.55+.45*along);az=(.12+along*.25)*Math.sign(a||1)*.15;ay=0}
    else if(mode==="glide"){
      ax=-.12-along*.06;az=Math.sin(t*.8+along)*along*.04;ay=bank*.15}
    else if(mode==="flare"){
      ax=-.35-along*.25-flare*.2;az=.2+along*.35;ay=0}
    else if(mode==="fold"){
      ax=.55+along*.4;az=-.05;ay=along*.1}
    else{ax=-.08;az=0}
    if(lb){const re=lb.userData.restE||{x:0,y:0,z:0};lb.rotation.x=re.x+ax;lb.rotation.y=re.y+ay;lb.rotation.z=re.z+az}
    if(rb){const re=rb.userData.restE||{x:0,y:0,z:0};rb.rotation.x=re.x+ax;rb.rotation.y=re.y-ay;rb.rotation.z=re.z-az}}
  /* tail fan on flare */
  r.tail.forEach((b,i)=>{const re=b.userData.restE||{x:0,y:0,z:0};
    const fan=mode==="flare"?(.45+i*.08):mode==="fold"?-.08:Math.sin(t*.9+i)*.03;
    b.rotation.x=re.x+fan*.55;b.rotation.y=re.y+(i-1)*.06*fan});
  /* legs: tuck in flight, extend on flare/land, fold on perch */
  (r.legs||[]).forEach((b,i)=>{const re=b.userData.restE||{x:0,y:0,z:0};
    let lx=0;if(mode==="flare")lx=.55;else if(mode==="fold")lx=.15;else if(mode==="flap"||mode==="glide")lx=-.35;
    b.rotation.x=re.x+lx;b.rotation.z=re.z+(i%2?1:-1)*.04})}

function eagleUpdate(dt,t){
  const e=eagle,o=e.o,ud=o.userData,glb=!!ud.useGlb;e.t+=dt;
  if(e.mode==="soar"){
    eagleShowFly(true);
    e.th+=dt*.18;e.rad=4.8+.4*Math.sin(t*.15);e.alt=3.4+.55*Math.sin(t*.2);
    e.flap+=dt;const flapping=(e.flap%5.5)<.55;
    if(!glb&&ud.wingL){ud.wingL.rotation.z=flapping?Math.sin(e.flap*16)*.4:-.08;ud.wingR.rotation.z=flapping?-Math.sin(e.flap*16)*.4:.08}
    const x=Math.cos(e.th)*e.rad,z=Math.sin(e.th)*e.rad,y=e.alt;
    const px=o.position.x,pz=o.position.z;o.position.set(x,y,z);
    const yaw=Math.atan2(x-px,z-pz);o.rotation.y=Number.isFinite(yaw)?yaw:o.rotation.y;
    o.rotation.z=cl(Math.cos(e.th)*.22,-.4,.4);o.rotation.x=0;
    if(glb)driveEagleWings(flapping?"flap":"glide",e.flap,o.rotation.z,0);
    if(e.t>9){e.t=0;e.mode=rnd()<.65?"landPerch":"landDrink";e.blend=0}}
  else if(e.mode==="landPerch"||e.mode==="landDrink"){
    const spot=e.mode==="landPerch"?eaglePerchWorld():eagleLakeSpot();
    const tx=spot.x,ty=spot.y,tz=spot.z;
    const dist0=Math.hypot(tx-o.position.x,ty-o.position.y,tz-o.position.z);
    const flare=ss(1.6,.35,dist0);
    const aimY=ty+flare*.55;
    const k=ease(1.35,dt);o.position.x+=(tx-o.position.x)*k;o.position.y+=(aimY-o.position.y)*k;o.position.z+=(tz-o.position.z)*k;
    const dist=Math.hypot(tx-o.position.x,ty-o.position.y,tz-o.position.z);
    o.rotation.z*=1-ease(4,dt);o.rotation.x=-flare*.35;
    if(!glb&&ud.wingL){ud.wingL.rotation.z=-.35-ss(1.2,0,dist)*.4;ud.wingR.rotation.z=.35+ss(1.2,0,dist)*.4}
    if(glb)driveEagleWings("flare",t,o.rotation.z,flare);
    if(dist<.16){
      e.mode=e.mode==="landPerch"?"perch":"drink";e.t=0;e.landed=1;e.blend=1;
      o.position.set(tx,ty,tz);o.rotation.set(0,o.rotation.y,0);
      eagleShowFly(false);
      if(glb)driveEagleWings("fold",t,0,0);
      if(!glb&&ud.wingL){ud.wingL.rotation.set(.25,0,-.02);ud.wingR.rotation.set(.25,0,.02)}}}
  else if(e.mode==="perch"){
    const spot=eaglePerchWorld();o.position.set(spot.x,spot.y,spot.z);
    eagleShowFly(false);
    if(!glb&&ud.head)ud.head.rotation.y=Math.sin(t*.65)*.5;
    if(glb){driveEagleWings("fold",t,0,0);if(e.rig&&e.rig.head){const re=e.rig.head.userData.restE||{x:0,y:0,z:0};e.rig.head.rotation.y=re.y+Math.sin(t*.65)*.4}}
    if(e.t>7){e.mode="takeoff";e.t=0;eagleShowFly(true)}}
  else if(e.mode==="drink"){
    const spot=eagleLakeSpot();o.position.set(spot.x,spot.y,spot.z);
    eagleShowFly(false);
    if(!glb&&ud.head)ud.head.rotation.x=ss(0,1,Math.min(1,e.t*2))*.75;
    if(glb)driveEagleWings("fold",t,0,0);
    if(e.t>3.5){e.mode="takeoff";e.t=0;eagleShowFly(true)}}
  else if(e.mode==="takeoff"){
    eagleShowFly(true);
    if(!glb&&ud.wingL){ud.wingL.rotation.z=-Math.sin(e.t*14)*.6;ud.wingR.rotation.z=Math.sin(e.t*14)*.6;ud.wingL.rotation.x=0;ud.wingR.rotation.x=0}
    if(glb)driveEagleWings("flap",e.t*2.2,0,0);
    o.position.y+=dt*2.4;o.position.x+=Math.sin(o.rotation.y)*dt*1.4;o.position.z+=Math.cos(o.rotation.y)*dt*1.4;
    if(e.t>1.3){e.mode="soar";e.t=0;e.th=Math.atan2(o.position.x,o.position.z);e.cry=1;e.landed=0}}
}

/* ---------------- snake — slender patterned body (Tripo coil rejected until elongated re-export) ---------------- */
function makeSnakeProcedural(){
  const g=new T.Group();const segs=[];
  /* desert viper / sand boa — sandy base with irregular dark blotches */
  const skin=canvasTex(128,(x,y)=>{
    const nx=x/128,ny=y/128;
    const blotch=Math.sin(nx*18+ny*7)*Math.cos(nx*9-ny*14)+Math.sin(nx*31+ny*22)*.45;
    const spot=blotch>.35?1:blotch<-.25?.35:0;
    const base=170+Math.sin(nx*6+ny*3)*12;
    const v=mix(base,base*(spot>.5?.42:.7),spot>0?1:0);
    return [v,v*(spot>.5?.55:.72),v*(spot>.5?.28:.42)]});
  for(let i=0;i<44;i++){
    const t=i/43;
    /* slight tapered tail — head thicker, long soft taper */
    const r=t<.04?.04:t>.7?.028*(1-Math.pow((t-.7)/.3,1.35)*.82):.028;
    const m=M({map:skin,color:new C3("#c9a060"),roughness:.82});
    const s=new T.Mesh(new T.Sphere(r,8,6),m);
    if(i===0){
      s.scale.set(1.25,.72,2.2);
      const eyeM=M({color:"#120c08",roughness:.5});
      [[.02,.012,.055],[-.02,.012,.055]].forEach(([x,y,z])=>{const e=new T.Mesh(new T.Sphere(.007,4,3),eyeM);e.position.set(x,y,z);s.add(e)});
    }else{
      const taper=t>.75?mix(1.55,1.05,ss(.75,1,t)):1.55;
      s.scale.set(1,.72,taper)}
    s.castShadow=true;g.add(s);segs.push(s)}
  g.userData={segs,kind:"snake"};return g}
const snakes=[];
let _snakeProto=null,_snakeLoad=null,_snakeAdopt=0;
function setupSnakeRig(st,wrap,anims){
  if(!_VT)return;
  const bones=mapBones(wrap);
  /* Head→tail order: Spine, then bone_*, then Tail (loader strips '::' from tripo names) */
  const byNum=(a,b)=>{const na=a.name.match(/(\d+)/),nb=b.name.match(/(\d+)/);return ((na&&+na[1])||0)-((nb&&+nb[1])||0)};
  const spine=[
    ...bonesMatching(bones,/Spine/).sort(byNum),
    ...bonesMatching(bones,/^bone_/).sort(byNum),
    ...bonesMatching(bones,/Tail/).sort(byNum)
  ];
  spine.forEach(b=>{if(!b.userData.restE)b.userData.restE={x:b.rotation.x,y:b.rotation.y,z:b.rotation.z}});
  const mixer=_VT.makeMixer(wrap.userData.scene||wrap);
  let march=null,clip=null;
  for(const a of (anims||wrap.userData.anims||[])){if(/march|serpentine|slither|walk/i.test(a.name||""))clip=a}
  if(!clip&&anims&&anims[0])clip=anims[0];
  /* Tripo preset:serpentine:march kept for A/B — default procedural travelling wave (clip reads as rigid lateral wobble) */
  if(clip){march=mixer.clipAction(clip);march.setLoop(_VT.LoopRepeat,Infinity);march.enabled=true;march.setEffectiveWeight(0);march.play();st.snakeClipName=clip.name||""}
  st.rig={mixer,march,bones,spine,useClip:false,clipName:clip?clip.name:""};st.glb=wrap;st.snakeUseClip=false}
function ensureSnakeProto(){
  if(_snakeProto)return Promise.resolve(_snakeProto);
  if(_snakeLoad)return _snakeLoad;
  _snakeLoad=tryModel(MODEL.snake,()=>null).then(r=>{
    if(r.src==="glb"&&r.root){_snakeProto=r.root;return _snakeProto}return null});
  return _snakeLoad}
function spawnSnake(){
  /* place on open sand near oasis (camera-friendly) — avoid under camels */
  const spots=[{x:1.2,z:3.4,th:1.2},{x:3.8,z:.6,th:-.4},{x:-.5,z:3.8,th:2.1}];
  const sp=spots[snakes.length%spots.length]||{x:2,z:3,th:0};
  const s={o:makeSnakeProcedural(),x:sp.x,z:sp.z,th:sp.th,mode:"sidewind",t:0,pts:[],speed:.48,rig:null};
  root.add(s.o);onDes(s.o);snakes.push(s);
  ensureSnakeProto().then(proto=>{
    if(!proto||s.rig)return;
    try{const wrap=(_snakeAdopt++===0)?proto:cloneRig(proto);
      adoptGLB(s.o,wrap);setupSnakeRig(s,wrap,wrap.userData.anims)}catch(_){}})}
spawnSnake();if(!MOB)spawnSnake();

const TRN=180,trP=new Float32Array(TRN*3),trA=new Float32Array(TRN),trG=new T.BG();let trI=0;
trG.setAttribute("position",new T.BA(trP,3));trG.setAttribute("a",new T.BA(trA,1));
const trM=new T.SM({transparent:true,depthWrite:false,uniforms:{col:{value:new C3("#7a5a34")}},
 vertexShader:`attribute float a;varying float vA;void main(){vA=a;vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=max(2.2,9./max(.35,-mv.z));}`,
 fragmentShader:`uniform vec3 col;varying float vA;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(col*.7,vA*smoothstep(.5,0.,d)*.65);}`});
root.add(Object.assign(new T.Points(trG,trM),{frustumCulled:false,renderOrder:3}));

function snakeWave(st,t,speed){
  const r=st.rig;if(!r||!r.spine)return;
  const n=r.spine.length;if(!n)return;
  const freq=3.4+speed*.9;
  for(let i=0;i<n;i++){
    const b=r.spine[i];if(!b)continue;
    const re=b.userData.restE||{x:0,y:0,z:0};
    const u=n>1?i/(n-1):0;
    /* Travelling lateral wave; keep amplitude modest to avoid bind explode */
    const amp=.18*(1-u*.25);
    b.rotation.y=re.y+Math.sin(t*freq-u*3.6)*amp;
    b.rotation.x=re.x+Math.sin(t*freq*.35-u*1.6)*.03;
    b.rotation.z=re.z}
  if(st.glb&&st.glb.userData.scene)st.glb.userData.scene.updateMatrixWorld(true)}
function snakeUpdate(st,dt,t){
  st.t+=dt;const speed=.48;st.speed=speed;
  if(st.mode==="sidewind"){
    st.th+=Math.sin(t*1.1+st.t)*.32*dt;st.x+=Math.sin(st.th)*speed*dt;st.z+=Math.cos(st.th)*speed*dt;
    const r=Math.hypot(st.x,st.z);if(r>R*.78){st.th+=Math.PI*.55;st.x*=.93;st.z*=.93}
    if(Math.hypot(st.x-lakeC.x,st.z-lakeC.z)<lakeR*1.15)st.th+=1.2}
  const ud=st.o.userData,segs=ud.segs||[];
  if(ud.useGlb){
    const y=hAt(st.x,st.z)+.002;
    const n=nAt(st.x,st.z);
    st.o.position.set(st.x,y,st.z);
    const yaw=st.th;st.o.rotation.set(0,Number.isFinite(yaw)?yaw:0,0);
    const pitch=cl(-n.z*.4,-.28,.28),roll=cl(n.x*.4,-.28,.28);
    st.o.rotation.x=Number.isFinite(pitch)?pitch:0;st.o.rotation.z=Number.isFinite(roll)?roll:0;
    if(st.rig){
      if(st.rig.mixer&&st.rig.march&&st.snakeUseClip){
        st.rig.march.setEffectiveWeight(1);st.rig.march.timeScale=cl(speed/.45,.5,1.3);
        st.rig.mixer.update(dt)}
      else{if(st.rig.march)st.rig.march.setEffectiveWeight(0);
        if(st.rig.mixer)st.rig.mixer.update(dt);snakeWave(st,t,speed)}}
  }else{
    st.pts.unshift({x:st.x,z:st.z,th:st.th});if(st.pts.length>segs.length+2)st.pts.length=segs.length+2;
    for(let i=0;i<segs.length;i++){
      const p=st.pts[Math.min(i,st.pts.length-1)];if(!p)continue;
      const u=i/(segs.length-1||1);
      const side=Math.sin(t*5.2-u*4.5)*.11*(1-u*.35);
      const px=p.x+Math.cos(p.th)*side,pz=p.z-Math.sin(p.th)*side;
      const yy=hAt(px,pz)+.02;segs[i].position.set(px,Number.isFinite(yy)?yy:.02,pz);
      if(i>0){const q=segs[i-1].position;segs[i].lookAt(q.x,q.y,q.z);
        /* elongate along travel (sphere local Z after lookAt) */
        if(i>0){const sc=segs[i].scale;segs[i].scale.set(sc.x||1,.7,1.55)}}}
    st.o.position.set(0,0,0);st.o.rotation.set(0,0,0)}
  if((st.t*28|0)!==((st.t-dt)*28|0)){const i=trI%TRN;const yy=hAt(st.x,st.z)+.01;trP[i*3]=st.x;trP[i*3+1]=Number.isFinite(yy)?yy:.01;trP[i*3+2]=st.z;trA[i]=1;trI++}
  for(let i=0;i<TRN;i++)trA[i]=Math.max(0,trA[i]-dt*.06);
  trG.attributes.position.needsUpdate=trG.attributes.a.needsUpdate=true}

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
function update(dt){
  if(!root.visible)return;dt=Math.min(dt,.05)*st.ts;st.t+=dt;const t=st.t;
  const wn=Ue.uWind?Ue.uWind.value:(Ct.wind||.35);st.wn=wn;
  const night=qt.night||0;st.night=night;
  const rainy=/rain|storm|hail/.test(Ct.weather||"");
  const storm=cl(Math.max(rainy?.85:0,(Ct.weather==="storm"||wn>.78)?(wn-.5)*2:0),0,1);st.storm=storm;

  lakeU.uT.value=t;lakeU.uWind.value=wn*.4;lakeU.uNight.value=night;
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

  const fp=fireG.position;for(let i=0;i<SMN;i++){const k=SMF[i];k.life+=dt*.18;if(k.life>1){k.life=0;k.x=fp.x+rr(-.04,.04);k.z=fp.z+rr(-.04,.04);k.y=fp.y+.15;k.v=rr(.35,.75)}
    k.y+=k.v*dt;k.x+=wn*1.6*dt;k.z+=wn*.4*dt; /* thin grey smoke bends with wind */
    smP[i*3]=k.x;smP[i*3+1]=k.y;smP[i*3+2]=k.z;smA[i]=(1-k.life)*(.3+night*.4)*(1-ss(3.0,5.0,k.y-fp.y))}
  smG.attributes.position.needsUpdate=smG.attributes.a.needsUpdate=true;
  (fireG.userData.flames||[]).forEach((fl,i)=>{
    const bob=.85+.15*Math.sin(t*14+i*1.7)+.08*Math.sin(t*23+i);
    fl.scale.set(bob,bob*1.1,1);
    if(fl.material.uniforms&&fl.material.uniforms.op)fl.material.uniforms.op.value=.4+.4*bob;
    fl.position.y=.1+i*.035+.02*Math.sin(t*11+i);
    if(De)fl.quaternion.copy(De.quaternion)});
  const fl=fireG.userData.light,tl=fireG.userData.tentL;
  if(tl)tl.intensity+=(night*1.0+.02-tl.intensity)*ease(3,dt);
  /* gentle cloud puff drift + billboard to camera — edge-on planes were the white ray streaks */
  if(cloudSea&&cloudSea.userData.sprites&&De){
    cloudSea.userData.sprites.children.forEach(pl=>{
      const u=pl.userData;if(!u)return;
      const drift=u.drift||.01;
      const th=u.th0+t*drift+Math.sin(t*.08+u.ph)*.015;
      pl.position.x=Math.cos(th)*u.rad;pl.position.z=Math.sin(th)*u.rad;
      pl.position.y=u.y0+Math.sin(t*.1+u.ph)*.22;
      /* world-space Y-billboard — local quat.copy(De) ignored parent xforms → edge streaks */
      pl.lookAt(De.position.x,pl.position.y,De.position.z);
      pl.rotateX(-.08+Math.sin(t*.09+u.ph)*.03)})}

  sandUpdate(dt,t,wn,storm);
  /* desert lighting variants — painted sky tinted dramatically per mode */
  const isDay=Ct.mode==="day"||(Ct.mode==="manual"&&!Ct.night&&Ct.season===1&&Ct.weather==="sun"&&!storm);
  const wantNight=(Ct.night||Ct.mode==="full"||Ct.mode==="crescent"||Ct.mode==="half")?Math.max(night,.92):night;
  if(pi&&root.visible){
    /* sunset: low orange sun on right; day: high white; night: cool moon; storm: dim dusty */
    const el=wantNight>.5?28:storm>.3?18:isDay?58:11;
    const az=wantNight>.5?-40:isDay?40:82;
    const rad=el*Math.PI/180,azr=az*Math.PI/180;
    const dist=wantNight>.5?28:26;
    const want=new V3(Math.cos(rad)*Math.sin(azr),Math.sin(rad),Math.cos(rad)*Math.cos(azr)).multiplyScalar(dist);
    pi.position.lerp(want,ease(2.5,dt));
    if(pi.target){pi.target.position.set(0,-1,0);pi.target.updateMatrixWorld()}
    const sunCol=wantNight>.5?new C3("#c8d8ff"):storm>.3?new C3("#c4a070"):isDay?new C3("#fff5e0"):new C3("#ff9a40");
    pi.color.lerp(sunCol,ease(3,dt));
    const sunI=wantNight>.5?.12:storm>.3?1.0:isDay?2.6:2.4;
    pi.intensity+=(sunI-pi.intensity)*ease(3,dt);
    pi.castShadow=true;pi.shadow.autoUpdate=true;
    if(dc){
      dc.color.lerp(wantNight>.5?new C3("#0a1428"):storm>.3?new C3("#a88868"):isDay?new C3("#b0c8e8"):new C3("#d0a8c0"),ease(3,dt));
      if(dc.groundColor)dc.groundColor.lerp(wantNight>.5?new C3("#0a1018"):storm>.3?new C3("#6a5038"):new C3("#8a6a48"),ease(3,dt));
      dc.intensity+=((wantNight>.5?.08:storm>.3?.4:isDay?.85:.5)-dc.intensity)*ease(3,dt)}
    /* yard sky dome hidden; kill glow/sunVis so no ray streaks leak through */
    if(jt){
      if(jt.uGlowA)jt.uGlowA.value=0;if(jt.uSunVis)jt.uSunVis.value=0;
      if(wantNight>.5){jt.top&&jt.top.value.set("#030814");jt.bot&&jt.bot.value.set("#0a1428");
        if(jt.uNight)jt.uNight.value=1;if(jt.uMoonVis)jt.uMoonVis.value=.95;
        if(jt.uStarF)jt.uStarF.value=1.6}
      else if(storm>.3){jt.top&&jt.top.value.set("#6a5040");jt.bot&&jt.bot.value.set("#a88868");
        if(jt.uCover)jt.uCover.value=.95;if(jt.uDark)jt.uDark.value=.75}
      else if(isDay){jt.top&&jt.top.value.set("#5a9ada");jt.bot&&jt.bot.value.set("#c8e4f8");
        if(jt.uNight)jt.uNight.value=0;if(jt.uCover)jt.uCover.value=.1}
      else{jt.top&&jt.top.value.set("#c890b0");jt.bot&&jt.bot.value.set("#f0a868");
        if(jt.uNight)jt.uNight.value=0}}
    /* tint painted sky_cloudsea backdrop — must read dramatically different per mode */
    /* night: near-black sky (desert6 luminance); day/sunset keep painted tones */
    const wantSky=wantNight>.5?new C3("#030810"):storm>.3?new C3("#a88860"):isDay?new C3("#c8d8f0"):new C3("#ffffff");
    const skyM=cloudSea&&cloudSea.userData.skyM;
    if(skyM){
      if(wantNight>.5){
        /* solid dark night — painted emissiveMap was the pink haze regression */
        if(skyM.emissiveMap){skyM.userData._emap=skyM.emissiveMap;skyM.emissiveMap=null;skyM.map=null;skyM.needsUpdate=true}
        skyM.emissive.set("#02060f");skyM.color.set("#02060f");
        skyM.emissiveIntensity+=(.04-skyM.emissiveIntensity)*ease(2.5,dt)}
      else{
        if(skyM.userData._emap&&!skyM.emissiveMap){skyM.emissiveMap=skyM.userData._emap;skyM.map=skyM.userData._emap;skyM.needsUpdate=true}
        skyM.emissive.lerp(wantSky,ease(2.5,dt));skyM.color.lerp(wantSky,ease(2.5,dt));
        skyM.emissiveIntensity+=((storm>.3?.65:isDay?.95:1.05)-skyM.emissiveIntensity)*ease(2.5,dt)}}
    ((cloudSea&&cloudSea.userData.seaMats)||[]).forEach((s)=>{
      if(!s.cumulus){s.m.opacity=0;if(s.pl)s.pl.visible=false;return}
      if(wantNight>.5){s.m.opacity=0;if(s.m.emissiveIntensity!=null)s.m.emissiveIntensity=0;if(s.m.emissive)s.m.emissive.set("#000000");if(s.pl)s.pl.visible=false}
      else{
        const op2=storm>.3?s.baseOp*.5:s.baseOp;
        s.m.opacity+=(op2-s.m.opacity)*ease(2.5,dt);
        if(s.m.emissive)s.m.emissive.lerp(new C3("#ffe8c8"),ease(2.5,dt));
        if(s.m.color)s.m.color.lerp(new C3("#ffd4a8"),ease(2.5,dt));
        if(s.m.emissiveIntensity!=null)s.m.emissiveIntensity+=((storm>.3?.55:1.0)-s.m.emissiveIntensity)*ease(2.5,dt);
        if(s.pl)s.pl.visible=true}});
    if(wantNight>.5){
      if(Jt.fog){Jt.fog.color.set("#01040a");Jt.fog.near=R*3;Jt.fog.far=R*10}
      if(Cn){Cn.toneMappingExposure=.22; if(Cn.setClearColor)Cn.setClearColor(0x01040a,1)}
      if(X.sr)X.sr.visible=true}
    else{
      if(X.sr)X.sr.visible=isDay?false:true;
      if(Cn&&Cn.toneMappingExposure!=null){
        const exp=storm>.3?.65:isDay?1.05:1;
        Cn.toneMappingExposure+=(exp-Cn.toneMappingExposure)*ease(2,dt)}}
  }
  if(Jt.fog&&root.visible){
    /* fog starts beyond island radius×3 — never swallow cliff/props */
    const fogStart=R*3;
    const fogC=wantNight>.5?new C3("#050a18"):storm>.3?new C3("#b89068"):isDay?new C3("#d0e4f4"):new C3("#f0d2b0");
    const fNear=wantNight>.5?fogStart:storm>.3?fogStart:isDay?Math.max(fogStart,70):Math.max(fogStart,55);
    const fFar=wantNight>.5?fogStart*3.5:storm>.3?fogStart*2.8:isDay?380:280;
    Jt.fog.color.lerp(fogC,ease(2,dt));
    Jt.fog.near+=(fNear-Jt.fog.near)*ease(2,dt);
    Jt.fog.far+=(fFar-Jt.fog.far)*ease(2,dt)}
  if(window.__desCliffU&&pi)window.__desCliffU.sunDir.value.copy(pi.position).normalize();
  /* campfire pool at night */
  if(fireG&&fireG.userData.light){
    const fl=fireG.userData.light;
    fl.intensity=wantNight>.4?2.8+Math.sin(t*9)*.35:.08}

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

  if(Jt.fog){
    /* never pull fog inside the island — desert9 white-wash regression */
    if(storm>.2){Jt.fog.near=Math.max(Jt.fog.near,R*3);Jt.fog.far=Math.max(Jt.fog.far,R*8);Jt.fog.color.lerp(new C3("#d4b07a"),storm*.12)}
    if(night>.5)Jt.fog.color.lerp(new C3("#0a1528"),.04)}
}

function show(on){
  root.visible=on;De.layers.set(on?3:0);window.__desA=on;
  /* painted sky replaces yard dome while desert is active */
  if(X.vd){X.vd.visible=!on;X.vd.traverse(c=>{c.visible=!on})}
  if(Jt){if(on){Jt.background=null;if(Jt.fog){Jt.fog.near=90;Jt.fog.far=500}}
    else if(X.vd)X.vd.visible=true}
  /* bloom OFF in desert — SwiftShader + alpha fronds / sky sun made white crown glow + diagonal ray ghosts */
  if(window.__bloom){
    if(on){
      if(window.__bloom._desSave==null)window.__bloom._desSave={t:window.__bloom.threshold,s:window.__bloom.strength,en:window.__bloom.enabled};
      window.__bloom.threshold=.995;window.__bloom.strength=0;window.__bloom.enabled=false}
    else if(window.__bloom._desSave){
      window.__bloom.threshold=window.__bloom._desSave.t;window.__bloom.strength=window.__bloom._desSave.s;
      window.__bloom.enabled=window.__bloom._desSave.en!==false;window.__bloom._desSave=null}}
  if(on){
    /* low warm sunset by default — matches reference */
    if(Ct.mode==="manual"||Ct.mode==="sunset"||!Ct.mode){Ct.mode="sunset";Ct.night=false}
    if(Jt.fog){Jt.fog.near=Math.max(R*3,80);Jt.fog.far=400;Jt.fog.color.set("#f0d2b0")}
    if(pi){
      pi.position.set(22,4.2,5);pi.intensity=2.35;pi.color.set("#ff9a40");
      pi.castShadow=true;pi.shadow.autoUpdate=true;
      Object.assign(pi.shadow.camera,{left:-28,right:28,top:28,bottom:-28,near:.5,far:110});
      pi.shadow.mapSize.set(2048,2048);pi.shadow.bias=-.0005;pi.shadow.normalBias=.035;pi.shadow.radius=2.5;
      pi.shadow.camera.updateProjectionMatrix();
      if(pi.target){pi.target.position.set(0,-.5,0);pi.target.updateMatrixWorld()}}
    if(dc){dc.color.set("#d0a8c0");dc.groundColor&&dc.groundColor.set("#6a5040");dc.intensity=.48}
    if(jt){jt.top&&jt.top.value.set("#c890b0");jt.bot&&jt.bot.value.set("#f0a868");
      /* yard sky glow OFF — was a source of white diagonal ray ghosts */
      if(jt.uSunVis)jt.uSunVis.value=0;if(jt.uGlowA)jt.uGlowA.value=0;if(jt.uNight)jt.uNight.value=0;
      if(jt.uSunDisk)jt.uSunDisk.value.set(1,.75,.4)}
    if(cloudSea&&cloudSea.userData.skyM){cloudSea.userData.skyM.emissive.set("#ffe0c8");cloudSea.userData.skyM.color.set("#ffe8d8");cloudSea.userData.skyM.emissiveIntensity=.65}
    ((cloudSea&&cloudSea.userData.seaMats)||[]).forEach(s=>{
      if(!s.cumulus){s.m.opacity=0;if(s.pl)s.pl.visible=false;return}
      if(s.m.emissive)s.m.emissive.set("#ffe8c8");
      if(s.m.color)s.m.color.set("#ffd8b0");
      s.m.opacity=s.baseOp; if(s.m.emissiveIntensity!=null)s.m.emissiveIntensity=1.0;
      if(s.pl)s.pl.visible=true});
    if(Cn){Cn.shadowMap.enabled=true;Cn.toneMappingExposure=.92}
    root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}})
  }
  const x=SX();if(x&&x.C)x.C();
  if(!on&&AU.master&&AU.ctx)AU.master.gain.setTargetAtTime(0,AU.ctx.currentTime,.25);
}

/* Sky dome, lights, stars on L3. Skip precip meshes (Dc/qc) — desert mutes rain/hail/snow. */
for(const o of[X.vd,pi,dc,X.sr,...(X.Ca||[]).map(c=>c.m)])o&&o.traverse(c=>c.layers.enable(3));
onDes(root);

/* QA hooks for motion review */
window.__desQA=()=>({camels,eagle,snakes,CAMEL_STRIDE,De,Ce,
  get perch(){return eaglePerchWorld()},
  lookAt:(px,py,pz,tx,ty,tz)=>{De.position.set(px,py,pz);Ce.target.set(tx,ty,tz);Ce.update()},
  forceCamel:(i,mode)=>{const c=camels[i|0];if(!c)return;c.mode=mode||"walk";c.t=0;c.graze=0;c.drink=0;
    if(mode==="graze"){c.tx=c.x;c.tz=c.z}else if(mode==="drink"){c.tx=lakeC.x+lakeR*1.12;c.tz=lakeC.z;c.x=c.tx;c.z=c.tz}
    else{const a=Math.random()*TAU,rad=3.2;c.tx=Math.cos(a)*rad;c.tz=Math.sin(a)*rad}},
  forceEagle:(mode)=>{eagle.mode=mode||"soar";eagle.t=0;eagle.blend=0;
    if(mode==="perch"){const s=eaglePerchWorld();eagle.o.position.set(s.x,s.y,s.z);eagleShowFly(false)}
    else if(mode==="landPerch"){eagleShowFly(true)}
    else eagleShowFly(true)},
  snakeClip:(on)=>{snakes.forEach(s=>{s.snakeUseClip=!!on;if(s.rig)s.rig.useClip=!!on})},
  status:()=>({camel:camels.map(c=>({mode:c.mode,useGlb:!!c.o.userData.useGlb,rig:!!c.rig,walkW:c.rig&&c.rig.walk?c.rig.walk.getEffectiveWeight():0,x:c.x,z:c.z})),
    eagle:{mode:eagle.mode,useGlb:!!eagle.o.userData.useGlb,rig:!!eagle.rig,fly:!!eagle.flyGlb,perch:!!eagle.perchGlb,pos:[eagle.o.position.x,eagle.o.position.y,eagle.o.position.z]},
    snake:snakes.map(s=>({useGlb:!!s.o.userData.useGlb,rig:!!s.rig,clip:s.snakeUseClip,clipName:s.rig&&s.rig.clipName,x:s.x,z:s.z})),
    perch:eaglePerchWorld()})});
window.__desShow=show;window.__desU=update;
window.__des={root,hAt,camels,eagle,snakes,cacti,palms,MODEL,lakeC,R,De,Ce:X.Ce};
window.__desReady=true;
};
})();
