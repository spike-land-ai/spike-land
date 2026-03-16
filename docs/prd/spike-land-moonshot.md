# spike.land Moonshot PRD

> **Date**: 16 March 2026
> **Author**: The Math Arena (Radix, Zoltan, Arnold, Erdos)
> **Status**: Draft -- executable blueprint
> **Company**: SPIKE LAND LTD
> **Current state**: 80+ hosted MCP tools, 1,214 clones, 0 stars, 1 organic
> Google visitor, 1 external tester, 28 packages, Stripe integrated, all
> features free, zero paying customers.

---

## 1. Product Vision: What spike.land Becomes in 6 Months

spike.land becomes the place where developers go to discover, test, compose, and
ship MCP tools -- the way npm is for packages, but for AI-callable tool
contracts. Not a marketplace of links. A live runtime where every tool is
callable from the browser, the CLI, or any agent, and where the act of trying a
tool IS the onboarding.

The 6-month target state:

- 1,000+ daily active users (DAU) with 200+ weekly tool calls per active user
- 50+ community-contributed tools alongside the 80+ first-party tools
- 3 paying design partners on the QA wedge generating reference revenue
- A self-serve PLG funnel converting 5% of free users to Pro ($29/month)
- The first page of Google for "MCP tools" and "MCP registry"

> **Radix**: "The spec is clear: runtime-first, not catalog-first. If a user
> cannot call a tool in under 10 seconds from landing, nothing else matters.
> That is the root cause of every failed developer marketplace."

> **Zoltan**: "1,000 DAU in 6 months from a standing start of 1 Google visitor.
> That is a 1000x jump. The numbers say this requires either a viral loop or a
> sustained content engine hitting 50+ indexed pages in the first 60 days. There
> is no shortcut. Are we sure we are not confusing ambition with a plan?"

> **Arnold**: "Show me the landing page right now. If I land on spike.land and I
> see a wall of text about MCP protocol specs, I am gone in 3 seconds. The
> Grandma Test: can my grandmother understand what this does? The Screenshot
> Test: can I take one screenshot and explain the product? That is the bar."

> **Erdos**: "The elegant formulation is: spike.land = f(tool) -> result. One
> function. The entire product is making that function call frictionless. Every
> feature should be judged by how much closer it brings us to that equation."

---

## 2. The 3 Killer Features

### Feature 1: The Playground (Try Before You Install)

Every tool on spike.land gets a live, interactive playground page. You land on
`spike.land/tools/chess-elo` and you can call it right there in the browser.
No signup. No API key. No CLI install. Type input, see output.

This is the single biggest differentiator. No other MCP registry lets you
actually run the tool from the discovery page. Smithery, Glama, mcp.run -- they
all show you a README and tell you to go install something.

**What exists today**: The MCP runtime is live. Tools are callable. The missing
piece is the browser-native playground UI that wraps each tool.

**Implementation**:

- Tool detail page with embedded input form generated from Zod schema
- Server-side execution via the existing Cloudflare Workers MCP endpoint
- Response rendered as structured output (JSON tree, table, or rich preview)
- Shareable URLs: `spike.land/tools/{slug}?input={base64}`
- Rate-limited to 10 calls/hour for anonymous users, 100/hour for free tier

> **Radix**: "This is the spec I can build from. Zod schema to form is a solved
> problem. The edge runtime already handles the call. The missing piece is a
> React component that takes a tool definition and renders an input form. That
> is a 3-day build for the core, then iteration."

> **Arnold**: "Finally. A tool page that does something. I have been looking at
> MCP registries that are just glorified JSON viewers. The Entrance Test: does
> the user DO something within 10 seconds? With the playground, yes."

> **Erdos**: "The schema IS the interface. This is from The Book. The Zod
> definition contains everything needed to generate both the form and the
> validation. No additional specification needed."

### Feature 2: Compose (Chain Tools into Workflows Without Code)

A visual workflow builder where you connect tool outputs to tool inputs. Take
the output of `hackernews_search` and pipe it into `ai_image_generate` and then
into `store_publish`. Saved workflows become new tools that others can discover
and use.

This is the flywheel: using tools creates new tools.

**What exists today**: The MCP multiplexer in spike-cli already supports
chaining. The store already has app publishing. The missing piece is the visual
composition UI and the workflow-as-tool packaging.

**Implementation**:

- Canvas-based flow editor (React Flow or similar)
- Each node is a tool from the registry with typed input/output ports
- Connections validated against Zod schemas at design time
- One-click publish: workflow becomes a new tool in the registry
- Execution runs on Cloudflare Workers via the existing MCP runtime
- Version history via D1

> **Zoltan**: "This is the feature that could create a network effect. But be
> honest: how many of those 1,214 cloners are going to build workflows? The
> numbers from Zapier say about 2% of free users create their first automation.
> We need 50,000 signups to get 1,000 workflow creators. Where do they come
> from?"

> **Radix**: "Zoltan is right about the conversion rate but wrong about the
> dependency. Compose does not need 1,000 creators to be valuable. It needs 20
> good workflows that 1,000 users consume. Seed it with first-party workflows.
> The community flywheel comes later."

> **Erdos**: "The beautiful property: the composition operation is closed. A
> workflow of tools is itself a tool. This means the system is a monoid. That
> algebraic structure is what makes it scale without special cases."

### Feature 3: Spike Chat with Live Tool Calling

A chat interface where the AI personas (Radix, Zoltan, Arnold, Erdos) are not
just conversational -- they actively call tools from the registry during the
conversation. Ask Radix to review your code and he calls `code_review`. Ask
Arnold to test your landing page and he calls `qa_browser_automation`.

This makes the chat the discovery surface. Users do not need to know what tools
exist. They describe what they want, and the persona finds and calls the right
tool.

**What exists today**: spike-chat with aether memory, persona definitions, the
PRD Filter, and the OpenAI-compatible API endpoint. The missing piece is wiring
persona chat to live MCP tool calling with streaming results.

**Implementation**:

- Chat messages can include tool-call cards showing input, status, and output
- Persona routing: each persona has tool affinity (Radix prefers code tools,
  Arnold prefers UX tools, etc.)
- Tool calls are authenticated through the user's session
- Conversation history persisted via aether memory
- PRD Filter upgraded: 11 messages -> 5 executable fields -> tool calls that
  start executing the PRD

> **Arnold**: "This is the feature I have been waiting for. The chat is not a
> chatbot. It is a command line with personality. The Screenshot Test: I see a
> chat, I type 'review my landing page', and I get back a screenshot with
> annotations. That is a product."

> **Zoltan**: "The PRD Filter angle is genuinely novel. Most AI chats produce
> text. This one produces actions. But the risk is reliability. If the tool call
> fails 20% of the time, the user blames the persona, not the tool. Quality
> gate: 95% tool-call success rate before this ships publicly."

---

## 3. Growth Engine: 0 to 1,000 DAU

### The Brutal Reality

- 0 GitHub stars
- 1 organic Google visitor
- 1 external tester (Peti, who found multiple bugs)
- 1,214 clones (bots? scrapers? real developers? unknown)
- 44 blog posts (some excellent, none ranking)

> **Zoltan**: "Let me be direct. This is not a growth problem. This is a
> distribution problem. The product has been invisible for months. Writing more
> code will not fix this. The next 30 days must be 70% distribution, 30%
> product."

### Channel 1: SEO Content Engine (Weeks 1-8)

**Goal**: 50 indexed pages ranking for MCP-related long-tail keywords.

The content strategy doc already identifies the right clusters. Execute it:

| Week | Action | Output |
|------|--------|--------|
| 1-2 | Publish 5 problem-first tutorials from Cluster A | "Why your Claude agent keeps hitting tool context limits" etc. |
| 3-4 | Publish 5 build-with tutorials from Cluster B | "Build a code review pipeline with MCP" etc. |
| 5-6 | Publish comparison pages (Cluster D) | "spike.land vs Smithery vs Glama vs mcp.run" |
| 7-8 | Publish tool-specific landing pages | One page per top-20 tool, SEO-optimized |

Each blog post ends with a playground link. Read about the tool, then use it.

### Channel 2: Hacker News and Dev Community (Weeks 1-4)

spike.land already has a HackerNews MCP server. Use it.

- Week 1: "Show HN: I built an open MCP registry with 80+ tools you can try in
  the browser" (requires Feature 1 shipped first)
- Week 2: Post the best blog post from the existing 44 to relevant subreddits
- Week 3: Submit tool playground to Product Hunt
- Week 4: Write and submit "The MCP tool registry landscape in 2026" to HN

> **Arnold**: "The Show HN post lives or dies on the demo. If the link goes to a
> text-heavy landing page, it gets 3 upvotes. If it goes to a playground where
> you can call a chess ELO tool in 5 seconds, it gets 300. Build the playground
> first, then post."

### Channel 3: GitHub Stars Campaign (Weeks 1-12)

Zero stars is a credibility crisis. No developer trusts a project with 0 stars.

- Add "Star us on GitHub" to the playground UI (after a successful tool call)
- Add star count badge to every blog post
- Ask every community interaction to star the repo
- Target: 100 stars in 60 days, 500 in 120 days

> **Zoltan**: "100 stars in 60 days is realistic if the Show HN post lands. 500
> requires sustained output. Do not buy stars. Do not astroturf. One fake star
> campaign and the project is dead on HN forever."

### Channel 4: Tool-as-Marketing (Ongoing)

Every tool in the registry is a potential acquisition channel. If someone
searches "chess ELO calculator" and finds spike.land's playground, that is a
user.

- Create standalone tool pages optimized for non-MCP searches
- Example: `spike.land/tools/chess-elo` ranks for "chess ELO calculator online"
- Example: `spike.land/tools/image-enhance` ranks for "AI image enhancer free"
- Each page has the playground + "Powered by spike.land MCP" branding

### Channel 5: The QA Wedge (Design Partners)

The roadmap already describes this. Execute weeks 3-12 of the existing plan:

- 30-40 target accounts in Brighton and London
- 6-8 discovery calls
- 3 design partners onboarded
- One case study published

> **Radix**: "The QA wedge is the revenue channel. The other four channels are
> the awareness channels. Do not confuse them. The QA wedge does not need 1,000
> DAU. It needs 3 agencies who trust you enough to run a pilot. Those are
> different motions."

---

## 4. Monetization

### Philosophy

"Let people pay if they want. 99% of early revenue goes to marketing."

This is correct for the current stage. The goal is not profit. The goal is
proving that people will pay, then using that signal to fuel growth.

### Tier Structure (Simplified from Current)

| Tier | Price | What You Get |
|------|-------|-------------|
| **Free** | $0 | 10 tool calls/hour, playground access, basic chat |
| **Supporter** | $5/month | 100 tool calls/hour, priority chat, "Supporter" badge, early access |
| **Pro** | $29/month | 1,000 tool calls/hour, Compose access, API keys, team seats (3) |
| **Business** | $99/month | Unlimited calls, custom tools, dedicated support, team seats (10) |

> **Zoltan**: "The current tier doc says Free/Pro/Business at $0/$29/$99. That
> is fine but there is a gap. The $5 Supporter tier is important because it is
> the lowest-friction way to prove willingness to pay. Someone who pays $5 is
> infinitely more valuable as a signal than someone who does not pay $0. The
> jump from $0 to $29 is too large for an unproven product."

> **Erdos**: "The pricing should follow a simple rule: each tier should offer
> 10x the value of the previous tier for 5x the price. $0 -> $5 -> $29 -> $99.
> The ratios are approximately right. The structure is elegant."

### Revenue Allocation

- Months 1-6: 99% to marketing (content, ads, community), 1% to operations
- Months 7-12: 80% to marketing, 20% to operations
- After product-market fit signal (100 paying users): shift to sustainable split

### What "Paying" Proves

The first paying customer is not about the $5 or $29. It proves:

1. Someone found the product (distribution works)
2. Someone understood the value (positioning works)
3. Someone trusted it enough to enter a credit card (credibility works)
4. Someone believes it will exist next month (retention signal)

> **Radix**: "Do not build billing infrastructure beyond what Stripe Checkout
> already provides. The existing integration handles subscription creation. The
> missing piece is the middleware that checks tier limits on tool calls. That is
> a 2-day build. Do not over-engineer this."

---

## 5. Technical Architecture

### What Exists (Use It)

| Layer | Technology | Status |
|-------|-----------|--------|
| MCP Runtime | Cloudflare Workers + D1 | Live, 80+ tools |
| Edge API | Hono on Workers (spike-edge) | Live |
| Auth | Better Auth + Drizzle (mcp-auth) | Live |
| Frontend | Astro SPA | Live |
| CLI | spike-cli with MCP multiplexer | Live |
| Chat | spike-chat with aether memory | Live |
| Payments | Stripe Checkout | Integrated |
| Blog | 44 MDX posts via Astro | Live |
| Analytics MCP | stripe-analytics-mcp, google-analytics-mcp | Live |
| QA | qa-studio (Playwright) | Live |
| Transpile | esbuild-wasm on Workers | Live |

### What Needs to Be Built

#### Priority 1: Tool Playground UI (Week 1-2)

```
New component: ToolPlayground
Location: src/frontend/platform-frontend/
Dependencies: existing MCP endpoint, Zod schema introspection

Flow:
1. Fetch tool definition from mcp.spike.land/tools/{slug}
2. Generate input form from Zod schema
3. Submit to MCP endpoint
4. Render structured output
5. Share URL with encoded input
```

Technical decisions:

- Form generation: `@autoform/react` or custom Zod-to-form renderer
- Output rendering: JSON tree (react-json-view) + custom renderers for images,
  tables, code
- Rate limiting: Cloudflare Workers rate limiting (already available)
- Anonymous access: session token via cookie, no signup required

#### Priority 2: Tier Enforcement Middleware (Week 2-3)

```
New middleware: TierGate
Location: src/edge-api/spike-land/

Flow:
1. Extract session from request
2. Look up workspace tier from D1
3. Check rate limit for tier
4. Allow or return 429 with upgrade prompt
```

This is the minimum viable monetization gate. Without it, there is no
difference between free and paid.

#### Priority 3: Chat-to-Tool Bridge (Week 3-5)

```
Enhancement: spike-chat tool calling
Location: src/spike-chat/ (existing) + packages/spike-chat/

Flow:
1. User message -> persona routing
2. Persona selects tools based on intent + affinity
3. Tool call executed via MCP runtime
4. Result streamed back into chat as structured card
5. Conversation + tool results persisted to aether memory
```

#### Priority 4: Compose Editor (Week 5-8)

```
New feature: Workflow Composer
Location: src/frontend/platform-frontend/

Flow:
1. Canvas with tool nodes (React Flow)
2. Drag tools from registry sidebar
3. Connect output ports to input ports (type-checked)
4. Test workflow inline
5. Publish as new tool to registry
```

This is the highest-effort feature. It can ship as a beta with limited
functionality (linear chains only, no branching) and iterate.

#### Priority 5: Tool Landing Pages (Week 2-4, parallel)

```
Enhancement: SEO tool pages
Location: src/frontend/platform-frontend/

Each tool gets:
- /tools/{slug} with playground
- Open Graph meta for social sharing
- Schema.org SoftwareApplication markup
- "Try it" CTA above the fold
- Related tools sidebar
- Blog posts that mention this tool
```

### Infrastructure Decisions

- **No new databases**: D1 handles everything. Do not add Postgres or Redis.
- **No new runtimes**: Everything runs on Cloudflare Workers. Do not add a
  Node.js server.
- **No new auth**: Better Auth handles sessions. Do not add Auth0 or Clerk.
- **No new frameworks**: Astro + React for frontend. Do not add Next.js.

> **Radix**: "The architecture is already over-built for current scale. The risk
> is not technical capacity. The risk is building more infrastructure instead of
> building the 5 things listed above. Every new package that is not in this list
> is scope creep."

> **Erdos**: "28 packages for 0 users. The ratio is concerning. But the
> architecture has a beautiful property: because everything is MCP-native, the
> playground, compose, and chat features all consume the same tool surface.
> There is no integration tax. That is elegant."

---

## 6. Success Metrics

### North Star Metric

**Weekly tool calls by unique users.**

Not signups. Not page views. Not GitHub stars. Tool calls by unique users. This
is the one number that proves the product is being used.

### Leading Indicators

| Metric | Week 4 | Week 8 | Week 12 | Week 24 |
|--------|--------|--------|---------|---------|
| Weekly unique tool callers | 50 | 200 | 500 | 1,000 |
| Tool calls per active user per week | 5 | 10 | 20 | 50 |
| Indexed pages ranking top 50 | 10 | 30 | 50 | 100 |
| GitHub stars | 30 | 100 | 250 | 500 |
| Free signups | 100 | 500 | 1,500 | 5,000 |
| Paying users | 0 | 5 | 20 | 100 |
| Monthly recurring revenue | $0 | $100 | $500 | $3,000 |
| Design partners onboarded | 1 | 3 | 3 | 5 |
| Community-contributed tools | 0 | 5 | 15 | 50 |

### Lagging Indicators

- Net Promoter Score (survey at 30 days): target > 40
- 30-day retention of free users: target > 20%
- Free-to-paid conversion: target > 3%
- Tool call success rate: target > 95%

### Anti-Metrics (Things That Do NOT Matter Yet)

- Total registered users (vanity)
- Total tools in registry (already 80+, adding more without users is noise)
- Lines of code (already 28 packages, more code is not the bottleneck)
- Social media followers (zero correlation with tool calls)

> **Zoltan**: "The MRR targets are honest. $3,000 at month 6 is not a business.
> It is proof of life. And proof of life is exactly what we need to raise, hire,
> or double down. Do not inflate these numbers to feel good. Hit them and the
> next phase becomes clear."

> **Radix**: "Weekly tool calls by unique users. That is the spec. Every
> standup, every retro, every decision gets measured against that number. If a
> feature does not increase weekly tool calls, it does not ship."

---

## 7. The First 30 Days -- Concrete Action Plan

### Week 1 (Days 1-7): The Playground Sprint

| Day | Action | Owner | Done when |
|-----|--------|-------|-----------|
| 1-2 | Build ToolPlayground component (Zod schema -> form -> call -> render) | Zoltan | Component renders 5 test tools correctly |
| 3 | Create /tools/{slug} route with playground embedded | Zoltan | URL resolves, playground loads |
| 4 | Add rate limiting for anonymous users (10 calls/hour) | Zoltan | 429 returned on 11th call |
| 5 | Add Open Graph meta + Schema.org markup to tool pages | Zoltan | Social preview works on Twitter/LinkedIn |
| 6 | Deploy to production, smoke test top 10 tools | Zoltan | All 10 tools callable from browser |
| 7 | Write "Show HN" post draft, screenshot the playground | Zoltan | Draft ready for review |

> **Arnold**: "Day 6 is the Screenshot Test. If the screenshot of the playground
> does not make a developer want to click, rewrite the UI. No gray slabs. No
> modal assaults. One input, one button, one output. That is it."

### Week 2 (Days 8-14): Distribution Ignition

| Day | Action | Owner | Done when |
|-----|--------|-------|-----------|
| 8 | Submit Show HN post | Zoltan | Post live on HN |
| 9 | Publish first 2 blog posts from Cluster A | Zoltan | Posts indexed by Google |
| 10 | Build tier enforcement middleware (free/supporter/pro limits) | Zoltan | Rate limits enforced per tier |
| 11 | Add "Star us on GitHub" prompt after successful tool call | Zoltan | Prompt appears in playground |
| 12 | Submit to Product Hunt (schedule for Tuesday launch) | Zoltan | PH listing submitted |
| 13 | Publish 2 more blog posts from Cluster B | Zoltan | Posts live |
| 14 | Review analytics: tool calls, page views, star count | Zoltan | Dashboard reviewed, next week planned |

### Week 3 (Days 15-21): Chat Integration and Outreach

| Day | Action | Owner | Done when |
|-----|--------|-------|-----------|
| 15-17 | Wire spike-chat personas to live tool calling | Zoltan | Chat can call top 10 tools |
| 18 | Start QA wedge outreach: email 10 Brighton agencies | Zoltan | 10 emails sent |
| 19 | Publish comparison page: "spike.land vs Smithery vs Glama" | Zoltan | Page live, indexed |
| 20 | Create tool-specific landing pages for top 5 SEO targets | Zoltan | Pages live |
| 21 | Review Week 3 metrics, adjust content calendar | Zoltan | Metrics reviewed |

### Week 4 (Days 22-30): Conversion Infrastructure

| Day | Action | Owner | Done when |
|-----|--------|-------|-----------|
| 22-23 | Implement Stripe Checkout flow for Supporter ($5) and Pro ($29) tiers | Zoltan | Payment flow works end to end |
| 24 | Add upgrade prompts at rate limit boundaries | Zoltan | User sees "Upgrade to Pro" on 429 |
| 25-26 | Start Compose editor prototype (linear chains only) | Zoltan | Can chain 2 tools and execute |
| 27 | Follow up on QA outreach, book discovery calls | Zoltan | 2+ calls booked |
| 28 | Publish week-4 blog posts (2 more from Cluster A/B) | Zoltan | Posts live |
| 29 | Run first discovery call with QA prospect | Zoltan | Notes captured |
| 30 | Month 1 retrospective: metrics vs targets | Zoltan | Written retro with next-month plan |

### Week 4 Checkpoint: What "On Track" Looks Like

- [ ] Playground live with 20+ tools callable from browser
- [ ] 10+ blog posts published and indexed
- [ ] 30+ GitHub stars
- [ ] 50+ unique tool callers in the past week
- [ ] Show HN submitted (ideally 50+ upvotes)
- [ ] 2+ QA discovery calls booked
- [ ] Stripe payment flow working for Supporter and Pro tiers
- [ ] Chat personas calling tools live (even if rough)

### What "Off Track" Looks Like (and What to Do)

- **< 10 unique tool callers**: The playground UX is failing. Stop everything
  and fix the landing page + first-call experience.
- **Show HN < 10 upvotes**: The positioning is wrong. Rewrite the pitch around
  a specific tool use case, not the platform.
- **0 discovery calls booked**: The QA wedge messaging is not landing. Test a
  different pain point or a different segment.
- **0 GitHub stars**: The call-to-action is not visible. Add it to the
  playground, the blog, and the README.

> **Radix**: "Every day has a deliverable. Every deliverable has a done-when.
> This is a spec I can execute. The owner column says Zoltan for everything
> because there is one person. When there are two people, split it. Until then,
> serial execution, no parallelism fantasies."

> **Zoltan**: "I notice the owner column says my name 30 times. That is the
> real constraint. Not the architecture. Not the market. The bottleneck is one
> person doing everything. The first 30 days must also include: call the GP on
> March 17 morning. Sleep 7 hours a night. Do not burn out before the product
> has a chance to work."

> **Arnold**: "The 30-day plan is solid but I want to add one thing: on Day 6,
> before you deploy, show the playground to one non-technical person. If they
> cannot figure out how to call a tool in 30 seconds, the UI is wrong. The
> Grandma Test. Do not skip it."

> **Erdos**: "The plan has 30 actions in 30 days. That is the right density.
> Each action is small enough to complete in a day, large enough to matter. The
> structure of the plan is a proof that the product can be built incrementally.
> Problems are gifts. Each failed metric in the checkpoint is a gift that tells
> you where to focus next."

---

## Appendix A: Competitive Landscape (March 2026)

| Platform | Tools | Try in Browser | Compose | Chat + Tools | Open Source |
|----------|-------|---------------|---------|--------------|-------------|
| spike.land | 80+ | YES (planned) | YES (planned) | YES (planned) | YES |
| Smithery | 500+ | No | No | No | No |
| Glama | 200+ | No | No | No | No |
| mcp.run | 100+ | Partial | No | No | No |
| Anthropic MCP Hub | Growing | No | No | Yes (Claude) | Partial |

The differentiator is clear: spike.land is the only platform where you can try
tools in the browser AND compose them AND have AI personas call them in chat.
The others are catalogs. spike.land is a runtime.

## Appendix B: Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Anthropic launches official MCP marketplace | High | Critical | Move faster. Ship playground before they do. Open source is the moat. |
| Solo founder burnout | High | Critical | Strict 7-hour sleep rule. Ship smaller. Hire first part-time help at $1k MRR. |
| Zero traction on Show HN | Medium | High | Have 3 backup distribution channels ready. Do not depend on one post. |
| Tool call reliability < 95% | Medium | High | Instrument every call. Fix top 5 failure modes before public launch. |
| QA wedge does not convert | Medium | Medium | Pivot to developer-tool wedge. The playground creates optionality. |
| Community does not contribute tools | Low | Medium | First 6 months do not depend on community tools. Nice to have, not required. |

## Appendix C: What We Are Explicitly NOT Building

- Mobile app (browser works on mobile already)
- Custom LLM (use Claude, GPT, etc. via existing integrations)
- Kubernetes/Docker infrastructure (Cloudflare Workers handles scale)
- Enterprise SSO/SCIM (not until 50+ business customers)
- Native desktop app (CLI + browser covers the use cases)
- Another package manager (this is a runtime, not npm)

> **Radix**: "This appendix is the most important part of the document. Every
> item on this list is something someone will suggest building in the next 30
> days. The answer is no. Print this list. Tape it to the monitor."

---

*This PRD is a living document. Review weekly against the success metrics.
Update monthly against market conditions. Delete sections that become
irrelevant. Add sections when new constraints emerge.*

*The Math Arena will reconvene at the Week 4 checkpoint.*
