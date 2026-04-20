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
  onOpenGenerationModeHelp: () => void
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
  onOpenGenerationModeHelp,
}: GenerationControlsProps) => {
  const handleLineWidthStep = (delta: number) => {
    onLineWidthChange(Math.max(1, lineWidth + delta))
  }

  return (
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
        <span className="count-picker-title">
          生成方式
          <button
            className="inline-help-button"
            type="button"
            onClick={onOpenGenerationModeHelp}
            aria-label="生成方式の説明を開く"
          >
            ?
          </button>
        </span>
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
        <span>改行の目安文字数</span>
        <div className="stepper-input">
          <input
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={lineWidth}
            onChange={(event) => {
              const nextValue = event.currentTarget.valueAsNumber
              if (!Number.isNaN(nextValue)) {
                onLineWidthChange(Math.max(1, nextValue))
              }
            }}
          />
          <div className="stepper-buttons" aria-label="改行の目安文字数を調整">
            <button
              className="stepper-button"
              type="button"
              onClick={() => handleLineWidthStep(1)}
              aria-label="改行の目安文字数を増やす"
            >
              <span aria-hidden="true">▲</span>
            </button>
            <button
              className="stepper-button"
              type="button"
              onClick={() => handleLineWidthStep(-1)}
              aria-label="改行の目安文字数を減らす"
            >
              <span aria-hidden="true">▼</span>
            </button>
          </div>
        </div>
      </label>

      <button className="primary-button" onClick={onGenerate}>
        {batchSize}個生成
      </button>
    </div>
  )
}
