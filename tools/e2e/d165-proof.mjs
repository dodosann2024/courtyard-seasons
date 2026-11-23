// Desert d165 proofs, on any checkout (DIR, default this one; assets are committed, nothing is built). Not part of CI.
//   shots  the drying rack (mid + close, day and dusk), the cross-bar close-up, the campfire logs (day, and dusk with the fire lit)
//          and a mid shot of all the wood together
//   tris   triangle counts of every wooden part, desktop and phone (iPhone user agent, so the scene builds its mobile meshes)
//   ver    the scene panel open, with its 「版本 xxxxxx」 label
//   pair   (no browser) before/after strips from OUT/main_*.png and OUT/new_*.png
// Usage: node tools/e2e/d165-proof.mjs [shots|tris|ver|pair|all]   (OUT=/tmp/d165 DIR=<checkout> TAG=<file prefix> ONLY=<shot,...>)
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {execFile} from "node:child_process";
import puppeteer from "puppeteer-core";
const ffmpeg = args => new Promise((res, rej) => execFile("ffmpeg", ["-y", "-loglevel", "error", ...args], {maxBuffer: 1e8}, (e, _o, se) => e ? rej(new Error(String(se).slice(-500))) : res()));

const ROOT = path.resolve(process.env.DIR || path.join(path.dirname(fileURLToPath(import.meta.url)), "../.."));
const OUT = process.env.OUT || "/tmp/d165";
const CHROME = process.env.CHROME || ["/usr/bin/google-chrome-stable", "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/local/bin/google-chrome"].find(p => fs.existsSync(p));
const WHICH = process.argv[2] || "all";
const W = +(process.env.W || 1280), H = +(process.env.H || 720);
const TAG = process.env.TAG || "";
const want = k => WHICH === "all" || WHICH === k || WHICH.split(",").includes(k);
fs.mkdirSync(OUT, {recursive: true});
const FONT = "/usr/share/fonts/truetype/wqy/wqy-microhei.ttc";

if (WHICH === "pair") {
  const lab = t => `drawtext=fontfile=${FONT}:text='${t}':x=14:y=12:fontsize=28:fontcolor=white:borderw=2:bordercolor=black`;
  for (const f of fs.readdirSync(OUT).filter(f => /^main_.*\.png$/.test(f))) {
    const n = f.slice(5, -4), a = path.join(OUT, f), b = path.join(OUT, `new_${n}.png`);
    if (!fs.existsSync(b)) { console.log("skip", n); continue; }
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
const osReq = new Set();
async function open(mobile) {
  const page = await browser.newPage();
  page.on("request", r => { const m = /\/(ostrich_v2[a-z0-9]+)\.glb/.exec(r.url());
    const i = r.initiator(), pre = i && i.stack && i.stack.callFrames.some(f => f.functionName === "desPre"); if (m && !pre) osReq.add(m[1]); });
  page.on("console", m => { const t = m.type(); if (t === "error" || t === "warning") console.log("PAGE", t, m.text().slice(0, 240)); });
  page.on("pageerror", e => console.log("PAGEERR", String(e).slice(0, 300)));
  if (mobile) await page.setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1");
  await page.setViewport({width: mobile ? 390 : W, height: mobile ? 664 : H, deviceScaleFactor: 1});
  await page.goto(ORIGIN + "/desert/?nosw=1&debug=1", {waitUntil: "domcontentloaded", timeout: 120000});
  await page.waitForFunction(() => window.__ready && window.__desReady && window.__desQA && window.__desQA().ready, {timeout: 300000, polling: 500});
  return page;
}

/* every wooden part: by name where the build names them, else picked out by shape (main: plain cylinders) */
const countTris = page => page.evaluate(() => {
  const q = window.__desQA(), C = window.__C(), out = {}, tri = g => (g.index ? g.index.count : g.attributes.position.count) / 3;
  const add = (k, m) => { out[k] = (out[k] || 0) + tri(m.geometry); };
  const named = [];
  q.W.traverse(m => { if (m.isMesh && /^(rack|fire)(Bar|Post|Fork|Seat|Wood|Log)/.test(m.name)) named.push(m); });
  if (named.some(m => /^rackPost/.test(m.name))) for (const m of named) add(m.name, m);
  else {
    const R = q.RACK.g, rc = R.children.filter(m => m.isMesh && m.geometry.type === "CylinderGeometry"), bar = R.getObjectByName("rackBar");
    if (bar) add("rackBar", bar);
    let p = 0, f = 0;
    for (const m of rc) { if (m.geometry.parameters.height > 1) add("rackPost" + p++, m); else add("rackFork" + f++, m); }
    let s = 0, w = 0, l = 0;
    q.W.traverse(m => { if (!m.isMesh || m.geometry.type !== "CylinderGeometry" || m.parent === R) return;
      const P = m.geometry.parameters;
      if (P.radialSegments === 48) add("fireSeat" + s++, m); else if (P.radialSegments === 20) add("fireWood" + w++, m); else if (P.radialSegments === 9) add("fireLog" + l++, m); });
  }
  const groups = {rackBar: /^rackBar/, rackPosts: /^rackPost/, rackForks: /^rackFork/, fireSeats: /^fireSeat/, fireWood: /^fireWood/, fireLogs: /^fireLog/}, sum = {};
  for (const [g, re] of Object.entries(groups)) sum[g] = Object.entries(out).filter(([k]) => re.test(k)).reduce((a, [, v]) => a + v, 0);
  sum.allWood = Object.values(out).reduce((a, v) => a + v, 0);
  return {parts: out, groups: sum, mob: /Mobi|iPhone|Android/i.test(navigator.userAgent), rendererTris: C.Ue && C.Ue.info ? C.Ue.info.render.triangles : null};
});

const fails = [];
const report = {};
try {
  if (want("tris")) {
    for (const mob of [false, true]) {
      const p = await open(mob);
      report[mob ? "trisMobile" : "trisDesktop"] = await countTris(p);
      console.log(mob ? "mobile" : "desktop", JSON.stringify(report[mob ? "trisMobile" : "trisDesktop"]));
      await p.close();
    }
  }
  if (want("shots") || want("ver")) {
    const page = await open(false);
    const hideUI = () => page.evaluate(HIDE => {
      document.body.classList.add("col", "snc");
      for (const s of HIDE) { const n = document.querySelector(s); if (n) n.style.display = "none"; }
    }, HIDE);
    await hideUI();
    await page.evaluate(() => { const q = window.__desQA(), C = window.__C(); q.freeze(true); q.tod("day"); window.__set({weather: "sun", ct: "clear", wind: .3}); C.Ce.enabled = false; q.sim(2); });
    const frames = async n => page.evaluate(n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
    async function shot(name) { await frames(3); await sleep(80); const f = path.join(OUT, name); await page.screenshot({path: f, type: "png"}); console.log("shot", f); return f; }
    const cap = text => page.evaluate(text => {
      let d = document.getElementById("d165cap");
      if (!text) { if (d) d.remove(); return; }
      if (!d) { d = document.createElement("div"); d.id = "d165cap"; document.body.appendChild(d); }
      d.textContent = text;
      d.style.cssText = "position:fixed;left:18px;bottom:16px;z-index:50;pointer-events:none;font:600 20px 'WenQuanYi Micro Hei','Droid Sans Fallback',sans-serif;color:#fff;letter-spacing:.02em;text-shadow:0 1px 2px #000,0 0 4px #000";
    }, text || "");
    const tod = k => page.evaluate(k => { const q = window.__desQA(); window.__set({mode: "manual"}); q.tod(k === "dusk" ? "sunset" : k); q.sim(1.5); }, k);
    /* cameras in a prop's own frame. rack: x along the bar, y up from the sand under the rack, z toward the tent's front.
       fire: x to the right when facing away from the tent, y up from the sand at the fire, z away from the tent */
    const cam = (fr, eye, at, fov) => page.evaluate((fr, eye, at, fov) => {
      const q = window.__desQA(), C = window.__C();
      let o, yaw;
      if (fr === "rack") { o = q.RACK; yaw = q.RACK.yaw; } else { o = q.FIRE; yaw = q.TENT.yaw; }
      const c = Math.cos(yaw), s = Math.sin(yaw), y0 = q.hTop(o.x, o.z);
      const w = v => [o.x + v[0] * c + v[2] * s, y0 + v[1], o.z - v[0] * s + v[2] * c], e = w(eye), t = w(at);
      q.lookAt(e[0], e[1], e[2], t[0], t[1], t[2]); C.De.fov = fov; C.De.near = .05; C.De.updateProjectionMatrix(); C.De.updateMatrixWorld(true);
    }, fr, eye, at, fov);
    /* ostriches go to open sand out of frame (their model and behaviour untouched) */
    const osOut = () => page.evaluate(() => { const q = window.__desQA(), C = window.__C(), T = q.TENT;
      const inFrame = (x, z) => { const g = q.hTop(x, z); for (const ox of [-.8, .8]) for (const oz of [-.8, .8]) for (const y of [g, g + 2.5]) { const p = q.toW(x + ox, y, z + oz); p.project(C.De);
        if (p.z < 1 && Math.abs(p.x) < 1.3 && Math.abs(p.y) < 1.3) return true; } return false; };
      const out = []; for (let x = -40; x <= 40; x += 2) for (let z = -40; z <= 40; z += 2) if (q.sN(x, z) < .8 && Math.hypot(x - T.x, z - T.z) > 10 && !inFrame(x, z)) out.push({x, z});
      q.PA.os.forEach((o, i) => { const p = out[(i * 37) % out.length]; q.osPlace(o, p.x, p.z, 0); o.mode = "graze"; o.t = 20; o.path = null; });
      q.sim(.5, 1 / 24); return q.PA.os.filter(o => inFrame(o.x, o.z)).length; });

    if (want("shots")) {
      const V = JSON.parse(process.env.CAMS || "{}");
      const RMID = V.rmid || ["rack", [-3.2, 2.3, 7.6], [-1.2, 1.2, -.6], 40];
      const RCLOSE = V.rclose || ["rack", [-1.02, 2.0, .8], [-1.6, 1.74, 0], 30];
      const BAR = V.bar || ["rack", [.86, 1.97, .56], [1.4, 1.8, 0], 30];
      const FLOG = V.flog || ["fire", [.75, 1.05, -.55], [.15, .18, 1.45], 42];
      const WALL = V.wall || ["fire", [-3.6, 2.6, 4.6], [3.2, .6, -2.2], 52];
      const set = [["R_rack_mid_day", "day", RMID, "中景：晾毯架整体（支杆、叉头、横梁），白天"],
        ["R_rack_mid_dusk", "dusk", RMID, "中景：晾毯架整体，黄昏"],
        ["R_rack_close_day", "day", RCLOSE, "特写：支杆叉头托着横梁（叉口积沙、横梁下侧积沙），白天"],
        ["R_rack_close_dusk", "dusk", RCLOSE, "特写：支杆叉头托着横梁，黄昏"],
        ["R_bar_close_day", "day", BAR, "横梁特写（减面前后对比），白天"],
        ["F_logs_close_day", "day", FLOG, "篝火旁坐木特写，白天"],
        ["F_logs_close_dusk", "dusk", FLOG, "篝火旁坐木特写，黄昏（篝火点着）"],
        ["W_wood_all_mid", "day", WALL, "中景：场景里所有木头（晾毯架、坐木、柴堆、篝火里的柴）"]];
      for (const [n, k, v, t] of set.filter(s => !process.env.ONLY || process.env.ONLY.split(",").includes(s[0]))) {
        await page.evaluate(() => { window.__set({weather: "sun", ct: "clear", wind: .4}); window.__desQA().sim(3); });
        await tod(k); await cam(...v);
        report["os_" + n] = await osOut(); await cam(...v);
        await cap(t); await shot(`${TAG}${n}.png`);
      }
      await cap("");
    }

    if (want("ver")) {
      await page.evaluate(() => { window.__set({weather: "sun", ct: "clear", wind: .3}); window.__desQA().sim(2); }); await tod("day");
      await page.evaluate(() => { document.body.classList.remove("col"); for (const s of ["#fab", "#sbtn", "#tp"]) { const n = document.querySelector(s); if (n) n.style.display = ""; } });
      await page.evaluate(() => { const q = window.__desQA(); q.lookAt(-4.16, 11.13, 19.58, 0, 0, 0); });
      await sleep(2500); await page.evaluate(() => { const v = document.getElementById("ver"); if (v) v.scrollIntoView({block: "center"}); }); await sleep(800); await frames(4);
      report.ver = await page.evaluate(() => { const v = document.getElementById("ver"), r = v && v.getBoundingClientRect(); return {text: v && v.textContent, bundle: window.CY && window.CY.desert, visible: !!r && r.width > 0 && r.bottom > 0 && r.top < innerHeight}; });
      const m = /desert\.(\w{6})/.exec(report.ver.bundle || "");
      report.ver.match = !!m && report.ver.text === "版本 " + m[1];
      console.log("ver", JSON.stringify(report.ver));
      if (!report.ver.match || !report.ver.visible) fails.push("version label does not match the bundle hash");
      await shot(`${TAG}C_panel_version.png`);
      const r = await page.evaluate(() => { const q = document.getElementById("ver").closest(".info").getBoundingClientRect(); return {x: q.x - 12, y: q.y - 8, width: q.width + 24, height: q.height + 16}; });
      await page.screenshot({path: path.join(OUT, `${TAG}C_panel_version_zoom.png`), clip: Object.assign(r, {scale: 3})});
    }
    await page.close();
  }
  report.ostrich = [...osReq];
} catch (e) { console.log("ERR", e.stack || e); fails.push(String(e)); }
report.fails = fails;
fs.writeFileSync(path.join(OUT, `${TAG}d165-report.json`), JSON.stringify(report, null, 1));
console.log("report", JSON.stringify(report));
clearTimeout(killer);
await browser.close(); server.close();
process.exit(fails.length ? 1 : 0);
