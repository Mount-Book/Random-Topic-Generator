const FEEDBACK_WEBHOOK_ENV_KEYS = [
  "DISCORD_FEEDBACK_WEBHOOK_URL",
  "FEEDBACK_WEBHOOK_URL",
] as const;
const FEEDBACK_THREAD_NAME_ENV_KEYS = [
  "DISCORD_FEEDBACK_THREAD_NAME",
  "FEEDBACK_THREAD_NAME",
] as const;
const FEEDBACK_THREAD_ID_ENV_KEYS = [
  "DISCORD_FEEDBACK_THREAD_ID",
  "FEEDBACK_THREAD_ID",
] as const;

const MAX_MESSAGE_LENGTH = 1200;
const MAX_REPRODUCTION_LENGTH = 1200;
const MAX_CONTACT_LENGTH = 120;
const MAX_AUTHOR_NAME_LENGTH = 60;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 3;
const NG_WORDS = ["discord.gg/", "bit.ly/", "無料配布", "稼げる"];

type FeedbackBody = {
  anonymousId?: string;
  appVersion?: string;
  authorName?: string;
  contact?: string;
  honeypot?: string;
  language?: string;
  message?: string;
  pageUrl?: string;
  referrer?: string;
  reproductionSteps?: string;
  screenSize?: string;
  type?: string;
  userAgent?: string;
  userId?: string;
};

type FeedbackRequestContext = {
  body: unknown;
  headers?: Record<string, string | string[] | undefined>;
  method?: string;
  requestUrl?: string;
};

type FeedbackResponse = {
  body: { message: string };
  status: number;
};

type RateLimitEntry = {
  count: number;
  expiresAt: number;
};

type FeedbackType = "request" | "topic-submission" | "bug" | "other";

const FEEDBACK_TYPE_LABELS: Record<FeedbackType, string> = {
  request: "要望",
  "topic-submission": "全文抽出お題投稿",
  bug: "不具合",
  other: "その他",
};

const getRateLimitStore = () => {
  const globalStore = globalThis as typeof globalThis & {
    __feedbackRateLimitStore__?: Map<string, RateLimitEntry>;
  };

  if (!globalStore.__feedbackRateLimitStore__) {
    globalStore.__feedbackRateLimitStore__ = new Map();
  }

  return globalStore.__feedbackRateLimitStore__;
};

const sanitizeString = (value: unknown, maxLength: number) => {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/\r\n/g, "\n")
    .replaceAll(String.fromCharCode(0), "")
    .trim()
    .slice(0, maxLength);
};

const normalizeHeaders = (
  headers: Record<string, string | string[] | undefined> | undefined
) => {
  const normalized = new Map<string, string>();

  if (!headers) {
    return normalized;
  }

  Object.entries(headers).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      normalized.set(key.toLowerCase(), value.join(", "));
      return;
    }

    if (typeof value === "string") {
      normalized.set(key.toLowerCase(), value);
    }
  });

  return normalized;
};

const getClientIdentifier = (
  headers: Map<string, string>,
  body: FeedbackBody
) => {
  const forwardedFor = headers.get("x-forwarded-for");
  const realIp = headers.get("x-real-ip");
  const ip =
    forwardedFor?.split(",")[0]?.trim() ||
    realIp?.trim() ||
    body.anonymousId?.trim();

  return ip || "unknown";
};

const isContactValid = (value: string) => {
  if (!value) {
    return true;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const genericContactPattern = /^[^\r\n<>]{2,120}$/u;

  return (
    emailPattern.test(value) ||
    (!value.includes("://") && genericContactPattern.test(value))
  );
};

const exceedsSpamThreshold = (text: string) => {
  if (!text) {
    return false;
  }

  const lower = text.toLowerCase();
  return NG_WORDS.some((word) => lower.includes(word.toLowerCase()));
};

const isRateLimited = (identifier: string) => {
  const now = Date.now();
  const store = getRateLimitStore();

  for (const [key, value] of store.entries()) {
    if (value.expiresAt <= now) {
      store.delete(key);
    }
  }

  const existing = store.get(identifier);
  if (!existing) {
    store.set(identifier, {
      count: 1,
      expiresAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  if (existing.expiresAt <= now) {
    store.set(identifier, {
      count: 1,
      expiresAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  if (existing.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  existing.count += 1;
  return false;
};

const getWebhookUrl = () => {
  for (const key of FEEDBACK_WEBHOOK_ENV_KEYS) {
    const value = process.env[key]?.trim();
    if (value) {
      return value;
    }
  }

  return undefined;
};

const getOptionalEnvValue = (keys: readonly string[]) => {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) {
      return value;
    }
  }

  return undefined;
};

const buildDiscordPayload = (
  feedback: Required<
    Pick<FeedbackBody, "message" | "type"> &
      Partial<
        Pick<
          FeedbackBody,
          | "anonymousId"
          | "appVersion"
          | "authorName"
          | "contact"
          | "language"
          | "pageUrl"
          | "referrer"
          | "reproductionSteps"
          | "screenSize"
          | "userAgent"
          | "userId"
        >
      >
  >
) => {
  const fields = [
    ["本文", feedback.message],
    ["種別", FEEDBACK_TYPE_LABELS[feedback.type as FeedbackType]],
    [
      "作者",
      feedback.type === "topic-submission"
        ? (feedback.authorName?.trim() || "匿名")
        : undefined,
    ],
    ["連絡先", feedback.contact],
    [
      "再現手順",
      feedback.type === "bug" ? feedback.reproductionSteps : undefined,
    ],
    ["発生ページ", feedback.pageUrl],
    ["画面サイズ", feedback.screenSize],
    ["アプリバージョン", feedback.appVersion],
    ["ユーザー ID", feedback.userId],
    ["匿名識別子", feedback.anonymousId],
    ["リファラ", feedback.referrer],
    ["言語設定", feedback.language],
    ["User-Agent", feedback.userAgent],
  ]
    .filter(
      (entry): entry is [string, string] =>
        typeof entry[1] === "string" && entry[1].trim().length > 0
    )
    .map(([name, value]) => ({
      inline: false,
      name,
      value: value.slice(0, 1024),
    }));

  return {
    username: `【${FEEDBACK_TYPE_LABELS[feedback.type as FeedbackType]}】お問い合わせBot`,
    embeds: [
      {
        color: feedback.type === "bug" ? 0xe03131 : 0xf59f00,
        fields,
        timestamp: new Date().toISOString(),
        title: `サイト内フィードバック: ${FEEDBACK_TYPE_LABELS[feedback.type as FeedbackType]}`,
      },
    ],
  };
};

export const handleFeedbackRequest = async ({
  body,
  headers: rawHeaders,
  method,
}: FeedbackRequestContext): Promise<FeedbackResponse> => {
  try {
  if (method === "OPTIONS") {
    return {
      status: 204,
      body: { message: "ok" },
    };
  }

  if (method !== "POST") {
    return {
      status: 405,
      body: { message: "Method Not Allowed" },
    };
  }

  const headers = normalizeHeaders(rawHeaders);
  let parsedBody: FeedbackBody = {};

  if (typeof body === "string") {
    try {
      parsedBody = JSON.parse(body) as FeedbackBody;
    } catch {
      parsedBody = {};
    }
  } else if (typeof body === "object" && body !== null) {
    parsedBody = body as FeedbackBody;
  }

  if (sanitizeString(parsedBody.honeypot, 200)) {
    return {
      status: 400,
      body: { message: "不正なリクエストです。" },
    };
  }

  const type = sanitizeString(parsedBody.type, 32) as FeedbackType;
  const message = sanitizeString(parsedBody.message, MAX_MESSAGE_LENGTH);
  const authorName = sanitizeString(
    parsedBody.authorName,
    MAX_AUTHOR_NAME_LENGTH
  );
  const reproductionSteps = sanitizeString(
    parsedBody.reproductionSteps,
    MAX_REPRODUCTION_LENGTH
  );
  const contact = sanitizeString(parsedBody.contact, MAX_CONTACT_LENGTH);
  const pageUrl = sanitizeString(parsedBody.pageUrl, 300);
  const screenSize = sanitizeString(parsedBody.screenSize, 50);
  const appVersion = sanitizeString(parsedBody.appVersion, 50);
  const anonymousId = sanitizeString(parsedBody.anonymousId, 100);
  const userId = sanitizeString(parsedBody.userId, 100);
  const referrer = sanitizeString(parsedBody.referrer, 300);
  const language = sanitizeString(parsedBody.language, 50);
  const userAgent =
    sanitizeString(parsedBody.userAgent, 500) ||
    sanitizeString(headers.get("user-agent"), 500);

  if (!["request", "topic-submission", "bug", "other"].includes(type)) {
    return {
      status: 400,
      body: { message: "種別が不正です。" },
    };
  }

  if (!message) {
    return {
      status: 400,
      body: { message: "内容を入力してください。" },
    };
  }

  if (!isContactValid(contact)) {
    return {
      status: 400,
      body: { message: "連絡先の形式が不正です。" },
    };
  }

  if (exceedsSpamThreshold(message) || exceedsSpamThreshold(reproductionSteps)) {
    return {
      status: 400,
      body: { message: "送信内容を確認してください。" },
    };
  }

  const clientIdentifier = getClientIdentifier(headers, parsedBody);
  if (isRateLimited(clientIdentifier)) {
    return {
      status: 429,
      body: {
        message: "短時間に送信されすぎています。少し時間をおいて再度お試しください。",
      },
    };
  }

  const webhookUrl = getWebhookUrl();
  if (!webhookUrl) {
    return {
      status: 500,
      body: { message: "Webhook URL が設定されていません。" },
    };
  }

  const threadId = getOptionalEnvValue(FEEDBACK_THREAD_ID_ENV_KEYS);
  const threadName = threadId
    ? undefined
    : getOptionalEnvValue(FEEDBACK_THREAD_NAME_ENV_KEYS);

  let discordWebhookUrl: URL;

  try {
    discordWebhookUrl = new URL(webhookUrl);
  } catch {
    return {
      status: 500,
      body: { message: "Webhook URL の形式が不正です。" },
    };
  }

  if (threadId) {
    discordWebhookUrl.searchParams.set("thread_id", threadId);
  }

  const discordPayload = {
    ...buildDiscordPayload({
      anonymousId,
      appVersion,
      authorName,
      contact,
      language,
      message,
      pageUrl,
      referrer,
      reproductionSteps,
      screenSize,
      type,
      userAgent,
      userId,
    }),
    ...(threadName ? { thread_name: threadName } : {}),
  };

  const discordResponse = await fetch(discordWebhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(discordPayload),
  });

  if (!discordResponse.ok) {
    const errorText = await discordResponse.text().catch(() => "");
    const detail = [discordResponse.status.toString(), errorText.trim()]
      .filter(Boolean)
      .join(" ");

    return {
      status: 502,
      body: {
        message: detail
          ? `通知先への送信に失敗しました。Discord: ${detail}`
          : "通知先への送信に失敗しました。",
      },
    };
  }

  return {
    status: 200,
    body: {
      message: "フィードバックを送信しました。ありがとうございます。",
    },
  };
  } catch (error) {
    console.error("Feedback request failed", error);

    return {
      status: 500,
      body: {
        message:
          "サーバー側で送信処理に失敗しました。時間をおいて再度お試しください。",
      },
    };
  }
};
