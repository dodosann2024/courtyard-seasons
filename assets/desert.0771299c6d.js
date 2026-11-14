/* 沙漠浮岛 · Floating desert island (desert44 rebuild) — lazy-loaded on camera layer 3.
   Everything is authored in metres inside W (1 unit = 1 m) and displayed at S world units per
   metre, so a ~73 m island fits the shared orbit camera, its clamps and the sun's shadow frustum
   the same way the sea disc does. Shares renderer, composer, lights and the night sky. */
(()=>{
window.__desInit=getX=>{try{init(getX)}catch(e){window.__desErr=String(e&&e.stack||e)}};
function init(getX){
const X=getX(),T=X.T,{Jt,De,Ce,Cn,Ta,Ue,Ct,qt,jt,pi,dc}=X,MOB=!!X.kn;
const V3=T.V3,C3=T.Color,TAU=Math.PI*2,L3=8,PALM_LAYER=6;
const S=.25,YAW=-.21,D2R=Math.PI/180;
let sd=20261114;const rnd=()=>{sd|=0;sd=sd+0x6D2B79F5|0;let t=Math.imul(sd^sd>>>15,1|sd);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const rr=(a,b)=>a+(b-a)*rnd(),cl=(x,a,b)=>x<a?a:x>b?b:x;
const ss=(a,b,x)=>{const t=cl((x-a)/(b-a),0,1);return t*t*(3-2*t)};
const ease=(k,dt)=>1-Math.exp(-dt*k),mix=(a,b,t)=>a+(b-a)*t;
const wrapA=a=>{while(a>Math.PI)a-=TAU;while(a<-Math.PI)a+=TAU;return a};
const G2=(x,z,cx,cz,rx,rz)=>Math.exp(-(((x-cx)/rx)**2)-(((z-cz)/rz)**2));

const root=new T.Group();root.visible=false;Jt.add(root);
const W=new T.Group();W.scale.setScalar(S);W.rotation.y=YAW;W.position.y=2.2;root.add(W);
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
const AX=31,AZ=26.8;
const rimF=th=>1+.06*Math.sin(2*th+.7)+.05*Math.sin(3*th-1.2)+.03*Math.sin(5*th+2.1)+.018*Math.sin(8*th+.4)+.01*Math.sin(13*th+1.3);
function sN(x,z){const qx=x/AX,qz=z/AZ;return Math.hypot(qx,qz)/rimF(Math.atan2(qz,qx))}
function edgeXZ(th,s){const f=rimF(th)*s;return[AX*f*Math.cos(th),AZ*f*Math.sin(th)]}

const POND={x:-8.2,z:3.4,rx:7.2,rz:5.2,wy:-.42};
const pondF=th=>1+.09*Math.sin(2*th+1.1)+.06*Math.sin(3*th-.4)+.04*Math.sin(5*th+2.3);
function pN(x,z){const qx=(x-POND.x)/POND.rx,qz=(z-POND.z)/POND.rz;return Math.hypot(qx,qz)/pondF(Math.atan2(qz,qx))}
/* two open sandy beaches: camels drink at the east one, the eagle at the west one */
const BEACH=[.05,2.5],beachGap=th=>Math.min(...BEACH.map(b=>Math.abs(wrapA(th-b))));
function pondEdge(th,k){const f=pondF(th)*(k||1);return[POND.x+POND.rx*f*Math.cos(th),POND.z+POND.rz*f*Math.sin(th)]}

/* barchan: wind blows toward +x (slightly away), horns point downwind, slip face ~35° */
const DUNE={x:14.5,z:-5.5,H:4.8,w:6.8,Lw:8.5,Ll:7.5,yaw:.3};
const WIND={x:Math.cos(DUNE.yaw),z:-Math.sin(DUNE.yaw)};
function duneH(x,z){
  const c=Math.cos(DUNE.yaw),s=Math.sin(DUNE.yaw),dx=x-DUNE.x,dz=z-DUNE.z;
  const u=dx*c-dz*s,v=dx*s+dz*c,vn=v/DUNE.w,d=u-2.8*vn*vn;
  const hv=Math.exp(-vn*vn*1.15),p=d<0?Math.exp(-((d/DUNE.Lw)**2)):Math.max(0,1-d/DUNE.Ll)**1.3;
  return DUNE.H*hv*p}

const TENT={x:4.6,z:-9.6,yaw:-.32,L:6,D:4,H:2.2};
const tentFwd={x:Math.sin(TENT.yaw),z:Math.cos(TENT.yaw)};
const FIRE={x:TENT.x+tentFwd.x*(TENT.D*.5+3),z:TENT.z+tentFwd.z*(TENT.D*.5+3)};
const RACK={x:TENT.x-Math.cos(TENT.yaw)*5.4,z:TENT.z+Math.sin(TENT.yaw)*5.4+.8,yaw:TENT.yaw};
const PALMS=[{x:-8.4,z:-9.2,h:13.2,lean:[.05,-.06],ry:.4},{x:-4.6,z:-10.8,h:12,lean:[.07,.05],ry:2.1},{x:-12.4,z:-7.2,h:8.4,lean:[-.06,.04],ry:4.0}];
const SAG=[{x:-21,z:-9.8,h:5.2,ry:.6},{x:9.2,z:10.8,h:2.0,ry:2.4}];
const PADS=[{x:TENT.x,z:TENT.z,rx:5.2,rz:4.2,yaw:TENT.yaw},{x:FIRE.x,z:FIRE.z,rx:2.2,rz:2.2,yaw:0},{x:RACK.x,z:RACK.z,rx:2.4,rz:1.6,yaw:RACK.yaw}];

function hRaw(x,z){
  let h=.55*(fbm2(x*.045+3.1,z*.045-1.7)-.5)+.16*(fbm2(x*.17,z*.17)-.5);
  h+=duneH(x,z);
  h+=1.2*G2(x,z,-16,-16,8,5)+.8*G2(x,z,18,11,7,5)+.6*G2(x,z,-23,5,5,7)+.4*G2(x,z,2.5,16,8.5,4.5)+.45*G2(x,z,23,-12,5,5);
  return h}
PADS.forEach(p=>{p.h=hRaw(p.x,p.z)});
function hTop(x,z){
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
function glb(key){if(!GLB[key])GLB[key]=gltfMod().then(m=>m.loadGLB(ROOT()+"assets/models/"+key+".glb"));return GLB[key]}
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
const sandU={uWy:{value:POND.wy},uRipDir:{value:new T.V2(WIND.x,WIND.z)},uRip:{value:1},uNight:{value:0},
  uSandA:{value:new C3("#eab266")},uSandB:{value:new C3("#d09050")},uWet:{value:new C3("#8a6c4c")},uSoil:{value:new C3("#a39457")},
  uPond:{value:new T.V4(POND.x,POND.z,POND.rx,POND.rz)}};
function sandMat(){
  const m=new T.MSM({color:0xffffff,roughness:.93,metalness:0});
  m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,sandU);
    sh.vertexShader=sh.vertexShader.replace("#include <common>","#include <common>\nvarying vec3 vSP;varying vec3 vSN;")
      .replace("#include <begin_vertex>","#include <begin_vertex>\nvSP=position;vSN=normal;");
    sh.fragmentShader=sh.fragmentShader.replace("#include <common>",`#include <common>
      varying vec3 vSP;varying vec3 vSN;uniform mat3 normalMatrix;uniform float uWy,uRip,uNight;uniform vec2 uRipDir;
      uniform vec3 uSandA,uSandB,uWet,uSoil;uniform vec4 uPond;${GLSL_NOISE}
      float pondN(vec2 p){vec2 q=(p-uPond.xy)/uPond.zw;float th=atan(q.y,q.x);
        return length(q)/(1.+.09*sin(2.*th+1.1)+.06*sin(3.*th-.4)+.04*sin(5.*th+2.3));}
      float ripH(vec2 p){vec2 q=p+vec2(dfbm(p*.09)*4.,dfbm(p*.11+7.)*2.5);
        float ph=dot(q,uRipDir)*8.38;float a=sin(ph+.9*sin(ph));
        vec2 d2=vec2(-uRipDir.y,uRipDir.x);float b=sin(dot(q*1.7+3.,uRipDir+d2*.35)*8.38);
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
        diffuseColor.rgb=mix(sc,vec3(dot(sc,vec3(.3,.59,.11)))*vec3(.72,.8,1.),uNight*.75)*mix(1.,.45,uNight);`)
      .replace("#include <normal_fragment_maps>",`#include <normal_fragment_maps>
        {float fw=length(fwidth(vSP.xz));
         float pn2=pondN(vSP.xz);
         float k=uRip*(1.-smoothstep(.05,.22,fw))*smoothstep(1.3,1.8,pn2)*smoothstep(.55,.85,normalize(vSN).y);
         if(k>.001){float e=.04,h0=ripH(vSP.xz);
           vec2 g=vec2(ripH(vSP.xz+vec2(e,0.))-h0,ripH(vSP.xz+vec2(0.,e))-h0)/e*.022*k;
           vec3 nL=normalize(normalize(vSN)-vec3(g.x,0.,g.y));
           normal=normalize(normalMatrix*nL);}}`);
  };
  m.customProgramCacheKey=()=>"des44sand";
  return m}
let sandMesh=null;
(function buildSand(){
  const pos=[],idx=[];
  pos.push(0,hTop(0,0),0);
  const rs=[];for(let k=1;k<=NSR;k++){const u=k/NSR;rs.push(Math.pow(u,.8))}
  for(let k=0;k<rs.length;k++)for(let j=0;j<NT;j++){const th=j/NT*TAU,[x,z]=edgeXZ(th,rs[k]);pos.push(x,hTop(x,z),z)}
  for(let j=0;j<NT;j++)idx.push(0,1+(j+1)%NT,1+j);
  for(let k=0;k<rs.length-1;k++)for(let j=0;j<NT;j++){const a=1+k*NT+j,b=1+k*NT+(j+1)%NT,c=a+NT,d=b+NT;idx.push(a,b,c,b,d,c)}
  const g=new T.BG();g.setAttribute("position",new T.BA(new Float32Array(pos),3));g.setIndex(idx);g.computeVertexNormals();
  sandMesh=new T.Mesh(g,sandMat());sandMesh.receiveShadow=true;sandMesh.castShadow=true;W.add(sandMesh)})();

/* sandstone: triplanar painted texture + luminance bump, paled toward the reference's tan/lilac rock */
const rockU={uMap:{value:null},uHas:{value:0},uTint:{value:new C3("#f8e2c4")},uDeep:{value:new C3("#a3836f")},uSc:{value:1/6.5},uNight:{value:0}};
function rockMat(extra){
  const m=new T.MSM({color:0xffffff,roughness:.95,metalness:0});
  m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,rockU);
    sh.vertexShader=sh.vertexShader.replace("#include <common>","#include <common>\nvarying vec3 vRP;varying vec3 vRN;")
      .replace("#include <begin_vertex>",`#include <begin_vertex>
        ${extra&&extra.inst?"vec4 _rp=instanceMatrix*vec4(position,1.);vRP=_rp.xyz;vRN=normalize(mat3(instanceMatrix)*normal);":"vRP=position;vRN=normal;"}`);
    sh.fragmentShader=sh.fragmentShader.replace("#include <common>",`#include <common>
      varying vec3 vRP;varying vec3 vRN;uniform mat3 normalMatrix;uniform sampler2D uMap;uniform float uHas,uSc,uNight;uniform vec3 uTint,uDeep;${GLSL_NOISE}
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
        c=mix(c,c*vec3(.9,.9,1.02),smoothstep(.4,.9,dn2(vec2(vRP.y*.35,0.)+vRP.xz*.02)));
        c=mix(c,uDeep*(.55+.6*L),smoothstep(-3.,-17.,vRP.y)*.55);
        c=mix(c,vec3(dot(c,vec3(.3,.59,.11)))*vec3(.74,.8,1.),uNight*.7)*mix(1.,.55,uNight);
        diffuseColor.rgb=c;`)
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
const islandDepth=th=>17+3.2*Math.sin(th*1+.8)+2.2*Math.sin(th*2-1.1)+2.5*(fbm2(Math.cos(th)*2.1+5,Math.sin(th)*2.1)-.5);
(function buildRock(){
  const rows=[];
  /* each row: [s, yFn(th,x,z,edgeY), wall/underside weight, t(depth fraction)] */
  rows.push({s:.968,dy:-.25,lip:0});
  rows.push({s:.986,dy:.32,lip:1});
  rows.push({s:1.002,dy:.12,lip:.6});
  const TW=6;for(let k=1;k<=TW;k++)rows.push({s:1.004,wall:k/TW});
  const NU=MOB?30:46;for(let k=1;k<=NU;k++)rows.push({u:k/NU});
  const nR=rows.length,pos=new Float32Array(nR*NT*3),idx=[];
  const Dc=18.5;
  for(let j=0;j<NT;j++){
    const th=j/NT*TAU,[ex,ez]=edgeXZ(th,1),eY=hTop(ex,ez),tw=3.6+2.6*fbm2(Math.cos(th)*3+1,Math.sin(th)*3),D=islandDepth(th);
    const ox=Math.cos(Math.atan2(ez/AZ,ex/AX)),oz=Math.sin(Math.atan2(ez/AZ,ex/AX));
    for(let r=0;r<nR;r++){
      const R=rows[r];let x,z,y,disp=0;
      if(R.u==null&&R.wall==null){[x,z]=edgeXZ(th,R.s);const ln=fbm2(x*.35,z*.35);y=eY+R.dy*(R.lip?(.5+1.1*ln):1)+(R.lip?.25*(ln-.5):0)}
      else{
        let rf,yy;
        if(R.wall!=null){rf=1.004-.012*R.wall;yy=eY+.12-(tw+.12)*R.wall}
        else{const t=R.u,Dd=mix(D,Dc,ss(.75,1,t));
          rf=Math.pow(Math.max(0,1-Math.pow(t,1.25)),.85)*(1.004-.012);
          const lobe=Math.pow(Math.max(0,fbm2(Math.cos(th)*3.3+9,Math.sin(th)*3.3-2)*2-1),1.2)*8
            +Math.pow(Math.max(0,vn2(th*7.5+3,1.7)*2-1),2)*4.5;
          yy=eY+.12-tw-(Dd-tw)*t-lobe*ss(.2,.8,t)*(1-ss(.85,1,t))}
        [x,z]=edgeXZ(th,rf);y=yy;
        const wgt=R.wall!=null?1:(1-ss(.8,1,R.u));
        const arc=th*34;
        const st=(y+3.2*(fbm2(x*.05+2,z*.05)-.5))/1.9,li=Math.floor(st),f=st-li;
        const ledge=((f<.12?f/.12:1-(f-.12)/.88)*.9-.4)*(.35+.9*hs2(li*1.7,Math.floor(arc/9)));
        const bk=hs2(Math.floor(arc/3.1+.6*vn2(y*.3,th)),li)-.5;
        const crag=(fbm3(x*.11,y*.13,z*.11)-.5)*2.6+(fbm3(x*.3+4,y*.28,z*.3)-.5)*1.1;
        const fis=-1.1*Math.pow(1-Math.abs(2*vn2(arc/2.4,y*.05+th)-1),5);
        disp=(ledge+bk*.9+crag+fis)*wgt;
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
for(const s of SAG){addOb(s.x,s.z,s.h>3?.9:.55,"sag")}
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
  uDeep:{value:new C3("#0e6d66")},uShal:{value:new C3("#3fc2a6")},uBed:{value:new C3("#b89462")},uSkyA:{value:new C3("#c9a6c4")},uSkyB:{value:new C3("#6f6aa8")},
  uRefl:{value:null},uReflM:{value:new T.M4()},uReflOn:{value:0},uNight:{value:0},uWind:{value:.35}};
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
    fragmentShader:`uniform float uT,uReflOn,uNight,uWind;uniform vec3 uCamL,uSunL,uSunCol,uDeep,uShal,uBed,uSkyA,uSkyB;uniform sampler2D uRefl;varying float vD;varying vec3 vP;varying vec4 vR;${GLSL_NOISE}
      float wv(vec2 p){return dn2(p*1.1+vec2(uT*.35,uT*.12))*.6+dn2(p*2.7-vec2(uT*.22,-uT*.4))*.3+dn2(p*6.3+vec2(uT*.6,uT*.3))*.1;}
      void main(){
        float e=.06,h0=wv(vP.xz);vec2 g=vec2(wv(vP.xz+vec2(e,0.))-h0,wv(vP.xz+vec2(0.,e))-h0)/e;
        float amp=.05+.12*uWind;vec3 n=normalize(vec3(-g.x*amp,1.,-g.y*amp));
        vec3 V=normalize(uCamL-vP);
        float fr=.02+.98*pow(1.-max(dot(n,V),0.),5.);
        float dd=smoothstep(.02,1.3,vD);
        vec3 body=mix(uShal,uDeep,dd);
        body=mix(uBed*.8,body,smoothstep(0.,.32,vD));
        vec3 rd=reflect(-V,n);
        vec3 sky=mix(uSkyA,uSkyB,smoothstep(.0,.8,rd.y));
        vec3 refl=sky;
        if(uReflOn>.5){vec2 ruv=vR.xy/vR.w+n.xz*.035;vec4 rc=texture2D(uRefl,clamp(ruv,0.,1.));
          rc=(any(isnan(rc))||any(isinf(rc)))?vec4(0.):clamp(rc,0.,1.);refl=mix(refl,rc.rgb,rc.a*.92);}
        vec3 c=mix(body,refl,clamp(fr*1.1+.12,0.,.85));
        float gl=pow(max(dot(rd,uSunL),0.),220.)*(1.-uNight);
        c+=uSunCol*gl*2.2;
        float a=smoothstep(0.,.05,vD);
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
const vegU={uT:{value:0},uWind:{value:.35}};
function vegMat(opt){
  const m=new T.MSM({vertexColors:true,roughness:.88,metalness:0,side:2});
  m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,vegU);
    sh.vertexShader=sh.vertexShader.replace("#include <common>","#include <common>\nuniform float uT,uWind;")
      .replace("#include <begin_vertex>",`#include <begin_vertex>
        {vec3 ip=vec3(0.);
         #ifdef USE_INSTANCING
         ip=instanceMatrix[3].xyz;
         #endif
         float h=max(position.y,0.);float ph=ip.x*.37+ip.z*.61;
         float sw=(sin(uT*1.9+ph)*.6+sin(uT*3.3+ph*1.7)*.25+.35)*uWind*${opt.sway.toFixed(3)};
         transformed.x+=sw*h*h;transformed.z+=sw*.35*h*h;}`)
      .replace("#include <beginnormal_vertex>","vec3 objectNormal=normalize(mix(normal,vec3(0.,1.,0.),"+opt.up.toFixed(2)+"));\n#ifdef USE_TANGENT\nvec3 objectTangent=vec3(tangent.xyz);\n#endif");
  };
  m.customProgramCacheKey=()=>"des44veg"+opt.sway+opt.up;return m}
function tuftGeo(nb,lean,wid,c0,c1,seed){
  const pos=[],col=[],idx=[];sd=seed;
  for(let b=0;b<nb;b++){const a=b/nb*TAU+rr(-.3,.3),ln=rr(lean[0],lean[1]),hh=rr(.65,1),w=wid*rr(.7,1.2),seg=4,base=pos.length/3;
    const dx=Math.cos(a),dz=Math.sin(a),px=-dz,pz=dx;
    for(let i=0;i<=seg;i++){const u=i/seg,bend=ln*u*u*1.3+ln*.3*u,y=hh*u*(1-.15*bend),r=bend*hh*.55+.02,ww=w*(1-u*.92);
      const cx=dx*r,cz=dz*r;pos.push(cx-px*ww,y,cz-pz*ww,cx+px*ww,y,cz+pz*ww);
      const k=Math.pow(u,.8),cc=[c0[0]+(c1[0]-c0[0])*k,c0[1]+(c1[1]-c0[1])*k,c0[2]+(c1[2]-c0[2])*k];col.push(...cc,...cc);
      if(i<seg){const o=base+i*2;idx.push(o,o+1,o+2,o+1,o+3,o+2)}}}
  const g=new T.BG();g.setAttribute("position",new T.BA(new Float32Array(pos),3));g.setAttribute("color",new T.BA(new Float32Array(col),3));g.setIndex(idx);g.computeVertexNormals();return g}
const lin=h=>{const c=new C3(h);return[c.r,c.g,c.b]};
const VEG=[];
function scatter(geo,mat,list){const im=new T.IM(geo,mat,list.length),m=new T.M4(),q=new T.Quat();
  list.forEach((p,i)=>{q.setFromAxisAngle(new V3(0,1,0),p.ry);m.compose(new V3(p.x,hTop(p.x,p.z)-.04,p.z),q,new V3(p.s,p.h,p.s));im.setMatrixAt(i,m)});
  im.castShadow=true;im.receiveShadow=true;im.instanceMatrix.needsUpdate=true;W.add(im);VEG.push(im);return im}
(function plantOasis(){
  const grassG=tuftGeo(11,[.25,.75],.022,lin("#3a6420"),lin("#b5c95c"),11),dryG=tuftGeo(9,[.35,.9],.016,lin("#6a5a2c"),lin("#c9b06a"),12);
  const reedG=tuftGeo(7,[.02,.16],.016,lin("#3a4a22"),lin("#8f9a4c"),13);
  const gm=vegMat({sway:.07,up:.65}),rm=vegMat({sway:.05,up:.5});
  const L=[],D=[],R=[];const N=MOB?520:1000;let tries=0;
  while(L.length<N&&tries<N*12){tries++;const th=rnd()*TAU,k=1+Math.pow(rnd(),1.8)*.8,[x,z]=pondEdge(th,k);if(beachGap(th)<.3&&k<1.6)continue;
    if(hTop(x,z)<POND.wy+.04)continue;const near=1-ss(1,1.8,k);
    L.push({x:x+rr(-.4,.4),z:z+rr(-.4,.4),ry:rnd()*TAU,s:rr(.8,1.3),h:rr(.35,.55)+.35*near})}
  /* a lusher apron under the palms */
  for(let i=0;i<(MOB?120:240);i++){const p=PALMS[i%3],a=rnd()*TAU,r=Math.sqrt(rnd())*4.2;const x=p.x+Math.cos(a)*r,z=p.z+Math.sin(a)*r;if(pN(x,z)<1.02)continue;L.push({x,z,ry:rnd()*TAU,s:rr(.8,1.2),h:rr(.3,.6)})}
  for(let i=0;i<(MOB?50:90);i++){let x,z,ok=0;for(let t=0;t<20&&!ok;t++){const a=rnd()*TAU,r=Math.sqrt(rnd())*.86;[x,z]=edgeXZ(a,r);ok=pN(x,z)>2.4&&clearOf(x,z,1)&&duneH(x,z)<.6}
    if(ok)D.push({x,z,ry:rnd()*TAU,s:rr(.7,1.1),h:rr(.25,.45)})}
  for(let c=0;c<16;c++){const th=c/16*TAU+rr(-.15,.15);if((Math.sin(th)>.55&&c%2)||beachGap(th)<.45)continue;const[x0,z0]=pondEdge(th,rr(.93,1.01));
    for(let i=0;i<rr(5,9);i++)R.push({x:x0+rr(-.6,.6),z:z0+rr(-.6,.6),ry:rnd()*TAU,s:rr(.9,1.3),h:rr(1.2,2.1)})}
  scatter(grassG,gm,L);scatter(dryG,gm,D);scatter(reedG,rm,R);
  /* leafy shrubs: lobed clusters with sphere-ish normals so they read soft, not like melons */
  const shrubGeo=(seed)=>{sd=seed;const V=[],F=[],C=[];const lobes=5+(seed%3);
    for(let l=0;l<lobes;l++){const{v,f}=icoSphere(2),a=l/lobes*TAU+rr(-.4,.4),r=l?rr(.35,.55):0,cx=Math.cos(a)*r,cz=Math.sin(a)*r,cy=l?rr(.25,.45):.55,rad=l?rr(.32,.45):.5,o=V.length;
      v.forEach(p=>{const n=1+.32*(fbm3(p[0]*2.6+seed,p[1]*2.6,p[2]*2.6+l)-.5)*2;const x=cx+p[0]*rad*n,y=Math.max(.02,cy+p[1]*rad*n*.85),z=cz+p[2]*rad*n;V.push([x,y,z]);
        const k=ss(0,1,y)*.8+.2*fbm3(x*5,y*5,z*5);C.push([mix(.05,.2,k),mix(.13,.33,k),mix(.03,.07,k)])});
      f.forEach(t=>F.push([t[0]+o,t[1]+o,t[2]+o]))}
    const g=geoFrom(V,F,C);const p=g.attributes.position,n=g.attributes.normal;
    for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i)-.25,z=p.getZ(i),l=Math.hypot(x,y,z)||1;n.setXYZ(i,mix(n.getX(i),x/l,.6),mix(n.getY(i),y/l,.6),mix(n.getZ(i),z/l,.6))}
    return g};
  const sm=new T.MSM({vertexColors:true,roughness:.9,metalness:0});
  sm.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace("#include <common>","#include <common>\nvarying vec3 vLP;").replace("#include <begin_vertex>","#include <begin_vertex>\nvLP=position;");
    sh.fragmentShader=sh.fragmentShader.replace("#include <common>","#include <common>\nvarying vec3 vLP;"+GLSL_NOISE).replace("#include <color_fragment>","#include <color_fragment>\ndiffuseColor.rgb*=.62+.62*dn2(vLP.xz*9.+vLP.y*7.)*dn2(vLP.xy*13.+3.);")};
  sm.customProgramCacheKey=()=>"des44shrub";
  const SH=[];
  for(let i=0;i<14;i++){const th=Math.PI*(1.05+i/14*.95)+rr(-.1,.1),[x,z]=pondEdge(th,rr(1.18,1.5));if(beachGap(th)<.4)continue;SH.push({x,z,s:rr(.9,1.6)})}
  PALMS.forEach((p,i)=>{for(let k=0;k<3;k++){const a=rnd()*TAU,r=rr(1.6,3.2);SH.push({x:p.x+Math.cos(a)*r,z:p.z+Math.sin(a)*r,s:rr(.8,1.4)})}});
  const sg=[shrubGeo(3),shrubGeo(7),shrubGeo(11)];
  SH.forEach((p,i)=>{if(pN(p.x,p.z)<1.1)return;const m=new T.Mesh(sg[i%3],sm);m.position.set(p.x,hTop(p.x,p.z)-.08,p.z);m.scale.set(p.s,p.s*rr(.75,1),p.s);m.rotation.y=rnd()*TAU;m.castShadow=m.receiveShadow=true;W.add(m);addOb(p.x,p.z,p.s*.7,"shrub")});
})();
/* ---------------- rim boulders + scattered stones (0.3–2 m) ---------------- */
(function rocks(){
  const L=[];
  const put=(x,z,s)=>{if(pN(x,z)<1.5||!clearOf(x,z,s*.6+.3))return false;L.push({x,z,s,sx:rr(.8,1.3),sz:rr(.8,1.25),ry:rnd()*TAU});addOb(x,z,s*.75,"rock");return true};
  /* clusters along the rim: a big one with satellites */
  for(let c=0;c<22;c++){const th=c/22*TAU+rr(-.12,.12),[x,z]=edgeXZ(th,rr(.9,.955));const big=rnd()<.45?rr(1.1,2):rr(.6,1.1);
    if(!put(x,z,big))continue;for(let k=0;k<rr(1,4);k++){const a=rnd()*TAU,r=big*rr(.9,1.8);put(x+Math.cos(a)*r,z+Math.sin(a)*r,rr(.3,.6))}}
  /* front cluster (reference: just right of centre, in front of the pond) */
  [[-2.6,19.2,1.6],[-1,20.3,.85],[-4,20.1,.65],[-1.9,17.9,.45],[0,19.1,.35]].forEach(([x,z,s])=>put(x,z,s));
  [[11.5,-22,1.5],[13.6,-21.2,.8],[-17,-18.7,1.2],[20.4,6.8,.9],[18.7,8.5,.5],[-25.5,0,1],[25.5,-3.4,1.3]].forEach(([x,z,s])=>put(x,z,s));
  for(let i=0;i<12;i++){const a=rnd()*TAU,r=Math.sqrt(rnd())*.85,[x,z]=edgeXZ(a,r);if(duneH(x,z)>.5)continue;put(x,z,rr(.25,.45))}
  placeRocks(L)})();

/* ---------------- Tripo props: date palms (trunk lengthened, crown kept ~6 m), saguaros, tent ---------------- */
const PROPS={palms:[],sag:[],tent:null,sagTop:null};
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
function palmMat(H,isTrunk){
  const m=new T.MSM({vertexColors:true,roughness:isTrunk?.95:.82,metalness:0,side:isTrunk?0:2});
  m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,propU);
    sh.vertexShader=sh.vertexShader.replace("#include <common>","#include <common>\nuniform float uT,uWind;attribute vec2 aUV;varying vec2 vUV;")
      .replace("#include <begin_vertex>",`#include <begin_vertex>
        vUV=aUV;
        {float h=clamp(position.y/${H.toFixed(2)},0.,1.);float ph=modelMatrix[3].x*.9+modelMatrix[3].z*.7;
         float s=(sin(uT*.8+ph)*.7+sin(uT*1.6+ph*1.3)*.3)*(.25+uWind)*.16;
         transformed.x+=s*h*h;transformed.z+=s*.45*h*h;
         ${isTrunk?"":`float r=length(position.xz);float fl=smoothstep(.4,3.5,r)*(.3+uWind);
         transformed.y+=sin(uT*2.3+r*2.1+ph+position.x)*.07*fl;transformed.x+=sin(uT*3.1+r*3.+ph)*.04*fl;`}}`);
    if(isTrunk)sh.fragmentShader=sh.fragmentShader.replace("#include <common>","#include <common>\nvarying vec2 vUV;")
      .replace("#include <color_fragment>",`#include <color_fragment>
        {vec2 p=vec2(vUV.x*7.,vUV.y/.2);float d=abs(fract(p.x+p.y)-.5)+abs(fract(p.x-p.y)-.5);
         float sc=smoothstep(.25,.55,d);diffuseColor.rgb*=mix(.55,1.12,sc);
         float ring=smoothstep(.08,0.,abs(fract(vUV.y/.2)-.5)-.38);diffuseColor.rgb*=1.-ring*.25;}`);};
  m.customProgramCacheKey=()=>"des44palm"+(isTrunk?"t":"c")+H.toFixed(1);return m}
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
       const rad=(.23+.17*Math.exp(-t*22)-.03*t+(t>.95?.04:0))*(H>10?1:.85);
       for(let a=0;a<=NA;a++){const an=a/NA*TAU,c=Math.cos(an),s2=Math.sin(an),q=P.clone().addScaledVector(N,c*rad).addScaledVector(B,s2*rad);
         pos.push(q.x,q.y,q.z);const k=.8+.25*hs2(r*3.1,a);col.push(.42*k,.31*k,.21*k);uv.push(a/NA,t*H)}}
     for(let r=0;r<NR;r++)for(let a=0;a<NA;a++){const i0=r*(NA+1)+a,i1=i0+1,i2=i0+NA+1,i3=i2+1;idx.push(i0,i2,i1,i1,i2,i3)}
     const g=new T.BG();g.setAttribute("position",new T.BA(new Float32Array(pos),3));g.setAttribute("color",new T.BA(new Float32Array(col),3));g.setAttribute("aUV",new T.BA(new Float32Array(uv),2));g.setIndex(idx);g.computeVertexNormals();
     const m=new T.Mesh(g,palmMat(H,true));m.castShadow=m.receiveShadow=true;grp.add(m)}
    /* crown */
    const top=spine(1),pos=[],col=[],nrm=[],uv=[];
    const quad=(a,b,c,d,ca,cb,n)=>{for(const[p,cc]of[[a,ca],[b,ca],[c,cb],[b,ca],[d,cb],[c,cb]]){pos.push(p.x,p.y,p.z);col.push(...cc);nrm.push(n.x,n.y,n.z);uv.push(0,0)}};
    const frond=(az,el,L,droop,cBase,cTip,dead)=>{
      const d0=new V3(Math.cos(el)*Math.cos(az),Math.sin(el),Math.cos(el)*Math.sin(az)),P0=top.clone().addScaledVector(d0,.15);
      const at=s=>P0.clone().addScaledVector(d0,L*s).add(new V3(0,-droop*L*s*s,0));
      const NPr=dead?18:30;
      for(let i=0;i<NPr;i++){const s=.12+.88*i/(NPr-1),R=at(s),Tg=at(Math.min(1,s+.01)).sub(at(Math.max(0,s-.01))).normalize();
        const side=new V3().crossVectors(Tg,new V3(0,1,0)).normalize(),upL=new V3().crossVectors(side,Tg).normalize();
        const ll=(.12+.62*Math.sin(Math.PI*(s*.92+.04)))*(dead?.7:1)*(H>10?1:.85);
        for(const sg of[-1,1]){
          const dir=Tg.clone().multiplyScalar(.62).addScaledVector(side,sg*.72).addScaledVector(upL,dead?-.4:.38).normalize();
          const w=new V3().crossVectors(dir,Tg).normalize().multiplyScalar(.032),tip=R.clone().addScaledVector(dir,ll).add(new V3(0,-.06*ll,0));
          const n=new V3(dir.x*.35,1,dir.z*.35).normalize(),j=.85+.3*hs2(i*1.7+az,sg);
          quad(R.clone().sub(w),R.clone().add(w),tip.clone().addScaledVector(w,-.25),tip.clone().addScaledVector(w,.25),cBase.map(c=>c*j),cTip.map(c=>c*j),n)}}
      /* rachis */
      for(let i=0;i<12;i++){const s0=i/12,s1=(i+1)/12,a=at(s0),b=at(s1),w=new V3(-Math.sin(az),0,Math.cos(az)).multiplyScalar(.025*(1-s0*.7));
        quad(a.clone().sub(w),a.clone().add(w),b.clone().sub(w),b.clone().add(w),[.3,.3,.14],[.38,.38,.18],new V3(0,1,0))}};
    const NF=MOB?20:28,ga=2.39996;
    for(let i=0;i<NF;i++){const k=i/(NF-1),az=i*ga+pp.ry,el=(62-90*Math.pow(k,.85))*D2R,L=mix(2.6,3.7,Math.min(1,k*1.4))*cw*rr(.92,1.08);
      const g1=[mix(.1,.18,k),mix(.2,.24,k),mix(.05,.07,k)],g2=[mix(.32,.5,k),mix(.45,.48,k),mix(.1,.14,k)];
      frond(az,el,L,mix(.18,.45,k),g1,g2,false)}
    for(let i=0;i<4;i++){const az=i/4*TAU+.5+pp.ry;frond(az,-68*D2R,2.4*cw,.1,[.33,.22,.11],[.55,.4,.22],true)}
    const g=new T.BG();g.setAttribute("position",new T.BA(new Float32Array(pos),3));g.setAttribute("color",new T.BA(new Float32Array(col),3));g.setAttribute("normal",new T.BA(new Float32Array(nrm),3));g.setAttribute("aUV",new T.BA(new Float32Array(uv),2));
    const cm=new T.Mesh(g,palmMat(H,false));cm.castShadow=true;cm.receiveShadow=true;grp.add(cm);
    for(let c=0;c<(H>10?4:2);c++){const az=c/4*TAU+pp.ry+.4,base=top.clone().add(new V3(Math.cos(az)*.35,-.35,Math.sin(az)*.35));
      for(let k=0;k<46;k++){const u=rnd(),r=.06+.16*u;dates.push({p:base.clone().add(new V3(Math.cos(az)*u*.3+rr(-r,r),-u*.8+rr(-.05,.05),Math.sin(az)*u*.3+rr(-r,r))),g:grp,c:rnd()})}}
    grp.position.set(pp.x,hTop(pp.x,pp.z)-.1,pp.z);W.add(grp);reflSet.push(grp);PROPS.palms.push(grp);grp.userData.top=top.clone().add(grp.position)});
  const dm=new T.MSM({color:"#ffffff",roughness:.55,metalness:0});
  const im=new T.IM(DATE_GEO,dm,dates.length),m=new T.M4(),q=new T.Quat(),c=new C3();
  dates.forEach((d,i)=>{const wp=d.p.clone().add(d.g.position);m.compose(wp,q,new V3(1,1,1));im.setMatrixAt(i,m);im.setColorAt(i,c.set(d.c<.6?"#c9731f":d.c<.85?"#a8521a":"#e0a040"))});
  im.castShadow=true;W.add(im);reflSet.push(im)}
buildPalms();
const propsReady=Promise.all([
  glb("saguaro").then(({scene})=>{
    SAG.forEach((s,i)=>{const sc=i?VT.cloneSkinned(scene):scene;const w=fitTo(sc,s.h,"y");matsOf(w,m=>{cleanMat(m);if(m.color)m.color.set("#ffffff");m.roughness=.8;
      m.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace("#include <map_fragment>",`#ifdef USE_MAP
        vec4 tx=texture2D(map,vMapUv);float l=dot(tx.rgb,vec3(.3,.59,.11));diffuseColor.rgb=mix(vec3(.10,.17,.07),vec3(.42,.55,.26),clamp(l*2.2,0.,1.));
        #else
        diffuseColor.rgb=vec3(.26,.38,.16);
        #endif`)};m.needsUpdate=true});
      w.position.set(s.x,hTop(s.x,s.z)-.08,s.z);w.rotation.y=s.ry;w.traverse(c=>{if(c.isMesh){c.castShadow=c.receiveShadow=true;c.frustumCulled=false}});W.add(w);onDes(w);PROPS.sag.push(w)});
    /* highest point of the tall saguaro = eagle roost */
    const w=PROPS.sag[0];w.updateMatrixWorld(true);const inv=new T.M4().copy(W.matrixWorld).invert(),p=new V3();let best=null;
    w.traverse(c=>{if(!c.isMesh)return;const a=c.geometry.attributes.position;for(let i=0;i<a.count;i+=3){p.fromBufferAttribute(a,i).applyMatrix4(c.matrixWorld).applyMatrix4(inv);if(!best||p.y>best.y)best=p.clone()}});
    PROPS.sagTop=best}).catch(()=>{}),
  glb("tent").then(({scene})=>{
    const w=fitTo(scene,1,"y"),b=w.userData.box,sc=w.userData.sc;
    w.scale.set(TENT.L/(b.mx.x-b.mn.x),TENT.H/(b.mx.y-b.mn.y),TENT.D/(b.mx.z-b.mn.z));
    matsOf(w,m=>{cleanMat(m);if(m.color)m.color.set("#ffffff");m.roughness=.95;m.side=2;
      /* the source texture is a dark red hide; keep its luminance detail but read it as sun-bleached canvas, darker members as wood */
      m.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace("#include <map_fragment>",`#ifdef USE_MAP
        vec4 tx=texture2D(map,vMapUv);float l=dot(tx.rgb,vec3(.3,.59,.11));
        vec3 canv=vec3(1.,.9,.76)*(.85+2.6*l);diffuseColor.rgb=mix(vec3(.30,.20,.12),min(canv,vec3(1.)),smoothstep(.015,.07,l));
        #endif`)};m.needsUpdate=true});
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
  fireL=new T.PL(new C3("#ff9a4a"),0,3.2,2);fireL.position.set(FIRE.x,hTop(FIRE.x,FIRE.z)+.9,FIRE.z);W.add(fireL);fireL.layers.enable(3);
})();

/* campfire smoke: thin camera-facing ribbons rising ~15 m and leaning downwind (upper right of the default view) */
const SMOKE_H=15;
const smokeU={uT:{value:0},uBase:{value:new V3(FIRE.x,fireG.position.y+.45,FIRE.z)},uWind:{value:new V3(WIND.x,0,WIND.z)},uCamL:{value:new V3()},uOp:{value:1},uCol:{value:new C3(.9,.87,.84)}};
const SMOKE=[];
for(let r=0;r<3;r++){
  const SEG=56,n=SEG+1,aT=new Float32Array(n*2),aS=new Float32Array(n*2),pos=new Float32Array(n*6),idx=[];
  for(let i=0;i<n;i++){aT[i*2]=aT[i*2+1]=i/SEG;aS[i*2]=-1;aS[i*2+1]=1;if(i<SEG){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2)}}
  const g=new T.BG();g.setAttribute("position",new T.BA(pos,3));g.setAttribute("aT",new T.BA(aT,1));g.setAttribute("aS",new T.BA(aS,1));g.setIndex(idx);
  const u=Object.assign({},smokeU,{uSeed:{value:r*7.31+1.7},uW:{value:[1,.72,.55][r]},uA:{value:[.5,.36,.26][r]}});
  const mat=new T.SM({transparent:true,depthWrite:false,side:2,uniforms:u,
    vertexShader:`attribute float aT,aS;uniform float uT,uSeed,uW;uniform vec3 uBase,uWind,uCamL;varying float vT,vS;varying vec2 vN;
      vec3 spine(float t){float h=t*${SMOKE_H.toFixed(1)};vec3 side=normalize(cross(uWind,vec3(0.,1.,0.)));
        float lean=h*(.18+.62*t);
        float sway=sin(uT*.5+t*4.2+uSeed)*.28*t*t*h+sin(uT*1.2+t*9.+uSeed*2.)*.06*t*h;
        float curl=sin(uT*.37+t*3.1+uSeed*1.7)*.26*t*h+sin(uT*.85+t*7.3+uSeed)*.07*h*t;
        return uBase+vec3(0.,h,0.)+uWind*(lean+sway*.4)+side*(curl+sway*.5);}
      void main(){vT=aT;vS=aS;vec3 p=spine(aT),p2=spine(min(aT+.02,1.)),q=spine(max(aT-.02,0.));
        vec3 tg=normalize(p2-q+vec3(0.,1e-4,0.)),vd=normalize(uCamL-p),sd=normalize(cross(tg,vd));
        float w=mix(.12,3.4,pow(aT,1.15))*uW;vec3 wp=p+sd*aS*w*.5;vN=vec2(aS*w*.5,aT*${SMOKE_H.toFixed(1)});
        gl_Position=projectionMatrix*modelViewMatrix*vec4(wp,1.);}`,
    fragmentShader:`uniform float uT,uSeed,uA,uOp;uniform vec3 uCol;varying float vT,vS;varying vec2 vN;${GLSL_NOISE}
      void main(){vec2 p=vec2(vN.x*1.4,vN.y*.42-uT*.55)+uSeed;
        float d=dfbm(p+vec2(dfbm(p*.6+uT*.04)*2.2,0.));float wisp=smoothstep(.36,.74,d);
        float fil=dn2(vec2(vS*3.2+sin(vN.y*.3+uT*.6+uSeed)*.9,vN.y*.15-uT*.35+uSeed));
        float across=1.-abs(vS+(d-.5)*.7*smoothstep(.05,.5,vT));float core=pow(max(across,0.),1.5);
        float a=uA*uOp*core*mix(.35,1.,wisp)*mix(.45,1.15,fil)*mix(1.,wisp,smoothstep(.2,.8,vT));
        float puff=dn2(vec2(uSeed*3.1,vN.y*.25-uT*.4));a*=mix(1.,.45+.55*smoothstep(.15,.6,puff),smoothstep(.15,.5,vT));
        a*=smoothstep(0.,.07,vT)*(1.-smoothstep(.45,1.,vT))*mix(1.1,.5,vT);
        if(a<.01)discard;gl_FragColor=vec4(uCol*mix(.92,1.06,vT),a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`});
  const mesh=new T.Mesh(g,mat);mesh.frustumCulled=false;mesh.renderOrder=7;W.add(mesh);SMOKE.push(mesh)}

/* ---------------- soft points (sand wisps, fireflies) ---------------- */
function softPoints(n,col,size,additive){
  const g=new T.BG(),P=new Float32Array(n*3),A=new Float32Array(n),Z=new Float32Array(n);
  g.setAttribute("position",new T.BA(P,3));g.setAttribute("a",new T.BA(A,1));g.setAttribute("z",new T.BA(Z,1));
  const m=new T.SM({transparent:true,depthWrite:false,blending:additive?2:1,uniforms:{uC:{value:new C3(col)},uS:{value:size},uH:{value:innerHeight}},
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
function sandSeed(i,init){
  const crest=rnd()<.55;let x,z;
  if(crest){const v=rr(-1,1)*DUNE.w*1.1,c=Math.cos(DUNE.yaw),s=Math.sin(DUNE.yaw),u=2.8*(v/DUNE.w)**2;x=DUNE.x+u*c+v*s;z=DUNE.z-u*s+v*c}
  else{const[a,b]=edgeXZ(rnd()*TAU,Math.sqrt(rnd())*.88);x=a;z=b}
  const q={x,z,y:hTop(x,z)+.05,vx:WIND.x*rr(1.5,3.4),vz:WIND.z*rr(1.5,3.4)+rr(-.3,.3),vy:crest?rr(.15,.5):rr(0,.12),life:init?rnd():0,dur:rr(2.5,6),crest};
  SANDP[i]=q;SAND.Z[i]=rr(.4,1.3)}
for(let i=0;i<SAND.n;i++)sandSeed(i,true);
/* night fireflies over the oasis */
const FF=softPoints(MOB?18:32,"#d8ff8a",.12,true);FF.o.renderOrder=9;W.add(FF.o);
const FFP=[];for(let i=0;i<FF.n;i++){const[a,b]=pondEdge(rnd()*TAU,rr(.8,1.9));FFP.push({x:a,z:b,y:rr(.4,2.6),ph:rnd()*TAU,sp:rr(.3,.7),bl:rr(.6,1.4)});FF.Z[i]=rr(.8,1.2)}
/*@@ANIMALS@@*/


/* ---------------- sun: low, behind-right of the default view (backlit island, shadows toward lower-left) ---------------- */
const SUN={azL:157*D2R,lazL:118*D2R,el:15*D2R};
const sunAzW=()=>SUN.azL+YAW;
const sunDirW=new V3();
function setSunDir(el){const a=sunAzW();sunDirW.set(Math.cos(el)*Math.sin(a),Math.sin(el),Math.cos(el)*Math.cos(a))}
setSunDir(SUN.el);

/* ---------------- sky: photographed cloud sea as mirrored panels + one procedural sun ---------------- */
const SKY_TILE=Math.PI*.5,SKY_HOR=-16*D2R;
const skyU={map:{value:null},uYaw0:{value:168*D2R+YAW*0},uTile:{value:SKY_TILE},uVspan:{value:SKY_TILE*(576/1024)},uHor:{value:SKY_HOR},
  uSkyK:{value:1.45},uSunDir:{value:new V3()},uSunVis:{value:1},uMode:{value:0},uExpo:{value:1},uSeeThru:{value:0},uCon:{value:1.08}};
const skyM=new T.SM({uniforms:skyU,side:1,depthWrite:false,depthTest:true,fog:false,toneMapped:false,
  vertexShader:`varying vec3 vDir;void main(){vec4 w=modelMatrix*vec4(position,1.);vDir=w.xyz-cameraPosition;gl_Position=projectionMatrix*viewMatrix*w;}`,
  fragmentShader:`uniform sampler2D map;uniform float uYaw0,uTile,uVspan,uHor,uSkyK,uSunVis,uMode,uExpo,uSeeThru,uCon;uniform vec3 uSunDir;varying vec3 vDir;
    float mir(float u){float m=mod(u,2.);return 1.-abs(m-1.);}
    /* inverse of the renderer's ACES filmic curve so the photograph reads as shot */
    vec3 invACES(vec3 y){
      const mat3 AIn=mat3(vec3(.59719,.07600,.02840),vec3(.35458,.90834,.13383),vec3(.04823,.01566,.83777));
      const mat3 AOut=mat3(vec3(1.60475,-.10208,-.00327),vec3(-.53108,1.10813,-.07276),vec3(-.07367,-.00605,1.07602));
      vec3 t=inverse(AOut)*clamp(y,0.,.97);
      vec3 a=.983729*t-1.,b=.432951*t-.0245786,c=.238081*t+.000090537;
      vec3 v=(-b-sqrt(max(b*b-4.*a*c,0.)))/(2.*a);
      return max(inverse(AIn)*v,0.)*(.6/uExpo);}
    void main(){
      vec3 d=normalize(vDir);
      float el=asin(clamp(d.y,-1.,1.)),yaw=atan(d.x,d.z);
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
      float g=max(dot(d,uSunDir),0.);
      vec2 hd=normalize(d.xz+1e-5),hsd=normalize(uSunDir.xz+1e-5);float az=max(dot(hd,hsd),0.);
      float band=exp(-pow((el-uHor-.02)/.07,2.))*pow(az,6.);
      if(uMode<.5){
        {float l=dot(col,vec3(.3,.55,.15));col=mix(vec3(l),col,.82);col=mix(col*vec3(.9,.88,1.1),col,smoothstep(.25,.75,l));}
        col+=vec3(1.,.66,.34)*(pow(g,400.)*.1+pow(g,3000.)*.3)*uSunVis;
        col+=vec3(1.,.62,.32)*band*.16*uSunVis;
        col=mix(col,vec3(1.,.97,.88),smoothstep(.99985,.99993,g)*uSunVis);
        col=mix(col,col*vec3(1.05,.97,.9),pow(az,3.)*.45);
      }else if(uMode<1.5){
        float l=dot(col,vec3(.3,.55,.15));
        col=mix(col,vec3(l)*vec3(.95,.99,1.05)+vec3(-.01,.02,.06),.5);
        col+=vec3(1.,.95,.85)*pow(g,40.)*.2*uSunVis;
        col=mix(col,vec3(1.,.99,.95),smoothstep(.99985,.99993,g)*uSunVis);
      }else{
        float l=dot(col,vec3(.3,.55,.15));
        col=mix(vec3(.02,.03,.07),vec3(.17,.21,.36),smoothstep(.05,.75,l))*mix(1.,.55,smoothstep(0.,-.6,ft));
      }
      gl_FragColor=vec4(invACES(pow(max(col,0.),vec3(2.2))),1.-uSeeThru*smoothstep(uHor+.03,uHor+.22,el));}`});
const skyDome=new T.Mesh(new T.Sphere(150,64,40),skyM);skyDome.renderOrder=-200;skyDome.frustumCulled=false;root.add(skyDome);
(()=>{const c=document.createElement("canvas");c.width=c.height=4;const x=c.getContext("2d");x.fillStyle="#e8a878";x.fillRect(0,0,4,4);
  const t=new T.CTex(c);skyU.map.value=t})();
loadTex("assets/tex/sky_cloudsea_pano.jpg").then(t=>{t.colorSpace="";t.generateMipmaps=false;t.minFilter=1006;t.magFilter=1006;t.wrapS=t.wrapT=1001;t.needsUpdate=true;skyU.map.value=t}).catch(()=>{});
let _appSky;
function appSkyMesh(){if(_appSky!==undefined)return _appSky;_appSky=null;
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
function phaseNow(){
  if(st.tod)return st.tod;
  if(nightRaw()>.5)return"night";
  if(Ct.mode==="follow"){const h=new Date().getHours();if(h>=9&&h<16)return"day"}
  return"sunset"}
const LIT={
  sunset:{el:15,col:"#ffb469",I:2.6,sky:"#9a8cc8",gnd:"#d69c66",hI:.72,exp:1,clear:0x8a6a70,mode:0,con:.09,sat:1.07,ray:.34,vig:.26,tint:[1.02,1,.96],lift:.012},
  day:{el:46,col:"#fff0d8",I:2.9,sky:"#b4cdea",gnd:"#d8b483",hI:.95,exp:1,clear:0x9ab8d0,mode:1,con:.05,sat:1.03,ray:.1,vig:.2,tint:[1,1,1],lift:.008},
  night:{el:38,col:"#9fb4ff",I:.42,sky:"#2a3c66",gnd:"#141824",hI:.42,exp:.72,clear:0x0a1428,mode:2,con:.12,sat:.62,ray:0,vig:.38,tint:[.8,.9,1.15],lift:0}};
const _c1=new C3(),_c2=new C3();
let LK={sunset:1,day:0,night:0};
function blendL(k){return LK.sunset*LIT.sunset[k]+LK.day*LIT.day[k]+LK.night*LIT.night[k]}
function blendC(k,out){out.setRGB(0,0,0);for(const p in LK){if(LK[p]>0){_c2.set(LIT[p][k]);out.r+=_c2.r*LK[p];out.g+=_c2.g*LK[p];out.b+=_c2.b*LK[p]}}return out}
const moonAzL=-38*D2R;
function applyLighting(dt){
  const ph=phaseNow();st.phase=ph;
  const k=dt>0?ease(1.6,dt):1;for(const p in LK)LK[p]+=((p===ph?1:0)-LK[p])*k;
  st.night=LK.night;st.day=LK.day;
  if(Ct.mode==="night"){Ct.mode="full";Ct.night=true}
  const el=blendL("el")*D2R,nk=LK.night;
  const a=nk>.5?moonAzL+YAW:SUN.lazL+YAW;
  const d=new V3(Math.cos(el)*Math.sin(a),Math.sin(el),Math.cos(el)*Math.cos(a));
  if(pi){pi.position.copy(d).multiplyScalar(40);if(pi.target){pi.target.position.set(0,-1,0);pi.target.updateMatrixWorld()}
    blendC("col",pi.color);pi.intensity=blendL("I");pi.castShadow=true;
    const sc=pi.shadow.camera;if(sc.right!==12.5){Object.assign(sc,{left:-12.5,right:12.5,top:12.5,bottom:-12.5,near:1,far:90});sc.updateProjectionMatrix()}
    pi.shadow.bias=-.0004;pi.shadow.normalBias=.025;pi.layers.enable(3)}
  if(dc){blendC("sky",dc.color);if(dc.groundColor)blendC("gnd",dc.groundColor);dc.intensity=blendL("hI");dc.layers.enable(3)}
  if(Cn){Cn.toneMappingExposure=blendL("exp");if(Cn.setClearColor)Cn.setClearColor(nk>.5?LIT.night.clear:ph==="day"?LIT.day.clear:LIT.sunset.clear,1);Cn.shadowMap.enabled=true}
  const mode=nk>.5?2:LK.day>.5?1:0;skyU.uMode.value=mode;skyU.uSunVis.value=mode<2?1:0;skyU.uExpo.value=Cn?Cn.toneMappingExposure:1;
  skyU.uCon.value=mode===0?1.1:1.06;
  const as=appSkyMesh(),see=mode===2&&!!as;skyU.uSeeThru.value=see?1:0;skyM.transparent=see;
  if(as){if(see){as.layers.enable(3);as.visible=true}else as.layers.disable(3)}
  if(jt&&mode===2){jt.top&&jt.top.value.set("#030814");jt.bot&&jt.bot.value.set("#0a1428");if(jt.uNight)jt.uNight.value=1;if(jt.uMoonVis)jt.uMoonVis.value=.95;if(jt.uStarF)jt.uStarF.value=1.6;if(jt.uSunVis)jt.uSunVis.value=0;if(jt.uGlowA)jt.uGlowA.value=0}
  [X.Dc,X.qc].forEach(o=>{if(o&&o.layers)o.traverse(c=>c.layers.disable(3))});
  if(Jt.fog){Jt.fog.near=400;Jt.fog.far=900}
  const g=gradeM.uniforms;g.uCon.value=blendL("con");g.uSat.value=blendL("sat");g.uRay.value=blendL("ray");g.uVig.value=blendL("vig");g.uLift.value=blendL("lift");
  g.uTint.value.set(0,0,0);for(const p in LK){const t=LIT[p].tint;g.uTint.value.x+=t[0]*LK[p];g.uTint.value.y+=t[1]*LK[p];g.uTint.value.z+=t[2]*LK[p]}
  g.uAsp.value=innerWidth/Math.max(1,innerHeight);
  sandU.uNight.value=nk;rockU.uNight.value=nk;
}
const _sp=new V3();
function sunScreen(){
  const a=sunAzW(),e=SKY_HOR+.035;skyU.uSunDir.value.set(Math.cos(e)*Math.sin(a),Math.sin(e),Math.cos(e)*Math.cos(a));
  _sp.copy(skyU.uSunDir.value).multiplyScalar(100).add(De.position).project(De);
  const inF=_sp.z<1&&Math.abs(_sp.x)<1.4&&Math.abs(_sp.y)<1.4;
  gradeM.uniforms.uSun.value.set(_sp.x*.5+.5,_sp.y*.5+.5);gradeM.uniforms.uSunOn.value=inF?1-ss(1,1.4,Math.max(Math.abs(_sp.x),Math.abs(_sp.y))):0}

function update(dt){
  if(!root.visible)return;
  if(st.lock){applyLighting(0);sunScreen();return}
  step(Math.min(dt,.05))}
function step(dt){
  dt*=st.ts;st.t+=dt;
  st.wn=Ue.uWind?Ue.uWind.value:(Ct.wind||.35);
  applyLighting(dt);
  skyDome.position.copy(De.position);
  sunScreen();
  for(const f of UPD)f(dt,st.t)}
/* ---------------- per-frame scene life ---------------- */
const _cl=new V3();
UPD.push((dt,t)=>{
  const wn=st.wn,nk=st.night;
  _cl.copy(De.position);W.worldToLocal(_cl);
  vegU.uT.value=t;vegU.uWind.value=.4+wn;propU.uT.value=t;propU.uWind.value=.4+wn;
  pondU.uT.value=t;pondU.uWind.value=wn;pondU.uNight.value=nk;pondU.uCamL.value.copy(_cl);
  {const d=pi.position.clone().normalize();d.applyAxisAngle(new V3(0,1,0),-YAW);pondU.uSunL.value.copy(d);pondU.uSunCol.value.copy(pi.color)}
  pondU.uSkyA.value.set(nk>.5?"#1a2440":st.day>.5?"#a8c4dc":"#d4aab8");pondU.uSkyB.value.set(nk>.5?"#0c1428":st.day>.5?"#5c88c0":"#7a6eb0");
  smokeU.uT.value=t;smokeU.uCamL.value.copy(_cl);smokeU.uCol.value.setRGB(mix(.9,.36,nk),mix(.86,.38,nk),mix(.82,.46,nk));
  SMOKE.forEach(m=>{m.material.uniforms.uT.value=t});
  fireU.uT.value=t;fireU.uNight.value=nk;
  if(fireL)fireL.intensity=(mix(.5,2.6,nk))*(1+.12*Math.sin(t*9)+.07*Math.sin(t*23));
  if(fireG.userData.charM)fireG.userData.charM.emissiveIntensity=mix(.25,.9,nk)*(1+.2*Math.sin(t*5));
  if(RACK.cloths)RACK.cloths.forEach((c,i)=>{c.rotation.x=Math.sin(t*1.6+c.userData.ph)*.06*(.4+wn)+.05*(.4+wn)});
  /* sand wisps */
  for(let i=0;i<SAND.n;i++){const q=SANDP[i];q.life+=dt/q.dur;
    if(q.life>=1){sandSeed(i,false);continue}
    q.x+=q.vx*dt*(.5+wn);q.z+=q.vz*dt*(.5+wn);q.y+=q.vy*dt;const g=hTop(q.x,q.z);if(q.y<g+.03)q.y=g+.03;
    q.vy+=(q.crest?-.08:-.02)*dt;
    const o=i*3;SAND.P[o]=q.x;SAND.P[o+1]=q.y;SAND.P[o+2]=q.z;
    SAND.A[i]=Math.sin(q.life*Math.PI)*(q.crest?.3:.16)*(.3+wn*1.4)*(1-nk*.6)*(1-ss(.86,.97,sN(q.x,q.z)))}
  SAND.g.attributes.position.needsUpdate=SAND.g.attributes.a.needsUpdate=true;SAND.m.uniforms.uH.value=innerHeight;
  SAND.m.uniforms.uC.value.set(nk>.5?"#6a7088":"#e8c690");
  /* fireflies */
  FF.o.visible=nk>.3;
  if(FF.o.visible){for(let i=0;i<FF.n;i++){const f=FFP[i],o=i*3;f.ph+=dt*f.sp;
    FF.P[o]=f.x+Math.sin(f.ph*1.3)*1.2;FF.P[o+1]=hTop(f.x,f.z)+f.y+Math.sin(f.ph*2.1)*.35;FF.P[o+2]=f.z+Math.cos(f.ph)*1.2;
    FF.A[i]=ss(.3,.8,nk)*Math.pow(Math.max(0,Math.sin(t*f.bl+f.ph*3)),3)*.9}
    FF.g.attributes.position.needsUpdate=FF.g.attributes.a.needsUpdate=true;FF.m.uniforms.uH.value=innerHeight}
  renderPondReflection();
});
/*@@NEXT@@*/

let _bloomSave=null;
const HIDE=[];
/* ---------------- animals: Tripo rigged camel / eagle / snake at real size ----------------
   camel_v3 native metres (2.8 m long) x1.15 -> ~3.2 m long, hump ~2.1 m (palm 13 m, tent 6 m long);
   eagle_v3 2.1 m span x.95 -> 2.0 m; perch model .85 m tall; snake_v3 1.22 m x1.1 -> 1.35 m. */
const ANIM={camels:[],eagle:null,snake:null};
const CAM_SC=1.15,CAM_V=.989*CAM_SC,EAG_SC=.95,PER_SC=1,SNK_SC=1.1,SNK_V=.425*SNK_SC;
const tl=(lx,lz)=>({x:TENT.x+Math.cos(TENT.yaw)*lx+Math.sin(TENT.yaw)*lz,z:TENT.z-Math.sin(TENT.yaw)*lx+Math.cos(TENT.yaw)*lz});
/* light comes from +x/-z (local azimuth SUN.lazL), so shade falls toward -x/+z of anything */
const SHADE={x:-Math.sin(SUN.lazL),z:-Math.cos(SUN.lazL)},SNK_HOME={x:1,z:12};

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
function play(r,name,fade,ts){const n=r.acts[name];if(!n)return;if(ts!=null)n.timeScale=ts;if(r.cur===name)return;
  n.reset();n.setEffectiveWeight(1);n.play();if(r.cur&&r.acts[r.cur]){r.acts[r.cur].crossFadeTo(n,fade,false)}else n.fadeIn(fade);r.cur=name}
function animalMats(o,tan){matsOf(o,m=>{cleanMat(m);m.roughness=Math.max(m.roughness||0,.75);
  /* Tripo's camel bakes a dark rust coat; keep its detail but shift it to a sun-faded dromedary tan */
  if(tan&&m.map){m.color.set("#ffffff");m.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace("#include <map_fragment>",`vec4 tx=texture2D(map,vMapUv);float l=dot(tx.rgb,vec3(.3,.59,.11));
    diffuseColor.rgb=min(vec3(.86,.66,.42)*(.42+2.*l),vec3(1.));`)};m.customProgramCacheKey=()=>"des44tan";m.needsUpdate=true}});o.traverse(c=>{if(c.isMesh){c.castShadow=true;c.receiveShadow=true;c.frustumCulled=false}})}
function groundFrame(x,z,yaw,L,Wd){
  const fx=Math.sin(yaw),fz=Math.cos(yaw),hf=hTop(x+fx*L,z+fz*L),hb=hTop(x-fx*L,z-fz*L),hc=hTop(x,z);
  const hl=hTop(x+fz*Wd,z-fx*Wd),hr=hTop(x-fz*Wd,z+fx*Wd);
  return{y:Math.max((hf+hb)*.5,hc-.12),pitch:-Math.atan2(hf-hb,2*L),roll:cl(Math.atan2(hl-hr,2*Wd),-.2,.2)}}

/* ---- camels ---- */
const REST=[{...tl(-3.9,4.4),yaw:TENT.yaw+Math.PI/2+.15},{x:7.2,z:-.6,yaw:-Math.PI/2-.35}];
const DRINK=(()=>{const th=BEACH[0],[x,z]=pondEdge(th,1),nx=Math.cos(th),nz=Math.sin(th);return{x:x+nx*2.05,z:z+nz*2.05,yaw:Math.atan2(-nx,-nz)}})();
/* kneel/lie: fold each leg segment about the camel's lateral axis (degrees, + swings the lower end back) */
const KNEEL=[["tripo0_Left_Limb_1",-72],["tripo0_Left_Limb_2",152],["tripo0_Right_Limb_1",-72],["tripo0_Right_Limb_2",152],
  ["tripo1_Left_Limb_0",-42],["tripo1_Left_Limb_1",132],["tripo1_Left_Limb_2",-152],["tripo1_Right_Limb_0",-42],["tripo1_Right_Limb_1",132],["tripo1_Right_Limb_2",-152]];
const LIE=[["tripoSpine_4",22],["tripoSpine_5",14],["tripoHead_0",-18]];
const _q1=new T.Quat(),_q2=new T.Quat(),_ax=new V3(),_lat=new V3();
function foldBones(a,list,k){
  a.g.getWorldQuaternion(_q1);_lat.set(1,0,0).applyQuaternion(_q1);
  for(const[n,deg]of list){const b=a.bones[n];if(!b||!b.parent)continue;b.parent.getWorldQuaternion(_q2);
    _ax.copy(_lat).applyQuaternion(_q2.invert()).normalize();_q1.setFromAxisAngle(_ax,deg*D2R*k);b.quaternion.premultiply(_q1)}}
function camelSpawn(sc,anims,i){
 const g=new T.Group(),inner=new T.Group();g.rotation.order="YXZ";
  const b=boxOf(sc);sc.position.y=-b.mn.y;inner.add(sc);inner.scale.setScalar(CAM_SC);g.add(inner);animalMats(g,1);W.add(g);onDes(g);
  const a={i,g,inner,sc,r:rigUp(sc,anims),bones:{},x:0,z:0,yaw:0,spd:0,k:0,lie:0,mode:"job",job:"idle",timer:rr(2,5),path:null,pi:0,face:null,stuck:0};
  sc.traverse(o=>{if(o.isBone)a.bones[o.name]=o});
  return a}
function camelGo(a,to,job){
  const g=navGrid("camel",1.05,1.12,.84),blk=ANIM.camels.filter(o=>o!==a&&o.spd<.05).map(o=>({x:o.x,z:o.z,r:2.6})),p=navPath(g,a.x,a.z,to.x,to.z,blk);
  if(!p){a.mode="job";a.job="idle";a.timer=rr(3,6);play(a.r,"idle",.6,1);return false}
  a.path=p;a.pi=1;a.face=to.yaw!=null?to.yaw:null;a.job=job;a.mode="walk";a.goal=to;return true}
const roomy=(a,x,z)=>ANIM.camels.every(o=>o===a||(Math.hypot(o.x-x,o.z-z)>5.5&&(!o.goal||Math.hypot(o.goal.x-x,o.goal.z-z)>5.5)));
function grazeSpot(a){const g=navGrid("camel",1.05,1.12,.84);
  for(let t=0;t<60;t++){const th=rr(-.5,1.9),k=rr(1.25,1.65),[x,z]=pondEdge(th,k);if(navFree(g,x,z)&&(!a||roomy(a,x,z)))return{x,z,yaw:Math.atan2(POND.x-x,POND.z-z)+rr(-1.3,1.3)}}
  return randFree(g,0,4,12)||{x:0,z:6}}
function camelPlan(a){
  if(st.phase==="night"){camelGo(a,REST[a.i],"kneel");return}
  const busy=j=>ANIM.camels.some(o=>o!==a&&o.job===j);const r=rnd();
  if(r<.3&&!busy("drink"))camelGo(a,DRINK,"drink");
  else if(r<.62)camelGo(a,grazeSpot(a),"graze");
  else if(r<.82&&!busy("kneel"))camelGo(a,REST[a.i],"kneel");
  else{const g=navGrid("camel",1.05,1.12,.84),p=randFree(g,0,2,20,(x,z)=>sN(x,z)<.72&&roomy(a,x,z));camelGo(a,p||REST[a.i],"idle")}}
function camelUpdate(a,dt){
  const night=st.phase==="night";
  if(night&&a.job!=="kneel"&&a.mode!=="up"){if(a.mode==="walk"||a.mode==="job"||a.mode==="turn")camelGo(a,REST[a.i],"kneel")}
  if(a.mode==="walk"){
    const wp=a.path[a.pi],dx=wp.x-a.x,dz=wp.z-a.z,d=Math.hypot(dx,dz),last=a.pi===a.path.length-1;
    if(d<(last?.12:.9)){if(last){a.mode="turn";a.spd=0}else a.pi++}
    else{const want=Math.atan2(dx,dz),dy=wrapA(want-a.yaw);a.yaw+=cl(dy,-.85*dt,.85*dt);
      let v=CAM_V*cl(1-Math.abs(dy)/1.1,.18,1)*(last?cl(d/2.2,.3,1):1);
      for(const o of ANIM.camels){if(o===a)continue;const ox=o.x-a.x,oz=o.z-a.z,fw=ox*Math.sin(a.yaw)+oz*Math.cos(a.yaw),lat=Math.abs(ox*Math.cos(a.yaw)-oz*Math.sin(a.yaw));if(fw>0&&fw<3.8&&lat<1.9)v=0}
      a.stuck=v<.05?a.stuck+dt:0;if(a.stuck>5){a.stuck=0;camelPlan(a)}
      a.spd+=(v-a.spd)*ease(3,dt);a.x+=Math.sin(a.yaw)*a.spd*dt;a.z+=Math.cos(a.yaw)*a.spd*dt;
      play(a.r,"walk",.45,Math.max(.2,a.spd/CAM_V))}}
  else if(a.mode==="turn"){
    const dy=a.face==null?0:wrapA(a.face-a.yaw);a.yaw+=cl(dy,-.6*dt,.6*dt);
    if(Math.abs(dy)<.03){a.mode="job";
      if(a.job==="drink"){a.timer=14;play(a.r,"drink",.8,1)}
      else if(a.job==="graze"){a.timer=rr(9,18);play(a.r,"graze",.8,1)}
      else if(a.job==="kneel"){a.mode="down";play(a.r,"idle",.8,.6)}
      else{a.timer=rr(4,9);play(a.r,"idle",.8,1)}}
    else play(a.r,"walk",.45,.3)}
  else if(a.mode==="down"){a.k=Math.min(1,a.k+dt/3.4);if(a.k>=1){a.mode="rest";a.timer=rr(30,55)}}
  else if(a.mode==="rest"){if(!night){a.timer-=dt;if(a.timer<0){a.mode="up";play(a.r,"idle",.6,.8)}}}
  else if(a.mode==="up"){a.k=Math.max(0,a.k-dt/2.8);if(a.k<=0){a.job="idle";camelPlan(a)}}
  else if(a.mode==="job"){a.timer-=dt;if(a.timer<0)camelPlan(a)}
  a.lie+=((night&&a.mode==="rest"?1:0)-a.lie)*ease(.5,dt);
  const f=groundFrame(a.x,a.z,a.yaw,1.25,.45),kk=a.k,kf=ss(0,.55,kk),kh=ss(.35,1,kk);
  a.g.position.set(a.x,f.y,a.z);a.g.rotation.set(f.pitch*(1-.5*kk)+(kf-kh)*.2,a.yaw,f.roll*(1-.5*kk));
  a.inner.position.y=-(.62*kf*.5+.62*kh*.5)*CAM_SC-.05*kk;
  a.r.mx.update(dt);
  if(kk>.001||a.lie>.001){a.g.updateMatrixWorld(true);
    if(kk>.001){foldBones(a,KNEEL.slice(0,4),kf);foldBones(a,KNEEL.slice(4),kh)}
    if(a.lie>.001)foldBones(a,LIE,a.lie)}}

/* ---- eagle: soars in a thermal, lands on the saguaro top or at the west beach ---- */
const _e0=new V3(),_e1=new V3(),_t0=new V3(),_t1=new V3(),_ev=new V3();
function herm(p0,m0,p1,m1,t,out){const t2=t*t,t3=t2*t;return out.set(0,0,0).addScaledVector(p0,2*t3-3*t2+1).addScaledVector(m0,t3-2*t2+t).addScaledVector(p1,-2*t3+3*t2).addScaledVector(m1,t3-t2)}
function eagleSpots(){
  const sp=[];if(PROPS.sagTop)sp.push({k:"sag",p:PROPS.sagTop.clone(),yaw:SAG[0].ry+2.2});
  const th=BEACH[1],[x,z]=pondEdge(th,1.06);sp.push({k:"pond",p:new V3(x,hTop(x,z),z),yaw:Math.atan2(POND.x-x,POND.z-z)});return sp}
function eagleSpawn(fly,fa,per,pa){
  const fg=new T.Group(),pg=new T.Group();fg.rotation.order=pg.rotation.order="YXZ";
  const fb=boxOf(fly);fly.position.y=0;const fi=new T.Group();fi.add(fly);fi.scale.setScalar(EAG_SC);fg.add(fi);
  const pb=boxOf(per);per.position.y=-pb.mn.y;const pi_=new T.Group();pi_.add(per);pi_.scale.setScalar(PER_SC);pg.add(pi_);
  animalMats(fg);animalMats(pg);W.add(fg);W.add(pg);onDes(fg);onDes(pg);
  const e={fg,pg,fr:rigUp(fly,fa),pr:rigUp(per,pa),footY:-fb.mn.y*EAG_SC,mode:"perch",spot:null,timer:rr(14,22),
    th:rnd()*TAU,c:new V3(2,0,-1),R:15,alt:17.5,pos:new V3(),vel:new V3(),bank:0,seg:null,flapT:rr(6,12),cry:0};
  return e}
function eaglePerchAt(e,spot){e.mode="perch";e.spot=spot;e.fg.visible=false;e.pg.visible=true;
  e.pg.position.copy(spot.p);e.pg.rotation.set(0,spot.yaw,0);e.pos.copy(spot.p);
  play(e.pr,spot.k==="pond"?"drink":"perch_idle",.4,st.phase==="night"?.35:1);e.timer=spot.k==="pond"?14:rr(16,26)}
function soarPoint(th,out){return out.set(e_c().x+Math.cos(th)*ANIM.eagle.R,ANIM.eagle.alt+1.6*Math.sin(st.t*.21),e_c().z+Math.sin(th)*ANIM.eagle.R)}
function e_c(){return ANIM.eagle.c}
function eagleTakeoff(e){
  const sp=e.spot;e.mode="takeoff";e.pg.visible=false;e.fg.visible=true;
  const p0=sp.p.clone().add(new V3(0,e.footY,0)),fw=new V3(Math.sin(sp.yaw),0,Math.cos(sp.yaw));
  e.th=Math.atan2(p0.z-e.c.z,p0.x-e.c.x)+.9;const p1=soarPoint(e.th,new V3());
  const tg=new V3(-Math.sin(e.th),0,Math.cos(e.th)).multiplyScalar(8);
  e.seg={p0,m0:fw.multiplyScalar(5).add(new V3(0,9,0)),p1,m1:tg.multiplyScalar(7),T:6.5,t:0,land:false};
  play(e.fr,"take_off",.15,1);e.cry=1}
function eagleLand(e,spot){
  e.mode="land";e.spot=spot;const p1=spot.p.clone().add(new V3(0,e.footY,0));
  const p0=e.pos.clone(),dir=new V3(p1.x-p0.x,0,p1.z-p0.z);const dist=p0.distanceTo(p1);dir.normalize();
  spot.yaw=Math.atan2(dir.x,dir.z);
  e.seg={p0,m0:e.vel.clone().multiplyScalar(Math.max(2.5,dist/7)),p1,m1:dir.multiplyScalar(dist*.35).add(new V3(0,-1.2,0)),T:cl(dist/6.5,3.2,9),t:0,land:true};
  play(e.fr,"glide",.5,1)}
function eagleUpdate(e,dt){
  const ph=st.phase,wantPerch=ph!=="day";
  if(e.mode==="perch"){
    if(e.pr.acts.perch_idle)e.pr.acts.perch_idle.timeScale=ph==="night"?.35:1;
    if(wantPerch){if(e.spot.k!=="sag"){e.timer-=dt;if(e.timer<0)eagleTakeoff(e)}}
    else{e.timer-=dt;if(e.timer<0)eagleTakeoff(e)}
    e.pr.mx.update(dt);return}
  if(e.mode==="soar"){
    const v=8.5;e.th+=v/e.R*dt;const p=soarPoint(e.th,_e0);e.vel.copy(p).sub(e.pos).divideScalar(Math.max(dt,1e-3));e.pos.copy(p);
    e.bank+=(-Math.atan(v*v/(e.R*9.8))-e.bank)*ease(2,dt);
    e.flapT-=dt;if(e.flapT<0){play(e.fr,"flap",.3,1);if(e.flapT<-2.4){e.flapT=rr(8,15);play(e.fr,"glide",.6,1)}}
    e.timer-=dt;if(wantPerch||e.timer<0){const sp=eagleSpots();const s=wantPerch?sp[0]:(rnd()<.62||sp.length<2?sp[0]:sp[1]);if(s)eagleLand(e,s);e.timer=rr(28,45)}}
  else{const s=e.seg;s.t+=dt/s.T;const t=Math.min(1,s.t);herm(s.p0,s.m0,s.p1,s.m1,t,_e0);
    e.vel.copy(_e0).sub(e.pos).divideScalar(Math.max(dt,1e-3));e.pos.copy(_e0);e.bank+=(0-e.bank)*ease(2,dt);
    if(s.land&&(1-t)*s.T<2&&e.fr.cur!=="landing_flare")play(e.fr,"landing_flare",.25,1);
    if(!s.land){if(s.t*s.T>1.7&&e.fr.cur==="take_off")play(e.fr,"flap",.3,1);if(s.t*s.T>3.6&&e.fr.cur==="flap")play(e.fr,"glide",.6,1)}
    if(t>=1){if(s.land)eaglePerchAt(e,e.spot);else{e.mode="soar";e.timer=wantPerch?0:rr(25,40)}}}
  if(e.mode!=="perch"){const hv=Math.hypot(e.vel.x,e.vel.z);
    const yaw=hv>.3?Math.atan2(e.vel.x,e.vel.z):e.fg.rotation.y,pit=hv>.3?cl(-Math.atan2(e.vel.y,hv),-.5,.5):0;
    e.fg.position.copy(e.pos);e.fg.rotation.set(pit*.6,yaw,e.bank);e.fr.mx.update(dt)}}

/* ---- snake: coiled in shade by day; slithers by dusk and night, never into the water ---- */
function snakeShadeSpot(){
  const g=navGrid("snake",.32,1.3,.82);let best=null;
  for(const o of OBST){if(o.k!=="rock"||o.r<.6)continue;const x=o.x+SHADE.x*(o.r+.42),z=o.z+SHADE.z*(o.r+.42);
    if(!navFree(g,x,z))continue;const sc=-Math.hypot(x-SNK_HOME.x,z-SNK_HOME.z)*.12+o.r;if(!best||sc>best.sc)best={x,z,sc,yaw:Math.atan2(SHADE.x,SHADE.z)+2}}
  return best||{x:-2,z:12,yaw:0}}
function snakeSpawn(proto,anims){
  const g=new T.Group(),inner=new T.Group();g.rotation.order="YXZ";const b=boxOf(proto);proto.position.y=-b.mn.y;
  inner.add(proto);inner.scale.setScalar(SNK_SC);g.add(inner);animalMats(g);W.add(g);onDes(g);
  return{g,r:rigUp(proto,anims),x:0,z:0,yaw:0,spd:0,mode:"idle",path:null,pi:0,timer:0,coil:0}}
function snakeGo(s,to,mode){const g=navGrid("snake",.32,1.3,.82),p=navPath(g,s.x,s.z,to.x,to.z);if(!p)return false;s.path=p;s.pi=1;s.mode=mode;s.goal=to;return true}
function snakeUpdate(s,dt){
  const day=st.phase==="day";
  if(day&&s.mode!=="toShade"&&s.mode!=="coiled"){const sp=snakeShadeSpot();if(!snakeGo(s,sp,"toShade")){s.x=sp.x;s.z=sp.z;s.mode="coiled"}}
  if(!day&&(s.mode==="coiled"||s.mode==="toShade")){s.mode="idle";s.timer=rr(.5,2)}
  if(s.mode==="idle"){s.timer-=dt;play(s.r,"slither",.6,.12);s.spd=0;
    if(s.timer<0){const g=navGrid("snake",.32,1.3,.82),p=randFree(g,SNK_HOME.x,SNK_HOME.z,9,(x,z)=>Math.hypot(x-s.x,z-s.z)>3);if(!p||!snakeGo(s,p,"go"))s.timer=1}}
  else if(s.mode==="go"||s.mode==="toShade"){
    const wp=s.path[s.pi],dx=wp.x-s.x,dz=wp.z-s.z,d=Math.hypot(dx,dz),last=s.pi===s.path.length-1;
    if(d<(last?.08:.45)){if(last){if(s.mode==="toShade"){s.mode="coiled";play(s.r,"idle_coiled",1.2,1)}else{s.mode="idle";s.timer=rr(1.5,5)}}else s.pi++}
    else{const want=Math.atan2(dx,dz),dy=wrapA(want-s.yaw);s.yaw+=cl(dy,-1.5*dt,1.5*dt);const v=SNK_V*cl(1-Math.abs(dy)/1.6,.25,1);
      s.spd+=(v-s.spd)*ease(4,dt);s.x+=Math.sin(s.yaw)*s.spd*dt;s.z+=Math.cos(s.yaw)*s.spd*dt;play(s.r,"slither",.5,Math.max(.15,s.spd/SNK_V))}}
  else if(s.mode==="coiled"){s.spd=0;if(s.r.cur!=="idle_coiled")play(s.r,"idle_coiled",1.2,1)}
  const f=groundFrame(s.x,s.z,s.yaw,.5,.15);s.g.position.set(s.x,f.y-.01,s.z);s.g.rotation.set(f.pitch,s.yaw,f.roll);
  s.r.mx.update(dt)}

/* ---- dust devil: a slender sand whirl that wanders across the open sand now and then (day / sunset) ---- */
const DEV=softPoints(MOB?140:260,"#e4bf88",.2,false);DEV.o.renderOrder=6;W.add(DEV.o);
const DV={on:0,life:0,dur:14,x:12,z:6,vx:-.6,vz:.25,wait:rr(6,14),P:[]};
for(let i=0;i<DEV.n;i++){DV.P.push({h:rnd(),a:rnd()*TAU,w:rr(1.6,3.2),r0:rr(.6,1.2)});DEV.Z[i]=rr(.5,1.3)}
function devilUpdate(dt,t){
  if(!DV.on){DV.wait-=dt;if(DV.wait<0&&st.phase!=="night"){const g=navGrid("snake",.32,1.3,.82),p=randFree(g,8,4,14,(x,z)=>pN(x,z)>2.2);
      if(p){DV.on=1;DV.life=0;DV.x=p.x;DV.z=p.z;const a=rnd()*TAU;DV.vx=Math.cos(a)*.7;DV.vz=Math.sin(a)*.7}else DV.wait=3}}
  let amp=0;
  if(DV.on){DV.life+=dt/DV.dur;amp=ss(0,.15,DV.life)*(1-ss(.75,1,DV.life))*(st.phase==="night"?0:1);
    DV.x+=DV.vx*dt;DV.z+=DV.vz*dt;const nx=DV.x+DV.vx*2,nz=DV.z+DV.vz*2;
    if(sN(nx,nz)>.8||pN(nx,nz)<1.8||!clearOf(nx,nz,.5)){const a=Math.atan2(DV.vz,DV.vx)+rr(1.6,2.6);DV.vx=Math.cos(a)*.7;DV.vz=Math.sin(a)*.7}
    if(DV.life>=1){DV.on=0;DV.wait=rr(18,34)}}
  DEV.o.visible=amp>.01;if(!DEV.o.visible)return;
  const H=7.5,gy=hTop(DV.x,DV.z);
  for(let i=0;i<DEV.n;i++){const q=DV.P[i];q.h+=dt*.1;if(q.h>1)q.h-=1;q.a+=dt*q.w*(1.4-q.h*.6);
    const h=q.h,r=q.r0*(.25+1.6*h*h)+.08,lean=h*h*1.6,o=i*3;
    DEV.P[o]=DV.x+Math.cos(q.a)*r+WIND.x*lean;DEV.P[o+1]=gy+h*H;DEV.P[o+2]=DV.z+Math.sin(q.a)*r+WIND.z*lean;
    DEV.A[i]=amp*.32*(1-h)*ss(0,.08,h)*(.5+.5*Math.sin(q.a*3+i))}
  DEV.g.attributes.position.needsUpdate=DEV.g.attributes.a.needsUpdate=true;DEV.m.uniforms.uH.value=innerHeight}

/* ---- audio through the site's shared context (unlocked by the tap-to-start gesture) ---- */
const AU={ctx:null,master:null,wind:null,fire:null,ready:false,eagleT:4,rustleT:0};
function SX(){return window.__sndX||null}
function ensureAudio(){
  const x=SX();if(!x||!x.s)return null;const ctx=x.s;
  if(!AU.ready){AU.ctx=ctx;AU.master=ctx.createGain();AU.master.gain.value=0;AU.master.connect(ctx.destination);
    const buf=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate),d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*.35;
    const src=ctx.createBufferSource();src.buffer=buf;src.loop=true;const bp=ctx.createBiquadFilter();bp.type="bandpass";bp.frequency.value=380;bp.Q.value=.7;
    const g=ctx.createGain();g.gain.value=0;src.connect(bp);bp.connect(g);g.connect(AU.master);src.start();AU.wind={bp,g};
    const fb=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate),fd=fb.getChannelData(0);for(let i=0;i<fd.length;i++)fd[i]=(Math.random()*2-1)*Math.pow(Math.random(),8);
    const fs=ctx.createBufferSource();fs.buffer=fb;fs.loop=true;const fg=ctx.createGain();fg.gain.value=0;
    const ff=ctx.createBiquadFilter();ff.type="highpass";ff.frequency.value=800;fs.connect(ff);ff.connect(fg);fg.connect(AU.master);fs.start();AU.fire={g:fg};AU.ready=true}
  return AU}
function eagleCry(){const A=ensureAudio();if(!A)return;const ctx=A.ctx,now=ctx.currentTime;
  const o=ctx.createOscillator(),o2=ctx.createOscillator(),g=ctx.createGain(),f=ctx.createBiquadFilter();
  o.type="sawtooth";o2.type="triangle";f.type="bandpass";f.frequency.value=1750;f.Q.value=4;
  o.frequency.setValueAtTime(1400,now);o.frequency.exponentialRampToValueAtTime(700,now+.5);
  o2.frequency.setValueAtTime(950,now);o2.frequency.exponentialRampToValueAtTime(460,now+.5);
  g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(.09,now+.03);g.gain.exponentialRampToValueAtTime(.001,now+.65);
  o.connect(f);o2.connect(f);f.connect(g);g.connect(A.master);o.start(now);o2.start(now);o.stop(now+.7);o2.stop(now+.7)}
function sandRustle(v){const A=ensureAudio();if(!A)return;const ctx=A.ctx,now=ctx.currentTime;
  const n=ctx.createBuffer(1,ctx.sampleRate*.07|0,ctx.sampleRate),d=n.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.exp(-i/d.length*3);
  const s=ctx.createBufferSource();s.buffer=n;const f=ctx.createBiquadFilter();f.type="bandpass";f.frequency.value=2100;f.Q.value=1.2;
  const g=ctx.createGain();g.gain.value=v;s.connect(f);f.connect(g);g.connect(A.master);s.start(now)}
HIDE.push(on=>{if(!on&&AU.master&&AU.ctx)AU.master.gain.setTargetAtTime(0,AU.ctx.currentTime,.25)});

/* ---- load + per-frame ---- */
const animalsReady=propsReady.then(()=>Promise.all([
  glb("camel_v3").then(({scene,animations})=>{const s2=VT.cloneSkinned(scene),c0=camelSpawn(scene,animations,0),c1=camelSpawn(s2,animations,1);ANIM.camels.push(c0,c1);
    Object.assign(c1,{x:REST[1].x,z:REST[1].z,yaw:REST[1].yaw,mode:"rest",job:"kneel",k:1,timer:rr(20,40),goal:REST[1]});play(c1.r,"idle",.01,.6);
    const gs=grazeSpot(c0);Object.assign(c0,{x:gs.x,z:gs.z,yaw:gs.yaw,mode:"job",job:"graze",timer:rr(8,14)});play(c0.r,"graze",.01,1)}).catch(()=>{}),
  Promise.all([glb("eagle_v3"),glb("eagle_perch_v2")]).then(([f,p])=>{const e=eagleSpawn(f.scene,f.animations,p.scene,p.animations);ANIM.eagle=e;
    const sp=eagleSpots();if(sp[0])eaglePerchAt(e,sp[0]);else{e.mode="soar";e.fg.visible=true;e.pg.visible=false}}).catch(()=>{}),
  glb("snake_v3").then(({scene,animations})=>{const s=snakeSpawn(scene,animations);ANIM.snake=s;
    const sp=randFree(navGrid("snake",.32,1.3,.82),SNK_HOME.x,SNK_HOME.z,3)||SNK_HOME;Object.assign(s,{x:sp.x,z:sp.z,yaw:-.8,mode:"idle",timer:rr(1,3)});play(s.r,"slither",.01,.12)}).catch(()=>{})]));
UPD.push((dt,t)=>{
  if(dt<=0)return;const d=Math.min(dt,.1);
  ANIM.camels.forEach(a=>camelUpdate(a,d));
  if(ANIM.eagle)eagleUpdate(ANIM.eagle,d);
  if(ANIM.snake)snakeUpdate(ANIM.snake,d);
  devilUpdate(d,t);
  const A=AU.ready?AU:(SX()&&SX().on?ensureAudio():null);
  if(A){const now=A.ctx.currentTime,x=SX(),on=root.visible&&x&&x.on;
    A.master.gain.setTargetAtTime(on?.7:0,now,.3);
    A.wind.g.gain.setTargetAtTime(.025+st.wn*.1,now,.3);A.wind.bp.frequency.setTargetAtTime(250+st.wn*650,now,.4);
    A.fire.g.gain.setTargetAtTime(mix(.012,.045,st.night),now,.4);
    if(on){const e=ANIM.eagle;AU.eagleT-=d;if(e&&(e.cry||(e.mode==="soar"&&AU.eagleT<=0&&rnd()<.01))){eagleCry();e.cry=0;AU.eagleT=rr(8,18)}
      const s=ANIM.snake;AU.rustleT-=d;if(s&&s.spd>.1&&AU.rustleT<=0){sandRustle(.012);AU.rustleT=.14}
      if(DV.on&&AU.rustleT<=0&&rnd()<.3){sandRustle(.008);AU.rustleT=.1}}}
});

function show(on){
  root.visible=on;De.layers.set(on?3:0);window.__desA=on;grade.enabled=on;
  if(bloom){if(on){if(!_bloomSave)_bloomSave={t:bloom.threshold,s:bloom.strength,r:bloom.radius};bloom.threshold=.9;bloom.strength=.2;bloom.radius=.45}
    else if(_bloomSave){bloom.threshold=_bloomSave.t;bloom.strength=_bloomSave.s;bloom.radius=_bloomSave.r;_bloomSave=null}}
  if(on){if(Ct.mode==="manual"&&!Ct.night)Ct.mode="sunset";if(Ct.mode==="night"){Ct.mode="full";Ct.night=true}applyLighting(0)}
  else{const as=appSkyMesh();if(as)as.layers.disable(3)}
  HIDE.forEach(f=>f(on));
}
onDes(root);
window.__desShow=show;window.__desU=update;
window.__desQA=()=>QA;
const QA={st,W,S,YAW,hTop,toW,FIRE,TENT,PALMS,SAG,POND,
  freeze(on){st.lock=!!on},
  step(n,dt){for(let i=0;i<(n||1);i++)step(dt||1/30)},
  tod(p){st.tod=p||null;const ph=phaseNow();for(const k in LK)LK[k]=k===ph?1:0;applyLighting(0)},
  /* camera helpers in island metres */
  lookAt(px,py,pz,tx,ty,tz){De.position.copy(toW(px,py,pz));const t=toW(tx,ty,tz);if(Ce){Ce.target.copy(t);Ce.update()}De.lookAt(t)},
  Cn,pi,dc,ready:false,OBST,PROPS,glb,ANIM,DV,REST,DRINK,navGrid,navPath,NAV};
animalsReady.then(()=>{QA.ready=true});
window.__desReady=true;
}
})();
