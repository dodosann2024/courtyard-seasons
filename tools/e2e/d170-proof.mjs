// Desert d170 proofs (audit round: wind-blown sand, dunes, rain at eye level, Sinai agama), on any checkout (DIR, default this one;
// assets are committed, nothing is built). Not part of CI.
//   shots   stills for the before/after pairs (run once with DIR=<main checkout> TAG=main_, once here with TAG=new_)
//   wdir    clip: strong wind, its heading swung three times (crest and flat sand)
//   wstr    clip: the same patch of sand at wind 0.15, 0.5 and 1.0
//   dune    clip: time-lapse of the dune under a wind pinned oblique to its crest, then swung to the other side
//   rain    clips: eye height at the sand, the tent and the lake: dry, heavy rain, then drying (time-lapse)
//   agama   clips: basking, climbing a date palm, sheltering in the crown in rain, back down after it
//   geo     fingerprint of the rack / campfire wood and stone meshes (must equal main)
//   ver     the scene panel open, with its 「版本 xxxxxx」 label
//   pair    (no browser) OUT/main_<shot>.png | OUT/new_<shot>.png -> <shot>_before_after.png
// Usage: node tools/e2e/d170-proof.mjs [shots|wdir|wstr|dune|rain|agama|geo|ver|pair]   (OUT=/tmp/d170/out DIR=<checkout> TAG=<prefix>)
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {execFile} from "node:child_process";
import puppeteer from "puppeteer-core";
const ffmpeg = args => new Promise((res, rej) => execFile("ffmpeg", ["-y", "-loglevel", "error", ...args], {maxBuffer: 1e8}, (e, _o, se) => e ? rej(new Error(String(se).slice(-500))) : res()));

const ROOT = path.resolve(process.env.DIR || path.join(path.dirname(fileURLToPath(import.meta.url)), "../.."));
const OUT = process.env.OUT || "/tmp/d170/out";
const CHROME = process.env.CHROME || ["/usr/bin/google-chrome-stable", "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/local/bin/google-chrome"].find(p => fs.existsSync(p));
const WHICH = process.argv[2] || "shots";
const W = +(process.env.W || 1280), H = +(process.env.H || 720);
const TAG = process.env.TAG || "";
const want = k => WHICH === k || WHICH.split(",").includes(k);
fs.mkdirSync(OUT, {recursive: true});
const FONT = "/usr/share/fonts/truetype/wqy/wqy-microhei.ttc";
const lab = t => `drawtext=fontfile=${FONT}:text='${t}':x=14:y=12:fontsize=26:fontcolor=white:borderw=2:bordercolor=black`;

if (WHICH === "pair") {
  const cols = [["main", "修改前（main，desert.c064423117.js）"], ["new", "修改后（本分支，d170）"]];
  for (const f of fs.readdirSync(OUT).filter(f => f.startsWith("new_") && f.endsWith(".png"))) {
    const n = f.slice(4, -4), ins = cols.map(([k]) => path.join(OUT, `${k}_${n}.png`));
    if (!ins.every(p => fs.existsSync(p))) { console.log("skip", n); continue; }
    const fc = cols.map(([, t], i) => `[${i}:v]scale=960:-2,${lab(t)}[c${i}]`).join(";") + ";[c0][c1]hstack=inputs=2";
    await ffmpeg([...ins.flatMap(p => ["-i", p]), "-filter_complex", fc, path.join(OUT, `${n}_before_after.png`)]);
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
const browser = await puppeteer.launch({executablePath: CHROME, headless: "new", protocolTimeout: 1800000,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader", "--mute-audio"]});
const killer = setTimeout(() => { console.log("TIMEOUT: killing the browser"); try { browser.process().kill("SIGKILL"); } catch (_) {} process.exit(3); }, +(process.env.LIMIT || 2400) * 1000);

const HIDE = [".t", "#fab", "#sbtn", "#tp", "#ld"];
const page = await browser.newPage();
page.on("console", m => { const t = m.type(); if (t === "error" || t === "warning") console.log("PAGE", t, m.text().slice(0, 240)); });
page.on("pageerror", e => console.log("PAGEERR", String(e).slice(0, 300)));
await page.setViewport({width: W, height: H, deviceScaleFactor: 1});
await page.goto(ORIGIN + "/desert/?nosw=1&debug=1", {waitUntil: "domcontentloaded", timeout: 120000});
await page.waitForFunction(() => window.__ready && window.__desReady && window.__desQA && window.__desQA().ready, {timeout: 600000, polling: 500});
const E = (f, ...a) => page.evaluate(f, ...a);
const frames = n => E(n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
async function shot(name) { await frames(3); await sleep(60); const f = path.join(OUT, name); await page.screenshot({path: f, type: "png"}); console.log("shot", f); return f; }
const cap = text => E(text => {
  let d = document.getElementById("d170cap");
  if (!text) { if (d) d.remove(); return; }
  if (!d) { d = document.createElement("div"); d.id = "d170cap"; document.body.appendChild(d); }
  d.textContent = text;
  d.style.cssText = "position:fixed;left:18px;bottom:16px;right:18px;z-index:50;pointer-events:none;font:600 20px 'WenQuanYi Micro Hei','Droid Sans Fallback',sans-serif;color:#fff;letter-spacing:.02em;text-shadow:0 1px 2px #000,0 0 4px #000";
}, text || "");
/* frames are rendered one at a time with the scene frozen, stepped 1/24 s (or `each` advances it further) between them */
async function vid(name, N, each, fps = 12) {
  const dir = path.join(OUT, name + "-frames");
  fs.rmSync(dir, {recursive: true, force: true}); fs.mkdirSync(dir);
  const log = [];
  for (let i = 0; i < N; i++) { const s = await each(i); log.push(s); await frames(1); await page.screenshot({path: path.join(dir, String(i).padStart(4, "0") + ".png")}); }
  await ffmpeg(["-framerate", String(fps), "-i", path.join(dir, "%04d.png"), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", path.join(OUT, name + ".mp4")]);
  console.log("encoded", name, log.length);
  return {dir, log};
}
const frameAt = (dir, i) => path.join(dir, String(i).padStart(4, "0") + ".png");
const still = (dir, i, out) => ffmpeg(["-i", frameAt(dir, i), "-frames:v", "1", "-update", "1", path.join(OUT, out)]);
const strip = (files, out, w = 480) => ffmpeg([...files.flatMap(f => ["-i", f]), "-filter_complex",
  files.map((_, j) => `[${j}:v]scale=${w}:-2[s${j}]`).join(";") + ";" + files.map((_, j) => `[s${j}]`).join("") + `hstack=inputs=${files.length}`, path.join(OUT, out)]);

/* cameras, island metres. `q.step` after each move: the rain boxes, grains and wet shading follow the camera only when the scene ticks */
const CAM = {
  crest: `const [cx, cz] = q.dune.crestXZ(0), Y = .45, wx = Math.cos(Y), wz = -Math.sin(Y), px = cx - wz * 11 - wx * 2, pz = cz + wx * 11 - wz * 2;
    q.lookAt(px, q.hTop(px, pz) + 1.6, pz, cx, q.hTop(cx, cz) + .3, cz); C.De.fov = 50;`,
  flat: `const Y = .45, wx = Math.cos(Y), wz = -Math.sin(Y), x0 = 4, z0 = -9;
    q.lookAt(x0, q.hTop(x0, z0) + 1.6, z0, x0 + wx * 2 - wz * 8, q.hTop(x0, z0) + .2, z0 + wz * 2 + wx * 8); C.De.fov = 55;`,
  down: `const x0 = 12, z0 = 10; q.lookAt(x0, q.hTop(x0, z0 + 3) + 2.4, z0 + 3, x0, q.hTop(x0, z0), z0 - 1); C.De.fov = 55;`,
  sand: `const x = 9, z = 9; q.lookAt(x, q.hTop(x, z) + 1.6, z, x - 2, q.hTop(x, z) + .3, z - 6); C.De.fov = 55;`,
  tent: `const T = q.TENT, x = T.x - 1, z = T.z + 6.5; q.lookAt(x, q.hTop(x, z) + 1.6, z, T.x, q.hTop(T.x, T.z) + 1, T.z); C.De.fov = 55;`,
  lake: `const P = q.POND, [ex, ez] = q.pondEdge(-.6, 1.15); q.lookAt(ex, q.hTop(ex, ez) + 1.6, ez, P.x, P.wy, P.z); C.De.fov = 55;`,
  dune: `const D = q.dune.DUNE0, c = Math.cos(D.yaw), s = Math.sin(D.yaw), ex = D.x + 26 * s + 10 * c, ez = D.z + 26 * c - 10 * s;
    q.lookAt(ex, q.hTop(ex, ez) + 9, ez, D.x, q.hTop(D.x, D.z) * .6, D.z); C.De.fov = 46;`,
};
const cam = k => E(js => { const q = window.__desQA(), C = window.__C(); (new Function("q", "C", js))(q, C); C.De.near = .05; C.De.updateProjectionMatrix(); q.step(1, 1 / 30); }, CAM[k]);
/* ostriches to open sand out of frame (their model and behaviour untouched) */
const osOut = () => E(() => { const q = window.__desQA(), C = window.__C(), T = q.TENT;
  const inFrame = (x, z) => { const g = q.hTop(x, z); for (const ox of [-.8, .8]) for (const oz of [-.8, .8]) for (const y of [g, g + 2.5]) { const p = q.toW(x + ox, y, z + oz); p.project(C.De);
    if (p.z < 1 && Math.abs(p.x) < 1.3 && Math.abs(p.y) < 1.3) return true; } return false; };
  const out = []; for (let x = -40; x <= 40; x += 2) for (let z = -40; z <= 40; z += 2) if (q.sN(x, z) < .8 && Math.hypot(x - T.x, z - T.z) > 10 && !inFrame(x, z)) out.push({x, z});
  q.PA.os.forEach((o, i) => { const p = out[(i * 37) % out.length]; q.osPlace(o, p.x, p.z, 0); o.mode = "graze"; o.t = 99; o.path = null; });
  q.step(1, 1 / 30); return q.PA.os.filter(o => inFrame(o.x, o.z)).length; });
const set = (w, sec, dt) => E((w, sec, dt) => { window.__set(w); if (sec) window.__desQA().sim(sec, dt || .1); }, w, sec || 0, dt || .1);
const tick = (n, dt) => E((n, dt) => window.__desQA().step(n, dt), n || 1, dt || 1 / 24);

/* the camera on the lizard from d m off its side, up m above, moved round until the line to it clears the sand (d161) */
const AGCAM = `(d, up, fov, palmOut) => { const q = window.__desQA(), C = window.__C(), a = q.AG.list[window.__ag];
      a.g.updateMatrixWorld(true); const p = a.g.getWorldPosition(C.De.position.clone()); q.W.worldToLocal(p);
      let base; if (a.palm && palmOut) { base = Math.atan2(p.x - a.palm.x, p.z - a.palm.z); } else base = (a.yaw || 0) + Math.PI / 2;
      const clear = (ex, ey, ez) => { for (let s = .05; s < 1; s += .05) { const x = ex + (p.x - ex) * s, z = ez + (p.z - ez) * s, y = ey + (p.y + .03 - ey) * s; if (y < q.hTop(x, z) + .025) return false; } return true; };
      let best = null; for (const off of [0, .35, -.35, .7, -.7, Math.PI, Math.PI + .5, Math.PI - .5]) { for (const u of [up, up * 1.6, up * 2.4]) {
        const ex = p.x + Math.sin(base + off) * d, ez = p.z + Math.cos(base + off) * d, ey = p.y + u; if (clear(ex, ey, ez)) { best = [ex, ey, ez]; break; } } if (best) break; }
      if (!best) best = [p.x + Math.sin(base) * d, p.y + up * 3, p.z + Math.cos(base) * d];
      if (!window.__agFollow) window.__agEye = window.__agEye || best; else window.__agEye = best; const e = window.__agEye;
      q.lookAt(e[0], e[1], e[2], p.x, p.y + .025, p.z); C.De.fov = fov; C.De.near = .02; C.De.updateProjectionMatrix(); return {p: [p.x, p.y, p.z]}; }`;
const fails = [];
const report = {};
try {
  await E(HIDE => { document.body.classList.add("col", "snc"); for (const s of HIDE) { const n = document.querySelector(s); if (n) n.style.display = "none"; }
    const q = window.__desQA(), C = window.__C(); q.freeze(true); window.__set({mode: "manual"}); q.tod("day"); window.__set({weather: "sun", ct: "clear", wind: .4}); C.Ce.enabled = false; q.sim(5); }, HIDE);
  report.live = await E(() => window.CY && window.CY.desert);

  if (want("shots")) {
    /* wind: free heading (the scene's own), sim long enough for the gusts and saltation to settle */
    for (const [w, k] of [[.5, "crest"], [1, "crest"], [.5, "flat"], [1, "flat"]]) {
      await E(w => { const q = window.__desQA(); q.windPin(null); window.__set({weather: "sun", ct: "clear", wind: w}); q.sim(40, .1); }, w);
      await cam(k); await cap(`风力 ${w}：${k === "crest" ? "沙丘脊（人眼高度 1.6 米）" : "平沙地（人眼高度 1.6 米）"}`);
      await shot(`${TAG}W_${k}_w${String(w).replace(".", "")}.png`);
    }
    /* dune under a wind held 60° off its crest line for 40 min of scene time */
    await E(() => { const q = window.__desQA(), D = q.dune.DUNE0; q.windPin(D.yaw + 1.05); window.__set({weather: "sun", ct: "clear", wind: .8}); q.sim(2400, 1); });
    await cam("dune"); await cap("沙丘：斜向风（与脊线成 60°）持续 40 分钟后"); await shot(`${TAG}D_dune_oblique40min.png`);
    report.duneShape = await E(() => { const P = window.__desQA().dune.DP; return {cv: +P.cv.toFixed(3), sk: +P.sk.toFixed(3), x: +P.x.toFixed(2), z: +P.z.toFixed(2)}; });
    await E(() => { const q = window.__desQA(); q.windPin(null); window.__set({weather: "sun", ct: "clear", wind: .5}); q.sim(5); });
    /* rain at eye height: heavy rain, 90 s in */
    await set({weather: "hrain", ct: "overcast", wind: .5}, 90);
    for (const k of ["sand", "tent", "lake"]) {
      await cam(k); report["os_" + k] = await osOut(); await cam(k);
      await cap({sand: "大雨：沙地，人眼高度 1.6 米", tent: "大雨：帐篷，人眼高度 1.6 米", lake: "大雨：绿洲湖边，人眼高度 1.6 米"}[k]);
      await shot(`${TAG}R_${k}_eye_hrain.png`);
    }
    await cap("");
    await set({weather: "sun", ct: "clear", wind: .4}, 600, 1);
  }

  if (want("wdir")) {
    await set({weather: "sun", ct: "clear", wind: 1}, 30);
    const base = await E(() => window.__desQA().wind().a);
    const H3 = [base, base + 1.4, base - 1.6];
    for (const k of (process.env.WCAMS || "down,crest").split(",")) {
      const log = [];
      const r = await vid(`V_wind_direction_${k}`, 3 * 24, async i => {
        const j = Math.floor(i / 24);
        if (i % 24 === 0) { await E(a => { const q = window.__desQA(); q.windPin(a); q.sim(6, .1); }, H3[j]); await cam(k);
          await cap(`强风（风力 1.0），风向 ${j + 1}/3：${Math.round(((H3[j] * 180 / Math.PI) % 360 + 360) % 360)}°（${{flat: "平沙地，人眼高度", down: "脚下沙面，俯看", crest: "沙丘脊，人眼高度"}[k]}）`); }
        await tick(2);
        const s = await E(() => { const q = window.__desQA(), w = q.wind(); return {a: +w.a.toFixed(2), salt: +q.salt().toFixed(2)}; });
        log.push(s); return s;
      });
      await strip([12, 36, 60].map(i => frameAt(r.dir, i)), `V_wind_direction_${k}_strip.png`);
      report["wdir_" + k] = log.filter((_, i) => i % 24 === 12);
      fs.rmSync(r.dir, {recursive: true, force: true});
    }
    await E(() => window.__desQA().windPin(null));
  }

  if (want("wstr")) {
    const Y = .45;
    await E(Y => window.__desQA().windPin(Y - .6), Y);
    const L = [.15, .5, 1];
    for (const k of ["flat", "crest"]) {
      const r = await vid(`V_wind_strength_${k}`, 3 * 24, async i => {
        const j = Math.floor(i / 24);
        if (i % 24 === 0) { await set({weather: "sun", ct: "clear", wind: L[j]}, 20); await cam(k); await cap(`风力 ${L[j]}（${["微风：沙不起", "中风：沙粒贴地跳跃", "强风：沙流成带，脊上扬沙"][j]}）`); }
        await tick(2);
        return E(() => { const q = window.__desQA(), w = q.wind(); return {a: +w.a.toFixed(2), salt: +q.salt().toFixed(2), flowK: +q.sandU.uFlowK.value.toFixed(2)}; });
      });
      await strip([12, 36, 60].map(i => frameAt(r.dir, i)), `V_wind_strength_${k}_strip.png`);
      report["wstr_" + k] = r.log.filter((_, i) => i % 24 === 12);
      fs.rmSync(r.dir, {recursive: true, force: true});
    }
    await E(() => window.__desQA().windPin(null));
  }

  if (want("dune")) {
    /* 8 scene-minutes per frame: 24 frames with the wind 60° off the crest on one side, 24 with it swung to the other */
    await set({weather: "sun", ct: "clear", wind: .8}, 5);
    const yaw = await E(() => window.__desQA().dune.DUNE0.yaw);
    const r = await vid("V_dune_timelapse", 48, async i => {
      const side = i < 24 ? 1 : -1;
      await E(a => { const q = window.__desQA(); q.windPin(a); q.sim(480, 1); }, yaw + 1.05 * side);
      await cam("dune");
      await cap(`沙丘延时：每帧 8 分钟，第 ${(i + 1) * 8} 分钟；风${side > 0 ? "从脊线一侧斜吹" : "转到另一侧斜吹"}`);
      return E(() => { const P = window.__desQA().dune.DP; return {cv: +P.cv.toFixed(3), sk: +P.sk.toFixed(3), x: +P.x.toFixed(2), z: +P.z.toFixed(2), H: +(P.H || 0).toFixed(2)}; });
    }, 6);
    await strip([0, 23, 47].map(i => frameAt(r.dir, i)), "V_dune_timelapse_strip.png");
    report.dune = {first: r.log[0], mid: r.log[23], last: r.log[47]};
    fs.rmSync(r.dir, {recursive: true, force: true});
    await E(() => window.__desQA().windPin(null));
  }

  if (want("rain")) {
    for (const k of ["sand", "tent", "lake"]) {
      await set({weather: "sun", ct: "clear", wind: .4}, 900, 1);
      await cam(k); await osOut(); await cam(k);
      const nm = {sand: "沙地", tent: "帐篷", lake: "绿洲湖"}[k];
      const r = await vid(`V_rain_${k}_eye`, 12 + 36 + 24, async i => {
        if (i === 0) await cap(`${nm}（人眼高度 1.6 米）：雨前，干燥`);
        if (i === 12) { await set({weather: "hrain", ct: "overcast", wind: .5}, 45); await cam(k); await cap(`${nm}：大雨（开始下雨 45 秒后，实时）`); }
        if (i >= 48) { if (i === 48) await set({weather: "sun", ct: "clear", wind: .4}, 2); await E(() => window.__desQA().sim(12, .2)); await cam(k);
          await cap(`${nm}：雨停后变干（延时，每帧 12 秒），雨停 ${((i - 47) * 12 / 60).toFixed(1)} 分钟`); }
        else await tick(2);
        return E(() => { const q = window.__desQA(); return {wet: +q.WX.wet.toFixed(3), rain: +q.WX.rain.toFixed(2)}; });
      });
      await still(r.dir, 6, `V_rain_${k}_0dry.png`); await still(r.dir, 30, `V_rain_${k}_1rain.png`);
      await still(r.dir, 52, `V_rain_${k}_2after1min.png`); await still(r.dir, 71, `V_rain_${k}_3after4.8min.png`);
      await strip([6, 30, 52, 71].map(i => frameAt(r.dir, i)), `V_rain_${k}_strip.png`, 400);
      report["rain_" + k] = {dry: r.log[6], rain: r.log[30], after1: r.log[52], after48: r.log[71]};
      fs.rmSync(r.dir, {recursive: true, force: true});
    }
    await cap("");
  }

  if (want("agama")) {
    const agCamJS = AGCAM;
    const agStep = (d, up, fov, palmOut) => E((js, d, up, fov, palmOut) => { const q = window.__desQA(); q.step(2, 1 / 24); (new Function("return " + js))()(d, up, fov, palmOut);
      const a = q.AG.list[window.__ag]; return {mode: a.mode, palm: !!a.palm, h: a.palm ? +(a.ct * a.palm.h).toFixed(2) : 0}; }, agCamJS, d, up, fov, palmOut);
    /* bask */
    const bp = await E(() => { const q = window.__desQA(), L = q.AG.list; window.__set({weather: "sun", ct: "clear", wind: .3});
      let a = null; for (let i = 0; i < 140 && !a; i++) { q.sim(3); a = L.find(o => o.mode === "bask" && !o.palm); }
      window.__ag = L.indexOf(a); window.__agEye = null; window.__agFollow = false; return a ? {i: L.indexOf(a), male: a.male} : null; });
    report.agBask = bp;
    if (!bp) fails.push("agama never basked on the ground");
    else {
      await cap(`西奈飞蜥（${bp.male ? "雄" : "雌"}）：晴天趴在石头 / 沙上晒太阳`);
      const r = await vid("V_agama_bask", 36, () => agStep(.62, .16, 30, false));
      await still(r.dir, 18, "V_agama_bask.png"); fs.rmSync(r.dir, {recursive: true, force: true});
      report.agBaskModes = [...new Set(r.log.map(s => s.mode))];
    }
    /* climb: wait for a lizard to start up a palm (in sun it goes up to perch; else rain sends it up), follow it */
    const cp = await E(() => { const q = window.__desQA(), L = q.AG.list; let a = null, rain = false;
      for (let i = 0; i < 400 && !a; i++) { q.step(6, 1 / 12); a = L.find(o => o.mode === "climb" && o.palm && o.ct < .35); }
      if (!a) { rain = true; window.__set({weather: "hrain", ct: "overcast", wind: .4}); for (let i = 0; i < 400 && !a; i++) { q.step(6, 1 / 12); a = L.find(o => o.mode === "climb" && o.palm && o.ct < .35); } }
      window.__ag = L.indexOf(a); window.__agEye = null; window.__agFollow = true; return a ? {i: L.indexOf(a), male: a.male, rain, h: +a.palm.h.toFixed(2)} : null; });
    report.agClimb = cp;
    if (!cp) fails.push("no agama climbed a palm");
    else {
      await cap(`西奈飞蜥：爬上椰枣树干${cp.rain ? "（下雨了，往树冠爬）" : "（晴天爬上树干找高处）"}`);
      const r = await vid("V_agama_climb", 60, () => agStep(1.5, .1, 38, true));
      await strip([5, 30, 58].map(i => frameAt(r.dir, i)), "V_agama_climb_strip.png");
      report.agClimbLog = [r.log[0], r.log[30], r.log[59]];
      fs.rmSync(r.dir, {recursive: true, force: true});
      if (!(r.log[59].h > r.log[0].h + .3)) fails.push("climb clip: no height gained");
    }
    /* shelter: heavy rain 4 min, then every lizard under the crown */
    const st = await E(() => { const q = window.__desQA(), L = q.AG.list; window.__set({weather: "hrain", ct: "overcast", wind: .4}); q.sim(240);
      window.__ag = L.findIndex(a => a.palm); window.__agEye = null; window.__agFollow = false;
      return L.map(a => ({male: a.male, mode: a.mode, onPalm: !!a.palm, palmH: a.palm ? +a.palm.h.toFixed(2) : null, belowTop: a.palm ? +((1 - a.ct) * a.palm.h).toFixed(2) : null,
        target: a.palm ? +((1 - q.agRainT(a.palm, a.male)) * a.palm.h).toFixed(2) : null})); });
    report.agRain = st;
    if (!st.every(s => s.onPalm && Math.abs(s.belowTop - s.target) < .06)) fails.push("agama not under the crown in rain");
    await cap("西奈飞蜥：大雨中躲在椰枣树冠下（叶鞘和叶片下面）");
    { const r = await vid("V_agama_rain_shelter", 36, () => agStep(1.25, -.25, 38, true));
      await still(r.dir, 18, "V_agama_rain_shelter.png"); fs.rmSync(r.dir, {recursive: true, force: true}); }
    await E(js => { window.__agEye = null; (new Function("return " + js))()(3.2, -1.4, 40, true); }, agCamJS);
    await cap("西奈飞蜥：雨中在树冠下（远一点看整个树冠）"); await shot("V_agama_rain_shelter_wide.png");
  }
  if (want("agama") || want("agafter")) {
    const agCamJS = AGCAM;
    if (want("agafter")) await E(() => { window.__set({weather: "hrain", ct: "overcast", wind: .4}); window.__desQA().sim(240); });
    /* after the rain: down again and basking (they may go back up to perch later in the sun, so stop at the first ground bask) */
    const after = await E(() => { const q = window.__desQA(), L = q.AG.list; window.__set({weather: "sun", ct: "clear", wind: .3}); const seen = [];
      let a = null; for (let i = 0; i < 240 && !a; i++) { q.sim(1, .1); seen.push(L.map(o => o.mode + (o.palm ? "@palm" : "")).join(",")); a = L.find(o => o.mode === "bask" && !o.palm); }
      window.__ag = L.indexOf(a); window.__agEye = null; window.__agFollow = false;
      return {seen: seen.filter((s, i) => i % 3 === 0), secondsAfterRain: seen.length, basking: !!a, onGround: a ? !a.palm : false}; });
    report.agAfter = after;
    if (after.basking) { await cap("西奈飞蜥：雨停后下树，回到地面继续晒太阳"); await E(js => (new Function("return " + js))()(.7, .2, 32, false), agCamJS); await shot("V_agama_after_rain_bask.png"); }
    else fails.push("agama did not bask again after rain");
    await cap("");
  }

  if (want("geo")) {
    report.geo = await E(() => {
      const out = {}, h = g => { let a = 0, b = 0; for (const k of ["position", "color", "aW", "aB"]) { const A = g.attributes[k]; if (!A) continue;
        const v = A.array; for (let i = 0; i < v.length; i++) { a = (a + Math.round(v[i] * 1e5) * (i % 97 + 1)) % 2147483647; b = (b * 31 + Math.round(v[i] * 1e5)) % 2147483647; } }
        return a.toString(16) + "." + b.toString(16) + "." + (g.index ? g.index.count : 0); };
      window.__desQA().W.traverse(m => { if (m.isMesh && /^(rack|fire)(Bar|Post|Fork|Seat|Wood|Log|Stone)/.test(m.name)) out[m.name] = h(m.geometry); });
      return out; });
    console.log("geo", JSON.stringify(report.geo));
  }

  if (want("ver")) {
    await cap("");
    await set({weather: "sun", ct: "clear", wind: .3}, 2);
    await E(() => { document.body.classList.remove("col"); for (const s of ["#fab", "#sbtn", "#tp"]) { const n = document.querySelector(s); if (n) n.style.display = ""; } });
    await E(() => { const q = window.__desQA(); q.lookAt(-4.16, 11.13, 19.58, 0, 0, 0); q.step(1, 1 / 30); });
    await sleep(2500); await E(() => { const v = document.getElementById("ver"); if (v) v.scrollIntoView({block: "center"}); }); await sleep(800); await frames(4);
    report.ver = await E(() => { const v = document.getElementById("ver"), r = v && v.getBoundingClientRect(); return {text: v && v.textContent, bundle: window.CY && window.CY.desert, visible: !!r && r.width > 0 && r.bottom > 0 && r.top < innerHeight}; });
    const m = /desert\.(\w{6})/.exec(report.ver.bundle || "");
    report.ver.match = !!m && report.ver.text === "版本 " + m[1];
    console.log("ver", JSON.stringify(report.ver));
    if (!report.ver.match || !report.ver.visible) fails.push("version label does not match the bundle hash");
    await shot(`${TAG}C_panel_version.png`);
    const r = await E(() => { const q = document.getElementById("ver").closest(".info").getBoundingClientRect(); return {x: q.x - 12, y: q.y - 8, width: q.width + 24, height: q.height + 16}; });
    await page.screenshot({path: path.join(OUT, `${TAG}C_panel_version_zoom.png`), clip: Object.assign(r, {scale: 3})});
  }
} catch (e) { console.log("ERR", e.stack || e); fails.push(String(e)); }
report.fails = fails;
fs.writeFileSync(path.join(OUT, `${TAG}d170-report-${WHICH.replace(/,/g, "+")}.json`), JSON.stringify(report, null, 1));
console.log("report", JSON.stringify(report));
clearTimeout(killer);
await browser.close(); server.close();
process.exit(fails.length ? 1 : 0);
