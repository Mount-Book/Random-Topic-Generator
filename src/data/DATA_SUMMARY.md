# Data Summary

`src/data` 配下のテンプレートと語彙データの概要です。

## Template Files

- `topicTemplates.json`: ワード抽出で使うテンプレート定義
- `topicWords.json`: ワード抽出で使うカテゴリ別語彙
- `topicNgRules.json`: NG 組み合わせルール
- `fullTopics.json`: 全文抽出で使う完成済みお題

## Template Count

- `topicTemplates.json`: 23 templates

## Templates

- `role-swap-short`: `{person}が{job}だったらありがちなこと`
- `forbidden-line-short`: `{place}で絶対に言ってはいけない一言`
- `adjective-place-short`: `{adjective}{noun}。どんな{noun}？`
- `situation-reason-medium`: `{situation}なのに{action:teiru}理由`
- `modern-mix-medium`: `{person}が{modern}を使い始めた理由`
- `public-slip-medium`: `{place}で{person}がうっかり言ってしまったこと`
- `urgent-review-long`: `{situation}なのに{modern}のレビューを書いている{person}。その理由とは？`
- `ceremony-action-medium`: `{place}で{action:start}{person}に対して周囲が思ったこと`
- `job-modern-long`: `{job}なのに{modern}だけ異常に使いこなしている{person}。なぜそんなことに？`
- `person-place-reason-medium`: `{person}が{place}にいそうな理由`
- `place-person-incident-short`: `{place}にいる{person}、何があった？`
- `job-action-reason-medium`: `{job}のくせに{action:start}理由`
- `situation-person-line-medium`: `{situation}で{person}が一番言いそうなこと`
- `place-modern-usage-medium`: `{place}でだけ通用する{modern}の使い方`
- `person-modern-misread-medium`: `{person}が{modern}を誤解していそうな理由`
- `place-action-person-reaction-long`: `{place}で{action:teiru}{person}を見た周囲の反応`
- `situation-person-calm-medium`: `{situation}なのに{person}が冷静すぎる理由`
- `job-place-secret-medium`: `{job}が{place}でだけ見せる裏の顔`
- `modern-place-weird-medium`: `{modern}を導入した{place}、何かがおかしい`
- `person-job-talent-short`: `{person}に{job}の才能を感じた瞬間`
- `situation-action-excuse-medium`: `{situation}で{action:start}やつの言い分`
- `place-warning-short`: `{place}に貼ってありそうで実は怖い注意書き`
- `person-situation-check-medium`: `{person}が{situation}で最初に確認しそうなこと`

## Word Counts

- `person`: 10
- `job`: 8
- `place`: 10
- `situation`: 10
- `action`: 10
- `noun`: 12
- `adjective`: 11
- `modern`: 8
- `total`: 79

## Word Lists

### person

- 将軍
- 校長
- 魔王
- 宇宙飛行士
- お坊さん
- アイドル
- 刑事
- おばあちゃん
- 転校生
- アナウンサー

### job

- コンビニ店員
- YouTuber
- 保育士
- 弁護士
- 配達員
- ウェディングプランナー
- 理容師
- 飼育員

### place

- 結婚式
- 葬式
- 裁判所
- 教室
- 温泉旅館
- ファミレス
- 市役所
- テーマパーク
- 産婦人科の待合室
- 朝礼

### situation

- 世界滅亡直前
- 初デート中
- 面接中
- 卒業式の最中
- 逃走中
- 生放送中
- 手術直前
- 同窓会の途中
- 避難訓練の途中
- プロポーズの瞬間

### action

- TikTokを撮る
- 値切る
- レビューを書く
- ライブ配信を始める
- 先に謝る
- 急に踊り出す
- QR決済をすすめる
- アンケートを取る
- 集合写真を撮ろうとする
- チャンネル登録をお願いする

### noun

- ファミレス
- コンビニ
- 中華屋
- 温泉旅館
- テーマパーク
- スマホケース
- ワイヤレスイヤホン
- スニーカー
- 冷凍食品
- シャーペン
- 観葉植物
- マグカップ

### adjective

- 実家のような
- 学校のような
- なんか違う
- 何故か安い
- 妙に厳かな
- 役所っぽい
- テーマパークみたいな
- 病院っぽすぎる
- 修学旅行みたいな
- 張りつめた空気の
- やけに生活感のある

### modern

- スマホ
- QR決済
- AI
- ドローン
- VTuberアバター
- スマートウォッチ
- フードデリバリーアプリ
- ノイズキャンセリングイヤホン

## Constraint Notes

- `何故か安い` が出た場合は、後続の `noun` を `product` タグ付き語彙に限定
- `学校のような` が出た場合は、後続の `noun` を `place-noun` タグ付き語彙に限定
- `実家のような`
- `テーマパークみたいな`
- `病院っぽすぎる`
- `役所っぽい`
  これらも `place-noun` タグ付き語彙に限定
