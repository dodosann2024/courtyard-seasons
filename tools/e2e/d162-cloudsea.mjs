// Desert #162: the cloud sea under and round the island, at fixed framings, on any checkout (assets are committed, nothing is built).
// Framings: "edge" from the island's rim looking out and down, "far" the far view of #153–#160, "under" from below the rim line.
// Times: day, dusk, night, rain. DEV=desktop (1280×720) or iphone (iPhone 13 emulated, the phone path of the scene).
// Writes OUT/<tag>_<dev>_<tod>_<view>.png and prints the share of each frame's lower half that is cloud sea (bright, low saturation).
// Usage: node tools/e2e/d162-cloudsea.mjs <checkout dir> <tag>   (OUT=/tmp/cloud DEV=desktop|iphone TODS=day,dusk,night,rain VIEWS=edge,far,under)
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import {execFile} from "node:child_process";
import puppeteer, {KnownDevices} from "puppeteer-core";

const DIR = path.resolve(process.argv[2] || "."), TAG = process.argv[3] || "x";
const OUT = process.env.OUT || "/tmp/cloud", DEV = process.env.DEV || "desktop";
const TODS = (process.env.TODS || "day,dusk,night,rain").split(","), VIEWS = (process.env.VIEWS || "edge,far,under").split(",");
const CHROME = process.env.CHROME || ["/usr/bin/google-chrome-stable", "/usr/bin/google-chrome", "/usr/local/bin/google-chrome"].find(p => fs.existsSync(p));
fs.mkdirSync(OUT, {recursive: true});
const TYPES = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp",
  ".ktx2": "image/ktx2", ".glb": "model/gltf-binary", ".mp3": "audio/mpeg", ".m4a": "audio/mp4", ".ogg": "audio/ogg", ".wasm": "application/wasm", ".css": "text/css", ".svg": "image/svg+xml"};
const server = http.createServer((req, res) => { let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p.endsWith("/")) p += "index.html";
  const f = path.join(DIR, p); if (!f.startsWith(DIR) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, {"content-type": TYPES[path.extname(f)] || "application/octet-stream", "cache-control": "no-store"}); fs.createReadStream(f).pipe(res); });
await new Promise(r => server.listen(0, "127.0.0.1", r));
const browser = await puppeteer.launch({executablePath: CHROME, headless: "new", protocolTimeout: 900000,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader", "--mute-audio"]});
const page = await browser.newPage();
page.on("pageerror", e => console.log("PAGEERR", String(e).slice(0, 300)));
const missing = new Set();
page.on("response", r => { if (r.status() >= 400) missing.add(new URL(r.url()).pathname); });
if (DEV === "iphone") await page.emulate(KnownDevices["iPhone 13"]); else await page.setViewport({width: 1280, height: 720, deviceScaleFactor: 1});
await page.goto(`http://127.0.0.1:${server.address().port}/desert/?nosw=1&debug=1`, {waitUntil: "domcontentloaded", timeout: 120000});
await page.waitForFunction(() => window.__ready && window.__desReady && window.__desQA && window.__desQA().ready, {timeout: 400000, polling: 500});
await page.evaluate(() => { const q = window.__desQA(), C = window.__C(); document.body.classList.add("col", "snc");
  for (const s of [".t", "#fab", "#sbtn", "#tp", "#ld"]) { const n = document.querySelector(s); if (n) n.style.display = "none"; }
  q.freeze(true); C.Ce.enabled = false; });
const info = await page.evaluate(() => ({desert: window.CY && window.CY.desert, mob: navigator.userAgent.includes("iPhone")}));
const frames = n => page.evaluate(n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
/* lower half of the frame: share of pixels that read as cloud deck (bright and close to grey), sand and sky excluded */
const cloudShare = f => new Promise((res, rej) => execFile("ffmpeg", ["-loglevel", "error", "-i", f, "-vf", "crop=iw:ih/2:0:ih/2,scale=320:-2", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
  {encoding: "buffer", maxBuffer: 1e8}, (e, o) => { if (e) return rej(e); let n = 0, m = 0; for (let i = 0; i < o.length; i += 3) { const r = o[i], g = o[i + 1], b = o[i + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    m++; if (mx > 70 && (mx - mn) < .32 * mx && !(r > b + 40)) n++; } res(+(n / m).toFixed(3)); }));
const out = {tag: TAG, dev: DEV, ...info, shots: {}};
for (const tod of TODS) {
  await page.evaluate(tod => { const q = window.__desQA();
    window.__set(tod === "rain" ? {weather: "hrain", ct: "overcast", wind: .5, mode: "manual"} : tod === "night" ? {weather: "sun", ct: "clear", wind: .5, mode: "full"} : {weather: "sun", ct: "clear", wind: .5, mode: "manual"});
    q.tod(tod === "dusk" ? "sunset" : tod === "rain" ? "day" : tod); q.sim(tod === "rain" ? 40 : 2); }, tod);
  for (const v of VIEWS) {
    await page.evaluate(v => { const q = window.__desQA(), C = window.__C();
      if (v === "edge") { const [ex, ez] = q.edgeXZ(.6, 1), y = q.hTop(ex, ez); q.lookAt(ex * .9, y + 1.7, ez * .9, ex * 1.6, y - 12, ez * 1.6); C.De.fov = 60; }
      else if (v === "far") { q.lookAt(58, 6, 40, 4, -10, 2); C.De.fov = 36; }
      else if (v === "ov") { C.De.position.set(-4.16, 11.13, 19.58); C.Ce.target.set(0, 0, 0); C.De.lookAt(C.Ce.target); C.De.fov = 40; }
      else { q.lookAt(40, -9, 30, 0, -16, 0); C.De.fov = 50; }
      C.De.near = .1; C.De.updateProjectionMatrix(); }, v);
    await frames(4);
    const f = path.join(OUT, `${TAG}_${DEV}_${tod}_${v}.png`); await page.screenshot({path: f});
    out.shots[`${tod}_${v}`] = await cloudShare(f);
  }
}
out.missing = [...missing];
console.log("CLOUD", JSON.stringify(out));
await browser.close(); server.close();
