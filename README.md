# Random Topic Generator

IPPONグランプリ風の「ひとこと回答向けお題」をランダム生成する React + TypeScript + Vite アプリです。  
テンプレート、カテゴリ別ワード、NG ルール、スコアリングを組み合わせて、即答しやすく、かつ少し意外性のあるお題を選びます。

## 概要

このアプリは、あらかじめ定義したお題テンプレートに対して人物・職業・場所・状況・行動・現代ワードを重み付き抽選で差し込み、複数候補から最もスコアの高いお題を返します。

UI では以下を調整できます。

- 同時生成数: `1 / 3 / 5 / 8 / 10`
- お題の長さ: `短め / 標準 / 長め`
- 改行の細かさ: `多め / 標準 / 少なめ`

生成結果には次の情報が含まれます。

- 整形済みのお題本文
- テンプレート ID
- 総合スコア
- スコア内訳
- 使用ワード一覧

## 主な機能

- テンプレートと単語辞書を使ったランダムお題生成
- 20 件の候補から最もスコアの高いお題を採用
- 直近履歴を使った重複抑制
- NG 組み合わせの除外
- お題 1 件ずつのコピー
- 表示中お題の一括コピー
- 文字数に応じた自動改行

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

生成ロジックは `src/lib/odaiGenerator.ts` にあります。  
お題の元データは JSON で管理しています。

- `src/data/topicTemplates.json`: お題テンプレート定義
- `src/data/topicWords.json`: カテゴリ別ワード辞書
- `src/data/topicNgRules.json`: 禁止組み合わせルール

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

1. 画面上部で同時生成数、お題の長さ、改行の細かさを選びます。
2. `○個生成` ボタンでお題を作ります。
3. 各カードの `コピー` で 1 件だけコピーできます。
4. `まとめてコピー` で表示中のお題を番号付きで一括コピーできます。

初期表示時には、標準設定で 3 件のお題が自動生成されます。

## カスタマイズ

お題の雰囲気を変えたい場合は次を編集してください。

- 新しいお題パターンを増やす: `src/data/topicTemplates.json`
- 語彙を追加する: `src/data/topicWords.json`
- 外したい組み合わせを定義する: `src/data/topicNgRules.json`
- 採点基準を調整する: `src/lib/odaiGenerator.ts`

テンプレートでは `{person}` のような差し込みに加えて、`{action:teiru}` や `{action:start}` のような活用形も使えます。

## 注意点

- コピー機能はブラウザの Clipboard API を使うため、実行環境によっては制約があります。
- お題生成は完全ランダムではなく、重み付き抽選とスコア評価の組み合わせです。
- 履歴保持数は `MAX_HISTORY = 12` です。

## 技術スタック

- React 19
- TypeScript
- Vite
- ESLint
