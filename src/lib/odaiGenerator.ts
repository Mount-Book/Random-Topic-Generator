import ngRulesData from '../data/topicNgRules.json'
import templatesData from '../data/topicTemplates.json'
import wordsData from '../data/topicWords.json'

export type PromptLength = 'short' | 'medium' | 'long'

type TemplateTag =
  | 'role-swap'
  | 'forbidden'
  | 'reason'
  | 'modern-mix'
  | 'line'
  | 'scene'
  | 'social'
  | 'contrast'
  | 'clear'
  | 'imaginable'
  | 'expansive'
  | PromptLength

type WordTag = string
type CategoryName = keyof typeof wordsData

type SlotDefinition = {
  key: string
  category: CategoryName
}

type TemplateDefinition = {
  id: string
  text: string
  slots: SlotDefinition[]
  weight: number
  tags: TemplateTag[]
}

type WordEntry = {
  id: string
  text: string
  tags: WordTag[]
  weight: number
  forms?: Record<string, string>
}

type Lexicon = Record<CategoryName, WordEntry[]>

type NgRule =
  | {
      id: string
      type: 'text-pair'
      leftSlot: string
      leftText: string
      rightSlot: string
      rightText: string
      reason: string
    }
  | {
      id: string
      type: 'tag-pair'
      leftSlot: string
      leftTag: string
      rightSlot: string
      rightTag: string
      reason: string
    }

export type ScoreBreakdown = {
  surprise: number
  imageability: number
  clarity: number
  novelty: number
  ordinaryPenalty: number
  chaosPenalty: number
  ngPenalty: number
}

export type GeneratedCandidate = {
  text: string
  templateId: string
  selectedWords: Record<string, { id: string; text: string; tags: string[] }>
  score: number
  scoreBreakdown: ScoreBreakdown
}

export type TopicFingerprint = {
  templateId: string
  text: string
  slotWordIds: string[]
}

export type TopicCard = GeneratedCandidate & {
  id: number
  displayPrompt: string
  ingredients: string[]
  fingerprint: TopicFingerprint
}

export type GenerateTopicOptions = {
  candidateCount?: number
  promptLength?: PromptLength
  templateTagFilter?: TemplateTag[]
  history?: TopicFingerprint[]
}

const templates = templatesData as TemplateDefinition[]
const lexicon = wordsData as Lexicon
const ngRules = ngRulesData as NgRule[]

const DEFAULT_CANDIDATE_COUNT = 20
export const MAX_HISTORY = 12

const pairWeightsBySlot: Record<string, number> = {
  'person:job': 1.25,
  'person:modern': 1.15,
  'place:person': 1.1,
  'place:action': 1.2,
  'situation:action': 1.35,
  'situation:modern': 1.1,
  'job:modern': 1.15,
}

const clarityCategoryBonus: Record<string, number> = {
  person: 1.3,
  job: 1.2,
  place: 1.4,
  situation: 1.4,
  action: 1.2,
  modern: 1,
}

const pickWeighted = <T,>(list: T[], getWeight: (value: T) => number) => {
  const weighted = list.map((value) => ({ value, weight: Math.max(0.01, getWeight(value)) }))
  const total = weighted.reduce((sum, item) => sum + item.weight, 0)
  let cursor = Math.random() * total

  for (const item of weighted) {
    cursor -= item.weight
    if (cursor <= 0) {
      return item.value
    }
  }

  return weighted[weighted.length - 1].value
}

const intersect = <T,>(left: T[], right: T[]) => left.filter((value) => right.includes(value))

const renderTemplate = (template: TemplateDefinition, selectedWords: Record<string, WordEntry>) =>
  template.text.replaceAll(/\{([a-z-]+)(?::([a-z-]+))?\}/g, (_match, slotKey: string, formKey?: string) => {
    const word = selectedWords[slotKey]
    if (!word) {
      return ''
    }

    if (formKey) {
      return word.forms?.[formKey] ?? word.text
    }

    return word.text
  })

export const insertLineBreaks = (prompt: string, maxLineLength: number) => {
  if (prompt.length <= maxLineLength) {
    return prompt
  }

  const chunks: string[] = []
  let current = ''

  for (const char of prompt) {
    current += char
    const shouldBreakAtPunctuation = ['。', '、', '？', '」'].includes(char)
    const reachedLimit = current.length >= maxLineLength

    if (reachedLimit && shouldBreakAtPunctuation) {
      chunks.push(current)
      current = ''
      continue
    }

    if (reachedLimit && !shouldBreakAtPunctuation) {
      chunks.push(current)
      current = ''
    }
  }

  if (current) {
    chunks.push(current)
  }

  return chunks.join('\n')
}

const buildSelectedWords = (template: TemplateDefinition) =>
  Object.fromEntries(
    template.slots.map((slot) => [
      slot.key,
      pickWeighted(lexicon[slot.category], (word) => word.weight),
    ]),
  ) as Record<string, WordEntry>

const getWordPairs = (selectedWords: Record<string, WordEntry>) => {
  const entries = Object.entries(selectedWords)
  const pairs: Array<{ leftSlot: string; rightSlot: string; leftWord: WordEntry; rightWord: WordEntry }> = []

  for (let index = 0; index < entries.length; index += 1) {
    for (let inner = index + 1; inner < entries.length; inner += 1) {
      const [leftSlot, leftWord] = entries[index]
      const [rightSlot, rightWord] = entries[inner]
      pairs.push({ leftSlot, rightSlot, leftWord, rightWord })
    }
  }

  return pairs
}

const evaluateNgRules = (selectedWords: Record<string, WordEntry>) => {
  const reasons: string[] = []

  for (const rule of ngRules) {
    if (rule.type === 'text-pair') {
      if (
        selectedWords[rule.leftSlot]?.text === rule.leftText &&
        selectedWords[rule.rightSlot]?.text === rule.rightText
      ) {
        reasons.push(rule.reason)
      }
      continue
    }

    if (
      selectedWords[rule.leftSlot]?.tags.includes(rule.leftTag) &&
      selectedWords[rule.rightSlot]?.tags.includes(rule.rightTag)
    ) {
      reasons.push(rule.reason)
    }
  }

  return reasons
}

const scoreSurprise = (template: TemplateDefinition, selectedWords: Record<string, WordEntry>) => {
  let score = 0

  for (const pair of getWordPairs(selectedWords)) {
    const overlapCount = intersect(pair.leftWord.tags, pair.rightWord.tags).length
    const pairKey = [pair.leftSlot, pair.rightSlot].sort().join(':')
    const weight = pairWeightsBySlot[pairKey] ?? 1

    if (overlapCount === 1) score += 4.2 * weight
    if (overlapCount === 2) score += 2.6 * weight
    if (overlapCount >= 3) score -= 1.6 * weight
  }

  if (template.tags.includes('contrast')) score += 1.8
  if (template.tags.includes('role-swap')) score += 1.4

  return score
}

const scoreImageability = (template: TemplateDefinition, selectedWords: Record<string, WordEntry>) => {
  let score = 0

  for (const slot of template.slots) {
    score += clarityCategoryBonus[slot.category] ?? 1
    const word = selectedWords[slot.key]
    if (word.tags.includes('familiar')) score += 1.2
    if (word.tags.includes('crowd')) score += 0.8
    if (word.tags.includes('formal')) score += 0.5
    if (word.tags.includes('crisis')) score += 0.6
  }

  if (template.tags.includes('imaginable')) score += 1.2
  if (template.tags.includes('scene')) score += 0.8

  return score
}

const scoreClarity = (template: TemplateDefinition, selectedWords: Record<string, WordEntry>, text: string) => {
  let score = 6

  if (text.length <= 22) score += 2.2
  else if (text.length <= 34) score += 1.2
  else score -= 0.4

  if (template.tags.includes('clear')) score += 1.5
  if (template.tags.includes('reason')) score += 1
  if (template.tags.includes('short')) score += 0.8
  if (template.slots.length === 1) score += 1
  if (template.slots.length >= 3) score -= 0.8

  for (const word of Object.values(selectedWords)) {
    if (word.text.length >= 10) score -= 0.3
  }

  return score
}

const scoreNovelty = (
  text: string,
  templateId: string,
  selectedWords: Record<string, WordEntry>,
  history: TopicFingerprint[],
) => {
  let score = 0
  const recent = history.slice(-MAX_HISTORY)

  recent.forEach((previous, index) => {
    const decay = 1 - index / Math.max(1, recent.length)

    if (previous.templateId === templateId) score -= 1.3 * decay
    if (previous.text === text) score -= 6 * decay

    const duplicateWords = previous.slotWordIds.filter((id) =>
      Object.values(selectedWords).some((word) => word.id === id),
    ).length

    score -= duplicateWords * 0.9 * decay
  })

  return score
}

const scoreOrdinaryPenalty = (selectedWords: Record<string, WordEntry>) => {
  let penalty = 0

  for (const pair of getWordPairs(selectedWords)) {
    const overlapCount = intersect(pair.leftWord.tags, pair.rightWord.tags).length
    if (overlapCount >= 3) penalty += overlapCount * 1.6
  }

  return penalty
}

const scoreChaosPenalty = (selectedWords: Record<string, WordEntry>) => {
  let penalty = 0

  for (const pair of getWordPairs(selectedWords)) {
    const overlapCount = intersect(pair.leftWord.tags, pair.rightWord.tags).length
    if (overlapCount === 0) penalty += 2.2
  }

  return penalty
}

const createFingerprint = (candidate: GeneratedCandidate): TopicFingerprint => ({
  templateId: candidate.templateId,
  text: candidate.text,
  slotWordIds: Object.values(candidate.selectedWords).map((word) => word.id),
})

const createCandidate = (
  template: TemplateDefinition,
  history: TopicFingerprint[],
): GeneratedCandidate | null => {
  const selectedWords = buildSelectedWords(template)
  const text = renderTemplate(template, selectedWords)
  const ngHits = evaluateNgRules(selectedWords)

  if (ngHits.length > 0 || /している理由|し始めた.+し始めた|しているしている/.test(text)) {
    return null
  }

  const breakdown: ScoreBreakdown = {
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

export const generateTopic = (options: GenerateTopicOptions = {}): GeneratedCandidate => {
  const {
    candidateCount = DEFAULT_CANDIDATE_COUNT,
    promptLength,
    templateTagFilter = [],
    history = [],
  } = options

  const availableTemplates = templates.filter((template) => {
    const lengthOk = promptLength ? template.tags.includes(promptLength) : true
    const tagOk = templateTagFilter.length === 0 || templateTagFilter.every((tag) => template.tags.includes(tag))
    return lengthOk && tagOk
  })

  let bestCandidate: GeneratedCandidate | null = null

  for (let index = 0; index < candidateCount; index += 1) {
    const template = pickWeighted(availableTemplates, (candidate) => candidate.weight)
    const candidate = createCandidate(template, history)

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

export const createTopicBatch = (
  count: number,
  promptLength: PromptLength,
  maxLineLength: number,
  history: TopicFingerprint[],
) => {
  const rollingHistory = [...history]

  return Array.from({ length: count }, (_, index) => {
    const candidate = generateTopic({
      candidateCount: DEFAULT_CANDIDATE_COUNT,
      promptLength,
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

export const buildInitialState = () => {
  const topics = createTopicBatch(3, 'medium', 18, [])
  return {
    topics,
    history: topics.map((topic) => createFingerprint(topic)),
  }
}
