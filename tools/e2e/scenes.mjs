// End-to-end check of the scene panel: serves the repo locally, opens the site in headless Chrome, clicks every scene button
// (desktop mouse and iPhone touch), checks the browser back button, and fails on any request that leaves localhost
// or any console output. Usage: node tools/e2e/scenes.mjs   (CHROME=/path/to/chrome to override the browser)
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import puppeteer from "puppeteer-core";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const CHROME = process.env.CHROME || ["/usr/bin/google-chrome-stable", "/usr/bin/google-chrome", "/usr/bin/chromium"].find(p => fs.existsSync(p));
const SWITCH_MS = +(process.env.SWITCH_MS || 240000);
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
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
const fail = m => { failures.push(m); console.log("FAIL", m); };

async function session(label, mobile) {
  const browser = await puppeteer.launch({executablePath: CHROME, headless: "new", protocolTimeout: 900000,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader", "--mute-audio"]});
  const page = await browser.newPage();
  if (mobile) { await page.setUserAgent(IPHONE); await page.setViewport({width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true}); }
  else await page.setViewport({width: 1280, height: 720});
  page.on("console", m => fail(`${label}: console ${m.type()}: ${m.text().slice(0, 200)}`));
  page.on("pageerror", e => fail(`${label}: page error: ${String(e).slice(0, 200)}`));
  await page.setRequestInterception(true);
  page.on("request", r => {
    const u = r.url();
    if (u.startsWith(ORIGIN) || u.startsWith("data:") || u.startsWith("blob:")) r.continue();
    else { fail(`${label}: request leaves localhost: ${u}`); r.abort(); }
  });
  const state = () => page.evaluate(() => ({yard: document.documentElement.dataset.yard, path: location.pathname,
    on: (document.querySelector("#gy [data-y].on") || {dataset: {}}).dataset.y, desert: !!window.__desReady}));
  const settle = async to => {
    const t0 = Date.now();let s;
    while (Date.now() - t0 < SWITCH_MS) { s = await state(); if (s.yard === to && s.on === to && (to !== "desert" || s.desert)) return s; await sleep(500); }
    return s;
  };
  await page.goto(ORIGIN + "/?nosw=1", {waitUntil: "domcontentloaded", timeout: 120000});
  await page.waitForFunction(() => window.__ready, {timeout: SWITCH_MS});
  const yards = await page.$$eval("#gy [data-y]", bs => bs.map(b => b.dataset.y));
  if (!yards.includes("desert")) fail(`${label}: no desert button in the scene panel (${yards})`);
  const order = mobile ? ["desert", "sea", "desert"] : [...yards.filter(y => y !== "def"), "def", "desert"];
  for (const to of order) {
    const before = await state();
    await page.evaluate(() => document.body.classList.remove("col"));
    const b = await page.$(`#gy [data-y="${to}"]`);
    await page.evaluate(el => el.scrollIntoView({block: "center", inline: "center"}), b);
    await sleep(300);
    if (mobile) await b.tap(); else await b.click();
    const s = await settle(to);
    const wantPath = to === "def" ? "/" : `/${to}/`;
    const ok = s.yard === to && s.on === to && s.path === wantPath;
    console.log(`${label}: ${before.yard} -> ${to}`, ok ? "ok" : "FAIL", JSON.stringify(s));
    if (!ok) fail(`${label}: ${before.yard} -> ${to} did not switch (${JSON.stringify(s)})`);
  }
  /* back: from the last scene to the one before it */
  const prev = order[order.length - 2];
  await page.goBack();
  const s = await settle(prev);
  const ok = s.yard === prev && s.on === prev;
  console.log(`${label}: back -> ${prev}`, ok ? "ok" : "FAIL", JSON.stringify(s));
  if (!ok) fail(`${label}: back did not return to ${prev} (${JSON.stringify(s)})`);
  await browser.close();
}

try {
  await session("desktop", false);
  await session("iphone", true);
} finally { server.close(); }
if (failures.length) { console.log(`\n${failures.length} failure(s)`); process.exit(1); }
console.log("\nall scene switches ok");
