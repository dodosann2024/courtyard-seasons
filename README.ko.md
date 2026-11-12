<p align="center">
  <img src="docs/readme/hero.webp" alt="天空之境 · Sky Haven" width="100%">
</p>

<h1 align="center">天空之境 · Sky Haven</h1>

<p align="center">
  <em>구름 깊은 곳에서, 사계절이 흐르는 소리를 듣다.</em><br>
  <em>云端深处，听见四季的流转。</em>
</p>

<p align="center">
  <a href="https://dodosann2024.github.io/courtyard-seasons/"><strong>라이브 데모</strong></a>
  ·
  <a href="https://dodosann2024.github.io/courtyard-seasons/sea/"><strong>공중 바다</strong></a>
  ·
  <a href="#갤러리">갤러리</a>
</p>

<p align="center">
  <a href="README.zh-CN.md">简体中文</a> ·
  <a href="README.md">English</a> ·
  <a href="README.ja.md">日本語</a> ·
  <a href="README.ko.md">한국어</a>
</p>

<p align="center">
  <img alt="three.js" src="https://img.shields.io/badge/three.js-WebGL-black?logo=threedotjs&logoColor=white">
  <img alt="static" src="https://img.shields.io/badge/static-CDN%20없음-2ea44f">
  <img alt="PWA" src="https://img.shields.io/badge/PWA-Service%20Worker-0078d4">
  <img alt="mobile" src="https://img.shields.io/badge/모바일%20우선-6f42c1">
</p>

---

구름 위에 떠 있는 다섯 개의 마당, 그리고 공중의 바다. 모두 브라우저만으로 그려집니다. 계절이 돌고, 날씨가 바뀌고, 밤이 내리며, 마당마다 고요한 환경음이 흐릅니다——계정, 백엔드, CDN 없이.

## 하이라이트

- **다섯 개의 부유 마당** — 기본 통나무집, 일본식 대나무 정원, 중국식 중정, 한국식 한옥, 유럽식 석조 오두막. 각자 구름 섬 위에 있습니다.
- **사계절과 낮·밤** — 봄꽃, 여름 초록, 가을 단풍, 겨울 눈. 밤에는 창과 등불이 켜집니다.
- **느껴지는 날씨** — 맑음, 흐림, 비와 뇌우, 우박, 눈(바람에 흩날림), 마당을 가로지르는 회오리 먼지바람.
- **살아있는 디테일** — 밤의 반딧불이, 유럽식 분수, 계절별 새와 벌레 소리. 원할 때 유성우와 별자리 선도 켤 수 있습니다.
- **세심한 사운드** — 마당별 앰비언트(일본식 대나무 사시오도시, 분수, 날씨, 야생 소리). iOS에서는 Safari 정책에 따라 첫 탭 이후 오디오가 시작됩니다.
- **공중 바다** — 원반 위의 범선, 가장자리에서 수직으로 떨어지는 폭포, 맑은 물 아래 산호 세계.
- **모바일 우선 · 오프라인** — 정적 사이트 + Service Worker. 에셋은 콘텐츠 해시로 이름 붙이며 CDN을 쓰지 않습니다.

## 갤러리

### 사계절

<p align="center">
  <img src="docs/readme/seasons.webp" alt="기본 마당의 봄·여름·가을·겨울" width="100%">
</p>

| 봄 | 여름 | 가을 | 겨울 |
|:---:|:---:|:---:|:---:|
| ![](docs/readme/def-spring.webp) | ![](docs/readme/def-summer.webp) | ![](docs/readme/def-autumn.webp) | ![](docs/readme/def-winter.webp) |

### 마당 · 낮과 밤

| 마당 | 낮 | 밤 |
|:---|:---:|:---:|
| **기본** · 默认小院 | ![](docs/readme/def-day.webp) | ![](docs/readme/def-night.webp) |
| **일본식** · 日式庭院 | ![](docs/readme/jp-day.webp) | ![](docs/readme/jp-night.webp) |
| **중국식** · 中式小院 | ![](docs/readme/cn-day.webp) | ![](docs/readme/cn-night.webp) |
| **한국식** · 韩式小院 | ![](docs/readme/kr-day.webp) | ![](docs/readme/kr-night.webp) |
| **유럽식** · 欧式小院 | ![](docs/readme/eu-day.webp) | ![](docs/readme/eu-night.webp) |

### 공중 바다

<p align="center">
  <img src="docs/readme/sea-day.webp" alt="낮의 공중 바다" width="48%">
  &nbsp;
  <img src="docs/readme/sea-night.webp" alt="밤눈 속의 공중 바다" width="48%">
</p>

## 기술 스택

| 구성 | 설명 |
|:---|:---|
| **three.js** | `src/app.js`에 번들. CDN 없음 |
| **WebGL** | 하늘·수면·눈·폭포·갓레이 등 커스텀 셰이더 |
| **Web Audio** | 절차적 앰비언트 + 녹음된 야생·날씨 루프 |
| **Service Worker** | `sw.js`가 핵심 자산을 캐시 |
| **Python 3** | `tools/build.py`가 해시 에셋과 마당 페이지를 생성 |

## 로컬 실행

```bash
git clone https://github.com/dodosann2024/courtyard-seasons.git
cd courtyard-seasons
python3 tools/build.py          # src/에서 해시 에셋 재생성
python3 -m http.server 8000     # 아무 정적 서버나 가능
# http://localhost:8000/ 열기
```

`src/`를 수정한 뒤 빌드를 다시 실행하세요. GitHub Pages는 저장소 루트를 그대로 제공합니다.

## 프로젝트 구조

```
├── index.html / jp/ cn/ kr/ eu/ sea/   # 마당 진입 페이지
├── sw.js                               # Service Worker
├── assets/                             # 해시된 JS·오디오·썸네일
├── src/                                # 소스
│   ├── app.js          # 마당·계절·날씨·오디오
│   ├── sea.js          # 공중 바다(지연 로딩)
│   ├── ui.js / ui.css  # 패널, PWA 등록
│   ├── page.html       # HTML 셸
│   └── thumbs/         # 썸네일
├── tools/build.py                      # 정적 빌드
└── docs/readme/                        # README 이미지
```

## 조작

| | |
|:---|:---|
| **드래그 / 핀치** | 카메라 궤도·줌 |
| **院 / 마당** | 다섯 마당과 공중 바다 전환 |
| **季 / 계절** | 봄 · 여름 · 가을 · 겨울 |
| **天 / 날씨** | 맑음 · 흐림 · 비 · 우박 · 눈(강도 포함) |
| **夜 / 밤** | 밤 전환; **四季轮转**으로 한 해 자동 순환 |
| **风 / 바람** | 바람 세기 슬라이더 |
| **♪** | 마스터 볼륨, 날씨음, 환경음 |

## 브라우저 지원

최신 Chromium, Firefox, Safari(iOS 포함). WebGL과 Web Audio가 필요합니다. 세로 모드 휴대폰에서 가장 잘 보이도록 장면이 구성되어 있습니다.

## 크레딧

three.js, WebGL 셰이더, 현장 녹음을 바탕으로 한 개인 크리에이티브 코딩 작품입니다. 제목과 문구: **天空之境 · Sky Haven** — *云端深处，听见四季的流转。*

---

<p align="center">
  <a href="https://dodosann2024.github.io/courtyard-seasons/">라이브 사이트 열기</a>
  ·
  <a href="README.md">English</a>
  ·
  <a href="README.zh-CN.md">中文</a>
  ·
  <a href="README.ja.md">日本語</a>
</p>
