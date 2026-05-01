# Lottery App

スクリーン投影向けの抽選アプリです。

## 概要

- スクリーン二投影することを想定した Web 抽選アプリです
- 同一端末のブラウザで操作と表示を完結させる前提です
- 抽選設定、抽選結果、進行状況はブラウザの `localStorage` に保存されます
- 画面フローは `設定 -> 抽選中 -> 結果発表 -> 完了` です

## セットアップ

```bash
pnpm install
pnpm dev --host 127.0.0.1 --port 4173
```

起動後は [http://127.0.0.1:4173/](http://127.0.0.1:4173/) を開いて確認します。

## Scripts

- `pnpm dev` - 開発サーバー
- `pnpm build` - 本番ビルド
- `pnpm test` - ユニット/コンポーネントテスト
- `pnpm test:e2e` - Playwright E2E テスト

## テスト

通常の確認コマンドは次のとおりです。

```bash
pnpm build
pnpm test
pnpm test:e2e
```

Playwright E2E は Playwright 同梱 Chromium を使います。初回だけ次を実行してください。

```bash
pnpm exec playwright install chromium
```
