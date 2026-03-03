# CLAUDE.md

## Overview

QA Studio browser automation utilities for spike.land, built on Playwright. Published as `@spike-land-ai/qa-studio`, runs in Node.js.

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
├── index.ts           # Main entry (re-exports)
├── types.ts           # TypeScript type definitions
└── browser-session.ts # Playwright browser session management
```

**Peer dependency**: `playwright` (>=1.0.0).

## Code Quality Rules

- Never use `any` type — use `unknown` or proper types
- Never add `eslint-disable` or `@ts-ignore` comments
- TypeScript strict mode
- All business logic must have test coverage

## CI/CD

- Shared workflow: `.github/.github/workflows/ci-publish.yml`
- Changesets for versioning
- Publishes to GitHub Packages (`@spike-land-ai/*`)
