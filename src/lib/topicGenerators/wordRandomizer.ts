import {
  DEFAULT_CANDIDATE_COUNT,
  buildSelectedWords,
  createFingerprint,
  evaluateNgRules,
  insertLineBreaks,
  pickWeighted,
  renderTemplate,
  scoreChaosPenalty,
  scoreClarity,
  scoreImageability,
  scoreNovelty,
  scoreOrdinaryPenalty,
  scoreSurprise,
  templateById,
  templateIdsByGenre,
  templates,
  topicGenreCycle,
  type GenerateTopicOptions,
  type GeneratedCandidate,
  type TopicCard,
  type TopicFingerprint,
  type TemplateDefinition,
} from './shared'

const createWordRandomizerCandidate = (
  template: TemplateDefinition,
  history: TopicFingerprint[],
): GeneratedCandidate | null => {
  const selectedWords = buildSelectedWords(template)
  const text = renderTemplate(template, selectedWords)
  const ngHits = evaluateNgRules(selectedWords)

  if (ngHits.length > 0 || /している理由|し始めた.+し始めた|しているしている/.test(text)) {
    return null
  }

  const breakdown = {
    surprise: scoreSurprise(template, selectedWords),
    imageability: scoreImageability(template, selectedWords),
    clarity: scoreClarity(template, selectedWords, text),
    novelty: scoreNovelty(text, template.id, selectedWords, history),
    ordinaryPenalty: scoreOrdinaryPenalty(selectedWords),
    chaosPenalty: scoreChaosPenalty(selectedWords),
    ngPenalty: 0,
  }

  const score =
    breakdown.surprise +
    breakdown.imageability +
    breakdown.clarity +
    breakdown.novelty -
    breakdown.ordinaryPenalty -
    breakdown.chaosPenalty -
    breakdown.ngPenalty

  return {
    text,
    templateId: template.id,
    selectedWords: Object.fromEntries(
      Object.entries(selectedWords).map(([slot, word]) => [
        slot,
        { id: word.id, text: word.text, tags: word.tags },
      ]),
    ),
    score,
    scoreBreakdown: breakdown,
  }
}

export const generateWordRandomizerTopic = (
  options: GenerateTopicOptions = {},
): GeneratedCandidate => {
  const {
    candidateCount = DEFAULT_CANDIDATE_COUNT,
    templateTagFilter = [],
    templateIdFilter = [],
    history = [],
  } = options

  const availableTemplates = templates.filter((template) => {
    const tagOk =
      templateTagFilter.length === 0 || templateTagFilter.every((tag) => template.tags.includes(tag))
    const idOk = templateIdFilter.length === 0 || templateIdFilter.includes(template.id)
    return tagOk && idOk
  })

  if (availableTemplates.length === 0) {
    throw new Error('条件に合うテンプレートがありません')
  }

  let bestCandidate: GeneratedCandidate | null = null

  for (let index = 0; index < candidateCount; index += 1) {
    const template = pickWeighted(availableTemplates, (candidate) => candidate.weight)
    const candidate = createWordRandomizerCandidate(template, history)

    if (!candidate) {
      continue
    }

    if (!bestCandidate || candidate.score > bestCandidate.score) {
      bestCandidate = candidate
    }
  }

  if (!bestCandidate) {
    throw new Error('有効なお題候補を生成できませんでした')
  }

  return bestCandidate
}

export const createWordRandomizerBatch = (
  count: number,
  maxLineLength: number,
  history: TopicFingerprint[],
) => {
  const rollingHistory = [...history]
  const safeCount = Math.max(3, Math.floor(count / 3) * 3)

  return Array.from({ length: safeCount }, (_, index) => {
    const genre = topicGenreCycle[index % topicGenreCycle.length]
    const genreTemplateIds = templateIdsByGenre[genre]
    const candidate = generateWordRandomizerTopic({
      candidateCount: DEFAULT_CANDIDATE_COUNT,
      templateIdFilter: genreTemplateIds.filter((templateId) => templateById.has(templateId)),
      history: rollingHistory,
    })

    const topic: TopicCard = {
      id: Date.now() + index,
      ...candidate,
      displayPrompt: insertLineBreaks(candidate.text, maxLineLength),
      ingredients: Object.values(candidate.selectedWords).map((word) => word.text),
      fingerprint: createFingerprint(candidate),
    }

    rollingHistory.push(topic.fingerprint)
    return topic
  })
}
