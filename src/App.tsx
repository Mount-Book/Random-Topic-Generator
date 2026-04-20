import { useState } from 'react'
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

function App() {
  const isDebugPage = normalizePath(window.location.pathname) === debugPath
  const [generationMode, setGenerationMode] = useState<GenerationMode>(DEFAULT_GENERATION_MODE)
  const [batchSize, setBatchSize] = useState(3)
  const [lineWidth, setLineWidth] = useState(18)
  const [topics, setTopics] = useState<TopicCard[]>(defaultState.topics)
  const [history, setHistory] = useState<TopicFingerprint[]>(defaultState.history)
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [copyStatus, setCopyStatus] = useState('')

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
              <button className="copy-chip" onClick={() => void handleCopyOne(topic)}>
                {copiedId === topic.id ? 'コピー済み' : 'コピー'}
              </button>
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
    </main>
  )
}

export default App
