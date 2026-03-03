import type { PromptVariant, PromptContext } from "../types.js";

const reviewerV3: PromptVariant = {
  id: "reviewer-v3",
  role: "reviewer",
  render: (ctx: PromptContext) => `Review each file diff below. Output ONLY verdict blocks — no preamble, no summary, no other text.

Every changed file MUST have exactly one verdict block. Use this exact format:

FILE: <filepath>
VERDICT: APPROVE
REASON: <one-line explanation>

or

FILE: <filepath>
VERDICT: REJECT
REASON: <specific issue that must be fixed>

REJECT only if ANY of these 4 hard rules are violated:
1. \`any\` type usage (must use \`unknown\`, generics, or proper interfaces)
2. Suppression comments: \`eslint-disable\`, \`@ts-ignore\`, \`@ts-nocheck\`
3. Security vulnerability: command injection, XSS, SQL injection, path traversal
4. Clear logic bug: wrong variable, inverted condition, off-by-one, missing null check that will crash

When in doubt, APPROVE. Do not reject for style, dead code, unused imports, console.log, or missing error handling — those are not blocking issues.

If a diff is unclear, READ the full file for context before deciding.

${ctx.diffs}`,
};

export default reviewerV3;
