interface ServiceCheck {
  name: string;
  url: string;
  status: "up" | "degraded" | "down";
  responseTime: number;
  error?: string;
}

const SERVICES = [
  { name: "Main Site", url: "https://spike.land" },
  { name: "Edge API", url: "https://edge.spike.land/health" },
  { name: "Transpile", url: "https://js.spike.land" },
  { name: "ESM CDN", url: "https://esm.spike.land/health" },
  { name: "MCP Registry", url: "https://mcp.spike.land" },
  { name: "Auth MCP", url: "https://auth-mcp.spike.land" },
];

const TIMEOUT_MS = 3000;
const DEGRADED_MS = 2000;

async function checkService(service: { name: string; url: string }): Promise<ServiceCheck> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const start = Date.now();

  try {
    const res = await fetch(service.url, {
      signal: controller.signal,
      headers: { "User-Agent": "spike-status/1.0" },
    });
    const responseTime = Date.now() - start;

    if (!res.ok) {
      return { ...service, status: "down", responseTime, error: `HTTP ${res.status}` };
    }
    return {
      ...service,
      status: responseTime > DEGRADED_MS ? "degraded" : "up",
      responseTime,
    };
  } catch (err) {
    return {
      ...service,
      status: "down",
      responseTime: Date.now() - start,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function checkAll(): Promise<ServiceCheck[]> {
  const results = await Promise.allSettled(SERVICES.map(checkService));
  return results.map((r, i) =>
    r.status === "fulfilled"
      ? r.value
      : { ...SERVICES[i], status: "down" as const, responseTime: TIMEOUT_MS, error: "Check failed" }
  );
}

function overallStatus(checks: ServiceCheck[]): "ok" | "degraded" | "down" {
  const downCount = checks.filter((c) => c.status === "down").length;
  if (downCount === checks.length) return "down";
  if (downCount > 0 || checks.some((c) => c.status === "degraded")) return "degraded";
  return "ok";
}

function getCorsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Max-Age": "86400",
  };
}

function renderHTML(checks: ServiceCheck[], overall: "ok" | "degraded" | "down"): string {
  const bannerText = {
    ok: "All Systems Operational",
    degraded: "Partial Outage",
    down: "Major Outage",
  }[overall];

  const bannerColor = { ok: "#22c55e", degraded: "#eab308", down: "#ef4444" }[overall];
  const dotColor = { up: "#22c55e", degraded: "#eab308", down: "#ef4444" };

  const rows = checks
    .map(
      (c) => `
      <div class="service">
        <div class="service-info">
          <span class="dot" style="background:${dotColor[c.status]}"></span>
          <span class="name">${c.name}</span>
        </div>
        <div class="service-meta">
          <span class="time">${c.responseTime}ms</span>
          <span class="badge ${c.status}">${c.status}</span>
        </div>
      </div>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="refresh" content="30">
  <title>spike.land Status</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root { --bg: #0a0a0a; --surface: #141414; --border: #262626; --text: #e5e5e5; --muted: #a3a3a3; }
    @media (prefers-color-scheme: light) {
      :root { --bg: #fafafa; --surface: #fff; --border: #e5e5e5; --text: #171717; --muted: #737373; }
    }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; padding: 2rem 1rem; }
    .container { max-width: 640px; margin: 0 auto; }
    h1 { font-size: 1.5rem; font-weight: 600; margin-bottom: 1.5rem; }
    .banner { padding: 1rem 1.25rem; border-radius: 8px; margin-bottom: 1.5rem; font-weight: 600; font-size: 1rem; color: #fff; background: ${bannerColor}; }
    .services { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
    .service { display: flex; justify-content: space-between; align-items: center; padding: 0.875rem 1.25rem; border-bottom: 1px solid var(--border); }
    .service:last-child { border-bottom: none; }
    .service-info { display: flex; align-items: center; gap: 0.75rem; }
    .service-meta { display: flex; align-items: center; gap: 0.75rem; }
    .dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .name { font-weight: 500; }
    .time { color: var(--muted); font-size: 0.875rem; font-variant-numeric: tabular-nums; }
    .badge { font-size: 0.75rem; font-weight: 600; padding: 2px 8px; border-radius: 9999px; text-transform: uppercase; }
    .badge.up { background: #052e16; color: #4ade80; }
    .badge.degraded { background: #422006; color: #facc15; }
    .badge.down { background: #450a0a; color: #f87171; }
    @media (prefers-color-scheme: light) {
      .badge.up { background: #dcfce7; color: #15803d; }
      .badge.degraded { background: #fef9c3; color: #a16207; }
      .badge.down { background: #fee2e2; color: #b91c1c; }
    }
    .footer { text-align: center; margin-top: 2rem; color: var(--muted); font-size: 0.8rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>spike.land Status</h1>
    <div class="banner">${bannerText}</div>
    <div class="services">${rows}</div>
    <div class="footer">Auto-refreshes every 30 seconds &middot; Checked at ${new Date().toISOString()}</div>
  </div>
</body>
</html>`;
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const cors = getCorsHeaders();

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    if (url.pathname === "/health") {
      const checks = await checkAll();
      const overall = overallStatus(checks);
      return Response.json({ status: overall, timestamp: new Date().toISOString() }, {
        headers: { "Cache-Control": "no-cache", ...cors },
      });
    }

    if (url.pathname === "/api/status") {
      const checks = await checkAll();
      const overall = overallStatus(checks);
      return Response.json({ status: overall, services: checks, timestamp: new Date().toISOString() }, {
        headers: { "Cache-Control": "no-cache", ...cors },
      });
    }

    if (url.pathname === "/" || url.pathname === "") {
      const checks = await checkAll();
      const overall = overallStatus(checks);
      return new Response(renderHTML(checks, overall), {
        headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache", ...cors },
      });
    }

    return Response.json({ error: "Not found" }, { status: 404, headers: cors });
  },
};
