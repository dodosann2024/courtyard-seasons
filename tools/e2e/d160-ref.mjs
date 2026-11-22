// Desert #160: the sandfall the user marked as right, shot on any checkout (SITE=<dir>, default this repo) with the page UI left on,
// in the framings of the user's reference (overview, under the rim, the cliff face). Not part of CI.
// Usage: SITE=/tmp/wt-28f4e5f OUT=/tmp/ref/28f4e5f node tools/e2e/d160-ref.mjs
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import puppeteer from "puppeteer-core";

const SITE = path.resolve(process.env.SITE || path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.."));
const OUT = process.env.OUT || "/tmp/ref";
const W = +(process.env.W || 1280), H = +(process.env.H || 720);
const CHROME = process.env.CHROME || ["/usr/bin/google-chrome-stable", "/usr/bin/google-chrome", "/usr/bin/chromium"].find(p => fs.existsSync(p));
fs.mkdirSync(OUT, {recursive: true});

const TYPES = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png",
  ".jpg": "image/jpeg", ".webp": "image/webp", ".ktx2": "image/ktx2", ".glb": "model/gltf-binary", ".mp3": "audio/mpeg", ".m4a": "audio/mp4",
  ".ogg": "audio/ogg", ".wasm": "application/wasm", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".bin": "application/octet-stream"};
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p.endsWith("/")) p += "index.html";
  const f = path.join(SITE, p);
  if (!f.startsWith(SITE) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, {"content-type": TYPES[path.extname(f)] || "application/octet-stream", "cache-control": "no-store"});
  fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(0, "127.0.0.1", r));
const ORIGIN = `http://127.0.0.1:${server.address().port}`;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const browser = await puppeteer.launch({executablePath: CHROME, headless: "new", protocolTimeout: 900000,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader", "--mute-audio"]});

/* island metres (q.lookAt): px,py,pz, tx,ty,tz, fov. ov is the desktop default camera; the rest look up at the rim from below it,
   at the angle th (radians round the rim) where the reference's close shots sit */
const rimCam = (th, d, dy, ty, fov, side = 0) => ({th, d, dy, ty, fov, side});
const CAMS = {
  ov: {w: [-4.16, 11.13, 19.58, 0, 0, 0, 40]},
  far: [58, 6, 40, 4, -10, 2, 36],
  mid: [36, 1.5, 25, 7, -7.5, 4.5, 38],
  near: [27.8, 1.6, 19.5, 12, -3.5, 8.4, 44],
  corner: rimCam(.62, 13, -5, -4, 44, .9),
  face: rimCam(.95, 8.5, -3.5, -3.6, 50, 0),
  /* the reference's own framings: far, level with the island from the side the dune shows on the left; near, square on to the
     heavy pour on that side, the lip at the top of the frame */
  rfar: [-8, 3, -104, -2, -5.5, 0, 30],
  rnear: {heavy: [0, -1], d: 9, dy: -4.4, ty: -6.6, fov: 52},
};
if (process.env.ORBIT) {
  if (!process.env.ONLY) for (const k of Object.keys(CAMS)) delete CAMS[k];
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; CAMS["orbit" + i] = [Math.cos(a) * 70, 9, Math.sin(a) * 70, 0, -6, 0, 34]; }
}
if (process.env.ONLY) for (const k of Object.keys(CAMS)) if (!process.env.ONLY.split(",").includes(k)) delete CAMS[k];

const page = await browser.newPage();
await page.setViewport({width: W, height: H, deviceScaleFactor: 1});
page.on("pageerror", e => console.log("PAGEERR", String(e).slice(0, 300)));
await page.goto(ORIGIN + "/desert/?nosw=1&debug=1", {waitUntil: "domcontentloaded", timeout: 120000});
await page.waitForFunction(() => window.__ready && window.__desReady && window.__desQA && window.__desQA().ready, {timeout: 300000, polling: 500});
const live = await page.evaluate(() => {
  const q = window.__desQA(), C = window.__C();
  document.body.classList.add("col", "snc");
  for (const s of ["#ld", "#tp", "#snd"]) { const n = document.querySelector(s); if (n) n.style.display = "none"; }
  q.freeze && q.freeze(true); q.tod && q.tod("day"); window.__set && window.__set({weather: "sun", ct: "clear", wind: .5});
  C.Ce.enabled = false; q.sim && q.sim(6);
  return window.CY && window.CY.desert;
});
console.log("live", live);
const frames = n => page.evaluate(n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
for (const [k, v] of Object.entries(CAMS)) {
  await page.evaluate(v => {
    const q = window.__desQA(), C = window.__C();
    if (v.w) { C.De.position.set(v.w[0], v.w[1], v.w[2]); C.Ce.target.set(v.w[3], v.w[4], v.w[5]); C.De.lookAt(C.Ce.target); v = v.w; }
    else if (Array.isArray(v)) q.lookAt(v[0], v[1], v[2], v[3], v[4], v[5]);
    else if (v.heavy) {
      const F = q.sf().F.filter(f => f.ty === 0);
      const f = F.reduce((a, b) => (b.nx * v.heavy[0] + b.nz * v.heavy[1] > a.nx * v.heavy[0] + a.nz * v.heavy[1] ? b : a));
      const y = q.hTop(f.x - f.nx * .3, f.z - f.nz * .3);
      q.lookAt(f.x + f.nx * v.d, y + v.dy, f.z + f.nz * v.d, f.x + f.nx * .4, y + v.ty, f.z + f.nz * .4);
    }
    else if (!q.edgeXZ) return;
    else {
      const [ex, ez] = q.edgeXZ(v.th, 1), r = Math.hypot(ex, ez), nx = ex / r, nz = ez / r, tx = -nz, tz = nx, y = q.hTop(ex * .96, ez * .96);
      q.lookAt(ex + nx * v.d + tx * v.side * v.d, y + v.dy, ez + nz * v.d + tz * v.side * v.d, ex, y + v.ty, ez);
    }
    C.De.fov = Array.isArray(v) ? v[6] : v.fov; C.De.near = .1; C.De.updateProjectionMatrix();
  }, v);
  await frames(4); await sleep(100);
  await page.screenshot({path: path.join(OUT, `ref_${k}.png`)});
  console.log("shot", k);
}
await browser.close(); server.close();

/* REF=<the user's 2x3 sheet, 640x360 panels>: its far (top left) and near (bottom left) panels beside ours, and with V145=<this
   script's OUT on main 2ce9643> the #145 shots in between */
if (process.env.REF && fs.existsSync(process.env.REF)) {
  const {execFile} = await import("node:child_process");
  const ff = args => new Promise((res, rej) => execFile("ffmpeg", ["-y", "-loglevel", "error", ...args], (e, _o, se) => e ? rej(new Error(String(se))) : res()));
  const lab = t => `drawtext=fontfile=/usr/share/fonts/truetype/wqy/wqy-microhei.ttc:text='${t}':x=(w-tw)/2:y=h-th-44:fontsize=24:fontcolor=white:borderw=2:bordercolor=black`;
  const V = process.env.V145;
  for (const [k, y] of [["far", 0], ["near", 720]]) {
    const ours = path.join(OUT, `ref_r${k}.png`); if (!fs.existsSync(ours)) continue;
    await ff(["-i", process.env.REF, "-i", ours, "-filter_complex",
      `[0:v]crop=640:360:0:${y},${lab("附图（用户认可）")}[a];[1:v]scale=640:360,${lab("d160 恢复后")}[b];[a][b]hstack`, "-update", "1", "-frames:v", "1", path.join(OUT, `q_ref_${k}_vs_d160.png`)]);
    const mid = V && path.join(V, `ref_r${k}.png`);
    if (mid && fs.existsSync(mid)) await ff(["-i", process.env.REF, "-i", mid, "-i", ours, "-filter_complex",
      `[0:v]crop=640:360:0:${y},${lab("附图")}[a];[1:v]scale=640:360,${lab("main 2ce9643（#145）")}[b];[2:v]scale=640:360,${lab("d160 恢复后")}[c];[a][b][c]hstack=inputs=3`,
      "-update", "1", "-frames:v", "1", path.join(OUT, `q_ref_${k}_ref_145_d160.png`)]);
    console.log("ref cmp", k);
  }
}
