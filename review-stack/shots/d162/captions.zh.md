# d162 证明图说明

## #0 云海（岛下方/岛外）

- `C_cloudsea_far_155_158_160_main_branch.png`：同一远景机位，#155 94fc50d / #158 b6dbb90 / #160 e9275f4 / main 4e9d5fe / 本分支。五个版本岛下都有云海。
- `C_cloudsea_under_155_158_160_main_branch.png`：岛下仰视机位，同上五个版本对比。
- `C_cloudsea_ov_155_158_160_main_branch.png`：俯瞰机位，同上五个版本对比。
- `C_cloudsea_edge_155_158_160_main_branch.png`：站在岛边往外往下看，同上五个版本对比。
- `C_cloudsea_phone_default_155_160_main.png`：手机（iPhone 13 尺寸）默认机位，#155 / #160 / main。#155 的整圈沙帘挡住了岛下的云海，#160 和 main 的云海更完整。
- `C_cloudsea_main_iphone_day_dusk_night_rain_far.png`、`C_cloudsea_main_iphone_day_dusk_night_rain_under.png`：main 在白天/黄昏/夜晚/雨天的远景和岛下机位，四种天气都有云海。
- `C_cloudsea_home_sea_desert_switch.png`：从首页经场景面板“海→沙漠”切换进入（访客实际路径），云海也在。

结论：天空穹顶、`SKY_HOR`、`sky_cloudsea_pano.jpg`（自 c53e2e0 起未改，线上 200 正常返回）、renderOrder 和雾在 #155 到 main 之间都没变。#160 删掉的只是整圈沙帘 `SF.rim`。在测试过的所有机位、设备尺寸和天气下，没有哪个提交让云海消失；main 的云海覆盖率还高于 #155～#159（远景下半屏云量：#155 0.51、#158 0.46、#159 0.47、#160/main 0.90）。

## 1. 雨中帐篷（平视机位）

- `tent-rain.mp4`：1280×720，6 fps，6 秒，带场景雨声（平均 −20.9 dB）。眼高 1.55 m，距帐篷 6.8 m，从帐篷正面一侧平视。先晴天、布面干燥；下雨后缩时 48 秒，布面湿透变深；最后是实时雨中。两只鸵鸟（ostrich_v2ag，模型未改）站在帐篷和镜头之间的两侧，36 帧里没有一帧在帐篷轮廓后面，不会看起来像站在帐篷顶上。
- `B_tent_rain_eye_level_strip.png`：片中 6 帧并排。
- `B_tent_rain_eye_level_dry.png` / `B_tent_rain_eye_level_wet.png`：下雨前的干布面 / 雨中的湿布面。
- `B_tent_rain_roof_above.png`：同一时刻从高处看，鸵鸟都在帐篷外的沙地上，帐篷顶上没有鸵鸟。
- `d162-tent-report.json`：inSilhouetteFrames 0/36，birdBehindOnScreenFrames 0，布面湿度 0 → 1，使用中的鸵鸟文件只有 ostrich_v2ag。

## 2. 湖边蟹（crab_v6c）横着走

- `crab_v6c-sideways-walk.mp4`：1280×720，12 fps，3 秒，慢放 ½。镜头固定在岸上、蟹的身后，离蟹约 0.66 m，贴近沙面。蟹先向右横走，再向左横走，可以直接看脚尖是否在沙面上打滑。
- `D_crab_v6c_sideways_strip.png`：片中 6 帧并排。
- `d162-crab-report.json`：两种打滑指标（单位 m/s；身体速度：走 0.1、快跑 0.42）。

| 步态 | 1.5 mm 旧指标（改前 → 改后） | 0.4 mm 承重脚尖（改前 → 改后） | 脚尖沿前进方向的平均漂移（改前 → 改后） |
|---|---|---|---|
| 走 +x | 0.0289 → 0.0280 | 0.0061 → 0.0055 | +0.0017 → −0.0007 |
| 走 −x | 0.0298 → 0.0282 | 0.0069 → 0.0060 | +0.0019 → −0.0008 |
| 快跑 +x | 0.0874 → 0.0785 | 0.0326 → 0.0344 | +0.0162 → −0.0007 |
| 快跑 −x | 0.0913 → 0.0779 | 0.0366 → 0.0356 | +0.0195 → +0.0015 |

改动：承重脚尖原来会顺着前进方向往前漂（走 1.8%，快跑 4.3%），说明步频比地速略慢。把每个步频周期对应的地速从 0.14 / 0.48 m/s 调成 0.1375 / 0.46 m/s 之后，漂移基本归零。蟹模型、动画片段都没改，也没有新的 Tripo 花费。剩下 0.4 mm 档约 6 mm/s 的数值来自脚尖着地时左右的微小晃动，视频里看不出滑步。

## 3. 远景 / 广角（白天、黄昏）与沙瀑

- `A_near_seam_day_before_after.png`、`A_near_seam_dusk_before_after.png`：近景崖壁，上为修复前、下为修复后。修复前崖壁中段有一条横贯全岛的亮缝（墙脚和岛底在同一高度折成一道棱，低角度光照下特别亮）；修复后这道棱被磨圆，亮缝消失，白天黄昏都一样。
- `A_far_slope_and_dusk_bands_before_after.png`：远景右半边，左为修复前、右为修复后，上白天下黄昏。修复前右上沙坡上有淡紫色的海市蜃楼斑块（陡坡也被当成了平沙地），修复后只在真正平坦的远处沙地出现；黄昏崖壁上的横条纹也变成柔和过渡。
- `A_day_*.png`、`A_dusk_*.png`：本分支新拍的远景（far）、广角（wide）、全景（full）、近景（near）、俯瞰（overview），白天和黄昏各一套。
- `E_sandfall_day_full.png`、`E_sandfall_dusk_full.png`、`E_sandfall_day_mid.png`、`E_sandfall_dusk_mid.png`：沙瀑是崖边一股股分开的竖直沙流，中间露出石崖和天空，不是整圈沙帘或纱墙。
- `sandfall-streams.mp4`：1280×720，12 fps，3 秒，镜头绕岛慢慢转，分开的沙流随风摆动。
- `d162-wide-falls-report.json`：沙瀑共 54 股，覆盖崖边一周的 26.6%，最长一段连续覆盖只有 12.5°（整圈沙帘是 100% / 360°）。

## 性能与回归

- `perf.json`：`tools/e2e/perf.mjs` 同一次运行中本分支与 main 4e9d5fe 交替测量（iPhone 13 模拟、CPU 降速 4 倍、晴天，每帧 JS 时间）。本分支平均 13.4 ms，main 15.1 ms（上限 17.4 ms）；两边都没有超过 200 ms 的帧。
- `tools/e2e/desert.mjs` 回归：24 项全部通过（风吹沙、沙丘随时间变形、雨落在沙地/帐篷/湖面、雨声、雾、雪、冰雹、各种动物行为）。
- 打水漂石头保持暂停，本轮没有改动。没有新增场景元素。
