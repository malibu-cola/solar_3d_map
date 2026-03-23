# 太陽系3Dマップ

NASA公開APIの天体位置データをもとに、太陽系の惑星・彗星を3D空間でインタラクティブに表示するWebアプリケーションです。GitHub Pagesで静的ホスティングし、GitHub Actionsでデータを日次自動更新します。

## デモ

<!-- GitHub Pagesデプロイ後にURLを記載 -->

## 機能

- 8惑星 + 太陽の3D表示（NASA Horizons APIの実測位置データ）
- 主要彗星（ハレー・エンケ・ホームズ）の軌道表示
- マウス操作（ドラッグ: 回転 / ホイール: ズーム / 右ドラッグ: パン）
- 時間スライダー（±5年）で任意日付の天体位置をリアルタイム計算
- 天体クリックで情報パネル表示
- 軌道線・ラベル・彗星の表示切替
- 土星の環、太陽の発光、背景星

## 技術スタック

| 技術 | 用途 |
|---|---|
| [Three.js](https://threejs.org/) | 3Dレンダリング + OrbitControls |
| [Vite](https://vite.dev/) | ビルド / 開発サーバー |
| [astronomy-engine](https://github.com/cosinekitty/astronomy) | 惑星軌道計算（JPL DE441ベース） |
| Python + requests | NASA APIデータ取得スクリプト |
| GitHub Actions | データ日次自動更新 + デプロイ |
| GitHub Pages | 静的ホスティング |

## セットアップ

```bash
npm install
npm run dev
```

http://localhost:5173 でアプリが起動します。

### プロダクションビルド

```bash
npm run build
npm run preview
```

## データ更新

天体位置データは `data/` ディレクトリのJSONファイルに格納されています。

### 手動更新

```bash
pip install requests
python scripts/fetch_planets.py   # 惑星位置（Horizons API）
python scripts/fetch_comets.py    # 彗星軌道要素（SBDB API）
```

### 自動更新

GitHub Actionsが毎日 01:00 UTC に `fetch-data.yml` を実行し、最新データをコミットします。

## プロジェクト構成

```
├── .github/workflows/
│   ├── deploy.yml          # GitHub Pagesデプロイ
│   └── fetch-data.yml      # データ日次取得
├── data/
│   ├── planets.json        # 惑星位置データ
│   └── comets.json         # 彗星軌道要素データ
├── scripts/
│   ├── fetch_planets.py    # Horizons API取得
│   └── fetch_comets.py     # SBDB API取得
├── src/
│   ├── main.js             # エントリーポイント
│   ├── scene.js            # Three.jsシーン構築・天体描画
│   ├── orbit.js            # 軌道計算（astronomy-engine / ケプラー方程式）
│   ├── loader.js           # JSONデータ読み込み
│   ├── ui.js               # UI制御（スライダー・パネル・トグル）
│   ├── constants.js        # スケール変換・天体設定
│   └── style.css           # スタイル
├── index.html
├── vite.config.js
└── package.json
```

## スケールについて

実際の太陽系では内惑星と外惑星の距離差が極めて大きいため、カスタム圧縮スケールを採用しています。

- **2AU以内**（内惑星）: 8倍に拡大
- **2AU以上**（外惑星）: 対数圧縮

天体サイズも視認性優先の固定値で、実際の比率ではありません。

## データソース

- [JPL Horizons API](https://ssd-api.jpl.nasa.gov/doc/horizons.html) — 惑星の太陽中心XYZ座標
- [JPL SBDB API](https://ssd-api.jpl.nasa.gov/doc/sbdb.html) — 彗星の軌道要素

## ライセンス

MIT
