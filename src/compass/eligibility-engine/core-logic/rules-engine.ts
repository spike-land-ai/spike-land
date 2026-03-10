/**
 * COMPASS Eligibility Engine — Rules Engine
 *
 * Deterministic: identical inputs always produce identical outputs.
 * No randomness, no I/O, no side effects.
 *
 * Field resolution order for `rule.field`:
 *   1. Dot-paths into the profile object  (e.g. "location.countryCode")
 *   2. "custom:<key>" — looks up profile.customFields.get(key)
 *   3. Top-level profile keys             (e.g. "age", "disabilities")
 */

import type {
  CustomFieldValue,
  Disability,
  EligibilityRule,
  MatchResult,
  Program,
  RuleValue,
  UserProfile,
} from "../types.js";
import { Operator } from "../types.js";

// ---------------------------------------------------------------------------
// Field resolution
// ---------------------------------------------------------------------------

type PrimitiveFieldValue =
  | string
  | number
  | boolean
  | readonly string[]
  | readonly number[]
  | readonly boolean[]
  | readonly Disability[]
  | undefined
  | null;

/**
 * Resolve a field path against a UserProfile.
 * Returns `undefined` when the path does not exist.
 */
function resolveField(profile: UserProfile, field: string): PrimitiveFieldValue {
  // Custom field namespace
  if (field.startsWith("custom:")) {
    const key = field.slice(7);
    const val: CustomFieldValue | undefined = profile.customFields.get(key);
    return val !== undefined ? val : undefined;
  }

  // Dot-path resolution (supports exactly two levels: "location.countryCode")
  const dotIndex = field.indexOf(".");
  if (dotIndex !== -1) {
    const parent = field.slice(0, dotIndex);
    const child = field.slice(dotIndex + 1);
    const parentVal = resolveTopLevel(profile, parent);
    if (parentVal !== null && typeof parentVal === "object" && !Array.isArray(parentVal)) {
      const obj = parentVal as Record<string, unknown>;
      const childVal = obj[child];
      if (
        typeof childVal === "string" ||
        typeof childVal === "number" ||
        typeof childVal === "boolean" ||
        childVal === undefined ||
        childVal === null
      ) {
        return childVal as PrimitiveFieldValue;
      }
    }
    return undefined;
  }

  const topVal = resolveTopLevel(profile, field);
  // If resolveTopLevel returned a plain object (e.g. location without a
  // sub-path), we cannot use it as a PrimitiveFieldValue — return undefined.
  if (topVal !== null && typeof topVal === "object" && !Array.isArray(topVal)) {
    return undefined;
  }
  return topVal as PrimitiveFieldValue;
}

function resolveTopLevel(
  profile: UserProfile,
  field: string,
): PrimitiveFieldValue | Record<string, unknown> {
  switch (field) {
    case "age":
      return profile.age;
    case "incomeAnnualCents":
      return profile.incomeAnnualCents;
    case "familySize":
      return profile.familySize;
    case "employmentStatus":
      return profile.employmentStatus;
    case "citizenshipStatus":
      return profile.citizenshipStatus;
    case "location":
      // Return the object so dot-path resolution can access sub-fields.
      return profile.location as unknown as Record<string, unknown>;
    case "disabilities":
      return profile.disabilities;
    case "languages":
      return profile.languages;
    default:
      return undefined;
  }
}

// ---------------------------------------------------------------------------
// Operator evaluation
// ---------------------------------------------------------------------------

function toNumber(v: unknown): number | undefined {
  if (typeof v === "number") return v;
  return undefined;
}

function toString(v: unknown): string | undefined {
  if (typeof v === "string") return v;
  return undefined;
}

function isStringArray(v: unknown): v is readonly string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

function isNumberArray(v: unknown): v is readonly number[] {
  return Array.isArray(v) && v.every((x) => typeof x === "number");
}

/**
 * Evaluate a single rule against a resolved field value.
 * Returns `true` when the rule is satisfied.
 */
function applyOperator(
  fieldValue: PrimitiveFieldValue,
  operator: Operator,
  ruleValue: RuleValue | undefined,
): boolean {
  switch (operator) {
    case Operator.exists:
      return fieldValue !== undefined && fieldValue !== null;

    case Operator.eq:
      if (ruleValue === undefined) return false;
      if (typeof fieldValue === "string") return fieldValue === toString(ruleValue);
      if (typeof fieldValue === "number") return fieldValue === toNumber(ruleValue);
      if (typeof fieldValue === "boolean") return fieldValue === ruleValue;
      return false;

    case Operator.neq:
      if (ruleValue === undefined) return false;
      if (typeof fieldValue === "string") return fieldValue !== toString(ruleValue);
      if (typeof fieldValue === "number") return fieldValue !== toNumber(ruleValue);
      if (typeof fieldValue === "boolean") return fieldValue !== ruleValue;
      return false;

    case Operator.gt: {
      const n = toNumber(fieldValue);
      const r = toNumber(ruleValue);
      if (n === undefined || r === undefined) return false;
      return n > r;
    }
    case Operator.lt: {
      const n = toNumber(fieldValue);
      const r = toNumber(ruleValue);
      if (n === undefined || r === undefined) return false;
      return n < r;
    }
    case Operator.gte: {
      const n = toNumber(fieldValue);
      const r = toNumber(ruleValue);
      if (n === undefined || r === undefined) return false;
      return n >= r;
    }
    case Operator.lte: {
      const n = toNumber(fieldValue);
      const r = toNumber(ruleValue);
      if (n === undefined || r === undefined) return false;
      return n <= r;
    }

    case Operator.in: {
      if (!Array.isArray(ruleValue)) return false;
      if (typeof fieldValue === "string" && isStringArray(ruleValue)) {
        return ruleValue.includes(fieldValue);
      }
      if (typeof fieldValue === "number" && isNumberArray(ruleValue)) {
        return ruleValue.includes(fieldValue);
      }
      return false;
    }

    case Operator.notIn: {
      if (!Array.isArray(ruleValue)) return false;
      if (typeof fieldValue === "string" && isStringArray(ruleValue)) {
        return !ruleValue.includes(fieldValue);
      }
      if (typeof fieldValue === "number" && isNumberArray(ruleValue)) {
        return !ruleValue.includes(fieldValue);
      }
      // If we cannot check membership, conservatively return false
      return false;
    }

    case Operator.contains: {
      if (typeof fieldValue === "string") {
        const s = toString(ruleValue);
        if (s === undefined) return false;
        return fieldValue.includes(s);
      }
      if (Array.isArray(fieldValue)) {
        // Check for disability code match when field is disabilities array
        if (fieldValue.length > 0 && typeof (fieldValue[0] as unknown) === "object") {
          const disArr = fieldValue as readonly Disability[];
          const code = toString(ruleValue);
          if (code === undefined) return false;
          return disArr.some((d) => d.code === code);
        }
        if (isStringArray(fieldValue)) {
          const s = toString(ruleValue);
          if (s === undefined) return false;
          return fieldValue.includes(s);
        }
        if (isNumberArray(fieldValue)) {
          const n = toNumber(ruleValue);
          if (n === undefined) return false;
          return (fieldValue as readonly number[]).includes(n);
        }
      }
      return false;
    }
  }
}

// ---------------------------------------------------------------------------
// RulesEngine class
// ---------------------------------------------------------------------------

export class RulesEngine {
  /**
   * Evaluate a single rule against a profile.
   */
  evaluateRule(profile: UserProfile, rule: EligibilityRule): boolean {
    const fieldValue = resolveField(profile, rule.field);
    return applyOperator(fieldValue, rule.operator, rule.value);
  }

  /**
   * Evaluate all rules for a program against a profile.
   * Returns a MatchResult with full detail on which rules passed/failed.
   */
  evaluateProgram(profile: UserProfile, program: Program): MatchResult {
    const failing: EligibilityRule[] = [];
    const passing: EligibilityRule[] = [];

    for (const rule of program.rules) {
      if (this.evaluateRule(profile, rule)) {
        passing.push(rule);
      } else {
        failing.push(rule);
      }
    }

    const totalRules = program.rules.length;
    const passedCount = passing.length;

    // matchScore: proportion of rules satisfied (0–1 range, 1.0 = fully eligible)
    const matchScore = totalRules === 0 ? 1 : passedCount / totalRules;
    const eligible = failing.length === 0;

    const requiredActions = failing.map((rule) => this.ruleToAction(rule));

    return {
      programId: program.id,
      eligible,
      matchScore,
      missingCriteria: failing,
      requiredActions,
    };
  }

  /**
   * Evaluate a profile against every program and return all MatchResults,
   * sorted by matchScore descending (eligible programs first, then closest
   * near-misses).
   */
  findEligiblePrograms(profile: UserProfile, programs: readonly Program[]): MatchResult[] {
    const results = programs.map((program) => this.evaluateProgram(profile, program));

    // Sort: eligible first (score 1.0), then by descending partial score.
    // Stable sort: programs with the same score retain their original order.
    return results.slice().sort((a, b) => {
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      return 0;
    });
  }

  /**
   * Return human-readable lines explaining why a profile is or is not eligible
   * for a program.
   */
  explainDecision(profile: UserProfile, program: Program): string[] {
    const lines: string[] = [];
    lines.push(`Program: ${program.name} (${program.id})`);
    lines.push(`Jurisdiction: ${program.jurisdiction}`);
    lines.push("");

    if (program.rules.length === 0) {
      lines.push("No eligibility rules — all applicants qualify.");
      return lines;
    }

    const passed: string[] = [];
    const failed: string[] = [];

    for (const rule of program.rules) {
      const ok = this.evaluateRule(profile, rule);
      const desc = this.ruleToDescription(rule);
      if (ok) {
        passed.push(`  PASS  ${desc}`);
      } else {
        const actual = resolveField(profile, rule.field);
        const actualStr = formatValue(actual);
        failed.push(`  FAIL  ${desc}  [profile value: ${actualStr}]`);
      }
    }

    if (failed.length === 0) {
      lines.push("ELIGIBLE — all criteria satisfied:");
    } else {
      lines.push(`INELIGIBLE — ${failed.length} of ${program.rules.length} criteria not met:`);
    }

    lines.push("");
    if (passed.length > 0) {
      lines.push("Satisfied criteria:");
      lines.push(...passed);
    }
    if (failed.length > 0) {
      lines.push("");
      lines.push("Unsatisfied criteria:");
      lines.push(...failed);
      lines.push("");
      lines.push("Required actions:");
      for (const rule of program.rules) {
        if (!this.evaluateRule(profile, rule)) {
          lines.push(`  - ${this.ruleToAction(rule)}`);
        }
      }
    }

    return lines;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private ruleToDescription(rule: EligibilityRule): string {
    if (rule.label) return rule.label;
    const val = rule.value !== undefined ? ` ${formatValue(rule.value)}` : "";
    return `${rule.field} ${rule.operator}${val}`;
  }

  private ruleToAction(rule: EligibilityRule): string {
    const label = rule.label ?? rule.field;
    switch (rule.operator) {
      case Operator.eq:
        return `Ensure ${label} is ${formatValue(rule.value)}`;
      case Operator.neq:
        return `Ensure ${label} is not ${formatValue(rule.value)}`;
      case Operator.gt:
        return `${label} must be greater than ${formatValue(rule.value)}`;
      case Operator.lt:
        return `${label} must be less than ${formatValue(rule.value)}`;
      case Operator.gte:
        return `${label} must be at least ${formatValue(rule.value)}`;
      case Operator.lte:
        return `${label} must be at most ${formatValue(rule.value)}`;
      case Operator.in:
        return `${label} must be one of: ${formatValue(rule.value)}`;
      case Operator.notIn:
        return `${label} must not be any of: ${formatValue(rule.value)}`;
      case Operator.contains:
        return `${label} must include ${formatValue(rule.value)}`;
      case Operator.exists:
        return `${label} must be provided`;
    }
  }
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function formatValue(v: unknown): string {
  if (v === undefined || v === null) return "—";
  if (Array.isArray(v)) return `[${v.join(", ")}]`;
  return String(v);
}
