/**
 * GA4 Data API client for Workers runtime.
 * Uses OAuth2 refresh token flow (pure fetch, no Node.js deps).
 */

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

class GoogleAuthClient {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly refreshToken: string;
  private accessToken: string | null = null;
  private expiresAt = 0;

  constructor(config: { clientId: string; clientSecret: string; refreshToken: string }) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.refreshToken = config.refreshToken;
  }

  async getAccessToken(): Promise<string> {
    const bufferMs = 5 * 60 * 1000;
    if (this.accessToken && Date.now() < this.expiresAt - bufferMs) {
      return this.accessToken;
    }

    const body = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: this.refreshToken,
      grant_type: "refresh_token",
    });

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OAuth2 token refresh failed (${res.status}): ${text}`);
    }

    const data = (await res.json()) as TokenResponse;
    this.accessToken = data.access_token;
    this.expiresAt = Date.now() + data.expires_in * 1000;
    return this.accessToken;
  }
}

// Module-level singleton (cached per isolate)
let authClient: GoogleAuthClient | null = null;

function getAuthClient(env: {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REFRESH_TOKEN: string;
}): GoogleAuthClient {
  if (!authClient) {
    authClient = new GoogleAuthClient({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      refreshToken: env.GOOGLE_REFRESH_TOKEN,
    });
  }
  return authClient;
}

const GA4_BASE = "https://analyticsdata.googleapis.com/v1beta";

export interface GA4Dimension {
  name: string;
}

export interface GA4Metric {
  name: string;
}

export interface GA4DateRange {
  startDate: string;
  endDate: string;
}

export interface GA4ReportRequest {
  dimensions?: GA4Dimension[];
  metrics: GA4Metric[];
  dateRanges: GA4DateRange[];
  limit?: number;
  orderBys?: Array<{
    metric?: { metricName: string };
    dimension?: { dimensionName: string };
    desc?: boolean;
  }>;
}

export interface GA4Row {
  dimensionValues?: Array<{ value: string }>;
  metricValues?: Array<{ value: string }>;
}

export interface GA4ReportResponse {
  rows?: GA4Row[];
  rowCount?: number;
  metadata?: unknown;
  dimensionHeaders?: Array<{ name: string }>;
  metricHeaders?: Array<{ name: string; type: string }>;
}

export interface GA4RealtimeResponse {
  rows?: GA4Row[];
  rowCount?: number;
  dimensionHeaders?: Array<{ name: string }>;
  metricHeaders?: Array<{ name: string; type: string }>;
}

export async function runGA4Report(
  env: {
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    GOOGLE_REFRESH_TOKEN: string;
    GA_PROPERTY_ID: string;
  },
  request: GA4ReportRequest,
): Promise<GA4ReportResponse> {
  const client = getAuthClient(env);
  const token = await client.getAccessToken();

  const res = await fetch(`${GA4_BASE}/properties/${env.GA_PROPERTY_ID}:runReport`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GA4 runReport failed (${res.status}): ${text}`);
  }

  return (await res.json()) as GA4ReportResponse;
}

export async function batchRunGA4Reports(
  env: {
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    GOOGLE_REFRESH_TOKEN: string;
    GA_PROPERTY_ID: string;
  },
  requests: GA4ReportRequest[],
): Promise<GA4ReportResponse[]> {
  const client = getAuthClient(env);
  const token = await client.getAccessToken();

  const res = await fetch(`${GA4_BASE}/properties/${env.GA_PROPERTY_ID}:batchRunReports`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ requests }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GA4 batchRunReports failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { reports: GA4ReportResponse[] };
  return data.reports;
}

export async function runGA4RealtimeReport(
  env: {
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    GOOGLE_REFRESH_TOKEN: string;
    GA_PROPERTY_ID: string;
  },
  request: {
    dimensions?: GA4Dimension[];
    metrics: GA4Metric[];
    limit?: number;
  },
): Promise<GA4RealtimeResponse> {
  const client = getAuthClient(env);
  const token = await client.getAccessToken();

  const res = await fetch(`${GA4_BASE}/properties/${env.GA_PROPERTY_ID}:runRealtimeReport`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GA4 runRealtimeReport failed (${res.status}): ${text}`);
  }

  return (await res.json()) as GA4RealtimeResponse;
}
