# Desert Tripo GLBs

Prefer **rigged** assets (AnimationMixer + procedural bone overlays). Static meshes remain as optional fallbacks.

`manifest.json` gates loading:

```json
{"camel_rigged":1,"eagle_rigged":1,"eagle_perch":1,"snake_rigged":1}
```

| File | Notes |
|------|--------|
| `camel_rigged.glb` | 34 joints, clip `preset:quadruped:walk` — mixer walk + procedural neck for graze/drink |
| `eagle_rigged.glb` | 26 joints, no clips — procedural wing flap / glide / flare / fold |
| `eagle_perch.glb` | Static folded perch, swapped on cactus / lake |
| `snake_rigged.glb` | 11 joints, clip `preset:serpentine:march` + travelling-wave overlay |

Textures resized to **1024** JPEG. No Draco/meshopt. Loader: `assets/vendor/des-gltf.js` (+ SkeletonUtils). SW precaches models + vendor.
