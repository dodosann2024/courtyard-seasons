// Desert regression checks: serves the repo locally, opens /desert/?debug=1 in headless Chrome and drives the simulation through
// the debug hooks (window.__desQA) to confirm that the dune deforms, wind blows sand, wind wipes footprints, the agamas still bask,
// climb, perch under the crown in rain and hide at night, and rain wets the sand, pits it and rings the lake. Then the same with
// fog lying (and the fog drifting and thinning with the wind), and snow: it lies in the ripple troughs and on lee slopes but not
// on crests or windward faces (measured on rendered pixels), the animals take cover, and it melts into wet patches that dry.
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
    const q = window.__desQA(), S = q.SAND, P0 = Float32Array.from(S.P), f0 = q.sandU.uFlowT.value;
    q.sim(2, 1 / 30);
    let dw = 0, n = 0, lit = 0;
    for (let i = 0; i < S.n; i++) {
      const dx = S.P[i * 3] - P0[i * 3], dz = S.P[i * 3 + 2] - P0[i * 3 + 2];
      if (Math.hypot(dx, dz) < 3) { dw += dx * q.WIND.x + dz * q.WIND.z; n++; }
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

  /* 5. rain darkens and pits the sand and rings the lake, and the sand dries again afterwards */
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
     and float briefly on the lake. Each surface has its own sound. The cold-blooded animals hide and the camels stand with their
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
    window.__set({weather: "sun", ct: "clear"}); q.HS.pin = null;
    q.sim(60, .25); r.coverAt60 = q.WX.hc; r.wetPeak = q.WX.hm; for (let i = 0; i < 20; i++) { q.sim(15, .5); r.wetPeak = Math.max(r.wetPeak, q.WX.hm); }
    r.coverAt360 = q.WX.hc; q.sim(900, 1); r.wetAfter = q.WX.hm; r.coldAfter = q.WX.cold;
    for (const k in r) if (typeof r[k] === "number") r[k] = +r[k].toFixed(3);
    const n = k => C[k] || 0;
    return [r.burstAfterGust && r.gust > .6 && r.windInGust > .7 && r.hail > .8 && r.rain < .05 && r.streaks > .5 && r.cover > .4 && r.pits > .4 &&
      n("sand") > 60 && n("rebound") > 10 && n("pit") > 15 && n("tent") > 5 && n("palm") > 3 && n("pond") > 5 && (!sg || n("cactus") > 1) &&
      rt > lt + .1 && n("restTr") > n("restCr") && r.tentShake > .5 && r.palmTwitch > .1 &&
      ["dHs1", "dHt1", "dHp1", "dHc1"].every(k => shots.has(k)) && ["hsand", "htent", "hleaf", "hwat"].every(k => loops.has(k)) &&
      r.cold === 1 && hid && r.camelsWalking === 0 && off.every(a => a < .45) &&
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

  /* 15. the rain sound is one continuous bed. After the first key press unlocks the audio, the rain loops are already running silent
     before any rain falls; rain, a change of intensity and taps on the screen then only move their gain, smoothly: no source
     is started again, the level never dips and recovers, and the master level does not duck on a tap. Real time, frames running. */
  await page.keyboard.press("F9");
  await page.evaluate(() => { const q = window.__desQA(); window.__set({weather: "sun", ct: "clear", wind: .5}); q.sim(120, .5); q.freeze(false); });
  await page.waitForFunction(() => { const A = window.__desQA().AU; const S = window.__sound; return A.lp.rain && A.lp.rtent && S.ctx === "running" && S.gain >= .95 * S.vol; }, {timeout: 120000, polling: 250});
  check("rain sound: one continuous bed, no dropouts, restarts or dips", ...await page.evaluate(async () => {
    const q = window.__desQA(), A = q.AU, S = window.__sound, sleep = ms => new Promise(r => setTimeout(r, ms));
    const ids = ["rain", "rtent"], V = ids.map(k => A.lp[k]), src = V.map(L => L.s), n0 = ids.map(k => A.n[k]);
    const r = {ctx: S.ctx, silentBefore: V.map(L => +L.g.gain.value.toFixed(3))}, G = ids.map(() => []), M = [];
    /* the weather is stepped ahead in one go (as a long stalled frame would); the audio then runs on in real time */
    window.__set({weather: "hrain", ct: "overcast"}); q.sim(30, .5);
    for (let i = 0; i < 120; i++) {
      await sleep(100);
      V.forEach((L, j) => G[j].push(L.g.gain.value)); M.push(S.gain);
      if (i % 10 === 5) for (const t of ["pointerdown", "touchend", "click"]) window.dispatchEvent(new Event(t));
      if (i === 70) { window.__set({weather: "lrain"}); q.sim(30, .5); }
    }
    const dips = G.map(g => g.filter((v, i) => i > 0 && i < g.length - 1 && v < .9 * Math.min(g[i - 1], g[i + 1]) && g[i - 1] > .02).length);
    Object.assign(r, {sameSource: ids.every((k, j) => A.lp[k] === V[j] && V[j].s === src[j]), starts: ids.map((k, j) => A.n[k] - n0[j]), dips,
      rainPeak: +Math.max(...G[0]).toFixed(3), rainEnd: +G[0][G[0].length - 1].toFixed(3), rainEndTarget: +(.6 * Math.min(1, Math.pow(q.WX.rain / .62, .6))).toFixed(3), masterMin: +Math.min(...M).toFixed(3), masterAt: M.indexOf(Math.min(...M)), master0: +M[0].toFixed(3), vol: S.vol});
    /* the beds themselves: no 5 ms block 9 dB under the running level (a dropout in the recording), and the loop wraps
       without a step (the jump from the last sample to the first is no bigger than an ordinary sample-to-sample change) */
    r.bed = ["dRn", "dRt"].map(k => { const B = A.b[k], n = B.length, d = new Float32Array(n), h = Math.round(B.sampleRate * .005), nb = Math.floor(n / h), e = [];
      for (let c = 0; c < B.numberOfChannels; c++) { const x = B.getChannelData(c); for (let i = 0; i < n; i++) d[i] += x[i] / B.numberOfChannels; }
      for (let b = 0; b < nb; b++) { let s = 0; for (let i = b * h; i < b * h + h; i++) s += d[i] * d[i]; e.push(10 * Math.log10(s / h + 1e-12)); }
      let gaps = 0; for (let b = 0; b < nb; b++) { const w = e.slice(Math.max(0, b - 40), b + 41).sort((u, v) => u - v); if (e[b] < w[w.length >> 1] - 9) gaps++; }
      let md = 0; for (let i = 1; i < n; i++) md += Math.abs(d[i] - d[i - 1]); md /= n - 1;
      return {k, seamless: !!B.seam, gaps, wrapStep: +(Math.abs(d[0] - d[n - 1]) / md).toFixed(2)}; });
    window.__set({weather: "sun", ct: "clear"}); q.freeze(true);
    return [r.bed.every(b => b.seamless && b.gaps === 0 && b.wrapStep < 4) && r.ctx === "running" && r.silentBefore.every(v => v < .01) && r.sameSource && r.starts.every(n => n === 0) && dips.every(n => n === 0) &&
      r.rainPeak > .3 && r.rainEnd < r.rainPeak && Math.abs(r.rainEnd - r.rainEndTarget) < .05 && r.masterMin >= .95 * r.vol, r];
  }));
} finally { await browser.close(); server.close(); }
if (failures.length) { console.log(`\n${failures.length} failure(s)`); process.exit(1); }
console.log("\nall desert checks ok");
