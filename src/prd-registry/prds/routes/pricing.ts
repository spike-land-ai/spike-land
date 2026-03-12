import type { PrdDefinition } from "../../core-logic/types.js";

export const pricingRoute: PrdDefinition = {
  id: "route:/pricing",
  level: "route",
  name: "Pricing",
  summary: "Subscription tiers, feature comparison, and Stripe checkout integration",
  purpose:
    "Pricing page showing free/pro/business tiers with feature comparison table and Stripe checkout buttons. Handles plan upgrades, downgrades, and billing portal links.",
  constraints: [
    "Prices must come from Stripe (no hardcoded amounts)",
    "Feature list must match actual tool tier gating",
    "Checkout must handle both new and existing customers",
  ],
  acceptance: [
    "All three tiers displayed with accurate feature lists",
    "Checkout button creates valid Stripe session",
  ],
  toolCategories: ["billing", "credits"],
  tools: [],
  composesFrom: ["platform", "domain:platform-infra"],
  routePatterns: ["/pricing"],
  keywords: ["pricing", "plan", "subscription", "billing", "tier", "upgrade"],
  tokenEstimate: 180,
  version: "1.0.0",
};
