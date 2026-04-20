import { handleFeedbackRequest } from "../server/feedback/feedbackHandler";

export default async function handler(
  req: {
    body?: unknown;
    headers?: Record<string, string | string[] | undefined>;
    method?: string;
  },
  res: {
    setHeader: (name: string, value: string) => void;
    status: (code: number) => { json: (body: unknown) => void };
  }
) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");

  const response = await handleFeedbackRequest({
    body: req.body,
    headers: req.headers,
    method: req.method,
  });

  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.status(response.status).json(response.body);
}
