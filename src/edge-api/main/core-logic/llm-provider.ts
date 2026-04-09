/**
 * Shared LLM provider resolution and synthesis.
 * Extracted from openai-compatible.ts to enable spike-chat and other routes
 * to use the same BYOK + multi-provider logic.
 */

import { createLogger } from "@spike-land-ai/shared";
import { resolveByokKey, type ByokProvider } from "./byok.js";
import type { Env } from "./env.js";

const log = createLogger("llm-provider");

// ── Types ──────────────────────────────────────────────────────────────

export type ProviderId = "openai" | "anthropic" | "google" | "xai" | "ollama";
export type ProviderSelection = ProviderId | "auto";

export interface ProviderMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ParsedModelSelection {
  publicModel: string;
  provider: ProviderSelection;
  upstreamModel: string | undefined;
}

export interface ResolvedSynthesisTarget {
  provider: ProviderId;
  upstreamModel: string;
  apiKey: string;
  keySource: "byok" | "platform" | "community";
  /** Set when keySource is "community" — used for usage tracking */
  communityTokenId?: string;
}

export interface UsageShape {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

interface OpenAiCompatibleResponse {
  choices?: Array<{ message?: { content?: string | null } }>;
  usage?: UsageShape;
}

interface AnthropicResponse {
  content?: Array<{ type?: string; text?: string }>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
}

interface GoogleResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
}

// ── Constants ──────────────────────────────────────────────────────────

export const PUBLIC_MODEL_ID = "spike-agent-v1";

export const DEFAULT_PROVIDER_MODELS: Record<ProviderId, string> = {
  openai: "gpt-4.1",
  anthropic: "claude-sonnet-4-20250514",
  google: "gemini-3-flash-preview",
  xai: "grok-4.20-0309-reasoning",
  ollama: "qwen3:8b",
};

export const GOOGLE_FALLBACK_MODEL = "gemma-4-e4b";

export const AUTO_BYOK_PRIORITY: ByokProvider[] = ["openai", "anthropic", "google"];
export const AUTO_PLATFORM_PRIORITY: ProviderId[] = ["anthropic", "google", "openai", "xai"]; // ollama excluded from auto: local-only

// ── Provider name / model inference ────────────────────────────────────

export function normalizeProviderName(value: string): ProviderId | undefined {
  const normalized = value.trim().toLowerCase();
  if (normalized === "openai") return "openai";
  if (normalized === "anthropic") return "anthropic";
  if (normalized === "google" || normalized === "gemini") return "google";
  if (normalized === "xai" || normalized === "grok") return "xai";
  if (normalized === "ollama" || normalized === "crystalline") return "ollama";
  return undefined;
}

export function inferProviderFromRawModel(model: string): ProviderId | undefined {
  const normalized = model.trim().toLowerCase();
  if (
    /^(gpt|o1|o3|o4|o5|chatgpt|codex|computer-use|gpt-oss)/.test(normalized) ||
    normalized.includes("openai")
  ) {
    return "openai";
  }
  if (normalized.startsWith("claude") || normalized.includes("anthropic")) return "anthropic";
  if (
    normalized.startsWith("gemini") ||
    normalized.startsWith("gemma") ||
    normalized.includes("google")
  )
    return "google";
  if (normalized.startsWith("grok") || normalized.includes("xai")) return "xai";
  if (
    normalized.startsWith("ollama") ||
    normalized.startsWith("crystalline") ||
    normalized.startsWith("qwen")
  )
    return "ollama";
  return undefined;
}

// ── Model selection parsing ────────────────────────────────────────────

export function parseModelSelection(body: {
  model?: string;
  provider?: string;
}):
  | { ok: true; value: ParsedModelSelection }
  | { ok: false; message: string; param?: string; code?: string } {
  const publicModel = (typeof body.model === "string" ? body.model.trim() : "") || PUBLIC_MODEL_ID;
  const providerHint =
    typeof body.provider === "string" && body.provider.trim()
      ? normalizeProviderName(body.provider)
      : undefined;

  if (typeof body.provider === "string" && body.provider.trim() && !providerHint) {
    return {
      ok: false,
      message: `Unsupported provider "${body.provider}".`,
      param: "provider",
      code: "provider_not_supported",
    };
  }

  if (publicModel === PUBLIC_MODEL_ID) {
    if (providerHint) {
      return {
        ok: true,
        value: {
          publicModel,
          provider: providerHint,
          upstreamModel: DEFAULT_PROVIDER_MODELS[providerHint],
        },
      };
    }
    return {
      ok: true,
      value: { publicModel, provider: "auto", upstreamModel: undefined },
    };
  }

  if (publicModel.includes("/")) {
    const slashIndex = publicModel.indexOf("/");
    const prefix = publicModel.slice(0, slashIndex);
    const normalizedProvider = normalizeProviderName(prefix);
    if (!normalizedProvider) {
      return {
        ok: false,
        message: `Unsupported model "${publicModel}".`,
        param: "model",
        code: "model_not_found",
      };
    }
    if (providerHint && providerHint !== normalizedProvider) {
      return {
        ok: false,
        message: `provider "${body.provider}" does not match model "${publicModel}".`,
        param: "provider",
        code: "provider_model_mismatch",
      };
    }
    const suffix = publicModel.slice(slashIndex + 1).trim();
    return {
      ok: true,
      value: {
        publicModel,
        provider: normalizedProvider,
        upstreamModel: suffix || DEFAULT_PROVIDER_MODELS[normalizedProvider],
      },
    };
  }

  if (providerHint) {
    const inferred = inferProviderFromRawModel(publicModel);
    if (inferred && inferred !== providerHint) {
      return {
        ok: false,
        message: `provider "${body.provider}" does not match model "${publicModel}".`,
        param: "provider",
        code: "provider_model_mismatch",
      };
    }
    return {
      ok: true,
      value: { publicModel, provider: providerHint, upstreamModel: publicModel },
    };
  }

  const inferred = inferProviderFromRawModel(publicModel);
  if (!inferred) {
    return {
      ok: false,
      message: `Unsupported model "${publicModel}". Use "${PUBLIC_MODEL_ID}" or a provider model like "openai/gpt-4.1".`,
      param: "model",
      code: "model_not_found",
    };
  }

  return {
    ok: true,
    value: { publicModel, provider: inferred, upstreamModel: publicModel },
  };
}

// ── Key resolution ─────────────────────────────────────────────────────

export function getPlatformKey(env: Env, provider: ProviderId): string | null {
  if (provider === "openai") return env.OPENAI_API_KEY ?? null;
  if (provider === "anthropic")
    return env.CLAUDE_CODE_OAUTH_TOKEN ?? env.CLAUDE_OAUTH_TOKEN ?? null;
  if (provider === "google") return env.GEMINI_API_KEY ?? null;
  if (provider === "ollama") return "ollama-local"; // No key needed for local Ollama
  return env.XAI_API_KEY ?? null;
}

export async function resolveExplicitSynthesisTarget(
  env: Env,
  userId: string | undefined,
  provider: ProviderId,
  upstreamModel: string,
): Promise<ResolvedSynthesisTarget | null> {
  if (provider !== "xai" && userId) {
    const byokKey = await resolveByokKey(
      env.MCP_SERVICE,
      userId,
      provider as ByokProvider,
      env.MCP_INTERNAL_SECRET,
    );
    if (byokKey) {
      return { provider, upstreamModel, apiKey: byokKey, keySource: "byok" };
    }
  }

  const platformKey = getPlatformKey(env, provider);
  if (!platformKey) return null;

  return { provider, upstreamModel, apiKey: platformKey, keySource: "platform" };
}

export async function resolveAutoSynthesisTarget(
  env: Env,
  userId: string | undefined,
): Promise<ResolvedSynthesisTarget | null> {
  // 1. BYOK (user's own keys) — highest priority
  if (userId) {
    const byokResults = await Promise.all(
      AUTO_BYOK_PRIORITY.map(async (provider) => ({
        provider,
        key: await resolveByokKey(env.MCP_SERVICE, userId, provider, env.MCP_INTERNAL_SECRET),
      })),
    );

    const match = byokResults.find((entry) => entry.key);
    if (match?.key) {
      return {
        provider: match.provider,
        upstreamModel: DEFAULT_PROVIDER_MODELS[match.provider],
        apiKey: match.key,
        keySource: "byok",
      };
    }
  }

  // 2. Community pool (donated tokens) — round-robin by least-recently-used
  for (const provider of AUTO_PLATFORM_PRIORITY) {
    const community = await resolveCommunityToken(env.DB, provider);
    if (community) {
      return {
        provider,
        upstreamModel: DEFAULT_PROVIDER_MODELS[provider],
        apiKey: community.apiKey,
        keySource: "community",
        communityTokenId: community.tokenId,
      };
    }
  }

  // 3. Platform keys — fallback (CLAUDE_OAUTH_TOKEN, GEMINI_API_KEY, etc.)
  for (const provider of AUTO_PLATFORM_PRIORITY) {
    const platformKey = getPlatformKey(env, provider);
    if (platformKey) {
      return {
        provider,
        upstreamModel: DEFAULT_PROVIDER_MODELS[provider],
        apiKey: platformKey,
        keySource: "platform",
      };
    }
  }

  return null;
}

export async function resolveSynthesisTarget(
  env: Env,
  userId: string | undefined,
  selection: ParsedModelSelection,
): Promise<ResolvedSynthesisTarget | null> {
  if (selection.provider === "auto") {
    return resolveAutoSynthesisTarget(env, userId);
  }
  return resolveExplicitSynthesisTarget(
    env,
    userId,
    selection.provider,
    selection.upstreamModel ?? DEFAULT_PROVIDER_MODELS[selection.provider],
  );
}

/** Resolve all available targets in priority order (for fallback). */
export async function resolveAllPlatformTargets(
  env: Env,
  userId: string | undefined,
): Promise<ResolvedSynthesisTarget[]> {
  const targets: ResolvedSynthesisTarget[] = [];

  // 1. BYOK first
  if (userId) {
    const byokResults = await Promise.all(
      AUTO_BYOK_PRIORITY.map(async (provider) => ({
        provider,
        key: await resolveByokKey(env.MCP_SERVICE, userId, provider, env.MCP_INTERNAL_SECRET),
      })),
    );
    for (const entry of byokResults) {
      if (entry.key) {
        targets.push({
          provider: entry.provider,
          upstreamModel: DEFAULT_PROVIDER_MODELS[entry.provider],
          apiKey: entry.key,
          keySource: "byok",
        });
      }
    }
  }

  // 2. Community pool tokens
  const communityTargets = await resolveCommunityTokensForProviders(env.DB, AUTO_PLATFORM_PRIORITY);
  for (const ct of communityTargets) {
    if (!targets.some((t) => t.provider === ct.provider)) {
      targets.push(ct);
    }
  }

  // 3. Platform keys as final fallback
  for (const provider of AUTO_PLATFORM_PRIORITY) {
    const platformKey = getPlatformKey(env, provider);
    if (platformKey && !targets.some((t) => t.provider === provider)) {
      targets.push({
        provider,
        upstreamModel: DEFAULT_PROVIDER_MODELS[provider],
        apiKey: platformKey,
        keySource: "platform",
      });
    }
  }

  return targets;
}

// ── Community token pool (donated keys) ───────────────────────────

interface DonatedTokenRow {
  id: string;
  provider: string;
  encrypted_key: string;
}

/**
 * Fetch the least-recently-used active community token for a given provider.
 * Returns null if no donated tokens are available.
 */
export async function resolveCommunityToken(
  db: D1Database,
  provider: ProviderId,
): Promise<{ tokenId: string; apiKey: string } | null> {
  try {
    const row = await db
      .prepare(
        `SELECT id, encrypted_key FROM donated_tokens
         WHERE provider = ? AND active = 1
         ORDER BY COALESCE(last_used_at, 0) ASC, total_calls ASC
         LIMIT 1`,
      )
      .bind(provider)
      .first<DonatedTokenRow>();

    if (!row) return null;
    return { tokenId: row.id, apiKey: row.encrypted_key };
  } catch {
    return null;
  }
}

/**
 * Fetch all active community tokens for given providers, least-recently-used first.
 */
export async function resolveCommunityTokensForProviders(
  db: D1Database,
  providers: readonly ProviderId[],
): Promise<ResolvedSynthesisTarget[]> {
  const targets: ResolvedSynthesisTarget[] = [];

  for (const provider of providers) {
    const token = await resolveCommunityToken(db, provider);
    if (token) {
      targets.push({
        provider,
        upstreamModel: DEFAULT_PROVIDER_MODELS[provider],
        apiKey: token.apiKey,
        keySource: "community",
        communityTokenId: token.tokenId,
      });
    }
  }

  return targets;
}

/**
 * Record usage of a community token after an LLM call attempt.
 */
export async function recordCommunityTokenUsage(
  db: D1Database,
  tokenId: string,
  success: boolean,
  error?: string,
): Promise<void> {
  try {
    if (success) {
      await db
        .prepare(
          `UPDATE donated_tokens
           SET total_calls = total_calls + 1, last_used_at = ?, last_error = NULL
           WHERE id = ?`,
        )
        .bind(Date.now(), tokenId)
        .run();
    } else {
      await db
        .prepare(
          `UPDATE donated_tokens
           SET last_error = ?, last_used_at = ?
           WHERE id = ?`,
        )
        .bind(error ?? "unknown error", Date.now(), tokenId)
        .run();
    }
  } catch {
    // Non-fatal — don't break the request over tracking
  }
}

// ── Provider call functions ────────────────────────────────────────────

function compactUsage(values: {
  prompt_tokens: number | undefined;
  completion_tokens: number | undefined;
  total_tokens: number | undefined;
}): UsageShape | undefined {
  const { prompt_tokens, completion_tokens, total_tokens } = values;
  if (
    prompt_tokens === undefined &&
    completion_tokens === undefined &&
    total_tokens === undefined
  ) {
    return undefined;
  }
  const usage: UsageShape = {};
  if (prompt_tokens !== undefined) usage.prompt_tokens = prompt_tokens;
  if (completion_tokens !== undefined) usage.completion_tokens = completion_tokens;
  if (total_tokens !== undefined) usage.total_tokens = total_tokens;
  return usage;
}

export async function callOpenAiStyleProvider(
  endpoint: string,
  apiKey: string,
  model: string,
  messages: ProviderMessage[],
  options: {
    temperature?: number | undefined;
    maxTokens?: number | undefined;
    stream?: boolean | undefined;
  },
): Promise<{ content: string; usage: UsageShape | undefined; rawResponse?: Response }> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxTokens ?? 768,
      stream: options.stream ?? false,
    }),
  });

  if (!res.ok) {
    throw new Error(`Synthesis provider request failed with status ${res.status}.`);
  }

  if (options.stream) {
    return { content: "", usage: undefined, rawResponse: res };
  }

  const data = await res.json<OpenAiCompatibleResponse>();
  return {
    content: data.choices?.[0]?.message?.content ?? "",
    usage: data.usage,
  };
}

export async function callAnthropicProvider(
  apiKey: string,
  model: string,
  messages: ProviderMessage[],
  options: { temperature?: number | undefined; maxTokens?: number | undefined },
): Promise<{ content: string; usage: UsageShape | undefined }> {
  const system = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n")
    .trim();
  const nonSystemMessages = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role, content: m.content }));

  // OAuth tokens (sk-ant-oat01-*) go through Cloudflare AI Gateway with Bearer auth;
  // standard API keys go directly to api.anthropic.com with x-api-key.
  const isOAuth = apiKey.startsWith("sk-ant-oat01-");
  const endpoint = isOAuth
    ? "https://gateway.ai.cloudflare.com/v1/1f98921051196545ebe79a450d3c71ed/z1/anthropic/v1/messages"
    : "https://api.anthropic.com/v1/messages";
  const headers: Record<string, string> = isOAuth
    ? {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "anthropic-version": "2023-06-01",
        "anthropic-beta":
          "claude-code-20250219,oauth-2025-04-20,fine-grained-tool-streaming-2025-05-14",
        "user-agent": "claude-cli/2.1.42 (external, cli)",
        "x-app": "cli",
      }
    : {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      };

  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      max_tokens: options.maxTokens ?? 768,
      temperature: options.temperature ?? 0.2,
      ...(system ? { system } : {}),
      messages: nonSystemMessages,
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic synthesis request failed with status ${res.status}.`);
  }

  const data = await res.json<AnthropicResponse>();
  const content = (data.content ?? [])
    .map((entry) => (entry.type === "text" ? (entry.text ?? "") : ""))
    .join("");

  const anthropicUsage = data.usage;
  return {
    content,
    usage: anthropicUsage
      ? compactUsage({
          prompt_tokens: anthropicUsage.input_tokens,
          completion_tokens: anthropicUsage.output_tokens,
          total_tokens:
            anthropicUsage.input_tokens !== undefined || anthropicUsage.output_tokens !== undefined
              ? (anthropicUsage.input_tokens ?? 0) + (anthropicUsage.output_tokens ?? 0)
              : undefined,
        })
      : undefined,
  };
}

export async function callGoogleProvider(
  apiKey: string,
  model: string,
  messages: ProviderMessage[],
  options: { temperature?: number | undefined; maxTokens?: number | undefined },
): Promise<{ content: string; usage: UsageShape | undefined }> {
  const system = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n")
    .trim();
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
        contents,
        generationConfig: {
          temperature: options.temperature ?? 0.2,
          maxOutputTokens: options.maxTokens ?? 768,
        },
      }),
    },
  );

  if (!res.ok) {
    throw new Error(`Google synthesis request failed with status ${res.status}.`);
  }

  const data = await res.json<GoogleResponse>();
  const content =
    data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .filter(Boolean)
      .join("") ?? "";

  return {
    content,
    usage: data.usageMetadata
      ? compactUsage({
          prompt_tokens: data.usageMetadata.promptTokenCount,
          completion_tokens: data.usageMetadata.candidatesTokenCount,
          total_tokens: data.usageMetadata.totalTokenCount,
        })
      : undefined,
  };
}

// ── Synthesis dispatch ─────────────────────────────────────────────────

export async function synthesizeCompletion(
  target: ResolvedSynthesisTarget,
  messages: ProviderMessage[],
  options: { temperature?: number | undefined; maxTokens?: number | undefined },
): Promise<{ content: string; usage: UsageShape | undefined }> {
  if (target.provider === "openai") {
    return callOpenAiStyleProvider(
      "https://api.openai.com/v1/chat/completions",
      target.apiKey,
      target.upstreamModel,
      messages,
      options,
    );
  }

  if (target.provider === "anthropic") {
    return callAnthropicProvider(target.apiKey, target.upstreamModel, messages, options);
  }

  if (target.provider === "google") {
    return callGoogleProvider(target.apiKey, target.upstreamModel, messages, options);
  }

  if (target.provider === "ollama") {
    // Crystalline proxy at :11435 (context-enriched) or raw Ollama at :11434
    const ollamaEndpoint = "http://localhost:11435/v1/chat/completions";
    return callOpenAiStyleProvider(
      ollamaEndpoint,
      target.apiKey,
      target.upstreamModel,
      messages,
      options,
    );
  }

  // xai (default) — OpenAI-compatible
  return callOpenAiStyleProvider(
    "https://api.x.ai/v1/chat/completions",
    target.apiKey,
    target.upstreamModel,
    messages,
    options,
  );
}

/**
 * Stream a completion from the resolved provider.
 * For OpenAI/xAI: returns the raw streaming response (already OpenAI SSE format).
 * For Anthropic/Google: calls non-streaming, wraps in synthetic OpenAI-format SSE.
 */
export async function streamCompletion(
  target: ResolvedSynthesisTarget,
  messages: ProviderMessage[],
  options: {
    temperature?: number | undefined;
    maxTokens?: number | undefined;
    tools?: unknown[] | undefined;
  },
): Promise<Response> {
  // OpenAI/xAI/Ollama support native streaming
  if (target.provider === "openai" || target.provider === "xai" || target.provider === "ollama") {
    const OPENAI_COMPAT_ENDPOINTS: Record<string, string> = {
      openai: "https://api.openai.com/v1/chat/completions",
      xai: "https://api.x.ai/v1/chat/completions",
      ollama: "http://localhost:11435/v1/chat/completions",
    };
    const endpoint = OPENAI_COMPAT_ENDPOINTS[target.provider];
    if (!endpoint) throw new Error(`No endpoint configured for provider: ${target.provider}`);

    const body: Record<string, unknown> = {
      model: target.upstreamModel,
      messages,
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxTokens ?? 4096,
      stream: true,
    };
    if (options.tools && options.tools.length > 0) {
      body["tools"] = options.tools;
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${target.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`AI service error (${res.status}): ${errText.slice(0, 200)}`);
    }

    return res;
  }

  // Anthropic/Google: non-streaming call, wrap in synthetic SSE
  const result =
    target.provider === "anthropic"
      ? await callAnthropicProvider(target.apiKey, target.upstreamModel, messages, options)
      : await callGoogleProvider(target.apiKey, target.upstreamModel, messages, options);

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // Emit a single content chunk in OpenAI SSE format
      const chunk = {
        choices: [
          {
            delta: { content: result.content },
            finish_reason: null,
          },
        ],
      };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));

      // Emit stop
      const stopChunk = {
        choices: [{ delta: {}, finish_reason: "stop" }],
      };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(stopChunk)}\n\n`));
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream" },
  });
}

/**
 * Stream a completion with automatic fallback to the next provider on failure.
 * Tries each target in order; returns the first successful streaming response.
 * If all targets fail, throws the last error.
 */
export async function streamCompletionWithFallback(
  targets: ResolvedSynthesisTarget[],
  messages: ProviderMessage[],
  options: {
    temperature?: number | undefined;
    maxTokens?: number | undefined;
    tools?: unknown[] | undefined;
  },
  db?: D1Database,
): Promise<{ response: Response; usedTarget: ResolvedSynthesisTarget }> {
  let lastError: Error | undefined;

  // Expand targets: for each Google target using the primary model, inject a
  // Gemma 4 fallback immediately after it (same key, different model).
  const expandedTargets: ResolvedSynthesisTarget[] = [];
  for (const target of targets) {
    expandedTargets.push(target);
    if (target.provider === "google" && target.upstreamModel !== GOOGLE_FALLBACK_MODEL) {
      expandedTargets.push({ ...target, upstreamModel: GOOGLE_FALLBACK_MODEL });
    }
  }

  for (const target of expandedTargets) {
    try {
      const response = await streamCompletion(target, messages, options);
      // Track community token success
      if (db && target.keySource === "community" && target.communityTokenId) {
        recordCommunityTokenUsage(db, target.communityTokenId, true).catch(() => {});
      }
      return { response, usedTarget: target };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // Track community token failure
      if (db && target.keySource === "community" && target.communityTokenId) {
        recordCommunityTokenUsage(db, target.communityTokenId, false, lastError.message).catch(
          () => {},
        );
      }
      log.warn(
        `fallback: ${target.provider}/${target.upstreamModel} failed (${lastError.message}), trying next provider...`,
      );
    }
  }

  throw lastError ?? new Error("No LLM providers available.");
}
