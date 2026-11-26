import {webkit, devices} from "playwright";
import {PNG} from "pngjs";
import fs from "node:fs";
import {serve} from "./serve.mjs";
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const R=process.argv[2],label=process.argv[3]||"soak";
const {origin,close}=await serve(R,{});const out=[];
for(let run=0;run<2;run++){
const br=await webkit.launch();const ctx=await br.newContext({...devices["iPhone 13"]});
await ctx.addInitScript(`localStorage.setItem("cyStyle","desert");localStorage.setItem("cyCol","1")`);
const page=await ctx.newPage();await page.goto(origin+"/");
for(let i=0;i<300;i++){if(await page.evaluate(()=>!!(window.__desProg&&window.__desProg().done)))break;await sleep(500)}
const lum=[];
for(let k=0;k<10;k++){await sleep(10000);const png=PNG.sync.read(await page.screenshot());let s=0,n=0;
  for(let y=png.height*.2|0;y<png.height*.85;y+=6)for(let x=0;x<png.width;x+=6){const i=(y*png.width+x)*4;s+=.2126*png.data[i]+.7152*png.data[i+1]+.0722*png.data[i+2];n++}lum.push(+(s/n).toFixed(1))}
const q=await page.evaluate(()=>window.__cyq&&window.__cyq());const r={run,lumEvery10s:lum,guard:q};console.log(JSON.stringify(r));out.push(r);await br.close()}
fs.writeFileSync(`/tmp/pw/out/${label}.json`,JSON.stringify(out,null,1));close();
