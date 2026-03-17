# PRD: spike.land Build & Deploy Pipeline Overhaul

**Authors:** Radix (implementation), Zoltan (vision), Arnold (optimization), Erdos (systems theory), Daft Punk (simplicity)

**Status:** Draft
**Created:** 2026-03-16
**Target:** 14-day sprint

---

## Thesis

spike.land's build and deploy pipeline is functional but fragile. Deploys are
sequential file-by-file uploads that hit rate limits. CI runs checks serially
when they could run in parallel. There is no real rollback — just a shell script
that prints "not yet implemented." The platform that sells MCP tools to
developers cannot deploy itself reliably. This PRD fixes that.

The north star: spike.land builds and deploys itself using its own MCP tools.
A Claude agent should be able to say "deploy spike-edge to staging" and have it
happen through the same MCP infrastructure we sell to customers.

---

## Current State Analysis

### What exists today

| Component | File | State |
|---|---|---|
| SPA deploy | `scripts/deploy-spa.sh` + `scripts/upload-to-r2.sh` | Uploads files one-by-one via `wrangler r2 object put` (4 parallel via xargs). Content-hash skip cache exists but is local-only. HTML uploaded last for pseudo-atomicity. |
| CI pipeline | `.github/workflows/ci.yml` | Secret scan, typecheck, lint, test run serially. Build waits for all three. Deploy is sequential: wave 1 (6 workers in parallel), then wave 2 (backend + edge). SPA built and deployed last. |
| Docker tests | `docker/Dockerfile.test` | 29 independent test stages with BuildKit layer caching. Well-architected. But the workflow (`test-incremental.yml`) is disabled — CI uses native `test-changed.sh` instead. |
| Worker deploys | `packages/*/wrangler.toml` | Each worker deployed via `wrangler deploy --minify`. No versioning, no canary, no preview environments. |
| Rollback | `.github/scripts/rollback-workers.sh` | Prints "not yet implemented" and manual steps. |
| Docker compose | `docker/docker-compose.*.yml` | Dev, staging, prod, CI variants exist. Used for local dev, not for CI builds. |

### Pain points (measured, not imagined)

1. **R2 upload is O(n) API calls.** `upload-to-r2.sh` calls `wrangler r2 object put` per file, 4 in parallel. A 450-file SPA build = ~113 sequential batches of wrangler CLI invocations. Each invocation spawns a Node process, authenticates, uploads. Observed: 5+ minutes, intermittent 503 errors from R2 rate limiting.

2. **No atomic deploys.** HTML files are uploaded last as a half-measure, but if the deploy fails mid-upload, the R2 bucket has a mix of old and new assets. There is no "swap" operation.

3. **CI serialization wastes time.** Typecheck, lint, and test are independent but the build job `needs: [typecheck, lint, test]` — waiting for all three to complete before starting. Each installs dependencies separately (despite shared cache keys).

4. **No deploy previews.** PRs cannot be previewed. You merge to main and hope.

5. **Rollback is manual.** The rollback script is a placeholder. If a deploy breaks production, recovery is "git checkout the old SHA and re-deploy by hand."

6. **Docker test infra is dormant.** The `Dockerfile.test` with 29 per-package stages and BuildKit caching is excellent engineering — but `test-incremental.yml` is disabled. The investment is not paying off.

---

## Architecture: Multi-Stage Docker Builds

### Current Dockerfile.test (keep and extend)

The existing `docker/Dockerfile.test` already implements the right pattern:

```
base (Node 24 + Yarn) → config (test infra) → test-<package> (per-package)
```

Each test stage only copies its own source, so BuildKit skips unchanged packages.
This is correct. We extend this pattern to builds.

### New: Dockerfile.build

```
Layer 1: base         — Node 24, Yarn 4, native build tools (cached forever)
Layer 2: deps         — yarn install --immutable (cached unless yarn.lock changes)
Layer 3: build-<pkg>  — per-package build stages (parallel via BuildKit)
Layer 4: artifacts    — FROM scratch, COPY only dist/ outputs
```

Key decisions:
- **Yarn, not pnpm.** The repo uses Yarn 4 with PnP. Switching package managers is not in scope.
- **BuildKit parallel stages.** Independent build stages (e.g., `build-shared` and `build-chess-engine`) run concurrently without any orchestration tool.
- **No Turborepo/Nx.** The Docker multi-stage pattern gives us the same task graph benefits without adding a build orchestrator dependency. Erdos says: "The simplest system that works is the best system."

### Done-when
- [ ] `docker/Dockerfile.build` exists with per-package build stages
- [ ] `docker build --target build-all -f docker/Dockerfile.build .` produces all artifacts
- [ ] BuildKit runs independent package builds in parallel (visible in build logs)
- [ ] Build artifacts are extractable: `docker build --target artifacts --output type=local,dest=./dist`
- [ ] CI can optionally use `Dockerfile.build` for reproducible builds

---

## Deploy Pipeline v2: Batch R2 Uploads

### Problem

`wrangler r2 object put` is designed for single-file uploads. Uploading 450 files means 450 CLI invocations, each with Node startup + auth overhead.

### Solution: R2 batch upload via S3-compatible API

R2 is S3-compatible. Replace per-file wrangler calls with a batch upload script
that uses the S3 API directly:

```bash
# Instead of 450 wrangler calls:
aws s3 sync dist/ s3://spike-app-assets/ \
  --endpoint-url https://${CF_ACCOUNT_ID}.r2.cloudflarestorage.com \
  --delete
```

Or, for more control, a TypeScript upload script using `@aws-sdk/client-s3`:

```typescript
// scripts/batch-upload-r2.ts
// 1. List all files in dist/
// 2. Compute content hashes
// 3. Compare against manifest in R2 (single GET)
// 4. Upload only changed files (parallel PutObject, 20 concurrent)
// 5. Upload new manifest
// 6. Upload HTML files last (atomic swap)
```

### Atomic deploys

Deploy to a versioned prefix, then swap:

```
R2 bucket structure:
  /deploys/<sha>/          ← full build output
  /deploys/<sha>/_manifest.json
  /current                 ← pointer file containing current SHA
```

spike-edge reads `/current` to resolve the active deploy. Swap is a single
`PutObject` to `/current`. Rollback is writing the previous SHA to `/current`.

### Done-when
- [ ] `scripts/batch-upload-r2.ts` replaces `upload-to-r2.sh`
- [ ] SPA deploy completes in under 30 seconds (down from 5+ minutes)
- [ ] Zero 503 errors during deploy (batch API, not per-file CLI)
- [ ] Deploy manifest tracks content hashes; unchanged files are not re-uploaded
- [ ] Atomic swap: old version serves until all new files are uploaded
- [ ] `yarn deploy:spa --rollback <sha>` rolls back to a previous deploy in under 5 seconds

---

## CI/CD Improvements

### Parallel check jobs (already partially done)

Current CI runs typecheck, lint, test as separate jobs but each installs deps
independently. Fix:

```yaml
jobs:
  install:
    steps:
      - yarn install
      - actions/cache/save  # save node_modules

  typecheck:
    needs: install
    # restore cache, run typecheck

  lint:
    needs: install
    # restore cache, run lint

  test:
    needs: install
    # restore cache, run tests

  build:
    needs: install  # Don't wait for checks — start building immediately
    # restore cache, build

  gate:
    needs: [typecheck, lint, test, build]
    # All checks passed + build ready → proceed to deploy
```

This means build starts as soon as deps are installed, not after all checks pass.
If a check fails, the gate job fails and deploy never runs. But we saved the
build's wall-clock time.

### Re-enable Docker-based incremental tests

The `Dockerfile.test` and `test-incremental.yml` workflow are ready. Re-enable
the workflow for PRs. BuildKit layer caching means only changed packages run
tests. This is faster than `test-changed.sh` for large PRs touching many
packages.

### Build cache strategy

| Cache | Key | Stored in |
|---|---|---|
| `node_modules` | `yarn.lock` hash | GitHub Actions cache |
| `.tsbuildinfo` | `tsconfig.json` + source hash | GitHub Actions cache |
| `.eslintcache` | `eslint.config.mjs` hash | GitHub Actions cache |
| Docker layers | BuildKit content-addressable | GitHub Actions cache (GHA backend) or R2 |
| Build artifacts | commit SHA | GitHub Actions artifact or R2 |

### Deploy preview environments

For every PR, deploy the SPA to a preview URL:

```
R2: /previews/pr-<number>/
URL: https://pr-<number>.preview.spike.land
```

spike-edge already has wildcard routing. Add a route that matches
`pr-*.preview.spike.land` and serves from the corresponding R2 prefix.

Preview deploys are cleaned up when the PR is closed (GitHub webhook or
scheduled sweep).

### Done-when
- [ ] CI wall-clock time reduced by 30%+ (measured via GitHub Actions timing)
- [ ] `install` job runs once; all check jobs restore from cache
- [ ] Build starts in parallel with checks (not after)
- [ ] `test-incremental.yml` re-enabled for PRs
- [ ] Every PR gets a preview URL comment from the CI bot
- [ ] Preview environments cleaned up within 1 hour of PR close
- [ ] Build cache hit rate > 80% for typical PRs (measured over 2 weeks)

---

## Distributed Development (Orchestrated by spike.land)

### MCP build tools

spike.land already has 80+ MCP tools. Add a `build` tool family:

| Tool | Description |
|---|---|
| `build.trigger` | Trigger a build for a specific package or all packages |
| `build.status` | Get build status, logs, timing |
| `build.deploy` | Deploy a built artifact to production or preview |
| `build.rollback` | Rollback to a previous deploy |
| `build.preview` | Create/destroy preview environments |
| `build.cache.inspect` | Show cache hit/miss rates, sizes |
| `build.cache.purge` | Purge build cache for a package |

These tools wrap the GitHub Actions API and Cloudflare API. They do not
re-implement CI — they orchestrate it.

### Self-hosting: spike.land builds itself

The ultimate test of the platform: spike.land's own CI/CD pipeline is
orchestrated through its MCP tools. A developer (or Claude agent) can:

1. Open a PR
2. MCP tool `build.preview` creates a preview environment
3. MCP tool `build.status` monitors the CI pipeline
4. On merge, MCP tool `build.deploy` handles production deployment
5. If something breaks, MCP tool `build.rollback` reverts in seconds

This is not about replacing GitHub Actions — it is about providing an
AI-friendly interface on top of it. When a Claude agent reviews a PR via
`spike-review`, it should be able to trigger a preview deploy, run smoke tests
against it, and report results — all through MCP tools.

### Build status dashboard

A `/builds` page in spike-web showing:
- Recent deploys with SHA, timestamp, status
- Current live version per worker
- Cache hit rates
- Deploy timing trends
- One-click rollback button

Data source: GitHub Actions API + Cloudflare API, cached in D1.

### Done-when
- [ ] `build.trigger`, `build.status`, `build.deploy`, `build.rollback` MCP tools exist and pass tests
- [ ] A Claude agent can trigger a preview deploy via MCP tools (demonstrated end-to-end)
- [ ] `/builds` dashboard shows deploy history with rollback capability
- [ ] spike.land dogfoods its own build tools for at least 1 real deployment
- [ ] MCP tool response times < 3 seconds for status queries

---

## 14-Day Action Plan

### Days 1-3: Batch R2 Upload + Atomic Deploys

**Day 1:**
- Write `scripts/batch-upload-r2.ts` using `@aws-sdk/client-s3`
- Implement content-hash diffing against R2 manifest
- Parallel upload (20 concurrent) with retry logic

**Day 2:**
- Implement versioned deploy prefix (`/deploys/<sha>/`)
- Update spike-edge to read `/current` pointer for active deploy
- Test atomic swap locally

**Day 3:**
- Replace `deploy-spa.sh` call in CI with `batch-upload-r2.ts`
- Implement `--rollback <sha>` flag
- Verify deploy time < 30 seconds in CI

**Done-when:**
- [ ] SPA deploys in < 30 seconds (down from 5+ minutes)
- [ ] Zero 503 errors over 10 consecutive deploys
- [ ] Rollback completes in < 5 seconds
- [ ] Old `upload-to-r2.sh` removed or deprecated

### Days 4-6: CI Parallelization + Caching

**Day 4:**
- Restructure `ci.yml`: add `install` job, make checks parallel
- Start build in parallel with checks (gate job before deploy)
- Measure baseline CI timing

**Day 5:**
- Re-enable `test-incremental.yml` for PRs
- Configure GHA cache for Docker BuildKit layers
- Add cache-hit logging to all cache steps

**Day 6:**
- Implement deploy preview for PRs (R2 prefix + spike-edge routing)
- Add PR comment bot with preview URL
- Add cleanup job on PR close

**Done-when:**
- [ ] CI wall-clock time reduced 30%+ (measured)
- [ ] Docker test cache working (visible in GHA logs)
- [ ] PR preview URLs working end-to-end
- [ ] Cache hit rates logged and measurable

### Days 7-9: MCP Build Tools + Self-Orchestration

**Day 7:**
- Implement `build.trigger` and `build.status` MCP tools
- Wire to GitHub Actions API (workflow dispatch + run status)

**Day 8:**
- Implement `build.deploy` and `build.rollback` MCP tools
- Wire to Cloudflare API + R2 atomic swap

**Day 9:**
- Implement `build.preview` MCP tool
- End-to-end test: Claude agent triggers preview deploy via MCP
- Write integration tests

**Done-when:**
- [ ] All 5 build MCP tools pass unit tests
- [ ] End-to-end demo: MCP tool triggers build, monitors status, reports completion
- [ ] Tools registered in spike-land-mcp registry

### Days 10-12: Deploy Previews + Rollback

**Day 10:**
- Implement real rollback in `.github/scripts/rollback-workers.sh`
- Store deploy history in D1 (SHA, timestamp, status, worker versions)
- Wire rollback to R2 atomic swap for SPA + wrangler rollback for workers

**Day 11:**
- Build `/builds` dashboard page in spike-web
- Show: deploy history, current versions, cache stats
- Add one-click rollback button

**Day 12:**
- Implement `Dockerfile.build` for reproducible CI builds
- Add build timing benchmarks
- Stress test: 10 rapid deploys in sequence, verify no corruption

**Done-when:**
- [ ] Rollback works end-to-end (SPA + workers) in < 30 seconds
- [ ] Deploy history stored in D1 with 90-day retention
- [ ] `/builds` page renders deploy history with rollback actions
- [ ] `Dockerfile.build` produces identical artifacts to native build

### Days 13-14: Integration + Polish

**Day 13:**
- Dogfood: deploy spike.land itself using the new MCP build tools
- Fix any rough edges found during dogfooding
- Update CLAUDE.md with new deploy commands

**Day 14:**
- Write runbook for common deploy scenarios
- Record deploy timing baselines for ongoing monitoring
- Clean up deprecated scripts (`upload-to-r2.sh`, old rollback stub)
- Final end-to-end test: PR → preview → merge → deploy → verify → rollback → verify

**Done-when:**
- [ ] spike.land successfully deployed via its own MCP tools at least once
- [ ] All deprecated scripts removed or marked
- [ ] Deploy timing baselines documented
- [ ] Team can deploy, rollback, and preview without reading source code

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| R2 S3-compatible API has subtle differences from AWS S3 | Medium | Medium | Test batch upload against R2 in dev before replacing production script |
| Atomic swap adds latency to every request (reading `/current` pointer) | Low | High | Cache the pointer in spike-edge with 10-second TTL; invalidate on deploy |
| Preview environments accumulate and cost money | Medium | Low | Automated cleanup on PR close + daily sweep for orphans |
| MCP build tools become a single point of failure | Low | High | Tools are orchestration layer only; direct `wrangler deploy` always works as escape hatch |
| Docker build cache grows unbounded in GHA | Medium | Low | Set max cache size; prune old scopes weekly |

---

## Success Metrics

| Metric | Current | Target | Measurement |
|---|---|---|---|
| SPA deploy time | 5+ minutes | < 30 seconds | CI job timing |
| R2 upload errors per deploy | 1-3 (503s) | 0 | CI logs |
| CI total wall-clock time | ~12 minutes | < 8 minutes | GitHub Actions summary |
| Time to rollback | 15+ minutes (manual) | < 30 seconds | Stopwatch |
| PR preview availability | None | Every PR | PR comment bot |
| Deploy confidence | "merge and pray" | Automated smoke + rollback | Process observation |

---

## Non-Goals

- **Migrating off Cloudflare Workers.** The workers runtime is not the problem.
- **Replacing GitHub Actions with self-hosted CI.** GitHub Actions works. We add an MCP layer on top, not a replacement.
- **Kubernetes / container orchestration.** Workers are serverless. Docker is for builds and tests, not runtime.
- **Monorepo tools (Turborepo, Nx, Bazel).** Docker multi-stage gives us the task graph. Adding a build orchestrator adds complexity without proportional benefit for our scale.

---

*"Work it harder, make it better, do it faster, makes us stronger."*
*The pipeline should be invisible. When you push code, it appears in production. When it breaks, it heals. That is the only acceptable state.*
