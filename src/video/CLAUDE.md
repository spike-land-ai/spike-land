# CLAUDE.md

## Overview

Educational video compositions built with Remotion (React-based video
framework). Currently includes "The Vibe Coding Paradox" and "No More 404s".
Private package, not published.

## Commands

```bash
npm run dev                  # Remotion Studio (preview + edit)
npm run render:vcp           # Render VibeCodingParadox video
npm run render:n404          # Render NoMore404s video
npm run generate-audio:n404  # Generate audio for NoMore404s
npm run render:scene         # Render a specific scene
npm test                     # Run tests (Vitest)
npm run test:coverage        # Tests with coverage
npm run typecheck            # tsc --noEmit
npm run lint                 # ESLint
```

## Architecture

```
├── Root.tsx           # Remotion root (composition registration)
├── index.ts           # Entry point
├── compositions/      # Video compositions (each is a full video)
├── components/        # Reusable visual components
├── lib/               # Shared utilities (animation, timing)
└── pages/             # Page-level components
```

**Key technologies**: Remotion 4.x, React 19, Zod.

## Code Quality Rules

- Never use `any` type — use `unknown` or proper types
- Never add `eslint-disable` or `@ts-ignore` comments
- TypeScript strict mode

## CI/CD

- Shared workflow: `.github/.github/workflows/ci-publish.yml`
- Private package (not published to registry)
- No internal `@spike-land-ai` dependencies (leaf package)
