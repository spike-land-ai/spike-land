import type { PrdDefinition } from "../core-logic/types.js";

export const platformPrd: PrdDefinition = {
  id: "platform",
  level: "platform",
  name: "spike.land Platform",
  summary:
    "Open AI app store built on MCP runtime with composable tools, discovery, and install flows",
  purpose:
    "spike.land is a platform where every app is a bundle of composable MCP tools. Users discover, install, and compose apps. AI agents use the same tool surface via MCP protocol.",
  constraints: [
    "TypeScript strict mode, zero any, zero eslint-disable",
    "All tools follow MCP SDK + Zod schema + handler pattern",
    "Cloudflare Workers runtime (no Node.js APIs unless polyfilled)",
    "Token budget: keep AI context under 2000 tokens per interaction",
  ],
  acceptance: [
    "Every app must be discoverable via store search and MCP tool catalog",
    "AI agents can compose tools without human intervention",
  ],
  toolCategories: ["gateway-meta"],
  tools: [],
  composesFrom: [],
  routePatterns: [],
  keywords: ["platform", "spike", "mcp", "app store", "tools"],
  tokenEstimate: 200,
  version: "1.0.0",
};
