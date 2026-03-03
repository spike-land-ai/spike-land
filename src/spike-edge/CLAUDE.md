# CLAUDE.md

## Overview

Primary edge API service for the spike-land-ai platform. Cloudflare Workers
runtime using Hono framework. Handles CORS, security headers, rate limiting (via
Durable Objects), R2 object storage, third-party API proxying, live updates,
analytics, and SPA asset serving.

## Commands

```bash
npm run dev           # Local wrangler dev server
npm run dev:remote    # Remote wrangler dev (uses production bindings)
npm run deploy        # Deploy to Cloudflare Workers (minified)
npm run typecheck     # tsc --noEmit
npm run lint          # ESLint
npm test              # Run tests (Vitest)
npm run test:coverage # Tests with coverage
```

## Architecture

```
├── index.ts          # App entrypoint — mounts middleware and routes
├── env.ts            # Env bindings interface (R2, LIMITERS, secrets)
├── rate-limiter.ts   # RateLimiter Durable Object class
├── middleware/
│   └── auth.ts       # Session auth via AUTH_MCP service binding
├── routes/
│   ├── health.ts     # GET /health — R2 connectivity check
│   ├── r2.ts         # GET/POST/DELETE /r2/:key — R2 object storage
│   ├── proxy.ts      # POST /proxy/stripe|ai|github — authenticated proxy
│   ├── live.ts       # Live update endpoints
│   ├── analytics.ts  # Analytics ingestion
│   └── spa.ts        # SPA asset serving from SPA_ASSETS R2 bucket (catch-all)
└── __tests__/        # Vitest tests
```

**Route mounting order matters**: specific routes are mounted before the SPA
catch-all in `index.ts`.

## Cloudflare Bindings (wrangler.toml)

| Binding      | Type                   | Purpose                                           |
| ------------ | ---------------------- | ------------------------------------------------- |
| `R2`         | R2Bucket               | `spike-platform` — general platform assets        |
| `SPA_ASSETS` | R2Bucket               | `spike-app-assets` — SPA frontend build artifacts |
| `LIMITERS`   | DurableObjectNamespace | `RateLimiter` class for per-IP rate limiting      |

**Durable Object migration tag**: `v1` (class `RateLimiter`).

## Environment Variables

Declared in `env.ts`:

| Variable            | Purpose                                                              |
| ------------------- | -------------------------------------------------------------------- |
| `STRIPE_SECRET_KEY` | Stripe API auth for `/proxy/stripe`                                  |
| `GEMINI_API_KEY`    | Google Gemini API auth for `/proxy/ai`                               |
| `CLAUDE_OAUTH_TOKEN`| Anthropic Claude auth for `/proxy/ai` (x-api-key header)            |
| `GITHUB_TOKEN`      | GitHub API auth for `/proxy/github`                                  |
| `ALLOWED_ORIGINS`   | Comma-separated CORS allowed origins (default: `https://spike.land`) |

## Middleware (global, applied to all routes)

1. **CORS** — dynamic allowed origins from `ALLOWED_ORIGINS` env var
2. **Security headers** — CSP, HSTS, X-Content-Type-Options, X-Frame-Options,
   Referrer-Policy
3. **Auth** — session validation via AUTH_MCP on `/proxy/*` and R2 mutations
4. **Error handler** — logs to console, returns
   `{ error: "Internal Server Error" }` with 500

## Rate Limiter

`RateLimiter` is a Durable Object that enforces per-session limits:

- Grace limit: 4 POST requests within 20-second window before throttling
- After grace limit: returns cooldown duration (0.5s), caller must back off
- Reset: after 20 seconds of inactivity, request count resets

## API Proxy Routes

All proxy routes validate the request body has a `url` field (string,
non-empty):

- `POST /proxy/stripe` — proxies to `https://api.stripe.com/*` only; injects
  `STRIPE_SECRET_KEY`. Requires auth.
- `POST /proxy/ai` — proxies to Anthropic and Google Gemini APIs; selects
  correct key per provider. Requires auth.
- `POST /proxy/github` — proxies to `https://api.github.com/*` only; injects
  `GITHUB_TOKEN` with GitHub headers. Requires auth.

All proxy routes sanitize caller-provided headers against an explicit allowlist
(Content-Type, Accept, Accept-Language, X-Request-Id only).

## Code Quality Rules

- TypeScript strict mode — never use `any`, use `unknown` or proper types
- Never add `eslint-disable` or `@ts-ignore` comments
- All route handlers must return typed Hono responses
- Proxy routes must validate URLs against allowlists before forwarding
- Vitest for all tests (`__tests__/` directory)

## CI/CD

- Shared workflow: `.github/.github/workflows/ci-publish.yml`
- Private package (`"private": true`) — not published to GitHub Packages
- Deploy via `npm run deploy` (wrangler deploy --minify)
- Compatibility date: `2025-01-01`, flags: `nodejs_compat`
