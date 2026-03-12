import type { PrdDefinition } from "../../core-logic/types.js";

export const appsRoute: PrdDefinition = {
  id: "route:/apps",
  level: "route",
  name: "App Store",
  summary: "Browse, search, install, and manage apps from the spike.land store",
  purpose:
    "The app store listing page. Users discover apps by category, search, featured picks, and recommendations. Each app detail page shows tools, install button, ratings.",
  constraints: [
    "App cards must show: name, emoji, tagline, category, status badge",
    "Search results update as user types (debounced 300ms)",
    "Install flow must confirm before enabling tool categories",
  ],
  acceptance: [
    "Store loads with featured apps in <1s",
    "Search returns relevant results for partial queries",
    "Install/uninstall toggles tool access immediately",
  ],
  toolCategories: ["store-search", "store-install", "store", "store-skills"],
  tools: [],
  composesFrom: ["platform", "domain:app-building"],
  routePatterns: ["/apps", "/apps/*", "/apps/$slug"],
  keywords: ["store", "install", "browse", "discover", "apps", "marketplace"],
  tokenEstimate: 200,
  version: "1.0.0",
};
