// Desert d163 proofs, on any checkout (DIR, default this one; assets are committed, nothing is built). Not part of CI.
//   look    stills at the framings in CAMS (JSON [[name, [eye x,y,z, target x,y,z, fov], tod, weather], ...])
//   rim     the mirage pass's footprint round the island rim (frames with the pass on and forced off, differenced)
//   falls   the sand streams below the island: overview, day mid, dusk stills, their spread and fade, and a clip
//   tent    the tent in rain at eye level, the sky clouding over gradually, with the scene's rain sound
//   crslip  crab_v6c planted-foot slip, walk and fast run;  crwalk  the crab close and low, filling a third of the frame
// Clips are stepped at a fixed rate.
// Usage: node tools/e2e/d163-proof.mjs [look|rim|falls|tent|crslip|crwalk|all]   (OUT=/tmp/d163 DIR=<checkout> TAG=<file prefix>)
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {execFile} from "node:child_process";
import puppeteer from "puppeteer-core";
const ffmpeg = args => new Promise((res, rej) => execFile("ffmpeg", ["-y", "-loglevel", "error", ...args], {maxBuffer: 1e8}, (e, _o, se) => e ? rej(new Error(String(se).slice(-500))) : res()));
/* a crop's luma as rows of 0..255 */
const luma = (file, [w, h, x, y]) => new Promise((res, rej) => execFile("ffmpeg", ["-loglevel", "error", "-i", file, "-vf", `crop=${w}:${h}:${x}:${y}`, "-f", "rawvideo", "-pix_fmt", "gray", "-"],
  {encoding: "buffer", maxBuffer: 1e8}, (e, o) => e ? rej(e) : res(Array.from({length: h}, (_, r) => o.subarray(r * w, r * w + w)))));
const smooth = (a, k) => a.map((_, i) => { let s = 0, n = 0; for (let j = Math.max(0, i - k); j <= Math.min(a.length - 1, i + k); j++) { s += a[j]; n++; } return s / n; });
/* far: the largest step in column-mean brightness across the crop, columns 8 px apart */
const colStep = async (file, crop) => { const R = await luma(file, crop), w = crop[0], m = smooth(Array.from({length: w}, (_, c) => R.reduce((s, r) => s + r[c], 0) / R.length), 2);
  let mx = 0; for (let c = 0; c + 8 < w; c++) mx = Math.max(mx, Math.abs(m[c + 8] - m[c])); return +mx.toFixed(2); };
/* near: per column the largest brightness step down the crop, rows 6 px apart, median over the columns (a horizontal seam lifts every
   column; vertical streams do not) */
const rowStep = async (file, crop) => { const R = await luma(file, crop), [w, h] = crop, st = [];
  for (let c = 0; c < w; c += 2) { const v = smooth(R.map(r => r[c]), 2); let mx = 0; for (let i = 0; i + 6 < h; i++) mx = Math.max(mx, Math.abs(v[i + 6] - v[i])); st.push(mx); }
  st.sort((a, b) => a - b); return +st[st.length >> 1].toFixed(2); };
/* striping: the mean absolute second difference of row-mean brightness down a crop (bands across the rows), and of column means */
const bands = async (file, crop) => { const R = await luma(file, crop), [w, h] = crop;
  const rows = smooth(R.map(r => r.reduce((s, v) => s + v, 0) / w), 1), cols = smooth(Array.from({length: w}, (_, c) => R.reduce((s, r) => s + r[c], 0) / h), 1);
  const d2 = a => { let s = 0; for (let i = 2; i < a.length - 2; i++) s += Math.abs(a[i + 2] - 2 * a[i] + a[i - 2]); return +(s / (a.length - 4)).toFixed(3); };
  return {rows: d2(rows), cols: d2(cols)}; };

const ROOT = path.resolve(process.env.DIR || path.join(path.dirname(fileURLToPath(import.meta.url)), "../.."));
const OUT = process.env.OUT || "/tmp/d163";
const CHROME = process.env.CHROME || ["/usr/bin/google-chrome-stable", "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/local/bin/google-chrome"].find(p => fs.existsSync(p));
const WHICH = process.argv[2] || "all";
const W = +(process.env.W || 1280), H = +(process.env.H || 720);
const TAG = process.env.TAG || "";
fs.mkdirSync(OUT, {recursive: true});

const TYPES = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png",
  ".jpg": "image/jpeg", ".webp": "image/webp", ".ktx2": "image/ktx2", ".glb": "model/gltf-binary", ".mp3": "audio/mpeg", ".m4a": "audio/mp4",
  ".ogg": "audio/ogg", ".wasm": "application/wasm", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".bin": "application/octet-stream"};
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p.endsWith("/")) p += "index.html";
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, {"content-type": TYPES[path.extname(f)] || "application/octet-stream", "cache-control": "no-store"});
  fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(0, "127.0.0.1", r));
const ORIGIN = `http://127.0.0.1:${server.address().port}`;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const browser = await puppeteer.launch({executablePath: CHROME, headless: "new", protocolTimeout: 1800000,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader", "--autoplay-policy=no-user-gesture-required"]});

const HIDE = [".t", "#fab", "#sbtn", "#tp", "#ld"];
const page = await browser.newPage();
const crReq = new Set(), osReq = new Set();
page.on("request", r => { const k = /\/(crab_[a-z0-9_]+)\.glb/.exec(r.url()); if (k) crReq.add(k[1]); const m = /\/(ostrich_v2[a-z0-9]+)\.glb/.exec(r.url());
  /* ui.js's desPre prefetches every model in the size table, the unused ostrich versions too: only the desert's own loads count */
  const i = r.initiator(), pre = i && i.stack && i.stack.callFrames.some(f => f.functionName === "desPre"); if (m && !pre) osReq.add(m[1]); });
page.on("console", m => { const t = m.type(); if (t === "error" || t === "warning") console.log("PAGE", t, m.text().slice(0, 240)); });
page.on("pageerror", e => console.log("PAGEERR", String(e).slice(0, 300)));
await page.setViewport({width: W, height: H, deviceScaleFactor: 1});
await page.goto(ORIGIN + "/desert/?nosw=1&debug=1", {waitUntil: "domcontentloaded", timeout: 120000});
await page.waitForFunction(() => window.__ready && window.__desReady && window.__desQA && window.__desQA().ready, {timeout: 300000, polling: 500});
await page.evaluate(HIDE => {
  const q = window.__desQA(), C = window.__C();
  document.body.classList.add("col", "snc");
  for (const s of HIDE) { const n = document.querySelector(s); if (n) n.style.display = "none"; }
  q.freeze(true); q.tod("day"); window.__set({weather: "sun", ct: "clear", wind: .3});
  C.Ce.enabled = false; q.sim(2);
}, HIDE);

const frames = async n => page.evaluate(n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
async function shot(name) { await frames(3); await sleep(80); const f = path.join(OUT, name); await page.screenshot({path: f, type: "png"}); console.log("shot", f); return f; }
const cap = text => page.evaluate(text => {
  let d = document.getElementById("d163cap");
  if (!text) { if (d) d.remove(); return; }
  if (!d) { d = document.createElement("div"); d.id = "d163cap"; document.body.appendChild(d); }
  d.textContent = text;
  d.style.cssText = "position:fixed;left:18px;bottom:16px;z-index:50;pointer-events:none;font:600 20px 'WenQuanYi Micro Hei','Droid Sans Fallback',sans-serif;color:#fff;letter-spacing:.02em;text-shadow:0 1px 2px #000,0 0 4px #000";
}, text || "");
const capIn = "(t => { let d = document.getElementById('d163cap'); if (d) d.textContent = t; })";
/* N frames at `fps` into OUT/name.mp4: `each(i)` sets the scene and camera up (and steps it), returning a sample */
async function vid(name, N, each, keep, fps = 24) {
  const dir = path.join(OUT, name + "-frames");
  fs.rmSync(dir, {recursive: true, force: true}); fs.mkdirSync(dir);
  const log = [];
  for (let i = 0; i < N; i++) {
    const s = await each(i); log.push(s);
    await frames(1);
    await page.screenshot({path: path.join(dir, String(i).padStart(4, "0") + ".png")});
    if (s && s.stop) break;
    if (i % 5 === 4) console.log("frame", name, i + 1, "/", N);
  }
  await ffmpeg(["-framerate", String(fps), "-i", path.join(dir, "%04d.png"), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", path.join(OUT, name + ".mp4")]);
  console.log("encoded", name, log.length);
  if (!keep) fs.rmSync(dir, {recursive: true, force: true});
  return {dir, log};
}
const frameAt = (dir, i) => path.join(dir, String(i).padStart(4, "0") + ".png");
const strip = (files, out, crop, w = 480) => ffmpeg([...files.flatMap(f => ["-i", f]), "-filter_complex",
  files.map((_, j) => `[${j}:v]${crop ? `crop=${crop},` : ""}scale=${w}:-2[s${j}]`).join(";") + ";" + files.map((_, j) => `[s${j}]`).join("") + `hstack=inputs=${files.length}`, path.join(OUT, out)]);
/* clearance of each ostrich from the tent footprint (its local rectangle), metres; negative is inside */
const osClearJS = `() => { const q = window.__desQA(), T = q.TENT, c = Math.cos(T.yaw), s = Math.sin(T.yaw);
  return q.os().map(o => { const dx = o.x - T.x, dz = o.z - T.z, lx = Math.abs(dx * c - dz * s) - T.L / 2, lz = Math.abs(dx * s + dz * c) - T.D / 2;
    return +(lx > 0 || lz > 0 ? Math.hypot(Math.max(lx, 0), Math.max(lz, 0)) : Math.max(lx, lz)).toFixed(2); }); }`;
const lab = (t, x) => `drawtext=fontfile=/usr/share/fonts/truetype/wqy/wqy-microhei.ttc:text='${t}':x=${x}:y=12:fontsize=26:fontcolor=white:borderw=2:bordercolor=black`;
const want = k => WHICH === "all" || WHICH === k || WHICH.split(",").includes(k);
const fails = [];
const report = {};

/* #160's framings, island metres: [eye x, y, z, target x, y, z, fov] */
const DES = {
  far: [58, 6, 40, 4, -10, 2, 36],
  mid: [36, 1.5, 25, 7, -7.5, 4.5, 38],
  near: [27.8, 1.6, 19.5, 12, -3.5, 8.4, 44],
  full: [84, -6, 60, 2, -16, 0, 40],
  /* wider still: the whole island and its falls down to the cloud, and from the far side */
  wide: [96, 14, 70, 2, -14, 0, 40],
  back: [-70, 8, -62, 0, -12, 0, 40],
};
const DES_OV = [-4.16, 11.13, 19.58, 0, 0, 0, 40];
const desCam = v => page.evaluate(v => { const q = window.__desQA(), C = window.__C(); q.lookAt(v[0], v[1], v[2], v[3], v[4], v[5]); C.De.fov = v[6]; C.De.near = .15; C.De.updateProjectionMatrix(); }, v);
const desCamW = v => page.evaluate(v => { const C = window.__C(); C.De.position.set(v[0], v[1], v[2]); C.Ce.target.set(v[3], v[4], v[5]); C.De.lookAt(C.Ce.target); C.De.fov = v[6]; C.De.near = .1; C.De.updateProjectionMatrix(); }, v);
const desTod = k => page.evaluate(k => { const q = window.__desQA(); window.__set(k === "night" ? {mode: "full"} : {mode: "manual"}); q.tod(k); q.sim(1.5); }, k === "dusk" ? "sunset" : k);

/* the sand falls: each stream's rim point and half width; the share of the rim they cover (the union of their angular spans, exact),
   and the widest run of rim covered without a gap (a ring curtain covers it all) */
const fallsStat = () => page.evaluate(() => {
  const q = window.__desQA(), F = q.sf().F, T = 2 * Math.PI;
  const R = F.map(f => Math.hypot(f.x, f.z)), rMean = R.reduce((s, r) => s + r, 0) / Math.max(1, R.length);
  const iv = [];
  for (const f of F) { const a = ((Math.atan2(f.z, f.x) % T) + T) % T, da = Math.min(Math.PI, f.hw / Math.max(1, Math.hypot(f.x, f.z)));
    if (a - da < 0) iv.push([a - da + T, T], [0, a + da]); else if (a + da > T) iv.push([a - da, T], [0, a + da - T]); else iv.push([a - da, a + da]); }
  iv.sort((x, y) => x[0] - y[0]);
  const m = []; for (const v of iv) { const l = m[m.length - 1]; if (l && v[0] <= l[1]) l[1] = Math.max(l[1], v[1]); else m.push(v.slice()); }
  let n = 0, best = 0; for (const v of m) { n += v[1] - v[0]; best = Math.max(best, v[1] - v[0]); }
  if (m.length > 1 && m[0][0] <= 0 && m[m.length - 1][1] >= T) best = Math.max(best, m[0][1] - m[0][0] + m[m.length - 1][1] - m[m.length - 1][0]);
  const hw = F.map(f => f.hw).sort((a, b) => a - b);
  return {streams: F.length, rimRadius: +rMean.toFixed(2), rimCovered: +(n / T).toFixed(3), widestRunDeg: +(best / T * 360).toFixed(1),
    hwMin: +hw[0].toFixed(2), hwMedian: +hw[hw.length >> 1].toFixed(2), hwMax: +hw[hw.length - 1].toFixed(2), rate: +q.sf().rate.toFixed(3)};
});

const tod = k => page.evaluate(k => { const q = window.__desQA(); window.__set(k === "night" ? {mode: "full"} : {mode: "manual"}); q.tod(k === "dusk" ? "sunset" : k); q.sim(1.5); }, k);
const cam = v => page.evaluate(v => { const q = window.__desQA(), C = window.__C(); q.lookAt(v[0], v[1], v[2], v[3], v[4], v[5]); C.De.fov = v[6]; C.De.near = v[7] || .15; C.De.updateProjectionMatrix(); C.De.updateMatrixWorld(true); }, v);

try {
  report.live = await page.evaluate(() => ({desert: window.CY && window.CY.desert, ver: (document.getElementById("ver") || {}).textContent || null}));
  console.log("live", JSON.stringify(report.live));

  /* ---------------- stills at given framings ---------------- */
  if (want("look")) {
    for (const [name, v, k, w] of JSON.parse(process.env.CAMS || "[]")) {
      await page.evaluate(w => { window.__set(Object.assign({weather: "sun", ct: "clear", wind: .5}, w || {})); window.__desQA().sim(3); }, w);
      await tod(k || "day"); await cam(DES[v] || v);
      if (process.env.EVAL) console.log("eval", JSON.stringify(await page.evaluate(process.env.EVAL)));
      await shot(`${TAG}${name}.png`);
    }
  }
  /* ---------------- sand falls: separate streams that fan out, thin and end as sand mist carried by the wind ---------------- */
  if (want("falls")) {
    await page.evaluate(() => { window.__set({weather: "sun", ct: "clear", wind: .6}); const q = window.__desQA(); q.tod("day"); q.sfR(null); q.windPin(null); q.sim(4); });
    report.falls = {stat: await fallsStat()};
    console.log("falls", JSON.stringify(report.falls.stat));
    if (report.falls.stat.rimCovered > .35 || report.falls.stat.widestRunDeg > 20) fails.push("sand falls cover the rim like a curtain");
    const shots = [["day", "full", "C_sandfall_overview_day.png", "沙流（白天全景）：一股股分开的沙流，落过岛底后散开变淡，化成细沙雾"],
      ["day", "mid", "C_sandfall_mid_day.png", "沙流（白天中景）：主沙流过了岛底继续下落，边缘撕成细丝、逐渐稀薄"],
      ["dusk", "full", "C_sandfall_dusk.png", "沙流（黄昏）：分股下落、渐散成雾，不是整圈沙帘"]];
    for (const [k, v, f, t] of shots) { await desTod(k); await desCam(DES[v]); await cap(t); await shot(TAG + f); }
    await desTod("day");
    /* the same falls with a strong wind from two opposite sides: the mist leans downwind */
    for (const [a, nm, t] of [[0, "A", "强风（风向 A）：下段沙雾被吹向下风方向"], [Math.PI, "B", "强风（风向 B，反向）：沙雾随风改向"]]) {
      await page.evaluate(a => { const q = window.__desQA(); window.__set({wind: 1}); q.windPin(a); q.sim(6); }, a);
      report.falls["wind" + nm] = await page.evaluate(() => window.__desQA().wind());
      await desCam(DES.mid); await cap(t); await shot(`${TAG}C_sandfall_wind_${nm}.png`);
    }
    await page.evaluate(() => { const q = window.__desQA(); q.windPin(null); window.__set({wind: .6}); q.sim(3); });
    if (!process.env.NOVID) {
      await cap("沙流：下落中散开、变淡成雾，随风向转动而飘移（片中风向转动）");
      const FN = +(process.env.FN || 48);
      const r = await vid(`${TAG}sandfall-mist`, FN, async i => page.evaluate((i, FN) => {
        const q = window.__desQA(); window.__set({wind: .9}); q.windPin(i / FN * Math.PI * 1.5); q.step(4, 1 / 48);
        const v = [36, 1.5, 25, 7, -7.5, 4.5, 38], C = window.__C(); q.lookAt(v[0], v[1], v[2], v[3], v[4], v[5]); C.De.fov = v[6]; C.De.near = .15; C.De.updateProjectionMatrix();
        return {a: +q.wind().a.toFixed(2)};
      }, i, FN), false, 12);
      report.falls.clip = {frames: r.log.length, windFrom: r.log[0].a, windTo: r.log[r.log.length - 1].a};
      await page.evaluate(() => { const q = window.__desQA(); q.windPin(null); window.__set({wind: .5}); });
    }
    report.falls.statAfter = await fallsStat();
    await cap("");
  }
//@@SECTIONS@@
} catch (e) {
  console.log("PROOF ERROR", String(e && e.stack || e).slice(0, 1500));
  fails.push("exception");
} finally {
  const rf = path.join(OUT, `${TAG}d163-report.json`);
  let prev = {}; try { prev = JSON.parse(fs.readFileSync(rf, "utf8")); } catch (e) {}
  for (const k of Object.keys(report)) if (prev[k] && typeof prev[k] === "object" && !Array.isArray(prev[k])) report[k] = Object.assign(prev[k], report[k]);
  fs.writeFileSync(rf, JSON.stringify(Object.assign(prev, report), null, 2));
  await browser.close(); server.close();
}
if (fails.length) { console.log("PROOF FAIL", fails.join("; ")); process.exit(1); }
console.log("d163 proofs ok");
