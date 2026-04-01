import { Hono } from "hono";
import type { Context } from "hono";
import type { Env, Variables } from "../../core-logic/env.js";
import { getChatSystemPrompt } from "../../core-logic/chat-system-prompt.js";
import { getRubik3SystemPrompt } from "../../core-logic/rubik-persona-prompt.js";
import { BROWSER_TOOLS } from "../../core-logic/chat-browser-tools.js";
import {
  appendStageSummary,
  buildHistoricalContextMessage,
  buildStageUserMessage,
  createStageMemoryBudget,
  summarizeCompletedStage,
} from "./chat-stage-memory.js";
import { groupToolExecutionBatches } from "./chat-tool-batching.js";
import { compressMessage, type PrdCompressionConfig } from "../../core-logic/prd-compression.js";
import { fetchToolCatalog, type ToolCatalogItem } from "../../core-logic/mcp-tools.js";
import { safeJsonParse, executeAgentTool } from "../../core-logic/chat-tool-execution.js";

const chat = new Hono<{ Bindings: Env; Variables: Variables }>();

const MAX_TOOL_LOOPS = 10;
const MAX_SEARCH_RESULTS = 8;

type ChatContext = Context<{ Bindings: Env; Variables: Variables }>;

interface ChatRequestBody {
  message?: string;
  threadId?: string;
  persona?: string;
}

interface BrowserResultRequestBody {
  threadId?: string;
  toolCallId?: string;
  result?: unknown;
}

interface ChatThreadRow {
  id: string;
  user_id: string;
  title: string;
  last_prompt_tokens: number | null;
  last_completion_tokens: number | null;
  last_total_tokens: number | null;
  created_at: number;
  updated_at: number;
}

interface ChatRoundRow {
  id: string;
  thread_id: string;
  input_role: string;
  input_content: string;
  assistant_blocks: string;
  assistant_text: string;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  total_tokens: number | null;
  created_at: number;
  updated_at: number;
}

interface UsageSnapshot {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

interface ChatThreadSummaryResponse {
  id: string;
  title: string;
  usage: UsageSnapshot | null;
  createdAt: number;
  updatedAt: number;
}

interface StoredTextBlock {
  type: "text";
  text: string;
}

interface StoredToolCallBlock {
  type: "tool_call";
  toolCallId: string;
  name: string;
  args: Record<string, unknown>;
  result?: string;
  status: "pending" | "done" | "error";
  transport: "browser" | "mcp";
}

type StoredAssistantBlock = StoredTextBlock | StoredToolCallBlock;

interface PendingToolExecution {
  toolCallId: string;
  name: string;
  args: Record<string, unknown>;
  blockIndex: number;
}

type ToolResultContent = {
  type: "tool_result";
  tool_use_id: string;
  content: string;
};

type AnthropicAssistantContent = Array<
  | { type: "text"; text: string }
  | {
      type: "tool_use";
      id: string;
      name: string;
      input: Record<string, unknown>;
    }
>;

type AnthropicUserContent = string | ToolResultContent[];

type AnthropicMessage =
  | { role: "user"; content: AnthropicUserContent }
  | { role: "assistant"; content: AnthropicAssistantContent };

type AnthropicAssistantMessage = Extract<AnthropicMessage, { role: "assistant" }>;
type AnthropicToolResultMessage = { role: "user"; content: ToolResultContent[] };

const MCP_AGENT_TOOLS: Array<{
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}> = [
  ...BROWSER_TOOLS,
  {
    name: "mcp_tool_search",
    description:
      "Search the available MCP tools by natural-language query. Use this before calling a tool you are not already certain about.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "What you need to do or the data you need to find",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "mcp_tool_call",
    description:
      "Call any MCP tool by exact name using a JSON arguments object. Use mcp_tool_search first when you need discovery.",
    input_schema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Exact MCP tool name to call",
        },
        arguments: {
          type: "object",
          description: "JSON arguments to pass to the target tool",
        },
      },
      required: ["name"],
    },
  },
];

function summarizeThreadTitle(message: string): string {
  const trimmed = message.trim().replace(/\s+/g, " ");
  if (trimmed.length <= 80) {
    return trimmed;
  }
  return `${trimmed.slice(0, 77).trimEnd()}...`;
}

function parseAssistantBlocks(value: string): StoredAssistantBlock[] {
  return safeJsonParse<StoredAssistantBlock[]>(value, []);
}

function assistantBlocksToAnthropicContent(
  blocks: StoredAssistantBlock[],
): AnthropicAssistantContent {
  const content: AnthropicAssistantContent = [];

  for (const block of blocks) {
    if (block.type === "text") {
      if (block.text) {
        content.push({ type: "text", text: block.text });
      }
      continue;
    }

    content.push({
      type: "tool_use",
      id: block.toolCallId,
      name: block.name,
      input: block.args,
    });
  }

  return content;
}

function formatUsage(
  promptTokens: number | null,
  completionTokens: number | null,
  totalTokens: number | null,
): UsageSnapshot | null {
  if (
    typeof promptTokens !== "number" ||
    typeof completionTokens !== "number" ||
    typeof totalTokens !== "number"
  ) {
    return null;
  }

  return {
    promptTokens,
    completionTokens,
    totalTokens,
  };
}

function formatThreadSummary(row: ChatThreadRow): ChatThreadSummaryResponse {
  return {
    id: row.id,
    title: row.title,
    usage: formatUsage(row.last_prompt_tokens, row.last_completion_tokens, row.last_total_tokens),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function serializeRoundInput(
  inputRole: "user" | "tool_result",
  inputContent: string | ToolResultContent[],
) {
  if (inputRole === "user") {
    return inputContent as string;
  }

  return JSON.stringify(inputContent);
}

async function getThreadForUser(db: D1Database, threadId: string, userId: string) {
  return db
    .prepare(
      `SELECT id, user_id, title, last_prompt_tokens, last_completion_tokens, last_total_tokens, created_at, updated_at
       FROM chat_threads
       WHERE id = ? AND user_id = ?
       LIMIT 1`,
    )
    .bind(threadId, userId)
    .first<ChatThreadRow>();
}

async function listThreadsForUser(db: D1Database, userId: string) {
  const result = await db
    .prepare(
      `SELECT id, user_id, title, last_prompt_tokens, last_completion_tokens, last_total_tokens, created_at, updated_at
       FROM chat_threads
       WHERE user_id = ?
       ORDER BY updated_at DESC`,
    )
    .bind(userId)
    .all<ChatThreadRow>();

  return result.results ?? [];
}

async function listRoundsForThread(db: D1Database, threadId: string) {
  const result = await db
    .prepare(
      `SELECT id, thread_id, input_role, input_content, assistant_blocks, assistant_text, prompt_tokens, completion_tokens, total_tokens, created_at, updated_at
       FROM chat_rounds
       WHERE thread_id = ?
       ORDER BY created_at ASC`,
    )
    .bind(threadId)
    .all<ChatRoundRow>();

  return result.results ?? [];
}

async function createThread(
  db: D1Database,
  userId: string,
  message: string,
  _persona?: string,
): Promise<ChatThreadSummaryResponse> {
  const now = Date.now();
  const threadId = crypto.randomUUID();

  await db
    .prepare(
      `INSERT INTO chat_threads (
        id,
        user_id,
        title,
        last_prompt_tokens,
        last_completion_tokens,
        last_total_tokens,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, NULL, NULL, NULL, ?, ?)`,
    )
    .bind(threadId, userId, summarizeThreadTitle(message), now, now)
    .run();

  return {
    id: threadId,
    title: summarizeThreadTitle(message),
    usage: null,
    createdAt: now,
    updatedAt: now,
  };
}

async function insertRound(
  db: D1Database,
  params: {
    threadId: string;
    userId: string;
    inputRole: "user" | "tool_result";
    inputContent: string | ToolResultContent[];
    assistantBlocks: StoredAssistantBlock[];
    usage: UsageSnapshot | null;
  },
) {
  const now = Date.now();
  const assistantText = params.assistantBlocks
    .filter((block): block is StoredTextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  await db
    .prepare(
      `INSERT INTO chat_rounds (
        id,
        thread_id,
        user_id,
        input_role,
        input_content,
        assistant_blocks,
        assistant_text,
        prompt_tokens,
        completion_tokens,
        total_tokens,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      crypto.randomUUID(),
      params.threadId,
      params.userId,
      params.inputRole,
      serializeRoundInput(params.inputRole, params.inputContent),
      JSON.stringify(params.assistantBlocks),
      assistantText,
      params.usage?.promptTokens ?? null,
      params.usage?.completionTokens ?? null,
      params.usage?.totalTokens ?? null,
      now,
      now,
    )
    .run();
}

async function updateThreadUsage(db: D1Database, threadId: string, usage: UsageSnapshot | null) {
  await db
    .prepare(
      `UPDATE chat_threads
       SET last_prompt_tokens = ?,
           last_completion_tokens = ?,
           last_total_tokens = ?,
           updated_at = ?
       WHERE id = ?`,
    )
    .bind(
      usage?.promptTokens ?? null,
      usage?.completionTokens ?? null,
      usage?.totalTokens ?? null,
      Date.now(),
      threadId,
    )
    .run();
}

function createSseSender(writer: WritableStreamDefaultWriter<Uint8Array>) {
  const encoder = new TextEncoder();

  return async function sendSseEvent(eventName: string, payload: Record<string, unknown> = {}) {
    const message = {
      type: eventName,
      ...payload,
    };

    await writer.write(encoder.encode(`event: ${eventName}\ndata: ${JSON.stringify(message)}\n\n`));
  };
}

async function executeTool(params: {
  c: ChatContext;
  threadId: string;
  userId: string;
  requestId: string;
  toolName: string;
  toolCallId: string;
  toolArgs: Record<string, unknown>;
  toolCatalog: ToolCatalogItem[];
  sendSseEvent: (eventName: string, payload?: Record<string, unknown>) => Promise<void>;
}) {
  const {
    c,
    threadId,
    userId,
    requestId,
    toolName,
    toolCallId,
    toolArgs,
    toolCatalog,
    sendSseEvent,
  } = params;

  return executeAgentTool({
    mcpService: c.env.MCP_SERVICE,
    db: c.env.DB,
    requestId,
    contextId: threadId,
    userId,
    toolCallId,
    toolName,
    toolArgs,
    toolCatalog,
    tableName: "chat_browser_results",
    contextIdColumn: "thread_id",
    maxSearchResults: MAX_SEARCH_RESULTS,
    onBrowserInsert: async (tcId, tn, ta) => {
      await sendSseEvent("browser_command", {
        threadId,
        toolCallId: tcId,
        tool: tn,
        args: ta,
      });
    },
    githubToken: c.env.GITHUB_TOKEN,
  });
}

chat.get("/api/chat/threads", async (c) => {
  const userId = c.get("userId");
  const threads = await listThreadsForUser(c.env.DB, userId);

  return c.json({
    threads: threads.map(formatThreadSummary),
  });
});

chat.get("/api/chat/threads/:threadId", async (c) => {
  const userId = c.get("userId");
  const threadId = c.req.param("threadId");

  const thread = await getThreadForUser(c.env.DB, threadId, userId);
  if (!thread) {
    return c.json({ error: "Thread not found" }, 404);
  }

  const rounds = await listRoundsForThread(c.env.DB, threadId);

  return c.json({
    thread: formatThreadSummary(thread),
    rounds: rounds.map((round) => ({
      id: round.id,
      inputRole: round.input_role,
      inputContent: round.input_role === "user" ? round.input_content : null,
      assistantBlocks: parseAssistantBlocks(round.assistant_blocks),
      assistantText: round.assistant_text,
      usage: formatUsage(round.prompt_tokens, round.completion_tokens, round.total_tokens),
      createdAt: round.created_at,
      updatedAt: round.updated_at,
    })),
  });
});

chat.post("/api/chat/browser-results", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<BrowserResultRequestBody>();

  if (!body.threadId || !body.toolCallId) {
    return c.json({ error: "threadId and toolCallId are required" }, 400);
  }

  const thread = await getThreadForUser(c.env.DB, body.threadId, userId);
  if (!thread) {
    return c.json({ error: "Thread not found" }, 404);
  }

  const result = await c.env.DB.prepare(
    `UPDATE chat_browser_results
     SET status = 'done',
         result_json = ?,
         updated_at = ?
     WHERE tool_call_id = ? AND thread_id = ? AND user_id = ?`,
  )
    .bind(JSON.stringify(body.result ?? null), Date.now(), body.toolCallId, body.threadId, userId)
    .run();

  if ((result.meta.changes ?? 0) === 0) {
    return c.json({ error: "Browser result not found" }, 404);
  }

  return c.json({ ok: true });
});

chat.post("/api/chat", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<ChatRequestBody>();

  if (!body.message || typeof body.message !== "string" || !body.message.trim()) {
    return c.json({ error: "message is required" }, 400);
  }

  const requestId = (c.get("requestId") as string | undefined) ?? crypto.randomUUID();
  const rawMessage = body.message.trim();
  const persona = typeof body.persona === "string" ? body.persona.trim() : undefined;

  const prdConfig: PrdCompressionConfig = {
    mode: (c.env.PRD_COMPRESSION_MODE as PrdCompressionConfig["mode"]) ?? "auto",
    geminiApiKey: c.env.GEMINI_API_KEY,
  };
  const compression = await compressMessage(rawMessage, prdConfig);
  const message = compression.formattedMessage;

  const existingThreadId = body.threadId;
  const threadSummary = existingThreadId
    ? await (async () => {
        const existingThread = await getThreadForUser(c.env.DB, existingThreadId, userId);
        if (!existingThread) {
          return null;
        }
        return formatThreadSummary(existingThread);
      })()
    : await createThread(c.env.DB, userId, rawMessage, persona);

  if (!threadSummary) {
    return c.json({ error: "Thread not found" }, 404);
  }

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const sendSseEvent = createSseSender(writer);
  const encoder = new TextEncoder();

  const bgTask = (async () => {
    try {
      const toolCatalog = await fetchToolCatalog(c.env.MCP_SERVICE, requestId);
      const priorRounds = await listRoundsForThread(c.env.DB, threadSummary.id);
      const configuredContextWindow = Number.parseInt(c.env.LLM_CONTEXT_WINDOW ?? "", 10);
      const stageBudget = createStageMemoryBudget(
        Number.isFinite(configuredContextWindow) && configuredContextWindow > 0
          ? configuredContextWindow
          : undefined,
      );
      const historicalContextMessage = buildHistoricalContextMessage(
        priorRounds.map((round) => ({
          inputRole: round.input_role,
          inputContent: round.input_role === "user" ? round.input_content : "",
          assistantBlocks: parseAssistantBlocks(round.assistant_blocks),
        })),
        stageBudget,
      );
      const baseMessages: AnthropicMessage[] = historicalContextMessage
        ? [{ role: "user", content: historicalContextMessage }]
        : [];

      let toolLoopCount = 0;
      let currentInputRole: "user" | "tool_result" = "user";
      let currentInputContent: string | ToolResultContent[] = message;
      let aggregateUsage: UsageSnapshot | null = null;
      let completedStageSummaries: string[] = [];
      let latestStageProtocol: {
        assistant: AnthropicAssistantMessage;
        toolResults: AnthropicToolResultMessage;
        summary: string | null;
      } | null = null;

      await sendSseEvent("thread", {
        thread: threadSummary,
      });

      if (compression.compressed && c.env.PRD_COMPRESSION_EXPOSE === "true") {
        await sendSseEvent("prd_compression", {
          tier: compression.tier,
          prd: compression.prd,
          originalTokenEstimate: compression.originalTokenEstimate,
          compressedTokenEstimate: compression.compressedTokenEstimate,
        });
      }

      while (toolLoopCount <= MAX_TOOL_LOOPS) {
        const stageMessages: AnthropicMessage[] = [
          ...baseMessages,
          {
            role: "user",
            content: buildStageUserMessage(message, completedStageSummaries, stageBudget),
          },
          ...(latestStageProtocol
            ? [latestStageProtocol.assistant, latestStageProtocol.toolResults]
            : []),
        ];

        const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": c.env.CLAUDE_OAUTH_TOKEN,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-6",
            max_tokens: 4096,
            system: persona === "rubik-3" ? getRubik3SystemPrompt() : getChatSystemPrompt(),
            tools: MCP_AGENT_TOOLS,
            messages: stageMessages,
            stream: true,
          }),
        });

        if (!anthropicRes.ok) {
          await sendSseEvent("error", {
            error: `Anthropic API error: ${anthropicRes.status}`,
          });
          break;
        }

        const reader = anthropicRes.body?.getReader();
        if (!reader) {
          await sendSseEvent("error", { error: "Missing response body from Anthropic." });
          break;
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let currentToolName = "";
        let currentToolId = "";
        let toolInputJson = "";
        let hasToolUse = false;
        let currentPromptTokens = 0;
        let currentCompletionTokens = 0;
        const toolResults: ToolResultContent[] = [];
        const assistantBlocks: StoredAssistantBlock[] = [];
        const pendingToolExecutions: PendingToolExecution[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) {
              continue;
            }

            const rawData = line.slice(6).trim();
            if (!rawData || rawData === "[DONE]") {
              continue;
            }

            try {
              const event = JSON.parse(rawData) as {
                type: string;
                message?: { usage?: { input_tokens?: number } };
                usage?: { output_tokens?: number };
                content_block?: { type: string; name?: string; id?: string };
                delta?: { type: string; text?: string; partial_json?: string };
              };

              if (event.type === "message_start") {
                currentPromptTokens = event.message?.usage?.input_tokens ?? currentPromptTokens;
                continue;
              }

              if (event.type === "message_delta") {
                currentCompletionTokens = event.usage?.output_tokens ?? currentCompletionTokens;
                continue;
              }

              if (event.type === "content_block_start") {
                const block = event.content_block;
                if (block?.type === "text") {
                  assistantBlocks.push({ type: "text", text: "" });
                } else if (block?.type === "tool_use") {
                  currentToolName = block.name ?? "";
                  currentToolId = block.id ?? crypto.randomUUID();
                  toolInputJson = "";
                  hasToolUse = true;
                }
                continue;
              }

              if (event.type === "content_block_delta") {
                const delta = event.delta;
                if (delta?.type === "text_delta" && delta.text) {
                  const lastBlock = assistantBlocks[assistantBlocks.length - 1];
                  if (lastBlock?.type === "text") {
                    lastBlock.text += delta.text;
                  } else {
                    assistantBlocks.push({ type: "text", text: delta.text });
                  }

                  await sendSseEvent("text_delta", { text: delta.text });
                } else if (delta?.type === "input_json_delta" && delta.partial_json) {
                  toolInputJson += delta.partial_json;
                }
                continue;
              }

              if (event.type === "content_block_stop" && currentToolName && currentToolId) {
                const toolArgs = safeJsonParse<Record<string, unknown>>(toolInputJson || "{}", {});
                const initialBlock: StoredToolCallBlock = {
                  type: "tool_call",
                  toolCallId: currentToolId,
                  name: currentToolName,
                  args: toolArgs,
                  status: "pending",
                  transport: currentToolName.startsWith("browser_") ? "browser" : "mcp",
                };

                assistantBlocks.push(initialBlock);
                pendingToolExecutions.push({
                  toolCallId: currentToolId,
                  name: currentToolName,
                  args: toolArgs,
                  blockIndex: assistantBlocks.length - 1,
                });

                await sendSseEvent("tool_call_start", {
                  toolCallId: currentToolId,
                  name: currentToolName,
                  args: toolArgs,
                  transport: initialBlock.transport,
                });

                currentToolName = "";
                currentToolId = "";
                toolInputJson = "";
              }
            } catch {
              // Skip malformed Anthropic SSE events.
            }
          }
        }

        for (const batch of groupToolExecutionBatches(pendingToolExecutions)) {
          const batchResults = await Promise.all(
            batch.map((pending) =>
              executeTool({
                c,
                threadId: threadSummary.id,
                userId,
                requestId,
                toolName: pending.name,
                toolCallId: pending.toolCallId,
                toolArgs: pending.args,
                toolCatalog,
                sendSseEvent,
              }),
            ),
          );

          batch.forEach((pending, index) => {
            const toolResult = batchResults[index];
            if (!toolResult) {
              return;
            }

            const block = assistantBlocks[pending.blockIndex];
            if (block?.type === "tool_call" && block.toolCallId === pending.toolCallId) {
              block.result = toolResult.result;
              block.status = toolResult.status;
              block.transport = toolResult.transport;
            }

            toolResults.push({
              type: "tool_result",
              tool_use_id: pending.toolCallId,
              content: toolResult.result,
            });
          });

          for (const [index, pending] of batch.entries()) {
            const toolResult = batchResults[index];
            if (!toolResult) {
              continue;
            }

            await sendSseEvent("tool_call_end", {
              toolCallId: pending.toolCallId,
              name: pending.name,
              result: toolResult.result,
              status: toolResult.status,
              transport: toolResult.transport,
            });
          }
        }

        const usage =
          currentPromptTokens > 0 || currentCompletionTokens > 0
            ? {
                promptTokens: currentPromptTokens,
                completionTokens: currentCompletionTokens,
                totalTokens: currentPromptTokens + currentCompletionTokens,
              }
            : null;

        if (usage) {
          const prevCompletionTokens: number = aggregateUsage?.completionTokens ?? 0;
          aggregateUsage = {
            promptTokens: usage.promptTokens,
            completionTokens: prevCompletionTokens + usage.completionTokens,
            totalTokens: usage.promptTokens + prevCompletionTokens + usage.completionTokens,
          };
        }

        await insertRound(c.env.DB, {
          threadId: threadSummary.id,
          userId,
          inputRole: currentInputRole,
          inputContent: currentInputContent,
          assistantBlocks,
          usage,
        });

        if (hasToolUse && toolResults.length > 0 && toolLoopCount < MAX_TOOL_LOOPS) {
          if (latestStageProtocol?.summary) {
            completedStageSummaries = appendStageSummary(
              completedStageSummaries,
              latestStageProtocol.summary,
              stageBudget,
            );
          }

          latestStageProtocol = {
            assistant: {
              role: "assistant",
              content: assistantBlocksToAnthropicContent(assistantBlocks),
            },
            toolResults: {
              role: "user",
              content: toolResults,
            },
            summary: summarizeCompletedStage(assistantBlocks, stageBudget),
          };

          currentInputRole = "tool_result";
          currentInputContent = toolResults;
          toolLoopCount += 1;
          continue;
        }

        break;
      }

      await updateThreadUsage(c.env.DB, threadSummary.id, aggregateUsage);

      if (aggregateUsage) {
        await sendSseEvent("usage", {
          promptTokens: aggregateUsage.promptTokens,
          completionTokens: aggregateUsage.completionTokens,
          totalTokens: aggregateUsage.totalTokens,
        });
      }

      await sendSseEvent("done", { threadId: threadSummary.id });
    } catch (error) {
      try {
        await sendSseEvent("error", {
          error: error instanceof Error ? error.message : "Internal error",
        });
      } catch {
        // Writer may already be closed.
      }
    } finally {
      await writer.write(encoder.encode("data: [DONE]\n\n"));
      await writer.close();
    }
  })();

  try {
    c.executionCtx.waitUntil(bgTask);
  } catch {
    // No ExecutionContext in tests.
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

const DESIGN_VARIANTS = [
  {
    id: "dense-grid",
    name: "Dense Grid",
    focus:
      "Maximum content density with masonry layout. Pack information tight, use compact cards, minimize whitespace.",
  },
  {
    id: "editorial",
    name: "Editorial",
    focus:
      "Magazine-style layout with large typography, generous white space, pull quotes, and editorial photography.",
  },
  {
    id: "terminal",
    name: "Terminal",
    focus:
      "Monospace-first, dark theme, terminal aesthetics. Feels like a dev tool with command-line influences.",
  },
  {
    id: "glassmorphism",
    name: "Glassmorphism",
    focus:
      "Full glass effects on all surfaces. Backdrop blur, translucent panels, layered depth with frosted glass.",
  },
  {
    id: "obsidian",
    name: "Obsidian",
    focus:
      "Dark-only design using the obsidian palette. Deep midnight blues, subtle gradients, no light mode.",
  },
  {
    id: "phone-compact",
    name: "Phone Compact",
    focus:
      "Optimized for 375px iPhone screens. Every pixel counts, thumb-friendly targets, no wasted space.",
  },
  {
    id: "4k-expanse",
    name: "4K Expanse",
    focus:
      "Full 3840px width utilization. Multi-column layouts, data-dense grids, wide content areas.",
  },
  {
    id: "kinetic-type",
    name: "Kinetic Type",
    focus:
      "Heavy variable font animations. Weight transitions, text reveals, scroll-driven typography effects.",
  },
  {
    id: "card-world",
    name: "Card World",
    focus:
      "Everything is a card. Nested cards, card grids, card stacks. Consistent rounded corners and shadows.",
  },
  {
    id: "command-first",
    name: "Command First",
    focus:
      "Keyboard-first interface. Spotlight search, command palette, keyboard shortcuts, minimal mouse interaction.",
  },
  {
    id: "store-forward",
    name: "Store Forward",
    focus:
      "Apps as the homepage. Store catalog front and center, featured apps, category browsing as primary navigation.",
  },
  {
    id: "blog-forward",
    name: "Blog Forward",
    focus:
      "Content as the primary surface. Blog posts, articles, documentation as the main experience.",
  },
  {
    id: "chat-forward",
    name: "Chat Forward",
    focus:
      "Conversation as the main interface. Chat-first design, persistent thread sidebar, inline tool results.",
  },
  {
    id: "dashboard-pro",
    name: "Dashboard Pro",
    focus:
      "Analytics and metrics as hero content. Charts, graphs, real-time data, status indicators.",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    focus:
      "Conservative, trust-first design. Professional, clean, no experimental effects. SOC2-audit-friendly aesthetics.",
  },
  {
    id: "playful",
    name: "Playful",
    focus:
      "Bouncy animations, bright colors, casual tone. Rounded shapes, playful icons, friendly micro-interactions.",
  },
];

chat.post("/api/chat/seed-variants", async (c) => {
  const userId = c.get("userId");
  const now = Date.now();
  const seeded: Array<{ id: string; variantId: string; name: string }> = [];

  for (const variant of DESIGN_VARIANTS) {
    const threadId = crypto.randomUUID();
    await c.env.DB.prepare(
      `INSERT INTO chat_threads (id, user_id, title, last_prompt_tokens, last_completion_tokens, last_total_tokens, created_at, updated_at)
       VALUES (?, ?, ?, NULL, NULL, NULL, ?, ?)`,
    )
      .bind(threadId, userId, `Design Variant: ${variant.name}`, now, now)
      .run();

    const seedMessage = `You are exploring the "${variant.name}" design variant for spike.land. Focus: ${variant.focus}\n\nGenerate a detailed design proposal for spike.land using this aesthetic direction. Include specific CSS changes, component modifications, and layout adjustments for all 4 target viewports (iPhone 13 Mini 375px, iPad 810px, Desktop 1440px, 4K 3840px).`;

    await c.env.DB.prepare(
      `INSERT INTO chat_rounds (id, thread_id, user_id, input_role, input_content, assistant_blocks, assistant_text, prompt_tokens, completion_tokens, total_tokens, created_at, updated_at)
       VALUES (?, ?, ?, 'user', ?, '[]', '', NULL, NULL, NULL, ?, ?)`,
    )
      .bind(crypto.randomUUID(), threadId, userId, seedMessage, now, now)
      .run();

    seeded.push({ id: threadId, variantId: variant.id, name: variant.name });
  }

  return c.json({ variants: seeded });
});

chat.get("/api/chat/design-variants", (_c) => {
  return _c.json({ variants: DESIGN_VARIANTS });
});

export { chat };
