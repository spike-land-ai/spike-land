/**
 * COMPASS Rights Engine — legal resource finder.
 *
 * The ResourceFinder locates free and low-cost legal/advocacy resources
 * for a given jurisdiction, domain, and language.
 *
 * Resources are registered programmatically (by data seeds or at runtime).
 * The finder never suppresses emergency contacts regardless of any other
 * filter — a person in danger must always be able to reach help.
 */

import type { LegalResource, LegalResourceType, RightsDomain } from "../types.js";

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

interface ResourceEntry extends LegalResource {
  /** Normalised languages for fast lookup. */
  _langSet: Set<string>;
  /** Whether this resource should appear in emergency contact lists. */
  isEmergency: boolean;
  /** Domains this resource specialises in (empty = all domains). */
  domains: RightsDomain[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normLang(lang: string): string {
  return lang.toLowerCase().trim();
}

function jurisdictionMatches(resourceJurisdiction: string, queryJurisdiction: string): boolean {
  const rj = resourceJurisdiction.toUpperCase();
  const qj = queryJurisdiction.toUpperCase();
  if (rj === "*" || rj === qj) return true;
  const members = SUPRANATIONAL_MEMBERSHIP[rj];
  if (members !== undefined) return members.includes(qj);
  return false;
}

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
// ResourceFinder
// ---------------------------------------------------------------------------

export class ResourceFinder {
  private readonly resources = new Map<string, ResourceEntry>();

  // -------------------------------------------------------------------------
  // Registration
  // -------------------------------------------------------------------------

  /**
   * Register a legal resource.
   *
   * @param resource    The resource to register.
   * @param isEmergency Whether to include in emergency contact lists.
   * @param domains     Domains this resource specialises in.
   *                    Pass [] to indicate it covers all domains.
   */
  addResource(resource: LegalResource, isEmergency = false, domains: RightsDomain[] = []): void {
    const entry: ResourceEntry = {
      ...resource,
      _langSet: new Set(resource.languages.map(normLang)),
      isEmergency,
      domains,
    };
    this.resources.set(resource.id, entry);
  }

  // -------------------------------------------------------------------------
  // Queries
  // -------------------------------------------------------------------------

  /**
   * Find resources matching a jurisdiction and domain, optionally filtered
   * by language.
   *
   * Results are sorted: free-of-charge first, then by resource type
   * (legal_aid and ngo before hotline/website).
   */
  findResources(jurisdiction: string, domain: RightsDomain, language?: string): LegalResource[] {
    const results: ResourceEntry[] = [];
    const normLangQuery = language !== undefined ? normLang(language) : undefined;

    for (const entry of this.resources.values()) {
      if (!jurisdictionMatches(entry.jurisdiction, jurisdiction)) continue;
      if (entry.domains.length > 0 && !entry.domains.includes(domain)) {
        continue;
      }
      if (
        normLangQuery !== undefined &&
        !entry._langSet.has(normLangQuery) &&
        !entry._langSet.has("en")
      ) {
        continue;
      }
      results.push(entry);
    }

    return results.sort(compareLegalResources).map(stripInternal);
  }

  /**
   * Return the most accessible free legal aid resource for a jurisdiction,
   * optionally biased toward a physical location (city/region name).
   *
   * If no exact match is found the function returns a supranational fallback
   * (e.g. EU or ECHR-level resource) if available.
   */
  getNearestLegalAid(jurisdiction: string, location?: string): LegalResource | undefined {
    const freeAid = Array.from(this.resources.values()).filter(
      (r) =>
        r.freeOfCharge &&
        ["legal_aid", "ngo"].includes(r.type) &&
        jurisdictionMatches(r.jurisdiction, jurisdiction),
    );

    if (freeAid.length === 0) return undefined;

    // If a location hint is provided, prefer resources whose address or name
    // mentions it (case-insensitive).
    if (location !== undefined) {
      const locNorm = location.toLowerCase();
      const localMatch = freeAid.find(
        (r) =>
          r.contactInfo.address?.toLowerCase().includes(locNorm) ||
          r.name.toLowerCase().includes(locNorm),
      );
      if (localMatch !== undefined) return stripInternal(localMatch);
    }

    // Otherwise, return the first free legal_aid (preferred) or ngo.
    const sorted = freeAid.sort(compareLegalResources);
    const first = sorted[0];
    return first !== undefined ? stripInternal(first) : undefined;
  }

  /**
   * Return emergency contacts for a jurisdiction.
   * This always includes global fallbacks (marked jurisdiction "*") so the
   * result is never empty for any jurisdiction.
   *
   * Emergency contacts are returned first; global fallbacks last.
   */
  getEmergencyContacts(jurisdiction: string): LegalResource[] {
    const local: LegalResource[] = [];
    const global: LegalResource[] = [];

    for (const entry of this.resources.values()) {
      if (!entry.isEmergency) continue;

      if (
        jurisdictionMatches(entry.jurisdiction, jurisdiction) &&
        entry.jurisdiction.toUpperCase() !== "*"
      ) {
        local.push(stripInternal(entry));
      } else if (entry.jurisdiction === "*") {
        global.push(stripInternal(entry));
      }
    }

    return [...local, ...global];
  }

  /**
   * Return all resources currently registered.
   */
  getAllResources(): LegalResource[] {
    return Array.from(this.resources.values()).map(stripInternal);
  }

  /**
   * Return a resource by id.
   */
  getResource(id: string): LegalResource | undefined {
    const entry = this.resources.get(id);
    return entry !== undefined ? stripInternal(entry) : undefined;
  }

  /**
   * Return all resources of a specific type.
   */
  getResourcesByType(type: LegalResourceType): LegalResource[] {
    return Array.from(this.resources.values())
      .filter((r) => r.type === type)
      .map(stripInternal);
  }
}

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

const TYPE_PRIORITY: Record<LegalResourceType, number> = {
  legal_aid: 0,
  ngo: 1,
  ombudsman: 2,
  hotline: 3,
  website: 4,
};

function compareLegalResources(a: LegalResource, b: LegalResource): number {
  // Free resources first
  if (a.freeOfCharge && !b.freeOfCharge) return -1;
  if (!a.freeOfCharge && b.freeOfCharge) return 1;
  // Then by type priority
  const aPriority = TYPE_PRIORITY[a.type] ?? 99;
  const bPriority = TYPE_PRIORITY[b.type] ?? 99;
  return aPriority - bPriority;
}

/** Strip internal implementation fields before returning to callers. */
function stripInternal(entry: ResourceEntry): LegalResource {
  const { _langSet: _ls, isEmergency: _ie, domains: _d, ...resource } = entry;
  return resource;
}
