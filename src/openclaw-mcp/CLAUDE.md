# CLAUDE.md

## Overview

Standalone MCP bridge for the OpenClaw gateway. Translates OpenClaw tool
definitions into MCP-compatible tools. Node.js runtime, published as
`@spike-land-ai/openclaw-mcp`.

## Commands

```bash
npm run build        # Compile TypeScript (tsc)
npm test             # Run tests (Vitest)
npm run test:coverage # Tests with coverage
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint
npm start            # Run via CLI entry point
```

## Architecture

```
├── index.ts             # MCP server entry point
├── cli.ts               # CLI entry point (bin)
├── bridge.ts            # OpenClaw ↔ MCP bridge logic
├── bridge.test.ts
├── tool-adapter.ts      # Translates OpenClaw tools to MCP
├── tool-adapter.test.ts
├── translator.ts        # Schema/format translation
├── translator.test.ts
└── types.ts             # Shared types
```

**Key pattern**: Bridge connects to OpenClaw gateway, discovers available tools,
and re-exposes them as MCP tools with Zod-validated schemas.

## Code Quality Rules

- Never use `any` type — use `unknown` or proper types
- Never add `eslint-disable` or `@ts-ignore` comments
- TypeScript strict mode
- All business logic must have test coverage

## CI/CD

- Shared workflow: `.github/.github/workflows/ci-publish.yml`
- Changesets for versioning
- Publishes to GitHub Packages (`@spike-land-ai/*`)
- No internal `@spike-land-ai` dependencies (leaf package)
