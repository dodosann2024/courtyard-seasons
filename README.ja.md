<p align="center">
  <img src="docs/readme/hero.webp" alt="天空之境 · Sky Haven" width="100%">
</p>

<h1 align="center">天空之境 · Sky Haven</h1>

<p align="center">
  <em>雲の奥で、四季の移ろいを聴く。</em><br>
  <em>云端深处，听见四季的流转。</em>
</p>

<p align="center">
  <a href="https://dodosann2024.github.io/courtyard-seasons/"><strong>ライブデモ</strong></a>
  ·
  <a href="https://dodosann2024.github.io/courtyard-seasons/sea/"><strong>空中の海</strong></a>
  ·
  <a href="#ギャラリー">ギャラリー</a>
</p>

<p align="center">
  <a href="README.zh-CN.md">简体中文</a> ·
  <a href="README.md">English</a> ·
  <a href="README.ja.md">日本語</a> ·
  <a href="README.ko.md">한국어</a>
</p>

<p align="center">
  <img alt="three.js" src="https://img.shields.io/badge/three.js-WebGL-black?logo=threedotjs&logoColor=white">
  <img alt="static" src="https://img.shields.io/badge/static-CDNなし-2ea44f">
  <img alt="PWA" src="https://img.shields.io/badge/PWA-Service%20Worker-0078d4">
  <img alt="mobile" src="https://img.shields.io/badge/モバイル優先-6f42c1">
</p>

---

雲に浮かぶ五つの庭と、空に浮かぶ海。すべてブラウザだけで描画されます。季節が巡り、天候が変わり、夜が訪れ、庭ごとに静かな環境音が流れます——アカウントもサーバーも CDN も不要です。

## ハイライト

- **五つの浮遊する庭** — デフォルトの小屋、日本の竹庭、中国の中庭、韓国の韓屋、ヨーロッパの石造りの家。それぞれが雲の島に載っています。
- **四季と昼夜** — 春の花、夏の緑、秋の紅葉、冬の雪。夜は窓と灯籠が灯ります。
- **体感できる天気** — 晴れ、曇り、雨と雷雨、雹、雪（風に流される）、庭を横切る砂塵の渦。
- **生きたディテール** — 夜の蛍、ヨーロッパ庭の噴水、季節の鳥や虫。流星群や星座の線もオンにできます。
- **丁寧なサウンド** — 庭ごとの環境音（ししおどし、噴水、天気、野鳥・虫）。iOS では Safari の制約どおり、最初のタップで音声が始まります。
- **空中の海** — 円盤の上の帆船、縁からまっすぐ落ちる滝、澄んだ水の下に広がるサンゴの世界。
- **モバイル優先・オフライン対応** — 静的サイト＋ Service Worker。アセットは内容ハッシュ付きで、CDN は使いません。

## ギャラリー

### 四季

<p align="center">
  <img src="docs/readme/seasons.webp" alt="デフォルト庭の春夏秋冬" width="100%">
</p>

| 春 | 夏 | 秋 | 冬 |
|:---:|:---:|:---:|:---:|
| ![](docs/readme/def-spring.webp) | ![](docs/readme/def-summer.webp) | ![](docs/readme/def-autumn.webp) | ![](docs/readme/def-winter.webp) |

### 庭 · 昼と夜

| 庭 | 昼 | 夜 |
|:---|:---:|:---:|
| **デフォルト** · 默认小院 | ![](docs/readme/def-day.webp) | ![](docs/readme/def-night.webp) |
| **和風** · 日式庭院 | ![](docs/readme/jp-day.webp) | ![](docs/readme/jp-night.webp) |
| **中国風** · 中式小院 | ![](docs/readme/cn-day.webp) | ![](docs/readme/cn-night.webp) |
| **韓国風** · 韩式小院 | ![](docs/readme/kr-day.webp) | ![](docs/readme/kr-night.webp) |
| **ヨーロッパ風** · 欧式小院 | ![](docs/readme/eu-day.webp) | ![](docs/readme/eu-night.webp) |

### 空中の海

<p align="center">
  <img src="docs/readme/sea-day.webp" alt="昼の空中の海" width="48%">
  &nbsp;
  <img src="docs/readme/sea-night.webp" alt="夜雪の空中の海" width="48%">
</p>

## 技術スタック

| 項目 | 内容 |
|:---|:---|
| **three.js** | `src/app.js` に同梱。CDN なし |
| **WebGL** | 空・水面・雪・滝・ゴッドレイなどのカスタムシェーダー |
| **Web Audio** | 手続き的な環境音＋収録した野鳥・天気のループ |
| **Service Worker** | `sw.js` がコア資産をキャッシュ |
| **Python 3** | `tools/build.py` がハッシュ付きアセットと各庭ページを生成 |

## ローカルで動かす

```bash
git clone https://github.com/dodosann2024/courtyard-seasons.git
cd courtyard-seasons
python3 tools/build.py          # src/ からハッシュ付き資産を再生成
python3 -m http.server 8000     # 任意の静的サーバーで可
# http://localhost:8000/ を開く
```

`src/` を編集してからビルドを再実行してください。GitHub Pages はリポジトリのルートをそのまま配信します。

## 構成

```
├── index.html / jp/ cn/ kr/ eu/ sea/   # 各庭のエントリ
├── sw.js                               # Service Worker
├── assets/                             # ハッシュ付き JS・音声・サムネ
├── src/                                # ソース
│   ├── app.js          # 庭・四季・天気・音声
│   ├── sea.js          # 空中の海（遅延読み込み）
│   ├── ui.js / ui.css  # パネル、PWA 登録
│   ├── page.html       # HTML シェル
│   └── thumbs/         # サムネイル
├── tools/build.py                      # 静的ビルド
└── docs/readme/                        # README 用画像
```

## 操作

| | |
|:---|:---|
| **ドラッグ / ピンチ** | カメラの周回とズーム |
| **院 / 庭** | 五つの庭と空中の海を切り替え |
| **季** | 春 · 夏 · 秋 · 冬 |
| **天** | 晴 · 曇 · 雨 · 雹 · 雪（強度つき） |
| **夜** | 夜の切替；**四季輪転** で自動で一年を巡る |
| **風** | 風力スライダー |
| **♪** | マスター音量、天気音、環境音 |

## 対応ブラウザ

現行の Chromium、Firefox、Safari（iOS 含む）。WebGL と Web Audio が必要です。縦向きのスマホで見るのがいちばん——シーンはその構図で作られています。

## クレジット

three.js、WebGL シェーダー、フィールド録音を軸にした個人のクリエイティブ・コーディング作品です。タイトルとキャッチ：**天空之境 · Sky Haven** — *云端深处，听见四季的流转。*

---

<p align="center">
  <a href="https://dodosann2024.github.io/courtyard-seasons/">ライブサイトを開く</a>
  ·
  <a href="README.md">English</a>
  ·
  <a href="README.zh-CN.md">中文</a>
  ·
  <a href="README.ko.md">한국어</a>
</p>
