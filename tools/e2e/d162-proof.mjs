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

  /* ---------------- tent in rain from eye level, no ostrich inside the tent's silhouette ---------------- */
  /* TC(az): the eye-level camera on the tent from azimuth az (eye 1.55 m over the sand, 6.8 m from the tent's centre).
     silh(): the tent's screen rectangle (its footprint and 2.2 m height, poles and ropes allowed for) and each ostrich's (feet to head,
     its body width either side), with whether the bird is further from the eye than the tent's nearest corner. An ostrich "in the
     silhouette" is one behind the tent whose rectangle overlaps the tent's: that is the frame where it can seem to stand on the roof. */
  const tentJS = `(() => { const q = window.__desQA(), C = window.__C(), T = q.TENT, gy = q.hTop(T.x, T.z), c = Math.cos(T.yaw), s = Math.sin(T.yaw);
    const TC = (az, dist = 6.8, eh = 1.55) => { q.lookAt(T.x + Math.sin(az) * dist, gy + eh, T.z + Math.cos(az) * dist, T.x, gy + 1.15, T.z);
      C.De.fov = 42; C.De.near = .05; C.De.updateProjectionMatrix(); C.De.updateMatrixWorld(true); };
    const P = (x, y, z) => { const v = q.toW(x, y, z), d = v.distanceTo(C.De.position); v.project(C.De); return [v.x, v.y, d, v.z < 1]; };
    const rect = pts => { const r = [1e9, 1e9, -1e9, -1e9]; let dm = 1e9; for (const p of pts) { r[0] = Math.min(r[0], p[0]); r[1] = Math.min(r[1], p[1]); r[2] = Math.max(r[2], p[0]); r[3] = Math.max(r[3], p[1]); dm = Math.min(dm, p[2]); } return {r, dm}; };
    const tent = () => { const pts = []; for (const lx of [-T.L / 2 - .3, T.L / 2 + .3]) for (const lz of [-T.D / 2 - .3, T.D / 2 + .3]) for (const y of [gy, gy + T.H + .5])
      pts.push(P(T.x + lx * c + lz * s, y, T.z - lx * s + lz * c)); return rect(pts); };
    const bird = (o, x, z) => { const g = q.hTop(x, z), pts = []; for (const dx of [-.6, .6]) for (const dz of [-.6, .6]) for (const y of [g, g + Math.max(2.1, o.headY + .15)]) pts.push(P(x + dx, y, z + dz)); return rect(pts); };
    const ov = (a, b, m = 0) => a[0] - m < b[2] && b[0] - m < a[2] && a[1] - m < b[3] && b[1] - m < a[3];
    const onScr = r => r[2] > -1 && r[0] < 1 && r[3] > -1 && r[1] < 1;
    const silh = (ahead = 0, m = 0) => { const t = tent(); return q.os().map(o => { const x = o.x + Math.sin(o.yaw) * o.v * ahead, z = o.z + Math.cos(o.yaw) * o.v * ahead, b = bird(o, x, z);
      return {behind: b.dm > t.dm, on: onScr(b.r), hit: b.dm > t.dm && ov(b.r, t.r, m)}; }); };
    return {TC, silh, tent, bird, P}; })()`;
  if (want("tent")) {
    await cap(" ");
    /* where the ostriches go over a long day: for each azimuth, the share of one-second samples with a bird inside the silhouette */
    report.tent = Object.assign(report.tent || {}, {pick: await page.evaluate(js => {
      const q = window.__desQA(), K = (new Function("return " + js))(), AZ = Array.from({length: 16}, (_, i) => i / 16 * Math.PI * 2), hits = AZ.map(() => 0);
      window.__set({weather: "sun", ct: "clear", wind: .3}); q.tod("day"); let n = 0;
      for (const w of [{weather: "sun", ct: "clear", wind: .3}, {weather: "hrain", ct: "overcast", wind: .5}, {weather: "sun", ct: "clear", wind: .5}]) {
        window.__set(w); for (let i = 0; i < 300; i++) { q.sim(1, .1); n++; AZ.forEach((a, k) => { K.TC(a); if (K.silh().some(b => b.hit)) hits[k]++; }); } }
      return {samples: n, share: AZ.map((a, k) => ({az: +a.toFixed(3), share: +(hits[k] / n).toFixed(3)}))};
    }, tentJS)});
    /* the clearest azimuth that also looks at the tent's front quarter (its door and the fire), not straight at its back */
    const P = report.tent.pick, tyaw = await page.evaluate(() => window.__desQA().TENT.yaw);
    const front = a => Math.cos(a - tyaw) > -.2;
    const best = P.share.filter(s => front(s.az)).sort((a, b) => a.share - b.share)[0];
    P.chosen = best; console.log("tent azimuths", JSON.stringify(P));
    /* the ostriches start out in view on the camera's side, one each side of the tent, standing on the sand in front of it */
    await page.evaluate(az => { const q = window.__desQA(), T = q.TENT, PA = q.PA;
      window.__set({weather: "sun", ct: "clear", wind: .3}); q.tod("day");
      const fx = Math.sin(az), fz = Math.cos(az), rx = Math.cos(az), rz = -Math.sin(az);
      PA.os.forEach((A, k) => { const sd = k ? 1 : -1, x = T.x + fx * 3.9 + rx * sd * 3.6, z = T.z + fz * 3.9 + rz * sd * 3.6;
        q.osPlace(A, x, z, Math.atan2(rx * sd, rz * sd) + (k ? .6 : -.6)); A.mode = "graze"; A.t = 12; A.path = null; });
      q.sim(2, 1 / 24); window.__wi = 0; window.__steer = 0; window.__az = az; }, best.az);
    /* each frame: if a bird is heading into the silhouette (where it would be in the next 2.5 s, with a margin), it is sent off to
       open sand on the camera's side; the frame is then checked as drawn */
    const r = await vid("tent-rain", 12 * 6, async () => page.evaluate((capIn, js, clr) => {
      const q = window.__desQA(), i = window.__wi++, K = (new Function("return " + js))(), az = window.__az;
      if (i === 8) window.__set({weather: "hrain", ct: "overcast"});
      (new Function("t", capIn + "(t)"))(i < 8 ? "帐篷：晴天，布面干燥；鸵鸟站在帐篷前的沙地上" : i < 32 ? "下雨：布面逐渐湿透变深（缩时，每帧 2 s）" : "雨中（实时）：雨点溅起、雨水顺着布面流下（附场景雨声）");
      const tl = i >= 8 && i < 32, dt = tl ? 2 : 1 / 12;
      for (let k = 0; k < (tl ? 8 : 1); k++) {
        K.TC(az); const pr = K.silh(tl ? 2.5 : 1.2, .12);
        pr.forEach((b, j) => { if (!b.hit) return; const A = q.PA.os[j], T = q.TENT, sd = (Math.sin(az) * (A.z - T.z) - Math.cos(az) * (A.x - T.x)) > 0 ? 1 : -1;
          const fx = Math.sin(az), fz = Math.cos(az), rx = Math.cos(az), rz = -Math.sin(az);
          for (const [f, s] of [[4.2, 3.8], [4.8, 4.6], [3.4, 5.2], [5.5, 3.2]]) { if (q.osGo(A, {x: T.x + fx * f - rx * sd * s, z: T.z + fz * f - rz * sd * s}, false)) { window.__steer++; break; } } });
        if (tl) q.sim(dt / 8, 1 / 24); else q.step(2, 1 / 24);
      }
      K.TC(az);
      return {i, tentWet: +q.tentU.uWetC.value.toFixed(3), silh: K.silh(), clear: (new Function("return " + clr))()(), steer: window.__steer, os: q.os().map(o => [+o.x.toFixed(2), +o.z.toFixed(2), o.mode])};
    }, capIn, tentJS, osClearJS), true, 12);
    const s = r.log;
    report.tent = Object.assign(report.tent, {frames: s.length, fps: 12, dry: s[7].tentWet, wet: s[s.length - 1].tentWet,
      inSilhouetteFrames: s.filter(v => v.silh.some(b => b.hit)).length, birdOnScreenFrames: s.filter(v => v.silh.some(b => b.on)).length,
      birdBehindOnScreenFrames: s.filter(v => v.silh.some(b => b.on && b.behind)).length, steered: s[s.length - 1].steer,
      osMinClearance: Math.min(...s.flatMap(v => v.clear))});
    if (!(report.tent.dry < .1 && report.tent.wet > .3)) fails.push("tent clip: cloth did not go from dry to wet");
    if (report.tent.inSilhouetteFrames) fails.push("tent clip: an ostrich inside the tent silhouette in " + report.tent.inSilhouetteFrames + " frames");
    if (!(report.tent.osMinClearance > 0)) fails.push("tent clip: ostrich on the tent");
    await strip([2, 14, 22, 30, 44, 64].filter(i => i < s.length).map(i => frameAt(r.dir, i)), "B_tent_rain_eye_level_strip.png", null, 426);
    await ffmpeg(["-i", frameAt(r.dir, 4), "-frames:v", "1", "-update", "1", path.join(OUT, "B_tent_rain_eye_level_dry.png")]);
    await ffmpeg(["-i", frameAt(r.dir, Math.min(s.length - 1, 50)), "-frames:v", "1", "-update", "1", path.join(OUT, "B_tent_rain_eye_level_wet.png")]);
    fs.rmSync(r.dir, {recursive: true, force: true});
    /* the same moment from above: where the ostriches really are */
    await page.evaluate(() => { const q = window.__desQA(), C = window.__C(), T = q.TENT, y = q.hTop(T.x, T.z);
      q.lookAt(T.x + 1.5, y + 11, T.z + 8, T.x, y + 1, T.z); C.De.fov = 50; C.De.updateProjectionMatrix(); });
    await cap("雨中的帐篷，从高处看：鸵鸟都在帐篷外的沙地上，帐篷顶上没有鸵鸟"); await shot("B_tent_rain_roof_above.png"); await cap("");
    /* the rain sound, recorded off the scene's own bus as d161 did */
    await page.keyboard.press("F9");
    await page.evaluate(() => { window.__desQA().freeze(false); });
    await page.waitForFunction(() => { const A = window.__desQA().AU; return A.bus && A.lp.rain && window.__sound.ctx === "running"; }, {timeout: 120000, polling: 250}).catch(() => {});
    const au = await page.evaluate(async () => {
      const q = window.__desQA(), A = q.AU; if (!A.bus) return {err: "no bus"};
      window.__set({weather: "hrain", ct: "overcast"}); q.sim(30, .5);
      await new Promise(r => setTimeout(r, 3000));
      const ctx = A.bus.context, dst = ctx.createMediaStreamDestination(); A.bus.connect(dst);
      const rec = new MediaRecorder(dst.stream), ch = []; rec.ondataavailable = e => ch.push(e.data);
      const done = new Promise(r => { rec.onstop = r; });
      rec.start(); await new Promise(r => setTimeout(r, 6500)); rec.stop(); await done; A.bus.disconnect(dst);
      const b = new Blob(ch, {type: rec.mimeType}), u8 = new Uint8Array(await b.arrayBuffer());
      let bin = ""; for (let i = 0; i < u8.length; i += 32768) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 32768));
      return {mime: rec.mimeType, bytes: u8.length, b64: btoa(bin)};
    });
    await page.evaluate(() => { const q = window.__desQA(); q.freeze(true); window.__set({weather: "sun", ct: "clear"}); q.sim(900, 1); });
    report.tent.sound = {mime: au.mime, bytes: au.bytes, err: au.err};
    if (au.b64) {
      const af = path.join(OUT, "tent-rain-sound.webm"), v0 = path.join(OUT, "tent-rain.mp4"), v1 = path.join(OUT, "tent-rain-av.mp4");
      fs.writeFileSync(af, Buffer.from(au.b64, "base64"));
      await ffmpeg(["-i", v0, "-stream_loop", "-1", "-i", af, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "128k", "-shortest", v1]);
      fs.renameSync(v1, v0); fs.rmSync(af);
      const vol = await new Promise(r => execFile("ffmpeg", ["-i", v0, "-af", "volumedetect", "-f", "null", "-"], (e, o, se) => r(String(se).match(/mean_volume: (-?[\d.]+) dB/))));
      report.tent.sound.meanDb = vol ? +vol[1] : null;
      if (!vol || +vol[1] < -60) fails.push("tent clip: rain sound silent");
    } else fails.push("tent clip: no rain sound recorded");
    report.tent.osRequested = [...osReq];
    if ([...osReq].some(k => k !== "ostrich_v2ag")) fails.push("ostrich file other than v2ag requested: " + [...osReq]);
    console.log("tent", JSON.stringify({...report.tent, pick: undefined}));
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
