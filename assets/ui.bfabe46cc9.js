(()=>{
const C=window.CY,Y=["def","jp","cn","kr","eu"],$=s=>document.querySelector(s);
const raf=()=>new Promise(r=>requestAnimationFrame(()=>r()));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const narrow=()=>innerWidth<=600;
const title=y=>(y==="def"?"":C.names[y]+" · ")+"天空之境 | Sky Haven";
const built=new Set();
/* Run the app only after the loading screen has been painted: its first frame
   (shader compilation) can block the main thread for a long time on phones. */
requestAnimationFrame(()=>setTimeout(()=>{const s=document.createElement("script");s.src=C.root+C.app;document.head.appendChild(s)},0));
let cur=C.cur,busy=false,pending=null,idx=0,ready=false;try{const s=history.state;if(s&&typeof s.i=="number")idx=s.i}catch{}

/* ---------- snapshots of the live WebGL canvas ----------
   Called from a rAF callback registered after the renderer's own, so the
   drawing buffer still holds the frame that was just rendered. */
function sceneCanvas(){return document.querySelector("canvas[data-engine]")}
function snap(){return new Promise(res=>requestAnimationFrame(()=>{
  const src=sceneCanvas();if(!src||!src.width){res(null);return}
  const w=src.width,h=src.height,a=document.createElement("canvas");a.width=w;a.height=h;
  const x=a.getContext("2d");x.drawImage(src,0,0);
  let b=a,bw=w,bh=h;
  while(bw>96){const nw=Math.max(48,bw>>1),nh=Math.max(24,Math.round(bh*nw/bw)),c=document.createElement("canvas");c.width=nw;c.height=nh;const cx=c.getContext("2d");cx.imageSmoothingQuality="high";cx.drawImage(b,0,0,nw,nh);b=c;bw=nw;bh=nh}
  let blank=true;try{const px=b.getContext("2d").getImageData(0,0,bw,bh).data;for(let i=3;i<px.length;i+=4*37)if(px[i]>8&&(px[i-1]|px[i-2]|px[i-3])>4){blank=false;break}}catch{blank=false}
  res(blank?null:{sharp:a,blur:b});
}))}

/* ---------- page-curl renderer (raw WebGL on an overlay canvas) ---------- */
const VS=`attribute vec2 aUV;uniform vec2 uSize,uN;uniform float uC,uR,uPage;varying vec2 vUV,vS;varying float vTh;
void main(){vec2 P=aUV*uSize;float th=0.,z=0.;vec2 Q=P;
if(uPage>.5){float d=dot(P,uN)-uC;if(d>0.){vec2 b=P-uN*d;float pr=3.14159265*uR;
 if(d<pr){th=d/uR;Q=b+uN*(uR*sin(th));z=uR*(1.-cos(th));}else{th=3.14159265;Q=b-uN*(d-pr);z=2.*uR;}}}
vUV=aUV;vTh=th;vS=Q/uSize;float w=1.-z/(uSize.y*7.);
gl_Position=vec4(vec2(vS.x*2.-1.,1.-vS.y*2.),uPage>.5?(.5-z/(4.*uR+1.))*w:.99,w);}`;
const FS=`precision mediump float;uniform sampler2D uPg,uPgB,uUn,uUnB;uniform vec2 uSize,uN,uBT;uniform float uC,uR,uPage,uUnOn,uFF,uSh;varying vec2 vUV,vS;varying float vTh;
vec3 bl(sampler2D t,vec2 p){vec3 c=texture2D(t,p).rgb*.2;
c+=(texture2D(t,p+vec2(uBT.x,0.)).rgb+texture2D(t,p-vec2(uBT.x,0.)).rgb+texture2D(t,p+vec2(0.,uBT.y)).rgb+texture2D(t,p-vec2(0.,uBT.y)).rgb)*.12;
c+=(texture2D(t,p+uBT*1.6).rgb+texture2D(t,p-uBT*1.6).rgb+texture2D(t,p+vec2(uBT.x,-uBT.y)*1.6).rgb+texture2D(t,p+vec2(-uBT.x,uBT.y)*1.6).rgb)*.08;return c;}
float hs(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void main(){vec2 P=vS*uSize;float dS=dot(P,uN)-uC;
if(uPage<.5){float sh=dS>0.?uSh*.34*exp(-max(0.,dS-uR*.85)/(uR*.8)):0.;
 if(uUnOn>.5){gl_FragColor=vec4(texture2D(uUn,vS).rgb*(1.-sh),1.);}else{gl_FragColor=vec4(0.,0.,0.,sh);}return;}
vec3 pg=texture2D(uPg,vUV).rgb;
vec3 be=dS<0.?bl(uPgB,vS):bl(uUnB,vS);
vec3 fr=mix(be,vec3(.97,.98,1.),.3)+(hs(gl_FragCoord.xy)-.5)*.035;
float lift=smoothstep(.0,1.8,vTh),sp=exp(-pow((vTh-1.7)/.38,2.));
bool front=(gl_FrontFacing==(uFF>.5));
vec3 c=front?mix(pg,fr,lift*.88)*(1.-.16*sin(min(vTh,3.1416))):fr*(.95+.05*cos(vTh));
c+=sp*.2*step(.001,vTh);
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
function geom(){const W=innerWidth,H=innerHeight,n=[1,.17],l=Math.hypot(n[0],n[1]);G.nv=[n[0]/l,n[1]/l];const R0=Math.min(W,H)*.13,cMax=W*G.nv[0]+H*G.nv[1]+2;return{R0,c0:cMax,c1:-R0*1.25-6}}
function frameAt(t,g,mode){const e=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,R=g.R0*(.8+.4*Math.sin(Math.PI*t));const shf=Math.min(1,t/.12)*(1-Math.max(0,(t-.78)/.22));draw(g.c0+(g.c1-g.c0)*e,R,mode,shf*shf*(3-2*shf))}
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
function pill(on,y){const p=tp();if(!p)return;if(on)p.querySelector("span").textContent="前往 · "+C.names[y];p.classList.toggle("on",!!on)}
async function go(y,dir,push){
  if(!Y.includes(y))return;
  if(!ready||!window.__style)return;
  if(busy){pending=[y,dir,push];return}
  if(y===cur)return;
  busy=true;
  const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
  try{
    const oldS=await snap();
    const shown=oldS?showFlat(oldS):false;
    const cold=!built.has(y);
    if(cold)pill(1,y);
    await raf();await raf();
    window.__style(y);cur=y;built.add(y);
    if(push){idx++;try{history.pushState({cy:y,i:idx},"",C.url(y))}catch{}}
    document.title=title(y);document.documentElement.dataset.yard=y;
    await raf();await raf();
    const newS=shown?await snap():null;
    pill(0);
    if(G&&!G.fail&&window.__keepTurn)G.last=[oldS,newS];
    await turn(shown?oldS:null,newS,dir,reduce);
  }catch{hideGL();pill(0)}
  busy=false;
  if(pending){const p=pending;pending=null;go(...p)}
}
window.__go=(y,dir=1)=>go(y,dir,true);
document.addEventListener("click",e=>{const b=e.target&&e.target.closest&&e.target.closest("[data-y]");if(!b)return;e.stopImmediatePropagation();e.preventDefault();go(b.dataset.y,1,true)},true);
addEventListener("popstate",e=>{const s=e.state;let y=s&&s.cy;if(!y){const m=location.pathname.match(/\/(jp|cn|kr|eu)\/?(?:index\.html)?$/);y=m?m[1]:"def"}const i=s&&typeof s.i=="number"?s.i:0;const dir=i<idx?-1:1;idx=i;go(y,dir,false)});
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
  const wind=$("#wind"),wp=()=>wind&&wind.style.setProperty("--p",(wind.value*100)+"%");wind&&wind.addEventListener("input",wp);wp();
}

/* ---------- boot ---------- */
(function wait(){if(!window.__ready){setTimeout(wait,25);return}
  ready=true;
  const on=document.querySelector("[data-y].on");if(on&&on.dataset.y!==cur&&window.__style)window.__style(cur);
  built.add(cur);document.title=title(cur);
  try{const s=history.state||{};history.replaceState({cy:cur,i:typeof s.i=="number"?s.i:0},"",C.canon&&cur===C.cur?C.canon:location.href)}catch{}
  panels();
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    const l=$("#ld");if(l){l.classList.add("gone");setTimeout(()=>l.remove(),900)}
    window.__firstFrame=performance.now();
    const idle=window.requestIdleCallback||(f=>setTimeout(f,1200));
    idle(()=>{
      if("serviceWorker" in navigator&&location.protocol==="https:")navigator.serviceWorker.register(C.root+"sw.js").catch(()=>{});
      const cn=navigator.connection;if(cn&&(cn.saveData||/2g/.test(cn.effectiveType||"")))return;
      setTimeout(()=>Object.values(C.au||{}).forEach(u=>fetch(C.root+u,{priority:"low"}).catch(()=>{})),2500);
    },{timeout:4000});
  }));
})();
})();
