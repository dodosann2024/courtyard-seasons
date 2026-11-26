// Desert d178 proofs, on any checkout (DIR, default this one; assets are committed, nothing is built). Not part of CI.
//   crab   crabs at the lapping edge. "Fresh" sand: on the bank above where the lap is now, but below the highest it reached in the last
//          FRESH s (default 3): the sand the water has just drawn back from. census: every crab over SHM sim minutes (default 6), far camera;
//          trials: each crab in turn set down 2 mm over the still level at its own burrow's shore and watched for 12 s from the low shore
//          camera (TRIALS rounds); clip: crab 0 the same way, 12 s at 15 fps, with stills
//   fish   the shallow margin seen steeply from the sun's side, close in: per fish shadow the bed's luminance under it, beside it (either
//          side, clear of the shadow) and with the shadows switched off in the same frame. FISHOUT writes the fish's places, FISHIN puts
//          them back, so both builds show the same shoal in the same light
//   wind   the east beach from 1.6 m (d176/d177's trail view) at WINDS (default 0,.5,.65,.8,1): a still and a real-time 8 s clip each; the
//          wet band's top over the still water (from the brightness profile up the bank) and the retreat trail's drying curve (brightness
//          of bank points by the time since the water left them)
//   pair   (no browser) OUT/main_<n>.png | OUT/new_<n>.png -> <n>_before_after.jpg; .mp4 likewise
// Usage: node tools/e2e/d178-proof.mjs <mode[,mode]>   (OUT=/tmp/d178/out DIR=<checkout> TAG=<prefix>)
import fs from "node:fs";
import path from "node:path";
import {execFile} from "node:child_process";
import {fileURLToPath} from "node:url";
import {openScene, ffmpeg} from "./d172-lib.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(process.env.DIR || path.join(HERE, "../.."));
const OUT = process.env.OUT || "/tmp/d178/out", TAG = process.env.TAG || "";
const WHICH = process.argv[2] || "crab", want = k => WHICH.split(",").includes(k);
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
const lum = (buf, x, y, r = 2) => { let s = 0, n = 0; for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const X = Math.round(x) + dx, Y = Math.round(y) + dy;
  if (X < 0 || Y < 0 || X >= W || Y >= H) continue; const i = (Y * W + X) * 3; s += .2126 * buf[i] + .7152 * buf[i + 1] + .0722 * buf[i + 2]; n++; } return n ? s / n : null; };
const stat = (buf, x, y, r = 4) => { const v = []; for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const X = Math.round(x) + dx, Y = Math.round(y) + dy;
  if (X < 0 || Y < 0 || X >= W || Y >= H) return null; const i = (Y * W + X) * 3; v.push(.2126 * buf[i] + .7152 * buf[i + 1] + .0722 * buf[i + 2]); }
  const m = v.reduce((a, x) => a + x, 0) / v.length; return {m, sd: Math.sqrt(v.reduce((a, x) => a + (x - m) ** 2, 0) / v.length)}; };
const mean = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : null, r1 = x => x == null ? null : +x.toFixed(1), r3 = x => x == null ? null : +x.toFixed(3);

const S = await openScene(ROOT);
const {E, shot, cap} = S;
const fails = [], report = {bundle: S.bundle};
const killer = setTimeout(() => { console.log("TIMEOUT"); process.exit(3); }, +(process.env.LIMIT || 14400) * 1000);
const frameDir = name => { const d = path.join(OUT, `${TAG}${name}_frames`); fs.rmSync(d, {recursive: true, force: true}); fs.mkdirSync(d, {recursive: true}); return d; };
const fpath = (d, i) => path.join(d, `f${String(i).padStart(3, "0")}.png`);
const encode = (d, name, fps) => ffmpeg(["-framerate", String(fps), "-i", path.join(d, "f%03d.png"), "-vf", "format=yuv420p", "-c:v", "libx264", "-crf", "24", "-preset", "slow", path.join(OUT, `${TAG}${name}.mp4`)]);

await E(fresh => {
  const q = window.__desQA(), V = q.W.position.constructor;
  window.__restAll = () => q.ANIM.camels.forEach((o, i) => { const R = q.REST[i]; Object.assign(o, {x: R.x, z: R.z, yaw: R.yaw, mode: "rest", job: "kneel", k: 1, timer: 1e9, spd: 0, yr: 0, path: null, gy: null, goal: R});
    for (const k in o.r.acts) o.r.acts[k].stop(); o.r.fd = null; o.r.cur = null; q.fn.play(o.r, "kneel_rest", .01, 1); });
  window.__keyDir = () => { let sc = q.W; while (sc.parent) sc = sc.parent; let L = null; sc.traverse(o => { if (o.isDirectionalLight && o.castShadow && !L) L = o; });
    const d = L.position.clone().normalize().applyAxisAngle(new V(0, 1, 0), -q.YAW), h = Math.hypot(d.x, d.z) || 1; return [d.x / h, d.z / h]; };
  window.__edge = th => { const P = q.POND; let last = null; for (let s = .7; s < 1.3; s += .002) { const [x, z] = q.pondEdge(th, s); if (q.hTop(x, z) > P.wy) return last ? [(last[0] + x) / 2, (last[1] + z) / 2] : [x, z]; last = [x, z]; } return q.pondEdge(th, 1); };
  window.__trailView = () => { const P = q.POND, th = -.35, [wx, wz] = window.__edge(th), ox = wx - P.x, oz = wz - P.z, ol = Math.hypot(ox, oz), ux = ox / ol, uz = oz / ol;
    const ex = wx + ux * 1.5 + uz * .5, ez = wz + uz * 1.5 - ux * .5; return {e: [ex, q.hTop(ex, ez) + 1.6, ez], t: [wx - ux * .15, P.wy, wz - uz * .15], w: [wx, wz], u: [ux, uz], fov: 50}; };
  window.__look = v => { const C = window.__C(); C.Ce.enabled = false; q.lookAt(...v.e, ...v.t); C.De.fov = v.fov; C.De.near = .02; C.De.updateProjectionMatrix(); C.De.updateMatrixWorld(true);
    window.__cur = v; return {cam: v.e.map(x => +x.toFixed(2)), eyeAboveSand: +(v.e[1] - q.hTop(v.e[0], v.e[2])).toFixed(2), eyeAboveWater: +(v.e[1] - q.POND.wy).toFixed(2)}; };
  window.__px = (x, y, z) => { const C = window.__C(), v = new V(x, y, z); q.W.localToWorld(v); v.project(C.De); return v.z > 1 ? null : [(v.x * .5 + .5) * innerWidth, (.5 - v.y * .5) * innerHeight]; };
  const A = () => (.006 + .022 * q.pondU.uWind.value) * (1 - q.pondU.uIce.value);
  /* where a crab stands against the lap: under it, on the bank, on fresh sand (left by the water in the last `fresh` s), near the shore (under the reach + 3 cm) */
  window.__crabAt = c => { const P = q.POND, t = q.pondU.uT.value, hh = c.y - P.wy, now = q.lapAt(c.x, c.z, t), act = !(c.mode === "in" || c.mode === "down" || c.mode === "emerge" || c.mode === "sub");
    let mx = -1; for (let ta = 0; ta <= fresh + 1e-6; ta += .1) mx = Math.max(mx, q.lapAt(c.x, c.z, t - ta));
    return {act, under: act && hh < now, bank: act && hh >= now, fresh: act && hh >= now && hh < mx, near: act && hh >= now && hh < A() + .03, hh, now}; };
  window.__A = A;
}, +(process.env.FRESH || 3));

try {
  if (want("crab")) {
    report.crab = {freshWindowS: +(process.env.FRESH || 3)};
    const part = k => !process.env.CRAB || process.env.CRAB.split(",").includes(k);
    if (part("census")) {
      report.crab.census = await E(min => { const q = window.__desQA(), C = window.__C(); window.__set({weather: "sun", ct: "clear", wind: .45}); q.tod("day"); q.sim(10, .25);
        C.Ce.enabled = false; q.lookAt(30, 25, 30, 0, 0, 0); q.step(1, 1 / 30);
        const L = q.CR.list; let bank = 0, fresh = 0, near = 0, under = 0, dodge = 0, trail = 0; const lastGo = L.map(c => c.go), run = L.map(() => 0), stays = [];
        for (let f = 0; f < min * 60 * 30; f++) { q.step(1, 1 / 30); if (q.st.phase !== "day") q.tod("day");
          L.forEach((c, i) => { if (c.go !== lastGo[i]) { if (c.go === "dodge") dodge++; if (c.go === "trail") trail++; lastGo[i] = c.go; }
            const s = window.__crabAt(c); if (s.under && c.go !== "water" && c.mode !== "run") under++; if (s.bank) bank++; if (s.fresh) fresh++;
            if (s.near) { near++; run[i]++; } else if (run[i]) { stays.push(run[i] / 30); run[i] = 0; } }); }
        run.forEach(r => r && stays.push(r / 30));
        const ls = stays.filter(s => s > .5);
        return {minutes: min, crabs: L.length, crabSecondsOnBank: +(bank / 30).toFixed(1), freshSeconds: +(fresh / 30).toFixed(1), freshShareOfBank: +(fresh / Math.max(1, bank)).toFixed(4),
          nearShoreSeconds: +(near / 30).toFixed(1), nearShareOfBank: +(near / Math.max(1, bank)).toFixed(4), nearShoreStays: ls.length,
          meanNearShoreStayS: +(ls.reduce((a, x) => a + x, 0) / Math.max(1, ls.length)).toFixed(2), secondsUnderLap: +(under / 30).toFixed(1), dodges: dodge, trailFollows: trail}; }, +(process.env.SHM || 6));
      console.log("crab census", JSON.stringify(report.crab.census)); }
    /* each crab set down on the bank inside the lap's reach at its own burrow's shore, the others home, the low camera out over the water */
    const place = (i, rec) => E(([i, rec]) => { const q = window.__desQA(), P = q.POND, L = q.CR.list, c = L[i % L.length]; window.__restAll(); q.PA.noView = 1;
      for (const o of L) if (o !== c) Object.assign(o, {x: o.bx, z: o.bz, mode: "in", t: 1e9, sk: 1, go: null});
      const th = Math.atan2(c.bz - P.z, c.bx - P.x); let bx = c.bx, bz = c.bz;
      for (let s = .7; s < 1.3; s += .001) { const [x, z] = q.pondEdge(th, s); if (q.hTop(x, z) - P.wy > .002) { bx = x; bz = z; break; } }
      Object.assign(c, {x: bx, z: bz, mode: "out", t: 1e9, sk: 0, v: 0, go: null, yaw: th + Math.PI / 2}); q.step(2, 1 / 30);
      const scared = c.mode === "run";
      const ux = Math.cos(th), uz = Math.sin(th), ex = bx - ux * 1.45 + uz * .4, ez = bz - uz * 1.45 - ux * .4;
      const v = {e: [ex, P.wy + .45, ez], t: [bx + ux * .04, P.wy + .01, bz + uz * .04], fov: 28}; window.__look(v); q.step(1, 1 / 30);
      window.__ci = i % L.length; window.__track = []; return {crab: i % L.length, scared, at: [+bx.toFixed(3), +bz.toFixed(3)], cam: v.e.map(x => +x.toFixed(2))}; }, [i, rec]);
    const tick = k => E(k => { const q = window.__desQA(), c = q.CR.list[window.__ci]; q.step(k, 1 / 30); const s = window.__crabAt(c);
      const r = {t: +q.pondU.uT.value.toFixed(2), mode: c.mode, go: c.go, hh: +s.hh.toFixed(4), lap: +s.now.toFixed(4), fresh: s.fresh, near: s.near, under: s.under}; window.__track.push(r); return r; }, k);
    const sumTrack = T => ({frames: T.length, freshShare: +(T.filter(s => s.fresh).length / T.length).toFixed(3), nearShare: +(T.filter(s => s.near).length / T.length).toFixed(3),
      underShare: +(T.filter(s => s.under).length / T.length).toFixed(3),
      dodges: T.filter((s, i) => s.go === "dodge" && (i === 0 || T[i - 1].go !== "dodge")).length, trailFollows: T.filter((s, i) => s.go === "trail" && (i === 0 || T[i - 1].go !== "trail")).length,
      leftShoreAtS: (() => { const j = T.findIndex(s => !s.near && !s.under); return j < 0 ? null : +(j * 12 / T.length).toFixed(1); })()});
    if (part("trials")) {
      await E(() => { const q = window.__desQA(); window.__set({weather: "sun", ct: "clear", wind: .45}); q.tod("day"); q.sim(4, .25); });
      const rounds = +(process.env.TRIALS || 3), rows = [];
      for (let k = 0; k < rounds; k++) for (let i = 0; i < 8; i++) { const p = await place(i); for (let f = 0; f < 360; f += 6) await tick(6);
        const T = await E(() => window.__track); rows.push({...p, ...sumTrack(T)}); await E(() => window.__desQA().sim(3, .25)); }
      const summ = R => { const m = k => +(mean(R.map(r => r[k]))).toFixed(3); return {n: R.length, freshShare: m("freshShare"), nearShare: m("nearShare"), underShare: m("underShare"), dodges: m("dodges"),
        trailFollows: m("trailFollows"), withAFollow: R.filter(r => r.trailFollows > 0).length, stillNearAt12s: R.filter(r => r.leftShoreAtS == null).length}; };
      /* calm: the crab was not put to flight the moment it was set down (a camel resting or drinking within its fear radius, the eagle, the snake) */
      report.crab.trials = {secondsEach: 12, calm: summ(rows.filter(r => !r.scared)), all: summ(rows), rows};
      console.log("crab trials", JSON.stringify({...report.crab.trials, rows: undefined})); }
    if (part("clip")) {
      await E(() => { const q = window.__desQA(); window.__set({weather: "sun", ct: "clear", wind: .45}); q.tod("day"); q.sim(4, .25); });
      report.crab.clip = await place(+(process.env.CRABI || 0));
      await cap("螃蟹在水边：水涌上来时让开，退下去时跟着走到刚露出的湿沙上（12 秒，实时）");
      const d = frameDir("crab_shore");
      for (let i = 0; i < 180; i++) { await tick(2); await S.frames(2); await S.page.screenshot({path: fpath(d, i)}); }
      await cap(""); await encode(d, "crab_shore", 15);
      const T = report.crab.clip.track = await E(() => window.__track); Object.assign(report.crab.clip, sumTrack(T));
      const fi = T.findIndex((s, i) => s.go === "trail" && i > 10), di = T.findIndex(s => s.go === "dodge");
      for (const [n, i] of [["crab_shore_follow", fi < 0 ? 120 : Math.min(179, fi + 12)], ["crab_shore_dodge", di < 0 ? 60 : Math.min(179, di + 6)]]) { fs.copyFileSync(fpath(d, i), path.join(OUT, `${TAG}${n}.png`)); report.crab.clip[n] = i; }
      console.log("crab clip", JSON.stringify({...report.crab.clip, track: undefined})); }
  }

  if (want("fish")) {
    report.fish = await E(fin => { const q = window.__desQA(), P = q.POND; window.__set({weather: "sun", ct: "clear", wind: .45}); q.tod("day"); q.sim(4, .25);
      if (fin) { fin.pf.forEach((s, i) => { const f = q.PF.list[i]; if (f) Object.assign(f, s); }); fin.tt.forEach((s, i) => { const f = q.TT.list[i]; if (f) Object.assign(f, s); }); }
      q.step(1, 1e-5);
      const F = q.PF.list, Fs = F.filter(f => { const d = q.pfDep(f.x, f.z); return d > .05 && d < .22; }); let best = F[0], bn = -1; for (const f of (Fs.length ? Fs : F)) { const n = F.filter(o => Math.hypot(o.x - f.x, o.z - f.z) < .35).length; if (n > bn) { bn = n; best = f; } }
      let cx = 0, cz = 0, k = 0; for (const f of F) if (Math.hypot(f.x - best.x, f.z - best.z) < .35) { cx += f.x; cz += f.z; k++; } cx /= k; cz /= k;
      const [ux, uz] = window.__keyDir();
      window.__fishCam = {e: [cx + ux * .35, P.wy + .6, cz + uz * .35], t: [cx, P.wy - .08, cz], fov: 38}; window.__look(window.__fishCam); q.step(1, 1e-5);
      const U = q.pondU, n = U.uFN.value, sh = []; for (let i = 0; i < n; i++) { const a = U.uFS.value[i], b = U.uFZ.value[i]; sh.push({x: a.x, z: a.y, c: a.z, s: a.w, w: b.x, len: b.y, k: b.z, soft: b.w}); }
      const pick = o => ({x: o.x, y: o.y, z: o.z, yaw: o.yaw});
      return {fishState: {pf: q.PF.list.map(pick), tt: q.TT.list.map(pick)}, knot: [+cx.toFixed(2), +cz.toFixed(2)], inKnot: k, uT: +q.pondU.uT.value.toFixed(3), shadows: n, list: sh}; },
      process.env.FISHIN ? JSON.parse(fs.readFileSync(process.env.FISHIN, "utf8")) : null);
    if (process.env.FISHOUT) fs.writeFileSync(process.env.FISHOUT, JSON.stringify(report.fish.fishState));
    delete report.fish.fishState;
    await cap("浅水里鱼的影子落在焦散光纹上"); await shot(path.join(OUT, `${TAG}fish.png`)); await cap("");
    await shot(path.join(OUT, `${TAG}fish_raw.png`));
    /* measured with the fish's bodies hidden (the clock is frozen, so nothing else changes): from the sun's side a shadow lies partly under its fish */
    await E(() => { const q = window.__desQA(), Us = [q.PF.U, q.TT.U]; window.__hid = []; q.W.traverse(o => { if (!o.visible || !o.material) return;
      const ms = Array.isArray(o.material) ? o.material : [o.material]; if (ms.some(m => Us.includes(m.userData && m.userData.U))) { o.visible = false; window.__hid.push(o); } }); });
    await shot(path.join(OUT, `${TAG}fish_bed_on.png`));
    const sv = await E(() => window.__desQA().pondU.uFN.value); await E(() => { window.__desQA().pondU.uFN.value = 0; }); await S.frames(2);
    await shot(path.join(OUT, `${TAG}fish_bed_off.png`)); await E(n => { window.__desQA().pondU.uFN.value = n; }, sv);
    report.fish.hiddenForMeasure = await E(() => { const n = window.__hid.length; for (const o of window.__hid) o.visible = true; return n; });
    /* the pixel that shows bed point x,z: the pond draws, at surface point s, the bed at s - V.xz/max(V.y,.25)*depth*.75 (V toward the eye) */
    const bedPx = pts => E(pts => { const q = window.__desQA(), P = q.POND, C = window.__C(), c = C.De.position.clone(); q.W.worldToLocal(c);
      return pts.map(([x, z]) => { let sx = x, sz = z; for (let i = 0; i < 8; i++) { const d = Math.max(P.wy - q.hTop(sx, sz), 0), vx = c.x - sx, vy = c.y - P.wy, vz = c.z - sz, l = Math.hypot(vx, vy, vz), Vy = Math.max(vy / l, .25);
        sx = x + vx / l / Vy * d * .75; sz = z + vz / l / Vy * d * .75; } return window.__px(sx, P.wy, sz); }); }, pts);
    const on = await pixels(path.join(OUT, `${TAG}fish_bed_on.png`)), off = await pixels(path.join(OUT, `${TAG}fish_bed_off.png`)), F = report.fish;
    /* per shadow, in a 31x31 px window round where it should be: the shadow is the pixels the shadows-on frame darkens by over a quarter of the
       window's deepest darkening (and 2 levels); beside is the ring of pixels 2-6 px outside that mask that the shadows leave alone. Under it: mean
       luminance with the shadows on and off; the caustic net's contrast there is the std of luminance over the mask */
    const Y = (buf, X, Yy) => { const i = (Yy * W + X) * 3; return .2126 * buf[i] + .7152 * buf[i + 1] + .0722 * buf[i + 2]; };
    const rows = [], cs = await bedPx(F.list.map(s => [s.x, s.z]));
    F.list.forEach((s, k) => { const c = cs[k]; if (!c) return; const cx = Math.round(c[0]), cy = Math.round(c[1]), R = 15; if (cx < R + 8 || cy < R + 8 || cx >= W - R - 8 || cy >= H - R - 8) return;
      let mx = 0; for (let y = cy - R; y <= cy + R; y++) for (let x = cx - R; x <= cx + R; x++) mx = Math.max(mx, Y(off, x, y) - Y(on, x, y));
      if (mx < 3) return; const th = Math.max(2, mx * .25), mask = new Set(), key = (x, y) => y * W + x;
      for (let y = cy - R; y <= cy + R; y++) for (let x = cx - R; x <= cx + R; x++) if (Y(off, x, y) - Y(on, x, y) > th) mask.add(key(x, y));
      const near = []; for (let y = cy - R - 6; y <= cy + R + 6; y++) for (let x = cx - R - 6; x <= cx + R + 6; x++) { if (mask.has(key(x, y)) || Math.abs(Y(off, x, y) - Y(on, x, y)) > 1) continue;
        let d = 99; for (let dy = -6; dy <= 6 && d > 2; dy++) for (let dx = -6; dx <= 6; dx++) if (mask.has(key(x + dx, y + dy))) d = Math.min(d, Math.hypot(dx, dy));
        if (d >= 2 && d <= 6) near.push(Y(on, x, y)); }
      const mv = [...mask].map(i => [i % W, Math.floor(i / W)]), uOn = mv.map(([x, y]) => Y(on, x, y)), uOff = mv.map(([x, y]) => Y(off, x, y)), sd = v => { const m = mean(v); return Math.sqrt(mean(v.map(x => (x - m) ** 2))); };
      if (mv.length < 4 || near.length < 8) return;
      rows.push({px: mv.length, lumUnder: r1(mean(uOn)), lumBeside: r1(mean(near)), lumUnderShadowOff: r1(mean(uOff)), contrast: r3(1 - mean(uOn) / mean(near)), darkVsOff: r3(1 - mean(uOn) / mean(uOff)),
        deepest: r1(mx), causticSdUnder: r1(sd(uOn)), causticSdUnderShadowOff: r1(sd(uOff)), causticSdBeside: r1(sd(near)), shadowLenCm: r1(s.len * 100), shadowHalfWidthCm: r1(s.w * 100)}); });
    const m = k => r3(mean(rows.map(r => r[k]))), m1 = k => r1(mean(rows.map(r => r[k])));
    F.measured = {inView: rows.length, shadowPx: m1("px"), lumUnder: m1("lumUnder"), lumBeside: m1("lumBeside"), lumUnderShadowOff: m1("lumUnderShadowOff"), contrast: m("contrast"), darkVsOff: m("darkVsOff"),
      deepestDarkening: m1("deepest"), causticSdUnder: m1("causticSdUnder"), causticSdUnderShadowOff: m1("causticSdUnderShadowOff"), causticSdBeside: m1("causticSdBeside"),
      causticLeftUnder: r3(mean(rows.map(r => r.causticSdUnder / Math.max(.1, r.causticSdUnderShadowOff)))), shadowLenCm: m1("shadowLenCm"), shadowHalfWidthCm: m1("shadowHalfWidthCm"), rows};
    F.list = F.list.map(s => ({x: r3(s.x), z: r3(s.z), lenCm: r1(s.len * 100), halfWidthCm: r1(s.w * 100), strength: r3(s.k), soft: r3(s.soft)}));
    console.log("fish", JSON.stringify({...F.measured, rows: undefined}));
    if (!process.env.NOCLIP) { await cap("鱼影和焦散光纹（实时）"); const d = frameDir("fish"); for (let i = 0; i < 60; i++) { await E(() => window.__desQA().step(2, 1 / 30)); await S.frames(2); await S.page.screenshot({path: fpath(d, i)}); }
      await encode(d, "fish", 15); await cap(""); }
  }

  if (want("wind")) {
    report.wind = {};
    const NF = +(process.env.WF || 120);
    for (const wv of (process.env.WINDS || "0,.5,.65,.8,1").split(",").map(Number)) {
      const k = "w" + String(wv).replace(".", "");
      await E(w => { const q = window.__desQA(); window.__set({weather: "sun", ct: "clear", wind: w}); q.tod("day"); q.sim(20, .25); window.__restAll();
        for (const c of q.CR.list) Object.assign(c, {x: c.bx, z: c.bz, mode: "in", t: 1e9, sk: 1}); q.step(10, 1 / 30); }, wv);
      const r = report.wind[k] = await E(() => { const q = window.__desQA(), v = window.__trailView(); return {...window.__look(v), wind: +q.pondU.uWind.value.toFixed(2), dust: +q.WX.dust.toFixed(2), lapAmpCm: +(window.__A() * 100).toFixed(2)}; });
      /* bank points from the still level up to 20 cm, 13 lines across the view, every 4 mm along the slope */
      const pts = await E(() => { const q = window.__desQA(), v = window.__cur, P = q.POND, [ux, uz] = [v.t[0] - v.e[0], v.t[2] - v.e[2]].map((a, _, A) => a / Math.hypot(A[0], A[1])), sx = -uz, sz = ux, o = [];
        const [wx, wz] = window.__edge(-.35); for (let a = -.6; a <= .6; a += .1) for (let d = -1.2; d < 2.4; d += .004) { const x = wx - ux * d + sx * a, z = wz - uz * d + sz * a, hh = q.hTop(x, z) - P.wy;
          if (hh < 0 || hh > .2) continue; const p = window.__px(x, q.hTop(x, z), z); if (p && p[0] > 3 && p[1] > 3 && p[0] < innerWidth - 3 && p[1] < innerHeight - 3) o.push({x, z, hh, p}); } return o; });
      r.points = pts.length;
      await cap(`风 ${wv}：湿沙带和退水湿痕，眼高 1.6 米（实时）`);
      const d = frameDir(`wind_${k}`), laps = [];
      for (let i = 0; i < NF; i++) { laps.push(await E(pts => { const q = window.__desQA(); q.step(2, 1 / 30); const t = q.pondU.uT.value; return pts.map(p => q.lapAt(p.x, p.z, t)); }, pts.map(p => ({x: p.x, z: p.z}))));
        await S.frames(2); await S.page.screenshot({path: fpath(d, i)}); }
      await cap(""); await encode(d, `wind_${k}`, 15);
      fs.copyFileSync(fpath(d, NF >> 1), path.join(OUT, `${TAG}wind_${k}.png`));
      /* brightness profile up the bank (mean over the clip, 5 mm bins) and the trail's drying curve (points the water has left, by the time since) */
      const bins = new Array(40).fill(0).map(() => [0, 0]), age = new Map(), left = pts.map(() => null), A = r.lapAmpCm / 100;
      for (let i = 0; i < NF; i++) { const buf = await pixels(fpath(d, i));
        pts.forEach((p, j) => { const L = lum(buf, p.p[0], p.p[1], 1), wetNow = laps[i][j] > p.hh;
          const b = Math.min(39, Math.floor(p.hh / .005)); bins[b][0] += L; bins[b][1]++;
          if (wetNow) left[j] = "w"; else { if (left[j] === "w") left[j] = i; if (typeof left[j] === "number") { const a = i - left[j]; if (!age.has(a)) age.set(a, []); age.get(a).push(L); } } }); }
      const prof = bins.map(([s, n], i) => ({hCm: +(i * .5 + .25).toFixed(2), lum: n ? r1(s / n) : null}));
      /* dry reference: the highest 1.5 cm of bank in view. The band's top: where the bank brightens fastest (3-bin slope) above the lap's reach + 1 cm */
      const seen = prof.filter(b => b.lum != null), hiTop = seen[seen.length - 1].hCm, dryRef = mean(seen.filter(b => b.hCm > hiTop - 1.5).map(b => b.lum));
      let top = null, best = -1; for (let i = 1; i < prof.length - 1; i++) { const a0 = prof[i - 1].lum, a1 = prof[i + 1].lum; if (a0 == null || a1 == null || prof[i].hCm < A * 100 + 1) continue;
        if (a1 - a0 > best) { best = a1 - a0; top = prof[i].hCm; } }
      const lumAtH = h => r1(mean(prof.filter(b => b.lum != null && Math.abs(b.hCm - h) < .6).map(b => b.lum)));
      const curve = [...age.entries()].sort((a, b) => a[0] - b[0]).filter(([, v]) => v.length >= 8).map(([a, v]) => ({s: +(a * 2 / 30).toFixed(2), lum: r1(mean(v)), n: v.length}));
      const at = s => { const c = curve.filter(x => Math.abs(x.s - s) <= .2); return c.length ? r1(mean(c.map(x => x.lum))) : null; };
      const l0 = at(0.13) ?? curve[0]?.lum, half = l0 + (dryRef - l0) * .5, t50 = curve.find(x => x.s > .1 && x.lum >= half), t75 = curve.find(x => x.s > .1 && x.lum >= l0 + (dryRef - l0) * .75);
      Object.assign(r, {dryRef: r1(dryRef), viewTopCm: hiTop, bandLumAt5cm: lumAtH(5), bandLumAt8cm: lumAtH(8), bandLumAt11cm: lumAtH(11), bandTopCm: top, bandTopOverReachCm: top == null ? null : r1(top - A * 100), profile: prof,
        trail: {lumJustLeft: l0, lumAt1s: at(1), lumAt2s: at(2), lumAt3s: at(3), lumAt4s: at(4), lumAt5s: at(5), halfDrySeconds: t50 ? t50.s : null, threeQuarterDrySeconds: t75 ? t75.s : null, curve}});
      console.log("wind", k, JSON.stringify({...r, profile: undefined, trail: {...r.trail, curve: undefined}}));
    }
  }
} catch (e) { console.log("ERR", e.stack || e); fails.push(String(e)); }
report.fails = fails;
fs.writeFileSync(path.join(OUT, `${TAG}d178-report-${WHICH.replace(/,/g, "+")}.json`), JSON.stringify(report, null, 1));
clearTimeout(killer); await S.close();
process.exit(fails.length ? 1 : 0);
