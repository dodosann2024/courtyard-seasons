// Desert d174 reference shots of the sky ocean (/sea/), for the desert-vs-ocean detail comparison. Not part of CI.
// Same viewport, settings panel hidden, clear day, breeze 0.45; eye level (1.6 above the water, looking across it) and close
// range (0.55 above the water near the rim, looking down at the edge). Writes OUT/ocean_eye.png, OUT/ocean_close.png.
// Usage: node tools/e2e/d174-ocean.mjs   (OUT=/tmp/d174/out DIR=<checkout>)
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import puppeteer from "puppeteer-core";

const ROOT = path.resolve(process.env.DIR || path.join(path.dirname(fileURLToPath(import.meta.url)), "../.."));
const OUT = process.env.OUT || "/tmp/d174/out";
fs.mkdirSync(OUT, {recursive: true});
const CHROME = process.env.CHROME || ["/usr/bin/google-chrome-stable", "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/local/bin/google-chrome"].find(p => fs.existsSync(p));
const TYPES = {".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp",
  ".ktx2": "image/ktx2", ".glb": "model/gltf-binary", ".mp3": "audio/mpeg", ".wasm": "application/wasm", ".bin": "application/octet-stream"};
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p.endsWith("/")) p += "index.html";
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, {"content-type": TYPES[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(0, "127.0.0.1", r));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const browser = await puppeteer.launch({executablePath: CHROME, headless: "new", protocolTimeout: 1800000,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader", "--mute-audio"]});
try {
  const page = await browser.newPage();
  page.on("pageerror", e => console.log("PAGEERR", String(e).slice(0, 300)));
  await page.setViewport({width: 1280, height: 720, deviceScaleFactor: 1});
  await page.goto(`http://127.0.0.1:${server.address().port}/sea/?nosw=1&debug=1`, {waitUntil: "domcontentloaded", timeout: 120000});
  await page.waitForFunction(() => window.__ready && window.__seaReady && window.__sea && window.__C, {timeout: 600000, polling: 500});
  await sleep(8000);
  await page.evaluate(() => { document.body.classList.add("col", "snc"); for (const s of [".t", "#fab", "#sbtn", "#tp", "#ld"]) { const n = document.querySelector(s); if (n) n.style.display = "none"; }
    window.__set({mode: "manual", night: false, weather: "sun", ct: "clear", wind: .45}); });
  await sleep(4000);
  const frames = n => page.evaluate(n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
  const info = {};
  for (const k of ["eye", "close"]) {
    /* the galleon sails around the middle of the ocean: shoot from the side away from it, out toward the rim */
    info[k] = await page.evaluate(k => { const C = window.__C(), S = window.__sea, V = C.De.position.constructor;
      let sx = 0, sz = 0, n = 0; S.ship.traverse(o => { if (o.isMesh) { const p = o.getWorldPosition(new V()); sx += p.x; sz += p.z; n++; } });
      const th = Math.atan2(-sz, -sx) + (k === "eye" ? 0 : .35), ux = Math.cos(th), uz = Math.sin(th), px = -uz, pz = ux;
      const [p, t, fov] = k === "eye" ? [[ux * 4.6, 1.6, uz * 4.6], [ux * 9.6 + px * 1.5, -.5, uz * 9.6 + pz * 1.5], 55] : [[ux * 6.9, .55, uz * 6.9], [ux * 8.2 + px * .9, -.15, uz * 8.2 + pz * .9], 50];
      C.Ce.enabled = false; C.De.position.set(...p); C.De.lookAt(...t); C.De.fov = fov; C.De.near = .02; C.De.updateProjectionMatrix();
      return {cam: p.map(v => +v.toFixed(2)), target: t.map(v => +v.toFixed(2)), fov, ship: [+(sx / n).toFixed(2), +(sz / n).toFixed(2)]}; }, k);
    await frames(20); await sleep(500);
    await page.screenshot({path: path.join(OUT, `ocean_${k}.png`)}); console.log("ocean", k, JSON.stringify(info[k]));
  }
  fs.writeFileSync(path.join(OUT, "ocean_views.json"), JSON.stringify(info, null, 1));
} finally { await browser.close(); server.close(); }
