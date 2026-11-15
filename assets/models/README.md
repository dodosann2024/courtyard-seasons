# Desert Tripo GLBs

`src/desert.js` loads these with the self-hosted three `GLTFLoader` from `assets/vendor/` (no CDN), via `glb(key)`.
The palms are built procedurally in `desert.js`; there is no palm model.

| File | Used for | Clips |
|------|----------|-------|
| `camel_v4b.glb` | dromedary (~3.2 m long in scene); v4 with the kneeling hind legs fixed | `walk` (in place, .99 m/s), `idle`, `kneel_down`, `kneel_rest`, `stand_up`, `drink` |
| `bactrian_v1.glb` | Bactrian camel, scaled to ~1.8 m at the withers; walk played at 90 % with ground speed matched | same as `camel_v4b` |
| `eagle_v4.glb` | eagle, flying (~2 m span) and perched meshes on one skeleton | `glide`, `flap`, `takeoff`, `land`, `perch`, `head_turn` |
| `snake_v4.glb` | horned viper (~1.35 m); crawling is procedural on `Body_01..30` | `coil`, `tongue_flick` |
| `saguaro.glb` | saguaro cacti | — |
| `tent.glb` | Bedouin tent | — |

The two camels are configured in `CAMEL_KIND` in `src/desert.js` (file, scale, walk gait, coat tint, call pitch).
`kneel_down` / `stand_up` root translation is lightly smoothed at load to remove a one-key drop where the knees meet the sand.

The v4 files are Godot's Tripo + Blender builds with their embedded textures re-encoded by `tools/glbtex.py`
(1024 px JPEG; both camels' base colour kept at 2048 px, the Bactrian's fur cards at 256 px); geometry and clips are untouched.

Format: binary glTF with embedded textures, Y-up, metres, origin at ground contact.
