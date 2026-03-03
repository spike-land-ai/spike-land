# CLAUDE.md

## Overview

Auth MCP server for spike.land, handling authentication via Better Auth with
Drizzle ORM. Runs as a Cloudflare Worker. Published as
`@spike-land-ai/mcp-auth`.

## Commands

```bash
npm run dev           # Local wrangler dev server
npm run deploy        # Deploy to Cloudflare Workers
npm run db:generate   # Generate Drizzle migrations
npm run db:push       # Push schema to database
npm run db:studio     # Open Drizzle Studio
npm test              # Run tests (Vitest)
npm run typecheck     # tsc --noEmit
npm run lint          # ESLint
```

## Architecture

```
src/
├── index.ts       # Worker entry point
├── auth.ts        # Better Auth configuration
└── db/
    ├── schema.ts  # Drizzle ORM schema definitions
    └── schema.test.ts
```

**Key technologies**: MCP SDK, Better Auth, Drizzle ORM, Cloudflare Workers.

## Code Quality Rules

- Never use `any` type — use `unknown` or proper types
- Never add `eslint-disable` or `@ts-ignore` comments
- TypeScript strict mode
- All business logic must have test coverage

## CI/CD

- Shared workflow: `.github/.github/workflows/ci-publish.yml`
- Deployed via `wrangler deploy`
