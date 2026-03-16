/**
 * Shared LLM provider resolution and synthesis.
 * Extracted from openai-compatible.ts to enable spike-chat and other routes
 * to use the same BYOK + multi-provider logic.
 */

import { resolveByokKey, type ByokProvider } from "./byok.js";
import type { Env } from "./env.js";

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
  keySource: "byok" | "platform";
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
  google: "gemini-2.5-flash",
  xai: "grok-3-latest",
  ollama: "qwen3:8b",
};

export const AUTO_BYOK_PRIORITY: ByokProvider[] = ["openai", "anthropic", "google"];
export const AUTO_PLATFORM_PRIORITY: ProviderId[] = ["xai", "anthropic", "google", "openai"]; // ollama excluded from auto: local-only

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
  if (normalized.startsWith("gemini") || normalized.includes("google")) return "google";
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
  if (provider === "anthropic") return env.CLAUDE_OAUTH_TOKEN ?? null;
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

// ── Provider call functions ────────────────────────────────────────────

function compactUsage(values: {
  prompt_tokens: number | undefined;
  completion_tokens: number | undefined;
  total_tokens: number | undefined;
}): UsageShape | undefined {
  const usage: UsageShape = {};
  if (values.prompt_tokens !== undefined) usage.prompt_tokens = values.prompt_tokens;
  if (values.completion_tokens !== undefined) usage.completion_tokens = values.completion_tokens;
  if (values.total_tokens !== undefined) usage.total_tokens = values.total_tokens;
  return Object.keys(usage).length > 0 ? usage : undefined;
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
    console.error("[llm-provider] openai-style synthesis failed", { endpoint, status: res.status });
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

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: options.maxTokens ?? 768,
      temperature: options.temperature ?? 0.2,
      ...(system ? { system } : {}),
      messages: nonSystemMessages,
    }),
  });

  if (!res.ok) {
    console.error("[llm-provider] anthropic synthesis failed", { status: res.status });
    throw new Error(`Anthropic synthesis request failed with status ${res.status}.`);
  }

  const data = await res.json<AnthropicResponse>();
  const content = (data.content ?? [])
    .map((entry) => (entry.type === "text" ? (entry.text ?? "") : ""))
    .join("");

  return {
    content,
    usage: data.usage
      ? compactUsage({
          prompt_tokens: data.usage.input_tokens,
          completion_tokens: data.usage.output_tokens,
          total_tokens:
            data.usage.input_tokens !== undefined || data.usage.output_tokens !== undefined
              ? (data.usage.input_tokens ?? 0) + (data.usage.output_tokens ?? 0)
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
    console.error("[llm-provider] google synthesis failed", { status: res.status, model });
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
    const endpoint =
      target.provider === "openai"
        ? "https://api.openai.com/v1/chat/completions"
        : target.provider === "ollama"
          ? "http://localhost:11435/v1/chat/completions"
          : "https://api.x.ai/v1/chat/completions";

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
      console.error(`[llm-provider] streaming failed ${res.status}: ${errText}`);
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
