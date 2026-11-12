# Desert Tripo GLBs

Optimized static meshes (1k JPEG textures, no Draco/meshopt). `desert.js` loads them via the self-hosted `assets/vendor/des-gltf.js` GLTFLoader. Missing/failed keys keep the procedural fallback.

`manifest.json` gates loading:

```json
{"camel":1,"eagle":1,"eagle_perch":1,"snake":1}
```

| File | Fit | Notes |
|------|-----|--------|
| `camel.glb` | ~1.08 m tall | Pace / graze / drink via vertex deform |
| `eagle.glb` | ~0.68 m (wings) | Glide + flap deform |
| `eagle_perch.glb` | ~0.52 m tall | Swapped on cactus / lake landings |
| `snake.glb` | ~0.55 m footprint | Travelling sine + sand tracks |

All Y-up, origin at ground contact, metres. Service worker precaches these paths plus the vendor loader.
