# eagle_v3.glb (flying golden eagle, rebuilt on the new Tripo mesh), built Nov 14 2026

* File: `/workspace/desert/models/eagle_v3.glb` (3.0 MB). Preview: `previews/eagle_v3_clips.png` (flap / glide / landing_flare / take_off, 7 frames each, front + side + iso/top rows).
* Mesh: `/workspace/tripo_animals/eagle_flight.glb` (47.6k tris) levelled (wing plane was tilted 31 deg about X), scaled x2.15 so the span is 2.1 m, decimated to **17,123 tris / 11,755 verts**, plus a small `EagleLegs` mesh (**762 tris / 684 verts**). Total 17.9k tris, 38 bones, 2 skinned meshes.
* Textures: Tripo PBR kept (basecolor 2048 JPEG q84, normal 2048 JPEG, roughness/metal 2048 JPEG). Legs: basecolor only, 1024 JPEG.
* Frame: Y up, faces +Z, left = +X, metres, rest = soaring pose, origin at body centre (Root bone is at (0, 0.15, 0)). All clips keyed at **60 fps**.
* Perched eagle is unchanged: `eagle_perch_v2.glb` (`perch_idle`, `drink`). Swap meshes at touchdown / take-off.

## Clips
| clip | length | loop | content |
|---|---|---|---|
| `flap` | 0.40 s (2.5 Hz) | loop, seam 0.00 mm | downstroke 55 % / upstroke 45 %, both with zero velocity at the extremes. Shoulder -15 .. +43 deg; on the way down the elbow and wrist lag the shoulder (tips bend up under load, trailing secondaries lift); on the upstroke wrist flexes 34 deg and sweeps back, elbow 18 deg, hand twists, the four primary groups close (spread 38 %) and re-open before the next downstroke. Body bobs +-3.4 cm (highest at end of downstroke), pitch 5.5 .. 11 deg, head and neck world-stabilised, tail pitches/fans in time, legs tucked back. |
| `glide` | 4.0 s | loop, seam 0.00 mm | soaring: mesh's natural arched dihedral, roll +-3 deg, yaw +-1 deg, 1 cm heave, per-wing trim corrections (2-3 deg at 0.5-0.75 Hz), primaries fluttering +-2 deg, tail trim and slight fan changes, head scanning (+-16 and +-7 deg yaw, slow), legs tucked. |
| `landing_flare` | 2.0 s | one-shot (LoopOnce, clampWhenFinished) | starts exactly in glide pose; body pitch rises monotonically 5 -> 59 deg (smootherstep, no tumbling), wings are counter-rotated so the flap axis stays horizontal in world space, two braking flaps (0.45-1.37 s) with wings swept forward / cupped, tail fanned and pitched down then relaxed, legs go tucked -> forward-down with talons open (0.1-0.8 s), last flap ends with wings held up. Root is baked: descends 0.60 m and travels 1.0 m forward (+Z). End pose: lowest talon exactly y=0, foot centre z=+0.17 (same as the perch mesh feet), root y 0.069. |
| `take_off` | 1.8 s | one-shot | starts in the landing end pose (legs forward, wings up, pitch 58), 4 deep flaps (1.9 -> 2.7 Hz), pitch 58 -> 8 deg, legs tuck 0.35-1.05 s, tail relaxes; root rises 0.95 m and travels 1.4 m forward. Ends at the `flap` phase-0 pose, so `flap` can be started right after. |

Baked root travel in `landing_flare`/`take_off` is in the Root bone (translation only). If your scene moves the object along a path, put the object where the clip should end (landing: feet on the perch at the origin) and let the clip supply the approach; or subtract the Root track.

## Skeleton (38 bones)
Root > Spine_1 > Spine_2 > Neck_1 > Neck_2 > Head; Spine_1 > Tail_1 > Tail_2, TailL, TailR; Spine_2 > Hum_L/R > Ulna > Hand > PrimA..PrimD (primary groups, outermost to innermost, tips measured from the mesh); Hum > SecC, Ulna > SecA, SecB (secondary groups, trailing edge); Spine_1 > LegTop_L/R > Shin > Foot > Toes.
Wing arm: shoulder (+-0.09, 0.21, 0.27 m glTF), elbow x=0.38, wrist x=0.60, hand tip x=0.80, primaries to x=1.05.

## three.js
```js
const g = await loader.loadAsync('models/eagle_v3.glb');          // faces +Z
const mixer = new THREE.AnimationMixer(g.scene);
const clip = n => THREE.AnimationClip.findByName(g.animations, n);
mixer.clipAction(clip('glide')).play();                            // crossfade 0.3-0.4 s between clips
const land = mixer.clipAction(clip('landing_flare')); land.setLoop(THREE.LoopOnce); land.clampWhenFinished = true;
```
Two skinned meshes (`Eagle`, `EagleLegs`) share one skeleton.

## Verification
* three.js (node GLTFLoader + AnimationMixer, 38 bones, textures present): head bone +Z, Hum_L +X, Tail_2 -Z (faces +Z, left = +X). Seam 0.00 mm for `flap` and `glide`. Per-frame (60 fps) max vertex step: flap 280 mm (wingtip at peak speed, ~17 m/s), glide 7 mm, landing_flare and take_off <= 0.3 m (wingtips, plus root travel), no single-frame jumps (a 1 m "step" at the very last sample of one-shots is only AnimationMixer wrapping at t = duration).
* Blender BVH self-overlap (non-adjacent triangle pairs, 17.1k-tri body): soar pose 364-389 (decimated mesh baseline), flap 376-507 except mid-upstroke 2270 (feathers folding over each other), landing 383-1554 (during flaps), take-off 437-663.
* Ground: landing end lowest talon y = 0.000, body (tail tip) -0.054 m (tail drapes below the perch plane, like the perched mesh's tail); take-off start tail -0.050 m.
* Visual montage rendered from the re-imported GLB (Blender), looked at frame by frame; early versions (wing stub, pitched body, legs dangling, wings pointing back-up in the flare, tail 13 cm underground) were fixed.

## Honest remaining issues
* Primary/secondary feathers move as 4 + 3 rigid groups per wing, not as 10 individual feathers; folded upstroke feathers interpenetrate (peak 2270 pairs).
* The Tripo mesh sweeps the primaries 15-40 deg forward of the lateral axis (mesh property, visible in the top view); not changed.
* The flying mesh has no legs (tucked/hidden). The legs are transplanted from the perch mesh (762 tris, 1K texture) - similar scale, slightly different brown/yellow tone from the darker flying body.
* Tail spread is bone yaw of TailL/TailR (the mesh tail is one closed shape), so it widens but the feathers are not separated.
* Mesh swap at touchdown is not invisible: perch mesh has folded wings and a golden nape, flight mesh has spread dark wings. Pitch (59 deg), feet position and foot plane match; the wing pose does not (end of flare has wings up).
* `take_off` has no crouch/push-off on the perch (flying mesh cannot fold), it starts from the flare-landing pose.
* Crossfade `flap` <-> `glide` 0.3-0.4 s (poses differ in pitch by ~3 deg and wing mean by ~10 deg).
