# Desert Tripo GLBs

`src/desert.js` loads these with the self-hosted three `GLTFLoader` from `assets/vendor/` (no CDN), via `glb(key)`.
The palms are built procedurally in `desert.js`; there is no palm model.

| File | Used for | Clips |
|------|----------|-------|
| `camel_v4b.glb` | dromedary (~3.2 m long in scene); v4 with the kneeling hind legs fixed | `walk` (in place, .99 m/s), `idle`, `kneel_down`, `kneel_rest`, `stand_up`, `drink` |
| `bactrian_v1.glb` | Bactrian camel, scaled to ~1.8 m at the withers; walk played at 90 % with ground speed matched | same as `camel_v4b` |
| `bald_eagle_v1.glb` | bald eagle, one mesh for flight and perch (scaled x.9 to a 1.8 m span); takeoff/land root motion is kept and handed over to the flight path | `glide`, `flap`, `dive` (held pose, faded in for the stoop), `takeoff`, `land`, `perch`, `head_turn` |
| `rattlesnake_v1i.glb`, `rattlesnake_v1i_mobile.glb` | western diamondback, ~1.1 m, the scene's snake (final handover files, used unchanged). ~38 dorsal rows of rounded, finely keeled scales; diamonds of varied size with cream borders, salt-and-pepper speckle, black-and-white tail rings; near-isotropic body UVs over three body materials; no folded faces; welded neck, wet tongue, clearcoat eyes under a cornea shell. `RS_FILES` in `src/desert.js` loads the mobile file on phones (maps up to 1950 px, ~85 MB of GPU memory) and the desktop file elsewhere (up to 3508 px, ~292 MB); they look the same at ~1.3 m. Both share the rig and clips used since v1b, so a new file needs only its name there. Crawling is procedural on `Spine_01..44` (sidewinding on open sand, serpentine near grass and rocks, rectilinear when wary) and presses J- and S-shaped tracks into the sand that fade with wind, dust and rain. The tongue leaves through the snout notch with the jaw shut. Transmission (rattle) is switched off at load: in three.js it costs a second scene pass every frame | `defensive_coil`, `tongue_flick`, `relaxed_coil` |
| `pupfish_male_v3.glb`, `pupfish_female_v3.glb` | desert pupfish at real size (male ~59 mm, female ~51 mm), used unchanged. 16 fish in the oasis pond (11 on phones): a loose school that darts and pauses over the shallow sandy ring, and 3 males (2 on phones) holding territories in 5–30 cm of water at the margin, chasing other males out and squaring up to their neighbours. They scatter from a drinking camel or a low eagle. The pond surface is an opaque layer, so the fish are drawn after it and blended over it by the light that comes back through the surface (depth absorption, surface Fresnel), lifted to their apparent depth, wobbled by the ripples, with caustics on their backs. The male body adds a view-dependent thin-film sheen (teal head-on, blue, violet at grazing angles) over the baked blue. Fish under ~1.5 px are hidden and their rigs not updated | `swim` (0.8 s loop, played faster with speed), `idle_turn` (during longer pauses) |
| `sinai_agama_v1b.glb` + `sinai_agama_v1b_blue.webp` | Sinai agama, ~25 cm, a male and a female (cloned). Meshopt-packed from the release file (base colour WebP 1024, other maps 512; 1.7 MB). The male's breeding-blue base colour is a second texture mixed in by body temperature, which follows sun, shade and rain | `idle`, `run`, `climb` (it turns head-down to come down a trunk), `bask`, `head_bob` |
| `saguaro_v3.glb` | saguaros at real height: nodes `s3` (3 m), `s7f` (7 m, flowering), `s12` (12 m, five welded arms) and their LOD1 meshes `s3_lod1`, `s7_lod1`, `s12_lod1`, which take over once single spines no longer resolve on screen | — |
| `barrel_cactus_v3.glb` | fishhook barrel cactus: squat body 0.74 m tall × 0.59 m (24 ribs), ~2,000 spine cards with red-brown hooked centrals, ring of flowers on the crown. Drawn instanced (one draw per material for all barrels), in small groups on the gravel patches, leaning toward the south-west sun | — |
| `cholla_v2.glb` | teddy-bear cholla, 1.6 m | — |
| `tent.glb` | Bedouin tent | — |

The two camels are configured in `CAMEL_KIND` in `src/desert.js` (file, scale, walk gait, coat tint, call pitch).
`kneel_down` / `stand_up` root translation is lightly smoothed at load to remove a one-key drop where the knees meet the sand.

The v4 files and `bald_eagle_v1` are Godot's Tripo + Blender builds with their embedded textures re-encoded by `tools/glbtex.py`
(1024 px JPEG; both camels' base colour kept at 2048 px, the Bactrian's fur cards at 256 px); geometry and clips are untouched.

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
