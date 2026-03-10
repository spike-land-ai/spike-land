/**
 * COMPASS Rights Engine — rights database and lookup.
 *
 * The RightsDatabase is the authoritative in-process store for rights
 * knowledge.  It is intentionally independent: no method here may filter
 * or suppress rights based on who the caller is or what partnerships exist.
 *
 * Search is normalised (lower-case, diacritics stripped) so that people
 * who speak the language imperfectly still find what they need.
 */

import type { Right, RightsDomain, ProcessStageRights } from "../types.js";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Strip accents and fold to lower-case for fuzzy matching. */
function normalise(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}

/**
 * Returns true if `jurisdiction` applies to `query`.
 * A right with jurisdiction "*" applies everywhere.
 * A right with a supranational code (e.g. "EU") is checked inclusively —
 * callers are expected to pass ISO 3166-1 codes; supranational matching is
 * done via the SUPRANATIONAL_MEMBERSHIP map below.
 */
function jurisdictionMatches(rightJurisdiction: string, queryJurisdiction: string): boolean {
  const rj = rightJurisdiction.toUpperCase();
  const qj = queryJurisdiction.toUpperCase();

  if (rj === "*" || rj === qj) return true;

  const members = SUPRANATIONAL_MEMBERSHIP[rj];
  if (members !== undefined) {
    return members.includes(qj);
  }

  return false;
}

/**
 * Minimal supranational membership map.
 * Expand as jurisdiction coverage grows.
 */
const SUPRANATIONAL_MEMBERSHIP: Record<string, string[]> = {
  EU: [
    "AT",
    "BE",
    "BG",
    "CY",
    "CZ",
    "DE",
    "DK",
    "EE",
    "ES",
    "FI",
    "FR",
    "GR",
    "HR",
    "HU",
    "IE",
    "IT",
    "LT",
    "LU",
    "LV",
    "MT",
    "NL",
    "PL",
    "PT",
    "RO",
    "SE",
    "SI",
    "SK",
  ],
  // Council of Europe / ECHR signatories (superset of EU + others)
  ECHR: [
    "AL",
    "AD",
    "AM",
    "AT",
    "AZ",
    "BE",
    "BA",
    "BG",
    "HR",
    "CY",
    "CZ",
    "DK",
    "EE",
    "FI",
    "FR",
    "GE",
    "DE",
    "GR",
    "HU",
    "IS",
    "IE",
    "IT",
    "LV",
    "LI",
    "LT",
    "LU",
    "MT",
    "MD",
    "MC",
    "ME",
    "NL",
    "MK",
    "NO",
    "PL",
    "PT",
    "RO",
    "SM",
    "RS",
    "SK",
    "SI",
    "ES",
    "SE",
    "CH",
    "TR",
    "UA",
    "GB",
  ],
};

// ---------------------------------------------------------------------------
// Stage-to-right index entry
// ---------------------------------------------------------------------------

interface StageEntry {
  processId: string;
  stageId: string;
  rightIds: string[];
  warnings: string[];
}

// ---------------------------------------------------------------------------
// RightsDatabase
// ---------------------------------------------------------------------------

/**
 * In-process store for rights, indexed for fast lookup.
 *
 * Typical usage:
 *   const db = new RightsDatabase();
 *   db.addRight({ id: "example", ... });
 *   const stageRights = db.getRightsForStage("asylum-DE", "initial-registration");
 */
export class RightsDatabase {
  /** Primary store keyed by right.id */
  private readonly rights = new Map<string, Right>();

  /** Domain→right ids, per jurisdiction */
  private readonly domainIndex = new Map<string, Map<string, Set<string>>>();

  /** Process+stage→entry */
  private readonly stageIndex = new Map<string, StageEntry>();

  // -------------------------------------------------------------------------
  // Mutation
  // -------------------------------------------------------------------------

  /**
   * Add or replace a right in the database.
   * Calling addRight with an existing id overwrites the previous value.
   */
  addRight(right: Right): void {
    this.rights.set(right.id, right);
    this.indexByDomain(right);
  }

  /**
   * Register which rights are relevant at a particular process stage.
   * This is separate from addRight so that the same right can appear across
   * many stages without duplication.
   *
   * @param processId  Top-level process identifier, e.g. "asylum-DE"
   * @param stageId    Stage within that process, e.g. "initial-registration"
   * @param rightIds   Rights that are active at this stage
   * @param warnings   Urgent plain-language warnings for this stage
   */
  registerStageRights(
    processId: string,
    stageId: string,
    rightIds: string[],
    warnings: string[] = [],
  ): void {
    const key = this.stageKey(processId, stageId);
    this.stageIndex.set(key, { processId, stageId, rightIds, warnings });
  }

  // -------------------------------------------------------------------------
  // Query
  // -------------------------------------------------------------------------

  /**
   * Return the rights and warnings for a specific process stage.
   * Rights registered for this stage but not found in the database are
   * silently dropped (allows partial loading of rights data).
   */
  getRightsForStage(processId: string, stageId: string): ProcessStageRights {
    const key = this.stageKey(processId, stageId);
    const entry = this.stageIndex.get(key);

    if (entry === undefined) {
      return { stageId, rights: [], warnings: [] };
    }

    const rights = entry.rightIds.flatMap((id) => {
      const right = this.rights.get(id);
      return right !== undefined ? [right] : [];
    });

    return {
      stageId,
      rights,
      warnings: [...entry.warnings],
    };
  }

  /**
   * Return all rights for a given domain within a jurisdiction.
   * Supranational rights (e.g. EU, ECHR, "*") are included when the
   * queried jurisdiction falls within their scope.
   */
  getRightsByDomain(domain: RightsDomain, jurisdiction: string): Right[] {
    const results: Right[] = [];

    for (const right of this.rights.values()) {
      if (right.domain === domain && jurisdictionMatches(right.jurisdiction, jurisdiction)) {
        results.push(right);
      }
    }

    return results;
  }

  /**
   * Full-text search over right title, description, and applicableTo fields.
   * Optionally filtered to a jurisdiction.
   *
   * Results are ranked: title matches first, then description matches,
   * then applicableTo matches.
   */
  searchRights(query: string, jurisdiction?: string): Right[] {
    const normQuery = normalise(query);
    if (normQuery.length === 0) return [];

    const titleMatches: Right[] = [];
    const descriptionMatches: Right[] = [];
    const applicableToMatches: Right[] = [];
    const seenIds = new Set<string>();

    for (const right of this.rights.values()) {
      if (jurisdiction !== undefined && !jurisdictionMatches(right.jurisdiction, jurisdiction)) {
        continue;
      }

      if (seenIds.has(right.id)) continue;

      const titleNorm = normalise(right.title);
      const descNorm = normalise(right.description);
      const appToNorm = right.applicableTo.map(normalise).join(" ");

      if (titleNorm.includes(normQuery)) {
        titleMatches.push(right);
        seenIds.add(right.id);
      } else if (descNorm.includes(normQuery)) {
        descriptionMatches.push(right);
        seenIds.add(right.id);
      } else if (appToNorm.includes(normQuery)) {
        applicableToMatches.push(right);
        seenIds.add(right.id);
      }
    }

    return [...titleMatches, ...descriptionMatches, ...applicableToMatches];
  }

  /**
   * Return a right by its exact id, or undefined if not found.
   */
  getRight(id: string): Right | undefined {
    return this.rights.get(id);
  }

  /**
   * Return all rights currently in the database.
   */
  getAllRights(): Right[] {
    return Array.from(this.rights.values());
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private indexByDomain(right: Right): void {
    if (!this.domainIndex.has(right.domain)) {
      this.domainIndex.set(right.domain, new Map());
    }
    const domainMap = this.domainIndex.get(right.domain)!;

    const jk = right.jurisdiction.toUpperCase();
    if (!domainMap.has(jk)) {
      domainMap.set(jk, new Set());
    }
    domainMap.get(jk)!.add(right.id);
  }

  private stageKey(processId: string, stageId: string): string {
    return `${processId}::${stageId}`;
  }
}
