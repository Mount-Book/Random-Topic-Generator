# Random Topic Generator

IPPONグランプリ風の「ひとこと回答向けお題」をランダム生成する React + TypeScript + Vite アプリです。  
テンプレート、カテゴリ別ワード、NG ルール、スコアリングを組み合わせて、即答しやすく、かつ少し意外性のあるお題を選びます。

## 概要

このアプリは複数の生成方式を持っています。標準の `ワード抽出` では、あらかじめ定義したお題テンプレートに対して人物・職業・場所・状況・行動・現代ワードを重み付き抽選で差し込み、複数候補から最もスコアの高いお題を返します。

UI では以下を調整できます。

- 同時生成数: `1 / 3 / 5 / 8 / 10`
- 生成方式: `ワード抽出 / 全文抽出 / 無限の猿定理`
- 改行の細かさ: `多め / 標準 / 少なめ`

また、`生成方式` の横にある `?` ボタンから説明モーダルを開き、各方式の違いを見ながらその場で切り替えできます。

生成結果には次の情報が含まれます。

- 整形済みのお題本文
- テンプレート ID
- 総合スコア
- スコア内訳
- 使用ワード一覧

## 主な機能

- 3 種類の生成方式の切り替え
- テンプレートと単語辞書を使ったランダムお題生成
- 20 件の候補から最もスコアの高いお題を採用
- `fullTopics.json` からの完成済みお題ランダム抽出
- ネタ枠としての `無限の猿定理` モード
- 直近履歴を使った重複抑制
- NG 組み合わせの除外
- お題 1 件ずつのコピー
- 表示中お題の一括コピー
- 文字数に応じた自動改行
- 生成方式の説明モーダル

## 生成方式

- `ワード抽出`
  テンプレートに単語辞書を差し込み、相性や意外性をスコア化して、お題として使いやすい候補を選びます。
- `全文抽出`
  `src/data/fullTopics.json` に入っている完成済みのお題を、そのままランダム抽選で取り出します。カードには作者名も表示されますが、コピー時には本文だけを扱います。
- `無限の猿定理`
  有限文字集合からのランダム打鍵で、お題らしい文字列を偶然拾うネタモードです。ジョーク要素が強いため、実利用は推奨していません。

## スコアリング

お題は以下の観点で評価されます。

- `surprise`: 意外性
- `imageability`: 想像しやすさ
- `clarity`: 明瞭性
- `novelty`: 直近履歴に対する新しさ
- `ordinaryPenalty`: 普通すぎる組み合わせへの減点
- `chaosPenalty`: 壊れすぎた組み合わせへの減点

総合スコアは概ね次の式で決まります。

```ts
score =
  surprise +
  imageability +
  clarity +
  novelty -
  ordinaryPenalty -
  chaosPenalty
```

また、NG ルールに該当する組み合わせや不自然な文面は候補から除外されます。

## データ構成

生成ロジックは `src/lib/odaiGenerator.ts` から各方式ごとのファイルを呼び出す構成です。  
お題の元データは JSON で管理しています。

- `src/data/topicTemplates.json`: お題テンプレート定義
- `src/data/fullTopics.json`: 完成済みお題一覧。各要素は `id` / `text` / `authorName`
- `src/data/topicWords.json`: カテゴリ別ワード辞書
- `src/data/topicNgRules.json`: 禁止組み合わせルール

主なロジックファイル:

- `src/lib/odaiGenerator.ts`: 公開 API と生成方式の振り分け
- `src/lib/topicGenerators/wordRandomizer.ts`: テンプレート差し込み式の生成
- `src/lib/topicGenerators/jsonRandomizer.ts`: 完成済みお題の抽出
- `src/lib/topicGenerators/infiniteMonkey.ts`: ランダム打鍵ベースのネタ生成
- `src/lib/topicGenerators/shared.ts`: 型、共通データ、補助関数

カテゴリは以下の 6 種類です。

- `person`
- `job`
- `place`
- `situation`
- `action`
- `modern`

## セットアップ

Node.js 20 以上を想定しています。

```bash
npm install
```

## 起動方法

開発サーバー:

```bash
npm run dev
```

`/api/feedback` は Vite 開発サーバー上でも動作します。Discord 送信を試す場合は `.env.example` を参考に `DISCORD_FEEDBACK_WEBHOOK_URL` を環境変数へ設定してください。

本番ビルド:

```bash
npm run build
```

ビルド結果のプレビュー:

```bash
npm run preview
```

Lint:

```bash
npm run lint
```

## 使い方

1. 画面上部で同時生成数、生成方式、改行の細かさを選びます。
2. `○個生成` ボタンでお題を作ります。
3. 各カードの `コピー` で 1 件だけコピーできます。
4. `まとめてコピー` で表示中のお題を番号付きで一括コピーできます。
5. `生成方式` の `?` ボタンから説明モーダルを開くと、各方式の内容確認と切り替えができます。

初期表示時には、標準設定で 3 件のお題が自動生成されます。

## カスタマイズ

お題の雰囲気を変えたい場合は次を編集してください。

- 新しいお題パターンを増やす: `src/data/topicTemplates.json`
- 完成済みお題を追加する: `src/data/fullTopics.json`
- 語彙を追加する: `src/data/topicWords.json`
- 外したい組み合わせを定義する: `src/data/topicNgRules.json`
- 採点基準を調整する: `src/lib/topicGenerators/wordRandomizer.ts` / `src/lib/topicGenerators/shared.ts`
- 無限の猿定理モードを調整する: `src/lib/topicGenerators/infiniteMonkey.ts`

テンプレートでは `{person}` のような差し込みに加えて、`{action:teiru}` や `{action:start}` のような活用形も使えます。

## フィードバックフォーム

サイト内の `ご意見・ご要望を送る` ボタンからフィードバックを送信できます。フォームは `POST /api/feedback` に送信され、サーバー側で Discord Webhook へ転送されます。

設定する環境変数:

```bash
DISCORD_FEEDBACK_WEBHOOK_URL=https://discord.com/api/webhooks/...
DISCORD_FEEDBACK_THREAD_NAME=サイト内フィードバック
```

フォーラムチャンネルの Webhook を使う場合:

- `DISCORD_FEEDBACK_THREAD_NAME` を指定すると、送信ごとにその名前の投稿先スレッドを作成します
- 既存スレッドへ送りたい場合は `DISCORD_FEEDBACK_THREAD_ID` を使います
- `DISCORD_FEEDBACK_THREAD_ID` がある場合はそちらを優先します

補足:

- Webhook URL はクライアントへ露出しません
- フォーム送信時にページ URL、User-Agent、画面サイズ、言語設定、アプリバージョンなどを自動付与します
- honeypot と短時間レート制限を入れています
- Vercel など `api/` ディレクトリをサーバーレス関数として扱う環境でそのまま配置できます

## 注意点

- コピー機能はブラウザの Clipboard API を使うため、実行環境によっては制約があります。
- `ワード抽出` は完全ランダムではなく、重み付き抽選とスコア評価の組み合わせです。
- `無限の猿定理` はネタモードです。実際のお題生成用途には向きません。
- 履歴保持数は `MAX_HISTORY = 12` です。

## 技術スタック

- React 19
- TypeScript
- Vite
- ESLint
