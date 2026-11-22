// Desert #160 proofs: the sand falls far/mid/near and day/dusk/night shots beside the sky-ocean, the falls from below the rim (full),
// the dune at the rim (dune), and with BASE=<dir of the same shots on an earlier bundle> mode cmp: before/after strips with a
// brightness-step measure of the near seam and the share of sky between the falls below the rock. The user's reference framings
// are tools/e2e/d160-ref.mjs. Behaviour clips (wind,
// dunevid, rain, tent, lake, agama) are stepped at 24 fps; the tent clip carries the scene's own rain sound, recorded off its bus.
// Not part of CI. Usage: node tools/e2e/d160-proof.mjs [pair|sand|sandq|tod|full|dune|cmp|wind|dunevid|rain|tent|lake|agama|crstand|crwalk|crpinch|crdig|crbur|run|sit|...]   (OUT=/tmp/d160)
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {execFile} from "node:child_process";
import puppeteer from "puppeteer-core";
/* pixels the pink probe painted magenta, in a crop. The composer's output pass grades the probe's (1,0,1) to about (250,43,227). */
const magentaPx = (file, [w, h, x, y]) => new Promise((res, rej) => execFile("ffmpeg", ["-loglevel", "error", "-i", file, "-vf", `crop=${w}:${h}:${x}:${y}`, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
  {encoding: "buffer", maxBuffer: 1e8}, (e, o) => { if (e) return rej(e); let n = 0; for (let i = 0; i < o.length; i += 3) if (o[i] > 220 && o[i + 1] < 80 && o[i + 2] > 200 && o[i] - o[i + 1] > 150) n++; res(n); }));
const ffmpeg = args => new Promise((res, rej) => execFile("ffmpeg", ["-y", "-loglevel", "error", ...args], {maxBuffer: 1e8}, (e, _o, se) => e ? rej(new Error(String(se).slice(-500))) : res()));
/* a crop's luma as rows of 0..255 */
const luma = (file, [w, h, x, y]) => new Promise((res, rej) => execFile("ffmpeg", ["-loglevel", "error", "-i", file, "-vf", `crop=${w}:${h}:${x}:${y}`, "-f", "rawvideo", "-pix_fmt", "gray", "-"],
  {encoding: "buffer", maxBuffer: 1e8}, (e, o) => e ? rej(e) : res(Array.from({length: h}, (_, r) => o.subarray(r * w, r * w + w)))));
const smooth = (a, k) => a.map((_, i) => { let s = 0, n = 0; for (let j = Math.max(0, i - k); j <= Math.min(a.length - 1, i + k); j++) { s += a[j]; n++; } return s / n; });
/* share of a crop that is sky or cloud (blue at least as strong as red) rather than sand */
const skyFrac = (file, [w, h, x, y]) => new Promise((res, rej) => execFile("ffmpeg", ["-loglevel", "error", "-i", file, "-vf", `crop=${w}:${h}:${x}:${y}`, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
  {encoding: "buffer", maxBuffer: 1e8}, (e, o) => { if (e) return rej(e); let n = 0; for (let i = 0; i < o.length; i += 3) if (o[i + 2] >= o[i]) n++; res(+(n / (o.length / 3)).toFixed(3)); }));
/* far: the largest step in column-mean brightness across the crop, columns 8 px apart (a paler slab shows as a pair of steps) */
const colStep = async (file, crop) => { const R = await luma(file, crop), w = crop[0], m = smooth(Array.from({length: w}, (_, c) => R.reduce((s, r) => s + r[c], 0) / R.length), 2);
  let mx = 0; for (let c = 0; c + 8 < w; c++) mx = Math.max(mx, Math.abs(m[c + 8] - m[c])); return +mx.toFixed(2); };
/* near: per column the largest brightness step down the crop, rows 6 px apart, and the median over the columns (a horizontal seam
   lifts every column; the curtain's own vertical streaks do not) */
const rowStep = async (file, crop) => { const R = await luma(file, crop), [w, h] = crop, st = [];
  for (let c = 0; c < w; c += 2) { const v = smooth(R.map(r => r[c]), 2); let mx = 0; for (let i = 0; i + 6 < h; i++) mx = Math.max(mx, Math.abs(v[i + 6] - v[i])); st.push(mx); }
  st.sort((a, b) => a - b); return +st[st.length >> 1].toFixed(2); };

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = process.env.OUT || "/tmp/d160";
const CHROME = process.env.CHROME || ["/usr/bin/google-chrome-stable", "/usr/bin/google-chrome", "/usr/bin/chromium"].find(p => fs.existsSync(p));
const WHICH = process.argv[2] || "all";
const W = +(process.env.W || 1280), H = +(process.env.H || 720);
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
const browser = await puppeteer.launch({executablePath: CHROME, headless: "new", protocolTimeout: 900000,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader", "--mute-audio"]});

const HIDE = [".t", "#fab", "#sbtn", "#tp", "#ld"];
async function boot(page, yard) {
  page.on("console", m => { const t = m.type(); if (t === "error" || t === "warning") console.log("PAGE", yard, t, m.text().slice(0, 240)); });
  page.on("pageerror", e => console.log("PAGEERR", yard, String(e).slice(0, 300)));
  await page.goto(ORIGIN + `/${yard}/?nosw=1&debug=1`, {waitUntil: "domcontentloaded", timeout: 120000});
  if (yard === "desert") {
    await page.waitForFunction(() => window.__ready && window.__desReady && window.__desQA && window.__desQA().ready, {timeout: 300000, polling: 500});
    await page.evaluate(HIDE => {
      const q = window.__desQA(), C = window.__C();
      document.body.classList.add("col", "snc");
      for (const s of HIDE) { const n = document.querySelector(s); if (n) n.style.display = "none"; }
      q.freeze(true); q.tod("day"); window.__set({weather: "sun", ct: "clear", wind: .72});
      C.Ce.enabled = false; q.sim(2);
    }, HIDE);
  } else {
    await page.waitForFunction(() => window.__ready && window.__seaReady, {timeout: 180000, polling: 500});
    await page.evaluate(HIDE => {
      document.body.classList.add("col", "snc");
      for (const s of HIDE) { const n = document.querySelector(s); if (n) n.style.display = "none"; }
      window.__C().Ce.enabled = false;
      window.__set({weather: "sun", ct: "clear", wind: .4});
    }, HIDE);
    await sleep(1500);
  }
}
const frames = async (page, n) => { await page.bringToFront(); return page.evaluate(n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n); };
async function shot(page, name) {
  await frames(page, 3); await sleep(80);
  const f = path.join(OUT, name);
  await page.screenshot({path: f, type: "png"});
  console.log("shot", f);
  return f;
}
function cap(page, text) {
  return page.evaluate(text => {
    let d = document.getElementById("d160cap");
    if (!text) { if (d) d.remove(); return; }
    if (!d) { d = document.createElement("div"); d.id = "d160cap"; document.body.appendChild(d); }
    d.textContent = text;
    d.style.cssText = "position:fixed;left:18px;bottom:16px;z-index:50;pointer-events:none;font:600 20px 'WenQuanYi Micro Hei','Droid Sans Fallback',sans-serif;color:#fff;letter-spacing:.02em;text-shadow:0 1px 2px #000,0 0 4px #000";
  }, text || "");
}
const pair = (a, b, out) => ffmpeg(["-i", a, "-i", b, "-filter_complex", "[0:v]scale=960:540[a];[1:v]scale=960:540[b];[a][b]hstack", path.join(OUT, out)]);

/* matched framings. Desert in island metres (q.lookAt), sea in world units. The far pair is the framing family of #153–#156. */
const DES = {
  far: [58, 6, 40, 4, -10, 2, 36],
  mid: [36, 1.5, 25, 7, -7.5, 4.5, 38],
  near: [27.8, 1.6, 19.5, 12, -3.5, 8.4, 44],
  /* the whole curtain from a little below the rim, its foot against the cloud */
  full: [84, -6, 60, 2, -16, 0, 40],
};
/* the dune where it meets the rim: three-quarter, straight down, and level from the side */
const DUNE = {q: [30, 22, -26, 15, 0, -9, 40], top: [15.6, 46, -9.4, 15.6, 0, -9.6, 50], side: [46, 2, -26, 15, 1, -9, 34]};
const SEA = {
  far: [22, 7, 16, 0, -5, 0, 38],
  mid: [13.5, 2.2, 9.8, 0, -3.2, 0, 38],
  near: [10.2, -.4, 7.4, 3.2, -2.2, 2.3, 44],
};
/* overview at each time of day: each scene's own desktop default camera */
const DES_OV = [-4.16, 11.13, 19.58, 0, 0, 0, 40], SEA_OV = [-5.3, 8.9, 20.2, .2, 1.1, 0, 40];

async function desCam(page, v) {
  await page.evaluate(v => {
    const q = window.__desQA(), C = window.__C();
    q.lookAt(v[0], v[1], v[2], v[3], v[4], v[5]);
    C.De.fov = v[6]; C.De.near = .15; C.De.updateProjectionMatrix();
  }, v);
}
async function desCamW(page, v) {
  await page.evaluate(v => {
    const C = window.__C();
    C.De.position.set(v[0], v[1], v[2]); C.Ce.target.set(v[3], v[4], v[5]); C.De.lookAt(C.Ce.target);
    C.De.fov = v[6]; C.De.near = .1; C.De.updateProjectionMatrix();
  }, v);
}
async function seaCam(page, v) {
  await page.evaluate(v => {
    const C = window.__C();
    C.De.position.set(v[0], v[1], v[2]); C.Ce.target.set(v[3], v[4], v[5]); C.De.lookAt(C.Ce.target);
    C.De.fov = v[6]; C.De.near = .2; C.De.updateProjectionMatrix();
  }, v);
  await frames(page, 8); await sleep(300);
}
const TOD = {day: {des: "day", sea: {mode: "manual"}}, dusk: {des: "sunset", sea: {mode: "sunset"}}, night: {des: "night", sea: {mode: "full"}}};
async function desTod(page, k) {
  await page.evaluate(k => {
    const q = window.__desQA(); window.__set(k === "night" ? {mode: "full"} : {mode: "manual"});
    q.tod(k); q.sim(1.5);
  }, TOD[k].des);
}
async function seaTod(page, k) {
  await page.evaluate(o => window.__set(o), TOD[k].sea);
  await sleep(2500);
}

const page = await browser.newPage();
/* which ostrich file the scene asks for: v2ag only (v2ah and v2ai stay on disk unused) */
const osReq = new Set(), crReq = new Set();
page.on("request", r => { const m = /\/(ostrich_v2[a-z0-9]+)\.glb/.exec(r.url()); if (m) osReq.add(m[1]); const k = /\/(crab_[a-z0-9_]+)\.glb/.exec(r.url()); if (k) crReq.add(k[1]); });
await page.setViewport({width: W, height: H, deviceScaleFactor: 1});
const want = k => WHICH === "all" || WHICH === k || WHICH.split(",").includes(k);
const fails = [];
const report = {};

try {
  if (WHICH !== "cmp") await boot(page, "desert");
  const live = WHICH === "cmp" ? {} : await page.evaluate(() => ({desert: window.CY && window.CY.desert, os: window.CY && window.CY.ms && window.CY.ms.ostrich_v2ag,
    gb: window.CY && window.CY.ms && window.CY.ms.gerbil_v5b, sc: window.CY && window.CY.ms && window.CY.ms.scorpion_v2c && window.CY.ms.scorpion_uv_v2c,
    tt: window.CY && window.CY.ms && window.CY.ms.tortoise_v2h}));
  console.log("live", JSON.stringify(live));
  report.live = live;
  if (WHICH !== "cmp") {
    if (!live.desert || !/desert\.[0-9a-f]+\.js$/.test(live.desert)) fails.push("desert bundle missing");
    if (!live.os) fails.push("ostrich_v2ag not in the live manifest");
    if (!live.gb) fails.push("gerbil_v5b not in the live manifest");
    if (!live.sc) fails.push("scorpion_v2c / scorpion_uv_v2c not in the live manifest");
    if (!live.tt) fails.push("tortoise_v2h not in the live manifest");
  }
  let sea = null;
  const seaPage = async () => {
    if (sea) return sea;
    sea = await browser.newPage();
    await sea.setViewport({width: W, height: H, deviceScaleFactor: 1});
    await boot(sea, "sea");
    return sea;
  };

  if (want("pair") || want("sand")) {
    await page.evaluate(() => {
      const q = window.__desQA();
      window.__set({weather: "sun", ct: "clear", wind: .8});
      q.sfR(null); q.windPin(null); q.sim(4);
    });
  }
  if (want("pair")) {
    const s = await seaPage();
    for (const k of ["far", "mid", "near"]) {
      await desCam(page, DES[k]); await cap(page, "");
      const a = await shot(page, `B_sandfall_${k}.png`);
      /* the sand mode's lee-snow check takes over B_sandfall_near.png; this framing is kept for the seam comparison */
      if (k === "near") fs.copyFileSync(a, path.join(OUT, "B_sandfall_near_pair.png"));
      await seaCam(s, SEA[k]);
      const b = path.join(OUT, `B_sea_fall_${k}.png`); await s.screenshot({path: b});
      await pair(a, b, `B_sand_vs_sea_${k}.png`);
      console.log("pair", k);
    }
  }
  if (want("sand")) {
    await desCam(page, DES.far); await cap(page, "");
    await shot(page, "B_sandfall_far.png");
    await desCam(page, DES.full); await shot(page, "B_sandfall_full.png");
    const near = await page.evaluate(() => {
      const q = window.__desQA(), C = window.__C(), w = q.wind();
      const F = q.sf().F;
      let best = F[0], bu = -9;
      for (const f of F) { const u = -(f.nx * w.x + f.nz * w.z); if (u > bu) { bu = u; best = f; } }
      const lip = q.hTop(best.x * .97, best.z * .97);
      const dist = 6.1;
      const ex = best.x + best.nx * .35, ez = best.z + best.nz * .35;
      q.lookAt(best.x + best.nx * dist, lip - 1.6, best.z + best.nz * dist, ex, lip - 7.5, ez);
      C.De.fov = 46; C.De.near = .08; C.De.updateProjectionMatrix();
      const cam = C.De.position.clone(); q.W.worldToLocal(cam);
      let nearD = 1e9, farD = 0, n = 0;
      const pos = q.sfMesh().geometry.attributes.position;
      const step = Math.max(1, (pos.count / 4000) | 0);
      for (let i = 0; i < pos.count; i += step) {
        const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        if (Math.hypot(x - best.x, z - best.z) > 7) continue;
        const d = Math.hypot(cam.x - x, cam.y - y, cam.z - z);
        if (d < nearD) nearD = d; if (d > farD) farD = d; n++;
      }
      return {up: +bu.toFixed(3), x: +best.x.toFixed(2), z: +best.z.toFixed(2), hw: +best.hw.toFixed(2), n: F.length, lip: +lip.toFixed(2), nearD: +nearD.toFixed(2), farD: +farD.toFixed(2), samples: n};
    });
    console.log("sand near", JSON.stringify(near));
    report.sandNear = near;
    await shot(page, "B_sandfall_near.png");
  }
  /* iteration shots, desert only: the tod far framing at each hour (wind .5, as in tod) and the near curtain (wind .8, as in sand) */
  if (WHICH.split(",").includes("sandq")) {
    await page.evaluate(() => { window.__set({weather: "sun", ct: "clear", wind: .5}); const q = window.__desQA(); q.sfR(null); q.windPin(null); q.sim(2); });
    for (const k of ["day", "dusk", "night"]) { await desTod(page, k); await desCam(page, DES.far); await shot(page, `q_${k}_far.png`); }
    await desTod(page, "day");
    await page.evaluate(() => { window.__set({weather: "sun", ct: "clear", wind: .8}); window.__desQA().sim(4); });
    await desCam(page, DES.mid); await shot(page, "q_day_mid.png");
  }
  if (want("tod")) {
    const s = await seaPage();
    await page.evaluate(() => { window.__set({weather: "sun", ct: "clear", wind: .5}); window.__desQA().sim(2); });
    for (const k of ["day", "dusk", "night"]) {
      await desTod(page, k); await desCamW(page, DES_OV); await cap(page, "");
      const a = await shot(page, `B_${k}_overview_desert.png`);
      await seaTod(s, k); await seaCam(s, SEA_OV);
      const b = path.join(OUT, `B_${k}_overview_sea.png`); await s.screenshot({path: b});
      await pair(a, b, `B_${k}_overview_sand_vs_sea.png`);
      /* the far framing as well: the underside and curtain against the sky at that hour */
      await desCam(page, DES.far);
      const c = await shot(page, `B_${k}_far_desert.png`);
      await seaCam(s, SEA.far);
      const d = path.join(OUT, `B_${k}_far_sea.png`); await s.screenshot({path: d});
      await pair(c, d, `B_${k}_far_sand_vs_sea.png`);
      await desCam(page, DES.full); await shot(page, `B_${k}_full_desert.png`);
      console.log("tod", k);
    }
    await desTod(page, "day");
  }
  if (want("dune")) {
    await page.evaluate(() => { window.__set({weather: "sun", ct: "clear", wind: .8}); const q = window.__desQA(); q.tod("day"); q.sim(2); });
    for (const k in DUNE) { await desCam(page, DUNE[k]); await shot(page, `B_dune_rim_${k}.png`); }
    /* the lip's height round the dune's stretch of rim: level, not lifted by the dune */
    report.duneRim = await page.evaluate(() => {
      const q = window.__desQA(), [cx, cz] = q.dune.crestXZ(0), a0 = Math.atan2(cz, cx), out = [];
      for (let d = -.5; d <= .5001; d += .1) { const [x, z] = q.edgeXZ(a0 + d, .985); out.push({a: +(a0 + d).toFixed(2), lip: +q.hTop(x, z).toFixed(3), dune: +q.dune.dMask(x, z).toFixed(3)}); }
      const L = out.map(o => o.lip);
      return {crest: [+cx.toFixed(2), +cz.toFixed(2)], lipRange: +(Math.max(...L) - Math.min(...L)).toFixed(3), samples: out};
    });
    console.log("dune rim", JSON.stringify(report.duneRim));
  }
  /* before (BASE) / after (OUT), same framings and settings: the curtain's right side in the far shots, and the near seam */
  if (want("cmp") && process.env.BASE) {
    const B = process.env.BASE, C = report.cmp = {base: process.env.BASE_LABEL || B};
    const lab = (t, x) => `drawtext=fontfile=/usr/share/fonts/truetype/wqy/wqy-microhei.ttc:text='${t}':x=${x}:y=12:fontsize=26:fontcolor=white:borderw=2:bordercolor=black`;
    const RIGHT = [450, 290, 560, 330], SEAM = [940, 140, 260, 540];
    for (const f of ["B_sandfall_far", "B_day_far_desert", "B_dusk_far_desert", "B_night_far_desert"]) {
      const a = path.join(B, f + ".png"), b = path.join(OUT, f + ".png");
      if (!fs.existsSync(a) || !fs.existsSync(b)) continue;
      C[f] = {before: await colStep(a, RIGHT), after: await colStep(b, RIGHT)};
    }
    const nA = path.join(B, "B_sandfall_near_pair.png"), nB = path.join(OUT, "B_sandfall_near_pair.png");
    if (fs.existsSync(nA) && fs.existsSync(nB)) C.near_seam = {before: await rowStep(nA, SEAM), after: await rowStep(nB, SEAM)};
    const strip = (a, b, crop, out) => ffmpeg(["-i", a, "-i", b, "-filter_complex",
      `[0:v]crop=${crop}[a0];[1:v]crop=${crop}[b0];[a0]${lab("d159 之前", 14)}[a];[b0]${lab("d160 之后", 14)}[b];[a][b]hstack`, path.join(OUT, out)]);
    if (fs.existsSync(path.join(B, "B_dusk_far_desert.png"))) await strip(path.join(B, "B_dusk_far_desert.png"), path.join(OUT, "B_dusk_far_desert.png"), "700:460:300:250", "q_dusk_far_right_d159_vs_d160.png");
    if (fs.existsSync(path.join(B, "B_sandfall_far.png"))) await strip(path.join(B, "B_sandfall_far.png"), path.join(OUT, "B_sandfall_far.png"), "700:460:300:250", "q_day_far_right_d159_vs_d160.png");
    if (fs.existsSync(nA)) await ffmpeg(["-i", nA, "-i", nB, "-filter_complex",
      `[0:v]crop=1280:330:0:390[a0];[1:v]crop=1280:330:0:390[b0];[a0]${lab("d159 之前", 14)}[a];[b0]${lab("d160 之后", 14)}[b];[a][b]vstack`, path.join(OUT, "q_near_seam_d159_vs_d160.png")]);
    /* the curtain's foot, below the rock: how much sky shows through between the streams (by day: blue sky against warm sand) */
    const FOOT = [440, 130, 420, 450];
    for (const f of ["B_sandfall_full", "B_day_full_desert"]) {
      const a = path.join(B, f + ".png"), b = path.join(OUT, f + ".png");
      if (fs.existsSync(a) && fs.existsSync(b)) C[f + "_footSky"] = {before: await skyFrac(a, FOOT), after: await skyFrac(b, FOOT)};
    }
    const both = f => fs.existsSync(path.join(B, f)) && fs.existsSync(path.join(OUT, f));
    if (both("B_sandfall_full.png")) await strip(path.join(B, "B_sandfall_full.png"), path.join(OUT, "B_sandfall_full.png"), "520:420:380:200", "q_full_curtain_d159_vs_d160.png");
    if (both("B_dusk_full_desert.png")) await strip(path.join(B, "B_dusk_full_desert.png"), path.join(OUT, "B_dusk_full_desert.png"), "520:420:380:200", "q_dusk_full_curtain_d159_vs_d160.png");
    for (const k of ["q", "top", "side"]) if (both(`B_dune_rim_${k}.png`)) await strip(path.join(B, `B_dune_rim_${k}.png`), path.join(OUT, `B_dune_rim_${k}.png`), "1100:600:90:60", `q_dune_rim_${k}_d159_vs_d160.png`);
    console.log("cmp", JSON.stringify(C));
  }

  /* motion clips: each animal followed by a side camera, the scene stepped at 24 fps */
  async function clip(name, setup, camFn, N, guard) {
    await page.evaluate(setup);
    const dir = path.join(OUT, name + "-frames");
    fs.rmSync(dir, {recursive: true, force: true}); fs.mkdirSync(dir);
    const samples = [];
    for (let i = 0; i < N; i++) {
      const s = await page.evaluate(camFn);
      samples.push(s);
      await frames(page, 1);
      await page.screenshot({path: path.join(dir, String(i).padStart(4, "0") + ".png")});
      if (guard && !guard(s, i)) break;
    }
    await ffmpeg(["-framerate", "24", "-i", path.join(dir, "%04d.png"), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", path.join(OUT, name + ".mp4")]);
    fs.rmSync(dir, {recursive: true, force: true});
    console.log("encoded", name, samples.length);
    return samples;
  }
  /* behaviour clips for #160: each stepped at 24 fps (time-lapse where the caption says so), the caption set from the page per frame */
  const capIn = "(t => { let d = document.getElementById('d160cap'); if (d) d.textContent = t; })";
  const tfix = o => { for (const k in o) if (typeof o[k] === "number") o[k] = +o[k].toFixed(3); return o; };
  if (want("wind")) {
    await cap(page, " ");
    const s = await clip("wind-sand", () => {
      const q = window.__desQA(); window.__set({weather: "sun", ct: "clear", wind: .3}); q.tod("day"); q.sfR(null);
      window.__wa = q.wind().a; q.windPin(window.__wa); q.sim(20); window.__wi = 0;
    }, new Function(`const q = window.__desQA(), C = window.__C(), i = window.__wi++;
      if (i === 36) window.__set({wind: 1}); if (i === 78) q.windPin(window.__wa + Math.PI);
      ${capIn}(i < 36 ? "风吹沙：微风 0.3" : i < 78 ? "风吹沙：大风 1.0，扬沙增多、顺风飞远" : "风吹沙：风向掉头 180°，沙粒随之反向飞");
      q.step(1, 1 / 24);
      const [x, z] = q.dune.crestXZ(.6), y = q.hTop(x, z), w = q.wind(), a = window.__wa + Math.PI / 2;
      q.lookAt(x + Math.cos(a) * 9, y + 1.8, z + Math.sin(a) * 9, x, y + .5, z); C.De.fov = 44; C.De.near = .05; C.De.updateProjectionMatrix();
      let lit = 0; for (let k = 0; k < q.SAND.n; k++) if (q.SAND.A[k] > .01) lit++;
      return {i, wind: +window.__desQA().st.wn.toFixed(2), a: +w.a.toFixed(2), lit, flowK: +q.sandU.uFlowK.value.toFixed(2)};`), 24 * 5);
    report.wind = {frames: s.length, at: [s[32], s[74], s[118]]};
    await page.evaluate(() => { window.__desQA().windPin(null); window.__set({wind: .8}); });
    if (!(s[74].lit > s[32].lit)) fails.push("wind clip: no more grains in the strong wind");
  }
  if (want("dunevid")) {
    await cap(page, " ");
    const s = await clip("dune-deform", () => {
      const q = window.__desQA(); window.__set({weather: "sun", ct: "clear", wind: 1}); q.tod("day");
      window.__wa = q.wind().a; q.windPin(window.__wa); window.__wi = 0; const D = q.dune.DP; window.__d0 = {x: D.x, z: D.z, H: D.H, w: D.w, sk: D.sk};
    }, new Function(`const q = window.__desQA(), C = window.__C(), i = window.__wi++;
      if (i === 48) q.windPin(window.__wa + Math.PI / 2);
      ${capIn}((i < 48 ? "沙丘随时间与风缓慢变形" : "风向转 90°：沙丘随之转向、改形") + "（缩时，每帧 60 s）");
      if (i) q.sim(60, .5); q.step(1, 1 / 24);
      const v = ${JSON.stringify(DUNE.q)}; q.lookAt(v[0], v[1], v[2], v[3], v[4], v[5]); C.De.fov = v[6]; C.De.near = .15; C.De.updateProjectionMatrix();
      const D = q.dune.DP; return {i, x: +D.x.toFixed(2), z: +D.z.toFixed(2), H: +D.H.toFixed(2), w: +D.w.toFixed(2), sk: +D.sk.toFixed(3)};`), 24 * 4);
    report.dunevid = {frames: s.length, minutes: (s.length - 1), first: s[0], mid: s[47], last: s[s.length - 1]};
    await page.evaluate(() => { window.__desQA().windPin(null); window.__set({wind: .8}); });
    const a = s[0], b = s[s.length - 1];
    if (!(Math.abs(a.x - b.x) + Math.abs(a.z - b.z) + Math.abs(a.H - b.H) + Math.abs(a.w - b.w) > .05)) fails.push("dune clip: dune did not change");
  }
  if (want("rain")) {
    await cap(page, " ");
    const s = await clip("rain-sand-pits-dry", () => {
      const q = window.__desQA(); window.__set({weather: "sun", ct: "clear", wind: .3}); q.tod("day"); q.sim(900, 1); window.__wi = 0;
    }, new Function(`const q = window.__desQA(), C = window.__C(), i = window.__wi++;
      if (i === 18) window.__set({weather: "hrain", ct: "overcast"}); if (i === 84) window.__set({weather: "sun", ct: "clear"});
      ${capIn}(i < 18 ? "晴：干沙" : i < 60 ? "下雨：沙面打出小坑、颜色变深（缩时，每帧 1.5 s）" : i < 84 ? "雨中（实时）" : "雨停：沙面慢慢变干（缩时，每帧 15 s）");
      if (i >= 18 && i < 60) q.sim(1.5, 1 / 24); else if (i >= 84) q.sim(15, .5); else q.step(1, 1 / 24);
      const x = -5.5, z = -5, y = q.hTop(x, z);
      q.lookAt(x + 2.6, y + 1.5, z + 2.2, x, y, z); C.De.fov = 40; C.De.near = .05; C.De.updateProjectionMatrix();
      return {i, wet: +q.WX.wet.toFixed(3), sand: +q.sandU.uWetK.value.toFixed(3), pits: +q.sandU.uPitK.value.toFixed(3), rain: +q.WX.rain.toFixed(2)};`), 24 * 6);
    const at = k => s[Math.min(s.length - 1, k)];
    report.rain = {frames: s.length, dry: at(16), wetEnd: at(82), afterSun: at(s.length - 1)};
    if (!(at(82).sand > at(16).sand + .2 && at(82).pits > .2 && at(s.length - 1).sand < at(82).sand - .1)) fails.push("rain clip: sand did not wet, pit and dry");
  }
  if (want("tent")) {
    await cap(page, " ");
    const s = await clip("tent-rain", () => {
      const q = window.__desQA(); window.__set({weather: "sun", ct: "clear", wind: .3}); q.tod("day"); q.sim(900, 1); window.__wi = 0;
    }, new Function(`const q = window.__desQA(), C = window.__C(), i = window.__wi++, T = q.TENT;
      if (i === 12) window.__set({weather: "hrain", ct: "overcast"});
      ${capIn}(i < 12 ? "帐篷：晴天，布面干燥" : i < 48 ? "下雨：布面逐渐湿透变深（缩时，每帧 1 s）" : "雨中（实时）：雨点溅起、雨水顺着布面流下（附场景雨声）");
      if (i >= 12 && i < 48) q.sim(1, 1 / 24); else q.step(1, 1 / 24);
      const y = q.hTop(T.x, T.z), a = (T.yaw || 0) + .7;
      q.lookAt(T.x + Math.sin(a) * 5.6, y + 2, T.z + Math.cos(a) * 5.6, T.x, y + 1, T.z); C.De.fov = 40; C.De.near = .05; C.De.updateProjectionMatrix();
      return {i, tentWet: +q.tentU.uWetC.value.toFixed(3), rain: +q.WX.rain.toFixed(2)};`), 24 * 5);
    report.tent = {frames: s.length, dry: s[10].tentWet, wet: s[s.length - 1].tentWet};
    if (!(s[10].tentWet < .1 && s[s.length - 1].tentWet > .3)) fails.push("tent clip: cloth did not go from dry to wet");
    /* the rain sound: the audio unlocked as a key press does, then the scene's own bus recorded in real time while it rains */
    await page.keyboard.press("F9");
    await page.evaluate(() => { const q = window.__desQA(); q.freeze(false); });
    await page.waitForFunction(() => { const A = window.__desQA().AU; return A.bus && A.lp.rain && window.__sound.ctx === "running"; }, {timeout: 120000, polling: 250}).catch(() => {});
    const au = await page.evaluate(async () => {
      const q = window.__desQA(), A = q.AU; if (!A.bus) return {err: "no bus"};
      window.__set({weather: "hrain", ct: "overcast"}); q.sim(30, .5);
      await new Promise(r => setTimeout(r, 3000));
      const ctx = A.bus.context, dst = ctx.createMediaStreamDestination(); A.bus.connect(dst);
      const rec = new MediaRecorder(dst.stream), ch = [];
      rec.ondataavailable = e => ch.push(e.data);
      const done = new Promise(r => { rec.onstop = r; });
      const gains = []; rec.start(); for (let i = 0; i < 12; i++) { await new Promise(r => setTimeout(r, 500)); gains.push(["rain", "rain2", "rain3", "rtent", "rtent2"].map(k => A.lp[k] ? +A.lp[k].g.gain.value.toFixed(3) : null)); }
      rec.stop(); await done; A.bus.disconnect(dst);
      const b = new Blob(ch, {type: rec.mimeType}), u8 = new Uint8Array(await b.arrayBuffer());
      let bin = ""; for (let i = 0; i < u8.length; i += 32768) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 32768));
      return {mime: rec.mimeType, bytes: u8.length, gains, b64: btoa(bin)};
    });
    await page.evaluate(() => { const q = window.__desQA(); q.freeze(true); window.__set({weather: "sun", ct: "clear"}); q.sim(900, 1); });
    report.tent.sound = {mime: au.mime, bytes: au.bytes, gains: au.gains, err: au.err};
    console.log("tent sound", JSON.stringify(report.tent.sound));
    if (au.b64) {
      const af = path.join(OUT, "tent-rain-sound.webm"), v0 = path.join(OUT, "tent-rain.mp4"), v1 = path.join(OUT, "tent-rain-av.mp4");
      fs.writeFileSync(af, Buffer.from(au.b64, "base64"));
      await ffmpeg(["-i", v0, "-stream_loop", "-1", "-i", af, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "128k", "-shortest", v1]);
      fs.renameSync(v1, v0); fs.rmSync(af);
      const vol = await new Promise(r => execFile("ffmpeg", ["-i", v0, "-af", "volumedetect", "-f", "null", "-"], (e, o, se) => r(String(se).match(/mean_volume: (-?[\d.]+) dB/))));
      report.tent.sound.meanDb = vol ? +vol[1] : null;
      if (!vol || +vol[1] < -60) fails.push("tent clip: rain sound silent");
    } else fails.push("tent clip: no rain sound recorded");
  }
  if (want("lake")) {
    await cap(page, " ");
    const s = await clip("lake-rain-ripples", () => {
      const q = window.__desQA(); window.__set({weather: "lrain", ct: "overcast", wind: .2}); q.tod("day"); q.sim(40); window.__wi = 0;
    }, new Function(`const q = window.__desQA(), C = window.__C(), i = window.__wi++, P = q.POND;
      ${capIn}("湖面：雨点打出一圈圈涟漪和小水花");
      q.step(1, 1 / 24);
      q.lookAt(P.x + P.rx * .9, P.wy + 1.6, P.z + P.rz * .9, P.x + P.rx * .1, P.wy, P.z + P.rz * .1); C.De.fov = 40; C.De.near = .05; C.De.updateProjectionMatrix();
      return {i, ripple: +q.pondU.uRainP.value.toFixed(3)};`), 24 * 3);
    report.lake = {frames: s.length, ripple: s[s.length - 1].ripple};
    await page.evaluate(() => { window.__set({weather: "sun", ct: "clear"}); window.__desQA().sim(900, 1); });
    if (!(s[s.length - 1].ripple > .3)) fails.push("lake clip: no rain rings");
  }
  if (want("agama")) {
    /* the agama that is basking (on the ground or a palm), followed from 1.3 m; then the same lizard in heavy rain, up under the fronds */
    const pick = await page.evaluate(() => {
      const q = window.__desQA(), L = q.AG.list; window.__set({weather: "sun", ct: "clear", wind: .3}); q.tod("day");
      let a = null; for (let i = 0; i < 80 && !a; i++) { q.sim(3); a = L.find(o => o.mode === "bask"); }
      window.__ag = L.indexOf(a); return a ? {i: L.indexOf(a), mode: a.mode, palm: !!a.palm} : null;
    });
    report.agama = {pick};
    if (!pick) fails.push("agama never basked");
    else {
      const agCam = (d, up, fov) => `const q = window.__desQA(), C = window.__C(), a = q.AG.list[window.__ag];
        a.g.updateMatrixWorld(true); const p = a.g.getWorldPosition(C.De.position.clone()); q.W.worldToLocal(p);
        const pm = a.palm, ox = pm ? p.x - pm.x : 1, oz = pm ? p.z - pm.z : .4, l = Math.hypot(ox, oz) || 1;
        q.lookAt(p.x + ox / l * ${d}, p.y + ${up}, p.z + oz / l * ${d}, p.x, p.y + .02, p.z); C.De.fov = ${fov}; C.De.near = .02; C.De.updateProjectionMatrix();`;
      await cap(page, " ");
      const s1 = await clip("agama-bask", () => {}, new Function(`${capIn}("西奈飞蜥：晴天在沙上晒太阳");
        window.__desQA().step(1, 1 / 24); ${agCam(1.3, .45, 34)} return {mode: a.mode, palm: !!a.palm};`), 60);
      await page.evaluate(() => { window.__set({weather: "hrain", ct: "overcast"}); window.__desQA().sim(180); });
      const s2 = await clip("agama-rain-canopy", () => {}, new Function(`${capIn}("西奈飞蜥：下雨时躲到树冠下");
        window.__desQA().step(1, 1 / 24); ${agCam(2.2, -.5, 40)}
        const under = a.palm ? +(q.agRainT(a.palm) - (a.male ? 0 : .28 / a.palm.h) - a.ct).toFixed(3) : null; return {mode: a.mode, palm: !!a.palm, under};`), 60);
      report.agama.bask = [...new Set(s1.map(v => v.mode + (v.palm ? "@palm" : "")))];
      report.agama.rain = s2[s2.length - 1];
      await page.evaluate(() => { window.__set({weather: "sun", ct: "clear"}); window.__desQA().sim(600, 1); });
      if (!s1.some(v => v.mode === "bask")) fails.push("agama clip: not basking");
      if (!(s2[s2.length - 1].palm && Math.abs(s2[s2.length - 1].under) < .06)) fails.push("agama clip: not under the fronds in rain");
    }
  }
  await cap(page, "");
  if (want("camel")) {
    const s = await clip("camel-walk-side", () => {
      const q = window.__desQA();
      window.__set({weather: "sun", ct: "clear", wind: .4}); q.tod("day");
      const c = q.ANIM.camels[0];
      window.__clipC = c;
      q.fn.camelGo(c, c.x + Math.sin(c.yaw || 0) * 12, c.z + Math.cos(c.yaw || 0) * 12);
    }, () => {
      const q = window.__desQA(), C = window.__C(), c = window.__clipC;
      q.step(1, 1 / 24);
      const yaw = c.yaw != null ? c.yaw : c.g.rotation.y, x = c.g.position.x, z = c.g.position.z, y = c.g.position.y;
      q.lookAt(x + Math.cos(yaw) * 7.5, y + 1.7, z - Math.sin(yaw) * 7.5, x, y + 1.3, z);
      C.De.fov = 34; C.De.near = .05; C.De.updateProjectionMatrix();
      return {x: +x.toFixed(2), z: +z.toFixed(2), mode: c.mode, cur: c.r && c.r.cur};
    }, 24 * 5);
    report.camel = {n: s.length, modes: [...new Set(s.map(v => v.mode + "/" + v.cur))]};
  }
  if (want("eagle")) {
    const s = await clip("eagle-glide", () => {
      const q = window.__desQA(); window.__set({weather: "sun", ct: "clear", wind: .5}); q.tod("day");
    }, () => {
      const q = window.__desQA(), C = window.__C(), e = q.ANIM.eagle;
      q.step(1, 1 / 24);
      const p = e.g.position;
      q.lookAt(p.x + 9, p.y + 2.5, p.z + 9, p.x, p.y, p.z);
      C.De.fov = 34; C.De.near = .05; C.De.updateProjectionMatrix();
      return {x: +p.x.toFixed(2), y: +p.y.toFixed(2), z: +p.z.toFixed(2), mode: e.mode, cur: e.r && e.r.cur};
    }, 24 * 5);
    report.eagle = {n: s.length, modes: [...new Set(s.map(v => v.mode + "/" + v.cur))]};
  }
  if (want("snake")) {
    const s = await clip("snake-crawl", () => {
      const q = window.__desQA(); window.__set({weather: "sun", ct: "clear", wind: .4}); q.tod("day");
      const r = q.ANIM.rs; q.rsPut(r.x, r.z, r.yaw); q.step(4, 1 / 24);
      q.rsGo(r.x + Math.sin(r.yaw) * 5, r.z + Math.cos(r.yaw) * 5, "serp");
      window.__clipS = r;
    }, () => {
      const q = window.__desQA(), C = window.__C(), r = window.__clipS;
      q.step(1, 1 / 24);
      const st = q.rs(), hx = st ? st.head[0] : r.x, hz = st ? st.head[1] : r.z, y = q.hTop(hx, hz);
      q.lookAt(hx + 1.8, y + 1.4, hz + 1.8, hx, y + .05, hz);
      C.De.fov = 34; C.De.near = .02; C.De.updateProjectionMatrix();
      return {mode: st && st.mode, gait: st && st.gait};
    }, 24 * 5);
    report.snake = {n: s.length, modes: [...new Set(s.map(v => v.mode + "/" + v.gait))]};
  }
  /* crab_v6 at the lake edge: the crab with the most open bank round its burrow is the subject, the others stay in. Cameras are in
     the crab's own frame (fw its +z front, rt its +x), so they follow it wherever it is: "q34" front three-quarter low over the bank,
     "claw" close on the big (right) claw, "side" wide along the bank for the side-walk, "bur" over the burrow mouth. */
  const crabSel = () => page.evaluate(() => {
    const q = window.__desQA(), R = q.CR;
    if (R._proof == null) { const c = R.list.slice().sort((a, b) => q.pN(b.bx, b.bz) - q.pN(a.bx, a.bz))[0]; R._proof = R.list.indexOf(c); }
    const c = R.list[R._proof]; for (const o of R.list) if (o !== c) { o.mode = "in"; o.t = 999; }
    R.calm = true; R.gapePin = null; window.__set({weather: "sun", ct: "clear", wind: .3}); q.tod("day");
    return {i: R._proof, n: R.list.length, glb: !!R.glb, bx: +c.bx.toFixed(3), bz: +c.bz.toFixed(3), s: +c.s.toFixed(3)};
  });
  const crabCam = (view, at) => page.evaluate((view, at) => {
    const q = window.__desQA(), C = window.__C(), R = q.CR, c = R.list[R._proof], k = c.s * q.crG;
    const yaw = at && at.yaw != null ? at.yaw : c.yaw, x0 = at ? at.x : c.x, z0 = at ? at.z : c.z, y0 = at ? at.y : c.y;
    const fw = [Math.sin(yaw), Math.cos(yaw)], rt = [Math.cos(yaw), -Math.sin(yaw)];
    const L = (lx, ly, lz) => [x0 + rt[0] * lx * k + fw[0] * lz * k, y0 + ly * k, z0 + rt[1] * lx * k + fw[1] * lz * k];
    const V = {q34: [[0, .03, .01], [.16, .13, .3], 30], claw: [[-.03, .025, .03], [-.07, .11, .25], 30], side: [[0, .03, 0], [0, .16, .56], 36],
      bur: [[0, .02, .02], [.1, .2, .3], 30], top: [[0, 0, 0], [0, .32, .02], 34]}[view];
    const t = L(...V[0]), e = L(...V[1]);
    q.lookAt(e[0], e[1], e[2], t[0], t[1], t[2]); C.De.fov = V[2]; C.De.near = .005; C.De.updateProjectionMatrix();
  }, view, at);
  /* out at the burrow mouth, facing the water, standing still */
  const crabOut = (mode = "out") => page.evaluate(mode => {
    const q = window.__desQA(), R = q.CR, c = R.list[R._proof];
    Object.assign(c, {mode, t: 999, sk: 0, up: 0, v: 0, walk: 0, x: c.bx, z: c.bz, tx: c.bx, tz: c.bz, go: null});
  }, mode);
  const crabState = () => page.evaluate(() => {
    const q = window.__desQA(), R = q.CR, c = R.list[R._proof];
    const w = r => Object.fromEntries(Object.entries(r.acts).filter(([, a]) => a.isRunning() || a.getEffectiveWeight() > .01).map(([k, a]) => [k, {w: +a.getEffectiveWeight().toFixed(2), ts: +a.timeScale.toFixed(2), t: +a.time.toFixed(2)}]));
    return {mode: c.mode, v: +c.v.toFixed(3), yaw: +c.yaw.toFixed(3), x: +c.x.toFixed(3), y: +c.y.toFixed(4), z: +c.z.toFixed(3), sk: +c.sk.toFixed(2), body: c.rb ? c.rb.cur : null, claw: c.rc ? c.rc.cur : null,
      bodyActs: c.rb ? w(c.rb) : null, clawActs: c.rc ? w(c.rc) : null, visible: c.g ? c.g.visible : null, scale: c.g ? +c.g.scale.x.toFixed(3) : null};
  });
  /* a clip of N frames at 24 fps: each frame steps the scene 1/24 s; `each` runs before the step (camera, holds) */
  const crabVid = async (name, N, each) => {
    const dir = path.join(OUT, name + "-frames");
    fs.rmSync(dir, {recursive: true, force: true}); fs.mkdirSync(dir);
    const log = [];
    for (let i = 0; i < N; i++) {
      if (each) await each(i);
      await page.evaluate(() => window.__desQA().step(1, 1 / 24));
      if (i % 12 === 0) log.push(await crabState());
      await frames(page, 1);
      await page.screenshot({path: path.join(dir, String(i).padStart(4, "0") + ".png")});
    }
    await ffmpeg(["-framerate", "24", "-i", path.join(dir, "%04d.png"), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", path.join(OUT, name + ".mp4")]);
    console.log("encoded", name, N);
    return {dir, log};
  };
  const strip = (files, out, crop) => ffmpeg([...files.flatMap(f => ["-i", f]), "-filter_complex",
    files.map((_, j) => `[${j}:v]${crop ? `crop=${crop},` : ""}scale=480:-2[s${j}]`).join(";") + ";" + files.map((_, j) => `[s${j}]`).join("") + `hstack=inputs=${files.length}`, path.join(OUT, out)]);
  const CRW = ["crstand", "crwalk", "crslip", "crpinch", "crdig", "crbur"];
  if (CRW.some(want)) {
    report.crab = {sel: await crabSel(), live: await page.evaluate(() => ({ms: window.CY.ms.crab_v6, glb: window.__desQA().crGlb(), crG: window.__desQA().crG}))};
    console.log("crab", JSON.stringify(report.crab));
    if (!report.crab.sel.glb) fails.push("crab_v6 not loaded: the procedural crab is drawing");
    if (!crReq.has("crab_v6")) fails.push("crab_v6.glb never requested");
    /* what claw_pinch moves: each claw bone's turn from its first frame, sampled over the clip on the subject crab's own rig */
    report.crab.pinchBones = await page.evaluate(() => {
      const q = window.__desQA(), c = q.CR.list[q.CR._proof], a = c.rc.acts.claw_pinch, clip = a.getClip(), out = {};
      for (const tr of clip.tracks) {
        if (!/quaternion$/.test(tr.name)) continue; const v = tr.values, n = v.length / 4; let mx = 0;
        for (let i = 1; i < n; i++) { const d = Math.abs(v[0] * v[i * 4] + v[1] * v[i * 4 + 1] + v[2] * v[i * 4 + 2] + v[3] * v[i * 4 + 3]); mx = Math.max(mx, 2 * Math.acos(Math.min(1, d))); }
        out[tr.name.replace(".quaternion", "")] = +(mx * 180 / Math.PI).toFixed(2);
      }
      return {duration: clip.duration, tracks: clip.tracks.map(t => t.name), maxTurnDeg: out};
    });
    console.log("pinch bones", JSON.stringify(report.crab.pinchBones.maxTurnDeg));
  }
  if (want("crstand")) {
    await crabOut(); await crabCam("q34"); await page.evaluate(() => window.__desQA().step(30, 1 / 30)); await crabCam("q34");
    report.crab.stand = await crabState(); await shot(page, "B_crab_v6_stand_q34.png");
    await crabCam("top"); await page.evaluate(() => window.__desQA().step(2, 1 / 30)); await shot(page, "B_crab_v6_stand_top.png");
    /* mid-stride: walking sideways along the bank, a still from the side-walk */
    await crabOut("walk");
    const at = await page.evaluate(() => { const q = window.__desQA(), c = q.CR.list[q.CR._proof], rt = [Math.cos(c.yaw), -Math.sin(c.yaw)];
      Object.assign(c, {tx: c.bx - rt[0] * .5, tz: c.bz - rt[1] * .5, vt: .1, go: null, mode: "walk"}); return {x: c.bx - rt[0] * .25, z: c.bz - rt[1] * .25, y: c.y, yaw: c.yaw}; });
    await crabCam("q34", at); await page.evaluate(() => window.__desQA().step(36, 1 / 30)); await crabCam("q34", (await crabState()));
    report.crab.walkStill = await crabState(); await shot(page, "B_crab_v6_walk_q34.png");
  }
  if (want("crwalk") || want("crslip")) {
    /* foraging pace along the bank, then back the other way: the gait clip forward one way and backward the other */
    await crabOut();
    const at = await page.evaluate(() => { const q = window.__desQA(), c = q.CR.list[q.CR._proof], rt = [Math.cos(c.yaw), -Math.sin(c.yaw)];
      c.leg = [[c.bx - rt[0] * .42, c.bz - rt[1] * .42], [c.bx, c.bz]];
      Object.assign(c, {tx: c.leg[0][0], tz: c.leg[0][1], vt: .1, go: null, mode: "walk"}); return {x: c.bx - rt[0] * .21, z: c.bz - rt[1] * .21, y: c.y, yaw: c.yaw}; });
    await crabCam("side", at);
    /* foot slip: skinned vertices within 1.5 mm of the sand in the crab's own frame at two steps 1/60 s apart, measured in island
       metres. Planted feet should stay nearly put while the body moves at its walking speed; a gait clip running the wrong way
       would slide them at about twice that, one not running at all at the body's speed. */
    const slip = () => page.evaluate(() => {
      const q = window.__desQA(), c = q.CR.list[q.CR._proof], V = c.g.position.constructor;
      let sk = null; c.g.traverse(o => { if (o.isSkinnedMesh) sk = o; });
      const grab = () => { c.g.updateMatrixWorld(true); const v = new V(), out = []; const n = sk.geometry.attributes.position.count;
        for (let i = 0; i < n; i++) { sk.getVertexPosition(i, v); const h = v.y; v.applyMatrix4(sk.matrixWorld); q.W.worldToLocal(v); out.push([v.x, h, v.z]); } return out; };
      /* over a whole 0.4 s cycle (24 steps) */
      const run = () => { let s = 0, n = 0, bd = 0, a = grab();
        for (let k = 0; k < 24; k++) { const b0 = [c.x, c.z]; q.step(1, 1 / 60); const b = grab(); bd += Math.hypot(c.x - b0[0], c.z - b0[1]) * 60;
          for (let i = 0; i < a.length; i++) if (a[i][1] < .0015 && b[i][1] < .0015) { s += Math.hypot(b[i][0] - a[i][0], b[i][2] - a[i][2]) * 60; n++; } a = b; }
        return {plantedSlip: +(s / Math.max(1, n)).toFixed(4), planted: n, body: +(bd / 24).toFixed(4), clip: c.rb.cur, ts: +c.rb.acts[c.rb.cur].timeScale.toFixed(2)}; };
      const out = [];
      for (const dir of [1, -1]) { const rt = [Math.cos(c.yaw), -Math.sin(c.yaw)];
        Object.assign(c, {x: c.bx, z: c.bz, mode: "walk", vt: .1, v: .1, walk: 1, go: null, tx: c.bx + dir * rt[0] * .4, tz: c.bz + dir * rt[1] * .4});
        q.step(18, 1 / 60); out.push({dir: dir > 0 ? "+x" : "-x", ...run()}); }
      Object.assign(c, {x: c.bx, z: c.bz, mode: "out", v: 0, walk: 0, tx: c.bx, tz: c.bz, t: 999}); q.step(10, 1 / 30);
      return out;
    });
    report.crab.footSlip = await slip(); console.log("crab foot slip", JSON.stringify(report.crab.footSlip));
    for (const s of report.crab.footSlip) if (!(s.plantedSlip < .5 * s.body)) fails.push(`crab feet slide walking ${s.dir}: ${s.plantedSlip} m/s at body ${s.body} m/s`);
  }
  if (want("crwalk")) {
    await page.evaluate(() => { const q = window.__desQA(), c = q.CR.list[q.CR._proof], rt = [Math.cos(c.yaw), -Math.sin(c.yaw)];
      c.leg = [[c.bx - rt[0] * .42, c.bz - rt[1] * .42], [c.bx, c.bz]]; Object.assign(c, {tx: c.leg[0][0], tz: c.leg[0][1], vt: .1, go: null, mode: "walk"}); });
    const r = await crabVid("crab_v6-walk-sideways", 24 * 8, async () => {
      await page.evaluate(() => { const q = window.__desQA(), c = q.CR.list[q.CR._proof];
        if (c.mode === "out" && c.leg.length) { const [x, z] = c.leg.shift(); Object.assign(c, {tx: x, tz: z, vt: .1, go: null, mode: "walk"}); }
        if (c.mode === "out" || c.mode === "walk") c.t = Math.max(c.t, .6); });
    });
    report.crab.walk = r.log;
    const pick = [12, 42, 72, 102, 132, 162].map(i => path.join(r.dir, String(i).padStart(4, "0") + ".png"));
    await strip(pick, "B_crab_v6_walk_strip.png", `${W * .6 | 0}:${H * .6 | 0}:${W * .2 | 0}:${H * .2 | 0}`);
    fs.rmSync(r.dir, {recursive: true, force: true});
    if (!r.log.some(s => s.body === "walk_sideways")) fails.push("crab side-walk never played walk_sideways");
  }
  if (want("crpinch")) {
    /* the pause at the burrow mouth: claw_pinch runs on the claws alone, as the scene plays it */
    await crabOut(); await crabCam("claw"); await page.evaluate(() => window.__desQA().step(20, 1 / 30)); await crabCam("claw");
    const r = await crabVid("crab_v6-claw-pinch", 24 * 5, async () => { await crabOut(); await crabCam("claw"); });
    report.crab.pinch = r.log; fs.rmSync(r.dir, {recursive: true, force: true});
    if (!r.log.every(s => s.claw === "claw_pinch" && s.body === "idle")) fails.push("crab pause is not idle + claw_pinch");
    /* the strip: claw_pinch held at 0, 1/6 … 5/6 of its 1.2 s, the same camera */
    const fs6 = [];
    for (let j = 0; j < 6; j++) {
      /* gapePin × 0.6 s is the held clip time, so j/3 is j/6 of the clip */
      await page.evaluate(j => { const q = window.__desQA(); q.CR.gapePin = j / 3; q.step(2, 1 / 30); }, j);
      await crabCam("claw"); fs6.push(await shot(page, `crab-pinch-${j}.png`));
    }
    await page.evaluate(() => { window.__desQA().CR.gapePin = null; });
    await strip(fs6, "B_crab_v6_claw_pinch_strip.png");
    for (const f of fs6) fs.rmSync(f);
  }
  if (want("crdig")) {
    await crabOut("dig"); await crabCam("bur"); await page.evaluate(() => window.__desQA().step(10, 1 / 30)); await crabCam("bur");
    const r = await crabVid("crab_v6-dig", 24 * 5, async () => { await page.evaluate(() => { const c = window.__desQA().CR.list[window.__desQA().CR._proof]; c.mode = "dig"; c.t = 99; }); });
    report.crab.dig = r.log;
    await ffmpeg(["-i", path.join(r.dir, "0060.png"), "-frames:v", "1", "-update", "1", path.join(OUT, "B_crab_v6_dig.png")]);
    fs.rmSync(r.dir, {recursive: true, force: true});
    if (!r.log.every(s => s.body === "dig" && s.claw === "dig")) fails.push("crab dig is not playing dig");
  }
  if (want("crbur")) {
    /* foraging 0.45 m out on the bank, then something big at the water: it scuttles home and goes down the burrow */
    await crabOut();
    const at = await page.evaluate(() => { const q = window.__desQA(), R = q.CR, c = R.list[R._proof], rt = [Math.cos(c.yaw), -Math.sin(c.yaw)];
      c.x = c.bx + rt[0] * .45; c.z = c.bz + rt[1] * .45; c.y = q.hTop(c.x, c.z); c.mode = "out"; c.t = 999;
      return {x: c.bx + rt[0] * .22, z: c.bz + rt[1] * .22, y: c.y, yaw: c.yaw}; });
    await crabCam("side", at); await page.evaluate(() => window.__desQA().step(10, 1 / 30));
    const r = await crabVid("crab_v6-scare-into-burrow", 24 * 5, async i => {
      if (i === 18) await page.evaluate(() => { const q = window.__desQA(), R = q.CR, c = R.list[R._proof]; R.calm = false;
        const ox = c.x - (c.bx - c.x), oz = c.z - (c.bz - c.z); q.lakeScare(ox, oz, .5, 6); });
    });
    report.crab.burrow = r.log; await page.evaluate(() => { window.__desQA().CR.calm = true; });
    const pick = [12, 30, 42, 54, 66, 90].map(i => path.join(r.dir, String(i).padStart(4, "0") + ".png"));
    await strip(pick, "B_crab_v6_scare_burrow_strip.png", `${W * .6 | 0}:${H * .6 | 0}:${W * .2 | 0}:${H * .2 | 0}`);
    fs.rmSync(r.dir, {recursive: true, force: true});
    if (!r.log.some(s => s.body === "scuttle_sideways")) fails.push("scared crab never scuttled");
    if (!r.log.some(s => s.mode === "in" || s.mode === "down")) fails.push("scared crab never went down its burrow");
  }
  /* ostrich_v2ag in the scene: the engine plays sit and stand_up as authored (no bone offsets, no caption). The cock alone,
     on level sand south of the palms facing east, so the side camera sits due south. */
  const OSN = "ostrich_v2ag";
  if (want("sit") || want("sitstill") || want("osstill") || want("run")) {
    const live = await page.evaluate(() => { const q = window.__desQA(), A = q.PA.os.find(o => o.male) || q.PA.os[0];
      return {glb: !!(A && A.rig), clips: A && A.rig ? Object.keys(A.rig.acts) : []}; });
    console.log("ostrich", OSN, JSON.stringify(live));
    report.ostrich = {file: OSN, ...live};
    if (!live.glb) fails.push("ostrich rig not loaded");
  }
  if (want("sit") || want("sitstill") || want("osstill")) {
    const spot = await page.evaluate(() => {
      const q = window.__desQA();
      window.__set({weather: "sun", ct: "clear", wind: .3}); q.tod("day");
      q.PA.noView = true;
      if (q.ANIM.eagle && q.ANIM.eagle.pos) q.ANIM.eagle.pos.set(40, 22, 40);
      q.ANIM.camels.forEach((c, i) => { c.x = -22; c.z = -18 - i * 4; c.g.position.set(c.x, q.hTop(c.x, c.z), c.z); });
      const yaw = Math.PI / 2, pondOut = (x, z) => Math.hypot((x - q.POND.x) / q.POND.rx, (z - q.POND.z) / q.POND.rz);
      let best = null;
      for (let z = -8.2; z <= -5.2; z += .35) for (let x = -9.5; x <= -3.2; x += .35) {
        if (q.pN(x, z) < 1.55 || !q.osOpen(x, z) || pondOut(x, z) < 1.15) continue;
        let near = 99;
        for (const p of q.PALMS) near = Math.min(near, Math.hypot(x - p.x, z - p.z));
        near = Math.min(near, Math.hypot(x - q.TENT.x, z - q.TENT.z), Math.hypot(x - q.FIRE.x, z - q.FIRE.z));
        if (near < 2.4) continue;
        let cam = 99;
        for (const a of [0, Math.PI, Math.PI / 2, -Math.PI / 2]) for (let d = 1.4; d <= 7.4; d += 1) {
          const px = x + Math.sin(yaw + a) * d, pz = z + Math.cos(yaw + a) * d;
          for (const p of q.PALMS) cam = Math.min(cam, Math.hypot(px - p.x, pz - p.z));
        }
        if (cam < 1.25) continue;
        let dh = 0;
        for (const [dx, dz] of [[.7, 0], [-.7, 0], [0, .7], [0, -.7]]) dh = Math.max(dh, Math.abs(q.hTop(x + dx, z + dz) - q.hTop(x, z)));
        const score = cam + near * .2 - dh * 20;
        if (!best || score > best.score) best = {x, z, dh: +dh.toFixed(4), score: +score.toFixed(2)};
      }
      const A = q.PA.os.find(o => o.male) || q.PA.os[0];
      window.__sit = {x: best.x, z: best.z, yaw};
      q.osPlace(A, best.x, best.z, yaw);
      for (const o of q.PA.os) if (o !== A) { o.mode = "sit"; o.t = 999; o.g.visible = false; o.x = best.x + 14; o.z = best.z + 14; }
      for (let i = 0; i < 20; i++) { A.mode = "stand"; A.t = 999; A.v = 0; A.thr = null; A.path = null; A.g.visible = true; A.x = best.x; A.z = best.z; A.yaw = yaw; q.step(1, 1 / 30); }
      return best;
    });
    console.log("sit spot", JSON.stringify(spot));
    report.sitSpot = spot;
    /* bone scales, morph weights and how far the body's lowest skinned vertex sits from the sand */
    const metrics = () => page.evaluate(() => {
      const q = window.__desQA(), A = q.PA.os.find(o => o.male) || q.PA.os[0];
      A.g.updateMatrixWorld(true);
      let scaleOff = 0;
      /* limbs only: the clips' own scale tracks fold the wings and tuck the tail */
      A.mdl.traverse(b => { if (b.isBone && /thigh|shank|tarso|foot|toe/i.test(b.name)) scaleOff = Math.max(scaleOff, Math.abs(b.scale.x - 1), Math.abs(b.scale.y - 1), Math.abs(b.scale.z - 1)); });
      const morph = {};
      A.mdl.traverse(m => { if (m.isMesh && m.morphTargetInfluences && m.morphTargetDictionary) for (const [n, i] of Object.entries(m.morphTargetDictionary)) morph[n] = Math.max(morph[n] || 0, +m.morphTargetInfluences[i].toFixed(3)); });
      const sit = A.rig.acts.sit, up = A.rig.acts.stand_up;
      return {cur: A.rig.cur, sitT: +sit.time.toFixed(3), upT: +up.time.toFixed(3), limbScaleMaxOff: +scaleOff.toFixed(4), mdlY: +A.mdl.position.y.toFixed(4), morph};
    });
    const drive = async (mode, pred, cap) => {
      let last = null;
      for (let i = 0; i < cap; i++) {
        last = await page.evaluate(mode => {
          const q = window.__desQA(), A = q.PA.os.find(o => o.male) || q.PA.os[0], s = window.__sit;
          A.mode = mode; A.t = 999; A.v = 0; A.yr = 0; A.x = s.x; A.z = s.z; A.yaw = s.yaw; A.thr = null; A.path = null; A.g.visible = true;
          q.step(1, 1 / 30);
          A.x = s.x; A.z = s.z; A.yaw = s.yaw;
          const sit = A.rig.acts.sit, up = A.rig.acts.stand_up;
          A.g.updateMatrixWorld(true);
          return {cur: A.rig.cur, sitT: sit.time, upT: up.time, w: sit.getEffectiveWeight(), wu: up.getEffectiveWeight(), by: A.bn.body.getWorldPosition(new A.g.position.constructor()).y};
        }, mode);
        if (pred(last)) return last;
      }
      return last;
    };
    const cam = kind => page.evaluate(kind => {
      const q = window.__desQA(), C = window.__C(), s = window.__sit, yaw = s.yaw, gy = q.hTop(s.x, s.z);
      const at = (px, pz, y, ly, fov) => { q.lookAt(px, gy + y, pz, s.x, gy + ly, s.z); C.De.fov = fov; C.De.near = .04; C.De.updateProjectionMatrix(); };
      const side = (d, y, ly, fov) => at(s.x + Math.sin(yaw + Math.PI / 2) * d, s.z + Math.cos(yaw + Math.PI / 2) * d, y, ly, fov);
      const face = (sg, d, y, ly, fov) => at(s.x + Math.sin(yaw) * d * sg, s.z + Math.cos(yaw) * d * sg, y, ly, fov);
      ({side: () => side(7.2, 1.15, .95, 28), front: () => face(1, 7.4, 1.15, .95, 28), back: () => face(-1, 7.4, 1.2, .9, 28), low: () => side(7.6, .42, .85, 30),
        mside: () => side(5, .95, .72, 30), mfront: () => face(1, 5.2, .95, .72, 30), mback: () => face(-1, 5.2, 1, .7, 30)})[kind]();
    }, kind);
    /* the user's final ostrich, standing and seated in the scene: one still each, the side camera */
    if (want("osstill")) {
      await drive("stand", s => s.cur === "idle" && s.wu < .01, 120);
      await cam("side"); await shot(page, `${OSN}_stand_side.png`);
      await drive("sit", s => s.cur === "sit" && s.sitT >= 1.6 && s.sitT <= 3.1, 120);
      await cam("side"); await shot(page, `${OSN}_sit_side.png`);
      await drive("stand", s => s.cur === "idle" && s.wu < .01, 160);
      report.osRequested = [...osReq];
      console.log("ostrich files requested", JSON.stringify(report.osRequested));
      if (!(osReq.has("ostrich_v2ag") && osReq.size === 1)) fails.push("the scene did not load ostrich_v2ag alone");
    }
    if (want("sit") || want("sitstill")) {
    const M = report.sitMetrics = {};
    /* pink probe: every fragment of the body material whose albedo texel is the pink of the bare shanks, toes (and beak) is drawn
       pure magenta, unlit; the shot is a scratch render, counted below the head so the beak stays out of it */
    const probe = on => page.evaluate(on => {
      const q = window.__desQA(), A = q.PA.os.find(o => o.male) || q.PA.os[0];
      A.mdl.traverse(c => { if (!c.isMesh || !/ostrich_feathers/.test(c.material.name)) return; const m = c.material;
        if (!m.__pk) { const ob = m.onBeforeCompile, ok = m.customProgramCacheKey; m.__pk = {ob, ok};
          m.onBeforeCompile = (sh, r) => { ob.call(m, sh, r); if (!m.__pkOn) return;
            sh.fragmentShader = sh.fragmentShader.replace("#include <map_fragment>", "#include <map_fragment>\nvec3 pkT=diffuseColor.rgb;")
              .replace("#include <dithering_fragment>", "#include <dithering_fragment>\nif(pkT.r>.16&&pkT.r>pkT.g*1.55&&pkT.r>pkT.b*1.55)gl_FragColor=vec4(1.,0.,1.,1.);"); };
          m.customProgramCacheKey = () => ok.call(m) + (m.__pkOn ? "pk" : ""); }
        m.__pkOn = on; m.needsUpdate = true; });
    }, on);
    const pinkOf = async name => { await probe(true); const f = path.join(OUT, `_probe_${name}.png`); await shot(page, path.basename(f));
      const n = await magentaPx(f, [W * .6, H * .5, W * .2, H * .45].map(Math.round)); fs.rmSync(f); await probe(false); return n; };
    report.pink = {};
    /* "mid" is where the body bone is halfway between its standing and its seated height */
    const yStand = (await drive("stand", s => s.cur === "idle" && s.wu < .01, 120)).by;
    /* control: standing, the bare legs are in full view and the probe must find them */
    await cam("mside"); report.pink.stand_side_control = await pinkOf("stand");
    if (!(report.pink.stand_side_control > 200)) fails.push("pink probe found no legs on the standing bird (probe broken)");
    const yHold = (await drive("sit", s => s.cur === "sit" && s.sitT >= 1.6, 120)).by;
    const yMid = (yStand + yHold) / 2;
    report.sitHeights = {yStand: +yStand.toFixed(3), yHold: +yHold.toFixed(3)};
    await drive("stand", s => s.cur === "idle" && s.wu < .01, 120);
    console.log("settle", JSON.stringify(await drive("sit", s => s.cur === "sit" && s.w > .9 && s.by <= yMid, 80)));
    M.settle = await metrics();
    for (const k of ["side", "front", "back"]) { await cam("m" + k); await shot(page, `${OSN}_settle_mid_${k}.png`); report.pink[`settle_mid_${k}`] = await pinkOf(`settle_${k}`); }
    console.log("hold", JSON.stringify(await drive("sit", s => s.cur === "sit" && s.sitT >= 1.6 && s.sitT <= 3.1, 120)));
    M.hold = await metrics();
    for (const k of ["side", "front", "back", "low"]) { await cam(k); await shot(page, `${OSN}_hold_${k}.png`); report.pink[`hold_${k}`] = await pinkOf(`hold_${k}`); }
    console.log("standup", JSON.stringify(await drive("stand", s => s.cur === "stand_up" && s.wu > .9 && s.by >= yMid, 90)));
    M.standup = await metrics();
    for (const k of ["side", "front", "back"]) { await cam("m" + k); await shot(page, `${OSN}_standup_mid_${k}.png`); report.pink[`standup_mid_${k}`] = await pinkOf(`standup_${k}`); }
    /* both mid poses from the three sides, settle above stand-up, and a count of pink leg pixels in the lower body of each */
    const tri = [];for (const p of ["settle_mid", "standup_mid"]) for (const k of ["side", "front", "back"]) tri.push(path.join(OUT, `${OSN}_${p}_${k}.png`));
    await ffmpeg([...tri.flatMap(f => ["-i", f]), "-filter_complex", tri.map((_, j) => `[${j}:v]scale=480:270[s${j}]`).join(";") + ";[s0][s1][s2]hstack=inputs=3[a];[s3][s4][s5]hstack=inputs=3[b];[a][b]vstack", path.join(OUT, `${OSN}_mid_three_faces.png`)]);
    console.log("sit metrics", JSON.stringify(M));
    console.log("pink (magenta probe px below the head)", JSON.stringify(report.pink));
    for (const k in M) if (M[k].limbScaleMaxOff > .001 || M[k].mdlY !== 0) fails.push(`ostrich ${k}: limb scale or body offset`);
    if (!(M.hold.morph.sit_skirt > 1 && M.hold.morph.soft_mound > .5)) fails.push("ostrich hold: sit_skirt/soft_mound not driven by the clip");

    /* stand -> sit -> hold -> stand_up -> stand, fixed side camera, one 1/30 s step per frame, 30 fps */
    if (want("sit")) {
    await page.evaluate(() => {
      const q = window.__desQA(), A = q.PA.os.find(o => o.male) || q.PA.os[0], s = window.__sit;
      for (let i = 0; i < 40; i++) { A.mode = "stand"; A.t = 999; A.v = 0; A.x = s.x; A.z = s.z; A.yaw = s.yaw; A.thr = null; A.path = null; q.step(1, 1 / 30); }
    });
    await cam("side");
    const dir = path.join(OUT, "sit-frames");
    fs.rmSync(dir, {recursive: true, force: true}); fs.mkdirSync(dir);
    /* 9 s: standing 1 s, sit (1 s settle, then the breathing hold) to 6.6 s, stand_up (1.65 s), standing to the end */
    const marks = {}, N = 30 * 9, T_SIT = 1, T_UP = 6.6;
    for (let i = 0; i < N; i++) {
      const s = await page.evaluate((i, T_SIT, T_UP) => {
        const q = window.__desQA(), A = q.PA.os.find(o => o.male) || q.PA.os[0], s = window.__sit, t = i / 30;
        const mode = t >= T_SIT && t < T_UP ? "sit" : "stand";
        A.mode = mode; A.t = 999; A.v = 0; A.yr = 0; A.x = s.x; A.z = s.z; A.yaw = s.yaw; A.thr = null; A.path = null; A.g.visible = true;
        q.step(1, 1 / 30);
        A.x = s.x; A.z = s.z; A.yaw = s.yaw;
        A.g.updateMatrixWorld(true);
        return {cur: A.rig.cur, sitT: +A.rig.acts.sit.time.toFixed(3), upT: +A.rig.acts.stand_up.time.toFixed(3), by: A.bn.body.getWorldPosition(new A.g.position.constructor()).y};
      }, i, T_SIT, T_UP);
      if (marks.stand == null && i >= 3) marks.stand = i;
      if (marks.sit0 == null && s.cur === "sit") marks.sit0 = i;
      if (marks.settle == null && s.cur === "sit" && s.by <= yMid) marks.settle = i;
      if (marks.hold == null && s.cur === "sit" && s.sitT >= 2) marks.hold = i;
      if (marks.up0 == null && marks.hold != null && s.cur === "stand_up") marks.up0 = i;
      if (marks.up == null && marks.hold != null && s.cur === "stand_up" && s.by >= yMid) marks.up = i;
      if (marks.up != null && marks.done == null && s.cur !== "stand_up" && s.cur !== "sit") marks.done = Math.min(N - 1, i + 12);
      await frames(page, 1);
      await page.screenshot({path: path.join(dir, String(i).padStart(4, "0") + ".png")});
    }
    console.log("sit cycle marks", JSON.stringify(marks));
    report.sitCycle = {fps: 30, frames: N, seconds: N / 30, marks};
    if (N / 30 < 8 || N / 30 > 10) fails.push("sit cycle not 8–10 s");
    await ffmpeg(["-framerate", "30", "-i", path.join(dir, "%04d.png"), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", path.join(OUT, `${OSN}_sit_cycle_side.mp4`)]);
    const strip = (pick, out, w = 640, h = 360) => ffmpeg([...pick.flatMap(n => ["-i", path.join(dir, String(n).padStart(4, "0") + ".png")]), "-filter_complex",
      pick.map((_, j) => `[${j}:v]scale=${w}:${h}[s${j}]`).join(";") + ";" + pick.map((_, j) => `[s${j}]`).join("") + `hstack=inputs=${pick.length}`, path.join(OUT, out)]);
    const pick = [marks.stand, marks.settle, marks.hold, marks.up, marks.done ?? N - 1].filter(n => n != null);
    await strip(pick, `${OSN}_stand_sit_standup_strip.png`);
    /* the settle (1 s) and the rise (1.65 s) frame by frame: six frames from the start of each clip, 0.2 s and 0.33 s apart */
    const six = (a, st) => a == null ? [] : [0, 1, 2, 3, 4, 5].map(d => Math.min(N - 1, a + d * st));
    if (marks.sit0 != null) await strip(six(marks.sit0, 6), `${OSN}_settle_seq_side.png`, 480, 270);
    if (marks.up0 != null) await strip(six(marks.up0, 10), `${OSN}_standup_seq_side.png`, 480, 270);
    report.sitCycle.seq = {settle: six(marks.sit0, 6), standup: six(marks.up0, 10)};
    fs.rmSync(dir, {recursive: true, force: true});
    console.log("encoded sit cycle", pick.join(","));
    }
  }
  }
  if (want("run")) {
    const info = await page.evaluate(() => {
      const q = window.__desQA();
      window.__set({weather: "sun", ct: "clear", wind: .3}); q.tod("day");
      q.PA.noView = true;
      if (q.ANIM.eagle && q.ANIM.eagle.pos) q.ANIM.eagle.pos.set(40, 22, 40);
      q.ANIM.camels.forEach((c, i) => { c.x = -22; c.z = 16 - i * 4; c.g.position.set(c.x, q.hTop(c.x, c.z), c.z); });
      if (q.rsPut) q.rsPut(18, 14, 0);
      const slope = (x, z) => { let dh = 0; for (const [dx, dz] of [[.6, 0], [-.6, 0], [0, .6], [0, -.6]]) dh = Math.max(dh, Math.abs(q.hTop(x + dx, z + dz) - q.hTop(x, z))); return dh; };
      /* cacti and shrubs kept 2.5 m off the path, so the bird never reads as passing over one */
      const plants = q.OBST.filter(o => o.k === "cactus" || o.k === "sag" || o.k === "shrub");
      const clear = (x, z) => plants.every(o => Math.hypot(x - o.x, z - o.z) > o.r + 2.5);
      const ok = (x, z) => q.sN(x, z) < .74 && q.pN(x, z) >= 3.45 && q.osOpen(x, z) && q.dune.dMask(x, z) < .18 && slope(x, z) < .16 && clear(x, z)
        && Math.hypot(x - q.FIRE.x, z - q.FIRE.z) > 6 && Math.hypot(x - q.TENT.x, z - q.TENT.z) > 5;
      let best = null;
      for (let a = 0; a < 16; a++) {
        const yaw = a * Math.PI / 8, dx = Math.sin(yaw), dz = Math.cos(yaw);
        for (let z0 = -14; z0 <= 10; z0 += .7) for (let x0 = -16; x0 <= 16; x0 += .7) {
          if (!ok(x0, z0)) continue;
          let len = 0;
          for (; len < 36; len += .35) if (!ok(x0 + dx * len, z0 + dz * len)) break;
          if (!best || len > best.len) best = {x0, z0, yaw, dx, dz, len: +len.toFixed(2)};
        }
      }
      if (!best || best.len < 14) return {best, fail: "no clear sand run"};
      const A = q.PA.os.find(o => o.male) || q.PA.os[0];
      const travel = Math.min(best.len - 1.2, 22), x1 = best.x0 + best.dx * travel, z1 = best.z0 + best.dz * travel;
      q.osPlace(A, best.x0, best.z0, best.yaw);
      A.path = [{x: best.x0, z: best.z0}, {x: x1, z: z1}, {x: best.x0 + best.dx * (travel + 8), z: best.z0 + best.dz * (travel + 8)}];
      A.pi = 1; A.mode = "run"; A.vmax = 4.9; A.v = 4.6; A.t = 999; A.runT = 999; A.then = null; A.thr = null; A.P.sit = 0; A.g.visible = true;
      for (const o of q.PA.os) if (o !== A) { o.mode = "sit"; o.t = 999; o.g.visible = false; }
      window.__run = {yaw: best.yaw, plants: plants.length};
      window.__runCam = () => { const C = window.__C(), y = window.__run.yaw, d = 8.2;
        q.lookAt(A.x + Math.cos(y) * d, A.gy + 1.25, A.z - Math.sin(y) * d, A.x, A.gy + 1.05, A.z); C.De.fov = 30; C.De.near = .05; C.De.updateProjectionMatrix();
        for (const o of q.PA.os) if (o !== A) o.g.visible = false; };
      /* a bird sat down by an earlier night shot plays stand_up first: record from the stride, not the rise */
      for (let i = 0; i < 28 || (A.rig && A.rig.cur !== "fast_run" && i < 24 * 10); i++) { A.mode = "run"; A.t = 999; A.vmax = 4.9; q.step(1, 1 / 24); window.__runCam(); }
      return {best, plants: plants.length, cur: A.rig && A.rig.cur};
    });
    console.log("run path", JSON.stringify(info));
    report.run = {info};
    if (!info || info.fail) fails.push(info && info.fail || "run path failed");
    else {
      const dir = path.join(OUT, "run-frames");
      fs.rmSync(dir, {recursive: true, force: true}); fs.mkdirSync(dir);
      const samples = [];
      let wraps = 0, prev = null;
      for (let i = 0; i < 24 * 4; i++) {
        const s = await page.evaluate(() => {
          const q = window.__desQA(), A = q.PA.os.find(o => o.male) || q.PA.os[0];
          q.step(1, 1 / 24); window.__runCam();
          const act = A.rig.acts.fast_run, txt = document.body.innerText || "";
          return {mode: A.mode, cur: A.rig.cur, pN: +q.pN(A.x, A.z).toFixed(2), clip: +act.time.toFixed(3), cap: /跑/.test(txt) && [...document.querySelectorAll("body *")].some(n => n.offsetParent && /跑/.test(n.textContent) && !n.children.length)};
        });
        if (i > 6 && (s.mode !== "run" || s.cur !== "fast_run")) break;
        if (prev != null && s.clip < prev - .04) wraps++;
        prev = s.clip; samples.push(s);
        await frames(page, 1);
        await page.screenshot({path: path.join(dir, String(samples.length - 1).padStart(4, "0") + ".png")});
      }
      const sum = report.run.summary = {n: samples.length, wraps, modes: [...new Set(samples.map(s => s.mode + "/" + s.cur))], minPN: Math.min(...samples.map(s => s.pN)), cap: samples.some(s => s.cap)};
      console.log("run", JSON.stringify(sum));
      if (sum.wraps < 3) fails.push("run has fewer than 3 gait cycles");
      if (!sum.modes.every(m => m === "run/fast_run")) fails.push("run left fast_run");
      if (sum.cap) fails.push("run has a 跑 caption");
      await ffmpeg(["-framerate", "24", "-i", path.join(dir, "%04d.png"), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", path.join(OUT, `${OSN}-run-side.mp4`)]);
      fs.rmSync(dir, {recursive: true, force: true});
      console.log("encoded run");
      /* which of the running bird's meshes cast into the shadow map: the opaque body and legs only. A blended or alpha-tested
         feather card that casts lays its quad (or its cut-out) on the sand once per card, the layered feather shadows. */
      const cast = await page.evaluate(() => {
        const q = window.__desQA(), A = q.PA.os.find(o => o.male) || q.PA.os[0], L = [];
        A.g.traverse(m => { if (m.isMesh) L.push({name: m.name || m.material.name, mat: m.material.name, cast: m.castShadow, transparent: !!m.material.transparent, alphaTest: +m.material.alphaTest || 0, depthMat: !!m.customDepthMaterial}); });
        return {meshes: L.length, casting: L.filter(m => m.cast), cards: L.filter(m => m.transparent || m.alphaTest > 0).map(m => m.mat + ":" + (m.cast ? "casts" : "no shadow")), blob: false};
      });
      report.run.shadow = cast;
      console.log("run shadow", JSON.stringify({meshes: cast.meshes, casting: cast.casting.map(m => m.mat), cards: cast.cards}));
      if (cast.casting.some(m => m.transparent || m.alphaTest > 0)) fails.push("a feather card casts a shadow");
      /* the bird mid-stride from above, the sun behind the camera's shoulder: one shadow, body and legs */
      await page.evaluate(() => {
        const q = window.__desQA(), C = window.__C(), A = q.PA.os.find(o => o.male) || q.PA.os[0];
        q.step(1, 1 / 24); window.__runCam();
        /* the shadow falls away from the sun light (q.pi): (dx, dz) points along it on the sand */
        const L0 = q.pi, sv = L0.position.clone().sub(L0.target.position), dx = -sv.x, dz = -sv.z, l = Math.hypot(dx, dz) || 1;
        q.lookAt(A.x - dx / l * 2.2, A.gy + 6.2, A.z - dz / l * 2.2, A.x + dx / l * .9, A.gy, A.z + dz / l * .9); C.De.fov = 34; C.De.near = .05; C.De.updateProjectionMatrix();
        A.v = 0; A.vmax = 0;
      });
      await shot(page, `${OSN}_run_shadow_top.png`);
    }
  }
  /* gerbil_v5b in the scene: one gerbil out on level open sand by day, the others below; clips chosen by the engine from the mode
     (stand -> stand_lookout, nibble -> dig, a mode it has no case for -> idle, moving -> hop_run) */
  const GBN = "gerbil_v5b";
  if (want("gerbil") || want("gbdig") || want("gbhop")) {
    const spot = await page.evaluate(() => {
      const q = window.__desQA();
      window.__set({weather: "sun", ct: "clear", wind: .25}); q.tod("day");
      q.PA.noView = true;
      if (q.ANIM.eagle && q.ANIM.eagle.pos) q.ANIM.eagle.pos.set(40, 22, 40);
      q.ANIM.camels.forEach((c, i) => { c.x = -22; c.z = -18 - i * 4; c.g.position.set(c.x, q.hTop(c.x, c.z), c.z); });
      if (q.rsPut) q.rsPut(18, 14, 0);
      for (const o of q.PA.os) { o.mode = "sit"; o.t = 999; o.x = 24; o.z = -20; o.g.visible = false; }
      for (const t of q.PA.tt) { t.x = -20; t.z = -16; t.g.visible = false; }
      for (const s of q.PA.sc) { s.mode = "hide"; s.g.visible = false; }
      const A = q.PA.gb[0];
      for (const g of q.PA.gb) if (g !== A) { g.mode = "in"; g.t = 999; g.g.visible = false; }
      const slope = (x, z) => { let dh = 0; for (const [dx, dz] of [[.3, 0], [-.3, 0], [0, .3], [0, -.3]]) dh = Math.max(dh, Math.abs(q.hTop(x + dx, z + dz) - q.hTop(x, z))); return dh; };
      const clearOf = (x, z, m) => q.OBST.every(o => Math.hypot(x - o.x, z - o.z) > o.r + m);
      /* a little way out from its own burrow, on level sand, nothing within a metre of it or of the side and front cameras */
      let best = null;
      for (const h of q.PA.gb.map(g => g.h)) for (let r = .5; r <= 2.4; r += .15) for (let a = 0; a < 24; a++) {
        const x = h.x + Math.sin(a / 24 * Math.PI * 2) * r, z = h.z + Math.cos(a / 24 * Math.PI * 2) * r, yaw = Math.atan2(x - h.x, z - h.z);
        if (q.pN(x, z) < 1.3 || !clearOf(x, z, 1)) continue;
        const sx = x + Math.sin(yaw + Math.PI / 2) * .6, sz = z + Math.cos(yaw + Math.PI / 2) * .6, fx = x + Math.sin(yaw) * .6, fz = z + Math.cos(yaw) * .6;
        if (!clearOf(sx, sz, .6) || !clearOf(fx, fz, .6)) continue;
        const dh = slope(x, z), score = -dh * 40 - r * .2;
        if (!best || score > best.score) best = {x: +x.toFixed(3), z: +z.toFixed(3), yaw: +yaw.toFixed(3), dh: +dh.toFixed(4), r: +r.toFixed(2), score: +score.toFixed(3), h: q.PA.gb.findIndex(g => g.h === h)};
      }
      window.__gb = best;
      return best;
    });
    console.log("gerbil spot", JSON.stringify(spot));
    report.gerbilSpot = spot;
    const gbStep = (mode, n, dt) => page.evaluate((mode, n, dt) => {
      const q = window.__desQA(), A = q.PA.gb[0], s = window.__gb, gy0 = q.hTop(s.x, s.z);
      /* a gerbil too small on screen is skipped (its rig not ticked), so the camera comes in close first */
      q.lookAt(s.x + Math.sin(s.yaw + Math.PI / 2) * .62, gy0 + .085, s.z + Math.cos(s.yaw + Math.PI / 2) * .62, s.x, gy0 + .06, s.z);
      for (let i = 0; i < n; i++) {
        A.mode = mode; A.t = 99; A.v = 0; A.goal = null; A.out = true; A.P.in = 0; A.x = s.x; A.z = s.z; A.yaw = s.yaw; A.gy = q.hTop(s.x, s.z);
        q.step(1, dt); A.g.visible = true;
      }
      A.g.updateMatrixWorld(true);
      const morph = {};
      A.g.traverse(m => { if (m.isMesh && m.morphTargetInfluences && m.morphTargetDictionary) for (const [k, j] of Object.entries(m.morphTargetDictionary)) morph[k] = Math.max(morph[k] || 0, +m.morphTargetInfluences[j].toFixed(3)); });
      let scaleOff = 0, cast = [], fur = null;
      A.g.traverse(b => { if (b.isBone) scaleOff = Math.max(scaleOff, Math.abs(b.scale.x - 1), Math.abs(b.scale.y - 1), Math.abs(b.scale.z - 1));
        if (b.isMesh) { cast.push(b.material.name + ":" + b.castShadow); if (!b.material.transparent && b.material.map) fur = b.material.map.image && b.material.map.image.width; } });
      const head = A.bn.head.getWorldPosition(new A.g.position.constructor()); q.W.worldToLocal(head);
      return {cur: A.rig && A.rig.cur, morph, boneScaleMaxOff: +scaleOff.toFixed(4), cast, furPx: fur, headY: +(head.y - A.gy).toFixed(4), sc: +A.g.scale.x.toFixed(3)};
    }, mode, n, dt);
    const gbCam = kind => page.evaluate(kind => {
      const q = window.__desQA(), C = window.__C(), A = q.PA.gb[0], s = window.__gb, gy = q.hTop(s.x, s.z), yaw = s.yaw;
      const head = A.bn.head.getWorldPosition(new A.g.position.constructor()); q.W.worldToLocal(head);
      const at = (a, d, y, tx, ty, tz, fov) => { q.lookAt(s.x + Math.sin(yaw + a) * d, gy + y, s.z + Math.cos(yaw + a) * d, tx, ty, tz); C.De.fov = fov; C.De.near = .01; C.De.updateProjectionMatrix(); };
      ({side: () => at(Math.PI / 2, .62, .085, s.x, gy + .06, s.z, 28), front: () => at(0, .56, .09, s.x, gy + .065, s.z, 28),
        face: () => { const hx = head.x + Math.sin(yaw) * .012, hz = head.z + Math.cos(yaw) * .012; q.lookAt(hx + Math.sin(yaw + .5) * .2, head.y + .02, hz + Math.cos(yaw + .5) * .2, hx, head.y + .004, hz); C.De.fov = 26; C.De.near = .01; C.De.updateProjectionMatrix(); },
        hop: () => at(Math.PI / 2, .9, .1, A.x, gy + .04, A.z, 30)})[kind]();
    }, kind);
    const G = report.gerbil = {file: GBN};
    if (want("gerbil")) {
      G.stand = await gbStep("stand", 90, 1 / 30);
      for (const k of ["side", "front", "face"]) { await gbCam(k); await shot(page, `${GBN}_stand_lookout_${k}.png`); }
      G.idle = await gbStep("hold", 90, 1 / 30);
      await gbCam("side"); await shot(page, `${GBN}_idle_side.png`);
      G.dig = await gbStep("nibble", 45, 1 / 30);
      await gbCam("side"); await shot(page, `${GBN}_dig_side.png`);
      console.log("gerbil metrics", JSON.stringify(G));
      if (G.stand.cur !== "stand_lookout" || !(G.stand.morph.lookout_fix > .99)) fails.push("gerbil lookout: lookout_fix not 1 in stand_lookout");
      if (G.idle.cur !== "idle" || G.idle.morph.lookout_fix > .01) fails.push("gerbil idle: lookout_fix not 0");
      if (G.dig.cur !== "dig" || G.dig.morph.lookout_fix > .01) fails.push("gerbil dig: lookout_fix not 0");
      for (const k of ["stand", "idle", "dig"]) if (G[k].boneScaleMaxOff > .001) fails.push(`gerbil ${k}: bone scale off 1`);
      if (G.stand.cast.some(c => /hair/.test(c) && /true/.test(c))) fails.push("gerbil hair cards cast shadows");
      if (G.stand.furPx !== 2048) fails.push("gerbil fur colour not 2048 px in the scene");
    }
    const gbStrip = (dir, pick, out) => ffmpeg([...pick.flatMap(n => ["-i", path.join(dir, String(n).padStart(4, "0") + ".png")]), "-filter_complex",
      pick.map((_, j) => `[${j}:v]scale=384:216[s${j}]`).join(";") + ";" + pick.map((_, j) => `[s${j}]`).join("") + `hstack=inputs=${pick.length}`, path.join(OUT, out)]);
    if (want("gbdig")) {
      await gbStep("hold", 30, 1 / 30);
      await gbCam("side");
      const dir = path.join(OUT, "gbdig-frames");
      fs.rmSync(dir, {recursive: true, force: true}); fs.mkdirSync(dir);
      const N = 24 * 3;
      for (let i = 0; i < N; i++) {
        await gbStep(i < 6 ? "hold" : "nibble", 1, 1 / 24);
        await frames(page, 1);
        await page.screenshot({path: path.join(dir, String(i).padStart(4, "0") + ".png")});
      }
      await ffmpeg(["-framerate", "24", "-i", path.join(dir, "%04d.png"), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", path.join(OUT, `${GBN}_dig_side.mp4`)]);
      /* five frames across one 2 s dig cycle, from 0.5 s in */
      await gbStrip(dir, [12, 24, 36, 48, 60], `${GBN}_strip_dig_side.png`);
      fs.rmSync(dir, {recursive: true, force: true});
      console.log("encoded gerbil dig", N);
    }
    if (want("gbhop")) {
      /* a short dash across level sand past the spot, the camera tracking from the side. By day its behaviour sends a foraging
         gerbil straight home, so it is driven at .8 m/s in mode "dbg" (no case in gbUpdate: it keeps the speed and heading given) */
      const dir = path.join(OUT, "gbhop-frames");
      fs.rmSync(dir, {recursive: true, force: true}); fs.mkdirSync(dir);
      await page.evaluate(() => { const q = window.__desQA(), A = q.PA.gb[0], s = window.__gb;
        q.PA.noView = true; A.x = s.x - Math.sin(s.yaw) * .5; A.z = s.z - Math.cos(s.yaw) * .5; A.yaw = s.yaw; A.mode = "dbg"; A.t = 99; });
      const hs = [];
      for (let i = 0; i < 24 * 2; i++) {
        const r = await page.evaluate(() => { const q = window.__desQA(), C = window.__C(), A = q.PA.gb[0], s = window.__gb;
          A.mode = "dbg"; A.t = 99; A.v = .8; A.yaw = s.yaw; A.out = true; A.P.in = 0;
          q.step(1, 1 / 24); A.g.visible = true;
          const gy = q.hTop(A.x, A.z), y = s.yaw;
          q.lookAt(A.x + Math.sin(y + Math.PI / 2) * .9, gy + .1, A.z + Math.cos(y + Math.PI / 2) * .9, A.x, gy + .04, A.z); C.De.fov = 30; C.De.near = .01; C.De.updateProjectionMatrix();
          return {cur: A.rig && A.rig.cur, v: +A.v.toFixed(3)}; });
        hs.push(r);
        await frames(page, 1);
        await page.screenshot({path: path.join(dir, String(i).padStart(4, "0") + ".png")});
      }
      G.hop = {clips: [...new Set(hs.map(h => h.cur))], vmax: Math.max(...hs.map(h => h.v))};
      console.log("gerbil hop", JSON.stringify(G.hop));
      if (!G.hop.clips.includes("hop_run")) fails.push("gerbil dash never played hop_run");
      /* the stills come from the dash itself: the fastest hop_run frames, then five 2 frames apart (one 0.3 s hop at 24 fps is 7 frames) */
      const hopI = hs.map((h, i) => [h, i]).filter(([h]) => h.cur === "hop_run").map(([, i]) => i);
      if (hopI.length) {
        const mid = hopI[Math.floor(hopI.length / 2)];
        fs.copyFileSync(path.join(dir, String(mid).padStart(4, "0") + ".png"), path.join(OUT, `${GBN}_hop_run_side.png`));
        const a0 = Math.max(hopI[0], Math.min(mid - 4, hs.length - 9));
        await gbStrip(dir, [0, 2, 4, 6, 8].map(d => a0 + d), `${GBN}_strip_hop_run_side.png`);
        G.hop.still = mid;
      }
      await ffmpeg(["-framerate", "24", "-i", path.join(dir, "%04d.png"), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", path.join(OUT, `${GBN}_hop_run_side.mp4`)]);
      fs.rmSync(dir, {recursive: true, force: true});
      console.log("encoded gerbil hop");
    }
  }
  /* scorpion_v2c in the scene: one scorpion on its rock's doorstep on level sand, driven directly (mode "dbg" has no case in its
     behaviour, so it keeps the speed it is given; noView keeps the camera from reading as a threat) */
  const SCN = "scorpion_v2c";
  if (want("scorp") || want("scwalk")) {
    const spot = await page.evaluate(() => {
      const q = window.__desQA();
      window.__set({weather: "sun", ct: "clear", wind: .2}); q.tod("day");
      q.PA.noView = true;
      if (q.ANIM.eagle && q.ANIM.eagle.pos) q.ANIM.eagle.pos.set(40, 22, 40);
      q.ANIM.camels.forEach((c, i) => { c.x = -22; c.z = -18 - i * 4; c.g.position.set(c.x, q.hTop(c.x, c.z), c.z); });
      if (q.rsPut) q.rsPut(18, 14, 0);
      for (const o of q.PA.os) { o.mode = "sit"; o.t = 999; o.x = 24; o.z = -20; o.g.visible = false; }
      for (const t of q.PA.tt) { t.x = -20; t.z = -16; t.g.visible = false; }
      for (const g of q.PA.gb) { g.mode = "in"; g.t = 999; g.g.visible = false; }
      const slope = (x, z) => { let dh = 0; for (const [dx, dz] of [[.15, 0], [-.15, 0], [0, .15], [0, -.15]]) dh = Math.max(dh, Math.abs(q.hTop(x + dx, z + dz) - q.hTop(x, z))); return dh; };
      let best = null;
      for (const [i, S] of q.PA.sc.entries()) { const r = S.rk, yaw = Math.atan2(r.dx - r.hx, r.dz - r.hz), dh = slope(r.dx, r.dz);
        if (!best || dh < best.dh) best = {i, x: +r.dx.toFixed(3), z: +r.dz.toFixed(3), yaw: +yaw.toFixed(3), dh: +dh.toFixed(4)}; }
      for (const [i, S] of q.PA.sc.entries()) if (i !== best.i) { S.mode = "hide"; S.t = 999; }
      window.__sc = best;
      const A = q.PA.sc[best.i], mats = [];
      A.g.traverse(m => { if (m.isMesh) mats.push({name: m.material.name, transparent: !!m.material.transparent, cast: m.castShadow, glow: !!m.material.emissiveMap}); });
      return {...best, rig: !!A.rig, clips: A.rig ? Object.keys(A.rig.acts) : [], mats};
    });
    console.log("scorpion", SCN, JSON.stringify(spot));
    const SC = report.scorpion = {file: SCN, ...spot};
    if (!spot.rig) fails.push("scorpion rig not loaded");
    if (spot.mats.some(m => m.transparent && m.cast)) fails.push("scorpion setae cards cast shadows");
    if (!spot.mats.some(m => !m.transparent && m.glow) || spot.mats.some(m => m.transparent && m.glow)) fails.push("scorpion UV glow not on the cuticle alone");
    const scStep = (v, n, dt, hold) => page.evaluate((v, n, dt, hold) => {
      const q = window.__desQA(), s = window.__sc, A = q.PA.sc[s.i];
      for (let k = 0; k < n; k++) { A.mode = "dbg"; A.t = 99; A.v = v; A.P.thr = 0; if (hold) { A.x = s.x; A.z = s.z; } A.yaw = s.yaw; q.step(1, dt); A.g.visible = true; }
      A.g.updateMatrixWorld(true);
      /* framing radius from the body's bind-pose box (in island metres; the model is drawn at file scale) */
      let r = 0; A.g.traverse(m => { if (m.isMesh && !m.material.transparent) { m.geometry.computeBoundingBox(); const b = m.geometry.boundingBox; r = Math.max(r, b.max.x - b.min.x, b.max.z - b.min.z) / 2 * A.g.scale.x; } });
      return {cur: A.rig && A.rig.cur, x: A.x, z: A.z, r};
    }, v, n, dt, hold);
    const scCam = (kind, r, at) => page.evaluate((kind, r, at) => {
      const q = window.__desQA(), C = window.__C(), s = window.__sc, A = q.PA.sc[s.i], x = at ? at.x : A.x, z = at ? at.z : A.z, gy = q.hTop(x, z), yaw = s.yaw;
      const put = (a, d, y, ty, fov, tx = x, tz = z) => { q.lookAt(tx + Math.sin(yaw + a) * d, gy + y, tz + Math.cos(yaw + a) * d, tx, gy + ty, tz); C.De.fov = fov; C.De.near = .005; C.De.updateProjectionMatrix(); };
      ({side: () => put(Math.PI / 2, r * 4.4, r * .6, r * .45, 28), three_q: () => put(Math.PI / 4, r * 3.2, r * 1.5, r * .25, 28),
        close: () => put(Math.PI / 2, r * 1.35, r * .3, r * .22, 28, x + Math.sin(yaw) * r * .35, z + Math.cos(yaw) * r * .35)})[kind]();
    }, kind, r, at);
    const rest = await scStep(0, 60, 1 / 30, true);
    SC.rest = {cur: rest.cur, r: +rest.r.toFixed(4)};
    if (want("scorp")) {
      for (const k of ["side", "three_q", "close"]) { await scCam(k, rest.r); await shot(page, `${SCN}_rest_${k === "close" ? "close_setae_side" : k}.png`); }
      await page.evaluate(() => window.__desQA().tod("night")); await scStep(0, 30, 1 / 30, true);
      await scCam("three_q", rest.r); await shot(page, `${SCN}_uv_night_three_q.png`);
      await page.evaluate(() => window.__desQA().tod("day")); await scStep(0, 30, 1 / 30, true);
    }
    if (want("scwalk")) {
      /* 2 s at the clip's own pace (.071 m/s), camera tracking from the side */
      await page.evaluate(() => { const q = window.__desQA(), s = window.__sc, A = q.PA.sc[s.i]; A.x = s.x - Math.sin(s.yaw) * .07; A.z = s.z - Math.cos(s.yaw) * .07; });
      const dir = path.join(OUT, "scwalk-frames");
      fs.rmSync(dir, {recursive: true, force: true}); fs.mkdirSync(dir);
      const cl = [];
      for (let i = 0; i < 48; i++) {
        const st = await scStep(.071, 1, 1 / 24, false); cl.push(st.cur);
        await scCam("side", rest.r, {x: st.x, z: st.z});
        await frames(page, 1);
        await page.screenshot({path: path.join(dir, String(i).padStart(4, "0") + ".png")});
      }
      SC.walk = {clips: [...new Set(cl)]};
      if (!cl.includes("walk")) fails.push("scorpion never played walk");
      await ffmpeg(["-framerate", "24", "-i", path.join(dir, "%04d.png"), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", path.join(OUT, `${SCN}_walk_side.mp4`)]);
      /* one 0.5 s step cycle (12 frames) in five, from 1 s in */
      await ffmpeg([...[24, 26, 28, 31, 33].flatMap(n => ["-i", path.join(dir, String(n).padStart(4, "0") + ".png")]), "-filter_complex",
        [0, 1, 2, 3, 4].map(j => `[${j}:v]scale=384:216[s${j}]`).join(";") + ";[s0][s1][s2][s3][s4]hstack=inputs=5", path.join(OUT, `${SCN}_strip_walk_side.png`)]);
      fs.copyFileSync(path.join(dir, "0028.png"), path.join(OUT, `${SCN}_walk_side.png`));
      fs.rmSync(dir, {recursive: true, force: true});
      console.log("encoded scorpion walk");
    }
    console.log("scorpion metrics", JSON.stringify(SC));
  }
  /* tortoise_v2h in the scene: the first tortoise on a fixed patch of dune, held in mode "dbg" (idle) for rest, then "shell" so
     head_withdraw plays through and holds with its withdraw_close morph */
  const TTN = "tortoise_v2h";
  if (want("tort")) {
    const spot = await page.evaluate(() => {
      const q = window.__desQA();
      window.__set({weather: "sun", ct: "clear", wind: .2}); q.tod("day");
      q.PA.noView = true;
      if (q.ANIM.eagle && q.ANIM.eagle.pos) q.ANIM.eagle.pos.set(40, 22, 40);
      q.ANIM.camels.forEach((c, i) => { c.x = -22; c.z = -18 - i * 4; c.g.position.set(c.x, q.hTop(c.x, c.z), c.z); });
      if (q.rsPut) q.rsPut(18, 14, 0);
      for (const o of q.PA.os) { o.mode = "sit"; o.t = 999; o.x = 24; o.z = -20; o.g.visible = false; }
      for (const g of q.PA.gb) { g.mode = "in"; g.t = 999; g.g.visible = false; }
      for (const s of q.PA.sc) { s.mode = "hide"; s.t = 999; }
      q.PA.tt.slice(1).forEach(t => { t.x = -20; t.z = -16; t.mode = "dbg"; t.t = 999; });
      const A = q.PA.tt[0], mats = [];
      A.g.traverse(m => { if (m.isMesh) mats.push({name: m.material.name, transparent: !!m.material.transparent, cast: m.castShadow,
        morphs: m.morphTargetDictionary ? Object.keys(m.morphTargetDictionary) : []}); });
      /* a fixed open, level patch of dune east of the pond, so reruns frame the same ground */
      A.x = 5.74; A.z = -.726; A.yaw = 2.683; A.gy = q.hTop(A.x, A.z);
      window.__tt = {x: A.x, z: A.z, yaw: A.yaw};
      return {x: +A.x.toFixed(3), z: +A.z.toFixed(3), yaw: +A.yaw.toFixed(3), rig: !!A.rig, clips: A.rig ? Object.keys(A.rig.acts) : [],
        bones: A.bn ? Object.keys(A.bn).length : 0, mats};
    });
    console.log("tortoise", TTN, JSON.stringify(spot));
    const TT = report.tortoise = {file: TTN, ...spot};
    if (!spot.rig) fails.push("tortoise rig not loaded");
    for (const c of ["idle", "slow_crawl", "head_withdraw", "head_out"]) if (!spot.clips.includes(c)) fails.push("tortoise clip missing: " + c);
    if (!spot.mats.some(m => m.morphs.includes("withdraw_close"))) fails.push("tortoise withdraw_close morph missing");
    const ttStep = (mode, n, dt) => page.evaluate((mode, n, dt) => {
      const q = window.__desQA(), s = window.__tt, A = q.PA.tt[0];
      for (let k = 0; k < n; k++) { A.mode = mode; A.t = 99; A.v = 0; A.x = s.x; A.z = s.z; A.yaw = s.yaw; q.step(1, dt); A.g.visible = true; }
      A.g.updateMatrixWorld(true);
      let r = 0, wc = 0; A.g.traverse(m => { if (m.isMesh) { m.geometry.computeBoundingBox(); const b = m.geometry.boundingBox; r = Math.max(r, b.max.x - b.min.x, b.max.z - b.min.z) / 2 * A.g.scale.x;
        const i = m.morphTargetDictionary && m.morphTargetDictionary.withdraw_close; if (i !== undefined) wc = Math.max(wc, m.morphTargetInfluences[i]); } });
      /* lowest skinned point above the sand under it (island metres) */
      let lo = Infinity; const gw = A.g.getWorldPosition(A.g.position.clone());
      A.g.traverse(m => { if (m.isSkinnedMesh) { m.computeBoundingBox(); const b = m.boundingBox.clone().applyMatrix4(m.matrixWorld);
        lo = Math.min(lo, q.W.worldToLocal(gw.clone().setY(b.min.y)).y); } });
      return {cur: A.rig && A.rig.cur, r, wc: +wc.toFixed(3), wd: +A.P.wd.toFixed(3), gap: +(lo - q.hTop(A.x, A.z)).toFixed(4), gy: +(A.gy - q.hTop(A.x, A.z)).toFixed(4)};
    }, mode, n, dt);
    const ttCam = (kind, r) => page.evaluate((kind, r) => {
      const q = window.__desQA(), C = window.__C(), s = window.__tt, gy = q.hTop(s.x, s.z), yaw = s.yaw;
      const put = (a, d, y, ty, fov) => { q.lookAt(s.x + Math.sin(yaw + a) * d, gy + y, s.z + Math.cos(yaw + a) * d, s.x, gy + ty, s.z); C.De.fov = fov; C.De.near = .005; C.De.updateProjectionMatrix(); };
      ({side: () => put(Math.PI / 2, r * 4.6, r * .55, r * .5, 28), three_q: () => put(Math.PI / 4, r * 4, r * 1.6, r * .4, 28),
        front_close: () => put(0, r * 2.4, r * .45, r * .4, 28), three_q_close: () => put(Math.PI / 4, r * 2.6, r * .9, r * .4, 28)})[kind]();
    }, kind, r);
    const rest = await ttStep("dbg", 60, 1 / 30);
    TT.rest = {cur: rest.cur, r: +rest.r.toFixed(4), wc: rest.wc, gap: rest.gap, gy: rest.gy};
    for (const k of ["side", "three_q"]) { await ttCam(k, rest.r); await shot(page, `${TTN}_rest_${k}.png`); }
    const wd = await ttStep("shell", 120, 1 / 30);
    TT.withdraw = {cur: wd.cur, wc: wd.wc, wd: wd.wd, gap: wd.gap, gy: wd.gy};
    if (wd.cur !== "head_withdraw") fails.push("tortoise not in head_withdraw after 4 s in shell");
    for (const k of ["front_close", "three_q_close"]) { await ttCam(k, rest.r); await shot(page, `${TTN}_withdraw_${k}.png`); }
    console.log("tortoise metrics", JSON.stringify(TT));
  }
} catch (e) {
  console.log("PROOF ERROR", String(e && e.stack || e).slice(0, 1500));
  fails.push("exception");
} finally {
  /* modes run in separate passes add to one report */
  const rf = path.join(OUT, "d160-report.json");
  let prev = {}; try { prev = JSON.parse(fs.readFileSync(rf, "utf8")); } catch (e) {}
  if (WHICH === "cmp") delete report.live;
  fs.writeFileSync(rf, JSON.stringify(Object.assign(prev, report), null, 2));
  await browser.close(); server.close();
}
if (fails.length) { console.log("PROOF FAIL", fails.join("; ")); process.exit(1); }
console.log("d160 proofs ok");
