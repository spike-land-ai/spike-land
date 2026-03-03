# CLAUDE.md

## Overview

Shared base utilities for `@spike-land-ai` MCP server packages. Provides common
patterns for building MCP servers. Published as
`@spike-land-ai/mcp-server-base`, runs in Node.js.

## Commands

```bash
npm run build         # Compile TypeScript
npm run dev           # Watch mode (tsc --watch)
npm test              # Run tests (Vitest)
npm run test:coverage # Tests with coverage
npm run typecheck     # tsc --noEmit
npm run lint          # ESLint
```

## Architecture

```
├── index.ts       # Main entry — base MCP server utilities
└── index.test.ts  # Tests
```

**Peer dependencies**: `@modelcontextprotocol/sdk` (>=1.0.0), `zod` (>=3.0.0).

**Consumers**: Used by other `@spike-land-ai` MCP server packages as a
foundation.

## Code Quality Rules

- Never use `any` type — use `unknown` or proper types
- Never add `eslint-disable` or `@ts-ignore` comments
- TypeScript strict mode
- All exports must have test coverage

## CI/CD

- Shared workflow: `.github/.github/workflows/ci-publish.yml`
- Changesets for versioning
- Publishes to GitHub Packages (`@spike-land-ai/*`)
