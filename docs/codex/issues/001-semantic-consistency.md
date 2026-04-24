# Issue 001: 候補選定に意味整合ルールを導入する

## Background

`src/lib/topicGenerators/shared.ts` の `resolveSlotCandidates()` は、タグ一致数と重みで候補を絞っている。
ただし、意味の弱い汎用タグだけでも通るため、文脈が薄い組み合わせが高スコアで残る。

## Scope

- `src/lib/topicGenerators/shared.ts`
- `src/data/topicTemplates.json`
- 必要なら `src/data/topicWords.json`

## Tasks

- 汎用タグと意味タグの差を選定ロジックで扱えるようにする
- `minSharedInheritedTags` とは別に、意味タグの共有数を要求できるようにする
- テンプレートごとに追加制約を JSON で記述できるようにする
- generic tag のみ一致している候補には追加の減点、または除外条件を入れる

## Candidates For Design

- `minSharedMeaningfulTags`
- `requiredAnyTagSets`
- `excludedTagPairs`
- `slotCompatibilityRules`

命名は実装に合わせて調整してよいが、データ駆動であること。

## Acceptance Criteria

- `daily` `public` `formal` だけで成立していた弱い候補が減る
- `place/action/person` と `situation/action` の整合性が改善する
- テンプレート側だけで制約追加が可能になる

## Examples To Re-check

- `温泉旅館でレビューを書いている転校生を見た周囲の反応`
- `飼育員が教室でだけ見せる裏の顔`
- `ファミレスでレビューを書き始めたおばあちゃんに対して周囲が思ったこと`
