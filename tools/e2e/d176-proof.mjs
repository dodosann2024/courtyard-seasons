// Desert d176 proofs, on any checkout (DIR, default this one; assets are committed, nothing is built). Not part of CI.
//   trail    the east beach waterline from 1.6 m eye level, standing 1.5 m back from it: a still at the moment the lapping water draws back, a clip of a
//            retreat cycle, and the brightness of the sand the water just left (TRAIL point), the wet band and dry sand, frame by frame
//   weather  standing on the bank opposite the key light (sun, or the moon at night), eyes 1.6 m up, looking toward it across the
//            waterline: rain, dusk, night and frozen (dawn after a snowy night). A still and a clip each, and the brightness and warmth
//            of the wet band, the dry sand and the water, with the share of glinting water samples (ONLY=rain,dusk,night,frozen)
//   kneel    a camel lies 180 s on open sand in a light breeze, gets up and walks off; then a fresh wind (0.7, blowing sand) wears the
//            hollows of its knees and chest and its hoofprints. Stills at fixed times (KT, seconds after it got up) and the wear of each
//   ver      the scene panel open, with its 「版本 xxxxxx」 label
//   pair     (no browser) OUT/main_<n>.png | OUT/new_<n>.png -> <n>_before_after.jpg; main_<n>.mp4 | new_<n>.mp4 -> <n>_before_after.mp4
// Usage: node tools/e2e/d176-proof.mjs <mode[,mode]>   (OUT=/tmp/d176/out DIR=<checkout> TAG=<prefix> KT=0,75,400)
import fs from "node:fs";
import path from "node:path";
import {execFile} from "node:child_process";
import {fileURLToPath} from "node:url";
import {openScene, ffmpeg, sleep} from "./d172-lib.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(process.env.DIR || path.join(HERE, "../.."));
const OUT = process.env.OUT || "/tmp/d176/out", TAG = process.env.TAG || "";
const WHICH = process.argv[2] || "trail", want = k => WHICH.split(",").includes(k);
fs.mkdirSync(OUT, {recursive: true});
const FONT = "/usr/share/fonts/truetype/wqy/wqy-microhei.ttc";
const lab = t => `drawtext=fontfile=${FONT}:text='${t}':x=14:y=12:fontsize=26:fontcolor=white:borderw=2:bordercolor=black`;

if (WHICH === "pair") {
  const MAINJS = process.env.MAINJS || "main", NEWJS = process.env.NEWJS || "本分支";
  const cols = [["main", `修改前（main，${MAINJS}）`], ["new", `修改后（本分支，${NEWJS}）`]];
  for (const f of fs.readdirSync(OUT).filter(f => f.startsWith("new_") && /\.(png|mp4)$/.test(f))) {
    const ext = path.extname(f), n = f.slice(4, -ext.length), ins = cols.map(([k]) => path.join(OUT, `${k}_${n}${ext}`));
    if (!ins.every(p => fs.existsSync(p))) continue;
    const fc = cols.map(([, t], i) => `[${i}:v]scale=960:-2,${lab(t)}[c${i}]`).join(";") + ";[c0][c1]hstack=inputs=2";
    if (ext === ".png") await ffmpeg([...ins.flatMap(p => ["-i", p]), "-filter_complex", fc, "-q:v", "3", path.join(OUT, `${n}_before_after.jpg`)]);
    else await ffmpeg([...ins.flatMap(p => ["-i", p]), "-filter_complex", fc + ",format=yuv420p", "-c:v", "libx264", "-crf", "26", "-preset", "slow", "-shortest", path.join(OUT, `${n}_before_after.mp4`)]);
    console.log("pair", n + ext);
  }
  process.exit(0);
}

/* the frame's pixels (rgb, 0..255) */
const pixels = file => new Promise((res, rej) => execFile("ffmpeg", ["-loglevel", "error", "-i", file, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
  {encoding: "buffer", maxBuffer: 1e8}, (e, o) => e ? rej(e) : res(o)));
const W = 1280, H = 720;
/* mean colour of a 5x5 patch at each screen point, then of all of them; lum is Rec.709 luma of the sRGB values */
const patch = (buf, pts) => { let r = 0, g = 0, b = 0, n = 0;
  for (const [x, y] of pts) for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const X = Math.round(x) + dx, Y = Math.round(y) + dy;
    if (X < 0 || Y < 0 || X >= W || Y >= H) continue; const i = (Y * W + X) * 3; r += buf[i]; g += buf[i + 1]; b += buf[i + 2]; n++; }
  if (!n) return null; r /= n; g /= n; b /= n; return {lum: +(.2126 * r + .7152 * g + .0722 * b).toFixed(1), warm: +(r / Math.max(b, 1)).toFixed(3), n: n / 25}; };

const S = await openScene(ROOT);
const {E, shot, cap} = S;
const fails = [], report = {bundle: S.bundle};
const killer = setTimeout(() => { console.log("TIMEOUT"); process.exit(3); }, +(process.env.LIMIT || 7200) * 1000);
const clip = async (name, n, every, fps) => {
  const dir = path.join(OUT, `${TAG}${name}_frames`); fs.rmSync(dir, {recursive: true, force: true}); fs.mkdirSync(dir, {recursive: true});
  for (let i = 0; i < n; i++) { await E(k => window.__desQA().step(k, 1 / 30), every); await S.frames(2); await S.page.screenshot({path: path.join(dir, `f${String(i).padStart(3, "0")}.png`)}); }
  await ffmpeg(["-framerate", String(fps), "-i", path.join(dir, "f%03d.png"), "-vf", "format=yuv420p", "-c:v", "libx264", "-crf", "24", "-preset", "slow", path.join(OUT, `${TAG}${name}.mp4`)]);
  console.log("clip", name);
  return dir;
};

await E(() => {
  const q = window.__desQA(), V = q.W.position.constructor;
  window.__restAll = () => q.ANIM.camels.forEach((o, i) => { const R = q.REST[i]; Object.assign(o, {x: R.x, z: R.z, yaw: R.yaw, mode: "rest", job: "kneel", k: 1, timer: 1e9, spd: 0, yr: 0, path: null, gy: null, goal: R});
    for (const k in o.r.acts) o.r.acts[k].stop(); o.r.fd = null; o.r.cur = null; q.fn.play(o.r, "kneel_rest", .01, 1); });
  /* the key light (the sun, or the moon at night) in island axes, horizontal */
  window.__keyDir = () => { let sc = q.W; while (sc.parent) sc = sc.parent; let L = null; sc.traverse(o => { if (o.isDirectionalLight && o.castShadow && !L) L = o; });
    const d = L.position.clone().normalize().applyAxisAngle(new V(0, 1, 0), -q.YAW), h = Math.hypot(d.x, d.z) || 1; return [d.x / h, d.z / h]; };
  /* the waterline at angle th round the pond: where the bank rises through the water level */
  window.__edge = th => { const P = q.POND; let last = null; for (let s = .7; s < 1.3; s += .002) { const [x, z] = q.pondEdge(th, s); if (q.hTop(x, z) > P.wy) return last ? [(last[0] + x) / 2, (last[1] + z) / 2] : [x, z]; last = [x, z]; } return q.pondEdge(th, 1); };
  window.__views = {
    /* the east beach (d175's shoreEye stretch): eyes 1.6 m above the sand, standing 1.5 m back from the waterline */
    trail: () => { const P = q.POND, th = -.35, [wx, wz] = window.__edge(th), ox = wx - P.x, oz = wz - P.z, ol = Math.hypot(ox, oz), ux = ox / ol, uz = oz / ol;
      const ex = wx + ux * 1.5 + uz * .5, ez = wz + uz * 1.5 - ux * .5; return {e: [ex, q.hTop(ex, ez) + 1.6, ez], t: [wx - ux * .15, P.wy, wz - uz * .15], w: [wx, wz], u: [ux, uz], fov: 50}; },
    /* on the bank opposite the key light, 2.4 m back from the waterline, eyes 1.6 m up, looking toward it across the water */
    light: () => { const P = q.POND, [kx, kz] = window.__keyDir(), th = Math.atan2(-kz * P.rx, -kx * P.rz), [wx, wz] = window.__edge(th), ox = wx - P.x, oz = wz - P.z, ol = Math.hypot(ox, oz), ux = ox / ol, uz = oz / ol;
      const ex = wx + ux * 2.4, ez = wz + uz * 2.4; return {e: [ex, q.hTop(ex, ez) + 1.6, ez], t: [wx - ux * 1.6, P.wy, wz - uz * 1.6], w: [wx, wz], u: [ux, uz], fov: 55}; }};
  window.__look = k => { const v = window.__views[k](), C = window.__C(); C.Ce.enabled = false; q.lookAt(...v.e, ...v.t); C.De.fov = v.fov; C.De.near = .02; C.De.updateProjectionMatrix(); C.De.updateMatrixWorld(true);
    /* one frame of scene time, so the pond's own camera uniform follows the move */
    q.step(1, 1 / 30); window.__cur = v; return {cam: v.e.map(x => +x.toFixed(2)), eyeAboveSand: +(v.e[1] - q.hTop(v.e[0], v.e[2])).toFixed(2), waterline: v.w.map(x => +x.toFixed(2))}; };
  /* screen pixel of an island point */
  window.__px = (x, y, z) => { const C = window.__C(), v = new V(x, y, z); q.W.localToWorld(v); v.project(C.De); return v.z > 1 ? null : [(v.x * .5 + .5) * innerWidth, (.5 - v.y * .5) * innerHeight]; };
  /* sample points on the bank up from the waterline (by height above the water, hh in [lo, hi]) across a 1.2 m stretch, and on the water */
  window.__samples = () => { const v = window.__cur, P = q.POND, [ux, uz] = v.u, sx = -uz, sz = ux, bank = (lo, hi) => { const o = [];
      for (let a = -.6; a <= .6; a += .1) for (let d = 0; d < 2.4; d += .004) { const x = v.w[0] + ux * d + sx * a, z = v.w[1] + uz * d + sz * a, hh = q.hTop(x, z) - P.wy;
        if (hh >= lo && hh <= hi) { const p = window.__px(x, q.hTop(x, z), z); if (p && p[0] > 3 && p[1] > 3 && p[0] < innerWidth - 3 && p[1] < innerHeight - 3) o.push(p); } } return o; };
    const water = []; for (let a = -2; a <= 2; a += .08) for (let d = .3; d < 4; d += .08) { const x = v.w[0] - ux * d + sx * a, z = v.w[1] - uz * d + sz * a;
      if (q.hTop(x, z) < P.wy - .03) { const p = window.__px(x, P.wy, z); if (p && p[0] > 3 && p[1] > 3 && p[0] < innerWidth - 3 && p[1] < innerHeight - 3) water.push(p); } }
    const A = .006 + .022 * q.pondU.uWind.value;
    return {trail: bank(A * .35, A * .6), band: bank(.045, .06), dry: bank(.125, .14), water, A}; };
  window.__clear = (cx, cz, r) => {
    const far = []; for (let x = -40; x <= 40; x += 2) for (let z = -40; z <= 40; z += 2) if (q.sN(x, z) < .8 && Math.hypot(x - cx, z - cz) > r && Math.hypot(x - q.TENT.x, z - q.TENT.z) > 8) far.push({x, z});
    q.PA.os.forEach((o, i) => { const p = far[(i * 37 + 5) % far.length]; q.osPlace(o, p.x, p.z, 0); o.mode = "graze"; o.t = 999; o.path = null; });
    q.PA.tt.forEach((o, i) => { const p = far[(i * 53 + 11) % far.length]; q.torPlace(o, p.x, p.z, 0); o.mode = "stand"; o.t = 999; });
  };
  window.__put = (ci, x, z, yaw) => {
    const a = q.ANIM.camels[ci], o = q.ANIM.camels[1 - ci], R = q.REST[1 - ci];
    Object.assign(o, {x: R.x, z: R.z, yaw: R.yaw, mode: "rest", job: "kneel", k: 1, timer: 1e9, spd: 0, yr: 0, path: null, gy: null, goal: R});
    for (const k in o.r.acts) o.r.acts[k].stop(); o.r.fd = null; o.r.cur = null; q.fn.play(o.r, "kneel_rest", .01, 1);
    Object.assign(a, {x, z, yaw, k: 0, spd: 0, yr: 0, path: null, pi: 0, gy: null, mode: "job", job: "idle", timer: 1e9, face: null, stuck: 0});
    for (const k in a.r.acts) a.r.acts[k].stop(); a.r.fd = null; a.r.cur = null; q.fn.play(a.r, "idle", .01, 1);
    for (const c of q.ANIM.camels) for (const f of c.feet) f.p = null;
    return a;
  };
});
const measure = async (file, smp) => { const buf = await pixels(file); const o = {}; for (const k of ["trail", "band", "dry"]) o[k] = patch(buf, smp[k]);
  /* water: mean, and the share of samples that glint (over 1.6x the median and over 150) */
  const L = smp.water.map(p => patch(buf, [p])).filter(Boolean), ls = L.map(x => x.lum).sort((a, b) => a - b), med = ls[ls.length >> 1] || 0;
  o.water = {lum: +(ls.reduce((a, x) => a + x, 0) / Math.max(1, ls.length)).toFixed(1), warm: +(L.reduce((a, x) => a + x.warm, 0) / Math.max(1, L.length)).toFixed(3), n: ls.length,
    glint: +(ls.filter(x => x > Math.max(150, med * 1.6)).length / Math.max(1, ls.length)).toFixed(4)};
  return o; };

try {
  if (want("trail")) {
    await E(() => { const q = window.__desQA(); window.__set({weather: "sun", ct: "clear", wind: .45}); q.tod("day"); q.sim(20); window.__restAll(); q.step(10, 1 / 30); });
    report.trail = await E(() => window.__look("trail"));
    /* the still: step on until the water at this stretch of bank has just drawn back from its reach (the lap is falling fast) */
    report.trail.still = await E(() => { const q = window.__desQA(), P = q.POND, u = q.pondU, v = window.__cur, th = Math.atan2(v.w[1] - P.z, v.w[0] - P.x),
      lap = t => Math.sin(t * 1.15 + th * 9.) * .6 + Math.sin(t * .67 + th * 4. + 1.3) * .4;
      for (let i = 0; i < 30 * 12; i++) { const t = u.uT.value; if (lap(t - 1.2) > .75 && lap(t) < -.2) break; q.step(1, 1 / 30); }
      return {t: +u.uT.value.toFixed(2), wind: +u.uWind.value.toFixed(2)}; });
    const smp = await E(() => window.__samples());
    report.trail.samples = {trail: smp.trail.length, band: smp.band.length, dry: smp.dry.length, lapAmp: +smp.A.toFixed(4)};
    await shot(path.join(OUT, `${TAG}trail_eye.png`));
    report.trail.at = await measure(path.join(OUT, `${TAG}trail_eye.png`), smp);
    /* the retreat cycle: 90 frames 4 sim frames apart (12 s of scene time), played at 15 fps; the trail patch brightness in each */
    if (process.env.NOCLIP) throw "noclip";
    const dir = await clip("trail_clip", 90, 4, 15);
    report.trail.series = [];
    for (let i = 0; i < 90; i++) { const buf = await pixels(path.join(dir, `f${String(i).padStart(3, "0")}.png`));
      report.trail.series.push({t: +((i + 1) * 4 / 30).toFixed(2), trail: patch(buf, smp.trail)?.lum, band: patch(buf, smp.band)?.lum, dry: patch(buf, smp.dry)?.lum}); }
    console.log("trail", JSON.stringify(report.trail.at));
  }

  if (want("weather")) {
    report.weather = {};
    const Wx = [
      ["rain", "下雨", () => { const q = window.__desQA(); window.__set({weather: "mrain", ct: "overcast", wind: .45}); q.tod("day"); q.sim(60, .25); window.__restAll(); q.step(10, 1 / 30); }],
      ["dusk", "黄昏（朝着低太阳）", () => { const q = window.__desQA(); window.__set({weather: "sun", ct: "clear", wind: .45}); q.tod("sunset"); q.sim(60, .25); window.__restAll(); q.step(10, 1 / 30); }],
      ["night", "夜里（朝着月亮）", () => { const q = window.__desQA(); window.__set({weather: "sun", ct: "clear", wind: .45}); q.tod("night"); q.sim(60, .25); window.__restAll(); q.step(10, 1 / 30); }],
      ["frozen", "结冰（下雪的夜后清晨）", () => { const q = window.__desQA(); window.__set({weather: "snow", snowLv: 2, ct: "overcast", wind: .4}); q.tod("night"); q.sim(400, .5);
        q.tod("sunrise"); q.sim(40, .5); window.__set({weather: "sun", ct: "clear", wind: .35}); q.sim(4, .25); window.__restAll(); q.step(10, 1 / 30); }]];
    for (const [n, zh, f] of Wx.filter(([n]) => !process.env.ONLY || process.env.ONLY.split(",").includes(n))) {
      await E(`(${f})()`);
      const r = report.weather[n] = await E(() => { const q = window.__desQA(), r = window.__look("light"); return {...r, rain: +q.WX.rain.toFixed(3), wet: +q.WX.wet.toFixed(3), ice: +q.WX.ice.toFixed(3), snow: +q.WX.sc.toFixed(3), night: +q.st.night.toFixed(2)}; });
      { const smp = await E(() => window.__samples()); r.samples = {band: smp.band.length, dry: smp.dry.length, water: smp.water.length};
        await cap(`${zh}，眼高 ${r.eyeAboveSand} 米`); await shot(path.join(OUT, `${TAG}weather_${n}.png`)); await cap("");
        await shot(path.join(OUT, `${TAG}weather_${n}_raw.png`)); r.at = await measure(path.join(OUT, `${TAG}weather_${n}_raw.png`), smp); fs.rmSync(path.join(OUT, `${TAG}weather_${n}_raw.png`)); }
      if (!process.env.NOCLIP) { await cap(`${zh}，眼高 ${r.eyeAboveSand} 米`); await clip(`weather_${n}`, 60, 2, 15); await cap(""); }
      console.log("weather", n, JSON.stringify(r));
    }
  }

  if (want("kneel")) {
    const KT = (process.env.KT || "0,75,400").split(",").map(Number);
    report.kneel = {times: KT, wind: .7, shots: []};
    /* the dromedary kneels on open sand, lies 180 s in an everyday breeze (RW, default 0.45), gets up and walks 4 m on */
    const RW = +(process.env.RW || .45);
    report.kneel.lay = await E(rw => { const q = window.__desQA(); window.__set({weather: "sun", ct: "clear", wind: rw}); q.tod("day"); const a = window.__put(0, 4, -9, .9); window.__clear(4, -9, 9); q.step(20, 1 / 30); const fromLay = q.PR.i;
      Object.assign(a, {mode: "turn", job: "kneel", face: a.yaw, spd: 0, yr: 0});
      for (let i = 0; i < 30 * 40 && a.mode !== "rest"; i++) q.step(1, 1 / 30); a.timer = 1e9; const E0 = q.PR.E; q.sim(180, 1 / 15);
      /* the pad prints are found in the ring by kind (knee / chest), so main and branch are read the same way */
      const pads = []; for (let i = fromLay; i !== q.PR.i; i = (i + 1) % (q.PR.N - q.PR.G)) { const k = Math.floor(q.PR.im.instanceColor.array[i * 3] + .001); if (k === q.PRK.knee || k === q.PRK.chest) pads.push({i, x: q.PR.im.instanceMatrix.array[i * 16 + 12], z: q.PR.im.instanceMatrix.array[i * 16 + 14]}); }
      /* the print each pad finally rests in (the others were laid on the way down, a few cm off) */
      const fin = Object.values(a.prs || {}).map(p => { let b = null; for (const r of pads) if (Math.hypot(r.x - p.x, r.z - p.z) < .02) b = r; return b; }).filter(Boolean);
      a.timer = -1; for (let i = 0; i < 30 * 12 && a.mode !== "job"; i++) q.step(1, 1 / 30);
      const s = Math.sin(a.yaw), c = Math.cos(a.yaw), from = q.PR.i;
      q.fn.camelGo(a, {x: a.x + s * 4.5, z: a.z + c * 4.5}, "idle"); for (let i = 0; i < 30 * 20 && a.mode === "walk"; i++) q.step(1, 1 / 30);
      a.mode = "job"; a.job = "idle"; a.timer = 1e9;
      const hoof = []; for (let i = from; i !== q.PR.i; i = (i + 1) % (q.PR.N - q.PR.G)) { const k = Math.floor(q.PR.im.instanceColor.array[i * 3] + .001); if (k <= 1) hoof.push({i, x: q.PR.im.instanceMatrix.array[i * 16 + 12], z: q.PR.im.instanceMatrix.array[i * 16 + 14]}); }
      window.__kn = {pads: fin, hoof, cam: (() => { const m = q.PR.im.instanceMatrix.array, cx = pads.reduce((s, p) => s + m[p.i * 16 + 12], 0) / Math.max(1, pads.length), cz = pads.reduce((s, p) => s + m[p.i * 16 + 14], 0) / Math.max(1, pads.length);
        const px = cx + c * 2.2 - s * .6, pz = cz - s * 2.2 - c * .6; return [px, q.hTop(px, pz) + 1.2, pz, cx + s * .5, q.hTop(cx, cz), cz + c * .5]; })()};
      return {restSec: 180, restWind: rw, restWear: +(q.PR.E - E0).toFixed(3), pads: fin.length, padsOnTheWayDown: pads.length - fin.length, hoofprints: hoof.length, camelAt: [+a.x.toFixed(2), +a.z.toFixed(2)]}; }, RW);
    console.log("kneel lay", JSON.stringify(report.kneel.lay));
    const wear = () => E(() => { const q = window.__desQA(), c = q.PR.im.instanceColor.array, m = q.PR.im.instanceMatrix.array, A = (i, x, z) => Math.hypot(m[i * 16 + 12] - x, m[i * 16 + 14] - z) > .02 ? 0 : +Math.min(1, Math.max(0, c[i * 3 + 2] * Math.exp(-Math.max(q.PR.E - c[i * 3 + 1], 0)))).toFixed(3);
      const k = window.__kn; return {E: +q.PR.E.toFixed(3), pads: k.pads.map(p => A(p.i, p.x, p.z)), hoof: k.hoof.length ? A(k.hoof[k.hoof.length - 1].i, k.hoof[k.hoof.length - 1].x, k.hoof[k.hoof.length - 1].z) : null}; });
    let tNow = 0;
    await E(() => { const q = window.__desQA(); window.__set({weather: "sun", ct: "clear", wind: .7}); q.sim(3, 1 / 15); });
    for (const t of KT) {
      if (t > tNow) await E(s => window.__desQA().sim(s, 1 / 15), t - tNow); tNow = t;
      await E(() => { const q = window.__desQA(), C = window.__C(), k = window.__kn.cam; C.Ce.enabled = false; q.lookAt(...k); C.De.fov = 45; C.De.near = .02; C.De.updateProjectionMatrix(); q.step(2, 1 / 30); });
      const w = await wear(); w.t = t; report.kneel.shots.push(w);
      /* "a" is the print's strength: 1 fresh, under ~0.87 its rim starts to go and the drift fills it, under 0.01 it is gone */
      await cap(`起身走开后 ${t} 秒（风 0.7，吹沙）：膝窝/胸窝强度 ${w.pads.map(x => x == null ? "-" : x.toFixed(2)).join(" / ")}，蹄印 ${w.hoof == null ? "-" : w.hoof.toFixed(2)}`);
      await shot(path.join(OUT, `${TAG}kneel_t${t}.png`)); await cap("");
      console.log("kneel", JSON.stringify(w));
    }
  }

  if (want("ver")) {
    await cap("");
    await E(() => { window.__set({weather: "sun", ct: "clear", wind: .3}); window.__desQA().sim(2); });
    await E(() => { document.body.classList.remove("col"); for (const s of ["#fab", "#sbtn", "#tp"]) { const n = document.querySelector(s); if (n) n.style.display = ""; } });
    await E(() => { const q = window.__desQA(); window.__C().Ce.enabled = true; q.lookAt(-4.16, 11.13, 19.58, 0, 0, 0); q.step(1, 1 / 30); });
    await sleep(2500); await E(() => { const v = document.getElementById("ver"); if (v) v.scrollIntoView({block: "center"}); }); await sleep(800);
    report.ver = await E(() => { const v = document.getElementById("ver"), r = v && v.getBoundingClientRect(); return {text: v && v.textContent, bundle: window.CY && window.CY.desert, visible: !!r && r.width > 0 && r.bottom > 0 && r.top < innerHeight}; });
    const m = /desert\.(\w{6})/.exec(report.ver.bundle || ""); report.ver.match = !!m && report.ver.text === "版本 " + m[1];
    console.log("ver", JSON.stringify(report.ver)); if (!report.ver.match || !report.ver.visible) fails.push("version label");
    await shot(path.join(OUT, `${TAG}panel_version.png`));
  }
} catch (e) { if (e !== "noclip") { console.log("ERR", e.stack || e); fails.push(String(e)); } }
report.fails = fails;
fs.writeFileSync(path.join(OUT, `${TAG}d176-report-${WHICH.replace(/,/g, "+")}.json`), JSON.stringify(report, null, 1));
clearTimeout(killer); await S.close();
process.exit(fails.length ? 1 : 0);
