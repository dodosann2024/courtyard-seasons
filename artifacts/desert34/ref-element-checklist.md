# desert34 — eagle_v3 + snake_v3

**HOLD MERGE.** From desert33 (camel_v3). Eagle + snake only; camel/water/terrain/sky/props unchanged.

## Eagle (`eagle_v3.glb` + `eagle_perch_v2.glb`)
- Clips: flap 0.4s, glide 4s, landing_flare 2s (baked −0.6 m / +1.0 m), take_off 1.8s
- Perch: perch_idle / drink on perch mesh; swap at touchdown / take-off
- Flight: mostly glide, banked thermals, flap when climbing; crossfade 0.3–0.4 s
- Land: host at tip so flare ends with talons on saguaro; drink on shore with beak ≈ water

## Snake (`snake_v3.glb`)
- slither 0.425 m/s (+Z), sidewind 0.55 m/s (+X), idle_coiled — **no strike**
- Exact clip speeds; raycast terrain hug; smooth heading; sidewind on dune faces

## Camel
camel_v3 regression via `camel-walk.mp4`
