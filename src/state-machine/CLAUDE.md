# CLAUDE.md

## Overview

Statechart engine with guard expression parser for spike.land. Includes a CLI
for visualization. Published as `@spike-land-ai/state-machine`, runs in Node.js.

## Commands

```bash
npm run build         # Compile TypeScript
npm test              # Run tests (Vitest)
npm run test:watch    # Watch mode
npm run test:coverage # Tests with coverage
npm run typecheck     # tsc --noEmit
npm run lint          # ESLint
```

## Architecture

```
├── index.ts                # Main entry (re-exports)
├── types.ts                # TypeScript type definitions
├── engine.ts               # Core statechart engine
├── parser.ts               # Guard expression parser
├── persistence.ts          # State persistence (subpath export)
├── cli.ts                  # CLI entry point (state-machine-cli bin)
├── visualizer-template.ts  # HTML template for state visualization
└── *.test.ts               # Co-located test files
```

**Exports**:

- `@spike-land-ai/state-machine` — engine, parser, types
- `@spike-land-ai/state-machine/persistence` — persistence utilities

**CLI**: `state-machine-cli` binary.

## Code Quality Rules

- Never use `any` type — use `unknown` or proper types
- Never add `eslint-disable` or `@ts-ignore` comments
- TypeScript strict mode
- All business logic must have test coverage

## CI/CD

- Shared workflow: `.github/.github/workflows/ci-publish.yml`
- Changesets for versioning
- Publishes to GitHub Packages (`@spike-land-ai/*`)
