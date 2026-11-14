# camel_v2.glb: notes

File: `/workspace/desert/models/camel_v2.glb` (2.99 MB, embedded 2K PBR, textures byte-identical to the Tripo export).
Montage: `/workspace/desert/models/previews/camel_v2_clips.png` (rows = walk, idle, graze, drink; side view, 4 times each; green = ground y=0, blue = water level y=0.15 m).
Source scripts (not shipped): `/workspace/camelwork/` (`build_camel.py` makes the clips, `verify.py` re-imports the GLB and measures it).

## Clips (one skeleton, one SkinnedMesh)
| clip | duration | loop | notes |
|---|---|---|---|
| `walk` | 1.100 s | yes (last key == first key) | pacing gait, in place |
| `idle` | 6.000 s | yes | legs planted |
| `graze` | 6.000 s | yes (starts and ends in the idle stand) | neck lowers 0 to 1.7 s, 3 nibbles ~1.9 to 4.1 s, rises 4.3 to 6 s |
| `drink` | 6.000 s | yes | same timing, 4 sips |

The old `preset:quadruped:walk` clip was removed. All clips are sampled at 30 fps (34 / 181 keys), 102 channels each (translation/rotation/scale for the 34 joints; only rotations and the Root translation change).
three.js: `const mixer = new THREE.AnimationMixer(gltf.scene); mixer.clipAction(THREE.AnimationClip.findByName(gltf.animations,'walk')).play();` Names are exactly `walk`, `idle`, `graze`, `drink`. Use `LoopRepeat` for all four. Crossfade with `crossFadeTo` (0.3 s is fine). For graze/drink you can play once (`LoopOnce`, `clampWhenFinished=false`) and return to idle, since both start and end in the idle stand pose.

## Scale and orientation
* Units are metres, Y up, **the camel faces +Z** (head at z about +1.0 to +1.4, tail at z about -1.4). The animal's **left side is +X**. Armature node and mesh node have identity transforms; the scale was baked into the mesh and bones (Tripo's 1.0 m long model x 2.8).
* Size: 2.8 m nose-to-tail extent (z from -1.40 to +1.40), 1.98 m top of ears at rest, hump about 1.85 m, withers bone at y=1.59 m, hooves at y=0. This is a stocky Tripo proportion (shoulder about 1.5 m), not 2 m at the shoulder. Apply a uniform scale to the scene node if you want it bigger. If you scale by s, multiply the walk speed by s too.
* Muzzle (lowest head vertex) at rest stand: y=1.43 to 1.47 m.
* Triangles: 7,792 (5,339 vertices, 1 material, 34 joints, max 4 influences).

## Walk (pacing)
* Pacing: left front + left hind swing together, right pair is exactly half a cycle later. Cycle 1.1 s, duty factor 0.62 (about 0.12 of the cycle with both sides on the ground).
* **Root-motion / forward speed: 1.026 m/s along +Z** (stance travel of each hoof is 0.70 m per stance of 0.682 s; stride length = 1.13 m). The clip is in place, the root does not translate forward. Move the object at 1.026 m/s (x your scale) to avoid foot sliding.
* Foot sliding measured on the re-imported GLB: planted hoof deviates **<= 1 mm** in y, 2 to 4 mm in z, 11 mm in x (the x drift is the body sway under a planted foot) over each stance. Hooves never go below y=-0.001 m.
* Hoof lift in swing about 0.12 m (hoof centre), peak toe flex 17 degrees.
* Body: whole body is 0.10 m lower than in idle (knees stay flexed so the stride is reachable), plus vertical bob 1.4 cm at 2x cycle frequency, lateral sway 3.5 cm, roll 2.6 degrees toward the supporting side, yaw 1.7 degrees, pitch 0.7 degrees; the neck counter-rolls and counter-yaws, so the head stays steady; neck nods 3.4 degrees once per cycle; tail sways +-17 degrees yaw.
* Muzzle height during walk: 1.24 to 1.37 m (including the 0.10 m crouch).
* Crossfading walk to idle moves the body 0.10 m in y. That is intended.

## Idle (6 s)
* Legs fully planted: hoof travel 0.000 m on all axes.
* Chest breathing: 2 breaths per loop (3 s), +-0.4 degrees on 3 spine bones and 4 mm root heave.
* Slow head turn left/right +-17 degrees (1 cycle per 6 s), distributed over the neck chain; head bob +-2 degrees; no jaw bone, so chewing is a 1.3 Hz head nod (+-1.3 degrees) with a slow on/off envelope; tail sway plus one flick at about 4 s. No ear bones, so ears do not move.

## Graze (6 s)
* Legs planted: hoof travel <= 1 mm. The chest dips 20 degrees (spine bones 1 to 3) and the front knees flex (IK keeps hooves fixed), the neck bends 90 degrees spread over Spine_4, Spine_5, Head_0, Head_1 (28/27/25/20 %), the skull counter-rotates -34 degrees.
* Measured on the re-imported GLB (and independently in three.js): lowest head vertex **0.008 m above the ground at the deepest point; between 1.7 s and 4.3 s the muzzle stays 0.008 to 0.071 m** (nibbles lift it to 0.05 to 0.07 m, then back to 0.01 m). Muzzle is about 0.53 m ahead of the front hooves (z=0.82 vs front toe at 0.29). Closest the head gets to any front-leg vertex: 0.14 m, to chest vertices: 0.38 m, so no head/leg penetration. No vertex goes below y=0 (min 0.000).
* 3 nibbles at about 1.95, 2.67, 3.39 s.

## Drink (6 s)
* same structure, shallower dip (chest 7 degrees, neck 113 degrees, skull -52 degrees). Hold height of the lowest head vertex about 0.17 to 0.21 m; 4 sips (at about 1.9, 2.45, 3.0, 3.55 s) go down to **0.151 m** (Blender) / 0.148 m (three.js), i.e. water level 0.15 m. Muzzle about 0.62 m ahead of the front hooves, nearest head-to-front-leg distance 0.42 m. Hoof travel 0 mm.
* Muzzle is above the surface the whole time, it does not go below 0.148 m.

## Honest verdicts
* walk: good. Clear pacing, no sliding, loops cleanly. Slightly stiff in the hind legs (Tripo skin weights at the thigh are coarse, the thigh looks a bit thin when it swings back) and the swing-phase hoof flex is a simple sine, not a real peel-off. Looks fine at game distance.
* idle: good but subtle by design; the head turn only reads clearly from the front or the top. No ears or jaw bones, so no ear flicks or real chewing.
* graze: good. The pose is a deep bow, the front knees bend a lot (the model has short legs and a short neck, so reaching the ground needs the chest dip). The deepest nibbles lift the muzzle to about 7 cm, a bit over the 5 cm target.
* drink: good. Same caveat on the forward lean. There is no water or splash; the sip is a head dip only.
* Not done: no lip/jaw/ear animation (no such bones), no transitions between clips (blend them in code).

## Skeleton (34 joints; positions are rest pose in the **glTF frame**: x=left, y=up, z=forward; metres)
Bones keep their Tripo names, `tripo::` prefix included. Rotate neck and head bones about the **X axis** for pitch (positive = nose down, forward end swings toward the ground), about **Y** for turning (positive = turn toward +X, the animal's left; this is also the yaw used in the clips), about **Z** for roll. In bone-local space the Blender bone axes are used (bone Y along the bone), so author new rotations in world/model axes and convert, or just play the supplied clips. The two tail chains must always receive identical rotations.
Neck chain (lower to upper): `tripo::Spine_4` > `tripo::Spine_5` > `tripo::Head_0` > `tripo::Head_1` > `tripo::Head_2` (skull and all head vertices). Legs: `tripo::0_Left_Limb_0..3`, `0_Right_Limb_0..3` (front), `1_Left_Limb_0..3`, `1_Right_Limb_0..3` (hind).

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

