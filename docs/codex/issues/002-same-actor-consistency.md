# Issue 002: 同一人物を読ませるテンプレートの整合性を保証する

## Background

`job-modern-long` などは、`job` と `person` が同一人物として読まれる。
しかし現在は独立抽選に近く、役割の噛み合わせが弱い。

## Scope

- `src/data/topicTemplates.json`
- `src/data/topicWords.json`
- `src/lib/topicGenerators/shared.ts`

## Tasks

- `person` と `job` に主体整合のためのタグを追加する
- 必要なら `modern` にも利用者属性のタグを持たせる
- 同一主体テンプレートで必須整合を要求する制約を追加する
- `job-place-secret-medium` のような、職業から場所の自然さを読むテンプレートも見直す

## Target Templates

- `job-modern-long`
- `job-place-secret-medium`
- `person-place-reason-medium`

## Acceptance Criteria

- 役割不整合が強い `job + person` 組み合わせが出にくくなる
- 同一主体テンプレートで、人物像の一貫性が改善する
- 制約が特定ワードのベタ書きに寄りすぎない

## Examples To Re-check

- `コンビニ店員なのにスマホだけ異常に使いこなしているおばあちゃん。なぜそんなことに？`
- `理容師なのにフードデリバリーアプリだけ異常に使いこなしている転校生。なぜそんなことに？`
