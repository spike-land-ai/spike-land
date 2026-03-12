import type { PrdDefinition } from "../../core-logic/types.js";

export const appBuildingDomain: PrdDefinition = {
  id: "domain:app-building",
  level: "domain",
  name: "App Building",
  summary:
    "Create, iterate, and publish apps on the spike.land store using codespaces and MCP tools",
  purpose:
    "Domain for users building apps. Covers codespace development, template selection, store publishing, and the design system (Rubik font, semantic CSS vars, dark mode via .dark class).",
  constraints: [
    "Rubik font family only",
    "Semantic CSS variables (no hardcoded colors)",
    "Dark mode via .dark class, never dark: prefix",
    "No dead buttons or empty whitespace",
    "Responsive: mobile-first, test at 320px-1440px",
  ],
  acceptance: [
    "App renders correctly at all breakpoints",
    "All interactive elements have visible feedback",
    "Store listing has complete metadata",
  ],
  toolCategories: ["apps", "bootstrap", "create", "codespace", "filesystem", "codespace-templates"],
  tools: [],
  composesFrom: ["platform"],
  routePatterns: [],
  keywords: [
    "style",
    "font",
    "color",
    "design",
    "component",
    "layout",
    "responsive",
    "css",
    "theme",
    "dark mode",
    "build",
    "app",
    "codespace",
    "template",
  ],
  tokenEstimate: 300,
  version: "1.0.0",
};
