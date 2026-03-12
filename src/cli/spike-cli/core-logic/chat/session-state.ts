/**
 * Session state tracking for tool invocation context.
 */

/** Config prerequisites: tools that must be called before others become usable. */
export const CONFIG_PREREQUISITES: Record<string, string[]> = {
  set_project_root: ["run_tests", "list_tests", "analyze_coverage"],
};

export interface SessionStateSnapshot {
  created: Record<string, string[]>;
  idsByKey: Record<string, string[]>;
  configToolsCalled: string[];
}

/** Session state tracking tool invocation context. */
export class SessionState {
  /** Maps prefix (e.g. "chess") to list of IDs created during this session. */
  private created = new Map<string, string[]>();

  /** Maps param name (e.g. "game_id") to list of IDs seen in results. */
  private idsByKey = new Map<string, string[]>();

  /** Tracks config prerequisite tools that have been called. */
  private configToolsCalled = new Set<string>();

  recordCreate(prefix: string, ids: string[]): void {
    const existing = this.created.get(prefix) ?? [];
    this.created.set(prefix, [...existing, ...ids]);
  }

  hasCreated(prefix: string): boolean {
    const ids = this.created.get(prefix);
    return !!ids && ids.length > 0;
  }

  getCreatedIds(prefix: string): string[] {
    return this.created.get(prefix) ?? [];
  }

  /** Record all *_id fields found in a tool result JSON. */
  recordIds(result: string): void {
    try {
      const parsed = JSON.parse(result);
      if (typeof parsed !== "object" || parsed === null) return;
      for (const [key, value] of Object.entries(parsed)) {
        if (key.endsWith("_id") && typeof value === "string") {
          const existing = this.idsByKey.get(key) ?? [];
          existing.push(value);
          this.idsByKey.set(key, existing);
        }
        // Also track bare "id" as a generic ID
        if (key === "id" && typeof value === "string") {
          const existing = this.idsByKey.get("id") ?? [];
          existing.push(value);
          this.idsByKey.set("id", existing);
        }
      }
    } catch {
      // Not JSON, skip
    }
  }

  /** Get the most recently seen value for a param name (e.g. "game_id"). */
  getLatestId(paramName: string): string | undefined {
    const ids = this.idsByKey.get(paramName);
    if (ids && ids.length > 0) return ids[ids.length - 1];
    return undefined;
  }

  /** Check if an ID param has been seen in any result. */
  hasId(paramName: string): boolean {
    const ids = this.idsByKey.get(paramName);
    return !!ids && ids.length > 0;
  }

  /** Record that a config tool was called. */
  recordConfigCall(toolName: string): void {
    this.configToolsCalled.add(toolName);
  }

  /** Check if a config tool has been called. */
  hasConfigBeenCalled(toolName: string): boolean {
    return this.configToolsCalled.has(toolName);
  }

  getSnapshot(): SessionStateSnapshot {
    return {
      created: Object.fromEntries(this.created.entries()),
      idsByKey: Object.fromEntries(this.idsByKey.entries()),
      configToolsCalled: [...this.configToolsCalled],
    };
  }

  loadSnapshot(snapshot: SessionStateSnapshot | null | undefined): void {
    this.created.clear();
    this.idsByKey.clear();
    this.configToolsCalled.clear();

    if (!snapshot) return;

    for (const [key, ids] of Object.entries(snapshot.created)) {
      this.created.set(key, [...ids]);
    }
    for (const [key, ids] of Object.entries(snapshot.idsByKey)) {
      this.idsByKey.set(key, [...ids]);
    }
    for (const toolName of snapshot.configToolsCalled) {
      this.configToolsCalled.add(toolName);
    }
  }
}
