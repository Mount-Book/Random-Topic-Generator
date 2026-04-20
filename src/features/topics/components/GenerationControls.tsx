import type { GenerationMode } from '../../../lib/odaiGenerator'

type GenerationControlsProps = {
  batchSize: number
  batchSizeOptions: readonly number[]
  generationMode: GenerationMode
  generationModeOptions: Array<{ value: GenerationMode; label: string }>
  lineWidth: number
  onBatchSizeChange: (value: number) => void
  onGenerate: () => void
  onGenerationModeChange: (value: GenerationMode) => void
  onLineWidthChange: (value: number) => void
}

export const GenerationControls = ({
  batchSize,
  batchSizeOptions,
  generationMode,
  generationModeOptions,
  lineWidth,
  onBatchSizeChange,
  onGenerate,
  onGenerationModeChange,
  onLineWidthChange,
}: GenerationControlsProps) => (
  <div className="control-bar">
    <label className="count-picker">
      <span>同時生成数</span>
      <select value={batchSize} onChange={(event) => onBatchSizeChange(Number(event.target.value))}>
        {batchSizeOptions.map((count) => (
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
        onChange={(event) => onGenerationModeChange(event.target.value as GenerationMode)}
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
      <select value={lineWidth} onChange={(event) => onLineWidthChange(Number(event.target.value))}>
        <option value={14}>多め</option>
        <option value={18}>標準</option>
        <option value={24}>少なめ</option>
      </select>
    </label>

    <button className="primary-button" onClick={onGenerate}>
      {batchSize}個生成
    </button>
  </div>
)
