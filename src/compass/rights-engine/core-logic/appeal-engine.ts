/**
 * COMPASS Rights Engine — appeal analysis and draft generation.
 *
 * The AppealEngine analyses rejection decisions and produces actionable,
 * jurisdiction-aware guidance. It operates entirely independently of any
 * government partnership.  A person's right to appeal is ALWAYS surfaced,
 * regardless of how politically sensitive the program is.
 *
 * The engine works from registered templates and jurisdiction rules.
 * Callers seed it with AppealTemplate objects; the engine then matches them
 * to decisions and generates personalised draft text.
 */

import type { AppealTemplate, AppealType, RejectionAnalysis, SuccessLikelihood } from "../types.js";

// ---------------------------------------------------------------------------
// Deadline rules per jurisdiction / appeal type
// ---------------------------------------------------------------------------

/**
 * Statutory deadline in calendar days from the date of the rejection decision.
 * Keyed as `${jurisdiction.toUpperCase()}::${appealType}`.
 * A value of null means the deadline is unknown — callers should prompt
 * the user to seek urgent legal advice.
 */
const DEADLINE_RULES: Record<string, number | null> = {
  // UK immigration
  "GB::formal": 14,
  "GB::complaint": 28,
  "GB::ombudsman": 365,
  // Germany
  "DE::formal": 30,
  "DE::complaint": 30,
  "DE::ombudsman": 180,
  // France
  "FR::formal": 30,
  "FR::ombudsman": 365,
  // EU supranational (e.g. EU asylum procedures directive)
  "EU::formal": 15,
  "EU::complaint": 30,
  // ECHR application (6-month rule — being reduced to 4 months)
  "ECHR::ombudsman": 120,
  // Fallback for known but slow jurisdictions
  "*::formal": 30,
  "*::informal": 14,
  "*::complaint": 28,
  "*::ombudsman": 365,
};

// ---------------------------------------------------------------------------
// Grounds detection patterns
// ---------------------------------------------------------------------------

interface GroundsPattern {
  /** Regex matched against normalised decision text. */
  pattern: RegExp;
  /** Human-readable ground statement, injected into analysis. */
  ground: string;
  /** Whether this ground elevates success likelihood. */
  strongGround: boolean;
}

const GROUNDS_PATTERNS: GroundsPattern[] = [
  {
    pattern: /no reason|no explanation|without reason|without explanation/i,
    ground: "Decision provides no reasoning — duty to give reasons may have been breached.",
    strongGround: true,
  },
  {
    pattern: /not consider|failed to consider|did not consider/i,
    ground: "Relevant evidence or circumstances appear not to have been considered.",
    strongGround: true,
  },
  {
    pattern: /policy|guidance|rule/i,
    ground: "Decision may reflect rigid policy application without individual assessment.",
    strongGround: false,
  },
  {
    pattern: /delay|late|out of time|time.?limit/i,
    ground:
      "Procedural fairness: delay by the decision-maker may affect the validity of the decision.",
    strongGround: false,
  },
  {
    pattern: /credib/i,
    ground:
      "Adverse credibility finding — may be challengeable if proper interview procedure was not followed.",
    strongGround: false,
  },
  {
    pattern: /not eligible|ineligib/i,
    ground: "Eligibility determination — legal basis for eligibility criteria should be verified.",
    strongGround: false,
  },
  {
    pattern: /document|evidence|proof/i,
    ground: "Document/evidence issue — may be possible to submit further evidence on appeal.",
    strongGround: true,
  },
  {
    pattern: /discretion|exceptional|compassionate/i,
    ground:
      "Discretionary decision — failure to exercise discretion lawfully is a recognised ground of challenge.",
    strongGround: false,
  },
  {
    pattern: /right to family|article 8|family life/i,
    ground:
      "Article 8 ECHR (right to family/private life) may be engaged — proportionality assessment required.",
    strongGround: true,
  },
  {
    pattern: /risk|persecution|harm/i,
    ground: "Protection claim element identified — refoulement risk assessment required.",
    strongGround: true,
  },
];

// ---------------------------------------------------------------------------
// User context for draft generation
// ---------------------------------------------------------------------------

export interface UserContext {
  applicantName?: string;
  referenceNumber?: string;
  decisionDate?: Date;
  decisionBody?: string;
  requestedRemedy?: string;
  /** Additional facts to insert into the grounds section. */
  additionalFacts?: string;
}

// ---------------------------------------------------------------------------
// AppealEngine
// ---------------------------------------------------------------------------

export class AppealEngine {
  private readonly templates = new Map<string, AppealTemplate>();

  // -------------------------------------------------------------------------
  // Template management
  // -------------------------------------------------------------------------

  /**
   * Register an appeal template.  Calling with an existing id overwrites.
   */
  addTemplate(template: AppealTemplate): void {
    this.templates.set(template.id, template);
  }

  /**
   * Return all templates for a given right and appeal type.
   */
  getAppealTemplate(rightId: string, type: AppealType): AppealTemplate | undefined {
    for (const tpl of this.templates.values()) {
      if (tpl.rightId === rightId && tpl.type === type) {
        return tpl;
      }
    }
    return undefined;
  }

  /**
   * Return all templates for a given right (all appeal types).
   */
  getTemplatesForRight(rightId: string): AppealTemplate[] {
    return Array.from(this.templates.values()).filter((t) => t.rightId === rightId);
  }

  // -------------------------------------------------------------------------
  // Analysis
  // -------------------------------------------------------------------------

  /**
   * Analyse a rejection decision text and return a structured
   * RejectionAnalysis.
   *
   * @param decision    The rejection decision text (verbatim or summary).
   * @param program     The program/scheme being applied for (e.g. "asylum",
   *                    "housing benefit").
   * @param jurisdiction ISO 3166-1 alpha-2 or supranational code.
   */
  analyzeRejection(decision: string, program: string, jurisdiction: string): RejectionAnalysis {
    const detectedGrounds = this.detectGroundsWithMeta(decision);
    const grounds = detectedGrounds.map((g) => g.ground);
    const strongGroundCount = detectedGrounds.filter((g) => g.strongGround).length;

    const successLikelihood = this.scoreSuccess(grounds.length, strongGroundCount);
    const isChallengeable = grounds.length > 0 || this.isAlwaysAppealable(program);
    const recommendedAction = this.buildRecommendedAction(
      isChallengeable,
      grounds,
      jurisdiction,
      program,
    );

    const deadline = isChallengeable
      ? this.getDeadline(new Date(), jurisdiction, "formal")
      : undefined;

    return {
      originalDecision: decision,
      isChallengeable,
      grounds,
      recommendedAction,
      ...(deadline !== undefined ? { deadline } : {}),
      successLikelihood,
    };
  }

  // -------------------------------------------------------------------------
  // Deadline calculation
  // -------------------------------------------------------------------------

  /**
   * Calculate the statutory appeal deadline from a rejection date.
   *
   * Returns the deadline Date, or a best-effort date if the jurisdiction/type
   * combination is not in the rules table (defaults to 30 days).
   */
  getDeadline(rejectionDate: Date, jurisdiction: string, type: AppealType): Date {
    const key = `${jurisdiction.toUpperCase()}::${type}`;
    const fallbackKey = `*::${type}`;

    const days = DEADLINE_RULES[key] ?? DEADLINE_RULES[fallbackKey] ?? 30;

    const deadline = new Date(rejectionDate);
    deadline.setDate(deadline.getDate() + days);
    return deadline;
  }

  // -------------------------------------------------------------------------
  // Draft generation
  // -------------------------------------------------------------------------

  /**
   * Generate a personalised appeal draft from a RejectionAnalysis and
   * optional user context.
   *
   * If no template is found for the recommended appeal type, returns a
   * universal fallback draft that still asserts the right to appeal.
   */
  generateAppealDraft(analysis: RejectionAnalysis, userContext: UserContext = {}): string {
    const type = this.inferAppealType(analysis);
    const template = this.findBestTemplate(analysis, type);

    if (template !== undefined) {
      return this.fillTemplate(template.template, analysis, userContext);
    }

    return this.universalFallbackDraft(analysis, userContext);
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private detectGroundsWithMeta(
    decision: string,
  ): Array<{ ground: string; strongGround: boolean }> {
    const results: Array<{ ground: string; strongGround: boolean }> = [];
    for (const pattern of GROUNDS_PATTERNS) {
      if (pattern.pattern.test(decision)) {
        results.push({ ground: pattern.ground, strongGround: pattern.strongGround });
      }
    }
    // Always surface the universal right to appeal.
    // The fallback is explicitly marked non-strong — it is a procedural
    // reminder, not a substantive legal ground.
    if (results.length === 0) {
      results.push({
        ground:
          "You have the right to challenge this decision. Request a detailed statement of reasons in writing.",
        strongGround: false,
      });
    }
    return results;
  }

  private detectGrounds(decision: string): string[] {
    return this.detectGroundsWithMeta(decision).map((g) => g.ground);
  }

  private scoreSuccess(totalGrounds: number, strongGrounds: number): SuccessLikelihood {
    if (strongGrounds >= 2 || totalGrounds >= 4) return "high";
    if (strongGrounds >= 1 || totalGrounds >= 2) return "medium";
    return "low";
  }

  private isAlwaysAppealable(program: string): boolean {
    const alwaysAppealable = [
      "asylum",
      "refugee",
      "protection",
      "deportation",
      "removal",
      "detention",
    ];
    const lower = program.toLowerCase();
    return alwaysAppealable.some((term) => lower.includes(term));
  }

  private buildRecommendedAction(
    isChallengeable: boolean,
    grounds: string[],
    jurisdiction: string,
    program: string,
  ): string {
    if (!isChallengeable) {
      return (
        `Although this decision may not be formally appealable at this stage, ` +
        `you have the right to request a written statement of reasons and ` +
        `to make a complaint about the process. Contact a legal aid provider ` +
        `in ${jurisdiction} for further advice.`
      );
    }

    const urgentPrograms = ["asylum", "refugee", "detention", "deportation"];
    const isUrgent = urgentPrograms.some((t) => program.toLowerCase().includes(t));

    const base =
      grounds.length >= 2
        ? `File a formal appeal immediately, citing the following grounds: ` +
          grounds.slice(0, 2).join("; ") +
          "."
        : `Request a full written statement of reasons, then file a formal appeal.`;

    if (isUrgent) {
      return (
        `URGENT — time limits are short in ${program} cases. ` +
        base +
        ` Seek legal representation as soon as possible.`
      );
    }

    return base;
  }

  private inferAppealType(analysis: RejectionAnalysis): AppealType {
    const groundsText = analysis.grounds.join(" ").toLowerCase();
    if (groundsText.includes("ombudsman") || groundsText.includes("complaint")) {
      return "complaint";
    }
    return "formal";
  }

  private findBestTemplate(
    analysis: RejectionAnalysis,
    type: AppealType,
  ): AppealTemplate | undefined {
    // Try to find a template that matches any ground keyword
    for (const tpl of this.templates.values()) {
      if (tpl.type === type) {
        return tpl;
      }
    }
    return undefined;
  }

  /**
   * Replace mustache-style placeholders in a template string.
   */
  private fillTemplate(
    templateText: string,
    analysis: RejectionAnalysis,
    ctx: UserContext,
  ): string {
    const groundsBullets = analysis.grounds.map((g) => `  - ${g}`).join("\n");

    const deadlineStr =
      analysis.deadline !== undefined ? analysis.deadline.toDateString() : "as soon as possible";

    const replacements: Record<string, string> = {
      APPLICANT_NAME: ctx.applicantName ?? "[YOUR FULL NAME]",
      REFERENCE_NUMBER: ctx.referenceNumber ?? "[REFERENCE NUMBER]",
      DECISION_DATE: ctx.decisionDate?.toDateString() ?? "[DATE OF DECISION]",
      DECISION_BODY: ctx.decisionBody ?? "[NAME OF DECISION-MAKING BODY]",
      GROUNDS: groundsBullets,
      DEADLINE: deadlineStr,
      LEGAL_BASIS: "[INSERT LEGAL BASIS]",
      REQUESTED_REMEDY: ctx.requestedRemedy ?? "that the decision be reconsidered and reversed",
      ADDITIONAL_FACTS: ctx.additionalFacts ?? "",
    };

    let result = templateText;
    for (const [key, value] of Object.entries(replacements)) {
      result = result.replaceAll(`{{${key}}}`, value);
    }
    return result;
  }

  private universalFallbackDraft(analysis: RejectionAnalysis, ctx: UserContext): string {
    const deadlineStr =
      analysis.deadline !== undefined ? analysis.deadline.toDateString() : "as soon as possible";

    const groundsBullets = analysis.grounds.map((g) => `  - ${g}`).join("\n");

    return `
[YOUR ADDRESS]
[DATE]

${ctx.decisionBody ?? "[NAME OF DECISION-MAKING BODY]"}
[THEIR ADDRESS]

Re: Formal Notice of Appeal / Request for Review
Reference: ${ctx.referenceNumber ?? "[REFERENCE NUMBER]"}

Dear Sir/Madam,

I am writing to formally appeal the decision dated ${ctx.decisionDate?.toDateString() ?? "[DATE OF DECISION]"}, which I received on [DATE RECEIVED].

I contest this decision on the following grounds:

${groundsBullets}

I request that the decision be reconsidered in full. Specifically, I ask ${ctx.requestedRemedy ?? "that the decision be reversed or that I be given a full and fair hearing"}.

${ctx.additionalFacts ? `Further relevant facts:\n${ctx.additionalFacts}\n` : ""}I understand that the deadline for this appeal is ${deadlineStr}. I am submitting this appeal within time.

I reserve the right to supplement this appeal with further evidence and legal submissions. Please acknowledge receipt of this letter in writing.

Yours faithfully,

${ctx.applicantName ?? "[YOUR FULL NAME]"}
`.trim();
  }
}
