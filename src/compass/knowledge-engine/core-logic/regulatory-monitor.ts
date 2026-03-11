/**
 * COMPASS Knowledge Engine — Regulatory Monitor
 *
 * Tracks registered government sources and surfaces changes that may invalidate
 * cached process data.  The actual HTTP fetch + diff logic is intentionally
 * stubbed so the class can be unit-tested without network calls.  In production,
 * subclass `RegulatoryMonitor` and override `fetchPageContent()` with a real
 * implementation (e.g. Cloudflare Browser Rendering or a headless browser).
 */

import type { ChangeDetection, ChangeType, ISODateTime } from "../types.ts";

// ── Source record ─────────────────────────────────────────────────────────

interface RegisteredSource {
  readonly url: string;
  readonly jurisdictionId: string;
  /** Human-readable label for this source, e.g. "Germany – Visa Fee Schedule". */
  readonly label: string;
  /**
   * Program ids this source is considered authoritative for.
   * When a change is detected, these programs are flagged as potentially outdated.
   */
  readonly linkedProgramIds: readonly string[];
  /** SHA-256 hex digest of the page content at last check; null if never checked. */
  lastContentHash: string | null;
  /** When this source was last checked. */
  lastCheckedAt: ISODateTime | null;
}

// ── Outdated flag record ───────────────────────────────────────────────────

interface OutdatedFlag {
  readonly programId: string;
  readonly flaggedAt: ISODateTime;
  readonly reason: string;
  /** Id of the change detection that triggered this flag, for traceability. */
  readonly changeId: string;
  resolved: boolean;
  resolvedAt: ISODateTime | null;
}

// ── RegulatoryMonitor ─────────────────────────────────────────────────────

export class RegulatoryMonitor {
  private readonly sources = new Map<string, RegisteredSource>();
  private readonly outdatedFlags = new Map<string, OutdatedFlag>();
  private readonly changeLog: ChangeDetection[] = [];

  private readonly now: () => ISODateTime;

  constructor(now?: () => ISODateTime) {
    this.now = now ?? (() => new Date().toISOString());
  }

  // ── Source management ──────────────────────────────────────────────────────

  /**
   * Registers a government URL for monitoring.
   *
   * @param url             Canonical URL of the page to watch.
   * @param jurisdictionId  COMPASS jurisdiction id this source belongs to.
   * @param label           Human-readable name for logging and UI.
   * @param linkedProgramIds  Program ids to flag when a change is detected.
   */
  registerSource(
    url: string,
    jurisdictionId: string,
    label: string,
    linkedProgramIds: readonly string[] = [],
  ): void {
    if (this.sources.has(url)) {
      throw new Error(`Source "${url}" is already registered`);
    }

    this.sources.set(url, {
      url,
      jurisdictionId,
      label,
      linkedProgramIds,
      lastContentHash: null,
      lastCheckedAt: null,
    });
  }

  /**
   * Removes a previously registered source.
   * Does not clear existing outdated flags for the source's programs.
   */
  deregisterSource(url: string): boolean {
    return this.sources.delete(url);
  }

  getRegisteredSources(): readonly Readonly<RegisteredSource>[] {
    return [...this.sources.values()];
  }

  getSource(url: string): Readonly<RegisteredSource> | undefined {
    return this.sources.get(url);
  }

  // ── Change detection ───────────────────────────────────────────────────────

  /**
   * Checks all registered sources for changes.
   *
   * This is a **stub implementation** that simulates no changes.
   * Override `fetchPageContent()` to provide real HTTP fetching.
   *
   * Returns an array of ChangeDetection records for any sources where content
   * has changed since the last check.
   */
  async checkForChanges(): Promise<readonly ChangeDetection[]> {
    const detected: ChangeDetection[] = [];

    for (const source of this.sources.values()) {
      const result = await this.checkSource(source);
      if (result !== null) {
        detected.push(result);
        this.changeLog.push(result);

        // Auto-flag all linked programs
        for (const programId of result.affectedProgramIds) {
          this.flagOutdated(programId, result.summary, this.changeId(result));
        }
      }
      source.lastCheckedAt = this.now();
    }

    return detected;
  }

  /**
   * Checks a single source for changes.
   * Returns null if no change is detected (or if this is the first check).
   *
   * Subclasses may override this for per-source logic (e.g. PDF diff vs HTML diff).
   */
  protected async checkSource(source: RegisteredSource): Promise<ChangeDetection | null> {
    const content = await this.fetchPageContent(source.url);
    const newHash = await this.hashContent(content);

    if (source.lastContentHash === null) {
      // First check — record the baseline and do not flag as changed.
      source.lastContentHash = newHash;
      return null;
    }

    if (newHash === source.lastContentHash) return null;

    const changeType: ChangeType = content === "" ? "page_removed" : "content_changed";
    source.lastContentHash = newHash;

    return {
      sourceUrl: source.url,
      jurisdictionId: source.jurisdictionId,
      detectedAt: this.now(),
      changeType,
      summary: `Content change detected on "${source.label}"`,
      affectedProgramIds: [...source.linkedProgramIds],
    };
  }

  /**
   * Fetches page content as a plain string.
   *
   * **Stub**: always returns an empty string.
   * Override in a concrete subclass to perform real HTTP requests.
   */

  protected async fetchPageContent(_url: string): Promise<string> {
    return "";
  }

  /**
   * Computes a deterministic content hash.
   * Uses the Web Crypto API (SubtleCrypto) which is available in both
   * Cloudflare Workers and modern Node.js (≥ 19).
   */
  private async hashContent(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = new Uint8Array(hashBuffer);
    return Array.from(hashArray)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  private changeId(detection: ChangeDetection): string {
    return `${detection.sourceUrl}@${detection.detectedAt}`;
  }

  // ── Outdated flags ─────────────────────────────────────────────────────────

  /**
   * Manually flags a program as potentially outdated.
   * Idempotent: calling it again for the same programId with new info
   * overwrites the previous flag.
   */
  flagOutdated(programId: string, reason: string, changeId: string = ""): void {
    this.outdatedFlags.set(programId, {
      programId,
      flaggedAt: this.now(),
      reason,
      changeId,
      resolved: false,
      resolvedAt: null,
    });
  }

  /**
   * Marks a previously flagged program as reviewed and up-to-date.
   * Returns false if the program was not flagged.
   */
  resolveFlag(programId: string): boolean {
    const flag = this.outdatedFlags.get(programId);
    if (flag === undefined || flag.resolved) return false;

    flag.resolved = true;
    flag.resolvedAt = this.now();
    return true;
  }

  /** Returns all unresolved outdated flags. */
  getOutdatedPrograms(): readonly Readonly<OutdatedFlag>[] {
    return [...this.outdatedFlags.values()].filter((f) => !f.resolved);
  }

  /** Returns whether a given program is currently flagged as outdated. */
  isOutdated(programId: string): boolean {
    const flag = this.outdatedFlags.get(programId);
    return flag !== undefined && !flag.resolved;
  }

  // ── Change log ─────────────────────────────────────────────────────────────

  /** Returns the full log of detected changes, newest first. */
  getChangeLog(): readonly ChangeDetection[] {
    return [...this.changeLog].reverse();
  }

  /** Returns changes detected for a specific jurisdiction. */
  getChangesByJurisdiction(jurisdictionId: string): readonly ChangeDetection[] {
    return this.changeLog.filter((c) => c.jurisdictionId === jurisdictionId).reverse();
  }
}
