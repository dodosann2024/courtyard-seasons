# Desert Tripo GLBs

`src/desert.js` loads these with the self-hosted three `GLTFLoader` from `assets/vendor/` (no CDN), via `glb(key)`.
The palms are built procedurally in `desert.js`; there is no palm model.

| File | Used for | Clips |
|------|----------|-------|
| `camel_v4b.glb` | dromedary (~3.2 m long in scene); v4 with the kneeling hind legs fixed | `walk` (in place, .99 m/s), `idle`, `kneel_down`, `kneel_rest`, `stand_up`, `drink` |
| `bactrian_v1.glb` | Bactrian camel, scaled to ~1.8 m at the withers; walk played at 90 % with ground speed matched | same as `camel_v4b` |
| `bald_eagle_v1.glb` | bald eagle, one mesh for flight and perch (scaled x.9 to a 1.8 m span); takeoff/land root motion is kept and handed over to the flight path | `glide`, `flap`, `dive` (held pose, faded in for the stoop), `takeoff`, `land`, `perch`, `head_turn` |
| `rattlesnake_v1i.glb`, `rattlesnake_v1i_mobile.glb` | western diamondback, ~1.1 m, the scene's snake (final handover files, used unchanged). ~38 dorsal rows of rounded, finely keeled scales; diamonds of varied size with cream borders, salt-and-pepper speckle, black-and-white tail rings; near-isotropic body UVs over three body materials; no folded faces; welded neck, wet tongue, clearcoat eyes under a cornea shell. `RS_FILES` in `src/desert.js` loads the mobile file on phones (maps up to 1950 px, ~85 MB of GPU memory) and the desktop file elsewhere (up to 3508 px, ~292 MB); they look the same at ~1.3 m. Both share the rig and clips used since v1b, so a new file needs only its name there. Crawling is procedural on `Spine_01..44` (sidewinding on open sand, serpentine near grass and rocks, rectilinear when wary) and presses J- and S-shaped tracks into the sand that fade with wind, dust and rain. The tongue leaves through the snout notch with the jaw shut. Transmission (rattle) is switched off at load: in three.js it costs a second scene pass every frame | `defensive_coil`, `tongue_flick`, `relaxed_coil` |
| `pupfish_male_v3b.glb`, `pupfish_female_v3b.glb` | desert pupfish at real size (male ~66 mm, female ~57 mm in the file). 16 fish in the oasis pond (11 on phones): a loose school that darts and pauses over the shallow sandy ring, and 3 males (2 on phones) holding territories in 5–30 cm of water at the margin, chasing other males out and squaring up to their neighbours. They scatter from a drinking camel or a low eagle. The pond surface is an opaque layer, so the fish are drawn after it and blended over it by the light that comes back through the surface (depth absorption, surface Fresnel), lifted to their apparent depth, wobbled by the ripples, with caustics on their backs. The male body adds a view-dependent thin-film sheen (teal head-on, blue, violet at grazing angles) over the baked blue. Fish under ~1.5 px are hidden and their rigs not updated. `PF_FILES` in `src/desert.js` names the two files | `swim` (0.8 s loop, played faster with speed), `idle_turn` (4.0 s, during longer pauses) |
| `sinai_agama_v1c.glb` + `sinai_agama_v1c_blue.glb` | Sinai agama (西奈飞蜥), ~25 cm. The sandy file is the female; the male loads the blue twin (same 64-bone rig). Meshopt-packed (base colour 1024, other maps 512; about 1.7 MB each). His albedo fades from that blue back toward the sandy colour as he cools, following sun, shade and rain | `idle`, `run`, `climb` (it turns head-down to come down a trunk), `bask`, `head_bob` |
| `ostrich_v2ah.glb` | common ostrich (Godot's v2ah: v2ag's rig, clips and timing, rebuilt so the sit skirt and forward/side/back apron cards keep the pink legs hidden through the settle and the stand-up; denser, softer black strands on the mound and a soft painted white crescent), a cock (crown ~2.45 m) and a hen (scaled x.92, ~2.25 m). The hen is the same file with the black body feathers remapped to grey-brown and the white plumes dulled in the shader. The seated white crescent is painted into the sit-mound and fluff albedos. Night and hail play `sit` once from idle, then keep the seated hold from 1 s; standing plays `stand_up`, then `idle`. `sit` and `stand_up` play as authored. `sit_skirt` and `soft_mound` are morph weight tracks in those clips (AnimationMixer → `morphTargetInfluences`). No bone offset in code, and the clips keep the legs at scale 1 while folding the wings back against the body. Earlier ostrich files, including `ostrich_v2ag` (kept for rollback), stay on disk and are not loaded. Footprints are pressed where a toe comes down | `idle` (4.0 s), `slow_walk` (1.50 s, ground speed / 1.0 m/s), `fast_run` (0.717 s, ground speed / 4.86 m/s), `peck` (2.5 s), `sit` (3.5 s: settle 0–1 s, hold 1–3.5 s), `stand_up` (1.65 s) |
| `tortoise_v2h.glb` | desert tortoise (Godot's v2h: v2g's mesh, 22-bone rig, clips and `withdraw_close` morph, with a warmer dusty-brown shell, sharper scute normals, higher-contrast forearm shields and the stray withdraw shards pushed back; 3.06 MB handover → 0.82 MB), used at file scale. Withdraws into the shell in hail, heat and when threatened, then plays `head_out`; neck and head are turned on top of the clips for grazing, drinking and looking | `idle`, `slow_crawl`, `head_withdraw`, `head_out` (both played once and held) |
| `gerbil_v5b.glb` | Mongolian gerbil (Godot's v5b: the Tripo-furred v5 on v4d's 39-bone rig and clips, with a cooler agouti albedo, a smoothed tail shaft, shorter tail-tuft cards and softened paws; 10.9 MB handover → 2.2 MB), scaled x1.25: v4d's body length with a 45 mm longer tail (167 mm nose to tail tip in the file). Fur colour stays 2048 px, normal/ORM 1024 px (KTX2). Whiskers, tail tuft and tail fringe are alpha-BLEND hair cards drawn without depth writes and cast no shadow. The `lookout_fix` chest corrective is a weight track in every clip (1 in `stand_lookout`, 0 elsewhere), blended by the mixer with the clip. `gerbil_v5.glb` and `gerbil_v4d.glb` stay on disk for rollback and are not loaded | `idle`, `stand_lookout` (stand-scan, peek), `dig` (nibbling at the burrow), `hop_run` (scaled with speed) |
| `scorpion_v2c.glb` + `scorpion_uv_v2c.glb` | desert hairy scorpion (Godot's v2c: v2b's mesh, 41-bone rig and clips with ~2,040 skinned alpha-BLEND setae cards on the legs, pedipalps and tail, a stronger slate dorsum and granulated normals; 5.8 + 4.5 MB handover → 1.3 + 1.1 MB). The setae cards are drawn without depth writes and cast no shadow. The day file gives the mesh, rig and PBR maps; only the emissive map of the UV file is used, on the cuticle alone, as the night glow under the moon (blue-green, scaled with the scene's glow uniform) | `idle`, `walk`, `threat` |
| `crab_v6b.glb` | freshwater crab at life size (5 cm carapace), Godot's v6b: v6's mesh, 36-bone rig, maps and body clips byte for byte, with `claw_pinch` rekeyed so `claw_finger.L/R` hinge open 0 → 30° (t 0.6 s) → 0 at 60 fps (3.34 MB handover → 0.70 MB, meshopt + KTX2). One mixer, two layers: body/legs from the gait clip, the `claw_*` bones from that clip or from `claw_pinch` (looped in the pauses, held at 0.6 s in a threat or run). `CR_FILE` in `src/desert.js` names the file | `idle`, `walk_sideways` (.14 m/s), `scuttle_sideways` (.464 m/s), `dig`, `claw_pinch` (1.2 s) |
| `trout_v3.glb` | rainbow trout, 0.398 m in the file, scaled to each fish (26–38 cm); 5 in the deep middle of the pond (3 on phones), shaded under water like the pupfish. Turns bend `spine01..06` on top of the clip. `TR_FILE` in `src/desert.js` names the file | `swim` (played faster with speed), `idle_hover` (slow cruising at night and in hail), `dart` (when something scares the school) |
| `saguaro_v3.glb` | saguaros at real height: nodes `s3` (3 m), `s7f` (7 m, flowering), `s12` (12 m, five welded arms) and their LOD1 meshes `s3_lod1`, `s7_lod1`, `s12_lod1`, which take over once single spines no longer resolve on screen | — |
| `barrel_cactus_v3.glb` | fishhook barrel cactus: squat body 0.74 m tall × 0.59 m (24 ribs), ~2,000 spine cards with red-brown hooked centrals, ring of flowers on the crown. Drawn instanced (one draw per material for all barrels), in small groups on the gravel patches, leaning toward the south-west sun | — |
| `cholla_v2.glb` | teddy-bear cholla, 1.6 m | — |
| `tent.glb` | Bedouin tent | — |

The two camels are configured in `CAMEL_KIND` in `src/desert.js` (file, scale, walk gait, coat tint, call pitch).
`kneel_down` / `stand_up` root translation is lightly smoothed at load to remove a one-key drop where the knees meet the sand.

The v4 files and `bald_eagle_v1` are Godot's Tripo + Blender builds with their embedded textures re-encoded by `tools/glbtex.py`
(1024 px JPEG; both camels' base colour kept at 2048 px, the Bactrian's fur cards at 256 px); geometry and clips are untouched.

`ostrich_v2ah.glb` is the loaded ostrich (meshopt + KTX2, same caps as the earlier ostrich files; 9.4 MB handover → 2.8 MB). `tortoise_v2h.glb` is packed the same way with the tortoise's caps; `tortoise_v2g.glb` stays on disk for rollback. The tortoise, gerbil and scorpion files, and the older ostrich files left on disk, are Godot's rigged handover files (release `desert-models-2026-11-16`; the previous sit file is `ostrich_v2ag`).
If one of those, or the trout, fails to load, the procedural animal in `src/desert.js` is used instead, with the same behaviour.
The trout (`trout_v3`), pupfish (`pupfish_*_v3b`) and Sinai agama (`sinai_agama_v1c` and its blue twin) are from
`desert-models-2026-11-20`. They are packed by `tools/glbpack/pack.mjs` and `ktx.mjs` with the same texture caps as the
others (base colour 1024 px, other maps 512 px; the ostrich keeps its base colour at full size; the trout's body and fin atlas go from 2048 to 1024 px; the pupfish maps
are already within those caps and are only re-encoded).

The cactus files are packed from the model handover by `tools/modelpack.py`: the saguaro variants are
merged into one file over a single shared texture set, textures that are one flat colour become material factors,
textures are capped at 1024 px (alpha cards are downsized keeping their coverage at the cut-off),
opaque maps are stored as JPEG and alpha maps stay PNG, and the
primitives of a static mesh that share a material are joined into one draw. Geometry and the alpha cut-offs are copied unchanged. Spine, wool, fuzz and flower cards are glTF MASK
materials; `cactusAlpha()` in `desert.js` renders them with alpha-to-coverage and builds mip chains that keep their
coverage at a distance.

All eleven files are then meshopt-compressed by `tools/glbpack/pack.mjs` (gltf-transform + meshoptimizer; run on the
files above, `npm install` in `tools/glbpack` first): `EXT_meshopt_compression` with normals, uvs, joints and weights
quantised, positions left as floats (the coat and sway shaders read bind-pose metres from them), and textures re-encoded
as WebP (`EXT_texture_webp`) except the phone snake's JPEGs; the desktop snake's body strips are 1260x2456. Together
they went from 43.2 MB to 21.1 MB on desktop and from 35.5 MB to 16.7 MB on phones. `glb()` hands the loader the
self-hosted decoder `assets/vendor/meshopt_decoder.module.js` (meshoptimizer 1.3, MIT).

`tools/glbpack/ktx.mjs` then stores the textures as KTX2 (`KHR_texture_basisu`, needs `toktx` from KTX-Software 4.x):
ETC1S throughout, normal maps at the top quality level (`NU=1` for UASTC normals). The phone uploads them GPU-compressed
after the self-hosted Basis transcoder (`assets/vendor/basis_transcoder.*`, three r169 `KTX2Loader`) has run on worker
threads, instead of decoding every WebP and building its mips on the main thread. The cacti's alpha-cut cards keep their
WebP, since `cactusAlpha()` rebuilds their mip chains from the decoded image.

Format: binary glTF with embedded textures, Y-up, metres, origin at ground contact.
