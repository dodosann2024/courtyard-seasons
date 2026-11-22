# d159 证明

bundle：`desert.452b886a46.js`（基线 d158：`desert.3bd0f9cde2.js`，同脚本、同机位、同设置）

| 文件 | 说明 |
|---|---|
| `B_day_far_desert.png` | 白天远景 沙漠 |
| `B_day_far_sand_vs_sea.png` | 白天远景 沙漠 vs 海洋 |
| `B_day_far_sea.png` | 白天远景 海洋 |
| `B_day_overview_desert.png` | 白天总览 沙漠 |
| `B_day_overview_sand_vs_sea.png` | 白天总览 沙漠 vs 海洋 |
| `B_day_overview_sea.png` | 白天总览 海洋 |
| `B_dusk_far_desert.png` | 黄昏远景 沙漠：右侧不再有斜向淡片 |
| `B_dusk_far_sand_vs_sea.png` | 黄昏远景 沙漠 vs 海洋 |
| `B_dusk_far_sea.png` | 黄昏远景 海洋 |
| `B_dusk_overview_desert.png` | 黄昏总览 沙漠 |
| `B_dusk_overview_sand_vs_sea.png` | 黄昏总览 沙漠 vs 海洋 |
| `B_dusk_overview_sea.png` | 黄昏总览 海洋 |
| `B_night_far_desert.png` | 夜间远景 沙漠：右侧密度连续 |
| `B_night_far_sand_vs_sea.png` | 夜间远景 沙漠 vs 海洋 |
| `B_night_far_sea.png` | 夜间远景 海洋 |
| `B_night_overview_desert.png` | 夜间总览 沙漠 |
| `B_night_overview_sand_vs_sea.png` | 夜间总览 沙漠 vs 海洋 |
| `B_night_overview_sea.png` | 夜间总览 海洋 |
| `B_sand_vs_sea_far.png` | 沙幕 vs 海洋瀑布 远 |
| `B_sand_vs_sea_mid.png` | 沙幕 vs 海洋瀑布 中 |
| `B_sand_vs_sea_near.png` | 沙幕 vs 海洋瀑布 近：横向接缝抹匀 |
| `B_sandfall_far.png` | 沙幕远景：右侧纱幕连续 |
| `B_sandfall_mid.png` | 沙幕中景 |
| `B_sandfall_near.png` | 沙幕近景：近距减薄之后（背风积雪检查） |
| `B_sandfall_near_pair.png` | 沙幕近景（对照机位，同 `B_sand_vs_sea_near` 左半） |
| `B_sea_fall_far.png` | 海洋瀑布参照 远 |
| `B_sea_fall_mid.png` | 海洋瀑布参照 中 |
| `B_sea_fall_near.png` | 海洋瀑布参照 近 |
| `q_day_far.png` | 白天远景（风 0.5） |
| `q_day_mid.png` | 白天中景（大风）：沙幕连续 |
| `q_dusk_far.png` | 黄昏远景（风 0.5） |
| `q_night_far.png` | 夜间远景（风 0.5） |
| `q_day_far_right_d158_vs_d159.png` | 白天远景右侧 d158 之前 / d159 之后 |
| `q_dusk_far_right_d158_vs_d159.png` | 黄昏远景右侧 d158 之前 / d159 之后：淡片消失 |
| `q_near_seam_d158_vs_d159.png` | 近景接缝带 d158 之前 / d159 之后 |
| `d159-report.json` | 运行记录与亮度台阶数值 |

## 改了什么

- 远景右侧淡片：每条沙瀑原本用自己唇口的一个法线打光，环形在右侧转开处呈一片片平面（看起来像更透的几何薄片）。现改为每个顶点按其所在唇口位置的法线打光，环形明暗连续。纯打光改动，不透明度不变。
- 近景横向接缝：近距薄纱在崖底边缘以下背后由岩石变成亮云，同一不透明度下崖底锯齿边透出成一道横缝。现薄纱沿用远景整幕的下延范围，并在崖底边缘附近逐渐加厚；上半部仍是原来的近距薄纱。

## 亮度台阶（越小越匀，d158 → d159）

| 位置 | d158 | d159 |
|---|---|---|
| 沙幕远景右侧 | 3.96 | 3.27 |
| 白天远景右侧 | 3.48 | 3.33 |
| 黄昏远景右侧 | 10.44 | 8.48 |
| 夜间远景右侧 | 7.19 | 6.41 |
| 近景接缝带（列中位数） | 6.80 | 2.80 |

远景为右半沙幕列平均亮度相隔 8 px 的最大台阶；黄昏余下数值来自沙瀑本身的竖向绳纹（黄昏对比更强），淡片已消失。

## 未动

- 风吹沙、沙丘随时间变形、近距减薄、沙幕层次主体
- 蟹钳铰链与咬合、鸵鸟奔跑/坐下循环与坐姿轮廓（本轮未重拍，d158 证明仍有效）
- ostrich / gerbil / scorpion / tortoise 源 mesh（Godot 债，等新 glb）
