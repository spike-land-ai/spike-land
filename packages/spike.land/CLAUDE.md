# AGENTS.md

This file provides guidance to agents when working with code in this repository.

---

## 🏢 Business Context

| Field       | Value                                 |
| ----------- | ------------------------------------- |
| **Company** | SPIKE LAND LTD (UK Company #16906682) |
| **Domain**  | spike.land                            |
| **Owner**   | Zoltan Erdos                          |

See [docs/business/BUSINESS_STRUCTURE.md](./docs/business/BUSINESS_STRUCTURE.md)
for full company documentation.

---

## 📚 Documentation References

**Note:** `docs/` and `content/` are symlinks to the umbrella repo root
(`../../docs/`, `../../content/`). All doc paths below resolve through the
symlink.

**DO NOT duplicate content from these docs in this file. Link to them instead.**

| Topic                         | Document                                                                                 |
| ----------------------------- | ---------------------------------------------------------------------------------------- |
| Platform Vision & Features    | [docs/features/FEATURES.md](./docs/features/FEATURES.md)                                 |
| Product & Engineering Roadmap | [docs/ROADMAP.md](./docs/ROADMAP.md)                                                     |
| API Reference                 | [docs/architecture/API_REFERENCE.md](./docs/architecture/API_REFERENCE.md)               |
| Token System                  | [docs/architecture/TOKEN_SYSTEM.md](./docs/architecture/TOKEN_SYSTEM.md)                 |
| Database Schema               | [docs/architecture/DATABASE_SCHEMA.md](./docs/architecture/DATABASE_SCHEMA.md)           |
| Database Setup                | [docs/architecture/DATABASE_SETUP.md](./docs/architecture/DATABASE_SETUP.md)             |
| Apps Architecture             | [docs/architecture/MY_APPS_ARCHITECTURE.md](./docs/architecture/MY_APPS_ARCHITECTURE.md) |
| App Store & First-Party Apps  | [src/app/store/data/store-apps.ts](./src/app/store/data/store-apps.ts)                   |
| Development Setup             | [README.md](./README.md)                                                                 |
| Operational Runbook           | [docs/RUNBOOK.md](./docs/RUNBOOK.md)                                                     |

---

## 🎫 Ticket-Driven Development (BLOCKING REQUIREMENT)

**CRITICAL**: No code changes without a ticket. Every PR must trace back to
documented requirements.

### Phase 0: Ticket Governance (BLOCKING)

> **Fast-path:** If CI runs under 10 seconds and the change is small (single
> commit), you may commit directly to main without a ticket. Use `file_guard` to
> verify first.

#### Step 1: Investigate Project Board

```bash
# Log in
echo ${GH_PAT_TOKEN} | gh auth login --with-token

# List all items in the project board
gh project item-list 2 --owner spike-land-ai --format json

# Check for existing issues matching keywords
gh issue list --repo spike-land-ai/spike.land --search "<feature keywords>" --json number,title,body,state
```

#### Step 2: For Each Feature Request

**IF related ticket exists:**

```bash
gh issue edit <number> --body "$(cat <<'EOF'
## Updated Requirements
<updated content here>
EOF
)"
```

**IF no ticket exists:**

```bash
gh issue create --repo spike-land-ai/spike.land \
  --title "Feature: <clear title>" \
  --body "## User Request
<original user request verbatim>

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Technical Approach
<planned implementation>

## Files Expected to Change
- path/to/file1.ts

## Out of Scope
- Explicitly list what this ticket does NOT cover" \
  --label "feature" \
  --project "spike-land-ai/2"
```

#### Step 3: Link & Confirm

- Output ticket URLs to user for approval before proceeding
- **WAIT** for user confirmation: "Tickets approved, proceed"

### Implementation Phases

1. **Discovery**: Read relevant docs ONLY after tickets exist
2. **Parallel Implementation**: Spawn subagents per ticket
3. **PR Review**: Verify traceability to acceptance criteria

### Feature Implementation Rules

- **TICKET FIRST**: Create/update GitHub issue BEFORE any code changes
- **USER APPROVAL**: Wait for user to confirm tickets before implementation
- **TRACEABILITY**: Every PR change must map to acceptance criteria
- **NO SCOPE CREEP**: Undocumented changes = blocked PR

---

## ⚠️ CI/CD Verification (CRITICAL)

**IMPORTANT FOR CLAUDE CODE AGENTS:**

When working on this repository, you **MUST** follow this process for every code
change:

1. **Push your changes** to a feature branch
2. **Create a Pull Request** (or push to existing PR)
3. **Wait for CI checks to start** - Don't assume success
4. **Monitor the CI pipeline** - Use `gh pr checks` or `gh run view`
5. **Verify ALL checks pass**:
   - ✅ Run Tests (unit tests with enforced CI coverage thresholds)
   - ✅ Build Application (Next.js build)
   - ✅ Deploy to AWS Preview
6. **Fix any failures immediately** - Do not leave failing CI
7. **Only consider the task complete** when all checks are green ✅

### How to Monitor CI Status

```bash
# Check PR status
gh pr view <PR-NUMBER> --json statusCheckRollup

# View specific check details
gh pr checks <PR-NUMBER>

# Watch a specific workflow run
gh run view <RUN-ID> --log-failed
```

**DO NOT mark a task as complete if:**

- CI is still running (status: IN_PROGRESS, PENDING)
- Any check has failed (conclusion: FAILURE)
- You haven't verified the status after pushing

---

## 🔥 Pre-Merge Smoke Test (MANDATORY)

Before merging ANY pull request, manually verify on the **AWS preview URL**:

- [ ] Home page loads without errors
- [ ] Navigation works correctly
- [ ] No console errors in browser dev tools
- [ ] New/modified features work as expected
- [ ] Login flow works (if applicable)

Document the result in PR comments before merging.

---

## 🔧 GitHub CLI Orchestration

**CRITICAL**: This project uses GitHub as the single source of truth for all
project management.

### Essential gh Commands

```bash
# Issues
gh issue list --state open --json number,title,labels,assignees
gh issue create --title "Title" --body "Description" --label "bug"
gh issue comment <number> --body "🤖 Starting work on this"
gh issue close <number> --comment "✅ Completed: <summary>"

# Projects
gh project item-list 2 --owner spike-land-ai --format json
gh project item-add 2 --owner spike-land-ai --url <issue-url>

# PRs
gh pr create --title "feat: <title> (#<number>)" --body "Resolves #<number>"
gh pr checks <PR-NUMBER>
```

### Agent Workflow

**When starting a session:**

1. Check open issues: `gh issue list --state open`
2. Check project board: `gh project item-list 2 --owner spike-land-ai`
3. Report status to user before asking what to work on

**When discovering work/bugs:**

1. Create an issue immediately: `gh issue create --label "agent-created"`
2. Add appropriate labels (bug, feature, tech-debt, p0, p1, p2)
3. Continue with current work - don't block on the discovery

**When completing work:**

1. Close issue: `gh issue close <n> --comment "✅ Done: <summary>"`
2. Link PR to issue: Include "Resolves #<n>" in PR description

### Labels

- `p0`, `p1`, `p2` - Priority levels
- `bug`, `feature`, `tech-debt` - Issue types
- `blocked`, `in-progress`, `agent-created` - Status

---

## 📁 Issue Management

### Resolving Project Issues

1. **Fetch open issues**:
   `gh issue list --state open --json number,title,author,body,url`

2. **Check authorship**:
   - **If created by `zerdos`**: Proceed automatically
   - **If created by someone else**: Ask user what to do

3. **Reference issues in commits and PRs** (REQUIRED):
   ```bash
   git commit -m "Fix authentication bug

   Resolves #123"

   gh pr create --title "Fix authentication bug (#123)" --body "Resolves #123"
   ```

---

## 🛠️ Quick Reference

### Development Commands

**Web App:**

```bash
yarn dev              # Start dev server (http://localhost:3000)
yarn build            # Build for production
yarn lint             # Run ESLint
yarn test:coverage    # Unit tests with enforced CI coverage thresholds
yarn depot:ci         # Run CI on current files using Depot (preferred - fast remote builds)
```

**Depot:** This project has a Depot subscription. **Always prefer
`yarn depot:ci`** over local CI runs — it executes CI remotely with fast caching
and parallelism.

**Dev Workflow (MCP-integrated):**

```bash
yarn start:dev            # Start dev server + Claude Code with MCP
yarn start:dev:guard      # Start with file guard (auto-test on change)
yarn dev:logs             # View dev server logs
yarn dev:logs:tail        # Follow dev server logs
yarn dev:logs:clear       # Clear dev server logs
```

**MCP Dev Tools (localhost only):**

When running locally, the spike.land MCP server exposes dev workflow tools:

- `dev_logs` — Read dev server logs (filterable, tail-able)
- `dev_status` — Server PID, uptime, port, current commit
- `github_status` — Current branch, commit, CI status, open PRs
- `file_guard` — Pre-check file changes against `vitest --changed`
- `notify_agent` — Send/receive dev event notifications

### Trunk-Based Development (When CI < 10s)

When `vitest --changed HEAD` runs in under 10 seconds:

- Commit directly to main — no branches needed
- Use `file_guard` MCP tool to verify changes pre-commit
- CI catches issues in real-time
- Still create branches for multi-day features or multi-agent collaboration

**spike-cli (CLI for spike.land platform):**

```bash
npx @spike-land-ai/spike-cli serve              # Start MCP multiplexer server
npx @spike-land-ai/spike-cli chat               # Interactive Claude chat with MCP tools
npx @spike-land-ai/spike-cli shell              # Interactive REPL to explore tools
npx @spike-land-ai/spike-cli auth login          # Authenticate with spike.land
npx @spike-land-ai/spike-cli registry search <q> # Browse MCP server registry
npx @spike-land-ai/spike-cli status              # Health check for configured servers
```

### Tech Stack

**Web App:**

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Database**: PostgreSQL + Prisma ORM
- **Cache/Rate-Limiting**: Redis (Upstash)
- **Auth**: NextAuth.js v5 (GitHub, Google, Facebook, Apple)
- **Payments**: Stripe (subscriptions + one-time)
- **Testing**: Vitest (unit + MCP tool tests) — 120 tool files, 122 test files
  (947 total test files)
- **CI/CD**: GitHub Actions + AWS ECS + Depot (remote builds)

**Cloudflare Workers (external repos under @spike-land-ai org):**

- **Runtime**: Cloudflare Workers + Durable Objects
- **Packages**: Published as `@spike-land-ai/*` on npm

### Directory Structure (Monorepo)

```
spike.land/
├── src/
│   ├── app/                       # App Router (~520 routes)
│   │   ├── admin/                 # Admin dashboards (mcp-dashboard)
│   │   ├── api/                   # API routes (~383 endpoints)
│   │   │   ├── mcp/               # MCP protocol endpoint
│   │   │   ├── tabletop/          # Tabletop game APIs
│   │   │   └── store/             # App store APIs
│   │   ├── apps/                  # First-party app UIs
│   │   │   ├── chess-arena/       # Multiplayer chess
│   │   │   ├── qa-studio/         # QA/testing dashboard
│   │   │   ├── audio-mixer/       # Audio production
│   │   │   ├── music-creator/     # Music creation
│   │   │   ├── tabletop-simulator/# Virtual tabletop
│   │   │   └── display/           # Display wall
│   │   ├── store/                 # App Store marketplace
│   │   │   └── data/store-apps.ts # Source of truth (StoreApp[])
│   │   ├── my-apps/               # User app builder
│   │   ├── career/                # Career navigator
│   │   ├── clean/                 # CleanSweep (gamified cleaning)
│   │   └── …                      # blog, gallery, settings, auth, etc.
│   ├── components/                # React components
│   │   └── ui/                    # shadcn/ui components
│   └── lib/                       # Business logic & services
│       ├── mcp/                   # MCP server (120 tool files, 122 tests)
│       │   └── server/tools/      # Tool implementations by category
│       ├── chess/                  # Chess engine, ELO, player/game/challenge managers
│       ├── state-machine/         # Statechart engine, types, visualizer
│       ├── qa-studio/             # Browser automation, a11y audits
│       ├── ai/                    # AI provider integration
│       ├── stripe/                # Payment processing
│       ├── upstash/               # Redis cache & rate limiting
│       ├── auth/                  # Authentication
│       ├── codespace/             # esbuild-wasm transpilation
│       └── …                      # 100+ other modules
│
├── packages/
│   └── store-apps/                # App Store data (@spike-land-ai/store-apps)
```

See [README.md](./README.md) for full development setup.

---

## ✅ Testing Requirements

- **Coverage thresholds enforced in CI** on MCP business logic
  (`src/lib/mcp/**/*.ts`):
  - Lines: 80%, Functions: 80%, Branches: 75%, Statements: 80%
- **MCP tool coverage**: 122 test files for 120 tool files
- **Test files**: Place `.test.ts(x)` alongside source files
- **MCP tool tests**: Business logic exposed as MCP tools, tested with
  `createMockRegistry()` pattern
- **Chess system**: 6 source files with dedicated test coverage (game, player,
  challenge, ELO, engine)
- **State machine**: Engine + types tested via MCP tool tests

### Multi-Agent Test Runs

When running tests across multiple agents (e.g., parallel test sweeps):

- **Use Bash `npx vitest run` instead of the vitest MCP tool** — the MCP tool
  has path resolution issues that waste 30-60% of agent tool calls
- **Batch files in a single command** — don't run tests one file at a time:
  ```bash
  # GOOD: Single batch run (~6s)
  npx vitest run src/lib/mcp/server/tools/chess-game.test.ts src/lib/mcp/server/tools/chess-player.test.ts

  # GOOD: Run entire directory
  npx vitest run src/lib/mcp/

  # BAD: Sequential single-file runs (~30s + overhead)
  npx vitest run file1.test.ts && npx vitest run file2.test.ts
  ```
- **Optimal agent configuration** (5 agents instead of 16):
  1. MCP tool tests: `npx vitest run src/lib/mcp/`
  2. Non-MCP lib tests: `npx vitest run src/lib/ --ignore src/lib/mcp/`
  3. Typecheck + Lint: `yarn typecheck && yarn lint`
  4. Manifest audit (code-reviewer agent)
  5. Coverage analysis: `npx vitest run --coverage src/lib/mcp/`
- **After 2 MCP vitest tool failures, switch to Bash exclusively** — don't retry
  the MCP tool more than twice

---

## 🔒 Code Quality Rules (BLOCKING)

- **NEVER** use `any` type (`as any`, `: any`, `Record<string, any>`) - use
  proper types or `unknown`
- **NEVER** add `eslint-disable` or `eslint-ignore` comments - fix the
  underlying issue instead
- **NEVER** use `@ts-ignore` or `@ts-nocheck` - fix the type error properly
- Existing pattern for dynamic Prisma imports:
  `const prisma = (await import("@/lib/prisma")).default;` (no type annotation
  needed - TypeScript infers it)

---

## 🐛 Bug-Fixing Workflow (BLOCKING REQUIREMENT)

**CRITICAL**: When fixing styling or UI bugs, agents MUST follow this
test-driven process:

### Step 1: Reproduce the Bug

- Visually confirm the bug exists
- Document the reproduction steps

### Step 2: Write a Failing Test

- **Unit test** (preferred for logic/state bugs): Write a test in the
  component's `.test.tsx` that fails with the current buggy code
- **MCP tool test** (preferred for business logic bugs): Write an MCP tool test
  that fails with the buggy code
- **Verify the test fails** before proceeding to the fix

### Step 3: Fix the Bug

- Implement the minimal fix
- The test from Step 2 must now pass

### Step 4: Verify

- Run `yarn test:coverage` — all tests pass
- Run `yarn lint` — no lint errors
- For UI bugs: visually confirm the fix in the browser

---

## 📝 Documentation Guidelines

**CRITICAL**: Agents must follow these rules:

1. **NEVER create .md files in project root** (except README.md and CLAUDE.md)
2. **All documentation goes in `docs/` directory**
3. **Update existing files** rather than creating duplicates
4. **Archive historical docs** in `docs/archive/`

---

## ADHD-Safe Development Protocol (HARD RULES)

### Rule 1: YOU NEVER TOUCH GIT OR GITHUB DIRECTLY

- No `git push`, `git merge`, `git rebase`, `git reset` from your terminal
- No GitHub UI: no merge buttons, no closing PRs, no editing files in browser
- No `gh pr merge` from your terminal
- **ONLY** Claude Code agents run git/gh commands

### Rule 2: ONE BRANCH, ONE AGENT, ONE CONVERSATION

- Default workflow is trunk-based: commit small, tested changes directly to main
- Create branches only for multi-day features or multi-agent collaboration
- You stay in the same conversation until the feature is done
- If you need to switch context: tell Claude to "park" the current work first

### Rule 3: THE PIPELINE IS THE BOSS

- If CI fails, Claude fixes it — you don't touch the code to "quickly fix" it
- If a review requests changes, Claude (or Jules) makes them
- You never push a "quick fix" to unblock a merge

### Rule 4: NO YOLO MERGES

- Branch protection enforces: 1 approval + all CI green
- Claude Code Review auto-approves+merges good PRs
- Claude Code Review tags @Jules for fixes on bad PRs
- You literally CANNOT merge even if you wanted to (enforce_admins=true)

### Rule 5: CONTEXT SWITCHING PROTOCOL

- Before switching tasks: tell Claude "save state" — it will commit WIP, note
  the branch
- When resuming: tell Claude "where was I?" — it checks open PRs and branches
- Never have more than 2 open PRs at once (Claude should warn you)

### Rule 6: CONTINUOUS COMMIT & VERIFICATION

- Commit frequently: Time to time make sure that everything which is making
  sense is committed.
- **Every 10 commits**, you MUST check if the local build passes by running
  `yarn depot:ci`.
- **If `yarn depot:ci` passes:** Please push the changes to remote.
- **If `yarn depot:ci` is erroring:** Prompt an agent (like Claude Code CLI or
  Antigravity CLI) to fix it. Once fixed, life goes on!

---

## 🚨 Troubleshooting

### Coverage Not 100%

- Run `yarn test:coverage` to see uncovered lines
- Check `coverage/` for detailed HTML report

### CI/CD Failing

- Check Actions tab for logs
- Verify secrets are configured
- Ensure tests pass locally first
