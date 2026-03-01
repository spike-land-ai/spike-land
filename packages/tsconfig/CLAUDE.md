# CLAUDE.md

## Overview

Shared TypeScript config presets for all `@spike-land-ai` packages. Published as `@spike-land-ai/tsconfig`. Configuration-only package (no build step).

## Commands

No build or test scripts — this is a pure configuration package.

## Architecture

```
tsconfig.base.json      # Base config: strict mode, ESM, common settings
tsconfig.mcp.json       # Preset for MCP server packages
tsconfig.bundler.json   # Preset for bundler-based packages (Vite, esbuild)
tsconfig.worker.json    # Preset for Cloudflare Worker packages
```

**Usage**: Packages extend a preset via `"extends": "@spike-land-ai/tsconfig/tsconfig.mcp.json"`.

## Code Quality Rules

- Changes here affect TypeScript compilation in all consuming packages
- Always maintain strict mode settings

## CI/CD

- Shared workflow: `.github/.github/workflows/ci-publish.yml`
- Changesets for versioning
- Publishes to GitHub Packages (`@spike-land-ai/*`)
