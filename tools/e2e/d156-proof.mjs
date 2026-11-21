// Desert #156 proof stills and clips (scene items 6–8). Not part of CI.
// Usage: node tools/e2e/d156-proof.mjs [crab|crabvid|sand|run|all]
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {execFile} from "node:child_process";
import puppeteer from "puppeteer-core";
const ffmpeg = args => new Promise((res, rej) => execFile("ffmpeg", ["-y", ...args], {maxBuffer: 1e8}, (e, _o, se) => e ? rej(new Error(String(se).slice(-500))) : res()));

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = process.env.OUT || "/tmp/d156";
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

async function boot(page, yard) {
  page.on("console", m => { const t = m.type(); if (t === "error" || t === "warning") console.log("PAGE", t, m.text().slice(0, 240)); });
  page.on("pageerror", e => console.log("PAGEERR", String(e).slice(0, 300)));
  await page.goto(ORIGIN + `/${yard}/?nosw=1&debug=1`, {waitUntil: "domcontentloaded", timeout: 120000});
  if (yard === "desert") {
    await page.waitForFunction(() => window.__ready && window.__desReady && window.__desQA && window.__desQA().ready, {timeout: 300000, polling: 500});
    await page.evaluate(() => {
      const q = window.__desQA(), C = window.__C();
      document.body.classList.add("col", "snc");
      for (const s of [".t", "#fab", "#sbtn", "#tp", "#ld"]) { const n = document.querySelector(s); if (n) n.style.display = "none"; }
      q.freeze(true); q.tod("day"); window.__set({weather: "sun", ct: "clear", wind: .72});
      C.Ce.enabled = false; q.sim(2);
    });
  } else {
    await page.waitForFunction(() => window.__ready && window.__seaReady, {timeout: 180000, polling: 500});
    await sleep(1500);
  }
}
const frames = (page, n) => page.evaluate(n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
async function shot(page, name) {
  await frames(page, 3); await sleep(80);
  const f = path.join(OUT, name);
  await page.screenshot({path: f, type: "png"});
  console.log("shot", f);
  return f;
}
function cap(page, text) {
  return page.evaluate(text => {
    let d = document.getElementById("d156cap");
    if (!text) { if (d) d.remove(); return; }
    if (!d) { d = document.createElement("div"); d.id = "d156cap"; document.body.appendChild(d); }
    d.textContent = text;
    d.style.cssText = "position:fixed;left:18px;bottom:16px;z-index:50;pointer-events:none;font:600 20px 'WenQuanYi Micro Hei','Droid Sans Fallback',sans-serif;color:#fff;letter-spacing:.02em;text-shadow:0 1px 2px #000,0 0 4px #000";
  }, text || "");
}

const page = await browser.newPage();
await page.setViewport({width: W, height: H, deviceScaleFactor: 1});
const want = k => WHICH === "all" || WHICH === k || WHICH.split(",").includes(k);
const fails = [];

try {
  if (want("crab") || want("crabvid") || want("sand") || want("run")) await boot(page, "desert");
  const live = await page.evaluate(() => ({desert: window.CY && window.CY.desert, os: window.CY && window.CY.ms && window.CY.ms.ostrich_v2af}));
  console.log("live", JSON.stringify(live));
  if (!live.desert || !/desert\.[0-9a-f]+\.js$/.test(live.desert)) fails.push("desert bundle missing");
  if (!live.os) fails.push("ostrich_v2af not in the live manifest");

  async function crabAim(gape) {
    await page.evaluate(gape => {
      const q = window.__desQA(), C = window.__C(), c = q.CR.list[q.CR._proof];
      q.CR.calm = true; q.CR.vis = 1; q.CR.U.uVis.value = 1; q.CR.im.visible = true;
      q.CR.gapePin = gape; c.gape = gape;
      c.mode = "out"; c.t = 999; c.sk = 0; c.up = 0; c.v = 0; c.feed = 0; c.walk = 0;
      c.x = c.bx; c.z = c.bz; c.y = q.hTop(c.x, c.z);
      q.step(4, 1 / 30);
      c.mode = "out"; c.up = 0; c.feed = 0; c.gape = gape; c.x = c.bx; c.z = c.bz; c.sk = 0;
      const fw = Math.sin(c.yaw), fz = Math.cos(c.yaw);
      const dist = .30, tx = c.x + fw * .075, tz = c.z + fz * .075, ty = c.y + .015;
      q.lookAt(tx + fw * dist, ty + .045, tz + fz * dist, tx, ty - .002, tz);
      C.De.fov = 18; C.De.near = .008; C.De.updateProjectionMatrix();
    }, gape);
  }

  if (want("crab") || want("crabvid")) {
    const info = await page.evaluate(() => {
      const q = window.__desQA();
      const c = q.CR.list.slice().sort((a, b) => q.pN(b.bx, b.bz) - q.pN(a.bx, a.bz))[0];
      c.x = c.bx; c.z = c.bz; c.y = q.hTop(c.x, c.z); c.mode = "out"; c.t = 999; c.sk = 0; c.v = 0; c.up = 0; c.feed = 0; c.walk = 0;
      q.CR.calm = true; q.CR.gapePin = 0; c.gape = 0; q.step(8, 1 / 30);
      for (const o of q.CR.list) if (o !== c) o.mode = "in";
      q.CR._proof = q.CR.list.indexOf(c);
      return {i: q.CR._proof, x: +c.x.toFixed(3), z: +c.z.toFixed(3), yaw: +c.yaw.toFixed(3), gape: +c.gape.toFixed(3), n: q.CR.list.length};
    });
    console.log("crab", JSON.stringify(info));
  }
  if (want("crab")) {
    await cap(page, "");
    await crabAim(0); await frames(page, 24);
    await crabAim(0); await frames(page, 6); await shot(page, "B_crab_claw_closed.png");
    await crabAim(1); await frames(page, 6); await shot(page, "B_crab_claw_open.png");
  }
  if (want("crabvid")) {
    await cap(page, "");
    await crabAim(0); await frames(page, 20);
    const dir = path.join(OUT, "crab-frames");
    fs.rmSync(dir, {recursive: true, force: true}); fs.mkdirSync(dir);
    const N = 24 * 3;
    for (let i = 0; i < N; i++) {
      const u = i / (N - 1);
      const g = u < .12 ? 0 : u < .40 ? (u - .12) / .28 : u < .55 ? 1 : u < .83 ? 1 - (u - .55) / .28 : 0;
      await page.evaluate(g => {
        const q = window.__desQA(), C = window.__C(), c = q.CR.list[q.CR._proof];
        q.CR.calm = true; q.CR.vis = 1; q.CR.U.uVis.value = 1;
        q.CR.gapePin = g; c.gape = g;
        c.mode = "out"; c.t = 999; c.sk = 0; c.up = 0; c.v = 0; c.feed = 0; c.walk = 0;
        const x = c.bx, z = c.bz;
        q.step(1, 1 / 24);
        c.x = x; c.z = z; c.mode = "out"; c.sk = 0; c.up = 0; c.gape = g;
        const fw = Math.sin(c.yaw), fz = Math.cos(c.yaw);
        const dist = .30, tx = x + fw * .075, tz = z + fz * .075, ty = q.hTop(x, z) + .015;
        q.lookAt(tx + fw * dist, ty + .045, tz + fz * dist, tx, ty - .002, tz);
        C.De.fov = 18; C.De.near = .008; C.De.updateProjectionMatrix();
      }, g);
      await frames(page, 1);
      await page.screenshot({path: path.join(dir, String(i).padStart(4, "0") + ".png")});
    }
    await ffmpeg(["-framerate", "24", "-i", path.join(dir, "%04d.png"), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", path.join(OUT, "crab-claw-open-close.mp4")]);
    console.log("encoded crab");
  }
  if (want("sand")) {
    await page.evaluate(() => {
      const q = window.__desQA(), C = window.__C();
      window.__set({weather: "sun", ct: "clear", wind: .8});
      q.sfR(null); q.windPin(null); q.sim(4);
      q.lookAt(58, 6, 40, 4, -10, 2);
      C.De.fov = 36; C.De.near = .15; C.De.updateProjectionMatrix();
    });
    await cap(page, "");
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
    await cap(page, "近景 · 近距减薄之后（背风积雪检查）");
    await shot(page, "B_sandfall_near.png");
    await cap(page, "");
    if (near.nearD > 7.6) fails.push("near sand shot is outside the lee-snow thinning band");

    const sea = await browser.newPage();
    await sea.setViewport({width: W, height: H, deviceScaleFactor: 1});
    await boot(sea, "sea");
    await sea.evaluate(() => {
      document.body.classList.add("col", "snc");
      for (const s of [".t", "#fab", "#sbtn", "#tp", "#ld"]) { const n = document.querySelector(s); if (n) n.style.display = "none"; }
      const C = window.__C();
      C.Ce.enabled = false;
      C.De.position.set(22, 7, 16);
      C.Ce.target.set(0, -5, 0);
      C.De.lookAt(C.Ce.target);
      C.De.fov = 38; C.De.near = .2; C.De.updateProjectionMatrix();
      if (window.__set) window.__set({weather: "sun", ct: "clear", wind: .4});
    });
    await frames(sea, 8); await sleep(400);
    const seaP = path.join(OUT, "B_sea_fall_far.png");
    await sea.screenshot({path: seaP});
    console.log("shot sea");
    await sea.close();
    await ffmpeg(["-i", path.join(OUT, "B_sandfall_far.png"), "-i", seaP, "-filter_complex", "[0:v]scale=960:540[a];[1:v]scale=960:540[b];[a][b]hstack", path.join(OUT, "B_sand_vs_sea_far.png")]);
    console.log("composited sand vs sea");
  }
  if (want("run")) {
    const info = await page.evaluate(() => {
      const q = window.__desQA();
      q.PA.noView = true;
      if (q.ANIM.eagle && q.ANIM.eagle.pos) q.ANIM.eagle.pos.set(40, 22, 40);
      q.ANIM.camels.forEach((c, i) => { c.x = -22; c.z = 16 - i * 4; c.g.position.set(c.x, q.hTop(c.x, c.z), c.z); });
      if (q.rsPut) q.rsPut(18, 14, 0);
      const slope = (x, z) => {
        let dh = 0;
        for (const [dx, dz] of [[.6, 0], [-.6, 0], [0, .6], [0, -.6]]) dh = Math.max(dh, Math.abs(q.hTop(x + dx, z + dz) - q.hTop(x, z)));
        return dh;
      };
      const ok = (x, z) => q.sN(x, z) < .74 && q.pN(x, z) >= 3.45 && q.osOpen(x, z) && q.dune.dMask(x, z) < .18 && slope(x, z) < .16
        && Math.hypot(x - q.FIRE.x, z - q.FIRE.z) > 6 && Math.hypot(x - q.TENT.x, z - q.TENT.z) > 5;
      let best = null;
      for (let a = 0; a < 16; a++) {
        const yaw = a * Math.PI / 8, dx = Math.sin(yaw), dz = Math.cos(yaw);
        for (let z0 = -14; z0 <= 10; z0 += .7) for (let x0 = -16; x0 <= 16; x0 += .7) {
          if (!ok(x0, z0)) continue;
          let len = 0;
          for (; len < 36; len += .35) { if (!ok(x0 + dx * len, z0 + dz * len)) break; }
          if (!best || len > best.len) best = {x0, z0, yaw, dx, dz, len: +len.toFixed(2)};
        }
      }
      if (!best || best.len < 14) return {best, fail: "no sand run with pN>=3.45"};
      const A = q.PA.os.find(o => o.male) || q.PA.os[0];
      const travel = Math.min(best.len - 1.2, 22);
      const x1 = best.x0 + best.dx * travel, z1 = best.z0 + best.dz * travel;
      const x2 = best.x0 + best.dx * (travel + 8), z2 = best.z0 + best.dz * (travel + 8);
      q.osPlace(A, best.x0, best.z0, best.yaw);
      A.path = [{x: best.x0, z: best.z0}, {x: x1, z: z1}, {x: x2, z: z2}];
      A.pi = 1; A.mode = "run"; A.vmax = 4.9; A.v = 4.6; A.t = 999; A.runT = 999; A.then = null; A.thr = null; A.P.sit = 0;
      for (const o of q.PA.os) if (o !== A) { o.mode = "sit"; o.t = 999; o.g.visible = false; }
      const side = 1;
      const cam = () => {
        const C = window.__C(), dist = 8.2;
        const px = A.x + Math.cos(best.yaw) * dist * side, pz = A.z - Math.sin(best.yaw) * dist * side;
        q.lookAt(px, A.gy + 1.25, pz, A.x, A.gy + 1.05, A.z);
        C.De.fov = 30; C.De.near = .05; C.De.updateProjectionMatrix();
        for (const o of q.PA.os) if (o !== A) o.g.visible = false;
      };
      cam();
      for (let i = 0; i < 28; i++) { A.mode = "run"; A.t = 999; A.vmax = 4.9; q.step(1, 1 / 24); cam(); }
      window.__run = {yaw: best.yaw, side, x1, z1};
      const act = A.rig && A.rig.acts.fast_run;
      return {best, x: +A.x.toFixed(2), z: +A.z.toFixed(2), v: +A.v.toFixed(2), mode: A.mode, cur: A.rig && A.rig.cur, pN: +q.pN(A.x, A.z).toFixed(2), clip: act ? +act.time.toFixed(3) : null, clips: A.rig ? Object.keys(A.rig.acts) : []};
    });
    console.log("run path", JSON.stringify(info));
    if (!info || info.fail) fails.push(info && info.fail || "run path failed");
    else {
      const dir = path.join(OUT, "run-frames");
      fs.rmSync(dir, {recursive: true, force: true}); fs.mkdirSync(dir);
      const N = 24 * 4;
      const samples = [];
      let wraps = 0, prev = info.clip;
      for (let i = 0; i < N; i++) {
        const s = await page.evaluate(() => {
          const q = window.__desQA(), A = q.PA.os.find(o => o.male) || q.PA.os[0], R = window.__run;
          q.step(1, 1 / 24);
          const C = window.__C(), dist = 8.2, side = R.side, yaw = R.yaw;
          const px = A.x + Math.cos(yaw) * dist * side, pz = A.z - Math.sin(yaw) * dist * side;
          q.lookAt(px, A.gy + 1.25, pz, A.x, A.gy + 1.05, A.z);
          C.De.fov = 30; C.De.near = .05; C.De.updateProjectionMatrix();
          for (const o of q.PA.os) if (o !== A) o.g.visible = false;
          const act = A.rig && A.rig.acts.fast_run;
          const cap = document.getElementById("d156cap");
          return {x: +A.x.toFixed(2), z: +A.z.toFixed(2), v: +A.v.toFixed(2), mode: A.mode, pN: +q.pN(A.x, A.z).toFixed(2), sN: +q.sN(A.x, A.z).toFixed(2), clip: act ? +act.time.toFixed(3) : null, cur: A.rig && A.rig.cur, cap: cap ? cap.textContent : ""};
        });
        if (i > 6 && (s.mode !== "run" || s.cur !== "fast_run")) break;
        if (prev != null && s.clip != null && s.clip < prev - .04) wraps++;
        prev = s.clip;
        samples.push(s);
        await frames(page, 1);
        await page.screenshot({path: path.join(dir, String(samples.length - 1).padStart(4, "0") + ".png")});
      }
      const summary = {n: samples.length, wraps, modes: [...new Set(samples.map(s => s.mode + "/" + s.cur))], minPN: Math.min(...samples.map(s => s.pN)), minV: Math.min(...samples.map(s => s.v)), maxSN: Math.max(...samples.map(s => s.sN)), cap: samples.some(s => s.cap)};
      console.log("run", JSON.stringify(summary));
      fs.writeFileSync(path.join(OUT, "run-path.json"), JSON.stringify({info, summary}, null, 2));
      if (summary.minPN < 3.4) fails.push("run pN dipped under 3.4");
      if (summary.wraps < 3) fails.push("run has fewer than 3 gait cycles");
      if (!summary.modes.every(m => m === "run/fast_run")) fails.push("run left fast_run");
      if (summary.cap) fails.push("run has a caption overlay");
      await ffmpeg(["-framerate", "24", "-i", path.join(dir, "%04d.png"), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", path.join(OUT, "ostrich_v2af-run-side.mp4")]);
      console.log("encoded run");
    }
  }
} finally {
  await browser.close(); server.close();
}
if (fails.length) { console.log("PROOF FAIL", fails.join("; ")); process.exit(1); }
console.log("d156 proofs ok");
