# Desert Tripo GLBs

Place finished `.glb` files here and flip the matching key in `manifest.json` to `1`.
`desert.js` loads them with the **self-hosted** three `GLTFLoader` from `assets/vendor/` (no CDN).
If a key is missing or the file fails, the procedural mesh stays.

```json
{"camel":1,"eagle":1,"snake":1,"tent":1,"palm":1,"cactus":1}
```

## Frame / format (all models)

| Spec | Value |
|------|--------|
| Format | Binary glTF **`.glb`** (embedded buffers + textures) |
| Up axis | **Y-up** |
| Forward | **−Z** (three.js default) |
| Origin | Ground contact (feet / base of trunk / belly for snake) |
| Units | Metres (loader auto-fits height to targets below) |
| Materials | PBR metal/rough; **textured** preferred |
| Animations | Optional `AnimationClip`s named as below (played in a follow-up mixer pass) |

## Paths & fit height

| File | Fit height | Loader key |
|------|------------|------------|
| `assets/models/camel.glb` | 1.85 m | `camel` |
| `assets/models/eagle.glb` | 0.55 m (body) | `eagle` |
| `assets/models/snake.glb` | 0.12 m (body thickness → length ~1.2 m) | `snake` |
| `assets/models/tent.glb` | 2.2 m | `tent` |
| `assets/models/palm.glb` | 4.2 m | `palm` |
| `assets/models/cactus.glb` | 2.6 m | `cactus` |

## Tripo text prompts

### 1. Camel — `assets/models/camel.glb`
**Prompt:** Low-poly stylized dromedary camel for a real-time WebGL oasis scene. Standing neutral A-pose / T-pose with all four feet planted on a flat ground plane, weight even, head slightly raised, one hump. Clean game-asset silhouette, readable at distance. Soft sandy-tan fur with subtle darker knees and muzzle; no saddle. Stylized-realistic (not cartoon, not photoreal). Target **6k–10k triangles**, **textured** (2K albedo + ORM or packed rough/metal), watertight manifold mesh, single root. Y-up, −Z forward, origin between front feet at ground.

**Rig / clips:** Root + hips, spine, neck, head, four legs (upper/lower/foot), tail. Clips: `idle`, `walk_pace` (ipsilateral pace gait), `graze` (neck down), `drink` (kneel + neck to ground). Loopable, 30 fps, 2–4 s each.

### 2. Eagle — `assets/models/eagle.glb`
**Prompt:** Low-poly golden eagle, wings half-spread in a neutral soar-ready pose (not fully folded, not full bank). Talons relaxed, beak closed, head facing −Z. Brown body, paler head/neck, yellow beak, dark flight feathers. Stylized-realistic game bird. Target **4k–8k triangles**, **textured** (1K–2K), clean topology for wing bones. Y-up, −Z forward, origin at body center slightly above feet.

**Rig / clips:** Spine, neck, head, left/right wing (shoulder, elbow, tip), tail. Clips: `soar_glide`, `flap`, `flare_land`, `perch_idle`, `takeoff`. Loopable except `flare_land` / `takeoff`.

### 3. Snake — `assets/models/snake.glb`
**Prompt:** Low-poly desert sidewinder / sand snake, elongated body in a gentle S-curve resting on flat ground, head slightly raised. Sandy ochre with soft brown diamond pattern. Stylized-realistic. Target **3k–5k triangles**, **textured** (1K), even segment thickness for deformation. Y-up, −Z toward head, origin under mid-body on ground.

**Rig / clips:** Chain of 12–18 spine bones + head/jaw. Clips: `sidewind_loop`, `idle_tongue`, `slither_forward`. Prefer bone chain over blendshapes.

### 4. Tent — `assets/models/tent.glb` (optional polish)
**Prompt:** Low-poly Bedouin / desert camp tent, peaked ridge, canvas drapes, wooden poles, closed entrance facing −Z. Warm sand cloth, weathered wood. Target **2k–5k triangles**, **textured**. Origin at ground center. No characters.

**Rig / clips:** Optional soft bones on cloth flaps: `cloth_wind` loop. Static is fine.

### 5. Palm — `assets/models/palm.glb` (optional)
**Prompt:** Low-poly date palm, straight trunk with rough bark, crown of 8–12 fronds, small date clusters optional. Oasis greenery. Target **3k–6k triangles**, **textured**. Origin at trunk base. Height ~4 m.

**Rig / clips:** Trunk + frond bones; `sway_wind` loop.

### 6. Cactus — `assets/models/cactus.glb` (optional)
**Prompt:** Low-poly saguaro cactus with 2–3 arms, soft ribbed green body, sparse spines as texture not geo. Target **1.5k–3k triangles**, **textured**. Origin at base. One arm tip marked as perch (taller arm).

**Rig / clips:** None required (static).

## Drop-in checklist

1. Export each as `.glb` with embedded textures.
2. Copy to the path above.
3. Set the key to `1` in `manifest.json`.
4. Rebuild / refresh — desert swaps procedural → Tripo; missing keys keep procedural with no 404 noise.
