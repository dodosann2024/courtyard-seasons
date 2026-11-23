# d163 证据说明

## 5. 云海 / 缓存

- `E_cloudsea_chromium_photo.png`：Chromium，正常加载，云海照片贴图（QA `skyTex()==="photo"`）。
- `E_cloudsea_chromium_photo_blocked_fallback.png`：Chromium，拦截 `sky_cloudsea_pano.jpg`（4 次重试全部失败）后，云海由程序化云层兜底绘制，控制台输出 `[desert] cloud-sea photo failed to load…`，QA `skyTex()==="procedural"`；页面重新可见或恢复联网时会再次尝试加载照片。
- `E_cloudsea_webkit_photo.png`：WebKit（Playwright webkit），进入沙漠的飞入过程中，云海照片正常显示。
- `E_cloudsea_webkit_photo_blocked_fallback.png`：WebKit，拦截云海照片后的程序化云层兜底。
- `sw_chromium.json` / `sw_webkit.json`：Service Worker 更新实测（`tools/e2e/d163-sw.mjs`）。首次安装缓存名为 `cy-<沙漠包哈希前 6 位>-<全部资源内容哈希>`；发布新版本后旧缓存被删除、只剩新缓存，被修改的页面在下一次刷新即生效。两种内核均 `pass: true`。

## 3. 岛底沙流

- `C_sandfall_overview_day.png`：白天全景。54 股沙流各自分开，落过岛底后散开、变淡，化为细沙雾；没有整圈沙帘，也没有脱离岛体的光柱。
- `C_sandfall_mid_day.png`：白天中景。主沙流过了岛底继续下落（不再在岛底被平切），颜色加深为背光的赭色，不再和天空混成一色；边缘撕成细丝、逐渐稀薄。
- `C_sandfall_dusk.png`：黄昏全景，同样分股、渐散。
- `C_sandfall_wind_A.png` / `C_sandfall_wind_B.png`：强风（wind=1）分别从两个相反方向吹，下段沙雾随风向偏移（风向 B 下右侧沙雾明显斜向下风）。
- `sandfall-mist.mp4`：中景，片中风向转动约 220°，沙雾随之飘移（12 fps，39 帧）。
- `d163-falls-report.json`：分股统计。rimCovered 0.266（岛沿被沙流覆盖的比例），最长连续覆盖 12.5°（整圈沙帘会是 360°）。

## 4. 岛面边缘蜃景（紫蓝斑）

- `D_rim_mirage_near_before_after.png`：d162 接缝对比的同一近景机位，上 main、下本分支。左侧石块旁和远端岛沿的紫蓝色水洼状斑块消失，沙面恢复成沙色。
- `D_rim_mirage_mid_before_after.png`：中景，同样对比。
- 原因：蜃景屏幕通道会把沙面“上方”的画面倒映进沙里；靠近岛沿、或视线越过这块沙后很快就离开岛面的地方，倒映的是岛外的天空和云海，于是成了紫蓝斑。修复：岛沿一圈不再产生蜃景，并且沿视线方向往前 8/18/30/44 个单位内若会越过岛沿，也不产生；视线一路落在沙面上的地方（例如朝沙丘看）仍保留淡淡的热浪蜃景。
- `d163-rim-report.json`：近景沙面带内紫蓝像素数，main 2211 → 本分支 1728；关闭蜃景通道时为 1686，即蜃景本身产生的紫蓝像素从 525 降到 42（约 -92%）。

## 1. 帐篷雨（人眼高度新机位）

- `tent-rain.mp4`：1280×720，6 fps，5 秒，带雨声。机位放在帐篷远离挂毯架的一侧、人眼高度（约 2.6 m），帐篷占画面左半，湖面在帐篷后方。顺序：晴天干燥 → 天空依次出现片云、积云、转阴（缩时）→ 小阵雨，沙地出现深色湿斑 → 大雨缩时：布面湿透变深、水顺布面流下，沙地积水变暗 → 大雨实时，镜头推近，雨点在布面溅起。雨声从第一阵雨开始淡入（平均音量 −20.4 dB）。
- 鸵鸟：开拍前把两只鸵鸟放到两个机位视野之外的空沙地上，每一步都检测是否会进入画面，30 帧中入镜 0 帧；鸵鸟模型仍是 `ostrich_v2ag`（与 main 无差异，md5 49b43fc41ecdcefe749afd7b71ae11a8）。画面中的骆驼是原有场景动物。
- `B_tent_rain_strip.png`：6 帧缩略：晴 → 片云 → 积云 → 转阴 → 大雨 → 推近。
- `B_tent_rain_dry.png` / `B_tent_rain_wet.png` / `B_tent_rain_close.png`：同机位干燥、大雨后、推近特写。湖面雨点涟漪在这个距离较细，推近镜头中右侧湖面可见。
- `d163-tent-report.json`：天空阴度 ovc 0 → 0.86，布面湿度 0 → 1，沙地湿度 0 → 1；ostrichInFrameFrames 0。
