# Lottery App

同窓会での利用を想定した、スクリーン投影向けの抽選アプリです。

## Scripts

- `pnpm dev` - 開発サーバー
- `pnpm build` - 本番ビルド
- `pnpm test` - ユニット/コンポーネントテスト
- `pnpm test:e2e` - Playwright E2E テスト

## Easter Egg Video With Vercel Blob

イースターエッグ動画は `VITE_EASTER_EGG_VIDEO_URL` が設定されているときだけ再生されます。未設定時は隠しトリガー自体を出しません。

最初の1回だけ、公開Blob URLを作ってアプリに設定してください。

1. Vercel で `Public Blob` ストアを作成する
2. `.env.local` に `VITE_EASTER_EGG_VIDEO_URL=<public-blob-url>` を設定する
3. Vercel 本番環境にも同じ環境変数を設定して再デプロイする

差し替え運用は、同じ Blob の pathname を上書きし続けるのが楽です。Vercel CLI が入っていれば、次のように更新できます。

```bash
vercel blob put /absolute/path/to/video.mp4 \
  --access public \
  --pathname lottery/easter-egg.mp4 \
  --allow-overwrite
```

`allowOverwrite` を使うと同じURLのまま差し替えできます。Vercel 公式ドキュメントでも、この用途では同じURL維持のために overwrite を使う案内があります。反映にはキャッシュの都合で最低60秒ほどかかることがあります。
