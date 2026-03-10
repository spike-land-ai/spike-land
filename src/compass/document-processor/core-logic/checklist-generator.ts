/**
 * Checklist Generator
 *
 * Produces DocumentChecklists from process step definitions and evaluates
 * completeness against documents the user already holds.  All logic is pure
 * and synchronous — no I/O, no fabrication of document content.
 */

import type {
  ChecklistItem,
  DocumentChecklist,
  PrerequisiteDocument,
  ProcessStep,
} from "../types.js";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build a DocumentChecklist for a bureaucratic process.
 *
 * @param processId   - Stable identifier for the process, e.g. "US-passport-renewal".
 * @param processSteps - Ordered list of process steps, each declaring which
 *                       documents it requires or accepts optionally.
 * @param userDocuments - Names of documents the applicant already has (case-
 *                        insensitive matching).
 */
export function generateChecklist(
  processId: string,
  processSteps: readonly ProcessStep[],
  userDocuments: readonly string[],
): DocumentChecklist {
  const normalised = new Set(userDocuments.map((d) => d.toLowerCase().trim()));

  // Deduplicate across steps while preserving required > optional precedence.
  const required = new Map<string, true>();
  const optional = new Map<string, true>();

  for (const step of processSteps) {
    for (const doc of step.requiredDocuments) {
      required.set(doc, true);
    }
    for (const doc of step.optionalDocuments ?? []) {
      if (!required.has(doc)) {
        optional.set(doc, true);
      }
    }
  }

  const items: ChecklistItem[] = [];

  for (const [name] of required) {
    items.push({
      documentName: name,
      required: true,
      obtained: normalised.has(name.toLowerCase().trim()),
      howToObtain: defaultHowToObtain(name),
    });
  }

  for (const [name] of optional) {
    items.push({
      documentName: name,
      required: false,
      obtained: normalised.has(name.toLowerCase().trim()),
      howToObtain: defaultHowToObtain(name),
    });
  }

  return { processId, items };
}

/**
 * Return canonical prerequisite documents for a named program.
 *
 * This is a static registry — new programs should be added to PREREQUISITES
 * below rather than inlining logic in callers.
 *
 * Returns an empty array (never throws) for unknown programs so callers can
 * always iterate safely.
 */
export function getPrerequisites(program: string): PrerequisiteDocument[] {
  return PREREQUISITES[program.toLowerCase().trim()] ?? [];
}

/**
 * Determine whether a checklist is complete and list any missing items.
 *
 * @returns `{complete: true, missing: []}` when every required item is
 *          obtained; otherwise `{complete: false, missing: [...names]}`.
 */
export function validateCompleteness(checklist: DocumentChecklist): {
  complete: boolean;
  missing: string[];
} {
  const missing = checklist.items
    .filter((item) => item.required && !item.obtained)
    .map((item) => item.documentName);

  return { complete: missing.length === 0, missing };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function defaultHowToObtain(documentName: string): string {
  return (
    `To obtain "${documentName}": contact the relevant issuing authority, ` +
    `bring valid photo ID, and request a certified copy or original document. ` +
    `Allow extra time for postal delivery if applying by mail.`
  );
}

// ---------------------------------------------------------------------------
// Static prerequisite registry
// ---------------------------------------------------------------------------

/**
 * Keyed by normalised program name.  Add entries here as COMPASS expands to
 * new jurisdictions and processes.
 */
const PREREQUISITES: Record<string, PrerequisiteDocument[]> = {
  "us-passport-renewal": [
    {
      name: "Current US Passport",
      issuingAuthority: "US Department of State",
      estimatedTime: "Already held",
      instructions:
        "Locate your most recent US passport book or card. It must not be " +
        "more than 15 years old to use the renewal-by-mail route (DS-82).",
    },
    {
      name: "Passport Photo",
      issuingAuthority: "Any authorised photo provider",
      estimatedTime: "Same day",
      cost: "$10–$20 USD",
      instructions:
        "Obtain two identical 2×2 inch colour photos taken within the last " +
        "6 months against a plain white background. Many pharmacies and " +
        "shipping centres offer this service.",
    },
    {
      name: "DS-82 Application Form",
      issuingAuthority: "US Department of State",
      estimatedTime: "Immediate (download)",
      instructions:
        "Download form DS-82 from travel.state.gov, print it, and complete " +
        "all fields in black ink. Do not sign until instructed.",
    },
  ],
  "uk-driving-licence-renewal": [
    {
      name: "Current UK Driving Licence",
      issuingAuthority: "DVLA",
      estimatedTime: "Already held",
      instructions:
        "Locate your current photocard driving licence. If lost, report it " +
        "to DVLA before applying for a renewal.",
    },
    {
      name: "Passport or National Identity Card",
      issuingAuthority: "HM Passport Office / issuing country",
      estimatedTime: "Varies",
      instructions:
        "A valid UK passport or EEA national identity card is required as " +
        "proof of identity. Ensure it is within its validity period.",
    },
    {
      name: "Recent Utility Bill or Bank Statement",
      issuingAuthority: "Utility provider or bank",
      estimatedTime: "Already held",
      instructions:
        "Provide a document dated within the last 3 months showing your " +
        "current address. Online statements are acceptable if printed.",
    },
  ],
  "canada-pr-renewal": [
    {
      name: "Current Permanent Resident Card",
      issuingAuthority: "Immigration, Refugees and Citizenship Canada (IRCC)",
      estimatedTime: "Already held",
      instructions:
        "Locate your expiring PR card. You may apply up to 6 months before " +
        "the expiry date. If lost or stolen, file a police report first.",
    },
    {
      name: "Proof of Physical Presence (Travel History)",
      issuingAuthority: "IRCC / Canada Border Services Agency",
      estimatedTime: "1–2 weeks",
      instructions:
        "Gather travel records (boarding passes, passport stamps, employer " +
        "letters) covering the last 5 years. You must demonstrate 730 days " +
        "of physical presence in Canada per 5-year period.",
    },
    {
      name: "Two Passport-Sized Photos",
      issuingAuthority: "Any authorised photo provider",
      estimatedTime: "Same day",
      cost: "$15–$25 CAD",
      instructions:
        "Photos must meet IRCC specifications: 50×70 mm, taken within the " +
        "last 6 months, plain white background, no glasses.",
    },
  ],
};
