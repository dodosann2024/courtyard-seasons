# snake_v3.glb (desert viper, rebuilt on the new straight Tripo mesh), built Nov 14 2026

* File: `/workspace/desert/models/snake_v3.glb` (3.5 MB). Preview: `previews/snake_v3_clips.png` (slither / sidewind / idle_coiled / strike, top + side + iso rows).
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
| `strike` | 3.6 s | from the S-coil: cock (t 1.0-1.6 s, tense sway, S-shaped neck, head down-forward), strike 1.60-1.72 s (head moves ~0.45 m forward, jaw snaps fully open and shut), hold, recover 2.1-3.6 s back into the coil. |

## three.js
```js
const s = await loader.loadAsync('models/snake_v3.glb');   // faces +Z
const mixer = new THREE.AnimationMixer(s.scene);
mixer.clipAction(THREE.AnimationClip.findByName(s.animations,'slither')).play();
s.scene.position.addScaledVector(new THREE.Vector3(0,0,1), 0.425*dt);          // slither
// sidewind: s.scene.position.x += 0.55*dt
```

## Verification
* three.js (node, 34 bones, textures present): seam 0.00 mm all clips; per-frame max vertex step: slither 10 mm, sidewind 37 mm, idle_coiled 4 mm, strike 169 mm (the strike itself, 30 fps).
* Ground: min y -0.002 (slither), -0.003 (idle, sidewind); strike: body dips up to 18 mm below y=0 during the cock transition (t 0.2-0.8 s and 3.0-3.5 s) - not fixed (a 12 cm thick body half-buried by 1.8 cm in sand).
* Blender BVH self-overlap: slither/sidewind/idle near the straight-mesh baseline (~900 pairs); strike frames cock/retract 682-1949.
* Montage rendered from the re-imported GLB, looked at frame by frame.

## Honest remaining issues
* Strike cock/retract frames have elevated self-intersection (up to ~2x baseline) where the S-coil folds on itself.
* Sidewind travels exactly perpendicular to the body axis; the head hook is 60 deg and contact patches slide 12 mm on average.
* The rest mesh has a wide-open mouth; clips close the jaw to 24 deg (teeth start to poke out at more).
* Head and neck are thick relative to the body (Tripo proportions).
* No scale-level motion; skin is linear-blend skinning.
