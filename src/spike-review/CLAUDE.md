# CLAUDE.md

## Overview

AI code review bot with BAZDMEG quality gates and GitHub integration. Can run as
a Node.js CLI or a Cloudflare Worker. Published as
`@spike-land-ai/spike-review`.

## Commands

```bash
npm run build        # Compile TypeScript (tsc)
npm test             # Run tests (Vitest)
npm run test:coverage # Tests with coverage
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint
```

## Architecture

```
├── index.ts         # Library entry point
├── cli.ts           # CLI entry point (bin)
├── types.ts         # Shared types
├── ai/              # AI provider integration (review generation)
├── github/          # GitHub API client (PRs, comments, checks)
├── rules/           # Review rules and quality gates
├── tools/           # MCP tool implementations
└── worker/          # Cloudflare Worker entry point
```

**Key pattern**: Receives GitHub webhook events, fetches PR diff, runs AI review
with quality gate rules, posts review comments.

## Code Quality Rules

- Never use `any` type — use `unknown` or proper types
- Never add `eslint-disable` or `@ts-ignore` comments
- TypeScript strict mode
- All business logic must have test coverage

## CI/CD

- Shared workflow: `.github/.github/workflows/ci-publish.yml`
- Changesets for versioning
- Publishes to GitHub Packages (`@spike-land-ai/*`)
- Worker deployable via `wrangler deploy`
- No internal `@spike-land-ai` dependencies (leaf package)
