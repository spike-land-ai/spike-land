# Contributing to spike-land-ai

Welcome, and thank you for your interest in contributing to spike-land-ai.

## Prerequisites

- **Node.js 24** (via NVM recommended)
- **Yarn** (workspace-enabled, Berry 4.x)
- **Git**
- **mkcert** (for local HTTPS dev): `brew install mkcert nss`
- **wrangler** (included as devDep, or install globally)

## Authentication

This monorepo pulls `@spike-land-ai/*` packages from GitHub Packages. You need a GitHub Personal Access Token with `read:packages` scope:

1. Go to https://github.com/settings/tokens and create a classic token with `read:packages` scope
2. Export it in your shell:
   ```bash
   export NODE_AUTH_TOKEN=ghp_your_token_here
   ```
3. Add it to your shell profile (`~/.zshrc` or `~/.bashrc`) to persist across sessions

## Getting Started

```bash
git clone https://github.com/spike-land-ai/spike-land-ai.git
cd spike-land-ai
make setup          # installs deps, sets up hooks, copies .dev.vars examples
```

Or manually:

```bash
yarn install
yarn prepare        # sets up husky pre-commit hooks
```

## Development

Start the full local stack (spike-app + spike-edge + spike-land-mcp + mcp-auth):

```bash
yarn dev            # requires mkcert + /etc/hosts entry (see scripts/dev-local.sh)
```

Or start individual services:

```bash
yarn dev:edge       # spike-edge on :8787
yarn dev:mcp        # spike-land-mcp on :8790
yarn dev:auth       # mcp-auth on :8791
yarn dev:app        # spike-app on :5173
```

## Project Layout

All workspace packages live under `packages/`. Source code is organized under `src/` in concern-based subdirectories. The `packages/` directory contains `wrangler.toml` configs and `package.json` files that reference source in `src/` via relative paths.

**Rule:** Edit source files in `src/`. Only modify `packages/` for wrangler config or dependency changes.

## Running Tests

```bash
yarn test                     # run all tests
yarn test:pkg chess-engine    # run tests for a specific package
yarn test:watch               # watch mode (all)
yarn test:watch:pkg shared    # watch mode (specific package)
yarn test:src                 # run tests for changed packages only
```

## Type Checking

```bash
yarn typecheck                # fast incremental typecheck
yarn typecheck:hardened       # strict mode (shared, spike-app, etc.)
```

## Linting & Formatting

```bash
yarn lint:check               # ESLint (read-only)
yarn lint                     # ESLint with auto-fix
yarn format:check             # Biome format check
yarn format                   # Biome format + write
```

## Health Check

```bash
make health                   # runs typecheck + lint + format + tests
```

## Pull Request Process

1. Branch from `main`.
2. Make your changes in `src/` (never edit `packages/` for source changes).
3. Write or update tests for your changes.
4. Ensure `yarn typecheck` and `yarn test:pkg <affected>` pass.
5. Submit a PR against `main`.

## Code Style

- TypeScript strict mode everywhere.
- Never use `any` -- use `unknown` or proper types.
- Never use `eslint-disable`, `@ts-ignore`, or `@ts-nocheck`.
- Use Vitest for all tests.
- Keep changes focused -- avoid unrelated refactors in the same PR.
- Biome handles formatting (spaces, double quotes, trailing commas).

## Versioning

Individual packages use [Changesets](https://github.com/changesets/changesets) for versioning and publishing. If your change affects a published package, include a changeset describing the change.

## Architecture

See [CLAUDE.md](./CLAUDE.md) for detailed architecture documentation, package descriptions, and common commands.
