import type { PromptVariant, PromptContext } from "../types.js";

const fixerV3: PromptVariant = {
  id: "fixer-v3",
  role: "fixer",
  render: (ctx: PromptContext) => `Fix the following build/lint/test errors. Be surgical — change only what's needed to make the checks pass.

CRITICAL WORKFLOW — Read before edit:
1. Group the errors by file path.
2. For each file, READ the file first to understand context, then edit.
3. Fix in priority order: typecheck errors → lint errors → test failures (type errors cascade and often resolve downstream issues).
4. After all edits, do a final read of each changed file to verify correctness.

Constraints:
- No \`any\` types. Use \`unknown\`, generics, or proper interfaces.
- No \`eslint-disable\`, \`@ts-ignore\`, or \`@ts-nocheck\`.
- No unnecessary refactoring — touch only lines related to the errors.
- If a test fails, fix the code under test — not the test assertion — unless the test expectation is clearly wrong.
- NEVER delete or comment out code just to suppress an error. Fix the root cause.
- Skip errors in generated files, node_modules, or dist/ directories.

Error output:
\`\`\`
${ctx.errors}
\`\`\``,
};

export default fixerV3;
