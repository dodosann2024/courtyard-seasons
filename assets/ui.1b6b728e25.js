(()=>{
/* the yard list comes from boot.js (CY.names), so a new yard is switchable everywhere it is listed */
const C=window.CY,Y=Object.keys(C.names),$=s=>document.querySelector(s);
const raf=()=>new Promise(r=>requestAnimationFrame(()=>r()));
const reduceM=()=>matchMedia("(prefers-reduced-motion: reduce)").matches;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const narrow=()=>innerWidth<=600;
const title=y=>(y==="def"?"":C.names[y]+" · ")+"天空之境 | Sky Haven";
const built=new Set();
/* Run the app only after the loading screen has been painted: its first frame
   (shader compilation) can block the main thread for a long time on phones. */
requestAnimationFrame(()=>setTimeout(()=>{const s=document.createElement("script");s.src=C.root+C.app;
  s.onerror=()=>fallback(C.names[cur],"场景文件未能载入，请检查网络后重试。",2);document.head.appendChild(s)},0));
let cur=C.cur,busy=false,pending=null,idx=0,ready=false;try{const s=history.state;if(s&&typeof s.i=="number")idx=s.i}catch{}
if(cur==="desert")desPre();
/* the build tag in the panel: the desert bundle's hash, to tell which version a phone is really running */
{const m=/desert\.(\w{6})/.exec(C.desert||""),v=$("#ver");if(v&&m)v.textContent="版本 "+m[1]}
/* Safari brings tabs and home-screen apps back without navigating, so the worker is checked for an update whenever the page is
   shown again; a new one takes over at once (skipWaiting), and the page reloads onto it the next time it is out of sight */
function swReg(){const sw=navigator.serviceWorker,had=!!sw.controller;let stale=false;
  sw.register(C.root+"sw.js").then(reg=>{const up=()=>{if(document.visibilityState==="visible")reg.update().catch(()=>{})};
    addEventListener("visibilitychange",()=>{if(stale&&document.visibilityState==="hidden")location.reload();else up()});
    addEventListener("pageshow",e=>{if(e.persisted)up()});addEventListener("online",up)}).catch(()=>{});
  sw.addEventListener("controllerchange",()=>{if(!had)return;stale=true;if(document.visibilityState==="hidden")location.reload()})}

/* ---------- snapshots of the live WebGL canvas ----------
   The copy is taken in a rAF callback registered after the renderer's own, so the
   drawing buffer still holds the frame that was just rendered. Reading its pixels back to
   tell a blank frame would make the main thread wait for the GPU to finish that frame (a
   long task on phones), so the frame counts as drawn when the scene made draw calls for it. */
function sceneCanvas(){return document.querySelector("canvas[data-engine]")}
function countDraws(src){
  let gl=null;try{gl=src.getContext("webgl2")||src.getContext("webgl")}catch{}
  if(!gl||gl.isContextLost())return null;
  const c={n:0},ks=["drawArrays","drawElements","drawArraysInstanced","drawElementsInstanced","drawRangeElements"].filter(k=>gl[k]);
  for(const k of ks){const f=gl[k];gl[k]=function(){c.n++;return f.apply(this,arguments)}}
  c.off=()=>{for(const k of ks)delete gl[k]};return c}
function snap(){return new Promise(res=>requestAnimationFrame(()=>{
  const src=sceneCanvas();const dc=src&&src.width?countDraws(src):null;if(!dc){res(null);return}
  requestAnimationFrame(()=>{dc.off();
    if(!dc.n||!src.width){res(null);return}
    const w=src.width,h=src.height,a=document.createElement("canvas");a.width=w;a.height=h;
    a.getContext("2d").drawImage(src,0,0);
    let b=a,bw=w,bh=h;
    while(bw>96){const nw=Math.max(48,bw>>1),nh=Math.max(24,Math.round(bh*nw/bw)),c=document.createElement("canvas");c.width=nw;c.height=nh;const cx=c.getContext("2d");cx.imageSmoothingQuality="high";cx.drawImage(b,0,0,nw,nh);b=c;bw=nw;bh=nh}
    res({sharp:a,blur:b})})
}))}

/* ---------- page-curl renderer (raw WebGL on an overlay canvas) ---------- */
const VS=`attribute vec2 aUV;uniform vec2 uSize,uN;uniform float uC,uR,uPage;varying vec2 vUV,vS;varying float vTh;
void main(){vec2 P=aUV*uSize;float th=0.,z=0.;vec2 Q=P;
if(uPage>.5){float d=dot(P,uN)-uC;if(d>0.){vec2 b=P-uN*d;float pr=3.14159265*uR;
 if(d<pr){th=d/uR;Q=b+uN*(uR*sin(th));z=uR*(1.-cos(th));}else{th=3.14159265;Q=b-uN*(d-pr);z=2.*uR;}}}
vUV=aUV;vTh=th;vS=Q/uSize;float w=1.-z/(uSize.y*7.);
gl_Position=vec4(vec2(vS.x*2.-1.,1.-vS.y*2.),uPage>.5?(.5-z/(4.*uR+1.))*w:.99,w);}`;
const FS=`precision highp float;uniform sampler2D uPg,uPgB,uUn,uUnB;uniform vec2 uSize,uN,uBT;uniform float uC,uR,uPage,uUnOn,uFF,uSh;varying vec2 vUV,vS;varying float vTh;
vec3 bl(sampler2D t,vec2 p){vec3 c=texture2D(t,p).rgb*.2;
c+=(texture2D(t,p+vec2(uBT.x,0.)).rgb+texture2D(t,p-vec2(uBT.x,0.)).rgb+texture2D(t,p+vec2(0.,uBT.y)).rgb+texture2D(t,p-vec2(0.,uBT.y)).rgb)*.12;
c+=(texture2D(t,p+uBT*1.6).rgb+texture2D(t,p-uBT*1.6).rgb+texture2D(t,p+vec2(uBT.x,-uBT.y)*1.6).rgb+texture2D(t,p+vec2(-uBT.x,uBT.y)*1.6).rgb)*.08;return c;}
float hs(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void main(){vec2 P=vS*uSize;float dS=dot(P,uN)-uC;
if(uPage<.5){float sh=dS>0.?uSh*.46*exp(-max(0.,dS-uR*.8)/(uR*1.1)):0.;
 if(uUnOn>.5){gl_FragColor=vec4(texture2D(uUn,vS).rgb*(1.-sh),1.);}else{gl_FragColor=vec4(0.,0.,0.,sh);}return;}
vec3 pg=texture2D(uPg,vUV).rgb;
vec3 be=dS<0.?bl(uPgB,vS):bl(uUnB,vS);
vec3 fr=mix(be,vec3(.97,.98,1.),.3)+(hs(gl_FragCoord.xy)-.5)*.035;
float lift=smoothstep(.0,1.8,vTh),sp=exp(-pow((vTh-1.7)/.38,2.));
bool front=(gl_FrontFacing==(uFF>.5));
vec3 c=front?mix(pg,fr,lift*.88)*(1.-.16*sin(min(vTh,3.1416))):fr*(.95+.05*cos(vTh));
c+=sp*.22*step(.001,vTh)+step(.001,vTh)*.07*(1.-vS.y)*(1.-vS.x*.5);
float e=min(min(vUV.x,1.-vUV.x),min(vUV.y,1.-vUV.y));c+=(1.-smoothstep(0.,.005,e))*.38*step(.001,vTh);
gl_FragColor=vec4(c,1.);}`;
let G=null;
function initGL(){
  if(G)return G;
  const cv=document.createElement("canvas");cv.id="turn";cv.setAttribute("aria-hidden","true");
  const gl=cv.getContext("webgl",{alpha:true,premultipliedAlpha:true,antialias:true,depth:true,preserveDrawingBuffer:false});
  if(!gl)return G={fail:1};
  const sh=(t,s)=>{const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);return o};
  const pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,VS));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FS));gl.linkProgram(pr);
  if(!gl.getProgramParameter(pr,gl.LINK_STATUS))return G={fail:1};
  const NX=64,NY=40,uv=[],ix=[];
  for(let j=0;j<=NY;j++)for(let i=0;i<=NX;i++)uv.push(i/NX,j/NY);
  for(let j=0;j<NY;j++)for(let i=0;i<NX;i++){const a=j*(NX+1)+i,b=a+1,c=a+NX+1,d=c+1;ix.push(a,c,b,b,c,d)}
  const vb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(uv),gl.STATIC_DRAW);
  const ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(ix),gl.STATIC_DRAW);
  const qb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,qb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([0,0,1,0,0,1,1,1]),gl.STATIC_DRAW);
  gl.useProgram(pr);const U={};["uSize","uN","uC","uR","uPage","uUnOn","uFF","uSh","uBT","uPg","uPgB","uUn","uUnB"].forEach(k=>U[k]=gl.getUniformLocation(pr,k));
  gl.uniform1i(U.uPg,0);gl.uniform1i(U.uPgB,1);gl.uniform1i(U.uUn,2);gl.uniform1i(U.uUnB,3);
  const tx=[0,1,2,3].map(()=>{const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);return t});
  const al=gl.getAttribLocation(pr,"aUV");gl.enableVertexAttribArray(al);
  const sc=sceneCanvas();sc?sc.after(cv):document.body.prepend(cv);
  return G={cv,gl,pr,U,tx,vb,ib,qb,al,n:ix.length};
}
function upload(i,img){const{gl,tx}=G;gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,tx[i]);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img)}
function draw(c,R,mode,shf=0){
  const{gl,U,cv}=G,W=innerWidth,H=innerHeight,dpr=Math.min(devicePixelRatio||1,2);
  if(cv.width!==Math.round(W*dpr)||cv.height!==Math.round(H*dpr)){cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr)}
  gl.viewport(0,0,cv.width,cv.height);gl.clearColor(0,0,0,0);gl.clearDepth(1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  const n=G.nv;gl.uniform2f(U.uSize,W,H);gl.uniform2f(U.uN,n[0],n[1]);gl.uniform1f(U.uC,c);gl.uniform1f(U.uR,R);gl.uniform1f(U.uUnOn,mode<0?1:0);gl.uniform1f(U.uFF,G.ff);gl.uniform1f(U.uSh,shf);gl.uniform2f(U.uBT,G.bt[0],G.bt[1]);
  gl.disable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.disable(gl.BLEND);
  gl.uniform1f(U.uPage,0);gl.bindBuffer(gl.ARRAY_BUFFER,G.qb);gl.vertexAttribPointer(G.al,2,gl.FLOAT,false,0,0);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
  gl.uniform1f(U.uPage,1);gl.bindBuffer(gl.ARRAY_BUFFER,G.vb);gl.vertexAttribPointer(G.al,2,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,G.ib);gl.drawElements(gl.TRIANGLES,G.n,gl.UNSIGNED_SHORT,0);
}
/* dir>0: the old page lifts from the right edge and turns leftward, revealing the live new yard.
   dir<0 (history back): the new page turns back in from the left over a still of the old yard. */
function geom(){const W=innerWidth,H=innerHeight,n=[1,.22],l=Math.hypot(n[0],n[1]);G.nv=[n[0]/l,n[1]/l];const R0=Math.min(W,H)*.17,cMax=W*G.nv[0]+H*G.nv[1]+2;return{R0,c0:cMax,c1:-R0*1.25-6}}
function frameAt(t,g,mode){const e=.5*(t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2)+.5*(1-Math.pow(1-t,2.4)),R=g.R0*(.75+.45*Math.sin(Math.PI*t));const shf=Math.min(1,t/.12)*(1-Math.max(0,(t-.78)/.22));draw(g.c0+(g.c1-g.c0)*e,R,mode,shf*shf*(3-2*shf))}
function setTex(oldS,newS,dir){
  if(dir>0){upload(0,oldS.sharp);upload(1,oldS.blur);upload(3,newS.blur);G.bt=[1.2/oldS.blur.width,1.2/oldS.blur.height]}
  else{upload(0,newS.sharp);upload(1,newS.blur);upload(2,oldS.sharp);upload(3,oldS.blur);G.bt=[1.2/newS.blur.width,1.2/newS.blur.height]}
}
function showFlat(s){initGL();if(G.fail)return false;G.ff=G.ff??1;upload(0,s.sharp);upload(1,s.blur);upload(3,s.blur);G.bt=[1.2/s.blur.width,1.2/s.blur.height];const g=geom();G.cv.style.opacity="1";G.cv.style.transition="none";G.cv.classList.add("on");draw(g.c0,g.R0,1);return true}
function hideGL(){if(G&&G.cv){G.cv.classList.remove("on");G.cv.style.opacity="";if(!window.__keepTurn&&G.gl){const z=new Uint8Array(4);[0,1,2,3].forEach(i=>{G.gl.activeTexture(G.gl.TEXTURE0+i);G.gl.bindTexture(G.gl.TEXTURE_2D,G.tx[i]);G.gl.texImage2D(G.gl.TEXTURE_2D,0,G.gl.RGBA,1,1,0,G.gl.RGBA,G.gl.UNSIGNED_BYTE,z)})}}}
async function turn(oldS,newS,dir,reduce){
  if(reduce||!oldS||!newS||!G||G.fail){
    if(G&&G.cv&&G.cv.classList.contains("on")){G.cv.style.transition="opacity .38s ease";G.cv.style.opacity="0";await sleep(400)}
    hideGL();return}
  setTex(oldS,newS,dir);const g=geom(),T=920,mode=dir>0?1:-1;
  window.__turnP=0;
  await new Promise(res=>{const t0=performance.now();const step=now=>{let t=Math.min(1,(now-t0)/T);window.__turnP=t;frameAt(dir>0?t:1-t,g,mode);if(t<1)requestAnimationFrame(step);else res()};requestAnimationFrame(step)});
  if(dir<0){draw(g.c0,g.R0,mode);await raf()}
  hideGL();window.__turnP=1;
}
window.__turnFrame=async(t,dir=1)=>{if(!G||!G.last)return;setTex(G.last[0],G.last[1],dir);frameAt(dir>0?t:1-t,geom(),dir>0?1:-1);G.cv.classList.add("on")};

/* ---------- yard switching ---------- */
const tp=()=>$("#tp");
function pill(on,y){const p=tp();if(!p)return;clearTimeout(desT);cancelAnimationFrame(desRaf);clearInterval(desI);p.classList.remove("pr");if(on)p.querySelector("span").textContent="前往 · "+C.names[y];p.classList.toggle("on",!!on)}
/* ---------- when the scene cannot be shown ----------
   app.js reports (cy-gl events) no WebGL, a lost context, its return, and frames that never reach the screen; a context
   that is not given back, or none at all, leaves the yard's picture and a note instead of a black page */
let glT=0;
function fallback(t,m,retry){if($("#cyfb"))return;clearTimeout(glT);pill(0);cover(0);const l=$("#ld");if(l)l.remove();
  const d=document.createElement("div");d.id="cyfb";d.style.setProperty("--th","url("+C.root+C.th[cur]+")");
  d.innerHTML='<div class="card" role="alert"><b></b><span></span>'+(retry?'<button type="button"></button>':"")+"</div>";
  d.querySelector("b").textContent=t;d.querySelector("span").textContent=m;
  /* retry 1: reload at the low tier (app.js reads cyQ), 2: a plain reload, 3: the same after a stalled load */
  if(retry){const b=d.querySelector("button");b.textContent=retry===1?"以流畅画质重新载入":retry===3?"点击重试":"重新载入";
    b.addEventListener("click",()=>{if(retry===1)try{localStorage.setItem("cyQ","low")}catch{}location.reload()})}
  /* under the panels, which close so the note shows; reopened, they still switch yards over it */
  const cv=sceneCanvas();cv?cv.after(d):document.body.prepend(d);document.body.classList.add("col","snc")}
window.__cyStalled=()=>fallback("载入停滞","网络较慢，或页面没能运行完。",3);
document.addEventListener("cy-gl",e=>{const k=e.detail,p=tp();
  if(k==="ok"||k==="dark"){cover(cur==="desert"&&(k==="dark"||desBusy()));return}
  clearTimeout(glT);
  if(k==="lost"){if(p){pill(0);p.querySelector("span").textContent="场景恢复中…";p.classList.add("on")}
    glT=setTimeout(()=>fallback("场景暂时无法显示","设备图形内存不足，画面已暂停。",1),8000)}
  else if(k==="restored"){if(cur==="desert"&&desBusy()){desWant=true;desLoad()}else pill(0)}
  else if(k==="nogl")fallback(C.names[cur],"此浏览器未能启用 WebGL，暂时无法显示 3D 场景。",0)
  else if(k==="black")fallback("场景未能显示","设备未能完成绘制。",1)});
/* ---------- desert cover (phone WebKit) ----------
   From the moment the desert is chosen until its models are all in and app.js has drawn and checked a frame of it ("ok"),
   and again whenever a check comes back dark, the desert's picture lies over the scene: while the models parse and upload,
   WebKit can leave parts of the canvas unpainted, and a frame that does not reach the screen never shows as black.
   Once the desert is in, the cover may come back at most 3 times and stay up 8 s in all; past that it stays away (logged
   in window.__cyCover), so a device whose checks keep coming back dark sees the scene rather than a flickering picture */
const wkM=/^Apple/.test(navigator.vendor||"")&&/iPhone|iPad|Mobi/.test(navigator.userAgent);
let dc=null,dcT=0,cvN=0,cvMs=0,cvI=0,cvCap=false;
function cvLog(why){cvCap=true;const r={why,reshows:cvN,coverMs:Math.round(cvMs),t:Math.round(performance.now())};
  (window.__cyCover||(window.__cyCover=[])).push(r);console.warn("[cy] desert cover cap",r)}
function cover(on){if(!wkM)return;
  const vis=!!dc&&dc.isConnected&&!dc.classList.contains("out");
  if(on&&!desBusy()&&(cvCap||!vis&&++cvN>3&&(cvLog("reshows"),1)))on=false;
  clearTimeout(dcT);
  if(on){if(!dc||!dc.isConnected){dc=document.createElement("div");dc.id="cydc";dc.setAttribute("aria-hidden","true");dc.style.setProperty("--th","url("+C.root+C.th.desert+")");
      const cv=sceneCanvas();cv?cv.after(dc):document.body.prepend(dc)}dc.classList.remove("out");
    if(!cvI){let l=performance.now();cvI=setInterval(()=>{const n=performance.now();if(!desBusy())cvMs+=n-l;l=n;if(cvMs>=8e3&&!cvCap){cvLog("time");cover(0)}},250)}return}
  clearInterval(cvI);cvI=0;
  if(vis){const d=dc;d.classList.add("out");dcT=setTimeout(()=>d.remove(),700)}}
/* the desert's models stream in after the page turn (tens of MB on a cold visit), so keep the pill up with their real download progress */
let desT=0,desWant=false;
const desBusy=()=>!window.__desProg||!window.__desProg().done;
/* the models are fetched the moment the desert is chosen, all at once and alongside the old scene's capture and the
   desert's start-up, instead of in stages once its script has run; desert.js parses these buffers (window.__desPre).
   `warm` also pulls its script and loader modules into the cache (plain fetches: an unused <link rel=preload> warns) */
function desPre(warm){if(window.__desPre)return;const ms=C.ms||{},mob=/Mobi|iPhone|Android/i.test(navigator.userAgent),P=window.__desPre={};
  if(warm){const u=[C.desert,...["des-gltf","three.module.min","GLTFLoader","SkeletonUtils","meshopt_decoder.module"].map(f=>"assets/vendor/"+f+".js")];
    for(const f of u)if(f)fetch(C.root+f).then(r=>r.arrayBuffer()).catch(()=>{})}
  /* on a phone the downloads go a few at a time, the landscape first, so the island fills in early and the
     buffers waiting to be parsed never all sit in memory at once */
  const lim=mob?4:1e9,q=[];let n=0;const run=()=>{while(n<lim&&q.length){n++;q.shift()().then(()=>{n--;run()})}};
  const ks=Object.keys(ms).sort((a,b)=>/^(tent|saguaro|cholla|barrel)/.test(b)-/^(tent|saguaro|cholla|barrel)/.test(a));
  for(const k of ks){if(/_mobile$/.test(k)?!mob:mob&&ms[k+"_mobile"])continue;
    const e=P[k]={l:0,t:ms[k]};
    e.p=new Promise(res=>q.push(()=>{const p=fetch(C.root+"assets/models/"+k+".glb").then(r=>{if(!r.ok)return null;if(!r.body)return r.arrayBuffer();
      const rd=r.body.getReader(),ch=[];
      const pump=()=>rd.read().then(({done,value})=>{if(!done){ch.push(value);e.l+=value.length;return pump()}
        const b=new Uint8Array(e.l);let o=0;for(const c of ch){b.set(c,o);o+=c.length}return b.buffer});
      return pump()}).catch(()=>null);res(p);return p}))}
  run()}
const desPreProg=()=>{const P=window.__desPre;if(!P)return null;let l=0,t=0;for(const k in P){l+=Math.min(P[k].l,P[k].t);t+=P[k].t}return t?{p:.88*l/t,done:false}:null};
/* the number and the bar are drawn from one eased value each frame, so they never disagree and a burst of bytes that
   arrived while the main thread was busy glides in rather than jumping */
let desShow=0,desRaf=0,desI=0;
function desLoad(){const p=tp();clearTimeout(desT);cancelAnimationFrame(desRaf);clearInterval(desI);if(!p)return;
  const sp=p.querySelector("span");let last=performance.now(),txt="";
  const end=s=>{if(!(!desWant&&cur!=="desert"||s&&s.done||window.__desErr))return false;
    clearInterval(desI);cancelAnimationFrame(desRaf);p.classList.remove("on");desShow=0;desT=setTimeout(()=>p.classList.remove("pr"),250);return true};
  /* a frame can take seconds while the last models are compiled and first drawn, so the end is also looked for between frames */
  desI=setInterval(()=>{const f=window.__desProg;end(f?f():desPreProg())},250);
  const tick=now=>{const f=window.__desProg,s=f?f():desPreProg(),dt=Math.min(.25,Math.max(0,(now-last)/1000));last=now;
    if(end(s))return;
    if(s){desShow=Math.max(desShow,desShow+(s.p-desShow)*(1-Math.exp(-dt*7)));const n=Math.min(99,Math.floor(desShow*100)),t="载入沙漠 · "+n+"%";
      if(t!==txt){sp.textContent=txt=t;p.style.setProperty("--p",(3+97*n/100).toFixed(1)+"%")}p.classList.add("pr")}
    else{if(txt!=="go"){sp.textContent="前往 · "+C.names.desert;txt="go"}p.classList.remove("pr")}
    p.classList.add("on");desRaf=requestAnimationFrame(tick)};
  tick(last)}
async function go(y,dir,push){
  if(!Y.includes(y))return;
  if(!ready||!window.__style)return;
  if(busy){pending=[y,dir,push];return}
  if(y===cur)return;
  busy=true;
  const toD=y==="desert";desWant=toD;if(toD)desPre(1);
  /* capturing the old scene can hold the main thread for a moment: let the panel finish closing first */
  if(toD&&desBusy()){desLoad();await raf();if(document.body.classList.contains("col")&&!reduceM())await sleep(460)}
  const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
  try{
    const oldS=await snap();
    const shown=oldS?showFlat(oldS):false;
    cover(toD);
    const cold=!built.has(y);
    if(cold&&!toD)pill(1,y);
    await raf();await raf();
    window.__style(y);cur=y;built.add(y);
    {const w=window.__styleWait&&window.__styleWait(y);if(w){swPend=true;try{await w}finally{swPend=false}}}
    if(push){idx++;try{history.pushState({cy:y,i:idx},"",C.url(y))}catch{}}
    document.title=title(y);document.documentElement.dataset.yard=y;
    await raf();await raf();
    const newS=shown?await snap():null;
    /* a click on the desert while this switch finishes has already put up its loading pill: leave it */
    if(!toD&&!desWant)pill(0);
    if(G&&!G.fail&&window.__keepTurn)G.last=[oldS,newS];
    await turn(shown?oldS:null,newS,dir,reduce);
    window.__turnP=1;
  }catch{hideGL();if(!desWant)pill(0)}
  busy=false;
  if(pending){const p=pending;pending=null;go(...p)}
}
window.__go=(y,dir=1)=>go(y,dir,true);
/* the desert is a long cold load: the panel gets out of the way at once so the progress pill and the island show */
document.addEventListener("click",e=>{const b=e.target&&e.target.closest&&e.target.closest("[data-y]");if(!b)return;e.stopImmediatePropagation();e.preventDefault();
  if(b.dataset.y==="desert"&&cur!=="desert"){document.body.classList.add("col");desPre(1);if(desBusy()){desWant=true;desLoad()}}go(b.dataset.y,1,true)},true);
addEventListener("popstate",e=>{const s=e.state;let y=s&&s.cy;if(!y){const m=location.pathname.match(/\/([a-z]+)\/?(?:index\.html)?$/);y=m&&Y.includes(m[1])?m[1]:"def"}const i=s&&typeof s.i=="number"?s.i:0;const dir=i<idx?-1:1;idx=i;go(y,dir,false)});
addEventListener("keydown",e=>{if(e.target&&/INPUT|TEXTAREA/.test(e.target.tagName))return;if(e.key!=="ArrowLeft"&&e.key!=="ArrowRight"||e.metaKey||e.ctrlKey||e.altKey)return;const k=Y.indexOf(cur);go(Y[(k+(e.key==="ArrowRight"?1:Y.length-1))%Y.length],e.key==="ArrowRight"?1:-1,true)});

/* ---------- panels on narrow screens: one open at a time ---------- */
function panels(){
  const B=document.body;
  const ls=(k,v)=>{try{localStorage.setItem(k,v)}catch{}};
  const shut=(c,k)=>{if(!B.classList.contains(c)){B.classList.add(c);ls(k,c==="col"?"1":"0")}};
  $("#sbtn")&&$("#sbtn").addEventListener("click",()=>{narrow()&&shut("col","cyCol")});
  $("#fab")&&$("#fab").addEventListener("click",()=>{narrow()&&shut("snc","cySoundPanel")});
  if(narrow()&&!B.classList.contains("col")&&!B.classList.contains("snc"))shut("snc","cySoundPanel");
  const on=$("#gy .on");on&&on.scrollIntoView&&on.scrollIntoView({block:"nearest",inline:"center"});
  const sync=()=>document.querySelectorAll("#gy [data-y]").forEach(b=>b.setAttribute("aria-current",b.classList.contains("on")?"page":"false"));
  new MutationObserver(sync).observe($("#gy"),{subtree:true,attributes:true,attributeFilter:["class"]});sync();
  const rows=[...document.querySelectorAll(".p .rows .g")],ov=()=>rows.forEach(r=>r.classList.toggle("ov",r.scrollWidth-r.clientWidth-r.scrollLeft>4));
  rows.forEach(r=>r.addEventListener("scroll",ov,{passive:true}));addEventListener("resize",ov);new MutationObserver(ov).observe($("#sub"),{childList:true});ov();
  const wind=$("#wind"),wp=()=>wind&&wind.style.setProperty("--p",(wind.value*100)+"%");wind&&wind.addEventListener("input",wp);wp();
}

/* what is loading, for the watchdog in boot.js: null once nothing is. "work" (the app starting up, a yard being built) is the
   main thread busy, not a stall; what can stall is a script that never runs: the app's, a yard's (sea, desert), or the
   desert's model parsing */
let swPend=false;
window.__cyLoad=()=>{if(swPend)return"sw";if(!ready)return sceneCanvas()?"work":"boot";if(busy)return"work";if(cur!=="desert"||!desBusy())return null;
  const f=window.__desProg;if(f){const s=f();return s.parsed?"parsed":"d"+Math.round(s.p*1e3)}
  const s=desPreProg();return"p"+(s?Math.round(s.p*1e3):0)};

/* ---------- boot ---------- */
(async function wait(){if(!window.__ready){setTimeout(wait,25);return}
  const on=document.querySelector("[data-y].on");if(on&&on.dataset.y!==cur&&window.__style)window.__style(cur);
  {const w=window.__styleWait&&window.__styleWait(cur);if(w){swPend=true;try{await w}finally{swPend=false}}}
  ready=true;
  built.add(cur);document.title=title(cur);
  try{const s=history.state||{};history.replaceState({cy:cur,i:typeof s.i=="number"?s.i:0},"",C.canon&&cur===C.cur?C.canon:location.href)}catch{}
  panels();
  if(cur==="desert"){cover(1);window.__cyCheck&&window.__cyCheck();if(desBusy()){desWant=true;desLoad()}}
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    const l=$("#ld");if(l){l.classList.add("gone");setTimeout(()=>l.remove(),900)}
    window.__firstFrame=performance.now();
    const idle=window.requestIdleCallback||(f=>setTimeout(f,1200));
    /* the page-curl context is made while nothing else is happening, not inside the first scene switch, and not while the
       desert streams in: a second WebGL context made then can leave the scene canvas black on screen in WebKit */
    const pre=()=>{if(busy||G)return;if(cur==="desert"&&desBusy()){setTimeout(()=>idle(pre,{timeout:8000}),3000);return}try{initGL()}catch{}};
    setTimeout(()=>idle(pre,{timeout:8000}),5000);
    idle(()=>{
      if("serviceWorker" in navigator&&location.protocol==="https:")swReg();
      const cn=navigator.connection;if(cn&&(cn.saveData||/2g/.test(cn.effectiveType||"")))return;
      setTimeout(()=>[...Object.values(C.au||{}),C.sea].forEach(u=>u&&fetch(C.root+u,{priority:"low"}).catch(()=>{})),2500);
    },{timeout:4000});
  }));
})();
})();
