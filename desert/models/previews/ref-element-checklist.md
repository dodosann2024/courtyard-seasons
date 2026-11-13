# Reference element checklist (hard — do not merge until all PASS)

Source: `desert/reference.png` / Tripo island preview. Every element must be present.

| # | Ref element | Status | Notes |
|---|---|---|---|
| 1 | Floating island over cloud sea | PASS | `island.glb` base + cumulus cloud sea |
| 2 | Thick jagged rock cliff / rough underside | PASS | island cliff + tip spikes; sandstone grade |
| 3 | Turquoise oasis lake with reflections | PASS | shader disc over baked pond (mirror, no fish) |
| 4 | Two palms leaning apart (slender curved trunks, rounded feathery crowns) | PASS* | `palm.glb` is both ref palms as one model; match Tripo/ref look |
| 5 | Two saguaros (one by lake, one front-right) | PASS | `saguaro.glb` ×2; left near lake / perch, second on right |
| 6 | Bedouin tent with poles/ropes | PASS | `tent.glb` + stripes/flutter; procedural tent hidden |
| 7 | Campfire with rising smoke column | PASS | fire + grey smoke next to tent |
| 8 | Scattered sandstone rocks along the rim | PASS | rim rock scatter restored (warm sandstone) |
| 9 | Grass/shrub clumps around the lake | PASS | shore green rebuilt at Tripo lake |
| 10 | Dunes and ripples on the right | PASS | island.glb sand dunes + grade |
| 11 | Low sun on the right | PASS | sunset lighting (sun right, long soft shadows) |

\*Palm crown silhouette follows Tripo `palm.glb` (ref pair). If a newer Tripo palm better matches the slender V-lean, swap via manifest without changing placement.

**Hold merge:** do not merge desert13 (#90) or desert14 (#91) until this checklist is confirmed against the final Tripo assets.
