# Open Source Strategy

**Document version:** 1.0
**Date:** March 2026
**Classification:** Confidential
**Company:** SPIKE LAND LTD (UK Company #16906682), incorporated 12 December 2025

---

## 1. The npm Analogy

The npm registry became the default distribution layer for JavaScript not because it curated packages, but because it removed friction from the supply side and let community signals — install counts, weekly downloads, GitHub stars — surface quality at scale.

Spike Land applies the same principle to AI tooling.

Any developer can publish an MCP tool to the Spike Land registry without seeking approval from a committee. The barrier to entry is a passing CI run, not a human gatekeeper. Quality is determined by the community: install counts, user ratings, peer reviews, and fork activity create a reputation layer that scales with the ecosystem rather than bottlenecking on a review team.

Key properties of the permissionless model:

- **Any developer can submit.** No application process, no waitlist, no approval queue.
- **Volume is a feature.** A large catalog with strong filtering is more valuable than a small curated catalog. Developers find what they need through search, tags, and social proof.
- **Trust signals replace gatekeeping.** Install counts, verified publisher badges, test coverage scores, and community reviews communicate quality without centralizing the judgment.
- **Speed to market.** A tool published today can be discoverable and installable within minutes of passing the automated gate.

The npm analogy extends to the business model: the registry is the distribution layer; the platform value accrues from hosting, tooling, and discovery — not from controlling who is allowed to publish.

---

## 2. Quality Gate Model

Permissionless does not mean unfiltered. Every package submitted to the Spike Land registry must pass an automated quality gate before it becomes publicly discoverable. No human review is required; the CI pipeline is the gatekeeper.

The gate enforces the following standards without exception:

**Type safety**
- TypeScript strict mode across all packages
- No `any` type usage — use `unknown` or properly narrowed types
- No `@ts-ignore` or `@ts-nocheck` suppressions

**Code quality**
- ESLint via the shared `@spike-land-ai/eslint-config` configuration
- No `eslint-disable` comments permitted
- Consistent formatting enforced at lint time

**Test coverage**
- Vitest is the standard test runner across all packages
- Tests must pass across all four parallel CI shards before a package is published

**Build integrity**
- Every package must produce a clean build artifact
- Cloudflare Worker packages must deploy without error against the target environment

**CI pipeline sequence**
```
typecheck → lint → test (4 parallel shards) → build → publish
```

This sequence runs on every pull request via `.github/.github/workflows/ci-publish.yml`. A failure at any stage blocks publication. There is no override mechanism for contributors outside the core team.

The result is a registry where every listed package has, by definition, passed static analysis, type checking, and a test suite. This is a higher baseline than npm, which imposes no quality requirements, and achieves it without the cost and latency of human review.

---

## 3. The USB-C Analogy

Before USB-C, every device manufacturer shipped proprietary charging cables. The market fragmented around vendor lock-in. USB-C replaced that fragmentation with a single connector standard that any device could implement — creating interoperability without requiring any participant to cede competitive advantage in their core product.

MCP (Model Context Protocol) is the USB-C of AI tooling.

MCP defines a standard interface through which any AI agent can connect to any tool. The protocol is not owned by Spike Land; it is an open standard. Spike Land's role is to be the hub — the platform that aggregates, hosts, and distributes MCP-compatible tools.

Consequences of building on MCP:

- **Model-agnostic by design.** A tool published to Spike Land works with Claude, GPT-4, Gemini, Llama, and any other agent that implements the MCP client interface. Publishers write once; every major AI runtime is a potential user.
- **No platform dependency for tool authors.** Developers are not betting on a single AI vendor. Their tools remain portable.
- **Competitive moat from aggregation, not lock-in.** Spike Land's value is the catalog, the discovery infrastructure, the billing layer, and the managed hosting — not proprietary protocol control.
- **Adoption curve follows the AI market.** As enterprise adoption of AI agents accelerates, demand for MCP-compatible tooling grows proportionally. Spike Land is positioned at the distribution layer of that growth.

The USB-C analogy also captures the timing: the standard is new, the ecosystem is sparse, and the platform that builds the best hub now captures the default position before the market consolidates.

---

## 4. Network Effects Flywheel

Spike Land operates a two-sided marketplace: tool publishers on the supply side, AI developers and enterprises on the demand side. Network effects compound on both sides.

**The flywheel:**

```
More tools published
        ↓
Larger catalog → more developer discovery events
        ↓
More active users → more install counts and ratings
        ↓
Install counts create social proof → higher-quality signals
        ↓
Better discovery → more tools attract more publishers
        ↓
Revenue share payouts incentivize supply-side investment
        ↓
More tools published  [loop]
```

**Mechanisms that drive each stage:**

- **Supply incentive:** The 70/30 revenue share (70% to publisher, 30% to platform) means that a high-quality tool with strong install numbers generates meaningful passive income. This incentivizes professional-grade tool development, not just hobby projects.

- **Demand discovery:** The platform's search, tagging, and recommendation infrastructure surfaces the right tool at the point of need. Install counts and ratings are the primary sort signals, creating a self-reinforcing quality gradient: well-maintained tools accumulate installs, which increases their visibility, which generates more installs.

- **CLI lock-in through workflow integration:** `spike-cli` is the default MCP client CLI, distributed as open-source. Developers who integrate `spike-cli` into their development workflow have the Spike Land registry as their default tool source. This is the same mechanism by which `npm` became entrenched: the CLI ships with the runtime, and switching costs accrue through workflow habit rather than contractual lock-in.

- **Enterprise network effects:** When a tool is adopted inside an enterprise, internal developers see it in use and adopt it themselves. Enterprise accounts generate bulk install data that further amplifies social proof signals.

The flywheel is self-sustaining once catalog depth crosses the threshold where developers find Spike Land before searching elsewhere. The current 80+ native MCP tools represent the seed catalog; third-party publishing is the growth multiplier.

---

## 5. Comparison: npm vs Apple App Store vs Spike Land

| Dimension | npm | Apple App Store | Spike Land |
|---|---|---|---|
| **Publishing model** | Permissionless | Curated, human review | Permissionless + automated CI gate |
| **Quality enforcement** | None | Manual review by Apple team | Automated: typecheck, lint, test, build |
| **Hosting** | Publisher-managed | Apple-managed | Platform-managed (Cloudflare Workers) |
| **Revenue share** | None | 70/30 (publisher/Apple) | 70/30 (publisher/platform) |
| **Discovery** | Search + download counts | App Store editorial + search | Search + install counts + community ratings |
| **Protocol standard** | CommonJS / ESM (JS ecosystem) | iOS/macOS APIs (Apple ecosystem) | MCP (model-agnostic, open standard) |
| **Model dependency** | None (language-level) | Proprietary (Apple only) | None (any MCP-compatible agent) |
| **Review latency** | Instant (no review) | Days to weeks | Minutes (CI runtime) |
| **Trust signals** | Weekly downloads, GitHub stars | App Store ratings | Install counts, ratings, test coverage scores |
| **Platform lock-in** | Low (packages are portable) | High (iOS/macOS only) | Low (MCP tools are protocol-portable) |

**Key insight:** Spike Land occupies a position that neither npm nor the Apple App Store holds. npm's openness and speed are preserved — any developer can publish, and approval is automated rather than human. The App Store's managed infrastructure and revenue model are replicated — the platform handles hosting, billing, and discovery. The critical innovation is replacing the App Store's manual human review with automated CI/CD quality gates that are faster, cheaper to operate, more consistent, and harder to game through social engineering.

This is not a compromise between the two models. It is a third model that takes the best property from each — openness from npm, managed infrastructure and revenue share from the App Store — while discarding the weakest property of each: npm's absence of any quality baseline, and the App Store's review bottleneck and platform lock-in.

---

## 6. Why Open Source Wins

Open source is not a charitable position. It is a strategic one.

**Developer trust through transparency**

Enterprise developers and security-conscious teams do not adopt infrastructure they cannot inspect. Open-sourcing the core SDK, the CLI, and the shared configuration packages (`@spike-land-ai/eslint-config`, `@spike-land-ai/tsconfig`) makes the quality bar legible. Developers can see exactly what the CI gate enforces. Trust is earned through code, not marketing.

**Community contributions accelerate the tool ecosystem**

A proprietary CLI accumulates features at the pace of one team. An open-source CLI accumulates features at the pace of every developer who has a use case that the core team has not yet addressed. The MCP ecosystem is moving fast; community contributions close the gap between what the platform offers natively and what the market needs.

**Open-source spike-cli creates a distribution moat**

The CLI is the primary interface through which developers interact with the registry. Distributing it as open source maximizes adoption: it can be packaged by third parties, included in developer environment templates, and integrated into CI systems without legal friction. Each integration point is a distribution channel. The more environments `spike-cli` runs in, the more natural it is for developers to reach for the Spike Land registry first.

This mirrors how HashiCorp's open-source Terraform became the default infrastructure provisioning tool before the company introduced Terraform Cloud. The open-source tool created the distribution; the commercial platform monetized the scale.

**Selective open source: what remains proprietary**

Not everything is open. The commercial platform, the managed hosting infrastructure, the billing and payment systems, the analytics and recommendation engine, and the enterprise features remain proprietary. This is the standard open-core model: the developer-facing tooling is open to maximize adoption; the operational and commercial infrastructure is proprietary to capture value from that adoption.

**Open-sourced components:**
- `spike-cli` — MCP client CLI
- `@spike-land-ai/eslint-config` — shared ESLint rules
- `@spike-land-ai/tsconfig` — shared TypeScript configuration
- `@spike-land-ai/mcp-server-base` — shared base utilities for MCP server authors
- Selected core packages as defined in the current monorepo

**Proprietary components:**
- Platform hosting and managed runtime (Cloudflare Workers infrastructure)
- Billing, payment processing, and revenue share disbursement
- Discovery and recommendation algorithms
- Analytics dashboard and install tracking
- Enterprise features: private registries, SSO, audit logs, SLA guarantees

The boundary is drawn at the point where openness maximizes developer adoption and community contribution without undermining the commercial platform's competitive position. That boundary is a deliberate product decision, not a default.

---

*This document establishes the foundational vocabulary and strategic framing for Spike Land's open source positioning. All subsequent business documents referencing open source, quality gates, MCP positioning, or the competitive landscape should treat the definitions and analogies in this document as authoritative.*
