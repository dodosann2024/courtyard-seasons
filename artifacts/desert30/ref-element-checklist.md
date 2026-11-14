# desert30 ref-element checklist

**HOLD MERGE — READY.** From desert29; only motion proof + water depth occlusion + true camel idle.

| Element | Target | Status |
|---|---|---|
| Terrain / sky / lighting / tent / palms / cacti | identical to desert29 | keep |
| Water spit hidden, no crater | spit verts below waterY; no terrain bowl edit | keep |
| Water edge occlusion | `depthTest:true`, `depthWrite:false` + shore-tight polygon; grass `depthWrite:true` | fixed (tint_ratio 0.22→0.08) |
| Camel idle | freeze walk on calibrated stand frame + breath/head/tail/chew — **no in-place walk** | fixed |
| Camel walk | pace intent + ground plant; Tripo clip constraints below | attempt |
| Videos | 30fps h264 yuv420p 1280×720: walk/graze/drink/eagle/snake + 20s overview | shipped |

## Motion quality (honest — re-rig via Tripo if needed)

`camel_rigged.glb` only ships `preset:quadruped:walk`. Front-leg tracks are largely static bind keys; only rear limbs + spine animate meaningfully. Idle therefore freezes a calibrated walk frame (feet most level) and overlays procedural breath/head/tail — not a purpose-built idle clip. Graze/drink neck bend is local-euler on Tripo spine axes (quirky rests ~±2.7 rad) so head-to-ground motion stays limited. True pacing, planted front feet, and natural graze/drink need separate **walk (pace)**, **idle**, **graze**, and **drink** clips with full limb coverage.

Eagle: soar → landPerch → drink scripted in `eagle.mp4`. Snake: procedural travelling-wave (Tripo serpentine clip stays off — rigid wobble).
