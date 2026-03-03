# CLAUDE.md

## Overview

Shared types, validations, constants, and utilities for the spike-land-ai
ecosystem. Dual-target (Node.js + Browser), bundled with tsup, published as
`@spike-land-ai/shared`.

## Commands

```bash
npm run build        # Bundle with tsup (CJS + ESM)
npm test             # Run tests (Vitest)
npm run test:coverage # Tests with coverage
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint
```

## Architecture

```
├── index.ts         # Main entry (re-exports all modules)
├── types/           # TypeScript type definitions
├── validations/     # Zod schemas and validation utilities
├── constants/       # Shared constants
└── utils/           # Utility functions
```

**Exports**: The package exposes granular subpath exports:

- `@spike-land-ai/shared` — everything
- `@spike-land-ai/shared/types` — types only
- `@spike-land-ai/shared/validations` — Zod schemas
- `@spike-land-ai/shared/constants` — constants
- `@spike-land-ai/shared/utils` — utility functions

**Consumers**: code, transpile, spike-land-backend, spike.land

## Code Quality Rules

- Never use `any` type — use `unknown` or proper types
- Never add `eslint-disable` or `@ts-ignore` comments
- TypeScript strict mode
- All exports must have test coverage
- Changes here cascade to all consumers via the dependency dispatch system

## CI/CD

- Shared workflow: `.github/.github/workflows/ci-publish.yml`
- Changesets for versioning
- Publishes to GitHub Packages (`@spike-land-ai/*`)
- **High-impact package**: version bumps trigger PRs in code, transpile,
  spike-land-backend, spike.land
