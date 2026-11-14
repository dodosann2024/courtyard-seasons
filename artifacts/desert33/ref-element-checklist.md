# desert33 — camel_v3

**HOLD MERGE.** From desert32. Camel only → `camel_v3.glb`. Eagle/snake/water/terrain/sky/props unchanged.

## vs camel_v2
| | v2 | v3 |
|---|---|---|
| body height | walk 0.10 m lower | **same across all clips** (no sink compensation) |
| walk speed | 1.026 m/s | **0.989 m/s × timeScale** |
| graze | 6 s | **9 s** |
| drink | 6 s | **7 s** |
| walk↔idle xfade | 0.5 s | **0.3–0.5 s** (hoof spots differ) |

## Playback (unchanged rules)
- Shared AnimationMixer per camel; `mixer.update(dt)` every live + capture frame
- No foot sliding; heading slerp ≤60°/s; no host root pitch on graze/drink
- Drink: feet on shore, muzzle ≈ water (0.15 m above feet)
- 3 camels, desynchronised phases, raycast ground snap

## Bone check
`bone-transform-check.json` — `pass: true`, mps=0.989
