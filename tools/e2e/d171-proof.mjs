// Desert d171 proofs (camel hooves on the sand), on any checkout (DIR, default this one; assets are committed, nothing is built).
// Not part of CI.
//   gap     per-hoof gap to the sand (hTop) over >10 s of walking (flat sand, then up and across the dune's slope, again after
//           40 min of dune creep) and one kneel -> lie -> stand cycle, for both camels -> OUT/<TAG>gap.json
//   shots   ground-level side close-ups (camera 0.45 m up): mid-stride on the dune slope, kneeling, lying
//   walkvid side-view tracking clip of the dromedary walking over the slope (after the fix)
//   ver     the scene panel open, with its 「版本 xxxxxx」 label
//   pair    (no browser) OUT/main_<shot>.png | OUT/new_<shot>.png -> <shot>_before_after.png; main_gap.json + new_gap.json -> gap.json
// The gap is measured on the skinned mesh itself, independent of the scene's own contact points: for each leg every vertex
// weighted to its cannon and foot bones (hoof) or forearm/shank, cannon and foot (leg, which includes a folded knee) is skinned
// on the CPU and the lowest one is compared with hTop under it. >0 = in the air, <0 = sunk into the sand.
// Usage: node tools/e2e/d171-proof.mjs [gap|shots|walkvid|ver|pair]   (OUT=/tmp/d171/out DIR=<checkout> TAG=<prefix>)
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {execFile} from "node:child_process";
import puppeteer from "puppeteer-core";
const ffmpeg = args => new Promise((res, rej) => execFile("ffmpeg", ["-y", "-loglevel", "error", ...args], {maxBuffer: 1e8}, (e, _o, se) => e ? rej(new Error(String(se).slice(-500))) : res()));

const ROOT = path.resolve(process.env.DIR || path.join(path.dirname(fileURLToPath(import.meta.url)), "../.."));
const OUT = process.env.OUT || "/tmp/d171/out";
const CHROME = process.env.CHROME || ["/usr/bin/google-chrome-stable", "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/local/bin/google-chrome"].find(p => fs.existsSync(p));
const WHICH = process.argv[2] || "gap";
const W = +(process.env.W || 1280), H = +(process.env.H || 720);
const TAG = process.env.TAG || "";
const want = k => WHICH === k || WHICH.split(",").includes(k);
fs.mkdirSync(OUT, {recursive: true});
const FONT = "/usr/share/fonts/truetype/wqy/wqy-microhei.ttc";
const lab = t => `drawtext=fontfile=${FONT}:text='${t}':x=14:y=12:fontsize=26:fontcolor=white:borderw=2:bordercolor=black`;

if (WHICH === "pair") {
  const MAINJS = process.env.MAINJS || "desert.2ccd4efe17.js", NEWJS = process.env.NEWJS || "本分支";
  const cols = [["main", `修改前（main，${MAINJS}）`], ["new", `修改后（本分支，${NEWJS}）`]];
  for (const f of fs.readdirSync(OUT).filter(f => f.startsWith("new_") && f.endsWith(".png"))) {
    const n = f.slice(4, -4), ins = cols.map(([k]) => path.join(OUT, `${k}_${n}.png`));
    if (!ins.every(p => fs.existsSync(p))) { console.log("skip", n); continue; }
    const fc = cols.map(([, t], i) => `[${i}:v]scale=960:-2,${lab(t)}[c${i}]`).join(";") + ";[c0][c1]hstack=inputs=2";
    await ffmpeg([...ins.flatMap(p => ["-i", p]), "-filter_complex", fc, "-q:v", "3", path.join(OUT, `${n}_before_after.jpg`)]);
    console.log("pair", n);
  }
  const gm = path.join(OUT, "main_gap.json"), gn = path.join(OUT, "new_gap.json");
  if (fs.existsSync(gm) && fs.existsSync(gn)) {
    const m = JSON.parse(fs.readFileSync(gm)), b = JSON.parse(fs.readFileSync(gn));
    fs.writeFileSync(path.join(OUT, "gap.json"), JSON.stringify({units: "cm; gap = lowest skinned vertex of the hoof (or lower leg) minus hTop under it; >0 in the air, <0 sunk",
      main: {bundle: m.bundle, ...m.result}, branch: {bundle: b.bundle, ...b.result}}, null, 1));
    console.log("gap.json written");
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
  let d = document.getElementById("d171cap");
  if (!text) { if (d) d.remove(); return; }
  if (!d) { d = document.createElement("div"); d.id = "d171cap"; document.body.appendChild(d); }
  d.textContent = text;
  d.style.cssText = "position:fixed;left:18px;bottom:16px;right:18px;z-index:50;pointer-events:none;font:600 20px 'WenQuanYi Micro Hei','Droid Sans Fallback',sans-serif;color:#fff;letter-spacing:.02em;text-shadow:0 1px 2px #000,0 0 4px #000";
}, text || "");

/* the probe: hoof / lower-leg vertex sets per camel, and a deterministic way to put a camel somewhere doing something */
await E(() => {
  const q = window.__desQA(), V = q.W.position.constructor;
  const prep = a => {
    if (a._gp) return a._gp;
    let body; a.mdl.traverse(o => { if (o.isSkinnedMesh && o.name === "Camel" && !body) body = o; });
    const sk = body.skeleton, g = body.geometry, si = g.attributes.skinIndex, sw = g.attributes.skinWeight, n = g.attributes.position.count;
    const pick = bs => { const ids = new Set(bs.map(b => sk.bones.indexOf(b))), vs = [];
      for (let i = 0; i < n; i++) { let w = 0; for (let k = 0; k < 4; k++) if (ids.has(si.getComponent(i, k))) w += sw.getComponent(i, k); if (w > .5) vs.push(i); }
      return vs; };
    const all = []; for (let i = 0; i < n; i++) all.push(i);
    return a._gp = {body, hoof: a.feet.map(f => pick([f.b, f.b.parent])), leg: a.feet.map(f => pick([f.b, f.b.parent, f.b.parent.parent])), all};
  };
  const v = new V();
  const low = (body, vs) => { let m = 1e9, x = 0, z = 0; for (const i of vs) { body.getVertexPosition(i, v); v.applyMatrix4(body.matrixWorld); q.W.worldToLocal(v); const d = v.y - q.hTop(v.x, v.z); if (d < m) { m = d; x = v.x; z = v.z; } } return {g: m, x, z}; };
  window.__gp = a => { const P = prep(a); a.g.updateMatrixWorld(true);
    return {hoof: P.hoof.map(vs => low(P.body, vs)), leg: P.leg.map(vs => low(P.body, vs)), body: low(P.body, P.all).g}; };
  /* park the animals that are not in the test out of the way (behaviour and models untouched) */
  window.__clear = (cx, cz, r) => {
    const far = []; for (let x = -40; x <= 40; x += 2) for (let z = -40; z <= 40; z += 2) if (q.sN(x, z) < .8 && Math.hypot(x - cx, z - cz) > r && Math.hypot(x - q.TENT.x, z - q.TENT.z) > 8) far.push({x, z});
    q.PA.os.forEach((o, i) => { const p = far[(i * 37 + 5) % far.length]; q.osPlace(o, p.x, p.z, 0); o.mode = "graze"; o.t = 999; o.path = null; });
    q.PA.tt.forEach((o, i) => { const p = far[(i * 53 + 11) % far.length]; q.torPlace(o, p.x, p.z, 0); o.mode = "stand"; o.t = 999; });
  };
  /* one camel at (x, z) facing yaw; the other lies at its rest spot, staying put */
  window.__put = (ci, x, z, yaw, clip) => {
    const a = q.ANIM.camels[ci], o = q.ANIM.camels[1 - ci], R = q.REST[1 - ci];
    Object.assign(o, {x: R.x, z: R.z, yaw: R.yaw, mode: "rest", job: "kneel", k: 1, timer: 1e9, spd: 0, yr: 0, path: null, gy: null, goal: R});
    for (const k in o.r.acts) o.r.acts[k].stop(); o.r.fd = null; o.r.cur = null; q.fn.play(o.r, "kneel_rest", .01, 1);
    Object.assign(a, {x, z, yaw, k: 0, spd: 0, yr: 0, path: null, pi: 0, gy: null, mode: "job", job: "idle", timer: 1e9, face: null, stuck: 0});
    for (const k in a.r.acts) a.r.acts[k].stop(); a.r.fd = null; a.r.cur = null; q.fn.play(a.r, clip || "idle", .01, 1);
    for (const c of q.ANIM.camels) for (const f of c.feet) f.p = null;
    return a;
  };
});
const fails = [], report = {};
try {
  await E(HIDE => { document.body.classList.add("col", "snc"); for (const s of HIDE) { const n = document.querySelector(s); if (n) n.style.display = "none"; }
    const q = window.__desQA(), C = window.__C(); q.freeze(true); window.__set({mode: "manual"}); q.tod("day"); window.__set({weather: "sun", ct: "clear", wind: .4}); C.Ce.enabled = false; q.sim(5); }, HIDE);
  report.bundle = await E(() => window.CY && window.CY.desert);

  if (want("gap")) {
    report.result = await E(() => {
      const q = window.__desQA(), DT = 1 / 30, cm = x => +(x * 100).toFixed(1);
      const pct = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * (s.length - 1)))]; };
      const stats = a => ({min: cm(Math.min(...a)), max: cm(Math.max(...a)), p95: cm(pct(a, .95)), p50: cm(pct(a, .5))});
      const names = ["前左", "前右", "后左", "后右"];
      const out = {};
      for (const ci of [0, 1]) {
        const a = window.__put(ci, 4, -9, .9);
        window.__clear(9, -9, 9); q.step(10, DT);
        /* walking: flat sand, up and across the dune's west slope (to 26°), back; then the same after 40 min of dune creep */
        const legs = [[12, -4], [9, -13], [13, -3], [5, -9]], W = [];
        let prev = null, walkT = 0;
        for (const pass of [0, 1]) {
          if (pass) { q.duneAdv(2400); window.__put(ci, 4, -9, .9); window.__clear(9, -9, 9); q.step(10, DT); prev = null; }
          for (const [tx, tz] of legs) {
            if (!q.fn.camelGo(a, {x: tx, z: tz}, "idle")) continue;
            for (let i = 0; i < 30 * 30 && a.mode === "walk"; i++) {
              q.step(1, DT); const G = window.__gp(a);
              if (a.spd > .3 && a.mode === "walk") {
                const sp = prev ? G.hoof.map((h, k) => Math.hypot(h.x - prev[k].x, h.z - prev[k].z) / DT) : null;
                const vy = prev ? G.hoof.map((h, k) => Math.abs(h.g - prev[k].g) / DT) : null;
                if (sp) { W.push({g: G.hoof.map(h => h.g), sp, vy, spd: a.spd, pass}); walkT += DT; }
              }
              prev = G.hoof;
            }
            a.mode = "job"; a.timer = 1e9; a.path = null;
          }
        }
        /* a stance hoof moves under a quarter of the body's speed over the ground and under 10 cm/s up or down; a swinging one at about twice the body's speed */
        const sup = (w, k) => w.sp[k] < .25 * w.spd && w.vy[k] < .1;
        const walk = {seconds: +walkT.toFixed(1), frames: W.length, perHoof: {}};
        names.forEach((n, k) => { const all = W.map(w => w.g[k]), st = W.filter(w => sup(w, k)).map(w => w.g[k]);
          walk.perHoof[n] = {all: stats(all), support: {frames: st.length, ...stats(st)}}; });
        walk.zeroGroundedFrac = +(W.filter(w => w.g.every(x => x > 0)).length / W.length).toFixed(4);
        walk.underTwoGroundedFrac = +(W.filter(w => w.g.filter(x => x <= 0).length < 2).length / W.length).toFixed(4);
        walk.allFourAbove1cmFrac = +(W.filter(w => w.g.every(x => x > .01)).length / W.length).toFixed(4);
        walk.maxPenetration = cm(Math.min(...W.flatMap(w => w.g)));
        walk.maxSupportGap = cm(Math.max(...W.flatMap(w => w.g.filter((_, k) => sup(w, k)))));
        const SA = W.flatMap((w, i) => w.g.map((g, k) => ({i, k, g, w})).filter(o => sup(o.w, o.k) && o.g > 0));
        walk.supportHoofFramesAbove0 = {count: SA.length, ofSupportHoofFrames: W.reduce((n, w) => n + w.g.filter((_, k) => sup(w, k)).length, 0),
          worst: SA.sort((x, y) => y.g - x.g).slice(0, 5).map(o => ({frame: o.i, hoof: names[o.k], gap: cm(o.g), hoofSpeed: +o.w.sp[o.k].toFixed(2), bodySpeed: +o.w.spd.toFixed(2), gaps: o.w.g.map(cm)}))};
        walk.afterDuneCreep = {frames: W.filter(w => w.pass).length, maxPenetration: cm(Math.min(...W.filter(w => w.pass).flatMap(w => w.g))),
          zeroGroundedFrac: +(W.filter(w => w.pass && w.g.every(x => x > 0)).length / Math.max(1, W.filter(w => w.pass).length)).toFixed(4)};
        /* kneel -> lie -> stand where the walk ended */
        Object.assign(a, {mode: "turn", job: "kneel", face: a.yaw, spd: 0, yr: 0});
        const K = []; let restN = 0;
        for (let i = 0; i < 30 * 25; i++) {
          if (a.mode === "rest" && ++restN > 90) a.timer = -1;
          q.step(1, DT); const G = window.__gp(a);
          if (a.mode === "down" || a.mode === "rest" || a.mode === "up") K.push({m: a.mode, k: a.k, leg: G.leg.map(h => h.g), hoof: G.hoof.map(h => h.g), body: G.body});
          if (a.mode === "job" && K.length) break;
        }
        const cyc = {frames: K.length, perLeg: {}, phases: {}};
        names.forEach((n, k) => { cyc.perLeg[n] = stats(K.map(r => r.leg[k])); });
        for (const ph of ["down", "rest", "up"]) { const R = K.filter(r => r.m === ph); if (!R.length) continue;
          cyc.phases[ph] = {frames: R.length, perLeg: Object.fromEntries(names.map((n, k) => [n, stats(R.map(r => r.leg[k]))])),
            lowestLegMax: cm(Math.max(...R.map(r => Math.min(...r.leg)))), secondLowestLegMax: cm(Math.max(...R.map(r => [...r.leg].sort((x, y) => x - y)[1])))}; }
        cyc.zeroGroundedFrac = +(K.filter(r => r.leg.every(x => x > 0)).length / K.length).toFixed(4);
        cyc.underTwoGroundedFrac = +(K.filter(r => r.leg.filter(x => x <= 0).length < 2).length / K.length).toFixed(4);
        cyc.maxPenetration = cm(Math.min(...K.flatMap(r => [...r.leg, r.body])));
        cyc.maxPenetrationLegs = cm(Math.min(...K.flatMap(r => r.leg)));
        const all = [...W.map(w => w.g), ...K.map(r => r.leg)];
        out[ci ? "bactrian" : "dromedary"] = {walk, kneelLieStand: cyc,
          overall: {zeroGroundedFrac: +(all.filter(g => g.every(x => x > 0)).length / all.length).toFixed(4), maxPenetration: cm(Math.min(walk.maxPenetration / 100, cyc.maxPenetration / 100))}};
      }
      return out;
    });
    fs.writeFileSync(path.join(OUT, `${TAG}gap.json`), JSON.stringify(report, null, 1));
    console.log("gap", JSON.stringify(report.result));
  }

  /* ground-level side camera on the dromedary: d m off its left side, 0.45 m above the sand, aimed at its knees */
  const side = (d, h, fov) => E((d, h, fov) => { const q = window.__desQA(), C = window.__C(), a = q.ANIM.camels[0], s = Math.sin(a.yaw), c = Math.cos(a.yaw);
    const fx = a.x + s * .1, fz = a.z + c * .1, px = fx + c * d, pz = fz - s * d;
    q.lookAt(px, q.hTop(px, pz) + h, pz, fx, q.hTop(fx, fz) + .42, fz); C.De.fov = fov; C.De.near = .05; C.De.updateProjectionMatrix(); q.step(1, 1 / 60); }, d, h, fov);

  if (want("shots")) {
    /* mid-stride on the dune slope: the dromedary walks from the flat up the slope; frozen at the same scene time on both builds */
    const s1 = await E(() => { const q = window.__desQA(), a = window.__put(0, 6.5, -11.2, .55); window.__clear(9, -9, 9);
      q.fn.camelGo(a, {x: 12, z: -4}, "idle"); q.step(30 * 3 + 9, 1 / 30); const G = window.__gp(a);
      return {x: +a.x.toFixed(2), z: +a.z.toFixed(2), mode: a.mode, hoof: G.hoof.map(h => +(h.g * 100).toFixed(1))}; });
    report.shotWalk = s1; console.log("walk", JSON.stringify(s1));
    await side(4.2, .45, 42); await cap(`单峰驼走在沙丘坡上（步幅中段），镜头离沙面 0.45 米，侧面；四蹄离沙：${s1.hoof.join(" / ")} 厘米`); await shot(`${TAG}G_walk_midstride.png`);
    /* kneeling (fore knees down, hind legs still straight) and lying, on open flat sand */
    const s2 = await E(() => { const q = window.__desQA(), a = window.__put(0, 4, -9, .9); window.__clear(4, -9, 9);
      Object.assign(a, {mode: "turn", job: "kneel", face: a.yaw}); let n = 0; while (a.mode !== "down" && n++ < 200) q.step(1, 1 / 30);
      while (a.k < .45) q.step(1, 1 / 30); const G = window.__gp(a);
      return {k: +a.k.toFixed(2), leg: G.leg.map(h => +(h.g * 100).toFixed(1))}; });
    report.shotKneel = s2; console.log("kneel", JSON.stringify(s2));
    await side(4.2, .45, 42); await cap(`单峰驼跪下过程中（前膝先着地），镜头离沙面 0.45 米；四肢最低点离沙：${s2.leg.join(" / ")} 厘米`); await shot(`${TAG}G_kneel.png`);
    const s3 = await E(() => { const q = window.__desQA(), a = q.ANIM.camels[0]; while (a.mode !== "rest") q.step(1, 1 / 30); q.step(60, 1 / 30); a.timer = 1e9; const G = window.__gp(a);
      return {leg: G.leg.map(h => +(h.g * 100).toFixed(1)), body: +(G.body * 100).toFixed(1)}; });
    report.shotLie = s3; console.log("lie", JSON.stringify(s3));
    await side(4.2, .45, 42); await cap(`单峰驼卧下（胸垫、前膝、后腿着沙），镜头离沙面 0.45 米；四肢最低点离沙：${s3.leg.join(" / ")} 厘米`); await shot(`${TAG}G_lie.png`);
    await cap("");
  }

  if (want("walkvid")) {
    /* tracking side shot: the camera keeps 4.6 m off the camel's left and 0.5 m above the sand, 24 fps stepped 1/24 s */
    await E(() => { const q = window.__desQA(), a = window.__put(0, 4, -9, .9); window.__clear(9, -9, 9); q.fn.camelGo(a, {x: 12, z: -4}, "idle"); q.step(36, 1 / 24); });
    const dir = path.join(OUT, "walk-frames"); fs.rmSync(dir, {recursive: true, force: true}); fs.mkdirSync(dir);
    const N = +(process.env.VN || 192), log = [];
    for (let i = 0; i < N; i++) {
      const s = await E(() => { const q = window.__desQA(), C = window.__C(), a = q.ANIM.camels[0];
        if (a.mode !== "walk") q.fn.camelGo(a, {x: 9, z: -13}, "idle");
        q.step(1, 1 / 24); const yaw = window.__vy = window.__vy == null ? a.yaw : window.__vy + (a.yaw - window.__vy) * .08;
        const s = Math.sin(yaw), c = Math.cos(yaw), fx = a.x + s * .3, fz = a.z + c * .3, px = fx + c * 4.6, pz = fz - s * 4.6;
        q.lookAt(px, q.hTop(px, pz) + .5, pz, fx, q.hTop(fx, fz) + .7, fz); C.De.fov = 46; C.De.near = .05; C.De.updateProjectionMatrix();
        const G = window.__gp(a), h = G.hoof.map(x => x.g); return {h, min: Math.min(...h), n0: h.filter(x => x <= 0).length}; });
      log.push(s);
      await cap(`修改后：单峰驼侧面行走（镜头离沙面 0.5 米），四蹄离沙 ${s.h.map(x => (x * 100).toFixed(1)).join(" / ")} 厘米，着地 ${s.n0} 只`);
      await frames(1); await page.screenshot({path: path.join(dir, String(i).padStart(4, "0") + ".png")});
    }
    await ffmpeg(["-framerate", "24", "-i", path.join(dir, "%04d.png"), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "21", path.join(OUT, `${TAG}V_walk_side.mp4`)]);
    await ffmpeg([...[20, 90, 160].flatMap(i => ["-i", path.join(dir, String(Math.min(i, N - 1)).padStart(4, "0") + ".png")]), "-filter_complex",
      "[0:v]scale=640:-2[a];[1:v]scale=640:-2[b];[2:v]scale=640:-2[c];[a][b][c]hstack=inputs=3", "-q:v", "3", path.join(OUT, `${TAG}V_walk_side_strip.jpg`)]);
    fs.rmSync(dir, {recursive: true, force: true});
    report.walkvid = {frames: N, minGroundedHooves: Math.min(...log.map(s => s.n0)), maxLowestGap: +(Math.max(...log.map(s => s.min)) * 100).toFixed(1)};
    console.log("walkvid", JSON.stringify(report.walkvid));
    await cap("");
  }

  if (want("ver")) {
    await cap("");
    await E(() => { window.__set({weather: "sun", ct: "clear", wind: .3}); window.__desQA().sim(2); });
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
fs.writeFileSync(path.join(OUT, `${TAG}d171-report-${WHICH.replace(/,/g, "+")}.json`), JSON.stringify(report, null, 1));
clearTimeout(killer);
await browser.close(); server.close();
process.exit(fails.length ? 1 : 0);
