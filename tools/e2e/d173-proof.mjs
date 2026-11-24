// Desert d173 proofs (grass wind, ostrich and gerbil prints, every species re-measured), on any checkout (DIR, default this one;
// assets are committed, nothing is built). Not part of CI. Probes come from d172-lib.mjs.
//   prints  every species that prints walks a fixed course; each print is matched to the measured foot contacts of the animal on
//           the course (the others are parked and not tracked) -> OUT/<TAG>footprints.json
//   graze   >= 6 sim minutes of the camels' own day (d172's method) -> OUT/<TAG>graze.json
//   gwind   grass tip displacement at wind 0.15 / 0.5 / 1.0 and in a gust, from the build's own bend formula evaluated on the live
//           instances and uniforms -> OUT/<TAG>grass_wind.json
//   wstrip  four stills from one fixed camera (wind 0.15 / 0.5 / 1.0 / 1.0 with the gust at its peak on the tuft in view)
//   wvid    10 s of the same grass, wind 0.15 then switched to 1.0;  ver  the panel's 「版本 xxxxxx」 label
//   pair    (no browser) main_/new_ pngs and json -> before/after images, the two-row wind strip and merged json
// Usage: node tools/e2e/d173-proof.mjs <mode[,mode]>   (OUT=/tmp/d173/out DIR=<checkout> TAG=<prefix>)
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {openScene, ffmpeg} from "./d172-lib.mjs";

const ROOT = path.resolve(process.env.DIR || path.join(path.dirname(fileURLToPath(import.meta.url)), "../.."));
const OUT = process.env.OUT || "/tmp/d173/out", TAG = process.env.TAG || "", WHICH = process.argv[2] || "prints";
const want = k => WHICH.split(",").includes(k);
fs.mkdirSync(OUT, {recursive: true});
const FONT = "/usr/share/fonts/truetype/wqy/wqy-microhei.ttc";
const lab = (t, s) => `drawtext=fontfile=${FONT}:text='${t}':x=14:y=12:fontsize=${s || 26}:fontcolor=white:borderw=2:bordercolor=black`;

if (WHICH === "pair") {
  const MAINJS = process.env.MAINJS, NEWJS = process.env.NEWJS;
  const cols = [["main", `修改前（main，${MAINJS}）`], ["new", `修改后（本分支，${NEWJS}）`]];
  for (const f of fs.readdirSync(OUT).filter(f => f.startsWith("new_trail_") && f.endsWith(".png"))) {
    const n = f.slice(4, -4), ins = cols.map(([k]) => path.join(OUT, `${k}_${n}.png`));
    if (!ins.every(p => fs.existsSync(p))) { console.log("skip", n); continue; }
    const fc = cols.map(([, t], i) => `[${i}:v]scale=960:-2,${lab(t)}[c${i}]`).join(";") + ";[c0][c1]hstack=inputs=2";
    await ffmpeg([...ins.flatMap(p => ["-i", p]), "-filter_complex", fc, "-q:v", "3", path.join(OUT, `${n}_before_after.jpg`)]);
    console.log("pair", n);
  }
  /* the wind strip: main on top, the branch below, the same four moments in each */
  const W4 = ["w0.15", "w0.5", "w1", "gust"], L4 = ["风 0.15", "风 0.5", "风 1.0", "风 1.0 阵风峰值"];
  const ins = cols.flatMap(([k]) => W4.map(w => path.join(OUT, `${k}_ws_${w}.png`)));
  if (ins.every(p => fs.existsSync(p))) {
    const fc = ins.map((_, i) => `[${i}:v]scale=480:-2,${lab((i % 4 ? "" : (i < 4 ? "main · " : "本分支 · ")) + L4[i % 4], 22)}[c${i}]`).join(";") + ";"
      + "[c0][c1][c2][c3]hstack=inputs=4[r0];[c4][c5][c6][c7]hstack=inputs=4[r1];[r0][r1]vstack=inputs=2";
    await ffmpeg([...ins.flatMap(p => ["-i", p]), "-filter_complex", fc, "-q:v", "3", path.join(OUT, "wind_grass_strip.jpg")]);
    console.log("wind_grass_strip.jpg");
  }
  for (const j of ["footprints", "graze", "grass_wind"]) {
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
const bundle = S.bundle, fails = [];
const save = (name, about, result) => fs.writeFileSync(path.join(OUT, `${TAG}${name}.json`), JSON.stringify({bundle, about, result}, null, 1));

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
  /* a gerbil landing: the sole's lowest skin comes back within 5 mm of the sand after the hop lifted it 9 mm clear (its hops
     lift a hind foot only 1-2 cm, so d172's 8 / 12 mm missed most right-hind landings); the rest as in d172 */
  window.__d172.SP.gerbil = {on: .005, band: .004, lift: .009, td: 1};
});

if (process.env.DBGP) await E(() => { window.__dbgP = 1; });

/* ---------------- footprints ---------------- */
const TRAILH = {dromedary: 7, bactrian: 7, ostrich: 5, tortoise: 1.1, gerbil: 1.3, scorpion: .8, eagle: 1.6};
const ZH = {dromedary: "单峰驼", bactrian: "双峰驼", ostrich: "鸵鸟", tortoise: "陆龟", gerbil: "沙鼠", scorpion: "蝎子", eagle: "金雕"};
async function course(sp, who, setup, stepFn, sec, dt) {
  if (process.env.ONLY && !process.env.ONLY.split(",").includes(sp)) return null;
  await E(`(${setup})()`);
  /* only the animal on the course is tracked: the parked ones fidget in place and their feet are not this course's contacts */
  await E((sp, who) => { const q = window.__desQA(), D = window.__d172, A = eval(who); D.trackStart([sp]); if (A.x != null || A.o) D.track.on = D.track.on.filter(a => a.o === A); D.prReset(); }, sp, who);
  const N = Math.round(sec / dt), CH = 150;
  /* this animal's prints: those laid within reach of its body at that moment (other animals of the species roam elsewhere) */
  const REACH = {dromedary: 2.5, bactrian: 2.5, ostrich: 1.5, tortoise: .4, gerbil: .3, scorpion: .25, eagle: 1e9}[sp];
  for (let i = 0; i < N; i += CH) await E((n, dt, fn, who, reach) => { const q = window.__desQA(), D = window.__d172, f = fn ? eval(fn) : null, A = eval(who);
    for (let k = 0; k < n; k++) { if (f) f(q); q.step(1, dt); D.trackStep(dt); const n0 = D.pr.list.length; D.prPoll();
      for (let j = n0; j < D.pr.list.length; j++) { const p = D.pr.list[j]; p.mine = A.x == null || Math.hypot(p.x - A.x, p.z - A.z) < reach;
        if (window.__dbgP && D.track.on[0]) p.f = D.track.on[0].feet.map(f => [+(f.lo * 100).toFixed(1), +(100 * Math.hypot(f.px - p.x, f.pz - p.z)).toFixed(1), +(f.fs || 0).toFixed(2)]); } } }, Math.min(CH, N - i), dt, stepFn, who, REACH);
  const r = await E((sp, who) => { const q = window.__desQA(), D = window.__d172, A = eval(who), C = D.trackEnd();
    const P = D.pr.list.filter(p => p.sp === sp && p.mine); return {contacts: C, prints: P, matched: D.match(P, C), others: D.pr.list.filter(p => p.sp === sp && !p.mine).length}; }, sp, who);
  if (process.env.DBGP) r.matched.forEach((m, i) => console.log("P", m.t, m.foot, m.off, m.dt, JSON.stringify(r.prints[i].f)));
  if (process.env.SHOTS && r.prints.length) {
    const P = r.prints, c = P.reduce((b, p) => { const n = P.filter(o => Math.hypot(o.x - p.x, o.z - p.z) < TRAILH[sp] * .35).length; return n > b.n ? {n, p} : b; }, {n: -1}).p;
    await E((x, z, h) => { const q = window.__desQA(); q.PA.noView = 1; const y = q.hTop(x, z); q.lookAt(x, y + h, z + .001, x, y, z); q.step(1, 1 / 30); }, c.x, c.z, TRAILH[sp]);
    await cap(`${ZH[sp]}足迹（俯视）`); await shot(path.join(OUT, `${TAG}trail_${sp}.png`)); await cap("");
  }
  return r;
}
const stats = (sp, r) => {
  const pct = (a, p) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(p * (s.length - 1)))] : null; };
  const cm = x => x == null ? null : +(x * 100).toFixed(1);
  const M = r.matched, offs = M.filter(p => p.off != null && p.off <= .1).map(p => p.off);
  const sideOk = p => { if (p.off == null || p.off > .1) return null; const [s, e] = p.foot.split("-");
    if (sp === "dromedary" || sp === "bactrian" || sp === "tortoise") return (p.mir === (s === "R" ? 1 : 0)) && (p.v === (e.startsWith("hind") ? 1 : 0)); return null; };
  const o = {contacts: r.contacts.length, prints: M.length, printsOfOtherAnimals: r.others,
    offsetCm: {max: cm(offs.length ? Math.max(...offs) : null), p95: cm(pct(offs, .95)), p50: cm(pct(offs, .5))},
    noMatchingContact: M.filter(p => p.off == null || p.off > .1).length,
    noMatchingDetail: M.filter(p => p.off == null || p.off > .1).slice(0, 8),
    wrongSideOrForeHind: M.filter(p => sideOk(p) === false).length, onWater: M.filter(p => p.water).length, onRock: M.filter(p => p.rock).length};
  /* the gerbil: its landings (each foot's touchdowns) and how many of them a print sits on (within 3 cm, its time ±0.25 s) */
  if (sp === "gerbil") { const C = r.contacts, P = r.prints;
    const hit = C.filter(c => P.some(p => p.t >= c.t0 - .25 && p.t <= c.t1 + .25 && Math.hypot(p.x - c.x, p.z - c.z) <= .03)).length;
    o.landings = {footTouchdowns: C.length, withPrint: hit, withPrintPct: C.length ? +(100 * hit / C.length).toFixed(1) : null,
      perFoot: Object.fromEntries(["L-hind", "R-hind", "L-fore", "R-fore"].map(k => { const c = C.filter(x => x.side + "-" + x.end === k);
        return [k, {touchdowns: c.length, withPrint: c.filter(x => P.some(p => p.t >= x.t0 - .25 && p.t <= x.t1 + .25 && Math.hypot(p.x - x.x, p.z - x.z) <= .03)).length}]; }))}; }
  o.sample = M.slice(0, 12);
  return o;
};

if (want("prints")) {
  const R = {}, DT = 1 / 30;
  for (const ci of [0, 1]) {
    const sp = ci ? "bactrian" : "dromedary";
    const r = await course(sp, `q.ANIM.camels[${ci}]`, `(() => { const q = window.__desQA(); window.__park(9, -9, 10, [q.ANIM.camels[${ci}]]); const a = window.__camel(${ci}, 4, -9, .9); q.step(10, 1/30);
      window.__legs = [[12, -4], [9, -13], [13, -3], [5, -9], [2, -4]]; window.__li = 0; })`,
      `(q => { const a = q.ANIM.camels[${ci}]; if (a.mode !== "walk" && window.__li < window.__legs.length) { const [x, z] = window.__legs[window.__li++]; q.fn.camelGo(a, {x, z}, "idle"); }
        if (a.mode === "job" && a.timer > 100) a.timer = 1e9; })`, 60, DT);
    if (r) { R[sp] = stats(sp, r); console.log(sp, JSON.stringify(R[sp]).slice(0, 300)); }
  }
  {
    const r = await course("ostrich", "q.PA.os[0]", `(() => { const q = window.__desQA(), O = q.PA.os[0]; q.tod("day"); window.__park(-5.5, -5, 6, [O]);
      for (const [x, z] of [[-5.5, -5], [-6, -7], [-4, -6], [-7, -4], [-3.5, -8], [-8, -8], [-5, -3]]) { q.osPlace(O, x, z, 0); if (q.osGo(O, {x: -2, z: -9})) break; }
      O.path = null; O.mode = "stand"; O.t = 1e9; O.v = 0; q.step(10, 1/30);
      window.__legs = [[-2, -9], [-7, -11], [-9, -4], [-4, -2], [-2, -9], [-7, -11], [-9, -4], [-4, -2], [-2, -9], [-7, -11]]; window.__li = 0; })`,
      `(q => { const O = q.PA.os[0]; if (!O.path && window.__li < window.__legs.length) { const [x, z] = window.__legs[window.__li++]; let ok = q.osGo(O, {x, z}, window.__li === 3); for (let t = 0; !ok && t < 20; t++) { const p = q.osSpot(O, true, 8); ok = p && q.osGo(O, p, window.__li === 3); } if (ok) O.then = "stand"; } if (O.mode === "stand") O.t = 1e9; })`, +(process.env.OSEC || 45), DT);
    if (r) { R.ostrich = stats("ostrich", r); console.log("ostrich", JSON.stringify(R.ostrich).slice(0, 600)); }
  }
  {
    const r = await course("tortoise", "q.PA.tt[0]", `(() => { const q = window.__desQA(), T = q.PA.tt[0]; window.__park(2, -6, 5, [T]); q.torPlace(T, 2, -6, .5); T.mode = "graze"; T.t = 1e9; T.P.wd = 0; q.step(30, 1/30);
      window.__legs = [[2.8, -5], [3.2, -6.4], [2.2, -6.8], [1.6, -5.6]]; window.__li = 0; })`,
      `(q => { const T = q.PA.tt[0]; if (T.mode !== "walk" && window.__li < window.__legs.length) { const [x, z] = window.__legs[window.__li++]; q.torGo(T, {x, z}, "walk"); T.then = "graze"; } if (T.mode === "graze") T.t = 1e9; })`, 60, DT);
    if (r) { R.tortoise = stats("tortoise", r); console.log("tortoise", JSON.stringify(R.tortoise).slice(0, 300)); }
  }
  {
    const r = await course("gerbil", "q.PA.gb[0]", `(() => { const q = window.__desQA(), G = q.PA.gb[0], h = G.h; q.tod("sunset"); window.__park(h.x, h.z, 6, []);
      Object.assign(G, {mode: "forage", x: h.x + .3, z: h.z, t: 1e9, goal: null, out: true}); G.P.in = 0; q.step(10, 1/30); window.__gi = 0; })`,
      `(q => { const G = q.PA.gb[0], h = G.h; if (G.mode !== "forage") { G.mode = "forage"; G.P.in = 0; } G.t = 1e9; if (!G.goal) { const a = window.__gi++ * 2.1; G.goal = {x: h.x + Math.cos(a) * 1.6, z: h.z + Math.sin(a) * 1.6}; G.spd = .9; } })`, 40, DT);
    if (r) { R.gerbil = stats("gerbil", r); console.log("gerbil", JSON.stringify(R.gerbil).slice(0, 600)); }
  }
  {
    const r = await course("scorpion", "q.PA.sc[0]", `(() => { const q = window.__desQA(), A = q.PA.sc[0]; q.tod("sunset"); window.__park(A.rk.dx, A.rk.dz, 5, []);
      A.x = A.rk.dx; A.z = A.rk.dz; A.mode = "door"; A.t = 1e9; window.__d0 = {x: A.rk.dx, z: A.rk.dz}; window.__si = 0; q.step(10, 1/30); })`,
      `(q => { const A = q.PA.sc[0]; A.mode = "door"; A.t = 1e9; const d = Math.hypot(A.x - A.rk.dx, A.z - A.rk.dz); if (d < .04) { const a = Math.atan2(window.__d0.x - A.x, window.__d0.z - A.z) + (window.__si++ % 2 ? .9 : -.9) + Math.PI;
        A.rk.dx = A.x + Math.sin(a) * .35; A.rk.dz = A.z + Math.cos(a) * .35; } })`, 60, DT);
    if (r) { R.scorpion = stats("scorpion", r); console.log("scorpion", JSON.stringify(R.scorpion).slice(0, 300)); }
    await E(() => { const q = window.__desQA(), A = q.PA.sc[0]; if (window.__d0) A.rk.dx = window.__d0.x, A.rk.dz = window.__d0.z; q.tod("day"); });
  }
  {
    const r = await course("eagle", "q.ANIM.eagle", `(() => { const q = window.__desQA(); q.tod("day"); window.__park(0, 0, 0, []); q.eagleLand(); })`, null, 30, DT);
    if (r) { R.eagle = stats("eagle", r); console.log("eagle", JSON.stringify(R.eagle).slice(0, 300)); }
  }
  save("footprints", "Each species walks a fixed course (d172's courses); only the animal on the course is tracked. Its contacts are measured on the skinned mesh itself (the foot bone and its children, skinned on the CPU every frame): a run of frames with the sole on the sand and still; for the gerbil each landing (the sole's lowest skin back within 5 mm of the sand after lifting 9 mm clear), placed where it first touches. Each print is matched to the nearest contact whose run covers the print's time ±0.25 s; a print with none within 10 cm has no matching contact. Offsets in cm.",
    {units: "offset in cm: horizontal distance from a print's centre to the measured sole contact it belongs to", perSpecies: R});
}

/* the whole gerbil colony at dusk, as it lives: every gerbil tracked, every gerbil print checked */
if (want("colony")) {
  const r = await course("gerbil", "({})", `(() => { const q = window.__desQA(); q.tod("sunset"); q.step(10, 1/30); })`, null, +(process.env.CSEC || 60), 1 / 30);
  const o = stats("gerbil", r); delete o.sample;
  save("gerbil_colony", "Every gerbil left to its own dusk routine (nothing parked or steered); all of them tracked on the skinned mesh, every gerbil print matched to a landing (same rule as footprints.json).", o);
  console.log("colony", JSON.stringify(o).slice(0, 600));
}

/* ---------------- graze / drink placement (d172's method) ---------------- */
if (want("graze")) {
  const DT = 1 / 30, MIN = +(process.env.GMIN || 6);
  await E(() => { const q = window.__desQA(); q.tod("day"); q.PA.noView = 1; window.__gz = {ev: [], cur: {}}; });
  for (let s = 0; s < MIN * 60; s += 10) {
    await E(dt => { const q = window.__desQA(), D = window.__d172, Z = window.__gz, wy = q.POND.wy, T = D.tufts();
      const near = (x, z) => { let b = 1e9; for (const p of T) b = Math.min(b, Math.hypot(p.x - x, p.z - z)); return b; };
      const fin = id => { const c = Z.cur[id]; delete Z.cur[id]; if (!c || !c.lo) return; const m = c.lo, dT = near(m.x, m.z), dW = m.y - wy, pn = q.pN(m.x, m.z);
        const valid = c.kind === "drink" ? pn < 1 && Math.abs(dW) <= .05 : dT <= .3;
        Z.ev.push({sp: c.sp, kind: c.kind, t0: +c.t0.toFixed(1), dur: +(q.st.t - c.t0).toFixed(1), mouth: {x: +m.x.toFixed(3), y: +m.y.toFixed(3), z: +m.z.toFixed(3)},
          mouthToTuftM: +dT.toFixed(3), mouthToWaterYM: +dW.toFixed(3), mouthAboveSandM: +(m.y - q.hTop(m.x, m.z)).toFixed(3), mouthOverWater: pn < 1, valid}); };
      const smp = (id, on, kind, sp, mf) => { if (!on) { if (Z.cur[id]) fin(id); return; } const c = Z.cur[id] || (Z.cur[id] = {sp, kind, t0: q.st.t, lo: null});
        if (c.kind !== kind) { fin(id); return; } const m = mf(); if (m && (!c.lo || m.y < c.lo.y)) c.lo = m; };
      if (q.st.phase !== "day") q.tod("day");
      for (let k = 0; k < 300; k++) { q.step(1, dt); if (k % 3) continue;
        q.ANIM.camels.forEach((a, i) => { const dr = a.r.acts.drink, w = dr && dr.isRunning() ? dr.getEffectiveWeight() : 0;
          smp("c" + i, a.mode === "job" && (a.job === "graze" || a.job === "drink") && w > .9, a.job, i ? "bactrian" : "dromedary", () => D.mouth(a)); });
        q.PA.tt.forEach((A, i) => smp("t" + i, (A.mode === "graze" && A.P.gr > .8) || (A.mode === "drink" && A.P.dr > .8), A.mode, "tortoise", () => D.mouthPA(A)));
        q.PA.gb.forEach((A, i) => smp("g" + i, A.mode === "nibble" && A.P.nib > .8 && A.rig, "nibble", "gerbil", () => D.mouthPA(A)));
        q.PA.os.forEach((A, i) => smp("o" + i, A.mode === "graze" && A.rig && A.rig.cur === "peck", "peck", "ostrich", () => D.mouthPA(A))); } }, DT);
  }
  const ev = await E(() => window.__gz.ev), per = {};
  for (const e of ev) { const k = e.sp + ":" + e.kind, P = per[k] || (per[k] = {events: 0, valid: 0, mouthToTuftM: [], mouthToWaterYM: []}); P.events++; if (e.valid) P.valid++;
    P.mouthToTuftM.push(e.mouthToTuftM); P.mouthToWaterYM.push(e.mouthToWaterYM); }
  for (const k in per) { const P = per[k], st = a => { const s = [...a].sort((x, y) => x - y); return {min: s[0], p50: s[s.length >> 1], max: s[s.length - 1]}; };
    P.validPct = +(100 * P.valid / P.events).toFixed(1); P.mouthToTuftM = st(P.mouthToTuftM); P.mouthToWaterYM = st(P.mouthToWaterYM); }
  save("graze", "d172's method: every graze/drink/nibble/peck event over the sim, the mouth (lowest head vertex) at its deepest reach. graze/nibble/peck valid when within 0.3 m (horizontal) of a live grass/tuft/reed instance; drink valid when over the water (pN<1) and within 5 cm of the water height. Ostrich frozen (ostrich_v2ag): its pecks are reported, not changed.",
    {simMinutes: MIN, perKind: per, events: ev});
  for (const k in per) console.log("graze", k, per[k].events, "valid", per[k].validPct + "%");
}

/* ---------------- grass and wind ---------------- */
const hideUI = () => E(() => { document.body.classList.add("col", "snc"); for (const s of [".t", "#fab", "#sbtn", "#tp", "#ld"]) { const n = document.querySelector(s); if (n) n.style.display = "none"; } });
/* the camera's tuft: the thickest stand of grass a little back from the water; the wind is pinned to blow across the view */
const grassSpot = () => E(() => { const q = window.__desQA(), D = window.__d172, T = D.tufts().filter(p => q.pN(p.x, p.z) > 1.08 && q.pN(p.x, p.z) < 1.6);
  let best = null, bn = -1; for (const p of T) { const n = T.filter(o => Math.hypot(o.x - p.x, o.z - p.z) < 1.4).length; if (n > bn) { bn = n; best = p; } }
  return {x: best.x, z: best.z, y: q.hTop(best.x, best.z)}; });
/* the gust field's clock set so the gust at (x,z) is k (0..1 of its range over the next minute) */
const setGust = (g, k) => E(([g, k]) => { const q = window.__desQA(), G = q.dune.GUST, t0 = G.t; let lo = 1e9, hi = -1, ts = [];
  for (let t = t0; t < t0 + 60; t += .05) { G.t = t; const v = q.dune.gustAt(g.x, g.z); ts.push([t, v]); lo = Math.min(lo, v); hi = Math.max(hi, v); }
  const want = lo + (hi - lo) * k; let b = ts[0]; for (const e of ts) if (Math.abs(e[1] - want) < Math.abs(b[1] - want)) b = e; G.t = b[0]; return +b[1].toFixed(3); }, [g, k]);
async function windScene() {
  await hideUI(); await cap("");
  const g = await grassSpot();
  await E(g => { const q = window.__desQA(); window.__park(g.x, g.z, 9, []); q.tod("day"); q.PA.noView = 1; window.__set({weather: "sun", ct: "clear", wind: .15}); q.step(60, 1 / 30);
    const a = q.wind().a; q.windPin(a); q.step(30, 1 / 30); }, g);
  return g;
}
/* one fixed camera, side-on to the pinned wind, 3 m from the tuft at knee height: the grass blows left to right across the frame */
const windView = g => E(g => { const q = window.__desQA(), w = q.wind(), ex = g.x - w.z * 3, ez = g.z + w.x * 3; q.lookAt(ex, g.y + .75, ez, g.x, g.y + .2, g.z); }, g);
const setWind = (w, sec) => E(([w, sec]) => { const q = window.__desQA(); window.__set({wind: w}); q.step(Math.round(sec * 30), 1 / 30); return q.st.wn; }, [w, sec]);

if (want("gwind")) {
  const g = await windScene();
  /* the bend, as the build's own vertex shader computes it (both versions written out here, picked by the bundle's source) */
  const src = await E(async () => (await (await fetch("../" + window.CY.desert)).text()));
  const ver = src.includes("a0=atan(al,max(P.y,1e-4))") ? "d173" : src.includes("transformed.y-=length(d)*.55*h") ? "d172" : null;
  if (!ver) { fails.push("unknown grass shader"); }
  const levels = [[.15, .5, "wind 0.15"], [.5, .5, "wind 0.5"], [1, .5, "wind 1.0"], [1, 1, "wind 1.0, gust peak"]];
  const res = {};
  for (const [w, gk, name] of levels) {
    await setWind(w, 8); if (gk > .9) await setGust(g, 1);
    const out = await E(([ver, g, gk]) => {
      const q = window.__desQA(), M = new (q.W.matrix.constructor)(), e = M.elements, G = q.dune.GUST, fr = x => x - Math.floor(x), ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
      const SW = [.8, .8, .8, .8, .8, .8, .8, .8, .8, .3, .3, .3];  // grass, clump, dry (sway .8), reed (.3)
      const gustF = (x, z) => { const s = G.t - (x * q.WIND.x + z * q.WIND.z) / 6, qq = z * q.WIND.x - x * q.WIND.z;
        return Math.min(1, Math.max(0, .5 + .26 * Math.sin(s * .43) + .16 * Math.sin(s * 1.07 + 1.7) + .08 * Math.sin(s * 2.3 + .4) + .1 * Math.sin(qq * .21 + s * .31))); };
      /* the bend of one vertex (local position p, instance matrix columns), returned as the local displacement */
      const bend = (p, c0, c1, c2, ip, A, uT, uW, g) => { const WD = [q.WIND.x, q.WIND.z], tp = fr(Math.sin(ip[0] * 12.9898 + ip[2] * 78.233) * 43758.5453) * 6.283;
        const bp = tp + p[0] * 9 + p[2] * 7, calm = ss(.03, .3, uW);
        if (ver === "d172") { const wl = [(WD[0] * c0[0] + WD[1] * c0[2]) / (c0[0] ** 2 + c0[1] ** 2 + c0[2] ** 2), (WD[0] * c2[0] + WD[1] * c2[2]) / (c2[0] ** 2 + c2[1] ** 2 + c2[2] ** 2)];
          const h = Math.max(p[1], 0), hh = h * h, lean = uW * (1 + .5 * uW) * (.25 + 1.1 * g) * (.85 + .3 * Math.sin(uT * .6 + tp));
          const fl = (Math.sin(uT * (2.2 + 1.6 * uW) + bp) * .65 + Math.sin(uT * (3.9 + 2 * uW) + bp * 1.7) * .35) * (.05 + .45 * uW) * (.45 + .8 * g) * calm;
          const dx = wl[0] * (lean + .55 * fl) * A * hh - wl[1] * fl * .3 * A * hh, dz = wl[1] * (lean + .55 * fl) * A * hh + wl[0] * fl * .3 * A * hh;
          return [dx, -Math.hypot(dx, dz) * .55 * h, dz]; }
        const sc = [Math.max(Math.hypot(...c0), 1e-5), Math.max(Math.hypot(...c1), 1e-5), Math.max(Math.hypot(...c2), 1e-5)];
        let wl = [(WD[0] * c0[0] + WD[1] * c0[2]) / sc[0] + 1e-6, (WD[0] * c2[0] + WD[1] * c2[2]) / sc[2]]; const wn = Math.hypot(...wl); wl = [wl[0] / wn, wl[1] / wn];
        const P = [p[0] * sc[0], p[1] * sc[1], p[2] * sc[2]];
        const th = A * 3 * Math.pow(uW, 1.2) * (.45 + 1.1 * g) * (.86 + .28 * Math.sin(uT * .6 + tp));
        const fl = (Math.sin(uT * (2.2 + 1.6 * uW) + bp) * .65 + Math.sin(uT * (3.9 + 2 * uW) + bp * 1.7) * .35) * (.03 + .3 * uW) * (.45 + .8 * g) * calm * A * 1.25;
        let al = P[0] * wl[0] + P[2] * wl[1], ac = -P[0] * wl[1] + P[2] * wl[0]; const r = Math.hypot(al, P[1]), a0 = Math.atan2(al, Math.max(P[1], 1e-4));
        const ph = .5 * (th + fl) * Math.min(1.5, Math.max(0, P[1] / (sc[1] * .8)));
        const a1 = ph > 0 ? a0 + Math.max(1.15 - a0, 0) * (1 - Math.exp(-ph / .9)) : a0 + .5 * ph, dd = a1 - a0, k = Math.abs(dd) > 1e-3 ? Math.max(Math.sin(dd) / dd, .85) : 1;
        al = r * k * Math.sin(a1); const y = r * k * Math.cos(a1); ac += fl * .12 * y;
        const nx = wl[0] * al - wl[1] * ac, nz = wl[1] * al + wl[0] * ac; return [nx / sc[0] - p[0], y / sc[1] - p[1], nz / sc[2] - p[2]]; };
      /* the tufts: every grass/clump/dry/reed instance 2-12 m from the camera's tuft (mid distance); the tips: each blade's top 30 % */
      const S = {grass: {d: [], ang: [], str: [], n: 0}, reed: {d: [], ang: [], str: [], n: 0}};
      const frames = 90;
      for (let f = 0; f < frames; f++) {
        q.step(1, 1 / 30); const uT = q.st.t, uW = q.st.wn;
        q.VEG.slice(0, 12).forEach((im, vi) => { const Pg = im.geometry.attributes.position, A = SW[vi], K = vi < 9 ? S.grass : S.reed; let top = 0;
          for (let i = 0; i < Pg.count; i++) top = Math.max(top, Pg.getY(i));
          for (let k = 0; k < im.count; k++) { im.getMatrixAt(k, M); const c0 = [e[0], e[1], e[2]], c1 = [e[4], e[5], e[6]], c2 = [e[8], e[9], e[10]], ip = [e[12], e[13], e[14]];
            if (Math.hypot(...c0) < 1e-4) continue; const dd = Math.hypot(ip[0] - g.x, ip[2] - g.z); if (dd < 2 || dd > 12) continue;
            const gg = gustF(ip[0], ip[2]); if (gk > .9 && gg < .75) continue;  // the gust row: only tufts the gust is on
            for (let i = 0; i < Pg.count; i += 2) { const p = [Pg.getX(i), Pg.getY(i), Pg.getZ(i)]; if (p[1] < top * .7) continue;
              const d = bend(p, c0, c1, c2, ip, A, uT, uW, gg), w0 = [c0[0] * p[0] + c1[0] * p[1] + c2[0] * p[2], c0[1] * p[0] + c1[1] * p[1] + c2[1] * p[2], c0[2] * p[0] + c1[2] * p[1] + c2[2] * p[2]];
              const q1 = [p[0] + d[0], p[1] + d[1], p[2] + d[2]], w1 = [c0[0] * q1[0] + c1[0] * q1[1] + c2[0] * q1[2], c0[1] * q1[0] + c1[1] * q1[1] + c2[1] * q1[2], c0[2] * q1[0] + c1[2] * q1[1] + c2[2] * q1[2]];
              const dw = (w1[0] - w0[0]) * q.WIND.x + (w1[2] - w0[2]) * q.WIND.z;
              /* lean: the tip's angle from the vertical about the root, toward the wind, before and after */
              const at = w => Math.atan2(w[0] * q.WIND.x + w[2] * q.WIND.z, Math.max(w[1], 1e-4));
              K.d.push(dw); K.ang.push((at(w1) - at(w0)) * 180 / Math.PI); K.str.push(Math.hypot(...w1) / Math.hypot(...w0) - 1); K.n++; } } }); }
      const sum = K => { const st = a => { const s = [...a].sort((x, y) => x - y), m = a.reduce((x, y) => x + y, 0) / a.length; return {mean: m, p50: s[s.length >> 1], p90: s[Math.floor(s.length * .9)]}; };
        if (!K.n) return null; const d = st(K.d), a = st(K.ang), s = st(K.str.map(Math.abs));
        return {tipSamples: K.n, downwindCm: {mean: +(100 * d.mean).toFixed(1), p50: +(100 * d.p50).toFixed(1), p90: +(100 * d.p90).toFixed(1)},
          leanDeg: {mean: +a.mean.toFixed(1), p90: +a.p90.toFixed(1)}, stretchPct: {mean: +(100 * s.mean).toFixed(1), p90: +(100 * s.p90).toFixed(1)}}; };
      return {wind: +q.st.wn.toFixed(3), gustAtTufts: gk > .9 ? ">= 0.75 (gust field 0..1)" : "as it comes (0..1, mean ~0.5)", grassTips: sum(S.grass), reedTips: sum(S.reed)};
    }, [ver, g, gk]);
    res[name] = out; console.log(name, JSON.stringify(out));
  }
  save("grass_wind", "Grass tip displacement per wind level. The bend is each build's own vertex-shader formula (src/desert.js vegMat, d172: shear d = wl*(lean..)*A*h^2; d173: rotation about the tuft root toward a shared 66-degree downwind lean, more the higher the point, chord-shortened as a curved stem), evaluated on the CPU on the live instance matrices, the scene's wind (st.wn), wind direction, gust clock and time, over 3 s (90 frames). Tips: the top 30 % (by height) of every blade of every grass/clump/dry tuft (sway 0.8) and reed (0.3) 2-12 m from the camera's tuft. downwindCm: horizontal tip shift along the wind; leanDeg: change of the tip's angle from the vertical about the tuft root, toward the wind; stretchPct: change of the tip's distance from the root (0 = no stretching). 'gust peak': the same at wind 1.0 counting only tip samples on tufts the gust field is on (>= 0.75, its clock set so the gust peaks at the camera's tuft).",
    {shader: ver, levels: res});
}

if (want("wstrip")) {
  const g = await windScene();
  const L = [[.15, .5, "w0.15"], [.5, .5, "w0.5"], [1, .5, "w1"], [1, 1, "gust"]];
  for (const [w, gk, n] of L) { await setWind(w, 8); await E(() => window.__desQA().step(1, 1 / 30)); const gv = await setGust(g, gk); await windView(g);
    await E(() => { const q = window.__desQA(); q.st.t = 4000; q.step(1, 1 / 30); }); await shot(path.join(OUT, `${TAG}ws_${n}.png`)); console.log("ws", n, "gust", gv); }
}

if (want("wvid")) {
  const g = await windScene(), dir = path.join(OUT, `${TAG}wvidfr`); fs.rmSync(dir, {recursive: true, force: true}); fs.mkdirSync(dir);
  await setWind(.15, 8); await windView(g);
  let k = 0;
  for (let i = 0; i < 150; i++) {
    if (i === 75) await E(() => window.__set({wind: 1}));
    const wn = await E(() => { const q = window.__desQA(); q.step(2, 1 / 30); return q.st.wn; });
    await cap(i < 75 ? `风 0.15（当前 ${wn.toFixed(2)}）` : `风切换到 1.0（当前 ${wn.toFixed(2)}）`);
    await S.frames(1); await S.page.screenshot({path: path.join(dir, `f${String(k++).padStart(4, "0")}.png`), type: "png"});
  }
  await cap("");
  await ffmpeg(["-framerate", "15", "-i", path.join(dir, "f%04d.png"), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-r", "30", path.join(OUT, `${TAG}wind_0.15_to_1.0.mp4`)]);
  fs.rmSync(dir, {recursive: true, force: true}); console.log("wvid", k, "frames");
}

if (want("ver")) {
  await cap("");
  await E(() => { window.__set({weather: "sun", ct: "clear", wind: .3}); window.__desQA().sim(2); });
  await E(() => { document.body.classList.remove("col"); for (const s of ["#fab", "#sbtn", "#tp"]) { const n = document.querySelector(s); if (n) n.style.display = ""; } });
  await E(() => { const q = window.__desQA(); q.lookAt(-4.16, 11.13, 19.58, 0, 0, 0); q.step(1, 1 / 30); });
  await new Promise(r => setTimeout(r, 2500)); await E(() => { const v = document.getElementById("ver"); if (v) v.scrollIntoView({block: "center"}); }); await new Promise(r => setTimeout(r, 800)); await S.frames(4);
  const v = await E(() => { const v = document.getElementById("ver"), r = v && v.getBoundingClientRect(); return {text: v && v.textContent, bundle: window.CY && window.CY.desert, visible: !!r && r.width > 0 && r.bottom > 0 && r.top < innerHeight}; });
  const m = /desert\.(\w{6})/.exec(v.bundle || ""); v.match = !!m && v.text === "版本 " + m[1];
  console.log("ver", JSON.stringify(v)); if (!v.match || !v.visible) fails.push("version label does not match the bundle hash");
  await shot(path.join(OUT, `${TAG}panel_version.png`));
}

clearTimeout(killer);
await S.close();
if (fails.length) console.log("FAILS", fails);
process.exit(fails.length ? 1 : 0);
