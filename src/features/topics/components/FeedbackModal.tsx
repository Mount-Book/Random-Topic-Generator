import { useEffect, useState, type FormEvent } from "react";

const FEEDBACK_MESSAGE_MAX_LENGTH = 1200;
const FEEDBACK_REPRODUCTION_MAX_LENGTH = 1200;
const FEEDBACK_CONTACT_MAX_LENGTH = 120;
const FEEDBACK_ANONYMOUS_ID_KEY = "feedback-anonymous-id";

const feedbackTypeOptions = [
  { value: "request", label: "要望" },
  { value: "topic-submission", label: "全文抽出へのお題投稿" },
  { value: "bug", label: "不具合" },
  { value: "other", label: "その他" },
] as const;

type FeedbackType = (typeof feedbackTypeOptions)[number]["value"];

type FeedbackFormState = {
  type: FeedbackType;
  message: string;
  reproductionSteps: string;
  contact: string;
  includeDiagnostics: boolean;
  honeypot: string;
};

type FeedbackFormErrors = Partial<Record<keyof FeedbackFormState, string>>;

type FeedbackModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const createInitialFormState = (): FeedbackFormState => ({
  type: "request",
  message: "",
  reproductionSteps: "",
  contact: "",
  includeDiagnostics: true,
  honeypot: "",
});

const sanitizeText = (value: string) =>
  value.replace(/\r\n/g, "\n").replaceAll(String.fromCharCode(0), "").trim();

const isValidContact = (value: string) => {
  const trimmed = value.trim();

  if (!trimmed) {
    return true;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const xPattern = /^@?[A-Za-z0-9_]{1,15}$/;
  const discordPattern =
    /^(?:@?[A-Za-z0-9_.]{2,32}|[A-Za-z0-9_.]{2,32}#[0-9]{4})$/;

  return (
    emailPattern.test(trimmed) ||
    xPattern.test(trimmed) ||
    discordPattern.test(trimmed)
  );
};

const validateForm = (form: FeedbackFormState): FeedbackFormErrors => {
  const errors: FeedbackFormErrors = {};
  const message = sanitizeText(form.message);
  const reproductionSteps = sanitizeText(form.reproductionSteps);

  if (!message) {
    errors.message = "内容を入力してください。";
  } else if (message.length > FEEDBACK_MESSAGE_MAX_LENGTH) {
    errors.message = `内容は${FEEDBACK_MESSAGE_MAX_LENGTH}文字以内で入力してください。`;
  }

  if (
    form.type === "bug" &&
    reproductionSteps.length > FEEDBACK_REPRODUCTION_MAX_LENGTH
  ) {
    errors.reproductionSteps = `再現手順は${FEEDBACK_REPRODUCTION_MAX_LENGTH}文字以内で入力してください。`;
  }

  if (form.contact.trim().length > FEEDBACK_CONTACT_MAX_LENGTH) {
    errors.contact = `連絡先は${FEEDBACK_CONTACT_MAX_LENGTH}文字以内で入力してください。`;
  } else if (!isValidContact(form.contact)) {
    errors.contact =
      "連絡先はメールアドレス、X ID、または Discord ID の形式で入力してください。";
  }

  return errors;
};

const getMessagePlaceholder = (type: FeedbackType) => {
  if (type === "topic-submission") {
    return "全文抽出に追加してほしい自作のお題を入力してください";
  }

  return "改善してほしい点、不具合の内容、感想などを入力してください";
};

const getAnonymousId = () => {
  if (typeof window === "undefined") {
    return undefined;
  }

  const storedValue = window.localStorage.getItem(FEEDBACK_ANONYMOUS_ID_KEY);
  if (storedValue) {
    return storedValue;
  }

  const nextValue =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `anon-${Date.now()}`;

  window.localStorage.setItem(FEEDBACK_ANONYMOUS_ID_KEY, nextValue);
  return nextValue;
};

export const FeedbackModal = ({ isOpen, onClose }: FeedbackModalProps) => {
  const [form, setForm] = useState<FeedbackFormState>(createInitialFormState);
  const [errors, setErrors] = useState<FeedbackFormErrors>({});
  const [submitState, setSubmitState] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [statusMessage, setStatusMessage] = useState("");

  const handleClose = () => {
    onClose();
    setErrors({});
    setSubmitState("idle");
    setStatusMessage("");
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setErrors({});
        setSubmitState("idle");
        setStatusMessage("");
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const updateField = <T extends keyof FeedbackFormState>(
    key: T,
    value: FeedbackFormState[T],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    if (submitState !== "idle") {
      setSubmitState("idle");
      setStatusMessage("");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateForm(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setSubmitState("error");
      setStatusMessage("入力内容を確認してください。");
      return;
    }

    setSubmitState("submitting");
    setStatusMessage("送信しています...");

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: form.type,
          message: sanitizeText(form.message),
          reproductionSteps: sanitizeText(form.reproductionSteps),
          contact: form.contact.trim(),
          honeypot: form.honeypot,
          ...(form.includeDiagnostics
            ? {
                pageUrl:
                  typeof window === "undefined"
                    ? undefined
                    : window.location.href,
                userAgent:
                  typeof navigator === "undefined"
                    ? undefined
                    : navigator.userAgent,
                screenSize:
                  typeof window === "undefined"
                    ? undefined
                    : `${window.screen.width}x${window.screen.height}`,
                appVersion: import.meta.env.VITE_APP_VERSION,
                language:
                  typeof navigator === "undefined"
                    ? undefined
                    : navigator.language,
                referrer:
                  typeof document === "undefined"
                    ? undefined
                    : document.referrer,
                anonymousId: getAnonymousId(),
              }
            : {}),
        }),
      });

      const result = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;

      if (!response.ok) {
        throw new Error(result?.message ?? "送信に失敗しました。");
      }

      setForm(createInitialFormState());
      setErrors({});
      setSubmitState("success");
      setStatusMessage(
        result?.message ??
          "フィードバックを送信しました。ありがとうございます。",
      );
    } catch (error) {
      setSubmitState("error");
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "送信に失敗しました。時間をおいて再度お試しください。",
      );
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={handleClose}>
      <div
        className="info-modal feedback-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="info-modal-header">
          <div>
            <p className="eyebrow">Feedback</p>
            <h2 id="feedback-modal-title">ご意見・ご要望</h2>
          </div>
          <button
            className="modal-close-button"
            type="button"
            onClick={handleClose}
            aria-label="フォームを閉じる"
          >
            ×
          </button>
        </div>

        <p className="feedback-modal-copy">
          改善の参考にするため、ご意見・ご要望を受け付けています。
          <br />
          不具合報告の場合は、発生状況もできるだけ詳しくご記入ください。
        </p>
        <p className="feedback-toggle-hint">
          全文抽出へのお題投稿は、自作のお題に限ります。第三者のネタや既存コンテンツの転載は送らないでください。
        </p>

        <form className="feedback-form" onSubmit={handleSubmit}>
          <label className="feedback-field">
            <span>種別</span>
            <select
              value={form.type}
              onChange={(event) =>
                updateField("type", event.currentTarget.value as FeedbackType)
              }
            >
              {feedbackTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="feedback-field">
            <span>内容</span>
            <textarea
              rows={6}
              value={form.message}
              onChange={(event) => updateField("message", event.target.value)}
              maxLength={FEEDBACK_MESSAGE_MAX_LENGTH}
              placeholder={getMessagePlaceholder(form.type)}
              aria-invalid={Boolean(errors.message)}
            />
            <strong className="feedback-field-meta">
              {form.message.length}/{FEEDBACK_MESSAGE_MAX_LENGTH}
            </strong>
            {errors.message ? (
              <span className="feedback-field-error">{errors.message}</span>
            ) : null}
          </label>

          {form.type === "bug" ? (
            <label className="feedback-field">
              <span>再現手順</span>
              <textarea
                rows={5}
                value={form.reproductionSteps}
                onChange={(event) =>
                  updateField("reproductionSteps", event.target.value)
                }
                maxLength={FEEDBACK_REPRODUCTION_MAX_LENGTH}
                placeholder={
                  "1. どの画面を開いたか\n2. 何を操作したか\n3. どうなったか"
                }
                aria-invalid={Boolean(errors.reproductionSteps)}
              />
              <strong className="feedback-field-meta">
                {form.reproductionSteps.length}/
                {FEEDBACK_REPRODUCTION_MAX_LENGTH}
              </strong>
              {errors.reproductionSteps ? (
                <span className="feedback-field-error">
                  {errors.reproductionSteps}
                </span>
              ) : null}
            </label>
          ) : null}

          <label className="feedback-field">
            <span>連絡先</span>
            <input
              type="text"
              value={form.contact}
              onChange={(event) => updateField("contact", event.target.value)}
              maxLength={FEEDBACK_CONTACT_MAX_LENGTH}
              placeholder="example@example.com / @your_id / yourname"
              aria-invalid={Boolean(errors.contact)}
            />
            <small className="feedback-field-hint">
              任意です。メールアドレス、X ID、Discord ID
              のいずれかを入力できます。
            </small>
            {errors.contact ? (
              <span className="feedback-field-error">{errors.contact}</span>
            ) : null}
          </label>

          <label className="feedback-toggle">
            <input
              type="checkbox"
              checked={form.includeDiagnostics}
              onChange={(event) =>
                updateField("includeDiagnostics", event.target.checked)
              }
            />
            <span>
              発生ページ、ブラウザ情報、画面サイズなどの利用環境を自動共有する
            </span>
          </label>
          <p className="feedback-toggle-hint">
            初期状態ではオンです。オフにすると、内容と連絡先だけを送信します。
          </p>

          <label className="feedback-honeypot" aria-hidden="true">
            <span>入力しないでください</span>
            <input
              tabIndex={-1}
              autoComplete="off"
              value={form.honeypot}
              onChange={(event) => updateField("honeypot", event.target.value)}
            />
          </label>

          <div className="feedback-form-footer">
            <div
              className={`feedback-status feedback-status-${submitState}`}
              aria-live="polite"
            >
              {statusMessage ||
                (form.includeDiagnostics
                  ? "発生ページや利用環境は送信時に自動で付与されます。"
                  : "利用環境の自動共有はオフです。")}
            </div>
            <div className="feedback-form-actions">
              <button
                className="secondary-ghost-button"
                type="button"
                onClick={handleClose}
              >
                閉じる
              </button>
              <button
                className="primary-button"
                type="submit"
                disabled={submitState === "submitting"}
              >
                {submitState === "submitting" ? "送信中..." : "送信"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
