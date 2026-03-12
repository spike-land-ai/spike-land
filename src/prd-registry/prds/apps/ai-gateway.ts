import type { PrdDefinition } from "../../core-logic/types.js";

export const aiGatewayPrd: PrdDefinition = {
  id: "app:ai-gateway",
  level: "app",
  name: "AI Gateway",
  summary: "OpenAI-compatible chat surface with provider routing, model discovery, and MCP context",
  purpose:
    "An OpenAI-compatible /v1 API surface. Routes to the right AI provider, injects local docs and MCP capability context, and supports streaming responses.",
  constraints: [
    "Must maintain OpenAI /v1/chat/completions contract",
    "Provider selection must respect user's API key configuration",
    "Streaming responses must use SSE format",
    "Credit usage tracked per request",
  ],
  acceptance: [
    "Chat completions work with at least 3 providers",
    "Model listing returns accurate provider capabilities",
    "Streaming works without buffering entire response",
  ],
  toolCategories: ["ai-gateway"],
  tools: ["ai_list_providers", "ai_list_models", "ai_chat"],
  composesFrom: ["platform", "domain:ai-automation", "route:/apps"],
  routePatterns: ["/apps/ai-gateway"],
  keywords: ["ai", "gateway", "openai", "chat", "model", "provider", "api"],
  tokenEstimate: 380,
  version: "1.0.0",
};
