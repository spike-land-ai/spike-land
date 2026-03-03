# CLAUDE.md

## Overview

Chess engine with ELO rating, game/player/challenge managers for spike.land.
Published as `@spike-land-ai/chess-engine`, runs in Node.js.

## Commands

```bash
npm run build         # Compile TypeScript
npm test              # Run tests (Vitest)
npm run test:coverage # Tests with coverage
npm run typecheck     # tsc --noEmit
npm run lint          # ESLint
```

## Architecture

```
├── index.ts               # Main entry (re-exports all modules)
├── types.ts               # TypeScript type definitions
├── engine.ts              # Core chess engine logic
├── elo.ts                 # ELO rating calculation
├── game-manager.ts        # Game lifecycle management
├── player-manager.ts      # Player state management
├── challenge-manager.ts   # Challenge creation and matching
└── *.test.ts              # Co-located test files
```

**Peer dependency**: `chess.js` (>=1.0.0)

## Code Quality Rules

- Never use `any` type — use `unknown` or proper types
- Never add `eslint-disable` or `@ts-ignore` comments
- TypeScript strict mode
- All business logic must have test coverage

## CI/CD

- Shared workflow: `.github/.github/workflows/ci-publish.yml`
- Changesets for versioning
- Publishes to GitHub Packages (`@spike-land-ai/*`)
