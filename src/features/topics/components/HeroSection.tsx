import type { GenerationMode } from "../../../lib/odaiGenerator";
import { BATCH_SIZE_OPTIONS } from "../constants";
import { GenerationControls } from "./GenerationControls";

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
}: HeroSectionProps) => (
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
      `json` に入れた全文お題のランダム抽選を切り替えできます。
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
    />

    <div className="status-row">
      <span>お題ガチャ結果: {topics.length}件</span>
      <span>
        {copyStatus ||
          (isDebugPage
            ? 'debug mode: generation mode comparison'
            : "詳細ステータスは /debug で確認")}
      </span>
      <a className="status-link" href={isDebugPage ? "/" : debugPath}>
        {isDebugPage ? "通常表示へ" : "/debug"}
      </a>
    </div>
  </section>
);
