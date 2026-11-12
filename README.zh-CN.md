<p align="center">
  <img src="docs/readme/hero.webp" alt="天空之境 · Sky Haven" width="100%">
</p>

<h1 align="center">天空之境 · Sky Haven</h1>

<p align="center">
  <em>云端深处，听见四季的流转。</em>
</p>

<p align="center">
  <a href="https://dodosann2024.github.io/courtyard-seasons/"><strong>在线体验</strong></a>
  ·
  <a href="https://dodosann2024.github.io/courtyard-seasons/sea/"><strong>空中海洋</strong></a>
  ·
  <a href="#画廊">画廊</a>
</p>

<p align="center">
  <a href="README.zh-CN.md">简体中文</a> ·
  <a href="README.md">English</a> ·
  <a href="README.ja.md">日本語</a> ·
  <a href="README.ko.md">한국어</a>
</p>

<p align="center">
  <img alt="three.js" src="https://img.shields.io/badge/three.js-WebGL-black?logo=threedotjs&logoColor=white">
  <img alt="static" src="https://img.shields.io/badge/纯静态-无%20CDN-2ea44f">
  <img alt="PWA" src="https://img.shields.io/badge/PWA-Service%20Worker-0078d4">
  <img alt="mobile" src="https://img.shields.io/badge/移动端优先-6f42c1">
</p>

---

五座浮在云端的小院，再加一片空中海洋，全部在浏览器里实时渲染。四季轮转、阴晴雨雪、昼夜交替，每一座院子还有自己的环境音——无需账号，没有后端，也不依赖任何 CDN。

## 亮点

- **五座浮空小院** — 默认木屋、日式竹庭、中式合院、韩式韩屋、欧式石屋，各自栖在一片云岛上。
- **四季与昼夜** — 春花、夏绿、秋叶、冬雪；入夜后窗口与灯笼会亮起来。
- **可感知的天气** — 晴、阴、雨与雷雨、冰雹、飘雪（随风漂移），院子里还会卷起尘旋风。
- **会呼吸的细节** — 夜间萤火虫、欧式喷泉、应季的鸟鸣虫声；想看时还可以打开流星雨与星座线。
- **细心的声音** — 每座院子有自己的环境底噪（日式竹筒「鹿威し」、喷泉、天气、虫鸟）。在 iOS 上，音频会在首次点击后启动，符合 Safari 的要求。
- **空中海洋** — 圆盘上的帆船，垂直跌落的水幕，以及清澈海水下的珊瑚世界。
- **移动端优先，可离线** — 纯静态站点，带 Service Worker；资源按内容哈希命名，全程不走 CDN。

## 画廊

### 四季

<p align="center">
  <img src="docs/readme/seasons.webp" alt="默认小院的春夏秋冬" width="100%">
</p>

| 春 | 夏 | 秋 | 冬 |
|:---:|:---:|:---:|:---:|
| ![](docs/readme/def-spring.webp) | ![](docs/readme/def-summer.webp) | ![](docs/readme/def-autumn.webp) | ![](docs/readme/def-winter.webp) |

### 小院 · 日与夜

| 院子 | 日 | 夜 |
|:---|:---:|:---:|
| **默认小院** | ![](docs/readme/def-day.webp) | ![](docs/readme/def-night.webp) |
| **日式庭院** | ![](docs/readme/jp-day.webp) | ![](docs/readme/jp-night.webp) |
| **中式小院** | ![](docs/readme/cn-day.webp) | ![](docs/readme/cn-night.webp) |
| **韩式小院** | ![](docs/readme/kr-day.webp) | ![](docs/readme/kr-night.webp) |
| **欧式小院** | ![](docs/readme/eu-day.webp) | ![](docs/readme/eu-night.webp) |

### 空中海洋

<p align="center">
  <img src="docs/readme/sea-day.webp" alt="白天空中海洋" width="48%">
  &nbsp;
  <img src="docs/readme/sea-night.webp" alt="夜雪中的空中海洋" width="48%">
</p>

## 技术栈

| 部分 | 说明 |
|:---|:---|
| **three.js** | 打包进 `src/app.js`，不引用任何 CDN |
| **WebGL** | 天空、水面、雪花、瀑布、丁达尔光等自定义着色器 |
| **Web Audio** | 程序化环境底噪 + 实录的虫鸟与天气循环 |
| **Service Worker** | `sw.js` 缓存核心资源，方便再次访问 |
| **Python 3** | `tools/build.py` 生成哈希资源与各院子页面 |

## 本地运行

```bash
git clone https://github.com/dodosann2024/courtyard-seasons.git
cd courtyard-seasons
python3 tools/build.py          # 从 src/ 重新生成哈希资源
python3 -m http.server 8000     # 任意静态服务器均可
# 打开 http://localhost:8000/
```

在 `src/` 下改代码，再跑一遍构建即可。GitHub Pages 直接托管仓库根目录。

## 目录结构

```
├── index.html / jp/ cn/ kr/ eu/ sea/   # 各院子入口页
├── sw.js                               # Service Worker
├── assets/                             # 哈希后的 JS、音频、缩略图
├── src/                                # 源码
│   ├── app.js          # 小院、四季、天气、音效
│   ├── sea.js          # 空中海洋（按需加载）
│   ├── ui.js / ui.css  # 面板、PWA 注册
│   ├── page.html       # HTML 壳
│   └── thumbs/         # 院子缩略图
├── tools/build.py                      # 静态构建
└── docs/readme/                        # README 配图
```

## 操作

| | |
|:---|:---|
| **拖拽 / 双指** | 环绕与缩放视角 |
| **院** | 在五座小院与空中海洋之间切换 |
| **季** | 春 · 夏 · 秋 · 冬 |
| **天** | 晴 · 阴 · 雨 · 冰雹 · 雪（含强度） |
| **夜** | 切换夜晚；**四季轮转** 自动过年 |
| **风** | 风力滑条 |
| **♪** | 总音量、天气声、自然环境音 |

## 浏览器支持

现代 Chromium、Firefox、Safari（含 iOS）。需要 WebGL 与 Web Audio。竖屏手机上体验最好——场景就是按这个构图做的。

## 致谢

这是一个围绕 three.js、WebGL 着色器与实录环境声的个人创作项目。标题与题词：**天空之境 · Sky Haven** — *云端深处，听见四季的流转。*

---

<p align="center">
  <a href="https://dodosann2024.github.io/courtyard-seasons/">打开在线站点</a>
  ·
  <a href="README.md">English</a>
  ·
  <a href="README.ja.md">日本語</a>
  ·
  <a href="README.ko.md">한국어</a>
</p>
