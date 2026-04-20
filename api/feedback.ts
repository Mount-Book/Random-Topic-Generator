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
  const response = await handleFeedbackRequest({
    body: req.body,
    headers: req.headers,
    method: req.method,
  });

  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.status(response.status).json(response.body);
}
