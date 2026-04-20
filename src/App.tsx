import { useEffect, useState } from 'react'
import './App.css'
import {
  DEFAULT_GENERATION_MODE,
  MAX_HISTORY,
  buildInitialState,
  createTopicBatch,
  generationModeOptions,
  type GenerationMode,
  type TopicCard,
  type TopicFingerprint,
} from './lib/odaiGenerator'

const debugPath = '/debug'
const normalizePath = (path: string) => path.replace(/\/+$/, '') || '/'
const defaultState = buildInitialState(DEFAULT_GENERATION_MODE)
const favoritesStorageKey = 'random-topic-generator:favorites'

type SavedTopic = TopicCard & {
  savedAt: number
}

const createTopicKey = (topic: Pick<TopicCard, 'templateId' | 'text'>) => `${topic.templateId}::${topic.text}`

const loadSavedTopics = (): SavedTopic[] => {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem(favoritesStorageKey)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as SavedTopic[]) : []
  } catch {
    return []
  }
}

function App() {
  const isDebugPage = normalizePath(window.location.pathname) === debugPath
  const [generationMode, setGenerationMode] = useState<GenerationMode>(DEFAULT_GENERATION_MODE)
  const [batchSize, setBatchSize] = useState(3)
  const [lineWidth, setLineWidth] = useState(18)
  const [topics, setTopics] = useState<TopicCard[]>(defaultState.topics)
  const [history, setHistory] = useState<TopicFingerprint[]>(defaultState.history)
  const [savedTopics, setSavedTopics] = useState<SavedTopic[]>(loadSavedTopics)
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [copyStatus, setCopyStatus] = useState('')

  useEffect(() => {
    window.localStorage.setItem(favoritesStorageKey, JSON.stringify(savedTopics))
  }, [savedTopics])

  const handleGenerate = () => {
    const nextTopics = createTopicBatch(batchSize, generationMode, lineWidth, history)

    setTopics(nextTopics)
    setHistory((previous) =>
      [...previous, ...nextTopics.map((topic) => topic.fingerprint)].slice(-MAX_HISTORY),
    )
    setCopiedId(null)
    setCopyStatus('')
  }

  const handleCopyOne = async (topic: TopicCard) => {
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

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">IPPONグランプリ風 お題メーカー</p>
        <h1>ランダムワードを混ぜて、即答したくなるお題を作る。</h1>
        <p className="lead">
          生成方式ごとにお題の作り方を切り替えられる構成に変更しました。現在のランダムワード抽出方式では、
          3件ごとに別ジャンルのお題を順番に生成します。
        </p>

        <div className="control-bar">
          <label className="count-picker">
            <span>同時生成数</span>
            <select
              value={batchSize}
              onChange={(event) => setBatchSize(Number(event.target.value))}
            >
              {[3, 6, 9, 12].map((count) => (
                <option key={count} value={count}>
                  {count}個
                </option>
              ))}
            </select>
          </label>

          <label className="count-picker">
            <span>生成方式</span>
            <select
              value={generationMode}
              onChange={(event) => {
                const nextMode = event.target.value as GenerationMode
                const nextState = buildInitialState(nextMode)
                setGenerationMode(nextMode)
                setTopics(nextState.topics)
                setHistory(nextState.history)
                setCopiedId(null)
                setCopyStatus('')
              }}
            >
              {generationModeOptions.map((mode) => (
                <option key={mode.value} value={mode.value}>
                  {mode.label}
                </option>
              ))}
            </select>
          </label>

          <label className="count-picker">
            <span>改行の細かさ</span>
            <select
              value={lineWidth}
              onChange={(event) => setLineWidth(Number(event.target.value))}
            >
              <option value={14}>多め</option>
              <option value={18}>標準</option>
              <option value={24}>少なめ</option>
            </select>
          </label>

          <button className="primary-button" onClick={handleGenerate}>
            {batchSize}個生成
          </button>
        </div>

        <div className="status-row">
          <span>お題ガチャ結果: {topics.length}件</span>
          <span>
            {copyStatus ||
              (isDebugPage
                ? 'debug mode: template + category words + scoring + NG rules'
                : '詳細ステータスは /debug で確認')}
          </span>
          <a className="status-link" href={isDebugPage ? '/' : debugPath}>
            {isDebugPage ? '通常表示へ' : '/debug'}
          </a>
        </div>
      </section>

      <section className="topic-grid" aria-label="生成されたお題一覧">
        {topics.map((topic, index) => (
          <article key={topic.id} className="topic-card">
            <div className="topic-card-header">
              <span className="topic-number">ODAI {String(index + 1).padStart(2, '0')}</span>
              <div className="topic-actions">
                <button className="save-chip" onClick={() => handleSaveTopic(topic)}>
                  お気に入り
                </button>
                <button className="copy-chip" onClick={() => void handleCopyOne(topic)}>
                  {copiedId === topic.id ? 'コピー済み' : 'コピー'}
                </button>
              </div>
            </div>

            <p className="topic-text formatted">{topic.displayPrompt}</p>
            {isDebugPage ? (
              <>
                <p className="topic-note">
                  <span>{topic.templateId}</span>
                  <span>score {topic.score.toFixed(1)}</span>
                </p>

                <dl className="score-breakdown">
                  <div>
                    <dt>意外性</dt>
                    <dd>{topic.scoreBreakdown.surprise.toFixed(1)}</dd>
                  </div>
                  <div>
                    <dt>想像しやすさ</dt>
                    <dd>{topic.scoreBreakdown.imageability.toFixed(1)}</dd>
                  </div>
                  <div>
                    <dt>明瞭性</dt>
                    <dd>{topic.scoreBreakdown.clarity.toFixed(1)}</dd>
                  </div>
                  <div>
                    <dt>新しさ</dt>
                    <dd>{topic.scoreBreakdown.novelty.toFixed(1)}</dd>
                  </div>
                  <div>
                    <dt>普通すぎ</dt>
                    <dd>-{topic.scoreBreakdown.ordinaryPenalty.toFixed(1)}</dd>
                  </div>
                  <div>
                    <dt>壊れすぎ</dt>
                    <dd>-{topic.scoreBreakdown.chaosPenalty.toFixed(1)}</dd>
                  </div>
                </dl>

                <ul className="ingredient-list" aria-label="使用ワード">
                  {topic.ingredients.map((ingredient) => (
                    <li key={`${topic.id}-${ingredient}`}>{ingredient}</li>
                  ))}
                </ul>
              </>
            ) : null}
          </article>
        ))}
      </section>

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
              <article key={`${createTopicKey(topic)}-${topic.savedAt}`} className="topic-card saved-topic-card">
                <div className="topic-card-header">
                  <span className="topic-number">FAVORITE</span>
                  <div className="topic-actions">
                    <button className="save-chip remove-chip" onClick={() => handleRemoveSavedTopic(topic)}>
                      削除
                    </button>
                    <button className="copy-chip" onClick={() => void handleCopyOne(topic)}>
                      {copiedId === topic.id ? 'コピー済み' : 'コピー'}
                    </button>
                  </div>
                </div>

                <p className="topic-text formatted">{topic.displayPrompt}</p>
                {isDebugPage ? (
                  <>
                    <p className="topic-note">
                      <span>{topic.templateId}</span>
                      <span>score {topic.score.toFixed(1)}</span>
                    </p>

                    <ul className="ingredient-list" aria-label="使用ワード">
                      {topic.ingredients.map((ingredient) => (
                        <li key={`${topic.id}-${ingredient}`}>{ingredient}</li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default App
