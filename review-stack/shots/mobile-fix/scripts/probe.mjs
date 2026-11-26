// Cold-load yards on the root URL (localStorage cyStyle=<yard>) in WebKit iPhone / Chromium Android emulation.
// usage: node probe.mjs <repoRoot> <outDir> [engine=webkit|chromium] [yards=def,jp,...] [runs=1] [label]
import {webkit, chromium, devices} from "playwright";
import {PNG} from "pngjs";
import fs from "node:fs";
import path from "node:path";
import {serve} from "./serve.mjs";

const [root, out, engine = "webkit", yardsArg = "def,jp,cn,kr,eu,sea,desert", runsArg = "1", label = "run"] = process.argv.slice(2);
const YARDS = yardsArg.split(","), RUNS = +runsArg;
const BPS = +(process.env.BPS || 0), MAXWAIT = +(process.env.MAXWAIT || 240000), SETTLE = +(process.env.SETTLE || 6000);
fs.mkdirSync(out, {recursive: true});
const sleep = ms => new Promise(r => setTimeout(r, ms));

function nonBlack(buf) {
  const png = PNG.sync.read(buf), {width: w, height: h, data} = png;
  // the scene area between the header and the bottom controls
  const y0 = Math.floor(h * .2), y1 = Math.floor(h * .85);
  let n = 0, nb = 0, sum = 0;
  for (let y = y0; y < y1; y += 2) for (let x = 0; x < w; x += 2) {
    const i = (y * w + x) * 4, l = .2126 * data[i] + .7152 * data[i + 1] + .0722 * data[i + 2];
    n++; sum += l; if (l > 16) nb++;
  }
  return {ratio: +(nb / n).toFixed(4), meanLum: +(sum / n).toFixed(1)};
}

const init = () => {
  window.__probe = {lost: 0, restored: 0, ctx: []};
  const g = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (t, a) {
    const c = g.call(this, t, a);
    if (c && /webgl/.test(t) && !this.__pr) {
      this.__pr = 1; window.__probe.ctx.push(t);
      this.addEventListener("webglcontextlost", () => window.__probe.lost++);
      this.addEventListener("webglcontextrestored", () => window.__probe.restored++);
    }
    return c;
  };
};

const memEstimate = () => {
  const C = window.__C && window.__C(); if (!C || !C.Jt) return null;
  const texs = new Set(), geos = new Set();
  const addTex = t => { if (t && t.isTexture) texs.add(t); };
  C.Jt.traverse(o => {
    if (o.geometry) geos.add(o.geometry);
    const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
    for (const m of ms) {
      for (const k in m) addTex(m[k]);
      if (m.uniforms) for (const k in m.uniforms) { const v = m.uniforms[k] && m.uniforms[k].value; addTex(v); if (Array.isArray(v)) v.forEach(addTex); }
    }
  });
  addTex(C.Jt.environment); addTex(C.Jt.background);
  let tb = 0;
  for (const t of texs) {
    if (t.isCompressedTexture && t.mipmaps && t.mipmaps.length) { for (const m of t.mipmaps) tb += m.data ? m.data.byteLength : 0; continue; }
    if (t.isRenderTargetTexture) continue;
    const im = t.image || {}, w = im.width || 0, h = im.height || 0, d = im.depth || 1;
    const bpp = t.type === 1015 ? 16 : t.type === 1016 ? 8 : 4;
    tb += w * h * d * bpp * (t.generateMipmaps !== false && t.minFilter >= 1007 ? 4 / 3 : 1);
  }
  let gb = 0;
  for (const g of geos) {
    for (const k in g.attributes) { const a = g.attributes[k]; gb += a.array ? a.array.byteLength : (a.data && a.data.array ? a.data.array.byteLength : 0); }
    if (g.index) gb += g.index.array.byteLength;
  }
  const cv = document.querySelector("canvas[data-engine]");
  // drawing buffer (4x MSAA + resolve + depth) + composer ping-pong (half float RGBA x2) + bloom mips (~1/3 of one RT)
  const px = cv ? cv.width * cv.height : 0, rt = px * (4 * 4 + 4 + 4) + px * 8 * 2 + px * 8 * .7;
  return {textures: texs.size, texMB: +(tb / 2 ** 20).toFixed(1), geometries: geos.size, geoMB: +(gb / 2 ** 20).toFixed(1),
    canvas: cv ? [cv.width, cv.height] : null, rtMB: +(rt / 2 ** 20).toFixed(1), totalMB: +((tb + gb + rt) / 2 ** 20).toFixed(1),
    guard: window.__cyq ? window.__cyq() : null};
};

const {origin, close} = await serve(path.resolve(root), {bps: BPS});
const results = [];
const dev = devices[process.env.DEV || (engine === "webkit" ? "iPhone 13" : "Pixel 7")];
for (const y of YARDS) for (let run = 0; run < RUNS; run++) {
  const br = await (engine === "webkit" ? webkit : chromium).launch(engine === "webkit" ? {} :
    {args: ["--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader", "--mute-audio", "--ignore-gpu-blocklist"]});
  const ctx = await br.newContext({...dev});
  await ctx.addInitScript(`try{localStorage.setItem("cyStyle",${JSON.stringify(y)})}catch(e){}`);
  await ctx.addInitScript(init);
  const page = await ctx.newPage();
  const errors = [], warns = [];
  page.on("console", m => { if (m.type() === "error") errors.push(m.text().slice(0, 300)); else if (m.type() === "warning") warns.push(m.text().slice(0, 200)); });
  page.on("pageerror", e => errors.push("pageerror: " + String(e.message || e).slice(0, 300)));
  let cdp = null;
  if (engine === "chromium") { cdp = await ctx.newCDPSession(page); if (process.env.THR) await cdp.send("Emulation.setCPUThrottlingRate", {rate: +process.env.THR}); }
  const t0 = Date.now();
  await page.goto(origin + (process.env.URLP || "/"), {waitUntil: "domcontentloaded"});
  let state = null, firstShot = null;
  while (Date.now() - t0 < MAXWAIT) {
    state = await page.evaluate(() => ({ld: !!document.getElementById("ld") && !document.getElementById("ld").classList.contains("gone"),
      ready: !!window.__ready, des: window.__desProg ? window.__desProg() : null, desErr: window.__desErr || null,
      tp: (document.querySelector("#tp.on span") || {}).textContent || null, fb: !!document.querySelector("#cyfb"),
      q: window.CY && window.CY.q ? (window.CY.q.name || "") : ""})).catch(e => ({err: String(e)}));
    if (state.ready && !state.ld && (y !== "desert" || (state.des && state.des.done) || state.desErr)) break;
    if (state.fb) break;
    
    await sleep(500);
  }
  const loadMs = Date.now() - t0;
  await sleep(SETTLE);
  let shot = null;
  for (let k = 0; k < 3 && !shot; k++) shot = await page.screenshot({timeout: 120000}).catch(e => { errors.push("probe: screenshot " + String(e.message).slice(0, 80)); return null; });
  if (!shot) { console.log(JSON.stringify({yard: y, run, engine, fail: "no screenshot"})); await br.close(); continue; }
  const file = path.join(out, `${label}-${engine}-${y}-${run}.png`);
  fs.writeFileSync(file, shot);
  const nb = nonBlack(shot);
  const info = await page.evaluate(() => ({probe: window.__probe, mem: null})).catch(() => ({}));
  const mem = await page.evaluate(memEstimate).catch(e => ({err: String(e)}));
  let heap = null;
  if (cdp) { const h = await cdp.send("Runtime.getHeapUsage").catch(() => null); if (h) heap = +(h.usedSize / 2 ** 20).toFixed(1); }
  else heap = await page.evaluate(() => performance.memory ? +(performance.memory.usedJSHeapSize / 2 ** 20).toFixed(1) : null).catch(() => null);
  const r = {yard: y, run, engine, device: process.env.DEV || (engine === "webkit" ? "iPhone 13" : "Pixel 7"), url: process.env.URLP || "/", loadMs, done: !!(state && state.ready && !state.ld), desDone: state && state.des ? state.des.done : null, desErr: state && state.desErr,
    nonBlack: nb.ratio, meanLum: nb.meanLum, contextLost: info.probe ? info.probe.lost : null, contexts: info.probe ? info.probe.ctx.length : null,
    fallback: await page.evaluate(() => !!document.querySelector("#cyfb")).catch(() => null), errors, warnings: warns.length, heapMB: heap, gpu: mem, shot: path.basename(file)};
  console.log(JSON.stringify(r));
  results.push(r);
  await br.close();
}
fs.writeFileSync(path.join(out, `${label}-${engine}.json`), JSON.stringify(results, null, 1));
close();
