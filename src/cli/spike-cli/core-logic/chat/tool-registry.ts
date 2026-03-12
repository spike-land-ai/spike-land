/**
 * Dynamic Tool Registry for on-demand tool schema loading.
 * Instead of sending all 80+ tool schemas every turn (~8000 tokens),
 * maintains a compact catalog (~500 tokens) and activates tools on demand.
 */

import type { NamespacedTool } from "../multiplexer/server-manager.js";
import { fuzzyFilter } from "../util/fuzzy.js";

export interface ToolSearchResult {
  tools: NamespacedTool[];
  query: string;
  totalMatches: number;
}

export interface DynamicToolRegistryOptions {
  /** Patterns for tools that should always be active (full schema sent). Matches against namespacedName. */
  alwaysOnPatterns?: string[];
}

export interface DynamicToolRegistrySnapshot {
  activeToolNames: string[];
}

export class DynamicToolRegistry {
  private allTools: NamespacedTool[] = [];
  private activeToolNames: Set<string> = new Set();
  private alwaysOnPatterns: string[];

  constructor(options: DynamicToolRegistryOptions = {}) {
    this.alwaysOnPatterns = options.alwaysOnPatterns ?? [];
  }

  /** Called after server connect/reconnect to update the full tool list. */
  refresh(tools: NamespacedTool[]): void {
    this.allTools = [...tools];
    // Re-apply always-on patterns
    for (const tool of this.allTools) {
      if (this.isAlwaysOn(tool.namespacedName)) {
        this.activeToolNames.add(tool.namespacedName);
      }
    }
  }

  /** Build a compact "name: one-liner" catalog grouped by server (~500 tokens). */
  buildCatalog(): string {
    const byServer = new Map<string, NamespacedTool[]>();
    for (const tool of this.allTools) {
      const list = byServer.get(tool.serverName) ?? [];
      list.push(tool);
      byServer.set(tool.serverName, list);
    }

    const sections: string[] = [];
    for (const [server, tools] of byServer) {
      const lines = tools.map((t) => {
        const shortDesc = truncate(t.description ?? "", 60);
        const active = this.activeToolNames.has(t.namespacedName) ? " [active]" : "";
        return `  ${t.namespacedName}: ${shortDesc}${active}`;
      });
      sections.push(`[${server}] (${tools.length} tools)\n${lines.join("\n")}`);
    }

    return sections.join("\n\n");
  }

  /** Fuzzy search tools, activating matches. Returns matching tools with full schemas. */
  search(query: string, maxResults: number = 5): ToolSearchResult {
    const matches = fuzzyFilter(query, this.allTools, (t) => {
      // Search against namespacedName AND description
      return `${t.namespacedName} ${t.description ?? ""}`;
    });

    const limited = matches.slice(0, maxResults);

    // Activate matched tools
    for (const tool of limited) {
      this.activeToolNames.add(tool.namespacedName);
    }

    return {
      tools: limited,
      query,
      totalMatches: matches.length,
    };
  }

  /** Get only active tools (always-on + search-loaded). These get full schemas sent to Claude. */
  getActiveTools(): NamespacedTool[] {
    return this.allTools.filter((t) => this.activeToolNames.has(t.namespacedName));
  }

  /** Activate a specific tool by name. Returns true if found and activated. */
  activate(name: string): boolean {
    const tool = this.allTools.find((t) => t.namespacedName === name);
    if (!tool) return false;
    this.activeToolNames.add(name);
    return true;
  }

  /** Deactivate a tool (unless always-on). */
  deactivate(name: string): boolean {
    if (this.isAlwaysOn(name)) return false;
    return this.activeToolNames.delete(name);
  }

  /** Reset to only always-on tools. Used on /clear. */
  resetToAlwaysOn(): void {
    this.activeToolNames.clear();
    for (const tool of this.allTools) {
      if (this.isAlwaysOn(tool.namespacedName)) {
        this.activeToolNames.add(tool.namespacedName);
      }
    }
  }

  /** Check if a tool name is known in the registry. */
  isKnown(name: string): boolean {
    return this.allTools.some((t) => t.namespacedName === name);
  }

  /** Check if a tool is currently active. */
  isActive(name: string): boolean {
    return this.activeToolNames.has(name);
  }

  /** Get the total number of registered tools. */
  get totalTools(): number {
    return this.allTools.length;
  }

  /** Get the number of currently active tools. */
  get activeCount(): number {
    return this.activeToolNames.size;
  }

  getSnapshot(): DynamicToolRegistrySnapshot {
    return {
      activeToolNames: [...this.activeToolNames],
    };
  }

  loadSnapshot(snapshot: DynamicToolRegistrySnapshot | null | undefined): void {
    this.resetToAlwaysOn();
    if (!snapshot) return;
    for (const name of snapshot.activeToolNames) {
      this.activeToolNames.add(name);
    }
  }

  private isAlwaysOn(name: string): boolean {
    // Meta-tools (spike__*) are always on
    if (name.startsWith("spike__")) return true;

    return this.alwaysOnPatterns.some((pattern) => {
      if (pattern.includes("*")) {
        const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
        return regex.test(name);
      }
      return name === pattern;
    });
  }
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + "...";
}
