/**
 * Slash command registry for the chat REPL.
 * Handles built-in commands and direct MCP tool invocation via `/tool_name`.
 */

import type { Interface as ReadlineInterface } from "node:readline";
import type { ChatClient, Message } from "./client";
import type { NamespacedTool, ServerManager } from "../multiplexer/server-manager";
import { executeToolCall, extractDefaults, getRequiredParams } from "./tool-adapter";
import { fuzzyFilter, fuzzyScore } from "../util/fuzzy";
import { bold, cyan, dim, green, yellow } from "../shell/formatter";
import type { AppRegistry } from "./app-registry";
import { CONFIG_PREREQUISITES, SessionState } from "./session-state";
import { extractPrefix, stripNamespace } from "./tool-grouping";
import { formatAppGroupedTools, formatAppsList, formatGroupedTools } from "./tool-formatting";
import { coerceValue, extractIdsFromResult, promptForParam } from "./tool-interaction";

// Re-export types and utilities used by consumers
export type { ToolGroup, AppToolGroup } from "./tool-grouping";
export {
  extractPrefix,
  groupToolsByPrefix,
  groupToolsByApp,
  getVisibleTools,
  getVisibleToolsEnhanced,
  isEntryPointTool,
  stripNamespace,
} from "./tool-grouping";
export { SessionState } from "./session-state";

/** Parsed slash command input. */
export interface ParsedSlashInput {
  command: string;
  argsRaw: string;
}

/** Context passed to the slash command handler. */
export interface SlashCommandContext {
  manager: ServerManager;
  client: ChatClient;
  messages: Message[];
  sessionState: SessionState;
  appRegistry?: AppRegistry;
  rl?: ReadlineInterface;
}

/** Result of handling a slash command. */
export interface SlashCommandResult {
  /** Text to display to the user. Empty string means nothing to print. */
  output: string;
  /** If true, the REPL should exit. */
  exit: boolean;
  /** If true, the conversation was cleared. */
  cleared: boolean;
}

/**
 * Parse a slash input string into command name and optional raw args.
 * Examples:
 *   "/tools" → { command: "tools", argsRaw: "" }
 *   "/tools chess" → { command: "tools", argsRaw: "chess" }
 *   '/chess_create_game {"time_control": "RAPID_10"}' → { command: "chess_create_game", argsRaw: '{"time_control": "RAPID_10"}' }
 */
export function parseSlashInput(input: string): ParsedSlashInput {
  const withoutSlash = input.slice(1);
  const spaceIndex = withoutSlash.indexOf(" ");
  if (spaceIndex === -1) {
    return { command: withoutSlash.trim(), argsRaw: "" };
  }
  return {
    command: withoutSlash.slice(0, spaceIndex).trim(),
    argsRaw: withoutSlash.slice(spaceIndex + 1).trim(),
  };
}

/** Built-in command names that don't map to tool invocations. */
const BUILTIN_COMMANDS = new Set([
  "tools",
  "apps",
  "servers",
  "clear",
  "model",
  "help",
  "quit",
  "exit",
]);

/**
 * Handle a slash command. Returns a SlashCommandResult.
 */
export async function handleSlashCommand(
  input: string,
  ctx: SlashCommandContext,
): Promise<SlashCommandResult> {
  const { command, argsRaw } = parseSlashInput(input);

  // Built-in commands
  if (BUILTIN_COMMANDS.has(command)) {
    return handleBuiltinCommand(command, argsRaw, ctx);
  }

  // Direct tool invocation
  return handleDirectToolCall(command, argsRaw, ctx);
}

function handleBuiltinCommand(
  command: string,
  argsRaw: string,
  ctx: SlashCommandContext,
): SlashCommandResult {
  const { manager, client, messages, sessionState, appRegistry } = ctx;

  switch (command) {
    case "tools": {
      const tools = manager.getAllTools();
      if (tools.length === 0) {
        return { output: "No tools available.", exit: false, cleared: false };
      }

      const filter = argsRaw || undefined;

      // Use app-grouped display when registry is available and has apps
      if (appRegistry && appRegistry.getAllApps().length > 0) {
        const output = formatAppGroupedTools(tools, sessionState, appRegistry, filter);
        return { output, exit: false, cleared: false };
      }

      // Fallback to prefix-grouped display
      const output = formatGroupedTools(tools, sessionState, filter);
      return { output, exit: false, cleared: false };
    }

    case "apps": {
      if (!appRegistry) {
        return {
          output: "No app registry available.",
          exit: false,
          cleared: false,
        };
      }
      const output = formatAppsList(appRegistry);
      return { output, exit: false, cleared: false };
    }

    case "servers": {
      const names = manager.getServerNames();
      if (names.length === 0) {
        return { output: "No servers connected.", exit: false, cleared: false };
      }
      const lines = names.map((name) => {
        const count = manager.getServerTools(name).length;
        return `  ${bold(name)} (${count} tools)`;
      });
      return {
        output: `${bold("Servers:")}\n${lines.join("\n")}`,
        exit: false,
        cleared: false,
      };
    }

    case "clear":
      messages.length = 0;
      return { output: "Conversation cleared.", exit: false, cleared: true };

    case "model":
      if (argsRaw) {
        return {
          output: `Model is fixed for this session: ${client.model}`,
          exit: false,
          cleared: false,
        };
      }
      return {
        output: `Current model: ${bold(client.model)}`,
        exit: false,
        cleared: false,
      };

    case "help":
      return {
        output: `${bold("Commands:")}
  ${cyan("/tools")}${dim(" [filter]")}  List tools (filter by app, prefix, or category)
  ${cyan("/apps")}          List registered store apps
  ${cyan("/servers")}       List connected servers
  ${cyan("/clear")}         Clear conversation history
  ${cyan("/model")}         Show current model
  ${cyan("/help")}          Show this help
  ${cyan("/quit")}          Exit

${bold("Direct tool invocation:")}
  ${cyan("/<tool_name>")}${dim(" [json-args]")}  Invoke an MCP tool directly
  ${dim('  Example: /chess_create_game {"time_control": "RAPID_10"}')}
  ${dim("  Defaults from schema are applied automatically")}
  ${dim("  IDs from previous results are auto-filled")}
  ${dim("  Fuzzy matching resolves partial names")}`,
        exit: false,
        cleared: false,
      };

    case "quit":
    case "exit":
      return { output: "", exit: true, cleared: false };

    default:
      return {
        output: `Unknown command: /${command}`,
        exit: false,
        cleared: false,
      };
  }
}

async function handleDirectToolCall(
  command: string,
  argsRaw: string,
  ctx: SlashCommandContext,
): Promise<SlashCommandResult> {
  const { manager, sessionState, rl } = ctx;
  const allTools = manager.getAllTools();

  // Resolve tool by exact match or fuzzy match
  const resolved = resolveToolName(command, allTools);
  if (!resolved) {
    return {
      output: `${yellow("No matching tool found for:")} /${command}\nType ${dim(
        "/tools",
      )} to see available tools.`,
      exit: false,
      cleared: false,
    };
  }

  const tool = resolved;
  const schema = tool.inputSchema;

  // Parse user-supplied JSON args
  let userArgs: Record<string, unknown> = {};
  if (argsRaw) {
    try {
      userArgs = JSON.parse(argsRaw);
    } catch {
      return {
        output: `${yellow(
          "Invalid JSON args:",
        )} ${argsRaw}\nExpected format: /tool_name {"key": "value"}`,
        exit: false,
        cleared: false,
      };
    }
  }

  // Merge defaults with user args
  const defaults = extractDefaults(schema);
  const mergedArgs: Record<string, unknown> = { ...defaults, ...userArgs };

  // Auto-fill ID params from session state
  const required = (schema.required as string[] | undefined) ?? [];
  const autoFilled: string[] = [];
  for (const paramName of required) {
    if (paramName in mergedArgs && mergedArgs[paramName] !== undefined) {
      continue;
    }
    if (paramName.endsWith("_id") || paramName === "id") {
      const latestId = sessionState.getLatestId(paramName);
      if (latestId) {
        mergedArgs[paramName] = latestId;
        autoFilled.push(`${paramName}=${latestId}`);
      }
    }
  }

  if (autoFilled.length > 0) {
    console.error(dim(`  auto-filled ${autoFilled.join(", ")}`));
  }

  // Check for missing required params
  const missingParams = getRequiredParams(schema).filter(
    (p) => !(p.name in mergedArgs) || mergedArgs[p.name] === undefined,
  );

  // If we have a readline interface and missing params, prompt interactively
  if (missingParams.length > 0 && rl) {
    console.error(dim(`\nMissing required parameters for ${tool.namespacedName}:`));
    for (const param of missingParams) {
      const value = await promptForParam(rl, param);
      if (!value) {
        return {
          output: `${yellow("Cancelled:")} missing required parameter "${param.name}"`,
          exit: false,
          cleared: false,
        };
      }
      mergedArgs[param.name] = coerceValue(value, param.type);
    }
  } else if (missingParams.length > 0) {
    // No readline available, show usage
    const paramList = missingParams
      .map((p) => `  ${bold(p.name)} (${p.type})${p.description ? ": " + p.description : ""}`)
      .join("\n");
    return {
      output: `${yellow("Missing required parameters:")}\n${paramList}\n\nUsage: /${command} {"${
        missingParams[0]!.name
      }": "value"}`,
      exit: false,
      cleared: false,
    };
  }

  // Execute the tool
  console.error(dim(`\n[calling ${tool.namespacedName}...]`));
  const { result, isError } = await executeToolCall(manager, tool.namespacedName, mergedArgs);

  // Track IDs in session state from result
  if (!isError) {
    sessionState.recordIds(result);
  }

  // Track config tools in session state
  const strippedName = stripNamespace(tool.namespacedName, tool.serverName);
  if (strippedName in CONFIG_PREREQUISITES) {
    sessionState.recordConfigCall(strippedName);
  }

  // Track create tools in session state
  const prefix = extractPrefix(tool.namespacedName, tool.serverName);
  if (tool.namespacedName.includes("create") || tool.namespacedName.includes("bootstrap")) {
    const ids = extractIdsFromResult(result);
    if (ids.length > 0) {
      sessionState.recordCreate(prefix, ids);
    } else {
      // Even without IDs, record that a create was called
      sessionState.recordCreate(prefix, ["_created"]);
    }
  }

  // Format output
  const status = isError ? yellow("Error") : green("OK");
  let formattedResult: string;
  try {
    const parsed = JSON.parse(result);
    formattedResult = JSON.stringify(parsed, null, 2);
  } catch {
    formattedResult = result;
  }

  return {
    output: `${status} ${dim(tool.namespacedName)}\n${formattedResult}`,
    exit: false,
    cleared: false,
  };
}

/**
 * Resolve a command string to a NamespacedTool.
 * First tries exact match (with or without namespace), then fuzzy match.
 * Auto-executes best fuzzy match if it's significantly better than runner-up (2x score gap).
 */
function resolveToolName(command: string, tools: NamespacedTool[]): NamespacedTool | null {
  // Exact match on namespacedName
  const exact = tools.find((t) => t.namespacedName === command);
  if (exact) return exact;

  // Exact match on original name
  const exactOriginal = tools.find((t) => t.originalName === command);
  if (exactOriginal) return exactOriginal;

  // Exact match stripping namespace prefix
  const exactStripped = tools.find((t) => {
    const stripped = stripNamespace(t.namespacedName, t.serverName);
    return stripped === command;
  });
  if (exactStripped) return exactStripped;

  // Fuzzy match
  const fuzzyResults = fuzzyFilter(command, tools, (t) => {
    const stripped = stripNamespace(t.namespacedName, t.serverName);
    return stripped;
  });

  if (fuzzyResults.length === 0) return null;

  if (fuzzyResults.length === 1) return fuzzyResults[0] ?? null;

  // Auto-execute if best match is significantly better (2x score gap)
  const bestScore = fuzzyScore(
    command,
    stripNamespace(fuzzyResults[0]!.namespacedName, fuzzyResults[0]!.serverName),
  );
  const runnerUpScore = fuzzyScore(
    command,
    stripNamespace(fuzzyResults[1]!.namespacedName, fuzzyResults[1]!.serverName),
  );

  if (bestScore >= runnerUpScore * 2) {
    return fuzzyResults[0] ?? null;
  }

  // Ambiguous — still return best match with a note logged
  return fuzzyResults[0] ?? null;
}

/**
 * Hook for the agent loop to track tool calls and update session state.
 * Call this from onToolCallEnd in the agent loop.
 */
export function trackToolCallForSession(
  toolName: string,
  result: string,
  isError: boolean,
  allTools: NamespacedTool[],
  sessionState: SessionState,
): void {
  if (isError) return;

  const tool = allTools.find((t) => t.namespacedName === toolName);
  if (!tool) return;

  // Record IDs from result
  sessionState.recordIds(result);

  // Track config tools
  const stripped = stripNamespace(toolName, tool.serverName);
  if (stripped in CONFIG_PREREQUISITES) {
    sessionState.recordConfigCall(stripped);
  }

  if (toolName.includes("create") || toolName.includes("bootstrap")) {
    const prefix = extractPrefix(toolName, tool.serverName);
    const ids = extractIdsFromResult(result);
    if (ids.length > 0) {
      sessionState.recordCreate(prefix, ids);
    } else {
      sessionState.recordCreate(prefix, ["_created"]);
    }
  }
}
