# spike.land QA Arena PRD

> **Date**: 16 March 2026
> **Author**: The Arena (Raju, Radix, Zoltan, Arnold, Erdos)
> **Status**: Draft -- executable blueprint
> **Company**: SPIKE LAND LTD
> **Current state**: qa-studio exists with a single tool-vs-browser benchmark.
> 287 MCP tools live on mcp.spike.land. No browser-based QA surface exists.
> All testing requires CLI, Playwright, or manual checks. Zero non-developer
> testers can run a health check today.

---

## 1. Product Vision

A browser-based QA testing platform accessible from any device -- even a $100
Android phone with a cracked screen on 3G. No install, no setup, no CLI. Open
spike.land/qa, enter a URL, get a health report. Done.

The QA Arena turns every spike.land user into a tester. It surfaces the
platform's own health as a first-class feature, not a hidden ops dashboard. When
a persona chat breaks, when a playground page 500s, when a blog post has broken
images -- the QA Arena catches it before any user files a bug report, and Raju
(the QA persona) can run checks on demand during any conversation.

> **Raju**: "I have tested spike.land for months. The platform breaks. Pages
> return 400s. Personas stop responding. Nobody notices because the only way to
> check is to manually open each URL. That era ends here. I will be the QA
> persona who catches every regression before it reaches a real user."

> **Zoltan**: "The honest truth: we have 1 organic Google visitor. If the site is
> broken when that visitor arrives, we lose 100% of our funnel. QA is not a nice-
> to-have. It is survival infrastructure. But let us be clear about scope -- we
> are not building Datadog. We are building a lightweight health dashboard that
> works on a phone."

> **Arnold**: "I will judge every feature by the Phone Test: can I run this on a
> Xiaomi Redmi 9A with 2GB RAM on a train in Budapest? If the answer is no, cut
> it. No WebGL. No heavy charting library. No 2MB JavaScript bundle. HTML, CSS,
> vanilla JS, and fetch(). That is the stack."

> **Erdos**: "The elegant formulation: QA Arena = f(url) -> health_report. One
> function. The entire product is making that function call trivially accessible
> from any surface -- browser, chat persona, cron alarm, MCP tool call."

> **Radix**: "The existing qa-studio has exactly one file: a benchmark comparing
> Playwright vs MCP tool calls. The benchmark proves the thesis -- MCP tool calls
> are 20x faster and require 57% less code than browser automation. The QA Arena
> builds on that thesis: test via MCP tools + fetch, not via Playwright."

---

## 2. Core Features

### Feature 1: Page Health Scanner

Enter any spike.land URL. Get an instant health report.

**What it checks**:

- HTTP status code and response time (ms)
- Render check: does the page return valid HTML with a `<title>` and `<body>`?
- Broken links: all `<a href>` and `<img src>` on the page, checked via HEAD
  requests
- Console errors: detected via inline `<script>` error handler injected by the
  scanner
- Mobile viewport simulation: checks for `<meta name="viewport">` and tests at
  320px, 375px, 414px widths
- Accessibility score: WCAG 2.1 AA compliance (color contrast, alt text, aria
  labels, heading hierarchy, touch target sizes >= 44px)
- Core Web Vitals estimation: LCP, FID proxy (Total Blocking Time from server
  timing headers), CLS (from layout shift markers in HTML)

**Architecture**:

- MCP tool: `qa_health_check` -- accepts a URL, returns structured JSON report
- Backend: Cloudflare Worker fetches the target URL, parses HTML, runs checks
- Frontend: Astro page at `/qa` with a single input field and results panel
- No Playwright. No headless browser. Pure fetch + HTML parsing on the edge

**Done-when criteria**:

- [ ] `qa_health_check` MCP tool is registered and callable from mcp.spike.land
- [ ] spike.land/qa page loads in < 50KB initial payload
- [ ] Health report renders in < 3 seconds for any spike.land URL
- [ ] Results display correctly on a 320px-wide screen
- [ ] Report includes: HTTP status, response time, broken links count, viewport
      meta presence, heading hierarchy, alt text coverage percentage

> **Raju**: "This is the feature I will use 50 times a day. Enter URL, get
> report. No login, no API key, no 'please install our CLI first'. Just a text
> input and a button."

> **Arnold**: "The Grandmother Test: she types spike.land/pricing into the box,
> presses the green button, and sees a checkmark or a red X. That is the entire
> UX. If I see a loading spinner for more than 3 seconds, I am redesigning it."

---

### Feature 2: Persona Chat Integration (Raju as QA Bot)

Raju becomes the QA persona in spike-chat. Users can ask Raju to test any page
during a conversation.

**Interaction patterns**:

```
User: "Test spike.land/pricing"
Raju: [calls qa_health_check] "Pricing page is healthy. 200 OK, 340ms response,
       0 broken links, viewport meta present, 4/4 images have alt text."

User: "Check if Daft Punk chat works"
Raju: [calls qa_persona_test with persona=daftpunk] "Daft Punk persona is live.
       Sent test message 'Hello', got response in 1.2s, no errors."

User: "Run the full test suite"
Raju: [calls qa_run_suite with suite=core] "Core suite: 18/20 passed.
       FAILED: /tools/chess-elo (404), /blog/mcp-swarm (broken image)."
```

**Architecture**:

- Raju persona definition in spike-chat with `qa_health_check`,
  `qa_persona_test`, and `qa_run_suite` tools bound to its tool list
- Each tool is a standard MCP tool on mcp.spike.land -- Raju calls them the
  same way any MCP client would
- Raju's system prompt includes instructions to format results as concise,
  actionable reports -- not raw JSON dumps

**Done-when criteria**:

- [ ] Raju persona exists at spike.land/raju and responds to chat
- [ ] "Test [url]" triggers `qa_health_check` and returns a human-readable
      summary
- [ ] "Check if [persona] works" triggers `qa_persona_test` and reports
      pass/fail with response time
- [ ] "Run full suite" triggers `qa_run_suite` and returns a summary table
- [ ] All responses render correctly in mobile chat view (320px width)

> **Zoltan**: "Raju as a chat persona is the distribution hack. Users do not go
> to a QA dashboard. They are already in spike-chat talking to Arnold or Radix.
> They say 'hey, the pricing page looks broken' and Raju checks it live. QA
> becomes conversational. That is the insight."

> **Erdos**: "The composition is beautiful: persona + MCP tool + chat UI. Three
> existing primitives, zero new infrastructure. The QA Arena is an emergent
> property of the platform, not a bolted-on feature."

---

### Feature 3: Test Suite Runner (Browser-Based)

Pre-built test suites for spike.land's critical flows, runnable from the browser.

**Pre-built suites**:

| Suite | Tests | What it checks |
|-------|-------|----------------|
| `core` | 20 | All key pages return 200, have valid HTML, pass basic a11y |
| `personas` | 6+ | Every persona chat responds without 400/500 errors |
| `tools` | 10 | Sample MCP tools on /tools load and are callable |
| `pricing` | 4 | Pricing page renders, Stripe checkout buttons have valid hrefs |
| `blog` | all | Every blog post returns 200, has og:image, renders content |
| `playgrounds` | all | All /tools/[slug] playground pages return 200 |

**Architecture**:

- Frontend: Astro page at `/qa/suites` -- list of available suites, run button,
  live results
- Each test is a thin wrapper around `qa_health_check` or `qa_persona_test` MCP
  tool calls
- Tests run sequentially from the browser via `fetch()` to the MCP endpoint
- Results displayed as a pass/fail dashboard with expandable details per test
- No Playwright, no WebDriver, no npm install -- pure browser JavaScript

**Results dashboard**:

```
Core Suite          18/20  [========== ] 90%
  spike.land            200  142ms
  spike.land/pricing    200  287ms
  spike.land/chat       200  195ms
  spike.land/tools      200  312ms
  spike.land/tools/chess-elo  404  89ms   FAIL
  spike.land/blog/mcp-swarm   200  245ms  FAIL (broken image)
  ...
```

**Done-when criteria**:

- [ ] `/qa/suites` page lists all available test suites
- [ ] Each suite can be run with a single tap/click
- [ ] Results stream in real-time (not all-at-once after completion)
- [ ] Pass/fail per test with HTTP status, response time, and failure reason
- [ ] Full suite run completes in < 30 seconds
- [ ] Results persist in localStorage for offline review
- [ ] Page works on 320px screens with touch-friendly tap targets (>= 44px)

> **Radix**: "The qa-studio benchmark already proved that MCP tool calls are 20x
> faster than Playwright for the same scenario. The Test Suite Runner is the
> productized version of that benchmark. Each test is 12 lines of code, not 28.
> Each test runs in 100ms, not 2500ms. That is the tool-first thesis in action."

> **Arnold**: "I want to tap 'Run All' on my phone while standing in line at
> Spar. 30 seconds later I know if spike.land is healthy. If the results page
> requires horizontal scrolling on mobile, I am filing a bug against ourselves."

---

### Feature 4: Regression Monitor

Cron-based health checks that catch regressions before users do.

**How it works**:

- Durable Objects alarm fires every 15 minutes
- Runs the `core` test suite against all critical URLs
- Compares current results against the last known good state
- If any URL transitions from 200 to non-200, or response time exceeds 2x the
  baseline, triggers an alert
- Alert destinations: D1 log entry + optional webhook (Slack, Discord, email via
  Mailchannels)

**Tracked metrics (per URL, per check)**:

- HTTP status code
- Response time (ms)
- Content hash (detects unexpected content changes)
- Broken link count
- Accessibility score delta

**Storage**:

- D1 table: `qa_health_history` -- timestamp, url, status, response_time_ms,
  content_hash, broken_links, a11y_score
- Retention: 90 days rolling
- Aggregations: hourly average response time, daily uptime percentage

**Dashboard**:

- `/qa/monitor` page showing last 24h status for all tracked URLs
- Sparkline charts (pure SVG, no charting library) for response time trends
- Current status: green/yellow/red badges per URL

**Done-when criteria**:

- [ ] Durable Objects alarm runs every 15 minutes and executes core health
      checks
- [ ] D1 table stores health check history with 90-day retention
- [ ] Status transitions (200 -> non-200) are detected and logged
- [ ] `/qa/monitor` page shows last 24h status for all tracked URLs
- [ ] Response time trend is visible as an inline SVG sparkline
- [ ] Alert webhook fires within 60 seconds of a detected regression
- [ ] Monitor page loads in < 40KB and works on 320px screens

> **Erdos**: "The regression monitor is a fixed-point detector. We define the
> healthy state as a fixed point h* where qa(url) = h* for all critical urls.
> Any deviation from h* triggers an alert. The mathematical structure is clean:
> a monitoring system is a function that checks whether the system has drifted
> from its fixed point."

> **Zoltan**: "15-minute checks on ~30 URLs is ~2,880 health checks per day.
> Each check is a single fetch + HTML parse on a Cloudflare Worker. Cost:
> effectively zero on the Workers free tier. This is the kind of infrastructure
> that should have existed from day one."

---

### Feature 5: Accessibility Audit

Per-page WCAG 2.1 AA compliance checks, built into the health scanner.

**What it checks**:

| Check | WCAG Criterion | Method |
|-------|---------------|--------|
| Color contrast | 1.4.3 (AA) | Parse computed styles, check 4.5:1 ratio for text |
| Alt text | 1.1.1 | Check all `<img>` elements for non-empty `alt` attribute |
| Aria labels | 4.1.2 | Check interactive elements for accessible names |
| Heading hierarchy | 1.3.1 | Verify h1 -> h2 -> h3 order, no skipped levels |
| Keyboard navigation | 2.1.1 | Check for tabindex, focus styles, no tabindex > 0 |
| Focus management | 2.4.7 | Verify `:focus-visible` styles exist |
| Touch target size | 2.5.8 | All interactive elements >= 44x44px on mobile |
| Language attribute | 3.1.1 | Check `<html lang="...">` is present |
| Page title | 2.4.2 | Check `<title>` is present and descriptive |
| Form labels | 1.3.1 | Check all `<input>` elements have associated labels |

**Architecture**:

- Integrated into `qa_health_check` as an optional `--a11y` flag
- Standalone MCP tool: `qa_accessibility_audit` for deep audits
- HTML-only analysis (no JavaScript execution) -- works on edge Workers
- Returns structured report with pass/fail per criterion, severity, and fix
  suggestions

**Report format**:

```
Accessibility Audit: spike.land/pricing
Score: 82/100 (AA partial)

PASS  Alt text          12/12 images have alt text
PASS  Heading hierarchy h1 > h2 > h3, no skips
PASS  Language attr     <html lang="en">
PASS  Page title        "Pricing — spike.land"
WARN  Touch targets     3 buttons below 44px minimum (mobile)
WARN  Color contrast    2 text elements below 4.5:1 ratio
FAIL  Form labels       1 input missing associated label
FAIL  Focus visible     No :focus-visible styles detected
```

**Done-when criteria**:

- [ ] `qa_accessibility_audit` MCP tool is registered and returns structured
      JSON report
- [ ] Audit covers all 10 checks listed in the table above
- [ ] Each check returns pass/warn/fail with specific element references
- [ ] Fix suggestions are included for each failed check
- [ ] Audit completes in < 5 seconds for any spike.land page
- [ ] Results render in the `/qa` health report and as a standalone section

> **Raju**: "Accessibility is not optional. spike.land says 'open to everyone'
> on the landing page. If a screen reader user cannot navigate the pricing page,
> that claim is a lie. The audit makes us honest."

> **Arnold**: "The touch target check is personal. I have fat fingers. If I
> cannot tap a button on my phone without accidentally hitting the one next to
> it, the design is broken. 44px minimum. Non-negotiable."

---

## 3. Architecture

### Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | Astro pages + vanilla JS | < 100KB payload, works everywhere |
| Backend | Cloudflare Workers (Hono) | Edge-native, zero cold start |
| MCP tools | `qa_health_check`, `qa_persona_test`, `qa_run_suite`, `qa_accessibility_audit` | Composable, callable from browser + chat + CLI |
| Storage | D1 | Test history, regression baselines |
| Scheduling | Durable Objects alarms | 15-minute regression checks |
| Alerts | Webhooks (Slack/Discord/email) | Configurable per workspace |

### Data flow

```
Browser (spike.land/qa)
  |
  | fetch("https://mcp.spike.land/mcp", { method: "POST", body: qa_health_check })
  |
  v
Cloudflare Worker (spike-land-mcp)
  |
  | fetch(target_url) + HTML parse + checks
  |
  v
  Returns structured JSON health report
  |
  v
Browser renders results (vanilla JS DOM manipulation)
```

### New MCP tools to build

| Tool | Input | Output |
|------|-------|--------|
| `qa_health_check` | `{ url: string, a11y?: boolean }` | `{ status, responseTime, brokenLinks, viewport, a11y, vitals }` |
| `qa_persona_test` | `{ persona: string, message?: string }` | `{ responsive, responseTime, error? }` |
| `qa_run_suite` | `{ suite: string }` | `{ total, passed, failed, results[] }` |
| `qa_accessibility_audit` | `{ url: string }` | `{ score, checks[], suggestions[] }` |

### Integration with existing infrastructure

- **spike-land-mcp** (src/spike-land-mcp): Register the 4 new QA tools
  alongside the existing 287 tools
- **spike-chat personas**: Add Raju persona with QA tools bound
- **spike-web** (packages/spike-web): Add `/qa`, `/qa/suites`, `/qa/monitor`
  Astro pages
- **Durable Objects**: New `QAMonitor` DO class for regression alarm scheduling
- **D1**: New `qa_health_history` table for storing check results

---

## 4. Mobile-First Design Constraints

These are hard constraints, not aspirations.

| Constraint | Target | Enforcement |
|-----------|--------|-------------|
| Minimum screen width | 320px (iPhone SE, Redmi 9A) | Test in CI at 320px viewport |
| Initial payload | < 100KB (HTML + CSS + JS, gzipped) | Bundle size check in build |
| Time to interactive | < 2 seconds on 3G | Lighthouse CI gate |
| Touch targets | >= 44x44px | Automated check via a11y audit |
| No framework JS | Vanilla JS only for QA pages | Code review enforcement |
| Offline results | Service Worker caches last results | SW registration on /qa |
| Font loading | System font stack only | No web font requests |
| Images | Zero images in QA UI | SVG icons only if needed |

> **Arnold**: "I will test every QA Arena page on a Xiaomi Redmi 9A with Chrome
> on 3G throttling. If it does not load in 2 seconds, if any button is too small
> to tap, if the results require horizontal scrolling -- it ships with a blocker
> bug. The Phone Test is the final gate."

> **Zoltan**: "< 100KB is aggressive but achievable. The landing page hero
> section alone is probably 200KB with images. The QA Arena has zero images, zero
> web fonts, zero charting libraries. It is HTML, CSS, and fetch(). If we cannot
> hit 100KB with that stack, something is deeply wrong."

---

## 5. Non-Goals (Explicit Scope Cuts)

These are things we are deliberately NOT building in this phase:

- **Visual regression testing** (screenshot diffing) -- requires headless
  browser, violates mobile-first constraint
- **Performance profiling** (CPU flame charts, memory heaps) -- build Datadog,
  not a health checker
- **Cross-browser testing** (Safari, Firefox matrix) -- we check HTTP responses,
  not rendering engines
- **Load testing / stress testing** -- different problem, different tool
- **User journey recording** (session replay) -- privacy concerns, heavy payload
- **Custom test authoring UI** -- power users use the MCP tools directly or
  write code; the browser UI runs pre-built suites only
- **Playwright integration in browser** -- the entire thesis of qa-studio is
  that MCP tool calls replace browser automation for health checks

> **Erdos**: "The elegance of a system is inversely proportional to the number of
> things it tries to do. The QA Arena does one thing: answers the question 'is
> this URL healthy?' Everything else is a different product."

---

## 6. Security & Privacy

- Health checks only target `*.spike.land` URLs. No arbitrary URL scanning
  (prevents SSRF and abuse as a proxy/scanner)
- Rate limiting: 10 checks/minute anonymous, 60 checks/minute authenticated
- No user data is stored in health check results -- only URL, status code, and
  timing data
- D1 health history is workspace-scoped, not publicly queryable
- Webhook alert payloads contain URL + status only, no page content

---

## 7. Success Metrics

| Metric | Baseline (today) | Target (30 days) | Target (90 days) |
|--------|------------------|-------------------|-------------------|
| Pages monitored | 0 | 30 | 100 |
| Regressions caught before user report | 0 | 5 | 20 |
| Health checks per day (automated) | 0 | 2,880 | 10,000 |
| Health checks per day (manual/chat) | 0 | 50 | 200 |
| Mean time to detect regression | unknown | < 15 min | < 5 min |
| QA Arena page load (p95) | N/A | < 2s on 3G | < 1.5s on 3G |
| Raju persona usage (messages/week) | 0 | 50 | 200 |

---

## 8. 14-Day Action Plan

### Days 1-3: Page Health Scanner + Raju Persona

**Day 1**:
- Implement `qa_health_check` MCP tool in spike-land-mcp
- Input: `{ url: string }`, Output: `{ status, responseTime, title, viewport }`
- Deploy to mcp.spike.land

**Day 2**:
- Add broken link detection and basic a11y checks to `qa_health_check`
- Create Raju persona definition in spike-chat with `qa_health_check` bound
- Test: "Test spike.land/pricing" in Raju chat returns health report

**Day 3**:
- Build `/qa` Astro page: single URL input, health report display
- Vanilla JS, < 50KB payload, 320px-responsive
- Deploy to spike.land/qa

**Done-when (Day 3)**:
- [ ] spike.land/qa accepts a URL and displays health report
- [ ] Raju persona responds to "test [url]" with health summary
- [ ] `qa_health_check` tool is callable via mcp.spike.land
- [ ] Page loads in < 2s on 3G throttling
- [ ] Works on 320px viewport without horizontal scroll

### Days 4-6: Test Suite Runner

**Day 4**:
- Implement `qa_run_suite` MCP tool
- Define `core` suite with 20 critical URLs
- Define `personas` suite that sends test message to each persona

**Day 5**:
- Build `/qa/suites` Astro page with suite list and run buttons
- Implement real-time result streaming (progressive DOM updates)
- Store results in localStorage

**Day 6**:
- Add `qa_persona_test` tool for individual persona testing
- Complete all pre-built suites: tools, pricing, blog, playgrounds
- Mobile polish: touch targets, responsive layout

**Done-when (Day 6)**:
- [ ] `/qa/suites` lists all test suites with run buttons
- [ ] Results stream in real-time as tests complete
- [ ] `core` suite runs 20 tests in < 30 seconds
- [ ] Results persist in localStorage for offline review
- [ ] All suites pass on current production spike.land

### Days 7-9: Regression Monitor

**Day 7**:
- Create `QAMonitor` Durable Object with alarm-based scheduling
- D1 migration: create `qa_health_history` table
- Implement 15-minute health check cron

**Day 8**:
- Implement status transition detection (200 -> non-200)
- Add webhook alerting (Slack/Discord payload)
- Add response time baseline tracking (rolling 24h average)

**Day 9**:
- Build `/qa/monitor` Astro page with last-24h status grid
- SVG sparkline charts for response time trends
- Green/yellow/red status badges per URL

**Done-when (Day 9)**:
- [ ] DO alarm fires every 15 minutes and runs health checks
- [ ] D1 stores check history with 90-day retention policy
- [ ] Status transitions trigger webhook alerts within 60 seconds
- [ ] `/qa/monitor` shows last 24h with sparkline trends
- [ ] Monitor page loads in < 40KB

### Days 10-12: Accessibility Audit

**Day 10**:
- Implement `qa_accessibility_audit` MCP tool
- Core checks: alt text, heading hierarchy, lang attr, page title, form labels

**Day 11**:
- Add contrast ratio estimation (parse inline/CSS custom property styles)
- Add touch target size detection
- Add focus management checks (tabindex, focus-visible)

**Day 12**:
- Integrate a11y results into `/qa` health report
- Add fix suggestions for each failed check
- Test against all spike.land pages, fix critical failures

**Done-when (Day 12)**:
- [ ] `qa_accessibility_audit` covers all 10 WCAG checks
- [ ] Each check returns pass/warn/fail with element references
- [ ] Fix suggestions are actionable and specific
- [ ] Audit completes in < 5 seconds per page
- [ ] All spike.land pages score >= 70/100

### Days 13-14: Mobile Polish + QA Arena Landing

**Day 13**:
- End-to-end testing on Xiaomi Redmi 9A (or BrowserStack equivalent)
- Fix all 320px layout issues
- Verify all touch targets >= 44px
- Implement Service Worker for offline result caching
- Bundle size audit: ensure < 100KB per page

**Day 14**:
- QA Arena landing page at `/qa` with navigation to suites and monitor
- Add Raju persona card to the spike.land homepage persona grid
- Update /apps catalog with QA Arena entry
- Write announcement for blog

**Done-when (Day 14)**:
- [ ] All QA Arena pages pass the Phone Test (320px, 3G, 2s load)
- [ ] Service Worker caches last test results for offline access
- [ ] Every page is < 100KB initial payload (gzipped)
- [ ] Raju appears in persona grid on homepage
- [ ] QA Arena is discoverable from /apps

---

## 9. Arena Voices: Final Word

> **Raju**: "After months of manually checking whether spike.land is broken, I
> finally get proper tools. The QA Arena is not a dashboard for managers. It is a
> weapon for testers. One URL, one button, one report. That is the spec."

> **Radix**: "The root of the problem was never 'we need more testing.' It was
> 'we need testing that anyone can run from anywhere.' The qa-studio benchmark
> proved that MCP tools are the right primitive. The QA Arena productizes that
> proof into 4 tools and 3 pages. The implementation path is clear."

> **Zoltan**: "Let me be the mirror: this is a 14-day plan for a team that has
> shipped 28 packages and 287 MCP tools. The scope is tight. The constraints are
> real. If we execute this, spike.land becomes the only MCP platform that eats
> its own dog food on QA -- publicly, from a browser, on any device. That is a
> story worth telling."

> **Arnold**: "The Phone Test is the only test that matters. If my grandmother
> in Debrecen can open spike.land/qa on her Samsung Galaxy A03 and see a green
> checkmark, we shipped. Everything else is engineering vanity."

> **Erdos**: "Four tools. Three pages. One thesis: health = f(url). The proof is
> left as an exercise for the next 14 days."
