# Spike Land Roadmap

> **Last updated**: 17 March 2026
> **Current phase**: Product stabilization + personal brand alignment
> **Company**: SPIKE LAND LTD

---

## 1. Roadmap Thesis

The product is broader than planned. That turned out to be the point.

What started as a QA wedge for agencies evolved into something more honest: an
AI platform where personas teach, learn, and build — powered by MCP tools, PRDs,
and a shared token pool. The personas are not gimmicks. They are the product.

The job for the next 90 days is:

1. **Make the product work.** Peti tested it. It's broken. Fix it.
2. **Make the founder credible.** Clean up online presence. Sound like a real
   person, not a startup pitch deck.
3. **Let the content compound.** 18 blog posts, 9 personas, a learning platform.
   The content is good. Distribution is the bottleneck.

---

## 2. What Is Already Built

### Infrastructure (stable)
- Hosted MCP runtime and registry (80+ tools)
- `spike-cli` with multiplexer, lazy toolset loading
- `spike-chat` with aether memory, persona routing, streaming
- OpenAI-compatible API endpoint
- Astro frontend on Cloudflare Workers
- Stripe checkout plumbing
- CI/CD with parallel builds, real rollback

### Personas (shipped, need testing)
- **Zoltán** — founder persona, ADHD, math, dogs
- **Arnold** — UX provocateur
- **Peti** — QA engineer
- **Erdős** — mathematics, collaboration, The Book
- **Einstein** — physics, thought experiments, Arena-upskilled
- **Daft Punk** — music production, synthesis
- **GP** — chemist from Brighton, non-dev builder
- **Raju** — backend architect, infrastructure sage
- **Switchboard** — UK consumer advocacy

### Content (published)
- 18+ blog posts in PRD format with personaPrompts
- Dogs essay, Einstein Arena post, QA Arena, THE_BOOK
- Twitter hooks PRD with 80+ ready-to-post tweets
- Full content growth strategy

### New (committed, not deployed)
- Token Bank — AES-256-GCM encryption, provider detection, proxy-only
- Learn pages — /learn topic explorer, /learn/[slug] PRD runner
- QA health check API + /qa page

---

## 3. What Is Broken

Per Peti's testing (March 2026, multiple browsers, multiple weeks):

- Code editor: broken
- App filter: broken
- Demo buttons: broken
- Terminal: broken
- Interactive features: none of them work

**This is the #1 priority.** Nothing else matters if the product doesn't load.

---

## 4. Next 90 Days

### Phase 1: Fix the product (Weeks 1-3)

Ship a working product. Not a feature-complete product — a working one.

Goals:
- Every persona chat page loads and streams responses
- QA health check works on production URLs
- /learn pages render and link to blog content
- Code editor, demo buttons, and terminal either work or are removed
- Mobile-responsive, < 3s load time

Outputs:
- Peti re-tests and confirms basic flows work
- Zero broken interactive elements on shipped pages

### Phase 2: Clean up the founder (Weeks 2-4)

Zoltán needs to look like who he actually is: a Hungarian mathematician who
builds things, lives with two dogs, and thinks differently. Not a startup bro.

Goals:
- Rewrite LinkedIn bio (human, not corporate)
- Clean up Twitter/X presence (remove AI-slop tweets if any)
- GitHub profile reflects actual work, not aspirational marketing
- Blog posts are the portfolio — make sure they're discoverable
- Remove or archive marketing docs that don't match the voice

Outputs:
- One-paragraph bio that works everywhere (LinkedIn, Twitter, GitHub, HN)
- 5 initial tweets from the hooks PRD, posted in Zoltán's real voice
- advisor-outreach.md rewritten in human language

### Phase 3: Let content work (Weeks 4-8)

Don't create more content. Distribute what exists.

Goals:
- Post the 5 highest-impact blog posts to HN, Reddit, Twitter
- Persona pages indexed by Google
- /learn pages live and linked from blog posts
- Hero images generated for all blog posts with personaPrompts

Outputs:
- Organic traffic from content (target: 100 sessions/week)
- At least 1 HN front-page attempt
- All blog hero images generated

### Phase 4: Revenue path (Weeks 8-12)

Based on what gets traction, pick ONE:

**Option A: Consulting** (fastest to revenue)
- "I'll build your MCP tools / fix your AI pipeline"
- Hourly rate, Brighton-local + remote
- The platform is the portfolio

**Option B: Hosted personas** (scalable)
- White-label persona chat for businesses (training, onboarding, support)
- Monthly subscription per persona
- Token pool subsidizes early users

**Option C: Learning platform** (ambitious)
- /learn as free Duolingo/Brilliant for AI/math/physics
- Freemium: free personas, premium content/tokens
- Community token donations sustain it

Decision criteria: which one gets the first paying user fastest?

---

## 5. Twelve-Month View

### Q2 2026 (now)
- Fix broken product
- Clean up personal brand
- Distribute existing content
- First revenue (consulting or hosted personas)

### Q3 2026
- Double down on whatever revenue path works
- Learning platform public beta if /learn gets traction
- First 10 paying users (any path)
- Hire decision: do we need help, or does the solo model work?

### Q4 2026
- If consulting: systematize into productized service
- If personas: white-label offering with Stripe billing
- If learning: curriculum expansion, community contributors
- Brighton privacy play: local-first AI models (GDPR differentiator)

### Q1-Q2 2027
- 50+ paying users/clients
- The platform runs without Zoltán being awake
- Decide: raise money or stay profitable and small?

---

## 6. Metrics That Matter

### Product health (Peti is the judge)
- Pages that load without errors
- Persona chat response time
- /learn page completion rate
- Zero broken interactive elements

### Content traction
- Blog post views per week
- HN/Reddit/Twitter engagement
- Organic search sessions
- Persona chat sessions (people actually talking to personas)

### Revenue
- First paying user (date)
- Monthly revenue
- Revenue per channel (consulting / hosted / learning)

### Personal brand
- LinkedIn profile views
- Twitter follower growth
- Inbound inquiries (people reaching out, not us chasing)

---

## 7. What We Are Not Doing

- Raising money before the product works
- Writing more marketing docs before distributing existing content
- Adding more personas before existing ones are tested
- Building a marketplace before anyone pays for anything
- Pretending to be a 10-person company

---

## 8. Kill Criteria

By **31 December 2026**, the thesis is broken if:

1. No paying users exist (consulting, hosted, or learning)
2. The product still has broken interactive elements
3. Zero organic inbound (nobody finds spike.land without being told)

These criteria exist so we know when to stop and do something else.

---

## 9. The Voice

Everything public should sound like this:

> I'm a Hungarian mathematician who moved to Brighton and built an AI platform.
> I live with two dogs who are smarter than most people I've met. I have ADHD
> and I used math to fix my brain. Now I'm using the same math to build
> something that makes other people smarter too. It's free. Try it.

Not like this:

> spike.land is a managed runtime for typed AI-callable tools, offering a
> multiplexer CLI with lazy toolset loading across 533+ natively hosted tools
> in a Cloudflare Workers-powered registry.

Both are true. Only one is human.

The deeper thesis (the E Pluribus resolution):

> E pluribus unum — out of many, one. The paradox: by becoming one, you lose
> the many. spike.land resolves this. You don't lose who you are. You become
> smarter by engaging with different minds. Einstein, Erdős, Daft Punk — each
> one changes how you think, but you stay you. Curiosity is additive, not
> substitutive. There is no paradox. Just use the site and stay curious.
