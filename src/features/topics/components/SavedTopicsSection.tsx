import type { SavedTopic } from '../types'
import { createTopicKey } from '../utils/topicKey'
import { TopicCardView } from './TopicCardView'

type SavedTopicsSectionProps = {
  copiedId: number | null
  isDebugPage: boolean
  onCopy: (topic: SavedTopic) => Promise<void>
  onRemove: (topic: SavedTopic) => void
  savedTopics: SavedTopic[]
}

export const SavedTopicsSection = ({
  copiedId,
  isDebugPage,
  onCopy,
  onRemove,
  savedTopics,
}: SavedTopicsSectionProps) => (
  <section className="saved-panel" aria-label="保存したお気に入りお題">
    <div className="saved-panel-header">
      <h2>お気に入り</h2>
      <span>{savedTopics.length}件保存済み</span>
    </div>

    {savedTopics.length === 0 ? (
      <p className="saved-empty">生成したお題をお気に入り登録すると、ここに保存されます。</p>
    ) : (
      <div className="topic-grid">
        {savedTopics.map((topic) => (
          <TopicCardView
            key={`${createTopicKey(topic)}-${topic.savedAt}`}
            cardClassName="saved-topic-card"
            copiedId={copiedId}
            indexLabel="FAVORITE"
            isDebugPage={isDebugPage}
            onCopy={onCopy}
            onPrimaryAction={onRemove}
            primaryActionClassName="save-chip remove-chip"
            primaryActionLabel="削除"
            showScoreBreakdown={false}
            topic={topic}
          />
        ))}
      </div>
    )}
  </section>
)
