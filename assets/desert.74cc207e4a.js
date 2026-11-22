/* 沙漠浮岛 · Floating desert island (desert44 rebuild) — lazy-loaded on camera layer 3.
   Everything is authored in metres inside W (1 unit = 1 m) and displayed at S world units per
   metre, so a ~49 m island fits the shared orbit camera, its clamps and the sun's shadow frustum
   the same way the sea disc does. Shares renderer, composer, lights and the night sky. */
(()=>{
window.__desInit=getX=>{try{init(getX)}catch(e){window.__desErr=String(e&&e.stack||e)}};
function init(getX){
const X=getX(),T=X.T,{Jt,De,Ce,Cn,Ta,Ue,Ct,qt,jt,pi,dc}=X,MOB=!!X.kn;
const V3=T.V3,C3=T.Color,TAU=Math.PI*2,L3=8,PALM_LAYER=6;
const S=.3,YAW=-.21,D2R=Math.PI/180;
let sd=20261114;const rnd=()=>{sd|=0;sd=sd+0x6D2B79F5|0;let t=Math.imul(sd^sd>>>15,1|sd);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const rr=(a,b)=>a+(b-a)*rnd(),cl=(x,a,b)=>x<a?a:x>b?b:x;
const ss=(a,b,x)=>{const t=cl((x-a)/(b-a),0,1);return t*t*(3-2*t)};
const ease=(k,dt)=>1-Math.exp(-dt*k),mix=(a,b,t)=>a+(b-a)*t;
const wrapA=a=>{while(a>Math.PI)a-=TAU;while(a<-Math.PI)a+=TAU;return a};
const G2=(x,z,cx,cz,rx,rz)=>Math.exp(-(((x-cx)/rx)**2)-(((z-cz)/rz)**2));

const root=new T.Group();root.visible=false;Jt.add(root);
const W=new T.Group();W.scale.setScalar(S);W.rotation.y=YAW;W.position.y=1.7;root.add(W);
/* a model is drawn only once its programs are linked: compileAsync hands them to the GPU process, which links them on its own
   threads where KHR_parallel_shader_compile exists, so frames go on instead of the first draw blocking the main thread on the link.
   Compiled against the composer's target, since tone mapping and output encoding are part of the program and only the final pass
   draws to the screen; a timeout reveals anything still pending rather than leaving it hidden */
let PAR=false;try{PAR=Cn.extensions.has("KHR_parallel_shader_compile")}catch(_){}
const warm=(o,rt,cam)=>{const rv=root.visible,prt=Cn.getRenderTarget();root.visible=true;Cn.setRenderTarget(rt===undefined?Ta.readBuffer||null:rt);let p;
  try{p=Cn.compileAsync(o,cam||De,Jt)}catch(_){p=Promise.resolve()}Cn.setRenderTarget(prt);root.visible=rv;
  return Promise.race([p.catch(()=>0),new Promise(r=>setTimeout(r,MOB?9000:6000))])};
/* models compiled but not yet drawn once: the load is not over until their first draws (which can wait on the link) are behind */
let DPEND=0;
/* debug: one first draw that never comes, to prove the loading pill still clears on the fallback */
if(X.dbg&&/[?&]stalldraw=1/.test(location.search))DPEND++;
const onDes=o=>{if(o===root||!o.visible){o.traverse(c=>{c.layers.mask=1|L3});return}
  DPEND++;o.traverse(c=>{c.layers.mask=0});const on=()=>{o.traverse(c=>{c.layers.mask|=1|L3});requestAnimationFrame(()=>requestAnimationFrame(()=>{DPEND--}))};
  /* without the extension a link cannot be waited on: the model is compiled now and drawn a few frames later */
  if(PAR){warm(o).then(()=>requestAnimationFrame(on));return}
  const rv=root.visible,rt=Cn.getRenderTarget();root.visible=true;Cn.setRenderTarget(Ta.readBuffer||null);try{Cn.compile(o,De,Jt)}catch(_){}Cn.setRenderTarget(rt);root.visible=rv;
  let n=3;const f=()=>{if(--n>0){requestAnimationFrame(f);return}on()};requestAnimationFrame(f)};
/* KTX2Loader.detectSupport enables each format with getExtension, a synchronous GPU round trip that waits behind every frame
   already queued; the list of supported names is answered without one */
function ktxCfg(){let s;try{s=new Set(Cn.getContext().getSupportedExtensions()||[])}catch(_){s=new Set()}const h=e=>s.has(e);
  return{astcSupported:h("WEBGL_compressed_texture_astc"),etc1Supported:h("WEBGL_compressed_texture_etc1"),etc2Supported:h("WEBGL_compressed_texture_etc"),
    dxtSupported:h("WEBGL_compressed_texture_s3tc"),bptcSupported:h("EXT_texture_compression_bptc"),pvrtcSupported:h("WEBGL_compressed_texture_pvrtc")||h("WEBKIT_WEBGL_compressed_texture_pvrtc")}}

/* ---------------- value noise (JS twins of the GLSL below) ---------------- */
const hs2=(x,y)=>{const h=Math.sin(x*127.1+y*311.7)*43758.5453;return h-Math.floor(h)};
function vn2(x,y){const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,ux=fx*fx*(3-2*fx),uy=fy*fy*(3-2*fy);
  const a=hs2(ix,iy),b=hs2(ix+1,iy),c=hs2(ix,iy+1),d=hs2(ix+1,iy+1);return a+(b-a)*ux+(c-a)*uy+(a-b-c+d)*ux*uy}
function fbm2(x,y,o){o=o||4;let s=0,a=.5,n=0;for(let i=0;i<o;i++){s+=a*vn2(x,y);n+=a;x=x*2.03+1.7;y=y*2.03+9.2;a*=.5}return s/n}
const hs3=(x,y,z)=>{const h=Math.sin(x*127.1+y*311.7+z*74.7)*43758.5453;return h-Math.floor(h)};
function vn3(x,y,z){const ix=Math.floor(x),iy=Math.floor(y),iz=Math.floor(z);let fx=x-ix,fy=y-iy,fz=z-iz;
  fx=fx*fx*(3-2*fx);fy=fy*fy*(3-2*fy);fz=fz*fz*(3-2*fz);
  const L=(a,b,t)=>a+(b-a)*t;
  return L(L(L(hs3(ix,iy,iz),hs3(ix+1,iy,iz),fx),L(hs3(ix,iy+1,iz),hs3(ix+1,iy+1,iz),fx),fy),
           L(L(hs3(ix,iy,iz+1),hs3(ix+1,iy,iz+1),fx),L(hs3(ix,iy+1,iz+1),hs3(ix+1,iy+1,iz+1),fx),fy),fz)}
function fbm3(x,y,z,o){o=o||4;let s=0,a=.5,n=0;for(let i=0;i<o;i++){s+=a*vn3(x,y,z);n+=a;x=x*2.01+3.1;y=y*2.01+1.3;z=z*2.01+7.7;a*=.5}return s/n}
const GLSL_NOISE=`
float dh2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float dn2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(dh2(i),dh2(i+vec2(1,0)),f.x),mix(dh2(i+vec2(0,1)),dh2(i+vec2(1,1)),f.x),f.y);}
float dfbm(vec2 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=a*dn2(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return s/.9375;}
`;

/* ---------------- layout (metres; +x = right of the default view, +z = toward the camera) ---------------- */
const AX=24,AZ=19;
const rimF=th=>1+.06*Math.sin(2*th+.7)+.05*Math.sin(3*th-1.2)+.03*Math.sin(5*th+2.1)+.018*Math.sin(8*th+.4)+.01*Math.sin(13*th+1.3);
function sN(x,z){const qx=x/AX,qz=z/AZ;return Math.hypot(qx,qz)/rimF(Math.atan2(qz,qx))}
function edgeXZ(th,s){const f=rimF(th)*s;return[AX*f*Math.cos(th),AZ*f*Math.sin(th)]}

const POND={x:-7.2,z:6.2,rx:6.9,rz:5,wy:-.42};
const pondF=th=>1+.09*Math.sin(2*th+1.1)+.06*Math.sin(3*th-.4)+.04*Math.sin(5*th+2.3);
function pN(x,z){const qx=(x-POND.x)/POND.rx,qz=(z-POND.z)/POND.rz;return Math.hypot(qx,qz)/pondF(Math.atan2(qz,qx))}
/* two open sandy beaches: camels drink at the east one, the eagle at the west one */
const BEACH=[.05,2.5],beachGap=th=>Math.min(...BEACH.map(b=>Math.abs(wrapA(th-b))));
function pondEdge(th,k){const f=pondF(th)*(k||1);return[POND.x+POND.rx*f*Math.cos(th),POND.z+POND.rz*f*Math.sin(th)]}

/* barchan: wind blows toward +x (slightly away), horns point downwind, slip face ~35° */
const DUNE={x:15.6,z:-9.6,H:4.8,w:6.2,Lw:5.2,Ll:4.6,yaw:.45};
const WIND={x:Math.cos(DUNE.yaw),z:-Math.sin(DUNE.yaw)};
/* the wind veers about the dune's prevailing direction (a, radians like DUNE.yaw); d is what the sand feels: it answers a rise
   within seconds and settles over half a minute when the wind drops */
const WS={a:DUNE.yaw,ph:0,d:.35,ra:DUNE.yaw};
/* cv: horn sweep, sk: horn asymmetry */
const DUNE0=Object.assign({cv:2.8,sk:0},DUNE),DP=Object.assign({},DUNE0);
function duneP(x,z,P){
  const c=Math.cos(P.yaw),s=Math.sin(P.yaw),dx=x-P.x,dz=z-P.z;
  const u=dx*c-dz*s,v=dx*s+dz*c,vn=v/P.w,d=u-P.cv*vn*vn+P.sk*vn;
  const hv=Math.exp(-vn*vn*1.15),p=d<0?Math.exp(-((d/P.Lw)**2)):Math.max(0,1-d/P.Ll)**1.3;
  return P.H*hv*p}
const duneH=(x,z)=>duneP(x,z,DUNE0);
/* gusts: one field for everything the wind touches — fronts roll downwind at ~6 m/s, with a slow across-wind wobble */
const GUST={t:0,c:6};
function gustAt(x,z){const s=GUST.t-(x*WIND.x+z*WIND.z)/GUST.c,q=z*WIND.x-x*WIND.z;
  return cl(.5+.26*Math.sin(s*.43)+.16*Math.sin(s*1.07+1.7)+.08*Math.sin(s*2.3+.4)+.1*Math.sin(q*.21+s*.31),0,1)}
const GLSL_GUST=`uniform float uGT;uniform vec2 uWD;
  float gustF(vec2 p){float s=uGT-dot(p,uWD)/${GUST.c.toFixed(1)},q=p.y*uWD.x-p.x*uWD.y;
    return clamp(.5+.26*sin(s*.43)+.16*sin(s*1.07+1.7)+.08*sin(s*2.3+.4)+.1*sin(q*.21+s*.31),0.,1.);}`;
/* the dune creeps on its own clock, which runs faster in gusts; incommensurate periods (≈3–12 min) so the shape never visibly loops */
const DCLK={ph:0};
function duneEvolve(dph){
  const p=DCLK.ph+=dph,c=Math.cos(DUNE0.yaw),s=Math.sin(DUNE0.yaw);
  const mg=.55*Math.sin(p/89+.3)+.35*Math.sin(p/37+2.1),lt=.4*Math.sin(p/61+1.1);
  DP.x=DUNE0.x+mg*c+lt*s;DP.z=DUNE0.z-mg*s+lt*c;
  DP.H=DUNE0.H*(1+.05*Math.sin(p/47+.7)+.03*Math.sin(p/23+2.6));
  DP.w=DUNE0.w*(1+.04*Math.sin(p/67+.1));
  DP.cv=DUNE0.cv+.45*Math.sin(p/53+1.9);DP.sk=.3*Math.sin(p/71+.4)+.12*Math.sin(p/29+1.3);
  DP.Lw=DUNE0.Lw*(1+.06*Math.sin(p/43+2.2));DP.Ll=DUNE0.Ll*(1-.07*Math.sin(p/57+.9))}
/* where the dune may move: a zone around it, pinned at the rim and around anything resting on the sand */
let DOB=null,DLIVE=false;const PINS=[];
function dZone(x,z){const c=Math.cos(DUNE0.yaw),s=Math.sin(DUNE0.yaw),dx=x-DUNE0.x,dz=z-DUNE0.z,u=dx*c-dz*s,v=dx*s+dz*c;
  if(u<-9||u>11.5||Math.abs(v)>10)return 0;return ss(-9,-6.5,u)*ss(11.5,9,u)*ss(10,7.5,Math.abs(v))*(1-ss(.88,.96,sN(x,z)))}
function dMask(x,z){let m=dZone(x,z);if(m>0)m*=duneRim(x,z);if(m<=0||!DOB)return m;for(const o of DOB){const d=Math.hypot(x-o.x,z-o.z);if(d<o.r+1.6)m*=ss(o.r+.25,o.r+1.6,d)}return m}
/* the mask never changes once settled, so per-frame lookups (grains, veil, animals) read it from a 0.25 m grid; the zone fits inside ±16 m */
let MG=null;
function bakeMask(){const N=129,h=.25,x0=DUNE0.x-16,z0=DUNE0.z-16,a=new Float32Array(N*N);
  for(let j=0;j<N;j++)for(let i=0;i<N;i++)a[j*N+i]=dMask(x0+i*h,z0+j*h);MG={N,h,x0,z0,a}}
function dMaskG(x,z){const g=MG,fx=(x-g.x0)/g.h,fz=(z-g.z0)/g.h;if(fx<0||fz<0||fx>=g.N-1||fz>=g.N-1)return 0;
  const i=fx|0,j=fz|0,tx=fx-i,tz=fz-j,o=j*g.N+i,a=g.a;return(a[o]*(1-tx)+a[o+1]*tx)*(1-tz)+(a[o+g.N]*(1-tx)+a[o+g.N+1]*tx)*tz}
function dDelta(x,z){if(!DLIVE)return 0;const m=dMaskG(x,z);return m>0?m*(duneP(x,z,DP)-duneP(x,z,DUNE0)):0}

/* reference2 layout: pond left-front by the rim, palms just behind it, tent + fire centre-right,
   dune behind-right; saguaros at their real heights: a 12 m giant on the rise behind the palms, a flowering 7 m one on the
   left rim, a young 3 m one front-right; chollas on the dry sand toward the rim, barrel cacti in small groups on gravel */
const TENT={x:5.4,z:-3.9,yaw:-.24,L:6,D:4,H:2.2};
const tentFwd={x:Math.sin(TENT.yaw),z:Math.cos(TENT.yaw)},tentRt={x:Math.cos(TENT.yaw),z:-Math.sin(TENT.yaw)};
const FIRE={x:TENT.x+tentFwd.x*(TENT.D*.5+2.3)-tentRt.x*1.5,z:TENT.z+tentFwd.z*(TENT.D*.5+2.3)-tentRt.z*1.5};
/* where people sit round the fire: three logs on the open sides (a: bearing from the fire, 0 = straight away from the tent),
   a flat seat stone, two stone piles and a stack of firewood toward the tent; the tent side stays open to the door */
const FIRE_B=Math.atan2(tentFwd.x,tentFwd.z);
const SEATS=[{a:.12,r:1.62,len:1.75,rad:.165,tw:.14},{a:1.72,r:1.55,len:1.5,rad:.15,tw:-.1},{a:-1.82,r:1.6,len:1.62,rad:.175,tw:.18}].map(s=>{const b=FIRE_B+s.a;
  return Object.assign(s,{x:FIRE.x+Math.sin(b)*s.r,z:FIRE.z+Math.cos(b)*s.r,yaw:b+Math.PI/2+s.tw})});
const FIRE_KIT={seat:{a:.95,r:1.5},piles:[{a:2.55,r:1.95,n:7},{a:-.85,r:2.05,n:5}],wood:{a:-2.62,r:1.85}};
const fireAt=(a,r)=>({x:FIRE.x+Math.sin(FIRE_B+a)*r,z:FIRE.z+Math.cos(FIRE_B+a)*r});
const tentU={uT:{value:0},uShk:{value:0},uSnL:{value:0},uTGy:{value:0},uRn:{value:0},uFrost:{value:0},uSunD:{value:new V3(0,1,0)},uSunC:{value:new C3(1,1,1)},uNt:{value:0},uWetC:{value:0},uWInv:{value:new T.M4()},uTC:{value:new T.V2(TENT.x,TENT.z)},uTF:{value:new T.V2(tentFwd.x,tentFwd.z)}};
const RACK={x:TENT.x+tentRt.x*5.1+tentFwd.x*.9,z:TENT.z+tentRt.z*5.1+tentFwd.z*.9,yaw:TENT.yaw};
const PALMS=[{x:-3.6,z:-1.8,h:11.8,lean:[.05,-.06],ry:.4},{x:-1.0,z:-4.2,h:10.8,lean:[.07,.05],ry:2.1},{x:-7.2,z:-.5,h:7.6,lean:[-.06,.04],ry:4.0}];
const SAG=[{k:"s12",lo:"s12_lod1",x:-12.5,z:-10.8,ry:.5,r:1.3},{k:"s7f",lo:"s7_lod1",x:-19.6,z:-3.4,ry:.6,r:.9},{k:"s3",lo:"s3_lod1",x:12.6,z:6.2,ry:2.4,r:.5}];
const CACTI=[{f:"cholla_v2",x:-16.2,z:-11.6,ry:.3,s:1,r:.8},{f:"cholla_v2",x:9.4,z:12.6,ry:3.7,s:.85,r:.7}];
/* desert pavement by the rim rocks (x, z, radius); fishhook barrels grow on it in small groups, one stray out on the sand.
   s 1 = the model's 0.74 m body; tilt = lean toward the south-west sun */
const GRV=[{x:17.6,z:5.4,r:2.4},{x:-11.4,z:-14.2,r:2.1},{x:8.0,z:-14.8,r:1.9}];
const BARRELS=[{x:17.1,z:4.9,s:1.12,ry:.4,tilt:.2},{x:18.3,z:5.9,s:.78,ry:2.9,tilt:.15},{x:17.45,z:6.45,s:.56,ry:4.6,tilt:.1},
  {x:-11,z:-13.9,s:1,ry:1.7,tilt:.18},{x:-11.95,z:-14.7,s:.68,ry:5.3,tilt:.13},{x:8.3,z:-14.6,s:.9,ry:3.4,tilt:.16},{x:12,z:9.4,s:.72,ry:.9,tilt:.12}];
const PADS=[{x:TENT.x,z:TENT.z,rx:5.2,rz:4.2,yaw:TENT.yaw},{x:FIRE.x,z:FIRE.z,rx:2.2,rz:2.2,yaw:0},{x:RACK.x,z:RACK.z,rx:2.4,rz:1.6,yaw:RACK.yaw}];

/* the dune's horns and lee foot reach the rim: there it would lift the lip 2.7 m and the falls would hang off that step like a wall
   or a breaking wave. It dies down over the last few metres instead, so the lip stays level and the dune reads as one on the sand */
const duneRim=(x,z)=>1-ss(.8,.97,sN(x,z));
function hRaw(x,z){
  let h=.55*(fbm2(x*.045+3.1,z*.045-1.7)-.5)+.16*(fbm2(x*.17,z*.17)-.5);
  const dh=duneH(x,z);if(dh>.002)h+=dh*duneRim(x,z);
  h+=1.1*G2(x,z,-12,-11.5,6.5,4)+.7*G2(x,z,15,7,5.5,4)+.5*G2(x,z,-19,-8,4,5)+.35*G2(x,z,3,11.5,6.5,3);
  return h}
PADS.forEach(p=>{p.h=hRaw(p.x,p.z)});
const hTop=(x,z)=>hTop0(x,z)+dDelta(x,z);
function hTop0(x,z){
  let h=hRaw(x,z);
  for(const p of PADS){const c=Math.cos(p.yaw),s=Math.sin(p.yaw),dx=x-p.x,dz=z-p.z;
    const u=(dx*c-dz*s)/p.rx,v=(dx*s+dz*c)/p.rz,r=Math.hypot(u,v);if(r<1.6)h=mix(h,p.h,ss(1.6,.9,r))}
  const n=pN(x,z);
  if(n<2){const sh=POND.wy+.12;
    if(n<1)h=sh-.3*ss(1,.82,n)-1.25*ss(.85,.25,n);
    else h=mix(sh,h,ss(1,2,n))}
  h-=.6*ss(.9,1.01,sN(x,z));
  return h}
function nTop(x,z){const e=.25,hx=hTop(x+e,z)-hTop(x-e,z),hz=hTop(x,z+e)-hTop(x,z-e);return new V3(-hx,2*e,-hz).normalize()}

/* world <-> island-local helpers */
const _v=new V3();
const toW=(x,y,z)=>W.localToWorld(_v.set(x,y,z)).clone();
const ROOT=()=>(window.CY&&CY.root)||"";

/* ---------------- textures + Tripo GLBs (self-hosted three GLTFLoader, no CDN) ---------------- */
function loadTex(rel){
  return new Promise((res,rej)=>{const img=new Image();img.onload=()=>{const t=new T.CTex(img);t.colorSpace="srgb";t.wrapS=t.wrapT=1000;t.anisotropy=MOB?4:8;t.needsUpdate=true;res(t)};img.onerror=rej;img.src=ROOT()+rel})}
let _gltf=null,VT=null;
function gltfMod(){if(_gltf)return _gltf;
  const r=ROOT(),url=r?r+"assets/vendor/des-gltf.js":new URL("../assets/vendor/des-gltf.js",location.href).href;
  /* the loader bundles its own three: hide the app's revision tag so it doesn't announce a second copy,
     and give its materials the no-op onBuild the app's renderer still calls */
  const tag=window.__THREE__;try{delete window.__THREE__}catch(_){}
  _gltf=import(url).then(m=>{VT=m;if(tag!==undefined)window.__THREE__=tag;
    try{m.THREE.Material.prototype.onBuild=function(){}}catch(_){}return m})
    .catch(()=>{if(tag!==undefined)window.__THREE__=tag;_gltf=null;return Promise.reject(0)});
  return _gltf}
const GLB={};
/* download progress per model file, against the byte sizes the build records in CY.ms, for the loading indicator */
/* the GLBs are meshopt-compressed (EXT_meshopt_compression); the decoder is a small self-hosted wasm module */
let _mo=null;
function meshopt(){if(_mo)return _mo;const r=ROOT(),url=r?r+"assets/vendor/meshopt_decoder.module.js":new URL("../assets/vendor/meshopt_decoder.module.js",location.href).href;
  return _mo=import(url).then(x=>x.MeshoptDecoder.ready.then(()=>{const d=x.MeshoptDecoder;
    /* decode on worker threads: the 9 MB snake otherwise holds the main thread (and the loading pill) for seconds */
    try{if(typeof Worker!=="undefined")d.useWorkers(MOB?2:4)}catch(_){}return d})).catch(()=>{_mo=null;return Promise.reject(0)})}
/* one loader for every model: textures are KTX2 (Basis), transcoded on worker threads by the self-hosted transcoder */
let _gld=null;const GLP={};
/* ui.js starts every model's download when the desert is chosen (window.__desPre); one that arrived is parsed from its buffer */
const desPre=()=>window.__desPre||{};
function glb(key){if(!GLB[key]){const P=GLP[key]={l:0,t:((window.CY||{}).ms||{})[key]||3e6,d:0},E=desPre()[key];
  GLB[key]=Promise.all([gltfMod(),meshopt(),E&&E.p]).then(([m,md,buf])=>new Promise((res,rej)=>{
    const k2=()=>{const k=new m.KTX2Loader().setTranscoderPath(ROOT()+"assets/vendor/").setWorkerLimit(MOB?1:2);k.workerConfig=ktxCfg();return k};
    const ld=_gld||(_gld=new m.GLTFLoader().setMeshoptDecoder(md).setKTX2Loader(k2())),ok=g=>res({scene:g.scene||g.scenes&&g.scenes[0],animations:g.animations||[],gltf:g});
    if(buf){delete desPre()[key];P.l=P.t;ld.parse(buf,ROOT()+"assets/models/",ok,rej);return}
    ld.load(ROOT()+"assets/models/"+key+".glb",ok,e=>{if(e&&e.loaded)P.l=Math.min(P.t,e.loaded)},rej)}));
  GLB[key].then(()=>{P.l=P.t;P.d=1},()=>{P.l=P.t;P.d=1})}
  return GLB[key]}
function boxOf(o){
  const mn=new V3(1e9,1e9,1e9),mx=new V3(-1e9,-1e9,-1e9),p=new V3();o.updateMatrixWorld(true);
  o.traverse(c=>{if(!c.isMesh||!c.geometry)return;const a=c.geometry.attributes.position;if(!a)return;
    const step=Math.max(1,Math.floor(a.count/4000));
    for(let i=0;i<a.count;i+=step){p.fromBufferAttribute(a,i).applyMatrix4(c.matrixWorld);mn.min(p);mx.max(p)}});
  return{mn,mx}}
/* wrap a GLB scene so its ground contact is the origin and it is scaled to `h` metres along `axis` */
function fitTo(scene,h,axis){
  const b=boxOf(scene),span=axis==="xz"?Math.max(b.mx.x-b.mn.x,b.mx.z-b.mn.z):b.mx.y-b.mn.y,sc=h/Math.max(1e-3,span);
  scene.position.set(-(b.mn.x+b.mx.x)*.5,-b.mn.y,-(b.mn.z+b.mx.z)*.5);
  const w=new T.Group();w.add(scene);w.scale.setScalar(sc);w.userData.sc=sc;w.userData.box=b;return w}
function matsOf(o,fn){o.traverse(c=>{if(!c.isMesh||!c.material)return;(Array.isArray(c.material)?c.material:[c.material]).forEach(m=>fn(m,c))})}
function cleanMat(m){if(m.map){m.map.colorSpace="srgb";m.map.anisotropy=MOB?4:8;m.map.needsUpdate=true}
  if(m.emissive){m.emissive.setRGB(0,0,0);m.emissiveIntensity=0}m.metalness=0;m.envMapIntensity=0;m.needsUpdate=true}

/* ---------------- island: one coherent mass — sand plateau + stratified sandstone underside ---------------- */
const NT=MOB?200:320,NSR=MOB?70:120;
/* r: groove depth, g: heaped sand (rims, push mounds, thrown grains); for the belly-scale imprint, read from the nearest texel:
   b: the body's heading there (mod π) in 1..127 where it was set down sidewinding, 129..255 rectilinear (0: slid, none),
   a: the scale row's phase at the texel centre. Uploaded as raw data so the alpha channel is never premultiplied. */
const TRK=(()=>{const N=MOB?512:768,M=5.12,d=new Uint8ClampedArray(N*N*4);
  const tex=new T.CTex(new ImageData(d,N,N));tex.isDataTexture=true;tex.unpackAlignment=1;tex.flipY=false;tex.colorSpace="";tex.generateMipmaps=false;tex.minFilter=1006;tex.magFilter=1006;tex.needsUpdate=true;
  return{N,M,d,tex,ox:0,oz:0,up:0,dc:0,dirty:0,any:0,U:{uTrk:{value:tex},uTrkW:{value:new T.V4(0,0,1/M,1/N)}}}})();
/* spacing of the rattlesnake's belly scales (m) */
const RS_SCL=.0058;
const sandU={uWy:{value:POND.wy},uRipDir:{value:new T.V2(WIND.x,WIND.z)},uRip:{value:1},uNight:{value:0},
  uSandA:{value:new C3("#e8a95c")},uSandB:{value:new C3("#c98444")},uWet:{value:new C3("#8a6c4c")},uSoil:{value:new C3("#a39457")},
  uPond:{value:new T.V4(POND.x,POND.z,POND.rx,POND.rz)},uGrv:{value:GRV.map(g=>new T.V4(g.x,g.z,g.r,0))},
  uDA:{value:new T.V4()},uDB:{value:new T.V4()},uDA0:{value:new T.V4(DUNE0.x,DUNE0.z,DUNE0.H,DUNE0.w)},uDB0:{value:new T.V4(DUNE0.Lw,DUNE0.Ll,DUNE0.cv,DUNE0.sk)},uDYaw:{value:DUNE0.yaw},
  uGT:{value:0},uWD:{value:new T.V2(WIND.x,WIND.z)},uFlowT:{value:0},uFlowK:{value:1},uRipPh:{value:0},uLd:{value:new V3(0,1,0)},uHaze:{value:new C3("#d4aab8")},uWetK:{value:0},uPitK:{value:0},uHeat:{value:0},uTm:{value:0},uMirC:{value:new C3("#cfe1f2")},uMirB:{value:new C3("#8fb3dc")},
  uSnow:{value:0},uSnM:{value:0},uSnP:{value:0},uMW:{value:0},uHC:{value:0},uHP:{value:0},uHM:{value:0},uNorth:{value:new T.V2(-Math.sin(148*Math.PI/180),-Math.cos(148*Math.PI/180))}};
const GLSL_DUNE=`uniform vec4 uDA,uDB,uDA0,uDB0;uniform float uDYaw;
  float duneG(vec2 p,vec4 A,vec4 B){float c=cos(uDYaw),s=sin(uDYaw);vec2 d=p-A.xy;float u=d.x*c-d.y*s,v=d.x*s+d.y*c,vn=v/A.w,dd=u-B.z*vn*vn+B.w*vn;
    float hv=exp(-vn*vn*1.15),pp=dd<0.?exp(-(dd/B.x)*(dd/B.x)):pow(max(0.,1.-dd/B.y),1.3);return A.z*hv*pp;}
  float duneD(vec2 p){return duneG(p,uDA,uDB)-duneG(p,uDA0,uDB0);}`;
/* the creeping dune: masked height change on top of the built surface, normal rebuilt from its gradient */
const SAND_DISP=`float dDsp=aM>0.?aM*duneD(position.xz):0.;transformed.y+=dDsp;`;
function sandMat(){
  const m=new T.MSM({color:0xffffff,roughness:.93,metalness:0});
  m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,sandU);
    sh.vertexShader=sh.vertexShader.replace("#include <common>",`#include <common>
      varying vec3 vSP;varying vec3 vSN;varying vec3 vWP;varying vec2 vDn;uniform vec2 uRipDir;uniform float uSnow,uMW;attribute float aM;${GLSL_DUNE}`)
      .replace("#include <beginnormal_vertex>",`vec3 objectNormal=vec3(normal);
        if(aM>0.){float e=.3;vec2 p=position.xz;
          vec2 gd=vec2(duneD(p+vec2(e,0.))-duneD(p-vec2(e,0.)),duneD(p+vec2(0.,e))-duneD(p-vec2(0.,e)))/(2.*e)*aM;
          vec3 nb=normal/max(normal.y,.2);objectNormal=normalize(vec3(nb.x-gd.x,1.,nb.z-gd.y));}
        #ifdef USE_TANGENT
        vec3 objectTangent=vec3(tangent.xyz);
        #endif`)
      .replace("#include <begin_vertex>",`#include <begin_vertex>
        ${SAND_DISP}vSP=transformed;vSN=objectNormal;vWP=(modelMatrix*vec4(transformed,1.)).xyz;
        /* where the dune is (x) and how sharply it peaks along the wind (y: high only along the crest), for the snow */
        vDn=aM>0.&&uSnow+uMW>.003?vec2(aM,aM*(duneG(position.xz,uDA,uDB)-.5*(duneG(position.xz+uRipDir*1.4,uDA,uDB)+duneG(position.xz-uRipDir*1.4,uDA,uDB)))):vec2(0.);`);
    sh.fragmentShader=sh.fragmentShader.replace("#include <common>",`#include <common>
      varying vec3 vSP;varying vec3 vSN;varying vec3 vWP;varying vec2 vDn;uniform mat3 normalMatrix;uniform float uWy,uRip,uNight,uFlowT,uFlowK,uRipPh,uWetK,uPitK,uHeat,uTm;uniform vec2 uRipDir;uniform vec3 uLd,uHaze,uMirC,uMirB;float mkO=0.;
      uniform vec3 uSandA,uSandB,uWet,uSoil;uniform vec4 uPond;uniform vec4 uGrv[${GRV.length}];${GLSL_NOISE}${GLSL_GUST}
      float pondN(vec2 p){vec2 q=(p-uPond.xy)/uPond.zw;float th=atan(q.y,q.x);
        return length(q)/(1.+.09*sin(2.*th+1.1)+.06*sin(3.*th-.4)+.04*sin(5.*th+2.3));}
      /* wind ripples are not a ruled pattern: the spacing drifts from patch to patch and from one crest to the next (no two gaps alike),
         crests wander and fork where it does, and they fade out and break */
      /* the warp W, spacing drift pm and fade am change over metres: taken once per pixel, not for each of the three height samples */
      float ripH(vec2 p,vec2 W,float pm,float am){vec2 q=p+W,d2=vec2(-uRipDir.y,uRipDir.x);float al=dot(q,uRipDir);
        float ph=al*8.38*pm+(dn2(vec2(dot(q,d2)*.55,al*.12)+5.)-.5)*3.4+(dn2(vec2(al*.85,dot(q,d2)*.07)+9.)-.5)*2.4-uRipPh;float a=sin(ph+.9*sin(ph));
        float b=sin(dot(q*1.7+3.,uRipDir+d2*.35)*8.38-uRipPh*1.6);
        return (a*.7+b*.3)*am;}`)
      .replace("#include <color_fragment>",`#include <color_fragment>
        float pn=pondN(vSP.xz);
        float nz=dfbm(vSP.xz*.06),nz2=dfbm(vSP.xz*.45+3.);
        vec3 sc=mix(uSandB,uSandA,smoothstep(.25,.75,nz)*.8+.2*nz2);
        float slope=1.-normalize(vSN).y;
        sc=mix(sc,uSandB*.94,smoothstep(.15,.45,slope)*.5);
        float soil=smoothstep(2.3,1.05,pn)*(.75+.25*nz2);
        sc=mix(sc,uSoil,soil*.8);
        float wet=smoothstep(uWy+.32,uWy+.04,vSP.y)*smoothstep(1.25,.9,pn);
        sc=mix(sc,uWet,wet);
        /* desert pavement: a lag of pebbles (grey, tan, varnished red-brown) over darker grit; at a distance only their mean tone */
        float grv=0.;
        for(int i=0;i<${GRV.length};i++){vec4 g=uGrv[i];vec2 q=vSP.xz-g.xy;float sh=(dfbm(q*.42+g.xy)-.5)*.75+(nz2-.5)*.3;grv=max(grv,smoothstep(1.,.35,length(q)/g.z+sh));}
        grv*=.55+.45*smoothstep(.3,.65,dfbm(vSP.xz*1.1+2.));
        grv*=1.-wet;
        if(grv>.002){vec2 gc=vSP.xz*20.,gi=floor(gc),gf=fract(gc),rv=vec2(0.);float md=9.,id=0.,on=0.;
          /* each cell may hold one pebble: an ellipse of its own size, elongation and heading, edge broken by noise */
          for(int j=-1;j<=1;j++)for(int k=-1;k<=1;k++){vec2 o=vec2(float(k),float(j)),c=gi+o;vec2 r=o+.15+.7*vec2(dh2(c),dh2(c+5.3))-gf;
            float h=dh2(c+11.3),rad=.16+.3*h,an=dh2(c+3.7)*6.283,el=1.+.7*dh2(c+8.1);vec2 ax=vec2(cos(an),sin(an));
            float dd=length(vec2(dot(r,ax)/el,dot(r,vec2(-ax.y,ax.x))))/rad;
            if(dd<md){md=dd;id=dh2(c+1.7);on=step(.62-.42*grv,dh2(c+9.1));rv=r/(rad*el);}}
          vec3 grit=sc*vec3(.72,.66,.6);
          vec3 pc=mix(vec3(.15,.12,.1),vec3(.32,.2,.11),smoothstep(.2,.7,id));pc=mix(pc,vec3(.09,.055,.04),step(.8,id));pc=mix(pc,vec3(.42,.34,.25),step(.95,id));
          pc=mix(pc,grit,.25);
          float fg=length(fwidth(gc)),gv=1.-smoothstep(.2,.7,fg),d1=md+(dn2(gc*3.1+id*17.)-.5)*.3,ew=.07+fg*.6,peb=on*smoothstep(1.+ew,1.-ew,d1);
          vec2 L2=normalize(uLd.xz+vec2(1e-4)),lo=-rv;float lit=dot(lo,L2);
          float sh=on*(1.-peb)*smoothstep(1.55,1.05,d1)*clamp(-lit*1.4+.25,0.,1.);
          vec3 gr=mix(grit*(1.-.35*sh),pc*(.8+.22*lit*smoothstep(1.,.3,d1)+.12*(1.-d1*d1)),peb);
          sc=mix(sc,mix(mix(grit,vec3(.3,.24,.19),.35),gr,gv),grv*.9);}
        /* rain: the first drops print small dark spots; as it keeps raining wet blobs spread out of the noise and merge into
           an even wet skin. Drying runs the other way and breaks the skin up again: crests, slopes and the dune top first,
           hollows last. Each drop also leaves a pit, a little crater with a thrown-up rim, which the wind wears away later. */
        float rWM=0.;vec2 pitG=vec2(0.);
        if(uWetK>.002||uPitK>.002){float fwc2=length(fwidth(vSP.xz));
          float dryB=.35*smoothstep(1.,4.5,vSP.y)+.15*nz2+.25*smoothstep(.12,.4,slope);
          float lvl=uWetK*1.25-dryB*.7+(nz-.5)*.3+(dn2(vSP.xz*1.7+4.)-.5)*.35;
          float blob=smoothstep(-.04,.14,lvl-.25+(dn2(vSP.xz*7.)-.5)*.35+(dn2(vSP.xz*19.+2.)-.5)*.18);
          float dots=0.;
          for(int L=0;L<${MOB?1:2};L++){vec2 cg=vSP.xz*(L==0?19.:31.)+float(L)*17.3,ci=floor(cg),cf=fract(cg)-.5,off=vec2(dh2(ci+3.1),dh2(ci+7.3))-.5;
            float h=dh2(ci),rd=.13+.17*dh2(ci+5.9);
            dots=max(dots,step(h,uWetK*2.6)*smoothstep(rd,rd*.6,length(cf-off*.45))*(.65+.35*dh2(ci+2.2)));}
          dots*=1.-smoothstep(.006,.03,fwc2);
          rWM=max(blob,dots*.85)*(1.-wet);sc=mix(sc,sc*vec3(.42,.37,.32),rWM);
          /* pits keep their shape out to a few metres; further on, where one is only a few pixels, it is kept as a soft dark fleck */
          float pnr=1.-smoothstep(.005,.02,fwc2),pfar=1.-smoothstep(.02,.07,fwc2);
          if(uPitK>.002&&pfar>.01){
            for(int L=0;L<${MOB?1:2};L++){vec2 cg=vSP.xz*(L==0?16.:27.)+float(L)*5.7,ci=floor(cg),cf=fract(cg)-.5,off=(vec2(dh2(ci+1.9),dh2(ci+4.4))-.5)*.4;
              float h=dh2(ci+8.8)/(L==0?.7:.45);if(h>uPitK)continue;float rp=.12+.18*pow(dh2(ci+6.1),1.5);vec2 d=cf-off;float r=length(d)/rp;
              /* bowl falling to the centre, rim heaped just outside it; fresh pits are sharp, older ones slumped */
              float age=clamp((uPitK-h)*6.,0.,1.),rg=exp(-(r-1.1)*(r-1.1)/.03),dr=(r<1.?2.*r:0.)-.7*(r-1.1)/.03*rg;
              pitG+=d/max(length(d),1e-4)*dr*(1.-.55*age)*(L==0?1.:.7);
              /* the drop wets and darkens the bowl; the thrown-up rim is drier, lighter sand. Finer than a few pixels a pit
                 fades to the average darkening of the cell, so it does not sparkle */
              float px=clamp(fwc2*(L==0?16.:27.)/rp*1.6-.6,0.,1.),fresh=1.-.5*age;
              float bowl=mix(smoothstep(1.05,.35,r),.42*rp*rp*3.14,px),rim=mix(rg,0.,px);
              sc*=(1.-.3*bowl*fresh*(.5+.5*uWetK))*(1.+.16*rim*fresh*pnr);}
            pitG*=pnr*.45;}
          sc*=1.-.05*uPitK*(1.-pfar);}
        /* close up the sand shows a fine, soft mottle of lighter and darker grains (smooth noise only: no cells to alias into squares) */
        {float fwc=length(fwidth(vSP.xz)),gd=1.-smoothstep(.006,.035,fwc);
         float g1=dn2(vSP.xz*71.+1.3),g2=dn2(vSP.xz*17.+5.);
         sc*=1.+gd*((g1-.5)*.09+(g2-.5)*.1);}
        diffuseColor.rgb=mix(sc,vec3(dot(sc,vec3(.3,.59,.11)))*vec3(.74,.88,1.04),uNight*.7)*mix(1.,.54,uNight);`)
      .replace("#include <roughnessmap_fragment>",`#include <roughnessmap_fragment>
        roughnessFactor=mix(roughnessFactor,.64,rWM);`)
      .replace("#include <normal_fragment_maps>",`#include <normal_fragment_maps>
        float ripAO=1.;
        {float fw=length(fwidth(vSP.xz));
         float pn2=pondN(vSP.xz);
         vec3 nS=normalize(vSN);float lee=smoothstep(.08,.3,dot(nS.xz,uRipDir));
         float k=uRip*(1.-smoothstep(.07,.3,fw))*smoothstep(1.3,1.8,pn2)*smoothstep(.35,.7,nS.y)*(1.-.85*lee)*(1.-grv);
         if(k>.001){vec2 rp=vSP.xz,RW=vec2(dfbm(rp*.09)*4.,dfbm(rp*.11+7.)*2.5);float rpm=1.+.3*(dn2(rp*.07+1.3)-.5),ram=.5+.5*smoothstep(.28,.62,dn2(rp*.21+11.));
           float e=.04,h0=ripH(rp,RW,rpm,ram);
           vec2 g=vec2(ripH(rp+vec2(e,0.),RW,rpm,ram)-h0,ripH(rp+vec2(0.,e),RW,rpm,ram)-h0)/e*.036*k*(1.+.9*uNight);
           ripAO=1.-(.13+.17*uNight)*k*(.5-.5*h0);
           vec3 nL=normalize(normalize(vSN)-vec3(g.x,0.,g.y));
           normal=normalize(normalMatrix*nL);}}
        if(dot(pitG,pitG)>1e-6)normal=normalize(normal+normalMatrix*vec3(-pitG.x,0.,-pitG.y));`)
      /* drifting sand: ground-hugging streamers of fine grains running downwind, denser in gusts and over the dune;
         lit by the scene's own direct light (so shadowed, warm, or moonlit as the sand is) plus forward scatter against the light */
      .replace("#include <opaque_fragment>",`{
        vec2 p=vSP.xz,wd=uWD,wp=vec2(-wd.y,wd.x);float al=dot(p,wd)-uFlowT,ac=dot(p,wp);
        float g=gustF(p),fwf=length(fwidth(p));
        float s1=dn2(vec2(al*.3,ac*1.7)),s2=dn2(vec2(al*.8+5.,ac*4.4+2.));
        float str=smoothstep(.4,.82,s1*.6+s2*.4)*(.35+.65*dn2(vec2(al*.07-uGT*.05,ac*.16)));
        ${MOB?"float grain=1.;":"float gr=dn2(vec2(al*13.,ac*9.)+vec2(0.,3.));float grain=mix(1.,.55+.9*smoothstep(.25,.85,gr),1.-smoothstep(.012,.05,fwf));"}
        float fl=str*grain*smoothstep(.18,.72,g)*uFlowK*smoothstep(1.45,2.1,pondN(p))*(1.+1.45*smoothstep(.6,3.2,vSP.y))*(.4+.6*(1.-smoothstep(.06,.25,fwf)));
        vec3 V=normalize(cameraPosition-vWP);float fs=pow(max(dot(V,-uLd),0.),5.);
        outgoingLight*=ripAO;
        outgoingLight+=(reflectedLight.directDiffuse*(1.7+4.2*fs)+reflectedLight.indirectDiffuse*.55)*fl*(.35+.9*min(uFlowK,1.7));
        /* aerial perspective: far sand takes a little of the sky's colour */
        float dC=length(cameraPosition-vWP);outgoingLight=mix(outgoingLight,uHaze*(.55+.45*(1.-uNight))*.9,.14*smoothstep(22.,75.,dC));
        /* heat: far sand shimmers, and a mirage shows the sky in the sand as broken blue-grey pools that drift, split and
           breathe with the heat. A real mirage needs grazing angles (under ~9 degrees): from the usual high view only the farthest
           flat sand, seen at its lowest angle, keeps a faint trace of it, so the island top never reads as standing water */
        if(uHeat>.01){float dM=dC/${S.toFixed(3)},fl=smoothstep(.85,.95,normalize(vSN).y);
          float gz=smoothstep(.16,.035,V.y)*smoothstep(4.,12.,dM)*fl,gf=smoothstep(.3,.2,V.y)*smoothstep(38.,55.,dM)*fl*.45;
          vec2 vh=normalize(V.xz+vec2(1e-5));float ax=dot(vSP.xz,vec2(-vh.y,vh.x)),ay=dot(vSP.xz,vh);
          float sh=dn2(vec2(ax*.6,ay*2.4-uTm*1.6))*.6+dn2(vec2(ax*1.9,ay*5.-uTm*2.9))*.4;
          float pu=.62+.38*(.5+.5*sin(uTm*.37+ax*.04))*(.6+.4*sin(uTm*.21+1.3));
          float w=uHeat*pu*max(gz,gf);
          outgoingLight*=1.+uHeat*(.05+.14*max(gz,gf))*(sh-.5);
          /* pools stretched across the line of sight; the shimmer is fine ripples rising through them */
          float pl=dn2(vec2(ax*.34+uTm*.045,ay*1.05-uTm*.035))*.68+dn2(vec2(ax*.9-uTm*.08,ay*2.6+uTm*.05))*.32;
          float sm=dn2(vec2(ax*1.6,ay*11.-uTm*4.2))*.55+dn2(vec2(ax*4.2+3.,ay*24.-uTm*7.))*.45;
          float mk=min(1.,w*1.3)*smoothstep(.6,.74,pl+.08*w)*(.45+.55*smoothstep(.2,.7,sm));
          mkO=mk;}}
      #include <opaque_fragment>
        /* the mirage itself is drawn by the screen pass (mirP): sand tells it where it is and how strong, in alpha */
        if(uHeat>.01)gl_FragColor.a=.985-.48*mkO;`);
  };
  if(TRK){const f=m.onBeforeCompile;m.onBeforeCompile=sh=>{f(sh);Object.assign(sh.uniforms,TRK.U);
    sh.fragmentShader=sh.fragmentShader.replace("uniform vec4 uPond;","uniform vec4 uPond;uniform sampler2D uTrk;uniform vec4 uTrkW;\n float trkH(vec2 q){vec2 t=texture2D(uTrk,q).rg;return t.g*.0085-t.r*.011;}")
      /* the track's edges crumble: its lookup is shifted by up to a texel of fine noise, faded out where it would alias */
      .replace("diffuseColor.rgb=mix(sc,vec3(dot(sc",`vec2 tUV=(vSP.xz-uTrkW.xy)*uTrkW.z+.5;float tIn=smoothstep(.497,.3,max(abs(tUV.x-.5),abs(tUV.y-.5)));
        vec2 tU0=tUV;
        tUV+=(vec2(dn2(vSP.xz*60.),dn2(vSP.xz*60.+7.3))-.5)*uTrkW.w*1.8*(1.-smoothstep(.0025,.007,length(fwidth(vSP.xz))));
        vec4 trq=texture2D(uTrk,tUV);vec2 trk=trq.rg*tIn;sc*=(1.-.14*trk.r)*(1.+.05*trk.g);
        diffuseColor.rgb=mix(sc,vec3(dot(sc`)
      .replace("float k=uRip*(1.-smoothstep(.07,.3,fw))","float k=uRip*(1.-smoothstep(.12,.5,trk.r+trk.g))*(1.-smoothstep(.07,.3,fw))")
      .replace("normal=normalize(normalMatrix*nL);}}",`normal=normalize(normalMatrix*nL);}}
        if(tIn>0.&&trk.r+trk.g>.004){float e=uTrkW.w;vec2 g=vec2(trkH(tUV+vec2(e,0.))-trkH(tUV-vec2(e,0.)),trkH(tUV+vec2(0.,e))-trkH(tUV-vec2(0.,e)))/(2.*e/uTrkW.z);
          normal=normalize(normal+normalMatrix*vec3(-g.x,0.,-g.y)*tIn);ripAO*=1.-.3*trk.r;
          /* where the body was set down rather than slid, its belly scales press fine ridges across the groove floor (~6 mm
             apart), continuous from texel to texel along the body; seen only close up */
          float sF=smoothstep(.3,.75,trk.r)*(1.-smoothstep(.0012,.004,length(fwidth(vSP.xz))));
          if(sF>.01){vec2 tf=fract(tU0/uTrkW.w-.5),t0=(floor(tU0/uTrkW.w-.5)+.5)*uTrkW.w,sg=vec2(0.);
            /* each of the four nearest texels' rows carried on to this point, blended, so rows that meet at a bend merge softly */
            for(int k=0;k<4;k++){vec2 o=vec2(mod(float(k),2.),floor(float(k)/2.)),tc=t0+o*uTrkW.w;vec4 tN=texture2D(uTrk,tc);float bc=floor(tN.b*255.+.5);
              float w=mix(1.-tf.x,tf.x,o.x)*mix(1.-tf.y,tf.y,o.y)*step(.5,bc),rc=step(128.5,bc),th=(bc-1.-128.*rc)/126.*3.14159265;
              vec2 td=vec2(cos(th),sin(th)),pc=uTrkW.xy+(tc-.5)/uTrkW.z;float ph=6.2831853*(tN.a*255./256.+dot(vSP.xz-pc,td)/${RS_SCL});
              sg+=w*td*sin(ph)*mix(.15,.06,rc);}
            sg*=sF*trk.r*(.75+.5*dn2(vSP.xz*90.));normal=normalize(normal+normalMatrix*vec3(-sg.x,0.,-sg.y));}}`)}}
  /* snow: a thin dusting the wind sorts. It lies in the ripple troughs and in the troughs of the coarser ridges (stripes that read
     from afar), on lee and north-facing (shaded) slopes; windward faces and crests stay bare. Sand shows through it, and where it
     thins out or melts it mixes into an ochre-grey slush. Grooves and prints show the dark sand under it. */
  {const f=m.onBeforeCompile;m.onBeforeCompile=sh=>{f(sh);
    sh.fragmentShader=sh.fragmentShader.replace("uniform vec4 uPond;","uniform vec4 uPond;uniform float uSnow,uSnM,uSnP,uMW;uniform vec2 uNorth;float snM=0.;")
      .replace("diffuseColor.rgb=mix(sc,vec3(dot(sc",`if(uSnow+uMW>.003){vec3 nS=normalize(vSN);vec2 q=vSP.xz,d2=vec2(-uRipDir.y,uRipDir.x);float fwS=length(fwidth(q));
          float wd=dot(nS.xz,uRipDir),lee=smoothstep(.0,.2,wd),ww=max(smoothstep(.02,.18,-wd),vDn.x*smoothstep(.0,.07,-wd)),crs=vDn.x*smoothstep(.25,.7,vDn.y),nf=smoothstep(-.02,.2,dot(nS.xz,uNorth));
          float al=dot(q,uRipDir),ac=dot(q,d2),mp=al*2.3+1.6*sin(ac*.21+1.3)+.9*sin(ac*.53+al*.11);
          float trM=mix(smoothstep(.35,-.7,sin(mp+.85*sin(mp))),.45,smoothstep(.1,.4,fwS*2.3)),trF=.45,hn=0.;
          if(fwS<.3){vec2 RW=vec2(dfbm(q*.09)*4.,dfbm(q*.11+7.)*2.5);float am=.5+.5*smoothstep(.28,.62,dn2(q*.21+11.));hn=ripH(q,RW,1.+.3*(dn2(q*.07+1.3)-.5),am)/am;
            trF=mix(smoothstep(.3,-.6,hn*am),.45,smoothstep(.07,.3,fwS));}
          /* the stripes follow the fine ripples (a hand apart); on flat sand the coarse troughs hold more of them than the coarse ridges */
          float kM=mix(.5,.3,vDn.x),kF=mix(.4,.18,vDn.x),nrK=1.-smoothstep(.07,.3,fwS),tr=mix(kM*trM+(1.-kM)*.45,kF*trM+(1.-kF)*trF,nrK),nn=dn2(q*.7+3.1)*.6+dn2(q*2.3)*.4;
          float B0=1.55*lee+.3*nf-1.1*ww-2.4*crs+(nn-.5)*.32-.5*smoothstep(1.35,1.,pn),B=B0+(tr-.5)*1.95,ew=.13+fwS*.5;
          float lv=B+.38*uSnow-.31-wet*1.5-.3*(1.-smoothstep(.0,.25,uSnow));
          /* close up the dusting is not a set of patches but a thin line of grains in the bottom of each ripple trough: the slope,
             shade and coarse troughs only set how much there is, which widens the lines until they merge on the lee face. Up close
             the line breaks into single grains a few millimetres across, packed in its middle and scattered at its edges. */
          float gK=0.,gB=1.;
          if(nrK>.001){float cv=smoothstep(-.65,.45,B0+(kF*trM+(1.-kF)*.45-.5)*1.6+.38*uSnow-.31-wet*1.5-.3*(1.-smoothstep(.0,.25,uSnow)));
            float gr=dn2(q*61.)*.55+dn2(q*23.)*.45,fl=smoothstep(.2,-.32,hn+(gr-.5)*.3+(dn2(q*9.)-.5)*.24-mix(-.96,-.55,cv)-2.4*lee*smoothstep(.4,1.,cv))*smoothstep(.0,.12,cv);
            /* three sizes of grain on turned grids (5 mm grains, 9 mm and 2 cm clumps), each faded to its mean once it is under a pixel */
            float gs=1.,gm=0.;
            for(int o=0;o<3;o++){float fo=float(o),ce=o==0?.0049:o==1?.0088:.018,an=fo*.71+.2,ga=smoothstep(.45*ce,1.4*ce,fwS);
              float fe=clamp(fl*(1.12-.3*fo),0.,1.);vec2 gq=mat2(cos(an),sin(an),-sin(an),cos(an))*q/ce+fo*31.7,gi=floor(gq);
              vec3 p3=fract(vec3(gi.xyx)*.1031);p3+=dot(p3,p3.yzx+33.33);vec3 hh=fract((p3.xxy+p3.yzz)*p3.zyx);
              float r=(.16+.18*fe)*(.75+.5*fract(hh.z*13.1)),gd=length(fract(gq)-.5-(hh.xy-.5)*(1.-2.*r-.1));
              float dt=smoothstep(r+.08,r-.06,gd)*smoothstep(hh.z-.1,hh.z+.1,fe),m=mix(dt,fe*(.35+.25*fe),ga);
              if(dt*(1.-ga)>gm){gm=dt*(1.-ga);gB=.8+.36*fract(hh.z*7.3);}
              gs*=1.-m;}
            /* once even the clumps are under a pixel it is the line as a whole that shows, as wide as it lies */
            float flM=smoothstep(.3,-.24,hn+(gr-.5)*.42+(dn2(q*9.)-.5)*.3-mix(-.95,-.2,cv)-2.1*lee*smoothstep(.4,1.,cv))*smoothstep(.0,.12,cv),gF=smoothstep(.006,.02,fwS);
            float g=1.-gs;gK=smoothstep(.0,.6,gm)*nrK*(1.-gF);
            /* the grain line is only for a true close view. From a few metres the dusting is the whole trough, so ridges stay bare and troughs read white */
            lv=mix(lv,(mix(g,flM,gF)-.5)*2.*ew,nrK*(1.-smoothstep(.007,.02,fwS)));}
          ${TRK?"lv-=1.4*smoothstep(.08,.4,trk.r+.5*trk.g);":""}
          /* melt water soaks into the sand where the snow lay: dark, slightly cool patches that dry back to the sand's own colour */
          if(uMW>.003){float wm=uMW*smoothstep(-ew-.06,ew,B+.38*uSnP-.27-.3*(1.-smoothstep(.0,.25,uSnP)))*(.7+.3*nn);sc*=mix(vec3(1.),vec3(.5,.45,.42),wm);}
          snM=uSnow>.003?smoothstep(-ew,ew,lv)*(.42+.36*smoothstep(.0,.6,uSnow))*(1.-.4*uSnM)*(1.+.2*gK):0.;
          snM*=mix(mix(1.,.3+.95*(dn2(q*61.)*.55+dn2(q*23.)*.45),1.-smoothstep(.006,.03,fwS)),gB,gK);
          vec3 slush=mix(sc,vec3(.58,.56,.53),.5)*vec3(1.,.97,.92);
          vec3 snC=mix(vec3(.85,.88,.93),slush,clamp(uSnM*.75+(1.-smoothstep(-ew,ew*5.,lv-.1))*.5,0.,1.)*.7);
          sc=mix(sc,snC,snM);}
        diffuseColor.rgb=mix(sc,vec3(dot(sc`)
      .replace("float k=uRip*","float k=(1.-.6*snM)*uRip*")}}
  /* hail: white ice stones a centimetre or two across. They bounce and roll off crests and slopes and gather in the ripple troughs,
     the troughs of the coarser ridges and the hollows, where they pile into white pebble drifts; on the crests only a few lie.
     Each strike punches a pit with a thrown-up rim and a faint ring or two round it. Melting stones leave dark wet spots. */
  {const f=m.onBeforeCompile;m.onBeforeCompile=sh=>{f(sh);
    sh.fragmentShader=sh.fragmentShader.replace("uniform vec4 uPond;","uniform vec4 uPond;uniform float uHC,uHP,uHM;float hsM=0.;")
      .replace("diffuseColor.rgb=mix(sc,vec3(dot(sc",`if(uHC+uHP+uHM>.003){vec2 q=vSP.xz,d2=vec2(-uRipDir.y,uRipDir.x);float fwH=length(fwidth(q));vec3 nH=normalize(vSN);
          float al=dot(q,uRipDir),ac=dot(q,d2),mp=al*2.3+1.6*sin(ac*.21+1.3)+.9*sin(ac*.53+al*.11);
          float trM=mix(smoothstep(.35,-.7,sin(mp+.85*sin(mp))),.4,smoothstep(.1,.4,fwH*2.3)),trF=.42;
          if(fwH<.3){vec2 RW=vec2(dfbm(q*.09)*4.,dfbm(q*.11+7.)*2.5);float h=ripH(q,RW,1.+.3*(dn2(q*.07+1.3)-.5),.5+.5*smoothstep(.28,.62,dn2(q*.21+11.)));
            trF=mix(smoothstep(.1,-.55,h),.42,smoothstep(.07,.3,fwH));}
          float flH=smoothstep(.8,.96,nH.y),low=smoothstep(1.6,-.3,vSP.y),gn=dn2(q*1.3+7.)*.6+dn2(q*4.1)*.4;
          float gat=clamp(.62*trF+.38*trM+.3*low+(gn-.5)*.45,0.,1.)*(.25+.75*flH)*(1.-wet)*smoothstep(1.02,1.12,pn);
          float dens=uHC*(.12+1.35*gat*gat);
          float pnr=1.-smoothstep(.004,.02,fwH);
          if(uHM>.003){float wm=uHM*smoothstep(.15,.55,gat*(.7+.6*dn2(q*8.3))+.25*dn2(q*21.))*(1.-wet);sc*=mix(vec3(1.),vec3(.52,.46,.41),wm);}
          if(uHP>.003){vec2 cg=q*6.+3.1,ci=floor(cg),cf=fract(cg)-.5,off=(vec2(dh2(ci+2.3),dh2(ci+6.9))-.5)*.5;
            float ph=dh2(ci+4.7)/max(.2,1.-.8*gat);if(ph<uHP*.32){float rp=.07+.08*pow(dh2(ci+1.1),1.5);vec2 d=cf-off;d*=1.+.25*(dn2(q*37.+ci)-.5);float r=length(d)/rp,age=clamp((uHP*.32-ph)*6.,0.,1.);
              float rg=exp(-(r-1.12)*(r-1.12)/.025),rr2=exp(-(r-1.8)*(r-1.8)/.03)*.3*step(.55,dh2(ci+3.9));
              float dr=(r<1.?2.4*r:0.)-.8*(r-1.12)/.025*rg-.3*(r-1.8)/.03*rr2*(1.-.5*age);
              float px=clamp(fwH*6./rp*1.6-.6,0.,1.),bowl=mix(smoothstep(1.05,.3,r),.4*rp*rp*3.14,px);
              pitG+=d/max(length(d),1e-4)*dr*pnr*.55*(1.-.4*age);
              sc*=(1.-.32*bowl*(1.-.4*age))*(1.+mix(.18*rg+.08*rr2,0.,px)*pnr);}}
          /* two staggered, turned grids of stones so no rows show; each cell holds at most one stone of its own size */
          {float stn=0.,sh2=0.,z=0.,lit=0.,far=smoothstep(.02,.1,fwH*28.);vec2 L2=normalize(uLd.xz+vec2(1e-4)),gS=vec2(0.);
           for(int Ly=0;Ly<2;Ly++){float sc2=Ly==0?24.:33.;mat2 R=Ly==0?mat2(1.,0.,0.,1.):mat2(.8,.6,-.6,.8);vec2 cg=R*q*sc2+float(Ly)*7.7,ci=floor(cg),cf=fract(cg)-.5;
             vec2 off=(vec2(dh2(ci+.7),dh2(ci+3.3))-.5)*.42;float rad=.14+.2*pow(dh2(ci+9.4),1.3);vec2 d=cf-off;
             d*=1.+.18*sin(atan(d.y,d.x)*3.+dh2(ci)*6.);float r=length(d)/rad,ew=.1+fwH*sc2/rad*.7,on=step(dh2(ci+5.5),dens*(Ly==0?.75:.6));
             float s1=on*smoothstep(1.+ew,1.-ew,r);if(s1>stn){stn=s1;z=sqrt(max(0.,1.-r*r));lit=dot(d/rad,R*L2);gS=(d/max(length(d),1e-4))*R;}
             sh2=max(sh2,on*(1.-s1)*smoothstep(1.7,1.05,r)*clamp(-dot(normalize(d+1e-5),R*L2)*1.3+.2,0.,1.));}
           float avg=min(1.,dens*.5)*(.75+.25*gn),drift=smoothstep(.85,1.25,dens);
           hsM=mix(max(stn,drift*(.7+.3*dn2(q*45.))),avg,far);
           sc*=1.-.35*sh2*(1.-far);
           pitG-=gS*stn*(1.-z)*1.6*pnr;
           vec3 ic=mix(vec3(.74,.8,.86),vec3(.93,.95,.97),z)*(1.+.14*lit*(1.-far));
           ic+=vec3(.25)*smoothstep(.55,.9,lit*.8+z*.4)*stn*(1.-far);
           sc=mix(sc,ic,hsM*.9);}}
        diffuseColor.rgb=mix(sc,vec3(dot(sc`)
      .replace("roughnessFactor=mix(roughnessFactor,.64,rWM);","roughnessFactor=mix(mix(roughnessFactor,.64,rWM),.3,hsM*.8);")}}
  m.customProgramCacheKey=()=>TRK?"des70sandTg":"des70sandg";
  return m}
/* shadow caster for the sand: same dune displacement */
const sandDepthM=new T.SM({uniforms:sandU,
  vertexShader:`attribute float aM;${GLSL_DUNE}void main(){vec3 transformed=position;${SAND_DISP}gl_Position=projectionMatrix*modelViewMatrix*vec4(transformed,1.);}`,
  fragmentShader:`#include <packing>
    void main(){gl_FragColor=packDepthToRGBA(gl_FragCoord.z);}`});
let sandMesh=null;
(function buildSand(){
  const pos=[],idx=[];
  pos.push(0,hTop(0,0),0);
  const rs=[];for(let k=1;k<=NSR;k++){const u=k/NSR;rs.push(Math.pow(u,.8))}
  /* the sand stops inside the rock lip and its outer ring tucks under it, so no sand shows in the fissures of the cliff face */
  const nk=rs.length-1;for(let k=0;k<rs.length;k++)rs[k]*=.98;
  for(let k=0;k<rs.length;k++)for(let j=0;j<NT;j++){const th=j/NT*TAU,[x,z]=edgeXZ(th,rs[k]);pos.push(x,hTop(x,z)-(k===nk?.3:0),z)}
  for(let j=0;j<NT;j++)idx.push(0,1+(j+1)%NT,1+j);
  for(let k=0;k<rs.length-1;k++)for(let j=0;j<NT;j++){const a=1+k*NT+j,b=1+k*NT+(j+1)%NT,c=a+NT,d=b+NT;idx.push(a,b,c,b,d,c)}
  const g=new T.BG();g.setAttribute("position",new T.BA(new Float32Array(pos),3));g.setAttribute("aM",new T.BA(new Float32Array(pos.length/3),1));g.setIndex(idx);g.computeVertexNormals();
  sandMesh=new T.Mesh(g,sandMat());sandMesh.receiveShadow=true;sandMesh.castShadow=true;sandMesh.customDepthMaterial=sandDepthM;W.add(sandMesh)})();
/* once everything that rests on the sand is placed: pin the dune mask around it and bake the mask into the sand mesh */
function duneSettle(){
  DOB=OBST.concat(PINS).filter(o=>dZone(o.x,o.z)>0||Math.hypot(o.x-DUNE0.x,o.z-DUNE0.z)<19);
  const P=sandMesh.geometry.attributes.position,A=sandMesh.geometry.attributes.aM;
  for(let i=0;i<P.count;i++)A.setX(i,dMask(P.getX(i),P.getZ(i)));A.needsUpdate=true;bakeMask();
  sandMesh.geometry.computeBoundingSphere();sandMesh.geometry.boundingSphere.radius+=3;DLIVE=true;duneEvolve(0)}

/* sandstone: triplanar painted texture + luminance bump, paled toward the reference's tan/lilac rock */
const rockU={uMap:{value:null},uHas:{value:0},uTint:{value:new C3("#f8e2c4")},uDeep:{value:new C3("#a3836f")},uSc:{value:1/6.5},uNight:{value:0},uWetK:{value:0},
  uT:{value:0},uVen:{value:1},uVenC:{value:new C3("#e3a75e")}};
function rockMat(extra){
  const m=new T.MSM({color:0xffffff,roughness:.95,metalness:0});
  m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,rockU);
    sh.vertexShader=sh.vertexShader.replace("#include <common>","#include <common>\nvarying vec3 vRP;varying vec3 vRN;"+(extra&&extra.ven?"attribute float aV;varying float vV;":""))
      .replace("#include <begin_vertex>",`#include <begin_vertex>
        ${extra&&extra.inst?"vec4 _rp=instanceMatrix*vec4(position,1.);vRP=_rp.xyz;vRN=normalize(mat3(instanceMatrix)*normal);":"vRP=position;vRN=normal;"}${extra&&extra.ven?"vV=aV;":""}`);
    sh.fragmentShader=sh.fragmentShader.replace("#include <common>",`#include <common>
      varying vec3 vRP;varying vec3 vRN;uniform mat3 normalMatrix;uniform sampler2D uMap;uniform float uHas,uSc,uNight,uWetK,uT,uVen;uniform vec3 uTint,uDeep,uVenC;${GLSL_NOISE}
      ${extra&&extra.ven?`varying float vV;
      /* fine sand creeping over the whole rim: it covers the lip and hangs down the top of the wall, further where gullies carry it
         and on ledges, little on overhangs; how far it reaches varies round the rim. Its streaks slide downward. */
      float venA(vec3 nA){vec3 w=pow(abs(nA),vec3(4.));return mix(vRP.z,vRP.x,w.z/(w.x+w.z+1e-3));}
      float gCV=0.;
      /* from afar (a pixel over a few cm of rock) the long narrow tongues down the gullies would be thin bright lines: they draw back */
      float gFar=0.;
      float venC(vec3 nA){float d=vV;if(d>11.6)return 0.;float a=venA(nA),rim=.35+.65*smoothstep(.25,.75,dn2(vRP.xz*.11+1.7)*.7+dn2(vRP.xz*.37+4.1)*.3);
        gFar=smoothstep(.01,.05,length(fwidth(vRP)));
        float tg=dn2(vec2(a*1.6,d*.12))*.65+dn2(vec2(a*4.3,d*.35+3.))*.35,reach=(.8+3.6*rim)*(.55+.9*tg)+4.5*rim*pow(smoothstep(.55,.85,tg),2.)*(1.-.8*gFar);
        float c=1.-smoothstep(reach*.55,reach,d+.4*(dn2(vec2(a*9.,d*1.3))-.5));
        c*=mix(1.,.25,smoothstep(-.15,-.6,nA.y))*mix(1.,1.35,smoothstep(.25,.7,nA.y));return clamp(c*uVen,0.,1.);}`:""}
      float lum(vec3 c){return dot(c,vec3(.3,.55,.15));}
      vec3 rk(vec2 uv){return uHas>.5?texture2D(uMap,uv).rgb:vec3(.75,.55,.35)*(.8+.4*dn2(uv*24.));}`)
      .replace("#include <color_fragment>",`#include <color_fragment>
        vec3 nA=normalize(vRN),wt=pow(abs(nA),vec3(4.));wt/=wt.x+wt.y+wt.z;
        vec3 P=vRP*uSc;
        vec3 tx=rk(P.zy),ty=rk(P.xz+.37),tz=rk(P.xy+.71);
        vec3 tex=tx*wt.x+ty*wt.y+tz*wt.z;
        vec3 P2=vRP*uSc*.31;vec3 tex2=rk(P2.zy+.5)*wt.x+rk(P2.xz)*wt.y+rk(P2.xy+.2)*wt.z;
        tex=mix(tex,tex2,.35);
        float L=lum(tex);
        vec3 c=mix(vec3(L),tex,.6)*uTint*1.2;
        float band=sin(vRP.y*2.1+dn2(vRP.xz*.08)*5.)*.5+.5;
        c*=.9+.12*band;
        /* desert varnish: dark manganese streaks running down the steep faces; pitted grain close up */
        {float vt=1.-smoothstep(.35,.7,abs(nA.y)),hz=mix(vRP.z,vRP.x,wt.z/(wt.x+wt.z+1e-3));
         float vs=smoothstep(.56,.82,dn2(vec2(hz*.9,vRP.y*.07))*.75+dn2(vec2(hz*3.1,vRP.y*.3))*.25);
         c*=mix(vec3(1.),vec3(.58,.47,.40),vs*vt*.55*(1.-smoothstep(-6.,-14.,vRP.y)*.5));
         c*=.88+.24*smoothstep(.2,.6,L);
         float fr=length(fwidth(vRP)),gd=1.-smoothstep(.02,.09,fr);
         c*=1.+gd*((dh2(floor(P.xz*90.+P.y*37.))-.5)*.14+(dn2(P.zy*31.+P.x*7.)-.5)*.12);}
        c=mix(c,c*vec3(.9,.9,1.02),smoothstep(.4,.9,dn2(vec2(vRP.y*.35,0.)+vRP.xz*.02)));
        c=mix(c,uDeep*(.55+.6*L),smoothstep(-3.,-17.,vRP.y)*.55);
        c*=1.-.34*uWetK*(.4+.6*smoothstep(-.2,.6,nA.y))*(1.-smoothstep(-1.,-3.,vRP.y));
        ${extra&&extra.ven?`{float cv=venC(nA);gCV=cv;if(cv>.002){float a=venA(nA),d=vV,sp=.6+.8*uVen;
          float fl=dn2(vec2(a*7.,d*2.2-uT*sp*1.1))*.6+dn2(vec2(a*19.,d*6.-uT*sp*2.4))*.4,gr=dh2(floor(vec2(a*60.,d*60.-uT*sp*14.)));
          vec3 sc=uVenC*(.86+.26*fl)*(1.+.12*(gr-.5))*mix(vec3(1.),vec3(.62,.55,.5),uWetK);
          c=mix(c,sc,smoothstep(0.,.35,cv)*(.55+.45*smoothstep(.3,.9,cv))*(1.-.25*gFar));}}`:""}
        c=mix(c,vec3(dot(c,vec3(.3,.59,.11)))*vec3(.74,.86,1.04),uNight*.68)*mix(1.,.55,uNight);
        diffuseColor.rgb=c;
        #ifdef USE_INSTANCING_COLOR
        diffuseColor.rgb*=vColor;
        #endif`)
      .replace("#include <normal_fragment_maps>",`#include <normal_fragment_maps>
        {vec3 nA2=normalize(vRN),w2=pow(abs(nA2),vec3(4.));w2/=w2.x+w2.y+w2.z;
         vec3 Q=vRP*uSc;float e=1./384.;
         vec2 ux=Q.zy,uy=Q.xz+.37,uz=Q.xy+.71;
         float lx=lum(rk(ux)),ly=lum(rk(uy)),lz=lum(rk(uz));
         vec2 gx=vec2(lum(rk(ux+vec2(e,0.)))-lx,lum(rk(ux+vec2(0.,e)))-lx);
         vec2 gy=vec2(lum(rk(uy+vec2(e,0.)))-ly,lum(rk(uy+vec2(0.,e)))-ly);
         vec2 gz=vec2(lum(rk(uz+vec2(e,0.)))-lz,lum(rk(uz+vec2(0.,e)))-lz);
         vec3 b=w2.x*vec3(0.,gx.y,gx.x)+w2.y*vec3(gy.x,0.,gy.y)+w2.z*vec3(gz.x,gz.y,0.);
         vec3 nL=normalize(nA2-b*${MOB?"9.":"12."});
         ${extra&&extra.ven?"nL=normalize(mix(nL,nA2,smoothstep(0.,.5,gCV)*.85));":""}
         normal=normalize(normalMatrix*nL);}`);
  };
  m.customProgramCacheKey=()=>"des44rock"+(extra&&extra.inst?"i":"")+(extra&&extra.ven?"v":"");
  return m}
const ROCK_M=rockMat({ven:1}),ROCK_MI=rockMat({inst:1});
let rockMesh=null;
/* underside: a rounded, eroded bowl in the sky-series proportion (the sea island's bowl is 6 deep under an 18 wide top,
   1/3): rim to lowest point ~14 m under a ~43 m top. Short crust wall, a few soft ledges, short hanging lobes. */
const islandDepth=th=>11.6+1.1*Math.sin(th*1+.8)+.8*Math.sin(th*2-1.1)+1.2*(fbm2(Math.cos(th)*2.1+5,Math.sin(th)*2.1)-.5);
const KEEL_TIP={x:-.6,z:.7},KEEL_STEPS=4;
(function buildRock(){
  const rows=[];
  /* each row: [s, yFn(th,x,z,edgeY), wall/underside weight, t(depth fraction)] */
  rows.push({s:.968,dy:-.25,lip:0});
  rows.push({s:.986,dy:.32,lip:1});
  rows.push({s:1.002,dy:.12,lip:.6});
  const TW=4;for(let k=1;k<=TW;k++)rows.push({s:1.004,wall:k/TW});
  const NU=MOB?40:64;for(let k=1;k<=NU;k++)rows.push({u:k/NU});
  const nR=rows.length,pos=new Float32Array(nR*NT*3),aV=new Float32Array(nR*NT+1),idx=[];
  const Dc=12.4;
  for(let j=0;j<NT;j++){
    const th=j/NT*TAU,[ex,ez]=edgeXZ(th,1),eY=hTop(ex,ez),tw=1.5+1.1*fbm2(Math.cos(th)*3+1,Math.sin(th)*3),D=islandDepth(th);
    const ox=Math.cos(Math.atan2(ez/AZ,ex/AX)),oz=Math.sin(Math.atan2(ez/AZ,ex/AX));
    /* per-angle ledge phase + a few hanging chunks (narrow angular sectors that drop deeper, still part of the mass) */
    const lph=.55*(fbm2(Math.cos(th)*2.4+3,Math.sin(th)*2.4-1)-.5)+.25*(vn2(th*6.3,4.1)-.5);
    const hang=Math.pow(Math.max(0,vn2(th*5.2+1.3,.7)*2-1),1.6)*1.8+Math.pow(Math.max(0,vn2(th*11.7+7,2.9)*2-1),2.5)*1.1;
    for(let r=0;r<nR;r++){
      const R=rows[r];let x,z,y,disp=0;
      if(R.u==null&&R.wall==null){[x,z]=edgeXZ(th,R.s);const ln=fbm2(x*.35,z*.35);y=eY+R.dy*(R.lip?(.5+1.1*ln):1)+(R.lip?.25*(ln-.5):0)}
      else{
        let rf,yy;
        if(R.wall!=null){rf=1.004-.02*R.wall;yy=eY+.12-(tw+.12)*R.wall}
        else{const t=R.u,Dd=mix(D+hang*.6,Dc,ss(.82,1,t));
          /* stair-stepped taper: each band is a near-vertical face, then a flat-ish ledge cutting inward */
          const tj=t*KEEL_STEPS+lph+.45,li=Math.floor(tj),fj=tj-li,ts=cl((li+ss(.62,.96,fj))/KEEL_STEPS,0,1);
          const prof=u=>Math.pow(Math.max(0,1-Math.pow(u,2.1)),.6);
          rf=(.3*prof(ts)+.7*prof(t))*(1.004-.02);
          yy=eY+.12-tw-(Dd-tw)*Math.pow(t,1.06)-hang*ss(.35,.85,t)*(1-ss(.9,1,t))}
        [x,z]=edgeXZ(th,rf);y=yy;
        if(R.u!=null){const tt=ss(.15,1,R.u);x+=KEEL_TIP.x*tt;z+=KEEL_TIP.z*tt}
        const wgt=R.wall!=null?1:(1-ss(.85,1,R.u))*(.55+.45*ss(0,.3,R.u));
        const arc=th*34;
        const st=(y+3.2*(fbm2(x*.05+2,z*.05)-.5))/1.9,li=Math.floor(st),f=st-li;
        const ledge=((f<.12?f/.12:1-(f-.12)/.88)*.9-.4)*(.35+.9*hs2(li*1.7,Math.floor(arc/9)));
        const bk=hs2(Math.floor(arc/3.1+.6*vn2(y*.3,th)),li)-.5;
        const crag=(fbm3(x*.11,y*.13,z*.11)-.5)*2.6+(fbm3(x*.3+4,y*.28,z*.3)-.5)*1.1;
        const fis=-1.1*Math.pow(1-Math.abs(2*vn2(arc/2.4,y*.05+th)-1),5);
        disp=(ledge+bk*.9+crag+fis)*wgt*.8;
        /* just under the lip a fissure may not cut in behind the sand's edge */
        if(R.wall!=null)disp=Math.max(disp,-(.25+.9*R.wall));
        if(R.u!=null)y+=(fbm3(x*.09+1,y*.05,z*.09)-.5)*2.2*ss(.1,.6,R.u)*(1-ss(.85,1,R.u))}
      x+=ox*disp;z+=oz*disp;
      const o=(r*NT+j)*3;pos[o]=x;pos[o+1]=y;pos[o+2]=z;aV[r*NT+j]=eY-y}}
  for(let r=0;r<nR-1;r++)for(let j=0;j<NT;j++){const a=r*NT+j,b=r*NT+(j+1)%NT,c=a+NT,d=b+NT;idx.push(a,b,c,b,d,c)}
  /* close the tip */
  const tip=nR*NT,last=(nR-1)*NT;let sx=0,sy=0,sz=0;for(let j=0;j<NT;j++){sx+=pos[(last+j)*3];sy+=pos[(last+j)*3+1];sz+=pos[(last+j)*3+2]}
  const P=new Float32Array(pos.length+3);P.set(pos);P[tip*3]=sx/NT;P[tip*3+1]=sy/NT-.6;P[tip*3+2]=sz/NT;
  for(let j=0;j<NT;j++)idx.push(last+j,last+(j+1)%NT,tip);
  aV[tip]=40;
  const g=new T.BG();g.setAttribute("position",new T.BA(P,3));g.setAttribute("aV",new T.BA(aV,1));g.setIndex(idx);g.computeVertexNormals();
  rockMesh=new T.Mesh(g,ROCK_M);rockMesh.castShadow=true;rockMesh.receiveShadow=true;W.add(rockMesh)})();
loadTex("assets/tex/sandstone.jpg").then(t=>{rockU.uMap.value=t;rockU.uHas.value=1}).catch(()=>{});

/* obstacles for placement + animal navigation: {x,z,r} discs in island metres */
const OBST=[];
const addOb=(x,z,r,k)=>{OBST.push({x,z,r,k:k||""})};
function clearOf(x,z,pad,skip){for(const o of OBST){if(skip&&o.k===skip)continue;if(Math.hypot(x-o.x,z-o.z)<o.r+pad)return false}return true}
for(const p of PALMS){addOb(p.x,p.z,.9,"palm")}
for(const s of SAG){addOb(s.x,s.z,s.r,"sag")}
for(const c of CACTI){addOb(c.x,c.z,c.r,"cactus")}
for(const b of BARRELS){addOb(b.x,b.z,.42*b.s+.12,"cactus")}
for(let k=-1;k<=1;k++)addOb(TENT.x+Math.cos(TENT.yaw)*k*2.1,TENT.z-Math.sin(TENT.yaw)*k*2.1,2.35,"tent");
addOb(FIRE.x,FIRE.z,1.1,"fire");
addOb(RACK.x+Math.cos(RACK.yaw)*1.6,RACK.z-Math.sin(RACK.yaw)*1.6,.7,"rack");addOb(RACK.x-Math.cos(RACK.yaw)*1.6,RACK.z+Math.sin(RACK.yaw)*1.6,.7,"rack");

/* ---------------- shared geometry helpers ---------------- */
function icoSphere(det){
  const t=(1+Math.sqrt(5))/2;let v=[[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]].map(p=>{const l=Math.hypot(...p);return p.map(c=>c/l)});
  let f=[[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
  for(let d=0;d<det;d++){const cache={},nf=[];const mid=(a,b)=>{const k=a<b?a+"_"+b:b+"_"+a;if(cache[k]!=null)return cache[k];const p=[(v[a][0]+v[b][0])/2,(v[a][1]+v[b][1])/2,(v[a][2]+v[b][2])/2],l=Math.hypot(...p);v.push(p.map(c=>c/l));return cache[k]=v.length-1};
    for(const[a,b,c]of f){const ab=mid(a,b),bc=mid(b,c),ca=mid(c,a);nf.push([a,ab,ca],[b,bc,ab],[c,ca,bc],[ab,bc,ca])}f=nf}
  return{v,f}}
function geoFrom(v,f,cols){const g=new T.BG();g.setAttribute("position",new T.BA(new Float32Array(v.flat()),3));if(cols)g.setAttribute("color",new T.BA(new Float32Array(cols.flat()),3));g.setIndex(f.flat());g.computeVertexNormals();return g}

/* boulders: faceted, flattened, sunk a little into the sand */
const ROCK_GEOS=[0,1,2,3].map(k=>{
  const{v,f}=icoSphere(3),pl=[];for(let i=0;i<7;i++){const a=rr(0,TAU),b=rr(-.6,1.1);pl.push([Math.cos(a)*Math.cos(b),Math.sin(b),Math.sin(a)*Math.cos(b),rr(.55,.82)])}
  const fl=[.62,.5,.72,.42][k];
  const vv=v.map(p=>{let[x,y,z]=p;const n=1+.42*(fbm3(x*1.2+k*5,y*1.2,z*1.2)-.5)+.14*(fbm3(x*3.4,y*3.4+k,z*3.4)-.5);x*=n;y*=n;z*=n;
    for(const q of pl){const d=x*q[0]+y*q[1]+z*q[2];if(d>q[3]){x-=(d-q[3])*q[0];y-=(d-q[3])*q[1];z-=(d-q[3])*q[2]}}
    return[x,y*fl+.12,z]});
  return geoFrom(vv,f)});
const rockInst=[];
function placeRocks(list){
  const per=ROCK_GEOS.map(()=>[]);list.forEach((r,i)=>per[i%4].push(r));
  per.forEach((arr,k)=>{if(!arr.length)return;const im=new T.IM(ROCK_GEOS[k],ROCK_MI,arr.length);const m=new T.M4(),q=new T.Quat(),e=new T.V3();
    arr.forEach((r,i)=>{q.setFromAxisAngle(new V3(0,1,0),r.ry);const y=hTop(r.x,r.z)-r.s*.18;m.compose(new V3(r.x,y,r.z),q,new V3(r.s*r.sx,r.s,r.s*r.sz));im.setMatrixAt(i,m)});
    im.castShadow=true;im.receiveShadow=true;im.instanceMatrix.needsUpdate=true;W.add(im);rockInst.push(im)})}

/* ---------------- oasis pond: sea-style water, depth tint, sky fresnel, palm reflection, sun glint ---------------- */
const pondU={uT:{value:0},uCamL:{value:new V3()},uSunL:{value:new V3(0,1,0)},uSunCol:{value:new C3("#ffb469")},
  uDeep:{value:new C3("#0a2c2b")},uShal:{value:new C3("#2c6a5c")},uBed:{value:new C3("#a8875a")},uSkyA:{value:new C3("#c9a6c4")},uSkyB:{value:new C3("#6f6aa8")},
  uRefl:{value:null},uReflM:{value:new T.M4()},uReflOn:{value:0},uNight:{value:0},uWind:{value:.35},uRainP:{value:0},uIce:{value:0},uFogC:{value:new C3()},uFogNF:{value:new T.V2(400,900)}};
let pondMesh=null;
(function buildPond(){
  const NR=26,NA=96,pos=[],dep=[],idx=[];
  pos.push(POND.x,POND.wy,POND.z);dep.push(Math.max(0,POND.wy-hTop(POND.x,POND.z)));
  for(let k=1;k<=NR;k++){const s=k/NR*1.06;for(let j=0;j<NA;j++){const th=j/NA*TAU,[x,z]=pondEdge(th,s);pos.push(x,POND.wy,z);dep.push(POND.wy-hTop(x,z))}}
  for(let j=0;j<NA;j++)idx.push(0,1+(j+1)%NA,1+j);
  for(let k=0;k<NR-1;k++)for(let j=0;j<NA;j++){const a=1+k*NA+j,b=1+k*NA+(j+1)%NA,c=a+NA,d=b+NA;idx.push(a,b,c,b,d,c)}
  const g=new T.BG();g.setAttribute("position",new T.BA(new Float32Array(pos),3));g.setAttribute("aD",new T.BA(new Float32Array(dep),1));g.setIndex(idx);
  const m=new T.SM({uniforms:pondU,transparent:true,depthWrite:false,
    vertexShader:`attribute float aD;varying float vD;varying vec3 vP;varying vec4 vR;uniform mat4 uReflM;
      void main(){vD=aD;vP=position;vec4 w=modelMatrix*vec4(position,1.);vR=uReflM*w;gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader:`uniform float uT,uReflOn,uNight,uWind,uRainP,uIce;uniform vec2 uFogNF;uniform vec3 uCamL,uSunL,uSunCol,uDeep,uShal,uBed,uSkyA,uSkyB,uFogC;uniform sampler2D uRefl;varying float vD;varying vec3 vP;varying vec4 vR;${GLSL_NOISE}
      /* raindrop rings: each cell rings once per cycle, two offset layers so the rings overlap */
      vec2 ringG(vec2 p){vec2 g=vec2(0.);for(int L=0;L<2;L++){vec2 q=p*(L==0?2.6:3.7)+float(L)*7.31;vec2 c=floor(q),f=fract(q)-.5;float h=dh2(c+float(L)*3.1);
        vec2 o=(vec2(dh2(c+1.3),dh2(c+2.7))-.5)*.5;vec2 d=f-o;float r=length(d),ph=fract(uT*(.9+.6*h)+h*7.),rad=ph*.42;
        float w=-2.*(r-rad)/.0016*exp(-(r-rad)*(r-rad)/.0016)*(1.-ph)*(1.-ph)*step(h,uRainP*1.15);g+=d/max(r,1e-3)*w*.012;}return g;}
      float wv(vec2 p){return dn2(p*1.1+vec2(uT*.35,uT*.12))*.6+dn2(p*2.7-vec2(uT*.22,-uT*.4))*.3+dn2(p*6.3+vec2(uT*.6,uT*.3))*.1;}
      void main(){
        float e=.06,h0=wv(vP.xz);vec2 g=vec2(wv(vP.xz+vec2(e,0.))-h0,wv(vP.xz+vec2(0.,e))-h0)/e;
        float amp=.022+.07*uWind;vec3 n=normalize(vec3(-g.x*amp,1.,-g.y*amp));
        if(uRainP>.003){vec2 rg=ringG(vP.xz);n=normalize(n+vec3(rg.x,0.,rg.y)*smoothstep(.0,.1,vD));
          /* between the rings the surface is roughened by the drops all over it */
          float fr2=1.-smoothstep(.006,.025,length(fwidth(vP.xz))),r0=dn2(vP.xz*75.+uT*3.1),rx=dn2(vP.xz*75.+vec2(1.6,0.)+uT*3.1),rz=dn2(vP.xz*75.+vec2(0.,1.6)+uT*3.1);
          n=normalize(n+vec3(r0-rx,0.,r0-rz)*.22*uRainP*fr2);}
        vec3 V=normalize(uCamL-vP);
        float fr=.02+.98*pow(1.-max(dot(n,V),0.),5.);
        /* oasis water: clear over the sand bed at the margin, absorbing to a deep green-teal in the middle */
        float dd=smoothstep(.02,1.3,vD);
        vec3 body=mix(uShal,uDeep,dd);
        vec3 bed=uBed*exp(-vD*vec3(2.6,1.15,1.05)*3.)*(.8+.2*dn2(vP.xz*3.+uT*.05));
        body=mix(bed,body,smoothstep(.0,.45,vD))*mix(1.,.28,uNight);
        vec3 rd=reflect(-V,n);
        vec3 sky=mix(uSkyA,uSkyB,smoothstep(.0,.8,rd.y));
        vec3 refl=sky;
        /* from the usual distance single rings are below a pixel: the drops show as a matte, broken sheen with splashes winking on it */
        float rFar=uRainP*smoothstep(.006,.03,length(fwidth(vP.xz)));
        vec2 rJ=(vec2(dn2(vP.xz*14.+uT*2.3),dn2(vP.xz*14.+vec2(5.2,1.7)-uT*2.1))-.5)*.05*rFar;
        if(uReflOn>.5){vec2 ruv=vR.xy/vR.w+n.xz*.016+rJ;vec4 rc=texture2D(uRefl,clamp(ruv,0.,1.));
          rc=(any(isnan(rc))||any(isinf(rc)))?vec4(0.):clamp(rc,0.,1.);refl=mix(refl,rc.rgb*.7,rc.a*.92);}
        vec3 c=mix(body,refl,clamp(fr*1.05+.12,0.,.92));
        if(rFar>.001){c=mix(c,mix(uSkyA,uSkyB,.5)*.7+body*.3,.24*rFar);
          vec2 sc=floor(vP.xz*16.);float sk=step(.965-.04*uRainP,dh2(sc+floor(uT*6.+dh2(sc+4.1)*6.)*.37));c+=sk*.1*rFar*(1.-.6*uNight);}
        /* a faint darker band where the water meets the shore, and fine wind-roughened sparkle */
        c*=1.-.18*(1.-smoothstep(.0,.12,vD));
        float gl=pow(max(dot(rd,uSunL),0.),220.)*(1.-uNight),sp=pow(max(dot(rd,uSunL),0.),36.)*smoothstep(.55,.85,dn2(vP.xz*9.+uT*1.3))*(1.-uNight);
        c+=uSunCol*(gl*2.2+sp*.6);
        float a=smoothstep(0.,.05,vD);
        /* after a freezing night a skin of ice rims the shallows: grey-white, matte, cracked, never across the open water */
        if(uIce>.003){float ie=.02+.12*uIce+.07*(dn2(vP.xz*1.3)-.5)+.03*(dn2(vP.xz*4.1)-.5),ik=(1.-smoothstep(ie-.025,ie+.005,vD))*smoothstep(0.,.006,vD)*smoothstep(.25,.5,dn2(vP.xz*.9+4.)+.45*uIce);
          float crk=1.-smoothstep(.0,.025,min(abs(dn2(vP.xz*7.)-.5),1.3*abs(dn2(vP.xz*19.+3.)-.5)));
          vec3 ic=mix(vec3(.6,.66,.72),vec3(.82,.86,.9),.3+.5*dn2(vP.xz*5.)*smoothstep(.0,ie,ie-vD+.02))*mix(1.,.35,uNight)+uSunCol*.05*(1.-uNight);
          ic=mix(mix(ic,refl*.9,.35),ic*1.15,crk*.5);c=mix(c,ic,ik*.5);a=max(a,ik*.7);}
        c=mix(c,uFogC,smoothstep(uFogNF.x,uFogNF.y,length(uCamL-vP)*${S.toFixed(3)}));
        gl_FragColor=vec4(c,a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`});
  pondMesh=new T.Mesh(g,m);pondMesh.renderOrder=2;W.add(pondMesh)})();
const pondRefl={rt:null,cam:null,bias:new T.M4().set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),cc:new C3(),frame:0};
const reflSet=[];
function renderPondReflection(){
  if(!pondMesh||!Cn||st.night>.5||!_stageDone||st.qaNoRefl){pondU.uReflOn.value=0;return}
  if(MOB&&(pondRefl.frame++&1))return;
  if(!pondRefl.rt){const RT=bloom&&bloom.renderTargetsHorizontal&&bloom.renderTargetsHorizontal[0]&&bloom.renderTargetsHorizontal[0].constructor;if(!RT)return;
    pondRefl.rt=new RT(MOB?256:512,MOB?160:320);pondRefl.cam=De.clone();pondRefl.cam.layers.set(PALM_LAYER);pondU.uRefl.value=pondRefl.rt.texture}
  [pi,dc].forEach(l=>{if(l)l.layers.enable(PALM_LAYER)});
  /* the reflection pass needs its own build of every reflected shader: one more object joins it per frame */
  for(const o of reflSet)if(!o.userData._rl){o.userData._rl=1;const on=()=>o.traverse(c=>c.layers.enable(PALM_LAYER));if(PAR)warm(o,pondRefl.rt,pondRefl.cam).then(on);else{on();break}}
  const Wy=W.position.y+POND.wy*S,c=pondRefl.cam;De.updateMatrixWorld();
  const e=De.matrixWorld.elements,cp=De.position;
  c.fov=De.fov;c.aspect=De.aspect;c.near=De.near;c.far=De.far;c.updateProjectionMatrix();
  c.position.set(cp.x,2*Wy-cp.y,cp.z);c.up.set(e[4],-e[5],e[6]);
  c.lookAt(cp.x-e[8]*10,2*Wy-(cp.y-e[9]*10),cp.z-e[10]*10);c.updateMatrixWorld();
  pondU.uReflM.value.copy(pondRefl.bias).multiply(c.projectionMatrix).multiply(c.matrixWorldInverse);
  const prevT=Cn.getRenderTarget(),prevA=Cn.getClearAlpha(),sAuto=Cn.shadowMap.autoUpdate,sNeed=Cn.shadowMap.needsUpdate;Cn.getClearColor(pondRefl.cc);
  Cn.shadowMap.autoUpdate=false;Cn.shadowMap.needsUpdate=false;Cn.setRenderTarget(pondRefl.rt);Cn.setClearColor(0x000000,0);Cn.clear();Cn.render(Jt,c);
  Cn.setRenderTarget(prevT);Cn.setClearColor(pondRefl.cc,prevA);Cn.shadowMap.autoUpdate=sAuto;Cn.shadowMap.needsUpdate=sNeed;pondU.uReflOn.value=1}

/* ---------------- vegetation: grass tufts, reeds, shrubs ---------------- */
const vegU={uT:{value:0},uWind:{value:.35},uGT:sandU.uGT,uWD:sandU.uWD};
function vegMat(opt){
  const m=new T.MSM({vertexColors:true,roughness:.88,metalness:0,side:2});
  m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,vegU);
    sh.vertexShader=sh.vertexShader.replace("#include <common>","#include <common>\nuniform float uT,uWind;"+GLSL_GUST)
      .replace("#include <begin_vertex>",`#include <begin_vertex>
        {vec3 ip=vec3(0.);
         #ifdef USE_INSTANCING
         ip=instanceMatrix[3].xyz;
         #endif
         float h=max(position.y,0.);float ph=ip.x*.37+ip.z*.61;
         float sw=(sin(uT*1.9+ph)*.6+sin(uT*3.3+ph*1.7)*.25+.35)*uWind*(.5+.9*gustF(ip.xz))*${opt.sway.toFixed(3)};
         transformed.x+=sw*h*h;transformed.z+=sw*.35*h*h;}`)
      .replace("#include <beginnormal_vertex>","vec3 objectNormal=normalize(mix(normal,vec3(0.,1.,0.),"+opt.up.toFixed(2)+"));\n#ifdef USE_TANGENT\nvec3 objectTangent=vec3(tangent.xyz);\n#endif");
  };
  m.customProgramCacheKey=()=>"des45veg"+opt.sway+opt.up;return m}
/* a tuft is 2–4 offset sub-clumps leaning mostly one way, with uneven blade lengths, so it never reads as a ball */
function tuftGeo(nb,lean,wid,c0,c1,seed){
  const pos=[],col=[],idx=[];sd=seed;
  const nc=2+Math.floor(rnd()*3),bias=rnd()*TAU,subs=[];for(let k=0;k<nc;k++){const a=rnd()*TAU,r=rr(.04,.24);subs.push([Math.cos(a)*r,Math.sin(a)*r,rr(.55,1)])}
  for(let b=0;b<nb;b++){const sb=subs[b%nc],a=rnd()<.6?bias+rr(-1.1,1.1):rnd()*TAU,ln=rr(lean[0],lean[1])*rr(.6,1.15),hh=sb[2]*rr(.45,1)*(rnd()<.15?1.25:1),w=wid*rr(.5,1),seg=4,base=pos.length/3;
    const dx=Math.cos(a),dz=Math.sin(a),px=-dz,pz=dx,ox=sb[0]*hh,oz=sb[1]*hh;
    for(let i=0;i<=seg;i++){const u=i/seg,bend=ln*u*u*1.3+ln*.3*u,y=hh*u*(1-.15*bend),r=bend*hh*.55+.02,ww=w*(1-u*.92);
      const cx=ox+dx*r,cz=oz+dz*r;pos.push(cx-px*ww,y,cz-pz*ww,cx+px*ww,y,cz+pz*ww);
      const k=Math.pow(u,.8),cc=[c0[0]+(c1[0]-c0[0])*k,c0[1]+(c1[1]-c0[1])*k,c0[2]+(c1[2]-c0[2])*k];col.push(...cc,...cc);
      if(i<seg){const o=base+i*2;idx.push(o,o+1,o+2,o+1,o+3,o+2)}}}
  const g=new T.BG();g.setAttribute("position",new T.BA(new Float32Array(pos),3));g.setAttribute("color",new T.BA(new Float32Array(col),3));g.setIndex(idx);g.computeVertexNormals();return g}
const lin=h=>{const c=new C3(h);return[c.r,c.g,c.b]};
const VEG=[];
/* where the green is thickest (reed beds, grass clumps, shrubs): the fireflies keep to it at night */
const VEGP=[];
/* per-instance tint (multiplies the vertex colours) so no two clumps share a hue */
const TINTS=[[1,1,1],[1.04,.98,.8],[.86,.94,.9],[.92,.86,.7],[.96,1.,.88],[.78,.84,.72]];
function scatter(geo,mat,list){const im=new T.IM(geo,mat,list.length),m=new T.M4(),q=new T.Quat(),c=new C3();
  list.forEach((p,i)=>{q.setFromAxisAngle(new V3(0,1,0),p.ry);m.compose(new V3(p.x,hTop(p.x,p.z)-.04,p.z),q,new V3(p.s,p.h,p.s*(p.sz||1)));im.setMatrixAt(i,m);
    const t=TINTS[p.tint!=null?p.tint:Math.floor(rnd()*TINTS.length)],j=p.j||rr(.85,1.12);im.setColorAt(i,c.setRGB(t[0]*j,t[1]*j,t[2]*j))});
  im.castShadow=true;im.receiveShadow=true;im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;W.add(im);VEG.push(im);return im}
(function plantOasis(){
  /* three shape variants per kind; olive and sage rather than spring green */
  const V3G=(nb,ln,w,a,b,sd0)=>[0,1,2].map(k=>tuftGeo(nb,ln,w,lin(a),lin(b),sd0*7+k*101));
  const grassG=V3G(13,[.25,.8],.02,"#2a4419","#7f9a4c",11),dryG=V3G(9,[.35,.9],.016,"#5e5030","#b09a62",12);
  const reedG=V3G(7,[.02,.16],.014,"#34441f","#7f8a48",13),clumpG=V3G(28,[.2,1.],.019,"#243c16","#748c48",14);
  /* desert shrubs: splayed, twiggy, sage-to-olive — same blade system, more blades and a wider, lopsided fan */
  const shrubG=[V3G(44,[.55,1.3],.021,"#2e3c1c","#748450",15),V3G(34,[.7,1.4],.019,"#433f24","#948a5c",16)];
  const gm=vegMat({sway:.07,up:.65}),rm=vegMat({sway:.05,up:.5}),sm=vegMat({sway:.025,up:.55});
  const L=[],C=[],D=[],R=[],SH=[[],[]];const N=MOB?0.55:1;
  const okW=(x,z)=>hTop(x,z)>=POND.wy+.04&&sN(x,z)<.93;
  /* waterline: dense, uneven clumps that thin out with distance from the water */
  for(let c=0;c<Math.round(60*N);c++){const th=c/Math.round(60*N)*TAU+rr(-.06,.06);if(beachGap(th)<.28)continue;
    /* density drifts around the shore: thick stands, thin stretches and a few bare gaps */
    const dens=.5+.5*Math.sin(th*2.3+1.1)*Math.sin(th*1.3+.4);if(dens<.12)continue;
    const k0=1+Math.pow(rnd(),1.6)*.3,[cx,cz]=pondEdge(th,k0),rad=rr(.45,1.4),n=Math.round(rr(4,16)*dens),tint=Math.floor(rnd()*TINTS.length);
    for(let i=0;i<n;i++){const a=rnd()*TAU,r=Math.sqrt(rnd())*rad,x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r;if(!okW(x,z))continue;const near=1-ss(1,1.6,pN(x,z));
      (rnd()<.35?C:L).push({x,z,ry:rnd()*TAU,s:rr(.7,1.35),h:rr(.3,.55)+.45*near*rr(.5,1),tint:rnd()<.7?tint:undefined})}}
  /* sparse fill between clumps so the ring reads continuous but not mown */
  for(let i=0;i<Math.round(190*N);i++){const th=rnd()*TAU,k=1+Math.pow(rnd(),2.2)*.9,[x,z]=pondEdge(th,k);if((beachGap(th)<.3&&k<1.5)||!okW(x,z)||rnd()>.35+.65*(.5+.5*Math.sin(th*2.3+1.1)*Math.sin(th*1.3+.4)))continue;
    L.push({x:x+rr(-.3,.3),z:z+rr(-.3,.3),ry:rnd()*TAU,s:rr(.6,1.1),h:rr(.2,.45)})}
  /* patches under the palms */
  PALMS.forEach((p,pi_)=>{for(let c=0;c<2+pi_%2;c++){const a=rnd()*TAU,r=rr(.8,3.4),cx=p.x+Math.cos(a)*r,cz=p.z+Math.sin(a)*r,n=Math.round(rr(4,12)*N);
    for(let i=0;i<n;i++){const b=rnd()*TAU,q=Math.sqrt(rnd())*rr(.6,1.3),x=cx+Math.cos(b)*q,z=cz+Math.sin(b)*q;if(pN(x,z)<1.02||!okW(x,z))continue;(rnd()<.3?C:L).push({x,z,ry:rnd()*TAU,s:rr(.7,1.2),h:rr(.28,.62)})}}});
  /* dry tufts in the open sand: small groups, never on the dune face */
  for(let c=0;c<Math.round(26*N);c++){let x0,z0,ok=0;for(let t=0;t<20&&!ok;t++){const a=rnd()*TAU,r=Math.sqrt(rnd())*.86;[x0,z0]=edgeXZ(a,r);ok=pN(x0,z0)>2.3&&clearOf(x0,z0,1)&&duneH(x0,z0)<.5}
    if(!ok)continue;const n=Math.round(rr(1,4));for(let i=0;i<n;i++)D.push({x:x0+rr(-.7,.7),z:z0+rr(-.7,.7),ry:rnd()*TAU,s:rr(.55,1.15),h:rr(.18,.45)});PINS.push({x:x0,z:z0,r:.9})}
  for(let c=0;c<16;c++){const th=c/16*TAU+rr(-.15,.15);if((Math.sin(th)>.55&&c%2)||beachGap(th)<.45||rnd()<.3)continue;const[x0,z0]=pondEdge(th,rr(.93,1.01));
    for(let i=0;i<rr(3,9);i++)R.push({x:x0+rr(-.6,.6),z:z0+rr(-.6,.6),ry:rnd()*TAU,s:rr(.9,1.3),h:rr(1.,2.1)})}
  /* few, irregular shrubs: back of the pond and under the palms; two weathered ones out on the sand */
  const shrub=(x,z,s,h,v)=>{if(pN(x,z)<1.15||!clearOf(x,z,s*.5))return;SH[v].push({x,z,s,h,sz:rr(.7,1.15),ry:rnd()*TAU});addOb(x,z,s*.45,"shrub")};
  [[3.7,1.38,1.4,.95],[4.45,1.3,1.8,1.15],[5.4,1.33,1.2,.8],[2.2,1.48,1.,.7]].forEach(([th,k,s,h],i)=>{const[x,z]=pondEdge(th,k);shrub(x,z,s,h,i%2)});
  PALMS.forEach((p,i)=>{if(i===1)return;const a=1.3+i*2.1,r=rr(1.8,2.8);shrub(p.x+Math.cos(a)*r,p.z+Math.sin(a)*r,rr(1.1,1.7),rr(.75,1.15),0)});
  shrub(-16.5,-9,.8,.55,1);shrub(12.5,7.4,.7,.5,1);
  for(const p of R)VEGP.push({x:p.x,z:p.z,h:p.h*.8,w:1.3});for(const p of C)VEGP.push({x:p.x,z:p.z,h:p.h,w:1});
  for(const l of SH)for(const p of l)VEGP.push({x:p.x,z:p.z,h:p.h,w:2.2});
  const scatterV=(gs,m,l)=>gs.forEach((g,k)=>scatter(g,m,l.filter((_,i)=>i%gs.length===k)));
  scatterV(grassG,gm,L);scatterV(clumpG,gm,C);scatterV(dryG,gm,D);scatterV(reedG,rm,R);scatterV(shrubG[0],sm,SH[0]);scatterV(shrubG[1],sm,SH[1]);
})();
/* ---------------- rim boulders + scattered stones (0.3–2 m) ---------------- */
(function rocks(){
  const L=[];
  const put=(x,z,s)=>{if(pN(x,z)<1.5||!clearOf(x,z,s*.6+.3))return false;L.push({x,z,s,sx:rr(.8,1.3),sz:rr(.8,1.25),ry:rnd()*TAU});addOb(x,z,s*.75,"rock");return true};
  /* clusters along the rim: a big one with satellites */
  for(let c=0;c<11;c++){const th=c/11*TAU+rr(-.2,.2),[x,z]=edgeXZ(th,rr(.91,.95));if(duneH(x,z)>.35)continue;const big=rnd()<.3?rr(.75,1.1):rr(.4,.7);
    if(!put(x,z,big))continue;for(let k=0;k<rr(0,2.6);k++){const a=rnd()*TAU,r=big*rr(.9,1.6);put(x+Math.cos(a)*r,z+Math.sin(a)*r,rr(.25,.4))}}
  /* front cluster (reference: just right of the pond, near the front rim) */
  [[.8,13.4,1.1],[2.1,14.1,.55],[-.4,14.3,.4],[1.6,12.3,.3]].forEach(([x,z,s])=>put(x,z,s));
  [[9.5,-15.6,.8],[-14.5,-13,.7],[18.4,4.2,.6],[-21.2,2.3,.55]].forEach(([x,z,s])=>put(x,z,s));
  for(let i=0;i<7;i++){const a=rnd()*TAU,r=Math.sqrt(rnd())*.85,[x,z]=edgeXZ(a,r);if(duneH(x,z)>.5)continue;put(x,z,rr(.22,.38))}
  placeRocks(L)})();
duneSettle();
/* the pavement's loose pebbles (2-9 cm), denser toward each patch's middle; a seed of their own keeps the rest of the layout */
(function pebbles(){let ps=917;const pr=()=>{ps=ps+0x6D2B79F5|0;let t=Math.imul(ps^ps>>>15,1|ps);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
  const{v,f}=icoSphere(1),g=geoFrom(v.map(p=>{const n=1+.5*(fbm3(p[0]*1.7+4,p[1]*1.7,p[2]*1.7)-.5);return[p[0]*n,p[1]*n*.5+.16,p[2]*n]}),f);
  const L=[];for(const G of GRV){const n=Math.round((MOB?60:120)*G.r/2.2);
    for(let i=0;i<n;i++){const a=pr()*TAU,q=G.r*.95*Math.pow(pr(),.75),x=G.x+Math.cos(a)*q,z=G.z+Math.sin(a)*q;if(pN(x,z)<1.3)continue;
      L.push({x,z,s:.02+.07*Math.pow(pr(),2.2),ry:pr()*TAU,tl:(pr()-.5)*.5,c:pr()})}}
  const im=new T.IM(g,ROCK_MI,L.length),m=new T.M4(),q=new T.Quat(),qx=new T.Quat(),X=new V3(1,0,0),Y=new V3(0,1,0),c=new C3();
  L.forEach((p,i)=>{q.setFromAxisAngle(Y,p.ry).multiply(qx.setFromAxisAngle(X,p.tl));m.compose(new V3(p.x,hTop(p.x,p.z)-p.s*.15,p.z),q,new V3(p.s*(1+.4*p.c),p.s,p.s));im.setMatrixAt(i,m);
    im.setColorAt(i,c.set(p.c<.5?"#b8aea2":p.c<.8?"#d6b48c":"#7a4a36"))});
  im.receiveShadow=true;im.instanceMatrix.needsUpdate=true;W.add(im);onDes(im)})();

/* ---------------- Tripo props: date palms (trunk lengthened, crown kept ~6 m), saguaros, tent ---------------- */
const PROPS={palms:[],sag:[],barrels:[],tent:null,sagTop:null};
const propU={uT:{value:0},uWind:{value:.35},uDew:{value:0},uFrost:{value:0},uSnL:{value:0}},coatU={uDew:{value:0},uFrost:propU.uFrost};
/* hoar frost: a thin white rime on the faces open to the sky, speckled where a uv is given; behind a uniform, so no extra program */
/* rime grows on every face the cold air reaches, most on the tops; a light snowfall also leaves a thin white layer on the tops that
   melts or slides off within minutes */
const FROST=uv=>`if(uFrost+uSnL>.003){vec3 upV=normalize((viewMatrix*vec4(0.,1.,0.,0.)).xyz);float up=dot(normal,upV);
    float fs=${uv?`fract(sin(dot(floor(${uv}),vec2(12.9898,78.233)))*43758.5453)`:".5"},fk=uFrost*(.35+.65*smoothstep(-.35,.6,up))*(.35+.65*fs*fs);
    diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.84,.88,.94),fk*.58);roughnessFactor=mix(roughnessFactor,.55,fk*.6);
    float sl=uSnL*smoothstep(.35,.8,up)*(.55+.45*fs);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.92,.94,.97),sl*.9);roughnessFactor=mix(roughnessFactor,.85,sl);}`;
function frostMat(m,uv){const f=m.onBeforeCompile;m.onBeforeCompile=(sh,r)=>{if(f)f.call(m,sh,r);sh.uniforms.uFrost=propU.uFrost;sh.uniforms.uSnL=propU.uSnL;
    sh.fragmentShader=sh.fragmentShader.replace("#include <common>","#include <common>\nuniform float uFrost,uSnL;").replace("#include <normal_fragment_maps>","#include <normal_fragment_maps>\n"+FROST(uv))};
  if(!f)m.customProgramCacheKey=()=>"des70frost";m.needsUpdate=true}
/* cacti read at 5-8 m: the ribs live only in the normal map, so their contrast hangs on the light. The skin's grooves are
   darkened and its crests lifted by the surface's own curvature (normal change per metre, measured on screen while a rib still
   spans a few pixels); the spine and wool cards glow when the sun is behind them, the halo a real cactus shows against the light. */
function cacMat(m){const f=m.onBeforeCompile,al=m.alphaTest>0;m.onBeforeCompile=(sh,r)=>{if(f)f.call(m,sh,r);
    sh.uniforms.uSunD=tentU.uSunD;sh.uniforms.uSunC=tentU.uSunC;sh.uniforms.uNt=tentU.uNt;
    sh.fragmentShader=sh.fragmentShader.replace("#include <common>","#include <common>\nuniform vec3 uSunD,uSunC;uniform float uNt;");
    if(!al&&m.normalMap)sh.fragmentShader=sh.fragmentShader.replace("#include <normal_fragment_maps>",`#include <normal_fragment_maps>
      {vec3 cP=-vViewPosition,dpx=dFdx(cP),dpy=dFdy(cP),dnx=dFdx(normal),dny=dFdy(normal);
       float kv=clamp((dot(dnx,dpx)/max(dot(dpx,dpx),1e-12)+dot(dny,dpy)/max(dot(dpy,dpy),1e-12))*.006,-1.,1.)*(1.-smoothstep(.009,.022,length(dpx)+length(dpy)));
       diffuseColor.rgb*=1.-.6*max(-kv,0.)+.16*max(kv,0.);}`);
    /* saguaro spine atlas: 4x4 clusters, star cells on rows 0 and 2 radiate from (.5,.48), tufts on rows 1 and 3 rise from
       (.5,.93). The felt areole there is painted in, never thinner than about a pixel, and the dark centrals are set apart
       from the pale radials, so a cluster still reads as pad + spines once single spines have merged on screen. */
    if(m.name==="SaguaroSpines")sh.fragmentShader=sh.fragmentShader.replace("#include <map_fragment>",`#include <map_fragment>
      {vec2 cu=vMapUv*4.,ci=floor(cu),f=fract(cu);float st=step(mod(ci.y,2.),.5);vec2 d=(f-mix(vec2(.5,.93),vec2(.5,.48),st))*vec2(1.,mix(1.7,1.,st));
       float rad=clamp(.9*length(fwidth(cu)),.11,.18),pad=smoothstep(rad,rad*.55,length(d)),lu=dot(diffuseColor.rgb,vec3(.3,.59,.11));
       diffuseColor.rgb*=mix(.2,.45,smoothstep(.12,.45,lu));
       diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.5,.47,.41)*(.85+.3*fract(sin(dot(ci,vec2(12.9,78.2)))*43758.5)),pad);diffuseColor.a=max(diffuseColor.a,pad);}`);
    if(al)sh.fragmentShader=sh.fragmentShader.replace("#include <opaque_fragment>",`{vec3 Ld=normalize((viewMatrix*vec4(uSunD,0.)).xyz);
       float bk=pow(max(dot(-normalize(vViewPosition),Ld),0.),3.);outgoingLight+=diffuseColor.rgb*uSunC*.6*bk*(1.-.8*uNt);}
      #include <opaque_fragment>`)};
  m.customProgramCacheKey=()=>"des81cac"+(al?"a":"s")+(m.name==="SaguaroSpines"?"p":"");m.needsUpdate=true}
function swayMat(m,key,amp,y0,y1){
  m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,propU);
    sh.vertexShader=sh.vertexShader.replace("#include <common>","#include <common>\nuniform float uT,uWind;")
      .replace("#include <begin_vertex>",`#include <begin_vertex>
        {float h=clamp((position.y-${y0.toFixed(4)})/${(y1-y0).toFixed(4)},0.,1.);float ph=modelMatrix[3].x*.9+modelMatrix[3].z*.7;
         float s=(sin(uT*.9+ph)*.7+sin(uT*1.7+ph*1.3)*.3)*uWind*${amp.toFixed(4)};
         transformed.x+=s*h*h;transformed.z+=s*.4*h*h;
         float cr=smoothstep(.72,.9,h);transformed.y+=cr*sin(uT*2.6+position.x*40.+position.z*31.+ph)*uWind*${(amp*.18).toFixed(4)};}`)};
  m.customProgramCacheKey=()=>key;m.needsUpdate=true}

/* ---------------- date palms: tapered trunk with leaf-base scars, pinnate fronds in a V, date clusters ---------------- */
/* leaflet alpha: 8 tapered leaflets per tile along u (one per rachis step, jittered spacing and width), v = rachis -> tip.
   ImageData keeps rgb under zero alpha, so mips and bilinear taps never pull in a dark fringe. */
const LEAF_TS=256,LEAF_TEX=(()=>{const N=LEAF_TS,a=new Uint8ClampedArray(N*N*4),SS=4;
  for(let py=0;py<N;py++)for(let px=0;px<N;px++){let cov=0,rib=0;
    for(let sy=0;sy<SS;sy++)for(let sx=0;sx<SS;sx++){const u=(px+(sx+.5)/SS)/N,v=(py+(sy+.5)/SS)/N;
      if(v<.035){cov++;continue}
      const li=Math.floor(u*8),jo=(hs2(li,3.7)-.5)*.32,jw=.78+.44*hs2(li,9.1),jl=.86+.12*hs2(li,5.3);
      const cx=u*8-li-.5-jo-.07*v*v,hw=.21*jw*Math.pow(Math.max(0,1-v/jl),.7)*ss(0,.1,v+.03);
      if(Math.abs(cx)<hw){cov++;rib+=Math.exp(-((cx/(hw*.22+1e-3))**2))}}
    const o=(py*N+px)*4,k=cov?1-.28*rib/cov:1,s=Math.round(255*k);a[o]=s;a[o+1]=s;a[o+2]=Math.round(240*k);a[o+3]=Math.round(255*cov/(SS*SS))}
  const t=new T.CTex(new ImageData(a,N,N));t.flipY=false;t.colorSpace="";t.wrapS=1000;t.wrapT=1001;t.generateMipmaps=true;t.minFilter=1008;t.magFilter=1006;t.anisotropy=MOB?4:8;t.needsUpdate=true;return t})();
const palmSway=(H,isTrunk)=>`
        {float h=clamp(position.y/uPH,0.,1.);float ph=modelMatrix[3].x*.9+modelMatrix[3].z*.7;
         float s=(sin(uT*.8+ph)*.7+sin(uT*1.6+ph*1.3)*.3)*(.25+uWind)*.16;
         transformed.x+=s*h*h;transformed.z+=s*.45*h*h;
         ${isTrunk?"":`float r=length(position.xz);float fl=smoothstep(.4,3.5,r)*(.3+uWind);
         transformed.y+=sin(uT*2.3+r*2.1+ph+position.x)*.07*fl;transformed.x+=sin(uT*3.1+r*3.+ph)*.04*fl;
         float tf=smoothstep(.6,3.,r)*(.55+.45*sin(atan(position.z,position.x)*5.+r*1.7));transformed.y-=uTw*tf*.16;transformed.xz+=uTw*tf*.05*vec2(sin(r*4.+uT*29.),cos(r*3.3+uT*23.));`}}`;
/* shadow caster for the crown: same sway, leaflet cut-outs */
function palmDepthMat(H,tw){return new T.SM({uniforms:Object.assign({uLeaf:{value:LEAF_TEX},uPH:{value:H},uTw:tw},propU),
  vertexShader:`uniform float uT,uWind,uPH,uTw;varying vec2 vUv;void main(){vUv=uv;vec3 transformed=position;${palmSway(H,false)}
    gl_Position=projectionMatrix*modelViewMatrix*vec4(transformed,1.);}`,
  fragmentShader:`#include <packing>
    uniform sampler2D uLeaf;varying vec2 vUv;void main(){if(texture2D(uLeaf,vUv).a<.5)discard;gl_FragColor=packDepthToRGBA(gl_FragCoord.z);}`})}
function palmMat(H,isTrunk,tw){
  const m=new T.MSM({vertexColors:true,roughness:isTrunk?.95:.88,metalness:0,side:isTrunk?0:2});
  /* crown: mipmapped leaflet alpha, sharpened to a ~1px edge by its own screen derivative (alpha-to-coverage where
     the target is multisampled, blended otherwise); coverage is boosted with the mip level so leaflets don't thin out far away */
  if(!isTrunk){m.map=LEAF_TEX;m.transparent=true;m.alphaToCoverage=true}
  /* the palm's height is a uniform, so all three palms share one program per variant */
  m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,propU,{uPH:{value:H},uTw:tw});
    sh.vertexShader=sh.vertexShader.replace("#include <common>","#include <common>\nuniform float uT,uWind,uPH,uTw;attribute vec2 aUV;varying vec2 vUV;")
      .replace("#include <begin_vertex>",`#include <begin_vertex>
        vUV=aUV;${palmSway(H,isTrunk)}`);
    if(!isTrunk)sh.fragmentShader=sh.fragmentShader.replace("#include <alphatest_fragment>",`{
        vec2 tp=vMapUv*${LEAF_TS.toFixed(1)};vec2 dx=dFdx(tp),dy=dFdy(tp);float lod=max(0.,.5*log2(max(dot(dx,dx),dot(dy,dy))));
        float a0=diffuseColor.a*(1.+lod*.3);
        float a=clamp((a0-.5)/max(fwidth(a0),1e-4)+.5,0.,1.);
        a=mix(a,clamp(a0*1.15,0.,1.),smoothstep(.6,2.2,lod));
        if(a<.02)discard;diffuseColor.a=a;}`)
      .replace("#include <common>","#include <common>\nuniform float uDew;")
      .replace("#include <roughnessmap_fragment>",`#include <roughnessmap_fragment>
        if(uDew>.003){vec2 bq=floor(vMapUv*vec2(140.,46.));float bd=step(.86,fract(sin(dot(bq,vec2(12.9898,78.233)))*43758.5453));
          diffuseColor.rgb=mix(diffuseColor.rgb*(1.-.16*uDew),vec3(.8,.84,.86),bd*.5*uDew);roughnessFactor=mix(roughnessFactor,mix(.42,.12,bd),uDew*.85);}`);
    /* trunk: leaf-base stubs on a golden-ratio spiral with wavy, uneven rows. In patches (mostly low down) the stubs
       have fallen off, leaving bare trunk with faint leaf-scar rings; the tone runs grey at the base to warm brown
       under the crown. Value noise is periodic around the trunk so the uv seam doesn't show. */
    sh.fragmentShader=sh.fragmentShader.replace("#include <common>","#include <common>\nuniform float uFrost,uSnL;").replace("#include <normal_fragment_maps>","#include <normal_fragment_maps>\n"+FROST(isTrunk?null:"vMapUv*vec2(140.,46.)"));
    if(isTrunk)sh.fragmentShader=sh.fragmentShader.replace("#include <common>",`#include <common>
        uniform float uPH;varying vec2 vUV;float pHs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        float pN(vec2 p,float per){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);float x0=mod(i.x,per),x1=mod(i.x+1.,per);
          return mix(mix(pHs(vec2(x0,i.y)),pHs(vec2(x1,i.y)),f.x),mix(pHs(vec2(x0,i.y+1.)),pHs(vec2(x1,i.y+1.)),f.x),f.y);}`)
      .replace("#include <color_fragment>",`#include <color_fragment>
        {float t=vUV.y/uPH;
         float ry=vUV.y/.17+.45*sin(vUV.x*6.2832+vUV.y*.8)+.35*pN(vec2(vUV.x*4.,vUV.y*.6),4.);
         float row=floor(ry),fy=fract(ry);
         float qx=vUV.x*8.+fract(row*.618)*8.+.4*sin(row*2.3);float cl=floor(qx),fx=fract(qx)-.5;
         float h1=pHs(vec2(mod(cl,8.),row)),h2=pHs(vec2(row,mod(cl,8.)+.5));
         float boot=clamp(smoothstep(.36,.62,pN(vec2(vUV.x*3.,vUV.y*.3),3.))+smoothstep(.5,.85,t)-.6*step(h1,.16),0.,1.);
         float yb=.08+(1.1+.6*h2)*fx*fx+.2*h2;float gap=1.-smoothstep(yb,yb+.12+.1*h1,fy);
         float seam=smoothstep(.32,.5,abs(fx+.08*(h2-.5)));
         float stub=(.72+.4*fy)*(1.-.55*gap)*(1.-.3*seam)*(.78+.44*h1);
         float scar=1.-.24*(1.-smoothstep(0.,.06,abs(fy-.3-.3*h2)-.02))*(.5+.5*h1);
         float fib=pHs(vec2(floor(vUV.x*110.),floor(vUV.y*5.)));
         float aa=1.-smoothstep(.2,.65,max(fwidth(ry),fwidth(qx)));
         float k=mix(scar*mix(1.,stub,.3),stub,boot)*(.9+.2*fib);
         vec3 tone=mix(vec3(.84,.85,.88),vec3(1.,.89,.75),smoothstep(.05,.75,t))*mix(.9,1.1,pN(vec2(vUV.x*2.,vUV.y*.15),2.));
         diffuseColor.rgb*=mix(.88,k,aa)*tone*mix(vec3(1.),vec3(1.06,.98,.9),h1*boot);}`);};
  m.customProgramCacheKey=()=>"des68palm"+(isTrunk?"t":"c");return m}
const DATE_GEO=(()=>{const{v,f}=icoSphere(1);return geoFrom(v.map(p=>[p[0]*.035,p[1]*.045,p[2]*.035]),f)})();
function buildPalms(){
  const dates=[];
  PALMS.forEach((pp,pi_)=>{
    sd=4100+pi_*77;pp.tw={value:0};pp.twA=0;
    const H=pp.h,cw=H>10?1:.78,grp=new T.Group();
    const spine=t=>new V3(pp.lean[0]*H*t*t*.9+Math.sin(t*2.2)*.25*pp.lean[0]*H,H*t,pp.lean[1]*H*t*t*.9);
    /* the trunk's centre line and radius, kept for anything that climbs it */
    pp.spine=spine;pp.rad=t=>(.23+.17*Math.exp(-t*22)-.03*t+(t>.95?.04:0))*(H>10?1:.85)*(1+.035*Math.sin(t*H*1.1+pi_*2)+.025*Math.sin(t*H*2.9+pi_));
    /* trunk */
    {const NR=40,NA=12,pos=[],col=[],uv=[],idx=[];
     for(let r=0;r<=NR;r++){const t=r/NR,P=spine(t),Tg=spine(Math.min(1,t+.01)).sub(spine(Math.max(0,t-.01))).normalize();
       const N=new V3().crossVectors(Tg,new V3(0,0,1)).normalize(),B=new V3().crossVectors(Tg,N);
       const rad=pp.rad(t);
       for(let a=0;a<=NA;a++){const an=a/NA*TAU,c=Math.cos(an),s2=Math.sin(an),q=P.clone().addScaledVector(N,c*rad).addScaledVector(B,s2*rad);
         pos.push(q.x,q.y,q.z);const k=.8+.25*hs2(r*3.1,a);col.push(.42*k,.31*k,.21*k);uv.push(a/NA,t*H)}}
     for(let r=0;r<NR;r++)for(let a=0;a<NA;a++){const i0=r*(NA+1)+a,i1=i0+1,i2=i0+NA+1,i3=i2+1;idx.push(i0,i2,i1,i1,i2,i3)}
     const g=new T.BG();g.setAttribute("position",new T.BA(new Float32Array(pos),3));g.setAttribute("color",new T.BA(new Float32Array(col),3));g.setAttribute("aUV",new T.BA(new Float32Array(uv),2));g.setIndex(idx);g.computeVertexNormals();
     const m=new T.Mesh(g,palmMat(H,true,pp.tw));m.castShadow=m.receiveShadow=true;grp.add(m)}
    /* crown */
    const top=spine(1),pos=[],col=[],nrm=[],uv=[];
    /* vertices: [point, colour, normal, u, v] */
    const quad=(A,B,C,D)=>{for(const q of[A,B,C,B,D,C]){pos.push(q[0].x,q[0].y,q[0].z);col.push(...q[1]);nrm.push(q[2].x,q[2].y,q[2].z);uv.push(q[3],q[4])}};
    const frond=(az,el,L,droop,cBase,cTip,dead)=>{
      const d0=new V3(Math.cos(el)*Math.cos(az),Math.sin(el),Math.cos(el)*Math.sin(az)),P0=top.clone().addScaledVector(d0,.15);
      const at=s=>P0.clone().addScaledVector(d0,L*s).add(new V3(0,-droop*L*s*s,0));
      const NPr=dead?18:30,rows=[];
      for(let i=0;i<NPr;i++){const s=.12+.88*i/(NPr-1),R=at(s),Tg=at(Math.min(1,s+.01)).sub(at(Math.max(0,s-.01))).normalize();
        const side=new V3().crossVectors(Tg,new V3(0,1,0)).normalize(),upL=new V3().crossVectors(side,Tg).normalize();
        const ll=(.12+.62*Math.sin(Math.PI*(s*.92+.04)))*(dead?.7:1)*(H>10?1:.85),j=.85+.3*hs2(i*1.7+az,1);
        rows.push({R,sides:[-1,1].map(sg=>{const dir=Tg.clone().multiplyScalar(.62).addScaledVector(side,sg*.72).addScaledVector(upL,dead?-.4:.38).normalize();
          return{tip:R.clone().addScaledVector(dir,ll).add(new V3(0,-.06*ll,0)),n:new V3(dir.x*.35,1,dir.z*.35).normalize()}}),cb:cBase.map(c=>c*j),ct:cTip.map(c=>c*j)})}
      /* each side is one ribbon from rachis to leaflet tips; the texture cuts the leaflets out of it */
      for(let i=0;i<NPr-1;i++){const a=rows[i],b=rows[i+1],u0=i*.125,u1=(i+1)*.125;
        for(let k=0;k<2;k++){const sa=a.sides[k],sb=b.sides[k];
          quad([a.R,a.cb,sa.n,u0,0],[b.R,b.cb,sb.n,u1,0],[sa.tip,a.ct,sa.n,u0,1],[sb.tip,b.ct,sb.n,u1,1])}}
      /* rachis (samples the solid strip at the base of the tile) */
      for(let i=0;i<12;i++){const s0=i/12,s1=(i+1)/12,a=at(s0),b=at(s1),w=new V3(-Math.sin(az),0,Math.cos(az)).multiplyScalar(.025*(1-s0*.7)),up=new V3(0,1,0),c0=[.3,.3,.14],c1=[.38,.38,.18];
        quad([a.clone().sub(w),c0,up,.5,.012],[a.clone().add(w),c0,up,.5,.012],[b.clone().sub(w),c1,up,.5,.012],[b.clone().add(w),c1,up,.5,.012])}};
    const NF=MOB?20:28,ga=2.39996;
    for(let i=0;i<NF;i++){const k=i/(NF-1),az=i*ga+pp.ry,el=(62-90*Math.pow(k,.85))*D2R,L=mix(2.6,3.7,Math.min(1,k*1.4))*cw*rr(.92,1.08);
      /* date palm leaves are a dusty grey-green, not lime: muted, a little blue in the older fronds, and mid-toned so the crown
         doesn't flare pale against the midday sky */
      const g1=[mix(.075,.11,k),mix(.13,.16,k),mix(.07,.07,k)],g2=[mix(.17,.24,k),mix(.23,.27,k),mix(.14,.13,k)];
      frond(az,el,L,mix(.18,.45,k),g1,g2,false)}
    for(let i=0;i<4;i++){const az=i/4*TAU+.5+pp.ry;frond(az,-68*D2R,2.4*cw,.1,[.33,.22,.11],[.55,.4,.22],true)}
    /* dead leaf sheaths under the crown: brown petiole bases hugging the trunk, the lower rings splayed further out;
       their ends sample the leaflet cut-outs so they fray into fibres */
    {const rT=(H>10?1:.85)*.25;let si=0;const lr=(a,b)=>a+(b-a)*hs2(pi_*13.7+(si++)*1.618,pi_*3.1+si*.37);
     for(let ring=0;ring<3;ring++)for(let j=0;j<9;j++){
       const P=spine(1-.02-ring*.045-(j%2)*.012),az=(j+ring*.5)/9*TAU+pp.ry+lr(-.18,.18);
       const out=new V3(Math.cos(az),0,Math.sin(az)),tg=new V3(-Math.sin(az),0,Math.cos(az));
       const L=lr(.6,1.)*(1+ring*.2),up=(52-ring*40+lr(-10,10))*D2R,dir=out.clone().multiplyScalar(Math.cos(up)).add(new V3(0,Math.sin(up),0));
       const b0=P.clone().addScaledVector(out,rT*.85).add(new V3(0,-.1,0)),w0=lr(.1,.14),w1=lr(.05,.08),wm=(w0+w1)/2;
       const mid=b0.clone().addScaledVector(dir,L*.5).addScaledVector(out,.03),tip=b0.clone().addScaledVector(dir,L).add(new V3(0,-.05*ring-.04,0));
       const nn=out.clone().multiplyScalar(.6).add(new V3(0,.8,0)).normalize(),k=lr(.78,1.12),u1=lr(.25,.4);
       const c0=[.25*k,.18*k,.11*k],c1=[.4*k,.3*k,.19*k],c2=[.56*k,.45*k,.3*k];
       quad([b0.clone().addScaledVector(tg,-w0),c0,nn,0,.008],[b0.clone().addScaledVector(tg,w0),c0,nn,u1,.008],[mid.clone().addScaledVector(tg,-wm),c1,nn,0,.022],[mid.clone().addScaledVector(tg,wm),c1,nn,u1,.022]);
       quad([mid.clone().addScaledVector(tg,-wm),c1,nn,0,.022],[mid.clone().addScaledVector(tg,wm),c1,nn,u1,.022],[tip.clone().addScaledVector(tg,-w1),c2,nn,0,.5],[tip.clone().addScaledVector(tg,w1),c2,nn,u1,.5])}}
    const g=new T.BG();g.setAttribute("position",new T.BA(new Float32Array(pos),3));g.setAttribute("color",new T.BA(new Float32Array(col),3));g.setAttribute("normal",new T.BA(new Float32Array(nrm),3));g.setAttribute("uv",new T.BA(new Float32Array(uv),2));g.setAttribute("aUV",g.attributes.uv);
    const cm=new T.Mesh(g,palmMat(H,false,pp.tw));cm.customDepthMaterial=palmDepthMat(H,pp.tw);cm.castShadow=true;cm.receiveShadow=true;grp.add(cm);
    for(let c=0;c<(H>10?4:2);c++){const az=c/4*TAU+pp.ry+.4,base=top.clone().add(new V3(Math.cos(az)*.35,-.35,Math.sin(az)*.35));
      for(let k=0;k<46;k++){const u=rnd(),r=.06+.16*u;dates.push({p:base.clone().add(new V3(Math.cos(az)*u*.3+rr(-r,r),-u*.8+rr(-.05,.05),Math.sin(az)*u*.3+rr(-r,r))),g:grp,c:rnd()})}}
    grp.position.set(pp.x,hTop(pp.x,pp.z)-.1,pp.z);W.add(grp);reflSet.push(grp);PROPS.palms.push(grp);pp.g=grp;grp.userData.top=top.clone().add(grp.position)});
  const dm=new T.MSM({color:"#ffffff",roughness:.55,metalness:0});
  const im=new T.IM(DATE_GEO,dm,dates.length),m=new T.M4(),q=new T.Quat(),c=new C3();
  dates.forEach((d,i)=>{const wp=d.p.clone().add(d.g.position);m.compose(wp,q,new V3(1,1,1));im.setMatrixAt(i,m);im.setColorAt(i,c.set(d.c<.6?"#c9731f":d.c<.85?"#a8521a":"#e0a040"))});
  im.castShadow=true;W.add(im);reflSet.push(im)}
buildPalms();
/* ---- cacti: the handover models are metric with the base at y=0. Spines, wool, fuzz and flowers are alpha cards (glTF MASK):
   they render with alpha-to-coverage over the canvas MSAA, and their mip chains keep the share of texels above the cut-off at
   every level (a plain box-filtered chain thins the spines below it after a few levels, so distant plants would go bald).
   covMips/cactusAlpha follow the handover's three_cactus_alpha.js (same downsample, bisection and material state). ---- */
const CLOD=[];
/* resolves in a task of its own after the next frame, not inside the frame's rAF task */
const nextFrame=()=>new Promise(r=>{let d=0;const f=()=>{if(!d){d=1;r()}};requestAnimationFrame(()=>setTimeout(f,0));setTimeout(f,60)});
/* the downsample and coverage search are pure array work, done in a worker so a phone's main thread keeps drawing frames */
function covLevels(d0,w0,h0,t){
  let n0=0;for(let i=3;i<d0.length;i+=4)if(d0[i]>=t)n0++;
  const tgt=n0/(w0*h0),lv=[{data:new Uint8Array(d0.buffer.slice(0)),width:w0,height:h0}];
  let src=new Float32Array(d0.length),w=w0,h=h0;for(let i=0;i<d0.length;i++)src[i]=d0[i]/255;
  while(w>1&&h>1){const W2=w>>1,H2=h>>1,o=new Float32Array(W2*H2*4);
    for(let y=0;y<H2;y++)for(let x=0;x<W2;x++){let r=0,gg=0,b=0,a=0,r0=0,g0=0,b0=0;
      for(let k=0;k<4;k++){const i=((2*y+(k>>1))*w+2*x+(k&1))*4,al=src[i+3];r+=src[i]*al;gg+=src[i+1]*al;b+=src[i+2]*al;a+=al;r0+=src[i];g0+=src[i+1];b0+=src[i+2]}
      const q=(y*W2+x)*4;if(a>1e-6){o[q]=r/a;o[q+1]=gg/a;o[q+2]=b/a}else{o[q]=r0/4;o[q+1]=g0/4;o[q+2]=b0/4}o[q+3]=a/4}
    src=o;w=W2;h=H2;const px=w*h,cov=s=>{let n=0;for(let i=0;i<px;i++)if(Math.round(Math.min(src[i*4+3]*s,1)*255)>=t)n++;return n/px};
    let lo=.25,hi=8;for(let it=0;it<24;it++){const m=.5*(lo+hi);if(cov(m)<tgt)lo=m;else hi=m}
    const d=new Uint8Array(px*4);for(let i=0;i<px;i++){d[i*4]=src[i*4]*255+.5;d[i*4+1]=src[i*4+1]*255+.5;d[i*4+2]=src[i*4+2]*255+.5;d[i*4+3]=Math.min(src[i*4+3]*hi,1)*255+.5}
    lv.push({data:d,width:w,height:h})}
  return lv}
const COV={w:null,n:0,cb:new Map(),idle:0};
function covWorker(){if(COV.w!==null)return COV.w;
  try{const u=URL.createObjectURL(new Blob(["const covLevels="+covLevels+";onmessage=e=>{const m=e.data,lv=covLevels(m.d,m.w,m.h,m.t);postMessage({id:m.id,lv},lv.map(l=>l.data.buffer))}"],{type:"text/javascript"}));
    const w=new Worker(u);URL.revokeObjectURL(u);
    w.onmessage=e=>{const c=COV.cb.get(e.data.id);COV.cb.delete(e.data.id);if(c)c.ok(e.data.lv);
      clearTimeout(COV.idle);if(!COV.cb.size)COV.idle=setTimeout(()=>{if(!COV.cb.size&&COV.w){COV.w.terminate();COV.w=null}},3000)};
    w.onerror=e=>{e.preventDefault();COV.w=false;const p=[...COV.cb.values()];COV.cb.clear();for(const c of p)c.ok(covLevels(c.d,c.wd,c.h,c.t))};
    return COV.w=w}catch(_){return COV.w=false}}
async function covMips(img,cut){
  const w0=img.width,h0=img.height,c=document.createElement("canvas");c.width=w0;c.height=h0;const g=c.getContext("2d",{willReadFrequently:true});g.drawImage(img,0,0);
  const d0=g.getImageData(0,0,w0,h0).data,t=Math.ceil(cut*255-1e-6),wk=covWorker();
  if(!wk)return covLevels(d0,w0,h0,t);
  return new Promise(ok=>{const id=++COV.n;COV.cb.set(id,{ok,d:d0,wd:w0,h:h0,t});wk.postMessage({id,d:d0,w:w0,h:h0,t})})}
/* one texture level per frame: the full-size levels of a 2k card take a few hundred ms each on a phone */
async function cactusAlpha(root){const M=VT.THREE,done=new Set(),todo=[];
  root.traverse(o=>{if(!o.isMesh)return;const m=o.material;if(m.alphaTest>0)o.castShadow=false;else o.castShadow=true;o.receiveShadow=true;
    if(done.has(m))return;done.add(m);cleanMat(m);frostMat(m);cacMat(m);if(!ANIM_MATS.includes(m))ANIM_MATS.push(m);
    if(m.alphaTest>0&&m.map&&m.map.image)todo.push(m)});
  for(const m of todo){await nextFrame();
    const lv=await covMips(m.map.image,m.alphaTest),t=new M.DataTexture(lv[0].data,lv[0].width,lv[0].height,M.RGBAFormat,M.UnsignedByteType);
    t.mipmaps=lv;t.generateMipmaps=false;t.flipY=false;t.colorSpace="srgb";t.wrapS=m.map.wrapS;t.wrapT=m.map.wrapT;
    t.magFilter=M.LinearFilter;t.minFilter=M.LinearMipmapLinearFilter;t.anisotropy=MOB?4:8;t.needsUpdate=true;
    m.map=t;m.alphaToCoverage=true;m.transparent=false;m.depthWrite=true;m.depthTest=true;m.side=2;m.needsUpdate=true}}
/* sunk to the lowest sand under the base so the downhill side never floats */
function cactusPlace(w,c,sc){let y=1e9;for(let k=0;k<8;k++){const a=k*TAU/8;y=Math.min(y,hTop(c.x+Math.cos(a)*c.r*.5,c.z+Math.sin(a)*c.r*.5))}
  y=Math.min(y,hTop(c.x,c.z));w.scale.setScalar(sc);w.position.set(c.x,y-.04,c.z);w.rotation.y=c.ry;
  w.traverse(o=>{if(o.isMesh)o.frustumCulled=true});W.add(w);onDes(w);return w}
/* full detail only once a metre spans enough pixels for single spines to resolve */
const _cLod=new V3();
function cactusLod(){if(!CLOD.length)return;const inv=new T.M4().copy(W.matrixWorld).invert(),cp=_cLod.setFromMatrixPosition(De.matrixWorld).applyMatrix4(inv);
  const k=(innerHeight*Math.min(devicePixelRatio,2)/2)/Math.tan(De.fov*Math.PI/360),lim=MOB?150:110;
  for(const L of CLOD){const d=Math.max(.5,Math.hypot(cp.x-L.x,cp.y-hTop(L.x,L.z)-L.h*.5,cp.z-L.z)),ppm=k/d,near=L.hi.visible?ppm>lim*.85:ppm>lim;
    L.hi.visible=near;L.lo.visible=!near}}
const propsReady=Promise.all([
  glb("saguaro_v3").then(async({scene})=>{await cactusAlpha(scene);
    for(const s of SAG){const hi=scene.getObjectByName(s.k),lo=scene.getObjectByName(s.lo);if(!hi||!lo)continue;
      const w=cactusPlace(new T.Group().add(hi.clone(),lo.clone()),s,1);s.g=w;PROPS.sag.push(w);CLOD.push({w,hi:w.children[0],lo:w.children[1],x:s.x,z:s.z,h:s.k==="s12"?12:s.k==="s3"?3:7})}
    /* highest point of the giant = eagle roost */
    const w=PROPS.sag[0];if(!w)return;w.updateMatrixWorld(true);const inv=new T.M4().copy(W.matrixWorld).invert(),p=new V3();let best=null;
    w.children[0].traverse(c=>{if(!c.isMesh)return;const a=c.geometry.attributes.position;for(let i=0;i<a.count;i+=3){p.fromBufferAttribute(a,i).applyMatrix4(c.matrixWorld).applyMatrix4(inv);if(!best||p.y>best.y)best=p.clone()}});
    PROPS.sagTop=best}).catch(()=>{}),
  glb("cholla_v2").then(async({scene})=>{await cactusAlpha(scene);CACTI.forEach(c=>{c.g=cactusPlace(new T.Group().add(scene.clone()),c,c.s)})}).catch(()=>{}),
  /* barrels: one instanced draw per material for all of them; each tips about its base toward the sun's azimuth */
  glb("barrel_cactus_v3").then(async({scene})=>{await cactusAlpha(scene);scene.updateMatrixWorld(true);
    const up=new V3(0,1,0),ax=new V3(Math.cos(SUN.lazL),0,-Math.sin(SUN.lazL)),qy=new T.Quat(),m=new T.M4();
    const xf=BARRELS.map(b=>{let y=hTop(b.x,b.z);for(let k=0;k<8;k++){const a=k*TAU/8;y=Math.min(y,hTop(b.x+Math.cos(a)*.3*b.s,b.z+Math.sin(a)*.3*b.s))}
      const q=new T.Quat().setFromAxisAngle(ax,b.tilt).multiply(qy.setFromAxisAngle(up,b.ry));return new T.M4().compose(new V3(b.x,y-.03,b.z),q,new V3(b.s,b.s,b.s))});
    scene.traverse(o=>{if(!o.isMesh)return;const im=new T.IM(o.geometry,o.material,xf.length);
      xf.forEach((M,i)=>im.setMatrixAt(i,m.multiplyMatrices(M,o.matrixWorld)));
      im.castShadow=o.castShadow;im.receiveShadow=true;im.instanceMatrix.needsUpdate=true;im.computeBoundingSphere();W.add(im);onDes(im);PROPS.barrels.push(im)})}).catch(()=>{}),
  glb("tent").then(({scene})=>{
    const w=fitTo(scene,1,"y"),b=w.userData.box,sc=w.userData.sc;
    w.scale.set(TENT.L/(b.mx.x-b.mn.x),TENT.H/(b.mx.y-b.mn.y),TENT.D/(b.mx.z-b.mn.z));
    matsOf(w,m=>{cleanMat(m);if(m.color)m.color.set("#ffffff");m.roughness=.97;m.side=2;
      /* the source texture is a dark red hide: its luminance becomes the folds of a camel-brown woven cloth sewn from
         0.55 m strips with a coarse 3 cm weave (laid out in island metres); dark members stay wood. Sun on the far side
         of the cloth glows through it, and backlit edges get a warm rim. */
      m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,tentU);
        sh.vertexShader=sh.vertexShader.replace("#include <common>","#include <common>\nuniform mat4 uWInv;uniform float uT,uShk,uTGy;varying vec3 vTI,vTN;")
          /* hail drums the cloth: the roof panels shiver under the strikes */
          .replace("#include <begin_vertex>","#include <begin_vertex>\nif(uShk>.001){vec3 ti=(uWInv*modelMatrix*vec4(position,1.)).xyz;float hk=smoothstep(.8,1.9,ti.y-uTGy);transformed+=objectNormal*uShk*hk*.014*sin(uT*47.+ti.x*5.3+ti.z*4.1)*sin(uT*31.+ti.z*6.7-ti.x*2.);}")
          .replace("#include <project_vertex>","#include <project_vertex>\nvTI=(uWInv*modelMatrix*vec4(transformed,1.)).xyz;vTN=normalize(mat3(uWInv*modelMatrix)*objectNormal);");
        sh.fragmentShader=sh.fragmentShader.replace("#include <common>","#include <common>\nuniform vec3 uSunD,uSunC;uniform float uNt,uWetC,uT,uRn,uFrost,uSnL;uniform vec2 uTC,uTF;varying vec3 vTI,vTN;float tWet=0.,tRiv=0.,tBead=0.;"+GLSL_NOISE)
          .replace("#include <map_fragment>",`#ifdef USE_MAP
        vec4 tx=texture2D(map,vMapUv);float l=dot(tx.rgb,vec3(.3,.59,.11));
        vec2 rel=vTI.xz-uTC;float ac=dot(rel,uTF),al=dot(rel,vec2(uTF.y,-uTF.x));
        float si=floor(ac/.55),sh=fract(sin(si*91.7)*4375.85),wool=step(3.5,mod(si+40.,5.));
        float band=mix(.84,1.06,sh)*(1.-.14*smoothstep(.42,.5,abs(fract(ac/.55)-.5)));
        vec2 wv=vec2(al,vTI.y)/.03;float aw=1.-smoothstep(.3,.8,max(fwidth(wv.x),fwidth(wv.y)));
        float weave=1.+.1*aw*sin(wv.x*6.2832)*sin(wv.y*6.2832+1.5708*step(.5,fract(wv.x*.5)));
        /* Bedouin goat-hair cloth: dark brown strips, every fifth a pale undyed-wool stripe */
        float hair=.9+.2*fract(sin(dot(floor(vec2(al,vTI.y)/.012),vec2(12.9,78.2)))*43758.5);
        vec3 cloth=mix(vec3(.15,.105,.074),vec3(.46,.39,.3),wool)*(.8+1.2*l)*band*weave*mix(hair,1.,aw*.5);
        diffuseColor.rgb=mix(vec3(.2,.13,.08),min(cloth,vec3(.5,.43,.33)),smoothstep(.006,.025,l));
        /* rain: the roof soaks first and the wet spreads down the walls in uneven patches, undersides staying dry longest;
           water gathers into rivulets running down each panel's fall line, beads of it sliding down them */
        if(uWetC>.003){vec3 tn=normalize(vTN);float up=tn.y;
          tWet=smoothstep(.05,.35,uWetC*1.3-(1.-smoothstep(-.3,.5,up))*.45-(dn2(vTI.xz*2.3+vTI.y*1.7)-.5)*.45);
          /* streaks: lanes about 11 cm apart down each panel's fall line, wandering a little; where water runs the cloth is
             soaked darker and glossy in trails 2-4 cm wide, broken where the water soaks in, longer the wetter it gets.
             Once a lane is under a pixel or two only its mean darkening is left. */
          vec2 rl=vTI.xz-uTC,tp=vec2(uTF.y,-uTF.x);float sd=smoothstep(-.2,.2,abs(dot(tn.xz,uTF))-abs(dot(tn.xz,tp)));
          float along=-vTI.y*1.6+.15*dot(rl,mix(uTF,tp,sd));
          float acr=mix(dot(rl,uTF),dot(rl,tp),sd)*9.+.5*dn2(vec2(vTI.y*2.4,dot(rl,vec2(.7,.7))*.9))+.25*dn2(vTI.xz*1.3+vTI.y*.6),li=floor(acr),rate=.9+.8*dh2(vec2(li,9.));
          float fa=fwidth(acr),lf=1.-smoothstep(.2,.55,fa),wk=smoothstep(.2,.6,uWetC)*smoothstep(-.4,.3,up);
          float on=step(.42,dh2(vec2(li,3.)))*smoothstep(.62,.38,dn2(vec2(li*1.7,along*1.1))-.3*uWetC),wd=.09+.1*dh2(vec2(li,4.));
          tRiv=mix(.13,on*smoothstep(wd+.05+fa,wd-.03,abs(fract(acr)-.5)),lf)*wk;
          tBead=tRiv*lf*uRn*step(.45,dh2(vec2(li,6.)))*pow(fract(along*1.3-uT*rate*.8+dh2(vec2(li,5.))),24.);
          tRiv*=.55+.45*uRn*smoothstep(.25,.65,dn2(vec2(li*2.3,along*1.6-uT*.6)));
          diffuseColor.rgb*=(1.-.5*tWet)*(1.-.5*tRiv);}
        /* frost: a light rime on the roof and the upper slopes, the goat-hair weave showing through */
        if(uFrost+uSnL>.003){float ty=normalize(vTN).y,fn=dn2(vTI.xz*6.+vTI.y*2.),fk=uFrost*(.3+.7*smoothstep(-.25,.6,ty))*(.45+.55*fn);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.8,.84,.9),fk*.62);
          float sl=uSnL*smoothstep(.3,.75,ty)*smoothstep(.25,.6,fn+.3*uSnL);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.9,.92,.95),sl*.9);}
        #endif`).replace("#include <roughnessmap_fragment>",`#include <roughnessmap_fragment>
        roughnessFactor=mix(roughnessFactor,.6,tWet*.45+tRiv*.5);`).replace("#include <lights_fragment_end>",`#include <lights_fragment_end>
        reflectedLight.indirectDiffuse*=vec3(1.02,.99,.95);
        {vec3 Ld=normalize((viewMatrix*vec4(uSunD,0.)).xyz);float back=pow(max(dot(-geometryViewDir,Ld),0.),2.);
         float trans=max(-dot(normal,Ld),0.);vec3 warm=mix(vec3(1.,.72,.45),vec3(1.),uNt);
         float cm=smoothstep(.12,.22,diffuseColor.r);
         reflectedLight.indirectDiffuse+=diffuseColor.rgb*uSunC*warm*trans*(.03+.16*back)*cm;
         float rim=pow(1.-clamp(abs(dot(normal,geometryViewDir)),0.,1.),3.);
         reflectedLight.indirectDiffuse+=diffuseColor.rgb*uSunC*warm*rim*back*.55*(1.-.7*uNt)*cm;
         reflectedLight.indirectSpecular+=vec3(.55,.6,.66)*(tRiv*uRn*.025+tBead*.12)*(1.-.75*uNt);}`)};m.needsUpdate=true});
    const g=new T.Group();g.add(w);g.position.set(TENT.x,hTop(TENT.x,TENT.z)-.05,TENT.z);g.rotation.y=TENT.yaw;
    g.traverse(c=>{if(c.isMesh){c.castShadow=c.receiveShadow=true;c.frustumCulled=false}});W.add(g);onDes(g);PROPS.tent=g;tentWater(g);tentRoof(g)}).catch(()=>{})]);

/* ---------------- drying rack beside the tent: forked poles, cross-bar, striped rugs, waterskin ---------------- */
/* a rug hung over the bar: the top stays on the bar; the whole cloth swings as a light pendulum on the gust's drag (it overshoots
   when a gust lets go), and the hem is a second, faster mode that trails the swing and rocks on for a moment once the main swing
   has settled. Soft vertical folds hang in it, deepest at the hem and pulled flatter by the wind, with ripples running down. */
const CL_NX=12,CL_NY=18,_clA=new Float32Array(CL_NY+1),_clY=new Float32Array(CL_NY+1),_clZ=new Float32Array(CL_NY+1);
function clothPose(m,F,gR,t){const d=m.userData,P=m.geometry.attributes.position,ds=d.len/CL_NY,flat=1-.55*Math.min(F,1);
  let y=0,z=0;for(let r=0;r<=CL_NY;r++){const sv=r/CL_NY,a=d.th+d.fi*sv*sv;if(r){const am=.5*(a+_clA[r-1]);y-=ds*Math.cos(am);z+=ds*Math.sin(am)}_clA[r]=a;_clY[r]=y;_clZ[r]=z}
  for(let r=0;r<=CL_NY;r++){const sv=r/CL_NY,a=_clA[r],ny=Math.sin(a),nz=Math.cos(a);
    for(let c=0;c<=CL_NX;c++){const u=d.u0[c],un=u/d.w,
        fo=(.012+.034*sv)*flat*(.7*Math.sin(un*TAU*1.6+d.f1)+.3*Math.sin(un*TAU*3.2+d.f2))*(.35+.65*Math.min(1,sv*4))
          +F*(.2+.8*gR)*.04*sv*Math.sin(sv*9-t*6.5+un*3+d.ph)+.025*F*sv*sv*sv*Math.sin(t*8.3+un*6+d.ph);
      P.setXYZ(r*(CL_NX+1)+c,u*(1-.035*sv*flat),_clY[r]+fo*ny,_clZ[r]+fo*nz)}}
  P.needsUpdate=true;m.geometry.computeVertexNormals();m.geometry.computeBoundingSphere()}
function clothStep(m,F,push,gR,t,dt){const d=m.userData,tgt=push*Math.atan(.35*F*F+.06*F)+.05*F*gR*Math.sin(t*2.3+d.ph);
  const n=Math.min(30,Math.ceil(dt*60)),h=dt/n,w1=2.6,z1=.13,w2=6.2,z2=.07;
  for(let i=0;i<n;i++){const ac=-w1*w1*(d.th-tgt)-2*z1*w1*d.thV;d.thV+=ac*h;d.th+=d.thV*h;
    d.fiV+=(-w2*w2*d.fi-2*z2*w2*d.fiV-.75*ac)*h;d.fi+=d.fiV*h}
  clothPose(m,F,gR,t)}
const woodM=new T.MSM({color:"#6e4a2c",roughness:.9});
function stripeTex(cols){const c=document.createElement("canvas");c.width=64;c.height=128;const x=c.getContext("2d");
  let y=0;while(y<128){const h=4+Math.floor(rnd()*14);x.fillStyle=cols[Math.floor(rnd()*cols.length)];x.fillRect(0,y,64,h);y+=h}
  for(let i=0;i<900;i++){x.fillStyle=`rgba(0,0,0,${rnd()*.08})`;x.fillRect(rnd()*64,rnd()*128,1,1)}
  const t=new T.CTex(c);t.colorSpace="srgb";return t}
(function rack(){
  const g=new T.Group();g.position.set(RACK.x,hTop(RACK.x,RACK.z),RACK.z);g.rotation.y=RACK.yaw;W.add(g);
  const pole=(x,h,tilt)=>{const m=new T.Mesh(new T.Cyl(.045,.06,h,7),woodM);m.position.set(x,h/2-.1,0);m.rotation.z=tilt;m.castShadow=true;g.add(m);
    const f1=new T.Mesh(new T.Cyl(.025,.035,.4,5),woodM);f1.position.set(x+.08,h-.05,0);f1.rotation.z=-.5;g.add(f1);
    const f2=new T.Mesh(new T.Cyl(.025,.035,.4,5),woodM);f2.position.set(x-.08,h-.05,0);f2.rotation.z=.5;g.add(f2)};
  pole(-1.6,2.0,.03);pole(1.6,1.95,-.04);
  const bar=new T.Mesh(new T.Cyl(.035,.035,3.6,6),woodM);bar.rotation.z=Math.PI/2;bar.position.y=1.82;bar.castShadow=true;g.add(bar);
  const cloth=(x,w,len,cols,ph)=>{const geo=new T.Plane(w,len,CL_NX,CL_NY);geo.translate(0,-len/2,0);
    const m=new T.Mesh(geo,new T.MSM({map:stripeTex(cols),roughness:.95,side:2}));
    m.position.set(x,1.84,.04);m.castShadow=true;m.receiveShadow=true;
    m.userData={ph,w,len,th:0,thV:0,fi:0,fiV:0,f1:rr(0,TAU),f2:rr(0,TAU),u0:Float32Array.from({length:CL_NX+1},(_,i)=>(i/CL_NX-.5)*w)};
    g.add(m);clothPose(m,0,0,0);return m};
  RACK.cloths=[cloth(-.75,1.1,1.5,["#8a2a22","#c8a070","#2a2a40","#b5452c","#e8d2a8"],0),cloth(.55,.9,1.3,["#d8c49a","#5a3a24","#a83a28","#efe2c0"],1.7)];
  const skin=new T.Mesh(new T.Sphere(.16,10,8),new T.MSM({color:"#5a3a22",roughness:.7}));skin.scale.set(1,1.35,.8);skin.position.set(1.35,1.45,0);skin.castShadow=true;g.add(skin);
  const pot=new T.Mesh(new T.Lathe([[0,0],[.14,.02],[.2,.12],[.18,.24],[.1,.3],[.11,.36]].map(p=>new T.V2(p[0],p[1])),12),new T.MSM({color:"#9a5a34",roughness:.85}));pot.position.set(-2.1,0,.5);pot.castShadow=true;g.add(pot);
  RACK.g=g})();
/* ---------------- campfire: 0.8 m stone ring, logs, shader flames, embers, light ---------------- */
const fireG=new T.Group();fireG.position.set(FIRE.x,hTop(FIRE.x,FIRE.z),FIRE.z);W.add(fireG);
const fireU={uT:{value:0},uNight:{value:0}};
let fireL=null;
(function campfire(){
  const stM=new T.MSM({color:"#4e463f",roughness:.95});
  /* ring of unequal stones, some sunk deeper, the ones nearest the coals blackened with soot */
  const NS=13,im=new T.IM(ROCK_GEOS[1],stM,NS),m=new T.M4(),q=new T.Quat(),sc=new C3();
  for(let i=0;i<NS;i++){const a=i/NS*TAU+rr(-.12,.12),s=rr(.1,.21),r=rr(.37,.45);q.setFromAxisAngle(new V3(rr(-.3,.3),1,rr(-.3,.3)).normalize(),rnd()*TAU);
    m.compose(new V3(Math.cos(a)*r,.01-rr(0,.04),Math.sin(a)*r),q,new V3(s*rr(.9,1.2),s*rr(1.05,1.4),s*rr(.9,1.15)));im.setMatrixAt(i,m);
    const k=rr(.75,1.1),soot=rnd()<.5?rr(.3,.55):1;im.setColorAt(i,sc.setRGB(k*soot,k*.97*soot,k*.94*soot))}
  im.castShadow=im.receiveShadow=true;fireG.add(im);
  /* split logs leaned into a cone over the coals: bark at the foot on the sand, charred and glowing where they meet in the flames */
  const charM=new T.MSM({vertexColors:true,roughness:.92,emissive:"#ff5a1a",emissiveIntensity:0});fireG.userData.charM=charM;
  charM.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace("#include <common>","#include <common>\nattribute float aG;varying float vG;").replace("#include <begin_vertex>","#include <begin_vertex>\nvG=aG;");
    sh.fragmentShader=sh.fragmentShader.replace("#include <common>","#include <common>\nvarying float vG;").replace("#include <emissivemap_fragment>","#include <emissivemap_fragment>\ntotalEmissiveRadiance*=vG;")};
  charM.customProgramCacheKey=()=>"desFireLog";
  const logGeo=(r0,len)=>{const g=new T.Cyl(r0*.85,r0,len,9,6),p=g.attributes.position,n=p.count,col=new Float32Array(n*3),gl=new Float32Array(n),bk=rr(0,9);
    for(let i=0;i<n;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),t=y/len+.5,an=Math.atan2(z,x),j=1+.13*(vn2(an*2.2+bk,t*3)-.5)+.06*Math.sin(an*5+bk);
      p.setXYZ(i,x*j,y+.025*Math.sin(t*3+bk),z*j);const ch=ss(.45,.95,t),bark=.75+.3*vn2(an*7+bk,t*14);
      col[i*3]=mix(.045*bark,.006,ch);col[i*3+1]=mix(.022*bark,.005,ch);col[i*3+2]=mix(.01*bark,.0045,ch);gl[i]=ss(.68,1,t)*(.6+.4*vn2(an*4+bk,t*9))}
    g.setAttribute("color",new T.BA(col,3));g.setAttribute("aG",new T.BA(gl,1));g.computeVertexNormals();return g};
  for(let i=0;i<5;i++){const a=i/5*TAU+rr(-.2,.2)+.4,len=rr(.55,.72),r0=rr(.04,.06),tl=rr(.95,1.15),l=new T.Mesh(logGeo(r0,len),charM);
    const c=Math.cos(tl),s2=Math.sin(tl);l.position.set(Math.cos(a)*(s2*len*.5-.06),c*len*.5*.85+.04,Math.sin(a)*(s2*len*.5-.06));
    l.rotation.order="YZX";l.rotation.set(0,-a,tl*.88);l.castShadow=true;fireG.add(l)}
  const glow=new T.Mesh(new T.Plane(.7,.7),new T.SM({transparent:true,depthWrite:false,blending:2,uniforms:fireU,
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform float uT,uNight;varying vec2 vUv;void main(){float d=length(vUv-.5)*2.;float a=smoothstep(1.,0.,d);a*=a*(.75+.25*sin(uT*7.)*sin(uT*3.1))*mix(.3,1.,uNight);gl_FragColor=vec4(vec3(1.,.42,.12)*a*1.4,a);}`}));
  glow.rotation.x=-Math.PI/2;glow.position.y=.02;glow.renderOrder=3;fireG.add(glow);
  /* a bundle of camera-facing tongues standing at different spots in the log cone, so they part and overlap as the view moves:
     each licks up and sways on its own beat, its top tears into loose licks, and it runs from a pale core through yellow and
     orange to dark red tips. Premultiplied "over" blending keeps the colour on bright daytime sand (additive washed it white);
     at night the alpha drops so the same flames glow onto what is behind them. */
  const flM=new T.SM({transparent:true,premultipliedAlpha:true,depthWrite:false,side:2,uniforms:fireU,
    vertexShader:`attribute float aK,aH;varying vec2 vUv;varying float vK,vH;uniform float uT;
      void main(){vUv=uv;vK=aK;vH=aH;
        vec3 rt=vec3(viewMatrix[0][0],viewMatrix[1][0],viewMatrix[2][0]);
        float y=position.y,lk=1.+.17*sin(uT*(4.3+aK*2.)+aK*11.)+.09*sin(uT*9.7+aK*5.);
        vec4 w=modelMatrix*vec4(0.,y*lk,0.,1.);
        float sc=length(vec3(modelMatrix[0][0],modelMatrix[0][1],modelMatrix[0][2]));
        w.xyz+=rt*sc*(position.x+(sin(uT*3.1+aK*7.+y*4.)*.09+sin(uT*1.7+aK*3.)*.06)*y*y);
        gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader:`uniform float uT,uNight;varying vec2 vUv;varying float vK,vH;${GLSL_NOISE}
      void main(){vec2 p=vUv-vec2(.5,0.);float h=vUv.y;
        float n1=dn2(vec2(p.x*4.5+vK*9.,h*3.2-uT*2.8)),n2=dn2(vec2(p.x*10.-vK*4.,h*6.5-uT*4.6)),n=n1*.6+n2*.4;
        float wd=.5*pow(1.-h,.9)*(.35+.9*sqrt(h));
        float e=wd-abs(p.x+(n1-.5)*.14*h)-(n2-.5)*.16*h;
        float dy=1.-uNight;
        float a=smoothstep(0.,mix(.016,.028,uNight),e)*smoothstep(0.,.14,h)*smoothstep(h*.95-.12,h*.95+.12,n*1.15);
        /* by day: licks of hotter and cooler gas streaking up each tongue, and a dark red rim round it, so it reads against lit sand */
        float sk=dn2(vec2(p.x*16.+vK*5.,h*2.2-uT*3.4))-.5;
        float tt=clamp((1.-max(h-.12,0.)*1.25-max(.12-h,0.)*2.5)*(1.-.85*abs(p.x)/max(wd,.01))+vH*.3+(n-.5)*.3+sk*.32*dy,0.,1.);
        vec3 c=mix(mix(vec3(.5,.05,.01),vec3(.62,.05,.01),dy),mix(vec3(1.,.3,.03),vec3(1.,.24,.02),dy),smoothstep(0.,.3,tt));
        c=mix(c,mix(vec3(1.,.62,.12),vec3(1.,.5,.05),dy),smoothstep(.34,.66,tt));c=mix(c,mix(vec3(1.,.9,.6),vec3(1.,.74,.22),dy),smoothstep(.8,1.,tt));
        c*=mix(1.,.6,dy*(1.-smoothstep(.02,.07,e)));
        a*=mix(.3,1.,smoothstep(0.,mix(.25,.4,uNight),tt));
        if(a<.01)discard;gl_FragColor=vec4(c*a*mix(1.,1.12,uNight),a*mix(1.,.78,uNight));}`});
  const flames=[];
  /* x, z, width, height, heat: one tall main flame, four mid tongues around it, two short side licks, two hot cores in front */
  const TG=[[0,0,.46,.8,0],[.09,.05,.3,.6,.12],[-.1,.03,.28,.56,.08],[.02,-.1,.3,.62,.1],[-.04,.1,.26,.5,.15],
    [.14,-.06,.2,.36,.25],[-.13,-.07,.2,.34,.25],[0,.02,.26,.36,.85],[.04,-.03,.18,.25,1]];
  TG.forEach(([x,z,w,h,k],i)=>{const geo=new T.Plane(1,1,1,6);geo.translate(0,.5,0);const n=geo.attributes.position.count;
    geo.setAttribute("aK",new T.BA(new Float32Array(n).fill(i*.37+.1),1));geo.setAttribute("aH",new T.BA(new Float32Array(n).fill(k),1));
    const f=new T.Mesh(geo,flM);f.scale.set(w,h,1);f.position.set(x,.07,z);f.renderOrder=8+i*.01;f.frustumCulled=false;fireG.add(f);flames.push(f)});
  fireG.userData.flames=flames.map(f=>({f,s:f.scale.clone()}));
  /* the light hangs well above the coals: the logs and the ring a hand's width from the flames are no longer burnt out,
     and the glow on the sand falls off as the inverse square over several metres instead of stopping at an edge */
  fireL=new T.PL(new C3("#ff9a4a"),0,12,2);fireL.position.set(FIRE.x,hTop(FIRE.x,FIRE.z)+1.5,FIRE.z);W.add(fireL);fireL.layers.enable(3);
})();
/* the sitting circle: weathered logs bedded a little into the sand, bark gone grey and worn pale and smooth on top where people
   sit, sawn ends showing end grain and checks; a flat seat stone, two loose piles of spare ring stones and a stack of firewood.
   Built from its own seed so the rest of the island's random layout is untouched. */
(function fireCircle(){const sd0=sd;sd=771203;
  /* their footprint joins the obstacles only now, after the plants and stones are placed, so the island's layout is as it was;
     any tuft that would poke through a log or a pile is dropped */
  const disc=[];for(const s of SEATS)for(const k of[-.32,.32]){const c=Math.cos(s.yaw),n=Math.sin(s.yaw);disc.push([s.x+n*k*s.len,s.z+c*k*s.len,.42])}
  for(const p of[...FIRE_KIT.piles,FIRE_KIT.wood,FIRE_KIT.seat]){const q=fireAt(p.a,p.r);disc.push([q.x,q.z,.4])}
  for(const d of disc)addOb(d[0],d[1],d[2],"fire");
  {const M=new T.M4(),Z=new T.M4().makeScale(0,0,0),e=M.elements;for(const im of VEG){let ch=0;for(let i=0;i<im.count;i++){im.getMatrixAt(i,M);
    if(disc.some(d=>Math.hypot(e[12]-d[0],e[14]-d[1])<d[2]+.2)){im.setMatrixAt(i,Z);ch=1}}if(ch)im.instanceMatrix.needsUpdate=true}}
  const woodM=new T.MSM({vertexColors:true,roughness:.9,metalness:0});
  /* a log along x: a slightly bent, knobbly cylinder; colour from bark (fissured grey-brown), the worn top band and the end grain */
  const benchGeo=(len,r0,top)=>{const g=new T.Cyl(r0,r0,len,top?48:20,top?30:8,false),p=g.attributes.position,n=p.count,col=new Float32Array(n*3),bk=rr(0,50),bend=rr(-.04,.04);
    const nrm=g.attributes.normal;
    for(let i=0;i<n;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),u=y/len+.5,an=Math.atan2(z,x),rr0=Math.hypot(x,z)/r0,cap=Math.abs(nrm.getY(i))>.9;
      const tap=1-.07*u;
      const rid=Math.abs(Math.sin(an*6.5+2.2*vn2(an*1.3+bk,u*len*1.5)+bk)),knot=Math.exp(-((u-.27)**2+(an-1.1)**2*.01)/.0012)+Math.exp(-((u-.71)**2+(an+2)**2*.01)/.0009);
      /* long fissures in the grey bark, wandering along the grain */
      const fv=Math.abs(Math.sin(an*7+1.8*vn2(an*1.1+bk,u*len*.9)+bk*.3)),fiss=top?ss(.34,0,fv)*(.55+.45*vn2(an*4+bk,u*len*2.5)):0;
      const j=cap?1:1+.05*(vn2(an*3+bk,u*6)-.5)+.035*rid-.13*fiss+.12*knot*(top?1:0);
      p.setXYZ(i,x*j*tap,y+(cap?.008*Math.sin(an*3+bk):0),z*j*tap);
      /* the log will lie with local +x up */
      /* linear albedo: bark a dark grey-brown, darkest in the fissures; the seat band worn to silvery bare wood; end grain tan */
      const upk=cap?0:ss(.55,.92,x/r0*(top?1:0)+.25*(vn2(an*3+bk,u*len*1.2)-.5)),grain=.72+.5*vn2(an*14+bk,u*len*.7),chk=ss(.07,0,Math.abs(Math.sin(an*9+2*vn2(an+bk,u*len*.6))))*ss(.15,.35,u)*ss(.9,.7,u),fis=vn2(an*11+bk,u*len*5),bark=(.42+.85*fis)*(.55+.45*rid)*(1-.88*fiss)*(1-.5*knot);
      let c=[.05*bark,.036*bark,.025*bark];
      const wk=grain*(1-.75*chk);c=[mix(c[0],.15*wk,upk),mix(c[1],.13*wk,upk),mix(c[2],.105*wk,upk)];
      if(cap){const ck=ss(.75,1,rr0);c=[mix(.26,.05,ck),mix(.19,.038,ck),mix(.11,.028,ck)];
        if(vn2(an*4+bk,1.7)>.72&&rr0>.25)c=c.map(v=>v*.4)}
      col[i*3]=c[0];col[i*3+1]=c[1];col[i*3+2]=c[2]}
    g.setAttribute("color",new T.BA(col,3));g.computeVertexNormals();
    /* lie along x, slight bow */
    g.rotateZ(Math.PI/2);const q=g.attributes.position;for(let i=0;i<q.count;i++){const x=q.getX(i);q.setY(i,q.getY(i)+bend*(1-(2*x/len)**2))}
    g.computeVertexNormals();return g};
  const put=(geo,x,z,yaw,sink,tilt)=>{const m=new T.Mesh(geo,woodM),y=hTop(x,z);m.position.set(x,y-sink,z);m.rotation.order="YXZ";m.rotation.set(0,yaw-Math.PI/2,tilt||0);
    m.castShadow=m.receiveShadow=true;W.add(m);return m};
  for(const s of SEATS){const c=Math.cos(s.yaw),n=Math.sin(s.yaw),h0=hTop(s.x+n*s.len*.5,s.z+c*s.len*.5),h1=hTop(s.x-n*s.len*.5,s.z-c*s.len*.5);
    put(benchGeo(s.len,s.rad,true),s.x,s.z,s.yaw,-s.rad*.72,Math.atan2(h1-h0,s.len)*.8)}
  /* firewood: split lengths stacked two layers crosswise */
  {const w=fireAt(FIRE_KIT.wood.a,FIRE_KIT.wood.r),yw=FIRE_B+FIRE_KIT.wood.a;
    for(let L=0;L<2;L++)for(let k=0;k<(L?2:3);k++){const r=rr(.045,.06),len=rr(.48,.6),a=yw+(L?Math.PI/2:0)+rr(-.08,.08),o=(k-(L?.5:1))*.13,
      x=w.x+Math.cos(a)*o,z=w.z-Math.sin(a)*o,m=put(benchGeo(len,r,false),x,z,a,-(r+L*.1),rr(-.05,.05));m.position.y=hTop(w.x,w.z)+r*.9+L*.11}}
  /* stones: the seat slab and the piles, sun-bleached rather than sooted */
  const stM=new T.MSM({color:"#4e463f",roughness:.95}),sp=[];
  {const q=fireAt(FIRE_KIT.seat.a,FIRE_KIT.seat.r);sp.push({x:q.x,z:q.z,y:.06,s:[.3,.2,.26],ry:FIRE_B+FIRE_KIT.seat.a,k:1.25})}
  for(const P of FIRE_KIT.piles){const q=fireAt(P.a,P.r);let n=0;
    for(let l=0;l<3&&n<P.n;l++){const cnt=[4,2,1][l];for(let i=0;i<cnt&&n<P.n;i++,n++){const a=i/cnt*TAU+rr(-.3,.3)+l,r=[.17,.08,0][l]+rr(-.02,.02),s=rr(.09,.14)*(1-.15*l);
      sp.push({x:q.x+Math.cos(a)*r,z:q.z+Math.sin(a)*r,y:.02+l*.085,s:[s*rr(1,1.3),s*rr(.75,1),s*rr(.9,1.2)],ry:rr(0,TAU),k:rr(1.05,1.4)})}}}
  const im=new T.IM(ROCK_GEOS[2],stM,sp.length),M=new T.M4(),Q=new T.Quat(),cc=new C3();
  sp.forEach((o,i)=>{Q.setFromAxisAngle(new V3(rr(-.25,.25),1,rr(-.25,.25)).normalize(),o.ry);M.compose(new V3(o.x,hTop(o.x,o.z)+o.y-o.s[1]*.05,o.z),Q,new V3(...o.s));im.setMatrixAt(i,M);
    im.setColorAt(i,cc.setRGB(o.k*1.08,o.k,o.k*.92))});
  im.castShadow=im.receiveShadow=true;W.add(im);
  /* ash and charcoal crumbs spilled out of the ring, the sand round it scuffed darker by feet */
  const ashM=new T.MSM({color:"#c08f55",transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,roughness:1,metalness:0});
  ashM.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace("#include <common>","#include <common>\nvarying vec2 vA;").replace("#include <begin_vertex>","#include <begin_vertex>\nvA=uv;");
    sh.fragmentShader=sh.fragmentShader.replace("#include <common>","#include <common>\nvarying vec2 vA;"+GLSL_NOISE).replace("#include <color_fragment>",`#include <color_fragment>
      {vec2 p=(vA-.5)*4.4;float r=length(p),n=dn2(p*3.1),n2=dn2(p*9.+4.);
        float ash=smoothstep(.75,.35,r+(n-.5)*.35),crumbs=step(.83,n2)*smoothstep(1.1,.5,r);
        float scuff=smoothstep(2.05,1.25,r+(dn2(p*.9+2.)-.5)*.6)*smoothstep(.9,1.4,r)*(.45+.55*dn2(p*2.3+7.));
        /* sooty grey, a shade under the sand's own albedo: lighter ash would out-shine the sand in full sun and read as a bleached floor */
        vec3 c=mix(vec3(.035,.03,.027),vec3(.12,.11,.1),smoothstep(.3,.75,n)*ash);float a=max(ash*.85,crumbs*.8);
        c=mix(diffuseColor.rgb*vec3(.62,.58,.55),c,step(.01,a));a=max(a,scuff*.35);diffuseColor=vec4(c,a);}`)};
  ashM.customProgramCacheKey=()=>"desFireAsh";
  const ash=new T.Mesh(new T.Plane(4.4,4.4),ashM);ash.receiveShadow=true;ash.rotation.x=-Math.PI/2;ash.position.set(FIRE.x,hTop(FIRE.x,FIRE.z)+.012,FIRE.z);ash.renderOrder=1;W.add(ash);
  sd=sd0})();

/* campfire smoke: thin, torn wisps, camera-facing ribbons that leave the fire narrow, bend downwind as they rise,
   spread and thin out to nothing by ~5 m; a fire this small never makes a sheet */
const SMOKE_H=7.5;
const smokeU={uT:{value:0},uBase:{value:new V3(FIRE.x,fireG.position.y+.4,FIRE.z)},uWind:{value:new V3(WIND.x,0,WIND.z)},uCamL:{value:new V3()},uOp:{value:1},uCol:{value:new C3(.66,.6,.56)},uG:{value:.4},uNt:{value:0},uStm:{value:0}};
const SMOKE=[];
for(let r=0;r<3;r++){
  const SEG=56,n=SEG+1,aT=new Float32Array(n*2),aS=new Float32Array(n*2),pos=new Float32Array(n*6),idx=[];
  for(let i=0;i<n;i++){aT[i*2]=aT[i*2+1]=i/SEG;aS[i*2]=-1;aS[i*2+1]=1;if(i<SEG){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2)}}
  const g=new T.BG();g.setAttribute("position",new T.BA(pos,3));g.setAttribute("aT",new T.BA(aT,1));g.setAttribute("aS",new T.BA(aS,1));g.setIndex(idx);
  const u=Object.assign({},smokeU,{uSeed:{value:r*7.31+1.7},uW:{value:[1,.75,.55][r]},uA:{value:[.3,.2,.13][r]}});
  const mat=new T.SM({transparent:true,depthWrite:false,side:2,uniforms:u,
    vertexShader:`attribute float aT,aS;uniform float uT,uSeed,uW,uG;uniform vec3 uBase,uWind,uCamL;varying float vT,vS;varying vec2 vN;
      vec3 spine(float t){float h=t*${SMOKE_H.toFixed(1)};vec3 side=normalize(cross(uWind,vec3(0.,1.,0.)));
        float lean=h*(.22+1.35*t)*(.6+.8*uG);
        float sway=sin(uT*.45+t*3.6+uSeed)*.3*t*t*h+sin(uT*1.1+t*8.+uSeed*2.)*.05*t*h;
        float curl=sin(uT*.33+t*4.4+uSeed*1.7)*.32*t*h+sin(uT*.8+t*9.3+uSeed)*.08*h*t+sin(uT*1.3+t*16.+uSeed*3.)*.5*sqrt(t)*(1.-t);
        return uBase+vec3(0.,h*(1.-.18*t),0.)+uWind*(lean+sway*.4)+side*(curl+sway*.5);}
      void main(){vT=aT;vS=aS;vec3 p=spine(aT),p2=spine(min(aT+.02,1.)),q=spine(max(aT-.02,0.));
        vec3 tg=normalize(p2-q+vec3(0.,1e-4,0.)),vd=normalize(uCamL-p),sd=normalize(cross(tg,vd));
        float w=mix(.16,2.,pow(aT,.85))*uW;vec3 wp=p+sd*aS*w*.5;vN=vec2(aS*w*.5,aT*${SMOKE_H.toFixed(1)});
        gl_Position=projectionMatrix*modelViewMatrix*vec4(wp,1.);}`,
    fragmentShader:`uniform float uT,uSeed,uA,uOp,uNt,uStm;uniform vec3 uCol;varying float vT,vS;varying vec2 vN;${GLSL_NOISE}
      void main(){float t=vT,h=vN.y;
        /* the column curls: its centre line wanders across the ribbon more the higher it gets */
        float cw=(dfbm(vec2(h*.32-uT*.42,uSeed))-.5)*1.3*smoothstep(.02,.4,t);
        float x=vS-cw,ax=abs(x);
        /* filaments drawn out along the rise, torn wider apart as it climbs */
        vec2 q=vec2(x*mix(1.6,3.4,t)+uSeed,h*.42-uT*.65);
        float f=dfbm(q+vec2(dfbm(q*.7+vec2(0.,uT*.05))*1.6,0.)),st=smoothstep(mix(.36,.5,t),mix(.62,.82,t),f);
        float core=exp(-ax*ax*mix(5.,2.2,t))*smoothstep(1.,.7,ax);
        float a=uA*uOp*core*mix(mix(.55,1.,st),st*st,smoothstep(.04,.45,t));
        /* gaps open between the puffs the fire sends up */
        float puff=dn2(vec2(uSeed*3.1,h*.28-uT*.38));a*=mix(1.,.15+.85*smoothstep(.2,.62,puff),smoothstep(.05,.35,t));
        a*=smoothstep(0.,.05,t)*(1.-smoothstep(mix(.12,.05,uStm),mix(.62,.3,uStm),t))*mix(1.25,.45,smoothstep(.04,.5,t));
        /* rain on the embers: thick white steam billows off low and is gone within a couple of metres */
        a*=1.+1.6*uStm*(1.-smoothstep(.0,.22,t));
        vec3 cc=mix(uCol,vec3(.84,.85,.86)*mix(1.,.42,uNt),uStm*(1.-smoothstep(.1,.35,t)));
        if(a<.006)discard;gl_FragColor=vec4(cc*mix(.86,1.04,smoothstep(0.,.4,vT))+vec3(.42,.2,.07)*uNt*(1.-smoothstep(.02,.3,vT)),a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`});
  const mesh=new T.Mesh(g,mat);mesh.frustumCulled=false;mesh.renderOrder=7;W.add(mesh);SMOKE.push(mesh)}

/* ---------------- soft points (sand wisps, fireflies) ---------------- */
function softPoints(n,col,size,additive,pMax){
  const g=new T.BG(),P=new Float32Array(n*3),A=new Float32Array(n),Z=new Float32Array(n);
  g.setAttribute("position",new T.BA(P,3));g.setAttribute("a",new T.BA(A,1));g.setAttribute("z",new T.BA(Z,1));
  const m=new T.SM({transparent:true,depthWrite:false,blending:additive?2:1,uniforms:{uC:{value:new C3(col)},uS:{value:size*S/.25},uH:{value:innerHeight}},
    vertexShader:`attribute float a,z;varying float vA;uniform float uS,uH;void main(){vA=a;vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;
      gl_PointSize=clamp(uS*z*uH*.5/max(.5,-mv.z),1.,${(pMax||48).toFixed(1)});}`,
    fragmentShader:`uniform vec3 uC;varying float vA;void main(){vec2 q=gl_PointCoord-.5;float d=dot(q,q)*4.;float a=vA*exp(-d*3.)*(1.-d);if(a<.004)discard;gl_FragColor=vec4(uC,a);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`});
  const o=new T.Points(g,m);o.frustumCulled=false;return{o,P,A,Z,g,m,n}}
/* sand wisps: low drifting grains that lift off the dune crest and blow downwind */
const SAND=softPoints(MOB?260:520,"#e6c08a",.16,false);SAND.o.renderOrder=6;W.add(SAND.o);
const SANDP=[];
function crestXZ(vn){const c=Math.cos(DP.yaw),s=Math.sin(DP.yaw),v=vn*DP.w,u=DP.cv*vn*vn-DP.sk*vn;return[DP.x+u*c+v*s,DP.z-u*s+v*c]}
function sandSeed(i,init){
  const crest=rnd()<.55;let x,z;
  if(crest){[x,z]=crestXZ(rr(-1,1)*1.1)}
  else{const[a,b]=edgeXZ(rnd()*TAU,Math.sqrt(rnd())*.88);x=a;z=b}
  const q={x,z,y:hTop(x,z)+.05,s:rr(1.5,3.4),lat:rr(-.1,.1),vy:crest?rr(.15,.5):rr(0,.12),life:init?rnd():0,dur:rr(2.5,6),crest};
  SANDP[i]=q;SAND.Z[i]=rr(.4,1.3)}
for(let i=0;i<SAND.n;i++)sandSeed(i,true);
/* crest veil: fine sand torn off the dune crest, streaming downwind and up over the slip face, thicker in gusts */
const CUR={NS:MOB?28:44,NK:MOB?7:10};
const curU={uNt:{value:0},uT:{value:0},uCol:{value:new C3()},uSheen:{value:new C3()},uLd:sandU.uLd};
const CURT=(()=>{const{NS,NK}=CUR,n=(NS+1)*(NK+1),g=new T.BG(),P=new Float32Array(n*3),U=new Float32Array(n*2),Hv=new Float32Array(n),idx=[];
  for(let i=0;i<=NS;i++)for(let k=0;k<=NK;k++){const o=i*(NK+1)+k;U[o*2]=i/NS;U[o*2+1]=k/NK}
  for(let i=0;i<NS;i++)for(let k=0;k<NK;k++){const a=i*(NK+1)+k,b=a+NK+1;idx.push(a,b,a+1,b,b+1,a+1)}
  g.setAttribute("position",new T.BA(P,3));g.setAttribute("uv",new T.BA(U,2));g.setAttribute("aH",new T.BA(Hv,1));g.setIndex(idx);
  const m=new T.SM({uniforms:curU,transparent:true,premultipliedAlpha:true,depthWrite:false,side:2,
    vertexShader:`attribute float aH;varying vec2 vUv;varying float vH,vFs;varying vec3 vW;uniform vec3 uLd;
      void main(){vUv=uv;vH=aH;vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vFs=pow(max(dot(normalize(cameraPosition-w.xyz),-uLd),0.),4.);
        gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader:`uniform float uT,uNt;uniform vec3 uCol,uSheen;varying vec2 vUv;varying float vH,vFs;varying vec3 vW;${GLSL_NOISE}
      void main(){float k=vUv.y,s=vUv.x;
        float st=dn2(vec2(s*60.,k*1.4-uT*1.2))*.45+dn2(vec2(s*160.+3.,k*3.-uT*2.4))*.55;
        float gr=dn2(vec2(s*420.,k*40.-uT*8.));
        float fr=dn2(vec2(s*7.+uT*.3,k*2.-uT*.8));
        float wp=smoothstep(.32,.68,dn2(vec2(s*11.+uT*.25,k*1.3-uT*.7)));
        /* mostly separate grains over a thin haze, so it reads as sand rather than mist */
        float sp=smoothstep(.5,.8,dn2(vec2(s*560.+7.,k*60.-uT*10.)))+.7*smoothstep(.52,.82,dn2(vec2(s*300.,k*30.-uT*6.5)));
        float a=vH*smoothstep(0.,.04,k)*pow(1.-k,2.2)*(1.-smoothstep(.15+.6*fr,1.,k))*mix(.08,1.,smoothstep(.35,.78,st))*(.1+.3*gr+1.7*sp)*mix(.03,1.,wp)*smoothstep(0.,.12,s)*smoothstep(1.,.88,s);
        /* a sheet seen edge-on piles up alpha into a hard line; thin it at grazing angles */
        vec3 N=normalize(cross(dFdx(vW),dFdy(vW)));a*=mix(.15,1.,smoothstep(.08,.6,abs(dot(N,normalize(cameraPosition-vW)))));
        if(a<.004)discard;
        /* premultiplied: backlit grains add light rather than veiling the sky behind them */
        gl_FragColor=vec4(uCol*(1.+.2*k)+uSheen*vFs*(1.-.4*k),1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        a=.55*(1.-exp(-a*2.8*mix(.45,1.,vFs)));gl_FragColor=vec4(gl_FragColor.rgb*mix(vec3(1.),vec3(1.,.64,.28),.85*(1.-uNt))*a,a*mix(.4,.3,vFs));
      }`});
  const o=new T.Mesh(g,m);o.frustumCulled=false;o.renderOrder=6;W.add(o);return{o,g,P,Hv}})();
let CURK=1,SALT=1;
function curtainUpdate(t){
  const{NS,NK}=CUR,P=CURT.P,Hv=CURT.Hv;
  for(let i=0;i<=NS;i++){const vn=(i/NS*2-1)*.95,[x,z]=crestXZ(vn),y=hTop(x,z),hv=Math.exp(-vn*vn*1.15),g=gustAt(x,z);
    const L=(.7+2.*g)*(.35+.65*hv)*(.6+.8*(.5+.5*Math.sin(i*.9+t*.7)*Math.sin(i*.37-t*.45))),rise=.1+.16*g,a=hv*ss(.12,.75,g)*(1-ss(.86,.97,sN(x,z)));
    for(let k=0;k<=NK;k++){const q=k/NK,o=i*(NK+1)+k,d=q*L;
      P[o*3]=x+WIND.x*d;P[o*3+1]=y-.03+(.16+.3*g)*(1-Math.exp(-d*1.6))+d*rise*.3-.08*d*q+.08*q*Math.sin(t*2.1+i*.45+q*4)*g;P[o*3+2]=z+WIND.z*d;Hv[o]=a*CURK}}
  CURT.g.attributes.position.needsUpdate=CURT.g.attributes.aH.needsUpdate=true}
/* ---------------- sand falls: sand blown to the rim pours over the lip all round the island, like the sky sea's water falls ----------------
   Each fall is one ribbon: a short run of moving sand over the surface to a low point of the lip, then a granular sheet that
   drops straight down off the lip close to the cliff face (sand has no jet momentum; its path is fitted to the cliff mesh), tears into strands and grains and thins into dust
   above the cloud sea. Wind sets the rate: more on the downwind rim and in gusts and dust storms; rain damps the sand into a few
   darker, lighter trickles. Sand is not water: most of the rim only sheds short broken trickles off the creeping veneer, and a few
   heavier falls hang a narrow column off the lip that clumps and surges and, at its foot only, gives itself up to dust drifting downwind. */
const SF={H:28,G:9.8,F:[]};SF.Tf=Math.sqrt(2*SF.H/SF.G);
const sfU={uT:{value:0},uFT:{value:0},uFR:{value:.6},uWet:{value:0},uDust:{value:0},uNt:{value:0},uWV:{value:new T.V2()},
  uCol:curU.uCol,uSheen:curU.uSheen,uLd:sandU.uLd,uGT:sandU.uGT,uWD:sandU.uWD,uFogC:pondU.uFogC,uFogNF:pondU.uFogNF};
(function sandFalls(){
  /* a seed of their own, so the falls do not shift the rest of the layout */
  let ps=5281;const pr=()=>{ps=ps+0x6D2B79F5|0;let t=Math.imul(ps^ps>>>15,1|ps);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296},prr=(a,b)=>a+(b-a)*pr();
  /* [half width min, max, rate threshold min, max] for heavy falls, thinner falls, trickles */
  const kinds=[[1.6,2.3,0,.04],[.45,.7,.03,.16],[.05,.12,.04,.34]],pat=[0,2,2,1,2,2,2,1,2,2],nF=MOB?40:60,sl=TAU/nF;
  const rp=rockMesh.geometry.attributes.position.array,nV=rp.length/3,LIPV=3*NT;
  const frame=th=>{const[x,z]=edgeXZ(th,1),[x1,z1]=edgeXZ(th+.02,1),[x0,z0]=edgeXZ(th-.02,1),l=Math.hypot(x1-x0,z1-z0),tx=(x1-x0)/l,tz=(z1-z0)/l;return{x,z,tx,tz,nx:tz,nz:-tx}};
  /* the cliff under a fall: the furthest-out rock at each 0.5 m of depth below the lip crest, and the lip's crest height and offset */
  const probe=(E,hw)=>{const B=new Float32Array(64).fill(-9),LP=new Float32Array(16).fill(-99);let lipY=-99,lipD=-.3;
    for(let i=0;i<nV;i++){const x=rp[i*3],y=rp[i*3+1],z=rp[i*3+2],rx=x-E.x,rz=z-E.z,lat=rx*E.tx+rz*E.tz;if(Math.abs(lat)>hw+.9)continue;const out=rx*E.nx+rz*E.nz;if(out<-3)continue;
      if(i<LIPV){if(Math.abs(lat)<hw+.3){if(out>-1.2&&y>lipY){lipY=y;lipD=out}const b=Math.floor((out+3)/.2);if(b>=0&&b<16)LP[b]=Math.max(LP[b],y)}}
      else{const b=Math.floor((lipY-y)/.5);if(b>=0&&b<64)B[b]=Math.max(B[b],out)}}
    let bulge=-9;for(let b=0;b<8;b++)bulge=Math.max(bulge,B[b]);return{B,LP,lipY,lipD,bulge:bulge-lipD}};
  const pick=[];
  for(let k=0;k<nF;k++){const ty=pat[k%pat.length],K=kinds[ty];let hw=prr(K[0],K[1]),best=null;
    /* a gap in the rim rocks and props, away from the pond, where the cliff does not bulge out under the lip; a fall with no room is tried narrower */
    for(let tries=0;tries<3&&!best;tries++,hw*=.65)for(let c=0;c<9;c++){const th=k*sl+.4+prr(-.36,.36)*sl,[ix,iz]=edgeXZ(th,.93);if(pN(ix,iz)<1.4||!clearOf(ix,iz,hw+.35))continue;
      const E=frame(th),P=probe(E,hw);if(P.lipY<-50||P.bulge>1)continue;const sc=P.bulge+.08*c;if(!best||sc<best.sc)best={th,E,P,sc}}
    if(!best)continue;hw/=.65;
    pick.push({ty,hw,E:best.E,P:best.P,k:prr(K[2],K[3]),sd:pr()*50,v0:prr(.06,.14)})}
  const pos=[],aU=[],aK=[],aN=[],aT=[],idx=[],nG=MOB?4:6,nv=MOB?24:34;
  for(const f of pick){const{E,P,hw}=f,nu=hw<.3?3:MOB?7:10,o=pos.length/3,rows=[];
    const lipAt=d=>{const b=Math.floor((d+3)/.2);return b>=0&&b<16?P.LP[b]:-99};
    const req=y=>{const b=Math.floor((P.lipY-y)/.5);let m=-9;for(let k=Math.max(0,b);k<Math.min(64,b+3);k++)m=Math.max(m,P.B[k]);return m};
    /* the run over the surface to the lip: a funnel narrowing to the pour */
    for(let j=0;j<nG;j++){const g=j/nG,d=P.lipD-2.4*(1-g),x=E.x+E.nx*d,z=E.z+E.nz*d,y=Math.max(hTop(x,z)+.035,lipAt(d)+.05);rows.push({d,y,s:g-1,w:hw*(1.7-.7*g),sl:0})}
    /* the pour: sand leaves the lip crest with next to no outward speed and drops plumb, sliding over any rock that juts out under it
       and never moving back in; s is fall time, the drop growing as s*s */
    let dp=P.lipD;const path=[];
    for(let j=0;j<=nv;j++){const s=Math.pow(j/nv,1.3),tau=s*SF.Tf,y=P.lipY+.05-.5*SF.G*tau*tau,c=req(y);
      const d=Math.max(P.lipD+.04+f.v0*tau,c+.14,dp);dp=d;path.push([d,y]);
      rows.push({d,y,s,w:hw*(1-.18*ss(0,.25,s)+.12*ss(.75,1,s)),sl:Math.max(0,d-c-.14)})}
    /* heavy falls hang a second, looser curtain just outside the first, so they have depth from afar (not on phones: it doubles the overdraw) */
    for(let ly=0;ly<(f.ty||MOB?1:2);ly++){const o=pos.length/3,R0=ly?rows.filter(r=>r.s>=0):rows;
      for(const r of R0){const dd=r.d+ly*(.14+.22*r.s),cx=E.x+E.nx*dd,cz=E.z+E.nz*dd,w=r.w*(ly?1.18:1);
        for(let i=0;i<=nu;i++){const u=i/nu,lat=(u*2-1)*w;pos.push(cx+E.tx*lat,r.y-ly*.12,cz+E.tz*lat);aU.push(u,r.s);aK.push(f.k,f.sd+ly*23,hw,ly);aN.push(E.nx,E.nz,r.sl+ly*(.14+.22*r.s));aT.push(E.tx*lat,E.tz*lat)}}
      for(let j=0;j<R0.length-1;j++)for(let i=0;i<nu;i++){const q=o+j*(nu+1)+i,b=q+nu+1;idx.push(q,b,q+1,b,b+1,q+1)}}
    SF.F.push({E,k:f.k,hw,path,ty:f.ty})}
  const g=new T.BG();g.setAttribute("position",new T.BA(new Float32Array(pos),3));g.setAttribute("aU",new T.BA(new Float32Array(aU),2));
  g.setAttribute("aK",new T.BA(new Float32Array(aK),4));g.setAttribute("aN",new T.BA(new Float32Array(aN),3));g.setAttribute("aT",new T.BA(new Float32Array(aT),2));g.setIndex(idx);
  const m=new T.SM({uniforms:sfU,transparent:true,depthWrite:false,side:2,polygonOffset:true,polygonOffsetFactor:-.6,polygonOffsetUnits:-6,
    vertexShader:`attribute vec2 aU,aT;attribute vec4 aK;attribute vec3 aN;uniform float uT,uFR,uWet;uniform vec2 uWV;uniform vec3 uLd;${GLSL_GUST}
      varying vec2 vU;varying vec3 vW;varying vec4 vK;varying float vVis,vFs,vLam,vG;
      void main(){vU=aU;vK=aK;vec2 n=aN.xy;vG=gustF(position.xz);
        /* the downwind rim pours first; as the wind veers, falls on the rim it now blows across start and others ease off */
        float wl=length(uWV),k=aK.x+.22*(.5-.5*dot(n,uWV/max(wl,1e-4))),s=aU.y,vis=smoothstep(k,k+.3,uFR);vVis=vis;vec3 p=position;
        p.xz-=aT*(1.-(.45+.55*vis)*(1.+.25*clamp(uFR-1.,0.,1.)));
        if(s>0.){float f=pow(smoothstep(.45,1.,s),1.5);
          /* the column hangs plumb; only its dissolving foot is carried off downwind and sways; it may lean in toward the cliff only as far as the clearance allows */
          vec2 tg=vec2(-n.y,n.x),dr=uWV*f*(.6+.8*gustF(p.xz))*.9+tg*sin(uT*.8+aK.y)*.12*f;
          float side=dot(dr,tg);dr-=tg*side*(1.-.8*smoothstep(.45,.9,s));
          float inw=dot(dr,n);dr-=n*(inw-max(inw,-aN.z));p.xz+=dr;}
        vec4 w=modelMatrix*vec4(p,1.);vW=w.xyz;
        vec3 Nl=s>0.?vec3(n.x,.2,n.y):vec3(0.,1.,0.),Nw=normalize(mat3(modelMatrix)*Nl);
        vLam=.5+.5*max(dot(Nw,uLd),0.);
        vFs=pow(max(dot(normalize(cameraPosition-w.xyz),-uLd),0.),4.);
        gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader:`uniform float uT,uFT,uFR,uWet,uDust,uNt;uniform vec2 uFogNF;uniform vec3 uCol,uSheen,uFogC;varying vec2 vU;varying vec3 vW;varying vec4 vK;varying float vVis,vFs,vLam,vG;${GLSL_NOISE}
      /* noise carried down with the falling sand at a size that stays even on screen as the sand speeds up (the drop grows as s*s):
         two copies scrolled half a cycle apart and cross-faded, so the pattern never stretches out over time */
      float fallN(vec2 q,float s,float f0,float f1){float T=uFT*${(1/SF.Tf/.5).toFixed(4)},p1=fract(T),p2=fract(T+.5),f=f0+f1*s;
        float a=dn2(vec2(q.x,(s-p1*.5)*f+q.y)),b=dn2(vec2(q.x+17.,(s-p2*.5)*f+q.y));return mix(a,b,abs(p1-.5)*2.);}
      void main(){float x=vU.x,s=vU.y,sd=vK.y,hw=vK.z,vis=vVis;if(vis<.01)discard;
        float ed=min(x,1.-x),Nt=4.+hw*22.,tx=x*Nt+sd;
        /* damp sand is darker and clumps */
        vec3 base=uCol*vLam*mix(vec3(1.),vec3(.7,.64,.58),uWet);base=mix(vec3(dot(base,vec3(.3,.55,.15))),base,1.18);float a;vec3 c;
        if(s<0.){
          /* the run: sand creeping and hopping over the surface toward the lip, a faint streaming band */
          float g=s+1.,q=dn2(vec2(tx*.6,s*5.-uFT*1.3))*.6+dn2(vec2(tx*1.7+3.,s*11.-uFT*2.6))*.4;
          vec2 gq=vec2(x*Nt*3.,s*40.-uFT*9.),gc=floor(gq),gf=fract(gq)-.5;float gr=step(.84-.12*g,dh2(gc))*exp(-dot(gf,gf)*9.);
          a=(smoothstep(.45,.75,q)*.32+gr*.45)*smoothstep(0.,.4,g)*smoothstep(0.,.3,ed)*mix(1.,.45,uWet)*(1.+.9*smoothstep(.4,.75,hw))*smoothstep(-.1,.4,cameraPosition.y-vW.y);
          c=base*(1.06+.12*q);
        }else{
          /* u rides with the falling sand: anything scrolled at this rate in s moves with the grains and stretches as they speed up */
          /* each fall runs at its own pace: how much sand the wind feeds it, and how freely it slides off its lip */
          float spd=.8+.45*fract(sd*.618),u=s-uFT*${(1/SF.Tf).toFixed(4)}*spd,wet=uWet;
          float Xw=tx+.35*(dn2(vec2(tx*.23+7.,u*2.4))-.5);
          float n1=dn2(vec2(Xw*.5,u*1.6)),n2=dn2(vec2(Xw*1.3+5.,u*4.)),n3=dn2(vec2(Xw*3.1+9.,u*9.));
          float str=n1*.5+n2*.32+n3*.18,ab=clamp(fwidth(Xw*1.3)*.8-.2,0.,1.);
          /* fine grain texture across the sheet, evened out where it would be finer than a pixel */
          vec2 fq=vec2(x*Nt*9.+sd,u*150.);float fAA=clamp(max(fwidth(fq.x),fwidth(fq.y))-.6,0.,1.),speck=mix(dh2(floor(fq)),.5,fAA);
          /* ragged sides: strands peel off as it falls */
          float ew=dn2(vec2(x*1.7+sd,u*1.1))*.6+dn2(vec2(x*4.1+sd,u*3.3))*.4,dk=uDust*mix(.6,1.,smoothstep(0.,.3,s));
          /* in a dust storm the sheet comes off the lip in clumps and surges, its sides fraying into loose strands */
          /* even in still air a heavy pour comes in surges and clots, sand being grains, not a liquid */
          float cm=1.,sgU=1.,fr=0.,ly=vK.w,dkB=min(1.,max(dk*1.8,(.36+.25*ly)*smoothstep(.25,.6,hw)*smoothstep(.04,.3,s)));
          if(dkB>.01){cm=fallN(vec2(Xw*.9+11.,sd),s,5.,24.)*.55+fallN(vec2(Xw*2.6+4.,sd*2.),s,12.,55.)*.45;sgU=fallN(vec2(Xw*.12+sd*.7,sd),s,1.5,6.);}
          if(dk>.01){fr=fallN(vec2(x*13.+sd,0.),s,10.,40.);str=mix(str,fallN(vec2(Xw*.7,9.),s,3.,14.)*.6+fallN(vec2(Xw*1.8+5.,2.),s,7.,30.)*.4,dk);}
          float edge=smoothstep(0.,.05+.12*s,ed-(.04+.2*s)*ew*(1.+1.6*max(dk,dkB*.7))-.05*(1.-n2)*s-.1*dk*fr);
          /* a dense sheet off the lip that tears into strands lower down; each strand gives out at its own height, trickles soonest */
          float hv=smoothstep(.9,1.7,hw),tear=mix(mix(smoothstep(.36+.2*s,.5+.24*s,str),.45,ab),1.,hv*(1.-smoothstep(.25,.7,s))*.6);
          float body=(.97-(.45-.2*hv)*smoothstep(.05,.6,s))*edge*mix(1.,tear,max(smoothstep(.1,.45,s)*(.55+.45*min(uFR,1.)),dkB*.85))*mix(1.,(.04+1.3*smoothstep(.42,.58,cm))*(.2+1.*smoothstep(.25,.75,sgU)),dkB)*mix(1.,smoothstep(.25,.55,str),wet*.45)*(.78+.22*speck);
          /* trickles come in spurts */
          if(hw<.3)body*=smoothstep(.42,.7,fallN(vec2(sd,3.),s,1.2,5.))*(.75-.35*smoothstep(.1,.3,s));
          /* the feed is never steady: thicker and thinner pulses ride down with the sand, and a strong gust tears the lower stream into clots */
          body*=mix(.5,1.,smoothstep(.28,.62,fallN(vec2(sd*.31+1.,sd),s,.7,2.2)));
          float gb=smoothstep(.62,.92,vG)*smoothstep(.12,.45,s)*(1.-.6*wet);if(gb>.01)body*=1.-gb*(1.-smoothstep(.3,.62,fallN(vec2(Xw*.4+sd,sd+3.),s,3.,12.)));
          body*=1.-.45*ly;
          float endS=mix(.3,.62,smoothstep(.2,.7,hw))+.12*hv-.1*ly+mix(.16,.3,smoothstep(.4,.75,hw))*dn2(vec2(Xw*1.6+17.,sd))+.08*dn2(vec2(Xw*4.+3.,sd+1.))+.16*uDust,cut=1.-smoothstep(endS-.22,endS+.04,s);
          /* grains, streaked by their speed; more of them shed at the sides and the foot */
          vec2 dq=vec2(x*Nt*2.2+sd,u*70.),dc=floor(dq);float dh=dh2(dc);vec2 df=fract(dq)-.5-(vec2(dh2(dc+3.1),dh2(dc+7.7))-.5)*.6;df.y*=mix(1.,.35,smoothstep(.1,.7,s));
          vec2 gw=fwidth(dq);float gd=.9-.2*(1.-edge)-.18*smoothstep(.4,.9,s)+.06*wet-.12*dk-.07*hv;
          float grain=step(gd,dh)*exp(-dot(df,df)*26.)*smoothstep(.02,.1,s)*(1.-smoothstep(.9,1.,s))*(1.-clamp(max(gw.x,gw.y)*1.4-.3,0.,1.));
          /* dust shed off the sheet: a soft veil that spreads down the fall, more in a dust storm and off the heavy falls, little off damp sand */
          float du=dn2(vec2(x*2.3+sd,u*2.6))*.6+dn2(vec2(x*5.+sd*2.,u*6.))*.4;
          /* in a storm the veil is torn too: drifting clots of dust with ragged sides, not an even haze */
          float vc=dk>.01?fallN(vec2(x*3.1+sd,5.),s,2.5,10.):.5;
          float dust=smoothstep(.3,.65,s)*(1.-smoothstep(.72+.15*uDust,.97,s))*smoothstep(-.1,.45,ed+.25*du-.35*dk*(fr-.4))*(.3+.5*du)*(.7+.6*uDust)*mix(1.,(.2+.8*cm)*(.05+1.6*smoothstep(.35,.72,vc)),dk)*(1.-.8*wet)*smoothstep(.12,.5,hw)*(.6+.4*smoothstep(.4,.75,hw));
          float bc=body*cut;
          a=(bc*(.62+.38*str)+grain*.85*(1.-smoothstep(.9,1.,s)))+dust*(1.-.6*bc);
          /* thick sheet shades itself; thin strands and edges catch the light */
          c=base*(.8+.22*n3)*(1.-.14*bc*smoothstep(.1,.5,ed));
          c=mix(c,base*1.12+uSheen*vFs*.7*(1.-.75*uNt),clamp(1.-bc,0.,1.)*.55);
          /* the dust it sheds is ochre, a shade deeper than the sheet, never the white of the cloud sea's mist */
          float dF=dust/(a+.001);c=mix(c,base*vec3(1.,.82,.6)*1.02+vec3(.03,.018,.006)*(1.-uNt),dF*.62);
          /* a sheet seen edge-on piles up alpha into a hard line: keep the stream but thin it */
          vec3 N=normalize(cross(dFdx(vW),dFdy(vW)));a*=mix(.5,1.,smoothstep(.05,.45,abs(dot(N,normalize(cameraPosition-vW)))));
        }
        a*=vis*(.72+.28*min(uFR,1.));
        /* a stream only a pixel or two wide from afar is a faint soft thread, not a hard yellow line */
        /* the haze a fall sinks into is its own dust: fade it to an ochre as bright as the sky haze, never the haze's pale cream
           (which reads as water), and let the lower fall dissipate rather than turn pale */
        float hL=dot(uFogC,vec3(.3,.59,.11));vec3 fO=mix(uFogC,base*(hL/max(dot(base,vec3(.3,.59,.11)),.02))*vec3(1.03,.9,.72),.6+.35*smoothstep(.35,.9,s));
        float pxW=1./max(fwidth(x),1e-4),thin=1.-smoothstep(2.,12.,pxW);a*=1.-.8*thin;c=mix(c,mix(c,fO,.5)*.92+base*.08,thin*.6);
        if(a<.004)discard;
        float fd=smoothstep(uFogNF.x,uFogNF.y,length(cameraPosition-vW));c=mix(c,fO,fd*(1.-.4*smoothstep(.45,.9,s)));a*=1.-.45*fd*smoothstep(.4,.95,s);
        float ck=c.r+c.g+c.b+a;if(!(ck>-1.&&ck<1e3))discard;
        gl_FragColor=vec4(c,clamp(a,0.,1.));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`});
  SF.mesh=new T.Mesh(g,m);SF.mesh.frustumCulled=false;SF.mesh.renderOrder=6;W.add(SF.mesh)})();
/* dust trails: soft puffs shed by the falls that drift downwind, spread and thin out into the air below the island */
const SFD=softPoints(MOB?96:190,"#e4c69c",.9,false);SFD.o.renderOrder=6;W.add(SFD.o);
const SFDP=[];{let ps=9127;const pr=()=>{ps=ps+0x6D2B79F5|0;let t=Math.imul(ps^ps>>>15,1|ps);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
  for(let i=0;i<SFD.n;i++)SFDP.push({f:SF.F.length?Math.floor(pr()*SF.F.length):0,life:pr(),dur:2.5+3*pr(),x:0,y:0,z:0,vx:0,vy:0,vz:0,z0:.7+.8*pr(),hz:i%6==0,r:pr});
  SFD.pr=pr;if(SF.F.length)for(const q of SFDP){const l=q.life;sfDust(q);q.life=l}}
function sfDust(q){const F=SF.F,pr=SFD.pr;let f=F[q.f];
  /* heavier falls shed more dust */
  for(let k=0;k<5;k++){const c=F[Math.floor(pr()*F.length)];if(c.hw>f.hw||pr()<.15)f=c}
  q.f=F.indexOf(f);q.s=.5+.55*Math.min(f.hw,2.2);const j=Math.floor((q.hz?.55+.4*pr():.25+.55*pr())*(f.path.length-1)),[d,y]=f.path[j],s=j/(f.path.length-1),lat=(pr()*2-1)*f.hw,dr=Math.pow(ss(.45,1,s),1.5)*.9*sfU.uWV.value.length();
  q.x=f.E.x+f.E.nx*(d+.2)+f.E.tx*lat+WIND.x*dr;q.z=f.E.z+f.E.nz*(d+.2)+f.E.tz*lat+WIND.z*dr;q.y=y;
  q.vx=WIND.x*(.12+.2*pr())+f.E.nx*.05;q.vz=WIND.z*(.12+.2*pr())+f.E.nz*.05;q.vy=-1.2-1.2*pr();q.life=0;q.dur=q.hz?6+4*pr():2.5+3*pr();if(q.hz){q.vx*=1.4;q.vz*=1.4;q.vy*=.5}}
function sandFallsUpdate(dt,t,wn,nk){
  wn=Math.max(wn,.35+WX.dust*.7);
  /* the rate follows the wind and its gusts; dust storms feed it, wet sand barely moves */
  const fr=cl((.45+.7*wn)*(.75+.5*gustAt(0,0))*(1+1.3*WX.dust)*(1-.25*WX.wet)*(1-.4*WX.sc),0,2.2);
  sfU.uFR.value=SF.pin!=null?SF.pin:sfU.uFR.value+(fr-sfU.uFR.value)*Math.min(1,dt*.6);sfU.uFT.value+=dt;sfU.uT.value=t;sfU.uWet.value=WX.wet;sfU.uDust.value=WX.dust;sfU.uNt.value=nk;
  sfU.uWV.value.set(WIND.x,WIND.z).multiplyScalar((.4+1.2*wn)*(1+1.2*WX.dust)*(1-.5*WX.wet));
  if(!SF.F.length){SFD.o.visible=false;return}
  const R=sfU.uFR.value,wv=sfU.uWV.value.length();
  for(let i=0;i<SFD.n;i++){const q=SFDP[i];q.life+=dt/q.dur;
    if(q.life>=1)sfDust(q);
    const f=SF.F[q.f],k=f.k+.22*(.5-.5*(f.E.nx*WIND.x+f.E.nz*WIND.z)),vis=ss(k,k+.3,R),sp=.5+wv;
    q.x+=q.vx*dt*sp;q.z+=q.vz*dt*sp;q.y+=q.vy*dt;q.vy*=Math.exp(-dt*.5);
    const o=i*3;SFD.P[o]=q.x;SFD.P[o+1]=q.y;SFD.P[o+2]=q.z;SFD.Z[i]=q.z0*q.s*(q.hz?2.2*(1+1.6*q.life):1+3*q.life);
    SFD.A[i]=Math.sin(q.life*Math.PI)*(q.hz?.028:.05)*vis*Math.min(1,f.hw/.35+.25)*(1+1.4*WX.dust)*(1-.85*WX.wet)}
  SFD.g.attributes.position.needsUpdate=SFD.g.attributes.a.needsUpdate=SFD.g.attributes.z.needsUpdate=true;SFD.m.uniforms.uH.value=innerHeight;
  /* sand dust, not cloud: a warm ochre a shade deeper than the lit sand, so it never reads as the white mist of the cloud sea */
  {const c=SFD.m.uniforms.uC.value.copy(curU.uCol.value);c.r*=1.02;c.g*=.88;c.b*=.68}}
/* night fireflies over the oasis */
/* two lots: a loose swarm over the water's edge, and a denser one hanging low in and just over the reeds, grass clumps and
   shrubs, each keeping close to its plant (the second lot from its own seed, so the island's layout does not shift) */
const FF_N0=MOB?30:60,FF_N1=MOB?40:96,FF_N2=MOB?36:110;
const FF=softPoints(FF_N0+FF_N1+FF_N2,"#d8ff8a",.12,true);FF.o.renderOrder=9;W.add(FF.o);
/* a firefly stays a pinpoint with a short halo. The old 920 px cap filled the frame like a searchlight once the camera came in. */
FF.m.vertexShader=FF.m.vertexShader.replace("gl_PointSize=clamp(uS*z*uH*.5/max(.5,-mv.z),1.,48.);","gl_PointSize=clamp(uS*z*uH*.22/max(.4,-mv.z),1.,40.);");
/* hot core, short halo: the sprite is the glow, not a lamp */
FF.m.fragmentShader=`uniform vec3 uC;varying float vA;void main(){vec2 q=gl_PointCoord-.5;float d=dot(q,q)*4.;if(d>1.)discard;
  float core=exp(-d*62.),halo=exp(-d*18.)*smoothstep(1.,.2,d),a=vA*(halo*.22+core*1.85);if(a<.004)discard;gl_FragColor=vec4(mix(uC,vec3(1.,.98,.7),min(1.,core*1.7)),a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  }`;
/* their glints on the still water: the night reflection pass is off, so each one over the pond gets a dim mirror image, placed where
   the line of sight to its reflection meets the surface (sitting on the water, the water mesh cannot hide it) */
const FFR=softPoints(FF.n,"#c8f27a",.1,true);FFR.o.renderOrder=8;FFR.o.visible=false;W.add(FFR.o);FFR.m.fragmentShader=FF.m.fragmentShader;FFR.m.vertexShader=FF.m.vertexShader;
const FFP=[];for(let i=0;i<FF_N0;i++){const[a,b]=pondEdge(rnd()*TAU,rr(.8,i%3?1.9:2.8));FFP.push({x:a,z:b,y:rr(.4,2.6),ph:rnd()*TAU,sp:rr(.3,.7),bl:rr(.6,1.4),rw:1.2});FF.Z[i]=rr(.8,1.2)}
{const sd0=sd;sd=50917;let wt=0;for(const v of VEGP)wt+=v.w;
  for(let i=FF_N0;i<FF_N0+FF_N1;i++){let u=rnd()*wt,v=VEGP[0];for(const q of VEGP){u-=q.w;if(u<=0){v=q;break}}const a=rnd()*TAU,r=rr(.1,.7);
    FFP.push({x:v.x+Math.cos(a)*r,z:v.z+Math.sin(a)*r,y:rr(.15,.5)+v.h*rr(.5,1.3),ph:rnd()*TAU,sp:rr(.25,.6),bl:rr(.7,1.6),rw:rr(.25,.6),lo:.2});FF.Z[i]=rr(.9,1.25)}
  /* a third lot sits on the waterline, low enough that one bug, the water and the shore share a close frame */
  sd=50923;
  for(let i=FF_N0+FF_N1;i<FF.n;i++){const n=FF.n-(FF_N0+FF_N1),k=i-(FF_N0+FF_N1),th=k/n*TAU,shore=k===0;
    const[x,z]=pondEdge(th,shore?1.012:rr(.99,1.05));
    FFP.push({x,z,y:shore?.05:rr(.03,.12),ph:rnd()*TAU,sp:rr(.22,.5),bl:rr(.8,1.5),rw:shore?.06:rr(.05,.16),lo:.4,wat:1,shore:1});FF.Z[i]=shore?.85:rr(.65,.9)}
  sd=sd0}
/* campfire sparks: a few embers always lifting off the logs, and a burst with each pop of the wood */
const SPK=softPoints(MOB?44:96,"#ff5a12",.17,true);SPK.o.renderOrder=9;SPK.o.visible=false;W.add(SPK.o);
/* an orange ember with a small yellow-hot heart, drawn "over" rather than added so a spark still shows against bright sand by day */
SPK.m=SPK.o.material=new T.SM({transparent:true,premultipliedAlpha:true,depthWrite:false,uniforms:{uC:SPK.m.uniforms.uC,uS:SPK.m.uniforms.uS,uH:SPK.m.uniforms.uH,uNight:fireU.uNight},
  vertexShader:SPK.m.vertexShader,
  fragmentShader:`uniform vec3 uC;uniform float uNight;varying float vA;void main(){vec2 q=gl_PointCoord-.5;float d=dot(q,q)*4.;if(d>1.)discard;
    float core=exp(-d*7.),halo=exp(-d*2.2)*(1.-d),a=min(1.,vA*(halo*.8+core*1.2));if(a<.004)discard;
    vec3 c=mix(uC,vec3(1.,.82,.36),smoothstep(.35,.9,core));c*=mix(1.,.5,(1.-uNight)*smoothstep(.35,.85,d));gl_FragColor=vec4(c*a*mix(1.,1.3,uNight),a*mix(.95,.7,uNight));}`});
const SPKP=Array.from({length:SPK.n},()=>({life:1,dur:1,x:0,y:0,z:0,vx:0,vy:0,vz:0,ph:0}));SPK.pop=rr(2,6);SPK.k=0;
function sparkOut(n,hot){for(let i=0;i<SPK.n&&n>0;i++){const q=SPKP[(SPK.k+i)%SPK.n];if(q.life<1)continue;n--;
  const a=rnd()*TAU,r=rr(0,.14);q.x=FIRE.x+Math.cos(a)*r;q.z=FIRE.z+Math.sin(a)*r;q.y=fireG.position.y+rr(.1,.3);
  const sp=hot?rr(.25,.8):rr(.05,.3);q.vx=Math.cos(a)*sp;q.vz=Math.sin(a)*sp;q.vy=hot?rr(2,3.6):rr(.6,1.6);q.life=0;q.dur=rr(.9,hot?2.4:2);q.ph=rnd()*TAU}
  SPK.k=(SPK.k+7)%SPK.n}
/*@@ANIMALS@@*/


/* ---------------- sun: low, behind-right of the default view (backlit island, shadows toward lower-left) ---------------- */
const SUN={azL:157*D2R,lazL:148*D2R,el:15*D2R};
const sunAzW=()=>SUN.azL+YAW;
const sunDirW=new V3();
function setSunDir(el){const a=sunAzW();sunDirW.set(Math.cos(el)*Math.sin(a),Math.sin(el),Math.cos(el)*Math.cos(a))}
setSunDir(SUN.el);

/* ---------------- sky: the site's shared sky (clouds, sun, moon, stars, weather) sits above a far cloud sea ----------------
   The shared sky sphere follows the camera and is lowered so its horizon lies on the cloud sea's horizon (SKY_HOR below
   eye level, as seen from an island floating high above the clouds). This dome draws only the cloud sea: the photographed
   deck (mirrored panels, same scale as before so the island keeps its size against it) relit for sunrise, day, sunset
   and moonlight, greyed by overcast, browned by dust, lit from inside by lightning, with rain shafts hanging over it and
   a rainbow opposite the sun; above the horizon it is clear and the shared sky shows through. */
const SKY_TILE=Math.PI*.5,SKY_HOR=-16*D2R,VD_DROP=200*Math.tan(-SKY_HOR);
const skyU={map:{value:null},uYaw0:{value:168*D2R},uTile:{value:SKY_TILE},uVspan:{value:SKY_TILE*(576/1024)},uHor:{value:SKY_HOR},
  uSkyK:{value:1.45},uSunDir:{value:new V3()},uSunVis:{value:1},uExpo:{value:1},uCon:{value:1.08},
  uK:{value:new T.V4(1,0,0,0)},uMoonW:{value:new V3(0,.3,-1)},uMoonL:{value:1},uT:{value:0},
  uCov:{value:0},uDark:{value:0},uHg:{value:0},uDust:{value:0},uDustC:{value:new C3("#a77a4a")},uRain:{value:0},uShaft:{value:0},
  uBolt:{value:0},uBoltA:{value:0},uIc:{value:0},uIcA:{value:0},uBoltS:{value:0},uBoltE:{value:0},uRb:{value:0},uRbDir:{value:new V3(0,-1,0)},
  uVdSun:{value:new V3(0,1,0)},top:jt.top,bot:jt.bot,uGlowC:jt.uGlowC,uGlowA:jt.uGlowA,uSunDisk:jt.uSunDisk};
const skyM=new T.SM({uniforms:skyU,side:1,depthWrite:false,depthTest:true,fog:false,toneMapped:false,transparent:true,premultipliedAlpha:true,
  vertexShader:`varying vec3 vDir;void main(){vec4 w=modelMatrix*vec4(position,1.);vDir=w.xyz-cameraPosition;gl_Position=projectionMatrix*viewMatrix*w;}`,
  fragmentShader:`uniform sampler2D map;uniform float uYaw0,uTile,uVspan,uHor,uSkyK,uSunVis,uExpo,uCon,uMoonL,uT,uCov,uDark,uHg,uDust,uRain,uShaft,uBolt,uBoltA,uIc,uIcA,uBoltS,uBoltE,uRb,uGlowA;
    uniform vec4 uK;uniform vec3 uSunDir,uMoonW,uDustC,uRbDir,uVdSun,top,bot,uGlowC,uSunDisk;varying vec3 vDir;
    float mir(float u){float m=mod(u,2.);return 1.-abs(m-1.);}
    float h1(float n){return fract(sin(n*127.1)*43758.5453);}
    float n1(float x){float i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(h1(i),h1(i+1.),f);}
    float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);float a=h1(i.x+i.y*57.),b=h1(i.x+1.+i.y*57.),c=h1(i.x+(i.y+1.)*57.),d=h1(i.x+1.+(i.y+1.)*57.);
      return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}
    /* inverse of the renderer's ACES filmic curve so the photograph reads as shot */
    vec3 invACES(vec3 y){
      const mat3 AIn=mat3(vec3(.59719,.07600,.02840),vec3(.35458,.90834,.13383),vec3(.04823,.01566,.83777));
      const mat3 AOut=mat3(vec3(1.60475,-.10208,-.00327),vec3(-.53108,1.10813,-.07276),vec3(-.07367,-.00605,1.07602));
      vec3 t=inverse(AOut)*clamp(y,0.,.97);
      vec3 a=.983729*t-1.,b=.432951*t-.0245786,c=.238081*t+.000090537;
      vec3 v=(-b-sqrt(max(b*b-4.*a*c,0.)))/(2.*a);
      return max(inverse(AIn)*v,0.)*(.6/uExpo);}
    vec3 hue(float t){return clamp(abs(fract(t+vec3(0.,2.,1.)/3.)*6.-3.)-1.,0.,1.);}
    /* azimuth noise without a seam behind the camera: a second copy, offset by a turn, takes over near ±pi */
    float gYaw,gYaw2,gWy;
    float n1Y(float k,float o){return mix(n1(gYaw*k+o),n1(gYaw2*k+o+31.7),gWy);}
    float n2Y(float k,float o,float y){return mix(n2(vec2(gYaw*k+o,y)),n2(vec2(gYaw2*k+o+31.7,y)),gWy);}
    vec3 ramp(float l,vec3 a,vec3 b,vec3 c){return mix(mix(a,b,smoothstep(.18,.58,l)),c,smoothstep(.58,.95,l));}
    /* the shared sky's own colour just above its horizon, so the cloud sea's far edge melts into it */
    vec3 vdHz(vec3 d){vec3 dd=normalize(vec3(d.x,.012,d.z));float t=pow(.0688,.6);vec3 c=mix(bot,top,t);
      vec3 hd=normalize(vec3(dd.x,0.,dd.z)),hs=normalize(vec3(uVdSun.x,0.,uVdSun.z)+1e-5);float hz=pow(max(dot(hd,hs)*.5+.5,0.),3.);
      c=mix(c,uGlowC,uGlowA*clamp((.3+.7*hz)*exp(-abs(dd.y-uVdSun.y+.04)*3.2),0.,1.)*.9);
      float ang=acos(clamp(dot(dd,uVdSun),-1.,1.));return c+uSunDisk*(exp(-ang*12.)*.45+exp(-ang*4.)*.12)*uSunVis;}
    void main(){
      vec3 d=normalize(vDir);
      float el=asin(clamp(d.y,-1.,1.)),yaw=atan(d.x,d.z);
      gYaw=yaw;gYaw2=yaw<0.?yaw+6.2831853:yaw;gWy=smoothstep(2.4,3.1,abs(yaw));
      float dy=uYaw0-yaw;dy=dy-6.2831853*floor((dy+3.1415927)/6.2831853);
      float uRaw=.5+dy/uTile,u=mir(uRaw),u2=mir(uRaw+.5);
      float seamW=smoothstep(0.,.22,min(fract(uRaw),1.-fract(uRaw)));
      float de=el-uHor;de*=de>0.?uSkyK:1.;
      float ft=.4-de/uVspan;
      float ftc=ft<0.?.2*(1.-1./(1.-2.5*ft)):ft;
      float v=1.-mir(ftc);
      vec3 col=mix(texture2D(map,vec2(u2,v)).rgb,texture2D(map,vec2(u,v)).rgb,seamW);
      vec3 zen=vec3(.31,.28,.5);
      col=mix(col,mix(col,zen,.6),smoothstep(0.,-.35,ft));col=mix(col,zen,smoothstep(-.3,-.9,ft));
      col=clamp((col-.45)*uCon+.45,0.,1.);
      float l=dot(col,vec3(.3,.55,.15));
      float g=max(dot(d,uSunDir),0.);
      vec2 hd=normalize(d.xz+1e-5),hsd=normalize(uSunDir.xz+1e-5);float az=max(dot(hd,hsd),0.);
      float band=exp(-pow((el-uHor-.02)/.07,2.))*pow(az,6.);
      /* sunset: the photograph as shot, warmed toward the sun */
      vec3 cS=col;
      {cS=mix(vec3(l),cS,.82);cS=mix(cS*vec3(.9,.88,1.1),cS,smoothstep(.25,.75,l));
       cS+=vec3(1.,.66,.34)*(pow(g,400.)*.1+pow(g,3000.)*.3)*uSunVis+vec3(1.,.62,.32)*band*.16*uSunVis;
       cS=mix(cS,cS*vec3(1.05,.97,.9),pow(az,3.)*.45);}
      /* sunrise: cooler rose-gold tops over lilac hollows */
      vec3 cR=mix(ramp(l,vec3(.36,.36,.56),vec3(.9,.66,.68),vec3(1.,.88,.8)),col*vec3(1.,.9,1.06),.4);
      cR+=vec3(1.,.72,.62)*(pow(g,400.)*.1+band*.14)*uSunVis;cR=mix(cR,cR*vec3(1.06,.96,.94),pow(az,3.)*.4);
      /* day: white tops, blue-grey shade, a little glare toward the sun */
      vec3 cD=ramp(l,vec3(.34,.42,.6),vec3(.78,.83,.92),vec3(1.04,1.03,1.));
      cD=mix(cD,cD*vec3(1.02,1.01,.97),pow(az,2.)*.3)+vec3(1.,.97,.9)*pow(g,30.)*.12*uSunVis;
      /* night: the deck in moonlight, silvered toward the moon */
      vec2 hm=normalize(uMoonW.xz+1e-5);float am=max(dot(hd,hm),0.);
      vec3 cN=ramp(l,vec3(.012,.018,.04),vec3(.08,.105,.2),vec3(.3,.36,.5))*(.55+.45*uMoonL)*(1.+.7*pow(am,4.)*uMoonL);
      cN+=vec3(.35,.4,.55)*exp(-pow((el-uHor-.015)/.05,2.))*pow(am,10.)*.35*uMoonL;
      col=cS*uK.x+cD*uK.y+cN*uK.z+cR*uK.w;
      /* overcast: flatter and greyer, cloud shadows drifting over the deck; storms darker still */
      float lc=dot(col,vec3(.3,.55,.15));
      col=mix(col,vec3(lc)*vec3(.95,.97,1.03),.6*uCov);
      float cs=smoothstep(.35,.75,n2Y(2.6,uT*.004,ft*3.1+uT*.002));
      col*=(1.-.45*uDark)*(1.-.32*uCov*cs)*mix(vec3(1.),vec3(.78,.9,.82),uHg);
      /* lightning lights the deck from inside around the strike */
      {float da=yaw-uBoltA,di=yaw-uIcA;da=da-6.2831853*floor((da+3.1415927)/6.2831853);di=di-6.2831853*floor((di+3.1415927)/6.2831853);
       col+=vec3(.78,.83,1.)*(uBolt*exp(-da*da*18.)+uIc*exp(-di*di*7.)*(.5+.5*n2Y(9.,0.,ft*6.)))*(.25+.9*l)*smoothstep(-1.2,-.05,ft);}
      vec3 lin=invACES(pow(max(col,0.),vec3(2.2)));
      /* far deck melts into the sky's horizon; dust storms bury it in haze */
      vec3 hz=vdHz(d);
      lin=mix(lin,hz,smoothstep(uHor-.13,uHor+.004,el)*(.55+.3*uCov));
      lin=mix(lin,uDustC*(.85+.3*smoothstep(-.6,0.,ft)),uDust*(.55+.42*smoothstep(uHor-.5,uHor,el)));
      float a=1.-smoothstep(uHor+.002,uHor+.05,el);
      vec3 rgb=lin*a;
      /* rain shafts and virga hanging under the shower clouds, out over the cloud sea */
      if(uShaft>.003){float sh=smoothstep(.45,.8,n1Y(7.,uT*.006))*smoothstep(.3,.7,n1Y(2.3,5.-uT*.003));
        float vs=.65+.35*n2Y(140.,0.,el*7.+uT*.8);
        float top0=uHor+.2+.06*n1Y(11.,0.);
        float s=sh*vs*smoothstep(top0,top0-.07,el)*smoothstep(uHor-.06,uHor+.03,el)*uShaft*.55;
        vec3 sc=mix(hz,hz*vec3(.62,.65,.7),.8);rgb=sc*s+rgb*(1.-s);a=s+a*(1.-s);}
      /* a forked bolt from the cloud base down into the cloud sea */
      if(uBolt>.01){float da=yaw-uBoltA;da=da-6.2831853*floor((da+3.1415927)/6.2831853);
        float e0=uHor+.13,e1=uBoltE,k=clamp((e0-el)/(e0-e1),0.,1.);
        float x=(n1(el*42.+uBoltS)-.5)*.05+(n1(el*130.+uBoltS*3.)-.5)*.016+(n1(el*9.+uBoltS*7.)-.5)*.06;
        float bw=abs(da-x),core=exp(-bw*bw/.000006),glw=exp(-bw*bw/.0005)*.35;
        float xb=x+(k-.35)*.09*step(.35,k)*(h1(uBoltS)-.5)*2.;float bb=abs(da-xb),br=exp(-bb*bb/.0000025)*step(.35,k)*step(k,.8)*.6;
        float on=step(e1,el)*step(el,e0)*(1.-smoothstep(.85,1.,k)*.4);
        vec3 bc=vec3(.85,.9,1.)*(core*2.2+glw+br*1.5)*on*uBolt;rgb+=bc;a=max(a,clamp(core+br,0.,1.)*on*uBolt);}
      /* rainbow: primary 40.6-42.4 deg, faint reversed secondary 50-53 deg, darker Alexander's band between */
      if(uRb>.003){float r=acos(clamp(dot(d,uRbDir),-1.,1.))*57.29578;
        float p=clamp((r-40.4)/2.2,0.,1.),pm=exp(-pow((r-41.5)/1.1,2.));
        float s2=clamp((53.-r)/3.,0.,1.),sm=exp(-pow((r-51.5)/1.7,2.))*.35;
        vec3 rc=mix(vec3(.8),hue(.78*(1.-p)),.72)*pm+mix(vec3(.8),hue(.78*(1.-s2)),.6)*sm*.6;
        rc*=.5+.5*smoothstep(.25,.7,n2Y(4.,uT*.003,el*3.));
        float inside=smoothstep(41.,36.,r)*.06,alex=smoothstep(42.5,44.,r)*smoothstep(50.5,49.,r)*.05;
        vec3 sky=a>.5?lin:hz;
        rgb+=(rc*.17+sky*(inside-alex))*uRb*smoothstep(-1.25,-.7,el);}
      gl_FragColor=vec4(rgb,a);}`});
const skyDome=new T.Mesh(new T.Sphere(150,64,40),skyM);skyDome.renderOrder=-200;skyDome.frustumCulled=false;root.add(skyDome);
(()=>{const c=document.createElement("canvas");c.width=c.height=4;const x=c.getContext("2d");x.fillStyle="#e8a878";x.fillRect(0,0,4,4);
  const t=new T.CTex(c);skyU.map.value=t})();
loadTex("assets/tex/sky_cloudsea_pano.jpg").then(t=>{t.colorSpace="";t.generateMipmaps=false;t.minFilter=1006;t.magFilter=1006;t.wrapS=t.wrapT=1001;t.needsUpdate=true;skyU.map.value=t}).catch(()=>{});
let _appSky;
function appSkyMesh(){if(_appSky!==undefined)return _appSky;_appSky=X.vd||null;if(_appSky)return _appSky;
  Jt.traverse(o=>{if(!_appSky&&o.isMesh&&o.material&&o.material.uniforms&&o.material.uniforms.uMoonVis&&o.material.uniforms.top)_appSky=o});return _appSky}

/* ---------------- colour grade + sun shafts (sea-style pass, desert only) ---------------- */
const gradeM=new T.SM({uniforms:{tDiffuse:{value:null},uCon:{value:.08},uSat:{value:1.06},uLift:{value:.012},uVig:{value:.26},uRay:{value:.32},uAsp:{value:1},uTint:{value:new V3(1.02,1,.97)},uSun:{value:new T.V2(.8,.7)},uSunOn:{value:1}},
  depthTest:false,depthWrite:false,
  vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,
  fragmentShader:`uniform sampler2D tDiffuse;uniform float uSat,uLift,uVig,uRay,uAsp,uCon,uSunOn;uniform vec3 uTint;uniform vec2 uSun;varying vec2 vUv;
  void main(){vec3 c=texture2D(tDiffuse,vUv).rgb;
   if(uRay*uSunOn>.001){
    const int NS=${MOB?10:18};vec2 d=(uSun-vUv)/float(NS)*.7;
    vec2 dq=vUv-uSun;dq.x*=uAsp;float ang=atan(dq.y,dq.x);float j=.5+.25*sin(ang*7.+length(dq)*5.)+.25*sin(ang*13.-1.7);
    vec2 p=vUv+d*j;vec3 acc=vec3(0.);float w=1.,ws=0.;
    for(int i=0;i<NS;i++){vec2 o=d*.35;vec3 s=(texture2D(tDiffuse,p).rgb*2.+texture2D(tDiffuse,p+vec2(o.y,-o.x)).rgb+texture2D(tDiffuse,p-vec2(o.y,-o.x)).rgb)*.25;
     vec2 qs=p-uSun;qs.x*=uAsp;float l=dot(s,vec3(.3,.55,.15));acc+=s*smoothstep(.5,1.5,l)*(.35+.65*exp(-dot(qs,qs)*7.))*w;ws+=w;w*=.94;p+=d;}
    c+=acc/ws*uRay*uSunOn*.6*vec3(1.,.82,.6)*exp(-dot(dq,dq)*1.6);}
   c=max(c,0.);c=.18*pow(c/.18+1e-5,vec3(1.+uCon));float L=dot(c,vec3(.2126,.7152,.0722));c=mix(vec3(L),c,uSat);c*=uTint;c+=uLift*vec3(1.,.95,.9)/(1.+L*6.);
   vec2 q=vUv-.5;q.x*=uAsp;c*=1.-uVig*dot(q,q)*1.4;gl_FragColor=vec4(c,1.);}`});
const gradeQ=new T.Mesh(new T.Plane(2,2),gradeM);gradeQ.frustumCulled=false;const gradeC=new T.OC(-1,1,1,-1,0,1);
const grade={enabled:false,needsSwap:true,clear:false,renderToScreen:false,setSize(){},dispose(){},render(r,w,rd){gradeM.uniforms.tDiffuse.value=rd.texture;r.setRenderTarget(this.renderToScreen?null:w);r.render(gradeQ,gradeC)}};
Ta.insertPass(grade,Ta.passes.length-1);
/* mirage: rays grazing the hot sand bend up, so a pool shows what stands above the sand line, upside down and squashed
   (sky, the cloud sea past the rim, a trunk or a camel's legs), trembling with the hot air. The sand marks its pools in
   alpha (.985 sand, down to ~.5 in a pool; everything else 1); this pass, right after the scene and before bloom, looks
   straight up the screen for the first pixel that is not sand and mirrors the image about it. Its shimmer, column blur and
   offsets are measured in 1/720ths of the screen height, so a tall phone screen at DPR 2-3 shows the same pools as a desktop
   (in device pixels they came out 2-3 times finer there: hard broken edges at every trunk and blade behind a pool) */
const _mirW=new V3(1.28,.9,.48);
const mirM=new T.SM({uniforms:{tDiffuse:{value:null},uT:{value:0},uPx:{value:new T.V2(1,1)},uSky:{value:new C3()},uTint:{value:new V3(1,1,1)}},depthTest:false,depthWrite:false,
  vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,
  fragmentShader:`uniform sampler2D tDiffuse;uniform float uT;uniform vec2 uPx;uniform vec3 uSky,uTint;varying vec2 vUv;${GLSL_NOISE}
    float isSand(float a){return step(.3,a)*step(a,.993);}
    void main(){vec4 c=texture2D(tDiffuse,vUv);float mk=isSand(c.a)*clamp((.985-c.a)/.48,0.,1.);
      if(mk<.004){gl_FragColor=vec4(c.rgb,1.);return;}
      vec2 px=vUv/uPx;
      vec2 sh=vec2(dn2(vec2(px.x*.035,px.y*.16-uT*4.))-.5,(dn2(vec2(px.x*.05+7.,px.y*.11-uT*3.))-.5)*.5)*uPx*(2.+5.*mk);
      /* the mirrored image for one column: whatever stands just above the sand line, upside down and squashed; the further
         the line, the more it gives way to the plain sky colour, and three neighbouring columns are averaged so a tall object
         standing behind the pool does not cut it with a hard vertical edge */
      vec3 r=vec3(0.);
      for(int j=-1;j<=1;j++){float x=vUv.x+float(j)*uPx.x*(3.+5.*mk),y0=vUv.y,yl=-1.;vec3 rc=uSky;
        for(int i=1;i<=20;i++){float y=y0+float(i)*.012;if(y>.999)break;if(isSand(texture2D(tDiffuse,vec2(x,y)).a)<.5){yl=y;break;}}
        if(yl>0.){float lo=yl-.012,hi=yl;for(int k=0;k<4;k++){float m=.5*(lo+hi);if(isSand(texture2D(tDiffuse,vec2(x,m)).a)<.5)hi=m;else lo=m;}
          float ym=hi+(hi-y0)*1.4+uPx.y*1.5;if(ym<.999)rc=mix(texture2D(tDiffuse,vec2(x,ym)+sh*2.).rgb,uSky,smoothstep(.13,.24,hi-y0));}
        r+=rc*(j==0?.5:.25);}
      vec3 b=texture2D(tDiffuse,vUv+sh).rgb;
      gl_FragColor=vec4(mix(b,r*uTint,smoothstep(0.,.6,mk)*.92),1.);}`});
const mirQ=new T.Mesh(new T.Plane(2,2),mirM);mirQ.frustumCulled=false;
const mirP={enabled:false,needsSwap:true,clear:false,renderToScreen:false,setSize(){},dispose(){},render(r,w,rd){const u=mirM.uniforms,k=Math.max(1,rd.height/720);u.tDiffuse.value=rd.texture;u.uPx.value.set(k/rd.width,k/rd.height);
  r.setRenderTarget(this.renderToScreen?null:w);r.render(mirQ,gradeC)}};
Ta.insertPass(mirP,1);
const bloom=Ta.passes.find(p=>p&&p.strength!=null&&p.threshold!=null&&p.radius!=null)||null;

/* ---------------- time of day ---------------- */
const WNS={v:.35};
const st={t:0,ts:1,wn:.35,night:0,day:0,phase:"sunset",tod:null,lock:false};
const UPD=[];
function nightRaw(){const n=qt.night||0;return(Ct.night||Ct.mode==="full"||Ct.mode==="crescent"||Ct.mode==="half")?Math.max(n,.92):n}
/* the app's sunrise/sunset presets pick dawn or dusk; "follow" reads the clock (dawn 4:30-9, day 9-16, dusk after) */
function phaseNow(){
  if(st.tod)return st.tod;
  if(nightRaw()>.5)return"night";
  if(Ct.mode==="sunrise")return"sunrise";
  if(Ct.mode==="manual")return"day";
  if(Ct.mode==="follow"){const D=new Date(),h=D.getHours()+D.getMinutes()/60;if(h>=4.5&&h<9)return"sunrise";if(h>=9&&h<16)return"day"}
  return"sunset"}
/* az: light azimuth offset from the dusk sun; sel: the sun's height in the (lowered) shared sky; top/bot: clear-sky colours */
const LIT={
  sunset:{el:15,az:0,sel:2.1,col:"#ffb469",I:3.05,sky:"#8c86c8",gnd:"#c08a62",hI:.5,exp:1,con:.09,sat:1.07,ray:.44,vig:.26,tint:[1.02,1,.96],lift:.012,top:"#5a64b0",bot:"#f2a986",glow:"#ff7438"},
  sunrise:{el:13,az:-68,sel:2.1,col:"#ffc79a",I:2.85,sky:"#9ea2da",gnd:"#c99c84",hI:.58,exp:1,con:.08,sat:1.05,ray:.4,vig:.25,tint:[1,.99,1.02],lift:.014,top:"#6478c0",bot:"#f6bcae",glow:"#ff9a7c"},
  day:{el:46,az:0,sel:40,col:"#fff0d8",I:2.9,sky:"#b4cdea",gnd:"#d8b483",hI:.95,exp:1,con:.05,sat:1.03,ray:.16,vig:.2,tint:[1,1,1],lift:.008,top:"#2e6cd0",bot:"#b4cfee",glow:"#ffd9b0"},
  /* night: the moonlit sky fills the shade from every side (the sky sea's night is lit the same way), so the rim, the falls and
     the props keep their forms rather than going to flat silhouettes against a black sky */
  night:{el:21,az:0,sel:2.1,col:"#abc9f0",I:1.6,sky:"#22346a",gnd:"#12141c",hI:.15,exp:.7,con:.14,sat:.86,ray:0,vig:.33,tint:[.86,.93,1.12],lift:.004,top:"#0b1534",bot:"#28355a",glow:"#000000"}};
const _c1=new C3(),_c2=new C3(),_c3=new C3();
let LK={sunset:1,sunrise:0,day:0,night:0};
function blendL(k){let s=0;for(const p in LK)s+=LK[p]*LIT[p][k];return s}
function blendC(k,out){out.setRGB(0,0,0);for(const p in LK){if(LK[p]>0){_c2.set(LIT[p][k]);out.r+=_c2.r*LK[p];out.g+=_c2.g*LK[p];out.b+=_c2.b*LK[p]}}return out}
const moonAzL=98*D2R;
let _shMask=null;

/* ---------------- weather: the site's weather menu, read as desert weather ----------------
   晴 sun (clear/scattered/towering/cirrus), 阴 overcast, 阵雨 showers (light/moderate/heavy/thunderstorm), 沙尘 dust (four levels).
   Showers come and go over tens of seconds, darken the sand where they fall, and the sand dries again with sun and wind;
   dust storms raise the wind, haze out the cloud sea and the sun, and send the animals to shelter. */
const WX={fog:0,fb:0,fa:0,dew:0,cold:0,fcold:0,scold:0,clr:0,nb:3,rain:0,pit:0,ovc:0,dark:0,dust:0,wet:0,heat:0,after:0,shel:0,flash:0,bolt:0,boltA:0,boltS:0,boltE:0,bAge:9,icF:0,icA:0,ic:4,rb:0,shaft:0,sunK:1,
  sf:0,sc:0,sm:0,sp:0,mw:0,frost:0,ice:0,scp:0,stm:0,hf:0,hc:0,hp:0,hm:0,hr:0,gf:0,hcold:0,H:{ph:0,t:0,dur:90,lull:45}};
/* snow levels in the desert menu: frost (hardly a flake), a dusting, light snow; the courtyards' heavy levels read as light snow here */
const DUSTLV=[0,.32,.56,.8,1],FOGLV=[0,.55,.8,1],SNOWLV=[0,.3,.62,1,1];
const WXT={sun:[0,0,0],cloud:[.86,.25,.2],lrain:[.42,.22,.55],mrain:[.62,.4,.7],hrain:[.86,.62,.9],storm:[.95,.8,1],dust:[0,.25,0],snow:[.7,.14,0],hail:[.95,.72,0]};
function wxUpdate(dt){
  const w=Ct.weather,k=dt>0?1-Math.exp(-dt*.4):1,T=WXT[w]||WXT.sun;
  const rT=Math.max({lrain:.32,mrain:.62,hrain:1,storm:1}[w]||0,WX.hr),dT=Math.max(w==="dust"?DUSTLV[Ct.dustLv||2]:0,.3*WX.gf);
  WX.rain+=(rT-WX.rain)*k;WX.dust+=(dT-WX.dust)*k*.7;WX.ovc+=(T[0]-WX.ovc)*k;WX.dark+=(T[1]-WX.dark)*k;
  WX.shaft+=(Math.max(T[2]*(rT>0?1:0),w==="cloud"?.25:0)-WX.shaft)*k;
  /* sand soaks up over tens of seconds of rain and takes minutes to dry; pits pile up while it rains and blow away after */
  if(dt<=0){WX.wet=WX.rain>.05?1:WX.wet;WX.pit=WX.rain>.05?1:WX.pit}
  else if(WX.rain>.02){WX.wet=Math.min(1,WX.wet+dt*WX.rain*.045);WX.pit=Math.min(1,WX.pit+dt*WX.rain*.022)}
  else{WX.wet=Math.max(0,WX.wet-dt*.0042*(.35+.9*(1-st.night)*(1-WX.ovc))*(.6+st.wn));WX.pit=Math.max(0,WX.pit-dt*(.001+.01*st.wn*(1-WX.wet)))}
  WX.after=WX.rain>.2?1:Math.max(0,WX.after-dt/240);
  const hot=w==="sun"?(Ct.ct==="clear"||Ct.ct==="cirrus"?1:.75):0;
  WX.heat+=(hot*(LK.day+.7*LK.sunset+.15*LK.sunrise)*(1-WX.wet)-WX.heat)*k;
  const sh=WX.dust>.45||(w==="storm"||w==="hrain")&&WX.rain>.6;WX.shel=sh?1:WX.dust<.35&&WX.rain<.45?0:WX.shel;
  const sunUp=(1-LK.night)*(1-ss(.62,.86,WX.ovc))*(1-WX.dust);
  WX.rb+=(cl(Math.max(WX.rain*3,WX.after>.88?(WX.after-.88)/.12:0),0,1)*sunUp*(.55+.45*(LK.sunset+LK.sunrise))-WX.rb)*(dt>0?1-Math.exp(-dt*.25):1);
  /* radiation fog: it thickens through the night and, once the sun is up, burns off from the rim inward and lifts, the hollow last
     (fb 0 = settled fog .. 1 = burnt off; by day a wisp stays over the pond); dusk lets it start pooling again */
  {const fT=w==="fog"?FOGLV[Ct.fogLv||2]:0,ph=st.phase,bT=ph==="night"?0:ph==="sunset"?.4:ph==="sunrise"?.6:.8;
   WX.fog+=(fT-WX.fog)*(dt>0?1-Math.exp(-dt*(fT>WX.fog?.1:.22)):1);
   if(dt>0){const r=bT>WX.fb?(ph==="day"?.016:.011):.02;WX.fb+=cl(bT-WX.fb,-r*dt,r*dt)}else if(!WX.fbI){WX.fb=bT;WX.fbI=1}
   WX.fa=WX.fog*(1-ss(.15,.85,WX.fb));
   const sunUp=(1-LK.night)*(LK.sunrise+LK.day);WX.clr=WX.fog*sunUp*ss(.08,.3,WX.fb)*(1-ss(.62,.85,WX.fb));
   WX.dew+=((w==="fog"?WX.fog*(1-.75*ss(.4,.9,WX.fb)):0)-WX.dew)*(dt>0?1-Math.exp(-dt*(w==="fog"?.05:.03)):1);
   WX.fcold=WX.fog>.25&&WX.fb<.62?1:WX.fog<.15||WX.fb>.72?0:WX.fcold}
  /* snow: a thin dusting out of a grey-blue sky. It builds while it falls and, once the sun is out, sublimates and melts within
     a few minutes; the melt water leaves dark wet patches in the sand that then dry. Frost rimes the plants and the tent, and at
     night and dawn thin ice forms round the edge of the pond */
  {const sT=w==="snow"?SNOWLV[Math.min(3,Ct.snowLv||2)]:0,sun=(1-LK.night)*(LK.day+.6*LK.sunrise+.45*LK.sunset)*(1-ss(.45,.8,WX.ovc));
   WX.sf+=(sT-WX.sf)*(dt>0?1-Math.exp(-dt*.35):1);
   const iT=WX.sc>.05||WX.sf>.05?(.55*LK.night+LK.sunrise)*(1-sun*.9):0;
   if(dt<=0){if(sT>0){WX.sc=Math.max(WX.sc,.45+.55*sT);WX.sp=Math.max(WX.sp,WX.sc);WX.frost=Math.max(WX.frost,.5+.5*sT);WX.ice=Math.max(WX.ice,iT)}}
   else{const acc=WX.sf*.032*(1-.5*sun),mel=WX.sc>0?(.0004+.0058*sun*(1-WX.sf)+.0012*st.wn*(1-WX.sf))*(.5+.5*ss(0,.15,WX.sc)):0;
     WX.sc=cl(WX.sc+dt*(acc*(1.04-WX.sc)-mel),0,1);
     WX.sm+=((WX.sc>.01&&mel>acc*.6?1:0)-WX.sm)*(1-Math.exp(-dt*(WX.sm<.5?.12:.05)));
     /* sp: the most the snow lay recently (where the melt water soaks in); mw: how wet those patches are. They dry in a few minutes. */
     if(WX.sc>=WX.sp)WX.sp=WX.sc;else if(WX.mw<.02&&WX.sc<.005)WX.sp*=Math.exp(-dt*.05);
     WX.mw=cl(WX.mw+dt*(Math.max(0,mel-acc)*2.4*ss(0,.25,WX.sp)-WX.mw*(.002+.011*sun)*(WX.sc<.05?1:.25)),0,1);
     WX.frost=cl(WX.frost+dt*(WX.sf*.045*(1-.7*sun)*(1.1-WX.frost)-(.0006+.012*sun)*(1-WX.sf)),0,1);
     WX.ice+=cl(iT-WX.ice,-dt*(.006+.03*sun),dt*.012);
     /* the thin layer on the tops: it settles with the flakes and goes long before the ground's cover, in sun or wind */
     WX.scp=cl(WX.scp+dt*(WX.sf*.06*(1.02-WX.scp)-(.0012+.022*sun+.004*st.wn)*(1-.85*WX.sf)),0,1)}
   if(dt<=0&&sT>0)WX.scp=Math.max(WX.scp,.5+.5*sT);
   /* steam fog: on a cold morning or in snow the pond (warmer than the air) smokes in thin wisps */
   {const sT2=Math.max(ss(.03,.4,WX.sf+WX.sc),.7*ss(.15,.6,WX.frost))*(1-.65*sun*(1-WX.sf));WX.stm+=(sT2-WX.stm)*(dt>0?1-Math.exp(-dt*.08):1)}
   WX.scold=WX.sf>.05||WX.sc>.25?1:WX.sf<.02&&WX.sc<.12?0:WX.scold}
  /* hail: a convective cell passes. First the gust front (a sudden cold blast that lifts sand), then a short burst of white
     stones out of a dark green-grey base, a taper, and a lull before the next cell. Stones lie in the ripple troughs and hollows,
     melt within a few minutes on the warm sand and leave dark wet spots that dry. hc: stones lying, hp: fresh pits, hm: melt water */
  {const on=w==="hail",H=WX.H;
   if(!on)H.ph=0,H.t=0;
   else if(dt<=0){if(!H.ph){H.ph=2;H.t=8}}
   else{H.t+=dt;if(!H.ph){H.ph=1;H.t=0}
     if(H.ph===1&&H.t>9){H.ph=2;H.t=0}else if(H.ph===2&&H.t>H.dur){H.ph=3;H.t=0}else if(H.ph===3&&H.t>16){H.ph=4;H.t=0;H.lull=rr(35,60)}
     else if(H.ph===4&&H.t>H.lull){H.ph=1;H.t=0;H.dur=rr(70,110)}}
   const gT=H.ph===1?ss(0,3,H.t):H.ph===2?1-ss(4,18,H.t):0,hT=H.ph===2?ss(0,5,H.t)*(.85+.15*Math.sin(H.t*.7)):H.ph===3?1-ss(0,16,H.t):0;
   WX.gf+=(gT-WX.gf)*(dt>0?1-Math.exp(-dt*(gT>WX.gf?2.2:.6)):1);WX.hf+=(hT-WX.hf)*(dt>0?1-Math.exp(-dt*1.4):1);
   WX.hr=on&&(Ct.hailLv||1)>1?(H.ph===2||H.ph===3?.42+.2*WX.hf:H.ph===4?.32*(1-ss(10,30,H.t)):.1):0;
   const sun=(1-LK.night)*(LK.day+.5*LK.sunrise+.5*LK.sunset)*(1-ss(.5,.85,WX.ovc));
   if(dt<=0){if(on){WX.hc=Math.max(WX.hc,.85);WX.hp=Math.max(WX.hp,.8)}}
   else{const mel=WX.hc>0?(.0028+.006*sun+.004*WX.hr)*(1-.6*WX.hf):0;
     WX.hc=cl(WX.hc+dt*(WX.hf*.03*(1.05-WX.hc)-mel),0,1);
     WX.hm=cl(WX.hm+dt*(mel*1.6*ss(0,.15,WX.hc+WX.hm)-WX.hm*(.003+.009*sun)*(WX.hc<.05?1:.3)),0,1);
     WX.hp=cl(WX.hp+dt*(WX.hf*.05-(.0012+.006*st.wn)*(1-WX.hf)),0,1)}
   WX.hcold=WX.hf>.05||WX.gf>.3||WX.hc>.3?1:WX.hf<.02&&WX.hc<.15?0:WX.hcold}
  WX.cold=WX.fcold||WX.scold||WX.hcold?1:0;
  WX.sunK=(1-.72*WX.ovc)*(1-.8*WX.dust)*(1-.62*WX.fa);
  /* lightning runs on the scene's own clock (the app's strike timer is ignored here); between strikes the deck flickers with cloud flashes */
  if(w==="storm"&&WX.rain>.5){WX.nb-=dt;if(WX.nb<0){WX.nb=rr(7,18);strike(rr(.3,1))}}else WX.nb=rr(2,5);
  WX.bAge+=dt;const b=WX.bAge;
  WX.bolt=b<.6?Math.max(0,1-b/.6)*(b<.07||(b>.14&&b<.2)||(b>.3&&b<.34)?1:.25):0;
  if(w==="storm"&&WX.rain>.5){WX.ic-=dt;if(WX.ic<0){WX.ic=rr(2.5,8);WX.icF=1;WX.icA=rr(-Math.PI,Math.PI)}}
  WX.icF=Math.max(0,WX.icF-dt*3.5);
  WX.flash=Math.max(WX.bolt,WX.icF*.35*(.6+.4*Math.sin(st.t*61)));
  st.wn=Math.max(st.wn,WX.dust*1.05,w==="storm"?.35+.45*WX.rain:0,w==="hail"?.3+.62*WX.gf+.18*WX.hf:0)}
/* far: 0 overhead .. 1 at the horizon; the bolt falls somewhere in front of the camera, lower and smaller the farther it is */
function strike(far){WX.bAge=0;WX.boltA=wrapA(Math.atan2(-De.matrixWorld.elements[8],-De.matrixWorld.elements[10])+(rnd()<.5?-1:1)*rr(.3,.7));
  WX.boltS=rr(0,100);WX.boltE=SKY_HOR-mix(.12,.02,far);thunder(far)}
window.__desThn=()=>{};

function applyLighting(dt){
  const ph=phaseNow();st.phase=ph;
  const k=dt>0?ease(1.6,dt):1;for(const p in LK)LK[p]+=((p===ph?1:0)-LK[p])*k;
  st.night=LK.night;st.day=LK.day;
  if(Ct.mode==="night"){Ct.mode="full";Ct.night=true}
  if(!(st.lock&&st.wxEase&&dt===0))wxUpdate(dt);
  const el=blendL("el")*D2R,nk=LK.night,ao=blendL("az")*D2R,snK=ss(0,.55,WX.sf),hK=ss(0,.5,Math.max(WX.hf,.75*WX.gf,.6*WX.hr));
  const a=nk>.5?moonAzL+YAW:SUN.lazL+YAW+ao;
  const d=new V3(Math.cos(el)*Math.sin(a),Math.sin(el),Math.cos(el)*Math.cos(a));
  if(pi){pi.position.copy(d).multiplyScalar(40);if(pi.target){pi.target.position.set(0,-1,0);pi.target.updateMatrixWorld()}
    blendC("col",pi.color);pi.color.lerp(_c1.set("#dfe4ee"),.5*WX.ovc).lerp(_c1.set("#e89a58"),.75*WX.dust).lerp(_c1.set("#f1ece4"),.55*WX.fa).lerp(_c1.set("#ffc27a"),.4*WX.clr).lerp(_c1.set("#d3e0f4"),.65*snK).lerp(_c1.set("#c4d4c8"),.55*hK);
    pi.intensity=blendL("I")*WX.sunK+WX.flash*2.4;pi.castShadow=true;tentU.uSunD.value.copy(d);tentU.uSunC.value.copy(pi.color).multiplyScalar(pi.intensity);tentU.uNt.value=nk;
    const sc=pi.shadow.camera;if(sc.right!==12.5){Object.assign(sc,{left:-12.5,right:12.5,top:12.5,bottom:-12.5,near:1,far:90});sc.updateProjectionMatrix()}
    pi.shadow.bias=-.0004;pi.shadow.normalBias=.025;pi.layers.enable(3);
    /* the hidden courtyard stays on layer 0; at low sun/moon its walls would shade the whole island */
    if(pi.shadow.camera.layers.mask!==L3){if(_shMask==null)_shMask=pi.shadow.camera.layers.mask;pi.shadow.camera.layers.mask=L3}}
  if(dc){blendC("sky",dc.color);dc.color.lerp(_c1.set("#a4acb8").multiplyScalar(1-.9*nk),.6*WX.ovc).lerp(_c1.set("#c08e5c").multiplyScalar(1-.9*nk),.8*WX.dust).lerp(_c1.set("#d6dade").multiplyScalar(1-.85*nk),.6*WX.fa).lerp(_c1.set("#a9b8cf").multiplyScalar(1-.8*nk),.6*snK).lerp(_c1.set("#8a9d92").multiplyScalar(1-.85*nk),.6*hK);
    if(dc.groundColor)blendC("gnd",dc.groundColor);
    dc.intensity=blendL("hI")*(1+.2*WX.ovc+.7*WX.dust+.55*WX.fa)*(1-.35*WX.dark)+WX.flash*1.6;dc.layers.enable(3)}
  if(Cn){Cn.toneMappingExposure=blendL("exp")*(1+.1*WX.ovc);Cn.shadowMap.enabled=true}
  /* the shared sky: follows the camera, lowered onto the cloud sea's horizon, sun and colours from the desert's own light */
  const as=appSkyMesh();
  if(as){as.layers.enable(3);as.visible=true;as.position.set(De.position.x,De.position.y-VD_DROP,De.position.z)}
  const sunVis=(1-nk)*(1-ss(.45,.85,WX.ovc))*(1-.85*WX.dust);
  if(jt){const sa=sunAzW()+ao,se=blendL("sel")*D2R;jt.sunDir.value.set(Math.cos(se)*Math.sin(sa),Math.sin(se),Math.cos(se)*Math.cos(sa));skyU.uVdSun.value.copy(jt.sunDir.value);
    const lo=LK.sunset+LK.sunrise;
    if(jt.uSunVis)jt.uSunVis.value=sunVis*.95*(1-.8*WX.fa);
    if(jt.uSunDisk)jt.uSunDisk.value.set(1,mix(mix(.62,.97,LK.day),.72,WX.dust),mix(mix(.3,.88,LK.day),.5,WX.dust));
    if(jt.uGlowA)jt.uGlowA.value=lo*.9*(1-ss(.3,.85,WX.ovc))*(1-WX.dust);
    if(jt.uGlowC)blendC("glow",_c3),jt.uGlowC.value.set(_c3.r,_c3.g,_c3.b);
    blendC("top",_c1);blendC("bot",_c2);
    const oc=Math.min(.95,.85*WX.ovc+.35*WX.rain);_c3.set("#6e7786").multiplyScalar(mix(1,.1,nk));_c1.lerp(_c3,oc);_c3.set("#aab2bd").multiplyScalar(mix(1,.12,nk));_c2.lerp(_c3,oc);
    _c1.multiplyScalar(1-.55*WX.dark);_c2.multiplyScalar(1-.5*WX.dark);
    _c3.set("#86643f").multiplyScalar(mix(1,.08,nk));_c1.lerp(_c3,WX.dust);_c3.set("#c49564").multiplyScalar(mix(1,.08,nk));_c2.lerp(_c3,WX.dust);
    _c3.set("#c3c8cc").multiplyScalar(mix(1,.13,nk));_c1.lerp(_c3,.8*WX.fa);_c3.set("#dcdcd6").multiplyScalar(mix(1,.14,nk));_c2.lerp(_c3,.85*WX.fa);
    _c3.set("#7787a0").multiplyScalar(mix(1,.14,nk));_c1.lerp(_c3,.8*snK);_c3.set("#b4bfcf").multiplyScalar(mix(1,.15,nk));_c2.lerp(_c3,.82*snK);
    /* a hail cell's base is dark and green-grey (the deep cloud scatters the light it lets through toward green) */
    _c3.set("#47594f").multiplyScalar(mix(1,.12,nk));_c1.lerp(_c3,.88*hK);_c3.set("#7f9286").multiplyScalar(mix(1,.13,nk));_c2.lerp(_c3,.8*hK);
    jt.top.value.copy(_c1);jt.bot.value.copy(_c2);if(jt.uDark&&hK>.01)jt.uDark.value=Math.max(jt.uDark.value,.92*hK);
    if(/rain|storm|snow|hail/.test(Ct.weather)&&jt.uCover)jt.uCover.value=mix(jt.uCover.value,.3+.62*WX.ovc,.9);
    if(WX.dust>.01&&jt.uCover)jt.uCover.value=mix(jt.uCover.value,.9,WX.dust);
    if(jt.moonDir){const ma=moonAzL+YAW,me=24*D2R;jt.moonDir.value.set(Math.cos(me)*Math.sin(ma),Math.sin(me),Math.cos(me)*Math.cos(ma))}
    if(jt.flash)jt.flash.value=WX.flash*.5;if(jt.uMist){jt.uMist.value=WX.fa*(1-.5*nk);jt.uMistC.value=WX.clr}}
  skyU.uK.value.set(LK.sunset,LK.day,LK.night,LK.sunrise);skyU.uSunVis.value=sunVis;skyU.uExpo.value=Cn?Cn.toneMappingExposure:1;skyU.uCon.value=mix(1.06,1.1,LK.sunset);
  skyU.uCov.value=WX.ovc;skyU.uDark.value=WX.dark;skyU.uHg.value=hK;skyU.uDust.value=WX.dust;skyU.uRain.value=WX.rain;skyU.uShaft.value=WX.shaft*(1-WX.dust);skyU.uRb.value=WX.rb;
  skyU.uDustC.value.set("#b98a5c").multiplyScalar(mix(1,.07,nk)*(1-.3*WX.dark));
  {const ma=moonAzL+YAW;skyU.uMoonW.value.set(Math.sin(ma),.3,Math.cos(ma));skyU.uMoonL.value=jt&&jt.uMoonVis?cl(jt.uMoonVis.value*1.2,.25,1):1}
  skyU.uBolt.value=WX.bolt;skyU.uBoltA.value=WX.boltA;skyU.uBoltS.value=WX.boltS;skyU.uBoltE.value=WX.boltE;
  skyU.uIc.value=WX.icF*(.6+.4*Math.sin(st.t*47));skyU.uIcA.value=WX.icA;
  skyU.uRbDir.value.copy(d).negate();
  [X.Dc,X.qc].forEach(o=>{if(o&&o.layers)o.traverse(c=>c.layers.disable(3))});
  /* dust and heavy rain close the air in; the haze is lit like the sky */
  /* the island's centre stays at most ~70% fogged however far the camera is (the phone view sits ~60 out) */
  if(Jt.fog){const dz=WX.dust,fd=ss(0,.25,dz),far=Math.max(mix(mix(900,150,ss(.3,1,Math.max(WX.rain,.75*WX.sf,.8*WX.hf))*.85),mix(240,34,ss(.3,1,dz)),fd),De.position.distanceTo(_v.setFromMatrixPosition(W.matrixWorld))/.69);
    const cdw=De.position.distanceTo(_v.setFromMatrixPosition(W.matrixWorld)),fk=.72*WX.fa;Jt.fog.far=mix(far,Math.min(far,cdw*2.4),fk);Jt.fog.near=mix(far*mix(.45,.04,fd),cdw*.4,fk);
    _c1.copy(jt?jt.bot.value:_c1.set("#c8b8b0")).multiplyScalar(.9);Jt.fog.color.copy(_c1).lerp(skyU.uDustC.value,ss(0,.2,dz))}
  const g=gradeM.uniforms;g.uCon.value=blendL("con")*(1-.45*WX.ovc)*(1-.5*WX.fa);g.uSat.value=blendL("sat")*(1-.25*WX.ovc)*(1-.22*WX.dust)*(1-.25*WX.fa)*(1-.2*snK)*(1-.18*hK);g.uRay.value=blendL("ray")*(1-WX.ovc)*(1-WX.dust)*(1-.6*WX.fa)+.3*WX.clr;g.uVig.value=blendL("vig")+.12*WX.dust;g.uLift.value=blendL("lift")+.02*WX.dust;
  g.uTint.value.set(0,0,0);for(const p in LK){const t=LIT[p].tint;g.uTint.value.x+=t[0]*LK[p];g.uTint.value.y+=t[1]*LK[p];g.uTint.value.z+=t[2]*LK[p]}
  g.uTint.value.lerp(_v.set(.97,.99,1.03),.5*WX.ovc).lerp(_v.set(1.07,.97,.84),.7*WX.dust).lerp(_v.set(1.05,.99,.9),.45*WX.clr).lerp(_v.set(.94,.99,1.08),.6*snK).lerp(_v.set(.9,1.04,.95),.75*hK);
  {const F=FOGD,on=WX.fog>.004;F.g.visible=on;if(on){const u=F.U,wn=st.wn;u.uT.value=st.t;u.uB.value=WX.fb;u.uClr.value=WX.clr;u.uWD.value.set(WIND.x,WIND.z);
    /* radiation fog only forms in still air: a breeze carries the banks downwind, stretches them along the wind and tears holes
       in them, and a fresh wind mixes most of it away */
    const v=dt>0?dt*(.15+2.4*wn*wn):0;u.uWS.value=ss(.1,1,wn);u.uAdv.value.x+=WIND.x*v;u.uAdv.value.y+=WIND.z*v;u.uK.value=WX.fog*(1-.6*ss(.4,1.1,wn));
    /* lit like any scatterer: the sky's fill from every side plus the sun or moon without the cosine a surface would take */
    u.uC.value.set(0,0,0);if(dc)u.uC.value.copy(dc.color).multiplyScalar(dc.intensity*1.1);if(pi)u.uC.value.add(_c1.copy(pi.color).multiplyScalar(pi.intensity*.62));u.uC.value.multiplyScalar(.3183*1.8*(1+1.5*nk));{const c=u.uC.value,l=.3*c.r+.59*c.g+.11*c.b;c.lerp(_c1.setRGB(l,l*1.01,l*1.04),.62)}
    u.uCG.value.copy(pi?pi.color:_c1.set("#ffc27a")).multiplyScalar((pi?pi.intensity:2)*.3183*1.25).lerp(_c1.set("#ffb45e").multiplyScalar(.95),.35)}}
  g.uAsp.value=innerWidth/Math.max(1,innerHeight);
  sandU.uNight.value=nk;rockU.uNight.value=nk;sandU.uRip.value=1+nk*.9;
}
const _sp=new V3();
function sunScreen(){
  const a=sunAzW()+blendL("az")*D2R,e=mix(SKY_HOR+.035,46*D2R,LK.day);skyU.uSunDir.value.set(Math.cos(e)*Math.sin(a),Math.sin(e),Math.cos(e)*Math.cos(a));
  _sp.copy(skyU.uSunDir.value).multiplyScalar(100).add(De.position).project(De);
  const inF=_sp.z<1&&Math.abs(_sp.x)<1.4&&Math.abs(_sp.y)<1.4;
  gradeM.uniforms.uSun.value.set(_sp.x*.5+.5,_sp.y*.5+.5);gradeM.uniforms.uSunOn.value=inF?(1-ss(1,1.4,Math.max(Math.abs(_sp.x),Math.abs(_sp.y))))*(1-LK.night):0}

/* phones redraw the shadow map every other frame: the dunes and the rim rock are most of its cost and move only with the sun */
let _shF=0;
function update(dt){
  if(!root.visible)return;
  if(MOB&&Cn){Cn.shadowMap.autoUpdate=false;if(!(_shF++&1))Cn.shadowMap.needsUpdate=true}
  if(st.lock){applyLighting(0);sunScreen();return}
  step(Math.min(dt,.05))}
function step(dt){
  dt*=st.ts;st.t+=dt;
  /* follow the wind slider in scene time: the app's own smoothed uniform only advances on real frames */
  const wT=Number.isFinite(+Ct.wind)?+Ct.wind:.35;WNS.v=dt>0?WNS.v+(wT-WNS.v)*(1-Math.exp(-dt*1.1)):wT;st.wn=WNS.v;
  applyLighting(dt);
  skyDome.position.copy(De.position);skyU.uT.value=st.t;skyU.uYaw0.value=168*D2R+st.t*.0012*(.5+st.wn);
  sunScreen();
  for(const f of UPD)f(dt,st.t)}
/* ---------------- per-frame scene life ---------------- */
const _cl=new V3();
UPD.push((dt,t)=>{
  const wn=st.wn,nk=st.night;
  _cl.copy(De.position);W.worldToLocal(_cl);
  /* wind: shared gust clock, dune creep, drifting-sand phase */
  WS.d+=(wn-WS.d)*Math.min(1,dt*(wn>WS.d?.5:.15));WS.ph+=dt*(.012+.05*WS.d);
  WS.a=WS.pin!=null?WS.pin:DUNE.yaw+(.1+.4*ss(.4,1.1,WS.d))*(.62*Math.sin(WS.ph*1.3)+.38*Math.sin(WS.ph*2.9+1.1));
  WIND.x=Math.cos(WS.a);WIND.z=-Math.sin(WS.a);sandU.uWD.value.set(WIND.x,WIND.z);
  /* the ripples lie across the prevailing wind, not the gust of the moment: they swing round to a lasting change over a minute
     or so in a strong wind and several in a light one, and hardly at all on wet sand */
  WS.ra+=wrapA(WS.a-WS.ra)*(1-Math.exp(-dt*(.0016+.009*ss(.3,1,WS.d))*(1-.9*WX.wet)));sandU.uRipDir.value.set(Math.cos(WS.ra),-Math.sin(WS.ra));smokeU.uWind.value.set(WIND.x,0,WIND.z);rainU.uWD.value.set(WIND.x,WIND.z);
  GUST.t+=dt;sandU.uGT.value=GUST.t;
  const wd=WS.d,gD=gustAt(DUNE0.x,DUNE0.z),wk=ss(.04,.35,wd)*(.5+wd*1.4);
  const snL=1-.85*WX.sc;
  duneEvolve(dt*(.35+.9*gD)*wk*(1-.9*WX.wet)*snL*(1+2.5*WX.dust));CURK=ss(.4,.92,wd)*(1-.9*WX.wet)*snL*(1+1.8*WX.dust);
  sandU.uDA.value.set(DP.x,DP.z,DP.H,DP.w);sandU.uDB.value.set(DP.Lw,DP.Ll,DP.cv,DP.sk);
  /* sand only moves above a threshold wind (saltation): a light breeze leaves the surface still, a strong wind sets fast, dense
     streamers running down it; streak speed follows the wind */
  /* saltation stays off in a light breeze and comes on hard once the wind is up, so a low/high pair does not look like the same exposure */
  const salt=ss(.3,.78,wd);SALT=salt;
  sandU.uFlowT.value+=dt*(.5+3.8*gD)*(.08+wd*wd*4.2);sandU.uRipPh.value+=dt*.1*(.3+gD)*wk;sandU.uFlowK.value=salt*cl(.15+wd*2.05,0,2.15)*(1-.85*WX.wet)*snL*(1+1.3*WX.dust);
  sandU.uWetK.value=Math.max(WX.wet,.1*WX.dew);sandU.uSnow.value=WX.sc;sandU.uSnM.value=WX.sm;sandU.uSnP.value=WX.sp;sandU.uMW.value=WX.mw;sandU.uHC.value=WX.hc;sandU.uHP.value=WX.hp;sandU.uHM.value=WX.hm;sandU.uPitK.value=WX.pit;sandU.uHeat.value=WX.heat;sandU.uTm.value=t;tentU.uT.value=t;tentU.uRn.value=Math.max(ss(.03,.4,WX.rain),ss(.9,1,WX.after));if(jt){sandU.uMirC.value.copy(jt.bot.value).lerp(jt.top.value,.08);sandU.uMirB.value.copy(jt.bot.value).lerp(jt.top.value,.7)}
  mirP.enabled=root.visible&&WX.heat>.01;mirM.uniforms.uT.value=t;mirM.uniforms.uSky.value.copy(sandU.uMirC.value);
  /* the low sun warms the air layer, so the mirrored sky comes back amber at dusk */
  mirM.uniforms.uTint.value.set(.95,.95,.95).lerp(_mirW,Math.max(LK.sunset,LK.sunrise*.7));rockU.uWetK.value=WX.wet;tentU.uWetC.value=Math.max(WX.wet,.42*WX.dew);propU.uDew.value=WX.dew;coatU.uDew.value=WX.dew;propU.uFrost.value=WX.frost;tentU.uFrost.value=.8*WX.frost;propU.uSnL.value=WX.scp;tentU.uSnL.value=WX.scp;rockU.uT.value=t;rockU.uVen.value=(.8+.18*Math.min(sfU.uFR.value,1.6))*(1-.3*WX.wet);
  pondU.uRainP.value=WX.rain;pondU.uIce.value=WX.ice;if(Jt.fog){pondU.uFogC.value.copy(Jt.fog.color);pondU.uFogNF.value.set(Jt.fog.near,Jt.fog.far)}
  if(pi){sandU.uLd.value.copy(pi.position).normalize();
    _c1.copy(pi.color).multiplyScalar(pi.intensity);_c2.copy(dc?(dc.groundColor||dc.color):_c1).multiplyScalar(dc?dc.intensity:0);
    curU.uCol.value.set("#f0d2a0").multiply(_c1.clone().multiplyScalar(.5).add(_c2.clone().multiplyScalar(.5)).add(dc?dc.color.clone().multiplyScalar(dc.intensity):_c2));
    curU.uSheen.value.set("#ffb45c").multiply(_c1).multiplyScalar(.55);
    /* a low red sun saturates the airborne sand into glowing orange: grey it toward its own brightness and dim it as the sun warms */
    const wS=ss(.25,.8,1-pi.color.b/Math.max(pi.color.r,1e-3)),cu=curU.uCol.value,lu=cu.r*.3+cu.g*.59+cu.b*.11;
    cu.lerp(_c3.setRGB(lu,lu,lu),.45*wS).multiplyScalar(1-.2*wS);curU.uSheen.value.multiplyScalar(1-.55*wS)}
  curU.uT.value=t;curU.uNt.value=nk;curtainUpdate(t);
  const gT=gustAt(TENT.x,TENT.z);
  vegU.uT.value=t;vegU.uWind.value=.4+wn;propU.uT.value=t;propU.uWind.value=(.4+wn)*(.55+.9*gT);cactusLod();
  pondU.uT.value=t;pondU.uWind.value=wn;pondU.uNight.value=nk;pondU.uCamL.value.copy(_cl);
  {const d=pi.position.clone().normalize();d.applyAxisAngle(new V3(0,1,0),-YAW);pondU.uSunL.value.copy(d);pondU.uSunCol.value.copy(pi.color)}
  pondU.uSkyA.value.set(nk>.5?"#1a2440":st.day>.5?"#a8c4dc":"#d4aab8");sandU.uHaze.value.copy(pondU.uSkyA.value);pondU.uSkyB.value.set(nk>.5?"#0c1428":st.day>.5?"#5c88c0":"#7a6eb0");
  smokeU.uT.value=t;smokeU.uG.value+=(gustAt(FIRE.x,FIRE.z)-smokeU.uG.value)*Math.min(1,dt*1.5);smokeU.uCamL.value.copy(_cl);smokeU.uCol.value.setRGB(mix(.6,.3,nk),mix(.56,.31,nk),mix(.54,.38,nk));smokeU.uNt.value=nk;
  SMOKE.forEach(m=>{m.material.uniforms.uT.value=t});
  tentU.uWInv.value.copy(W.matrixWorld).invert();
  fireU.uT.value=t;fireU.uNight.value=nk;
  /* rain drowns the flames to a sputter over glowing embers, and the light goes down with them */
  const rk=ss(.08,.55,WX.rain),fr=(1-.8*rk)*(1-.35*ss(.02,.3,WX.rain)*(.5+.5*Math.sin(t*11+3*Math.sin(t*4.3))));
  if(fireL)fireL.intensity=mix(.6,5,nk)*(1+.12*Math.sin(t*9)+.07*Math.sin(t*23))*(.3+.7*fr);
  if(fireG.userData.flames)fireG.userData.flames.forEach(o=>o.f.scale.set(o.s.x*(.5+.5*fr),o.s.y*fr,1));
  smokeU.uStm.value=ss(.02,.3,WX.rain);
  if(fireG.userData.charM)fireG.userData.charM.emissiveIntensity=mix(.25,.9,nk)*(1+.2*Math.sin(t*5));
  {const on=mix(.75,1,ss(.25,.7,nk))*(1-ss(.08,.4,WX.rain));SPK.o.visible=on>.01;
   if(on>.01){if(rnd()<dt*mix(7,10,nk))sparkOut(1,false);
     if(st.t>SPK.pop){SPK.pop=st.t+rr(1.2,4.5);sparkOut(Math.floor(rr(6,15)),true);shotS(pick(["dPop1","dPop2","dPop3"]),.55*on,_fiP.set(FIRE.x,fireG.position.y+.3,FIRE.z),5,rr(.9,1.12))}
     const sw=.3+wn;for(let i=0;i<SPK.n;i++){const q=SPKP[i],o=i*3;if(q.life<1){q.life+=dt/q.dur;q.vy*=Math.exp(-dt*.7);q.ph+=dt*9;
       q.x+=(q.vx+WIND.x*sw*q.life*1.4+Math.sin(q.ph)*.12)*dt;q.z+=(q.vz+WIND.z*sw*q.life*1.4+Math.cos(q.ph*1.3)*.12)*dt;q.y+=q.vy*dt}
       SPK.P[o]=q.x;SPK.P[o+1]=q.y;SPK.P[o+2]=q.z;SPK.Z[i]=(.7+.5*(1-q.life))*mix(1.3,1,nk);
       SPK.A[i]=q.life<1?on*Math.pow(1-q.life,1.6)*(.55+.45*Math.sin(q.ph*2.3))*2.2:0}
     SPK.g.attributes.position.needsUpdate=SPK.g.attributes.a.needsUpdate=SPK.g.attributes.z.needsUpdate=true;SPK.m.uniforms.uH.value=innerHeight}}
  if(RACK.cloths){const gR=gustAt(RACK.x,RACK.z),F=wn*(.35+1.1*gR),wN=WIND.x*Math.sin(RACK.yaw)+WIND.z*Math.cos(RACK.yaw),push=(wN<0?-1:1)*(.3+.7*Math.abs(wN));
    for(const c of RACK.cloths)clothStep(c,F,push,gR,t,dt)}
  /* sand wisps: grains hop and drift with the local gust */
  for(let i=0;i<SAND.n;i++){const q=SANDP[i];q.life+=dt/q.dur;
    if(q.life>=1){sandSeed(i,false);continue}
    const gq=gustAt(q.x,q.z),sp=(.2+1.3*wd)*(.35+1.3*gq)*(1+1.2*WX.dust)*q.s;
    q.x+=(WIND.x-WIND.z*q.lat)*dt*sp;q.z+=(WIND.z+WIND.x*q.lat)*dt*sp;q.y+=q.vy*dt*(.5+gq);const g=hTop(q.x,q.z);if(q.y<g+.03)q.y=g+.03;
    q.vy+=(q.crest?-.08:-.02)*dt;
    const o=i*3;SAND.P[o]=q.x;SAND.P[o+1]=q.y;SAND.P[o+2]=q.z;
    SAND.A[i]=Math.sin(q.life*Math.PI)*(q.crest?.34:.16)*SALT*(.08+wd*wd*1.7+wd*.2)*(.25+gq)*(1-ss(.86,.97,sN(q.x,q.z)))*(1-.92*WX.wet)*snL*(1+1.5*WX.dust)}
  SAND.g.attributes.position.needsUpdate=SAND.g.attributes.a.needsUpdate=true;SAND.m.uniforms.uH.value=innerHeight;
  SAND.m.uniforms.uC.value.copy(curU.uCol.value).multiplyScalar(1.15);
  sandFallsUpdate(dt,t,wd,nk);
  /* fireflies */
  const ffK=Math.max(0,1-WX.rain*3)*Math.max(0,1-WX.dust*3)*Math.max(0,1-WX.hf*3)*(1-ss(.1,.6,Math.max(WX.sf,WX.sc)));
  FF.o.visible=nk>.3&&ffK>.01;
  FFR.o.visible=FF.o.visible;
  if(FF.o.visible){const wy=POND.wy,cy=_cl.y;for(let i=0;i<FF.n;i++){const f=FFP[i],o=i*3;f.ph+=dt*f.sp;
    const x=f.x+Math.sin(f.ph*1.3)*f.rw,z=f.z+Math.cos(f.ph)*f.rw;if(f.gy==null)f.gy=Math.max(hTop(f.x,f.z),pN(f.x,f.z)<1?wy:-99);
    const y=f.gy+f.y+Math.sin(f.ph*2.1)*(f.shore?.04:.35*Math.min(1,f.rw*1.5));FF.P[o]=x;FF.P[o+1]=y;FF.P[o+2]=z;
    /* the ones down in the plants also glow faintly between flashes */
    const a=FF.A[i]=(f.hide?0:ss(.3,.8,nk)*ffK*((f.lo||0)+(1-(f.lo||0))*Math.pow(Math.max(0,Math.sin(t*f.bl+f.ph*3)),3))*.9);
    let ra=0;if(cy>wy+.02&&y>wy){const my=2*wy-y,k=(cy-wy)/(cy-my),rx=_cl.x+(x-_cl.x)*k,rz=_cl.z+(z-_cl.z)*k;
      if(pN(rx,rz)<.97){ra=a*.45*(.8+.2*Math.sin(t*7+i));FFR.P[o]=rx;FFR.P[o+1]=wy+.004;FFR.P[o+2]=rz;FFR.Z[i]=FF.Z[i]*k}}
    FFR.A[i]=ra}
    FF.g.attributes.position.needsUpdate=FF.g.attributes.a.needsUpdate=true;FF.m.uniforms.uH.value=innerHeight;
    FFR.g.attributes.position.needsUpdate=FFR.g.attributes.a.needsUpdate=FFR.g.attributes.z.needsUpdate=true;FFR.m.uniforms.uH.value=innerHeight}
  renderPondReflection();
});
/* ---------------- weather in the air: rain, splashes, blowing dust ----------------
   All of it moves on the GPU. Drops fall at 6.5-9.5 m/s, drift with the wind, stop on the sand or the pond (a baked height
   map of the island) or fall on past the rim into the cloud sea; showers pass as cells, so rain is patchy until it sets in.
   Splashes spark where drops land. Dust-storm puffs (6-14 m) stream low and fast downwind. */
const HMAP=(()=>{const N=128,x0=-27,z0=-23,w=54,d=46,c=document.createElement("canvas");c.width=c.height=N;const g=c.getContext("2d"),D=g.createImageData(N,N);
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){const x=x0+i/(N-1)*w,z=z0+j/(N-1)*d,o=(j*N+i)*4;let v=0;
    if(sN(x,z)<.985){const h=pN(x,z)<1?POND.wy:hTop0(x,z);v=1+Math.round(cl((h+2.5)/12,0,1)*254)}
    D.data[o]=D.data[o+1]=D.data[o+2]=v;D.data[o+3]=255}
  g.putImageData(D,0,0);const t=new T.CTex(c);t.colorSpace="";t.generateMipmaps=false;t.minFilter=t.magFilter=1006;t.flipY=false;t.needsUpdate=true;
  return{t,v:new T.V4(x0,z0,w,d)}})();
const GLSL_HM=`uniform sampler2D uHT;uniform vec4 uHM;
  float gH(vec2 p){vec2 uv=(p-uHM.xy)/uHM.zw;if(uv.x<0.||uv.y<0.||uv.x>1.||uv.y>1.)return -80.;float v=texture2D(uHT,uv).r*255.;return v<.6?-80.:(v-1.)/254.*12.-2.5;}`;
/* radiation fog: thin horizontal sheets in island metres; each fills only where it lies inside the fog, which pools in the hollow
   to a level that sinks as it burns off (rim first, pond last), hugs low ground in a thin film, and lifts off the sand from below,
   so dune crests, palm crowns and the tent ridge stand clear; the top catches the low sun gold as it clears */
const FOGD=(()=>{const N=MOB?6:9,y0=-.36,y1=2.15,G=new T.Plane(54,46,1,1);G.rotateX(-Math.PI/2);
  const U={uT:{value:0},uK:{value:0},uB:{value:0},uClr:{value:0},uWS:{value:0},uAdv:{value:new T.V2()},uRipDir:sandU.uRipDir,uC:{value:new C3(1,1,1)},uCG:{value:new C3(1,.7,.4)},uWD:{value:new T.V2(WIND.x,WIND.z)},uHT:{value:HMAP.t},uHM:{value:HMAP.v}},L=[];
  const g=new T.Group();g.visible=false;W.add(g);
  for(let k=0;k<N;k++){const y=y0+(y1-y0)*k/(N-1),m=new T.SM({uniforms:{...U,uY:{value:y}},transparent:true,depthWrite:false,
    vertexShader:`varying vec2 vL;void main(){vL=position.xz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`${GLSL_HM}${GLSL_NOISE}uniform float uT,uK,uB,uClr,uY,uWS;uniform vec3 uC,uCG;uniform vec2 uWD,uAdv,uRipDir;varying vec2 vL;
    void main(){float g=gH(vL);if(g<-50.||uY<g-.02)discard;
      float e=length(vL/vec2(${AX}.,${AZ}.)),rp=length((vL-vec2(${POND.x},${POND.z}))/vec2(13.,10.5)),q=clamp(.55*e+.45*min(rp/1.2,1.),0.,1.);
      float bl=clamp(uB*1.9-(1.-q)*.95,0.,1.);
      vec2 ql=vL-uAdv,p=vec2(dot(ql,uRipDir)*(.15-.07*uWS),dot(ql,vec2(-uRipDir.y,uRipDir.x))*(.15+.03*uWS));float n=dn2(p+uY*.6)*.62+dn2(p*2.7+vec2(5.2,uT*.02))*.38;
      float lp=mix(1.75-.75*smoothstep(.55,1.,e),${(POND.wy-.18).toFixed(2)},bl)+(n-.5)*1.1;
      float ht=max(lp,g+(.4+.25*n)*(1.-bl)*(1.-smoothstep(.9,2.6,g)));
      float d=(1.-smoothstep(ht-.32,ht+.04,uY))*smoothstep(g-.02,g+.14+.55*bl*max(ht-g,0.),uY)*(1.-.45*bl)*(.3-.25*uWS+.85*smoothstep(.22+.22*uWS,.7,n))*(1.-.6*smoothstep(.9,1.04,e))*uK;
      if(d<.004)discard;
      vec3 c=mix(uC,uCG,uClr*max(smoothstep(ht-.75,ht,uY),1.-smoothstep(.05,.6,ht-g))*(.6+.4*n)*.9);
      gl_FragColor=vec4(c,d*${MOB?".42":".32"});
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    }`});const o=new T.Mesh(G,m);o.position.y=y;o.renderOrder=9;o.frustumCulled=false;g.add(o);L.push(o)}
  onDes(g);return{g,L,U}})();
const rainU={uT:{value:0},uRain:{value:0},uWS:{value:1},uWD:{value:new T.V2(WIND.x,WIND.z)},uCamL:{value:new V3()},uCol:{value:new C3()},uHT:{value:HMAP.t},uHM:{value:HMAP.v},uLen:{value:1.1},uRes:{value:new T.V2(1,1)}};
const GLSL_CELL=`float hc(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float nc(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hc(i),hc(i+vec2(1,0)),f.x),mix(hc(i+vec2(0,1)),hc(i+vec2(1,1)),f.x),f.y);}
  float cellK(vec2 p){float n=nc(p*.03-uWD*uT*.11)*.65+nc(p*.08+uWD*uT*.05+3.)*.35;return smoothstep(.0,.3,n+uRain*1.05-.62);}`;
/* drops are drawn as streaks the length a camera shutter smears them (longer far off, where single drops would vanish),
   at least a pixel and a bit wide with their alpha thinned to match, brightest at the head. One layer spans the island;
   a second fills a box that wraps round the camera, so a close view has rain falling right in front of it. */
const RAIN=(()=>{const mk=(n,near)=>{const R=new Float32Array(n*16),C=new Float32Array(n*8),P=new Float32Array(n*12),I=[];
    const cs=[-1,0,1,0,-1,1,1,1];
    for(let i=0;i<n;i++){const x=near?rr(-1,1):rr(-30,30),z=near?rr(-1,1):rr(-26,26),ph=rnd(),sj=rnd();
      for(let e=0;e<4;e++){const o=(i*4+e)*4;R[o]=x;R[o+1]=z;R[o+2]=ph;R[o+3]=sj;C[(i*4+e)*2]=cs[e*2];C[(i*4+e)*2+1]=cs[e*2+1]}
      const b=i*4;I.push(b,b+1,b+2,b+2,b+1,b+3)}
    const g=new T.BG();g.setAttribute("position",new T.BA(P,3));g.setAttribute("aR",new T.BA(R,4));g.setAttribute("aC",new T.BA(C,2));g.setIndex(I);
    const m=new T.SM({uniforms:Object.assign({uNear:{value:near?3.5:0}},rainU),transparent:true,depthWrite:false,side:2,
      vertexShader:`attribute vec4 aR;attribute vec2 aC;uniform float uT,uRain,uWS,uLen,uNear;uniform vec2 uWD,uRes;uniform vec3 uCamL;varying float vA;varying vec2 vC;${GLSL_HM}${GLSL_CELL}
        void main(){float sp=6.5+3.*aR.w,y,fall;vec2 p;
          if(uNear>0.){float B=2.*uNear;y=uCamL.y+mod(-uT*sp-aR.z*B-uCamL.y+uNear,B)-uNear;fall=(uCamL.y+uNear-y)/sp;
            p=uCamL.xz+mod(aR.xy*uNear+uWD*uWS*(fall-1.5)-uCamL.xz+uNear,B)-uNear;}
          else{const float TOP=26.,HC=66.;y=TOP-mod(uT*sp+aR.z*HC,HC);fall=(TOP-y)/sp;p=aR.xy+uWD*uWS*(fall-1.5);}
          float g=gH(p);vec3 H=vec3(p.x,y,p.y),dir=normalize(vec3(uWD.x*uWS,-sp,uWD.y*uWS));
          float d=length(H-uCamL),len=mix(.14,uLen,smoothstep(1.5,22.,d));
          vec4 h=projectionMatrix*modelViewMatrix*vec4(H,1.),t=projectionMatrix*modelViewMatrix*vec4(H-dir*len,1.);
          vC=aC;vA=step(g,y)*cellK(p)*step(aR.w*.9,uRain*1.6)*(.35+.65*smoothstep(260.,25.,d))*smoothstep(-36.,-20.,y)*step(.02,t.w)*step(.02,h.w);
          if(uNear>0.)vA*=smoothstep(uNear,uNear*.6,length(H-uCamL))*smoothstep(.15,.5,d);
          vec2 sd=h.xy/h.w-t.xy/t.w;sd*=uRes;vec2 nd=normalize(vec2(-sd.y,sd.x)+1e-5);
          vec4 c=mix(t,h,aC.y);float px=.004*${S.toFixed(3)}*projectionMatrix[1][1]*uRes.y*.5/max(c.w,.01),wp=max(px,1.3);
          vA*=clamp(px/wp*1.6,.55,1.)*mix(1.,.5,smoothstep(2.,6.,px));c.xy+=nd*aC.x*wp/uRes*c.w;gl_Position=c;}`,
      fragmentShader:`uniform vec3 uCol;varying float vA;varying vec2 vC;void main(){float a=vA*(1.-vC.x*vC.x)*smoothstep(0.,.35,vC.y)*(.5+.5*vC.y);
        if(a<.004)discard;gl_FragColor=vec4(uCol*(1.+.25*vC.y),a*.85);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        }`});
    const o=new T.Mesh(g,m);o.frustumCulled=false;o.renderOrder=8;o.visible=false;W.add(o);return o};
  const far=mk(MOB?1000:2800,0),near=mk(MOB?450:1400,1);return{far,near,set visible(v){far.visible=near.visible=v}}})();
/* splashes: each fires about once a second where the shower is falling; on the pond they are left to the water's rings */
const SPL=(()=>{const n=MOB?450:1400,S0=new Float32Array(n*4),P=new Float32Array(n*3);let k=0;
  while(k<n){const x=rr(-25,25),z=rr(-20,20);if(sN(x,z)>.93||pN(x,z)<1.02)continue;const o=k*4;S0[o]=x;S0[o+1]=z;S0[o+2]=rnd();S0[o+3]=rnd();P[k*3]=x;P[k*3+1]=hTop0(x,z);P[k*3+2]=z;k++}
  const g=new T.BG();g.setAttribute("position",new T.BA(P,3));g.setAttribute("aS",new T.BA(S0,4));
  const m=new T.SM({uniforms:Object.assign({uH:{value:innerHeight}},rainU),transparent:true,depthWrite:false,
    vertexShader:`attribute vec4 aS;uniform float uT,uRain,uH;uniform vec2 uWD;varying float vA,vU;${GLSL_CELL}
      void main(){float r=.8+.7*aS.w,c=uT*r+aS.z,u=fract(c);vU=u;float on=step(hc(vec2(floor(c),aS.z*91.)),uRain*1.3);
        vA=on*cellK(aS.xy)*(1.-smoothstep(.0,.12,u))*step(.003,uRain);
        vec4 mv=modelViewMatrix*vec4(position+vec3(0.,.02+u*.12,0.),1.);gl_Position=projectionMatrix*mv;
        gl_PointSize=clamp(.22*uH*.5/max(.5,-mv.z)*(1.+u*6.),1.5,10.);}`,
    fragmentShader:`uniform vec3 uCol;varying float vA,vU;void main(){vec2 q=gl_PointCoord-.5;float d=length(q)*2.;
      float a=vA*(smoothstep(1.,.6,d)*smoothstep(.0,.5,d)*.7+.3*smoothstep(.6,.0,d));if(a<.004)discard;gl_FragColor=vec4(uCol*1.15,a*.55);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`});
  const o=new T.Points(g,m);o.frustumCulled=false;o.renderOrder=8;o.visible=false;W.add(o);return{o,m}})();
/* rain on the tent: drops burst on the roof cloth; at the eaves water gathers into drops that hang, swell, fall and splash
   on the sand, and they keep dripping for a while after the shower has passed */
const TWS={o:null,U:{uT:{value:0},uRain:{value:0},uDrip:{value:0},uH:{value:innerHeight},uCol:rainU.uCol}};
function tentWater(g){W.updateMatrixWorld(true);const Wi=new T.M4().copy(W.matrixWorld).invert(),M=new T.M4(),v=new V3(),n=new V3(),q=new V3();
  const roof=[],edge=new Map(),ca=Math.cos(TENT.yaw),sa=Math.sin(TENT.yaw),gy=hTop(TENT.x,TENT.z);
  g.traverse(c=>{if(!c.isMesh)return;M.multiplyMatrices(Wi,c.matrixWorld);const P=c.geometry.attributes.position,N=c.geometry.attributes.normal;
    for(let i=0;i<P.count;i++){v.fromBufferAttribute(P,i).applyMatrix4(M);const y=v.y-gy;if(y<.35)continue;
      if(!N)continue;n.fromBufferAttribute(N,i).transformDirection(M);if(n.y>.4&&y>.7&&rnd()<.5)roof.push(v.x,v.y+.02,v.z);if(n.y<.25||y<.6)continue;
      const dx=v.x-TENT.x,dz=v.z-TENT.z,lx=dx*ca-dz*sa,lz=dx*sa+dz*ca,r=Math.hypot(lx/(TENT.L*.5),lz/(TENT.D*.5)),k=Math.round((Math.atan2(lz,lx)+Math.PI)/TAU*40)%40;
      const e=edge.get(k);if(y<2.2&&(!e||r>e.r))edge.set(k,{r,x:v.x,y:v.y,z:v.z})}});
  const nR=Math.min(roof.length/3|0,MOB?160:360),pts=[],at=[];
  for(let i=0;i<nR;i++){const j=(rnd()*roof.length/3|0)*3;pts.push(roof[j],roof[j+1],roof[j+2]);at.push(rnd(),rr(.7,1.4),0,0)}
  edge.forEach(e=>{for(let k=0;k<2;k++){pts.push(e.x+rr(-.06,.06),e.y-.02,e.z+rr(-.06,.06));at.push(rnd(),rr(.45,1.1),1,hTop(e.x,e.z)+.01)}});
  const G=new T.BG();G.setAttribute("position",new T.BA(new Float32Array(pts),3));G.setAttribute("aS",new T.BA(new Float32Array(at),4));
  const m=new T.SM({uniforms:TWS.U,transparent:true,depthWrite:false,
    vertexShader:`attribute vec4 aS;uniform float uT,uRain,uDrip,uH;varying float vA,vK,vU,vSd;
      float hh(float x){return fract(sin(x*12.9898+aS.x*78.2)*43758.5453);}
      void main(){float c=uT*aS.y+aS.x*7.,u=fract(c);vec3 P=position;float sz;vK=aS.z;
        if(aS.z<.5){float k=u/.16;vU=k;vSd=hh(floor(c)+7.);vA=step(hh(floor(c)),uRain*1.1)*step(k,1.);P.y+=k*.03;sz=.07+.1*k;}
        else{/* hang and swell for most of the cycle, then drop; under gravity it takes sqrt(2h/g) to reach the sand */
          float per=1./aS.y,t=max(u-.6,0.)*per,h=P.y-aS.w,tg=sqrt(2.*h/9.8);vA=uDrip*step(hh(floor(c)+3.),.35+.65*uDrip);
          if(t<=0.){sz=.01+.014*u/.6;}else if(t<tg){P.y-=4.9*t*t;sz=.02;}
          else{float k=(t-tg)/.14;vK=2.;P.y=aS.w;vA*=1.-smoothstep(0.,1.,k);sz=.03+.07*k;}}
        vec4 mv=modelViewMatrix*vec4(P,1.);gl_Position=projectionMatrix*mv;
        gl_PointSize=clamp(sz*${S.toFixed(3)}*projectionMatrix[1][1]*uH*.5/max(.05,-mv.z),1.5,40.);}`,
    fragmentShader:`uniform vec3 uCol;varying float vA,vK,vU,vSd;void main(){vec2 q=gl_PointCoord-.5;float d=length(q)*2.,a;
      /* a drop hitting the cloth: a bright flash, then a crown of six to nine droplets flung up and out that fade as they fly */
      if(vK<.5){vec2 c=q*2.+vec2(0.,.35*vU);float an=atan(c.y,c.x),r=length(c),n=floor(6.+3.*vSd);
        float cm=pow(max(0.,cos(an*n+vSd*20.)),18.)*smoothstep(.12,-.3,c.y);
        a=(smoothstep(.16,.0,abs(r-(.2+.62*vU)))*cm*(1.-vU*.7)+smoothstep(.32,.0,r)*smoothstep(.45,0.,vU))*1.2;}
      else if(vK>1.5)a=smoothstep(1.,.65,d)*smoothstep(.2,.6,d)*.8+.25*smoothstep(.5,0.,d);
      else a=smoothstep(1.,.5,d);a*=vA;if(a<.004)discard;
      gl_FragColor=vec4(uCol*(vK>.5&&vK<1.5?1.5:1.25)+.12*smoothstep(.5,.0,length(q+vec2(.15,.15))*2.),a*.75);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`});
  const o=new T.Points(G,m);o.frustumCulled=false;o.renderOrder=8;o.visible=false;W.add(o);onDes(o);TWS.o=o}
UPD.push((dt,t)=>{if(!TWS.o)return;const d=Math.max(ss(.03,.4,WX.rain),ss(.88,1,WX.after)*.8);
  TWS.o.visible=WX.rain>.004||d>.01;if(!TWS.o.visible)return;TWS.U.uT.value=t;TWS.U.uRain.value=WX.rain;TWS.U.uDrip.value=d;TWS.U.uH.value=innerHeight});
/* splash crowns on the pond, in step with its rings (the same cells and phases as the water shader): a drop throws up a thin
   crown of water whose rim breaks into droplets, it falls back, and a little jet rises from the middle as the ring spreads */
const CROWN=(()=>{const pts=[],at=[],Ls=MOB?[0]:[0,1];
  for(const L of Ls){const sc=L===0?2.6:3.7,of=L*7.31;
    for(let cx=Math.floor((POND.x-POND.rx)*sc+of);cx<=Math.ceil((POND.x+POND.rx)*sc+of);cx++)for(let cz=Math.floor((POND.z-POND.rz)*sc+of);cz<=Math.ceil((POND.z+POND.rz)*sc+of);cz++){
      const x=(cx+.5-of)/sc,z=(cz+.5-of)/sc;if(pN(x,z)>.93)continue;pts.push(x,POND.wy+.004,z);at.push(cx,cz,L,0)}}
  const G=new T.BG();G.setAttribute("position",new T.BA(new Float32Array(pts),3));G.setAttribute("aC",new T.BA(new Float32Array(at),4));
  const m=new T.SM({uniforms:{uT:pondU.uT,uRainP:pondU.uRainP,uH:{value:innerHeight},uCol:rainU.uCol},transparent:true,depthWrite:false,
    vertexShader:`attribute vec4 aC;uniform float uT,uRainP,uH;varying float vK,vA,vS;${GLSL_NOISE}
      void main(){float L=aC.z,sc=L<.5?2.6:3.7;vec2 c=aC.xy;float h=dh2(c+L*3.1);vec2 o=(vec2(dh2(c+1.3),dh2(c+2.7))-.5)*.5;
        vec3 P=vec3((c+.5+o-L*7.31)/sc,0.).xzy;P.y=position.y;
        float ph=fract(uT*(.9+.6*h)+h*7.);vK=ph/.3;vS=dh2(c+9.7);vA=step(h,uRainP*1.15)*step(ph,.3);
        vec4 mv=modelViewMatrix*vec4(P+vec3(0.,.025,0.),1.);gl_Position=projectionMatrix*mv;
        float px=.07*(.8+.4*vS)*${S.toFixed(3)}*projectionMatrix[1][1]*uH*.5/max(.05,-mv.z);vA*=smoothstep(4.,9.,px);gl_PointSize=min(px,90.);}`,
    fragmentShader:`uniform vec3 uCol;varying float vK,vA,vS;void main(){vec2 q=gl_PointCoord-.5;q.y=-q.y;float a=0.,y=q.y+.38;
      if(vK<.55){float k=vK/.55,hg=.38*sin(k*3.1416)*(.8+.4*vS),rad=.06+.2*k+max(y,0.)*.45;
        a=smoothstep(.035,.0,abs(abs(q.x)-rad))*step(0.,y)*step(y,hg);
        float e=length(vec2(q.x/max(rad,.01),(y-hg)/(rad*.32+.01)));a=max(a,smoothstep(.2,.0,abs(e-1.))*.7*step(.02,hg));
        for(int i=0;i<6;i++){float an=float(i)/6.*6.2832+vS*6.;vec2 d=vec2(cos(an)*rad*1.1,hg+.05+sin(an)*rad*.32+.08*k)-vec2(q.x,y);a=max(a,smoothstep(.035,.015,length(d))*step(.25,k));}
        a=max(a,smoothstep(.04,.0,abs(length(vec2(q.x,y*3.))-rad))*.6);a*=1.-smoothstep(.75,1.,k);}
      else{float k=(vK-.55)/.45,jh=.32*sin(k*3.1416);a=smoothstep(.03,.0,abs(q.x))*step(0.,y)*step(y,jh)*.8;
        a=max(a,smoothstep(.05,.03,length(vec2(q.x,y-jh-.04)))*step(.15,k));}
      a*=vA;if(a<.01)discard;gl_FragColor=vec4(uCol*1.6+.1,a*.7);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`});
  const o=new T.Points(G,m);o.frustumCulled=false;o.renderOrder=9;o.visible=false;W.add(o);onDes(o);return{o,m}})();
UPD.push(()=>{CROWN.o.visible=WX.rain>.01;if(CROWN.o.visible)CROWN.m.uniforms.uH.value=innerHeight});
/* dust storm: big soft puffs streaming downwind close over the sand, recycled upwind */
const DUST=(()=>{const n=MOB?26:56,P=new Float32Array(n*3),A=new Float32Array(n),Z=new Float32Array(n),Q=[];
  const g=new T.BG();g.setAttribute("position",new T.BA(P,3));g.setAttribute("a",new T.BA(A,1));g.setAttribute("z",new T.BA(Z,1));
  const m=new T.SM({transparent:true,depthWrite:false,uniforms:{uC:{value:new C3()},uH:{value:innerHeight},uT:{value:0}},
    vertexShader:`attribute float a,z;varying float vA,vZ;uniform float uH;void main(){vA=a;vZ=z;vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;
      gl_PointSize=clamp(${(S/.325).toFixed(3)}*z*uH*.5/max(.5,-mv.z),2.,${MOB?260:420}.);}`,
    fragmentShader:`uniform vec3 uC;uniform float uT;varying float vA,vZ;
      float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float nn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
      void main(){vec2 q=gl_PointCoord-.5;float d=dot(q,q)*4.;if(d>1.)discard;
        vec2 s=q*3.+vZ*7.3;float f=nn(s+uT*.15)*.6+nn(s*2.3-uT*.2)*.3+nn(s*5.1)*.1;
        float a=vA*(1.-d)*(1.-d)*smoothstep(.25,.75,f);if(a<.003)discard;gl_FragColor=vec4(uC*(.85+.3*f),a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        }`});
  for(let i=0;i<n;i++){Q.push({x:0,z:0,y:0,s:0,life:rnd(),dur:rr(2.5,5),lat:rr(-1,1)});Z[i]=rr(6,14)}
  const o=new T.Points(g,m);o.frustumCulled=false;o.renderOrder=9;o.visible=false;W.add(o);return{o,P,A,Z,Q,g,m,n}})();
function dustSeed(q){const L=rr(-28,22),lat=rr(-24,24);q.x=-WIND.x*30+L*WIND.x-lat*WIND.z;q.z=-WIND.z*30+L*WIND.z+lat*WIND.x;q.y=rr(0,6);q.life=0;q.dur=rr(3,6);q.s=rr(.8,1.2)}
DUST.Q.forEach(q=>{dustSeed(q);q.life=rnd()});
UPD.push((dt,t)=>{
  const R=WX.rain,nk=st.night,on=R>.004;
  RAIN.visible=on;SPL.o.visible=on;
  if(on){rainU.uT.value=t;rainU.uRain.value=R;rainU.uWS.value=.8+st.wn*3.2;rainU.uCamL.value.copy(_cl);rainU.uLen.value=MOB?1.25:1.1;
    _c1.copy(dc?dc.color:_c1.set("#999")).multiplyScalar(.55).add(_c2.copy(pi?pi.color:_c1).multiplyScalar(.12*(pi?pi.intensity:1)));
    rainU.uCol.value.copy(_c1).multiplyScalar(1.2+WX.flash*1.5);SPL.m.uniforms.uH.value=innerHeight;Cn.getDrawingBufferSize(rainU.uRes.value)}
  const dz=WX.dust;DUST.o.visible=dz>.01;
  if(DUST.o.visible){const sp=(4+10*dz)*(.6+st.wn);DUST.m.uniforms.uT.value=t;DUST.m.uniforms.uH.value=innerHeight;
    DUST.m.uniforms.uC.value.copy(skyU.uDustC.value).multiplyScalar(1.05);
    for(let i=0;i<DUST.n;i++){const q=DUST.Q[i];q.life+=dt/q.dur;q.x+=WIND.x*sp*dt*q.s;q.z+=WIND.z*sp*dt*q.s;
      const gx=hTop(q.x,q.z),inI=sN(q.x,q.z)<1;if(q.life>=1||Math.abs(q.x)>45||Math.abs(q.z)>40){dustSeed(q);continue}
      const o=i*3;DUST.P[o]=q.x;DUST.P[o+1]=(inI?gx:-1)+q.y+Math.sin(t*.7+i)*.4;DUST.P[o+2]=q.z;
      DUST.A[i]=Math.sin(q.life*Math.PI)*ss(.05,.6,dz)*.42}
    DUST.g.attributes.position.needsUpdate=DUST.g.attributes.a.needsUpdate=true}
});
/* desert snow: sparse, tiny dry flakes that fall slowly (about 1 m/s), drift far on the wind and flutter as they come down.
   One layer over the island and one in a box round the camera. Built the first time it snows, so entry pays nothing for it. */
const SNU={uT:{value:0},uSnow:{value:0},uWS:{value:1},uWD:rainU.uWD,uCamL:{value:new V3()},uCol:{value:new C3(1,1,1)},uH:{value:innerHeight},uHT:{value:HMAP.t},uHM:{value:HMAP.v}};
let SNF=null;
function snowFlakes(){const mk=(n,near)=>{const R=new Float32Array(n*4),P=new Float32Array(n*3);
    for(let i=0;i<n;i++){R[i*4]=near?rr(-1,1):rr(-32,32);R[i*4+1]=near?rr(-1,1):rr(-28,28);R[i*4+2]=rnd();R[i*4+3]=rnd()}
    const g=new T.BG();g.setAttribute("position",new T.BA(P,3));g.setAttribute("aR",new T.BA(R,4));
    const m=new T.SM({uniforms:Object.assign({uNear:{value:near?4.5:0}},SNU),transparent:true,depthWrite:false,
      vertexShader:`attribute vec4 aR;uniform float uT,uSnow,uWS,uNear,uH;uniform vec2 uWD;uniform vec3 uCamL;varying float vA;${GLSL_HM}
        void main(){float sp=.75+.55*aR.w,y,fall;vec2 p,sw=vec2(sin(uT*(1.1+.7*aR.z)+aR.w*40.),cos(uT*(.9+.6*aR.w)+aR.z*30.))*(.22+.2*aR.z);
          if(uNear>0.){float B=2.*uNear;y=uCamL.y+mod(-uT*sp-aR.z*B-uCamL.y+uNear,B)-uNear;fall=(uCamL.y+uNear-y)/sp;
            p=uCamL.xz+mod(aR.xy*uNear+uWD*uWS*fall+sw-uCamL.xz+uNear,B)-uNear;}
          else{const float TOP=20.,HC=46.;y=TOP-mod(uT*sp+aR.z*HC,HC);fall=(TOP-y)/sp;p=mod(aR.xy+uWD*uWS*fall+sw+vec2(32.,28.),vec2(64.,56.))-vec2(32.,28.);}
          vec3 H=vec3(p.x,y,p.y);float d=length(H-uCamL);
          vA=step(gH(p),y)*step(aR.w*.95,uSnow*1.1)*smoothstep(-26.,-12.,y)*(.4+.6*smoothstep(220.,20.,d));
          if(uNear>0.)vA*=smoothstep(uNear,uNear*.6,d)*smoothstep(.12,.45,d);
          vec4 mv=modelViewMatrix*vec4(H,1.);gl_Position=projectionMatrix*mv;
          float px=(.01+.008*aR.z)*${S.toFixed(3)}*projectionMatrix[1][1]*uH*.5/max(.02,-mv.z);
          vA*=min(1.,px*px*.6);gl_PointSize=clamp(px*2.4,1.3,9.);}`,
      fragmentShader:`uniform vec3 uCol;varying float vA;void main(){float d=length(gl_PointCoord-.5)*2.,a=vA*smoothstep(1.,.25,d);
        if(a<.004)discard;gl_FragColor=vec4(uCol,a*.9);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        }`});
    const o=new T.Points(g,m);o.frustumCulled=false;o.renderOrder=8;W.add(o);onDes(o);return o};
  SNF=[mk(MOB?1100:2600,0),mk(MOB?260:640,1)]}
UPD.push((dt,t)=>{const on=WX.sf>.004;if(!SNF){if(!on)return;snowFlakes()}
  SNF[0].visible=SNF[1].visible=on;if(!on)return;
  SNU.uT.value=t;SNU.uCamL.value.copy(_cl);SNU.uSnow.value=ss(0,.9,WX.sf);SNU.uWS.value=.6+st.wn*4.2;SNU.uH.value=innerHeight;
  _c1.copy(dc?dc.color:_c1.set("#aab")).multiplyScalar(dc?dc.intensity*.55:.5).add(_c2.copy(pi?pi.color:_c1).multiplyScalar(.16*(pi?pi.intensity:1)));
  SNU.uCol.value.copy(_c1).multiplyScalar(1.15).lerp(_c2.set("#eef3fa"),.35*(1-st.night))});
/* steam fog over the pond on cold days: thin wisps rise off the water, drift downwind and fade within a metre or so.
   As the snow on the tops melts or the wind takes it, clumps drop from the palm crowns and slide off the tent roof. */
const STM=softPoints(MOB?22:40,"#e6e9ec",3.2,false);STM.o.renderOrder=9;STM.o.visible=false;W.add(STM.o);onDes(STM.o);
const STMP=[...Array(STM.n)].map(()=>({life:rnd(),dur:rr(6,12),x:0,z:0,y:0,s:1}));
function stmSeed(q){for(let k=0;k<20;k++){const a=rnd()*TAU,r=Math.sqrt(rnd())*.85;q.x=POND.x+Math.cos(a)*r*POND.rx;q.z=POND.z+Math.sin(a)*r*POND.rz;if(pN(q.x,q.z)<.9)break}
  q.y=POND.wy+rr(0,.15);q.life=0;q.dur=rr(6,12);q.s=rr(.7,1.3)}
STMP.forEach(q=>{const l=q.life;stmSeed(q);q.life=l});
let _scp0=0;
UPD.push((dt,t)=>{const k=WX.stm;STM.o.visible=k>.02;
  if(STM.o.visible){for(let i=0;i<STM.n;i++){const q=STMP[i],o=i*3;q.life+=dt/q.dur;if(q.life>=1)stmSeed(q);
      q.x+=WIND.x*(.12+.5*st.wn)*dt;q.z+=WIND.z*(.12+.5*st.wn)*dt;q.y+=dt*(.05+.03*q.s);
      STM.P[o]=q.x+Math.sin(t*.3+i)*.15;STM.P[o+1]=q.y;STM.P[o+2]=q.z;STM.Z[i]=q.s*(.6+.8*q.life);
      STM.A[i]=k*.16*Math.sin(q.life*Math.PI)*(1-ss(.6,1.3,st.wn))*(pN(q.x,q.z)<1.1?1:.4)}
    STM.g.attributes.position.needsUpdate=STM.g.attributes.a.needsUpdate=STM.g.attributes.z.needsUpdate=true;STM.m.uniforms.uH.value=innerHeight;
    STM.m.uniforms.uC.value.copy(_c1.copy(dc?dc.color:_c1.set("#ccc")).multiplyScalar(dc?dc.intensity*.8:.8)).lerp(_c2.set("#eef0f2"),.3*(1-st.night))}
  /* the snow on the tops lets go in clumps as it goes */
  const ds=_scp0-WX.scp;_scp0=WX.scp;
  if(ds>0&&WX.scp>.03&&dt>0&&rnd()<ds/dt*60*dt){const r=rnd();
    if(r<.7){const pp=PALMS[Math.floor(rnd()*PALMS.length)],T0=pp.g&&pp.g.userData.top;if(T0){const a=rnd()*TAU,d=rr(.6,2.8);hBit("clump",T0.x+Math.cos(a)*d,T0.y-.3-d*.25,T0.z+Math.sin(a)*d,rr(-.2,.2),rr(-.3,0),rr(-.2,.2),3)}}
    else if(TR.ok){const a=rnd()*TAU,ex=TENT.x+Math.cos(a)*TENT.L*.48,ez=TENT.z+Math.sin(a)*TENT.D*.48,h=roofAt(ex*.9+TENT.x*.1,ez*.9+TENT.z*.1);if(h>-50)hBit("clump",ex,h,ez,(ex-TENT.x)*.15,-.2,(ez-TENT.z)*.15,3)}}});
/* ---------------- hail ----------------
   Small hail (0.8-2.4 cm) falls at 9-12 m/s, slanted by the gust. Far off it is drawn as short white streaks on the GPU (built the
   first time it hails). Round the spot the camera looks at, single stones are simulated: they strike, bounce, roll down the
   slope and into the ripple troughs and settle; the ones on exposed sand melt within seconds into dark wet spots, the ones that
   reach a trough lie longer and join the drift the sand shader draws there. They glance off the tent cloth (which shivers and
   drums), crackle through the palm fronds (which twitch and shed shreds), knock the cacti and throw thin white crowns off the
   pond, where they float a moment before they melt. Every strike near the camera is heard on its own surface. */
const HLU={uT:{value:0},uRain:{value:0},uWS:{value:1},uWD:rainU.uWD,uCamL:{value:new V3()},uCol:{value:new C3(1,1,1)},uHT:{value:HMAP.t},uHM:{value:HMAP.v},uRes:{value:new T.V2(1,1)}};
let HLF=null;
function hailStreaks(){const mk=(n,near)=>{const R=new Float32Array(n*16),C=new Float32Array(n*8),P=new Float32Array(n*12),I=[],cs=[-1,0,1,0,-1,1,1,1];
    for(let i=0;i<n;i++){const x=near?rr(-1,1):rr(-30,30),z=near?rr(-1,1):rr(-26,26),ph=rnd(),sj=rnd();
      for(let e=0;e<4;e++){const o=(i*4+e)*4;R[o]=x;R[o+1]=z;R[o+2]=ph;R[o+3]=sj;C[(i*4+e)*2]=cs[e*2];C[(i*4+e)*2+1]=cs[e*2+1]}
      const b=i*4;I.push(b,b+1,b+2,b+2,b+1,b+3)}
    const g=new T.BG();g.setAttribute("position",new T.BA(P,3));g.setAttribute("aR",new T.BA(R,4));g.setAttribute("aC",new T.BA(C,2));g.setIndex(I);
    const m=new T.SM({uniforms:Object.assign({uNear:{value:near?3.5:0}},HLU),transparent:true,depthWrite:false,side:2,
      vertexShader:`attribute vec4 aR;attribute vec2 aC;uniform float uT,uRain,uWS,uNear;uniform vec2 uWD,uRes;uniform vec3 uCamL;varying float vA,vL,vS;varying vec2 vC;${GLSL_HM}${GLSL_CELL}
        void main(){float sp=9.+3.*aR.w,y,fall;vec2 p;
          if(uNear>0.){float B=2.*uNear;y=uCamL.y+mod(-uT*sp-aR.z*B-uCamL.y+uNear,B)-uNear;fall=(uCamL.y+uNear-y)/sp;
            p=uCamL.xz+mod(aR.xy*uNear+uWD*uWS*(fall-1.)-uCamL.xz+uNear,B)-uNear;}
          else{const float TOP=26.,HC=60.;y=TOP-mod(uT*sp+aR.z*HC,HC);fall=(TOP-y)/sp;p=aR.xy+uWD*uWS*(fall-1.);}
          float g=gH(p);vec3 H=vec3(p.x,y,p.y),dir=normalize(vec3(uWD.x*uWS,-sp,uWD.y*uWS));
          float d=length(H-uCamL),len=mix(.011*(.6+.6*aR.w),.06,smoothstep(6.,30.,d));
          vec4 h=projectionMatrix*modelViewMatrix*vec4(H,1.),t=projectionMatrix*modelViewMatrix*vec4(H-dir*len,1.);
          vC=aC;vA=step(g,y)*cellK(p)*step(aR.w*.9,uRain*1.5)*(.45+.55*smoothstep(260.,25.,d))*smoothstep(-36.,-20.,y)*step(.02,t.w)*step(.02,h.w);
          if(uNear>0.)vA*=smoothstep(uNear,uNear*.6,length(H-uCamL))*smoothstep(.15,.5,d);
          vec2 sd=h.xy/h.w-t.xy/t.w;sd*=uRes;vec2 nd=normalize(vec2(-sd.y,sd.x)+1e-5);
          vec4 c=mix(t,h,aC.y);float px=.019*(.6+.6*aR.w)*${S.toFixed(3)}*projectionMatrix[1][1]*uRes.y*.5/max(c.w,.01),wp=max(px,1.5);
          vA*=clamp(px/wp*1.8,.6,1.);vL=length(sd)/wp;vS=fract(aR.z*7.31+aR.w*3.7)*6.2832;
          c.xy+=(nd*aC.x+normalize(sd+1e-5)*(aC.y*2.-1.))*wp/uRes*c.w;gl_Position=c;}`,
      /* a stone, not a dash: a lumpy round body a little smeared back along its fall, lit from above */
      fragmentShader:`uniform vec3 uCol;varying float vA,vL,vS;varying vec2 vC;void main(){float u=mix(-1.,vL+1.,vC.y),dx=u-clamp(u,0.,vL),an=atan(vC.x,dx);
        float r=.86+.1*sin(3.*an+vS)+.06*sin(5.*an+2.*vS),dd=length(vec2(vC.x,dx));
        float a=vA*smoothstep(r,r-.35,dd)*mix(.55,1.,smoothstep(-1.,vL,u));
        if(a<.004)discard;gl_FragColor=vec4(uCol*(1.1-.22*vC.x*vC.x+.12*clamp(dx,-1.,1.)),min(1.,a*1.1));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        }`});
    const o=new T.Mesh(g,m);o.frustumCulled=false;o.renderOrder=8;o.visible=false;W.add(o);onDes(o);return o};
  HLF=[mk(MOB?700:1800,0),mk(MOB?380:1000,1)]}
/* the tent's roof as a height grid in its own frame (0.2 m cells), read from the model, for stones landing on it */
const TR={ok:0};
function tentRoof(g){W.updateMatrixWorld(true);const Wi=new T.M4().copy(W.matrixWorld).invert(),M=new T.M4(),v=new V3(),ca=Math.cos(TENT.yaw),sa=Math.sin(TENT.yaw);
  const cs=.2,nx=Math.ceil((TENT.L+1)/cs),nz=Math.ceil((TENT.D+1)/cs),H=new Float32Array(nx*nz).fill(-99),gy=hTop(TENT.x,TENT.z);
  g.traverse(c=>{if(!c.isMesh)return;M.multiplyMatrices(Wi,c.matrixWorld);const P=c.geometry.attributes.position;
    for(let i=0;i<P.count;i++){v.fromBufferAttribute(P,i).applyMatrix4(M);const dx=v.x-TENT.x,dz=v.z-TENT.z,lx=dx*ca-dz*sa,lz=dx*sa+dz*ca;
      const ix=Math.floor((lx+TENT.L/2+.5)/cs),iz=Math.floor((lz+TENT.D/2+.5)/cs);if(ix<0||iz<0||ix>=nx||iz>=nz)continue;const k=iz*nx+ix;if(v.y>H[k])H[k]=v.y}});
  for(let it=0;it<8;it++){const H2=H.slice();for(let iz=1;iz<nz-1;iz++)for(let ix=1;ix<nx-1;ix++){const k=iz*nx+ix;if(H[k]>-50)continue;let s=0,c=0;
      for(const n of[k-1,k+1,k-nx,k+nx])if(H[n]>-50){s+=H[n];c++}if(c>=3)H2[k]=s/c}H.set(H2)}
  Object.assign(TR,{ok:1,H,nx,nz,cs,ca,sa,gy});tentU.uTGy.value=gy}
function roofAt(x,z,o){if(!TR.ok)return -99;const dx=x-TENT.x,dz=z-TENT.z,lx=dx*TR.ca-dz*TR.sa,lz=dx*TR.sa+dz*TR.ca;
  const ix=Math.floor((lx+TENT.L/2+.5)/TR.cs),iz=Math.floor((lz+TENT.D/2+.5)/TR.cs);if(ix<1||iz<1||ix>=TR.nx-1||iz>=TR.nz-1)return -99;
  const k=iz*TR.nx+ix,h=TR.H[k];if(h<TR.gy+.45)return -99;
  if(o){const hx=(TR.H[k+1]>-50?TR.H[k+1]:h)-(TR.H[k-1]>-50?TR.H[k-1]:h),hz=(TR.H[k+TR.nx]>-50?TR.H[k+TR.nx]:h)-(TR.H[k-TR.nx]>-50?TR.H[k-TR.nx]:h);
    const gx=hx/(2*TR.cs),gz=hz/(2*TR.cs);o.set(-(TR.ca*gx+TR.sa*gz),1,-(-TR.sa*gx+TR.ca*gz)).normalize()}
  return h}
/* stones */
const HS=(()=>{const n=MOB?180:420,{v,f}=icoSphere(1),geo=geoFrom(v,f);
  const mat=new T.MSM({color:"#f2f6f8",roughness:.24,metalness:0});
  const im=new T.IM(geo,mat,n);im.count=0;im.frustumCulled=false;im.visible=false;W.add(im);onDes(im);
  const P=[];for(let i=0;i<n;i++)P.push({m:0,x:0,y:0,z:0,vx:0,vy:0,vz:0,r:0,t:0,b:0,gy:0});
  return{n,im,P,acc:0,F:new V3(),R:4,fT:0,act:0,ev:{},M:new T.M4(),pin:null,cnt:{}}})();
/* impact marks: pits with a thrown-up rim and a faint ring of grains (0), rings on the water (1), wet spots where a stone melted (2) */
const HD=(()=>{const n=MOB?360:900,g=new T.Plane(1,1);g.rotateX(-Math.PI/2);
  const m=new T.SM({uniforms:{uT:{value:0},uCol:{value:new C3()},uSand:{value:new C3()}},transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4,
    vertexShader:`varying vec3 vD;varying vec2 vQ;void main(){vD=instanceColor;vQ=position.xz*2.;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform float uT;uniform vec3 uCol,uSand;varying vec3 vD;varying vec2 vQ;
      void main(){float age=uT-vD.y,r=length(vQ)+.06*sin(atan(vQ.y,vQ.x)*3.+vD.z*40.)*step(.5,vD.x),a;vec3 c;
        if(vD.x<.5){float L=1.-smoothstep(10.,24.,age),fr=smoothstep(0.,.06,age);
          float bowl=smoothstep(.34,.1,r)*.5,rim=exp(-(r-.4)*(r-.4)/.004)*.5+exp(-(r-.6)*(r-.6)/.003)*.22*fr+exp(-(r-.8)*(r-.8)/.004)*.14*fr;
          c=rim>bowl?uSand:vec3(0.);a=max(bowl,rim)*L;}
        else if(vD.x<1.5){float k=clamp(age/1.4,0.,1.),q=.1+.85*k;a=(exp(-(r-q)*(r-q)/.002)*.7+exp(-(r-q*.62)*(r-q*.62)/.0015)*.4)*(1.-k)*step(age,1.4);c=uCol*1.4;}
        else{float L=1.-smoothstep(5.,15.,age);a=smoothstep(.5,.18,r)*.4*L*smoothstep(0.,1.2,age);c=vec3(.01);}
        if(a<.004)discard;gl_FragColor=vec4(c,a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        }`});
  const im=new T.IM(g,m,n);im.frustumCulled=false;im.renderOrder=7;im.visible=false;const c0=new C3(0,-1e4,0);for(let i=0;i<n;i++)im.setColorAt(i,c0);W.add(im);onDes(im);
  return{n,im,k:0,last:-99,M:new T.M4(),q:new T.Quat(),c:new C3()}})();
const _hUp=new V3(0,1,0);
function hDecal(ty,x,y,z,sz,nrm){const D=HD,i=D.k;D.k=(D.k+1)%D.n;
  D.q.setFromUnitVectors(_hUp,nrm||_hUp);D.M.compose(_v.set(x,y,z),D.q,_hq.set(sz,1,sz));D.im.setMatrixAt(i,D.M);
  D.im.setColorAt(i,D.c.setRGB(ty,st.t,rnd()));D.im.instanceColor.needsUpdate=true;D.im.instanceMatrix.needsUpdate=true;D.last=st.t}
/* bits thrown up by the strikes: water droplets of a crown, grains of sand, shreds of frond */
const HB=(()=>{const n=MOB?260:640,P=new Float32Array(n*3),C=new Float32Array(n*4),Z=new Float32Array(n),Q=[];
  const g=new T.BG();g.setAttribute("position",new T.BA(P,3));g.setAttribute("aC",new T.BA(C,4));g.setAttribute("z",new T.BA(Z,1));
  const m=new T.SM({transparent:true,depthWrite:false,uniforms:{uH:{value:innerHeight},uL:{value:new C3(1,1,1)}},
    vertexShader:`attribute vec4 aC;attribute float z;uniform float uH;uniform vec3 uL;varying vec4 vC;void main(){vC=vec4(aC.rgb*uL,aC.a);vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;
      float px=z*${S.toFixed(3)}*projectionMatrix[1][1]*uH*.5/max(.05,-mv.z);vC.a*=min(1.,px*px*.5);gl_PointSize=clamp(px,1.,24.);}`,
    fragmentShader:`varying vec4 vC;void main(){float d=length(gl_PointCoord-.5)*2.,a=vC.a*smoothstep(1.,.45,d);if(a<.004)discard;gl_FragColor=vec4(vC.rgb,a);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`});
  for(let i=0;i<n;i++)Q.push({ty:"",x:0,y:0,z:0,vx:0,vy:0,vz:0,l:0,L:1,ph:0});
  const o=new T.Points(g,m);o.frustumCulled=false;o.renderOrder=9;o.visible=false;W.add(o);onDes(o);return{n,P,C,Z,Q,g,m,o,k:0}})();
/* a stone on the pond throws a crown of white, air-filled water a hand or two across: its rim breaks into droplets, it falls back
   and a jet rises from the middle. One sprite per strike, drawn like the rain's crowns but bigger, thicker and whiter. */
const HCR=(()=>{const n=MOB?16:32,P=new Float32Array(n*3),K=new Float32Array(n*2).fill(-1);
  const g=new T.BG();g.setAttribute("position",new T.BA(P,3));g.setAttribute("aK",new T.BA(K,2));
  const m=new T.SM({uniforms:{uH:{value:innerHeight},uCol:HLU.uCol},transparent:true,depthWrite:false,
    vertexShader:`attribute vec2 aK;uniform float uH;varying float vK,vA,vS;
      void main(){vK=aK.x;vS=fract(aK.y);vA=step(0.,aK.x);float sz=.3*(.75+.5*vS)*${S.toFixed(3)};
        vec4 mv=modelViewMatrix*vec4(position+vec3(0.,.38*sz,0.),1.);gl_Position=projectionMatrix*mv;
        float px=sz*projectionMatrix[1][1]*uH*.5/max(.05,-mv.z);vA*=smoothstep(3.,8.,px);gl_PointSize=vA>0.?min(px,180.):0.;}`,
    fragmentShader:`uniform vec3 uCol;varying float vK,vA,vS;void main(){vec2 q=gl_PointCoord-.5;q.y=-q.y;float a=0.,y=q.y+.38;
      if(vK<.55){float k=vK/.55,rad=.07+.2*k+max(y,0.)*.4,ax=abs(q.x)/max(rad,.01),hg=.4*sin(k*3.1416)*(.8+.4*vS)*(1.+.12*k*sin(ax*9.+vS*5.+sign(q.x)*1.7));
        /* the wall is a sheet of spray, brightest where it is seen edge-on at the sides and at its lip */
        float wl=step(ax,1.)*step(0.,y)*smoothstep(hg,hg-.03,y);
        a=wl*(.32+.45*smoothstep(.55,1.,ax)+.25*smoothstep(hg*.5,hg,y))+smoothstep(.06,.0,abs(abs(q.x)-rad))*step(0.,y)*step(y,hg)*.5;
        float e=length(vec2(q.x/max(rad,.01),(y-hg)/(rad*.32+.01)));a=max(a,smoothstep(.25,.0,abs(e-1.))*.85*step(.02,hg));
        a=max(a,smoothstep(1.15,.7,length(vec2(q.x/max(rad,.01),y/(rad*.3+.01))))*.45*(1.-k*.5));
        for(int i=0;i<8;i++){float an=float(i)/8.*6.2832+vS*6.;vec2 d=vec2(cos(an)*rad*1.15,hg+.05+sin(an)*rad*.32+.1*k)-vec2(q.x,y);a=max(a,smoothstep(.05,.02,length(d))*step(.2,k));}
        a=max(a,smoothstep(.06,.0,abs(length(vec2(q.x,y*3.))-rad))*.7);a*=1.-smoothstep(.75,1.,k);}
      else{float k=(vK-.55)/.45,jh=.34*sin(k*3.1416);a=smoothstep(.045,.0,abs(q.x))*step(0.,y)*step(y,jh)*.85;
        a=max(a,smoothstep(.065,.04,length(vec2(q.x,y-jh-.04)))*step(.15,k));}
      a*=vA;if(a<.01)discard;gl_FragColor=vec4(uCol*1.7+.12,min(1.,a*.95));
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`});
  const o=new T.Points(g,m);o.frustumCulled=false;o.renderOrder=9;o.visible=false;W.add(o);onDes(o);return{n,P,K,g,m,o,k:0,live:0}})();
function hCrown(x,z){const C=HCR,k=C.k;C.k=(k+1)%C.n;C.P[k*3]=x;C.P[k*3+1]=POND.wy+.004;C.P[k*3+2]=z;C.K[k*2]=0;C.K[k*2+1]=rnd();C.live=1;
  C.g.attributes.position.needsUpdate=true}
function hCrownStep(dt){const C=HCR;let any=0;for(let i=0;i<C.n;i++){const j=i*2;if(C.K[j]<0)continue;C.K[j]+=dt/.95;if(C.K[j]>=1)C.K[j]=-1;else any=1}
  C.live=any;C.o.visible=any>0;C.g.attributes.aK.needsUpdate=true;C.m.uniforms.uH.value=innerHeight}
const HBK={clump:[.93,.95,.98,.09],drop:[.9,.94,.98,.05],grain:[.78,.6,.4,.009],leaf:[.3,.36,.2,.06],chip:[.95,.97,1,.012]};
function hBit(ty,x,y,z,vx,vy,vz,life){const B=HB,q=B.Q[B.k];B.k=(B.k+1)%B.n;B.live=1;q.ty=ty;q.x=x;q.y=y;q.z=z;q.vx=vx;q.vy=vy;q.vz=vz;q.l=q.L=life;q.ph=rnd()*TAU}
/* a stone at rest on a ripple: the ripple's slow terms are frozen where it lands, so its height and slope are cheap to follow */
function ripFreeze(s,x,z,nY){const RD=sandU.uRipDir.value,dx=RD.x,dz=RD.y;s.wx=fbm2(x*.09,z*.09)*4;s.wz=fbm2(x*.11+7,z*.11+7)*2.5;
  s.pm=1+.3*(vn2(x*.07+1.3,z*.07+1.3)-.5);s.am=.5+.5*ss(.28,.62,vn2(x*.21+11,z*.21+11));
  const qx=x+s.wx,qz=z+s.wz,al=qx*dx+qz*dz,c2=-qx*dz+qz*dx;s.c=(vn2(c2*.55+5,al*.12+5)-.5)*3.4;
  s.wr=ss(.7,.86,nY)*ss(1.3,1.8,pN(x,z))*(1-ss(.08,.3,(WIND.x*s.ngx+WIND.z*s.ngz)))}
function ripAt(s,x,z){const RD=sandU.uRipDir.value,dx=RD.x,dz=RD.y,P=sandU.uRipPh.value,qx=x+s.wx,qz=z+s.wz,al=qx*dx+qz*dz;
  const ph=al*8.38*s.pm+s.c+(vn2(al*.85+9,(-qx*dz+qz*dx)*.07+9)-.5)*2.4-P,a=Math.sin(ph+.9*Math.sin(ph)),b=Math.sin(((qx*1.7+3)*(dx-dz*.35)+(qz*1.7+3)*(dz+dx*.35))*8.38-P*1.6);
  return(a*.7+b*.3)*s.am}
const CHIT=[];
function cactusHits(){if(CHIT.length)return CHIT;
  for(const s of SAG)if(s.g)CHIT.push({o:s,x:s.x,z:s.z,r:s.k==="s12"?.55:s.k==="s3"?.32:.42,h:s.k==="s12"?11.6:s.k==="s3"?2.9:6.8,tw:0,tv:0,k:s.k==="s3"?.02:.004});
  for(const c of CACTI)if(c.g)CHIT.push({o:c,x:c.x,z:c.z,r:.75*c.s,h:1.5*c.s,tw:0,tv:0,k:.03});
  for(const c of CHIT)c.y=hTop(c.x,c.z)+c.h;return CHIT}
const _hq=new V3(),_hn=new V3(),_hf=new V3();
function hailFocus(){if(HS.pin){HS.F.set(HS.pin.x,0,HS.pin.z);HS.R=HS.pin.R;return}const m=De.matrixWorld.elements;_hf.set(-m[8],-m[9],-m[10]).applyAxisAngle(_yAx,-YAW).normalize();
  let d=1,x=_cl.x,z=_cl.z,hit=false;for(;d<80;d+=.8){x=_cl.x+_hf.x*d;z=_cl.z+_hf.z*d;const y=_cl.y+_hf.y*d;if(sN(x,z)<.97&&y<hTop(x,z)+.2){hit=true;break}}
  if(!hit){d=10;x=_cl.x+_hf.x*d;z=_cl.z+_hf.z*d}
  HS.F.set(x,0,z);HS.R=cl(d*.3,2.2,8)}
function hEv(k,x,y,z,e){const E=HS.ev,d=Math.hypot(x-_cl.x,y-_cl.y,z-_cl.z);if(d>28)return;const o=E[k];if(!o||d<o.d)E[k]={d,x,y,z,e}}
function hailSim(dt,t){const S0=HS,P=S0.P,hf=WX.hf,wn=st.wn;
  if((S0.fT-=dt)<0){S0.fT=.25;hailFocus()}
  /* new stones: as many as the burst gives over the patch in view, capped so the pool turns over every several seconds */
  const wsp=(1.5+6*wn)*(.7+.5*WX.gf);
  S0.acc+=dt*hf*Math.min(MOB?28:64,Math.PI*S0.R*S0.R*1.4);
  let free=0;const C=S0.cnt,cn=k=>{C[k]=(C[k]||0)+1},CH=cactusHits();
  while(S0.acc>=1){S0.acc-=1;let s=null;for(let j=0;j<S0.n;j++){const q=P[(free+j)%S0.n];if(!q.m){s=q;free=(free+j+1)%S0.n;break}}
    if(!s){let o=1e9;for(const q of P)if(q.m===3&&q.t<o){o=q.t;s=q}if(!s)break}
    const a=rnd()*TAU,u=Math.sqrt(rnd())*S0.R,lx=S0.F.x+Math.cos(a)*u,lz=S0.F.z+Math.sin(a)*u,gy=hTop(lx,lz),hh=rr(5,8),tf=hh/10;
    /* the slant is aimed at what the stone meets first: over a cactus that is its crown, not the sand below it */
    let ty=Math.max(gy,POND.wy);for(const c of CH){const dx=lx-c.x,dz=lz-c.z;if(dx*dx+dz*dz<c.r*c.r)ty=Math.max(ty,c.y-.3)}
    Object.assign(s,{m:1,x:lx-WIND.x*wsp*tf,z:lz-WIND.z*wsp*tf,y:ty+hh,vx:WIND.x*wsp*rr(.8,1.1),vz:WIND.z*wsp*rr(.8,1.1),vy:-rr(8.5,11.5),
      r:.004+.008*Math.pow(rnd(),1.6),t:0,b:0,gy:Math.max(gy,POND.wy),pd:0,cd:0,td:0,sk:1});cn("spawn")}
  const warm=(1-LK.night)*(LK.day+.5*LK.sunset+.5*LK.sunrise);let n=0;const M=S0.M,E=S0.ev;for(const k in E)E[k]=null;
  for(const s of P){if(!s.m)continue;s.t+=dt;
    if(s.m===1){s.vy=Math.max(s.vy-9.8*dt,-13);s.x+=s.vx*dt;s.y+=s.vy*dt;s.z+=s.vz*dt;
      if(!s.td&&TR.ok&&Math.abs(s.x-TENT.x)<4&&Math.abs(s.z-TENT.z)<4){const h=roofAt(s.x,s.z,_hn);if(h>-50&&s.y<h+s.r){s.y=h+s.r;
        const vn=s.vx*_hn.x+s.vy*_hn.y+s.vz*_hn.z;if(vn<0){const e=1+rr(.45,.6);s.vx-=e*vn*_hn.x;s.vy-=e*vn*_hn.y;s.vz-=e*vn*_hn.z;s.vx+=rr(-.4,.4);s.vz+=rr(-.4,.4)}
        if(!s.b)cn("tent");if(s.b++>2)s.td=1;TENTH.k=Math.min(1.2,TENTH.k+.1);hEv("tent",s.x,s.y,s.z,-vn);s.gy=hTop(s.x,s.z)}}
      if(!s.pd&&s.y<s.gy+13){for(const pp of PALMS){const T0=pp.g&&pp.g.userData.top;if(!T0)continue;const dx=s.x-T0.x,dz=s.z-T0.z,dh=Math.hypot(dx,dz);
          if(dh<3.3&&s.y<T0.y+.3-dh*.12&&s.y>T0.y-1.6){s.pd=1;if(rnd()<.65*(1-dh/3.6)){s.vy=Math.abs(s.vy)*rr(.1,.25);s.vx+=rr(-1.2,1.2)+dx/dh*.6;s.vz+=rr(-1.2,1.2)+dz/dh*.6;
            pp.twA=Math.min(1,pp.twA+.22);cn("palm");hEv("palm",s.x,s.y,s.z,1);if(rnd()<.45)hBit("leaf",s.x,s.y,s.z,rr(-.5,.5),rr(.2,.8),rr(-.5,.5),rr(3,6))}break}}}
      if(!s.cd&&s.y<s.gy+12.5)for(const c of CH){const dx=s.x-c.x,dz=s.z-c.z;if(dx*dx+dz*dz<c.r*c.r&&s.y<c.y&&s.y>c.y-.6){s.cd=1;s.vy=Math.abs(s.vy)*rr(.2,.35);s.vx+=dx/c.r*rr(.8,1.6);s.vz+=dz/c.r*rr(.8,1.6);
          c.tv+=c.k*rr(.6,1.4)*(rnd()<.5?-1:1);cn("cactus");hEv("cactus",s.x,s.y,s.z,1);break}}
      if(s.y<s.gy+.7){const inP=pN(s.x,s.z)<1;
        if(inP&&s.y<POND.wy+s.r){s.m=4;s.y=POND.wy;s.t=0;s.life=rr(1.2,3.5);cn("pond");hEv("pond",s.x,s.y,s.z,1);hDecal(1,s.x,POND.wy+.004,s.z,rr(.5,.8));hCrown(s.x,s.z);
          const k=MOB?6:10,sp=rr(.45,.8);for(let j=0;j<k;j++){const a=j/k*TAU+rnd()*.3;hBit("drop",s.x,POND.wy+.01,s.z,Math.cos(a)*sp,rr(1.1,1.8),Math.sin(a)*sp,.6)}
          hBit("drop",s.x,POND.wy+.01,s.z,0,rr(1.9,2.5),0,.7)}
        else if(!inP){const h=hTop(s.x,s.z);if(s.y<h+s.r){s.y=h+s.r*.7;const nn=nTop(s.x,s.z),vn=s.vx*nn.x+s.vy*nn.y+s.vz*nn.z;
          if(!s.b){cn("sand");hEv("sand",s.x,s.y,s.z,-vn);if(rnd()<.45&&cn("pit")!==0)hDecal(0,s.x,h+.004,s.z,rr(.05,.09)+s.r*3,nn);for(let j=0;j<(MOB?2:3);j++)hBit("grain",s.x,h+.01,s.z,rr(-.5,.5),rr(.5,1.1),rr(-.5,.5),.5)}
          s.b++;if(vn<0){if(s.b===2)cn("rebound");const e=1+rr(.25,.4);s.vx-=e*vn*nn.x;s.vy-=e*vn*nn.y;s.vz-=e*vn*nn.z;s.vx=s.vx*.7+rr(-.3,.3);s.vz=s.vz*.7+rr(-.3,.3)}
          if(s.vy<.7||s.b>2){s.m=2;s.t=0;s.ngx=-nn.x/nn.y;s.ngz=-nn.z/nn.y;s.bx=s.x;s.bz=s.z;s.by=h;s.vy=0;ripFreeze(s,s.x,s.z,nn.y);s.l0=ripAt(s,s.x,s.z)*s.wr;cn(s.l0<-.3?"landTr":s.l0>.3?"landCr":"landMid")}}}}}
    else if(s.m===2){const e=.04,g0=ripAt(s,s.x,s.z),gx=(ripAt(s,s.x+e,s.z)-ripAt(s,s.x-e,s.z))/(2*e)*.036*s.am*s.wr,gz=(ripAt(s,s.x,s.z+e)-ripAt(s,s.x,s.z-e))/(2*e)*.036*s.am*s.wr;
      const ax=-7*(s.ngx+gx),az=-7*(s.ngz+gz),f=Math.exp(-dt*2.6);s.vx=(s.vx+ax*dt)*f;s.vz=(s.vz+az*dt)*f;s.x+=s.vx*dt;s.z+=s.vz*dt;
      s.y=s.by+s.ngx*(s.x-s.bx)+s.ngz*(s.z-s.bz)+s.r*.7;const sp=Math.hypot(s.vx,s.vz);
      if(s.t>3||sp<.035&&Math.hypot(s.ngx+gx,s.ngz+gz)<.2||sN(s.x,s.z)>.95){s.m=3;s.t=0;const tr=g0*s.wr<-.3;cn(tr?"restTr":g0*s.wr>.3?"restCr":"restMid");s.life=(tr?rr(9,17):rr(2.5,6))*(1-.4*warm)*(1+WX.hc);s.wet=!tr}}
    else if(s.m===3){s.r*=Math.exp(-dt*(.01+.03*warm));if(s.t>s.life){s.m=5;s.t=0}}
    else if(s.m===4){s.x+=WIND.x*.05*dt;s.z+=WIND.z*.05*dt;s.y=POND.wy-s.r*.25+.003*Math.sin(s.t*9+s.x*7);if(s.t>s.life){s.m=5;s.t=0;s.wet=0;s.sk=0}}
    else if(s.m===5){s.sk=Math.max(0,1-s.t/1.2);if(s.sk<=0){s.m=0;if(s.wet&&pN(s.x,s.z)>1.05)hDecal(2,s.x,hTop(s.x,s.z)+.004,s.z,rr(.05,.09))}}
    if(!s.m)continue;const r=s.r*(s.m===5?s.sk:1);M.makeScale(r,r*.92,r).setPosition(s.x,s.y,s.z);S0.im.setMatrixAt(n++,M)}
  S0.im.count=n;S0.im.visible=n>0;if(n)S0.im.instanceMatrix.needsUpdate=true;S0.act=n;
  /* cacti take the knocks on a stiff spring */
  for(const c of CH){c.tv+=(-70*c.tw-7*c.tv)*dt;c.tw+=c.tv*dt;if(c.o.g){c.o.g.rotation.x=c.tw;c.o.g.rotation.z=c.tw*.6}}}
const TENTH={k:0};
UPD.push((dt,t)=>{const on=WX.hf>.004,act=on||HS.act>0;
  if(on&&!HLF)hailStreaks();
  if(HLF){HLF[0].visible=HLF[1].visible=on;if(on){HLU.uT.value=t;HLU.uRain.value=WX.hf;HLU.uWS.value=.8+st.wn*4.5;HLU.uCamL.value.copy(_cl);Cn.getDrawingBufferSize(HLU.uRes.value)}}
  /* the stones and marks are lit like the sky-lit sand: fill plus a share of the sun */
  _c1.copy(dc?dc.color:_c1.set("#999")).multiplyScalar(dc?dc.intensity*.5:.5).add(_c2.copy(pi?pi.color:_c1).multiplyScalar(.2*(pi?pi.intensity:1)));
  HLU.uCol.value.copy(_c1).multiplyScalar(1.25).lerp(_c2.set("#eef2f4"),.25*(1-st.night));
  if(act)hailSim(Math.min(dt,.05),t);
  if(HCR.live)hCrownStep(Math.min(dt,.05));
  HD.im.visible=st.t-HD.last<26;if(HD.im.visible){HD.im.material.uniforms.uT.value=st.t;HD.im.material.uniforms.uCol.value.copy(HLU.uCol.value);HD.im.material.uniforms.uSand.value.copy(_c1).multiply(_c2.set("#f3d2a2")).multiplyScalar(1.5)}
  /* bits */
  let any=false;const B=HB;
  if(B.live)for(let i=0;i<B.n;i++){const q=B.Q[i],o=i*3;if(q.l<=0){B.C[i*4+3]=0;continue}any=true;q.l-=dt;
    if(q.ty==="leaf"){q.ph+=dt*7;q.vy=Math.max(q.vy-3*dt,-.9);q.vx=q.vx*Math.exp(-dt*2)+WIND.x*st.wn*.8*dt+Math.sin(q.ph)*.6*dt;q.vz=q.vz*Math.exp(-dt*2)+WIND.z*st.wn*.8*dt+Math.cos(q.ph*1.3)*.6*dt}
    else q.vy-=9.8*dt;
    q.x+=q.vx*dt;q.y+=q.vy*dt;q.z+=q.vz*dt;
    if(q.ty==="drop"&&q.vy<0&&q.y<POND.wy)q.l=0;else if(q.y<hTop(q.x,q.z)-.01&&q.ty!=="drop")q.l=Math.min(q.l,q.ty==="leaf"?1.2:0);
    const K=HBK[q.ty];B.P[o]=q.x;B.P[o+1]=q.y;B.P[o+2]=q.z;B.C[i*4]=K[0];B.C[i*4+1]=K[1];B.C[i*4+2]=K[2];B.C[i*4+3]=Math.min(1,q.l/q.L*3)*(q.ty==="drop"?.8:1);B.Z[i]=K[3]}
  B.live=any;B.o.visible=any;if(any){B.g.attributes.position.needsUpdate=B.g.attributes.aC.needsUpdate=B.g.attributes.z.needsUpdate=true;B.m.uniforms.uH.value=innerHeight;B.m.uniforms.uL.value.copy(_c1).multiplyScalar(1.3)}
  /* the palms twitch under the strikes; the cloth shivers with the drumming */
  for(const pp of PALMS){if(!pp.tw)continue;pp.twA*=Math.exp(-dt*4.5);pp.tw.value=pp.twA*Math.sin(t*19+pp.x)+.06*WX.hf*Math.sin(t*13.7+pp.z*3)*Math.sin(t*5.1)}
  TENTH.k*=Math.exp(-dt*5);tentU.uShk.value=Math.min(1.4,.45*WX.hf+TENTH.k)});
/*@@NEXT@@*/

let _bloomSave=null;
const HIDE=[];
/* ---------------- animals: Tripo + Blender rigs (camel v4b, Bactrian, bald eagle, rattlesnake v1i) at real size ----------------
   camel_v4 native metres (2.8 m long) x1.15 -> ~3.2 m long, hump ~2.1 m (palm 13 m, tent 6 m long); its in-place walk is
   authored for .99 m/s; bald_eagle_v1 2.0 m span x.9 -> 1.8 m (body 1.04 m); rattlesnake_v1i native 1.1 m. */
const ANIM={camels:[],eagle:null,rs:null};
const CAM_SC=1.15,CAM_V=.989*CAM_SC,EAG_SC=.9;
const tl=(lx,lz)=>({x:TENT.x+Math.cos(TENT.yaw)*lx+Math.sin(TENT.yaw)*lz,z:TENT.z-Math.sin(TENT.yaw)*lx+Math.cos(TENT.yaw)*lz});
/* light comes from +x/-z (local azimuth SUN.lazL), so shade falls toward -x/+z of anything */
const SHADE={x:-Math.sin(SUN.lazL),z:-Math.cos(SUN.lazL)},SNK_HOME={x:2,z:10.5};

/* nav grid, 1 m cells; built lazily once every prop/rock/shrub has registered its obstacle disc */
const NAV={x0:-Math.ceil(AX),z0:-Math.ceil(AZ),nx:2*Math.ceil(AX)+1,nz:2*Math.ceil(AZ)+1,G:{}};
function navGrid(key,pad,pondK,rimS){if(NAV.G[key])return NAV.G[key];
  const g=new Uint8Array(NAV.nx*NAV.nz);
  for(let j=0;j<NAV.nz;j++)for(let i=0;i<NAV.nx;i++){const x=NAV.x0+i,z=NAV.z0+j;
    let ok=sN(x,z)<rimS&&pN(x,z)>pondK&&clearOf(x,z,pad);if(ok&&nTop(x,z).y<.9)ok=false;g[j*NAV.nx+i]=ok?1:0}
  return NAV.G[key]=g}
function navFree(g,x,z){const i=Math.round(x-NAV.x0),j=Math.round(z-NAV.z0);return i>=0&&j>=0&&i<NAV.nx&&j<NAV.nz&&g[j*NAV.nx+i]===1}
/* connected stretches of a grid; a free cell walled in by plants, rocks and the camp with a handful of others leads nowhere */
function navComp(g){if(g.comp)return g.comp;const nx=NAV.nx,nz=NAV.nz,N=g.length,c=new Int32Array(N).fill(-1),sz=[],stk=[];
  for(let s=0;s<N;s++){if(!g[s]||c[s]>=0)continue;const id=sz.length;let n=0;c[s]=id;stk.push(s);
    while(stk.length){const k=stk.pop(),x=k%nx,z=(k-x)/nx;n++;
      for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){const i=x+di,j=z+dj;if((!di&&!dj)||i<0||j<0||i>=nx||j>=nz)continue;
        if(di&&dj&&(!g[z*nx+i]||!g[j*nx+x]))continue;const m=j*nx+i;if(g[m]&&c[m]<0){c[m]=id;stk.push(m)}}}
    sz.push(n)}
  return g.comp={c,sz}}
function navCompAt(g,x,z){const i=Math.round(x-NAV.x0),j=Math.round(z-NAV.z0);return i>=0&&j>=0&&i<NAV.nx&&j<NAV.nz?navComp(g).c[j*NAV.nx+i]:-1}
function navOpen(g,x,z,n){const k=navCompAt(g,x,z);return k>=0&&navComp(g).sz[k]>=n}
function losFree(g,a,b){const d=Math.hypot(b.x-a.x,b.z-a.z),n=Math.ceil(d/.35);for(let k=1;k<n;k++){const t=k/n;if(!navFree(g,mix(a.x,b.x,t),mix(a.z,b.z,t)))return false}return true}
function navPath(g,ax,az,bx,bz,blk){
  const nx=NAV.nx,nz=NAV.nz,id=(i,j)=>j*nx+i,ci=v=>cl(Math.round(v),0,1e9);
  const si=cl(Math.round(ax-NAV.x0),0,nx-1),sj=cl(Math.round(az-NAV.z0),0,nz-1),ei=cl(Math.round(bx-NAV.x0),0,nx-1),ej=cl(Math.round(bz-NAV.z0),0,nz-1);
  const N=g.length,gs=new Float32Array(N).fill(1e9),par=new Int32Array(N).fill(-1),closed=new Uint8Array(N),goal=id(ei,ej);
  const open=[id(si,sj)];gs[open[0]]=0;let found=false,it=0;
  while(open.length&&it++<8000){let bi=0,bf=1e9;
    for(let k=0;k<open.length;k++){const o=open[k],f=gs[o]+Math.hypot(o%nx-ei,(o-o%nx)/nx-ej);if(f<bf){bf=f;bi=k}}
    const cur=open[bi];open[bi]=open[open.length-1];open.pop();if(closed[cur])continue;closed[cur]=1;
    if(cur===goal){found=true;break}
    const cx=cur%nx,cz=(cur-cx)/nx;
    for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){if(!di&&!dj)continue;const i=cx+di,j=cz+dj;if(i<0||j<0||i>=nx||j>=nz)continue;
      const k=id(i,j);if(closed[k]||(!g[k]&&k!==goal))continue;if(blk&&blk.some(b=>Math.hypot(NAV.x0+i-b.x,NAV.z0+j-b.z)<b.r))continue;if(di&&dj&&(!g[id(cx+di,cz)]||!g[id(cx,cz+dj)]))continue;
      const ng=gs[cur]+(di&&dj?1.4142:1);if(ng<gs[k]){gs[k]=ng;par[k]=cur;open.push(k)}}}
  if(!found)return null;
  const pts=[];for(let k=goal;k>=0;k=par[k])pts.push({x:NAV.x0+k%nx,z:NAV.z0+Math.floor(k/nx)});
  pts.reverse();if(pts.length<2)return[{x:ax,z:az},{x:bx,z:bz}];pts[0]={x:ax,z:az};pts[pts.length-1]={x:bx,z:bz};
  const los=(a,b)=>losFree(g,a,b)&&(!blk||blk.every(o=>{const n=Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.35);for(let k=1;k<n;k++){const t=k/n;if(Math.hypot(mix(a.x,b.x,t)-o.x,mix(a.z,b.z,t)-o.z)<o.r)return false}return true}));
  const out=[pts[0]];let i=0;while(i<pts.length-1){let j=pts.length-1;while(j>i+1&&!los(pts[i],pts[j]))j--;out.push(pts[j]);i=j}
  return out}
function randFree(g,cx,cz,r,test){for(let t=0;t<80;t++){const a=rnd()*TAU,d=Math.sqrt(rnd())*r,x=cx+Math.cos(a)*d,z=cz+Math.sin(a)*d;if(navFree(g,x,z)&&(!test||test(x,z)))return{x,z}}return null}

/* rig helpers (vendor three: AnimationMixer + SkeletonUtils clone) */
function rigUp(scene,anims){const mx=new VT.THREE.AnimationMixer(scene),acts={};anims.forEach(c=>{acts[c.name]=mx.clipAction(c)});return{mx,acts,cur:null}}
/* clip changes blend on smoothstep weights from whatever mix is playing (three's crossFadeTo ramps linearly, which kicks
   the pose at both ends of the fade, and restarts a clip that is still fading out) */
function play(r,name,fade,ts){const n=r.acts[name];if(!n)return;if(ts!=null)n.timeScale=ts;if(r.cur===name)return;
  /* a finished clamped one-shot is paused rather than running, but it still weighs in until it is faded out and stopped */
  const w={};let any=0;for(const k in r.acts){const a=r.acts[k];if(a.enabled&&a.isScheduled()&&a.getEffectiveWeight()>1e-4){w[k]=a.getEffectiveWeight();any=1}}
  if(!(name in w)||n.paused){n.reset();n.play();if(!(name in w))w[name]=any?0:1}
  r.fd={w,to:name,u:any?0:1,T:Math.max(fade,1e-3)};r.cur=name;rigW(r)}
function rigW(r){const f=r.fd;if(!f)return;const e=ss(0,1,f.u);
  for(const k in f.w){const s=f.w[k];r.acts[k].setEffectiveWeight(k===f.to?s+(1-s)*e:s*(1-e))}
  if(f.u>=1){for(const k in f.w)if(k!==f.to)r.acts[k].stop();r.fd=null}}
function rigTick(r,dt){if(r.fd){r.fd.u+=dt/r.fd.T;rigW(r)}r.mx.update(dt)}
/* heading follows a turn rate that eases toward the wanted one, so corners and turns-in-place start and stop softly */
function steer(o,dy,max,dt){o.yr+=(cl(dy*1.8,-max,max)-o.yr)*ease(3,dt);o.yaw=wrapA(o.yaw+o.yr*dt)}
/* animals and saguaros keep the scene's room-environment fill (as the sea's whale/turtles do), dimmed at night in the per-frame update */
const ANIM_MATS=[];
function animalMats(o,tan){matsOf(o,m=>{cleanMat(m);m.roughness=Math.max(m.roughness||0,.75);if(!ANIM_MATS.includes(m))ANIM_MATS.push(m);
  /* Tripo's camel bakes a dark rust coat; keep its detail but shift it to a sun-faded dromedary tan */
  /* the texture is a patchwork atlas whose islands differ in brightness, so only its fine fold detail is kept;
     the coat itself is painted in bind-pose metres (y up, 0..1.98 tall, ±1.4 long) so it runs continuously across seams */
  if(tan&&m.map){m.color.set("#ffffff");m.roughness=.92;m.roughnessMap=null;m.metalness=0;m.metalnessMap=null;m.userData.coat=1;m.onBeforeCompile=sh=>{
    sh.uniforms.uNight=sandU.uNight;sh.uniforms.uDew=coatU.uDew;sh.uniforms.uFrost=coatU.uFrost;
    sh.vertexShader=sh.vertexShader.replace("#include <common>","#include <common>\nvarying vec3 vBP;varying vec3 vBN;")
      .replace("#include <begin_vertex>","#include <begin_vertex>\nvBP=position;vBN=normal;");
    sh.fragmentShader=sh.fragmentShader.replace("#include <common>","#include <common>\nuniform float uNight,uDew,uFrost;varying vec3 vBP;varying vec3 vBN;"+GLSL_NOISE+`
float fur3(vec3 p,vec3 w,float k){return dn2(vec2(p.z*k,p.y*k*.22))*w.x+dn2(vec2(p.x*k,p.y*k*.22))*w.z+dn2(vec2(p.x*k,p.z*k*.3))*w.y;}`)
    .replace("#include <map_fragment>",`vec3 bp=vBP,bn=normalize(vBN),tw=abs(bn);tw/=tw.x+tw.y+tw.z;
      float l0=dot(texture2D(map,vMapUv).rgb,vec3(.3,.59,.11)),l4=dot(texture2D(map,vMapUv,4.).rgb,vec3(.3,.59,.11));
      float h=bp.y/1.98;
      vec3 col=vec3(.74,.47,.22);
      col=mix(col,vec3(.84,.62,.36),smoothstep(.45,.95,bn.y)*smoothstep(.55,.8,h));
      col=mix(col,vec3(.88,.70,.46),smoothstep(-.2,-.75,bn.y));
      col=mix(col,vec3(.64,.45,.28),smoothstep(.36,.12,h));
      col=mix(col,vec3(.24,.18,.14),smoothstep(.05,.0,h));
      col=mix(col,vec3(.30,.22,.16),smoothstep(.035,.0,abs(h-.27))*.7);
      float fw=length(fwidth(bp))*190.,fa=1.-smoothstep(.35,1.1,fw);
      float clump=fur3(bp,tw,7.)-.5,strand=fur3(bp,tw,190.)-.5,mid=fur3(bp,tw,45.)-.5;
      col*=1.+clump*.22+mid*.16*(1.-smoothstep(.6,2.,fw*.24))+strand*.3*fa;
      col*=clamp(1.+(l0-l4)*1.7+(l4-.45)*.12,.55,1.35);
      /* frost settles on the back, the hump and the top of the neck, in the tips of the fur */
      if(uFrost>.003)col=mix(col,vec3(.84,.88,.93),uFrost*smoothstep(.15,.8,bn.y)*(.35+.65*smoothstep(.35,.7,fur3(bp,tw,60.)))*.6);
      col=mix(col,vec3(dot(col,vec3(.3,.59,.11)))*vec3(.82,.9,1.),uNight*.6)*mix(1.,.62,uNight);
      diffuseColor.rgb=col;`)
    .replace("#include <opaque_fragment>",`{float fr=pow(1.-clamp(dot(normal,normalize(vViewPosition)),0.,1.),2.4);
      outgoingLight+=fr*.45*vec3(1.,.8,.55)*(reflectedLight.directDiffuse+reflectedLight.indirectDiffuse);
      if(uDew>.003){float up=smoothstep(-.1,.7,normalize(vBN).y),bd=step(.9,fur3(vBP,abs(normalize(vBN))/dot(abs(normalize(vBN)),vec3(1.)),320.))*fa;
        outgoingLight=mix(outgoingLight,outgoingLight*.86+vec3(.06,.065,.07)*(reflectedLight.indirectDiffuse.g*4.+.2),uDew*up*.4)+bd*up*uDew*.55*vec3(.92,.96,1.)*(reflectedLight.indirectDiffuse+reflectedLight.directDiffuse*.5);}}
      #include <opaque_fragment>`)};m.customProgramCacheKey=()=>"des68coat";m.needsUpdate=true}});o.traverse(c=>{if(c.isMesh){c.castShadow=true;c.receiveShadow=true;c.frustumCulled=false}})}
function groundFrame(x,z,yaw,L,Wd){
  const fx=Math.sin(yaw),fz=Math.cos(yaw),hf=hTop(x+fx*L,z+fz*L),hb=hTop(x-fx*L,z-fz*L),hc=hTop(x,z);
  const hl=hTop(x+fz*Wd,z-fx*Wd),hr=hTop(x-fz*Wd,z+fx*Wd);
  return{y:Math.max((hf+hb)*.5,hc-.12),pitch:-Math.atan2(hf-hb,2*L),roll:cl(Math.atan2(hl-hr,2*Wd),-.2,.2)}}

/* ---- footprints: one instanced decal per print, drawn over the sand as a 2x multiply (0.5 = no change). Each kind is a
   height field in centimetres that the shader lights from the key light, so a print reads as pressed into the sand with a lit
   and a shaded wall and a dark floor. Prints are laid where a foot actually comes to rest, and wind, blowing sand and rain
   wear them away (slowly in still air, within seconds in a dust storm). instanceColor carries (kind + variant/4, wear clock
   at birth, depth). ---- */
const PRK={drom:0,bact:1,talon:2,wing:3,lie:4,ost:5,tort:6,gerb:7,scorp:8,pal:9,hole:10};
const PR_SZ=[.28,.32,.2,.9,2.1,.25,.11,.065,.075,.5,.17];
const PR=(()=>{const N=MOB?700:1400,geo=new T.Plane(1,1).rotateX(-Math.PI/2);
  const m=new T.SM({transparent:true,depthWrite:false,side:2,blending:5,blendSrc:208,blendDst:202,blendSrcAlpha:200,blendDstAlpha:201,
    polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4,uniforms:{uE:{value:0},uKs:{value:.7},uSnw:{value:0},uLd:sandU.uLd,uWD:sandU.uWD},
    vertexShader:`uniform vec2 uWD;varying vec2 vQ,vWl;varying vec3 vK,vAx,vAz;varying float vS,vL,vSd,vG;
      void main(){vK=instanceColor;vWl=vec2(dot(vec3(uWD.x,0.,uWD.y),normalize(instanceMatrix[0].xyz)),dot(vec3(uWD.x,0.,uWD.y),normalize(instanceMatrix[2].xyz)));mat4 M=modelMatrix*instanceMatrix;vAx=normalize((M*vec4(1.,0.,0.,0.)).xyz);vAz=normalize((M*vec4(0.,0.,1.,0.)).xyz);
        vS=length(instanceMatrix[0].xyz);vL=length(instanceMatrix[2].xyz);vSd=fract(sin(dot(instanceMatrix[3].xz,vec2(12.9898,78.233)))*43758.5453);
        /* seen from afar a track is the trampled strip, not single prints: the quad grows to carry a soft dent wider than the foot */
        vec3 c=(M*vec4(0.,0.,0.,1.)).xyz;vG=vK.x<2.5||(vK.x>5.&&vK.x<6.)?clamp(length(cameraPosition-c)/(26.*vS),1.,2.):1.;vQ=position.xz*vG;
        gl_Position=projectionMatrix*viewMatrix*M*vec4(position*vG,1.);}`,
    fragmentShader:`uniform float uE,uKs,uSnw;uniform vec3 uLd;varying vec2 vQ,vWl;varying vec3 vK,vAx,vAz;varying float vS,vL,vSd,vG;
      ${GLSL_NOISE}
      /* camel: two broad toe lobes fused behind into one soft heel pad, parted at the front by a short cleft with a nail pock
         at each toe tip; the sand the pad spreads is heaped round it, most where the foot rolls off the toes. Hind feet are
         narrower than fore feet; the Bactrian's pads are larger and its toes splay wider. */
      float camel(vec2 p,float hind,float bk){p/=vec2(hind>.5?.84:1.,hind>.5?.92:1.)*(bk>.5?1.13:1.);float sp=bk>.5?3.1:2.7;
        float t1=length((p-vec2(-sp,2.6))/vec2(4.1,5.4)),t2=length((p-vec2(sp,2.6))/vec2(4.1,5.4)),hl=length((p-vec2(0.,-2.))/vec2(6.3,5.8));
        float q=-.22*log(exp(-t1/.22)+exp(-t2/.22)+exp(-hl/.22));
        float h=-smoothstep(1.,.45,q)*(1.-.8*exp(-p.x*p.x/(bk>.5?1.4:.9))*smoothstep(2.,6.5,p.y));
        vec2 n1=p-vec2(-sp+.2,7.7),n2=p-vec2(sp-.2,7.7);h-=.5*(exp(-dot(n1,n1)/1.1)+exp(-dot(n2,n2)/1.1));
        h+=.34*exp(-(q-1.17)*(q-1.17)*14.)*(1.+.9*smoothstep(-2.,8.,p.y));
        return 1.6*(h+.08*(dn2(p*1.4+vSd*9.)-.5)*smoothstep(1.1,.6,q));}
      /* eagle: three forward toes and the hallux behind, each a chain of knuckle pads ending in a deep talon pock */
      float toe(vec2 p,vec2 b,float an,float L){vec2 d=vec2(sin(an),cos(an));float t=clamp(dot(p-b,d),0.,L);float r=length(p-b-d*t)/(1.05-.3*t/L);
        vec2 tp=p-b-d*(L+.9);return -smoothstep(1.,.35,r)*(.75+.25*cos(t*2.4))-1.1*exp(-dot(tp,tp)/.3);}
      float talon(vec2 p){float h=min(min(toe(p,vec2(0.),0.,6.3),toe(p,vec2(-.3,0.),-.6,5.)),min(toe(p,vec2(.3,0.),.58,4.8),toe(p,vec2(0.,-.3),3.14159,3.8)));
        h=min(h,-.8*smoothstep(1.,.3,length(p/vec2(1.9,1.7))));return h+.12*(dn2(p*1.2+vSd*7.)-.5);}
      /* wing: the primaries' tips brushed through the sand on landing or take-off, a fan of shallow grooves with low ridges */
      float wing(vec2 p){float h=0.;for(int i=0;i<6;i++){float f=float(i),a=(f-2.5)*.1;vec2 d=vec2(sin(a),cos(a)),q=p-vec2((f-2.5)*5.,-34.);
        float t=dot(q,d),s=dot(q,vec2(d.y,-d.x))+.9*sin(t*.11+f+vSd*6.),L=50.+9.*sin(f*1.7+vSd*5.);
        h+=smoothstep(0.,9.,t)*smoothstep(L,L-16.,t)*(-.5*exp(-s*s/.45)+.16*exp(-(abs(s)-1.3)*(abs(s)-1.3)/.35));}return h;}
      /* where a camel lay: its weight rests on the callosities, deepest under the chest pad, then the elbows, the folded knees
         and the stifles, in a soft hollow pressed by the belly with the displaced sand heaped round it */
      float pad(vec2 p,vec2 c,vec2 r){vec2 q=(p-c)/r;return exp(-dot(q,q));}
      float lie(vec2 p,float bk){p/=bk>.5?1.1:1.;vec2 m=vec2(abs(p.x),p.y);float q=length((p-vec2(0.,-4.))/vec2(43.,80.))+(dn2(p*.06+vSd*4.)-.5)*.12;
        float h=-3.4*smoothstep(1.02,.4,q)+2.*exp(-(q-1.08)*(q-1.08)*18.);
        h-=4.5*pad(p,vec2(0.,36.),vec2(14.,12.))+3.*pad(m,vec2(25.,28.),vec2(8.,9.))+3.4*pad(m,vec2(15.,62.),vec2(8.,11.))+2.8*pad(m,vec2(33.,-40.),vec2(10.,9.));
        /* kneeling down and getting up, the folded forelegs drag two short scuffs forward of the knee pads */
        float sx=m.x-15.-.08*(p.y-62.),sy=p.y-62.;h-=1.6*exp(-sx*sx/18.)*smoothstep(0.,6.,sy)*smoothstep(34.,18.,sy);
        return h+.35*(dn2(p*.5+vSd*9.)-.5);}
      /* the dromedary's smaller pads sink deeper for their size (less foot under the same weight class) */
      /* ostrich: the big third toe pressed deep with a claw pock past its tip and creases across its pads, the small fourth toe
         splayed to the outside, the sand thrown up in a crescent ahead where the foot pushed off */
      float ost(vec2 p){vec2 a=vec2(0.,-5.),b=vec2(.3,7.),e=b-a;float t=clamp(dot(p-a,e)/dot(e,e),0.,1.),q1=length(p-a-e*t)/(3.3-.9*t);
        vec2 c=vec2(2.6,-3.),f=vec2(5.4,3.2)-c;float u=clamp(dot(p-c,f)/dot(f,f),0.,1.),q2=length(p-c-f*u)/(2.-.6*u);
        float q=-.25*log(exp(-q1/.25)+exp(-q2/.25)),h=-1.3*smoothstep(1.,.45,q);vec2 cw=p-vec2(.45,9.8);h-=1.3*exp(-dot(cw,cw)/1.1);
        h+=.25*sin(p.y*1.15)*smoothstep(1.,.3,q1)*step(-3.,p.y);h+=.5*exp(-(q-1.2)*(q-1.2)*9.)*(1.+.9*smoothstep(-4.,10.,p.y));
        return 1.4*(h+.1*(dn2(p*1.3+vSd*9.)-.5)*smoothstep(1.2,.6,q));}
      /* desert tortoise: a round elephantine sole with the nails dug in ahead of it, five on the fore foot, four behind */
      float tort(vec2 p,float hind){vec2 q=p/vec2(hind>.5?1.8:2.1,hind>.5?1.9:1.6);float r=length(q)+(dn2(p*1.7+vSd*9.)-.5)*.15;
        float h=-1.1*smoothstep(1.,.45,r)+.4*exp(-(r-1.18)*(r-1.18)*8.);
        for(int i=0;i<5;i++){if(hind>.5&&i==4)break;float n=hind>.5?3.:4.,a=(float(i)/n-.5)*1.5;vec2 d=p-vec2(sin(a)*2.5,cos(a)*2.4+.5);h-=.9*exp(-dot(d,d)/.16);}
        return h;}
      /* gerbil hop set: the two long hind feet side by side and the small fore feet pressed between and ahead of them */
      float gerb(vec2 p){float h=0.;for(int i=0;i<2;i++){float s=float(i)*2.-1.;vec2 q=(p-vec2(s*1.05,-.8))/vec2(.42,1.15);h-=exp(-dot(q,q)*1.6);
        vec2 f=(p-vec2(s*.42,1.7))/vec2(.32,.36);h-=.85*exp(-dot(f,f)*1.6);
        for(int t=0;t<3;t++){vec2 c=p-vec2(s*1.05+(float(t)-1.)*.3,.55+.1*(1.-abs(float(t)-1.)));h-=.55*exp(-dot(c,c)/.035);}}
        return 1.25*h;}
      /* scorpion: four leg tips each side, a short arc of pin-pricks */
      float scorp(vec2 p){float h=0.;for(int i=0;i<4;i++){float f=float(i);for(int j=0;j<2;j++){float s=float(j)*2.-1.;
        vec2 d=p-vec2(s*(1.6+.4*f-.1*f*f),1.5-f*1.+.3*sin(vSd*9.+f*2.+s));h-=exp(-dot(d,d)/.07);}}return h;}
      /* a hollow scraped or sat into the sand: a tortoise's shade pallet, the dip where an ostrich sat, the spoil heaped ahead */
      float pal(vec2 p){float q=length(p/vec2(18.,23.))+(dn2(p*.12+vSd*4.)-.5)*.14;
        return -2.6*smoothstep(1.03,.35,q)+1.5*exp(-(q-1.1)*(q-1.1)*14.)*(1.+1.4*smoothstep(0.,22.,p.y))+.3*(dn2(p*.6+vSd*7.)-.5);}
      /* a gerbil's hole: a dark mouth sloping down under the sand, the spoil kicked out of it fanned on one side */
      float hole(vec2 p){float r=length(p/vec2(2.5,2.3))+(dn2(p*.9+vSd*3.)-.5)*.12;vec2 m=(p-vec2(0.,4.6))/vec2(4.2,3.4);
        return -5.*smoothstep(1.05,.25,r)+.9*exp(-(r-1.15)*(r-1.15)*6.)+1.5*exp(-dot(m,m))*(1.+.4*dn2(p*.7+vSd*5.));}
      float hgt(vec2 p,float k,float v){if(k>9.5)return hole(p);if(k<1.5)return camel(p,v,k)*(k<.5?1.4:1.);if(k<2.5)return talon(p);if(k<3.5)return wing(p);if(k<4.5)return lie(p,v);
        if(k<5.5)return ost(p);if(k<6.5)return tort(p,v);if(k<7.5)return gerb(p);if(k<8.5)return scorp(p);return pal(p);}
      /* wear (w 0 fresh .. 1 gone): the heaped rims blow away first and the walls slump, while drifting sand fills the print
         from its upwind edge in a ragged front that creeps downwind */
      float hW(vec2 p,float k,float v,float w){float h=hgt(p,k,v);h*=h>0.?(1.-w)*(1.-w):1.-.35*w;
        vec2 q=p/(50.*vec2(vS,vL));float up=dot(q,vWl)*.5+.5+(dn2(p*.22+vSd*5.)-.5)*.5+(dn2(p*.9+vSd*2.)-.5)*.15;
        return h*(1.-smoothstep(-.12,.12,w*1.5-up));}
      void main(){float k=floor(vK.x+.001),v=fract(vK.x)*4.;vec2 p=vec2(vQ.x*vS,vQ.y*vL)*100.;
        float a=clamp(vK.z*exp(-max(uE-vK.y,0.)),0.,1.);if(a<.01)discard;float w=1.-min(1.,a*1.15);
        float e=.1,h0=hW(p,k,v,w),hx=hW(p+vec2(e,0.),k,v,w),hz=hW(p+vec2(0.,e),k,v,w);a=smoothstep(0.,.25,a);
        vec3 n=normalize(vec3(-(hx-h0)/e*a,1.,-(hz-h0)/e*a)),L=normalize(vec3(dot(uLd,vAx),max(uLd.y,.03),dot(uLd,vAz)));
        /* the floor of a print sits in its own shadow, so a track still reads as a line of dark dents from far off; close up the
           relief carries it and the floor is only a little darker than the sand round it */
        float big=step(3.5,k)*step(k,4.5)+step(8.5,k),df=max(dot(n,L),0.)/max(L.y,.18),ao=1.-(big>.5?.16:mix(.2,.45,smoothstep(.4,2.,max(fwidth(p.x),fwidth(p.y)))))*clamp(-h0*a/(big>.5?4.:1.2),0.,1.);
        float F=clamp(mix(1.,df,uKs)*ao,.12,1.7);
        /* pressed sand is packed smooth and reads darker than the loose sand round it, the heaped rim lighter, whatever the sun's height */
        if(big>.5)F*=(1.-.2*clamp(-h0/2.5,0.,1.))*(1.+.1*clamp(h0/1.5,0.,1.));
        if(k>9.5)F*=mix(1.,.18,smoothstep(-1.5,-4.,h0));
        /* a print only a few pixels across: its lit rim and shaded floor would average out to nothing, so it settles to a soft dent */
        float os=step(4.5,k)*step(k,5.5),lod=smoothstep(1.2,3.5,max(fwidth(p.x),fwidth(p.y)))*max(step(k,2.5),os),R=k<.5?10.5*vG:k<1.5?9.*vG:os>.5?5.5*vG:6.*vG;
        F=mix(F,1.-(k<.5?.62:.42)*(k<2.5||os>.5?exp(-dot(p-vec2(0.,os*2.),p-vec2(0.,os*2.))/(R*R)):clamp(-h0*1.4,0.,1.)),lod);
        F=mix(1.,F,a*smoothstep(.5,.42,max(abs(vQ.x),abs(vQ.y))/vG));
        /* in a dusting of snow the foot pushes through to the sand: the print's floor shows dark and warm against the white */
        float sk=uSnw*a*clamp(max(-h0*1.3,(1.-F)*2.2),0.,1.)*smoothstep(.5,.42,max(abs(vQ.x),abs(vQ.y))/vG);
        if(abs(F-1.)<.004&&sk<.004)discard;gl_FragColor=vec4(.5*F*mix(vec3(1.),vec3(.78,.64,.5),sk*.8),1.);}`});
  const im=new T.IM(geo,m,N);im.count=0;im.frustumCulled=false;im.renderOrder=1;im.castShadow=im.receiveShadow=false;
  const c=new C3(0,0,0);for(let i=0;i<N;i++)im.setColorAt(i,c);W.add(im);onDes(im);
  return{N,im,i:0,n:0,E:0,dirty:0,up:0,m4:new T.M4(),q:new T.Quat(),q2:new T.Quat(),v:new V3(),s:new V3(),c}})();
const _up=new V3(0,1,0);
/* kind, island-metre position, heading of the print's forward (+z), variant 0-3, depth (1 = typical), mirrored, scale */
function prAdd(k,x,z,yaw,v,dep,mir,sc){if(pN(x,z)<1.02)return;const P=PR,i=P.i;P.i=(i+1)%P.N;P.n=Math.min(P.n+1,P.N);
  P.q2.setFromUnitVectors(_up,nTop(x,z));P.q.setFromAxisAngle(_up,yaw).premultiply(P.q2);
  const s=PR_SZ[k]*(sc||1);P.s.set(mir?-s:s,1,s);P.v.set(x,hTop(x,z)+.003,z);P.m4.compose(P.v,P.q,P.s);P.im.setMatrixAt(i,P.m4);
  P.im.setColorAt(i,P.c.setRGB(k+(v||0)/4,P.E,dep==null?1:dep));P.dirty=1;P.im.count=P.n}
function prTick(dt){const P=PR;P.E+=dt*(1/240+st.wn*(1-.8*WX.sc)*.3/35+WX.dust/6+WX.rain/9+WX.sf/40);P.im.material.uniforms.uE.value=P.E;
  P.im.material.uniforms.uSnw.value=ss(.05,.5,WX.sc);
  if(pi&&dc)P.im.material.uniforms.uKs.value=cl(pi.intensity/(pi.intensity+dc.intensity*1.4+1e-3),.12,.85);
  P.up+=dt;if(P.dirty&&P.up>.15){P.up=0;P.dirty=0;P.im.instanceMatrix.needsUpdate=true;P.im.instanceColor.needsUpdate=true}}
/* a foot comes to rest: after a swing (moving faster than the body) it slows almost to a stop at the ground */
const _pf=new V3();
function footPlant(f,b,spd,dt,lift){if(dt<.004)return null;b.getWorldPosition(_pf);W.worldToLocal(_pf);let hit=null;
  if(f.p){const v=Math.hypot(_pf.x-f.p.x,_pf.z-f.p.z)/Math.max(dt,1e-3);
    if(v>spd*.6)f.sw=1;else if(f.sw&&v<spd*.25&&_pf.y-hTop(_pf.x,_pf.z)<lift){f.sw=0;hit=_pf}
    f.p.copy(_pf)}else f.p=_pf.clone();return hit}

/* ---- camels ---- */
const REST=[{...tl(4.2,5.2),yaw:TENT.yaw+Math.PI/2+.15},{x:14.2,z:2.6,yaw:-Math.PI/2-.35}];
const DRINK=(()=>{const th=BEACH[0],[x,z]=pondEdge(th,1),nx=Math.cos(th),nz=Math.sin(th);return{x:x+nx*1.0,z:z+nz*1.0,yaw:Math.atan2(-nx,-nz)}})();
/* v4 clips: kneel_down 5.6 s (front knees, then hind, then onto the sternal pad), kneel_rest loop, stand_up 5.4 s (hind end
   first) ending on idle's first frame; there is no graze clip, so grazing uses drink (the neck lowers to the ground and sips) */
const CK={down:5.6,up:5.4};
/* two camels: a dromedary (camel_v4b, slot 0) and a Bactrian (bactrian_v1, slot 1; same skeleton and clips, dark coat and
   real hair tufts). Both walks are authored for .989 m/s in place. The Bactrian stands 1.73 m at the withers in idle and is
   scaled to 1.8 m (humps ~2.1 m, against the dromedary's 2.26 m); its short legs make the dromedary stride look hurried,
   so its walk plays 10 % slower and its ground speed drops by the same factor, keeping the hooves planted.
   coat 1 = the dromedary coat shader (the Bactrian keeps its own texture); voice = call pitch per slot. */
const CAMEL_KIND={drom:{file:"camel_v4b",sc:CAM_SC,gait:1,coat:1,voice:[1,.92]},bact:{file:"bactrian_v1",sc:1.8/1.73,gait:.9,coat:0,voice:[.84,.84]}};
const CAMEL_SLOTS=["drom","bact"];
const camelKind=i=>{const k=CAMEL_KIND[CAMEL_SLOTS[i]];return k&&k.file?k:CAMEL_KIND.drom};
/* the kneel clips drop the root ~3 cm in a single key where the knees meet the sand; two short box passes keep the settle without the pop */
function smoothRoot(anims){for(const c of anims)if(/kneel_down|stand_up/.test(c.name))for(const t of c.tracks)if(!t._sm&&/Root\.position$/.test(t.name)){t._sm=1;const v=t.values,n=v.length/3;
  for(let p=0;p<2;p++){const o=Float32Array.from(v);for(let i=1;i<n-1;i++){const r=Math.min(4,i,n-1-i);for(let d=0;d<3;d++){let s=0;for(let j=-r;j<=r;j++)s+=o[(i+j)*3+d];v[i*3+d]=s/(2*r+1)}}}}}
/* fur: shells over each camel's body, clones of the skinned mesh on its own skeleton. Shell k of N sits k/N of the local hair
   length out along the skinned normal and droops under gravity (and flutters a little in the wind) the further out it is; each
   cuts strands out of a jittered cell pattern laid in bind-pose metres, tapering to the tips, and once a strand is under a pixel
   it is widened to about a pixel with its alpha cut to keep the coverage it would give (alpha-to-coverage), so a shell never
   fills in as a solid layer, and far off the coat reads as soft fuzz.
   Hair is short over most of the body and long where camels carry it: the hump(s), the mane along the neck, the throat, the
   tail, and on the Bactrian a beard, leg "chaps" and a forelock (head at +z, humps at z -.4, or -.8 and 0, in bind pose).
   Shells are only drawn within a few metres of the camera and fewer of them on phones. */
const FUR_N=MOB?5:12,FUR_D=MOB?4.5:9,_fD=new V3(),_fW=new V3(),_fM=new T.M4();
const FUR_V=`uniform float uH,uKind,uFT;uniform vec3 uDown,uWindO;varying vec3 vFP,vFN;varying float vFL;
  float bmp(float x,float c,float w){return smoothstep(w,0.,abs(x-c));}
  float furLen(vec3 p,vec3 n){float y=p.y,z=p.z,up=n.y,bk=uKind;
    float hump=smoothstep(1.4,1.8,y)*smoothstep(-.15,.4,up)*(bk>.5?max(bmp(z,-.8,.42),bmp(z,0.,.42)):bmp(z,-.4,.55));
    float mane=smoothstep(.4,.6,z)*smoothstep(1.2,1.0,z)*smoothstep(1.05,1.35,y)*smoothstep(-.1,.4,up);
    float thr=smoothstep(.35,.55,z)*smoothstep(1.12,.95,z)*smoothstep(.85,1.05,y)*smoothstep(1.7,1.45,y)*smoothstep(.05,-.35,up);
    float tail=smoothstep(-1.2,-1.38,z)*smoothstep(1.3,.7,y);
    float chap=smoothstep(.2,.35,z)*smoothstep(.8,.6,z)*smoothstep(.7,.85,y)*smoothstep(1.3,1.1,y)*smoothstep(.25,.55,abs(n.x));
    float fore=smoothstep(1.12,1.25,z)*smoothstep(1.72,1.84,y)*smoothstep(-.1,.4,up);
    float low=smoothstep(.55,.8,y);
    return bk>.5?(.016*low+.004)+.1*hump+.05*mane+.11*thr+.07*tail+.085*chap+.055*fore
                :(.005*low+.002)+.065*hump+.038*mane+.05*thr+.07*tail;}`;
const FUR_F=`uniform float uH,uKind;varying vec3 vFP,vFN;varying float vFL;
  float fh1(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}`;
function furMat(src,h,U,bk){const m=src.clone(),base=src.onBeforeCompile;m.alphaToCoverage=true;m.transparent=false;m.side=0;
  m.onBeforeCompile=(sh,r)=>{if(base&&base!==m.onBeforeCompile)base.call(m,sh,r);Object.assign(sh.uniforms,U,{uH:{value:h}});
    sh.vertexShader=sh.vertexShader.replace("#include <common>","#include <common>\n"+FUR_V)
      .replace("#include <skinning_vertex>",`#include <skinning_vertex>
        {vFP=position;vFN=normal;float L=furLen(position,normal);vFL=L;vec3 nS=normalize(objectNormal);
         transformed+=nS*L*uH+uDown*L*uH*uH*.75+uWindO*L*uH*uH*(.55+.45*sin(uFT*3.3+dot(position,vec3(9.,4.,6.))));}`);
    sh.fragmentShader=sh.fragmentShader.replace("#include <common>","#include <common>\n"+FUR_F)
      .replace("#include <color_fragment>",`#include <color_fragment>
        {if(vFL<.0022)discard;vec3 an=abs(vFN);float cs=mix(.0022,.0055,smoothstep(.01,.08,vFL));
         vec2 q=(an.x>an.y&&an.x>an.z?vFP.zy*vec2(1.,.6):an.y>an.z?vFP.xz:vFP.xy*vec2(1.,.6))/cs;
         vec2 c=floor(q),f=fract(q);float ln=.4+.6*fh1(c+3.),r=.36*(1.-uH/ln);
         vec2 o=.28+.44*vec2(fh1(c),fh1(c+11.));float rs=max(r,0.),fw=min(length(fwidth(q)),.45),re=max(rs,.55*fw);
         diffuseColor.a=step(uH,ln)*smoothstep(re,re*.45,length(f-o))*min(1.,rs*rs/(re*re)*1.3);if(diffuseColor.a<.04)discard;
         diffuseColor.rgb*=mix(.58,1.06,uH)*(1.+${bk?".0":".12"}*uH*uH);}`)};
  m.customProgramCacheKey=()=>"des81fur"+(src.userData.coat?"c":"t");m.needsUpdate=true;return m}
function furUp(a){const bk=CAMEL_SLOTS[a.i]==="bact"?1:0,U={uKind:{value:bk},uFT:{value:0},uDown:{value:new V3(0,-1,0)},uWindO:{value:new V3()}},sh=[];
  const SK=VT.THREE.SkinnedMesh;let body=null;a.mdl.traverse(o=>{if(o.isSkinnedMesh&&o.name==="Camel"&&!body)body=o});if(!body||!SK)return;
  for(let k=1;k<=FUR_N;k++){const s=new SK(body.geometry,furMat(body.material,k/FUR_N,U,bk));s.bind(body.skeleton,body.bindMatrix);
    s.position.copy(body.position);s.quaternion.copy(body.quaternion);s.scale.copy(body.scale);s.castShadow=false;s.receiveShadow=true;s.frustumCulled=false;s.visible=false;
    body.parent.add(s);sh.push(s)}
  /* the Bactrian file's own hair cards lie over the shells as stiff dark strips; the shells carry its long hair instead */
  if(bk)a.mdl.traverse(o=>{if(o.isMesh&&o.name==="Fur")o.visible=false});
  a.fur={U,sh,body}}
function furTick(a){const F=a.fur;if(!F)return;const d=Math.hypot(_cl.x-a.x,_cl.y-(a.g.position.y+1.3*a.sc),_cl.z-a.z),n=root.visible?d<FUR_D*.45?FUR_N:d<FUR_D?Math.ceil(FUR_N/2):0:0;
  F.sh.forEach((s,k)=>{s.visible=n===FUR_N||n>0&&k%2===1});if(!n)return;
  F.body.updateMatrixWorld();_fM.copy(F.body.matrixWorld).invert();F.U.uDown.value.copy(_fD.set(0,-1,0).transformDirection(_fM));
  const g=gustAt(a.x,a.z)*st.wn;F.U.uWindO.value.copy(_fW.set(WIND.x,0,WIND.z).transformDirection(_fM)).multiplyScalar(.5*g);F.U.uFT.value=st.t}
function camelSpawn(sc,anims,i,kind){smoothRoot(anims);
 const g=new T.Group(),inner=new T.Group();g.rotation.order="YXZ";const s=kind.sc;
  sc.position.y=0;inner.add(sc);inner.scale.setScalar(s);g.add(inner);animalMats(g,kind.coat);W.add(g);onDes(g);
  const a={i,kind,sc:s,gait:kind.gait,v:.989*s*kind.gait,voice:kind.voice[i]||1,g,inner,mdl:sc,r:rigUp(sc,anims),bones:{},x:0,z:0,yaw:0,yr:0,spd:0,gy:null,gp:0,gr:0,k:0,mode:"job",job:"idle",timer:rr(2,5),path:null,pi:0,face:null,stuck:0};
  sc.traverse(o=>{if(o.isBone)a.bones[o.name]=o});
  for(const k of["kneel_down","stand_up"]){const c=a.r.acts[k];if(c){c.setLoop(VT.THREE.LoopOnce,1);c.clampWhenFinished=true}}
  /* the four feet: the tip below each leg's last joint, fore or hind by where it stands in the bind pose */
  a.feet=[];for(const n in a.bones){const m=n.match(/([01])_(Left|Right)_Limb_3$/);if(!m)continue;const b=a.bones[n];a.feet.push({b:b.children.find(c=>c.isBone)||b,R:m[2]==="Right",p:null,sw:0,hind:0})}
  if(a.feet.length===4){g.updateMatrixWorld(true);const z=a.feet.map(f=>g.worldToLocal(f.b.getWorldPosition(new V3())).z),mid=[...z].sort((x,y)=>x-y).slice(1,3).reduce((x,y)=>x+y)/2;a.feet.forEach((f,i)=>{f.hind=z[i]<mid?1:0})}
  furUp(a);return a}
function camelPrints(a,dt){if(a.spd<.05){for(const f of a.feet)f.p=null;return}const bk=CAMEL_SLOTS[a.i]==="bact";
  for(const f of a.feet){const h=footPlant(f,f.b,a.spd,dt,.3);if(h)prAdd(bk?PRK.bact:PRK.drom,h.x,h.z,a.yaw+.06*Math.sin(h.x*7.1+h.z*3.3),f.hind,1,f.R)}}
/* the hollow it lay in, left as it gets up: centred under the chest and belly, a little ahead of the root */
function camelLie(a){const bk=CAMEL_SLOTS[a.i]==="bact",f=.12*a.sc;prAdd(PRK.lie,a.x+Math.sin(a.yaw)*f,a.z+Math.cos(a.yaw)*f,a.yaw,bk?1:0,1,0,a.sc)}
function camelGo(a,to,job){
  const g=navGrid("camel",1.05,1.12,.84),blk=ANIM.camels.filter(o=>o!==a&&o.spd<.05).map(o=>({x:o.x,z:o.z,r:2.6})),p=navPath(g,a.x,a.z,to.x,to.z,blk);
  if(!p){a.mode="job";a.job="idle";a.timer=rr(3,6);play(a.r,"idle",1,1);return false}
  a.path=p;a.pi=1;a.face=to.yaw!=null?to.yaw:null;a.job=job;a.mode="walk";a.goal=to;return true}
const roomy=(a,x,z)=>ANIM.camels.every(o=>o===a||(Math.hypot(o.x-x,o.z-z)>5.5&&(!o.goal||Math.hypot(o.goal.x-x,o.goal.z-z)>5.5)));
function grazeSpot(a){const g=navGrid("camel",1.05,1.12,.84);
  for(let t=0;t<60;t++){const th=rr(-.5,1.9),k=rr(1.25,1.65),[x,z]=pondEdge(th,k);if(navFree(g,x,z)&&(!a||roomy(a,x,z)))return{x,z,yaw:Math.atan2(POND.x-x,POND.z-z)+rr(-1.3,1.3)}}
  return randFree(g,0,4,12)||{x:0,z:6}}
/* by day the two keep different jobs (one grazes while the other drinks or lies down); at night both kneel at their rest spots */
function camelPlan(a){
  if(st.phase==="night"||WX.shel){camelGo(a,camelShelter(a),"kneel");return}
  /* in fog they stand where they are, coats beading with dew, and wait for it to lift */
  /* in hail they turn their backs to the wind and stand it out */
  if(WX.hcold){camelBrace(a);return}
  if(camHold()){a.mode="job";a.job="idle";a.timer=rr(12,24);play(a.r,"idle",1,1);return}
  /* the snow has stopped falling but it still lies: a few steps to a nearby kneel never makes a stride.
     Send them across the open snow so the walk is several strides long. */
  if(WX.sc>.08){const g=navGrid("camel",1.05,1.12,.84);
    for(let t=0;t<50;t++){const th=rnd()*TAU,d=rr(8,16),x=a.x+Math.sin(th)*d,z=a.z+Math.cos(th)*d;
      if(navFree(g,x,z)&&sN(x,z)<.9&&roomy(a,x,z)&&camelGo(a,{x,z},"graze"))return}}
  const busy=j=>ANIM.camels.some(o=>o!==a&&o.job===j),near=(p,r)=>ANIM.camels.some(o=>o!==a&&(Math.hypot(o.x-p.x,o.z-p.z)<r||(o.goal&&Math.hypot(o.goal.x-p.x,o.goal.z-p.z)<r)));
  const opts=[["drink",.3],["graze",.32],["kneel",.2],["idle",.18]].filter(([j])=>j==="idle"||!busy(j)&&(j!=="drink"||!near(DRINK,4.5)));
  let r=rnd()*opts.reduce((s,o)=>s+o[1],0),job="idle";for(const[j,w]of opts){if((r-=w)<0){job=j;break}}
  if(job==="drink")camelGo(a,DRINK,"drink");
  else if(job==="graze")camelGo(a,grazeSpot(a),"graze");
  else if(job==="kneel")camelGo(a,REST[a.i],"kneel");
  else{const g=navGrid("camel",1.05,1.12,.84),p=randFree(g,0,2,20,(x,z)=>sN(x,z)<.72&&roomy(a,x,z));camelGo(a,p||REST[a.i],"idle")}}
/* in a dust storm camels kneel with their backs to the wind; in a downpour they kneel where they rest at night */
/* camels wait out the fog and the falling snow; once it stops they walk on the lying snow again */
const camHold=()=>WX.fcold||WX.hcold||WX.sf>.05;
function camelBrace(a){a.job="idle";a.path=null;a.timer=rr(6,12);a.face=Math.atan2(WIND.x,WIND.z)+(a.i?.18:-.18);a.mode="turn"}
function camelShelter(a){const r=REST[a.i];return WX.dust>.3?{x:r.x,z:r.z,yaw:Math.atan2(WIND.x,WIND.z)+(a.i?.25:-.25)}:r}
function camelUpdate(a,dt){
  const night=st.phase==="night",stay=night||WX.shel>0;
  if(stay&&a.job!=="kneel"&&a.mode!=="up"){if(a.mode==="walk"||a.mode==="job"||a.mode==="turn")camelGo(a,camelShelter(a),"kneel")}
  else if(WX.hcold&&(a.mode==="walk"||a.mode==="job"&&Math.abs(wrapA(Math.atan2(WIND.x,WIND.z)-a.yaw))>.7))camelBrace(a);
  else if(camHold()&&a.mode==="walk"){a.mode="job";a.job="idle";a.path=null;a.timer=rr(12,24);play(a.r,"idle",1,1)}
  let dy=0,vT=0,ym=.75;
  if(a.mode==="walk"){
    /* still on lying snow: don't end the walk a stride from the goal, or a resumed crossing crunches once */
    if(WX.sc>.08&&!camHold()&&!night&&(a.job==="graze"||a.job==="idle")){const lastP=a.path[a.path.length-1];
      if(lastP&&Math.hypot(lastP.x-a.x,lastP.z-a.z)<4){const g=navGrid("camel",1.05,1.12,.84),blk=ANIM.camels.filter(o=>o!==a&&o.spd<.05).map(o=>({x:o.x,z:o.z,r:2.6}));
        for(let t=0;t<24;t++){const th=rnd()*TAU,d=rr(8,14),x=a.x+Math.sin(th)*d,z=a.z+Math.cos(th)*d;
          if(!navFree(g,x,z)||!roomy(a,x,z))continue;const pth=navPath(g,a.x,a.z,x,z,blk)||navPath(g,a.x,a.z,x,z);
          if(pth){a.path=pth;a.pi=1;a.face=null;a.job="graze";a.goal={x,z};break}}}}
    let wp=a.path[a.pi],last=a.pi===a.path.length-1;
    if(!last&&Math.hypot(wp.x-a.x,wp.z-a.z)<1.1){a.pi++;wp=a.path[a.pi];last=a.pi===a.path.length-1}
    const dx=wp.x-a.x,dz=wp.z-a.z,d=Math.hypot(dx,dz);dy=wrapA(Math.atan2(dx,dz)-a.yaw);
    if(last&&(d<.15||(d<.7&&Math.abs(dy)>1.4))){a.mode="turn";dy=0}
    else{vT=a.v*cl(1-Math.abs(dy)/1.1,.18,1)*(last?cl(Math.sqrt(d/2.6),0,1):1);
      for(const o of ANIM.camels){if(o===a)continue;const ox=o.x-a.x,oz=o.z-a.z,fw=ox*Math.sin(a.yaw)+oz*Math.cos(a.yaw),lat=Math.abs(ox*Math.cos(a.yaw)-oz*Math.sin(a.yaw));if(fw>0&&fw<3.8&&lat<1.9)vT=0}
      a.stuck=vT<.05?a.stuck+dt:0;if(a.stuck>5){a.stuck=0;camelPlan(a)}
      play(a.r,"walk",.6,Math.max(.2,a.spd/a.v)*a.gait)}}
  else if(a.mode==="turn"){
    dy=a.face==null?0:wrapA(a.face-a.yaw);ym=.5;
    if(Math.abs(dy)<.04&&Math.abs(a.yr)<.06&&a.spd<.05){a.mode="job";
      if(a.job==="drink"){a.timer=14;play(a.r,"drink",1.2,1)}
      else if(a.job==="graze"){a.timer=rr(9,18);play(a.r,"drink",1.2,.85)}
      else if(a.job==="kneel"){a.mode="down";play(a.r,"kneel_down",.5,1);if(rnd()<.8)camelCall(a,"down")}
      else{a.timer=rr(4,9);play(a.r,"idle",1.2,1)}}
    else play(a.r,"walk",.6,Math.max(.3,a.spd/a.v)*a.gait)}
  else if(a.mode==="down"){a.k=Math.min(1,a.k+dt/CK.down);if(a.k>=1){a.mode="rest";a.timer=rr(30,55);play(a.r,"kneel_rest",.3,night?.7:1)}}
  else if(a.mode==="rest"){if(a.r.acts.kneel_rest)a.r.acts.kneel_rest.timeScale=night?.7:1;
    if(!stay){a.timer-=dt;if(a.timer<0){a.mode="up";play(a.r,"stand_up",.3,1);if(rnd()<.8)camelCall(a,"up");camelLie(a)}}}
  else if(a.mode==="up"){a.k=Math.max(0,a.k-dt/CK.up);if(a.k<=0){a.job="idle";play(a.r,"idle",.3,1);camelPlan(a)}}
  else if(a.mode==="job"){a.timer-=dt;if(a.timer<0)camelPlan(a)}
  /* one integrator for every mode: speed and heading carry over mode changes instead of snapping */
  a.spd+=(vT-a.spd)*ease(a.mode==="walk"?2.2:4,dt);steer(a,dy,ym,dt);
  if(a.spd>1e-4){a.x+=Math.sin(a.yaw)*a.spd*dt;a.z+=Math.cos(a.yaw)*a.spd*dt}
  /* the sand under the feet is sampled sparsely and creeps with the dune: follow it through a short low-pass */
  const f=groundFrame(a.x,a.z,a.yaw,1.25,.45),kk=a.k;
  if(a.gy==null||Math.abs(f.y-a.gy)>.6){a.gy=f.y;a.gp=f.pitch;a.gr=f.roll}
  const gk=ease(9,dt);a.gy+=(f.y-a.gy)*gk;a.gp+=(f.pitch-a.gp)*gk;a.gr+=(f.roll-a.gr)*gk;
  a.g.position.set(a.x,a.gy,a.z);a.g.rotation.set(a.gp*(1-.5*kk),a.yaw,a.gr*(1-.5*kk));
  rigTick(a.r,dt);camelPrints(a,dt);
  /* footsteps crunch in the snow, about one a stride per foot */
  if(WX.sc>.05&&a.spd>.08){a.stD=(a.stD||0)+a.spd*dt;if(a.stD>.75){a.stD=0;if(amb())shotS("dCrn",.42*ss(.05,.4,WX.sc)*cl(a.spd/.9,.5,1),_crP.set(a.x+Math.sin(a.yaw)*rr(-1,1),hTop(a.x,a.z),a.z+Math.cos(a.yaw)*rr(-1,1)),5,rr(.85,1.15))}}}

/* ---- eagle: soars in a thermal, lands on the saguaro top or at the west beach ---- */
const _e0=new V3(),_e1=new V3(),_t0=new V3(),_t1=new V3(),_ev=new V3();
function hermV(s,t,out){const t2=t*t;return out.set(0,0,0).addScaledVector(s.p0,6*t2-6*t).addScaledVector(s.m0,3*t2-4*t+1).addScaledVector(s.p1,6*t-6*t2).addScaledVector(s.m1,3*t2-2*t).divideScalar(s.T)}
function herm(p0,m0,p1,m1,t,out){const t2=t*t,t3=t2*t;return out.set(0,0,0).addScaledVector(p0,2*t3-3*t2+1).addScaledVector(m0,t3-2*t2+t).addScaledVector(p1,-2*t3+3*t2).addScaledVector(m1,t3-t2)}
function eagleSpots(){
  const sp=[];if(PROPS.sagTop)sp.push({k:"sag",p:PROPS.sagTop.clone(),yaw:SAG[0].ry+2.2});
  const th=BEACH[1],[x,z]=pondEdge(th,1.06);sp.push({k:"pond",p:new V3(x,hTop(x,z),z),yaw:Math.atan2(POND.x-x,POND.z-z)});return sp}
/* bald_eagle_v1 is one mesh on one skeleton. Its clips keep root motion about the perch origin (flying poses carry the body .71 m
   up): takeoff walks the root 1.36 m forward into flap frame 0, and land starts 1.09 m behind the perch at glide frame 0, at rest.
   The path hands over to and from those clips at their ends; across the cross-fade the group slides by the root offset on the
   incoming clip's weight, so the body never jumps. The group pivots at the flying body, so pitch and bank turn it about itself. */
const E_FLY=.713*EAG_SC;
function eagleSpawn(sc,anims){
  const rt={};for(const n of["glide","flap","land","takeoff"]){const c=anims.find(a=>a.name===n),t=c&&c.tracks.find(t=>t.name==="Root.position");
    if(t){const v=t.values,k=v.length-3;rt[n]={a:new V3(v[0],v[1],v[2]),b:new V3(v[k],v[k+1],v[k+2])}}}
  const g=new T.Group(),inner=new T.Group();g.rotation.order="YXZ";sc.position.y=0;inner.add(sc);inner.scale.setScalar(EAG_SC);inner.position.y=-E_FLY;g.add(inner);
  animalMats(g);W.add(g);onDes(g);const r=rigUp(sc,anims);
  const e={g,fg:g,pg:g,r,fr:r,pr:r,rt,ro:null,mode:"perch",spot:null,timer:rr(14,22),hold:0,settle:0,pf:0,
    th:rnd()*TAU,c:new V3(2,0,-1),c0:new V3(2,0,-1),cv:new V3(),pend:null,R:15,alt:17.5,pos:new V3(),vel:new V3(),bank:0,yaw:0,pit:0,seg:null,flapT:rr(6,12),cry:0};
  for(const k of["takeoff","land"]){const a=r.acts[k];if(a){a.setLoop(VT.THREE.LoopOnce,1);a.clampWhenFinished=true}}
  return e}
const _eo=new V3();
const yawV=(v,y,s,out)=>{const c=Math.cos(y),n=Math.sin(y);return out.set((v.x*c+v.z*n)*s,v.y*s,(-v.x*n+v.z*c)*s)};
function eaglePlace(e){const o=e.ro;_eo.set(0,0,0);
  if(o){const a=e.r.acts[o.a],w=a&&a.isRunning()?a.getEffectiveWeight():1;if(w>=.999)e.ro=null;else yawV(o.X,o.yaw,(1-w)*EAG_SC,_eo)}
  e.g.position.copy(e.pos).add(_eo);e.g.position.y+=E_FLY}
const PUFF=softPoints(MOB?24:44,"#e6d7bd",.1,false);PUFF.o.renderOrder=6;PUFF.o.visible=false;W.add(PUFF.o);
const PUFFP=[];
/* where it comes down on the beach (or pushes off it): both feet's talon prints, and each wing's primaries brushed into the sand */
function eagleMarks(e,off){const yaw=e.spot.yaw,fx=Math.sin(yaw),fz=Math.cos(yaw);let cx=0,cz=0,n=0;
  for(const nm of["Foot_L","Foot_R"]){const b=e.g.getObjectByName(nm);if(!b)continue;b.getWorldPosition(_pf);W.worldToLocal(_pf);cx+=_pf.x;cz+=_pf.z;n++;
    prAdd(PRK.talon,_pf.x,_pf.z,yaw+(nm==="Foot_L"?-.12:.12),0,off?1.3:1,nm==="Foot_R")}
  if(!n){cx=e.spot.p.x;cz=e.spot.p.z}else{cx/=n;cz/=n}
  /* the beach curves with the shore, so a wingtip that would brush the water is moved out from it onto the sand */
  /* landing and take-off sweep the wings through the same arc, so a second brushing deepens the first instead of crossing it */
  for(const sd of[-1,1]){const lx=fz*sd,lz=-fx*sd,k=.9;let wx=cx+lx*k-fx*.12,wz=cz+lz*k-fz*.12;for(let t=0;t<14&&pN(wx,wz)<1.05;t++){const gx=pN(wx+.05,wz)-pN(wx-.05,wz),gz=pN(wx,wz+.05)-pN(wx,wz-.05),gl=Math.hypot(gx,gz)||1;wx+=gx/gl*.08;wz+=gz/gl*.08}
    prAdd(PRK.wing,wx,wz,Math.atan2(lx,lz)+sd*.2,0,off?.8:.9,sd>0)}}
function eaglePuff(p){for(let i=0;i<PUFF.n;i++){const a=rnd()*TAU,u=rr(.5,1.5);
    PUFFP[i]={x:p.x+Math.cos(a)*.12,y:p.y+rr(.05,.35),z:p.z+Math.sin(a)*.12,vx:Math.cos(a)*u,vy:rr(.1,.7),vz:Math.sin(a)*u,life:-rr(0,.12),dur:rr(.7,1.3)};PUFF.Z[i]=rr(.6,1.5)}
  PUFF.o.visible=true}
function puffTick(dt){if(!PUFF.o.visible)return;let any=0;
  for(let i=0;i<PUFF.n;i++){const q=PUFFP[i];q.life+=dt;const u=q.life/q.dur,o=i*3;if(u<1)any=1;
    const dr=Math.exp(-3.2*dt);q.vx=q.vx*dr+WIND.x*.6*dt;q.vz=q.vz*dr+WIND.z*.6*dt;q.vy=q.vy*dr-.25*dt;
    if(q.life>0){q.x+=q.vx*dt;q.y+=q.vy*dt;q.z+=q.vz*dt}
    PUFF.P[o]=q.x;PUFF.P[o+1]=q.y;PUFF.P[o+2]=q.z;PUFF.A[i]=q.life<0||u>=1?0:.55*ss(0,.08,u)*(1-ss(.35,1,u))*(1-.5*st.night)}
  PUFF.g.attributes.position.needsUpdate=PUFF.g.attributes.a.needsUpdate=true;PUFF.m.uniforms.uH.value=innerHeight;if(!any)PUFF.o.visible=false}
function eaglePerchAt(e,spot,landed){e.mode="perch";e.spot=spot;
  e.g.rotation.set(0,spot.yaw,0);e.pos.copy(spot.p);e.vel.set(0,0,0);e.pit=e.bank=0;e.yaw=spot.yaw;
  const L=e.r.acts.land;e.settle=landed&&L?L.getClip().duration:0;
  if(e.settle){play(e.r,"land",.25,1);e.pf=0;e.ro={a:"land",yaw:spot.yaw,X:e.rt.land.a.clone().sub(e.rt.glide.a)}}
  else play(e.r,spot.k==="pond"?"head_turn":"perch",.4,1);eaglePlace(e);
  e.timer=spot.k==="pond"?14:rr(16,26)}
function soarPoint(th,out,t=st.t){return out.set(e_c().x+Math.cos(th)*ANIM.eagle.R,ANIM.eagle.alt+1.6*Math.sin(t*.21),e_c().z+Math.sin(th)*ANIM.eagle.R)}
function soarVel(th,t,out){return out.set(-Math.sin(th)*8.5,1.6*.21*Math.cos(t*.21),Math.cos(th)*8.5)}
function e_c(){return ANIM.eagle.c}
/* take-off: the whole clip plays on the perch (crouch, push-off, first beats, 1.4 m of root travel); the path takes over at
   flap frame 0 from near rest. The join into the thermal is picked so the bird never drifts backward and peaks gently. */
function eagleTakeoff(e){e.mode="rise";const a=e.r.acts.takeoff;e.hold=a?a.getClip().duration:0;e.yaw=e.spot.yaw;e.pit=0;e.pf=0;play(e.r,"takeoff",.3,1);e.cry=1}
function herA(s,t,out){return out.set(0,0,0).addScaledVector(s.p0,12*t-6).addScaledVector(s.m0,6*t-4).addScaledVector(s.p1,6-12*t).addScaledVector(s.m1,6*t-2).divideScalar(s.T*s.T)}
function eagleLaunch(e,over){
  const sp=e.spot,rt=e.rt;e.mode="takeoff";e.c.copy(e.c0);e.pend=null;
  const d=rt.takeoff.b.clone().sub(rt.flap.a),p0=sp.p.clone().add(yawV(d,sp.yaw,EAG_SC,new V3()));
  play(e.r,"flap",.15,1);e.ro={a:"flap",yaw:sp.yaw,X:d.clone().negate()};
  const fw=new V3(Math.sin(sp.yaw),0,Math.cos(sp.yaw)),m0v=fw.clone().multiplyScalar(.15).add(new V3(0,.1,0)),th0=Math.atan2(p0.z-e.c.z,p0.x-e.c.x);
  let best=null;const v=new V3(),ac=new V3();
  for(let k=0;k<14;k++)for(const T of[4.5,5.5,6.5,7.5,8.5]){const th=th0+.3+k*.25,s={p0,m0:m0v.clone().multiplyScalar(T),p1:soarPoint(th,new V3(),st.t+T),m1:soarVel(th,st.t+T,new V3()).multiplyScalar(T),T};
    let pk=0,back=0;for(let i=0;i<=12;i++){const t=i/12;herA(s,t,ac);pk=Math.max(pk,ac.length());hermV(s,t,v);if(t<.5)back=Math.max(back,-(v.x*fw.x+v.z*fw.z))}
    const sc=pk+30*back;if(!best||sc<best.sc)best={sc,s,th}}
  e.th=best.th;e.seg=Object.assign(best.s,{t:over/best.s.T,land:false})}
const GROVE=new V3((PALMS[0].x+PALMS[1].x+PALMS[2].x)/3,0,(PALMS[0].z+PALMS[1].z+PALMS[2].z)/3);
function eagleLand(e,spot){
  const out=new V3(spot.p.x-GROVE.x,0,spot.p.z-GROVE.z).normalize();
  /* a stoop, straight in line with the perch: glide to the entry point just below its height, stoop down the 32° line (dive pose held) to 10 m out
     and 3.5 m up, then the glide-in pulls out and slows onto the perch */
  const h=new V3(spot.p.x-e.pos.x,0,spot.p.z-e.pos.z).normalize(),dirA=new V3(h.x*.85,-.53,h.z*.85).normalize();
  const A=spot.p.clone().addScaledVector(h,-10).add(new V3(0,3.5,0)),E=A.clone().addScaledVector(dirA,-cl((e.pos.y-.6-A.y)/.53,8,24));
  e.mode="land";e.spot=spot;e.final=false;e.appr=A;e.dirA=dirA;
  if((E.x-e.pos.x)*h.x+(E.z-e.pos.z)*h.z<4){eagleStoop(e);return}
  const T=e.pos.distanceTo(E)/8.5;e.seg={p0:e.pos.clone(),m0:e.vel.clone().multiplyScalar(T),p1:E,m1:dirA.clone().multiplyScalar(8.5*T),T,t:0,land:false,appr:1};
  play(e.fr,"glide",.5,1)}
function eagleStoop(e){const T=e.pos.distanceTo(e.appr)/9.75;e.seg={p0:e.pos.clone(),m0:e.vel.clone().multiplyScalar(T),p1:e.appr.clone(),m1:e.dirA.clone().multiplyScalar(11*T),T,t:0,land:false,appr:2};play(e.r,"dive",.6,1)}
function eagleFinal(e){const spot=e.spot;e.final=true;const p1=spot.p.clone();
  const p0=e.pos.clone(),dir=new V3(p1.x-p0.x,0,p1.z-p0.z);const dist=p0.distanceTo(p1);dir.normalize();
  spot.yaw=Math.atan2(dir.x,dir.z);p1.add(yawV(e.rt.land.a.clone().sub(e.rt.glide.a),spot.yaw,EAG_SC,new V3()));
  const T=cl(2.4*dist/Math.max(e.vel.length(),3),1.6,9);
  e.seg={p0,m0:e.vel.clone().multiplyScalar(T),p1,m1:new V3(0,0,0),T,t:0,land:true};
  play(e.fr,"glide",.7,1)}
function eagleUpdate(e,dt){
  const ph=st.phase,wantPerch=ph!=="day"||WX.shel>0||WX.rain>.4||WX.cold>0;puffTick(dt);
  {const L=e.r.acts.land;if(e.r.cur==="land"&&!e.pf&&L&&L.time>=1.96){e.pf=1;if(e.spot.k==="pond"){eaglePuff(e.spot.p);eagleMarks(e,0)}}}
  if(e.mode==="perch"){
    if(e.r.acts.perch)e.r.acts.perch.timeScale=ph==="night"?.35:1;
    if(e.settle>0){e.settle-=dt;if(e.settle<=0)play(e.r,e.spot.k==="pond"?"head_turn":"perch",.4,1)}
    else if(wantPerch){if(e.spot.k!=="sag"){e.timer-=dt;if(e.timer<0)eagleTakeoff(e)}}
    else{e.timer-=dt;if(e.timer<0)eagleTakeoff(e)}
    if(e.mode==="perch"){rigTick(e.r,dt);eaglePlace(e);return}}
  if(e.mode==="rise"){e.hold-=dt;if(!e.pf&&e.hold<1.45){e.pf=1;if(e.spot.k==="pond"){eaglePuff(e.spot.p);eagleMarks(e,1)}}
    if(e.hold>0){rigTick(e.r,dt);eaglePlace(e);return}eagleLaunch(e,-e.hold-dt)}
  /* to land, the thermal first drifts away from the perch (its drift is part of the bird's velocity), then the bird leaves
     the circle when its heading points at the perch, which leaves room for a straight stoop */
  if(e.mode==="soar"){
    const v=8.5,P=e.pend;e.th+=v/e.R*dt;
    if(P){P.u=Math.min(1,P.u+dt/P.T);e.c.lerpVectors(P.c0,P.c1,ss(0,1,P.u));e.cv.subVectors(P.c1,P.c0).multiplyScalar(P.u<1?6*P.u*(1-P.u)/P.T:0)}else e.cv.set(0,0,0);
    soarPoint(e.th,e.pos);soarVel(e.th,st.t,e.vel).add(e.cv);
    e.bank+=(-Math.atan(v*v/(e.R*9.8))-e.bank)*ease(2,dt);
    e.flapT-=dt;if(e.flapT<0){play(e.fr,"flap",.3,1);if(e.flapT<-2.4){e.flapT=rr(8,15);play(e.fr,"glide",.6,1)}}
    if(P){if(P.u>=1&&Math.abs(wrapA(Math.atan2(P.s.p.x-e.pos.x,P.s.p.z-e.pos.z)-Math.atan2(e.vel.x,e.vel.z)))<.03){e.pend=null;e.cv.set(0,0,0);eagleLand(e,P.s)}}
    else{e.timer-=dt;if(wantPerch||e.timer<0){const sp=eagleSpots(),s=wantPerch?sp[0]:(rnd()<.62||sp.length<2?sp[0]:sp[1]);e.timer=rr(28,45);
      if(s){const aw=new V3(e.c.x-s.p.x,0,e.c.z-s.p.z).normalize();e.pend={s,u:0,T:6,c0:e.c.clone(),c1:new V3(s.p.x+aw.x*38,0,s.p.z+aw.z*38)}}}}}
  else{let s=e.seg;s.t+=dt/s.T;
    /* segment joins hand over position, analytic velocity and the leftover time, so the path never stalls a frame */
    if(s.t>=1){const over=(s.t-1)*s.T;herm(s.p0,s.m0,s.p1,s.m1,1,e.pos);hermV(s,1,e.vel);
      if(s.land){eaglePerchAt(e,e.spot,true);rigTick(e.r,dt);eaglePlace(e);return}
      else if(s.appr===1){eagleStoop(e);e.seg.t=over/e.seg.T}
      else if(s.appr){eagleFinal(e);e.seg.t=over/e.seg.T}
      else{e.mode="soar";e.timer=wantPerch?0:rr(25,40);e.th+=8.5/e.R*over;soarPoint(e.th,e.pos);soarVel(e.th,st.t,e.vel)}}
    if(e.mode==="takeoff"||e.mode==="land"){s=e.seg;const t=Math.min(1,s.t);herm(s.p0,s.m0,s.p1,s.m1,t,e.pos);hermV(s,t,e.vel);
      e.bank+=(0-e.bank)*ease(2,dt);
      if(!s.land&&!s.appr&&s.t*s.T>3&&e.r.cur==="flap")play(e.r,"glide",.6,1)}}
  /* heading and pitch ease toward the flight direction, and let go of it smoothly as the bird slows to a hover; the last
     seconds of a landing hand the pitch over to the flare clip so the perch pose meets it level */
  const hv=Math.hypot(e.vel.x,e.vel.z),wy=ss(.05,1.2,hv),lw=e.seg&&e.seg.land?ss(0,1.6,(1-Math.min(1,e.seg.t))*e.seg.T):1;
  e.yaw=wrapA(e.yaw+cl(wrapA(Math.atan2(e.vel.x,e.vel.z)-e.yaw)*ease(5*wy,dt),-2.5*dt,2.5*dt));
  e.pit+=(cl(-Math.atan2(e.vel.y,Math.max(hv,1.5)),-.5,.5)*wy*lw-e.pit)*ease(4,dt);
  /* the stoop pose is pitched 58° down; the group lifts most of that back so the body follows the path's real descent */
  const dv=e.r.acts.dive,wd=dv&&dv.isRunning()?dv.getEffectiveWeight():0;
  e.g.rotation.set(e.pit*.6-.7*wd,e.yaw,e.bank);rigTick(e.r,dt);eaglePlace(e)}

/* ---- snake: coiled in shade by day; slithers by dusk and night, never into the water ---- */
/* caught out in hail it makes for the nearest cover, a smaller rock or a shrub with a burrow under it */
function snakeShadeSpot(near){
  const g=navGrid("snake",.32,1.3,.82);let best=null;
  for(const o of OBST){if(near?!(o.k==="rock"&&o.r>=.4||o.k==="shrub"&&o.r>=.45):o.k!=="rock"||o.r<.6)continue;const x=o.x+SHADE.x*(o.r+.42),z=o.z+SHADE.z*(o.r+.42);
    if(!navFree(g,x,z)||near&&ANIM.camels.some(a=>Math.hypot(a.x-x,a.z-z)<3))continue;const sc=near?-Math.hypot(x-near.x,z-near.z):-Math.hypot(x-SNK_HOME.x,z-SNK_HOME.z)*.12+o.r;if(!best||sc>best.sc)best={x,z,sc,yaw:Math.atan2(SHADE.x,SHADE.z)+2}}
  return best||{x:-2,z:12,yaw:0}}
/* ---- rattlesnake ----
   A snake tastes the air with its mouth shut: the tongue slides out through the notch at the front-centre of the upper lip,
   on the mouth line, the tines spread, the protruded part sweeps up and down a few times, and it pulls back in.
   v1's tongue (bone and mesh) runs 10 mm above that line and would leave through the top of the snout by the nostrils, so it
   is lowered onto the seam between the Head- and Jaw-skinned shells found in the mesh, pivots at the notch, and the jaw is
   held shut over the clips' slight opening. All of this is worked in bind-pose metres, so v1b's same skeleton drops in. */
/* the rattlesnake files: v1d..v1i keep this skeleton (Root, Spine_01..44, Head, Jaw, Tongue, Rattle..), so a new file
   needs only these names; the body may be split over any number of skinned meshes and materials. Phones get their own
   file: the body maps must stay within ~100 MB of GPU memory there */
const RS_FILES={desk:"rattlesnake_v1i",mob:"rattlesnake_v1i_mobile"},RS_FILE=MOB?RS_FILES.mob:RS_FILES.desk,RS_SC=1;
const RS_NOTCH={y:.0057,z:.1245};
function rsNotch(sk,proto){
  /* v1d splits the body into several skinned meshes by material; each has its own Skeleton over the same bones */
  const hb0=sk.bones.find(b=>b.name==="Head"),jb0=sk.bones.find(b=>b.name==="Jaw"),v=new V3(),pts=[];
  proto.traverse(o=>{if(!o.isSkinnedMesh)return;const bs=o.skeleton.bones,iH=bs.indexOf(hb0),iJ=bs.indexOf(jb0);if(iH<0||iJ<0)return;
    const P=o.geometry.attributes.position,I=o.geometry.attributes.skinIndex,Wt=o.geometry.attributes.skinWeight;if(!I||!Wt)return;
    for(let i=0;i<P.count;i++){let bw=-1,bi=-1;for(let k=0;k<4;k++){const w=Wt.getComponent(i,k);if(w>bw){bw=w;bi=I.getComponent(i,k)}}
      if(bi!==iH&&bi!==iJ)continue;v.fromBufferAttribute(P,i).applyMatrix4(o.bindMatrix);if(Math.abs(v.x)<.006)pts.push([v.y,v.z,bi===iJ])}});
  if(!pts.length)return RS_NOTCH;
  const zF=Math.max(...pts.map(p=>p[1])),fr=pts.filter(p=>p[1]>zF-.004);
  const jt=Math.max(...fr.filter(p=>p[2]).map(p=>p[0])),hb=Math.min(...fr.filter(p=>!p[2]&&p[0]>jt).map(p=>p[0]));
  if(!isFinite(jt)||!isFinite(hb)||hb-jt>.006)return RS_NOTCH;
  const y=(jt+hb)/2,z=Math.max(...pts.filter(p=>Math.abs(p[0]-y)<.0015).map(p=>p[1]));
  return{y,z:isFinite(z)?z:zF}}
/* the handover tongue is a 3 mm pale strip that vanishes against sand: thickened ~1.7x about its own centre line in bind
   pose (which spreads the tines too) and coloured as a live one, wet red-black */
function rsTongueMesh(proto){proto.traverse(o=>{if(!o.isMesh||!/tongue/i.test((o.material&&o.material.name)||""))return;
  const P=o.geometry.attributes.position,n=P.count;let sz=0,sy=0,szz=0,szy=0;
  for(let i=0;i<n;i++){const z=P.getZ(i),y=P.getY(i);sz+=z;sy+=y;szz+=z*z;szy+=z*y}
  const kz=(n*szy-sz*sy)/Math.max(1e-12,n*szz-sz*sz),y0=(sy-kz*sz)/n;
  for(let i=0;i<n;i++){const yc=y0+kz*P.getZ(i);P.setXY(i,P.getX(i)*1.75,yc+(P.getY(i)-yc)*1.6)}
  P.needsUpdate=true;o.geometry.computeBoundingSphere();
  const m=o.material;m.map=null;m.color.setRGB(.095,.009,.011);m.roughness=.28;m.needsUpdate=true})}
function rsSpawn(proto,anims){
  const M=VT.THREE,g=new T.Group(),inner=new T.Group();g.rotation.order="YXZ";proto.position.y=0;
  inner.add(proto);inner.scale.setScalar(RS_SC);g.add(inner);animalMats(g);W.add(g);
  /* light thrown back up off the sand: its own pattern lit softly from below, most when a low sun barely reaches its back */
  matsOf(g,m=>{if(m.map&&!m.userData.snFill){m.userData.snFill=1;m.emissiveMap=m.map;m.emissive=new C3(0,0,0);m.needsUpdate=true;SN_FILL.push(m)}});
  /* any transmission > 0 (cornea glass, rattle keratin) makes three re-render the whole scene into a transmission target every frame */
  matsOf(g,m=>{const tr=m.transmission||0;m.transmission=0;
    if(/cornea/i.test(m.name||"")){if(tr>0||!m.transparent){m.transparent=true;m.opacity=.22;m.roughness=.06}m.depthWrite=false}
    else if(/wet/i.test(m.name||"")){if(!m.clearcoat)m.roughness=.3}
    else if(tr>0&&m.emissive){m.emissive.copy(m.color).multiplyScalar(.08*tr/.15);m.roughness=Math.min(m.roughness,.42)}});
  rsTongueMesh(proto);onDes(g);
  let sk=null;proto.traverse(o=>{if(o.isSkinnedMesh&&!sk&&o.skeleton.bones.some(b=>b.name==="Tongue"))sk=o.skeleton});
  const s={g,r:rigUp(proto,anims),x:0,z:0,yaw:0,yr:0,gy:null,mode:"relax",timer:rr(6,10),tg:{next:rr(.8,2),b:null},tq:null,
    bd:null,w:0,wT:99,wF:1,a:0,rk:0,rph:0,sg:0,spd:0,caut:0,idle:rr(4,9),gait:"serp",hx:0,hz:0,path:null,pi:0,goal:null,next:null,inShade:0};
  if(!sk)return s;
  s.bd=rsBody(s,sk);if(s.bd)s.mode="coil";
  const B=n=>sk.bones.find(b=>b.name===n),bind=n=>new M.Matrix4().copy(sk.boneInverses[sk.bones.indexOf(B(n))]).invert();
  const N=rsNotch(sk,proto),tg=B("Tongue"),MT=bind("Tongue"),MP=bind(tg.parent.name).invert(),ty=new M.Vector3().setFromMatrixPosition(MT).y;
  const fork=n=>{const b=B(n),MF=bind(n);return{b,MF,p:new M.Vector3().setFromMatrixPosition(MF),side:n==="Tongue_L"?1:-1}};
  const jaw=B("Jaw");
  s.tq={M,tg,MT,MTi:MT.clone().invert(),MP,N,dy:ty-N.y,fk:[fork("Tongue_L"),fork("Tongue_R")].filter(f=>f.b),
    jaw,jq:jaw?jaw.quaternion.clone():null,jp:jaw?jaw.position.clone():null,A:new M.Matrix4(),R:new M.Matrix4(),X:new M.Matrix4(),L:new M.Matrix4()};

  s.rtK=0;s.rtS=1;{const rt=RTL_B.map(([n,a])=>[B(n),a]);if(rt.every(x=>x[0]))s.rt=rt}
  const hb=B("Head");if(hb&&hb.parent)s.hl={H:hb,bi:sk.boneInverses[sk.bones.indexOf(hb)],a:0,on:0,q0:new T.Quat(),qw:new T.Quat()};
  return s}
/* one bout: out in ~70 ms with the tines spreading and the tongue dipping, n up-and-down sweeps pivoting at the notch (the tines
   whip a little behind the shaft), then back in; e = protrusion (m), th = pitch (+ down), sp = tine spread, wh = tine whip */
function rsBout(s,n){s.tg.b={t:0,n:n||(1+(rnd()*3|0)),f:rr(6.5,8.5),E:rr(.036,.044),dn:rr(.1,.2),A:rr(.22,.3)};s.tg.next=0}
function rsTongue(s,dt){const q=s.tq;if(!q)return;const G=s.tg;let e=0,th=0,sp=0,wh=0;
  if(!G.b){G.next-=dt;if(G.next<0)rsBout(s)}
  if(G.b){const b=G.b;b.t+=dt;const tO=.075,tS=b.n/b.f,tI=.07,t=b.t;
    let u,ph=0,env=0;
    if(t<tO)u=ss(0,1,t/tO);else if(t<tO+tS){u=1;ph=(t-tO)*b.f*TAU;const k=(t-tO)/tS;env=ss(0,.18,k)*(1-ss(.82,1,k))}else u=1-ss(0,1,(t-tO-tS)/tI);
    e=b.E*u;th=u*b.dn+env*b.A*Math.sin(ph);if(s.ncl!=null&&e>.003)th=Math.min(th,Math.asin(cl((s.ncl-.003)/e,-1,1)));wh=env*.24*Math.sin(ph-1.1);sp=u*(.4+.1*env*Math.cos(2*ph));
    if(t>tO+tS+tI){G.b=null;G.next=s.mode==="alert"||s.hunt?rr(.7,2.2):rr(3.5,8)}}
  const{M,A,R,X,L,N}=q;
  /* tongue: lowered onto the mouth line and slid forward, then pitched about the notch */
  A.makeTranslation(0,-q.dy,e).premultiply(X.makeTranslation(0,-N.y,-N.z)).premultiply(R.makeRotationX(th)).premultiply(X.makeTranslation(0,N.y,N.z));
  L.copy(q.MP).multiply(A).multiply(q.MT);L.decompose(q.tg.position,q.tg.quaternion,q.tg.scale);
  for(const f of q.fk){R.makeRotationY(f.side*sp).multiply(X.makeRotationX(wh));
    A.makeTranslation(-f.p.x,-f.p.y,-f.p.z).premultiply(R).premultiply(X.makeTranslation(f.p.x,f.p.y,f.p.z));
    L.copy(q.MTi).multiply(A).multiply(f.MF);L.decompose(f.b.position,f.b.quaternion,f.b.scale)}
  if(q.jaw){q.jaw.quaternion.copy(q.jq);q.jaw.position.copy(q.jp)}}
/* ---- the rattle: the raised tail buzzes side to side (~60 Hz in life, far above the frame rate, so each frame catches it at
   a random point of its swing). Drawn per frame that strobes, so the rattle itself only trembles slowly and a fan shows the
   blur either side: densest at the ends of the swing, where a fast oscillation spends most of its time, banded by the segments). Its strength follows the loudness of the sound
   being heard: dRtlOn's envelope at 20 per second (a few warning buzzes rising into the full rattle), then the steady loop. ---- */
const RTL_ENV="0003321142452144421343007888778789887978776766657544655565677666888777777887665665554555554543321100";
const RTL_B=[["Spine_42",.9],["Spine_43",1.8],["Spine_44",3],["Rattle",4.5],["Rattle_2",3.2],["Rattle_3",2]];
function rtlLevel(s){if(s.mode!=="def")return 0;const t=s.defT,e=t<5?+RTL_ENV[Math.min(99,t*20|0)]/9:0;return Math.max(e,.85*ss(3,4.5,t))}
/* two strips, one each side of the rattle, from its axis (u 0, veiling the solid rattle) out to where the tip travels (u 1); v runs base to tip */
const RFAN=(()=>{const N=64,d=new Uint8ClampedArray(N*N*4);
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){const u=(i+.5)/N,v=(j+.5)/N,
    band=.75+.25*Math.cos(v/.69*6*TAU),a=(.42+.33*u*u*u)*band*(1-ss(.8,1,u))*ss(0,.08,v)*(1-ss(.62,.78,v));d.set([0,a*255,0,255],(j*N+i)*4)}
  const am=new T.CTex(new ImageData(d,N,N));am.needsUpdate=true;
  const g=new T.BG();g.setAttribute("position",new T.BA(new Float32Array(24),3));g.setAttribute("normal",new T.BA(new Float32Array(24),3));
  g.setAttribute("uv",new T.BA(new Float32Array([0,0,1,0,0,1,1,1,0,0,1,0,0,1,1,1]),2));g.setIndex([0,1,2,2,1,3,4,5,6,6,5,7]);
  const m=new T.MSM({color:0x6e5238,roughness:.6,metalness:0,transparent:true,alphaMap:am,depthWrite:false,side:2});
  const o=new T.Mesh(g,m);o.frustumCulled=false;o.visible=false;o.renderOrder=2;o.castShadow=o.receiveShadow=false;W.add(o);onDes(o);return o})();
const _ra=new V3(),_rb=new V3(),_rc=new V3(),_rs=new V3(),_rn=new V3(),_rQ=new T.Quat(),_rZ=new V3(0,0,1);
function rsRattle(s,dt){const R=s.rt;s.rtK+=(rtlLevel(s)-s.rtK)*ease(s.mode==="def"?30:8,dt);RFAN.visible=false;if(!R||s.rtK<.02)return;
  /* the fan: on the rattle's resting line, from its base out past its last segment, as wide as the tip travels, turned to the
     camera about its axis */
  const r0=R[3][0],r2=R[5][0];s.g.updateMatrixWorld(true);
  r0.getWorldPosition(_ra);r2.getWorldPosition(_rb);W.worldToLocal(_ra);W.worldToLocal(_rb);
  _rc.subVectors(_rb,_ra);_rb.addScaledVector(_rc,.45);_rc.subVectors(_rb,_ra);
  _rn.addVectors(_ra,_rb).multiplyScalar(.5).sub(_cl).multiplyScalar(-1);_rs.crossVectors(_rc,_rn).normalize();
  const ri=0,wb=.012+.008*s.rtK,wt=.016+.03*s.rtK,P=RFAN.geometry.attributes.position,Nn=RFAN.geometry.attributes.normal;
  for(let sd=-1,o=0;sd<=1;sd+=2,o+=4){const pt=(i,c,w)=>P.setXYZ(o+i,c.x+_rs.x*sd*w,c.y+_rs.y*sd*w,c.z+_rs.z*sd*w);
    pt(0,_ra,ri);pt(1,_ra,ri+wb);pt(2,_rb,ri);pt(3,_rb,ri+wt)}
  /* lit as the average of the rattle's round surface: mostly from above */
  _rn.crossVectors(_rs,_rc).normalize();if(_rn.dot(_cl)<_rn.dot(_ra))_rn.negate();_rn.y+=1.5;_rn.normalize();for(let i=0;i<8;i++)Nn.setXYZ(i,_rn.x,_rn.y,_rn.z);
  P.needsUpdate=Nn.needsUpdate=true;RFAN.material.opacity=ss(.05,.5,s.rtK);RFAN.visible=true;
  const k=s.rtK*D2R,tw=Math.sin(st.t*TAU*2.3)*.3+Math.sin(st.t*TAU*5.1+1.)*.12;
  for(const[b,a]of R)b.quaternion.multiply(_rQ.setFromAxisAngle(_rZ,tw*a*k))}
/* ---- rattlesnake crawl ----
   The body is the 44 spine bones (Spine_01 behind the head .. Spine_44 before the rattle, .024 m apart). Each frame every bone
   is placed in island metres, framed by the body line (bone +y runs tailward, +z up) and given the local matrix that puts it
   there under its parent, so the clips (coils, flicks) and the crawl blend bone by bone and any file on this skeleton drops in.
   - serpentine: the head runs a sinuous path and the body follows it exactly, sliding along its own S-shaped groove;
   - rectilinear: a straight path; stop-go pulses run head to tail, each section standing still while the one ahead moves;
   - sidewinding: a travelling wave with a straight contact band and lifted arcs between; the shape is placed each frame so
     the points touching the sand do not move (least squares over contact), so the body rolls sideways and lays separate
     straight tracks, each hooked where the bent neck touched down first (the J). */
const RS_N=44,RS_DS=.024*RS_SC,RS_R=.0235*RS_SC,RS_TDS=.008,RS_TN=360;
const RSG={serp:{V:.2,lam:.5,th:.8},rect:{V:.045,lam:.24,str:.15},side:{lam:.62,f:.72,th:.62,H:.042,J:.7}};
function rsBody(s,sk){
  const B=n=>sk.bones.find(b=>b.name===n),bones=[];for(let i=1;i<=RS_N;i++)bones.push(B("Spine_"+String(i).padStart(2,"0")));
  const root=B("Root");if(!root||bones.some(b=>!b))return null;
  const n2=RS_N*2,F=()=>new Float32Array(n2);
  return{root,bones,arm:root.parent,rp:root.position.clone(),rq:root.quaternion.clone(),rs:root.scale.clone(),
    RM:new T.M4().compose(root.position,root.quaternion,root.scale),
    P:F(),Pp:F(),H:new Float32Array(RS_N),C:new Float32Array(RS_N),Ls:F(),
    M:bones.map(()=>new T.M4()),lp:bones.map(()=>new V3()),lq:bones.map(()=>new T.Quat()),
    tr:{x:new Float32Array(RS_TN),z:new Float32Array(RS_TN),h:new Float32Array(RS_TN),i:0,n:0},
    sw:{S:F(),D:F(),O:new Float32Array(RS_N*4),Cp:new Float32Array(RS_N),psi:0,ph:0,dr:1,fu:1,fv:0,sg:1,goal:null}}}
/* trail: head positions every 8 mm, newest at tr.i; the head itself runs ahead of the newest point */
function trPush(T_,x,z,h){T_.i=(T_.i+1)%RS_TN;T_.x[T_.i]=x;T_.z[T_.i]=z;T_.h[T_.i]=h;T_.n=Math.min(T_.n+1,RS_TN)}
const _tp={x:0,z:0,h:0};
function trAt(s,d,o){const T_=s.bd.tr,l0=Math.hypot(s.hx-T_.x[T_.i],s.hz-T_.z[T_.i]);
  if(d<=l0||T_.n<2){const u=l0>1e-6?d/l0:0;o.x=mix(s.hx,T_.x[T_.i],u);o.z=mix(s.hz,T_.z[T_.i],u);o.h=T_.h[T_.i]*u;return o}
  const k=(d-l0)/RS_TDS,k0=Math.min(Math.floor(k),T_.n-2),f=k-k0,a=(T_.i-k0+RS_TN)%RS_TN,b=(a-1+RS_TN)%RS_TN;
  o.x=T_.x[a]+(T_.x[b]-T_.x[a])*f;o.z=T_.z[a]+(T_.z[b]-T_.z[a])*f;o.h=Math.max(0,mix(T_.h[a],T_.h[b],Math.min(f,1)));return o}
/* lay the trail along the body as it lies (head to tail, then on past the tail), so the body can follow itself out */
function trInit(s){const b=s.bd,T_=b.tr,P=b.P,pts=[];
  for(let i=0;i<RS_N;i++)pts.push([P[2*i],P[2*i+1],b.H[i]]);
  const e=pts[RS_N-1],q=pts[RS_N-2],dl=Math.hypot(e[0]-q[0],e[1]-q[1])||1;for(let k=1;k<=12;k++)pts.push([e[0]+(e[0]-q[0])/dl*.03*k,e[1]+(e[1]-q[1])/dl*.03*k,0]);
  const out=[];let acc=0,want=0;
  for(let i=0;i<pts.length-1&&out.length<RS_TN-2;i++){const a=pts[i],c=pts[i+1],L=Math.hypot(c[0]-a[0],c[1]-a[1]);
    while(want<=acc+L&&out.length<RS_TN-2){const u=L>1e-6?(want-acc)/L:0;out.push([mix(a[0],c[0],u),mix(a[1],c[1],u),mix(a[2],c[2],u)]);want+=RS_TDS}acc+=L}
  T_.n=0;T_.i=0;for(let k=out.length-1;k>=0;k--)trPush(T_,out[k][0],out[k][1],out[k][2]);
  s.hx=P[0];s.hz=P[1];s.yaw=Math.atan2(P[0]-P[2],P[1]-P[3]);s.yr=0}
function rsBodyTrail(s,dt){const b=s.bd,a=s.a,G=RSG.serp,R=RSG.rect,rk=s.rk;
  const om=TAU*R.V/(R.lam*R.str),kr=TAU/R.lam,rA=R.V/om;
  if(a>.01)s.rph+=om*dt;
  const v=a*mix(G.V,R.V*(1-Math.cos(s.rph)),rk);s.spd=v;s.sg+=v*dt;
  const hd=s.yaw+a*(1-rk)*G.th*Math.sin(TAU*s.sg/G.lam)+rk*.05*Math.sin(TAU*s.sg/.9);
  s.hx+=Math.sin(hd)*v*dt;s.hz+=Math.cos(hd)*v*dt;
  const T_=b.tr;for(let g=0;g<8;g++){const dx=s.hx-T_.x[T_.i],dz=s.hz-T_.z[T_.i],d=Math.hypot(dx,dz);if(d<RS_TDS)break;
    trPush(T_,T_.x[T_.i]+dx/d*RS_TDS,T_.z[T_.i]+dz/d*RS_TDS,0)}
  for(let i=0;i<RS_N;i++){const m=i*RS_DS,d=m+rk*a*rA*(Math.sin(-s.rph)-Math.sin(kr*m-s.rph));
    trAt(s,Math.max(d,0),_tp);b.P[2*i]=_tp.x;b.P[2*i+1]=_tp.z;b.H[i]=_tp.h;b.C[i]=1}}
/* sidewinding: shape from the tangent angle along the body (exact length), then placed so contact points stay put */
/* the wave runs either way round, so the snake rolls off to whichever side faces its goal and only the rest is steered */
function swInit(s,goal){const b=s.bd,w=b.sw,P=b.P;w.psi=Math.atan2(P[2*RS_N-2]-P[0],P[2*RS_N-1]-P[1]);w.sg=1;
  if(goal){let cx=0,cz=0;for(let i=0;i<RS_N;i++){cx+=P[2*i];cz+=P[2*i+1]}cx/=RS_N;cz/=RS_N;
    const ux=Math.sin(w.psi),uz=Math.cos(w.psi),vx=Math.cos(w.psi),vz=-Math.sin(w.psi);w.sg=(goal.x-cx)*vx+(goal.z-cz)*vz>=0?1:-1}
  const U=[Math.sin(w.psi),Math.cos(w.psi)],Vv=[Math.cos(w.psi),-Math.sin(w.psi)];
  for(let i=0;i<RS_N;i++){const dx=P[2*i]-P[0],dz=P[2*i+1]-P[1];w.D[2*i]=dx*U[0]+dz*U[1]-i*RS_DS;w.D[2*i+1]=dx*Vv[0]+dz*Vv[1]}
  w.dr=0;w.fu=-.1;w.fv=.99*w.sg;w.Cp.fill(0)}
function rsBodySide(s,dt){const b=s.bd,w=b.sw,G=RSG.side,a=s.a,k=TAU/G.lam,tn=Math.tanh(3);
  w.ph+=TAU*G.f*dt;w.dr=Math.min(1,w.dr+dt/1.6);
  let u=0,v=0,t0=0;const r=1-ss(0,1,w.dr);
  for(let i=0;i<RS_N;i++){const m=i*RS_DS,ph=k*m-w.ph,dp=Math.abs(wrapA(ph-Math.PI/2));
    const th=a*w.sg*(G.th*Math.tanh(3*Math.sin(ph))/tn+G.J*(1-ss(0,.2,m)));
    if(i>0){const tb=(th+t0)/2;u+=Math.cos(tb)*RS_DS;v+=Math.sin(tb)*RS_DS}t0=th;
    w.S[2*i]=u+r*w.D[2*i];w.S[2*i+1]=v+r*w.D[2*i+1];
    b.C[i]=mix(1,1-ss(.7,1.1,dp),a);b.H[i]=a*G.H*ss(.85,2.3,dp)}
  const U0=Math.sin(w.psi),U1=Math.cos(w.psi),V0=Math.cos(w.psi),V1=-Math.sin(w.psi);
  let sx=0,sz=0,sc=0,cx0=0,cz0=0;
  for(let i=0;i<RS_N;i++){const qx=w.S[2*i]*U0+w.S[2*i+1]*V0,qz=w.S[2*i]*U1+w.S[2*i+1]*V1,c=b.C[i]*b.C[i]+1e-4;
    sx+=c*(b.P[2*i]-qx);sz+=c*(b.P[2*i+1]-qz);sc+=c;cx0+=b.P[2*i];cz0+=b.P[2*i+1]}
  const tx=sx/sc,tz=sz/sc;let cx1=0,cz1=0;
  /* the bent neck lays the hook of a new track while the last one is still under the body, and no single placement holds
     both, so each run of contact is pinned where it lies and the lifted arcs between runs take up the difference */
  const O=w.O;let nr=0;
  for(let i=0;i<RS_N;){if(b.C[i]<=.9){i++;continue}let j=i,ox=0,oz=0,n=0;
    for(;j<RS_N&&b.C[j]>.9;j++)if(w.Cp[j]>.9){const qx=w.S[2*j]*U0+w.S[2*j+1]*V0+tx,qz=w.S[2*j]*U1+w.S[2*j+1]*V1+tz;ox+=b.P[2*j]-qx;oz+=b.P[2*j+1]-qz;n++}
    if(n){O[nr*4]=i;O[nr*4+1]=j-1;O[nr*4+2]=ox/n;O[nr*4+3]=oz/n;nr++}i=j}
  for(let i=0,r=0;i<RS_N;i++){while(r<nr-1&&i>O[r*4+1])r++;let ox=0,oz=0;
    if(nr){const R=r*4;if(i>=O[R]&&i<=O[R+1]||(r===0&&i<O[R])||(r===nr-1&&i>O[R+1])){ox=O[R+2];oz=O[R+3]}
      else if(r>0){const Q=(r-1)*4,u=(i-O[Q+1])/(O[R]-O[Q+1]);ox=mix(O[Q+2],O[R+2],ss(0,1,u));oz=mix(O[Q+3],O[R+3],ss(0,1,u))}}
    const qx=w.S[2*i]*U0+w.S[2*i+1]*V0,qz=w.S[2*i]*U1+w.S[2*i+1]*V1;b.P[2*i]=qx+tx+ox;b.P[2*i+1]=qz+tz+oz;cx1+=b.P[2*i];cz1+=b.P[2*i+1];w.Cp[i]=b.C[i]}
  const dx=(cx1-cx0)/RS_N,dz=(cz1-cz0)/RS_N,d=Math.hypot(dx,dz);s.spd=d/Math.max(dt,1e-4);
  if(d>1e-5){const kk=ease(1.2,dt);w.fu+=((dx*U0+dz*U1)/d-w.fu)*kk;w.fv+=((dx*V0+dz*V1)/d-w.fv)*kk}
  /* steer: turn the shape so that its own travel direction points at the goal; the fit pivots it about the contact */
  if(w.goal){const gy=Math.atan2(w.goal.x-cx1/RS_N,w.goal.z-cz1/RS_N),tr=Math.atan2(w.fv,w.fu);
    w.psi=wrapA(w.psi+cl(wrapA(gy-tr-w.psi),-.22*dt,.22*dt)*a)}}
/* bones: island-metre frames from the body line -> armature space -> parent-relative, blended over the clip pose by s.w */
const _bA=new T.M4(),_bI=new T.M4(),_bL=new T.M4(),_bT=new V3(),_bZ=new V3(),_bX=new V3(),_bS=new V3(),_bQ=new T.Quat(),_b3=[];
for(let i=0;i<RS_N;i++)_b3.push(new V3());
function rsPose(s){const b=s.bd,w=s.w;if(w<.002)return;
  for(let i=0;i<RS_N;i++){const x=b.P[2*i],z=b.P[2*i+1],m=i*RS_DS;
    const lift=b.H[i]+.022*(1-ss(0,.12,m))*(1-.5*rsBusyK(s))+.012*ss(.88,1.03,m/RS_SC);
    _b3[i].set(x,hTop(x,z)+RS_R+lift-.004*b.C[i],z)}
  W.updateMatrixWorld();_bI.copy(W.matrixWorld).invert().multiply(b.arm.matrixWorld).invert();
  for(let i=0;i<RS_N;i++){const p=_b3[i];
    if(i===0)_bT.subVectors(_b3[1],p);else if(i===RS_N-1)_bT.subVectors(p,_b3[i-1]);else _bT.subVectors(_b3[i+1],_b3[i-1]);
    if(i===0)_bT.y*=.4;_bT.normalize();
    const e=.12,hx=hTop(p.x+e,p.z)-hTop(p.x-e,p.z),hz=hTop(p.x,p.z+e)-hTop(p.x,p.z-e);_bZ.set(-hx,2*e,-hz).normalize();
    _bZ.addScaledVector(_bT,-_bZ.dot(_bT)).normalize();_bX.crossVectors(_bT,_bZ);
    b.M[i].makeBasis(_bX,_bT,_bZ).setPosition(p).premultiply(_bI)}
  for(let i=0;i<RS_N;i++){_bL.copy(i?b.M[i-1]:b.RM).invert().multiply(b.M[i]);_bL.decompose(b.lp[i],b.lq[i],_bS)}
  b.root.position.lerp(b.rp,w);b.root.quaternion.slerp(b.rq,w);b.root.scale.lerp(b.rs,w);
  for(let i=0;i<RS_N;i++){const o=b.bones[i];o.position.lerp(b.lp[i],w);o.quaternion.slerp(b.lq[i],w);o.scale.lerp(_bS.set(1,1,1),w)}}
/* the body as the clips leave it, in island metres (to start a crawl from a coil) */
function rsFromClip(s){const b=s.bd;s.g.updateMatrixWorld(true);W.updateMatrixWorld();_bA.copy(W.matrixWorld).invert();
  for(let i=0;i<RS_N;i++){_bT.setFromMatrixPosition(b.bones[i].matrixWorld).applyMatrix4(_bA);b.P[2*i]=_bT.x;b.P[2*i+1]=_bT.z;
    b.H[i]=Math.max(0,_bT.y-hTop(_bT.x,_bT.z)-RS_R);b.C[i]=b.H[i]<.01?1:0}}
function rsBusyK(s){return s.mode==="def"?1:0}
/* laid out along the ground the neck carries the clips' head pitch, which drops the snout ~2 cm into the sand and the tongue
   with it: the head is tipped up about its joint until the mouth notch rides 14 mm clear, and the tongue's downward sweep is
   held to that clearance. The lift is taken back off before the next frame if no clip has rewritten the bone. */
const _hN=new V3(),_hP=new V3(),_hX=new V3(),_hQ=new T.Quat(),_hR=new T.Quat(),_hW=new T.Quat();
function rsHeadLift(s,dt){const L=s.hl,q=s.tq;if(!L||!q)return;const H=L.H;
  if(L.on&&H.quaternion.equals(L.qw))H.quaternion.copy(L.q0);L.q0.copy(H.quaternion);L.on=0;s.ncl=null;
  if(s.w<.002&&L.a<1e-4){L.a=0;return}
  s.g.updateMatrixWorld(true);
  _hN.set(0,q.N.y,q.N.z).applyMatrix4(L.bi).applyMatrix4(H.matrixWorld);_hP.setFromMatrixPosition(H.matrixWorld);W.worldToLocal(_hN);W.worldToLocal(_hP);
  const dx=_hN.x-_hP.x,dz=_hN.z-_hP.z,dh=Math.hypot(dx,dz);if(dh<1e-5)return;
  const dy=_hN.y-_hP.y,len=Math.hypot(dh,dy),g=hTop(_hN.x,_hN.z),a0=Math.atan2(dy,dh),a1=Math.asin(cl((g+.014-_hP.y)/len,-1,1));
  L.a+=(s.w*cl(a1-a0,0,.7)-L.a)*ease(10,dt);
  s.ncl=_hP.y+len*Math.sin(a0+L.a)-g;if(L.a<1e-4)return;
  W.getWorldQuaternion(_hW);_hX.set(-dz/dh,0,dx/dh).applyQuaternion(_hW);
  H.parent.getWorldQuaternion(_hQ);_hR.setFromAxisAngle(_hX,L.a).premultiply(_hW.copy(_hQ).invert()).multiply(_hQ);
  H.quaternion.premultiply(_hR);L.qw.copy(H.quaternion);L.on=1}

/* ---- sand tracks: grooves (r) and pushed-up rims (g) in a 5 m window of 6.7 mm texels that follows the snake;
   wind wears them down (rims first), rain and blowing sand faster ---- */
function trkShift(K,x,z){const N=K.N,te=K.M/N,di=Math.round((x-K.ox)/te),dj=Math.round((z-K.oz)/te),o=new Uint8ClampedArray(N*N*4);
  for(let j=0;j<N;j++){const sj=j+dj;if(sj<0||sj>=N)continue;for(let i=0;i<N;i++){const si=i+di;if(si<0||si>=N)continue;const a=(j*N+i)*4,c=(sj*N+si)*4;o[a]=K.d[c];o[a+1]=K.d[c+1];o[a+2]=K.d[c+2];o[a+3]=K.d[c+3]}}
  K.d.set(o);K.ox+=di*te;K.oz+=dj*te;K.U.uTrkW.value.x=K.ox;K.U.uTrkW.value.y=K.oz;K.dirty=1}
/* the body's girth along its length (thinner neck, tapering tail), so each part presses a groove as wide as itself */
const rsGirth=i=>mix(.62,1,ss(0,9,i))*mix(1,.42,ss(26,43,i));
/* one groove between two neighbouring contact points (a capsule), so the furrow runs continuous rather than beaded.
   The body sinks about a quarter of its girth (wr), so the groove is ~1.6 radii across with a low rim of displaced sand
   either side, heaped on the side the sand is pushed (px,pz); mk raises a push mound beyond that rim, where a bend
   shoves sideways against the sand (serpentine) or the body rolls off it (sidewinding). */
/* sc: scale imprint (1 set down sidewinding, 2 rectilinear, 0 slid); ma, mb: the two points' places along the body (m) */
function trkSeg(K,x0,z0,x1,z1,dep,px,pz,wr,mk,sc,ma,mb){const N=K.N,te=K.M/N,h=N/2,ax=(x0-K.ox)/te+h,az=(z0-K.oz)/te+h,bx=(x1-K.ox)/te+h,bz=(z1-K.oz)/te+h;
  const r=RS_R*(wr||1),s2=2*(.68*r)**2,ro=1.25*r+.004,rw=2*(.4*r+.003)**2,mo=ro+.75*r+.01,mw=2*(.85*r+.007)**2,R=Math.ceil((mo+2.4*Math.sqrt(mw/2))/te);
  const ex=bx-ax,ez=bz-az,L2=ex*ex+ez*ez||1e-9;mk=mk||0;
  let th=Math.atan2(ez,ex),sg=mb>=ma?1:-1;if(th<0){th+=Math.PI;sg=-sg}if(th>=Math.PI){th=0;sg=-sg}
  const cb=sc?(sc===1?1:129)+Math.round(th/Math.PI*126)%127:0;
  /* beyond these distances a term is under one step of the 8-bit texture and cannot change it */
  const lg=v=>v>1?Math.log(v):-1,gD=s2*lg(255*dep),rD=rw*lg(138*dep),mD=mk>0?mw*lg(288*dep*mk):-1,dM=Math.max(Math.sqrt(Math.max(gD,0)),ro+Math.sqrt(Math.max(rD,0)),mo+Math.sqrt(Math.max(mD,0)));
  if(gD<0&&rD<0&&mD<0)return;
  for(let j=Math.max(0,Math.floor(Math.min(az,bz))-R);j<=Math.min(N-1,Math.floor(Math.max(az,bz))+R);j++)
    for(let i=Math.max(0,Math.floor(Math.min(ax,bx))-R);i<=Math.min(N-1,Math.floor(Math.max(ax,bx))+R);i++){
      const cx=i+.5,cz=j+.5,uu=((cx-ax)*ex+(cz-az)*ez)/L2,u=uu<0?0:uu>1?1:uu,dx=(cx-ax-ex*u)*te,dz=(cz-az-ez*u)*te,d2=dx*dx+dz*dz;
      if(d2>dM*dM)continue;
      const d=Math.sqrt(d2),sd=d>1e-4?(dx*px+dz*pz)/d:0,o=(j*N+i)*4;
      if(d2<gD){const va=dep*Math.exp(-d2/s2)*255|0;if(va>K.d[o]){K.d[o]=va;K.d[o+2]=cb;if(cb){const ph=sg*(ma+uu*(mb-ma))/RS_SCL;K.d[o+3]=(ph-Math.floor(ph))*256|0}}}
      const er=(d-ro)*(d-ro),em=(d-mo)*(d-mo),rim=er<rD?dep*(.24+.36*sd)*Math.exp(-er/rw):0,mnd=em<mD&&sd>0?dep*mk*sd**1.2*1.25*Math.exp(-em/mw):0;
      const vb=Math.max(rim,mnd)*230|0;if(vb>K.d[o+1])K.d[o+1]=vb}
  K.dirty=K.any=1}
/* sand thrown off where the neck slaps down at the head of a sidewinding track: a scatter of grains and small clods, most of
   them in the direction the sand is pushed (px,pz) */
function trkSpray(K,x,z,px,pz,n){const N=K.N,te=K.M/N,h=N/2,a0=Math.atan2(pz,px);
  for(let k=0;k<n;k++){const a=a0+rr(-.9,.9)*rr(.3,1),dd=rr(.025,.05)+rr(0,.07)*rnd(),cx=(x+Math.cos(a)*dd-K.ox)/te+h,cz=(z+Math.sin(a)*dd-K.oz)/te+h,i0=cx|0,j0=cz|0,big=rnd()<.25;
    for(let j=j0-1;j<=j0+1;j++)for(let i=i0-1;i<=i0+1;i++){if(i<0||j<0||i>=N||j>=N)continue;
      const q=Math.hypot(i+.5-cx,j+.5-cz),v=(big?200:130)*Math.exp(-q*q/(big?.9:.35))*rr(.7,1)|0,o=(j*N+i)*4;if(v>K.d[o+1])K.d[o+1]=v}}
  K.dirty=K.any=1}
function trkTick(s,dt){const K=TRK;if(!K||!s.bd)return;const b=s.bd;
  if(Math.abs(b.P[0]-K.ox)>1.3||Math.abs(b.P[1]-K.oz)>1.3)trkShift(K,b.P[0],b.P[1]);
  if(s.w>.9){const side=s.gait==="side",w=b.sw;let px=0,pz=0;
    if(side){const U0=Math.sin(w.psi),U1=Math.cos(w.psi),V0=Math.cos(w.psi),V1=-Math.sin(w.psi);px=-(w.fu*U0+w.fv*V0);pz=-(w.fu*U1+w.fv*V1)}
    const on=i=>b.C[i]>=.6&&b.H[i]<=.004,Tc=b.Tc||(b.Tc=new Uint8Array(RS_N));
    for(let i=0;i<RS_N;i++){const was=Tc[i];Tc[i]=on(i)?1:0;if(!Tc[i])continue;const x=b.P[2*i],z=b.P[2*i+1];
      /* the J: the bent neck comes down first and hardest, digging the hook of each new track and flinging sand */
      if(side&&!was&&i<7&&s.a>.5)trkSpray(K,x,z,px,pz,MOB?8:14);
      /* the hook of the J: the head comes down beyond the bar and curls round toward the way it is going */
      if(side&&!was&&i<2&&s.a>.5&&i<RS_N-1){let tx=x-b.P[2*i+2],tz=z-b.P[2*i+3];const tl=Math.hypot(tx,tz),ml=Math.hypot(px,pz);
        if(tl>1e-5&&ml>1e-5){tx/=tl;tz/=tl;const mx=-px/ml,mz=-pz/ml,sgn=Math.sign(tx*mz-tz*mx)||1;let hx=x,hz=z,a=Math.atan2(tz,tx);
          for(let k=0;k<6;k++){a+=sgn*.36;const nx=hx+Math.cos(a)*.022*RS_SC/.9,nz=hz+Math.sin(a)*.022*RS_SC/.9;
            trkSeg(K,hx,hz,nx,nz,1.45-.08*k,px,pz,mix(.72,.5,k/5),.9,1,i*RS_DS,i*RS_DS);hx=nx;hz=nz}}}
      if(Math.hypot(x-b.Ls[2*i],z-b.Ls[2*i+1])<.004)continue;b.Ls[2*i]=x;b.Ls[2*i+1]=z;
      let qx=px,qz=pz,mk=side?.7:0;
      /* serpentine: the outside of each bend is where the body shoves against the sand; the tighter the bend, the bigger the mound */
      if(!side&&i>0&&i<RS_N-1){qx=2*x-b.P[2*i-2]-b.P[2*i+2];qz=2*z-b.P[2*i-1]-b.P[2*i+3];const l=Math.hypot(qx,qz),kv=l/(RS_DS*RS_DS),k=cl(kv/2,0,1);
        qx=l>1e-7?qx/l*k:0;qz=l>1e-7?qz/l*k:0;mk=ss(2.5,9,kv)*(s.rk>.5?.3:1)}
      const dep=(side?mix(1.3,1,ss(2,7,i)):(s.rk>.5?.6:.8)*mix(.75,1,ss(.3,1,i/8))),j=i<RS_N-1&&on(i+1)?i+1:i>0&&on(i-1)?i-1:i;
      trkSeg(K,x,z,b.P[2*j],b.P[2*j+1],dep,qx,qz,(rsGirth(i)+rsGirth(j))/2,mk,side?1:s.rk>.5?2:0,i*RS_DS,j*RS_DS)}}
  K.dc+=dt;
  if(K.dc>=.5&&K.any){const g=gustAt(b.P[0],b.P[1]),r=K.dc*(1/160+st.wn*(.4+.6*g)/35+WX.dust/6+WX.rain/9),d=K.d;let any=0;K.dc=0;
    for(let i=0;i<d.length;i+=4){const a=d[i],c=d[i+1];if(!(a|c))continue;any=1;
      if(a)d[i]=a-Math.min(a,Math.floor(a*r+rnd()));if(c)d[i+1]=c-Math.min(c,Math.floor(c*r*1.6+rnd()))}
    K.any=any;K.dirty=1}
  K.up+=dt;if(K.dirty&&K.up>.16){K.tex.needsUpdate=true;K.up=0;K.dirty=0}}
/* behaviour: by day (and in rain) it lies coiled in rock shade; at dusk, night and dawn it roams. Open loose sand is crossed
   sidewinding, the oasis margin, grass and rock edges by serpentine; after a scare it creeps away rectilinear. A camel or a
   low eagle close by throws it into a defensive coil, head raised and rattling, until the threat has gone. */
function rsGaitAt(s,x,z){if(s.caut>0)return"rect";if(pN(x,z)<2.1||!clearOf(x,z,.7))return"serp";return s.hg||"side"}
/* dawn and dusk: it hunts, out in the open where it can be found — legs of 2.5-7 m across the interior sand, each crossed
   sidewinding (separate J-hooked bars) or in serpentine (one S-wave groove), then a pause, head up, tasting the air */
function rsHuntSpot(s,away){const g=navGrid("snake",.32,1.3,.82),P=s.bd.P,ok=(x,z)=>pN(x,z)>2&&sN(x,z)<.72&&clearOf(x,z,1)&&Math.hypot(x-P[0],z-P[1])>2.5&&
    (!away||Math.hypot(x-away.x,z-away.z)>4.5)&&ANIM.camels.every(a=>Math.hypot(a.x-x,a.z-z)>4&&(!a.goal||Math.hypot(a.goal.x-x,a.goal.z-z)>4));
  return randFree(g,P[0]+Math.sin(s.yaw)*4,P[1]+Math.cos(s.yaw)*4,3,ok)||randFree(g,P[0]*.5,P[1]*.5,8,ok)||randFree(g,2,0,15,ok)}
function rsCentre(s){const P=s.bd.P;let x=0,z=0;for(let i=0;i<RS_N;i++){x+=P[2*i];z+=P[2*i+1]}return{x:x/RS_N,z:z/RS_N}}
function rsGoTo(s,to){const P=s.bd.P,g=navGrid("snake",.32,1.3,.82),p=navPath(g,P[0],P[1],to.x,to.z);if(!p)return false;
  s.path=p;s.pi=1;s.goal=to;s.arr=0;s.legT=0;return true}
function rsThreat(s){const P=s.bd.P,hx=P[0],hz=P[1];if(s.qth&&st.t<s.qth.until)return s.qth;if(s.noTh)return null;
  /* a camel braced motionless against hail is no threat: the snake slips past it to cover */
  for(const a of ANIM.camels){const d=Math.hypot(a.x-hx,a.z-hz);if(a.mode!=="rest"&&!(WX.hcold&&a.spd<.05)&&(d<1.6||a.spd>.1&&d<2.6))return{x:a.x,z:a.z}}
  const e=ANIM.eagle;if(e&&e.mode!=="perch"&&e.pos&&Math.hypot(e.pos.x-hx,e.pos.z-hz)<4&&e.pos.y-hTop(hx,hz)<3.5)return{x:e.pos.x,z:e.pos.z};
  return null}
/* in hail: the nearest cover if it is close; with none close by it shimmies down into the sand where it lies */
function rsCover(s){const P=s.bd.P,sp=snakeShadeSpot({x:P[0],z:P[1]});return Math.hypot(sp.x-P[0],sp.z-P[1])<4.5?{x:sp.x,z:sp.z,shade:1,near:1}:null}
function rsBurrow(s){s.inShade=1;s.sandB=1;s.mode="coiling";rsCoilAt(s,"relaxed_coil",1.8);s.timer=rr(9,15);s.idle=rr(30,60)}
function rsCoilAt(s,clip,fade){const P=s.bd.P,ya=Math.atan2(P[0]-P[6],P[1]-P[7]);
  s.yaw=ya;s.x=P[8]-Math.sin(ya)*.1;s.z=P[9]-Math.cos(ya)*.1;s.gy=hTop(s.x,s.z);s.g.position.set(s.x,s.gy,s.z);s.g.rotation.set(0,ya,0);
  play(s.r,clip,.01,1);s.wT=0;s.wF=fade}
function rsUpdate(s,dt){
  if(!s.bd){s.timer-=dt;if(s.timer<0){if(s.mode==="relax"){s.mode="alert";s.timer=rr(7,11);play(s.r,"tongue_flick",.8,1)}else{s.mode="relax";s.timer=rr(9,15);play(s.r,"relaxed_coil",.9,1)}}
    rigTick(s.r,dt);rsTongue(s,dt);return}
  const b=s.bd,day=(st.phase==="day"||WX.shel>0||WX.rain>.3||WX.cold>0)&&!s.force;s.hunt=!day&&(st.phase==="sunrise"||st.phase==="sunset")&&!s.force;
  s.caut=Math.max(0,s.caut-dt);
  /* startle */
  const th=rsThreat(s);
  if(th&&s.mode!=="def"){if(s.mode==="crawl"||s.mode==="rest")rsCoilAt(s,"defensive_coil",.55);else{play(s.r,"defensive_coil",.4,1)}
    s.mode="def";s.defT=0;s.calm=0;s.th=th;capE(["R","on"]);shotS("dRtlOn",.8,_snP.set(b.P[0],hTop(b.P[0],b.P[1])+.2,b.P[1]),4)}
  if(s.mode==="def"){s.defT+=dt;if(th){s.th=th;s.calm=0}else s.calm+=dt;
    if(s.calm>2.5&&s.defT>5){s.mode="uncoil";s.caut=rr(12,20);const P=b.P,dx=P[0]-s.th.x,dz=P[1]-s.th.z,l=Math.hypot(dx,dz)||1;const hs=s.hunt&&rsHuntSpot(s,s.th);if(hs)hs.hunt=1;
      s.next=WX.hcold?rsCover(s):hs||{x:P[0]+dx/l*3.5,z:P[1]+dz/l*3.5}}}
  /* coiled: the clip pose, tongue now and then; leave at dusk or to reach shade */
  if(s.mode==="coil"){s.timer-=dt;
    if(s.timer<0){if(s.r.cur==="relaxed_coil"){play(s.r,"tongue_flick",.8,1);s.timer=rr(6,9)}else{play(s.r,"relaxed_coil",.9,1);s.timer=rr(9,15)}}
    s.idle-=dt;if(WX.hcold&&!s.inShade)s.idle=Math.min(s.idle,0);if(s.sandB&&!WX.hcold){s.sandB=0;s.inShade=0;s.idle=Math.min(s.idle,rr(5,15))}if(s.idle<0&&(!day||!s.inShade)){s.mode="uncoil";s.next=null}}
  if(s.mode==="uncoil"){rigTick(s.r,dt);rsFromClip(s);trInit(s);for(let i=0;i<RS_N*2;i++)b.Ls[i]=b.P[i];
    s.mode="rest";s.restT=.3;s.gait="serp";s.a=0;s.rk=s.caut>0?1:0;s.wT=0;s.wF=-.4;s.dtgt=null}
  /* travel */
  if(s.mode==="rest"){s.restT-=dt;if(s.restT<0){let to=s.next;s.next=null;
      s.hg=s.hunt?(rnd()<.6?"side":"serp"):null;
      if(!to){if(day&&WX.hcold){to=rsCover(s);if(!to)rsBurrow(s)}else if(day){const sp=snakeShadeSpot();to={x:sp.x,z:sp.z,shade:1}}else if(s.hunt&&(to=rsHuntSpot(s))){to.hunt=1}else{const g=navGrid("snake",.32,1.3,.82);to=randFree(g,SNK_HOME.x,SNK_HOME.z,9,(x,z)=>Math.hypot(x-b.P[0],z-b.P[1])>2.5)}}
      if(to&&rsGoTo(s,to)){s.mode="crawl";s.a=0;const want=s.lock||rsGaitAt(s,b.P[0],b.P[1]);
        if(want==="side"){s.gait="side";swInit(s,s.path[1])}else{s.gait=want;s.rk=want==="rect"?1:0}}
      /* cover it has no way through to: in hail or snow it shuffles down into the sand where it lies rather than waiting out in the open */
      else if(day&&WX.hcold)rsBurrow(s);else s.restT=1}}
  if(s.mode==="crawl"&&WX.hcold&&!s.goal.near){const P=b.P,cv=rsCover(s);s.goal.near=1;
    if(!cv){s.goal={x:P[0],z:P[1],shade:1,near:1,sand:1};s.path=[s.goal,s.goal];s.pi=1}
    else if(Math.hypot(cv.x-P[0],cv.z-P[1])<Math.hypot(s.goal.x-P[0],s.goal.z-P[1])-1)rsGoTo(s,cv)}
  if(s.mode==="crawl"){const C=rsCentre(s),ref=s.gait==="side"?C:{x:b.P[0],z:b.P[1]};
    let wp=s.path[s.pi],last=s.pi===s.path.length-1;
    if(!last&&Math.hypot(wp.x-ref.x,wp.z-ref.z)<(s.gait==="side"?.7:.45)){s.pi++;wp=s.path[s.pi];last=s.pi===s.path.length-1}
    /* sidewinding turns at most .22 rad/s, so a goal inside that turning circle is reached when it is circled, not hit */
    s.legT+=dt;const dist=Math.hypot(s.goal.x-ref.x,s.goal.z-ref.z);
    if(last&&dist<(s.gait==="side"?Math.max(.6,1.2*Math.min(s.spd,.35)/.22):.3)||s.legT>90)s.arr=1;const arrive=!!s.arr;
    const want=s.lock||rsGaitAt(s,b.P[0],b.P[1]);
    if(want!==s.gait){s.gwT=(s.gwT||0)+dt}else s.gwT=0;
    const sw=(s.gait==="side")!==(want==="side")&&s.gwT>.8,stop=arrive||sw;
    s.a=cl(s.a+(stop?-dt/.9:dt/1.4),0,1);
    if(s.gait!=="side"){s.rk=cl(s.rk+((want==="rect"?1:0)-s.rk)*ease(1,dt),0,1);
      const dy=wrapA(Math.atan2(wp.x-b.P[0],wp.z-b.P[1])-s.yaw);steer(s,dy,1.1,dt)}
    else b.sw.goal=wp;
    if(s.a<.01&&stop){if(arrive){s.mode="rest";s.restT=s.goal.hunt?rr(4,9):rr(2.5,6);if(s.goal.hunt)rsBout(s,3);
        if(s.goal.shade&&day){if(s.goal.sand)rsBurrow(s);else{s.inShade=1;s.mode="coiling";rsCoilAt(s,"relaxed_coil",1.8);s.timer=rr(9,15);s.idle=rr(30,60)}}}
      else{if(want==="side"){s.gait="side";swInit(s,s.path[s.pi])}else{s.gait=want;trInit(s);s.rk=want==="rect"?1:0}s.gwT=0}}}
  if(s.mode==="rest"&&s.gait==="side"&&s.a<.01){trInit(s);s.gait="serp"}
  if(day&&s.mode==="rest"&&!s.inShade&&!s.next)s.restT=Math.min(s.restT,.2);
  if(!day)s.inShade=0;
  /* in snow or hail, once coiled in its shady spot it slips down the burrow there until the sand warms again;
     out in the open it sinks into the sand first */
  if(s.sandB&&s.mode==="coil"){s.sk=Math.min(1,(s.sk||0)+dt/2);s.g.position.y=s.gy-.16*s.sk}else if(s.sk){s.sk=0;s.g.position.y=s.gy}
  s.g.visible=!((WX.scold||WX.hcold)&&s.inShade&&s.mode==="coil"&&(!s.sandB||s.sk>=1));
  /* crawl weight: 1 travelling or resting stretched out, ramping to the clip pose when it coils */
  s.wT+=dt;const wf=s.wF||1;s.w=wf<0?ss(0,-wf,s.wT):1-ss(0,wf,s.wT);
  if(s.mode==="coiling"&&s.w<.002)s.mode="coil";
  if(s.mode==="def"&&s.w<.002)s.w=0;
  rigTick(s.r,dt);
  if(s.w>.002&&s.mode!=="coil"&&s.mode!=="def"&&s.mode!=="coiling"){for(let i=0;i<RS_N*2;i++)b.Pp[i]=b.P[i];
    if(s.gait==="side")rsBodySide(s,dt);else rsBodyTrail(s,dt)}
  else s.spd=0;
  rsPose(s);rsHeadLift(s,dt);rsTongue(s,dt);rsRattle(s,dt);trkTick(s,dt)}

/* ---- dust devil: a slender sand whirl that wanders across the open sand now and then (day / sunset) ---- */
const DEV=softPoints(MOB?140:260,"#e4bf88",.2,false);DEV.o.renderOrder=6;W.add(DEV.o);
const DV={on:0,life:0,dur:14,x:12,z:6,vx:-.6,vz:.25,wait:rr(6,14),P:[]};
for(let i=0;i<DEV.n;i++){DV.P.push({h:rnd(),a:rnd()*TAU,w:rr(1.6,3.2),r0:rr(.6,1.2)});DEV.Z[i]=rr(.5,1.3)}
function devilUpdate(dt,t){
  if(!DV.on){DV.wait-=dt;if(DV.wait<0&&st.phase!=="night"&&WX.wet<.15&&WX.rain<.05&&WX.dust<.1&&WX.ovc<.7){const g=navGrid("snake",.32,1.3,.82),p=randFree(g,8,4,14,(x,z)=>pN(x,z)>2.2);
      if(p){DV.on=1;DV.life=0;DV.x=p.x;DV.z=p.z;const a=rnd()*TAU;DV.vx=Math.cos(a)*.7;DV.vz=Math.sin(a)*.7}else DV.wait=3}}
  let amp=0;
  if(DV.on){DV.life+=dt/DV.dur;amp=ss(0,.15,DV.life)*(1-ss(.75,1,DV.life))*(st.phase==="night"?0:1)*(1-WX.wet)*(1-WX.dust)*(1-WX.rain);
    const gV=gustAt(DV.x,DV.z);DV.g=gV;DV.x+=(DV.vx+WIND.x*.9*gV)*dt;DV.z+=(DV.vz+WIND.z*.9*gV)*dt;const nx=DV.x+DV.vx*2,nz=DV.z+DV.vz*2;
    if(sN(nx,nz)>.8||pN(nx,nz)<1.8||!clearOf(nx,nz,.5)){const a=Math.atan2(DV.vz,DV.vx)+rr(1.6,2.6);DV.vx=Math.cos(a)*.7;DV.vz=Math.sin(a)*.7}
    if(DV.life>=1){DV.on=0;DV.wait=rr(18,34)}}
  DV.amp=amp;DEV.o.visible=amp>.01;if(!DEV.o.visible)return;
  const H=7.5,gy=hTop(DV.x,DV.z);
  for(let i=0;i<DEV.n;i++){const q=DV.P[i];q.h+=dt*.1;if(q.h>1)q.h-=1;q.a+=dt*q.w*(1.4-q.h*.6);
    const h=q.h,r=q.r0*(.25+1.6*h*h)+.08,lean=h*h*1.6*(.6+.8*(DV.g||.5)),o=i*3;
    DEV.P[o]=DV.x+Math.cos(q.a)*r+WIND.x*lean;DEV.P[o+1]=gy+h*H;DEV.P[o+2]=DV.z+Math.sin(q.a)*r+WIND.z*lean;
    DEV.A[i]=amp*.32*(1-h)*ss(0,.08,h)*(.5+.5*Math.sin(q.a*3+i))}
  DEV.g.attributes.position.needsUpdate=DEV.g.attributes.a.needsUpdate=true;DEV.m.uniforms.uH.value=innerHeight}

/* ---- sound: the desert's own set — CC0 field recordings cut by tools/desertaudio.py (sources: docs/desert-audio.md).
   Wind and blown sand are heard everywhere; the eagle, camels, snake, dust devil and fire are placed: pan from the camera's
   right axis, distance gain, and a low-pass that closes with distance so far calls arrive dull. Played through the site's
   master (volume slider, tap-to-start unlock). AU.cap records every voice for offline mixing of the captured videos. ---- */
const AQ={dWnd:"audio/dWnd.ff02237487.mp3",dCalm:"audio/dCalm.89da1bd867.mp3",dSnd:"audio/dSnd.b33d754ea1.mp3",dFire:"audio/dFire.33662e3a07.mp3",dPop1:"audio/dPop1.9a9d841b4d.mp3",dPop2:"audio/dPop2.bcc84443e4.mp3",dPop3:"audio/dPop3.ef7efcd23a.mp3",dSnk:"audio/dSnk.21e330a51e.mp3",dEg1:"audio/dEg1.293c9c2d4e.mp3",dEg2:"audio/dEg2.1279fb1910.mp3",dEg3:"audio/dEg3.4ac8779906.mp3",dEg4:"audio/dEg4.94735b1f97.mp3",dEg5:"audio/dEg5.cc6841e972.mp3",
  dCm1:"audio/dCm1.f2a9b2a01d.mp3",dCm2:"audio/dCm2.e317be836e.mp3",dCm3:"audio/dCm3.51b2b6db0a.mp3",dCm4:"audio/dCm4.fc07ce6e86.mp3",dCm5:"audio/dCm5.4cca90b15e.mp3",
  dOk1:"audio/dOk1.e1cd0b8449.mp3",dOk2:"audio/dOk2.187122caa9.mp3",dOk3:"audio/dOk3.12a14d4f0e.mp3",dOk4:"audio/dOk4.2e238f8827.mp3",dOc1:"audio/dOc1.31d35bc855.mp3",dOc2:"audio/dOc2.ba99be553d.mp3",dOc3:"audio/dOc3.f21d195427.mp3",
  dFr1:"audio/dFr1.71022fc177.mp3",dFr2:"audio/dFr2.2933177163.mp3",dFr3:"audio/dFr3.ef371c70a6.mp3",dFr4:"audio/dFr4.3b0eb8afa7.mp3",dFr5:"audio/dFr5.f59005cbba.mp3",dFr6:"audio/dFr6.34303a83b9.mp3",
  dDf1:"audio/dDf1.c2bca8b159.mp3",dDf2:"audio/dDf2.f9c6cbb2b2.mp3",dDf3:"audio/dDf3.89d3852f46.mp3",dGh1:"audio/dGh1.fab43c03e1.mp3",dGh2:"audio/dGh2.db74adeb9b.mp3",
  dRtl:"audio/dRtl.583fb265c7.mp3",dRtlOn:"audio/dRtlOn.8c54efd922.mp3",dRn:"audio/dRn.962d3a4b8e.mp3",dRt:"audio/dRt.42d94b489e.mp3",dRn2:"audio/dRn2.c4bd152bef.mp3",dRn3:"audio/dRn3.ce70d282d2.mp3",dRt2:"audio/dRt2.ea377a8b4f.mp3",dStm:"audio/dStm.5a9de5ce8c.mp3",dStS:"audio/dStS.3eb716e7e9.mp3",dTh1:"audio/dTh1.b13785294f.mp3",dTh2:"audio/dTh2.2231810e14.mp3",dTh3:"audio/dTh3.7d73564cb4.mp3",dTh4:"audio/dTh4.ddd885035b.mp3",dTh5:"audio/dTh5.b55b99d3da.mp3"};
const LL={dCiB:14,dRtc:11,dHsd:11,dHtn:9,dHlf:8,dHwt:7,dRwt:11,dRlf:9,dRn2:13,dRn3:17,dRt2:17,dSiz:6,dWnd:22,dCalm:36,dSnd:20,dFire:19,dSnk:8,dRtl:12,dRn:22,dRt:22,dStm:30,dStS:30,dSnw:8};
/* weather sounds load only when that weather comes */
const WXA=new Set(["dRtc","dRn2","dRn3","dRt2","dRwt","dRlf","dRd1","dRd2","dRd3","dCrn","dHsd","dHtn","dHlf","dHwt","dHs1","dHt1","dHp1","dHc1","dSiz","dSnw","dDp1","dDp2","dDp3","dRn","dRt","dStm","dStS","dTh1","dTh2","dTh3","dTh4","dTh5","dRtl","dRtlOn"]);
const AU={b:{},pd:{},lp:{},n:{},bus:null,ob:null,pre:0,egT:rr(5,10),cmT:[rr(14,30),rr(30,60)],cmL:-99,q:[],cap:null};
function SX(){return window.__sndX||null}
/* rain hissing on the embers, made here rather than recorded: bright noise that swells and ebbs, with a sputter each time a drop
   lands on the coals; laid out round a 6 s loop with the same 0.5 s padding as the recorded loops */
const lcg=s=>()=>(s=Math.imul(s,1664525)+1013904223>>>0)/4294967296;
/* a loop of n samples laid out with the 0.5 s padding of the recorded loops */
const padL=(o,R)=>{const n=o.length,P=Math.round(.5*R),b=new Float32Array(n+2*P);for(let i=0;i<n+2*P;i++)b[i]=o[((i-P)%n+n)%n];return b};
const SYN={dSiz(R){const L=LL.dSiz,n=Math.round(L*R),o=new Float32Array(n),rn=lcg(9);
    const kn=[...Array(24)].map(()=>.35+.65*rn());let lp=0;
    for(let i=0;i<n;i++){const w=rn()*2-1;lp+=(w-lp)*.35;const u=i/n*24,j=Math.floor(u),f=(1-Math.cos((u-j)*Math.PI))/2;o[i]=(w-lp)*.16*(kn[j]+(kn[(j+1)%24]-kn[j])*f)}
    for(let e=0,E=Math.round(L*8);e<E;e++){const t0=Math.floor(rn()*n),d=Math.round(R*(.012+.08*rn()*rn())),g=.25+.6*rn();let hp=0,pw=0;
      for(let k=0;k<d*3;k++){const w=rn()*2-1;hp=w-pw;pw=w;o[(t0+k)%n]+=hp*g*Math.min(1,k/(R*.002))*Math.exp(-k/d)}}
    return padL(o,R)},
  /* falling snow: a faint airy hiss, swelling and easing with the flurries, and a fine tick here and there of a flake on sand
     or cloth; nothing a listener would call loud */
  dSnw(R){const L=LL.dSnw,n=Math.round(L*R),o=new Float32Array(n),rn=lcg(31),kn=[...Array(16)].map(()=>.45+.55*rn());let l1=0,l2=0;
    for(let i=0;i<n;i++){const w=rn()*2-1;l1+=(w-l1)*.22;l2+=((w-l1)-l2)*.55;const u=i/n*16,j=Math.floor(u),f=(1-Math.cos((u-j)*Math.PI))/2;o[i]=l2*.12*(kn[j]+(kn[(j+1)%16]-kn[j])*f)}
    for(let e=0,E=Math.round(L*90);e<E;e++){const t0=Math.floor(rn()*n),d=Math.round(R*(.0006+.0016*rn())),g=.03+.1*rn()*rn();let pw=0;
      for(let k=0;k<d*4;k++){const w=rn()*2-1;o[(t0+k)%n]+=(w-pw)*g*Math.exp(-k/d);pw=w}}
    return padL(o,R)},
  /* dew dripping in the fog: two drops into the pond (the bubble's ring rising in pitch as it closes) and a dull tap on leaf or cloth */
  dDp1:R=>drip(R,1450,.6,11),dDp2:R=>drip(R,2050,.45,12),dDp3(R){const n=Math.round(.22*R),o=new Float32Array(n),rn=lcg(13);let lp=0;
    for(let i=0;i<n;i++){const t=i/R,w=rn()*2-1;lp+=(w-lp)*.12;o[i]=(lp*.9*Math.exp(-t/.006)+.35*Math.sin(TAU*310*t)*Math.exp(-t/.018))*Math.min(1,t/.0008)}return o}};
/* hail: sharp percussive strikes that differ by surface. Sand swallows the ring (a dull knock with a gritty tail); the taut
   tent cloth drums (a low damped membrane tone and a crisp slap); fronds crackle (clusters of very short bright clicks over a
   leafy rustle); on the pond each stone plinks (a short rising bubble tone after the splash) */
function hThud(o,i0,R,g,f,rn){const n=o.length,d=R*(.004+.007*rn()),K=Math.round(d*5);let lp=0;
  for(let k=0;k<K;k++){const t=k/R,w=rn()*2-1;lp+=(w-lp)*.28;o[(i0+k)%n]+=g*(lp*1.7*Math.exp(-k/(d*.45))+.7*Math.sin(TAU*f*t)*Math.exp(-k/d))*Math.min(1,k/(R*.0003))}}
function hDrum(o,i0,R,g,f,rn){const n=o.length,K=Math.round(.26*R);let pw=0;
  for(let k=0;k<K;k++){const t=k/R,w=rn()*2-1,hp=w-pw;pw=w;o[(i0+k)%n]+=g*(Math.sin(TAU*f*t)*Math.exp(-t/.055)+.55*Math.sin(TAU*f*1.59*t+1)*Math.exp(-t/.032)+.3*Math.sin(TAU*f*2.36*t+2)*Math.exp(-t/.016)+.9*hp*Math.exp(-t/.0022))*Math.min(1,t/.0004)}}
function hClick(o,i0,R,g,rn){const n=o.length,m=2+Math.floor(rn()*4);let at=i0;
  for(let c=0;c<m;c++){const d=R*(.0003+.0008*rn()),K=Math.round(d*5),gg=g*(.4+.6*rn());let pw=0;
    for(let k=0;k<K;k++){const w=rn()*2-1;o[(at+k)%n]+=gg*(w-pw)*Math.exp(-k/d);pw=w}at+=Math.round(R*(.002+.006*rn()))}}
function hPlink(o,i0,R,g,f,rn){const n=o.length,K=Math.round(.13*R);let ph=0,pw=0;
  for(let k=0;k<K;k++){const t=k/R,w=rn()*2-1,hp=w-pw;pw=w;const t2=Math.max(0,t-.006);ph+=TAU*f*(1+.55*Math.min(1,t2/.018))/R;
    o[(i0+k)%n]+=g*(.5*hp*Math.exp(-t/.0028)+(t>.006?.6*Math.sin(ph)*Math.exp(-t2/.024)*Math.min(1,t2/.001):0))}}
/* loops of strikes, each as long as its own LL so the surfaces never line up; strikes wrap round the end, so the loop is seamless */
function hLoop(R,seed,E,fn,L,post){const n=Math.round(L*R),o=new Float32Array(n),rn=lcg(seed);for(let e=0;e<L*E;e++)fn(o,Math.floor(rn()*n),rn);if(post)post(o,R);return padL(o,R)}
/* a noise layer that is exactly periodic over the loop: the same n noise samples are filtered twice round and the second
   pass kept, so the filters' state at the end runs straight on into the start */
function pNoise(o,seed,f){const n=o.length,rn=lcg(seed),w=new Float32Array(n);for(let i=0;i<n;i++)w[i]=rn()*2-1;const S={};
  for(let p=0;p<2;p++)for(let i=0;i<n;i++){const v=f(w[i],S,i/n);if(p)o[i]+=v}}
Object.assign(SYN,{
  dHsd:R=>hLoop(R,41,150,(o,i,rn)=>hThud(o,i,R,.05+.22*Math.pow(rn(),2.2),150+260*rn(),rn),LL.dHsd),
  dHtn:R=>hLoop(R,43,46,(o,i,rn)=>hDrum(o,i,R,.04+.2*Math.pow(rn(),1.8),95+75*rn(),rn),LL.dHtn),
  dHlf:R=>hLoop(R,47,70,(o,i,rn)=>hClick(o,i,R,.06+.3*Math.pow(rn(),1.5),rn),LL.dHlf,o=>pNoise(o,49,(w,S,u)=>{S.a=(S.a||0)+(w-(S.a||0))*.5;S.b=(S.b||0)+(S.a-(S.b||0))*.08;return(S.a-S.b)*.05*(.6+.4*Math.sin(TAU*3*u))})),
  dHwt:R=>hLoop(R,53,48,(o,i,rn)=>hPlink(o,i,R,.05+.2*Math.pow(rn(),1.6),1500+1700*rn(),rn),LL.dHwt,o=>pNoise(o,55,(w,S)=>{const v=(w-(S.p||0))*.012;S.p=w;return v})),
  /* rain on the pond: a dense fizz of small drops, each a tiny splash and a short high bubble plink */
  dRwt:R=>hLoop(R,57,95,(o,i,rn)=>hPlink(o,i,R,.025+.11*Math.pow(rn(),2),2400+2600*rn(),rn),LL.dRwt,o=>pNoise(o,59,(w,S)=>{const v=(w-(S.p||0))*.02;S.p=w;return v})),
  /* rain on the fronds: soft leaf ticks, many and quiet, over the leaves' wet rustle */
  dRlf:R=>hLoop(R,61,160,(o,i,rn)=>hClick(o,i,R,.02+.09*Math.pow(rn(),1.7),rn),LL.dRlf,o=>pNoise(o,63,(w,S,u)=>{S.a=(S.a||0)+(w-(S.a||0))*.45;S.b=(S.b||0)+(S.a-(S.b||0))*.06;return(S.a-S.b)*.035*(.7+.3*Math.sin(TAU*2*u))})),
  /* rain on the tent: the taut goat-hair cloth drums under every drop, a dense low patter of damped membrane taps over the
     roar of the water sheeting off it, swelling and easing with the gusts; 11 s against the recorded canvas loops' 22 and 17 */
  dRtc:R=>hLoop(R,79,120,(o,i,rn)=>hDrum(o,i,R,.012+.065*Math.pow(rn(),2),150+210*rn(),rn),LL.dRtc,o=>pNoise(o,81,(w,S,u)=>{S.a=(S.a||0)+(w-(S.a||0))*.3;S.b=(S.b||0)+(S.a-(S.b||0))*.04;return(S.a-S.b)*.05*(.75+.25*Math.sin(TAU*3*u+1))})),
  /* single near drops: a soft pat on sand, a taut tick on the cloth, a tick on a frond */
  dRd1(R){const o=new Float32Array(Math.round(.07*R));hThud(o,0,R,.32,330,lcg(73));return o},
  dRd2(R){const o=new Float32Array(Math.round(.28*R));hDrum(o,0,R,.28,175,lcg(75));return o},
  dRd3(R){const o=new Float32Array(Math.round(.07*R));hClick(o,0,R,.32,lcg(77));return o},
  /* a camel's foot in snow: the squeak and crackle of crystals packing down over a soft thud */
  dCrn(R){const n=Math.round(.2*R),o=new Float32Array(n),rn=lcg(71);let lp=0;
    for(let i=0;i<n;i++){const t=i/R,w=rn()*2-1;lp+=(w-lp)*.3;o[i]=lp*.35*Math.min(1,t/.01)*Math.exp(-t/.05)}
    for(let e=0;e<90;e++){const t0=Math.floor(Math.pow(rn(),1.5)*n*.85),g=(.1+.3*rn())*Math.exp(-t0/R/.08),d=R*(.0002+.0005*rn());let pw=0;
      for(let k=0;k<d*5;k++){const w=rn()*2-1;o[(t0+k)%n]+=(w-pw)*g*Math.exp(-k/d);pw=w}}
    return o},
  dHs1(R){const o=new Float32Array(Math.round(.12*R));hThud(o,0,R,.7,230,lcg(61));return o},
  dHt1(R){const o=new Float32Array(Math.round(.3*R));hDrum(o,0,R,.55,128,lcg(63));return o},
  dHp1(R){const o=new Float32Array(Math.round(.16*R));hPlink(o,0,R,.6,2300,lcg(65));return o},
  dHc1(R){const o=new Float32Array(Math.round(.06*R));hClick(o,0,R,.6,lcg(67));return o}});
/* oasis insects, made here: a desert cicada's call is tymbal clicks at ~200 a second, each ringing the abdomen near 6-7 kHz, a
   hard metallic buzz that swells in, throbs as the abdomen pumps and winds down in rate and pitch at the end; the far chorus is
   a loop of five of them waxing and waning, softened by distance; a katydid rasps groups of two or three pulses ("ka-ty-did"),
   each a run of file-tooth strikes on a 4.5-5.5 kHz wing resonance */
/* clicks and teeth are added from small precomputed kernels (four noise variants per resonance), so building a call costs
   a few milliseconds and never a long frame */
const _ik=new Map();
function iKern(R,fc,tau,len,hr,hg,nz,v){const key=R+":"+Math.round(fc/25)+":"+tau+":"+v;let k=_ik.get(key);if(k)return k;const rn=lcg(97+v*13),K=Math.round(R*len);k=new Float32Array(K);
  for(let i=0;i<K;i++){const t=i/R;k[i]=Math.sin(TAU*fc*t)*Math.exp(-t/tau)+hg*Math.sin(TAU*fc*hr*t+1.3)*Math.exp(-t/(tau*.62))+nz*(rn()*2-1)*Math.exp(-t/(tau*.4))}
  let m=0,w=0;for(let i=0;i<K;i++){const e=Math.exp(-i/(R*tau));m+=k[i]*e;w+=e}m/=w;for(let i=0;i<K;i++)k[i]-=m*Math.exp(-i/(R*tau));
  _ik.set(key,k);return k}
function cicClick(o,i0,R,g,fc,rn){const n=o.length,k=iKern(R,fc,.00065,.0028,1.52,.35,.25,Math.floor(rn()*4));for(let j=0;j<k.length;j++)o[(i0+j)%n]+=g*k[j]}
function cicCall(R,L,fp,fc,seed){const o=new Float32Array(Math.round(L*R)),rn=lcg(seed),am=2.8+2*rn();let t=.02;
  while(t<L-.05){const u=t/L,wd=ss(.78,1,u),g=.24*ss(0,.12,u)*(1-ss(.8,1,u))*(.78+.22*Math.sin(TAU*am*t))*(.85+.3*rn());
    cicClick(o,Math.floor(t*R),R,g,fc*(1-.12*wd)*(1+.01*(rn()-.5)),rn);t+=1/(fp*(1-.35*wd)*(1+.06*(rn()-.5)))}return o}
function ktPulse(o,i0,R,d,g,fc,rn){let t=0;
  while(t<d){const u=t/d,e=Math.pow(Math.sin(Math.PI*u),.6)*g,i=i0+Math.floor(t*R),k=iKern(R,fc,.0003,.0014,2.1,.5,.3,Math.floor(rn()*4));
    for(let j=0;j<k.length&&i+j<o.length;j++)o[i+j]+=e*k[j];t+=.00045+.0003*u+.0001*rn()}}
function ktCall(R,L,pat,fc,seed){const o=new Float32Array(Math.round(L*R)),rn=lcg(seed);let t=.05;
  while(t<L-.45){let q=t;for(const d of pat){ktPulse(o,Math.floor(q*R),R,d*(.9+.2*rn()),.3*(.85+.3*rn()),fc,rn);q+=d+.06+.02*rn()}t+=.62+.18*rn()}return o}
Object.assign(SYN,{dCi1:R=>cicCall(R,7.5,215,6300,87),dCi2:R=>cicCall(R,4.8,250,7300,89),
  dKt1:R=>ktCall(R,3.4,[.045,.035,.05],4600,91),dKt2:R=>ktCall(R,3,[.05,.04],5500,93),
  dCiB(R){const L=LL.dCiB,n=Math.round(L*R),o=new Float32Array(n),rn=lcg(83);
    for(let v=0;v<5;v++){const fp=180+90*rn(),fc=5200+2400*rn(),c1=1+Math.floor(rn()*3),p1=rn()*TAU,am=Math.round((3+2*rn())*L)/L,g0=.04+.05*rn();let t=rn()/fp;
      while(t<L){const env=Math.max(0,.3+.7*Math.sin(TAU*c1*t/L+p1));if(env>0)cicClick(o,Math.floor(t*R),R,g0*env*(.8+.2*Math.sin(TAU*am*t)),fc,rn);t+=1/(fp*(1+.05*(rn()-.5)))}}
    const w=o.slice();let lp=0;for(let p=0;p<2;p++)for(let i=0;i<n;i++){lp+=(w[i]-lp)*.5;if(p)o[i]=lp}
    return padL(o,R)}});
function drip(R,f0,rise,s){const n=Math.round(.3*R),o=new Float32Array(n),rn=lcg(s);let ph=0;
  for(let i=0;i<n;i++){const t=i/R;ph+=TAU*f0*(1+rise*Math.min(1,t/.03))/R;o[i]=.5*Math.sin(ph)*Math.exp(-t/.032)*Math.min(1,t/.0015)+(t<.0012?(rn()*2-1)*.35*(1-t/.0012):0)}return o}
/* the made sounds are built on first use; their loading slot is blocked so nothing tries to fetch them */
function synB(k){if(AU.b[k])return true;const x=SX();if(!x||!x.s)return false;AU.pd[k]=1;
  try{const d=SYN[k](x.s.sampleRate),b=x.s.createBuffer(1,d.length,x.s.sampleRate);b.getChannelData(0).set(d);AU.b[k]=b;return true}catch(e){return false}}
function aOK(){const x=SX();return!!(x&&x.on&&x.s&&x.s.state==="running"&&root.visible)}
function amb(){const x=SX();return AU.cap?true:!!(x&&x.amb)}
function dec(k){if(AU.b[k]||AU.pd[k]||!AQ[k])return;const x=SX();if(!x||!x.s||!x.ld)return;AU.pd[k]=1;
  x.ld(AQ[k]).then(B=>{const P=x.s.decodeAudioData(B,b=>{AU.b[k]=SEAM.has(k)?seam(x.s,b,LL[k]):b},()=>{});P&&P.catch&&P.catch(()=>{})}).catch(()=>{setTimeout(()=>{AU.pd[k]=0},8e3)})}
function aBus(){if(AU.bus)return true;const x=SX();try{const b=x.s.createGain();b.gain.value=0;b.connect(x.r);AU.bus=b;
  const o=x.s.createGain(),f=x.s.createBiquadFilter();f.type="lowpass";f.Q.value=.5;f.frequency.value=19000;o.gain.value=0;o.connect(f);f.connect(b);AU.ob=o;AU.of=f;return true}catch(e){return false}}
/* The rain beds are made exactly periodic once decoded. The file's loop [0.5 s, 0.5 s + T] joins only as well as the MP3
   frames on either side happen to match (and the decoder's padding differs between browsers), so the last 0.45 s of the
   loop is crossfaded into the copy of itself that sits just before the loop start; the wrap then continues sample for sample. */
/* made sounds are built one a frame as their weather comes, never all in one frame */
const DSY=["dDp1","dDp2","dDp3"],RSY=["dRtc","dRwt","dRlf","dRd1","dRd2","dRd3",...DSY],HSY=["dHsd","dHtn","dHlf","dHwt","dHs1","dHt1","dHp1","dHc1"];
const SEAM=new Set(["dRn","dRt","dRn2","dRn3","dRt2"]),BED=new Set(["rain","rain2","rain3","rtent","rtent2","rtcl","rwat","rleaf","hsand","htent","hleaf","hwat"]),PRE=new Set(["rain","rtent"]);
function seam(c,b,T){const sr=b.sampleRate,a=Math.round(.5*sr),n=Math.round(T*sr),x=Math.round(.45*sr);if(b.length<a+n||!c)return b;
  try{const o=c.createBuffer(b.numberOfChannels,n,sr);
    for(let ch=0;ch<b.numberOfChannels;ch++){const y=b.getChannelData(ch),d=o.getChannelData(ch);d.set(y.subarray(a,a+n));
      for(let j=0;j<x;j++){const f=(j+.5)/x;d[n-x+j]=y[a+n-x+j]*(1-f)+y[a-x+j]*f}}
    o.seam=1;return o}catch(e){return b}}
/* p in island metres; ref = distance (m) at which the source plays at its nominal level */
const _cr=new V3();
function spat(p,ref){const dx=p.x-_cl.x,dy=p.y-_cl.y,dz=p.z-_cl.z,d=Math.hypot(dx,dy,dz)||1;
  const m=De.matrixWorld.elements;_cr.set(m[0],m[1],m[2]).applyAxisAngle(_yAx,-YAW);
  return[cl((dx*_cr.x+dy*_cr.y+dz*_cr.z)/d,-1,1)*.8,cl(Math.pow(ref/Math.max(d,ref*.4),.9),.05,1.6),cl(19000*Math.exp(-d/55),1500,19000)]}
const _yAx=new V3(0,1,0);
function capE(e){if(AU.cap){AU.cap.ev.push([+(st.t-AU.cap.t0).toFixed(3)].concat(e));if(AU.cap.ev.length>4e5)AU.cap.ev.length=0}}
function voice(c,out,pan,lpf){const g=c.createGain(),f=c.createBiquadFilter(),pn=c.createStereoPanner?c.createStereoPanner():null;f.type="lowpass";f.Q.value=.5;f.frequency.value=lpf;
  g.connect(f);if(pn){pn.pan.value=pan;f.connect(pn);pn.connect(out)}else f.connect(out);return{g,f,pn}}
/* mf: a low-pass ceiling for the voice (snow muffles the air, fog hushes it) */
function loopS(id,k,v,p,ref,rate,tc,mf){let pan=0,lpf=19000;if(p){const q=spat(p,ref);pan=q[0];v*=q[1];lpf=q[2]}if(mf)lpf=Math.min(lpf,mf);rate=rate||1;
  capE(["L",id,k,+v.toFixed(4),+pan.toFixed(3),Math.round(lpf),+rate.toFixed(3)].concat(tc?[tc]:[]));
  if(!aOK()||!aBus())return;const c=SX().s;let L=AU.lp[id];
  /* the rain and hail beds start silent and then run without a break: the weather only raises and lowers their gain. The base
     patter and the cloth run from the moment they are decoded; the other layers start once wet weather is on its way and are
     stopped again after a long dry spell, so a clear day runs only the two */
  if(!L){if(v<=.001&&!(BED.has(id)&&AU.b[k]&&(AU.wet||PRE.has(id))))return;dec(k);const b=AU.b[k];if(!b)return;try{const s=c.createBufferSource();s.buffer=b;s.loop=true;
    if(b.seam){s.loopStart=0;s.loopEnd=b.duration}else{s.loopStart=.5;s.loopEnd=.5+LL[k]}
    L=voice(c,AU.bus,pan,lpf);L.g.gain.value=0;Object.assign(L,{s,v:0,lf:lpf,pa:pan,ra:1,w:-1});s.connect(L.g);s.start(0,b.seam?rnd()*b.duration:.5+rnd()*LL[k]);AU.lp[id]=L;AU.n[id]=(AU.n[id]||0)+1}catch(e){return}}
  /* parameters only glide toward smoothed targets, written when they have moved and at most twenty times a second, so a
     slow or stalled frame never steps the level and the audio thread's automation lists stay short */
  const now=c.currentTime;if(now-L.w<.05)return;let w=0;
  if(Math.abs(v-L.v)>Math.max(.002,.015*L.v)||(v===0&&L.v!==0)){L.g.gain.setTargetAtTime(v,now,tc||.35);L.v=v;w=1}
  if(Math.abs(lpf-L.lf)>L.lf*.03){L.f.frequency.setTargetAtTime(lpf,now,.3);L.lf=lpf;w=1}
  if(L.pn&&Math.abs(pan-L.pa)>.02){L.pn.pan.setTargetAtTime(pan,now,.2);L.pa=pan;w=1}
  if(Math.abs(rate-L.ra)>.002){L.s.playbackRate.setTargetAtTime(rate,now,.3);L.ra=rate;w=1}
  if(w)L.w=now}
/* oas: route through the oasis bus, whose level follows the camera's distance from the water and the wind */
function shotS(k,g,p,ref,rate,oas){const q=p?spat(p,ref):[0,1,19000];rate=rate||1;g*=q[1];
  capE(["S",k,+g.toFixed(4),+q[0].toFixed(3),Math.round(q[2]),+rate.toFixed(3)].concat(oas?["oas"]:[]));
  if(!aOK()||!aBus())return;dec(k);const b=AU.b[k];if(!b)return;
  try{const c=SX().s,s=c.createBufferSource(),v=voice(c,oas?AU.ob:AU.bus,q[0],q[2]);s.buffer=b;s.playbackRate.value=rate;v.g.gain.value=g;s.connect(v.g);s.start()}catch(e){}}
const later=(sec,fn)=>AU.q.push({t:st.t+sec,fn});
const pick=a=>a[Math.floor(rnd()*a.length)];
/* calls tied to what the animals are doing */
function eagleCall(e,long){if(!amb())return;const p=e.pos;shotS(long?pick(["dEg1","dEg2","dEg3"]):pick(["dEg4","dEg5"]),long?.62:.42,p,26,rr(.95,1.04))}
function camelHead(a){const y=hTop(a.x,a.z)+mix(2.3,1.1,a.k);return{x:a.x+Math.sin(a.yaw)*1.5,y,z:a.z+Math.cos(a.yaw)*1.5}}
function camelCall(a,kind){if(!amb())return;const r=a.voice*rr(.96,1.04),nt=st.night>.5?.6:1;AU.cmL=st.t;
  if(kind==="down")later(.5,()=>shotS(pick(["dCm3","dCm4"]),.55*nt,camelHead(a),9,r));
  else if(kind==="up")later(.3,()=>shotS(pick(["dCm1","dCm5"]),.5*nt,camelHead(a),9,r));
  else shotS(rnd()<.6?"dCm2":pick(["dCm1","dCm5"]),.36*nt,camelHead(a),9,r)}
const _crP=new V3(),_hwP=new V3(),_hsP=new V3(),_rtP=new V3(),_snP=new V3(),_fiP=new V3(),_dvP=new V3(),_oP=new V3(),_tnP=new V3(),_thP=new V3();
/* thunder follows the flash by the sound's travel time; near strikes crack, far ones roll; heard from the bolt's side */
function thunder(far){const k=far<.55?pick(["dTh1","dTh2","dTh3"]):pick(["dTh4","dTh5"]),ya=WX.boltA-YAW;
  capE(["T",+far.toFixed(3)]);later(.4+far*5,()=>shotS(k,mix(1,.5,far),_thP.set(_cl.x+Math.sin(ya)*60,_cl.y+20,_cl.z+Math.cos(ya)*60),60,rr(.92,1.04)))}
/* oasis insects, only around the water. In the day's heat cicadas buzz in the palms (singers near, a chorus further off)
   with an odd dragonfly pass over the water or a grasshopper's wing snap; from dusk katydids rasp in the shore grass and field
   and desert crickets start up, and at night the crickets and the water frogs at the edge carry on (a cricket only now and
   then by day). Crickets sing in bouts with rests. Everything pauses while the wind is up and starts again in the lulls, and
   the group fades out as the camera leaves the oasis for the dunes. */
const OAS=(()=>{const E=[],add=(ty,th,k,a,b)=>{const[x,z]=pondEdge(th,k);E.push({ty,x,z,a,b,t:rr(0,b),r:rr(.95,1.05),on:rnd()<.7,bt:rr(15,50)})};
  add("fc",.45,1.35,2,9);add("fc",2.7,1.3,3,12);add("dk",-1.15,1.45,3,6.5);add("dk",3.9,1.42,3.4,7);
  add("fr",1.35,1.0,12,32);add("fr",-2.35,1.02,14,38);add("df",0,.6,22,50);add("gh",.95,1.55,16,40);add("gh",-1.9,1.45,18,46);
  add("kt",1.9,1.4,2.5,5.5);add("kt",-2.8,1.5,3,6.5);add("kt",.2,1.6,3.5,7.5);
  PALMS.forEach((pp,i)=>E.push({ty:"ci",pp,x:pp.x,z:pp.z,a:3+2*i,b:12+3*i,t:rr(0,6),r:rr(.97,1.03),on:true,bt:0}));add("ci",-.6,1.7,6,15);return E})();
/* clip lengths (s), so one singer never overlaps itself */
const OLEN={dCi1:7.5,dCi2:4.8,dKt1:3.4,dKt2:3,dOc1:8.35,dOc2:6.94,dOc3:1.72,dOk1:1.08,dOk2:.92,dOk3:1.03,dOk4:1.13,dFr1:.57,dFr2:.66,dFr3:.5,dFr4:1.29,dFr5:1.05,dFr6:.65,dDf1:1.15,dDf2:1.15,dDf3:1.95,dGh1:1.3,dGh2:1.92};
const OSET={fc:[["dOc1","dOc2","dOc3"],.5,5],dk:[["dOk1","dOk2","dOk3","dOk4"],.42,5],fr:[["dFr1","dFr2","dFr3","dFr4","dFr5","dFr6"],.55,7],
  df:[["dDf1","dDf2","dDf3"],.36,3],gh:[["dGh1","dGh2"],.3,4],ci:[["dCi1","dCi2"],.4,8],kt:[["dKt1","dKt2"],.34,5]},ISY=["dCi1","dCi2","dKt1","dKt2","dCiB"];
function oasisNear(){const r=Math.hypot((_cl.x-POND.x)/POND.rx,(_cl.z-POND.z)/POND.rz),dh=Math.max(0,r-1.3)*6,dy=Math.max(0,_cl.y-hTop(POND.x,POND.z)-2.5);
  return 1-ss(3,15,Math.hypot(dh,dy*.7))}
/* fog hushes the oasis: the singers are fewer and sound muffled, as if from further off, while dew drips from the fronds.
   In snow the insects and frogs are silent (too cold to sing). */
function oasis(dt,nk,W){const zone=oasisNear(),hush=1-ss(.22,.6,W),fa=WX.fa,v=zone*hush*(1-.4*fa),lpf=Math.round(19000*Math.pow(2600/19000,ss(0,.7,fa)));
  capE(["B","oas",+v.toFixed(4),lpf]);if(aOK()&&aBus()){const n=SX().s.currentTime;AU.ob.gain.setTargetAtTime(v,n,.6);AU.of.frequency.setTargetAtTime(lpf,n,.6)}
  const night=ss(.3,.9,nk),dusk=ss(.3,.9,LK.sunset)*(1-night),cold=(1-ss(.04,.3,Math.max(WX.sf,WX.sc)))*(1-.5*fa),dry=1-ss(.03,.25,Math.max(WX.rain,WX.hf)),
    hot=ss(.4,.9,LK.day)*(1-night)*dry*(1-.8*fa),act={fc:(.05+.95*Math.max(night,.8*dusk))*cold,dk:(.04+.96*Math.max(night,.7*dusk))*cold,
    ci:.95*hot*cold,kt:(.9*dusk+.45*night)*cold*dry,fr:(.75*ss(.45,.95,nk)+.6*WX.after*(1-ss(.05,.3,WX.rain)))*cold,df:.55*(1-ss(.15,.5,nk))*cold,gh:.5*(1-ss(.15,.5,nk))*cold};
  for(const e of OAS){if(e.ty==="fc"||e.ty==="dk"){e.bt-=dt;if(e.bt<0){e.on=!e.on;e.bt=e.on?rr(25,80):rr(8,30)}}
    e.t-=dt;if(e.t>0)continue;e.t=rr(e.a,e.b);
    if(!amb()||zone<.02||hush<.25||(e.ty==="fc"||e.ty==="dk")&&!e.on||rnd()>act[e.ty])continue;
    const S=OSET[e.ty],k=pick(S[0]);let x=e.x,z=e.z,y=hTop(x,z)+(e.ty==="df"?.8:.15);if(e.ty==="df"){const[px,pz]=pondEdge(rr(-3.1,3.1),rr(.3,.95));x=px;z=pz;y=hTop(x,z)+.8}
    if(e.ty==="ci"){const T0=e.pp&&e.pp.g&&e.pp.g.userData.top;if(T0){x=T0.x+rr(-.4,.4);z=T0.z+rr(-.4,.4);y=T0.y-rr(.6,2.4)}else y=hTop(x,z)+1.2}
    e.t+=OLEN[k];shotS(k,S[1]*rr(.8,1.05),_oP.set(x,y,z),S[2],e.r*rr(.98,1.02),1)}
  /* the far cicadas: a chorus bed in the heat, on the oasis bus's level but its own loop */
  if(aOK()&&zone>.02&&(act.ci>.03||act.kt>.03))for(const k of ISY)if(!AU.b[k]){synB(k);break}
  loopS("cicb","dCiB",.3*v*act.ci,null,0,1,1.2,lpf)}
function sound(dt){if(!root.visible&&!AU.cap)return;
  /* iOS interrupts the audio context (a call, a notification, the lock screen) and does not resume it by itself */
  {const x=SX();if(aOK())AU.ran=1;else if(AU.ran&&x&&x.s&&x.on&&root.visible&&x.s.state!=="closed"&&x.s.state!=="running"&&st.t>(AU.rsT||0)){AU.rsT=st.t+1.5;try{const p=x.s.resume();p&&p.catch&&p.catch(()=>{})}catch(e){}}}
  /* the ambient loops at once; the calls once the models are in, so on a slow link they don't compete with them */
  if(aOK()){if(!AU.pre){AU.pre=1;Object.keys(LL).filter(k=>!WXA.has(k)).forEach(dec)}
    if(AU.pre===1&&AU.big){AU.pre=2;Object.keys(AQ).filter(k=>!WXA.has(k)).forEach(dec)}
    /* the rain beds are decoded ahead of the weather, so the first drops are heard as they are seen */
    if(AU.pre===2||Ct.weather!=="sun"&&Ct.weather!=="dust")["dRn","dRt","dRn2","dRn3","dRt2"].forEach(dec)}
  if(Ct.weather==="storm"&&aOK())["dTh1","dTh2","dTh3","dTh4","dTh5"].forEach(dec);
  if(ANIM.rs&&aOK())["dRtl","dRtlOn"].forEach(dec);
  if(aOK()&&aBus())AU.bus.gain.setTargetAtTime(1,SX().s.currentTime,.6);
  for(let i=AU.q.length-1;i>=0;i--)if(st.t>=AU.q[i].t){const f=AU.q[i].fn;AU.q.splice(i,1);f()}
  AU.wet=WX.rain>.001||WX.hf>.001||/rain|storm|hail/.test(Ct.weather);
  {let on=AU.wet;for(const id of BED){const L=AU.lp[id];if(L&&L.v>0)on=true}
   if(on)AU.dryT=st.t;else if(st.t-(AU.dryT||0)>240)for(const id of BED){const L=AU.lp[id];if(!L||PRE.has(id))continue;delete AU.lp[id];try{L.s.stop();L.g.disconnect()}catch(e){}}}
  const nk=st.night,wn=st.wn,g=gustAt(_cl.x,_cl.z),calm=1-.5*nk;
  /* beds: a steady low air, wind that swells with the gusts, and the hiss of sand on the move */
  /* snow on the ground soaks up the high end: the wind comes muffled and softer, the sand barely hisses (it is frozen in place) */
  const snA=ss(0,.5,Math.max(WX.sf,WX.sc)),fa=WX.fa,mCalm=Math.round(19000*Math.pow(2400/19000,Math.max(snA,.6*fa))),mWind=Math.round(19000*Math.pow(1500/19000,snA));
  loopS("calm","dCalm",(.2+.08*nk)*(1-.25*snA),null,0,1,0,mCalm);
  loopS("wind","dWnd",(.06+.42*ss(.12,1,wn)*(.45+.75*g))*calm*(1-.35*snA),null,0,1,0,mWind);
  loopS("sand","dSnd",(.02+.26*ss(.2,1,wn))*ss(.3,.85,g)*calm*(1-.85*WX.wet)*(1-.9*WX.sc));
  if(aOK()&&WX.sf>.01)synB("dSnw");
  loopS("snow","dSnw",.34*ss(0,.6,WX.sf)*(.7+.3*(1-ss(.3,1,wn))),null,0,1,.6);
  /* dew dripping off the fronds and the tent in the fog: into the pond at the edge, or a tap on a leaf or the cloth */
  /* and after rain, while the cloth still streams and the fronds still shed (the same curve that draws the drips), thinning out */
  const dr=ss(.88,1,WX.after)*(1-ss(.01,.2,WX.rain)),dw=Math.max(WX.dew,.85*dr);AU.dw=dw;
  if(dw>.12&&amb()&&(AU.dpT=(AU.dpT||0)-dt)<0){AU.dpT=rr(.35,2)/(.25+dw);if(aOK())for(const k of DSY)if(!AU.b[k]){synB(k);break}const r=rnd();AU.dpN=(AU.dpN||0)+1;
    if(r<.5){const[x,z]=pondEdge(rr(-3.1,3.1),rr(.86,.98));shotS(rnd()<.6?"dDp1":"dDp2",.42*dw,_oP.set(x,POND.wy,z),6,rr(.9,1.15),1)}
    else if(r<.82){const p=PALMS[Math.floor(rnd()*PALMS.length)];if(p)shotS("dDp3",.32*dw,_oP.set(p.x+rr(-1.6,1.6),hTop(p.x,p.z)+.1,p.z+rr(-1.6,1.6)),5,rr(.85,1.2),1)}
    else shotS("dDp3",.36*dw,_tnP.set(TENT.x+rr(-2,2),hTop(TENT.x,TENT.z)+.2,TENT.z+rr(-1.5,1.5)),6,rr(1.1,1.4))}
  /* weather: rain on the sand everywhere, rain drumming on the tent cloth up close, the roar and hiss of a dust storm */
  /* level follows the streaks drawn (same WX.rain, same cut-off) with a loudness curve that is already clear at the first
     sparse drops, and a short gain lag so it starts and stops with the picture */
  const rOn=WX.rain>.004?1:0,rv=.6*rOn*Math.pow(Math.min(1,WX.rain/.62),.6),sw=.5+.5*Math.sin(st.t*.043+1.1);
  /* the soft patter on the sand all round is three beds of 22, 17 and 13 s (no common factor) started at random points, the
     two shorter ones trading level slowly, so no stretch of it comes round again in any one listening */
  loopS("rain","dRn",.75*rv,null,0,1,.08);
  loopS("rain2","dRn2",.5*rv*(.75+.5*sw),null,0,1,.08);
  loopS("rain3","dRn3",.45*rv*(1.25-.5*sw),null,0,1,.08);
  /* the cloth keeps dripping for a while after the rain: the same drumming, thinned and slowed */
  /* it carries: the cloth is a drum skin over the camp, heard plainly over the patter on the sand from anywhere round the fire
     and the lake, and still there, thinner, from the far side of the island */
  {loopS("rtent","dRt",.85*rOn*Math.pow(Math.min(1,WX.rain/.5),.6)+.16*dr,_tnP.set(TENT.x,hTop(TENT.x,TENT.z)+1.6,TENT.z),9,1-.22*dr,rOn?.08:.35);
    /* heavy rain drums the cloth harder: a second stretch of the canvas recording, 17 s against the first's 22 */
    loopS("rtent2","dRt2",.5*rOn*ss(.45,.85,WX.rain),_tnP,9,1,rOn?.08:.35);
    loopS("rtcl","dRtc",.7*rOn*Math.pow(Math.min(1,WX.rain/.5),.5),_tnP,10,1,rOn?.08:.35)}
  /* each surface where it is, louder the nearer and the harder it rains: plinks on the pond, ticks in the palm crowns */
  {const T0=PALMS[0].g?PALMS[0].g.userData.top:null;
    loopS("rwat","dRwt",.55*rv/.6,_hwP.set(POND.x,POND.wy,POND.z),7,1,.08);
    loopS("rleaf","dRlf",.5*rv/.6,_oP.set(GROVE.x,T0?T0.y-1:8,GROVE.z),8,1,.08)}
  /* single drops close by, on whatever is under them, at random: a pat on the sand, a tick on the cloth, a plink in the pond,
     a tick on a frond overhead; only when the camera is down among them */
  if(rOn&&amb()&&(AU.rdT=(AU.rdT||0)-dt)<0){AU.rdT=rr(.07,.4)/(.2+WX.rain);
    const a=rnd()*TAU,d=rr(.5,3.5),x=_cl.x+Math.cos(a)*d,z=_cl.z+Math.sin(a)*d,gy=hTop(x,z);
    if(_cl.y-gy<7){const g=rr(.35,1)*Math.pow(Math.min(1,WX.rain/.62),.4);AU.rdN=(AU.rdN||0)+1;
      const rf=Math.abs(x-TENT.x)<4&&Math.abs(z-TENT.z)<4?roofAt(x,z):-99;
      if(rf>-50)shotS("dRd2",.34*g,_oP.set(x,rf,z),3,rr(.85,1.2));
      else if(pN(x,z)<1)shotS(rnd()<.6?"dDp1":"dDp2",.2*g,_oP.set(x,POND.wy,z),3,rr(1.2,1.7),1);
      else shotS("dRd1",.3*g,_oP.set(x,gy,z),3,rr(.8,1.25));
      for(const p of PALMS){const T0=p.g&&p.g.userData.top;if(T0&&Math.hypot(_cl.x-T0.x,_cl.z-T0.z)<4.5&&rnd()<.5){shotS("dRd3",.3*g,_oP.set(T0.x+rr(-2,2),T0.y-rr(0,1),T0.z+rr(-2,2)),4,rr(.85,1.2));break}}}}
  /* hail: the bed of strikes on the sand all round, drumming on the tent, crackle in the palm crowns and plinks on the pond,
     each where it is; the strikes simulated near the camera are heard singly on top */
  if(aOK()&&(WX.rain>.004||/rain|storm/.test(Ct.weather)))for(const k of RSY)if(!AU.b[k]){synB(k);break}
  if(aOK()&&WX.sc>.03)synB("dCrn");
  if(aOK()&&WX.hf>.004)for(const k of HSY)if(!AU.b[k]){synB(k);break}
  {const hv=Math.pow(ss(0,.8,WX.hf),.7),T0=PALMS[0].g?PALMS[0].g.userData.top:null;
   loopS("hsand","dHsd",.5*hv,null,0,1,.12);
   loopS("htent","dHtn",.9*hv,_tnP.set(TENT.x,hTop(TENT.x,TENT.z)+1.8,TENT.z),6,1,.12);
   loopS("hleaf","dHlf",.62*hv,_oP.set(GROVE.x,T0?T0.y:9,GROVE.z),8,1,.12);
   loopS("hwat","dHwt",.5*hv,_hwP.set(POND.x,POND.wy,POND.z),7,1,.12);
   const E=HS.ev,K={sand:["dHs1",.42,3],tent:["dHt1",.6,4],palm:["dHc1",.5,4],pond:["dHp1",.5,3],cactus:["dHs1",.38,3]};
   if(WX.hf>.004||HS.act)for(const k in K){const e=E[k];if(!e)continue;const q=K[k];if(st.t<(AU["h_"+k]||0))continue;AU["h_"+k]=st.t+rr(.04,.09);
     shotS(q[0],q[1]*cl(.5+(e.e||1)*.08,.5,1.2),_hsP.set(e.x,e.y,e.z),q[2],rr(.88,1.15)*(k==="cactus"?1.5:1))}}
  loopS("storm","dStm",.62*ss(.04,.7,WX.dust));
  loopS("stsand","dStS",.5*ss(.2,.9,WX.dust)*(.55+.45*g));
  oasis(dt,nk,Math.max(ss(.12,1,wn)*(.45+.75*g),WX.dust*1.3,WX.rain*.9));
  /* placed: dust devil, the night fire, the snake's rustle (speed sets level and grain rate) */
  loopS("devil","dSnd",DV.amp?.55*DV.amp:0,_dvP.set(DV.x,hTop(DV.x,DV.z)+1.5,DV.z),10,1.12);
  if(aOK()&&!AU.b.dSiz&&(AU.pre===2||WX.rain>.005))synB("dSiz");
  loopS("fsiz","dSiz",.42*ss(.02,.25,WX.rain)*(1-.4*ss(.6,1,WX.rain)),_fiP.set(FIRE.x,hTop(FIRE.x,FIRE.z)+.3,FIRE.z),5,1,WX.rain>.004?.08:.35);
  loopS("fire","dFire",.5*mix(.45,1,ss(.35,.85,nk))*(1-.7*ss(.08,.55,WX.rain)),_fiP.set(FIRE.x,hTop(FIRE.x,FIRE.z)+.4,FIRE.z),5);
  const rs=ANIM.rs&&ANIM.rs.bd?ANIM.rs:null,sv=rs?cl(rs.spd/.2,0,1):0;
  loopS("snake","dSnk",rs?.75*ss(.04,.4,sv):0,rs?_snP.set(rs.bd.P[20],hTop(rs.bd.P[20],rs.bd.P[21])+.05,rs.bd.P[21]):null,3,.8+.35*sv);
  if(rs)loopS("rattle","dRtl",rs.mode==="def"?.75*ss(3,4.5,rs.defT):0,_rtP.set(rs.x,hTop(rs.x,rs.z)+.15,rs.z),4,rr(.99,1.01));
  /* the eagle cries now and then while it circles; perched (dusk, night) it is quiet */
  const e=ANIM.eagle;
  if(e){if(e.cry){e.cry=0;eagleCall(e,false)}
    if(e.mode==="soar"){AU.egT-=dt;if(AU.egT<=0){AU.egT=rr(11,24);if(rnd()<.8)eagleCall(e,true)}}}
  /* camels grumble now and then while grazing or idling; rarely at night */
  ANIM.camels.forEach((a,i)=>{AU.cmT[i]-=dt;if(AU.cmT[i]>0)return;if(st.t-AU.cmL<4){AU.cmT[i]=rr(3,6);return}
    if(a.mode==="rest"){AU.cmT[i]=rr(80,160);if(rnd()<.5)camelCall(a,"grunt")}
    else{AU.cmT[i]=rr(22,50);if(a.mode==="job"||a.mode==="walk")camelCall(a,"grunt")}})}
HIDE.push(on=>{const x=SX();if(!on&&AU.bus&&x&&x.s){AU.bus.gain.setTargetAtTime(0,x.s.currentTime,.25);const L=AU.lp;AU.lp={};setTimeout(()=>{for(const k in L)try{L[k].s.stop()}catch(e){}},1500)}
  if(x&&x.C)x.C()});

/* ---------------- desert pupfish (Cyprinodon): a loose school over the shallow sandy ring, males holding small territories
   along the margin. Real size (~6 cm). They live under the pond's opaque water layer, so they are drawn after it and blended
   over it by how much light comes back through the surface: absorbed with depth, cut by the surface reflection at grazing
   views, lifted to their apparent depth and wobbled by the ripples, with caustics on their backs. ---------------- */
const PF_N=MOB?11:16,PF_TH=MOB?[1.2,1.58]:[1.02,1.36,1.7],PF_R=.3;
const PF={list:[],ter:[],sch:{th:1.9,dir:1,turn:rr(18,35)},vis:0,thr:[],
  U:{uWy:{value:0},uS:{value:S},uT:pondU.uT,uWob:{value:.02},uVis:{value:0},uIri:{value:1}}};
/* water depth over the pond bbox, sampled once (hTop is too dear to call per fish per frame) */
const PFG=(()=>{const c=.2,x0=POND.x-POND.rx*1.35,z0=POND.z-POND.rz*1.35,nx=Math.ceil(POND.rx*2.7/c)+1,nz=Math.ceil(POND.rz*2.7/c)+1,d=new Float32Array(nx*nz);
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++)d[j*nx+i]=POND.wy-hTop(x0+i*c,z0+j*c);return{c,x0,z0,nx,nz,d}})();
function pfDep(x,z){const G=PFG,u=cl((x-G.x0)/G.c,0,G.nx-1.001),v=cl((z-G.z0)/G.c,0,G.nz-1.001),i=u|0,j=v|0,fu=u-i,fv=v-j,d=G.d,n=G.nx;
  return mix(mix(d[j*n+i],d[j*n+i+1],fu),mix(d[(j+1)*n+i],d[(j+1)*n+i+1],fu),fv)}
/* the pond-radius fraction where the water is `d` deep along heading th */
function pfK(th,d){let k=1.05;for(;k>.3;k-=.01){const[x,z]=pondEdge(th,k);if(pfDep(x,z)>=d)break}return k}
function pfMats(o,male){matsOf(o,(m,c)=>{c.castShadow=false;c.receiveShadow=true;c.renderOrder=3;if(m.userData.pf)return;m.userData.pf=1;
  const fin=/fin/i.test(m.name||""),iri=male&&/body/i.test(m.name||"");
  if(m.map){m.map.colorSpace="srgb";m.map.anisotropy=MOB?2:4}if(m.emissive)m.emissive.setRGB(0,0,0);
  m.transparent=true;m.depthWrite=true;if(!ANIM_MATS.includes(m))ANIM_MATS.push(m);
  m.defines=Object.assign({},m.defines,iri?{PF_IRI:""}:{});m.customProgramCacheKey=()=>"pf"+(iri?1:0)+(fin?1:0);
  m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,PF.U);
    sh.vertexShader=sh.vertexShader.replace("#include <common>","#include <common>\nuniform float uWy,uT,uWob;varying vec3 vPfW;")
      .replace("#include <project_vertex>",`vec4 pfW=modelMatrix*vec4(transformed,1.);vPfW=pfW.xyz;float pfD=max(uWy-pfW.y,0.);
        pfW.y+=pfD*.25;
        pfW.xz+=uWob*pfD*vec2(sin(uT*1.9+pfW.z*31.+pfW.x*17.),cos(uT*1.5+pfW.x*29.-pfW.z*13.));
        vec4 mvPosition=viewMatrix*pfW;gl_Position=projectionMatrix*mvPosition;`);
    sh.fragmentShader=sh.fragmentShader.replace("#include <common>",`#include <common>
uniform float uWy,uS,uT,uVis,uIri;varying vec3 vPfW;
float pfCau(vec2 p,float t){p=mod(p*6.2832,6.2832)-250.;vec2 i=p;float c=1.;
  for(int n=0;n<3;n++){float tt=t*(1.-3.5/float(n+1));i=p+vec2(cos(tt-i.x)+sin(tt+i.y),sin(tt-i.y)+cos(tt+i.x));
    c+=1./length(vec2(p.x/(sin(i.x+tt)/.005),p.y/(cos(i.y+tt)/.005)));}
  c=1.17-pow(c/3.,1.4);return pow(abs(c),8.);}`)
      .replace("#include <opaque_fragment>",`{vec3 Vw=normalize(cameraPosition-vPfW);float dW=max(uWy-vPfW.y,0.)/uS;
        /* sunlight under rippled water: bright caustic threads and dimmer gaps */
        float ca=pfCau(vPfW.xz/uS*8.,uT*.7)*smoothstep(0.,.02,dW);
        outgoingLight+=reflectedLight.directDiffuse*(ca*1.5-.3);
        #ifdef PF_IRI
        /* the breeding male's blue: a thin-film sheen that runs teal head-on, through blue, to violet at grazing angles */
        {float f=1.-clamp(dot(normalize(normal),normalize(vViewPosition)),0.,1.);
          float msk=smoothstep(.15,.45,diffuseColor.b-diffuseColor.r);
          float h=clamp(f*1.2+.1*sin(vPfW.x*900.+vPfW.z*700.),0.,1.);
          vec3 ir=h<.5?mix(vec3(.1,.6,.72),vec3(.16,.42,1.),h*2.):mix(vec3(.16,.42,1.),vec3(.34,.3,.98),h*2.-1.);
          vec3 irr=(reflectedLight.directDiffuse+reflectedLight.indirectDiffuse)/max(diffuseColor.rgb,vec3(.05));
          outgoingLight+=ir*msk*(.08+.8*f*f)*dot(irr,vec3(.333))*.6*uIri;}
        #endif
        float path=dW+dW/max(Vw.y,.25);
        outgoingLight*=exp(-path*vec3(1.05,.42,.5));
        float fr=.02+.98*pow(1.-clamp(Vw.y,0.,1.),5.);
        /* never fully opaque: some of the water's own reflection and glint stays on top of the fish */
        diffuseColor.a=.86*exp(-dW/max(Vw.y,.2)*1.3)*(1.-fr)*uVis;}
        #include <opaque_fragment>`)};
  m.needsUpdate=true})}
function pfSpawn(src,male,anims){const s=VT.cloneSkinned(src.scene),g=new T.Group();g.rotation.order="YXZ";g.add(s);W.add(g);pfMats(g,male);onDes(g);
  const f={g,r:rigUp(s,anims),male,ter:-1,x:0,y:0,z:0,yaw:rr(-3,3),yr:0,pit:0,v:0,vt:0,mode:"pause",t:rr(0,1.5),hY:rr(.03,.14),tg:null,
    off:{a:rr(0,TAU),d:Math.sqrt(rnd())*.85},disp:rr(6,16),ct:0};
  const sw=f.r.acts.swim;if(sw){sw.play();sw.time=rr(0,.8)}f.r.cur="swim";
  const it=f.r.acts.idle_turn;if(it)it.setLoop(VT.THREE.LoopOnce,1);return f}
function pfStart(f,gx,gz,vt,T){f.gx=gx;f.gz=gz;f.vt=vt;f.t=T;f.mode="dart";
  if(f.r.cur!=="swim")play(f.r,"swim",.12)}
function pfPause(f){const n=st.night>.5;f.mode="pause";f.vt=0;f.tg=null;f.t=n?rr(2,6):rr(.3,1.7);
  if(!n&&f.t>1.2&&rnd()<.4&&f.r.acts.idle_turn)play(f.r,"idle_turn",.3,rr(.8,1.3))}
/* keep a goal over water of the right depth: pull it toward the pond centre when too shallow, out when too deep.
   Under hail every fish keeps to the deep middle, out of reach of the strikes. */
function pfFit(f,x,z){const hd=WX.hcold>0,lo=hd?.4:f.ter>=0?.05:.08,hi=hd?1.5:f.ter>=0?.3:.75;
  for(let k=0;k<8;k++){const d=pfDep(x,z);if(d<lo){x+=(POND.x-x)*.12;z+=(POND.z-z)*.12}else if(d>hi){x-=(POND.x-x)*.08;z-=(POND.z-z)*.08}else break}return[x,z]}
function pfDart(f){
  let gx,gz;const ny=st.night>.5;
  if(f.ter>=0){const C=PF.ter[f.ter],a=rr(0,TAU),d=Math.hypot(f.x-C.x,f.z-C.z)>PF_R?0:rr(.05,PF_R);gx=C.x+Math.cos(a)*d;gz=C.z+Math.sin(a)*d}
  else{const[cx,cz]=pondEdge(PF.sch.th,PF.sch.k||.74),a=f.off.a+PF.sch.th;gx=cx+Math.cos(a)*f.off.d+rr(-.25,.25);gz=cz+Math.sin(a)*f.off.d+rr(-.25,.25);
    /* loose school: step away from the nearest neighbour when crowded */
    let nb=null,nd=.12;for(const o of PF.list){if(o===f)continue;const d=Math.hypot(o.x-f.x,o.z-f.z);if(d<nd){nd=d;nb=o}}
    if(nb){gx+=(f.x-nb.x)/Math.max(nd,.01)*.15;gz+=(f.z-nb.z)/Math.max(nd,.01)*.15}}
  for(const h of PF.thr){const d=Math.hypot(gx-h.x,gz-h.z);if(d<h.r){gx+=(gx-h.x)/Math.max(d,.01)*(h.r-d);gz+=(gz-h.z)/Math.max(d,.01)*(h.r-d)}}
  [gx,gz]=pfFit(f,gx,gz);
  pfStart(f,gx,gz,ny?rr(.08,.15):rr(.18,.42),ny?rr(.3,.6):rr(.14,.42))}
function pfFlee(f,from,sp){const a=Math.atan2(f.x-from.x,f.z-from.z)+rr(-.6,.6);const[gx,gz]=pfFit(f,f.x+Math.sin(a)*.6,f.z+Math.cos(a)*.6);
  pfStart(f,gx,gz,sp||rr(.5,.65),rr(.35,.7));f.mode="flee";f.tg=from}
function pfChase(f,o,T){f.mode="chase";f.tg=o;f.t=T;f.vt=rr(.5,.62);if(f.r.cur!=="swim")play(f.r,"swim",.08);pfFlee(o,f)}
function pfUpdate(dt){
  const L=PF.list;if(!L.length)return;const ny=st.night>.5;
  /* threats: a camel's muzzle at the water, the eagle low over the pond */
  PF.thr.length=0;
  ANIM.camels.forEach(a=>{const r=1.5*a.sc;PF.thr.push({x:a.x+Math.sin(a.yaw)*r,z:a.z+Math.cos(a.yaw)*r,r:1.6})});
  const e=ANIM.eagle;if(e&&e.pos.y<POND.wy+6)PF.thr.push({x:e.pos.x,z:e.pos.z,r:e.mode==="perch"?2.2:3.5});
  /* the school drifts slowly round the shallow ring, turning back now and then, and swings away from threats */
  const S0=PF.sch;S0.turn-=dt;if(S0.turn<0){S0.turn=rr(18,40);S0.dir*=-1}
  {const[cx,cz]=pondEdge(S0.th,.74);for(const h of PF.thr)if(Math.hypot(cx-h.x,cz-h.z)<h.r+1)S0.dir=wrapA(S0.th-Math.atan2((h.z-POND.z)/POND.rz,(h.x-POND.x)/POND.rx))>=0?1:-1;
    S0.th=wrapA(S0.th+S0.dir*dt*(ny?.004:.012))}
  for(const f of L){
    for(const h of PF.thr)if(f.mode!=="flee"&&Math.hypot(f.x-h.x,f.z-h.z)<h.r*.8){pfFlee(f,h,rr(.55,.7));f.t+=.4}
    /* territorial males: chase other males that cross in, now and then square up to a neighbour, follow a passing female */
    if(f.ter>=0&&!ny&&f.mode!=="chase"&&f.mode!=="flee"){const C=PF.ter[f.ter];f.disp-=dt;
      for(const o of L){if(o===f||o.mode==="flee")continue;const d=Math.hypot(o.x-C.x,o.z-C.z);
        if(o.male&&d<PF_R*1.25&&rnd()<dt*4){pfChase(f,o,rr(.7,1.4));break}
        if(!o.male&&d<PF_R&&f.mode==="pause"&&rnd()<dt*.5){f.mode="court";f.tg=o;f.t=rr(1.5,3);f.vt=.1;if(f.r.cur!=="swim")play(f.r,"swim",.2);break}}
      if(f.disp<0&&f.mode==="pause"){f.disp=rr(7,18);const nb=PF.ter.map(c=>c.f).filter(o=>o&&o!==f&&Math.abs(PF.ter[o.ter].th-C.th)<.5);
        if(nb.length){const o=nb[(rnd()*nb.length)|0];if(o.mode==="pause"||o.mode==="dart"){pfChase(f,o,rr(.5,.9));o.back=1}}}}
    f.t-=dt;
    if(f.mode==="pause"){f.vt=0;const it=f.r.acts.idle_turn;if(f.r.cur==="idle_turn"&&it&&it.time>3.3)play(f.r,"swim",.35);if(f.t<0)pfDart(f)}
    else if(f.mode==="dart"){if(f.t<0)pfPause(f)}
    else if(f.mode==="flee"){if(f.t<0){
      /* a chased territory holder turns and chases back across the border before both settle */
      if(f.back&&f.tg&&f.tg.ter>=0&&f.ter>=0){f.back=0;pfChase(f,f.tg,rr(.4,.7))}else{f.back=0;pfPause(f);f.t*=1.6}}}
    else if(f.mode==="chase"||f.mode==="court"){const o=f.tg;
      if(!o||f.t<0||(f.ter>=0&&Math.hypot(f.x-PF.ter[f.ter].x,f.z-PF.ter[f.ter].z)>PF_R*2.4)){
        f.mode="dart";f.tg=null;const C=PF.ter[f.ter];if(C)pfStart(f,C.x,C.z,.3,.6);else pfPause(f)}
      else{const lead=f.mode==="chase"?.12:-.05;f.gx=o.x+Math.sin(o.yaw)*lead;f.gz=o.z+Math.cos(o.yaw)*lead;if(f.mode==="court")f.vt=Math.hypot(o.x-f.x,o.z-f.z)>.07?o.v+.06:0;
        if(f.mode==="chase"&&o.mode==="flee"&&o.t<.15)pfFlee(o,f)}}
    /* heading snaps round at the start of a dart and eases while gliding */
    const want=Math.atan2(f.gx-f.x,f.gz-f.z),moving=f.mode!=="pause";
    if(moving&&Math.hypot(f.gx-f.x,f.gz-f.z)>.015){const dy=wrapA(want-f.yaw);f.yr=dy*(f.mode==="court"?3:14);f.yaw=wrapA(f.yaw+dy*ease(f.mode==="court"?3:14,dt))}else f.yr*=1-ease(4,dt);
    f.v+=(f.vt-f.v)*ease(f.vt>f.v?11:2.4,dt);
    let nx=f.x+Math.sin(f.yaw)*f.v*dt,nz=f.z+Math.cos(f.yaw)*f.v*dt;
    if(pfDep(nx,nz)<.035){nx=f.x+(POND.x-f.x)*.02;nz=f.z+(POND.z-f.z)*.02;f.v*=.5}
    f.x=nx;f.z=nz;
    const bed=POND.wy-pfDep(f.x,f.z),hy=ny?.015:f.ter>=0?.03:f.hY,ty=Math.min(bed+hy,POND.wy-.03),y0=f.y;
    f.y=Math.max(f.y+(ty-f.y)*ease(2.5,dt),Math.min(bed+.012,POND.wy-.02));
    f.pit+=(cl(-(f.y-y0)/dt/Math.max(f.v,.06),-.45,.45)-f.pit)*ease(5,dt);
    const sw=f.r.acts.swim;if(sw)sw.timeScale=cl(.45+f.v*11,.45,6.5)}
  if(PF.vis>0)for(const f of L){f.g.position.set(f.x,f.y,f.z);f.g.rotation.set(f.pit,f.yaw,cl(-f.yr*.03,-.35,.35));rigTick(f.r,dt)}}
/* fish under ~1.5 px are hidden and their rigs left alone */
const _pfc=new V3();
function pfVis(){const c=_pfc.copy(De.position);W.worldToLocal(c);
  const D=Math.max(.5,Math.hypot((c.x-POND.x),(c.z-POND.z),c.y-POND.wy)-Math.max(POND.rx,POND.rz)*.6),ppm=innerHeight*Math.min(devicePixelRatio||1,2)/(2*Math.tan(De.fov*Math.PI/360)),Dm=.06*ppm/1.5;
  const v=1-ss(Dm*.6,Dm,D);PF.vis=v;PF.U.uVis.value=v;PF.U.uWy.value=W.position.y+POND.wy*W.scale.y;PF.U.uWob.value=(.012+.03*st.wn+.05*WX.rain);
  for(const f of PF.list)f.g.visible=v>0}
/* Godot's v3b: same 23-bone rig, swim 0.8 s, idle_turn 4.0 s */
const PF_FILES=["pupfish_male_v3b","pupfish_female_v3b"];
function pfLoad(){return Promise.all(PF_FILES.map(glb)).then(([M,F])=>{
  const ter=PF_TH.map(th=>{const k=pfK(th,.13),[x,z]=pondEdge(th,k);return{th,x,z,f:null}});PF.ter=ter;
  for(let i=0;i<PF_N;i++){const male=i<ter.length||i%2===0,src=male?M:F,f=pfSpawn(src,male,src.animations);
    if(i<ter.length){f.ter=i;ter[i].f=f;f.x=ter[i].x;f.z=ter[i].z}
    else{const[cx,cz]=pondEdge(PF.sch.th,.74);f.x=cx+Math.cos(f.off.a)*f.off.d;f.z=cz+Math.sin(f.off.a)*f.off.d;[f.x,f.z]=pfFit(f,f.x,f.z)}
    f.y=POND.wy-pfDep(f.x,f.z)+f.hY;f.gx=f.x;f.gz=f.z;f.g.position.set(f.x,f.y,f.z);PF.list.push(f)}})}

/* ---------------- under the pond's surface: the trout and the crabs are shaded like the pupfish. Drawn after the water and blended
   over it by the light that comes back through it (absorbed with depth, cut by the surface reflection at grazing views, lifted to
   their apparent depth and wobbled by the ripples, caustics on their backs); what is above the water is drawn as it is ---------------- */
const UW={uWy:{value:0},uS:{value:S},uT:pondU.uT,uWob:{value:.02}};
function uwMat(m,key,kA,A){m.transparent=true;m.depthWrite=true;if(!ANIM_MATS.includes(m))ANIM_MATS.push(m);m.customProgramCacheKey=()=>key;
  m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,UW,m.userData.U);
    sh.vertexShader=sh.vertexShader.replace("#include <common>","#include <common>\nuniform float uWy,uT,uWob;varying vec3 vUW;\n"+A.head)
      .replace("#include <beginnormal_vertex>","#include <beginnormal_vertex>\n"+A.nrm)
      .replace("#include <begin_vertex>","#include <begin_vertex>\n"+A.pos)
      .replace("#include <project_vertex>",`vec4 uwP=vec4(transformed,1.);
        #ifdef USE_INSTANCING
        uwP=instanceMatrix*uwP;
        #endif
        uwP=modelMatrix*uwP;vUW=uwP.xyz;float uwD=max(uWy-uwP.y,0.);
        uwP.y+=uwD*.25;uwP.xz+=uWob*uwD*vec2(sin(uT*1.9+uwP.z*31.+uwP.x*17.),cos(uT*1.5+uwP.x*29.-uwP.z*13.));
        vec4 mvPosition=viewMatrix*uwP;gl_Position=projectionMatrix*mvPosition;`);
    sh.fragmentShader=sh.fragmentShader.replace("#include <common>",`#include <common>
uniform float uWy,uS,uT,uVis;varying vec3 vUW;${A.fh||""}
float uwCau(vec2 p,float t){p=mod(p*6.2832,6.2832)-250.;vec2 i=p;float c=1.;
  for(int n=0;n<3;n++){float tt=t*(1.-3.5/float(n+1));i=p+vec2(cos(tt-i.x)+sin(tt+i.y),sin(tt-i.y)+cos(tt+i.x));
    c+=1./length(vec2(p.x/(sin(i.x+tt)/.005),p.y/(cos(i.y+tt)/.005)));}
  c=1.17-pow(c/3.,1.4);return pow(abs(c),8.);}`)
      .replace("#include <color_fragment>","#include <color_fragment>\n"+(A.col||""))
      .replace("#include <opaque_fragment>",`{vec3 Vw=normalize(cameraPosition-vUW);float dW=max(uWy-vUW.y,0.)/uS,uw=smoothstep(0.,.012,dW);
        outgoingLight+=reflectedLight.directDiffuse*(uwCau(vUW.xz/uS*8.,uT*.7)*1.5-.3)*uw;
        float path=dW+dW/max(Vw.y,.25);outgoingLight*=exp(-path*vec3(1.05,.42,.5));
        float fr=.02+.98*pow(1.-clamp(Vw.y,0.,1.),5.);
        diffuseColor.a*=mix(1.,.9*exp(-dW/max(Vw.y,.2)*${kA})*(1.-fr),uw)*uVis;}
        #include <opaque_fragment>`)};
  m.needsUpdate=true}
/* a per-instance attribute (the app's three namespace has no InstancedBufferAttribute) */
function iba(n,k){const a=new T.BA(new Float32Array(n*k),k);a.isInstancedBufferAttribute=true;a.meshPerAttribute=1;return a}
const GLR=`mat3 rY(float a){float c=cos(a),s=sin(a);return mat3(c,0.,-s,0.,1.,0.,s,0.,c);}
mat3 rZ(float a){float c=cos(a),s=sin(a);return mat3(c,s,0.,-s,c,0.,0.,0.,1.);}
mat3 rX(float a){float c=cos(a),s=sin(a);return mat3(1.,0.,0.,0.,c,s,0.,-s,c);}`;
/* ---------------- soft shadows under the small animals, and the little puffs of sand they kick up ----------------
   BLOB: one instanced draw of soft dark ellipses multiplied into the sand (or the pond bed) under each small animal, drawn before
   the water so a fish's shadow on the bed is seen through it; under water they are lifted to their apparent depth and wobbled
   with the ripples exactly as the animals are. aB: strength, softness (0 hard .. 1 all falloff), shape (0 round, 1 a fish
   tapering to the tail at -z). Filled afresh each frame with blobAdd. */
const BL_N=MOB?48:80;
const BLOB=(()=>{const g=new T.Plane(1,1);g.rotateX(-Math.PI/2);const A=iba(BL_N,3);g.setAttribute("aB",A);
  const m=new T.SM({transparent:true,depthWrite:false,blending:5,blendSrc:200,blendDst:202,blendSrcAlpha:200,blendDstAlpha:201,
    polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4,uniforms:{uWy:UW.uWy,uT:UW.uT,uWob:UW.uWob},
    vertexShader:`attribute vec3 aB;uniform float uWy,uT,uWob;varying vec2 vQ;varying vec3 vB;
      void main(){vQ=position.xz*2.;vB=aB;vec4 p=modelMatrix*instanceMatrix*vec4(position,1.);float d=max(uWy-p.y,0.);p.y+=d*.25;
        p.xz+=uWob*d*vec2(sin(uT*1.9+p.z*31.+p.x*17.),cos(uT*1.5+p.x*29.-p.z*13.));gl_Position=projectionMatrix*viewMatrix*p;}`,
    fragmentShader:`varying vec2 vQ;varying vec3 vB;
      void main(){vec2 q=vQ;if(vB.z>.5)q.x/=mix(1.,.35,smoothstep(.1,-1.,q.y))*mix(1.,.8,smoothstep(.4,1.,q.y));
        float e=length(q),k=vB.x*smoothstep(1.,1.-max(vB.y,.05),e);if(k<.004)discard;gl_FragColor=vec4(vec3(1.-k),1.);}`});
  const im=new T.IM(g,m,BL_N);im.count=0;im.frustumCulled=false;im.renderOrder=1;im.castShadow=im.receiveShadow=false;W.add(im);onDes(im);
  return{im,A,n:0}})();
const _bq=new T.Quat(),_bm=new T.M4(),_bs=new V3(),_bp=new V3();
function blobAdd(x,y,z,yaw,w,l,str,soft,fish){const B=BLOB;if(B.n>=BL_N||str<.01)return;const i=B.n++;
  _bq.setFromAxisAngle(_hUp,yaw);_bm.compose(_bp.set(x,y+.002,z),_bq,_bs.set(w,1,l));B.im.setMatrixAt(i,_bm);B.A.array[i*3]=str;B.A.array[i*3+1]=soft;B.A.array[i*3+2]=fish?1:0}
function blobEnd(){const B=BLOB;B.im.count=B.n;B.im.visible=B.n>0;if(B.n){B.im.instanceMatrix.needsUpdate=true;B.A.needsUpdate=true}B.n=0}
/* the sun's direction in island axes (toward the light), and how strongly it casts: none at night, under cloud or in dust */
const _sl=new V3();
function sunL(){const d=sandU.uLd.value,c=Math.cos(YAW),s=Math.sin(YAW);return _sl.set(d.x*c-d.z*s,d.y,d.x*s+d.z*c)}
const sunCast=()=>(1-st.night)*WX.sunK*(1-.85*WX.rain);
/* SPF: small sand puffs (a crab or gerbil digging or bolting into its hole, a tortoise scraping out its hollow) */
const SPF=softPoints(MOB?70:140,"#dcc39b",.05,false);SPF.o.renderOrder=6;SPF.o.visible=false;W.add(SPF.o);
const SPFP=Array.from({length:SPF.n},()=>({life:9,dur:1,x:0,y:0,z:0,vx:0,vy:0,vz:0}));SPF.k=0;
/* n grains from (x,y,z), thrown toward (dx,dz) at about v m/s and up at vy, each sz across (island metres) */
function spPuff(x,y,z,n,dx,dz,v,vy,sz){for(let j=0;j<n;j++){const i=SPF.k;SPF.k=(i+1)%SPF.n;const q=SPFP[i],a=Math.atan2(dx,dz)+rr(-.9,.9),u=v*rr(.4,1.2);
    Object.assign(q,{x:x+rr(-.01,.01),y:y+.005,gy:y,z:z+rr(-.01,.01),vx:Math.sin(a)*u,vy:vy*rr(.5,1.3),vz:Math.cos(a)*u,life:-rr(0,.08),dur:rr(.5,1.1)});SPF.Z[i]=sz/.065*rr(.7,1.3)}
  SPF.o.visible=true}
function spTick(dt){if(!SPF.o.visible)return;let any=0;
  for(let i=0;i<SPF.n;i++){const q=SPFP[i];if(q.life>=q.dur){SPF.A[i]=0;continue}q.life+=dt;const u=q.life/q.dur,o=i*3;any=1;
    const dr=Math.exp(-4*dt);q.vx=q.vx*dr+WIND.x*st.wn*.5*dt;q.vz=q.vz*dr+WIND.z*st.wn*.5*dt;q.vy=q.vy*dr-.9*dt;
    if(q.life>0){q.x+=q.vx*dt;q.y=Math.max(q.y+q.vy*dt,q.gy);q.z+=q.vz*dt}
    SPF.P[o]=q.x;SPF.P[o+1]=q.y;SPF.P[o+2]=q.z;SPF.A[i]=q.life<0||u>=1?0:.7*ss(0,.06,u)*(1-ss(.3,1,u))*(1-.55*st.night)}
  SPF.g.attributes.position.needsUpdate=SPF.g.attributes.a.needsUpdate=true;SPF.m.uniforms.uH.value=innerHeight;if(!any)SPF.o.visible=false}
/* what frightens the lake animals: a camel at or near the water, the eagle low over it, the rattlesnake on the bank */
const LKT=[];let LKdbg=null;
function lakeThreats(){LKT.length=0;
  for(const a of ANIM.camels){const r=1.5*a.sc;LKT.push({x:a.x+Math.sin(a.yaw)*r,z:a.z+Math.cos(a.yaw)*r,r:2.4,k:"camel"},{x:a.x,z:a.z,r:3,k:"camel"})}
  const e=ANIM.eagle;if(e&&e.pos.y<POND.wy+6)LKT.push({x:e.pos.x,z:e.pos.z,r:e.mode==="perch"?2.5:5,k:"eagle"});
  const s=ANIM.rs;if(s&&s.bd&&s.g.visible)LKT.push({x:s.bd.P[0],z:s.bd.P[1],r:2.2,k:"snake"});
  if(LKdbg&&st.t<LKdbg.until)LKT.push(LKdbg)}
/* ground height at the lake from the pupfish's depth grid (hTop is too dear per animal per frame) */
const lkY=(x,z)=>POND.wy-pfDep(x,z);

/* ---------------- rainbow trout (Oncorhynchus mykiss), real size (26–38 cm). A few cold-water fish keep to the deep middle of the
   pond, cruising slowly together in mid-water. At dawn and dusk one now and then rises to sip at the surface and leaves rings;
   in hail, and when a camel drinks or the eagle comes low, they sink to the bottom. Drawn with Godot's rigged model (trLoad below); this procedural instanced fish is the fallback. ---------------- */
const TT_N=MOB?3:5,TT={list:[],im:null,A:null,sch:{th:rr(0,TAU),dir:1,turn:rr(25,50),k:.2,px:0,pz:0,hd:0},rise:rr(3,9),rises:0,vis:0,U:{uVis:{value:0}}};
function ttGeo(){const P=[],N=[],U=[],I=[];let n=0;
  const hh=u=>u<.3?.115*Math.sqrt(Math.max(0,1-(1-u/.3)**2)):mix(.115,.042,ss(.3,.86,u)),hw=u=>hh(u)*mix(.62,.42,ss(.2,.86,u)),
    yc=u=>-.012*Math.sin(Math.PI*cl(u/.86,0,1)),zz=u=>.42-u,top=u=>yc(u)+hh(u),bot=u=>yc(u)-hh(u);
  const NU=30,NA=16;
  for(let i=0;i<=NU;i++){const u=.004+.856*i/NU,h=hh(u),w=hw(u),e=.004,dh=(hh(u+e)-hh(u-e))/(2*e),dw=(hw(u+e)-hw(u-e))/(2*e),dc=(yc(u+e)-yc(u-e))/(2*e);
    for(let j=0;j<NA;j++){const a=j/NA*TAU,ca=Math.cos(a),sa=Math.sin(a),ta=[-w*sa,h*ca,0],tu=[dw*ca,dc+dh*sa,-1];
      const nx=tu[1]*ta[2]-tu[2]*ta[1],ny=tu[2]*ta[0]-tu[0]*ta[2],nz=tu[0]*ta[1]-tu[1]*ta[0],l=Math.hypot(nx,ny,nz)||1;
      P.push(w*ca,yc(u)+h*sa,zz(u));N.push(nx/l,ny/l,nz/l);U.push(u,sa,0);n++}}
  for(let i=0;i<NU;i++)for(let j=0;j<NA;j++){const a=i*NA+j,b=i*NA+(j+1)%NA,c=a+NA,d=b+NA;I.push(a,c,b,b,c,d)}
  const cap=(ring,u,dir)=>{const c=n;P.push(0,yc(u),zz(u)+dir*.004);N.push(0,0,dir);U.push(u,0,0);n++;
    for(let j=0;j<NA;j++){const a=ring*NA+j,b=ring*NA+(j+1)%NA;dir>0?I.push(c,a,b):I.push(c,b,a)}};
  cap(0,0,1);cap(NU,.86,-1);
  /* fins: thin double-faced sheets */
  const fin=(V,T3,id)=>{const nv=V.length,[A,B,C]=T3[0].map(k=>[V[k][0],V[k][1],zz(V[k][2])]),cb=[C[0]-B[0],C[1]-B[1],C[2]-B[2]],ab=[A[0]-B[0],A[1]-B[1],A[2]-B[2]];
    const x=cb[1]*ab[2]-cb[2]*ab[1],y=cb[2]*ab[0]-cb[0]*ab[2],z=cb[0]*ab[1]-cb[1]*ab[0],l=Math.hypot(x,y,z)||1;
    for(const s of[1,-1]){const o=n;for(const v of V){P.push(v[0],v[1],zz(v[2]));N.push(x/l*s,y/l*s,z/l*s);U.push(v[2],v[3],id);n++}
      for(const t of T3)s>0?I.push(o+t[0],o+t[1],o+t[2]):I.push(o+t[0],o+t[2],o+t[1])}};
  fin([[0,top(.84)-.004,.84,.2],[0,.125,1.,1],[0,0,.95,0],[0,-.125,1.,-1],[0,bot(.84)+.004,.84,-.2]],[[0,1,2],[0,2,4],[4,2,3]],1);
  fin([[0,top(.36)-.005,.36,0],[0,top(.44)+.08,.44,1],[0,top(.52)+.028,.53,.4],[0,top(.5)-.005,.5,0]],[[0,1,2],[0,2,3]],2);
  fin([[0,top(.72)-.004,.72,0],[0,top(.745)+.022,.75,1],[0,top(.77)-.004,.775,0]],[[0,1,2]],2);
  fin([[0,bot(.63)+.005,.63,0],[0,bot(.67)-.052,.68,-1],[0,bot(.73)-.018,.74,-.4],[0,bot(.72)+.005,.72,0]],[[0,2,1],[0,3,2]],3);
  for(const s of[1,-1]){fin([[s*.018,bot(.48)+.012,.47,0],[s*.05,bot(.53)-.03,.58,-1],[s*.018,bot(.53)+.012,.54,0]],[[0,1,2]],3);
    fin([[s*hw(.19)*.85,yc(.19)-hh(.19)*.4,.18,0],[s*.075,yc(.3)-hh(.3)*.75,.33,-1],[s*hw(.23)*.85,yc(.23)-hh(.23)*.5,.23,0]],[[0,1,2]],4)}
  const g=new T.BG();g.setAttribute("position",new T.BA(new Float32Array(P),3));g.setAttribute("normal",new T.BA(new Float32Array(N),3));
  g.setAttribute("aTU",new T.BA(new Float32Array(U),3));g.setIndex(I);return g}
/* body colour from the position along it (u, nose 0 .. fork 1) and round it (v, belly -1 .. back 1): olive back with fine black spots,
   silver flanks under a rose-pink band, white belly; spotted dorsal, adipose and tail fins, white-tipped pelvic and anal fins */
const TT_COL=`{float u=vTU.x,v=vTU.y,id=vTU.z;vec3 tc;
  vec2 sq=vec2(u*32.,v*(id>.5?3.:5.5)),si=floor(sq);float sh=fract(sin(dot(si+id*7.,vec2(12.9898,78.233)))*43758.5453);
  vec2 sf=fract(sq)-.5-(vec2(fract(sh*7.1),fract(sh*3.7))-.5)*.5;float spot=smoothstep(.27,.16,length(sf*vec2(1.,1.3)))*step(.22,sh);
  if(id<.5){float back=smoothstep(-.05,.85,v),belly=smoothstep(-.25,-.8,v);
    tc=mix(vec3(.6,.62,.58),vec3(.1,.13,.07),back);tc=mix(tc,vec3(.045,.06,.035),smoothstep(.7,.97,v));tc=mix(tc,vec3(.86,.86,.82),belly);
    float band=exp(-pow((v-.05)/.2,2.))*smoothstep(.06,.2,u)*smoothstep(.93,.7,u);tc=mix(tc,vec3(.72,.31,.34),band*.7);
    tc=mix(tc,vec3(.68,.3,.32),exp(-pow((u-.19)/.035,2.))*smoothstep(-.6,.1,v)*smoothstep(.8,.3,v)*.55);
    tc=mix(tc,vec3(.03,.035,.025),spot*smoothstep(-.3,.2,v)*smoothstep(.04,.1,u)*.9);
    float ed=length(vec2((u-.068)/.017,(v-.2)/.19));tc=mix(tc,vec3(.72,.6,.3),smoothstep(1.2,1.,ed));tc=mix(tc,vec3(.015),smoothstep(.75,.55,ed));}
  else{tc=id<2.5?vec3(.16,.17,.11):vec3(.3,.31,.22);if(id<2.5)tc=mix(tc,vec3(.02),spot*.9);else{tc=mix(tc,vec3(.75,.4,.38),.25);tc=mix(tc,vec3(.9,.88,.84),smoothstep(.55,.85,abs(v)));}
    diffuseColor.a=.88;}
  diffuseColor.rgb=tc;}`;
/* swimming: a wave runs down the body, small at the head and growing to the tail; turning bends it. The fins ride the same wave. */
const TT_ANIM={head:"attribute vec3 aTU;attribute vec4 aSw;varying vec3 vTU;float ttX(float u){return aSw.y*(.12+.88*pow(smoothstep(.1,1.,u),1.6))*sin(6.2832*u*.95-aSw.x)+aSw.z*(u-.25)*(u-.25)*step(.25,u);}",
  nrm:"float ttU=.42-position.z,ttF=-(ttX(ttU+.01)-ttX(ttU-.01))/.02;objectNormal.z-=ttF*objectNormal.x;objectNormal=normalize(objectNormal);",
  pos:"transformed.x+=ttX(ttU);vTU=aTU;",fh:"varying vec3 vTU;",col:TT_COL};
function ttBuild(){const g=ttGeo(),m=new T.MSM({roughness:.36,metalness:.1});m.userData.U=TT.U;uwMat(m,"tt",".2",TT_ANIM);
  const A=iba(TT_N,4);g.setAttribute("aSw",A);
  const im=new T.IM(g,m,TT_N);im.frustumCulled=false;im.renderOrder=3;W.add(im);onDes(im);TT.im=im;TT.A=A;
  const[cx,cz]=pondEdge(TT.sch.th,TT.sch.k);TT.sch.px=cx;TT.sch.pz=cz;
  for(let i=0;i<TT_N;i++){const a=rr(0,TAU),d=rr(.2,.8),x=cx+Math.cos(a)*d,z=cz+Math.sin(a)*d;
    TT.list.push({L:rr(.26,.38),x,z,y:POND.wy-.45,yaw:rr(-3,3),pit:0,v:.12,yr:0,ph:rr(0,TAU),amp:.06,bend:0,off:{a:rr(0,TAU),d:rr(.25,.85),h:rr(-.12,.12)},mode:"cruise",t:0,r2:-1,rx:0,rz:0})}}
ttBuild();
const _tq=new T.Quat(),_tq2=new T.Quat(),_tm=new T.M4(),_ts=new V3();
/* the rotation of Euler angles in YXZ order (heading, then pitch, then roll) */
function qYXZ(q,x,y,z){const c1=Math.cos(x/2),c2=Math.cos(y/2),c3=Math.cos(z/2),s1=Math.sin(x/2),s2=Math.sin(y/2),s3=Math.sin(z/2);
  return q.set(s1*c2*c3+c1*s2*s3,c1*s2*c3-s1*c2*s3,c1*c2*s3-s1*s2*c3,c1*c2*c3+s1*s2*s3)}
function ttUpdate(dt){const L=TT.list,S0=TT.sch,ny=st.night>.5,hail=WX.hcold>0||WX.hf>.05,dusk=st.phase==="sunrise"||st.phase==="sunset";
  S0.turn-=dt;if(S0.turn<0){S0.turn=rr(25,50);S0.dir*=-1}
  S0.th=wrapA(S0.th+S0.dir*dt*(ny?.025:.06));S0.k=.17+.07*Math.sin(st.t*.013);
  const[cx,cz]=pondEdge(S0.th,S0.k);if(Math.hypot(cx-S0.px,cz-S0.pz)>1e-4)S0.hd=Math.atan2(cx-S0.px,cz-S0.pz);S0.px=cx;S0.pz=cz;
  /* a rise: at dawn and dusk now and then one fish leaves the school, sips at the surface and goes back down */
  TT.rise-=dt;if(!dusk||hail||WX.rain>.5)TT.rise=Math.max(TT.rise,rr(3,9));
  else if(TT.rise<0){TT.rise=rr(9,26);const f=L[(rnd()*L.length)|0];if(f.mode==="cruise"){f.mode="rise";f.t=6;f.rs=0;dec("dDp1")}}
  for(const f of L){const dep=pfDep(f.x,f.z),bed=POND.wy-dep;let tx,tz,ty,vt,tr=.9;
    let near=null,nd=1e9;for(const h of LKT){const d=Math.hypot(f.x-h.x,f.z-h.z)-h.r;if(d<nd){nd=d;near=h}}
    const scared=nd<2.5;if(scared&&!f.scd)f.dartT=.5;f.scd=scared;
    if(f.mode==="rise"){f.t-=dt;tx=f.x+Math.sin(f.yaw)*.6;tz=f.z+Math.cos(f.yaw)*.6;
      if(!f.rs){ty=POND.wy-.05;vt=.24;
        const hn=TT.glb?.5:.42,hy=f.y-Math.sin(f.pit)*hn*f.L;
        if(hy>POND.wy-.035||f.t<0){f.rs=1;f.t=2.5;const hx=f.x+Math.sin(f.yaw)*hn*f.L,hz=f.z+Math.cos(f.yaw)*hn*f.L;TT.rises++;
          hDecal(1,hx,POND.wy+.004,hz,rr(.32,.42));f.r2=.28;f.rx=hx;f.rz=hz;
          for(let k=0;k<4;k++)hBit("drop",hx,POND.wy+.01,hz,rr(-.35,.35),rr(.5,1),rr(-.35,.35),rr(.4,.7));
          _ts.set(hx,POND.wy,hz);shotS("dDp1",.5,_ts,6,rr(.5,.62),1)}}
      else{ty=bed+Math.min(.6,dep*.45);vt=.18;if(f.t<0)f.mode="cruise"}
      if(scared||hail)f.mode="cruise"}
    if(f.mode==="cruise"){const a=S0.hd+f.off.a;tx=cx+Math.sin(a)*f.off.d;tz=cz+Math.cos(a)*f.off.d;
      ty=hail||scared?bed+.14:ny?bed+.22:POND.wy-cl(dep*.32,.28,.55)+f.off.h;
      vt=hail?.06:ny?.05:cl(Math.hypot(tx-f.x,tz-f.z)*.45,.07,.26);
      if(scared){const d=Math.hypot(f.x-near.x,f.z-near.z)||1;tx=f.x+(f.x-near.x)/d*1.2;tz=f.z+(f.z-near.z)/d*1.2;vt=.34;tr=2}}
    /* keep clear of the next fish */
    for(const o of L){if(o===f)continue;const d=Math.hypot(o.x-f.x,o.z-f.z);if(d<.4){tx+=(f.x-o.x)/(d||1)*.4;tz+=(f.z-o.z)/(d||1)*.4}}
    /* stay over the deep water */
    if(pfDep(tx,tz)<.85){tx+=(-8.7-tx)*.5;tz+=(5.9-tz)*.5}
    const want=Math.atan2(tx-f.x,tz-f.z),dy=wrapA(want-f.yaw),yr=cl(dy*1.5,-tr,tr);f.yr+=(yr-f.yr)*ease(3,dt);f.yaw=wrapA(f.yaw+f.yr*dt);
    f.v+=(vt-f.v)*ease(vt>f.v?2:1,dt);
    let nx=f.x+Math.sin(f.yaw)*f.v*dt,nz=f.z+Math.cos(f.yaw)*f.v*dt;if(pfDep(nx,nz)<.7){nx=f.x;nz=f.z;f.v*=.6}f.x=nx;f.z=nz;
    const vy=cl((ty-f.y)*.8,-.16,f.mode==="rise"&&!f.rs?.3:.12),lo=POND.wy-pfDep(f.x,f.z)+.07;f.y=Math.max(lo,Math.min(f.y+vy*dt,POND.wy-.05));
    f.pit+=(cl(-Math.atan2(vy,Math.max(f.v,.05)),-.6,.6)-f.pit)*ease(3,dt);
    f.bend=cl(-f.yr*.1,-.07,.07);f.amp=.075+.09*cl(f.v/.4,0,1)+.03*Math.abs(f.yr);f.ph+=TAU*(1.3+2.4*f.v/f.L)*dt;
    if(f.r2>0){f.r2-=dt;if(f.r2<=0)hDecal(1,f.rx,POND.wy+.004,f.rz,rr(.6,.8))}}
  if(TT.glb&&!TT.hi&&L[0].g.visible)for(const f of L)f.g.visible=false;
  if(TT.hi){for(const f of L){f.g.visible=TT.vis>0;f.dartT=(f.dartT||0)-dt;if(!f.g.visible)continue;
      f.g.position.set(f.x,f.y,f.z);f.g.rotation.set(f.pit,f.yaw,cl(f.yr*.12,-.3,.3));
      if(f.dartT>0)play(f.r,"dart",.08,1);else if(f.v<.075)play(f.r,"idle_hover",.5,cl(.6+f.v*6,.6,1.1));
      else play(f.r,"swim",.4,cl((1.3+2.4*f.v/f.L)*.7,.5,3));
      rigTick(f.r,dt);for(const s of f.sp)pgTurn(s.b,s.ax,-f.bend*.6)}}
  else if(TT.vis>0){const A=TT.A.array;L.forEach((f,i)=>{qYXZ(_tq,f.pit,f.yaw,cl(f.yr*.12,-.3,.3));
    _tm.compose(_ts.set(f.x,f.y,f.z),_tq,_v.set(f.L,f.L,f.L));TT.im.setMatrixAt(i,_tm);A[i*4]=f.ph;A[i*4+1]=f.amp;A[i*4+2]=f.bend});
    TT.im.instanceMatrix.needsUpdate=true;TT.A.needsUpdate=true}
  if(TT.vis>0){
    /* each fish's shadow on the bed: cast along the sun bent down by the surface (sin in = 1.33 sin out), wider and fainter the
       higher the fish swims over the bottom */
    const sc=sunCast()*TT.vis;if(sc>.02){const L_=sunL(),h=Math.hypot(L_.x,L_.z)||1e-3,sw=Math.min(h,.999)/1.33,tw=sw/Math.sqrt(1-sw*sw);
      for(const f of L){const bed=lkY(f.x,f.z),hb=Math.max(f.y-bed,0),o=hb*tw,bx=f.x-L_.x/h*o,bz=f.z-L_.z/h*o;
        blobAdd(bx,lkY(bx,bz),bz,f.yaw,.2*f.L+.1*hb,1.05*f.L+.1*hb,sc*.8*Math.exp(-hb*.55),.5+.35*ss(0,.8,hb),1)}}}}
/* Godot's rigged trout (trout_v3; 17 bones; swim, idle_hover, dart), 0.398 m long and scaled to each fish. Once it has loaded every fish is a
   skinned clone under the same underwater shading, used once a fish is over ~20 px long; smaller than that the instanced fish above
   stands in (one draw, no rigs to update). Turns bend the spine on top of the clip */
const TR_FILE="trout_v3",TR_LEN=.398,TRM=new Map();
function trMats(s){matsOf(s,(m,c)=>{c.castShadow=false;c.receiveShadow=true;c.renderOrder=3;c.frustumCulled=false;let n=TRM.get(m.uuid);
  if(!n){const fin=m.transparent;n=m.clone();TRM.set(m.uuid,n);if(n.map)n.map.anisotropy=MOB?2:4;if(n.emissive)n.emissive.setRGB(0,0,0);
    n.metalness=0;n.metalnessMap=null;n.aoMapIntensity=.5;
    n.userData.U=TT.U;uwMat(n,"tg"+(fin?"f":""),fin?".35":".2",{head:"",nrm:"",pos:""});if(fin)n.depthWrite=false}
  c.material=n})}
function trLoad(){return glb(TR_FILE).then(src=>{const up=new V3(),q=new T.Quat();
  for(const f of TT.list){const s=VT.cloneSkinned(src.scene),g=new T.Group();g.rotation.order="YXZ";g.add(s);g.scale.setScalar(f.L/TR_LEN);W.add(g);onDes(g);trMats(s);
    f.g=g;f.r=rigUp(s,src.animations);const d=f.r.acts.dart;if(d){d.setLoop(VT.THREE.LoopOnce,1);d.clampWhenFinished=true}
    play(f.r,"swim",.01,1);if(f.r.acts.swim)f.r.acts.swim.time=f.ph/TAU*.7;
    g.updateMatrixWorld(true);f.sp=[];s.traverse(b=>{if(b.isBone&&/^spine0[1-6]$/.test(b.name)){b.getWorldQuaternion(q).invert();
      g.getWorldQuaternion(_tq2);f.sp.push({b,ax:up.set(0,1,0).applyQuaternion(_tq2).applyQuaternion(q).normalize().clone()})}});g.visible=false}
  TT.glb=1})}

/* ---------------- freshwater crabs (Potamon potamios): a carapace about 5 cm across, legs spanning about 12 cm, mud olive-brown.
   Each has a burrow in the damp bank just above the waterline. They pick over the wet margin and the shallows round it,
   walking sideways in short runs and feeding claw to mouth in the pauses. A camel coming to the water, the rattlesnake on the
   bank or the eagle low over it sends them scuttling, claws up, down the nearest burrow or into deeper water; rain, hail and
   snow send them home. Drawn with Godot's rigged crab_v6b (crLoad below, life size); this procedural instanced crab, one draw with
   the legs and claws moved in the vertex shader, is the fallback. The burrows are the same for both. ---------------- */
const CR_N=MOB?5:8,CR_K=1.6,CR={list:[],im:null,A:null,bm:null,vis:0,U:{uVis:{value:0}}};
function crGeo(){const P=[],N=[],C=[],K=[],H=[],I=[];let n=0;
  /* gapK 12/13 marks the movable finger. It hinges at gapJ on top of the same claw swing as the palm. */
  const J=[];let gapK=0,gapJ=null;
  const vtx=(p,nr,c,k,h)=>{P.push(p[0],p[1],p[2]);N.push(nr[0],nr[1],nr[2]);C.push(c[0],c[1],c[2]);K.push(gapK||k);H.push(h[0],h[1],h[2]);const j=gapJ||h;J.push(j[0],j[1],j[2]);return n++};
  const ell=(cx,cy,cz,rx,ry,rz,c,k,h,nu,nv,sh)=>{const b=n;for(let i=0;i<=nv;i++){const t=i/nv*Math.PI;for(let j=0;j<=nu;j++){const p=j/nu*TAU;
        let x=Math.sin(t)*Math.cos(p),y=Math.cos(t),z=Math.sin(t)*Math.sin(p);const q=sh?sh(x,y,z):[x,y,z,1];
        const ry2=q[1]>0?ry:ry*(sh?.55:1);vtx([cx+q[0]*rx,cy+q[1]*ry2,cz+q[2]*rz],(()=>{const a=q[0]/rx,bb=q[1]/ry2,d=q[2]/rz,l=Math.hypot(a,bb,d)||1;return[a/l,bb/l,d/l]})(),
          [c[0]*q[3],c[1]*q[3],c[2]*q[3]],k,h)}}
    for(let i=0;i<nv;i++)for(let j=0;j<nu;j++){const a=b+i*(nu+1)+j,d=a+nu+1;I.push(a,a+1,d,a+1,d+1,d)}};
  /* fl < 1 flattens the section across (the horizontal axis), keeping its depth */
  const tube=(pts,rad,cols,k,h,sd,fl=1)=>{const b=n,M=pts.length;
    for(let i=0;i<M;i++){const p=pts[i],q=pts[Math.min(i+1,M-1)],o=pts[Math.max(i-1,0)];let d=[q[0]-o[0],q[1]-o[1],q[2]-o[2]];const l=Math.hypot(...d)||1;d=d.map(v=>v/l);
      let u=Math.abs(d[1])<.9?[0,1,0]:[1,0,0];let a=[d[1]*u[2]-d[2]*u[1],d[2]*u[0]-d[0]*u[2],d[0]*u[1]-d[1]*u[0]];const la=Math.hypot(...a);a=a.map(v=>v/la);
      const bb=[d[1]*a[2]-d[2]*a[1],d[2]*a[0]-d[0]*a[2],d[0]*a[1]-d[1]*a[0]];
      for(let j=0;j<sd;j++){const an=j/sd*TAU,ca=Math.cos(an),sa=Math.sin(an),o=[a[0]*ca*fl+bb[0]*sa,a[1]*ca*fl+bb[1]*sa,a[2]*ca*fl+bb[2]*sa];
        let nr=[a[0]*ca/fl+bb[0]*sa,a[1]*ca/fl+bb[1]*sa,a[2]*ca/fl+bb[2]*sa];const ln=Math.hypot(...nr);nr=nr.map(v=>v/ln);
        vtx([p[0]+o[0]*rad[i],p[1]+o[1]*rad[i],p[2]+o[2]*rad[i]],nr,cols[i],k,h)}}
    for(let i=0;i<M-1;i++)for(let j=0;j<sd;j++){const a=b+i*sd+j,c=b+i*sd+(j+1)%sd;I.push(a,a+sd,c,c,a+sd,c+sd)}};
  const shell=[.34,.13,.05],shellD=[.18,.07,.03],leg=[.5,.2,.08],legD=[.32,.12,.05],tip=[.09,.05,.03],cream=[.86,.74,.56],claw=[.84,.22,.06];
  /* carapace: broad, a little squared at the front, domed over the gills, flatter underneath */
  ell(0,.029,0,.025,.0135,.021,shell,0,[0,0,0],22,12,(x,y,z)=>{const zf=z>0?z*(1-.18*Math.abs(x)):z,xf=x*(1-.08*Math.max(0,z));
    const dark=1-.28*Math.max(0,y)*(1-Math.abs(x))+.08*Math.max(0,-y);return[xf,y-.12*Math.abs(xf)*Math.max(0,y),zf,dark]});
  /* front ridge between the eyes and the mouth */
  ell(0,.028,.017,.01,.004,.004,shellD,0,[0,0,0],8,5);
  /* four walking legs a side, three segments each, the last a pointed dactyl */
  for(const s of[1,-1])for(let i=0;i<4;i++){const k=(s>0?1:5)+i,a=[.5,.15,-.22,-.6][i],dx=s*Math.cos(a),dz=Math.sin(a),h=[s*.021,.026,.007-i*.0085],
      m=1+.08*(i===1||i===2),P1=[h[0]+dx*.016*m,h[1]+.01,h[2]+dz*.016*m],P2=[P1[0]+dx*.0135*m,P1[1]-.009,P1[2]+dz*.0135*m],P3=[P2[0]+dx*.007*m,.0012,P2[2]+dz*.007*m];
    tube([h,P1,P2,P3],[.0042,.0039,.003,.0008],[leg,leg,legD,tip],k,h,7)}
  /* chela: merus, a ball-like carpus, a laterally flattened palm, and two fingers held out in front of it. The fixed finger
     (pollex) runs on from the lower front of the palm; the movable finger (dactyl) hinges at the upper front corner and lies
     over it. Each carries a row of cream teeth on its biting edge, set at the finger's own surface and staggered against the
     other row, so the closed claw shows the two rows meshing along one bite line with the pale tips crossed.
     The negative-s claw is the larger one. Tubercles and teeth are big enough to read from about a metre. */
  /* a point and the tube radius a fraction u of the way along a polyline */
  const along=(pts,rad,u)=>{let L=0;const ls=[];for(let i=0;i<pts.length-1;i++){const l=Math.hypot(pts[i+1][0]-pts[i][0],pts[i+1][1]-pts[i][1],pts[i+1][2]-pts[i][2]);ls.push(l);L+=l}
    let d=u*L,i=0;while(i<ls.length-1&&d>ls[i]){d-=ls[i];i++}const f=Math.min(1,d/ls[i]),a=pts[i],b=pts[i+1];
    return{p:[a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f,a[2]+(b[2]-a[2])*f],r:rad[i]+(rad[i+1]-rad[i])*f}};
  for(const s of[1,-1]){const k=s>0?9:10,c=s>0?1.28:1.72,h=[s*.016,.026,.015],palmC=[.8,.2,.05],toothC=[.92,.84,.68],toothD=[.62,.5,.36];
    const arm=[h[0]+s*.011,.024,.026],wr=[arm[0]+s*.002,.022,.035];
    tube([h,arm,wr],[.0035*c,.0032*c,.0038*c],[leg,leg,shell],k,h,7);
    ell(wr[0],wr[1],wr[2],.0048*c,.0039*c,.0046*c,shellD,k,h,8,6);
    const palm=[wr[0]-s*.001,wr[1]-.001,wr[2]+.0105*c];
    ell(palm[0],palm[1],palm[2],.0074*c,.0082*c,.0128*c,palmC,k,h,14,9,(x,y,z)=>{
      const bump=1+.06*Math.sin(x*8.5)*Math.sin(z*6.5);
      return[x*bump,y*(.86+.08*z),z,.74+.3*Math.abs(Math.sin(x*13.+z*9.))+.16*y]});
    /* both fingers are laid on one bite line (y -.00075 in claw units) and press into each other along their whole length when
       closed, deep enough that the curved (and, on this glossy shell, dark-reflecting) rims of both are buried in the seam; their
       tips cross side by side. Like the palm they are flattened side to side. */
    const at=(y,z,dx)=>[palm[0]-s*dx*c,palm[1]+y*c,palm[2]+z*c],fingC=[.74,.19,.05],FL=.72;
    /* the fixed finger: from the palm's lower front, straight out, its tip hooking up a little; its root closed under the palm */
    const F=[at(-.0034,.0078,0),at(-.0027,.017,.0008),at(-.0017,.024,.0015),at(-.0005,.0293,.0019)],FR=[.0034*c,.0027*c,.0018*c,.0007*c];
    {const r=at(-.0031,.0098,.0003);ell(r[0],r[1],r[2],.0033*FL*c,.0028*c,.0062*c,palmC,k,h,10,7)}
    tube(F,FR,[palmC,palmC,fingC,cream],k,h,10,FL);
    /* the hinge knuckle sits on the palm's front upper surface, outside it: the dactyl turns in it like a ball in a socket and
       no part of the finger passes into the palm at any gape */
    const jn=at(.0034,.0112,0);
    ell(jn[0],jn[1],jn[2],.003*c,.0029*c,.003*c,[.5,.14,.04],k,h,10,7);
    /* the dactyl, closed: from the knuckle down onto the bite line, its tip hooking just past the fixed tip */
    const D=[jn,at(.0012,.0175,.0008),at(.0006,.024,.0015),at(-.0009,.0298,.0023)],DR=[.0027*c,.0023*c,.0016*c,.0006*c];
    /* teeth: pointed, alternating along the bite line, the fixed finger's pointing up and the dactyl's down, each crossing the
       line by about two thirds of its height and as wide as the finger, so a closed claw shows them interlocked like a zip */
    const tooth=(zz,up)=>{const u=cl((zz-.0112)/.0186,0,1),p=at(up?-.0011:-.0004,zz,.0023*u),f=up?1:-1;
      ell(p[0],p[1],p[2],(.0019-.0006*u)*c,.00095*c,.00085*c,up?toothC:toothD,k,h,6,5,(x,y,z)=>{const t=y*f,w=t>0?1-.82*t:1;return[x*w,f>0?y:(y<0?y/.55:y),z*w,1]})};
    /* the dactyl and its teeth hinge at the joint; the fixed finger stays with the palm */
    gapK=s>0?12:13;gapJ=jn;
    tube(D,DR,[palmC,palmC,fingC,cream],k,h,10,FL);
    for(let t=1;t<6;t+=2)tooth(.014+t*.0026,false);
    gapK=0;gapJ=null;
    for(let t=0;t<6;t+=2)tooth(.014+t*.0026,true);
    for(let t=0;t<6;t++){const a=t*1.15;ell(palm[0]+Math.cos(a)*.0036*c*s,palm[1]+.0062*c,palm[2]+(t-2.5)*.0034*c,.0011*c,.0008*c,.0011*c,[.58,.15,.04],k,h,5,4)}}
  /* eyes on short stalks */
  for(const s of[1,-1]){tube([[s*.0065,.031,.019],[s*.008,.036,.0215]],[.0014,.0013],[shell,shell],11,[0,0,0],5);ell(s*.0082,.0372,.022,.0026,.0026,.0026,[.03,.03,.025],11,[0,0,0],7,5)}
  const g=new T.BG();g.setAttribute("position",new T.BA(new Float32Array(P),3));g.setAttribute("normal",new T.BA(new Float32Array(N),3));
  g.setAttribute("color",new T.BA(new Float32Array(C),3));g.setAttribute("aK",new T.BA(new Float32Array(K),1));g.setAttribute("aH",new T.BA(new Float32Array(H),3));
  g.setAttribute("aJ",new T.BA(new Float32Array(J),3));g.setIndex(I);return g}
/* legs: alternating tetrapod gait (L1 R2 L3 R4 against the rest), each lifting and swinging at its hip; claws: raised in a threat,
   drawn in to the mouth in turn while feeding */
/* aOpen 0 is the authored bite (movable finger on the fixed finger). 1 lifts the finger clear.
   The palm and the fixed finger keep the old claw swing. */
const CR_ANIM={head:"attribute float aK;attribute float aOpen;attribute vec3 aH;attribute vec3 aJ;attribute vec4 aG;"+GLR+`
mat3 crBase(float k){if(k<.5||k>10.5)return mat3(1.);
  if(k<8.5){float i=k-1.,sd=i<3.5?1.:-1.,j=mod(i,4.),g=mod(j+step(sd,0.),2.),ph=aG.x+g*3.14159;
    return rY(.3*cos(ph)*aG.y*sd)*rZ(sd*.5*max(0.,sin(ph))*aG.y);}
  float sd=k<9.5?1.:-1.,fd=k<9.5?max(aG.z,0.):max(-aG.z,0.);return rZ(sd*.7*aG.w)*rY(-sd*(.5*fd-.45*aG.w))*rX(-1.5*aG.w-.4*fd);}
float crAng(){return mix(0.,-.85,clamp(aOpen,0.,1.));}`,
  nrm:"mat3 crNL=crBase(aK>11.5?aK-3.:aK);mat3 crNH=aK>11.5?rX(crAng()):mat3(1.);objectNormal=crNL*crNH*objectNormal;",
  pos:"mat3 crPL=crBase(aK>11.5?aK-3.:aK);vec3 crP=transformed;if(aK>11.5)crP=aJ+rX(crAng())*(crP-aJ);transformed=aH+crPL*(crP-aH);"};
/* the burrow: a dark hole in a low collar of damp sand, the dug-out pellets heaped to one side */
function crBurrowGeo(){const P=[],N=[],C=[],I=[];let n=0;const sand=[.3,.19,.095],dark=[.012,.009,.006];
  const R=[0,.012,.02,.026,.036,.046],Y=[-.006,-.004,.001,.005,.002,0],CC=[dark,dark,[.12,.075,.04],[.25,.16,.08],sand,[.33,.21,.105]];
  for(let i=0;i<R.length;i++)for(let j=0;j<16;j++){const a=j/16*TAU;P.push(Math.cos(a)*R[i],Y[i],Math.sin(a)*R[i]);N.push(0,1,0);C.push(...CC[i]);n++}
  for(let i=0;i<R.length-1;i++)for(let j=0;j<16;j++){const a=i*16+j,b=i*16+(j+1)%16;I.push(a,b,a+16,b,b+16,a+16)}
  for(let p=0;p<9;p++){const a=rr(-.9,.9),d=rr(.04,.075),cx=Math.cos(a)*d,cz=Math.sin(a)*d,r=rr(.004,.007),b=n;
    for(let i=0;i<=4;i++)for(let j=0;j<=6;j++){const t=i/4*Math.PI*.5,ph=j/6*TAU,x=Math.cos(t)*Math.cos(ph),y=Math.sin(t),z=Math.cos(t)*Math.sin(ph);
      P.push(cx+x*r,y*r*.8,cz+z*r);N.push(x,y,z);C.push(sand[0]*.7,sand[1]*.7,sand[2]*.7);n++}
    for(let i=0;i<4;i++)for(let j=0;j<6;j++){const a=b+i*7+j;I.push(a,a+7,a+1,a+1,a+7,a+8)}}
  const g=new T.BG();g.setAttribute("position",new T.BA(new Float32Array(P),3));g.setAttribute("normal",new T.BA(new Float32Array(N),3));
  g.setAttribute("color",new T.BA(new Float32Array(C),3));g.setIndex(I);return g}
/* a burrow site: damp bank 2–8 cm above the water, not too steep */
function crSite(th){for(let k=.8;k<1.2;k+=.005){const[x,z]=pondEdge(th,k),d=pfDep(x,z);if(d<-.025&&d>-.08){const s=Math.abs(pfDep(x+.15,z)-pfDep(x-.15,z))+Math.abs(pfDep(x,z+.15)-pfDep(x,z-.15));if(s<.2)return[x,z]}}return null}
function crBuild(){const g=crGeo(),m=new T.MSM({vertexColors:true,roughness:.2,metalness:0});m.userData.U=CR.U;uwMat(m,"cr",".9",CR_ANIM);
  const A=iba(CR_N,4),OA=iba(CR_N,1);g.setAttribute("aG",A);g.setAttribute("aOpen",OA);CR.OA=OA;
  const im=new T.IM(g,m,CR_N);im.frustumCulled=false;im.renderOrder=3;W.add(im);onDes(im);CR.im=im;CR.A=A;
  const bm=new T.IM(crBurrowGeo(),new T.MSM({vertexColors:true,roughness:.95,metalness:0,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2}),CR_N);
  bm.frustumCulled=false;bm.receiveShadow=true;W.add(bm);onDes(bm);CR.bm=bm;
  let th=rr(0,TAU);for(let i=0;i<CR_N;i++){let s=null;for(let t=0;t<40&&!s;t++){th+=TAU/CR_N*rr(.6,1.1);s=crSite(th);
      if(s&&CR.list.some(c=>Math.hypot(c.bx-s[0],c.bz-s[1])<1.6))s=null}
    if(!s)continue;const[bx,bz]=s,y=lkY(bx,bz),yaw=Math.atan2(POND.x-bx,POND.z-bz);
    _tq.setFromUnitVectors(_hUp,nTop(bx,bz)).multiply(_tq2.setFromAxisAngle(_hUp,-yaw+rr(-.5,.5)));_tm.compose(_ts.set(bx,y+.002,bz),_tq,_v.set(CR_K,CR_K,CR_K));bm.setMatrixAt(CR.list.length,_tm);
    CR.list.push({bx,bz,x:bx,z:bz,y,yaw,mode:"in",t:rr(1,12),tx:bx,tz:bz,v:0,ph:0,walk:0,fph:rr(0,6),feed:0,up:0,gape:.2,gapT:rr(0,4),sk:1,s:rr(.85,1.15),go:null})}
  bm.count=CR.list.length;im.count=CR.list.length;bm.instanceMatrix.needsUpdate=true;
  /* the bank round each burrow is kept clear of grass and reeds, with a short lane up the bank behind it, so a crab out at its
     door is never lost in the tufts when seen from the land */
  {const M=new T.M4(),Z=new T.M4().makeScale(0,0,0),e=M.elements;for(const im of VEG){let ch=0;for(let i=0;i<im.count;i++){im.getMatrixAt(i,M);
    if(CR.list.some(c=>crClear(c,e[12],e[14]))){im.setMatrixAt(i,Z);ch=1}}if(ch)im.instanceMatrix.needsUpdate=true}}}
function crClear(c,x,z){const dx=x-c.bx,dz=z-c.bz,d=Math.hypot(dx,dz);if(d<.6)return true;if(d>1.6)return false;
  const ox=c.bx-POND.x,oz=c.bz-POND.z,ol=Math.hypot(ox,oz)||1;return(dx*ox+dz*oz)/(d*ol)>Math.cos(.45)}
crBuild();
/* somewhere to forage: the wet margin and the first few centimetres of water within a metre or so of home */
function crForage(c){for(let t=0;t<14;t++){const a=rr(0,TAU),d=rr(.15,1.2),x=c.bx+Math.cos(a)*d,z=c.bz+Math.sin(a)*d,dp=pfDep(x,z);if(dp>-.09&&dp<.045)return[x,z]}return[c.bx,c.bz]}
/* the way into the water: straight for the pond centre until it is 8–15 cm deep */
function crWater(c){const d=Math.hypot(POND.x-c.x,POND.z-c.z)||1,ux=(POND.x-c.x)/d,uz=(POND.z-c.z)/d;
  for(let s=.1;s<3;s+=.05){const x=c.x+ux*s,z=c.z+uz*s;if(pfDep(x,z)>.1)return[x+ux*.15,z+uz*.15]}return[POND.x,POND.z]}
function crGo(c,x,z,v,mode,go){c.tx=x;c.tz=z;c.vt=v;c.mode=mode;c.go=go}
function crUpdate(dt){const foul=WX.rain>.12||WX.hf>.02||WX.hcold>0||WX.sf>.02||WX.scold>0;
  for(const c of CR.list){
    let near=null,nd=1e9;for(const h of LKT){const d=Math.hypot(c.x-h.x,c.z-h.z)-h.r;if(d<nd){nd=d;near=h}}
    /* a viewer leaning in close: within about a metre it stops, turns its front to the lens and holds its claws up; much
       closer and it runs like from anything else */
    const dcx=_cl.x-c.x,dcz=_cl.z-c.z,dcm=Math.hypot(dcx,dcz),cam=!CR.calm&&_cl.y-c.y<1.2&&c.mode!=="in"&&c.mode!=="down";
    if(CR.calm)nd=99;
    if(cam&&dcm<.4&&nd>.4){nd=.4;near={x:_cl.x,z:_cl.z,r:0}}
    const fear=nd<1.2;c.up+=((c.mode==="run"?1:c.mode==="face"?1:fear&&c.mode!=="in"?.6:0)-c.up)*ease(6,dt);
    if(!fear&&cam&&dcm<1.05&&(c.mode==="out"||c.mode==="walk"||c.mode==="dig")){c.mode="face";c.v=0;c.t=rr(2,4)}
    if(c.mode==="face"){c.yaw=wrapA(c.yaw+cl(wrapA(Math.atan2(dcx,dcz)-c.yaw),-4*dt,4*dt));c.t-=dt;if(!cam||dcm>1.3||c.t<0&&dcm>1.05){c.mode="out";c.t=rr(.5,2)}}
    if(fear&&(c.mode==="out"||c.mode==="walk"||c.mode==="emerge"||c.mode==="face"||c.mode==="dig")){
      const db=Math.hypot(c.bx-c.x,c.bz-c.z),bt=Math.hypot(c.bx-near.x,c.bz-near.z)>Math.hypot(c.x-near.x,c.z-near.z)-.3,[wx,wz]=crWater(c),dw=Math.hypot(wx-c.x,wz-c.z);
      if(c.mode==="emerge"||db<.25||(bt&&db<dw*1.4))crGo(c,c.bx,c.bz,.42,"run","home");else crGo(c,wx,wz,.42,"run","water")}
    else if(foul&&(c.mode==="out"||c.mode==="walk"||c.mode==="dig"))crGo(c,c.bx,c.bz,.2,"walk","home");
    const ox=c.bx-POND.x,oz=c.bz-POND.z;
    if(c.mode==="in"){c.sk=1;c.t-=dt;if(c.t<0&&!foul&&nd>2){c.mode="emerge";c.yaw=Math.atan2(POND.x-c.bx,POND.z-c.bz)+rr(-1,1);spPuff(c.bx,c.y,c.bz,3,ox,oz,.15,.25,.025)}else if(c.t<0)c.t=rr(2,5)}
    else if(c.mode==="emerge"){c.sk-=dt/1.4;if(c.sk<=0){c.sk=0;c.mode="out";c.t=rr(1.5,4)}}
    else if(c.mode==="down"){c.sk+=dt/.55;if(c.sk>=1){c.mode="in";c.t=rr(10,25)}}
    else if(c.mode==="sub"){c.t-=dt;if(c.t<0&&nd>2.5&&!foul){const[x,z]=crForage(c);crGo(c,x,z,.09,"walk",null)}else if(c.t<0)c.t=rr(4,8)}
    /* keeping the burrow open: at its mouth, facing out, it scoops wet sand up in its claws and flicks it away in little puffs */
    else if(c.mode==="dig"){c.t-=dt;c.pT=(c.pT||0)-dt;if(c.pT<0){c.pT=rr(.35,.7);const fx=Math.sin(c.yaw),fz=Math.cos(c.yaw);
        spPuff(c.x+fx*.04*c.s,c.y+.01,c.z+fz*.04*c.s,2+(rnd()*3|0),fx+rr(-.5,.5),fz+rr(-.5,.5),.3,.35,.022)}
      if(c.t<0){c.mode="out";c.t=rr(1,3)}}
    else if(c.mode==="out"){c.t-=dt;if(c.t<0){if(Math.hypot(c.x-c.bx,c.z-c.bz)<.3&&rnd()<.3){c.mode="dig";c.t=rr(2.5,4.5);c.yaw=Math.atan2(ox,oz)+rr(-.6,.6)}
      else{const[x,z]=crForage(c);crGo(c,x,z,rr(.06,.14),"walk",null)}}}
    if(c.mode==="walk"||c.mode==="run"){const dx=c.tx-c.x,dz=c.tz-c.z,d=Math.hypot(dx,dz);
      if(d<.02){c.v=0;if(c.go==="home"){c.x=c.bx;c.z=c.bz;c.mode="down";spPuff(c.bx,c.y,c.bz,5,c.bx-POND.x,c.bz-POND.z,.3,.35,.03)}else if(c.go==="water"){c.mode="sub";c.t=rr(12,30)}else{c.mode="out";c.t=rr(1,5)}}
      else{const dir=Math.atan2(dx,dz),y1=dir-Math.PI/2,y2=dir+Math.PI/2,ty=Math.abs(wrapA(y1-c.yaw))<Math.abs(wrapA(y2-c.yaw))?y1:y2,dy=wrapA(ty-c.yaw);
        c.yaw=wrapA(c.yaw+cl(dy,-6*dt,6*dt));const vt=Math.abs(dy)<.5?c.vt:0;c.v+=(vt-c.v)*ease(c.mode==="run"?14:7,dt);
        const st_=Math.min(c.v*dt,d);c.x+=dx/d*st_;c.z+=dz/d*st_}}
    else c.v+=(0-c.v)*ease(10,dt);
    c.ph+=c.v*dt/(.032*CR_K)*TAU;c.walk+=((c.v>.01?1:0)-c.walk)*ease(10,dt);
    const feeding=c.mode==="out"||c.mode==="sub"||c.mode==="dig";c.fph+=dt*(feeding?c.mode==="dig"?7:4.2:0);c.feed+=((feeding?1:0)-c.feed)*ease(3,dt);
    /* both chelae open and close together, slowly enough to read. A threat holds them open. CR.gapePin freezes the proof. */
    c.gapT+=dt;const gWant=CR.gapePin!=null?CR.gapePin:c.mode==="run"||c.mode==="face"?.92:.5+.5*Math.sin(c.gapT*1.6);
    c.gape+=(gWant-c.gape)*ease(4.5,dt);
    c.y=lkY(c.x,c.z)}
  if(CR.glb){for(const c of CR.list){const on=CR.vis>0&&c.mode!=="in";c.g.visible=on;if(!on)continue;
      const fw=Math.sin(c.yaw),fz=Math.cos(c.yaw),e=.03,k=c.s*CR_G,
        gp=(lkY(c.x+fw*e,c.z+fz*e)-lkY(c.x-fw*e,c.z-fz*e))/(2*e),gr=(lkY(c.x+fz*e,c.z-fw*e)-lkY(c.x-fz*e,c.z+fw*e))/(2*e);
      qYXZ(c.g.quaternion,-Math.atan(gp),c.yaw,Math.atan(gr));c.g.position.set(c.x,c.y-c.sk*.09*k+.006*c.up*k,c.z);c.g.scale.setScalar(k);
      if(c.sk<.6)blobAdd(c.x,c.y,c.z,c.yaw,.07*k,.06*k,.42*(1-.6*st.night)*CR.vis*(1-c.sk),.75,0);
      /* the gait clip runs at the ground speed along the crab's own x (walk_sideways goes -x; played backwards it goes +x) */
      const mx=c.tx-c.x,mz=c.tz-c.z,ml=Math.hypot(mx,mz)||1,vl=c.v*(mx*fz-mz*fw)/ml,gait=(c.mode==="walk"||c.mode==="run")&&c.walk>.5,fast=Math.abs(vl)>.24*k;
      const bn=c.mode==="dig"?"dig":gait?fast?"scuttle_sideways":"walk_sideways":"idle",bt=gait?cl(-vl/((fast?CR_SCUT:CR_WALK)*k),-3,3):1;
      play(c.rb,bn,gait?.15:.3,bt);
      /* the claws: claw_pinch opens and closes them in the pauses and holds them open (its middle frame) in a threat or a run;
         digging and walking keep the claws of their own clip. CR.gapePin (0 shut .. 1 open) holds the pinch for a proof. */
      const hold=CR.gapePin!=null?CR.gapePin*CR_OPEN:c.mode==="run"||c.mode==="face"?CR_OPEN:null,pinch=hold!=null||c.mode==="out"||c.mode==="sub";
      play(c.rc,pinch?"claw_pinch":bn,.25,pinch?hold!=null?0:1:bt);
      if(hold!=null){const a=c.rc.acts.claw_pinch;a.time+=(hold-a.time)*(CR.gapePin!=null?1:ease(6,dt))}
      if(c.rc.fd){c.rc.fd.u+=dt/c.rc.fd.T;rigW(c.rc)}rigTick(c.rb,dt)}}
  else if(CR.vis>0){const A=CR.A.array;CR.list.forEach((c,i)=>{const fw=Math.sin(c.yaw),fz=Math.cos(c.yaw),e=.03,
      gp=(lkY(c.x+fw*e,c.z+fz*e)-lkY(c.x-fw*e,c.z-fz*e))/(2*e),gr=(lkY(c.x+fz*e,c.z-fw*e)-lkY(c.x-fz*e,c.z+fw*e))/(2*e);
      qYXZ(_tq,-Math.atan(gp),c.yaw,Math.atan(gr));const k=c.s*CR_K,sc=c.mode==="in"?0:k;
      _tm.compose(_ts.set(c.x,c.y-c.sk*.05*k+.0025*CR_K*c.walk*Math.abs(Math.sin(c.ph))+.008*c.up*k,c.z),_tq,_v.set(sc,sc,sc));CR.im.setMatrixAt(i,_tm);
      if(sc>0&&c.sk<.6)blobAdd(c.x,c.y,c.z,c.yaw,.085*k,.07*k,.42*(1-.6*st.night)*CR.vis*(1-c.sk),.75,0);
      A[i*4]=c.ph;A[i*4+1]=c.walk;A[i*4+2]=Math.sin(c.fph)*c.feed*(1-c.up);A[i*4+3]=c.up;CR.OA.array[i]=Math.max(c.gape,1e-4)});
    CR.im.instanceMatrix.needsUpdate=true;CR.A.needsUpdate=true;CR.OA.needsUpdate=true}}
/* Godot's crab_v6b (the Tripo shell with rebuilt legs and chelae, 36 bones, mud olive-brown): idle 3.6 s, walk_sideways .4 s
   (.14 m/s under the planted tips), scuttle_sideways .18 s (.464 m/s), dig 1.2 s, claw_pinch 1.2 s (claw_finger.L/R hinge 0 → 30° at
   0.6 s → 0, keyed at 60 fps, so it is held by time: CR_OPEN is the fully open instant); in place, facing +z, walking along local -x, a 5 cm
   carapace and 12 cm leg span at scale 1. Once it has loaded each crab is a skinned clone of it under the underwater shading and the
   instanced crab above is not drawn. One mixer, two layers: the body and legs from the gait clip, the claw_* bones either from that
   clip or from claw_pinch. */
const CR_FILE="crab_v6b",CR_G=1,CR_WALK=.14,CR_SCUT=.464,CR_OPEN=.6,CRM=new Map();
function crMats(s){matsOf(s,(m,c)=>{c.castShadow=false;c.receiveShadow=true;c.renderOrder=3;c.frustumCulled=false;let n=CRM.get(m.uuid);
  if(!n){n=m.clone();CRM.set(m.uuid,n);if(n.map)n.map.anisotropy=MOB?2:4;if(n.emissive)n.emissive.setRGB(0,0,0);
    n.metalness=0;n.metalnessMap=null;n.aoMapIntensity=.6;n.userData.U=CR.U;uwMat(n,"crg",".9",{head:"",nrm:"",pos:""})}
  c.material=n})}
function crLoad(){return glb(CR_FILE).then(src=>{const C=VT.THREE.AnimationClip,isC=t=>/^claw_/.test(t.name),body=[],claw=[];
  for(const a of src.animations){body.push(new C(a.name,a.duration,a.tracks.filter(t=>!isC(t))));claw.push(new C(a.name,a.duration,a.tracks.filter(isC)))}
  for(const c of CR.list){const s=VT.cloneSkinned(src.scene),g=new T.Group();g.rotation.order="YXZ";g.add(s);W.add(g);onDes(g);crMats(s);
    const b=rigUp(s,body),k={mx:b.mx,acts:{},cur:null};for(const a of claw)k.acts[a.name]=b.mx.clipAction(a);
    play(b,"idle",.01,1);play(k,"idle",.01,1);b.acts.idle.time=k.acts.idle.time=rr(0,3.6);c.g=g;c.rb=b;c.rc=k;g.visible=false}
  CR.glb=1;CR.im.visible=false})}
/* the lake animals are hidden once they are under a couple of pixels */
function lakeVis(){const c=_pfc.copy(De.position);W.worldToLocal(c);
  const D=Math.max(.5,Math.hypot((c.x-POND.x),(c.z-POND.z),c.y-POND.wy)-Math.max(POND.rx,POND.rz)*.6),ppm=innerHeight*Math.min(devicePixelRatio||1,2)/(2*Math.tan(De.fov*Math.PI/360));
  TT.vis=1-ss(.32*ppm/3*.6,.32*ppm/3,D);const px=.32*ppm/D;TT.hi=!!TT.glb&&px>(TT.hi?15:20);const crL=CR.glb?.12*CR_G:.1*CR_K;CR.vis=1-ss(crL*ppm/2.5*.6,crL*ppm/2.5,D);
  TT.U.uVis.value=TT.vis;CR.U.uVis.value=CR.vis;TT.im.visible=TT.vis>0&&!TT.hi;CR.im.visible=CR.vis>0&&!CR.glb;CR.bm.visible=CR.vis>0;
  UW.uWy.value=W.position.y+POND.wy*W.scale.y;UW.uWob.value=.012+.03*st.wn+.05*WX.rain}

/* ---------------- Sinai agama (Pseudotrapelus sinaitus), real size (25 cm, 62 % of it tail) ----------------
   Two of them, a male and a female, living round the grove. They sprint in short bursts and pause, bask flat on a rock
   in the sun, head-bob, climb the date palms (along the trunk's own lean and sway) to sit in the crown's shade when hot,
   climb up under the crown when it rains, and hide by a rock at night. Body temperature follows sun, shade and rain;
   the male is the blue file and fades back toward the sandy file's colour as he cools.
   sinai_agama_v1c clips (same on the blue twin): idle, bask, head_bob, run (.236 m/s), climb (.0349 m/s on the plane z=0, head +y, back +z). */
const AG={list:[],vis:1,spots:[]};
const AG_FILES=["sinai_agama_v1c","sinai_agama_v1c_blue"];
const AG_RUN=.236,AG_CLIMB=.0349,AG_V=1.05,AG_VC=.16;
const _ap=new V3(),_an=new V3(),_ax=new V3(),_ay=new V3(),_az=new V3(),_am=new T.M4(),_aq=new T.Quat(),_aq2=new T.Quat();
/* the palm trunk's wind sway, the same as palmSway() in the trunk shader */
function palmSwayAt(pp,t){if(!pp.wp){pp.wp=new V3();pp.g.getWorldPosition(pp.wp)}const ph=pp.wp.x*.9+pp.wp.z*.7,u=propU.uT.value,
  s=(Math.sin(u*.8+ph)*.7+Math.sin(u*1.6+ph*1.3)*.3)*(.25+propU.uWind.value)*.16;return _ap.set(s*t*t,0,s*.45*t*t)}
/* a point on the trunk surface at height fraction t and angle az, and the frame there (tg up the trunk, n out of it) */
function trunkAt(pp,t,az){const P=pp.spine(t),tg=pp.spine(Math.min(1,t+.01)).sub(pp.spine(Math.max(0,t-.01))).normalize();
  const N=new V3().crossVectors(tg,new V3(0,0,1)).normalize(),B=new V3().crossVectors(tg,N),n=N.multiplyScalar(Math.cos(az)).addScaledVector(B,Math.sin(az));
  return{p:P.add(pp.g.position).addScaledVector(n,pp.rad(t)).add(palmSwayAt(pp,t)),tg,n,N,B}}
function agTrunkPose(a){const f=trunkAt(a.palm,a.ct,a.az);a.g.position.copy(f.p);
  /* walking round the trunk it turns its head the way it is going instead of sliding sideways */
  const hd=a.hd||0,cd=_an.crossVectors(f.tg,f.n);
  const q=(down,o)=>{_ay.copy(f.tg).multiplyScalar((down?-1:1)*Math.cos(hd)).addScaledVector(cd,Math.sin(hd)).normalize();_ax.crossVectors(_ay,f.n);_am.makeBasis(_ax,_ay,f.n);return o.setFromRotationMatrix(_am)};
  if(a.turn!=null){q(!a.down,_aq);q(a.down,_aq2);a.g.quaternion.slerpQuaternions(_aq,_aq2,ss(0,1,a.turn))}else q(a.down,a.g.quaternion);
  if(a.lift){a.g.position.addScaledVector(f.n,a.lift*.6);a.g.quaternion.multiply(_aq.setFromAxisAngle(_ax.set(1,0,0),a.lift*7))}}
function agGroundPose(a){const n=a.ry>-50?_an.set(0,1,0):nTop(a.x,a.z);a.g.position.set(a.x,a.ry>-50?a.ry:hTop(a.x,a.z),a.z);
  _az.set(Math.sin(a.yaw),0,Math.cos(a.yaw));_ax.crossVectors(n,_az).normalize();_az.crossVectors(_ax,n);_am.makeBasis(_ax,n,_az);a.g.quaternion.setFromRotationMatrix(_am);
  if(a.lift){a.g.position.y+=a.lift*.6;a.g.quaternion.multiply(_aq.setFromAxisAngle(_ax.set(1,0,0),-a.lift*7))}}
/* the top of a rock under (x,z), or -99 */
const _rtc={r:null,o:new V3(),d:new V3(0,-1,0)};
function rockTop(x,z){if(!_rtc.r)_rtc.r=new VT.THREE.Raycaster();W.updateMatrixWorld();_rtc.o.set(x,6,z);W.localToWorld(_rtc.o);_rtc.d.set(0,-1,0);_rtc.r.set(_rtc.o,_rtc.d);
  const h=_rtc.r.intersectObjects(rockInst,false)[0];if(!h)return-99;const p=W.worldToLocal(h.point.clone());return p.y>hTop(x,z)+.05?p.y:-99}
/* basking rocks near the grove with a fairly flat top, and each one's hiding place at its foot */
function agSpots(){const L=[];
  for(const o of OBST){if(o.k!=="rock"||o.r<.22||Math.hypot(o.x-GROVE.x,o.z-GROVE.z)>17||pN(o.x,o.z)<1.2)continue;const y=rockTop(o.x,o.z);if(y<-50)continue;
    let ok=true;for(let k=0;k<4;k++){const a=k*TAU/4,yy=rockTop(o.x+Math.cos(a)*.12,o.z+Math.sin(a)*.12);if(Math.abs(yy-y)>.05)ok=false}
    if(ok)L.push({x:o.x,z:o.z,y,r:o.r,ta:0})}
  if(!L.length)L.push({x:GROVE.x+3,z:GROVE.z+3,y:-99,r:.3,ta:0});AG.spots=L}
function agSpawn(scene,anims,male,sandMap){const g=new T.Group();g.add(scene);W.add(g);
  scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false}});
  animalMats(scene,false);
  /* keeled scales need the normal map; the shared animal roughness floor washes them out */
  matsOf(scene,m=>{if(m.normalMap)m.roughness=.46});
  const U={uWarm:{value:0},uSand:{value:sandMap||null}};
  /* the male mesh is the blue GLB. Scale grain from the sandy file keeps the blue from reading as a flat wash;
     his own colour shows as he warms, the sandy file's colour as he cools */
  if(male&&sandMap)matsOf(scene,(m,o)=>{const c=m.clone();o.material=c;c.roughness=.46;if(!ANIM_MATS.includes(c))ANIM_MATS.push(c);
    c.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);sh.fragmentShader=sh.fragmentShader.replace("#include <common>","#include <common>\nuniform sampler2D uSand;uniform float uWarm;")
      .replace("#include <map_fragment>",`#ifdef USE_MAP
        vec4 sampledDiffuseColor=texture2D(map,vMapUv);
        vec3 sandC=texture2D(uSand,vMapUv).rgb;
        float sl=dot(sandC,vec3(.30,.59,.11));
        vec3 blue=sampledDiffuseColor.rgb*clamp(.72+sl*.75,.78,1.35);
        /* the body stays the blue file. Warmer flecks of the sandy map read as ochre grains in that blue. */
        float speck=smoothstep(.05,.15,sandC.r-sandC.b)*smoothstep(.38,.7,sl);
        vec3 dyed=mix(sandC,blue,mix(.58,.93,clamp(uWarm,0.,1.)));
        sampledDiffuseColor.rgb=mix(dyed,sandC,speck*.7);
        diffuseColor*=sampledDiffuseColor;
        #endif`)};c.customProgramCacheKey=()=>"agBlue2"});
  onDes(g);
  const a={g,r:rigUp(scene,anims),male,U,x:0,z:0,ry:-99,yaw:rr(-3,3),mode:"idle",timer:rr(1,3),Tb:male?.8:.6,warm:male?.6:0,
    palm:null,ct:0,az:0,down:false,turn:null,ctGoal:0,path:null,pi:0,then:null,goal:null,burst:0,bob:rr(4,10),cond:"",spot:null,oP:new V3(),oQ:new T.Quat(),sp:null};
  for(const k of["climb","run","idle","bask","head_bob"]){const c=a.r.acts[k];if(c&&k==="head_bob")c.setLoop(VT.THREE.LoopOnce,1),c.clampWhenFinished=true}
  play(a.r,"idle",.01,1);return a}
const agSun=()=>(1-st.night)*WX.sunK*(1-WX.rain)*(1-.5*WX.dust)*(st.phase==="day"?1:.65);
const agGrid=()=>navGrid("agama",.05,1.12,.86);
function agGo(a,goal,then){const p=navPath(agGrid(),a.x,a.z,goal.x,goal.z)||[{x:a.x,z:a.z},{x:goal.x,z:goal.z}];
  a.path=p;a.pi=1;a.then=then;a.goal=goal;a.mode="run";a.burst=rr(.8,2.8);play(a.r,"run",.12,AG_V/AG_RUN)}
/* rain shelter: right under the crown, just below the skirt of dead leaf sheaths (whose lowest ring starts ~12 % of the trunk down) */
const agRainT=pp=>Math.max(.3,(pp.h*.876-.3)/pp.h);
/* the viewer's side of things: palms and rocks nearer the camera are picked more often and kept longer, so a lizard this
   small is mostly where it can be seen; k is 1 for the nearest, falling off over ~6 m further away */
function agNearK(x,z,L){let m=1e9;for(const o of L)m=Math.min(m,Math.hypot(o.x-_cl.x,o.z-_cl.z));return Math.exp(-(Math.hypot(x-_cl.x,z-_cl.z)-m)/6)}
function agPickNear(L){let s=0;const w=L.map(o=>{const k=agNearK(o.x,o.z,L);s+=k;return k});let r=rnd()*s;for(let i=0;i<L.length;i++){r-=w[i];if(r<=0)return L[i]}return L[L.length-1]}
/* the trunk angle that faces the camera at height fraction t */
function agViewAz(pp,t){const f=trunkAt(pp,t,0),P=pp.spine(t).add(pp.g.position),dx=_cl.x-P.x,dz=_cl.z-P.z;return Math.atan2(dx*f.B.x+dz*f.B.z,dx*f.N.x+dz*f.N.z)}
function agNearPalm(a){let b=null,bd=1e9;for(const pp of PALMS){const d=Math.hypot(pp.x-a.x,pp.z-a.z);if(d<bd){bd=d;b=pp}}return b}
/* it goes up the side of the trunk that faces the viewer, so a lizard this small is not hidden behind the palm */
function agPalmBase(a,pp){let dx=_cl.x-pp.x,dz=_cl.z-pp.z;if(Math.hypot(dx,dz)<.01){dx=a.x-pp.x;dz=a.z-pp.z}const l=Math.hypot(dx,dz)||1,r=pp.rad(0)+.14;return{x:pp.x+dx/l*r,z:pp.z+dz/l*r,pp}}
function agMount(a,pp){const f=trunkAt(pp,.03,0),dx=a.x-pp.x,dz=a.z-pp.z;a.palm=pp;a.az=Math.atan2(dx*f.B.x+dz*f.B.z,dx*f.N.x+dz*f.N.z);
  a.azG=a.az+(AG.list.some(o=>o!==a&&o.palm===pp)?(a.male?.6:-.6):0);a.azV=0;a.hd=0;
  a.ct=.12/pp.h;a.down=false;a.turn=null;a.mode="climb";play(a.r,"climb",.1,AG_VC/AG_CLIMB)}
function agClimb(a,goal){a.ctGoal=goal;const dn=goal<a.ct;if(dn!==a.down){a.down=dn;a.turn=0}a.mode="climb";play(a.r,"climb",.15,AG_VC/AG_CLIMB)}
function agDismount(a){const f=trunkAt(a.palm,.02,a.az),pp=a.palm;a.x=pp.x+f.n.x*(pp.rad(0)+.2);a.z=pp.z+f.n.z*(pp.rad(0)+.2);a.yaw=Math.atan2(f.n.x,f.n.z);
  a.palm=null;a.ry=-99;a.down=false;a.turn=null;a.mode="idle";a.timer=rr(.5,1.5);play(a.r,"idle",.15,1)}
function agBask(a,sp){a.mode="bask";a.spot=sp;a.timer=rr(25,50)*(1+.8*agNearK(sp.x,sp.z,AG.spots));
  /* broadside to the sun to take in the most heat */
  a.yaw=wrapA(SUN.lazL+Math.PI/2*(rnd()<.5?1:-1)+rr(-.3,.3));play(a.r,"bask",.4,1)}
function agDecide(a){const night=st.night>.5||WX.cold>0,rain=WX.rain>.25,sun=agSun();a.cond=night?"n":rain?"r":"d";a.then=null;
  if(night){if(a.palm){agClimb(a,0);return}const sp=a.spot||AG.spots[0],h={x:sp.x+.25*Math.sin(SUN.lazL),z:sp.z+.25*Math.cos(SUN.lazL)};
    if(Math.hypot(a.x-h.x,a.z-h.z)<.3){a.mode="hide";a.g.visible=false;a.timer=rr(20,40);return}agGo(a,h,"hide");return}
  a.g.visible=true;
  if(rain){if(a.palm){const tg=agRainT(a.palm)-(a.male?0:.28/a.palm.h);if(Math.abs(a.ct-tg)>.01){agClimb(a,tg);return}a.mode="perch";a.timer=rr(8,14);play(a.r,"climb",.2,0);return}
    const pp=agNearPalm(a);agGo(a,agPalmBase(a,pp),"climb");a.goal.rain=1;return}
  if(a.palm){if(a.Tb<.55&&sun>.3){agClimb(a,0);return}
    if(rnd()<.35){agClimb(a,cl(a.ct+rr(-.15,.2),.15/a.palm.h,(a.palm.h-2.2)/a.palm.h));return}
    a.mode="perch";a.timer=rr(8,20)*(1+.9*agNearK(a.palm.x,a.palm.z,PALMS));play(a.r,"climb",.25,0);if(!a.down&&rnd()<.6){a.down=true;a.turn=0}return}
  if(a.Tb<.85&&sun>.35){const fr=AG.spots.filter(s=>s!==a.spot||a.mode==="bask");const sp=fr.length?agPickNear(fr):AG.spots[0];
    if(a.spot===sp&&a.ry>-50){agBask(a,sp);return}agGo(a,{x:sp.x,z:sp.z,y:sp.y,sp},"bask");return}
  if(sun>.35&&rnd()<.65){const pp=agPickNear(PALMS);agGo(a,agPalmBase(a,pp),"climb");return}
  const w=randFree(agGrid(),GROVE.x,GROVE.z,9);if(w){agGo(a,w,"idle");return}
  a.mode="idle";a.timer=rr(3,8);play(a.r,"idle",.3,1)}
function agArrive(a){const k=a.then,g=a.goal;a.path=null;
  if(k==="climb"){agMount(a,g.pp);a.ctGoal=g.rain?agRainT(g.pp)-(a.male?0:.28/g.pp.h):Math.min(rr(1.5,3.5),g.pp.h-2.2)/g.pp.h;return}
  if(k==="bask"){agBask(a,g.sp);return}
  if(k==="hide"){a.mode="hide";a.g.visible=false;a.timer=rr(20,40);return}
  a.mode="idle";a.timer=rr(2,6);play(a.r,"idle",.25,1)}
function agUpdate(dt){
  const night=st.night>.5||WX.cold>0,rain=WX.rain>.25,sun=agSun();
  for(const a of AG.list){
    const c=night?"n":rain?"r":"d";if(c!==a.cond&&a.mode!=="run"&&a.mode!=="climb")agDecide(a);else if(c!==a.cond&&a.mode==="run"&&(c!=="d"))agDecide(a);
    /* body temperature: fast to warm flat in the sun, slower in the open, cools in shade, rain and at night */
    const ex=a.mode==="bask"?1:a.mode==="hide"?0:a.palm?.3:.6,tgt=.12+.88*sun*ex;a.Tb+=(tgt-a.Tb)*dt/(tgt>a.Tb?(a.mode==="bask"?35:90):160);
    if(a.male){a.warm+=(ss(.42,.82,a.Tb)-a.warm)*ease(.25,dt);a.U.uWarm.value=a.warm}
    if(a.mode==="run"){const p=a.path[a.pi],dx=p.x-a.x,dz=p.z-a.z,d=Math.hypot(dx,dz);
      const dy=wrapA(Math.atan2(dx,dz)-a.yaw);a.yaw=wrapA(a.yaw+cl(dy,-9*dt,9*dt));const v=AG_V*(Math.abs(dy)>1.2?.25:1),st_=Math.min(d,v*dt);
      a.x+=Math.sin(a.yaw)*st_;a.z+=Math.cos(a.yaw)*st_;a.burst-=st_;
      /* onto and off rocks: the body follows the rock top while over it */
      const g=a.goal;if(g&&g.y>-50&&Math.hypot(a.x-g.x,a.z-g.z)<(g.sp?g.sp.r:.4)+.05){const ty=rockTop(a.x,a.z);a.ry=ty>-50?(a.ry>-50?a.ry+(ty-a.ry)*ease(14,dt):ty):-99}else if(a.ry>-50){const ty=rockTop(a.x,a.z);a.ry=ty>-50?ty:-99}
      if(d<.06){a.pi++;if(a.pi>=a.path.length){agArrive(a);agPose(a);agSmooth(a,dt);rigTick(a.r,dt);continue}}
      if(a.burst<=0&&a.mode==="run"&&d>.4){a.mode="pause";a.timer=rr(.35,1.4);play(a.r,"idle",.12,1)}}
    else if(a.mode==="pause"){a.timer-=dt;if(a.timer<=0){a.mode="run";a.burst=rr(.8,2.8);play(a.r,"run",.12,AG_V/AG_RUN)}}
    else if(a.mode==="climb"){if(a.turn!=null){a.turn+=dt/.7;if(a.turn>=1)a.turn=null}else{
      const s=Math.sign(a.ctGoal-a.ct),dv=AG_VC*(a.fast?4.5:1)*dt/a.palm.h;a.ct+=s*Math.min(dv,Math.abs(a.ctGoal-a.ct));
      if(Math.abs(a.ctGoal-a.ct)<1e-4){a.fast=0;if(a.ctGoal<=.15/a.palm.h+1e-3&&a.down){agDismount(a);agDecide(a)}else{a.mode="perch";a.timer=rr(8,20);play(a.r,"climb",.25,0)}}}}
    else if(a.mode==="perch"){if(a.turn!=null){a.turn+=dt/.7;if(a.turn>=1)a.turn=null}a.timer-=dt;
      /* every so often a quick dash a hand or two along the trunk, the way it is facing, then stock-still again */
      a.dsT=(a.dsT==null?rr(5,12):a.dsT)-dt;
      if(!rain&&a.turn==null&&a.pu==null&&a.dsT<=0){a.dsT=rr(7,16);const h=a.palm.h,g=cl(a.ct+(a.down?-1:1)*rr(.2,.55)/h,.2/h,(h-2.2)/h);
        if(Math.abs(g-a.ct)*h>.12){a.ctGoal=g;a.fast=1;a.mode="climb";play(a.r,"climb",.06,AG_VC*4.5/AG_CLIMB)}}
      else if(a.timer<=0)agDecide(a)}
    else if(a.mode==="bask"){a.timer-=dt;a.bob-=dt;
      /* shifts its stance on the rock now and then, turning a little to the sun or away */
      a.shT=(a.shT==null?rr(4,9):a.shT)-dt;if(a.shT<=0){a.shT=rr(4,10);a.yawG=wrapA(a.yaw+rr(-.5,.5))}
      if(a.yawG!=null){const d=wrapA(a.yawG-a.yaw);a.yaw=wrapA(a.yaw+cl(d,-1.1*dt,1.1*dt));if(Math.abs(d)<.01)a.yawG=null}
      if(a.bob<=0&&a.Tb>.45){a.bob=a.male?rr(7,15):rr(15,30);play(a.r,"head_bob",.2,1);a.mode="bob";a.timer2=3}
      else if(a.timer<=0||a.Tb>.97)agDecide(a)}
    else if(a.mode==="bob"){a.timer2-=dt;if(a.timer2<=.25){a.mode="bask";play(a.r,"bask",.3,1)}}
    else{a.timer-=dt;if(a.timer<=0)agDecide(a)}
    /* on a trunk it keeps to the camera's side: once it is round the side or behind, it walks round at a lizard's pace,
       easing in and out, so neither its place nor its heading ever jumps */
    if(a.palm&&(a.mode==="climb"||a.mode==="perch")){
      const mate=AG.list.find(o=>o!==a&&o.palm===a.palm),va=agViewAz(a.palm,a.ct)+(mate?(a.male?.6:-.6):0);
      if(a.azG==null)a.azG=a.az;if(Math.abs(wrapA(va-a.az))>1.1)a.azG=a.az+wrapA(va-a.az);
      const r=a.palm.rad(a.ct),d=a.azG-a.az,want=Math.abs(d)<.015?0:Math.sign(d)*Math.min(AG_VC*.9/r,Math.abs(d)*1.4);
      a.azV=(a.azV||0)+(want-(a.azV||0))*ease(3,dt);a.az+=a.azV*dt;
      const lat=a.azV*r,vert=a.mode==="climb"&&a.turn==null?AG_VC:0;a.hd=(a.hd||0)+(cl(lat/(vert+.08),-1.2,1.2)-(a.hd||0))*ease(4,dt);
      const ca=a.r.acts.climb;if(ca&&a.mode==="perch")ca.timeScale=Math.abs(lat)>.004?Math.abs(lat)/AG_CLIMB:0}
    else if(a.hd)a.hd=0;
    /* display: a burst of push-ups, the agama's bob, from a rock or a trunk; the male more often than the female */
    a.puT=(a.puT==null?rr(3,8):a.puT)-dt;
    if(a.pu==null&&a.puT<=0&&(a.mode==="perch"&&!rain&&a.turn==null||a.mode==="bask")){a.pu=0;a.puN=2+Math.floor(rnd()*3);a.puD=a.puN*.42;
      if(a.mode==="perch"&&rnd()<.5)a.azG=a.az+rr(-.3,.3)}
    if(a.pu!=null){a.pu+=dt/a.puD;if(a.pu>=1||a.mode!=="perch"&&a.mode!=="bask"){a.pu=null;a.puT=a.male?rr(5,11):rr(9,18)}}
    a.lift=a.pu!=null?Math.pow(Math.max(0,Math.sin(Math.PI*a.puN*a.pu)),.7)*.013*(a.male?1:.7):0;
    agPose(a);agSmooth(a,dt);if(AG.vis>0&&a.g.visible)rigTick(a.r,dt)}}
function agPose(a){if(a.palm)agTrunkPose(a);else agGroundPose(a)}
/* any step faster than it can run or turn (turning broadside to bask, stepping onto or off a trunk) is eased out over a
   fraction of a second instead of shown as a jump */
const _agI=new T.Quat();
function agSmooth(a,dt){const p=a.g.position,q=a.g.quaternion;
  if(a.sp&&a.wasVis&&a.g.visible&&(a.sp.distanceTo(p)>AG_V*1.5*dt+.01||a.sq.angleTo(q)>12*dt+.05)){a.oP.copy(a.sp).sub(p);a.oQ.copy(a.sq).multiply(_aq.copy(q).invert())}
  const k=Math.exp(-dt/.2);a.oP.multiplyScalar(k);a.oQ.slerp(_agI,1-k);p.add(a.oP);q.premultiply(a.oQ);
  if(!a.sp){a.sp=new V3();a.sq=new T.Quat()}a.sp.copy(p);a.sq.copy(q);a.wasVis=a.g.visible}
/* lizards under ~1.5 px are hidden and their rigs not updated */
const _agc=new V3();
function agVis(){const c=_agc.copy(De.position);W.worldToLocal(c);const ppm=innerHeight*Math.min(devicePixelRatio||1,2)/(2*Math.tan(De.fov*Math.PI/360));
  let v=0;for(const a of AG.list){const D=c.distanceTo(a.g.position),on=.25*ppm/Math.max(D,.05)>1.5;a.g.children[0].visible=on;if(on)v=1}AG.vis=v}
function agLoad(){return Promise.all(AG_FILES.map(glb)).then(([sand,blue])=>{agSpots();
  let sandMap=null;sand.scene.traverse(o=>{if(!sandMap&&o.isMesh&&o.material&&o.material.map)sandMap=o.material.map});
  if(sandMap){sandMap.colorSpace="srgb";sandMap.anisotropy=MOB?4:8;sandMap.needsUpdate=true}
  const M=agSpawn(blue.scene,blue.animations,true,sandMap),F=agSpawn(VT.cloneSkinned(sand.scene),sand.animations,false);
  [M,F].forEach((a,i)=>{const sp=AG.spots[i%AG.spots.length];a.x=sp.x+(i?.6:0);a.z=sp.z+(i?-.5:0);a.spot=sp;a.ry=i?-99:sp.y;agDecide(a);agPose(a);AG.list.push(a)})})}
/* ---------------- procedural animals: ostriches, desert tortoises, gerbils, scorpions ----------------
   The behaviour of all four lives here. Their bodies are Godot's rigged models (see "the rigged models" below); what follows
   builds the stand-in used only when a model file can't be loaded. Each is one skinned mesh built here from ellipsoids and lofted rings, every vertex bound to one or two
   bones whose rest frames are all aligned with the model axes (+z forward, +y up, metres above the ground under the body), so a
   pose is each bone's rotation (and for a few a shift), set by code every frame. All four share one material program: vertex
   colour, a surface kind per vertex (aS) and the bind-pose position, from which the fine detail is drawn so it stays on the
   body as it moves. Feet that carry weight stay where they were put down and print the sand there. */
const PSK={skin:0,fur:1,plume:2,shell:3,cut:4,scale:5,bare:6,eye:7,claw:8,down:9};
const _n3=a=>{const l=Math.hypot(a[0],a[1],a[2])||1;return[a[0]/l,a[1]/l,a[2]/l]},_x3=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const _fv=(f,...a)=>typeof f==="function"?f(...a):f;
function paGeo(){const P=[],N=[],C=[],S=[],SI=[],SW=[],I=[],U=[];let n=0;const G={I,uv:null};
  /* bw: a bone index, or [[i,w],[j,w]] */
  G.v=(p,q,c,s,bw)=>{P.push(p[0],p[1],p[2]);let l=Math.hypot(q[0],q[1],q[2])||1;
    /* plumes are shaded as the body under them (the coat reads soft, not as separate blades lit edge by edge) */
    if(G.nOv){const o=G.nOv,k=G.nK;q=[q[0]/l*(1-k)+o[0]*k,q[1]/l*(1-k)+o[1]*k,q[2]/l*(1-k)+o[2]*k];l=Math.hypot(q[0],q[1],q[2])||1}
    N.push(q[0]/l,q[1]/l,q[2]/l);C.push(c[0]**2.2,c[1]**2.2,c[2]**2.2);S.push(s);U.push(G.uv?G.uv[0]:0,G.uv?G.uv[1]:-1);
    if(typeof bw==="number"){SI.push(bw,0,0,0);SW.push(1,0,0,0)}else{SI.push(bw[0][0],bw[1][0],0,0);SW.push(bw[0][1],bw[1][1],0,0)}return n++};
  /* an ellipsoid; sh(x,y,z) may reshape the unit point; col(p,x,y,z) and bw(p) may be functions */
  G.ell=(c,r,col,s,bw,nu,nv,sh)=>{const b=n;nu=nu||12;nv=nv||8;
    for(let i=0;i<=nv;i++){const t=i/nv*Math.PI;for(let j=0;j<=nu;j++){const ph=j/nu*TAU;let x=Math.sin(t)*Math.sin(ph),y=Math.cos(t),z=Math.sin(t)*Math.cos(ph);
        if(sh)[x,y,z]=sh(x,y,z);const p=[c[0]+x*r[0],c[1]+y*r[1],c[2]+z*r[2]];G.v(p,[x/r[0],y/r[1],z/r[2]],_fv(col,p,x,y,z),s,_fv(bw,p))}}
    for(let i=0;i<nv;i++)for(let j=0;j<nu;j++){const a=b+i*(nu+1)+j,d=a+nu+1;I.push(a,d,a+1,a+1,d,d+1)}};
  /* a lofted tube through rings {c, rx (half width), ry (half height), col, bw}; up: the axis the rings' "height" follows */
  G.loft=(R,s,na,caps,up)=>{na=na||10;const b=n,M=R.length;up=up||[0,1,0];
    for(let i=0;i<M;i++){const r=R[i],c=r.c,p0=R[Math.max(i-1,0)].c,p1=R[Math.min(i+1,M-1)].c,t=_n3([p1[0]-p0[0],p1[1]-p0[1],p1[2]-p0[2]]);
      const sd=_n3(_x3(r.up||up,t)),uu=_x3(t,sd);r.t=t;
      for(let j=0;j<=na;j++){const a=j/na*TAU,ca=Math.cos(a),sa=Math.sin(a),k=r.k?r.k(ca,sa):1,rx=r.rx*k,ry=r.ry*k;
        const p=[c[0]+sd[0]*rx*ca+uu[0]*ry*sa,c[1]+sd[1]*rx*ca+uu[1]*ry*sa,c[2]+sd[2]*rx*ca+uu[2]*ry*sa];
        if(G.pl)G.uv=[ca,i/(M-1)];G.v(p,[sd[0]*ca/rx+uu[0]*sa/ry,sd[1]*ca/rx+uu[1]*sa/ry,sd[2]*ca/rx+uu[2]*sa/ry],_fv(r.col,p,ca,sa),_fv(r.s!=null?r.s:s,p,ca,sa),_fv(r.bw,p))}}
    if(G.pl)G.uv=null;
    for(let i=0;i<M-1;i++)for(let j=0;j<na;j++){const a=b+i*(na+1)+j,d=a+na+1;I.push(a,a+1,d,a+1,d+1,d)}
    if(caps){for(const[e,sg]of[[0,-1],[M-1,1]]){const r=R[e],t=r.t;if(G.pl)G.uv=[0,e?1:0];const c=G.v(r.c,[t[0]*sg,t[1]*sg,t[2]*sg],_fv(r.col,r.c,0,0),_fv(r.s!=null?r.s:s,r.c,0,0),_fv(r.bw,r.c));
      for(let j=0;j<na;j++){const a=b+e*(na+1)+j;sg<0?I.push(c,a+1,a):I.push(c,a,a+1)}}G.uv=null}};
  /* one loose plume: a flat blade from b along d, sagging under its own weight, widest a third of the way out; up is the side
     that faces away from the body; col(t) runs root to tip */
  G.plume=(b,d,len,wd,col,bw,droop,up,s,nk)=>{const R=[],dl=_n3(d);
    for(let i=0;i<=5;i++){const t=i/5,w=wd*Math.max(.12,Math.sin(Math.PI*Math.pow(t,.55)))*(i===5?.35:1);
      R.push({c:[b[0]+dl[0]*len*t,b[1]+dl[1]*len*t-droop*t*t,b[2]+dl[2]*len*t],rx:w,ry:w*.28,col:_fv(col,t),bw})}
    G.nOv=_n3(up);G.nK=nk==null?.82:nk;G.pl=1;G.loft(R,s==null?PSK.plume:s,6,true,up);G.nOv=null;G.pl=0};
  G.build=()=>{const TH=VT.THREE,g=new TH.BufferGeometry();g.setAttribute("position",new TH.BufferAttribute(new Float32Array(P),3));
    g.setAttribute("normal",new TH.BufferAttribute(new Float32Array(N),3));g.setAttribute("color",new TH.BufferAttribute(new Float32Array(C),3));
    g.setAttribute("aS",new TH.BufferAttribute(new Float32Array(S),1));g.setAttribute("aU",new TH.BufferAttribute(new Float32Array(U),2));g.setAttribute("skinIndex",new TH.BufferAttribute(new Uint16Array(SI),4));
    g.setAttribute("skinWeight",new TH.BufferAttribute(new Float32Array(SW),4));g.setIndex(I);return g};
  return G}
/* bones from [name, parent, rest head, (rest aim point)]; a bone's rest direction points at its aim point or first child */
function paBones(defs){const TH=VT.THREE,B={},L=[],ix={};
  defs.forEach((d,i)=>{const b=new TH.Bone();b.name=d[0];b.userData.rp=new V3(d[2][0],d[2][1],d[2][2]);const pr=d[1]?B[d[1]]:null;
    b.position.copy(b.userData.rp);if(pr){b.position.sub(pr.userData.rp);pr.add(b)}B[d[0]]=b;L.push(b);ix[d[0]]=i});
  defs.forEach(d=>{const b=B[d[0]],c=d[3]?new V3(d[3][0],d[3][1],d[3][2]):b.children[0]?b.children[0].userData.rp.clone():null;
    b.rd=c?c.sub(b.userData.rp).normalize():new V3(0,0,1);b.len=d[3]||b.children[0]?(d[3]?Math.hypot(d[3][0]-d[2][0],d[3][1]-d[2][1],d[3][2]-d[2][2]):b.children[0].position.length()):0});
  return{B,L,ix}}
const PA_F=`
float pH(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
vec2 pVor(vec2 p){vec2 i=floor(p),f=fract(p);float a=8.,b=8.;for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec2 g=vec2(x,y),o=vec2(pH(i+g),pH(i+g+17.3));
  float d=length(g+o-f);if(d<a){b=a;a=d;}else if(d<b)b=d;}return vec2(a,b);}
/* the desert tortoise's carapace: 5 vertebral, 4+4 costal and a ring of marginal scutes, each with growth rings round its areola */
vec3 pShell(vec3 p,vec3 c){vec2 q=p.xz;float d1=9.,d2=9.;vec2 ce=vec2(0.);
  for(int i=0;i<35;i++){vec2 s;if(i<5)s=vec2(0.,-.1+.05*float(i));else if(i<13){float k=float(i-5);s=vec2((k<4.?1.:-1.)*.068,-.078+.052*mod(k,4.));}
    else{float a=float(i-13)/22.*6.2832;s=vec2(.112*sin(a),.152*cos(a));}
    float d=length((q-s)*vec2(1.,.9));if(d<d1){d2=d1;d1=d;ce=s;}else if(d<d2)d2=d;}
  float seam=smoothstep(.0045,.0012,d2-d1),fw=fwidth(d1)*1.5,ring=.5+.5*cos(d1*6.2832/.0055);ring*=1.-smoothstep(.0025,.006,fw);
  float h=pH(ce*91.),ar=smoothstep(.022,.006,d1);
  c*=.8+.3*h;c=mix(c,c*vec3(1.25,1.12,.85),ar*.6);c*=1.-.16*ring*smoothstep(.008,.02,d1);c=mix(c,c*.32,seam);return c;}
/* a plume's edge is a fringe of separate barbs angled out from the shaft toward the tip, and its tip frays apart */
void paFray(){if(vU.y<0.)return;float u=abs(vU.x),v=vU.y,b=fract(v*11.+u*4.5+pH(vec2(floor(v*11.+u*4.5),vBP.x*37.))*.3);
  float lim=1.-.55*smoothstep(.1,.9,v)*step(.55,b)-.35*smoothstep(.75,1.,v);if(u>lim)discard;}
void paSurf(inout vec3 c,out float r){float s=vS,fa;r=.75;vec3 p=vBP;
  if(s<.5){r=.62;c*=.92+.16*dn2(p.xz*90.+p.y*40.);}
  else if(s<1.5){/* fur: fine strands along the body, darker roots between them */
    vec2 q=vec2(p.x*700.+p.y*300.,p.z*160.);fa=1.-smoothstep(.4,1.2,length(fwidth(q)));c*=.84+.32*mix(.5,dn2(q),fa)+.08*(dn2(p.xz*60.)-.5);r=.86;}
  else if(s<2.5){/* loose plumes: long soft barbs hanging down and back, with dark gaps between them */
    vec2 q=vec2(p.x*34.+p.z*9.,p.y*7.+p.z*11.);fa=1.-smoothstep(.4,1.4,length(fwidth(q)));
    float b=dn2(q),b2=dn2(q*vec2(3.1,1.4)+5.);c*=.72+.42*mix(.5,b*.65+b2*.35,fa);r=.9;
    /* on a plume itself: a pale shaft, barbs slanting out from it toward the tip, and the root in the shade of the plume over it */
    if(vU.y>=0.){float u=abs(vU.x),v=vU.y,bq=v*30.-u*7.,bf=1.-smoothstep(.35,1.,fwidth(bq)*1.4),bb=fract(bq);
      c*=mix(1.,.8+.32*smoothstep(.15,.5,bb)*smoothstep(.95,.6,bb),bf);c=mix(c,c*1.45+.012,smoothstep(.16,.04,u)*(1.-.7*v)*bf);c*=mix(.6,1.,smoothstep(0.,.4,v));}}
  else if(s<3.5){c=pShell(p,c);r=.66;}
  else if(s<4.5){r=.32;c*=.9+.2*dn2(p.xz*400.);}
  else if(s<5.5){/* scales: rounded plates with dark seams */
    vec2 v=pVor(vec2(p.x*2.+p.z,p.y*1.6-p.z*.6)*95.);fa=1.-smoothstep(.15,.5,length(fwidth(p.xy*95.)));c*=mix(1.,.74+.3*smoothstep(0.,.2,v.y-v.x),fa);r=.7;}
  else if(s<6.5){/* bare skin with sparse bristles */
    float b=pH(floor(p.xy*vec2(260.,210.)+p.z*150.));fa=1.-smoothstep(.3,1.,length(fwidth(p.xy*260.)));c*=.95+.1*dn2(p.xy*30.)-.22*step(.93,b)*fa;r=.6;}
  else if(s<7.5){r=.08;}
  else if(s<8.5){r=.4;}
  else{/* down: short soft feathering */c*=.85+.3*dn2(vec2(p.x*120.+p.z*80.,p.y*90.));r=.95;}
  /* rain darkens and wets the coat */
  c*=1.-.28*uWetA*step(.5,s)*step(s,2.5);r=mix(r,r*.45,uWetA);}`;
const paU={uWetA:{value:0},uGlow:{value:0}};
let PA_MAT=null;
function paMat(){if(PA_MAT)return PA_MAT;const m=new VT.THREE.MeshStandardMaterial({vertexColors:true,roughness:.8,metalness:0});if(!ANIM_MATS.includes(m))ANIM_MATS.push(m);
  m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,paU);
    sh.vertexShader=sh.vertexShader.replace("#include <common>","#include <common>\nattribute float aS;attribute vec2 aU;flat varying float vS;varying vec3 vBP;varying vec2 vU;")
      .replace("#include <begin_vertex>","#include <begin_vertex>\nvS=aS;vBP=position;vU=aU;");
    sh.fragmentShader=sh.fragmentShader.replace("#include <common>","#include <common>\nuniform float uWetA,uGlow;flat varying float vS;varying vec3 vBP;varying vec2 vU;float paR;"+GLSL_NOISE+PA_F)
      .replace("#include <color_fragment>","#include <color_fragment>\npaFray();paSurf(diffuseColor.rgb,paR);")
      .replace("#include <roughnessmap_fragment>","#include <roughnessmap_fragment>\nroughnessFactor=paR;")
      /* a scorpion's cuticle fluoresces a faint blue-green in the moonlight */
      .replace("#include <emissivemap_fragment>","#include <emissivemap_fragment>\nif(vS>3.5&&vS<4.5)totalEmissiveRadiance+=vec3(.06,.38,.3)*uGlow*(.6+.4*dot(diffuseColor.rgb,vec3(.5)));")};
  m.customProgramCacheKey=()=>"pa84";return PA_MAT=m}
function paMesh(G,R){const TH=VT.THREE,m=new TH.SkinnedMesh(G.build(),paMat());m.add(R.L[0]);m.updateMatrixWorld(true);m.bind(new TH.Skeleton(R.L));
  m.frustumCulled=false;m.castShadow=true;m.receiveShadow=true;return m}
/* bone helpers in the model frame (bones rest with no rotation, so a bone's world rotation maps its rest offsets) */
const _pa1=new V3(),_pa2=new V3(),_pa3=new V3(),_pq1=new T.Quat(),_pq2=new T.Quat(),_pm=new T.M4();
/* set bone b (parent frame pq) so that its rest direction points along dir; returns its frame in out */
function paAim(b,pq,dir,out){_pa1.copy(b.rd).applyQuaternion(pq);_pq1.setFromUnitVectors(_pa1,_pa2.copy(dir).normalize());out.copy(_pq1).multiply(pq);
  b.quaternion.copy(pq).invert().multiply(out);return out}
/* set bone b's own rotation to q (in its parent frame pq); returns its frame */
function paRot(b,pq,q,out){b.quaternion.copy(q);return out.copy(pq).multiply(q)}
/* two-bone IK: from a toward t with lengths L1, L2, the joint bent toward hint h; returns the joint position */
const _ik1=new V3(),_ik2=new V3();
function ik2(a,t,L1,L2,h,out){const d=_ik1.copy(t).sub(a),D=d.length()||1e-4;d.multiplyScalar(1/D);const Dm=cl(D,Math.abs(L1-L2)+1e-4,L1+L2-1e-4);
  const x=(L1*L1-L2*L2+Dm*Dm)/(2*Dm),y=Math.sqrt(Math.max(0,L1*L1-x*x));_ik2.copy(h).addScaledVector(d,-h.dot(d));if(_ik2.lengthSq()<1e-8)_ik2.set(0,0,-1);_ik2.normalize();
  return out.copy(a).addScaledVector(d,x).addScaledVector(_ik2,y)}
/* a two-bone limb from hip hp (in the frame pq of the bone it hangs from) to the foot target, bent toward hint */
const _lE=new V3(),_lD=new V3();
function paLimb(hp,pq,ub,lb,tgt,hint,qU,qL){const e=ik2(hp,tgt,ub.len,lb.len,hint,_lE);paAim(ub,pq,_lD.copy(e).sub(hp),qU);paAim(lb,qU,_lD.copy(tgt).sub(e),qL);return e}
/* a bone's head in the model frame, given its parent's head position pp and frame pq */
function paHead(b,pp,pq,out){return out.copy(b.position).applyQuaternion(pq).add(pp)}
/* small animals' prints share a budget so a busy gerbil can't wear out the camels' tracks */
function paPrint(k,x,z,yaw,v,dep,mir,sc){if(PA.tok<1)return;PA.tok--;prAdd(k,x,z,yaw,v,dep,mir,sc)}
/* island metres <-> an animal's model frame (its group stands at (x,gy,z) turned by yaw) */
function toM(A,p,out){const dx=p.x-A.x,dz=p.z-A.z,c=Math.cos(A.yaw),s=Math.sin(A.yaw),k=1/A.sc;return out.set((dx*c-dz*s)*k,(p.y-A.gy)*k,(dx*s+dz*c)*k)}
function toI(A,p,out){const c=Math.cos(A.yaw),s=Math.sin(A.yaw),k=A.sc;return out.set(A.x+(p.x*c+p.z*s)*k,A.gy+p.y*k,A.z+(-p.x*s+p.z*c)*k)}
/* stepping: each foot's phase in the gait cycle; in stance it holds its planted point, at lift-off it sets off for where it will
   be half way through its next stance (its rest spot under the hip, carried on by the body's speed and turn), and lands there */
function paFeet(A,dt,F,o){const v=A.v,mv=v>.015||Math.abs(A.yr)>.08;
  if(mv||F.some(f=>f.sw))A.gph=(A.gph+dt*o.freq)%1;let land=null;
  const tS=(1-o.duty)/o.freq,tH=o.duty/o.freq*.5;
  for(const f of F){const ph=(A.gph+f.ofs)%1,stance=ph<o.duty;
    if(!mv&&!f.sw&&stance)continue;
    if(stance){if(f.sw){f.sw=0;f.P.copy(f.to);f.y=f.P.y;land=f;if(o.land)o.land(f)}continue}
    const s=(ph-o.duty)/(1-o.duty);if(!f.sw){if(!mv&&s>.08)continue;f.sw=1;f.from.copy(f.P)}
    /* where it will come down: carried on by the time left in the swing plus half a stance */
    const rem=(1-s)*tS+tH,yw=A.yaw+A.yr*rem,c=Math.cos(yw),sn=Math.sin(yw),fx=Math.sin(A.yaw)*v*rem,fz=Math.cos(A.yaw)*v*rem;
    f.to.set(A.x+fx+f.nx*c+f.nz*sn,0,A.z+fz-f.nx*sn+f.nz*c);f.to.y=hTop(f.to.x,f.to.z);
    const e=s*s*(3-2*s);f.cur.lerpVectors(f.from,f.to,e);f.cur.y+=Math.sin(Math.PI*s)*o.lift*(.4+.6*cl(v/o.vRef,0,1.6));f.s=s}
  for(const f of F)if(!f.sw)f.cur.copy(f.P);
  return land}
function paFoot(nx,nz,ofs){return{nx,nz,ofs,P:new V3(),from:new V3(),to:new V3(),cur:new V3(),sw:0,s:0,y:0}}
function paPlant(A,F){for(const f of F){const c=Math.cos(A.yaw),s=Math.sin(A.yaw);f.P.set(A.x+f.nx*c+f.nz*s,0,A.z-f.nx*s+f.nz*c);f.P.y=hTop(f.P.x,f.P.z);f.cur.copy(f.P);f.sw=0}}
/* who is about: the camels, the rattlesnake, the eagle when low, the other animals and a viewer leaning in close */
const MOV=[];
function movers(){MOV.length=0;for(const a of ANIM.camels)MOV.push({x:a.x+Math.sin(a.yaw)*.6*a.sc,z:a.z+Math.cos(a.yaw)*.6*a.sc,r:1.4,k:"camel",o:a});
  const s=ANIM.rs;if(s&&s.bd&&s.g.visible&&!s.sandB)MOV.push({x:s.bd.P[0],z:s.bd.P[1],r:.5,k:"snake",o:s});
  const e=ANIM.eagle;if(e&&e.pos.y<6)MOV.push({x:e.pos.x,z:e.pos.z,r:e.mode==="perch"?1:3,k:"eagle",o:e});
  for(const o of PA.os)MOV.push({x:o.x,z:o.z,r:.6,k:"ost",o});
  for(const t of PA.tt)if(t.g.visible)MOV.push({x:t.x,z:t.z,r:.2,k:"tort",o:t});
  for(const g of PA.gb)if(g.out)MOV.push({x:g.x,z:g.z,r:.05,k:"gerb",o:g});
  if(!PA.noView&&_cl.y-hTop(_cl.x,_cl.z)<1.6)MOV.push({x:_cl.x,z:_cl.z,r:.2,k:"view",o:null});
  if(PA.dbg&&st.t<PA.dbg.until)MOV.push(PA.dbg)}
/* the nearest of the given kinds, by edge distance */
function nearMov(A,ks){let b=null,bd=1e9;for(const m of MOV){if(m.o===A||!ks.includes(m.k))continue;const d=Math.hypot(m.x-A.x,m.z-A.z)-m.r;if(d<bd){bd=d;b=m}}return b?{m:b,d:bd}:null}
const PA={os:[],tt:[],gb:[],sc:[],dbg:null,ppm:1,tok:4};
/* ---- ostriches: a cock (black, white wings and tail, pink-grey neck and shins) with his head ~2.45 m up, over a camel's hump,
   and a grey-brown hen a tenth smaller. Two-toed feet on long bare legs: the knee is up under the plumage, the joint that bends
   backward halfway down is the ankle. They walk the open sand pecking at seed and shoots, every few pecks the head comes up
   to look round; something coming at them (the eagle low, the snake, a camel or a viewer too close) and they stalk off or,
   startled, run; they sit down for the night, in hail and in a dust storm, and a hollow is left where they sat. ---- */
const OS_B=[["body",null,[0,1.15,0]],
  ["n0","body",[0,1.38,.42]],["n1","n0",[0,1.545,.465]],["n2","n1",[0,1.71,.495]],["n3","n2",[0,1.875,.505]],["n4","n3",[0,2.04,.5]],["n5","n4",[0,2.205,.485]],
  ["head","n5",[0,2.37,.47],[0,2.37,.62]],["tail","body",[0,1.24,-.52],[0,1.12,-.7]],
  ["wL","body",[.24,1.3,.12],[.26,1.1,-.42]],["wR","body",[-.24,1.3,.12],[-.26,1.1,-.42]],
  ["fL","body",[.13,1.02,0]],["kL","fL",[.16,.93,.16]],["aL","kL",[.15,.5,.02]],["tL","aL",[.14,.065,.09],[.14,.03,.27]],
  ["fR","body",[-.13,1.02,0]],["kR","fR",[-.16,.93,.16]],["aR","kR",[-.15,.5,.02]],["tR","aR",[-.14,.065,.09],[-.14,.03,.27]]];
const OS_IX=Object.fromEntries(OS_B.map((d,i)=>[d[0],i]));
function osGeo(male){const G=paGeo(),X=OS_IX,w=(a,b)=>[[X[a],.5],[X[b],.5]];
  const blk=male?[.1,.09,.085]:[.5,.45,.38],skin=male?[.78,.62,.6]:[.7,.64,.58],neck=male?[.72,.62,.62]:[.66,.6,.55],
    leg=male?[.74,.58,.54]:[.66,.6,.54],wht=male?[.93,.92,.88]:[.82,.78,.72],horn=[.84,.74,.6];
  /* the body: a deep rounded keel of loose plumes, highest at the shoulders, ragged where the plumes hang below */
  const BR=[[-.69,.04,.04,1.22],[-.6,.13,.13,1.2],[-.45,.23,.23,1.17],[-.25,.29,.28,1.15],[-.02,.31,.29,1.15],[.18,.29,.27,1.17],[.34,.23,.22,1.22],[.44,.15,.15,1.29],[.5,.07,.07,1.35]];
  G.loft(BR.map((r,i)=>({c:[0,r[3],r[0]],rx:r[1]*.96,ry:r[2]*.96,bw:X.body,
    col:(p,ca,sa)=>male?[blk[0]*.85,blk[1]*.85,blk[2]*.85]:sa<-.4?[.62,.58,.5]:[blk[0]*.9,blk[1]*.9,blk[2]*.9]})),PSK.plume,16,true,[0,1,0]);
  /* the plumage over it: rows of loose plumes laid back along the body, longer and hanging lower down the flanks and belly */
  const bAt=(z,a)=>{let i=0;while(i<BR.length-2&&BR[i+1][0]<z)i++;const r0=BR[i],r1=BR[i+1],u=cl((z-r0[0])/(r1[0]-r0[0]),0,1),
      rx=mix(r0[1],r1[1],u),ry=mix(r0[2],r1[2],u),yc=mix(r0[3],r1[3],u),ca=Math.cos(a),sa=Math.sin(a);
    return{p:[rx*ca*.97,yc+ry*sa*.97,z],n:_n3([ca/rx,sa/ry,0])}};
  const pc=(t,lo)=>male?[mix(.08,.17,t),mix(.075,.15,t),mix(.07,.13,t)]:lo?[mix(.62,.76,t),mix(.58,.72,t),mix(.5,.66,t)]:[mix(.52,.7,t),mix(.47,.65,t),mix(.4,.58,t)];
  let sd=7;const h1=()=>(sd=(sd*16807)%2147483647)/2147483647;
  /* shingled: each row overlaps the one behind it, every plume a little different in length, lie and tone, and each keeps
     some of its own facing so the coat breaks into separate layered plumes in the light instead of one smooth block */
  for(let zi=0;zi<13;zi++){const z=.44-zi*.085;for(let j=0;j<16;j++){const a=-1.15+(j+.5*(zi%2)+.3*(h1()-.5))/15.5*(Math.PI+2.3),s=bAt(z,a),lo=Math.sin(a)<0,tn=.8+.4*h1();
    const d=[s.n[0]*.35+.15*(h1()-.5),-.25-(lo?.5:.1),-.9];G.plume(s.p,d,(lo?.21:.16)+.07*h1(),.07+.025*h1(),t=>{const c=pc(t,lo);return[c[0]*tn,c[1]*tn,c[2]*tn]},X.body,lo?.07:.035,s.n,null,.5)}}
  /* over the back and shoulders a second, shorter layer of curled coverts standing a little off the coat */
  for(let zi=0;zi<8;zi++){const z=.36-zi*.11;for(let j=0;j<11;j++){const a=.15+(j+.5*(zi%2))/11*(Math.PI-.3),s=bAt(z,a),tn=.85+.35*h1(),o=.018+.01*h1();
    G.plume([s.p[0]+s.n[0]*o,s.p[1]+s.n[1]*o,s.p[2]+s.n[2]*o],[s.n[0]*.5,-.05,-.9],.1+.04*h1(),.06+.02*h1(),t=>{const c=pc(.3+.7*t,false);return[c[0]*tn,c[1]*tn,c[2]*tn]},X.body,-.012,s.n,null,.45)}}
  /* wings: folded flat on the flanks, black coverts over a fringe of long white plumes drooping from the lower and rear edge */
  for(const s of[-1,1]){const wb=s>0?X.wL:X.wR;
    G.ell([s*.285,1.2,-.03],[.05,.17,.3],(p,x,y,z)=>male?blk:[.5,.45,.38],PSK.plume,wb,12,8,(x,y,z)=>[x,y-.3*Math.max(0,-z)*Math.max(0,-z),z]);
    for(let i=0;i<15;i++){const t=i/14,b=[s*(.3+.012*Math.sin(i*2.1)),mix(1.1,1.08,t)-.08*t*t+.03*Math.sin(i*1.7),mix(.2,-.34,t)];
      G.plume(b,[s*.22,-.8,-.55-.3*t],.24+.07*Math.sin(i*2.3)+.05*t,.085,u=>male?[mix(.88,.97,u),mix(.87,.96,u),mix(.84,.93,u)]:[mix(.62,.8,u),mix(.58,.76,u),mix(.52,.7,u)],wb,.07,[s,0,0])}}
  /* tail: a spray of white plumes (the hen's dusky) */
  for(let i=0;i<10;i++){const f=(i/9-.5)*1.9;G.plume([.04*Math.sin(f),1.22,-.6],[Math.sin(f)*.55,.3-.25*Math.abs(f),-1],.28+.05*Math.cos(i*1.7),.095,
    u=>male?[mix(.88,.97,u),mix(.87,.96,u),mix(.84,.93,u)]:[mix(.64,.8,u),mix(.6,.76,u),mix(.54,.7,u)],X.tail,.11,[0,1,0])}
  /* neck: bare pink-grey skin in a sparse down, one ring at every joint shared by the two bones that meet there */
  const NK=["n0","n1","n2","n3","n4","n5","head"],NR=[.088,.068,.058,.051,.046,.042,.04],R=[];
  for(let k=0;k<NK.length-1;k++){const a=OS_B[X[NK[k]]][2],b=OS_B[X[NK[k+1]]][2];
    R.push({c:a,rx:NR[k]*1.05,ry:NR[k],bw:k?w(NK[k-1],NK[k]):w("body","n0"),col:neck,s:k<1?PSK.down:PSK.bare});
    R.push({c:[(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2],rx:(NR[k]+NR[k+1])*.52,ry:(NR[k]+NR[k+1])*.5,bw:X[NK[k]],col:neck,s:PSK.bare})}
  R.push({c:[0,2.37,.47],rx:.04,ry:.04,bw:w("n5","head"),col:neck,s:PSK.bare});G.loft(R,PSK.bare,10,false,[0,0,1]);
  /* where the neck meets the body plumage: a ruff of small plumes, white on the cock */
  for(let j=0;j<14;j++){const a=j/14*TAU,ca=Math.cos(a),sa=Math.sin(a);G.plume([ca*.08,1.41,.42+sa*.08],[ca*.7,-.7,sa*.7-.1],.1,.04,male?wht:[.6,.55,.48],w("body","n0"),.015,[ca,.3,sa])}
  /* head: a small flat skull in down, a broad flat bill, big dark eyes under a row of black lashes */
  G.ell([0,2.4,.5],[.048,.05,.066],neck,PSK.down,X.head,12,8);
  G.ell([0,2.384,.585],[.033,.016,.066],horn,PSK.skin,X.head,10,6,(x,y,z)=>[x*(1-.3*Math.max(0,z)),y,z]);
  for(const s of[-1,1]){G.ell([s*.041,2.41,.522],[.02,.021,.021],[.2,.15,.1],PSK.eye,X.head,8,6);
    G.ell([s*.043,2.429,.522],[.022,.006,.021],[.14,.13,.12],PSK.skin,X.head,8,4)}
  /* legs: a fleshy bare thigh tapering to the ankle, a scaled shank, a broad sole and the two toes, the big one clawed */
  for(const s of[-1,1]){const L=s>0?"L":"R",k=OS_B[X["k"+L]][2],a=OS_B[X["a"+L]][2],t=OS_B[X["t"+L]][2],lp=(u,v,f)=>[u[0]+(v[0]-u[0])*f,u[1]+(v[1]-u[1])*f,u[2]+(v[2]-u[2])*f];
    G.loft([{c:[k[0],k[1]+.08,k[2]-.04],rx:.1,ry:.1,bw:X["f"+L]},{c:k,rx:.095,ry:.1,bw:w("f"+L,"k"+L)},{c:lp(k,a,.3),rx:.072,ry:.08,bw:X["k"+L]},
      {c:lp(k,a,.62),rx:.052,ry:.058,bw:X["k"+L]},{c:lp(k,a,.88),rx:.04,ry:.042,bw:X["k"+L]},{c:a,rx:.038,ry:.04,bw:w("k"+L,"a"+L)}].map(r=>(r.col=skin,r)),PSK.bare,12,true,[0,0,1]);
    G.ell(a,[.04,.044,.044],skin,PSK.bare,X["a"+L],10,6);
    G.loft([{c:a,rx:.033,ry:.036,bw:X["a"+L]},{c:lp(a,t,.5),rx:.029,ry:.031,bw:X["a"+L]},{c:lp(a,t,.9),rx:.028,ry:.03,bw:X["a"+L]},{c:t,rx:.03,ry:.032,bw:w("a"+L,"t"+L)}].map(r=>(r.col=leg,r)),PSK.scale,10,false,[0,0,1]);
    G.ell([t[0],t[1]-.025,t[2]+.02],[.05,.028,.06],[leg[0]*.9,leg[1]*.9,leg[2]*.9],PSK.skin,X["t"+L],10,6);
    G.loft([{c:[t[0],t[1]-.02,t[2]+.02],rx:.032,ry:.024},{c:[t[0],.035,t[2]+.1],rx:.03,ry:.022},{c:[t[0],.027,.25],rx:.02,ry:.016}].map(r=>(r.col=leg,r.bw=X["t"+L],r)),PSK.scale,8,true);
    G.ell([t[0],.027,.27],[.012,.012,.03],[.4,.36,.33],PSK.claw,X["t"+L],6,4);
    G.loft([{c:[t[0]+s*.025,t[1]-.02,t[2]+.02],rx:.022,ry:.018},{c:[t[0]+s*.065,.03,t[2]+.08],rx:.018,ry:.015},{c:[t[0]+s*.08,.025,t[2]+.11],rx:.012,ry:.011}].map(r=>(r.col=leg,r.bw=X["t"+L],r)),PSK.scale,8,true)}
  return G}
/* the poses the neck blends between, per joint (bend forward, radians) */
const OS_NK={stand:[-.12,.06,.06,.02,-.06,.04],alert:[-.24,-.04,0,0,-.02,0],graze:[1.1,.8,.5,.12,.02,0],run:[.5,.2,.05,-.05,-.1,-.05],sit:[-.06,.05,.06,0,-.05,.05],doze:[.35,.45,.5,.4,.3,.2]};
function osSpawn(male,src){let g,m=null,B,q=null,sc;
  if(src){sc=male?1:.92;q=pgModel(src,"os",sc,{shadow:1,hen:!male,once:["sit","stand_up"]});g=q.g;B={head:q.bn.head}}
  else{const G=osGeo(male),R=paBones(OS_B);m=paMesh(G,R);g=new T.Group();sc=male?1.04:.94;g.add(m);g.scale.setScalar(sc);W.add(g);onDes(g);B=R.B}
  const A={g,m,B,male,sc,x:0,z:0,yaw:0,gy:0,v:0,yr:0,gph:0,mode:"stand",t:rr(3,6),path:null,pi:0,vmax:1,
    P:{cr:0,pit:0,gr:0,al:0,run:0,sit:0,doze:0,look:0,peck:0,wing:0,tail:0},lookT:0,lookA:0,peckT:rr(.5,1.5),scanT:rr(4,9),runT:rr(90,200),thr:null,sat:0,
    F:[paFoot(.14*sc,.09*sc,0),paFoot(-.14*sc,.09*sc,.5)]};
  A.F[0].fy=A.F[1].fy=0;
  if(q){Object.assign(A,{rig:q.rig,bn:q.bn,mdl:q.s,sw0:new V3(),sw1:new V3(),sw2:new V3(),pf:[{up:0,P:new V3(),fy:0,nx:1},{up:0,P:new V3(),fy:0,nx:-1}]});
    /* the top of the head, carried by the head bone (the bone itself starts at the base of the skull) */
    g.updateMatrixWorld(true);A.cr=q.bn.head.worldToLocal(g.localToWorld(new V3(.03,2.45,.55)));play(q.rig,"idle",.01,1)}
  return A}
function osPlace(A,x,z,yaw){Object.assign(A,{x,z,yaw,v:0,yr:0});A.gy=hTop(x,z);paPlant(A,A.F);A.F.forEach(f=>{f.fy=yaw})}
const _oq=new T.Quat(),_oq2=new T.Quat(),_oq3=new T.Quat(),_oqb=new T.Quat(),_ov=new V3(),_ov2=new V3(),_ov3=new V3(),_ov4=new V3(),_oh=new V3(0,0,-1),_oX=new V3(1,0,0),_oY=new V3(0,1,0);
const _oF=new T.Quat(),_oK=new T.Quat(),_oA=new T.Quat(),_oT=new T.Quat(),_okn=new V3(),_oan=new V3(),_omt=new V3();
function osPose(A,dt){const B=A.B,P=A.P,gp=A.gph*TAU,wk=cl(A.v/1.2,0,1)*(1-P.run),sit=P.sit;
  /* body: tips forward to graze and to run, drops to sit; it bobs and rolls a little over the stance leg */
  const gf=groundFrame(A.x,A.z,A.yaw,.4,.25),bob=(.018*Math.cos(2*gp)*wk-.035*Math.cos(2*gp)*P.run)*(1-sit);
  const by=1.15-P.cr+bob-.8*ss(0,1,sit),pit=P.pit+gf.pitch*.6*(1-sit)+.08*Math.sin(st.t*1.3)*P.doze;
  B.body.position.set(.022*Math.sin(gp)*wk*(1-sit),by,-.12*ss(0,1,sit));qYXZ(_oqb,pit,0,.03*Math.sin(gp)*wk+gf.roll*.4*(1-sit));B.body.quaternion.copy(_oqb);
  /* neck: blend of the stance poses, the look turn spread up the neck, the walk's head bob and the peck */
  const ws=Math.max(0,1-P.gr-P.al-P.run-sit),wd=sit*P.doze,N=OS_NK;let cum=pit;
  for(let k=0;k<6;k++){let a=N.stand[k]*ws+N.graze[k]*P.gr+N.alert[k]*P.al+N.run[k]*P.run+N.sit[k]*(sit-wd)+N.doze[k]*wd;
    if(k===0)a+=.06*Math.sin(2*gp+.8)*wk;if(k>=1&&k<=3)a+=P.peck*.2*P.gr;
    const b=B["n"+k];qYXZ(b.quaternion,a,k>=1&&k<=4?P.look*.25:0,0);cum+=a}
  /* the head stays near level, the bill tipped down to feed */
  qYXZ(B.head.quaternion,(-.05+1.25*P.gr+.35*P.peck*P.gr+.2*P.run+.4*wd)-cum,0,0);
  B.tail.quaternion.copy(qYXZ(_oq,-.25*P.tail-.15*P.run+.05*Math.sin(gp*2)*wk,0,0));
  for(const s of[1,-1]){const wb=s>0?B.wL:B.wR;qYXZ(wb.quaternion,-.15*P.wing*Math.sin(st.t*7+s),s*.1*P.wing,s*.7*P.wing)}
  /* legs: the planted foot holds, the knee swings under the body and the leg reaches it by bending at the ankle */
  B.body.updateMatrix();
  for(let i=0;i<2;i++){const f=A.F[i],s=i?-1:1,L=i?"R":"L",fb=B["f"+L],kb=B["k"+L],ab=B["a"+L],tb=B["t"+L];
    const hip=_ov.copy(fb.userData.rp).sub(B.body.userData.rp).applyQuaternion(_oqb).add(B.body.position);
    let sw=0;if(f.sw)sw=f.s;const ph=((A.gph+f.ofs)%1);
    const kneeRel=_ov2.copy(kb.userData.rp).sub(fb.userData.rp);
    const fs=(sit>.01?.55*ss(0,1,sit):0)+(.18*Math.sin(TAU*ph+.6)*(wk+P.run*1.6));
    qYXZ(_oq,-fs,0,0);_oq2.copy(_oqb).multiply(_oq);const knee=_okn.copy(kneeRel).applyQuaternion(_oq2).add(hip);
    /* where the toe joint must be: over the foot's point in the sand, or folded under the body to sit */
    toM(A,f.cur,_omt);_omt.y+=.065;
    if(sit>.01){const sp=_ov3.set(s*.14,.065,.32);_omt.lerp(sp,ss(0,1,sit))}
    const hint=_oh.set(0,-.25*sit,-1);
    const ank=ik2(knee,_omt,kb.len,ab.len,hint,_oan);
    paAim(fb,_oqb,_ov3.copy(knee).sub(hip),_oF);
    paAim(kb,_oF,_ov3.copy(ank).sub(knee),_oK);
    paAim(ab,_oK,_ov3.copy(_omt).sub(ank),_oA);
    /* the toes keep the heading they landed on; in the swing they turn to the new one and hang curled */
    const fy=f.sw?wrapA(f.fy0+wrapA(A.yaw-f.fy0)*ss(0,1,f.s)-A.yaw):wrapA(f.fy-A.yaw),cu=f.sw?Math.sin(Math.PI*f.s)*.9:0;
    paAim(tb,_oA,_ov3.set(Math.sin(fy+s*.05),-.19-cu,Math.cos(fy+s*.05)),_oT)}}
function osTrack(A,f){const c=Math.sin(f.fy),d=Math.cos(f.fy),r=A.P.run>.5;
  prAdd(PRK.ost,f.P.x+c*.05*A.sc,f.P.z+d*.05*A.sc,f.fy+(f.nx>0?.06:-.06),0,r?1.35:1,f.nx<0,A.sc);
  if(r||A.v>2)spPuff(f.P.x,f.P.y,f.P.z,r?5:2,-c,-d,r?1.2:.5,.8,.04)}
/* somewhere open to walk to: clear of the camels, the tent, the fire circle and the water's edge, and not a pocket walled in */
function osSpot(A,near,r){const g=navGrid("ostrich",.9,1.25,.8);
  return randFree(g,near?A.x:0,near?A.z:0,r||14,(x,z)=>navOpen(g,x,z,40)&&Math.hypot(x-FIRE.x,z-FIRE.z)>5.5&&ANIM.camels.every(c=>Math.hypot(c.x-x,c.z-z)>5)&&Math.hypot(x-TENT.x,z-TENT.z)>4.5&&PA.os.every(o=>o===A||Math.hypot(o.x-x,o.z-z)>2.5))}
function osGo(A,p,run){const g=navGrid("ostrich",.9,1.25,.8),blk=ANIM.camels.map(c=>({x:c.x,z:c.z,r:3}));
  const path=navPath(g,A.x,A.z,p.x,p.z,blk)||navPath(g,A.x,A.z,p.x,p.z);if(!path)return false;A.path=path;A.pi=1;A.mode=run?"run":"walk";A.vmax=run?rr(6,7.5):rr(.9,1.3);return true}
function osFollow(A,dt){const p=A.path[A.pi],dx=p.x-A.x,dz=p.z-A.z,d=Math.hypot(dx,dz);
  if(d<(A.mode==="run"?1.2:.4)){if(A.pi<A.path.length-1){A.pi++;return true}A.path=null;return false}
  const dy=wrapA(Math.atan2(dx,dz)-A.yaw),run=A.mode==="run";steer(A,dy,run?1.3:1.5,dt);
  const vt=A.vmax*cl(1-Math.abs(dy)/(run?1.6:1.2),.12,1)*(A.pi===A.path.length-1?cl(d/(run?6:1.5),.2,1):1);
  A.v+=(vt-A.v)*Math.min(1,dt*(vt>A.v?(run?2.2:1.5):2.6));return true}
function osUpdate(A,dt){const P=A.P,ny=st.night>.6||(st.night>.3&&st.phase==="night"),hail=WX.hf>.05||WX.hcold>0,dust=WX.dust>.5,sitW=ny||hail||dust;
  A.t-=dt;A.runT-=dt;
  /* threats: the eagle low or stooping, the snake, a camel walking up, a viewer leaning in */
  const th=nearMov(A,["eagle","snake","camel","view","dbg"]);let fear=0;
  if(th){const k=th.m.k,d=th.d;fear=k==="eagle"?ss(9,3,d)*(th.m.o&&th.m.o.mode!=="perch"?1.6:.6):k==="snake"?ss(3.5,1.2,d):k==="camel"?ss(3.5,1.5,d)*cl(th.m.o.spd||.3,.2,1):k==="view"?ss(3,1.1,d):ss(4,1,d)*1.5;
    if(fear>.15){A.thr={x:th.m.x,z:th.m.z,until:st.t+3,k}}}
  /* settle into the sitting pose or out of it */
  const wantSit=A.mode==="sit";P.sit+=((wantSit?1:0)-P.sit)*Math.min(1,dt*(wantSit?.55:.9));
  if(!wantSit&&A.sat&&P.sit<.4){prAdd(PRK.pal,A.x-Math.sin(A.yaw)*.05,A.z-Math.cos(A.yaw)*.05,A.yaw,0,.85,0,2.3*A.sc);A.sat=0}
  if(wantSit&&P.sit>.9)A.sat=1;
  /* away from the threat, swinging wider to either side when the rim or the water is in the way */
  const fleeFrom=(r)=>{const t=A.thr,a0=Math.atan2(A.x-t.x,A.z-t.z),g=navGrid("ostrich",.9,1.25,.8),D=r?9:4,d0=Math.hypot(A.x-t.x,A.z-t.z),ck=navCompAt(g,A.x,A.z);
    for(const far of[D*.65,0])for(const da of[0,.6,-.6,1.2,-1.2,1.8,-1.8]){const a=a0+da,p=randFree(g,A.x+Math.sin(a)*D,A.z+Math.cos(a)*D,r?5:2.5,
      (x,z)=>Math.hypot(x-t.x,z-t.z)>d0+2&&Math.hypot(x-A.x,z-A.z)>far&&(ck<0||navCompAt(g,x,z)===ck));
      if(p&&osGo(A,p,r))return true}
    /* boxed in (water, rim, camels): any open stretch that gains distance, in a straight line */
    for(const D2 of[D,D*.6,2.2])for(let k=0;k<12;k++){const a=a0+(k&1?-1:1)*Math.ceil(k/2)*TAU/12,x=A.x+Math.sin(a)*D2,z=A.z+Math.cos(a)*D2;
      let clear=Math.hypot(x-t.x,z-t.z)>d0+.8;for(let u=1;u<=6&&clear;u++)clear=navFree(g,A.x+Math.sin(a)*D2*u/6,A.z+Math.cos(a)*D2*u/6);
      if(clear){A.path=[{x:A.x,z:A.z},{x,z}];A.pi=1;A.mode=r?"run":"walk";A.vmax=r?rr(6,7.5):rr(.9,1.3);return true}}
    return false};
  switch(A.mode){
    case"sit":A.v*=Math.exp(-dt*6);if(fear>.9&&P.sit>.8&&!hail){A.mode="stand";A.t=.5;break}
      if(!sitW&&A.t<0){A.mode="stand";A.t=rr(2,4)}P.doze+=((ny&&fear<.2?1:0)-P.doze)*ease(.3,dt);break;
    case"stand":case"graze":case"alert":{A.v*=Math.exp(-dt*5);A.yr*=Math.exp(-dt*4);
      if(sitW&&A.mode!=="alert"){A.mode="sit";A.t=rr(20,40);break}
      if(fear>.55&&A.thr){if(!fleeFrom(fear>1.1||A.thr.k==="eagle"))A.mode="alert";break}
      if(fear>.2&&A.mode!=="alert"){A.mode="alert";A.t=rr(2,4);break}
      if(A.mode==="graze"){A.peckT-=dt;A.scanT-=dt;
        if(A.scanT<0){A.mode="alert";A.t=rr(1.5,3);A.scanT=rr(4,10);break}
        /* a few steps on to the next patch */
        if(A.peckT<-1.5){A.peckT=rr(.4,1.4);const p=osSpot(A,true,1.6);if(p&&rnd()<.35){osGo(A,p,false);A.vmax=rr(.25,.45);A.mode="walk";A.then="graze";break}}}
      if(A.t<0){if(A.mode==="alert"&&fear>.2){A.t=1;break}
        const r=rnd();if(A.runT<0&&!WX.rain){A.runT=rr(120,240);const p=osSpot(A,false,14);if(p&&Math.hypot(p.x-A.x,p.z-A.z)>8&&osGo(A,p,true))break}
        if(r<.45){A.mode="graze";A.t=rr(8,20);A.peckT=rr(.3,1);A.scanT=rr(3,8)}
        else if(r<.85){const p=osSpot(A,true,9);if(p&&osGo(A,p,false)){A.then=rnd()<.6?"graze":"stand";break}A.mode="stand";A.t=rr(2,4)}
        else{A.mode="stand";A.t=rr(3,7)}}break}
    case"walk":case"run":{if(sitW&&A.mode==="walk"&&!hail){A.path=null;A.mode="sit";A.t=rr(20,40);break}
      if(A.mode==="walk"&&fear>.55&&A.thr&&A.thr.until>st.t&&!A.fled){A.fled=1;if(fleeFrom(fear>1.1))break}
      if(!A.path||!osFollow(A,dt)){A.fled=0;A.path=null;A.mode=A.then||"stand";A.then=null;A.t=A.mode==="graze"?rr(6,16):rr(1.5,4);if(A.mode==="graze"){A.peckT=rr(.3,1);A.scanT=rr(3,8)}}
      break}}
  A.x+=Math.sin(A.yaw)*A.v*dt;A.z+=Math.cos(A.yaw)*A.v*dt;A.gy+=(hTop(A.x,A.z)-A.gy)*Math.min(1,dt*10);
  /* targets for the pose */
  const gr=A.mode==="graze"?1:0,al=A.mode==="alert"||(fear>.15&&A.mode!=="run")?1:0,ru=A.mode==="run"?ss(2,5,A.v):0;
  const kq=ease(A.mode==="alert"?4:2.2,dt);P.gr+=(gr-P.gr)*kq;P.al+=(al*(1-P.sit)-P.al)*kq;P.run+=(ru-P.run)*ease(3,dt);
  P.pit+=((gr?.5:0)+.2*P.run+(A.mode==="walk"?.06:0)-P.pit)*ease(2,dt);P.cr+=((gr?.13:0)+.05*cl(A.v,0,1)+.08*P.run-P.cr)*ease(2,dt);
  if(gr){P.peck+=((Math.sin(st.t*5.3+A.sc*7)>.35&&A.peckT>0?1:0)-P.peck)*ease(9,dt)}else P.peck*=Math.exp(-dt*8);
  /* where it looks: the threat, now and then the viewer, or a slow scan */
  A.lookT-=dt;if(A.lookT<0){A.lookT=rr(1.2,3.5);A.lookA=rr(-.9,.9)*(gr?.3:1)}
  let la=A.lookA;if(A.thr&&A.thr.until>st.t)la=cl(wrapA(Math.atan2(A.thr.x-A.x,A.thr.z-A.z)-A.yaw),-1.4,1.4);
  P.look+=(la*(1-P.run)-P.look)*ease(A.mode==="alert"?5:2,dt);
  P.tail+=((al?.8:0)+.5*P.run-P.tail)*ease(3,dt);P.wing+=((P.run>.3?.9:0)+(fear>1?.4:0)-P.wing)*ease(4,dt);
  /* the feet: walk .55+.25 v steps a second, the stance share shrinking from .62 walking to .36 at a run */
  if(A.mode==="sit"&&P.sit>.3){for(const f of A.F)if(f.sw){f.sw=0;f.P.copy(f.cur)}}
  else{const v=A.v,freq=.55+.25*v,duty=mix(.62,.36,ss(1.5,5,v));
    for(const f of A.F)if(!f.sw)f.fy0=f.fy;
    const land=paFeet(A,dt,A.F,{freq,duty,lift:.13+.05*ss(2,6,v),vRef:1.2,land:f=>{f.fy=A.yaw;if(!A.rig||!A.g.visible)osTrack(A,f)}});void land}
  A.g.position.set(A.x,A.gy,A.z);A.g.rotation.y=A.yaw;if(!A.rig)osPose(A,dt);else if(A.g.visible)osAnim(A,dt)}
function osLoad(){return pgGet("os").then(src=>{const g=navGrid("ostrich",.9,1.25,.8);
  for(const male of[true,false]){const A=osSpawn(male,src);PA.os.push(A);const p=osSpot(A,false,13)||randFree(g,0,0,14)||{x:2,z:2};osPlace(A,p.x,p.z,rr(-3,3))}
  if(PA.os.length===2){const[a,b]=PA.os,p=randFree(g,a.x,a.z,4,(x,z)=>Math.hypot(x-a.x,z-a.z)>2.2);if(p)osPlace(b,p.x,p.z,a.yaw+rr(-1,1))}})}
/* ---- desert tortoises: a high-domed shell 30 cm long, each scute ringed with growth lines round a paler areola; thick scaled
   forelegs bowed out at the elbow, column hind legs, a blunt beaked head. They plod at 7 cm/s, a lateral-sequence walk (left
   hind, left fore, right hind, right fore) rocking the shell, crop the dry tufts by day, drink when it rains, and pull head and
   legs in when hail falls, at night or when something big comes close. In the noon heat they walk into the nearest shade and
   scrape out a shallow pallet there to lie in. ---- */
const TO_B=[["body",null,[0,.07,0]],["neck","body",[0,.065,.095]],["head","neck",[0,.074,.168],[0,.074,.23]],["tail","body",[0,.05,-.13],[0,.035,-.17]],
  ["uLF","body",[.075,.06,.085]],["lLF","uLF",[.132,.05,.1],[.128,.006,.122]],["uRF","body",[-.075,.06,.085]],["lRF","uRF",[-.132,.05,.1],[-.128,.006,.122]],
  ["uLH","body",[.068,.055,-.08]],["lLH","uLH",[.112,.045,-.098],[.108,.006,-.112]],["uRH","body",[-.068,.055,-.08]],["lRH","uRH",[-.112,.045,-.098],[-.108,.006,-.112]]];
const TO_IX=Object.fromEntries(TO_B.map((d,i)=>[d[0],i]));
function torGeo(){const G=paGeo(),X=TO_IX,w=(a,b)=>[[X[a],.5],[X[b],.5]],sk=[.5,.45,.38],skD=[.42,.37,.31];
  /* shell: domed carapace over a flat plastron, the marginals flaring a little at the back and notched over the neck */
  G.ell([0,.04,0],[.115,.1,.15],(p,x,y,z)=>y<-.05?[.78,.7,.52]:[.56,.45,.3],PSK.shell,X.body,30,16,(x,y,z)=>{
    if(y<0)return[x*.94,y*.16,z*.94];const e=1-y;return[x*(1+.05*e*e*(z<-.3?1.6:1)),Math.pow(y,.82)*(1-.12*Math.max(0,z)*Math.max(0,z))-.06*Math.exp(-x*x*40)*Math.max(0,z-.8)*5,z*(1+.05*e*e)]});
  /* the head on its wrinkled neck: a broad blunt skull, a horny beak, dark eyes */
  G.loft([{c:[0,.064,.085],rx:.025,ry:.023,bw:w("body","neck")},{c:[0,.067,.125],rx:.022,ry:.021,bw:X.neck},{c:[0,.072,.16],rx:.021,ry:.02,bw:w("neck","head")}].map(r=>(r.col=sk,r)),PSK.scale,12,false,[0,1,0]);
  G.ell([0,.077,.19],[.026,.024,.035],sk,PSK.scale,X.head,12,8,(x,y,z)=>[x,y*(1-.15*Math.max(0,z)),z]);
  G.ell([0,.069,.219],[.015,.012,.012],[.5,.44,.36],PSK.skin,X.head,8,6);
  for(const s of[-1,1])G.ell([s*.02,.084,.203],[.0065,.0065,.0065],[.16,.12,.08],PSK.eye,X.head,6,4);
  /* legs: the forelegs flattened and plated in big scales, the hind legs round columns; nails on the front of each foot */
  for(const s of[-1,1])for(const hd of[0,1]){const L=(s>0?"L":"R")+(hd?"H":"F"),u=TO_B[X["u"+L]],l=TO_B[X["l"+L]],a=u[2],b=l[2],f=l[3];
    G.loft([{c:a,rx:.024,ry:.02,bw:w("body","u"+L)},{c:b,rx:hd?.022:.025,ry:hd?.022:.016,bw:w("u"+L,"l"+L)},{c:[(b[0]+f[0])/2,(b[1]+f[1])/2,(b[2]+f[2])/2],rx:hd?.021:.024,ry:hd?.021:.015,bw:X["l"+L]},{c:f,rx:.02,ry:.016,bw:X["l"+L]}]
      .map(r=>(r.col=sk,r)),PSK.scale,10,true,hd?[0,0,1]:[0,0,1]);
    G.ell([f[0],.011,f[2]+.004],[.021,.011,.022],skD,PSK.scale,X["l"+L],10,6);
    const n=hd?4:5;for(let i=0;i<n;i++){const t=(i/(n-1)-.5)*1.3;G.ell([f[0]+Math.sin(t)*.016,.007,f[2]+.02*Math.cos(t)+.002],[.0035,.0032,.008],[.5,.45,.38],PSK.claw,X["l"+L],5,3)}}
  G.ell([0,.045,-.148],[.009,.009,.02],sk,PSK.scale,X.tail,6,4);
  return G}
function torSpawn(src){let g,m=null,B=null,q=null;
  if(src){q=pgModel(src,"tt",1,{shadow:1,once:["head_withdraw","head_out"]});g=q.g;play(q.rig,"idle",.01,1)}
  else{const G=torGeo(),R=paBones(TO_B);m=paMesh(G,R);g=new T.Group();g.add(m);W.add(g);onDes(g);B=R.B}
  const A={g,m,B,rig:q&&q.rig,bn:q&&q.bn,hoT:0,sc:1,x:0,z:0,yaw:0,gy:0,v:0,yr:0,gph:0,mode:"graze",t:rr(5,10),path:null,pi:0,sink:0,
    P:{wd:0,gr:0,bite:0,look:0,lift:0,dig:0,dr:0},bt:0,lookT:0,lookA:0,
    /* lateral sequence: left hind, left fore, right hind, right fore a quarter cycle apart */
    F:[paFoot(.128,.122,.25),paFoot(-.128,.122,.75),paFoot(.108,-.112,0),paFoot(-.108,-.112,.5)]};
  A.F.forEach((f,i)=>{f.hind=i>1?1:0});return A}
function torPlace(A,x,z,yaw){Object.assign(A,{x,z,yaw,v:0,yr:0});A.gy=hTop(x,z);paPlant(A,A.F)}
const _tqb=new T.Quat(),_tqU=new T.Quat(),_tqL=new T.Quat(),_tqn=new T.Quat(),_tv1=new V3(),_tv2=new V3(),_tv3=new V3(),_tvh=new V3(),_tbp=new V3();
function torPose(A){const B=A.B,P=A.P,wd=P.wd,gp=A.gph*TAU,mv=cl(A.v/.07,0,1);
  const gf=groundFrame(A.x,A.z,A.yaw,.12,.1);
  _tbp.set(.004*Math.sin(gp*2)*mv,.07-.026*wd-.02*P.dig-.004*Math.abs(Math.sin(gp*2))*mv+.012*P.lift,0);B.body.position.copy(_tbp);
  qYXZ(_tqb,gf.pitch-.12*P.dig+.05*P.lift,0,gf.roll+.045*Math.sin(gp*2+.5)*mv);B.body.quaternion.copy(_tqb);
  /* head: out and looking about, down to crop or to drink, or drawn back into the shell */
  B.neck.position.set(0,-.005-.008*wd,.095-.08*wd+.012*(1-wd)*(1-P.gr));
  qYXZ(B.neck.quaternion,.35*P.gr+.5*P.dr-.15*(1-wd)*(1-P.gr)*(1-P.dr),P.look*.5,0);
  qYXZ(B.head.quaternion,.35*P.gr+.35*P.dr+.12*P.bite+.15*wd,P.look*.5,0);
  B.tail.quaternion.copy(qYXZ(_tqn,-.2*wd,0,0));
  /* legs: planted feet, or tucked in under the shell rim, or scraping sand back under the body */
  for(let i=0;i<4;i++){const f=A.F[i],hd=f.hind,L=(f.nx>0?"L":"R")+(hd?"H":"F"),ub=B["u"+L],lb=B["l"+L],s=f.nx>0?1:-1;
    const hp=paHead(ub,_tbp,_tqb,_tv1);toM(A,f.cur,_tv2);_tv2.y+=.006;
    if(P.dig>.01&&!hd){const ph=st.t*2.6+(s>0?0:Math.PI),sw=.5+.5*Math.sin(ph);_tv2.lerp(_tv3.set(s*.12,.008+.02*Math.max(0,Math.cos(ph)),.13-.09*sw),P.dig)}
    if(wd>.01)_tv2.lerp(_tv3.set(s*(hd?.07:.06),.03,hd?-.085:.1),ss(0,1,wd));
    paLimb(hp,_tqb,ub,lb,_tv2,_tvh.set(s,hd?.6:1.2,hd?-.4:.3),_tqU,_tqL)}}
/* the nearest shade big enough for a tortoise: north of a rock, a palm, the tent */
function torShade(A){const g=navGrid("tort",.18,1.12,.82);let best=null;
  const cand=OBST.filter(o=>(o.k==="rock"&&o.r>=.35)||o.k==="shrub").map(o=>({x:o.x+SHADE.x*(o.r+.2),z:o.z+SHADE.z*(o.r+.2)})).concat(PALMS.map(p=>({x:p.x+SHADE.x*.8,z:p.z+SHADE.z*.8})));
  for(const c of cand){if(!navFree(g,c.x,c.z))continue;const d=Math.hypot(c.x-A.x,c.z-A.z)+(PA.tt.some(o=>o!==A&&o.home&&Math.hypot(o.home.x-c.x,o.home.z-c.z)<1)?50:0);if(!best||d<best.d)best={x:c.x,z:c.z,d}}
  return best}
function torGo(A,p,mode){const g=navGrid("tort",.18,1.12,.82),path=navPath(g,A.x,A.z,p.x,p.z);if(!path)return false;A.path=path;A.pi=1;A.mode=mode||"walk";return true}
function torFood(A){const L=PINS.filter(o=>Math.hypot(o.x-A.x,o.z-A.z)<9&&pN(o.x,o.z)>1.3);const o=L.length?pick(L):null;if(!o)return randFree(navGrid("tort",.18,1.12,.82),A.x,A.z,4);
  return randFree(navGrid("tort",.18,1.12,.82),o.x,o.z,.8)||{x:o.x,z:o.z}}
function torUpdate(A,dt,cam){const P=A.P,ny=st.night>.55,hail=WX.hf>.05||WX.hcold>0,hot=WX.heat>.55&&st.phase==="day",rain=WX.rain>.15;
  A.t-=dt;const th=nearMov(A,["camel","ost","snake","view","eagle","dbg"]);let fear=0;
  if(th){const k=th.m.k;fear=k==="camel"||k==="ost"?ss(1.2,.4,th.d):k==="eagle"?ss(3,1,th.d):ss(.8,.25,th.d)}
  const tuck=hail||fear>.4||A.mode==="sleep";
  switch(A.mode){
    case"shell":A.v*=Math.exp(-dt*8);if(tuck&&A.mode!=="sleep")A.t=Math.max(A.t,rr(6,12));if(A.t<0){A.mode=ny?"sleep":"graze";A.t=rr(5,10)}break;
    case"sleep":case"pallet":A.v*=Math.exp(-dt*8);if(fear>.4){A.mode="shell";A.t=rr(8,14);break}
      if(A.mode==="sleep"&&!ny&&A.t<0){A.mode="graze";A.t=rr(4,8)}if(A.mode==="pallet"&&!hot&&A.t<0){A.mode="graze";A.t=rr(4,8)}break;
    case"dig":A.v*=Math.exp(-dt*8);A.sink=Math.min(1,A.sink+dt/18);A.pt=(A.pt||0)-dt;
      if(A.pt<0){A.pt=rr(.3,.6);const s=rnd()<.5?1:-1,c=Math.cos(A.yaw),sn=Math.sin(A.yaw);spPuff(A.x+(s*.12*c+.08*sn),A.gy+.01,A.z+(-s*.12*sn+.08*c),3,s*c-sn*.4,-s*sn-c*.4,.35,.4,.012)}
      if(A.sink>=1){A.mode="pallet";A.t=rr(40,90);prAdd(PRK.pal,A.x,A.z,A.yaw,0,.7,0,.95)}if(hail||fear>.4){A.mode="shell";A.t=rr(8,14)}break;
    default:{if(hail||fear>.4){A.mode="shell";A.t=rr(8,15);A.path=null;break}
      if(ny&&A.mode!=="walk"){A.mode="sleep";A.t=rr(30,60);break}
      if(hot&&!A.inShade){let s=torShade(A);A.inShade=1;if(!s||s.d>6)s={x:A.x,z:A.z};A.home=s;if(Math.hypot(s.x-A.x,s.z-A.z)>.3){if(torGo(A,s,"walk"))A.then="dig"}else{A.mode="dig";A.sink=0}break}
      if(!hot)A.inShade=0;
      if(A.mode==="walk"){if(!A.path||!torFollow(A,dt)){A.path=null;A.mode=A.then||"graze";A.then=null;A.t=rr(6,14)}break}
      if(A.mode==="graze"||A.mode==="drink"){A.v*=Math.exp(-dt*6);A.bt-=dt;if(A.bt<0){A.bt=rr(.8,2.2);A.bite=1}
        if(A.t<0){const p=rain?randFree(navGrid("tort",.18,1.12,.82),A.x,A.z,1.5):torFood(A);if(p&&torGo(A,p,"walk"))A.then=rain?"drink":"graze";else A.t=rr(3,6)}}}}
  /* pose targets */
  const wdT=A.mode==="shell"||A.mode==="sleep"?1:A.mode==="pallet"?.55:0;P.wd+=(wdT-P.wd)*ease(wdT>P.wd?5:.45,dt);
  P.gr+=((A.mode==="graze"?1:0)-P.gr)*ease(2,dt);P.dr+=((A.mode==="drink"?1:0)-P.dr)*ease(2,dt);P.dig+=((A.mode==="dig"?1:0)-P.dig)*ease(2,dt);
  A.bite*=Math.exp(-dt*5);P.bite=A.bite>.5?Math.sin((1-A.bite)*Math.PI*2):0;
  P.lift+=((A.mode==="walk"?1:0)-P.lift)*ease(1.5,dt);
  A.lookT-=dt;if(A.lookT<0){A.lookT=rr(2,6);A.lookA=rr(-.6,.6)}P.look+=(A.lookA*(1-P.wd)-P.look)*ease(1.2,dt);
  A.x+=Math.sin(A.yaw)*A.v*dt;A.z+=Math.cos(A.yaw)*A.v*dt;A.gy+=(hTop(A.x,A.z)-.03*A.sink*(A.mode==="pallet"||A.mode==="dig"?1:0)-A.gy)*Math.min(1,dt*6);
  if(A.mode!=="dig"&&A.mode!=="pallet")A.sink=0;
  /* the feet: about .7 strides a second at its plod, each foot on the ground three quarters of the time */
  if(P.wd<.3&&P.dig<.3)paFeet(A,dt,A.F,{freq:.35+6*A.v,duty:.75,lift:.022,vRef:.07,land:f=>paPrint(PRK.tort,f.P.x,f.P.z,A.yaw,f.hind,.9,f.nx<0,1)});
  const D=Math.max(.05,cam.distanceTo(A.g.position));A.g.visible=.3*PA.ppm/D>2.5;
  A.g.position.set(A.x,A.gy,A.z);A.g.rotation.y=A.yaw;if(A.g.visible)A.rig?torAnim(A,dt):torPose(A);
  /* its contact shadow under the plastron */
  if(A.g.visible){const k=sunCast();blobAdd(A.x,A.gy,A.z,A.yaw,.14,.17,.35+.25*k,.6,0)}}
function torFollow(A,dt){const p=A.path[A.pi],dx=p.x-A.x,dz=p.z-A.z,d=Math.hypot(dx,dz);
  if(d<.12){if(A.pi<A.path.length-1){A.pi++;return true}A.path=null;return false}
  const dy=wrapA(Math.atan2(dx,dz)-A.yaw);steer(A,dy,.45,dt);const vt=.07*cl(1-Math.abs(dy)/1.,.1,1);A.v+=(vt-A.v)*Math.min(1,dt*1.5);return true}
function torLoad(){return pgGet("tt").then(src=>{const g=navGrid("tort",.18,1.12,.82);
  for(let i=0;i<2;i++){const A=torSpawn(src);PA.tt.push(A);const o=PINS.filter(p=>pN(p.x,p.z)>1.5)[i*3+1]||{x:0,z:0};const p=randFree(g,o.x,o.z,1.2)||randFree(g,0,0,12)||{x:1,z:1};torPlace(A,p.x,p.z,rr(-3,3))}})}
/* ---- gerbils: 10 cm of sandy-orange back over a white belly, a 12 cm tail ending in a dark tuft, big black eyes and long
   hind feet. Each lives at a burrow (a hole with its spoil heaped beside it) by a patch of dry tufts. Out at dawn, dusk and
   through the night, below ground in the heat of the day and in rain, hail or a dust storm. Out, it darts about in bursts of
   hops, stops to nibble seed, sits up on its hind feet to scan, and at anything coming (the snake, the eagle, an ostrich, a
   camel, a viewer leaning in) it bolts for its hole and dives in with a spurt of sand, peeking out again a while later. ---- */
const GB_B=[["body",null,[0,.03,0]],["chest","body",[0,.032,.035]],["head","chest",[0,.04,.068],[0,.037,.11]],
  ["t0","body",[0,.028,-.032]],["t1","t0",[0,.022,-.065]],["t2","t1",[0,.016,-.1]],["t3","t2",[0,.013,-.135],[0,.012,-.165]],
  ["hL","body",[.017,.026,-.012]],["sL","hL",[.021,.013,-.004]],["fL","sL",[.02,.004,-.014],[.02,.002,.017]],
  ["hR","body",[-.017,.026,-.012]],["sR","hR",[-.021,.013,-.004]],["fR","sR",[-.02,.004,-.014],[-.02,.002,.017]],
  ["aL","chest",[.011,.024,.045]],["pL","aL",[.012,.006,.05],[.012,.002,.058]],["aR","chest",[-.011,.024,.045]],["pR","aR",[-.012,.006,.05],[-.012,.002,.058]]];
const GB_IX=Object.fromEntries(GB_B.map((d,i)=>[d[0],i]));
function gbGeo(){const G=paGeo(),X=GB_IX,w=(a,b)=>[[X[a],.5],[X[b],.5]],back=[.8,.63,.44],bel=[.95,.93,.88],pink=[.92,.74,.7],ft=[.93,.88,.8];
  const col=(p,ca,sa)=>sa<-.25?bel:sa<.1?[mix(bel[0],back[0],ss(-.25,.1,sa)),mix(bel[1],back[1],ss(-.25,.1,sa)),mix(bel[2],back[2],ss(-.25,.1,sa))]:[back[0]*(1-.12*sa),back[1]*(1-.14*sa),back[2]*(1-.16*sa)];
  G.loft([[-.04,.012,.011,.03,X.body],[-.03,.021,.021,.03,X.body],[-.012,.026,.025,.031,X.body],[.008,.024,.023,.032,X.body],[.028,.02,.02,.034,w("body","chest")],[.048,.016,.016,.037,X.chest],[.062,.012,.013,.04,w("chest","head")]]
    .map(r=>({c:[0,r[3],r[0]],rx:r[1],ry:r[2],bw:r[4],col})),PSK.fur,14,true,[0,1,0]);
  /* head: a rounded skull tapering to a blunt pink-nosed snout, big dark eyes ringed pale, round ears */
  G.ell([0,.043,.083],[.0155,.0155,.024],(p,x,y,z)=>y<-.3?bel:Math.hypot(x,z-.3)<.0?bel:back,PSK.fur,X.head,12,8,(x,y,z)=>[x*(1-.45*Math.max(0,z)),y*(1-.35*Math.max(0,z)),z]);
  G.ell([0,.039,.106],[.0033,.003,.003],pink,PSK.skin,X.head,6,4);
  for(const s of[-1,1]){G.ell([s*.0095,.0475,.087],[.0062,.0062,.0062],[.97,.93,.86],PSK.fur,X.head,8,6);G.ell([s*.0112,.0478,.0885],[.0052,.0055,.0055],[.06,.05,.05],PSK.eye,X.head,8,6);
    G.ell([s*.0105,.058,.072],[.0055,.0085,.0022],(p,x,y,z)=>z>0?pink:back,PSK.skin,X.head,8,5,(x,y,z)=>[x*Math.cos(.5)-z*Math.sin(.5)*s,y,x*Math.sin(.5)*s+z*Math.cos(.5)])}
  /* tail: thin, furred, the last third a dark brush */
  G.loft([{c:[0,.028,-.032],rx:.0045,ry:.0045,bw:w("body","t0")},{c:[0,.022,-.065],rx:.0035,ry:.0035,bw:w("t0","t1")},{c:[0,.016,-.1],rx:.003,ry:.003,bw:w("t1","t2")},{c:[0,.013,-.135],rx:.0028,ry:.0028,bw:w("t2","t3")},{c:[0,.012,-.16],rx:.002,ry:.002,bw:X.t3}]
    .map(r=>(r.col=back,r)),PSK.fur,6,true);
  G.ell([0,.012,-.152],[.0048,.0048,.017],[.32,.24,.17],PSK.fur,X.t3,8,6);
  /* hind legs: a haunch, the shank, the long pale-furred foot; the forelegs short, with small pink hands */
  for(const s of[-1,1]){const L=s>0?"L":"R",h=GB_B[X["h"+L]][2],k=GB_B[X["s"+L]][2],f=GB_B[X["f"+L]][2],tp=GB_B[X["f"+L]][3];
    G.ell([h[0],h[1]-.004,h[2]-.002],[.0095,.012,.015],col,PSK.fur,w("body","h"+L),10,6);
    G.loft([{c:h,rx:.005,ry:.005,bw:X["h"+L]},{c:k,rx:.0035,ry:.0035,bw:w("h"+L,"s"+L)},{c:f,rx:.003,ry:.003,bw:w("s"+L,"f"+L)}].map(r=>(r.col=bel,r)),PSK.fur,6,false,[0,0,1]);
    G.loft([{c:f,rx:.0034,ry:.003,bw:X["f"+L]},{c:[f[0],.003,f[2]+.016],rx:.003,ry:.0022,bw:X["f"+L]},{c:tp,rx:.0022,ry:.0015,bw:X["f"+L]}].map(r=>(r.col=ft,r)),PSK.fur,6,true);
    const a=GB_B[X["a"+L]][2],pw=GB_B[X["p"+L]][2];
    G.loft([{c:a,rx:.0035,ry:.0035,bw:w("chest","a"+L)},{c:pw,rx:.0022,ry:.0022,bw:w("a"+L,"p"+L)}].map(r=>(r.col=bel,r)),PSK.fur,6,false,[0,0,1]);
    G.ell([pw[0],.004,pw[2]+.004],[.0028,.0018,.004],pink,PSK.skin,X["p"+L],6,4)}
  return G}
/* burrows, by tufts away from the water and the camels' beat */
const GB_H=[];
function gbHoles(){if(GB_H.length)return GB_H;const g=navGrid("gerb",.15,1.4,.8);
  const C=PINS.filter(o=>pN(o.x,o.z)>1.6&&Math.hypot(o.x-TENT.x,o.z-TENT.z)>5&&REST.every(r=>Math.hypot(o.x-r.x,o.z-r.z)>4)).sort((a,b)=>Math.hypot(a.x,a.z)-Math.hypot(b.x,b.z));
  for(const o of C){if(GB_H.length>=3)break;if(GB_H.some(h=>Math.hypot(h.x-o.x,h.z-o.z)<5))continue;const p=randFree(g,o.x,o.z,.8);if(!p)continue;
    GB_H.push({x:p.x,z:p.z,yaw:rr(-3,3),t:0})}
  for(const h of GB_H)gbStamp(h);return GB_H}
/* a hole is a print that never quite wears out: it is pressed again before the wind can fill it */
function gbStamp(h){prAdd(PRK.hole,h.x,h.z,h.yaw,0,1,0,1);h.t=0}
function gbSpawn(h,src){let g,m=null,B=null,q=null;
  if(src){q=pgModel(src,"gb",GB_SC,{});g=q.g;play(q.rig,"idle",.01,1)}
  else{const G=gbGeo(),R=paBones(GB_B);m=paMesh(G,R);g=new T.Group();g.add(m);W.add(g);onDes(g);B=R.B}
  return{g,m,B,rig:q&&q.rig,bn:q&&q.bn,sc:1,h,x:h.x,z:h.z,yaw:h.yaw,gy:hTop(h.x,h.z),v:0,yr:0,hph:0,hop:0,mode:"in",t:rr(1,6),out:false,emerge:0,goal:null,
    P:{up:0,nib:0,crouch:0,look:0,lp:0,in:1},lookT:0,lookA:0,nibT:0}}
const _gq=new T.Quat(),_gq2=new T.Quat(),_gqb=new T.Quat(),_gqc=new T.Quat(),_gv=new V3();
function gbPose(A){const B=A.B,P=A.P,hp=A.hph,air=A.v>.05?Math.sin(Math.PI*hp):0,up=P.up,kick=A.v>.05?1:0;
  /* the hop: body arcs, hind legs drive back at take-off and swing forward to land, forepaws reach ahead */
  const ex=kick*Math.sin(TAU*hp),body_y=.03+.018*air*cl(A.v/1,0,1.2)+.026*up-.008*P.crouch-.05*P.in;
  B.body.position.set(0,body_y+.006*P.nib,0);qYXZ(_gqb,-.15*ex*kick-1.15*up+.12*P.crouch-.6*P.nib,0,0);B.body.quaternion.copy(_gqb);
  qYXZ(B.chest.quaternion,-.1*ex*kick-.25*up-.2*P.nib,0,0);
  qYXZ(B.head.quaternion,.08*kick+1.05*up+.55*P.nib+.12*P.nib*Math.max(0,Math.sin(st.t*13))-.1+.15*P.crouch,P.look*(1-.6*P.nib),0);
  for(let i=0;i<4;i++)qYXZ(B["t"+i].quaternion,(i?-.12:-.25)+.18*up+.05*Math.sin(st.t*3+i)*(1-kick)+.12*ex*kick,.12*Math.sin(st.t*1.7+i*.8)*(1-up),0);
  for(const s of[1,-1]){const L=s>0?"L":"R";
    qYXZ(B["h"+L].quaternion,.7*ex*kick+.35*up+.25*P.crouch+.45*P.nib,0,0);qYXZ(B["s"+L].quaternion,-.9*ex*kick+.5*up-.3*P.crouch+.1*P.nib,0,0);
    qYXZ(B["f"+L].quaternion,.5*ex*kick+.3*up+.05*P.nib,0,0);
    qYXZ(B["a"+L].quaternion,-.9*ex*kick-.55*up-1.25*P.nib,0,s*(.1-.2*P.nib));qYXZ(B["p"+L].quaternion,-.4*up-.5*P.nib,0,0)}}
function gbThreat(A){const th=nearMov(A,["snake","eagle","ost","camel","tort","view","dbg"]);if(!th)return 0;const k=th.m.k,d=th.d;
  return k==="eagle"?ss(10,4,d):k==="camel"||k==="ost"?ss(3,1.2,d):k==="view"?ss(.6,.22,d):k==="tort"?ss(.4,.15,d):ss(2.2,.8,d)}
function gbUpdate(A,dt,cam){const P=A.P,h=A.h,calm=WX.rain<.08&&WX.hf<.02&&!WX.hcold&&WX.dust<.4&&WX.sf<.1,act=(st.phase!=="day"||st.night>.25)&&calm;
  const vw=nearMov(A,["view"]),watched=vw&&vw.d<1.6;
  A.t-=dt;const fear=A.mode==="in"?0:gbThreat(A);if(fear>.35&&A.mode!=="in"&&A.mode!=="bolt"&&A.mode!=="dive"){A.mode="bolt";A.t=3}
  const toH=()=>{const dx=h.x-A.x,dz=h.z-A.z;return{d:Math.hypot(dx,dz),a:Math.atan2(dx,dz)}};
  const go=(spd,tx,tz)=>{const dx=tx-A.x,dz=tz-A.z,d=Math.hypot(dx,dz),dy=wrapA(Math.atan2(dx,dz)-A.yaw);A.yaw=wrapA(A.yaw+cl(dy,-dt*9,dt*9));
    const vt=spd*cl(1-Math.abs(dy)/1.5,0,1)*cl(d/.08,.2,1);A.v+=(vt-A.v)*Math.min(1,dt*10);return d};
  switch(A.mode){
    case"in":A.v=0;A.out=false;P.in=1;if(act&&A.t<0){A.mode="peek";A.t=rr(2,5);A.x=h.x;A.z=h.z;A.yaw=h.yaw+rr(-1,1);P.in=.6;break}
      /* by day it stays below, but every so often puts its head up out of the hole for a look round */
      A.lt=(A.lt==null?rr(5,30):A.lt)-dt;if(!act&&calm&&A.lt<0&&A.t<0){A.mode="look";A.t=rr(3,6);A.x=h.x;A.z=h.z;A.yaw=h.yaw+rr(-1.2,1.2);P.in=.75}break;
    case"look":A.out=true;A.v=0;P.in+=(.5-P.in)*ease(3,dt);if(act){A.mode="peek";A.t=rr(1,3);break}
      if(A.t<0||!calm||gbThreat(A)>.15){A.mode="in";A.t=0;A.lt=rr(30,75)}break;
    case"peek":A.out=true;A.v=0;P.in+=(.45-P.in)*ease(3,dt);if(!act||gbThreat(A)>.25){A.mode="in";A.t=rr(3,8);break}
      if(A.t<0){A.mode="forage";A.t=rr(8,20);A.goal=null}break;
    case"forage":{P.in*=Math.exp(-dt*8);if(!act){A.mode="bolt";break}
      if(!A.goal||A.t<0&&A.v<.05){A.t=rr(.6,3);const r=rnd();if(r<(watched?.6:.25)){A.mode="stand";A.t=rr(1.2,3);break}if(r<.5){A.mode="nibble";A.t=rr(1.5,4);break}
        const g=navGrid("gerb",.15,1.4,.8),p=randFree(g,h.x,h.z,2.6);A.goal=p;A.spd=rr(.5,1.4)}
      if(A.goal&&go(A.spd,A.goal.x,A.goal.z)<.05){A.goal=null;A.t=rr(.2,1.2)}if(A.goal===null)A.v*=Math.exp(-dt*12);
      if(Math.hypot(A.x-h.x,A.z-h.z)>3){A.goal={x:h.x,z:h.z}}break}
    case"stand":case"nibble":A.v*=Math.exp(-dt*14);if(A.t<0){A.mode="forage";A.t=0;A.goal=null}break;
    case"bolt":{const o=toH();if(go(2.2,h.x,h.z)<.06){A.mode="dive";A.t=.35;spPuff(h.x,hTop(h.x,h.z),h.z,8,-Math.sin(A.yaw),-Math.cos(A.yaw),.6,.5,.012)}break}
    case"dive":A.v=0;P.in+=(1-P.in)*ease(9,dt);if(A.t<0){A.mode="in";A.t=rr(5,14);P.in=1;if(rnd()<.5)h.dig=1}break}
  /* sand thrown back out of the hole as it clears it */
  if(A.mode==="in"&&h.dig&&act){h.dg=(h.dg||0)-dt;if(h.dg<0){h.dg=rr(.25,.6);spPuff(h.x+Math.sin(h.yaw)*.03,hTop(h.x,h.z),h.z+Math.cos(h.yaw)*.03,3,Math.sin(h.yaw),Math.cos(h.yaw),.4,.5,.01)}if(rnd()<dt*.15)h.dig=0}
  h.t+=dt;if(h.t>70)gbStamp(h);
  /* hops: about 7 a second at a dash, each landing leaving a hop set */
  if(A.v>.05){const ph=A.hph+dt*(4+3*cl(A.v,0,1.5));if(ph>=1&&A.mode!=="dive")paPrint(PRK.gerb,A.x,A.z,A.yaw,0,.9,0,1);A.hph=ph%1}else A.hph=0;
  A.x+=Math.sin(A.yaw)*A.v*dt;A.z+=Math.cos(A.yaw)*A.v*dt;A.gy=hTop(A.x,A.z);
  P.up+=((A.mode==="stand"?1:0)-P.up)*ease(7,dt);P.nib+=((A.mode==="nibble"?1:0)-P.nib)*ease(6,dt);P.crouch+=((A.mode==="peek"||A.mode==="nibble"?1:0)-P.crouch)*ease(5,dt);
  A.lookT-=dt;if(A.lookT<0){A.lookT=rr(.3,1.4);A.lookA=watched&&A.mode==="stand"?cl(wrapA(Math.atan2(vw.m.x-A.x,vw.m.z-A.z)-A.yaw),-.9,.9):rr(-.9,.9)}P.look+=(A.lookA-P.look)*ease(10,dt);
  const D=Math.max(.05,cam.distanceTo(A.g.position));A.g.visible=A.mode!=="in"&&.12*PA.ppm/D>2.5;
  A.g.position.set(A.x,A.gy-(A.rig?.055*P.in:0),A.z);A.g.rotation.y=A.yaw;if(A.g.visible){A.rig?gbAnim(A,dt):gbPose(A);blobAdd(A.x,A.gy,A.z,A.yaw,.03,.05,.3+.2*sunCast(),.6,0)}}
/* a burrow's earthwork: a low collar round the mouth and the fan of fresh spoil thrown out behind it (-z), darker and coarser
   than the wind-sorted sand round it, with a few clods on top. Its edge is sunk just under the ground, so it grows out of the
   sand; the mouth itself is left open over the hole the ground already shows. Seeded on its own so the island's layout stays. */
function moundGeo(o){const P=[],N=[],C=[],I=[];let sd=o.seed;const hr=()=>(sd=(sd*16807)%2147483647)/2147483647;
  const W=o.fw*2.4+o.rh*1.5,Z0=-(o.fz+o.fl*2.2),Z1=o.rh*2.2,NX=22,NZ=26;
  const mouth=(x,z)=>Math.hypot(x/o.ex,z)/o.rh,
    hAt=(x,z)=>{const m=mouth(x,z),c=o.ch*Math.exp(-Math.pow((m-1.35)/.45,2)),f=o.fh*Math.exp(-Math.pow(x/(o.fw*(1+.5*Math.max(0,-z-o.fz)/o.fl)),2)-Math.pow((z+o.fz)/o.fl,2));
      const lump=1+.25*Math.sin(x*97+z*41)*Math.sin(z*73-x*29);return Math.max(c,f*lump)};
  const yAt=(x,z)=>{const h=hAt(x,z);return mouth(x,z)<.9?-.006:h-.005*(1-ss(0,.0025,h))};
  for(let j=0;j<=NZ;j++)for(let i=0;i<=NX;i++){const x=-W+2*W*i/NX,z=Z0+(Z1-Z0)*j/NZ,y=yAt(x,z),e=.002;
    const nx=yAt(x-e,z)-yAt(x+e,z),nz=yAt(x,z-e)-yAt(x,z+e),l=Math.hypot(nx,2*e,nz);P.push(x,y,z);N.push(nx/l,2*e/l,nz/l);
    const h=hAt(x,z),m=mouth(x,z),k=ss(0,o.fh*.5,h),c=m<1.15?o.hole:[mix(o.sand[0],o.dug[0],k),mix(o.sand[1],o.dug[1],k),mix(o.sand[2],o.dug[2],k)],v=.92+.16*hr();
    C.push(c[0]*v,c[1]*v,c[2]*v)}
  for(let j=0;j<NZ;j++)for(let i=0;i<NX;i++){const a=j*(NX+1)+i,b=a+NX+1;I.push(a,b,a+1,a+1,b,b+1)}
  for(let k=0;k<o.peb;k++){const z=-(o.fz+o.fl*(hr()*1.6-.3)),x=(hr()-.5)*o.fw*2.2,r=o.pr*(.6+.8*hr()),y=yAt(x,z)+r*.3,b=P.length/3;
    for(let a=0;a<=3;a++)for(let q=0;q<=5;q++){const t=a/3*Math.PI*.5,ph=q/5*TAU,cx=Math.cos(t)*Math.cos(ph),cy=Math.sin(t),cz=Math.cos(t)*Math.sin(ph);
      P.push(x+cx*r,y+cy*r*.7,z+cz*r);N.push(cx,cy,cz);C.push(o.dug[0]*.8,o.dug[1]*.8,o.dug[2]*.8)}
    for(let a=0;a<3;a++)for(let q=0;q<5;q++){const u=b+a*6+q;I.push(u,u+6,u+1,u+1,u+6,u+7)}}
  const g=new T.BG();g.setAttribute("position",new T.BA(new Float32Array(P),3));g.setAttribute("normal",new T.BA(new Float32Array(N),3));
  g.setAttribute("color",new T.BA(new Float32Array(C),3));g.setIndex(I);return g}
function moundAt(geo,x,z,yaw){const m=new T.Mesh(geo,MOUND_M());_tq.setFromUnitVectors(_hUp,nTop(x,z)).multiply(_tq2.setFromAxisAngle(_hUp,yaw));
  m.position.set(x,hTop(x,z),z);m.quaternion.copy(_tq);m.receiveShadow=true;W.add(m);onDes(m);return m}
let _moundM=null;const MOUND_M=()=>{if(_moundM)return _moundM;const m=_moundM=new T.MSM({vertexColors:true,roughness:.97,metalness:0,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2});
  m.onBeforeCompile=sh=>{sh.uniforms.uNight=sandU.uNight;sh.fragmentShader=sh.fragmentShader.replace("#include <common>","#include <common>\nuniform float uNight;")
    .replace("#include <color_fragment>","#include <color_fragment>\n  diffuseColor.rgb=mix(diffuseColor.rgb,vec3(dot(diffuseColor.rgb,vec3(.3,.59,.11)))*vec3(.74,.88,1.04),uNight*.7)*mix(1.,.44,uNight);")};
  m.customProgramCacheKey=()=>"mound";return m};
const GB_MOUND={rh:.026,ex:1,ch:.008,fh:.016,fw:.05,fz:.06,fl:.07,peb:7,pr:.006,seed:4111,hole:[.012,.008,.005],sand:[.53,.27,.07],dug:[.34,.15,.04]};
function gbLoad(){return pgGet("gb").then(src=>{const geo=moundGeo(GB_MOUND);for(const h of gbHoles()){const A=gbSpawn(h,src);PA.gb.push(A);h.mound=moundAt(geo,h.x,h.z,h.yaw)}})}
/* ---- scorpions: deathstalkers, 9 cm of straw-yellow cuticle, slender pincers, the five-segment tail carried curled over
   the back with the dark sting at its tip. By day each lies up under a rock; at dusk it waits at the rock's edge, and at night
   it wanders slowly over the sand with long still pauses, feeling ahead with its pincers. When the snake, a camel, an ostrich
   or a viewer comes near it turns to face it, rises on its legs, opens its pincers and arches the tail high, sting forward;
   too close and it backs off under its rock. Under the moon its cuticle gives back a faint blue-green glow. ---- */
const SC_TZ=[-.03,-.036,-.043,-.05,-.058,-.067,-.076];
const SC_B=(()=>{const B=[["body",null,[0,.008,0]],["m1","body",[0,.009,SC_TZ[0]]]];
  for(let i=1;i<6;i++)B.push(["m"+(i+1),"m"+i,[0,.009,SC_TZ[i]]]);B[B.length-1][3]=[0,.009,SC_TZ[6]];
  for(const s of[1,-1]){const L=s>0?"L":"R";B.push(["pa"+L,"body",[s*.006,.009,.016]],["pb"+L,"pa"+L,[s*.017,.01,.026]],["pc"+L,"pb"+L,[s*.019,.01,.04]],["pd"+L,"pc"+L,[s*.017,.009,.052],[s*.015,.008,.068]]);
    for(let k=0;k<4;k++){const z=.012-k*.0075;B.push(["la"+L+k,"body",[s*.006,.007,z]],["lb"+L+k,"la"+L+k,[s*.016,.014,z+(1.5-k)*.004]],["lc"+L+k,"lb"+L+k,[s*.026,.004,z+(1.5-k)*.009],[s*.031,0,z+(1.5-k)*.013]])}}
  return B})();
const SC_IX=Object.fromEntries(SC_B.map((d,i)=>[d[0],i]));
function scGeo(){const G=paGeo(),X=SC_IX,w=(a,b)=>[[X[a],.5],[X[b],.5]],y=[.86,.74,.44],yD=[.7,.56,.3],dk=[.24,.17,.1];
  /* carapace and the seven plates of the abdomen, flat and broad, darker at the seams */
  G.ell([0,.009,.011],[.0075,.0035,.0105],y,PSK.cut,X.body,12,6,(a,b,c)=>[a*(1-.25*Math.max(0,c)),b,c]);
  for(let i=0;i<7;i++){const z=-.0005-i*.0042,wd=.0085-(i>4?(i-4)*.0012:0);G.ell([0,.0085,z],[wd,.0033,.0027],i%2?y:[y[0]*.95,y[1]*.94,y[2]*.92],PSK.cut,i<6?X.body:w("body","m1"),10,5)}
  /* the tail: five beaded segments getting longer, the last darkening into the bulb and the sting */
  for(let i=0;i<5;i++){const a=SC_TZ[i],b=SC_TZ[i+1],r=.0028-i*.0001,c=i>3?[mix(y[0],dk[0],.4),mix(y[1],dk[1],.4),mix(y[2],dk[2],.4)]:y;
    G.ell([0,.009,(a+b)/2],[r,r*.95,(a-b)*.6],c,PSK.cut,X["m"+(i+1)],8,6)}
  G.ell([0,.009,-.071],[.0027,.0027,.0045],yD,PSK.cut,X.m6,8,6);
  G.loft([{c:[0,.0085,-.075],rx:.0012,ry:.0012},{c:[0,.0065,-.0785],rx:.0008,ry:.0008},{c:[0,.004,-.079],rx:.0003,ry:.0003}].map(r=>(r.col=dk,r.bw=X.m6,r)),PSK.claw,6,true,[1,0,0]);
  /* pincers on slender arms, and eight thin legs */
  for(const s of[1,-1]){const L=s>0?"L":"R",p=n=>SC_B[X[n+L]][2];
    G.loft([{c:p("pa"),rx:.0013,ry:.0013,bw:X["pa"+L]},{c:p("pb"),rx:.0013,ry:.0012,bw:w("pa"+L,"pb"+L)},{c:p("pc"),rx:.0014,ry:.0013,bw:w("pb"+L,"pc"+L)},{c:p("pd"),rx:.0018,ry:.0016,bw:X["pd"+L]}].map(r=>(r.col=y,r)),PSK.cut,6,false,[0,1,0]);
    const d=p("pd");G.ell([d[0]-s*.0005,d[1],d[2]+.004],[.0026,.0022,.0055],y,PSK.cut,X["pd"+L],8,5);
    G.loft([{c:[d[0]-s*.001,d[1],d[2]+.008],rx:.0009,ry:.0008},{c:[d[0]-s*.002,d[1],d[2]+.016],rx:.0003,ry:.0003}].map(r=>(r.col=yD,r.bw=X["pd"+L],r)),PSK.cut,5,true,[0,1,0]);
    G.loft([{c:[d[0]+s*.0005,d[1],d[2]+.008],rx:.0008,ry:.0007},{c:[d[0]-s*.0005,d[1],d[2]+.015],rx:.0003,ry:.0003}].map(r=>(r.col=yD,r.bw=X["pd"+L],r)),PSK.cut,5,true,[0,1,0]);
    for(let k=0;k<4;k++){const a=SC_B[X["la"+L+k]][2],b=SC_B[X["lb"+L+k]][2],c=SC_B[X["lc"+L+k]][2],t=SC_B[X["lc"+L+k]][3];
      G.loft([{c:a,rx:.0009,ry:.0009,bw:X["la"+L+k]},{c:b,rx:.0008,ry:.0008,bw:w("la"+L+k,"lb"+L+k)},{c:c,rx:.0006,ry:.0006,bw:w("lb"+L+k,"lc"+L+k)},{c:t,rx:.00025,ry:.00025,bw:X["lc"+L+k]}].map(r=>(r.col=y,r)),PSK.cut,5,true,[0,1,0])}}
  return G}
function scSpawn(rk,src,glow){let g,m=null,B=null,q=null;
  if(src){q=pgModel(src,"sc",1,{glow});g=q.g;play(q.rig,"idle",.01,1)}
  else{const G=scGeo(),R=paBones(SC_B);m=paMesh(G,R);g=new T.Group();g.add(m);W.add(g);onDes(g);B=R.B}
  return{g,m,B,rig:q&&q.rig,bn:q&&q.bn,sc:1,rk,x:rk.hx,z:rk.hz,yaw:rk.hy,gy:0,v:0,yr:0,gph:0,mode:"hide",t:rr(2,8),goal:null,trav:0,
    P:{thr:0,raise:0,open:0,feel:0,look:0},thr:null}}
/* rocks a scorpion can live under: its hiding place just inside the rock's shaded edge, its doorstep just outside */
function scRocks(){const g=navGrid("scorp",.05,1.3,.84),L=OBST.filter(o=>o.k==="rock"&&o.r>=.35&&o.r<1.2&&pN(o.x,o.z)>1.5).sort((a,b)=>Math.hypot(a.x,a.z)-Math.hypot(b.x,b.z));const out=[];
  for(const o of L){if(out.length>=2)break;if(out.some(r=>Math.hypot(r.x-o.x,r.z-o.z)<4))continue;const a=Math.atan2(SHADE.x,SHADE.z),ox=o.x+SHADE.x*(o.r+.08),oz=o.z+SHADE.z*(o.r+.08);
    if(!navFree(g,ox,oz))continue;out.push({x:o.x,z:o.z,r:o.r,hx:o.x+SHADE.x*o.r*.7,hz:o.z+SHADE.z*o.r*.7,hy:a,dx:ox,dz:oz})}
  return out}
const _sqb=new T.Quat(),_sv=new V3();
function scPose(A){const B=A.B,P=A.P,gp=A.gph*TAU,mv=cl(A.v/.04,0,1),th=P.thr;
  B.body.position.set(0,.008+.004*th+.0006*Math.sin(gp*2)*mv,0);qYXZ(_sqb,-.12*th,0,.03*Math.sin(gp*2)*mv);B.body.quaternion.copy(_sqb);
  /* tail: curled up and over the back; in threat higher and tighter, the sting over the head and twitching */
  const tw=th*.12*Math.sin(st.t*9)*(Math.sin(st.t*1.7)>.3?1:0),C=[.75,.68,.6,.55,.48,.45],CT=[.95,.78,.65,.58,.52,.75];
  for(let i=0;i<6;i++)qYXZ(B["m"+(i+1)].quaternion,mix(C[i],CT[i],th)+(i>3?tw:0)+.04*Math.sin(st.t*.9+i)*(1-th),i===0?P.look*.2:0,0);
  for(const s of[1,-1]){const L=s>0?"L":"R",o=P.open;
    qYXZ(B["pa"+L].quaternion,-.2*th-.15*P.feel*Math.sin(st.t*3+s),s*(.15+.35*o),0);qYXZ(B["pb"+L].quaternion,-.15*th,s*(-.5+.5*o+.15*P.feel*Math.sin(st.t*2.3)),0);
    qYXZ(B["pc"+L].quaternion,0,s*(.45-.2*o),0);qYXZ(B["pd"+L].quaternion,0,s*.05,0);
    /* legs: an alternating tetrapod, legs 1 and 3 of one side with 2 and 4 of the other */
    for(let k=0;k<4;k++){const ph=gp+((k%2)^(s>0?0:1))*Math.PI,sw=Math.sin(ph),lf=Math.max(0,Math.cos(ph));
      qYXZ(B["la"+L+k].quaternion,0,s*.32*sw*mv,s*(.35*lf*mv-.12*th));qYXZ(B["lb"+L+k].quaternion,0,0,s*.25*th)}}}
function scUpdate(A,dt,cam){const P=A.P,rk=A.rk,dark=st.night>.55,dusk=st.phase==="sunset"||st.night>.3,bad=WX.rain>.15||WX.hf>.03||WX.hcold>0||WX.sf>.1;
  A.t-=dt;const th=nearMov(A,["snake","camel","ost","view","tort","gerb","dbg"]);let fear=0,tx=0,tz=0;
  if(th&&A.mode!=="hide"){const k=th.m.k,d=th.d;fear=k==="camel"||k==="ost"?ss(1.6,.5,d):k==="gerb"?ss(.25,.08,d):k==="view"?ss(.7,.2,d):ss(.9,.25,d);tx=th.m.x;tz=th.m.z}
  const go=(spd,x,z)=>{const dx=x-A.x,dz=z-A.z,d=Math.hypot(dx,dz),dy=wrapA(Math.atan2(dx,dz)-A.yaw);A.yaw=wrapA(A.yaw+cl(dy,-dt*2.5,dt*2.5));A.v+=(spd*cl(1-Math.abs(dy),0,1)*cl(d/.05,.2,1)-A.v)*Math.min(1,dt*6);return d};
  switch(A.mode){
    case"hide":A.v=0;A.x=rk.hx;A.z=rk.hz;if(A.t<0&&(dusk||dark)&&!bad){A.mode="door";A.t=rr(20,50)}break;
    case"door":if(go(.03,rk.dx,rk.dz)<.03)A.v*=Math.exp(-dt*8);if(fear>.85||bad||!dusk&&!dark){A.mode="home";break}
      if(A.t<0&&dark){A.mode="roam";A.t=rr(6,14);A.goal=null}else if(dark&&A.t>20)A.t=rr(4,12);break;
    case"roam":if(fear>.85||bad||!dark){A.mode="home";break}
      if(!A.goal){const g=navGrid("scorp",.05,1.3,.84),p=randFree(g,rk.dx,rk.dz,2.2);A.goal=p;A.pause=0}
      if(A.pause>0){A.pause-=dt;A.v*=Math.exp(-dt*10)}else if(A.goal&&go(.035,A.goal.x,A.goal.z)<.03){A.goal=null;A.pause=rr(2,7)}
      if(A.t<0&&!A.goal){A.mode=rnd()<.3?"door":"roam";A.t=rr(15,40)}break;
    case"home":if(!A.atDoor&&go(.06,rk.dx,rk.dz)<.04)A.atDoor=1;
      if(A.atDoor&&go(.03,rk.hx,rk.hz)<.03){A.mode="hide";A.t=rr(30,90)}break}
  if(A.mode!=="home")A.atDoor=0;
  /* threat: face it, raise up, open the pincers, sting arched forward; when it is on top of us back off home */
  const thr=fear>.25&&A.mode!=="hide"&&A.mode!=="home";if(thr){A.v*=Math.exp(-dt*10);const dy=wrapA(Math.atan2(tx-A.x,tz-A.z)-A.yaw);A.yaw=wrapA(A.yaw+cl(dy,-dt*3,dt*3))}
  P.thr+=((thr?1:0)-P.thr)*ease(thr?6:1.5,dt);P.open+=((thr?1:A.mode==="roam"?.3:0)-P.open)*ease(4,dt);P.feel+=((A.mode==="roam"&&A.v>.01?1:0)-P.feel)*ease(2,dt);
  A.x+=Math.sin(A.yaw)*A.v*dt;A.z+=Math.cos(A.yaw)*A.v*dt;A.gy=hTop(A.x,A.z);
  if(A.v>.004){A.gph=(A.gph+dt*(1.5+60*A.v))%1;A.trav+=A.v*dt;if(A.trav>.07){A.trav=0;paPrint(PRK.scorp,A.x,A.z,A.yaw,0,.7,0,1)}}
  const D=Math.max(.05,cam.distanceTo(A.g.position));A.g.visible=A.mode!=="hide"&&.09*PA.ppm/D>2.5;
  A.g.position.set(A.x,A.gy,A.z);A.g.rotation.y=A.yaw;if(A.g.visible){A.rig?scAnim(A,dt):scPose(A);blobAdd(A.x,A.gy,A.z,A.yaw,.035,.05,.25+.2*sunCast(),.7,0)}}
/* a scorpion's scrape: a flat dark slot dug in under the rock's shaded lip, its spoil fanned out on the sand in front */
const SC_MOUND={rh:.028,ex:2.2,ch:.005,fh:.011,fw:.06,fz:.055,fl:.07,peb:6,pr:.005,seed:9133,hole:[.01,.007,.005],sand:[.52,.27,.07],dug:[.33,.15,.04]};
function scLoad(){return Promise.all([pgGet("sc"),pgGet("scUV")]).then(([src,uv])=>{let glow=null;
  if(src&&uv)matsOf(uv.scene,m=>{if(m.emissiveMap&&!glow)glow=m.emissiveMap});
  const geo=moundGeo(SC_MOUND);for(const rk of scRocks()){const A=scSpawn(rk,src,glow);A.gy=hTop(A.x,A.z);PA.sc.push(A);
  const ex=rk.x+SHADE.x*(rk.r+.02),ez=rk.z+SHADE.z*(rk.r+.02);rk.mound=moundAt(geo,ex,ez,Math.atan2(-SHADE.x,-SHADE.z))}})}
/* ---- the rigged models: Godot's ostrich_v2ag (the user's final ostrich, frozen), tortoise_v2h (v2g's mesh and clips, warmer shell maps; with its withdraw morph), gerbil_v5b (with its lookout_fix morph) and scorpion_v2c (v2b with skinned alpha setae cards), whose
   UV-fluorescence twin scorpion_uv_v2c lends its emissive map for the glow under the moon. Each takes the place of the
   procedural mesh above with the same behaviour, schedules, prints and sounds: its pose is the model's own clips, chosen and
   timed from the same state, plus a few bones turned on top (where it looks). Night and hail play the ostrich's sit clip.
   ostrich_v2c.glb through ostrich_v2af.glb, ostrich_v2ah.glb, tortoise_v2g.glb, gerbil_v4d.glb, gerbil_v5.glb and the v2b scorpions stay on disk and are not loaded. If a file can't be had the procedural animal is built instead.
   Bones run along their local y (Blender's); three drops the dots from their names. ---- */
const PG={os:"ostrich_v2ag",tt:"tortoise_v2h",gb:"gerbil_v5b",sc:"scorpion_v2c",scUV:"scorpion_uv_v2c"};
const pgGet=k=>glb(PG[k]).catch(()=>null);
const PGM=new Map();let PG_GLOW=null;
/* wet plumage and fur go darker in rain; the hen is the cock's model in her dull grey-brown (black -> earth, white -> buff) */
function pgMats(s,k,o){animalMats(s,false);matsOf(s,(m,c)=>{const key=m.uuid+k+(o.hen?"h":"");let n=PGM.get(key);
  if(!n){n=m.clone();PGM.set(key,n);if(!ANIM_MATS.includes(n))ANIM_MATS.push(n);
    if(m.transparent)n.depthWrite=false;
    /* the glow map is the cuticle's (the UV twin gives its setae cards none, and they sit on their own atlas) */
    if(o.glow&&!m.transparent){n.emissiveMap=o.glow;n.emissive.setRGB(.55,.8,1);n.emissiveIntensity=0;PG_GLOW=n}
    const wet=k==="sc"?.12:k==="tt"?.18:.3;
    n.onBeforeCompile=sh=>{sh.uniforms.uWetA=paU.uWetA;
      sh.fragmentShader=sh.fragmentShader.replace("#include <common>","#include <common>\nuniform float uWetA;")
        .replace("#include <color_fragment>","#include <color_fragment>\n"+(o.hen?`{float l=dot(diffuseColor.rgb,vec3(.3,.59,.11));
          diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.21,.16,.105)*min(1.7,.7+10.*l),1.-smoothstep(.1,.28,l));
          diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.52,.45,.34)*(.5+.7*l),smoothstep(.42,.72,l));}`:"")+`diffuseColor.rgb*=1.-${wet}*uWetA;`)};
    n.customProgramCacheKey=()=>"pg"+k+(o.hen?"h":"")+(o.glow?"g":"")}
  c.material=n})}
function pgModel(src,k,sc,o){const s=VT.cloneSkinned(src.scene),g=new T.Group();g.add(s);g.scale.setScalar(sc);W.add(g);onDes(g);
  s.traverse(c=>{if(c.isMesh){c.castShadow=!!o.shadow;c.receiveShadow=true;c.frustumCulled=false}});pgMats(s,k,o);
  /* after animalMats (which turns every mesh's shadow on): alpha-blended cards would cast solid quads, since the shadow pass
     reads alpha only with alphaTest, so they cast none */
  s.traverse(c=>{if(c.isMesh&&c.material.transparent)c.castShadow=false});
  /* every primitive comes with its own Skeleton over the same bones, and each one is recomputed and its bone texture uploaded
     every frame (16 per ostrich). Primitives whose bones and inverses match share the first one. */
  const sks=[];s.traverse(c=>{if(!c.isSkinnedMesh)return;const a=c.skeleton,m=sks.find(b=>b.bones.length===a.bones.length&&b.bones.every((x,i)=>x===a.bones[i])&&b.boneInverses.every((x,i)=>x.equals(a.boneInverses[i])));
    if(m)c.skeleton=m;else sks.push(a)});
  const bn={};s.traverse(c=>{if(c.isBone)bn[c.name]=c});const rig=rigUp(s,src.animations);
  for(const n of o.once||[]){const a=rig.acts[n];if(a){a.setLoop(VT.THREE.LoopOnce,1);a.clampWhenFinished=true}}
  return{g,s,bn,rig}}
const _pgq=new T.Quat(),_pgq2=new T.Quat(),_pgv=new V3(),_pgv2=new V3(),_pgv3=new V3(),_pgY=new V3(0,1,0),_pgX=new V3(1,0,0);
/* turn a bone about its own axis (y, along it) or across it (x), on top of the clip */
function pgTurn(b,ax,a){if(b&&a)b.quaternion.multiply(_pgq.setFromAxisAngle(ax,a))}
/* turn bone b (world matrices current) so the world point p it carries swings onto the line toward t */
function pgAim(b,p,t){b.getWorldPosition(_pgv);_pgq.setFromUnitVectors(_pgv2.copy(p).sub(_pgv).normalize(),_pgv3.copy(t).sub(_pgv).normalize());
  b.getWorldQuaternion(_pgq2).premultiply(_pgq);b.parent.getWorldQuaternion(_pgq).invert();b.quaternion.copy(_pgq.multiply(_pgq2));b.updateMatrixWorld(true)}
/* ostrich v2ag (v2af's clips, retimed mid-sit cover): idle 4 s, slow_walk 1.50 s (ground speed / 1.0 m/s), fast_run 0.717 s (ground speed / 4.86 m/s),
   peck 2.5 s, sit 3.5 s (settle 0–1 s, hold from 1 s) and stand_up 1.65 s. Night and hail play sit once, then keep the hold from 1 s.
   sit and stand_up play as authored. sit_skirt (on the body) and soft_mound (on the fluff mound and cards) are weight tracks
   inside those clips; AnimationMixer writes them to morphTargetInfluences while the clip runs. Nothing here offsets bones.
   The clips leave the legs at scale 1 and fold the wings back against the body on their own tracks.
   The leg fold below is only for a file with no sit clip. */
const OS_VW=1,OS_VR=4.86;
const _ow=[new V3(),new V3(),new V3(),new V3(),new V3(),new V3()];
function osAnim(A,dt){const P=A.P,v=A.v,R=A.rig,sitC=R.acts.sit,upC=R.acts.stand_up;let c="idle",ts=1;
  const rising=upC&&R.cur==="stand_up"&&!upC.paused&&upC.time<upC.getClip().duration-.05;
  if(A.mode==="sit"&&sitC)c="sit";
  else if(upC&&(R.cur==="sit"||rising))c="stand_up";
  else if(P.sit<.05){if(A.mode==="run"||v>2.6){c="fast_run";ts=cl(v/OS_VR,.6,1.6)}else if(v>.1){c="slow_walk";ts=cl(v/OS_VW,.3,1.8)}else if(A.mode==="graze")c="peck"}
  play(R,c,c==="fast_run"||R.cur==="fast_run"||c==="sit"||R.cur==="sit"||c==="stand_up"||R.cur==="stand_up"?.35:.45,ts);
  /* the seated hold breathes from 1 s to 3.5 s; wrapping there keeps the bird down instead of replaying the settle */
  if(c==="sit"&&(sitC.paused||sitC.time>=3.4)){sitC.paused=false;if(sitC.time>=3.4)sitC.time=1+((sitC.time-1)%2.4)}
  rigTick(R,dt);
  if(sitC){A.mdl.position.y=0;if(c!=="sit"&&c!=="stand_up"){const lk=P.look*(1-P.run);for(let i=3;i<=7;i++)pgTurn(A.bn["neck0"+i],_pgY,lk*.17);pgTurn(A.bn.head,_pgY,lk*.12)}}
  else{const lk=P.look*(1-P.run)*(1-.7*P.sit);for(let i=3;i<=7;i++)pgTurn(A.bn["neck0"+i],_pgY,lk*.17);pgTurn(A.bn.head,_pgY,lk*.12);
    /* no sit clip: the body goes down onto the folded legs, each shank laid along the sand */
    const s=ss(0,1,P.sit);A.mdl.position.y=-.74*s;A.g.updateMatrixWorld(true);
    if(s>.002){const o=A.g.getWorldPosition(A.sw0),dU=A.g.localToWorld(A.sw1.set(0,.74*s,0)).sub(o),fw=A.g.localToWorld(A.sw2.set(0,.4,1)).sub(o).normalize();
      for(const sd of[1,-1]){const L=sd>0?"L":"R",th=A.bn["thigh"+L],sh=A.bn["shank"+L],ta=A.bn["tarsometatarsus"+L],ft=A.bn["foot"+L],to=A.bn["toe_main"+L];
        const hip=th.getWorldPosition(_ow[0]),kn=sh.getWorldPosition(_ow[1]),an=ta.getWorldPosition(_ow[2]),L1=hip.distanceTo(kn),L2=kn.distanceTo(an);
        const aT=_ow[4].copy(an).add(dU).lerp(A.g.localToWorld(_ow[3].set(sd*.17,.06,-.22)),s),kT=ik2(hip,aT,L1,L2,fw,_ow[5]);
        pgAim(th,kn,kT);pgAim(sh,ta.getWorldPosition(_ow[1]),aT);
        const fp=ft.getWorldPosition(_ow[2]),fT=_ow[3].copy(fp).add(dU).lerp(A.g.localToWorld(_ow[4].set(sd*.2,.07,.33)),s);pgAim(ta,fp,fT);
        const tp=to.getWorldPosition(_ow[2]),tT=_ow[3].copy(tp).add(dU).lerp(A.g.localToWorld(_ow[4].set(sd*.22,.04,.48)),s);pgAim(ft,tp,tT)}}}
  /* prints where a toe actually comes down */
  if(P.sit<.3&&v>.1)for(let i=0;i<2;i++){const to=A.bn[i?"toe_mainR":"toe_mainL"];if(!to)continue;const p=to.getWorldPosition(_ow[0]);W.worldToLocal(p);
    const h=p.y-hTop(p.x,p.z),f=A.pf[i];if(h>.14)f.up=1;else if(h<.09&&f.up){f.up=0;f.P.set(p.x,0,p.z);f.P.y=hTop(p.x,p.z);f.fy=A.yaw;osTrack(A,f)}}}
/* tortoise: idle, slow_crawl (~.058 m/s), head_withdraw and head_out (each with the withdraw morph), turned to the state */
const TOR_V=.058;
function torAnim(A,dt){const P=A.P,R=A.rig,inS=A.mode==="shell"||A.mode==="sleep";let c,ts=1;
  if(inS){c="head_withdraw";A.hoT=0}
  else if(R.cur==="head_withdraw"){c="head_out";A.hoT=2}
  else if((A.hoT-=dt)>0)c="head_out";
  else if(A.mode==="dig"){c="slow_crawl";ts=.75}
  else if(A.v>.006){c="slow_crawl";ts=cl(A.v/TOR_V,.3,1.6)}
  else{c="idle";ts=A.mode==="pallet"?.4:1}
  play(R,c,c==="head_out"||c==="head_withdraw"?.25:.5,ts);rigTick(R,dt);
  /* cropping, drinking and looking about, on top of the clip */
  const ho=c==="idle"||c==="slow_crawl"?1:0;pgTurn(A.bn.neck1,_pgX,ho*(.3*P.gr+.45*P.dr));pgTurn(A.bn.head,_pgX,ho*(.25*P.gr+.3*P.dr+.15*P.bite));
  pgTurn(A.bn.neck2,_pgY,ho*P.look*.5)}
/* gerbil v5 (v4d's 39 bones and clips on the Tripo fur): idle, stand_lookout (the upright hind-foot stand; played as authored),
   dig and hop_run (.36 m/s per 0.3 s hop). Every clip carries a lookout_fix weight track (1 in stand_lookout, 0 in the rest),
   so the chest corrective fades in and out with the crossfade. Extra bone pitch on top of stand_lookout tore the skin and
   tipped the nose down, so the clip is left alone. The body is v4d's length; the tail is 45 mm (x1.25 in the scene) longer. */
const GB_SC=1.25,GB_VH=.36;
function gbAnim(A,dt){const P=A.P,R=A.rig;let c="idle",ts=1;
  if(A.v>.05){c="hop_run";ts=cl(A.v/(GB_VH*GB_SC),.8,2.4)}
  else if(A.mode==="stand"||A.mode==="look"||A.mode==="peek")c="stand_lookout";
  else if(A.mode==="nibble"){c="dig";ts=.8}
  play(R,c,c==="hop_run"||R.cur==="hop_run"?.08:.2,ts);rigTick(R,dt);pgTurn(A.bn.head,_pgY,P.look*.5);pgTurn(A.bn.neck,_pgY,P.look*.3)}
/* scorpion: idle, walk (.071 m/s) and the threat display; claws_raise and tail_raise are not used */
const SC_VW=.071;
function scAnim(A,dt){const P=A.P,R=A.rig;let c="idle",ts=1;
  if(P.thr>.35)c="threat";else if(A.v>.005){c="walk";ts=cl(A.v/SC_VW,.3,1.6)}
  play(R,c,.25,ts);rigTick(R,dt)}
/* per frame: who is about, then each animal; an animal too small on screen to see is skipped (it stays where it was) */
const _pac=new V3();
function paUpdate(dt){movers();const c=_pac.copy(De.position);W.worldToLocal(c);PA.ppm=innerHeight*Math.min(devicePixelRatio||1,2)/(2*Math.tan(De.fov*Math.PI/360));
  paU.uWetA.value+=(ss(.05,.5,WX.rain)-paU.uWetA.value)*Math.min(1,dt*(WX.rain>.05?.5:.04));
  paU.uGlow.value=ss(.55,.95,st.night)*(1-.7*WX.rain);
  if(PG_GLOW)PG_GLOW.emissiveIntensity=.42*paU.uGlow.value;
  PA.tok=Math.min(6,PA.tok+dt*4);
  for(const A of PA.tt)torUpdate(A,dt,c);
  for(const A of PA.gb)gbUpdate(A,dt,c);
  for(const A of PA.sc)scUpdate(A,dt,c);
  for(const A of PA.os){osUpdate(A,dt);A.g.visible=2.4*A.sc*PA.ppm/Math.max(.1,c.distanceTo(A.g.position))>2}}
/* ---- load + per-frame ---- */
const animalsReady=propsReady.then(()=>{const big=[
  Promise.all(CAMEL_SLOTS.map((_,i)=>glb(camelKind(i).file))).then(ms=>{const used=new Set(),[c0,c1]=ms.map((m,i)=>{const s=used.has(m)?VT.cloneSkinned(m.scene):m.scene;used.add(m);return camelSpawn(s,m.animations,i,camelKind(i))});ANIM.camels.push(c0,c1);
    Object.assign(c1,{x:REST[1].x,z:REST[1].z,yaw:REST[1].yaw,mode:"rest",job:"kneel",k:1,timer:rr(20,40),goal:REST[1]});play(c1.r,"kneel_rest",.01,1);
    const gs=grazeSpot(c0);Object.assign(c0,{x:gs.x,z:gs.z,yaw:gs.yaw,mode:"job",job:"graze",timer:rr(8,14)});play(c0.r,"drink",.01,.85)}).catch(()=>{}),
  glb("bald_eagle_v1").then(({scene,animations})=>{const e=eagleSpawn(scene,animations);ANIM.eagle=e;
    const sp=eagleSpots();if(sp[0])eaglePerchAt(e,sp[0]);else{e.mode="soar";play(e.r,"glide",.01,1)}}).catch(()=>{}),
  ];
  /* the snake's file is the largest and the snake starts hidden in shade: on a slow link it must not hold up the rest */
  const after=Promise.all(big).then(()=>{AU.big=1});
  return Promise.all(big.concat(after.then(pfLoad).catch(()=>{}),after.then(trLoad).catch(()=>{}),after.then(crLoad).catch(()=>{}),after.then(agLoad).catch(()=>{}),after.then(osLoad).catch(()=>{}),after.then(torLoad).catch(()=>{}),after.then(gbLoad).catch(()=>{}),after.then(scLoad).catch(()=>{}),after.then(()=>glb(RS_FILE)).then(({scene,animations})=>{const s=rsSpawn(scene,animations);ANIM.rs=s;
    const day=st.phase==="day",sp=day?snakeShadeSpot():randFree(navGrid("snake",.32,1.3,.82),SNK_HOME.x,SNK_HOME.z,3)||SNK_HOME;
    Object.assign(s,{x:sp.x,z:sp.z,yaw:sp.yaw!=null?sp.yaw:-.8,inShade:day?1:0});s.gy=hTop(s.x,s.z);s.g.position.set(s.x,s.gy,s.z);s.g.rotation.set(0,s.yaw,0);
    play(s.r,"relaxed_coil",.01,1)}).catch(()=>{})))});
const SN_FILL=[];
UPD.push((dt,t)=>{
  {const envI=mix(.3,.08,st.night);for(const m of ANIM_MATS)m.envMapIntensity=m.userData.coat?envI*.7:envI}
  if(SN_FILL.length&&pi){const k=(1-st.night)*(1-.6*WX.ovc)*(.05+.3*(1-ss(.12,.55,sandU.uLd.value.y)));
    for(const m of SN_FILL)m.emissive.setRGB(pi.color.r*.95*k,pi.color.g*.78*k,pi.color.b*.55*k)}
  if(dt<=0)return;const d=Math.min(dt,.1);
  ANIM.camels.forEach(a=>{camelUpdate(a,d);furTick(a)});prTick(d);
  if(ANIM.eagle)eagleUpdate(ANIM.eagle,d);
  if(ANIM.rs)rsUpdate(ANIM.rs,d);
  if(PF.list.length){pfVis();pfUpdate(d)}
  lakeThreats();lakeVis();ttUpdate(d);crUpdate(d);
  if(AG.list.length){agVis();agUpdate(d)}
  paUpdate(d);
  blobEnd();spTick(d);
  devilUpdate(d,t);
  sound(d);
});

/* the first time the desert is shown its shaders are linked in a handful of frames, not all in one: the island, rocks and sky
   come first and the rest joins over the next few frames, so a phone never holds the main thread for the whole link */
let _staged=false,_stageDone=false;
function stageIn(){_staged=true;const L=[...root.children.filter(c=>c!==W),...W.children].filter(c=>c.visible&&!c.isLight),n=MOB?7:5,
    B=Array.from({length:n},(_,i)=>L.slice(Math.round(i*L.length/n),Math.round((i+1)*L.length/n)));
  /* with parallel linking every batch is handed to the compiler at once and each is revealed, in order, once its programs are
     linked; without it the first batch draws at once and one more joins per frame, so no single frame links them all */
  for(const b of B.slice(PAR?0:1))for(const o of b)o.traverse(x=>{x.userData._lm=x.layers.mask;x.layers.mask=0});
  const P=B.map((b,k)=>PAR?Promise.all(b.map(o=>warm(o))):Promise.resolve());if(!PAR)P.shift(),B.shift();
  let i=0;const f=()=>{if(i>=B.length){_stageDone=true;return}const b=B[i];P[i++].then(()=>{for(const o of b)o.traverse(x=>{if(x.userData._lm!=null){x.layers.mask|=x.userData._lm;delete x.userData._lm}});nextFrame().then(f)})};
  if(PAR)f();else nextFrame().then(f)}
function show(on){
  if(on&&!_staged)stageIn();
  root.visible=on;De.layers.set(on?3:0);window.__desA=on;grade.enabled=on;if(!on)mirP.enabled=false;
  if(bloom){if(on){if(!_bloomSave)_bloomSave={t:bloom.threshold,s:bloom.strength,r:bloom.radius};bloom.threshold=.9;bloom.strength=.2;bloom.radius=.45}
    else if(_bloomSave){bloom.threshold=_bloomSave.t;bloom.strength=_bloomSave.s;bloom.radius=_bloomSave.r;_bloomSave=null}}
  if(on){if(Ct.mode==="manual"&&!Ct.night)Ct.mode="sunset";if(Ct.mode==="night"){Ct.mode="full";Ct.night=true}
    applyLighting(0)}
  else{if(MOB&&Cn)Cn.shadowMap.autoUpdate=true;const as=appSkyMesh();if(as){as.layers.disable(3);as.position.set(0,0,0)}if(pi&&_shMask!=null){pi.shadow.camera.layers.mask=_shMask;_shMask=null}
    if(Ct.weather==="dust")Ct.weather="sun"}
  if(X.Ui)try{X.Ui()}catch(e){}
  HIDE.forEach(f=>f(on));
}
onDes(root);
window.__desShow=show;window.__desU=update;
/* test hooks only with ?debug=1 */
if(X.dbg)window.__desQA=()=>QA;
const QA={rq:()=>0,RACK,LL,edgeXZ,rockU,rock:()=>rockMesh,STM,camHold,HS,HD,HB,TR,TENTH,CHIT,HLU,roofAt,hailFocus,FOGD,mirP,mirM,RAIN,rainU,TWS,AG,agDecide,agGo,agClimb,agBask,agPalmBase,agMount,agViewAz,agRainT,st,W,S,YAW,hTop,toW,FIRE,TENT,PALMS,SAG,POND,LIT,WX,skyU,pN,sN,dZone,strike:f=>strike(f==null?.5:f),
  /* rattlesnake: rs() state; rsGo(x,z,gait) crawl there (gait locked, or null to choose by ground); rsScare(x,z,sec) */
  rs:()=>{const r=ANIM.rs;if(!r||!r.bd)return null;const P=r.bd.P;return{mode:r.mode,gait:r.gait==="side"?"side":r.rk>.5?"rect":"serp",a:r.a,w:r.w,spd:r.spd,
    head:[P[0],P[1]],tail:[P[2*RS_N-2],P[2*RS_N-1]],c:Array.from(r.bd.C),h:Array.from(r.bd.H),P:Array.from(P)}},
  rsGo:(x,z,g)=>{const r=ANIM.rs;if(!r||!r.bd)return false;r.force=1;r.lock=g||null;r.next={x,z};if(r.mode==="coil"||r.mode==="coiling")r.mode="uncoil";
    else if(r.mode==="crawl"){r.next=null;if(!rsGoTo(r,{x,z}))return false}else if(r.mode==="rest")r.restT=0;return true},
  rsScare:(x,z,sec)=>{const r=ANIM.rs;if(r)r.qth={x,z,until:st.t+(sec||3)}},
  rsSet:o=>Object.assign(ANIM.rs,o),
  /* pupfish: pf() positions/modes; PF itself for tests */
  pf:()=>PF.list.map(f=>({x:f.x,y:f.y,z:f.z,yaw:f.yaw,v:f.v,mode:f.mode,male:f.male,ter:f.ter,clip:f.r.cur})),PF,pfDep,
  /* lake life: trout() and crabs() states; lakeScare(x,z,r,sec) puts a threat by the water */
  trout:()=>TT.list.map(f=>({x:f.x,y:f.y,z:f.z,L:f.L,mode:f.mode,dep:pfDep(f.x,f.z),below:POND.wy-f.y})),TT,
  crK:CR_K,crG:CR_G,crGlb:()=>!!CR.glb,crLane:()=>{const M=new T.M4(),e=M.elements;let n=0;for(const im of VEG)for(let i=0;i<im.count;i++){im.getMatrixAt(i,M);if(e[0]*e[0]+e[1]*e[1]+e[2]*e[2]>1e-8&&CR.list.some(c=>Math.hypot(e[12]-c.bx,e[14]-c.bz)<.55))n++}return n},
  crabs:()=>CR.list.map(c=>({x:c.x,z:c.z,y:c.y,mode:c.mode,dep:pfDep(c.x,c.z),bx:c.bx,bz:c.bz,s:c.s,shown:c.mode!=="in"})),CR,
  /* procedural animals: PA registry; os() ostrich states (head height in island metres); paThreat(x,z,sec) puts a threat down */
  PA,paU,osPlace,osGo,osSpot,osOpen:(x,z)=>navOpen(navGrid("ostrich",.9,1.25,.8),x,z,40),torPlace,torGo,torShade,
  gbHoles,scRocks,gb:()=>PA.gb.map(A=>({x:A.x,z:A.z,mode:A.mode,v:A.v,up:A.P.up,vis:A.g.visible,h:A.h})),sc:()=>PA.sc.map(A=>({x:A.x,z:A.z,mode:A.mode,thr:A.P.thr,vis:A.g.visible,rk:A.rk})),
  tor:()=>PA.tt.map(A=>({x:A.x,z:A.z,yaw:A.yaw,v:A.v,mode:A.mode,wd:A.P.wd,dig:A.P.dig,sink:A.sink,vis:A.g.visible})),
paThreat:(x,z,sec,r)=>{PA.dbg={x,z,r:r||.4,k:"dbg",o:null,until:st.t+(sec||4)}},
  os:()=>PA.os.map(A=>{A.g.updateMatrixWorld(true);const h=A.cr?A.B.head.localToWorld(A.cr.clone()):A.B.head.getWorldPosition(new V3());W.worldToLocal(h);return{x:A.x,z:A.z,yaw:A.yaw,v:A.v,mode:A.mode,male:A.male,headY:h.y-A.gy,sit:A.P.sit,vis:A.g.visible}}),
  crSite,pondEdge,lakeScare:(x,z,r,sec)=>{LKdbg={x,z,r:r||2,k:"test",until:st.t+(sec||5)}},
  rsPut:(x,z,yaw)=>{const r=ANIM.rs;if(!r)return;Object.assign(r,{x,z,yaw:yaw||0,gy:hTop(x,z),mode:"coil",w:0,wT:99,wF:1,path:null,next:null});
    r.g.position.set(x,r.gy,z);r.g.rotation.set(0,r.yaw,0);r.g.updateMatrixWorld(true);play(r.r,"relaxed_coil",.01,1)},trk:TRK,RS_N,
  /* age the tracks by `sec` seconds of the current wind (for the fade time-lapse) */
  trkAge:sec=>{const r=ANIM.rs;if(!r||!TRK)return;for(let k=0;k<sec*2;k++){TRK.dc=.5;TRK.any=1;const w=r.w;r.w=0;trkTick(r,0);r.w=w}TRK.tex.needsUpdate=true},
  /* footprints: PR itself, prAdd for stamping, prAge(sec) wears every print by `sec` seconds of the current weather */
  PR,PRK,prAdd,camelLie,prAge:sec=>{const P=PR;P.E+=sec*(1/240+st.wn*(1-.8*WX.sc)*.3/35+WX.dust/6+WX.rain/9+WX.sf/40);P.im.material.uniforms.uE.value=P.E},camelGo,eagleLand:s=>eagleLand(ANIM.eagle,s||eagleSpots()[1]),eagleSpots,
  /* sand falls: count, rate (sfR(v) pins it, null to release), and each fall's rim point, half width and threshold */
  sfU,wind:()=>({a:WS.a,d:WS.d,x:WIND.x,z:WIND.z,ra:WS.ra}),windPin:a=>{WS.pin=a},sf:()=>({n:SF.F.length,rate:sfU.uFR.value,F:SF.F.map(f=>({x:f.E.x,z:f.E.z,hw:f.hw,k:f.k,ty:f.ty,nx:f.E.nx,nz:f.E.nz,tx:f.E.tx,tz:f.E.tz,path:f.path,yb:f.yb,lipY:f.lipY}))}),sfR:v=>{SF.pin=v},sfMesh:()=>SF.mesh,sfRim:()=>SF.rim,
  freeze(on){st.lock=!!on},wxEase(on){st.wxEase=!!on},
  /* regression checks (tools/e2e/desert.mjs): run the simulation for `sec` seconds without drawing the pond reflection */
  sim(sec,dt){dt=dt||.1;st.qaNoRefl=1;for(let i=0,n=Math.round(sec/dt);i<n;i++)step(dt);st.qaNoRefl=0},sandU,pondU,SAND,SANDP,CURT,WIND,
  step(n,dt){for(let i=0;i<(n||1);i++)step(dt||1/30)},
  tod(p){st.tod=p||null;const ph=phaseNow();for(const k in LK)LK[k]=k===ph?1:0;applyLighting(0)},
  /* camera helpers in island metres */
  lookAt(px,py,pz,tx,ty,tz){De.position.copy(toW(px,py,pz));const t=toW(tx,ty,tz);if(Ce){Ce.minDistance=.02;Ce.target.copy(t);Ce.update()}De.lookAt(t)},
  eye(){const p=W.worldToLocal(De.position.clone());return{x:+p.x.toFixed(2),y:+p.y.toFixed(2),z:+p.z.toFixed(2)}},
  near(v){De.near=v==null?.1:v;De.updateProjectionMatrix()},
  /* fast-forward only the dune clock (and the ripple drift) by `sec` seconds of average wind */
  duneAdv(sec){const wk=.5+st.wn*1.4;duneEvolve(sec*.8*wk);sandU.uRipPh.value+=sec*.08*wk;
    sandU.uDA.value.set(DP.x,DP.z,DP.H,DP.w);sandU.uDB.value.set(DP.Lw,DP.Ll,DP.cv,DP.sk)},
  dune:{DP,DUNE0,DCLK,GUST,crestXZ,dMask,gustAt},salt:()=>SALT,
  /* firefly positions (island metres) for close proof shots; debug only */
  ff:()=>{const o=[];for(let i=0;i<FF.n;i++){if(FF.A[i]<.12)continue;o.push({i,x:FF.P[i*3],y:FF.P[i*3+1],z:FF.P[i*3+2],a:+FF.A[i].toFixed(3),wat:FFP[i].wat||0})}return o},
  /* proof shots: keep one shoreline firefly and hide the rest. i < 0 restores them. */
  ffOne:(i)=>{for(let k=0;k<FF.n;k++)FFP[k].hide=i>=0&&k!==i;return FFP[Math.max(0,i)]},FF,FFP,
  ffShow(on){FF.o.visible=!!on;FFR.o.visible=!!on},
  fireShow(on){fireG.visible=!!on},
  /* a procedural stand-in beside the rigged animal, so a proof can show both. Not used by the scene itself. */
  procBeside(k){const A=k==="os"?PA.os[0]:k==="tt"?PA.tt[0]:k==="gb"?PA.gb[0]:PA.sc[0];if(!A)return null;
    const x=A.x+ (k==="os"?2.2:k==="tt"?.55:.4),z=A.z,yaw=A.yaw;
    let P;if(k==="os"){P=osSpawn(true,null);osPlace(P,x,z,yaw);P.mode="stand";P.t=99;PA.os.push(P)}
    else if(k==="tt"){P=torSpawn(null);torPlace(P,x,z,yaw);P.mode="walk";P.t=99;PA.tt.push(P)}
    else if(k==="gb"){P=gbSpawn({x,z,yaw,t:0},null);P.mode="stand";P.out=true;P.P.in=0;P.t=99;PA.gb.push(P)}
    else{P=scSpawn({x,z,r:.2,hx:x,hz:z,hy:yaw,dx:x,dz:z},null,null);P.mode="door";P.t=99;PA.sc.push(P)}
    P._p=1;P.g.visible=true;return{x,z,y:hTop(x,z)}},
  hideProc(){for(const k of["os","tt","gb","sc"])for(const A of PA[k])if(A._p)A.g.visible=false},
  /* sound capture for the recorded videos: every voice's level/pan/low-pass per step, mixed offline */
  audCap(on){if(on){AU.cap={t0:st.t,ev:[]};return 0}const c=AU.cap;AU.cap=null;return c?c.ev:[]},AU,OAS,oasisNear,
  /* the made sounds, for the offline mix: k in SYN, at R samples per second */
  synth:(k,R)=>Array.from(SYN[k](R||48000)),tentU,propU,flakes:()=>SNF,
  Cn,pi,dc,ready:false,OBST,PROPS,glb,ANIM,DV,REST,DRINK,navGrid,navPath,NAV,fn:{camelGo,camelPlan,grazeSpot,eagleTakeoff,eagleLand,eagleSpots,eaglePerchAt,play,rsBout}};
animalsReady.then(()=>{QA.ready=true});
window.__desProg=()=>{const ks=[...new Set(["saguaro_v3","cholla_v2","barrel_cactus_v3","tent",...CAMEL_SLOTS.map((_,i)=>camelKind(i).file),"bald_eagle_v1",...PF_FILES,TR_FILE,CR_FILE,...AG_FILES,...Object.values(PG),RS_FILE])];
  let l=0,t=0,d=0;for(const k of ks){const P=GLP[k],E=desPre()[k],sz=P?P.t:((window.CY||{}).ms||{})[k]||3e6;t+=sz;
    l+=.88*Math.min(sz,Math.max(P?P.l:0,E?E.l:0))+(P&&P.d?.12*sz:0);if(P)d+=P.d}
  /* parsed: every file is in; done: and every model has been placed and drawn once (or half a minute has passed since) */
  const parsed=d===ks.length;if(parsed&&!PRS)PRS=performance.now();
  return{p:t?l/t:1,parsed,done:parsed&&(QA.ready&&DPEND<=0||performance.now()-PRS>3e4)}};
let PRS=0;
window.__desReady=true;
}
})();
