// The camel drink close-up probe, made deterministic (d177). Shared by d177-proof.mjs (drink mode) and any longer session.
//
// d172's gshots probe sampled the mouth on every frame that the drink clip's getEffectiveWeight() read over 0.9 and stopped at
// the first 3 cm rise or after 60 s, keeping whatever it had. It never checked that the clip was running (a stopped action keeps
// reporting its last weight), that camelGo found a path, or that the drink ran to the bottom of the dip, and it took the session as
// it found it (time of day, weather, wind, the orbit controls, a.tries). Any session that cuts the dip short leaves it with a
// mid-descent sample (the mouth passes 0.83 m over the water ~0.5 s into the dip) and frames the close-up there.
//
// This probe sets the scene to a fixed state first (clear day, wind 0.35, orbit controls off, the other camel lying at its rest
// spot, the camel's retries and animation state cleared), requires camelGo to succeed, samples only while the drink clip is
// running at full weight, takes the lowest mouth over a fixed 4 s window from that moment, and fails with a reason (no path,
// never drank, interrupted) instead of returning a partial dip. The camera is checked to be where it was put.
export const drinkProbe = (page, opts = {}) => page.evaluate(o => {
  const q = window.__desQA(), C = window.__C(), a = q.ANIM.camels[o.camel || 0], b = q.ANIM.camels[1 - (o.camel || 0)], V = q.W.position.constructor;
  const before = {phase: q.st.phase, wind: +(q.st.wn ?? q.pondU.uWind.value).toFixed(2), rain: +q.WX.rain.toFixed(2), snow: +q.WX.sc.toFixed(2), ice: +q.WX.ice.toFixed(2),
    shel: q.WX.shel, ce: C.Ce.enabled, tries: a.tries || 0, cur: a.r.cur, staleDrinkW: +a.r.acts.drink.getEffectiveWeight().toFixed(2), drinkRunning: a.r.acts.drink.isRunning(), t: +q.st.t.toFixed(0)};
  window.__set({weather: "sun", ct: "clear", wind: .35}); q.tod("day"); q.sim(2, .25); q.PA.noView = 1; C.Ce.enabled = false;
  const head = a.mdl.getObjectByName("tripoHead_0"), vs = [];
  a.mdl.traverse(m => { if (!m.isSkinnedMesh) return; const sk = m.skeleton, ids = new Set(); head.traverse(x => { const i = sk.bones.indexOf(x); if (i >= 0) ids.add(i); });
    const g = m.geometry, si = g.attributes.skinIndex, sw = g.attributes.skinWeight; for (let i = 0; i < g.attributes.position.count; i++) { let w = 0; for (let j = 0; j < 4; j++) if (ids.has(si.getComponent(i, j))) w += sw.getComponent(i, j); if (w > .5) vs.push([m, i]); } });
  const v = new V(), mouth = () => { a.g.updateMatrixWorld(true); let lo = null; for (const [m, i] of vs) { m.getVertexPosition(i, v); v.applyMatrix4(m.matrixWorld); q.W.worldToLocal(v); if (!lo || v.y < lo.y) lo = {x: v.x, y: v.y, z: v.z}; } return lo; };
  const R = q.REST[b.i]; Object.assign(b, {x: R.x, z: R.z, yaw: R.yaw, mode: "rest", job: "kneel", k: 1, timer: 1e9, spd: 0, yr: 0, path: null, gy: null, goal: R});
  for (const k in b.r.acts) b.r.acts[k].stop(); b.r.fd = null; b.r.cur = null; q.fn.play(b.r, "kneel_rest", .01, 1);
  const sp = q.drinkSpot(a), sx = sp.x - Math.sin(sp.yaw) * 3, sz = sp.z - Math.cos(sp.yaw) * 3;
  Object.assign(a, {x: sx, z: sz, yaw: sp.yaw, k: 0, spd: 0, yr: 0, path: null, pi: 0, gy: null, mode: "job", job: "idle", timer: 1e9, face: null, tries: 0, stuck: 0});
  for (const k in a.r.acts) a.r.acts[k].stop(); a.r.fd = null; a.r.cur = null; q.fn.play(a.r, "idle", .01, 1); q.step(5, 1 / 30);
  const res = {before, stand: {x: +sp.x.toFixed(3), z: +sp.z.toFixed(3)}};
  if (!q.fn.camelGo(a, sp, "drink")) return {...res, ok: false, why: "no path to the drink stand"};
  const dr = a.r.acts.drink, WIN = 120; let lo = null, t0 = -1, f = 0, walk = 0;
  for (; f < 30 * 90; f++) { q.step(1, 1 / 30);
    if (a.mode === "walk" || a.mode === "turn") { walk++; if (t0 >= 0) return {...res, ok: false, why: "re-planned mid-dip", at: f}; continue; }
    if (a.mode !== "job" || a.job !== "drink") return {...res, ok: false, why: t0 < 0 ? `never drank (${a.mode}/${a.job})` : `interrupted mid-dip (${a.mode}/${a.job})`, at: f};
    a.timer = 1e9; const w = dr.isRunning() ? dr.getEffectiveWeight() : 0;
    if (t0 < 0) { if (w > .9) t0 = f; else continue; }
    const m = mouth(); if (!lo || m.y < lo.y) lo = m;
    if (f - t0 >= WIN) break; }
  if (!lo || f - t0 < WIN) return {...res, ok: false, why: "drink never reached full weight", at: f};
  const dW = lo.y - q.POND.wy, over = q.pN(lo.x, lo.z) < 1, c = Math.cos(a.yaw), n = Math.sin(a.yaw), want = [lo.x + c * 2.3 - n * .6, lo.y + .55, lo.z - n * 2.3 - c * .6];
  q.lookAt(...want, lo.x, lo.y + .12, lo.z); q.step(1, 1 / 30);
  const e = new V().copy(C.De.position); q.W.worldToLocal(e); const camOff = Math.hypot(e.x - want[0], e.y - want[1], e.z - want[2]);
  return {...res, ok: over && Math.abs(dW) <= .05 && camOff < .05, dW: +dW.toFixed(3), overWater: over, mouth: {x: +lo.x.toFixed(3), y: +lo.y.toFixed(3), z: +lo.z.toFixed(3)},
    walkFrames: walk, dipStartFrame: t0, sampledFrames: WIN, camOffM: +camOff.toFixed(3), cam: want.map(x => +x.toFixed(2))};
}, opts);

/* d172's probe as it was (for the record next to the new one, in the same session) */
export const oldProbe = (page, budget) => page.evaluate(B => {
  const q = window.__desQA(), a = q.ANIM.camels[0], o = q.ANIM.camels[1], V = q.W.position.constructor, job = "drink"; q.tod("day"); q.PA.noView = 1;
  const head = a.mdl.getObjectByName("tripoHead_0"), vs = [];
  a.mdl.traverse(m => { if (!m.isSkinnedMesh) return; const sk = m.skeleton, ids = new Set(); head.traverse(x => { const i = sk.bones.indexOf(x); if (i >= 0) ids.add(i); });
    const g = m.geometry, si = g.attributes.skinIndex, sw = g.attributes.skinWeight; for (let i = 0; i < g.attributes.position.count; i++) { let w = 0; for (let j = 0; j < 4; j++) if (ids.has(si.getComponent(i, j))) w += sw.getComponent(i, j); if (w > .5) vs.push([m, i]); } });
  const v = new V(), mouth = () => { a.g.updateMatrixWorld(true); let lo = null; for (const [m, i] of vs) { m.getVertexPosition(i, v); v.applyMatrix4(m.matrixWorld); q.W.worldToLocal(v); if (!lo || v.y < lo.y) lo = {x: v.x, y: v.y, z: v.z}; } return lo; };
  Object.assign(o, {x: 14.2, z: 2.6, mode: "rest", job: "kneel", k: 1, timer: 1e9, path: null, goal: null});
  const sp = q.drinkSpot(a), yaw = sp.yaw, sx = sp.x - Math.sin(yaw) * 3, sz = sp.z - Math.cos(yaw) * 3;
  Object.assign(a, {x: sx, z: sz, yaw, k: 0, spd: 0, yr: 0, path: null, gy: null, mode: "job", job: "idle", timer: 1e9, face: null});
  for (const k in a.r.acts) a.r.acts[k].stop(); a.r.fd = null; a.r.cur = null; q.fn.play(a.r, "idle", .01, 1); q.step(5, 1 / 30);
  q.fn.camelGo(a, sp, job); let lo = null, i = 0;
  for (; i < B; i++) { q.step(1, 1 / 30); if (a.mode === "job" && a.job === job) { a.timer = 1e9; const w = a.r.acts.drink.getEffectiveWeight(); if (w > .9) { const m = mouth(); if (!lo || m.y < lo.y) lo = m; else if (lo && m.y > lo.y + .03) break; } } }
  return lo ? {dW: +(lo.y - q.POND.wy).toFixed(3), endFrame: i, budget: B} : {none: 1, budget: B};
}, budget || 1800);
