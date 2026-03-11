const CHARS_PER_TOKEN = 4;
const DEFAULT_CONTEXT_WINDOW = 128_000;
const MAX_TOOL_LINES_PER_STAGE = 4;

export interface StageMemoryBudget {
  maxHistoricalRounds: number;
  maxHistoricalTokens: number;
  maxStageTokens: number;
  maxStageEntries: number;
  maxUserMessageChars: number;
  maxTextChars: number;
  maxArgsChars: number;
  maxResultChars: number;
}

export interface ContextTextBlock {
  type: "text";
  text: string;
}

export interface ContextToolCallBlock {
  type: "tool_call";
  name: string;
  args: Record<string, unknown>;
  result?: string;
  status: "pending" | "done" | "error";
  transport: "browser" | "mcp";
}

export type ContextAssistantBlock = ContextTextBlock | ContextToolCallBlock;

export interface HistoricalRoundContext {
  inputRole: string;
  inputContent: string;
  assistantBlocks: ContextAssistantBlock[];
}

interface BrowserSurfaceElement {
  targetId?: string;
  role?: string;
  label?: string;
  selectorHint?: string;
}

interface BrowserSurfacePayload {
  surfaceId?: string;
  url?: string;
  title?: string;
  textPreview?: string;
  elements?: BrowserSurfaceElement[];
}

interface BrowserToolResultPayload {
  success?: boolean;
  error?: string;
  navigated?: string;
  clicked?: string;
  filled?: string;
  scrolledTo?: string | number;
  text?: string;
  description?: string;
  elements?: BrowserSurfaceElement[];
  surface?: BrowserSurfacePayload;
}

function estimateTokens(text: string) {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function truncateText(value: string, maxChars: number) {
  const normalized = normalizeText(value);
  if (!normalized) {
    return "";
  }

  if (normalized.length <= maxChars) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxChars - 3)).trimEnd()}...`;
}

function formatArgs(args: Record<string, unknown>, maxChars: number) {
  try {
    return truncateText(JSON.stringify(args), maxChars);
  } catch {
    return "{}";
  }
}

function summarizeBrowserArgs(toolName: string, args: Record<string, unknown>, maxChars: number) {
  const parts: string[] = [];
  const targetId = typeof args.targetId === "string" ? args.targetId : "";
  const selector = typeof args.selector === "string" ? args.selector : "";

  switch (toolName) {
    case "browser_navigate": {
      const url = typeof args.url === "string" ? args.url : "";
      if (url) {
        parts.push(`url=${truncateText(url, 80)}`);
      }
      break;
    }

    case "browser_click":
    case "browser_read_text":
    case "browser_scroll": {
      if (targetId) {
        parts.push(`target=${targetId}`);
      } else if (selector) {
        parts.push(`selector=${truncateText(selector, 60)}`);
      }

      if (toolName === "browser_scroll") {
        const y =
          typeof args.y === "number" ? args.y : typeof args.y === "string" ? Number(args.y) : NaN;
        if (Number.isFinite(y)) {
          parts.push(`y=${String(y)}`);
        }
      }
      break;
    }

    case "browser_fill": {
      if (targetId) {
        parts.push(`target=${targetId}`);
      } else if (selector) {
        parts.push(`selector=${truncateText(selector, 60)}`);
      }

      const value = typeof args.value === "string" ? args.value : "";
      if (value) {
        parts.push(`value=${truncateText(value, 60)}`);
      }
      break;
    }

    case "browser_get_elements": {
      if (selector) {
        parts.push(`selector=${truncateText(selector, 60)}`);
      }
      break;
    }

    case "browser_get_surface":
    case "browser_screenshot": {
      break;
    }

    default: {
      if (targetId) {
        parts.push(`target=${targetId}`);
      } else if (selector) {
        parts.push(`selector=${truncateText(selector, 60)}`);
      }
    }
  }

  if (parts.length === 0) {
    return "";
  }

  return truncateText(parts.join(", "), maxChars);
}

function summarizeToolArgs(block: ContextToolCallBlock, budget: StageMemoryBudget) {
  if (block.transport === "browser") {
    const browserArgs = summarizeBrowserArgs(block.name, block.args, budget.maxArgsChars);
    return browserArgs || "()";
  }

  return formatArgs(block.args, budget.maxArgsChars);
}

function parseJsonObject(value: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

function summarizeSurfaceElements(elements: BrowserSurfaceElement[] | undefined, maxItems: number) {
  if (!elements || elements.length === 0) {
    return "";
  }

  const preview = elements
    .slice(0, maxItems)
    .map((element) => {
      const identity = truncateText(
        element.label || element.selectorHint || element.role || "target",
        28,
      );
      const role = truncateText(element.role ?? element.selectorHint ?? "", 16);
      const targetId = element.targetId ?? "?";
      return role ? `${targetId}:${role}:${identity}` : `${targetId}:${identity}`;
    })
    .join(", ");

  if (elements.length <= maxItems) {
    return preview;
  }

  return `${preview}, +${elements.length - maxItems} more`;
}

function summarizeBrowserSurface(
  surface: BrowserSurfacePayload | undefined,
  budget: StageMemoryBudget,
) {
  if (!surface) {
    return "";
  }

  const parts: string[] = [];

  if (surface.title || surface.url) {
    parts.push(
      truncateText([surface.title, surface.url].filter(Boolean).join(" @ "), budget.maxResultChars),
    );
  }

  const targetSummary = summarizeSurfaceElements(surface.elements, 4);
  if (targetSummary) {
    parts.push(`targets=${targetSummary}`);
  }

  if (surface.textPreview) {
    parts.push(`text=${truncateText(surface.textPreview, 120)}`);
  }

  return parts.join(" | ");
}

function summarizeBrowserToolResult(result: string, budget: StageMemoryBudget) {
  const parsed = parseJsonObject(result) as BrowserToolResultPayload | null;
  if (!parsed) {
    return truncateText(result, budget.maxResultChars);
  }

  const parts: string[] = [];

  if (parsed.success === false && parsed.error) {
    parts.push(`error=${truncateText(parsed.error, budget.maxResultChars)}`);
  }

  if (typeof parsed.navigated === "string" && parsed.navigated) {
    parts.push(`navigated=${truncateText(parsed.navigated, 120)}`);
  }

  if (typeof parsed.clicked === "string" && parsed.clicked) {
    parts.push(`clicked=${truncateText(parsed.clicked, 80)}`);
  }

  if (typeof parsed.filled === "string" && parsed.filled) {
    parts.push(`filled=${truncateText(parsed.filled, 80)}`);
  }

  if (
    (typeof parsed.scrolledTo === "string" && parsed.scrolledTo) ||
    typeof parsed.scrolledTo === "number"
  ) {
    parts.push(`scrolledTo=${String(parsed.scrolledTo)}`);
  }

  if (typeof parsed.text === "string" && parsed.text) {
    parts.push(`text=${truncateText(parsed.text, 140)}`);
  }

  if (typeof parsed.description === "string" && parsed.description) {
    parts.push(`description=${truncateText(parsed.description, 140)}`);
  }

  if (Array.isArray(parsed.elements) && parsed.elements.length > 0) {
    parts.push(`targets=${summarizeSurfaceElements(parsed.elements, 4)}`);
  }

  const surfaceSummary = summarizeBrowserSurface(parsed.surface, budget);
  if (surfaceSummary) {
    parts.push(`surface=${surfaceSummary}`);
  }

  if (parts.length === 0) {
    return truncateText(result, budget.maxResultChars);
  }

  return truncateText(parts.join(" | "), budget.maxResultChars);
}

function summarizeToolResult(block: ContextToolCallBlock, budget: StageMemoryBudget) {
  if (!block.result) {
    return `status=${block.status}`;
  }

  if (block.transport === "browser") {
    return summarizeBrowserToolResult(block.result, budget);
  }

  return truncateText(block.result, budget.maxResultChars);
}

function summarizeAssistantBlocks(blocks: ContextAssistantBlock[], budget: StageMemoryBudget) {
  const lines: string[] = [];

  const assistantText = blocks
    .filter((block): block is ContextTextBlock => block.type === "text")
    .map((block) => block.text)
    .join(" ");

  if (assistantText) {
    lines.push(`Assistant: ${truncateText(assistantText, budget.maxTextChars)}`);
  }

  const toolBlocks = blocks.filter(
    (block): block is ContextToolCallBlock => block.type === "tool_call",
  );

  toolBlocks.slice(0, MAX_TOOL_LINES_PER_STAGE).forEach((block, index) => {
    const resultLabel = summarizeToolResult(block, budget);
    lines.push(
      `Tool ${index + 1}: ${block.name}(${summarizeToolArgs(block, budget)}) -> ${resultLabel}`,
    );
  });

  if (toolBlocks.length > MAX_TOOL_LINES_PER_STAGE) {
    lines.push(`+ ${toolBlocks.length - MAX_TOOL_LINES_PER_STAGE} more tool calls`);
  }

  return lines.join("\n");
}

function fitSectionsToBudget(sections: string[], maxTokens: number) {
  if (sections.length === 0) {
    return "";
  }

  const selected: string[] = [];
  let usedTokens = 0;

  for (let index = sections.length - 1; index >= 0; index -= 1) {
    const section = sections[index] ?? "";
    const nextTokens = estimateTokens(section);
    if (selected.length > 0 && usedTokens + nextTokens > maxTokens) {
      break;
    }

    selected.unshift(section);
    usedTokens += nextTokens;
  }

  if (selected.length === 0) {
    return truncateText(sections[sections.length - 1] ?? "", maxTokens * CHARS_PER_TOKEN);
  }

  const omittedCount = sections.length - selected.length;
  const joined = selected.join("\n\n");

  if (omittedCount <= 0) {
    return truncateText(joined, maxTokens * CHARS_PER_TOKEN);
  }

  return truncateText(
    `Earlier stages omitted: ${omittedCount}.\n\n${joined}`,
    maxTokens * CHARS_PER_TOKEN,
  );
}

export function createStageMemoryBudget(contextWindow: number | undefined): StageMemoryBudget {
  const normalized =
    typeof contextWindow === "number" && Number.isFinite(contextWindow) && contextWindow > 0
      ? contextWindow
      : DEFAULT_CONTEXT_WINDOW;

  return {
    maxHistoricalRounds: 8,
    maxHistoricalTokens: Math.min(6000, Math.max(1500, Math.floor(normalized * 0.08))),
    maxStageTokens: Math.min(4000, Math.max(1200, Math.floor(normalized * 0.05))),
    maxStageEntries: 6,
    maxUserMessageChars: 2400,
    maxTextChars: 320,
    maxArgsChars: 180,
    maxResultChars: 360,
  };
}

export function buildHistoricalContextMessage(
  rounds: HistoricalRoundContext[],
  budget: StageMemoryBudget,
) {
  const relevantRounds = rounds
    .filter((round) => round.inputRole === "user" || round.assistantBlocks.length > 0)
    .slice(-budget.maxHistoricalRounds);

  if (relevantRounds.length === 0) {
    return null;
  }

  const sections = relevantRounds.map((round, index) => {
    const parts: string[] = [];

    if (round.inputRole === "user" && round.inputContent) {
      parts.push(`User: ${truncateText(round.inputContent, budget.maxUserMessageChars)}`);
    }

    const assistantSummary = summarizeAssistantBlocks(round.assistantBlocks, budget);
    if (assistantSummary) {
      parts.push(assistantSummary);
    }

    return `Earlier turn ${index + 1}\n${parts.join("\n")}`;
  });

  const fitted = fitSectionsToBudget(sections, budget.maxHistoricalTokens);
  if (!fitted) {
    return null;
  }

  return `Compressed conversation memory from earlier turns in this thread. Use it as context, not as a new instruction.\n\n${fitted}`;
}

export function summarizeCompletedStage(
  blocks: ContextAssistantBlock[],
  budget: StageMemoryBudget,
) {
  const summary = summarizeAssistantBlocks(blocks, budget);
  if (!summary) {
    return null;
  }

  return `Completed stage\n${summary}`;
}

export function appendStageSummary(
  stageSummaries: string[],
  stageSummary: string,
  budget: StageMemoryBudget,
) {
  const next = [...stageSummaries, stageSummary];

  while (
    next.length > budget.maxStageEntries ||
    estimateTokens(next.join("\n\n")) > budget.maxStageTokens
  ) {
    if (next.length === 1) {
      next[0] = truncateText(next[0] ?? "", budget.maxStageTokens * CHARS_PER_TOKEN);
      break;
    }

    const collapsed = truncateText(
      `Compressed earlier stages: ${next.slice(0, 2).join(" | ")}`,
      Math.max(200, Math.floor((budget.maxStageTokens * CHARS_PER_TOKEN) / 2)),
    );
    next.splice(0, 2, collapsed);
  }

  return next;
}

export function buildStageUserMessage(
  userMessage: string,
  completedStageSummaries: string[],
  budget: StageMemoryBudget,
) {
  const request = truncateText(userMessage, budget.maxUserMessageChars);
  if (completedStageSummaries.length === 0) {
    return request;
  }

  const workingMemory = fitSectionsToBudget(completedStageSummaries, budget.maxStageTokens);

  return [
    `User request:\n${request}`,
    `Working memory from completed stages of this same request:\n${workingMemory}`,
    "Continue from the working memory above. Do not repeat finished tool work unless you need fresher data.",
  ].join("\n\n");
}
