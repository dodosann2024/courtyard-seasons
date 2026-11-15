# Desert Tripo GLBs

`src/desert.js` loads these with the self-hosted three `GLTFLoader` from `assets/vendor/` (no CDN), via `glb(key)`.
The palms are built procedurally in `desert.js`; there is no palm model.

| File | Used for | Clips |
|------|----------|-------|
| `camel_v3.glb` | two dromedaries (~3.2 m long in scene) | `walk`, `idle`, `graze`, `drink` |
| `eagle_v3.glb` | eagle in flight (~2 m span) | `glide`, `flap`, `take_off`, `landing_flare` |
| `eagle_perch_v2.glb` | eagle perched on the saguaro / at the water | `perch_idle`, `drink` |
| `snake_v3.glb` | sand snake (~1.35 m) | `slither`, `sidewind`, `idle_coiled`, `strike` |
| `saguaro.glb` | saguaro cacti | — |
| `tent.glb` | Bedouin tent | — |

Format: binary glTF with embedded textures, Y-up, metres, origin at ground contact.
