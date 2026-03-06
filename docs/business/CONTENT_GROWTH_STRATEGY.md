# spike.land Content & Community Growth Strategy
> Last updated: 2026-03-06
> Owner: Growth / Marketing
> Context: MCP registry platform, 80+ tools, Cloudflare-edge stack, freemium SaaS

---

## Executive Summary

The MCP ecosystem hit mainstream in January 2026 — 10,000+ public servers,
every major AI vendor converging on the protocol. spike.land's window to become
the canonical MCP registry for developers is open now and will narrow within
6 months as larger players (Anthropic, GitHub, Cloudflare) move into the space.

The playbook: own the SEO surface for "how do I build/use/publish MCP tools",
create a contributor flywheel around the tool marketplace (Phase 13), and use
the HackerNews MCP and existing blog quality to punch above our weight in
developer communities.

---

## 1. Content-Led Growth

### What Blog Topics Drive Developer Traffic for an MCP Registry

The primary content gap to exploit: most MCP content in 2026 is either
high-level protocol explainers (commoditized) or raw API docs (no traffic).
The gap is **practical, problem-first tutorials** that show up in Google when
a developer has a specific pain point with their Claude/Cursor/Copilot setup.

**High-priority topic clusters:**

**Cluster A: "My AI agent can't do X" — Problem-first tutorials**
These are the highest-converting because they capture bottom-funnel intent.
- "Why your Claude agent keeps hitting tool context limits (and how to fix it)"
- "How to give Claude access to your codebase without exposing secrets"
- "My Claude agent kept forgetting state between sessions — here's what I changed"
- "The right way to handle auth in an MCP server"
- "Why your MCP tool descriptions are making your AI worse"

**Cluster B: "Build X with MCP" — Aspirational tutorials**
Mid-funnel. Developer wants to build something, discovers spike.land.
- "Build a fully automated code review pipeline with Claude and MCP"
- "Build a chess-playing AI agent in 30 minutes (with an ELO rating)"
- "How I automated my HackerNews monitoring with an AI agent"
- "Build a browser automation pipeline without writing Playwright code"
- "Deploy a full-stack app with one CLI command using AI assistance"

**Cluster C: "MCP ecosystem" — Thought leadership / aggregator content**
Top-of-funnel. Drives links and shares from other developers.
- "The MCP tool registry landscape in 2026 — what exists and what's missing"
- "MCP vs REST APIs for AI agents — when to use each"
- "How Anthropic's MCP changed how I think about software architecture"
- "80+ MCP tools, one endpoint: how we built spike.land's registry"

**Cluster D: "spike.land vs X" — Comparison pages**
High commercial intent. See Section 3 (SEO Opportunities).

### How to Leverage 80+ Tools for SEO

**Individual tool landing pages** are the highest-ROI SEO investment available.
Each tool is a keyword-bearing page that can rank for long-tail searches.

Pattern per tool page:
```
/tools/chess-engine
  - H1: "Chess Engine MCP Tool — spike.land"
  - Description of what the tool does
  - Live demo (call the tool inline)
  - Code snippet showing how to use it
  - Related tools (internal links)
  - CTA: "Add to your Claude agent in 30 seconds"
```

80 tools = 80 SEO landing pages. This is how npm and RapidAPI built their moats.

**Tool category pages** aggregate tools and rank for broader terms:
- `/tools/browser-automation` (qa-studio tools)
- `/tools/chess` (chess arena tools)
- `/tools/code-review` (spike-review tools)
- `/tools/image-generation` (mcp-image-studio tools)
- `/tools/developer-workflow` (dev/infra tools)

**Comparison pages** target high-intent searches:
- `/compare/spike-land-vs-smithery`
- `/compare/spike-land-vs-mcp-registry`
- `/compare/mcp-multiplexer-tools`

### What Documentation Patterns Drive Organic Signups

The 140 doc files are a buried SEO asset. Currently they're internal-facing.
The highest-converting docs pattern from Vercel/Supabase/Clerk playbooks:

1. **Quickstart in under 3 minutes** — one page, one command, they're in.
   `claude mcp add spike-land --transport http https://spike.land/mcp`
   is perfect. This command needs to be on every docs page as a persistent CTA.

2. **Copy-paste code examples** — every docs page should have a complete,
   runnable example. No "see related docs" links that require two more clicks.

3. **Framework-specific guides** — "Using spike.land with Claude Code",
   "Using spike.land with Cursor", "Using spike.land with Copilot". These
   rank for the framework name + "MCP" searches.

4. **API reference that's also a marketing page** — the tool list at
   `/api/mcp` should be a beautiful, searchable page with usage counts,
   categories, and live demo capabilities. Make it shareable.

### "Build in Public" Content That Attracts Developers

The blog already has strong technical content (see `how-claude-code-engineers-context.mdx`,
`docker-layers-are-just-like-llm-context-caching.mdx`). Double down on this.

Build-in-public cadence:
- **Weekly**: Tweet a tool invocation screenshot with the raw MCP response.
  Show what the tool returns, explain why the response is designed that way.
- **Biweekly**: GitHub commit breakdown — one interesting architectural decision
  explained in a thread. The monorepo consolidation, the lazy toolset loading,
  the narrative response design from the MCP explainer post are all thread-worthy.
- **Monthly**: Full "how we built X" blog post with actual data.
  Example: "How we designed the chess MCP tool to return narrative instead of FEN"
  (already drafted in the MCP explainer — needs its own post).
- **Quarterly**: "State of spike.land" post with real metrics — tool call counts,
  most-used tools, new tools added, growth stats. Developers respect transparency.

---

## 2. Community Flywheel

### Building a Contributor Ecosystem Around the MCP Registry

The Phase 13 tool marketplace (Q2 2026) is the flywheel trigger. Before it
ships, the groundwork is creating contributors who are ready to publish on day one.

**Pre-marketplace contributor pipeline:**

1. **MCP Tool Starter Template** — a GitHub template repo that creates a
   properly structured MCP tool in under 5 minutes. Include: Zod schema,
   handler pattern, test file, README template, publish script.
   This is the `create-react-app` moment for MCP tools.

2. **"Publish your first MCP tool" tutorial** — target the ~10,000 developers
   already building MCP servers. Show them they can publish to spike.land's
   registry and get distribution. 30 lines of code from the MCP explainer post
   is the foundation for this tutorial.

3. **Tool author profiles** — give published tool authors a page on spike.land.
   Searchable, linkable, shows their tools and usage stats. This is a social
   proof mechanism that makes publishing feel worthwhile.

4. **Discord #tool-builders channel** — dedicated space for tool authors.
   Feedback loop between builders and users. Anthropic's MCP Discord is large
   but generic; a focused channel in spike.land's community fills a gap.

### What Makes Developers Share Dev Tools Organically

From studying how npm packages, VS Code extensions, and Homebrew formulas spread:

1. **Shareable outputs** — when a tool produces something worth sharing
   (a chess game replay, a code review report, a generated image), the tool
   gets shared. Design tool outputs to be shareable artifacts.

2. **"Look what I built" moments** — tutorials that end with something
   deployable or demonstrable. The chess arena is perfect for this.
   "I just challenged Claude to a chess match and it's rated 1200 ELO" is
   a tweet waiting to happen.

3. **CLI onboarding in one line** — `claude mcp add spike-land --transport http https://spike.land/mcp`
   is already this. Make sure it's the first thing in every piece of content.

4. **Honest comparisons** — developers share posts that tell them the truth
   about tradeoffs. The MCP vs CLI debate documented in SPIKE_CLI_LANDSCAPE.md
   is a genuine controversy with data on both sides. Writing the honest version
   of this post will get shared by both camps.

5. **Timing** — MCP is at peak developer mindshare right now (March 2026).
   Content published in the next 60 days will index during the peak search
   volume window. This is a time-sensitive opportunity.

### Discord/Community Strategy

Stage 1 (now — first 100 members): Do things that don't scale.
- Personally DM every developer who tweets about MCP tools.
- Post spike.land tool demos in existing AI/developer Discord servers
  (Anthropic's, Cursor's, HackerNews' Discord).
- Weekly office hours in the spike.land Discord.

Stage 2 (100-500 members): Create content reasons to join.
- "Discord-first" content: weekly tool spotlight, early access to new tools,
  beta invites for Phase 13 marketplace.
- Tool-building challenges with real prizes (API credits, PRO subscriptions).

Stage 3 (500+ members): Community creates content.
- Featured community tools in the blog.
- "Community pick" tool of the month on the homepage.
- Contributor leaderboard.

### Leveraging the HackerNews MCP Tool

This is an underutilized asset. The hackernews-mcp package gives spike.land
a direct channel to the highest-signal developer community.

**Tactical uses:**

1. **Show HN post** — "Show HN: spike.land — MCP registry with 80+ tools,
   multiplexer CLI, and a tool marketplace launching in Q2"
   This needs to be timed with a real product milestone (marketplace beta).

2. **Community research tool** — use the HN MCP tool to monitor comments
   mentioning "MCP server", "Claude tools", "AI agents" and respond with
   helpful context (not spam). Establish the spike.land name as a helpful
   presence.

3. **Trend content** — run the HN MCP tool weekly to find trending discussions
   in the AI dev space, then write the definitive blog post on that topic
   within 48 hours. This is a content velocity advantage.

4. **"Ask HN" posts** — when the tool marketplace is ready:
   "Ask HN: Would you publish your MCP tools to a developer registry?"
   Gather feedback and build in public.

---

## 3. SEO Opportunities

### Long-Tail Keyword Targets for the MCP Ecosystem

**Tier 1 — High volume, competitive (6-12 month ranking timeline):**
| Keyword | Est. Monthly Searches | Competition |
|---|---|---|
| mcp tools | 8,000-15,000 | High |
| claude mcp | 5,000-10,000 | High |
| mcp server | 12,000-20,000 | High |
| ai developer tools | 20,000+ | Very High |
| model context protocol | 8,000-12,000 | Medium |

**Tier 2 — Medium volume, rankable now (2-4 month timeline):**
| Keyword | Est. Monthly Searches | Strategy |
|---|---|---|
| mcp multiplexer | 500-2,000 | Own this term — spike-cli is the product |
| mcp tool registry | 1,000-3,000 | Category-defining page |
| claude mcp tools list | 2,000-5,000 | Tool catalog page |
| build mcp server tutorial | 1,500-4,000 | Tutorial blog post |
| mcp lazy loading tools | 200-800 | Technical differentiator post |
| mcp tool context limits | 500-2,000 | Problem-first blog post |
| mcp vs cli for ai agents | 300-1,000 | Comparison post (write the honest version) |

**Tier 3 — Low volume, high conversion (rank immediately):**
| Keyword | Strategy |
|---|---|
| spike.land mcp | Brand defense |
| spike-cli npm | Own the npm listing page |
| chess mcp tool | Individual tool page |
| browser automation mcp | Tool category page |
| hackernews mcp server | Individual tool page |
| mcp code review tool | Individual tool page |

### How to Rank for Core MCP Terms

The domain authority play: publish 10 high-quality technical posts in 60 days.
Not 10 rushed posts — 10 posts that are each definitively the best resource
on their specific topic. Quality over volume at this stage.

**Technical SEO specifics for developer tool pages:**

- **Structured data**: Add `SoftwareApplication` schema to tool pages.
  This can produce rich snippets in Google showing the tool name, description,
  and a direct CTA.

- **Code snippet optimization**: Google surfaces code blocks in featured
  snippets for tutorial queries. The `claude mcp add` command should appear
  in a properly formatted code block on the homepage, quickstart, and every
  relevant blog post.

- **Canonical URLs for tools**: Every tool at `/tools/{tool-name}` needs
  a proper canonical, meta description, and H1. This is 80 pages of SEO
  that can be templated.

- **Sitemap**: Ensure the tool pages, blog posts, and docs are all in the
  sitemap. The 140 docs files are a crawlable asset — don't let robots.txt
  block them.

- **Page speed**: Already on Cloudflare Workers (excellent). Ensure the
  spike-app bundle doesn't delay LCP — this is a ranking factor.

### Using the 140 Doc Files as an SEO Moat

Current state: internal docs, unlikely indexed or linked.
Target state: a searchable, publicly-accessible developer knowledge base.

**Conversion plan:**

1. **Publish the best-practices docs as a /guides section** — the files in
   `docs/best-practices/` (api-design.md, cicd-pipelines.md, typescript.md,
   react-patterns.md, cloudflare-services.md, stripe-integration.md) are
   genuinely useful. They attract organic links from developers who find them
   via search.

2. **Interlink docs with tool pages** — every doc about "cloudflare-services"
   links to the relevant spike.land deployment tools. Every doc about
   "stripe-integration" links to the billing MCP tools.

3. **"Living docs" signal** — add a "Last updated" date to every doc page.
   Google favors recently-updated content. The docs already have this in their
   frontmatter; surface it in the UI.

4. **Target featured snippets** — the docs/best-practices files are structured
   as lists and tables. These are prime featured snippet candidates. Format
   headings as questions: "How do I set up CI/CD for Cloudflare Workers?"

---

## 4. Viral Mechanics

### Features in Dev Tools That Create Natural Sharing Loops

**Studied patterns from npm, Vercel, Supabase, Clerk, Railway:**

| Mechanic | How It Works | spike.land Equivalent |
|---|---|---|
| npm install count | Social proof on package page | Tool call count on tool pages |
| Vercel deployment URL | Shareable output from workflow | Shareable chess game replay URL |
| Supabase "built with" badge | Creator pride + backlink | "Powered by spike.land MCP" badge |
| Clerk's live demo | Try before signup | Inline tool demos on tool pages |
| Railway one-click deploy | Reduces friction to try | `claude mcp add spike-land` one-liner |

### Making MCP Tool Publishing Viral (the npm Package Moment)

When the Phase 13 marketplace ships, the viral loop depends on tool authors
having reasons to share their published tools.

**Mechanics to build in:**

1. **Tool author attribution badge** — a small embeddable badge that shows
   tool name, install count, and author. Authors put it in their GitHub README.
   Every badge is a backlink to spike.land and a distribution channel.
   ```
   [![Available on spike.land](https://spike.land/badge/my-tool.svg)](https://spike.land/tools/my-tool)
   ```

2. **Trending tools feed** — a public `/trending` page (like npm trending or
   GitHub trending) that surfaces new and rising tools. Developers check this.
   Being on it is social proof worth sharing.

3. **"X people are using your tool right now" notifications** — email/Discord
   alerts to tool authors when their tool hits usage milestones (100 calls,
   1,000 calls, 10,000 calls). Authors share these.

4. **Tool Hall of Fame** — monthly spotlight of the top 3 community-contributed
   tools. Featured on the homepage. Blog post interview with the author.
   This is the `npm package of the week` moment.

5. **CLI install virality** — the spike-cli installation flow should print a
   shareable summary: "Connected to spike.land: 80 tools available. Most used
   this week: chess_new_game (2,341 calls)." This is shareable content in
   developer screens shared on social.

### Social Proof and Trust Signals

The early-stage playbook from Clerk/Supabase: manufacture credibility through
specificity, not vagueness.

- "80+ tools" is weaker than "83 tools across 15 categories"
- "Fast" is weaker than "P95 latency: 42ms on Cloudflare's global edge"
- "Used by developers" is weaker than "2,341 chess tool calls this week"

**Trust signals to add:**
- Real tool call counts on the homepage (pull from `tool_call_daily` — the
  infrastructure already exists in GROWTH_METRICS.md)
- "Last deployed X minutes ago" live counter
- GitHub star count for spike-cli (put it in the open source)
- Named testimonials from developers (even 3-5 from beta users)
- Security: "SOC 2 Type II in progress" or "OWASP Top 10 reviewed"
  (the SECURITY_AUDIT_REPORT.md exists — surface the outcome)

---

## 5. Content Pieces to Create This Week

### Blog Post 1: The Multiplexer Problem

**Title (primary):** "Why Your Claude Agent Is Wasting 70% of Its Context Window on Tool Descriptions"
**Title (A/B test):** "The Hidden Reason Your AI Agent Gets Worse When You Add More Tools"
**Target keyword:** mcp tool context limits, mcp lazy loading, claude context window tools
**Estimated search volume:** 800-3,000/month (combined cluster)
**Target audience:** Developer who has set up an MCP server and noticed degraded agent quality.

**Outline:**
1. Hook: You added 10 MCP tools to your agent. It got worse. Here's why.
2. The math: show token cost of 80 tool descriptions vs. 5.
3. The pattern: lazy toolset loading explained with the warehouse/shelf analogy
   (already in the MCP explainer — extract and expand).
4. The solution: how spike-cli solves it (5 gateway tools, `load <toolset>`).
5. Build your own lazy loader: the 30-line pattern.
6. CTA: `claude mcp add spike-land --transport http https://spike.land/mcp`

**SEO meta description:**
"Adding more MCP tools to your Claude agent can make it worse, not better.
Learn how lazy toolset loading solves the context window problem — and how to
implement it in under 30 lines of TypeScript."

**Social post (Twitter/X):**
"Adding more MCP tools to your Claude agent makes it worse.

Not because the tools are bad. Because tool descriptions eat context before
your agent does any actual work.

80 tools = ~47K tokens of descriptions.
5 tools = ~400 tokens.

Here's how to fix it: [link]"

**Email subject lines:**
1. "Your AI agent is wasting 47,000 tokens before it does anything"
2. "The MCP context trap (and how to escape it)"
3. "Why more tools = worse agent (counterintuitive but measurable)"
4. "We fixed the biggest MCP performance problem — here's the pattern"
5. "47K tokens gone before your agent says hello"

---

### Blog Post 2: The MCP Tool Author Guide

**Title (primary):** "How to Publish Your First MCP Tool to a Registry in Under 30 Minutes"
**Title (A/B test):** "The npm Moment for AI Tools Is Here — Here's How to Publish Yours"
**Target keyword:** publish mcp tool, mcp tool development tutorial, build mcp server
**Estimated search volume:** 2,000-5,000/month

**Outline:**
1. Hook: There are 10,000+ MCP servers. Most exist on one developer's machine.
   Here's how to give yours distribution.
2. The 30-line tool pattern (from MCP explainer — reframe around publishing).
3. What makes a good tool description (narrative responses, Zod schemas).
4. Testing with spike-cli before publishing.
5. Publishing to spike.land's registry (Phase 13 — position as "join the waitlist").
6. Badge embed and attribution.
7. CTA: Join the tool author waitlist.

**SEO meta description:**
"A complete guide to building and publishing MCP tools to a public registry.
Learn the 30-line tool pattern, how to write tool descriptions that improve
agent performance, and how to give your tool distribution beyond your local machine."

**Social post (LinkedIn):**
"There are 10,000+ MCP servers in the wild.

Most of them live on one developer's laptop.

The npm moment for AI tools is coming — and the developers who publish first
will get the distribution.

Here's the complete guide to building and publishing your first MCP tool:
[link]

(Takes under 30 minutes. No prior MCP experience required.)"

**Email subject lines:**
1. "Your MCP tool deserves more than one user (you)"
2. "npm for AI tools is here — here's how to publish"
3. "30 minutes to your first published MCP tool"
4. "The distribution problem for MCP tools (and the solution)"
5. "How to turn your MCP server into a product"

---

### Blog Post 3: Build in Public — The Chess Arena MCP

**Title (primary):** "How We Built a Chess Arena Entirely Out of MCP Tool Calls"
**Title (A/B test):** "6 MCP Tools, One Chess Game: A Case Study in AI-Native App Design"
**Target keyword:** mcp tools example, build with mcp, mcp architecture case study
**Estimated search volume:** 1,000-2,500/month

**Outline:**
1. Hook: Every feature in our chess arena is a function call. No REST routes,
   no websockets, no polling. Here's what that looks like.
2. The 6 tools: chess_new_game, chess_send_challenge, chess_get_board,
   chess_make_move, chess_get_elo, chess_resign.
3. The architecture decision: why "everything is a tool" simplifies the AI integration.
4. The narrative response design: returning "White opened with 1. e4" vs. raw FEN.
5. What full MCP would add: Resources (game PGN, board state) and Prompts
   (analyze_position, post_game_review).
6. Try it: `spike> load chess` + demo.
7. CTA: challenge the AI agent to a game.

**SEO meta description:**
"spike.land's Chess Arena is powered entirely by MCP tool calls.
No REST API, no custom websockets — just 6 tools that an AI agent can call.
This is what AI-native app architecture looks like."

**Social post (Twitter/X):**
"We built an entire chess arena using only MCP tool calls.

No REST routes. No custom websockets.
Just 6 tools: new_game, challenge, get_board, make_move, get_elo, resign.

The entire app is callable by any AI agent in any MCP client.

Here's how the architecture works — and why narrative responses beat raw FEN:
[link]"

**Email subject lines:**
1. "We replaced our REST API with 6 MCP tool calls"
2. "What AI-native architecture actually looks like (chess arena case study)"
3. "6 tools, one chess game — the whole app is a function call"
4. "The chess app where every feature is callable by an AI agent"
5. "No REST, no webhooks — how we built chess with MCP"

---

### Comparison Page: spike.land vs. The MCP Registry Landscape

**URL:** `/compare/mcp-registries`
**Title:** "MCP Registries Compared: spike.land vs. Smithery vs. Glama vs. Official MCP Registry"
**Target keyword:** mcp registry comparison, best mcp tool registry, smithery alternative
**Estimated search volume:** 500-2,000/month (early-stage, growing fast)

**Page structure:**
1. Header: "Which MCP Registry is right for your project?"
2. Feature comparison table:

| Feature | spike.land | Smithery | Glama | Official MCP Registry |
|---|---|---|---|---|
| Tool count | 80+ | ~500 (3rd party) | ~200 | 1,800+ (metadata only) |
| First-party tools | Yes | No | No | No |
| Multiplexer CLI | Yes (spike-cli) | No | No | No |
| Lazy toolset loading | Yes | No | No | No |
| Free tier | Yes | Yes | Yes | N/A |
| Tool marketplace | Q2 2026 | No | No | No |
| Live tool demos | Yes | No | No | No |
| 70/30 revenue share | Q2 2026 | No | No | No |

3. When to use each (honest, not just self-promotional).
4. "If you want first-party quality tools + a multiplexer CLI, spike.land."
5. CTA: try the free tier.

---

### How-To Tutorial: Rankable on Google

**Title:** "How to Add Any MCP Tool to Claude Code in 30 Seconds"
**URL:** `/docs/quickstart` or `/guides/add-mcp-to-claude-code`
**Target keyword:** how to add mcp tool to claude, claude code mcp setup, claude mcp configuration
**Estimated search volume:** 3,000-8,000/month

This is the highest-priority single page to publish. The query "how to add MCP to Claude Code" is being searched by every developer who just set up Claude Code for the first time and wants to extend it.

**Page structure:**
1. One-line install (the existing command)
2. What you get (tool count, categories, free tier)
3. Verify it works (2-command verification)
4. Load your first toolset (`load chess`, `call spike-land__chess_new_game`)
5. Explore all tools (`tools` command)
6. Next: link to the MCP explainer post and tool catalog

**This page should be:**
- Under 500 words
- Have 3 code blocks max
- Load in under 1 second
- Have zero friction to the CTA

---

## 6. Content Distribution Plan

### Week 1 (Publish + Seed)

| Day | Action |
|---|---|
| Mon | Publish Blog Post 1 (context window / lazy loading) |
| Mon | Post Twitter thread (5-tweet version of the post) |
| Tue | Post LinkedIn version (longer-form, professional tone) |
| Tue | Submit to relevant subreddits: r/ClaudeAI, r/LocalLLaMA, r/MachineLearning |
| Wed | Post in Anthropic Discord #mcp-servers channel |
| Thu | Email newsletter to existing list (3 subject line variants, A/B test) |
| Fri | Engage with all comments, replies, and discussion threads |

### Week 2

| Day | Action |
|---|---|
| Mon | Publish Blog Post 2 (publish your first MCP tool) |
| Mon | Reach out to 5 developers who recently published MCP servers — share the post |
| Tue | Submit to HackerNews (use the HN MCP tool to time the submission) |
| Wed | Publish the Quickstart tutorial (/guides/add-mcp-to-claude-code) |
| Thu | Start comparison page (spike.land vs. landscape) |
| Fri | Twitter thread: "5 MCP tools from spike.land that will save your agent hours" |

### Week 3

| Day | Action |
|---|---|
| Mon | Publish Blog Post 3 (chess arena architecture) |
| Mon | Post the chess demo on Twitter — "challenge our AI agent" viral hook |
| Wed | Publish comparison page |
| Thu | Submit chess post to HackerNews |
| Fri | Publish weekly tool spotlight (use internal analytics — pull top tool from tool_call_daily) |

### Ongoing Weekly Cadence

- **Monday**: One blog post or substantial guide
- **Tuesday/Thursday**: 2x Twitter/X posts (one technical, one demo/visual)
- **Wednesday**: LinkedIn post (longer form, professional angle)
- **Friday**: Discord/community engagement, weekly tool usage stats post

---

## 7. Quick Wins (This Week, No Writing Required)

These are distribution actions that require zero new content:

1. **List spike-cli on npm** if not already done — the npm search result is
   free distribution to every developer who searches "mcp cli" or "mcp multiplexer".

2. **List on Smithery, Glama, LobeHub** — the ROADMAP.md already identifies this.
   These directories have existing traffic. Do this today.

3. **Submit to awesome-mcp** GitHub list — these curated lists drive GitHub
   traffic and backlinks.

4. **Add `claude mcp add spike-land` to the GitHub README** of every repo in
   the monorepo. The spike-cli repo especially. Every GitHub visitor sees it.

5. **Enable GitHub Discussions** on the spike-cli repo — creates a community
   forum that Google indexes and that developers find via search.

6. **Wire the cockpit dashboard** (from GROWTH_METRICS.md priority list) —
   real metrics enable the "build in public" content strategy. Without data,
   there's nothing to share. This is a prerequisite for the transparency content.

---

## 8. 90-Day SEO Projection

| Month | Actions | Expected Outcome |
|---|---|---|
| March 2026 | 3 blog posts, quickstart page, Smithery/Glama listings | 50-200 organic sessions/week |
| April 2026 | Tool landing pages (80 pages templated), comparison page, HN Show HN | 500-1,500 organic sessions/week |
| May 2026 | Marketplace launch content, tool author guides, contributor tutorials | 2,000-5,000 organic sessions/week |

These estimates assume consistent publication cadence and that tool landing pages
are indexed within 4-6 weeks of publishing. The spike.land domain needs to be
in good standing with Google Search Console (verify if not already done).

---

## 9. Content Calendar (March 2026)

| Week | Post | Distribution Priority |
|---|---|---|
| Mar 10-14 | "Why Your Claude Agent Is Wasting 70% of Its Context Window" | Twitter, HN, r/ClaudeAI |
| Mar 17-21 | "How to Publish Your First MCP Tool in 30 Minutes" | Twitter, LinkedIn, Anthropic Discord |
| Mar 24-28 | "How We Built a Chess Arena Entirely Out of MCP Tool Calls" | Twitter, HN, chess/AI communities |
| Mar 31 | Quickstart guide + comparison page | SEO priority, no social push needed |

**Target for April:** Begin tool landing page rollout (5 per week = 20 by end of April).
**Target for May:** Marketplace launch blog post + "first 10 community tools" showcase.
