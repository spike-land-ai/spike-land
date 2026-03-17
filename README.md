<p align="center">
  <a href="https://spike.land">
    <img src="https://raw.githubusercontent.com/spike-land-ai/.github/main/assets/hero-banner.svg" alt="spike.land — Open AI App Store" width="100%" />
  </a>
</p>

<h3 align="center">The open AI app store built on MCP — every app is a bundle of composable tools.</h3>

<p align="center">
  <strong>80+ hosted MCP tools</strong> · Edge-native on Cloudflare Workers · From-scratch React Fiber runtime<br/>
  <em>1,200+ clones in 2 weeks · 28 packages · TypeScript strict everywhere</em>
</p>

---

## Quick Start

```bash
git clone https://github.com/spike-land-ai/spike.land
cd spike.land && npm install
cd src/spike-app && npm run dev
```

## Architecture

<p align="center">
  <img src="https://raw.githubusercontent.com/spike-land-ai/.github/main/assets/architecture.svg" alt="Architecture Diagram" width="100%" />
</p>

## Packages

| Package | Description |
|---------|-------------|
| [spike-app](./src/spike-app) | Frontend SPA — Vite + TanStack Router + React |
| [spike-edge](./src/spike-edge) | Primary edge API — Hono on Cloudflare Workers |
| [spike-land-mcp](./src/spike-land-mcp) | MCP registry — 80+ tools, D1-backed |
| [mcp-auth](./src/mcp-auth) | Auth service — Better Auth + Drizzle |
| [mcp-server-base](./src/mcp-server-base) | Shared MCP server utilities |
| [code](./src/code) | Monaco-based collaborative code editor |
| [spike-land-backend](./src/spike-land-backend) | Durable Objects for real-time sync |
| [transpile](./src/transpile) | Edge transpilation via esbuild-wasm |
| [react-ts-worker](./src/react-ts-worker) | From-scratch React with Fiber reconciler |
| [esbuild-wasm](./src/esbuild-wasm) | Cross-platform esbuild WASM binary |
| [esbuild-wasm-mcp](./src/esbuild-wasm-mcp) | MCP server for esbuild lifecycle |
| [shared](./src/shared) | Shared types, Zod validations, constants |
| [spike-cli](./src/spike-cli) | MCP multiplexer CLI with Claude chat |
| [mcp-image-studio](./src/mcp-image-studio) | AI image generation & enhancement (42 tools) |
| [spike-review](./src/spike-review) | AI code review with quality gates |
| [hackernews-mcp](./src/hackernews-mcp) | HackerNews MCP integration |
| [openclaw-mcp](./src/openclaw-mcp) | OpenClaw gateway bridge |
| [vibe-dev](./src/vibe-dev) | Docker-based dev workflow tool |
| [chess-engine](./src/chess-engine) | Chess ELO engine with game/challenge managers |
| [qa-studio](./src/qa-studio) | Browser automation (Playwright) |
| [state-machine](./src/state-machine) | Statechart engine with guard parser |
| [video](./src/video) | Programmatic video via Remotion |

## MCP Ecosystem

<p align="center">
  <img src="https://raw.githubusercontent.com/spike-land-ai/.github/main/assets/mcp-ecosystem.svg" alt="MCP Tool Ecosystem" width="680" />
</p>

Every store app is a bundle of composable MCP tools, discovery metadata, and install/recommendation flows. The platform embraces the [Model Context Protocol](https://modelcontextprotocol.io) as its primary integration interface.

## Development

```bash
npm run build         # Compile TypeScript
npm test              # Run Vitest tests
npm run typecheck     # tsc --noEmit
```

For Cloudflare Workers packages: `npm run dev` (local wrangler) or `npm run w:deploy:prod` (production).

## Contributing

- TypeScript strict mode — use `unknown` instead of `any`
- Vitest for tests, 80%+ coverage enforced in CI
- Never use `eslint-disable`, `@ts-ignore`, or `@ts-nocheck`
- Version via [Changesets](https://github.com/changesets/changesets)
- MCP servers follow: SDK + Zod schema + tool handler pattern

## Links

- [Documentation](./docs/README.md) · [Blog](./content/blog/) · [Pricing](https://spike.land/pricing)

## License

MIT
