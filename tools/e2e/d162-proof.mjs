// Desert #162 proofs. Wide and far shots by day and at dusk at #160's framings (wide), with the near seam band, the dusk far right
// and the upper-right slope measured on them; the sand falls as separate streams round the rim, stills and a clip (falls); the tent
// in rain from eye level with each ostrich kept out of the tent's silhouette on screen (tent); the crab walking sideways close up,
// with both foot-slip measures (crwalk, crslip). Clips are stepped at a fixed rate. Not part of CI.
// Usage: node tools/e2e/d162-proof.mjs [wide|falls|tent|crslip|crwalk|all]   (OUT=/tmp/d162)
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

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = process.env.OUT || "/tmp/d162";
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
page.on("request", r => { const k = /\/(crab_[a-z0-9_]+)\.glb/.exec(r.url()); if (k) crReq.add(k[1]); const m = /\/(ostrich_v2[a-z0-9]+)\.glb/.exec(r.url()); if (m) osReq.add(m[1]); });
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
  let d = document.getElementById("d162cap");
  if (!text) { if (d) d.remove(); return; }
  if (!d) { d = document.createElement("div"); d.id = "d162cap"; document.body.appendChild(d); }
  d.textContent = text;
  d.style.cssText = "position:fixed;left:18px;bottom:16px;z-index:50;pointer-events:none;font:600 20px 'WenQuanYi Micro Hei','Droid Sans Fallback',sans-serif;color:#fff;letter-spacing:.02em;text-shadow:0 1px 2px #000,0 0 4px #000";
}, text || "");
const capIn = "(t => { let d = document.getElementById('d162cap'); if (d) d.textContent = t; })";
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
  }
  await ffmpeg(["-framerate", String(fps), "-i", path.join(dir, "%04d.png"), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", path.join(OUT, name + ".mp4")]);
  console.log("encoded", name, log.length);
  if (!keep) fs.rmSync(dir, {recursive: true, force: true});
  return {dir, log};
}
const frameAt = (dir, i) => path.join(dir, String(i).padStart(4, "0") + ".png");
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

/* the sand falls: each stream's rim point and half width; the share of the rim they cover, and the widest run of rim covered without
   a gap (a ring curtain covers it all) */
const fallsStat = () => page.evaluate(() => {
  const q = window.__desQA(), F = q.sf().F, N = 720, cov = new Uint8Array(N);
  const R = F.map(f => Math.hypot(f.x, f.z)), rMean = R.reduce((s, r) => s + r, 0) / Math.max(1, R.length);
  for (const f of F) { const a = Math.atan2(f.z, f.x), da = f.hw / Math.max(1, Math.hypot(f.x, f.z));
    for (let k = Math.floor((a - da) / (2 * Math.PI) * N); k <= Math.ceil((a + da) / (2 * Math.PI) * N); k++) cov[((k % N) + N) % N] = 1; }
  let n = 0, run = 0, best = 0; for (let k = 0; k < 2 * N; k++) { if (cov[k % N]) { run++; best = Math.max(best, run); } else run = 0; } for (const c of cov) n += c;
  const hw = F.map(f => f.hw).sort((a, b) => a - b);
  return {streams: F.length, rimRadius: +rMean.toFixed(2), rimCovered: +(n / N).toFixed(3), widestRunDeg: +(Math.min(best, N) / N * 360).toFixed(1),
    hwMin: +hw[0].toFixed(2), hwMedian: +hw[hw.length >> 1].toFixed(2), hwMax: +hw[hw.length - 1].toFixed(2), rate: +q.sf().rate.toFixed(3)};
});

try {
  report.live = await page.evaluate(() => ({desert: window.CY && window.CY.desert, crab: window.CY.ms && window.CY.ms.crab_v6c, os: window.CY.ms && window.CY.ms.ostrich_v2ag}));
  console.log("live", JSON.stringify(report.live));

  /* ---------------- wide and far, day and dusk ---------------- */
  if (want("wide")) {
    await page.evaluate(() => { window.__set({weather: "sun", ct: "clear", wind: .5}); const q = window.__desQA(); q.sfR(null); q.windPin(null); q.sim(4); });
    const M = report.wide = {};
    for (const k of ["day", "dusk"]) {
      await desTod(k);
      for (const [v, cam] of [["far", DES.far], ["wide", DES.wide], ["full", DES.full], ["mid", DES.mid], ["near", DES.near], ["back", DES.back]]) {
        await desCam(cam); await shot(`${TAG}B_${k}_${v}.png`);
      }
      await desCamW(DES_OV); await shot(`${TAG}B_${k}_overview.png`);
      const f = n => path.join(OUT, `${TAG}B_${k}_${n}.png`);
      M[k] = {
        /* #159/#160's bands: the far right half, the near seam band */
        farRightColStep: await colStep(f("far"), [450, 290, 560, 330]),
        nearSeamRowStep: await rowStep(f("near"), [940, 140, 260, 540]),
        farCliffBands: await bands(f("far"), [430, 330, 420, 150]),
        farSlopeBands: await bands(f("far"), [800, 200, 200, 120]),
      };
    }
    await desTod("day");
    console.log("wide", JSON.stringify(M));
  }

  /* ---------------- sand falls: separate streams ---------------- */
  if (want("falls")) {
    await page.evaluate(() => { window.__set({weather: "sun", ct: "clear", wind: .8}); const q = window.__desQA(); q.tod("day"); q.sfR(null); q.windPin(null); q.sim(4); });
    report.falls = {stat: await fallsStat()};
    console.log("falls", JSON.stringify(report.falls.stat));
    if (report.falls.stat.rimCovered > .35 || report.falls.stat.widestRunDeg > 20) fails.push("sand falls cover the rim like a curtain");
    for (const k of ["day", "dusk"]) {
      await desTod(k);
      await desCam(DES.full); await cap(k === "day" ? "沙瀑（白天）：崖边一股股分开的竖直沙流，中间露出石崖和天空" : "沙瀑（黄昏）：分开的竖直沙流，不是整圈沙帘");
      await shot(`${TAG}B_sandfall_${k}_full.png`);
      await desCam(DES.mid); await shot(`${TAG}B_sandfall_${k}_mid.png`);
    }
    await desTod("day");
    await cap("沙瀑：分开的竖直沙流随风摆动（风向在片中转动）");
    const r = await vid(`${TAG}sandfall-streams`, 24 * 5, async i => page.evaluate(i => {
      const q = window.__desQA(); if (i === 0) q.windPin(null); q.step(2, 1 / 48);
      const v = [84, -6, 60, 2, -16, 0, 40], C = window.__C(), a = i / 120 * .5;
      q.lookAt(v[0] * Math.cos(a) - v[2] * Math.sin(a), v[1], v[0] * Math.sin(a) + v[2] * Math.cos(a), v[3], v[4], v[5]); C.De.fov = v[6]; C.De.near = .15; C.De.updateProjectionMatrix();
      return {n: q.sf().n};
    }, i), false);
    report.falls.clip = {frames: r.log.length};
    report.falls.statAfter = await fallsStat();
    await cap("");
  }
} catch (e) {
  console.log("PROOF ERROR", String(e && e.stack || e).slice(0, 1500));
  fails.push("exception");
} finally {
  const rf = path.join(OUT, `${TAG}d162-report.json`);
  let prev = {}; try { prev = JSON.parse(fs.readFileSync(rf, "utf8")); } catch (e) {}
  for (const k of Object.keys(report)) if (prev[k] && typeof prev[k] === "object" && !Array.isArray(prev[k])) report[k] = Object.assign(prev[k], report[k]);
  fs.writeFileSync(rf, JSON.stringify(Object.assign(prev, report), null, 2));
  await browser.close(); server.close();
}
if (fails.length) { console.log("PROOF FAIL", fails.join("; ")); process.exit(1); }
console.log("d162 proofs ok");
