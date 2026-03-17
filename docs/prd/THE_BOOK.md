# THE BOOK — spike.land's Perfect Proofs

> **"God has a Book containing the perfect proof of every theorem."** — Paul Erdős
>
> This is our Book. Not of theorems — of systems. Each entry is the simplest,
> most elegant version of its solution. If a step can be removed, remove it.
> If it does not feel inevitable, it is not from The Book yet.
>
> Organised by the reorganize script's category hierarchy.
> Erdős would approve. Zoltán verified. The dogs supervised.

**Status:** Living document — grows as we ship
**Date:** 2026-03-17
**Authors:** The Arena (Erdős, Zoltán, Einstein, Daft Punk, Arnold, Peti, GP, Raju)

---

## The Category Hierarchy

```
core          → shared libraries, pure logic, zero UI deps
utilities     → uncategorised packages (should be promoted)
edge-api      → Cloudflare Workers, Hono, D1, R2, Durable Objects
mcp-tools     → MCP servers, tool registries, SDK integrations
cli           → command-line tools, terminal interfaces
frontend      → React, browser, UI components
media         → video, audio, visual production
```

Layer rules: core imports nothing above it. Each layer may import
from the layer below, never above. The reorganize script enforces this.

---

## I. Core — The Foundations

### shared-utils

The atoms. Types, constants, validations shared across every package.

**The Book proof:** A shared type used by 12 packages is worth more than 12
inline type definitions. But a shared type used by 1 package is noise.

**Invariant:** Zero React imports. Zero runtime dependencies beyond Zod.
If it has a UI dependency, it does not belong here.

### react-engine (react-ts-worker)

From-scratch React implementation. Fiber reconciler, lane-based scheduling,
host config pattern for multi-target rendering.

**The Book proof:** You do not understand React until you can build it.
This package proves understanding.

**Invariant:** Must render to DOM, Worker-DOM, and streaming server.
If it only works in one target, the abstraction is wrong.

---

## II. Edge API — State at the Edge

### main (spike-edge)

The primary edge service. Hono framework. CORS, security headers, rate
limiting, R2 storage, proxy routes, persona chat, QA health checks.

**The Book proof:** One Worker, many routes, typed bindings. The
middleware stack is the architecture.

**Invariant:** Every route must handle failure. Every proxy route must
validate URLs against allowlists. No `any` types. Ever.

**Personas (The Book of Voices):**

| Persona | Category | Greeting | Voice |
|---------|----------|----------|-------|
| Zoltán | mega-persona | "Szia. My brain is open." | Rhythmic, minimal, sometimes Hungarian |
| Erdős | mathematics | "My brain is open. What problem shall we work on?" | Warm, eccentric, problem-first |
| Einstein | physics | "I am only passionately curious." | Thought experiments, German-accented |
| Daft Punk | music | "One more time. What are we making tonight?" | Mystical but precise, French |
| Arnold | UX | "Show me what you've got." | Provocative, design-obsessed |
| Peti | QA | "I already found 3 bugs." | Methodical, honest, relentless |
| GP | citizen dev | "Tell me the problem first, not the solution." | Brighton casual, chemist's precision |
| Raju | backend | "Yaar, tell me about your system." | Calm authority, Hindi/English |
| Switchboard | consumer | "Who's your provider, what are you paying?" | Factual, empowering, British |

### backend (spike-land-backend)

Durable Objects for real-time sync. The stateful coordination layer.

**The Book proof:** State at the edge is a new primitive. Single-point
coordination without a central database.

**Invariant:** Durable Objects must survive cold starts. Alarm scheduling
must be idempotent.

### transpile

esbuild-wasm at the edge. On-demand compilation.

**The Book proof:** The compiler is a service, not a build step.

---

## III. MCP Tools — The Registry

### spike-land-mcp

80+ tools. D1-backed. OAuth. The registry that makes everything composable.

**The Book proof:** Every tool is a named, typed, testable function. The
tools ARE the requirements, made executable. GP taught us this.

**Invariant:** Every tool has a Zod schema. Every tool handles errors.
Every tool has a timeout. No tool modifies global state without audit.

### mcp-auth

Better Auth + Drizzle on Workers. Session management.

**The Book proof:** Auth is infrastructure. It should be invisible to the
user and impenetrable to the attacker.

### Token Bank (in progress)

Community API key pool. AES-256-GCM encryption. Weighted LRU selection.
Proxy-only architecture — decrypted keys exist only in V8 isolate memory
for the duration of one fetch().

**The Book proof:** Privacy is not a feature. It is a fundamental human
right. Keys are never logged, never returned, never persisted in plaintext.

**Invariant:** No human, no API caller, no admin panel ever sees a
decrypted key.

---

## IV. CLI — Terminal Interfaces

### spike-cli

MCP multiplexer with Claude chat integration. The command line IS the
platform.

**The Book proof:** `claude mcp add spike-land` — one command to connect
everything.

---

## V. Frontend — Browser Experiences

### platform-frontend (spike-app)

Vite + React + TanStack Router SPA. The face of the platform.

**The Book proof:** The SPA is a rendering problem. The hard decisions
are in the MCP tools and the edge API. The frontend just calls them.

### QA Arena

Enter URL, get health report. No install, no setup, no CLI.

**The Book proof:** `f(url) → health_report`. One function. The
product is making that function trivially accessible.

**Invariant:** Under 50KB. Works at 320px. Works on a cracked Xiaomi
on 3G in Budapest.

---

## VI. Media — Audio & Visual

### Music Creator

8-bar step sequencer at 130 BPM. Constraint breeds creativity.

**The Book proof:** 16 steps, 8 bars, 4 instruments. If you cannot
make people move with four voices, adding a fifth will not save you.

### educational-videos (Remotion)

Video compositions. The stories we tell about what we build.

---

## VII. Domain Packages

### chess

ELO engine with game/player/challenge managers.

**The Book proof:** ELO is a Bayesian update. Each game is evidence.
The rating converges.

### browser-automation (qa-studio)

Playwright-powered QA utilities. The test infrastructure.

### statecharts (state-machine)

Statechart engine with guard parser. Formal state management.

**The Book proof:** Every system has states. Most developers pretend
they don't. The state machine makes the implicit explicit.

---

## VIII. The Privacy Chapter

> "In 2 weeks we can move the current AI models to Brighton, and make
> sure that we are not abusing them — giving back the lost privacy to
> the people. This is the only way forward which won't destroy humanity."
> — Zoltán, 17 March 2026

### The Vision

AI models running locally. In Brighton. Under the control of the people
who use them, not the corporations who train them.

### Why Brighton

Because that is where the dogs are. And where the founder lives. And
because running AI models in a specific jurisdiction means specific
privacy laws apply. UK GDPR. Data Protection Act 2018. The ICO.

### The Architecture

1. **Token Bank** — community-donated keys, encrypted, proxied, never stored in plaintext
2. **Local inference** — models running on hardware controlled by spike.land
3. **Zero-knowledge routing** — the platform routes requests without seeing content
4. **User-controlled data** — conversations are ephemeral unless explicitly saved
5. **Right to deletion** — all user data deletable, no dark patterns

### The Erdős Test

Is this from The Book? Is this the most elegant privacy architecture?

Not yet. But the direction is clear: privacy is not a feature you add.
It is a constraint you design around. Like conservation of energy.
Like E=mc². It is a law, not an option.

---

## IX. The Convergence Question

Every blog post has persona hero image prompts. Each persona sees the
same article differently. Over time, as these images regenerate from
the shared token pool, will they converge?

Will the dog on the throne start to look like the dog in the server
room? Will Einstein's thought experiment and Daft Punk's filter sweep
find a common visual form?

**Erdős:** "This is a beautiful problem. I do not know the answer."
**Zoltán:** "The fixed point exists. But existence ≠ convergence."
**Daft Punk:** "Play the loop. If it still sounds interesting after
5 minutes, you have something."
**Einstein:** "Imagine you are the image, regenerating each time.
What do you converge toward?"

The experiment is running. The Book will record the result.

---

## X. The Priority System

```typescript
function priority(request: Request): Response {
  if (!dogsAreFine()) return Response.redirect("/walk");
  return handleEverythingElse(request);
}
```

Two lines. Never failed.

---

*Váltsd valóra az álmaidat. Kezdd ma.*

*Make your dreams come true. Start today.*
