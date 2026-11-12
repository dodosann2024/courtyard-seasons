/* 沙漠绿洲 · Desert Oasis (desert2 rework) — lazy-loaded on camera layer 3.
   Shares renderer/sky/lights; yards + sea never see this content. */
(()=>{
window.__desInit=getX=>{
const X=getX(),T=X.T,{Jt,De,Cn,Ta,Ue,Ct,qt,jt,pi,dc}=X,MOB=!!X.kn;
const V3=T.V3,C3=T.Color,TAU=Math.PI*2,R=8.8,L3=8;
let sd=20261112;const rnd=()=>{sd|=0;sd=sd+0x6D2B79F5|0;let t=Math.imul(sd^sd>>>15,1|sd);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const rr=(a,b)=>a+(b-a)*rnd(),cl=(x,a,b)=>x<a?a:x>b?b:x;
const ss=(a,b,x)=>{const t=cl((x-a)/(b-a),0,1);return t*t*(3-2*t)};
const ease=(k,dt)=>1-Math.exp(-dt*k);
const mix=(a,b,t)=>a+(b-a)*t;
const root=new T.Group();root.visible=false;Jt.add(root);
const onDes=o=>{o.traverse(c=>{c.layers.mask=1|L3})};
const M=(p,o)=>{const m=X.Wt(p,o||{snow:0,wet:0});return m};

/* ---------------- Tripo GLB via local three GLTFLoader; procedural if missing ---------------- */
const MODEL={camel:"assets/models/camel.glb",eagle:"assets/models/eagle.glb",snake:"assets/models/snake.glb",tent:"assets/models/tent.glb",palm:"assets/models/palm.glb",cactus:"assets/models/cactus.glb"};
const MODEL_FIT={camel:1.85,eagle:.55,snake:.12,tent:2.2,palm:4.2,cactus:2.6};
let _man=null,_gltfMod=null;
function modelsManifest(){if(_man)return _man;const url=((window.CY&&CY.root)||"")+"assets/models/manifest.json";
 _man=fetch(url).then(r=>r.ok?r.json():{}).catch(()=>({}));return _man}
function gltfMod(){if(_gltfMod)return _gltfMod;const url=new URL(((window.CY&&CY.root)||"")+"assets/vendor/des-gltf.js",location.href).href;
 _gltfMod=import(url);return _gltfMod}
function fitGLB(scene,key){
  const box={min:[1e9,1e9,1e9],max:[-1e9,-1e9,-1e9]};
  scene.updateMatrixWorld(true);
  scene.traverse(o=>{if(!o.isMesh||!o.geometry)return;const g=o.geometry;if(!g.boundingBox)g.computeBoundingBox();const b=g.boundingBox;if(!b)return;
    for(let i=0;i<2;i++)for(let j=0;j<2;j++)for(let k=0;k<2;k++){
      const p=new V3(i?b.max.x:b.min.x,j?b.max.y:b.min.y,k?b.max.z:b.min.z);o.localToWorld(p);
      box.min[0]=Math.min(box.min[0],p.x);box.min[1]=Math.min(box.min[1],p.y);box.min[2]=Math.min(box.min[2],p.z);
      box.max[0]=Math.max(box.max[0],p.x);box.max[1]=Math.max(box.max[1],p.y);box.max[2]=Math.max(box.max[2],p.z)}});
  const h=Math.max(1e-3,box.max[1]-box.min[1]),target=MODEL_FIT[key]||1;
  const wrap=new T.Group();wrap.add(scene);
  scene.position.set(-(box.min[0]+box.max[0])*.5,-box.min[1],-(box.min[2]+box.max[2])*.5);
  wrap.scale.setScalar(target/h);return wrap}
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

/* ---------------- heightfield: wind dunes + oasis bowl + irregular rim ---------------- */
const lakeC={x:-2.35,z:.15},lakeR=2.15;
function rimR(th){
  const c=Math.cos(th),s=Math.sin(th);
  const sq=Math.pow(Math.abs(c),1.28)+Math.pow(Math.abs(s),1.28);
  return R*(.90+.07*Math.sin(th*2.05+0.4)+.045*Math.sin(th*4.7-1.1)+.03*Math.sin(th*7.3))*(.74+.26/Math.max(.5,Math.pow(sq,.4)))}
function hNoise(x,z){
  return .55*Math.sin(x*.32+.6)*Math.cos(z*.28-1.0)
       +.38*Math.sin(x*.72-z*.42+1.8)
       +.22*Math.sin(x*1.35+z*1.05)
       +.11*Math.sin(x*2.6-z*2.0+.3)
       +.05*Math.sin(x*5.1+z*3.4)}
function hAt(x,z){
  const th=Math.atan2(z,x),r=Math.hypot(x,z),Rth=rimR(th),edge=ss(Rth*.62,Rth,r);
  let h=.42+hNoise(x,z);
  /* dominant dune ridge behind the tent (reference: big lit/shade crest) */
  const duneA=Math.max(0,Math.sin((x-1.4)*.48+(z+2.0)*.2));
  h+=2.15*Math.pow(duneA,4.2)*ss(-1.2,7.8,x)*ss(-5.8,4.2,z);
  /* secondary crests, wind-aligned ~X */
  h+=1.15*Math.pow(Math.max(0,Math.sin(x*.38+z*.12+0.2)),5.5)*ss(-4,6.8,x);
  h+=.78*Math.pow(Math.max(0,Math.sin(z*.5-x*.16+1.6)),6.5)*ss(-6,5,z);
  h+=.42*Math.pow(Math.max(0,Math.sin((x*.65+z)*.44+2.4)),7);
  /* oasis bowl — full depth at centre (ss args high→low so t=1 at dl=0) */
  const dl=Math.hypot(x-lakeC.x,z-lakeC.z);
  const bowl=ss(lakeR*1.25,lakeR*.3,dl); /* 1 at centre, 0 outside */
  h=mix(h,-.14,bowl);
  /* wet compacted band just outside water */
  const wet=ss(lakeR*.9,lakeR*1.05,dl)*ss(lakeR*1.4,lakeR*1.15,dl);
  h=mix(h,-.03,wet*.7);
  h*=1-edge;return Math.max(-.16,h)}
function nAt(x,z){const e=.07;const hx=hAt(x+e,z)-hAt(x-e,z),hz=hAt(x,z+e)-hAt(x,z-e);return new V3(-hx,2*e,-hz).normalize()}

/* procedural canvas helpers */
function canvasTex(S,fn,opts){
  const c=document.createElement("canvas");c.width=c.height=S;const g=c.getContext("2d");
  const id=g.createImageData(S,S),d=id.data;for(let y=0;y<S;y++)for(let x=0;x<S;x++){const o=(y*S+x)*4,v=fn(x,y,S);d[o]=v[0];d[o+1]=v[1];d[o+2]=v[2];d[o+3]=255}
  g.putImageData(id,0,0);const t=new T.CTex(c);t.colorSpace="srgb";t.wrapS=t.wrapT=1000;t.anisotropy=MOB?4:8;
  if(opts&&opts.repeat)t.repeat.set(opts.repeat[0],opts.repeat[1]);return t}

/* ---------------- island top (golden sand + dunes) ---------------- */
function buildIsland(){
  const N=MOB?110:160,pos=[],nor=[],uv=[],idx=[],col=[];
  for(let j=0;j<=N;j++)for(let i=0;i<=N;i++){
    const u=i/N,v=j/N,th=u*TAU,rr0=Math.pow(v,.88)*rimR(th);
    const x=Math.cos(th)*rr0,z=Math.sin(th)*rr0,y=hAt(x,z);
    pos.push(x,y,z);uv.push(x*.42+5,z*.42+5);
    const n=nAt(x,z);nor.push(n.x,n.y,n.z);
    /* lit vs shade from a low sun from +X (golden hour) */
    const lit=cl(n.x*.75+n.y*.35+.15,0,1);
    const dl=Math.hypot(x-lakeC.x,z-lakeC.z);
    const wet=ss(lakeR*1.4,lakeR*.9,dl);
    const crest=cl((y-.2)*1.2,0,1);
    let r=.72+.16*lit+.08*crest,g=.55+.12*lit+.05*crest,b=.32+.05*lit;
    r=mix(r,.42,wet*.55);g=mix(g,.34,wet*.55);b=mix(b,.22,wet*.4);
    col.push(Math.min(.92,r),Math.min(.78,g),Math.min(.55,b))}
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){const a=j*(N+1)+i;idx.push(a,a+1,a+N+1,a+1,a+N+2,a+N+1)}
  const g=new T.BG();g.setAttribute("position",new T.BA(new Float32Array(pos),3));
  g.setAttribute("normal",new T.BA(new Float32Array(nor),3));
  g.setAttribute("uv",new T.BA(new Float32Array(uv),2));
  g.setAttribute("color",new T.BA(new Float32Array(col),3));g.setIndex(idx);
  /* fine isotropic grit + soft wind ripples (avoid parallel carpet stripes) */
  const sandMap=canvasTex(256,(x,y,S)=>{
    const nx=x/S,ny=y/S;
    const n=Math.sin((nx*1.7+ny*.3)*6.28)*.35+Math.sin((nx*.4-ny*1.9)*6.28)*.25+Math.sin((nx*2.3+ny*2.1)*6.28)*.15;
    const grit=Math.abs(Math.sin(x*1.7+y*2.3)*Math.sin(x*3.1-y*1.1));
    const v=158+n*14+grit*22+(Math.random()*10-5);return [Math.min(255,v*1.08),Math.min(255,v*.82),Math.min(255,v*.55)]},{repeat:[3.5,3.5]});
  const sandBump=canvasTex(128,(x,y,S)=>{
    const n=Math.sin((x*.11+y*.03)*6.28)+.5*Math.sin((x*.04-y*.12)*6.28)+.3*Math.sin(x*.31+y*.27);
    const v=128+n*28+(Math.random()*8-4);return [v,v,v]},{repeat:[6,6]});
  const m=M({map:sandMap,bumpMap:sandBump,bumpScale:.07,vertexColors:true,roughness:.9,metalness:0,color:new C3("#e0c090")});
  /* micro-sparkle in fragment */
  const prev=m.onBeforeCompile;m.onBeforeCompile=(sh,r)=>{
    if(prev)prev(sh,r);
    sh.fragmentShader=sh.fragmentShader.replace(
      '#include <map_fragment>',
      `#include <map_fragment>
       float spk=smoothstep(.82,.95,fract(sin(dot(vMapUv*140.,vec2(12.9898,78.233)))*43758.5453));
       diffuseColor.rgb+=spk*vec3(.18,.12,.05)*.35;`);
  };
  const mesh=new T.Mesh(g,m);mesh.receiveShadow=mesh.castShadow=true;return mesh}

/* ---------------- thick sandstone underside matching irregular rim ---------------- */
function buildUnderside(){
  const gRoot=new T.Group();
  const NR=MOB?72:96,NV=MOB?18:24;
  /* radial profile depths (yard-like thick taper) */
  const prof=[[0,-4.1],[.18,-3.9],[.35,-3.45],[.5,-2.85],[.62,-2.2],[.74,-1.55],[.84,-.95],[.92,-.45],[.97,-.12],[1.0,.02]];
  const pos=[],nor=[],uv=[],idx=[],col=[];
  for(let j=0;j<=NV;j++)for(let i=0;i<=NR;i++){
    const u=i/NR,v=j/NV,th=u*TAU;
    const p0=prof[Math.min(prof.length-2,(v*(prof.length-1))|0)],p1=prof[Math.min(prof.length-1,((v*(prof.length-1))|0)+1)];
    const fv=v*(prof.length-1)-((v*(prof.length-1))|0);const pr=mix(p0[0],p1[0],fv),py=mix(p0[1],p1[1],fv);
    const Rth=rimR(th)*1.02;
    let rad=pr*Rth;
    const deep=cl((-py)/4.1,0,1);
    const n1=Math.sin(th*4.7+py*1.8)*.1+Math.sin(th*8.3-py*2.6)*.06;
    const overhang=(deep>.18&&deep<.6)?Math.pow(Math.max(0,Math.sin(th*3.8+1.2)),2)*.18*deep:0;
    rad*=1+n1*.1*deep;rad-=overhang*Rth*.05;
    const y=py-Math.abs(n1)*.35*deep-Math.sin(th*6.5+py*3)*.12*deep;
    const x=Math.cos(th)*rad,z=Math.sin(th)*rad;
    pos.push(x,y,z);uv.push(u*4,deep*3);
    /* warm sandstone strata bands */
    const band=.5+.5*Math.sin(py*5.5+th*2);const shade=.42+.28*(1-deep)+band*.18+n1*.1;
    col.push(Math.min(.92,shade*1.35),Math.min(.7,shade*.88),Math.min(.48,shade*.55))}
  for(let j=0;j<NV;j++)for(let i=0;i<NR;i++){const a=j*(NR+1)+i;idx.push(a,a+NR+1,a+1,a+1,a+NR+1,a+NR+2)}
  const geo=new T.BG();geo.setAttribute("position",new T.BA(new Float32Array(pos),3));
  geo.setAttribute("uv",new T.BA(new Float32Array(uv),2));geo.setAttribute("color",new T.BA(new Float32Array(col),3));
  geo.setIndex(idx);geo.computeVertexNormals();
  const rockMap=canvasTex(256,(x,y)=>{
    const strata=.5+.5*Math.sin(y*.18+Math.sin(x*.05)*1.5);
    const crack=Math.abs(Math.sin(x*.07+y*.03)*Math.sin(x*.02-y*.09));
    const grit=(Math.random()*.5+.5);
    const v=95+strata*40+crack*25+grit*12;return [v*1.2,v*.78,v*.48]},{repeat:[1,1]});
  const rockM=M({map:rockMap,vertexColors:true,roughness:.97,metalness:0,color:new C3("#c48452")});
  rockM.onBeforeCompile=(sh)=>{
    sh.fragmentShader=sh.fragmentShader.replace('#include <map_fragment>',
      `#include <map_fragment>
       float st=smoothstep(.25,.75,sin(vMapUv.y*28.+vMapUv.x*2.5)*.5+.5);
       diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(1.12,.95,.78),st*.4);`);
  };
  const cliff=new T.Mesh(geo,rockM);cliff.castShadow=cliff.receiveShadow=true;gRoot.add(cliff);
  for(let i=0;i<22;i++){
    const th=rnd()*TAU,deep=rr(.15,.9),Rth=rimR(th);
    const rad=Rth*(.55+deep*.35);
    const y=-deep*3.6+rr(-.25,.15);
    const b=new T.Mesh(new T.Sphere(rr(.22,.6),MOB?6:8,MOB?5:6),M({color:new C3().setHSL(.06,rr(.3,.45),rr(.3,.42)),roughness:.96,flatShading:true}));
    b.scale.set(rr(.8,1.4),rr(.45,.85),rr(.8,1.3));
    b.position.set(Math.cos(th)*rad,y,Math.sin(th)*rad);b.castShadow=true;gRoot.add(b)}
  return gRoot}

const island=buildIsland(),under=buildUnderside();root.add(island);root.add(under);

/* ---------------- oasis lake ---------------- */
const lakeY=-.02;
const lakeG=new T.BG();
{const N=56,pos=[],uv=[];for(let j=0;j<=N;j++)for(let i=0;i<=N;i++){
  const u=i/N,v=j/N,th=u*TAU;const e=.92+.08*Math.sin(th*3.5);const rr0=v*lakeR*e;
  const x=lakeC.x+Math.cos(th)*rr0,z=lakeC.z+Math.sin(th)*rr0;pos.push(x,lakeY,z);uv.push(u,v)}
 const idx=[];for(let j=0;j<N;j++)for(let i=0;i<N;i++){const a=j*(N+1)+i;idx.push(a,a+1,a+N+1,a+1,a+N+2,a+N+1)}
 lakeG.setAttribute("position",new T.BA(new Float32Array(pos),3));lakeG.setAttribute("uv",new T.BA(new Float32Array(uv),2));lakeG.setIndex(idx);lakeG.computeVertexNormals()}
const lakeU={uT:{value:0},uWind:{value:.35},uNight:{value:0},uSunDir:{value:new V3(.6,.2,.2)},uSunCol:{value:new C3(1,.72,.42)},uMoonC:{value:new C3(.55,.68,.95)},uSky:{value:new C3(.95,.55,.42)},uDeep:{value:new C3(.02,.48,.52)},uShal:{value:new C3(.25,.82,.78)}};
const lakeM=new T.SM({transparent:true,depthWrite:false,uniforms:lakeU,
 vertexShader:`varying vec3 vW;varying vec2 vUv;void main(){vUv=uv;vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
 fragmentShader:`uniform float uT,uWind,uNight;uniform vec3 uSunDir,uSunCol,uMoonC,uSky,uDeep,uShal;varying vec3 vW;varying vec2 vUv;
 void main(){
  float r=length(vUv-.5)*2.;if(r>1.02)discard;
  float edge=smoothstep(1.02,.84,r);
  float w=uWind;vec2 p=vW.xz*.85;
  float rip=.018*(sin(p.x*5.5+uT*.55)+sin(p.y*4.8-uT*.48)+.55*sin((p.x+p.y)*8.5+uT*.7));
  rip*=(.35+.65*w)*edge;
  vec3 N=normalize(vec3(-rip*18.,1.,rip*14.));
  vec3 V=normalize(cameraPosition-vW);
  float fres=pow(max(1e-4,1.-max(0.,dot(N,V))),2.8);
  float depth=smoothstep(1.,.15,r);
  vec3 water=mix(uShal,uDeep,depth);
  vec3 Rdir=reflect(-V,N);
  vec3 skyR=mix(uSky,uSunCol,.2+.35*max(0.,Rdir.y));
  /* palm-green tint in reflection near shore */
  skyR=mix(skyR,vec3(.25,.55,.3),smoothstep(.55,.95,r)*.18);
  vec3 col=mix(water,skyR,.22+.58*fres);
  col+=uMoonC*uNight*(.1+.3*fres);
  float sunSpec=pow(max(1e-4,dot(reflect(-normalize(uSunDir),N),V)),70.)*(.2+.35*(1.-uNight));
  col+=uSunCol*sunSpec;
  float a=min(1.,(.78+.2*depth)*edge+.45*fres*edge);
  gl_FragColor=vec4(col,a);
  #include <colorspace_fragment>
 }`});
const lake=new T.Mesh(lakeG,lakeM);lake.renderOrder=2;root.add(lake);
const lakeBed=new T.Mesh(lakeG.clone(),M({color:"#0e4a48",roughness:1}));lakeBed.position.y=-.1;lakeBed.scale.set(1.04,1,1.04);root.add(lakeBed);
/* wet sand ring */
(function wetRing(){
  const N=64,pos=[],idx=[],col=[];
  for(let i=0;i<=N;i++){
    const th=i/N*TAU,e=.92+.08*Math.sin(th*3.5);
    for(let k=0;k<2;k++){const rad=lakeR*(k?1.32:1.0)*e;const x=lakeC.x+Math.cos(th)*rad,z=lakeC.z+Math.sin(th)*rad;
      pos.push(x,hAt(x,z)+.01,z);col.push(.38-k*.04,.28-k*.03,.18)}}
  for(let i=0;i<N;i++){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2)}
  const g=new T.BG();g.setAttribute("position",new T.BA(new Float32Array(pos),3));g.setAttribute("color",new T.BA(new Float32Array(col),3));g.setIndex(idx);g.computeVertexNormals();
  const m=new T.Mesh(g,M({vertexColors:true,roughness:.78,metalness:.05}));m.receiveShadow=true;root.add(m)})();

/* grass + reeds rim */
const reedG=new T.Group();root.add(reedG);
(function makeShoreGreen(){
  const grassM=M({color:"#3d9a48",roughness:.88,side:2});
  const reedM=M({color:"#2f7a38",roughness:.9,side:2});
  for(let i=0;i<120;i++){
    const a=rnd()*TAU,r=lakeR*(.95+rr(0,.38)),e=.92+.08*Math.sin(a*3.5);
    const x=lakeC.x+Math.cos(a)*r*e,z=lakeC.z+Math.sin(a)*r*e;
    if(Math.hypot(x,z)>R-0.35)continue;
    const y=Math.max(hAt(x,z),lakeY);
    if(rnd()<.55){
      const blade=new T.Mesh(new T.Plane(rr(.04,.08),rr(.18,.38)),grassM);
      blade.position.set(x,y+blade.geometry.parameters.height*.5,z);blade.rotation.y=rnd()*TAU;blade.rotation.z=rr(-.2,.2);blade.castShadow=true;blade.userData.ph=rnd()*TAU;reedG.add(blade);
    }else{
      const g=new T.Cyl(.008,.003,rr(.4,.7),4,1,true);g.translate(0,.3,0);
      const b=new T.Mesh(g,reedM);b.position.set(x,y,z);b.rotation.y=rnd()*TAU;b.rotation.z=rr(-.15,.15);b.scale.setScalar(rr(.8,1.3));b.userData.ph=rnd()*TAU;reedG.add(b)}}
})();

/* ---------------- sandstone rocks + dry shrubs ---------------- */
const rockG=new T.Group();root.add(rockG);
(function makeRocks(){
  for(let i=0;i<(MOB?22:34);i++){
    const a=rnd()*TAU,rad=Math.sqrt(rnd())*R*.92;let x=Math.cos(a)*rad,z=Math.sin(a)*rad;
    if(Math.hypot(x-lakeC.x,z-lakeC.z)<lakeR*1.25)continue;
    const y=hAt(x,z),s=rr(.1,.42);
    const o=new T.Mesh(new T.Sphere(1,MOB?6:8,MOB?5:6),M({color:new C3().setHSL(.08,rr(.45,.6),rr(.22,.34)),roughness:.96,flatShading:true}));
    o.scale.set(s*rr(.9,1.5),s*rr(.2,.42),s*rr(.9,1.4));
    o.position.set(x,y-s*.12,z);o.rotation.set(rr(0,.8),rr(0,TAU),rr(0,.8));o.castShadow=o.receiveShadow=true;rockG.add(o)}
})();
const shrubs=[];
(function makeShrubs(){
  for(let i=0;i<(MOB?16:24);i++){
    const a=rnd()*TAU,rad=Math.sqrt(rnd())*R*.85;const x=Math.cos(a)*rad,z=Math.sin(a)*rad;
    if(Math.hypot(x-lakeC.x,z-lakeC.z)<lakeR*1.35)continue;
    const y=hAt(x,z),g=new T.Group();
    const m=M({color:new C3().setHSL(.14,rr(.2,.35),rr(.28,.38)),roughness:.92,flatShading:true});
    for(let k=0;k<6;k++){const b=new T.Mesh(new T.Sphere(rr(.08,.16),5,4),m);b.position.set(rr(-.18,.18),rr(.05,.2),rr(-.18,.18));g.add(b)}
    /* dry tuft spikes */
    for(let k=0;k<4;k++){const t=new T.Mesh(new T.Cyl(.005,.001,rr(.15,.28),3),m);t.position.set(rr(-.1,.1),rr(.12,.22),rr(-.1,.1));t.rotation.z=rr(-.4,.4);g.add(t)}
    g.position.set(x,y,z);root.add(g);shrubs.push({x,z,y,o:g})}
})();

/* ---------------- date palms (pinnate fronds) ---------------- */
function makePalm(){
  const g=new T.Group();
  const trunkM=M({color:"#6a4530",roughness:.9}),ringM=M({color:"#5a3828",roughness:.92});
  const leafM=M({color:"#1f6a2e",roughness:.78,side:2}),dateM=M({color:"#7a3a18",roughness:.85});
  const segs=11;let px=0,py=0,pz=0,lean=rr(.05,.12);
  for(let i=0;i<segs;i++){
    const h=.32,r0=.12-i*.0075,cyl=new T.Mesh(new T.Cyl(r0,r0*.94,h,8),i%2?ringM:trunkM);
    px+=lean*(i/(segs-1));py+=h;cyl.position.set(px,py-h*.5,pz);cyl.rotation.z=lean;cyl.castShadow=true;g.add(cyl)}
  const crown=new T.Group();crown.position.set(px,py+.02,pz);g.add(crown);
  const nFrond=MOB?14:18;
  for(let i=0;i<nFrond;i++){
    const fr=new T.Group();fr.rotation.y=i/nFrond*TAU+rr(-.04,.04);
    fr.rotation.x=rr(.55,.95);fr.userData.ph=rnd()*TAU;fr.userData.baseX=fr.rotation.x;
    const rachisLen=rr(1.3,1.7);
    const rachis=new T.Mesh(new T.Cyl(.01,.003,rachisLen,4),leafM);rachis.position.z=rachisLen*.5;rachis.rotation.x=Math.PI/2;fr.add(rachis);
    const nLeaf=MOB?10:14;
    for(let k=0;k<nLeaf;k++){
      const along=.08+k/(nLeaf-1)*(rachisLen*.92),side=k%2?1:-1,len=rr(.32,.5)*(1-k/nLeaf*.3);
      const lf=new T.Mesh(new T.Plane(rr(.1,.16),len),leafM);
      lf.position.set(side*rr(.03,.07),0,along);
      lf.rotation.z=side*rr(.85,1.25);lf.rotation.y=side*rr(.15,.4);lf.rotation.x=rr(-.05,.25);fr.add(lf)}
    crown.add(fr)}
  for(let i=0;i<4;i++){const d=new T.Mesh(new T.Sphere(.06,6,5),dateM);d.scale.set(1,1.8,1);d.position.set(Math.cos(i*1.7)*.14,-.2,Math.sin(i*1.7)*.14);crown.add(d)}
  g.userData={crown,kind:"palm"};return g}
const palms=[];
(function placePalms(){
  const spots=[{x:lakeC.x+1.05,z:lakeC.z+.55,s:1.08},{x:lakeC.x+1.55,z:lakeC.z-.15,s:.95},{x:lakeC.x+.7,z:lakeC.z-.95,s:.82}];
  spots.forEach(sp=>{const p=makePalm();p.scale.setScalar(sp.s);p.position.set(sp.x,hAt(sp.x,sp.z),sp.z);p.rotation.y=rr(0,TAU);onDes(p);root.add(p);palms.push(p);
    tryModel(MODEL.palm,()=>null).then(r=>{if(r.src==="glb"&&r.root)adoptGLB(p,r.root)})})
})();

/* ---------------- saguaros (3–5, dusty sage, ribbed, one perch) ---------------- */
function makeCactus(opts){
  opts=opts||{};const g=new T.Group();
  const col=new C3().setHSL(.27,rr(.12,.2),rr(.28,.36)); /* dusty sage */
  const m=M({color:col,roughness:.92,flatShading:false});
  const H=opts.h||rr(1.5,2.2),R0=opts.r||rr(.12,.17);
  /* ribbed column via lathe-ish cylinder + vertex push */
  const trunk=new T.Mesh(new T.Cyl(R0,R0*1.05,H,MOB?10:14,1),m);
  const pa=trunk.geometry.attributes.position.array;
  for(let i=0;i<pa.length;i+=3){const th=Math.atan2(pa[i+2],pa[i]);const rib=.012*Math.sin(th*8);const rr2=Math.hypot(pa[i],pa[i+2])+rib;pa[i]=Math.cos(th)*rr2;pa[i+2]=Math.sin(th)*rr2}
  trunk.geometry.computeVertexNormals();trunk.position.y=H*.5;trunk.castShadow=true;g.add(trunk);
  /* flat-ish crown for perch */
  if(opts.perch){const top=new T.Mesh(new T.Sphere(R0*1.05,10,6),m);top.scale.set(1,.35,1);top.position.y=H;g.add(top);g.userData.perch={x:0,y:H+.04,z:0}}
  else{const top=new T.Mesh(new T.Sphere(R0*.95,8,6),m);top.scale.set(1,.55,1);top.position.y=H*.98;g.add(top);g.userData.perch={x:0,y:H,z:0}}
  /* rounded arm bends */
  const arms=opts.arms!=null?opts.arms:(rnd()<.7?2:1);
  for(let i=0;i<arms;i++){
    const side=i%2?1:-1,ah=rr(H*.35,H*.55),arm=new T.Group();
    const a1=new T.Mesh(new T.Cyl(R0*.55,R0*.55,rr(.35,.5),10),m);a1.rotation.z=side*Math.PI/2;a1.position.set(side*R0*.9,0,0);arm.add(a1);
    const a2=new T.Mesh(new T.Cyl(R0*.5,R0*.48,rr(.45,.75),10),m);a2.position.set(side*R0*.9+(side*.2),rr(.35,.55),0);arm.add(a2);
    const tip=new T.Mesh(new T.Sphere(R0*.5,8,6),m);tip.position.copy(a2.position);tip.position.y+=a2.geometry.parameters.height*.45;arm.add(tip);
    arm.position.y=ah;arm.rotation.y=rr(-.4,.4)+i;g.add(arm)}
  return g}
const cacti=[];
(function placeCacti(){
  const spots=[
    {x:-5.2,z:2.0,h:2.35,r:.17,perch:1,arms:2},
    {x:3.8,z:1.6,h:1.7,r:.14,arms:2},
    {x:4.6,z:-2.8,h:1.9,r:.15,arms:1},
    {x:-3.6,z:-3.2,h:1.55,r:.13,arms:2},
    {x:1.2,z:3.5,h:1.4,r:.12,arms:1}
  ];
  spots.forEach(sp=>{if(Math.hypot(sp.x,sp.z)>R-0.7)return;if(Math.hypot(sp.x-lakeC.x,sp.z-lakeC.z)<lakeR*1.4)return;
    const c=makeCactus(sp);c.position.set(sp.x,hAt(sp.x,sp.z),sp.z);c.rotation.y=rr(0,TAU);c.scale.setScalar(rr(.9,1.05));onDes(c);root.add(c);cacti.push(c);
    tryModel(MODEL.cactus,()=>null).then(r=>{if(r.src==="glb"&&r.root)adoptGLB(c,r.root)})});
})();
const eaglePerch=cacti.find(c=>c.userData.perch&&c.userData.perch.y>2)||cacti[0];

/* ---------------- Bedouin tent + campfire ---------------- */
function makeTentProcedural(){
  const g=new T.Group();
  const clothMap=canvasTex(128,(x,y)=>{
    const band=((y/10)|0)%2;const v=band?205:168;return [v,v*.86-band*8,v*.58]},{repeat:[2,3]});
  const cloth=M({map:clothMap,color:"#c9a66e",roughness:.88,side:2});
  const poleM=M({color:"#4a3020",roughness:.9}),ropeM=M({color:"#6a5438",roughness:.95}),rugM=M({color:"#8b3a28",roughness:.9});
  const w=1.7,d=1.35,ridge=1.25;
  /* peaked roof as two BufferGeometry panels meeting at ridge */
  function roofPanel(sign){
    const geo=new T.BG();const p=new Float32Array([
      0,ridge,d*.5,  sign*w*.5,.18,d*.5,  sign*w*.5,.18,-d*.5,
      0,ridge,d*.5,  sign*w*.5,.18,-d*.5,  0,ridge,-d*.5]);
    const uvs=new Float32Array([0,1, 1,1, 1,0,  0,1, 1,0, 0,0]);
    geo.setAttribute("position",new T.BA(p,3));geo.setAttribute("uv",new T.BA(uvs,2));geo.computeVertexNormals();
    const m=new T.Mesh(geo,cloth);m.castShadow=m.receiveShadow=true;return m}
  const roofL=roofPanel(-1),roofR=roofPanel(1);g.add(roofL);g.add(roofR);
  const back=new T.Mesh(new T.Plane(w*.98,ridge*1.05,6,4),cloth);back.position.set(0,ridge*.48,-d*.48);back.castShadow=true;g.add(back);
  /* side skirts */
  const sL=new T.Mesh(new T.Plane(d*.95,ridge*.9,4,4),cloth);sL.position.set(-w*.48,ridge*.42,0);sL.rotation.y=Math.PI/2;g.add(sL);
  const sR=new T.Mesh(new T.Plane(d*.95,ridge*.9,4,4),cloth);sR.position.set(w*.48,ridge*.42,0);sR.rotation.y=Math.PI/2;g.add(sR);
  g.userData.cloths=[roofL,roofR,back,sL,sR];
  [[-w*.4,0,-d*.4],[w*.4,0,-d*.4],[-w*.4,0,d*.4],[w*.4,0,d*.4],[0,0,0]].forEach(([x,_,z],i)=>{
    const h=i===4?ridge*1.05:ridge*.92;const p=new T.Mesh(new T.Cyl(.028,.022,h,5),poleM);p.position.set(x,h*.5,z);p.castShadow=true;g.add(p)});
  [[-w*.62,d*.62],[w*.62,d*.62],[-w*.62,-d*.62],[w*.62,-d*.62]].forEach(([x,z])=>{
    const peg=new T.Mesh(new T.Cyl(.018,.018,.07,5),poleM);peg.position.set(x,.02,z);g.add(peg);
    const dx=x*.35,dz=z*.35,len=Math.hypot(x-dx,ridge*.7,z-dz);
    const rope=new T.Mesh(new T.Cyl(.007,.007,len,4),ropeM);rope.position.set((x+dx)*.5,ridge*.35,(z+dz)*.5);
    rope.lookAt(x,.02,z);rope.rotateX(Math.PI/2);g.add(rope)});
  const rug=new T.Mesh(new T.Plane(1.0,.6),rugM);rug.rotation.x=-Math.PI/2;rug.position.set(0,.018,d*.58);g.add(rug);
  const rug2=new T.Mesh(new T.Plane(.5,.4),M({color:"#5a3a22",roughness:.92}));rug2.rotation.x=-Math.PI/2;rug2.position.set(.4,.015,d*.38);g.add(rug2);
  return g}
const tentAnchor={x:2.35,z:-2.15};
const tentY=hAt(tentAnchor.x,tentAnchor.z);
let tent=makeTentProcedural();tent.position.set(tentAnchor.x,tentY,tentAnchor.z);tent.rotation.y=-.65;onDes(tent);root.add(tent);
tryModel(MODEL.tent,()=>({skip:1})).then(r=>{if(r.src==="glb"&&r.root){r.root.scale.multiplyScalar(1.05);adoptGLB(tent,r.root)}});

/* campfire */
const fireG=new T.Group();const firePos={x:tentAnchor.x-.15,z:tentAnchor.z+1.15};
fireG.position.set(firePos.x,hAt(firePos.x,firePos.z),firePos.z);root.add(fireG);
(function makeFire(){
  const stoneM=M({color:"#6a5a4a",roughness:.95}),logM=M({color:"#3a2415",roughness:.95});
  for(let i=0;i<7;i++){const s=new T.Mesh(new T.Sphere(rr(.06,.1),6,5),stoneM);const a=i/7*TAU;s.position.set(Math.cos(a)*.28,0.04,Math.sin(a)*.28);s.scale.set(1,.55,1);fireG.add(s)}
  for(let i=0;i<3;i++){const log=new T.Mesh(new T.Cyl(.04,.05,.32,5),logM);log.rotation.z=Math.PI/2;log.rotation.y=i*TAU/3;log.position.y=.05;fireG.add(log)}
  const glow=new T.Mesh(new T.Sphere(.14,8,6),M({color:"#ff8a3a",roughness:1,emissive:"#ff6a20",emissiveIntensity:1.4,transparent:true,opacity:.85}));
  glow.position.y=.2;fireG.add(glow);fireG.userData.glow=glow;
  const fireL=new T.PL(new C3("#ff9a4a"),0,6.5,2);fireL.position.set(0,.4,0);fireL.layers.mask=L3;fireG.add(fireL);fireG.userData.light=fireL;
  /* tent interior warm fill */
  const tentL=new T.PL(new C3("#ffb070"),0,4,2);tentL.position.set(.15,.55,-.2);tentL.layers.mask=L3;fireG.add(tentL);fireG.userData.tentL=tentL;
})();
const SMN=MOB?56:90,smP=new Float32Array(SMN*3),smA=new Float32Array(SMN),smG=new T.BG();
smG.setAttribute("position",new T.BA(smP,3));smG.setAttribute("a",new T.BA(smA,1));
const smM=new T.SM({transparent:true,depthWrite:false,uniforms:{col:{value:new C3(.82,.8,.78)},scale:{value:1}},
 vertexShader:`attribute float a;varying float vA;uniform float scale;void main(){vA=a;vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=max(2.,scale*20./max(.5,-mv.z));}`,
 fragmentShader:`uniform vec3 col;varying float vA;void main(){float d=length(gl_PointCoord-.5);float s=smoothstep(.5,.0,d);gl_FragColor=vec4(col,vA*s*.5);}`});
const smoke=new T.Points(smG,smM);smoke.frustumCulled=false;smoke.renderOrder=5;root.add(smoke);
const SMF=[];for(let i=0;i<SMN;i++)SMF.push({x:0,y:rr(0,2),z:0,v:rr(.25,.55),life:rnd(),ph:rnd()*TAU});

/* ---------------- camel (better anatomy) ---------------- */
function makeCamelProcedural(){
  const g=new T.Group();
  const fur=M({color:"#c49a6c",roughness:.9}),dark=M({color:"#6a4a32",roughness:.88}),pad=M({color:"#3a2a1c",roughness:.95});
  const body=new T.Mesh(new T.Sphere(1,12,10),fur);body.scale.set(.5,.38,.95);body.position.y=1.25;body.castShadow=true;g.add(body);
  const hump=new T.Mesh(new T.Sphere(.32,10,8),fur);hump.position.set(0,1.72,-.05);hump.scale.set(1.05,1.35,.95);g.add(hump);
  const neck=new T.Group();neck.position.set(0,1.28,.55);g.add(neck);
  const n1=new T.Mesh(new T.Cyl(.1,.08,.7,8),fur);n1.position.set(0,.32,.22);n1.rotation.x=.85;n1.castShadow=true;neck.add(n1);
  const head=new T.Group();head.position.set(0,.72,.52);neck.add(head);
  const hd=new T.Mesh(new T.Sphere(.15,8,7),fur);hd.scale.set(.95,.7,1.4);hd.castShadow=true;head.add(hd);
  const sn=new T.Mesh(new T.Sphere(.075,6,5),dark);sn.position.set(0,-.02,.22);sn.scale.set(1,.65,1.25);head.add(sn);
  [[.09,.11,.02],[-.09,.11,.02]].forEach(([x,y,z])=>{const e=new T.Mesh(new T.Sphere(.035,5,4),fur);e.position.set(x,y,z);e.scale.set(.45,1.35,.35);head.add(e)});
  const legs=[];
  [[.22,.4],[.22,-.5],[-.22,.4],[-.22,-.5]].forEach(([lx,lz])=>{
    const L=new T.Group();L.position.set(lx,1.2,lz);g.add(L);
    const up=new T.Mesh(new T.Cyl(.07,.06,.48,8),fur);up.position.y=-.2;up.castShadow=true;L.add(up);
    const knee=new T.Mesh(new T.Sphere(.07,7,6),dark);knee.position.y=-.46;L.add(knee);
    const lo=new T.Mesh(new T.Cyl(.055,.045,.5,7),fur);lo.position.y=-.72;L.add(lo);
    const foot=new T.Mesh(new T.Sphere(.08,6,4),pad);foot.scale.set(1.35,.5,1.55);foot.position.y=-1.0;L.add(foot);
    legs.push({L,up,lo,knee,foot,side:lx>0?1:-1,fore:lz>0?1:0})});
  const tail=new T.Mesh(new T.Cyl(.028,.008,.5,5),dark);tail.position.set(0,1.15,-.95);tail.rotation.x=.65;g.add(tail);
  g.userData={neck,head,legs,body,kind:"camel"};return g}
function plantFeet(cam,x,z,facing){
  const legs=cam.userData.legs;if(!legs||cam.userData.useGlb){cam.position.set(x,hAt(x,z),z);cam.rotation.y=facing;return}
  let sum=0;legs.forEach(lg=>{
    const wx=x+Math.cos(facing)*lg.L.position.z+Math.sin(facing)*lg.L.position.x;
    const wz=z+Math.sin(facing)*lg.L.position.z-Math.cos(facing)*lg.L.position.x;sum+=hAt(wx,wz)});
  const base=sum/legs.length;cam.position.set(x,base,z);cam.rotation.y=facing;
  legs.forEach(lg=>{
    const wx=x+Math.cos(facing)*lg.L.position.z+Math.sin(facing)*lg.L.position.x;
    const wz=z+Math.sin(facing)*lg.L.position.z-Math.cos(facing)*lg.L.position.x;
    lg.L.position.y=1.2+(hAt(wx,wz)-base)*.35})}
const camels=[];
function spawnCamel(x,z,facing){
  const c=makeCamelProcedural();c.scale.setScalar(.92);plantFeet(c,x,z,facing);onDes(c);root.add(c);
  const st={o:c,x,z,facing,mode:"walk",t:rr(0,8),speed:.52,tx:x,tz:z,drink:0,graze:0,step:rnd()*TAU};
  camels.push(st);
  tryModel(MODEL.camel,()=>null).then(r=>{if(r.src==="glb"&&r.root){adoptGLB(c,r.root);st.glb=r.root}});
  return st}
spawnCamel(-4.4,2.8,0.5);spawnCamel(-5.3,1.1,-2.0);

function camelUpdate(st,dt,t){
  st.t+=dt;const c=st.o,ud=c.userData;
  if(st.mode==="walk"&&st.t>5){st.mode=rnd()<.45?"graze":rnd()<.5?"drink":"walk";st.t=0;
    if(st.mode==="graze"){const sh=shrubs[(Math.random()*shrubs.length)|0];st.tx=sh.x;st.tz=sh.z}
    else if(st.mode==="drink"){const a=rnd()*TAU;st.tx=lakeC.x+Math.cos(a)*lakeR*1.08;st.tz=lakeC.z+Math.sin(a)*lakeR*1.08}
    else{const a=rnd()*TAU,rad=rr(2.2,R*.65);st.tx=Math.cos(a)*rad;st.tz=Math.sin(a)*rad}}
  if(st.mode==="walk"||st.mode==="graze"||st.mode==="drink"){
    const dx=st.tx-st.x,dz=st.tz-st.z,dist=Math.hypot(dx,dz);
    if(dist>.28){const want=Math.atan2(dx,dz);let dth=((want-st.facing+Math.PI*3)%TAU)-Math.PI;st.facing+=dth*ease(3,dt);
      const sp=st.speed*(st.mode==="walk"?1:.7);st.x+=Math.sin(st.facing)*sp*dt;st.z+=Math.cos(st.facing)*sp*dt;
      st.step+=dt*sp*6.2;
      if(!ud.useGlb)ud.legs.forEach(lg=>{const pace=st.step+(lg.side>0?0:Math.PI);const swing=Math.sin(pace);lg.L.rotation.x=swing*.5;lg.lo.rotation.x=Math.max(0,-swing)*.4});
      if(!ud.useGlb)ud.neck.rotation.x=ss(0,1,Math.sin(t*.7)*.1)}
    else{
      if(!ud.useGlb)ud.legs.forEach(lg=>{lg.L.rotation.x*=1-ease(6,dt);lg.lo.rotation.x*=1-ease(6,dt)});
      if(st.mode==="graze"){st.graze+=dt;if(!ud.useGlb){ud.neck.rotation.x=ss(0,1,Math.min(1,st.graze*1.5))*1.15;ud.head.rotation.x=Math.sin(t*3)*.08}if(st.graze>4){st.mode="walk";st.t=0;st.graze=0}}
      else if(st.mode==="drink"){st.drink+=dt;if(!ud.useGlb)ud.neck.rotation.x=ss(0,1,Math.min(1,st.drink))*1.4;if(st.drink>5){st.mode="walk";st.t=0;st.drink=0}}
      else{st.mode="walk";st.t=0}}}
  plantFeet(c,st.x,st.z,st.facing);
  if(st.mode==="drink"&&st.drink>0)c.position.y=hAt(st.x,st.z)-ss(0,1,Math.min(1,st.drink*.8))*.22}

/* ---------------- eagle with primary feather tips ---------------- */
function makeEagleProcedural(){
  const g=new T.Group();
  const bodyM=M({color:"#6b4a32",roughness:.85}),wingM=M({color:"#4a3424",roughness:.88,side:2});
  const headM=M({color:"#cfc6b8",roughness:.8}),beakM=M({color:"#d4a03a",roughness:.7}),primM=M({color:"#2a1c14",roughness:.9,side:2});
  const body=new T.Mesh(new T.Sphere(.17,8,6),bodyM);body.scale.set(1,.7,1.55);body.castShadow=true;g.add(body);
  const head=new T.Mesh(new T.Sphere(.095,6,5),headM);head.position.set(0,.04,.22);g.add(head);
  const beak=new T.Mesh(new T.Cone(.035,.11,5),beakM);beak.rotation.x=Math.PI/2;beak.position.set(0,0,.33);g.add(beak);
  const wingL=new T.Group(),wingR=new T.Group();
  function buildWing(side){
    const W=side<0?wingL:wingR;W.position.set(0,.04,0);g.add(W);
    const wl=new T.Mesh(new T.Plane(.7,.26),wingM);wl.position.set(side*.38,0,0);W.add(wl);
    /* primaries */
    for(let i=0;i<6;i++){const p=new T.Mesh(new T.Plane(.05,.22),primM);
      p.position.set(side*(.7+i*.04),-.02,-.02-i*.015);p.rotation.z=side*(.15+i*.08);p.rotation.x=-.1;W.add(p)}
    return W}
  buildWing(-1);buildWing(1);
  const tail=new T.Mesh(new T.Plane(.2,.28),wingM);tail.position.set(0,0,-.3);tail.rotation.x=.4;g.add(tail);
  g.userData={wingL,wingR,head,body,spread:1};return g}
const eagle={o:makeEagleProcedural(),mode:"soar",t:0,th:rnd()*TAU,rad:5.2,alt:4.2,bank:0,flap:0,drink:0,cry:0};
eagle.o.scale.setScalar(1.05);root.add(eagle.o);onDes(eagle.o);
tryModel(MODEL.eagle,()=>null).then(r=>{if(r.src==="glb"&&r.root){adoptGLB(eagle.o,r.root);eagle.glb=r.root}});

function eagleUpdate(dt,t){
  const e=eagle,o=e.o,ud=o.userData;e.t+=dt;
  if(e.mode==="soar"){
    e.th+=dt*.2;e.rad=5.0+.55*Math.sin(t*.15);e.alt=3.6+.7*Math.sin(t*.2);
    e.flap+=dt;const flapping=Math.sin(e.flap*8)>0&&(e.flap%6)<.4;
    if(!ud.useGlb){ud.wingL.rotation.z=flapping?Math.sin(e.flap*16)*.45:-.1;ud.wingR.rotation.z=flapping?-Math.sin(e.flap*16)*.45:.1}
    const x=Math.cos(e.th)*e.rad,z=Math.sin(e.th)*e.rad,y=e.alt+Math.max(0,hAt(0,0));
    const px=o.position.x,pz=o.position.z;o.position.set(x,y,z);
    o.rotation.y=Math.atan2(x-px,z-pz);o.rotation.z=cl(Math.cos(e.th)*.28,-.5,.5);
    if(e.t>10){e.t=0;e.mode=rnd()<.6?"landPerch":"landDrink"}}
  else if(e.mode==="landPerch"||e.mode==="landDrink"){
    let tx,ty,tz;
    if(e.mode==="landPerch"&&eaglePerch){const p=eaglePerch.position,tip=eaglePerch.userData.perch,s=eaglePerch.scale.x;tx=p.x;tz=p.z;ty=p.y+tip.y*s+.05}
    else{tx=lakeC.x+lakeR*1.08;tz=lakeC.z+.2;ty=Math.max(hAt(tx,tz),lakeY)+.14}
    const k=ease(1.15,dt);o.position.x+=(tx-o.position.x)*k;o.position.y+=(ty-o.position.y)*k;o.position.z+=(tz-o.position.z)*k;
    const dist=Math.hypot(tx-o.position.x,ty-o.position.y,tz-o.position.z);
    if(!ud.useGlb){ud.wingL.rotation.z=-.4-ss(1.5,0,dist)*.45;ud.wingR.rotation.z=.4+ss(1.5,0,dist)*.45}
    if(dist<.2){e.mode=e.mode==="landPerch"?"perch":"drink";e.t=0;o.position.set(tx,ty,tz);o.rotation.set(0,o.rotation.y,0);
      if(!ud.useGlb){ud.wingL.rotation.z=-.02;ud.wingR.rotation.z=.02;ud.wingL.rotation.x=.15;ud.wingR.rotation.x=.15}}}
  else if(e.mode==="perch"){
    if(!ud.useGlb){ud.head.rotation.y=Math.sin(t*.7)*.55;ud.wingL.rotation.z=-.02;ud.wingR.rotation.z=.02}
    if(e.t>7){e.mode="takeoff";e.t=0}}
  else if(e.mode==="drink"){
    if(!ud.useGlb)ud.head.rotation.x=ss(0,1,Math.min(1,e.t*2))*.85;if(e.t>4){e.mode="takeoff";e.t=0}}
  else if(e.mode==="takeoff"){
    if(!ud.useGlb){ud.wingL.rotation.z=-Math.sin(e.t*14)*.65;ud.wingR.rotation.z=Math.sin(e.t*14)*.65;ud.wingL.rotation.x=0;ud.wingR.rotation.x=0}
    o.position.y+=dt*2.6;o.position.x+=Math.sin(o.rotation.y)*dt*1.6;o.position.z+=Math.cos(o.rotation.y)*dt*1.6;
    if(e.t>1.4){e.mode="soar";e.t=0;e.th=Math.atan2(o.position.x,o.position.z);e.cry=1}}
}

/* ---------------- snakes ---------------- */
function makeSnakeProcedural(){
  const g=new T.Group();const segs=[];
  for(let i=0;i<20;i++){
    const t=i/19,r=.07*(1-t*.75);
    const m=M({color:new C3().setHSL(.1,.35,.35+((i%3)*.06)),roughness:.9});
    const s=new T.Mesh(new T.Sphere(r,6,5),m);s.castShadow=true;g.add(s);segs.push(s)}
  g.userData={segs,kind:"snake"};return g}
const snakes=[];
function spawnSnake(){
  const a=rnd()*TAU,rad=rr(2.5,R*.62);const s={o:makeSnakeProcedural(),x:Math.cos(a)*rad,z:Math.sin(a)*rad,th:rnd()*TAU,mode:"sidewind",t:0,pts:[]};
  root.add(s.o);onDes(s.o);snakes.push(s);
  tryModel(MODEL.snake,()=>null).then(r=>{if(r.src==="glb"&&r.root){adoptGLB(s.o,r.root);s.glb=r.root}})}
spawnSnake();if(!MOB)spawnSnake();

const TRN=220,trP=new Float32Array(TRN*3),trA=new Float32Array(TRN),trG=new T.BG();let trI=0;
trG.setAttribute("position",new T.BA(trP,3));trG.setAttribute("a",new T.BA(trA,1));
const trM=new T.SM({transparent:true,depthWrite:false,uniforms:{col:{value:new C3(.4,.3,.18)}},
 vertexShader:`attribute float a;varying float vA;void main(){vA=a;vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=max(1.5,5.5/max(.4,-mv.z));}`,
 fragmentShader:`uniform vec3 col;varying float vA;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(col,vA*smoothstep(.5,0.,d)*.5);}`});
const tracks=new T.Points(trG,trM);tracks.frustumCulled=false;root.add(tracks);

function snakeUpdate(st,dt,t){
  st.t+=dt;const speed=.52;
  if(st.mode==="sidewind"){
    st.th+=Math.sin(t*1.3+st.t)*.4*dt;st.x+=Math.sin(st.th)*speed*dt;st.z+=Math.cos(st.th)*speed*dt;
    const r=Math.hypot(st.x,st.z);if(r>R*.82){st.th+=Math.PI*.5;st.x*=.94;st.z*=.94}
    if(Math.hypot(st.x-lakeC.x,st.z-lakeC.z)<lakeR*1.08)st.th+=1.2}
  const ud=st.o.userData,segs=ud.segs||[];
  if(ud.useGlb){const side=Math.sin(t*4)*.06;st.o.position.set(st.x+Math.cos(st.th)*side,hAt(st.x,st.z)+.04,st.z-Math.sin(st.th)*side);st.o.rotation.set(0,st.th,Math.sin(t*5)*.15)}
  else{
    st.pts.unshift({x:st.x,z:st.z});if(st.pts.length>segs.length)st.pts.length=segs.length;
    for(let i=0;i<segs.length;i++){const p=st.pts[Math.min(i,st.pts.length-1)];if(!p)continue;
      const side=Math.sin(t*4-i*.55)*.09;const px=p.x+Math.cos(st.th)*side,pz=p.z-Math.sin(st.th)*side;
      segs[i].position.set(px,hAt(px,pz)+.045,pz)}}
  if((st.t*20|0)!==((st.t-dt)*20|0)){const i=trI%TRN;trP[i*3]=st.x;trP[i*3+1]=hAt(st.x,st.z)+.012;trP[i*3+2]=st.z;trA[i]=.75;trI++}
  for(let i=0;i<TRN;i++)trA[i]=Math.max(0,trA[i]-dt*.12);
  trG.attributes.position.needsUpdate=trG.attributes.a.needsUpdate=true;st.speed=speed}

/* ---------------- blowing sand / sandstorm streamers ---------------- */
const SND=MOB?2400:4200,snR=R*.98;
const snG=new T.BG(),snP=new Float32Array(SND*3),snA=new Float32Array(SND),snA0=new Float32Array(SND),SNF=[];
snG.setAttribute("position",new T.BA(snP,3));snG.setAttribute("a",new T.BA(snA,1));
const snM=new T.SM({transparent:true,depthWrite:false,uniforms:{col:{value:new C3(.82,.68,.42)},scale:{value:1}},
 vertexShader:`attribute float a;varying float vA;uniform float scale;void main(){vA=a;vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=max(1.2,scale*(2.2+3.5*a)/max(.45,-mv.z));}`,
 fragmentShader:`uniform vec3 col;varying float vA;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(col,vA*smoothstep(.5,0.,d));}`});
const sandPts=new T.Points(snG,snM);sandPts.frustumCulled=false;sandPts.renderOrder=4;root.add(sandPts);
function snSeed(i,force){
  const a=rnd()*TAU,r=Math.sqrt(rnd())*snR;const x=Math.cos(a)*r,z=Math.sin(a)*r;
  const y=force?rr(0,3.8):(rnd()<.55?hAt(x,z)+rr(.02,.35):rr(.4,3.5));
  SNF[i]={x,y,z,v:rr(.4,1.2),ph:rnd()*TAU};snP[i*3]=x;snP[i*3+1]=y;snP[i*3+2]=z;snA0[i]=rr(.15,.55);snA[i]=0}
for(let i=0;i<SND;i++)snSeed(i,1);
/* crest streamer ribbons */
const STN=MOB?6:10,streamers=[];
(function makeStreamers(){
  for(let i=0;i<STN;i++){
    const g=new T.BG(),n=28,pos=new Float32Array(n*3),a=new Float32Array(n);
    g.setAttribute("position",new T.BA(pos,3));g.setAttribute("a",new T.BA(a,1));
    const m=new T.SM({transparent:true,depthWrite:false,uniforms:{col:{value:new C3(.9,.75,.48)}},
      vertexShader:`attribute float a;varying float vA;void main(){vA=a;vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=max(1.5,7./max(.4,-mv.z));}`,
      fragmentShader:`uniform vec3 col;varying float vA;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(col,vA*smoothstep(.5,0.,d)*.7);}`});
    const pts=new T.Points(g,m);pts.frustumCulled=false;root.add(pts);
    streamers.push({pts,pos,a,n,th:rnd()*TAU,rad:rr(2,5.5),life:rnd()})}
})();

function sandUpdate(dt,t,wn,storm){
  const cam=De.position,wx=Math.sin(t*.05+1)*.2+wn*1.0,wz=Math.cos(t*.04)*.1+wn*.25;
  for(let i=0;i<SND;i++){
    const q=SNF[i];q.x+=wx*(.8+q.v)*.9*dt;q.z+=wz*(.8+q.v)*.9*dt;q.y+=Math.sin(t*2+q.ph)*.02*dt;
    /* camera-relative wrap in column */
    let dx=q.x-cam.x,dz=q.z-cam.z;const r2=dx*dx+dz*dz,R2=snR*snR;
    if(r2>R2){const s=snR/Math.sqrt(r2);q.x=cam.x-dx*s*.98;q.z=cam.z-dz*s*.98}
    if(q.y>4.2||q.y<hAt(q.x,q.z)-.05)snSeed(i);
    snP[i*3]=q.x;snP[i*3+1]=q.y;snP[i*3+2]=q.z;
    const base=snA0[i]*(.25+wn*.5+storm*.9)*(1-ss(snR*.85,snR,Math.hypot(q.x,q.z)));
    snA[i]=base}
  snG.attributes.position.needsUpdate=snG.attributes.a.needsUpdate=true;
  snM.uniforms.col.value.set(.82+.08*storm,.68,.42).multiplyScalar(1-st.night*.35);
  /* streamers off dune crests */
  streamers.forEach((s,si)=>{
    s.life+=dt*(.4+storm*1.2);if(s.life>1){s.life=0;s.th=rnd()*TAU;s.rad=rr(1.5,6)}
    for(let i=0;i<s.n;i++){
      const u=i/(s.n-1);const x=Math.cos(s.th)*s.rad+u*wx*2.5,z=Math.sin(s.th)*s.rad+u*wz*2.5;
      const y=hAt(x,z)+.05+u*u*(.8+storm*1.2)+Math.sin(t*6+si+u*8)*.05;
      s.pos[i*3]=x;s.pos[i*3+1]=y;s.pos[i*3+2]=z;s.a[i]=(1-u)*(.2+storm*.75)*ss(0,.3,s.life)*ss(1,.7,s.life)}
    s.pts.geometry.attributes.position.needsUpdate=s.pts.geometry.attributes.a.needsUpdate=true;
    s.pts.visible=wn>.25||storm>.1})}

/* heat / sand haze */
const hazeG=new T.Group();root.add(hazeG);
(function(){
  const mk=()=>new T.SM({transparent:true,depthWrite:false,uniforms:{uT:{value:0},uA:{value:.08}},
    vertexShader:"varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader:"uniform float uT,uA;varying vec2 vUv;void main(){float w=sin(vUv.y*36.+uT*2.5)*sin(vUv.x*18.+uT);gl_FragColor=vec4(.95,.78,.5,uA*abs(w)*.12);}"});
  for(let i=0;i<5;i++){const p=new T.Mesh(new T.Plane(3.2,1.1),mk());p.rotation.x=-Math.PI*.5;const a=i/5*TAU,rad=rr(2.5,5.5);p.position.set(Math.cos(a)*rad,.2,Math.sin(a)*rad);hazeG.add(p)}
})();

/* ---------------- audio ---------------- */
const AU={ctx:null,master:null,wind:null,fire:null,ready:false,eagleT:0};
function SX(){return window.__sndX||null}
function ensureAudio(){
  const x=SX();if(!x||!x.s)return null;const ctx=x.s;
  if(!AU.ready){
    AU.ctx=ctx;AU.master=ctx.createGain();AU.master.gain.value=0;AU.master.connect(ctx.destination);
    const buf=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate),d=buf.getChannelData(0);
    for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*.4;
    const src=ctx.createBufferSource();src.buffer=buf;src.loop=true;
    const bp=ctx.createBiquadFilter();bp.type="bandpass";bp.frequency.value=400;bp.Q.value=.7;
    const g=ctx.createGain();g.gain.value=0;src.connect(bp);bp.connect(g);g.connect(AU.master);src.start();AU.wind={bp,g};
    const fb=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate),fd=fb.getChannelData(0);
    for(let i=0;i<fd.length;i++)fd[i]=(Math.random()*2-1)*Math.pow(Math.random(),8);
    const fs=ctx.createBufferSource();fs.buffer=fb;fs.loop=true;const fg=ctx.createGain();fg.gain.value=0;
    const ff=ctx.createBiquadFilter();ff.type="highpass";ff.frequency.value=800;fs.connect(ff);ff.connect(fg);fg.connect(AU.master);fs.start();AU.fire={g:fg};AU.ready=true}
  return AU}
function eagleCry(pos){
  const A=ensureAudio();if(!A||!A.ctx)return;const ctx=A.ctx,now=ctx.currentTime;
  const o=ctx.createOscillator(),o2=ctx.createOscillator(),g=ctx.createGain(),f=ctx.createBiquadFilter();
  o.type="sawtooth";o2.type="triangle";f.type="bandpass";f.frequency.value=1800;f.Q.value=4;
  o.frequency.setValueAtTime(1450,now);o.frequency.exponentialRampToValueAtTime(720,now+.55);
  o2.frequency.setValueAtTime(980,now);o2.frequency.exponentialRampToValueAtTime(480,now+.55);
  g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(.18,now+.03);g.gain.exponentialRampToValueAtTime(.001,now+.7);
  const p=ctx.createPanner();p.panningModel="HRTF";p.refDistance=4;p.rolloffFactor=1.1;
  if(pos){p.positionX.value=pos.x;p.positionY.value=pos.y;p.positionZ.value=pos.z}
  o.connect(f);o2.connect(f);f.connect(g);g.connect(p);p.connect(A.master);o.start(now);o2.start(now);o.stop(now+.75);o2.stop(now+.75)}
function snakeRustle(pos,spd){
  const A=ensureAudio();if(!A||!A.ctx||spd<.1)return;const ctx=A.ctx,now=ctx.currentTime;
  const n=ctx.createBuffer(1,ctx.sampleRate*.08,ctx.sampleRate),d=n.getChannelData(0);
  for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.exp(-i/d.length*3);
  const s=ctx.createBufferSource();s.buffer=n;const f=ctx.createBiquadFilter();f.type="bandpass";f.frequency.value=2200;f.Q.value=1.2;
  const g=ctx.createGain();g.gain.value=.02*cl(spd,0,1.5);const p=ctx.createPanner();p.panningModel="HRTF";p.refDistance=3;
  if(pos){p.positionX.value=pos.x;p.positionY.value=pos.y;p.positionZ.value=pos.z}
  s.connect(f);f.connect(g);g.connect(p);p.connect(A.master);s.start(now)}

/* ---------------- frame ---------------- */
const st={t:0,ts:1,wn:.35,night:0,storm:0,haze:0};
function update(dt){
  if(!root.visible)return;dt=Math.min(dt,.05)*st.ts;st.t+=dt;const t=st.t;
  const wn=Ue.uWind?Ue.uWind.value:(Ct.wind||.35);st.wn=wn;
  const night=qt.night||0;st.night=night;
  /* rain in desert → sandstorm; storm/high wind also */
  const rainy=/rain|storm|hail/.test(Ct.weather||"");
  const storm=cl(Math.max(rainy?.85:0,(Ct.weather==="storm"||wn>.78)?(wn-.5)*2:0,rainy&&wn>.3?wn:0),0,1);st.storm=storm;

  lakeU.uT.value=t;lakeU.uWind.value=wn;lakeU.uNight.value=night;
  if(pi){lakeU.uSunDir.value.copy(pi.position).normalize();lakeU.uSunCol.value.copy(pi.color)}
  if(jt&&jt.top)lakeU.uSky.value.copy(jt.top.value);

  palms.forEach(p=>{const c=p.userData.crown;if(!c||p.userData.useGlb)return;c.children.forEach((fr,j)=>{
    if(fr.userData.baseX==null)fr.userData.baseX=fr.rotation.x;
    fr.rotation.z=.14*wn*Math.sin(t*1.35+fr.userData.ph)+.04*Math.sin(t*.6+j);
    fr.rotation.x=fr.userData.baseX+.08*wn*Math.sin(t*1.1+fr.userData.ph)})});
  reedG.children.forEach(b=>{b.rotation.z=.18*wn*Math.sin(t*2.1+(b.userData.ph||0))});
  /* tent cloth billow */
  if(tent&&tent.userData.cloths&&!tent.userData.useGlb)tent.userData.cloths.forEach((c,i)=>{
    const geo=c.geometry,pos=geo.attributes.position;if(!pos)return;
    if(!c.userData.base){c.userData.base=new Float32Array(pos.array)}
    const base=c.userData.base;
    for(let k=0;k<pos.count;k++){const o=k*3;const wiggle=wn*.04*Math.sin(t*6+base[o]*4+i)*Math.sin(t*4.2+base[o+1]*5);
      pos.array[o]=base[o]+wiggle;pos.array[o+1]=base[o+1]+wiggle*.6;pos.array[o+2]=base[o+2]+wiggle*.4}
    pos.needsUpdate=true});

  const fp=fireG.position;for(let i=0;i<SMN;i++){const k=SMF[i];k.life+=dt*.32;if(k.life>1){k.life=0;k.x=fp.x+rr(-.06,.06);k.z=fp.z+rr(-.06,.06);k.y=fp.y+.22;k.v=rr(.28,.65)}
    k.y+=k.v*dt;k.x+=wn*1.1*dt;k.z+=wn*.25*dt;smP[i*3]=k.x;smP[i*3+1]=k.y;smP[i*3+2]=k.z;smA[i]=(1-k.life)*(.25+night*.85)}
  smG.attributes.position.needsUpdate=smG.attributes.a.needsUpdate=true;
  const fl=fireG.userData.light,tl=fireG.userData.tentL,gl=fireG.userData.glow;
  if(fl){const want=night*1.6+.08;fl.intensity+=(want*(1.1+.35*Math.sin(t*9))-fl.intensity)*ease(4,dt)}
  if(tl)tl.intensity+=(night*1.1+.04-tl.intensity)*ease(3,dt);
  if(gl){gl.material.opacity=.3+night*.55+.12*Math.sin(t*11);gl.material.emissiveIntensity=.8+night*1.2}

  sandUpdate(dt,t,wn,storm);
  camels.forEach(c=>camelUpdate(c,dt,t));
  eagleUpdate(dt,t);
  snakes.forEach(s=>{snakeUpdate(s,dt,t);if((t*8|0)!==((t-dt)*8|0)&&s.o.userData.segs)snakeRustle(s.o.userData.segs[0].position,s.speed||.5)});

  AU.eagleT-=dt;if(eagle.cry||(eagle.mode==="soar"&&AU.eagleT<=0&&rnd()<.008)){eagleCry(eagle.o.position);AU.eagleT=rr(6,16);eagle.cry=0}

  const A=ensureAudio();
  if(A&&A.wind){const now=A.ctx.currentTime;A.wind.g.gain.setTargetAtTime((.025+wn*.12+storm*.18)*(root.visible?1:0),now,.3);A.wind.bp.frequency.setTargetAtTime(260+wn*700+storm*200,now,.4)}
  if(A&&A.fire)A.fire.g.gain.setTargetAtTime(night*.05*(root.visible?1:0),A.ctx.currentTime,.4);
  if(A&&A.master){const x=SX();A.master.gain.setTargetAtTime((root.visible&&x&&x.on)?.75:0,A.ctx.currentTime,.3)}

  const day=1-night;hazeG.visible=day>.25;hazeG.children.forEach(p=>{if(p.material&&p.material.uniforms){p.material.uniforms.uT.value=t;p.material.uniforms.uA.value=(day*.5+storm*.7)*(1-night)}});

  /* deepen night fog feel on desert; sandstorm warm haze */
  if(Jt.fog){
    if(storm>.2){Jt.fog.near=Math.min(Jt.fog.near,25);Jt.fog.far=Math.min(Jt.fog.far,90);Jt.fog.color.lerp(new C3("#c9a06a"),storm*.15)}
    if(night>.5){Jt.fog.color.lerp(new C3("#0a1528"),.04)}
  }
}

function show(on){
  root.visible=on;De.layers.set(on?3:0);window.__desA=on;
  if(on){
    /* default: golden-hour sunset; full day cycle still available via UI */
    if(Ct.mode==="manual"||Ct.mode==="sunset"){Ct.mode="sunset";Ct.night=false}
    try{if(typeof window.__set==="function"){/* keep season */}}catch(e){}
  }
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
