import { useState } from 'react'
import './App.css'
import {
  MAX_HISTORY,
  buildInitialState,
  createTopicBatch,
  type PromptLength,
  type TopicCard,
  type TopicFingerprint,
} from './lib/odaiGenerator'

const initialState = buildInitialState()

function App() {
  const [batchSize, setBatchSize] = useState(3)
  const [promptLength, setPromptLength] = useState<PromptLength>('medium')
  const [lineWidth, setLineWidth] = useState(18)
  const [topics, setTopics] = useState<TopicCard[]>(initialState.topics)
  const [history, setHistory] = useState<TopicFingerprint[]>(initialState.history)
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [copyStatus, setCopyStatus] = useState('')

  const handleGenerate = () => {
    const nextTopics = createTopicBatch(batchSize, promptLength, lineWidth, history)

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

  const handleCopyAll = async () => {
    const merged = topics.map((topic, index) => `${index + 1}. ${topic.displayPrompt}`).join('\n\n')
    await navigator.clipboard.writeText(merged)
    setCopiedId(null)
    setCopyStatus(`${topics.length}個のお題をまとめてコピーしました`)
  }

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">IPPONグランプリ風 お題メーカー</p>
        <h1>ランダムワードを混ぜて、即答したくなるお題を作る。</h1>
        <p className="lead">
          設計資料に合わせて、テンプレート抽選、カテゴリ語彙抽選、NGルール、スコア内訳付きの
          評価でお題を選びます。返却値にはテンプレートIDと選択語彙、総合スコアも含めます。
        </p>

        <div className="control-bar">
          <label className="count-picker">
            <span>同時生成数</span>
            <select
              value={batchSize}
              onChange={(event) => setBatchSize(Number(event.target.value))}
            >
              {[1, 3, 5, 8, 10].map((count) => (
                <option key={count} value={count}>
                  {count}個
                </option>
              ))}
            </select>
          </label>

          <label className="count-picker">
            <span>お題の長さ</span>
            <select
              value={promptLength}
              onChange={(event) => setPromptLength(event.target.value as PromptLength)}
            >
              <option value="short">短め</option>
              <option value="medium">標準</option>
              <option value="long">長め</option>
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

          <button className="ghost-button" onClick={handleCopyAll}>
            まとめてコピー
          </button>
        </div>

        <div className="status-row">
          <span>お題ガチャ結果: {topics.length}件</span>
          <span>{copyStatus || '資料準拠: template + category words + scoring + NG rules'}</span>
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
          </article>
        ))}
      </section>
    </main>
  )
}

export default App
