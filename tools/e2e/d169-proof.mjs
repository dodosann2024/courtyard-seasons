// Desert d169 proofs: the rack cross-bar (rackBar), on any checkout (DIR, default this one; assets are committed, nothing is built).
// Not part of CI. Cameras are the d166 constants in the rack's own frame, so #164, main and this branch are shot from the same eye,
// at the same end and side of the bar.
//   shots  close-up day/dusk (camera `bar`, right post side, windward face), right end, knot close-up day/dusk
//          (WIRE=1 draws the bar's own edges over it; MOBUA=1 uses the iPhone user agent, i.e. the phone meshes)
//   tris   triangle counts of every wooden part and the campfire stones, desktop and phone (iPhone user agent)
//   geo    fingerprint of every wooden part's and stone's vertex data, desktop and phone (only rackBar may differ from main)
//   ver    the scene panel open, with its 「版本 xxxxxx」 label
//   pair   (no browser) OUT/main_<shot>.png | OUT/new_<shot>.png  -> <shot>_before_after.png
//   triple (no browser) OUT/d164_<shot>.png | OUT/main_<shot>.png | OUT/new_<shot>.png  -> <shot>_triple.png
//   pairP  (no browser) OUT/mainP_<shot>.png | OUT/newP_<shot>.png (shots taken with MOBUA=1) -> <shot>_phonemesh_before_after.png,
//          labelled with the phone rackBar's triangles (TRIS_MAIN, TRIS_NEW)
// Usage: node tools/e2e/d169-proof.mjs [shots|tris|geo|ver|pair|triple|pairP]   (OUT=/tmp/d169 DIR=<checkout> TAG=<file prefix> ONLY=<shot,...>)
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {execFile} from "node:child_process";
import puppeteer from "puppeteer-core";
const ffmpeg = args => new Promise((res, rej) => execFile("ffmpeg", ["-y", "-loglevel", "error", ...args], {maxBuffer: 1e8}, (e, _o, se) => e ? rej(new Error(String(se).slice(-500))) : res()));

const ROOT = path.resolve(process.env.DIR || path.join(path.dirname(fileURLToPath(import.meta.url)), "../.."));
const OUT = process.env.OUT || "/tmp/d169";
const CHROME = process.env.CHROME || ["/usr/bin/google-chrome-stable", "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/local/bin/google-chrome"].find(p => fs.existsSync(p));
const WHICH = process.argv[2] || "all";
const W = +(process.env.W || 1280), H = +(process.env.H || 720);
const TAG = process.env.TAG || "";
const want = k => WHICH === "all" || WHICH === k || WHICH.split(",").includes(k);
fs.mkdirSync(OUT, {recursive: true});
const FONT = "/usr/share/fonts/truetype/wqy/wqy-microhei.ttc";
const lab = t => `drawtext=fontfile=${FONT}:text='${t}':x=14:y=12:fontsize=26:fontcolor=white:borderw=2:bordercolor=black`;

if (WHICH === "pair" || WHICH === "triple" || WHICH === "pairP") {
  const tm = (+(process.env.TRIS_MAIN || 3360)).toLocaleString("en"), tn = (+(process.env.TRIS_NEW || 3360)).toLocaleString("en");
  const cols = WHICH === "pair" ? [["main", "修改前（main，#168，desert.3eef4c54ac.js）"], ["new", "修改后（本分支，d169）"]]
    : WHICH === "pairP" ? [["mainP", `修改前（main，#168）手机网格 ${tm} 面`], ["newP", `修改后（本分支，d169）手机网格 ${tn} 面`]]
    : [["d164", "#164（desert.f1b14a2f7f.js，约 6.7 万面）"], ["main", "#168 / main（desert.3eef4c54ac.js）"], ["new", "本分支（d169）"]];
  const sc = WHICH === "triple" ? 640 : 960, pre = cols[1][0] + "_";
  for (const f of fs.readdirSync(OUT).filter(f => f.startsWith(pre) && f.endsWith(".png"))) {
    const n = f.slice(pre.length, -4), ins = cols.map(([k]) => path.join(OUT, `${k}_${n}.png`));
    if (!ins.every(p => fs.existsSync(p))) { console.log("skip", n); continue; }
    const fc = cols.map(([, t], i) => `[${i}:v]scale=${sc}:-2,${lab(t)}[c${i}]`).join(";") + ";" + cols.map((_, i) => `[c${i}]`).join("") + `hstack=inputs=${cols.length}`;
    await ffmpeg([...ins.flatMap(p => ["-i", p]), "-filter_complex", fc, path.join(OUT, `${n}_${{pair: "before_after", pairP: "phonemesh_before_after", triple: "triple"}[WHICH]}.png`)]);
    console.log(WHICH, n);
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
const killer = setTimeout(() => { console.log("TIMEOUT: killing the browser"); try { browser.process().kill("SIGKILL"); } catch (_) {} process.exit(3); }, +(process.env.LIMIT || 590) * 1000);

const HIDE = [".t", "#fab", "#sbtn", "#tp", "#ld"];
const osReq = new Set();
async function open(mobile, tall) {
  const page = await browser.newPage();
  page.on("request", r => { const m = /\/(ostrich_v2[a-z0-9]+)\.glb/.exec(r.url());
    const i = r.initiator(), pre = i && i.stack && i.stack.callFrames.some(f => f.functionName === "desPre"); if (m && !pre) osReq.add(m[1]); });
  page.on("console", m => { const t = m.type(); if (t === "error" || t === "warning") console.log("PAGE", t, m.text().slice(0, 240)); });
  page.on("pageerror", e => console.log("PAGEERR", String(e).slice(0, 300)));
  if (mobile || process.env.MOBUA) await page.setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1");
  await page.setViewport({width: mobile ? 390 : W, height: mobile ? (tall ? 844 : 664) : H, deviceScaleFactor: 1});
  await page.goto(ORIGIN + "/desert/?nosw=1&debug=1", {waitUntil: "domcontentloaded", timeout: 120000});
  await page.waitForFunction(() => window.__ready && window.__desReady && window.__desQA && window.__desQA().ready, {timeout: 300000, polling: 500});
  return page;
}

/* every wooden part: by name where the build names them, else picked out by shape (#164: plain cylinders) */
const countTris = page => page.evaluate(() => {
  const q = window.__desQA(), out = {}, tri = g => (g.index ? g.index.count : g.attributes.position.count) / 3;
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
  /* campfire stones: instanced, so triangles × instances (main: the shared boulder shapes in the #4e463f stone material) */
  const st = {};
  q.W.traverse(m => { if (!m.isInstancedMesh) return; const ours = /^fireStone/.test(m.name), old = !m.name && m.material.color && m.material.color.getHexString() === "4e463f";
    if (!ours && !old) return; const k = ours ? m.name : "fireStoneOld" + Object.keys(st).length; st[k] = {trisEach: tri(m.geometry), n: m.count, tris: tri(m.geometry) * m.count}; });
  for (const [g, re] of Object.entries(groups)) sum[g] = Object.entries(out).filter(([k]) => re.test(k)).reduce((a, [, v]) => a + v, 0);
  sum.allWood = Object.values(out).reduce((a, v) => a + v, 0);
  return {parts: out, groups: sum, stones: st, stonesTotal: Object.values(st).reduce((a, v) => a + v.tris, 0), mob: /Mobi|iPhone|Android/i.test(navigator.userAgent)};
});

/* cameras in a prop's own frame. rack: x along the bar (+x = the right post), y up from the sand under the rack, z toward the
   tent's front (the bar's windward side). fire: x = tent's right, y up from the sand at the fire, z away from the tent */
const CAMS = {
  bar: ["rack", [.86, 1.97, .56], [1.4, 1.8, 0], 30],
  barEnd: ["rack", [2.2, 1.97, .5], [1.74, 1.81, 0], 28],
  barKnot: ["rack", [.98, 1.93, .3], [1.12, 1.81, 0], 22],
  flog: ["fire", [.75, 1.05, -.55], [.15, .18, 1.45], 42],
  wclose: ["fire", [-.4, .5, -.95], [-.93, .08, -1.6], 34],
  wall: ["fire", [-3.6, 2.6, 4.6], [3.2, .6, -2.2], 52],
  flogEnd: ["fire", [-1.3, .42, 1.95], [.19, .1, 1.61], 30],
  stones: ["fire", [.62, .5, .78], [-.05, .02, .05], 40],
  sfMid: ["world", [36, 1.5, 25], [7, -7.5, 4.5], 38],
  sfFull: ["world", [84, -6, 60], [2, -16, 0], 40],
  sfPhone: ["world", [74, -8, 54], [2, -17, 0], 62],
  ...JSON.parse(process.env.CAMS || "{}")};
const SHOTS = [
  ["R_bar_close_day", "day", "bar", "横梁特写（右支杆一侧，迎风面），白天"],
  ["R_bar_close_dusk", "dusk", "bar", "横梁特写（同一机位），黄昏"],
  ["R_bar_end_day", "day", "barEnd", "横梁右端头特写，白天"],
  ["R_bar_knot_day", "day", "barKnot", "节疤近景（看节疤周围的网格是否有台阶），白天"],
  ["R_bar_knot_dusk", "dusk", "barKnot", "节疤近景（同一机位），黄昏"],
  ["F_logs_close_day", "day", "flog", "篝火旁坐木特写，白天"],
  ["F_logs_close_dusk", "dusk", "flog", "篝火旁坐木特写，黄昏（篝火点着）"],
  ["W_wood_close_day", "day", "wclose", "柴堆特写，白天"],
  ["F_logs_end_day", "day", "flogEnd", "坐木端头正视（看截面形状），白天"],
  ["F_stones_close_day", "day", "stones", "篝火石圈特写，白天"],
  ["F_stones_close_dusk", "dusk", "stones", "篝火石圈特写（同一机位），黄昏（篝火点着）"],
  ["S_sandfall_bottom_day", "day", "sfFull", "沙流底部（岛底全景），白天"],
  ["S_sandfall_bottom_dusk", "dusk", "sfFull", "沙流底部（同一机位），黄昏"],
  ["S_sandfall_mid_day", "day", "sfMid", "沙流中景：每股沙流下端，白天"],
  ["W_wood_all_mid", "day", "wall", "中景：场景里所有木头（晾毯架、坐木、柴堆、篝火里的柴）"]];

const fails = [];
const report = {cams: CAMS};
try {
  if (want("tris")) {
    for (const mob of [false, true]) {
      const p = await open(mob);
      report[mob ? "trisMobile" : "trisDesktop"] = await countTris(p);
      console.log(mob ? "mobile" : "desktop", JSON.stringify(report[mob ? "trisMobile" : "trisDesktop"]));
      await p.close();
    }
  }
  /* geo: a fingerprint of every wooden part's vertex data (position, colour, weathering attributes) and of the campfire stones,
     desktop and phone; main and this branch must agree on every part but rackBar */
  if (want("geo")) {
    for (const mob of [false, true]) {
      const p = await open(mob);
      report[mob ? "geoMobile" : "geoDesktop"] = await p.evaluate(() => {
        const out = {}, h = g => { let a = 0, b = 0; for (const k of ["position", "color", "aW", "aB"]) { const A = g.attributes[k]; if (!A) continue;
          const v = A.array; for (let i = 0; i < v.length; i++) { a = (a + Math.round(v[i] * 1e5) * (i % 97 + 1)) % 2147483647; b = (b * 31 + Math.round(v[i] * 1e5)) % 2147483647; } }
          return a.toString(16) + "." + b.toString(16) + "." + (g.index ? g.index.count : 0); };
        window.__desQA().W.traverse(m => { if (m.isMesh && /^(rack|fire)(Bar|Post|Fork|Seat|Wood|Log|Stone)/.test(m.name)) out[m.name] = h(m.geometry); });
        return out; });
      await p.close();
    }
  }
  if (want("shots") || want("ver")) {
    const page = await open(false);
    await page.evaluate(HIDE => {
      document.body.classList.add("col", "snc");
      for (const s of HIDE) { const n = document.querySelector(s); if (n) n.style.display = "none"; }
    }, HIDE);
    await page.evaluate(() => { const q = window.__desQA(), C = window.__C(); q.freeze(true); q.tod("day"); window.__set({weather: "sun", ct: "clear", wind: .3}); C.Ce.enabled = false; q.sim(2); });
    const frames = async n => page.evaluate(n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
    async function shot(name) { await frames(3); await sleep(80); const f = path.join(OUT, name); await page.screenshot({path: f, type: "png"}); console.log("shot", f); return f; }
    const cap = text => page.evaluate(text => {
      let d = document.getElementById("d169cap");
      if (!text) { if (d) d.remove(); return; }
      if (!d) { d = document.createElement("div"); d.id = "d169cap"; document.body.appendChild(d); }
      d.textContent = text;
      d.style.cssText = "position:fixed;left:18px;bottom:16px;z-index:50;pointer-events:none;font:600 20px 'WenQuanYi Micro Hei','Droid Sans Fallback',sans-serif;color:#fff;letter-spacing:.02em;text-shadow:0 1px 2px #000,0 0 4px #000";
    }, text || "");
    const tod = k => page.evaluate(k => { const q = window.__desQA(); window.__set({mode: "manual"}); q.tod(k === "dusk" ? "sunset" : k); q.sim(1.5); }, k);
    const cam = (fr, eye, at, fov) => page.evaluate((fr, eye, at, fov) => {
      const q = window.__desQA(), C = window.__C();
      let o, yaw;
      if (fr === "world") { q.lookAt(...eye, ...at); C.De.fov = fov; C.De.near = .15; C.De.updateProjectionMatrix(); C.De.updateMatrixWorld(true); return; }
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

    /* WIRE=1: the bar's own edges drawn over it (a black wireframe copy, a hair larger), to show how its loops run */
    /* EVAL: a debug snippet run in the page before the shots (not used for the proofs) */
    if (process.env.EVAL) await page.evaluate(process.env.EVAL);
    if (process.env.WIRE) await page.evaluate(() => { const b = window.__desQA().RACK.g.getObjectByName("rackBar"), w = b.clone(), m = b.material.clone();
      m.onBeforeCompile = () => {}; m.vertexColors = false; m.wireframe = true; m.color.set(0); m.emissive.set(0); m.roughness = 1; m.metalness = 0;
      w.material = m; w.castShadow = w.receiveShadow = false; w.scale.set(1, 1.012, 1.012); w.name = "rackBarWire"; b.parent.add(w); });
    if (want("shots")) {
      for (const [n, k, v, t] of SHOTS.filter(s => !process.env.ONLY || process.env.ONLY.split(",").includes(s[0]))) {
        await page.evaluate(() => { window.__set({weather: "sun", ct: "clear", wind: .4}); window.__desQA().sim(3); });
        await tod(k); await cam(...CAMS[v]);
        if (CAMS[v][0] !== "world") { report["os_" + n] = await osOut(); await cam(...CAMS[v]); }
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
  if (want("phone")) {
    const page = await open(true, true);
    await page.evaluate(HIDE => { document.body.classList.add("col", "snc"); for (const s of HIDE) { const n = document.querySelector(s); if (n) n.style.display = "none"; } }, HIDE);
    for (const k of ["day", "dusk"]) {
      await page.evaluate(k => { const q = window.__desQA(), C = window.__C(); q.freeze(true); window.__set({mode: "manual", weather: "sun", ct: "clear", wind: .4}); C.Ce.enabled = false;
        q.tod(k === "dusk" ? "sunset" : k); q.sim(3);
        const v = [74, -8, 54, 2, -17, 0]; q.lookAt(...v); C.De.fov = 62; C.De.near = .15; C.De.updateProjectionMatrix(); }, k);
      await page.evaluate(() => new Promise(r => { let n = 0; const f = () => (++n >= 4 ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }));
      await page.evaluate(t => { const d = document.createElement("div"); d.id = "d169cap"; d.textContent = t;
        d.style.cssText = "position:fixed;left:12px;bottom:14px;right:12px;z-index:50;pointer-events:none;font:600 17px 'WenQuanYi Micro Hei',sans-serif;color:#fff;text-shadow:0 1px 2px #000,0 0 4px #000"; document.body.appendChild(d); },
        k === "day" ? "手机竖屏 390×844：岛底沙流，白天" : "手机竖屏 390×844：岛底沙流，黄昏");
      await sleep(80); await page.screenshot({path: path.join(OUT, `${TAG}S_sandfall_phone_${k}.png`), type: "png"});
      await page.evaluate(() => document.getElementById("d169cap").remove());
    }
    await page.close();
  }
  if (want("spread")) {
    /* per stream at the bottom of its fall (free-fall fraction fb = 1), from the strip data and this build's own vertex shader terms:
       half-width across the stream (lip vs bottom), sideways drift of the whole stream, and how far it has moved out from the cliff */
    const page = await open(false);
    report.spread = await page.evaluate(old => { const q = window.__desQA(); window.__set({mode: "manual", weather: "sun", ct: "clear", wind: .4}); q.sim(3);
      const U = q.sfU, sf = q.sf(), wm = U.uWM.value.length();
      return {n: sf.n, oldShader: old, wm, F: sf.F.map(f => { const P = f.path, hw = f.hw, d0 = P[0][0], dB = P[P.length - 1][0];
        const bottomHalf = old ? .94 * (2.3 * hw + .6) : .82 * hw * .65, side = old ? wm * 1.3 + .45 : 0;
        return {hw: +hw.toFixed(3), lipHalf: +hw.toFixed(3), bottomHalf: +bottomHalf.toFixed(3), sideDrift: +side.toFixed(3), outward: +(dB - d0).toFixed(3),
          maxSpread: +(bottomHalf - hw + side).toFixed(3)}; })}; }, /^main|^d164/.test(TAG));
    const F = report.spread.F; report.spread.maxSpreadAll = Math.max(...F.map(f => f.maxSpread)); report.spread.maxOutward = Math.max(...F.map(f => f.outward));
    console.log("spread", report.spread.n, report.spread.maxSpreadAll, report.spread.maxOutward);
    await page.close();
  }
  report.ostrich = [...osReq];
} catch (e) { console.log("ERR", e.stack || e); fails.push(String(e)); }
report.fails = fails;
fs.writeFileSync(path.join(OUT, `${TAG}d169-report.json`), JSON.stringify(report, null, 1));
console.log("report", JSON.stringify(report));
clearTimeout(killer);
await browser.close(); server.close();
process.exit(fails.length ? 1 : 0);
