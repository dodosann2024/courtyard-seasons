// Desert #155 proof stills and clips. Not part of CI.
// Usage: node tools/e2e/d155-proof.mjs [gerbil|crab|agama|sand|sea|run|all]
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {execFile} from "node:child_process";
import puppeteer from "puppeteer-core";
const ffmpeg = args => new Promise((res, rej) => execFile("ffmpeg", ["-y", ...args], {maxBuffer: 1e8}, (e, _o, se) => e ? rej(new Error(String(se).slice(-500))) : res()));

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = process.env.OUT || "/tmp/d155";
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
    let d = document.getElementById("d155cap");
    if (!text) { if (d) d.remove(); return; }
    if (!d) { d = document.createElement("div"); d.id = "d155cap"; document.body.appendChild(d); }
    d.textContent = text;
    d.style.cssText = "position:fixed;left:22px;top:18px;z-index:50;pointer-events:none;font:700 34px 'WenQuanYi Micro Hei','Droid Sans Fallback',sans-serif;color:#fff;letter-spacing:.04em;text-shadow:0 1px 2px #000,0 0 4px #000";
  }, text || "");
}

const page = await browser.newPage();
await page.setViewport({width: W, height: H, deviceScaleFactor: 1});
const want = k => WHICH === "all" || WHICH === k || WHICH.split(",").includes(k);

try {
  if (want("gerbil") || want("gerbilgrid") || want("crab") || want("agama") || want("sand") || want("run")) {
    await boot(page, "desert");
  }
  if (want("gerbilgrid")) {
    await page.evaluate(() => {
      const q = window.__desQA(), A = q.PA.gb[0];
      q.PA.noView = true;
      A.x = -1.2; A.z = -2.4; A.yaw = 0.2; A.gy = q.hTop(A.x, A.z);
      A.mode = "look"; A.t = 99; A.out = true; A.P.in = 0; A.P.up = 0; A.v = 0;
      for (let i = 0; i < 20; i++) { A.mode = "look"; A.t = 99; A.v = 0; A.x = -1.2; A.z = -2.4; q.step(1, 1 / 30); }
      A.g.updateMatrixWorld(true);
      window.__pose0 = {};
      for (const [n, b] of Object.entries(A.bn)) window.__pose0[n] = {x: b.quaternion.x, y: b.quaternion.y, z: b.quaternion.z, w: b.quaternion.w, px: b.position.x, py: b.position.y, pz: b.position.z};
    });
    const variants = [["x", 1.55], ["x", 2.05]];
    for (const [axis, ang] of variants) {
      const h = await page.evaluate((axis, ang) => {
        const q = window.__desQA(), C = window.__C(), A = q.PA.gb[0];
        const mul = (b, ang) => {
          const s = Math.sin(ang / 2), c = Math.cos(ang / 2);
          const qx = axis === "x" ? s : 0, qy = axis === "y" ? s : 0, qz = axis === "z" ? s : 0;
          const x = b.quaternion.x, y = b.quaternion.y, z = b.quaternion.z, w = b.quaternion.w;
          b.quaternion.set(w * qx + x * c + y * qz - z * qy, w * qy - x * qz + y * c + z * qx, w * qz + x * qy - y * qx + z * c, w * c - x * qx - y * qy - z * qz);
        };
        for (const [n, b] of Object.entries(A.bn)) { const p = window.__pose0[n]; if (!p) continue; b.quaternion.set(p.x, p.y, p.z, p.w); }
        const bn = n => A.bn[n];
        const pitch = ["pelvis", "spine1", "spine2", "spine3", "neck", "head", "thighL", "thighR", "shinL", "shinR", "footL", "footR", "upperarmL", "upperarmR"];
        const sign = {pelvis: 1, spine1: .25, spine2: .15, neck: -.5, head: -.35, thighL: -.8, thighR: -.8, shinL: .9, shinR: .9, footL: -.4, footR: -.4, upperarmL: .7, upperarmR: .7};
        for (const n of pitch) if (bn(n) && sign[n]) mul(bn(n), ang * sign[n]);
        A.g.visible = true; A.g.updateMatrixWorld(true);
        const loc = n => { const b = bn(n); b.updateWorldMatrix(true, false); const e = b.matrixWorld.elements; const v = q.W.worldToLocal(C.De.position.clone().set(e[12], e[13], e[14])); return +v.y.toFixed(3); };
        const yaw = A.yaw, dist = .5;
        q.lookAt(A.x + Math.sin(yaw + Math.PI / 2) * dist, A.gy + .08, A.z + Math.cos(yaw + Math.PI / 2) * dist, A.x, A.gy + .06, A.z);
        C.De.fov = 26; C.De.near = .02; C.De.updateProjectionMatrix();
        return {head: loc("head"), foot: loc("footL"), pel: loc("pelvis")};
      }, axis, ang);
      console.log("grid", axis, ang, JSON.stringify(h));
      await shot(page, `gerbil-${axis}${ang > 0 ? "p" : "n"}.png`);
    }
  }
  if (want("gerbil")) {
    const info = await page.evaluate(() => {
      const q = window.__desQA(), A = q.PA.gb[0];
      q.PA.noView = true;
      if (q.ANIM.eagle && q.ANIM.eagle.pos) q.ANIM.eagle.pos.set(30, 18, 30);
      const far = (o, x, z) => { o.x = x; o.z = z; if (o.g) o.g.position.set(x, q.hTop(x, z), z); };
      q.PA.os.forEach((o, i) => far(o, 20, -14 - i));
      q.PA.tt.forEach((o, i) => far(o, -18, -12 - i));
      q.PA.sc.forEach((o, i) => { o.mode = "hide"; o.g.visible = false; });
      q.PA.gb.forEach((g, i) => { if (g !== A) { g.mode = "in"; g.g.visible = false; } });
      if (q.ANIM.rs) q.rsPut(18, 12, 0);
      q.ANIM.camels.forEach((c, i) => { c.x = -16; c.z = -14 - i * 3; c.g.position.set(c.x, q.hTop(c.x, c.z), c.z); });
      A.x = 10.2; A.z = 2.6; A.yaw = 1.1; A.gy = q.hTop(A.x, A.z);
      A.mode = "stand"; A.t = 99; A.out = true; A.P.in = 0; A.P.up = 0; A.v = 0; A.goal = null;
      A.g.position.set(A.x, A.gy, A.z); A.g.rotation.y = A.yaw; A.g.visible = true;
      q.lookAt(A.x + Math.sin(A.yaw + Math.PI / 2) * .8, A.gy + .12, A.z + Math.cos(A.yaw + Math.PI / 2) * .8, A.x, A.gy + .06, A.z);
      window.__C().De.fov = 28; window.__C().De.near = .02; window.__C().De.updateProjectionMatrix();
      for (let i = 0; i < 40; i++) { A.mode = "stand"; A.t = 99; A.v = 0; A.x = 10.2; A.z = 2.6; A.yaw = 1.1; q.step(1, 1 / 30); A.g.visible = true; }
      A.mode = "stand"; A.t = 99; A.gy = q.hTop(A.x, A.z);
      A.g.position.set(A.x, A.gy, A.z); A.g.rotation.y = A.yaw; A.g.visible = true;
      for (const g of q.PA.gb) if (g !== A) g.g.visible = false;
      for (const t of q.PA.tt) t.g.visible = false;
      for (const o of q.PA.os) o.g.visible = false;
      for (const s of q.PA.sc) s.g.visible = false;
      const bone = n => A.bn[n] || A.bn[n.replace(/\./g, "")];
      const loc = n => {
        const b = bone(n); if (!b) return null;
        b.updateWorldMatrix(true, false); const e = b.matrixWorld.elements;
        const v = q.W.worldToLocal(window.__C().De.position.clone().set(e[12], e[13], e[14]));
        return {x: +v.x.toFixed(3), y: +v.y.toFixed(3), z: +v.z.toFixed(3)};
      };
      const quat = A.bn.pelvis ? [A.bn.pelvis.quaternion.x, A.bn.pelvis.quaternion.y, A.bn.pelvis.quaternion.z, A.bn.pelvis.quaternion.w].map(v => +v.toFixed(3)) : null;
      const names = ["head", "neck", "pelvis", "spine1", "footL", "footR", "thighL", "shinL", "handL"];
      const bones = {}; for (const n of names) bones[n] = loc(n);
      const keys = Object.keys(A.bn).filter(k => /head|pelvis|spine|thigh|shin|foot|arm|hand|neck/.test(k));
      return {x: A.x, z: A.z, yaw: A.yaw, gy: +A.gy.toFixed(3), up: A.P.up, mode: A.mode, quat, bones, keys};
    });
    fs.writeFileSync(path.join(OUT, "gerbil-bones.json"), JSON.stringify(info, null, 2));
    console.log("gerbil", JSON.stringify(info.bones));
    const place = (side) => page.evaluate(side => {
      const q = window.__desQA(), C = window.__C(), A = q.PA.gb[0];
      A.g.visible = true;
      const yaw = A.yaw, dist = side === "front" ? .42 : .48, lift = .07;
      const ang = yaw + (side === "front" ? 0 : Math.PI / 2);
      q.lookAt(A.x + Math.sin(ang) * dist, A.gy + lift, A.z + Math.cos(ang) * dist, A.x, A.gy + .055, A.z);
      C.De.fov = side === "front" ? 26 : 28; C.De.near = .02; C.De.updateProjectionMatrix();
    }, side);
    await place("side"); await shot(page, "B_gerbil_stand_side.png");
    await place("front"); await shot(page, "B_gerbil_stand_front.png");
  }
  if (want("crab")) {
    const info = await page.evaluate(() => {
      const q = window.__desQA();
      let c = q.CR.list[0];
      for (const o of q.CR.list) if (q.pN(o.bx, o.bz) > c && false) {}
      c = q.CR.list.slice().sort((a, b) => q.pN(b.bx, b.bz) - q.pN(a.bx, a.bz))[0];
      c.x = c.bx; c.z = c.bz; c.y = q.hTop(c.x, c.z); c.mode = "out"; c.t = 99; c.sk = 0; c.v = 0; c.up = 0; c.feed = 0; c.walk = 0;
      q.CR.gapePin = 1; q.step(25, 1 / 30);
      for (const o of q.CR.list) if (o !== c) o.mode = "in";
      q.CR._proof = q.CR.list.indexOf(c);
      const g = q.CR.im.geometry, K = g.attributes.aK.array, J = g.attributes.aJ.array, P = g.attributes.position.array;
      let nd = 0, far = 0, maxD = 0;
      for (let i = 0; i < K.length; i++) if (K[i] > 11.5) { nd++; const d = Math.hypot(P[i * 3] - J[i * 3], P[i * 3 + 1] - J[i * 3 + 1], P[i * 3 + 2] - J[i * 3 + 2]); if (d > maxD) maxD = d; if (d > .03) far++; }
      return {i: q.CR._proof, x: +c.x.toFixed(3), z: +c.z.toFixed(3), yaw: +c.yaw.toFixed(3), gape: +c.gape.toFixed(3), n: q.CR.list.length, dactyl: nd, far, maxD: +maxD.toFixed(4)};
    });
    console.log("crab", JSON.stringify(info));
    const aim = (gape, close) => page.evaluate((gape, close) => {
      const q = window.__desQA(), C = window.__C(), c = q.CR.list[q.CR._proof];
      q.lookAt(c.x + 6, c.y + 3, c.z + 6, c.x, c.y, c.z);
      q.CR.gapePin = gape; c.gape = gape; c.mode = "face"; c.t = 99; c.sk = 0; c.up = 0; c.v = 0; c.feed = 0;
      q.step(8, 1 / 30);
      c.mode = "out"; c.t = 99; c.sk = 0; c.v = 0; c.up = 0;
      q.step(6, 1 / 30);
      const fw = Math.sin(c.yaw), fz = Math.cos(c.yaw), rt = Math.cos(c.yaw), rz = -Math.sin(c.yaw);
      const dist = close ? .5 : .85, aimZ = close ? .05 : .04;
      q.CR.calm = true;
      const tx = c.x + fw * aimZ, tz = c.z + fz * aimZ, ty = c.y + .03;
      q.lookAt(tx + fw * dist + rt * (close ? .04 : 0), ty + (close ? .05 : .1), tz + fz * dist + rz * (close ? .04 : 0), tx, ty, tz);
      C.De.fov = close ? 22 : 30; C.De.near = .01; C.De.updateProjectionMatrix();
    }, gape, close);
    await aim(1, true); await shot(page, "B_crab_claw_open.png");
    await aim(0, true); await shot(page, "B_crab_claw_closed.png");
    await aim(1, false); await shot(page, "B_crab_claw_mid.png");
  }
  if (want("agama")) {
    const info = await page.evaluate(() => {
      const q = window.__desQA();
      const out = [];
      const spot = (i) => {
        for (let z = -4; z <= 6; z += .6) for (let x = -6; x <= 8; x += .6) {
          if (q.sN(x, z) > .62 || q.pN(x, z) < 1.5) continue;
          if (q.OBST.some(o => Math.hypot(o.x - x, o.z - z) < o.r + .45)) continue;
          if (i === 0 && x < 1) continue;
          if (i === 1 && x > -1) continue;
          return {x, z};
        }
        return {x: i ? -4 : 4, z: 1};
      };
      q.AG.list.forEach((a, i) => {
        const s = spot(i);
        a.palm = null; a.path = null; a.mode = "idle"; a.timer = 999; a.cond = "d"; a.ry = -99; a.then = null;
        a.x = s.x; a.z = s.z; a.yaw = .9;
        a.Tb = .78; if (a.male) { a.warm = .8; a.U.uWarm.value = .8; }
        q.fn.play(a.r, "idle", .05, 1);
      });
      q.step(20, 1 / 30);
      q.AG.list.forEach(a => {
        if (a.male) { a.warm = .8; a.U.uWarm.value = .8; a.Tb = .78; }
        a.g.updateMatrixWorld(true);
        const e = a.g.matrixWorld.elements;
        const v = q.W.worldToLocal(window.__C().De.position.clone().set(e[12], e[13], e[14]));
        out.push({male: !!a.male, x: +a.x.toFixed(3), z: +a.z.toFixed(3), y: +v.y.toFixed(3), mode: a.mode, warm: a.male ? +a.U.uWarm.value.toFixed(3) : 0});
      });
      return out;
    });
    console.log("agama", JSON.stringify(info));
    for (const male of [false, true]) {
      await page.evaluate(male => {
        const q = window.__desQA(), C = window.__C(), a = q.AG.list.find(x => !!x.male === male);
        a.g.updateMatrixWorld(true);
        const e = a.g.matrixWorld.elements;
        const v = q.W.worldToLocal(C.De.position.clone().set(e[12], e[13], e[14]));
        const yaw = a.yaw, dist = .22;
        const ang = yaw + Math.PI / 2;
        q.lookAt(v.x + Math.sin(ang) * dist, v.y + .045, v.z + Math.cos(ang) * dist, v.x + Math.sin(yaw) * .03, v.y + .035, v.z + Math.cos(yaw) * .03);
        C.De.fov = 18; C.De.near = .004; C.De.updateProjectionMatrix();
      }, male);
      await cap(page, "西奈飞蜥");
      await shot(page, male ? "B_agama_male_scales.png" : "B_agama_female_scales.png");
      await cap(page, "");
    }
  }
  if (want("sand")) {
    await page.evaluate(() => {
      const q = window.__desQA(), C = window.__C();
      window.__set({weather: "sun", ct: "clear", wind: .8});
      q.sfR(null); q.windPin(null); q.sim(4);
      q.lookAt(58, 6, 40, 4, -10, 2);
      C.De.fov = 36; C.De.near = .15; C.De.updateProjectionMatrix();
    });
    await shot(page, "B_sandfall_far.png");
  }
  if (want("run")) {
    const info = await page.evaluate(() => {
      const q = window.__desQA();
      q.PA.noView = true;
      const ok = (x, z) => q.sN(x, z) < .78 && q.pN(x, z) > 1.55 && q.osOpen(x, z) && Math.hypot(x - q.FIRE.x, z - q.FIRE.z) > 6 && Math.hypot(x - q.TENT.x, z - q.TENT.z) > 5;
      let best = null;
      for (let z = -12; z <= 8; z += .8) for (let x0 = -16; x0 <= 6; x0 += .8) {
        let len = 0;
        for (let x = x0; len < 32; x += .4) { if (!ok(x, z)) break; len += .4; }
        if (!best || len > best.len) best = {x0, x1: x0 + len, z, len: +len.toFixed(2), axis: "x"};
      }
      for (let x = -14; x <= 12; x += .8) for (let z0 = -12; z0 <= 6; z0 += .8) {
        let len = 0;
        for (let z = z0; len < 32; z += .4) { if (!ok(x, z)) break; len += .4; }
        if (!best || len > best.len) best = {z0, z1: z0 + len, x, len: +len.toFixed(2), axis: "z"};
      }
      const alongX = best.axis === "x";
      const A = q.PA.os.find(o => o.male) || q.PA.os[0];
      const yaw = alongX ? Math.PI / 2 : 0;
      const x0 = alongX ? best.x0 + .8 : best.x, z0 = alongX ? best.z : best.z0 + .8;
      const x1 = alongX ? best.x1 - .6 : best.x, z1 = alongX ? best.z : best.z1 - .6;
      q.osPlace(A, x0, z0, yaw);
      A.path = [{x: x0, z: z0}, {x: x1, z: z1}]; A.pi = 1; A.mode = "run"; A.vmax = 5.1; A.v = 4.8; A.t = 999; A.runT = 999; A.then = null; A.P.sit = 0; A.thr = null;
      for (const o of q.PA.os) if (o !== A) { o.mode = "sit"; o.t = 999; o.g.visible = false; }
      window.__run = {alongX};
      const cam = () => {
        const C = window.__C(), s = 6.6;
        const px = alongX ? A.x : A.x + s, pz = alongX ? A.z + s : A.z;
        q.lookAt(px, A.gy + 1.4, pz, A.x, A.gy + 1.15, A.z);
        C.De.fov = 30; C.De.near = .05; C.De.updateProjectionMatrix();
        for (const o of q.PA.os) if (o !== A) o.g.visible = false;
      };
      cam();
      for (let i = 0; i < 16; i++) { q.step(1, 1 / 24); cam(); }
      window.__run.cam = true;
      return best;
    });
    console.log("run path", JSON.stringify(info));
    const dir = path.join(OUT, "run-frames");
    fs.rmSync(dir, {recursive: true, force: true}); fs.mkdirSync(dir);
    const N = 24 * 4;
    const samples = [];
    for (let i = 0; i < N; i++) {
      const s = await page.evaluate(() => {
        const q = window.__desQA(), A = q.PA.os.find(o => o.male) || q.PA.os[0], alongX = window.__run.alongX;
        q.step(1, 1 / 24);
        const C = window.__C(), s = 6.6;
        const px = alongX ? A.x : A.x + s, pz = alongX ? A.z + s : A.z;
        q.lookAt(px, A.gy + 1.4, pz, A.x, A.gy + 1.15, A.z);
        C.De.fov = 30; C.De.near = .05; C.De.updateProjectionMatrix();
        for (const o of q.PA.os) if (o !== A) o.g.visible = false;
        const act = A.rig && A.rig.acts.fast_run;
        return {x: +A.x.toFixed(2), z: +A.z.toFixed(2), v: +A.v.toFixed(2), mode: A.mode, pN: +q.pN(A.x, A.z).toFixed(2), sN: +q.sN(A.x, A.z).toFixed(2), clip: act ? +act.time.toFixed(3) : null, cur: A.rig && A.rig.cur};
      });
      samples.push(s);
      await frames(page, 1);
      await page.screenshot({path: path.join(dir, String(i).padStart(4, "0") + ".png")});
    }
    const summary = {n: N, modes: [...new Set(samples.map(s => s.mode + "/" + s.cur))], minPN: Math.min(...samples.map(s => s.pN)), maxSN: Math.max(...samples.map(s => s.sN)), v: [samples[0].v, samples[N - 1].v], clip: [samples[0].clip, samples[N - 1].clip]};
    console.log("run", JSON.stringify(summary));
    fs.writeFileSync(path.join(OUT, "run-path.json"), JSON.stringify({info, summary}, null, 2));
    await ffmpeg(["-framerate", "24", "-i", path.join(dir, "%04d.png"), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", path.join(OUT, "ostrich-v2z2-run-side.mp4")]);
    console.log("encoded run");
  }
  if (want("crabvid")) {
    await page.evaluate(() => {
      const q = window.__desQA(), c = q.CR.list[q.CR._proof];
      q.CR.calm = true; q.CR.gapePin = 0; c.mode = "out"; c.t = 999; c.sk = 0; c.up = 0; c.v = 0; c.x = c.bx; c.z = c.bz;
      q.lookAt(c.x + 4, c.y + 2, c.z + 4, c.x, c.y, c.z);
      q.step(10, 1 / 24);
    });
    const dir = path.join(OUT, "crab-frames");
    fs.rmSync(dir, {recursive: true, force: true}); fs.mkdirSync(dir);
    const N = 24 * 3;
    for (let i = 0; i < N; i++) {
      await page.evaluate(i => {
        const q = window.__desQA(), c = q.CR.list[q.CR._proof];
        const u = i / (24 * 3 - 1);
        const g = u < .5 ? u * 2 : 1 - (u - .5) * 2;
        q.CR.calm = true; q.CR.gapePin = g; c.gape = g; c.mode = "out"; c.t = 999; c.sk = 0; c.up = 0; c.v = 0; c.feed = 0;
        const x = c.bx, z = c.bz;
        q.step(1, 1 / 24);
        c.x = x; c.z = z; c.mode = "out"; c.sk = 0;
        const fw = Math.sin(c.yaw), fz = Math.cos(c.yaw);
        const tx = x + fw * .05, tz = z + fz * .05;
        q.lookAt(tx + fw * .85, c.y + .12, tz + fz * .85, tx, c.y + .03, tz);
        const C = window.__C(); C.De.fov = 28; C.De.near = .02; C.De.updateProjectionMatrix();
      }, i);
      await frames(page, 1);
      await page.screenshot({path: path.join(dir, String(i).padStart(4, "0") + ".png")});
    }
    await ffmpeg(["-framerate", "24", "-i", path.join(dir, "%04d.png"), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", path.join(OUT, "crab-claw-open-close.mp4")]);
    console.log("encoded crab");
  }
  if (want("sea")) {
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
    await sea.screenshot({path: path.join(OUT, "B_sea_fall_far.png")});
    console.log("shot sea");
    await sea.close();
  }
} finally {
  if (WHICH !== "keep") { await browser.close(); server.close(); }
}
