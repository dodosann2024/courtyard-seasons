// Desert regression checks: serves the repo locally, opens /desert/?debug=1 in headless Chrome and drives the simulation through
// the debug hooks (window.__desQA) to confirm that the dune deforms, wind blows sand, wind wipes footprints, the agamas still bask,
// climb, perch under the crown in rain and hide at night, and rain wets the sand, pits it and rings the lake. Then the same with
// fog lying (and the fog drifting and thinning with the wind), and snow: it lies in the ripple troughs and on lee slopes but not
// on crests or windward faces (measured on rendered pixels), the animals take cover, and it melts into wet patches that dry.
// The lake crabs and trout keep to the bank and the deep water and take cover from threats, rain and hail. The ostriches, tortoises,
// gerbils and scorpions keep their sizes, hours and refuges, react to threats and print their own tracks.
// Fails on any console output or any request that leaves localhost.
// Usage: node tools/e2e/desert.mjs   (CHROME=/path/to/chrome to override the browser)
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import puppeteer from "puppeteer-core";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const CHROME = process.env.CHROME || ["/usr/bin/google-chrome-stable", "/usr/bin/google-chrome", "/usr/bin/chromium"].find(p => fs.existsSync(p));
const LOAD_MS = +(process.env.LOAD_MS || 300000);
const TYPES = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png",
  ".jpg": "image/jpeg", ".webp": "image/webp", ".ktx2": "image/ktx2", ".glb": "model/gltf-binary", ".mp3": "audio/mpeg", ".m4a": "audio/mp4",
  ".ogg": "audio/ogg", ".wasm": "application/wasm", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".bin": "application/octet-stream"};

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p.endsWith("/")) p += "index.html";
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, {"content-type": TYPES[path.extname(f)] || "application/octet-stream"});
  fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(0, "127.0.0.1", r));
const ORIGIN = `http://127.0.0.1:${server.address().port}`;

const sleep = ms => new Promise(r => setTimeout(r, ms));
const failures = [];
const check = (name, ok, info) => { console.log(ok ? "ok  " : "FAIL", name, JSON.stringify(info)); if (!ok) failures.push(name); };

const browser = await puppeteer.launch({executablePath: CHROME, headless: "new", protocolTimeout: 900000,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader", "--mute-audio"]});
try {
  const page = await browser.newPage();
  await page.setViewport({width: 960, height: 540});
  page.on("console", m => { failures.push("console"); console.log(`FAIL console ${m.type()}: ${m.text().slice(0, 200)}`); });
  page.on("pageerror", e => { failures.push("page error"); console.log(`FAIL page error: ${String(e).slice(0, 200)}`); });
  await page.setRequestInterception(true);
  page.on("request", r => {
    const u = r.url();
    if (u.startsWith(ORIGIN) || u.startsWith("data:") || u.startsWith("blob:")) r.continue();
    else { failures.push("external request"); console.log(`FAIL request leaves localhost: ${u}`); r.abort(); }
  });
  await page.goto(ORIGIN + "/desert/?nosw=1&debug=1", {waitUntil: "domcontentloaded", timeout: 120000});
  await page.waitForFunction(() => window.__ready && window.__desReady && window.__desQA && window.__desQA().ready, {timeout: LOAD_MS, polling: 500});
  await sleep(1000);
  /* the real-time loop is frozen; every check below advances the simulation itself, so the results do not depend on frame rate */
  await page.evaluate(() => { const q = window.__desQA(); q.freeze(true); q.tod("day"); window.__set({weather: "sun", ct: "clear", wind: .8}); q.sim(20); });

  /* 1. the dune creeps and changes shape in ordinary wind, and the sand shader follows it */
  const duneCheck = () => page.evaluate(() => {
    const q = window.__desQA(), D = q.dune.DP, K = ["x", "z", "H", "w", "Lw", "Ll", "cv", "sk"], a = K.map(k => D[k]);
    q.sim(120, .5);
    const d = Math.max(...K.map((k, i) => Math.abs(D[k] - a[i]))), u = q.sandU.uDA.value;
    const sync = Math.abs(u.x - D.x) + Math.abs(u.y - D.z) + Math.abs(u.z - D.H) + Math.abs(u.w - D.w);
    return [d > .01 && sync < 1e-4, {maxChange: +d.toFixed(4), shaderSync: +sync.toFixed(6)}];
  });
  check("dune deforms in wind", ...await duneCheck());

  /* 2. wind lifts grains off the sand and carries them downwind; the surface streaks keep flowing */
  const sandCheck = () => page.evaluate(() => {
    const q = window.__desQA(), S = q.SAND, P0 = Float32Array.from(S.P), L0 = q.SANDP.map(p => p.life), f0 = q.sandU.uFlowT.value;
    q.sim(2, 1 / 30);
    let dw = 0, n = 0, lit = 0;
    /* grains live 2.5 s or more, so one whose life grew over these 2 s was not respawned; in a strong gust they fly 3–7 m */
    for (let i = 0; i < S.n; i++) {
      const dx = S.P[i * 3] - P0[i * 3], dz = S.P[i * 3 + 2] - P0[i * 3 + 2];
      if (q.SANDP[i].life > L0[i]) { dw += dx * q.WIND.x + dz * q.WIND.z; n++; }
      if (S.A[i] > .01) lit++;
    }
    const down = dw / Math.max(1, n), flow = q.sandU.uFlowT.value - f0, k = q.sandU.uFlowK.value;
    return [down > .05 && lit >= 20 && flow > 0 && k > .3, {meanDownwind: +down.toFixed(3), visibleGrains: lit, flowAdvance: +flow.toFixed(3), flowK: +k.toFixed(2)}];
  });
  check("wind blows sand", ...await sandCheck());

  /* 3. footprints wear away, much faster in wind, until they are gone */
  check("wind wipes footprints", ...await page.evaluate(() => {
    const q = window.__desQA(), P = q.PR, [x, z] = q.dune.crestXZ(.6), n0 = P.n;
    const wear = (wind, sec) => { window.__set({wind}); q.sim(15); q.prAdd(0, x, z, 0, 0, 1); const e = P.E; q.sim(sec); return Math.exp(-(P.E - e)); };
    const calm = wear(0, 60), windy = wear(1, 60), gone = wear(1, 300);
    window.__set({wind: .8});
    return [P.n > n0 && windy < calm - .1 && gone < .05, {printsAdded: P.n - n0, leftAfter60sCalm: +calm.toFixed(3), leftAfter60sWindy: +windy.toFixed(3), leftAfter300sWindy: +gone.toFixed(4)}];
  }));

  /* 4. agamas: active in the sun (basking or climbing), perched just under the fronds in rain, hidden at night */
  check("agama behaviour", ...await page.evaluate(() => {
    const q = window.__desQA(), L = q.AG.list, out = {n: L.length};
    if (!L.length) return [false, out];
    const p0 = L.map(a => [a.x, a.z, a.ct || 0]);
    const seen = new Set();
    for (let i = 0; i < 24; i++) { q.sim(5); for (const a of L) seen.add(a.palm ? "palm:" + a.mode : a.mode); }
    out.sunModes = [...seen];
    out.moved = +Math.max(...L.map((a, i) => Math.hypot(a.x - p0[i][0], a.z - p0[i][1]) + Math.abs((a.ct || 0) - p0[i][2]) * 5)).toFixed(2);
    const active = [...seen].some(m => /bask|climb|perch|palm/.test(m));
    window.__set({weather: "hrain", ct: "overcast"}); q.sim(180);
    out.rain = L.map(a => ({mode: a.mode, onPalm: !!a.palm, under: a.palm ? +(q.agRainT(a.palm) - (a.male ? 0 : .28 / a.palm.h) - a.ct).toFixed(3) : null}));
    const perched = L.every(a => a.palm && Math.abs(q.agRainT(a.palm) - (a.male ? 0 : .28 / a.palm.h) - a.ct) < .06);
    window.__set({weather: "sun", ct: "clear"}); q.tod("night"); q.sim(240);
    out.night = L.map(a => a.mode + (a.g.visible ? "" : ":hidden"));
    const hidden = L.every(a => !a.g.visible || a.then === "hide" || (a.palm && a.mode === "climb"));
    q.tod("day"); q.sim(30);
    return [active && out.moved > .3 && perched && hidden, out];
  }));

  /* 4b. lake life: big old freshwater crabs (7–9 cm across) on the damp bank, the grass cleared round their doors and in the shallows round their burrows, walking sideways,
     bolting into a burrow or the water when something big comes close and going home in rain and hail; rainbow trout (26–38 cm)
     schooling under the surface over the deep cold middle, rising at dawn and going down to the bed in hail */
  check("lake: crabs on the bank, trout in the deep, both take cover", ...await page.evaluate(() => {
    const q = window.__desQA(), CL = q.CR.list, TL = q.TT.list, r = {crabs: CL.length, trout: TL.length};
    const hidden = () => CL.every(c => c.mode === "in" || c.mode === "down" || c.mode === "sub");
    window.__set({weather: "sun", ct: "clear", wind: .4}); q.tod("day");
    const seen = new Set(), side = [];
    for (let i = 0; i < 40; i++) {
      q.sim(3, .1);
      for (const c of CL) { seen.add(c.mode); if (c.mode === "walk" && c.v > .03) { const m = Math.atan2(c.tx - c.x, c.tz - c.z); side.push(Math.abs(Math.sin(c.yaw - m))); } }
    }
    const C = q.crabs(), F = q.trout();
    r.crabModes = [...seen].sort(); r.sideways = +(side.reduce((a, b) => a + b, 0) / Math.max(1, side.length)).toFixed(3); r.walkSamples = side.length;
    r.crabDepth = [Math.min(...C.map(c => c.dep)), Math.max(...C.map(c => c.dep))].map(v => +v.toFixed(3)); r.crabScale = [Math.min(...C.map(c => c.s)), Math.max(...C.map(c => c.s))].map(v => +v.toFixed(2));
    r.crK = q.crK; r.crLane = q.crLane();
    r.troutLen = [Math.min(...F.map(f => f.L)), Math.max(...F.map(f => f.L))].map(v => +v.toFixed(3));
    r.troutWater = +Math.min(...F.map(f => f.dep)).toFixed(3); r.troutBelow = [Math.min(...F.map(f => f.below)), Math.max(...F.map(f => f.below))].map(v => +v.toFixed(3));
    const placed = C.length >= 5 && C.every(c => c.dep > -.12 && c.dep < .45 && c.s > .8 && c.s < 1.2) && F.length >= 3 &&
      F.every(f => f.L > .26 && f.L < .38 && f.dep > .8 && f.below > .15 && f.below < f.dep - .05);
    /* something big at the water's edge next to a crab that is out */
    let t = CL.find(c => c.mode === "out" || c.mode === "walk");
    for (let i = 0; i < 30 && !t; i++) { q.sim(2, .1); t = CL.find(c => c.mode === "out" || c.mode === "walk"); }
    if (t) {
      const sx = t.x, sz = t.z, near = CL.filter(c => Math.hypot(c.x - sx, c.z - sz) < 1.6 && c.mode !== "in");
      q.lakeScare(sx, sz, .6, 8); let ran = false; for (let i = 0; i < 40; i++) { q.sim(.2, .05); ran = ran || near.some(c => c.mode === "run"); }
      /* a crab beside its burrow dives straight in rather than running off first: either way it has taken cover */
      r.scared = near.map(c => c.mode); r.ranOff = ran; r.scareOk = near.length > 0 && near.every(c => c.mode === "in" || c.mode === "down" || c.mode === "sub");
      q.sim(20, .1);
    }
    window.__set({weather: "hrain", ct: "overcast"}); q.sim(60, .1); r.rain = CL.map(c => c.mode); const rainHid = hidden();
    window.__set({weather: "sun", ct: "clear"}); q.sim(600, .5); for (let i = 0; i < 30 && !CL.some(c => c.mode === "out" || c.mode === "walk"); i++) q.sim(5, .1);
    r.outAgain = CL.filter(c => c.mode === "out" || c.mode === "walk").length;
    q.tod("sunrise"); const r0 = q.TT.rises; q.sim(150, .1); r.dawnRises = q.TT.rises - r0;
    q.tod("day"); window.__set({weather: "hail", hailLv: 1}); q.sim(30, .1);
    r.hailAboveBed = +Math.max(...q.trout().map(f => f.dep - f.below)).toFixed(3); r.hail = CL.map(c => c.mode); const hailHid = hidden();
    window.__set({weather: "sun", ct: "clear", hailLv: 1}); q.sim(900, 1);
    return [placed && r.crK >= 1.5 && r.crLane === 0 && seen.has("walk") && r.sideways > .85 && !!r.scareOk && rainHid && r.outAgain > 0 && r.dawnRises > 0 && r.hailAboveBed < .3 && hailHid, r];
  }));

  /* 4b2. the procedural animals: ostriches (cock's head ~2.4 m, over a camel's hump; walk and graze by day, run from the eagle,
     sit at night), desert tortoises (a 7 cm/s plod, into the shell in hail, a pallet dug in shade at noon), gerbils (in their
     burrows by day, out from dusk, bolting home from a threat) and scorpions (under rocks by day, out at night, tail-arched
     threat at a camel), each pressing its own kind of print */
  check("ostriches, tortoises, gerbils, scorpions", ...await page.evaluate(() => {
    const q = window.__desQA(), PA = q.PA, r = {os: PA.os.length, tt: PA.tt.length, gb: PA.gb.length, sc: PA.sc.length};
    const kinds = () => { const c = q.PR.im.instanceColor.array, s = new Set(); for (let i = 0; i < q.PR.n; i++) s.add(Math.floor(c[i * 3] + .001)); return s; };
    PA.noView = 1; window.__set({weather: "sun", ct: "clear", wind: .3}); q.tod("day"); q.sim(5);
    /* sizes: the cock's head against a standing camel's hump */
    for (const o of PA.os) { o.mode = "stand"; o.t = 3; o.P.gr = 0; o.P.al = 0; } q.step(60, 1 / 30);
    const os = q.os(); r.headY = os.map(o => +o.headY.toFixed(2));
    const okSize = os.length === 2 && os[0].headY > 2.3 && os[0].headY < 2.75 && os[1].headY > 1.95 && os[1].headY < os[0].headY;
    const om = new Set(), tm = new Set(), op = os.map(o => [o.x, o.z]);
    for (let i = 0; i < 60; i++) { q.sim(3, .1); for (const o of PA.os) om.add(o.mode); for (const t of PA.tt) tm.add(t.mode); }
    r.osModes = [...om].sort(); r.osMoved = +Math.max(...PA.os.map((o, i) => Math.hypot(o.x - op[i][0], o.z - op[i][1]))).toFixed(1);
    r.ttModes = [...tm].sort(); r.ttMaxV = +Math.max(...PA.tt.map(t => t.v)).toFixed(3);
    /* the eagle stooping on an ostrich out on the open sand north-west of the camp, well clear of the fire, the tent and the lake:
       it runs. A fixed spot keeps the check repeatable; the random open-spot search is only the fallback. */
    const O = PA.os[0]; let s0 = q.osOpen(-5.5, -5) ? {x: -5.5, z: -5} : null;
    for (let k = 0; k < 60 && !s0; k++) { const p = q.osSpot(O, false, 10); if (p && Math.hypot(p.x - q.FIRE.x, p.z - q.FIRE.z) > 8 && Math.hypot(p.x, p.z) > 4) s0 = p; }
    if (s0) q.osPlace(O, s0.x, s0.z, 0); O.path = null; O.mode = "graze"; O.t = 9; O.P.sit = 0;
    const ox = O.x, oz = O.z, ol = Math.hypot(ox, oz) || 1; q.paThreat(ox + ox / ol * 2, oz + oz / ol * 2, 6, 1.5); let vmax = 0;
    for (let i = 0; i < 75; i++) { q.step(3, 1 / 30); vmax = Math.max(vmax, O.v); } r.osFlee = +vmax.toFixed(2); r.osAway = +Math.hypot(O.x - ox, O.z - oz).toFixed(1); q.paThreat(0, 0, 0);
    /* hail: tortoises pull in */
    window.__set({weather: "hail", hailLv: 1}); q.sim(20, .1); r.ttHail = PA.tt.map(t => +t.P.wd.toFixed(2)); const shell = PA.tt.every(t => t.P.wd > .9);
    window.__set({weather: "sun", ct: "clear", hailLv: 1}); q.sim(240, .5);
    /* noon heat: a tortoise digs into shade */
    const T0 = PA.tt[0], s = q.torShade(T0); q.torPlace(T0, s.x + .4, s.z + .3, 0); T0.mode = "graze"; T0.t = 0; T0.inShade = 0; let dug = false;
    for (let i = 0; i < 40 && !dug; i++) { q.WX.heat = 1; q.sim(3, .1); dug = T0.mode === "dig" || T0.mode === "pallet"; } r.ttHeat = T0.mode;
    /* day: gerbils below, scorpions under their rocks */
    /* ...though now and then one puts its head up out of the hole for a look round (and ducks if something comes by); each burrow
       and scrape has its spoil heap */
    const dm = new Set(); for (let i = 0; i < 60; i++) { q.sim(1.5, .1); for (const g of PA.gb) dm.add(g.mode); }
    r.gbDay = PA.gb.map(g => g.mode); r.gbDayModes = [...dm].sort(); r.scDay = PA.sc.map(a => a.mode + (a.g.visible ? ":seen" : ""));
    const dayOk = [...dm].every(m => ["in", "look", "bolt", "dive"].includes(m)) && dm.has("look") && PA.sc.every(a => a.mode === "hide" && !a.g.visible);
    const marks = PA.gb.every(g => g.h.mound && g.h.mound.visible) && PA.sc.every(a => a.rk.mound && a.rk.mound.visible);
    /* dusk into night: gerbils come out; the scorpions leave their rocks, glowing faintly */
    /* a gerbil that bolted from a passing camel or ostrich stays down 5–14 s and then peeks, so the next 16 s of it are left out:
       what is measured is whether they come out when nothing has just scared them */
    q.tod("sunset"); const gm = new Set(); let gOut = 0, gN = 0; const scared = PA.gb.map(() => -1);
    for (let i = 0; i < 60; i++) { q.sim(2, .1); PA.gb.forEach((g, j) => { gm.add(g.mode); if (g.mode === "bolt" || g.mode === "dive") scared[j] = i + 8;
      if (g.mode !== "in") gOut++; if (g.mode !== "in" || i > scared[j]) gN++; }); }
    q.tod("night"); const sm = new Set(); let scOut = 0;
    for (let i = 0; i < 60; i++) { q.sim(3, .1); for (const a of PA.sc) { sm.add(a.mode); if (a.mode === "roam") scOut++; } for (const g of PA.gb) gm.add(g.mode); }
    r.gbModes = [...gm].sort(); r.scModes = [...sm].sort(); r.glow = +q.paU.uGlow.value.toFixed(2);
    r.gbOut = +(gOut / Math.max(1, gN)).toFixed(2); r.scRoam = +(scOut / (60 * PA.sc.length)).toFixed(2);
    /* a gerbil that is out bolts for its hole and goes in */
    let G = PA.gb.find(g => g.mode === "forage" || g.mode === "stand" || g.mode === "nibble");
    if (!G) { G = PA.gb[0]; G.mode = "forage"; G.x = G.h.x + .5; G.z = G.h.z + .4; G.goal = null; G.t = 9; q.step(5, 1 / 30); }
    q.paThreat(G.x + .6, G.z, 4, .2); const gs = new Set(); for (let i = 0; i < 60; i++) { q.step(2, 1 / 30); gs.add(G.mode); } r.gbBolt = [...gs];
    /* one already at its hole mouth goes straight down without a dash first */
    const bolted = (gs.has("bolt") || gs.has("dive")) && (G.mode === "in" || G.mode === "dive"); q.paThreat(0, 0, 0);
    /* a scorpion that is out faces a camel coming up: tail arched, pincers open. The one farthest from the big animals is used,
       since an ostrich bedded down beside a rock for the night keeps that scorpion at home */
    const big = [...PA.os, ...PA.tt, ...q.ANIM.camels], room = a => Math.min(...big.map(b => Math.hypot(b.x - a.rk.dx, b.z - a.rk.dz)));
    const S = PA.sc.reduce((b, a) => room(a) > room(b) ? a : b); S.mode = "roam"; S.t = 99; S.x = S.rk.dx; S.z = S.rk.dz; S.goal = null; q.step(5, 1 / 30);
    q.paThreat(S.x + .5, S.z + .2, 4, .1); q.step(45, 1 / 30); r.scThr = +S.P.thr.toFixed(2); r.scOpen = +S.P.open.toFixed(2); q.paThreat(0, 0, 0);
    /* night: ostriches sit */
    q.sim(40, .1); r.osNight = PA.os.map(o => o.mode + ":" + o.P.sit.toFixed(2));
    const sat = PA.os.every(o => o.mode === "sit" && o.P.sit > .8);
    /* morning: the ostriches get up off their night hollows */
    q.tod("day"); window.__set({weather: "sun", ct: "clear", wind: .3}); q.sim(50, .25);
    const K = kinds(); r.printKinds = [5, 6, 7, 8, 9, 10].filter(k => K.has(k));
    window.__set({wind: .8}); PA.noView = 0; q.sim(30, .5);
    return [r.os === 2 && r.tt === 2 && r.gb === 3 && r.sc === 2 && okSize && om.has("walk") && om.has("graze") && r.osMoved > 2 && r.osFlee > 3 &&
      tm.has("walk") && r.ttMaxV < .1 && shell && dug && dayOk && marks && r.gbOut > .5 && r.scRoam > .3 && sm.has("roam") && r.glow > .5 && bolted && r.scThr > .8 && r.scOpen > .8 && sat &&
      [5, 6, 7, 8, 9, 10].every(k => K.has(k)), r];
  }));

  /* 5. rain darkens and pits the sand and rings the lake, and the sand dries again afterwards */
  /* 4c. the rugs on the drying rack swing out in a gust, hang in soft folds, and the hem rocks on for a moment after the gust drops */
  check("rack rugs: gust swing, folds, after-swing", ...await page.evaluate(() => {
    const q = window.__desQA(), c = q.RACK.cloths[0], u = c.userData, r = {}, P = c.geometry.attributes.position, nx = u.u0.length;
    /* the wind square onto the rugs: the swing back after a gust depends on how squarely the wind took them */
    q.windPin(q.RACK.yaw - Math.PI / 2);
    window.__set({weather: "sun", ct: "clear", wind: .04}); q.sim(40, .1); r.calm = Math.abs(u.th);
    const hem = []; for (let i = P.count - nx; i < P.count; i++) hem.push(P.getZ(i)); const m = hem.reduce((a, b) => a + b) / nx;
    r.folds = Math.sqrt(hem.reduce((a, b) => a + (b - m) ** 2, 0) / nx);
    window.__set({wind: 1}); let mx = 0; for (let i = 0; i < 240; i++) { q.step(1, 1 / 30); mx = Math.max(mx, Math.abs(u.th)); } r.gust = mx;
    /* drop the wind while the rug is swung out, not in a lull between gusts */
    for (let i = 0; i < 300 && Math.abs(u.th) < .7 * mx; i++) q.step(1, 1 / 30);
    const sg = Math.sign(u.th) || 1; window.__set({wind: .04}); const th = [], fi = [];
    for (let i = 0; i < 360; i++) { q.step(1, 1 / 30); th.push(u.th * sg); fi.push(u.fi); }
    const end = th[th.length - 1]; r.overshoot = Math.max(...th.map(v => end - v));
    let x = 0; for (let i = 91; i < 300; i++) if (fi[i] * fi[i - 1] < 0) x++; r.hemSwings = x; r.hemAmp = Math.max(...fi.slice(90, 240).map(Math.abs));
    q.windPin(null); window.__set({wind: .35}); q.sim(20, .1);
    for (const k in r) if (typeof r[k] === "number") r[k] = +r[k].toFixed(4);
    return [r.calm < .12 && r.folds > .008 && r.gust > .3 && r.overshoot > .02 && r.hemSwings >= 2 && r.hemAmp > .004, r];
  }));

  /* 4d. oasis insects: cicadas in the palms in the day's heat, katydids and crickets in the shore grass from dusk, none in rain */
  check("oasis insects: cicadas by day, katydids and crickets from dusk", ...await page.evaluate(() => {
    const q = window.__desQA(), C = window.__C(), p0 = C.De.position.clone(), t0 = C.Ce.target.clone(), en = C.Ce.enabled, r = {};
    C.Ce.enabled = false; C.De.position.copy(q.toW(q.POND.x + 3, q.hTop(q.POND.x, q.POND.z) + 2, q.POND.z + 3)); C.Ce.target.copy(q.toW(q.POND.x, q.POND.wy, q.POND.z)); C.De.lookAt(C.Ce.target);
    const run = (tod, w) => { window.__set({weather: w || "sun", ct: w ? "overcast" : "clear", wind: .2}); q.tod(tod); q.sim(40, .25); q.step(3, 1 / 30); q.audCap(true);
      for (let i = 0; i < 1500; i++) q.step(1, 1 / 30); const ev = q.audCap(false), n = re => ev.filter(e => e[1] === "S" && re.test(e[2])).length;
      return {ci: n(/^dCi/), kt: n(/^dKt/), cr: n(/^dO[ck]/), bed: Math.max(0, ...ev.filter(e => e[1] === "L" && e[2] === "cicb").map(e => e[4]))}; };
    r.day = run("day"); r.dusk = run("sunset"); r.night = run("night"); r.rain = run("day", "hrain");
    window.__set({weather: "sun", ct: "clear", wind: .8}); q.tod("day"); q.sim(900, 1);
    C.De.position.copy(p0); C.Ce.target.copy(t0); C.Ce.enabled = en; C.De.lookAt(t0);
    return [r.day.ci >= 4 && r.day.bed > .05 && r.day.kt === 0 && r.dusk.kt >= 4 && r.dusk.cr >= 2 && r.dusk.ci === 0 && r.night.cr >= 3 && r.night.ci === 0 && r.rain.ci === 0 && r.rain.kt === 0, r];
  }));

  const rainCheck = () => page.evaluate(() => {
    const q = window.__desQA();
    window.__set({weather: "hrain", ct: "overcast"}); q.sim(90);
    const r = {wet: q.WX.wet, sandWet: q.sandU.uWetK.value, pits: q.sandU.uPitK.value, lake: q.pondU.uRainP.value, tent: q.tentU.uWetC.value, drops: [q.RAIN.near, q.RAIN.far].some(o => o && (o.visible || (o.o && o.o.visible)))};
    window.__set({weather: "sun", ct: "clear"}); q.sim(900, .5);
    r.wetAfterSun = q.WX.wet;
    for (const k in r) if (typeof r[k] === "number") r[k] = +r[k].toFixed(3);
    return [r.wet > .5 && r.sandWet > .3 && r.pits > .2 && r.lake > .5 && r.tent > .3 && r.drops && r.wetAfterSun < r.wet - .2, r];
  });
  check("rain on sand, tent and lake", ...await rainCheck());

  /* 6. radiation fog: it lies in the hollow at night and drifts downwind, faster and thinner the stronger the wind */
  check("fog drifts and thins with the wind", ...await page.evaluate(() => {
    const q = window.__desQA(), U = q.FOGD.U;
    window.__set({weather: "fog", fogLv: 2, wind: .15}); q.tod("night"); q.sim(240, .5);
    const run = w => { window.__set({wind: w}); q.sim(30, .25); const a = U.uAdv.value.clone(); q.sim(20, .25); const d = U.uAdv.value.clone().sub(a);
      return {along: +(d.x * q.WIND.x + d.y * q.WIND.z).toFixed(3), across: +Math.abs(-d.x * q.WIND.z + d.y * q.WIND.x).toFixed(3), density: +U.uK.value.toFixed(3), on: q.FOGD.g.visible}; };
    const calm = run(.15), breeze = run(.5), strong = run(1.1);
    return [calm.on && calm.density > .5 && calm.along > 0 && breeze.along > calm.along * 1.5 && strong.along > breeze.along && strong.density < calm.density * .7, {calm, breeze, strong}];
  }));

  /* 7. with the fog lying the dune still creeps and the wind still carries sand */
  await page.evaluate(() => { window.__set({wind: .8}); window.__desQA().sim(10); });
  check("fog: dune deforms in wind", ...await duneCheck());
  check("fog: wind blows sand", ...await sandCheck());

  /* 8. agamas keep to cover while the cold fog lies at sunrise and come out once it has burnt off */
  check("fog: agamas shelter, then come out", ...await page.evaluate(() => {
    const q = window.__desQA(), L = q.AG.list, out = {};
    window.__set({weather: "fog", fogLv: 2, wind: .15}); q.tod("night"); q.sim(200, .5); q.tod("sunrise"); q.sim(150, .5);
    out.fogCold = q.WX.cold; out.inFog = L.map(a => a.mode + (a.g.visible ? "" : ":hidden"));
    const hid = q.WX.cold > 0 && L.every(a => !a.g.visible || a.then === "hide" || a.mode === "hide" || a.mode === "run" || (a.palm && a.mode === "climb"));
    window.__set({weather: "sun", ct: "clear", wind: .35}); q.tod("day"); q.sim(400, .5);
    const seen = new Set();for (let i = 0; i < 24; i++) { q.sim(5); for (const a of L) if (a.g.visible) seen.add(a.palm ? "palm:" + a.mode : a.mode); }
    out.afterFog = [...seen]; out.cold = q.WX.cold;
    return [hid && q.WX.cold === 0 && [...seen].some(m => /bask|climb|perch|palm/.test(m)), out];
  }));

  /* 9. rain straight after a foggy morning still wets the sand and tent and rings the lake */
  await page.evaluate(() => { const q = window.__desQA(); window.__set({weather: "fog", fogLv: 2, wind: .2}); q.tod("sunrise"); q.sim(120, .5); q.tod("day"); window.__set({wind: .8}); });
  check("fog: rain on sand, tent and lake", ...await rainCheck());

  /* 10. snow: a thin dusting the wind sorts. Rendered with and without it, it must whiten the ripple troughs on flat sand and the
     dune's lee (slip) face and leave the ripple ridges, the dune crest and its windward face bare. Each class is read from a camera
     that sees it unoccluded: from above for flat sand, from downwind for the lee face, from upwind for the windward face and crest. */
  await page.evaluate(() => { document.body.classList.add("col", "snc"); const q = window.__desQA();
    window.__set({weather: "sun", ct: "clear", wind: .35}); q.tod("day"); q.sim(5); window.__C().Ce.enabled = false; });
  const frames = n => page.evaluate(n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
  const views = {top: [0, 0, 24, 4], lee: [1, 11, 6.5, 0], wind: [-1, 11, 6.5, 0]}, shots = {};
  const aim = v => page.evaluate(v => { const q = window.__desQA(), C = window.__C(), R = q.sandU.uRipDir.value, [cx, cz] = q.dune.crestXZ(0), h = q.hTop(cx, cz);
    const px = cx + R.x * v[0] * v[1], pz = cz + R.y * v[0] * v[1] + v[3];
    C.De.position.copy(q.toW(px, h + v[2], pz)); C.Ce.target.copy(q.toW(cx, h - 1, cz)); C.De.lookAt(C.Ce.target); C.De.fov = 50; C.De.updateProjectionMatrix(); C.De.updateMatrixWorld(); }, v);
  for (const sc of [0, 1]) {
    await page.evaluate(sc => { const q = window.__desQA(); Object.assign(q.WX, {sc, sp: sc, sm: 0, mw: 0, sf: 0}); q.step(1, 1 / 60); }, sc);
    for (const k in views) { await aim(views[k]); await frames(4); await sleep(300); shots[k + sc] = await page.screenshot({encoding: "base64"}); }
  }
  check("snow in troughs and lee, not on crests", ...await page.evaluate(async (shots, views) => {
    const q = window.__desQA(), C = window.__C(), cam = C.De, R = q.sandU.uRipDir.value, [cx, cz] = q.dune.crestXZ(0);
    const px = async b => { const im = await createImageBitmap(await (await fetch("data:image/png;base64," + b)).blob()), cv = new OffscreenCanvas(im.width, im.height), g = cv.getContext("2d");
      g.drawImage(im, 0, 0); return {d: g.getImageData(0, 0, im.width, im.height).data, w: im.width, h: im.height}; };
    const lum = (I, x, y) => { const o = (y * I.w + x) * 4; return (.3 * I.d[o] + .59 * I.d[o + 1] + .11 * I.d[o + 2]) / 255; };
    const S = {lee: [], windward: [], crest: [], trough: [], ridge: []}, v = new (cam.position.constructor)();
    const props = [...q.PALMS.map(p => ({x: p.x, z: p.z})), {x: q.TENT.x, z: q.TENT.z}, ...(q.SAG || []).map(p => ({x: p.x, z: p.z}))];
    const CR = []; for (let u = -.85; u <= .85; u += .01) CR.push(q.dune.crestXZ(u));
    const crD = (x, z) => Math.min(...CR.map(c => Math.hypot(x - c[0], z - c[1])));
    const nrm = (x, z) => { const e = .2, hx = (q.hTop(x + e, z) - q.hTop(x - e, z)) / (2 * e), hz = (q.hTop(x, z + e) - q.hTop(x, z - e)) / (2 * e), l = Math.hypot(hx, 1, hz); return [-hx / l, -hz / l]; };
    const ok = (x, z) => q.sN(x, z) < .96 && q.pN(x, z) > 1.3 && props.every(p => Math.hypot(x - p.x, z - p.z) > 3.5);
    /* one camera: project, read both renders, push the brightening */
    const read = async (k, pts) => { const a = await px(shots[k + 0]), b = await px(shots[k + 1]), V = views[k], h = q.hTop(cx, cz);
      cam.position.copy(q.toW(cx + R.x * V[0] * V[1], h + V[2], cz + R.y * V[0] * V[1] + V[3])); cam.lookAt(q.toW(cx, h - 1, cz)); cam.updateMatrixWorld();
      for (const [x, z, cls] of pts) { v.copy(q.toW(x, q.hTop(x, z) + .02, z)).project(cam); const sx = Math.round((v.x + 1) / 2 * a.w), sy = Math.round((1 - v.y) / 2 * a.h);
        if (v.z > 1 || sx < a.w * .12 || sx > a.w * .88 || sy < a.h * .15 || sy > a.h * .85) continue; S[cls].push(lum(b, sx, sy) - lum(a, sx, sy)); } };
    const flat = [], lee = [], ww = [], crest = [];
    for (let x = cx - 16; x <= cx + 16; x += .3) for (let z = cz - 14; z <= cz + 14; z += .3) { if (!ok(x, z)) continue;
      const dm = q.dune.dMask(x, z), [nx, nz] = nrm(x, z), wd = nx * R.x + nz * R.y, sl = Math.hypot(nx, nz), cd = crD(x, z);
      if (dm > .3 && cd > .25 && sl > .15 && wd > .12) lee.push([x, z, "lee"]);
      else if (dm > .3 && cd > .6 && sl > .1 && wd < -.1) ww.push([x, z, "windward"]);
      else if (dm < .05 && sl < .06) { const al = x * R.x + z * R.y, ac = -x * R.y + z * R.x, mp = al * 2.3 + 1.6 * Math.sin(ac * .21 + 1.3) + .9 * Math.sin(ac * .53 + al * .11), t = Math.sin(mp + .85 * Math.sin(mp));
        if (t < -.45) flat.push([x, z, "trough"]); else if (t > .55) flat.push([x, z, "ridge"]); } }
    for (const [x, z] of CR) if (ok(x, z) && q.dune.dMask(x, z) > .3) crest.push([x - R.x * .12, z - R.y * .12, "crest"]);
    await read("top", flat); await read("lee", lee); await read("wind", [...ww, ...crest]);
    const st = {}; for (const k in S) { const L = S[k]; st[k] = {n: L.length, covered: L.length ? +(L.filter(g => g > .06).length / L.length).toFixed(3) : null, gain: L.length ? +(L.reduce((s, g) => s + g, 0) / L.length).toFixed(3) : null}; }
    const pass = Object.values(st).every(s => s.n >= 20) && st.lee.covered > .4 && st.windward.covered < .12 && st.crest.covered < .2 && st.trough.covered > st.ridge.covered + .2 && st.lee.covered > st.windward.covered + .3;
    return [pass, st];
  }, shots, views));
  await page.evaluate(() => { const C = window.__C(); C.Ce.enabled = true; Object.assign(window.__desQA().WX, {sc: 0, sp: 0}); });

  /* 11. snow falling at night: flakes, frost, the cold-blooded animals in hiding, camels standing still, ice at the lake edge by
     dawn; then the sun melts it through slush into dark wet patches, and those dry */
  check("snow: animals take cover, then it melts and dries", ...await page.evaluate(() => {
    const q = window.__desQA(), r = {};
    window.__set({weather: "snow", snowLv: 2, ct: "overcast", wind: .4}); q.tod("night"); q.sim(400, .5);
    const fl = q.flakes();
    Object.assign(r, {cover: q.WX.sc, frost: q.WX.frost, flakes: !!(fl && fl[0].visible), cold: q.WX.cold});
    r.agamas = q.AG.list.map(a => a.mode + (a.g.visible ? "" : ":hidden"));
    const hid = q.AG.list.every(a => !a.g.visible || a.then === "hide" || a.mode === "hide" || a.mode === "run" || (a.palm && a.mode === "climb"));
    const camWalk = q.ANIM.camels.filter(c => c.mode === "walk").length, rs = q.ANIM.rs;
    r.camelsWalking = camWalk; r.snake = rs ? rs.mode + (rs.g.visible ? "" : ":hidden") : null;
    /* a thin layer lies on the tent roof, the palm crowns and the cactus tops, flakes vanish at the water, and a thin steam fog lies on the lake */
    r.tops = q.WX.scp; r.steam = q.WX.stm; r.steamOn = q.STM.o.visible;
    q.tod("sunrise"); q.sim(40, .5); r.dawnIce = q.WX.ice;
    window.__set({weather: "sun", ct: "clear"}); q.tod("day"); q.sim(60, .5); r.slush = q.WX.sm; r.coverAt60 = q.WX.sc; r.topsAt60 = q.WX.scp;
    /* once the snowfall stops the camels walk again, and their steps crunch in the lying snow */
    window.__set({weather: "sun", ct: "clear"}); q.tod("day"); q.sim(1, .5); q.audCap(true);
    for (let i = 0; i < 12 && !q.ANIM.camels.some(c => c.mode === "walk"); i++) { for (const c of q.ANIM.camels) if (c.mode === "job") c.timer = 0; q.sim(5, .1); }
    q.sim(20, .1); r.crunch = q.audCap(false).filter(e => e[1] === "S" && e[2] === "dCrn").length;
    r.wetPeak = q.WX.mw; for (let i = 0; i < 24; i++) { q.sim(10, .5); r.wetPeak = Math.max(r.wetPeak, q.WX.mw); } r.coverAt300 = q.WX.sc; r.iceDay = q.WX.ice; r.frostDay = q.WX.frost;
    q.sim(900, 1); r.wetAfter = q.WX.mw; r.coldAfter = q.WX.cold;
    for (const k in r) if (typeof r[k] === "number") r[k] = +r[k].toFixed(3);
    return [r.cover > .8 && r.frost > .6 && r.flakes && r.cold === 1 && hid && camWalk === 0 && r.dawnIce > .3 && r.slush > .5 && r.coverAt60 < r.cover &&
      r.tops > .6 && r.topsAt60 < r.tops * .5 && r.steam > .5 && r.steamOn && r.crunch > 3 &&
      r.coverAt300 < .02 && r.wetPeak > .3 && r.iceDay < .05 && r.frostDay < .05 && r.wetAfter < .05 && r.coldAfter === 0, r];
  }));

  /* 12. hail: a gust front, then a short burst of white stones out of a green-grey base. They bounce on the sand and pit it, roll
     into the ripple troughs and lie there; they drum on the tent and shake it, crack into the palm crowns, knock the cacti, splash
     and float briefly on the lake. Each surface has its own sound. The cold-blooded animals hide (agamas and the snake under cover, the pupfish in the deep middle) and the camels stand with their
     backs to the wind. Then the sun melts the stones within minutes into dark wet spots that dry. */
  check("hail: bounce, pits, troughs, tent, palms, cacti, lake, sounds, animals, melt", ...await page.evaluate(() => {
    const q = window.__desQA(), C = q.HS.cnt, r = {}, H = q.WX.H, CS = q.ANIM.camels;
    window.__set({weather: "sun", ct: "clear", wind: .5, hailLv: 1}); q.tod("day"); q.sim(30, .5);
    for (const k in C) delete C[k];
    const tp = q.PALMS[0], sg = (q.SAG || [])[0], [cx, cz] = q.dune.crestXZ(0);
    const pins = [{x: cx, z: cz, R: 6}, {x: q.TENT.x, z: q.TENT.z, R: 4}, {x: tp.x, z: tp.z, R: 3.5}, {x: q.POND.x, z: q.POND.z, R: 3}, sg && {x: sg.x, z: sg.z, R: 2}].filter(Boolean);
    let shk = 0, tw = 0, gust = 0, wnG = 0, hf = 0;
    const watch = () => { shk = Math.max(shk, q.tentU.uShk.value); tw = Math.max(tw, ...q.PALMS.map(p => Math.abs(p.tw ? p.tw.value : 0))); gust = Math.max(gust, q.WX.gf); wnG = Math.max(wnG, q.st.wn); hf = Math.max(hf, q.WX.hf); };
    window.__set({weather: "hail", hailLv: 1}); q.audCap(true);
    q.HS.pin = pins[0]; q.lookAt(cx + 6, q.hTop(cx, cz) + 4, cz + 6, cx, q.hTop(cx, cz), cz);
    for (let i = 0; i < 18; i++) { q.sim(1, 1 / 30); watch(); }
    r.burstAfterGust = H.ph === 2;
    for (const p of pins) { q.HS.pin = p; q.lookAt(p.x + 7, q.hTop(p.x, p.z) + 4, p.z + 7, p.x, q.hTop(p.x, p.z) + 1, p.z); for (let i = 0; i < 12; i++) { q.sim(1, 1 / 30); watch(); } }
    q.HS.pin = pins[0]; q.lookAt(cx + 6, q.hTop(cx, cz) + 4, cz + 6, cx, q.hTop(cx, cz), cz); q.sim(10, 1 / 30); watch();
    const ev = q.audCap(false), shots = new Set(ev.filter(e => e[1] === "S" && /^dH/.test(e[2])).map(e => e[2])), loops = new Set(ev.filter(e => e[1] === "L" && /^h/.test(e[2]) && e[4] > .05).map(e => e[2]));
    Object.assign(r, {gust, windInGust: wnG, hail: hf, tentShake: shk, palmTwitch: tw, cover: q.WX.hc, pits: q.WX.hp, rain: q.WX.rain, streaks: q.HLU.uRain.value, cold: q.WX.cold, sky: q.skyU.uHg ? q.skyU.uHg.value : null});
    r.counts = {...C}; r.shots = [...shots].sort(); r.loops = [...loops].sort();
    const lt = (C.landTr || 0) / Math.max(1, (C.landTr || 0) + (C.landCr || 0)), rt = (C.restTr || 0) / Math.max(1, (C.restTr || 0) + (C.restCr || 0));
    r.troughShareLanding = +lt.toFixed(3); r.troughShareResting = +rt.toFixed(3);
    r.agamas = q.AG.list.map(a => a.mode + (a.g.visible ? "" : ":hidden"));
    const hid = q.AG.list.every(a => !a.g.visible || a.then === "hide" || a.mode === "hide" || a.mode === "run" || (a.palm && a.mode === "climb"));
    const wy = Math.atan2(q.WIND.x, q.WIND.z), off = CS.filter(c => c.mode !== "kneel" && c.job !== "kneel").map(c => Math.abs(Math.atan2(Math.sin(c.yaw - wy), Math.cos(c.yaw - wy))));
    r.camelsWalking = CS.filter(c => c.mode === "walk").length; r.camelOffWind = off.map(a => +a.toFixed(2));
    const rs = q.ANIM.rs, PF = q.PF ? q.PF.list : [];
    r.snake = rs ? rs.mode + (rs.g.visible ? "" : ":hidden") + (rs.goal && rs.goal.near ? ":toCover" : "") : null;
    /* a snake caught out in the open is still crawling to its cover when the short burst ends */
    const snakeHid = !rs || !rs.g.visible || (rs.mode === "crawl" && !!(rs.goal && rs.goal.near));
    r.fishDepth = PF.length ? +(PF.reduce((t, f) => t + q.pfDep(f.x, f.z), 0) / PF.length).toFixed(3) : null;
    window.__set({weather: "sun", ct: "clear"}); q.HS.pin = null;
    q.sim(60, .25); r.coverAt60 = q.WX.hc; r.wetPeak = q.WX.hm; for (let i = 0; i < 20; i++) { q.sim(15, .5); r.wetPeak = Math.max(r.wetPeak, q.WX.hm); }
    r.coverAt360 = q.WX.hc; q.sim(900, 1); r.wetAfter = q.WX.hm; r.coldAfter = q.WX.cold;
    for (const k in r) if (typeof r[k] === "number") r[k] = +r[k].toFixed(3);
    const n = k => C[k] || 0;
    return [r.burstAfterGust && r.gust > .6 && r.windInGust > .7 && r.hail > .8 && r.rain < .05 && r.streaks > .5 && r.cover > .4 && r.pits > .4 &&
      n("sand") > 60 && n("rebound") > 10 && n("pit") > 15 && n("tent") > 5 && n("palm") > 3 && n("pond") > 5 && (!sg || n("cactus") > 1) &&
      rt > lt + .1 && n("restTr") > n("restCr") && r.tentShake > .5 && r.palmTwitch > .1 &&
      ["dHs1", "dHt1", "dHp1", "dHc1"].every(k => shots.has(k)) && ["hsand", "htent", "hleaf", "hwat"].every(k => loops.has(k)) &&
      r.cold === 1 && hid && snakeHid && (r.fishDepth === null || r.fishDepth > .3) && r.camelsWalking === 0 && off.every(a => a < .45) &&
      r.coverAt60 < r.cover && r.coverAt360 < .03 && r.wetPeak > .2 && r.wetAfter < .05 && r.coldAfter === 0, r];
  }));

  /* 13. hail with rain: the stones fall through rain that wets the sand, tent and lake as rain does */
  check("hail with rain", ...await page.evaluate(() => {
    const q = window.__desQA();
    window.__set({weather: "hail", hailLv: 2}); q.sim(60, 1 / 10);
    const r = {hail: q.WX.hf, rain: q.WX.rain, wet: q.WX.wet, lake: q.pondU.uRainP.value, tent: q.tentU.uWetC.value};
    for (const k in r) r[k] = +r[k].toFixed(3);
    window.__set({weather: "sun", ct: "clear", hailLv: 1}); q.sim(600, 1);
    return [r.hail > .5 && r.rain > .3 && r.wet > .2 && r.lake > .2 && r.tent > .2, r];
  }));

  /* 14. after the hail the dune still creeps, the wind still carries sand, and rain still wets everything */
  await page.evaluate(() => { window.__set({weather: "sun", ct: "clear", wind: .8}); window.__desQA().sim(10); });
  check("hail: dune deforms in wind", ...await duneCheck());
  check("hail: wind blows sand", ...await sandCheck());
  check("hail: rain on sand, tent and lake", ...await rainCheck());

  /* 15. the rain sound is one continuous bed. After the first key press unlocks the audio, the base patter and the cloth loops are
     already running silent on a clear day (only those two, as on main); the other layers start silent as the rain is chosen, before
     any drop falls; rain, a change of intensity and taps on the screen then only move their gain, smoothly: no source
     is started again, the level never dips and recovers, and the master level does not duck on a tap. Real time, frames running. */
  await page.keyboard.press("F9");
  await page.evaluate(() => { const q = window.__desQA(); window.__set({weather: "sun", ct: "clear", wind: .5}); q.sim(120, .5); q.freeze(false); });
  await page.waitForFunction(() => { const A = window.__desQA().AU; const S = window.__sound; return A.lp.rain && A.lp.rtent && !A.lp.rain2 && !A.lp.rain3 && !A.lp.rtent2 && A.b.dRn2 && A.b.dRn3 && A.b.dRt2 && S.ctx === "running" && S.gain >= .95 * S.vol; }, {timeout: 120000, polling: 250});
  check("rain sound: one continuous bed, no dropouts, restarts or dips", ...await page.evaluate(async () => {
    const q = window.__desQA(), A = q.AU, S = window.__sound, sleep = ms => new Promise(r => setTimeout(r, ms));
    const silentBefore = [A.lp.rain, A.lp.rtent].map(L => +L.g.gain.value.toFixed(3));
    window.__set({weather: "hrain", ct: "overcast"}); q.sim(.1, .1);
    const ids = ["rain", "rain2", "rain3", "rtent", "rtent2"], V = ids.map(k => A.lp[k]), src = V.map(L => L.s), n0 = ids.map(k => A.n[k]);
    const r = {ctx: S.ctx, silentBefore}, G = ids.map(() => []), M = [];
    /* the weather is stepped ahead in one go (as a long stalled frame would); the audio then runs on in real time */
    q.sim(30, .5);
    for (let i = 0; i < 120; i++) {
      await sleep(100);
      V.forEach((L, j) => G[j].push(L.g.gain.value)); M.push(S.gain);
      if (i % 10 === 5) for (const t of ["pointerdown", "touchend", "click"]) window.dispatchEvent(new Event(t));
      if (i === 70) { window.__set({weather: "lrain"}); q.sim(30, .5); }
    }
    const dips = G.map(g => g.filter((v, i) => i > 0 && i < g.length - 1 && v < .9 * Math.min(g[i - 1], g[i + 1]) && g[i - 1] > .02).length);
    Object.assign(r, {sameSource: ids.every((k, j) => A.lp[k] === V[j] && V[j].s === src[j]), starts: ids.map((k, j) => A.n[k] - n0[j]), dips,
      rainPeak: +Math.max(...G[0]).toFixed(3), rainEnd: +G[0][G[0].length - 1].toFixed(3), rainEndTarget: +(.45 * Math.min(1, Math.pow(q.WX.rain / .62, .6))).toFixed(3), masterMin: +Math.min(...M).toFixed(3), masterAt: M.indexOf(Math.min(...M)), master0: +M[0].toFixed(3), vol: S.vol});
    /* the beds themselves: no 5 ms block 9 dB under the running level (a dropout in the recording), and the loop wraps
       without a step (the jump from the last sample to the first is no bigger than an ordinary sample-to-sample change) */
    r.bed = ["dRn", "dRt", "dRn2", "dRn3", "dRt2"].map(k => { const B = A.b[k], n = B.length, d = new Float32Array(n), h = Math.round(B.sampleRate * .005), nb = Math.floor(n / h), e = [];
      for (let c = 0; c < B.numberOfChannels; c++) { const x = B.getChannelData(c); for (let i = 0; i < n; i++) d[i] += x[i] / B.numberOfChannels; }
      for (let b = 0; b < nb; b++) { let s = 0; for (let i = b * h; i < b * h + h; i++) s += d[i] * d[i]; e.push(10 * Math.log10(s / h + 1e-12)); }
      let gaps = 0; for (let b = 0; b < nb; b++) { const w = e.slice(Math.max(0, b - 40), b + 41).sort((u, v) => u - v); if (e[b] < w[w.length >> 1] - 9) gaps++; }
      let md = 0; for (let i = 1; i < n; i++) md += Math.abs(d[i] - d[i - 1]); md /= n - 1;
      return {k, seamless: !!B.seam, gaps, wrapStep: +(Math.abs(d[0] - d[n - 1]) / md).toFixed(2)}; });
    window.__set({weather: "sun", ct: "clear"}); q.freeze(true);
    return [r.bed.every(b => b.seamless && b.gaps === 0 && b.wrapStep < 4) && r.ctx === "running" && r.silentBefore.every(v => v < .01) && r.sameSource && r.starts.every(n => n === 0) && dips.every(n => n === 0) &&
      r.rainPeak > .3 && r.rainEnd < r.rainPeak && Math.abs(r.rainEnd - r.rainEndTarget) < .05 && r.masterMin >= .95 * r.vol, r];
  }));

  /* 16. the rain is heard as it is seen: the patter swells and dies with the drawn rain, from three beds of different lengths;
     the pond plinks, the palm crowns tick, single drops land close by on the sand and the cloth, and when the rain has stopped
     the cloth and fronds go on dripping for a while. Hail runs the same way: its beds start once and then only change level. */
  check("rain sound follows the rain, by surface, near drops, drips after; hail beds never restart", ...await page.evaluate(() => {
    const q = window.__desQA(), A = q.AU, T = q.TENT, r = {};
    window.__set({weather: "sun", ct: "clear", wind: .5, hailLv: 1}); q.sim(400, 1);
    /* the camera stands on open sand beside the tent, where a fair share of the ground the near drops land on (0.5-3.5 m
       round it, as the sound picks it) is the tent roof; that share is worked out with the same roof lookup */
    const onRoof = (x, z) => Math.abs(x - T.x) < 4 && Math.abs(z - T.z) < 4 && q.roofAt(x, z) > -50;
    const share = (cx, cz) => { let n = 0, t = 0, w = 0; for (let d = .55; d < 3.5; d += .1) for (let k = 0; k < 72; k++) { const a = k / 72 * Math.PI * 2, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d; n++; if (onRoof(x, z)) t++; else if (q.pN(x, z) < 1) w++; } return {roof: t / n, pond: w / n}; };
    let best = null;
    for (let k = 0; k < 24; k++) for (const d of [2, 2.5, 3, 3.5, 4, 4.5, 5]) { const a = k / 24 * Math.PI * 2, x = T.x + Math.cos(a) * d, z = T.z + Math.sin(a) * d;
      if (onRoof(x, z) || q.pN(x, z) < 1.3) continue; const S = share(x, z); if (S.pond > 0) continue;
      if (!best || Math.abs(S.roof - .4) < Math.abs(best.roof - .4)) best = {x, z, roof: S.roof}; }
    const gx = best.x, gz = best.z, gy = q.hTop(gx, gz), C = window.__C(); C.Ce.enabled = false;
    /* aimed through the tent at a point well past it, so the view controls' minimum distance does not push the camera back */
    const ux = (T.x - gx) / Math.hypot(T.x - gx, T.z - gz), uz = (T.z - gz) / Math.hypot(T.x - gx, T.z - gz);
    q.lookAt(gx, gy + 1.6, gz, gx + ux * 14, gy + .4, gz + uz * 14); q.sim(1, 1 / 10);
    /* the share is taken where the camera really is (the view controls may have nudged it) */
    const cl = q.W.worldToLocal(C.De.position.clone()); r.camOff = +Math.hypot(cl.x - gx, cl.z - gz).toFixed(2); r.camAim = +best.roof.toFixed(3); r.roofShare = +share(cl.x, cl.z).roof.toFixed(3);
    /* sampled every quarter second, so the swell at the start (well under a second to half strength) is resolved */
    const h = .25, dt = h / 3; q.audCap(true); const T0 = q.st.t, vis = [], ts = [];
    window.__set({weather: "hrain", ct: "overcast"}); for (let i = 0; i < 90 / h; i++) { q.sim(h, dt); vis.push(q.WX.rain); ts.push(q.st.t - T0); }
    const tStop = vis.length, tS = ts[tStop - 1]; window.__set({weather: "sun", ct: "clear"}); for (let i = 0; i < 150 / h; i++) { q.sim(h, dt); vis.push(q.WX.rain); ts.push(q.st.t - T0); }
    const ev = q.audCap(false), t0 = 0, tEnd = ts[ts.length - 1];
    const tgt = id => { const o = [], L = ev.filter(e => e[1] === "L" && e[2] === id); let j = 0, v = 0; for (let i = 0; i < vis.length; i++) { while (j < L.length && L[j][0] <= ts[i]) v = L[j++][4]; o.push(v); } return o; };
    const half = (a, from, up) => { const m = Math.max(...a); for (let i = from; i < a.length; i++) if (up ? a[i] >= m / 2 : a[i] < m / 2) return +ts[i].toFixed(2); return -1; };
    const au = tgt("rain"), au2 = tgt("rain2"), au3 = tgt("rain3"), vt = vis.map(v => Math.pow(Math.min(1, v / .62), .6));
    r.onsetVis = half(vt, 0, 1); r.onsetAud = half(au, 0, 1); r.stopVis = half(vt, tStop, 0); r.stopAud = half(au, tStop, 0);
    r.layers = [au, au2, au3].map(a => +Math.max(...a).toFixed(3));
    r.surf = ["rwat", "rleaf", "rtent"].map(id => +Math.max(...tgt(id)).toFixed(3));
    const shots = (k, a, b) => ev.filter(e => e[1] === "S" && e[2] === k && e[0] - t0 >= a && e[0] - t0 < b).length;
    r.near = {sand: shots("dRd1", 0, tS), tent: shots("dRd2", 0, tS)}; r.near.tentShare = +(r.near.tent / Math.max(1, r.near.sand + r.near.tent)).toFixed(3);
    const dry = ts[vis.findIndex((v, i) => i > tStop && v < .004)];
    r.dryAt = +dry.toFixed(2); r.dripsAfter = ["dDp1", "dDp2", "dDp3"].reduce((s, k) => s + shots(k, dry, tEnd + 1), 0); r.dropsAfter = shots("dRd1", dry + 1, tEnd + 1) + shots("dRd2", dry + 1, tEnd + 1);
    r.lingerEnd = (() => { let l = -1; for (const e of ev) if (e[1] === "S" && /^dDp/.test(e[2])) l = e[0] - t0; return +(l - dry).toFixed(1); })();
    /* hail, sun, hail again: every rain and hail bed that exists keeps its one source */
    const B = ["rain", "rain2", "rain3", "rtent", "rtent2", "rwat", "rleaf", "hsand", "htent", "hleaf", "hwat"];
    window.__set({weather: "hail"}); q.sim(40, 1 / 10);
    const src = B.map(k => A.lp[k] && A.lp[k].s), n0 = B.map(k => A.n[k] || 0);
    window.__set({weather: "sun", ct: "clear"}); q.sim(240, .5); window.__set({weather: "hail"}); q.sim(40, 1 / 10); window.__set({weather: "lrain"}); q.sim(30, .5);
    r.voices = B.filter((k, j) => src[j]).length; r.restarts = B.filter((k, j) => !src[j] || A.lp[k].s !== src[j] || (A.n[k] || 0) !== n0[j]);
    r.loopWrap = ["dHsd", "dHtn", "dHlf", "dHwt", "dRwt", "dRlf"].map(k => { const b = A.b[k]; if (!b) return null; const d = b.getChannelData(0), R = b.sampleRate, a = Math.round(.5 * R), e = a + Math.round(q.LL[k] * R);
      let md = 0; for (let i = a + 1; i < e; i++) md += Math.abs(d[i] - d[i - 1]); md /= e - a - 1; return +(Math.abs(d[a] - d[e - 1]) / md).toFixed(2); });
    window.__set({weather: "sun", ct: "clear"}); q.sim(400, 1); C.Ce.enabled = true;
    return [r.onsetVis > 0 && Math.abs(r.onsetAud - r.onsetVis) <= .5 && Math.abs(r.stopAud - r.stopVis) <= .5 && r.layers.every(v => v > .1) &&
      r.surf.every(v => v > .01) && r.roofShare > .2 && r.near.sand >= 30 && r.near.tent >= 30 && Math.abs(r.near.tentShare - r.roofShare) < .12 && r.dropsAfter === 0 && r.dripsAfter >= 3 && r.lingerEnd > 8 && r.lingerEnd < 60 &&
      r.voices === B.length && r.restarts.length === 0 && r.loopWrap.every(w => w !== null && w < 4), r];
  }));

  /* 17. sand covers the whole rim: the fine sand over the lip runs all the way round the island. The rim is rendered from four
     sides with and without the sand veneer; along the top of the wall just under the lip (facing the camera) the picture must
     change nearly everywhere, in every quarter. The sand falls are hidden for these shots: where one pours in front of the
     rim it hides the veneer in both renders alike, and so does the thin sand fringe spilling over the lip. */
  await page.evaluate(() => { document.body.classList.add("col", "snc"); const q = window.__desQA(); window.__set({weather: "sun", ct: "clear", wind: .35}); q.tod("day"); q.sim(5); window.__C().Ce.enabled = false;
    const m = q.sfMesh && q.sfMesh(); if (m) m.visible = false; const rf = q.sfRim && q.sfRim(); if (rf) rf.visible = false; });
  const fr = n => page.evaluate(n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
  const AZS = [.4, 2, 3.6, 5.2], rimShots = {};
  const aimRim = a => page.evaluate(a => { const q = window.__desQA(), C = window.__C(), [ex, ez] = q.edgeXZ(a, 1), h = q.hTop(ex * .97, ez * .97);
    C.De.position.copy(q.toW(ex * 1.55, h + 3, ez * 1.55)); C.Ce.target.copy(q.toW(ex, h - 1.2, ez)); C.De.lookAt(C.Ce.target); C.De.fov = 60; C.De.updateProjectionMatrix(); C.De.updateMatrixWorld(); }, a);
  for (const v of [0, 1]) {
    await page.evaluate(v => { window.__desQA().rockU.uVen.value = v; }, v);
    for (const a of AZS) { await aimRim(a); await fr(4); await sleep(300); rimShots[a + ":" + v] = await page.screenshot({encoding: "base64"}); }
  }
  for (const a of AZS) await aimRim(a);
  check("sand covers the whole rim", ...await page.evaluate(async (S, AZS) => {
    const q = window.__desQA(), C = window.__C(), cam = C.De, M = q.rock(), P = M.geometry.attributes.position, V = M.geometry.attributes.aV;
    const img = async b => { const im = await createImageBitmap(await (await fetch("data:image/png;base64," + b)).blob()), cv = new OffscreenCanvas(im.width, im.height), g = cv.getContext("2d");
      g.drawImage(im, 0, 0); return {d: g.getImageData(0, 0, im.width, im.height).data, w: im.width, h: im.height}; };
    const nR = 7 + 64, NT = (P.count - 1) / nR, r = {quarters: []}, p = new (cam.position.constructor)(), cl = new (cam.position.constructor)();
    for (const a of AZS) {
      const A = await img(S[a + ":0"]), B = await img(S[a + ":1"]), [ex, ez] = q.edgeXZ(a, 1), h = q.hTop(ex * .97, ez * .97);
      cam.position.copy(q.toW(ex * 1.55, h + 3, ez * 1.55)); C.Ce.target.copy(q.toW(ex, h - 1.2, ez)); cam.lookAt(C.Ce.target); cam.fov = 60; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
      M.updateMatrixWorld(); cl.copy(cam.position); M.worldToLocal(cl);
      let n = 0, cov = 0;
      for (let j = 0; j < NT; j++) {
        const th = j / NT * Math.PI * 2, da = Math.atan2(Math.sin(th - a), Math.cos(th - a)); if (Math.abs(da) > .45) continue;
        const k = 3 * NT + j, d = V.getX(k); if (d < .1 || d > 1.2) continue;
        p.set(P.getX(k), P.getY(k), P.getZ(k)); const ox = Math.cos(th), oz = Math.sin(th);
        if ((cl.x - p.x) * ox + (cl.z - p.z) * oz < 0) continue;
        p.applyMatrix4(M.matrixWorld).project(cam); const x = Math.round((p.x + 1) / 2 * A.w), y = Math.round((1 - p.y) / 2 * A.h);
        if (x < 3 || y < 3 || x >= A.w - 3 || y >= A.h - 3) continue;
        let md = 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const o = ((y + dy) * A.w + x + dx) * 4; md = Math.max(md, Math.abs(A.d[o] - B.d[o]) + Math.abs(A.d[o + 1] - B.d[o + 1]) + Math.abs(A.d[o + 2] - B.d[o + 2])); }
        n++; if (md > 18) cov++;
      }
      r.quarters.push({az: a, n, covered: +(cov / Math.max(1, n)).toFixed(3)});
    }
    q.rockU.uVen.value = 1; C.Ce.enabled = true; const sm = q.sfMesh && q.sfMesh(); if (sm) sm.visible = true; const rf = q.sfRim && q.sfRim(); if (rf) rf.visible = true;
    return [r.quarters.every(Q => Q.n >= 8 && Q.covered >= .9), r];
  }, rimShots, AZS));
} finally { await browser.close(); server.close(); }
if (failures.length) { console.log(`\n${failures.length} failure(s)`); process.exit(1); }
console.log("\nall desert checks ok");
