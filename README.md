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

## Render でインターネット公開する

画面と API を同じサービスで公開します。APIキーは Render の環境変数に入れ、GitHub には上げません。

1. このリポジトリの最新コードを GitHub に push する
2. [Render](https://render.com/) に GitHub アカウントで登録する
3. **New + → Web Service** を選ぶ
4. リポジトリ `dify-chatbot-webapp` を接続する
5. 次の値を入れる

| 項目 | 値 |
|---|---|
| Language | Node |
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |

6. **Environment Variables** に次を追加する

```
DIFY_API_KEY=自分のDify APIキー
DIFY_API_URL=https://api.dify.ai/v1
```

7. **Deploy Web Service** を押す
8. 発行された URL（例: `https://xxxx.onrender.com`）を開いて、チャットが動くか確認する

無料枠では、しばらくアクセスがないとスリープします。最初の表示に数十秒かかることがあります。
