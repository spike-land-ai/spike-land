/**
 * Checks if an origin is allowed and returns it, or returns a default.
 */
export function getAllowOrigin(request: Request): string {
  const origin = request.headers.get("Origin");
  if (!origin) return "https://spike.land";

  if (
    origin === "https://spike.land" ||
    origin.endsWith(".spike.land") ||
    origin.startsWith("http://localhost:")
  ) {
    return origin;
  }
  return "https://spike.land";
}

// CORS headers for API proxies
export const API_CORS_HEADERS = {
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
} as const;

/**
 * Default CORS headers for responses
 */
export const DEFAULT_CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "https://spike.land",
  "Content-Type": "application/json; charset=UTF-8",
};

/**
 * Preflight CORS headers for OPTIONS requests
 */
export const PREFLIGHT_CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "https://spike.land",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/**
 * Creates a CORS preflight response for API proxies (OPTIONS requests)
 */
export function createCorsPreflightResponse(request: Request): Response {
  return new Response(null, {
    headers: {
      ...API_CORS_HEADERS,
      "Access-Control-Allow-Origin": getAllowOrigin(request),
    },
  });
}

/**
 * Adds CORS headers to an existing Response
 */
export function addCorsHeadersToResponse(response: Response, request: Request): Response {
  const responseHeaders = new Headers(response.headers);
  responseHeaders.set("Access-Control-Allow-Origin", getAllowOrigin(request));

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

/**
 * Creates a JSON error response with CORS headers
 */
export function createCorsErrorResponse(
  error: string,
  details: string,
  request: Request,
  status = 500,
): Response {
  return new Response(
    JSON.stringify({
      error,
      details,
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": getAllowOrigin(request),
      },
    },
  );
}

export function isChunk(link: string) {
  const chunkRegExp = /[.]{1}[a-f0-9]{10}[.]+/gm;
  return link.indexOf("chunk-") !== -1 || chunkRegExp.test(link);
}

export function isUrlFile(pathname: string): boolean {
  const url = new URL(`/${pathname}`, "https://example.com").pathname.slice(1);
  const parts = url.split("/");
  const lastSegment = parts.pop() || parts.pop(); // handle potential trailing slash
  if (!lastSegment || !lastSegment.includes(".")) {
    return false;
  }
  return true;
}

export function handleCORS(request: Request) {
  const headers = request.headers;
  if (
    headers.get("Origin") !== null &&
    headers.get("Access-Control-Request-Method") !== null &&
    headers.get("Access-Control-Request-Headers") !== null
  ) {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": getAllowOrigin(request),
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } else {
    return new Response(null, {
      headers: {
        Allow: "POST, OPTIONS",
      },
    });
  }
}

export function handleUnauthorizedRequest(): Response {
  return new Response(null, { status: 401, statusText: "no robots" });
}

export function handleRedirectResponse(url: URL, start: string): Response {
  return new Response(
    `<meta http-equiv="refresh" content="0; URL=${url.origin}/live/${start}" />`,
    {
      status: 307,
      headers: {
        Location: `${url.origin}/live/${start}`,
        "Content-Type": "text/html;charset=UTF-8",
        "Cache-Control": "no-cache",
        "Content-Encoding": "gzip",
      },
    },
  );
}

export async function readRequestBody(request: Request): Promise<unknown> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return request.json();
  } else if (contentType.includes("application/text") || contentType.includes("text/html")) {
    return request.text();
  } else if (contentType.includes("multipart/form-data") || contentType.includes("form")) {
    const formData = await request.formData();
    const body: Record<string, unknown> = {};
    formData.forEach((value, key) => {
      body[key] = value;
    });
    return body;
  } else {
    return "a file";
  }
}
