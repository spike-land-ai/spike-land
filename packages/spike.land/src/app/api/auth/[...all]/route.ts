import { NextRequest } from "next/server";

const AUTH_PREFIX = "/api/auth/";

function buildProxyHeaders(incoming: Headers): Headers {
  const headers = new Headers(incoming);
  headers.delete("host");
  return headers;
}

async function proxyToAuth(request: NextRequest, init: RequestInit): Promise<Response> {
  const authUrl = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:8787";
  const url = new URL(request.url);

  // Normalize the path and validate it starts with the expected prefix
  const normalized = new URL(url.pathname, "http://n").pathname;
  if (!normalized.startsWith(AUTH_PREFIX)) {
    return new Response("Bad Request", { status: 400 });
  }

  const targetUrl = new URL(normalized + url.search, authUrl);
  try {
    return await fetch(targetUrl, init);
  } catch {
    return new Response("Service Unavailable", { status: 503 });
  }
}

export async function GET(request: NextRequest) {
  return proxyToAuth(request, {
    method: "GET",
    headers: buildProxyHeaders(request.headers),
  });
}

export async function POST(request: NextRequest) {
  return proxyToAuth(request, {
    method: "POST",
    headers: buildProxyHeaders(request.headers),
    body: request.body,
    duplex: "half",
  } as RequestInit & { duplex: "half" });
}
