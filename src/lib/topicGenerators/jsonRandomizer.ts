import {
  MAX_HISTORY,
  createFingerprint,
  fullTopics,
  insertLineBreaks,
  type FullTopicDefinition,
  type GenerateTopicOptions,
  type GeneratedCandidate,
  type TopicCard,
  type TopicFingerprint,
} from './shared'

export const pickRandomFullTopic = (
  availableTopics: FullTopicDefinition[],
  history: TopicFingerprint[],
  usedTemplateIds: Set<string>,
) => {
  const recent = history.slice(-MAX_HISTORY)
  const withoutRecentDuplicates = availableTopics.filter(
    (topic) =>
      !usedTemplateIds.has(topic.id) &&
      !recent.some((previous) => previous.templateId === topic.id || previous.text === topic.text),
  )

  const pool =
    withoutRecentDuplicates.length > 0
      ? withoutRecentDuplicates
      : availableTopics.filter((topic) => !usedTemplateIds.has(topic.id))

  if (pool.length === 0) {
    throw new Error('抽選可能なお題がありません')
  }

  return pool[Math.floor(Math.random() * pool.length)]
}

export const generateJsonRandomizerTopic = (
  options: GenerateTopicOptions = {},
): GeneratedCandidate => {
  const { templateIdFilter = [], history = [] } = options
  const availableTopics =
    templateIdFilter.length > 0
      ? fullTopics.filter((topic) => templateIdFilter.includes(topic.id))
      : fullTopics

  if (availableTopics.length === 0) {
    throw new Error('条件に合うお題がありません')
  }

  const selectedTopic = pickRandomFullTopic(availableTopics, history, new Set())
  const isRecentDuplicate = history
    .slice(-MAX_HISTORY)
    .some((previous) => previous.templateId === selectedTopic.id || previous.text === selectedTopic.text)

  const clarity = selectedTopic.text.length <= 22 ? 8 : selectedTopic.text.length <= 34 ? 7 : 6
  const novelty = isRecentDuplicate ? -4 : 2

  const scoreBreakdown = {
    surprise: 0,
    imageability: 0,
    clarity,
    novelty,
    ordinaryPenalty: 0,
    chaosPenalty: 0,
    ngPenalty: 0,
  }

  return {
    text: selectedTopic.text,
    templateId: selectedTopic.id,
    selectedWords: {},
    score: clarity + novelty,
    scoreBreakdown,
  }
}

export const createJsonRandomizerBatch = (
  count: number,
  maxLineLength: number,
  history: TopicFingerprint[],
) => {
  const safeCount = Math.max(1, count)
  const rollingHistory = [...history]
  const usedTemplateIds = new Set<string>()

  return Array.from({ length: safeCount }, (_, index) => {
    const selectedTopic = pickRandomFullTopic(fullTopics, rollingHistory, usedTemplateIds)
    usedTemplateIds.add(selectedTopic.id)

    const candidate = generateJsonRandomizerTopic({
      templateIdFilter: [selectedTopic.id],
      history: rollingHistory,
    })

    const topic: TopicCard = {
      id: Date.now() + index,
      ...candidate,
      displayPrompt: insertLineBreaks(candidate.text, maxLineLength),
      ingredients: [],
      fingerprint: createFingerprint(candidate),
    }

    rollingHistory.push(topic.fingerprint)
    return topic
  })
}
