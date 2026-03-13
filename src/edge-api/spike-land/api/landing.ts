import { Hono } from "hono";
import type { Context, Next } from "hono";
import type { Env } from "../core-logic/env";

export const landingRoute = new Hono<{ Bindings: Env }>();

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="spike.land MCP Registry — 80+ AI tools over the Model Context Protocol. Connect any MCP-compatible client to web search, databases, code execution, and more.">
  <meta name="robots" content="index, follow">
  <meta property="og:title" content="spike.land — MCP Registry">
  <meta property="og:description" content="80+ AI tools over the Model Context Protocol. One endpoint, every tool.">
  <meta property="og:url" content="https://mcp.spike.land/">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="spike.land">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="spike.land — MCP Registry">
  <meta name="twitter:description" content="80+ AI tools over the Model Context Protocol.">
  <title>spike.land — MCP Registry</title>
  <style>
    :root {
      --bg: #0a0a0f;
      --bg-card: #12121a;
      --bg-code: #0d0d14;
      --primary: #6366f1;
      --primary-dim: rgba(99, 102, 241, 0.15);
      --border: #1e1e2e;
      --border-bright: #2e2e42;
      --text: #e4e4e7;
      --muted: #71717a;
      --green: #22c55e;
      --radius: 10px;
      --radius-sm: 6px;
    }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    a { color: var(--primary); text-decoration: none; }
    a:hover { text-decoration: underline; }

    /* ── Layout ── */
    .wrapper {
      max-width: 860px;
      margin: 0 auto;
      padding: 0 1.25rem;
      width: 100%;
    }

    /* ── Header ── */
    header {
      border-bottom: 1px solid var(--border);
      padding: 1.1rem 0;
    }

    header .wrapper {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .logo {
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--text);
      background: linear-gradient(135deg, #a5b4fc 0%, #818cf8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .badge {
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      background: var(--primary-dim);
      color: #a5b4fc;
      border: 1px solid rgba(99, 102, 241, 0.3);
      padding: 0.2rem 0.55rem;
      border-radius: 999px;
    }

    /* ── Main ── */
    main { flex: 1; padding: 3.5rem 0 4rem; }

    /* ── Hero ── */
    .hero { text-align: center; margin-bottom: 3rem; }

    .hero h1 {
      font-size: clamp(2rem, 5vw, 3rem);
      font-weight: 800;
      letter-spacing: -0.03em;
      line-height: 1.15;
      background: linear-gradient(160deg, #f4f4f5 0%, #a1a1aa 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 1rem;
    }

    .hero p {
      font-size: 1.1rem;
      color: var(--muted);
      max-width: 520px;
      margin: 0 auto;
    }

    /* ── Card ── */
    .card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.5rem;
    }

    /* ── Endpoints ── */
    .endpoints { margin-bottom: 2rem; }

    .endpoints h2 {
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 1rem;
    }

    .endpoint-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      background: var(--bg-code);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
    }

    .endpoint-row + .endpoint-row { margin-top: 0.5rem; }

    .endpoint-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--green);
      flex-shrink: 0;
      box-shadow: 0 0 6px rgba(34, 197, 94, 0.5);
    }

    .endpoint-url {
      font-family: "SF Mono", ui-monospace, "Cascadia Code", Menlo, Consolas, monospace;
      font-size: 0.875rem;
      color: var(--text);
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .endpoint-tag {
      font-size: 0.65rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      background: rgba(34, 197, 94, 0.12);
      color: var(--green);
      border: 1px solid rgba(34, 197, 94, 0.25);
      padding: 0.15rem 0.45rem;
      border-radius: 999px;
      flex-shrink: 0;
    }

    /* ── Config snippet ── */
    .config { margin-bottom: 2rem; }

    .config h2 {
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 1rem;
    }

    pre {
      background: var(--bg-code);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 1rem 1.25rem;
      overflow-x: auto;
      font-family: "SF Mono", ui-monospace, "Cascadia Code", Menlo, Consolas, monospace;
      font-size: 0.82rem;
      line-height: 1.7;
      color: #c4c4d4;
    }

    pre .key   { color: #a5b4fc; }
    pre .str   { color: #86efac; }
    pre .punct { color: var(--muted); }

    /* ── Features grid ── */
    .features { margin-bottom: 2rem; }

    .features h2 {
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 1rem;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }

    @media (max-width: 600px) {
      .features-grid { grid-template-columns: 1fr; }
    }

    .feature-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.25rem;
      transition: border-color 0.15s;
    }

    .feature-card:hover { border-color: var(--border-bright); }

    .feature-icon {
      font-size: 1.4rem;
      margin-bottom: 0.6rem;
      line-height: 1;
    }

    .feature-card h3 {
      font-size: 0.95rem;
      font-weight: 600;
      margin-bottom: 0.35rem;
      color: var(--text);
    }

    .feature-card p {
      font-size: 0.82rem;
      color: var(--muted);
      line-height: 1.5;
    }

    /* ── Links ── */
    .links { margin-bottom: 2rem; }

    .links h2 {
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 1rem;
    }

    .links-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }

    @media (max-width: 480px) {
      .links-grid { grid-template-columns: 1fr; }
    }

    .link-card {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.85rem 1rem;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      color: var(--text);
      font-size: 0.875rem;
      transition: border-color 0.15s, background 0.15s;
    }

    .link-card:hover {
      border-color: rgba(99, 102, 241, 0.4);
      background: rgba(99, 102, 241, 0.06);
      text-decoration: none;
      color: #a5b4fc;
    }

    .link-card .link-arrow {
      margin-left: auto;
      color: var(--muted);
      font-size: 0.8rem;
    }

    .link-card:hover .link-arrow { color: var(--primary); }

    .link-label {
      font-size: 0.7rem;
      color: var(--muted);
      display: block;
    }

    /* ── Footer ── */
    footer {
      border-top: 1px solid var(--border);
      padding: 1.25rem 0;
      text-align: center;
      font-size: 0.8rem;
      color: var(--muted);
    }

    footer a { color: var(--muted); }
    footer a:hover { color: var(--text); }
  </style>
</head>
<body>
  <header>
    <div class="wrapper">
      <span class="logo">spike.land</span>
      <span class="badge">MCP Registry</span>
    </div>
  </header>

  <main>
    <div class="wrapper">

      <section class="hero">
        <h1>80+ AI Tools,<br>One Protocol</h1>
        <p>The open MCP registry for spike.land. Connect any Model Context Protocol client to web search, databases, code execution, AI gateway, and more — instantly.</p>
      </section>

      <section class="endpoints" aria-labelledby="endpoints-heading">
        <h2 id="endpoints-heading">Endpoints</h2>
        <div class="card">
          <div class="endpoint-row">
            <span class="endpoint-dot" aria-hidden="true"></span>
            <code class="endpoint-url">https://spike.land/mcp</code>
            <span class="endpoint-tag">Recommended</span>
          </div>
          <div class="endpoint-row">
            <span class="endpoint-dot" aria-hidden="true"></span>
            <code class="endpoint-url">https://mcp.spike.land/mcp</code>
          </div>
        </div>
      </section>

      <section class="config" aria-labelledby="config-heading">
        <h2 id="config-heading">Claude Desktop / VS Code Config</h2>
        <pre aria-label="JSON configuration for MCP clients"><span class="punct">{</span>
  <span class="key">"mcpServers"</span><span class="punct">: {</span>
    <span class="key">"spike-land"</span><span class="punct">: {</span>
      <span class="key">"url"</span><span class="punct">:</span> <span class="str">"https://spike.land/mcp"</span>
    <span class="punct">}</span>
  <span class="punct">}</span>
<span class="punct">}</span></pre>
      </section>

      <section class="features" aria-labelledby="features-heading">
        <h2 id="features-heading">What&rsquo;s included</h2>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon" aria-hidden="true">&#x1F9F0;</div>
            <h3>80+ Tools</h3>
            <p>Web search, databases, code execution, AI gateway, image generation, and more.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon" aria-hidden="true">&#x1F510;</div>
            <h3>OAuth 2.0</h3>
            <p>Device flow authentication built-in. Bring your own API keys via BYOK vault.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon" aria-hidden="true">&#x1F517;</div>
            <h3>Open Protocol</h3>
            <p>MCP standard by Anthropic. Works with Claude, VS Code, Cursor, and any compatible client.</p>
          </div>
        </div>
      </section>

      <section class="links" aria-labelledby="links-heading">
        <h2 id="links-heading">Explore</h2>
        <div class="links-grid">
          <a class="link-card" href="/tools">
            <span>
              Browse Tools
              <span class="link-label">All 80+ available tools</span>
            </span>
            <span class="link-arrow" aria-hidden="true">&#x2192;</span>
          </a>
          <a class="link-card" href="/.well-known/oauth-authorization-server">
            <span>
              OAuth Discovery
              <span class="link-label">Authorization server metadata</span>
            </span>
            <span class="link-arrow" aria-hidden="true">&#x2192;</span>
          </a>
          <a class="link-card" href="https://spike.land/mcp" rel="noopener">
            <span>
              Full UI
              <span class="link-label">spike.land MCP dashboard</span>
            </span>
            <span class="link-arrow" aria-hidden="true">&#x2197;</span>
          </a>
          <a class="link-card" href="https://spike.land/docs/mcp" rel="noopener">
            <span>
              Documentation
              <span class="link-label">Guides, auth, tool reference</span>
            </span>
            <span class="link-arrow" aria-hidden="true">&#x2197;</span>
          </a>
        </div>
      </section>

    </div>
  </main>

  <footer>
    <div class="wrapper">
      Powered by <a href="https://spike.land" rel="noopener">spike.land</a>
    </div>
  </footer>
</body>
</html>`;

landingRoute.get("/", async (c: Context<{ Bindings: Env }>, next: Next) => {
  const accept = c.req.header("Accept") ?? "";
  if (!accept.includes("text/html")) {
    return next();
  }

  return c.html(HTML, 200, {
    "Cache-Control": "public, max-age=3600",
  });
});
