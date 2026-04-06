/**
 * Formatting utilities for tool and app listings.
 */

import type { NamespacedTool } from "../multiplexer/server-manager";
import { extractDefaults, getRequiredParams } from "./tool-adapter";
import { bold, cyan, dim } from "../shell/formatter";
import type { AppRegistry } from "./app-registry";
import type { SessionState } from "./session-state";
import {
  getVisibleTools,
  getVisibleToolsEnhanced,
  groupToolsByApp,
  groupToolsByPrefix,
  stripNamespace,
} from "./tool-grouping";

/**
 * Format the /tools output, grouped by prefix with visibility filtering.
 */
export function formatGroupedTools(
  tools: NamespacedTool[],
  sessionState: SessionState,
  filterPrefix?: string,
  separator: string = "__",
): string {
  const groups = groupToolsByPrefix(tools, separator);
  const lines: string[] = [];

  for (const [prefix, group] of groups) {
    if (filterPrefix && prefix !== filterPrefix) continue;

    const { visible, hidden } = getVisibleTools(group.tools, sessionState, separator);

    // Server label
    const serverName = group.tools[0]?.serverName ?? "unknown";
    lines.push(`${bold(serverName)} ${dim(`(${prefix})`)}`);

    // Visible tools
    for (const tool of visible) {
      const displayName = stripNamespace(tool.namespacedName, tool.serverName, separator);
      const defaults = extractDefaults(tool.inputSchema);
      const requiredParams = getRequiredParams(tool.inputSchema);

      let hint = "";
      if (Object.keys(defaults).length > 0) {
        const defaultHints = Object.entries(defaults)
          .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
          .join(", ");
        hint = ` [${defaultHints}]`;
      }
      if (requiredParams.length > 0) {
        const reqHints = requiredParams.map((p) => `${p.name} required`).join(", ");
        hint += hint ? ` [${reqHints}]` : ` [${reqHints}]`;
      }

      lines.push(`  ${cyan("/" + displayName)}  ${dim(tool.description ?? "")}${dim(hint)}`);
    }

    if (hidden > 0) {
      lines.push(`    ${dim(`+ ${hidden} more (use entry-point tools first)`)}`);
    }

    lines.push("");
  }

  if (filterPrefix && lines.length === 0) {
    return `No tools found for prefix "${filterPrefix}".`;
  }

  return lines.join("\n").trimEnd();
}

/**
 * Format the /tools output using app-based grouping.
 */
export function formatAppGroupedTools(
  tools: NamespacedTool[],
  sessionState: SessionState,
  appRegistry: AppRegistry,
  filter?: string,
  separator: string = "__",
): string {
  const groups = groupToolsByApp(tools, appRegistry, separator);
  const lines: string[] = [];

  for (const [key, group] of groups) {
    // Apply filter: match on app slug, app name, category, or prefix key
    if (filter) {
      const f = filter.toLowerCase();
      const matchesKey = key.toLowerCase().includes(f);
      const matchesAppName = group.app?.name.toLowerCase().includes(f) ?? false;
      const matchesCategory = group.app?.category.toLowerCase().includes(f) ?? false;
      if (!matchesKey && !matchesAppName && !matchesCategory) continue;
    }

    const { visible, hidden } = getVisibleToolsEnhanced(group.tools, sessionState, separator);
    group.hiddenCount = hidden;

    if (group.app) {
      // App-based header
      lines.push(`${bold(group.app.name)} ${dim(`[${group.app.category}]`)}`);
      lines.push(`  ${dim(group.app.tagline)}`);
    } else {
      // Prefix-based fallback header
      const serverName = group.tools[0]?.serverName ?? "unknown";
      lines.push(`${bold(serverName)} ${dim(`(${key})`)}`);
    }

    for (const tool of visible) {
      const displayName = stripNamespace(tool.namespacedName, tool.serverName, separator);
      const requiredParams = getRequiredParams(tool.inputSchema);

      const isReady = requiredParams.length === 0;
      const readyBadge = isReady ? dim(" (ready)") : "";

      lines.push(`  ${cyan("/" + displayName)}${readyBadge}  ${dim(tool.description ?? "")}`);
    }

    if (hidden > 0) {
      lines.push(`    ${dim(`+ ${hidden} more (use entry-point tools first)`)}`);
    }

    lines.push("");
  }

  if (filter && lines.length === 0) {
    return `No tools found for "${filter}".`;
  }

  return lines.join("\n").trimEnd();
}

/**
 * Format the /apps listing output.
 */
export function formatAppsList(appRegistry: AppRegistry): string {
  const apps = appRegistry.getAllApps();
  if (apps.length === 0) {
    return "No apps registered.";
  }

  const lines: string[] = [bold("Apps:")];
  for (const app of apps) {
    lines.push(
      `  ${bold(app.name)} ${dim(`(${app.slug})`)} ${dim(`[${app.category}]`)} ${dim("—")} ${dim(
        app.tagline,
      )}`,
    );
  }
  return lines.join("\n");
}
