(()=>{const C=window.CY,Y=["def","jp","cn","kr","eu","sea","desert"],d=document.documentElement;
C.names={def:"默认小院",jp:"日式庭院",cn:"中式小院",kr:"韩式小院",eu:"欧式小院",sea:"空中海洋",desert:"沙漠绿洲"};
C.root=new URL(C.p||"./",location.href).href;
C.url=k=>C.root+(k==="def"?"":k+"/");
let q="";try{q=new URLSearchParams(location.search).get("yard")||decodeURIComponent(location.hash.slice(1))}catch{}
let y=Y.includes(q)?q:C.yard;
if(!y){let s=null;try{s=localStorage.getItem("cyStyle")}catch{}y=Y.includes(s)?s:"def"}
try{localStorage.setItem("cyStyle",y)}catch{}
C.cur=y;d.dataset.yard=y;
/* The address bar is only rewritten to the canonical yard URL once the app has loaded:
   relative asset URLs further down this document must still resolve against the original one. */
C.canon=C.url(y);try{const st=history.state;history.replaceState({cy:y,i:st&&typeof st.i=="number"?st.i:0},"")}catch{}
const h=new Date().getHours();if(h<6||h>=19)d.classList.add("ldn");
C.ld=()=>{const B=document.body;let sp=null,cl=null;try{sp=localStorage.getItem("cySoundPanel");cl=localStorage.getItem("cyCol")}catch{}
if(innerWidth<=600&&cl!=="1"&&sp!=="0"){sp="0";try{localStorage.setItem("cySoundPanel","0")}catch{}}
sp==="0"&&B.classList.add("snc");cl==="1"&&B.classList.add("col");
const l=document.getElementById("ld");if(!l)return;l.querySelector(".bg").style.backgroundImage="url("+C.root+C.th[y]+")";l.querySelector(".nm").textContent=C.names[y]};
/* Loading watchdog. It lives here, inline, because what it guards against includes ui.js itself being downloaded and never
   run. ui.js reports what is loading (window.__cyLoad: "boot", a yard switch, the desert's progress; null once nothing is);
   with neither that nor the finished downloads changing for 25 s (60 s while a script on the page is still downloading),
   the page reloads once (sessionStorage, so it cannot loop); stalled again, it shows a retry card instead of a frozen loader */
try{performance.setResourceTimingBufferSize&&performance.setResourceTimingBufferSize(2000)}catch{}
const wB=location.href;let wsig="",wt=Date.now(),wdone=false;
const wget=()=>{try{return sessionStorage.getItem("cyWd")}catch{return"x"}};
/* through ui.js when it runs (it also stops the progress pill and lifts the desert cover); its own card when ui.js never ran */
function wcard(){if(window.__cyStalled){window.__cyStalled();return}const t=document.getElementById("tp"),l=document.getElementById("ld");if(t)t.classList.remove("on");if(l)l.remove();
  if(document.getElementById("cyfb"))return;const f=document.createElement("div");f.id="cyfb";f.style.setProperty("--th","url("+C.root+C.th[y]+")");
  f.innerHTML='<div class="card" role="alert"><b>载入停滞</b><span>网络较慢，或页面没能运行完。</span><button type="button">点击重试</button></div>';
  f.querySelector("button").addEventListener("click",()=>location.reload());
  const cv=document.querySelector("canvas[data-engine]");cv?cv.after(f):document.body.prepend(f);document.body.classList.add("col","snc")}
setInterval(()=>{if(wdone)return;const n=Date.now();
  if(document.hidden||document.getElementById("cyfb")){wt=n;return}
  const L=window.__cyLoad?window.__cyLoad():"noui";
  if(L===null){wt=n;wsig="";try{sessionStorage.removeItem("cyWd")}catch{}return}
  /* every model is in and the desert is placing and first drawing them: desert.js ends that itself within 30 s */
  if(L==="parsed"){wt=n;return}
  const R=performance.getEntriesByType("resource"),got=new Set(R.map(e=>e.name)),s=L+"|"+!!window.__ready+"|"+R.length;
  if(s!==wsig){wsig=s;wt=n;return}
  /* src attributes against the URL the page was loaded at: the address bar is rewritten later */
  const dl=[...document.scripts].some(e=>{const a=e.getAttribute("src");return a&&!got.has(new URL(a,wB).href)});
  if(n-wt<(dl?6e4:25e3))return;
  wdone=true;const again=wget();console.warn("[cy] loading stalled",{at:L,ready:!!window.__ready,action:again?"retry card":"reload"});
  if(!again){try{sessionStorage.setItem("cyWd","1")}catch{}location.reload();return}
  wcard()},1000);
})();
