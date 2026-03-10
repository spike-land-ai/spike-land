/**
 * Plain Language Module
 *
 * Converts form metadata and legal boilerplate into plain, accessible
 * explanations.  All functions are pure — no I/O, no AI calls, no fabrication
 * of factual content.  They rephrase structure and labels; they do not
 * interpret legal meaning.
 */

import type { FormField, FormTemplate } from "../types.js";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Produce a single plain-language sentence explaining what a form field
 * is asking for and what a valid answer looks like.
 */
export function explainField(field: FormField): string {
  const requiredTag = field.required ? "Required" : "Optional";
  const typeGuide = typeGuideFor(field);
  const help = field.helpText ? ` ${field.helpText}` : "";
  const validationNote = validationNoteFor(field);

  return `[${requiredTag}] ${field.label}: ${typeGuide}${validationNote}${help}`.trim();
}

/**
 * Return a step-by-step overview of what a form is about and what the user
 * will need to provide.  Each string in the array is a self-contained
 * paragraph intended to be displayed as a numbered list.
 */
export function explainForm(template: FormTemplate): string[] {
  const steps: string[] = [
    `This is the "${template.name}" form for ${template.jurisdiction}.`,
    `It has ${template.fields.length} field${template.fields.length === 1 ? "" : "s"}: ` +
      `${countRequired(template)} required and ` +
      `${template.fields.length - countRequired(template)} optional.`,
  ];

  // Group fields by type so the user knows what kinds of answers to prepare.
  const typeGroups = groupByType(template.fields);
  for (const [type, fields] of Object.entries(typeGroups)) {
    if (fields.length === 0) continue;
    const names = fields.map((f) => `"${f.label}"`).join(", ");
    steps.push(`${typeLabel(type)}: ${names}.`);
  }

  // Surface any fields that have options so the user can prepare.
  const selectFields = template.fields.filter((f) => f.type === "select" && f.options?.length);
  if (selectFields.length > 0) {
    for (const f of selectFields) {
      steps.push(`For "${f.label}", you will choose from: ${f.options!.join(", ")}.`);
    }
  }

  // Include the official instructions if they are non-trivial.
  if (template.instructions.trim().length > 0) {
    steps.push(`Official instructions: ${template.instructions.trim()}`);
  }

  return steps;
}

/**
 * Attempt to rephrase a block of legal or bureaucratic text in plain English.
 *
 * This is a pattern-based stub.  It applies a series of string replacements
 * for the most common legalese phrases.  A production system would integrate
 * an LLM call here, but COMPASS keeps this module free of external dependencies
 * and never fabricates meaning it cannot derive from the input text.
 */
export function translateLegalese(text: string): string {
  let result = text;

  for (const [pattern, replacement] of LEGALESE_MAP) {
    result = result.replace(pattern, replacement);
  }

  // Collapse multiple spaces that substitutions may create.
  result = result.replace(/  +/g, " ").trim();

  return result;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function typeGuideFor(field: FormField): string {
  switch (field.type) {
    case "text":
      return "Enter text.";
    case "date":
      return "Enter a date (format: YYYY-MM-DD, e.g. 1990-04-15).";
    case "number":
      return "Enter a number.";
    case "checkbox":
      return "Tick this box if the statement applies to you.";
    case "select":
      return field.options?.length
        ? `Choose one of: ${field.options.join(", ")}.`
        : "Choose from the available options.";
    case "signature":
      return "Type your full legal name exactly as it appears on your ID.";
  }
}

function validationNoteFor(field: FormField): string {
  const v = field.validation;
  if (!v) return "";

  const parts: string[] = [];

  if (field.type === "text" || field.type === "signature") {
    if (v.min !== undefined) parts.push(`at least ${v.min} characters`);
    if (v.max !== undefined) parts.push(`at most ${v.max} characters`);
    if (v.pattern) parts.push(`must match the format: ${v.pattern}`);
  } else if (field.type === "number") {
    if (v.min !== undefined) parts.push(`minimum value: ${v.min}`);
    if (v.max !== undefined) parts.push(`maximum value: ${v.max}`);
  }

  if (parts.length === 0) return "";
  return ` (${parts.join("; ")})`;
}

function countRequired(template: FormTemplate): number {
  return template.fields.filter((f) => f.required).length;
}

function groupByType(fields: readonly FormField[]): Record<string, FormField[]> {
  const groups: Record<string, FormField[]> = {};
  for (const field of fields) {
    if (!groups[field.type]) groups[field.type] = [];
    groups[field.type]!.push(field);
  }
  return groups;
}

function typeLabel(type: string): string {
  const labels: Record<string, string> = {
    text: "Text fields to fill in",
    date: "Date fields",
    number: "Numeric fields",
    checkbox: "Checkboxes to tick",
    select: "Drop-down selections",
    signature: "Signature fields",
  };
  return labels[type] ?? `"${type}" fields`;
}

// ---------------------------------------------------------------------------
// Legalese replacement map
// ---------------------------------------------------------------------------
// Each entry is [RegExp, replacement string].  Order matters — more specific
// phrases should appear before more general ones.
// ---------------------------------------------------------------------------

const LEGALESE_MAP: Array<[RegExp, string]> = [
  // Clauses
  [/\bnotwithstanding\b/gi, "even though"],
  [/\bwherein\b/gi, "where"],
  [/\bhereinafter\b/gi, "from here on called"],
  [/\bhereinbefore\b/gi, "mentioned earlier"],
  [/\bthereof\b/gi, "of that"],
  [/\btherein\b/gi, "in that"],
  [/\bthereto\b/gi, "to that"],
  [/\bhereunder\b/gi, "under this"],
  [/\bhereunto\b/gi, "to this"],
  [/\bwhereas\b/gi, "given that"],
  [/\bwherefore\b/gi, "for this reason"],
  [/\binter alia\b/gi, "among other things"],
  [/\bmutatis mutandis\b/gi, "with necessary changes applied"],
  [/\bpari passu\b/gi, "equally and proportionally"],
  [/\bpro rata\b/gi, "proportionally"],
  [/\bin lieu of\b/gi, "instead of"],
  [/\bin accordance with\b/gi, "following"],
  [/\bpursuant to\b/gi, "under"],
  [/\bwith respect to\b/gi, "about"],
  [/\bwith regard to\b/gi, "about"],
  [/\bin connection with\b/gi, "related to"],
  [/\bshall be deemed\b/gi, "will be considered"],
  [/\bshall\b/gi, "must"],
  [/\bmay not\b/gi, "cannot"],
  [/\bprior to\b/gi, "before"],
  [/\bsubsequent to\b/gi, "after"],
  [/\bin the event that\b/gi, "if"],
  [/\bat such time as\b/gi, "when"],
  [/\bfor the purposes of\b/gi, "for"],
  [/\bwith the exception of\b/gi, "except for"],
  [/\bsave and except\b/gi, "except"],
  [/\bany and all\b/gi, "all"],
  [/\beach and every\b/gi, "every"],
  [/\bnull and void\b/gi, "invalid"],
  [/\bcease and desist\b/gi, "stop"],
  [/\btrue and correct\b/gi, "accurate"],
  [/\bfull and complete\b/gi, "complete"],
  [/\bforce and effect\b/gi, "effect"],
  [/\bterm and condition/gi, "condition"],
  [/\brepresentations and warranties\b/gi, "promises"],
  [/\bindemnify and hold harmless\b/gi, "protect from liability"],
  [/\bexecute and deliver\b/gi, "sign and provide"],
  [/\bcovenants and agrees\b/gi, "agrees"],
  [/\bauthorise[sd]?\b/gi, "allow"],
  [/\bforthwith\b/gi, "immediately"],
  [/\bhitherto\b/gi, "until now"],
  [/\bheretofore\b/gi, "up until now"],
  [/\baforesaid\b/gi, "previously mentioned"],
];
