import { handleFeedbackRequest } from "../server/feedback/feedbackHandler.ts";

const buildHeaders = () =>
  new Headers({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
  });

const toHeaderRecord = (headers: Headers) =>
  Object.fromEntries(headers.entries()) as Record<string, string>;

export default {
  async fetch(request: Request) {
    const body =
      request.method === "POST"
        ? await request.text().catch(() => "")
        : undefined;

    const response = await handleFeedbackRequest({
      body,
      headers: toHeaderRecord(request.headers),
      method: request.method,
      requestUrl: request.url,
    });

    return new Response(JSON.stringify(response.body), {
      status: response.status,
      headers: buildHeaders(),
    });
  },
};

export async function GET() {
  return new Response(JSON.stringify({ message: "Method Not Allowed" }), {
    status: 405,
    headers: buildHeaders(),
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: buildHeaders(),
  });
}

export async function POST(request: Request) {
  const body = await request.text().catch(() => "");
  const response = await handleFeedbackRequest({
    body,
    headers: toHeaderRecord(request.headers),
    method: request.method,
    requestUrl: request.url,
  });

  return new Response(JSON.stringify(response.body), {
    status: response.status,
    headers: buildHeaders(),
  });
}
