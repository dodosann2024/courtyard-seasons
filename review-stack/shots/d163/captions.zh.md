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
- `sandfall-mist.mp4`：中景，片中风向转动约 1.1 圈的 3/4，沙雾随之飘移（12 fps，39 帧）。
- `d163-falls-report.json`：分股统计。rimCovered 0.266（岛沿被沙流覆盖的比例），最长连续覆盖 12.5°（整圈沙帘会是 360°）。
