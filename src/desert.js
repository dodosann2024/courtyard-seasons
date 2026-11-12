/* 沙漠绿洲 · Desert Oasis — loaded on demand by app.js. Shares the app's renderer, sky, lights,
   seasons and weather; everything here lives on camera layer 3, which the camera only
   enables while the desert is shown, so the yards and the sea never see any of it. */
(()=>{
window.__desInit=getX=>{
const X=getX(),T=X.T,{Jt,De,Cn,Ta,Ue,Ct,qt,jt,pi,dc}=X,MOB=!!X.kn;
const V3=T.V3,C3=T.Color,TAU=Math.PI*2,R=8.6,L3=8;
let sd=20261112;const rnd=()=>{sd|=0;sd=sd+0x6D2B79F5|0;let t=Math.imul(sd^sd>>>15,1|sd);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const rr=(a,b)=>a+(b-a)*rnd(),cl=(x,a,b)=>x<a?a:x>b?b:x;
const ss=(a,b,x)=>{const t=cl((x-a)/(b-a),0,1);return t*t*(3-2*t)};
const ease=(k,dt)=>1-Math.exp(-dt*k);
const root=new T.Group();root.visible=false;Jt.add(root);
const onDes=o=>{o.traverse(c=>{c.layers.mask=1|L3})};
const M=(p,o)=>{const m=X.Wt(p,o||{snow:0,wet:0});return m};

/* ---------------- Tripo GLB via local three GLTFLoader (assets/vendor); procedural if missing ---------------- */
const MODEL={camel:"assets/models/camel.glb",eagle:"assets/models/eagle.glb",snake:"assets/models/snake.glb",tent:"assets/models/tent.glb",palm:"assets/models/palm.glb",cactus:"assets/models/cactus.glb"};
/* Expected Tripo frame: Y-up, −Z forward, origin at ground contact; scene units ≈ metres. */
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
    const v=[{x:b.min.x,y:b.min.y,z:b.min.z},{x:b.max.x,y:b.max.y,z:b.max.z}];
    /* world corners via matrix — coarse but enough for unit scale */
    for(let i=0;i<2;i++)for(let j=0;j<2;j++)for(let k=0;k<2;k++){
      const p=new V3(i?b.max.x:b.min.x,j?b.max.y:b.min.y,k?b.max.z:b.min.z);o.localToWorld(p);
      box.min[0]=Math.min(box.min[0],p.x);box.min[1]=Math.min(box.min[1],p.y);box.min[2]=Math.min(box.min[2],p.z);
      box.max[0]=Math.max(box.max[0],p.x);box.max[1]=Math.max(box.max[1],p.y);box.max[2]=Math.max(box.max[2],p.z)}});
  const h=Math.max(1e-3,box.max[1]-box.min[1]),target=MODEL_FIT[key]||1;
  const wrap=new T.Group();wrap.add(scene);
  scene.position.set(-(box.min[0]+box.max[0])*.5,-box.min[1],-(box.min[2]+box.max[2])*.5);
  wrap.scale.setScalar(target/h);
  wrap.userData.anims=scene.userData&&scene.userData.anims;
  return wrap}
function loadGLB(url,key){
  return gltfMod().then(m=>m.loadGLB(url)).then(({scene,animations})=>{
    if(!scene)throw 0;scene.userData.anims=animations||[];
    return fitGLB(scene,key)})}
function tryModel(rel,procedural){
  const key=(rel.split("/").pop()||"").replace(/\.glb$/,"");
  return modelsManifest().then(man=>{
    if(!man||!man[key])return {root:procedural(),src:"procedural"};
    const url=((window.CY&&CY.root)||"")+rel;
    return loadGLB(url,key).then(g=>({root:g,src:"glb",key})).catch(()=>({root:procedural(),src:"procedural"}))
  }).catch(()=>({root:procedural(),src:"procedural"}))}
/* Hide procedural meshes under a rig host and attach a fitted Tripo GLB.
   Fitted height is MODEL_FIT; host.scale still applies (palm/cactus size variety). */
function adoptGLB(host,glb){
  if(!host||!glb)return;
  host.children.slice().forEach(ch=>{ch.visible=false});
  glb.visible=true;host.add(glb);host.userData.glb=glb;host.userData.useGlb=1;onDes(glb)}

/* ---------------- heightfield: rippled dunes over a soft bowl ---------------- */
const lakeC={x:-2.0,z:-.4},lakeR=1.85;
function hNoise(x,z){
  return .7*Math.sin(x*.38+.7)*Math.cos(z*.34-1.1)
       +.45*Math.sin(x*.85-z*.5+2.1)
       +.28*Math.sin(x*1.55+z*1.2)
       +.14*Math.sin(x*2.8-z*2.2+0.4)
       +.07*Math.sin(x*5.2+z*3.8)}
/* soft diamond/squircle rim so the disc isn't a perfect circle */
function rimR(th){const c=Math.cos(th),s=Math.sin(th);const sq=Math.pow(Math.abs(c),1.35)+Math.pow(Math.abs(s),1.35);return R*(.92+.08*Math.sin(th*2.2)+.04*Math.sin(th*5.1))*(.78+.22/Math.max(.55,Math.pow(sq,.42)))}
function hAt(x,z){
  const th=Math.atan2(z,x),r=Math.hypot(x,z),Rth=rimR(th),edge=ss(Rth*.7,Rth,r);
  let h=.55+hNoise(x,z);
  /* sharp wind-blown dune crests (along ~x) */
  const crest=Math.max(0,Math.sin(x*.48+z*.18));
  h+=.95*Math.pow(crest,6)*ss(-3,6,x);
  h+=.7*Math.pow(Math.max(0,Math.sin(z*.62-x*.12+1.3)),8)*ss(-5,5,z);
  h+=.35*Math.pow(Math.max(0,Math.sin((x+z)*.55+2)),10);
  /* oasis bowl */
  const dl=Math.hypot(x-lakeC.x,z-lakeC.z);
  h=mix(h,-.02,ss(lakeR*.4,lakeR*1.15,dl));
  h*=1-edge;return Math.max(-.05,h)}
function mix(a,b,t){return a+(b-a)*t}
function nAt(x,z){const e=.08;const hx=hAt(x+e,z)-hAt(x-e,z),hz=hAt(x,z+e)-hAt(x,z-e);const n=new V3(-hx,2*e,-hz);return n.normalize()}

/* ---------------- island mesh ---------------- */
function buildIsland(){
  const N=MOB?96:140,pos=[],nor=[],uv=[],idx=[],col=[];
  for(let j=0;j<=N;j++)for(let i=0;i<=N;i++){
    const u=i/N,v=j/N,th=u*TAU,rr0=Math.pow(v,.9)*rimR(th);
    const x=Math.cos(th)*rr0,z=Math.sin(th)*rr0,y=hAt(x,z);
    pos.push(x,y,z);uv.push(x*.35+4,z*.35+4);
    const n=nAt(x,z);nor.push(n.x,n.y,n.z);
    const crest=cl((y-.15)*1.1,0,1);const rip=.5+.5*Math.sin(x*3.2+z*.6);
    const r=.58+.12*crest+.04*rip,g=.45+.1*crest+.03*rip,b=.30+.05*crest;
    col.push(Math.min(.76,r),Math.min(.68,g),Math.min(.55,b))}
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){const a=j*(N+1)+i;idx.push(a,a+1,a+N+1,a+1,a+N+2,a+N+1)}
  const g=new T.BG();g.setAttribute("position",new T.BA(new Float32Array(pos),3));
  g.setAttribute("normal",new T.BA(new Float32Array(nor),3));
  g.setAttribute("uv",new T.BA(new Float32Array(uv),2));
  g.setAttribute("color",new T.BA(new Float32Array(col),3));
  g.setIndex(idx);
  /* wind-aligned fine ripple texture (not radial) */
  const sandTex=(()=>{const S=256,c=document.createElement("canvas");c.width=c.height=S;const g2=c.getContext("2d"),id=g2.createImageData(S,S),d=id.data;
    for(let y=0;y<S;y++)for(let x=0;x<S;x++){const n=Math.sin(x*.55)+.45*Math.sin(x*1.3+y*.15)+.2*Math.sin(x*.2-y*.4);const v=132+n*16+(Math.random()*8-4);const o=(y*S+x)*4;d[o]=v;d[o+1]=v*.76;d[o+2]=v*.5;d[o+3]=255}
    g2.putImageData(id,0,0);const t=new T.CTex(c);t.colorSpace="srgb";t.wrapS=t.wrapT=1000;t.anisotropy=MOB?4:8;return t})();
  const m=M({map:sandTex,vertexColors:true,roughness:.94,metalness:0});
  const mesh=new T.Mesh(g,m);mesh.receiveShadow=mesh.castShadow=true;return mesh}
function buildUnderside(){
  const N=48,pos=[],nor=[],idx=[],col=[];
  for(let j=0;j<=N;j++)for(let i=0;i<=N;i++){
    const u=i/N,v=j/N,th=u*TAU,rr0=Math.pow(v,.85)*R*1.02;
    const x=Math.cos(th)*rr0*rimR(th)/R,z=Math.sin(th)*rr0*rimR(th)/R;
    const top=hAt(x*.98,z*.98);
    const y=top - (.5+3.6*v*v+1.6*v*Math.abs(Math.sin(th*3.2)))*(.6+.4*v);
    /* craggy noise */
    const y2=y-.15*v*Math.sin(th*8+v*12)-.1*v*Math.cos(th*5-v*9);
    pos.push(x,y2,z);nor.push(0,-1,0);
    const shade=.22+.18*v+rr(0,.04);col.push(shade*1.15,shade*.7,shade*.45)}
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){const a=j*(N+1)+i;idx.push(a,a+N+1,a+1,a+1,a+N+1,a+N+2)}
  const g=new T.BG();g.setAttribute("position",new T.BA(new Float32Array(pos),3));
  g.setAttribute("color",new T.BA(new Float32Array(col),3));g.setIndex(idx);g.computeVertexNormals();
  const m=M({vertexColors:true,roughness:.96,flatShading:true});
  const mesh=new T.Mesh(g,m);mesh.castShadow=true;mesh.receiveShadow=true;return mesh}

const island=buildIsland(),under=buildUnderside();root.add(island);root.add(under);

/* ---------------- oasis lake ---------------- */
const lakeY=0.02;
const lakeG=new T.BG();
{const N=48,pos=[],uv=[];for(let j=0;j<=N;j++)for(let i=0;i<=N;i++){const u=i/N,v=j/N,th=u*TAU,rr0=v*lakeR;const x=lakeC.x+Math.cos(th)*rr0,z=lakeC.z+Math.sin(th)*rr0;pos.push(x,lakeY,z);uv.push(u,v)}
 const idx=[];for(let j=0;j<N;j++)for(let i=0;i<N;i++){const a=j*(N+1)+i;idx.push(a,a+1,a+N+1,a+1,a+N+2,a+N+1)}
 lakeG.setAttribute("position",new T.BA(new Float32Array(pos),3));lakeG.setAttribute("uv",new T.BA(new Float32Array(uv),2));lakeG.setIndex(idx);lakeG.computeVertexNormals()}
const lakeU={uT:{value:0},uWind:{value:.35},uNight:{value:0},uSunDir:{value:new V3(0,1,0)},uSunCol:{value:new C3(1,.9,.7)},uMoonC:{value:new C3(.6,.7,.9)},uSky:{value:new C3(.55,.7,.85)},uDeep:{value:new C3(.02,.42,.45)},uShal:{value:new C3(.2,.78,.74)}};
const lakeM=new T.SM({transparent:true,depthWrite:false,uniforms:lakeU,
 vertexShader:`varying vec3 vW;varying vec2 vUv;void main(){vUv=uv;vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
 fragmentShader:`uniform float uT,uWind,uNight;uniform vec3 uSunDir,uSunCol,uMoonC,uSky,uDeep,uShal;varying vec3 vW;varying vec2 vUv;
 void main(){
  float r=length(vUv-.5)*2.;if(r>1.)discard;
  float edge=smoothstep(1.,.86,r);
  /* calm ripples: very low amplitude */
  float w=uWind;vec2 p=vW.xz*.7;
  float rip=.012*(sin(p.x*6.+uT*.4)+sin(p.y*5.2-uT*.35)+.5*sin((p.x+p.y)*9.+uT*.55));
  rip*=(.4+.6*w)*edge;
  vec3 N=normalize(vec3(-rip*14.,1.,rip*11.));
  vec3 V=normalize(cameraPosition-vW);
  float fres=pow(max(1e-4,1.-max(0.,dot(N,V))),3.2);
  vec3 water=mix(uDeep,uShal,smoothstep(1.,.2,r));
  vec3 skyR=mix(uSky,uSunCol,.15+.25*max(0.,dot(reflect(-V,N),uSunDir)));
  vec3 col=mix(water,skyR,.18+.55*fres);
  col+=uMoonC*uNight*(.08+.25*fres);
  float sunSpec=pow(max(1e-4,dot(reflect(-uSunDir,N),V)),80.)*(.15+.2*(1.-uNight));
  col+=uSunCol*sunSpec;col+=uMoonC*uNight*pow(max(1e-4,dot(reflect(-vec3(.2,.95,.15),N),V)),60.)*.35;
  float a=min(1.,.72*edge+.4*fres*edge);gl_FragColor=vec4(col,a);
  #include <colorspace_fragment>
 }`});
const lake=new T.Mesh(lakeG,lakeM);lake.renderOrder=2;root.add(lake);
const lakeBed=new T.Mesh(lakeG.clone(),M({color:"#1a5a58",roughness:1}));lakeBed.position.y=-.04;lakeBed.scale.set(1.02,1,1.02);root.add(lakeBed);

/* reeds around the lake */
const reedG=new T.Group();root.add(reedG);
(function makeReeds(){
  const blade=()=>{const g=new T.Cyl(.01,.004,.55,4,1,true);g.translate(0,.275,0);const m=M({color:"#3f8a45",roughness:.88,side:2});const o=new T.Mesh(g,m);o.castShadow=true;return o};
  for(let i=0;i<70;i++){const a=rnd()*TAU,r=lakeR*(.92+rr(0,.22));const x=lakeC.x+Math.cos(a)*r,z=lakeC.z+Math.sin(a)*r;
   if(Math.hypot(x,z)>R-0.4)continue;const y=Math.max(hAt(x,z),lakeY);
   const b=blade();b.position.set(x,y,z);b.rotation.y=rnd()*TAU;b.rotation.z=rr(-.12,.12);b.scale.setScalar(rr(.7,1.35));b.userData.ph=rnd()*TAU;reedG.add(b)}
})();

/* ---------------- rocks ---------------- */
const rockG=new T.Group();root.add(rockG);
(function makeRocks(){
  for(let i=0;i<55;i++){
    const a=rnd()*TAU,rad=Math.sqrt(rnd())*R*.95;let x=Math.cos(a)*rad,z=Math.sin(a)*rad;
    if(Math.hypot(x-lakeC.x,z-lakeC.z)<lakeR*1.15)continue;
    const y=hAt(x,z);const s=rr(.08,.38);const g=new T.Sphere(1,MOB?5:7,MOB?4:5);
    const m=M({color:new C3().setHSL(.08,rr(.08,.2),rr(.28,.48)),roughness:.95,flatShading:true});
    const o=new T.Mesh(g,m);o.scale.set(s*rr(.8,1.4),s*rr(.5,.9),s*rr(.8,1.3));o.position.set(x,y+s*.25,z);o.rotation.set(rr(0,1),rr(0,TAU),rr(0,1));o.castShadow=o.receiveShadow=true;rockG.add(o)}
})();

/* ---------------- shrubs (camel graze targets) ---------------- */
const shrubs=[];
(function makeShrubs(){
  for(let i=0;i<28;i++){
    const a=rnd()*TAU,rad=Math.sqrt(rnd())*R*.88;const x=Math.cos(a)*rad,z=Math.sin(a)*rad;
    if(Math.hypot(x-lakeC.x,z-lakeC.z)<lakeR*1.3)continue;
    const y=hAt(x,z);const g=new T.Group();
    const m=M({color:new C3().setHSL(.22,rr(.25,.45),rr(.28,.4)),roughness:.9,flatShading:true});
    for(let k=0;k<5;k++){const b=new T.Mesh(new T.Sphere(rr(.12,.22),5,4),m);b.position.set(rr(-.15,.15),rr(.08,.22),rr(-.15,.15));g.add(b)}
    g.position.set(x,y,z);root.add(g);shrubs.push({x,z,y,o:g})}
})();


/* ---------------- palms ---------------- */
function makePalm(){
  const g=new T.Group();
  const trunkM=M({color:"#6b4a2e",roughness:.9}),leafM=M({color:"#2f8a3a",roughness:.82,side:2});
  const trunk=new T.Mesh(new T.Cyl(.09,.06,2.4,7),trunkM);trunk.position.y=1.2;trunk.castShadow=true;g.add(trunk);
  /* slight lean segments */
  for(let i=0;i<4;i++){const r=new T.Mesh(new T.Sphere(.095-i*.008,5,4),trunkM);r.position.set(Math.sin(i)*.02,1.55+i*.22,0);g.add(r)}
  const crown=new T.Group();crown.position.y=2.45;g.add(crown);
  for(let i=0;i<14;i++){
    const fr=new T.Group();
    for(let k=0;k<4;k++){const blade=new T.Mesh(new T.Plane(.28-k*.04,1.6),leafM);blade.position.set(0,-.65,0);blade.rotation.y=(k-1.5)*.08;blade.rotation.z=(k-1.5)*.05;blade.castShadow=true;fr.add(blade)}
    fr.rotation.set(.25+rr(0,.55),i/14*TAU,0);crown.add(fr);fr.userData.ph=rnd()*TAU}
  g.userData.crown=crown;return g}
const palms=[];
(function placePalms(){
  const spots=[{x:lakeC.x+.9,z:lakeC.z+.35,s:1.05},{x:lakeC.x+1.35,z:lakeC.z-.2,s:.9},{x:lakeC.x+.55,z:lakeC.z-.85,s:.78}];
  spots.forEach((sp,i)=>{const p=makePalm();p.scale.setScalar(sp.s);const y=hAt(sp.x,sp.z);p.position.set(sp.x,y,sp.z);p.rotation.y=rr(0,TAU);onDes(p);root.add(p);palms.push(p);
    tryModel(MODEL.palm,()=>null).then(r=>{if(r.src==="glb"&&r.root){adoptGLB(p,r.root)}})})
})();

/* ---------------- saguaro cacti (eagle perch) ---------------- */
function makeCactus(){
  const g=new T.Group();const m=M({color:"#2d7a3e",roughness:.88});
  const body=new T.Mesh(new T.Cyl(.16,.18,2.2,8),m);body.position.y=1.1;body.castShadow=true;g.add(body);
  /* arms */
  [[.9,.55,1.1],[-.85,.7,1.35]].forEach(([ax,ay,ah])=>{
    const arm=new T.Group();const h=new T.Mesh(new T.Cyl(.1,.1,.55,6),m);h.rotation.z=Math.PI/2;h.position.x=ax*.35;arm.add(h);
    const up=new T.Mesh(new T.Cyl(.1,.1,ah,6),m);up.position.set(ax*.55,ay*.2+ah*.35,0);arm.add(up);arm.position.y=1.0;g.add(arm)});
  /* perch tip */
  const tip=new V3(0,2.25,0);g.userData.perch=tip;g.userData.bodyH=2.25;return g}
const cacti=[];
(function placeCacti(){
  const spots=[{x:3.2,z:2.4},{x:4.5,z:-1.8},{x:-4.8,z:2.8},{x:1.2,z:4.6},{x:-3.5,z:-3.8},{x:5.2,z:1.1}];
  spots.forEach(sp=>{if(Math.hypot(sp.x,sp.z)>R-0.6)return;const c=makeCactus();const y=hAt(sp.x,sp.z);c.position.set(sp.x,y,sp.z);c.rotation.y=rr(0,TAU);const sc=rr(.85,1.2);c.scale.setScalar(sc);onDes(c);root.add(c);cacti.push(c);
    tryModel(MODEL.cactus,()=>null).then(r=>{if(r.src==="glb"&&r.root){adoptGLB(c,r.root)}})});
})();
const eaglePerch=cacti[0];

/* ---------------- tent + campfire ---------------- */
function makeTentProcedural(){
  const g=new T.Group();
  const cloth=M({color:"#c4a46a",roughness:.92,side:2});
  const poleM=M({color:"#5a3d24",roughness:.9});
  /* A-frame ridge */
  const ridge=1.35,w=1.7,d=2.2;
  const shape=new T.BG();
  const verts=new Float32Array([
    -w,0,-d*.5,  w,0,-d*.5,  0,ridge,-d*.5,
    -w,0, d*.5,  w,0, d*.5,  0,ridge, d*.5,
    -w,0,-d*.5,  0,ridge,-d*.5, 0,ridge,d*.5, -w,0,d*.5,
     w,0,-d*.5,  w,0, d*.5,  0,ridge,d*.5, 0,ridge,-d*.5
  ]);
  shape.setAttribute("position",new T.BA(verts,3));
  shape.setIndex([0,1,2, 3,5,4, 6,7,8,6,8,9, 10,11,12,10,12,13]);
  shape.computeVertexNormals();
  const tentMesh=new T.Mesh(shape,cloth);tentMesh.castShadow=true;tentMesh.receiveShadow=true;g.add(tentMesh);
  g.userData.cloth=tentMesh;
  /* poles */
  [[-w*.15,0,-d*.45],[w*.15,0,-d*.45],[-w*.15,0,d*.45],[w*.15,0,d*.45]].forEach(([x,_,z])=>{
    const p=new T.Mesh(new T.Cyl(.025,.025,ridge*1.05,5),poleM);p.position.set(x,ridge*.5,z);p.castShadow=true;g.add(p)});
  return g}
const tentAnchor={x:2.6,z:-2.4};
const tentY=hAt(tentAnchor.x,tentAnchor.z);
let tent=makeTentProcedural();tent.position.set(tentAnchor.x,tentY,tentAnchor.z);tent.rotation.y=-.55;root.add(tent);
tryModel(MODEL.tent,()=>({skip:1})).then(r=>{if(r.src==="glb"&&r.root){r.root.scale.multiplyScalar(1.1);adoptGLB(tent,r.root)}});

/* campfire */
const fireG=new T.Group();const firePos={x:tentAnchor.x-.9,z:tentAnchor.z+.35};
fireG.position.set(firePos.x,hAt(firePos.x,firePos.z),firePos.z);root.add(fireG);
(function makeFire(){
  const logM=M({color:"#3a2415",roughness:.95});
  for(let i=0;i<4;i++){const log=new T.Mesh(new T.Cyl(.04,.05,.35,5),logM);log.rotation.z=Math.PI/2;log.rotation.y=i*TAU/4;log.position.y=.04;fireG.add(log)}
  const glow=new T.Mesh(new T.Sphere(.12,8,6),M({color:"#ff8a3a",roughness:1,metalness:0,emissive:"#ff6a20",emissiveIntensity:1.2,transparent:true,opacity:.9}));glow.position.y=.18;fireG.add(glow);fireG.userData.glow=glow;
  const fireL=new T.PL(new C3("#ff9a4a"),0,5,2);fireL.position.set(0,.35,0);fireL.layers.mask=L3;fireG.add(fireL);fireG.userData.light=fireL;
})();

/* smoke particles */
const SMN=MOB?48:80,smP=new Float32Array(SMN*3),smA=new Float32Array(SMN),smG=new T.BG();
smG.setAttribute("position",new T.BA(smP,3));smG.setAttribute("a",new T.BA(smA,1));
const smM=new T.SM({transparent:true,depthWrite:false,uniforms:{col:{value:new C3(.75,.75,.78)},scale:{value:1}},
 vertexShader:`attribute float a;varying float vA;uniform float scale;void main(){vA=a;vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=max(2.,scale*18./max(.5,-mv.z));}`,
 fragmentShader:`uniform vec3 col;varying float vA;void main(){float d=length(gl_PointCoord-.5);float s=smoothstep(.5,.0,d);gl_FragColor=vec4(col,vA*s*.55);}`});
const smoke=new T.Points(smG,smM);smoke.frustumCulled=false;smoke.renderOrder=5;root.add(smoke);
const SMF=[];for(let i=0;i<SMN;i++)SMF.push({x:0,y:rr(0,2),z:0,v:rr(.25,.55),life:rnd(),ph:rnd()*TAU});


/* ---------------- camel (procedural rig; GLB swap when present) ---------------- */
function makeCamelProcedural(){
  const g=new T.Group();
  const fur=M({color:"#c49a6c",roughness:.9}),dark=M({color:"#6a4a32",roughness:.88}),pad=M({color:"#3a2a1c",roughness:.95});
  const body=new T.Mesh(new T.Sphere(1,10,8),fur);body.scale.set(.55,.42,.9);body.position.y=1.15;body.castShadow=true;g.add(body);
  /* humps */
  const h1=new T.Mesh(new T.Sphere(.28,8,6),fur);h1.position.set(0,1.55,.15);h1.scale.set(1,1.15,.9);g.add(h1);
  const h2=new T.Mesh(new T.Sphere(.24,8,6),fur);h2.position.set(0,1.48,-.35);h2.scale.set(1,1.05,.85);g.add(h2);
  /* neck + head */
  const neck=new T.Group();neck.position.set(0,1.2,.7);g.add(neck);
  const n1=new T.Mesh(new T.Cyl(.11,.09,.55,7),fur);n1.position.set(0,.25,.15);n1.rotation.x=.6;n1.castShadow=true;neck.add(n1);
  const head=new T.Group();head.position.set(0,.55,.38);neck.add(head);
  const hd=new T.Mesh(new T.Sphere(.16,8,6),fur);hd.scale.set(1,.7,1.35);hd.castShadow=true;head.add(hd);
  const sn=new T.Mesh(new T.Sphere(.08,6,5),dark);sn.position.set(0,-.02,.22);sn.scale.set(1,.7,1.2);head.add(sn);
  const earL=new T.Mesh(new T.Sphere(.04,5,4),fur);earL.position.set(.1,.12,.05);earL.scale.set(.5,1.2,.4);head.add(earL);
  const earR=earL.clone();earR.position.x=-.1;head.add(earR);
  /* legs: same-side pace gait */
  const legs=[];
  [[.22, .45],[.22,-.45],[-.22, .45],[-.22,-.45]].forEach(([lx,lz],i)=>{
    const L=new T.Group();L.position.set(lx,1.05,lz);g.add(L);
    const up=new T.Mesh(new T.Cyl(.06,.05,.45,6),fur);up.position.y=-.22;up.castShadow=true;L.add(up);
    const lo=new T.Mesh(new T.Cyl(.045,.04,.4,6),fur);lo.position.y=-.55;L.add(lo);
    const foot=new T.Mesh(new T.Sphere(.07,6,4),pad);foot.scale.set(1.2,.5,1.4);foot.position.y=-.78;L.add(foot);
    legs.push({L,up,lo,foot,side:lx>0?1:-1,fore:lz>0?1:0,ph:lz>0?0:Math.PI})}
  );
  /* tail */
  const tail=new T.Mesh(new T.Cyl(.03,.01,.45,5),dark);tail.position.set(0,1.1,-.85);tail.rotation.x=.5;g.add(tail);
  g.userData={neck,head,legs,body,kind:"camel"};return g}
function plantFeet(cam,x,z,facing){
  const legs=cam.userData.legs;let sum=0;
  legs.forEach(lg=>{
    const wx=x+Math.cos(facing)*lg.L.position.z+Math.sin(facing)*lg.L.position.x;
    const wz=z+Math.sin(facing)*lg.L.position.z-Math.cos(facing)*lg.L.position.x;
    sum+=hAt(wx,wz)});
  const base=sum/legs.length;cam.position.set(x,base,z);cam.rotation.y=facing;
  legs.forEach(lg=>{
    const wx=x+Math.cos(facing)*lg.L.position.z+Math.sin(facing)*lg.L.position.x;
    const wz=z+Math.sin(facing)*lg.L.position.z-Math.cos(facing)*lg.L.position.x;
    lg.L.position.y=1.05+(hAt(wx,wz)-base)*.35})}

const camels=[];
function spawnCamel(x,z,facing){
  const c=makeCamelProcedural();c.scale.setScalar(.95);plantFeet(c,x,z,facing);onDes(c);root.add(c);
  const st={o:c,x,z,facing,mode:"walk",t:rr(0,8),speed:.55,gx:x,gz:z,drink:0,graze:0,step:rnd()*TAU};
  camels.push(st);
  tryModel(MODEL.camel,()=>null).then(r=>{if(r.src==="glb"&&r.root){adoptGLB(c,r.root);st.glb=r.root}});
  return st}
spawnCamel(-4.2,2.5,0.4);spawnCamel(-5.0,1.2,-2.2);

function camelUpdate(st,dt,t){
  st.t+=dt;const c=st.o,ud=c.userData;
  /* pick behaviour */
  if(st.mode==="walk"&&st.t>5){st.mode=rnd()<.45?"graze":rnd()<.5?"drink":"walk";st.t=0;
    if(st.mode==="graze"){const sh=shrubs[(Math.random()*shrubs.length)|0];st.tx=sh.x;st.tz=sh.z}
    else if(st.mode==="drink"){const a=rnd()*TAU;st.tx=lakeC.x+Math.cos(a)*lakeR*1.05;st.tz=lakeC.z+Math.sin(a)*lakeR*1.05}
    else{const a=rnd()*TAU,rad=rr(2,R*.7);st.tx=Math.cos(a)*rad;st.tz=Math.sin(a)*rad}}
  if(st.mode==="walk"||st.mode==="graze"||st.mode==="drink"){
    const dx=st.tx-st.x,dz=st.tz-st.z,dist=Math.hypot(dx,dz);
    if(dist>.25){const want=Math.atan2(dx,dz);let dth=((want-st.facing+Math.PI*3)%TAU)-Math.PI;st.facing+=dth*ease(3,dt);
      const sp=st.speed*(st.mode==="walk"?1:.7);st.x+=Math.sin(st.facing)*sp*dt;st.z+=Math.cos(st.facing)*sp*dt;
      /* pace gait: ipsilateral legs together */
      st.step+=dt*sp*6.2;
      ud.legs.forEach(lg=>{
        const phase=st.step+(lg.fore?0:Math.PI); /* diagonal? pace = same side: use side */
        const pace=st.step+ (lg.side>0?0:Math.PI);
        const swing=Math.sin(pace);lg.L.rotation.x=swing*.45;lg.lo.rotation.x=Math.max(0,-swing)*.35});
      ud.neck.rotation.x=ss(0,1,Math.sin(t*.7)*.1)}
    else{
      ud.legs.forEach(lg=>{lg.L.rotation.x*=1-ease(6,dt);lg.lo.rotation.x*=1-ease(6,dt)});
      if(st.mode==="graze"){st.graze+=dt;ud.neck.rotation.x=ss(0,1,Math.min(1,st.graze*1.5))*1.1;ud.head.rotation.x=Math.sin(t*3)*.08;if(st.graze>4){st.mode="walk";st.t=0;st.graze=0}}
      else if(st.mode==="drink"){st.drink+=dt;ud.neck.rotation.x=ss(0,1,Math.min(1,st.drink))*1.35; /* kneel a bit */ c.position.y=hAt(st.x,st.z)-ss(0,1,Math.min(1,st.drink*.8))*.25;if(st.drink>5){st.mode="walk";st.t=0;st.drink=0;c.scale.y=1}}
      else{st.mode="walk";st.t=0}}}
  plantFeet(c,st.x,st.z,st.facing);
  if(st.mode==="drink"&&st.drink>0)c.position.y=hAt(st.x,st.z)-ss(0,1,Math.min(1,st.drink*.8))*.22}

/* ---------------- eagle ---------------- */
function makeEagleProcedural(){
  const g=new T.Group();
  const bodyM=M({color:"#6b4a32",roughness:.85}),wingM=M({color:"#4a3424",roughness:.88,side:2}),headM=M({color:"#cfc6b8",roughness:.8}),beakM=M({color:"#d4a03a",roughness:.7});
  const body=new T.Mesh(new T.Sphere(.18,8,6),bodyM);body.scale.set(1,.7,1.5);body.castShadow=true;g.add(body);
  const head=new T.Mesh(new T.Sphere(.1,6,5),headM);head.position.set(0,.04,.22);g.add(head);
  const beak=new T.Mesh(new T.Cone(.04,.12,5),beakM);beak.rotation.x=Math.PI/2;beak.position.set(0,0,.34);g.add(beak);
  const wingL=new T.Group(),wingR=new T.Group();
  const wl=new T.Mesh(new T.Plane(.9,.28),wingM);wl.position.set(-.45,0,0);wingL.add(wl);wingL.position.set(0,.04,0);g.add(wingL);
  const wr=new T.Mesh(new T.Plane(.9,.28),wingM);wr.position.set(.45,0,0);wingR.add(wr);wingR.position.set(0,.04,0);g.add(wingR);
  const tail=new T.Mesh(new T.Plane(.22,.3),wingM);tail.position.set(0,0,-.32);tail.rotation.x=.4;g.add(tail);
  g.userData={wingL,wingR,head,body,spread:1};return g}
const eagle={o:makeEagleProcedural(),mode:"soar",t:0,th:rnd()*TAU,rad:5.5,alt:4.5,bank:0,flap:0,perch:null,drink:0};
eagle.o.scale.setScalar(1.1);root.add(eagle.o);onDes(eagle.o);
tryModel(MODEL.eagle,()=>null).then(r=>{if(r.src==="glb"&&r.root){adoptGLB(eagle.o,r.root);eagle.glb=r.root}});

function eagleUpdate(dt,t){
  const e=eagle,o=e.o,ud=o.userData;e.t+=dt;
  if(e.mode==="soar"){
    e.th+=dt*.22;e.rad=5.2+.6*Math.sin(t*.15);e.alt=3.8+.8*Math.sin(t*.2)+.3*Math.sin(t*.07);
    /* occasional flap */
    e.flap+=dt;const flapping=Math.sin(e.flap*8)>0&&(e.flap%6)<.45;
    ud.spread=flapping?.85:1.05;ud.wingL.rotation.z=flapping?Math.sin(e.flap*16)*.4:-.12;ud.wingR.rotation.z=flapping?-Math.sin(e.flap*16)*.4:.12;
    const x=Math.cos(e.th)*e.rad,z=Math.sin(e.th)*e.rad,y=e.alt+hAt(0,0);
    const px=o.position.x,pz=o.position.z;o.position.set(x,y,z);
    const vx=x-px,vz=z-pz;o.rotation.y=Math.atan2(vx,vz);e.bank+=(Math.atan2(vx,vz)-e.bank)*ease(2,dt);o.rotation.z=cl(-e.th*.0+Math.cos(e.th)*.25,-.5,.5);
    if(e.t>11){e.t=0;e.mode=rnd()<.55?"landPerch":"landDrink"}}
  else if(e.mode==="landPerch"||e.mode==="landDrink"){
    const target=e.mode==="landPerch"?eaglePerch:null;
    let tx,ty,tz;
    if(target){const p=target.position,tip=target.userData.perch;const s=target.scale.x;tx=p.x;tz=p.z;ty=p.y+tip.y*s+.06}
    else{tx=lakeC.x+lakeR*1.05;tz=lakeC.z;ty=Math.max(hAt(tx,tz),lakeY)+.12}
    /* approach with flare */
    const k=ease(1.2,dt);o.position.x+=(tx-o.position.x)*k;o.position.y+=(ty-o.position.y)*k;o.position.z+=(tz-o.position.z)*k;
    const dist=Math.hypot(tx-o.position.x,ty-o.position.y,tz-o.position.z);
    ud.wingL.rotation.z=-.35-ss(1.5,0,dist)*.4;ud.wingR.rotation.z=.35+ss(1.5,0,dist)*.4; /* flare */
    o.lookAt(tx,ty,tz);
    if(dist<.18){e.mode=e.mode==="landPerch"?"perch":"drink";e.t=0;o.position.set(tx,ty,tz);o.rotation.set(0,o.rotation.y,0);ud.wingL.rotation.z=-.05;ud.wingR.rotation.z=.05}}
  else if(e.mode==="perch"){
    ud.wingL.rotation.z=-.02;ud.wingR.rotation.z=.02;ud.head.rotation.y=Math.sin(t*.7)*.5; /* look around */
    if(Math.sin(t*1.3)>.95)ud.head.rotation.z=.2;else ud.head.rotation.z*=.9; /* preen */
    if(e.t>7){e.mode="takeoff";e.t=0}}
  else if(e.mode==="drink"){
    ud.head.rotation.x=ss(0,1,Math.min(1,e.t*2))*.8;if(e.t>4){e.mode="takeoff";e.t=0}}
  else if(e.mode==="takeoff"){
    ud.wingL.rotation.z=-Math.sin(e.t*14)*.6;ud.wingR.rotation.z=Math.sin(e.t*14)*.6;
    o.position.y+=dt*2.5;o.position.x+=Math.sin(o.rotation.y)*dt*1.5;o.position.z+=Math.cos(o.rotation.y)*dt*1.5;
    if(e.t>1.4){e.mode="soar";e.t=0;e.th=Math.atan2(o.position.x,o.position.z);e.cry=1}}
}

/* ---------------- snakes ---------------- */
function makeSnakeProcedural(){
  const g=new T.Group();const segs=[];const m=M({color:"#9a7a45",roughness:.9});
  for(let i=0;i<18;i++){const s=new T.Mesh(new T.Sphere(.06-i*.0015,5,4),m);s.castShadow=true;g.add(s);segs.push(s)}
  g.userData={segs,kind:"snake"};return g}
const snakes=[];
function spawnSnake(){
  const a=rnd()*TAU,rad=rr(2,R*.65);const s={o:makeSnakeProcedural(),x:Math.cos(a)*rad,z:Math.sin(a)*rad,th:rnd()*TAU,mode:"sidewind",t:0,pts:[]};
  root.add(s.o);onDes(s.o);snakes.push(s);
  tryModel(MODEL.snake,()=>null).then(r=>{if(r.src==="glb"&&r.root){adoptGLB(s.o,r.root);s.glb=r.root}})}
spawnSnake();if(!MOB)spawnSnake();

/* faint tracks */
const TRN=200,trP=new Float32Array(TRN*3),trA=new Float32Array(TRN),trG=new T.BG();let trI=0;
trG.setAttribute("position",new T.BA(trP,3));trG.setAttribute("a",new T.BA(trA,1));
const trM=new T.SM({transparent:true,depthWrite:false,uniforms:{col:{value:new C3(.45,.35,.22)}},
 vertexShader:`attribute float a;varying float vA;void main(){vA=a;vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=max(1.5,5./max(.4,-mv.z));}`,
 fragmentShader:`uniform vec3 col;varying float vA;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(col,vA*smoothstep(.5,0.,d)*.45);}`});
const tracks=new T.Points(trG,trM);tracks.frustumCulled=false;root.add(tracks);

function snakeUpdate(st,dt,t){
  st.t+=dt;const speed=.55;
  if(st.mode==="sidewind"){
    st.th+=Math.sin(t*1.3+st.t)*.4*dt;st.x+=Math.sin(st.th)*speed*dt;st.z+=Math.cos(st.th)*speed*dt;
    /* keep on island */
    const r=Math.hypot(st.x,st.z);if(r>R*.85){st.th+=Math.PI*.5;st.x*=.95;st.z*=.95}
    if(Math.hypot(st.x-lakeC.x,st.z-lakeC.z)<lakeR*1.05){st.th+=1.2}
  }
  const ud=st.o.userData,segs=ud.segs||[];
  if(ud.useGlb){
    const side=Math.sin(t*4)*.06;
    st.o.position.set(st.x+Math.cos(st.th)*side,hAt(st.x,st.z)+.04,st.z-Math.sin(st.th)*side);
    st.o.rotation.set(0,st.th,Math.sin(t*5)*.15);
  }else{
    st.pts.unshift({x:st.x,z:st.z,y:hAt(st.x,st.z)+.04});if(st.pts.length>segs.length)st.pts.length=segs.length;
    for(let i=0;i<segs.length;i++){const p=st.pts[Math.min(i,st.pts.length-1)]||st.pts[0];if(!p)continue;
      const side=Math.sin(t*4-i*.55)*.08;
      const px=p.x+Math.cos(st.th)*side,pz=p.z-Math.sin(st.th)*side,py=hAt(px,pz)+.045;
      segs[i].position.set(px,py,pz)}
  }
  /* tracks */
  if((st.t*20|0)!==((st.t-dt)*20|0)){const i=trI%TRN;trP[i*3]=st.x;trP[i*3+1]=hAt(st.x,st.z)+.01;trP[i*3+2]=st.z;trA[i]=.7;trI++}
  for(let i=0;i<TRN;i++)trA[i]=Math.max(0,trA[i]-dt*.12);
  trG.attributes.position.needsUpdate=trG.attributes.a.needsUpdate=true;
  st.speed=speed}


/* ---------------- blowing sand (column over island, wind wrap, size cap) ---------------- */
const SND=MOB?2200:3800,snR=R*.98,snY0=0,snY1=4.5;
const snG=new T.BG(),snP=new Float32Array(SND*3),snA=new Float32Array(SND),snA0=new Float32Array(SND),SNF=[];
{for(let i=0;i<SND;i++){const r=snR*Math.sqrt(Math.random()),a=Math.random()*TAU,tp=i%4===0?rr(.4,1.2):snY1;
  SNF.push({x:Math.cos(a)*r,y:rr(snY0,tp),z:Math.sin(a)*r,tp,v:rr(.4,1.1),fl:rr(.2,1),ph:Math.random()*TAU});snA0[i]=rr(.35,.8)}
 snG.setAttribute("position",new T.BA(snP,3));snG.setAttribute("a",new T.BA(snA,1))}
const snM=new T.SM({transparent:true,depthWrite:false,uniforms:{col:{value:new C3(.82,.7,.52)},scale:{value:1},uDay:{value:1}},
 vertexShader:`attribute float a;varying float vA;uniform float scale;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);float px=clamp(2.2*scale/max(.05,-mv.z),1.2,max(2.2,scale*.04));vA=a*smoothstep(.3,2.5,-mv.z);gl_PointSize=px;gl_Position=projectionMatrix*mv;}`,
 fragmentShader:`uniform vec3 col;varying float vA;void main(){float d=length(gl_PointCoord-.5);float s=smoothstep(.5,.05,d);if(s<.02)discard;gl_FragColor=vec4(col,vA*s);}`});
const sandPts=new T.Points(snG,snM);sandPts.frustumCulled=false;sandPts.renderOrder=4;root.add(sandPts);

function sandUpdate(dt,t,wn,storm){
  const n=Math.min(SND,Math.floor((.25+wn*.9+storm*.9)*SND));sandPts.visible=n>20;if(!sandPts.visible)return;
  const R2=snR*snR;
  for(let i=0;i<n;i++){const k=SNF[i];
    k.y+=(-k.v*.15+wn*.05)*dt; /* mostly drift, light fall */
    k.x+=(wn*(2.2+k.fl*2.5)+Math.sin(t*k.fl+k.ph)*.2)*dt;
    k.z+=(wn*.4+Math.cos(t*k.fl*.9+k.ph)*.15)*dt;
    if(k.y<snY0)k.y+=k.tp;else if(k.y>k.tp)k.y=snY0+(k.y-snY0)%Math.max(.2,k.tp);
    if(k.x*k.x+k.z*k.z>R2){if(Math.abs(k.z)>=snR)k.z=-k.z*.98;const hc=Math.sqrt(Math.max(0,R2-k.z*k.z));k.x=hc<1e-3?0:((k.x+hc)%(2*hc)+2*hc)%(2*hc)-hc}
    snP[i*3]=k.x;snP[i*3+1]=Math.max(hAt(k.x,k.z)+.05,k.y);snP[i*3+2]=k.z;
    const rq=Math.sqrt(k.x*k.x+k.z*k.z)/snR;
    snA[i]=snA0[i]*(1-ss(.88,1,rq))*ss(snY0,snY0+.25,k.y)*(1-ss(k.tp-.4,k.tp,k.y))*(.5+.5*storm+wn)}
  snG.setDrawRange(0,n);snG.attributes.position.needsUpdate=snG.attributes.a.needsUpdate=true;
  /* crest streamers: boost alpha near high dunes when windy */
}

/* ---------------- heat shimmer (cheap full-screen-ish planes near ground by day) ---------------- */
const shimG=new T.Group();root.add(shimG);
(function(){
  const mk=()=>new T.SM({transparent:true,depthWrite:false,uniforms:{uT:{value:0},uA:{value:0}},
    vertexShader:"varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader:"uniform float uT,uA;varying vec2 vUv;void main(){float w=sin(vUv.y*40.+uT*3.)*sin(vUv.x*20.+uT*1.5);gl_FragColor=vec4(.9,.85,.7,uA*abs(w)*.08);}"});
  for(let i=0;i<6;i++){const p=new T.Mesh(new T.Plane(2.2,.8),mk());p.rotation.x=-Math.PI*.5;const a=i/6*TAU,rad=rr(2,5);p.position.set(Math.cos(a)*rad,.15,Math.sin(a)*rad);shimG.add(p)}
})();

/* ---------------- audio (Web Audio, synthesised, spatial) ---------------- */
const AU={ctx:null,master:null,wind:null,fire:null,ready:false,eagleT:0};
function SX(){return window.__sndX||null}
function ensureAudio(){
  const x=SX();if(!x||!x.s)return null;const ctx=x.s;
  if(!AU.ready){
    AU.ctx=ctx;AU.master=ctx.createGain();AU.master.gain.value=0;AU.master.connect(ctx.destination);
    /* wind noise */
    const buf=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate),d=buf.getChannelData(0);
    for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*.4;
    const src=ctx.createBufferSource();src.buffer=buf;src.loop=true;
    const bp=ctx.createBiquadFilter();bp.type="bandpass";bp.frequency.value=400;bp.Q.value=.7;
    const g=ctx.createGain();g.gain.value=.0;src.connect(bp);bp.connect(g);g.connect(AU.master);src.start();
    AU.wind={src,bp,g};
    /* fire crackle */
    const fb=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate),fd=fb.getChannelData(0);
    for(let i=0;i<fd.length;i++)fd[i]=(Math.random()*2-1)*Math.pow(Math.random(),8);
    const fs=ctx.createBufferSource();fs.buffer=fb;fs.loop=true;const fg=ctx.createGain();fg.gain.value=0;
    const ff=ctx.createBiquadFilter();ff.type="highpass";ff.frequency.value=800;fs.connect(ff);ff.connect(fg);fg.connect(AU.master);fs.start();
    AU.fire={g:fg,panner:null};AU.ready=true}
  return AU}

function eagleCry(pos){
  const A=ensureAudio();if(!A||!A.ctx)return;const ctx=A.ctx,now=ctx.currentTime;
  const o=ctx.createOscillator(),o2=ctx.createOscillator(),g=ctx.createGain(),f=ctx.createBiquadFilter();
  o.type="sawtooth";o2.type="triangle";f.type="bandpass";f.frequency.value=1800;f.Q.value=4;
  o.frequency.setValueAtTime(1450,now);o.frequency.exponentialRampToValueAtTime(720,now+.55);
  o2.frequency.setValueAtTime(980,now);o2.frequency.exponentialRampToValueAtTime(480,now+.55);
  g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(.18,now+.03);g.gain.exponentialRampToValueAtTime(.001,now+.7);
  const p=ctx.createPanner();p.panningModel="HRTF";p.refDistance=4;p.rolloffFactor=1.1;
  if(pos)p.positionX.value=pos.x,p.positionY.value=pos.y,p.positionZ.value=pos.z;
  o.connect(f);o2.connect(f);f.connect(g);g.connect(p);p.connect(A.master);
  o.start(now);o2.start(now);o.stop(now+.75);o2.stop(now+.75)}

function snakeRustle(pos,spd){
  const A=ensureAudio();if(!A||!A.ctx||spd<.1)return;const ctx=A.ctx,now=ctx.currentTime;
  const n=ctx.createBuffer(1,ctx.sampleRate*.08,ctx.sampleRate),d=n.getChannelData(0);
  for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.exp(-i/d.length*3);
  const s=ctx.createBufferSource();s.buffer=n;const f=ctx.createBiquadFilter();f.type="bandpass";f.frequency.value=2200;f.Q.value=1.2;
  const g=ctx.createGain();g.gain.value=.02*cl(spd,0,1.5);const p=ctx.createPanner();p.panningModel="HRTF";p.refDistance=3;
  if(pos)p.positionX.value=pos.x,p.positionY.value=pos.y,p.positionZ.value=pos.z;
  s.connect(f);f.connect(g);g.connect(p);p.connect(A.master);s.start(now)}

/* ---------------- state ---------------- */
const st={t:0,ts:1,wn:.35,night:0,storm:0};

/* ---------------- per-frame ---------------- */
function update(dt){
  if(!root.visible)return;dt=Math.min(dt,.05)*st.ts;st.t+=dt;const t=st.t;
  const wn=Ue.uWind?Ue.uWind.value:(Ct.wind||.35);st.wn=wn;
  const night=qt.night||0;st.night=night;
  const storm=(Ct.weather==="storm"||wn>.82)?cl((wn-.55)*2,0,1):0;st.storm=storm;

  /* lake */
  lakeU.uT.value=t;lakeU.uWind.value=wn;lakeU.uNight.value=night;
  if(pi){lakeU.uSunDir.value.copy(pi.position).normalize();lakeU.uSunCol.value.copy(pi.color)}
  if(jt){lakeU.uSky.value.copy(jt.uTop?jt.uTop.value:Jt.fog.color)}
  lakeU.uMoonC.value.set(.65,.75,1).multiplyScalar(.4+.6*night);

  /* palms sway */
  palms.forEach((p,i)=>{const c=p.userData.crown;if(!c)return;c.children.forEach((fr,j)=>{fr.rotation.z=.12*wn*Math.sin(t*1.4+fr.userData.ph)+.05*Math.sin(t*.7+j);fr.rotation.x=.55+.1*wn*Math.sin(t*1.1+fr.userData.ph)})});
  /* reeds */
  reedG.children.forEach(b=>{b.rotation.z=.15*wn*Math.sin(t*2.2+b.userData.ph)});
  /* tent flutter: subtle vertexless scale jitter on cloth */
  if(tent&&tent.userData&&tent.userData.cloth){const c=tent.userData.cloth;c.scale.x=1+.02*wn*Math.sin(t*5.5);c.scale.z=1+.015*wn*Math.sin(t*4.2+.5)}
  /* smoke */
  const fp=fireG.position;for(let i=0;i<SMN;i++){const k=SMF[i];k.life+=dt*.35;if(k.life>1){k.life=0;k.x=fp.x+rr(-.05,.05);k.z=fp.z+rr(-.05,.05);k.y=fp.y+.2;k.v=rr(.3,.7)}
    k.y+=k.v*dt;k.x+=wn*1.2*dt;k.z+=wn*.2*dt;smP[i*3]=k.x;smP[i*3+1]=k.y;smP[i*3+2]=k.z;smA[i]=(1-k.life)*.5*(.3+night*.7)}
  smG.attributes.position.needsUpdate=smG.attributes.a.needsUpdate=true;
  /* fire light */
  const fl=fireG.userData.light,gl=fireG.userData.glow;
  if(fl){const want=night*.9+.05;fl.intensity+=(want*(1.2+.3*Math.sin(t*9))-fl.intensity)*ease(4,dt)}
  if(gl)gl.material.opacity=.35+night*.5+.1*Math.sin(t*11);

  sandUpdate(dt,t,wn,storm);
  camels.forEach(c=>camelUpdate(c,dt,t));
  eagleUpdate(dt,t);
  snakes.forEach(s=>{snakeUpdate(s,dt,t);if((t*8|0)!==((t-dt)*8|0))snakeRustle(s.o.userData.segs[0].position,s.speed||.5)});

  /* eagle cry sparse */
  AU.eagleT-=dt;if(eagle.cry||(eagle.mode==="soar"&&AU.eagleT<=0&&rnd()<.008)){eagleCry(eagle.o.position);AU.eagleT=rr(6,16);eagle.cry=0}
  if(eagle.mode==="landPerch"&&eagle.t<.05){eagleCry(eagle.o.position)}

  /* wind audio */
  const A=ensureAudio();
  if(A&&A.wind){const now=A.ctx.currentTime;A.wind.g.gain.setTargetAtTime((.02+wn*.1+storm*.12)*(root.visible?1:0),now,.3);A.wind.bp.frequency.setTargetAtTime(280+wn*600,now,.4)}
  if(A&&A.fire)A.fire.g.gain.setTargetAtTime(night*.04*(root.visible?1:0),A.ctx.currentTime,.4);
  if(A&&A.master){const x=SX();const on=root.visible&&x&&x.on;A.master.gain.setTargetAtTime(on?.7:0,A.ctx.currentTime,.3)}

  /* heat shimmer day only */
  const day=1-night;shimG.visible=day>.4&&!storm;shimG.children.forEach(p=>{if(p.material&&p.material.uniforms){p.material.uniforms.uT.value=t;p.material.uniforms.uA.value=day*.6*(1-storm)}});

  /* desert-friendly fog / sun: sand must not glow; slightly warmer key at low sun */
  if(pi&&dc){
    const el=Math.max(0,pi.position.y); /* crude elevation proxy */
    /* noon harsh: already handled by shared sky; clamp ambient on sand feel via fog */
    if(Jt.fog){Jt.fog.near=Math.max(Jt.fog.near,40);Jt.fog.far=Math.max(Jt.fog.far,160)}
  }
}

function show(on){
  root.visible=on;De.layers.set(on?3:0);window.__desA=on;
  const x=SX();if(x&&x.C)x.C();
  if(!on&&AU.master&&AU.ctx)AU.master.gain.setTargetAtTime(0,AU.ctx.currentTime,.25);
}

/* enable shared sky/lights on desert layer */
for(const o of[X.vd,pi,dc,X.Dc])o&&o.traverse(c=>c.layers.enable(3));
onDes(root);

window.__desShow=show;window.__desU=update;
window.__des={root,hAt,camels,eagle,snakes,cacti,palms,MODEL,lakeC,R,De,Ce:X.Ce};
window.__desReady=true;
};
})();
