# desert32 — camel_v2

**HOLD MERGE.** From desert31. Camel only swapped; eagle/snake/water/terrain/sky/props unchanged.

## Model
`assets/models/camel_v2.glb` — Tripo-rigged, 7.8k tris, 34 bones, Y-up, faces +Z, metres.
Clips: `walk` (1.1 s, 1.026 m/s), `idle` / `graze` / `drink` (6 s). Notes in `desert/camel_v2/`.

## Playback
- One `AnimationMixer` per camel; `mixer.update(dt)` every live + capture frame via `qa.step` → `update`.
- Root speed = `1.026 × fitScale × timeScale` (natural scale ≈1). Walk body dip (−0.10 m) left as baked.
- Clip transitions: 0.5 s `crossFadeTo`. Heading slerp ≤60°/s. Host root pitch/roll locked 0 (clips own the bow).
- Behaviour: walk → idle 4–10 s → graze on dry-grass tufts; one drinker seeks shore so muzzle ≈ water (0.15 m above feet).
- 3 camels, desynchronised phases, raycast ground snap.

## Bone check
`bone-transform-check.json` — limb/neck quats differ across 0.25 s samples (`pass: true`).

## Deliverables
30 fps: camel-walk / camel-graze / camel-drink / overview + 3×8-frame strips each + stills.
