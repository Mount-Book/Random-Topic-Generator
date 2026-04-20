import type { TopicCard } from '../../../lib/odaiGenerator'
import type { SavedTopic } from '../types'
import { IngredientList } from './IngredientList'
import { ScoreBreakdown } from './ScoreBreakdown'

type TopicCardViewProps<TTopic extends TopicCard | SavedTopic> = {
  cardClassName?: string
  copiedId: number | null
  indexLabel: string
  isDebugPage: boolean
  onCopy: (topic: TTopic) => Promise<void>
  onPrimaryAction: (topic: TTopic) => void
  primaryActionClassName: string
  primaryActionLabel: string
  showScoreBreakdown?: boolean
  topic: TTopic
}

export const TopicCardView = <TTopic extends TopicCard | SavedTopic>({
  cardClassName = '',
  copiedId,
  indexLabel,
  isDebugPage,
  onCopy,
  onPrimaryAction,
  primaryActionClassName,
  primaryActionLabel,
  showScoreBreakdown = true,
  topic,
}: TopicCardViewProps<TTopic>) => (
  <article className={`topic-card ${cardClassName}`.trim()}>
    <div className="topic-card-header">
      <span className="topic-number">{indexLabel}</span>
      <div className="topic-actions">
        <button className={primaryActionClassName} onClick={() => onPrimaryAction(topic)}>
          {primaryActionLabel}
        </button>
        <button className="copy-chip" onClick={() => void onCopy(topic)}>
          {copiedId === topic.id ? 'コピー済み' : 'コピー'}
        </button>
      </div>
    </div>

    <p className="topic-text formatted">{topic.displayPrompt}</p>
    {topic.authorName ? <p className="topic-author">作者: {topic.authorName}</p> : null}
    {isDebugPage ? (
      <>
        <p className="topic-note">
          <span>{topic.templateId}</span>
          <span>score {topic.score.toFixed(1)}</span>
        </p>

        {showScoreBreakdown ? <ScoreBreakdown topic={topic} /> : null}
        <IngredientList ingredients={topic.ingredients} topicId={topic.id} />
      </>
    ) : null}
  </article>
)
