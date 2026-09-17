# dify-chatbot-webapp

Boltで作成した React / Vite のチャット画面を、Dify API と連携した Web アプリです。

APIキーはブラウザに公開せず、Node.js / Express のバックエンド経由で Dify に送信します。

## 必要なもの

- Node.js（18 以上を推奨）
- Dify のアプリ APIキー

## セットアップ手順

1. 依存パッケージをインストールする

```bash
npm install
```

2. 環境変数ファイルを用意する

```bash
copy .env.example .env
```

macOS / Linux の場合は `cp .env.example .env` を使います。

3. `.env` を開き、自分の Dify APIキーを入れる

```
DIFY_API_KEY=ここに自分のAPIキーを貼る
DIFY_API_URL=https://api.dify.ai/v1
```

4. フロントエンドと API サーバーを同時に起動する

```bash
npm run dev
```

5. ブラウザで開く

- 画面: http://localhost:5173/
- API: http://localhost:3001/

`.env` は `.gitignore` に入っているため、GitHub には公開されません。
