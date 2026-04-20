import type { TopicCard } from '../../../lib/odaiGenerator'
import { TopicCardView } from './TopicCardView'

type TopicGridSectionProps = {
  copiedId: number | null
  isDebugPage: boolean
  onCopy: (topic: TopicCard) => Promise<void>
  onSave: (topic: TopicCard) => void
  topics: TopicCard[]
}

export const TopicGridSection = ({
  copiedId,
  isDebugPage,
  onCopy,
  onSave,
  topics,
}: TopicGridSectionProps) => (
  <section className="topic-grid" aria-label="生成されたお題一覧">
    {topics.map((topic, index) => (
      <TopicCardView
        key={topic.id}
        copiedId={copiedId}
        indexLabel={`ODAI ${String(index + 1).padStart(2, '0')}`}
        isDebugPage={isDebugPage}
        onCopy={onCopy}
        onPrimaryAction={onSave}
        primaryActionClassName="save-chip"
        primaryActionLabel="お気に入り"
        topic={topic}
      />
    ))}
  </section>
)
