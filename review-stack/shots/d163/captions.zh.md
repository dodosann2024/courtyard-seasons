# d163 证据说明

## 5. 云海 / 缓存

- `E_cloudsea_chromium_photo.png`：Chromium，正常加载，云海照片贴图（QA `skyTex()==="photo"`）。
- `E_cloudsea_chromium_photo_blocked_fallback.png`：Chromium，拦截 `sky_cloudsea_pano.jpg`（4 次重试全部失败）后，云海由程序化云层兜底绘制，控制台输出 `[desert] cloud-sea photo failed to load…`，QA `skyTex()==="procedural"`；页面重新可见或恢复联网时会再次尝试加载照片。
- `E_cloudsea_webkit_photo.png`：WebKit（Playwright webkit），进入沙漠的飞入过程中，云海照片正常显示。
- `E_cloudsea_webkit_photo_blocked_fallback.png`：WebKit，拦截云海照片后的程序化云层兜底。
- `sw_chromium.json` / `sw_webkit.json`：Service Worker 更新实测（`tools/e2e/d163-sw.mjs`）。首次安装缓存名为 `cy-<沙漠包哈希前 6 位>-<全部资源内容哈希>`；发布新版本后旧缓存被删除、只剩新缓存，被修改的页面在下一次刷新即生效。两种内核均 `pass: true`。
