// Clear-day perf guard: the default day desert on an emulated iPhone 13 with the CPU throttled 4x and no debug flag, measured
// as JS time per requestAnimationFrame callback over 20 s, starting 5 s after window.__desProg() reports the models done.
// Runs alternate between this checkout and main (fetched into a worktree; assets are committed, so nothing is built).
// Fails if this build's mean is more than 15% above main's, or if any frame in its window takes over 200 ms. A round of this build
// with such a frame is run once more: main's own load can leave one first-draw shader stall that late, while a regression stalls
// every round.
// Usage: node tools/e2e/perf.mjs   (CHROME=... ; BASE_DIR=<checkout of main> to skip the fetch; ROUNDS=2)
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {execSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import puppeteer, {KnownDevices} from "puppeteer-core";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const CHROME = process.env.CHROME || ["/usr/bin/google-chrome-stable", "/usr/bin/google-chrome", "/usr/bin/chromium"].find(p => fs.existsSync(p));
const ROUNDS = +(process.env.ROUNDS || 2), THR = 4, WAIT = 5, SEC = 20;
const TYPES = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png",
  ".jpg": "image/jpeg", ".webp": "image/webp", ".ktx2": "image/ktx2", ".glb": "model/gltf-binary", ".mp3": "audio/mpeg", ".m4a": "audio/mp4",
  ".ogg": "audio/ogg", ".wasm": "application/wasm", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".bin": "application/octet-stream"};

let BASE = process.env.BASE_DIR;
if (!BASE) {
  BASE = fs.mkdtempSync(path.join(os.tmpdir(), "perf-main-"));
  execSync("git fetch --depth=1 origin main", {cwd: ROOT, stdio: "inherit"});
  execSync(`git worktree add --detach "${BASE}" FETCH_HEAD`, {cwd: ROOT, stdio: "inherit"});
}

const serve = root => new Promise(r => {
  const s = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (p.endsWith("/")) p += "index.html";
    const f = path.join(root, p);
    if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, {"content-type": TYPES[path.extname(f)] || "application/octet-stream"});
    fs.createReadStream(f).pipe(res);
  });
  s.listen(0, "127.0.0.1", () => r(`http://127.0.0.1:${s.address().port}`));
});
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run(origin) {
  const b = await puppeteer.launch({executablePath: CHROME, headless: "new", protocolTimeout: 1800000,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader", "--mute-audio"]});
  try {
    const p = await b.newPage();
    await p.emulate(KnownDevices["iPhone 13"]);
    await p.evaluateOnNewDocument(() => {
      const raf = window.requestAnimationFrame.bind(window); window.__ft = []; window.__ftOn = false;
      window.requestAnimationFrame = cb => raf(ts => { const a = performance.now(); cb(ts); if (window.__ftOn) window.__ft.push(performance.now() - a); });
    });
    const c = await p.target().createCDPSession();
    await c.send("Emulation.setCPUThrottlingRate", {rate: THR});
    await p.goto(`${origin}/desert/?nosw=1`, {waitUntil: "domcontentloaded", timeout: 600000});
    const t0 = Date.now();
    while (!(await p.evaluate(() => !!(window.__desProg && window.__desProg().done)))) {
      if (Date.now() - t0 > 900000) throw new Error("models never done");
      await sleep(2000);
    }
    await sleep(WAIT * 1000);
    await p.evaluate(() => { window.__ft = []; window.__ftOn = true; });
    await sleep(SEC * 1000);
    const f = await p.evaluate(() => { window.__ftOn = false; return window.__ft; });
    const s = [...f].sort((a, b) => a - b);
    return {frames: f.length, jsMean: +(f.reduce((a, x) => a + x, 0) / Math.max(1, f.length)).toFixed(1),
      jsP95: +(s[Math.min(s.length - 1, Math.floor(s.length * .95))] || 0).toFixed(1), max: Math.round(s[s.length - 1] || 0),
      over200: f.filter(x => x > 200).length};
  } finally { b.process()?.kill("SIGKILL"); }
}

const PR = await serve(ROOT), MAIN = await serve(BASE);
const R = {pr: [], main: []};
for (let i = 0; i < ROUNDS; i++) {
  for (const [k, o] of [["pr", PR], ["main", MAIN]]) {
    let r = await run(o); console.log(k, JSON.stringify(r));
    if (k === "pr" && r.over200) { r = await run(o); console.log(k, "rerun", JSON.stringify(r)); }
    R[k].push(r);
  }
}
const mean = a => a.reduce((s, r) => s + r.jsMean, 0) / a.length;
const mPR = mean(R.pr), mMain = mean(R.main), stalls = R.pr.reduce((s, r) => s + r.over200, 0);
const ok1 = mPR <= mMain * 1.15, ok2 = stalls === 0;
console.log(ok1 ? "ok  " : "FAIL", "clear-day JS per frame within +15% of main", JSON.stringify({pr: +mPR.toFixed(1), main: +mMain.toFixed(1), limit: +(mMain * 1.15).toFixed(1)}));
console.log(ok2 ? "ok  " : "FAIL", "no frame over 200 ms after load", JSON.stringify({over200: R.pr.map(r => r.over200), max: R.pr.map(r => r.max)}));
process.exit(ok1 && ok2 ? 0 : 1);
