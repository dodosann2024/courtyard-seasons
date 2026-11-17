// Desert regression checks: serves the repo locally, opens /desert/?debug=1 in headless Chrome and drives the simulation through
// the debug hooks (window.__desQA) to confirm that the dune deforms, wind blows sand, wind wipes footprints, the agamas still bask,
// climb, perch under the crown in rain and hide at night, and rain wets the sand, pits it and rings the lake. Fails on any console
// output or any request that leaves localhost. Usage: node tools/e2e/desert.mjs   (CHROME=/path/to/chrome to override the browser)
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import puppeteer from "puppeteer-core";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const CHROME = process.env.CHROME || ["/usr/bin/google-chrome-stable", "/usr/bin/google-chrome", "/usr/bin/chromium"].find(p => fs.existsSync(p));
const LOAD_MS = +(process.env.LOAD_MS || 300000);
const TYPES = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png",
  ".jpg": "image/jpeg", ".webp": "image/webp", ".ktx2": "image/ktx2", ".glb": "model/gltf-binary", ".mp3": "audio/mpeg", ".m4a": "audio/mp4",
  ".ogg": "audio/ogg", ".wasm": "application/wasm", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".bin": "application/octet-stream"};

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p.endsWith("/")) p += "index.html";
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, {"content-type": TYPES[path.extname(f)] || "application/octet-stream"});
  fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(0, "127.0.0.1", r));
const ORIGIN = `http://127.0.0.1:${server.address().port}`;

const sleep = ms => new Promise(r => setTimeout(r, ms));
const failures = [];
const check = (name, ok, info) => { console.log(ok ? "ok  " : "FAIL", name, JSON.stringify(info)); if (!ok) failures.push(name); };

const browser = await puppeteer.launch({executablePath: CHROME, headless: "new", protocolTimeout: 900000,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader", "--mute-audio"]});
try {
  const page = await browser.newPage();
  await page.setViewport({width: 960, height: 540});
  page.on("console", m => { failures.push("console"); console.log(`FAIL console ${m.type()}: ${m.text().slice(0, 200)}`); });
  page.on("pageerror", e => { failures.push("page error"); console.log(`FAIL page error: ${String(e).slice(0, 200)}`); });
  await page.setRequestInterception(true);
  page.on("request", r => {
    const u = r.url();
    if (u.startsWith(ORIGIN) || u.startsWith("data:") || u.startsWith("blob:")) r.continue();
    else { failures.push("external request"); console.log(`FAIL request leaves localhost: ${u}`); r.abort(); }
  });
  await page.goto(ORIGIN + "/desert/?nosw=1&debug=1", {waitUntil: "domcontentloaded", timeout: 120000});
  await page.waitForFunction(() => window.__ready && window.__desReady && window.__desQA && window.__desQA().ready, {timeout: LOAD_MS, polling: 500});
  await sleep(1000);
  /* the real-time loop is frozen; every check below advances the simulation itself, so the results do not depend on frame rate */
  await page.evaluate(() => { const q = window.__desQA(); q.freeze(true); q.tod("day"); window.__set({weather: "sun", ct: "clear", wind: .8}); q.sim(20); });

  /* 1. the dune creeps and changes shape in ordinary wind, and the sand shader follows it */
  check("dune deforms in wind", ...await page.evaluate(() => {
    const q = window.__desQA(), D = q.dune.DP, K = ["x", "z", "H", "w", "Lw", "Ll", "cv", "sk"], a = K.map(k => D[k]);
    q.sim(120, .5);
    const d = Math.max(...K.map((k, i) => Math.abs(D[k] - a[i]))), u = q.sandU.uDA.value;
    const sync = Math.abs(u.x - D.x) + Math.abs(u.y - D.z) + Math.abs(u.z - D.H) + Math.abs(u.w - D.w);
    return [d > .01 && sync < 1e-4, {maxChange: +d.toFixed(4), shaderSync: +sync.toFixed(6)}];
  }));

  /* 2. wind lifts grains off the sand and carries them downwind; the surface streaks keep flowing */
  check("wind blows sand", ...await page.evaluate(() => {
    const q = window.__desQA(), S = q.SAND, P0 = Float32Array.from(S.P), f0 = q.sandU.uFlowT.value;
    q.sim(2, 1 / 30);
    let dw = 0, n = 0, lit = 0;
    for (let i = 0; i < S.n; i++) {
      const dx = S.P[i * 3] - P0[i * 3], dz = S.P[i * 3 + 2] - P0[i * 3 + 2];
      if (Math.hypot(dx, dz) < 3) { dw += dx * q.WIND.x + dz * q.WIND.z; n++; }
      if (S.A[i] > .01) lit++;
    }
    const down = dw / Math.max(1, n), flow = q.sandU.uFlowT.value - f0, k = q.sandU.uFlowK.value;
    return [down > .05 && lit >= 20 && flow > 0 && k > .3, {meanDownwind: +down.toFixed(3), visibleGrains: lit, flowAdvance: +flow.toFixed(3), flowK: +k.toFixed(2)}];
  }));

  /* 3. footprints wear away, much faster in wind, until they are gone */
  check("wind wipes footprints", ...await page.evaluate(() => {
    const q = window.__desQA(), P = q.PR, [x, z] = q.dune.crestXZ(.6), n0 = P.n;
    const wear = (wind, sec) => { window.__set({wind}); q.sim(15); q.prAdd(0, x, z, 0, 0, 1); const e = P.E; q.sim(sec); return Math.exp(-(P.E - e)); };
    const calm = wear(0, 60), windy = wear(1, 60), gone = wear(1, 300);
    window.__set({wind: .8});
    return [P.n > n0 && windy < calm - .1 && gone < .05, {printsAdded: P.n - n0, leftAfter60sCalm: +calm.toFixed(3), leftAfter60sWindy: +windy.toFixed(3), leftAfter300sWindy: +gone.toFixed(4)}];
  }));

  /* 4. agamas: active in the sun (basking or climbing), perched just under the fronds in rain, hidden at night */
  check("agama behaviour", ...await page.evaluate(() => {
    const q = window.__desQA(), L = q.AG.list, out = {n: L.length};
    if (!L.length) return [false, out];
    const p0 = L.map(a => [a.x, a.z, a.ct || 0]);
    const seen = new Set();
    for (let i = 0; i < 24; i++) { q.sim(5); for (const a of L) seen.add(a.palm ? "palm:" + a.mode : a.mode); }
    out.sunModes = [...seen];
    out.moved = +Math.max(...L.map((a, i) => Math.hypot(a.x - p0[i][0], a.z - p0[i][1]) + Math.abs((a.ct || 0) - p0[i][2]) * 5)).toFixed(2);
    const active = [...seen].some(m => /bask|climb|perch|palm/.test(m));
    window.__set({weather: "hrain", ct: "overcast"}); q.sim(180);
    out.rain = L.map(a => ({mode: a.mode, onPalm: !!a.palm, under: a.palm ? +(q.agRainT(a.palm) - (a.male ? 0 : .28 / a.palm.h) - a.ct).toFixed(3) : null}));
    const perched = L.every(a => a.palm && Math.abs(q.agRainT(a.palm) - (a.male ? 0 : .28 / a.palm.h) - a.ct) < .06);
    window.__set({weather: "sun", ct: "clear"}); q.tod("night"); q.sim(240);
    out.night = L.map(a => a.mode + (a.g.visible ? "" : ":hidden"));
    const hidden = L.every(a => !a.g.visible || a.then === "hide" || (a.palm && a.mode === "climb"));
    q.tod("day"); q.sim(30);
    return [active && out.moved > .3 && perched && hidden, out];
  }));

  /* 5. rain darkens and pits the sand and rings the lake, and the sand dries again afterwards */
  check("rain on sand and lake", ...await page.evaluate(() => {
    const q = window.__desQA();
    window.__set({weather: "hrain", ct: "overcast"}); q.sim(90);
    const r = {wet: q.WX.wet, sandWet: q.sandU.uWetK.value, pits: q.sandU.uPitK.value, lake: q.pondU.uRainP.value, drops: [q.RAIN.near, q.RAIN.far].some(o => o && (o.visible || (o.o && o.o.visible)))};
    window.__set({weather: "sun", ct: "clear"}); q.sim(900, .5);
    r.wetAfterSun = q.WX.wet;
    for (const k in r) if (typeof r[k] === "number") r[k] = +r[k].toFixed(3);
    return [r.wet > .5 && r.sandWet > .3 && r.pits > .2 && r.lake > .5 && r.drops && r.wetAfterSun < r.wet - .2, r];
  }));
} finally { await browser.close(); server.close(); }
if (failures.length) { console.log(`\n${failures.length} failure(s)`); process.exit(1); }
console.log("\nall desert checks ok");
