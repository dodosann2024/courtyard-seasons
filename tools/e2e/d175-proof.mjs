// Desert d175 proofs, on any checkout (DIR, default this one; assets are committed, nothing is built). Not part of CI.
//   water    the oasis pond at eye level, 1.6 m above the sand (looking across it, and toward the sun), and close range (the waterline)
//   shore    the east beach waterline: a still at the moment the lapping water draws back, and a short clip of the trail drying
//   kneel    raised close-ups (0.5 m up, 1.3 m off) of the folded knees and chest pad of each camel lying down, and of the hollows left
//            once it has got up again
//   weather  short clips of the pond at 1.6 m eye level in rain, at dusk (toward the low sun) and frozen (dawn after a snowy night)
//   prints   the footprint check of desert.mjs ("ostriches, tortoises, gerbils, scorpions"), its own code read out of CHECK (a
//            desert.mjs file, default this checkout's), run RUNS times, each on a freshly loaded page; each run records printKinds and pass/fail
//   ver      the scene panel open, with its 「版本 xxxxxx」 label
//   pair     (no browser) OUT/main_<n>.png | OUT/new_<n>.png -> <n>_before_after.jpg; main_<n>.mp4 | new_<n>.mp4 -> <n>_before_after.mp4
// Usage: node tools/e2e/d175-proof.mjs <mode[,mode]>   (OUT=/tmp/d175/out DIR=<checkout> TAG=<prefix> RUNS=20 CHECK=<desert.mjs>)
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {openScene, ffmpeg, sleep} from "./d172-lib.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(process.env.DIR || path.join(HERE, "../.."));
const OUT = process.env.OUT || "/tmp/d175/out", TAG = process.env.TAG || "";
const WHICH = process.argv[2] || "water", want = k => WHICH.split(",").includes(k);
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

const S = await openScene(ROOT);
const {E, shot, cap} = S;
const fails = [], report = {bundle: S.bundle};
const killer = setTimeout(() => { console.log("TIMEOUT"); process.exit(3); }, +(process.env.LIMIT || 5400) * 1000);
const clip = async (name, n, every, fps) => {
  const dir = path.join(OUT, `${TAG}${name}_frames`); fs.rmSync(dir, {recursive: true, force: true}); fs.mkdirSync(dir, {recursive: true});
  for (let i = 0; i < n; i++) { await E(k => window.__desQA().step(k, 1 / 30), every); await S.frames(2); await S.page.screenshot({path: path.join(dir, `f${String(i).padStart(3, "0")}.png`)}); }
  await ffmpeg(["-framerate", String(fps), "-i", path.join(dir, "f%03d.png"), "-vf", "format=yuv420p", "-c:v", "libx264", "-crf", "24", "-preset", "slow", path.join(OUT, `${TAG}${name}.mp4`)]);
  console.log("clip", name);
  return dir;
};

/* helpers in the page: both camels lying at their rest spots (out of the pond views); views; put one camel on open sand */
await E(() => {
  const q = window.__desQA();
  window.__restAll = () => q.ANIM.camels.forEach((o, i) => { const R = q.REST[i]; Object.assign(o, {x: R.x, z: R.z, yaw: R.yaw, mode: "rest", job: "kneel", k: 1, timer: 1e9, spd: 0, yr: 0, path: null, gy: null, goal: R});
    for (const k in o.r.acts) o.r.acts[k].stop(); o.r.fd = null; o.r.cur = null; q.fn.play(o.r, "kneel_rest", .01, 1); });
  window.__sunDir = () => { const P = q.POND; let sc = q.W; while (sc.parent) sc = sc.parent; let L = null; sc.traverse(o => { if (o.isDirectionalLight && o.castShadow && !L) L = o; });
    const V = q.W.position.constructor, d = L.position.clone().normalize().applyAxisAngle(new V(0, 1, 0), -q.YAW), h = Math.hypot(d.x, d.z) || 1; return [d.x / h, d.z / h]; };
  window.__views = {
    /* standing on the east beach, eyes 1.6 m above the sand, looking west across the water */
    eye: () => { const P = q.POND, ex = P.x + P.rx * 1.12, ez = P.z + .6; return [ex, q.hTop(ex, ez) + 1.6, ez, P.x - 2, P.wy, P.z - .4, 55]; },
    /* standing on the beach across the pond from the sun, eyes 1.6 m above the sand, looking toward it */
    sun: () => { const P = q.POND, [ux, uz] = window.__sunDir(); const ex = P.x - ux * P.rx * 1.25, ez = P.z - uz * P.rz * 1.25; return [ex, q.hTop(ex, ez) + 1.6, ez, P.x + ux * P.rx * .6, P.wy, P.z + uz * P.rz * .6, 55]; },
    /* close range: 0.55 m above the shallows, looking down at the south-east waterline 1-2 m away */
    close: () => { const P = q.POND, th = .55, f = .8, ex = P.x + P.rx * f * Math.cos(th), ez = P.z + P.rz * f * Math.sin(th);
      return [ex, P.wy + .55, ez, P.x + P.rx * 1.0 * Math.cos(th + .3), P.wy - .1, P.z + P.rz * 1.0 * Math.sin(th + .3), 50]; },
    /* the east beach waterline from the sand: 0.6 m up, 1.1 m back from the water, looking along the bank's slope down to it */
    shore: () => { const P = q.POND, th = -.35, [wx, wz] = [P.x + P.rx * .93 * Math.cos(th) * (1 + .09 * Math.sin(2 * th + 1.1) + .06 * Math.sin(3 * th - .4) + .04 * Math.sin(5 * th + 2.3)), P.z + P.rz * .93 * Math.sin(th) * (1 + .09 * Math.sin(2 * th + 1.1) + .06 * Math.sin(3 * th - .4) + .04 * Math.sin(5 * th + 2.3))];
      const ox = Math.cos(th), oz = Math.sin(th) * P.rx / P.rz, ol = Math.hypot(ox, oz), ex = wx + ox / ol * 1.1 + oz / ol * .35, ez = wz + oz / ol * 1.1 - ox / ol * .35;
      return [ex, q.hTop(ex, ez) + .6, ez, wx - ox / ol * .15, P.wy, wz - oz / ol * .15, 50]; },
    /* the same waterline seen standing: eyes 1.6 m up, 2.6 m back */
    shoreEye: () => { const v = window.__views.shore(), dx = v[0] - v[3], dz = v[2] - v[5], l = Math.hypot(dx, dz), ex = v[3] + dx / l * 2.6, ez = v[5] + dz / l * 2.6; return [ex, q.hTop(ex, ez) + 1.6, ez, v[3], v[4], v[5], 50]; }};
  window.__look = (k, fov) => { const v = window.__views[k](), C = window.__C(); C.Ce.enabled = false; q.lookAt(v[0], v[1], v[2], v[3], v[4], v[5]); C.De.fov = fov || v[6]; C.De.near = .02; C.De.updateProjectionMatrix();
    return {cam: v.slice(0, 3).map(x => +x.toFixed(2)), eyeAboveSand: +(v[1] - q.hTop(v[0], v[2])).toFixed(2), eyeAboveWater: +(v[1] - q.POND.wy).toFixed(2)}; };
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

try {
  if (want("water")) {
    await E(() => { const q = window.__desQA(); window.__set({weather: "sun", ct: "clear", wind: .45}); q.tod("day"); q.sim(20); window.__restAll(); q.step(10, 1 / 30); });
    report.water = {};
    for (const k of ["eye", "sun", "close"]) {
      report.water[k] = await E(k => { const r = window.__look(k); window.__desQA().step(30, 1 / 30); return r; }, k);
      await sleep(400); await shot(path.join(OUT, `${TAG}water_${k}.png`));
    }
  }

  if (want("shore")) {
    await E(() => { const q = window.__desQA(); window.__set({weather: "sun", ct: "clear", wind: .45}); q.tod("day"); q.sim(20); window.__restAll(); q.step(10, 1 / 30); });
    report.shore = await E(() => window.__look("shore"));
    /* the still: step on until the water at this stretch of bank has just drawn back from its reach (the lap is falling fast) */
    report.shore.still = await E(() => { const q = window.__desQA(), P = q.POND, u = q.pondU, v = window.__views.shore(), th = Math.atan2(v[5] - P.z, v[3] - P.x),
      lap = t => Math.sin(t * 1.15 + th * 9.) * .6 + Math.sin(t * .67 + th * 4. + 1.3) * .4;
      for (let i = 0; i < 30 * 12; i++) { const t = u.uT.value; if (lap(t - 1.2) > .75 && lap(t) < -.2) break; q.step(1, 1 / 30); }
      return {t: +u.uT.value.toFixed(2), wind: +u.uWind.value.toFixed(2)}; });
    await shot(path.join(OUT, `${TAG}shore_close.png`));
    await E(() => window.__look("shoreEye")); await shot(path.join(OUT, `${TAG}shore_eye.png`));
    if (!process.env.NOCLIP) { await E(() => window.__look("shore")); await clip("shore_clip", 75, 2, 15); }
  }

  if (want("kneel")) {
    report.kneel = {};
    /* 0.5 m above the sand, 1.3 m out to the knee side and a little ahead, aimed at the near knee pad */
    const view = (ci, side) => E((ci, side) => { const q = window.__desQA(), C = window.__C(), a = q.ANIM.camels[ci], s = Math.sin(a.yaw), c = Math.cos(a.yaw), sg = side === "L" ? 1 : -1;
      const ct = a.ct.c, pads = a.ct.pdI.filter(j => j > 0).map(j => ct[j]), p = pads.reduce((b, o) => (o.X - a.x) * c * sg - (o.Z - a.z) * s * sg > (b.X - a.x) * c * sg - (b.Z - a.z) * s * sg ? o : b, pads[0]);
      const px = p.X + c * 1.3 * sg + s * .55, pz = p.Z - s * 1.3 * sg + c * .55;
      C.Ce.enabled = false; q.lookAt(px, q.hTop(px, pz) + .5, pz, p.X - s * .05, q.hTop(p.X, p.Z), p.Z - c * .05); C.De.fov = 42; C.De.near = .02; C.De.updateProjectionMatrix(); q.step(1, 1 / 600);
      return {pad: [+p.X.toFixed(2), +p.Z.toFixed(2)], chest: [+ct[4].X.toFixed(2), +ct[4].Z.toFixed(2)]}; }, ci, side);
    for (const [ci, nm, zh] of [[0, "drom", "单峰驼"], [1, "bact", "双峰驼"]]) {
      await E(ci => { const q = window.__desQA(); window.__set({weather: "sun", ct: "clear", wind: .1}); q.tod("day"); const a = window.__put(ci, 4, -9, .9); window.__clear(4, -9, 9); q.step(20, 1 / 30);
        Object.assign(a, {mode: "turn", job: "kneel", face: a.yaw, spd: 0, yr: 0});
        for (let i = 0; i < 30 * 40 && a.mode !== "rest"; i++) q.step(1, 1 / 30); a.timer = 1e9; q.step(60, 1 / 30); }, ci);
      report.kneel[nm + "_rest"] = await view(ci, "L");
      await cap(`${zh} 卧着：折起的前膝（腕垫）和胸垫压进沙里，镜头离沙 0.5 米、离膝 1.3 米`); await shot(path.join(OUT, `${TAG}kneel_${nm}_rest.png`));
      /* it gets up and steps off: the hollows stay; the camera stays where it was */
      await E(ci => { const q = window.__desQA(), a = q.ANIM.camels[ci]; a.timer = -1; for (let i = 0; i < 30 * 12 && a.mode !== "job"; i++) q.step(1, 1 / 30);
        a.mode = "job"; a.job = "idle"; a.timer = 1e9; const s = Math.sin(a.yaw), c = Math.cos(a.yaw); a.x -= s * 2.6; a.z -= c * 2.6; a.gy = null; for (const f of a.feet) f.p = null; q.step(10, 1 / 30); }, ci);
      await cap(`${zh} 起身走开后：留在沙上的膝窝和胸窝（压下的坑、推起的沙边）`); await shot(path.join(OUT, `${TAG}kneel_${nm}_left.png`));
      console.log("kneel", nm, JSON.stringify(report.kneel[nm + "_rest"]));
    }
    await cap("");
  }

  if (want("weather")) {
    report.weather = {};
    const W = [
      ["rain", "下雨", () => { const q = window.__desQA(); window.__set({weather: "rain", ct: "overcast", wind: .45}); q.tod("day"); q.sim(60, .25); window.__restAll(); q.step(10, 1 / 30); return window.__look("eye"); }],
      ["dusk", "黄昏（朝着低太阳）", () => { const q = window.__desQA(); window.__set({weather: "sun", ct: "clear", wind: .45}); q.tod("sunset"); q.sim(60, .25); window.__restAll(); q.step(10, 1 / 30); return window.__look("sun"); }],
      ["frozen", "结冰（下雪的夜后清晨）", () => { const q = window.__desQA(); window.__set({weather: "snow", snowLv: 2, ct: "overcast", wind: .4}); q.tod("night"); q.sim(400, .5);
        q.tod("sunrise"); q.sim(40, .5); window.__set({weather: "sun", ct: "clear", wind: .35}); q.sim(4, .25); window.__restAll(); q.step(10, 1 / 30); const r = window.__look("close", 62); r.ice = +q.WX.ice.toFixed(3); r.snow = +q.WX.sc.toFixed(3); return r; }]];
    for (const [n, zh, f] of W) {
      report.weather[n] = await E(`(${f})()`);
      await cap(`${zh}，眼高 ${report.weather[n].eyeAboveSand} 米`); await clip(`weather_${n}`, 60, 2, 15);
      await shot(path.join(OUT, `${TAG}weather_${n}.png`));
      console.log("weather", n, JSON.stringify(report.weather[n]));
    }
    await cap("");
    await E(() => { const q = window.__desQA(); window.__set({weather: "sun", ct: "clear", wind: .4}); q.tod("day"); q.sim(900, 1); });
  }

  if (want("prints")) {
    /* the check's own code, read out of desert.mjs, so the runs are the CI check itself */
    const src = fs.readFileSync(process.env.CHECK || path.join(ROOT, "tools/e2e/desert.mjs"), "utf8");
    const a = src.indexOf('check("ostriches, tortoises, gerbils, scorpions", ...await page.evaluate(');
    const b = src.indexOf("  }));", a);
    const body = src.slice(src.indexOf("page.evaluate(", a) + "page.evaluate(".length, b + 3);
    const RUNS = +(process.env.RUNS || 20);
    report.prints = {check: path.relative(ROOT, process.env.CHECK || path.join(ROOT, "tools/e2e/desert.mjs")), runs: []};
    /* every run on a freshly loaded scene, as in CI, where the check runs once per page */
    for (let i = 0; i < RUNS; i++) {
      const t0 = Date.now(), P = i ? await openScene(ROOT) : S;
      await P.E(() => { const q = window.__desQA(); q.tod("day"); window.__set({weather: "sun", ct: "clear", wind: .8}); q.sim(20); });
      const [ok, r] = await P.E(`(${body})()`);
      if (P !== S) await P.close();
      const row = {run: i + 1, pass: ok, printKinds: r.printKinds, tortoise: r.printKinds.includes(6), ttWalk: r.ttWalk ?? null, sec: Math.round((Date.now() - t0) / 1000)};
      if (!ok) row.detail = r;
      report.prints.runs.push(row); console.log("prints", JSON.stringify(row));
      fs.writeFileSync(path.join(OUT, `${TAG}footprint_stability.json`), JSON.stringify({bundle: report.bundle, ...report.prints,
        summary: {runs: report.prints.runs.length, failures: report.prints.runs.filter(x => !x.pass).length, tortoiseMissing: report.prints.runs.filter(x => !x.tortoise).length}}, null, 1));
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
} catch (e) { console.log("ERR", e.stack || e); fails.push(String(e)); }
report.fails = fails;
fs.writeFileSync(path.join(OUT, `${TAG}d175-report-${WHICH.replace(/,/g, "+")}.json`), JSON.stringify(report, null, 1));
clearTimeout(killer); await S.close();
process.exit(fails.length ? 1 : 0);
