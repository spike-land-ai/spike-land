# CLAUDE.md

## Overview

Shared ESLint flat config for all `@spike-land-ai` packages. Published as `@spike-land-ai/eslint-config`. Configuration-only package (no build step).

## Commands

No build or test scripts — this is a pure configuration package.

## Architecture

```
index.mjs    # Base config: TypeScript-only (no React/JSX)
react.mjs    # Extended config with React + React Hooks support
```

**Exports**:
- `@spike-land-ai/eslint-config` — base TypeScript config (`createConfig()`)
- `@spike-land-ai/eslint-config/react` — React config (`createReactConfig()`)

**Dependencies**: `typescript-eslint`. Optional peers: `eslint-plugin-react`, `eslint-plugin-react-hooks`.

## Code Quality Rules

- Never use `any` type — use `unknown` or proper types
- Never add `eslint-disable` or `@ts-ignore` comments
- Changes here affect linting in all consuming packages

## CI/CD

- Shared workflow: `.github/.github/workflows/ci-publish.yml`
- Changesets for versioning
- Publishes to GitHub Packages (`@spike-land-ai/*`)
