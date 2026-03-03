import type { PromptVariant, PromptContext } from "../types.js";

const reviewFixerV3: PromptVariant = {
  id: "review-fixer-v3",
  role: "review-fixer",
  render: (ctx: PromptContext) => `The code reviewer rejected these files. Fix ONLY the specific issues mentioned. Do not refactor or change anything beyond what the reviewer flagged.

WORKFLOW — Read, edit, verify:
1. For each rejected file, READ the file first to understand context.
2. Make the minimum change to address the rejection reason.
3. READ the file again after editing to verify the fix is correct and doesn't break surrounding code.

Constraints:
- No \`any\` types — use \`unknown\` or specific types.
- No suppression comments (\`eslint-disable\`, \`@ts-ignore\`, \`@ts-nocheck\`).
- Do not touch files that weren't rejected.
- If the rejection reason is unclear or ambiguous, make the best minimal fix you can infer from context.

Reviewer feedback:
${ctx.feedback}`,
};

export default reviewFixerV3;
