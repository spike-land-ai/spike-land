# CLAUDE.md

## Overview

Cross-platform WebAssembly binary for esbuild — a JavaScript bundler and minifier. Provides the esbuild API backed by a WASM binary for use in browsers and non-native environments. Published as `@spike-land-ai/esbuild-wasm`.

## Commands

This package primarily distributes pre-built binaries. There is no build step from source in this repo.

```bash
# No build/test scripts — this is a binary distribution package
```

## Architecture

```
lib/
├── main.js       # Node.js entry point
├── main.d.ts     # TypeScript types
├── browser.js    # Browser entry point
└── browser.d.ts
bin/              # CLI binaries
esbuild.wasm      # WASM binary
```

**Consumers**: esbuild-wasm-mcp, code, transpile, spike-land-backend, spike.land

## Code Quality Rules

- Never use `any` type — use `unknown` or proper types
- TypeScript strict mode for type definitions

## CI/CD

- Shared workflow: `.github/.github/workflows/ci-publish.yml`
- Changesets for versioning
- Publishes to GitHub Packages (`@spike-land-ai/*`)
- **High-impact package**: version bumps trigger PRs in 5 downstream repos
