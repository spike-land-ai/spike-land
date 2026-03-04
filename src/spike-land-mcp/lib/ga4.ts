const GA4_COLLECT_URL = "https://www.google-analytics.com/mp/collect";
const MAX_EVENTS_PER_BATCH = 25;
const MAX_STRING_PARAM_LENGTH = 500;

export interface GA4Event {
  name: string;
  params: Record<string, string | number | boolean>;
}

interface GA4Env {
  GA_MEASUREMENT_ID: string;
  GA_API_SECRET: string;
}

/** Hash a string into an anonymous client ID using Web Crypto SHA-256. */
export async function hashClientId(str: string): Promise<string> {
  const data = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(hash);
  let hex = "";
  for (const b of bytes) {
    hex += b.toString(16).padStart(2, "0");
  }
  return hex;
}

function truncateStringParams(
  params: Record<string, string | number | boolean>,
): Record<string, string | number | boolean> {
  const result: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(params)) {
    const truncatedKey = key.slice(0, 40);
    result[truncatedKey] = typeof value === "string"
      ? value.slice(0, MAX_STRING_PARAM_LENGTH)
      : value;
  }
  return result;
}

/** Send events to GA4 via the Measurement Protocol v2. Silently skips if credentials are missing. */
export async function sendGA4Events(
  env: Pick<GA4Env, "GA_MEASUREMENT_ID" | "GA_API_SECRET">,
  clientId: string,
  events: GA4Event[],
): Promise<void> {
  if (!env.GA_MEASUREMENT_ID || !env.GA_API_SECRET) {
    return;
  }

  const url = `${GA4_COLLECT_URL}?measurement_id=${encodeURIComponent(env.GA_MEASUREMENT_ID)}&api_secret=${encodeURIComponent(env.GA_API_SECRET)}`;

  for (let i = 0; i < events.length; i += MAX_EVENTS_PER_BATCH) {
    const batch = events.slice(i, i + MAX_EVENTS_PER_BATCH).map((event) => ({
      name: event.name.slice(0, 40),
      params: truncateStringParams(event.params),
    }));

    const body = JSON.stringify({
      client_id: clientId,
      events: batch,
    });

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    if (!response.ok) {
      console.error(`[ga4] send failed: ${response.status} ${response.statusText}`);
    }
  }
}
