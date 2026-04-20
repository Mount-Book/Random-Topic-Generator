import type { TopicCard } from '../../../lib/odaiGenerator'

export const createTopicKey = (topic: Pick<TopicCard, 'templateId' | 'text'>) =>
  `${topic.templateId}::${topic.text}`
