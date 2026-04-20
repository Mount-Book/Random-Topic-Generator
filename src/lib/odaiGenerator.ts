import {
  createFingerprint,
  type GenerateTopicOptions,
  type GeneratedCandidate,
  type TopicCard,
  type TopicFingerprint,
} from './topicGenerators/shared'
import { createInfiniteMonkeyBatch, generateInfiniteMonkeyTopic } from './topicGenerators/infiniteMonkey'
import { createJsonRandomizerBatch, generateJsonRandomizerTopic } from './topicGenerators/jsonRandomizer'
import { createWordRandomizerBatch, generateWordRandomizerTopic } from './topicGenerators/wordRandomizer'

export { MAX_HISTORY, insertLineBreaks } from './topicGenerators/shared'
export type {
  GeneratedCandidate,
  GenerateTopicOptions,
  ScoreBreakdown,
  TemplateTag,
  TopicCard,
  TopicFingerprint,
} from './topicGenerators/shared'

export const DEFAULT_GENERATION_MODE = 'word-randomizer' as const

export type GenerationMode = 'word-randomizer' | 'json-randomizer' | 'infinite-monkey'

export const generationModeOptions: Array<{ value: GenerationMode; label: string }> = [
  { value: 'word-randomizer', label: 'ワード抽出' },
  { value: 'json-randomizer', label: '全文抽出' },
  { value: 'infinite-monkey', label: '無限の猿定理' },
]

export const generateTopic = (
  generationMode: GenerationMode = DEFAULT_GENERATION_MODE,
  options: GenerateTopicOptions = {},
): GeneratedCandidate =>
  generationMode === 'json-randomizer'
    ? generateJsonRandomizerTopic(options)
    : generationMode === 'infinite-monkey'
      ? generateInfiniteMonkeyTopic(options)
      : generateWordRandomizerTopic(options)

const batchGenerators: Record<GenerationMode, (count: number, maxLineLength: number, history: TopicFingerprint[]) => TopicCard[]> = {
  'word-randomizer': createWordRandomizerBatch,
  'json-randomizer': createJsonRandomizerBatch,
  'infinite-monkey': createInfiniteMonkeyBatch,
}

export const createTopicBatch = (
  count: number,
  generationMode: GenerationMode,
  maxLineLength: number,
  history: TopicFingerprint[],
) => batchGenerators[generationMode](count, maxLineLength, history)

export const buildInitialState = (generationMode: GenerationMode = DEFAULT_GENERATION_MODE) => {
  const topics = createTopicBatch(3, generationMode, 18, [])
  return {
    topics,
    history: topics.map((topic) => createFingerprint(topic)),
  }
}
