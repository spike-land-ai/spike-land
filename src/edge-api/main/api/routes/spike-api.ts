/**
 * Spike AI API — Developer-optimized endpoint.
 *
 * NOT OpenAI-compatible on purpose. Flat, minimal, no ceremony.
 *
 * POST /v1/ask    — single-turn Q&A
 * POST /v1/thread — multi-turn with server-managed history
 * POST /v1/tool   — call an MCP tool directly
 *
 * POST /v1/donate-token — donate an API key for community multiplexing
 * GET  /v1/donate-token/stats — see donated pool stats
 *
 * Auth: Bearer token (API key from /api/keys) or session cookie.
 * Credits: 1 credit per /v1/ask or /v1/thread call (business tier = unlimited).
 * Donated keys: used to serve free-tier users when platform keys are exhausted.
 */

import { Hono } from "hono";
import type { Env, Variables } from "../../core-logic/env.js";
import { createLogger } from "@spike-land-ai/shared";
import {
  parseModelSelection,
  resolveSynthesisTarget,
  synthesizeCompletion,
  streamCompletion,
  type ProviderMessage,
  PUBLIC_MODEL_ID,
  DEFAULT_PROVIDER_MODELS,
} from "../../core-logic/llm-provider.js";
import { getBalance, deductCredit } from "../../core-logic/credit-service.js";
import { resolveEffectiveTier } from "../../core-logic/tier-service.js";
import { encryptApiKey, importMasterKey, encryptToken } from "../../core-logic/token-encryption.js";
import {
  validateDonatedKey,
  isDonatedProvider,
  detectProvider,
  validateToken,
  type TokenProvider,
} from "../../core-logic/token-validation.js";

const log = createLogger("spike-api");

const spikeApi = new Hono<{ Bindings: Env; Variables: Variables }>();

// ── Model aliases for dev ergonomics ────────────────────────────────

type ModelAlias = "fast" | "smart" | "vision" | "local" | "edge";

const MODEL_ALIAS_MAP: Record<ModelAlias, { provider: string; model: string }> = {
  fast: { provider: "google", model: "gemini-3-flash-preview" },
  smart: { provider: "anthropic", model: "claude-sonnet-4-20250514" },
  vision: { provider: "openai", model: "gpt-4.1" },
  local: { provider: "ollama", model: "qwen3:8b" },
  edge: { provider: "google", model: "gemma-4-e4b" },
};

function resolveAlias(model: string | undefined): { model?: string; provider?: string } {
  if (!model) return {};
  const alias = model.toLowerCase() as ModelAlias;
  if (alias in MODEL_ALIAS_MAP) {
    return MODEL_ALIAS_MAP[alias];
  }
  return { model };
}

// ── Helpers ─────────────────────────────────────────────────────────

async function checkCredits(
  db: D1Database,
  userId: string,
): Promise<{ ok: true; tier: string } | { ok: false; error: string; status: number }> {
  const tier = await resolveEffectiveTier(db, userId);
  if (tier === "business") return { ok: true, tier };

  const { balance } = await getBalance(db, userId);
  if (balance < 1) {
    return {
      ok: false,
      error:
        "No credits remaining. Add credits at https://spike.land/pricing or donate a token to earn credits.",
      status: 402,
    };
  }
  return { ok: true, tier };
}

async function deductAfterSuccess(
  db: D1Database,
  userId: string,
  tier: string,
  description: string,
): Promise<void> {
  if (tier === "business") return;
  try {
    await deductCredit(db, userId, 1, description, crypto.randomUUID());
  } catch {
    log.error("Failed to deduct credit", { userId });
  }
}

function buildMessages(
  q: string,
  context?: string,
  system?: string,
  history?: Array<{ role: string; content: string }>,
): ProviderMessage[] {
  const msgs: ProviderMessage[] = [];

  const systemParts: string[] = [];
  if (system) systemParts.push(system);
  if (context) systemParts.push(`Context:\n${context}`);
  if (systemParts.length > 0) {
    msgs.push({ role: "system", content: systemParts.join("\n\n") });
  }

  if (history) {
    for (const h of history) {
      const role = h.role === "assistant" ? "assistant" : "user";
      msgs.push({ role, content: h.content });
    }
  }

  msgs.push({ role: "user", content: q });
  return msgs;
}

// ── POST /v1/ask — single-turn ──────────────────────────────────────

spikeApi.post("/v1/ask", async (c) => {
  const userId = c.get("userId") as string | undefined;
  if (!userId) return c.json({ error: "auth_required" }, 401);

  let body: {
    q?: string;
    context?: string;
    system?: string;
    model?: string;
    provider?: string;
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
  };
  try {
    body = (await c.req.json()) as typeof body;
  } catch {
    return c.json({ error: "invalid_json" }, 400);
  }

  const q = body.q?.trim();
  if (!q) return c.json({ error: "q is required" }, 400);

  // Credit check
  const credits = await checkCredits(c.env.DB, userId);
  if (!credits.ok) return c.json({ error: credits.error }, credits.status as 402);

  // Resolve model
  const aliased = resolveAlias(body.model);
  const modelForSelection: { model?: string; provider?: string } = {};
  const resolvedModel = aliased.model ?? body.model;
  const resolvedProvider = aliased.provider ?? body.provider;
  if (resolvedModel) modelForSelection.model = resolvedModel;
  if (resolvedProvider) modelForSelection.provider = resolvedProvider;
  const selection = parseModelSelection(modelForSelection);
  if (!selection.ok) {
    return c.json({ error: selection.message, param: selection.param }, 400);
  }

  const target = await resolveSynthesisTarget(c.env, userId, selection.value);
  if (!target) {
    return c.json(
      {
        error: "no_provider_available",
        hint: "No API keys configured. Donate a token or add one at /api/keys.",
      },
      503,
    );
  }

  const messages = buildMessages(q, body.context, body.system);

  // Streaming
  if (body.stream) {
    const res = await streamCompletion(target, messages, {
      temperature: body.temperature,
      maxTokens: body.max_tokens ?? 4096,
    });

    try {
      c.executionCtx.waitUntil(deductAfterSuccess(c.env.DB, userId, credits.tier, "v1/ask stream"));
    } catch {
      /* no executionCtx in tests */
    }

    return new Response(res.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Spike-Provider": target.provider,
        "X-Spike-Model": target.upstreamModel,
        "X-Spike-Key-Source": target.keySource,
      },
    });
  }

  // Non-streaming
  const result = await synthesizeCompletion(target, messages, {
    temperature: body.temperature,
    maxTokens: body.max_tokens ?? 4096,
  });

  await deductAfterSuccess(c.env.DB, userId, credits.tier, "v1/ask");

  return c.json({
    answer: result.content,
    model: target.upstreamModel,
    provider: target.provider,
    key_source: target.keySource,
    usage: result.usage,
  });
});

// ── POST /v1/thread — multi-turn ────────────────────────────────────

spikeApi.post("/v1/thread", async (c) => {
  const userId = c.get("userId") as string | undefined;
  if (!userId) return c.json({ error: "auth_required" }, 401);

  let body: {
    thread_id?: string;
    q?: string;
    system?: string;
    model?: string;
    provider?: string;
    temperature?: number;
    max_tokens?: number;
  };
  try {
    body = (await c.req.json()) as typeof body;
  } catch {
    return c.json({ error: "invalid_json" }, 400);
  }

  const q = body.q?.trim();
  if (!q) return c.json({ error: "q is required" }, 400);

  const credits = await checkCredits(c.env.DB, userId);
  if (!credits.ok) return c.json({ error: credits.error }, credits.status as 402);

  // Thread management — load or create
  const threadId = body.thread_id ?? crypto.randomUUID();
  let history: Array<{ role: string; content: string }> = [];

  try {
    const rows = await c.env.DB.prepare(
      "SELECT role, content FROM spike_api_threads WHERE thread_id = ? AND user_id = ? ORDER BY seq ASC",
    )
      .bind(threadId, userId)
      .all<{ role: string; content: string }>();
    history = rows.results ?? [];
  } catch {
    // Table may not exist yet — proceed with empty history
  }

  const aliased = resolveAlias(body.model);
  const modelForSelection: { model?: string; provider?: string } = {};
  const resolvedModel = aliased.model ?? body.model;
  const resolvedProvider = aliased.provider ?? body.provider;
  if (resolvedModel) modelForSelection.model = resolvedModel;
  if (resolvedProvider) modelForSelection.provider = resolvedProvider;
  const selection = parseModelSelection(modelForSelection);
  if (!selection.ok) {
    return c.json({ error: selection.message, param: selection.param }, 400);
  }

  const target = await resolveSynthesisTarget(c.env, userId, selection.value);
  if (!target) {
    return c.json({ error: "no_provider_available" }, 503);
  }

  const messages = buildMessages(q, undefined, body.system, history);

  const result = await synthesizeCompletion(target, messages, {
    temperature: body.temperature,
    maxTokens: body.max_tokens ?? 4096,
  });

  // Persist conversation turns
  const seq = history.length;
  try {
    await c.env.DB.batch([
      c.env.DB.prepare(
        "INSERT INTO spike_api_threads (thread_id, user_id, seq, role, content, created_at) VALUES (?, ?, ?, 'user', ?, ?)",
      ).bind(threadId, userId, seq, q, Date.now()),
      c.env.DB.prepare(
        "INSERT INTO spike_api_threads (thread_id, user_id, seq, role, content, created_at) VALUES (?, ?, ?, 'assistant', ?, ?)",
      ).bind(threadId, userId, seq + 1, result.content, Date.now()),
    ]);
  } catch {
    // Table may not exist — non-fatal
    log.error("Failed to persist thread turn", { threadId });
  }

  await deductAfterSuccess(c.env.DB, userId, credits.tier, "v1/thread");

  return c.json({
    thread_id: threadId,
    answer: result.content,
    turn: Math.floor(seq / 2) + 1,
    model: target.upstreamModel,
    provider: target.provider,
    usage: result.usage,
  });
});

// ── POST /v1/tool — MCP tool call ───────────────────────────────────

spikeApi.post("/v1/tool", async (c) => {
  const userId = c.get("userId") as string | undefined;
  if (!userId) return c.json({ error: "auth_required" }, 401);

  let body: { name?: string; args?: Record<string, unknown> };
  try {
    body = (await c.req.json()) as typeof body;
  } catch {
    return c.json({ error: "invalid_json" }, 400);
  }

  const name = body.name?.trim();
  if (!name) return c.json({ error: "name is required" }, 400);

  const rpcBody = JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: { name, arguments: body.args ?? {} },
  });

  const resp = await c.env.MCP_SERVICE.fetch(
    new Request("https://mcp.spike.land/rpc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: rpcBody,
    }),
  );

  if (!resp.ok) {
    return c.json({ error: "tool_call_failed", status: resp.status }, 502);
  }

  const result = await resp.json<{
    result?: { content?: Array<{ text?: string; type?: string }> };
    error?: { message?: string; code?: number };
  }>();

  if (result?.error) {
    return c.json(
      {
        error: "tool_error",
        message: result.error.message,
        code: result.error.code,
      },
      422,
    );
  }

  return c.json({
    tool: name,
    output: result?.result?.content ?? [],
  });
});

// ── POST /v1/donate-token — community API key donation ──────────────
//
// Security hardening (Phase 1):
//   1. Key is validated against the upstream provider before acceptance
//      — prevents credit farming with garbage keys (OWASP A04:2021)
//   2. Key is AES-256-GCM encrypted before writing to D1
//      — a DB dump cannot expose plaintext keys (OWASP A02:2021)
//   3. TOKEN_ENCRYPTION_KEY is required; missing secret = hard failure
//   4. The raw key is NEVER logged at any point in this handler

spikeApi.post("/v1/donate-token", async (c) => {
  const userId = c.get("userId") as string | undefined;
  if (!userId) return c.json({ error: "auth_required" }, 401);

  // Prefer TOKEN_BANK_KEY (base64 master key); fall back to TOKEN_ENCRYPTION_KEY
  // for backwards compatibility with existing encrypted rows.
  const env = c.env as unknown as Record<string, string | undefined>;
  const tokenBankKey = env["TOKEN_BANK_KEY"];
  const encryptionSecret = tokenBankKey ?? env["TOKEN_ENCRYPTION_KEY"];
  if (!encryptionSecret) {
    log.error("TOKEN_BANK_KEY is not configured — donate-token disabled");
    return c.json({ error: "service_unavailable" }, 503);
  }

  let body: { provider?: string; api_key?: string };
  try {
    body = (await c.req.json()) as typeof body;
  } catch {
    return c.json({ error: "invalid_json" }, 400);
  }

  const apiKey = body.api_key?.trim();
  if (!apiKey) {
    return c.json({ error: "api_key is required" }, 400);
  }

  // Auto-detect provider from key prefix if not supplied
  let provider: string | null = body.provider?.trim().toLowerCase() ?? null;
  if (!provider) {
    provider = detectProvider(apiKey) as TokenProvider | null;
  }

  if (!provider) {
    return c.json(
      {
        error: "unknown_provider",
        message:
          "Could not detect provider from key prefix. Pass provider explicitly: openai, anthropic, google, xai, deepseek, or mistral.",
      },
      400,
    );
  }

  const validProviders: readonly string[] = [
    "openai",
    "anthropic",
    "google",
    "xai",
    "deepseek",
    "mistral",
  ];
  if (!validProviders.includes(provider)) {
    return c.json({ error: `provider must be one of: ${validProviders.join(", ")}` }, 400);
  }

  // ── Step 1: SHA-256 hash for duplicate detection ─────────────────────
  // We never store the plaintext key or query by it. Instead we store a
  // SHA-256 hash (hex) of the key so we can detect if the same key is
  // donated twice, without ever revealing the key itself.
  const keyHashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(apiKey));
  const keyHash = Array.from(new Uint8Array(keyHashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Check for duplicate before hitting the provider
  try {
    const existing = await c.env.DB.prepare(
      "SELECT id FROM donated_tokens WHERE provider = ? AND key_hash = ? LIMIT 1",
    )
      .bind(provider, keyHash)
      .first<{ id: string }>();

    if (existing) {
      return c.json({ error: "duplicate_key", message: "This key is already in the pool." }, 409);
    }
  } catch {
    // key_hash column may not exist yet (pre-migration) — proceed without check
  }

  // ── Step 2: Validate the key against the upstream provider ──────────
  const validation = isDonatedProvider(provider)
    ? await validateDonatedKey(provider, apiKey)
    : await validateToken(apiKey, provider as TokenProvider);

  const validationValid = validation.valid;
  const validationError = validation.error;

  if (!validationValid) {
    if (validationError === "network_error") {
      return c.json(
        {
          error: "validation_unavailable",
          message: "Could not reach the provider to validate your key. Please try again shortly.",
        },
        503,
      );
    }
    return c.json(
      {
        error: "invalid_key",
        message: "The API key was rejected by the provider. Please check the key and try again.",
      },
      422,
    );
  }

  // ── Step 3: Encrypt the key before writing to D1 ────────────────────
  let encryptedKey: string;
  try {
    if (tokenBankKey) {
      const masterKey = await importMasterKey(tokenBankKey);
      encryptedKey = await encryptToken(apiKey, masterKey);
    } else {
      encryptedKey = await encryptApiKey(apiKey, encryptionSecret);
    }
  } catch (err) {
    log.error("Failed to encrypt donated key", { provider, error: String(err) });
    return c.json({ error: "internal_error" }, 500);
  }

  // ── Step 4: Persist the encrypted key ───────────────────────────────
  const id = crypto.randomUUID();
  const now = Date.now();

  try {
    await c.env.DB.prepare(
      `INSERT INTO donated_tokens
         (id, donor_user_id, provider, encrypted_key, key_hash, donated_at, active, total_calls)
       VALUES (?, ?, ?, ?, ?, ?, 1, 0)`,
    )
      .bind(id, userId, provider, encryptedKey, keyHash, now)
      .run();
  } catch {
    // Fall back to insert without key_hash if the column doesn't exist yet
    try {
      await c.env.DB.prepare(
        `INSERT INTO donated_tokens
           (id, donor_user_id, provider, encrypted_key, donated_at, active, total_calls)
         VALUES (?, ?, ?, ?, ?, 1, 0)`,
      )
        .bind(id, userId, provider, encryptedKey, now)
        .run();
    } catch {
      return c.json({ error: "Failed to store token. Table may not be set up yet." }, 500);
    }
  }

  // ── Step 5: Reward donor with credits ───────────────────────────────
  try {
    await c.env.DB.prepare(
      `INSERT INTO user_credits (id, user_id, amount, reason, created_at)
       VALUES (?, ?, 10, 'Donated API key', datetime('now'))`,
    )
      .bind(crypto.randomUUID(), userId)
      .run();
  } catch {
    // Intentionally non-fatal
  }

  return c.json({
    donated: true,
    provider,
    credits_earned: 10,
    message: "Thank you! Your key will be used to serve the community. You earned 10 credits.",
  });
});

// ── GET /v1/donate-token/stats — pool stats ─────────────────────────

spikeApi.get("/v1/donate-token/stats", async (c) => {
  try {
    const stats = await c.env.DB.prepare(
      `SELECT provider, COUNT(*) as count, SUM(total_calls) as total_calls
       FROM donated_tokens WHERE active = 1 GROUP BY provider`,
    ).all<{ provider: string; count: number; total_calls: number }>();

    const donors = await c.env.DB.prepare(
      "SELECT COUNT(DISTINCT donor_user_id) as count FROM donated_tokens WHERE active = 1",
    ).first<{ count: number }>();

    return c.json({
      pool: stats.results ?? [],
      total_donors: donors?.count ?? 0,
      message: "Spike runs on donated API keys from the community. Every key helps.",
    });
  } catch {
    return c.json({
      pool: [],
      total_donors: 0,
      message: "Token pool not yet initialized.",
    });
  }
});

// ── GET /v1/models — list available models ──────────────────────────

spikeApi.get("/v1/models", (c) => {
  return c.json({
    aliases: {
      fast: { provider: "google", model: "gemini-2.5-flash", description: "Fastest, cheapest" },
      smart: {
        provider: "anthropic",
        model: "claude-sonnet-4-20250514",
        description: "Best reasoning",
      },
      vision: { provider: "openai", model: "gpt-4.1", description: "Best for images and code" },
      local: { provider: "ollama", model: "qwen3:8b", description: "Runs on your machine" },
    },
    default: PUBLIC_MODEL_ID,
    providers: DEFAULT_PROVIDER_MODELS,
    pricing: {
      note: "1 credit per request. Free tier: 50/day. Pro: 500/day. Business: unlimited.",
      donate: "POST /v1/donate-token with your API key to earn 10 credits and help the community.",
    },
  });
});

// ── GET /v1/ping — health check ─────────────────────────────────────

spikeApi.get("/v1/ping", (c) => {
  return c.json({ ok: true, ts: Date.now() });
});

export { spikeApi };
