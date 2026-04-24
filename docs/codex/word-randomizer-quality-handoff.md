# Word Randomizer Quality Handoff

## Goal

ワード抽出で生成されるお題のうち、意外性ではなく意味不整合で違和感が出るケースを減らす。

対象は主に以下。

- `src/lib/topicGenerators/shared.ts`
- `src/lib/topicGenerators/wordRandomizer.ts`
- `src/data/topicTemplates.json`
- `src/data/topicWords.json`
- `src/data/topicNgRules.json`

## Confirmed Problems

現状の生成では、以下のような「文法は成立するが、お題として弱い」ケースが出る。

- `コンビニ店員なのにスマホだけ異常に使いこなしているおばあちゃん。なぜそんなことに？`
- `理容師なのにフードデリバリーアプリだけ異常に使いこなしている転校生。なぜそんなことに？`
- `飼育員が教室でだけ見せる裏の顔`
- `温泉旅館でレビューを書いている転校生を見た周囲の反応`

## Root Causes

1. `resolveSlotCandidates()` がタグ共有数中心で候補を通しており、`daily` `public` `formal` などの汎用タグでも成立しやすい
2. `buildSelectedWords()` がスロットを前から1回ずつ貪欲に埋めるため、後続スロットとの意味整合を再評価しない
3. `job-modern-long` など同一人物を読ませるテンプレートでも、`job` と `person` の整合性を保証していない
4. NG ルールが少なく、生成後の品質ゲートが弱い
5. 品質回帰を検知するテストや fixture がない

## Execution Order

以下の順で進めること。

1. `docs/codex/issues/001-semantic-consistency.md`
2. `docs/codex/issues/002-same-actor-consistency.md`
3. `docs/codex/issues/003-quality-regression-tests.md`

## Implementation Notes

- `genericInheritedTags` に入っているタグだけの一致を強く評価しないこと
- テンプレートごとに JSON で意味制約を増やせる形を優先すること
- `person` と `job` を同一主体として読むテンプレートには専用制約を入れること
- `topicNgRules.json` だけに寄せすぎず、選定段階で落とせるものは先に落とすこと
- 将来の語彙追加で壊れないよう、ルールは個別ワード名よりタグ中心で設計すること

## Expected Outcome

- 「変だけど想像できる」は残る
- 「役割が崩れている」「意味が薄い」組み合わせは減る
- 語彙追加時の品質劣化を機械的に検知できる

## Suggested Codex Prompt

```md
docs/codex/word-randomizer-quality-handoff.md と
docs/codex/issues/001-semantic-consistency.md から順に実装してください。

要件:
- ワード抽出の違和感を減らす
- テンプレートと語彙データで拡張可能な制約設計にする
- 代表的な NG 例が再現しないことを確認する
- 実装後は必要な検証コマンドを実行し、結果をまとめる
```
