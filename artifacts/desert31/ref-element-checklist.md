# desert31 motion check

**HOLD MERGE — READY.** From desert30 (water edge / terrain / sky / props identical).

## Mixer / capture path
Verified: `qa.step(dt)` → `update(dt)` → `rig.mixer.update(dt)` every frame.
`bone-transform-check.json` shows limb / wing / snake-segment transforms **differ across 0.25 s samples** (`pass: true`). Desert30’s “statue” look was largely incomplete Tripo tracks (front legs static bind) + graze pitching `spines[0]` (whole-body tilt), not a dead mixer.

## Fixes
1. **Camel** — strip `tripoRoot.position`; procedural pace on all limb chains AFTER mixer; stride-synced speed; heading ≤60°/s; graze/drink = neck+head only, root pitch/roll locked 0.
2. **Eagle** — fly mesh always; procedural flap (Z-primary) / glide / fold (+ wing-bone scale tuck on perch); perch tip from live saguaro AABB; seat feet via foot-band (not raw bbox min).
3. **Snake** — fully procedural spline path + travelling wave; dense tapered overlapping spheres; tongue flick; no Tripo GLB.

## Deliverables
30 fps h264 1280×720 videos + 3 strips/animal (8 frames @ 0.25 s) + bone check JSON.

## Pending Tripo v2
`camel_v2` (walk/idle/graze/drink) and `eagle_v2` (flap/glide/land/perch/drink) will replace procedural overlays. Current Tripo wing local axes still make flap/fold hard to read visually even when bone eulers change — v2 clips are the real fix.
