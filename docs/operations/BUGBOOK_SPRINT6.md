# Bugbook — Sprint 6 DX Audit

> Date: 2026-03-10 | Source: 16-engineer DX audit | Entries: 19

## Summary

| # | Title | Severity | Category | Status |
|---|-------|----------|----------|--------|
| 1 | No log persistence (logpush removed, no replacement) | high | observability | CANDIDATE |
| 2 | Analytics Engine bound but unused | medium | observability | CANDIDATE |
| 3 | Rollback script is a manual stub | medium | ci-cd | CANDIDATE |
| 4 | No distributed tracing | medium | observability | CANDIDATE |
| 5 | `any` types in 3 first-party files | medium | type-safety | CANDIDATE |
| 6 | ESLint type rules in warning mode | low | type-safety | CANDIDATE |
| 7 | 11 @ts-ignore in vendored monaco-editor | low | type-safety | CANDIDATE |
| 8 | 6 spike-chat stub endpoints | high | feature-gap | CANDIDATE |
| 9 | Reorganize pipeline missing incremental filtering | medium | feature-gap | CANDIDATE |
| 10 | google-ads MCP tool incomplete | medium | feature-gap | CANDIDATE |
| 11 | 20 uncommitted config files | high | ci-cd | CANDIDATE |
| 12 | Transpile test config removed | medium | ci-cd | CANDIDATE |
| 13 | NPM_TOKEN expired for npmjs.org | medium | ci-cd | ACTIVE |
| 14 | Cloudflare API token is temporary | high | ci-cd | ACTIVE |
| 15 | Stale worktrees wasting disk | low | maintenance | CANDIDATE |
| 16 | No GitHub issue templates | low | dx | CANDIDATE |
| 17 | Error metadata size limits (8KB stack, 4KB metadata) | low | error-handling | CANDIDATE |
| 18 | Health checks lack latency metrics | medium | observability | CANDIDATE |
| 19 | spike-chat D1 database not created | high | ci-cd | CANDIDATE |

**ACTIVE** = confirmed across 2+ audit cycles. **CANDIDATE** = first observation.

---

## Detailed Entries

### BUG-S6-01: No log persistence

- **Severity**: high
- **Category**: observability
- **Status**: CANDIDATE
- **Confidence**: 0.95
- **ELO**: 1200
- **Description**: `logpush = true` was removed from all 9 wrangler.toml files in Sprint 5, but no replacement log destination (Logpush job, tail worker, or external sink) was configured. Console logs from production workers are lost after the real-time tail window closes.
- **Files**: All `packages/*/wrangler.toml`

### BUG-S6-02: Analytics Engine bound but unused

- **Severity**: medium
- **Category**: observability
- **Status**: CANDIDATE
- **Confidence**: 0.90
- **ELO**: 1200
- **Description**: `spike_analytics` dataset is bound as `ANALYTICS` in `packages/spike-edge/wrangler.toml` (line 64), but zero lines of code write to it. The binding exists but produces no data.
- **Files**: `packages/spike-edge/wrangler.toml:64`

### BUG-S6-03: Rollback script is a manual stub

- **Severity**: medium
- **Category**: ci-cd
- **Status**: CANDIDATE
- **Confidence**: 0.85
- **ELO**: 1200
- **Description**: `.github/scripts/rollback-workers.sh` contains manual instructions rather than automated rollback logic. In an incident, operators must manually find version IDs and run wrangler commands.
- **Files**: `.github/scripts/rollback-workers.sh`

### BUG-S6-04: No distributed tracing

- **Severity**: medium
- **Category**: observability
- **Status**: CANDIDATE
- **Confidence**: 0.80
- **ELO**: 1200
- **Description**: No OpenTelemetry, request-id correlation, or tracing spans exist across the multi-worker architecture (spike-edge → mcp-auth → spike-land-mcp → spike-land-backend). Debugging cross-service issues requires manual log correlation.

### BUG-S6-05: `any` types in 3 first-party files

- **Severity**: medium
- **Category**: type-safety
- **Status**: CANDIDATE
- **Confidence**: 0.90
- **ELO**: 1200
- **Description**: Explicit `any` usage found in first-party (non-vendored) code, violating the monorepo convention of "never use `any`".
- **Files**: `src/mcp-server-base/core-logic/index.ts`, `src/chess-engine/core-logic/prisma.ts`, `src/code/core-logic/services/editorUtils.ts`

### BUG-S6-06: ESLint type rules in warning mode

- **Severity**: low
- **Category**: type-safety
- **Status**: CANDIDATE
- **Confidence**: 0.85
- **ELO**: 1200
- **Description**: `src/monaco-editor/eslint.config.mjs` has a TODO comment to upgrade `no-explicit-any` and `no-unnecessary-type-assertion` from "warn" to "error". Until upgraded, violations pass CI.
- **Files**: `src/monaco-editor/eslint.config.mjs`

### BUG-S6-07: 11 @ts-ignore in vendored monaco-editor

- **Severity**: low
- **Category**: type-safety
- **Status**: CANDIDATE
- **Confidence**: 0.75
- **ELO**: 1200
- **Description**: 11 `@ts-ignore` directives exist in vendored monaco-editor code. Acceptable for vendored code but worth tracking as they may mask real type errors when upgrading the vendored dependency.

### BUG-S6-08: 6 spike-chat stub endpoints

- **Severity**: high
- **Category**: feature-gap
- **Status**: CANDIDATE
- **Confidence**: 0.95
- **ELO**: 1200
- **Description**: Six spike-chat API endpoints return hardcoded empty responses: `read-cursors`, `bookmarks`, `threads`, `pins`, `presence`, `reactions`. These are advertised in the API surface but non-functional.
- **Files**: spike-chat route handlers

### BUG-S6-09: Reorganize pipeline missing incremental filtering

- **Severity**: medium
- **Category**: feature-gap
- **Status**: CANDIDATE
- **Confidence**: 0.85
- **ELO**: 1200
- **Description**: `src/mcp-tools/reorganize/core-logic/pipeline.ts` line 37 has a TODO for git diff-based incremental filtering. Currently the pipeline processes all files on every run.
- **Files**: `src/mcp-tools/reorganize/core-logic/pipeline.ts:37`

### BUG-S6-10: google-ads MCP tool incomplete

- **Severity**: medium
- **Category**: feature-gap
- **Status**: CANDIDATE
- **Confidence**: 0.80
- **ELO**: 1200
- **Description**: The google-ads MCP tool was a bare `export {}` stub. It has been updated to `export * from "./mcp/index"` but the implementation may still be incomplete.

### BUG-S6-11: 20 uncommitted config files

- **Severity**: high
- **Category**: ci-cd
- **Status**: CANDIDATE
- **Confidence**: 0.90
- **ELO**: 1200
- **Description**: ~20 config files with publishConfig standardization, vitest path fixes, and build config updates are sitting unstaged. These may represent incomplete Sprint 5 work or in-progress changes that should be committed or reverted.

### BUG-S6-12: Transpile test config removed

- **Severity**: medium
- **Category**: ci-cd
- **Status**: CANDIDATE
- **Confidence**: 0.80
- **ELO**: 1200
- **Description**: `.tests/vitest.config.ts` had the transpile test block entirely removed (uncommitted change). This means transpile package tests may not run in CI.
- **Files**: `.tests/vitest.config.ts`

### BUG-S6-13: NPM_TOKEN expired

- **Severity**: medium
- **Category**: ci-cd
- **Status**: ACTIVE
- **Confidence**: 0.95
- **ELO**: 1200
- **Description**: The NPM_TOKEN for publishing to npmjs.org has expired. CI has `continue-on-error: true` as a workaround, meaning npm publish failures are silently ignored. Packages are not being published to the public registry.

### BUG-S6-14: Cloudflare API token is temporary

- **Severity**: high
- **Category**: ci-cd
- **Status**: ACTIVE
- **Confidence**: 0.95
- **ELO**: 1200
- **Description**: CI uses an OAuth token from `wrangler login` with ~1.5hr expiry instead of a permanent API token. Deployments fail when the token expires. Needs a permanent API token from dash.cloudflare.com/profile/api-tokens with Workers Scripts, D1, KV, R2, Zone permissions.

### BUG-S6-15: Stale worktrees wasting disk

- **Severity**: low
- **Category**: maintenance
- **Status**: CANDIDATE
- **Confidence**: 0.85
- **ELO**: 1200
- **Description**: `.claude/worktrees/agent-acf30152/` and `agent-abe5a242/` contain full copies of `packages/` directory, wasting disk space.
- **Files**: `.claude/worktrees/agent-acf30152/`, `.claude/worktrees/agent-abe5a242/`

### BUG-S6-16: No GitHub issue templates

- **Severity**: low
- **Category**: dx
- **Status**: CANDIDATE
- **Confidence**: 0.90
- **ELO**: 1200
- **Description**: No `.github/ISSUE_TEMPLATE/` directory exists. Contributors have no structured templates for bug reports, feature requests, or tech debt items.

### BUG-S6-17: Error metadata size limits

- **Severity**: low
- **Category**: error-handling
- **Status**: CANDIDATE
- **Confidence**: 0.75
- **ELO**: 1200
- **Description**: The `/errors/ingest` endpoint truncates stack traces at 8KB and metadata at 4KB. While reasonable limits, deep stack traces from async chains or large metadata payloads may lose diagnostic information.

### BUG-S6-18: Health checks lack latency metrics

- **Severity**: medium
- **Category**: observability
- **Status**: CANDIDATE
- **Confidence**: 0.85
- **ELO**: 1200
- **Description**: `/health` endpoint only checks service connectivity (up/down). No p50/p99 response time tracking, no latency percentile reporting. Degraded-but-not-down states are invisible.

### BUG-S6-19: spike-chat D1 database not created

- **Severity**: high
- **Category**: ci-cd
- **Status**: CANDIDATE
- **Confidence**: 0.95
- **ELO**: 1200
- **Description**: `packages/spike-chat/wrangler.toml` has `database_id = "TO_BE_CREATED"`. The D1 database was never provisioned, meaning the spike-chat worker cannot store any data and will fail on any DB operation.
- **Files**: `packages/spike-chat/wrangler.toml`
