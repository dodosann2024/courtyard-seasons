// Desert d180 proofs, on any checkout (DIR, default this one; assets are committed, nothing is built). Not part of CI.
//   wind     at WINDS (default .3,.5,.65,.8,1), crabs held in their burrows: the east beach from 1.6 m (d176-d178's trail view) one second
//            after a wash turns back, and the default camera. Patchiness of the wet sand from the trail view: a 5 mm world grid over the bank
//            from the water up to 10 cm, each cell wet when its pixel is under 86% of the dry sand above (22-30 cm, past the reach of any change); the wet cells' 4-connected
//            components (>= 4 cells), the dry holes inside the wet region, and the edge density (wet/dry neighbour pairs over all pairs).
//            From the default camera: round the whole rim, the band 3.5 cm up against the sand 25 cm up, the dark runs and the gaps between
//            them. A real-time clip at the trail view (WF frames, default 45) each
//   crab     the shore shuffle. census: every crab over SHM sim minutes (default 6), far camera. A stop = the crab out (not walking) at the
//            water's edge (its last walk was a trail follow, a dodge or a shore move, and it stands under the lap's reach + 4 cm) for >= 1 s.
//            In it, a step = a run of frames moving faster than 1.5 cm/s that covers >= 8 mm, lateral when >= 90% of it lies along the
//            crab's own x (the gait clip's direction); slide = ground covered while the gait clip is not playing (c.walk < .5).
//            Fresh wet sand and under the lap as in d178. trials: each crab set down at its own shore, 12 s from the low shore camera
//            (TRIALS rounds, default 2). clip: crab CRABI (default 0) the same way, 12 s at 15 fps, and a frame strip of one shuffle
//   weather  the trail view in rain and at night, each at wind .45 and 1, and frozen (crabs held in): the band and trail luminance
//   pair     (no browser) OUT/main_<n>.png|.mp4 + OUT/new_<n>.png|.mp4 -> <n>_before_after.jpg|.mp4, the wind sweeps, pixel diffs
// Usage: node tools/e2e/d180-proof.mjs <mode[,mode]>   (OUT=/tmp/d180/out DIR=<checkout> TAG=<prefix>)
import fs from "node:fs";
import path from "node:path";
import {execFile} from "node:child_process";
import {fileURLToPath} from "node:url";
import {openScene, ffmpeg} from "./d172-lib.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(process.env.DIR || path.join(HERE, "../.."));
const OUT = process.env.OUT || "/tmp/d180/out", TAG = process.env.TAG || "";
const WHICH = process.argv[2] || "wind", want = k => WHICH.split(",").includes(k);
fs.mkdirSync(OUT, {recursive: true});
const FONT = "/usr/share/fonts/truetype/wqy/wqy-microhei.ttc";
const lab = (t, s = 26) => `drawtext=fontfile=${FONT}:text='${t}':x=14:y=12:fontsize=${s}:fontcolor=white:borderw=2:bordercolor=black`;
const W = 1280, H = 720;
const pixels = file => new Promise((res, rej) => execFile("ffmpeg", ["-loglevel", "error", "-i", file, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
  {encoding: "buffer", maxBuffer: 1e8}, (e, o) => e ? rej(e) : res(o)));
const lum = (buf, x, y, r = 1) => { let s = 0, n = 0; for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const X = Math.round(x) + dx, Y = Math.round(y) + dy;
  if (X < 0 || Y < 0 || X >= W || Y >= H) continue; const i = (Y * W + X) * 3; s += .2126 * buf[i] + .7152 * buf[i + 1] + .0722 * buf[i + 2]; n++; } return n ? s / n : null; };
const mean = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : null, r1 = x => x == null ? null : +x.toFixed(1), r3 = x => x == null ? null : +x.toFixed(3);

/* the trail-view grid: cells {i (across), j (up the slope), hh, p}; wet below 86% of the dry sand 22-30 cm up */
async function patchiness(file, G) {
  const buf = await pixels(file), L = G.cells.map(c => lum(buf, c.p[0], c.p[1], 0)), dry = mean(G.cells.map((c, k) => c.hh > .22 ? L[k] : null).filter(x => x != null));
  const key = (i, j) => i * 10000 + j, cell = new Map(); G.cells.forEach((c, k) => { if (c.hh > G.lapNow + .002 && c.hh < .1) cell.set(key(c.i, c.j), L[k] < dry * .86 ? 1 : 0); });
  const comps = v => { const seen = new Set(), sizes = []; for (const [k0, x] of cell) { if (x !== v || seen.has(k0)) continue; let n = 0; const st = [k0]; seen.add(k0);
      while (st.length) { const k = st.pop(); n++; const i = Math.floor(k / 10000), j = k % 10000; for (const kk of [key(i + 1, j), key(i - 1, j), key(i, j + 1), key(i, j - 1)])
        if (cell.get(kk) === v && !seen.has(kk)) { seen.add(kk); st.push(kk); } } sizes.push(n); } return sizes.filter(n => n >= 4); };
  let pairs = 0, edges = 0; for (const [k, x] of cell) { const i = Math.floor(k / 10000), j = k % 10000; for (const kk of [key(i + 1, j), key(i, j + 1)]) { const y = cell.get(kk); if (y == null) continue; pairs++; if (y !== x) edges++; } }
  const wet = [...cell.values()].filter(x => x).length, wc = comps(1), dc = comps(0);
  /* the wet share by height (1 cm bins): how much of the soaked band and the trail is left */
  const byH = {}; G.cells.forEach((c, k) => { if (c.hh < .002 + G.lapNow || c.hh > .1) return; const b = Math.floor(c.hh * 100); (byH[b] = byH[b] || [0, 0])[0] += L[k] < dry * .86 ? 1 : 0; byH[b][1]++; });
  return {cells: cell.size, dryLum: r1(dry), wetShare: r3(wet / cell.size), wetComponents: wc.length, dryHolesInBand: dc.length - 1 < 0 ? 0 : dc.length - 1,
    largestWetShare: r3(wc.length ? Math.max(...wc) / Math.max(1, wet) : 0), edgeDensity: r3(edges / Math.max(1, pairs)),
    wetShareByCm: Object.fromEntries(Object.entries(byH).map(([b, [w, n]]) => [`${b}-${+b + 1}cm`, r3(w / n)]))};
}
/* the default camera's rim samples: per angle the darkest of the bank 1, 2, 3.5 and 5 cm up against the sand 25 cm up */
async function rim(file, R) {
  const buf = await pixels(file), s = R.map(r => { const a = Math.min(...r.b.map(p => lum(buf, p[0], p[1], 0))), d = lum(buf, r.d[0], r.d[1], 1); return d ? a / d : null; }).filter(x => x != null);
  const wet = s.map(x => x < .88), runs = [], gaps = []; let cur = null, n = 0;
  for (const w of wet) { if (w === cur) n++; else { if (cur != null) (cur ? runs : gaps).push(n); cur = w; n = 1; } } (cur ? runs : gaps).push(n);
  return {samples: s.length, wetShare: r3(wet.filter(Boolean).length / s.length), meanRatio: r3(mean(s)), darkRuns: runs.filter(n => n >= 2).length, gaps: gaps.filter(n => n >= 2).length,
    transitions: wet.reduce((a, w, i) => a + (i && w !== wet[i - 1] ? 1 : 0), 0), meanDarkRun: r1(mean(runs.filter(n => n >= 2)))};
}

if (WHICH === "pair") {
  const MAINJS = process.env.MAINJS || "main", NEWJS = process.env.NEWJS || "本分支";
  const cols = [["main", `修改前（main，${MAINJS}）`], ["new", `修改后（本分支，${NEWJS}）`]];
  for (const f of fs.readdirSync(OUT).filter(f => f.startsWith("new_") && /\.(png|mp4)$/.test(f) && !/_raw\.png$/.test(f))) {
    const ext = path.extname(f), n = f.slice(4, -ext.length), ins = cols.map(([k]) => path.join(OUT, `${k}_${n}${ext}`));
    if (!ins.every(p => fs.existsSync(p))) continue;
    const fc = cols.map(([, t], i) => `[${i}:v]scale=960:-2,${lab(t)}[c${i}]`).join(";") + ";[c0][c1]hstack=inputs=2";
    if (ext === ".png") await ffmpeg([...ins.flatMap(p => ["-i", p]), "-filter_complex", fc, "-q:v", "3", path.join(OUT, `${n}_before_after.jpg`)]);
    else await ffmpeg([...ins.flatMap(p => ["-i", p]), "-filter_complex", fc + ",format=yuv420p", "-c:v", "libx264", "-crf", "26", "-preset", "slow", "-shortest", path.join(OUT, `${n}_before_after.mp4`)]);
    console.log("pair", n + ext);
  }
  /* the sweeps: one row per build, one column per wind */
  const winds = (process.env.WINDS || ".3,.5,.65,.8,1").split(","), kk = w => "w" + w.replace(".", "");
  for (const [v, sc] of [["trail", 384], ["rimzoom", 384]]) {
    const files = cols.flatMap(([k]) => winds.map(w => path.join(OUT, `${k}_wind_${kk(w)}_${v}.png`)));
    if (!files.every(p => fs.existsSync(p))) continue;
    const fc = files.map((_, i) => `[${i}:v]scale=${sc}:-2,${lab(`${i < winds.length ? "main" : "本分支"} 风 ${winds[i % winds.length].replace(/^\./, "0.")}`, 20)}[c${i}]`).join(";")
      + ";" + files.map((_, i) => `[c${i}]`).join("") + `xstack=inputs=${files.length}:layout=` + files.map((_, i) => `${(i % winds.length) ? Array.from({length: i % winds.length}, () => "w0").join("+") : "0"}_${i < winds.length ? "0" : "h0"}`).join("|");
    await ffmpeg([...files.flatMap(p => ["-i", p]), "-filter_complex", fc, "-q:v", "3", path.join(OUT, `wind_sweep_${v}.jpg`)]); console.log("sweep", v);
  }
  /* pixel differences main vs branch for the stills that must not change */
  const diff = {};
  for (const f of fs.readdirSync(OUT).filter(f => f.startsWith("new_") && f.endsWith("_raw.png"))) { const n = f.slice(4, -8), a = path.join(OUT, `main_${n}_raw.png`); if (!fs.existsSync(a)) continue;
    const A = await pixels(a), B = await pixels(path.join(OUT, f)); let s = 0, big = 0; for (let i = 0; i < A.length; i++) { const d = Math.abs(A[i] - B[i]); s += d; if (d > 8) big++; }
    diff[n] = {meanAbs: r3(s / A.length), over8Share: r3(big / A.length)}; }
  fs.writeFileSync(path.join(OUT, "pixel_diff.json"), JSON.stringify(diff, null, 1)); console.log("diff", JSON.stringify(diff));
  process.exit(0);
}

const S = await openScene(ROOT);
const {E, shot, cap} = S;
const fails = [], report = {bundle: S.bundle};
const killer = setTimeout(() => { console.log("TIMEOUT"); process.exit(3); }, +(process.env.LIMIT || 14400) * 1000);
const frameDir = name => { const d = path.join(OUT, `${TAG}${name}_frames`); fs.rmSync(d, {recursive: true, force: true}); fs.mkdirSync(d, {recursive: true}); return d; };
const fpath = (d, i) => path.join(d, `f${String(i).padStart(3, "0")}.png`);
const encode = (d, name, fps) => ffmpeg(["-framerate", String(fps), "-i", path.join(d, "f%03d.png"), "-vf", "format=yuv420p", "-c:v", "libx264", "-crf", "24", "-preset", "slow", path.join(OUT, `${TAG}${name}.mp4`)]);
const raw = async file => { await cap(""); await S.frames(3); await S.page.screenshot({path: file, type: "png"}); };

await E(() => {
  const q = window.__desQA(), C = window.__C(), V = q.W.position.constructor;
  window.__home = {p: C.De.position.clone(), q: C.De.quaternion.clone(), fov: C.De.fov, near: C.De.near};
  window.__homeView = () => { const H = window.__home; C.Ce.enabled = false; C.De.position.copy(H.p); C.De.quaternion.copy(H.q); C.De.fov = H.fov; C.De.near = H.near; C.De.updateProjectionMatrix(); C.De.updateMatrixWorld(true); };
  window.__restAll = () => q.ANIM.camels.forEach((o, i) => { const R = q.REST[i]; Object.assign(o, {x: R.x, z: R.z, yaw: R.yaw, mode: "rest", job: "kneel", k: 1, timer: 1e9, spd: 0, yr: 0, path: null, gy: null, goal: R});
    for (const k in o.r.acts) o.r.acts[k].stop(); o.r.fd = null; o.r.cur = null; q.fn.play(o.r, "kneel_rest", .01, 1); });
  window.__holdCrabs = () => { for (const c of q.CR.list) Object.assign(c, {x: c.bx, z: c.bz, mode: "in", t: 1e9, sk: 1}); };
  window.__edge = th => { const P = q.POND; let last = null; for (let s = .7; s < 1.3; s += .002) { const [x, z] = q.pondEdge(th, s); if (q.hTop(x, z) > P.wy) return last ? [(last[0] + x) / 2, (last[1] + z) / 2] : [x, z]; last = [x, z]; } return q.pondEdge(th, 1); };
  window.__trailView = () => { const P = q.POND, th = -.35, [wx, wz] = window.__edge(th), ox = wx - P.x, oz = wz - P.z, ol = Math.hypot(ox, oz), ux = ox / ol, uz = oz / ol;
    const ex = wx + ux * 1.5 + uz * .5, ez = wz + uz * 1.5 - ux * .5; return {e: [ex, q.hTop(ex, ez) + 1.6, ez], t: [wx - ux * .15, P.wy, wz - uz * .15], fov: 50}; };
  window.__look = v => { C.Ce.enabled = false; q.lookAt(...v.e, ...v.t); C.De.fov = v.fov; C.De.near = .02; C.De.updateProjectionMatrix(); C.De.updateMatrixWorld(true);
    window.__cur = v; return {cam: v.e.map(x => +x.toFixed(2)), eyeAboveSand: +(v.e[1] - q.hTop(v.e[0], v.e[2])).toFixed(2)}; };
  window.__px = (x, y, z) => { const v = new V(x, y, z); q.W.localToWorld(v); v.project(C.De); return v.z > 1 || v.x < -1 || v.x > 1 || v.y < -1 || v.y > 1 ? null : [(v.x * .5 + .5) * innerWidth, (.5 - v.y * .5) * innerHeight]; };
  window.__A = () => (.006 + .022 * q.pondU.uWind.value) * (1 - q.pondU.uIce.value);
  /* the trail view's bank grid (5 mm), the lap over the view's middle now */
  window.__grid = () => { const P = q.POND, v = window.__cur, [ux, uz] = [v.t[0] - v.e[0], v.t[2] - v.e[2]].map((a, _, A) => a / Math.hypot(A[0], A[1])), sx = -uz, sz = ux, cells = [];
    const [wx, wz] = window.__edge(-.35); let i = 0; for (let a = -.6; a <= .6; a += .005, i++) { let j = 0; for (let d = -1.2; d < 2.4; d += .005, j++) { const x = wx - ux * d + sx * a, z = wz - uz * d + sz * a, hh = q.hTop(x, z) - P.wy;
      if (hh < 0 || hh > .3) continue; const p = window.__px(x, q.hTop(x, z), z); if (p && p[0] > 2 && p[1] > 2 && p[0] < innerWidth - 2 && p[1] < innerHeight - 2) cells.push({i, j, hh: +hh.toFixed(4), p}); } }
    return {cells, lapNow: Math.max(0, q.lapAt(wx, wz, q.pondU.uT.value))}; };
  /* the default view's rim: per angle the points 1, 2, 3.5 and 5 cm and 25 cm up the bank from the still water */
  window.__rim = () => { const P = q.POND, o = [], HS = [.01, .02, .035, .05]; for (let th = 0; th < Math.PI * 2; th += .003) { const [ex, ez] = window.__edge(th), ux = Math.cos(th), uz = Math.sin(th); const b = []; let d = null;
      for (let s = 0; s < 3 && !d; s += .005) { const x = ex + ux * s, z = ez + uz * s, hh = q.hTop(x, z) - P.wy; if (b.length < HS.length && hh >= HS[b.length]) b.push([x, z]); if (hh >= .25) d = [x, z]; }
      if (b.length < HS.length || !d) continue; const pb = b.map(p => window.__px(p[0], q.hTop(...p), p[1])), pd = window.__px(d[0], q.hTop(...d), d[1]); if (pb.every(Boolean) && pd) o.push({th: +th.toFixed(3), b: pb, d: pd}); } return o; };
  window.__pondPx = () => window.__px(q.POND.x, q.POND.wy, q.POND.z);
  /* where a crab stands against the lap (d178): under it, on the bank, on fresh sand (left by the water in the last 3 s), near the shore */
  window.__crabAt = c => { const P = q.POND, t = q.pondU.uT.value, hh = c.y - P.wy, now = q.lapAt(c.x, c.z, t), act = !(c.mode === "in" || c.mode === "down" || c.mode === "emerge" || c.mode === "sub");
    let mx = -1; for (let ta = 0; ta <= 3 + 1e-6; ta += .1) mx = Math.max(mx, q.lapAt(c.x, c.z, t - ta));
    return {act, under: act && hh < now, bank: act && hh >= now, fresh: act && hh >= now && hh < mx, near: act && hh >= now && hh < window.__A() + .03, hh, now}; };
  /* the stop / step / slide bookkeeping, per crab, one call per sim frame */
  window.__stepper = () => { const S = {stops: [], cur: new Map()};
    S.tick = (c, dt) => { const A = window.__A(), hh = c.y - q.POND.wy, at = c.mode === "out" && (c.go === "trail" || c.go === "dodge" || c.go === "shore") && hh < A + .04;
      let s = S.cur.get(c); if (!at) { if (s) { S.close(s); S.cur.delete(c); } return; }
      if (!s) { s = {t: 0, steps: 0, lat: 0, other: 0, slide: 0, dirs: new Set(), run: null, px: c.x, pz: c.z, flips: 0, last: 0, amp: []}; S.cur.set(c, s); }
      const dx = c.x - s.px, dz = c.z - s.pz, d = Math.hypot(dx, dz); s.px = c.x; s.pz = c.z; s.t += dt;
      if (c.walk < .5) s.slide += d;
      if (d / dt > .015) { if (!s.run) s.run = {dx: 0, dz: 0, len: 0, yaw: c.yaw}; s.run.dx += dx; s.run.dz += dz; s.run.len += d; }
      else if (s.run) S.end(s); };
    S.end = s => { const r = s.run; s.run = null; const net = Math.hypot(r.dx, r.dz); if (net < .008) return; const rx = Math.cos(r.yaw), rz = -Math.sin(r.yaw), al = (r.dx * rx + r.dz * rz) / net;
      if (Math.abs(al) >= .9) { s.lat++; const sg = Math.sign(al); s.dirs.add(sg); if (s.last && sg !== s.last) s.flips++; s.last = sg; s.amp.push(net); } else s.other++; s.steps++; };
    S.close = s => { if (s.run) S.end(s); if (s.t >= 1) S.stops.push({s: +s.t.toFixed(2), lateral: s.lat, other: s.other, both: s.dirs.size > 1, flips: s.flips, slideMm: +(s.slide * 1000).toFixed(1), ampMm: s.amp.map(a => +(a * 1000).toFixed(1))}); };
    S.done = () => { for (const s of S.cur.values()) S.close(s); S.cur.clear(); const T = S.stops, m = f => T.length ? +(T.reduce((a, x) => a + f(x), 0) / T.length).toFixed(2) : null, A = T.flatMap(x => x.ampMm);
      return {stops: T.length, meanStopS: m(x => x.s), lateralStepsPerStop: m(x => x.lateral), otherMovesPerStop: m(x => x.other), stopsWith2PlusLateral: T.filter(x => x.lateral >= 2).length,
        stopsLeftAndRight: T.filter(x => x.both).length, stepsPerSecondAtShore: T.length ? +(T.reduce((a, x) => a + x.lateral, 0) / T.reduce((a, x) => a + x.s, 0)).toFixed(3) : null,
        meanStepMm: A.length ? +(A.reduce((a, x) => a + x, 0) / A.length).toFixed(1) : null, slideMmPerStop: m(x => x.slideMm), slideMmPerSecond: T.length ? +(T.reduce((a, x) => a + x.slideMm, 0) / T.reduce((a, x) => a + x.s, 0)).toFixed(2) : null}; };
    return S; };
});

try {
  if (want("wind")) {
    report.wind = {};
    for (const wv of (process.env.WINDS || ".3,.5,.65,.8,1").split(",").map(Number)) {
      const k = "w" + String(wv).replace(".", ""), NF = +(process.env.WF || 45);
      await E(w => { const q = window.__desQA(); window.__set({weather: "sun", ct: "clear", wind: w}); q.tod("day"); q.sim(20, .25); window.__restAll(); window.__holdCrabs(); q.step(10, 1 / 30); }, wv);
      const r = report.wind[k] = await E(() => { const q = window.__desQA(); return {...window.__look(window.__trailView()), wind: +q.pondU.uWind.value.toFixed(2), lapAmpCm: +(window.__A() * 100).toFixed(2)}; });
      /* a wash turning back at the view's middle, then 1 s: the trail it left is drying */
      r.waitedS = await E(() => { const q = window.__desQA(), [wx, wz] = window.__edge(-.35); let k = 0;
        for (; k < 600; k++) { const t = q.pondU.uT.value, a = q.lapAt(wx, wz, t), b = q.lapAt(wx, wz, t + 1 / 30), c0 = q.lapAt(wx, wz, t - 1 / 30);
          if (k > 3 && a >= b && a >= c0 && a > window.__A() * .3) break; q.step(1, 1 / 30); } q.step(30, 1 / 30); return +(k / 30).toFixed(2); });
      r.uT = await E(() => +window.__desQA().pondU.uT.value.toFixed(3));
      const G = await E(() => window.__grid());
      const fT = path.join(OUT, `${TAG}wind_${k}_trail.png`); await raw(fT); r.trail = await patchiness(fT, G);
      await E(() => window.__homeView()); const R = await E(() => window.__rim()), pp = await E(() => window.__pondPx());
      const fD = path.join(OUT, `${TAG}wind_${k}_default.png`); await raw(fD); r.defaultView = await rim(fD, R);
      /* the rim from the default shot, cropped round the pond and blown up 3x (no new render) */
      const cx = Math.max(0, Math.min(W - 400, Math.round(pp[0] - 200))), cy = Math.max(0, Math.min(H - 150, Math.round(pp[1] - 75)));
      await ffmpeg(["-i", fD, "-vf", `crop=400:150:${cx}:${cy},scale=1200:450:flags=lanczos`, path.join(OUT, `${TAG}wind_${k}_rimzoom.png`)]);
      /* closer still: the rim's right-hand stretch (where the bank faces the camera), 4x with no smoothing */
      const rp = R.reduce((a, r) => r.b[0][0] > a.b[0][0] ? r : a, R[0]).b[0], qx = Math.max(0, Math.min(W - 300, Math.round(rp[0] - 230))), qy = Math.max(0, Math.min(H - 110, Math.round(rp[1] - 70)));
      await ffmpeg(["-i", fD, "-vf", `crop=300:110:${qx}:${qy},scale=1200:440:flags=neighbor`, path.join(OUT, `${TAG}wind_${k}_rimclose.png`)]);
      console.log("wind", k, JSON.stringify({...r, trail: {...r.trail, wetShareByCm: undefined}}));
      if (!process.env.NOCLIP) { await E(() => window.__look(window.__cur)); await cap(`风 ${wv}：湿沙带和退水湿痕，眼高 1.6 米（实时）`); const d = frameDir(`wind_${k}`);
        for (let i = 0; i < NF; i++) { await E(() => window.__desQA().step(2, 1 / 30)); await S.frames(1); await S.page.screenshot({path: fpath(d, i)}); }
        await cap(""); await encode(d, `wind_${k}`, 15); }
    }
  }

  if (want("crab")) {
    report.crab = {};
    const part = k => !process.env.CRAB || process.env.CRAB.split(",").includes(k);
    if (part("census")) {
      report.crab.census = await E(min => { const q = window.__desQA(), C = window.__C(); window.__set({weather: "sun", ct: "clear", wind: .45}); q.tod("day"); q.sim(10, .25);
        C.Ce.enabled = false; q.lookAt(30, 25, 30, 0, 0, 0); q.step(1, 1 / 30);
        const L = q.CR.list, St = window.__stepper(); let bank = 0, fresh = 0, near = 0, under = 0, dodge = 0, trail = 0; const lastGo = L.map(c => c.go);
        for (let f = 0; f < min * 60 * 30; f++) { q.step(1, 1 / 30); if (q.st.phase !== "day") q.tod("day");
          L.forEach((c, i) => { if (c.go !== lastGo[i]) { if (c.go === "dodge") dodge++; if (c.go === "trail") trail++; lastGo[i] = c.go; }
            const s = window.__crabAt(c); if (s.under && c.go !== "water" && c.mode !== "run") under++; if (s.bank) bank++; if (s.fresh) fresh++; if (s.near) near++; St.tick(c, 1 / 30); }); }
        return {minutes: min, crabs: L.length, crabSecondsOnBank: +(bank / 30).toFixed(1), freshSeconds: +(fresh / 30).toFixed(1), freshShareOfBank: +(fresh / Math.max(1, bank)).toFixed(4),
          nearShareOfBank: +(near / Math.max(1, bank)).toFixed(4), secondsUnderLap: +(under / 30).toFixed(1), dodges: dodge, trailFollows: trail, shuffle: St.done()}; }, +(process.env.SHM || 6));
      console.log("crab census", JSON.stringify(report.crab.census)); }
    const place = i => E(i => { const q = window.__desQA(), P = q.POND, L = q.CR.list, c = L[i % L.length]; window.__restAll(); q.PA.noView = 1;
      for (const o of L) if (o !== c) Object.assign(o, {x: o.bx, z: o.bz, mode: "in", t: 1e9, sk: 1, go: null});
      const th = Math.atan2(c.bz - P.z, c.bx - P.x); let bx = c.bx, bz = c.bz;
      for (let s = .7; s < 1.3; s += .001) { const [x, z] = q.pondEdge(th, s); if (q.hTop(x, z) - P.wy > .002) { bx = x; bz = z; break; } }
      Object.assign(c, {x: bx, z: bz, mode: "out", t: 1e9, sk: 0, v: 0, go: null, yaw: th + Math.PI / 2}); q.step(2, 1 / 30);
      const scared = c.mode === "run", ux = Math.cos(th), uz = Math.sin(th), ex = bx - ux * 1.45 + uz * .4, ez = bz - uz * 1.45 - ux * .4;
      window.__look({e: [ex, P.wy + .45, ez], t: [bx + ux * .04, P.wy + .01, bz + uz * .04], fov: 28}); q.step(1, 1 / 30);
      window.__ci = i % L.length; window.__track = []; window.__st = window.__stepper(); return {crab: i % L.length, scared}; }, i);
    const tick = k => E(k => { const q = window.__desQA(), c = q.CR.list[window.__ci]; for (let j = 0; j < k; j++) { q.step(1, 1 / 30); window.__st.tick(c, 1 / 30); } const s = window.__crabAt(c);
      const r = {t: +q.pondU.uT.value.toFixed(2), mode: c.mode, go: c.go, x: +c.x.toFixed(4), z: +c.z.toFixed(4), yaw: +c.yaw.toFixed(3), walk: +c.walk.toFixed(2), sv: c.sv ? +c.sv.toFixed(4) : 0,
        hh: +s.hh.toFixed(4), lap: +s.now.toFixed(4), fresh: s.fresh, near: s.near, under: s.under, px: window.__px(c.x, c.y, c.z)}; window.__track.push(r); return r; }, k);
    const sumTrack = T => ({frames: T.length, freshShare: +(T.filter(s => s.fresh).length / T.length).toFixed(3), nearShare: +(T.filter(s => s.near).length / T.length).toFixed(3),
      underShare: +(T.filter(s => s.under).length / T.length).toFixed(3), trailFollows: T.filter((s, i) => s.go === "trail" && (i === 0 || T[i - 1].go !== "trail")).length});
    if (part("trials")) {
      await E(() => { const q = window.__desQA(); window.__set({weather: "sun", ct: "clear", wind: .45}); q.tod("day"); q.sim(4, .25); });
      const rows = [];
      for (let k = 0; k < +(process.env.TRIALS || 2); k++) for (let i = 0; i < 8; i++) { const p = await place(i); for (let f = 0; f < 360; f += 6) await tick(6);
        const T = await E(() => window.__track), st = await E(() => window.__st.done()); rows.push({...p, ...sumTrack(T), shuffle: st}); await E(() => window.__desQA().sim(3, .25)); }
      const calm = rows.filter(r => !r.scared), m = (R, f) => +(mean(R.map(f))).toFixed(3);
      report.crab.trials = {secondsEach: 12, n: calm.length, freshShare: m(calm, r => r.freshShare), nearShare: m(calm, r => r.nearShare), underShare: m(calm, r => r.underShare),
        stops: calm.reduce((a, r) => a + r.shuffle.stops, 0), lateralStepsPerStop: m(calm.filter(r => r.shuffle.stops), r => r.shuffle.lateralStepsPerStop),
        slideMmPerSecond: m(calm.filter(r => r.shuffle.stops), r => r.shuffle.slideMmPerSecond), rows};
      console.log("crab trials", JSON.stringify({...report.crab.trials, rows: undefined})); }
    if (part("clip")) {
      await E(() => { const q = window.__desQA(); window.__set({weather: "sun", ct: "clear", wind: .45}); q.tod("day"); q.sim(4, .25); });
      report.crab.clip = await place(+(process.env.CRABI || 0));
      await cap("螃蟹停在水边：面向水，沿岸左右横着小步挪动，每步之间停一下（12 秒，实时）");
      const d = frameDir("crab_shore");
      for (let i = 0; i < 180; i++) { await tick(2); await S.frames(1); await S.page.screenshot({path: fpath(d, i)}); }
      await cap(""); await encode(d, "crab_shore", 15);
      const T = report.crab.clip.track = await E(() => window.__track); Object.assign(report.crab.clip, sumTrack(T), {shuffle: await E(() => window.__st.done())});
      /* the strip: 8 frames, every 2nd (0.27 s), from 4 frames before the first shuffle step (or the middle when there is none), cropped round the crab */
      const s0 = T.findIndex((s, i) => i > 3 && s.mode === "out" && s.sv && !T[i - 1].sv), i0 = s0 < 0 ? 80 : Math.max(0, s0 - 4), pick = Array.from({length: 8}, (_, j) => Math.min(179, i0 + j * 2));
      const pc = T[pick[0]].px || [W / 2, H / 2], cx = Math.max(0, Math.min(W - 320, Math.round(pc[0] - 160))), cy = Math.max(0, Math.min(H - 240, Math.round(pc[1] - 140)));
      report.crab.clip.strip = {frames: pick, firstStepFrame: s0, crop: [cx, cy, 320, 240], xs: pick.map(i => T[i].px && +T[i].px[0].toFixed(1)), sv: pick.map(i => T[i].sv), walk: pick.map(i => T[i].walk)};
      const fc = pick.map((f, j) => `[${j}:v]crop=320:240:${cx}:${cy},${lab(`${(f * 2 / 30).toFixed(2)}s`, 18)}[c${j}]`).join(";") + ";" + pick.map((_, j) => `[c${j}]`).join("") + "xstack=inputs=8:layout=0_0|w0_0|w0+w1_0|w0+w1+w2_0|0_h0|w0_h0|w0+w1_h0|w0+w1+w2_h0";
      await ffmpeg([...pick.flatMap(f => ["-i", fpath(d, f)]), "-filter_complex", fc, "-q:v", "3", path.join(OUT, `${TAG}crab_strip.png`)]);
      console.log("crab clip", JSON.stringify({...report.crab.clip, track: undefined})); }
  }

  if (want("weather")) {
    report.weather = {};
    const Wx = [["rain_w045", "下雨，风 0.45", () => { window.__set({weather: "mrain", ct: "overcast", wind: .45}); window.__desQA().tod("day"); window.__desQA().sim(60, .25); }],
      ["rain_w1", "下雨，风 1", () => { window.__set({weather: "mrain", ct: "overcast", wind: 1}); window.__desQA().tod("day"); window.__desQA().sim(60, .25); }],
      ["night_w045", "夜里，风 0.45", () => { window.__set({weather: "sun", ct: "clear", wind: .45}); window.__desQA().tod("night"); window.__desQA().sim(60, .25); }],
      ["night_w1", "夜里，风 1", () => { window.__set({weather: "sun", ct: "clear", wind: 1}); window.__desQA().tod("night"); window.__desQA().sim(60, .25); }],
      ["frozen", "结冰（下雪的夜后清晨）", () => { const q = window.__desQA(); window.__set({weather: "snow", snowLv: 2, ct: "overcast", wind: .4}); q.tod("night"); q.sim(400, .5);
        q.tod("sunrise"); q.sim(40, .5); window.__set({weather: "sun", ct: "clear", wind: .35}); q.sim(4, .25); }]];
    for (const [n, zh, f] of Wx.filter(([n]) => !process.env.ONLY || process.env.ONLY.split(",").includes(n))) {
      await E(() => window.__holdCrabs());
      await E(`(${f})()`); await E(() => { window.__restAll(); window.__holdCrabs(); window.__desQA().step(10, 1 / 30); });
      const r = report.weather[n] = await E(() => { const q = window.__desQA(); return {...window.__look(window.__trailView()), wind: +q.pondU.uWind.value.toFixed(2), rain: +q.WX.rain.toFixed(3), wet: +q.WX.wet.toFixed(3), ice: +q.WX.ice.toFixed(3), night: +q.st.night.toFixed(2), uT: +q.pondU.uT.value.toFixed(2)}; });
      const G = await E(() => window.__grid()), fR = path.join(OUT, `${TAG}weather_${n}_raw.png`); await raw(fR);
      const buf = await pixels(fR), L = h0 => r1(mean(G.cells.filter(c => c.hh >= h0 && c.hh < h0 + .01).map(c => lum(buf, c.p[0], c.p[1], 0))));
      r.lumByHeight = {"0-1cm": L(0), "2-3cm": L(.02), "4-5cm": L(.04), "6-7cm": L(.06), "8-9cm": L(.08), "15-16cm": L(.15), "25-26cm": L(.25)}; r.patch = await patchiness(fR, G);
      await cap(zh); await shot(path.join(OUT, `${TAG}weather_${n}.png`)); await cap("");
      console.log("weather", n, JSON.stringify({...r, patch: {...r.patch, wetShareByCm: undefined}}));
    }
  }
} catch (e) { console.log("ERR", e.stack || e); fails.push(String(e)); }
report.fails = fails;
fs.writeFileSync(path.join(OUT, `${TAG}d180-report-${WHICH.replace(/,/g, "+")}.json`), JSON.stringify(report, null, 1));
clearTimeout(killer); await S.close();
process.exit(fails.length ? 1 : 0);
