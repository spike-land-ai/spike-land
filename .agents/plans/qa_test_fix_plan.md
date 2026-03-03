# QA Test Fix & Coverage Plan

## Goal

- All tests passing in all packages.
- 96% coverage across all packages using Vitest.
- Fix identified common issues (missing jsdom, build artifact interference).

## Packages to Audit

1. `shared`
2. `esbuild-wasm-mcp`
3. `hackernews-mcp`
4. `openclaw-mcp`
5. `spike-review`
6. `spike-cli`
7. `vibe-dev`
8. `react-ts-worker`
9. `code`
10. `transpile`
11. `spike-land-backend`
12. `spike.land`
13. `video`
14. `spike-db`
15. `spike-app`
16. `mcp-image-studio`
17. `spike-land-mcp`
18. `spacetimedb-mcp`
19. `bazdmeg-mcp`

## Strategy

### Phase 1: Infrastructure & Configuration Fixes

- **Fix `vitest.workspace.ts`**: Use correct relative paths (e.g., `packages/*`)
  or explicit list with `packages/` prefix.
- **Exclude Build Artifacts**: Ensure `.next`, `dist`, `node_modules`, and other
  build/cache directories are excluded from test discovery.
- **Environment Setup**: Identify tests requiring `jsdom` or `happy-dom` and
  ensure they are correctly configured (either via file-level
  `// @vitest-environment jsdom` or package-level config).

### Phase 2: Systematic Fixes by Package

- Group packages by type (MCP servers, UI apps, Shared libs).
- Run tests package-by-package.
- Fix `ReferenceError: document is not defined`.
- Fix `TypeError: handler is not a function` (likely mock/registry issues).
- Fix path alias issues (e.g., `@/lib/...` failing in some contexts).

### Phase 3: Coverage Gap Analysis & Filling

- Generate coverage reports for each package.
- Identify files with low coverage.
- Add targeted tests to hit 96% mark.

### Phase 4: Validation & Final Push

- Run all tests from root.
- Ensure "Green" status.
- Commit changes.
- Push to repository.

## Parallelization (8 Agent Model)

Since I am a single agent, I will simulate parallel work by processing packages
in batches and using parallel tool calls where possible.

### Batch 1: Infrastructure & Shared

- `vitest.workspace.ts`
- `packages/shared`
- `packages/eslint-config` (if applicable)

### Batch 2: MCP Servers

- `packages/esbuild-wasm-mcp`
- `packages/hackernews-mcp`
- `packages/openclaw-mcp`
- `packages/spacetimedb-mcp`
- `packages/spike-land-mcp`
- `packages/bazdmeg-mcp`
- `packages/mcp-image-studio`

### Batch 3: Tools & CLI

- `packages/spike-cli`
- `packages/spike-review`
- `packages/vibe-dev`
- `packages/code`
- `packages/transpile`

### Batch 4: Backend & Database

- `packages/spike-land-backend`
- `packages/spike-db`
- `packages/spike-edge`

### Batch 5: Frontend & Apps

- `packages/spike.land`
- `packages/spike-app`
- `packages/react-ts-worker`
- `packages/video`
