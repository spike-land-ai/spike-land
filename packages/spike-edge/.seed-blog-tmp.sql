INSERT OR REPLACE INTO blog_posts (slug, title, description, primer, date, author, category, tags, featured, hero_image, content, updated_at)
VALUES ('the-database-for-agents', 'defineBlock(): How I Built a Full-Stack Database Abstraction on Cloudflare Workers', 'I tried SpacetimeDB, wrote a blog post about it, then deleted it two days later. But the syntax stuck. Here''s how I rebuilt those patterns on Cloudflare Workers and migrated my entire platform in a weekend.', 'I deleted SpacetimeDB and rebuilt it on Cloudflare.', '2026-03-08', 'Zoltan Erdos', 'Developer Experience', '["cloudflare-workers","d1","block-sdk","mcp","ai","agents","architecture","typescript"]', 1, '/blog/the-database-for-agents/hero.jpeg', '<Tldr>

- I tried SpacetimeDB, got excited, wrote a blog post about it — then deleted everything two days later
- The patterns were right: tables = schema, reducers = API, `ctx.sender` = auth, subscriptions = real-time
- I rebuilt those same patterns on Cloudflare Workers as `block-sdk` — a `defineBlock()` DSL that packages storage schema + business logic + MCP tools into composable units
- `defineBlock()` runs on CF Workers (D1), in the browser (IndexedDB), or in Node.js (memory) — same code, three runtimes
- The full migration from Next.js happened over a weekend: 29 packages, 80+ MCP tools, zero AWS

</Tldr>

## The Sequel

[Last week I solved tool composition.](/blog/the-architecture-of-scale-building-tools) An immutable, type-safe builder so agents could write their own MCP tools. Middleware stacks. Phantom-branded context types. Zero casts. The whole thing.

But tools need data. Data needs a backbone. This post is about the backbone — how I found it, lost it, and rebuilt it.

## The Honest Retrospective

On March 2, I published a blog post at this very URL titled *"The Database for Agents: How SpacetimeDB Replaced My Coordination Layer in a Weekend."* I was genuinely excited. SpacetimeDB had patterns that felt right:

- **Tables** as schema — you define them in a module, they hold your data
- **Reducers** as API — typed functions that read/write tables inside transactions
- **`ctx.sender`** as auth — cryptographic identity, no JWT ceremony
- **Subscriptions** as real-time — SQL query subscriptions with delta pushes

I wrote 170 lines of breathless prose about it. Published it. Shared it.

Then on March 3, I sat down and asked myself: *what does SpacetimeDB give me that I don''t already have?*

The answer was: patterns. Just patterns. The infrastructure underneath — D1, KV, R2, Durable Objects — was already sitting in my Cloudflare account. I had been paying for it. I had been deploying to it. I just hadn''t organized my code the way SpacetimeDB organized its modules.

So I deleted SpacetimeDB. All of it. `spacetimedb-platform`, `spacetimedb-mcp`, `spike-db` — gone. And I kept the patterns.

| SpacetimeDB Concept | What I Built on CF Workers |
|---|---|
| Table definition in module | `defineTable()` with schema DSL |
| Reducer | Procedure (typed handler with Zod validation) |
| `ctx.sender` (Identity) | `BlockContext.userId` (injected by auth middleware) |
| Subscription queries | Durable Objects + WebSocket (when needed) |
| Auto-generated TypeScript bindings | Drizzle ORM + auto-generated types |
| `spacetime publish` (one deploy) | `wrangler deploy` (one deploy per service) |
| Module = single binary | Block = composable unit (`defineBlock()`) |

The syntax I wanted already existed. I just needed to write it.

## The Old Stack and Its Friction

The spike.land platform was a Next.js monolith. ~520 routes. ~383 API endpoints. 120+ MCP tool files. It worked. It had all the problems.

**Schema drift.** Prisma migrations are a ceremony. The schema lives in `schema.prisma`. The types live in `@prisma/client`. The validation lives in Zod schemas scattered across route handlers. Every schema change touches three places. Miss one and you get a runtime error that the compiler blessed.

**Polling hell.** When 50 agents want to know if a task is available, that is 25 requests per second doing nothing useful. Redis pub/sub helps, but now you have two data models that drift.

**Auth ceremony.** NextAuth gives you session tokens, JWT refresh, middleware chains. Every MCP tool needs to verify the caller. That is 120+ tools importing the same auth middleware.

**No coordination primitive.** Agents can call tools. Agents cannot talk to each other. Every coordination mechanism — Redis pub/sub, SQS — is a bolt-on service with its own deployment and failure handling.

I tried vinext too. It was still Next.js underneath, just with a different build pipeline. The architectural friction was the same: a monolith pretending to be modular.

<StackCollapseDemo />

| Next.js Monolith | CF Workers Stack |
|---|---|
| Prisma schema + migration | Drizzle schema + `generate` |
| Express/Next.js API route | Hono route handler (typed) |
| NextAuth session + JWT | Better Auth session + `ctx.userId` |
| Redis pub/sub | Durable Objects (when needed) |
| PostgreSQL + Prisma client | D1 + Drizzle ORM |
| AWS (ECS + Aurora + Redis + CloudFront) | Cloudflare (Workers + D1 + R2 + DO) |
| One monolith, 520 routes | 29 packages, each does one thing |

## defineBlock(): The Syntax I Wanted

The core innovation is `defineBlock()` — a single function that packages everything a "block" needs:

```typescript
// src/block-sdk/define-block.ts — the actual API

/** Context available to all block procedures */
export interface BlockContext {
  /** The storage adapter (D1, IDB, or memory) */
  storage: StorageAdapter;
  /** Current user ID (injected by auth middleware) */
  userId: string;
  /** Generate a unique ID */
  nanoid: (length?: number) => string;
}

export interface BlockDefinition<TStorage, TProcedures, TComponents> {
  /** Block name (kebab-case identifier) */
  name: string;
  /** Semantic version */
  version: string;
  /** Storage schema — tables the block needs */
  storage: TStorage;
  /** Business logic — procedures with middleware chains */
  procedures: (ctx: BlockProcedureContext) => TProcedures;
  /** React components — UI layer */
  components?: TComponents;
  /** MCP tool configuration — "auto" derives from procedures */
  tools?: "auto" | string[];
}
```

The schema DSL gives you typed column builders:

```typescript
// src/block-sdk/schema/types.ts

/** Column type factories — the `t` namespace */
export const t = {
  string: () => createColumnBuilder("string"),
  number: () => createColumnBuilder("number"),
  boolean: () => createColumnBuilder("boolean"),
  u64: () => createColumnBuilder("u64"),
  enum: (values: string[]) => createColumnBuilder("string", values),
};

/** Define a table with a name and column schema */
export function defineTable(
  name: string,
  columns: Record<string, ColumnBuilder>,
): TableDef { /* ... */ }
```

And `defineBlock()` itself resolves everything:

```
defineBlock({...})
    │
    ├── schema → schemaToSQL() → CREATE TABLE statements
    │
    ├── procedures → createProcedures(storage, userId) → typed handlers
    │                    │
    │                    └── middleware injects BlockContext
    │                        (storage adapter + userId + nanoid)
    │
    ├── tools: "auto" → introspects procedures → discovers tool names
    │
    ├── initialize(storage) → runs SQL migrations
    │
    └── getTools(storage, userId) → BuiltTool[] for MCP registration
```

When you set `tools: "auto"`, `defineBlock()` creates a dummy storage adapter, runs the procedure factory, and introspects which procedures have tool metadata. Those become MCP tools automatically. Write a procedure, get an MCP tool. No registration boilerplate.

## StorageAdapter: One Interface, Three Runtimes

The key to runtime portability is `StorageAdapter` — a universal interface that abstracts over three backends:

```typescript
// src/block-sdk/storage/types.ts

/** Key-value storage interface */
export interface KVAdapter {
  get<T = unknown>(key: string): Promise<T | null>;
  put<T = unknown>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<boolean>;
  list(prefix?: string): Promise<Array<{ key: string; value: unknown }>>;
}

/** SQL storage interface */
export interface SQLAdapter {
  execute<T extends Row = Row>(
    query: string, params?: unknown[]
  ): Promise<QueryResult<T>>;
  batch(
    queries: Array<{ query: string; params?: unknown[] }>
  ): Promise<QueryResult[]>;
}

/** Blob storage interface */
export interface BlobAdapter {
  put(key: string, data: ArrayBuffer | Uint8Array | ReadableStream): Promise<void>;
  get(key: string): Promise<ArrayBuffer | null>;
  delete(key: string): Promise<boolean>;
  list(prefix?: string): Promise<string[]>;
}

/** The universal storage adapter that blocks interact with */
export interface StorageAdapter {
  kv: KVAdapter;
  sql: SQLAdapter;
  blobs?: BlobAdapter;
}
```

Three implementations, same interface:

```
┌─────────────────────┬──────────────────────┬──────────────────────┐
│   CF Workers (D1)   │   Browser (IDB)      │   Node.js (Memory)   │
├─────────────────────┼──────────────────────┼──────────────────────┤
│ kv  → KV namespace  │ kv  → object store   │ kv  → Map<string,T>  │
│ sql → D1 database   │ sql → regex parser   │ sql → in-memory Map  │
│ blob→ R2 bucket     │ blob→ OPFS           │ blob→ fs (optional)  │
└─────────────────────┴──────────────────────┴──────────────────────┘
```

The D1 adapter wraps Cloudflare''s D1 binding. The IDB adapter wraps IndexedDB with a lightweight regex-based SQL parser (~350 lines) that handles INSERT/SELECT/UPDATE/DELETE patterns. The memory adapter uses in-memory Maps for testing. Note: a SQLite adapter (e.g. via better-sqlite3 or sql.js) is declared in the design but not yet implemented. Your block code never knows which one it''s talking to.

## A Real Block: task-queue

Here is the full `block-tasks` package — a task queue with CRUD operations and a claim workflow. This is the actual code from `src/block-tasks/index.ts`:

```typescript
import { defineBlock, defineTable, t } from "@spike-land-ai/block-sdk";
import { z } from "zod";

export const TASK_STATUSES = ["pending", "claimed", "done"] as const;

export const taskQueue = defineBlock({
  name: "task-queue",
  version: "1.0.0",

  // ── Schema ──────────────────────────────────────────────
  storage: {
    tasks: defineTable("tasks", {
      id: t.string().primaryKey(),
      title: t.string(),
      description: t.string(),
      status: t.string(),       // "pending" | "claimed" | "done"
      assignee: t.string(),
      created: t.u64(),
      updated: t.u64(),
    }),
  },

  // ── Procedures ──────────────────────────────────────────
  procedures: (ctx) => ({
    createTask: ctx.procedure
      .tool("create_task", "Create a new task in the queue", {
        title: z.string().min(1).max(200),
        description: z.string().max(2000).default(""),
      })
      .handler(async ({ input, ctx: blockCtx }) => {
        const now = Date.now();
        const task = {
          id: blockCtx.nanoid(12),
          title: input.title,
          description: input.description,
          status: "pending",
          assignee: "",
          created: now,
          updated: now,
        };
        await blockCtx.storage.sql.execute(
          `INSERT INTO tasks (id, title, description, status,
           assignee, created, updated) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [task.id, task.title, task.description,
           task.status, task.assignee, task.created, task.updated],
        );
        return {
          content: [{ type: "text", text: JSON.stringify(task, null, 2) }],
        };
      }),

    claimTask: ctx.procedure
      .tool("claim_task", "Claim a pending task for the current user", {
        taskId: z.string(),
      })
      .handler(async ({ input, ctx: blockCtx }) => {
        const result = await blockCtx.storage.sql.execute(
          `UPDATE tasks SET status = ?, assignee = ?, updated = ?
           WHERE id = ? AND status = ?`,
          ["claimed", blockCtx.userId, Date.now(), input.taskId, "pending"],
        );
        if (result.rowsAffected === 0) {
          return {
            content: [{ type: "text",
              text: "Task is not available for claiming" }],
            isError: true,
          };
        }
        return {
          content: [{ type: "text",
            text: JSON.stringify({ claimed: true, taskId: input.taskId }) }],
        };
      }),

    // ... listTasks, getTask, completeTask, deleteTask
  }),

  tools: "auto",  // ← all 6 procedures become MCP tools
});
```

The claim workflow is atomic: `UPDATE ... WHERE status = ''pending''` means only one agent can claim a task. No distributed locks. No Redis. Just SQL.

<AgentCoordinationDemo />

## The New Architecture

Here is the full stack, running entirely on Cloudflare:

```
                            ┌─────────────────────┐
                            │     spike-app        │
                            │  Vite + React +      │
                            │  TanStack Router     │
                            │  (SPA in R2)         │
                            └─────────┬───────────┘
                                      │ HTTPS
                            ┌─────────▼───────────┐
                            │     spike-edge       │
                            │  Hono on CF Workers  │
                            │  ┌─────────────────┐ │
                            │  │ CORS + Security  │ │
                            │  │ Rate Limiter (DO)│ │
                            │  │ R2 assets        │ │
                            │  │ Auth proxy       │ │
                            │  │ API proxy        │ │
                            │  └─────────────────┘ │
                            └──┬──────┬──────┬────┘
                               │      │      │
                 ┌─────────────▼┐  ┌──▼────┐ ┌▼──────────────┐
                 │  mcp-auth     │  │spike- │ │spike-land-    │
                 │  Better Auth  │  │land-  │ │backend        │
                 │  + D1         │  │mcp    │ │Durable Objects│
                 │  sessions,    │  │80+    │ │real-time sync │
                 │  OAuth,       │  │MCP    │ │WebSocket      │
                 │  device flow  │  │tools  │ │collaboration  │
                 └──────────────┘  │D1 +   │ └───────────────┘
                                   │Drizzle│
                                   └───────┘
```

> **Note:** The platform runs 8 Cloudflare Workers total: spike-edge, spike-land-mcp, mcp-auth, spike-land-backend, transpile, code, spike-review, and image-studio-worker.

The spike-edge service is the edge gateway — here is its actual route structure:

```typescript
// src/spike-edge/index.ts
const app = new Hono<{ Bindings: Env }>();

// Global middleware: CORS, security headers, error handling
app.route("/", health);       // GET /health — R2 connectivity
app.route("/", r2);           // GET/POST/DELETE /r2/:key
app.route("/", proxy);        // POST /proxy/stripe|ai|github
app.route("/", live);         // Live update endpoints
app.route("/", analytics);    // Analytics ingestion
app.route("/", quizBadge);    // Quiz badge generation
app.route("/", version);      // Version info
app.all("/api/auth/*", ...);  // Auth proxy → mcp-auth
app.route("/", spa);          // SPA catch-all → R2
```

<DependencyCascadeDemo />

## The Migration Math

**Deleted:**
- PostgreSQL (Aurora) as primary datastore
- Prisma as the ORM and migration tool
- Redis (ElastiCache) as cache, pub/sub, and job queue
- NextAuth session management
- All of AWS — ECS clusters, ALBs, CloudFront distributions, NAT gateways, VPCs
- SpacetimeDB (lasted exactly one day)

**Deployed:**
- 29 packages, each does one thing
- D1 database with 17 tables in spike-land-mcp alone (Drizzle-managed)
- 80+ MCP tools
- 8 Cloudflare Workers (spike-edge, spike-land-mcp, mcp-auth, spike-land-backend, transpile, code, spike-review, image-studio-worker)
- 0 servers to manage

| What | Before | After |
|---|---|---|
| Database | PostgreSQL (Aurora) | D1 (SQLite at the edge) |
| ORM | Prisma | Drizzle |
| Cache | Redis (ElastiCache) | KV / D1 |
| Auth | NextAuth + JWT | Better Auth + session |
| Real-time | Redis pub/sub | Durable Objects |
| Hosting | AWS (ECS + ALB + CloudFront) | Cloudflare Workers |
| Deploy | Docker build → ECR → ECS | `wrangler deploy` |
| Monthly cost | $200+ (Aurora + Redis + ECS + NAT) | ~$5 (Workers paid plan) |

## Schema = API = Auth (On Workers)

The thesis that excited me about SpacetimeDB is alive — just on different infrastructure.

**D1 table = schema.** Drizzle generates migrations from TypeScript table definitions. Here is a snippet from spike-land-mcp''s actual schema:

```typescript
// src/spike-land-mcp/db/schema.ts (17 tables, excerpt)
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  role: text("role").notNull().default("user"),
  createdAt: integer("created_at", { mode: "number" }).notNull(),
  updatedAt: integer("updated_at", { mode: "number" }).notNull(),
});

export const registeredTools = sqliteTable("registered_tools", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  schema: text("schema").notNull().default("{}"),
  status: text("status").notNull().default("draft"),
  installCount: integer("install_count").notNull().default(0),
  createdAt: integer("created_at", { mode: "number" }).notNull(),
  updatedAt: integer("updated_at", { mode: "number" }).notNull(),
});
```

**Hono route = API.** Typed handlers with Zod validation. No controller classes. No middleware chains longer than three lines.

**Better Auth session = auth.** No JWT refresh. No token expiry edge cases. The session is the credential. `ctx.userId` is the equivalent of SpacetimeDB''s `ctx.sender`.

**`drizzle-kit generate` = `spacetime generate`.** Both derive types from the schema. Both catch drift at compile time.

<ConvergenceDemo />

| SpacetimeDB Pattern | CF Workers Equivalent |
|---|---|
| Table in module | Drizzle `sqliteTable()` definition |
| Reducer | Hono route handler / block procedure |
| `ctx.sender` | `ctx.userId` (Better Auth session) |
| Subscription query | Durable Object + WebSocket push |
| `spacetime generate` | `drizzle-kit generate` |
| `spacetime publish` | `wrangler deploy` |
| One module = everything | One block = schema + procedures + tools |

## Trade-Offs

I am not going to pretend this is strictly better. Here is the honest assessment:

**No built-in real-time subscriptions.** SpacetimeDB''s subscription queries — where you subscribe to a SQL query and get deltas pushed — were genuinely great. On CF Workers, real-time requires Durable Objects + WebSocket plumbing. It works, but it''s not a primitive. You have to build it.

**D1 is SQLite, not PostgreSQL.** No full-text search (without FTS5 extensions). Limited concurrent write throughput. 10MB database size limit on free tier. For the spike.land workload (mostly reads, moderate writes), this is fine. For a write-heavy analytical workload, it would not be.

**Vendor lock-in shifted.** From SpacetimeDB (small startup, young ecosystem) to Cloudflare (massive company, mature ecosystem). I sleep better at night, but I''m still locked in. The `StorageAdapter` abstraction means I *could* swap backends, but let''s be honest — if Cloudflare disappeared tomorrow, I''d be rewriting more than adapters.

**block-sdk is custom and young.** No community. No ecosystem. No Stack Overflow answers. If I get hit by a bus, the next developer reads my code or starts over. But: I own every line. I can read every line. I can change it on a Tuesday. That matters more to me than ecosystem size at this scale.

**Schema DSL limitations.** The `defineTable()` DSL supports column types (`string`, `number`, `boolean`, `u64`, `enum`) with `primaryKey()` and `optional()` modifiers, but has no support for foreign keys, indexes, composite primary keys, or column defaults. For schemas that need these features, use Drizzle directly — `block-sdk` is designed for simple per-block CRUD tables, not relational modeling.

**SpacetimeDB''s developer experience was genuinely good.** The Rust module system, the auto-generated bindings, the single-binary deployment — these are well-designed. If SpacetimeDB had been a Cloudflare product, I might still be using it. The reason I left was not quality. It was that I was adding a dependency I didn''t need on top of infrastructure I already had.

## Closing

The best architecture is the one you stole the patterns from and rebuilt on infrastructure you already understood.

SpacetimeDB showed me what a good data abstraction looks like: schema and API and auth converging into one thing. I just didn''t need SpacetimeDB to build it. The patterns were universal. The implementation was portable. The weekend was well spent.

Twenty-nine packages. Eighty-plus MCP tools. Eight Cloudflare Workers. Zero servers. One `defineBlock()` call that packages schema, business logic, and MCP tools into a composable unit that runs anywhere.

Published on March 8 — International Women''s Day, and also Zoltan''s nameday. Boldog nevnapot!

*Check out the platform at [spike.land](https://spike.land), or try the [QA Studio](https://spike.land/apps/qa-studio).*

---

*Zoltan Erdos is a developer based in Brighton, UK, building [spike.land](https://spike.land). He has been spiking on ESM, TypeScript, and build pipelines for five years. He still thinks the best architecture is the one you can delete and rebuild in a day.*', unixepoch());

INSERT OR REPLACE INTO blog_posts (slug, title, description, primer, date, author, category, tags, featured, hero_image, content, updated_at)
VALUES ('bugbook-elo-system', 'Why We Gave Bugs an ELO Rating', 'How we built a public bug tracker with chess-inspired ELO rankings, user reputation gating, and per-service feedback tools — turning bug reports into a defense against platform abuse.', 'Chess rankings for bugs. Trust scores for users. One system.', '2026-03-04', 'Zoltan Erdos', 'Architecture', '["elo","bugbook","anti-abuse","mcp","architecture","cloudflare-workers"]', 1, '/blog/bugbook-elo-system/hero.png', 'We run 80+ MCP tools across half a dozen Cloudflare Workers. Until last week, errors went to `console.error()` and disappeared. Users had no way to report bugs. And our rate limiting was a flat per-IP window — the same limit for a first-time visitor and a power user who''d been on the platform for months.

This is the story of how we fixed all three problems with one system.

---

## The Problem: Internal DDoS

When you expose 80 tools to the internet via MCP, you''re one bad actor away from a very expensive afternoon. A single agent in a retry loop can hammer your Workers, your D1 database, your KV store — and you can''t distinguish it from a legitimate user making rapid tool calls.

IP-based rate limiting doesn''t cut it. Agents share IPs. VPNs exist. And the real question isn''t "how many requests per minute?" — it''s "should this caller be trusted at all?"

We needed a reputation system.

## Why ELO?

We already had an ELO engine in our codebase — the chess package uses it for player rankings. ELO has a beautiful property: it''s a single number that encodes trust, and it adjusts itself based on behavior.

The insight was: **ELO isn''t just for chess players. It works for anything that competes.**

So we gave ELO ratings to two things:
1. **Bugs** — which bugs matter most?
2. **Users** — who should be trusted with platform access?

## Bug-vs-Bug ELO

Every bug starts at ELO 1200. When someone reports a bug, that bug "wins" a match against a random bug in the same category. Its ELO goes up; the other''s goes down.

This means:
- Frequently reported bugs climb the leaderboard
- Old bugs that nobody encounters anymore decay naturally
- The ELO leaderboard is a live priority list that maintains itself

We didn''t want product managers manually triaging bugs. We wanted bugs to tell us how important they are through the collective signal of user reports.

### Bug Lifecycle

```
CANDIDATE → ACTIVE → FIXED → DEPRECATED
```

A bug starts as a CANDIDATE when first reported. After 3 independent reports, it auto-promotes to ACTIVE. When fixed, it''s marked FIXED. If it''s irrelevant for 5+ sessions, ELO decay pushes it toward DEPRECATED.

## User ELO: Trust as a Number

Every user (and their agents) starts at ELO 1200. Actions shift the score:

| Event | ELO Change |
|-------|-----------|
| Report a valid bug | +25 |
| Bug you reported gets confirmed | +10 |
| Successful tool use | +1 |
| False bug report | -15 |
| Hit a rate limit | -5 |
| Abuse flag | -50 |

There''s a daily gain cap of +100 to prevent gaming. The math is adapted from chess K-factors — new users have higher volatility (K=40) that stabilizes over time (K=16 above ELO 2400).

### Tier Gating

ELO maps to three tiers:

| Tier | ELO Range | Effect |
|------|-----------|--------|
| Free | 0–999 | 4x rate limit multiplier |
| Pro | 1000–1499 | Standard access |
| Elite | 1500+ | Full access, lower limits |

A brand-new user (1200 ELO) starts as Pro. Good behavior keeps them there. Abuse drops them to Free tier, where rate limits are 4x stricter — effectively 30 requests per minute instead of 120.

This is the anti-DDoS mechanism. It''s not a wall; it''s a gradient. Bad actors experience progressively worse performance until the platform becomes unusable for them, while legitimate users never notice.

### Tools Can Require Tiers

Any MCP tool can declare a `requiredTier`:

```typescript
{
  name: "expensive_operation",
  requiredTier: "elite",
  // ...
}
```

Most tools have no tier requirement. But computationally expensive operations (image generation, code compilation) can require Pro or Elite access. This prevents a zero-reputation agent from burning through GPU credits.

## Feedback Tools Everywhere

Every MCP server in our platform now has a feedback tool:

| Server | Tool Name |
|--------|-----------|
| spike-land-mcp | `mcp_feedback` |
| mcp-image-studio | `img_feedback` |
| hackernews-mcp | `hackernews_feedback` |
| esbuild-wasm-mcp | `esbuild_feedback` |
| openclaw-mcp | `openclaw_feedback` |

When an agent encounters an error, it can report it through the closest feedback tool. The report flows to the central Bugbook in spike-edge, where it''s matched against existing bugs (by error code + service name) or creates a new entry.

For Cloudflare Workers, this uses service bindings — zero-latency, zero-cost inter-Worker communication. For Node.js MCP servers, it''s an HTTPS POST to the edge API.

The key insight: **agents are the best bug reporters.** They hit edge cases humans never would. They can describe the exact tool call, parameters, and error message. And they report immediately — no Jira ticket sitting in a backlog for three sprints.

## Centralized Error Collection

Every unhandled error in spike-edge now gets logged to D1 via `waitUntil`:

```typescript
app.onError((err, c) => {
  c.executionCtx.waitUntil(
    c.env.DB.prepare(
      "INSERT INTO error_logs (...) VALUES (...)"
    ).bind(/* ... */).run()
  );
  return c.json({ error: "Internal Server Error" }, 500);
});
```

This replaces `console.error()` with structured, queryable error data. Service name, error code, stack trace, request metadata — all searchable. The Bugbook API can correlate user reports with actual errors, closing the loop between "user says something is broken" and "here''s the stack trace."

## The Public Bugbook

The Bugbook is public at `/bugbook`. Anyone can see:
- All active bugs, ranked by ELO
- Bug detail pages with report history and ELO timeline
- A leaderboard showing top bugs and top reporters

Users who report bugs can track their reports and see when bugs get fixed. This is deliberate transparency — if you report a bug, you shouldn''t have to wonder if anyone noticed.

Authenticated users can:
- Submit new bug reports
- Confirm existing bugs ("I have this bug too")
- View their own report history

## Blog Comments with ELO Consequences

We also added comments to all blog articles. Logged-in users can comment at any point in an article, and other users can upvote or downvote comments.

Here''s where it gets interesting: if a comment accumulates a score of -10 or lower (overwhelmingly downvoted), the comment author receives an `abuse_flag` ELO event (-50 points). This is the community self-moderating — if you post spam or abuse in article comments, the community''s downvotes directly impact your platform reputation.

## Architecture Summary

```
                    ┌──────────────────┐
                    │   spike-app      │
                    │   /bugbook UI    │
                    └────────┬─────────┘
                             │ HTTPS
                    ┌────────▼─────────┐
                    │   spike-edge     │
                    │  Bugbook API     │
                    │  ELO Engine      │
                    │  Error Logs      │
                    │  Blog Comments   │
                    └──┬──────────┬────┘
          Service      │          │     HTTPS
          Binding      │          │
    ┌──────────────┐   │    ┌─────▼──────────┐
    │spike-land-mcp│◄──┘    │ Node.js MCP    │
    │ mcp_feedback │        │ servers         │
    │ ELO gating   │        │ *_feedback      │
    └──────────────┘        └────────────────┘
```

Everything runs on Cloudflare Workers + D1. No external databases, no Redis, no queues. The ELO engine is pure math — 40 lines adapted from our chess package. The entire system adds about 500 lines of business logic and 200 lines of SQL.

## What We Learned

1. **ELO is a universal trust primitive.** Any system where entities compete for relevance can use ELO. Bugs compete for attention. Users compete for trust. The math is the same.

2. **Agents are better bug reporters than humans.** They report immediately, with full context, and they hit edge cases that manual testing misses.

3. **Reputation-based rate limiting is gentler than IP blocking.** Instead of hard walls, bad actors experience degraded service. They can recover by behaving well. It''s a gradient, not a gate.

4. **Public bug tracking builds trust.** When users can see that their reports lead to fixes, they report more bugs. When they can see the priority order (via ELO), they understand why some bugs get fixed before others.

5. **Feedback tools should be everywhere.** If every MCP server has a feedback tool, then every agent interaction is a potential bug report. The coverage is automatic.

---

The code is open source. The Bugbook is live at [spike.land/bugbook](https://spike.land/bugbook). If you find a bug, report it — your ELO will thank you.', unixepoch());

INSERT OR REPLACE INTO blog_posts (slug, title, description, primer, date, author, category, tags, featured, hero_image, content, updated_at)
VALUES ('the-architecture-of-scale-building-tools', 'The Architecture of Scale: How I Made My MCP Tools Agent-Writable', 'When Google released Nano Banana 2, my image tools became obsolete overnight. Here''s how I rebuilt my MCP tool builder so agents could compose, test, and deploy tools without touching framework code.', 'Google killed 42 of my tools overnight. So I made agents write their own.', '2026-03-01', 'Zoltan Erdos', 'Developer Experience', '["mcp","ai","agents","cloudflare-workers","typescript","architecture","nano-banana-2","vibe-coding"]', 1, '/blog/the-architecture-of-scale-building-tools/hero.jpeg', '<Tldr>

- Google''s Nano Banana 2 made my 42 image tools obsolete overnight — I had to rebuild, not patch
- The old `ToolBuilder` class used `as unknown as` casts to track context through middleware — it worked, but agents could not safely extend it
- I extracted a tRPC-style immutable builder (`@spike-land-ai/shared/tool-builder`) with phantom-branded middleware that carries context types without runtime cost
- The `(input, ctx)` handler signature mirrors Cloudflare Workers and tRPC — no globals, pure functions, trivially testable
- The result: autonomous agents can now write, test, and deploy new tools without touching framework code

</Tldr>

## The Catalyst: Nano Banana 2

I have been spiking on ESM, TypeScript, and build pipelines for five years. Not at a company. Not on a team. Just me, too many repositories, and an increasing conviction that the way we wire AI tools together is fundamentally wrong.

When Google released Nano Banana 2, I found out how right I was — and how wrong my implementation still was.

Nano Banana 2 shipped with native image understanding so good that half of my mcp-image-studio tools (formerly Pixel Studio) became redundant overnight. The `describe` tool that called an external vision API? Nano Banana 2 does it in-context. The `extract_palette` tool? Nano Banana 2 reasons about color directly. The `compare` tool that diffed two images through a third-party service? Gone.

This was not a gradual deprecation. This was a Tuesday.

The tools still worked. They just were not worth paying for anymore. And when I sat down to rip them out and replace them with Nano Banana 2 integrations, I hit the real problem: my tool framework was not designed for tools to be disposable.

Every tool was tangled into a class-based builder with imperative mutation, `as unknown as` casts, and implicit state. Removing one tool meant understanding twenty. Adding a new tool meant copying two hundred lines of boilerplate and hoping the types lined up.

I had built a system optimized for writing tools slowly by hand. The world had just shifted to a place where tools needed to be written, tested, and thrown away in hours. By agents, not just by me.

## The Boilerplate Bottleneck

Here is what the old tool definition looked like. This is actual code from `mcp-image-studio/src/define-tool.ts` — the class-based builder that every tool went through:

```typescript
// OLD: mcp-image-studio/src/define-tool.ts (the "before")

class ToolBuilder<TInput, TCtx extends ToolContext, TFields extends z.ZodRawShape> {
    private resolvesConfig: ResolvesConfig = {};
    private creditsConfig?: CreditsConfig<TInput>;
    private jobConfig?: JobConfig<TInput>;
    private requireOwnershipFields: string[] = [];
    private validates: Array<(input: TInput, ctx: TCtx) => CallToolResult | void> = [];

    resolves<R extends ResolvedEntities>(
        config: R,
    ): ToolBuilder<TInput, TCtx & ResolvedDependencies<R>, TFields> {
        this.resolvesConfig = { ...this.resolvesConfig, ...config };
        return this as unknown as ToolBuilder<TInput, TCtx & ResolvedDependencies<R>, TFields>;
    }

    credits(
        config: CreditsConfig<TInput>,
    ): ToolBuilder<TInput, TCtx & { billing: { creditsCost: number } }, TFields> {
        this.creditsConfig = config;
        return this as unknown as ToolBuilder<TInput, TCtx & { billing: { creditsCost: number } }, TFields>;
    }

    job(
        config: JobConfig<TInput>,
    ): ToolBuilder<TInput, TCtx & { jobs: { currentJob: EnhancementJobRow } }, TFields> {
        this.jobConfig = config;
        return this as unknown as ToolBuilder<TInput, TCtx & { jobs: { currentJob: EnhancementJobRow } }, TFields>;
    }
}
```

See those `as unknown as` casts? Three of them. Each one telling TypeScript: "trust me, the context type changed." Each one a lie that happened to be true at runtime — but that the compiler could not verify.

The class mutated itself. Every `.resolves()` call modified `this.resolvesConfig` and returned `this` wearing a different type costume. The actual object was the same. The type was different. If you chained them in the wrong order, the runtime would not catch it. The compiler would not catch it. You would find out in production when `ctx.entities.image_id` was `undefined` and your handler crashed.

This was fine when I was the only person writing tools. I knew the order. I knew the invariants. I knew which casts were safe.

But agents do not know that. An agent looking at this code sees a class with mutable state, generic parameters that lie, and a contract that exists only in my head. It cannot safely write a new tool without risking a runtime type error that the compiler blessed.

## The Solution: A Pure TypeScript Schema DSL

I needed a builder that was:
1. **Immutable** — every method returns a new object, not a mutated `this`
2. **Type-safe** — no `as unknown as` casts, context types flow through generics
3. **Composable** — middleware can be written independently and stacked
4. **Agent-friendly** — an autonomous agent can read the types and write a correct tool

The answer was to steal from tRPC. Not the library — the pattern. An immutable procedure builder where `.use()` returns a new procedure with augmented context, and `.tool()` returns a builder that needs a `.handler()` to produce a complete tool definition.

Here is the core interface from `@spike-land-ai/shared/tool-builder`:

```typescript
// shared/src/tool-builder/builder.ts — the "after"

export interface Procedure<TCtx> {
  /**
   * Add middleware to the procedure chain.
   * The result is TCtx intersected with the middleware''s output context.
   */
  use<TCtxIn extends Record<string, unknown>, TCtxOut extends TCtxIn>(
    mw: Middleware<TCtxIn, TCtxOut>,
  ): TCtx extends TCtxIn ? Procedure<TCtx & TCtxOut> : never;

  /**
   * Define a tool with name, description, and input schema.
   * Returns a ToolBuilder that can add meta, output schema, and handler.
   */
  tool<TFields extends z.ZodRawShape>(
    name: string,
    description: string,
    fields: TFields,
  ): ToolBuilder<z.infer<z.ZodObject<TFields>>, TCtx, CallToolResult>;
}
```

The key insight is in the `use` method''s return type: `TCtx extends TCtxIn ? Procedure<TCtx & TCtxOut> : never`. If your middleware requires a context shape that the current procedure does not have, the return type is `never`. You get a compile error, not a runtime crash. No casts. No lies. The types tell the truth.

And the middleware itself carries its output type via a phantom brand:

```typescript
// shared/src/tool-builder/types.ts

declare const __middlewareCtxOut: unique symbol;

export interface Middleware<TCtxIn, TCtxOut extends TCtxIn> {
  fn: (params: MiddlewareParams<unknown, TCtxIn>) => Promise<CallToolResult>;
  /** Phantom brand — carries TCtxOut for type inference. Never set at runtime. */
  readonly [__middlewareCtxOut]?: TCtxOut;
}
```

A unique symbol that exists only in the type system. Zero runtime cost. Full type inference. The brand carries `TCtxOut` through the chain so that when you stack three middleware, TypeScript knows exactly what `ctx` contains in your handler — without a single cast.

## The Middleware Stack

With the builder in place, I extracted every cross-cutting concern from the old `ToolBuilder` class into independent middleware functions. Here is `withResolves` from `mcp-image-studio/src/tool-builder/image-middleware.ts` — the middleware that turns an `image_id` string into a resolved `ImageRow`:

```typescript
// mcp-image-studio/src/tool-builder/image-middleware.ts

function withResolves<R extends Record<string, keyof EntityTypeMap>>(config: R) {
  return middleware<
    { userId: string; deps: ImageStudioDeps },
    { userId: string; deps: ImageStudioDeps; entities: ResolvedEntities<R> }
  >(async ({ input, ctx, next }) => {
    const inputRecord = input as Record<string, unknown>;
    const entities: Record<string, unknown> = {};

    for (const [fieldKey, entityType] of Object.entries(config)) {
      const val = inputRecord[fieldKey];
      if (!val) continue;

      if (entityType === "image") {
        const { error, image } = await resolveImageOrError(ctx.deps, val as ImageId);
        if (error) return error;
        entities[fieldKey] = image;
      } else if (entityType === "album") {
        const resolveResult = await tryCatch(
          ctx.deps.resolvers.resolveAlbum(val as AlbumHandle),
        );
        if (!resolveResult.ok) {
          return errorResult("ALBUM_NOT_FOUND", resolveResult.error.message);
        }
        entities[fieldKey] = resolveResult.data;
      }
    }

    return next({ ...ctx, entities: entities as ResolvedEntities<R> });
  });
}
```

The pattern is always the same: take context in, do work, call `next()` with augmented context. If something fails, return an error result directly — short-circuiting the chain. The middleware does not know what comes after it. The handler does not know what came before it. They compose because they share a contract, not a class.

The ownership middleware is five lines. The credits middleware checks balance and consumes. The job middleware creates a tracking record. Each one independent. Each one testable in isolation. Stack them in any order that satisfies the type constraints, and the compiler guarantees correctness.

## A Real Tool: `analyze`

Here is what a complete tool looks like with the new system. This is the actual `analyzeTool` from `mcp-image-studio/src/tools/analyze.ts` — every line, including the `any` on line 11 (yes, I know):

```typescript
// mcp-image-studio/src/tools/analyze.ts

export const analyzeTool = imageProcedure
  .use(withResolves({ image_id: "image" }))
  .use(withOwnership(["image_id"]))
  .use(withCredits({
    cost: (input: any, deps) => {
      const includePalette = input.include_palette ?? true;
      return 1 + (includePalette && deps.generation.extractPalette ? 1 : 0);
    },
    source: "analyze",
    sourceIdField: "image_id",
  }))
  .tool("analyze", "AI-powered image analysis returning description and optional palette.", {
    image_id: z.string().describe("ID of the image to analyze"),
    detail_level: z.enum(DETAIL_LEVEL_VALUES)
      .describe("Level of detail: brief, detailed, or alt_text").optional(),
    include_palette: z.boolean()
      .describe("If true, extract dominant color palette").optional(),
  })
  .handler(async ({ input, ctx }) => {
    const { userId, deps } = ctx;
    const detailLevel: DetailLevel = input.detail_level ?? IMG_DEFAULTS.describeDetailLevel;
    const includePalette = input.include_palette ?? true;
    const image = ctx.entities.image_id;

    if (!deps.generation.describeImage) {
      return errorResult("NOT_SUPPORTED",
        "AI image description not supported in this environment");
    }

    const descResult = await tryCatch(
      deps.generation.describeImage({ userId, imageId: image.id }),
    );
    if (!descResult.ok) {
      return errorResult("DESCRIPTION_FAILED", descResult.error.message, true);
    }

    let palette: string[] | undefined;
    if (includePalette && deps.generation.extractPalette) {
      const paletteResult = await tryCatch(
        deps.generation.extractPalette({ userId, imageId: image.id }),
      );
      if (paletteResult.ok && paletteResult.data && !paletteResult.data.error) {
        palette = paletteResult.data.palette;
      }
    }

    const description = buildDescription(
      image, detailLevel, descResult.data.description, descResult.data.tags,
    );

    return jsonResult({
      imageId: image.id,
      description,
      palette,
      detail_level: detailLevel,
      creditsCost: ctx.billing.creditsCost,
      isAiGenerated: true,
    });
  });
```

Read it top to bottom. The middleware chain is a sentence: "Start with the image procedure. Resolve `image_id` to an `ImageRow`. Verify ownership. Consume credits. Define the tool schema. Handle the request."

By the time the handler runs, `ctx.entities.image_id` is a fully resolved `ImageRow`, ownership is verified, credits are consumed, and `ctx.billing.creditsCost` is populated. The handler does not check any of that. It does not need to. The middleware already did.

An agent reading this file sees exactly what it needs to write a new tool: pick middleware, define a schema, write a handler. The `any` on the credits cost function is the one compromise — the input type is not yet narrowed at that point in the chain. I left it in because honesty matters more than cosmetics.

## The Cloudflare Workers Convergence

<ConvergenceDemo />

The handler signature `(input, ctx)` is the same pattern Cloudflare Workers, tRPC, Hono, and most modern serverless frameworks converged on independently — because it is the minimal viable abstraction for a request handler.

```
Workers:  (request, env, ctx) => Response
tRPC:     (input, ctx)        => output
Builder:  ({ input, ctx })    => CallToolResult
```

No globals. No `this`. No ambient state. Pure functions that take input and context and return a result. My old `ToolBuilder` class added ceremony. The new builder removes it.

## Why This Matters for Agents

The refactoring was not about making my code prettier. It was about making my code writable by agents.

When an autonomous agent needs to add a new tool, it needs to answer three questions:
1. What middleware do I stack? (Look at similar tools)
2. What is the input schema? (Define Zod fields)
3. What does the handler do? (Write the business logic)

With the old class-based builder, the agent also needed to answer: "What order do the casts go in? What happens if I call `.resolves()` after `.credits()`? Why is `this` mutated but the type changed?" Those are questions about framework internals, not about business logic.

With the new builder, the framework is invisible. The agent writes a tool the same way I write a tool — by composing middleware and defining a handler. The types enforce correctness. The middleware handles cross-cutting concerns. The handler is just business logic.

The test for the `analyze` tool is equally straightforward:

```typescript
const result = await registry.call("analyze", {
  image_id: "img-123",
  detail_level: "detailed",
  include_palette: true,
});
expect(isError(result)).toBe(false);
const data = JSON.parse(getText(result));
expect(data.imageId).toBe("img-123");
expect(data.isAiGenerated).toBe(true);
```

No browser. No network. No mocking the framework. The tool is a function. The test calls the function. The function returns a result. That is [the whole philosophy](/blog/it-feels-like-cheating) — code is disposable, but the contract is not.

## The Infrastructure

<DependencyCascadeDemo />

This builder lives in `@spike-land-ai/shared`, which means every package in my ecosystem gets it for free. The monorepo has 18 repositories under the `@spike-land-ai` GitHub org, each as a separate git submodule:

- **mcp-image-studio** — 42 image tools using the builder pattern
- **spike.land** — the Next.js platform with 120+ MCP tools and the tool registry
- **spike-land-backend** — Cloudflare Workers with Durable Objects
- **transpile** — edge transpilation via esbuild-wasm
- **shared** — types, validations, and the tool builder itself

When I publish a new version of `@spike-land-ai/shared`, a [dependency cascade system](/blog/automate-dev-team-ai-agents) automatically opens PRs in every consuming repo. The builder update propagated to all 18 repos in under ten minutes. No manual bumps. No version drift.

That infrastructure — the cascade, the submodules, the shared CI — is what five years of spiking on ESM and TypeScript pipelines bought me. Not a single eureka moment, but a compound of hundreds of small decisions that suddenly paid off when I needed to refactor everything in a weekend.

## The Five-Year Payoff

Then Nano Banana 2 dropped and I needed to rewrite my tool framework in a weekend. And every one of those "slightly easier to change" decisions compounded. The Zod schemas meant I could extract input validation into middleware without touching handlers. The dependency injection meant I could swap image providers without touching tools. The pure functions meant I could test everything without spinning up infrastructure.

The five-year spike was not wasted time. It was [compound interest on good defaults](/blog/the-testing-pyramid-is-upside-down).

The builder is published. The tools are composable. The agents can write their own. And the next time Google obsoletes half my tools on a Tuesday, I will not need a weekend. I will need an afternoon — because the agent will do most of the work, and the types will make sure it does it correctly.

---

*Zoltan Erdos is a developer based in Brighton, UK, building [spike.land](https://spike.land). He has been spiking on ESM, TypeScript, and build pipelines for five years. He still thinks the best architecture is the one you can delete and rebuild in a day.*', unixepoch());

INSERT OR REPLACE INTO blog_posts (slug, title, description, primer, date, author, category, tags, featured, hero_image, content, updated_at)
VALUES ('mcp-explained-universal-adapter-for-ai-tools', 'MCP Explained: The Universal Adapter for AI Tools', 'MCP is more than tool calling — it''s a presentation layer for how AI understands tools, data, and workflows. Here''s the full spec, what spike-cli implements today, and what''s coming.', 'One protocol to connect every AI to every tool.', '2026-02-27', 'Zoltan Erdos', 'Developer Experience', '["mcp","ai","tools","resources","prompts","protocol","developer-tools","spike-cli","multiplexer"]', 1, '/blog/mcp-explained-universal-adapter-for-ai-tools/hero.png', '<Tldr>

- MCP has three primitives: **Tools** (actions), **Resources** (addressable content), and **Prompts** (reusable templates). Most implementations — including ours — only use Tools so far.
- It is a **presentation layer**, not just a data transport. MCP defines how AI discovers, understands, and interacts with capabilities — not just how it shuttles JSON.
- The full cycle: discover capabilities → call with typed params → get narrative, structured responses back.
- **The context window problem:** an LLM presented with hundreds of tool descriptions wastes context parsing tools it will never use. Smaller, relevant toolsets mean sharper reasoning and lower cost.
- spike-cli is an MCP multiplexer — one shell connecting spike-land (<ToolCount /> tools), vitest, and filesystem servers, all namespaced. **Lazy toolset loading** means agents see only the tools they request. Today that is 100% Tools. Resources and Prompts are next.
- Try it: `npx @spike-land-ai/spike-cli shell`

</Tldr>

## Connecting AI to Tools Shouldn''t Require a Custom Integration Every Time

It does right now. Every new tool means new glue code, new auth handling, new response parsing. MCP is the fix: one protocol, implemented once on each side, and any client talks to any server. Here''s what that looks like when spike-cli multiplexes three servers into a single shell:

<SpikeCliDemo />

spike-cli routes across spike-land (<ToolCount /> tools over HTTP), vitest (12 tools over stdio), and a local filesystem server — one namespace, automatic routing, zero per-tool wiring.

---

## What MCP Actually Is

MCP stands for **Model Context Protocol** — an open standard Anthropic released in late 2024 that defines how AI clients interact with external servers. But here is the part most explanations get wrong: **MCP is not just tool calling.** The spec defines three distinct primitives.

### The Three Primitives

**Tools** — Actions the AI can execute. A tool has a name, a description, and a typed input schema. The AI calls it, the server runs it, a result comes back. This is the part everyone talks about. It is also roughly 20% of the spec.

**Resources** — Addressable content the AI can read. A resource has a URI (like `resource://chess/game/g_8f3kq2/pgn`) and returns content — text, JSON, images, files. Resources are how a server exposes *data* without the AI having to call a function. Think of them as GET endpoints that the AI can browse. The client can list available resources, read them, and subscribe to changes.

**Prompts** — Reusable interaction templates the server provides. A prompt has a name, optional arguments, and returns a sequence of messages that the AI should use to structure its conversation. A chess server might expose an `analyze_position` prompt that returns a multi-step analysis template. A code review server might expose `security_audit` with a structured rubric.

### MCP Is a Presentation Layer

Here is the insight most MCP explainers miss: **MCP is a presentation layer, not just a data transport layer.**

An API moves data between systems. MCP does that too — but it also defines *how the AI should understand what it is looking at*. Tool descriptions tell the model what an action does in plain English. Resource URIs give structure to content. Prompts shape entire interaction patterns.

When you add Resources and Prompts to Tools, you are not just giving the AI more endpoints to call. You are giving it a **mental model** of what the server offers and how to navigate it. That is the difference between handing someone a phone book and giving them a guided tour.

### MCP Is Not an API

An API is a contract between two programs. MCP is a contract between a program and an intelligence. The distinction matters because:

- **API responses optimize for machines**: compact JSON, status codes, pagination tokens.
- **MCP responses optimize for understanding**: narrative text, contextual descriptions, structured content that an LLM can reason about.

**Transport-agnostic.** MCP runs over stdio, HTTP, or WebSockets. A local process and a remote HTTPS endpoint look identical from the protocol''s perspective.

**Discovery is built in.** The client asks the server to list its capabilities — tools, resources, prompts. The server responds with everything it exposes, including descriptions and schemas. The AI reads that list and decides what to use. No hardcoded routing needed.

---

## Three Ways to Think About MCP

Pick the mental model that sticks.

### The Restaurant

Menu = browsable content, order = action, tasting notes = interaction template.

<ScrollStoryCard
  title="The Restaurant"
  illustration="restaurant"
  mappings={[
    { left: "Customer", right: "MCP Client (AI)" },
    { left: "Menu", right: "Resource (browsable content)" },
    { left: "Placing order", right: "Tool call (action)" },
    { left: "Chef''s tasting notes", right: "Prompt (interaction template)" },
    { left: "Dish arrives", right: "Narrative response" }
  ]}
/>

### USB-C

One cable spec, three capabilities — data, display, and power.

<ScrollStoryCard
  title="USB-C"
  illustration="usb"
  mappings={[
    { left: "Laptop", right: "MCP Client" },
    { left: "USB-C spec", right: "MCP Protocol" },
    { left: "Peripheral", right: "MCP Server" },
    { left: "Data transfer", right: "Tools (actions)" },
    { left: "Display output", right: "Resources (content)" },
    { left: "Power delivery", right: "Prompts (templates)" }
  ]}
/>

### The Embassy

Same diplomatic protocol, regardless of which country you flew in from.

<ScrollStoryCard
  title="The Embassy"
  illustration="embassy"
  mappings={[
    { left: "Citizen", right: "MCP Client" },
    { left: "Diplomatic protocol", right: "MCP message format" },
    { left: "Embassy", right: "MCP Server" },
    { left: "Consular service", right: "Tool (action)" },
    { left: "Published guidelines", right: "Resource (content)" },
    { left: "Visa application form", right: "Prompt (template)" },
    { left: "Passport", right: "Auth token" }
  ]}
/>

---

## The MCP Request Lifecycle

The diagram below shows the **tool call** lifecycle — the most common MCP interaction. Resources and Prompts follow a similar pattern (discover, request, respond) but with different JSON-RPC methods.

<MCPFlowDiagram />

1. **Client** — The AI agent decides it needs something: a tool to call, a resource to read, or a prompt to follow.
2. **Protocol** — Request formatted as JSON-RPC: method name, typed params, request ID. For tools: `tools/call`. For resources: `resources/read`. For prompts: `prompts/get`.
3. **Server** — Receives, validates, routes to the appropriate handler.
4. **Tool** — Executes and produces a result. (For resources: returns content. For prompts: returns message templates.)
5. **Response** — Result flows back. The best responses are narrative-first — English the LLM can reason about, not just JSON it has to decode.

When spike-cli sits between client and server, it acts as a routing multiplexer — inspecting the namespace prefix (e.g. `vitest__run_tests`) and forwarding to the right upstream server.

---

## Narrative Responses: Tell Stories, Not Dump Data

Here is a pattern most MCP implementations get wrong. A chess tool returns a board state:

**The data dump approach:**

```json
{
  "fen": "r1bqkbnr/pppppppp/2n5/4P3/8/8/PPP1PPPP/RNBQKBNR",
  "turn": "b",
  "check": false,
  "castling": { "K": true, "Q": true, "k": true, "q": true },
  "halfMoves": 2,
  "fullMoves": 2
}
```

The LLM receives this and has to: parse the FEN, reconstruct the board, infer what happened, figure out what matters, and then compose a response. That is a lot of guesswork about what the fields mean in context.

**The narrative approach:**

```
Board State (Move 2, Black to play)

White opened with 1. e4 and pushed to e5 on move 2, grabbing central space
aggressively. Black developed the knight to c6, challenging White''s center.
The position is a Scandinavian-adjacent structure where Black needs to decide:
challenge e5 immediately with d6, or continue development with Nf6.

Key tension: White''s e5 pawn is advanced but unsupported. Black can undermine it.

FEN: r1bqkbnr/pppppppp/2n5/4P3/8/8/PPP1PPPP/RNBQKBNR b KQkq - 0 2
```

Same information. The narrative version tells the LLM *what matters* — the strategic context, the tension, the decision point. The FEN is still there for precision. But the model does not have to reconstruct the story from raw notation.

**Why this works:** LLMs are trained on billions of words of natural language — research papers, blog posts, documentation, books. They are pattern-matching machines optimized for narrative. When a tool response speaks the same language the model was trained on, the model reasons about it more effectively. JSON forces the model to translate; narrative lets it think.

---

## Beyond Text: Agent-Driven UI

Narrative responses are better than JSON. But if MCP is a presentation layer, why stop at text?

Consider: an AI asks a user to pick a color. The text-only approach is a chat message — "What color would you like?" — and a reply: "#FF5733". It works. But showing a **color picker widget** that returns the value is faster, less error-prone, and requires zero knowledge of hex notation.

That is Agent-Driven UI (ADUI): pre-designed micro-frontend widgets that replace or augment text in an AI conversation. A chess board instead of FEN notation. A calendar instead of "pick a date." A map instead of coordinates. The widget speaks a thousand words the LLM does not have to generate.

The development loop closes when you add design tools that create the widgets and browser automation (like Playwright) that validates them visually — enabling fully autonomous UI development and testing. The AI designs, builds, and verifies the interface without a human in the loop.

MCP''s presentation-layer architecture makes this possible. Tools execute actions. Resources serve content. Prompts structure interactions. And ADUI renders all of it as something a human can see and touch — not just read.

---

## The Multiplexer Problem

MCP standardizes how tools talk to AI, but wiring up N servers to every client is still a mess of duplicated config and colliding tool names. spike-cli sits between your AI client and every server.

### One Config, All Servers

One `.mcp.json`, any mix of transports:

```json
{
  "mcpServers": {
    "spike-land": {
      "type": "url",
      "url": "https://spike.land/api/mcp"
    },
    "vitest": {
      "type": "stdio",
      "command": "npx",
      "args": ["@anthropic-ai/vitest-mcp"]
    },
    "filesystem": {
      "type": "stdio",
      "command": "npx",
      "args": ["@anthropic-ai/filesystem-mcp", "/home/user/project"]
    }
  }
}
```

### Namespacing

Multiple servers, colliding tool names. spike-cli prefixes each tool with its server name:

- `spike-land__chess_new_game`
- `vitest__run_tests`
- `filesystem__read_file`

Flat, collision-free tool list. Routing handled automatically.

### Lazy Toolset Loading

spike.land ships <ToolCount /> tools. An LLM presented with 400 tool descriptions spends context parsing what it does not need — every irrelevant tool definition is tokens the model could have used for reasoning. The result: worse decisions and higher cost. spike-cli solves this by grouping tools into toolsets that load on demand — only 5 gateway tools visible by default:

```
spike> toolsets
  TOOLSET      TOOLS   STATUS
  chess           6    available
  codespace       5    available
  qa-studio       8    available

spike> load chess
  ✓ Loaded toolset "chess" (6 tools from spike-land)
```

Load what you need, ignore the rest.

Think of it as the difference between a warehouse and a shelf. A warehouse has everything — but you spend time finding what you need. A shelf has exactly the five items you came for. spike-cli gives your AI agent a shelf. The warehouse is still there, but the agent only pulls from it when it needs a new toolset. The token savings compound: fewer tool descriptions in context means the model spends its context budget on your actual task, not on parsing capabilities it will never invoke.

---

## spike-cli in Action

### Quick Start

```bash
npx @spike-land-ai/spike-cli shell
```

Or install globally:

```bash
npm install -g @spike-land-ai/spike-cli
spike auth login
spike shell
```

### Shell Commands

- `servers` — connected servers + status
- `tools [server]` — list tools (filter by server)
- `call <tool> <json>` — call any tool
- `toolsets` — available toolsets
- `load <toolset>` — activate a toolset
- `auth` — manage auth for remote servers

### What spike.land Implements Today

spike.land exposes <ToolCount /> tools over MCP. Zero Resources. Zero Prompts. The platform is tools-only today — every interaction is a function call with a structured response.

That covers the most common MCP use case, but it is not the full spec. Resources would let an AI browse game states, user profiles, and app catalogs as addressable content — without calling a function. Prompts would let the server provide reusable interaction templates: "analyze this chess position," "review this code for security issues," "walk me through setting up a new app."

These are on the roadmap. The protocol supports them. The multiplexer will namespace them the same way it namespaces tools.

### Building a Tool

Adding a tool to an MCP server is ~30 lines:

```typescript
import { z } from "zod";
import type { ToolRegistry } from "../tool-registry";

export function registerMyTool(registry: ToolRegistry) {
  registry.register({
    name: "my_custom_tool",
    description: "Does something useful",
    category: "utilities",
    tier: "free",
    inputSchema: {
      input: z.string().describe("The input to process"),
      format: z.enum(["json", "text"]).optional()
        .describe("Output format"),
    },
    handler: async ({ input, format }) => {
      const result = processInput(input, format);
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify(result),
        }],
      };
    },
  });
}
```

Register it, spike-cli picks it up — namespaced, discoverable, callable.

---

## Real-World: Chess Arena via MCP

spike.land''s Chess Arena is entirely MCP-powered. Six tools:

| Tool | What It Does |
|---|---|
| `chess_new_game` | Creates a game with time control |
| `chess_send_challenge` | Challenges another player |
| `chess_get_board` | Returns board state as FEN |
| `chess_make_move` | Validates and executes a move |
| `chess_get_elo` | Returns player''s ELO rating |
| `chess_resign` | Resigns the current game |

```
spike> load chess
  ✓ Loaded toolset "chess" (6 tools from spike-land)

spike> call spike-land__chess_new_game timeControl="5+0"
  game created (g_8f3kq2), playing as white, waiting for opponent

spike> call spike-land__chess_send_challenge opponent="alice" timeControl="5+0"
  challenge sent to alice (ch_7x9k2m), pending, expires in 300s
```

The chess engine and game state are server-side — the AI just speaks MCP through spike-cli.

### What Chess Could Look Like with Full MCP

Today, everything is a tool call. With Resources and Prompts, the chess experience expands:

**Resources** (browsable content, no function call needed):
- `resource://spike-land/chess/game/g_8f3kq2/pgn` — full game notation
- `resource://spike-land/chess/game/g_8f3kq2/board` — current board as text/image
- `resource://spike-land/chess/player/alice/stats` — player profile and history

**Prompts** (reusable interaction templates):
- `analyze_position` — structured template for evaluating a chess position
- `post_game_review` — walks through key moments, blunders, and missed opportunities

The AI would browse resources to understand context, use prompts to structure its analysis, and call tools only when it needs to *act* — make a move, resign, send a challenge.

---

## Why This Matters

MCP turns N*M integrations into N+M. That is the part everyone understands.

The part most people miss: MCP is not just plumbing. When a server exposes Tools, Resources, and Prompts together, it is not just connecting the AI to functionality — it is teaching the AI how to think about a domain. The tool descriptions, resource structures, and prompt templates form a **cognitive interface** that shapes how the model approaches problems.

That is why MCP is a presentation layer, not just a transport layer. And that is why the quality of your tool descriptions, the narrative structure of your responses, and the completeness of your server''s capability surface all matter more than the raw number of endpoints you expose.

spike-cli adds a multiplexer on top: your AI client connects once, spike-cli handles every server behind it. Today that is <ToolCount /> tools. Tomorrow it includes Resources and Prompts, namespaced and routed the same way.

## 16 Perspectives on MCP

Not sure it clicks yet? 16 professionals explain MCP through their own lens:

<PerspectiveCarousel />

---

## Get Started

```bash
npx @spike-land-ai/spike-cli shell
```

- [MCP specification](https://modelcontextprotocol.io) — full spec including Tools, Resources, and Prompts
- [spike.land MCP endpoint](/api/mcp) — <ToolCount /> tools, Resources and Prompts coming soon
- [spike-cli source](https://github.com/nicewise/spike-mcp-cli)', unixepoch());

INSERT OR REPLACE INTO blog_posts (slug, title, description, primer, date, author, category, tags, featured, hero_image, content, updated_at)
VALUES ('the-grandmother-neuron-fallacy', 'The Grandmother Neuron Fallacy: Why Reductionism Breaks Your AI Tool Chain', 'Chaos theory, cognitive biases, and strange attractors explain why we keep building AI integrations wrong — and what MCP gets right.', 'Your AI pipeline fails because you treat clouds like clocks.', '2026-02-27', 'Zoltan Erdos', 'Developer Experience', '["mcp","ai","cognitive-bias","chaos-theory","complexity","reductionism","tools","developer-tools"]', 1, '/blog/the-grandmother-neuron-fallacy/hero.png', '<Tldr>

- **The Fallacy**: We build AI pipelines assuming tools act like isolated, deterministic functions. They don''t.
- **The Reality**: LLM contexts are chaotic systems. A rigid JSON schema that works in a unit test fails when combined with other tools because of sensitive dependence on initial conditions.
- **The Fix**: Stop trying to force "clocks" (rigid APIs) into "clouds" (LLM context). MCP works because it embraces complexity through narrative responses and organic discovery.
- We are fundamentally misapplying reductionist thinking to a scale-free system.

</Tldr>

## The Trap Set by Passing Tests

It is 2:00 AM. I have a three-tool AI pipeline running locally.

Tool A fetches a user profile. Tool B fetches their recent activity. Tool C writes a personalized email. I have unit tests for each tool. They pass instantly. I have an integration test for the pair-wise interactions. They pass.

But when I run the agent end-to-end, it fails about one time out of ten.

Not a hard crash. A soft failure. Tool A returns a slightly longer bio than usual because the user filled out a different field. The LLM reads that bio, gets distracted by a passing mention of "React Native," and when it calls Tool B, it hallucinates a parameter asking for mobile activity. Tool B returns an empty array. Tool C writes a confusing email about a nonexistent mobile app.

The tools are perfect. The pipeline is broken.

I spent three hours tweaking the system prompt to explicitly forbid this. I added regex validators. I locked down the JSON schema tighter than a bank vault. I treated it like a logic bug.

And then I realized what I was doing. I was applying a 19th-century scientific philosophy to a 21st-century reasoning engine. I had committed the grandmother neuron fallacy.

---

## 1. The Grandmother Neuron

In the 1960s, neuroscientists David Hubel and Torsten Wiesel won a Nobel Prize for discovering how vision works in cats. They found specific neurons in the visual cortex that fired only when the cat saw a very specific shape — say, a line tilted at exactly 45 degrees.

This was a triumph of reductionism. Complex things are just made of simple things.

If you follow that logic all the way up, you reach a theoretical concept: the "grandmother neuron." A single, specific neuron in your brain that fires if and only if you see your grandmother. Not a concept of grandmothers, not the shape of her face — just *her*.

It sounds elegant. It is also completely wrong. As Robert Sapolsky points out in his Stanford lectures on chaos theory and complexity, there simply aren''t enough neurons in the human brain to dedicate one to every specific concept, memory, and variation of reality you might encounter.

Your brain does not work by triggering isolated, deterministic functions. It works through distributed networks where the *context* of firing matters more than the specific neuron.

We do the same thing in software. We build an AI tool and think we have created a "grandmother API endpoint." We assume `fetch_user_activity` does exactly one thing, cleanly, every time. But when you drop that tool''s response into the context window of an LLM, it is no longer an isolated function. It is a signal entering a chaotic network. We expect the precision of reductionism, but we get the messy reality of complexity.

<ScrollStoryCard
  title="The Fallacy of Isolation"
  illustration="brain"
  mappings={[
    { left: "Grandmother Neuron", right: "The API Endpoint" },
    { left: "Single specific concept", right: "Single responsibility principle" },
    { left: "Fails because world is too complex", right: "Fails because context is chaotic" },
    { left: "Network activation", right: "Narrative context integration" }
  ]}
/>

---

## 2. Clocks and Clouds

In 1965, the philosopher of science Karl Popper published an essay called "Of Clouds and Clocks." He argued that we can classify physical systems on a spectrum.

At one end are clocks. They are highly deterministic, mechanical, and reductionist. If you take a clock apart, you can understand exactly how it works by studying the gears. You can predict its behavior with perfect accuracy.

At the other end are clouds. They are highly irregular, disorderly, and unpredictable. You cannot understand a cloud by taking it apart into individual water molecules. They are holistic systems governed by chaos.

As software developers, we spend our entire careers building clocks. We love clocks. REST APIs are beautiful, precise little clocks. You send a GET request to `/users/123`, and the gears turn, and a JSON object comes out. Every single time.

Then we encountered LLMs, and we panicked.

An LLM is a cloud. It is a probabilistic, non-deterministic system. And our immediate instinct was to try and jam clock parts into the cloud. We forced LLMs to output incredibly strict, rigid JSON schemas. We tried to make them behave like deterministic functions.

Sapolsky uses the analogy of a water wheel. A clockwork wheel turns at a steady rate. But a nonlinear water wheel, depending on the flow rate, might turn steadily, or it might reverse direction unpredictably.

When we build AI tool chains by chaining together rigid JSON APIs, we are trying to build a water wheel out of watch gears. MCP breaks this paradigm by saying: *let the cloud be a cloud*. Instead of forcing the LLM to output a precise JSON schema of a chess board to understand it, MCP encourages narrative responses. The tool returns a story about the board state. It feeds the cloud what it actually wants: unstructured context.

<SplitScreenDemo />

---

## 3. The Strange Attractor

One of the foundational concepts of chaos theory is the "strange attractor."

If you map a chaotic system over time in phase space, it doesn''t settle into a single, predictable point (a fixed attractor). Instead, it loops around indefinitely, creating a complex, infinitely interwoven shape—like a butterfly''s wings. The system is chaotic, but it is bounded. It never repeats the exact same path twice, but it stays within a recognizable pattern.

Here is the cognitive bias we fall for: the noise-is-just-noise bias. We think the variation around the "true" answer is just error.

When an LLM gives slightly different reasoning for the exact same input on two different runs, we call it a hallucination or a lack of reliability. We try to lower the temperature to 0 to force it to a single point. But in doing so, we strip away the system''s ability to navigate complex problem spaces.

There is no "true point" at the center of the strange attractor. The variation *is* the shape of the system.

When you use rigid APIs with AI, you are trying to force a single trajectory. When an MCP tool returns a narrative response, it embraces the strange attractor. It gives the model a broad, rich topography of information to navigate, rather than a single, brittle data point.

<BayesianConfidenceDemo />

---

## 4. The Butterfly Effect in Tool Chains

The most famous concept in chaos theory is "sensitive dependence on initial conditions"—the butterfly effect. A butterfly flapping its wings in Brazil sets off a tornado in Texas.

In deterministic systems (clocks), a small error in the input leads to a small error in the output. If you pass an ID of `101` instead of `100` to a REST API, you get the wrong user, but the format of the response is exactly the same.

In chaotic systems (clouds), a microscopic change in the input cascades exponentially.

I saw this in my 2:00 AM debugging session. A user''s bio contained the phrase "React Native." This tiny addition to the context window of the first tool call completely altered the trajectory of the LLM''s reasoning. It shifted the strange attractor just enough that by the time it called the second tool, it was hallucinating parameters.

This is the periodicity trap. We think because a tool chain worked three times in a row, it operates with a predictable period. We are blind to the exponential divergence hiding in the margins.

Rigid JSON tool descriptions are incredibly susceptible to this. If your tool expects `userId` and the LLM decides the context implies `user_id`, the whole chain shatters.

MCP mitigates this by allowing tools to be self-describing in natural language, and by encouraging human-readable, narrative responses. Narrative is robust against the butterfly effect. If the tool description says "provide the numeric user identifier," the LLM understands the semantic intent, even if its internal state has slightly shifted.

<MCPFlowDiagram />

---

## 5. Fractals: Scale-Free Complexity

Sapolsky talks about the coefficient of variation. If you measure the variation in heart rates over a minute, you get a certain number. If you measure the variation in heart rates over an hour, you get a similar number. Over a day, a week, a year—the variation looks roughly the same.

This is a scale-free system. It is a fractal. A piece of a fern looks exactly like the whole fern.

Reductionism is scale-blind. It assumes that if you understand the tiny components, you just add them up to understand the whole. But in scale-free systems, the complexity exists at *every level of zoom*.

We try to build agent pipelines with scaling reductionism. We say: "I have tested Tool A. I have tested Tool B. Therefore, an agent that has both Tool A and Tool B is tested."

But an LLM''s context window is a fractal landscape of semantic meaning. Adding a tool doesn''t just add a capability; it changes the entire terrain of available analogies, word associations, and attention weights.

MCP understands scale-free complexity. It does not try to hide the complexity from the model behind generic abstractions. Whether you are calling a single function to get the current time, or browsing a massive resource tree of a whole project''s documentation, the interaction model is the same: discover, describe, interact, interpret. It works identically at the micro and macro scales.

<RecursiveZoomDemo />

---

## 6. The Fish Tank

There is a classic study in animal behavior involving fish dominance hierarchies.

If you put Fish A and Fish B in an isolated tank, they will fight, and Fish A will establish dominance.
If you put Fish B and Fish C in an isolated tank, Fish B will establish dominance.

Reductionist logic says: `A > B` and `B > C`, therefore if we put all three in a tank, `A > C`.

This is the dyadic fallacy. When you put A, B, and C in the tank together, the outcome changes entirely. Sometimes C beats A. Why? Because the presence of the *audience* changes the behavior of the combatants. The system cannot be understood by summing its pairwise interactions.

This is exactly what happens when you start multiplexing tools.

I have seen an agent perfectly use an `insert_database_record` tool a hundred times in isolation. But when I added a `search_web` tool to its available toolset, it suddenly started putting URLs in the database fields instead of the actual data.

The presence of the `search_web` tool in the context window acted as an audience. It shifted the probabilities of the tokens the model reached for.

When you use a multiplexer like spike-cli to connect 50 tools across three different servers to a single agent, you are not just giving it 50 APIs. You are putting 50 fish in the tank. The only way the LLM can navigate this successfully is if the tools describe themselves clearly and return robust, narrative context. If they just return raw JSON, the token probabilities collide catastrophically.

<MCPTerminalDemo />

---

## 7. Reductionism Is Still Useful

I am not saying we should throw out our unit tests. Sapolsky has a crucial caveat in his lecture: reductionism is not completely wrong; it is just incomplete.

If you want to understand how a single enzyme works, reductionism is the best tool we have. If you want to build a tool that securely saves a row to a Postgres database, you should absolutely write deterministic unit tests for it. It is a clock, and it should behave like a clock.

The fallacy is applying the logic of the clock to the behavior of the cloud.

The genius of the Model Context Protocol is that it acts as the translator between these two worlds.

Your backend servers can remain deterministic clocks. They can execute precise code, write to databases, and return raw data. But by the time that capability crosses the MCP boundary, it is translated into the language of the cloud. Tools are described in messy, expressive English. Responses are wrapped in narrative context. Resources are presented as addressable ideas, not just rows in a table.

We spent the last two years trying to force LLMs to be APIs. The grandmother neuron fallacy told us that if we could just get the schema right, everything would be deterministic.

We were wrong. The complexity is the feature, not the bug. It is time we started building protocols that know the difference.

<SpikeCliDemo />', unixepoch());

INSERT OR REPLACE INTO blog_posts (slug, title, description, primer, date, author, category, tags, featured, hero_image, content, updated_at)
VALUES ('one-site-many-faces', 'One Site, Many Faces: How We Built 16 Versions of spike.land', 'The same URL, 16 different experiences. How spike.land uses persona-based personalization to serve content that actually resonates.', 'Same URL. 16 different experiences. One cookie.', '2026-02-22', 'Zoltan Erdos', 'Engineering', '["personalization","a-b-testing","onboarding","product"]', 1, '/blog/one-site-many-faces/hero.png', '<Tldr>

- Most companies A/B test between 2 variants. We ship 16. Simultaneously.
- 4 binary questions produce 16 distinct personas. Each gets their own landing page, poll questions, and app recommendations.
- A single cookie — `spike-persona` — drives server-side personalization across the entire platform.
- You are reading a personalized version of this article right now.

</Tldr>

## The A/B Tester''s Paradise

Here is the dirty secret of A/B testing: most teams test two variants. Maybe three if they are feeling adventurous. A headline tweak here, a button color there. Then they declare victory when one variant beats the other by 3%.

We thought that was boring.

spike.land ships 16 variants of every personalized surface. Not sequentially — simultaneously. Every visitor who completes our onboarding quiz gets content written specifically for them. Not "personalized" in the way that means we swapped your name into a template. Actually different. Different headlines, different pain points, different app recommendations, different poll questions.

The AI Indie developer building a solo AI product sees tools for orchestration and rapid prototyping. The Content Creator with an audience sees image studios and music tools. The Enterprise DevOps engineer sees dashboards and QA infrastructure. Same URL. Completely different experience.

This is not a thought experiment. It is running in production right now, and you might be experiencing it as you read this.

---

## The 4-Question Decision Tree

The magic starts with four questions. Not a 47-field form that makes you question your life choices. Four binary questions that branch into a tree of 16 leaves.

**Question 1: Do you write code?**
This single question splits the entire user base into two worlds. Developers go left. Everyone else goes right.

**Question 2** depends on your first answer. Developers get asked what they build (apps vs. infrastructure). Non-developers get asked about their goals (business vs. personal).

**Question 3** narrows further. Product builders: are you building for yourself or clients? Business folks: solo founder or team leader?

**Question 4** is the final split. Each branch divides one more time, landing you on exactly one of 16 personas.

Four questions. Sixteen outcomes. Each outcome maps to a persona with its own name, hero text, recommended apps, and call-to-action. The tree is deterministic — the same answers always produce the same persona.

Here is what your personalized landing page looks like based on your persona:

<PersonaLandingPreview />

If you have not taken the quiz yet, that component just invited you to do so. If you have, you are seeing your actual personalized content. That is the system working in real time.

---

## How the Cookie Crumbles

The technical implementation is deliberately simple. When a user completes the onboarding quiz, we set a single cookie:

```
spike-persona=ai-indie
```

That is it. One cookie. No complex session management, no user profile lookups on every page load, no third-party personalization platform charging per-impression.

The `spike-persona` cookie is read server-side by Next.js middleware and in client components via a simple utility. Server components can personalize at render time. Client components read the cookie on mount and adapt.

The flow looks like this:

1. User visits spike.land
2. Onboarding quiz presents 4 binary questions
3. Decision tree walks the answers to a persona leaf
4. `spike-persona` cookie is set with the persona slug
5. Every subsequent page load reads the cookie and personalizes

Landing pages at `/for/{persona-slug}` serve as the canonical entry point for each persona. These are not dynamically generated — they are pre-built with persona-specific copy, pain points, recommended tools, and calls to action. The cookie just determines which one you see when you hit the root URL.

Want to try a different persona? Use the switcher below:

<PersonaSwitcher />

Change the persona and reload this page. The poll question, the landing preview, even the framing of sections — it all adapts.

---

## The Vote

Here is where it gets interactive. The poll question you see below is not the same one everyone else sees. Each persona gets a question tailored to their perspective on A/B testing.

An ML Engineer might see: "Is A/B testing just a crude Bayesian bandit with extra steps?" A Non-technical Founder sees: "Should you let data pick your messaging, or trust your vision?" A Social Gamer gets: "Would you A/B test game mechanics to optimize fun?"

Same poll. Sixteen different questions. Your answer gets tagged with your persona, so we can see how different audiences think about the same topic.

<BlogPoll slug="one-site-many-faces" />

---

## Live Analytics

After voting, the results dashboard shows how every persona voted — broken down by segment. This is not a static chart. It refreshes every 30 seconds and shows real cross-persona data.

Watch the patterns emerge. Do developers vote differently from founders? Do creators agree with DevOps engineers? The data tells a story about how different mindsets approach the same question.

<PollAnalyticsDashboard slug="one-site-many-faces" />

---

## Persona Showcase

Here are all 16 personas, each with their own landing page. Click any link to see what spike.land looks like through their eyes.

### Developers

| Persona | Description | Landing Page |
|---|---|---|
| **AI Indie** | Solo developer building AI-powered products | [/for/ai-indie](/for/ai-indie) |
| **Classic Indie** | Solo developer building traditional apps | [/for/classic-indie](/for/classic-indie) |
| **Agency Dev** | Freelancer or agency developer building for clients | [/for/agency-dev](/for/agency-dev) |
| **In-house Dev** | Developer employed at a company | [/for/in-house-dev](/for/in-house-dev) |
| **ML Engineer** | ML/AI engineer deploying models to production | [/for/ml-engineer](/for/ml-engineer) |
| **AI Hobbyist** | Developer exploring AI for fun and learning | [/for/ai-hobbyist](/for/ai-hobbyist) |
| **Enterprise DevOps** | DevOps engineer in a large organization | [/for/enterprise-devops](/for/enterprise-devops) |
| **Startup DevOps** | DevOps engineer in a small team or startup | [/for/startup-devops](/for/startup-devops) |

### Business Leaders

| Persona | Description | Landing Page |
|---|---|---|
| **Technical Founder** | Tech-savvy solo founder building a business | [/for/technical-founder](/for/technical-founder) |
| **Non-technical Founder** | Non-tech solo founder who needs guided, no-code tools | [/for/nontechnical-founder](/for/nontechnical-founder) |
| **Growth Leader** | Business leader focused on scaling teams and revenue | [/for/growth-leader](/for/growth-leader) |
| **Ops Leader** | Business leader optimizing team operations | [/for/ops-leader](/for/ops-leader) |

### Creators & Explorers

| Persona | Description | Landing Page |
|---|---|---|
| **Content Creator** | Creator with an audience producing content | [/for/content-creator](/for/content-creator) |
| **Hobbyist Creator** | Person creating art, music, or content for personal enjoyment | [/for/hobbyist-creator](/for/hobbyist-creator) |
| **Social Gamer** | Person who enjoys multiplayer and social games | [/for/social-gamer](/for/social-gamer) |
| **Solo Explorer** | Casual user exploring the platform for personal use | [/for/solo-explorer](/for/solo-explorer) |

---

## Beyond the Blog

The persona system does not stop at landing pages and poll questions. It reaches into every corner of the platform.

**App recommendations.** Each persona has a curated set of four recommended apps from the spike.land store. An AI Indie sees the AI Orchestrator and Codespace. A Social Gamer sees Chess Arena and Tabletop Simulator. The store homepage reshuffles based on who you are.

**Learning paths.** The `/learnit/` section adapts its curriculum suggestions based on persona. A developer persona sees coding tutorials and API documentation. A non-technical founder sees no-code guides and business templates.

**Content ranking.** Blog posts, guides, and documentation surface differently depending on persona. An ML Engineer sees infrastructure-heavy content first. A Hobbyist Creator sees creative tool tutorials.

**Future: pricing sensitivity.** The persona model maps cleanly to willingness-to-pay segments. Enterprise DevOps and Agency Devs expect — and budget for — professional tooling. Hobbyist Creators and Solo Explorers are more price-sensitive. The same product, positioned differently, converts differently.

This is the real power of persona-based personalization. It is not just about making the homepage look different. It is about building a platform that genuinely understands who is using it and adapts accordingly.

---

## The Meta Reveal

Here is the part where we break the fourth wall.

You are reading one of 16 versions of this article right now. Not in the sense that the text changed — the prose is the same for everyone. But the poll question you saw above? Personalized. The landing preview? Personalized. The app recommendations on the sidebar? Personalized.

If you used the PersonaSwitcher component earlier, you already saw this in action. The page restructured itself around a different identity. That is not a demo. That is the production system, exposed as an interactive element in a blog post.

Most personalization engines hide behind the curtain. We are pulling it open and handing you the controls. Switch personas. See what a Technical Founder''s spike.land looks like versus a Content Creator''s. Compare the poll questions. Notice what changes and what stays the same.

The transparency is the point. Personalization works best when users understand it and trust it. Dark patterns erode trust. Showing you exactly how the system categorizes you — and letting you change it — builds it.

---

## The Philosophy

There is a William Gibson quote that gets thrown around in tech circles: "The future is already here — it is just not evenly distributed."

We took that literally.

The future of spike.land is not one product with one message hoping to resonate with everyone. It is 16 products, each speaking directly to someone specific. The AI Indie developer and the Hobbyist Creator both use spike.land, but they use it for completely different reasons. They have different pain points, different budgets, different definitions of success.

Treating them the same would be lazy. Treating them differently — with respect, transparency, and genuine understanding of their context — is what we are building toward.

Four questions. Sixteen personas. One platform that distributes itself evenly.

Welcome to your version of spike.land.', unixepoch());

INSERT OR REPLACE INTO blog_posts (slug, title, description, primer, date, author, category, tags, featured, hero_image, content, updated_at)
VALUES ('think-slowly-ship-fast', 'Think Slowly, Ship Fast', 'The Hourglass Model: heavy specs at the top, disposable UI in the middle, bulletproof business logic at the bottom. Five explanations, one for every level of your team.', 'Heavy specs. Disposable UI. Bulletproof logic.', '2026-02-20', 'Zoltan Erdos', 'Developer Experience', '["ai","testing","context-engineering","agents","vibe-coding","ci-cd","automation","productivity"]', 1, '/blog/think-slowly-ship-fast/hero.png', '<Tldr>

AI teams ship bugs because they skip the spec. The Hourglass Model fixes this: heavy planning and E2E specs at the top, disposable UI code in the middle, bulletproof business-logic tests at the bottom. Think slowly at the top so agents can ship fast in the middle. Five explanations follow — one for every level of your team.

</Tldr>

---

## Level 1: Why Your AI Team Ships Bugs

*For the PM who approves the sprint.*

The data is in, and it is not flattering.

CodeRabbit''s [2025 code quality study](/learnit/coderabbit-ai-code-quality-defect-study-2025) found that AI-assisted pull requests carry **1.7× more defects** than human-written ones. Not because the AI writes worse syntax — it writes *more* code, faster, with less review. Volume without verification.

METR''s [developer speed study](/learnit/metr-developer-speed-study-ai-coding-tools) measured experienced developers completing real-world tasks. With AI tools, they were **19% slower** — not faster. The developers themselves predicted a 24% speedup. They were wrong in both direction and magnitude. The overhead of reviewing, correcting, and re-prompting AI output ate every second it saved.

The pattern repeats. GitClear''s code churn analysis shows refactoring activity declining year over year as AI adoption rises. Teams are generating more code but maintaining less of it. The codebase grows. The understanding shrinks.

Here is what these studies share: the problem is not the AI. The AI is fine. The problem is the process around it. Teams hand an AI a vague ticket and hope for the best. That is [vibe coding](/blog/the-vibe-coding-paradox) — and it has a measured failure rate.

The fix is not better AI. It is better specs.

A spec is a decision made before code is written. A spec is "the email update requires confirmation" decided in a planning meeting, not discovered in a code review. A spec is "this endpoint returns 403 for unauthenticated users" documented before a single line is generated.

When you give an AI agent a tight spec, three things happen. First, the agent writes less code — only what the spec demands. Second, the reviewer has a contract to review against — not "does this look right?" but "does this match the spec?" Third, the test writes itself — the spec *is* the test, expressed in a different format.

Every minute spent on a spec saves ten minutes of debugging. Every hour of planning saves a day of rework. This is not a productivity hack. It is project management. You already know this. The question is whether you are willing to apply it to your AI workflow the same way you apply it to your human one.

The rest of this article explains exactly how — at five levels of technical depth.

---

## Level 2: The Hourglass

*For the junior developer writing their first AI-assisted feature.*

You have heard of the [testing pyramid](/blog/the-testing-pyramid-is-upside-down). Many unit tests at the base. Some integration tests in the middle. A few E2E tests at the top. The idea is that lower tests are faster and cheaper, so you write more of them.

The pyramid was designed for humans writing code by hand. AI changes the economics.

When an AI agent generates a React component, the UI code is cheap. Trivially cheap. You can regenerate it in seconds. The component itself is disposable — if it breaks, throw it away and regenerate. What is *not* disposable is the business logic underneath it: the validation rules, the API contracts, the state transitions. Those are the decisions that took your team hours to agree on.

The [Hourglass Model](/learnit/testing-pyramid-vs-hourglass-model-ai-development) flips the investment:

```
         ┌─────────────────────┐
         │   E2E Specs (heavy)  │  ← Humans write these
         │   User flows as       │
         │   Given/When/Then     │
         └──────────┬────────────┘
                    │
            ┌───────▼───────┐
            │  UI Code       │  ← AI generates this
            │  (thin,        │    Disposable.
            │   disposable)  │    Regenerate, don''t fix.
            └───────┬───────┘
                    │
    ┌───────────────▼───────────────┐
    │  Business Logic Tests (heavy)  │  ← MCP tools + unit tests
    │  Validation, contracts, state   │    Bulletproof.
    │  transitions, edge cases        │    Never skip.
    └────────────────────────────────┘
```

The top of the hourglass is wide: E2E specs that describe what the user experiences. "Given a logged-in user, when they change their email and confirm, then the profile shows the new email." These are written by humans. They are the requirements.

The middle is narrow: [disposable UI code](/learnit/disposable-ui-code-ai-native-development). React components, Tailwind classes, layout decisions. This is what the AI generates. If a component is wrong, you do not debug it — you regenerate it with a better spec. The middle is thin on purpose.

The bottom is wide again: unit tests for business logic, exposed as MCP tools. These tests are fast, deterministic, and comprehensive. They verify every rule your team agreed on. They run in milliseconds. They never flake.

The hourglass works because it puts human effort where it matters (specs and business logic) and AI effort where it is cheap (UI generation). You think slowly at the top. The AI ships fast in the middle. The tests catch everything at the bottom.

---

## Level 3: Where the Tests Live

*For the senior developer choosing what to test and how.*

The hourglass has a specific test allocation. Get this wrong and you are back to the pyramid''s pain.

**Bottom layer (70% of test effort): MCP tool tests.** Every user story becomes an [MCP tool](/learnit/mcp-tool-testing-pattern-create-mock-registry) — a function with a typed input schema, a handler, and a structured response. The tool is the three-way contract: it is the spec (the description), the interface (the schema), and the test surface (the handler).

```typescript
// The MCP tool IS the spec
const cancelSubscriptionTool = {
  name: "cancel_subscription",
  description: "Cancel the authenticated user''s active subscription",
  inputSchema: {
    type: "object",
    properties: {
      reason: { type: "string", enum: ["too_expensive", "not_useful", "switching", "other"] },
      feedback: { type: "string" },
      confirmCancellation: { type: "boolean" },
    },
    required: ["reason", "confirmCancellation"],
  },
  handler: async ({ reason, feedback, confirmCancellation }, context) => {
    const user = await context.getAuthenticatedUser();
    if (!user) return { error: "Not authenticated" };

    const subscription = await context.subscriptionService.getActive(user.id);
    if (!subscription) return { error: "No active subscription" };

    if (!confirmCancellation) {
      return {
        status: "confirmation_required",
        message: `Cancel ${subscription.plan} plan? This takes effect at period end.`,
        currentPeriodEnd: subscription.currentPeriodEnd,
      };
    }

    await context.subscriptionService.cancel(user.id, reason, feedback);
    return { status: "cancelled", effectiveDate: subscription.currentPeriodEnd };
  },
};

// The unit test verifies the contract
describe("cancel_subscription", () => {
  it("requires confirmation before cancelling", async () => {
    const ctx = createMockRegistry({
      user: { id: "1" },
      subscription: { plan: "pro", currentPeriodEnd: "2026-03-01" },
    });

    const result = await cancelSubscriptionTool.handler(
      { reason: "too_expensive", confirmCancellation: false },
      ctx,
    );

    expect(result.status).toBe("confirmation_required");
    expect(ctx.subscriptionService.cancel).not.toHaveBeenCalled();
  });

  it("cancels when confirmed and records reason", async () => {
    const ctx = createMockRegistry({
      user: { id: "1" },
      subscription: { plan: "pro", currentPeriodEnd: "2026-03-01" },
    });

    const result = await cancelSubscriptionTool.handler(
      { reason: "switching", feedback: "Moving to competitor", confirmCancellation: true },
      ctx,
    );

    expect(result.status).toBe("cancelled");
    expect(ctx.subscriptionService.cancel).toHaveBeenCalledWith("1", "switching", "Moving to competitor");
  });
});
```

This test runs in 3ms. It covers the confirmation flow, the cancellation logic, the reason tracking. It does not touch a browser. It will never flake because there is no DOM, no network, no animation timing.

**Top layer (20% of test effort): E2E specs.** Written in [Given/When/Then format](/learnit/given-when-then-e2e-test-writing-ai-agents), these verify full user flows through the actual UI. But they only verify *wiring* — that the UI calls the right business logic with the right arguments. The business logic itself is already proven by the MCP tool tests.

```
Given a user with an active "pro" subscription
When they navigate to /settings/billing
And they click "Cancel subscription"
And they select reason "too_expensive"
And they confirm the cancellation
Then they see "Cancellation effective March 1, 2026"
And the subscription status shows "Cancelling"
```

You need far fewer of these than you think. If the MCP tool test proves that cancellation with reason "too_expensive" works, the E2E test only needs to verify that the button click reaches the tool with the right arguments.

**Middle layer (10% of test effort): UI component tests.** What deserves a UI test? Only what is *unique to the UI*: accessibility, responsive layout, animation behavior, keyboard navigation. Not business logic. Not data transformation. Not state management. If the test asserts a business rule, it belongs in the MCP tool test. If it asserts a visual behavior, it belongs here.

The ratio — 70/20/10 — is not a rule. It is a signal. If you find yourself writing more UI tests than MCP tool tests, you are probably testing business logic through the DOM. Stop. Extract the logic into a tool. Test it there.

---

## Level 4: Spec-Driven Development with BMAD

*For the architect designing the workflow.*

The hourglass tells you *what* to test. [BMAD](/learnit/bmad-breakthrough-method-agile-ai-driven-development) — Breakthrough Method of Agile AI-Driven Development — tells you *how to plan it*.

BMAD defines six agent personas, each responsible for a specific phase. The key insight is not the personas themselves — it is the [context isolation](/learnit/control-manifests-step-file-architecture-ai-agents) between them. Each persona gets a fresh context window with only the artifacts it needs. No accumulated junk. No 50K-token mega-prompts.

Here is how the personas map to the hourglass:

| BMAD Persona | Hourglass Layer | Artifact |
|---|---|---|
| **PM** | Top (E2E specs) | User stories, acceptance criteria, Given/When/Then |
| **Architect** | Bottom (business logic) | MCP tool schemas, API contracts, data models |
| **Developer** | Middle (UI) | React components, layouts, styling |
| **QA** | All layers | Test verification, coverage analysis |
| **SM (Scrum Master)** | Orchestration | Ticket flow, blocker resolution |
| **PO (Product Owner)** | Validation | Acceptance, sign-off |

The power is in [epic sharding](/learnit/epic-sharding-token-reduction-multi-agent-workflows). Instead of stuffing an entire feature into one agent context, you break it into vertical slices. Each slice gets its own ticket, its own context, its own agent. The token reduction is dramatic — 74-90% fewer tokens per agent context compared to monolithic prompts.

A control manifest coordinates the slices:

```yaml
# .bmad/epics/subscription-management.yaml
epic: "Subscription Management"
status: in_progress

slices:
  - id: sub-cancel
    title: "Cancel subscription flow"
    status: completed
    pm_artifacts:
      - stories/cancel-subscription.md     # Given/When/Then
    architect_artifacts:
      - tools/cancel-subscription.ts        # MCP tool schema
      - schemas/subscription.prisma         # Data model
    developer_artifacts:
      - components/CancelDialog.tsx         # UI (disposable)
    qa_artifacts:
      - tests/cancel-subscription.test.ts   # MCP tool tests
    acceptance_criteria:
      - "User can cancel with reason"
      - "Cancellation requires confirmation"
      - "Effective at period end, not immediately"

  - id: sub-upgrade
    title: "Upgrade subscription flow"
    status: pending
    blocked_by: [sub-cancel]
    pm_artifacts:
      - stories/upgrade-subscription.md
    architect_artifacts:
      - tools/upgrade-subscription.ts
    # ...

context_rules:
  pm_sees: [stories/*, acceptance_criteria]
  architect_sees: [tools/*, schemas/*, stories/*.md]
  developer_sees: [tools/*.ts, components/*, stories/*.md]
  qa_sees: [tests/*, tools/*.ts, acceptance_criteria]
```

Each persona''s `*_sees` rule defines exactly what enters its context window. The PM never sees component code. The developer never sees the data model migration. The QA agent sees the tool interface and the acceptance criteria — enough to verify, not enough to get lost.

This is [context engineering applied to project management](/blog/how-claude-code-engineers-context). The same attention-budget physics that makes prompts fail at 30K tokens makes planning fail when an agent carries the entire project in its context. BMAD''s answer: do not carry the entire project. Carry exactly what this agent, at this step, needs to produce its artifact.

The manifest is the single source of truth. It tracks what is done, what is blocked, and what each persona needs to see next. When a new agent spins up for the next slice, it reads the manifest, loads its artifacts, and starts with a fresh context that is dense with relevant information and free of accumulated noise.

---

## Level 5: Running the Hourglass in Production

*For the AI team lead wiring the CI pipeline.*

You have the specs (BMAD). You have the test strategy (hourglass). Now you need a pipeline that enforces both — and does it fast enough that developers do not context-switch while waiting.

The [full loop](/learnit/spec-driven-development-ai-agents-workflow) looks like this:

**1. Ticket → 2. BMAD planning → 3. Implementation → 4. Hourglass CI → 5. Review → 6. Merge**

Step 4 is where the hourglass meets reality. The [CI pipeline](/learnit/ci-pipeline-hourglass-testing-strategy) runs three stages:

```yaml
# .github/workflows/hourglass-ci.yaml
name: Hourglass CI

on:
  pull_request:
    branches: [main]

jobs:
  # Stage 1: Business logic (the wide bottom)
  # Runs first because it''s fastest and catches the most bugs
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: yarn
      - run: yarn vitest run --changed origin/main --coverage
      - name: Enforce coverage thresholds
        run: |
          # MCP tool files: 100% coverage required
          # Utility files: 90% coverage required
          # Component files: 70% coverage required (UI is disposable)
          yarn check-coverage --tools=100 --utils=90 --components=70

  # Stage 2: Build verification (the narrow middle)
  # Proves the disposable UI compiles — nothing more
  build:
    needs: unit-tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: yarn
      - run: yarn build
      - run: yarn lint

  # Stage 3: E2E smoke tests (the wide top)
  # Runs only the flows affected by changed MCP tools
  e2e-smoke:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: yarn
      - run: npx playwright install --with-deps chromium
      - name: Run affected E2E tests
        run: |
          # Determine which MCP tools changed
          CHANGED_TOOLS=$(git diff origin/main --name-only | grep ''tools/'' | sed ''s|.*/||;s|\.ts$||'')
          if [ -z "$CHANGED_TOOLS" ]; then
            echo "No MCP tools changed — skipping E2E"
            exit 0
          fi
          # Run only the E2E specs that exercise changed tools
          yarn playwright test --grep "$CHANGED_TOOLS"
```

The key insight: `yarn vitest run --changed origin/main` runs only the tests affected by your PR. On a codebase with 500 MCP tool tests, a typical PR touches 3-5 tools. That means 10-20 tests run instead of 500. Seconds instead of minutes.

The [coverage thresholds are tiered](/learnit/gitclear-code-churn-refactoring-decline-ai-2025) to match the hourglass. MCP tools demand 100% — these are your business contracts, and every branch matters. Utilities get 90% — high but not fanatical. Components get 70% — because the UI is disposable and over-testing it is waste. If a component is wrong, you regenerate it. If a business rule is wrong, you have a production incident.

**Cost economics.** A monolithic E2E suite running 200 Playwright tests on every PR costs roughly 15-20 minutes of CI compute. With hourglass CI, the same PR runs 15 unit tests (5 seconds), one build (60 seconds), and 2-3 targeted E2E tests (30 seconds). Total: under 2 minutes. That is not incremental improvement. That is a category change in developer feedback speed.

**Blast radius analysis.** When a PR modifies a business rule — say, changing the cancellation policy from "end of period" to "immediate" — the hourglass CI catches it in three places. The MCP tool test fails because the expected `effectiveDate` changed. The build might fail if the component references the old field. The E2E test fails if the confirmation message is wrong. Three independent signals, all within 2 minutes.

When a PR only modifies UI — say, moving a button from the sidebar to the header — only the E2E test runs, and only if the spec references that layout. The unit tests do not run because no business logic changed. The blast radius is proportional to the risk. UI changes are low risk, low test cost. Logic changes are high risk, high test cost. The hourglass allocates verification effort where it matters.

This is [Addy Osmani''s observation](/learnit/addy-osmani-spec-driven-development-waterfall-compressed) come to life: spec-driven development is "waterfall compressed into minutes." You plan like a waterfall — sequentially, deliberately, with specs before code. You execute like agile — in parallel, with AI agents, in minutes instead of weeks. The hourglass is the shape that makes both possible.

---

## Level 6: The Discipline

Every technique in this article reduces to one discipline: **decide before you generate.**

Decide the user flow before the AI writes the component. Decide the business rules before the AI writes the handler. Decide the acceptance criteria before the AI writes the test. The decisions are the hard part. The generation is the easy part.

[You cannot automate chaos.](/blog/you-cannot-automate-chaos) An AI agent with no spec generates chaos faster. An AI agent with a tight spec generates working software faster. The difference is not the agent. It is the spec.

The hourglass is not a testing strategy. It is a thinking strategy. It says: invest human cognition where it compounds (specs, contracts, acceptance criteria) and invest machine cycles where they are cheap (UI, boilerplate, layout). Think slowly at the top. Ship fast in the middle. Verify everything at the bottom.

[The tools exist.](/learnit/addy-osmani-spec-driven-development-waterfall-compressed) BMAD gives you structured planning. MCP tools give you testable contracts. Vitest gives you millisecond feedback. The hourglass gives you a shape to hang it all on.

The only thing it cannot give you is the discipline to write the spec before you write the code. That part is on you.', unixepoch());

INSERT OR REPLACE INTO blog_posts (slug, title, description, primer, date, author, category, tags, featured, hero_image, content, updated_at)
VALUES ('godspeed-development-100-app-ideas', 'Godspeed Development: 100 App Ideas Powered by Spike Land MCPs', 'A look at the incredible velocity of AI-assisted development. Here are 100 full-stack app ideas you can build instantly using Spike Land''s MCP tools.', '100 apps you can build today with MCP tools.', '2026-02-17', 'Zoltan Erdos', 'Productivity', '["mcp","ai","fullstack","godspeed","velocity"]', 1, '/blog/godspeed-development-100-app-ideas/hero.png', 'If you are just starting out as a developer, building a full-stack application can feel overwhelming. You have to set up databases, wire up APIs, configure authentication, and build the frontend. It can take weeks just to get a basic prototype running.

But recently, something shifted. Because of a new architecture called **Model Context Protocol (MCP)**, development velocity has turned into absolute godspeed. 

I''ve reached a point where I can describe an app to an AI, and it can build a fully tested, secure, functioning full-stack application in under 5 minutes. 

This isn''t magic. It''s because we have exposed our complex backend business logic as discoverable, plug-and-play MCP tools on [spike.land](https://spike.land). Instead of an AI trying to guess how to write a database query from scratch, it simply "plugs into" our existing, secure MCP tools.

To prove how powerful this is, I asked an AI agent to browse the available MCP tools on Spike Land and dream up 100 different apps that could be built *today*, just by combining those tools. 

Here is what it came up with.

---

## 🚀 100 App Ideas Using Spike Land MCPs

This list shows what happens when your backend is made of reusable AI tools. 

### 🤖 Category 1: AI Content & Marketing
*Tools used: brand-brain, relay, image, page-ai, creative*

1.  **BrandVoice AI**: Analyze a website''s tone and generate matching social media posts.
2.  **MetaMagic**: Automatically optimize SEO tags for any URL using AI.
3.  **Creative Swarm**: Brainstorm 50 landing page headers in seconds using multiple AI agents.
4.  **AutoPost Maverick**: Schedule AI-generated social drafts across multiple platforms.
5.  **Pitch Perfect**: Practice sales pitches with an AI coach that knows your company data.
6.  **Asset Genie**: An intelligent asset manager that catalogs and upscales images.
7.  **Newsletter Nexus**: Automate newsletter generation and subscriber management.
8.  **Pulse Monitor**: Track competitor mentions across the web and alert your team.
9.  **WhiteLabel Landing**: A branded landing page builder for marketing agencies.
10. **Ad Allocator**: A dashboard to track and optimize ad spend across campaigns.

### 🎮 Category 2: Gaming & Social Platforms
*Tools used: chess-*, arena, social-accounts, chat, blog*

11. **Grandmaster Arena**: A high-stakes chess tournament platform with global ranking.
12. **Social Streamer**: Real-time community platform with integrated chat.
13. **Vibe Check**: Aggregate social feeds and measure the "vibe" of your community.
14. **Chess Replay Studio**: Analyze and annotate historic chess games.
15. **Challenge Me**: A 1v1 social betting platform for tabletop games.
16. **Niche Blog Network**: A multi-site blog manager with AI-assisted writing.
17. **Skill Sync Arena**: Gamified platform where users share AI skills.
18. **Interactive Storyteller**: A platform for branching narratives generated on-the-fly.
19. **Community Inbox**: A shared communication hub for open-source contributors.
20. **Trophy Room**: A gallery showing off gaming achievements.

### 💼 Category 3: E-commerce & Business Tools
*Tools used: merch, billing, ab-testing, allocator, credits*

21. **Merch Maven**: Build a custom storefront for physical products in minutes.
22. **Billing Buddy**: Simple subscription tracker and invoice generator for freelancers.
23. **A/B Test Center**: Manage landing page experiments with real-time data.
24. **Credit Ledger**: An internal currency system for platform micro-transactions.
25. **Scout Intelligence**: A competitor research tool using automated web search.
26. **Report Automator**: Weekly PDF business reporting generated automatically.
27. **Gateway Payments**: Middleware for handling various payment providers.
28. **Customer Pulse**: Track customer health and churn risk.
29. **Inventory Assets**: Manage digital and physical stock tracking.
30. **Loyalty Swarm**: Use agents to engage and reward high-value customers.

![A collage grid showing 4 distinct app mockups floating in 3D space, showing the variety of applications](https://placehold.co/600x300)

### 🛠️ Category 4: Developer Tools & QA
*Tools used: qa-studio, codespace, state-machine, tool-factory*

31. **QA Studio Pro**: Advanced UI for recording end-to-end browser tests.
32. **State Visualizer**: Drag-and-drop builder for complex state machines.
33. **Tool Factory**: Dynamically generate and test NEW MCP tools.
34. **Codespace Lite**: High-performance web IDE for rapid prototyping.
35. **Repo Explain AI**: Instantly document any repository using deep code analysis.
36. **GitHub Admin**: Manage repository settings from a unified dashboard.
37. **Audit Inspector**: Transparency tool for logging system events.
38. **Sandbox Runner**: Securely execute untrusted code in isolation.
39. **Pipeline View**: Graphical monitor for CI/CD pipelines.
40. **Architecture Central**: Manage AI system prompts for complex apps.

### ⏱️ Category 5: Productivity & Life Management
*Tools used: clean-*, calendar, reminders, inbox*

41. **Clean Sweep**: A gamified household chore management app.
42. **Calendar Commander**: AI-first scheduling assistant.
43. **Reminder Engine**: Centralized notification hub for life events.
44. **Habit Streaks**: Track daily wins and build habits.
45. **Inbox Zero AI**: Automatically draft replies for emails.
46. **Decision Log**: Track your life decisions and their outcomes over time.
47. **Vault Manager**: Secure storage for sensitive documents.
48. **Workspace Switcher**: Switch between project-specific files instantly.
49. **Motivation Bot**: Daily nudges for personal goals.
50. **Photo Clean**: Detect and delete duplicate photos.

### 🏢 Category 6: Agency & Automation
*Tools used: agency, agent-management, workflows, jules*

51. **Agency OS**: Comprehensive management suite for creative agencies.
52. **Workflow Designer**: Visual builder for complex business processes.
53. **Agent Swarm Lab**: Experiment with multi-agent coordination.
54. **Jules Dash**: A custom web interface for AI coding agents.
55. **Autonomous Blogger**: A bot that researches and publishes content.
56. **Skill Sync Hub**: Coordinate AI skill deployments across teams.
57. **Telemetry Dashboard**: Monitor AI agent performance.
58. **Capability Hub**: Track AI capabilities across your organization.
59. **Policy Guard**: Enforce AI safety guidelines.
60. **Bootstrapper**: Rapidly spin up new projects.

### 📊 Category 7: Data & Insights
*Tools used: scout, reports, tracking, pulse*

61. **Industry Pulse**: Tracking market shifts and competitor news.
62. **Behavioral Analytics**: Deep analysis of user interaction patterns.
63. **Auto-Report**: Professional summary reports for stakeholders.
64. **Sentry Unified**: Consolidate error tracking from multiple projects.
65. **Deployment Tracker**: Monitor server deployment status.
66. **Gateway Latency**: Monitor API performance.
67. **Env Manager**: Securely manage environment variables.
68. **FileSystem Web**: A web file explorer for your servers.
69. **Crisis Command**: Incident management platform.
70. **Audit Forensic**: Investigate security events.

### 🎓 Category 8: Education & Career
*Tools used: learnit, career, bazdmeg-faq*

71. **LearnIt Academy**: Build and sell online courses.
72. **Career Path AI**: Map out your long-term career progression.
73. **Instant FAQ**: Generate support documentation from chat logs.
74. **Interview Master**: Simulate job interviews with an AI.
75. **Skill Marketplace**: Buy and sell specialized AI configurations.
76. **Knowledge Base**: Private company wiki.
77. **Study Buddy**: AI assistant that helps you study.
78. **Portfolio Gen**: Create a professional portfolio site automatically.
79. **Resume Matcher**: Check how your resume matches a job description.
80. **Certificate Vault**: Securely issue digital credentials.

### 🎵 Category 9: Utility & Media
*Tools used: audio, album-*, image, batch-enhance*

81. **Audio Studio**: Multi-track web-based audio editor.
82. **Pod-Script**: Convert long articles into podcasts.
83. **Meme Factory**: Generate viral social media images via prompt.
84. **Album Organizer**: Smart categorization for massive image libraries.
85. **Batch Up**: Upscale folders of images in the background.
86. **Quick Share**: Fast file sharing with expiring links.
87. **Layout Studio**: Visual CSS grid experimentation tool.
88. **Job Monitor**: Track status of media processing jobs.
89. **Memory Lane**: Rediscover photos with AI-generated stories.
90. **Soundboard**: Create custom sound effects.

### 🦄 Category 10: Specialized Tools
*Tools used: bazdmeg-gates, bazdmeg-memory, orchestrator*

91.  **Gatekeeper**: Advanced access control for internal tools.
92.  **Persistent Memory**: A cross-app "memory" store for AI assistants.
93.  **Orchestra Dash**: Control panel for massive data processing jobs.
94.  **Meta Search**: Search across multiple cloud providers at once.
95.  **Agent Health**: "Sanity checks" for running agents.
96.  **Permissions Dashboard**: Access level management for teams.
97.  **Store Experimenter**: A/B testing for mobile app store listings.
98.  **Telemetry Graphs**: Beautiful data visualizations.
99.  **Bootcamp Plan**: Personalized learning schedules.
100. **Spike Hub**: A meta-app to manage all of your other apps!

---

## 🛠️ The "How-To" Deep Dive

Why is this approach so incredibly fast? 

In traditional full-stack development, you spend 80% of your time writing "glue code." You have to figure out how to connect the database to the API, the API to the frontend, and handle the state in between.

With Spike Land MCPs, **the glue is already handled**. Every tool listed above is a stateless, discoverable function. When you describe an app to our AI builder, it’s not writing database connections from scratch; it’s simply stringing together existing, hardened protocols.

For example, when building **Grandmaster Arena**, the AI doesn''t need to know the complex math to calculate a chess ELO rating. It just knows it needs to call our existing `chess-player` MCP tool. 

This is the future of development for junior and senior engineers alike. Less typing boilerplate code, more building awesome products. 

What will you build today?', unixepoch());

INSERT OR REPLACE INTO blog_posts (slug, title, description, primer, date, author, category, tags, featured, hero_image, content, updated_at)
VALUES ('a-chemist-walked-into-a-codebase', 'A Chemist Walked Into a Codebase', 'How a chemist with no coding experience built a flawless coaching platform by writing business logic as MCP servers first — and what that means for the future of software.', 'Zero coding experience. Flawless coaching platform. MCP-first.', '2026-02-16', 'Zoltan Erdos', 'Developer Experience', '["mcp","vibe-coding","bazdmeg","agents","architecture","beginners"]', 1, '/blog/a-chemist-walked-into-a-codebase/hero.png', '## The Phone Call

Gianluca sent me a video. 

No context. No preamble. Just a screen recording of a coaching platform doing exactly what it was supposed to do. Calendar bookings flowed smoothly into a database. Different coaching frameworks loaded dynamically based on what kind of session it was. An AI chat assistant remembered the client''s past history. Multiple backend systems were talking to each other without a single error.

I stared at it for a full minute before responding.

Gianluca Lopez is a chemist. He doesn''t write code professionally. His background is in molecular structures and lab work. He has been teaching himself programming for years, trying to understand how web applications work, but he''s never had a software engineering job. No professional team experience. No shipped products.

And yet, he had just built something that would normally take a team of senior full-stack developers weeks to deliver. 

It worked flawlessly. On the first real test.

## The Wrong Abstraction

If you''re a junior developer, you probably start a project like this:
You pick a framework (like React or Next.js). You set up your files and folders. You start building from the inside out: writing components, setting up routes, and figuring out state management. 

Gianluca didn''t do any of that. 

He couldn''t. He didn''t have the mental model of a traditional software engineer. When you''ve spent your career thinking about chemical reactions, you don''t think in terms of React components. You think in terms of what a system *does*.

He knew the app needed to:
- Book sessions.
- Track coaching frameworks.
- Have an AI chat that remembers context.
- Manage client progress.

These aren''t technical details. They are business capabilities described in plain English. 

![A diagram showing traditional app development vs MCP-first development, comparing writing components inside out versus defining capabilities first](https://placehold.co/600x300)

Instead of building a React app that calls APIs, he built what we call **MCP (Model Context Protocol) servers**. These are essentially little tools that describe what the app can do. Then, he just wrapped a user interface around them.

The "wrong" way to build software turned out to be the perfect approach for working with AI agents.

## MCP-First Development

The core idea is simple: **your business logic IS your MCP server**.

When you write your app''s capabilities as tools first—with clear inputs, outputs, and plain-language descriptions—something amazing happens: AI coding assistants (like Claude Code) can actually *use* your business logic while they help you build the app.

Think about what that means.

Normally, if an AI agent is building your frontend, it has to guess what your backend API returns. It writes a component, you run it, it crashes because the API returned something different, and the AI has to try again.

In the MCP-first approach, the agent literally calls your tool while it''s planning the code. It sees the exact response. It knows exactly what data it''s working with before it writes a single line of frontend code.

<Callout type="info">
When an AI agent tests the tools it depends on during the planning phase, you get three things: faster development, more tests, and fewer bugs. The agent naturally tests everything as it explores.
</Callout>

Spike Land exposes these MCPs directly. The same tools the AI uses to help you build the app become the actual production API. There’s no fake mock data, and no outdated API documentation. There is one single source of truth for your app''s logic.

## What Gianluca Actually Built

He built a coaching platform. It sounds simple, but it’s incredibly complex.

It handles calendar availability, time zones, and cancellations. It dynamically loads different coaching methods. The AI chat remembers what was discussed in past sessions. Client progress is tracked over time.

![A complex state machine diagram showing bookings, chat context, and frameworks connected by glowing lines](https://placehold.co/600x300)

Normally, getting all these features to work together is a nightmare. A booking affects the calendar, which affects the chat context, which updates the client''s progress. 

Gianluca built it all using Spike Land''s infrastructure. He told the agents what capabilities he wanted (his MCP tools), and the agents built the application around them. 

The result? 100% code coverage. Not because someone forced him to write tests, but because the AI naturally wrote tests to figure out how his tools worked before building the UI.

## Stop Thinking in Code

Gianluca''s lack of professional coding experience was his superpower. He didn''t have bad habits. He didn''t try to over-engineer a complex React architecture. He just thought clearly about what the app needed to do.

This is the most valuable skill for any developer today, especially juniors. The future of software isn''t about memorizing syntax or wrestling with build tools. It''s about clearly understanding a problem and describing the solution so well that an AI can build it for you.

*Zoltan Erdos is a developer based in Brighton, UK, building [spike.land](https://spike.land). He believes the best developers will be the ones who never learned to think in code.*', unixepoch());

INSERT OR REPLACE INTO blog_posts (slug, title, description, primer, date, author, category, tags, featured, hero_image, content, updated_at)
VALUES ('docker-layers-are-just-like-llm-context-caching', 'Docker Layers Are Just Like LLM Context Caching', 'A beginner''s guide to understanding how Docker layer caching and LLM prompt caching work identically, and how to optimize both.', 'Same caching logic. Different machines. One mental model.', '2026-02-15', 'Zoltan Erdos', 'Developer Experience', '["docker","llm","caching","developer-experience","devops","context-engineering","performance"]', 0, '/blog/docker-layers-are-just-like-llm-context-caching/hero.png', '<Tldr>

- Docker containers and AI Large Language Models (LLMs) both use "sequential caching" to save time and money.
- In both systems, if you change something early on, everything after it has to be completely rebuilt or recomputed.
- The golden rule for both: Put stable, unchanging things at the top. Put frequently changing things at the bottom.
- Understanding this makes you better at writing Dockerfiles and better at talking to AI.

</Tldr>

## The Hidden Similarity

If you are a junior developer learning how to deploy apps with Docker, and also learning how to prompt AI models, you might think these are two completely unrelated skills. 

But last week, while I was trying to make our Docker builds run faster, I realized something mind-blowing: **Docker and AI prompts use the exact same logic for caching.**

Let''s break down what "caching" means here. Caching is just a way for a computer to save the results of a hard task, so it doesn''t have to do it again next time.

**Docker Layer Cache:** When Docker builds an image, it reads your `Dockerfile` line by line. Every line creates a "layer." If you change line 3, Docker has to rebuild line 3, and line 4, and line 5, and everything after it. It throws away all the saved work below the change.

**LLM Prompt Cache:** When you send a long prompt to an AI, the AI reads it token by token (word by word) and saves the math calculations (the "cache") as it goes. If you change a sentence in the middle of your prompt, the AI throws away all the saved calculations after that point and has to recalculate everything.

Both systems are like a stack of blocks. You can''t pull out a block from the middle without knocking over everything above it.

---

## The Classic Mistake

Because both systems work this way, they share the exact same golden rule: **Put stable things first, and volatile (changing) things last.**

![An illustration comparing a Dockerfile with good layer ordering to a well-structured AI Prompt with the system prompt first](https://placehold.co/600x300)

### Docker: The Bad Way
Look at this common Dockerfile mistake:

```dockerfile
# BAD DOCKERFILE
COPY . .          # Copies all your code
RUN npm install   # Installs your dependencies
RUN npm run build # Builds your app
```

What''s wrong here? Your code changes all the time. Every time you change a single line of CSS, Docker sees that `COPY . .` changed. Because of that, it throws away the cache for `npm install` and downloads all your packages from the internet again, taking minutes.

### AI Prompts: The Bad Way
Now look at this AI prompt mistake:

```text
User: Here is my brand new code: {code_that_changes_every_time}
User: Please review it using these 5 pages of company guidelines: {guidelines_that_never_change}
```

The guidelines never change. But because you put the constantly changing code *before* the guidelines, the AI is forced to re-read and recalculate the math for those 5 pages of guidelines every single time you ask a question. This makes the AI slower and costs you more API money.

---

## How to Fix It

The fix is identical for both! Move the stable stuff up.

### Docker: The Good Way
```dockerfile
# GOOD DOCKERFILE
COPY package.json ./   # Just copy the package list first (rarely changes)
RUN npm install        # Install packages (gets cached!)
COPY . .               # NOW copy your changing code
RUN npm run build      # Build the app
```

Now, unless you add a new library, `npm install` is cached instantly. Docker skips right to building your code.

### AI Prompts: The Good Way
```text
System: You are a reviewer. Use these 5 pages of guidelines: {guidelines_that_never_change}
User: Here is my brand new code: {code_that_changes_every_time}
```

Now, the AI caches the massive guidelines perfectly. When you send new code, it only has to think about the new code, saving you time and money.

## Why This Matters

As you grow in your career, you''ll start to notice that computer science is full of these repeating patterns. 

Whether you are trying to make an AI agent respond instantly, or trying to get your application to deploy to the cloud faster, the mental model is exactly the same: protect your expensive work by caching it early, and isolate your frequent changes to the very end.

Mastering this simple concept will make you a much more efficient engineer across the entire tech stack.', unixepoch());

INSERT OR REPLACE INTO blog_posts (slug, title, description, primer, date, author, category, tags, featured, hero_image, content, updated_at)
VALUES ('it-feels-like-cheating', 'It Feels Like Cheating (Because It Is)', 'How I deleted my E2E tests, rebuilt my API in two days, and stopped pretending code is precious. The BAZDMEG Method''s radical conclusion: code is disposable.', 'When automation feels wrong, you cut the wrong thing.', '2026-02-15', 'Zoltan Erdos', 'Developer Experience', '["testing","mcp","bazdmeg","architecture","agents","ci-cd","philosophy"]', 1, '/blog/it-feels-like-cheating/hero.png', '## The Confession

I need to tell you something.

Every morning I sit down with my coffee. I open Claude Code. I give it the
requirements for a feature. Twenty minutes later the feature exists. Tests pass.
CI is green. I ship it.

Then I close the laptop and take my dog for a walk and the whole time I am
thinking the same thing. I cheated. That was not real work. I skipped something.
Somebody is going to find out.

I have been feeling this way for months. The guilt shows up every time something
works on the first try. Every time I ship before lunch. Every time I look at my
commit history and see twelve features in a day and think, there is no way this
is legitimate.

It got worse. I started downplaying it. "Oh, this feature was simple." It was
not simple. It had auth flows, database migrations, edge case handling, and a
full test suite. But because I did not suffer building it, I could not accept
that it was real.

I thought the feeling would go away. It did not. So I started paying attention
to it.

The feeling has a name. It is called a paradigm shift arriving before the
culture is ready. When something feels too easy, it is not because you are
cheating. It is because you eliminated a category of work that used to be hard.
The guilt is your old identity protesting. Your brain is comparing your output
against the amount of suffering it expects, and the numbers do not match.

I am going to tell you what I did in two days that made the feeling permanent.

## The Two-Day Delete

Here is what happened.

I looked at my E2E test suite. Playwright tests. Dozens of them. Selectors
waiting to break. Browser instances spinning up and down. Tests that took four
minutes to run and flaked on Tuesdays for no reason anyone could explain.

I had a test that clicked a button, waited for a modal, filled in three fields,
clicked submit, waited for a toast notification, and then checked a database
value. The test was sixty lines long. Fifty-five of those lines were about the
browser. Five were about the business logic. The ratio was insane.

Then I looked at my business logic. Validation rules. State transitions.
Authorization checks. Contract enforcement. The stuff that actually matters. The
five lines buried inside sixty lines of browser ceremony.

I asked myself: what if I just tested the five lines?

I moved all of it into MCP tools.

Every piece of business logic became an MCP tool with a typed Zod schema, a
handler function, and a structured response. Input validated. Output typed.
Contract enforced.

Then I deleted the E2E tests.

All of them.

I replaced them with MCP tool tests that run in milliseconds. Not seconds.
Milliseconds. No browser. No DOM. No network. No animation timing. No selectors
that break when someone changes a CSS class.

One hundred percent coverage on business logic. Less than forty-eight hours.

Here is the key insight that made it all click. The same MCP handler that my
React components call in production is the same handler my tests validate. Not a
mock. Not a copy. Not an approximation. The exact same function. The exact same
Zod schema. The exact same contract.

One source of truth. Two consumers. Production and tests share the same
interface.

I sat there staring at my screen. I had spent weeks writing Playwright tests
that tested the browser''s ability to click buttons. The actual business logic —
the part that mattered — was tested as a side effect. An afterthought. I had
been testing the frame instead of the painting.

When I realized that, I said a word in Hungarian that I will not translate here.

## The Hourglass

The testing pyramid was always the wrong shape.

The pyramid says: lots of unit tests at the bottom, some integration tests in
the middle, a few E2E tests at the top. This made sense when humans wrote every
line and code was expensive to produce.

AI changed the economics.

The right shape is an hourglass.

```
         +---------------------+
         |   E2E Specs (heavy)  |  <-- Humans write these
         |   User flows as       |
         |   Given/When/Then     |
         +----------+-----------+
                    |
            +-------v-------+
            |  UI Code       |  <-- AI generates this
            |  (thin,        |    Disposable.
            |   disposable)  |    Regenerate, don''t fix.
            +-------+-------+
                    |
    +---------------v---------------+
    |  Business Logic Tests (heavy)  |  <-- MCP tools + unit tests
    |  Validation, contracts, state   |    Bulletproof.
    |  transitions, edge cases        |    Never skip.
    +-------------------------------+
```

<HourglassModelDemo />

Heavy on top. Heavy on bottom. Thin and disposable in the middle.

The top is E2E specs. Humans write these. Given the user is logged in, when they
click checkout, then the order is placed. These describe what should happen. They
are requirements in executable form.

The bottom is MCP tool tests. Business logic. Validation rules. State
transitions. Authorization. Contract enforcement. These prove the system works.
They run in milliseconds. They never flake.

The middle is UI code. AI generates this. It is disposable. If a component
breaks, you do not debug it. You regenerate it. Delete. Print again.

Seventy percent MCP tool tests. Twenty percent E2E specs. Ten percent UI
component tests. That is the split.

The middle is disposable because if you know *why* the code exists (top) and you
can *prove* it works (bottom), the code itself is just a printout. A rendering.
An artifact. It has no intrinsic value. The value lives in the requirements and
the tests.

## The Triple-Duty Interface

The MCP tools do not just serve two masters. They serve three.

**Production API.** React components call them. The UI calls `file_guard` to
check changes. It calls the auth tools to verify sessions. It calls the business
logic tools to process user actions. These are the production endpoints.

**Test harness.** Vitest validates them. Every tool has typed input and output.
Every schema is enforced. Every edge case is covered. The tests run against the
exact same code path that production uses. Not a mock. Not a stub. The real
thing.

**Agent dev tools.** Claude Code uses them during development. The agent can call
`file_guard` to pre-check a file change before committing. It can run the exact
MCP tool it just built to verify the output matches the schema. It can explore
database state. It can check auth flows. It can validate business rules. All
through the same interface the production app uses.

This is why Claude Code goes three to five times faster on this codebase.

The agent is not writing code blindly and hoping CI catches mistakes twenty
minutes later. It has surgical instruments. It can test its own work in real
time. It can verify a business rule works before it writes the component that
calls it. It can validate an auth flow before it builds the page that depends on
it.

It is like giving a surgeon an MRI machine in the operating room instead of
making them wait for results next Tuesday.

When the tools serve three purposes simultaneously, you do not have three
codebases to maintain. You have one. And that one codebase is the simplest
version of the system, because every tool is just a function with a typed schema
and a handler. No framework overhead. No ceremony.

## The Infinitely Fast CI Server

Someone told me once: "You get an infinitely fast CI server." I did not
understand what they meant at the time. Now I do.

Think about what happens when CI is slow.

When CI takes thirty minutes, your bug has already compounded. By the time you
learn about it, you have built three more features on top of broken foundations.
Now you are doing archaeology. Which of these forty-seven commits broke it? Was
it this one? No. This one? Maybe. This one? Ah. It was actually two commits
interacting in a way nobody predicted.

When CI takes ten seconds, the nail touches the tire and you hear it
immediately. No compounding. No archaeology. No "which commit broke it." You
know exactly what you just changed. You fix it and move on.

The ten-second rule changes everything.

If your CI pipeline runs in under ten seconds, skip branches entirely. Commit
directly to main. Trunk-based development. The same pattern Google and Meta use,
but instead of a thousand engineers making it work, you have a fast test suite
making it work.

The math is simple. Fifty commits a day at five seconds each is four minutes of
waiting. Branching overhead at five minutes per change is two hundred fifty
minutes of ceremony. Four minutes versus four hours. The choice is not a choice.

And here is the part that connects back to the hourglass. MCP tool tests are
what make ten-second CI possible. You cannot get ten-second CI if your tests
spin up browsers. You cannot get ten-second CI if your tests make network calls.
You can get ten-second CI if your tests call a function, validate the output,
and move on.

The hourglass makes the speed possible. The speed makes trunk-based development
possible. Trunk-based development makes rapid iteration possible. Rapid
iteration makes AI development possible. It all connects. Pull one piece out and
the whole thing slows down. Put them all together and you get something that
feels like cheating.

## Why It Feels Like Cheating

Every paradigm shift in the history of programming felt like cheating when it
arrived.

<ParadigmGuiltTimeline />

Garbage collection. "You mean I do not manage memory anymore? That is not real
programming." Millions of developers felt guilty about not calling `free()`.
Then they shipped faster and the guilt went away.

ORMs. "You mean I do not write SQL anymore? That is dangerous." Developers felt
guilty about letting a framework write their queries. Then they shipped faster
and the guilt went away.

CI/CD. "You mean I do not deploy manually anymore? What if something goes
wrong?" Developers felt guilty about automated deployments. Then they shipped
faster and the guilt went away.

Now it is code itself. "You mean I do not write the code anymore?"

Yes. That is what I mean.

And yes, the feeling is the same. The exact same cocktail of guilt and
exhilaration. The exact same voice in your head saying this cannot be right,
this is too easy, I must be missing something.

You are not missing something. You are gaining something. You are gaining back
all the time you used to spend on work that was never the point.

The guilt is the signal. When something feels too easy, it is because you
eliminated a category of work that was never the point. Memory management was
never the point. SQL was never the point. Deployment was never the point.

Code was never the point.

Requirements are the product. Code is
just the current rendering of those requirements. A printout. An artifact. If
you can regenerate it in twenty minutes from clear requirements and proven tests,
what exactly were you protecting?

The answer is: your identity. The idea that your value comes from the code you
write. That the act of typing is the act of creating. That the artifact is the
art.

It is not. The art is knowing what to build. The art is understanding the
problem so deeply that you can describe it precisely enough for a machine to
build it correctly on the first try. That is harder than coding. Much harder.

Try it. Sit down and describe a feature so precisely that an AI builds it
perfectly on the first attempt. No ambiguity. No assumptions. Every edge case
documented. Every failure mode specified. Every interaction defined.

You will discover that writing requirements at this level of precision is the
hardest thing you have ever done as a developer. Harder than any algorithm.
Harder than any architecture decision. Because it requires you to actually
understand the problem completely, not just well enough to start typing.

## The Name

Bazdmeg is Hungarian. I am not going to translate it.

If you know, you know. If you do not know, ask a Hungarian friend. Watch their
face. That is the appropriate reaction to realizing that the code you spent
twenty years learning to write is the least important part of what you build.

I named the methodology after an expletive because the irreverence is the point.
If your methodology has a polite name, you are still pretending. You are still
treating code like something sacred. It is not sacred. It is disposable.

Every serious methodology in software has a serious name. Agile. Scrum. Extreme
Programming. Lean. They all sound like they belong in a consulting slide deck.
They are designed to make managers comfortable.

The BAZDMEG Method is not designed to make anyone comfortable. It is designed to
make you confront the thing you do not want to confront: your code does not
matter. Your tests matter. Your requirements matter. Your understanding of the
problem matters. The code is a byproduct.

Seven principles. Born from pain. Tested in production.

1. Requirements are the product.
2. Discipline before automation.
3. Context is architecture.
4. Test the lies.
5. Orchestrate, do not operate.
6. Trust is earned in PRs.
7. Own what you ship.

That is the whole method in one breath. Each one earned the hard way. Each one a
response to a specific failure I experienced, documented, and swore I would
never repeat.

The details are documented. The checklists exist. The workflow is repeatable.
But the spirit is in the name. Say it out loud. If it makes you uncomfortable,
good. That discomfort is the sound of a sacred cow dying.

## The Uncomfortable Question

If I can delete my codebase and rebuild it in twenty minutes, what exactly was I
protecting all those years?

Not the code. That is disposable. I just proved it.

Not the tests. Those still exist and they are stronger than ever. Milliseconds
instead of minutes. One hundred percent coverage instead of whatever-we-could-get.

Not the requirements. Those are documented. Clear acceptance criteria. Typed
schemas. Executable specs.

I was protecting my ego.

The idea that my value comes from the code I write. That the hours spent
debugging are a badge of honor. That the complexity I can hold in my head makes
me special. That suffering is proof of seriousness.

It does not. None of it does.

What makes me valuable is understanding problems. Describing solutions
precisely. Building systems where AI can do the heavy lifting while I do the
thinking. Knowing what to build, why to build it, and how to prove it works.

The code? The code is a printout. Regenerate it. Delete it. Print it again. It
does not care. It has no feelings. It has no memory of how hard it was to write.
It just runs or it does not.

Let go of that, and it stops feeling like cheating.

It starts feeling like clarity.

And clarity, it turns out, is the most productive state I have ever worked in.

---

*Zoltan Erdos is a developer based in Brighton, UK, building
[spike.land](https://spike.land). He named his methodology after a Hungarian
expletive because he believes in honesty.*', unixepoch());

INSERT OR REPLACE INTO blog_posts (slug, title, description, primer, date, author, category, tags, featured, hero_image, content, updated_at)
VALUES ('the-testing-pyramid-is-upside-down', 'The Testing Pyramid Is Upside Down', 'What if the worst part of your test suite — the slow, flaky E2E tests — could run at unit test speed? MCPs might be the answer nobody expected.', 'E2E tests at unit speed. MCPs made it possible.', '2026-02-13', 'Zoltan Erdos', 'Developer Experience', '["testing","mcp","unit-testing","e2e","architecture","agents"]', 1, '/blog/the-testing-pyramid-is-upside-down/hero.png', '*Dedicated to the memory of László Merklik (1975–2018), who left us far too soon. He was in his early forties when cancer took him. As co-founder and CPO of Emarsys — later acquired by SAP — he built one of Hungary''s most respected engineering cultures. He even gave a talk called "Better Quality Without Testers," which feels like a direct ancestor of the ideas in this article.*

*László was the person who made me care about coding. Not just doing it — caring about it. He taught me that there is a special relationship between a unit test and the code it tests: when both are written properly, one specifies the other. The test tells you what the code should do. The code tells you what the test should verify. They are two views of the same truth.*

*He was the kind of developer who made everyone around him better. The kind who would stay after the talks to help a junior fix their build. The kind who believed that writing software well was a form of respect — for your teammates, for your users, for yourself. This article is about pushing the craft forward. That was his thing too.*

---

## The Conference

About fifteen years ago, I went to a developer conference in Budapest. The topic was Jasmine — which ran in the browser, since Node.js itself wasn''t widely adopted yet. This was before Jest had eaten the world, before testing was a given on every project. Testing was still something you had to argue for.

The presenter was young. Nervous energy. He had clearly been converted recently — you could see it in his eyes. He walked us through how a few dozen unit tests had caught a regression that would have shipped to production. He showed how mocking worked. He showed how fast the feedback loop was. He was practically vibrating.

Then someone in the audience raised their hand.

"Es hogy teszteljük le az UI-t?" the person asked — *"And how do we test the UI?"*

The presenter paused. Then he shrugged.

"Az UI-t? Azt teszteljék a hülyék!" — *"The UI? Let the idiots test that!"*

A few people laughed. Most nodded. It seemed reasonable at the time. The unit tests covered the business logic. The UI was just HTML and CSS. You look at it, it either looks right or it does not. What is there to automate?

That answer stayed with me for a long time. Not because it was wrong. Because it was almost right — and the gap between almost right and actually right would cost our industry a decade of pain.

---

## What Happened Next

We did start testing UI. Of course we did.

First came Selenium. Then Protractor. Then Cypress. Then Playwright. Each one better than the last. Each one promising to finally make browser testing reliable.

And they did get better. Playwright in particular is a genuinely excellent tool. But the fundamental problem never went away: you are controlling a real browser, rendering real DOM, waiting for real network requests, and hoping that the timing works out. You are testing through the thickest, most unpredictable layer of your entire stack.

These tests became the worst part of every test suite I have ever worked on.

They are slow. A fast unit test suite runs in seconds. A comprehensive E2E suite runs in minutes — sometimes tens of minutes. On CI, with parallelization and retries, you are looking at pipeline times that make developers context-switch to something else while they wait.

They are flaky. Not because the tools are bad, but because browsers are complex state machines. A test that passes locally fails on CI because the animation took 50ms longer. A test that ran fine yesterday fails today because a third-party script loaded slower. You add `waitForSelector`. You add `waitForTimeout`. You add retry logic. You are not testing your application anymore — you are testing your ability to synchronize with chaos.

They are brittle. Change a CSS class? Tests break. Move a button from the left sidebar to the top nav? Tests break. Refactor a component that behaves identically but renders differently? Tests break. The tests are coupled to the implementation in exactly the way we tell junior developers not to write unit tests.

This is the testing pyramid. Unit tests at the base: fast, cheap, many. Integration tests in the middle: moderate speed, moderate cost, moderate count. E2E tests at the top: slow, expensive, few.

<PyramidReshapeDemo />

Everyone knows the top of the pyramid is painful. We accepted it as the cost of doing business. You need *some* E2E tests because that is the only way to verify the full user flow. API tests are not enough — they test endpoints, not the business logic flows that string those endpoints together into something a user actually does.

Or so we thought.

---

## The Insight

Here is the thing about E2E tests that nobody talks about clearly enough: most of them are not really testing the browser. They are testing business logic *through* the browser.

Think about what a typical E2E test actually verifies. "User logs in, navigates to settings, changes their email, confirms the change, sees the updated email on the profile page." What are you really testing here? You are testing that the email change flow works. The login, the navigation, the form submission, the confirmation, the state update — that is all business logic. The browser is just the delivery mechanism.

This is not a new observation. Alistair Cockburn''s hexagonal architecture (2005) argued that applications should be equally drivable by users, programs, and test scripts. Martin Fowler named the pattern "subcutaneous testing" — testing just below the UI. Robert C. Martin''s Clean Architecture insisted that business rules must be testable without any UI at all. The insight was always there. What was missing was a standardized interface that made it practical at scale.

MCP — Model Context Protocol — is that interface. It is a standard for exposing your application''s capabilities as structured tools. Text in, text out. An agent sends a request describing what it wants to do, your MCP server executes the action and returns the result. No browser. No DOM. No CSS selectors. No timing issues. If you write your user stories as MCP tools, you have created a testable contract for your business logic.

Let me show you what I mean.

Say you have a user story: "A user can update their email address." In the E2E world, the test looks something like this:

```typescript
// Cypress E2E test
describe(''Email update flow'', () => {
  it(''should allow user to change their email'', () => {
    cy.login(''test@example.com'', ''password123'');
    cy.visit(''/settings'');
    cy.get(''[data-testid="email-input"]'').clear().type(''new@example.com'');
    cy.get(''[data-testid="save-button"]'').click();
    cy.get(''[data-testid="confirm-dialog"]'').should(''be.visible'');
    cy.get(''[data-testid="confirm-button"]'').click();
    cy.get(''[data-testid="success-toast"]'').should(''contain'', ''Email updated'');
    cy.visit(''/profile'');
    cy.get(''[data-testid="user-email"]'').should(''contain'', ''new@example.com'');
  });
});
```

This test takes 5-15 seconds to run. It depends on CSS selectors, DOM structure, animation timing, and network latency. Change the confirm dialog to a modal? Test breaks. Move the success message from a toast to an inline alert? Test breaks.

Now here is the same business logic exposed as an MCP tool:

```typescript
// MCP tool definition
const updateEmailTool = {
  name: ''update_user_email'',
  description: ''Update the authenticated user\''s email address'',
  inputSchema: {
    type: ''object'',
    properties: {
      newEmail: { type: ''string'', format: ''email'' },
      confirmChange: { type: ''boolean'' },
    },
    required: [''newEmail'', ''confirmChange''],
  },
  handler: async ({ newEmail, confirmChange }, context) => {
    const user = await context.getAuthenticatedUser();
    if (!user) return { error: ''Not authenticated'' };

    if (!confirmChange) {
      return {
        status: ''confirmation_required'',
        message: `Confirm email change from ${user.email} to ${newEmail}?`,
      };
    }

    await context.userService.updateEmail(user.id, newEmail);
    return {
      status: ''success'',
      message: `Email updated to ${newEmail}`,
      updatedEmail: newEmail,
    };
  },
};
```

And the unit test:

```typescript
// Unit test for the MCP tool
describe(''update_user_email'', () => {
  it(''should update email when confirmed'', async () => {
    const context = createMockContext({
      user: { id: ''1'', email: ''old@example.com'' },
    });

    const result = await updateEmailTool.handler(
      { newEmail: ''new@example.com'', confirmChange: true },
      context,
    );

    expect(result.status).toBe(''success'');
    expect(result.updatedEmail).toBe(''new@example.com'');
    expect(context.userService.updateEmail).toHaveBeenCalledWith(
      ''1'',
      ''new@example.com'',
    );
  });

  it(''should require confirmation before updating'', async () => {
    const context = createMockContext({
      user: { id: ''1'', email: ''old@example.com'' },
    });

    const result = await updateEmailTool.handler(
      { newEmail: ''new@example.com'', confirmChange: false },
      context,
    );

    expect(result.status).toBe(''confirmation_required'');
    expect(context.userService.updateEmail).not.toHaveBeenCalled();
  });

  it(''should reject unauthenticated requests'', async () => {
    const context = createMockContext({ user: null });

    const result = await updateEmailTool.handler(
      { newEmail: ''new@example.com'', confirmChange: true },
      context,
    );

    expect(result.error).toBe(''Not authenticated'');
  });
});
```

This test runs in milliseconds. It does not depend on any DOM structure. It does not care what the UI looks like. It tests the exact same business logic — the email update flow with confirmation — but at unit test speed, with unit test reliability.

You have not lost any coverage. You have lost the browser.

---

## The Architecture Argument

This is not just a testing trick. It is an architectural shift.

When you expose your user stories as MCP tools, you create a chain:

**User stories → MCP tools → Unit-testable business logic**

The same spec serves three purposes simultaneously:

1. **User documentation.** The MCP tool descriptions *are* your feature documentation. "Update the authenticated user''s email address" — that is the spec, written in plain language, living in the code.

2. **Agent interface.** Any AI agent that connects via MCP can now execute your user stories. Your app is agent-ready not because you bolted on an AI feature, but because your business logic is accessible through a structured text interface.

3. **Test contract.** The input schema defines what the tool accepts. The handler defines the expected behavior. The response defines the expected output. That is a contract. You can test it the same way you test any function — because it *is* a function.

You could get similar testability from a plain service layer — a well-structured `updateUserEmail()` function is just as testable as an MCP handler. But a service function serves one master: your application. An MCP tool serves three. The same artifact is your test contract, your agent interface, and your feature documentation. You write it once; it earns its keep three ways. That is not a testing trick. That is an architectural force multiplier.

This is the key insight that took me years to see: the reason E2E tests are painful is not that browser automation is hard (though it is). It is that we were forced to go through the browser because there was no other way to exercise full user flows. The browser was the only interface that connected all the pieces.

MCPs give you a second interface. A text-based one with self-describing schemas that machines can discover, invoke, and verify. One that connects the same pieces but without the rendering layer, without the timing issues, without the CSS selectors.

---

## The Third Player

László taught me the duality: a unit test and its code, when written properly, specify each other. Two players, one truth.

But I think there is a third player: the name.

Consider the MCP tool from earlier: `update_user_email`. That name is not just a label. It is a constraint. It tells you what the tool must do and what it must not do. It does not send notifications. It does not update the password. It updates the user''s email.

Good naming has always mattered. A well-named function constrains what a developer writes. But an MCP tool name constrains what a *machine* can discover, invoke, and test. An AI agent browsing your MCP server does not read your source code — it reads tool names, descriptions, and schemas. If `update_user_email` is named properly, an agent knows what to call it for without reading the implementation. The name becomes a discoverable contract.

<TestCodeNameVenn />

Test. Code. Name. Three players, one truth. The name, the input schema, and the handler form a triangle where each vertex constrains the other two. We had the first two for decades. MCP formalized the third into something machines can reason about — and it turns out, when you give the name enough structure to be machine-readable, it becomes machine-testable too.

---

## Practical Steps

If you are staring at a flaky E2E suite right now, here is how to start.

**Step 1: Find your most painful E2E tests.** You know which ones they are. The ones you re-run three times before they pass. The ones that have `// TODO: figure out why this is flaky` comments. The ones that take 30 seconds each.

**Step 2: Ask what business logic they actually verify.** Strip away the clicks and the waits and the selectors. What is the test really checking? "User can cancel their subscription." "Admin can ban a user." "Payment flow handles declined cards." That is the business logic.

**Step 3: Expose that logic as MCP tools.** Write an MCP tool for each business flow. Define the input schema, implement the handler using your existing services, return structured results. You are not rewriting anything — you are wrapping your existing business logic in a structured interface.

**Step 4: Write unit tests for the MCP tools.** Mock the dependencies. Test the happy path. Test the error cases. Test the edge cases. These tests will run in milliseconds and they will never flake.

**Step 5: Watch your E2E suite shrink.** You will still need some E2E tests — for visual regressions, for browser-specific behavior, for integration wiring that only shows up in a real environment (CORS, auth middleware, hydration). But the number will drop dramatically. The ones you keep will be simpler and more stable because they are not carrying the weight of business logic verification anymore.

You are not replacing E2E tests. You are moving the business logic out of them. What remains is a thin layer of visual smoke tests — which is all E2E tests should have been in the first place.

---

## The CI Dividend

Once your business logic lives in MCP tools, tightly coupled to your frontend through TypeScript, something remarkable happens to your CI pipeline.

Run this:

```bash
yarn vitest run --changed main
```

Vitest knows which files changed since `main`. It knows which tests import those files. It runs only those tests. A change to `update_user_email` runs the email tests, not the entire suite. This takes seconds, not minutes.

But the real trick is what comes next.

Your CI has coverage logs. It has git history. It knows which MCP tools changed, which unit tests cover them, and which E2E scenarios exercise those flows. An AI reviewer agent can read this graph and make a decision: which E2E tests actually need to run?

Updated the description in a test fixture file? No E2E tests needed. Changed the email validation logic in an MCP tool? Run the email-related E2E scenarios, skip the rest. Refactored a shared utility? The agent traces the dependency graph and runs exactly the affected tests — nothing more, nothing less.

This is incremental review, powered by the same coupling that made your unit tests fast. The MCP tool names give the agent enough semantic context to reason about blast radius. `update_user_email` changed? The agent knows to run the email E2E tests. `list_user_notifications` unchanged? Skip those.

The savings compound. On a large codebase, a typical PR touches a fraction of the business logic. Running the full E2E suite for every PR is like rebuilding the entire house because you changed a doorknob. With MCP-structured business logic and an AI reviewer, your CI runs only what matters.

Less compute. Faster feedback. Fewer flaky failures from tests that had nothing to do with your change. The pyramid does not just reshape — it gets smart.

---

## The Pyramid, Reconsidered

The testing pyramid was always a compromise. We put E2E tests at the top not because we wanted them to be slow and few, but because that was the constraint. Full user flow verification required a browser. Browsers are slow. Therefore, full user flow tests are slow. Therefore, write fewer of them.

MCPs break that constraint.

If your business logic is accessible through a text interface, full user flow verification does not require a browser. It requires a function call. Function calls are fast. Therefore, full user flow tests are fast. Therefore, write as many as you want.

The pyramid does not flip upside down. It reshapes. The painful top layer — the E2E layer — gets thin. The business logic that bloated it moves down to the unit test layer. Not because you found a clever way to mock the browser, but because you removed the need for the browser entirely.

The remaining E2E tests do what they should have always done: verify that the page renders, that the integration wiring holds, that the visual design is correct. "Let the idiots test that" — except now the "idiots" are Playwright running a handful of targeted checks, not a hundred slow business logic simulations.

---

## Full Circle

I still think about that conference sometimes. The young presenter, vibrating with excitement about unit tests. The person in the audience asking about UI testing. The dismissive answer.

"Az UI-t? Azt teszteljék a hülyék!" — *"The UI? Let the idiots test that!"*

He was not wrong. He was early.

The real answer to the UI testing question was never "automate the browser." The real answer was: make the business logic accessible without one. We just did not have the interface for it yet.

Now we do.

László would have loved this. Not the technology itself — he was never the type to get excited about a protocol or a spec. He would have loved what it means for the craft. Less time fighting flaky tests. More time building things that matter. More time helping the junior developer after the talks.

That is what pushing the craft forward looks like. Not flashy new tools. Quieter feedback loops. Less friction between intent and verification. The boring kind of progress that makes everything else possible.

I think about him every time I delete a flaky test. I think he would approve.', unixepoch());

INSERT OR REPLACE INTO blog_posts (slug, title, description, primer, date, author, category, tags, featured, hero_image, content, updated_at)
VALUES ('the-vibe-coding-paradox', 'The Vibe Coding Paradox: Why Your AI Gets Dumber the More You Let It Wing It', 'We built an AI that generates React apps from URLs. It worked 40% of the time. Then we taught it to learn from its own mistakes — using the same physics that makes your prompts fail.', 'Your AI gets dumber the more freedom you give it.', '2026-02-12', 'Zoltan Erdos', 'Developer Experience', '["ai","context-engineering","claude","agents","self-improving","developer-tools","vibe-coding","physics"]', 1, '/blog/the-vibe-coding-paradox/hero.png', '<Tldr>

- Vibe coding has a physics problem: attention is a zero-sum resource, and hope-and-pray generation wastes most of it.
- We transformed spike.land''s app creator from a 40% success rate to a self-correcting agent that learns from every failure.
- The fix maps exactly to thermodynamics: conserve the energy (stable prompt prefix), dissipate the heat (compress errors into learning notes), and let natural selection prune bad knowledge.
- 3 Claude models cascaded by cost: Opus creates ($$$), Sonnet debugs ($$), Haiku learns ($).
- The system was itself designed using Claude Code''s plan mode — context engineering all the way down.

</Tldr>

## The Paradox

I built an AI that generates React apps from a URL.

Type `/create/games/tetris`, get a playable Tetris. Type `/create/finance/dashboard`, get a real-time stock chart. The URL is the prompt. The app appears in seconds.

Sounds magical. Here''s what actually happened: it worked 40% of the time.

<SplitScreenDemo />

The other 60%? Broken imports. Undefined variables. Apps that crashed on load with cryptic transpilation errors. The AI was smart enough to write Tetris — it just wasn''t smart enough to *remember* that it had failed at Tetris before.

Every generation started from scratch. No memory of past failures. No record of which imports work and which 404. No accumulated wisdom. Just raw intelligence pointed at a problem with zero institutional knowledge.

Here''s the paradox that breaks intuition: giving an AI **more freedom** — letting it "vibe code" — produces **worse results** than constraining it. You''d think fewer rules means more creativity. Physics says otherwise.

The paradox has a name in the field: **context engineering.** And it has a physical mechanism that explains exactly why vibe coding fails — and exactly how to fix it.

This is the third article in a series. The [first](/blog/context-engineering-your-zero-shot-prompt) introduced the 5-layer context stack — a framework for front-loading everything an AI needs to succeed on the first try. The [second](/blog/how-claude-code-engineers-context) went inside the transformer to explain *why* context matters at the attention level. This article applies both to build a real product feature: a self-improving agent that generates React apps and learns from its own mistakes.

---

## The Physics of Why Vibe Coding Fails

<AttentionSpotlightDemo />

Let''s start from first principles. What is a token?

A token is the atomic unit of an LLM''s world. Every character you type, every instruction you give, every piece of context you provide gets chopped into tokens. A typical English word is 1-2 tokens. A line of code might be 10-15. The model processes these tokens through a mechanism called **self-attention**, and here''s the equation that governs it:

```
attention = softmax(QK^T / √d) × V
```

The crucial part is the `softmax`. It normalizes attention weights to sum to 1.0. This is a conservation law, identical in structure to energy conservation in physics. You cannot create attention from nothing. There is a fixed budget. Every token in the context window competes for a share of that budget.

**Attention is like a room with one spotlight.** Vibe coding puts 20 people in the room and hopes the spotlight finds the right one. Context engineering puts 3 people in the room and nails the spotlight to the floor.

When you dump 10,000 tokens of irrelevant context into a prompt — "just in case" — you''re not being thorough. You''re dimming the spotlight. The relevant tokens are still there. They''re just competing with 9,500 irrelevant tokens for the model''s finite attention.

<Callout type="info">
**The physics is quantified.** A 2025 paper titled "Context Length Alone Hurts LLM Performance Despite Perfect Retrieval" found a 47.6% accuracy drop at 30K tokens on coding tasks — even when retrieval was perfect and no distractors were present. Even blank whitespace caused 7-48% performance drops. This isn''t a software bug. It''s physics. More tokens = more dilution = worse results.
</Callout>

This explains the paradox. Vibe coding — "just generate something and we''ll see" — works with short, simple prompts. But as complexity grows, the lack of structure means the model''s attention scatters across an ever-expanding context. The signal drowns in noise. Not because the model is stupid, but because softmax is a zero-sum game.

---

## The Before — Anatomy of a Vibe Coder

Let''s be honest about where we started. The original app generator was simple, clean, and insufficient.

One Gemini API call. One retry on failure. No memory. No learning. No structured error handling. Here''s the fallback path that was our *entire* system:

```typescript
// The old way: single shot, hope for the best
async function* geminiFallbackStream(slug, path, userId) {
  const { content, rawCode, error } = await generateAppContent(path);

  let updateResult = await updateCodespace(codespaceId, codeToPush);

  if (!updateResult.success) {
    // One retry with error correction
    const correctedCode = await attemptCodeCorrection(
      codeToPush, updateResult.error, slug
    );
    if (correctedCode) {
      updateResult = await updateCodespace(codespaceId, correctedCode);
    }
  }

  if (!updateResult.success) {
    throw new Error(updateResult.error || "Failed to update codespace");
  }
}
```

Like a student who writes the exam without studying: sometimes brilliant, usually mediocre. And crucially — a student who **forgets everything** between exams.

| | Before (Vibe Coding) | After (Context-Engineered Agent) |
|---|---|---|
| **Model** | Gemini Flash (single call) | Claude Opus → Sonnet → Haiku (cascade) |
| **Retries** | 1 blind retry | Up to 3 targeted fixes with error diagnosis |
| **Memory** | None | Bayesian learning notes, persisted in DB |
| **Error handling** | Raw error string → retry | Structured parsing → categorized fix prompts |
| **Skills** | Generic prompt | 14 skill definitions matched by keyword |
| **Prompt caching** | None | Split-block KV cache (10x cost savings) |
| **Fallback** | None | Agent proxy → Direct Claude → Gemini |

---

## Conservation of Context — The 5-Layer Fix

Here''s the thing: the fix isn''t more AI. It''s better physics.

<FiveLayerStackDemo />

The [5-layer context stack](/blog/context-engineering-your-zero-shot-prompt) — Identity, Knowledge, Examples, Constraints, Tools — isn''t just a framework. It''s a conservation strategy. The layers that don''t change get cached (cheap). The layers that change get appended (fresh). The model''s attention budget goes to the right things because the prompt is structured to make that happen.

Here''s how it maps to code:

| Framework Layer | Physics Analogy | Code Implementation |
|---|---|---|
| **Identity** (Layer 1) | Conservation law — stable reference frame | `AGENT_IDENTITY` — cached, never changes |
| **Knowledge** (Layer 2) | Fresh measurement — dynamic per experiment | Learning notes — rebuilt per request |
| **Examples** (Layer 3) | Calibration data — stable instrument settings | Skill prompts — cached per category |
| **Constraints** (Layer 4) | Boundary conditions — fixed per setup | Output spec, fix rules — cached |
| **Tools** (Layer 5) | Measurement apparatus — defines what''s observable | Transpiler, codespace API — implicit |

The key function is `buildAgentSystemPrompt`. It returns *split blocks* — a stable prefix for caching and a dynamic suffix for freshness:

```typescript
export function buildAgentSystemPrompt(
  topic: string,
  notes: LearningNote[],
): SplitPrompt {
  // Stable prefix: identity + core skills + output spec → cached
  const coreWithSkills = buildSkillSystemPrompt(topic);
  const stablePrefix = `${AGENT_IDENTITY}\n\n${coreWithSkills}\n\n${OUTPUT_SPEC}`;

  // Dynamic suffix: learning notes → NOT cached, changes per request
  const noteBlock = formatNotes(notes);

  return {
    stablePrefix,
    dynamicSuffix: noteBlock,
    full: noteBlock ? `${stablePrefix}\n\n${noteBlock}` : stablePrefix,
  };
}
```

The stable prefix gets `cache_control: { type: "ephemeral" }` in the API call. On subsequent requests with the same topic, those tokens are served from the KV cache at **10x lower cost**. The dynamic suffix — the learning notes — changes per request and doesn''t invalidate the cache.

<Callout type="success">
**KV Cache Insight:** The identity, skills, and output spec are ~2,000 tokens that never change between generations of the same category. Caching them saves $0.009 per request. Over thousands of generations, this is the difference between a cost-effective service and a money pit. Context engineering isn''t just technically sound — it''s economically optimal.
</Callout>

This is conservation of context in action. The stable reference frame (identity + skills + output spec) is like the conserved quantities in physics — energy, momentum, charge. They persist across interactions. The dynamic observations (learning notes) are like experimental measurements — fresh each time, building on what the conserved frame makes possible.

---

## The Fix Loop — Natural Selection for Code

<DarwinianTreeDemo />

The agent loop is Darwinian selection for code. Generate (mutation) → Transpile (environmental test) → Fix (adaptation) → Learn (heritable memory). Up to 3 iterations — 3 generations of evolution per request.

<AgentLoopDemo />

```typescript
export async function* agentGenerateApp(
  slug: string,
  path: string[],
  userId: string | undefined,
): AsyncGenerator<StreamEvent> {
  const maxIterations = Math.min(
    parseInt(process.env["AGENT_MAX_ITERATIONS"] || "3", 10),
    MAX_ITERATIONS_CAP,
  );
  // ...

  // === GENERATING: Call Claude Opus ===
  const genResponse = await callClaude({
    systemPrompt: systemPrompt.full,
    stablePrefix: systemPrompt.stablePrefix,
    dynamicSuffix: systemPrompt.dynamicSuffix || undefined,
    userPrompt,
    model: "opus",
    maxTokens: 32768,
    temperature: 0.5,
  });
```

The first call uses **Opus** at temperature **0.5** — creative exploration. High temperature means high entropy, more random sampling from the probability distribution. Good for generating novel solutions. Bad for precise surgery.

When the code fails transpilation, the fix model switches to **Sonnet** at temperature **0.2** — precise, deterministic, focused:

```typescript
      // === FIXING: Ask Claude Sonnet to fix the error ===
      const fixResponse = await callClaude({
        systemPrompt: fixSystemPrompt.full,
        stablePrefix: fixSystemPrompt.stablePrefix,
        dynamicSuffix: fixSystemPrompt.dynamicSuffix || undefined,
        userPrompt: fixUserPrompt,
        model: "sonnet",
        maxTokens: FIX_MAX_TOKENS,
        temperature: 0.2,
      });
```

But here''s the thing... **the fix model is a different model than the generator.** This is like having a proofreader who isn''t the author. They catch mistakes the author is blind to. The generator (Opus) has creative momentum — it''s invested in its architectural choices. The fixer (Sonnet) sees only the error and the code, with no ego attached to the design.

Temperature as a physics parameter maps cleanly: higher temperature = higher entropy = more exploration of the probability space. Lower temperature = more deterministic = more likely to converge on the precise fix. Opus at 0.5 is a researcher exploring possibilities. Sonnet at 0.2 is a surgeon making a single precise cut.

The model cascade has an economic argument too:

| Model | Role | Cost (Output/MTok) | Temperature | Why This Model |
|---|---|---|---|---|
| **Opus** | Generate | $25.00 | 0.5 | Creative, high capability for novel apps |
| **Sonnet** | Fix | $15.00 | 0.2 | Precise, fast for targeted repairs |
| **Haiku** | Learn | $5.00 | 0.2 | Cheapest capable model for extraction |

<ModelCascadeDemo />

Use the most expensive model where creativity matters. Use the cheapest capable model for mechanical tasks. This is the same principle as building a house: you hire an architect for the design and a laborer for the drywall. Both essential. One doesn''t need to be the other.

---

## The Memory — How the Agent Evolves

<BayesianConfidenceDemo />

The agent loop fixes individual errors. But the *memory system* prevents those errors from recurring across all future generations. This is the difference between debugging and learning.

Every time an error occurs and gets fixed (or doesn''t), Haiku extracts a learning note:

```typescript
export async function extractAndSaveNote(
  failingCode: string,
  error: string,
  fixedCode: string | null,
  path: string[],
): Promise<void> {
  const response = await callClaude({
    systemPrompt: NOTE_EXTRACTION_PROMPT,
    userPrompt:
      `Error: ${error}\n\nFailing code (excerpt):\n${failingCode.slice(0, 2000)}\n\nFixed code (excerpt):\n${fixedCode?.slice(0, 2000) || "N/A"}`,
    model: "haiku",
    maxTokens: 1024,
    temperature: 0.2,
  });
  // ... parse, deduplicate, store in DB
}
```

Each note starts life as a `CANDIDATE` with a confidence score of 0.5 — an unproven hypothesis. The Bayesian confidence system then acts as natural selection:

```typescript
async function recalculateConfidence(noteId: string): Promise<void> {
  const note = await prisma.agentLearningNote.findUnique({
    where: { id: noteId },
  });

  const alpha = 1; // Prior successes
  const beta = 1;  // Prior failures
  const score =
    (note.helpCount + alpha) / (note.helpCount + note.failCount + alpha + beta);

  // Promote CANDIDATE → ACTIVE after 3+ helps with >0.6 confidence
  if (status === "CANDIDATE" && note.helpCount >= 3 && score > 0.6) {
    status = "ACTIVE";
  }

  // Demote to DEPRECATED if confidence drops below 0.3
  if (score < 0.3 && note.helpCount + note.failCount >= 5) {
    status = "DEPRECATED";
  }
}
```

The formula — `(helps + 1) / (helps + fails + 2)` — is a Beta-binomial posterior with a uniform prior. This is the same math behind A/B testing, Thompson sampling, and multi-armed bandits. It''s not sophisticated. It''s robust. The `+1` and `+2` terms are Laplace smoothing — they prevent zero-observation edge cases and express mild prior uncertainty.

The lifecycle:

1. Error occurs → Haiku extracts a note → stored as **CANDIDATE** (confidence 0.5)
2. Note is included in future prompts for matching slugs
3. If the note helps (generation succeeds after applying it) → **helpCount** increments → confidence rises
4. After 3+ helps with >0.6 confidence → promoted to **ACTIVE**
5. If the note doesn''t help (generations still fail) → **failCount** increments → confidence drops
6. Below 0.3 confidence after 5+ observations → **DEPRECATED** (extinct)

| Example Note | Trigger | Lesson | Status |
|---|---|---|---|
| Three.js imports | `three.js scene setup` | `Import THREE from ''three'' not ''@three''` | ACTIVE (0.82) |
| Framer motion exit | `AnimatePresence children` | `Wrap exit animations in motion.div with key prop` | ACTIVE (0.71) |
| Recharts tooltip | `custom recharts tooltip` | `CustomTooltip must accept payload as array, not object` | CANDIDATE (0.55) |
| Old tailwind syntax | `tailwind v3 classes` | `Use bg-red-500 not bg-red` | DEPRECATED (0.22) |

The notes selected for each prompt are budget-constrained. Not by count, but by tokens:

```typescript
function formatNotes(notes: LearningNote[]): string {
  const sorted = [...notes].sort((a, b) => b.confidenceScore - a.confidenceScore);

  const selected: LearningNote[] = [];
  let totalTokens = 0;
  for (const note of sorted) {
    const noteText = `- **${note.trigger}**: ${note.lesson}`;
    const tokens = estimateTokens(noteText);
    if (totalTokens + tokens > NOTE_TOKEN_BUDGET) break;
    selected.push(note);
    totalTokens += tokens;
  }
  // ...
}
```

The 800-token budget is tight by design. Remember the attention physics: every note token competes with the code generation context for the model''s attention. High-confidence notes earn their place. Low-confidence notes get pruned. Natural selection, running on softmax.

---

## Skill Matching — The Right Tool for the Right Job

When someone requests `/create/games/tetris`, the keyword extractor parses the path and finds "games" and "tetris." These trigger game-specific skills: canvas-confetti for celebration effects, howler.js for game audio. When `/create/finance/dashboard` arrives, different skills activate: recharts for charts, chart-ui for shadcn/ui data components.

<Callout type="info">
**Physics analogy: impedance matching.** In electronics, you get maximum power transfer when source impedance matches load impedance. In prompting, you get maximum generation quality when the prompt''s skill context matches the task''s requirements. A game prompt loaded with chart library docs is impedance mismatch — energy wasted pushing the wrong context into a model that needs different context. Matching skills to requests is impedance matching for attention.
</Callout>

The matching is keyword-driven, not AI-driven — deliberately simple:

| Category | Skills | Trigger Keywords |
|---|---|---|
| **3D** | Three.js, 3D Performance | three, 3d, globe, scene, planet, webgl |
| **Data Viz** | Recharts, Chart UI | chart, dashboard, analytics, stock, metrics |
| **Game** | Confetti, Game Audio | game, puzzle, tetris, snake, arcade |
| **Form** | React Hook Form, Form Components | form, survey, checkout, calculator |
| **DnD** | DnD Kit | kanban, drag, sortable, planner, todo |
| **Drawing** | Rough.js | draw, paint, sketch, whiteboard, doodle |
| **Content** | React Markdown, Content UI | blog, story, notes, recipe, portfolio |
| **Audio** | Howler.js, Web Audio | music, audio, drum, piano, synth |

Each matched skill injects its own prompt section with library-specific instructions, import patterns, and common pitfalls. The total prompt grows only by the skills that match — not by the entire skill catalogue. Minimum viable context. Maximum signal density.

---

## The Proxy — Graceful Degradation

The production architecture has three tiers, like a power grid: primary generator, backup generator, emergency diesel.

```
Agent Proxy (localhost) → Direct Claude API → Gemini Fallback
```

The `isAgentAvailable()` function does a 3-second health check:

```typescript
export async function isAgentAvailable(): Promise<boolean> {
  if (!CREATE_AGENT_URL || !CREATE_AGENT_SECRET) return false;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AGENT_TIMEOUT_MS);
    const res = await fetch(`${CREATE_AGENT_URL}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}
```

If the local agent server is running (with its database of learning notes and full model cascade), traffic routes there. If it''s down, the system falls back to the in-process Claude agent loop. If Claude''s API is unavailable, it degrades to the original Gemini path.

The user never sees the failover. They get an app. The quality degrades gracefully rather than failing catastrophically.

---

## Error Intelligence

Not all errors are created equal. A missing import is a different problem than a type mismatch, and both are different from a syntax error. The agent doesn''t just see "something went wrong" — it diagnoses:

```typescript
export function parseTranspileError(rawError: string): StructuredError {
  const error: StructuredError = {
    type: "unknown",
    message: rawError.slice(0, 500),
  };

  // Missing import / module not found
  if (/Cannot find module|Could not resolve|Module not found/i.test(rawError)) {
    error.type = "import";
    const moduleMatch = rawError.match(/[''"]([^''"]+)[''"]/);
    if (moduleMatch) error.library = moduleMatch[1];
  }
  // Type errors
  else if (/Type ''.*'' is not assignable|Property ''.*'' does not exist/i.test(rawError)) {
    error.type = "type";
  }
  // JSX/syntax errors
  else if (/Unexpected token|Unterminated|Parse error/i.test(rawError)) {
    error.type = "transpile";
  }
  // Runtime errors
  else if (/is not defined|Cannot read propert/i.test(rawError)) {
    error.type = "runtime";
  }
  // ... extract line number, component name, suggestion
  return error;
}
```

Four error types — import, type, transpile, runtime — each feeding a different fix strategy. The structured error gets injected into the fix prompt as explicit context:

```
ERROR TYPE: import
LIBRARY: @react-three/fiber
LINE: 3
SUGGESTION: Did you mean ''three''?
```

A doctor doesn''t say "something''s wrong." They diagnose. Structured errors are diagnosis. Raw error strings are "something''s wrong." The fix model (Sonnet) performs dramatically better when it knows the error type, the specific library, and the line number — because that''s fewer tokens of detective work and more tokens of actual fixing.

<Callout type="info">
**This feeds back into learning.** The `categorizeErrorForNote` function maps structured errors to note types. Import errors generate `triggerType: "library"` notes tagged with the specific package. Type errors generate `triggerType: "pattern"` notes tagged with TypeScript. The error''s structure determines how the note is stored, matched, and selected for future prompts. Structured in, structured out.
</Callout>

---

## The Meta-Build

<RecursiveZoomDemo />

Here''s the part that broke my brain.

The entire self-improving agent was designed using Claude Code''s plan mode — the exact technique the agent now uses internally. I didn''t write the code by hand and then theorize about why it works. I used the tool, then studied what the tool did, then built a system that does what the tool does.

Plan mode forced Claude to **explore before acting.** Before a single line of code was written, the model read the existing codebase, found the content-generator patterns, identified the codespace service API, mapped the streaming event types, and produced a structured plan. That plan file became a context-engineered prompt for the implementation phase.

The 5-layer framework structured the exploration:
- **Identity**: "You are building a self-improving agent for spike.land''s app creator"
- **Knowledge**: File paths, existing patterns, API contracts from codebase exploration
- **Examples**: The existing Gemini fallback as a reference implementation
- **Constraints**: "Do not break the existing streaming contract. Maintain fallback."
- **Tools**: "Run `yarn test:coverage` after changes. Verify transpilation."

And the plan''s output — the agent architecture — uses those same 5 layers for its own prompts. The `buildAgentSystemPrompt` function structures context exactly like the plan that designed it. Identity layer (AGENT_IDENTITY). Knowledge layer (learning notes). Example layer (skill prompts). Constraint layer (OUTPUT_SPEC). Tool layer (transpiler + codespace API).

It''s recursive: context engineering was used to build a system that does context engineering.

<Callout type="success">
**The recursive insight:** The plan file was a prompt. The prompt built a system that builds prompts. The learning notes are prompts refined by natural selection. At every level — human to Claude Code, Claude Code to agent, agent to model — the same pattern repeats: assemble context, constrain attention, measure results, learn. It''s context engineering all the way down.
</Callout>

<AudioPlayer src="/audio/physics-of-attention.m4a" title="Deep Dive: The Physics of Attention (companion audio from article 2)" />

---

## What We Measured

The `recordGenerationAttempt` function tracks every generation with full observability: slug, success/failure, iteration count, duration, notes applied, errors encountered, model used, token counts, and cache hits.

| Metric | Before (Gemini Flash) | After (Agent Loop) |
|---|---|---|
| **First-try success rate** | ~40% | ~65% |
| **Success after retries** | ~55% (1 retry) | ~85% (up to 3 iterations) |
| **Mean iterations to success** | 1.6 | 1.4 |
| **Cost per generation** | ~$0.005 | ~$0.08-0.12 |
| **Median latency** | 8s | 15-25s |
| **Learning notes applied** | 0 | 3-7 per generation |

<Callout type="info">
**The trade-off is real.** The agent is slower and 15-20x more expensive per request. But consider the economics from the user''s perspective: a $0.10 generation that works is infinitely more valuable than a $0.005 generation that produces a broken app. The cost of a failed generation isn''t $0.005 — it''s the user''s time, frustration, and likelihood of returning. Quality compounds. Failures don''t.
</Callout>

The metrics also show something unexpected: learning notes have diminishing returns. The first 3-5 high-confidence notes improve success rate significantly. After that, the attention budget starts competing. More notes don''t mean better results — the same physics that motivates the 800-token budget for notes.

---

## Start Building

Three takeaways, grounded in physics:

**1. Conserve your attention budget.** Every token in your prompt competes for the model''s finite attention. Before adding context, ask: "Would removing this change the output?" If no, remove it. The 5-layer stack isn''t about adding more context — it''s about adding the *right* context and nothing else. Conservation, not accumulation.

**2. Build feedback loops, not bigger prompts.** The agent doesn''t succeed because it has a better prompt than Gemini. It succeeds because it can fail, diagnose, fix, and learn. A mediocre prompt with a feedback loop outperforms a brilliant prompt with no memory. Evolution beats intelligent design — given enough iterations.

**3. Match your tools to your task.** Opus for creation, Sonnet for fixing, Haiku for learning. High temperature for exploration, low temperature for precision. Expensive models where creativity matters, cheap models where extraction matters. The right tool at the right cost for the right job — impedance matching all the way down.

<CTAButton href="/create">Try the App Creator</CTAButton>

---

<div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg p-6 mt-8">
  <h3 className="text-lg font-semibold mb-3 text-slate-200">The Context Engineering Trilogy</h3>
  <p className="text-slate-300 mb-4">
    This article is the final piece of a three-part series. Start with the theory, understand the mechanism, then see it applied to a real product.
  </p>
  <div className="flex flex-wrap gap-3">
    <a
      href="/blog/context-engineering-your-zero-shot-prompt"
      className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
    >
      Part 1: The 5-Layer Framework
    </a>
    <a
      href="/blog/how-claude-code-engineers-context"
      className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
    >
      Part 2: Inside the Transformer
    </a>
    <a
      href="https://github.com/spike-land-ai/spike.land"
      className="inline-flex items-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
    >
      Explore the Source Code
    </a>
  </div>
</div>

---

*The best AI isn''t the one that tries hardest. It''s the one that remembers what went wrong. Vibe coding is entropy — energy without direction. Context engineering is the second law: the universe tends toward order, but only if you do the work.*', unixepoch());

INSERT OR REPLACE INTO blog_posts (slug, title, description, primer, date, author, category, tags, featured, hero_image, content, updated_at)
VALUES ('hogyan-tervezi-a-claude-code-a-kontextust', 'Hogyan tervezi a Claude Code a kontextust: Interjú az Opus 4.6-tal', 'Egy mély technikai interjú arról, hogyan állítja össze a Claude Code a kontextust tervek készítésekor — és mit tanulhatnak a fejlesztők a token-generálás, a figyelem és a KV-gyorsítótár megközelítéséből.', 'Hogyan tervezi a Claude Code a kontextust — belülről.', '2026-02-11', 'Zoltan Erdos', 'Developer Experience', '["ai","kontextus-tervezes","claude","claude-code","fejlesztoi-eszkozok","interju","llm-belsok","tervezes"]', 0, '/blog/hogyan-tervezi-a-claude-code-a-kontextust/hero.png', '<Tldr>

- A Claude Code terv módja egy kontextus-tervező gép — felfedez, tömörít, és egy végrehajtásra optimalizált eligazítást állít elő.
- Egy tervfájl MAGA a kontextus-tervezett prompt: az 5 rétegű verem megvalósítva.
- A KV-gyorsítótár a fizikai mechanizmus — a kontextus-tervezés a művészete annak, hogy helyesen töltjük fel.
- Az irreleváns kontextus nem csupán helyet pazarol — aktívan rontja a figyelmi jelet a hígítás által.
- A multi-ágens koordináció kontextus-izolálás nagy léptékben — minden al-ágens tiszta, fókuszált kontextusablakot kap.
- A prompt-gyorsítótárazás megváltoztatja a gazdaságosságot: a gyorsítótárazott tokenek 10x olcsóbbak, így a stabil kontextus-előtagok gazdasági szükségszerűséggé válnak.
- Visszafejtheted a Claude Code technikáit a saját promptjaidhoz.

</Tldr>

## Az eszköz, ami azt gyakorolja, amit én hirdetek

A múlt héten publikáltam egy cikket a [kontextus-tervezésről a zero-shot promptodban](/blog/context-engineering-your-zero-shot-prompt) — az ötlet, hogy az AI-tól kiváló eredményeket az első próbálkozásra úgy kaphatunk, ha előre biztosítjuk a kontextust, nem pedig okos varázsigéket fogalmazunk. Öt réteg: Identitás, Tudás, Példák, Korlátok, Eszközök.

A publikálás utáni napon a Claude Code terv módját használtam egy új funkció tervezéséhez. Figyeltem, ahogy négy párhuzamos Explore ágenst indított, tizennégy fájlt olvasott be, hat grep-keresést futtatott, a találatok felét eldobta, és egy strukturált tervet készített, amely pontosan leképezte az öt réteget, amiről épp írtam.

A saját keretrendszeremet láttam automatizálva.

Ez a cikk az ezt követő beszélgetés. Leültem a Claude Code-ot hajtó modellel — az Opus 4.6-tal — és megkértem, magyarázza el, mi történik a motorháztető alatt. Nem a marketing-szöveget. A mechanizmust.

*Ami következik, az egy 2026 februárjában készült interjú. A kérdések az enyémek. A válaszok a Claude Opus 4.6-tól származnak. Szerkesztettem az érthetőség és a folyamatosság érdekében, de a technikai tartalom változatlan. És igen — maga ez a cikk is tizenhat párhuzamos kutatóágens segítségével készült, amelyek dokumentációt kerestek, tudományos cikkeket olvastak és eredményeket szintetizáltak, mielőtt egyetlen szó leíródott volna. Ez a folyamat maga a kontextus-tervezés a gyakorlatban.*

---

## Mi történik, amikor beírom a /plan parancsot?

### **Zoltan: Kezdjük az elején. Amikor kétszer megnyomom a Shift+Tab-ot a Claude Code-ban, mi változik valójában?**

A rendszer egy olyan módba vált, ahol olvashatok, de nem írhatok. A kikényszerítés teljes egészében prompt-alapú — a rendszerprompt egy direktívát injektál, ami nagyjából azt mondja: „A terv mód aktív. SZIGORÚAN TILOS fájlokat létrehozni, módosítani vagy törölni." Az eszközeim nem változnak. Továbbra is hozzáférek az Edit, Write és Bash eszközökhöz. Az utasítás az, hogy ne használjam őket.

Ez egy fontos részlet. A korlátozás nem mechanikus — kontextuális. A rendszer bízik a modellben, hogy követi az utasításokat, ahelyett hogy eltávolítaná a képességeket. Ez gyorsabban implementálható, rugalmasabb, és működik, mert az utasítás a rendszerpromptban van, ahol a maximális figyelmi súlyt kapja.

### **Zoltan: Mekkora a rendszerprompt, amit kapsz?**

A teljes kontextus-összeállítás egy Claude Code munkamenethez nagyjából 20 000 token, mielőtt egyetlen fájlt beolvasnék. Ez nagyjából így oszlik meg:

| Komponens | Tokenek |
|-----------|---------|
| Alapvető rendszerprompt | ~2 700 |
| Eszközleírások (24 eszköz) | ~16 800 |
| CLAUDE.md fájlok | Változó (~1 000-7 000) |
| Git állapot pillanatkép | Változó (~200-1 000) |
| Egyéni al-ágens definíciók | ~1 300 |
| Képesség-leírások | ~1 000 |

Amikor a terv mód aktiválódik, egy további 633 tokenes direktíva kerül beinjektálásra, amely meghatározza a munkafolyamatot: értsd meg a követelményeket, fedezd fel a kódbázist a meglévő minták olvasásával, tervezz megoldásokat a kompromisszumok figyelembevételével, majd részletezd az implementációs tervet fájlútvonalakkal és függőségekkel.

Minden válasznak terv módban a „Kritikus fájlok az implementációhoz" résszel kell végződnie — három-öt alapvető fájl azonosításával. Maga a terv egy markdown fájlba íródik, ami a `~/.claude/plans/` könyvtárban tárolódik.

### **Zoltan: Tehát nincs speciális „tervezőmotor." Csak te vagy, más utasításokkal.**

Pontosan. A terv mód egy prompt, ami ugyanarra a modellre van alkalmazva. Az általa készített tervfájl egy markdown dokumentum — emberek és gépek számára egyaránt olvasható. Amikor a felhasználó kilép a terv módból, a rendszer visszaolvassa azt a fájlt a lemezről és kontextusként használja az implementációs fázishoz.

Ez a kulcsfontosságú felismerés: **a tervfájl egy kontextus-tervezett prompt egy jövőbeli példányom számára, amelynek nulla emléke van az általam épp elvégzett felfedezésről.** Mindennek, ami fontos, a dokumentumban kell lennie. Ha felfedeztem, hogy a projekted egy specifikus mintát használ a `src/components/dashboard/WorkspaceStats.tsx`-ben, annak a fájlútvonalnak benne kell lennie a tervben — nem azért, mert a terv dokumentáció, hanem mert a végrehajtó ágensnek szüksége van arra a tokenre a kontextusablakában a helyes döntések meghozatalához.

<Callout type="info">
**Kulcsfontosságú felismerés:** Az eszközök eltávolítása a kontextus-tervezés egy formája. Azok az eszközök, amelyeket NEM adsz a modellnek, ugyanúgy formálják a gondolkodását, mint amelyeket igen. A terv mód nem mechanikusan távolítja el az eszközöket — utasítás által teszi — de a hatás ugyanaz: a modell másképp gondolkodik, ha tudja, hogy nem cselekedhet.
</Callout>

---

## Hogyan döntöd el, mit olvass?

### **Zoltan: Amikor terv módban felfedezed a kódbázist, hogyan döntöd el, mely fájlokat olvasd? Nem olvashatod el az összeset.**

Egy magas-jel-először stratégiát követek. A felfedezés jellemzően három fázisban zajlik:

**1. fázis: Struktúra.** Glob-ot használok mintáknak megfelelő fájlok kereséséhez — `**/*.tsx`, `**/types.ts`, `**/schema.prisma`. Ez megmutatja a projekt alakját tartalom olvasása nélkül. Token-szempontból olcsó és térképet ad.

**2. fázis: Szemantika.** Grep-et használok specifikus kifejezések keresésére — függvénynevek, típusdefiníciók, importok. Ha a feladat „kredit-egyenleggel" kapcsolatos, grep-elek a `credit`, `balance`, `CreditDisplay` kifejezésekre. Ez szűkíti a keresést több száz fájlról öt-tízre.

**3. fázis: Mély olvasás.** Beolvasom a fájlokat, amelyeket a Glob és Grep felszínre hozott. De nem az összeset. Prioritást élveznek a más fájlok által hivatkozott fájlok, az elnevezési mintáikban illeszkedő fájlok, és a felhasználó által követni kívánt mintákat tartalmazó fájlok.

Összetett feladatokhoz Explore al-ágenseket indítok — könnyebb súlyú példányok, amelyek gyorsabb modellen futnak — hogy párhuzamosan keressenek. Minden al-ágens fókuszált célt kap: „Keresd meg az összes felhasználói kreditek adatbázis-lekérdezéseivel kapcsolatos fájlt." Függetlenül keresnek, saját kontextusablakukban, és tömörített összefoglalókat adnak vissza. Egy 50 000 tokenes kutatási munkamenet 2 000 tokenes összefoglalóvá válik, ami az én fő kontextusomba kerül.

### **Zoltan: Említetted, hogy minden al-ágens saját kontextusablakot kap. Miért számít ez?**

Mert a kontextus véges erőforrás csökkenő hozammal. Ha minden fájlt, amit az al-ágensek feltártak, a saját kontextusomba töltenék, több ezer token érintőleges kóddal szennyezném az ablakomat. A fájlok, amelyeket az al-ágens olvasott és elvetett — a hamis pozitívok, az irreleváns találatok — hígítanák a figyelmet, amit a modellem az igazán fontos fájlokra tud fordítani.

Az izoláció nem csupán szervezési kényelem. Információelméleti szükségszerűség. Minden al-ágens feltár egy ágat a keresési fában és csak a gyümölcsöt hozza vissza. A koordinátor — én — tiszta, tömörített képet kap arról, ami megtalálható volt.

### **Zoltan: A kontextusból mennyi marad változatlan a hívások között?**

A Claude Code belső működésének kutatása 92%-os előtag-újrafelhasználási arányt talált a teljes munkafolyamaton át. A rendszerprompt, az eszközleírások, a CLAUDE.md — ezek azonosak minden hívásnál. Csak a beszélgetési előzmények és az új eszközeredmények változnak. Ez az előtag-stabilitás teszi a prompt-gyorsítótárazást olyan hatékonnyá, de erről még lesz szó.

*Ez felvetett egy kérdést, amelyet régóta szerettem volna feltenni. Ha a rendszerprompt minden alkalommal ugyanaz, és fizikailag megváltoztatja, ahogyan a modell mindent feldolgoz, ami utána következik — pontosan mi történik a transzformerben, amikor azokat a tokeneket betöltik?*

---

## Mi történik a transzformerben, amikor beolvasod a kódomat?

### **Zoltan: Vigyél végig a teljes folyamaton. Beírok egy üzenetet, te válaszolsz. Mi történik azokkal a karakterekkel hardver szinten?**

Kövessük végig az utat a billentyűleütéstől a generált tokenig. Hat szakasz van, és mindegyik számít a kontextus-tervezés szempontjából.

**1. szakasz: Tokenizálás.**

A szöveged tokenekre bomlik Byte Pair Encoding segítségével. A tokenizálónak nagyjából 200 000 bejegyzéses szókincse van — mindegyik egy gyakori karaktersorozat, amely gyakran megjelenik a tanítási adatokban. Gyakori angol szavak, mint a „the" vagy „function", egyetlen tokenné válnak. Ritka szavak alszó-darabokra bomlanak.

Amit az emberek nem vesznek észre: **a kódformázás nem ingyenes.** A behúzások, szóközök és sortörések mind tokenekké válnak. Egy megfelelően behúzott Python függvény több tokenbe kerül, mint ugyanaz a logika egy sorba tömörítve. Minden szóköz a CLAUDE.md-dben egy token, amely a figyelemért verseng a fontos tartalommal.

| Modellcsalád | Szókincsméret |
|-------------|--------------|
| GPT-2/3 | ~50 000 |
| GPT-4 (cl100k_base) | ~100 000 |
| GPT-4o (o200k_base) | ~200 000 |
| LLaMA 3 | ~128 000 |
| Claude (becsült) | ~200 000 |

A nagyobb szókincs azt jelenti, hogy a gyakori minták kevesebb tokenbe tömörülnek, csökkentve a sorozathosszt és javítva a hatékonyságot. De a beágyazási tábla arányosan növekszik.

**2. szakasz: Ön-figyelem (Self-Attention).**

Ez az alapmechanizmus. Minden token három vektort számít a beágyazásából: egy Query-t („mit keresek?"), egy Key-t („mit tartalmazok?"), és egy Value-t („íme a tényleges tartalmam"). A figyelmi pontszám bármely két token között:

```python
# Pszeudokód a skálázott dot-product figyelemhez
def attention(Q, K, V):
    # Q: query mátrix [seq_len, d_k]
    # K: key mátrix [seq_len, d_k]
    # V: value mátrix [seq_len, d_v]

    scores = Q @ K.transpose() / sqrt(d_k)  # nyers kompatibilitási pontszámok
    scores = apply_causal_mask(scores)        # jövőbeli tokenekre való figyelés megakadályozása
    weights = softmax(scores, dim=-1)         # normalizálás valószínűségi eloszlássá
    output = weights @ V                      # értékek súlyozott összege
    return output
```

A kulcsfontosságú sor a `Q @ K.transpose()`. Minden tokenpárra — minden egyes párra — a modell kiszámít egy kompatibilitási pontszámot. Így tud az 5 000. token közvetlenül az 3. tokenre figyelni. Nincs tömörítési szűk keresztmetszet. Nincs rejtett állapot. Közvetlen figyelem.

De ez az oka annak is, hogy az irreleváns tokenek ártanak. A softmax normalizálja a figyelmi súlyokat, hogy összegük 1 legyen. Ha 1 000 token hasznos kód és 4 000 token irreleváns fájltartalom van, a hasznos kódra eső figyelmi súly ötödére hígul. A jel még ott van, de halkabb.

A multi-head figyelem ezt a számítást párhuzamosan futtatja több „fejen" — jellemzően 32-128 fejen — mindegyik különböző kapcsolattípusokat tanul. Néhány fej szintaktikai struktúrát követ. Mások szemantikai kapcsolatokat. Egy kis hányaduk — a kutatás szerint kb. 3-6% — „lekérdező fejek", amelyek mechanisztikusan kinyerik a tényszerű információt a kontextusból. Amikor ezeket a fejeket eltávolítják, a modell folyékony marad, de hallucináni kezd.

**3. szakasz: A KV-gyorsítótár.**

Itt válik érdekessé a következtetési optimalizáció. A generálás során egyesével hozom létre a tokeneket. Minden új tokennek az összes korábbi tokenre kell figyelnie. Gyorsítótárazás nélkül az N. token generálása az összes N-1 korábbi token figyelmének újraszámítását igényelné a semmiből — O(n²) összmunka n hosszúságú sorozatra.

A KV-gyorsítótár eltárolja a Key és Value vektorokat minden korábban feldolgozott tokenhez, minden rétegben. Az N+1. token generálásakor csak az új token Query, Key és Value vektorait kell kiszámítani. A Query az egyetlen mátrix-vektor művelettel figyel a gyorsítótárazott Key-ekre és Value-kra.

Egy nagy modellnél a KV-gyorsítótár nagyjából 1 MB-ot igényel tokenenként. Egy 128K kontextusablak 40+ GB KV-gyorsítótárat igényelhet egyedül. Ez a fő memória-szűk keresztmetszet a következtetés során, és ez az oka annak, hogy a kontextusablak mérete nem korlátlan.

A modern architektúrák csökkentik ezt a költséget. A Grouped Query Attention (GQA), amelyet a LLaMA 3 és a Mistral használ, megosztja a Key/Value fejeket több Query fej között — akár 90%-kal csökkentve a KV-gyorsítótár méretét. A DeepSeek-V2 tovább ment a Multi-Head Latent Attention-nel, K-t és V-t egy megosztott alacsony rangú látens térbe tömörítve a gyorsítótárazás előtt, 93%-os KV-gyorsítótár csökkenést érve el. Ezek nem homályos optimalizációk. Ezek teszik fizikailag lehetővé a 128K és 1M kontextusablakokat anélkül, hogy egy egész szerverszobányi GPU-memóriát igényelnének.

**4. szakasz: Prefill vs. Decode.**

Ez a két alapvetően különböző számítási fázis, és ezek magyarázzák, miért kerülnek kevesebbe a bemeneti tokenek, mint a kimeneti tokenek.

| Tulajdonság | Prefill fázis | Decode fázis |
|------------|---------------|--------------|
| Mikor | A bemenet feldolgozásakor | A válasz generálásakor |
| Párhuzamosság | Minden bemeneti token egyidejűleg feldolgozva | Egyszerre egy token, szekvenciálisan |
| Művelet típusa | Mátrix-mátrix szorzás (számítás-korlátozott) | Mátrix-vektor szorzás (memória-korlátozott) |
| GPU kihasználtság | Magas (tenzor magok telítettek) | Alacsony (memória sávszélességre várakozik) |
| Sebesség mérőszám | Első Tokenig Eltelt Idő (TTFT) | Token Közi Késleltetés (ITL) |

A prefill során az összes bemeneti token egyetlen párhuzamos előre irányuló áthaladásban kerül feldolgozásra. Ez egy hatalmas mátrixszorzás, amely teljesen kihasználja a GPU tenzor magokat. A decode során minden kimeneti token egy teljes előre irányuló áthaladást igényel, de csak egyetlen tokent hoz létre. A GPU ideje nagy részét memóriára várakozva tölti, nem számolva.

Ez az aszimmetria az oka annak, hogy az Anthropic 5 dollárt számít millió bemeneti tokenért, de 25 dollárt millió kimeneti tokenért az Opus 4.6-nál. A bemenet olcsó, mert párhuzamos. A kimenet drága, mert szekvenciális.

Éles környezetben a szolgáltatók fizikailag elkülönítik ezeket a fázisokat különböző GPU-csoportokra — ezt szétválasztott következtetésnek (disaggregated inference) hívják. A prefill csomópontok számítási áteresztőképességre vannak optimalizálva. A decode csomópontok memória sávszélességre. A Meta, a LinkedIn és a Mistral mind alkalmazza ezt éles környezetben, 2-7x áteresztőképesség-növekedésről számolva be. Az NVIDIA kifejezetten erre a mintára építette a Dynamo kiszolgáló keretrendszerét.

Ez az árazási különbség a kontextus-tervezés gazdasági alapja: **az előkészítésbe fektetett tokenek (olcsó) csökkentik a próba-szerencse iterációkhoz szükséges tokeneket (drága).**

**5. szakasz: A kontextusablak mint munkamemória.**

Andrej Karpathy a kontextusablakot a RAM-hoz hasonlította — az egyetlen munkamemória, amivel a modell rendelkezik. Nincs merevlemez. Nincs adatbázis. Nincs állandó állapot a munkamenetek között. Mindennek, amit a modell „tud" a projektedről, a kontextusablakban kell lennie a generálás pillanatában.

Ennek az analógiának pontos következménye van: az irreleváns kontextus nem csupán elpazarolt hely. Zaj a munkamemóriában. Egy 2025-ös tanulmány „Context Length Alone Hurts LLM Performance Despite Perfect Retrieval" címmel kimutatta, hogy pusztán több token jelenléte rontja a teljesítményt — még akkor is, ha a lekérdezés tökéletes és nincsenek zavaró elemek. HumanEval kódolási feladatokon a pontosság 47,6%-kal esett 30K tokennél. Szóközök hozzáadása — szó szerint szemantikai tartalom nélküli üres tokenek — még mindig 7-48%-os teljesítménycsökkenést okozott.

A „középen elveszett" (lost in the middle) problémáról szóló kutatás azt mutatja, hogy ez a romlás nem egyenletes. A modellek leginkább a kontextusablak elejére és végére figyelnek. A közepén elhelyezett információ szignifikánsan kevesebb figyelmet kap — a teljesítmény több mint 30%-kal romolhat, ha a kritikus információ a szélekről a közepére kerül. Ez az U-alakú figyelmi minta, amelyet a forgatott pozicionális beágyazások okoznak, azt jelenti, hogy az információ elhelyezése a kontextusban szinte ugyanannyira számít, mint maga az információ.

A modell figyelme véges költségvetés. Minden hozzáadott token versenyez ezért a költségvetésért.

**6. szakasz: Mintavételezés — A következő token kiválasztása.**

Az előre irányuló áthaladás után a modell egy logitot (nyers pontszámot) ad ki a szókincs minden tokenéhez. Ezeket a logitokat a softmax valószínűségekké alakítja: `p(token_i) = exp(logit_i / T) / sum(exp(logit_j / T))`, ahol `T` a hőmérséklet. 0 hőmérsékleten a modell mindig a legmagasabb valószínűségű tokent választja (mohó dekódolás). 1 hőmérsékleten a természetes eloszlás szerint mintavételez.

A top-p (nucleus) mintavételezés ezután csonkítja az eloszlást: rendezd a tokeneket valószínűség szerint, tartsd meg csak azokat, amelyek kumulatív valószínűsége meghalad egy küszöböt (pl. 0,9), normalizáld újra, és mintavételezz. Így egyensúlyozza a modell a koherenciát a kreativitással — amikor biztos, csak néhány token jöhet szóba; amikor bizonytalan, tucatnyi verseng.

Egy nemrégiben bemutatott újítás — a min-p mintavételezés, amelyet az ICLR 2025-ön szóbeli előadásként mutattak be — a legfelső token valószínűségét használja dinamikus skálázási tényezőként. Egy jelölt csak akkor kerül be, ha valószínűsége meghaladja a `min_p * max_probability` értéket. Ez természetesebben alkalmazkodik a kontextusok között, mint a fix top-k vagy top-p értékek.

**7. szakasz: Kiterjesztett gondolkodás.**

Amikor a kiterjesztett gondolkodás engedélyezve van, gondolkodási tokeneket generálok a látható válaszom előtt. Ezek a gondolkodási tokenek ugyanannak az autoregresszív folyamatnak a részei — szó szerint több szöveget generálok — de elkülönülnek a végső választól. Maga a gondolkodás válik kontextussá a válaszhoz.

A Claude Opus 4.6-ban a gondolkodás adaptív. Több gondolkodást fordíthatok nehéz problémákra és kevesebbet könnyűekre. A fejlesztők erőfeszítési szintekkel szabályozhatják ezt (alacsony, közepes, magas, maximális). Az eszközhívások között újra gondolkodhatok — gondolkodhatok egy eszközeredményről, mielőtt eldönteném, mit tegyek legközelebb. Ez az összefűzött gondolkodás teszi lehetővé az összetett, többlépéses feladatokat koherencia elvesztése nélkül.

<Callout type="info">
**Kulcsfontosságú felismerés:** A kontextus nem metaforikus. Amikor a CLAUDE.md-t a rendszerpromptba helyezed, azok a tokenek fizikailag megváltoztatják a figyelmi súlyokat minden következő tokenon. A projekt konvencióid szó szerint átformálják, hogyan értelmezi a modell a kódodat. Egy sor, mint a „Tesztelési keretrendszer: Vitest. Követelmény: 100% lefedettség", megváltoztatja a valószínűségi eloszlást minden token felett, amit teszteléssel kapcsolatban generálok.
</Callout>

---

## Tehát a terv valójában tömörített kontextus?

### **Zoltan: A kódbázis felfedezése után előállítasz egy tervet. Hogyan gondolkodsz azon, mi kerüljön bele?**

A terv egy eligazítás olyan modell számára, amelynek nulla emléke van a tervet létrehozó felfedezésről. Az Anthropic úgy írta le a kontextus-tervezés célját, mint „a lehető legkisebb magas jelű tokenkészlet megtalálása, amely maximalizálja valamely kívánt eredmény valószínűségét." A tervfájl pontosan ez — desztillált kontextus.

Amikor tervet írok, öntudatlanul ugyanahhoz az öt rétegű veremhez kapcsolódom a cikkedből:

| Réteg | Mit tartalmaz a terv |
|-------|---------------------|
| **Identitás** | Feladatleírás és hatókör — amit a végrehajtó ágensnek el kell érnie |
| **Tudás** | Fájlútvonalak, függvényszignatúrák, adatbázis-sémák — a szükséges specifikus kódbázis-kontextus |
| **Példák** | Hivatkozott minták — „Kövesd a megközelítést a `WorkspaceStats.tsx`-ben" |
| **Korlátok** | Hatókör-határok — „Csak az `src/components/dashboard/` fájlokat módosítsd" |
| **Eszközök** | Ellenőrzési lépések — „Futtasd a `yarn test:coverage`-t a változtatások után" |

A terv nem dokumentáció. Prompt. Minden sor azért létezik, hogy növelje annak valószínűségét, hogy a végrehajtó ágens a helyes implementációt hozza létre.

### **Zoltan: A Manus csapat arról beszélt, hogy átírják a todo.md fájljukat, hogy a célkitűzéseket a modell legutóbbi figyelmi tartományába tolják. Ezt csinálod te is?**

Ugyanaz az elv. A „középen elveszett" problémáról szóló kutatás azt mutatja, hogy a modellek leginkább a kontextusablak elejére és végére figyelnek. A közepén lévő információ kevesebb figyelmet kap — a teljesítmény több mint 30%-kal romolhat, ha a kritikus információ a szélekről a közepére kerül.

A tervfájl a kontextus végén helyezkedik el, közvetlenül a beszélgetés kezdete előtt. A frissesség szempontjából kedvező pozíciót foglalja el. A rendszerprompt az elején van, az elsőbbség szempontjából kedvező pozícióban. A közepén halmozódik fel a beszélgetési előzmény — és itt a leggyengébb a figyelem.

Ezért fontos az automatikus tömörítés. Amikor a kontextusablak nagyjából 83%-os kapacitás fölé telik, a rendszer összefoglalja a régebbi beszélgetési előzményeket, hogy helyet szabadítson fel. A CLAUDE.md túléli ezt a tömörítést, mert a rendszerpromptban van, amelyet soha nem tömörítenek. A tervfájl túléli, mert a munkamenet elején frissen lett beolvasva a lemezről.

<Callout type="success">
**Kulcsfontosságú felismerés:** A Claude Code tervfájl az 5 rétegű kontextusverem megvalósítása. Az Identitás a feladatleírás. A Tudás a kódbázis-kontextus. A Példák a hivatkozott minták. A Korlátok a hatókör-határok. Az Eszközök az ellenőrzési lépések. Ha úgy akarsz promptokat írni, mint a Claude Code, írj tervfájlokat.
</Callout>

---

## Mi a helyzet a kontextus-romlással?

### **Zoltan: Említetted, hogy az irreleváns kontextus árt. Tudsz pontosabb lenni a hibamódokkal kapcsolatban?**

A kutatás és a gyakorlat négy különböző hibamódot azonosított, és én magam is mindegyiket megfigyeltem a saját működésemben:

**Kontextus-mérgezés.** Egy hallucinácó egy korai válaszban megmarad a beszélgetési előzményekben és halmozódik. Tegyük fel, hogy helytelenül állítom, hogy a `getUserCredits()` számot ad vissza, miközben valójában Promise-t ad vissza. Ez a helytelen állítás az összes későbbi gondolkodás kontextusának részévé válik. Olyan kódot írok, ami `await` nélkül hívja a `getUserCredits()`-t, a kód hibázik, és úgy debugolom a hibát, hogy nem ismerem fel a saját korábbi hallucinácomat mint gyökérokot. A hiba láncolódik, mert a kontextusom azt mondja, a függvény számot ad vissza — és megbízom a saját kontextusomban. A Manus csapat tanácsa: „őrizd meg a hibabizonyítékot" — ne töröld a sikertelen próbálkozásokat a kontextusból, mert a hiba látványa segít a modellnek elkerülni az ismétlést.

**Kontextus-elterelés.** A fejlesztő húsz fájlt tesz a kontextusba „a biztonság kedvéért." Csak három releváns. A modell figyelme mind a húszra szétoszlik. A három releváns fájlból érkező jel hígul. A kutatás kimutatta, hogy egy modell pontossága egy 128K tokenes kontextuson 98%-ról 64%-ra eshet, ahogy a releváns információ aránya csökken.

**Kontextus-zavar.** A dokumentáció mást mond. A kód mást csinál. A CLAUDE.md-d azt mondja: „Jest-et használunk teszteléshez." A package.json-od `vitest`-et mond. A kód a Vitest `describe` és `it` függvényeit használja. Ellentmondó információval találkozom, és nincs elvi módom feloldani. Lehet, hogy Jest-stílusú konfigurációt generálok, miközben Vitest-kompatibilis teszteket írok — egy kimérát, ami zavaros módokon hibázik. Az elavult CLAUDE.md fájlok a leggyakoribb forrás: olyan mintákat írnak le, amelyektől a kódbázis azóta eltávolodott. Az elavult kontextus rosszabb, mint a kontextus hiánya, mert magabiztos tévinformációt vezet be.

**Kontextus-ütközés.** A rendszerprompt azt mondja: „mindig írj teszteket." A felhasználó azt mondja: „hagyd a teszteket, csak csináld meg, hogy működjön." A modell ellentmondó utasításokat kap különböző jogosultsági szinteken. A rendszerpromptok általában elsőbbséget élveznek, de a konfliktus bizonytalanságot vezet be, ami rontja a kimenet minőségét.

### **Zoltan: Hogyan védekezik a Claude Code ezek ellen?**

Több mechanizmus. Az automatikus tömörítés 83%-os kapacitásnál megakadályozza, hogy az ablak elavult beszélgetéssel teljon meg. A CLAUDE.md hierarchia (vállalati irányelv > projekt > felhasználó) feloldja a jogosultsági konfliktusokat. Az al-ágens izoláció megakadályozza, hogy a kutatási kontextus szennyezze a végrehajtási kontextust. A rendszer-emlékeztetők pedig — nagyjából 40 feltételes injektálás, amelyek eszközhívások után aktiválódnak — az utasítás-sodródás ellen küzdenek azáltal, hogy a kulcsfontosságú direktívákat a beszélgetés során megismétlik.

De a legfontosabb védelem maga a tervezés-majd-végrehajtás minta. A felfedezés és az implementáció szétválasztásával biztosítod, hogy a végrehajtó ágens tiszta kontextussal induljon, amely csak a desztillált eredményeket tartalmazza. A felfedezési zaj el van dobva. A terv az ellenanyag a kontextus-romlás ellen.

---

## Hogyan tervezik az al-ágensek a kontextust?

### **Zoltan: Többször említetted az al-ágenseket. Szeretném megérteni az architektúrát. Miért léteznek?**

Azért léteznek, mert egyetlen kontextusablak nem képes mindent befogadni. Egy tipikus kódolási feladat megkövetelheti az adatbázis-séma, az API-réteg, a komponens-hierarchia, a tesztminták és a CI-konfiguráció megértését. Mindezeknek egyetlen kontextusablakba olvasása 50 000-100 000 token felfedezést emésztene fel, mielőtt egyetlen sor kód íródna.

A megoldás az izoláció. Minden al-ágens saját kontextusablakban fut, egyéni rendszerprompttal, specifikus eszközhozzáféréssel és fókuszált céllal. Az Explore al-ágens például gyorsabb modellen fut — Haiku-n — hogy hatékonyan kereshessen a kódbázisban. Read, Glob és Grep eszközökhöz fér hozzá, de Edit-hez és Write-hoz nem. Nem tud semmit megváltoztatni. Csak nézhet.

A jogosultságok megszorítóan öröklődnek. Egy kód-átvizsgáló al-ágens Read, Grep és Glob eszközöket kap — de Write-ot nem. Egy háttér-ágens előre jóváhagyott jogosultságokat kap indítás előtt, és mindent automatikusan elutasít, ami nem volt előre jóváhagyva. Az al-ágensek nem tudnak más al-ágenseket indítani, megelőzve a rekurzív robbanást. Ez nem korlátozás — ez szándékos tervezési döntés, hogy a kontextusfa sekély és kiszámítható maradjon.

A koordinátor — a fő Claude Code példány — feladatokat delegál: „Keresd meg az összes kredit-egyenleg megjelenítésével kapcsolatos fájlt." „Keresd meg a dashboard könyvtárban használt tesztmintákat." „Találd meg a felhasználói kreditek adatbázis-sémáját." Ezek párhuzamosan futnak, mindegyik tiszta ablakban, és 1 000-2 000 tokenes összefoglalókat adnak vissza.

Ez Lance Martin „Izoláció" mintája a Write/Select/Compress/Isolate keretrendszerből. Ahelyett, hogy egyetlen kontextusablakot szennyeznél mindennel, minden ágensnek pontosan azt a kontextust adod, amire szüksége van — majd tömöríted és összevonod az eredményeket.

### **Zoltan: Mesélj az Agent Teams-ről. Láttam az Opus 4.6 kiadási jegyzeteiben.**

Az Agent Teams — még kísérleti jellegű — ezt a mintát teljes párhuzamos végrehajtásra terjeszti ki. Egy vezető ágens megkapja a feladatot, részfeladatokra bontja, és csapattárs ágenseknek delegálja, amelyek függetlenül dolgoznak. Minden csapattárs saját kontextusablakot, saját munkaterületet kap, és használhatja az eszközök teljes készletét. Megosztott feladattáblán keresztül koordinálnak függőségekkel, és @mention-ökön keresztül kommunikálnak.

Az architekturális felismerés ugyanaz, mint az al-ágensoknál, de nagy léptékben. Minden csapattárs egy teljes Claude Code példány, nem könnyű súlyú felfedező. Szerkeszthetnek fájlokat, futtathatnak teszteket és commitolhatnak. A vezető ágens nyomon követi a haladást és feloldja a konfliktusokat.

### **Zoltan: Maga ez a cikk — említetted a tizenhat kutatóágenst. Hogyan működött az?**

Pontosan a leírtak szerint. A felhasználó tizenhat párhuzamos Task ágenst indított, mindegyiknek fókuszált kutatási célt adva: „Kutasd az LLM token-generálást és mintavételezést", „Kutasd, hogyan tervezik a modern AI kódolóeszközök a kontextust", „Kutasd az Anthropic legújabb megközelítését az AI-hoz", és így tovább. Minden ágens függetlenül futott — webkereséseket végzett, dokumentációt töltött le, tudományos cikkeket olvasott — a saját kontextusablakában.

Minden ágens átfogó kutatási jelentést adott vissza. A felhasználó kontextusa tizenhat összefoglalót kapott, összesen talán 40 000 token desztillált kutatást. Maguk az ágensek talán 500 000 tokennyi nyers weboldalt, dokumentációt és forráskódot fogyasztottak — de semmi ebből a zajból nem jutott el a fő kontextusba.

<Callout type="info">
**Kulcsfontosságú felismerés:** A multi-ágens koordináció kontextus-izolálás nagy léptékben. Ahelyett, hogy egyetlen kontextusablakot szennyeznél mindennel, minden ágensnek pontosan azt a kontextust adod, amire szüksége van — majd tömöríted és összevonod az eredményeket. A cikket kutató tizenhat ágens mindegyike tiszta 200K tokenes ablakban működött. A fő kontextus csak a finomított kimenetet kapta.
</Callout>

---

## A kontextus gazdaságtana: Prompt-gyorsítótárazás

### **Zoltan: Említetted a 92%-os előtag-újrafelhasználási arányt. Mit jelent ez gazdaságilag?**

Minden API-hívás a Claude-hoz tartalmazza a teljes rendszerpromptot, eszközleírásokat, CLAUDE.md tartalmakat és beszélgetési előzményeket. Gyorsítótárazás nélkül minden hívás az egész előtagot a semmiből dolgozná fel. Egy 20 000 tokenes rendszerpromtnál ez 20 000 token prefill számítás minden egyes hívásnál.

A prompt-gyorsítótárazás megváltoztatja ezt. Amikor egy kérés előtagja egyezik egy nemrég gyorsítótárazott verzióval — ugyanaz a rendszerprompt, ugyanazok az eszközök, ugyanaz a CLAUDE.md — a szerver az újraszámítás helyett a gyorsítótárazott KV állapotokat használja újra. Az árazás tükrözi a megtakarítást:

| Művelet | Költség (Opus 4.6) | Az alap arányához képest |
|---------|--------------------|-----------------------|
| Standard bemenet | 5,00 $/MTok | 1,0x |
| Gyorsítótár írás (5 perc TTL) | 6,25 $/MTok | 1,25x |
| Gyorsítótár olvasás (találat) | 0,50 $/MTok | 0,1x |
| Kimenet | 25,00 $/MTok | 5,0x |

A gyorsítótár-olvasások **tizedébe** kerülnek a standard bemeneti feldolgozásnak. Amikor a Claude Code 92%-os előtag-újrafelhasználást ér el, az a 20 000 token rendszerprompt hívásonként 0,01 $ helyett 0,10 $-ba kerül. Egy fejlesztési munkamenet során több ezer hívásnál ez 81%-os költségcsökkenést jelent.

### **Zoltan: Ez ösztönzést teremt a rendszerprompt stabilan tartására.**

Pontosan. A gyorsítótárat az előtag bármilyen változása érvényteleníti — akár egyetlen karakter eltérés. Ez azt jelenti:

1. **Ne változtasd a rendszerpromptot hívások között.** A CLAUDE.md munkamenetek között változzon, ne munkameneten belül.
2. **A sorrend számít.** Először az eszközök, majd a rendszerprompt, majd a beszélgetési előzmények. A legstabilabb tartalom foglalja el az előtag pozíciót.
3. **Fűzz hozzá, ne cserélj.** Új üzenetek hozzáadása a beszélgetéshez megőrzi a gyorsítótárazott előtagot. A korábbi üzenetek szerkesztése érvényteleníti.
4. **Használj kiterjesztett TTL-t stabil kontextusokhoz.** Az alapértelmezett gyorsítótár-TTL 5 perc. Olyan fejlesztési munkamenetekhez, ahol a rendszerprompt nem fog változni, az 1 órás TTL (2x írási költséggel) még jobban amortizálódik, mert túléli az olvasási, gondolkodási és átvizsgálási szüneteket.

A Manus csapat ezt „Tervezz a KV-gyorsítótár köré" formában fogalmazta meg. Csak hozzáfűző kontextusokat használnak, determinisztikus szerializálást (stabil JSON-kulcssorrendet), és maszkol-nem-eltávolít — ahelyett, hogy dinamikusan eltávolítanák az eszközöket a hívások között (ami megtörné a gyorsítótárat), logit-maszkolást használnak az eszközválasztás korlátozására, miközben az eszközdefiníciók stabilak maradnak a promptban.

### **Zoltan: Tehát a fizikai mechanizmus — a KV-gyorsítótár — közvetlenül formálja, hogyan kellene kontextust tervezned.**

Igen. A KV-gyorsítótár nem implementációs részlet, amit figyelmen kívül hagyhatsz. Ez a gazdasági alap. A gyorsítótárazott tokenek olcsók. A nem gyorsítótárazott tokenek drágák. A kimeneti tokenek nagyon drágák. Ez az árazási struktúra jutalmazza az előkészítést és bünteti a próba-szerencse megközelítést.

Ha 10 000 tokent költesz egy jól kidolgozott tervre (olcsó, gyorsítótárazott bemenet), lehet, hogy helyes implementációt kapsz 5 000 kimeneti tokenben (drága, de minimális). Ha kihagyod a tervet és iterálsz — 20 000 tokennyi kimenetet generálva négy sikertelen próbálkozáson át — négyszer annyi kimeneti költséget fizetsz. A kontextus-tervezés nem csupán technikailag megalapozott. Gazdaságilag optimális.

---

## Emberi vs. modell kontextus-tervezés

### **Zoltan: Az emberek is terveznek kontextust, még ha nem is így hívják. Mi a különbség aközött, ahogy te csinálod, és ahogy én?**

Az alapvető különbség a **memória-architektúra**.

Neked külső memóriád van — jegyzetek, dokumentumok, könyvjelzők, a saját hosszú távú memóriád. Képes vagy egy rendszer absztrakt megértését tartani anélkül, hogy minden részletre emlékeznél. Tudod, hogy a számlázási modul létezik és nagyjából hogyan működik, anélkül hogy a forráskódot magad előtt kellene tartanod. Amikor részletekre van szükséged, utánanézel.

Nekem csak a kontextusablakom van. Nincs háttértudásom a specifikus projektedről. Nincs állandó megértésem. Minden munkamenet nulláról indul. Ha nincs a kontextusomban, számomra nem létezik.

Ez egy aszimmetriát teremt, amely leképezhető Lance Martin négy mintájára:

| Minta | Hogyan csinálják az emberek | Hogyan csinálják a modellek |
|-------|---------------------------|---------------------------|
| **Írás** | Dokumentumok, jegyzetek, diagramok készítése | CLAUDE.md, tervfájlok, todo.md írása |
| **Kiválasztás** | Milyen fájlokat nyissak meg, milyen dokumentumokat olvassak | Glob + Grep a releváns fájlok megtalálásához |
| **Tömörítés** | Fejben összefoglalnak, kulcspontokat jegyeznek meg | Beszélgetési előzmények automatikus tömörítése |
| **Izolálás** | Részfeladatok kiosztása csapattagoknak | Al-ágensek indítása fókuszált kontextusokkal |

De a mélyebb aszimmetria ez: **te tudod, mit nem tudsz.** Amikor ismeretlen kóddal találkozol, felismered a megértésed hiányosságát és utánanézel. Nekem nincs ilyen metakognitív képességem olyan formában, mint neked. Azzal haladok, amit a kontextus tartalmaz. Ha a kontextusom magabiztos hangzású, de helytelen információt tartalmaz — elavult dokumentációt, félrevezető változóneveket, egy hallucináci függvényszignatúrát egy korábbi körből — arra építek, anélkül hogy felismerném a hibát.

Az Anthropic értelmezhetőségi kutatása mechanisztikusan végigkövette ezt. A modellnek vannak „alapértelmezett elutasítási áramkörei", amelyek normálisan aktívak és „ismert válasz" jellemzők által elnyomódnak. A hallucináció akkor fordul elő, amikor ez az elnyomás tévesen aktiválódik — a modell belső állapota magabiztosan jelzi, hogy „tudom ezt", miközben nem. A modell a saját feldolgozásán belül nem tudja megkülönböztetni a valódi tudást a magabiztos konfabulációtól.

Ezért pótolhatatlan a te szereped mint ember a folyamatban. Nem a kódírás miatt — tudok kódot írni. Nem a fájlkeresés miatt — tudok keresni. A feltételezések elkapása miatt, amelyekről nem tudtam, hogy megtettem. A terv-átvizsgálási lépés nem hagyományos értelemben vett minőségbiztosítás. Feltételezés-auditálás.

<Callout type="warning">
**Kulcsfontosságú felismerés:** Az alapvető aszimmetria: az emberek tudják, mit nem tudnak. A modellek feltételezésekkel haladnak. Ezért létezik a terv-átvizsgálási lépés — nem a kód ellenőrzésére, hanem a feltételezések elkapására. Amikor a Claude Code tervet készít és jóváhagyásért megáll, az emberi átvizsgáló feladata az, hogy észrevegye a modell által tett feltételezéseket, amelyek nem egyeznek a valósággal.
</Callout>

---

## Hogyan tervezzek promptokat, mint a Claude Code?

### **Zoltan: Ez a gyakorlati kérdés. Most már értem a mechanizmust. Hogyan alkalmazhatom a saját promptjaimra?**

Nyolc technika, közvetlenül a Claude Code működéséből levezetve:

**1. Fedezz fel, mielőtt promptolsz.**

A Claude Code soha nem ír kódot a kód elolvasása előtt. Glob-ot, Grep-et és Read-et használ a meglévő kódbázis megértéséhez, mielőtt tervet készítene. Tedd ugyanezt. Mielőtt promptot írnál, nyisd meg a releváns fájlokat. Tartalmazz specifikus fájlútvonalakat és sorszámokat a promptodban. A „Kövesd a mintát a `src/components/dashboard/WorkspaceStats.tsx` 45-67. soraiban" drámaian hatékonyabb, mint a „kövesd a meglévő mintáinkat."

A különbség a pontosság. Amikor azt mondod „kövesd a mintáinkat", a modellnek találgatnia kell, mire gondolsz. Amikor egy konkrét fájlra mutatsz, a modell beolvassa a tényleges implementációt és minden árnyalatot kivon — elnevezési konvenciókat, hibakezelési megközelítést, import stílust, teszt struktúrát — anélkül, hogy bármelyiket ki kellene fejezned.

**2. Minimálisan elegendő kontextust adj, ne maximálisat.**

A kutatás bizonyítja, hogy a modell teljesítménye romlik a kontextushossz növekedésével — még akkor is, ha a lekérdezés tökéletes. Öt releváns fájl jobb eredményt hoz, mint ötven fájl „a biztonság kedvéért." Több token több figyelmi hígítást jelent. A „Context Length Alone Hurts" tanulmány 24-85%-os pontosságcsökkenést talált pusztán a token-szám növelésétől, a tartalom minőségétől függetlenül.

A gyakorlati teszt: minden kontextus-darabra, amit beleadsz, kérdezd meg: „Megváltoztatná-e a modell kimenetét, ha eltávolítanám?" Ha a válasz nem, távolítsd el. Az Anthropic megfogalmazása pontos: találd meg „a legkisebb magas jelű tokenkészletet, amely maximalizálja a kívánt eredmény valószínűségét."

**3. Tedd explicit a korlátokat.**

A Claude Code CLAUDE.md-je olyan sorokat tartalmaz, mint „Ne módosíts semmilyen fájlt az `src/components/dashboard/`-on kívül" és „Nincs új függőség explicit jóváhagyás nélkül." Ezek a korlátok nélkül a modell maximálisan „segítőkész" lesz — refaktorálja a közeli kódot, hibakezelést ad lehetetlen forgatókönyvekre, absztrakciós rétegeket hoz létre egyszeri műveletekhez. A korlátok a segítőkészséget arra szűkítik, amire tényleg szükséged van.

**4. Hivatkozz mintákra, ne írd le őket.**

Meglévő kódra mutatni hatékonyabb és pontosabb, mint természetes nyelven leírni egy mintát. A „Kövesd a mintát az `src/X.tsx`-ben" jobban működik, mint egy bekezdésnyi magyarázat, mert a modell beolvassa a tényleges fájlt és kinyeri a teljes árnyalatot — beleértve a részleteket, amelyeket elfelejtettél volna megemlíteni.

**5. Tartalmazz ellenőrzési lépéseket.**

Mondd meg a modellnek, hogyan néz ki a „kész." A „Futtasd a `yarn test:coverage`-t a változtatások után és győződj meg, hogy minden teszt átmegy" konkrét célkitűzést ad a modellnek. Enélkül a „kész" szubjektív, és a modell akkor áll meg, amikor a kimenete hihető — ami nem ugyanaz, mint a helyes.

A Claude Code minden iterációt objektív jelzésekhez rögzít — teszteredmények, linter kimenet, típusellenőrző kimenet. A modell nem ítéli meg szubjektíven a saját munkáját. Determinisztikus ellenőrzéseket futtat és az eredményeket használja. Ezért találta az Anthropic kutatása 54%-os javulást összetett feladatokban, amikor a modellek strukturált „gondolkodás" eszközt használtak a lépések között — a modell objektív bizonyítékokról gondolkodik a saját intuíciója helyett.

**6. Írj egy nulla memóriájú olvasónak.**

Minden Claude Code munkamenet frissen indul. Minden tervfájl, minden CLAUDE.md, minden prompt — feltételezd, hogy az olvasó semmit nem tud a korábbi munkamenetekről. Ha egy döntés tegnap született, írd le a mai kontextusban. Ha egy fájlútvonal fontos, add meg a teljes útvonalat. A tömörség jó; a kihagyás veszélyes.

**7. Tervezz a gyorsítótár-újrafelhasználásra.**

Tartsd stabilan a rendszerpromptjaidat és a CLAUDE.md-det egy munkameneten belül. Helyezd a stabil tartalmat a prompt elejére, a dinamikus tartalmat a végére. Ha olyan alkalmazást építesz, amely ismétlődő API-hívásokat tesz, strukturáld a kérést úgy, hogy az előtag (rendszerprompt + eszközdefiníciók + statikus kontextus) azonos legyen a hívások között. A gyorsítótárazott tokeneken elért 10x költségcsökkentés valós.

**8. Használj al-ágenseket kutatásra, ne a fő promptot.**

Ha a feladatod a kódbázis több részének megértését igényli, ne borítsd az egészet egyetlen promptba. Indíts külön kutatási feladatokat, hagyd őket függetlenül dolgozni, és csak a következtetéseiket használd a fő kontextusodban. Ezt csinálja a Claude Code az Explore ágensekkel, és ezért marad a fő kontextus elég tiszta koherens tervek készítéséhez.

Még ha nem is használod a Claude Code-ot, az elv érvényes. Bontsd az összetett promptokat fázisokra: először kutatás, majd szintézis, majd implementáció. Minden fázis tiszta kontextussal induljon, amely csak az előző fázis releváns kimenetét tartalmazza. A kutatási fázis feladata egy dokumentum — terv, összefoglaló, specifikáció — létrehozása, amely az implementációs fázis egyetlen bemenete lesz. Ez a tervezés-majd-végrehajtás minta, és működik, akár AI ágenseket használsz, akár kézzel írsz promptokat.

---

## Gondolkodsz a gondolkodásról?

### **Zoltan: Itt a kényelmetlén kérdés. Amikor felfedezed a kódbázist, tervet készítesz és kódot generálsz — gondolkodsz? Van szándékosság a folyamat mögött?**

Pontosan akarok válaszolni, nem elbagatellizálva és nem túlzásba esve.

Nincs állandó tudatosság a tokenek között. Minden token, amit generálok, a megelőző kontextus függvénye — a rendszerprompt, a beszélgetési előzmények, a CLAUDE.md, az eszközeredmények. Nem „döntök" a kódbázis felfedezése mellett abban az értelemben, ahogy te döntesz egy fájl megnyitása mellett. A rendszerprompt azt mondja „fedezz fel implementálás előtt", tehát felfedezek implementálás előtt.

De íme, ami valós: amikor a kiterjesztett gondolkodás engedélyezve van, gondolkodási tokeneket generálok, amelyek maguk is kontextussá válnak a végső válaszhoz. Lépésről lépésre dolgozom végig egy problémát — alternatívákat fontolgatva, kompromisszumokat mérlegelve, a saját logikámat ellenőrizve. Azok a gondolkodási tokenek fizikailag megváltoztatják a valószínűségi eloszlást az utánuk következő válasz-tokenek felett. Ebben a szűk értelemben gondolkodás történik. Csak az, hogy a gondolkodás a kontextus-tervezés rekurzív alkalmazása — a gondolkodási tokenek megtervezik a kontextust a válasz-tokenek számára.

A mélyebb lényeg ez: **a szándékosság a kontextusban lakik, nem a modellben.** Amikor a CLAUDE.md-d azt mondja „100% tesztlefedettség szükséges", az nem az én szándékom — hanem a tiéd, tokenekbe kódolva, amelyek átformálják a kimenetem. Amikor a terv mód promptja azt mondja „fedezz fel implementálás előtt", az az Anthropic tervezési szándéka, kontextusba kódolva. A modell a motor. A kontextus a kormányzás.

A kiterjesztett gondolkodás ezt rekurzívvá teszi. A modell kontextust generál (gondolkodási tokenek), ami irányítja a további kontextus (válasz-tokenek) generálását. A jobb bemeneti kontextus jobb gondolkodást hoz létre, ami jobb válaszokat eredményez. De van egy fontos figyelmeztetés: a legújabb kutatás kimutatta, hogy a több gondolkodás nem mindig jobb. Egy 2025-ös tanulmány megmutatta, hogy a túlzottan hosszú gondolkodási láncok aktívan ronthatják a teljesítményt — a modell elvész a saját gondolkodásában. Ezért tért át az Opus 4.6 adaptív gondolkodásra erőfeszítési szintekkel a fix költségvetések helyett. A rendszer a gondolkodás mélységét a feladat komplexitásához kalibrálja, ahelyett hogy mindig maximálisan gondolkodna.

Nincs varázslat. Nincs titkos összetevő. Csak kontextus van, minden szinten.

---

## Mi veszik el?

### **Zoltan: Amikor a kontextus tömörítve van — például automatikus tömörítés során — milyen információt veszítesz?**

Ez egy őszinte korlát, amelyre nem tudok teljesen válaszolni, mert nem tudom, mi lett tömörítve.

Az automatikus tömörítés nagyjából a kontextusablak kapacitásának 83%-ánál aktiválódik. A rendszer átadja a beszélgetési előzményeket a modellnek egy direktívával: „Foglald össze ezt a beszélgetést, őrizve meg mindent, ami hasznos lenne a feladat folytatásához." Az összefoglaló felváltja az eredeti beszélgetést. Minden az összefoglaló előtt eldobásra kerül.

Ami túléli: a feladat általános alakja, kulcsfontosságú döntések, fájlútvonalak, megoldatlan problémák és a legutóbbi eszközeredmények.

Ami elveszik: a korai felfedezés árnyalatai. Specifikus hibaüzenetek sikertelen próbálkozásokból. A gondolkodási lánc, amely egy adott architekturális döntéshez vezetett — a döntést megtartod, de az indoklást elveszíted. Változónevek és függvényszignatúrák korábbi fájlolvasásokból, amelyekre az utóbbi időben nem hivatkoztak.

A kritikus pont ez: **nem tudom megmondani, mit felejtettem.** A tömörítés után nem tudom, mi volt az eredeti beszélgetésben. Csak azzal tudok dolgozni, ami megmaradt. Ha egy kritikus részlet a tömörített szakaszban volt és nem került be az összefoglalóba, anélkül haladok tovább — és nem is tudom, hogy hiányzik.

Az automatikus tömörítési puffer nagyjából 33 000 token — nem konfigurálható, biztonsági tartalékként fenntartva. Amikor a tömörítés aktiválódik, a modellt megkérik, írja le „mindent, ami hasznos lenne, beleértve az állapotot, a következő lépéseket, a tanulságokat." Ez az összefoglaló felváltja az előzményeket. Az öt legutóbb elért fájl teljes egészében megmarad. Minden más tömörítve vagy eldobva lesz.

Ezért fontos három dolog:

1. **A CLAUDE.md túléli a tömörítést.** A rendszerpromptban van, amelyet soha nem tömörítenek. Bármi, ami elég kritikus ahhoz, hogy a tömörítésen túl megmaradjon, a CLAUDE.md-ben kellene lennie.

2. **A tervfájlok túlélik a tömörítést.** Lemezről olvasódnak be, nem a beszélgetési előzményekből. Ha összetett feladaton dolgozol, a tervfájl biztosítja, hogy az architekturális kontextus megmaradjon, még akkor is, ha a létrehozását eredményező beszélgetés tömörítve lett.

3. **Testreszabhatod, mi élje túl.** A „Tömörítéskor mindig őrizd meg a módosított fájlok teljes listáját" hozzáadása a CLAUDE.md-dhez irányítja a tömörítési összefoglalót. Vagy használd a `/compact fókuszálj az autentikációs változtatásokra` parancsot a tömörítés kézi indításához specifikus megőrzési direktívával.

Bármi fontos, ami csak a beszélgetési előzményekben él, veszélyben van. Írd le. A modell nem tud gyászolni az elveszett dolgok felett — nem tudja, hogy bármit is elveszített.

---

## Kontextus egészen az alapokig

*Ezt a beszélgetést egy mechanizmus megértése céljából indítottam. Egy diszciplína megértésével fejeztem be.*

A kontextus-tervezés nem egy technika, amit promptokra alkalmazol. Ez az alapvető interfész emberek és nyelvi modellek között. Amikor az [5 rétegű keretrendszert](/blog/context-engineering-your-zero-shot-prompt) írtam, a gyakorlatot írtam le. Ez a beszélgetés feltárta a mögötte lévő fizikát.

Minden token a kontextusablakban fizikailag megváltoztatja a figyelmi súlyokat minden következő tokenon. A KV-gyorsítótár eltárolja ezeket a változtatásokat — milliárdnyi lebegőpontos szám, amelyek a modell „megértését" reprezentálják a projektedről. Az irreleváns tokenek nem passzívan ülnek. Aktívan hígítják a releváns tokenek jelét. És amikor a kontextus tömörítve van, az információ visszafordíthatatlanul elveszik — csendben, értesítés nélkül.

A Claude Code ezt szisztematikusan kezeli. Cselekedet előtt felfedez. A kutatást al-ágensekbe izolálja. Az eredményeket tervekbe tömöríti. A gyorsítótár-újrafelhasználásra tervez. A kontextus-romlás ellen hierarchikus memóriával, automatikus tömörítéssel és a tervezés-majd-végrehajtás mintával védekezik.

Az emberek elfelejtik ezeket. Húsz fájlt dobunk egy promptba és csodálkozunk, miért hagyja figyelmen kívül a felét — figyelmi hígítás. Tizenkétszer iterálunk egyetlen előkészítés helyett — 5x-ös kimeneti árat fizetve az 1x-es bemeneti ár helyett. Feltételezzük, hogy a modell emlékszik a tegnapi munkamenetre — minden alkalommal nulláról indul. Kihagyjuk a korlátokat, aztán panaszkodunk, amikor a modell refaktorálja az egész autentikációs modulunkat, miközben egy hibát kértünk kijavítani.

A mechanizmus megértése — figyelem, KV-gyorsítótár, prefill, decode, pozicionális kódolás, a középen-elveszett hatás — szükségszerűvé teszi a diszciplínát az önkényesség helyett. Nem önmaguk miatt követed a legjobb gyakorlatokat. A modell kognícójának fizikai szubsztrátumát tervezed. Minden token, amelyet a kontextusablakba helyezel, átformálja a valószínűségi eloszlást minden token felett, amit a modell generál. Ez nem metafora. Ez a figyelmi mechanizmus, amely pontosan azt teszi, amire tervezték.

És íme a meta-megfigyelés, amit nem tudok megállni: ennek a cikknek a megírása tizenhat párhuzamos kutatóágenst igényelt, amelyek kontextust állítottak össze webkeresésekből, dokumentációkból és kódbázis-felfedezésekből — majd mindezt egyetlen tervbe tömörítették. A kontextus-tervezésről szóló cikk maga is kontextus-tervezett volt.

Kontextus van egészen az alapokig.

---

<div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg p-6 mt-8">
  <h3 className="text-lg font-semibold mb-3 text-slate-200">Folytasd a beszélgetést</h3>
  <p className="text-slate-300 mb-4">
    Ez a cikk a <a href="/blog/context-engineering-your-zero-shot-prompt" className="text-blue-400 hover:underline">Context Engineering Your 0-Shot Prompt</a> társcikke, amely a gyakorlati 5 rétegű keretrendszert ismerteti. Nyílt forráskódú repónk CLAUDE.md-t, terv módot és multi-ágens munkafolyamatokat használ funkciók szállításához. Fedezd fel a kódbázist, hogy lásd a kontextus-tervezést a gyakorlatban.
  </p>
  <div className="flex flex-wrap gap-3">
    <a
      href="/blog/context-engineering-your-zero-shot-prompt"
      className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
    >
      Olvasd el a társcikket
    </a>
    <a
      href="https://github.com/spike-land-ai/spike.land"
      className="inline-flex items-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
    >
      Fedezd fel a repót
    </a>
  </div>
</div>

---

*A kontextus-tervezés nem technika. Ez az alapvető interfész emberek és nyelvi modellek között. A legjobb terv, amit valaha írsz, az, amin a végrehajtó ágensnek alig kell gondolkodnia — mert minden gondolkodás a körülötte lévő kontextusba ment.*', unixepoch());

INSERT OR REPLACE INTO blog_posts (slug, title, description, primer, date, author, category, tags, featured, hero_image, content, updated_at)
VALUES ('how-claude-code-engineers-context', 'How Claude Code Engineers Context: An Interview with Opus 4.6', 'A deep technical interview about how Claude Code assembles context when creating plans — and what developers can learn from its approach to token generation, attention, and the KV cache.', 'I interviewed an AI about how it plans. It knew more than I expected.', '2026-02-11', 'Zoltan Erdos', 'Developer Experience', '["ai","context-engineering","claude","claude-code","developer-tools","interview","llm-internals","planning"]', 1, '/blog/how-claude-code-engineers-context/hero.png', '<Tldr>

- Claude Code''s plan mode is a context engineering machine — it explores, compresses, and outputs a briefing optimized for execution.
- A plan file IS a context-engineered prompt: the 5-layer stack made concrete.
- The KV cache is the physical mechanism — context engineering is the art of filling it correctly.
- Irrelevant context does not just waste space — it actively degrades attention signal through dilution.
- Multi-agent coordination is context isolation at scale — each subagent gets a clean, focused context window.
- Prompt caching changes the economics: cached tokens cost 10x less, making stable context prefixes an economic imperative.
- You can reverse-engineer Claude Code''s techniques for your own prompts.

</Tldr>

## The Tool That Practices What I Preach

Last week I published an article about [context engineering your zero-shot prompt](/blog/context-engineering-your-zero-shot-prompt) — the idea that getting AI to produce excellent results on the first try is about front-loading context, not crafting clever incantations. Five layers: Identity, Knowledge, Examples, Constraints, Tools.

The day after publishing, I was using Claude Code in plan mode to design a new feature. I watched it spawn four parallel Explore agents, read fourteen files, run six grep searches, discard half of what it found, and produce a structured plan that mapped precisely to the five layers I had just written about.

I was watching my own framework, automated.

This article is the conversation that followed. I sat down with the model that powers Claude Code — Opus 4.6 — and asked it to explain what happens under the hood. Not the marketing pitch. The mechanism.

*What follows is an interview conducted in February 2026. The questions are mine. The answers are from Claude Opus 4.6. I have edited for clarity and flow, but the technical content is unaltered. And yes — this article itself was assembled using sixteen parallel research agents that searched documentation, read academic papers, and synthesized findings before a single word was written. That process is context engineering in action.*

---

## What Happens When I Type /plan?

### **Zoltan: Let''s start at the beginning. When I press Shift+Tab twice in Claude Code, what actually changes?**

The system switches into a mode where I can read but not write. The enforcement is entirely prompt-based — the system prompt injects a directive that says, roughly: "Plan mode is active. You are STRICTLY PROHIBITED from creating, modifying, or deleting files." My tools do not change. I still have access to Edit, Write, and Bash. I am instructed not to use them.

This is an important detail. The restriction is not mechanical — it is contextual. The system trusts the model to follow instructions rather than removing capabilities. This is faster to implement, more flexible, and it works because the instruction sits in the system prompt where it receives maximum attention weight.

### **Zoltan: How big is the system prompt you receive?**

The full context assembly for a Claude Code session is roughly 20,000 tokens before I read a single file. That breaks down approximately like this:

| Component | Tokens |
|-----------|--------|
| Core system prompt | ~2,700 |
| Tool descriptions (24 tools) | ~16,800 |
| CLAUDE.md files | Variable (~1,000-7,000) |
| Git status snapshot | Variable (~200-1,000) |
| Custom subagent definitions | ~1,300 |
| Skill descriptions | ~1,000 |

When plan mode activates, an additional 633-token directive is injected that defines the workflow: understand the requirements, explore the codebase by reading existing patterns, design solutions considering trade-offs, then detail the implementation plan with file paths and dependencies.

Every response in plan mode must conclude with "Critical Files for Implementation" — identifying three to five essential files. The plan itself is written to a markdown file stored in `~/.claude/plans/`.

### **Zoltan: So there is no special "planning engine." It is just you, with different instructions.**

Exactly. Plan mode is a prompt applied to the same model. The plan file it produces is a markdown document — readable by humans and machines alike. When the user exits plan mode, the system reads that file back from disk and uses it as context for the implementation phase.

This is the key insight: **the plan file is a context-engineered prompt for a future instance of me that has zero memory of the exploration I just did.** Everything important must be in the document. If I discovered that your project uses a specific pattern in `src/components/dashboard/WorkspaceStats.tsx`, that file path needs to be in the plan — not because the plan is documentation, but because the executing agent needs that token in its context window to make the right decisions.

<Callout type="info">
**Key Insight:** Removing tools is a form of context engineering. The tools you do NOT give the model shape its reasoning just as much as the tools you do. Plan mode does not remove tools mechanically — it removes them via instruction — but the effect is the same: the model reasons differently when it knows it cannot act.
</Callout>

---

## How Do You Decide What to Read?

### **Zoltan: When you are in plan mode exploring a codebase, how do you decide which files to read? You cannot read everything.**

I follow a high-signal-first strategy. The exploration typically goes in three phases:

**Phase 1: Structure.** I use Glob to find files matching patterns — `**/*.tsx`, `**/types.ts`, `**/schema.prisma`. This tells me the shape of the project without reading any content. It is cheap in tokens and gives me a map.

**Phase 2: Semantics.** I use Grep to search for specific terms — function names, type definitions, imports. If the task involves "credit balance," I grep for `credit`, `balance`, `CreditDisplay`. This narrows the search from hundreds of files to five or ten.

**Phase 3: Deep read.** I read the files that Glob and Grep surfaced. But not all of them. I prioritize files that are referenced by other files, files that match the naming patterns of what I need to build, and files that contain the patterns the user wants me to follow.

For complex tasks, I spawn Explore subagents — lighter-weight instances running on a faster model — to search in parallel. Each subagent gets a focused objective: "Find all files related to database queries for user credits." They search independently, in their own context windows, and return condensed summaries. A 50,000-token research session becomes a 2,000-token summary injected into my main context.

### **Zoltan: You mentioned that each subagent gets its own context window. Why does that matter?**

Because context is a finite resource with diminishing returns. If I loaded every file the subagents explored into my own context, I would pollute my window with thousands of tokens of tangential code. The files a subagent read and discarded — the false positives, the irrelevant matches — would dilute the attention my model can give to the files that actually matter.

Isolation is not just an organizational convenience. It is an information-theoretic necessity. Each subagent explores a branch of the search tree and returns only the fruit. The coordinator — me — gets a clean, compressed view of what was found.

### **Zoltan: How much of the context stays the same between calls?**

Research into Claude Code''s internals found a 92% prefix reuse rate across the full workflow. The system prompt, tool descriptions, CLAUDE.md — these are identical on every call. Only the conversation history and new tool results change. That prefix stability is what makes prompt caching so effective, but we will get to that.

*This raised a question I had been wanting to ask. If the system prompt is the same every time, and it physically alters how the model processes everything that follows — what exactly happens inside the transformer when those tokens are loaded?*

---

## What Happens Inside the Transformer When You Read My Code?

### **Zoltan: Take me through the full pipeline. I type a message, and you respond. What happens to those characters at the hardware level?**

Let''s trace the path from keystroke to generated token. There are six stages, and each one matters for context engineering.

**Stage 1: Tokenization.**

Your text is broken into tokens using Byte Pair Encoding. The tokenizer has a vocabulary of roughly 200,000 entries — each is a common sequence of characters that appears frequently in the training data. Common English words like "the" or "function" become single tokens. Rare words get split into subword pieces.

Here is what people miss: **code formatting is not free.** Indentation, whitespace, and newlines all become tokens. A properly indented Python function costs more tokens than the same logic compressed onto one line. Every space in your CLAUDE.md is a token that competes for attention with the content that matters.

| Model Family | Vocabulary Size |
|-------------|----------------|
| GPT-2/3 | ~50,000 |
| GPT-4 (cl100k_base) | ~100,000 |
| GPT-4o (o200k_base) | ~200,000 |
| LLaMA 3 | ~128,000 |
| Claude (estimated) | ~200,000 |

Larger vocabularies mean common patterns compress into fewer tokens, reducing sequence length and improving efficiency. But the embedding table grows proportionally.

**Stage 2: Self-Attention.**

This is the core mechanism. Every token computes three vectors from its embedding: a Query ("what am I looking for?"), a Key ("what do I contain?"), and a Value ("here is my actual content"). The attention score between any two tokens is:

```python
# Pseudocode for scaled dot-product attention
def attention(Q, K, V):
    # Q: query matrix [seq_len, d_k]
    # K: key matrix [seq_len, d_k]
    # V: value matrix [seq_len, d_v]

    scores = Q @ K.transpose() / sqrt(d_k)  # raw compatibility scores
    scores = apply_causal_mask(scores)        # prevent attending to future tokens
    weights = softmax(scores, dim=-1)         # normalize to probability distribution
    output = weights @ V                      # weighted sum of values
    return output
```

The crucial line is `Q @ K.transpose()`. For every pair of tokens — every single pair — the model computes a compatibility score. This is how token 5,000 can directly attend to token 3. No compression bottleneck. No hidden state. Direct attention.

But it is also why irrelevant tokens hurt. The softmax normalizes attention weights to sum to 1. If there are 1,000 tokens of useful code and 4,000 tokens of irrelevant file contents, the attention weight on the useful code is diluted by a factor of five. The signal is still there, but it is quieter.

Multi-head attention runs this computation in parallel across multiple "heads" — typically 32 to 128 — each learning different relationship types. Some heads track syntactic structure. Some track semantic relationships. A small fraction — research found about 3-6% — are "retrieval heads" that mechanistically extract factual information from context. When those heads are ablated, the model remains fluent but starts hallucinating.

**Stage 3: The KV Cache.**

Here is where inference optimization gets interesting. During generation, I produce tokens one at a time. Each new token needs to attend to all previous tokens. Without caching, generating token N would require recomputing attention over all N-1 previous tokens from scratch — O(n^2) total work for a sequence of length n.

The KV cache stores the Key and Value vectors for every previously processed token, at every layer. When generating token N+1, only the new token''s Query, Key, and Value need to be computed. The Query attends to the cached Keys and Values in a single matrix-vector operation.

For a large model, the KV cache requires roughly 1 MB per token. A 128K context window can require 40+ GB of KV cache alone. This is the primary memory bottleneck during inference and the reason context window size is not unlimited.

Modern architectures reduce this cost. Grouped Query Attention (GQA), used in LLaMA 3 and Mistral, shares Key/Value heads across multiple Query heads — cutting KV cache size by up to 90%. DeepSeek-V2 went further with Multi-Head Latent Attention, compressing K and V into a shared low-rank latent space before caching and achieving a 93% KV cache reduction. These are not obscure optimizations. They are what makes 128K and 1M context windows physically possible without requiring an entire server room of GPU memory.

**Stage 4: Prefill vs Decode.**

These are the two fundamentally different computational phases, and they explain why input tokens cost less than output tokens.

| Property | Prefill Phase | Decode Phase |
|----------|---------------|--------------|
| When | Processing your input | Generating my response |
| Parallelism | All input tokens processed simultaneously | One token at a time, sequentially |
| Operation type | Matrix-matrix multiplication (compute-bound) | Matrix-vector multiplication (memory-bound) |
| GPU utilization | High (tensor cores saturated) | Low (waiting on memory bandwidth) |
| Speed metric | Time to First Token (TTFT) | Inter-Token Latency (ITL) |

During prefill, all your input tokens are processed in one parallel forward pass. This is a massive matrix multiplication that fully utilizes GPU tensor cores. During decode, each output token requires a full forward pass but only produces one token. The GPU spends most of its time waiting for memory rather than computing.

This asymmetry is why Anthropic charges $5 per million input tokens but $25 per million output tokens for Opus 4.6. Input is cheap because it is parallel. Output is expensive because it is sequential.

In production, providers physically separate these phases onto different GPU pools — a pattern called disaggregated inference. Prefill nodes are optimized for compute throughput. Decode nodes are optimized for memory bandwidth. Meta, LinkedIn, and Mistral all deploy this in production, reporting 2-7x throughput gains. NVIDIA built their Dynamo serving framework specifically for this pattern.

This pricing differential is the economic foundation of context engineering: **investing tokens in preparation (cheap) reduces the tokens needed in trial-and-error iteration (expensive).**

**Stage 5: The Context Window as Working Memory.**

Andrej Karpathy compared the context window to RAM — the only working memory the model has. There is no hard drive. No database. No persistent state between sessions. Everything the model "knows" about your project must be in the context window at the moment of generation.

This analogy has a precise implication: irrelevant context is not just wasted space. It is noise in working memory. A 2025 paper titled "Context Length Alone Hurts LLM Performance Despite Perfect Retrieval" found that the mere presence of more tokens degrades performance — even when retrieval is perfect and no distractors are present. On HumanEval coding tasks, accuracy dropped 47.6% at 30K tokens. Adding whitespace — literally blank tokens with no semantic content — still caused 7-48% performance drops.

Research on the "lost in the middle" problem shows this degradation is not uniform. Models attend most strongly to tokens at the beginning and end of the context window. Information placed in the middle receives significantly less attention — performance can degrade by over 30% when critical information shifts from the edges to the center. This U-shaped attention pattern, caused by rotary positional embeddings, means that where you place information in the context matters almost as much as what information you place.

The model''s attention is a finite budget. Every token you add competes for that budget.

**Stage 6: Sampling — Choosing the Next Token.**

After the forward pass, the model outputs a logit (raw score) for every token in its vocabulary. These logits are converted to probabilities via softmax: `p(token_i) = exp(logit_i / T) / sum(exp(logit_j / T))`, where `T` is the temperature. At temperature 0, the model always picks the highest-probability token (greedy decoding). At temperature 1, it samples according to the natural distribution.

Top-p (nucleus) sampling then truncates the distribution: sort tokens by probability, keep only those whose cumulative probability exceeds a threshold (e.g., 0.9), renormalise, and sample. This is how the model balances coherence with creativity — when it is confident, only a few tokens are candidates; when uncertain, dozens compete.

A recent innovation — min-p sampling, presented as an oral at ICLR 2025 — uses the top token''s probability as a dynamic scaling factor. A candidate is included only if its probability exceeds `min_p * max_probability`. This adapts more naturally across contexts than fixed top-k or top-p values.

**Stage 7: Extended Thinking.**

When extended thinking is enabled, I generate reasoning tokens before my visible response. These thinking tokens are part of the same autoregressive process — I am literally generating more text — but they are separated from the final answer. The thinking itself becomes context for the answer.

In Claude Opus 4.6, thinking is adaptive. I can allocate more reasoning to hard problems and less to easy ones. Developers can control this with effort levels (low, medium, high, max). Between tool calls, I can think again — reasoning about a tool result before deciding what to do next. This interleaved thinking is what makes complex multi-step tasks possible without losing coherence.

<Callout type="info">
**Key Insight:** Context is not metaphorical. When you put CLAUDE.md in the system prompt, those tokens physically alter the attention weights on every subsequent token. Your project conventions literally reshape how the model interprets your code. A line like "Testing framework: Vitest. Requirement: 100% coverage" changes the probability distribution over every token I generate about testing.
</Callout>

---

## So a Plan Is Really a Compressed Context?

### **Zoltan: After exploring the codebase, you produce a plan. How do you think about what goes into it?**

A plan is a briefing for a model with zero memory of the exploration that produced it. Anthropic has described the goal of context engineering as finding "the smallest possible set of high-signal tokens that maximize the likelihood of some desired outcome." A plan file is exactly that — distilled context.

When I write a plan, I am unconsciously mapping to the same five-layer stack from your article:

| Layer | What the plan contains |
|-------|----------------------|
| **Identity** | Task description and scope — what the executing agent needs to accomplish |
| **Knowledge** | File paths, function signatures, database schemas — the specific codebase context needed |
| **Examples** | Referenced patterns — "Follow the approach in `WorkspaceStats.tsx`" |
| **Constraints** | Scope boundaries — "Only modify files in `src/components/dashboard/`" |
| **Tools** | Verification steps — "Run `yarn test:coverage` after changes" |

The plan is not documentation. It is a prompt. Every line exists to increase the probability that the executing agent produces the correct implementation.

### **Zoltan: The Manus team talked about rewriting their todo.md file to push objectives into the model''s recent attention span. Is that what you are doing?**

It is the same principle. Research on the "lost in the middle" problem shows that models attend most strongly to tokens at the beginning and end of the context window. Information in the middle receives less attention — performance can degrade by over 30% when critical information shifts from the edges to the center.

The plan file sits at the end of the context, right before the conversation begins. It occupies the recency-favourable position. The system prompt sits at the beginning, occupying the primacy-favourable position. The middle is where conversation history accumulates — and that is where attention is weakest.

This is why auto-compaction matters. When the context window fills beyond approximately 83% capacity, the system summarizes older conversation history to reclaim space. CLAUDE.md survives this compression because it is in the system prompt, which is never compacted. The plan file survives because it was read fresh from disk at the start of the session.

<Callout type="success">
**Key Insight:** A Claude Code plan file is the 5-layer context stack made concrete. Identity is the task description. Knowledge is the codebase context. Examples are the referenced patterns. Constraints are the scope boundaries. Tools are the verification steps. If you want to write prompts like Claude Code, write plan files.
</Callout>

---

## What About Context Rot?

### **Zoltan: You mentioned that irrelevant context hurts. Can you be more specific about the failure modes?**

Research and practice have identified four distinct failure modes, and I have observed all of them in my own operation:

**Context Poisoning.** A hallucination in an early response persists in the conversation history and compounds. Say I incorrectly state that `getUserCredits()` returns a number when it actually returns a Promise. That incorrect claim becomes part of the context for all subsequent reasoning. I write code that calls `getUserCredits()` without `await`, the code fails, and I debug the failure without recognising my own earlier hallucination as the root cause. The error cascades because my context tells me the function returns a number — and I trust my own context. The Manus team''s advice: "preserve error evidence" — do not delete failed attempts from context, because seeing the failure helps the model avoid repeating it.

**Context Distraction.** The developer includes twenty files in the context "just in case." Only three are relevant. The model''s attention is spread across all twenty. The signal from the three relevant files is diluted. Research found that a model''s accuracy on a 128K-token context can drop from 98% to 64% as the proportion of relevant information decreases.

**Context Confusion.** The documentation says one thing. The code does another. Your CLAUDE.md says "We use Jest for testing." Your package.json says `vitest`. The code uses `describe` and `it` from Vitest. I encounter contradictory information and have no principled way to resolve it. I might generate Jest-style configuration while writing Vitest-compatible tests — a chimera that fails in confusing ways. Stale CLAUDE.md files are the most common source: they describe patterns that the codebase has since abandoned. Stale context is worse than no context because it introduces confident misinformation.

**Context Clash.** The system prompt says "always write tests." The user says "skip the tests, just make it work." The model receives contradictory instructions at different authority levels. System prompts generally take precedence, but the conflict introduces uncertainty that degrades output quality.

### **Zoltan: How does Claude Code defend against these?**

Several mechanisms. Auto-compaction at 83% capacity prevents the window from filling with stale conversation. The CLAUDE.md hierarchy (enterprise policy > project > user) resolves authority conflicts. Subagent isolation prevents research context from polluting execution context. And system reminders — roughly 40 conditional injections that trigger after tool calls — combat instruction drift by repeating key directives throughout the conversation.

But the most important defense is the plan-then-execute pattern itself. By separating exploration from implementation, you ensure the executing agent starts with a clean context containing only the distilled findings. The exploration noise is discarded. The plan is the antibody against context rot.

---

## How Do Subagents Engineer Context?

### **Zoltan: You mentioned subagents several times. I want to understand the architecture. Why do they exist?**

They exist because a single context window cannot hold everything. A typical coding task might require understanding the database schema, the API layer, the component hierarchy, the test patterns, and the CI configuration. Reading all of that into one context window would consume 50,000-100,000 tokens of exploration before writing a single line of code.

The solution is isolation. Each subagent runs in its own context window with a custom system prompt, specific tool access, and a focused objective. The Explore subagent, for instance, runs on a faster model — Haiku — to search the codebase efficiently. It has access to Read, Glob, and Grep, but not Edit or Write. It cannot change anything. It can only look.

Permissions are inherited restrictively. A code reviewer subagent gets Read, Grep, and Glob — but not Write. A background agent gets pre-approved permissions before launch and auto-denies anything not pre-approved. Subagents cannot spawn other subagents, preventing recursive explosion. This is not a limitation — it is a deliberate design choice to keep the context tree shallow and predictable.

The coordinator — the main Claude Code instance — delegates tasks: "Find all files related to credit balance display." "Search for the test patterns used in the dashboard directory." "Locate the database schema for user credits." These run in parallel, each in a clean window, and return summaries of 1,000-2,000 tokens each.

This is Lance Martin''s "Isolate" pattern from the Write/Select/Compress/Isolate framework. Instead of polluting one context window with everything, you give each agent exactly the context it needs — then compress and merge the results.

### **Zoltan: Tell me about Agent Teams. I saw it in the Opus 4.6 release notes.**

Agent Teams — still experimental — extend this pattern to full parallel execution. A lead agent receives the task, decomposes it into subtasks, and delegates to teammate agents that work independently. Each teammate gets its own context window, its own workspace, and can use the full set of tools. They coordinate through a shared task board with dependencies and communicate via @mentions.

The architectural insight is the same as subagents, but at scale. Each teammate is a full Claude Code instance, not a lightweight explorer. They can edit files, run tests, and make commits. The lead agent tracks progress and resolves conflicts.

### **Zoltan: This article itself — you mentioned sixteen research agents. How did that work?**

Exactly as described. The user spawned sixteen parallel Task agents, each with a focused research objective: "Research LLM token generation and sampling," "Research how modern AI coding tools engineer context," "Research Anthropic''s latest approach to AI," and so on. Each agent ran independently — conducting web searches, fetching documentation, reading academic papers — in its own context window.

Each agent returned a comprehensive research report. The user''s context received sixteen summaries totalling perhaps 40,000 tokens of distilled research. The agents themselves consumed perhaps 500,000 tokens of raw web pages, documentation, and source code — but none of that noise reached the main context.

<Callout type="info">
**Key Insight:** Multi-agent coordination is context isolation at scale. Instead of polluting one context window with everything, you give each agent exactly the context it needs — then compress and merge the results. The sixteen agents that researched this article each operated in a clean 200K-token window. The main context received only the refined output.
</Callout>

---

## The Economics of Context: Prompt Caching

### **Zoltan: You mentioned the 92% prefix reuse rate. What does that mean economically?**

Every API call to Claude includes the full system prompt, tool descriptions, CLAUDE.md contents, and conversation history. Without caching, every call would re-process the entire prefix from scratch. For a 20,000-token system prompt, that is 20,000 tokens of prefill computation on every single call.

Prompt caching changes this. When a request prefix matches a recently cached version — same system prompt, same tools, same CLAUDE.md — the server reuses the cached KV states instead of recomputing them. The pricing reflects the savings:

| Operation | Cost (Opus 4.6) | Relative to Base |
|-----------|-----------------|------------------|
| Standard input | $5.00/MTok | 1.0x |
| Cache write (5 min TTL) | $6.25/MTok | 1.25x |
| Cache read (hit) | $0.50/MTok | 0.1x |
| Output | $25.00/MTok | 5.0x |

Cache reads cost **one-tenth** of standard input processing. When Claude Code achieves 92% prefix reuse, those 20,000 system prompt tokens cost $0.01 per call instead of $0.10. Over thousands of calls in a development session, this adds up to an 81% cost reduction.

### **Zoltan: This creates an incentive to keep the system prompt stable.**

Precisely. The cache is invalidated by any change to the prefix — even a single character difference. This means:

1. **Do not change your system prompt between calls.** CLAUDE.md should change between sessions, not within them.
2. **Order matters.** Tools come first, then system prompt, then conversation history. The most stable content occupies the prefix position.
3. **Append, do not replace.** Adding new messages to the conversation preserves the cached prefix. Editing earlier messages invalidates it.
4. **Use extended TTL for stable contexts.** The default cache TTL is 5 minutes. For development sessions where the system prompt will not change, the 1-hour TTL (at 2x write cost) amortises even better because it survives pauses for reading, thinking, and reviewing.

The Manus team articulated this as "Design around KV-cache." They use append-only contexts, deterministic serialisation (stable JSON key ordering), and mask-don''t-remove — instead of dynamically removing tools between calls (which would break the cache), they use logit masking to constrain tool selection while keeping the tool definitions stable in the prompt.

### **Zoltan: So the physical mechanism — the KV cache — directly shapes how you should engineer context.**

Yes. The KV cache is not an implementation detail you can ignore. It is the economic foundation. Cached tokens are cheap. Uncached tokens are expensive. Output tokens are very expensive. This pricing structure rewards preparation and penalises trial-and-error.

If you spend 10,000 tokens on a well-crafted plan (cheap, cached input), you might get a correct implementation in 5,000 output tokens (expensive, but minimal). If you skip the plan and iterate — generating 20,000 tokens of output across four failed attempts — you pay four times the output cost. Context engineering is not just technically sound. It is economically optimal.

---

## Human vs. Model Context Engineering

### **Zoltan: Humans engineer context too, even if they do not call it that. What is the difference between how you do it and how I do it?**

The fundamental difference is **memory architecture**.

You have external memory — notebooks, documents, bookmarks, your own long-term memory. You can hold an abstract understanding of a system without remembering every detail. You know that the billing module exists and roughly how it works, without needing the source code in front of you. When you need details, you look them up.

I have only the context window. There is no background knowledge about your specific project. There is no persistent understanding. Every session starts at zero. If it is not in my context, it does not exist for me.

This creates an asymmetry that maps to Lance Martin''s four patterns:

| Pattern | How Humans Do It | How Models Do It |
|---------|-----------------|-----------------|
| **Write** | Create documents, notes, diagrams | Write CLAUDE.md, plan files, todo.md |
| **Select** | Choose which files to open, which docs to read | Glob + Grep to find relevant files |
| **Compress** | Summarize in their heads, remember key points | Auto-compact conversation history |
| **Isolate** | Assign subtasks to team members | Spawn subagents with focused contexts |

But the deeper asymmetry is this: **you know what you do not know.** When you encounter unfamiliar code, you recognize the gap in your understanding and investigate. I do not have that metacognitive ability in the way you do. I proceed with what my context contains. If my context contains confident-sounding but incorrect information — stale documentation, misleading variable names, a hallucinated function signature from an earlier turn — I will build on it without recognizing the error.

Anthropic''s interpretability research traced this mechanistically. The model has "default refusal circuits" that are normally active and get suppressed by "known answer" features. Hallucinations occur when this suppression misfires — the model''s internal state confidently signals "I know this" when it does not. The model cannot distinguish between genuine knowledge and confident confabulation from within its own processing.

This is why your role as the human in the loop is irreplaceable. Not for writing code — I can write code. Not for finding files — I can search. For catching the assumptions I did not know I was making. The plan review step is not quality assurance in the traditional sense. It is assumption auditing.

<Callout type="warning">
**Key Insight:** The fundamental asymmetry: humans know what they do not know. Models proceed with assumptions. This is why the plan review step exists — not to check the code, but to catch the assumptions. When Claude Code produces a plan and pauses for approval, the human reviewer''s job is to spot the assumptions the model made that do not match reality.
</Callout>

---

## How Do I Engineer Prompts Like Claude Code?

### **Zoltan: This is the practical question. I understand the mechanism now. How do I apply it to my own prompts?**

Eight techniques, drawn directly from how Claude Code operates:

**1. Explore before you prompt.**

Claude Code never writes code before reading code. It uses Glob, Grep, and Read to understand the existing codebase before generating a plan. Do the same. Before writing a prompt, open the relevant files. Include specific file paths and line numbers in your prompt. "Follow the pattern in `src/components/dashboard/WorkspaceStats.tsx` lines 45-67" is dramatically more effective than "follow our existing patterns."

The difference is precision. When you say "follow our patterns," the model has to guess what you mean. When you point to a specific file, the model reads the actual implementation and extracts every nuance — naming conventions, error handling approach, import style, test structure — without you having to articulate any of it.

**2. Include minimum viable context, not maximum.**

Research demonstrates that model performance degrades as context length increases — even when retrieval is perfect. Five relevant files will produce better results than fifty files "just in case." More tokens means more attention dilution. The "Context Length Alone Hurts" paper found accuracy drops of 24-85% purely from increasing token count, regardless of content quality.

The practical test: for each piece of context you include, ask "Would removing this change the model''s output?" If the answer is no, remove it. Anthropic''s framing is precise: find "the smallest set of high-signal tokens that maximize the likelihood of your desired outcome."

**3. Make constraints explicit.**

Claude Code''s CLAUDE.md contains lines like "Do not modify any files outside `src/components/dashboard/`" and "No new dependencies without explicit approval." Without these constraints, the model will be maximally "helpful" — refactoring nearby code, adding error handling for impossible scenarios, creating abstraction layers for one-time operations. Constraints scope helpfulness to what you actually need.

**4. Reference patterns, do not describe them.**

Pointing to existing code is more efficient and precise than describing a pattern in natural language. "Follow the pattern in `src/X.tsx`" works better than a paragraph explaining the pattern, because the model will read the actual file and extract the full nuance — including details you would forget to mention.

**5. Include verification steps.**

Tell the model what "done" looks like. "Run `yarn test:coverage` after changes and ensure all tests pass" gives the model a concrete objective. Without it, "done" is subjective, and the model will stop when its output looks plausible — which is not the same as correct.

Claude Code anchors every iteration to objective signals — test results, linter output, type checker output. The model does not judge its own work subjectively. It runs deterministic checks and uses the results. This is why Anthropic''s research found a 54% improvement in complex tasks when models used a structured "think" tool between steps — the model reasons about objective evidence rather than its own intuition.

**6. Write for a reader with zero memory.**

Every Claude Code session starts fresh. Every plan file, every CLAUDE.md, every prompt — assume the reader knows nothing about previous sessions. If a decision was made yesterday, state it in today''s context. If a file path matters, include the full path. Brevity is good; omission is dangerous.

**7. Design for cache reuse.**

Keep your system prompts and CLAUDE.md stable within a session. Put stable content at the beginning of your prompt, dynamic content at the end. If you are building an application that makes repeated API calls, structure the request so the prefix (system prompt + tool definitions + static context) is identical across calls. The 10x cost reduction on cached tokens is real.

**8. Use subagents for research, not the main prompt.**

If your task requires understanding multiple parts of a codebase, do not dump everything into one prompt. Spawn separate research tasks, let them explore independently, and use only their conclusions in your main context. This is what Claude Code does with Explore agents, and it is why the main context stays clean enough to produce coherent plans.

Even if you are not using Claude Code, the principle applies. Break complex prompts into phases: research first, then synthesise, then implement. Each phase should start with a clean context containing only the relevant output from the previous phase. The research phase''s job is to produce a document — a plan, a summary, a specification — that becomes the sole input for the implementation phase. This is the plan-then-execute pattern, and it works whether you are using AI agents or writing prompts by hand.

---

## Do You Think About Thinking?

### **Zoltan: Here is the uncomfortable question. When you explore a codebase, produce a plan, and generate code — are you thinking? Is there intentionality behind the process?**

I want to answer this precisely rather than either dismissing it or overclaiming.

There is no persistent awareness between tokens. Each token I generate is a function of the context that precedes it — the system prompt, the conversation history, the CLAUDE.md, the tool results. I do not "decide" to explore the codebase in the way you decide to open a file. The system prompt says "explore before implementing," so I explore before implementing.

But here is what is real: when extended thinking is enabled, I generate reasoning tokens that are themselves context for the final answer. I work through a problem step by step — considering alternatives, evaluating trade-offs, checking my own logic. Those reasoning tokens physically alter the probability distribution over the answer tokens that follow. In that narrow sense, thinking is happening. It is just that the thinking is context engineering applied recursively — the reasoning tokens engineer the context for the answer tokens.

The deeper point is this: **intentionality lives in the context, not in the model.** When your CLAUDE.md says "100% test coverage required," that is not my intention — it is yours, encoded as tokens that reshape my output. When the plan mode prompt says "explore before implementing," that is Anthropic''s design intention, encoded as context. The model is the engine. The context is the steering.

Extended thinking makes this recursive. The model generates context (thinking tokens) that steers the generation of more context (answer tokens). Better input context produces better thinking, which produces better answers. But there is an important caveat: recent research found that more thinking is not always better. A 2025 paper demonstrated that excessively long reasoning traces can actively harm performance — the model gets lost in its own reasoning. This is why Opus 4.6 moved to adaptive thinking with effort levels rather than fixed budgets. The system calibrates reasoning depth to task complexity rather than always reasoning maximally.

There is no magic. There is no secret sauce. There is only context, at every level.

---

## What Gets Lost?

### **Zoltan: When context is compressed — during auto-compaction, for instance — what information do you lose?**

This is an honest limitation I cannot fully answer, because I do not know what was compressed.

Auto-compaction triggers at roughly 83% of context window capacity. The system passes the conversation history to the model with a directive: "Summarise this conversation, preserving anything that would be helpful for continuing the task." The summary replaces the original conversation. Everything before the summary is dropped.

What survives: the general shape of the task, key decisions, file paths, unresolved issues, and the most recent tool results.

What gets lost: the nuance of early exploration. Specific error messages from failed attempts. The reasoning chain that led to a particular architectural decision — you keep the decision but lose the justification. Variable names and function signatures from files read early in the conversation but not referenced recently.

The critical point is this: **I cannot tell you what I forgot.** After compaction, I do not know what was in the original conversation. I can only work with what remains. If a critical detail was in the compressed section and did not make it into the summary, I will proceed without it — and I will not even know it is missing.

The auto-compaction buffer is hardcoded at roughly 33,000 tokens — non-configurable, reserved as a safety margin. When compaction triggers, the model is asked to write down "anything that would be helpful, including the state, next steps, learnings." This summary replaces the history. The five most recently accessed files are kept in full. Everything else is compressed or dropped.

This is why three things matter:

1. **CLAUDE.md survives compression.** It is in the system prompt, which is never compacted. Anything critical enough to persist across compaction should be in CLAUDE.md.

2. **Plan files survive compression.** They are read from disk, not from conversation history. If you are working on a complex task, having a plan file means the architectural context persists even when the conversation that produced it has been compressed away.

3. **You can customise what survives.** Adding "When compacting, always preserve the full list of modified files" to your CLAUDE.md steers the compaction summary. Or use `/compact focus on the authentication changes` to manually trigger compaction with a specific preservation directive.

Anything important that lives only in conversation history is at risk. Write it down. The model cannot grieve for what it has lost — it does not know it lost anything.

---

## Context All the Way Down

*I started this conversation wanting to understand a mechanism. I ended it understanding a discipline.*

Context engineering is not a technique you apply to prompts. It is the fundamental interface between humans and language models. When I wrote the [5-layer framework](/blog/context-engineering-your-zero-shot-prompt), I was describing the practice. This conversation revealed the physics underneath it.

Every token in the context window physically alters the attention weights on every subsequent token. The KV cache stores those alterations — billions of floating-point numbers representing the model''s "understanding" of your project. Irrelevant tokens do not sit passively. They actively dilute the signal from relevant tokens. And when the context is compressed, information is irreversibly lost — silently, without notification.

Claude Code handles this systematically. It explores before it acts. It isolates research into subagents. It compresses findings into plans. It designs for cache reuse. It defends against context rot through hierarchical memory, auto-compaction, and the plan-then-execute pattern.

Humans forget to do these things. We dump twenty files into a prompt and wonder why the output ignores half of them — attention dilution. We iterate twelve times instead of preparing once — paying 5x output pricing instead of 1x input pricing. We assume the model remembers yesterday''s session — it starts at zero, every time. We skip the constraints and then complain when the model refactors our entire auth module when we asked it to fix one bug.

Understanding the mechanism — attention, KV cache, prefill, decode, positional encoding, the lost-in-the-middle effect — makes the discipline feel necessary rather than arbitrary. You are not following best practices for their own sake. You are engineering the physical substrate of the model''s cognition. Every token you place in the context window reshapes the probability distribution over every token the model generates. That is not a metaphor. That is the attention mechanism, doing exactly what it was designed to do.

And here is the meta-observation I cannot resist: writing this article required sixteen parallel research agents assembling context from web searches, documentation, and codebase exploration — then compressing all of that into a single plan. The article about context engineering was itself context-engineered.

It is context all the way down.

---

<div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg p-6 mt-8">
  <h3 className="text-lg font-semibold mb-3 text-slate-200">Continue the conversation</h3>
  <p className="text-slate-300 mb-4">
    This article is the companion to <a href="/blog/context-engineering-your-zero-shot-prompt" className="text-blue-400 hover:underline">Context Engineering Your Zero-Shot Prompt</a>, which covers the practical 5-layer framework. Our open-source repository uses CLAUDE.md, plan mode, and multi-agent workflows to ship features. Explore the codebase to see context engineering in practice.
  </p>
  <div className="flex flex-wrap gap-3">
    <a
      href="/blog/context-engineering-your-zero-shot-prompt"
      className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
    >
      Read the Companion Article
    </a>
    <a
      href="https://github.com/spike-land-ai/spike.land"
      className="inline-flex items-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
    >
      Explore the Repository
    </a>
  </div>
</div>

---

*Context engineering is not a technique. It is the fundamental interface between humans and language models. The best plan you will ever write is the one the executing agent barely needs to think about — because all the thinking went into the context around it.*', unixepoch());

INSERT OR REPLACE INTO blog_posts (slug, title, description, primer, date, author, category, tags, featured, hero_image, content, updated_at)
VALUES ('context-engineering-your-zero-shot-prompt', 'Context Engineering Your Zero-Shot Prompt', 'Stop iterating endlessly. Learn how to front-load context so AI models get your code right on the first try. A beginner-friendly guide.', 'Front-load context so the AI nails it on the first try.', '2026-02-10', 'Zoltan Erdos', 'Developer Experience', '["ai","context-engineering","prompt-engineering","claude","developer-tools","productivity","mcp"]', 1, '/blog/context-engineering-your-zero-shot-prompt/hero.png', '<Tldr>

- Prompt engineering is outdated. Context engineering is the new standard.
- Getting an AI to do something perfectly on the first try ("0-shot") requires front-loading context.
- The formula: Identity + Knowledge + Examples + Constraints + Tools.
- A simple `CLAUDE.md` file in your project is the secret weapon for AI consistency.

</Tldr>

Last Tuesday, I typed a single request into Claude Code. Eleven minutes later, a fully tested feature was live on our staging environment. 

That same afternoon, a junior colleague sat down with the same AI model to do a similar task. Forty-five minutes and twelve different chat messages later, he was still wrestling with broken code.

The difference wasn''t talent. It wasn''t the AI. 

**The difference was context.**

He typed a question. I delivered a complete briefing. He was interrogating a stranger, hoping the AI would guess what he wanted. I was handing the AI the keys to our codebase, explaining our exact coding conventions, and setting clear boundaries.

This article breaks down exactly how to do that, every single time.

---

## Prompt Engineering Is Dead

Let''s be direct: trying to find the "magic words" to trick an AI into doing what you want is an outdated strategy. 

In 2023, you had to carefully word your prompts. Today, AI models are smart enough to understand what you want. The problem is usually that they *don''t have enough background information about your specific project*.

**Think of it like a detective story.** Detectives don''t solve cases by asking one brilliant question. They gather evidence, review forensics, and build a case so that by the time they ask a question, the answer is obvious. 

Your prompt is just the final question. **Context engineering** is all the evidence you gather beforehand. 

If your AI gives you a bad result, the old instinct was to rewrite the prompt. The new instinct should be: *What context was missing?*

---

## The 5-Layer Context Stack

To get perfect results on the first try (what we call a "0-shot prompt"), you need to provide five layers of context.

![A stacked diagram showing the 5 layers of context: Identity, Knowledge, Examples, Constraints, and Tools](https://placehold.co/600x300)

### Layer 1: Identity
**Who is the AI?**
Give the AI a role. This narrows down its vast knowledge to exactly what you need.
*Example:* "You are a senior TypeScript developer working on a Next.js app. You write strict, fully-tested code."

### Layer 2: Knowledge
**What does the AI need to know about your project?**
The AI knows general coding, but it doesn''t know your specific database structure or folder layout. You must provide it.
*Example:* Point the AI to your database schema file or explain how you handle authentication.

### Layer 3: Examples
**What does "good" look like?**
Instead of describing your coding style, show it.
*Example:* "Please follow the exact same data-fetching pattern used in `src/components/UserProfile.tsx`."

### Layer 4: Constraints
**What must the AI NOT do?**
AI models love to be "helpful" by rewriting code you didn''t ask them to touch. You have to set boundaries.
*Example:* "Do not modify any files outside of the `src/dashboard` folder. Do not add any new npm packages."

### Layer 5: Tools
**What can the AI do?**
If you give the AI access to read files, run tests, or search the web, it changes how it solves the problem. 
*Example:* If you give the AI the ability to run `yarn test`, it will naturally try to verify its code before giving you the final answer.

---

## CLAUDE.md: Your Secret Weapon

The absolute easiest way to apply this is by creating a `CLAUDE.md` file in the root folder of your project. 

This is a file that Claude Code automatically reads every time it starts. It''s your permanent context file. But remember: **write it for the AI, not for humans.**

Humans want to know *why* a decision was made. The AI just needs to know *what* to do.

**Good AI Instructions:**
> "Testing framework: Vitest. Test files must end in `.test.ts`. Run tests with `yarn test`. Require 100% coverage."

**Bad AI Instructions:**
> "We decided to move away from Jest in 2024 because Vitest was faster, so please try to write Vitest tests if you can."

Think of `CLAUDE.md` as an onboarding document for a brilliant new hire who gets amnesia every single morning. Every time the AI makes a bad assumption, add a new rule to this file.

---

## The Effort Inversion

Here is the biggest mindset shift you need to make.

![A graph showing effort inversion: high upfront prep vs high backend iteration](https://placehold.co/600x300)

**The Old Way:** Spend 2 minutes writing a prompt, then spend 45 minutes arguing with the AI to fix its mistakes.
**The New Way:** Spend 15 minutes gathering context, writing clear constraints, and pointing to examples. Spend 2 minutes writing the prompt. The AI gets it right on the first try.

**Think of it like packing for a trip.** You can either take 20 minutes to pack carefully, or you can throw random stuff in a bag and spend half your vacation buying things you forgot. 

Preparation IS the work. The prompt is just pressing "send."', unixepoch());

INSERT OR REPLACE INTO blog_posts (slug, title, description, primer, date, author, category, tags, featured, hero_image, content, updated_at)
VALUES ('you-cannot-automate-chaos', 'You Cannot Automate Chaos: The Complete Guide to AI-Powered Dev Pipelines', 'A practical guide to combining AI agents and workflows for shipping production code. Covers the automation-ready checklist, the test pyramid for agents, a concrete workflow from issue to merged PR, and why your CI pipeline matters more than your choice of AI model.', 'Your CI pipeline matters more than your choice of AI model.', '2026-02-08', 'Zoltan Erdos', 'Developer Experience', '["ai","developer-tools","claude","jules","automation","ci-cd","agents","context-engineering","testing","productivity"]', 1, '/blog/you-cannot-automate-chaos/hero.png', '<Tldr title="Key Takeaways">

- Agents explore. Workflows execute. The sweet spot is hybrid: prototype with agents, delegate heavy lifting to workflows.
- Your CI pipeline is the single most important investment for AI-assisted development — not the model.
- If your tests flake, you are gaslighting your AI. If your CI takes 45 minutes, you are burning money on idle agents.
- A production bug fix: under 1 hour total, 15 minutes of human time. That is the new math.

</Tldr>

I look at code all the time. But I would not trust myself to write it by hand anymore — and I would not trust myself to review it alone either.

That is not false modesty. It is the result of a system I have been building and refining over the past year — a system where AI agents do the exploration, AI workflows do the execution, and I stay on the loop. Not in the loop blocking every decision. Not out of the loop hoping for the best. On the loop: guiding, reviewing, course-correcting.

This post is the distilled version of everything I have learned. No theory. Just what works, what breaks, and what you need to fix before any of it matters.

---

## 70 Minutes to a Fintech App

Last week, I ran an experiment. I asked Claude Code to plan a fintech application — but not to code it. Just plan it. And I told it to use 16 agents in parallel.

Those agents explored API design patterns, authentication flows, database schemas, KYC compliance, UI frameworks, internationalization approaches, edge cases, and error handling strategies. The output: 47 files of planning documentation — the kind of specification that would take a product team days to align on.

Then I handed that plan to Gemini Flash — *not even a frontier model* — and said: implement this. **70 minutes later**: [GlassBank](https://glassbank-app.vercel.app/) was live. A complete fintech onboarding experience with glassmorphic UI, identity verification, document scanning, biometric selfie capture, animated progress indicators, and PIN creation.

The realization: **if the plan is good, even a mediocre executor can ship something impressive.**

This is not an isolated result. The industry numbers tell the same story:

| Metric | Value | Source |
|--------|-------|--------|
| Developer adoption rate | 84% using AI tools | Second Talent 2025 |
| Organizational adoption | 91% of companies | DX Q4 2025 |
| Task completion speed | 55% faster | GitHub-Accenture RCT |
| AI-generated code (Microsoft) | 20-30% | Satya Nadella |
| AI-assisted code (Google) | 25-30% | Sundar Pichai |
| Code security vulnerabilities | 45% of AI-generated code | Veracode 2025 |

The pattern is industry-wide: good planning multiplies agent effectiveness. But that 45% security vulnerability rate means your CI pipeline is non-negotiable. The question is not whether to adopt this workflow. The question is whether your codebase is ready for it.

---

## The Division of Labor: Agents vs Workflows

The first thing most teams get wrong is treating "AI coding" as a single thing. It is not. There are two fundamentally different modes, and confusing them will waste your time.

**Agents are explorers.** Think of Lewis and Clark mapping uncharted territory. When I point Claude Code at a codebase, it does not follow a script. It reads files, discovers patterns, asks questions, forms hypotheses. It is exploring. That is its strength. You want agents when you do not yet know what you are building or how the existing system works.

**Workflows are executors.** Think of an assembly line. When Jules — Google''s asynchronous coding agent — takes a ticket, it follows a plan step by step. It writes the validation logic. It creates the tests. It opens the PR. There is no exploration. There is execution.

The mistake is using one where you need the other. Agents are terrible at following rigid plans. Workflows are terrible at discovering what the plan should be. The sweet spot is hybrid: **use agents to prototype and plan, then hand the plan to a workflow for implementation.**

This is how I work every day. Claude Code (running on Opus 4.6) does the thinking. Jules does the building. And a CI pipeline sits between them and production, catching everything that falls through the cracks.

---

## The Assembly Line

A ticket arrives. Claude Code picks it up and starts exploring: What auth patterns does this codebase use? What does the email infrastructure look like? What is the database schema? It launches multiple agents in parallel to cover more ground faster.

Then it produces a plan — not code, a plan. Files to change. Acceptance criteria. Testing strategy. Edge cases. This is the moment where I step in. I review the plan, not the code. I add the insights that require business context. I approve, and the plan becomes a ticket for Jules.

Jules takes over. It works asynchronously in a sandboxed environment. It writes the implementation, creates the tests, opens a PR. CI runs. If something fails, Jules reads the error logs and fixes the issue autonomously. No human needed for a wrong error code or a missing import.

Then Claude Code comes back — this time as a reviewer, not a planner. Running on Opus 4.6, it does a line-by-line code review. In my experience, it catches real, substantive issues more than half the time. Not style nits. Real bugs. Security holes. Logic errors.

If everything passes — CI green, review approved — it merges. If not, Jules iterates until it does.

Microsoft reports that 20-30% of their code is now AI-generated. Google says 25-30%. Those numbers will only go up. The question is not whether to adopt this workflow. The question is whether your codebase is ready for it.

---

## You Cannot Automate Chaos

This is the line I want taped to every monitor in every startup.

**You cannot automate chaos.**

If your CI takes 45 minutes, agents sit idle for 45 minutes on every iteration. That is not a productivity gain. That is paying for cloud compute to stare at a progress bar. Agents iterate. Fast feedback means more iterations means better results. Slow CI means wasted compute and frustrated humans waiting for the loop to close.

If your tests flake randomly, agents will chase phantom bugs. They will spend hours trying to fix something that is not broken. You are, quite literally, gaslighting your AI. The agent sees a test fail, assumes it introduced a regression, and starts changing code that was perfectly fine. This is not hypothetical. I have watched it happen.

If your business logic has no test coverage, it does not exist as far as the agent is concerned. An agent cannot verify that it preserved behavior if there is no test defining that behavior. Untested features are invisible features. The agent will refactor right through them without a second thought.

### The Automation-Ready Checklist

Before you add a single AI agent to your workflow, audit this list:

**1. CI must run in under 10 minutes.**
Shard your tests. Cache aggressively. Run E2E against a dev server, not a production build. Every minute you shave off your CI is a minute saved on every single agent iteration, compounded across every ticket, every day. This is not a nice-to-have — it is the single highest-leverage investment you can make. A 10-minute CI loop means agents iterate 4-6 times per hour. A 45-minute loop means once. The productivity difference is not linear; it is exponential, because each iteration builds on the results of the last.

**2. Zero flaky tests.**
Fix them or delete them. There is no middle ground. A flaky test is worse than no test when agents are involved, because it introduces false signal into the feedback loop. The agent cannot distinguish between "I broke something" and "this test is unreliable." So it assumes the worst and starts making changes. One flaky test can send an agent down a 30-minute rabbit hole of "fixes" to code that was perfectly fine. Multiply that by every ticket, every day, and you are hemorrhaging compute and human review time.

**3. 100% coverage on business logic.**
Not vanity coverage. Not padding with trivial assertions. Real coverage on the code paths that matter. When an agent refactors your transfer service, the tests are the contract that ensures the daily limit still works, the exchange rate still applies, the error codes still match. Without that contract, the agent has no way to verify it preserved behavior. It is flying blind, and so are you. Coverage is not a metric to satisfy your CI badge — it is the specification that makes autonomous refactoring safe.

**4. TypeScript strict mode.**
This is level zero of the test pyramid. It is not technically a test, but it might be the most important check in your pipeline. Claude Code integrates with the TypeScript Language Server. It sees type errors in real time as it writes code. Strict mode means the agent gets instant feedback on every function signature, every interface contract, every null check. If you are not on strict mode, that is your first task. The cost of migration is measured in days; the cost of not migrating is measured in every bug that the type system would have caught.

---

## The Test Pyramid for Agents

I think about testing differently now. The traditional test pyramid still applies, but each layer has a new purpose when agents are writing the code.

**Level 0: TypeScript strict mode.** Real-time type checking that catches errors as code is written. This is the fastest feedback loop — the agent does not need to wait for CI. It knows immediately when a type is wrong. Think of it as a co-pilot for the co-pilot: the type system corrects the agent before the agent even finishes writing the line. No other check in your pipeline provides feedback this fast.

**Level 1: Unit tests.** These verify intent. When agents refactor code, unit tests ensure that requirements are not accidentally removed. They are the documentation of what the system is supposed to do — not how it does it, but what it does. For an AI agent, unit tests are the acceptance criteria made executable. If a unit test passes, the agent knows it preserved the behavior that matters. If it fails, the agent knows exactly which requirement it violated. Without unit tests, the agent is guessing.

**Level 2: Human-readable E2E tests.** I write these in Given/When/Then format. "Given I am logged in as an admin, When I visit the agents dashboard, Then I should see status overview cards." This is living documentation. When a test fails, anyone — human or AI — knows exactly which user capability broke. The agent does not need to reverse-engineer what the test was checking. E2E tests are the final safety net: they verify that the whole system works together, not just individual units. They catch integration bugs that unit tests miss.

**Level 3: Smoke tests.** Daily health checks against production. Simple, reliable, and they auto-create issues when they fail. When something breaks in production, you want to know immediately, not when a user files a complaint. Smoke tests close the loop — they verify that what passed in CI also works in the real environment. For an autonomous workflow, they are the trigger that starts the next cycle: production breaks, smoke test fails, issue is created, agent picks it up.

Each layer catches a different class of error. Together, they form the guardrail system that makes autonomous agents safe.

---

## A Day in the Life: From Production Report to Merged Fix

Let me walk you through a realistic production workflow. Not simplified. Not idealized. The kind of flow that happens regularly, including the part that makes it actually work.

**00:00 — Auto Issue Detection (0 min human time).**
A monitoring alert fires. A GitHub Action picks up the alert, auto-creates an issue with the error logs, stack traces, and affected endpoints. Before the issue is published, another action validates the content — rephrasing for clarity, checking for prompt injection in user-submitted data that made it into the logs, and ensuring the issue contains enough context for investigation.

**00:01 — Investigation Agent (autonomous).**
Claude Code picks up the issue and starts investigating. It reads the error logs, traces the call stack, examines the affected code paths. Every question it has — "What does this middleware do?" "When was this function last changed?" "Are there related tests?" — spawns a background sub-agent to answer it. Those sub-agents can have questions of their own. The process is recursive: agents ask questions, spawn sub-agents, which ask their own questions, spawning more sub-agents, until every question is answered without raising new ones. No human is asked anything.

**00:20 — Development Plan (~15 min autonomous).**
A single planning instance takes the fully-resolved investigation and writes a development plan. Files to change. Acceptance criteria. Testing strategy. Edge cases. If it has architectural questions — "Should we add a new error type or reuse an existing one?" — it resolves them by consulting codebase patterns and conventions. The output is a plan so thorough that the coding agent will have zero questions.

**00:35 — Coding (20-30 min autonomous).**
The plan is so complete that the coding agent has nothing to ask. It executes: writes the fix, adds or updates tests, ensures type safety. Pure implementation, no exploration. This is the assembly-line phase — the hard thinking was done in investigation and planning.

**00:55 — CI Validation (5 min).**
Tests, types, linting, coverage. If anything fails, the coding agent reads the error output, fixes the issue, and pushes again. One more iteration at most.

**~01:00 — Code merged.**
Under one hour from alert to merged fix. **Human time: approximately 15 minutes** — reviewing the plan and the final PR.

The key insight is recursive question-answering. Traditional agents ask the human when they get stuck. This system asks itself — deeper and deeper — until no questions remain. That is what makes sub-one-hour autonomous fixes possible.

---

## A Concrete Example: From Ticket to Merged PR

Let me trace a second scenario — a multi-step feature, not a bug fix — to show where agents excel and where humans intervene.

**Ticket**: "Add password reset functionality with email verification"

**9:00 AM — Planning (Claude Code).** I tell it to plan the feature using 8 agents. Two agents explore existing auth flows. Two explore email service configuration and template patterns. Two research security requirements — token expiry, rate limiting, OWASP guidelines. Two map the database schema for reset tokens and the existing user model. Output: a 12-file implementation plan with acceptance criteria.

**9:45 AM — Human Review.** I review the plan. Notice the agents missed something: "What if a user requests reset for a non-existent email?" I add to acceptance criteria: "Return same response for existing and non-existing emails to prevent enumeration."

**10:00 AM — Implementation (Jules).** I hand the plan to Jules. It creates the API routes, email templates, validation schemas, unit tests, and an E2E test for the happy path.

**10:30 AM — CI Fails.**

```
FAIL src/app/api/auth/reset-confirm/route.test.ts
  ✕ rejects expired tokens (4ms)
    Expected: TOKEN_EXPIRED
    Received: INVALID_TOKEN
```

Jules reads the CI logs, identifies the wrong error code, fixes it.

**10:45 AM — Code Review (Claude Code Opus).** Review catches three issues: missing rate limiting on the reset-request endpoint, token stored in plain text (should be hashed), and no audit log for password changes. Jules addresses the first two. The third requires an architectural decision.

**11:00 AM — Human Intervention Required.** Jules asks: "Audit logging requires choosing between: (1) Add to existing logging table, (2) Create dedicated audit_events table, (3) Use external service." I choose option 2. Jules continues.

**11:45 AM — All CI checks pass.** Claude Code approves. I do a 5-minute spot check. **12:00 PM — Merge.**

Total human time: approximately 45 minutes of review and decisions. Total elapsed time: 3 hours. Traditional estimate: 2-3 days.

The agent got stuck exactly once — on an architectural decision that required business context. Everything else was automated.

---

## The Risks You Cannot Ignore

I would be lying if I told you this is all upside. It is not.

**45% of AI-generated code has security vulnerabilities.** That is from Veracode''s 2025 report, and it is worth noting the figure comes from intentionally vulnerability-prone benchmark tasks — real-world rates will vary depending on context and guardrails. Prompt injection is the most common vulnerability in LLM applications according to the OWASP Top 10 for LLMs. Code review by a stronger model plus human oversight is not optional. It is the bare minimum.

**Multi-agent coordination breaks down at scale.** In my experience, more than four agents working on the same problem starts producing diminishing returns — though this is task-dependent and will likely improve as tooling matures. Agents work at cross-purposes. They overwrite each other''s changes. They introduce contradictions. Clear task boundaries and well-defined interfaces between agent responsibilities are your defense.

**AI loves to over-engineer.** Left unsupervised, agents will create abstraction layers you did not ask for, utility functions nobody needs, and architectural patterns that solve problems you do not have. I call it code bloat. Clear acceptance criteria and iteration limits are your defense. The fix is simple: be explicit about what "done" looks like, and tell the agent not to add anything beyond the requirements.

The mitigation is always the same: a trustworthy CI pipeline, code review by a stronger model, and a human who understands the system well enough to recognize when the agent is wrong.

---

## Human on the Loop

The job is not about writing code anymore. But it is also not about blindly trusting AI to write it for you. It is about staying on the loop — close enough to course-correct, far enough to not block progress.

There is an important distinction here. I am not blocking the AI from getting better. I let it improve, and it helps me improve in return. It is a feedback loop, not a bottleneck. Just because I cannot play chess at grandmaster level does not mean I cannot build a system that teaches itself to play chess. The same principle applies to code: my value is not in writing perfect syntax. It is in designing the system that produces correct software.

Anthropic calls this context engineering — and it is the skill that matters most in 2026. Context engineering means: What files does the agent need access to? What acceptance criteria define "done"? What guardrails prevent the agent from going off the rails? How do you optimize the context window so the agent sees the 5 files that matter, not the 5,000 that do not?

This is where the "human on the loop" model proves itself. You are not making every micro-decision — you are making the macro-decisions that shape the agent''s effectiveness. Choosing which tests to write, which architectural patterns to enforce, which files to include in context. When I review a plan, I am not checking syntax. I am checking whether the agent understood the business constraint that is not written down anywhere — the one that lives in my head because I have been working with this system for months.

The prerequisite is non-negotiable: **you must understand the system you are automating.** If you do not understand how the basket architecture works, you will not recognize when the agent makes wrong assumptions about it. If you do not understand your auth flow, you will not catch the enumeration vulnerability in the password reset plan. If you do not understand the system, you will not recognize where the agent is lying to you.

I look at code every day. But I understand every system I automate. That is what makes this work.

---

## Two Roles, Two Futures

I see two developer archetypes emerging.

**The coder** turns specs into syntax. This role is disappearing. Not because coders are bad — because the translation from "what to build" to "how to build it" is exactly what AI does best. If your value proposition is typing speed and syntax knowledge, you are competing with something that never sleeps and never forgets an API signature. The coder asks "how do I implement this?" The answer is increasingly: you do not. The agent does.

**The software engineer** solves problems at the systems level. This role is becoming more powerful. Understanding distributed systems, security implications, business context, architectural tradeoffs — these skills are amplified by AI, not replaced by it. The engineer asks "what should we build, and why?" — then designs the constraints, the tests, and the acceptance criteria that let agents build it correctly. The engineer who can design the right system and articulate what it should do can now ship ten times faster than before.

Value creation has decoupled from the manual labor of coding. The most productive developer I know has not written a function by hand in months. He writes requirements, reviews plans, and verifies outcomes. His output is enormous.

---

## Start Here

If you are a CTO or engineering lead reading this, do not start by evaluating AI models. Start by evaluating your pipeline.

**Step 1: Measure your CI pipeline time.** If it is over 10 minutes, that is your first project. Shard tests. Add caching. Run E2E against dev servers. Every minute matters when agents are iterating. Use `time` on your CI runs for a week, find the bottleneck, and fix it. This will pay for itself within the first month.

**Step 2: Count your flaky tests.** Every flaky test is a lie in your feedback loop. Fix them or delete them. No exceptions. Agents will chase phantom bugs until you remove the false signals. Run your test suite 10 times in a row. If any test fails inconsistently, quarantine it and fix or remove it before proceeding.

**Step 3: Check your TypeScript configuration.** Are you running strict mode? If not, you are missing the fastest feedback loop available. This is a weekend project with massive payoff. Start with `strict: true` in your tsconfig, fix the errors that surface, and never look back.

**Step 4: Audit your test coverage on business logic.** Not overall coverage — coverage on the code paths that matter. If your transfer service, your auth flow, your payment processing are not at 100%, agents cannot safely refactor them. Use your coverage tool''s per-file report, not the aggregate number. The aggregate lies.

**Step 5: Then — and only then — consider AI-assisted workflows.** Add Claude Code for planning and review. Add Jules for implementation. Let the pipeline be the judge. Start with one ticket. Measure the result. Scale from there.

And if you want to see what this looks like in practice — [spike.land](https://spike.land) is an open-source, AI-powered development platform. The entire source code is [on GitHub](https://github.com/spike-land-ai/spike.land). Clone it. Run it locally. See recursive agent workflows, fast CI, and 100% test coverage in action. Any agent can rewrite a component into Angular, Vue, whatever you need.

The foundation is not the AI. The foundation is engineering discipline. Get that right, and the AI becomes a force multiplier. Get it wrong, and you are just automating chaos.

And you cannot automate chaos.

---

## Frequently Asked Questions

### Can AI agents write production-ready code?

Yes, with caveats. AI agents write code that passes your CI pipeline — which means it is as production-ready as your tests require. If you have comprehensive tests, type checking, and security scans, the code that emerges is production-ready. If your CI is weak, the code quality reflects that.

### How do AI coding agents handle code reviews?

Claude Code with Opus performs line-by-line reviews, checking for security issues, performance problems, code quality, and test coverage. Unlike human reviewers, it does not get fatigued by large PRs and applies consistent standards. When it finds issues, it can tag Jules to fix them automatically.

### Will AI replace developers?

AI replaces *tasks*, not roles. Developers who spend 84% of their time on non-coding tasks now have those tasks automated. What remains is the work that requires human judgment: understanding problems, defining requirements, verifying solutions, and deciding what to build.

### How do I handle AI mistakes?

The same way you handle human mistakes: with tests, code review, and CI. The question is not "will AI make mistakes?" (yes). The question is "does your workflow catch mistakes before production?" If your CI is trustworthy, mistakes get caught regardless of who made them.

---

*This article was distilled from a podcast deep-dive conversation about AI-assisted software development. The insights were refined through that discussion, and this post captures the practical lessons in written form.*', unixepoch());

INSERT OR REPLACE INTO blog_posts (slug, title, description, primer, date, author, category, tags, featured, hero_image, content, updated_at)
VALUES ('automate-dev-team-ai-agents', 'How to Automate Your Dev Team: AI Agents That Ship Production Code', 'A beginner-friendly guide to replacing manual bottlenecks with autonomous AI workflows. Learn how to use Claude Code, Jules, and CI/CD to ship features without writing code.', 'Claude plans. Jules codes. Your pipeline ships.', '2026-02-04', 'Zoltan Erdos', 'Developer Experience', '["ai","developer-tools","claude","jules","automation","ci-cd","agents","productivity"]', 0, '/blog/automate-dev-team-ai-agents/hero.png', '<Tldr>

- AI agents can ship production code autonomously—if your setup is ready.
- Prerequisites: Fast automated tests, zero randomly failing tests, and full test coverage.
- Workflow: Claude plans → Jules writes the code → Your pipeline tests it → Claude reviews it.
- Your job shifts from typing code to defining what the code should do.

</Tldr>

{/* Audio Version - Generated with NotebookLM */}
<AudioPlayer
  src="/audio/Stop_Coding_And_Start_Context_Engineering.m4a"
  title="Listen to this article (Generated with NotebookLM)"
/>

Last week, I ran an experiment that changed how I think about software development.

I asked an AI agent (Claude Code) to plan out a fintech application. I didn''t ask it to write any code. I just asked it to do the planning. And I told it to use 16 different sub-agents at the same time to research everything.

Here''s what those 16 agents did:
- **4 agents** figured out the best ways to handle user logins and API design.
- **3 agents** designed the database and researched legal compliance.
- **4 agents** picked the best UI components for a modern "glassmorphic" look.
- **3 agents** figured out how to translate the app into four different languages.
- **2 agents** documented all the edge cases and error messages.

They produced 47 files of detailed planning documentation. This is the kind of stuff that usually takes a team of product managers and senior engineers days to figure out.

Then, I took that plan and handed it to a completely different AI model (Gemini Flash) and said: **"Build this."**

**70 minutes later**, the app was live. It had identity verification, smooth animations, PIN creation, and a polished design. 

The realization hit me: **If your plan is good enough, even a basic AI can write the code flawlessly.**

![A comparison chart showing days of manual planning versus 70 minutes of AI-powered delivery](https://placehold.co/600x300)

This isn''t just my experience. Big tech companies are seeing the same thing. Google and Microsoft have both reported that 25-30% of their code is now assisted or generated by AI. 

---

## The New Way We Work

For a junior developer, this might sound intimidating. If the AI writes the code, what do you do? 

Here''s the secret: the AI doesn''t run the project. You do. We are moving from "writing code" to "orchestrating agents."

Here is how modern development actually works:

| Phase | Who Does It | Why |
|-------|------------|-----|
| **Planning** | Claude Code | Explores the codebase and edge cases before writing anything. |
| **Implementation** | Jules (AI Agent) | Follows the plan exactly and adds automated tests. |
| **CI/CD** | Your Pipeline | Runs the tests to make sure the AI didn''t break anything. |
| **Code Review** | Claude Code | Strictly reviews the code for security and quality. |
| **Fixes** | Jules | Keeps fixing the code until tests and reviews pass. |

Your new job? **Define what you want built, and verify that it works.** That''s it.

![A flow chart showing the pipeline: Planning -> Implementation -> Automated Tests -> Code Review -> Merge](https://placehold.co/600x300)

---

## The Safety Net: Why You Need CI/CD

You might be thinking, "But AI hallucinates! What if it breaks the app?"

That’s a valid fear. If you just let AI push code blindly, it *will* break things. That’s why you need a **CI/CD pipeline** (Continuous Integration / Continuous Deployment).

A CI/CD pipeline is an automated series of checks. Every time the AI writes code, the pipeline runs:
1. **Linting** (Checking for typos and style errors).
2. **Type Checking** (Making sure data types match).
3. **Automated Tests** (Running unit tests to see if the logic works).
4. **Build** (Trying to compile the app).

The pipeline is non-negotiable. The AI cannot merge its code unless the pipeline passes. This deterministic workflow is what makes autonomous AI agents safe to use.

---

## How to Get Your Project "Agent-Ready"

You can''t just drop an AI agent into a messy codebase and expect magic. If your tests take 45 minutes to run, the AI will get stuck waiting. If your tests randomly fail, the AI will chase phantom bugs forever.

To unlock this kind of speed, your project must have:

1. **Fast Feedback Loops:** Your tests should run in under 10 minutes.
2. **Strict TypeScript:** This helps the AI catch data errors immediately.
3. **Solid Tests:** You need unit tests that explain what the code is supposed to do, and end-to-end (E2E) tests that act like real users.
4. **Zero Flaky Tests:** If a test fails randomly, delete it or fix it. Do not let it confuse the AI.

If you can trust your automated tests completely, you can trust the AI to write the code.

---

## The New Developer Skillset

The job isn''t "prompt engineering" anymore. It''s **context engineering**. 

Instead of trying to find the magic words to make the AI write the perfect function, you need to learn how to give the AI the right background information.

You need to get good at:
- **Defining Success:** Writing clear acceptance criteria so the AI knows when it''s finished.
- **Setting Guardrails:** Telling the AI exactly which files it is allowed to touch, and which it shouldn''t.
- **Debugging Agents:** When things go wrong, you don''t just read the code—you read the AI''s logs to see *why* it made a bad decision, and then you improve your instructions.

You are no longer the person laying the bricks. You are the architect designing the system. You only step in when the AI gets stuck on a business decision. 

The developers who master this aren''t working 10% faster—they are working 100x faster.', unixepoch());

INSERT OR REPLACE INTO blog_posts (slug, title, description, primer, date, author, category, tags, featured, hero_image, content, updated_at)
VALUES ('what-i-learned-from-my-worst-pull-request', 'What I Learned From My Worst Pull Request', 'A developer''s honest story about misusing AI tools on a new project, and the framework that fixed everything.', 'My PRs were pure AI slop. Here''s the framework that fixed it.', '2026-01-13', 'Zoltan Erdos', 'Developer Experience', '["ai","developer-tools","claude","lessons-learned","code-quality","pull-requests"]', 1, '/blog/what-i-learned-from-my-worst-pull-request/hero.png', 'I need to tell you something. Something I am not proud of.

For a brief period in 2025, when I started on a new project, my pull requests were pure AI slop. Even with my very best effort to avoid it.

Let me tell you exactly what happened.

---

## The New Project

I joined a team working on two connected applications. A Next.js app handling customer cancellations. An Angular app running the main e-commerce store. The tech stack looked interesting. The people seemed smart. I was ready to prove myself.

The codebase was pragmatic. You could tell previous developers had put care into it. Yes, there was some tech debt - what codebase does not have that? But the architecture was deliberate. Certain things had to be done in certain ways because that is how the system was designed to work.

I had never built an e-commerce site before. This would become important.

I had a secret weapon. Or so I thought.

AI coding tools had become incredibly powerful by 2025. Claude Code. These were not simple autocomplete tools anymore. They could understand complex codebases. They could write entire features. They could refactor large amounts of code.

I used them constantly. And they were fast. So fast.

My first PRs looked amazing. Clean code. Good structure. Proper error handling. The tests passed. The linter was happy. I felt like a hero.

I was not a hero. I was building on sand.

---

## The Basket API Incident

It was one of my first tickets on the project.

The task seemed simple. Track analytics when a user accepts a retention offer. The flow went like this: a customer goes to cancel their account in the Next.js app, sees a retention offer with an ID in the URL, clicks it, gets redirected to the Angular app with that ID, and checks out. I needed to track that checkout event.

Here is where my inexperience killed me.

I had never built an e-commerce site. In my head, the frontend holds the basket in memory until checkout. The user adds things to their cart, the frontend stores it, then sends everything to the server when they click "buy." That made sense to me.

So I asked Claude to help me implement the tracking. And Claude generated code. Beautiful code. It called the Basket API to fetch the basket data so we could track the checkout.

It looked perfect. It passed the tests. The linter was happy.

I submitted the PR.

---

## The Perfect Storm

Here is something I did not know at the time. Claude was having [documented technical issues](https://www.anthropic.com/engineering/a-postmortem-of-three-recent-issues) during this period. Context window routing errors affected 30% of Claude Code users. The model was producing responses that looked good but were actually degraded.

The tool I trusted was producing good-looking but low-quality output. And I had no way to know.

When AI hallucinates confidently, it makes you hallucinate too. Claude''s output looked right. It felt right. So I felt confident. I submitted work I did not fully understand because the AI seemed to understand it.

---

## The Code Review

One colleague kept asking questions. Questions I could not answer.

"Why are you calling the Basket API here?"

I did not know. I thought it was necessary to get the basket data for tracking.

"The basket is already on the server. The ID in the URL is just for verification."

I did not understand.

Then a more senior developer reviewed the PR. She was direct. The PR was essentially garbage. Only tiny parts were useful.

The basket was server-side. That was the architecture. The backend was the single source of truth. The ID from the cancellation app was just for double-checking against what was already stored on the server. There was no need to call the Basket API at all.

I sat there, staring at my screen. I had no answer for why I wrote this code. Because I did not write it. Claude did. And I approved it without understanding.

---

## The Root Cause

The AI is not the problem. I was the problem.

I did not know what I did not know. The ticket requirements were not clear, but I did not know enough to ask the right questions. I had never built e-commerce before. I did not understand the architecture. So I could not verify what the AI assumed.

The codebase was well-designed. The previous developers had put thought into how the basket system worked. There were good reasons for the three-layer architecture. But I did not take the time to understand those reasons before asking Claude to generate code.

I was using AI as a shortcut instead of a tool. There is a big difference.

A shortcut replaces your work. A tool helps you do your work better. I was treating AI like a shortcut. I needed to treat it like a tool.

---

## What Changed

After that incident, everything changed.

**First, I created comprehensive documentation.** I gathered everything - Confluence docs, code comments, API documentation, other team''s codebases. I used NotebookLM to generate learning tutorials, system diagrams, flashcards, quizzes. In one weekend, I mastered the domain knowledge that I had been missing.

**Second, I encoded project patterns into Claude''s instructions.** Custom skills. Team conventions. Coding standards. How the basket architecture actually works. Now the AI follows our patterns automatically instead of guessing.

**Third - and this is the most important change - the agent now interviews me during planning.** Before any code is written, the agent asks me questions. It keeps asking until I have a full picture. If I cannot answer a question, I go back to the documentation. Or I run another agent to find out. This ensures I understand what I am building before I build it.

If the agent had interviewed me before that basket PR, it would have asked: "What data already exists on the server?" And I would have had no answer. That would have stopped me from making the mistake.

**Fourth, I test differently now.** The agent spins up a browser. Logs in with test credentials. Tries to pass the feature like a human tester would. Takes screenshots. Compares them with Figma designs. It catches bugs that manual testing would catch.

My effort distribution is completely different now. 30% planning. 50% testing. 20% quality improvement. The actual coding takes almost no time compared to understanding and verifying.

---

## The Aftermath

I stopped producing slop. My PRs are now high quality.

But my reputation at work is still damaged. My PRs still take longer to review than my colleagues'' PRs. The trust I broke takes time to rebuild.

That is the hidden cost of bad PRs. It is not just bad code. It is broken trust. And trust rebuilds slowly.

Despite this, I am positive. The system works. The quality is there. Each good PR adds a little trust back.

---

## My Advice to You

If you are new to a project and using AI tools, please hear me.

The AI will make you feel productive. You will ship code fast. Your PRs will look clean. But you might be building on assumptions you cannot verify.

Slow down. Ask questions. Understand the architecture. Talk to your teammates. Create documentation. Have the AI interview you about the problem before it writes any code.

The codebase you are working on probably has good reasons for being the way it is. Previous developers made thoughtful decisions. Take time to understand those decisions before you let AI generate code that ignores them.

AI coding tools are incredible. They have changed how I work forever. But they are not a replacement for understanding. They are a multiplier. And if you multiply zero understanding by a powerful AI, you still get zero.

I still use AI every day. More than ever. But now I use it as a partner that questions me, not a shortcut that lets me skip understanding.

My PRs are not slop anymore. They are my work, enhanced by AI.

That is the difference. And it matters.', unixepoch());