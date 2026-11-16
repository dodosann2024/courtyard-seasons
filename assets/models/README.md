# Desert Tripo GLBs

`src/desert.js` loads these with the self-hosted three `GLTFLoader` from `assets/vendor/` (no CDN), via `glb(key)`.
The palms are built procedurally in `desert.js`; there is no palm model.

| File | Used for | Clips |
|------|----------|-------|
| `camel_v4b.glb` | dromedary (~3.2 m long in scene); v4 with the kneeling hind legs fixed | `walk` (in place, .99 m/s), `idle`, `kneel_down`, `kneel_rest`, `stand_up`, `drink` |
| `bactrian_v1.glb` | Bactrian camel, scaled to ~1.8 m at the withers; walk played at 90 % with ground speed matched | same as `camel_v4b` |
| `bald_eagle_v1.glb` | bald eagle, one mesh for flight and perch (scaled x.9 to a 1.8 m span); takeoff/land root motion is kept and handed over to the flight path | `glide`, `flap`, `dive` (held pose, faded in for the stoop), `takeoff`, `land`, `perch`, `head_turn` |
| `rattlesnake_v1i.glb`, `rattlesnake_v1i_mobile.glb` | western diamondback, ~1.1 m, the scene's snake (final handover files, used unchanged). ~38 dorsal rows of rounded, finely keeled scales; diamonds of varied size with cream borders, salt-and-pepper speckle, black-and-white tail rings; near-isotropic body UVs over three body materials; no folded faces; welded neck, wet tongue, clearcoat eyes under a cornea shell. `RS_FILES` in `src/desert.js` loads the mobile file on phones (maps up to 1950 px, ~85 MB of GPU memory) and the desktop file elsewhere (up to 3508 px, ~292 MB); they look the same at ~1.3 m. Both share the rig and clips used since v1b, so a new file needs only its name there. Crawling is procedural on `Spine_01..44` (sidewinding on open sand, serpentine near grass and rocks, rectilinear when wary) and presses J- and S-shaped tracks into the sand that fade with wind, dust and rain. The tongue leaves through the snout notch with the jaw shut. Transmission (rattle) is switched off at load: in three.js it costs a second scene pass every frame | `defensive_coil`, `tongue_flick`, `relaxed_coil` |
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

Format: binary glTF with embedded textures, Y-up, metres, origin at ground contact.
