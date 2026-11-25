// Desert d174 proofs, on any checkout (DIR, default this one; assets are committed, nothing is built). Not part of CI.
//   kneegap  carpal-pad gap to the sand over full kneel -> lie -> stand cycles (three places each) for both camels -> OUT/<TAG>knee_gap.json
//            The pad is measured on the skinned mesh itself, independent of the scene's contacts: every vertex weighted to the
//            forearm and cannon within 0.3 cannon lengths of the carpus (bind pose), skinned on the CPU, lowest minus hTop under it.
//            A pad counts as folded (resting on its knee) while the carpus is bent past 145 degrees. >0 = in the air, <0 = sunk.
//   kneel    ground-level side close-ups of the folded fore knees at kneel mid-phase (kneel -> lie and lie -> stand)
//   water    the oasis pond at eye level (1.6 m, looking across it and looking toward the sun) and close range (the waterline), sun and breeze
//            (the sky ocean reference shots from the same heights come from d174-ocean.mjs)
//   crunch   the snow-crunch check of desert.mjs, repeated from different camel states (both kneeling, lying, getting up, at a job)
//   ver      the scene panel open, with its 「版本 xxxxxx」 label
//   pair     (no browser) OUT/main_<n>.png | OUT/new_<n>.png -> <n>_before_after.jpg; ocean + before + after -> compare_<n>.jpg
// Usage: node tools/e2e/d174-proof.mjs <mode[,mode]>   (OUT=/tmp/d174/out DIR=<checkout> TAG=<prefix>)
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {openScene, ffmpeg, sleep} from "./d172-lib.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(process.env.DIR || path.join(HERE, "../.."));
const OUT = process.env.OUT || "/tmp/d174/out", TAG = process.env.TAG || "";
const WHICH = process.argv[2] || "kneegap", want = k => WHICH.split(",").includes(k);
fs.mkdirSync(OUT, {recursive: true});
const FONT = "/usr/share/fonts/truetype/wqy/wqy-microhei.ttc";
const lab = t => `drawtext=fontfile=${FONT}:text='${t}':x=14:y=12:fontsize=26:fontcolor=white:borderw=2:bordercolor=black`;

if (WHICH === "pair") {
  const MAINJS = process.env.MAINJS || "desert.b609b040bf.js", NEWJS = process.env.NEWJS || "本分支";
  const cols = [["main", `修改前（main，${MAINJS}）`], ["new", `修改后（本分支，${NEWJS}）`]];
  for (const f of fs.readdirSync(OUT).filter(f => f.startsWith("new_") && f.endsWith(".png"))) {
    const n = f.slice(4, -4), ins = cols.map(([k]) => path.join(OUT, `${k}_${n}.png`));
    if (!ins.every(p => fs.existsSync(p))) continue;
    const fc = cols.map(([, t], i) => `[${i}:v]scale=960:-2,${lab(t)}[c${i}]`).join(";") + ";[c0][c1]hstack=inputs=2";
    await ffmpeg([...ins.flatMap(p => ["-i", p]), "-filter_complex", fc, "-q:v", "3", path.join(OUT, `${n}_before_after.jpg`)]);
    console.log("pair", n);
  }
  /* ocean | desert before | desert after, one row per view */
  for (const v of ["eye", "sun", "close"]) {
    const ins = [`ocean_${v === "close" ? "close" : "eye"}.png`, `main_water_${v}.png`, `new_water_${v}.png`].map(f => path.join(OUT, f));
    if (!ins.every(p => fs.existsSync(p))) continue;
    const T = ["空中海洋（同一仓库）", `沙漠绿洲修改前（${MAINJS}）`, `沙漠绿洲修改后（${NEWJS}）`];
    const fc = T.map((t, i) => `[${i}:v]scale=640:-2,${lab(t)}[c${i}]`).join(";") + ";[c0][c1][c2]hstack=inputs=3";
    await ffmpeg([...ins.flatMap(p => ["-i", p]), "-filter_complex", fc, "-q:v", "3", path.join(OUT, `compare_${v}.jpg`)]);
    console.log("compare", v);
  }
  process.exit(0);
}

const S = await openScene(ROOT);
const {E, shot, cap} = S;
const fails = [], report = {bundle: S.bundle};
const killer = setTimeout(() => { console.log("TIMEOUT"); process.exit(3); }, +(process.env.LIMIT || 3600) * 1000);

/* the carpal-pad probe and a deterministic way to put a camel somewhere (the other one lies at its rest spot) */
await E(() => {
  const q = window.__desQA(), V = q.W.position.constructor, v = new V(), u = new V(), w = new V();
  const prep = a => {
    if (a._kp) return a._kp;
    let body; a.mdl.traverse(o => { if (o.isSkinnedMesh && o.name === "Camel" && !body) body = o; });
    const sk = body.skeleton, g = body.geometry, si = g.attributes.skinIndex, sw = g.attributes.skinWeight, n = g.attributes.position.count;
    const jp = b => new V().setFromMatrixPosition(sk.boneInverses[sk.bones.indexOf(b)].clone().invert());
    const pads = a.feet.filter(f => !f.hind).map(f => {
      const L2 = f.b.parent, L1 = L2.parent, ids = new Set([sk.bones.indexOf(L1), sk.bones.indexOf(L2)]), J = jp(L2), rad = .3 * J.distanceTo(jp(f.b)), vs = [];
      for (let i = 0; i < n; i++) { let ww = 0; for (let k = 0; k < 4; k++) if (ids.has(si.getComponent(i, k))) ww += sw.getComponent(i, k);
        if (ww >= .5 && v.fromBufferAttribute(g.attributes.position, i).applyMatrix4(body.bindMatrix).distanceTo(J) < rad) vs.push(i); }
      return {f, L1, L2, vs, side: f.R ? "R" : "L"};
    });
    return a._kp = {body, pads};
  };
  window.__pad = a => { const P = prep(a); a.g.updateMatrixWorld(true);
    return P.pads.map(F => { let lo = 1e9, x = 0, y = 0, z = 0;
      for (const i of F.vs) { P.body.getVertexPosition(i, v); v.applyMatrix4(P.body.matrixWorld); q.W.worldToLocal(v); const d = v.y - q.hTop(v.x, v.z); if (d < lo) { lo = d; x = v.x; y = v.y; z = v.z; } }
      F.L1.getWorldPosition(u); F.L2.getWorldPosition(v); const d1 = v.clone().sub(u).normalize(); F.f.b.getWorldPosition(w); const d2 = w.clone().sub(v).normalize();
      return {side: F.side, g: lo, x, y, z, fold: Math.acos(Math.max(-1, Math.min(1, d1.dot(d2)))) * 180 / Math.PI, n: F.vs.length}; }); };
  window.__clear = (cx, cz, r) => {
    const far = []; for (let x = -40; x <= 40; x += 2) for (let z = -40; z <= 40; z += 2) if (q.sN(x, z) < .8 && Math.hypot(x - cx, z - cz) > r && Math.hypot(x - q.TENT.x, z - q.TENT.z) > 8) far.push({x, z});
    q.PA.os.forEach((o, i) => { const p = far[(i * 37 + 5) % far.length]; q.osPlace(o, p.x, p.z, 0); o.mode = "graze"; o.t = 999; o.path = null; });
    q.PA.tt.forEach((o, i) => { const p = far[(i * 53 + 11) % far.length]; q.torPlace(o, p.x, p.z, 0); o.mode = "stand"; o.t = 999; });
  };
  window.__put = (ci, x, z, yaw, clip) => {
    const a = q.ANIM.camels[ci], o = q.ANIM.camels[1 - ci], R = q.REST[1 - ci];
    Object.assign(o, {x: R.x, z: R.z, yaw: R.yaw, mode: "rest", job: "kneel", k: 1, timer: 1e9, spd: 0, yr: 0, path: null, gy: null, goal: R});
    for (const k in o.r.acts) o.r.acts[k].stop(); o.r.fd = null; o.r.cur = null; q.fn.play(o.r, "kneel_rest", .01, 1);
    Object.assign(a, {x, z, yaw, k: 0, spd: 0, yr: 0, path: null, pi: 0, gy: null, mode: "job", job: "idle", timer: 1e9, face: null, stuck: 0});
    for (const k in a.r.acts) a.r.acts[k].stop(); a.r.fd = null; a.r.cur = null; q.fn.play(a.r, clip || "idle", .01, 1);
    for (const c of q.ANIM.camels) for (const f of c.feet) f.p = null;
    return a;
  };
  /* kneel where it stands; step until mode/k satisfy stop() */
  window.__kneelTo = (a, stop) => { Object.assign(a, {mode: "turn", job: "kneel", face: a.yaw, spd: 0, yr: 0});
    for (let i = 0; i < 30 * 40 && !stop(a); i++) { if (a.mode === "rest" && a.timer > 2) a.timer = 2; q.step(1, 1 / 30); } };
});

try {
  if (want("kneegap")) {
    report.kneeGap = await E(() => {
      const q = window.__desQA(), DT = 1 / 30, cm = x => +(x * 100).toFixed(1);
      const pct = (a, p) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(p * (s.length - 1)))] : null; };
      const stats = a => a.length ? {frames: a.length, max: cm(Math.max(...a)), min: cm(Math.min(...a)), p95: cm(pct(a, .95)), p50: cm(pct(a, .5))} : {frames: 0};
      /* flat open sand, the dune's west slope, and the camel's own rest spot */
      const spots = ci => [[4, -9, .9], [9.4, -11.6, .55], [q.REST[ci].x, q.REST[ci].z, q.REST[ci].yaw]];
      const out = {};
      for (const ci of [0, 1]) {
        const rows = [], cyc = [];
        spots(ci).forEach(([x, z, yaw], si) => {
          const a = window.__put(ci, x, z, yaw); window.__clear(x, z, 9); q.step(20, DT);
          Object.assign(a, {mode: "turn", job: "kneel", face: a.yaw, spd: 0, yr: 0});
          let restN = 0, n0 = rows.length;
          for (let i = 0; i < 30 * 40; i++) {
            if (a.mode === "rest" && ++restN > 90) a.timer = -1;
            q.step(1, DT);
            if (a.mode === "down" || a.mode === "rest" || a.mode === "up") rows.push({spot: si, m: a.mode, k: a.k, P: window.__pad(a)});
            else if (rows.length > n0) break;
          }
          cyc.push({spot: ["flat", "dune slope", "rest spot"][si], at: [+x.toFixed(2), +z.toFixed(2)], frames: rows.length - n0, complete: ["down", "rest", "up"].every(m => rows.slice(n0).some(r => r.m === m)) && !["down", "rest", "up"].includes(a.mode), after: a.mode});
        });
        const folded = (r, s) => r.P[s].fold >= 145, R = {cycles: cyc, padVertices: rows[0].P.map(p => p.n)};
        R.folded = {}; R.unfolded = {};
        for (const s of [0, 1]) { const nm = rows[0].P[s].side === "L" ? "前左膝" : "前右膝";
          R.folded[nm] = {all: stats(rows.filter(r => folded(r, s)).map(r => r.P[s].g))};
          for (const ph of ["down", "rest", "up"]) R.folded[nm][ph] = stats(rows.filter(r => r.m === ph && folded(r, s)).map(r => r.P[s].g));
          R.unfolded[nm] = stats(rows.filter(r => !folded(r, s)).map(r => r.P[s].g)); }
        const F = rows.flatMap(r => r.P.filter((p, s) => folded(r, s)).map(p => p.g));
        R.summary = {foldedPadFrames: F.length, maxGap: cm(Math.max(...F)), maxSink: cm(Math.min(...F)), framesAbove0: F.filter(g => g > 0).length,
          framesBelowMinus2cm: F.filter(g => g < -.02).length,
          midPhase: (() => { const M = rows.filter(r => (r.m === "down" || r.m === "up") && r.k > .3 && r.k < .95).flatMap(r => r.P.filter((p, s) => folded(r, s)).map(p => p.g));
            return {frames: M.length, maxGap: cm(Math.max(...M)), maxSink: cm(Math.min(...M))}; })()};
        out[ci ? "bactrian" : "dromedary"] = R;
      }
      return out;
    });
    fs.writeFileSync(path.join(OUT, `${TAG}knee_gap.json`), JSON.stringify({bundle: report.bundle, units: "cm; carpal pad lowest skinned vertex minus hTop; >0 in the air, <0 sunk; folded = carpus bent past 145 degrees", ...report.kneeGap}, null, 1));
    console.log("kneegap", JSON.stringify(Object.fromEntries(Object.entries(report.kneeGap).map(([k, v]) => [k, v.summary]))));
  }

  if (want("kneel")) {
    /* ground-level camera on the knee side: 1.5 m out from the pad, 0.12 m above the sand, aimed at the pad */
    const close = (ci, side) => E((ci, side) => { const q = window.__desQA(), C = window.__C(), a = q.ANIM.camels[ci], P = window.__pad(a), p = P.find(o => o.side === side) || P[0];
      const s = Math.sin(a.yaw), c = Math.cos(a.yaw), sg = side === "L" ? 1 : -1, px = p.x + c * 1.5 * sg + s * .35, pz = p.z - s * 1.5 * sg + c * .35;
      C.Ce.enabled = false; q.lookAt(px, q.hTop(px, pz) + .12, pz, p.x, q.hTop(p.x, p.z) + .05, p.z); C.De.fov = 30; C.De.near = .02; C.De.updateProjectionMatrix(); q.step(1, 1 / 600);
      return P.map(o => ({side: o.side, gap: +(o.g * 100).toFixed(1), fold: Math.round(o.fold)})); }, ci, side);
    const fmt = P => P.map(o => `${o.side === "L" ? "左" : "右"}膝 ${o.gap} 厘米`).join("，");
    const shots = [
      {n: "kneel_drom_down", ci: 0, side: "L", stop: "down", k: .61, t: "单峰驼 跪→卧 中段（k=0.61）"},
      {n: "kneel_drom_up", ci: 0, side: "R", stop: "up", k: .86, t: "单峰驼 卧→站 中段（k=0.86）"},
      {n: "kneel_bact_rest", ci: 1, side: "R", stop: "rest", k: 1, t: "双峰驼 卧着（前膝着沙）"},
      {n: "kneel_bact_up", ci: 1, side: "R", stop: "up", k: .86, t: "双峰驼 卧→站 中段（k=0.86）"},
      {n: "kneel_drom_slope_rest", ci: 0, side: "R", stop: "rest", k: 1, at: [9.4, -11.6, .55], t: "单峰驼 沙丘坡上卧着"},
      {n: "kneel_bact_slope_down", ci: 1, side: "R", stop: "down", k: .61, at: [9.4, -11.6, .55], t: "双峰驼 沙丘坡上 跪→卧 中段（k=0.61）"}];
    report.kneel = {};
    for (const s of shots) {
      await E((s) => { const q = window.__desQA(), [x, z, yaw] = s.at || [4, -9, .9], a = window.__put(s.ci, x, z, yaw); window.__clear(x, z, 9); q.step(20, 1 / 30);
        if (s.stop === "down") window.__kneelTo(a, a => a.mode === "down" && a.k >= s.k);
        else if (s.stop === "rest") { window.__kneelTo(a, a => a.mode === "rest"); a.timer = 1e9; q.step(45, 1 / 30); }
        else { window.__kneelTo(a, a => a.mode === "rest"); a.timer = -1; q.step(1, 1 / 30); for (let i = 0; i < 400 && !(a.mode === "up" && a.k <= s.k); i++) q.step(1, 1 / 30); }
        a.timer = 1e9; }, s);
      const P = await close(s.ci, s.side); report.kneel[s.n] = P;
      await cap(`${s.t}，镜头离沙 0.12 米、离膝 1.5 米；腕垫离沙：${fmt(P)}`); await shot(path.join(OUT, `${TAG}${s.n}.png`));
      console.log(s.n, JSON.stringify(P));
    }
    await cap("");
  }

  if (want("water")) {
    await E(() => { const q = window.__desQA(); window.__set({weather: "sun", ct: "clear", wind: .45}); q.tod("day"); q.sim(20);
      /* both camels lying at their rest spots, so neither wanders into the pond shots */
      q.ANIM.camels.forEach((o, i) => { const R = q.REST[i]; Object.assign(o, {x: R.x, z: R.z, yaw: R.yaw, mode: "rest", job: "kneel", k: 1, timer: 1e9, spd: 0, yr: 0, path: null, gy: null, goal: R});
        for (const k in o.r.acts) o.r.acts[k].stop(); o.r.fd = null; o.r.cur = null; q.fn.play(o.r, "kneel_rest", .01, 1); }); q.step(10, 1 / 30); });
    const views = {
      /* standing on the east beach, eyes 1.6 m above the sand, looking west across the water */
      eye: () => { const q = window.__desQA(), P = q.POND, ex = P.x + P.rx * 1.12, ez = P.z + .6; return [ex, q.hTop(ex, ez) + 1.6, ez, P.x - 2, P.wy, P.z - .4, 55]; },
      /* standing on the beach across the pond from the sun, eyes 1.6 m above the sand, looking toward it: the sun's highlight on the water */
      sun: () => { const q = window.__desQA(), P = q.POND; let sc = q.W; while (sc.parent) sc = sc.parent; let L = null; sc.traverse(o => { if (o.isDirectionalLight && o.castShadow && !L) L = o; });
        const V = q.W.position.constructor, d = L.position.clone().normalize().applyAxisAngle(new V(0, 1, 0), -q.YAW), h = Math.hypot(d.x, d.z) || 1, ux = d.x / h, uz = d.z / h;
        let ex = P.x - ux * P.rx * 1.25, ez = P.z - uz * P.rz * 1.25; return [ex, q.hTop(ex, ez) + 1.6, ez, P.x + ux * P.rx * .6, P.wy, P.z + uz * P.rz * .6, 55]; },
      /* close range: 0.55 m above the shallows, looking down at the south-east waterline 1-2 m away (no grass between) */
      close: () => { const q = window.__desQA(), P = q.POND, th = .55, f = .8, ex = P.x + P.rx * f * Math.cos(th), ez = P.z + P.rz * f * Math.sin(th);
        return [ex, P.wy + .55, ez, P.x + P.rx * 1.0 * Math.cos(th + .3), P.wy - .1, P.z + P.rz * 1.0 * Math.sin(th + .3), 50]; }};
    report.water = {};
    for (const k in views) {
      const v = await E(`(${views[k]})()`);
      report.water[k] = await E(v => { const q = window.__desQA(), C = window.__C(); C.Ce.enabled = false; q.lookAt(v[0], v[1], v[2], v[3], v[4], v[5]); C.De.fov = v[6]; C.De.near = .02; C.De.updateProjectionMatrix();
        q.step(30, 1 / 30); return {cam: v.slice(0, 3).map(x => +x.toFixed(2)), eyeAboveSand: +(v[1] - q.hTop(v[0], v[2])).toFixed(2), eyeAboveWater: +(v[1] - q.POND.wy).toFixed(2)}; }, v);
      await sleep(400); await shot(path.join(OUT, `${TAG}water_${k}.png`));
    }
  }

  if (want("crunch")) {
    /* the same lines as desert.mjs check 11, each time from a different state of the two camels when the sun comes out */
    const states = ["as-is", "both-rest", "both-down", "rest+job", "both-up", "as-is-late"];
    report.crunch = [];
    for (const st of states) {
      const r = await E(st => {
        const q = window.__desQA(), CM = q.ANIM.camels;
        window.__set({weather: "snow", snowLv: 2, ct: "overcast", wind: .4}); q.tod("night"); q.sim(st === "as-is-late" ? 520 : 400, .5);
        q.tod("sunrise"); q.sim(40, .5); window.__set({weather: "sun", ct: "clear"}); q.tod("day"); q.sim(60, .5);
        const rest = (a, k) => { Object.assign(a, {mode: k < 1 ? "down" : "rest", job: "kneel", k, timer: 1e9, spd: 0, path: null}); for (const n in a.r.acts) a.r.acts[n].stop(); a.r.cur = null; a.r.fd = null; q.fn.play(a.r, k < 1 ? "kneel_down" : "kneel_rest", .01, 1); };
        if (st === "both-rest") CM.forEach(a => rest(a, 1));
        if (st === "both-down") CM.forEach(a => rest(a, .4));
        if (st === "rest+job") { rest(CM[0], 1); Object.assign(CM[1], {mode: "job", job: "idle", timer: 1e9}); }
        if (st === "both-up") CM.forEach(a => { rest(a, 1); a.timer = -1; });
        const before = CM.map(c => c.mode + ":" + c.job);
        /* --- desert.mjs check 11 from here --- */
        window.__set({weather: "sun", ct: "clear"}); q.tod("day"); q.sim(1, .5);
        const walking = () => CM.some(c => c.mode === "walk" && c.path);
        for (let i = 0; i < 12 && !walking(); i++) { for (const c of CM) if (c.mode === "job" || c.mode === "rest") c.timer = 0; q.sim(2, .1); }
        if (!walking()) { const g = q.navGrid("camel", 1.05, 1.12, .84), N = q.NAV, free = (x, z) => { const i = Math.round(x - N.x0), j = Math.round(z - N.z0); return i >= 0 && j >= 0 && i < N.nx && j < N.nz && g[j * N.nx + i] === 1; };
          for (const c of CM) { if (c.mode !== "job" && c.mode !== "turn") continue;
            for (let t = 0; t < 72 && !walking(); t++) { const th = t / 72 * Math.PI * 2, d = 10 + t % 4 * 2, x = c.x + Math.sin(th) * d, z = c.z + Math.cos(th) * d; if (free(x, z)) q.camelGo(c, {x, z}, "idle"); }
            if (walking()) break; } }
        const woke = CM.map(c => c.mode + ":" + c.job), snow = q.WX.sc;
        q.audCap(true); q.sim(20, .1); const crunch = q.audCap(false).filter(e => e[1] === "S" && e[2] === "dCrn").length;
        q.sim(900, 1);
        return {state: st, before, woke, snowAtWalk: +snow.toFixed(3), crunch, pass: crunch > 0};
      }, st);
      report.crunch.push(r); console.log("crunch", JSON.stringify(r)); if (!r.pass) fails.push("crunch " + st);
    }
    fs.writeFileSync(path.join(OUT, `${TAG}crunch_stability.json`), JSON.stringify({bundle: report.bundle, runs: report.crunch}, null, 1));
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
fs.writeFileSync(path.join(OUT, `${TAG}d174-report-${WHICH.replace(/,/g, "+")}.json`), JSON.stringify(report, null, 1));
clearTimeout(killer); await S.close();
process.exit(fails.length ? 1 : 0);
