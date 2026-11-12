<p align="center">
  <img src="docs/readme/hero.webp" alt="天空之境 · Sky Haven" width="100%">
</p>

<h1 align="center">天空之境 · Sky Haven</h1>

<p align="center">
  <em>Deep in the clouds, hear the seasons turn.</em><br>
  <em>云端深处，听见四季的流转。</em>
</p>

<p align="center">
  <a href="https://dodosann2024.github.io/courtyard-seasons/"><strong>Live demo</strong></a>
  ·
  <a href="https://dodosann2024.github.io/courtyard-seasons/sea/"><strong>Sky Sea</strong></a>
  ·
  <a href="#gallery">Gallery</a>
</p>

<p align="center">
  <a href="README.zh-CN.md">简体中文</a> ·
  <a href="README.md">English</a> ·
  <a href="README.ja.md">日本語</a> ·
  <a href="README.ko.md">한국어</a>
</p>

<p align="center">
  <img alt="three.js" src="https://img.shields.io/badge/three.js-WebGL-black?logo=threedotjs&logoColor=white">
  <img alt="static" src="https://img.shields.io/badge/static-no%20CDN-2ea44f">
  <img alt="PWA" src="https://img.shields.io/badge/PWA-service%20worker-0078d4">
  <img alt="mobile" src="https://img.shields.io/badge/mobile-first-6f42c1">
</p>

---

Five floating courtyards and a sky-borne sea, all rendered in the browser. Seasons cycle, weather shifts, night falls, and each yard keeps its own quiet soundtrack — no accounts, no backend, no CDN.

## Highlights

- **Five floating yards** — Default cabin, Japanese bamboo garden, Chinese courtyard, Korean hanok, and European cottage — each on its own cloud-island.
- **Four seasons & day / night** — Spring blossom, summer green, autumn leaves, winter snow; warm windows and lanterns after dark.
- **Weather you can feel** — Clear skies, cloud, rain and storm, hail, snow (with wind drift), plus dust whirlwinds across the yard.
- **Living details** — Fireflies at night, the European fountain, seasonal birds and insects, meteors and constellation lines when you want them.
- **Sound with care** — Per-yard ambient beds (bamboo *shishi-odoshi*, fountain, weather, wildlife). On iOS, audio starts on first tap, as Safari requires.
- **空中海洋 · Sky Sea** — A ship on a floating disc of ocean, vertical rim waterfalls, and a coral world beneath the glass-clear water.
- **Mobile-first & offline-ready** — Built as a static site with a service worker; assets are content-hashed and served without any CDN.

## Gallery

### The seasons

<p align="center">
  <img src="docs/readme/seasons.webp" alt="Spring, summer, autumn, winter on the default yard" width="100%">
</p>

| Spring | Summer | Autumn | Winter |
|:---:|:---:|:---:|:---:|
| ![](docs/readme/def-spring.webp) | ![](docs/readme/def-summer.webp) | ![](docs/readme/def-autumn.webp) | ![](docs/readme/def-winter.webp) |

### The yards · day & night

| Yard | Day | Night |
|:---|:---:|:---:|
| **Default** · 默认小院 | ![](docs/readme/def-day.webp) | ![](docs/readme/def-night.webp) |
| **Japanese** · 日式庭院 | ![](docs/readme/jp-day.webp) | ![](docs/readme/jp-night.webp) |
| **Chinese** · 中式小院 | ![](docs/readme/cn-day.webp) | ![](docs/readme/cn-night.webp) |
| **Korean** · 韩式小院 | ![](docs/readme/kr-day.webp) | ![](docs/readme/kr-night.webp) |
| **European** · 欧式小院 | ![](docs/readme/eu-day.webp) | ![](docs/readme/eu-night.webp) |

### Sky Sea

<p align="center">
  <img src="docs/readme/sea-day.webp" alt="Sky Sea by day" width="48%">
  &nbsp;
  <img src="docs/readme/sea-night.webp" alt="Sky Sea by night in snow" width="48%">
</p>

## Tech stack

| Piece | Notes |
|:---|:---|
| **three.js** | Bundled into `src/app.js` — no CDN, no external scripts |
| **WebGL** | Custom shaders for sky, water, snow, falls, god-rays |
| **Web Audio** | Procedural beds + recorded wildlife / weather loops |
| **Service worker** | `sw.js` caches core assets for repeat visits |
| **Python 3** | `tools/build.py` hashes assets and writes yard pages |

## Run locally

```bash
git clone https://github.com/dodosann2024/courtyard-seasons.git
cd courtyard-seasons
python3 tools/build.py          # rebuild hashed assets from src/
python3 -m http.server 8000     # any static server works
# open http://localhost:8000/
```

Edit under `src/`, then re-run the build. GitHub Pages serves the repo root as-is.

## Project layout

```
├── index.html / jp/ cn/ kr/ eu/ sea/   # yard entry pages
├── sw.js                               # service worker
├── assets/                             # hashed JS, audio, thumbs
├── src/                                # source of truth
│   ├── app.js          # yards, seasons, weather, audio
│   ├── sea.js          # Sky Sea scene (lazy-loaded)
│   ├── ui.js / ui.css  # panels, PWA register
│   ├── page.html       # HTML shell
│   └── thumbs/         # yard thumbnails
├── tools/build.py                      # static build
└── docs/readme/                        # README images
```

## Controls

| | |
|:---|:---|
| **Drag / pinch** | Orbit and zoom the camera |
| **院 / Yard** | Switch among the five yards and the Sky Sea |
| **季 / Season** | Spring · Summer · Autumn · Winter |
| **天 / Weather** | Clear · Cloud · Rain · Hail · Snow (+ intensity) |
| **夜 / Night** | Toggle night; **四季轮转** auto-cycles the year |
| **风 / Wind** | Slider for wind strength |
| **♪** | Master volume, weather beds, ambient wildlife |

## Browser support

Modern Chromium, Firefox, and Safari (including iOS). Needs WebGL and Web Audio. Best experienced on a phone held upright — that is how the scenes are composed.

## Credits

Built as a personal creative-coding project around three.js, WebGL shaders, and recorded field sounds. Title and tagline: **天空之境 · Sky Haven** — *云端深处，听见四季的流转。*

---

<p align="center">
  <a href="https://dodosann2024.github.io/courtyard-seasons/">Open the live site</a>
  ·
  <a href="README.zh-CN.md">中文</a>
  ·
  <a href="README.ja.md">日本語</a>
  ·
  <a href="README.ko.md">한국어</a>
</p>
