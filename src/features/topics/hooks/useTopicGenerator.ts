import { useEffect, useState } from 'react'
import {
  DEFAULT_GENERATION_MODE,
  DEFAULT_GENERATION_MODE as defaultGenerationMode,
  MAX_HISTORY,
  buildInitialState,
  createTopicBatch,
  generationModeOptions,
  type GenerationMode,
  type TopicCard,
  type TopicFingerprint,
} from '../../../lib/odaiGenerator'
import { DEBUG_PATH, DEFAULT_LINE_WIDTH } from '../constants'
import type { SavedTopic } from '../types'
import { isDebugPath } from '../utils/path'
import { loadSavedTopics, persistSavedTopics } from '../utils/storage'
import { createTopicKey } from '../utils/topicKey'

const defaultState = buildInitialState(DEFAULT_GENERATION_MODE)

export const useTopicGenerator = () => {
  const [generationMode, setGenerationMode] = useState<GenerationMode>(defaultGenerationMode)
  const [batchSize, setBatchSize] = useState(3)
  const [lineWidth, setLineWidth] = useState(DEFAULT_LINE_WIDTH)
  const [topics, setTopics] = useState<TopicCard[]>(defaultState.topics)
  const [history, setHistory] = useState<TopicFingerprint[]>(defaultState.history)
  const [savedTopics, setSavedTopics] = useState<SavedTopic[]>(loadSavedTopics)
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [copyStatus, setCopyStatus] = useState('')

  const isDebugPage =
    typeof window !== 'undefined' ? isDebugPath(window.location.pathname) : false

  useEffect(() => {
    persistSavedTopics(savedTopics)
  }, [savedTopics])

  const resetTransientStatus = () => {
    setCopiedId(null)
    setCopyStatus('')
  }

  const handleGenerate = () => {
    const nextTopics = createTopicBatch(batchSize, generationMode, lineWidth, history)

    setTopics(nextTopics)
    setHistory((previous) =>
      [...previous, ...nextTopics.map((topic) => topic.fingerprint)].slice(-MAX_HISTORY),
    )
    resetTransientStatus()
  }

  const handleGenerationModeChange = (nextMode: GenerationMode) => {
    const nextState = buildInitialState(nextMode)
    setGenerationMode(nextMode)
    setTopics(nextState.topics)
    setHistory(nextState.history)
    resetTransientStatus()
  }

  const handleCopyTopic = async (topic: TopicCard | SavedTopic) => {
    await navigator.clipboard.writeText(topic.displayPrompt)
    setCopiedId(topic.id)
    setCopyStatus('お題をコピーしました')
  }

  const handleSaveTopic = (topic: TopicCard) => {
    const topicKey = createTopicKey(topic)
    const alreadySaved = savedTopics.some((savedTopic) => createTopicKey(savedTopic) === topicKey)

    if (alreadySaved) {
      setCopyStatus('このお題はすでにお気に入り保存済みです')
      return
    }

    setSavedTopics((previous) => [{ ...topic, savedAt: Date.now() }, ...previous])
    setCopyStatus('お気に入りに保存しました')
  }

  const handleRemoveSavedTopic = (topic: SavedTopic) => {
    const topicKey = createTopicKey(topic)
    setSavedTopics((previous) =>
      previous.filter((savedTopic) => createTopicKey(savedTopic) !== topicKey),
    )
    setCopyStatus('お気に入りから削除しました')
  }

  return {
    batchSize,
    copyStatus,
    copiedId,
    debugPath: DEBUG_PATH,
    generationMode,
    generationModeOptions,
    handleCopyTopic,
    handleGenerate,
    handleGenerationModeChange,
    handleRemoveSavedTopic,
    handleSaveTopic,
    isDebugPage,
    lineWidth,
    savedTopics,
    setBatchSize,
    setLineWidth,
    topics,
  }
}
