// Desert d177 proofs, on any checkout (DIR, default this one; assets are committed, nothing is built). Not part of CI.
//   weather  standing on the bank opposite the key light, eyes 1.6 m up, looking toward it across the waterline (d176's view): rain, dusk,
//            night and frozen. A still (and a clip unless NOCLIP) each, with the brightness of the wet band, the trail, dry sand and water (ONLY=...)
//   wind     the east beach from 1.6 m (d176's trail view) in an everyday breeze (0.45) and a strong wind (1.0): a clip of 8 s each and the mean
//            brightness of the retreat trail and the wet band over it, plus how long the trail stays dark after the water draws back
//   shore    crabs at the lapping edge: one crab set down on the bank inside the reach of the lap, watched from 0.45 m up for 12 s (still + clip),
//            and every crab over SHM sim minutes (default 6): time spent out on the bank, time with the lap over it, dodges and trail follows.
//            Fish: the shallow margin from above at midday, the fish's shadows on the bed and the caustic net in and around them
//   drink    the camel drink close-up (d177-drink.mjs) in repeated runs: fresh, again at once, after a 6 min day, after a 30 min mixed-weather
//            session, with the orbit controls on and wind 1 left over; d172's old probe next to it in the same session
//   ver      the scene panel open, with its 「版本 xxxxxx」 label
//   pair     (no browser) OUT/main_<n>.png | OUT/new_<n>.png -> <n>_before_after.jpg; main_<n>.mp4 | new_<n>.mp4 -> <n>_before_after.mp4
// Usage: node tools/e2e/d177-proof.mjs <mode[,mode]>   (OUT=/tmp/d177/out DIR=<checkout> TAG=<prefix>)
import fs from "node:fs";
import path from "node:path";
import {execFile} from "node:child_process";
import {fileURLToPath} from "node:url";
import {openScene, ffmpeg, sleep} from "./d172-lib.mjs";
import {drinkProbe, oldProbe} from "./d177-drink.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(process.env.DIR || path.join(HERE, "../.."));
const OUT = process.env.OUT || "/tmp/d177/out", TAG = process.env.TAG || "";
const WHICH = process.argv[2] || "weather", want = k => WHICH.split(",").includes(k);
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

const pixels = file => new Promise((res, rej) => execFile("ffmpeg", ["-loglevel", "error", "-i", file, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
  {encoding: "buffer", maxBuffer: 1e8}, (e, o) => e ? rej(e) : res(o)));
const W = 1280, H = 720;
/* mean colour of a 5x5 patch at each screen point, then of all of them; lum is Rec.709 luma of the sRGB values */
const patch = (buf, pts) => { let r = 0, g = 0, b = 0, n = 0;
  for (const [x, y] of pts) for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const X = Math.round(x) + dx, Y = Math.round(y) + dy;
    if (X < 0 || Y < 0 || X >= W || Y >= H) continue; const i = (Y * W + X) * 3; r += buf[i]; g += buf[i + 1]; b += buf[i + 2]; n++; }
  if (!n) return null; r /= n; g /= n; b /= n; return {lum: +(.2126 * r + .7152 * g + .0722 * b).toFixed(1), warm: +(r / Math.max(b, 1)).toFixed(3), n: n / 25}; };
const pdiff = async (a, b) => { const A = await pixels(a), B = await pixels(b); let d = 0, mx = 0, n = 0; for (let i = 0; i < A.length; i++) { const x = Math.abs(A[i] - B[i]); d += x; if (x > mx) mx = x; if (x > 8) n++; }
  return {meanAbs: +(d / A.length).toFixed(3), max: mx, over8Share: +(n / A.length).toFixed(5)}; };

const S = await openScene(ROOT);
const {E, shot, cap} = S;
const fails = [], report = {bundle: S.bundle};
const killer = setTimeout(() => { console.log("TIMEOUT"); process.exit(3); }, +(process.env.LIMIT || 10800) * 1000);
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
  window.__keyDir = () => { let sc = q.W; while (sc.parent) sc = sc.parent; let L = null; sc.traverse(o => { if (o.isDirectionalLight && o.castShadow && !L) L = o; });
    const d = L.position.clone().normalize().applyAxisAngle(new V(0, 1, 0), -q.YAW), h = Math.hypot(d.x, d.z) || 1; return [d.x / h, d.z / h]; };
  window.__edge = th => { const P = q.POND; let last = null; for (let s = .7; s < 1.3; s += .002) { const [x, z] = q.pondEdge(th, s); if (q.hTop(x, z) > P.wy) return last ? [(last[0] + x) / 2, (last[1] + z) / 2] : [x, z]; last = [x, z]; } return q.pondEdge(th, 1); };
  window.__views = {
    trail: () => { const P = q.POND, th = -.35, [wx, wz] = window.__edge(th), ox = wx - P.x, oz = wz - P.z, ol = Math.hypot(ox, oz), ux = ox / ol, uz = oz / ol;
      const ex = wx + ux * 1.5 + uz * .5, ez = wz + uz * 1.5 - ux * .5; return {e: [ex, q.hTop(ex, ez) + 1.6, ez], t: [wx - ux * .15, P.wy, wz - uz * .15], w: [wx, wz], u: [ux, uz], fov: 50}; },
    light: () => { const P = q.POND, [kx, kz] = window.__keyDir(), th = Math.atan2(-kz * P.rx, -kx * P.rz), [wx, wz] = window.__edge(th), ox = wx - P.x, oz = wz - P.z, ol = Math.hypot(ox, oz), ux = ox / ol, uz = oz / ol;
      const ex = wx + ux * 2.4, ez = wz + uz * 2.4; return {e: [ex, q.hTop(ex, ez) + 1.6, ez], t: [wx - ux * 1.6, P.wy, wz - uz * 1.6], w: [wx, wz], u: [ux, uz], fov: 55}; }};
  window.__look = k => { const v = typeof k === "string" ? window.__views[k]() : k, C = window.__C(); C.Ce.enabled = false; q.lookAt(...v.e, ...v.t); C.De.fov = v.fov; C.De.near = .02; C.De.updateProjectionMatrix(); C.De.updateMatrixWorld(true);
    q.step(1, 1 / 30); window.__cur = v; return {cam: v.e.map(x => +x.toFixed(2)), eyeAboveSand: +(v.e[1] - q.hTop(v.e[0], v.e[2])).toFixed(2), waterline: v.w.map(x => +x.toFixed(2))}; };
  window.__px = (x, y, z) => { const C = window.__C(), v = new V(x, y, z); q.W.localToWorld(v); v.project(C.De); return v.z > 1 ? null : [(v.x * .5 + .5) * innerWidth, (.5 - v.y * .5) * innerHeight]; };
  window.__samples = () => { const v = window.__cur, P = q.POND, [ux, uz] = v.u, sx = -uz, sz = ux, bank = (lo, hi) => { const o = [];
      for (let a = -.6; a <= .6; a += .1) for (let d = 0; d < 2.4; d += .004) { const x = v.w[0] + ux * d + sx * a, z = v.w[1] + uz * d + sz * a, hh = q.hTop(x, z) - P.wy;
        if (hh >= lo && hh <= hi) { const p = window.__px(x, q.hTop(x, z), z); if (p && p[0] > 3 && p[1] > 3 && p[0] < innerWidth - 3 && p[1] < innerHeight - 3) o.push(p); } } return o; };
    const water = []; for (let a = -2; a <= 2; a += .08) for (let d = .3; d < 4; d += .08) { const x = v.w[0] - ux * d + sx * a, z = v.w[1] - uz * d + sz * a;
      if (q.hTop(x, z) < P.wy - .03) { const p = window.__px(x, P.wy, z); if (p && p[0] > 3 && p[1] > 3 && p[0] < innerWidth - 3 && p[1] < innerHeight - 3) water.push(p); } }
    const A = .006 + .022 * q.pondU.uWind.value;
    return {trail: bank(A * .35, A * .6), band: bank(.045, .06), dry: bank(.125, .14), water, A}; };
});
const measure = async (file, smp) => { const buf = await pixels(file); const o = {}; for (const k of ["trail", "band", "dry"]) o[k] = patch(buf, smp[k]);
  const L = smp.water.map(p => patch(buf, [p])).filter(Boolean), ls = L.map(x => x.lum).sort((a, b) => a - b), med = ls[ls.length >> 1] || 0;
  o.water = {lum: +(ls.reduce((a, x) => a + x, 0) / Math.max(1, ls.length)).toFixed(1), warm: +(L.reduce((a, x) => a + x.warm, 0) / Math.max(1, L.length)).toFixed(3), n: ls.length,
    glint: +(ls.filter(x => x > Math.max(150, med * 1.6)).length / Math.max(1, ls.length)).toFixed(4)};
  return o; };

try {
  if (want("weather")) {
    report.weather = {};
    const Wx = [
      ["rain", "下雨", () => { const q = window.__desQA(); window.__set({weather: "mrain", ct: "overcast", wind: .45}); q.tod("day"); q.sim(60, .25); window.__restAll(); q.step(10, 1 / 30); }],
      ["dusk", "黄昏（朝着低太阳）", () => { const q = window.__desQA(); window.__set({weather: "sun", ct: "clear", wind: .45}); q.tod("sunset"); q.sim(60, .25); window.__restAll(); q.step(10, 1 / 30); }],
      ["night", "夜里（朝着月亮）", () => { const q = window.__desQA(); window.__set({weather: "sun", ct: "clear", wind: .45}); q.tod("night"); q.sim(60, .25); window.__restAll(); q.step(10, 1 / 30); }],
      ["frozen", "结冰（下雪的夜后清晨）", () => { const q = window.__desQA();
        /* the crabs held in their burrows throughout, on both builds: the branch's crabs react to the lap and draw on the shared random
           stream differently, which would otherwise send the rest of the session (snow, animals) down a different path */
        if (window.__HOLD) for (const c of q.CR.list) Object.assign(c, {x: c.bx, z: c.bz, mode: "in", t: 1e9, sk: 1});
        window.__set({weather: "snow", snowLv: 2, ct: "overcast", wind: .4}); q.tod("night"); q.sim(400, .5);
        q.tod("sunrise"); q.sim(40, .5); window.__set({weather: "sun", ct: "clear", wind: .35}); q.sim(4, .25); window.__restAll(); q.step(10, 1 / 30); }]];
    await E(h => { window.__HOLD = h; }, !!process.env.HOLD);
    for (const [n, zh, f] of Wx.filter(([n]) => !process.env.ONLY || process.env.ONLY.split(",").includes(n))) {
      await E(`(${f})()`);
      const r = report.weather[n] = await E(() => { const q = window.__desQA(), r = window.__look("light"); return {...r, rain: +q.WX.rain.toFixed(3), wet: +q.WX.wet.toFixed(3), ice: +q.WX.ice.toFixed(3), snow: +q.WX.sc.toFixed(3), night: +q.st.night.toFixed(2), uT: +q.pondU.uT.value.toFixed(2)}; });
      { const smp = await E(() => window.__samples()); r.samples = {band: smp.band.length, dry: smp.dry.length, water: smp.water.length};
        await cap(`${zh}，眼高 ${r.eyeAboveSand} 米`); await shot(path.join(OUT, `${TAG}weather_${n}.png`)); await cap("");
        await shot(path.join(OUT, `${TAG}weather_${n}_raw.png`)); r.at = await measure(path.join(OUT, `${TAG}weather_${n}_raw.png`), smp); }
      if (!process.env.NOCLIP) { await cap(`${zh}，眼高 ${r.eyeAboveSand} 米`); await clip(`weather_${n}`, +(process.env.WF || 36), 2, 12); await cap(""); }
      console.log("weather", n, JSON.stringify(r));
    }
  }

  if (want("wind")) {
    report.wind = {};
    for (const wv of (process.env.WINDS || ".45,1").split(",").map(Number)) {
      const k = "w" + String(wv).replace(".", "");
      await E(w => { const q = window.__desQA(); window.__set({weather: "sun", ct: "clear", wind: w}); q.tod("day"); q.sim(20, .25); window.__restAll(); q.step(10, 1 / 30); }, wv);
      const r = report.wind[k] = await E(() => { const q = window.__desQA(); return {...window.__look("trail"), wind: +q.pondU.uWind.value.toFixed(2), dust: +q.WX.dust.toFixed(2)}; });
      const smp = await E(() => window.__samples()); r.samples = {trail: smp.trail.length, band: smp.band.length, dry: smp.dry.length, lapAmp: +smp.A.toFixed(4)};
      await cap(`风 ${wv}：湿痕和湿沙带，眼高 1.6 米`);
      const dir = await clip(`wind_${k}`, +(process.env.TF || 60), 4, 15); await cap("");
      const ser = []; for (let i = 0; i < +(process.env.TF || 60); i++) { const buf = await pixels(path.join(dir, `f${String(i).padStart(3, "0")}.png`)); ser.push({trail: patch(buf, smp.trail)?.lum, band: patch(buf, smp.band)?.lum, dry: patch(buf, smp.dry)?.lum}); }
      const mean = a => +(a.reduce((s, x) => s + x, 0) / a.length).toFixed(1), dry = mean(ser.map(s => s.dry));
      /* "dark": the trail patch more than 20% under the dry sand */
      r.series = ser; r.mean = {trail: mean(ser.map(s => s.trail)), band: mean(ser.map(s => s.band)), dry}; r.trailDarkShare = +(ser.filter(s => s.trail < dry * .8).length / ser.length).toFixed(3);
      fs.copyFileSync(path.join(dir, "f030.png"), path.join(OUT, `${TAG}wind_${k}.png`));
      console.log("wind", k, JSON.stringify({...r, series: undefined}));
    }
  }

  if (want("shore")) {
    report.shore = {}; const part = k => !process.env.SHORE || process.env.SHORE.split(",").includes(k);
    if (part("crabs")) {
    /* the whole crab population over SHM minutes, in the everyday breeze: time out on the bank, time with the lap washing over it (by the same
       edge the shaders draw, lapAt where the build has it), dodges and trail follows */
    report.shore.crabs = await E(min => { const q = window.__desQA(), C = window.__C(); window.__set({weather: "sun", ct: "clear", wind: .45}); q.tod("day"); q.sim(10, .25);
      C.Ce.enabled = false; q.lookAt(30, 25, 30, 0, 0, 0); q.step(1, 1 / 30);
      const L = q.CR.list, P = q.POND, has = !!q.lapAt; let out = 0, under = 0, dodge = 0, trail = 0, lastGo = L.map(c => c.go);
      for (let f = 0; f < min * 60 * 30; f++) { q.step(1, 1 / 30); if (q.st.phase !== "day") q.tod("day");
        L.forEach((c, i) => { if (c.go !== lastGo[i]) { if (c.go === "dodge") dodge++; if (c.go === "trail") trail++; lastGo[i] = c.go; }
          if (!has || !(c.mode === "out" || c.mode === "dig" || c.mode === "face" || (c.mode === "walk" && c.go !== "water"))) return; out++;
          if (c.y - P.wy < q.lapAt(c.x, c.z, q.pondU.uT.value)) under++; }); }
      return has ? {minutes: min, crabs: L.length, crabSecondsOnBank: +(out / 30).toFixed(1), crabSecondsUnderLap: +(under / 30).toFixed(1), underShare: +(under / Math.max(1, out)).toFixed(4), dodges: dodge, trailFollows: trail}
        : {minutes: min, crabs: L.length, note: "main has no shared lap edge in JS (its phase is GPU noise) and no crab reaction to it"}; }, +(process.env.SHM || 6));
    console.log("shore crabs", JSON.stringify(report.shore.crabs)); }
    if (part("crab")) {
    /* one crab set down on the bank inside the reach of the lap (2 mm over the still level), a lens 1.5 m off at 0.45 m: 12 s */
    report.shore.crab = await E(() => { const q = window.__desQA(), C = window.__C(), P = q.POND, c = q.CR.list[0]; window.__set({weather: "sun", ct: "clear", wind: .45}); q.tod("day"); q.sim(4, .25);
      for (const o of q.CR.list) if (o !== c) { o.x = o.bx; o.z = o.bz; o.mode = "in"; o.t = 1e9; o.sk = 1; }
      const th = Math.atan2(c.bz - P.z, c.bx - P.x); let bx = c.bx, bz = c.bz;
      for (let s = .7; s < 1.3; s += .001) { const [x, z] = q.pondEdge(th, s); if (q.hTop(x, z) - P.wy > .002) { bx = x; bz = z; break; } }
      Object.assign(c, {x: bx, z: bz, mode: "out", t: 1e9, sk: 0, v: 0, go: null, yaw: th + Math.PI / 2}); q.step(2, 1 / 30);
      const ux = Math.cos(th), uz = Math.sin(th), ex = bx + ux * .9 - uz * 1.2, ez = bz + uz * .9 + ux * 1.2;
      window.__crabCam = {e: [ex, q.hTop(ex, ez) + .45, ez], t: [bx, P.wy + .01, bz], w: [bx, bz], u: [ux, uz], fov: 40};
      window.__look(window.__crabCam); window.__crabTrack = []; return {crab: 0, at: [+bx.toFixed(3), +bz.toFixed(3)], overWater: +(q.hTop(bx, bz) - P.wy).toFixed(4)}; });
    await cap("螃蟹在水边：浪涌上来时让开，退下去时跟着走到刚露出的湿沙上");
    { const dir = path.join(OUT, `${TAG}shore_crab_frames`); fs.rmSync(dir, {recursive: true, force: true}); fs.mkdirSync(dir, {recursive: true});
      for (let i = 0; i < 90; i++) { const s = await E(() => { const q = window.__desQA(), c = q.CR.list[0], P = q.POND; q.step(4, 1 / 30);
          const l = q.lapAt ? q.lapAt(c.x, c.z, q.pondU.uT.value) : null, r = {t: +q.pondU.uT.value.toFixed(2), mode: c.mode, go: c.go, hh: +(c.y - P.wy).toFixed(4), lap: l == null ? null : +l.toFixed(4)}; window.__crabTrack.push(r); return r; });
        await S.frames(2); await S.page.screenshot({path: path.join(dir, `f${String(i).padStart(3, "0")}.png`)}); }
      await ffmpeg(["-framerate", "15", "-i", path.join(dir, "f%03d.png"), "-vf", "format=yuv420p", "-c:v", "libx264", "-crf", "24", "-preset", "slow", path.join(OUT, `${TAG}shore_crab.mp4`)]);
      report.shore.crab.track = await E(() => window.__crabTrack); }
    { const T = report.shore.crab.track; let pick = T.findIndex(s => s.go === "dodge"); if (pick < 0) pick = 45;
      fs.copyFileSync(path.join(OUT, `${TAG}shore_crab_frames`, `f${String(Math.min(89, pick + 4)).padStart(3, "0")}.png`), path.join(OUT, `${TAG}shore_crab.png`));
      report.shore.crab.stillFrame = Math.min(89, pick + 4); report.shore.crab.dodges = T.filter((s, i) => s.go === "dodge" && (i === 0 || T[i - 1].go !== "dodge")).length;
      report.shore.crab.trailFollows = T.filter((s, i) => s.go === "trail" && (i === 0 || T[i - 1].go !== "trail")).length;
      report.shore.crab.framesUnderLap = T.filter(s => s.lap != null && s.hh < s.lap).length; }
    await cap("");
    console.log("shore crab", JSON.stringify({...report.shore.crab, track: undefined})); }
    if (part("fish")) {
    /* fish: the shallow margin straight from above-ish at midday, the pupfish shoal and its shadows in the caustic net */
    report.shore.fish = await E(() => { const q = window.__desQA(), C = window.__C(), P = q.POND; window.__set({weather: "sun", ct: "clear", wind: .45}); q.tod("day"); q.sim(4, .25);
      /* the densest knot of the shoal, seen steeply from the sun's side (the sun behind the lens: no glare, little sky in the water) */
      const F = q.PF.list; let best = F[0], bn = -1; for (const f of F) { const n = F.filter(o => Math.hypot(o.x - f.x, o.z - f.z) < .6).length; if (n > bn) { bn = n; best = f; } }
      let cx = 0, cz = 0, k = 0; for (const f of F) if (Math.hypot(f.x - best.x, f.z - best.z) < .6) { cx += f.x; cz += f.z; k++; } cx /= k; cz /= k;
      const [ux, uz] = window.__keyDir(), ex = cx + ux * .7, ez = cz + uz * .7;
      window.__fishCam = {e: [ex, P.wy + 1.3, ez], t: [cx, P.wy - .15, cz], w: [cx, cz], u: [ux, uz], fov: 40}; window.__look(window.__fishCam);
      const U = q.pondU, n = U.uFN ? U.uFN.value : 0, sh = []; for (let i = 0; i < n; i++) { const a = U.uFS.value[i], b = U.uFZ.value[i]; sh.push({x: a.x, z: a.y, len: b.y, w: b.x, k: b.z, dep: +(P.wy - q.hTop(a.x, a.y)).toFixed(3)}); }
      return {knot: [+cx.toFixed(2), +cz.toFixed(2)], inKnot: k, pupfish: F.length, vis: +q.PF.vis.toFixed(2), shadows: n, list: sh}; });
    await cap("鳉鱼的影子落在浅水底，影子里的焦散光纹随之熄灭"); await shot(path.join(OUT, `${TAG}shore_fish.png`)); await cap("");
    await shot(path.join(OUT, `${TAG}shore_fish_raw.png`));
    /* the same frame with the fish's shadows switched off (uFN 0; the scene clock is frozen, so nothing else moves): in 9x9 px at each
       shadow's centre, how much darker the bed is with the shadow, and how much of the caustic net's contrast (std of luma) is left */
    if (report.shore.fish.shadows) {
      await E(() => { window.__desQA().pondU.uFN.value = 0; }); await S.frames(2); await shot(path.join(OUT, `${TAG}shore_fish_off.png`));
      const on = await pixels(path.join(OUT, `${TAG}shore_fish_raw.png`)), off = await pixels(path.join(OUT, `${TAG}shore_fish_off.png`)), F = report.shore.fish;
      const st = (buf, [x, y]) => { const v = []; for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const X = Math.round(x) + dx, Y = Math.round(y) + dy; if (X < 0 || Y < 0 || X >= W || Y >= H) return null; const i = (Y * W + X) * 3; v.push(.2126 * buf[i] + .7152 * buf[i + 1] + .0722 * buf[i + 2]); }
        const m = v.reduce((a, x) => a + x, 0) / v.length; return {m, sd: Math.sqrt(v.reduce((a, x) => a + (x - m) ** 2, 0) / v.length)}; };
      /* the pixel that shows bed point x,z: the pond draws, at surface point s, the bed at s - V.xz/max(V.y,.25)*depth*.75 (V toward the eye) */
      const bedPx = ([x, z]) => E(([x, z]) => { const q = window.__desQA(), P = q.POND, C = window.__C(), c = C.De.position.clone(); q.W.worldToLocal(c); let sx = x, sz = z;
        for (let i = 0; i < 8; i++) { const d = Math.max(P.wy - q.hTop(sx, sz), 0), vx = c.x - sx, vy = c.y - P.wy, vz = c.z - sz, l = Math.hypot(vx, vy, vz), Vy = Math.max(vy / l, .25);
          sx = x + vx / l / Vy * d * .75; sz = z + vz / l / Vy * d * .75; } return window.__px(sx, P.wy, sz); }, [x, z]);
      const rows = []; for (const sh of F.list) { const p = await bedPx([sh.x, sh.z]); if (!p) continue;
        const A = st(on, p), B = st(off, p); if (A && B) rows.push({lumOn: +A.m.toFixed(1), lumOff: +B.m.toFixed(1), causticSdOn: +A.sd.toFixed(1), causticSdOff: +B.sd.toFixed(1)}); }
      const mean = k => +(rows.reduce((a, r) => a + r[k], 0) / Math.max(1, rows.length)).toFixed(1);
      F.onOff = {inView: rows.length, lumOn: mean("lumOn"), lumOff: mean("lumOff"), causticSdOn: mean("causticSdOn"), causticSdOff: mean("causticSdOff"), rows};
      F.list = F.list.map(s => ({x: +s.x.toFixed(3), z: +s.z.toFixed(3), lenM: +s.len.toFixed(3), strength: +s.k.toFixed(2), bedDepthM: s.dep}));
      await E(() => window.__desQA().step(1, 1 / 30)); }
    console.log("shore fish", JSON.stringify(report.shore.fish));
    await E(() => window.__look(window.__fishCam)); await cap("鳉鱼的影子和焦散光纹"); if (!process.env.NOCLIP) await clip("shore_fish", 45, 2, 15); await cap(""); }
  }

  if (want("drink")) {
    report.drink = {rule: "valid when the lowest mouth over the 4 s window from the moment the drink clip runs at full weight is over the water (pN<1) and within 5 cm of its height, and the camera sits within 5 cm of where it was put", runs: []};
    const run = async (label, pre) => { if (pre) await E(pre); const old = await oldProbe(S.page); const r = await drinkProbe(S.page); r.label = label; r.oldProbe = old; report.drink.runs.push(r);
      console.log("drink", label, JSON.stringify({ok: r.ok, why: r.why, dW: r.dW, camOffM: r.camOffM, before: r.before, old})); if (!r.ok) fails.push("drink " + label); };
    for (let i = 0; i < +(process.env.DN || 3); i++) await run(`fresh#${i + 1}`);
    await run("again-at-once (stale weights from the run before)");
    await run("after a 6 min day (everyone's own jobs)", () => { const q = window.__desQA(); q.tod("day"); q.PA.noView = 1; for (let i = 0; i < 360 * 30; i++) { q.step(1, 1 / 30); if (q.st.phase !== "day") q.tod("day"); } });
    await run("after 30 min of mixed weather (rain, dust wind 1, night, snow, hail)", () => { const q = window.__desQA();
      for (const [w, ct, wind, tod, s] of [["mrain", "overcast", .5, "day", 240], ["sun", "clear", 1, "day", 300], ["sun", "clear", .35, "night", 300], ["snow", "overcast", .4, "night", 300], ["hail", "overcast", .6, "day", 120], ["sun", "clear", .35, "sunrise", 300], ["sun", "clear", .35, "day", 240]]) {
        window.__set({weather: w, ct, wind}); q.tod(tod); q.sim(s, .2); } });
    await run("orbit controls on, camera elsewhere, wind 1, a.tries 3, drink stopped mid-dip", () => { const q = window.__desQA(), C = window.__C(), a = q.ANIM.camels[0];
      window.__set({wind: 1}); C.Ce.enabled = true; q.lookAt(-4.16, 11.13, 19.58, 0, 0, 0); a.tries = 3; q.fn.play(a.r, "drink", .3, 1); q.step(20, 1 / 30); a.r.acts.drink.stop(); });
    await run("orbit controls on at the end (after a ver-style panel view)", () => { const q = window.__desQA(), C = window.__C(); C.Ce.enabled = true; q.lookAt(-4.16, 11.13, 19.58, 0, 0, 0); q.step(1, 1 / 30); });
    /* the old probe cut short half a second into the dip: what a session that ends its loop there leaves for the close-up */
    report.drink.oldProbeCutAtFrame = [];
    for (const b of [158, 165, 172, 173]) report.drink.oldProbeCutAtFrame.push(await oldProbe(S.page, b));
    console.log("drink old cut", JSON.stringify(report.drink.oldProbeCutAtFrame));
    const ok = report.drink.runs.filter(r => r.ok).length; report.drink.summary = {runs: report.drink.runs.length, ok, dW: report.drink.runs.map(r => r.dW)};
    const last = report.drink.runs[report.drink.runs.length - 1];
    if (last.ok) { await cap(`骆驼喝水：嘴触及水面（与水面高差 ${last.dW} m）`); await shot(path.join(OUT, `${TAG}drink_closeup.png`)); await cap(""); }
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
} catch (e) { console.log("ERR", e.stack || e); fails.push(String(e)); }
report.fails = fails;
fs.writeFileSync(path.join(OUT, `${TAG}d177-report-${WHICH.replace(/,/g, "+")}.json`), JSON.stringify(report, null, 1));
clearTimeout(killer); await S.close();
process.exit(fails.length ? 1 : 0);
