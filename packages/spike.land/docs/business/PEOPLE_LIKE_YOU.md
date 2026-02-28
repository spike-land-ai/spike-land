# People Like You: A Curated Reading List & 2-Week Focus Plan

## Context

Zoltan Erdos is a solo UK founder (SPIKE LAND LTD, Dec 2025) building a managed
deployment platform with MCP registry (Spike Land) featuring 455+ MCP tools, 18
apps, real-time code editor on Cloudflare Workers/Durable Objects, and an app
marketplace. Pre-revenue, pre-launch, bootstrapped. His self-identified
struggles: **too many features / no PMF** and **distribution / getting
noticed**. His instinct for the next 2 weeks: another technical milestone.

---

## Part 1: The People You Must Read About

### Tier 1 — Your Mirror (Read These First)

These people ARE you at different stages. Their stories will hurt because
they're familiar.

#### 1. Maor Shlomo — Base44 (Solo founder, AI app builder, ADHD, $80M exit)

- **Why he's you:** Solo founder with ADHD who built an AI-powered app creation
  platform. Bootstrapped. No employees. Built during personal crisis (two wars
  in Israel during reserve duty).
- **What he did differently:** He built ONE thing (AI app builder), launched it,
  hit $1M ARR in 3 weeks, and sold to Wix for $80M in cash within months.
- **His secret:** He didn't build 18 apps. He built one. And he talked to users
  obsessively.
- **Read:**
  [Lenny's Newsletter — The Base44 Story](https://www.lennysnewsletter.com/p/the-base44-bootstrapped-startup-success-story-maor-shlomo)
- **Read:**
  [SmithDigital — How Solo Founder Sold for $80M](https://smithdigital.io/blog/solo-founder-base44-sells-ai-startup-80m)

#### 2. Nevo David — Postiz (Solo dev, open-source social media management, $20K MRR)

- **Why he's you:** He built an open-source alternative to Buffer/Hootsuite as a
  single developer. Your platform's social features compete in the same space.
- **What he did differently:** Open-sourced it from day one. 26K GitHub stars
  drove organic growth. Focused on channels competitors ignored (30+ vs their
  11).
- **His struggle:** Getting initial traction as a solo dev competing against
  funded teams.
- **Read:**
  [Indie Hackers — $14.2K/month as a single developer](https://www.indiehackers.com/post/i-did-it-my-open-source-company-now-makes-14-2k-monthly-as-a-single-developer-f2fec088a4)
- **Repo:**
  [github.com/gitroomhq/postiz-app](https://github.com/gitroomhq/postiz-app)

#### 3. Tony Dinh — TypingMind (Solo dev, AI-native platform, $83K/month)

- **Why he's you:** Solo developer who built an AI-native platform. Combines
  multiple AI providers into one interface. Was a corporate developer earning
  $105K before going indie.
- **The lesson:** He shipped the MVP in 48 hours after the ChatGPT API launched.
  Speed, not features, was his moat. His earlier product (BlackMagic — social
  media analytics) died when Twitter tripled API fees.
- **His philosophy:** "BYOK" (bring your own key) — makes TypingMind a
  productivity layer, not a token reseller.
- **Read:**
  [IndiePattern — From Weekend Hack to $500K](https://indiepattern.com/stories/tony-dinh-typingmind/)
- **Read:**
  [The Bootstrapped Founder — Tony Dinh's Ups and Downs](https://thebootstrappedfounder.com/tony-dinh-ups-and-downs-of-an-indie-hacker-journey/)

#### 4. Sabba Keynejad — VEED.IO (UK, bootstrapped video platform, now $40M ARR)

- **Why he's you:** UK-based, bootstrapped a complex real-time platform, burned
  through personal savings, went back to contracting in London when money ran
  out.
- **His struggle (his words):** "We tried to fundraise, we couldn't and were
  both broke. Mental health took a pretty big hit, I put on weight and it was
  affecting my social life."
- **Timeline reality:** Years of contracting income before Sequoia invested
  $35M.
- **Read:**
  [Indie Bites — How VEED Bootstrapped to $7M ARR](https://indiebites.com/106)
- **Read:**
  [TechRound — Meet Sabba Keynejad](https://techround.co.uk/interviews/meet-sabba-keynejad-co-founder-ceo-video-editing-platform-veed/)

---

### Tier 2 — Your Technical Peers (Read for Architecture Validation)

These people work with the same tech stack. Validate your choices.

#### 5. Sunil Pai — PartyKit (Real-time on Durable Objects -> acquired by Cloudflare)

- **Why he matters:** Built the closest thing to your Cloudflare Workers +
  Durable Objects + WebSocket architecture. Former React core team. Left
  Cloudflare to build PartyKit, then Cloudflare acquired it.
- **Key quote:** "PartyKit's platform is so dependent on [Durable Objects] tech
  that no one else has."
- **His vision:** Multiplayer experiences extending beyond humans to AI agents —
  exactly your MCP direction.
- **Read:**
  [Cloudflare acquires PartyKit](https://blog.cloudflare.com/cloudflare-acquires-partykit/)
- **Listen:**
  [Multiplayer web with Sunil Pai](https://svagat.substack.com/p/multiplayer-web-death-of-devtools)
- **Listen:** [JS Party #296](https://changelog.com/jsparty/296)

#### 6. Boris Tane — Baselime (Observability on Workers -> acquired by Cloudflare)

- **Why he matters:** Built a full production app on Workers, now leads
  Cloudflare's observability team. Documented the "one database per user"
  Durable Objects pattern.
- **Key technical posts:**
  - [One Database Per User with DOs + Drizzle ORM](https://boristane.com/blog/durable-objects-database-per-user/)
  - [What even are Durable Objects?](https://boristane.com/blog/what-are-cloudflare-durable-objects/)

#### 7. Liveblocks team — Real-time collaboration at scale on Durable Objects

- **Why they matter:** Process half a billion WebSocket messages/day with 10
  engineers. Migrated from AWS EC2 to Durable Objects. Each room = one DO
  instance (same pattern as your codespaces).
- **Read:**
  [Liveblocks Cloudflare Case Study](https://www.cloudflare.com/case-studies/liveblocks/)

#### 8. Luigi Pederzani & Pietro Zullo — Manufact/mcp-use (MCP SDK, YC S25, $6.3M seed)

- **Why they matter:** They're building the MCP tooling layer you're using. 5
  million downloads. YC S25. Just raised $6.3M in Feb 2026.
- **Pietro's quote:** "As software becomes more agentic, the hard part isn't the
  model anymore, it's everything around it."
- **Read:**
  [SiliconANGLE — Manufact raises $6.3M](https://siliconangle.com/2026/02/12/manufact-raises-6-3m-help-developers-connect-ai-agents-model-context-protocol/)

---

### Tier 3 — Your Strategic Models (Read for Business Patterns)

#### 9. Pieter Levels — NomadList, PhotoAI ($3M+/year, zero employees)

- **The lesson:** He launched 70+ projects before finding winners. Uses
  PHP/jQuery deliberately. Building in public for 10+ years is his moat.
- **Timeline:** 6 years from first product to $1M ARR. 10 years to $3M ARR.
- **Read:**
  [Fast SaaS — Pieter Levels Success Story](https://www.fast-saas.com/blog/pieter-levels-success-story/)
- **Read:**
  [Photo AI Deep Dive — $0 to $132K MRR](https://www.indiehackers.com/post/photo-ai-by-pieter-levels-complete-deep-dive-case-study-0-to-132k-mrr-in-18-months-3a9a2b1579)

#### 10. Uku Taht & Marko Saric — Plausible Analytics (EU, bootstrapped, $1M ARR)

- **The lesson:** 324 days to reach $400 MRR. Uku called doing both dev +
  marketing "an impossible task." Never paid for a single ad.
- **Read:**
  [Plausible — Bootstrapping SaaS](https://plausible.io/blog/bootstrapping-saas)

#### 11. Marc Lou — ShipFast ($141K MRR, 21+ products)

- **The lesson:** His 28th product was the winner. "Start with anything. Skim
  features to bare minimum."
- **Read:**
  [IndiePattern — Marc Lou: Ship Fast, Sell Faster](https://indiepattern.com/stories/marc-lou/)

#### 12. Eric Zhang — Rustpad (Solo-built collaborative code editor, 6M+ downloads)

- **Why he matters:** Built a real-time collaborative code editor solo. Uses
  operational transformation + Monaco editor.
- **Projects:** [ekzhang.com/projects](https://www.ekzhang.com/projects)
- **Repo:** [github.com/ekzhang/rustpad](https://github.com/ekzhang/rustpad)

---

### Tier 4 — MCP Ecosystem (Know These Names)

#### 13. David Soria Parra & Justin Spahr-Summers — Created MCP at Anthropic

- **Listen:**
  [Latent Space Podcast — The Creators of MCP](https://www.latent.space/p/mcp)
- **Listen:**
  [a16z Podcast — MCP Co-Creator on the Next Wave](https://a16z.com/podcast/mcp-co-creator-on-the-next-wave-of-llm-innovation/)

#### 14. Frank Fiegel (punkpeye) — Glama.ai (MCP server marketplace)

- Launched MCP directory days after Anthropic's announcement. Became the de
  facto curator.
- **Site:** [glama.ai/mcp](https://glama.ai/mcp)

#### 15. Boris Cherny — Created Claude Code

- IC8 at Meta/Instagram -> Anthropic founding engineer. Built Claude Code as a
  prototype using Claude 3.6. Now 115K developers, 195M lines of code/week.
- **Read:**
  [Developing.dev — Boris Cherny Career Story](https://www.developing.dev/p/boris-cherny-creator-of-claude-code)

#### 16. Andrew Berman — Runlayer (MCP security, $11M, 8 unicorn customers in 4 months)

- **Read:**
  [TechCrunch — Runlayer launches with $11M](https://techcrunch.com/2025/11/17/mcp-ai-agent-security-startup-runlayer-launches-with-8-unicorns-11m-from-khoslas-keith-rabois-and-felicis/)

---

### Tier 5 — UK Community (Join These)

#### 17. IndieBeers London — Monthly pub meetup, 900+ members, Shoreditch

- [Meetup](https://www.meetup.com/indie-london/)
- Past speakers include VEED and Ticket Tailor founders

#### 18. Jonny White — Ticket Tailor (UK, bootstrapped to GBP6M ARR)

- Sold his ticketing platform, watched it stagnate, bought it back, rebuilt it.
- [Secret Leaders Podcast](https://www.secretleaders.com/episodes/jonnywhite)

#### 19. James Devonport — Create With (UK AI builder conference)

- Runs the UK's largest AI builder conference and podcast. Focus: solo founders
  using AI agents.
- [NoCode SaaS — Rise of the Solo Founder](https://www.nocodesaas.io/p/the-rise-of-the-solo-founder)

---

## Part 2: The Hard Truth From All 30+ Stories

### Pattern 1: "Coding is easy, marketing is hard"

This is the single most repeated phrase across all successful founders. Uku
(Plausible) called doing both "an impossible task." You have 455+ MCP tools and
18 apps but zero paying users.

### Pattern 2: The winners built ONE thing

- Base44: one AI app builder -> $80M exit
- TypingMind: one AI chat interface -> $83K/month
- Postiz: one social media scheduler -> $20K MRR
- Carrd: one page builder -> $1M+ ARR
- BuiltWith: one technology profiler -> $14M ARR with zero employees

You have: chess + audio mixer + career navigator + CleanSweep + tabletop
simulator + code editor + managed deployments + app store + QA studio + image
generation + page builder + state machine engine...

### Pattern 3: 3-6 year timelines are normal

- Plausible: 324 days to $400 MRR
- Pieter Levels: 6 years to $1M ARR
- VEED: years of contracting before Sequoia invested
- Ticket Tailor: sold, stagnated, bought back, then grew

### Pattern 4: Building in public is a distribution strategy

- Pieter Levels: 600K followers built over 10 years of daily transparency
- Marc Lou: 17 launches in 2 years, each a marketing event
- Nevo David: 26K GitHub stars via open-source community engagement

### Pattern 5: The loneliness tax is real

- 76% of founders feel lonely (7x workplace average)
- 53% experienced burnout in 2024
- VEED founder: "Mental health took a pretty big hit"
- IndieBeers London exists specifically because Charlie Ward experienced this

---

## Part 3: The 2-Week Recommendation

You said you want a **technical milestone** in the next 2 weeks. Every person on
this list would tell you: **that's the wrong goal**. You've been doing technical
milestones for months. You have 455+ MCP tools, 19 apps, ~557 routes, and zero
revenue.

But I respect your answer. Here's a compromise:

### Week 1: Pick ONE App, Kill the Rest (Temporarily)

**The exercise:** If you could only keep ONE of your 18 apps, which would it be?
The answer reveals your actual product.

Based on market signals from this research:

- **Managed deployment with MCP registry** has the clearest monetization path
  ($29-99/mo) and a proven competitor landscape (Vercel, Railway, Replit)
- **Your MCP-native angle** ("infrastructure for AI agents, not dashboards for
  humans") is genuinely differentiated — nobody else has this
- **spike-cli as open-source multiplexer** can drive developer adoption the way
  Postiz used open-source for growth

### Week 2: Make That ONE Thing Work End-to-End for ONE User

**Technical milestone that matters:** Get one complete deployment workflow
working through MCP tools that a Claude Desktop user can actually use:

1. Create a new app via spike-cli
2. Deploy it via MCP tool
3. See deployment status and logs via MCP tool
4. Iterate with AI assistance via MCP tool

Then record a 2-minute demo and post it.

### What To Read This Week (Priority Order)

1. **Tonight:**
   [Base44 story on Lenny's](https://www.lennysnewsletter.com/p/the-base44-bootstrapped-startup-success-story-maor-shlomo)
   — 30 min
2. **Tomorrow:**
   [Postiz on Indie Hackers](https://www.indiehackers.com/post/i-did-it-my-open-source-company-now-makes-14-2k-monthly-as-a-single-developer-f2fec088a4)
   — your direct competitor, 15 min
3. **This weekend:**
   [Tony Dinh's full journey](https://indiepattern.com/stories/tony-dinh-typingmind/)
   — 20 min
4. **Next week:**
   [Sunil Pai on multiplayer web](https://svagat.substack.com/p/multiplayer-web-death-of-devtools)
   — validates your Cloudflare architecture, 25 min
5. **Next week:** [Latent Space — MCP Creators](https://www.latent.space/p/mcp)
   — understand where MCP is going, 45 min podcast

### Community Action

- **Join IndieBeers London**
  ([meetup.com/indie-london](https://www.meetup.com/indie-london/)) — go to the
  next meetup
- **Follow on X/Twitter:** @levelsio, @tabordasr (Nevo David), @tdinh_me,
  @punkpeye, @marcloudev

---

## Summary

You're not alone. 30+ people are doing pieces of what you're doing. Nobody is
doing ALL of it — which is either your superpower or your trap. The data
overwhelmingly says: **pick one thing, ship it, talk to users, build in
public.** The technical foundation is already more than ready.
