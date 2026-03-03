# MCP Server

The Model Context Protocol server that exposes 120+ tools to AI clients.
Implements a progressive-disclosure registry: 5 gateway-meta tools are always
active; all others are discoverable via `search_tools` and enabled per-category.

## Core Files (server/)

| File                      | Responsibility                                                                                                                                                                             |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `tool-registry.ts`        | `ToolRegistry` class — registration, lookup, category enable/disable, semantic search via `ToolEmbeddingIndex`. Defines `ToolDefinition`, `SearchResult`, `CategoryInfo`, `ToolComplexity` |
| `tool-loader.ts`          | `recordSkillUsage` — fires on every tool invocation; writes a `SkillUsageEvent` to Postgres and a `mcp_tool_usage` event to Google Analytics                                               |
| `tool-manifest.ts`        | Single source of truth listing every `register*` function. Adding a new tool = 1 import + 1 array entry here                                                                               |
| `mcp-server.ts`           | Wires registry into the `@modelcontextprotocol/sdk` `McpServer` and handles the HTTP/SSE transport                                                                                         |
| `app-mcp-server.ts`       | Per-app scoped variant of the server (used by standalone store apps)                                                                                                                       |
| `capability-evaluator.ts` | Evaluates user tier/role to gate `workspace`-tier tools                                                                                                                                    |
| `proxy-tool-registry.ts`  | Proxies remote MCP servers as local tools                                                                                                                                                  |

## tools/ Subdirectory

Each file in `tools/` exports a `register*` function that calls
`registry.register(toolDef)`. Domains:

| Subdirectory / file group                       | Domain                                                                          |
| ----------------------------------------------- | ------------------------------------------------------------------------------- |
| `tools/chess/`                                  | Chess Arena — game, player, challenge, replay, tournament                       |
| `tools/clean/`                                  | CleanSweep — rooms, tasks, streaks, scanner, motivate, reminders, verify, photo |
| `tools/bazdmeg/`                                | Bazdmeg app — FAQ, memory, workflow, telemetry, gates, skill-sync               |
| `tools/store/`                                  | App Store — apps, search, install, skills, A/B                                  |
| `tools/pages/`                                  | Page builder — AI generation, review, security, templates                       |
| `tools/state-machine/`                          | State machine CRUD + templates + visualizer                                     |
| `tools/qa/`                                     | QA Studio — browser automation runner                                           |
| `tools/career/`                                 | Career Navigator                                                                |
| `tools/tabletop/`                               | Tabletop Simulator                                                              |
| `tools/gateway-meta.ts`                         | Always-on meta tools (search_tools, enable_category, etc.)                      |
| `tools/storage.ts`, `gallery.ts`, `image.ts`, … | Platform-wide utilities                                                         |

Store apps (chess-arena, cleansweep, etc.) also expose their own tools via
`packages/store-apps/*/tools.ts` and are adapted into the registry through
`fromStandalone()` in `tool-manifest.ts`.

## Adding a New Tool

1. Create `tools/my-feature.ts`:
   ```ts
   import type { ToolRegistry } from "../tool-registry";
   import { z } from "zod";

   export function registerMyFeatureTools(registry: ToolRegistry) {
     registry.register({
       name: "my_action",
       description: "Does something useful",
       category: "my-feature",
       tier: "free",
       inputSchema: { param: z.string() },
       handler: async ({ param }) => ({
         content: [{ type: "text", text: `Result: ${param}` }],
       }),
     });
   }
   ```
2. Import and call it in `tool-manifest.ts`.
3. Add a test file `tools/my-feature.test.ts` using `createMockRegistry`:
   ```ts
   import { createMockRegistry, getText } from "../__test-utils__";
   import { registerMyFeatureTools } from "./my-feature";

   let registry: ReturnType<typeof createMockRegistry>;
   beforeEach(() => {
     registry = createMockRegistry();
     registerMyFeatureTools(registry);
   });

   it("does something", async () => {
     const result = await registry.call("my_action", { param: "hello" });
     expect(getText(result)).toBe("Result: hello");
   });
   ```

## Related Docs

- [docs/architecture/MCP_TOOL_GUIDELINES.md](../../../docs/architecture/MCP_TOOL_GUIDELINES.md)
- [docs/architecture/API_REFERENCE.md](../../../docs/architecture/API_REFERENCE.md)
- [docs/architecture/TOKEN_SYSTEM.md](../../../docs/architecture/TOKEN_SYSTEM.md)
