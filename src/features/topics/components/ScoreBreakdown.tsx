import type { TopicCard } from '../../../lib/odaiGenerator'

type ScoreBreakdownProps = {
  topic: TopicCard
}

export const ScoreBreakdown = ({ topic }: ScoreBreakdownProps) => (
  <dl className="score-breakdown">
    <div>
      <dt>意外性</dt>
      <dd>{topic.scoreBreakdown.surprise.toFixed(1)}</dd>
    </div>
    <div>
      <dt>想像しやすさ</dt>
      <dd>{topic.scoreBreakdown.imageability.toFixed(1)}</dd>
    </div>
    <div>
      <dt>明瞭性</dt>
      <dd>{topic.scoreBreakdown.clarity.toFixed(1)}</dd>
    </div>
    <div>
      <dt>新しさ</dt>
      <dd>{topic.scoreBreakdown.novelty.toFixed(1)}</dd>
    </div>
    <div>
      <dt>普通すぎ</dt>
      <dd>-{topic.scoreBreakdown.ordinaryPenalty.toFixed(1)}</dd>
    </div>
    <div>
      <dt>壊れすぎ</dt>
      <dd>-{topic.scoreBreakdown.chaosPenalty.toFixed(1)}</dd>
    </div>
  </dl>
)
