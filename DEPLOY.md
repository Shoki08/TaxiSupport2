# 📦 GitHub Pagesデプロイガイド

## 🎉 Version 2.1.0 新機能

- 🔍 **時間検索改善**: 指定時刻の前後15分（±15分）で検索
- 📅 **日付検索**: 特定の日付の記録を一覧表示
- 💾 **上書き保存機能**: iOS対応・全ブラウザ対応（簡単バックアップ）
- 🤖 **AI助言機能**: Google Gemini APIでおすすめエリアをアドバイス

## 🎯 必要なファイル

以下のファイルをすべてGitHubにアップロードしてください：

```
✅ index.html          # メインアプリ
✅ app.js              # JavaScriptロジック
✅ manifest.json       # PWA設定
✅ service-worker.js   # オフライン対応
✅ icon-192.png        # アイコン 192x192
✅ icon-512.png        # アイコン 512x512
✅ icon-152.png        # アイコン 152x152（iOS用）
✅ .nojekyll           # Jekyll無効化
✅ README.md           # 説明書
```

## 🚀 デプロイ手順（3ステップ）

### ステップ1：GitHubでリポジトリ作成

1. https://github.com にアクセス
2. 右上の「+」→「New repository」
3. リポジトリ名：`taxi-driver-app`（お好きな名前でOK）
4. 「Public」を選択
5. 「Create repository」をクリック

### ステップ2：ファイルをアップロード

**簡単な方法（Web UI）：**

1. 作成したリポジトリで「uploading an existing file」をクリック
2. 上記9つのファイルをすべてドラッグ&ドロップ
3. 「Commit changes」をクリック

**コマンドライン：**

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/REPO-NAME.git
git push -u origin main
```

### ステップ3：GitHub Pagesを有効化

1. リポジトリの「Settings」タブ
2. 左メニューの「Pages」
3. 「Source」→「Deploy from a branch」
4. 「Branch」→「main」と「/ (root)」を選択
5. 「Save」をクリック

## ✅ 完了！

数分後にアクセスできます：

```
https://YOUR-USERNAME.github.io/REPO-NAME/
```

例：
- ユーザー名が `tanaka` で
- リポジトリ名が `taxi-driver-app` なら
- URL: `https://tanaka.github.io/taxi-driver-app/`

## 📱 iOSで使う

1. SafariでGitHub PagesのURLを開く
2. 共有ボタン（□↑）をタップ
3. 「ホーム画面に追加」を選択
4. 「追加」をタップ

→ ホーム画面にアプリアイコンが追加されます！

## 🔧 トラブルシューティング

### ページが表示されない

- 数分待ってから再読み込み
- Settings → Pagesで「Visit site」をクリック
- ブランチが「main」、フォルダが「/ (root)」になっているか確認

### Service Workerエラーが出る

- HTTPSで配信されているか確認（GitHub Pagesは自動的にHTTPS）
- キャッシュをクリアして再読み込み
- 数分待ってから再度アクセス

### アイコンが表示されない

- すべてのpngファイルがアップロードされているか確認
- ファイル名が正確か確認（大文字小文字も一致させる）

## 💡 ヒント

- **カスタムドメイン**: Settings → Pages → Custom domain で独自ドメインを設定可能
- **更新方法**: ファイルを編集してコミット&プッシュするだけ
- **削除方法**: Settings → Pagesで「Source」を「None」に変更

---

問題があれば、GitHubのIssuesで質問してください！
