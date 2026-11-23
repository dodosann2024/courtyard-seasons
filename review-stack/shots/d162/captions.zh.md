# d162 证明图说明

## #0 云海（岛下方/岛外）

- `C_cloudsea_far_155_158_160_main_branch.png`：同一远景机位，#155 94fc50d / #158 b6dbb90 / #160 e9275f4 / main 4e9d5fe / 本分支。五个版本岛下都有云海。
- `C_cloudsea_under_155_158_160_main_branch.png`：岛下仰视机位，同上五个版本对比。
- `C_cloudsea_ov_155_158_160_main_branch.png`：俯瞰机位，同上五个版本对比。
- `C_cloudsea_edge_155_158_160_main_branch.png`：站在岛边往外往下看，同上五个版本对比。
- `C_cloudsea_phone_default_155_160_main.png`：手机（iPhone 13 尺寸）默认机位，#155 / #160 / main。#155 的整圈沙帘挡住了岛下的云��，#160 和 main 的云海更完整。
- `C_cloudsea_main_iphone_day_dusk_night_rain_far.png`、`C_cloudsea_main_iphone_day_dusk_night_rain_under.png`：main 在白天/黄昏/夜晚/雨天的远景和岛下机位，四种天气都有云海。
- `C_cloudsea_home_sea_desert_switch.png`：从首页经场景面板“海→沙漠”切换进入（访客实际路径），云海也在。

结论：天空穹顶、`SKY_HOR`、`sky_cloudsea_pano.jpg`（自 c53e2e0 起未改，线上 200 正常返回）、renderOrder 和雾在 #155 到 main 之间都没变。#160 删掉的只是整圈沙帘 `SF.rim`。在测试过的所有机位、设备尺寸和天气下，没有哪个提交让云海消失；main 的云海覆盖率还高于 #155～#159（远景下半屏云量：#155 0.51、#158 0.46、#159 0.47、#160/main 0.90）。
