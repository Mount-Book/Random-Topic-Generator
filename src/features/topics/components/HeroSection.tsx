import { useState } from "react";
import type { GenerationMode } from "../../../lib/odaiGenerator";
import { BATCH_SIZE_OPTIONS } from "../constants";
import { FeedbackModal } from "./FeedbackModal";
import { GenerationControls } from "./GenerationControls";

type HeroSectionProps = {
  batchSize: number;
  copyStatus: string;
  debugPath: string;
  isDeveloperMode: boolean;
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
  value: GenerationMode;
  title: string;
  description: string;
  note?: string;
}> = [
  {
    value: "word-randomizer",
    title: "ワード抽出",
    description:
      "テンプレートに単語辞書を差し込み、相性や意外性をスコア化して、お題として使いやすい候補を選びます。",
  },
  {
    value: "json-randomizer",
    title: "全文抽出",
    description:
      "完成済みのお題ストックから選ぶ方式です。安定してすぐ使えるお題を出したいときに向いています。フォームでは全文抽出に追加してほしい渾身のお題も受け付けています。",
  },
  {
    value: "infinite-monkey",
    title: "無限の猿定理",
    description:
      "遊び心を優先した実験モードです。意外性の強い、少し変わったお題を楽しみたいときに使えます。",
    note: "ネタモードです。ジョーク要素が強いため、実際の利用は推奨していません。",
  },
];

export const HeroSection = ({
  batchSize,
  copyStatus,
  debugPath,
  isDeveloperMode,
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
  const [isGenerationModeHelpOpen, setIsGenerationModeHelpOpen] =
    useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  return (
    <section className="hero-panel">
      <p className="eyebrow">大喜利用 お題メーカー</p>
      <h1>
        生成方式を切り替えて、
        <br />
        すぐ使えるお題を出す。
      </h1>
      <p className="lead">
        言葉の組み合わせから作る「ワード抽出」と、
        <br />
        完成済みのお題から選ぶ「全文抽出」、遊び心しかない「無限の猿定理」を切り替えできます。
        <br />
        生成方式の横にある「？」アイコンから各方式の説明を確認できます！
      </p>

      <div className="hero-actions">
        <button
          className="secondary-ghost-button"
          type="button"
          onClick={() => setIsFeedbackModalOpen(true)}
        >
          ご意見・ご要望を送る
        </button>
      </div>

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
              ? "開発用の詳細表示を有効化中"
              : "お気に入り保存やコピー結果がここに表示されます")}
        </span>
        {isDeveloperMode ? (
          <a className="status-link" href={isDebugPage ? "/" : debugPath}>
            {isDebugPage ? "通常表示へ" : "開発用の詳細表示へ"}
          </a>
        ) : null}
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
                <p className="eyebrow">Mode Guide</p>
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
                  className={`info-modal-card${generationMode === mode.value ? " is-active" : ""}`}
                >
                  <div className="info-modal-card-header">
                    <h3>{mode.title}</h3>
                    <div className="info-modal-card-actions">
                      <button
                        className={`mode-select-button${generationMode === mode.value ? " is-active" : ""}`}
                        type="button"
                        onClick={() => handleGenerationModeChange(mode.value)}
                      >
                        {generationMode === mode.value
                          ? "この方式を現在使用中"
                          : "この方式に切り替える"}
                      </button>
                    </div>
                  </div>
                  <p>{mode.description}</p>
                  {mode.note ? (
                    <p className="info-modal-note">{mode.note}</p>
                  ) : null}
                </section>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
      />
    </section>
  );
};
