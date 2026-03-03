import { Hono } from "hono";
import type { Env } from "../env.js";

const proxy = new Hono<{ Bindings: Env }>();

interface ProxyRequestBody {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
}

function validateProxyBody(body: unknown): body is ProxyRequestBody {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  return typeof b.url === "string" && b.url.length > 0;
}

// S4: Explicit allowlist of headers callers may set. Never let callers override
// security-sensitive headers like Authorization, Host, or Cookie.
const ALLOWED_CALLER_HEADERS = new Set([
  "accept",
  "accept-language",
  "content-type",
  "x-request-id",
]);

function sanitizeCallerHeaders(
  raw: Record<string, string> | undefined,
): Record<string, string> {
  if (!raw) return {};
  const safe: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (ALLOWED_CALLER_HEADERS.has(key.toLowerCase())) {
      safe[key] = value;
    }
  }
  return safe;
}

const AI_PROVIDERS: Array<{ prefix: string; envKey: keyof Env; headerName: string }> = [
  { prefix: "https://api.anthropic.com/", envKey: "CLAUDE_OAUTH_TOKEN", headerName: "x-api-key" },
  { prefix: "https://generativelanguage.googleapis.com/", envKey: "GEMINI_API_KEY", headerName: "Authorization" },
];

proxy.post("/proxy/stripe", async (c) => {
  const body = await c.req.json<unknown>();
  if (!validateProxyBody(body)) {
    return c.json({ error: "Invalid request body: url is required" }, 400);
  }

  if (!body.url.startsWith("https://api.stripe.com/")) {
    return c.json({ error: "Invalid Stripe API URL" }, 400);
  }

  const response = await fetch(body.url, {
    method: body.method ?? "POST",
    headers: {
      ...sanitizeCallerHeaders(body.headers),
      Authorization: `Bearer ${c.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.body ? JSON.stringify(body.body) : undefined,
  });

  return new Response(response.body, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") ?? "application/json",
    },
  });
});

proxy.post("/proxy/ai", async (c) => {
  const body = await c.req.json<unknown>();
  if (!validateProxyBody(body)) {
    return c.json({ error: "Invalid request body: url is required" }, 400);
  }

  const provider = AI_PROVIDERS.find((p) => body.url.startsWith(p.prefix));
  if (!provider) {
    return c.json({ error: "Invalid AI API URL" }, 400);
  }

  const apiKey = c.env[provider.envKey] as string;
  if (!apiKey) {
    return c.json({ error: "AI provider not configured" }, 503);
  }

  // Anthropic uses x-api-key header; Gemini uses Bearer token
  const authHeaders: Record<string, string> =
    provider.headerName === "x-api-key"
      ? { "x-api-key": apiKey }
      : { Authorization: `Bearer ${apiKey}` };

  const response = await fetch(body.url, {
    method: body.method ?? "POST",
    headers: {
      ...sanitizeCallerHeaders(body.headers),
      ...authHeaders,
      "Content-Type": "application/json",
    },
    body: body.body ? JSON.stringify(body.body) : undefined,
  });

  return new Response(response.body, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") ?? "application/json",
    },
  });
});

proxy.post("/proxy/github", async (c) => {
  const body = await c.req.json<unknown>();
  if (!validateProxyBody(body)) {
    return c.json({ error: "Invalid request body: url is required" }, 400);
  }

  if (!body.url.startsWith("https://api.github.com/")) {
    return c.json({ error: "Invalid GitHub API URL" }, 400);
  }

  const response = await fetch(body.url, {
    method: body.method ?? "GET",
    headers: {
      ...sanitizeCallerHeaders(body.headers),
      Authorization: `Bearer ${c.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "spike-edge",
    },
    body: body.body ? JSON.stringify(body.body) : undefined,
  });

  return new Response(response.body, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") ?? "application/json",
    },
  });
});

export { proxy };
