# Copilot Instructions

## Project Overview

This is **spike.land** — a social media platform with AI-powered creative tools
built as a monorepo.

- **Company**: SPIKE LAND LTD (UK Company #16906682)
- **Domain**: spike.land

## Tech Stack

- **Framework**: Next.js 16 (App Router, Server Components, Server Actions)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: NextAuth.js (Better Auth patterns)
- **Testing**: Vitest (unit) + Playwright with Cucumber (E2E)
- **CI/CD**: GitHub Actions + Vercel
- **Package Manager**: Yarn 4 (Berry) — never use npm or pnpm

## Project Structure

```
spike.land/
├── src/                      # Next.js web app
│   ├── app/                  # App Router pages
│   ├── components/           # React components
│   │   └── ui/               # shadcn/ui components
│   └── lib/                  # Utilities
├── packages/
│   └── store-apps/           # App store data package
├── e2e/                      # E2E tests (Cucumber features + Playwright steps)
└── prisma/                   # Database schema
```

## Development Commands

```bash
yarn dev              # Start dev server (http://localhost:3000)
yarn build            # Production build
yarn lint             # ESLint
yarn test:coverage    # Unit tests with coverage (100% required)
yarn test:e2e:local   # E2E tests (requires dev server running)
yarn db:generate      # Generate Prisma client
```

## Coding Standards

- **100% code coverage** required for all unit tests
- **Co-locate test files** alongside source: `Component.tsx` →
  `Component.test.tsx`
- **Strict TypeScript**: no `any`, prefer `unknown`, explicit return types on
  exports
- **Prefer `interface` over `type`** for object shapes
- **Import from `@/`** path alias for src/ imports

## PR Conventions

- Link issues: include `Resolves #N` in PR description
- Keep PRs focused — one feature or fix per PR
- All CI checks must pass before merge
- Format: `feat:`, `fix:`, `refactor:`, `test:`, `docs:` prefixes

## Key Documentation

- `docs/features/FEATURES.md` — Platform vision and features
- `docs/architecture/API_REFERENCE.md` — API endpoints
- `docs/architecture/TOKEN_SYSTEM.md` — Token economy
- `docs/architecture/DATABASE_SCHEMA.md` — Database design
- `docs/architecture/DATABASE_SETUP.md` — Database setup guide

## Important Patterns

- **Server Components** are the default; only use `"use client"` when needed
- **Server Actions** for mutations (forms, data updates)
- **Prisma** for all database access — never raw SQL
- **shadcn/ui** components live in `src/components/ui/`
- **Tailwind CSS 4** with CSS-first configuration
