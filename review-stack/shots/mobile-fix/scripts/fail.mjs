// failure paths: context lost and restored, lost for good, no WebGL; writes stills to out/fail and videos to vid/
import {webkit, chromium, devices} from "playwright";
import fs from "node:fs";
import {serve} from "./serve.mjs";
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const R=process.argv[2]||"/agent/repos/courtyard-seasons",O="/tmp/pw/out/fail";fs.mkdirSync(O,{recursive:true});
const {origin,close}=await serve(R,{});
const dev=devices["iPhone 13"],size={width:dev.viewport.width,height:dev.viewport.height};
const cursor=`addEventListener("DOMContentLoaded",()=>{const c=document.createElement("div");c.style.cssText="position:fixed;z-index:99999;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;background:rgba(255,80,60,.55);border:2px solid #fff;pointer-events:none;left:-40px;top:-40px;transition:left .25s,top .25s";document.body.appendChild(c);addEventListener("mousemove",e=>{c.style.left=e.clientX+"px";c.style.top=e.clientY+"px"},true)})`;
const log=[];
async function desertPage(br,video){const ctx=await br.newContext({...dev,hasTouch:false,isMobile:false,recordVideo:video?{dir:"/tmp/pw/vid/raw",size}:undefined});
  await ctx.addInitScript(`localStorage.setItem("cyStyle","desert");localStorage.setItem("cyCol","1")`);await ctx.addInitScript(cursor);
  const page=await ctx.newPage();const errs=[];page.on("pageerror",e=>errs.push(String(e)));page.on("console",m=>m.type()==="error"&&errs.push(m.text()));
  await page.goto(origin+"/");return {ctx,page,errs}}
const waitDone=async page=>{for(let i=0;i<300;i++){if(await page.evaluate(()=>!!(window.__desProg&&window.__desProg().done)))return;await sleep(500)}};
const st=page=>page.evaluate(()=>({pill:(document.querySelector("#tp.on span")||{}).textContent||null,card:document.querySelector("#cyfb")?document.querySelector("#cyfb").innerText:null,q:window.__cyq&&window.__cyq()}));

if(process.env.ONLY!=="2"){
// 1) lost then restored (WebKit, recorded)
{const br=await webkit.launch();const {ctx,page,errs}=await desertPage(br,true);await waitDone(page);await sleep(2500);
 await page.mouse.move(195,420);await sleep(400);
 await page.evaluate(()=>{window.__lc=document.querySelector("canvas[data-engine]").getContext("webgl2").getExtension("WEBGL_lose_context");window.__lc.loseContext()});
 await sleep(1500);await page.screenshot({path:O+"/ctx-lost-pill.png"});const a=await st(page);
 await page.evaluate(()=>window.__lc.restoreContext());await sleep(9000);await page.screenshot({path:O+"/ctx-restored.png"});const b=await st(page);
 log.push({case:"lost+restored",whileLost:a,afterRestore:b,errors:errs});const v=page.video();await ctx.close();fs.copyFileSync(await v.path(),"/tmp/pw/vid/desert-context-lost-restored.webm");await br.close()}
}
// 2) lost for good (WebKit, recorded): the card after 8 s, its button reloads at the low tier
{const br=await webkit.launch();const {ctx,page,errs}=await desertPage(br,true);await waitDone(page);await sleep(2000);
 await page.evaluate(()=>document.querySelector("canvas[data-engine]").getContext("webgl2").getExtension("WEBGL_lose_context").loseContext());
 await sleep(9500);await page.screenshot({path:O+"/ctx-lost-card.png"});const a=await st(page);
 const btn=page.locator("#cyfb button");const bb=await btn.boundingBox();await page.mouse.move(bb.x+bb.width/2,bb.y+bb.height/2);await sleep(500);await btn.click();
 await page.waitForLoadState("domcontentloaded");await waitDone(page);await sleep(3000);await page.screenshot({path:O+"/reload-low-tier.png"});const b=await st(page);
 log.push({case:"lost for good",card:a,afterReload:b,errors:errs});const v=page.video();await ctx.close();fs.copyFileSync(await v.path(),"/tmp/pw/vid/desert-context-lost-fallback.webm");await br.close()}
// 3) no WebGL (Chromium with WebGL disabled)
{const br=await chromium.launch({args:["--disable-webgl","--disable-3d-apis"]});const {ctx,page,errs}=await desertPage(br,false);await sleep(6000);
 await page.screenshot({path:O+"/no-webgl.png"});log.push({case:"no WebGL",state:await st(page),errors:errs.slice(0,3)});await ctx.close();await br.close()}
fs.writeFileSync(O+"/fail.json",JSON.stringify(log,null,1));console.log(JSON.stringify(log,null,1));close();
