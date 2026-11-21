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
  const live = await page.evaluate(() => ({desert: window.CY && window.CY.desert, os: window.CY && window.CY.ms && window.CY.ms.ostrich_v2ag,
    gb: window.CY && window.CY.ms && window.CY.ms.gerbil_v5}));
  console.log("live", JSON.stringify(live));
  report.live = live;
  if (!live.desert || !/desert\.[0-9a-f]+\.js$/.test(live.desert)) fails.push("desert bundle missing");
  if (!live.os) fails.push("ostrich_v2ag not in the live manifest");
  if (!live.gb) fails.push("gerbil_v5 not in the live manifest");
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
  /* ostrich_v2ag in the scene: the engine plays sit and stand_up as authored (no bone offsets, no caption). The cock alone,
     on level sand south of the palms facing east, so the side camera sits due south. */
  const OSN = "ostrich_v2ag";
  if (want("sit") || want("sitstill") || want("run")) {
    const live = await page.evaluate(() => { const q = window.__desQA(), A = q.PA.os.find(o => o.male) || q.PA.os[0];
      return {glb: !!(A && A.rig), clips: A && A.rig ? Object.keys(A.rig.acts) : []}; });
    console.log("ostrich", OSN, JSON.stringify(live));
    report.ostrich = {file: OSN, ...live};
    if (!live.glb) fails.push("ostrich rig not loaded");
  }
  if (want("sit") || want("sitstill")) {
    const spot = await page.evaluate(() => {
      const q = window.__desQA();
      window.__set({weather: "sun", ct: "clear", wind: .3}); q.tod("day");
      q.PA.noView = true;
      if (q.ANIM.eagle && q.ANIM.eagle.pos) q.ANIM.eagle.pos.set(40, 22, 40);
      q.ANIM.camels.forEach((c, i) => { c.x = -22; c.z = -18 - i * 4; c.g.position.set(c.x, q.hTop(c.x, c.z), c.z); });
      const yaw = Math.PI / 2, pondOut = (x, z) => Math.hypot((x - q.POND.x) / q.POND.rx, (z - q.POND.z) / q.POND.rz);
      let best = null;
      for (let z = -8.2; z <= -5.2; z += .35) for (let x = -9.5; x <= -3.2; x += .35) {
        if (q.pN(x, z) < 1.55 || !q.osOpen(x, z) || pondOut(x, z) < 1.15) continue;
        let near = 99;
        for (const p of q.PALMS) near = Math.min(near, Math.hypot(x - p.x, z - p.z));
        near = Math.min(near, Math.hypot(x - q.TENT.x, z - q.TENT.z), Math.hypot(x - q.FIRE.x, z - q.FIRE.z));
        if (near < 2.4) continue;
        let cam = 99;
        for (const a of [0, Math.PI, Math.PI / 2, -Math.PI / 2]) for (let d = 1.4; d <= 7.4; d += 1) {
          const px = x + Math.sin(yaw + a) * d, pz = z + Math.cos(yaw + a) * d;
          for (const p of q.PALMS) cam = Math.min(cam, Math.hypot(px - p.x, pz - p.z));
        }
        if (cam < 1.25) continue;
        let dh = 0;
        for (const [dx, dz] of [[.7, 0], [-.7, 0], [0, .7], [0, -.7]]) dh = Math.max(dh, Math.abs(q.hTop(x + dx, z + dz) - q.hTop(x, z)));
        const score = cam + near * .2 - dh * 20;
        if (!best || score > best.score) best = {x, z, dh: +dh.toFixed(4), score: +score.toFixed(2)};
      }
      const A = q.PA.os.find(o => o.male) || q.PA.os[0];
      window.__sit = {x: best.x, z: best.z, yaw};
      q.osPlace(A, best.x, best.z, yaw);
      for (const o of q.PA.os) if (o !== A) { o.mode = "sit"; o.t = 999; o.g.visible = false; o.x = best.x + 14; o.z = best.z + 14; }
      for (let i = 0; i < 20; i++) { A.mode = "stand"; A.t = 999; A.v = 0; A.thr = null; A.path = null; A.g.visible = true; A.x = best.x; A.z = best.z; A.yaw = yaw; q.step(1, 1 / 30); }
      return best;
    });
    console.log("sit spot", JSON.stringify(spot));
    report.sitSpot = spot;
    /* bone scales, morph weights and how far the body's lowest skinned vertex sits from the sand */
    const metrics = () => page.evaluate(() => {
      const q = window.__desQA(), A = q.PA.os.find(o => o.male) || q.PA.os[0];
      A.g.updateMatrixWorld(true);
      let scaleOff = 0;
      /* limbs only: the clips' own scale tracks fold the wings and tuck the tail */
      A.mdl.traverse(b => { if (b.isBone && /thigh|shank|tarso|foot|toe/i.test(b.name)) scaleOff = Math.max(scaleOff, Math.abs(b.scale.x - 1), Math.abs(b.scale.y - 1), Math.abs(b.scale.z - 1)); });
      const morph = {};
      A.mdl.traverse(m => { if (m.isMesh && m.morphTargetInfluences && m.morphTargetDictionary) for (const [n, i] of Object.entries(m.morphTargetDictionary)) morph[n] = Math.max(morph[n] || 0, +m.morphTargetInfluences[i].toFixed(3)); });
      const sit = A.rig.acts.sit, up = A.rig.acts.stand_up;
      return {cur: A.rig.cur, sitT: +sit.time.toFixed(3), upT: +up.time.toFixed(3), limbScaleMaxOff: +scaleOff.toFixed(4), mdlY: +A.mdl.position.y.toFixed(4), morph};
    });
    const drive = async (mode, pred, cap) => {
      let last = null;
      for (let i = 0; i < cap; i++) {
        last = await page.evaluate(mode => {
          const q = window.__desQA(), A = q.PA.os.find(o => o.male) || q.PA.os[0], s = window.__sit;
          A.mode = mode; A.t = 999; A.v = 0; A.yr = 0; A.x = s.x; A.z = s.z; A.yaw = s.yaw; A.thr = null; A.path = null; A.g.visible = true;
          q.step(1, 1 / 30);
          A.x = s.x; A.z = s.z; A.yaw = s.yaw;
          const sit = A.rig.acts.sit, up = A.rig.acts.stand_up;
          A.g.updateMatrixWorld(true);
          return {cur: A.rig.cur, sitT: sit.time, upT: up.time, w: sit.getEffectiveWeight(), wu: up.getEffectiveWeight(), by: A.bn.body.getWorldPosition(new A.g.position.constructor()).y};
        }, mode);
        if (pred(last)) return last;
      }
      return last;
    };
    const cam = kind => page.evaluate(kind => {
      const q = window.__desQA(), C = window.__C(), s = window.__sit, yaw = s.yaw, gy = q.hTop(s.x, s.z);
      const at = (px, pz, y, ly, fov) => { q.lookAt(px, gy + y, pz, s.x, gy + ly, s.z); C.De.fov = fov; C.De.near = .04; C.De.updateProjectionMatrix(); };
      const side = (d, y, ly, fov) => at(s.x + Math.sin(yaw + Math.PI / 2) * d, s.z + Math.cos(yaw + Math.PI / 2) * d, y, ly, fov);
      const face = (sg, d, y, ly, fov) => at(s.x + Math.sin(yaw) * d * sg, s.z + Math.cos(yaw) * d * sg, y, ly, fov);
      ({side: () => side(7.2, 1.15, .95, 28), front: () => face(1, 7.4, 1.15, .95, 28), back: () => face(-1, 7.4, 1.2, .9, 28), low: () => side(7.6, .42, .85, 30),
        mside: () => side(5, .95, .72, 30), mfront: () => face(1, 5.2, .95, .72, 30), mback: () => face(-1, 5.2, 1, .7, 30)})[kind]();
    }, kind);
    const M = report.sitMetrics = {};
    /* "mid" is where the body bone is halfway between its standing and its seated height */
    const yStand = (await drive("stand", s => s.cur === "idle" && s.wu < .01, 120)).by;
    const yHold = (await drive("sit", s => s.cur === "sit" && s.sitT >= 1.6, 120)).by;
    const yMid = (yStand + yHold) / 2;
    report.sitHeights = {yStand: +yStand.toFixed(3), yHold: +yHold.toFixed(3)};
    await drive("stand", s => s.cur === "idle" && s.wu < .01, 120);
    console.log("settle", JSON.stringify(await drive("sit", s => s.cur === "sit" && s.w > .9 && s.by <= yMid, 80)));
    M.settle = await metrics();
    for (const k of ["side", "front", "back"]) { await cam("m" + k); await shot(page, `${OSN}_settle_${k}.png`); }
    console.log("hold", JSON.stringify(await drive("sit", s => s.cur === "sit" && s.sitT >= 1.6 && s.sitT <= 3.1, 120)));
    M.hold = await metrics();
    for (const k of ["side", "front", "back", "low"]) { await cam(k); await shot(page, `${OSN}_hold_${k}.png`); }
    console.log("standup", JSON.stringify(await drive("stand", s => s.cur === "stand_up" && s.wu > .9 && s.by >= yMid, 90)));
    M.standup = await metrics();
    for (const k of ["side", "front", "back"]) { await cam("m" + k); await shot(page, `${OSN}_standup_${k}.png`); }
    console.log("sit metrics", JSON.stringify(M));
    for (const k in M) if (M[k].limbScaleMaxOff > .001 || M[k].mdlY !== 0) fails.push(`ostrich ${k}: limb scale or body offset`);
    if (!(M.hold.morph.sit_skirt > 1 && M.hold.morph.soft_mound > .5)) fails.push("ostrich hold: sit_skirt/soft_mound not driven by the clip");

    /* stand -> sit -> hold -> stand_up -> stand, fixed side camera, one 1/30 s step per frame, 30 fps */
    if (want("sit")) {
    await page.evaluate(() => {
      const q = window.__desQA(), A = q.PA.os.find(o => o.male) || q.PA.os[0], s = window.__sit;
      for (let i = 0; i < 40; i++) { A.mode = "stand"; A.t = 999; A.v = 0; A.x = s.x; A.z = s.z; A.yaw = s.yaw; A.thr = null; A.path = null; q.step(1, 1 / 30); }
    });
    await cam("side");
    const dir = path.join(OUT, "sit-frames");
    fs.rmSync(dir, {recursive: true, force: true}); fs.mkdirSync(dir);
    const marks = {}, N = 30 * 6;
    for (let i = 0; i < N; i++) {
      const s = await page.evaluate(i => {
        const q = window.__desQA(), A = q.PA.os.find(o => o.male) || q.PA.os[0], s = window.__sit, t = i / 30;
        const mode = t >= .3 && t < 3.6 ? "sit" : "stand";
        A.mode = mode; A.t = 999; A.v = 0; A.yr = 0; A.x = s.x; A.z = s.z; A.yaw = s.yaw; A.thr = null; A.path = null; A.g.visible = true;
        q.step(1, 1 / 30);
        A.x = s.x; A.z = s.z; A.yaw = s.yaw;
        A.g.updateMatrixWorld(true);
        return {cur: A.rig.cur, sitT: +A.rig.acts.sit.time.toFixed(3), upT: +A.rig.acts.stand_up.time.toFixed(3), by: A.bn.body.getWorldPosition(new A.g.position.constructor()).y};
      }, i);
      if (marks.stand == null && i >= 3) marks.stand = i;
      if (marks.settle == null && s.cur === "sit" && s.by <= yMid) marks.settle = i;
      if (marks.hold == null && s.cur === "sit" && s.sitT >= 2) marks.hold = i;
      if (marks.up == null && marks.hold != null && s.cur === "stand_up" && s.by >= yMid) marks.up = i;
      if (marks.up != null && marks.done == null && s.cur !== "stand_up" && s.cur !== "sit") marks.done = Math.min(N - 1, i + 12);
      await frames(page, 1);
      await page.screenshot({path: path.join(dir, String(i).padStart(4, "0") + ".png")});
    }
    console.log("sit cycle marks", JSON.stringify(marks));
    report.sitCycle = {fps: 30, frames: N, marks};
    await ffmpeg(["-framerate", "30", "-i", path.join(dir, "%04d.png"), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", path.join(OUT, `${OSN}_sit_cycle_side.mp4`)]);
    const pick = [marks.stand, marks.settle, marks.hold, marks.up, marks.done ?? N - 1].filter(n => n != null);
    await ffmpeg([...pick.flatMap(n => ["-i", path.join(dir, String(n).padStart(4, "0") + ".png")]), "-filter_complex",
      pick.map((_, j) => `[${j}:v]scale=640:360[s${j}]`).join(";") + ";" + pick.map((_, j) => `[s${j}]`).join("") + `hstack=inputs=${pick.length}`,
      path.join(OUT, `${OSN}_stand_sit_standup_strip.png`)]);
    fs.rmSync(dir, {recursive: true, force: true});
    console.log("encoded sit cycle", pick.join(","));
    }
  }
  if (want("run")) {
    const info = await page.evaluate(() => {
      const q = window.__desQA();
      window.__set({weather: "sun", ct: "clear", wind: .3}); q.tod("day");
      q.PA.noView = true;
      if (q.ANIM.eagle && q.ANIM.eagle.pos) q.ANIM.eagle.pos.set(40, 22, 40);
      q.ANIM.camels.forEach((c, i) => { c.x = -22; c.z = 16 - i * 4; c.g.position.set(c.x, q.hTop(c.x, c.z), c.z); });
      if (q.rsPut) q.rsPut(18, 14, 0);
      const slope = (x, z) => { let dh = 0; for (const [dx, dz] of [[.6, 0], [-.6, 0], [0, .6], [0, -.6]]) dh = Math.max(dh, Math.abs(q.hTop(x + dx, z + dz) - q.hTop(x, z))); return dh; };
      /* cacti and shrubs kept 2.5 m off the path, so the bird never reads as passing over one */
      const plants = q.OBST.filter(o => o.k === "cactus" || o.k === "sag" || o.k === "shrub");
      const clear = (x, z) => plants.every(o => Math.hypot(x - o.x, z - o.z) > o.r + 2.5);
      const ok = (x, z) => q.sN(x, z) < .74 && q.pN(x, z) >= 3.45 && q.osOpen(x, z) && q.dune.dMask(x, z) < .18 && slope(x, z) < .16 && clear(x, z)
        && Math.hypot(x - q.FIRE.x, z - q.FIRE.z) > 6 && Math.hypot(x - q.TENT.x, z - q.TENT.z) > 5;
      let best = null;
      for (let a = 0; a < 16; a++) {
        const yaw = a * Math.PI / 8, dx = Math.sin(yaw), dz = Math.cos(yaw);
        for (let z0 = -14; z0 <= 10; z0 += .7) for (let x0 = -16; x0 <= 16; x0 += .7) {
          if (!ok(x0, z0)) continue;
          let len = 0;
          for (; len < 36; len += .35) if (!ok(x0 + dx * len, z0 + dz * len)) break;
          if (!best || len > best.len) best = {x0, z0, yaw, dx, dz, len: +len.toFixed(2)};
        }
      }
      if (!best || best.len < 14) return {best, fail: "no clear sand run"};
      const A = q.PA.os.find(o => o.male) || q.PA.os[0];
      const travel = Math.min(best.len - 1.2, 22), x1 = best.x0 + best.dx * travel, z1 = best.z0 + best.dz * travel;
      q.osPlace(A, best.x0, best.z0, best.yaw);
      A.path = [{x: best.x0, z: best.z0}, {x: x1, z: z1}, {x: best.x0 + best.dx * (travel + 8), z: best.z0 + best.dz * (travel + 8)}];
      A.pi = 1; A.mode = "run"; A.vmax = 4.9; A.v = 4.6; A.t = 999; A.runT = 999; A.then = null; A.thr = null; A.P.sit = 0; A.g.visible = true;
      for (const o of q.PA.os) if (o !== A) { o.mode = "sit"; o.t = 999; o.g.visible = false; }
      window.__run = {yaw: best.yaw, plants: plants.length};
      window.__runCam = () => { const C = window.__C(), y = window.__run.yaw, d = 8.2;
        q.lookAt(A.x + Math.cos(y) * d, A.gy + 1.25, A.z - Math.sin(y) * d, A.x, A.gy + 1.05, A.z); C.De.fov = 30; C.De.near = .05; C.De.updateProjectionMatrix();
        for (const o of q.PA.os) if (o !== A) o.g.visible = false; };
      for (let i = 0; i < 28; i++) { A.mode = "run"; A.t = 999; A.vmax = 4.9; q.step(1, 1 / 24); window.__runCam(); }
      return {best, plants: plants.length, cur: A.rig && A.rig.cur};
    });
    console.log("run path", JSON.stringify(info));
    report.run = {info};
    if (!info || info.fail) fails.push(info && info.fail || "run path failed");
    else {
      const dir = path.join(OUT, "run-frames");
      fs.rmSync(dir, {recursive: true, force: true}); fs.mkdirSync(dir);
      const samples = [];
      let wraps = 0, prev = null;
      for (let i = 0; i < 24 * 4; i++) {
        const s = await page.evaluate(() => {
          const q = window.__desQA(), A = q.PA.os.find(o => o.male) || q.PA.os[0];
          q.step(1, 1 / 24); window.__runCam();
          const act = A.rig.acts.fast_run, txt = document.body.innerText || "";
          return {mode: A.mode, cur: A.rig.cur, pN: +q.pN(A.x, A.z).toFixed(2), clip: +act.time.toFixed(3), cap: /跑/.test(txt) && [...document.querySelectorAll("body *")].some(n => n.offsetParent && /跑/.test(n.textContent) && !n.children.length)};
        });
        if (i > 6 && (s.mode !== "run" || s.cur !== "fast_run")) break;
        if (prev != null && s.clip < prev - .04) wraps++;
        prev = s.clip; samples.push(s);
        await frames(page, 1);
        await page.screenshot({path: path.join(dir, String(samples.length - 1).padStart(4, "0") + ".png")});
      }
      const sum = report.run.summary = {n: samples.length, wraps, modes: [...new Set(samples.map(s => s.mode + "/" + s.cur))], minPN: Math.min(...samples.map(s => s.pN)), cap: samples.some(s => s.cap)};
      console.log("run", JSON.stringify(sum));
      if (sum.wraps < 3) fails.push("run has fewer than 3 gait cycles");
      if (!sum.modes.every(m => m === "run/fast_run")) fails.push("run left fast_run");
      if (sum.cap) fails.push("run has a 跑 caption");
      await ffmpeg(["-framerate", "24", "-i", path.join(dir, "%04d.png"), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", path.join(OUT, `${OSN}-run-side.mp4`)]);
      fs.rmSync(dir, {recursive: true, force: true});
      console.log("encoded run");
    }
  }
  /* gerbil_v5 in the scene: one gerbil out on level open sand by day, the others below; clips chosen by the engine from the mode
     (stand -> stand_lookout, nibble -> dig, a mode it has no case for -> idle, moving -> hop_run) */
  const GBN = "gerbil_v5";
  if (want("gerbil") || want("gbdig") || want("gbhop")) {
    const spot = await page.evaluate(() => {
      const q = window.__desQA();
      window.__set({weather: "sun", ct: "clear", wind: .25}); q.tod("day");
      q.PA.noView = true;
      if (q.ANIM.eagle && q.ANIM.eagle.pos) q.ANIM.eagle.pos.set(40, 22, 40);
      q.ANIM.camels.forEach((c, i) => { c.x = -22; c.z = -18 - i * 4; c.g.position.set(c.x, q.hTop(c.x, c.z), c.z); });
      if (q.rsPut) q.rsPut(18, 14, 0);
      for (const o of q.PA.os) { o.mode = "sit"; o.t = 999; o.x = 24; o.z = -20; o.g.visible = false; }
      for (const t of q.PA.tt) { t.x = -20; t.z = -16; t.g.visible = false; }
      for (const s of q.PA.sc) { s.mode = "hide"; s.g.visible = false; }
      const A = q.PA.gb[0];
      for (const g of q.PA.gb) if (g !== A) { g.mode = "in"; g.t = 999; g.g.visible = false; }
      const slope = (x, z) => { let dh = 0; for (const [dx, dz] of [[.3, 0], [-.3, 0], [0, .3], [0, -.3]]) dh = Math.max(dh, Math.abs(q.hTop(x + dx, z + dz) - q.hTop(x, z))); return dh; };
      const clearOf = (x, z, m) => q.OBST.every(o => Math.hypot(x - o.x, z - o.z) > o.r + m);
      /* a little way out from its own burrow, on level sand, nothing within a metre of it or of the side and front cameras */
      let best = null;
      for (const h of q.PA.gb.map(g => g.h)) for (let r = .5; r <= 2.4; r += .15) for (let a = 0; a < 24; a++) {
        const x = h.x + Math.sin(a / 24 * Math.PI * 2) * r, z = h.z + Math.cos(a / 24 * Math.PI * 2) * r, yaw = Math.atan2(x - h.x, z - h.z);
        if (q.pN(x, z) < 1.3 || !clearOf(x, z, 1)) continue;
        const sx = x + Math.sin(yaw + Math.PI / 2) * .6, sz = z + Math.cos(yaw + Math.PI / 2) * .6, fx = x + Math.sin(yaw) * .6, fz = z + Math.cos(yaw) * .6;
        if (!clearOf(sx, sz, .6) || !clearOf(fx, fz, .6)) continue;
        const dh = slope(x, z), score = -dh * 40 - r * .2;
        if (!best || score > best.score) best = {x: +x.toFixed(3), z: +z.toFixed(3), yaw: +yaw.toFixed(3), dh: +dh.toFixed(4), r: +r.toFixed(2), score: +score.toFixed(3), h: q.PA.gb.findIndex(g => g.h === h)};
      }
      window.__gb = best;
      return best;
    });
    console.log("gerbil spot", JSON.stringify(spot));
    report.gerbilSpot = spot;
    const gbStep = (mode, n, dt) => page.evaluate((mode, n, dt) => {
      const q = window.__desQA(), A = q.PA.gb[0], s = window.__gb, gy0 = q.hTop(s.x, s.z);
      /* a gerbil too small on screen is skipped (its rig not ticked), so the camera comes in close first */
      q.lookAt(s.x + Math.sin(s.yaw + Math.PI / 2) * .62, gy0 + .085, s.z + Math.cos(s.yaw + Math.PI / 2) * .62, s.x, gy0 + .06, s.z);
      for (let i = 0; i < n; i++) {
        A.mode = mode; A.t = 99; A.v = 0; A.goal = null; A.out = true; A.P.in = 0; A.x = s.x; A.z = s.z; A.yaw = s.yaw; A.gy = q.hTop(s.x, s.z);
        q.step(1, dt); A.g.visible = true;
      }
      A.g.updateMatrixWorld(true);
      const morph = {};
      A.g.traverse(m => { if (m.isMesh && m.morphTargetInfluences && m.morphTargetDictionary) for (const [k, j] of Object.entries(m.morphTargetDictionary)) morph[k] = Math.max(morph[k] || 0, +m.morphTargetInfluences[j].toFixed(3)); });
      let scaleOff = 0, cast = [], fur = null;
      A.g.traverse(b => { if (b.isBone) scaleOff = Math.max(scaleOff, Math.abs(b.scale.x - 1), Math.abs(b.scale.y - 1), Math.abs(b.scale.z - 1));
        if (b.isMesh) { cast.push(b.material.name + ":" + b.castShadow); if (!b.material.transparent && b.material.map) fur = b.material.map.image && b.material.map.image.width; } });
      const head = A.bn.head.getWorldPosition(new A.g.position.constructor()); q.W.worldToLocal(head);
      return {cur: A.rig && A.rig.cur, morph, boneScaleMaxOff: +scaleOff.toFixed(4), cast, furPx: fur, headY: +(head.y - A.gy).toFixed(4), sc: +A.g.scale.x.toFixed(3)};
    }, mode, n, dt);
    const gbCam = kind => page.evaluate(kind => {
      const q = window.__desQA(), C = window.__C(), A = q.PA.gb[0], s = window.__gb, gy = q.hTop(s.x, s.z), yaw = s.yaw;
      const head = A.bn.head.getWorldPosition(new A.g.position.constructor()); q.W.worldToLocal(head);
      const at = (a, d, y, tx, ty, tz, fov) => { q.lookAt(s.x + Math.sin(yaw + a) * d, gy + y, s.z + Math.cos(yaw + a) * d, tx, ty, tz); C.De.fov = fov; C.De.near = .01; C.De.updateProjectionMatrix(); };
      ({side: () => at(Math.PI / 2, .62, .085, s.x, gy + .06, s.z, 28), front: () => at(0, .56, .09, s.x, gy + .065, s.z, 28),
        face: () => { const hx = head.x + Math.sin(yaw) * .012, hz = head.z + Math.cos(yaw) * .012; q.lookAt(hx + Math.sin(yaw + .5) * .2, head.y + .02, hz + Math.cos(yaw + .5) * .2, hx, head.y + .004, hz); C.De.fov = 26; C.De.near = .01; C.De.updateProjectionMatrix(); },
        hop: () => at(Math.PI / 2, .9, .1, A.x, gy + .04, A.z, 30)})[kind]();
    }, kind);
    const G = report.gerbil = {file: GBN};
    if (want("gerbil")) {
      G.stand = await gbStep("stand", 90, 1 / 30);
      for (const k of ["side", "front", "face"]) { await gbCam(k); await shot(page, `${GBN}_stand_lookout_${k}.png`); }
      G.idle = await gbStep("hold", 90, 1 / 30);
      await gbCam("side"); await shot(page, `${GBN}_idle_side.png`);
      G.dig = await gbStep("nibble", 45, 1 / 30);
      console.log("gerbil metrics", JSON.stringify(G));
      if (G.stand.cur !== "stand_lookout" || !(G.stand.morph.lookout_fix > .99)) fails.push("gerbil lookout: lookout_fix not 1 in stand_lookout");
      if (G.idle.cur !== "idle" || G.idle.morph.lookout_fix > .01) fails.push("gerbil idle: lookout_fix not 0");
      if (G.dig.cur !== "dig" || G.dig.morph.lookout_fix > .01) fails.push("gerbil dig: lookout_fix not 0");
      for (const k of ["stand", "idle", "dig"]) if (G[k].boneScaleMaxOff > .001) fails.push(`gerbil ${k}: bone scale off 1`);
      if (G.stand.cast.some(c => /hair/.test(c) && /true/.test(c))) fails.push("gerbil hair cards cast shadows");
      if (G.stand.furPx !== 2048) fails.push("gerbil fur colour not 2048 px in the scene");
    }
    if (want("gbdig")) {
      await gbStep("hold", 30, 1 / 30);
      await gbCam("side");
      const dir = path.join(OUT, "gbdig-frames");
      fs.rmSync(dir, {recursive: true, force: true}); fs.mkdirSync(dir);
      const N = 24 * 3;
      for (let i = 0; i < N; i++) {
        await gbStep(i < 6 ? "hold" : "nibble", 1, 1 / 24);
        await frames(page, 1);
        await page.screenshot({path: path.join(dir, String(i).padStart(4, "0") + ".png")});
      }
      await ffmpeg(["-framerate", "24", "-i", path.join(dir, "%04d.png"), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", path.join(OUT, `${GBN}_dig_side.mp4`)]);
      fs.rmSync(dir, {recursive: true, force: true});
      console.log("encoded gerbil dig", N);
    }
    if (want("gbhop")) {
      /* a short dash across level sand past the spot, the camera tracking from the side */
      const dir = path.join(OUT, "gbhop-frames");
      fs.rmSync(dir, {recursive: true, force: true}); fs.mkdirSync(dir);
      await page.evaluate(() => { const q = window.__desQA(), A = q.PA.gb[0], s = window.__gb;
        A.x = s.x - Math.sin(s.yaw) * .5; A.z = s.z - Math.cos(s.yaw) * .5; A.yaw = s.yaw; A.mode = "forage"; A.t = 99; A.spd = .8;
        A.goal = {x: s.x + Math.sin(s.yaw) * 2.5, z: s.z + Math.cos(s.yaw) * 2.5}; });
      const hs = [];
      for (let i = 0; i < 24 * 2; i++) {
        const r = await page.evaluate(() => { const q = window.__desQA(), C = window.__C(), A = q.PA.gb[0], s = window.__gb;
          A.mode = "forage"; A.t = 99; A.spd = .8; A.out = true; A.P.in = 0; A.goal = {x: s.x + Math.sin(s.yaw) * 2.5, z: s.z + Math.cos(s.yaw) * 2.5};
          q.step(1, 1 / 24); A.g.visible = true;
          const gy = q.hTop(A.x, A.z), y = s.yaw;
          q.lookAt(A.x + Math.sin(y + Math.PI / 2) * .9, gy + .1, A.z + Math.cos(y + Math.PI / 2) * .9, A.x, gy + .04, A.z); C.De.fov = 30; C.De.near = .01; C.De.updateProjectionMatrix();
          return {cur: A.rig && A.rig.cur, v: +A.v.toFixed(3)}; });
        hs.push(r);
        await frames(page, 1);
        await page.screenshot({path: path.join(dir, String(i).padStart(4, "0") + ".png")});
      }
      G.hop = {clips: [...new Set(hs.map(h => h.cur))], vmax: Math.max(...hs.map(h => h.v))};
      console.log("gerbil hop", JSON.stringify(G.hop));
      if (!G.hop.clips.includes("hop_run")) fails.push("gerbil dash never played hop_run");
      await ffmpeg(["-framerate", "24", "-i", path.join(dir, "%04d.png"), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", path.join(OUT, `${GBN}_hop_run_side.mp4`)]);
      fs.rmSync(dir, {recursive: true, force: true});
      console.log("encoded gerbil hop");
    }
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
