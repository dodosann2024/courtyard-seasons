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
    if (i % 5 === 4) console.log("frame", name, i + 1, "/", N, ((Date.now() - (vid.t0 || (vid.t0 = Date.now()))) / 1000).toFixed(0) + "s");
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
  /* ---------------- tent in rain: a camera that sees the tent whole, the sand in front and the lake behind; no ostrich in frame ---------------- */
  if (want("tent")) {
    await cap(" ");
    /* TCAM(k): k=0 the wide framing (tent right of centre, lake behind on the left), k=1 the push-in on the tent's front */
    const tentJS = `(() => { const q = window.__desQA(), C = window.__C(), T = q.TENT || {x: 5.4, z: -3.9}, gy = q.hTop(T.x, T.z), P0 = {x: -7.2, z: 6.2};
      const dx = T.x - P0.x, dz = T.z - P0.z, dl = Math.hypot(dx, dz), ux = dx / dl, uz = dz / dl, px = -uz, pz = ux;
      /* from the open sand off the tent's flank away from the rug rack, the lake behind the tent */
      const cam = k => { const s = 1 - .38 * k, h = 2.6 - .8 * k, ts = 1 - .5 * k;
        const ex = T.x - 3.2 * s, ez = T.z - 6.4 * s, tx = T.x - 2.34 * ts, tz = T.z + 1.87 * ts;
        q.lookAt(ex, gy + h, ez, tx, gy + .8 + .1 * k, tz); C.De.fov = 50 - 6 * k; C.De.near = .05; C.De.updateProjectionMatrix(); C.De.updateMatrixWorld(true);
        return {ex, ez}; };
      /* is a bird (feet to head, 0.7 m either side) anywhere in the frame, with a margin? */
      const inFrame = (x, z, m = .15) => { const g = q.hTop(x, z); let hit = false;
        for (const ox of [-.7, .7]) for (const oz of [-.7, .7]) for (const y of [g, g + 2.4]) { const v = q.toW(x + ox, y, z + oz); v.project(C.De);
          if (v.z < 1 && v.x > -1 - m && v.x < 1 + m && v.y > -1 - m && v.y < 1 + m) hit = true; }
        return hit; };
      /* open sand out of both framings, farthest from the tent first */
      const away = () => { if (window.__AW) return window.__AW; const out = [];
        for (let x = -40; x <= 40; x += 2) for (let z = -40; z <= 40; z += 2) { if (q.sN(x, z) > .8 || Math.hypot(x - T.x, z - T.z) < 8) continue;
          cam(1); if (inFrame(x, z, .35)) continue; cam(0); if (inFrame(x, z, .35)) continue; out.push({x, z, d: Math.hypot(x - T.x, z - T.z)}); }
        cam(0); out.sort((a, b) => a.d - b.d);
        const pick = []; for (const p of out) if (p.d > 10 && pick.every(o => Math.hypot(o.x - p.x, o.z - p.z) > 5)) { pick.push(p); if (pick.length === 4) break; }
        return window.__AW = pick.length ? pick : out.slice(0, 4); };
      return {cam, inFrame, away, T, gy}; })()`;
    report.tent = {};
    /* the birds start out of shot, behind the camera's side of the island */
    report.tent.start = await page.evaluate(js => { const q = window.__desQA(), K = (new Function("return " + js))();
      window.__set({weather: "sun", ct: "clear", wind: .35}); q.tod("day"); q.sim(2);
      window.__AW = null; const A = K.away(); q.PA.os.forEach((o, k) => { const p = A[k % A.length]; q.osPlace(o, p.x, p.z, Math.random() * 6.28); o.mode = "graze"; o.t = 20; o.path = null; });
      q.sim(1, 1 / 24); K.cam(0); window.__wi = 0; window.__steer = 0;
      return {away: A.map(p => [+p.x.toFixed(1), +p.z.toFixed(1)]), os: q.os().map(o => [+o.x.toFixed(1), +o.z.toFixed(1)])}; }, tentJS);
    /* TN frames at TFPS. Stages: clear and dry; the sky clouds over in steps (scattered, towering, overcast); a light shower sets in;
       heavy rain as a timelapse (cloth soaks, puddles spread on the sand, the lake is pocked with rings); then real time with a slow push-in */
    const TN = +(process.env.TN || 84), TFPS = +(process.env.TFPS || 12);
    const ST = [[0, .12, "clear"], [.12, .4, "cloud"], [.4, .55, "light"], [.55, .78, "heavy"], [.78, 1, "real"]].map(([a, b, n]) => [Math.round(a * TN), Math.round(b * TN), n]);
    const r = await vid("tent-rain", TN, async () => page.evaluate((capIn, js, ST, TFPS) => {
      const q = window.__desQA(), i = window.__wi++, K = (new Function("return " + js))();
      const [a, b, n] = ST.find(s => i >= s[0] && i < s[1]) || ST[ST.length - 1], f = (i - a) / Math.max(1, b - a);
      let dt = 1 / TFPS, k = 0, txt;
      if (n === "clear") { window.__set({weather: "sun", ct: "clear", wind: .35}); txt = "晴：帐篷布面干燥，沙地和湖面平静"; }
      else if (n === "cloud") { const ct = f < .3 ? "scattered" : f < .65 ? "towering" : "overcast"; window.__set({weather: "sun", ct, wind: .35 + .3 * f}); dt = 2.5;
        txt = f < .3 ? "天色渐变：先是片片云" : f < .65 ? "云越积越厚（缩时）" : "天转阴，风起（缩时）"; }
      else if (n === "light") { window.__set({weather: "lrain", wind: .6}); dt = 1.5; txt = "小阵雨开始：雨丝落下，沙地出现深色湿斑（缩时）"; }
      else if (n === "heavy") { window.__set({weather: "hrain", wind: .7}); dt = 3; txt = "大雨（缩时）：布面湿透变深、雨水顺布面流下，沙地积起水洼，湖面布满雨点涟漪"; }
      else { window.__set({weather: "hrain", wind: .7}); k = Math.min(1, f * 1.4); txt = "大雨（实时，镜头推近）：雨点在布面溅起，水顺着布面和绳子往下淌"; }
      (new Function("t", capIn + "(t)"))(txt);
      const sub = dt > .2 ? Math.ceil(dt / .25) : 1;
      for (let s = 0; s < sub; s++) {
        K.cam(k);
        q.PA.os.forEach((o, j) => { const x = o.x + Math.sin(o.yaw) * o.v * 2, z = o.z + Math.cos(o.yaw) * o.v * 2;
          if (K.inFrame(o.x, o.z) || K.inFrame(x, z)) { for (const p of K.away()) if (q.osGo(o, p, false)) { window.__steer++; break; } } });
        if (sub > 1) q.sim(dt / sub, 1 / 12); else q.step(Math.max(1, Math.round(24 / TFPS)), 1 / 24);
      }
      K.cam(k);
      const inF = q.PA.os.map(o => K.inFrame(o.x, o.z, 0));
      return {i, n, ct: window.__C ? null : null, tentWet: +q.tentU.uWetC.value.toFixed(3), wx: {wet: +q.WX.wet.toFixed(3), ovc: +(q.WX.ovc || 0).toFixed(3)}, inFrame: inF, steer: window.__steer};
    }, capIn, tentJS, ST, TFPS), true, TFPS);
    const s = r.log, at = nm => ST.find(v => v[2] === nm);
    report.tent = Object.assign(report.tent, {frames: s.length, fps: TFPS, stages: ST,
      ovc: s.filter((_, j) => j % 6 === 0).map(v => v.wx.ovc), wet: s.filter((_, j) => j % 6 === 0).map(v => v.wx.wet),
      tentWet: s.filter((_, j) => j % 6 === 0).map(v => v.tentWet), ostrichInFrameFrames: s.filter(v => v.inFrame.some(Boolean)).length, steered: s[s.length - 1].steer});
    if (report.tent.ostrichInFrameFrames) fails.push("tent clip: an ostrich in frame in " + report.tent.ostrichInFrameFrames + " frames");
    if (!(s[at("light")[0] - 1].tentWet < .1 && s[s.length - 1].tentWet > .3)) fails.push("tent clip: cloth did not go from dry to wet");
    const pick = [1, at("cloud")[0] + 3, at("cloud")[1] - 2, at("light")[1] - 1, at("heavy")[1] - 1, TN - 2];
    await strip(pick.map(i => frameAt(r.dir, i)), "B_tent_rain_strip.png", null, 426);
    for (const [i, nm] of [[at("clear")[1] - 1, "dry"], [at("heavy")[1] - 1, "wet"], [TN - 2, "close"]])
      await ffmpeg(["-i", frameAt(r.dir, i), "-frames:v", "1", "-update", "1", path.join(OUT, `B_tent_rain_${nm}.png`)]);
    fs.rmSync(r.dir, {recursive: true, force: true});
    /* the rain sound off the scene's own bus, as d161/d162 recorded it */
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
      rec.start(); await new Promise(r => setTimeout(r, 7500)); rec.stop(); await done; A.bus.disconnect(dst);
      const b = new Blob(ch, {type: rec.mimeType}), u8 = new Uint8Array(await b.arrayBuffer());
      let bin = ""; for (let i = 0; i < u8.length; i += 32768) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 32768));
      return {mime: rec.mimeType, bytes: u8.length, b64: btoa(bin)};
    });
    await page.evaluate(() => { const q = window.__desQA(); q.freeze(true); window.__set({weather: "sun", ct: "clear"}); q.sim(900, 1); });
    report.tent.sound = {mime: au.mime, bytes: au.bytes, err: au.err};
    if (au.b64) {
      const af = path.join(OUT, "tent-rain-sound.webm"), v0 = path.join(OUT, "tent-rain.mp4"), v1 = path.join(OUT, "tent-rain-av.mp4");
      fs.writeFileSync(af, Buffer.from(au.b64, "base64"));
      /* the rain is heard from the first drops on: silence while it is dry, the recording faded in as the shower starts */
      const t0 = (at("light")[0] / TFPS).toFixed(2);
      await ffmpeg(["-i", v0, "-stream_loop", "-1", "-i", af, "-filter_complex", `[1:a]adelay=${Math.round(t0 * 1000)}|${Math.round(t0 * 1000)},afade=t=in:st=${t0}:d=1.5[a]`,
        "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "128k", "-shortest", v1]);
      fs.renameSync(v1, v0); fs.rmSync(af);
      const vol = await new Promise(r => execFile("ffmpeg", ["-i", v0, "-af", "volumedetect", "-f", "null", "-"], (e, o, se) => r(String(se).match(/mean_volume: (-?[\d.]+) dB/))));
      report.tent.sound.meanDb = vol ? +vol[1] : null;
      if (!vol || +vol[1] < -60) fails.push("tent clip: rain sound silent");
    } else fails.push("tent clip: no rain sound recorded");
    report.tent.osRequested = [...osReq];
    report.tent.osParsed = await page.evaluate(() => Object.keys(window.CY.ms || {}).filter(k => /^ostrich_v2/.test(k) && window.__desPre && !(k in window.__desPre)));
    const osUsed = [...new Set([...osReq, ...report.tent.osParsed])];
    if (osUsed.length !== 1 || osUsed[0] !== "ostrich_v2ag") fails.push("ostrich in use is not exactly v2ag: " + osUsed);
    console.log("tent", JSON.stringify(report.tent));
    await cap("");
  }
  /* ---------------- crab_v6c: planted-tip slip for walk and run (same measure as d161/d162), then a low tracking close-up ---------------- */
  if (want("crslip") || want("crwalk")) {
    report.crab = await page.evaluate(() => {
      const q = window.__desQA(), R = q.CR, c = R.list.slice().sort((a, b) => q.pN(b.bx, b.bz) - q.pN(a.bx, a.bz))[0]; R._proof = R.list.indexOf(c);
      for (const o of R.list) if (o !== c) { o.mode = "in"; o.t = 999; }
      R.calm = true; R.gapePin = null; R.clawIdle = false; window.__set({weather: "sun", ct: "clear", wind: .3}); q.tod("day");
      const P = q.CRP || {}, pr = {}; for (const k in P) pr[k] = {min: +Math.min(...P[k].p).toFixed(2), max: +Math.max(...P[k].p).toFixed(2), mean: +P[k].m.toFixed(4)};
      return {sel: R._proof, glb: q.crGlb(), crG: q.crG, s: +c.s.toFixed(3), pace: pr};
    });
    report.crab.requested = [...crReq];
    if (!report.crab.glb || [...crReq].some(k => k !== "crab_v6c")) fails.push("crab in use is not crab_v6c alone: " + [...crReq]);
  }
  if (want("crslip")) {
    /* skinned vertices under 1.5 mm or 0.4 mm (the tips bearing weight) in the crab's own frame on both of two steps 1/60 s apart:
       their speed in island metres per second; tipAlong is the mean of the 0.4 mm ones along the way it walks */
    report.crab.footSlip = await page.evaluate(() => {
      const q = window.__desQA(), c = q.CR.list[q.CR._proof], V = c.g.position.constructor, C = window.__C(), y = q.hTop(c.bx, c.bz);
      q.lookAt(c.bx + Math.sin(c.yaw) * .6, y + .2, c.bz + Math.cos(c.yaw) * .6, c.bx, y, c.bz); C.De.fov = 40; C.De.updateProjectionMatrix();
      let sk = null; c.g.traverse(o => { if (o.isSkinnedMesh && !sk) sk = o; });
      const grab = () => { c.g.updateMatrixWorld(true); const v = new V(), out = [], n = sk.geometry.attributes.position.count;
        for (let i = 0; i < n; i++) { sk.getVertexPosition(i, v); const h = v.y; v.applyMatrix4(sk.matrixWorld); q.W.worldToLocal(v); out.push([v.x, h, v.z]); } return out; };
      const run = N => { const S = {a: [], b: [], s: []}; let bd = 0, a = grab(), dx = c.tx - c.x, dz = c.tz - c.z; const dl = Math.hypot(dx, dz) || 1; dx /= dl; dz /= dl;
        for (let k = 0; k < N; k++) { const b0 = [c.x, c.z]; q.step(1, 1 / 60); const b = grab(); bd += Math.hypot(c.x - b0[0], c.z - b0[1]) * 60;
          for (let i = 0; i < a.length; i++) { const d = Math.hypot(b[i][0] - a[i][0], b[i][2] - a[i][2]) * 60;
            if (a[i][1] < .0015 && b[i][1] < .0015) S.a.push(d); if (a[i][1] < .0004 && b[i][1] < .0004) { S.b.push(d); S.s.push(((b[i][0] - a[i][0]) * dx + (b[i][2] - a[i][2]) * dz) * 60); } }
          a = b; }
        const st = v => { v.sort((x, y) => x - y); return {n: v.length, mean: +(v.reduce((s, x) => s + x, 0) / Math.max(1, v.length)).toFixed(4), median: +(v[v.length >> 1] || 0).toFixed(4)}; };
        return {body: +(bd / N).toFixed(4), clip: c.rb.cur, ts: +c.rb.acts[c.rb.cur].timeScale.toFixed(3), thr1_5mm: st(S.a), thr0_4mm: st(S.b), tipAlong: +(S.s.reduce((x, y) => x + y, 0) / Math.max(1, S.s.length)).toFixed(4)}; };
      const out = [];
      for (const [mode, vt, dir, N] of [["walk", .1, 1, 96], ["walk", .1, -1, 96], ["run", .42, 1, 30], ["run", .42, -1, 30]]) { const rt = [Math.cos(c.yaw), -Math.sin(c.yaw)];
        Object.assign(c, {x: c.bx, z: c.bz, mode, vt, v: vt, walk: 1, go: null, sk: 0, up: 0, t: 999, tx: c.bx + dir * rt[0] * 1.2, tz: c.bz + dir * rt[1] * 1.2});
        q.step(18, 1 / 60); out.push({mode, dir: dir > 0 ? "+x" : "-x", ...run(N)}); }
      Object.assign(c, {x: c.bx, z: c.bz, mode: "out", v: 0, walk: 0, tx: c.bx, tz: c.bz, t: 999}); q.step(10, 1 / 30);
      return out;
    });
    console.log("crab foot slip", JSON.stringify(report.crab.footSlip));
  }
  if (want("crwalk")) {
    /* low on the sand (CRH metres above the sand under the camera), CRD metres off on its land side, the camera following it so its 12 cm span stays about
       a third of the frame width; it walks one way at 0.1 m/s, then runs back at 0.42 m/s. 12 frames a second, each 1/24 s (half speed) */
    const CN = +(process.env.CN || 48);
    await page.evaluate(v => { const q = window.__desQA(), C = window.__C(), c = q.CR.list[q.CR._proof], rt = [Math.cos(c.yaw), -Math.sin(c.yaw)];
      window.__crDH = v; window.__crYaw = c.yaw; window.__ci = 0;
      Object.assign(c, {x: c.bx - rt[0] * .1, z: c.bz - rt[1] * .1, mode: "walk", vt: .1, v: .1, walk: 1, go: null, sk: 0, up: 0, t: 999, tx: c.bx + rt[0] * 1.2, tz: c.bz + rt[1] * 1.2});
      q.step(12, 1 / 60); C.De.fov = 30; C.De.near = .005; C.De.updateProjectionMatrix(); }, [+(process.env.CRD || .34), +(process.env.CRH || .05)]);
    const r = await vid("crab_v6c-sideways-walk", CN, async () => page.evaluate((capIn, CN) => {
      const q = window.__desQA(), C = window.__C(), c = q.CR.list[q.CR._proof], i = window.__ci++, yw = window.__crYaw, rt = [Math.cos(yw), -Math.sin(yw)], fw = [Math.sin(yw), Math.cos(yw)];
      const half = Math.round(CN * .55);
      if (i === half) Object.assign(c, {mode: "run", vt: .42, v: .2, walk: 1, go: null, sk: 0, up: 0, t: 999, tx: c.x - rt[0] * 1.5, tz: c.z - rt[1] * 1.5});
      (new Function("t", capIn + "(t)"))(i < half ? "湖边蟹横着走（慢走 0.1 m/s，慢放 ½，镜头贴近沙面跟拍）" : "湖边蟹横着快跑（0.42 m/s，慢放 ½）：着地的脚尖踩住不打滑");
      q.step(2, 1 / 48);
      const [cd, ch] = window.__crDH; window.__cx = window.__cx == null ? c.x : window.__cx + (c.x - window.__cx) * .5; window.__cz = window.__cz == null ? c.z : window.__cz + (c.z - window.__cz) * .5;
      const ex = window.__cx - fw[0] * cd, ez = window.__cz - fw[1] * cd; q.lookAt(ex, Math.max(q.lkY(ex, ez), c.y) + ch, ez, window.__cx, c.y + .025, window.__cz); C.De.updateMatrixWorld(true);
      return {i, x: +c.x.toFixed(3), z: +c.z.toFixed(3), clip: c.rb.cur, mode: c.mode};
    }, capIn, CN), true, 12);
    report.crab.walkClip = {frames: r.log.length, clips: [...new Set(r.log.map(s => s.clip))]};
    const h = Math.round(CN * .55);
    await strip([4, h >> 1, h - 2, h + 3, (h + CN) >> 1, CN - 2].map(i => frameAt(r.dir, i)), "D_crab_v6c_sideways_strip.png", null, 426);
    fs.rmSync(r.dir, {recursive: true, force: true}); await cap("");
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
