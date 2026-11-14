# camel_v3.glb: notes

Files (camel_v2.glb and its notes are untouched):
* Model: `/workspace/desert/models/camel_v3.glb` (3.31 MB, 7,792 tris, 34 joints, same skeleton, same embedded 2K PBR textures, same axes and clip names)
* Montage: `/workspace/desert/models/previews/camel_v3_clips.png` (rows = walk, idle, graze, drink; green = ground y=0, blue = water level y=0.15 m)
* Walk close-up: `/workspace/desert/models/previews/camel_v3_walk_legs.png` (8 evenly spaced frames of the 1.1 s cycle, t = 0, 0.1375, ... 0.9625 s)
* Scripts (not shipped): `/workspace/camelwork/` (`clips3.py`, `build_camel3.py`, `smooth_weights.py`, `verify3.py`)

## What changed from v2
| | v2 | v3 |
|---|---|---|
| body height | walk 0.10 m lower than idle | **all clips share the same height** (legs relaxed 0.03 m below the straight-leg height). Muzzle height at stand: idle 1.40 to 1.43 m, walk 1.38 to 1.47 m (bob). A walk/idle crossfade does not dip. |
| graze / drink | deep knee fold (front knee flexed 60 to 80 deg) | **front legs straight** (solved on the straight IK branch, knee at -3 deg i.e. locked): the hooves step out to a splay before the head goes down, the chest dips only about 14 deg (graze) / 7 deg (drink), the rest comes from the neck arch. |
| graze length | 6 s | **9 s** (two nibbles, a lift-and-look-around, a third nibble) |
| drink length | 6 s | **7 s** |
| walk swing | sine lift | asymmetric swing curve, toe/pastern flex, see below |
| idle | breathing + head turn | adds weight shifts and head micro-turns |
| skin | Tripo weights | hind leg/hip weights smoothed (welded across UV seams, hooves untouched) |

Clip names are exactly `walk`, `idle`, `graze`, `drink`. Durations: walk 1.100 s, idle 6.000 s, graze 9.000 s, drink 7.000 s. All loop (first key == last key; graze and drink start and end in the idle stand, so they can also be played once with `LoopOnce`). Sampled at 30 fps, 102 channels per clip.
three.js: `mixer.clipAction(THREE.AnimationClip.findByName(gltf.animations,'graze')).play()`; crossfade with `crossFadeTo` (0.3 s).

## Scale and orientation (unchanged)
Metres, Y up, the camel faces +Z, its left side is +X. 2.8 m nose to tail, 1.98 m top of ears at rest (stand with the relaxed 0.03 m: 1.95 m), hooves at y=0. Armature and mesh nodes have identity transforms.

## Walk (pacing, 1.1 s)
* Pacing gait: left front + left hind together, right pair exactly half a cycle later; duty factor 0.57 (brief double support at each switch).
* **Forward speed 0.989 m/s along +Z**, stance travel 0.62 m per hoof, stride 1.09 m. The clip is in place: move the object at 0.989 m/s (x your scale).
* **Foot sliding (measured on the re-imported GLB, stance phase): at most 0.5 mm** along the travel axis (FL 0.2, FR 0.3, HL 0.5, HR 0.4 mm), 0.5 to 1.4 mm vertical wobble, 0.1 mm lateral. v2 was <= 1 mm; the requirement was <= 3 mm.
* Swing curve (no more sine): the hoof leaves the ground quickly, peak lift at about 30 % of the swing (fetlock lifted 0.15 m front / 0.13 m hind, hoof centre 0.13 / 0.10 m), then a long gentle set-down with zero vertical speed at touch-down; it overshoots slightly forward and settles back as the foot meets the ground so it lands already moving backwards at ground speed. Pastern/toe flex: toe rotates down up to 31 deg early in the swing, then a -6 deg dorsiflexion (toe up) just before landing so the heel/pad lands first.
* Body: roll 3.4 deg and lateral shift 4 cm toward the stance side (the side whose legs are on the ground; shift peaks 1.5 % of a cycle after the roll peak), yaw 1.7 deg, pitch 0.8 deg, vertical bob 1.2 cm at twice the stride frequency. The neck nods 3.4 deg once per stride and counter-bobs (2 deg, lagging the body), counter-rolls and counter-yaws, so the head stays quiet. The hump (Spine_3/Spine_2) lags the trunk roll by 0.09 of a cycle and the tail yaw is passed down the chain with 0.04 and 0.14 cycle lags plus a lagging vertical bounce.
* Hooves never go below y=-0.0002 m. The head is at least 0.66 m from the front legs and 0.36 m from the chest.
* Front stride is centred 0.13 m forward and the hind 0.03 m forward of the rest hoof positions, otherwise the legs run out of reach (the model's legs are short for its body).

## Idle (6 s)
* Hoof travel 0.000 m on every axis (all four hooves stay flat and planted).
* Weight shifts: body shifts +-1.3 cm laterally (plus a 0.4 cm third harmonic) and rolls +-0.6 deg over the 6 s loop, with the legs re-solved to stay planted; chest breathing (2 breaths per loop, 0.35 deg on 3 spine bones, 4 mm heave).
* Head: slow look left/right +-15 deg plus small incommensurate micro-turns (3 to 4 deg, 1 to 2 deg) and tiny pitch drift, a low-key chewing nod (1 deg, 1.3 Hz, fading in and out), tail sway with one flick at about 4.1 s. No blinks, no ears or jaw bones. Everything is an integer number of cycles, so the loop is seamless (seam difference 0.0 mm).

## Graze (9 s)
Timeline: 0.15 to 0.85 s left front hoof steps out (forward 0.22 m and outward 0.22 m), 0.6 to 1.3 s right front hoof steps; 0.9 to 2.7 s neck arches down (eased), 2.95 and 3.65 s nibbles, 4.3 to 5.1 s lifts to look around (muzzle at about 0.78 m), 4.9 to 6.4 s head sweeps left and right while chewing, 6.0 to 6.7 s back down, 6.85 s third nibble, 7.2 to 8.1 s rises, 7.6 to 8.8 s hooves step back to the stand.
* Hooves are planted at all other times (hoof travel 0 mm while planted). Front legs are straight in the hold (knee flexion -3 deg, forearm leaning 32 deg forward, shoulder blade swung 20 to 30 deg). Hind legs flex a little (hock 23 deg). Body pitch is only the 14 deg chest dip.
* Measured on the re-imported GLB: lowest head vertex **0.012 m** above ground at the deepest point; while holding (2.7 to 4.3 s and 6.7 to 7.2 s) the muzzle height stays between **0.012 and 0.048 m**. Three.js gives the same (0.012 m at t=2.8 s). No vertex goes below y=0.
* Muzzle is about 0.36 m ahead of the front toes; head-to-front-leg distance never below 0.37 m, head-to-chest 0.38 m (no penetration).
* Chewing: 2.2 Hz head nod (0.7 deg) in bursts every 1.4 s, small sideways jaw wobble, nibbles lift the head 3 cm then push down.
* Peak vertical muzzle speed while lowering about 3 m/s at the steepest point of the ease (max 0.099 m per frame).

## Drink (7 s)
Timeline: 0.10 to 0.70 s and 0.45 to 1.05 s hooves step out (forward 0.15 m, outward 0.15 m), 0.8 to 2.3 s neck lowers, sips at 2.5, 3.2, 3.9 and 4.6 s, 5.0 to 6.1 s rises, 5.75 to 6.8 s hooves step back.
* Front legs straight in the hold (knee -3 deg, forearm 19 deg forward). Chest dips 7 deg.
* Muzzle height between sips 0.177 m, each sip reaches **0.146 to 0.150 m** (water level 0.15 m) on the re-imported GLB; three.js also 0.146 m. Muzzle is about 0.52 m ahead of the front toes, head-to-front-leg distance 0.40 m, to the chest 0.38 m.

## Verdicts
* walk: good. Pacing reads clearly, the roll toward the stance side, hump lag and head counter-bob make it much less mechanical than v2. The swing/set-down looks right in the leg close-up montage. Leftover: only the 2D side/front views were inspected, there is no ear/jaw/belly secondary motion because the rig has no such bones; the thigh skin is still a bit thin at the gaskin (see below).
* idle: good and subtle. Weight shifts read best from the front. No blinks (impossible) and no ears.
* graze: good. Legs straight, no knee folding, natural step/lower/nibble/look/rise sequence. The body still slopes forward noticeably (about 25 deg) because the model's neck is short relative to its legs; the hoof splay (0.22 m forward + 0.22 m outward) is what makes that possible. The hooves visibly step before and after the graze.
* drink: good. Same notes; smaller splay and slope.
* Hind thigh: smoothing the skin weights (about 1,700 vertices, hooves excluded, seam vertices welded) removed some of the pinching but it is only a mild improvement. The thin hind gaskin is mostly in the Tripo mesh itself and would need a mesh fix to go away completely.
* The hoof steps in graze/drink are hoof-lift-and-place steps (no sliding), but the lift is a simple smooth curve and the weight shift over the planted legs is small.
* Transitions between clips must still be crossfaded in code. Idle and the start/end of graze/drink match (same hoof positions and straight front legs), so graze/drink -> idle is seamless; walk -> idle is close but hoof positions differ.

## Skeleton (34 joints; rest pose in glTF frame x=left, y=up, z=forward; metres)
Bone names keep the Tripo names (with `tripo::`). Neck chain (lower to upper): `tripo::Spine_4` > `Spine_5` > `Head_0` > `Head_1` > `Head_2` (skull and all head vertices). Chest dip uses `Spine_1..3`. Legs: `tripo::0_Left_Limb_0..3`, `0_Right_Limb_0..3` (front), `1_Left_Limb_0..3`, `1_Right_Limb_0..3` (hind). Pitch = rotation about X (positive = nose down), turning = rotation about Y (positive = toward +X, the animal's left), roll = about Z. The two tail chains (`bone_1`>`Tail_0` and `bone_32`>`bone_33`) always receive identical rotations.

| bone | parent | rest head (x,y,z m, glTF) | rest tail | role |
|---|---|---|---|---|
| `tripo::Root` | `-` | (0.0, 0.116, -0.0) | (0.0, 1.829, -0.0) | root (no skin weight; body translate/roll/pitch/yaw) |
| `bone_1` | `tripo::Root` | (0.005, 1.453, -1.07) | (0.005, 1.367, -1.167) | tail (two parallel chains: bone_1>Tail_0 and bone_32>bone_33, always animated identically) |
| `tripo::Tail_0` | `bone_1` | (0.005, 1.367, -1.167) | (0.005, 1.28, -1.264) | tail (two parallel chains: bone_1>Tail_0 and bone_32>bone_33, always animated identically) |
| `tripo::Spine_0` | `tripo::Root` | (0.005, 1.453, -1.07) | (0.005, 1.529, -0.779) | trunk spine (rear to chest) |
| `tripo::Spine_1` | `tripo::Spine_0` | (0.005, 1.529, -0.779) | (0.005, 1.647, -0.391) | trunk spine (rear to chest) |
| `tripo::Spine_2` | `tripo::Spine_1` | (0.005, 1.647, -0.391) | (0.005, 1.593, -0.089) | trunk spine (rear to chest) |
| `tripo::Spine_3` | `tripo::Spine_2` | (0.005, 1.593, -0.089) | (0.005, 1.367, 0.343) | withers/hump base, chest-neck junction (shoulder bones are children) |
| `tripo::Spine_4` | `tripo::Spine_3` | (0.005, 1.367, 0.343) | (0.005, 1.27, 0.515) | neck chain (lower to upper) |
| `tripo::Spine_5` | `tripo::Spine_4` | (0.005, 1.27, 0.515) | (0.005, 1.259, 0.688) | neck chain (lower to upper) |
| `tripo::Head_0` | `tripo::Spine_5` | (0.005, 1.259, 0.688) | (0.005, 1.367, 0.817) | neck chain (lower to upper) |
| `tripo::Head_1` | `tripo::Head_0` | (0.005, 1.367, 0.817) | (0.005, 1.572, 0.893) | neck chain (lower to upper) |
| `tripo::Head_2` | `tripo::Head_1` | (0.005, 1.572, 0.893) | (0.005, 1.777, 0.968) | head / skull (all head vertices) |
| `bone_12` | `tripo::Spine_3` | (0.005, 1.367, 0.343) | (0.221, 1.108, 0.343) | shoulder/hip offset (parent of leg chain, no weights-visible motion) |
| `tripo::0_Left_Limb_0` | `bone_12` | (0.221, 1.108, 0.343) | (0.188, 0.925, 0.181) | front left leg, link 0 (upper arm/thigh) |
| `tripo::0_Left_Limb_1` | `tripo::0_Left_Limb_0` | (0.188, 0.925, 0.181) | (0.178, 0.504, 0.148) | front left leg, link 1 (forearm/gaskin; elbow/stifle at head) |
| `tripo::0_Left_Limb_2` | `tripo::0_Left_Limb_1` | (0.178, 0.504, 0.148) | (0.199, 0.148, 0.116) | front left leg, link 2 (cannon; carpus/hock at head) |
| `tripo::0_Left_Limb_3` | `tripo::0_Left_Limb_2` | (0.199, 0.148, 0.116) | (0.221, -0.208, 0.084) | front left leg, link 3 (fetlock+hoof; fetlock at head) |
| `bone_17` | `tripo::Spine_3` | (0.005, 1.367, 0.343) | (-0.211, 1.108, 0.343) | shoulder/hip offset (parent of leg chain, no weights-visible motion) |
| `tripo::0_Right_Limb_0` | `bone_17` | (-0.211, 1.108, 0.343) | (-0.178, 0.925, 0.181) | front right leg, link 0 (upper arm/thigh) |
| `tripo::0_Right_Limb_1` | `tripo::0_Right_Limb_0` | (-0.178, 0.925, 0.181) | (-0.178, 0.504, 0.148) | front right leg, link 1 (forearm/gaskin; elbow/stifle at head) |
| `tripo::0_Right_Limb_2` | `tripo::0_Right_Limb_1` | (-0.178, 0.504, 0.148) | (-0.189, 0.148, 0.116) | front right leg, link 2 (cannon; carpus/hock at head) |
| `tripo::0_Right_Limb_3` | `tripo::0_Right_Limb_2` | (-0.189, 0.148, 0.116) | (-0.2, -0.208, 0.084) | front right leg, link 3 (fetlock+hoof; fetlock at head) |
| `bone_22` | `tripo::Root` | (0.005, 1.453, -1.07) | (0.167, 1.108, -0.909) | shoulder/hip offset (parent of leg chain, no weights-visible motion) |
| `tripo::1_Left_Limb_0` | `bone_22` | (0.167, 1.108, -0.909) | (0.178, 0.892, -1.016) | hind left leg, link 0 (upper arm/thigh) |
| `tripo::1_Left_Limb_1` | `tripo::1_Left_Limb_0` | (0.178, 0.892, -1.016) | (0.199, 0.525, -1.103) | hind left leg, link 1 (forearm/gaskin; elbow/stifle at head) |
| `tripo::1_Left_Limb_2` | `tripo::1_Left_Limb_1` | (0.199, 0.525, -1.103) | (0.253, 0.116, -0.962) | hind left leg, link 2 (cannon; carpus/hock at head) |
| `tripo::1_Left_Limb_3` | `tripo::1_Left_Limb_2` | (0.253, 0.116, -0.962) | (0.307, -0.294, -0.822) | hind left leg, link 3 (fetlock+hoof; fetlock at head) |
| `bone_27` | `tripo::Root` | (0.005, 1.453, -1.07) | (-0.157, 1.108, -0.909) | shoulder/hip offset (parent of leg chain, no weights-visible motion) |
| `tripo::1_Right_Limb_0` | `bone_27` | (-0.157, 1.108, -0.909) | (-0.168, 0.892, -1.016) | hind right leg, link 0 (upper arm/thigh) |
| `tripo::1_Right_Limb_1` | `tripo::1_Right_Limb_0` | (-0.168, 0.892, -1.016) | (-0.189, 0.525, -1.103) | hind right leg, link 1 (forearm/gaskin; elbow/stifle at head) |
| `tripo::1_Right_Limb_2` | `tripo::1_Right_Limb_1` | (-0.189, 0.525, -1.103) | (-0.243, 0.116, -0.962) | hind right leg, link 2 (cannon; carpus/hock at head) |
| `tripo::1_Right_Limb_3` | `tripo::1_Right_Limb_2` | (-0.243, 0.116, -0.962) | (-0.297, -0.294, -0.822) | hind right leg, link 3 (fetlock+hoof; fetlock at head) |
| `bone_32` | `tripo::Root` | (0.005, 1.453, -1.07) | (0.005, 1.367, -1.178) | tail (two parallel chains: bone_1>Tail_0 and bone_32>bone_33, always animated identically) |
| `bone_33` | `bone_32` | (0.005, 1.367, -1.178) | (0.005, 1.28, -1.286) | tail (two parallel chains: bone_1>Tail_0 and bone_32>bone_33, always animated identically) |

