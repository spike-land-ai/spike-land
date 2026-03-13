// Re-export from canonical location in src/aether/
// Kept for backward compatibility with spike-chat.ts imports
export type { AetherNote, UserMemory, SplitPrompt } from "../../../aether/core-logic/types.js";
export {
  buildAetherSystemPrompt,
  buildClassifyPrompt,
  buildPlanPrompt,
  buildExtractPrompt,
} from "../../../aether/core-logic/prompt-builder.js";
