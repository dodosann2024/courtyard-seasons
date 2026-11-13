# snake_v3.glb (desert viper, rebuilt on the new straight Tripo mesh), built Nov 14 2026 (strike redone after review)

* File: `/workspace/desert/models/snake_v3.glb` (3.5 MB). Preview: `previews/snake_v3_clips.png` (slither / sidewind / idle_coiled / strike) and `previews/snake_v3_strike.png` (strike only, 16 frames, front/top/iso).
* Mesh: `/workspace/tripo_animals/snake_straight.glb` (levelled, was tilted 35 deg; head faces +Z), full-length, **no procedural tube**. Decimated to **20.8k tris / 12.7k verts**. Textures: Tripo PBR (basecolor, normal, roughness/metal) all 2048 JPEG (1.07 + 0.86 + 0.23 MB). A tiny forked tongue mesh (`TongueMesh`, own bone, scaled to zero when hidden) is included.
* Frame: Y up, faces +Z, metres, rest = straight, head tip z=+0.823, tail tip z=-0.399 (length 1.227 m), max body half-height 0.061 m, head top y=0.147. Left = +X.
* Clips keyed at 30 fps, all loop with seam 0.00 mm, root-stationary (move the object yourself).

## Skeleton (34 bones)
`Root` > `Head` > `Body_01` ... `Body_30` (chain, arclength-spaced joints along the body centreline); `Head` > `Jaw` (hinge at the mouth corner, rest mesh is wide open, clips close it to 24 deg), `Head` > `Tongue`.

## Clips
| clip | length | content |
|---|---|---|
| `slither` | 1.6 s | travelling lateral sine wave (amplitude grows toward the middle), every point follows the path of the head, no backwards sliding; head steady and leading; forward speed **0.425 m/s along +Z** (0.68 m per loop). |
| `sidewind` | 1.2 s | smooth rounded S-curves (max bend ~20 deg per bone, no angular kinks): lateral travelling wave plus a lift wave, only two contact patches on the ground, head hooked ~60 deg toward the travel direction; moves **0.55 m/s along +X**, perpendicular to the body axis (J-shaped tracks). Contact slide: median 12 mm, max 30 mm. |
| `idle_coiled` | 6.0 s | loose spiral coil (radius grows outward, no closed donut), head resting on the top of the coil, tail end lying outside and visible; breathing (1 cm), tongue flicks, head micro-motion. |
| `strike` | 3.0 s | viper strike from the idle coil (clip starts and ends in the `idle_coiled` pose, rear 0.5 m of the body stays pinned to the coil): 0-0.8 s the front 0.75 m of the body unwinds into a low S-shaped neck beside the coil (head axis 8.5 cm, neck crest 9.7 cm above the ground, minimum bend radius ~8 cm), 0.8-1.4 s tense hold with small sway and a tongue flick, **lunge 1.40-1.58 s (0.18 s) of 0.40 m (33 % of body length)** along the heading described below with the jaw snapping open (fully open at contact, 1.56-1.64 s) at the end of the lunge, 1.58-1.66 s contact hold, 1.66-1.90 s rapid retraction back into the S, 1.9-2.3 s hold, 2.3-3.0 s S re-coils into the idle pose. |

## three.js
```js
const s = await loader.loadAsync('models/snake_v3.glb');   // faces +Z
const mixer = new THREE.AnimationMixer(s.scene);
mixer.clipAction(THREE.AnimationClip.findByName(s.animations,'slither')).play();
s.scene.position.addScaledVector(new THREE.Vector3(0,0,1), 0.425*dt);          // slither
// sidewind: s.scene.position.x += 0.55*dt
```

## Verification
* three.js (node, 34 bones, textures present): seam 0.00 mm all clips; per-frame max vertex step: slither 10 mm, sidewind 37 mm, idle_coiled 4 mm, strike 137 mm (the strike itself, 30 fps).
* Ground: min y -0.002 (slither), -0.003 (idle, sidewind, strike). The strike's earlier 18 mm dip is gone: it came from the head-pinned chain solver drifting at the arm/coil junction; the strike now solves the chain with a floor (joint axis >= body half-height) and the rear joints pinned to the coil, so every joint is on/above its ground height (min joint - ground height = 0.0 mm, checked on all 91 frames). Highest point of the body in the strike (head top) 0.146 m, no higher than the idle clip (0.141).
* Blender BVH self-overlap: slither/sidewind/idle near the straight-mesh baseline (~900 pairs); the new strike was checked visually (no knotted neck) with solver-level clearance >= 11.5 cm between non-adjacent body parts in the cock and strike shapes, but the BVH count was not re-run.
* The other three clips are bit-identical to the accepted build (animation accessor data diffed against the previous GLB: max abs difference 0).
* Montage rendered from the re-imported GLB, looked at frame by frame.

## Honest remaining issues
* **Strike heading**: the free direction beside the coil is toward -X (the model's right side, ~12 deg toward +Z), not +Z. In the clip frame (glTF x, y, z) the head goes from (-0.28, 0.085, -0.11) m at the cock to (-0.67, 0.062, -0.03) m at contact. To aim the strike at a target, yaw the object about Y: +90 deg turns the -X strike heading into +Z. The idle coil is unchanged, so idle -> strike -> idle blends without a pop.
* Strike lunge is 0.40 m (33 %) only because the S-neck is wide in plan (about 0.25 m to the side of the lunge line, ~0.3 m long); the 12 cm thick body cannot fold tighter without self-intersecting. The neck S is planar-ish with a 1-2 cm hump; the head is not tucked 'under' the neck.
* Sidewind travels exactly perpendicular to the body axis; the head hook is 60 deg and contact patches slide 12 mm on average.
* The rest mesh has a wide-open mouth; clips close the jaw to 24 deg (teeth start to poke out at more).
* Head and neck are thick relative to the body (Tripo proportions).
* No scale-level motion; skin is linear-blend skinning.
