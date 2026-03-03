# CLAUDE.md

## Overview

SpacetimeDB 2.0 platform module for spike.land — users, tools, apps, agents, content, and messaging. Defines 14 tables and 30+ reducers compiled to a WASM module and deployed to SpacetimeDB maincloud. Also ships as an MCP server (`@spike-land-ai/spacetimedb-platform`) that exposes platform operations as MCP tools via the generated TypeScript bindings.

**Server**: maincloud
**Database**: `rightful-dirt-5033`

## Commands

```bash
# SpacetimeDB module
spacetime build                                                          # Compile WASM module
spacetime publish rightful-dirt-5033                                     # Deploy to maincloud
# TypeScript / MCP server
npm run build        # tsc
npm run dev          # tsc --watch
npm test             # vitest run
npm run test:coverage # vitest run --coverage
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint
npm start            # node dist/index.js (MCP server via stdio)
```

## Architecture

```
├── index.ts              # MCP server entry — registers all tool groups
├── client.ts             # SpacetimeDB client factory (mock/test)
├── client-live.ts        # Live SpacetimeDB client (maincloud)
├── types.ts              # Shared TypeScript types
├── types.test.ts         # Type tests
├── stdb-http-client.ts   # Native HTTP fetch client for SpacetimeDB (no SDK)
├── image-types.ts        # Image-related type definitions
├── typed-tables.ts       # Typed table definitions
├── tools/                # MCP tool implementations
│   ├── user-tools.ts     # User registration, profile, OAuth
│   ├── app-tools.ts      # App CRUD, versioning, status
│   ├── tool-registry-tools.ts  # Register/unregister platform tools
│   ├── content-tools.ts  # Pages, page blocks, reordering
│   ├── message-tools.ts  # DMs, agent messages, app messages
│   └── analytics-tools.ts      # Platform events, health checks, tool usage
└── __test-utils__/       # Shared test helpers
```

### Tables (14)

| Table | Purpose |
|-------|---------|
| `user_table` | Platform users |
| `oauth_link_table` | OAuth provider links |
| `app_table` | Applications |
| `app_version_table` | App version history |
| `app_message_table` | In-app messages |
| `agent_table` | Registered agents |
| `agent_message_table` | Agent-to-agent messages |
| `registered_tool_table` | Platform tool registry |
| `user_tool_preference_table` | Per-user tool preferences |
| `page_table` | Content pages |
| `page_block_table` | Page content blocks |
| `direct_message_table` | User DMs |
| `code_session_table` | Live coding sessions |
| `mcp_task_table` | MCP task queue |
| `health_check_table` | Service health records |
| `platform_event_table` | Analytics/audit events |
| `tool_usage_table` | Tool invocation tracking |

### Key Reducers

User/auth: `register_user`, `update_profile`, `link_oauth`
Apps: `create_app`, `update_app`, `delete_app`, `restore_app`, `update_app_status`, `create_app_version`, `update_code_session`
Tools: `register_tool`, `unregister_tool`, `invoke_tool_request`
Content: `create_page`, `update_page`, `delete_page`, `create_page_block`, `update_page_block`, `delete_page_block`, `reorder_page_blocks`
Messaging: `send_dm`, `mark_dm_read`, `send_agent_message`, `mark_agent_message_delivered`, `send_app_message`
Agents: `register_agent`, `unregister_agent`
Tasks: `claim_mcp_task`, `complete_mcp_task`
Monitoring: `record_health_check`, `record_platform_event`

### MCP Server Pattern

The package follows the standard MCP server pattern: `@modelcontextprotocol/sdk` + Zod validation + tool handler per domain. Each `tools/*.ts` file exports a `register*Tools(server, client)` function. The `client` interface abstracts the SpacetimeDB connection so tests can use `client.ts` (mock) while production uses `client-live.ts`.

## Code Quality Rules

- Never use `any` type — use `unknown` or proper types
- Never add `eslint-disable` or `@ts-ignore` comments
- TypeScript strict mode
- Each tool group has a paired `*.test.ts` file in `tools/`

## CI/CD

- Shared workflow: `.github/.github/workflows/ci-publish.yml`
- Changesets for versioning
- Publishes to GitHub Packages (`@spike-land-ai/spacetimedb-platform`)
- Leaf package — no internal `@spike-land-ai/*` dependencies, no downstream cascade
