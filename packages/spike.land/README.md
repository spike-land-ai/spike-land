# spike.land — Managed Deployment Platform with MCP Registry

Vibe code full-stack apps and deploy them to spike.land. **Spike** is your
personalized AI assistant with 455+ MCP tools — and it can write its own. Access
it from the CLI, web chat, or (soon) WhatsApp and Telegram.

[![CI/CD Pipeline](https://github.com/spike-land-ai/spike.land/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/spike-land-ai/spike.land/actions/workflows/ci-cd.yml)

## What is spike.land?

**A deployment platform where AI builds and ships your apps.**

- **Deploy & Build** — Describe what you want. Spike writes the code, runs the
  tests, and deploys it. Full-stack TypeScript, zero config.
- **MCP Registry** — 455+ tools organized by category. Connect any
  MCP-compatible client. Progressive disclosure means you see what you need,
  when you need it.
- **Spike AI** — A personalized assistant that remembers your preferences, knows
  your codebase, and writes new tools when existing ones don't cut it.
- **Extensible** — Use the built-in tool catalog or create your own. Every tool
  you build is instantly available across all channels.
- **Multi-channel** — CLI (`spike`), web chat, WhatsApp and Telegram coming
  soon.

## Connect

| Platform  | Link                                                                    |
| --------- | ----------------------------------------------------------------------- |
| Website   | [spike.land](https://spike.land)                                        |
| X/Twitter | [@spike_land](https://x.com/spike_land)                                 |
| LinkedIn  | [SPIKE LAND LTD](https://linkedin.com/company/spike-land)               |
| Discord   | [Join Server](https://discord.gg/spike-land)                            |
| GitHub    | [spike-land-ai/spike.land](https://github.com/spike-land-ai/spike.land) |

## spike-cli

The command-line interface for spike.land. Same 455+ MCP tools, accessible from
your terminal.

```bash
npx @spike-land-ai/spike-cli
```

- Interactive chat REPL with Claude integration
- Aggregates multiple MCP servers into one unified interface
- Auth, config, shell completions built in
- Pipe tools together for automation workflows

## App Store

17 first-party apps across 6 categories — creative, productivity, developer,
communication, lifestyle, and AI agents. Browse at
[spike.land/store](https://spike.land/store).

Highlights: Chess Arena (multiplayer with ELO), QA Studio (browser automation +
a11y audits), State Machine Engine (statechart lifecycle management), CodeSpace
(live React editor).

## Monorepo Structure

| Package                                             | Description                             |
| --------------------------------------------------- | --------------------------------------- |
| **Web App** (`src/`)                                | Next.js 16 application                  |
| **spike-cli** (`packages/spike-cli/`)               | MCP multiplexer CLI                     |
| **Code Editor** (`packages/code/`)                  | React code editor (Vite + Monaco)       |
| **Backend Worker** (`packages/testing.spike.land/`) | Cloudflare Worker backend               |
| **Transpiler** (`packages/js.spike.land/`)          | Cloudflare Worker transpilation service |
| **Shared** (`packages/shared/`)                     | Shared types, constants, and utilities  |

## Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript (strict)
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js v5 (GitHub, Google, Facebook, Apple)
- **Payments**: Stripe
- **Cache**: Redis (Upstash)
- **Workers**: Cloudflare Workers + Durable Objects
- **Testing**: Vitest (enforced CI coverage thresholds) + Playwright + Cucumber
- **CI/CD**: GitHub Actions + AWS ECS + Depot

## Quick Start

### Prerequisites

- Node.js 24+
- Yarn 4 (corepack enabled)

### Setup

```bash
git clone https://github.com/spike-land-ai/spike.land.git
cd spike.land

# Automated setup (recommended)
./scripts/setup.sh

# Or manual
corepack enable
yarn
cp .env.example .env.local
yarn dev
```

Open [http://localhost:3000](http://localhost:3000).

### Authentication

Uses NextAuth.js v5 with GitHub, Google, Facebook, and Apple OAuth. See
[docs/guides/SECRETS_SETUP.md](./docs/guides/SECRETS_SETUP.md) for setup.

```bash
# Generate AUTH_SECRET
openssl rand -base64 32
```

## Development

```bash
yarn dev              # Start dev server (http://localhost:3000)
yarn build            # Build for production
yarn lint             # Run ESLint
yarn test:coverage    # Unit tests with enforced CI coverage thresholds
yarn depot:ci         # Run CI remotely via Depot (preferred)
```

### spike-cli

```bash
cd packages/spike-cli && yarn dev    # Start in dev mode
yarn spike                           # Run the CLI
```

### Testing

```bash
yarn test             # Watch mode
yarn test:run         # Run once
yarn test:coverage    # Coverage (MCP business logic: 80/80/75/80 thresholds)
```

## CI/CD Pipeline

1. **Test** — Linting + unit tests with coverage thresholds
2. **Build** — Next.js production build
3. **Deploy** — AWS preview deployment
4. **E2E** — Playwright/Cucumber against preview

All checks must pass before merge. Branch protection enforced.

## Contributing

1. Fork the repo
2. Create a feature branch
3. Write code and tests (CI coverage thresholds required)
4. `yarn test:coverage && yarn build`
5. Open a Pull Request
6. Wait for all CI checks to pass

## Documentation

- [Feature Documentation](./docs/features/FEATURES.md)
- [Secrets Setup](./docs/guides/SECRETS_SETUP.md)
- [API Reference](./docs/architecture/API_REFERENCE.md)
- [Database Schema](./docs/architecture/DATABASE_SCHEMA.md)
- [Roadmap](./docs/ROADMAP.md)

## Links

- **Website**: https://spike.land
- **Repository**: https://github.com/spike-land-ai/spike.land
- **Issues**: https://github.com/spike-land-ai/spike.land/issues

---

**SPIKE LAND LTD** (UK Company #16906682) — Built with Next.js 16, TypeScript,
and 455+ MCP tools.
