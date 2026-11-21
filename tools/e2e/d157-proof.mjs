// Desert #157 ocean-parity proofs: desert vs sky-ocean at matched framings, sand curtain far/near, day/dusk/night, motion clips.
// Not part of CI. Usage: node tools/e2e/d157-proof.mjs [pair|sand|tod|crab|camel|eagle|snake|all]   (OUT=/tmp/d157)
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {execFile} from "node:child_process";
import puppeteer from "puppeteer-core";
const ffmpeg = args => new Promise((res, rej) => execFile("ffmpeg", ["-y", "-loglevel", "error", ...args], {maxBuffer: 1e8}, (e, _o, se) => e ? rej(new Error(String(se).slice(-500))) : res()));

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = process.env.OUT || "/tmp/d157";
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
    let d = document.getElementById("d157cap");
    if (!text) { if (d) d.remove(); return; }
    if (!d) { d = document.createElement("div"); d.id = "d157cap"; document.body.appendChild(d); }
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
};
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
await page.setViewport({width: W, height: H, deviceScaleFactor: 1});
const want = k => WHICH === "all" || WHICH === k || WHICH.split(",").includes(k);
const fails = [];
const report = {};

try {
  await boot(page, "desert");
  const live = await page.evaluate(() => ({desert: window.CY && window.CY.desert, os: window.CY && window.CY.ms && window.CY.ms.ostrich_v2af}));
  console.log("live", JSON.stringify(live));
  report.live = live;
  if (!live.desert || !/desert\.[0-9a-f]+\.js$/.test(live.desert)) fails.push("desert bundle missing");
  if (!live.os) fails.push("ostrich_v2af not in the live manifest");
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
      await seaCam(s, SEA[k]);
      const b = path.join(OUT, `B_sea_fall_${k}.png`); await s.screenshot({path: b});
      await pair(a, b, `B_sand_vs_sea_${k}.png`);
      console.log("pair", k);
    }
  }
  if (want("sand")) {
    await desCam(page, DES.far); await cap(page, "");
    await shot(page, "B_sandfall_far.png");
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
    await cap(page, "近景 · 近距减薄之后（背风积雪检查）");
    await shot(page, "B_sandfall_near.png");
    await cap(page, "");
    if (near.nearD > 7.6) fails.push("near sand shot is outside the lee-snow thinning band");
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
      console.log("tod", k);
    }
    await desTod(page, "day");
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
  /* crab chela: the crab nearest the pond out of its burrow, the others in; close 3/4 view of the big claw's outer side. g pins the gape. */
  const crabPose = g => page.evaluate(g => {
    const q = window.__desQA(), C = window.__C(), R = q.CR;
    if (R._proof == null) { const c = R.list.slice().sort((a, b) => q.pN(b.bx, b.bz) - q.pN(a.bx, a.bz))[0]; R._proof = R.list.indexOf(c); for (const o of R.list) if (o !== c) o.mode = "in"; }
    const c = R.list[R._proof];
    R.calm = true; R.vis = 1; R.U.uVis.value = 1; R.im.visible = true; R.gapePin = g;
    const hold = () => { c.mode = "out"; c.t = 999; c.sk = 0; c.up = 0; c.v = 0; c.feed = 0; c.walk = 0; c.x = c.bx; c.z = c.bz; c.y = q.hTop(c.x, c.z); c.gape = g; };
    /* the camera goes first: the crab update is skipped while the lake animals are culled for distance */
    const aim = () => {
      const k = c.s * q.crK, fw = [Math.sin(c.yaw), Math.cos(c.yaw)], rt = [Math.cos(c.yaw), -Math.sin(c.yaw)];
      const L = (lx, ly, lz) => [c.x + rt[0] * lx * k + fw[0] * lz * k, c.y + ly * k, c.z + rt[1] * lx * k + fw[1] * lz * k];
      const t = L(-.026, .019, .085), e = L(-.186, .069, .205);
      q.lookAt(e[0], e[1], e[2], t[0], t[1], t[2]); C.De.fov = 22; C.De.near = .005; C.De.updateProjectionMatrix();
    };
    hold(); aim(); q.step(2, 1 / 30); hold(); q.step(1, 1 / 30); aim();
    return {gape: +R.OA.array[R._proof].toFixed(4)};
  }, g);
  if (want("crab")) {
    await page.evaluate(() => { window.__set({weather: "sun", ct: "clear", wind: .3}); window.__desQA().tod("day"); });
    report.crab = {closed: await crabPose(0)}; await shot(page, "B_crab_claw_closed.png");
    report.crab.open = await crabPose(1); await shot(page, "B_crab_claw_open.png");
    const dir = path.join(OUT, "crab-frames");
    fs.rmSync(dir, {recursive: true, force: true}); fs.mkdirSync(dir);
    const N = 24 * 4;
    for (let i = 0; i < N; i++) {
      const g = .5 - .5 * Math.cos(i / N * Math.PI * 4);
      await page.evaluate(g => { const q = window.__desQA(), R = q.CR, c = R.list[R._proof];
        R.gapePin = g; c.mode = "out"; c.t = 999; c.v = 0; c.walk = 0; c.feed = 0; c.x = c.bx; c.z = c.bz; c.gape = g; q.step(1, 1 / 24); }, g);
      await frames(page, 1);
      await page.screenshot({path: path.join(dir, String(i).padStart(4, "0") + ".png")});
    }
    await ffmpeg(["-framerate", "24", "-i", path.join(dir, "%04d.png"), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", path.join(OUT, "crab-claw-open-close.mp4")]);
    fs.rmSync(dir, {recursive: true, force: true});
    console.log("encoded crab", N);
  }
} catch (e) {
  console.log("PROOF ERROR", String(e && e.stack || e).slice(0, 1500));
  fails.push("exception");
} finally {
  fs.writeFileSync(path.join(OUT, "d157-report.json"), JSON.stringify(report, null, 2));
  await browser.close(); server.close();
}
if (fails.length) { console.log("PROOF FAIL", fails.join("; ")); process.exit(1); }
console.log("d157 proofs ok");
