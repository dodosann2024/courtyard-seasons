# Desert Tripo GLBs

`src/desert.js` loads these with the self-hosted three `GLTFLoader` from `assets/vendor/` (no CDN), via `glb(key)`.
The palms are built procedurally in `desert.js`; there is no palm model.

| File | Used for | Clips |
|------|----------|-------|
| `camel_v4.glb` | dromedaries (~3.2 m long in scene) | `walk` (in place, .99 m/s), `idle`, `kneel_down`, `kneel_rest`, `stand_up`, `drink` |
| `eagle_v4.glb` | eagle, flying (~2 m span) and perched meshes on one skeleton | `glide`, `flap`, `takeoff`, `land`, `perch`, `head_turn` |
| `snake_v4.glb` | horned viper (~1.35 m); crawling is procedural on `Body_01..30` | `coil`, `tongue_flick` |
| `saguaro.glb` | saguaro cacti | — |
| `tent.glb` | Bedouin tent | — |

The second camel slot is reserved for a Bactrian (`bactrian_v1.glb`, same clips as `camel_v4`): drop the file here, add it
to `manifest.json`, and set `CAMEL_KIND.bact.file` in `src/desert.js`. Until then that slot shows a dromedary.

The v4 files are Godot's Tripo + Blender builds with their embedded textures re-encoded by `tools/glbtex.py`
(1024 px JPEG, the camel's base colour kept at 2048 px); geometry and clips are untouched.

Format: binary glTF with embedded textures, Y-up, metres, origin at ground contact.
