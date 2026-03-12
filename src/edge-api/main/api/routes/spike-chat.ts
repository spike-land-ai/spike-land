import { Hono } from "hono";
import type { Env, Variables } from "../../core-logic/env.js";
import { BROWSER_TOOLS } from "../../core-logic/chat-browser-tools.js";
import {
  buildAetherSystemPrompt,
  buildClassifyPrompt,
  buildPlanPrompt,
  buildExtractPrompt,
  type UserMemory,
} from "../../core-logic/aether-prompt.js";
import {
  fetchUserNotes,
  selectNotes,
  saveNote,
  parseExtractedNote,
} from "../../core-logic/aether-memory.js";

const spikeChat = new Hono<{ Bindings: Env; Variables: Variables }>();
const GROK_MODEL = "grok-4-1";
const MAX_TOOL_LOOPS = 6;
const MAX_SEARCH_RESULTS = 8;
const MAX_HISTORY_MESSAGES = 16;
const MAX_RECENT_HISTORY_MESSAGES = 6;
const MAX_HISTORY_CHARS = 6_000;
const RECENT_MESSAGE_CHAR_LIMIT = 1_200;
const OLDER_ASSISTANT_CHAR_LIMIT = 320;
const OLDER_USER_CHAR_LIMIT = 240;
const BROWSER_RESULT_TIMEOUT_MS = 15_000;
const BROWSER_RESULT_POLL_MS = 250;
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
];

interface ToolCatalogItem {
  name: string;
  description: string;
  inputSchema: unknown;
}

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

interface BrowserResultRow {
  tool_call_id: string;
  status: string;
  result_json: string | null;
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

function normalizeToolArgs(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function safeJsonParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function serializeToolContent(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
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

function scoreTool(query: string, tool: ToolCatalogItem): number {
  const lowerQuery = query.toLowerCase();
  const queryTokens = lowerQuery
    .split(/[^a-z0-9_]+/i)
    .map((token) => token.trim())
    .filter(Boolean);

  let score = 0;
  if (tool.name.toLowerCase().includes(lowerQuery)) {
    score += 12;
  }
  if (tool.description.toLowerCase().includes(lowerQuery)) {
    score += 6;
  }

  for (const token of queryTokens) {
    if (tool.name.toLowerCase().includes(token)) {
      score += 4;
    }
    if (tool.description.toLowerCase().includes(token)) {
      score += 2;
    }
  }

  return score;
}

function searchToolCatalog(query: string, toolCatalog: ToolCatalogItem[]) {
  return toolCatalog
    .map((tool) => ({ tool, score: scoreTool(query, tool) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return a.tool.name.localeCompare(b.tool.name);
    })
    .slice(0, MAX_SEARCH_RESULTS)
    .map(({ tool }) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    }));
}

async function fetchToolCatalog(env: Env, requestId: string): Promise<ToolCatalogItem[]> {
  try {
    const toolsRes = await env.MCP_SERVICE.fetch(
      new Request("https://mcp.spike.land/tools", {
        headers: { "X-Request-Id": requestId },
      }),
    );

    if (!toolsRes.ok) {
      return [];
    }

    const data = await toolsRes.json<{
      tools: Array<{ name: string; description: string; inputSchema?: unknown }>;
    }>();

    return (data.tools ?? []).map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema ?? { type: "object", properties: {} },
    }));
  } catch {
    return [];
  }
}

async function callMcpTool(
  env: Env,
  requestId: string,
  name: string,
  args: Record<string, unknown>,
) {
  const rpcRes = await env.MCP_SERVICE.fetch(
    new Request("https://mcp.spike.land/mcp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Request-Id": requestId,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: crypto.randomUUID(),
        method: "tools/call",
        params: { name, arguments: args },
      }),
    }),
  );

  if (!rpcRes.ok) {
    throw new Error(`MCP tool call failed with status ${rpcRes.status}`);
  }

  const rpcData = await rpcRes.json<{
    result?: { content?: Array<{ text?: string }> };
    error?: { message: string };
  }>();

  if (rpcData.error) {
    throw new Error(rpcData.error.message);
  }

  if (rpcData.result?.content?.length) {
    return rpcData.result.content.map((item) => item.text ?? "").join("\n");
  }

  return "Tool completed successfully.";
}

async function waitForBrowserResult(
  db: D1Database,
  sessionId: string,
  toolCallId: string,
  userId: string,
) {
  const deadline = Date.now() + BROWSER_RESULT_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const row = await db
      .prepare(
        `SELECT tool_call_id, status, result_json
         FROM spike_chat_browser_results
         WHERE tool_call_id = ? AND session_id = ? AND user_id = ?
         LIMIT 1`,
      )
      .bind(toolCallId, sessionId, userId)
      .first<BrowserResultRow>();

    if (row?.status === "done" && row.result_json) {
      return safeJsonParse<unknown>(row.result_json, row.result_json);
    }

    await new Promise((resolve) => setTimeout(resolve, BROWSER_RESULT_POLL_MS));
  }

  return {
    success: false,
    error: "Timed out waiting for the browser result.",
  };
}

async function executeAgentTool(
  env: Env,
  requestId: string,
  sessionId: string,
  userId: string | undefined,
  toolCallId: string,
  toolName: string,
  toolArgs: Record<string, unknown>,
  toolCatalog: ToolCatalogItem[],
) {
  if (toolName.startsWith("browser_")) {
    if (!userId) {
      return {
        transport: "browser" as const,
        result: "Browser tools require a signed-in spike.land session.",
        status: "error" as const,
      };
    }

    const now = Date.now();
    await env.DB.prepare(
      `INSERT INTO spike_chat_browser_results (
        tool_call_id,
        session_id,
        user_id,
        tool_name,
        args_json,
        status,
        result_json,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, 'pending', NULL, ?, ?)
      ON CONFLICT(tool_call_id) DO UPDATE SET
        args_json = excluded.args_json,
        status = 'pending',
        result_json = NULL,
        updated_at = excluded.updated_at`,
    )
      .bind(toolCallId, sessionId, userId, toolName, JSON.stringify(toolArgs), now, now)
      .run();

    const browserResult = await waitForBrowserResult(env.DB, sessionId, toolCallId, userId);

    return {
      transport: "browser" as const,
      result: serializeToolContent(browserResult),
      status:
        typeof browserResult === "object" &&
        browserResult !== null &&
        "success" in browserResult &&
        browserResult.success === false
          ? ("error" as const)
          : ("done" as const),
    };
  }

  if (toolName === "mcp_tool_search") {
    const query = typeof toolArgs["query"] === "string" ? toolArgs["query"].trim() : "";
    if (!query) {
      return {
        transport: "mcp" as const,
        result: "Search query is required.",
        status: "error" as const,
      };
    }

    return {
      transport: "mcp" as const,
      result: JSON.stringify({ matches: searchToolCatalog(query, toolCatalog) }, null, 2),
      status: "done" as const,
    };
  }

  if (toolName === "mcp_tool_call") {
    const targetName = typeof toolArgs["name"] === "string" ? toolArgs["name"].trim() : "";
    if (!targetName) {
      return {
        transport: "mcp" as const,
        result: "Tool name is required.",
        status: "error" as const,
      };
    }

    if (targetName === "mcp_tool_search" || targetName === "mcp_tool_call") {
      return {
        transport: "mcp" as const,
        result: "Recursive agent tool calls are not allowed.",
        status: "error" as const,
      };
    }

    if (targetName.startsWith("browser_")) {
      return {
        transport: "mcp" as const,
        result: "Browser tools are not available on the spike-chat surface.",
        status: "error" as const,
      };
    }

    if (!toolCatalog.some((tool) => tool.name === targetName)) {
      return {
        transport: "mcp" as const,
        result: `Unknown MCP tool: ${targetName}`,
        status: "error" as const,
      };
    }

    try {
      const result = await callMcpTool(
        env,
        requestId,
        targetName,
        normalizeToolArgs(toolArgs["arguments"]),
      );

      return {
        transport: "mcp" as const,
        result,
        status: "done" as const,
      };
    } catch (error) {
      return {
        transport: "mcp" as const,
        result: `Tool error: ${error instanceof Error ? error.message : "unknown"}`,
        status: "error" as const,
      };
    }
  }

  return {
    transport: "mcp" as const,
    result: `Unknown tool: ${toolName}`,
    status: "error" as const,
  };
}

/** Call Grok (xAI) with OpenAI-compatible format. Non-streaming. */
async function callGrok(
  apiKey: string,
  systemPrompt: string,
  userMessage: string,
  opts: { temperature?: number; maxTokens?: number },
): Promise<string> {
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROK_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: opts.temperature ?? 0.2,
      max_tokens: opts.maxTokens ?? 256,
      stream: false,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`Grok API error ${res.status}: ${errText}`);
    throw new Error(`AI service error (${res.status})`);
  }

  const data = await res.json<{
    choices: Array<{ message: { content: string } }>;
  }>();
  return data.choices[0]?.message.content ?? "";
}

/** Stream Grok response as SSE to the client. Returns the full collected text. */
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

async function streamGrokResponse(
  apiKey: string,
  messages: SpikeChatMessage[],
  sendEvent: (data: unknown) => Promise<void>,
  opts: {
    temperature?: number;
    maxTokens?: number;
    tools?: Array<{
      type: "function";
      function: { name: string; description: string; parameters: unknown };
    }>;
  },
): Promise<{ fullText: string; toolCalls: ParsedToolCall[] }> {
  const body: Record<string, unknown> = {
    model: "grok-4-1",
    messages,
    temperature: opts.temperature ?? 0.2,
    max_tokens: opts.maxTokens ?? 4096,
    stream: true,
  };
  if (opts.tools && opts.tools.length > 0) {
    body["tools"] = opts.tools;
  }

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`Grok streaming API error ${res.status}: ${errText}`);
    throw new Error(`AI service error (${res.status})`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body from Grok");

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

        // Text content
        if (delta.content) {
          fullText += delta.content;
          await sendEvent({ type: "text_delta", text: delta.content });
        }

        // Tool calls (OpenAI format) — track each by index
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
  }>();
  if (!body.message || typeof body.message !== "string") {
    return c.json({ error: "message is required" }, 400);
  }

  if (body.message.length > 8000) {
    return c.json({ error: "message too long (max 8000 characters)" }, 400);
  }

  const apiKey = c.env.XAI_API_KEY;
  if (!apiKey) {
    return c.json({ error: "XAI_API_KEY not configured" }, 503);
  }

  const userId = c.get("userId") as string | undefined;
  const userMessage = body.message.trim();
  const requestId = (c.get("requestId") as string | undefined) ?? crypto.randomUUID();
  const sessionId = `spike-chat-${requestId}`;

  // Load user memory
  const userNotes: UserMemory["notes"] = userId
    ? await fetchUserNotes(c.env.DB, userId).catch((): UserMemory["notes"] => [])
    : [];
  const selectedNotes = selectNotes(userNotes);
  const userMemory: UserMemory = {
    lifeSummary: "",
    notes: selectedNotes,
    currentGoals: [],
  };

  const { stablePrefix, dynamicSuffix } = buildAetherSystemPrompt(userMemory);
  const fullSystemPrompt = dynamicSuffix ? `${stablePrefix}\n\n${dynamicSuffix}` : stablePrefix;

  const toolCatalog = await fetchToolCatalog(c.env, requestId);

  // Set up SSE stream
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  const sendEvent = async (data: unknown) => {
    if (data === "[DONE]") {
      await writer.write(encoder.encode("data: [DONE]\n\n"));
    } else {
      const eventName =
        typeof data === "object" &&
        data !== null &&
        typeof (data as { type?: unknown }).type === "string"
          ? (data as { type: string }).type
          : null;
      if (eventName) {
        await writer.write(encoder.encode(`event: ${eventName}\n`));
      }
      await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    }
  };

  const bgTask = (async () => {
    try {
      await sendEvent({
        type: "context_sync",
        sessionId,
        activeNoteCount: selectedNotes.length,
        totalNoteCount: userNotes.length,
        toolCatalogCount: toolCatalog.length,
        model: GROK_MODEL,
      });

      // --- Stage 1: CLASSIFY ---
      await sendEvent({ type: "stage_update", stage: "classify" });
      let classifiedIntent = "{}";
      try {
        classifiedIntent = await callGrok(apiKey, buildClassifyPrompt(), userMessage, {
          temperature: 0.1,
          maxTokens: 200,
        });
      } catch {
        classifiedIntent = JSON.stringify({
          intent: "conversation",
          domain: "general",
          urgency: "medium",
          suggestedTools: [],
        });
      }

      // --- Stage 2: PLAN ---
      await sendEvent({ type: "stage_update", stage: "plan" });
      let planArtifact = userMessage;
      try {
        const toolNames = [
          "mcp_tool_search",
          "mcp_tool_call",
          `catalog_size_${toolCatalog.length}`,
        ];
        const planPrompt = buildPlanPrompt(classifiedIntent, toolNames);
        const planResult = await callGrok(apiKey, planPrompt, userMessage, {
          temperature: 0.4,
          maxTokens: 1024,
        });
        planArtifact = `## Plan\n${planResult}\n\n## User Message\n${userMessage}`;
      } catch {
        // Fall through with raw user message
      }

      // --- Stage 3: EXECUTE (streamed) ---
      await sendEvent({ type: "stage_update", stage: "execute" });
      const executionMessages = buildSpikeChatMessages(
        fullSystemPrompt,
        body.history,
        planArtifact,
      );
      let assistantResponse = "";

      for (let loop = 0; loop < MAX_TOOL_LOOPS; loop++) {
        const iteration = await streamGrokResponse(apiKey, executionMessages, sendEvent, {
          temperature: 0.2,
          maxTokens: 4096,
          tools: SPIKE_AGENT_TOOLS,
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

          const toolResult = await executeAgentTool(
            c.env,
            requestId,
            sessionId,
            userId,
            toolCall.toolCallId,
            toolCall.name,
            toolCall.args,
            toolCatalog,
          );

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

      // --- Stage 4: EXTRACT ---
      await sendEvent({ type: "stage_update", stage: "extract" });
      await (async () => {
        try {
          const extractResult = await callGrok(
            apiKey,
            buildExtractPrompt(),
            `User: ${userMessage}\n\nAssistant: ${assistantResponse.slice(0, 2000)}`,
            { temperature: 0.2, maxTokens: 256 },
          );
          const extracted = parseExtractedNote(extractResult);
          if (extracted && userId) {
            await saveNote(c.env.DB, userId, {
              id: crypto.randomUUID(),
              trigger: extracted.trigger,
              lesson: extracted.lesson,
              confidence: extracted.confidence,
              helpCount: 0,
              createdAt: Date.now(),
              lastUsedAt: Date.now(),
            });
            await sendEvent({
              type: "memory_update",
              activeNoteCount: selectedNotes.length,
              totalNoteCount: userNotes.length + 1,
              lesson: extracted.lesson,
            });
          }
        } catch {
          // Note extraction is non-critical
        }
      })();
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

export { spikeChat };
