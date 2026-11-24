// Desert d172 proofs (graze/drink placement, grass, footprints), on any checkout (DIR, default this one; assets are committed,
// nothing is built). Not part of CI.
//   prints   every species that prints walks a fixed course; each print is matched to the measured foot contacts
//            (tools/e2e/d172-lib.mjs) -> OUT/<TAG>footprints.json
//   graze    >= 6 sim minutes of the camels' own day (plus tortoise and gerbil feeding), every graze/drink event with the
//            mouth's distance to the nearest tuft and to the water -> OUT/<TAG>graze.json
//   gshots   close-ups of a graze and a drink;  grass  grass stills at eye level (1.6 m) and 0.5 m;  wind  low vs strong wind clip
//   trails   top-down close-ups of each species' trail;  camvid  a camel walking with its prints appearing under the hooves
//   ver      the scene panel with its 「版本 xxxxxx」 label
//   pair     (no browser) OUT/main_<x>.png | OUT/new_<x>.png -> <x>_before_after.jpg, and main_/new_ json -> merged json
// Usage: node tools/e2e/d172-proof.mjs <mode[,mode]>   (OUT=/tmp/d172/out DIR=<checkout> TAG=<prefix>)
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {openScene, ffmpeg, sleep} from "./d172-lib.mjs";

const ROOT = path.resolve(process.env.DIR || path.join(path.dirname(fileURLToPath(import.meta.url)), "../.."));
const OUT = process.env.OUT || "/tmp/d172/out", TAG = process.env.TAG || "", WHICH = process.argv[2] || "prints";
const want = k => WHICH.split(",").includes(k);
fs.mkdirSync(OUT, {recursive: true});
const FONT = "/usr/share/fonts/truetype/wqy/wqy-microhei.ttc";
const lab = t => `drawtext=fontfile=${FONT}:text='${t}':x=14:y=12:fontsize=26:fontcolor=white:borderw=2:bordercolor=black`;

if (WHICH === "pair") {
  const MAINJS = process.env.MAINJS || "desert.013a914945.js", NEWJS = process.env.NEWJS || "本分支";
  const cols = [["main", `修改前（main，${MAINJS}）`], ["new", `修改后（本分支，${NEWJS}）`]];
  for (const f of fs.readdirSync(OUT).filter(f => f.startsWith("new_") && f.endsWith(".png"))) {
    const n = f.slice(4, -4), ins = cols.map(([k]) => path.join(OUT, `${k}_${n}.png`));
    if (!ins.every(p => fs.existsSync(p))) { console.log("skip", n); continue; }
    const fc = cols.map(([, t], i) => `[${i}:v]scale=960:-2,${lab(t)}[c${i}]`).join(";") + ";[c0][c1]hstack=inputs=2";
    await ffmpeg([...ins.flatMap(p => ["-i", p]), "-filter_complex", fc, "-q:v", "3", path.join(OUT, `${n}_before_after.jpg`)]);
    console.log("pair", n);
  }
  for (const j of ["footprints", "graze"]) {
    const gm = path.join(OUT, `main_${j}.json`), gn = path.join(OUT, `new_${j}.json`);
    if (!fs.existsSync(gm) || !fs.existsSync(gn)) continue;
    const m = JSON.parse(fs.readFileSync(gm)), b = JSON.parse(fs.readFileSync(gn));
    fs.writeFileSync(path.join(OUT, `${j}.json`), JSON.stringify({about: b.about, main: {bundle: m.bundle, ...m.result}, branch: {bundle: b.bundle, ...b.result}}, null, 1));
    console.log(j + ".json written");
  }
  process.exit(0);
}

const S = await openScene(ROOT, +(process.env.W || 1280), +(process.env.H || 720));
const {E, shot, cap} = S;
const killer = setTimeout(() => { console.log("TIMEOUT"); process.exit(3); }, +(process.env.LIMIT || 5400) * 1000);
const report = {bundle: S.bundle}, fails = [];

/* scene control for the courses: park everything that is not walking, put one animal somewhere */
await E(() => {
  const q = window.__desQA();
  window.__far = (cx, cz, r) => { const far = []; for (let x = -40; x <= 40; x += 2) for (let z = -40; z <= 40; z += 2)
    if (q.sN(x, z) < .8 && q.pN(x, z) > 1.4 && Math.hypot(x - cx, z - cz) > r && Math.hypot(x - q.TENT.x, z - q.TENT.z) > 8) far.push({x, z}); return far; };
  window.__park = (cx, cz, r, keep) => { const far = window.__far(cx, cz, r); keep = keep || [];
    q.PA.os.forEach((o, i) => { if (keep.includes(o)) return; const p = far[(i * 37 + 5) % far.length]; q.osPlace(o, p.x, p.z, 0); o.mode = "stand"; o.t = 1e9; o.path = null; });
    q.PA.tt.forEach((o, i) => { if (keep.includes(o)) return; const p = far[(i * 53 + 11) % far.length]; q.torPlace(o, p.x, p.z, 0); o.mode = "shell"; o.t = 1e9; o.path = null; });
    q.ANIM.camels.forEach((a, i) => { if (keep.includes(a)) return; const R = q.REST[i];
      Object.assign(a, {x: R.x, z: R.z, yaw: R.yaw, mode: "rest", job: "kneel", k: 1, timer: 1e9, spd: 0, yr: 0, path: null, gy: null, goal: R});
      for (const k in a.r.acts) a.r.acts[k].stop(); a.r.fd = null; a.r.cur = null; q.fn.play(a.r, "kneel_rest", .01, 1); }); };
  window.__camel = (ci, x, z, yaw) => { const a = q.ANIM.camels[ci];
    Object.assign(a, {x, z, yaw, k: 0, spd: 0, yr: 0, path: null, pi: 0, gy: null, mode: "job", job: "idle", timer: 1e9, face: null, stuck: 0});
    for (const k in a.r.acts) a.r.acts[k].stop(); a.r.fd = null; a.r.cur = null; q.fn.play(a.r, "idle", .01, 1); for (const f of a.feet) f.p = null; return a; };
  q.PA.noView = 1;
});

/* ---------------- footprints ---------------- */
async function course(sp, setup, stepFn, sec, dt) {
  if (process.env.ONLY && !process.env.ONLY.split(",").includes(sp)) return {contacts: [], prints: [], matched: []};
  await E(`(${setup})()`);
  await E((sp) => { const D = window.__d172; D.trackStart([sp]); D.prReset(); }, sp);
  const N = Math.round(sec / dt), CH = 150;
  for (let i = 0; i < N; i += CH) await E((n, dt, fn) => { const q = window.__desQA(), D = window.__d172, f = fn ? eval(fn) : null;
    for (let k = 0; k < n; k++) { if (f) f(q); q.step(1, dt); D.trackStep(dt); D.prPoll(); } }, Math.min(CH, N - i), dt, stepFn);
  return E((sp) => { const D = window.__d172, C = D.trackEnd(), P = D.pr.list.filter(p => p.sp === sp); return {contacts: C, prints: P, matched: D.match(P, C)}; }, sp);
}
const stats = (sp, r) => {
  const pct = (a, p) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(p * (s.length - 1)))] : null; };
  const cm = x => x == null ? null : +(x * 100).toFixed(1);
  const M = r.matched, offs = M.filter(p => p.off != null && p.off <= .1).map(p => p.off);
  const sideOk = p => { if (p.off == null || p.off > .1) return null; const [s, e] = p.foot.split("-");
    if (sp === "dromedary" || sp === "bactrian" || sp === "tortoise") return (p.mir === (s === "R" ? 1 : 0)) && (p.v === (e.startsWith("hind") ? 1 : 0)); return null; };
  const wrong = M.filter(p => sideOk(p) === false).length;
  return {contacts: r.contacts.length, prints: M.length,
    offsetCm: {max: cm(offs.length ? Math.max(...offs) : null), p95: cm(pct(offs, .95)), p50: cm(pct(offs, .5))},
    noMatchingContact: M.filter(p => p.off == null || p.off > .1).length,
    noMatchingDetail: M.filter(p => p.off == null || p.off > .1).slice(0, 8),
    wrongSideOrForeHind: wrong, onWater: M.filter(p => p.water).length, onRock: M.filter(p => p.rock).length,
    sample: M.slice(0, process.env.ALL ? 1e9 : 12)};
};

if (want("prints")) {
  const R = {};
  const DT = 1 / 30;
  for (const ci of [0, 1]) {
    const sp = ci ? "bactrian" : "dromedary";
    const r = await course(sp, `(() => { const q = window.__desQA(); window.__park(9, -9, 10, [q.ANIM.camels[${ci}]]); const a = window.__camel(${ci}, 4, -9, .9); q.step(10, 1/30);
      window.__legs = [[12, -4], [9, -13], [13, -3], [5, -9], [2, -4]]; window.__li = 0; })`,
      `(q => { const a = q.ANIM.camels[${ci}]; if (a.mode !== "walk" && window.__li < window.__legs.length) { const [x, z] = window.__legs[window.__li++]; q.fn.camelGo(a, {x, z}, "idle"); }
        if (a.mode === "job" && a.timer > 100) a.timer = 1e9; })`, 60, DT);
    R[sp] = stats(sp, r); console.log(sp, JSON.stringify(R[sp]).slice(0, 400));
  }
  {
    const r = await course("ostrich", `(() => { const q = window.__desQA(), O = q.PA.os[0]; q.tod("day"); window.__park(-5.5, -5, 6, [O]); q.osPlace(O, -5.5, -5, 0); O.mode = "stand"; O.t = 1e9; q.step(10, 1/30);
      window.__legs = [[-2, -9], [-7, -11], [-9, -4], [-4, -2]]; window.__li = 0; })`,
      `(q => { const O = q.PA.os[0]; if (!O.path && window.__li < window.__legs.length) { const [x, z] = window.__legs[window.__li++]; let ok = q.osGo(O, {x, z}, window.__li === 3); for (let t = 0; !ok && t < 20; t++) { const p = q.osSpot(O, true, 8); ok = p && q.osGo(O, p, window.__li === 3); } if (ok) O.then = "stand"; } if (O.mode === "stand") O.t = 1e9; if ((window.__oi = (window.__oi || 0) + 1) % 6 === 0) (window.__olog = window.__olog || []).push([+q.st.t.toFixed(1), O.mode, +O.v.toFixed(2), O.rig.cur, +O.P.sit.toFixed(2), +O.x.toFixed(2), +O.z.toFixed(2)].join(" ")); })`, 45, DT);
    if (process.env.OLOG) console.log((await E(() => window.__olog)).join("\n"));
    R.ostrich = stats("ostrich", r); console.log("ostrich", JSON.stringify(R.ostrich).slice(0, 400));
  }
  {
    const r = await course("tortoise", `(() => { const q = window.__desQA(), T = q.PA.tt[0]; window.__park(2, -6, 5, [T]); q.torPlace(T, 2, -6, .5); T.mode = "graze"; T.t = 1e9; T.P.wd = 0; q.step(30, 1/30);
      window.__legs = [[2.8, -5], [3.2, -6.4], [2.2, -6.8], [1.6, -5.6]]; window.__li = 0; })`,
      `(q => { const T = q.PA.tt[0]; if (T.mode !== "walk" && window.__li < window.__legs.length) { const [x, z] = window.__legs[window.__li++]; q.torGo(T, {x, z}, "walk"); T.then = "graze"; } if (T.mode === "graze") T.t = 1e9; })`, 60, DT);
    R.tortoise = stats("tortoise", r); console.log("tortoise", JSON.stringify(R.tortoise).slice(0, 400));
  }
  {
    const r = await course("gerbil", `(() => { const q = window.__desQA(), G = q.PA.gb[0], h = G.h; q.tod("sunset"); window.__park(h.x, h.z, 6, []);
      Object.assign(G, {mode: "forage", x: h.x + .3, z: h.z, t: 1e9, goal: null, out: true}); G.P.in = 0; q.step(10, 1/30); window.__gi = 0; })`,
      `(q => { const G = q.PA.gb[0], h = G.h; if (G.mode !== "forage") { G.mode = "forage"; G.P.in = 0; } G.t = 1e9; if (!G.goal) { const a = window.__gi++ * 2.1; G.goal = {x: h.x + Math.cos(a) * 1.6, z: h.z + Math.sin(a) * 1.6}; G.spd = .9; } })`, 40, DT);
    R.gerbil = stats("gerbil", r); console.log("gerbil", JSON.stringify(R.gerbil).slice(0, 400));
  }
  {
    const r = await course("scorpion", `(() => { const q = window.__desQA(), A = q.PA.sc[0]; q.tod("sunset"); window.__park(A.rk.dx, A.rk.dz, 5, []);
      A.x = A.rk.dx; A.z = A.rk.dz; A.mode = "door"; A.t = 1e9; window.__d0 = {x: A.rk.dx, z: A.rk.dz}; window.__si = 0; q.step(10, 1/30); })`,
      `(q => { const A = q.PA.sc[0]; A.mode = "door"; A.t = 1e9; const d = Math.hypot(A.x - A.rk.dx, A.z - A.rk.dz); if (d < .04) { const a = Math.atan2(window.__d0.x - A.x, window.__d0.z - A.z) + (window.__si++ % 2 ? .9 : -.9) + Math.PI;
        A.rk.dx = A.x + Math.sin(a) * .35; A.rk.dz = A.z + Math.cos(a) * .35; } })`, 60, DT);
    R.scorpion = stats("scorpion", r); console.log("scorpion", JSON.stringify(R.scorpion).slice(0, 400));
    await E(() => { const q = window.__desQA(), A = q.PA.sc[0]; if (window.__d0) A.rk.dx = window.__d0.x, A.rk.dz = window.__d0.z; q.tod("day"); });
  }
  {
    const r = await course("eagle", `(() => { const q = window.__desQA(); q.tod("day"); window.__park(0, 0, 0, []); q.eagleLand(); })`, null, 30, DT);
    R.eagle = stats("eagle", r); console.log("eagle", JSON.stringify(R.eagle).slice(0, 400));
  }
  report.result = {units: "offset in cm: horizontal distance from a print's centre to the centroid of the measured sole contact it belongs to",
    perSpecies: R};
  report.about = "Each print is matched to the nearest measured contact of the same species whose run (first to last frame the sole is down and still) covers the print's time ±0.25 s; a print with none within 10 cm is counted as having no matching contact. The contact is found on the skinned mesh itself (the foot bone and its children, skinned on the CPU every frame), independent of how the scene places prints.";
  fs.writeFileSync(path.join(OUT, `${TAG}footprints.json`), JSON.stringify(report, null, 1));
}

report.fails = fails;
fs.writeFileSync(path.join(OUT, `${TAG}d172-report-${WHICH.replace(/,/g, "+")}.json`), JSON.stringify(report, null, 1));
clearTimeout(killer);
await S.close();
process.exit(fails.length ? 1 : 0);
