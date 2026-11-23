// Desert #161 proofs. crab_v6c: claw angles measured in the scene by time as the quaternion angle from each bone's rest (crmeasure),
// the claw_pinch close-up and a bite / wide-open pair (crpinch), the idle dactyl flick (cridle), planted-foot slip walking and
// scuttling (crslip), dig at full size (crdig), and a scare all the way down the burrow (crbur). The Sinai agama basking, close
// (agbask), and in rain up in the crown (agrain). The tent in rain with its sound and where the ostriches are (tent, osstress).
// Clips are stepped at 24 fps. Not part of CI.
// Usage: node tools/e2e/d161-proof.mjs [crmeasure|crpinch|crcmp|cridle|crslip|crdig|crbur|agbask|agrain|tent|osstress|all]   (OUT=/tmp/d161)
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {execFile} from "node:child_process";
import puppeteer from "puppeteer-core";
const ffmpeg = args => new Promise((res, rej) => execFile("ffmpeg", ["-y", "-loglevel", "error", ...args], {maxBuffer: 1e8}, (e, _o, se) => e ? rej(new Error(String(se).slice(-500))) : res()));

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = process.env.OUT || "/tmp/d161";
const CHROME = process.env.CHROME || ["/usr/bin/google-chrome-stable", "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/local/bin/google-chrome"].find(p => fs.existsSync(p));
const WHICH = process.argv[2] || "all";
if (fs.existsSync(`/tmp/d161skip-${WHICH}`)) { console.log("skipped", WHICH); process.exit(0); }
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
const browser = await puppeteer.launch({executablePath: CHROME, headless: "new", protocolTimeout: 1800000,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader", "--autoplay-policy=no-user-gesture-required"]});

const HIDE = [".t", "#fab", "#sbtn", "#tp", "#ld"];
const page = await browser.newPage();
const crReq = new Set(), osReq = new Set();
page.on("request", r => { const k = /\/(crab_[a-z0-9_]+)\.glb/.exec(r.url()); if (k) crReq.add(k[1]); const m = /\/(ostrich_v2[a-z0-9]+)\.glb/.exec(r.url()); if (m) osReq.add(m[1]); });
page.on("console", m => { const t = m.type(); if (t === "error" || t === "warning") console.log("PAGE", t, m.text().slice(0, 240)); });
page.on("pageerror", e => console.log("PAGEERR", String(e).slice(0, 300)));
await page.setViewport({width: W, height: H, deviceScaleFactor: 1});
await page.goto(ORIGIN + "/desert/?nosw=1&debug=1", {waitUntil: "domcontentloaded", timeout: 120000});
await page.waitForFunction(() => window.__ready && window.__desReady && window.__desQA && window.__desQA().ready, {timeout: 300000, polling: 500});
await page.evaluate(HIDE => {
  const q = window.__desQA(), C = window.__C();
  document.body.classList.add("col", "snc");
  for (const s of HIDE) { const n = document.querySelector(s); if (n) n.style.display = "none"; }
  q.freeze(true); q.tod("day"); window.__set({weather: "sun", ct: "clear", wind: .3});
  C.Ce.enabled = false; q.sim(2);
}, HIDE);

const frames = async n => page.evaluate(n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
async function shot(name) { await frames(3); await sleep(80); const f = path.join(OUT, name); await page.screenshot({path: f, type: "png"}); console.log("shot", f); return f; }
const cap = text => page.evaluate(text => {
  let d = document.getElementById("d161cap");
  if (!text) { if (d) d.remove(); return; }
  if (!d) { d = document.createElement("div"); d.id = "d161cap"; document.body.appendChild(d); }
  d.textContent = text;
  d.style.cssText = "position:fixed;left:18px;bottom:16px;z-index:50;pointer-events:none;font:600 20px 'WenQuanYi Micro Hei','Droid Sans Fallback',sans-serif;color:#fff;letter-spacing:.02em;text-shadow:0 1px 2px #000,0 0 4px #000";
}, text || "");
const capIn = "(t => { let d = document.getElementById('d161cap'); if (d) d.textContent = t; })";
/* N frames at 24 fps into OUT/name.mp4: `each(i)` sets the scene up and the camera (and steps it), returning a sample */
async function vid(name, N, each, keep, fps = 24) {
  const dir = path.join(OUT, name + "-frames");
  fs.rmSync(dir, {recursive: true, force: true}); fs.mkdirSync(dir);
  const log = [];
  for (let i = 0; i < N; i++) {
    const s = await each(i); log.push(s);
    await frames(1);
    await page.screenshot({path: path.join(dir, String(i).padStart(4, "0") + ".png")});
    if (s && s.stop) break;
  }
  await ffmpeg(["-framerate", String(fps), "-i", path.join(dir, "%04d.png"), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", path.join(OUT, name + ".mp4")]);
  console.log("encoded", name, log.length);
  if (!keep) fs.rmSync(dir, {recursive: true, force: true});
  return {dir, log};
}
const frameAt = (dir, i) => path.join(dir, String(i).padStart(4, "0") + ".png");
const strip = (files, out, crop, w = 480) => ffmpeg([...files.flatMap(f => ["-i", f]), "-filter_complex",
  files.map((_, j) => `[${j}:v]${crop ? `crop=${crop},` : ""}scale=${w}:-2[s${j}]`).join(";") + ";" + files.map((_, j) => `[s${j}]`).join("") + `hstack=inputs=${files.length}`, path.join(OUT, out)]);
const want = k => WHICH === "all" || WHICH === k || WHICH.split(",").includes(k);
const fails = [];
const report = {};

try {
  report.live = await page.evaluate(() => ({desert: window.CY && window.CY.desert, crab: window.CY.ms && window.CY.ms.crab_v6c, os: window.CY.ms && window.CY.ms.ostrich_v2ag}));
  console.log("live", JSON.stringify(report.live));

  /* ---------------- crab_v6c: the crab with the most open bank round its burrow; the others stay in ---------------- */
  const CRW = ["crmeasure", "crpinch", "crcmp", "cridle", "crslip", "crdig", "crbur"];
  if (CRW.some(want)) {
    report.crab = Object.assign(report.crab || {}, await page.evaluate(() => {
      const q = window.__desQA(), R = q.CR;
      const c = R.list.slice().sort((a, b) => q.pN(b.bx, b.bz) - q.pN(a.bx, a.bz))[0]; R._proof = R.list.indexOf(c);
      return {sel: R._proof, glb: q.crGlb(), crG: q.crG, s: +c.s.toFixed(3)};
    }));
    report.crab.requested = [...crReq];
    if (!report.crab.glb) fails.push("crab_v6c not loaded");
    if (!crReq.has("crab_v6c") || [...crReq].some(k => k !== "crab_v6c")) fails.push("crab file requested is not crab_v6c alone: " + [...crReq]);
  }
  const crabCalm = () => page.evaluate(() => {
    const q = window.__desQA(), R = q.CR, c = R.list[R._proof];
    for (const o of R.list) if (o !== c) { o.mode = "in"; o.t = 999; }
    R.calm = true; R.gapePin = null; R.clawIdle = false; window.__set({weather: "sun", ct: "clear", wind: .3}); q.tod("day");
  });
  /* cameras in the crab's own frame (fw its +z front, rt its +x): "claw" close on both chelae from the front, "clawx" closer still,
     "bur" over the burrow mouth, "side" along the bank */
  const crabCamJS = `(view, at) => { const q = window.__desQA(), C = window.__C(), R = q.CR, c = R.list[R._proof], k = c.s * q.crG;
    const yaw = at && at.yaw != null ? at.yaw : c.yaw, x0 = at ? at.x : c.x, z0 = at ? at.z : c.z, y0 = at ? at.y : c.y;
    const fw = [Math.sin(yaw), Math.cos(yaw)], rt = [Math.cos(yaw), -Math.sin(yaw)];
    const L = (lx, ly, lz) => [x0 + rt[0] * lx * k + fw[0] * lz * k, y0 + ly * k, z0 + rt[1] * lx * k + fw[1] * lz * k];
    const V = {claw: [[0, .02, .035], [-.04, .1, .2], 30], clawx: [[0, .02, .035], [-.04, .1, .2], 22], bur: [[0, .02, .02], [.1, .2, .3], 30],
      side: [[0, .03, 0], [0, .2, .9], 36]}[view];
    const t = L(...V[0]), e = L(...V[1]);
    q.lookAt(e[0], e[1], e[2], t[0], t[1], t[2]); C.De.fov = V[2]; C.De.near = .005; C.De.updateProjectionMatrix(); }`;
  const crabCam = (view, at) => page.evaluate(`(${crabCamJS})(${JSON.stringify(view)}, ${JSON.stringify(at || null)})`);
  const crabOut = (mode = "out") => page.evaluate(mode => {
    const q = window.__desQA(), c = q.CR.list[q.CR._proof];
    Object.assign(c, {mode, t: 999, sk: 0, up: 0, v: 0, walk: 0, x: c.bx, z: c.bz, tx: c.bx, tz: c.bz, go: null});
  }, mode);
  const crabState = () => page.evaluate(() => {
    const q = window.__desQA(), c = q.CR.list[q.CR._proof];
    return {mode: c.mode, v: +c.v.toFixed(3), x: +c.x.toFixed(3), z: +c.z.toFixed(3), sk: +c.sk.toFixed(2), body: c.rb && c.rb.cur, claw: c.rc && c.rc.cur, fingers: c.rf && c.rf.cur, visible: c.g && c.g.visible};
  });
  /* the dactyl and claw_c angles from rest on the subject crab's own skeleton: rest is the bind pose (parent bone inverse times the
     inverse of the bone's own), the angle 2·acos|q·q_rest| on the whole quaternion */
  const ANG = `const q = window.__desQA(), c = q.CR.list[q.CR._proof]; let sk = null; c.g.traverse(o => { if (o.isSkinnedMesh && !sk) sk = o; });
    const S = sk.skeleton, M4 = S.boneInverses[0].constructor, Q = c.g.quaternion.constructor, V = c.g.position.constructor;
    window.__crRest = window.__crRest || (() => { const o = {}; S.bones.forEach((b, i) => { if (!/^claw_(finger|c)/.test(b.name)) return;
      const pi = S.bones.indexOf(b.parent), m = new M4().copy(S.boneInverses[i]).invert(); if (pi >= 0) m.premultiply(S.boneInverses[pi]);
      const qq = new Q(); m.decompose(new V(), qq, new V()); o[b.name] = {b, q: qq}; }); return o; })();
    const ang = () => Object.fromEntries(Object.entries(window.__crRest).map(([k, r]) => { const d = Math.abs(r.b.quaternion.dot(r.q)); return [k, +(2 * Math.acos(Math.min(1, d)) * 180 / Math.PI).toFixed(2)]; }));
    const qs = () => Object.fromEntries(Object.entries(window.__crRest).map(([k, r]) => [k, r.b.quaternion.clone()]));
    const qa = (a, b) => +(2 * Math.acos(Math.min(1, Math.abs(a.dot(b)))) * 180 / Math.PI).toFixed(2);`;

  if (want("crmeasure")) {
    await crabCalm(); await crabOut(); await crabCam("claw");
    report.crab.angles = await page.evaluate(new Function(`${ANG}
      const R = q.CR, out = {bones: Object.keys(window.__crRest)};
      /* claw_pinch held by time: gapePin g holds the clip at g × 0.6 s; after a warm-up so no crossfade is left */
      R.gapePin = 0; q.step(40, 1 / 30);
      out.pinch = []; let q0 = null, qOpen = null;
      for (let t = 0; t <= 1.2001; t += .05) { R.gapePin = t / .6; q.step(2, 1 / 30); const a = ang(); out.pinch.push({t: +t.toFixed(2), clipT: +c.rf.acts.claw_pinch.time.toFixed(3), ...a});
        if (t === 0) q0 = qs(); if (Math.abs(t - .6) < 1e-6) qOpen = qs(); }
      out.swing = Object.fromEntries(Object.keys(q0).map(k => [k, qa(q0[k], qOpen[k])]));
      /* idle by time: the pauses on idle, sampled every 1/60 s over two of its 3.6 s */
      R.gapePin = null; R.clawIdle = true; q.step(40, 1 / 30);
      const mn = {}, mx = {}, tr = [];
      for (let i = 0; i < 432; i++) { q.step(1, 1 / 60); const a = ang(); for (const k in a) { mn[k] = Math.min(mn[k] ?? 1e9, a[k]); mx[k] = Math.max(mx[k] ?? -1e9, a[k]); }
        if (i % 9 === 0) tr.push({t: +c.rf.acts.idle.time.toFixed(2), ...a}); }
      out.idle = {min: mn, max: mx, trace: tr, fingers: c.rf.cur};
      /* walking and scuttling: the dactyls keep a clip, never the open rest pose */
      R.clawIdle = false;
      const rt = [Math.cos(c.yaw), -Math.sin(c.yaw)], gm = (mode, vt) => { Object.assign(c, {x: c.bx, z: c.bz, mode, vt, v: vt, walk: 1, go: null, tx: c.bx + rt[0] * .8, tz: c.bz + rt[1] * .8});
        q.step(12, 1 / 60); const m = {}, M = {}; for (let i = 0; i < 48; i++) { q.step(1, 1 / 60); const a = ang(); for (const k in a) { m[k] = Math.min(m[k] ?? 1e9, a[k]); M[k] = Math.max(M[k] ?? -1e9, a[k]); } }
        return {body: c.rb.cur, fingers: c.rf.cur, min: m, max: M}; };
      out.walk = gm("walk", .1); out.scuttle = gm("run", .42);
      Object.assign(c, {x: c.bx, z: c.bz, mode: "out", v: 0, walk: 0, tx: c.bx, tz: c.bz, t: 999}); q.step(10, 1 / 30);
      return out;`));
    const A = report.crab.angles, fk = s => Object.keys(A.swing).find(k => new RegExp("^claw_finger\\.?" + s + "$").test(k)), L = fk("L"), Rr = fk("R");
    console.log("crab angles", JSON.stringify({bones: A.bones, swing: A.swing, idle: {min: A.idle.min, max: A.idle.max}, walk: A.walk, scuttle: A.scuttle}));
    report.crab.claw = {swingL: A.swing[L], swingR: A.swing[Rr], expect: {L: 66.5, R: 75.5},
      biteL: A.pinch[0][L], biteR: A.pinch[0][Rr], openL: A.pinch[12][L], openR: A.pinch[12][Rr],
      clawC: Object.fromEntries(Object.keys(A.swing).filter(k => /^claw_c/.test(k)).map(k => [k, Math.max(...A.pinch.map(p => p[k]), A.idle.max[k])])),
      idleL: [A.idle.min[L], A.idle.max[L]], idleR: [A.idle.min[Rr], A.idle.max[Rr]],
      walkMin: {L: A.walk.min[L], R: A.walk.min[Rr]}, scuttleMin: {L: A.scuttle.min[L], R: A.scuttle.min[Rr]}};
    const C = report.crab.claw;
    if (!(Math.abs(C.swingL - 66.5) < 2 && Math.abs(C.swingR - 75.5) < 2)) fails.push(`claw swing ${C.swingL}/${C.swingR}`);
    if (Object.values(C.clawC).some(v => v > .5)) fails.push("claw_c moved");
    if (!(Math.abs(C.idleL[1] - C.idleL[0] - 13) < 1.5 && Math.abs(C.idleR[1] - C.idleR[0] - 13) < 1.5)) fails.push("idle flick is not 13°");
    if (Math.min(C.walkMin.L, C.walkMin.R, C.scuttleMin.L, C.scuttleMin.R) < 5) fails.push("dactyls near the open rest pose while moving");
  }
  if (want("crpinch") || want("crcmp")) await crabCalm();
  if (want("crpinch")) {
    /* the pause at the burrow mouth: claw_pinch plays on the claws as the scene runs it */
    await crabCalm(); await crabOut(); await crabCam("claw"); await page.evaluate(() => window.__desQA().step(30, 1 / 30));
    await cap("湖边蟹（crab_v6c）：停在洞口时钳子一开一合（claw_pinch，1.2 秒一次）");
    const r = await vid("crab_v6c-claw-pinch", 24 * 6, async () => { await crabOut(); await crabCam("claw"); await page.evaluate(() => window.__desQA().step(1, 1 / 24));
      return page.evaluate(() => { const c = window.__desQA().CR.list[window.__desQA().CR._proof]; return {claw: c.rc.cur, fingers: c.rf.cur, t: +c.rf.acts.claw_pinch.time.toFixed(3)}; }); });
    report.crab.pinchClip = {frames: r.log.length, clips: [...new Set(r.log.map(s => s.claw + "/" + s.fingers))]};
    if (!r.log.every(s => s.claw === "claw_pinch" && s.fingers === "claw_pinch")) fails.push("pause is not claw_pinch on claws and dactyls");
  }
  if (want("crpinch") || want("crcmp")) {
    await crabOut();
    /* bite (t 0) and wide open (t 0.6 s), held by time, same close camera */
    await cap("");
    const pics = [];
    for (const [g, n] of [[0, "bite"], [1, "open"]]) {
      await page.evaluate(g => { const q = window.__desQA(); q.CR.gapePin = g; q.step(30, 1 / 30); }, g);
      await crabCam("clawx"); await page.evaluate(() => window.__desQA().step(1, 1 / 30)); await crabCam("clawx");
      await cap(g ? "全开（t = 0.60 s）" : "咬合（t = 0）"); pics.push(await shot(`crab-pinch-${n}.png`));
    }
    await page.evaluate(() => { window.__desQA().CR.gapePin = null; }); await cap("");
    await strip(pics, "B_crab_v6c_bite_vs_open.png", null, 960);
    /* the same pair cropped on the major (right, lower left of frame) and minor chela */
    await strip(pics, "B_crab_v6c_bite_vs_open_major.png", `${W * .4 | 0}:${H * .45 | 0}:0:${H * .55 | 0}`, 640);
    await strip(pics, "B_crab_v6c_bite_vs_open_minor.png", `${W * .3 | 0}:${H * .3 | 0}:${W * .6 | 0}:${H * .25 | 0}`, 640);
    for (const f of pics) fs.rmSync(f);
  }
  if (want("cridle")) {
    await crabCalm(); await page.evaluate(() => { window.__desQA().CR.clawIdle = true; }); await crabOut(); await crabCam("clawx");
    await page.evaluate(() => window.__desQA().step(30, 1 / 30));
    await cap("湖边蟹：静止时（idle）钳指每 1.8 秒轻轻张开约 13°");
    const r = await vid("crab_v6c-idle-claw", 24 * 4, async () => { await crabOut(); await crabCam("clawx"); await page.evaluate(() => window.__desQA().step(1, 1 / 24));
      return page.evaluate(() => { const c = window.__desQA().CR.list[window.__desQA().CR._proof]; return {fingers: c.rf.cur, t: +c.rf.acts.idle.time.toFixed(3)}; }); });
    report.crab.idleClip = {frames: r.log.length, fingers: [...new Set(r.log.map(s => s.fingers))]};
    await page.evaluate(() => { window.__desQA().CR.clawIdle = false; }); await cap("");
    if (!r.log.every(s => s.fingers === "idle")) fails.push("idle clip not on idle");
  }
  if (want("crslip")) {
    /* planted-foot slip, the scene driving the crab: skinned vertices near the sand in the crab's own frame at steps 1/60 s apart,
       moved in island metres per second. 1.5 mm is #160's measure (it also catches tips peeling off and touching down);
       0.4 mm keeps only the tips bearing weight. */
    await crabCalm(); await crabOut(); await crabCam("side");
    report.crab.footSlip = await page.evaluate(() => {
      const q = window.__desQA(), c = q.CR.list[q.CR._proof], V = c.g.position.constructor;
      let sk = null; c.g.traverse(o => { if (o.isSkinnedMesh && !sk) sk = o; });
      const grab = () => { c.g.updateMatrixWorld(true); const v = new V(), out = [], n = sk.geometry.attributes.position.count;
        for (let i = 0; i < n; i++) { sk.getVertexPosition(i, v); const h = v.y; v.applyMatrix4(sk.matrixWorld); q.W.worldToLocal(v); out.push([v.x, h, v.z]); } return out; };
      const run = (N) => { const S = {".0015": [], ".0004": []}; let bd = 0, a = grab();
        for (let k = 0; k < N; k++) { const b0 = [c.x, c.z]; q.step(1, 1 / 60); const b = grab(); bd += Math.hypot(c.x - b0[0], c.z - b0[1]) * 60;
          for (const th of [.0015, .0004]) for (let i = 0; i < a.length; i++) if (a[i][1] < th && b[i][1] < th) S["." + String(th).split(".")[1]].push(Math.hypot(b[i][0] - a[i][0], b[i][2] - a[i][2]) * 60);
          a = b; }
        const st = v => { v.sort((x, y) => x - y); return {n: v.length, mean: +(v.reduce((s, x) => s + x, 0) / Math.max(1, v.length)).toFixed(4), median: +(v[v.length >> 1] || 0).toFixed(4)}; };
        return {body: +(bd / N).toFixed(4), clip: c.rb.cur, ts: +c.rb.acts[c.rb.cur].timeScale.toFixed(2), thr1_5mm: st(S[".0015"]), thr0_4mm: st(S[".0004"])}; };
      const out = [];
      for (const [mode, vt, dir, N] of [["walk", .1, 1, 48], ["walk", .1, -1, 48], ["run", .42, 1, 20], ["run", .42, -1, 20]]) { const rt = [Math.cos(c.yaw), -Math.sin(c.yaw)];
        Object.assign(c, {x: c.bx, z: c.bz, mode, vt, v: vt, walk: 1, go: null, tx: c.bx + dir * rt[0] * .8, tz: c.bz + dir * rt[1] * .8});
        q.step(18, 1 / 60); out.push({mode, dir: dir > 0 ? "+x" : "-x", ...run(N)}); }
      Object.assign(c, {x: c.bx, z: c.bz, mode: "out", v: 0, walk: 0, tx: c.bx, tz: c.bz, t: 999}); q.step(10, 1 / 30);
      return out;
    });
    console.log("crab foot slip", JSON.stringify(report.crab.footSlip));
    for (const s of report.crab.footSlip) if (!(s.thr0_4mm.mean < .25 * s.body)) fails.push(`crab planted feet slide ${s.mode} ${s.dir}: ${s.thr0_4mm.mean} at ${s.body}`);
  }
  if (want("crdig")) {
    await crabCalm(); await crabOut("dig"); await crabCam("bur"); await page.evaluate(() => window.__desQA().step(10, 1 / 30));
    await cap("湖边蟹：在洞口挖沙，把湿沙扒出来甩开");
    const r = await vid("crab_v6c-dig", 24 * 3, async () => {
      await page.evaluate(() => { const q = window.__desQA(), c = q.CR.list[q.CR._proof]; c.mode = "dig"; c.t = 99; q.step(1, 1 / 24); });
      await crabCam("bur"); return crabState(); }, true);
    report.crab.dig = {frames: r.log.length, clips: [...new Set(r.log.map(s => s.body + "/" + s.claw + "/" + s.fingers))]};
    await ffmpeg(["-i", frameAt(r.dir, 40), "-frames:v", "1", "-update", "1", path.join(OUT, "B_crab_v6c_dig.png")]);
    fs.rmSync(r.dir, {recursive: true, force: true}); await cap("");
    if (!r.log.every(s => s.body === "dig")) fails.push("crab dig is not playing dig");
  }
  if (want("crbur")) {
    /* out on the bank 0.35 m along its own x from the burrow; a scare at the water side; it scuttles home sideways, goes down, and is gone */
    await crabCalm(); await crabOut();
    const at = await page.evaluate(() => { const q = window.__desQA(), c = q.CR.list[q.CR._proof], rt = [Math.cos(c.yaw), -Math.sin(c.yaw)];
      c.x = c.bx + rt[0] * .35; c.z = c.bz + rt[1] * .35; c.y = q.hTop(c.x, c.z); c.mode = "out"; c.t = 999;
      return {x: c.bx + rt[0] * .17, z: c.bz + rt[1] * .17, y: c.y, yaw: c.yaw}; });
    await crabCam("side", at); await page.evaluate(() => window.__desQA().step(20, 1 / 30));
    let inAt = -1;
    const r = await vid("crab_v6c-scare-into-burrow", 12 * 10, async i => {
      if (i === 12) await page.evaluate(() => { const q = window.__desQA(), R = q.CR, c = R.list[R._proof]; R.calm = false;
        const ox = c.x - (c.bx - c.x), oz = c.z - (c.bz - c.z); q.lakeScare(ox, oz, .5, 8); });
      await crabCam("side", at);
      const s = await page.evaluate(capIn => { const q = window.__desQA(), c = q.CR.list[q.CR._proof]; q.step(2, 1 / 24);
        const t = {out: "湖边蟹在岸上觅食", face: "湖边蟹在岸上觅食", walk: "湖边蟹在岸上觅食", run: "受惊！横着飞跑回洞", down: "钻进洞里", in: "消失在洞里"}[c.mode] || c.mode;
        (new Function("t", capIn + "(t)"))(t);
        return {mode: c.mode, body: c.rb.cur, sk: +c.sk.toFixed(2), visible: c.g.visible, x: +c.x.toFixed(3), z: +c.z.toFixed(3)}; }, capIn);
      if (s.mode === "in" && inAt < 0) inAt = i;
      return {...s, stop: inAt >= 0 && i > inAt + 15};
    }, true, 12);
    const L = r.log, iRun = L.findIndex(s => s.mode === "run"), iDown = L.findIndex(s => s.mode === "down"), iIn = L.findIndex(s => s.mode === "in");
    report.crab.burrow = {frames: L.length, scareAt: 12, fps: 12, runAt: iRun, downAt: iDown, goneAt: iIn, scuttled: L.some(s => s.body === "scuttle_sideways"), hiddenAfter: iIn >= 0 && L.slice(iIn).every(s => !s.visible)};
    const pick = [6, iRun + 2, Math.round((iRun + iDown) / 2), iDown + 1, iDown + 5, iIn + 6].filter(i => i >= 0 && i < L.length);
    await strip(pick.map(i => frameAt(r.dir, i)), "B_crab_v6c_scare_burrow_strip.png", `${W * .7 | 0}:${H * .7 | 0}:${W * .15 | 0}:${H * .15 | 0}`, 400);
    fs.rmSync(r.dir, {recursive: true, force: true});
    await page.evaluate(() => { window.__desQA().CR.calm = true; }); await cap("");
    console.log("crab burrow", JSON.stringify(report.crab.burrow));
    if (!(report.crab.burrow.scuttled && iDown > iRun && iIn > iDown && report.crab.burrow.hiddenAfter)) fails.push("scare clip incomplete");
  }

  /* ---------------- Sinai agama ---------------- */
  /* the camera on the lizard from d m off its side, up m above, the eye moved round until the line to it clears the sand */
  const agCamJS = `(d, up, fov, palmOut) => { const q = window.__desQA(), C = window.__C(), a = q.AG.list[window.__ag];
    a.g.updateMatrixWorld(true); const p = a.g.getWorldPosition(C.De.position.clone()); q.W.worldToLocal(p);
    let base; if (a.palm && palmOut) { base = Math.atan2(p.x - a.palm.x, p.z - a.palm.z); } else base = (a.yaw || 0) + Math.PI / 2;
    const clear = (ex, ey, ez) => { for (let s = .05; s < 1; s += .05) { const x = ex + (p.x - ex) * s, z = ez + (p.z - ez) * s, y = ey + (p.y + .03 - ey) * s; if (y < q.hTop(x, z) + .025) return false; } return true; };
    let best = null; for (const off of [0, .35, -.35, .7, -.7, Math.PI, Math.PI + .5, Math.PI - .5]) for (const u of [up, up * 1.6, up * 2.4]) {
      const ex = p.x + Math.sin(base + off) * d, ez = p.z + Math.cos(base + off) * d, ey = p.y + u; if (clear(ex, ey, ez)) { best = [ex, ey, ez]; break; } if (best) break; }
    if (!best) best = [p.x + Math.sin(base) * d, p.y + up * 3, p.z + Math.cos(base) * d];
    window.__agEye = window.__agEye || best; const e = window.__agEye;
    q.lookAt(e[0], e[1], e[2], p.x, p.y + .025, p.z); C.De.fov = fov; C.De.near = .02; C.De.updateProjectionMatrix(); return {p: [p.x, p.y, p.z]}; }`;
  if (want("agbask")) {
    const pick = await page.evaluate(() => {
      const q = window.__desQA(), L = q.AG.list; window.__set({weather: "sun", ct: "clear", wind: .3}); q.tod("day");
      let a = null; for (let i = 0; i < 120 && !a; i++) { q.sim(3); a = L.find(o => o.mode === "bask" && !o.palm && o.male) || (i > 60 && L.find(o => o.mode === "bask" && !o.palm)) || (i > 100 && L.find(o => o.mode === "bask")); }
      window.__ag = L.indexOf(a); window.__agEye = null; return a ? {i: L.indexOf(a), male: a.male, palm: !!a.palm} : null;
    });
    report.agama = Object.assign(report.agama || {}, {baskPick: pick});
    if (!pick) fails.push("agama never basked");
    else {
      await cap(pick.male ? "西奈飞蜥（雄）：晴天趴在沙上晒太阳，身体压平，越晒体色越蓝" : "西奈飞蜥（雌）：晴天趴在沙上晒太阳，身体压平，体色沙褐");
      const r = await vid("agama-bask-close", 24 * 3, async () => {
        const s = await page.evaluate(js => { const q = window.__desQA(); q.step(1, 1 / 24); const o = (new Function("return " + js))()(.62, .16, 30, false), a = q.AG.list[window.__ag];
          return {mode: a.mode, palm: !!a.palm, warm: +a.warm.toFixed(2)}; }, agCamJS);
        return s; }, true);
      await ffmpeg(["-i", frameAt(r.dir, 36), "-frames:v", "1", "-update", "1", path.join(OUT, "B_agama_bask_close.png")]);
      fs.rmSync(r.dir, {recursive: true, force: true}); await cap("");
      report.agama.bask = {frames: r.log.length, modes: [...new Set(r.log.map(s => s.mode + (s.palm ? "@palm" : "")))], warm: r.log[r.log.length - 1].warm};
      if (!r.log.every(s => s.mode === "bask")) fails.push("agama clip: not basking throughout");
    }
  }
  if (want("agrain")) {
    /* heavy rain: each lizard goes up a palm into the crown; the subject is the one nearest the camera's palm */
    const st = await page.evaluate(() => {
      const q = window.__desQA(), L = q.AG.list; window.__set({weather: "sun", ct: "clear", wind: .3}); q.tod("day"); q.sim(30);
      window.__set({weather: "hrain", ct: "overcast"}); q.sim(240);
      window.__ag = L.findIndex(a => a.male); if (!L[window.__ag].palm) window.__ag = L.findIndex(a => a.palm); window.__agEye = null;
      /* metres below the top of the trunk; the sheath skirt reaches (0.02 + 2·0.045 + 0.012)·h + 0.1 m below it */
      return L.map(a => ({male: a.male, mode: a.mode, onPalm: !!a.palm, h: a.palm ? +a.palm.h.toFixed(2) : null, belowTop: a.palm ? +((1 - a.ct) * a.palm.h).toFixed(3) : null,
        target: a.palm ? +((1 - q.agRainT(a.palm, a.male)) * a.palm.h).toFixed(3) : null, skirt: a.palm ? +((.02 + .09 + .012) * a.palm.h + .1).toFixed(3) : null}));
    });
    for (const s of st) s.under = s.onPalm && Math.abs(s.belowTop - s.target) < .05 && s.belowTop >= .3 && s.belowTop <= s.skirt;
    report.agama = Object.assign(report.agama || {}, {rain: st, rainUnder: st.every(s => s.under)});
    console.log("agama rain", JSON.stringify(st));
    if (!st.every(s => s.under)) fails.push("agama not under the crown in rain");
    await cap("西奈飞蜥：下雨时爬进树冠，躲在叶鞘和叶片下面");
    const r = await vid("agama-rain-crown", 24 * 3, async () => page.evaluate(js => { const q = window.__desQA(); q.step(1, 1 / 24); (new Function("return " + js))()(1.25, -.25, 38, true);
      const a = q.AG.list[window.__ag]; return {mode: a.mode, belowTop: +((1 - a.ct) * a.palm.h).toFixed(3)}; }, agCamJS), true);
    await ffmpeg(["-i", frameAt(r.dir, 36), "-frames:v", "1", "-update", "1", path.join(OUT, "B_agama_rain_crown.png")]);
    fs.rmSync(r.dir, {recursive: true, force: true});
    /* wider, from lower down and further out: the whole crown over it */
    await page.evaluate(js => { window.__agEye = null; (new Function("return " + js))()(3.2, -1.4, 40, true); }, agCamJS);
    await cap("西奈飞蜥：雨中，树冠下（远一点看整个树冠）"); await shot("B_agama_rain_crown_wide.png");
    await page.evaluate(() => { window.__set({weather: "sun", ct: "clear"}); window.__desQA().sim(600, 1); }); await cap("");
  }

  /* ---------------- tent in rain, and where the ostriches are ---------------- */
  /* clearance of each ostrich from the tent footprint (its local rectangle), metres; negative is inside */
  const osClearJS = `() => { const q = window.__desQA(), T = q.TENT, c = Math.cos(T.yaw), s = Math.sin(T.yaw);
    return q.os().map(o => { const dx = o.x - T.x, dz = o.z - T.z, lx = Math.abs(dx * c - dz * s) - T.L / 2, lz = Math.abs(dx * s + dz * c) - T.D / 2;
      return +(lx > 0 || lz > 0 ? Math.hypot(Math.max(lx, 0), Math.max(lz, 0)) : Math.max(lx, lz)).toFixed(2); }); }`;
  if (want("osstress")) {
    /* 40 minutes of scene time in sun, wind and rain, each ostrich's clearance from the tent every second; then the same with both
       ostriches dropped beside the tent and sent across it */
    report.ostrich = Object.assign(report.ostrich || {}, await page.evaluate(js => {
      const q = window.__desQA(), clr = (new Function("return " + js))(); let mn = 1e9, n = 0;
      for (const w of [{weather: "sun", ct: "clear", wind: .3}, {weather: "hrain", ct: "overcast", wind: .5}, {weather: "sun", ct: "clear", wind: .9}, {weather: "mrain", ct: "overcast", wind: .2}]) {
        window.__set(w); for (let i = 0; i < 600; i++) { q.sim(1, .1); for (const v of clr()) { mn = Math.min(mn, v); n++; } } }
      const T = q.TENT, PA = q.PA; let mn2 = 1e9, guard = 0;
      for (let k = 0; k < 8; k++) { const A = PA.os[k % 2], a = k / 8 * Math.PI * 2; A.x = T.x + Math.sin(a) * 4.2; A.z = T.z + Math.cos(a) * 4.2;
        if (q.osOffTent(A)) guard++; for (let i = 0; i < 60; i++) { q.sim(.5, .1); for (const v of clr()) mn2 = Math.min(mn2, v); } }
      window.__set({weather: "sun", ct: "clear", wind: .3}); return {stress: {samples: n, minClearance: +mn.toFixed(2)}, dropped: {minClearance: +mn2.toFixed(2), pushedOut: guard}};
    }, osClearJS));
    console.log("ostrich", JSON.stringify(report.ostrich));
    if (!(report.ostrich.stress.minClearance > 0 && report.ostrich.dropped.minClearance > 0)) fails.push("an ostrich got onto the tent");
  }
  if (want("tent")) {
    await cap(" ");
    await page.evaluate(() => { const q = window.__desQA(); window.__set({weather: "sun", ct: "clear", wind: .3}); q.tod("day"); q.sim(900, 1); window.__wi = 0; });
    const r = await vid("tent-rain", 12 * 5, async () => page.evaluate((capIn, js) => {
      const q = window.__desQA(), C = window.__C(), i = window.__wi++, T = q.TENT;
      if (i === 6) window.__set({weather: "hrain", ct: "overcast"});
      (new Function("t", capIn + "(t)"))(i < 6 ? "帐篷：晴天，布面干燥" : i < 24 ? "下雨：布面逐渐湿透变深（缩时，每帧 2 s）" : "雨中（实时）：雨点溅起、雨水顺着布面流下（附场景雨声）");
      if (i >= 6 && i < 24) q.sim(2, 1 / 24); else q.step(2, 1 / 24);
      const y = q.hTop(T.x, T.z), a = (T.yaw || 0) + .7;
      q.lookAt(T.x + Math.sin(a) * 5.6, y + 2, T.z + Math.cos(a) * 5.6, T.x, y + 1, T.z); C.De.fov = 40; C.De.near = .05; C.De.updateProjectionMatrix();
      return {i, tentWet: +q.tentU.uWetC.value.toFixed(3), clear: (new Function("return " + js))()()};
    }, capIn, osClearJS), false, 12);
    const s = r.log;
    report.tent = {frames: s.length, dry: s[5].tentWet, wet: s[s.length - 1].tentWet, osMinClearance: Math.min(...s.flatMap(v => v.clear))};
    if (!(s[5].tentWet < .1 && s[s.length - 1].tentWet > .3)) fails.push("tent clip: cloth did not go from dry to wet");
    if (!(report.tent.osMinClearance > 0)) fails.push("tent clip: ostrich on the tent");
    /* the roof from above in the rain, and the ostriches' real places marked on a top view */
    await page.evaluate(() => { const q = window.__desQA(), C = window.__C(), T = q.TENT, y = q.hTop(T.x, T.z);
      q.lookAt(T.x + 1.5, y + 9, T.z + 7, T.x, y + 1, T.z); C.De.fov = 42; C.De.updateProjectionMatrix(); });
    await cap("雨中的帐篷，从高处看：帐篷顶上没有鸵鸟"); await shot("B_tent_rain_roof_above.png"); await cap("");
    /* the rain sound: the audio unlocked as a key press does, the scene's own bus recorded while it rains */
    await page.keyboard.press("F9");
    await page.evaluate(() => { window.__desQA().freeze(false); });
    await page.waitForFunction(() => { const A = window.__desQA().AU; return A.bus && A.lp.rain && window.__sound.ctx === "running"; }, {timeout: 120000, polling: 250}).catch(() => {});
    const au = await page.evaluate(async () => {
      const q = window.__desQA(), A = q.AU; if (!A.bus) return {err: "no bus"};
      window.__set({weather: "hrain", ct: "overcast"}); q.sim(30, .5);
      await new Promise(r => setTimeout(r, 3000));
      const ctx = A.bus.context, dst = ctx.createMediaStreamDestination(); A.bus.connect(dst);
      const rec = new MediaRecorder(dst.stream), ch = []; rec.ondataavailable = e => ch.push(e.data);
      const done = new Promise(r => { rec.onstop = r; });
      rec.start(); await new Promise(r => setTimeout(r, 6000)); rec.stop(); await done; A.bus.disconnect(dst);
      const b = new Blob(ch, {type: rec.mimeType}), u8 = new Uint8Array(await b.arrayBuffer());
      let bin = ""; for (let i = 0; i < u8.length; i += 32768) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 32768));
      return {mime: rec.mimeType, bytes: u8.length, b64: btoa(bin)};
    });
    await page.evaluate(() => { const q = window.__desQA(); q.freeze(true); window.__set({weather: "sun", ct: "clear"}); q.sim(900, 1); });
    report.tent.sound = {mime: au.mime, bytes: au.bytes, err: au.err};
    if (au.b64) {
      const af = path.join(OUT, "tent-rain-sound.webm"), v0 = path.join(OUT, "tent-rain.mp4"), v1 = path.join(OUT, "tent-rain-av.mp4");
      fs.writeFileSync(af, Buffer.from(au.b64, "base64"));
      await ffmpeg(["-i", v0, "-stream_loop", "-1", "-i", af, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "128k", "-shortest", v1]);
      fs.renameSync(v1, v0); fs.rmSync(af);
      const vol = await new Promise(r => execFile("ffmpeg", ["-i", v0, "-af", "volumedetect", "-f", "null", "-"], (e, o, se) => r(String(se).match(/mean_volume: (-?[\d.]+) dB/))));
      report.tent.sound.meanDb = vol ? +vol[1] : null;
      if (!vol || +vol[1] < -60) fails.push("tent clip: rain sound silent");
    } else fails.push("tent clip: no rain sound recorded");
    report.ostrich = Object.assign(report.ostrich || {}, {requested: [...osReq]});
    console.log("tent", JSON.stringify(report.tent));
  }
} catch (e) {
  console.log("PROOF ERROR", String(e && e.stack || e).slice(0, 1500));
  fails.push("exception");
} finally {
  const rf = path.join(OUT, "d161-report.json");
  let prev = {}; try { prev = JSON.parse(fs.readFileSync(rf, "utf8")); } catch (e) {}
  for (const k of Object.keys(report)) if (prev[k] && typeof prev[k] === "object" && !Array.isArray(prev[k])) report[k] = Object.assign(prev[k], report[k]);
  fs.writeFileSync(rf, JSON.stringify(Object.assign(prev, report), null, 2));
  await browser.close(); server.close();
}
if (fails.length) { console.log("PROOF FAIL", fails.join("; ")); process.exit(1); }
console.log("d161 proofs ok");
