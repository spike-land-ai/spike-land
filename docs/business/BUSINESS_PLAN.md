# Business Plan — SPIKE LAND LTD

> **Company**: SPIKE LAND LTD (UK Company #16906682)
> **Date**: March 2026
> **Classification**: Confidential — For Investor & HMRC Use
> **Stage**: Pre-Revenue, Commercial Launch Stage
> **Prepared For**: SEIS Advance Assurance (Part 5, Item 3)
> **Currency**: GBP Primary (USD Secondary at £1 = $1.27)

---

## 1. Executive Summary

SPIKE LAND LTD is a UK-incorporated technology company building a managed MCP (Model Context Protocol) platform. The platform enables developers and AI-native teams to discover, run, and manage AI tools through one hosted system instead of stitching together separate MCP servers and services. 

The product is live in beta at spike.land, featuring a working CLI (`spike-cli`), a web dashboard, and integrated hosted tools deployed on a global edge network (Cloudflare Business, fixed at $250/mo).* 

The company is pre-revenue, with Stripe integration near completion and a full commercial launch planned following product hardening. The SEIS raise of up to £250,000 will be used to accelerate go-to-market, expand the hosted tool ecosystem, and fund early hiring in growth and customer success.

*\*Note: 86 tools are natively hosted and managed by Spike Land; an additional 450+ tools are accessible via our MCP multiplexer connecting to third-party servers, bringing the total ecosystem to 533+ tools.*

**The company is SEIS-eligible: incorporated December 2025, no prior investment, fewer than 25 employees, gross assets under £350,000, carrying on a qualifying software development trade.**

---

## 2. Company Overview

| Field | Value |
|-------|-------|
| Legal Name | SPIKE LAND LTD |
| Company Number | 16906682 |
| Incorporation Date | 12 December 2025 |
| Registered Office | 42 Mighell Street, Apartment 70, Brighton BN2 0AU |
| SIC Codes | 62090 (IT consultancy), 63120 (Web portals) |
| Director | Zoltan Erdos (sole director) |
| Shareholders | Zoltan Erdos — 1 ordinary share at £1 (100%) |
| Corporation Tax Ref | BRCT00003618256 |
| Corporate Structure | Independent entity; no subsidiaries |
| Funding History | No prior fundraising; no shares issued under SEIS/EIS |

**Founder background**: Zoltan Erdos is a full-stack engineer with 10+ years of experience, bringing rigorous enterprise engineering background (formerly at VMO2) to his work. What began as a highly technical open-source side project is now architecturally ready to scale into a commercial platform. While the company is proudly UK-incorporated, the founder maintains geographic and structural agility, remaining open to relocating headquarters to emerging European tech hubs (such as Hungary) if it strategically benefits capital efficiency and growth. He built the entire initial platform using AI-assisted development, demonstrating the technical execution capability required to build tools for the emerging AI developer market.

---

## 3. Technical Readiness & Open Source Status

While the company is pre-revenue and focusing strictly on product completion before launching community growth initiatives, it has heavily de-risked the technical execution model.

- **Product Status**: Public beta launched in March 2026. Core infrastructure and edge database are 100% operational and ready to scale.
- **Tool Ecosystem**: 86 natively hosted MCP tools are integrated and functional on the platform, with multiplexer support extending access to 533+ tools overall.
- **Access Channels**: `spike-cli` is published and functional; web dashboard is live.
- **Open Source Foundation**: The core platform architecture is entirely open-sourced, serving as a transparent technical proof-of-concept for the developer market.
- **Commercial Readiness**: Stripe billing infrastructure is near completion (Subscription checkout complete, webhook provisioning in progress).

---

## 4. Problem & Solution

### 4.1 Problem

Developers building with AI face two compounding problems:

1. **Fragmented tooling** — The average developer uses 8+ SaaS tools daily (deployment, monitoring, QA, etc.). Each requires separate authentication, billing, and integration work.
2. **No managed MCP registry** — The Model Context Protocol (Anthropic, 2024) is becoming the standard for AI-tool interaction. However, developers currently must build, host, and secure their own MCP servers. There is no central, managed registry that handles authentication, rate limiting, and billing out of the box.

### 4.2 Solution

Spike Land provides a unified platform to solve this:

- **Managed MCP Registry** — 86 natively hosted tools in a single registry, with authentication, rate limiting, and metering handled by the platform.
- **Unified Access** — Tools can be invoked identically via the `spike-cli` or the web dashboard.
- **Edge-Native Infrastructure** — Deployed primarily on Cloudflare infrastructure, designed for low-latency global access and highly efficient unit economics.

---

## 5. Market Opportunity

Our initial Year 1-2 go-to-market is validated by a focused **bottom-up milestone**:
Targeting a niche of 5,000 highly active AI agent developers and indie hackers. Converting 5% (250 users) to a blended paid plan of ~£35/month generates an initial ARR milestone of ~£105,000, establishing clear product-market fit.

---

## 6. Target Personas (Primary Beachhead)

Rather than targeting the entire market from day one, Spike Land is focusing on a sharp initial wedge of early adopters. Customer Acquisition Cost (CAC) and Lifetime Value (LTV) figures are currently planning hypotheses to be tested and validated in Year 1.

1. **AI Agent Developer**: Builds AI agents using MCP. Discovers tools via npm and GitHub. Pain point: managing fragmented MCP server connections. Target: API PRO ($49/mo). Expected low CAC due to organic technical channels.
2. **Indie Hacker / Solo Founder**: Solo SaaS builders who need AI leverage. Pain point: tool sprawl and limited budget. Target: PRO ($29/mo). 
3. **AI Consultancy / Agency**: Small teams building AI solutions for clients. Needs multi-workspace management and per-client isolation. Target: BUSINESS ($99/mo) + API add-ons.
4. **DevOps / QA Team Lead**: Evaluates tools for team rollout. Needs audit logs, CI/CD integrations, and permission management. Target: BUSINESS ($99/mo).

---

## 7. Revenue Model & Pricing

The commercial model focuses on subscription recurring revenue (SaaS) and usage-based API add-ons. 

### 7.1 Current vs. Planned Revenue Streams

| Revenue Stream | Status | Timing |
|---|---|---|
| **Platform Subscriptions** | Active at commercial launch | Y1 |
| **API Add-ons (PRO / SCALE)** | Active at commercial launch | Y1 |
| **Credit Overages** | Planned after initial usage baseline | Y1 H2 |
| **Marketplace Take Rate (30%)** | Planned | Y2 |
| **App Builder Services** | Opportunistic / Founder-led | As needed |

### 7.2 Core Pricing Tiers

| Tier | Price | Deployments | AI Credits/mo | Team Members |
|------|-------|-------------|---------------|--------------|
| FREE | $0/mo | 3 | 100 | 1 |
| PRO | $29/mo | 10 | 2,000 | 3 |
| BUSINESS | $99/mo | Unlimited | 10,000 | 10 |

*\*Note: All USD prices convert at £1 = $1.27. The financial model conservatively assumes a blended ARPU of ~£33/mo.*

### 7.3 MCP API Access (Add-Ons)

For heavy programmatic usage (e.g., AI Agent Developers running large workloads):
- **Included in BUSINESS**: 1,000 API calls/mo (Read-only)
- **API PRO**: $49/mo (10,000 calls, full read/write)
- **API SCALE**: $149/mo (100,000 calls, webhooks, batch operations)

---

## 8. Go-to-Market Strategy

As a developer-first tool, acquisition relies heavily on Product-Led Growth (PLG) rather than expensive paid media.

1. **npm / CLI Distribution**: `npx @spike-land-ai/spike-cli` provides zero-install evaluation. This is the primary top-of-funnel engine.
2. **One-Liner Activation**: Adding spike.land as an MCP server to an AI IDE (like Claude Code) takes one terminal command.
3. **GitHub & Docs SEO**: Creating high-quality technical content, tutorials, and a strong open-source presence to capture developer search intent.
4. **Direct Outreach**: Targeting MCP tool authors with a compelling revenue-share proposition to rapidly populate the platform's marketplace.
5. **Community**: Leveraging Discord and developer communities (Hacker News, Indie Hackers) for organic word-of-mouth.

---

## 9. Competitive Landscape

The company believes its current combination of hosted MCP tooling, CLI access, and edge-native infrastructure is differentiated from existing point solutions and directories. The market currently appears underserved by managed MCP platforms that combine hosted tools, authentication, rate limiting, and billing in one offering.

| Competitor | Core Focus | Managed MCP Hosting? | CLI Access? | Tool Marketplace? |
|------------|-------------|------|------|--------------|
| **Vercel** | Web deployment | No | Yes | No |
| **Replit** | Cloud IDE | No | No | Limited |
| **Smithery/Glama** | MCP Directories | Directory only (No hosting) | No | No |
| **Self-Hosted MCP (DIY)** | Infrastructure | No | No | No |
| **spike.land** | **MCP-first AI platform** | **Yes (86 native, 533+ total)** | **Yes (`spike-cli`)** | **Yes (70/30 rev share)** |

**Potential Defensibility**: The tool marketplace is designed to introduce **Network Effects**. A rich library of tools attracts developers, which in turn attracts more tool authors seeking distribution and monetization. This creates a "cold start" barrier that can deter established platforms from easily cloning the ecosystem.

---

## 10. Three-Year Financial Forecasts

### 10.1 Key Assumptions
- Year 1 focuses on controlled growth, product hardening, and establishing baseline retention.
- Core hosting infrastructure utilizes the Cloudflare Business tier at a predictable $250/mo fixed cost, providing enterprise-grade performance without usage-based billing surprises.
- **Important Note on Capital Use**: The £250,000 SEIS raise is explicitly intended to *accelerate growth*. While baseline infrastructure costs are lean, the P&L reflects strategic burn as capital is deployed into Go-To-Market campaigns and key hires (Growth Lead, CS/Eng) starting mid-Year 1.
- **Sensitivity / Downside Scenario**: If paid conversion reaches only 2.5% (125 users) instead of the targeted 5%, Year 1 revenue would be approximately £21k. Even in this scenario, the company's capitalized runway would effortlessly extend well through Year 2, providing ample time to iterate on product-market fit without existential risk.

### 10.2 Year 1 Profit & Loss — Monthly Detail (M1-M12)

| Month | Paying Customers | Revenue (£) | COGS (£) | Gross Profit (£) | Opex (£) | EBIT (£) |
|-------|-----------------|-------------|----------|-----------------|----------|----------|
| M1 | 5 | 165 | 30 | 135 | 4,000 | -3,865 |
| M2 | 12 | 396 | 71 | 325 | 4,000 | -3,675 |
| M3 | 22 | 726 | 131 | 595 | 4,500 | -3,905 |
| M4 | 35 | 1,155 | 208 | 947 | 4,500 | -3,553 |
| M5 | 55 | 1,815 | 327 | 1,488 | 5,000 | -3,512 |
| M6 | 80 | 2,640 | 475 | 2,165 | 8,500 | -6,335 |
| M7 | 110 | 3,630 | 653 | 2,977 | 8,500 | -5,523 |
| M8 | 140 | 4,900 | 882 | 4,018 | 9,000 | -4,982 |
| M9 | 160 | 5,600 | 1,008 | 4,592 | 11,500 | -6,908 |
| M10 | 185 | 6,475 | 1,166 | 5,310 | 11,500 | -6,190 |
| M11 | 210 | 7,350 | 1,323 | 6,027 | 12,000 | -5,973 |
| M12 | 228 | 7,980 | 1,436 | 6,544 | 12,000 | -5,456 |
| **Total**| | **£42,832** | **£7,710** | **£35,122** | **£95,000** | **-£59,878** |

### 10.3 Year-End Balance Sheet & Cash Summary

| Item | Year 1 | Year 2 (Forecast) | Year 3 (Forecast) |
|------|--------|-------------------|-------------------|
| **Cash at Bank** | £190,122 | £200,122 | £330,122 |
| Other Assets | £3,000 | £10,000 | £28,000 |
| **Total Assets** | **£193,122** | **£210,122** | **£358,122** |
| | | | |
| Liabilities | £3,000 | £10,000 | £8,000 |
| **Net Assets** | **£190,122** | **£200,122** | **£350,122** |
| | | | |
| **Equity** | | | |
| Share Capital | £1 | £1 | £1 |
| Share Premium | £250,000 | £250,000 | £250,000 |
| Retained Earnings | -£59,879 | -£49,879 | £100,121 |
| **Total Equity** | **£190,122** | **£200,122** | **£350,122** |

*\*Note: Share Premium figure represents the forecast position post-SEIS raise.*

---

## 11. Use of Funds & Milestones

The maximum £250,000 SEIS raise will be deployed over 18-24 months for qualifying trade purposes to achieve specific growth milestones.

| Milestone / Objective | Estimated Spend | Intended Outcome |
|-----------------------|-----------------|------------------|
| **Commercial Launch & Billing** | £25,000 | Stripe live, paid plans activated, self-serve onboarding. |
| **Platform Hardening & Docs** | £35,000 | Comprehensive developer documentation, analytics, and robust APIs. |
| **Tool Registry Expansion** | £40,000 | Scale platform to 120+ hosted tools; implement marketplace revenue share. |
| **GTM & Content Marketing** | £50,000 | Founder-led demos, SEO content, initial push to first 100 paying customers. |
| **Growth & Engineering Hires** | £80,000 | Hire Growth Lead & CS/Engineering support to lower churn and drive acquisition. |
| **Working Capital / Contingency** | £20,000 | Professional fees, legal, accounting, and buffer. |
| **Total** | **£250,000** | |

---

## 12. SEIS Risk-to-Capital Statement

The company explicitly meets the HMRC Risk-to-Capital condition:
- **Long-term growth:** SPIKE LAND LTD is a genuine commercial software business seeking to build long-term value, increase its customer base, and expand its team.
- **Capital at Risk:** The company is pre-revenue. Success is highly uncertain in a competitive and rapidly evolving AI market.
- **No capital protection:** There are no asset backings, downside protections, or capital preservation arrangements in place. 
- **Return profile:** Investor returns depend entirely on the commercial success and future enterprise value of the company, not on tax relief alone. The company is not structured to provide low-risk returns or early extraction of capital.

---

## 13. Risk Factors

1. **Market Risk (MCP Adoption):** The Model Context Protocol may not achieve widespread industry adoption. *Mitigation:* MCP is backed by Anthropic and OpenAI. Furthermore, platform tools work independently of MCP via standard API channels.
2. **Competition Risk:** Established platforms (Vercel, Replit) could add managed MCP registries. *Mitigation:* Building early network effects via the tool marketplace to create a "cold start" barrier for competitors.
3. **Concentration Risk (AI Providers):** Core user workflows depend heavily on Anthropic/OpenAI/Google APIs. Pricing or policy changes by these providers could affect margins or product behavior. *Mitigation:* The platform architecture is model-agnostic, allowing developers to route requests to alternative open-source or proprietary LLMs.
4. **Execution Risk:** A single founder creates a key-person dependency. *Mitigation:* AI-assisted development enables the founder to ship quickly and operate efficiently at the current stage, while the raise provides capital to reduce single-founder execution risk through targeted hiring (Growth Lead and CS support in Y1 H2).

---

## 14. 18–24 Month Milestones

Rather than engineering speculative exit scenarios at this pre-revenue stage, the company is entirely focused on achieving the following operational and commercial milestones over the next 18 to 24 months to maximize enterprise value:

1. **Commercial Launch Completed:** Transition from public beta to full Stripe-integrated billing with self-serve onboarding.
2. **First 100 Paying Customers:** Achieve initial product-market fit within the core developer/indie hacker beachhead.
3. **Marketplace Launched:** Open the platform to third-party MCP tool publishers with a 70/30 revenue share model.
4. **First Agency/Team Customers Onboarded:** Validate the higher-LTV "BUSINESS" tier through multi-workspace usage.
5. **Enterprise-Ready Access Controls:** Deploy robust audit logs, RBAC, and SSO to unlock larger organizational deployments.
6. **ARR Target:** Reach a baseline of £105k+ ARR to establish strong momentum for a potential Series A or secondary EIS round.

---
*Document Version: 2.1 (SEIS Advance Assurance Edition)*
*Prepared: March 2026*