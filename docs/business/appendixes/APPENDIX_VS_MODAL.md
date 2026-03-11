# Spike Land vs Modal — Competitive Analysis

**Classification:** Confidential — For Investor Use
**Date:** March 2026
**Version:** 1.0

---

## 1. Overview

Modal is a serverless infrastructure platform designed for running Python
functions on GPU-accelerated cloud compute. Its primary use cases are ML model
inference, batch data processing, scheduled jobs, and training runs. Modal's
developer experience focuses on making it fast to spin up ephemeral GPU
containers from a Python script without managing infrastructure. It is
centralized, compute-centric, and oriented toward ML engineering teams.

Spike Land is an edge-native MCP tool runtime and App Store for the agent
internet. It provides infrastructure for publishing, discovering, and executing
AI tools globally, with offline capability and model-agnostic architecture.
Spike Land does not offer GPU compute. It offers globally distributed,
low-latency tool orchestration on Cloudflare Workers across 300+ points of
presence.

These are different compute paradigms solving different parts of the AI
development and deployment workflow.

---

## 2. Compute Focus

Modal's infrastructure bet is centralized GPU clusters. The Modal developer
writes a Python function, decorates it with `@app.function(gpu="A100")`, and
Modal handles container scheduling, GPU allocation, and autoscaling. This is
optimized for throughput-intensive workloads: running a 70B parameter model,
processing 10,000 images, or training a LoRA fine-tune. The compute is heavy,
bursty, and latency-tolerant.

Spike Land's infrastructure bet is distributed edge compute. The Spike Land
developer publishes a TypeScript function as an MCP tool, and Spike Land handles
global distribution, caching (KV, R2), persistent state (Durable Objects), and
sub-10ms response times from 300+ edge locations. This is optimized for
orchestration-intensive workloads: coordinating tool calls across an agent
workflow, serving compliance data with jurisdiction routing, managing per-user
session state at the edge. The compute is lightweight, continuous, and
latency-sensitive.

| Compute Dimension        | Modal                        | Spike Land                       |
| ------------------------ | ---------------------------- | -------------------------------- |
| Primary compute unit     | GPU container (seconds)      | Edge Worker (milliseconds)       |
| Latency profile          | 100ms - 30s (GPU cold start) | Sub-10ms (edge)                  |
| Throughput orientation   | High (batch, training)       | Low per-call (high concurrency)  |
| State model              | Stateless functions          | Durable Objects (persistent)     |
| Geography                | Centralized (AWS regions)    | Distributed (300+ PoPs)          |
| Language                 | Python                       | TypeScript / any via MCP         |
| Offline capability       | No                           | Yes                              |

---

## 3. What Modal Lacks

**No app store or tool marketplace.** Modal has no concept of publishing a
function as a discoverable, installable tool. There is no catalog, no
discovery, no install graph, and no revenue share model for function authors.
Every Modal function is private infrastructure. Spike Land's App Store is the
entire distribution layer.

**No MCP protocol support.** Modal functions are invocable via Python SDK or
HTTP. They have no standardized MCP surface and cannot be discovered or invoked
by an MCP-compatible AI agent without custom wrapper code. Spike Land tools
are natively MCP-compatible.

**No developer-facing marketplace.** Modal's commercial model is pay-per-GPU-
second charged to the function owner. There is no mechanism for third-party
developers to publish tools that generate revenue. Spike Land's 70/30 revenue
share creates a developer ecosystem with economic incentives aligned toward
quality and breadth of the tool catalog.

**No offline path.** Modal requires connectivity to Modal's infrastructure.
There is no concept of offline-capable function execution. Spike Land supports
offline operation, a requirement for enterprise deployments in regulated
environments or regions with unreliable connectivity.

**No tool discovery.** An AI agent cannot query Modal's infrastructure to find
available functions. There is no registry, no category taxonomy, and no
capability metadata. Spike Land's MCP registry is agent-queryable by design.

**No cross-origin callable surface.** Modal functions require Modal SDK or
authenticated HTTP. Spike Land tools are accessible with wildcard-CORS
configuration from any origin, any agent, any client.

---

## 4. Complementary Relationship

Modal and Spike Land are more complementary than competitive. The two platforms
address sequential stages of an AI tool's lifecycle:

**Development and heavy compute stage (Modal):** A developer uses Modal to
run a fine-tuning job, batch-process a dataset, or serve a large model that
requires GPU inference. Modal is the right tool for this stage.

**Distribution and agent execution stage (Spike Land):** The same developer
publishes their model-backed tool to Spike Land's App Store, where it becomes
discoverable and callable by AI agents. Spike Land handles the last-mile
distribution, the MCP surface, the install graph, and the revenue share.

A concrete example: a developer fine-tunes a domain-specific classification
model on Modal, wraps the inference endpoint as an MCP tool, and publishes it
to Spike Land. Modal charged for the GPU-hours. Spike Land charges a
transaction fee on agent calls and shares 70% with the developer. Neither
company needs to build what the other provides.

This complementary dynamic is common in infrastructure: AWS Lambda and Cloudflare
Workers are both "serverless" but serve different latency profiles and developer
use cases. Modal and Spike Land are both "serverless" but serve different compute
profiles and distribution requirements.

---

## 5. Architecture Difference

The architectural divergence between Modal and Spike Land reflects fundamentally
different bets about where AI workloads will run.

Modal's bet: AI workloads require substantial compute, and the best place to
run that compute is in centralized, GPU-equipped data centers with fast
interconnects to model weights and training data. This is correct for training
and batch inference.

Spike Land's bet: AI tool orchestration requires global distribution and
minimal latency, and the best place to run tool coordination logic is at the
network edge, close to end users and agent clients. This is correct for
production agent workflows where a single agent request may fan out to 5-15
tool calls across multiple providers.

| Architecture Dimension  | Modal                               | Spike Land                          |
| ----------------------- | ----------------------------------- | ----------------------------------- |
| Infrastructure model    | Centralized GPU clusters            | Distributed edge (300+ PoPs)        |
| State persistence       | Volumes (block storage)             | Durable Objects (edge-consistent)   |
| Caching                 | Container-level caching             | KV + R2 (edge-distributed)          |
| Scaling model           | Container autoscaling               | CF Workers (instant scale, no cold) |
| Latency                 | ~100ms minimum (warm container)     | Sub-10ms (edge)                     |
| Compliance / residency  | Regional VPC (limited options)      | Per-jurisdiction routing (native)   |
| Cold start              | 5-30 seconds (GPU containers)       | ~0ms (Workers, no containers)       |

---

## 6. COMPASS Angle

COMPASS — 12 engines, 28,042 LOC, 4 countries, $2.1T/yr market — represents
the class of application that illustrates where Spike Land's architecture is
irreplaceable.

COMPASS does not need GPU compute. Its core value is:
- Global edge distribution with sub-10ms response times for 50+ languages
- Offline capability for users in low-connectivity regions
- Jurisdiction-aware compliance routing across 4 national regulatory regimes
- Persistent per-user and per-institution state in Durable Objects
- 12 discrete engines callable as composable MCP tools by external agents
- Institutional billing with per-tenant isolation

Modal can run a Python function on a GPU. It cannot:

- Cache jurisdiction-specific compliance data at the edge with KV for
  sub-millisecond access in 4 countries simultaneously
- Provide offline-capable execution for mobile users in regions with
  intermittent connectivity
- Expose 12 engines as discrete MCP tools with a single install-graph
  dependency model
- Manage per-tenant Durable Object instances with consistent state across
  a globally distributed edge network

COMPASS running on Modal would require significant custom infrastructure to
replicate what Spike Land's edge-native architecture provides natively. This
is not a criticism of Modal — it was not built for this use case.

---

## 7. Summary Table

| Dimension               | Modal                                | Spike Land                               |
| ----------------------- | ------------------------------------ | ---------------------------------------- |
| Primary product         | Serverless GPU compute               | Edge MCP runtime + App Store             |
| Core use case           | Model inference, training, batch jobs| Tool publishing, discovery, execution    |
| Target developer        | ML engineers, Python developers      | App developers, agent builders           |
| Infrastructure          | Centralized GPU clusters (AWS)       | Cloudflare Workers (edge-native)         |
| Latency profile         | 100ms - 30s                          | Sub-10ms                                 |
| MCP support             | No                                   | Native (80+ tools)                       |
| Offline capability      | No                                   | Yes                                      |
| Marketplace             | No                                   | Yes (70/30 revenue share)                |
| Tool discovery          | No                                   | Yes (agent-queryable registry)           |
| Language                | Python                               | TypeScript / any via MCP                 |
| State model             | Stateless + volumes                  | Durable Objects (edge-persistent)        |
| Competitive relationship| Complementary                        | Complementary                            |
| Positioning             | "Cloud functions for ML"             | "App Store for the agent internet"       |
| Company                 | Modal Labs Inc., San Francisco       | SPIKE LAND LTD, UK #16906682             |
| Founded                 | 2022                                 | December 2025                            |

---

## Key Takeaway

Modal and Spike Land are not competitors — they are complementary infrastructure
layers addressing different stages of the AI tool lifecycle. Modal provides the
heavy compute needed to build and serve ML models; Spike Land provides the
edge-native distribution and agent-callable runtime needed to deploy those models
as production tools. The architectural difference — centralized GPU clusters
versus globally distributed edge Workers — reflects two correct bets about
different workload profiles rather than a zero-sum competition. For applications
like COMPASS, which require edge latency, offline capability, and jurisdictional
compliance rather than GPU throughput, Spike Land's architecture is the correct
choice where Modal's is not applicable.
