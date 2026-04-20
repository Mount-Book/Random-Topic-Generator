import type { TopicCard } from '../../lib/odaiGenerator'

export type SavedTopic = TopicCard & {
  savedAt: number
}
