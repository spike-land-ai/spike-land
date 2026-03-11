# Pitch Deck Outline for Accelerator Applications

> **Last Updated**: March 2026
> **Version**: 2.0
> **Purpose**: Structure for Seedcamp, Techstars, and equity-based accelerator applications
> **Stage**: Pre-revenue (product and flagship app live)

---

## Deck Overview

| Field        | Value                                      |
| ------------ | ------------------------------------------ |
| **Format**   | 10-12 slides, PDF                          |
| **Length**   | 3-5 minutes presentation                   |
| **Audience** | Accelerator partners, pre-seed investors   |
| **Tone**     | Confident, technical founder, clear vision |

---

## Slide Structure

### Slide 1: Title

**Content**:

- Company: SPIKE LAND LTD
- Product: Spike Land - The Open App Store for the Agent Internet
- Tagline: "The npm for AI tools. The USB-C for AI integrations."
- Founder: Zoltan Erdos, Brighton, UK
- Contact: [email]

**Design**: Clean, logo, one-liner tagline prominent

---

### Slide 2: Problem

**Headline**: Two massive problems. One platform to solve both.

**Developer Problem**:

- Fragmented AI tooling — developers juggle 8+ SaaS tools daily with no managed MCP registry
- Context window waste from stitching together incompatible APIs and services
- AI agents have no standard place to discover and call tools at runtime

**Human Problem**:

- Approximately 4 billion people miss services they are fully eligible for
- $2.1 trillion per year in unclaimed benefits worldwide
- The barrier is not the absence of programmes — it is system complexity, bureaucratic fragmentation, and language barriers

**Visual**: Split screen — developer chaos on the left, bureaucratic maze on the right

---

### Slide 3: Solution

**Headline**: One platform. Two transformative products.

**Open Platform — The App Store for the Agent Internet**:

- Publish MCP tools and apps, discoverable by both humans and AI agents
- Managed hosting on Cloudflare Workers with 70/30 revenue share for developers
- 80+ native MCP tools live from day one via spike-cli and the web dashboard
- Agent-callable at runtime — not a static directory, a live runtime

**COMPASS — Universal Bureaucracy Navigator (Flagship App)**:

- Built on the platform to prove agent-first design at real-world scale
- 12 MCP-native engines covering eligibility, documents, translation, and appeals
- Offline-capable, 50 languages, free for end users
- Live in 4 countries (Germany, India, USA, Kenya)

**Key point**: COMPASS is not a side project. It is proof that the platform solves the hardest possible use case — navigating fragmented government systems across languages and borders.

---

### Slide 4: Demo / Product

**Headline**: Live Product Demo

**Show**:

- spike-cli REPL session: invoke tools, chain MCP calls, interact with the app store
- Web dashboard: app store browse, install flow, managed deployment
- COMPASS eligibility discovery flow: user describes situation, agent maps eligible services, documents returned in native language

**Note**: For video applications, record a 60-90 second product walkthrough. Open with the COMPASS demo (most visual, highest impact), then show spike-cli to demonstrate platform depth.

---

### Slide 5: Market Size

**Headline**: Two massive markets. One compounding platform play.

| Market | TAM | SAM | SOM |
|---|---|---|---|
| Dev Tools + Cloud Infrastructure | $100B+ | $25B | $1B |
| GovTech (unclaimed benefits navigation) | $2.1T/yr | $500B | $50B |

**Growth**: 25-30% CAGR for AI developer tools through 2030

**Insight**: The platform TAM and the COMPASS TAM are additive. Every government partnership validates the platform; every platform customer expands the distribution surface for COMPASS.

---

### Slide 6: Business Model

**Headline**: Two revenue engines on one infrastructure base.

**Engine 1 — Platform SaaS**:

| Tier     | Price  | Target                         |
| -------- | ------ | ------------------------------ |
| FREE     | $0/mo  | Lead generation, open source developers |
| PRO      | $29/mo | Solo developers, indie hackers |
| BUSINESS | $99/mo | Small teams, agencies          |

Plus: MCP API usage fees and 30% marketplace take on third-party tool revenue

**Engine 2 — COMPASS**:

- Government partnership contracts (per-country licensing)
- International organisation licensing (UN agencies, NGOs)
- Intelligence reports for policy teams
- Free for end users — monetised B2G, not B2C

**Year 1 Revenue Targets**:

- Platform: £42,832 ARR (228 paying customers)
- COMPASS: $8M (first two government contracts)

---

### Slide 7: Traction

**Headline**: The Hard Parts Are Done

**What's Built**:

- [x] Full platform live at spike.land
- [x] 80+ native MCP tools implemented and tested
- [x] spike-cli published on npm
- [x] Stripe payments integrated
- [x] COMPASS: 12 engines, 28,042 lines of code, live in 4 countries (DE / IN / US / KE)
- [x] UK Ltd incorporated (Dec 2025, Company #16906682)

**Current Status**:

- Friends and family testing phase for platform
- COMPASS in structured pilot with initial country partners
- Production infrastructure on Cloudflare Workers, 99.9% uptime architecture

**Gap**: Go-to-market execution and partnership development

---

### Slide 8: Why Now?

**Headline**: The MCP Protocol Has Changed Everything

**Market Timing**:

1. **MCP becoming universal standard** — Anthropic, GitHub Copilot, and the broader ecosystem are converging on Model Context Protocol as the interoperability layer for AI
2. **No platform combines agent-first + live runtime + open marketplace** — this combination does not exist anywhere else
3. **GovTech AI moment** — governments are actively procuring AI-native solutions for service delivery for the first time
4. **Solo founder + AI development = unprecedented capital efficiency** — the entire platform and COMPASS were built by one person; this is a structural cost advantage, not a temporary workaround

---

### Slide 9: Team

**Headline**: Solo Founder + AI Development Stack

**Zoltan Erdos** — Founder & CEO

- Full-stack engineer with 10+ years experience
- Built the platform and COMPASS solo using AI-assisted development
- Location: Brighton, UK

**Why Solo Founder Works**:

- AI-assisted development = 5-10x productivity
- Shipped production platform and 28,000-line flagship app without a team
- Lean operations, highly efficient capital use
- Will hire strategically with funding

**Hiring Plan**:

- First hire: Growth / partnerships lead
- Second hire: Customer success
- Engineering: Continue AI-assisted approach, augment with specialists

---

### Slide 10: Competitive Landscape

**Headline**: The Only Platform in the Agent-First + Live Runtime Quadrant

```
                        AGENT-FIRST
                             |
         Claude Code         |        SPIKE.LAND
         (agent workflow,    |        (agent-callable store,
          no distribution)   |         managed runtime)
                             |
DIRECTORY ——————————————————————————————————————— LIVE RUNTIME
                             |
         GitHub MCP          |        Vercel / Replit / Lovable
         Registry            |        (live deployment,
         (static listing)    |         human-only UX)
                             |
                      HUMAN-FIRST
```

**Key insight**: Every existing competitor occupies one quadrant. Spike Land is the only platform in the Agent-first + Live Runtime quadrant — the quadrant that the next generation of AI applications requires.

**What no competitor has**:

- An open marketplace where third-party MCP tools are callable by agents at runtime
- A flagship application (COMPASS) that validates the platform against the hardest real-world use case
- 70/30 developer revenue share on a live, hosted MCP runtime

---

### Slide 11: Ask / Milestones

**Headline**: SEIS Raise — £250,000

**Use of Funds**:

| Category       | Allocation | Purpose                                |
| -------------- | ---------- | -------------------------------------- |
| Go-to-market   | 50%        | Paid acquisition, content, partnerships |
| Hiring         | 30%        | Growth lead, customer success          |
| Infrastructure | 20%        | AI costs, scaling, COMPASS expansion   |

**Milestones**:

| Milestone | Timeline | Target |
|---|---|---|
| Commercial launch | Month 3 | Stripe live, paid plans active |
| First 100 customers | Month 6 | Platform PMF validated |
| Marketplace launched | Month 9 | 70/30 revenue share active |
| 228 paying customers | Month 12 | £42,832 ARR |
| COMPASS Tier 1 pilot | Month 12 | 2 countries live with signed contracts |

---

### Slide 12: Contact / Close

**Headline**: The Hard Part Is Done

**Key Message**:

> "The hard part is done. The platform works. COMPASS proves it at scale — 12 engines, 4 countries, 28,000 lines of production code, built by one person. We need go-to-market support to find our first 1,000 customers and close our first two government contracts."

**Contact**:

- Email: [founder email]
- Website: spike.land
- Demo: Available on request
- Company: SPIKE LAND LTD (UK #16906682)

---

## Video Script (2 Minutes)

For accelerators requiring video applications:

### Section 1: Hook (15 seconds)

"I'm Zoltan, founder of Spike Land. I built an open app store for AI agents — with 80+ native MCP tools and a flagship product that helps 4 billion people access services they're eligible for but can't reach. The product is live. I'm looking for accelerator support to find our first 1,000 customers."

### Section 2: Problem (20 seconds)

"Two problems that look different but share the same root cause: fragmentation. Developers waste hours stitching together 8+ SaaS tools with no managed MCP registry. And 4 billion people miss $2.1 trillion in annual benefits because navigating government systems is too complex. In both cases, the tools or programmes exist — but there is no agent-first platform to connect people to them."

### Section 3: Solution (30 seconds)

"Spike Land is the open app store for the agent internet. [Show platform] Developers publish MCP tools. AI agents discover and call them at runtime. 70/30 revenue share. Managed hosting. And to prove the platform works at scale, we built COMPASS — a universal bureaucracy navigator running 12 MCP engines across 4 countries in 50 languages. [Show COMPASS flow] Any AI agent can use our tools. No other platform offers this combination: agent-callable, live runtime, open marketplace."

### Section 4: Why Me (20 seconds)

"I built the entire platform and COMPASS solo using AI-assisted development. 28,000 lines of production code. This is not a prototype — it is a proof point. Solo founder plus AI development is a structural capital efficiency advantage, and it is why this company can move faster than any team-based competitor in this space."

### Section 5: Ask (15 seconds)

"I am raising £250,000 SEIS to hire a growth lead, launch go-to-market, and close our first two COMPASS government contracts. The product is ready. The flagship app is live. I need the right partner to reach our first 1,000 customers."

### Section 6: Close (10 seconds)

"Visit spike.land to see the live product, or run `npm install -g @spike-land-ai/spike-cli` to try it from your terminal. I would love to connect and discuss how [Accelerator Name] can help Spike Land grow. Thank you."

---

## Appendix Slides (If Requested)

### A1: Product Architecture

- Tech stack diagram (Cloudflare Workers, Hono, D1, MCP SDK)
- Monorepo structure (25 packages under src/)
- Infrastructure overview

### A2: COMPASS Deep Dive

- 12 engine breakdown
- Country coverage and expansion roadmap
- Government partnership model and contract structure

### A3: Financial Projections

- 3-year revenue model (platform + COMPASS)
- Customer acquisition assumptions
- Unit economics and gross margin

### A4: Go-to-Market Strategy

- Developer community and open-source flywheel
- Content and SEO strategy
- Government and NGO partnership pipeline

---

## Tips for Applications

### Do:

- Be honest about pre-revenue status
- Emphasise COMPASS as proof of platform capability, not as a separate product
- Show the live product — spike.land and COMPASS are both running
- Explain why AI-assisted development is a structural advantage, not a temporary hack
- Be specific about the SEIS raise and milestones

### Don't:

- Inflate metrics or user counts
- Claim product-market fit before having it
- Say "Vercel for..." — Spike Land is categorically different
- Reference "533+" or "multi-channel" as differentiators
- Apologise for being a solo founder

### For Video Applications:

- Open with COMPASS (most visual, most emotionally resonant)
- Then show spike-cli to demonstrate platform depth
- Keep it under 2 minutes
- Record in good lighting with quality audio
- Demo the actual live product, not mockups

---

## Related Documents

| Document                                           | Description          |
| -------------------------------------------------- | -------------------- |
| [ACCELERATOR_ROADMAP.md](./ACCELERATOR_ROADMAP.md) | Application strategy |
| [APPLICATION_TRACKER.md](./APPLICATION_TRACKER.md) | Track submissions    |
| [FEATURES.md](./FEATURES.md)                       | Product details      |
| [INVESTEC_PITCH.md](./INVESTEC_PITCH.md)           | Investec growth projections |

---

**Document Version**: 2.0 | **Last Updated**: March 2026
