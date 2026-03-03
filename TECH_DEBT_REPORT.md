# Tech Debt Report — spike-land-ai (All 15 Repos + CI/CD)

Generated: 2026-02-27 | Scanned by: 16 parallel explorer agents

---

## Category 1: BROKEN BUILD INFRASTRUCTURE (CRITICAL)

**Pattern**: 10 of 15 repos reference `@spike-land-ai/tsconfig` and
`@spike-land-ai/eslint-config` as devDependencies, but these packages are NOT
installed/resolvable, causing complete build/test/lint failures.

| Repo               | tsconfig broken | eslint-config broken |           Tests run?            |
| ------------------ | :-------------: | :------------------: | :-----------------------------: |
| spike-land-backend |        X        |          X           |      NO (22 failed suites)      |
| transpile          |        X        |          X           |               NO                |
| shared             |        X        |          -           |               NO                |
| spike-cli          |        X        |          X           |   NO (30 test files, 0 tests)   |
| openclaw-mcp       |        X        |          X           |               NO                |
| spike-review       |        X        |          X           |               NO                |
| vibe-dev           |        X        |          X           |               NO                |
| esbuild-wasm-mcp   |        X        |          -           |               NO                |
| code               |        -        |          X           |             Partial             |
| video              |        -        |          X           | NO (missing @testing-library/*) |
| hackernews-mcp     |       OK        |          OK          |               YES               |
| mcp-nanobanana     |       OK        |          OK          |               YES               |
| react-ts-worker    |       OK        |          -           |  YES (but 0 test files exist)   |
| esbuild-wasm       |       N/A       |         N/A          |        N/A (no scripts)         |
| spike.land         |       OK        |          OK          |               YES               |

**Root cause**: The shared config packages in `.github/packages/` are published
via `ci-configs.yml` but aren't properly installed in consuming repos.

**Files**:

- `.github/packages/tsconfig/` — source of `@spike-land-ai/tsconfig`
- `.github/packages/eslint-config/` — source of `@spike-land-ai/eslint-config`
- Each repo's `tsconfig.json` line 2 and `eslint.config.mjs` line 1

---

## Category 2: MISSING TEST COVERAGE (HIGH)

| Repo             | Issue                                                   | Severity |
| ---------------- | ------------------------------------------------------- | -------- |
| spike.land       | 371/403 API routes (92%) have no tests                  | CRITICAL |
| react-ts-worker  | ZERO test files for entire custom React reconciler      | CRITICAL |
| esbuild-wasm-mcp | Only 2/7 MCP tools tested                               | HIGH     |
| video            | Only 1 test file for 40+ components                     | HIGH     |
| spike-cli        | 30 test files exist but all fail to load                | HIGH     |
| mcp-nanobanana   | register.test.ts only checks 2/17 tool registrations    | MEDIUM   |
| hackernews-mcp   | Missing edge case tests (deleted items, malformed HTML) | MEDIUM   |
| shared           | json-schemas.ts (594 lines) has zero test coverage      | HIGH     |
| spike-review     | CLI, worker index, and error paths untested             | MEDIUM   |
| transpile        | Only tests 405 responses, mocked functions never tested | HIGH     |
| esbuild-wasm     | No test scripts at all                                  | HIGH     |

---

## Category 3: TYPE SAFETY VIOLATIONS (HIGH)

| Repo               | Issue                                              | Count   | Files                                   |
| ------------------ | -------------------------------------------------- | ------- | --------------------------------------- |
| spike-review       | Unsafe `as string` casts on Zod-validated params   | 28+     | src/index.ts                            |
| code               | Monaco editor TS strict checks all disabled        | 9 flags | config.ts:160-172                       |
| esbuild-wasm       | `eslint-disable` + `any` types in .d.ts files      | 8+      | lib/main.d.ts, lib/browser.d.ts         |
| esbuild-wasm-mcp   | Unsafe `as BuildOptions` casts without validation  | 4       | build.ts, context.ts, transform.ts      |
| openclaw-mcp       | `any` types in test code                           | 10+     | cli.test.ts                             |
| spike-land-backend | `as unknown as` type assertions without validation | 5+      | mainFetchHandler.ts, tests              |
| react-ts-worker    | Non-null assertions without guards                 | 8+      | ReactFiberHooks.ts, SchedulerMinHeap.ts |
| spike-cli          | Unsafe HTTP response casts without validation      | 3+      | auth/device-flow.ts                     |

---

## Category 4: SECURITY ISSUES (HIGH)

| Repo               | Issue                                           | File                    | Line           |
| ------------------ | ----------------------------------------------- | ----------------------- | -------------- |
| spike-land-backend | Wildcard CORS `"*"` in 3+ locations             | fetchHandler.ts         | 14, 255, 293   |
| transpile          | Wildcard CORS `"*"` in 4 locations              | index.ts                | 34, 44, 65, 98 |
| spike-land-backend | Unsafe JSON.parse on untrusted WebSocket data   | websocketHandler.ts     | 127            |
| spike.land         | dangerouslySetInnerHTML XSS risk                | DynamicPageRenderer.tsx | 9              |
| spike-cli          | Timing-unsafe API key comparison                | http-server.ts          | 100-107        |
| spike-cli          | Environment variable injection via config       | upstream-client.ts      | 76-81          |
| CI/CD              | Unpinned GitHub Action versions (security risk) | All workflow files      | Multiple       |
| CI/CD              | Token written to file in logs                   | dep-sync-sweep.yml      | 41             |

---

## Category 5: ERROR HANDLING GAPS (MEDIUM-HIGH)

| Repo               | Issue                                                       | File                       |
| ------------------ | ----------------------------------------------------------- | -------------------------- |
| spike-land-backend | Silent fire-and-forget R2 cleanup                           | largeValueStorage.ts:52    |
| spike-land-backend | Catch-then-rethrow in Promise.all (redundant)               | chatRoom.ts:415-448        |
| hackernews-mcp     | Unprotected JSON parsing (resp.json() without try-catch)    | hn-read-client.ts:33,42,50 |
| spike-review       | No error handling on ANY GitHub API call                    | client.ts:29-56            |
| spike-review       | JSON.parse without try-catch on webhook body                | webhook-handler.ts:141     |
| vibe-dev           | 4 silent empty catch blocks                                 | agent.ts:342,356,423,589   |
| openclaw-mcp       | Broad catch suppresses all errors silently                  | bridge.ts:81               |
| mcp-nanobanana     | No size validation before base64 buffer creation (OOM risk) | image-upload.ts:37         |
| esbuild-wasm-mcp   | JSON.parse without try-catch                                | analyze.ts:28              |
| transpile          | `as string` on nullable header.get()                        | index.ts:59                |

---

## Category 6: RACE CONDITIONS & CONCURRENCY (HIGH)

| Repo               | Issue                                                                  | File                | Line    |
| ------------------ | ---------------------------------------------------------------------- | ------------------- | ------- |
| spike-land-backend | `initialized` flag reset races with concurrent requests                | mcp/handler.ts      | 83      |
| spike-land-backend | Session init race between flag check and blockConcurrencyWhile         | chatRoom.ts         | 474-475 |
| spike-land-backend | Unmanaged setInterval in WebSocket (no timeout if client never closes) | websocketHandler.ts | 89      |
| esbuild-wasm-mcp   | No synchronization for concurrent WASM init calls                      | wasm-api.ts         | 18-27   |
| CI/CD              | dep-sync-sweep force push races with concurrent runs                   | dep-sync-sweep.yml  | 81      |
| CI/CD              | Duplicate dispatch when multiple packages publish simultaneously       | ci-publish.yml      | 137-149 |

---

## Category 7: DEAD CODE & UNUSED EXPORTS (MEDIUM)

| Repo               | Issue                                                                     | File            | Lines          |
| ------------------ | ------------------------------------------------------------------------- | --------------- | -------------- |
| spike-land-backend | 50+ lines of commented-out auto-save code                                 | chatRoom.ts     | 58-61, 624-697 |
| code               | 6 backup/original .txt files in source tree                               | src/utils/*.txt | —              |
| code               | Commented-out proxy & extension logic in vite config                      | vite.config.ts  | 49-60, 124-128 |
| code               | Unused `post-build-delete` script                                         | package.json    | 36             |
| esbuild-wasm       | Unused filesystem constants marked "unused"                               | wasm_exec.js    | 17-24          |
| hackernews-mcp     | Unused test fixtures (SAMPLE_JOB, SAMPLE_DELETED_ITEM)                    | fixtures.ts     | 40, 50         |
| vibe-dev           | Exported functions never imported (setAgentWorkingApi, getMessageContent) | api.ts          | 177, 119       |

---

## Category 8: WRONG PACKAGE NAMES & VERSION MISMATCHES (MEDIUM-HIGH)

| Repo             | Issue                                                               | File         | Line   |
| ---------------- | ------------------------------------------------------------------- | ------------ | ------ |
| esbuild-wasm     | require.resolve uses `@spike-npm-land/esbuild-wasm` (wrong org)     | lib/main.js  | 2217   |
| esbuild-wasm-mcp | Version hardcoded as "0.27.3" but package.json says "0.27.4"        | src/index.ts | 14     |
| transpile        | README says `@spike-npm-land/transpile` (wrong)                     | README.md    | 1      |
| shared           | README says `@spike-npm-land/shared` (wrong)                        | README.md    | 25, 98 |
| transpile        | esbuild-wasm version mismatch (0.27.4 declared, 0.27.3 in lockfile) | package.json | 39     |

---

## Category 9: CI/CD INFRASTRUCTURE ISSUES (MEDIUM-HIGH)

| Issue                                                          | File                      | Severity |
| -------------------------------------------------------------- | ------------------------- | -------- |
| dep-sync-sweep missing 10+ source repos from matrix            | dep-sync-sweep.yml:18-29  | CRITICAL |
| dependency-map.json missing edges for tsconfig/eslint-config   | dependency-map.json:8-9   | HIGH     |
| All GitHub Actions use version tags, not pinned SHAs           | All workflows             | HIGH     |
| ci-configs.yml duplicates ci-publish.yml logic (DRY violation) | ci-configs.yml            | MEDIUM   |
| No concurrency guards on ci-publish.yml                        | ci-publish.yml            | MEDIUM   |
| No dispatch error handling in notify job                       | ci-publish.yml:119-149    | MEDIUM   |
| verify-deps.sh incomplete source/consumer lists                | verify-deps.sh:9,12       | MEDIUM   |
| Bump-dependency branch name sanitization incomplete            | bump-dependency.yml:74-76 | LOW      |

---

## Category 10: STUB/INCOMPLETE IMPLEMENTATIONS (MEDIUM)

| Repo            | Issue                                                              | File                          |
| --------------- | ------------------------------------------------------------------ | ----------------------------- |
| mcp-nanobanana  | palette.ts returns hardcoded placeholder colors, not real analysis | palette.ts:53-54              |
| mcp-nanobanana  | describe.ts returns placeholder descriptions but charges credits   | describe.ts:59-72             |
| mcp-nanobanana  | style-transfer.ts passes URL string instead of image data          | style-transfer.ts:93          |
| react-ts-worker | performConcurrentWorkOnRoot just calls sync (no concurrent mode)   | ReactFiberWorkLoop.ts:173-177 |
| react-ts-worker | hydrateRoot just does client render (no actual hydration)          | client.ts:59-68               |
| video           | Missing background-music.mp3 asset                                 | VibeCodingParadox.tsx:59      |
| video           | Scene06 missing (numbering skips 05 to 07)                         | NoMore404s.tsx                |

---

## Category 11: DOCUMENTATION GAPS (LOW-MEDIUM)

| Repo           | Issue                                                |
| -------------- | ---------------------------------------------------- |
| hackernews-mcp | No README.md at all                                  |
| openclaw-mcp   | No README.md at all                                  |
| esbuild-wasm   | README only 6 lines                                  |
| shared         | README has wrong package names, wrong build commands |
| transpile      | README has wrong package name, wrong license         |
| video          | Orphaned audio file (n404-bridgemind.mp3)            |
| spike-review   | No deployment/webhook setup docs                     |

---

## Category 12: DEPENDENCY ISSUES (LOW-MEDIUM)

| Repo         | Issue                                                     |
| ------------ | --------------------------------------------------------- |
| spike.land   | next-auth 5.0.0-beta.30 (pre-release in production)       |
| spike.land   | Numerous extraneous npm dependencies (bloat)              |
| spike.land   | Loose caret versioning on AWS SDK, auth packages          |
| video        | Missing @testing-library/react, @testing-library/jest-dom |
| esbuild-wasm | 11MB WASM binary committed to git (no checksums)          |
| vibe-dev     | Hardcoded Claude CLI version in Dockerfile                |
| code         | `tranformonly` typo in property name (4 locations)        |

---

## Summary Statistics

| Category                       | Count                  | Severity      |
| ------------------------------ | ---------------------- | ------------- |
| 1. Broken build infrastructure | 10 repos               | CRITICAL      |
| 2. Missing test coverage       | 11 repos               | CRITICAL-HIGH |
| 3. Type safety violations      | 8 repos, 60+ instances | HIGH          |
| 4. Security issues             | 8 issues across repos  | HIGH          |
| 5. Error handling gaps         | 10+ critical paths     | MEDIUM-HIGH   |
| 6. Race conditions             | 6 issues               | HIGH          |
| 7. Dead code                   | 7 repos                | MEDIUM        |
| 8. Wrong names/versions        | 5 issues               | MEDIUM-HIGH   |
| 9. CI/CD issues                | 8 issues               | MEDIUM-HIGH   |
| 10. Stub implementations       | 7 items                | MEDIUM        |
| 11. Documentation gaps         | 7 repos                | LOW-MEDIUM    |
| 12. Dependency issues          | 7 items                | LOW-MEDIUM    |
| **TOTAL**                      | **~200+ items**        |               |
