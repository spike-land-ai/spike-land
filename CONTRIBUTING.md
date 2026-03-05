# Contributing to spike-land-ai

Welcome, and thank you for your interest in contributing to spike-land-ai.

## Prerequisites

- **Node.js 24** (via NVM recommended)
- **Yarn** (workspace-enabled)
- **Git**

## Getting Started

```bash
git clone https://github.com/spike-land-ai/spike-land-ai.git
cd spike-land-ai
yarn install
```

All packages live under `src/`. Each package is a self-contained workspace with its own `package.json` and scripts. The `packages/` directory contains deploy shims only -- do not edit source there.

## Running Tests

```bash
cd src/<package>
npm test
```

To run tests with coverage:

```bash
npm run test:coverage
```

## Type Checking

```bash
cd src/<package>
npm run typecheck
```

## Pull Request Process

1. Branch from `main`.
2. Make your changes in `src/` (never edit `packages/` for source changes).
3. Write or update tests for your changes.
4. Ensure `npm test` and `npm run typecheck` pass in affected packages.
5. Submit a PR against `main`.

## Code Style

- TypeScript strict mode everywhere.
- Never use `any` -- use `unknown` or proper types.
- Never use `eslint-disable`, `@ts-ignore`, or `@ts-nocheck`.
- Use Vitest for all tests.
- Keep changes focused -- avoid unrelated refactors in the same PR.

## Project Architecture

See [CLAUDE.md](./CLAUDE.md) for detailed architecture documentation, package descriptions, and common commands.

## Versioning

Individual packages use [Changesets](https://github.com/changesets/changesets) for versioning and publishing. If your change affects a published package, include a changeset describing the change.
