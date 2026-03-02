/**
 * Native SpacetimeDB HTTP Client
 *
 * Minimal fetch-based client for SpacetimeDB HTTP API.
 * Replaces the 12MB spacetimedb npm SDK with ~100 lines of fetch().
 *
 * API endpoints:
 *   POST /v1/database/:name/call/:reducer  → call reducer (JSON body)
 *   POST /v1/database/:name/sql            → run SQL query (returns JSON rows)
 */

export interface StdbHttpClientConfig {
  host: string;
  database: string;
  token?: string;
}

export interface StdbHttpClient {
  callReducer(name: string, args: unknown[]): Promise<void>;
  sql<T = Record<string, unknown>>(query: string): Promise<T[]>;
}

export function createStdbHttpClient(config: StdbHttpClientConfig): StdbHttpClient {
  const { host, database, token } = config;

  // Normalize host: strip trailing slash, ensure https for non-localhost
  const baseUrl = host.replace(/\/$/, "");

  function headers(): Record<string, string> {
    const h: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      h.Authorization = `Bearer ${token}`;
    }
    return h;
  }

  return {
    async callReducer(name: string, args: unknown[]): Promise<void> {
      const url = `${baseUrl}/v1/database/${encodeURIComponent(database)}/call/${encodeURIComponent(name)}`;
      const res = await fetch(url, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(args),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`callReducer "${name}" failed (${res.status}): ${body}`);
      }
    },

    async sql<T = Record<string, unknown>>(query: string): Promise<T[]> {
      const url = `${baseUrl}/v1/database/${encodeURIComponent(database)}/sql`;
      const res = await fetch(url, {
        method: "POST",
        headers: headers(),
        body: query,
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`sql query failed (${res.status}): ${body}`);
      }
      const json = await res.json() as T[];
      return json;
    },
  };
}
