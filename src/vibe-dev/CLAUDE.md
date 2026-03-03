# CLAUDE.md

## Overview

Lightweight Docker-based development workflow CLI for vibe-coded apps. Watches
local files, syncs to containers, and manages dev environments. Node.js runtime,
bundled with tsup, published as `@spike-land-ai/vibe-dev`.

## Commands

```bash
npm run build        # Bundle with tsup
npm test             # Run tests (Vitest)
npm run test:coverage # Tests with coverage
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint
```

## Architecture

```
├── cli.ts         # CLI entry point (bin)
├── agent.ts       # Dev agent orchestration
├── api.ts         # API client
├── redis.ts       # Redis integration
├── sync.ts        # File sync logic
├── watcher.ts     # File watcher (chokidar)
└── __tests__/     # Test files
```

**Dependencies**: `chokidar` for file watching, `commander` for CLI.

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
