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
const TRAILH = {dromedary: 7, bactrian: 7, ostrich: 5, tortoise: 1.1, gerbil: 1.3, scorpion: .8, eagle: 1.6};
async function course(sp, setup, stepFn, sec, dt) {
  if (process.env.ONLY && !process.env.ONLY.split(",").includes(sp)) return {contacts: [], prints: [], matched: []};
  const r = await course0(sp, setup, stepFn, sec, dt);
  if (process.env.SHOTS && r.prints.length) {
    /* top-down over the densest stretch of this species' trail */
    const P = r.prints, c = P.reduce((b, p) => { const n = P.filter(o => Math.hypot(o.x - p.x, o.z - p.z) < TRAILH[sp] * .35).length; return n > b.n ? {n, p} : b; }, {n: -1}).p;
    await E((x, z, h) => { const q = window.__desQA(); q.PA.noView = 1; const y = q.hTop(x, z); q.lookAt(x, y + h, z + .001, x, y, z); q.step(1, 1 / 30); }, c.x, c.z, TRAILH[sp]);
    await cap(`${sp === "dromedary" ? "单峰驼" : sp === "bactrian" ? "双峰驼" : sp === "ostrich" ? "鸵鸟" : sp === "tortoise" ? "陆龟" : sp === "gerbil" ? "沙鼠" : sp === "scorpion" ? "蝎子" : "金雕"}足迹（俯视）`);
    await shot(path.join(OUT, `${TAG}trail_${sp}.png`)); await cap("");
  }
  return r;
}
async function course0(sp, setup, stepFn, sec, dt) {
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

/* ---------------- graze / drink close-ups ---------------- */
if (want("gshots")) {
  for (const job of ["graze", "drink"]) {
    const res = await E(job => { const q = window.__desQA(), D = window.__d172, a = q.ANIM.camels[0], o = q.ANIM.camels[1]; q.tod("day"); q.PA.noView = 1;
      Object.assign(o, {x: 14.2, z: 2.6, mode: "rest", job: "kneel", k: 1, timer: 1e9, path: null, goal: null});
      /* the branch plans from a tuft / the water (grazeSpot, drinkSpot); main's own stands: the pond ring, and 1 m outside the east beach */
      let sp; if (job === "graze") sp = q.grazeSpot ? q.grazeSpot(a) : (() => { const [x, z] = q.pondEdge(.9, 1.45); return {x, z, yaw: Math.atan2(q.POND.x - x, q.POND.z - z) + .6}; })();
      else sp = q.drinkSpot ? q.drinkSpot(a) : (() => { const th = .05, [x, z] = q.pondEdge(th, 1), nx = Math.cos(th), nz = Math.sin(th); return {x: x + nx, z: z + nz, yaw: Math.atan2(-nx, -nz)}; })();
      const yaw = sp.yaw, sx = sp.x - Math.sin(yaw) * 5, sz = sp.z - Math.cos(yaw) * 5;
      Object.assign(a, {x: sx, z: sz, yaw, k: 0, spd: 0, yr: 0, path: null, gy: null, mode: "job", job: "idle", timer: 1e9, face: null});
      for (const k in a.r.acts) a.r.acts[k].stop(); a.r.fd = null; a.r.cur = null; q.fn.play(a.r, "idle", .01, 1); q.step(5, 1 / 30);
      q.fn.camelGo(a, sp, job); let lo = null;
      for (let i = 0; i < 1800; i++) { q.step(1, 1 / 30); if (a.mode === "job" && a.job === job) { a.timer = 1e9; const w = a.r.acts.drink.getEffectiveWeight(); if (w > .9) { const m = D.mouth(a); if (!lo || m.y < lo.y) lo = m; else if (lo && m.y > lo.y + .03) break; } } }
      if (!lo) return null; const T = D.tufts(); let dT = 1e9; for (const p of T) dT = Math.min(dT, Math.hypot(p.x - lo.x, p.z - lo.z));
      const c = Math.cos(a.yaw), n = Math.sin(a.yaw); q.lookAt(lo.x + c * 2.3 - n * .6, lo.y + .55, lo.z - n * 2.3 - c * .6, lo.x, lo.y + .12, lo.z); q.step(1, 1 / 30);
      return {dT: +dT.toFixed(2), dW: +(lo.y - q.POND.wy).toFixed(2), over: q.pN(lo.x, lo.z) < 1}; }, job);
    if (!res) { console.log("gshot", job, "no event"); continue; }
    await cap(job === "graze" ? `骆驼吃草：嘴到最近草丛 ${res.dT} m` : `骆驼喝水：嘴${res.over ? "在水面上方" : "在沙地上方（不在水上）"}，距水面高度 ${res.dW} m`);
    await shot(path.join(OUT, `${TAG}${job}_closeup.png`)); await cap(""); console.log("gshot", job, JSON.stringify(res));
  }
}
/* ---------------- a camel walking, its prints appearing under the hooves ---------------- */
if (want("camvid")) {
  const dir = path.join(OUT, `${TAG}camfr`); fs.rmSync(dir, {recursive: true, force: true}); fs.mkdirSync(dir);
  await E(() => { const q = window.__desQA(); q.tod("day"); window.__set({wind: .15}); window.__park(9, -9, 10, [q.ANIM.camels[0]]); window.__camel(0, 3, -10, Math.PI / 2); q.step(30, 1 / 30); q.fn.camelGo(q.ANIM.camels[0], {x: 13, z: -10}, "idle"); });
  await cap("单峰驼行走：脚印在蹄子落地处出现");
  for (let i = 0; i < 300; i++) {
    await E(() => { const q = window.__desQA(), a = q.ANIM.camels[0]; q.step(1, 1 / 30); const c = Math.cos(a.yaw), n = Math.sin(a.yaw); q.lookAt(a.x - c * 4.2 - n * 1.2, a.gy + 1.1, a.z + n * 4.2 - c * 1.2, a.x + n * .5, a.gy + .25, a.z + c * .5); });
    await S.frames(1); await S.page.screenshot({path: path.join(dir, `f${String(i).padStart(4, "0")}.png`), type: "png"});
  }
  await cap("");
  await ffmpeg(["-framerate", "30", "-i", path.join(dir, "f%04d.png"), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "22", path.join(OUT, `${TAG}camel_walk_prints.mp4`)]);
  fs.rmSync(dir, {recursive: true, force: true}); console.log("camvid done");
}
if (want("ver")) {
  await cap("");
  await E(() => { window.__set({weather: "sun", ct: "clear", wind: .3}); window.__desQA().sim(2); });
  await E(() => { document.body.classList.remove("col"); for (const s of ["#fab", "#sbtn", "#tp"]) { const n = document.querySelector(s); if (n) n.style.display = ""; } });
  await E(() => { const q = window.__desQA(); q.lookAt(-4.16, 11.13, 19.58, 0, 0, 0); q.step(1, 1 / 30); });
  await sleep(2500); await E(() => { const v = document.getElementById("ver"); if (v) v.scrollIntoView({block: "center"}); }); await sleep(800); await S.frames(4);
  report.ver = await E(() => { const v = document.getElementById("ver"), r = v && v.getBoundingClientRect(); return {text: v && v.textContent, bundle: window.CY && window.CY.desert, visible: !!r && r.width > 0 && r.bottom > 0 && r.top < innerHeight}; });
  const m = /desert\.(\w{6})/.exec(report.ver.bundle || "");
  report.ver.match = !!m && report.ver.text === "版本 " + m[1];
  console.log("ver", JSON.stringify(report.ver));
  if (!report.ver.match || !report.ver.visible) fails.push("version label does not match the bundle hash");
  await shot(path.join(OUT, `${TAG}panel_version.png`));
}

/* ---------------- grass stills and wind ---------------- */
const grassSpot = () => E(() => { const q = window.__desQA(), D = window.__d172, T = D.tufts().filter(p => q.pN(p.x, p.z) > 1.08 && q.pN(p.x, p.z) < 1.6);
  let best = null, bn = -1; for (const p of T) { const n = T.filter(o => Math.hypot(o.x - p.x, o.z - p.z) < 1.4).length; if (n > bn) { bn = n; best = p; } }
  const ox = best.x - q.POND.x, oz = best.z - q.POND.z, d = Math.hypot(ox, oz); return {x: best.x, z: best.z, ux: ox / d, uz: oz / d, y: q.hTop(best.x, best.z)}; });
const grassView = (g, eh, back) => E((g, eh, back) => { const q = window.__desQA(), side = .45;
  const ex = g.x + g.ux * back - g.uz * side * back, ez = g.z + g.uz * back + g.ux * side * back; q.lookAt(ex, g.y + eh, ez, g.x, g.y + Math.min(.25, eh * .3), g.z); }, g, eh, back);
if (want("grass")) {
  const g = await grassSpot();
  await E(() => { const q = window.__desQA(); window.__set({wind: .4}); q.tod("day"); q.PA.noView = 1; q.step(90, 1 / 30); });
  for (const [eh, back, n] of [[1.6, 3.2, "grass_1.6m"], [.5, 1.3, "grass_0.5m"]]) { await grassView(g, eh, back); await E(() => window.__desQA().step(2, 1 / 30)); await shot(path.join(OUT, `${TAG}${n}.png`)); }
}
if (want("wind")) {
  const g = await grassSpot(), dir = path.join(OUT, `${TAG}windfr`); fs.rmSync(dir, {recursive: true, force: true}); fs.mkdirSync(dir);
  let k = 0;
  for (const [w, lab] of [[.05, "微风（wind 0.05）"], [1, "强风（wind 1.0）"]]) {
    await E(w => { const q = window.__desQA(); window.__set({wind: w}); q.step(150, 1 / 30); }, w);
    await grassView(g, .7, 1.8); await S.cap(lab);
    for (let i = 0; i < 120; i++) { await E(() => window.__desQA().step(1, 1 / 30)); await S.frames(1); await S.page.screenshot({path: path.join(dir, `f${String(k++).padStart(4, "0")}.png`), type: "png"}); }
  }
  await S.cap("");
  await ffmpeg(["-framerate", "30", "-i", path.join(dir, "f%04d.png"), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "22", path.join(OUT, `${TAG}wind_low_vs_strong.mp4`)]);
  console.log("wind video", k, "frames");
}

/* ---------------- graze / drink placement ---------------- */
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
  const ev = await E(() => { for (const id in window.__gz.cur) { /* open events are left out: they have not reached their lowest yet */ } return window.__gz.ev; });
  const per = {};
  for (const e of ev) { const k = e.sp + ":" + e.kind, P = per[k] || (per[k] = {events: 0, valid: 0, mouthToTuftM: [], mouthToWaterYM: []}); P.events++; if (e.valid) P.valid++;
    P.mouthToTuftM.push(e.mouthToTuftM); P.mouthToWaterYM.push(e.mouthToWaterYM); }
  for (const k in per) { const P = per[k], st = a => { const s = [...a].sort((x, y) => x - y); return {min: s[0], p50: s[s.length >> 1], max: s[s.length - 1]}; };
    P.validPct = +(100 * P.valid / P.events).toFixed(1); P.mouthToTuftM = st(P.mouthToTuftM); P.mouthToWaterYM = st(P.mouthToWaterYM); }
  report.graze = {simMinutes: MIN, rule: "graze/nibble/peck valid when the lowest point of the head at the deepest reach is within 0.3 m (horizontal) of a live grass/tuft/reed instance; drink valid when it is over the water (pN<1) and within 5 cm of the water height",
    ostrichNote: "ostrich frozen (ostrich_v2ag): its pecks are reported, not changed", perKind: per, events: ev};
  fs.writeFileSync(path.join(OUT, `${TAG}graze.json`), JSON.stringify(report.graze, null, 1));
  for (const k in per) console.log("graze", k, per[k].events, "valid", per[k].validPct + "%", "tuft", JSON.stringify(per[k].mouthToTuftM), "waterY", JSON.stringify(per[k].mouthToWaterYM));
}

report.fails = fails;
fs.writeFileSync(path.join(OUT, `${TAG}d172-report-${WHICH.replace(/,/g, "+")}.json`), JSON.stringify(report, null, 1));
clearTimeout(killer);
await S.close();
process.exit(fails.length ? 1 : 0);
