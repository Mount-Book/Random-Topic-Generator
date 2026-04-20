import {
  DEFAULT_CANDIDATE_COUNT,
  MAX_HISTORY,
  createFingerprint,
  fullTopics,
  insertLineBreaks,
  templates,
  lexicon,
  pickRandom,
  type GenerateTopicOptions,
  type GeneratedCandidate,
  type TopicCard,
  type TopicFingerprint,
} from './shared'

const buildMonkeyAlphabet = () => {
  const corpus = [
    ...fullTopics.map((topic) => topic.text),
    ...templates.map((template) => template.text.replaceAll(/\{[a-z-]+(?::[a-z-]+)?\}/g, '')),
    ...Object.values(lexicon).flat().map((word) => word.text),
    '！？、。',
  ].join('')

  return [...new Set(corpus)].filter((char) => !/[{}\s]/.test(char))
}

const monkeyAlphabet = buildMonkeyAlphabet()
const knownFullTopicTexts = new Set(fullTopics.map((topic) => topic.text))

const createRandomMonkeyStream = (length: number) =>
  Array.from({ length }, () => pickRandom(monkeyAlphabet)).join('')

const estimateSuccessLog10 = (text: string) => -text.length * Math.log10(monkeyAlphabet.length)

const estimateAttemptsLog10 = (text: string) => -estimateSuccessLog10(text)

const formatScientificLog10 = (log10Value: number) => {
  if (!Number.isFinite(log10Value) || log10Value <= 0) {
    return '1'
  }

  const exponent = Math.floor(log10Value)
  const mantissa = 10 ** (log10Value - exponent)
  return `${mantissa.toFixed(1)}e+${exponent}`
}

const normalizeMonkeyText = (text: string) =>
  text
    .replaceAll(/[、。]{2,}/g, '。')
    .replaceAll(/[？！]{2,}/g, '？')
    .replaceAll(/[。]{2,}/g, '。')
    .replaceAll(/^[、。？！]+|[、。]+$/g, '')
    .trim()

const hasTopicLikeEnding = (text: string) => /[？?！!]$/.test(text)

const isTopicLikeText = (text: string) => {
  if (text.length < 10 || text.length > 34) {
    return false
  }

  if (knownFullTopicTexts.has(text)) {
    return false
  }

  if (!/[一-龠ぁ-んァ-ヶ]/.test(text)) {
    return false
  }

  if (!hasTopicLikeEnding(text)) {
    return false
  }

  if (/(.)\1{3,}/.test(text)) {
    return false
  }

  return true
}

const createMonkeyTargetPool = (candidateCount: number) => {
  const attempts = Math.max(candidateCount * 120, 240)
  const pool: string[] = []

  for (let index = 0; index < attempts; index += 1) {
    const randomLength = 10 + Math.floor(Math.random() * 25)
    const candidate = normalizeMonkeyText(createRandomMonkeyStream(randomLength))

    if (!isTopicLikeText(candidate)) {
      continue
    }

    pool.push(candidate)

    if (pool.length >= candidateCount) {
      break
    }
  }

  return pool
}

const createInfiniteMonkeyCandidate = (
  text: string,
  history: TopicFingerprint[],
): GeneratedCandidate => {
  const attemptsLog10 = estimateAttemptsLog10(text)
  const recentDuplicate = history.slice(-MAX_HISTORY).some((previous) => previous.text === text)
  const clarity = text.length <= 22 ? 8 : text.length <= 34 ? 7 : 5.8
  const novelty = recentDuplicate ? -5 : 2.4
  const difficultyBonus = Math.min(9.5, 2.5 + attemptsLog10 / 5.5)
  const punctuationBonus = /[？?！!。]$/.test(text) ? 1.6 : 0.6
  const repetitionPenalty = /(.)\1{2,}/.test(text) ? 2.4 : 0

  const scoreBreakdown = {
    surprise: difficultyBonus,
    imageability: punctuationBonus,
    clarity,
    novelty,
    ordinaryPenalty: repetitionPenalty,
    chaosPenalty: 0,
    ngPenalty: 0,
  }

  const score =
    scoreBreakdown.surprise +
    scoreBreakdown.imageability +
    scoreBreakdown.clarity +
    scoreBreakdown.novelty -
    scoreBreakdown.ordinaryPenalty

  return {
    text,
    templateId: 'infinite-monkey',
    selectedWords: {
      alphabet: {
        id: 'alphabet-size',
        text: `文字種${monkeyAlphabet.length}`,
        tags: ['monkey-stat'],
      },
      attempts: {
        id: `attempts-${text.length}`,
        text: `期待試行${formatScientificLog10(attemptsLog10)}`,
        tags: ['monkey-stat'],
      },
      noise: {
        id: `noise-${text.length}`,
        text: `ノイズ:${createRandomMonkeyStream(Math.min(8, text.length))}`,
        tags: ['monkey-noise'],
      },
    },
    score,
    scoreBreakdown,
  }
}

export const generateInfiniteMonkeyTopic = (
  options: GenerateTopicOptions = {},
): GeneratedCandidate => {
  const { candidateCount = DEFAULT_CANDIDATE_COUNT, history = [] } = options
  const targetPool = createMonkeyTargetPool(candidateCount)

  if (targetPool.length === 0) {
    throw new Error('猿がまだお題らしい文字列を打ち当てられませんでした')
  }

  let bestCandidate: GeneratedCandidate | null = null

  for (const target of targetPool) {
    const candidate = createInfiniteMonkeyCandidate(target, history)

    if (!bestCandidate || candidate.score > bestCandidate.score) {
      bestCandidate = candidate
    }
  }

  if (!bestCandidate) {
    throw new Error('猿がまだシェイクスピアを書けませんでした')
  }

  return bestCandidate
}

export const createInfiniteMonkeyBatch = (
  count: number,
  maxLineLength: number,
  history: TopicFingerprint[],
) => {
  const safeCount = Math.max(1, count)
  const rollingHistory = [...history]

  return Array.from({ length: safeCount }, (_, index) => {
    const candidate = generateInfiniteMonkeyTopic({
      candidateCount: DEFAULT_CANDIDATE_COUNT,
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
