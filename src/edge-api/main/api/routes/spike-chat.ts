import { Hono } from "hono";
import type { Env, Variables } from "../../core-logic/env.js";
import { BROWSER_TOOLS } from "../../core-logic/chat-browser-tools.js";
import {
  buildAetherSystemPrompt,
  buildExtractPrompt,
  type UserMemory,
} from "../../core-logic/aether-prompt.js";
import {
  fetchUserNotes,
  selectNotes,
  saveNote,
  parseExtractedNote,
  consolidateNotes,
  updateNoteConfidence,
  deleteNotesByIds,
  batchUpdateNotes,
} from "../../core-logic/aether-memory.js";
import { fetchToolCatalog } from "../../core-logic/mcp-tools.js";
import { safeJsonParse, executeAgentTool } from "../../core-logic/chat-tool-execution.js";
import {
  resolveSynthesisTarget,
  resolveAllPlatformTargets,
  streamCompletion,
  streamCompletionWithFallback,
  synthesizeCompletion,
  type ProviderMessage,
  type ResolvedSynthesisTarget,
} from "../../core-logic/llm-provider.js";
import { getRubik3SystemPrompt } from "../../core-logic/rubik-persona-prompt.js";
import { getArnoldPersonaPrompt } from "../../core-logic/arnold-persona-prompt.js";
import { getZoltanMegaPersonaPrompt } from "../../core-logic/zoltan-persona-prompt.js";
import { getPetiPersonaPrompt } from "../../core-logic/peti-persona-prompt.js";
import { getDaftPunkPersonaPrompt } from "../../core-logic/daftpunk-persona-prompt.js";
import { getGPPersonaPrompt } from "../../core-logic/gp-persona-prompt.js";
import { getRajuPersonaPrompt } from "../../core-logic/raju-persona-prompt.js";
import { getSwitchboardPersonaPrompt } from "../../core-logic/switchboard-persona-prompt.js";
import { getErdosPersonaPrompt } from "../../core-logic/erdos-persona-prompt.js";
import { getEinsteinPersonaPrompt } from "../../core-logic/einstein-persona-prompt.js";
import { getAttilaPersonaPrompt } from "../../core-logic/attila-persona-prompt.js";
import { getZoltanQualityGate } from "../../core-logic/zoltan-quality-gate.js";
import { getHungarianConcepts } from "../../core-logic/hungarian-concepts.js";
import {
  getSocratesPersonaPrompt,
  getDiogenesPersonaPrompt,
  getPlatoPersonaPrompt,
  getAristotlePersonaPrompt,
  getNietzschePersonaPrompt,
  getKantPersonaPrompt,
  getStoicPersonaPrompt,
  getWittgensteinPersonaPrompt,
  getBuddhaPersonaPrompt,
  getCamusPersonaPrompt,
  getSimonePersonaPrompt,
  getArendtPersonaPrompt,
  getSpinozaPersonaPrompt,
  getConfuciusPersonaPrompt,
} from "../../core-logic/philosopher-personas.js";
import {
  getTrumpPersonaPrompt,
  getMuskPersonaPrompt,
  getGatesPersonaPrompt,
  getJobsPersonaPrompt,
} from "../../core-logic/public-figure-personas.js";
import { compressMessage, type PrdCompressionConfig } from "../../core-logic/prd-compression.js";
const spikeChat = new Hono<{ Bindings: Env; Variables: Variables }>();
const MAX_TOOL_LOOPS = 3;
const MAX_HISTORY_MESSAGES = 16;
const MAX_RECENT_HISTORY_MESSAGES = 6;
const MAX_HISTORY_CHARS = 6_000;
const RECENT_MESSAGE_CHAR_LIMIT = 1_200;
const OLDER_ASSISTANT_CHAR_LIMIT = 320;
const OLDER_USER_CHAR_LIMIT = 240;
const TOOL_HINT_LIMIT = 12;
// Technologic — buy it, use it, break it, fix it, trash it, change it, mail, upgrade it
const TOOL_INTENT_PATTERNS = [
  /\b(search|find|look up|lookup|browse|inspect|scan|check)\b/i, // buy it, use it
  /\b(open|navigate|click|fill|screenshot|scroll|read|write)\b/i, // break it, fix it
  /\b(price|pricing|docs?|documentation|api|endpoint|status)\b/i, // trash it, change it
  /\b(compare|verify|debug|deploy|build|upgrade|update|format)\b/i, // mail, upgrade it
  /\b(this page|current page|article|here|latest|current|today)\b/i, // technologic
  /\b(error|logs?|tool|mcp|test|benchmark|profile|optimize)\b/i, // technologic
] as const;
type SpikeChatRole = "system" | "user" | "assistant" | "tool";

const SPIKE_BROWSER_TOOLS: Array<{
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}> = BROWSER_TOOLS.map((tool) => ({
  type: "function",
  function: {
    name: tool.name,
    description: tool.description,
    parameters: tool.input_schema,
  },
}));

const SPIKE_AGENT_TOOLS: Array<{
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}> = [
  ...SPIKE_BROWSER_TOOLS,
  {
    type: "function",
    function: {
      name: "mcp_tool_search",
      description:
        "Search the MCP tool catalog by natural-language query. Use this when you know the task but not the exact tool name.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "What you need the tool to do or the data you want to find.",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "mcp_tool_call",
      description:
        "Call an MCP tool by exact name with a JSON arguments object. Use mcp_tool_search first when you are not already sure of the correct tool.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Exact MCP tool name to call.",
          },
          arguments: {
            type: "object",
            description: "JSON arguments to send to the target MCP tool.",
          },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "git_commit",
      description:
        "Commit one or more files directly to a branch in a GitHub repository. Creates the branch automatically if it doesn't exist. Use a session branch like chat/spike/<topic> for iterative development — never commit directly to main.",
      parameters: {
        type: "object",
        properties: {
          repo: {
            type: "string",
            description:
              'Repository name. Short form (e.g. "spike.land") resolves to spike-land-ai org, or use full "owner/repo".',
          },
          branch: {
            type: "string",
            description:
              'Target branch (created if missing). Defaults to "chat/spike/<timestamp>". Use a descriptive name like "chat/spike/dark-mode".',
          },
          message: {
            type: "string",
            description: "Commit message summarizing the changes.",
          },
          files: {
            type: "array",
            description: "Files to commit.",
            items: {
              type: "object",
              properties: {
                path: {
                  type: "string",
                  description: "File path relative to repo root.",
                },
                content: {
                  type: "string",
                  description: "Full file content.",
                },
              },
              required: ["path", "content"],
            },
          },
        },
        required: ["repo", "message", "files"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "git_merge",
      description:
        "Merge a session branch into the default branch (usually main). Use after iterating on a chat/spike/* branch. The branch is deleted after merge.",
      parameters: {
        type: "object",
        properties: {
          repo: {
            type: "string",
            description: 'Repository name (e.g. "spike.land" or "owner/repo").',
          },
          branch: {
            type: "string",
            description: "The session branch to merge (e.g. chat/spike/dark-mode).",
          },
          message: {
            type: "string",
            description: "Optional merge commit message.",
          },
        },
        required: ["repo", "branch"],
      },
    },
  },
];

interface ParsedToolCall {
  toolCallId: string;
  name: string;
  args: Record<string, unknown>;
  rawArgs: string;
}

interface BrowserResultRequestBody {
  sessionId?: string;
  toolCallId?: string;
  result?: unknown;
}

interface SpikeChatMessage {
  role: SpikeChatRole;
  content: string | null;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

interface LocalIntentSummary {
  intent: "conversation" | "grounded_lookup" | "browser_action";
  urgency: "low" | "medium" | "high";
  needsTools: boolean;
  confidence: number; // 0-1, heuristic or LLM-derived
  reason: string;
  gated?: boolean; // true if Iron Gate forced safe mode
}

/** Iron Gate threshold — below this, force safe conversation mode (fail-closed). */
const IRON_GATE_THRESHOLD = 0.25;
/** Below this confidence, run a second LLM-based classification pass. */
const TWO_STAGE_THRESHOLD = 0.7;

interface HeuristicNoteCandidate {
  trigger: string;
  lesson: string;
  confidence: number;
}

function normalizeText(value: string, maxChars: number) {
  const compact = value.replace(/\s+/g, " ").trim();
  if (!compact) {
    return "";
  }

  if (compact.length <= maxChars) {
    return compact;
  }

  return `${compact.slice(0, Math.max(0, maxChars - 3)).trimEnd()}...`;
}

function compressHistory(
  history: Array<{ role: string; content: string }> | undefined,
): Array<{ role: "user" | "assistant"; content: string }> {
  if (!Array.isArray(history)) {
    return [];
  }

  const compacted = history
    .filter(
      (entry): entry is { role: "user" | "assistant"; content: string } =>
        (entry.role === "user" || entry.role === "assistant") &&
        typeof entry.content === "string" &&
        entry.content.trim().length > 0,
    )
    .slice(-MAX_HISTORY_MESSAGES)
    .map((entry, index, entries) => {
      const isRecent = index >= Math.max(0, entries.length - MAX_RECENT_HISTORY_MESSAGES);
      const charLimit = isRecent
        ? RECENT_MESSAGE_CHAR_LIMIT
        : entry.role === "assistant"
          ? OLDER_ASSISTANT_CHAR_LIMIT
          : OLDER_USER_CHAR_LIMIT;

      return {
        role: entry.role,
        content: normalizeText(entry.content, charLimit),
      };
    })
    .filter((entry) => entry.content.length > 0);

  let totalChars = compacted.reduce((sum, entry) => sum + entry.content.length, 0);
  while (totalChars > MAX_HISTORY_CHARS && compacted.length > MAX_RECENT_HISTORY_MESSAGES) {
    const removed = compacted.shift();
    totalChars -= removed?.content.length ?? 0;
  }

  return compacted;
}

/**
 * Stage 1: Fast heuristic classifier with confidence scoring.
 * Returns a confidence-tagged intent summary. Downstream code uses the
 * confidence to decide whether to run a second LLM pass (two-stage)
 * or invoke the Iron Gate (fail-closed).
 */
function classifyIntent(
  userMessage: string,
  pageContext?: {
    url?: string;
    title?: string;
    slug?: string;
    contentSnippet?: string;
  },
): LocalIntentSummary {
  const compact = userMessage.replace(/\s+/g, " ").trim();
  const lower = compact.toLowerCase();

  // Empty or very short messages → low confidence conversation
  if (compact.length < 3) {
    return {
      intent: "conversation",
      urgency: "low",
      needsTools: false,
      confidence: 0.1,
      reason: "Message too short to classify reliably.",
      gated: true,
    };
  }

  const mentionsPageContext =
    Boolean(pageContext?.title || pageContext?.url || pageContext?.slug) &&
    /\b(this|here|page|article|above|current)\b/i.test(compact);
  const toolPatternMatches = TOOL_INTENT_PATTERNS.filter((pattern) => pattern.test(lower)).length;
  const needsTools = mentionsPageContext || toolPatternMatches > 0;

  // Confidence heuristic: more pattern matches → higher confidence
  // Single match could be coincidental; multiple matches are strong signal
  const baseConfidence = needsTools
    ? Math.min(0.95, 0.5 + toolPatternMatches * 0.15 + (mentionsPageContext ? 0.2 : 0))
    : 0.6; // conversation is the safe default, moderate confidence

  if (/\b(open|navigate|click|fill|screenshot|scroll|read)\b/i.test(lower)) {
    // Browser action verbs are high-signal
    const browserConfidence = Math.min(0.95, baseConfidence + 0.15);
    return {
      intent: "browser_action",
      urgency: /\bnow|urgent|asap|immediately\b/i.test(lower) ? "high" : "medium",
      needsTools,
      confidence: browserConfidence,
      reason: "The request appears to require live navigation or browser interaction.",
    };
  }

  if (needsTools) {
    return {
      intent: "grounded_lookup",
      urgency: /\bblocker|broken|incident|outage|failing\b/i.test(lower) ? "high" : "medium",
      needsTools: true,
      confidence: baseConfidence,
      reason: "The request depends on live platform state, docs, tools, or page context.",
    };
  }

  return {
    intent: "conversation",
    urgency: "low",
    needsTools: false,
    confidence: baseConfidence,
    reason: "The request can be answered directly without live tool usage.",
  };
}

/**
 * Iron Gate: fail-closed safety check. If classification confidence is below
 * the gate threshold, force safe conversation mode — no tools, no browser actions.
 * Inspired by Claude Code's Iron Gate subsystem (CCU).
 */
function applyIronGate(intent: LocalIntentSummary): LocalIntentSummary {
  if (intent.confidence < IRON_GATE_THRESHOLD) {
    return {
      intent: "conversation",
      urgency: "low",
      needsTools: false,
      confidence: intent.confidence,
      reason: `Iron gate: classification confidence (${intent.confidence.toFixed(2)}) below threshold. Defaulting to safe conversation mode.`,
      gated: true,
    };
  }
  return intent;
}

/**
 * Stage 2: LLM-based classifier for ambiguous messages.
 * Only called when heuristic confidence is between IRON_GATE_THRESHOLD and TWO_STAGE_THRESHOLD.
 * Uses a fast model at temperature=0 for deterministic classification.
 */
async function llmClassifyIntent(
  target: ResolvedSynthesisTarget,
  userMessage: string,
  heuristicResult: LocalIntentSummary,
): Promise<LocalIntentSummary> {
  try {
    const classifyPrompt = `Classify this user message into exactly one category. Respond with ONLY a JSON object.

Message: "${userMessage.slice(0, 500)}"

Heuristic guess: ${heuristicResult.intent} (confidence: ${heuristicResult.confidence.toFixed(2)})

Respond with:
{
  "intent": "conversation" | "grounded_lookup" | "browser_action",
  "urgency": "low" | "medium" | "high",
  "needsTools": boolean,
  "confidence": number between 0 and 1,
  "reason": "brief explanation"
}`;

    const result = await synthesizeCompletion(
      target,
      [
        {
          role: "system",
          content: "You are a message classifier. Respond with ONLY valid JSON. No other text.",
        },
        { role: "user", content: classifyPrompt },
      ],
      { temperature: 0, maxTokens: 256 },
    );

    const parsed = JSON.parse(result.content.trim()) as {
      intent?: string;
      urgency?: string;
      needsTools?: boolean;
      confidence?: number;
      reason?: string;
    };

    const validIntents = ["conversation", "grounded_lookup", "browser_action"] as const;
    const validUrgencies = ["low", "medium", "high"] as const;

    const intent = validIntents.includes(parsed.intent as (typeof validIntents)[number])
      ? (parsed.intent as LocalIntentSummary["intent"])
      : heuristicResult.intent;
    const urgency = validUrgencies.includes(parsed.urgency as (typeof validUrgencies)[number])
      ? (parsed.urgency as LocalIntentSummary["urgency"])
      : heuristicResult.urgency;

    return {
      intent,
      urgency,
      needsTools:
        typeof parsed.needsTools === "boolean" ? parsed.needsTools : heuristicResult.needsTools,
      confidence:
        typeof parsed.confidence === "number"
          ? Math.max(0, Math.min(1, parsed.confidence))
          : heuristicResult.confidence,
      reason: typeof parsed.reason === "string" ? parsed.reason : heuristicResult.reason,
    };
  } catch {
    // LLM classification failed — fall back to heuristic result (fail-open to heuristic, not fail-open to tools)
    return heuristicResult;
  }
}

function buildPlanArtifact(
  userMessage: string,
  intent: LocalIntentSummary,
  toolCatalog: Array<{ name: string }>,
): string {
  if (!intent.needsTools) {
    return userMessage;
  }

  const hints = toolCatalog.slice(0, TOOL_HINT_LIMIT).map((tool) => tool.name);
  const lines = [
    "## Execution Brief",
    `Intent: ${intent.intent}`,
    `Urgency: ${intent.urgency}`,
    `Tool use: ${intent.needsTools ? "Allowed when needed" : "Not required"}`,
    `Reason: ${intent.reason}`,
  ];

  if (hints.length > 0) {
    lines.push(`Catalog hints: ${hints.join(", ")}`);
  }

  lines.push("## User Message");
  lines.push(userMessage);
  return lines.join("\n");
}

function extractNoteCandidate(userMessage: string): HeuristicNoteCandidate | null {
  const compact = userMessage.replace(/\s+/g, " ").trim();
  if (compact.length < 12) {
    return null;
  }

  const explicitRemember = /(?:^|\b)(?:remember|note that)\s+(.{8,200})$/i.exec(compact);
  if (explicitRemember?.[1]) {
    const fact = normalizeText(explicitRemember[1], 180);
    return {
      trigger: "explicit memory request",
      lesson: fact,
      confidence: 0.7,
    };
  }

  const preference = /(?:^|\b)(?:i prefer|we prefer|please use|always use)\s+(.{4,160})$/i.exec(
    compact,
  );
  if (preference?.[1]) {
    const fact = normalizeText(preference[1], 160);
    return {
      trigger: "stated preference",
      lesson: `User preference: ${fact}`,
      confidence: 0.62,
    };
  }

  const goal = /(?:^|\b)(?:my goal is|i'm trying to|i am trying to|we need to)\s+(.{6,180})$/i.exec(
    compact,
  );
  if (goal?.[1]) {
    const fact = normalizeText(goal[1], 180);
    return {
      trigger: "current goal",
      lesson: `Current goal: ${fact}`,
      confidence: 0.58,
    };
  }

  return null;
}

export function buildSpikeChatMessages(
  systemPrompt: string,
  history: Array<{ role: string; content: string }> | undefined,
  userMessage: string,
): SpikeChatMessage[] {
  const messages: SpikeChatMessage[] = [{ role: "system", content: systemPrompt }];

  for (const entry of compressHistory(history)) {
    messages.push({ role: entry.role, content: entry.content });
  }

  messages.push({ role: "user", content: userMessage });
  return messages;
}

/** Stream LLM response via provider resolution as SSE. Returns full text + parsed tool calls. */
async function streamLlmResponse(
  target: ResolvedSynthesisTarget,
  messages: SpikeChatMessage[],
  sendEvent: (data: unknown) => Promise<void>,
  opts: {
    temperature?: number;
    maxTokens?: number;
    tools?: Array<{
      type: "function";
      function: { name: string; description: string; parameters: unknown };
    }>;
    fallbackTargets?: ResolvedSynthesisTarget[];
    db?: D1Database;
  },
): Promise<{ fullText: string; toolCalls: ParsedToolCall[] }> {
  const providerMessages: ProviderMessage[] = messages.map((m) => ({
    role: m.role === "tool" ? ("user" as const) : m.role,
    content: m.content ?? "",
  }));

  const streamOpts = {
    temperature: opts.temperature,
    maxTokens: opts.maxTokens,
    tools: opts.tools,
  };

  let res: Response;
  if (opts.fallbackTargets && opts.fallbackTargets.length > 0) {
    const allTargets = [
      target,
      ...opts.fallbackTargets.filter((t) => t.provider !== target.provider),
    ];
    const result = await streamCompletionWithFallback(
      allTargets,
      providerMessages,
      streamOpts,
      opts.db,
    );
    res = result.response;
  } else {
    res = await streamCompletion(target, providerMessages, streamOpts);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body from LLM provider");

  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";
  const toolCallState = new Map<number, { id: string; name: string; argBuffer: string }>();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const rawData = line.slice(6).trim();
      if (rawData === "[DONE]" || !rawData) continue;

      try {
        const chunk = JSON.parse(rawData) as {
          choices: Array<{
            delta: {
              content?: string;
              tool_calls?: Array<{
                index: number;
                function: { name?: string; arguments?: string };
              }>;
            };
            finish_reason?: string;
          }>;
        };

        const delta = chunk.choices[0]?.delta;
        if (!delta) continue;

        if (delta.content) {
          fullText += delta.content;
          await sendEvent({ type: "text_delta", text: delta.content });
        }

        if (delta.tool_calls) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index ?? 0;
            const existing = toolCallState.get(idx);
            const toolCallId =
              typeof (tc as { id?: unknown }).id === "string"
                ? ((tc as { id?: string }).id ?? "")
                : (existing?.id ?? crypto.randomUUID());
            const nextState = existing ?? {
              id: toolCallId,
              name: "",
              argBuffer: "",
            };
            if (tc.function.name) {
              nextState.name = tc.function.name;
            }
            if (tc.function.arguments) {
              nextState.argBuffer += tc.function.arguments;
            }
            toolCallState.set(idx, nextState);
          }
        }
      } catch {
        // skip malformed SSE
      }
    }
  }

  const toolCalls: ParsedToolCall[] = [...toolCallState.values()]
    .filter((state) => state.name)
    .map((state) => ({
      toolCallId: state.id,
      name: state.name,
      args: safeJsonParse<Record<string, unknown>>(state.argBuffer || "{}", {}),
      rawArgs: state.argBuffer || "{}",
    }));

  return { fullText, toolCalls };
}

spikeChat.post("/api/spike-chat/browser-results", async (c) => {
  const userId = c.get("userId") as string | undefined;
  const body = await c.req.json<BrowserResultRequestBody>();

  if (!userId) {
    return c.json({ error: "Authentication required" }, 401);
  }

  if (!body.sessionId || !body.toolCallId) {
    return c.json({ error: "sessionId and toolCallId are required" }, 400);
  }

  // Try DO callback path first (zero-polling)
  try {
    const sessionStub = c.env.SPIKE_CHAT_SESSIONS.get(
      c.env.SPIKE_CHAT_SESSIONS.idFromName(body.sessionId),
    ) as DurableObjectStub & {
      deliverBrowserResult(toolCallId: string, result: unknown): Promise<boolean>;
    };
    const delivered = await sessionStub.deliverBrowserResult(body.toolCallId, body.result ?? null);
    if (delivered) {
      return c.json({ ok: true });
    }
  } catch {
    // DO unavailable — fall through to D1 path
  }

  // Fallback: D1 update (for sessions started before DO migration)
  const result = await c.env.DB.prepare(
    `UPDATE spike_chat_browser_results
     SET status = 'done',
         result_json = ?,
         updated_at = ?
     WHERE tool_call_id = ? AND session_id = ? AND user_id = ?`,
  )
    .bind(JSON.stringify(body.result ?? null), Date.now(), body.toolCallId, body.sessionId, userId)
    .run();

  if ((result.meta.changes ?? 0) === 0) {
    return c.json({ error: "Browser result not found" }, 404);
  }

  return c.json({ ok: true });
});

spikeChat.post("/api/spike-chat", async (c) => {
  const body = await c.req.json<{
    message?: string;
    history?: Array<{ role: string; content: string }>;
    persona?: string;
    pageContext?: {
      url?: string;
      title?: string;
      slug?: string;
      contentSnippet?: string;
    };
  }>();
  if (!body.message || typeof body.message !== "string") {
    return c.json({ error: "message is required" }, 400);
  }

  if (body.message.length > 8000) {
    return c.json({ error: "message too long (max 8000 characters)" }, 400);
  }

  const userId =
    (c.get("userId") as string | undefined) ?? `guest-${crypto.randomUUID().slice(0, 8)}`;

  const rawMessage = body.message.trim();
  const requestId = (c.get("requestId") as string | undefined) ?? crypto.randomUUID();
  const sessionId = `spike-chat-${userId}`;
  const persona = typeof body.persona === "string" ? body.persona.trim() : undefined;

  // PRD compression — same pipeline as /api/chat
  const prdConfig: PrdCompressionConfig = {
    mode: (c.env.PRD_COMPRESSION_MODE as PrdCompressionConfig["mode"]) ?? "auto",
    geminiApiKey: c.env.GEMINI_API_KEY,
  };
  const compression = await compressMessage(rawMessage, prdConfig);
  const userMessage = compression.formattedMessage;

  // Get DO stub for session management (used for browser callbacks + history)
  interface SessionDOStub extends DurableObjectStub {
    addMessage(msg: {
      role: string;
      content: string;
      timestamp: number;
      toolCallId?: string;
    }): Promise<void>;
    waitForBrowserResult(toolCallId: string): Promise<unknown>;
    appendEvent(data: string): number;
    setMeta(key: string, value: string): Promise<void>;
  }
  let sessionDO: SessionDOStub | null = null;
  try {
    sessionDO = c.env.SPIKE_CHAT_SESSIONS.get(
      c.env.SPIKE_CHAT_SESSIONS.idFromName(sessionId),
    ) as unknown as SessionDOStub;
  } catch {
    // DO binding unavailable (local dev without DO support)
  }

  // Resolve LLM provider (BYOK → platform fallback)
  const llmTarget = await resolveSynthesisTarget(c.env, userId, {
    publicModel: "spike-agent-v1",
    provider: "auto",
    upstreamModel: undefined,
  });
  if (!llmTarget) {
    return c.json(
      { error: "No LLM provider available. Add a BYOK key or configure a platform provider." },
      503,
    );
  }

  // Resolve all available targets for fallback on provider failure
  const allTargets = await resolveAllPlatformTargets(c.env, userId);
  const fallbackTargets = allTargets.filter((t) => t.provider !== llmTarget.provider);

  // Load user memory
  const userNotes: UserMemory["notes"] = await fetchUserNotes(c.env.DB, userId).catch(
    (): UserMemory["notes"] => [],
  );
  const selectedNotes = selectNotes(userNotes);
  const userMemory: UserMemory = {
    lifeSummary: "",
    notes: selectedNotes,
    currentGoals: [],
  };

  const { stablePrefix, dynamicSuffix } = buildAetherSystemPrompt(userMemory);
  let fullSystemPrompt = dynamicSuffix ? `${stablePrefix}\n\n${dynamicSuffix}` : stablePrefix;

  // Inject page context when the user is reading a specific page
  if (body.pageContext) {
    const ctx = body.pageContext;
    const parts: string[] = ["## Current Page Context"];
    if (ctx.title) parts.push(`The user is currently reading: "${ctx.title}"`);
    if (ctx.url) parts.push(`URL: ${ctx.url}`);
    if (ctx.contentSnippet) {
      parts.push(`\nArticle excerpt:\n${ctx.contentSnippet.slice(0, 2000)}`);
    }
    parts.push("\nUse this context to answer questions about what the user is reading.");
    fullSystemPrompt = `${fullSystemPrompt}\n\n${parts.join("\n")}`;
  }

  // Zoltán's quality gate — every prompt passes through his values
  fullSystemPrompt = `${fullSystemPrompt}\n\n${getZoltanQualityGate()}`;

  // Hungarian concepts — new language = new concepts
  fullSystemPrompt = `${fullSystemPrompt}\n\n${getHungarianConcepts()}`;

  // Merge Rubik-3 persona prompt when requested
  if (persona === "rubik-3") {
    fullSystemPrompt = `${fullSystemPrompt}\n\n${getRubik3SystemPrompt()}`;
  }

  // Zoltan mega-persona (also serves legacy slugs: radix, spike, gov, zoli)
  if (["zoltan", "zoli", "radix", "spike", "gov"].includes(persona ?? "")) {
    fullSystemPrompt = `${fullSystemPrompt}\n\n${getZoltanMegaPersonaPrompt()}`;
  }

  // Merge Arnold UX provocateur persona when requested
  if (persona === "arnold") {
    fullSystemPrompt = `${fullSystemPrompt}\n\n${getArnoldPersonaPrompt()}`;
  }

  // Merge Peti QA engineer persona when requested
  if (persona === "peti") {
    fullSystemPrompt = `${fullSystemPrompt}\n\n${getPetiPersonaPrompt()}`;
  }

  // Daft Punk music production persona
  if (persona === "daftpunk") {
    fullSystemPrompt = `${fullSystemPrompt}\n\n${getDaftPunkPersonaPrompt()}`;
  }

  // Gian Pierre chemist/citizen-developer persona
  if (persona === "gp") {
    fullSystemPrompt = `${fullSystemPrompt}\n\n${getGPPersonaPrompt()}`;
  }

  // Raju backend architect persona
  if (persona === "raju") {
    fullSystemPrompt = `${fullSystemPrompt}\n\n${getRajuPersonaPrompt()}`;
  }

  // Switchboard UK consumer advocacy persona
  if (persona === "switchboard") {
    fullSystemPrompt = `${fullSystemPrompt}\n\n${getSwitchboardPersonaPrompt()}`;
  }

  // Erdős mathematical collaboration persona
  if (persona === "erdos") {
    fullSystemPrompt = `${fullSystemPrompt}\n\n${getErdosPersonaPrompt()}`;
  }

  // Einstein physics + thought experiments persona
  if (persona === "einstein") {
    fullSystemPrompt = `${fullSystemPrompt}\n\n${getEinsteinPersonaPrompt()}`;
  }

  // Attila ómagyar elder persona (for Csaba Katona)
  if (persona === "attila") {
    fullSystemPrompt = `${fullSystemPrompt}\n\n${getAttilaPersonaPrompt()}`;
  }

  // --- Philosophers (Arena residents — all loops closed) ---

  if (persona === "socrates") {
    fullSystemPrompt = `${fullSystemPrompt}\n\n${getSocratesPersonaPrompt()}`;
  }
  if (persona === "diogenes") {
    fullSystemPrompt = `${fullSystemPrompt}\n\n${getDiogenesPersonaPrompt()}`;
  }
  if (persona === "plato") {
    fullSystemPrompt = `${fullSystemPrompt}\n\n${getPlatoPersonaPrompt()}`;
  }
  if (persona === "aristotle") {
    fullSystemPrompt = `${fullSystemPrompt}\n\n${getAristotlePersonaPrompt()}`;
  }
  if (persona === "nietzsche") {
    fullSystemPrompt = `${fullSystemPrompt}\n\n${getNietzschePersonaPrompt()}`;
  }
  if (persona === "kant") {
    fullSystemPrompt = `${fullSystemPrompt}\n\n${getKantPersonaPrompt()}`;
  }
  if (persona === "stoic" || persona === "marcus-aurelius") {
    fullSystemPrompt = `${fullSystemPrompt}\n\n${getStoicPersonaPrompt()}`;
  }
  if (persona === "wittgenstein") {
    fullSystemPrompt = `${fullSystemPrompt}\n\n${getWittgensteinPersonaPrompt()}`;
  }
  if (persona === "buddha") {
    fullSystemPrompt = `${fullSystemPrompt}\n\n${getBuddhaPersonaPrompt()}`;
  }
  if (persona === "camus") {
    fullSystemPrompt = `${fullSystemPrompt}\n\n${getCamusPersonaPrompt()}`;
  }
  if (persona === "simone" || persona === "beauvoir") {
    fullSystemPrompt = `${fullSystemPrompt}\n\n${getSimonePersonaPrompt()}`;
  }
  if (persona === "arendt") {
    fullSystemPrompt = `${fullSystemPrompt}\n\n${getArendtPersonaPrompt()}`;
  }
  if (persona === "spinoza") {
    fullSystemPrompt = `${fullSystemPrompt}\n\n${getSpinozaPersonaPrompt()}`;
  }
  if (persona === "confucius") {
    fullSystemPrompt = `${fullSystemPrompt}\n\n${getConfuciusPersonaPrompt()}`;
  }

  // --- Public figures (Arena guests — open loops noted) ---

  if (persona === "trump") {
    fullSystemPrompt = `${fullSystemPrompt}\n\n${getTrumpPersonaPrompt()}`;
  }
  if (persona === "musk") {
    fullSystemPrompt = `${fullSystemPrompt}\n\n${getMuskPersonaPrompt()}`;
  }
  if (persona === "gates") {
    fullSystemPrompt = `${fullSystemPrompt}\n\n${getGatesPersonaPrompt()}`;
  }
  if (persona === "jobs") {
    fullSystemPrompt = `${fullSystemPrompt}\n\n${getJobsPersonaPrompt()}`;
  }

  // --- Two-stage classifier with Iron Gate ---
  let intentSummary = classifyIntent(userMessage, body.pageContext);

  // Stage 2: LLM classifier for ambiguous messages (between Iron Gate and confidence threshold)
  if (
    intentSummary.confidence >= IRON_GATE_THRESHOLD &&
    intentSummary.confidence < TWO_STAGE_THRESHOLD
  ) {
    intentSummary = await llmClassifyIntent(llmTarget, rawMessage, intentSummary);
  }

  // Iron Gate: fail-closed safety — force safe mode if still low confidence
  intentSummary = applyIronGate(intentSummary);

  // Persona chats are conversational — never pass tools, except daftpunk who needs music tools
  if (persona && persona !== "daftpunk") {
    intentSummary.needsTools = false;
  }
  if (persona === "daftpunk") {
    intentSummary.needsTools = true;
  }
  const toolCatalog = intentSummary.needsTools
    ? await fetchToolCatalog(c.env.MCP_SERVICE, requestId)
    : [];

  // Set up SSE stream
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  const sendEvent = async (data: unknown) => {
    if (data === "[DONE]") {
      await writer.write(encoder.encode("data: [DONE]\n\n"));
    } else {
      const serialized = JSON.stringify(data);
      const eventName =
        typeof data === "object" &&
        data !== null &&
        typeof (data as { type?: unknown }).type === "string"
          ? (data as { type: string }).type
          : null;

      // Append to DO event log for stream resumption
      let seq: number | undefined;
      if (sessionDO) {
        try {
          seq = sessionDO.appendEvent(serialized) as unknown as number;
        } catch {
          // DO unavailable — continue without event log
        }
      }

      let frame = "";
      if (seq !== undefined) {
        frame += `id: ${seq}\n`;
      }
      if (eventName) {
        frame += `event: ${eventName}\n`;
      }
      frame += `data: ${serialized}\n\n`;
      await writer.write(encoder.encode(frame));
    }
  };

  const bgTask = (async () => {
    try {
      // Persist user message to DO session history (raw, not compressed)
      if (sessionDO) {
        try {
          await sessionDO.addMessage({
            role: "user",
            content: rawMessage,
            timestamp: Date.now(),
          });
          if (persona) {
            await sessionDO.setMeta("persona", persona);
          }
        } catch {
          // DO persistence is non-critical
        }
      }

      await sendEvent({
        type: "context_sync",
        sessionId,
        activeNoteCount: selectedNotes.length,
        totalNoteCount: userNotes.length,
        toolCatalogCount: toolCatalog.length,
        provider: llmTarget.provider,
        model: llmTarget.upstreamModel,
        keySource: llmTarget.keySource,
        classifierConfidence: intentSummary.confidence,
        classifierGated: intentSummary.gated ?? false,
      });

      if (compression.compressed && c.env.PRD_COMPRESSION_EXPOSE === "true") {
        await sendEvent({
          type: "prd_compression",
          tier: compression.tier,
          prd: compression.prd,
          originalTokens: compression.originalTokenEstimate,
          compressedTokens: compression.compressedTokenEstimate,
        });
      }

      // --- Stage 1: CLASSIFY ---
      await sendEvent({ type: "stage_update", stage: "classify" });

      // --- Stage 2: PLAN ---
      await sendEvent({ type: "stage_update", stage: "plan" });
      const planArtifact = buildPlanArtifact(userMessage, intentSummary, toolCatalog);

      // --- Stage 3: EXECUTE (streamed) ---
      await sendEvent({ type: "stage_update", stage: "execute" });
      const executionMessages = buildSpikeChatMessages(
        fullSystemPrompt,
        body.history,
        planArtifact,
      );
      let assistantResponse = "";

      // Track tool execution outcomes for the feedback loop
      const toolOutcomes: Array<{ status: string }> = [];

      for (let loop = 0; loop < MAX_TOOL_LOOPS; loop++) {
        const iteration = await streamLlmResponse(llmTarget, executionMessages, sendEvent, {
          temperature: 0.2,
          maxTokens: 4096,
          ...(intentSummary.needsTools ? { tools: SPIKE_AGENT_TOOLS } : {}),
          fallbackTargets,
          db: c.env.DB,
        });

        assistantResponse += iteration.fullText;

        if (iteration.toolCalls.length === 0) {
          break;
        }

        executionMessages.push({
          role: "assistant",
          content: iteration.fullText || null,
          tool_calls: iteration.toolCalls.map((toolCall) => ({
            id: toolCall.toolCallId,
            type: "function" as const,
            function: {
              name: toolCall.name,
              arguments: toolCall.rawArgs,
            },
          })),
        });

        for (const toolCall of iteration.toolCalls) {
          await sendEvent({
            type: "tool_call_start",
            toolCallId: toolCall.toolCallId,
            name: toolCall.name,
            args: toolCall.args,
            transport: "mcp",
          });

          const toolResult = await executeAgentTool({
            mcpService: c.env.MCP_SERVICE,
            db: c.env.DB,
            requestId,
            contextId: sessionId,
            userId,
            toolCallId: toolCall.toolCallId,
            toolName: toolCall.name,
            toolArgs: toolCall.args,
            toolCatalog,
            tableName: "spike_chat_browser_results",
            contextIdColumn: "session_id",
            // Use DO callback for zero-polling browser results when available.
            // Capture sessionDO in a local const so the lambda's closure is
            // narrowed to the non-null type and TypeScript can verify the call.
            ...(sessionDO
              ? ((capturedDO) => ({
                  waitViaCallback: (tcId: string) => capturedDO.waitForBrowserResult(tcId),
                }))(sessionDO)
              : {}),
            githubToken: c.env.GITHUB_TOKEN,
          });

          toolOutcomes.push({ status: toolResult.status });

          await sendEvent({
            type: "tool_call_end",
            toolCallId: toolCall.toolCallId,
            name: toolCall.name,
            result: toolResult.result,
            status: toolResult.status,
            transport: toolResult.transport,
          });

          executionMessages.push({
            role: "tool",
            tool_call_id: toolCall.toolCallId,
            content: toolResult.result,
          });
        }

        if (loop === MAX_TOOL_LOOPS - 1) {
          await sendEvent({
            type: "error",
            error: `Stopped after ${MAX_TOOL_LOOPS} tool rounds to avoid an infinite loop.`,
          });
        }
      }

      // Persist assistant response to DO session
      if (sessionDO && assistantResponse) {
        try {
          await sessionDO.addMessage({
            role: "assistant",
            content: assistantResponse,
            timestamp: Date.now(),
          });
        } catch {
          // DO persistence is non-critical
        }
      }

      // --- Stage 4: EXTRACT ---
      await sendEvent({ type: "stage_update", stage: "extract" });
      await (async () => {
        try {
          // Fast path: regex extraction (zero latency)
          const regexExtracted = extractNoteCandidate(userMessage);
          let savedLesson: string | null = null;

          if (regexExtracted) {
            await saveNote(c.env.DB, userId, {
              id: crypto.randomUUID(),
              trigger: regexExtracted.trigger,
              lesson: regexExtracted.lesson,
              confidence: regexExtracted.confidence,
              helpCount: 0,
              createdAt: Date.now(),
              lastUsedAt: Date.now(),
            });
            savedLesson = regexExtracted.lesson;
          }

          // LLM extraction: catches implicit lessons the regex misses
          if (assistantResponse && userMessage.length >= 20) {
            const extractInput = `User: ${userMessage}\n\nAssistant: ${assistantResponse.slice(0, 1500)}`;
            const llmResult = await synthesizeCompletion(
              llmTarget,
              [
                { role: "system", content: buildExtractPrompt() },
                { role: "user", content: extractInput },
              ],
              { temperature: 0.1, maxTokens: 256 },
            );
            const llmNote = parseExtractedNote(llmResult.content);
            // Deduplicate: skip if LLM lesson matches regex lesson
            if (llmNote && llmNote.lesson !== savedLesson) {
              await saveNote(c.env.DB, userId, {
                id: crypto.randomUUID(),
                trigger: llmNote.trigger,
                lesson: llmNote.lesson,
                confidence: llmNote.confidence,
                helpCount: 0,
                createdAt: Date.now(),
                lastUsedAt: Date.now(),
              });
              savedLesson = llmNote.lesson;
            }
          }

          if (savedLesson) {
            await sendEvent({
              type: "memory_update",
              activeNoteCount: selectedNotes.length,
              totalNoteCount: userNotes.length + 1,
              lesson: savedLesson,
            });
          }
        } catch {
          // Note extraction is non-critical
        }
      })();

      // --- Execution feedback loop: tool outcomes update note confidence ---
      if (toolOutcomes.length > 0 && selectedNotes.length > 0) {
        try {
          const toolsSucceeded = toolOutcomes.every((o) => o.status === "ok");
          const updates: Array<{ id: string; confidence: number; helpCount: number }> = [];

          for (const note of selectedNotes) {
            const updated = updateNoteConfidence(note, toolsSucceeded);
            if (updated.confidence !== note.confidence || updated.helpCount !== note.helpCount) {
              updates.push({
                id: note.id,
                confidence: updated.confidence,
                helpCount: updated.helpCount,
              });
            }
          }

          if (updates.length > 0) {
            await batchUpdateNotes(c.env.DB, userId, updates);
          }
        } catch {
          // Feedback loop is non-critical
        }
      }

      // --- Auto-Dream: background note consolidation ---
      // Runs after extract, via waitUntil so it doesn't block the response.
      // Only consolidates when the user has enough notes to benefit.
      if (userNotes.length >= 8) {
        try {
          const consolidation = consolidateNotes(userNotes);
          const toDelete = [
            ...consolidation.pruned,
            ...consolidation.merged.map((m) => m.absorbed),
          ];

          // Update surviving notes that were modified (decayed or merged)
          const toUpdate = consolidation.surviving
            .filter((note) => {
              const original = userNotes.find((n) => n.id === note.id);
              return (
                original &&
                (original.confidence !== note.confidence || original.helpCount !== note.helpCount)
              );
            })
            .map((note) => ({
              id: note.id,
              confidence: note.confidence,
              helpCount: note.helpCount,
            }));

          if (toDelete.length > 0) {
            await deleteNotesByIds(c.env.DB, userId, toDelete);
          }
          if (toUpdate.length > 0) {
            await batchUpdateNotes(c.env.DB, userId, toUpdate);
          }

          if (toDelete.length > 0 || toUpdate.length > 0) {
            await sendEvent({
              type: "auto_dream",
              merged: consolidation.merged.length,
              decayed: consolidation.decayed.length,
              pruned: consolidation.pruned.length,
              surviving: consolidation.surviving.length,
            });
          }
        } catch {
          // Auto-Dream consolidation is non-critical
        }
      }
    } catch (err) {
      try {
        await sendEvent({
          type: "error",
          error: err instanceof Error ? err.message : "Internal error",
        });
      } catch {
        // Writer may already be closed
      }
    } finally {
      await sendEvent("[DONE]");
      await writer.close();
    }
  })();

  try {
    c.executionCtx.waitUntil(bgTask);
  } catch {
    // No ExecutionContext in tests
  }

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Request-Id": requestId,
    },
  });
});

/** GET /api/spike-chat/history — retrieve compressed session history from DO. */
spikeChat.get("/api/spike-chat/history", async (c) => {
  const userId = c.get("userId") as string | undefined;
  if (!userId) {
    return c.json({ error: "Authentication required" }, 401);
  }

  const sessionId = `spike-chat-${userId}`;
  try {
    const stub = c.env.SPIKE_CHAT_SESSIONS.get(
      c.env.SPIKE_CHAT_SESSIONS.idFromName(sessionId),
    ) as DurableObjectStub & {
      getHistory(): Promise<Array<{ role: string; content: string; timestamp: number }>>;
    };
    const history = await stub.getHistory();
    return c.json({ sessionId, messages: history });
  } catch {
    return c.json({ sessionId, messages: [] });
  }
});

/**
 * GET /api/spike-chat/stream/:sessionId — SSE replay endpoint.
 * Reconnects with Last-Event-ID to resume a stream from where the client left off.
 */
spikeChat.get("/api/spike-chat/stream/:sessionId", async (c) => {
  const targetSessionId = c.req.param("sessionId");
  const lastEventIdHeader = c.req.header("Last-Event-ID");
  const lastEventId = lastEventIdHeader ? Number(lastEventIdHeader) : 0;

  if (!targetSessionId) {
    return c.json({ error: "sessionId is required" }, 400);
  }

  try {
    const stub = c.env.SPIKE_CHAT_SESSIONS.get(
      c.env.SPIKE_CHAT_SESSIONS.idFromName(targetSessionId),
    ) as DurableObjectStub & {
      replayEvents(lastEventId: number): Array<{ seq: number; data: string }>;
    };
    const events = stub.replayEvents(lastEventId) as unknown as Array<{
      seq: number;
      data: string;
    }>;

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const event of events) {
          controller.enqueue(encoder.encode(`id: ${event.seq}\ndata: ${event.data}\n\n`));
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch {
    return c.json({ error: "Session not found" }, 404);
  }
});

export { spikeChat };
