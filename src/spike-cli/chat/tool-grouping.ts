/**
 * Tool grouping, filtering, and visibility utilities.
 */

import type { NamespacedTool } from "../multiplexer/server-manager";
import type { AppInfo, AppRegistry } from "./app-registry";
import { CONFIG_PREREQUISITES, type SessionState } from "./session-state";

/** Grouped tools for display. */
export interface ToolGroup {
  prefix: string;
  tools: NamespacedTool[];
}

/** App-aware tool group for display. */
export interface AppToolGroup {
  key: string;
  app: AppInfo | null;
  tools: NamespacedTool[];
  hiddenCount: number;
}

/** Strip the server namespace prefix from a tool name for display. */
export function stripNamespace(
  namespacedName: string,
  serverName: string,
  separator: string = "__",
): string {
  const nsPrefix = serverName + separator;
  if (namespacedName.startsWith(nsPrefix)) {
    return namespacedName.slice(nsPrefix.length);
  }
  return namespacedName;
}

/**
 * Extract a category prefix from a tool name.
 * Strips the server namespace prefix first (e.g. "spike__chess_create_game" → "chess_create_game"),
 * then extracts the prefix before the first underscore (e.g. "chess").
 */
export function extractPrefix(
  namespacedName: string,
  serverName: string,
  separator: string = "__",
): string {
  // Strip server namespace prefix
  let toolName = namespacedName;
  const nsPrefix = serverName + separator;
  if (toolName.startsWith(nsPrefix)) {
    toolName = toolName.slice(nsPrefix.length);
  }

  // Extract prefix: everything before the first underscore
  const underscoreIndex = toolName.indexOf("_");
  if (underscoreIndex === -1) return toolName;
  return toolName.slice(0, underscoreIndex);
}

/**
 * Group tools by their inferred prefix.
 */
export function groupToolsByPrefix(
  tools: NamespacedTool[],
  separator: string = "__",
): Map<string, ToolGroup> {
  const groups = new Map<string, ToolGroup>();

  for (const tool of tools) {
    const prefix = extractPrefix(tool.namespacedName, tool.serverName, separator);
    const group = groups.get(prefix);
    if (group) {
      group.tools.push(tool);
    } else {
      groups.set(prefix, { prefix, tools: [tool] });
    }
  }

  return groups;
}

/**
 * Group tools by app from the AppRegistry, falling back to prefix for unmatched tools.
 */
export function groupToolsByApp(
  tools: NamespacedTool[],
  appRegistry: AppRegistry,
  separator: string = "__",
): Map<string, AppToolGroup> {
  const groups = new Map<string, AppToolGroup>();

  for (const tool of tools) {
    // Strip namespace to get original tool name for registry lookup
    const stripped = stripNamespace(tool.namespacedName, tool.serverName, separator);
    const app = appRegistry.getAppForTool(stripped) ?? appRegistry.getAppForTool(tool.originalName);

    const key = app ? app.slug : extractPrefix(tool.namespacedName, tool.serverName, separator);
    const group = groups.get(key);
    if (group) {
      group.tools.push(tool);
    } else {
      groups.set(key, { key, app: app ?? null, tools: [tool], hiddenCount: 0 });
    }
  }

  return groups;
}

/**
 * Determine if a tool is an entry-point (always visible) vs dependent (conditionally visible).
 * Entry-point tools: contain "create", "list", "search", "get_status", or have zero required params.
 */
export function isEntryPointTool(tool: NamespacedTool): boolean {
  const name = tool.namespacedName.toLowerCase();
  const entryKeywords = ["create", "list", "search", "get_status", "bootstrap"];

  for (const keyword of entryKeywords) {
    if (name.includes(keyword)) return true;
  }

  // Tools with zero required params are also entry points
  const required = (tool.inputSchema.required as string[] | undefined) ?? [];
  return required.length === 0;
}

/**
 * Check if a tool is a dependent tool (requires a prior create call).
 * Dependent tools have required params ending in `_id`.
 */
function isDependentTool(tool: NamespacedTool): boolean {
  const required = (tool.inputSchema.required as string[] | undefined) ?? [];
  return required.some((param) => param.endsWith("_id"));
}

/**
 * Get required ID params for a tool (params ending in `_id`).
 */
function getRequiredIdParams(tool: NamespacedTool): string[] {
  const required = (tool.inputSchema.required as string[] | undefined) ?? [];
  return required.filter((p) => p.endsWith("_id"));
}

/**
 * Check if a tool requires a config prerequisite that hasn't been called yet.
 */
function isBlockedByConfig(
  tool: NamespacedTool,
  sessionState: SessionState,
  separator: string = "__",
): boolean {
  const stripped = stripNamespace(tool.namespacedName, tool.serverName, separator);
  for (const [configTool, dependents] of Object.entries(CONFIG_PREREQUISITES)) {
    if (dependents.includes(stripped) && !sessionState.hasConfigBeenCalled(configTool)) {
      return true;
    }
  }
  return false;
}

/**
 * Filter tools to show only visible ones based on session state.
 * Entry-point tools are always visible. Dependent tools are visible only if
 * a matching create tool has been called in this session.
 */
export function getVisibleTools(
  tools: NamespacedTool[],
  sessionState: SessionState,
  separator: string = "__",
): { visible: NamespacedTool[]; hidden: number } {
  const visible: NamespacedTool[] = [];
  let hidden = 0;

  for (const tool of tools) {
    if (isEntryPointTool(tool)) {
      visible.push(tool);
    } else if (isDependentTool(tool)) {
      const prefix = extractPrefix(tool.namespacedName, tool.serverName, separator);
      if (sessionState.hasCreated(prefix)) {
        visible.push(tool);
      } else {
        hidden++;
      }
    } else {
      visible.push(tool);
    }
  }

  return { visible, hidden };
}

/**
 * Enhanced visibility filter using ID-level tracking and config prerequisites.
 */
export function getVisibleToolsEnhanced(
  tools: NamespacedTool[],
  sessionState: SessionState,
  separator: string = "__",
): { visible: NamespacedTool[]; hidden: number } {
  const visible: NamespacedTool[] = [];
  let hidden = 0;

  for (const tool of tools) {
    // Config-dependent tools: hidden until prerequisite called
    if (isBlockedByConfig(tool, sessionState, separator)) {
      hidden++;
      continue;
    }

    if (isEntryPointTool(tool)) {
      visible.push(tool);
    } else if (isDependentTool(tool)) {
      // Check if ALL required ID params have been seen
      const requiredIds = getRequiredIdParams(tool);
      const allIdsSatisfied = requiredIds.every((p) => sessionState.hasId(p));

      if (allIdsSatisfied) {
        visible.push(tool);
      } else {
        // Fall back to prefix-based check
        const prefix = extractPrefix(tool.namespacedName, tool.serverName, separator);
        if (sessionState.hasCreated(prefix)) {
          visible.push(tool);
        } else {
          hidden++;
        }
      }
    } else {
      visible.push(tool);
    }
  }

  return { visible, hidden };
}
