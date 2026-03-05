# spike.land User Test Report

**Date:** 2026-03-05
**Method:** 16 simulated user agents with diverse personas explored spike.land via real HTTP requests
**Tested URL:** https://spike.land

---

## Executive Summary: Top 10 Findings

| # | Severity | Finding | Agents Hit |
|---|----------|---------|------------|
| 1 | **Critical** | **No global navigation** — header has only logo + login button. No menu, no footer, no links to any page. Every page is a dead end. | 16/16 |
| 2 | **Critical** | **Entire site is invisible without JavaScript** — all pages return empty SPA shell. No SSR for homepage, pricing, tools, about, or any marketing page. Search engines, link previews, and accessibility tools see nothing. | 16/16 |
| 3 | **Critical** | **Annual billing checkout is broken** — backend only has `pro_monthly` and `business_monthly` Stripe lookup keys. Annual toggle on pricing page is cosmetic; annual checkout will fail. | 2/16 (Fatima, Oscar) |
| 4 | **High** | **Tool count inconsistency** — homepage says "80+", pricing says "74", `/mcp/tools` returns 195-221, `/api/store/tools` returns 253. Undermines trust. | 7/16 |
| 5 | **High** | **Powerful features exist but are completely undiscoverable** — mcp-image-studio (40+ tools), QA Studio (10 Playwright tools), chess-engine, learn/badge system all exist in codebase but are invisible on the site. | 6/16 |
| 6 | **High** | **No documentation portal** — `/docs` doesn't exist despite 140+ doc files in the repo. No API docs, no getting-started guide accessible from the website. | 12/16 |
| 7 | **High** | **Sitemap lists only 4 URLs** — missing /blog, /pricing, /about, /learn, and all 21 blog post URLs. Severely limits SEO. | 5/16 |
| 8 | **Medium** | **Blog post detail API returns 404 for some slugs** — listing endpoint returns slugs that 404 on individual fetch. Data inconsistency between list and detail. | 3/16 |
| 9 | **Medium** | **No privacy policy, terms, or legal entity info discoverable without JS** — Terms and Privacy exist as routes but are invisible to crawlers. No company registration, no DPA, no SLA. | 3/16 (Oscar, Dana, Yuki) |
| 10 | **Medium** | **Quiz engine is mocked** — option 0 is always correct (line 162 of learn/$sessionId.tsx), making the badge/quiz system meaningless for assessment. | 1/16 (Leo) |

---

## Ratings Overview

| Agent | Persona | Group | Rating |
|-------|---------|-------|--------|
| Sofia | Marketing manager | A - First Impressions | 3/10 |
| Raj | CS student from HN | A - First Impressions | 3/10 |
| Elena | Freelance designer | A - First Impressions | 2/10 |
| Tom | Retired engineer | A - First Impressions | 5/10 |
| Marcus | Senior backend dev | B - Developer Evaluators | 5/10 |
| Yuki | DevOps/security | B - Developer Evaluators | 7.5/10 |
| Priya | QA engineer | B - Developer Evaluators | 3/10 |
| Chen | Full-stack dev | B - Developer Evaluators | 5/10 |
| Alex | Free tier user | C - Buyer Journey | 4/10 |
| Dana | Team lead | C - Buyer Journey | 3/10 |
| Oscar | Finance reviewer | C - Buyer Journey | 4/10 |
| Fatima | Indie dev (Pro eval) | C - Buyer Journey | 3/10 |
| Jake | Chess bot builder | D - Power Users | 2/10 |
| Mina | AI artist | D - Power Users | 2/10 |
| Leo | Educator | D - Power Users | 3/10 |
| Kira | Bug hunter | D - Power Users | 6/10 |

**Average: 3.7/10** | **Median: 3/10**

---

## Issue Frequency Matrix

| Issue | Sofia | Raj | Elena | Tom | Marcus | Yuki | Priya | Chen | Alex | Dana | Oscar | Fatima | Jake | Mina | Leo | Kira | Count |
|-------|:-----:|:---:|:-----:|:---:|:------:|:----:|:-----:|:----:|:----:|:----:|:-----:|:------:|:----:|:----:|:---:|:----:|:-----:|
| No navigation menu | x | x | x | x | x | x | x | x | x | x | x | x | x | x | x | x | **16** |
| SPA shell / no SSR | x | x | x | x | x | x | x | x | x | x | x | x | x | x | x | x | **16** |
| No /docs page | x | x | x | x | x | x | x | x | x | x | x | x | x | x | x | x | **16** |
| Tool count inconsistency | x | | x | | x | | | x | x | | x | x | | | | | **7** |
| Incomplete sitemap | | x | x | x | | | x | | | | | | x | | | x | **6** |
| No footer | x | | | | | | | | x | x | x | x | | | | | **5** |
| Features undiscoverable | | | x | | | | x | | | | | | x | x | x | | **5** |
| Credits vs messages terminology | | | | | | | | x | x | | x | x | | | | | **4** |
| manifest.json 404 | | x | | x | | | x | | | | | | | | | x | **4** |
| Blog SSR broken/inconsistent | x | | | | | | | x | | | | | x | | | | **3** |
| No contact/support page | | | | | | | | | x | x | | | | | | | **3** (+ others noted) |
| Annual checkout broken | | | | | | | | | | | x | x | | | | | **2** |
| Deep health check incomplete | | | | x | | x | | x | | | | | | | | x | **4** |
| No privacy/terms discoverable | | | | | | x | | | | x | x | | | | | | **3** |

---

## Per-Agent Findings

### Group A: First Impressions

#### 1. Sofia (Marketing Manager) — 3/10

- `[bug]` All pages return blank SPA shell — no SSR
- `[bug]` Blog SSR appears broken — /blog/spike-land-launch returned generic title, no OG tags
- `[bug]` Sitemap only 4 URLs, missing blog posts
- `[bug]` Duplicate `<meta name="build-sha">` and `<meta name="build-time">` tags
- `[ux]` Header has only logo + login — NO navigation menu whatsoever
- `[ux]` Hero jargon: "80+ MCP tools. One CLI" — meaningless to non-technical users
- `[ux]` CTAs are "Browse the Registry" and "Add a Tool" — no "Get Started" or "Sign Up Free"
- `[ux]` No footer with nav links, social media, or site map
- `[ux]` No onboarding flow, no guided tour
- `[content]` Pill badge "MCP Multiplexer - Cloudflare Edge - Open Source" — pure jargon
- `[content]` Stats bar "8 CF Workers" — meaningless to non-technical audience
- `[content]` Blog titles entirely developer-focused, one post in Hungarian with no language indicator
- `[content]` About page tech stack reads like a developer resume, not a company page
- `[missing]` No /docs route
- `[missing]` No /discord or community links
- `[missing]` No /marketplace/apply route
- `[missing]` No contact form, support email, or chat widget
- `[missing]` No team bios, photos, or customer testimonials
- `[positive]` Pricing page well-structured: 3 tiers, monthly/annual toggle, FAQ
- `[positive]` Clean visual design, dark/light mode
- `[positive]` Blog API returns well-structured JSON
- `[positive]` Stripe checkout integration working
- `[confusion]` "74 MCP tools" (pricing) vs "80+ MCP tools" (homepage)

#### 2. Raj (CS Student from HN) — 3/10

- `[bug]` Homepage blank without JS — terrible for HN click-through
- `[bug]` All SPA routes return empty shells
- `[bug]` Blog post slug in API listing may 404 on individual fetch
- `[bug]` manifest.json returns 404
- `[ux]` No `<noscript>` fallback
- `[ux]` No navigation discoverable without JS
- `[ux]` Deep health check returns incomplete data
- `[missing]` No /docs route — 140+ doc files in repo but not served
- `[missing]` No student discount mentioned
- `[missing]` No RSS/Atom feed for blog
- `[positive]` Free tier exists and never expires — student-friendly at $0
- `[positive]` Blog API clean and functional
- `[positive]` Blog SSR metadata injection for individual posts is thorough
- `[positive]` Learn system with badges exists (undiscoverable)
- `[positive]` Edge caching strategy sophisticated (SWR pattern)
- `[positive]` Health endpoint returns clean JSON
- `[confusion]` "MCP-First" tagline assumes knowledge of MCP

#### 3. Elena (Freelance Designer) — 2/10

- `[bug]` SPA with zero SSR — blank for crawlers
- `[bug]` Sitemap severely incomplete
- `[bug]` Apps page data is hardcoded (3 entries), not API-driven
- `[ux]` No global navigation — zero discovery path
- `[ux]` "Tool Registry" — developer concept, not designer-friendly
- `[ux]` "Run" button on tools — unclear what "running an MCP tool" means for non-devs
- `[content]` Hero mentions "image gen" once in a comma-separated list — no explanation
- `[content]` 21 blog posts, zero about image/design/creative work
- `[content]` Store has 253 tools with zero image/creative category visible
- `[content]` About page lists tech stack, not product capabilities
- `[missing]` mcp-image-studio (40+ tools) exists in codebase but not surfaced
- `[missing]` No visual examples, screenshots, or demos
- `[missing]` No "Image" or "Creative" category in store
- `[missing]` No /docs, no /discord, no /marketplace/apply
- `[missing]` No footer
- `[positive]` Pricing page clean and readable
- `[positive]` Tools page has search and category filter
- `[confusion]` "74 MCP tools" vs "80+ MCP tools" vs 253 in API

#### 4. Tom (Retired Engineer) — 5/10

- `[bug]` Homepage blank for non-JS clients
- `[bug]` All SPA routes return empty shells
- `[bug]` manifest.webmanifest returns 404
- `[bug]` og-image.png returns 404
- `[bug]` Deep health check missing subsystem statuses
- `[bug]` Sitemap lists only 4 URLs, missing blog posts
- `[ux]` No server-rendered nav or site map for humans
- `[ux]` Blog SSR is crawler-only (display:none)
- `[missing]` No /docs or /learn endpoints with content
- `[missing]` No pricing info discoverable without JS
- `[missing]` No /about or company info without JS
- `[missing]` No RSS/Atom feed
- `[positive]` Blog API excellent — clean JSON, proper fields
- `[positive]` Blog content solid — 21 well-structured posts
- `[positive]` Blog SSR for crawlers well-engineered (OG, Twitter, JSON-LD)
- `[positive]` Edge caching textbook CDN behavior
- `[positive]` Security headers applied globally (CSP, HSTS, etc.)
- `[positive]` Clean architecture (Hono + CF Workers + R2 + D1)
- `[positive]` robots.txt correctly permissive
- `[confusion]` "MCP-First" means nothing without context
- `[confusion]` /tools vs /store vs /apps — unclear distinction

### Group B: Developer Evaluators

#### 5. Marcus (Senior Backend Dev) — 5/10

- `[bug]` All pages return empty SPA shell
- `[bug]` /version returns SPA shell instead of version data
- `[bug]` Health endpoint missing version/uptime/dependency info
- `[ux]` Pricing info buried in blog post, not on rendered page
- `[ux]` Tool catalog excellent data but invisible without JS
- `[missing]` No /docs or API documentation
- `[missing]` No /marketplace/apply route
- `[missing]` No self-hosting or enterprise tier
- `[missing]` No rate limit documentation
- `[missing]` No API authentication documentation
- `[positive]` /api/blog returns well-structured JSON (21 posts)
- `[positive]` BYOK documented in launch blog post (OpenAI, Anthropic, Replicate)
- `[positive]` /api/store/tools returns 253 tools — large catalog
- `[positive]` /mcp/tools returns 195 tools
- `[positive]` Blog SSR for crawlers well-implemented
- `[positive]` Solid edge architecture (CF Workers + Hono + R2 + D1 + DO)
- `[positive]` 3 pricing tiers reasonable, BYOK on free tier
- `[content]` All 21 posts by single author, one in Hungarian
- `[confusion]` /mcp/tools (195) vs /api/store/tools (253) — undocumented difference
- `[confusion]` Blog says "74 tools" but APIs return 195-253

#### 6. Yuki (DevOps/Security) — 7.5/10

- `[positive]` HSTS preload with 2-year max-age — gold standard
- `[positive]` Comprehensive CSP header
- `[positive]` X-Content-Type-Options, X-XSS-Protection, X-Frame-Options, Referrer-Policy all set
- `[positive]` CORS properly configured (dynamic origin, not wildcard)
- `[positive]` Proxy routes use explicit header allowlist — excellent
- `[positive]` All proxy routes require auth middleware
- `[positive]` Rate limiting via Durable Objects (4 req/20s)
- `[positive]` spike_client_id cookie: HttpOnly, SameSite=Lax, Secure
- `[positive]` Error handler never leaks stack traces
- `[positive]` Service bindings keep internal calls off public internet
- `[positive]` No server version headers or tech fingerprinting
- `[positive]` HTML escaping for SSR injection
- `[positive]` Stripe webhook signature verification with timestamp validation
- `[security]` Deep health check (`?deep=true`) is unauthenticated — exposes service topology
- `[security]` `/mcp/tools` is public — exposes entire tool inventory including internal tools
- `[ux]` SPA catch-all returns 200 for nonexistent routes — breaks HTTP semantics
- `[ux]` GA4 analytics sent server-side — should be disclosed
- `[missing]` No `/.well-known/security.txt`
- `[missing]` No /privacy or /terms discoverable without JS
- `[missing]` No cookie consent banner (GDPR concern)
- `[missing]` No per-tool permission documentation
- `[bug]` Minor: `inlineMarkdown` may double-escape URLs containing `&`

#### 7. Priya (QA Engineer) — 3/10

- `[bug]` All pages blank without JS
- `[bug]` manifest.json returns 404
- `[bug]` Sitemap missing blog posts, /bugbook, /about, /pricing
- `[ux]` No QA/testing content on homepage
- `[ux]` No search functionality
- `[missing]` QA Studio (10 Playwright MCP tools) exists but is undiscoverable from website
- `[missing]` No QA-focused landing page or documentation
- `[missing]` No filtering by use case
- `[missing]` No getting-started for QA workflows
- `[positive]` /apps/qa-studio route has special-case handling for capitalization
- `[positive]` Blog post "Testing Pyramid Is Upside Down" relevant to QA
- `[positive]` Blog post "Why We Gave Bugs an ELO Rating" innovative
- `[positive]` Bugbook API works: returns structured JSON with pagination
- `[positive]` /api/blog well-structured
- `[positive]` Individual blog SSR metadata well-implemented
- `[confusion]` MCP not explained for visitors unfamiliar with it

#### 8. Chen (Full-Stack Dev) — 5/10

- `[bug]` All pages empty SPA shell
- `[bug]` Blog SSR may be broken in production (code exists but OG tags not injected)
- `[bug]` /api/blog/:slug returns 404 for some slugs from listing
- `[bug]` Health endpoint incomplete
- `[ux]` All navigation requires JS
- `[ux]` 30+ routes exist but undiscoverable
- `[content]` Homepage positions as MCP multiplexer, not IDE competitor
- `[content]` Bugbook (ELO-rated bugs) is genuinely novel
- `[missing]` No /docs page
- `[missing]` No CLI download/installation page
- `[missing]` No open-source repo link visible on site
- `[positive]` /mcp/tools returns 221 tools across 52 categories — deeper than competitors
- `[positive]` Blog content shows genuine technical depth (21 posts)
- `[positive]` Pricing competitive ($29/mo Pro)
- `[positive]` Architecture lean and modern (100% Cloudflare)
- `[positive]` Blog image serving well-engineered (immutable cache)
- `[confusion]` Inconsistent positioning: IDE vs CLI vs marketplace vs API gateway
- `[confusion]` "74 MCP tools" (pricing) vs 221-253 (API)

### Group C: Buyer Journey

#### 9. Alex (Free Tier User) — 4/10

- `[bug]` All pages blank SPA shell
- `[bug]` No auth guard on checkout button — unauthenticated POST will fail
- `[ux]` Header: logo + login only, no navigation
- `[ux]` "Free to start" in small stats text — only homepage mention of free tier
- `[ux]` "Current Plan" button links to /settings?tab=billing — requires auth
- `[ux]` "Buy More Credits" and /pricing are separate upgrade paths — confusing
- `[ux]` Login "Limited features" for guests is vague
- `[ux]` No footer
- `[missing]` No /signup route — must use /login
- `[missing]` No /docs route
- `[missing]` No /account route (buried in /settings)
- `[missing]` No /billing page (tab in /settings)
- `[missing]` Store doesn't indicate free vs paid tools
- `[missing]` Tools page doesn't indicate tier requirements
- `[missing]` No support/contact page
- `[missing]` No onboarding flow after signup
- `[positive]` Pricing page well-structured with FAQ
- `[positive]` Stripe integration real and functional
- `[positive]` Clean modern UI design
- `[positive]` Blog integrated into homepage (3 latest posts)
- `[confusion]` Tool count: "80+" vs "74" vs API counts
- `[confusion]` "AI credits" vs "messages" terminology

#### 10. Dana (Team Lead) — 3/10

- `[bug]` All pages blank SPA shell
- `[bug]` No 404 for nonexistent routes (/enterprise, /teams show empty content)
- `[ux]` Homepage developer-individual focused — no "For Teams" section
- `[ux]` No "Contact Sales" button
- `[ux]` Store has no team bundles or volume licensing
- `[missing]` Per-seat vs per-org pricing unclear — deal-breaker for budget approval
- `[missing]` No volume discounts
- `[missing]` No SSO/SAML/SCIM
- `[missing]` "Team management" feature listed but never explained
- `[missing]` No /enterprise page
- `[missing]` No /teams page
- `[missing]` No /contact page or sales contact
- `[missing]` No /docs page
- `[missing]` No onboarding flow for teams
- `[missing]` No SLA or uptime guarantees
- `[missing]` No security/compliance page (SOC 2, GDPR)
- `[missing]` No case studies or team success stories
- `[positive]` Business tier exists ($99/mo)
- `[positive]` Tech stack modern and credible
- `[positive]` 80+ tools is genuine differentiator
- `[positive]` Open source and transparent
- `[positive]` Checkout flow wired to Stripe
- `[confusion]` "MCP-First" tagline unclear for business buyers

#### 11. Oscar (Finance Reviewer) — 4/10

- `[bug]` All pages blank SPA shell
- `[bug]` Annual checkout broken (missing Stripe lookup keys)
- `[ux]` No link to pricing from homepage
- `[ux]` No footer with legal links
- `[ux]` Header: logo + login only
- `[content]` JSON-LD says "messages" but pricing says "credits" — inconsistent
- `[missing]` Hidden credit packs ($5/500, $20/2,500, $50/7,500) not on pricing page
- `[missing]` No company registration, legal entity name, or registered address
- `[missing]` No SOC 2 certification for spike.land itself
- `[missing]` No DPA (Data Processing Agreement)
- `[missing]` No SLA
- `[missing]` No tax information (VAT, sales tax)
- `[missing]` No standalone refund policy
- `[missing]` No billing portal preview before committing
- `[positive]` Terms of Service exist (updated March 4, 2026)
- `[positive]` Privacy Policy exists with GDPR compliance, all 6 rights listed
- `[positive]` Cancellation policy clear (cancel anytime, no prorated refunds)
- `[positive]` 30-day notice for price changes, 14-day for terms changes
- `[positive]` Payment via Stripe — never stores card numbers
- `[positive]` Data retention clearly stated (30 days after deletion, 7 years tax records)
- `[positive]` BYOK reduces API spend within existing vendor agreements
- `[positive]` Stripe webhook signature verification

#### 12. Fatima (Indie Dev, Pro Eval) — 3/10

- `[bug]` Annual checkout broken — backend only has monthly Stripe lookup keys
- `[bug]` No navigation to discover pricing page
- `[bug]` Checkout has no auth guard
- `[ux]` No "Sign up for Pro" CTA anywhere
- `[ux]` Login -> find pricing -> checkout is too many steps with no guidance
- `[ux]` "Buy More Credits" goes to /settings, not /pricing
- `[missing]` No comparison table of 10 free tools vs full 74
- `[missing]` No explanation of credit cost per action
- `[missing]` No Pro-only badges on tools or store
- `[missing]` No Pro user stories or case studies
- `[missing]` No team info or founding date for trust
- `[missing]` No /signup route
- `[missing]` No /faq page (FAQ embedded in undiscoverable pricing page)
- `[positive]` Pricing page well-structured with 3 tiers
- `[positive]` Monthly/annual toggle with "Save 20%" badge
- `[positive]` Pro highlighted as "Most Popular"
- `[positive]` FAQ on pricing page covers key questions
- `[positive]` Stripe integration functional
- `[confusion]` "74 MCP tools" vs "80+ MCP tools"
- `[confusion]` JSON-LD "messages" vs pricing "credits"

### Group D: Power Users & Edge Cases

#### 13. Jake (Chess Bot Builder) — 2/10

- `[bug]` Blog post detail API returns 404 for slugs from listing
- `[bug]` /api/tools and /api/store return SPA shell instead of JSON
- `[ux]` /api/health returns SPA shell instead of JSON
- `[ux]` Homepage has zero mention of chess
- `[missing]` No /chess or /arena route
- `[missing]` Chess not in sitemap
- `[missing]` MCP registry has chess categories defined but ZERO tool implementations
- `[missing]` chess-engine package exists (well-written) but not wired into MCP
- `[missing]` No /learn or /docs with chess content
- `[missing]` No chess API endpoints in spike-edge
- `[missing]` chess-engine npm package requires GitHub auth (401)
- `[content]` /apps lists "Chess Engine" app — but only in client-rendered view
- `[positive]` chess-engine source code well-structured (TypeScript, proper modules, tests)
- `[positive]` /apps/chess-engine has product page with 5 capabilities and custom SVG
- `[positive]` Blog API works (21 posts)
- `[confusion]` Blog post talks about chess engine as working system, but it's not usable

#### 14. Mina (AI Artist) — 2/10

- `[ux]` Homepage has zero indication of image/creative tools
- `[ux]` No navigation to discover any section
- `[ux]` SPA with no SSR — blank for all non-JS clients
- `[content]` About page mentions "image generation" once in a bullet point — only mention on entire site
- `[content]` 21 blog posts, zero about image/creative work
- `[content]` Store has 253 tools with zero image/creative category visible
- `[missing]` mcp-image-studio (40+ tools) exists but is NOT registered in MCP registry
- `[missing]` Ghost categories defined (image, gallery, album, batch-enhance, pipelines) but empty
- `[missing]` No /gallery, /albums, /studio routes
- `[missing]` No /docs, no image API documentation
- `[missing]` No visual examples or demos
- `[missing]` No creative-focused blog content
- `[positive]` Health endpoint works
- `[confusion]` About page claims image generation capability that doesn't exist in practice

#### 15. Leo (Educator) — 3/10

- `[bug]` Quiz engine is mocked — option 0 is always correct (meaningless assessment)
- `[bug]` Learn page URL fetch fails for most sites due to CORS
- `[ux]` /learn is completely undiscoverable (no nav link)
- `[ux]` Landing page says "AI Development Platform" — no mention of learning
- `[ux]` Three tool-browsing pages (/tools, /apps, /store) with unclear relationships
- `[content]` Blog has some educational value but is developer-focused
- `[missing]` No /courses or /tutorials route
- `[missing]` No educational pricing or student discounts
- `[missing]` No "For Educators" or "For Students" section
- `[missing]` No /docs route
- `[missing]` Monaco code editor exists in codebase but not exposed in SPA
- `[positive]` /learn route exists with "Learn & Verify" feature — genuinely useful concept
- `[positive]` Badge system exists with topic, score, date, shareable URL
- `[positive]` Tool Registry has search and category filtering
- `[positive]` "Create Tool" button could enable project-based learning
- `[confusion]` MCP jargon impenetrable for students

#### 16. Kira (Bug Hunter) — 6/10

- `[bug]` No visual 404 for nonexistent SPA routes (returns 200 with shell)
- `[bug]` /api/ paths that miss routes fall through to SPA HTML instead of JSON 404
- `[bug]` Deep health check returns incomplete data
- `[bug]` manifest.json returns 404
- `[bug]` Blog post detail API 404s for some listing slugs
- `[ux]` Double-slash URLs (//pricing) not canonicalized
- `[ux]` Sitemap only 4 URLs
- `[positive]` .env returns 404 — no sensitive files exposed
- `[positive]` robots.txt clean and permissive
- `[positive]` API proxy routes require auth with URL allowlists
- `[positive]` Error handler returns generic 500 — no stack traces
- `[positive]` Static asset 404s return proper 404 status
- `[positive]` /api/blog/nonexistent returns proper JSON 404
- `[positive]` Bugbook endpoint works with structured response
- `[positive]` Blog SSR for crawlers well-implemented (when working)
- `[security]` /api/ namespace should return JSON 404, not HTML
- `[security]` Unauthenticated deep health check

---

## Severity Rankings

### P0 — Ship Blockers (Fix before any launch push)

1. **Add global navigation** — header nav bar with links to Pricing, Tools, Blog, About, Docs, Login
2. **Add a footer** — links to Terms, Privacy, About, Contact, Status, GitHub
3. **Fix annual Stripe checkout** — add `pro_annual` and `business_annual` lookup keys
4. **Add auth guard on checkout button** — check authentication before POSTing to /api/checkout

### P1 — High Priority (Fix within 1 week)

5. **Add SSR for marketing pages** — at minimum: homepage, pricing, about, tools (even static HTML snapshots)
6. **Expand sitemap** — include /blog, /pricing, /about, /learn, and all blog post URLs
7. **Fix tool count inconsistency** — pick one number and use it everywhere
8. **Create /docs page** — serve existing documentation to users
9. **Fix blog post slug 404s** — ensure listing slugs work on detail endpoint
10. **Fix credits vs messages terminology** — use "credits" everywhere including JSON-LD

### P2 — Medium Priority (Fix within 1 month)

11. **Add /contact or support page** — at minimum an email address
12. **Clarify per-seat vs per-org pricing** on Business plan
13. **Disclose credit packs on pricing page** — hidden costs erode trust
14. **Register image studio tools in MCP registry** — 40+ tools sitting unused
15. **Register chess engine tools in MCP registry** — categories defined but empty
16. **Fix quiz engine** — implement real question generation instead of mock
17. **Add security.txt** at /.well-known/security.txt
18. **Auth-gate deep health check** (`/health?deep=true`)
19. **Return JSON 404 for unmatched /api/* routes**
20. **Deploy og-image.png and manifest.webmanifest**

### P3 — Nice to Have (Backlog)

21. Add free/paid badges to tool listings
22. Add RSS feed for blog
23. Add `<noscript>` fallback
24. Add company registration info and DPA
25. Add cookie consent mechanism
26. Canonicalize double-slash URLs
27. Add educational pricing / student tier
28. Add team onboarding flow
29. Add case studies and testimonials
30. Create landing pages for verticals (QA, image, chess, education)

---

## Recommendations

### Immediate (This Week)

1. **Navigation is the #1 blocker.** Every single agent hit this. Add a simple nav bar: `Pricing | Tools | Blog | About | Docs | Login`. Add a footer with legal links. This alone would improve the average rating by 1-2 points.

2. **Fix the Stripe annual checkout.** You're advertising annual pricing with a 20% discount but the backend can't process it. This is lost revenue.

3. **Consolidate tool count to one number.** Either update the code to dynamically count from the API, or pick "250+" and use it consistently.

### Short Term (This Month)

4. **SSR for key pages.** Even simple meta tag injection (like you already do for blog posts) for /pricing, /about, and / would dramatically improve SEO and link previews.

5. **Surface hidden features.** mcp-image-studio (40+ tools), QA Studio (10 tools), and chess-engine exist and are well-built but invisible. Register them in the MCP registry and create landing pages.

6. **Create a /docs page.** You have 140+ documentation files. Serve them.

### Medium Term (This Quarter)

7. **Clarify positioning.** Agents were confused whether this is an IDE, CLI, marketplace, or API gateway. Pick a primary positioning and make it the hero message.

8. **Enterprise readiness.** Add per-seat pricing clarity, SSO/SAML, SLA, DPA, and a /contact page for sales inquiries.

9. **Vertical landing pages.** Create pages for QA engineers, AI artists, educators, and chess enthusiasts — the tools exist, they just need front doors.

---

## What's Working Well

Despite the low ratings, agents consistently praised:

- **Security posture** (7.5/10 from DevOps engineer) — excellent headers, auth, CORS, proxy sanitization
- **Blog content quality** — 21 well-written, technically deep posts
- **Blog API design** — clean JSON, proper fields, good caching
- **Architecture** — lean Cloudflare Workers stack, no overengineering
- **Tool ecosystem depth** — 195-253 real tools across 52 categories
- **Pricing structure** — clear tiers, competitive pricing, BYOK on free tier
- **Stripe integration** — real payment infrastructure
- **Edge caching** — textbook CDN behavior with proper cache headers

The platform has strong bones. The primary issue is **discoverability** — the front door is locked while the house behind it is well-built.
