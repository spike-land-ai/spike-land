# COMPASS — Universal Bureaucracy Navigator | PRD v1.0

## Problem

~4B people miss services they're eligible for. Barrier: system complexity, not program absence. $2.1T/yr unclaimed globally.

| Domain | Gap | Impact |
|---|---|---|
| Healthcare | 1.5B lack access | Preventable deaths |
| Social protection | 70% poorest lack safety nets | Generational poverty |
| Refugee/asylum | 80% don't know full rights | Wrongful deportation |
| Education | 260M eligible children unenrolled | Lost potential |
| Pensions/disability | 50% elderly miss benefits | Elder poverty |
| Agriculture | 60% smallholders miss crop insurance | Food insecurity |

**Why existing solutions fail:** Gov websites (compliance-focused), legal aid (limited scale), chatbots (can't guide processes), search (can't synthesize pathways).

## Vision & Principles

Bureaucratic literacy as a universal human right. Free forever | Language-native (not translated) | Radically patient | Accuracy over speed | Privacy-first (E2E encrypted, never sold, deleted on request).

## Users

| Persona | Size | Need | Device |
|---|---|---|---|
| Displaced (refugees, IDPs) | 120M | Asylum, resettlement, rights in foreign languages | Shared smartphone, intermittent connectivity |
| Overlooked citizens | 2.5B | Discover programs, navigate applications | Feature phone → smartphone |
| Aging population | 1.1B→2.1B by 2050 | Pensions, healthcare, end-of-life admin | Varies, family-assisted |
| Small entrepreneurs | 2.5B | Credit, insurance, subsidies, permits | Smartphone; feature phone fallback |

Secondary: NGO case workers, community health workers, pro bono lawyers, government agencies.

## Core Capabilities

1. **Eligibility Discovery** — Conversational interview → profile → cross-reference all programs → rank by impact. Proactive alerts.
2. **Process Navigation** — Adaptive step-by-step guidance, dependency mapping, deadline tracking, alternative pathways.
3. **Document Assistance** — Plain-language explanations, form-filling guidance, checklists, prerequisite sourcing. Never fabricates.
4. **Rights Awareness** — Rights at every stage, appeal guidance, complaint templates, legal resource referrals.
5. **Institutional Intelligence** — Living knowledge of actual operations: wait times, common rejections, systemic patterns via crowdsourced data.

## Architecture

| Component | Description | Tech |
|---|---|---|
| Knowledge Engine | Process maps for 193 countries | Graph DB, versioned regulatory data, human-in-the-loop |
| Conversation Engine | Guided interviews, navigation, Q&A | Fine-tuned LLM + RAG |
| Eligibility Matcher | Profile → program matching | Deterministic rules engine |
| Document Processor | Form comprehension/completion/validation | OCR, form-field mapping, multilingual templates |
| Offline Core | Downloadable country packs | Compressed bundles, on-device inference |
| Feedback Loop | Anonymized outcomes → accuracy improvement | Differential privacy, aggregate reporting |

### Platforms

WhatsApp/Telegram/SMS (largest reach) | PWA (offline-capable) | Native Android (full offline) | USSD (~1B feature phones) | Voice/IVR (illiterate/visually impaired) | Kiosk (camps, offices, community centers).

### Languages

Phase 1: 50 (85% population) → Phase 2: 150 (97%) → Phase 3: 400+ including indigenous. Localization, not translation.

## Platform Integration

COMPASS is built entirely on the Spike Land MCP runtime, demonstrating that the same platform infrastructure available to any developer can power mission-critical, compliance-heavy, multi-country applications.

### MCP-Native Architecture

Each COMPASS engine is implemented as an MCP tool, discoverable and callable through the Spike Land registry:

| COMPASS Engine | MCP Tool Surface | Platform Component Used |
|---|---|---|
| Knowledge Engine | `compass.knowledge.*` | D1 (graph storage), Durable Objects (versioning) |
| Conversation Engine | `compass.conversation.*` | Workers AI (LLM inference), KV (session state) |
| Eligibility Matcher | `compass.eligibility.*` | Workers (deterministic rules engine) |
| Document Processor | `compass.document.*` | R2 (document storage), Workers (OCR pipeline) |
| Offline Core | `compass.offline.*` | R2 (country pack bundles), IndexedDB (client-side) |
| Feedback Loop | `compass.feedback.*` | D1 (anonymized outcomes), Workers (differential privacy) |

### API Layer

COMPASS API runs on Hono framework on Cloudflare Workers — the same edge API stack (`spike-edge`) used by the Spike Land platform. This means:

- Global low-latency access (Cloudflare's 300+ PoPs)
- No separate infrastructure to maintain
- Same auth layer (`mcp-auth` with Better Auth + Drizzle)
- Same billing and metering infrastructure

### PWA & App Store Distribution

- COMPASS PWA is deployable through the Spike Land app store
- Offline-capable via IndexedDB + compressed country packs
- Installable on any device without app store gatekeeping
- WhatsApp/Telegram bots connect via the same MCP tool surface

### Developer Ecosystem Implications

COMPASS proves that if a privacy-compliant, offline-capable, 50-language bureaucracy navigator with differential privacy can run on Spike Land's MCP runtime, then any tool can. This is the platform's strongest proof point for developer adoption and investor confidence.

## Data & Privacy

**Data model:** Five-layer graph — Jurisdiction → Program → Process → Institution → Outcome.

**Sources:** Official gov databases, NGO/intl body partnerships (UNHCR, ILO, World Bank), verified crowdsourcing, anonymized interaction data, automated regulatory monitoring.

**Privacy:** E2E encryption (transit + rest) | On-device processing for sensitive data | Zero data monetization | Full deletion on request | Third-party audits (published) | GDPR/CCPA + strictest local compliance.

## Business Model

Free for users. Funded by impact.

| Stream | Value Prop | Y5 Target |
|---|---|---|
| Government partnerships | Reduced processing costs, higher uptake, policy data | $200M+ |
| Intl org licensing | Amplified program reach | $80M+ |
| NGO/legal aid suite | Case management, batch processing (freemium) | $40M+ |
| Systemic intelligence reports | Anonymized aggregate bureaucratic performance | $20M+ |

### Platform Revenue Integration

COMPASS revenue flows through the Spike Land platform. Government partnerships and institutional licensing are processed through the platform's billing infrastructure. This creates a flywheel: COMPASS validates the platform, platform infrastructure reduces COMPASS operational costs, and COMPASS revenue funds platform development.

### Projections

| | Y1 | Y2 | Y3 | Y5 |
|---|---|---|---|---|
| Active users | 5M | 40M | 200M | 1B+ |
| Countries (deep) | 12 | 35 | 80 | 150+ |
| Languages | 50 | 150 | 300 | 400+ |
| Revenue | $8M | $45M | $140M | $340M+ |
| Cost/user/yr | $0.12 | $0.06 | $0.03 | $0.015 |
| Successful navigations | 2M | 25M | 150M | 800M+ |

## Go-to-Market

**Tier 1 (M1–6):** Germany (refugee integration), India (social protection at scale), US (fragmented benefits, $60B+/yr unclaimed), Kenya (ag subsidies, M-Pesa ecosystem).

**Tier 2 (M6–12):** Brazil, Bangladesh, Turkey, Colombia, Philippines, Jordan, Nigeria, Poland.

**Distribution:** Telecom pre-installs, gov portal integrations, messaging bots, refugee camp standard tool, CHW kits, legal aid orgs, community ambassadors, kiosks in offices/libraries.

## Roadmap

| Phase | Timeline | Key Deliverables |
|---|---|---|
| Foundation | M1–6 | Knowledge Engine (4 countries), Conversation Engine (50 langs), WhatsApp+PWA, gov partnerships (DE/IN), privacy audit, contributor platform |
| Scale | M7–18 | 35 countries/150 langs, Android+offline, USSD+IVR, NGO tools, intelligence reporting, document OCR |
| Ecosystem | M19–36 | 80+ countries/300+ langs, open API, predictive features (proactive alerts, deadline prediction), institutional feedback loop, Compass Foundation |

### Platform Milestone Alignment

COMPASS roadmap phases are aligned with Spike Land platform milestones:
- **Foundation (M1-6)**: Coincides with platform commercial launch and billing activation
- **Scale (M7-18)**: Coincides with marketplace launch and 70/30 revenue share activation
- **Ecosystem (M19-36)**: Coincides with enterprise-ready access controls and ARR scaling

## Metrics

| Category | Metric | Y1 | Y3 |
|---|---|---|---|
| Impact | Successful navigations | 2M | 150M |
| Impact | Economic value unlocked | $500M | $50B |
| Impact | Time-to-enrollment reduction | 60% | 75% |
| Impact | First-attempt approval | 70%+ | 85%+ |
| Product | MAU | 2M | 100M |
| Product | Knowledge completeness (flagship) | 90% | 99% |
| Product | Accuracy | 95%+ | 99%+ |
| Sustainability | Gov partnerships | 4 | 30+ |
| Sustainability | Cost/successful navigation | <$2.50 | <$0.50 |
| Sustainability | Community contributors | 5K | 100K+ |

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Inaccurate guidance | Critical | Human-in-the-loop, confidence scoring, disclaimers, rapid correction |
| Government resistance | High | Position as partner, demonstrate cost savings, co-branding |
| Privacy breach | Critical | Zero-knowledge architecture, E2E, minimal retention, audits, bounty |
| Regulatory change velocity | High | Automated monitoring, community verification, confidence decay |
| Over-reliance | Medium | Present options not directives, state limitations |
| Funding dependency | Medium | Diversified revenue, Foundation with independent governance |

## Team

### Near-Term Execution Model

In the near term (Y1-Y2), COMPASS development leverages the proven AI-assisted solo-founder model that built the Spike Land platform. The founder built the entire platform end-to-end using AI-assisted development, demonstrating that the 100-person team plan represents the long-term scaling trajectory, not the immediate requirement. Initial COMPASS engines are being built with the same methodology, targeting 2 Tier 1 countries (Germany, India) with a lean team before scaling.

### Long-Term Team (Y3+)

Leadership 5 (CEO/CTO/CPO/Partnerships/GC) | Engineering 30 (ML/NLP, backend, mobile, infra, security) | Knowledge Ops 25 (bureaucratic analysts, legal researchers, QA) | Localization 15 | Partnerships 10 | Design/Research 10 | Community 5.

**Governance:** Independent board (human rights, tech, reform, user reps) | User advisory council (elected per-country) | Accuracy review board (quarterly public reports) | Biannual transparency reports.

## Ethics

- **Do no harm** — Medical-grade principle; when uncertain, refer to humans
- **Never replace human judgment** — Navigator, not decision-maker
- **Refuse to enable harm** — No fraud, false claims, security circumvention
- **Equal treatment** — Regular bias audits on guidance quality and outcomes
- **Independence** — Gov partnerships never compromise user-side guidance; guides appeals regardless
