import { useState } from 'react'
import type { GenerationMode } from '../../../lib/odaiGenerator'
import { BATCH_SIZE_OPTIONS } from '../constants'
import { GenerationControls } from './GenerationControls'

type HeroSectionProps = {
  batchSize: number;
  copyStatus: string;
  debugPath: string;
  generationMode: GenerationMode;
  generationModeOptions: Array<{ value: GenerationMode; label: string }>;
  handleGenerate: () => void;
  handleGenerationModeChange: (nextMode: GenerationMode) => void;
  isDebugPage: boolean;
  lineWidth: number;
  setBatchSize: React.Dispatch<React.SetStateAction<number>>;
  setLineWidth: React.Dispatch<React.SetStateAction<number>>;
  topics: Array<unknown>;
};

const generationModeDescriptions: Array<{
  value: GenerationMode
  title: string
  description: string
  note?: string
}> = [
  {
    value: 'word-randomizer',
    title: 'ワード抽出',
    description:
      'テンプレートに単語辞書を差し込み、相性や意外性をスコア化して、お題として使いやすい候補を選びます。',
  },
  {
    value: 'json-randomizer',
    title: '全文抽出',
    description:
      'fullTopics.json に入っている完成済みのお題を、そのままランダム抽選で取り出します。即戦力のお題を安定して出したいとき向けです。',
  },
  {
    value: 'infinite-monkey',
    title: '無限の猿定理',
    description:
      '文字集合からランダム打鍵を繰り返し、お題らしい長さや記号を偶然満たした文字列だけを採用する実験的な方式です。',
    note: 'ネタモードです。ジョーク要素が強いため、実際の利用は推奨していません。',
  },
]

export const HeroSection = ({
  batchSize,
  copyStatus,
  debugPath,
  generationMode,
  generationModeOptions,
  handleGenerate,
  handleGenerationModeChange,
  isDebugPage,
  lineWidth,
  setBatchSize,
  setLineWidth,
  topics,
}: HeroSectionProps) => {
  const [isGenerationModeHelpOpen, setIsGenerationModeHelpOpen] = useState(false)

  return (
    <section className="hero-panel">
      <p className="eyebrow">IPPONグランプリ風 お題メーカー</p>
      <h1>
        生成方式を切り替えて、
        <br />
        すぐ使えるお題を出す。
      </h1>
      <p className="lead">
        ランダムワード抽出と、
        <br />
        `json` に入れた全文お題のランダム抽選に加えて、無限の猿定理モードも切り替えできます。
      </p>

      <GenerationControls
        batchSize={batchSize}
        batchSizeOptions={BATCH_SIZE_OPTIONS}
        generationMode={generationMode}
        generationModeOptions={generationModeOptions}
        lineWidth={lineWidth}
        onBatchSizeChange={(value) => setBatchSize(value)}
        onGenerate={handleGenerate}
        onGenerationModeChange={handleGenerationModeChange}
        onLineWidthChange={(value) => setLineWidth(value)}
        onOpenGenerationModeHelp={() => setIsGenerationModeHelpOpen(true)}
      />

      <div className="status-row">
        <span>お題ガチャ結果: {topics.length}件</span>
        <span>
          {copyStatus ||
            (isDebugPage
              ? 'debug mode: generation mode comparison'
              : '詳細ステータスは /debug で確認')}
        </span>
        <a className="status-link" href={isDebugPage ? '/' : debugPath}>
          {isDebugPage ? '通常表示へ' : '/debug'}
        </a>
      </div>

      {isGenerationModeHelpOpen ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setIsGenerationModeHelpOpen(false)}
        >
          <div
            className="info-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="generation-mode-help-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="info-modal-header">
              <div>
                <p className="eyebrow">Generation Modes</p>
                <h2 id="generation-mode-help-title">生成方式の説明</h2>
              </div>
              <button
                className="modal-close-button"
                type="button"
                onClick={() => setIsGenerationModeHelpOpen(false)}
                aria-label="説明を閉じる"
              >
                ×
              </button>
            </div>

            <div className="info-modal-list">
              {generationModeDescriptions.map((mode) => (
                <section
                  key={mode.value}
                  className={`info-modal-card${generationMode === mode.value ? ' is-active' : ''}`}
                >
                  <div className="info-modal-card-header">
                    <h3>{mode.title}</h3>
                    <div className="info-modal-card-actions">
                      <button
                        className={`mode-select-button${generationMode === mode.value ? ' is-active' : ''}`}
                        type="button"
                        onClick={() => handleGenerationModeChange(mode.value)}
                      >
                        {generationMode === mode.value
                          ? 'この方式を現在使用中'
                          : 'この方式に切り替える'}
                      </button>
                    </div>
                  </div>
                  <p>{mode.description}</p>
                  {mode.note ? <p className="info-modal-note">{mode.note}</p> : null}
                </section>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
