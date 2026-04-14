# 🧺 食材管理アプリ

食材の賞味期限をジャンルごとに管理できる **PWA対応** Webアプリです。
スマホのホーム画面に追加してネイティブアプリのように使えます。

---

## 機能

- 食材の登録（食品名・賞味期限・ジャンル・メモ）
- 賞味期限順ソート（全体・ジャンル別タブ切り替え）
- ジャンル分類：麺類 / 料理の素 / 食材 / 調味料 / 冷凍 / 飲み物 / スープの素 / プロテイン
- ステータスバッジ：期限切れ / 今日まで / まもなく / 余裕あり
- メモ機能（必要な材料など）
- **PWA対応**：オフライン動作・ホーム画面インストール

---

## セットアップ

```bash
git clone https://github.com/kuru77/foodnoloss.git
cd foodnoloss
npm install
npm run dev
```

---

## デプロイ（GitHub Pages）

`main` ブランチにプッシュするだけで **GitHub Actions が自動ビルド＆デプロイ**します。

### 初回のみ：GitHub Pages の設定

1. リポジトリの **Settings → Pages**
2. Source を **"GitHub Actions"** に変更して保存

以降は `git push origin main` のたびに自動デプロイされます。

---

## アイコン画像の配置

`public/icons/` フォルダに以下のファイルを置いてください：

```
public/
└── icons/
    ├── icon-192.png   （192×192px）
    └── icon-512.png   （512×512px）
```

---

## ディレクトリ構成

```
foodnoloss/
├── .github/
│   └── workflows/
│       └── deploy.yml       # 自動デプロイ設定
├── public/
│   └── icons/
│       ├── icon-192.png
│       └── icon-512.png
├── src/
│   ├── App.jsx              # メインコンポーネント
│   └── main.jsx             # エントリーポイント
├── index.html
├── vite.config.js
├── package.json
├── .gitignore
└── README.md
```

---

## 技術スタック

| 項目 | 内容 |
|------|------|
| フレームワーク | React 18 |
| ビルドツール | Vite 5 |
| PWA | vite-plugin-pwa（Workbox） |
| デプロイ | GitHub Pages + GitHub Actions |

---

## ライセンス

MIT
