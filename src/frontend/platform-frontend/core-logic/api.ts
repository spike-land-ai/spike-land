const isDev = import.meta.env.DEV;

export const API_BASE = isDev ? "" : "https://api.spike.land";
export const MCP_BASE = isDev ? "" : "https://mcp.spike.land";
export const CHAT_BASE = isDev ? "" : "https://chat.spike.land";

export function apiUrl(path: string): string {
  return `${API_BASE}/api${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Fetch wrapper for authenticated API calls.
 * Always sends credentials (cookies) so cross-origin requests to api.spike.land work.
 */
export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(apiUrl(path), { credentials: "include", ...init });
}

/**
 * Build a URL for the MCP service.
 *
 * Dev mode proxies through spike-edge (vite proxy → spike.land):
 *   /mcp/tools → spike.land/mcp/tools → mcp.spike.land/tools
 *   /mcp       → spike.land/mcp       → mcp.spike.land/mcp
 *
 * Prod mode talks directly to mcp.spike.land:
 *   https://mcp.spike.land/tools
 *   https://mcp.spike.land/mcp
 */
export function mcpUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (isDev) {
    // /mcp is the streamable HTTP endpoint — don't double-prefix
    if (normalized === "/mcp") return "/mcp";
    return `/mcp${normalized}`;
  }
  return `${MCP_BASE}${normalized}`;
}

/** Build a URL for the spike-chat service. */
export function chatUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (isDev) return `/chat${normalized}`;
  return `${CHAT_BASE}${normalized}`;
}

/** Build a WebSocket URL for the spike-chat service. */
export function chatWsUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (isDev) {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${window.location.host}/chat${normalized}`;
  }
  return `wss://chat.spike.land${normalized}`;
}
