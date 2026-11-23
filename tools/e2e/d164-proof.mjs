// Desert d164 proofs, on any checkout (DIR, default this one; assets are committed, nothing is built). Not part of CI.
//   bar    the drying rack's cross-bar (mesh "rackBar"): close-ups by day, at dusk and wet after rain, and a mid shot with the tent
//   ver    the scene panel open, with its 「版本 xxxxxx」 label
//   agama  a basking Sinai agama, close
//   pair   (no browser) before/after strips from OUT/main_*.png and OUT/new_*.png
// Usage: node tools/e2e/d164-proof.mjs [bar|ver|agama|pair|all]   (OUT=/tmp/d164 DIR=<checkout> TAG=<file prefix>)
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {execFile} from "node:child_process";
import puppeteer from "puppeteer-core";
const ffmpeg = args => new Promise((res, rej) => execFile("ffmpeg", ["-y", "-loglevel", "error", ...args], {maxBuffer: 1e8}, (e, _o, se) => e ? rej(new Error(String(se).slice(-500))) : res()));

const ROOT = path.resolve(process.env.DIR || path.join(path.dirname(fileURLToPath(import.meta.url)), "../.."));
const OUT = process.env.OUT || "/tmp/d164";
const CHROME = process.env.CHROME || ["/usr/bin/google-chrome-stable", "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/local/bin/google-chrome"].find(p => fs.existsSync(p));
const WHICH = process.argv[2] || "all";
const W = +(process.env.W || 1280), H = +(process.env.H || 720);
const TAG = process.env.TAG || "";
const want = k => WHICH === "all" || WHICH === k || WHICH.split(",").includes(k);
fs.mkdirSync(OUT, {recursive: true});
const FONT = "/usr/share/fonts/truetype/wqy/wqy-microhei.ttc";

if (WHICH === "pair") {
  /* before | after, each labelled, at 960 px wide per side */
  const lab = t => `drawtext=fontfile=${FONT}:text='${t}':x=14:y=12:fontsize=28:fontcolor=white:borderw=2:bordercolor=black`;
  for (const n of ["A_bar_close_day", "A_bar_close_dusk", "A_bar_close_rain", "B_bar_mid_tent"]) {
    const a = path.join(OUT, `main_${n}.png`), b = path.join(OUT, `new_${n}.png`);
    if (!fs.existsSync(a) || !fs.existsSync(b)) { console.log("skip", n); continue; }
    await ffmpeg(["-i", a, "-i", b, "-filter_complex", `[0:v]scale=960:-2,${lab("修改前（main）")}[l];[1:v]scale=960:-2,${lab("修改后（本分支）")}[r];[l][r]hstack=inputs=2`, path.join(OUT, `${n}_before_after.png`)]);
    console.log("pair", n);
  }
  process.exit(0);
}

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
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"]});
/* a render never outlives 10 minutes */
const killer = setTimeout(() => { console.log("TIMEOUT: killing the browser"); try { browser.process().kill("SIGKILL"); } catch (_) {} process.exit(3); }, +(process.env.LIMIT || 590) * 1000);

const HIDE = [".t", "#fab", "#sbtn", "#tp", "#ld"];
const page = await browser.newPage();
const osReq = new Set();
page.on("request", r => { const m = /\/(ostrich_v2[a-z0-9]+)\.glb/.exec(r.url());
  const i = r.initiator(), pre = i && i.stack && i.stack.callFrames.some(f => f.functionName === "desPre"); if (m && !pre) osReq.add(m[1]); });
page.on("console", m => { const t = m.type(); if (t === "error" || t === "warning") console.log("PAGE", t, m.text().slice(0, 240)); });
page.on("pageerror", e => console.log("PAGEERR", String(e).slice(0, 300)));
await page.setViewport({width: W, height: H, deviceScaleFactor: 1});
await page.goto(ORIGIN + "/desert/?nosw=1&debug=1", {waitUntil: "domcontentloaded", timeout: 120000});
await page.waitForFunction(() => window.__ready && window.__desReady && window.__desQA && window.__desQA().ready, {timeout: 300000, polling: 500});
const hideUI = () => page.evaluate(HIDE => {
  document.body.classList.add("col", "snc");
  for (const s of HIDE) { const n = document.querySelector(s); if (n) n.style.display = "none"; }
}, HIDE);
await hideUI();
await page.evaluate(() => { const q = window.__desQA(), C = window.__C(); q.freeze(true); q.tod("day"); window.__set({weather: "sun", ct: "clear", wind: .3}); C.Ce.enabled = false; q.sim(2); });

const frames = async n => page.evaluate(n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
async function shot(name) { await frames(3); await sleep(80); const f = path.join(OUT, name); await page.screenshot({path: f, type: "png"}); console.log("shot", f); return f; }
const cap = text => page.evaluate(text => {
  let d = document.getElementById("d164cap");
  if (!text) { if (d) d.remove(); return; }
  if (!d) { d = document.createElement("div"); d.id = "d164cap"; document.body.appendChild(d); }
  d.textContent = text;
  d.style.cssText = "position:fixed;left:18px;bottom:16px;z-index:50;pointer-events:none;font:600 20px 'WenQuanYi Micro Hei','Droid Sans Fallback',sans-serif;color:#fff;letter-spacing:.02em;text-shadow:0 1px 2px #000,0 0 4px #000";
}, text || "");
const tod = k => page.evaluate(k => { const q = window.__desQA(); window.__set(k === "night" ? {mode: "full"} : {mode: "manual"}); q.tod(k === "dusk" ? "sunset" : k); q.sim(1.5); }, k);
/* camera in the rack's own frame: x along the bar, y up from the sand under the rack, z toward the tent's front */
const rackCam = (eye, at, fov) => page.evaluate((eye, at, fov) => {
  const q = window.__desQA(), C = window.__C(), R = q.RACK, c = Math.cos(R.yaw), s = Math.sin(R.yaw), y0 = q.hTop(R.x, R.z);
  const w = v => [R.x + v[0] * c + v[2] * s, y0 + v[1], R.z - v[0] * s + v[2] * c], e = w(eye), t = w(at);
  q.lookAt(e[0], e[1], e[2], t[0], t[1], t[2]); C.De.fov = fov; C.De.near = .05; C.De.updateProjectionMatrix(); C.De.updateMatrixWorld(true);
}, eye, at, fov);
const fails = [];
const report = {};

try {
  report.live = await page.evaluate(() => ({desert: window.CY && window.CY.desert, ver: (document.getElementById("ver") || {}).textContent || null}));
  console.log("live", JSON.stringify(report.live));

  if (want("bar")) {
    report.bar = await page.evaluate(() => { const g = window.__desQA().RACK.g, b = g.getObjectByName("rackBar") || g.children.find(m => m.geometry && m.geometry.type === "CylinderGeometry" && Math.abs(m.position.y - 1.82) < .01);
      if (!b) return null; b.geometry.computeBoundingBox(); const bb = b.geometry.boundingBox;
      return {name: b.name || "(unnamed cylinder)", verts: b.geometry.attributes.position.count, size: [bb.max.x - bb.min.x, bb.max.y - bb.min.y, bb.max.z - bb.min.z].map(v => +v.toFixed(3)),
        material: b.material.type + (b.material.customProgramCacheKey ? ":" + b.material.customProgramCacheKey() : "")}; });
    console.log("bar", JSON.stringify(report.bar));
    const CLOSE = JSON.parse(process.env.CLOSE || "[[0.86,1.97,0.56],[1.4,1.8,0],30]"), MID = [[-3.2, 2.3, 7.6], [-2.6, 1.3, -1.2], 46];
    const set = [["A_bar_close_day", "day", {weather: "sun", ct: "clear"}, CLOSE, "晾毯架横梁特写（白天）"],
      ["A_bar_close_dusk", "dusk", {weather: "sun", ct: "clear"}, CLOSE, "晾毯架横梁特写（黄昏）"],
      ["B_bar_mid_tent", "day", {weather: "sun", ct: "clear"}, MID, "中景：帐篷与右前方的晾毯架横梁"],
      ["A_bar_close_rain", "day", {weather: "hrain", ct: "overcast"}, CLOSE, "晾毯架横梁特写（大雨后，木头淋湿变深）"]];
    for (const [n, v] of JSON.parse(process.env.XCAMS || "[]")) { await tod("day"); await rackCam(...v); await shot(`${TAG}x_${n}.png`); }
    for (const [n, k, wx, v, t] of set.filter(s => !process.env.ONLY || process.env.ONLY.split(",").includes(s[0]))) {
      await page.evaluate(wx => { window.__set(Object.assign({wind: .4}, wx)); window.__desQA().sim(wx.weather === "hrain" ? 60 : 3); }, wx);
      await tod(k); await rackCam(...v); await cap(t); await shot(`${TAG}${n}.png`);
      if (wx.weather === "hrain") report.wet = await page.evaluate(() => +window.__desQA().tentU.uWetC.value.toFixed(2));
    }
    await page.evaluate(() => { window.__set({weather: "sun", ct: "clear", wind: .3}); window.__desQA().sim(2); }); await tod("day"); await cap("");
  }

  if (want("ver")) {
    await page.evaluate(() => { document.body.classList.remove("col"); for (const s of ["#fab", "#sbtn", "#tp"]) { const n = document.querySelector(s); if (n) n.style.display = ""; } });
    await sleep(2500); await frames(4);
    report.ver = await page.evaluate(() => { const v = document.getElementById("ver"), r = v && v.getBoundingClientRect(); return {text: v && v.textContent, bundle: window.CY && window.CY.desert, visible: !!r && r.width > 0 && r.bottom > 0 && r.top < innerHeight}; });
    const m = /desert\.(\w{6})/.exec(report.ver.bundle || "");
    report.ver.match = !!m && report.ver.text === "版本 " + m[1];
    console.log("ver", JSON.stringify(report.ver));
    if (!report.ver.match || !report.ver.visible) fails.push("version label does not match the bundle hash");
    await shot(`${TAG}C_panel_version.png`);
    await hideUI();
  }

  if (want("agama")) {
    const pick = await page.evaluate(() => {
      const q = window.__desQA(), L = q.AG.list; window.__set({weather: "sun", ct: "clear", wind: .3}); q.tod("day");
      let a = null; for (let i = 0; i < 120 && !a; i++) { q.sim(3); a = L.find(o => o.mode === "bask" && !o.palm) || (i > 80 && L.find(o => o.mode === "bask")); }
      window.__ag = L.indexOf(a); return a ? {i: L.indexOf(a), male: a.male, palm: !!a.palm, mode: a.mode} : null;
    });
    report.agama = pick;
    if (!pick) fails.push("agama never basked");
    else {
      await page.evaluate(() => { const q = window.__desQA(), C = window.__C(), a = q.AG.list[window.__ag];
        a.g.updateMatrixWorld(true); const p = a.g.getWorldPosition(C.De.position.clone()); q.W.worldToLocal(p);
        const b = (a.yaw || 0) + Math.PI / 2; let e = null;
        for (const off of [0, .35, -.35, .7, -.7, Math.PI, Math.PI + .5, Math.PI - .5]) for (const u of [.16, .26, .4]) { if (e) break;
          const ex = p.x + Math.sin(b + off) * .62, ez = p.z + Math.cos(b + off) * .62, ey = p.y + u; let ok = true;
          for (let s = .05; s < 1; s += .05) { const x = ex + (p.x - ex) * s, z = ez + (p.z - ez) * s, y = ey + (p.y + .03 - ey) * s; if (y < q.hTop(x, z) + .025) { ok = false; break; } }
          if (ok) e = [ex, ey, ez]; }
        e = e || [p.x + Math.sin(b) * .62, p.y + .5, p.z + Math.cos(b) * .62];
        q.lookAt(e[0], e[1], e[2], p.x, p.y + .025, p.z); C.De.fov = 30; C.De.near = .02; C.De.updateProjectionMatrix(); });
      await cap("西奈飞蜥：晴天在沙上晒太阳（本轮未改动）"); await shot(`${TAG}D_agama_bask.png`); await cap("");
    }
  }
  report.ostrich = [...osReq];
} catch (e) { console.log("ERR", e.stack || e); fails.push(String(e)); }
report.fails = fails;
fs.writeFileSync(path.join(OUT, `${TAG}d164-report.json`), JSON.stringify(report, null, 1));
console.log("report", JSON.stringify(report));
clearTimeout(killer);
await browser.close(); server.close();
process.exit(fails.length ? 1 : 0);
