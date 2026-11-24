// Desert d172 proof helpers (not part of CI): a local server + headless Chrome on any checkout, and the in-page probes that
// the proof script installs on window.__d172:
//   prints  every new footprint decal as it is written into the print instance buffer (works on any build: it only reads PR)
//   feet    each animal's feet as sets of skinned vertices (the foot bone and its children), skinned on the CPU every frame; a
//           contact is a run of frames in which the sole is on the sand (lowest vertex within a few mm..cm of hTop) and still
//           (moving under a third of the body's speed). Its place is the centroid of the sole vertices within a band of the lowest.
//   mouth   the lowest vertex of a camel's head (its lips and chin when the head is down)
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import {execFile} from "node:child_process";
import puppeteer from "puppeteer-core";

export const ffmpeg = args => new Promise((res, rej) => execFile("ffmpeg", ["-y", "-loglevel", "error", ...args], {maxBuffer: 1e8}, (e, _o, se) => e ? rej(new Error(String(se).slice(-500))) : res()));
const TYPES = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png",
  ".jpg": "image/jpeg", ".webp": "image/webp", ".ktx2": "image/ktx2", ".glb": "model/gltf-binary", ".mp3": "audio/mpeg", ".m4a": "audio/mp4",
  ".ogg": "audio/ogg", ".wasm": "application/wasm", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".bin": "application/octet-stream"};
const CHROME = process.env.CHROME || ["/usr/bin/google-chrome-stable", "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/local/bin/google-chrome"].find(p => fs.existsSync(p));
export const sleep = ms => new Promise(r => setTimeout(r, ms));

export async function openScene(ROOT, W = 1280, H = 720) {
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (p.endsWith("/")) p += "index.html";
    const f = path.join(ROOT, p);
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, {"content-type": TYPES[path.extname(f)] || "application/octet-stream", "cache-control": "no-store"});
    fs.createReadStream(f).pipe(res);
  });
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const browser = await puppeteer.launch({executablePath: CHROME, headless: "new", protocolTimeout: 3600000,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader", "--mute-audio"]});
  const page = await browser.newPage();
  page.on("console", m => { const t = m.type(); if (t === "error") console.log("PAGE", t, m.text().slice(0, 240)); });
  page.on("pageerror", e => console.log("PAGEERR", String(e).slice(0, 300)));
  await page.setViewport({width: W, height: H, deviceScaleFactor: 1});
  await page.goto(`http://127.0.0.1:${server.address().port}/desert/?nosw=1&debug=1`, {waitUntil: "domcontentloaded", timeout: 120000});
  await page.waitForFunction(() => window.__ready && window.__desReady && window.__desQA && window.__desQA().ready, {timeout: 600000, polling: 500});
  const E = (f, ...a) => page.evaluate(f, ...a);
  await E(() => { document.body.classList.add("col", "snc"); for (const s of [".t", "#fab", "#sbtn", "#tp", "#ld"]) { const n = document.querySelector(s); if (n) n.style.display = "none"; }
    const q = window.__desQA(), C = window.__C(); q.freeze(true); window.__set({mode: "manual"}); q.tod("day"); window.__set({weather: "sun", ct: "clear", wind: .4}); C.Ce.enabled = false; q.sim(5); });
  await E(installProbes);
  const frames = n => E(n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
  const shot = async file => { await frames(3); await sleep(60); await page.screenshot({path: file, type: "png"}); console.log("shot", file); };
  const cap = text => E(text => {
    let d = document.getElementById("d172cap");
    if (!text) { if (d) d.remove(); return; }
    if (!d) { d = document.createElement("div"); d.id = "d172cap"; document.body.appendChild(d); }
    d.textContent = text;
    d.style.cssText = "position:fixed;left:18px;bottom:16px;right:18px;z-index:50;pointer-events:none;font:600 20px 'WenQuanYi Micro Hei','Droid Sans Fallback',sans-serif;color:#fff;letter-spacing:.02em;text-shadow:0 1px 2px #000,0 0 4px #000";
  }, text || "");
  return {page, E, frames, shot, cap, bundle: await E(() => window.CY && window.CY.desert), close: async () => { await browser.close(); server.close(); }};
}

/* runs in the page */
function installProbes() {
  const q = window.__desQA(), V = q.W.position.constructor, M4 = q.W.matrix.constructor, v = new V(), m4 = new M4();
  const D = window.__d172 = {};
  /* ---- prints ---- */
  const KIND = ["dromedary", "bactrian", "eagle", "wing", "lie", "ostrich", "tortoise", "gerbil", "scorpion", "pallet", "hole"];
  D.KIND = KIND;
  D.pr = {last: q.PR.i, list: []};
  D.prPoll = () => { const P = q.PR, im = P.im, e = m4.elements, c = im.instanceColor.array;
    for (let i = D.pr.last; i !== P.i; i = (i + 1) % P.N) { im.getMatrixAt(i, m4);
      const k = Math.floor(c[i * 3] + .001), vv = Math.round((c[i * 3] - k) * 4), det = e[0] * e[10] - e[2] * e[8];
      D.pr.list.push({k, sp: KIND[k], v: vv, x: e[12], z: e[14], hd: Math.atan2(e[8], e[10]), mir: det < 0 ? 1 : 0, t: q.st.t}); }
    D.pr.last = P.i; };
  D.prReset = () => { D.pr.last = q.PR.i; D.pr.list = []; };
  /* ---- feet ---- */
  const skins = root => { const L = []; root.traverse(o => { if (o.isSkinnedMesh && o.visible !== false) L.push(o); }); return L; };
  const vertsOf = (root, bones, cap) => { const out = [];
    for (const m of skins(root)) { const sk = m.skeleton, ids = new Set(bones.map(b => sk.bones.indexOf(b)).filter(i => i >= 0)); if (!ids.size) continue;
      const g = m.geometry, si = g.attributes.skinIndex, sw = g.attributes.skinWeight, n = g.attributes.position.count;
      for (let i = 0; i < n; i++) { let w = 0; for (let k = 0; k < 4; k++) if (ids.has(si.getComponent(i, k))) w += sw.getComponent(i, k); if (w > .5) out.push([m, i]); } }
    if (out.length > cap) { const s = out.length / cap, o = []; for (let j = 0; j < cap; j++) o.push(out[Math.floor(j * s)]); return o; }
    return out; };
  const desc = b => { const L = [b]; b.traverse(c => { if (c !== b && c.isBone) L.push(c); }); return L; };
  const bn = (A, n) => A.bn && A.bn[n];
  /* per species: tolerance for "on the sand" (m), the band of sole vertices whose centroid is the contact, lift to end it.
     The tortoise's planted foot rests ~1.5 cm over hTop and dips under 1 cm only as it pushes off, so its contact is
     the still foot within 1.9 cm.
     td: the gait slides the planted foot along (the tortoise's short crawl, the gerbil's hop in place), so a contact is the
     touchdown itself: the sole coming back onto the sand after a lift, placed where it first touches. */
  const SP = {dromedary: {on: .03, band: .02, lift: .05}, bactrian: {on: .03, band: .02, lift: .05}, ostrich: {on: .03, band: .015, lift: .05},
    tortoise: {on: .019, band: .006, lift: .024, still: .03}, gerbil: {on: .008, band: .004, lift: .012, td: 1}, scorpion: {on: .005, band: .002, lift: .008}, eagle: {on: .03, band: .015, lift: .05}};
  D.SP = SP;
  D.animals = () => { const A = [];
    q.ANIM.camels.forEach(a => A.push({sp: a.i ? "bactrian" : "dromedary", o: a, root: a.mdl, spd: () => a.spd,
      feet: a.feet.map(f => ({bones: [f.b, f.b.parent], side: f.R ? "R" : "L", end: f.hind ? "hind" : "fore"}))}));
    for (const o of q.PA.os) if (o.rig) A.push({sp: "ostrich", o, root: o.mdl, spd: () => o.v, feet: ["L", "R"].map(s => ({bones: [bn(o, "foot" + s), ...desc(bn(o, "toe_main" + s)), ...desc(bn(o, "toe_outer" + s))].filter(Boolean), side: s, end: "hind"}))});
    for (const o of q.PA.tt) if (o.rig) A.push({sp: "tortoise", o, root: o.g, spd: () => o.v, feet: [["handL", "L", "fore"], ["handR", "R", "fore"], ["footL", "L", "hind"], ["footR", "R", "hind"]].map(([n, s, e]) => ({bones: desc(bn(o, n)), side: s, end: e}))});
    for (const o of q.PA.gb) if (o.rig) A.push({sp: "gerbil", o, root: o.g, spd: () => o.v, feet: [["footL", "L", "hind"], ["footR", "R", "hind"], ["handL", "L", "fore"], ["handR", "R", "fore"]].map(([n, s, e]) => ({bones: desc(bn(o, n)), side: s, end: e}))});
    for (const o of q.PA.sc) if (o.rig) A.push({sp: "scorpion", o, root: o.g, spd: () => o.v, feet: [1, 2, 3, 4].flatMap(k => ["L", "R"].map(s => ({bones: [bn(o, `leg${k}${s}foot`)], side: s, end: k < 3 ? "fore" : "hind", leg: k})))});
    const e = q.ANIM.eagle; if (e) A.push({sp: "eagle", o: e, root: e.g, spd: () => 0, feet: ["L", "R"].map(s => { const b = e.g.getObjectByName("Foot_" + s); return {bones: b ? desc(b) : [], side: s, end: "hind"}; })});
    return A; };
  D.track = {on: [], contacts: []};
  D.trackStart = (filter, cap) => { D.track.on = D.animals().filter(a => !filter || filter.includes(a.sp)).map(a => ({...a,
      feet: a.feet.map(f => ({...f, vs: vertsOf(a.root, f.bones, cap || 260), st: 0, c: null, px: null, pz: null, up: 1}))})); D.track.contacts = []; };
  D.trackStep = dt => { for (const a of D.track.on) { const S = SP[a.sp]; a.root.updateMatrixWorld(true); const bs = Math.abs(a.spd());
    for (const f of a.feet) { if (!f.vs.length) continue; let lo = 1e9; const P = [];
      for (const [m, i] of f.vs) { m.getVertexPosition(i, v); v.applyMatrix4(m.matrixWorld); q.W.worldToLocal(v); const g = v.y - q.hTop(v.x, v.z); P.push(v.x, v.z, g); if (g < lo) lo = g; }
      let cx = 0, cz = 0, n = 0; for (let j = 0; j < P.length; j += 3) if (P[j + 2] < lo + S.band) { cx += P[j]; cz += P[j + 1]; n++; } cx /= n; cz /= n;
      const fs = f.px == null || dt <= 0 ? 0 : Math.hypot(cx - f.px, cz - f.pz) / dt; f.px = cx; f.pz = cz;
      const still = S.td || fs < Math.max(.33 * bs, S.still || .02), on = lo < S.on && still && (!S.td || f.up);
      if (lo > S.lift) f.up = 1;
      if (!f.c && on) f.up = 0, f.c = {td: S.td, sp: a.sp, id: q.ANIM.camels.includes(a.o) ? a.sp : a.sp + (a.o.male != null ? (a.o.male ? "♂" : "♀") : ""), side: f.side, end: f.end, leg: f.leg, t0: q.st.t, t1: q.st.t, x0: cx, z0: cz, sx: 0, sz: 0, n: 0, gap: lo, obj: a.o};
      if (f.c) { if (lo > S.lift || (!S.td && fs > Math.max(.8 * bs, .05))) { if (f.c.n) D.track.contacts.push(f.c); f.c = null; }
        else { f.c.t1 = q.st.t; f.c.sx += cx; f.c.sz += cz; f.c.n++; f.c.gap = Math.min(f.c.gap, lo); } }
      f.lo = lo; f.fs = fs; } } };
  D.trackEnd = () => { for (const a of D.track.on) for (const f of a.feet) if (f.c) { if (f.c.n) D.track.contacts.push(f.c); f.c = null; }
    return D.track.contacts.map(c => ({...c, x: c.td ? c.x0 : c.sx / c.n, z: c.td ? c.z0 : c.sz / c.n, obj: undefined})); };
  /* every footprint against the contacts of its species: the nearest one in time (its run, give or take .25 s) and place */
  D.match = (prints, contacts, win) => { win = win || .25; const FOOT = new Set(["dromedary", "bactrian", "eagle", "ostrich", "tortoise", "gerbil", "scorpion"]);
    const out = []; for (const p of prints) { if (!FOOT.has(p.sp)) continue; let best = null, bd = 1e9;
      for (const c of contacts) { if (c.sp !== p.sp || p.t < c.t0 - win || p.t > c.t1 + win) continue; const d = Math.hypot(p.x - c.x, p.z - c.z); if (d < bd) { bd = d; best = c; } }
      const rock = q.OBST.some(o => o.k === "rock" && Math.hypot(o.x - p.x, o.z - p.z) < o.r * .9), water = q.pN(p.x, p.z) < 1 || q.hTop(p.x, p.z) < q.POND.wy + .01;
      out.push({sp: p.sp, t: +p.t.toFixed(3), x: +p.x.toFixed(3), z: +p.z.toFixed(3), v: p.v, mir: p.mir, off: best ? +bd.toFixed(4) : null,
        foot: best ? best.side + "-" + best.end + (best.leg ? best.leg : "") : null, dt: best ? +(p.t - best.t0).toFixed(3) : null, water, rock}); }
    return out; };
  /* ---- a camel's mouth: the lowest of the head's vertices ---- */
  D.mouthVs = a => a._mv || (a._mv = vertsOf(a.mdl, a.mdl.getObjectByName("tripoHead_0") ? desc(a.mdl.getObjectByName("tripoHead_0")) : [], 2000));
  D.mouth = a => { a.g.updateMatrixWorld(true); let lo = null; for (const [m, i] of D.mouthVs(a)) { m.getVertexPosition(i, v); v.applyMatrix4(m.matrixWorld); q.W.worldToLocal(v); if (!lo || v.y < lo.y) lo = {x: v.x, y: v.y, z: v.z}; } return lo; };
  /* the edible tufts: every live instance of the oasis's grass, clump and dry-tuft meshes (VEG order: 3 grass, 3 clump, 3 dry) */
  D.tufts = () => { const L = [], e = m4.elements; const veg = q.VEG || null; let list = veg;
    if (!list) { list = []; q.W.traverse(o => { if (o.isInstancedMesh && o.geometry.attributes.color && o.material && o.material.vertexColors && o.count > 5) list.push(o); }); list = list.slice(0, 9); }
    else list = list.filter(im => im.userData.eat || (!veg.some(x => x.userData.eat) && veg.indexOf(im) < 9));
    for (const im of list) for (let i = 0; i < im.count; i++) { im.getMatrixAt(i, m4); if (Math.hypot(e[0], e[1], e[2]) > 1e-4) L.push({x: e[12], z: e[14], h: Math.hypot(e[4], e[5], e[6])}); }
    return L; };
}
