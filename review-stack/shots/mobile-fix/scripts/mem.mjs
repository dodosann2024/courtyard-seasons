// desert cold load (root, cyStyle=desert): model bytes downloaded, buffers left in window.__desPre, JS heap incl. ArrayBuffer backing stores
import {chromium, devices} from "playwright";
import {serve} from "./serve.mjs";
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const out=[];
for(const [label,root] of [["before","/tmp/main-repo"],["after","/agent/repos/courtyard-seasons"]]){
  const {origin,close}=await serve(root,{});
  const br=await chromium.launch({args:["--enable-unsafe-swiftshader","--use-gl=angle","--use-angle=swiftshader","--mute-audio","--js-flags=--expose-gc"]});
  const ctx=await br.newContext({...devices["iPhone 13"]});await ctx.addInitScript(`localStorage.setItem("cyStyle","desert")`);
  const page=await ctx.newPage();const cdp=await ctx.newCDPSession(page);await cdp.send("Network.enable");
  const glb={};cdp.on("Network.loadingFinished",e=>{const u=glb[e.requestId];if(u)u.bytes=e.encodedDataLength});
  cdp.on("Network.requestWillBeSent",e=>{if(/\.glb$/.test(e.request.url))glb[e.requestId]={url:e.request.url.split("/").pop(),bytes:0}});
  await page.goto(origin+"/");
  for(let i=0;i<400;i++){if(await page.evaluate(()=>!!(window.__desProg&&window.__desProg().done)))break;await sleep(500)}
  await sleep(4000);await page.evaluate(()=>window.gc&&window.gc());await sleep(500);
  const h=await cdp.send("Runtime.getHeapUsage");
  const pre=await page.evaluate(async()=>{const P=window.__desPre||{},o={};for(const k in P){const b=await P[k].p;o[k]=b?b.byteLength:0}return o});
  const files=Object.values(glb);
  const r={label,glbRequests:files.length,glbMB:+(files.reduce((a,f)=>a+f.bytes,0)/2**20).toFixed(1),
    leftInDesPre:Object.keys(pre).length,leftMB:+(Object.values(pre).reduce((a,b)=>a+b,0)/2**20).toFixed(1),leftKeys:Object.keys(pre),
    heapUsedMB:+(h.usedSize/2**20).toFixed(1),backingStorageMB:h.backingStorageSize!=null?+(h.backingStorageSize/2**20).toFixed(1):null};
  console.log(JSON.stringify(r));out.push(r);await br.close();close()}
(await import("node:fs")).writeFileSync("/tmp/pw/out/mem.json",JSON.stringify(out,null,1));
