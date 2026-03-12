import type { PrdDefinition } from "../../core-logic/types.js";

export const vibeCodeRoute: PrdDefinition = {
  id: "route:/vibe-code",
  level: "route",
  name: "Vibe Code",
  summary: "Live React codespace with Monaco editor, instant preview, and AI-assisted development",
  purpose:
    "Interactive coding environment. Users write React/TypeScript in a Monaco editor with live preview, AI code suggestions, and one-click deploy to the app store.",
  constraints: [
    "Preview must hot-reload within 500ms of save",
    "esbuild-wasm handles all transpilation client-side",
    "File operations scoped to user's codespace only",
  ],
  acceptance: [
    "Code changes reflect in preview instantly",
    "TypeScript errors shown inline in editor",
    "Deploy to store creates valid app listing",
  ],
  toolCategories: ["codespace", "filesystem", "esbuild"],
  tools: [],
  composesFrom: ["platform", "domain:app-building"],
  routePatterns: ["/vibe-code", "/vibe-code/*"],
  keywords: ["code", "editor", "monaco", "preview", "vibe", "codespace", "develop"],
  tokenEstimate: 200,
  version: "1.0.0",
};
