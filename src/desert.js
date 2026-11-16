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
const onDes=o=>{o.traverse(c=>{c.layers.mask=1|L3})};

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
const WS={a:DUNE.yaw,ph:0,d:.35};
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
function dMask(x,z){let m=dZone(x,z);if(m<=0||!DOB)return m;for(const o of DOB){const d=Math.hypot(x-o.x,z-o.z);if(d<o.r+1.6)m*=ss(o.r+.25,o.r+1.6,d)}return m}
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
const tentU={uSunD:{value:new V3(0,1,0)},uSunC:{value:new C3(1,1,1)},uNt:{value:0},uWetC:{value:0},uWInv:{value:new T.M4()},uTC:{value:new T.V2(TENT.x,TENT.z)},uTF:{value:new T.V2(tentFwd.x,tentFwd.z)}};
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

function hRaw(x,z){
  let h=.55*(fbm2(x*.045+3.1,z*.045-1.7)-.5)+.16*(fbm2(x*.17,z*.17)-.5);
  h+=duneH(x,z);
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
  return _mo=import(url).then(x=>x.MeshoptDecoder.ready.then(()=>x.MeshoptDecoder)).catch(()=>{_mo=null;return Promise.reject(0)})}
const GLP={};
/* ui.js starts every model's download when the desert is chosen (window.__desPre); one that arrived is parsed from its buffer */
const desPre=()=>window.__desPre||{};
function glb(key){if(!GLB[key]){const P=GLP[key]={l:0,t:((window.CY||{}).ms||{})[key]||3e6,d:0},E=desPre()[key];
  GLB[key]=Promise.all([gltfMod(),meshopt(),E&&E.p]).then(([m,md,buf])=>new Promise((res,rej)=>{
    const ld=m.__ld||(m.__ld=new m.GLTFLoader().setMeshoptDecoder(md)),ok=g=>res({scene:g.scene||g.scenes&&g.scenes[0],animations:g.animations||[],gltf:g});
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
  uGT:{value:0},uWD:{value:new T.V2(WIND.x,WIND.z)},uFlowT:{value:0},uFlowK:{value:1},uRipPh:{value:0},uLd:{value:new V3(0,1,0)},uHaze:{value:new C3("#d4aab8")},uWetK:{value:0},uHeat:{value:0},uTm:{value:0},uMirC:{value:new C3("#cfe1f2")},uMirB:{value:new C3("#8fb3dc")}};
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
      varying vec3 vSP;varying vec3 vSN;varying vec3 vWP;attribute float aM;${GLSL_DUNE}`)
      .replace("#include <beginnormal_vertex>",`vec3 objectNormal=vec3(normal);
        if(aM>0.){float e=.3;vec2 p=position.xz;
          vec2 gd=vec2(duneD(p+vec2(e,0.))-duneD(p-vec2(e,0.)),duneD(p+vec2(0.,e))-duneD(p-vec2(0.,e)))/(2.*e)*aM;
          vec3 nb=normal/max(normal.y,.2);objectNormal=normalize(vec3(nb.x-gd.x,1.,nb.z-gd.y));}
        #ifdef USE_TANGENT
        vec3 objectTangent=vec3(tangent.xyz);
        #endif`)
      .replace("#include <begin_vertex>",`#include <begin_vertex>
        ${SAND_DISP}vSP=transformed;vSN=objectNormal;vWP=(modelMatrix*vec4(transformed,1.)).xyz;`);
    sh.fragmentShader=sh.fragmentShader.replace("#include <common>",`#include <common>
      varying vec3 vSP;varying vec3 vSN;varying vec3 vWP;uniform mat3 normalMatrix;uniform float uWy,uRip,uNight,uFlowT,uFlowK,uRipPh,uWetK,uHeat,uTm;uniform vec2 uRipDir;uniform vec3 uLd,uHaze,uMirC,uMirB;
      uniform vec3 uSandA,uSandB,uWet,uSoil;uniform vec4 uPond;uniform vec4 uGrv[${GRV.length}];${GLSL_NOISE}${GLSL_GUST}
      float pondN(vec2 p){vec2 q=(p-uPond.xy)/uPond.zw;float th=atan(q.y,q.x);
        return length(q)/(1.+.09*sin(2.*th+1.1)+.06*sin(3.*th-.4)+.04*sin(5.*th+2.3));}
      float ripH(vec2 p){vec2 q=p+vec2(dfbm(p*.09)*4.,dfbm(p*.11+7.)*2.5);
        float ph=dot(q,uRipDir)*8.38-uRipPh;float a=sin(ph+.9*sin(ph));
        vec2 d2=vec2(-uRipDir.y,uRipDir.x);float b=sin(dot(q*1.7+3.,uRipDir+d2*.35)*8.38-uRipPh*1.6);
        return a*.7+b*.3;}`)
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
        /* rain: the first drops pock the sand with dark spots that merge into an even wet skin; crests and the dune top dry first */
        float rWM=0.;
        if(uWetK>.002){float fwc2=length(fwidth(vSP.xz));
          vec2 cg=vSP.xz*14.,ci=floor(cg),cf=fract(cg)-.5,off=vec2(dh2(ci+3.1),dh2(ci+7.3))-.5;
          float dotM=step(dh2(ci),uWetK*2.2)*smoothstep(.34,.2,length(cf-off*.5))*(1.-smoothstep(.02,.08,fwc2));
          float dryB=.35*smoothstep(1.,4.5,vSP.y)+.15*nz2;
          float even=smoothstep(.22,.55,uWetK-dryB*.6+(nz-.5)*.25);
          rWM=max(even,dotM*.85)*(1.-wet);sc=mix(sc,sc*vec3(.42,.37,.32),rWM);}
        /* close up the sand shows a fine, soft mottle of lighter and darker grains (smooth noise only: no cells to alias into squares) */
        {float fwc=length(fwidth(vSP.xz)),gd=1.-smoothstep(.006,.035,fwc);
         float g1=dn2(vSP.xz*71.+1.3),g2=dn2(vSP.xz*17.+5.);
         sc*=1.+gd*((g1-.5)*.09+(g2-.5)*.1);}
        diffuseColor.rgb=mix(sc,vec3(dot(sc,vec3(.3,.59,.11)))*vec3(.74,.88,1.04),uNight*.7)*mix(1.,.54,uNight);`)
      .replace("#include <roughnessmap_fragment>",`#include <roughnessmap_fragment>
        roughnessFactor=mix(roughnessFactor,.5,rWM);`)
      .replace("#include <normal_fragment_maps>",`#include <normal_fragment_maps>
        float ripAO=1.;
        {float fw=length(fwidth(vSP.xz));
         float pn2=pondN(vSP.xz);
         vec3 nS=normalize(vSN);float lee=smoothstep(.08,.3,dot(nS.xz,uRipDir));
         float k=uRip*(1.-smoothstep(.07,.3,fw))*smoothstep(1.3,1.8,pn2)*smoothstep(.35,.7,nS.y)*(1.-.85*lee)*(1.-grv);
         if(k>.001){float e=.04,h0=ripH(vSP.xz);
           vec2 g=vec2(ripH(vSP.xz+vec2(e,0.))-h0,ripH(vSP.xz+vec2(0.,e))-h0)/e*.036*k*(1.+.9*uNight);
           ripAO=1.-(.13+.17*uNight)*k*(.5-.5*h0);
           vec3 nL=normalize(normalize(vSN)-vec3(g.x,0.,g.y));
           normal=normalize(normalMatrix*nL);}}`)
      /* drifting sand: ground-hugging streamers of fine grains running downwind, denser in gusts and over the dune;
         lit by the scene's own direct light (so shadowed, warm, or moonlit as the sand is) plus forward scatter against the light */
      .replace("#include <opaque_fragment>",`{
        vec2 p=vSP.xz,wd=uWD,wp=vec2(-wd.y,wd.x);float al=dot(p,wd)-uFlowT,ac=dot(p,wp);
        float g=gustF(p),fwf=length(fwidth(p));
        float s1=dn2(vec2(al*.3,ac*1.7)),s2=dn2(vec2(al*.8+5.,ac*4.4+2.));
        float str=smoothstep(.4,.82,s1*.6+s2*.4)*(.35+.65*dn2(vec2(al*.07-uGT*.05,ac*.16)));
        ${MOB?"float grain=1.;":"float gr=dn2(vec2(al*13.,ac*9.)+vec2(0.,3.));float grain=mix(1.,.55+.9*smoothstep(.25,.85,gr),1.-smoothstep(.012,.05,fwf));"}
        float fl=str*grain*smoothstep(.12,.8,g)*uFlowK*smoothstep(1.45,2.1,pondN(p))*(1.+.7*smoothstep(1.,3.5,vSP.y))*(.45+.55*(1.-smoothstep(.06,.25,fwf)));
        vec3 V=normalize(cameraPosition-vWP);float fs=pow(max(dot(V,-uLd),0.),5.);
        outgoingLight*=ripAO;
        outgoingLight+=(reflectedLight.directDiffuse*(1.6+4.*fs)+reflectedLight.indirectDiffuse*.5)*fl*.85;
        /* aerial perspective: far sand takes a little of the sky's colour */
        float dC=length(cameraPosition-vWP);outgoingLight=mix(outgoingLight,uHaze*(.55+.45*(1.-uNight))*.9,.14*smoothstep(22.,75.,dC));
        /* heat: far sand shimmers, and a mirage shows the sky in the sand as broken blue-grey pools that drift, split and
           breathe with the heat. A real mirage needs grazing angles (under ~9 degrees); the island is small and is normally seen
           from ~20 degrees, so the far sand at that angle gets a fainter form of it */
        if(uHeat>.01){float dM=dC/${S.toFixed(3)},fl=smoothstep(.85,.95,normalize(vSN).y);
          float gz=smoothstep(.16,.035,V.y)*smoothstep(4.,12.,dM)*fl,gf=smoothstep(.5,.32,V.y)*smoothstep(25.,45.,dM)*fl;
          vec2 vh=normalize(V.xz+vec2(1e-5));float ax=dot(vSP.xz,vec2(-vh.y,vh.x)),ay=dot(vSP.xz,vh);
          float sh=dn2(vec2(ax*.6,ay*2.4-uTm*1.6))*.6+dn2(vec2(ax*1.9,ay*5.-uTm*2.9))*.4;
          float pu=.62+.38*(.5+.5*sin(uTm*.37+ax*.04))*(.6+.4*sin(uTm*.21+1.3));
          float w=uHeat*pu*max(gz,gf);
          outgoingLight*=1.+uHeat*(.05+.14*max(gz,gf))*(sh-.5);
          /* pools stretched across the line of sight; the shimmer is fine ripples rising through them */
          float pl=dn2(vec2(ax*.16+uTm*.045,ay*.5-uTm*.035))*.68+dn2(vec2(ax*.45-uTm*.08,ay*1.3+uTm*.05))*.32;
          float sm=dn2(vec2(ax*1.6,ay*11.-uTm*4.2))*.55+dn2(vec2(ax*4.2+3.,ay*24.-uTm*7.))*.45;
          float mk=min(1.,w*1.45)*smoothstep(.54,.7,pl+.08*w)*(.45+.55*smoothstep(.2,.7,sm));
          /* the reflected sky near the horizon: pale and greyed, a cool blue-grey whatever the sky's hue (a sunset pink would read as lavender) */
          float mL=dot(uMirC,vec3(.3,.59,.11)),mB=dot(uMirB,vec3(.3,.59,.11));
          vec3 mc=mix(mix(vec3(mL),uMirC,.18)*vec3(.88,.94,1.),mix(vec3(mB),uMirB,.3)*vec3(.84,.92,1.),.12+.25*smoothstep(.02,.35,V.y))*(.93+.14*sm);
          outgoingLight=mix(outgoingLight,mc,mk*.85);}}
      #include <opaque_fragment>`);
  };
  if(TRK){const f=m.onBeforeCompile;m.onBeforeCompile=sh=>{f(sh);Object.assign(sh.uniforms,TRK.U);
    sh.fragmentShader=sh.fragmentShader.replace("uniform vec4 uPond;","uniform vec4 uPond;uniform sampler2D uTrk;uniform vec4 uTrkW;\n float trkH(vec2 q){vec2 t=texture2D(uTrk,q).rg;return t.g*.005-t.r*.011;}")
      /* the track's edges crumble: its lookup is shifted by up to a texel of fine noise, faded out where it would alias */
      .replace("diffuseColor.rgb=mix(sc,vec3(dot(sc",`vec2 tUV=(vSP.xz-uTrkW.xy)*uTrkW.z+.5;float tIn=step(abs(tUV.x-.5),.497)*step(abs(tUV.y-.5),.497);
        vec2 tU0=tUV;
        tUV+=(vec2(dn2(vSP.xz*60.),dn2(vSP.xz*60.+7.3))-.5)*uTrkW.w*1.8*(1.-smoothstep(.0025,.007,length(fwidth(vSP.xz))));
        vec4 trq=texture2D(uTrk,tUV);vec2 trk=trq.rg*tIn;sc*=(1.-.14*trk.r)*(1.+.05*trk.g);
        diffuseColor.rgb=mix(sc,vec3(dot(sc`)
      .replace("float k=uRip*(1.-smoothstep(.07,.3,fw))","float k=uRip*(1.-smoothstep(.12,.5,trk.r+trk.g))*(1.-smoothstep(.07,.3,fw))")
      .replace("normal=normalize(normalMatrix*nL);}}",`normal=normalize(normalMatrix*nL);}}
        if(tIn>0.&&trk.r+trk.g>.004){float e=uTrkW.w;vec2 g=vec2(trkH(tUV+vec2(e,0.))-trkH(tUV-vec2(e,0.)),trkH(tUV+vec2(0.,e))-trkH(tUV-vec2(0.,e)))/(2.*e/uTrkW.z);
          normal=normalize(normal+normalMatrix*vec3(-g.x,0.,-g.y));ripAO*=1.-.3*trk.r;
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
  m.customProgramCacheKey=()=>TRK?"des52sandTg":"des52sandg";
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
const rockU={uMap:{value:null},uHas:{value:0},uTint:{value:new C3("#f8e2c4")},uDeep:{value:new C3("#a3836f")},uSc:{value:1/6.5},uNight:{value:0},uWetK:{value:0}};
function rockMat(extra){
  const m=new T.MSM({color:0xffffff,roughness:.95,metalness:0});
  m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,rockU);
    sh.vertexShader=sh.vertexShader.replace("#include <common>","#include <common>\nvarying vec3 vRP;varying vec3 vRN;")
      .replace("#include <begin_vertex>",`#include <begin_vertex>
        ${extra&&extra.inst?"vec4 _rp=instanceMatrix*vec4(position,1.);vRP=_rp.xyz;vRN=normalize(mat3(instanceMatrix)*normal);":"vRP=position;vRN=normal;"}`);
    sh.fragmentShader=sh.fragmentShader.replace("#include <common>",`#include <common>
      varying vec3 vRP;varying vec3 vRN;uniform mat3 normalMatrix;uniform sampler2D uMap;uniform float uHas,uSc,uNight,uWetK;uniform vec3 uTint,uDeep;${GLSL_NOISE}
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
         normal=normalize(normalMatrix*nL);}`);
  };
  m.customProgramCacheKey=()=>"des44rock"+(extra&&extra.inst?"i":"");
  return m}
const ROCK_M=rockMat(),ROCK_MI=rockMat({inst:1});
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
  const nR=rows.length,pos=new Float32Array(nR*NT*3),idx=[];
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
      const o=(r*NT+j)*3;pos[o]=x;pos[o+1]=y;pos[o+2]=z}}
  for(let r=0;r<nR-1;r++)for(let j=0;j<NT;j++){const a=r*NT+j,b=r*NT+(j+1)%NT,c=a+NT,d=b+NT;idx.push(a,b,c,b,d,c)}
  /* close the tip */
  const tip=nR*NT,last=(nR-1)*NT;let sx=0,sy=0,sz=0;for(let j=0;j<NT;j++){sx+=pos[(last+j)*3];sy+=pos[(last+j)*3+1];sz+=pos[(last+j)*3+2]}
  const P=new Float32Array(pos.length+3);P.set(pos);P[tip*3]=sx/NT;P[tip*3+1]=sy/NT-.6;P[tip*3+2]=sz/NT;
  for(let j=0;j<NT;j++)idx.push(last+j,last+(j+1)%NT,tip);
  const g=new T.BG();g.setAttribute("position",new T.BA(P,3));g.setIndex(idx);g.computeVertexNormals();
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
  uRefl:{value:null},uReflM:{value:new T.M4()},uReflOn:{value:0},uNight:{value:0},uWind:{value:.35},uRainP:{value:0},uFogC:{value:new C3()},uFogNF:{value:new T.V2(400,900)}};
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
    fragmentShader:`uniform float uT,uReflOn,uNight,uWind,uRainP;uniform vec2 uFogNF;uniform vec3 uCamL,uSunL,uSunCol,uDeep,uShal,uBed,uSkyA,uSkyB,uFogC;uniform sampler2D uRefl;varying float vD;varying vec3 vP;varying vec4 vR;${GLSL_NOISE}
      /* raindrop rings: each cell rings once per cycle, two offset layers so the rings overlap */
      vec2 ringG(vec2 p){vec2 g=vec2(0.);for(int L=0;L<2;L++){vec2 q=p*(L==0?2.6:3.7)+float(L)*7.31;vec2 c=floor(q),f=fract(q)-.5;float h=dh2(c+float(L)*3.1);
        vec2 o=(vec2(dh2(c+1.3),dh2(c+2.7))-.5)*.5;vec2 d=f-o;float r=length(d),ph=fract(uT*(.9+.6*h)+h*7.),rad=ph*.42;
        float w=-2.*(r-rad)/.0016*exp(-(r-rad)*(r-rad)/.0016)*(1.-ph)*(1.-ph)*step(h,uRainP*1.15);g+=d/max(r,1e-3)*w*.012;}return g;}
      float wv(vec2 p){return dn2(p*1.1+vec2(uT*.35,uT*.12))*.6+dn2(p*2.7-vec2(uT*.22,-uT*.4))*.3+dn2(p*6.3+vec2(uT*.6,uT*.3))*.1;}
      void main(){
        float e=.06,h0=wv(vP.xz);vec2 g=vec2(wv(vP.xz+vec2(e,0.))-h0,wv(vP.xz+vec2(0.,e))-h0)/e;
        float amp=.022+.07*uWind;vec3 n=normalize(vec3(-g.x*amp,1.,-g.y*amp));
        if(uRainP>.003)n=normalize(n+vec3(ringG(vP.xz).x,0.,ringG(vP.xz).y)*smoothstep(.0,.1,vD));
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
        if(uReflOn>.5){vec2 ruv=vR.xy/vR.w+n.xz*.016;vec4 rc=texture2D(uRefl,clamp(ruv,0.,1.));
          rc=(any(isnan(rc))||any(isinf(rc)))?vec4(0.):clamp(rc,0.,1.);refl=mix(refl,rc.rgb*.7,rc.a*.92);}
        vec3 c=mix(body,refl,clamp(fr*1.05+.12,0.,.92));
        /* a faint darker band where the water meets the shore, and fine wind-roughened sparkle */
        c*=1.-.18*(1.-smoothstep(.0,.12,vD));
        float gl=pow(max(dot(rd,uSunL),0.),220.)*(1.-uNight),sp=pow(max(dot(rd,uSunL),0.),36.)*smoothstep(.55,.85,dn2(vP.xz*9.+uT*1.3))*(1.-uNight);
        c+=uSunCol*(gl*2.2+sp*.6);
        float a=smoothstep(0.,.05,vD);
        c=mix(c,uFogC,smoothstep(uFogNF.x,uFogNF.y,length(uCamL-vP)*${S.toFixed(3)}));
        gl_FragColor=vec4(c,a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`});
  pondMesh=new T.Mesh(g,m);pondMesh.renderOrder=2;W.add(pondMesh)})();
const pondRefl={rt:null,cam:null,bias:new T.M4().set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),cc:new C3(),frame:0};
const reflSet=[];
function renderPondReflection(){
  if(!pondMesh||!Cn||st.night>.5){pondU.uReflOn.value=0;return}
  if(MOB&&(pondRefl.frame++&1))return;
  if(!pondRefl.rt){const RT=bloom&&bloom.renderTargetsHorizontal&&bloom.renderTargetsHorizontal[0]&&bloom.renderTargetsHorizontal[0].constructor;if(!RT)return;
    pondRefl.rt=new RT(MOB?256:512,MOB?160:320);pondRefl.cam=De.clone();pondRefl.cam.layers.set(PALM_LAYER);pondU.uRefl.value=pondRefl.rt.texture}
  [pi,dc].forEach(l=>{if(l)l.layers.enable(PALM_LAYER)});
  reflSet.forEach(o=>{if(!o.userData._rl){o.traverse(c=>c.layers.enable(PALM_LAYER));o.userData._rl=1}});
  const Wy=W.position.y+POND.wy*S,c=pondRefl.cam;De.updateMatrixWorld();
  const e=De.matrixWorld.elements,cp=De.position;
  c.fov=De.fov;c.aspect=De.aspect;c.near=De.near;c.far=De.far;c.updateProjectionMatrix();
  c.position.set(cp.x,2*Wy-cp.y,cp.z);c.up.set(e[4],-e[5],e[6]);
  c.lookAt(cp.x-e[8]*10,2*Wy-(cp.y-e[9]*10),cp.z-e[10]*10);c.updateMatrixWorld();
  pondU.uReflM.value.copy(pondRefl.bias).multiply(c.projectionMatrix).multiply(c.matrixWorldInverse);
  const prevT=Cn.getRenderTarget(),prevA=Cn.getClearAlpha(),sAuto=Cn.shadowMap.autoUpdate;Cn.getClearColor(pondRefl.cc);
  Cn.shadowMap.autoUpdate=false;Cn.setRenderTarget(pondRefl.rt);Cn.setClearColor(0x000000,0);Cn.clear();Cn.render(Jt,c);
  Cn.setRenderTarget(prevT);Cn.setClearColor(pondRefl.cc,prevA);Cn.shadowMap.autoUpdate=sAuto;pondU.uReflOn.value=1}

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
const propU={uT:{value:0},uWind:{value:.35}};
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
        {float h=clamp(position.y/${H.toFixed(2)},0.,1.);float ph=modelMatrix[3].x*.9+modelMatrix[3].z*.7;
         float s=(sin(uT*.8+ph)*.7+sin(uT*1.6+ph*1.3)*.3)*(.25+uWind)*.16;
         transformed.x+=s*h*h;transformed.z+=s*.45*h*h;
         ${isTrunk?"":`float r=length(position.xz);float fl=smoothstep(.4,3.5,r)*(.3+uWind);
         transformed.y+=sin(uT*2.3+r*2.1+ph+position.x)*.07*fl;transformed.x+=sin(uT*3.1+r*3.+ph)*.04*fl;`}}`;
/* shadow caster for the crown: same sway, leaflet cut-outs */
function palmDepthMat(H){return new T.SM({uniforms:Object.assign({uLeaf:{value:LEAF_TEX}},propU),
  vertexShader:`uniform float uT,uWind;varying vec2 vUv;void main(){vUv=uv;vec3 transformed=position;${palmSway(H,false)}
    gl_Position=projectionMatrix*modelViewMatrix*vec4(transformed,1.);}`,
  fragmentShader:`#include <packing>
    uniform sampler2D uLeaf;varying vec2 vUv;void main(){if(texture2D(uLeaf,vUv).a<.5)discard;gl_FragColor=packDepthToRGBA(gl_FragCoord.z);}`})}
function palmMat(H,isTrunk){
  const m=new T.MSM({vertexColors:true,roughness:isTrunk?.95:.82,metalness:0,side:isTrunk?0:2});
  /* crown: mipmapped leaflet alpha, sharpened to a ~1px edge by its own screen derivative (alpha-to-coverage where
     the target is multisampled, blended otherwise); coverage is boosted with the mip level so leaflets don't thin out far away */
  if(!isTrunk){m.map=LEAF_TEX;m.transparent=true;m.alphaToCoverage=true}
  m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,propU);
    sh.vertexShader=sh.vertexShader.replace("#include <common>","#include <common>\nuniform float uT,uWind;attribute vec2 aUV;varying vec2 vUV;")
      .replace("#include <begin_vertex>",`#include <begin_vertex>
        vUV=aUV;${palmSway(H,isTrunk)}`);
    if(!isTrunk)sh.fragmentShader=sh.fragmentShader.replace("#include <alphatest_fragment>",`{
        vec2 tp=vMapUv*${LEAF_TS.toFixed(1)};vec2 dx=dFdx(tp),dy=dFdy(tp);float lod=max(0.,.5*log2(max(dot(dx,dx),dot(dy,dy))));
        float a0=diffuseColor.a*(1.+lod*.3);
        float a=clamp((a0-.5)/max(fwidth(a0),1e-4)+.5,0.,1.);
        a=mix(a,clamp(a0*1.15,0.,1.),smoothstep(.6,2.2,lod));
        if(a<.02)discard;diffuseColor.a=a;}`);
    /* trunk: leaf-base stubs on a golden-ratio spiral with wavy, uneven rows. In patches (mostly low down) the stubs
       have fallen off, leaving bare trunk with faint leaf-scar rings; the tone runs grey at the base to warm brown
       under the crown. Value noise is periodic around the trunk so the uv seam doesn't show. */
    if(isTrunk)sh.fragmentShader=sh.fragmentShader.replace("#include <common>",`#include <common>
        varying vec2 vUV;float pHs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        float pN(vec2 p,float per){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);float x0=mod(i.x,per),x1=mod(i.x+1.,per);
          return mix(mix(pHs(vec2(x0,i.y)),pHs(vec2(x1,i.y)),f.x),mix(pHs(vec2(x0,i.y+1.)),pHs(vec2(x1,i.y+1.)),f.x),f.y);}`)
      .replace("#include <color_fragment>",`#include <color_fragment>
        {float t=vUV.y/${H.toFixed(2)};
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
  m.customProgramCacheKey=()=>"des47palm"+(isTrunk?"t":"c")+H.toFixed(1);return m}
const DATE_GEO=(()=>{const{v,f}=icoSphere(1);return geoFrom(v.map(p=>[p[0]*.035,p[1]*.045,p[2]*.035]),f)})();
function buildPalms(){
  const dates=[];
  PALMS.forEach((pp,pi_)=>{
    sd=4100+pi_*77;
    const H=pp.h,cw=H>10?1:.78,grp=new T.Group();
    const spine=t=>new V3(pp.lean[0]*H*t*t*.9+Math.sin(t*2.2)*.25*pp.lean[0]*H,H*t,pp.lean[1]*H*t*t*.9);
    /* trunk */
    {const NR=40,NA=12,pos=[],col=[],uv=[],idx=[];
     for(let r=0;r<=NR;r++){const t=r/NR,P=spine(t),Tg=spine(Math.min(1,t+.01)).sub(spine(Math.max(0,t-.01))).normalize();
       const N=new V3().crossVectors(Tg,new V3(0,0,1)).normalize(),B=new V3().crossVectors(Tg,N);
       const rad=(.23+.17*Math.exp(-t*22)-.03*t+(t>.95?.04:0))*(H>10?1:.85)*(1+.035*Math.sin(t*H*1.1+pi_*2)+.025*Math.sin(t*H*2.9+pi_));
       for(let a=0;a<=NA;a++){const an=a/NA*TAU,c=Math.cos(an),s2=Math.sin(an),q=P.clone().addScaledVector(N,c*rad).addScaledVector(B,s2*rad);
         pos.push(q.x,q.y,q.z);const k=.8+.25*hs2(r*3.1,a);col.push(.42*k,.31*k,.21*k);uv.push(a/NA,t*H)}}
     for(let r=0;r<NR;r++)for(let a=0;a<NA;a++){const i0=r*(NA+1)+a,i1=i0+1,i2=i0+NA+1,i3=i2+1;idx.push(i0,i2,i1,i1,i2,i3)}
     const g=new T.BG();g.setAttribute("position",new T.BA(new Float32Array(pos),3));g.setAttribute("color",new T.BA(new Float32Array(col),3));g.setAttribute("aUV",new T.BA(new Float32Array(uv),2));g.setIndex(idx);g.computeVertexNormals();
     const m=new T.Mesh(g,palmMat(H,true));m.castShadow=m.receiveShadow=true;grp.add(m)}
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
      const g1=[mix(.1,.18,k),mix(.2,.24,k),mix(.05,.07,k)],g2=[mix(.32,.5,k),mix(.45,.48,k),mix(.1,.14,k)];
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
    const cm=new T.Mesh(g,palmMat(H,false));cm.customDepthMaterial=palmDepthMat(H);cm.castShadow=true;cm.receiveShadow=true;grp.add(cm);
    for(let c=0;c<(H>10?4:2);c++){const az=c/4*TAU+pp.ry+.4,base=top.clone().add(new V3(Math.cos(az)*.35,-.35,Math.sin(az)*.35));
      for(let k=0;k<46;k++){const u=rnd(),r=.06+.16*u;dates.push({p:base.clone().add(new V3(Math.cos(az)*u*.3+rr(-r,r),-u*.8+rr(-.05,.05),Math.sin(az)*u*.3+rr(-r,r))),g:grp,c:rnd()})}}
    grp.position.set(pp.x,hTop(pp.x,pp.z)-.1,pp.z);W.add(grp);reflSet.push(grp);PROPS.palms.push(grp);grp.userData.top=top.clone().add(grp.position)});
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
function covMips(img,cut){
  const w0=img.width,h0=img.height,c=document.createElement("canvas");c.width=w0;c.height=h0;const g=c.getContext("2d",{willReadFrequently:true});g.drawImage(img,0,0);
  const d0=g.getImageData(0,0,w0,h0).data,t=Math.ceil(cut*255-1e-6);let n0=0;for(let i=3;i<d0.length;i+=4)if(d0[i]>=t)n0++;
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
function cactusAlpha(root){const M=VT.THREE,done=new Set();
  root.traverse(o=>{if(!o.isMesh)return;const m=o.material;if(m.alphaTest>0)o.castShadow=false;else o.castShadow=true;o.receiveShadow=true;
    if(done.has(m))return;done.add(m);cleanMat(m);if(!ANIM_MATS.includes(m))ANIM_MATS.push(m);
    if(!(m.alphaTest>0)||!m.map||!m.map.image)return;
    const lv=covMips(m.map.image,m.alphaTest),t=new M.DataTexture(lv[0].data,lv[0].width,lv[0].height,M.RGBAFormat,M.UnsignedByteType);
    t.mipmaps=lv;t.generateMipmaps=false;t.flipY=false;t.colorSpace="srgb";t.wrapS=m.map.wrapS;t.wrapT=m.map.wrapT;
    t.magFilter=M.LinearFilter;t.minFilter=M.LinearMipmapLinearFilter;t.anisotropy=MOB?4:8;t.needsUpdate=true;
    m.map=t;m.alphaToCoverage=true;m.transparent=false;m.depthWrite=true;m.depthTest=true;m.side=2;m.needsUpdate=true})}
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
  glb("saguaro_v3").then(({scene})=>{cactusAlpha(scene);
    for(const s of SAG){const hi=scene.getObjectByName(s.k),lo=scene.getObjectByName(s.lo);if(!hi||!lo)continue;
      const w=cactusPlace(new T.Group().add(hi.clone(),lo.clone()),s,1);PROPS.sag.push(w);CLOD.push({w,hi:w.children[0],lo:w.children[1],x:s.x,z:s.z,h:s.k==="s12"?12:s.k==="s3"?3:7})}
    /* highest point of the giant = eagle roost */
    const w=PROPS.sag[0];if(!w)return;w.updateMatrixWorld(true);const inv=new T.M4().copy(W.matrixWorld).invert(),p=new V3();let best=null;
    w.children[0].traverse(c=>{if(!c.isMesh)return;const a=c.geometry.attributes.position;for(let i=0;i<a.count;i+=3){p.fromBufferAttribute(a,i).applyMatrix4(c.matrixWorld).applyMatrix4(inv);if(!best||p.y>best.y)best=p.clone()}});
    PROPS.sagTop=best}).catch(()=>{}),
  glb("cholla_v2").then(({scene})=>{cactusAlpha(scene);CACTI.forEach(c=>cactusPlace(new T.Group().add(scene.clone()),c,c.s))}).catch(()=>{}),
  /* barrels: one instanced draw per material for all of them; each tips about its base toward the sun's azimuth */
  glb("barrel_cactus_v3").then(({scene})=>{cactusAlpha(scene);scene.updateMatrixWorld(true);
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
        sh.vertexShader=sh.vertexShader.replace("#include <common>","#include <common>\nuniform mat4 uWInv;varying vec3 vTI;")
          .replace("#include <project_vertex>","#include <project_vertex>\nvTI=(uWInv*modelMatrix*vec4(transformed,1.)).xyz;");
        sh.fragmentShader=sh.fragmentShader.replace("#include <common>","#include <common>\nuniform vec3 uSunD,uSunC;uniform float uNt,uWetC;uniform vec2 uTC,uTF;varying vec3 vTI;")
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
        diffuseColor.rgb=mix(vec3(.2,.13,.08),min(cloth,vec3(.5,.43,.33)),smoothstep(.006,.025,l))*(1.-.3*uWetC);
        #endif`).replace("#include <lights_fragment_end>",`#include <lights_fragment_end>
        reflectedLight.indirectDiffuse*=vec3(1.02,.99,.95);
        {vec3 Ld=normalize((viewMatrix*vec4(uSunD,0.)).xyz);float back=pow(max(dot(-geometryViewDir,Ld),0.),2.);
         float trans=max(-dot(normal,Ld),0.);vec3 warm=mix(vec3(1.,.72,.45),vec3(1.),uNt);
         float cm=smoothstep(.12,.22,diffuseColor.r);
         reflectedLight.indirectDiffuse+=diffuseColor.rgb*uSunC*warm*trans*(.03+.16*back)*cm;
         float rim=pow(1.-clamp(abs(dot(normal,geometryViewDir)),0.,1.),3.);
         reflectedLight.indirectDiffuse+=diffuseColor.rgb*uSunC*warm*rim*back*.55*(1.-.7*uNt)*cm;}`)};m.needsUpdate=true});
    const g=new T.Group();g.add(w);g.position.set(TENT.x,hTop(TENT.x,TENT.z)-.05,TENT.z);g.rotation.y=TENT.yaw;
    g.traverse(c=>{if(c.isMesh){c.castShadow=c.receiveShadow=true;c.frustumCulled=false}});W.add(g);onDes(g);PROPS.tent=g}).catch(()=>{})]);

/* ---------------- drying rack beside the tent: forked poles, cross-bar, striped rugs, waterskin ---------------- */
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
  const cloth=(x,w,len,cols,ph)=>{const geo=new T.Plane(w,len,6,10),P=geo.attributes.position;
    for(let i=0;i<P.count;i++){const u=P.getX(i)/w,v=P.getY(i)/len+.5;P.setZ(i,Math.sin(v*Math.PI)*.08*(1-Math.abs(u)));}
    geo.computeVertexNormals();const m=new T.Mesh(geo,new T.MSM({map:stripeTex(cols),roughness:.95,side:2}));
    m.position.set(x,1.82-len/2+.02,.04);m.castShadow=true;m.receiveShadow=true;m.userData.ph=ph;g.add(m);return m};
  RACK.cloths=[cloth(-.75,1.1,1.5,["#8a2a22","#c8a070","#2a2a40","#b5452c","#e8d2a8"],0),cloth(.55,.9,1.3,["#d8c49a","#5a3a24","#a83a28","#efe2c0"],1.7)];
  const skin=new T.Mesh(new T.Sphere(.16,10,8),new T.MSM({color:"#5a3a22",roughness:.7}));skin.scale.set(1,1.35,.8);skin.position.set(1.35,1.45,0);skin.castShadow=true;g.add(skin);
  const pot=new T.Mesh(new T.Lathe([[0,0],[.14,.02],[.2,.12],[.18,.24],[.1,.3],[.11,.36]].map(p=>new T.V2(p[0],p[1])),12),new T.MSM({color:"#9a5a34",roughness:.85}));pot.position.set(-2.1,0,.5);pot.castShadow=true;g.add(pot);
  RACK.g=g})();
/* ---------------- campfire: 0.8 m stone ring, logs, shader flames, embers, light ---------------- */
const fireG=new T.Group();fireG.position.set(FIRE.x,hTop(FIRE.x,FIRE.z),FIRE.z);W.add(fireG);
const fireU={uT:{value:0},uNight:{value:0}};
let fireL=null;
(function campfire(){
  const stM=new T.MSM({color:"#7a6c60",roughness:.95});
  const im=new T.IM(ROCK_GEOS[1],stM,11),m=new T.M4(),q=new T.Quat();
  for(let i=0;i<11;i++){const a=i/11*TAU+rr(-.1,.1),s=rr(.13,.19);q.setFromAxisAngle(new V3(rr(-.3,.3),1,rr(-.3,.3)).normalize(),rnd()*TAU);
    m.compose(new V3(Math.cos(a)*.4,-.02,Math.sin(a)*.4),q,new V3(s*1.2,s,s));im.setMatrixAt(i,m)}
  im.castShadow=im.receiveShadow=true;fireG.add(im);
  const charM=new T.MSM({color:"#3a2618",roughness:.95,emissive:"#ff5a1a",emissiveIntensity:0});fireG.userData.charM=charM;
  for(let i=0;i<4;i++){const l=new T.Mesh(new T.Cyl(.045,.055,.62,7),charM);const a=i/4*TAU+.4;l.position.set(Math.cos(a)*.1,.1,Math.sin(a)*.1);l.rotation.set(0,-a,Math.PI/2-.42);l.rotation.order="YZX";l.castShadow=true;fireG.add(l)}
  const glow=new T.Mesh(new T.Plane(.7,.7),new T.SM({transparent:true,depthWrite:false,blending:2,uniforms:fireU,
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform float uT;varying vec2 vUv;void main(){float d=length(vUv-.5)*2.;float a=smoothstep(1.,0.,d);a*=a*(.75+.25*sin(uT*7.)*sin(uT*3.1));gl_FragColor=vec4(vec3(1.,.42,.12)*a*1.4,a);}`}));
  glow.rotation.x=-Math.PI/2;glow.position.y=.02;glow.renderOrder=3;fireG.add(glow);
  /* camera-facing flame quads: noise-eroded teardrops, additive */
  const flM=new T.SM({transparent:true,depthWrite:false,blending:2,side:2,uniforms:fireU,
    vertexShader:`attribute float aK;varying vec2 vUv;varying float vK;uniform float uT;
      void main(){vUv=uv;vK=aK;vec3 c=vec3(0.,0.,0.);
        vec3 rt=vec3(viewMatrix[0][0],viewMatrix[1][0],viewMatrix[2][0]);
        vec4 w=modelMatrix*vec4(position.x*0.,position.y,0.,1.);
        vec3 axX=normalize(vec3(modelMatrix[0][0],modelMatrix[0][1],modelMatrix[0][2]));float sc=length(vec3(modelMatrix[0][0],modelMatrix[0][1],modelMatrix[0][2]));
        w.xyz+=rt*position.x*sc;w.xyz+=rt*sin(uT*3.+aK*7.+position.y*4.)*.05*sc*position.y;
        gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader:`uniform float uT;varying vec2 vUv;varying float vK;${GLSL_NOISE}
      void main(){vec2 p=vUv-vec2(.5,0.);float h=vUv.y;
        float w=.42*(1.-h)*(.6+.8*sqrt(h))*1.2;
        float n=dn2(vec2(p.x*6.+vK*9.,h*4.-uT*3.2))*.6+dn2(vec2(p.x*13.,h*9.-uT*5.))*.4;
        float a=smoothstep(w,w*.35,abs(p.x)+(n-.5)*.18*h)*smoothstep(1.,.45,h+n*.35)*smoothstep(0.,.08,h);
        vec3 c=mix(vec3(1.,.95,.7),vec3(1.,.42,.08),smoothstep(.05,.6,h+abs(p.x)*1.2));c=mix(c,vec3(.8,.12,.02),smoothstep(.55,.95,h));
        if(a<.02)discard;gl_FragColor=vec4(c*a*1.6,a);}`});
  const flames=[];
  for(let i=0;i<3;i++){const geo=new T.Plane(1,1,1,4);geo.translate(0,.5,0);const n=geo.attributes.position.count;geo.setAttribute("aK",new T.BA(new Float32Array(n).fill(i*.37+.1),1));
    const f=new T.Mesh(geo,flM);f.scale.set([.42,.32,.26][i],[.62,.48,.38][i],1);f.position.set([0,.08,-.07][i],.08,[0,.05,.06][i]);f.renderOrder=8;f.frustumCulled=false;fireG.add(f);flames.push(f)}
  fireG.userData.flames=flames.map(f=>({f,s:f.scale.clone()}));
  fireL=new T.PL(new C3("#ff9a4a"),0,4.4,2);fireL.position.set(FIRE.x,hTop(FIRE.x,FIRE.z)+1.1,FIRE.z);W.add(fireL);fireL.layers.enable(3);
})();

/* campfire smoke: thin, torn wisps, camera-facing ribbons that leave the fire narrow, bend downwind as they rise,
   spread and thin out to nothing by ~5 m; a fire this small never makes a sheet */
const SMOKE_H=7.5;
const smokeU={uT:{value:0},uBase:{value:new V3(FIRE.x,fireG.position.y+.4,FIRE.z)},uWind:{value:new V3(WIND.x,0,WIND.z)},uCamL:{value:new V3()},uOp:{value:1},uCol:{value:new C3(.66,.6,.56)},uG:{value:.4},uNt:{value:0}};
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
    fragmentShader:`uniform float uT,uSeed,uA,uOp,uNt;uniform vec3 uCol;varying float vT,vS;varying vec2 vN;${GLSL_NOISE}
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
        a*=smoothstep(0.,.05,t)*(1.-smoothstep(.12,.62,t))*mix(1.25,.45,smoothstep(.04,.5,t));
        if(a<.006)discard;gl_FragColor=vec4(uCol*mix(.86,1.04,smoothstep(0.,.4,vT))+vec3(.42,.2,.07)*uNt*(1.-smoothstep(.02,.3,vT)),a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`});
  const mesh=new T.Mesh(g,mat);mesh.frustumCulled=false;mesh.renderOrder=7;W.add(mesh);SMOKE.push(mesh)}

/* ---------------- soft points (sand wisps, fireflies) ---------------- */
function softPoints(n,col,size,additive){
  const g=new T.BG(),P=new Float32Array(n*3),A=new Float32Array(n),Z=new Float32Array(n);
  g.setAttribute("position",new T.BA(P,3));g.setAttribute("a",new T.BA(A,1));g.setAttribute("z",new T.BA(Z,1));
  const m=new T.SM({transparent:true,depthWrite:false,blending:additive?2:1,uniforms:{uC:{value:new C3(col)},uS:{value:size*S/.25},uH:{value:innerHeight}},
    vertexShader:`attribute float a,z;varying float vA;uniform float uS,uH;void main(){vA=a;vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;
      gl_PointSize=clamp(uS*z*uH*.5/max(.5,-mv.z),1.,48.);}`,
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
  const q={x,z,y:hTop(x,z)+.05,vx:WIND.x*rr(1.5,3.4),vz:WIND.z*rr(1.5,3.4)+rr(-.3,.3),vy:crest?rr(.15,.5):rr(0,.12),life:init?rnd():0,dur:rr(2.5,6),crest};
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
let CURK=1;
function curtainUpdate(t){
  const{NS,NK}=CUR,P=CURT.P,Hv=CURT.Hv;
  for(let i=0;i<=NS;i++){const vn=(i/NS*2-1)*.95,[x,z]=crestXZ(vn),y=hTop(x,z),hv=Math.exp(-vn*vn*1.15),g=gustAt(x,z);
    const L=(.7+2.*g)*(.35+.65*hv)*(.6+.8*(.5+.5*Math.sin(i*.9+t*.7)*Math.sin(i*.37-t*.45))),rise=.1+.16*g,a=hv*ss(.12,.75,g)*(1-ss(.86,.97,sN(x,z)));
    for(let k=0;k<=NK;k++){const q=k/NK,o=i*(NK+1)+k,d=q*L;
      P[o*3]=x+WIND.x*d;P[o*3+1]=y-.03+(.16+.3*g)*(1-Math.exp(-d*1.6))+d*rise*.3-.08*d*q+.08*q*Math.sin(t*2.1+i*.45+q*4)*g;P[o*3+2]=z+WIND.z*d;Hv[o]=a*CURK}}
  CURT.g.attributes.position.needsUpdate=CURT.g.attributes.aH.needsUpdate=true}
/* ---------------- sand falls: sand blown to the rim pours over the lip all round the island, like the sky sea's water falls ----------------
   Each fall is one ribbon: a short run of moving sand over the surface to a low point of the lip, then a granular sheet that
   leaves the lip, falls clear of the cliff (its path is fitted to the cliff mesh), tears into strands and grains and thins into dust
   above the cloud sea. Wind sets the rate: more on the downwind rim and in gusts and dust storms; rain damps the sand into a few
   darker, lighter trickles. Heavy falls, thinner falls and trickles with dry rim between, as at the sea's rim. */
const SF={H:28,G:9.8,F:[]};SF.Tf=Math.sqrt(2*SF.H/SF.G);
const sfU={uT:{value:0},uFT:{value:0},uFR:{value:.6},uWet:{value:0},uDust:{value:0},uNt:{value:0},uWV:{value:new T.V2()},
  uCol:curU.uCol,uSheen:curU.uSheen,uLd:sandU.uLd,uGT:sandU.uGT,uWD:sandU.uWD,uFogC:pondU.uFogC,uFogNF:pondU.uFogNF};
(function sandFalls(){
  /* a seed of their own, so the falls do not shift the rest of the layout */
  let ps=5281;const pr=()=>{ps=ps+0x6D2B79F5|0;let t=Math.imul(ps^ps>>>15,1|ps);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296},prr=(a,b)=>a+(b-a)*pr();
  /* [half width min, max, rate threshold min, max] for heavy falls, thinner falls, trickles */
  const kinds=[[1.1,1.8,0,.05],[.45,.8,.06,.24],[.12,.24,.2,.42]],pat=[0,2,1,2,0,1,2,1,2,1],nF=MOB?16:24,sl=TAU/nF;
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
    for(let tries=0;tries<3&&!best;tries++,hw*=.65)for(let c=0;c<13;c++){const th=k*sl+.4+prr(-.36,.36)*sl,[ix,iz]=edgeXZ(th,.93);if(pN(ix,iz)<1.4||!clearOf(ix,iz,hw+.35))continue;
      const E=frame(th),P=probe(E,hw);if(P.lipY<-50||P.bulge>1)continue;const sc=P.bulge+.08*c;if(!best||sc<best.sc)best={th,E,P,sc}}
    if(!best)continue;hw/=.65;
    pick.push({ty,hw,E:best.E,P:best.P,k:prr(K[2],K[3]),sd:pr()*50,v0:prr(2.1,2.9)})}
  const pos=[],aU=[],aK=[],aN=[],aT=[],idx=[],nG=MOB?4:6,nv=MOB?24:34;
  for(const f of pick){const{E,P,hw}=f,nu=hw<.3?3:MOB?7:10,o=pos.length/3,rows=[];
    const lipAt=d=>{const b=Math.floor((d+3)/.2);return b>=0&&b<16?P.LP[b]:-99};
    const req=y=>{const b=Math.floor((P.lipY-y)/.5);let m=-9;for(let k=Math.max(0,b);k<Math.min(64,b+3);k++)m=Math.max(m,P.B[k]);return m};
    /* the run over the surface to the lip: a funnel narrowing to the pour */
    for(let j=0;j<nG;j++){const g=j/nG,d=P.lipD-2.4*(1-g),x=E.x+E.nx*d,z=E.z+E.nz*d,y=Math.max(hTop(x,z)+.035,lipAt(d)+.05);rows.push({d,y,s:g-1,w:hw*(1.7-.7*g),sl:0})}
    /* the pour: falls from the lip crest, clear of the cliff; s is fall time, the drop growing as s*s */
    let dp=P.lipD;const path=[];
    for(let j=0;j<=nv;j++){const s=Math.pow(j/nv,1.3),tau=s*SF.Tf,y=P.lipY+.05-.5*SF.G*tau*tau,c=req(y);
      const d=Math.max(P.lipD+.04+f.v0*tau,c+.3,dp);dp=d;path.push([d,y]);
      rows.push({d,y,s,w:hw*(1-.22*ss(0,.2,s)+1.9*Math.pow(ss(.25,1,s),1.4)),sl:Math.max(0,d-c-.3)})}
    for(const r of rows){const cx=E.x+E.nx*r.d,cz=E.z+E.nz*r.d;
      for(let i=0;i<=nu;i++){const u=i/nu,lat=(u*2-1)*r.w;pos.push(cx+E.tx*lat,r.y,cz+E.tz*lat);aU.push(u,r.s);aK.push(f.k,f.sd,hw);aN.push(E.nx,E.nz,r.sl);aT.push(E.tx*lat,E.tz*lat)}}
    for(let j=0;j<rows.length-1;j++)for(let i=0;i<nu;i++){const q=o+j*(nu+1)+i,b=q+nu+1;idx.push(q,b,q+1,b,b+1,q+1)}
    SF.F.push({E,k:f.k,hw,path,ty:f.ty})}
  const g=new T.BG();g.setAttribute("position",new T.BA(new Float32Array(pos),3));g.setAttribute("aU",new T.BA(new Float32Array(aU),2));
  g.setAttribute("aK",new T.BA(new Float32Array(aK),3));g.setAttribute("aN",new T.BA(new Float32Array(aN),3));g.setAttribute("aT",new T.BA(new Float32Array(aT),2));g.setIndex(idx);
  const m=new T.SM({uniforms:sfU,transparent:true,depthWrite:false,side:2,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-6,
    vertexShader:`attribute vec2 aU,aT;attribute vec3 aK,aN;uniform float uT,uFR,uWet;uniform vec2 uWV;uniform vec3 uLd;${GLSL_GUST}
      varying vec2 vU;varying vec3 vK,vW;varying float vVis,vFs,vLam;
      void main(){vU=aU;vK=aK;vec2 n=aN.xy;
        /* the downwind rim pours first; as the wind veers, falls on the rim it now blows across start and others ease off */
        float wl=length(uWV),k=aK.x+.22*(.5-.5*dot(n,uWV/max(wl,1e-4))),s=aU.y,vis=smoothstep(k,k+.3,uFR);vVis=vis;vec3 p=position;
        p.xz-=aT*(1.-(.45+.55*vis)*(1.+.25*clamp(uFR-1.,0.,1.)));
        if(s>0.){float f=pow(s,1.7);
          /* the wind carries the lower fall downwind and sways it; it may lean in toward the cliff only as far as the clearance allows */
          vec2 tg=vec2(-n.y,n.x),dr=uWV*f*(.6+.8*gustF(p.xz))*3.+tg*sin(uT*.8+aK.y)*.3*f;
          float side=dot(dr,tg);dr-=tg*side*(1.-.8*smoothstep(.45,.9,s));
          float inw=dot(dr,n);dr-=n*(inw-max(inw,-aN.z));p.xz+=dr;}
        vec4 w=modelMatrix*vec4(p,1.);vW=w.xyz;
        vec3 Nl=s>0.?vec3(n.x,.2,n.y):vec3(0.,1.,0.),Nw=normalize(mat3(modelMatrix)*Nl);
        vLam=.5+.5*max(dot(Nw,uLd),0.);
        vFs=pow(max(dot(normalize(cameraPosition-w.xyz),-uLd),0.),4.);
        gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader:`uniform float uT,uFT,uFR,uWet,uDust,uNt;uniform vec2 uFogNF;uniform vec3 uCol,uSheen,uFogC;varying vec2 vU;varying vec3 vK,vW;varying float vVis,vFs,vLam;${GLSL_NOISE}
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
          a=(smoothstep(.45,.75,q)*.32+gr*.45)*smoothstep(0.,.4,g)*smoothstep(0.,.3,ed)*mix(1.,.45,uWet);
          c=base*(1.06+.12*q);
        }else{
          /* u rides with the falling sand: anything scrolled at this rate in s moves with the grains and stretches as they speed up */
          float u=s-uFT*${(1/SF.Tf).toFixed(4)},wet=uWet;
          float Xw=tx+.35*(dn2(vec2(tx*.23+7.,u*2.4))-.5);
          float n1=dn2(vec2(Xw*.5,u*1.6)),n2=dn2(vec2(Xw*1.3+5.,u*4.)),n3=dn2(vec2(Xw*3.1+9.,u*9.));
          float str=n1*.5+n2*.32+n3*.18,ab=clamp(fwidth(Xw*1.3)*.8-.2,0.,1.);
          /* fine grain texture across the sheet, evened out where it would be finer than a pixel */
          vec2 fq=vec2(x*Nt*9.+sd,u*150.);float fAA=clamp(max(fwidth(fq.x),fwidth(fq.y))-.6,0.,1.),speck=mix(dh2(floor(fq)),.5,fAA);
          /* ragged sides: strands peel off as it falls */
          float ew=dn2(vec2(x*1.7+sd,u*1.1))*.6+dn2(vec2(x*4.1+sd,u*3.3))*.4,dk=uDust*smoothstep(.04,.3,s);
          /* in a dust storm the sheet comes off the lip in clumps and surges, its sides fraying into loose strands */
          float cm=1.,sgU=1.,fr=0.;
          if(dk>.01){cm=fallN(vec2(Xw*.9+11.,sd),s,5.,24.)*.55+fallN(vec2(Xw*2.6+4.,sd*2.),s,12.,55.)*.45;sgU=fallN(vec2(Xw*.12+sd*.7,sd),s,1.5,6.);fr=fallN(vec2(x*13.+sd,0.),s,10.,40.);
            str=mix(str,fallN(vec2(Xw*.7,9.),s,3.,14.)*.6+fallN(vec2(Xw*1.8+5.,2.),s,7.,30.)*.4,dk);}
          float edge=smoothstep(0.,.05+.12*s,ed-(.04+.2*s)*ew*(1.+1.6*dk)-.05*(1.-n2)*s-.1*dk*fr);
          /* a dense sheet off the lip that tears into strands lower down; each strand gives out at its own height, trickles soonest */
          float tear=mix(smoothstep(.36+.2*s,.5+.24*s,str),.45,ab);
          float body=(.97-.45*smoothstep(.05,.6,s))*edge*mix(1.,tear,smoothstep(.1,.45,s)*(.55+.45*min(uFR,1.)))*mix(1.,(.08+1.25*smoothstep(.4,.58,cm))*(.25+.95*smoothstep(.25,.75,sgU)),dk)*mix(1.,smoothstep(.25,.55,str),wet*.45)*(.78+.22*speck);
          float endS=mix(.38,.68,smoothstep(.15,1.,hw))+.3*dn2(vec2(Xw*1.6+17.,sd))+.08*dn2(vec2(Xw*4.+3.,sd+1.))+.16*uDust,cut=1.-smoothstep(endS-.22,endS+.04,s);
          /* grains, streaked by their speed; more of them shed at the sides and the foot */
          vec2 dq=vec2(x*Nt*2.2+sd,u*70.),dc=floor(dq);float dh=dh2(dc);vec2 df=fract(dq)-.5-(vec2(dh2(dc+3.1),dh2(dc+7.7))-.5)*.6;df.y*=mix(1.,.35,smoothstep(.1,.7,s));
          vec2 gw=fwidth(dq);float gd=.9-.2*(1.-edge)-.18*smoothstep(.4,.9,s)+.06*wet-.12*dk;
          float grain=step(gd,dh)*exp(-dot(df,df)*26.)*smoothstep(.02,.1,s)*(1.-smoothstep(.9,1.,s))*(1.-clamp(max(gw.x,gw.y)*1.4-.3,0.,1.));
          /* dust shed off the sheet: a soft veil that spreads down the fall, more in a dust storm and off the heavy falls, little off damp sand */
          float du=dn2(vec2(x*2.3+sd,u*2.6))*.6+dn2(vec2(x*5.+sd*2.,u*6.))*.4;
          /* in a storm the veil is torn too: drifting clots of dust with ragged sides, not an even haze */
          float vc=dk>.01?fallN(vec2(x*3.1+sd,5.),s,2.5,10.):.5;
          float dust=smoothstep(.12,.7,s)*(1.-smoothstep(.78,1.,s))*smoothstep(-.1,.45,ed+.25*du-.35*dk*(fr-.4))*(.3+.5*du)*(.7+.6*uDust)*mix(1.,(.2+.8*cm)*(.05+1.6*smoothstep(.35,.72,vc)),dk)*(1.-.8*wet)*(.45+.55*smoothstep(.1,.6,hw));
          float bc=body*cut;
          a=(bc*(.62+.38*str)+grain*.85*(1.-smoothstep(.9,1.,s)))+dust*(1.-.6*bc);
          /* thick sheet shades itself; thin strands and edges catch the light */
          c=base*(.8+.22*n3)*(1.-.14*bc*smoothstep(.1,.5,ed));
          c=mix(c,base*1.12+uSheen*vFs*.7*(1.-.75*uNt),clamp(1.-bc,0.,1.)*.55);
          c=mix(c,base*1.04+vec3(.035,.03,.025)*(1.-uNt),dust/(a+.001)*.55);
          /* a sheet seen edge-on piles up alpha into a hard line: keep the stream but thin it */
          vec3 N=normalize(cross(dFdx(vW),dFdy(vW)));a*=mix(.5,1.,smoothstep(.05,.45,abs(dot(N,normalize(cameraPosition-vW)))));
        }
        a*=vis*(.72+.28*min(uFR,1.));if(a<.004)discard;
        c=mix(c,uFogC,smoothstep(uFogNF.x,uFogNF.y,length(cameraPosition-vW)));
        float ck=c.r+c.g+c.b+a;if(!(ck>-1.&&ck<1e3))discard;
        gl_FragColor=vec4(c,clamp(a,0.,1.));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`});
  SF.mesh=new T.Mesh(g,m);SF.mesh.frustumCulled=false;SF.mesh.renderOrder=6;W.add(SF.mesh)})();
/* dust trails: soft puffs shed by the falls that drift downwind, spread and thin out into the air below the island */
const SFD=softPoints(MOB?70:140,"#e4c69c",.9,false);SFD.o.renderOrder=6;W.add(SFD.o);
const SFDP=[];{let ps=9127;const pr=()=>{ps=ps+0x6D2B79F5|0;let t=Math.imul(ps^ps>>>15,1|ps);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
  for(let i=0;i<SFD.n;i++)SFDP.push({f:SF.F.length?Math.floor(pr()*SF.F.length):0,life:pr(),dur:2.5+3*pr(),x:0,y:0,z:0,vx:0,vy:0,vz:0,z0:.7+.8*pr(),r:pr});
  SFD.pr=pr;if(SF.F.length)for(const q of SFDP){const l=q.life;sfDust(q);q.life=l}}
function sfDust(q){const F=SF.F,pr=SFD.pr;let f=F[q.f];
  /* heavier falls shed more dust */
  for(let k=0;k<4;k++){const c=F[Math.floor(pr()*F.length)];if(c.hw>f.hw||pr()<.2)f=c}
  q.f=F.indexOf(f);const j=Math.floor((.35+.6*pr())*(f.path.length-1)),[d,y]=f.path[j],s=j/(f.path.length-1),lat=(pr()*2-1)*f.hw,dr=Math.pow(s,1.7)*3*sfU.uWV.value.length();
  q.x=f.E.x+f.E.nx*(d+.2)+f.E.tx*lat+WIND.x*dr;q.z=f.E.z+f.E.nz*(d+.2)+f.E.tz*lat+WIND.z*dr;q.y=y;
  q.vx=WIND.x*(.4+.6*pr())+f.E.nx*.35;q.vz=WIND.z*(.4+.6*pr())+f.E.nz*.35;q.vy=-1.2-1.2*pr();q.life=0;q.dur=2.5+3*pr()}
function sandFallsUpdate(dt,t,wn,nk){
  /* the rate follows the wind and its gusts; dust storms feed it, wet sand barely moves */
  const fr=cl((.45+.7*wn)*(.75+.5*gustAt(0,0))*(1+1.3*WX.dust)*(1-.25*WX.wet),0,2.2);
  sfU.uFR.value=SF.pin!=null?SF.pin:sfU.uFR.value+(fr-sfU.uFR.value)*Math.min(1,dt*.6);sfU.uFT.value+=dt;sfU.uT.value=t;sfU.uWet.value=WX.wet;sfU.uDust.value=WX.dust;sfU.uNt.value=nk;
  sfU.uWV.value.set(WIND.x,WIND.z).multiplyScalar((.4+1.2*wn)*(1+1.2*WX.dust)*(1-.5*WX.wet));
  if(!SF.F.length){SFD.o.visible=false;return}
  const R=sfU.uFR.value,wv=sfU.uWV.value.length();
  for(let i=0;i<SFD.n;i++){const q=SFDP[i];q.life+=dt/q.dur;
    if(q.life>=1)sfDust(q);
    const f=SF.F[q.f],k=f.k+.22*(.5-.5*(f.E.nx*WIND.x+f.E.nz*WIND.z)),vis=ss(k,k+.3,R),sp=.5+wv;
    q.x+=q.vx*dt*sp;q.z+=q.vz*dt*sp;q.y+=q.vy*dt;q.vy*=Math.exp(-dt*.5);
    const o=i*3;SFD.P[o]=q.x;SFD.P[o+1]=q.y;SFD.P[o+2]=q.z;SFD.Z[i]=q.z0*(1+2.4*q.life);
    SFD.A[i]=Math.sin(q.life*Math.PI)*.045*vis*Math.min(1,f.hw/.35+.25)*(1+1.4*WX.dust)*(1-.85*WX.wet)}
  SFD.g.attributes.position.needsUpdate=SFD.g.attributes.a.needsUpdate=SFD.g.attributes.z.needsUpdate=true;SFD.m.uniforms.uH.value=innerHeight;
  SFD.m.uniforms.uC.value.copy(curU.uCol.value).multiplyScalar(1.05)}
/* night fireflies over the oasis */
const FF=softPoints(MOB?18:32,"#d8ff8a",.12,true);FF.o.renderOrder=9;W.add(FF.o);
const FFP=[];for(let i=0;i<FF.n;i++){const[a,b]=pondEdge(rnd()*TAU,rr(.8,1.9));FFP.push({x:a,z:b,y:rr(.4,2.6),ph:rnd()*TAU,sp:rr(.3,.7),bl:rr(.6,1.4)});FF.Z[i]=rr(.8,1.2)}
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
  uCov:{value:0},uDark:{value:0},uDust:{value:0},uDustC:{value:new C3("#a77a4a")},uRain:{value:0},uShaft:{value:0},
  uBolt:{value:0},uBoltA:{value:0},uIc:{value:0},uIcA:{value:0},uBoltS:{value:0},uBoltE:{value:0},uRb:{value:0},uRbDir:{value:new V3(0,-1,0)},
  uVdSun:{value:new V3(0,1,0)},top:jt.top,bot:jt.bot,uGlowC:jt.uGlowC,uGlowA:jt.uGlowA,uSunDisk:jt.uSunDisk};
const skyM=new T.SM({uniforms:skyU,side:1,depthWrite:false,depthTest:true,fog:false,toneMapped:false,transparent:true,premultipliedAlpha:true,
  vertexShader:`varying vec3 vDir;void main(){vec4 w=modelMatrix*vec4(position,1.);vDir=w.xyz-cameraPosition;gl_Position=projectionMatrix*viewMatrix*w;}`,
  fragmentShader:`uniform sampler2D map;uniform float uYaw0,uTile,uVspan,uHor,uSkyK,uSunVis,uExpo,uCon,uMoonL,uT,uCov,uDark,uDust,uRain,uShaft,uBolt,uBoltA,uIc,uIcA,uBoltS,uBoltE,uRb,uGlowA;
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
      col*=(1.-.45*uDark)*(1.-.32*uCov*cs);
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
const bloom=Ta.passes.find(p=>p&&p.strength!=null&&p.threshold!=null&&p.radius!=null)||null;

/* ---------------- time of day ---------------- */
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
  night:{el:21,az:0,sel:2.1,col:"#abc9f0",I:1.6,sky:"#18295c",gnd:"#0b0d14",hI:.085,exp:.7,con:.14,sat:.86,ray:0,vig:.36,tint:[.86,.93,1.12],lift:0,top:"#040916",bot:"#111a30",glow:"#000000"}};
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
const WX={nb:3,rain:0,ovc:0,dark:0,dust:0,wet:0,heat:0,after:0,shel:0,flash:0,bolt:0,boltA:0,boltS:0,boltE:0,bAge:9,icF:0,icA:0,ic:4,rb:0,shaft:0,sunK:1};
const DUSTLV=[0,.32,.56,.8,1];
const WXT={sun:[0,0,0],cloud:[.86,.25,.2],lrain:[.42,.22,.55],mrain:[.62,.4,.7],hrain:[.86,.62,.9],storm:[.95,.8,1],dust:[0,.25,0]};
function wxUpdate(dt){
  const w=Ct.weather,k=dt>0?1-Math.exp(-dt*.4):1,T=WXT[w]||WXT.sun;
  const rT={lrain:.32,mrain:.62,hrain:1,storm:1}[w]||0,dT=w==="dust"?DUSTLV[Ct.dustLv||2]:0;
  WX.rain+=(rT-WX.rain)*k;WX.dust+=(dT-WX.dust)*k*.7;WX.ovc+=(T[0]-WX.ovc)*k;WX.dark+=(T[1]-WX.dark)*k;
  WX.shaft+=(Math.max(T[2]*(rT>0?1:0),w==="cloud"?.25:0)-WX.shaft)*k;
  if(dt<=0)WX.wet=WX.rain>.05?1:WX.wet;
  else if(WX.rain>.02)WX.wet=Math.min(1,WX.wet+dt*WX.rain*.13);
  else WX.wet=Math.max(0,WX.wet-dt*.011*(.35+.9*(1-st.night)*(1-WX.ovc))*(.6+st.wn));
  WX.after=WX.rain>.2?1:Math.max(0,WX.after-dt/240);
  const hot=w==="sun"?(Ct.ct==="clear"||Ct.ct==="cirrus"?1:.75):0;
  WX.heat+=(hot*(LK.day+.3*LK.sunset+.15*LK.sunrise)*(1-WX.wet)-WX.heat)*k;
  const sh=WX.dust>.45||(w==="storm"||w==="hrain")&&WX.rain>.6;WX.shel=sh?1:WX.dust<.35&&WX.rain<.45?0:WX.shel;
  const sunUp=(1-LK.night)*(1-ss(.62,.86,WX.ovc))*(1-WX.dust);
  WX.rb+=(cl(Math.max(WX.rain*3,WX.after>.88?(WX.after-.88)/.12:0),0,1)*sunUp*(.55+.45*(LK.sunset+LK.sunrise))-WX.rb)*(dt>0?1-Math.exp(-dt*.25):1);
  WX.sunK=(1-.72*WX.ovc)*(1-.8*WX.dust);
  /* lightning runs on the scene's own clock (the app's strike timer is ignored here); between strikes the deck flickers with cloud flashes */
  if(w==="storm"&&WX.rain>.5){WX.nb-=dt;if(WX.nb<0){WX.nb=rr(7,18);strike(rr(.3,1))}}else WX.nb=rr(2,5);
  WX.bAge+=dt;const b=WX.bAge;
  WX.bolt=b<.6?Math.max(0,1-b/.6)*(b<.07||(b>.14&&b<.2)||(b>.3&&b<.34)?1:.25):0;
  if(w==="storm"&&WX.rain>.5){WX.ic-=dt;if(WX.ic<0){WX.ic=rr(2.5,8);WX.icF=1;WX.icA=rr(-Math.PI,Math.PI)}}
  WX.icF=Math.max(0,WX.icF-dt*3.5);
  WX.flash=Math.max(WX.bolt,WX.icF*.35*(.6+.4*Math.sin(st.t*61)));
  st.wn=Math.max(st.wn,.35+WX.dust*.7,w==="storm"?.35+.45*WX.rain:0)}
/* far: 0 overhead .. 1 at the horizon; the bolt falls somewhere in front of the camera, lower and smaller the farther it is */
function strike(far){WX.bAge=0;WX.boltA=wrapA(Math.atan2(-De.matrixWorld.elements[8],-De.matrixWorld.elements[10])+(rnd()<.5?-1:1)*rr(.3,.7));
  WX.boltS=rr(0,100);WX.boltE=SKY_HOR-mix(.12,.02,far);thunder(far)}
window.__desThn=()=>{};

function applyLighting(dt){
  const ph=phaseNow();st.phase=ph;
  const k=dt>0?ease(1.6,dt):1;for(const p in LK)LK[p]+=((p===ph?1:0)-LK[p])*k;
  st.night=LK.night;st.day=LK.day;
  if(Ct.mode==="night"){Ct.mode="full";Ct.night=true}
  wxUpdate(dt);
  const el=blendL("el")*D2R,nk=LK.night,ao=blendL("az")*D2R;
  const a=nk>.5?moonAzL+YAW:SUN.lazL+YAW+ao;
  const d=new V3(Math.cos(el)*Math.sin(a),Math.sin(el),Math.cos(el)*Math.cos(a));
  if(pi){pi.position.copy(d).multiplyScalar(40);if(pi.target){pi.target.position.set(0,-1,0);pi.target.updateMatrixWorld()}
    blendC("col",pi.color);pi.color.lerp(_c1.set("#dfe4ee"),.5*WX.ovc).lerp(_c1.set("#e89a58"),.75*WX.dust);
    pi.intensity=blendL("I")*WX.sunK+WX.flash*2.4;pi.castShadow=true;tentU.uSunD.value.copy(d);tentU.uSunC.value.copy(pi.color).multiplyScalar(pi.intensity);tentU.uNt.value=nk;
    const sc=pi.shadow.camera;if(sc.right!==12.5){Object.assign(sc,{left:-12.5,right:12.5,top:12.5,bottom:-12.5,near:1,far:90});sc.updateProjectionMatrix()}
    pi.shadow.bias=-.0004;pi.shadow.normalBias=.025;pi.layers.enable(3);
    /* the hidden courtyard stays on layer 0; at low sun/moon its walls would shade the whole island */
    if(pi.shadow.camera.layers.mask!==L3){if(_shMask==null)_shMask=pi.shadow.camera.layers.mask;pi.shadow.camera.layers.mask=L3}}
  if(dc){blendC("sky",dc.color);dc.color.lerp(_c1.set("#a4acb8").multiplyScalar(1-.9*nk),.6*WX.ovc).lerp(_c1.set("#c08e5c").multiplyScalar(1-.9*nk),.8*WX.dust);
    if(dc.groundColor)blendC("gnd",dc.groundColor);
    dc.intensity=blendL("hI")*(1+.2*WX.ovc+.7*WX.dust)*(1-.35*WX.dark)+WX.flash*1.6;dc.layers.enable(3)}
  if(Cn){Cn.toneMappingExposure=blendL("exp")*(1+.1*WX.ovc);Cn.shadowMap.enabled=true}
  /* the shared sky: follows the camera, lowered onto the cloud sea's horizon, sun and colours from the desert's own light */
  const as=appSkyMesh();
  if(as){as.layers.enable(3);as.visible=true;as.position.set(De.position.x,De.position.y-VD_DROP,De.position.z)}
  const sunVis=(1-nk)*(1-ss(.45,.85,WX.ovc))*(1-.85*WX.dust);
  if(jt){const sa=sunAzW()+ao,se=blendL("sel")*D2R;jt.sunDir.value.set(Math.cos(se)*Math.sin(sa),Math.sin(se),Math.cos(se)*Math.cos(sa));skyU.uVdSun.value.copy(jt.sunDir.value);
    const lo=LK.sunset+LK.sunrise;
    if(jt.uSunVis)jt.uSunVis.value=sunVis*.95;
    if(jt.uSunDisk)jt.uSunDisk.value.set(1,mix(mix(.62,.97,LK.day),.72,WX.dust),mix(mix(.3,.88,LK.day),.5,WX.dust));
    if(jt.uGlowA)jt.uGlowA.value=lo*.9*(1-ss(.3,.85,WX.ovc))*(1-WX.dust);
    if(jt.uGlowC)blendC("glow",_c3),jt.uGlowC.value.set(_c3.r,_c3.g,_c3.b);
    blendC("top",_c1);blendC("bot",_c2);
    const oc=Math.min(.95,.85*WX.ovc+.35*WX.rain);_c3.set("#6e7786").multiplyScalar(mix(1,.1,nk));_c1.lerp(_c3,oc);_c3.set("#aab2bd").multiplyScalar(mix(1,.12,nk));_c2.lerp(_c3,oc);
    _c1.multiplyScalar(1-.55*WX.dark);_c2.multiplyScalar(1-.5*WX.dark);
    _c3.set("#86643f").multiplyScalar(mix(1,.08,nk));_c1.lerp(_c3,WX.dust);_c3.set("#c49564").multiplyScalar(mix(1,.08,nk));_c2.lerp(_c3,WX.dust);
    jt.top.value.copy(_c1);jt.bot.value.copy(_c2);
    if(/rain|storm/.test(Ct.weather)&&jt.uCover)jt.uCover.value=mix(jt.uCover.value,.3+.62*WX.ovc,.9);
    if(WX.dust>.01&&jt.uCover)jt.uCover.value=mix(jt.uCover.value,.9,WX.dust);
    if(jt.moonDir){const ma=moonAzL+YAW,me=24*D2R;jt.moonDir.value.set(Math.cos(me)*Math.sin(ma),Math.sin(me),Math.cos(me)*Math.cos(ma))}
    if(jt.flash)jt.flash.value=WX.flash*.5}
  skyU.uK.value.set(LK.sunset,LK.day,LK.night,LK.sunrise);skyU.uSunVis.value=sunVis;skyU.uExpo.value=Cn?Cn.toneMappingExposure:1;skyU.uCon.value=mix(1.06,1.1,LK.sunset);
  skyU.uCov.value=WX.ovc;skyU.uDark.value=WX.dark;skyU.uDust.value=WX.dust;skyU.uRain.value=WX.rain;skyU.uShaft.value=WX.shaft*(1-WX.dust);skyU.uRb.value=WX.rb;
  skyU.uDustC.value.set("#b98a5c").multiplyScalar(mix(1,.07,nk)*(1-.3*WX.dark));
  {const ma=moonAzL+YAW;skyU.uMoonW.value.set(Math.sin(ma),.3,Math.cos(ma));skyU.uMoonL.value=jt&&jt.uMoonVis?cl(jt.uMoonVis.value*1.2,.25,1):1}
  skyU.uBolt.value=WX.bolt;skyU.uBoltA.value=WX.boltA;skyU.uBoltS.value=WX.boltS;skyU.uBoltE.value=WX.boltE;
  skyU.uIc.value=WX.icF*(.6+.4*Math.sin(st.t*47));skyU.uIcA.value=WX.icA;
  skyU.uRbDir.value.copy(d).negate();
  [X.Dc,X.qc].forEach(o=>{if(o&&o.layers)o.traverse(c=>c.layers.disable(3))});
  /* dust and heavy rain close the air in; the haze is lit like the sky */
  /* the island's centre stays at most ~70% fogged however far the camera is (the phone view sits ~60 out) */
  if(Jt.fog){const dz=WX.dust,fd=ss(0,.25,dz),far=Math.max(mix(mix(900,150,ss(.3,1,WX.rain)*.85),mix(240,34,ss(.3,1,dz)),fd),De.position.distanceTo(_v.setFromMatrixPosition(W.matrixWorld))/.69);
    Jt.fog.far=far;Jt.fog.near=far*mix(.45,.04,fd);
    _c1.copy(jt?jt.bot.value:_c1.set("#c8b8b0")).multiplyScalar(.9);Jt.fog.color.copy(_c1).lerp(skyU.uDustC.value,ss(0,.2,dz))}
  const g=gradeM.uniforms;g.uCon.value=blendL("con")*(1-.45*WX.ovc);g.uSat.value=blendL("sat")*(1-.25*WX.ovc)*(1-.22*WX.dust);g.uRay.value=blendL("ray")*(1-WX.ovc)*(1-WX.dust);g.uVig.value=blendL("vig")+.12*WX.dust;g.uLift.value=blendL("lift")+.02*WX.dust;
  g.uTint.value.set(0,0,0);for(const p in LK){const t=LIT[p].tint;g.uTint.value.x+=t[0]*LK[p];g.uTint.value.y+=t[1]*LK[p];g.uTint.value.z+=t[2]*LK[p]}
  g.uTint.value.lerp(_v.set(.97,.99,1.03),.5*WX.ovc).lerp(_v.set(1.07,.97,.84),.7*WX.dust);
  g.uAsp.value=innerWidth/Math.max(1,innerHeight);
  sandU.uNight.value=nk;rockU.uNight.value=nk;sandU.uRip.value=1+nk*.9;
}
const _sp=new V3();
function sunScreen(){
  const a=sunAzW()+blendL("az")*D2R,e=mix(SKY_HOR+.035,46*D2R,LK.day);skyU.uSunDir.value.set(Math.cos(e)*Math.sin(a),Math.sin(e),Math.cos(e)*Math.cos(a));
  _sp.copy(skyU.uSunDir.value).multiplyScalar(100).add(De.position).project(De);
  const inF=_sp.z<1&&Math.abs(_sp.x)<1.4&&Math.abs(_sp.y)<1.4;
  gradeM.uniforms.uSun.value.set(_sp.x*.5+.5,_sp.y*.5+.5);gradeM.uniforms.uSunOn.value=inF?(1-ss(1,1.4,Math.max(Math.abs(_sp.x),Math.abs(_sp.y))))*(1-LK.night):0}

function update(dt){
  if(!root.visible)return;
  if(st.lock){applyLighting(0);sunScreen();return}
  step(Math.min(dt,.05))}
function step(dt){
  dt*=st.ts;st.t+=dt;
  st.wn=Ue.uWind?Ue.uWind.value:(Ct.wind||.35);
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
  WS.d+=(wn-WS.d)*Math.min(1,dt*(wn>WS.d?.5:.035));WS.ph+=dt*(.012+.05*WS.d);
  WS.a=DUNE.yaw+(.1+.4*ss(.4,1.1,WS.d))*(.62*Math.sin(WS.ph*1.3)+.38*Math.sin(WS.ph*2.9+1.1));
  WIND.x=Math.cos(WS.a);WIND.z=-Math.sin(WS.a);sandU.uWD.value.set(WIND.x,WIND.z);smokeU.uWind.value.set(WIND.x,0,WIND.z);rainU.uWD.value.set(WIND.x,WIND.z);
  GUST.t+=dt;sandU.uGT.value=GUST.t;
  const wd=WS.d,gD=gustAt(DUNE0.x,DUNE0.z),wk=.5+wd*1.4;
  duneEvolve(dt*(.35+.9*gD)*wk*(1-.9*WX.wet)*(1+2.5*WX.dust));CURK=(1-.9*WX.wet)*(1+1.4*WX.dust);
  sandU.uDA.value.set(DP.x,DP.z,DP.H,DP.w);sandU.uDB.value.set(DP.Lw,DP.Ll,DP.cv,DP.sk);
  sandU.uFlowT.value+=dt*(2.4+2.2*gD)*wk;sandU.uRipPh.value+=dt*.1*(.3+gD)*wk;sandU.uFlowK.value=cl(.3+wd*1.4,0,1.3)*(1-.85*WX.wet)*(1+1.3*WX.dust);
  sandU.uWetK.value=WX.wet;sandU.uHeat.value=WX.heat;sandU.uTm.value=t;if(jt){sandU.uMirC.value.copy(jt.bot.value).lerp(jt.top.value,.25);sandU.uMirB.value.copy(jt.bot.value).lerp(jt.top.value,.7)}rockU.uWetK.value=WX.wet;tentU.uWetC.value=WX.wet;
  pondU.uRainP.value=WX.rain;if(Jt.fog){pondU.uFogC.value.copy(Jt.fog.color);pondU.uFogNF.value.set(Jt.fog.near,Jt.fog.far)}
  if(pi){sandU.uLd.value.copy(pi.position).normalize();
    _c1.copy(pi.color).multiplyScalar(pi.intensity);_c2.copy(dc?(dc.groundColor||dc.color):_c1).multiplyScalar(dc?dc.intensity:0);
    curU.uCol.value.set("#f0d2a0").multiply(_c1.clone().multiplyScalar(.5).add(_c2.clone().multiplyScalar(.5)).add(dc?dc.color.clone().multiplyScalar(dc.intensity):_c2));
    curU.uSheen.value.set("#ffb45c").multiply(_c1).multiplyScalar(.55)}
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
  if(fireL)fireL.intensity=(mix(.5,5.2,nk))*(1+.12*Math.sin(t*9)+.07*Math.sin(t*23))*(1-.55*WX.rain);
  /* rain drowns the flames to a sputter over glowing embers */
  if(fireG.userData.flames){const fr=1-.8*ss(.08,.55,WX.rain);fireG.userData.flames.forEach(o=>o.f.scale.set(o.s.x*(.5+.5*fr),o.s.y*fr,1))}
  if(fireG.userData.charM)fireG.userData.charM.emissiveIntensity=mix(.25,.9,nk)*(1+.2*Math.sin(t*5));
  if(RACK.cloths){const gR=gustAt(RACK.x,RACK.z);RACK.cloths.forEach((c,i)=>{c.rotation.x=(Math.sin(t*1.6+c.userData.ph)*.06*(.6+.8*gR)+.05*(.4+1.2*gR))*(.4+wn)})}
  /* sand wisps: grains hop and drift with the local gust */
  for(let i=0;i<SAND.n;i++){const q=SANDP[i];q.life+=dt/q.dur;
    if(q.life>=1){sandSeed(i,false);continue}
    const gq=gustAt(q.x,q.z),sp=(.5+wd)*(.35+1.3*gq)*(1+1.2*WX.dust);
    q.x+=q.vx*dt*sp;q.z+=q.vz*dt*sp;q.y+=q.vy*dt*(.5+gq);const g=hTop(q.x,q.z);if(q.y<g+.03)q.y=g+.03;
    q.vy+=(q.crest?-.08:-.02)*dt;
    const o=i*3;SAND.P[o]=q.x;SAND.P[o+1]=q.y;SAND.P[o+2]=q.z;
    SAND.A[i]=Math.sin(q.life*Math.PI)*(q.crest?.3:.16)*(.3+wd*1.4)*(.25+gq)*(1-ss(.86,.97,sN(q.x,q.z)))*(1-.92*WX.wet)*(1+1.5*WX.dust)}
  SAND.g.attributes.position.needsUpdate=SAND.g.attributes.a.needsUpdate=true;SAND.m.uniforms.uH.value=innerHeight;
  SAND.m.uniforms.uC.value.copy(curU.uCol.value).multiplyScalar(1.15);
  sandFallsUpdate(dt,t,wd,nk);
  /* fireflies */
  FF.o.visible=nk>.3&&WX.rain<.3&&WX.dust<.3;
  if(FF.o.visible){for(let i=0;i<FF.n;i++){const f=FFP[i],o=i*3;f.ph+=dt*f.sp;
    FF.P[o]=f.x+Math.sin(f.ph*1.3)*1.2;FF.P[o+1]=hTop(f.x,f.z)+f.y+Math.sin(f.ph*2.1)*.35;FF.P[o+2]=f.z+Math.cos(f.ph)*1.2;
    FF.A[i]=ss(.3,.8,nk)*(1-WX.rain*3)*(1-WX.dust*3)*Math.pow(Math.max(0,Math.sin(t*f.bl+f.ph*3)),3)*.9}
    FF.g.attributes.position.needsUpdate=FF.g.attributes.a.needsUpdate=true;FF.m.uniforms.uH.value=innerHeight}
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
const rainU={uT:{value:0},uRain:{value:0},uWS:{value:1},uWD:{value:new T.V2(WIND.x,WIND.z)},uCamL:{value:new V3()},uCol:{value:new C3()},uHT:{value:HMAP.t},uHM:{value:HMAP.v},uLen:{value:1.1}};
const GLSL_CELL=`float hc(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float nc(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hc(i),hc(i+vec2(1,0)),f.x),mix(hc(i+vec2(0,1)),hc(i+vec2(1,1)),f.x),f.y);}
  float cellK(vec2 p){float n=nc(p*.03-uWD*uT*.11)*.65+nc(p*.08+uWD*uT*.05+3.)*.35;return smoothstep(.0,.3,n+uRain*1.05-.62);}`;
const RAIN=(()=>{const n=MOB?1300:2800,R=new Float32Array(n*8),E=new Float32Array(n*2),P=new Float32Array(n*6);
  for(let i=0;i<n;i++){const x=rr(-30,30),z=rr(-26,26),ph=rnd(),sj=rnd();for(let e=0;e<2;e++){const o=(i*2+e)*4;R[o]=x;R[o+1]=z;R[o+2]=ph;R[o+3]=sj;E[i*2+e]=e}}
  const g=new T.BG();g.setAttribute("position",new T.BA(P,3));g.setAttribute("aR",new T.BA(R,4));g.setAttribute("aE",new T.BA(E,1));
  const m=new T.SM({uniforms:rainU,transparent:true,depthWrite:false,
    vertexShader:`attribute vec4 aR;attribute float aE;uniform float uT,uRain,uWS,uLen;uniform vec2 uWD;uniform vec3 uCamL;varying float vA;${GLSL_HM}${GLSL_CELL}
      void main(){float sp=6.5+3.*aR.w;const float TOP=26.,HC=66.;
        float y=TOP-mod(uT*sp+aR.z*HC,HC),fall=(TOP-y)/sp;
        vec2 p=aR.xy+uWD*uWS*(fall-1.5);float g=gH(p);
        vec3 dir=normalize(vec3(uWD.x*uWS,-sp,uWD.y*uWS));
        vec3 P=vec3(p.x,max(y,g),p.y)-dir*uLen*aE*step(g,y);
        float d=length(P-uCamL);
        vA=step(g,y)*cellK(p)*step(aR.w*.9,uRain*1.6)*(1.-aE*.85)*(.35+.65*smoothstep(260.,25.,d))*smoothstep(-36.,-20.,y);
        gl_Position=projectionMatrix*modelViewMatrix*vec4(P,1.);}`,
    fragmentShader:`uniform vec3 uCol;varying float vA;void main(){if(vA<.004)discard;gl_FragColor=vec4(uCol,vA*.5);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`});
  const o=new T.LS(g,m);o.frustumCulled=false;o.renderOrder=8;o.visible=false;W.add(o);return o})();
/* splashes: each fires about once a second where the shower is falling; on the pond they are left to the water's rings */
const SPL=(()=>{const n=MOB?600:1400,S0=new Float32Array(n*4),P=new Float32Array(n*3);let k=0;
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
    rainU.uCol.value.copy(_c1).multiplyScalar(1+WX.flash*1.5);SPL.m.uniforms.uH.value=innerHeight}
  const dz=WX.dust;DUST.o.visible=dz>.01;
  if(DUST.o.visible){const sp=(4+10*dz)*(.6+st.wn);DUST.m.uniforms.uT.value=t;DUST.m.uniforms.uH.value=innerHeight;
    DUST.m.uniforms.uC.value.copy(skyU.uDustC.value).multiplyScalar(1.05);
    for(let i=0;i<DUST.n;i++){const q=DUST.Q[i];q.life+=dt/q.dur;q.x+=WIND.x*sp*dt*q.s;q.z+=WIND.z*sp*dt*q.s;
      const gx=hTop(q.x,q.z),inI=sN(q.x,q.z)<1;if(q.life>=1||Math.abs(q.x)>45||Math.abs(q.z)>40){dustSeed(q);continue}
      const o=i*3;DUST.P[o]=q.x;DUST.P[o+1]=(inI?gx:-1)+q.y+Math.sin(t*.7+i)*.4;DUST.P[o+2]=q.z;
      DUST.A[i]=Math.sin(q.life*Math.PI)*ss(.05,.6,dz)*.42}
    DUST.g.attributes.position.needsUpdate=DUST.g.attributes.a.needsUpdate=true}
});
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
    sh.uniforms.uNight=sandU.uNight;
    sh.vertexShader=sh.vertexShader.replace("#include <common>","#include <common>\nvarying vec3 vBP;varying vec3 vBN;")
      .replace("#include <begin_vertex>","#include <begin_vertex>\nvBP=position;vBN=normal;");
    sh.fragmentShader=sh.fragmentShader.replace("#include <common>","#include <common>\nuniform float uNight;varying vec3 vBP;varying vec3 vBN;"+GLSL_NOISE+`
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
      col=mix(col,vec3(dot(col,vec3(.3,.59,.11)))*vec3(.82,.9,1.),uNight*.6)*mix(1.,.62,uNight);
      diffuseColor.rgb=col;`)
    .replace("#include <opaque_fragment>",`{float fr=pow(1.-clamp(dot(normal,normalize(vViewPosition)),0.,1.),2.4);
      outgoingLight+=fr*.45*vec3(1.,.8,.55)*(reflectedLight.directDiffuse+reflectedLight.indirectDiffuse);}
      #include <opaque_fragment>`)};m.customProgramCacheKey=()=>"des48coat";m.needsUpdate=true}});o.traverse(c=>{if(c.isMesh){c.castShadow=true;c.receiveShadow=true;c.frustumCulled=false}})}
function groundFrame(x,z,yaw,L,Wd){
  const fx=Math.sin(yaw),fz=Math.cos(yaw),hf=hTop(x+fx*L,z+fz*L),hb=hTop(x-fx*L,z-fz*L),hc=hTop(x,z);
  const hl=hTop(x+fz*Wd,z-fx*Wd),hr=hTop(x-fz*Wd,z+fx*Wd);
  return{y:Math.max((hf+hb)*.5,hc-.12),pitch:-Math.atan2(hf-hb,2*L),roll:cl(Math.atan2(hl-hr,2*Wd),-.2,.2)}}

/* ---- footprints: one instanced decal per print, drawn over the sand as a 2x multiply (0.5 = no change). Each kind is a
   height field in centimetres that the shader lights from the key light, so a print reads as pressed into the sand with a lit
   and a shaded wall and a dark floor. Prints are laid where a foot actually comes to rest, and wind, blowing sand and rain
   wear them away (slowly in still air, within seconds in a dust storm). instanceColor carries (kind + variant/4, wear clock
   at birth, depth). ---- */
const PRK={drom:0,bact:1,talon:2,wing:3,lie:4};
const PR_SZ=[.28,.32,.2,.9,2.1];
const PR=(()=>{const N=MOB?700:1400,geo=new T.Plane(1,1).rotateX(-Math.PI/2);
  const m=new T.SM({transparent:true,depthWrite:false,side:2,blending:5,blendSrc:208,blendDst:202,blendSrcAlpha:200,blendDstAlpha:201,
    polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4,uniforms:{uE:{value:0},uKs:{value:.7},uLd:sandU.uLd,uWD:sandU.uWD},
    vertexShader:`uniform vec2 uWD;varying vec2 vQ,vWl;varying vec3 vK,vAx,vAz;varying float vS,vL,vSd,vG;
      void main(){vK=instanceColor;vWl=vec2(dot(vec3(uWD.x,0.,uWD.y),normalize(instanceMatrix[0].xyz)),dot(vec3(uWD.x,0.,uWD.y),normalize(instanceMatrix[2].xyz)));mat4 M=modelMatrix*instanceMatrix;vAx=normalize((M*vec4(1.,0.,0.,0.)).xyz);vAz=normalize((M*vec4(0.,0.,1.,0.)).xyz);
        vS=length(instanceMatrix[0].xyz);vL=length(instanceMatrix[2].xyz);vSd=fract(sin(dot(instanceMatrix[3].xz,vec2(12.9898,78.233)))*43758.5453);
        /* seen from afar a track is the trampled strip, not single prints: the quad grows to carry a soft dent wider than the foot */
        vec3 c=(M*vec4(0.,0.,0.,1.)).xyz;vG=vK.x<2.5?clamp(length(cameraPosition-c)/(26.*vS),1.,2.):1.;vQ=position.xz*vG;
        gl_Position=projectionMatrix*viewMatrix*M*vec4(position*vG,1.);}`,
    fragmentShader:`uniform float uE,uKs;uniform vec3 uLd;varying vec2 vQ,vWl;varying vec3 vK,vAx,vAz;varying float vS,vL,vSd,vG;
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
      float hgt(vec2 p,float k,float v){if(k<1.5)return camel(p,v,k);if(k<2.5)return talon(p);if(k<3.5)return wing(p);return lie(p,v);}
      /* wear (w 0 fresh .. 1 gone): the heaped rims blow away first and the walls slump, while drifting sand fills the print
         from its upwind edge in a ragged front that creeps downwind */
      float hW(vec2 p,float k,float v,float w){float h=hgt(p,k,v);h*=h>0.?(1.-w)*(1.-w):1.-.35*w;
        vec2 q=p/(50.*vec2(vS,vL));float up=dot(q,vWl)*.5+.5+(dn2(p*.22+vSd*5.)-.5)*.5+(dn2(p*.9+vSd*2.)-.5)*.15;
        return h*(1.-smoothstep(-.12,.12,w*1.5-up));}
      void main(){float k=floor(vK.x+.001),v=fract(vK.x)*4.;vec2 p=vec2(vQ.x*vS,vQ.y*vL)*100.;
        float a=clamp(vK.z*exp(-max(uE-vK.y,0.)),0.,1.);if(a<.01)discard;float w=1.-min(1.,a*1.15);
        float e=.1,h0=hW(p,k,v,w),hx=hW(p+vec2(e,0.),k,v,w),hz=hW(p+vec2(0.,e),k,v,w);a=smoothstep(0.,.25,a);
        vec3 n=normalize(vec3(-(hx-h0)/e*a,1.,-(hz-h0)/e*a)),L=normalize(vec3(dot(uLd,vAx),max(uLd.y,.03),dot(uLd,vAz)));
        /* the floor of a print sits in its own shadow, so a track still reads as a line of dark dents from far off */
        float df=max(dot(n,L),0.)/max(L.y,.18),ao=1.-(k>3.5?.08:.45)*clamp(-h0*a/(k>3.5?4.:1.2),0.,1.);
        float F=clamp(mix(1.,df,uKs)*ao,.12,1.7);
        /* a print only a few pixels across: its lit rim and shaded floor would average out to nothing, so it settles to a soft dent */
        float lod=smoothstep(1.2,3.5,max(fwidth(p.x),fwidth(p.y)))*step(k,2.5),R=k<1.5?9.*vG:6.*vG;
        F=mix(F,1.-.42*(k<2.5?exp(-dot(p,p)/(R*R)):clamp(-h0*1.4,0.,1.)),lod);
        F=mix(1.,F,a*smoothstep(.5,.42,max(abs(vQ.x),abs(vQ.y))/vG));
        if(abs(F-1.)<.004)discard;gl_FragColor=vec4(vec3(.5*F),1.);}`});
  const im=new T.IM(geo,m,N);im.count=0;im.frustumCulled=false;im.renderOrder=1;im.castShadow=im.receiveShadow=false;
  const c=new C3(0,0,0);for(let i=0;i<N;i++)im.setColorAt(i,c);W.add(im);onDes(im);
  return{N,im,i:0,n:0,E:0,dirty:0,up:0,m4:new T.M4(),q:new T.Quat(),q2:new T.Quat(),v:new V3(),s:new V3(),c}})();
const _up=new V3(0,1,0);
/* kind, island-metre position, heading of the print's forward (+z), variant 0-3, depth (1 = typical), mirrored, scale */
function prAdd(k,x,z,yaw,v,dep,mir,sc){if(pN(x,z)<1.02)return;const P=PR,i=P.i;P.i=(i+1)%P.N;P.n=Math.min(P.n+1,P.N);
  P.q2.setFromUnitVectors(_up,nTop(x,z));P.q.setFromAxisAngle(_up,yaw).premultiply(P.q2);
  const s=PR_SZ[k]*(sc||1);P.s.set(mir?-s:s,1,s);P.v.set(x,hTop(x,z)+.003,z);P.m4.compose(P.v,P.q,P.s);P.im.setMatrixAt(i,P.m4);
  P.im.setColorAt(i,P.c.setRGB(k+(v||0)/4,P.E,dep==null?1:dep));P.dirty=1;P.im.count=P.n}
function prTick(dt){const P=PR;P.E+=dt*(1/240+st.wn*.3/35+WX.dust/6+WX.rain/9);P.im.material.uniforms.uE.value=P.E;
  if(pi&&dc)P.im.material.uniforms.uKs.value=cl(pi.intensity/(pi.intensity+dc.intensity*1.4+1e-3),.12,.85);
  P.up+=dt;if(P.dirty&&P.up>.15){P.up=0;P.dirty=0;P.im.instanceMatrix.needsUpdate=true;P.im.instanceColor.needsUpdate=true}}
/* a foot comes to rest: after a swing (moving faster than the body) it slows almost to a stop at the ground */
const _pf=new V3();
function footPlant(f,b,spd,dt,lift){b.getWorldPosition(_pf);W.worldToLocal(_pf);let hit=null;
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
function camelSpawn(sc,anims,i,kind){smoothRoot(anims);
 const g=new T.Group(),inner=new T.Group();g.rotation.order="YXZ";const s=kind.sc;
  sc.position.y=0;inner.add(sc);inner.scale.setScalar(s);g.add(inner);animalMats(g,kind.coat);W.add(g);onDes(g);
  const a={i,kind,sc:s,gait:kind.gait,v:.989*s*kind.gait,voice:kind.voice[i]||1,g,inner,mdl:sc,r:rigUp(sc,anims),bones:{},x:0,z:0,yaw:0,yr:0,spd:0,gy:null,gp:0,gr:0,k:0,mode:"job",job:"idle",timer:rr(2,5),path:null,pi:0,face:null,stuck:0};
  sc.traverse(o=>{if(o.isBone)a.bones[o.name]=o});
  for(const k of["kneel_down","stand_up"]){const c=a.r.acts[k];if(c){c.setLoop(VT.THREE.LoopOnce,1);c.clampWhenFinished=true}}
  /* the four feet: the tip below each leg's last joint, fore or hind by where it stands in the bind pose */
  a.feet=[];for(const n in a.bones){const m=n.match(/([01])_(Left|Right)_Limb_3$/);if(!m)continue;const b=a.bones[n];a.feet.push({b:b.children.find(c=>c.isBone)||b,R:m[2]==="Right",p:null,sw:0,hind:0})}
  if(a.feet.length===4){g.updateMatrixWorld(true);const z=a.feet.map(f=>g.worldToLocal(f.b.getWorldPosition(new V3())).z),mid=[...z].sort((x,y)=>x-y).slice(1,3).reduce((x,y)=>x+y)/2;a.feet.forEach((f,i)=>{f.hind=z[i]<mid?1:0})}
  return a}
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
  const busy=j=>ANIM.camels.some(o=>o!==a&&o.job===j),near=(p,r)=>ANIM.camels.some(o=>o!==a&&(Math.hypot(o.x-p.x,o.z-p.z)<r||(o.goal&&Math.hypot(o.goal.x-p.x,o.goal.z-p.z)<r)));
  const opts=[["drink",.3],["graze",.32],["kneel",.2],["idle",.18]].filter(([j])=>j==="idle"||!busy(j)&&(j!=="drink"||!near(DRINK,4.5)));
  let r=rnd()*opts.reduce((s,o)=>s+o[1],0),job="idle";for(const[j,w]of opts){if((r-=w)<0){job=j;break}}
  if(job==="drink")camelGo(a,DRINK,"drink");
  else if(job==="graze")camelGo(a,grazeSpot(a),"graze");
  else if(job==="kneel")camelGo(a,REST[a.i],"kneel");
  else{const g=navGrid("camel",1.05,1.12,.84),p=randFree(g,0,2,20,(x,z)=>sN(x,z)<.72&&roomy(a,x,z));camelGo(a,p||REST[a.i],"idle")}}
/* in a dust storm camels kneel with their backs to the wind; in a downpour they kneel where they rest at night */
function camelShelter(a){const r=REST[a.i];return WX.dust>.3?{x:r.x,z:r.z,yaw:Math.atan2(WIND.x,WIND.z)+(a.i?.25:-.25)}:r}
function camelUpdate(a,dt){
  const night=st.phase==="night",stay=night||WX.shel>0;
  if(stay&&a.job!=="kneel"&&a.mode!=="up"){if(a.mode==="walk"||a.mode==="job"||a.mode==="turn")camelGo(a,camelShelter(a),"kneel")}
  let dy=0,vT=0,ym=.75;
  if(a.mode==="walk"){
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
  rigTick(a.r,dt);camelPrints(a,dt)}

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
  for(const sd of[-1,1]){const lx=fz*sd,lz=-fx*sd,k=off?.95:.85;prAdd(PRK.wing,cx+lx*k-fx*.12,cz+lz*k-fz*.12,Math.atan2(lx,lz)+sd*(off?-.25:.2),0,off?1:.9,sd>0)}}
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
  const ph=st.phase,wantPerch=ph!=="day"||WX.shel>0||WX.rain>.4;puffTick(dt);
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
function snakeShadeSpot(){
  const g=navGrid("snake",.32,1.3,.82);let best=null;
  for(const o of OBST){if(o.k!=="rock"||o.r<.6)continue;const x=o.x+SHADE.x*(o.r+.42),z=o.z+SHADE.z*(o.r+.42);
    if(!navFree(g,x,z))continue;const sc=-Math.hypot(x-SNK_HOME.x,z-SNK_HOME.z)*.12+o.r;if(!best||sc>best.sc)best={x,z,sc,yaw:Math.atan2(SHADE.x,SHADE.z)+2}}
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
  inner.add(proto);inner.scale.setScalar(RS_SC);g.add(inner);animalMats(g);W.add(g);onDes(g);
  /* any transmission > 0 (cornea glass, rattle keratin) makes three re-render the whole scene into a transmission target every frame */
  matsOf(g,m=>{const tr=m.transmission||0;m.transmission=0;
    if(/cornea/i.test(m.name||"")){if(tr>0||!m.transparent){m.transparent=true;m.opacity=.22;m.roughness=.06}m.depthWrite=false}
    else if(/wet/i.test(m.name||"")){if(!m.clearcoat)m.roughness=.3}
    else if(tr>0&&m.emissive){m.emissive.copy(m.color).multiplyScalar(.08*tr/.15);m.roughness=Math.min(m.roughness,.42)}});
  rsTongueMesh(proto);
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
   a random point of its swing and a faint fan shows the blur either side). Its strength follows the loudness of the sound
   being heard: dRtlOn's envelope at 20 per second (a few warning buzzes rising into the full rattle), then the steady loop. ---- */
const RTL_ENV="0003321142452144421343007888778789887978776766657544655565677666888777777887665665554555554543321100";
const RTL_B=[["Spine_42",.9],["Spine_43",1.8],["Spine_44",3],["Rattle",4.5],["Rattle_2",3.2],["Rattle_3",2]];
function rtlLevel(s){if(s.mode!=="def")return 0;const t=s.defT,e=t<5?+RTL_ENV[Math.min(99,t*20|0)]/9:0;return Math.max(e,.85*ss(3,4.5,t))}
/* two strips, one each side of the rattle, from just inside its edge (u 0) out to where the tip travels (u 1) */
const RFAN=(()=>{const N=32,d=new Uint8ClampedArray(N*N*4);
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){const u=(i+.5)/N,v=(j+.5)/N,a=.55*Math.pow(1-u,1.6)*ss(0,.3,u*4)*ss(0,.3,v)*(1-ss(.88,1,v));d.set([0,a*255,0,255],(j*N+i)*4)}
  const am=new T.CTex(new ImageData(d,N,N));am.needsUpdate=true;
  const g=new T.BG();g.setAttribute("position",new T.BA(new Float32Array(24),3));g.setAttribute("normal",new T.BA(new Float32Array(24),3));
  g.setAttribute("uv",new T.BA(new Float32Array([0,0,1,0,0,1,1,1,0,0,1,0,0,1,1,1]),2));g.setIndex([0,1,2,2,1,3,4,5,6,6,5,7]);
  const m=new T.MSM({color:0x97785a,roughness:.6,metalness:0,transparent:true,alphaMap:am,depthWrite:false,side:2});
  const o=new T.Mesh(g,m);o.frustumCulled=false;o.visible=false;o.renderOrder=2;o.castShadow=o.receiveShadow=false;W.add(o);onDes(o);return o})();
const _ra=new V3(),_rb=new V3(),_rc=new V3(),_rs=new V3(),_rn=new V3(),_rQ=new T.Quat(),_rZ=new V3(0,0,1);
function rsRattle(s,dt){const R=s.rt;s.rtK+=(rtlLevel(s)-s.rtK)*ease(s.mode==="def"?30:8,dt);RFAN.visible=false;if(!R||s.rtK<.02)return;
  /* the fan: on the rattle's resting line, from its base out past its last segment, as wide as the tip travels, turned to the
     camera about its axis */
  const r0=R[3][0],r2=R[5][0];s.g.updateMatrixWorld(true);
  r0.getWorldPosition(_ra);r2.getWorldPosition(_rb);W.worldToLocal(_ra);W.worldToLocal(_rb);
  _rc.subVectors(_rb,_ra);_rb.addScaledVector(_rc,.45);_rc.subVectors(_rb,_ra);
  _rn.addVectors(_ra,_rb).multiplyScalar(.5).sub(_cl).multiplyScalar(-1);_rs.crossVectors(_rc,_rn).normalize();
  const ri=.008,wb=.004,wt=.006+.02*s.rtK,P=RFAN.geometry.attributes.position,Nn=RFAN.geometry.attributes.normal;
  for(let sd=-1,o=0;sd<=1;sd+=2,o+=4){const pt=(i,c,w)=>P.setXYZ(o+i,c.x+_rs.x*sd*w,c.y+_rs.y*sd*w,c.z+_rs.z*sd*w);
    pt(0,_ra,ri);pt(1,_ra,ri+wb);pt(2,_rb,ri);pt(3,_rb,ri+wt)}
  /* lit as the average of the rattle's round surface: mostly from above */
  _rn.crossVectors(_rs,_rc).normalize();if(_rn.dot(_cl)<_rn.dot(_ra))_rn.negate();_rn.y+=1.5;_rn.normalize();for(let i=0;i<8;i++)Nn.setXYZ(i,_rn.x,_rn.y,_rn.z);
  P.needsUpdate=Nn.needsUpdate=true;RFAN.material.opacity=ss(.05,.5,s.rtK);RFAN.visible=true;
  s.rtS=-s.rtS;const k=s.rtK*D2R;
  for(const[b,a]of R)b.quaternion.multiply(_rQ.setFromAxisAngle(_rZ,s.rtS*a*k*rr(.45,1)))}
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
  const r=RS_R*(wr||1),s2=2*(.68*r)**2,ro=1.25*r+.004,rw=2*(.4*r+.003)**2,mo=ro+.5*r+.007,mw=2*(.55*r+.005)**2,R=Math.ceil((mo+2.4*Math.sqrt(mw/2))/te);
  const ex=bx-ax,ez=bz-az,L2=ex*ex+ez*ez||1e-9;mk=mk||0;
  let th=Math.atan2(ez,ex),sg=mb>=ma?1:-1;if(th<0){th+=Math.PI;sg=-sg}if(th>=Math.PI){th=0;sg=-sg}
  const cb=sc?(sc===1?1:129)+Math.round(th/Math.PI*126)%127:0;
  for(let j=Math.max(0,Math.floor(Math.min(az,bz))-R);j<=Math.min(N-1,Math.floor(Math.max(az,bz))+R);j++)
    for(let i=Math.max(0,Math.floor(Math.min(ax,bx))-R);i<=Math.min(N-1,Math.floor(Math.max(ax,bx))+R);i++){
      const cx=i+.5,cz=j+.5,uu=((cx-ax)*ex+(cz-az)*ez)/L2,u=cl(uu,0,1),dx=(cx-ax-ex*u)*te,dz=(cz-az-ez*u)*te,d=Math.hypot(dx,dz),sd=d>1e-4?(dx*px+dz*pz)/d:0;
      const gr=dep*Math.exp(-d*d/s2),rim=dep*(.4+.6*sd)*Math.exp(-(d-ro)*(d-ro)/rw),mnd=dep*mk*Math.max(sd,0)**1.5*1.6*Math.exp(-(d-mo)*(d-mo)/mw);
      const o=(j*N+i)*4,va=gr*255|0,vb=Math.max(rim,mnd)*230|0;
      if(va>K.d[o]){K.d[o]=va;K.d[o+2]=cb;if(cb){const ph=sg*(ma+uu*(mb-ma))/RS_SCL;K.d[o+3]=(ph-Math.floor(ph))*256|0}}if(vb>K.d[o+1])K.d[o+1]=vb}
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
  for(const a of ANIM.camels){const d=Math.hypot(a.x-hx,a.z-hz);if(a.mode!=="rest"&&(d<1.6||a.spd>.1&&d<2.6))return{x:a.x,z:a.z}}
  const e=ANIM.eagle;if(e&&e.mode!=="perch"&&e.pos&&Math.hypot(e.pos.x-hx,e.pos.z-hz)<4&&e.pos.y-hTop(hx,hz)<3.5)return{x:e.pos.x,z:e.pos.z};
  return null}
function rsCoilAt(s,clip,fade){const P=s.bd.P,ya=Math.atan2(P[0]-P[6],P[1]-P[7]);
  s.yaw=ya;s.x=P[8]-Math.sin(ya)*.1;s.z=P[9]-Math.cos(ya)*.1;s.gy=hTop(s.x,s.z);s.g.position.set(s.x,s.gy,s.z);s.g.rotation.set(0,ya,0);
  play(s.r,clip,.01,1);s.wT=0;s.wF=fade}
function rsUpdate(s,dt){
  if(!s.bd){s.timer-=dt;if(s.timer<0){if(s.mode==="relax"){s.mode="alert";s.timer=rr(7,11);play(s.r,"tongue_flick",.8,1)}else{s.mode="relax";s.timer=rr(9,15);play(s.r,"relaxed_coil",.9,1)}}
    rigTick(s.r,dt);rsTongue(s,dt);return}
  const b=s.bd,day=(st.phase==="day"||WX.shel>0||WX.rain>.3)&&!s.force;s.hunt=!day&&(st.phase==="sunrise"||st.phase==="sunset")&&!s.force;
  s.caut=Math.max(0,s.caut-dt);
  /* startle */
  const th=rsThreat(s);
  if(th&&s.mode!=="def"){if(s.mode==="crawl"||s.mode==="rest")rsCoilAt(s,"defensive_coil",.55);else{play(s.r,"defensive_coil",.4,1)}
    s.mode="def";s.defT=0;s.calm=0;s.th=th;capE(["R","on"]);shotS("dRtlOn",.8,_snP.set(b.P[0],hTop(b.P[0],b.P[1])+.2,b.P[1]),4)}
  if(s.mode==="def"){s.defT+=dt;if(th){s.th=th;s.calm=0}else s.calm+=dt;
    if(s.calm>2.5&&s.defT>5){s.mode="uncoil";s.caut=rr(12,20);const P=b.P,dx=P[0]-s.th.x,dz=P[1]-s.th.z,l=Math.hypot(dx,dz)||1;const hs=s.hunt&&rsHuntSpot(s,s.th);if(hs)hs.hunt=1;s.next=hs||{x:P[0]+dx/l*3.5,z:P[1]+dz/l*3.5}}}
  /* coiled: the clip pose, tongue now and then; leave at dusk or to reach shade */
  if(s.mode==="coil"){s.timer-=dt;
    if(s.timer<0){if(s.r.cur==="relaxed_coil"){play(s.r,"tongue_flick",.8,1);s.timer=rr(6,9)}else{play(s.r,"relaxed_coil",.9,1);s.timer=rr(9,15)}}
    s.idle-=dt;if(s.idle<0&&(!day||!s.inShade)){s.mode="uncoil";s.next=null}}
  if(s.mode==="uncoil"){rigTick(s.r,dt);rsFromClip(s);trInit(s);for(let i=0;i<RS_N*2;i++)b.Ls[i]=b.P[i];
    s.mode="rest";s.restT=.3;s.gait="serp";s.a=0;s.rk=s.caut>0?1:0;s.wT=0;s.wF=-.4;s.dtgt=null}
  /* travel */
  if(s.mode==="rest"){s.restT-=dt;if(s.restT<0){let to=s.next;s.next=null;
      s.hg=s.hunt?(rnd()<.6?"side":"serp"):null;
      if(!to){if(day){const sp=snakeShadeSpot();to={x:sp.x,z:sp.z,shade:1}}else if(s.hunt&&(to=rsHuntSpot(s))){to.hunt=1}else{const g=navGrid("snake",.32,1.3,.82);to=randFree(g,SNK_HOME.x,SNK_HOME.z,9,(x,z)=>Math.hypot(x-b.P[0],z-b.P[1])>2.5)}}
      if(to&&rsGoTo(s,to)){s.mode="crawl";s.a=0;const want=s.lock||rsGaitAt(s,b.P[0],b.P[1]);
        if(want==="side"){s.gait="side";swInit(s,s.path[1])}else{s.gait=want;s.rk=want==="rect"?1:0}}else s.restT=1}}
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
        if(s.goal.shade&&day){s.inShade=1;s.mode="coiling";rsCoilAt(s,"relaxed_coil",1.8);s.timer=rr(9,15);s.idle=rr(30,60)}}
      else{if(want==="side"){s.gait="side";swInit(s,s.path[s.pi])}else{s.gait=want;trInit(s);s.rk=want==="rect"?1:0}s.gwT=0}}}
  if(s.mode==="rest"&&s.gait==="side"&&s.a<.01){trInit(s);s.gait="serp"}
  if(day&&s.mode==="rest"&&!s.inShade&&!s.next)s.restT=Math.min(s.restT,.2);
  if(!day)s.inShade=0;
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
const AQ={dWnd:"@a:dWnd",dCalm:"@a:dCalm",dSnd:"@a:dSnd",dFire:"@a:dFire",dSnk:"@a:dSnk",dEg1:"@a:dEg1",dEg2:"@a:dEg2",dEg3:"@a:dEg3",dEg4:"@a:dEg4",dEg5:"@a:dEg5",
  dCm1:"@a:dCm1",dCm2:"@a:dCm2",dCm3:"@a:dCm3",dCm4:"@a:dCm4",dCm5:"@a:dCm5",
  dOk1:"@a:dOk1",dOk2:"@a:dOk2",dOk3:"@a:dOk3",dOk4:"@a:dOk4",dOc1:"@a:dOc1",dOc2:"@a:dOc2",dOc3:"@a:dOc3",
  dFr1:"@a:dFr1",dFr2:"@a:dFr2",dFr3:"@a:dFr3",dFr4:"@a:dFr4",dFr5:"@a:dFr5",dFr6:"@a:dFr6",
  dDf1:"@a:dDf1",dDf2:"@a:dDf2",dDf3:"@a:dDf3",dGh1:"@a:dGh1",dGh2:"@a:dGh2",
  dRtl:"@a:dRtl",dRtlOn:"@a:dRtlOn",dRn:"@a:dRn",dRt:"@a:dRt",dStm:"@a:dStm",dStS:"@a:dStS",dTh1:"@a:dTh1",dTh2:"@a:dTh2",dTh3:"@a:dTh3",dTh4:"@a:dTh4",dTh5:"@a:dTh5"};
const LL={dWnd:22,dCalm:36,dSnd:20,dFire:19,dSnk:8,dRtl:12,dRn:22,dRt:22,dStm:30,dStS:30};
/* weather sounds load only when that weather comes */
const WXA=new Set(["dRn","dRt","dStm","dStS","dTh1","dTh2","dTh3","dTh4","dTh5","dRtl","dRtlOn"]);
const AU={b:{},pd:{},lp:{},bus:null,ob:null,pre:0,egT:rr(5,10),cmT:[rr(14,30),rr(30,60)],cmL:-99,q:[],cap:null};
function SX(){return window.__sndX||null}
function aOK(){const x=SX();return!!(x&&x.on&&x.s&&x.s.state==="running"&&root.visible)}
function amb(){const x=SX();return AU.cap?true:!!(x&&x.amb)}
function dec(k){if(AU.b[k]||AU.pd[k])return;const x=SX();if(!x||!x.s||!x.ld)return;AU.pd[k]=1;
  x.ld(AQ[k]).then(B=>{const P=x.s.decodeAudioData(B,b=>{AU.b[k]=b},()=>{});P&&P.catch&&P.catch(()=>{})}).catch(()=>{setTimeout(()=>{AU.pd[k]=0},8e3)})}
function aBus(){if(AU.bus)return true;const x=SX();try{const b=x.s.createGain();b.gain.value=0;b.connect(x.r);AU.bus=b;
  const o=x.s.createGain();o.gain.value=0;o.connect(b);AU.ob=o;return true}catch(e){return false}}
/* p in island metres; ref = distance (m) at which the source plays at its nominal level */
const _cr=new V3();
function spat(p,ref){const dx=p.x-_cl.x,dy=p.y-_cl.y,dz=p.z-_cl.z,d=Math.hypot(dx,dy,dz)||1;
  const m=De.matrixWorld.elements;_cr.set(m[0],m[1],m[2]).applyAxisAngle(_yAx,-YAW);
  return[cl((dx*_cr.x+dy*_cr.y+dz*_cr.z)/d,-1,1)*.8,cl(Math.pow(ref/Math.max(d,ref*.4),.9),.05,1.6),cl(19000*Math.exp(-d/55),1500,19000)]}
const _yAx=new V3(0,1,0);
function capE(e){if(AU.cap){AU.cap.ev.push([+(st.t-AU.cap.t0).toFixed(3)].concat(e));if(AU.cap.ev.length>4e5)AU.cap.ev.length=0}}
function voice(c,out,pan,lpf){const g=c.createGain(),f=c.createBiquadFilter(),pn=c.createStereoPanner?c.createStereoPanner():null;f.type="lowpass";f.Q.value=.5;f.frequency.value=lpf;
  g.connect(f);if(pn){pn.pan.value=pan;f.connect(pn);pn.connect(out)}else f.connect(out);return{g,f,pn}}
function loopS(id,k,v,p,ref,rate){let pan=0,lpf=19000;if(p){const q=spat(p,ref);pan=q[0];v*=q[1];lpf=q[2]}rate=rate||1;
  capE(["L",id,k,+v.toFixed(4),+pan.toFixed(3),Math.round(lpf),+rate.toFixed(3)]);
  if(!aOK()||!aBus())return;const c=SX().s;let L=AU.lp[id];
  if(!L){if(v<=.001)return;dec(k);const b=AU.b[k];if(!b)return;try{const s=c.createBufferSource();s.buffer=b;s.loop=true;s.loopStart=.5;s.loopEnd=.5+LL[k];
    L=voice(c,AU.bus,pan,lpf);L.g.gain.value=0;L.s=s;s.connect(L.g);s.start(0,.5+rnd()*LL[k]);AU.lp[id]=L}catch(e){return}}
  const now=c.currentTime;L.g.gain.setTargetAtTime(v,now,.35);L.f.frequency.setTargetAtTime(lpf,now,.3);L.pn&&L.pn.pan.setTargetAtTime(pan,now,.2);L.s.playbackRate.setTargetAtTime(rate,now,.3)}
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
const _rtP=new V3(),_snP=new V3(),_fiP=new V3(),_dvP=new V3(),_oP=new V3(),_tnP=new V3(),_thP=new V3();
/* thunder follows the flash by the sound's travel time; near strikes crack, far ones roll; heard from the bolt's side */
function thunder(far){const k=far<.55?pick(["dTh1","dTh2","dTh3"]):pick(["dTh4","dTh5"]),ya=WX.boltA-YAW;
  capE(["T",+far.toFixed(3)]);later(.4+far*5,()=>shotS(k,mix(1,.5,far),_thP.set(_cl.x+Math.sin(ya)*60,_cl.y+20,_cl.z+Math.cos(ya)*60),60,rr(.92,1.04)))}
/* oasis insects, only around the water: field and desert crickets in the shore grass and water frogs at the edge sing
   at night (a cricket only now and then by day); by day an odd dragonfly pass over the water or a grasshopper's wing
   snaps. Crickets sing in bouts with rests. Everything pauses while the wind is up and starts again in the lulls, and
   the group fades out as the camera leaves the oasis for the dunes. */
const OAS=(()=>{const E=[],add=(ty,th,k,a,b)=>{const[x,z]=pondEdge(th,k);E.push({ty,x,z,a,b,t:rr(0,b),r:rr(.95,1.05),on:rnd()<.7,bt:rr(15,50)})};
  add("fc",.45,1.35,2,9);add("fc",2.7,1.3,3,12);add("dk",-1.15,1.45,3,6.5);add("dk",3.9,1.42,3.4,7);
  add("fr",1.35,1.0,12,32);add("fr",-2.35,1.02,14,38);add("df",0,.6,22,50);add("gh",.95,1.55,16,40);add("gh",-1.9,1.45,18,46);return E})();
/* clip lengths (s), so one singer never overlaps itself */
const OLEN={dOc1:8.35,dOc2:6.94,dOc3:1.72,dOk1:1.08,dOk2:.92,dOk3:1.03,dOk4:1.13,dFr1:.57,dFr2:.66,dFr3:.5,dFr4:1.29,dFr5:1.05,dFr6:.65,dDf1:1.15,dDf2:1.15,dDf3:1.95,dGh1:1.3,dGh2:1.92};
const OSET={fc:[["dOc1","dOc2","dOc3"],.5,5],dk:[["dOk1","dOk2","dOk3","dOk4"],.42,5],fr:[["dFr1","dFr2","dFr3","dFr4","dFr5","dFr6"],.55,7],
  df:[["dDf1","dDf2","dDf3"],.36,3],gh:[["dGh1","dGh2"],.3,4]};
function oasisNear(){const r=Math.hypot((_cl.x-POND.x)/POND.rx,(_cl.z-POND.z)/POND.rz),dh=Math.max(0,r-1.3)*6,dy=Math.max(0,_cl.y-hTop(POND.x,POND.z)-2.5);
  return 1-ss(3,15,Math.hypot(dh,dy*.7))}
function oasis(dt,nk,W){const zone=oasisNear(),hush=1-ss(.22,.6,W),v=zone*hush;
  capE(["B","oas",+v.toFixed(4)]);if(aOK()&&aBus())AU.ob.gain.setTargetAtTime(v,SX().s.currentTime,.6);
  const night=ss(.3,.9,nk),act={fc:.05+.95*night,dk:.04+.96*night,fr:.75*ss(.45,.95,nk)+.6*WX.after*(1-ss(.05,.3,WX.rain)),df:.55*(1-ss(.15,.5,nk)),gh:.5*(1-ss(.15,.5,nk))};
  for(const e of OAS){if(e.ty==="fc"||e.ty==="dk"){e.bt-=dt;if(e.bt<0){e.on=!e.on;e.bt=e.on?rr(25,80):rr(8,30)}}
    e.t-=dt;if(e.t>0)continue;e.t=rr(e.a,e.b);
    if(!amb()||zone<.02||hush<.25||(e.ty==="fc"||e.ty==="dk")&&!e.on||rnd()>act[e.ty])continue;
    const S=OSET[e.ty],k=pick(S[0]);let x=e.x,z=e.z;if(e.ty==="df"){const[px,pz]=pondEdge(rr(-3.1,3.1),rr(.3,.95));x=px;z=pz}
    e.t+=OLEN[k];shotS(k,S[1]*rr(.8,1.05),_oP.set(x,hTop(x,z)+(e.ty==="df"?.8:.15),z),S[2],e.r*rr(.98,1.02),1)}}
function sound(dt){if(!root.visible&&!AU.cap)return;
  /* the ambient loops at once; the calls once the models are in, so on a slow link they don't compete with them */
  if(aOK()){if(!AU.pre){AU.pre=1;Object.keys(LL).filter(k=>!WXA.has(k)).forEach(dec)}
    if(AU.pre===1&&AU.big){AU.pre=2;Object.keys(AQ).filter(k=>!WXA.has(k)).forEach(dec)}}
  if(Ct.weather==="storm"&&aOK())["dTh1","dTh2","dTh3","dTh4","dTh5"].forEach(dec);
  if(ANIM.rs&&aOK())["dRtl","dRtlOn"].forEach(dec);
  if(aOK()&&aBus())AU.bus.gain.setTargetAtTime(1,SX().s.currentTime,.6);
  for(let i=AU.q.length-1;i>=0;i--)if(st.t>=AU.q[i].t){const f=AU.q[i].fn;AU.q.splice(i,1);f()}
  const nk=st.night,wn=st.wn,g=gustAt(_cl.x,_cl.z),calm=1-.5*nk;
  /* beds: a steady low air, wind that swells with the gusts, and the hiss of sand on the move */
  loopS("calm","dCalm",.2+.08*nk);
  loopS("wind","dWnd",(.06+.42*ss(.12,1,wn)*(.45+.75*g))*calm);
  loopS("sand","dSnd",(.02+.26*ss(.2,1,wn))*ss(.3,.85,g)*calm*(1-.85*WX.wet));
  /* weather: rain on the sand everywhere, rain drumming on the tent cloth up close, the roar and hiss of a dust storm */
  loopS("rain","dRn",.6*ss(.01,.7,WX.rain));
  loopS("rtent","dRt",.75*ss(.01,.5,WX.rain),_tnP.set(TENT.x,hTop(TENT.x,TENT.z)+1.6,TENT.z),6);
  loopS("storm","dStm",.62*ss(.04,.7,WX.dust));
  loopS("stsand","dStS",.5*ss(.2,.9,WX.dust)*(.55+.45*g));
  oasis(dt,nk,Math.max(ss(.12,1,wn)*(.45+.75*g),WX.dust*1.3,WX.rain*.9));
  /* placed: dust devil, the night fire, the snake's rustle (speed sets level and grain rate) */
  loopS("devil","dSnd",DV.amp?.55*DV.amp:0,_dvP.set(DV.x,hTop(DV.x,DV.z)+1.5,DV.z),10,1.12);
  loopS("fire","dFire",.5*ss(.35,.85,nk)*(1-.7*ss(.08,.55,WX.rain)),_fiP.set(FIRE.x,hTop(FIRE.x,FIRE.z)+.4,FIRE.z),5);
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
function pfSpawn(src,male,anims){const s=VT.cloneSkinned(src.scene),g=new T.Group();g.rotation.order="YXZ";g.add(s);W.add(g);onDes(g);pfMats(g,male);
  const f={g,r:rigUp(s,anims),male,ter:-1,x:0,y:0,z:0,yaw:rr(-3,3),yr:0,pit:0,v:0,vt:0,mode:"pause",t:rr(0,1.5),hY:rr(.03,.14),tg:null,
    off:{a:rr(0,TAU),d:Math.sqrt(rnd())*.85},disp:rr(6,16),ct:0};
  const sw=f.r.acts.swim;if(sw){sw.play();sw.time=rr(0,.8)}f.r.cur="swim";
  const it=f.r.acts.idle_turn;if(it)it.setLoop(VT.THREE.LoopOnce,1);return f}
function pfStart(f,gx,gz,vt,T){f.gx=gx;f.gz=gz;f.vt=vt;f.t=T;f.mode="dart";
  if(f.r.cur!=="swim")play(f.r,"swim",.12)}
function pfPause(f){const n=st.night>.5;f.mode="pause";f.vt=0;f.tg=null;f.t=n?rr(2,6):rr(.3,1.7);
  if(!n&&f.t>1.2&&rnd()<.4&&f.r.acts.idle_turn)play(f.r,"idle_turn",.3,rr(.8,1.3))}
/* keep a goal over water of the right depth: pull it toward the pond centre when too shallow, out when too deep */
function pfFit(f,x,z){const lo=f.ter>=0?.05:.08,hi=f.ter>=0?.3:.75;
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
function pfLoad(){return Promise.all([glb("pupfish_male_v3"),glb("pupfish_female_v3")]).then(([M,F])=>{
  const ter=PF_TH.map(th=>{const k=pfK(th,.13),[x,z]=pondEdge(th,k);return{th,x,z,f:null}});PF.ter=ter;
  for(let i=0;i<PF_N;i++){const male=i<ter.length||i%2===0,src=male?M:F,f=pfSpawn(src,male,src.animations);
    if(i<ter.length){f.ter=i;ter[i].f=f;f.x=ter[i].x;f.z=ter[i].z}
    else{const[cx,cz]=pondEdge(PF.sch.th,.74);f.x=cx+Math.cos(f.off.a)*f.off.d;f.z=cz+Math.sin(f.off.a)*f.off.d;[f.x,f.z]=pfFit(f,f.x,f.z)}
    f.y=POND.wy-pfDep(f.x,f.z)+f.hY;f.gx=f.x;f.gz=f.z;f.g.position.set(f.x,f.y,f.z);PF.list.push(f)}})}

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
  return Promise.all(big.concat(after.then(pfLoad).catch(()=>{}),after.then(()=>glb(RS_FILE)).then(({scene,animations})=>{const s=rsSpawn(scene,animations);ANIM.rs=s;
    const day=st.phase==="day",sp=day?snakeShadeSpot():randFree(navGrid("snake",.32,1.3,.82),SNK_HOME.x,SNK_HOME.z,3)||SNK_HOME;
    Object.assign(s,{x:sp.x,z:sp.z,yaw:sp.yaw!=null?sp.yaw:-.8,inShade:day?1:0});s.gy=hTop(s.x,s.z);s.g.position.set(s.x,s.gy,s.z);s.g.rotation.set(0,s.yaw,0);
    play(s.r,"relaxed_coil",.01,1)}).catch(()=>{})))});
UPD.push((dt,t)=>{
  {const envI=mix(.3,.08,st.night);for(const m of ANIM_MATS)m.envMapIntensity=m.userData.coat?envI*.7:envI}
  if(dt<=0)return;const d=Math.min(dt,.1);
  ANIM.camels.forEach(a=>camelUpdate(a,d));prTick(d);
  if(ANIM.eagle)eagleUpdate(ANIM.eagle,d);
  if(ANIM.rs)rsUpdate(ANIM.rs,d);
  if(PF.list.length){pfVis();pfUpdate(d)}
  devilUpdate(d,t);
  sound(d);
});

function show(on){
  root.visible=on;De.layers.set(on?3:0);window.__desA=on;grade.enabled=on;
  if(bloom){if(on){if(!_bloomSave)_bloomSave={t:bloom.threshold,s:bloom.strength,r:bloom.radius};bloom.threshold=.9;bloom.strength=.2;bloom.radius=.45}
    else if(_bloomSave){bloom.threshold=_bloomSave.t;bloom.strength=_bloomSave.s;bloom.radius=_bloomSave.r;_bloomSave=null}}
  if(on){if(Ct.mode==="manual"&&!Ct.night)Ct.mode="sunset";if(Ct.mode==="night"){Ct.mode="full";Ct.night=true}
    if(Ct.weather==="hail"||Ct.weather==="snow")Ct.weather="cloud";applyLighting(0)}
  else{const as=appSkyMesh();if(as){as.layers.disable(3);as.position.set(0,0,0)}if(pi&&_shMask!=null){pi.shadow.camera.layers.mask=_shMask;_shMask=null}
    if(Ct.weather==="dust")Ct.weather="sun"}
  if(X.Ui)try{X.Ui()}catch(e){}
  HIDE.forEach(f=>f(on));
}
onDes(root);
window.__desShow=show;window.__desU=update;
/* test hooks only with ?debug=1 */
if(X.dbg)window.__desQA=()=>QA;
const QA={st,W,S,YAW,hTop,toW,FIRE,TENT,PALMS,SAG,POND,LIT,WX,skyU,pN,sN,dZone,strike:f=>strike(f==null?.5:f),
  /* rattlesnake: rs() state; rsGo(x,z,gait) crawl there (gait locked, or null to choose by ground); rsScare(x,z,sec) */
  rs:()=>{const r=ANIM.rs;if(!r||!r.bd)return null;const P=r.bd.P;return{mode:r.mode,gait:r.gait==="side"?"side":r.rk>.5?"rect":"serp",a:r.a,w:r.w,spd:r.spd,
    head:[P[0],P[1]],tail:[P[2*RS_N-2],P[2*RS_N-1]],c:Array.from(r.bd.C),h:Array.from(r.bd.H),P:Array.from(P)}},
  rsGo:(x,z,g)=>{const r=ANIM.rs;if(!r||!r.bd)return false;r.force=1;r.lock=g||null;r.next={x,z};if(r.mode==="coil"||r.mode==="coiling")r.mode="uncoil";
    else if(r.mode==="crawl"){r.next=null;if(!rsGoTo(r,{x,z}))return false}else if(r.mode==="rest")r.restT=0;return true},
  rsScare:(x,z,sec)=>{const r=ANIM.rs;if(r)r.qth={x,z,until:st.t+(sec||3)}},
  rsSet:o=>Object.assign(ANIM.rs,o),
  /* pupfish: pf() positions/modes; PF itself for tests */
  pf:()=>PF.list.map(f=>({x:f.x,y:f.y,z:f.z,yaw:f.yaw,v:f.v,mode:f.mode,male:f.male,ter:f.ter,clip:f.r.cur})),PF,pfDep,
  rsPut:(x,z,yaw)=>{const r=ANIM.rs;if(!r)return;Object.assign(r,{x,z,yaw:yaw||0,gy:hTop(x,z),mode:"coil",w:0,wT:99,wF:1,path:null,next:null});
    r.g.position.set(x,r.gy,z);r.g.rotation.set(0,r.yaw,0);r.g.updateMatrixWorld(true);play(r.r,"relaxed_coil",.01,1)},trk:TRK,RS_N,
  /* age the tracks by `sec` seconds of the current wind (for the fade time-lapse) */
  trkAge:sec=>{const r=ANIM.rs;if(!r||!TRK)return;for(let k=0;k<sec*2;k++){TRK.dc=.5;TRK.any=1;const w=r.w;r.w=0;trkTick(r,0);r.w=w}TRK.tex.needsUpdate=true},
  /* footprints: PR itself, prAdd for stamping, prAge(sec) wears every print by `sec` seconds of the current weather */
  PR,PRK,prAdd,camelLie,prAge:sec=>{const P=PR;P.E+=sec*(1/240+st.wn*.3/35+WX.dust/6+WX.rain/9);P.im.material.uniforms.uE.value=P.E},camelGo,eagleLand:s=>eagleLand(ANIM.eagle,s||eagleSpots()[1]),eagleSpots,
  /* sand falls: count, rate (sfR(v) pins it, null to release), and each fall's rim point, half width and threshold */
  sfU,wind:()=>({a:WS.a,d:WS.d,x:WIND.x,z:WIND.z}),sf:()=>({n:SF.F.length,rate:sfU.uFR.value,F:SF.F.map(f=>({x:f.E.x,z:f.E.z,hw:f.hw,k:f.k,ty:f.ty}))}),sfR:v=>{SF.pin=v},
  freeze(on){st.lock=!!on},
  step(n,dt){for(let i=0;i<(n||1);i++)step(dt||1/30)},
  tod(p){st.tod=p||null;const ph=phaseNow();for(const k in LK)LK[k]=k===ph?1:0;applyLighting(0)},
  /* camera helpers in island metres */
  lookAt(px,py,pz,tx,ty,tz){De.position.copy(toW(px,py,pz));const t=toW(tx,ty,tz);if(Ce){Ce.target.copy(t);Ce.update()}De.lookAt(t)},
  /* fast-forward only the dune clock (and the ripple drift) by `sec` seconds of average wind */
  duneAdv(sec){const wk=.5+st.wn*1.4;duneEvolve(sec*.8*wk);sandU.uRipPh.value+=sec*.08*wk;
    sandU.uDA.value.set(DP.x,DP.z,DP.H,DP.w);sandU.uDB.value.set(DP.Lw,DP.Ll,DP.cv,DP.sk)},
  dune:{DP,DUNE0,DCLK,GUST,crestXZ,dMask,gustAt},
  /* sound capture for the recorded videos: every voice's level/pan/low-pass per step, mixed offline */
  audCap(on){if(on){AU.cap={t0:st.t,ev:[]};return 0}const c=AU.cap;AU.cap=null;return c?c.ev:[]},AU,OAS,oasisNear,
  Cn,pi,dc,ready:false,OBST,PROPS,glb,ANIM,DV,REST,DRINK,navGrid,navPath,NAV,fn:{camelGo,camelPlan,grazeSpot,eagleTakeoff,eagleLand,eagleSpots,eaglePerchAt,play,rsBout}};
animalsReady.then(()=>{QA.ready=true});
window.__desProg=()=>{const ks=[...new Set(["saguaro_v3","cholla_v2","barrel_cactus_v3","tent",...CAMEL_SLOTS.map((_,i)=>camelKind(i).file),"bald_eagle_v1","pupfish_male_v3","pupfish_female_v3",RS_FILE])];
  let l=0,t=0,d=0;for(const k of ks){const P=GLP[k],E=desPre()[k],sz=P?P.t:((window.CY||{}).ms||{})[k]||3e6;t+=sz;l+=Math.min(sz,Math.max(P?P.l:0,E?E.l:0));if(P)d+=P.d}return{p:t?l/t:1,done:d===ks.length}};
window.__desReady=true;
}
})();
