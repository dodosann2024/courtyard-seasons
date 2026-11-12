/* 沙漠绿洲 · Desert Oasis (desert3) — flat plateau, golden sand, thick cliffs.
   Lazy-loaded on camera layer 3; yards + sea never see this content. */
(()=>{
window.__desInit=getX=>{
const X=getX(),T=X.T,{Jt,De,Cn,Ta,Ue,Ct,qt,jt,pi,dc}=X,MOB=!!X.kn;
const V3=T.V3,C3=T.Color,TAU=Math.PI*2,R=9.4,L3=8;
let sd=20261112;const rnd=()=>{sd|=0;sd=sd+0x6D2B79F5|0;let t=Math.imul(sd^sd>>>15,1|sd);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const rr=(a,b)=>a+(b-a)*rnd(),cl=(x,a,b)=>x<a?a:x>b?b:x;
const ss=(a,b,x)=>{const t=cl((x-a)/(b-a),0,1);return t*t*(3-2*t)};
const ease=(k,dt)=>1-Math.exp(-dt*k);
const mix=(a,b,t)=>a+(b-a)*t;
const root=new T.Group();root.visible=false;Jt.add(root);
const onDes=o=>{o.traverse(c=>{c.layers.mask=1|L3})};
const M=(p,o)=>{const m=X.Wt(p,o||{snow:0,wet:0});return m};

/* ---------------- Tripo GLB (self-hosted GLTFLoader) + procedural fallback ---------------- */
const MODEL={camel:"assets/models/camel.glb",eagle:"assets/models/eagle.glb",eagle_perch:"assets/models/eagle_perch.glb",snake:"assets/models/snake.glb",tent:"assets/models/tent.glb",palm:"assets/models/palm.glb",cactus:"assets/models/cactus.glb"};
/* Fit in metres: camel a bit under palm scale, eagle by height, snake by footprint */
const MODEL_FIT={camel:1.08,eagle:.68,eagle_perch:.52,snake:.55,tent:1.5,palm:2.9,cactus:1.2};
let _man=null,_gltfMod=null;
function modelsManifest(){if(_man)return _man;const url=((window.CY&&CY.root)||"")+"assets/models/manifest.json";
 _man=fetch(url).then(r=>r.ok?r.json():{}).catch(()=>({}));return _man}
function gltfMod(){if(_gltfMod)return _gltfMod;const url=new URL(((window.CY&&CY.root)||"")+"assets/vendor/des-gltf.js",location.href).href;
 _gltfMod=import(url);return _gltfMod}
function worldBox(scene){
  const box={min:[1e9,1e9,1e9],max:[-1e9,-1e9,-1e9]};
  scene.updateMatrixWorld(true);
  scene.traverse(o=>{if(!o.isMesh||!o.geometry)return;const g=o.geometry;if(!g.boundingBox)g.computeBoundingBox();const b=g.boundingBox;if(!b)return;
    for(let i=0;i<2;i++)for(let j=0;j<2;j++)for(let k=0;k<2;k++){
      const p=new V3(i?b.max.x:b.min.x,j?b.max.y:b.min.y,k?b.max.z:b.min.z);o.localToWorld(p);
      if(!Number.isFinite(p.x+p.y+p.z))continue;
      box.min[0]=Math.min(box.min[0],p.x);box.min[1]=Math.min(box.min[1],p.y);box.min[2]=Math.min(box.min[2],p.z);
      box.max[0]=Math.max(box.max[0],p.x);box.max[1]=Math.max(box.max[1],p.y);box.max[2]=Math.max(box.max[2],p.z)}});
  return box}
function fitGLB(scene,key){
  const box=worldBox(scene);
  const sx=Math.max(1e-3,box.max[0]-box.min[0]),sy=Math.max(1e-3,box.max[1]-box.min[1]),sz=Math.max(1e-3,box.max[2]-box.min[2]);
  const target=MODEL_FIT[key]||1;
  const span=key==="snake"?Math.max(sx,sz):key==="eagle"?Math.max(sx,sy*.85):sy;
  const wrap=new T.Group();wrap.add(scene);
  scene.position.set(-(box.min[0]+box.max[0])*.5,-box.min[1],-(box.min[2]+box.max[2])*.5);
  const sc=target/Math.max(1e-3,span);
  wrap.scale.setScalar(Number.isFinite(sc)?sc:1);wrap.userData.fitKey=key;return wrap}
function loadGLB(url,key){
  return gltfMod().then(m=>m.loadGLB(url)).then(({scene,animations})=>{
    if(!scene)throw 0;scene.userData.anims=animations||[];return fitGLB(scene,key)})}
function tryModel(rel,procedural){
  const key=(rel.split("/").pop()||"").replace(/\.glb$/,"");
  return modelsManifest().then(man=>{
    if(!man||!man[key])return {root:procedural(),src:"procedural"};
    const url=((window.CY&&CY.root)||"")+rel;
    return loadGLB(url,key).then(g=>({root:g,src:"glb",key})).catch(()=>({root:procedural(),src:"procedural"}))
  }).catch(()=>({root:procedural(),src:"procedural"}))}
function adoptGLB(host,glb){
  if(!host||!glb)return;
  host.children.slice().forEach(ch=>{ch.visible=false});
  glb.visible=true;host.add(glb);host.userData.glb=glb;host.userData.useGlb=1;onDes(glb)}

/* Vertex-shader deformation for static Tripo meshes (no rig). Uniforms live on host.userData.deform */
function meshLocalBounds(root){
  let minX=1e9,minY=1e9,minZ=1e9,maxX=-1e9,maxY=-1e9,maxZ=-1e9;
  root.traverse(o=>{if(!o.isMesh||!o.geometry)return;const g=o.geometry;if(!g.boundingBox)g.computeBoundingBox();const b=g.boundingBox;if(!b)return;
    minX=Math.min(minX,b.min.x);minY=Math.min(minY,b.min.y);minZ=Math.min(minZ,b.min.z);
    maxX=Math.max(maxX,b.max.x);maxY=Math.max(maxY,b.max.y);maxZ=Math.max(maxZ,b.max.z)});
  if(!(maxY>minY)){minX=minY=minZ=-.5;maxX=maxY=maxZ=.5}
  return {minX,minY,minZ,maxX,maxY,maxZ,h:Math.max(1e-3,maxY-minY),sx:Math.max(1e-3,maxX-minX),sz:Math.max(1e-3,maxZ-minZ)}}
function patchDeform(root,kind,U){
  const b=meshLocalBounds(root);
  const y0=b.minY,ih=1/b.h,ix=1/b.sx,iz=1/b.sz;
  root.traverse(o=>{
    if(!o.isMesh||!o.material)return;
    const mats=Array.isArray(o.material)?o.material:[o.material];
    mats.forEach(mat=>{
      if(!mat||mat.userData&&mat.userData.desDef)return;
      mat.userData=mat.userData||{};mat.userData.desDef=kind;
      const prev=mat.onBeforeCompile;
      mat.onBeforeCompile=(sh)=>{
        try{if(typeof prev==="function")prev(sh)}catch(_){}
        Object.assign(sh.uniforms,U);
        sh.vertexShader=sh.vertexShader
          .replace("#include <common>",`#include <common>
uniform float uStep,uNeck,uBob,uChew,uFlap,uBank,uSine,uAmp,uPhase;
`)
          .replace("#include <begin_vertex>",`#include <begin_vertex>
{
  float yn=clamp((transformed.y-(${y0.toFixed(5)}))*${ih.toFixed(6)},0.,1.);
  float xn=transformed.x*${ix.toFixed(6)};
  float zn=transformed.z*${iz.toFixed(6)};
  ${kind==="camel"?`
  float foot=smoothstep(0.02,0.18,yn);
  float knee=smoothstep(0.12,0.42,yn)*(1.-smoothstep(0.48,0.72,yn));
  float side=sign(transformed.x+1e-5);
  float fore=smoothstep(-.15,.25,zn);
  float hind=1.-fore;
  float pace=uStep+(side>0.?0.:3.14159);
  float swing=sin(pace)*.55*foot;
  transformed.z+=swing*knee*.22;
  transformed.y+=abs(swing)*knee*.06+uBob*yn*(1.-foot*.3);
  float neckW=smoothstep(.45,.78,yn)*smoothstep(-.05,.55,zn);
  float nd=uNeck*neckW;
  float ca=cos(nd*1.15),sa=sin(nd*1.15);
  vec3 np=transformed;
  np.y-=.55;float ry=np.y*ca-np.z*sa;float rz=np.y*sa+np.z*ca;np.y=ry+.55;np.z=rz;
  transformed=mix(transformed,np,neckW);
  float headW=smoothstep(.72,.92,yn)*smoothstep(.2,.7,zn);
  transformed.y+=sin(uChew)*headW*.012;
  `:kind==="eagle"?`
  float wing=smoothstep(.08,.55,abs(xn));
  float flap=sin(uFlap)*wing*(.55+.45*smoothstep(.3,.9,abs(xn)));
  transformed.y+=flap*.28*sign(transformed.y+.15);
  transformed.z+=flap*.04*wing;
  float bank=uBank*xn*.35;
  transformed.y+=bank;transformed.x+=uBank*yn*.05;
  `:kind==="snake"?`
  float along=atan(transformed.z+1e-4,transformed.x+1e-4);
  float rad=length(transformed.xz);
  float wave=sin(along*3.2-uPhase)*uAmp*smoothstep(.02,.2,rad);
  float nx=cos(along),nz=sin(along);
  transformed.x+=(-nz)*wave;transformed.z+=nx*wave;
  transformed.y+=abs(sin(along*1.6-uPhase*.7))*uAmp*.15;
  `:``}
}
`);
      };
      mat.customProgramCacheKey=()=>"desDef_"+kind+"_v2";
      mat.needsUpdate=true;
    });
  });
  return b}
function makeDeformU(kind){
  const U={uStep:{value:0},uNeck:{value:0},uBob:{value:0},uChew:{value:0},uFlap:{value:0},uBank:{value:0},uSine:{value:0},uAmp:{value:0},uPhase:{value:0}};
  return U}
function setDef(host,k,v){const U=host&&host.userData&&host.userData.deform;if(U&&U[k]){const n=+v;U[k].value=Number.isFinite(n)?n:0}}

function canvasTex(S,fn,opts){
  const c=document.createElement("canvas");c.width=c.height=S;const g=c.getContext("2d");
  const id=g.createImageData(S,S),d=id.data;for(let y=0;y<S;y++)for(let x=0;x<S;x++){const o=(y*S+x)*4,v=fn(x,y,S);d[o]=v[0];d[o+1]=v[1];d[o+2]=v[2];d[o+3]=255}
  g.putImageData(id,0,0);const t=new T.CTex(c);t.colorSpace="srgb";t.wrapS=t.wrapT=1000;t.anisotropy=MOB?4:8;
  if(opts&&opts.repeat)t.repeat.set(opts.repeat[0],opts.repeat[1]);return t}

/* ---------------- flat plateau + gentle dunes + one low crescent behind tent ---------------- */
const lakeC={x:-2.1,z:.35},lakeR=2.35;
const tentAnchor={x:2.1,z:-1.85};
function rimR(th){
  const c=Math.cos(th),s=Math.sin(th);
  const sq=Math.pow(Math.abs(c),1.22)+Math.pow(Math.abs(s),1.22);
  return R*(.91+.06*Math.sin(th*2.1+.3)+.035*Math.sin(th*4.6-1)+.025*Math.sin(th*7))*(.76+.24/Math.max(.52,Math.pow(sq,.42)))}
function hNoise(x,z){
  return .12*Math.sin(x*.28+.5)*Math.cos(z*.24-1)
       +.08*Math.sin(x*.62-z*.38+1.4)
       +.045*Math.sin(x*1.2+z*.95)
       +.02*Math.sin(x*2.4-z*1.8)}
function hAt(x,z){
  const th=Math.atan2(z,x),r=Math.hypot(x,z),Rth=rimR(th),edge=ss(Rth*.68,Rth,r);
  let h=.18+hNoise(x,z);
  /* ONE long low crescent dune behind the tent (gentle — not a mountain) */
  const cx=tentAnchor.x+.4,cz=tentAnchor.z-1.1;
  const dx=x-cx,dz=z-cz;
  const along=dx*.82+dz*.35,across=-dx*.35+dz*.82;
  const crest=Math.exp(-across*across/(2*.55*.55))*Math.exp(-along*along/(2*2.8*2.8));
  h+=.42*crest;
  /* soft undulations elsewhere */
  h+=.14*Math.pow(Math.max(0,Math.sin(x*.35+z*.12+0.4)),3)*ss(-5,6,x)*.5;
  h+=.1*Math.pow(Math.max(0,Math.sin(z*.4-x*.15+1.2)),4)*.4;
  /* oasis bowl */
  const dl=Math.hypot(x-lakeC.x,z-lakeC.z);
  const bowl=ss(lakeR*1.28,lakeR*.28,dl);
  h=mix(h,-.1,bowl);
  const wet=ss(lakeR*.92,lakeR*1.08,dl)*ss(lakeR*1.42,lakeR*1.18,dl);
  h=mix(h,.02,wet*.35);
  h*=1-edge;return Math.max(-.12,h)}
function nAt(x,z){const e=.06;const hx=hAt(x+e,z)-hAt(x-e,z),hz=hAt(x,z+e)-hAt(x,z-e);return new V3(-hx,2*e,-hz).normalize()}

/* ---------------- golden beige sand (#e6c48a lit / #b98d58 shade) ---------------- */
function buildIsland(){
  const N=MOB?100:150,pos=[],nor=[],uv=[],idx=[],col=[];
  const litC=new C3("#e6c48a"),shC=new C3("#b98d58"),wetC=new C3("#9a7548");
  for(let j=0;j<=N;j++)for(let i=0;i<=N;i++){
    const u=i/N,v=j/N,th=u*TAU,rr0=Math.pow(v,.9)*rimR(th);
    const x=Math.cos(th)*rr0,z=Math.sin(th)*rr0,y=hAt(x,z);
    pos.push(x,y,z);uv.push(x*.28+3,z*.28+3);
    const n=nAt(x,z);nor.push(n.x,n.y,n.z);
    const lit=cl(n.x*.55+n.y*.55+.2,0,1);
    const dl=Math.hypot(x-lakeC.x,z-lakeC.z),wet=ss(lakeR*1.35,lakeR*.95,dl);
    const c=litC.clone().lerp(shC,1-lit).lerp(wetC,wet*.55);
    col.push(c.r,c.g,c.b)}
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){const a=j*(N+1)+i;idx.push(a,a+1,a+N+1,a+1,a+N+2,a+N+1)}
  const g=new T.BG();g.setAttribute("position",new T.BA(new Float32Array(pos),3));
  g.setAttribute("normal",new T.BA(new Float32Array(nor),3));
  g.setAttribute("uv",new T.BA(new Float32Array(uv),2));
  g.setAttribute("color",new T.BA(new Float32Array(col),3));g.setIndex(idx);
  const sandMap=canvasTex(256,(x,y,S)=>{
    const nx=x/S,ny=y/S;
    const rip=Math.sin((nx*2.1+ny*.15)*6.28)*.4+Math.sin((nx*.3-ny*1.8)*6.28)*.25;
    const grit=Math.abs(Math.sin(x*2.1+y*1.7)*Math.sin(x*3.3-y*2.2));
    const v=190+rip*12+grit*14+(Math.random()*6-3);return [Math.min(255,v),Math.min(255,v*.84),Math.min(255,v*.58)]},{repeat:[4,4]});
  const bump=canvasTex(128,(x,y)=>{
    const n=Math.sin(x*.09+y*.02)*6.28+Math.sin(x*.03-y*.1);const v=128+n*18+(Math.random()*6-3);return [v,v,v]},{repeat:[8,8]});
  const m=M({map:sandMap,bumpMap:bump,bumpScale:.055,vertexColors:true,roughness:.9,metalness:0,color:new C3("#e8c992")});
  m.onBeforeCompile=(sh)=>{
    sh.fragmentShader=sh.fragmentShader.replace('#include <map_fragment>',
      `#include <map_fragment>
       float spk=smoothstep(.86,.97,fract(sin(dot(vMapUv*120.,vec2(12.9,78.2)))*43758.5));
       diffuseColor.rgb+=spk*vec3(.16,.11,.05)*.3;`);
  };
  const mesh=new T.Mesh(g,m);mesh.receiveShadow=mesh.castShadow=true;return mesh}

/* ---------------- thick sandstone cliffs (yard-like volume + ledges) ---------------- */
function buildUnderside(){
  const gRoot=new T.Group();
  const NR=MOB?80:110,NV=MOB?22:28;
  /* deep taper profile — thick vertical cliff then jagged tip */
  const prof=[[0,-4.4],[.12,-4.25],[.28,-3.85],[.42,-3.25],[.55,-2.55],[.66,-1.9],[.76,-1.25],[.85,-.7],[.92,-.28],[.97,-.06],[1.02,.04]];
  const pos=[],uv=[],idx=[],col=[];
  for(let j=0;j<=NV;j++)for(let i=0;i<=NR;i++){
    const u=i/NR,v=j/NV,th=u*TAU;
    const pi0=Math.min(prof.length-2,(v*(prof.length-1))|0),fv=v*(prof.length-1)-pi0;
    const p0=prof[pi0],p1=prof[pi0+1];
    const pr=mix(p0[0],p1[0],fv),py=mix(p0[1],p1[1],fv);
    const Rth=rimR(th);
    let rad=pr*Rth;
    const deep=cl((-py)/4.4,0,1);
    const n1=Math.sin(th*3.8+py*1.5)*.14+Math.sin(th*7.2-py*2.2)*.08+Math.sin(th*11+py*4)*.04;
    /* crumbly ledges / overhangs mid-cliff */
    const ledge=(deep>.2&&deep<.75)?Math.pow(Math.max(0,Math.sin(th*2.6+deep*8)),2)*.28*Math.sin(deep*12):0;
    rad*=1+n1*.12*deep;rad-=ledge*Rth*.08;
    const y=py-Math.abs(n1)*.45*deep-Math.sin(th*5.5+py*2.5)*.18*deep-ledge*.35;
    const x=Math.cos(th)*rad,z=Math.sin(th)*rad;
    pos.push(x,y,z);uv.push(u*5,deep*4);
    const band=.5+.5*Math.sin(py*6.2+th*1.8+n1*2);
    const shade=.38+.32*(1-deep)+band*.22+n1*.08;
    col.push(Math.min(.95,shade*1.4),Math.min(.72,shade*.9),Math.min(.48,shade*.55))}
  for(let j=0;j<NV;j++)for(let i=0;i<NR;i++){const a=j*(NR+1)+i;idx.push(a,a+NR+1,a+1,a+1,a+NR+1,a+NR+2)}
  const geo=new T.BG();geo.setAttribute("position",new T.BA(new Float32Array(pos),3));
  geo.setAttribute("uv",new T.BA(new Float32Array(uv),2));geo.setAttribute("color",new T.BA(new Float32Array(col),3));
  geo.setIndex(idx);geo.computeVertexNormals();
  const rockMap=canvasTex(256,(x,y)=>{
    const strata=.5+.5*Math.sin(y*.2+Math.sin(x*.04)*2);
    const grit=Math.abs(Math.sin(x*.09+y*.05)*Math.sin(x*.03-y*.08));
    const v=100+strata*48+grit*22+(Math.random()*8);return [v*1.25,v*.8,v*.48]});
  const rockM=M({map:rockMap,vertexColors:true,roughness:.97,color:new C3("#b87948")});
  rockM.onBeforeCompile=(sh)=>{
    sh.fragmentShader=sh.fragmentShader.replace('#include <map_fragment>',
      `#include <map_fragment>
       float st=smoothstep(.2,.8,sin(vMapUv.y*32.+vMapUv.x*2.)*.5+.5);
       diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(1.15,.95,.78),st*.45);`);
  };
  const cliff=new T.Mesh(geo,rockM);cliff.castShadow=cliff.receiveShadow=true;gRoot.add(cliff);
  /* ledge boulders clinging to cliffs */
  for(let i=0;i<28;i++){
    const th=rnd()*TAU,deep=rr(.18,.85),Rth=rimR(th);
    const rad=Rth*(.5+.4*deep);
    const y=-deep*3.8+rr(-.2,.15);
    const b=new T.Mesh(new T.Sphere(rr(.2,.55),MOB?6:8,MOB?5:6),M({color:new C3().setHSL(.07,rr(.4,.55),rr(.28,.4)),roughness:.96,flatShading:true}));
    b.scale.set(rr(.7,1.4),rr(.4,.75),rr(.7,1.3));
    b.position.set(Math.cos(th)*rad,y,Math.sin(th)*rad);b.castShadow=true;gRoot.add(b)}
  return gRoot}

const island=buildIsland(),under=buildUnderside();root.add(island);root.add(under);

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
const lakeU={uT:{value:0},uWind:{value:.2},uNight:{value:0},uSunDir:{value:new V3(.5,.25,.3)},uSunCol:{value:new C3(1,.75,.45)},uMoonC:{value:new C3(.55,.68,.95)},uSky:{value:new C3(.95,.55,.4)},uDeep:{value:new C3(.02,.45,.5)},uShal:{value:new C3(.35,.85,.78)}};
const lakeM=new T.SM({transparent:true,depthWrite:false,uniforms:lakeU,
 vertexShader:`varying vec3 vW;varying vec2 vUv;void main(){vUv=uv;vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
 fragmentShader:`uniform float uT,uWind,uNight;uniform vec3 uSunDir,uSunCol,uMoonC,uSky,uDeep,uShal;varying vec3 vW;varying vec2 vUv;
 void main(){
  float r=length(vUv-.5)*2.;if(r>1.05)discard;
  float edge=smoothstep(1.05,.82,r);
  vec2 p=vW.xz*.6;
  float rip=.008*(sin(p.x*4.+uT*.25)+sin(p.y*3.5-uT*.22)); /* still surface */
  rip*=(.2+.3*uWind)*edge;
  vec3 N=normalize(vec3(-rip*12.,1.,rip*10.));
  vec3 V=normalize(cameraPosition-vW);
  float fres=pow(max(1e-4,1.-max(0.,dot(N,V))),2.6);
  float depth=smoothstep(1.,.12,r);
  vec3 water=mix(uShal,uDeep,depth);
  vec3 Rdir=reflect(-V,N);
  vec3 skyR=mix(uSky,uSunCol,.25+.4*max(0.,Rdir.y));
  skyR=mix(skyR,vec3(.2,.5,.28),smoothstep(.5,.95,r)*.22); /* palm green tint */
  vec3 col=mix(water,skyR,.2+.6*fres);
  col+=uMoonC*uNight*(.08+.28*fres);
  float sunSpec=pow(max(1e-4,dot(reflect(-normalize(uSunDir),N),V)),90.)*(.15+.3*(1.-uNight));
  col+=uSunCol*sunSpec;
  float a=min(1.,(.82+.15*depth)*edge+.5*fres*edge);
  gl_FragColor=vec4(col,a);
  #include <colorspace_fragment>
 }`});
const lake=new T.Mesh(lakeG,lakeM);lake.renderOrder=2;root.add(lake);
const lakeBed=new T.Mesh(lakeG.clone(),M({color:"#0c4544",roughness:1}));lakeBed.position.y=-.09;lakeBed.scale.set(1.03,1,1.03);root.add(lakeBed);
/* wet-sand rim */
(function wetRing(){
  const N=72,pos=[],idx=[],col=[];
  for(let i=0;i<=N;i++){
    const th=i/N*TAU,e=.88+.08*Math.sin(th*2.3)+.05*Math.sin(th*5.1+.7);
    for(let k=0;k<2;k++){
      const rad=lakeR*(k?1.38:1.02)*e;const x=lakeC.x+Math.cos(th)*rad*1.15,z=lakeC.z+Math.sin(th)*rad*.88;
      pos.push(x,hAt(x,z)+.008,z);col.push(.55-k*.06,.42-k*.05,.28)}}
  for(let i=0;i<N;i++){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2)}
  const g=new T.BG();g.setAttribute("position",new T.BA(new Float32Array(pos),3));g.setAttribute("color",new T.BA(new Float32Array(col),3));g.setIndex(idx);g.computeVertexNormals();
  root.add(new T.Mesh(g,M({vertexColors:true,roughness:.75})))})();

/* fine olive grass tufts + reeds (not cartoon strips) */
const reedG=new T.Group();root.add(reedG);
(function makeShoreGreen(){
  const tuftM=M({color:"#5a6e3a",roughness:.9,side:2});
  const reedM=M({color:"#4a6234",roughness:.9,side:2});
  for(let i=0;i<(MOB?90:140);i++){
    const a=rnd()*TAU,r=lakeR*(.98+rr(0,.4));
    const e=.88+.08*Math.sin(a*2.3);
    const x=lakeC.x+Math.cos(a)*r*e*1.15,z=lakeC.z+Math.sin(a)*r*e*.88;
    if(Math.hypot(x,z)>R-0.4)continue;
    const y=Math.max(hAt(x,z),lakeY);
    const g=new T.Group();g.position.set(x,y,z);
    const n=3+((rnd()*3)|0);
    for(let k=0;k<n;k++){
      const h=rr(.08,.22),blade=new T.Mesh(new T.Plane(.012,h),tuftM);
      blade.position.set(rr(-.04,.04),h*.5,rr(-.04,.04));
      blade.rotation.y=rnd()*TAU;blade.rotation.z=rr(-.35,.35);blade.rotation.x=rr(-.15,.15);g.add(blade)}
    if(rnd()<.25){const rh=rr(.3,.55);const reed=new T.Mesh(new T.Cyl(.004,.002,rh,3),reedM);reed.position.y=rh*.5;reed.rotation.z=rr(-.12,.12);g.add(reed)}
    g.userData.ph=rnd()*TAU;reedG.add(g)}
})();

/* ---------------- sandstone rocks (half-buried, no floaters) ---------------- */
const rockG=new T.Group();root.add(rockG);
(function makeRocks(){
  for(let i=0;i<(MOB?18:28);i++){
    const a=rnd()*TAU,rad=Math.sqrt(rnd())*R*.9;let x=Math.cos(a)*rad,z=Math.sin(a)*rad;
    if(Math.hypot(x-lakeC.x,z-lakeC.z)<lakeR*1.2){if(rnd()<.6)continue}
    const y=hAt(x,z),s=rr(.08,.32);
    const o=new T.Mesh(new T.Sphere(1,MOB?6:8,MOB?5:6),M({color:new C3().setHSL(.08,rr(.35,.5),rr(.32,.42)),roughness:.96,flatShading:true}));
    o.scale.set(s*rr(1,1.6),s*rr(.22,.4),s*rr(1,1.5));
    o.position.set(x,y-s*.15,z); /* half-buried */
    o.rotation.set(rr(0,.6),rr(0,TAU),rr(0,.6));o.castShadow=o.receiveShadow=true;rockG.add(o)}
})();
const shrubs=[];
(function makeShrubs(){
  for(let i=0;i<(MOB?12:18);i++){
    const a=rnd()*TAU,rad=Math.sqrt(rnd())*R*.82;const x=Math.cos(a)*rad,z=Math.sin(a)*rad;
    if(Math.hypot(x-lakeC.x,z-lakeC.z)<lakeR*1.4)continue;
    const y=hAt(x,z),g=new T.Group();
    const m=M({color:new C3().setHSL(.12,rr(.2,.35),rr(.28,.36)),roughness:.92,flatShading:true});
    for(let k=0;k<5;k++){const b=new T.Mesh(new T.Sphere(rr(.06,.12),5,4),m);b.position.set(rr(-.12,.12),rr(.04,.14),rr(-.12,.12));g.add(b)}
    g.position.set(x,y,z);root.add(g);shrubs.push({x,z,y,o:g})}
})();

/* ---------------- date palms — curved ringed trunk + drooping pinnate fronds ---------------- */
function makePalm(leanDir){
  const g=new T.Group();
  const trunkM=M({color:"#6b4a30",roughness:.9}),ringM=M({color:"#5a3a26",roughness:.92});
  const leafM=M({color:"#5a7a38",roughness:.78,side:2}),dryM=M({color:"#8a7a40",roughness:.85,side:2}),dateM=M({color:"#7a3a18",roughness:.85});
  const segs=12;let px=0,py=0,pz=0;
  const lean=leanDir||rr(.06,.12),leanZ=rr(-.04,.04);
  for(let i=0;i<segs;i++){
    const t=i/(segs-1),h=.24,r0=.1-t*.055;
    const cyl=new T.Mesh(new T.Cyl(r0,r0*.94,h,8),i%2?ringM:trunkM);
    px+=lean*(.4+.6*t);pz+=leanZ*(.4+.6*t);py+=h;
    cyl.position.set(px,py-h*.5,pz);cyl.rotation.z=lean*.9;cyl.rotation.x=-leanZ*.9;cyl.castShadow=true;g.add(cyl)}
  const crown=new T.Group();crown.position.set(px,py+.02,pz);g.add(crown);
  const nFrond=MOB?14:18;
  for(let i=0;i<nFrond;i++){
    const fr=new T.Group();fr.rotation.y=i/nFrond*TAU+rr(-.03,.03);
    const dry=i<3||rnd()<.12;fr.rotation.x=rr(.7,1.15); /* droop */
    fr.userData.ph=rnd()*TAU;fr.userData.baseX=fr.rotation.x;
    const rachisLen=rr(1.4,1.85);
    const rachis=new T.Mesh(new T.Cyl(.008,.002,rachisLen,4),dry?dryM:leafM);
    rachis.position.z=rachisLen*.5;rachis.rotation.x=Math.PI/2;fr.add(rachis);
    const nLeaf=MOB?12:16;
    for(let k=0;k<nLeaf;k++){
      const along=.06+k/(nLeaf-1)*(rachisLen*.95),side=k%2?1:-1;
      const tip=k/(nLeaf-1),len=rr(.22,.38)*(1-tip*.55);
      const lf=new T.Mesh(new T.Plane(.018,len),dry?dryM:leafM);
      lf.position.set(side*.015,0,along);
      lf.rotation.z=side*(1.05+.15*tip);lf.rotation.y=side*.15;lf.rotation.x=.1;fr.add(lf)}
    crown.add(fr)}
  for(let i=0;i<3;i++){const d=new T.Mesh(new T.Sphere(.05,6,5),dateM);d.scale.set(1,1.7,1);d.position.set(Math.cos(i*2.1)*.1,-.18,Math.sin(i*2.1)*.1);crown.add(d)}
  g.userData={crown,kind:"palm"};return g}
const palms=[];
(function placePalms(){
  /* two palms leaning apart near lake, as in reference */
  const spots=[{x:lakeC.x+.85,z:lakeC.z+.45,lean:.1},{x:lakeC.x+1.25,z:lakeC.z-.55,lean:-.1}];
  spots.forEach(sp=>{const p=makePalm(sp.lean);p.scale.setScalar(1);p.position.set(sp.x,hAt(sp.x,sp.z),sp.z);p.rotation.y=rr(-.3,.3);onDes(p);root.add(p);palms.push(p);
    tryModel(MODEL.palm,()=>null).then(r=>{if(r.src==="glb"&&r.root)adoptGLB(p,r.root)})})
})();

/* ---------------- saguaros — fluted + smooth elbow arms ---------------- */
function makeCactus(opts){
  opts=opts||{};const g=new T.Group();
  const col=new C3().setHSL(.28,rr(.14,.22),rr(.28,.34)); /* dusty olive */
  const m=M({color:col,roughness:.92});
  const H=opts.h||1.15,R0=opts.r||.11;
  const trunk=new T.Mesh(new T.Cyl(R0,R0*1.02,H,MOB?12:16,1),m);
  const pa=trunk.geometry.attributes.position.array;
  for(let i=0;i<pa.length;i+=3){const th=Math.atan2(pa[i+2],pa[i]);const rib=.01*Math.sin(th*10);const rr2=Math.hypot(pa[i],pa[i+2])+rib;pa[i]=Math.cos(th)*rr2;pa[i+2]=Math.sin(th)*rr2}
  trunk.geometry.computeVertexNormals();trunk.position.y=H*.5;trunk.castShadow=true;g.add(trunk);
  const top=new T.Mesh(new T.Sphere(R0*1.02,12,8),m);top.scale.set(1,.55,1);top.position.y=H;g.add(top);
  g.userData.perch={x:0,y:H+.03,z:0};
  /* elbow arms: horizontal then vertical curve via segment chain */
  const arms=opts.arms!=null?opts.arms:2;
  for(let i=0;i<arms;i++){
    const side=i%2?1:-1,ah=rr(H*.38,H*.55),arm=new T.Group();arm.position.y=ah;
    const segs=6;let ax=0,ay=0,az=0;
    for(let s=0;s<segs;s++){
      const t=s/(segs-1);
      const ang=side*Math.PI/2*ss(0,1,Math.min(1,t*1.4)); /* smooth elbow */
      const len=.1;const c=new T.Mesh(new T.Cyl(R0*.48,R0*.46,len,10),m);
      ax+=Math.sin(ang)*len;ay+=Math.cos(ang)*len*(t>.45?1:0)+Math.sin(Math.max(0,t-.4)*1.8)*.12;
      c.position.set(ax,ay,az);c.rotation.z=-ang;arm.add(c)}
    const tip=new T.Mesh(new T.Sphere(R0*.48,8,6),m);tip.scale.set(1,.6,1);tip.position.set(ax,ay+0.04,az);arm.add(tip);
    arm.rotation.y=rr(-.25,.25)+i;g.add(arm)}
  return g}
const cacti=[];
(function placeCacti(){
  const spots=[
    {x:-5.0,z:2.2,h:1.25,r:.11,arms:2,perch:1},
    {x:4.2,z:1.4,h:1.1,r:.1,arms:2},
    {x:3.8,z:-3.2,h:1.05,r:.1,arms:1},
    {x:-4.0,z:-2.8,h:1.15,r:.11,arms:2}
  ];
  spots.forEach(sp=>{if(Math.hypot(sp.x,sp.z)>R-0.8)return;if(Math.hypot(sp.x-lakeC.x,sp.z-lakeC.z)<lakeR*1.5)return;
    const c=makeCactus(sp);c.position.set(sp.x,hAt(sp.x,sp.z),sp.z);c.rotation.y=rr(0,TAU);onDes(c);root.add(c);cacti.push(c);
    tryModel(MODEL.cactus,()=>null).then(r=>{if(r.src==="glb"&&r.root)adoptGLB(c,r.root)})});
})();
const eaglePerch=cacti[0];

/* ---------------- A-frame canvas tent ---------------- */
function makeTentProcedural(){
  const g=new T.Group();
  const clothMap=canvasTex(128,(x,y)=>{
    const band=((y/12)|0)%2;const v=band?215:185;return [v,v*.88,v*.65]},{repeat:[1,2]});
  const cloth=M({map:clothMap,color:"#d4b896",roughness:.88,side:2});
  const poleM=M({color:"#4a3020",roughness:.9}),ropeM=M({color:"#6a5438",roughness:.95});
  const rugM=M({color:"#8b3a28",roughness:.9});
  const w=1.35,d=1.15,ridge=1.45; /* ~1.3× camel height */
  function roofPanel(sign){
    const geo=new T.BG();
    const p=new Float32Array([0,ridge,d*.48, sign*w*.48,.12,d*.48, sign*w*.48,.12,-d*.48, 0,ridge,d*.48, sign*w*.48,.12,-d*.48, 0,ridge,-d*.48]);
    const uvs=new Float32Array([0,1,1,1,1,0, 0,1,1,0,0,0]);
    geo.setAttribute("position",new T.BA(p,3));geo.setAttribute("uv",new T.BA(uvs,2));geo.computeVertexNormals();
    const m=new T.Mesh(geo,cloth);m.castShadow=m.receiveShadow=true;return m}
  const roofL=roofPanel(-1),roofR=roofPanel(1);g.add(roofL);g.add(roofR);
  const back=new T.Mesh(new T.Plane(w*.95,ridge*.95,6,4),cloth);back.position.set(0,ridge*.45,-d*.46);g.add(back);
  g.userData.cloths=[roofL,roofR,back];
  /* ridge + upright poles */
  [[0,0,0],[-w*.35,0,d*.4],[w*.35,0,d*.4],[-w*.35,0,-d*.4],[w*.35,0,-d*.4]].forEach(([x,_,z],i)=>{
    const h=i===0?ridge*1.02:ridge*.85;const p=new T.Mesh(new T.Cyl(.022,.018,h,5),poleM);p.position.set(x,h*.5,z);p.castShadow=true;g.add(p)});
  /* guy ropes + pegs */
  [[-w*.7,d*.7],[w*.7,d*.7],[-w*.7,-d*.7],[w*.7,-d*.7]].forEach(([x,z])=>{
    const peg=new T.Mesh(new T.Cyl(.015,.015,.06,5),poleM);peg.position.set(x,.015,z);g.add(peg);
    const len=Math.hypot(x,ridge*.65,z)*.55;
    const rope=new T.Mesh(new T.Cyl(.005,.005,len,4),ropeM);
    rope.position.set(x*.4,ridge*.4,z*.4);rope.lookAt(x,.02,z);rope.rotateX(Math.PI/2);g.add(rope)});
  const rug=new T.Mesh(new T.Plane(.85,.5),rugM);rug.rotation.x=-Math.PI/2;rug.position.set(0,.012,d*.55);g.add(rug);
  const rug2=new T.Mesh(new T.Plane(.4,.35),M({color:"#6a4a28",roughness:.92}));rug2.rotation.x=-Math.PI/2;rug2.position.set(.3,.01,d*.35);g.add(rug2);
  return g}
const tentY=hAt(tentAnchor.x,tentAnchor.z);
let tent=makeTentProcedural();tent.position.set(tentAnchor.x,tentY,tentAnchor.z);tent.rotation.y=-.5;onDes(tent);root.add(tent);
tryModel(MODEL.tent,()=>({skip:1})).then(r=>{if(r.src==="glb"&&r.root){adoptGLB(tent,r.root)}});

/* campfire + smoke */
const fireG=new T.Group();const firePos={x:tentAnchor.x-.1,z:tentAnchor.z+1.05};
fireG.position.set(firePos.x,hAt(firePos.x,firePos.z),firePos.z);root.add(fireG);
(function makeFire(){
  const stoneM=M({color:"#6a5a48",roughness:.95}),logM=M({color:"#3a2415",roughness:.95});
  for(let i=0;i<6;i++){const s=new T.Mesh(new T.Sphere(rr(.05,.08),6,5),stoneM);const a=i/6*TAU;s.position.set(Math.cos(a)*.22,.03,Math.sin(a)*.22);s.scale.set(1,.5,1);fireG.add(s)}
  for(let i=0;i<3;i++){const log=new T.Mesh(new T.Cyl(.03,.04,.28,5),logM);log.rotation.z=Math.PI/2;log.rotation.y=i*TAU/3;log.position.y=.04;fireG.add(log)}
  const glow=new T.Mesh(new T.Sphere(.1,8,6),M({color:"#ff8a3a",roughness:1,emissive:"#ff6a20",emissiveIntensity:1.3,transparent:true,opacity:.8}));
  glow.position.y=.16;fireG.add(glow);fireG.userData.glow=glow;
  const fireL=new T.PL(new C3("#ff9a4a"),0,5.5,2);fireL.position.set(0,.35,0);fireL.layers.mask=L3;fireG.add(fireL);fireG.userData.light=fireL;
  const tentL=new T.PL(new C3("#ffb070"),0,3.5,2);tentL.position.set(.1,.5,-.15);tentL.layers.mask=L3;fireG.add(tentL);fireG.userData.tentL=tentL;
})();
const SMN=MOB?48:80,smP=new Float32Array(SMN*3),smA=new Float32Array(SMN),smG=new T.BG();
smG.setAttribute("position",new T.BA(smP,3));smG.setAttribute("a",new T.BA(smA,1));
const smM=new T.SM({transparent:true,depthWrite:false,uniforms:{col:{value:new C3(.85,.83,.8)},scale:{value:1}},
 vertexShader:`attribute float a;varying float vA;uniform float scale;void main(){vA=a;vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=max(2.,scale*18./max(.5,-mv.z));}`,
 fragmentShader:`uniform vec3 col;varying float vA;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(col,vA*smoothstep(.5,0.,d)*.45);}`});
root.add(Object.assign(new T.Points(smG,smM),{frustumCulled:false,renderOrder:5}));
const SMF=[];for(let i=0;i<SMN;i++)SMF.push({x:0,y:rr(0,2),z:0,v:rr(.2,.5),life:rnd()});

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
    const foot=new T.Mesh(new T.Sphere(.065,6,4),pad);foot.scale.set(1.4,.4,1.5);foot.position.y=-.8;L.add(foot);
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
function spawnCamel(x,z,facing){
  const c=makeCamelProcedural();plantFeet(c,x,z,facing);onDes(c);root.add(c);
  const st={o:c,x,z,facing,mode:"walk",t:rr(0,8),speed:.42,tx:x,tz:z,drink:0,graze:0,step:rnd()*TAU};
  camels.push(st);
  tryModel(MODEL.camel,()=>null).then(r=>{
    if(r.src==="glb"&&r.root){
      adoptGLB(c,r.root);st.glb=r.root;
      const U=makeDeformU("camel");c.userData.deform=U;patchDeform(r.root,"camel",U)}});
  return st}
spawnCamel(-4.6,2.4,0.6);spawnCamel(-5.4,1.0,-2.1);

function camelUpdate(st,dt,t){
  st.t+=dt;const c=st.o,ud=c.userData,glb=!!ud.useGlb;
  if(st.mode==="walk"&&st.t>5.5){st.mode=rnd()<.45?"graze":rnd()<.5?"drink":"walk";st.t=0;
    if(st.mode==="graze"){const sh=shrubs[(Math.random()*shrubs.length)|0];if(sh){st.tx=sh.x;st.tz=sh.z}}
    else if(st.mode==="drink"){const a=rnd()*TAU;st.tx=lakeC.x+Math.cos(a)*lakeR*1.12;st.tz=lakeC.z+Math.sin(a)*lakeR*1.12}
    else{const a=rnd()*TAU,rad=rr(2.5,R*.6);st.tx=Math.cos(a)*rad;st.tz=Math.sin(a)*rad}}
  let moving=0,neck=0,bob=0,chew=0;
  if(st.mode==="walk"||st.mode==="graze"||st.mode==="drink"){
    const dx=st.tx-st.x,dz=st.tz-st.z,dist=Math.hypot(dx,dz);
    if(dist>.28){const want=Math.atan2(dx,dz);let dth=((want-st.facing+Math.PI*3)%TAU)-Math.PI;st.facing+=dth*ease(3,dt);
      const sp=st.speed*(st.mode==="walk"?1:.62);st.x+=Math.sin(st.facing)*sp*dt;st.z+=Math.cos(st.facing)*sp*dt;
      st.step+=dt*sp*5.5;moving=1;bob=Math.sin(st.step*2)*.012;
      if(!glb&&ud.legs)ud.legs.forEach(lg=>{const pace=st.step+(lg.side>0?0:Math.PI);const swing=Math.sin(pace);lg.L.rotation.x=swing*.45;lg.lo.rotation.x=Math.max(0,-swing)*.35});
      if(!glb&&ud.neck)ud.neck.rotation.x=ss(0,1,Math.sin(t*.7)*.08)}
    else{
      if(!glb&&ud.legs)ud.legs.forEach(lg=>{lg.L.rotation.x*=1-ease(6,dt);lg.lo.rotation.x*=1-ease(6,dt)});
      if(st.mode==="graze"){st.graze+=dt;neck=ss(0,1,Math.min(1,st.graze*1.4))*1.05;chew=t*3.2;
        if(!glb&&ud.neck){ud.neck.rotation.x=neck;ud.head.rotation.x=Math.sin(t*3)*.06}
        if(st.graze>4){st.mode="walk";st.t=0;st.graze=0}}
      else if(st.mode==="drink"){st.drink+=dt;neck=ss(0,1,Math.min(1,st.drink))*1.35;
        if(!glb&&ud.neck)ud.neck.rotation.x=neck;if(st.drink>5){st.mode="walk";st.t=0;st.drink=0}}
      else{st.mode="walk";st.t=0}}}
  if(glb){setDef(c,"uStep",moving?st.step:st.step*.15);setDef(c,"uNeck",neck);setDef(c,"uBob",bob);setDef(c,"uChew",chew)}
  plantFeet(c,st.x,st.z,st.facing);
  /* keep soles above sand — GLB origin is ground contact; neck reaches water via deform */
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
  /* fanned tail */
  for(let i=-2;i<=2;i++){const t=new T.Mesh(new T.Plane(.06,.22),wingM);t.position.set(i*.04,0,-.28);t.rotation.x=.35;t.rotation.z=i*.08;g.add(t)}
  g.userData={wingL,wingR,head,body};return g}
const eagle={o:makeEagleProcedural(),mode:"soar",t:0,th:rnd()*TAU,rad:5.0,alt:3.8,flap:0,cry:0,blend:0,landed:0};
eagle.o.scale.setScalar(.95);root.add(eagle.o);onDes(eagle.o);
function eagleShowFly(on){
  const o=eagle.o;
  if(eagle.flyGlb)eagle.flyGlb.visible=!!on;
  if(eagle.perchGlb)eagle.perchGlb.visible=!on;
  if(!eagle.flyGlb&&!eagle.perchGlb)return;
  /* hide procedural parts when any GLB is active */
  o.children.forEach(ch=>{if(ch===eagle.flyGlb||ch===eagle.perchGlb)return;ch.visible=!(eagle.flyGlb||eagle.perchGlb)})}
tryModel(MODEL.eagle,()=>null).then(r=>{
  if(r.src==="glb"&&r.root){
    eagle.o.children.slice().forEach(ch=>{ch.visible=false});
    eagle.flyGlb=r.root;eagle.o.add(r.root);eagle.o.userData.useGlb=1;onDes(r.root);
    const U=makeDeformU("eagle");eagle.o.userData.deform=U;patchDeform(r.root,"eagle",U);
    eagleShowFly(true)}});
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

function eagleUpdate(dt,t){
  const e=eagle,o=e.o,ud=o.userData,glb=!!ud.useGlb;e.t+=dt;
  if(e.mode==="soar"){
    eagleShowFly(true);
    e.th+=dt*.18;e.rad=4.8+.4*Math.sin(t*.15);e.alt=3.4+.55*Math.sin(t*.2);
    e.flap+=dt;const flapping=Math.sin(e.flap*8)>0&&(e.flap%6)<.35;
    if(!glb&&ud.wingL){ud.wingL.rotation.z=flapping?Math.sin(e.flap*16)*.4:-.08;ud.wingR.rotation.z=flapping?-Math.sin(e.flap*16)*.4:.08}
    const x=Math.cos(e.th)*e.rad,z=Math.sin(e.th)*e.rad,y=e.alt;
    const px=o.position.x,pz=o.position.z;o.position.set(x,y,z);
    const yaw=Math.atan2(x-px,z-pz);o.rotation.y=Number.isFinite(yaw)?yaw:o.rotation.y;
    o.rotation.z=cl(Math.cos(e.th)*.22,-.4,.4);o.rotation.x=0;
    if(glb){setDef(o,"uFlap",flapping?e.flap*16:e.flap*.4);setDef(o,"uBank",o.rotation.z)}
    if(e.t>9){e.t=0;e.mode=rnd()<.65?"landPerch":"landDrink";e.blend=0}}
  else if(e.mode==="landPerch"||e.mode==="landDrink"){
    const spot=e.mode==="landPerch"?eaglePerchWorld():eagleLakeSpot();
    const tx=spot.x,ty=spot.y,tz=spot.z;
    const dist0=Math.hypot(tx-o.position.x,ty-o.position.y,tz-o.position.z);
    /* flare: pull up then settle */
    const flare=ss(1.6,.35,dist0);
    const aimY=ty+flare*.55;
    const k=ease(1.35,dt);o.position.x+=(tx-o.position.x)*k;o.position.y+=(aimY-o.position.y)*k;o.position.z+=(tz-o.position.z)*k;
    const dist=Math.hypot(tx-o.position.x,ty-o.position.y,tz-o.position.z);
    o.rotation.z*=1-ease(4,dt);o.rotation.x=-flare*.35;
    if(!glb&&ud.wingL){ud.wingL.rotation.z=-.35-ss(1.2,0,dist)*.4;ud.wingR.rotation.z=.35+ss(1.2,0,dist)*.4}
    if(glb){setDef(o,"uFlap",6+flare*10);setDef(o,"uBank",o.rotation.z);if(dist<.55)e.blend=Math.min(1,e.blend+dt*2.2)}
    if(dist<.16){
      e.mode=e.mode==="landPerch"?"perch":"drink";e.t=0;e.landed=1;e.blend=1;
      o.position.set(tx,ty,tz);o.rotation.set(0,o.rotation.y,0);
      eagleShowFly(false);
      if(!glb&&ud.wingL){ud.wingL.rotation.set(.25,0,-.02);ud.wingR.rotation.set(.25,0,.02)}}}
  else if(e.mode==="perch"){
    const spot=eaglePerchWorld();o.position.set(spot.x,spot.y,spot.z);
    eagleShowFly(false);
    if(!glb&&ud.head)ud.head.rotation.y=Math.sin(t*.65)*.5;
    if(glb){setDef(o,"uFlap",0);setDef(o,"uBank",0)}
    if(e.t>7){e.mode="takeoff";e.t=0;eagleShowFly(true)}}
  else if(e.mode==="drink"){
    const spot=eagleLakeSpot();o.position.set(spot.x,spot.y,spot.z);
    eagleShowFly(false);
    if(!glb&&ud.head)ud.head.rotation.x=ss(0,1,Math.min(1,e.t*2))*.75;
    if(glb){setDef(o,"uFlap",0);setDef(o,"uBank",0)}
    if(e.t>3.5){e.mode="takeoff";e.t=0;eagleShowFly(true)}}
  else if(e.mode==="takeoff"){
    eagleShowFly(true);
    if(!glb&&ud.wingL){ud.wingL.rotation.z=-Math.sin(e.t*14)*.6;ud.wingR.rotation.z=Math.sin(e.t*14)*.6;ud.wingL.rotation.x=0;ud.wingR.rotation.x=0}
    if(glb){setDef(o,"uFlap",e.t*14);setDef(o,"uBank",0)}
    o.position.y+=dt*2.4;o.position.x+=Math.sin(o.rotation.y)*dt*1.4;o.position.z+=Math.cos(o.rotation.y)*dt*1.4;
    if(e.t>1.3){e.mode="soar";e.t=0;e.th=Math.atan2(o.position.x,o.position.z);e.cry=1;e.landed=0}}
}

/* ---------------- snake — thin tapered, sand-hugging ---------------- */
function makeSnakeProcedural(){
  const g=new T.Group();const segs=[];
  for(let i=0;i<22;i++){
    const t=i/21,r=.045*(1-t*.7);
    const m=M({color:new C3().setHSL(.1,.4,.32+((i%4)*.04)),roughness:.9});
    const s=new T.Mesh(new T.Sphere(r,6,5),m);s.castShadow=true;g.add(s);segs.push(s)}
  g.userData={segs,kind:"snake"};return g}
const snakes=[];
function spawnSnake(){
  const a=rnd()*TAU,rad=rr(2.8,R*.58);const s={o:makeSnakeProcedural(),x:Math.cos(a)*rad,z:Math.sin(a)*rad,th:rnd()*TAU,mode:"sidewind",t:0,pts:[],speed:.48};
  root.add(s.o);onDes(s.o);snakes.push(s);
  tryModel(MODEL.snake,()=>null).then(r=>{
    if(r.src==="glb"&&r.root){
      adoptGLB(s.o,r.root);s.glb=r.root;
      const U=makeDeformU("snake");s.o.userData.deform=U;patchDeform(r.root,"snake",U);
      setDef(s.o,"uAmp",.045)}})}
spawnSnake();if(!MOB)spawnSnake();

const TRN=180,trP=new Float32Array(TRN*3),trA=new Float32Array(TRN),trG=new T.BG();let trI=0;
trG.setAttribute("position",new T.BA(trP,3));trG.setAttribute("a",new T.BA(trA,1));
const trM=new T.SM({transparent:true,depthWrite:false,uniforms:{col:{value:new C3("#8a6a42")}},
 vertexShader:`attribute float a;varying float vA;void main(){vA=a;vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=max(1.2,4.5/max(.4,-mv.z));}`,
 fragmentShader:`uniform vec3 col;varying float vA;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(col,vA*smoothstep(.5,0.,d)*.4);}`});
root.add(Object.assign(new T.Points(trG,trM),{frustumCulled:false}));

function snakeUpdate(st,dt,t){
  st.t+=dt;const speed=.48;st.speed=speed;
  if(st.mode==="sidewind"){
    st.th+=Math.sin(t*1.2+st.t)*.35*dt;st.x+=Math.sin(st.th)*speed*dt;st.z+=Math.cos(st.th)*speed*dt;
    const r=Math.hypot(st.x,st.z);if(r>R*.8){st.th+=Math.PI*.5;st.x*=.94;st.z*=.94}
    if(Math.hypot(st.x-lakeC.x,st.z-lakeC.z)<lakeR*1.1)st.th+=1.1}
  const ud=st.o.userData,segs=ud.segs||[];
  if(ud.useGlb){
    const y=hAt(st.x,st.z)+.012;
    const n=nAt(st.x,st.z);
    st.o.position.set(st.x,y,st.z);
    const yaw=st.th;st.o.rotation.set(0,Number.isFinite(yaw)?yaw:0,0);
    /* slight pitch to hug slope without NaNs */
    const pitch=cl(-n.z*.35,-.25,.25),roll=cl(n.x*.35,-.25,.25);
    st.o.rotation.x=Number.isFinite(pitch)?pitch:0;st.o.rotation.z=Number.isFinite(roll)?roll:0;
    setDef(st.o,"uPhase",t*4.2+st.t*2.5);setDef(st.o,"uAmp",.04+.01*speed);setDef(st.o,"uSine",speed)}
  else{
    st.pts.unshift({x:st.x,z:st.z});if(st.pts.length>segs.length)st.pts.length=segs.length;
    for(let i=0;i<segs.length;i++){const p=st.pts[Math.min(i,st.pts.length-1)];if(!p)continue;
      const side=Math.sin(t*4-i*.5)*.07;const px=p.x+Math.cos(st.th)*side,pz=p.z-Math.sin(st.th)*side;
      const yy=hAt(px,pz)+.035;segs[i].position.set(px,Number.isFinite(yy)?yy:.035,pz)}}
  if((st.t*18|0)!==((st.t-dt)*18|0)){const i=trI%TRN;const yy=hAt(st.x,st.z)+.01;trP[i*3]=st.x;trP[i*3+1]=Number.isFinite(yy)?yy:.01;trP[i*3+2]=st.z;trA[i]=.65;trI++}
  for(let i=0;i<TRN;i++)trA[i]=Math.max(0,trA[i]-dt*.12);
  trG.attributes.position.needsUpdate=trG.attributes.a.needsUpdate=true}

/* ---------------- blowing sand / sandstorm ---------------- */
const SND=MOB?2000:3600,snR=R*.96;
const snG=new T.BG(),snP=new Float32Array(SND*3),snA=new Float32Array(SND),snA0=new Float32Array(SND),SNF=[];
snG.setAttribute("position",new T.BA(snP,3));snG.setAttribute("a",new T.BA(snA,1));
const snM=new T.SM({transparent:true,depthWrite:false,uniforms:{col:{value:new C3("#d4b07a")},scale:{value:1}},
 vertexShader:`attribute float a;varying float vA;uniform float scale;void main(){vA=a;vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=max(1.1,scale*(2+3*a)/max(.45,-mv.z));}`,
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
    snA[i]=snA0[i]*(.2+wn*.45+storm*.85)*(1-ss(snR*.85,snR,Math.hypot(q.x,q.z)))}
  snG.attributes.position.needsUpdate=snG.attributes.a.needsUpdate=true;
  snM.uniforms.col.value.set(0.83,.69,.48).multiplyScalar(1-st.night*.3);
  streamers.forEach((s,si)=>{
    s.life+=dt*(.35+storm*1.1);if(s.life>1){s.life=0;s.th=rnd()*TAU;s.rad=rr(1.5,5.5)}
    for(let i=0;i<s.n;i++){
      const u=i/(s.n-1);const x=Math.cos(s.th)*s.rad+u*wx*2.2,z=Math.sin(s.th)*s.rad+u*wz*2.2;
      const y=hAt(x,z)+.04+u*u*(.6+storm)+Math.sin(t*5+si+u*7)*.04;
      s.pos[i*3]=x;s.pos[i*3+1]=y;s.pos[i*3+2]=z;s.a[i]=(1-u)*(.15+storm*.7)*ss(0,.25,s.life)*ss(1,.7,s.life)}
    s.pts.geometry.attributes.position.needsUpdate=s.pts.geometry.attributes.a.needsUpdate=true;
    s.pts.visible=wn>.22||storm>.1})}

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
    fr.rotation.z=.12*wn*Math.sin(t*1.3+fr.userData.ph)+.03*Math.sin(t*.55+j);
    fr.rotation.x=fr.userData.baseX+.07*wn*Math.sin(t*1.05+fr.userData.ph)})});
  reedG.children.forEach(b=>{b.rotation.z=.14*wn*Math.sin(t*2+(b.userData.ph||0))});
  if(tent&&tent.userData.cloths&&!tent.userData.useGlb)tent.userData.cloths.forEach((c,i)=>{
    const geo=c.geometry,pos=geo.attributes.position;if(!pos)return;
    if(!c.userData.base)c.userData.base=new Float32Array(pos.array);
    const base=c.userData.base;
    for(let k=0;k<pos.count;k++){const o=k*3;const wiggle=wn*.035*Math.sin(t*5.5+base[o]*3.5+i)*Math.sin(t*3.8+base[o+1]*4);
      pos.array[o]=base[o]+wiggle;pos.array[o+1]=base[o+1]+wiggle*.5;pos.array[o+2]=base[o+2]+wiggle*.35}
    pos.needsUpdate=true});

  const fp=fireG.position;for(let i=0;i<SMN;i++){const k=SMF[i];k.life+=dt*.3;if(k.life>1){k.life=0;k.x=fp.x+rr(-.05,.05);k.z=fp.z+rr(-.05,.05);k.y=fp.y+.18;k.v=rr(.25,.55)}
    k.y+=k.v*dt;k.x+=wn*.9*dt;k.z+=wn*.2*dt;smP[i*3]=k.x;smP[i*3+1]=k.y;smP[i*3+2]=k.z;smA[i]=(1-k.life)*(.2+night*.8)}
  smG.attributes.position.needsUpdate=smG.attributes.a.needsUpdate=true;
  const fl=fireG.userData.light,tl=fireG.userData.tentL,gl=fireG.userData.glow;
  if(fl){const want=night*1.5+.06;fl.intensity+=(want*(1.1+.3*Math.sin(t*9))-fl.intensity)*ease(4,dt)}
  if(tl)tl.intensity+=(night*1.0+.03-tl.intensity)*ease(3,dt);
  if(gl){gl.material.opacity=.28+night*.55+.1*Math.sin(t*10);gl.material.emissiveIntensity=.7+night*1.1}

  sandUpdate(dt,t,wn,storm);
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
    if(storm>.2){Jt.fog.near=Math.min(Jt.fog.near,28);Jt.fog.far=Math.min(Jt.fog.far,95);Jt.fog.color.lerp(new C3("#d4b07a"),storm*.12)}
    if(night>.5)Jt.fog.color.lerp(new C3("#0a1528"),.04)}
}

function show(on){
  root.visible=on;De.layers.set(on?3:0);window.__desA=on;
  if(on){if(Ct.mode==="manual"||Ct.mode==="sunset"){Ct.mode="sunset";Ct.night=false}}
  const x=SX();if(x&&x.C)x.C();
  if(!on&&AU.master&&AU.ctx)AU.master.gain.setTargetAtTime(0,AU.ctx.currentTime,.25);
}

for(const o of[X.vd,pi,dc,X.Dc])o&&o.traverse(c=>c.layers.enable(3));
onDes(root);

window.__desShow=show;window.__desU=update;
window.__des={root,hAt,camels,eagle,snakes,cacti,palms,MODEL,lakeC,R,De,Ce:X.Ce};
window.__desReady=true;
};
})();
