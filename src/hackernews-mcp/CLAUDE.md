# CLAUDE.md

## Overview

MCP server for HackerNews with full read + write support. Node.js runtime,
published as `@spike-land-ai/hackernews-mcp`.

## Commands

```bash
npm run build        # Compile TypeScript (tsc)
npm test             # Run tests (Vitest)
npm run test:coverage # Tests with coverage
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint
npm start            # Run the MCP server
```

## Architecture

```
├── index.ts           # MCP server entry point
├── types.ts           # Shared types
├── clients/           # HackerNews API clients
├── session/           # Session management
├── tools/             # MCP tool implementations
└── __test-utils__/    # Test helpers
```

**Dependencies**: `@modelcontextprotocol/sdk`, Zod for validation.

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
