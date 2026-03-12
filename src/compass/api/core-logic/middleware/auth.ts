import type { Context, Next } from "hono";
import type { ContextVariables } from "../../types.js";

// ---------------------------------------------------------------------------
// JWT payload shape
// ---------------------------------------------------------------------------

/**
 * Minimal set of standard JWT claims that this middleware requires.
 * Additional application-specific claims are allowed but not inspected here.
 *
 * References:
 *   - RFC 7519 §4.1 (registered claim names)
 *   - OWASP JWT Security Cheat Sheet
 */
interface TokenPayload {
  /** Subject — the user identifier. RFC 7519 §4.1.2 */
  sub: string;
  /** Expiration time (Unix seconds). RFC 7519 §4.1.4 — MUST be present. */
  exp: number;
  /** Issued at (Unix seconds). RFC 7519 §4.1.6 — MUST be present. */
  iat: number;
}

// ---------------------------------------------------------------------------
// AuthVerifier — injectable strategy
// ---------------------------------------------------------------------------

/**
 * Strategy interface for token verification.
 *
 * Providing your own implementation lets you swap in:
 *   - A service-binding call to the mcp-auth Better Auth instance (production)
 *   - A test double that accepts a fixed set of tokens (unit tests)
 *   - The built-in Web Crypto HS256 verifier (default, zero extra dependencies)
 *
 * OWASP A07:2021 – Identification and Authentication Failures:
 * All paths that return null MUST be indistinguishable to the caller (no
 * leaking of why verification failed in the 401 response body).
 */
export interface AuthVerifier {
  verify(token: string): Promise<TokenPayload | null>;
}

// ---------------------------------------------------------------------------
// Web Crypto HS256 verifier
// ---------------------------------------------------------------------------

/**
 * Decodes a base64url string to a Uint8Array without adding external
 * dependencies.  Available in all environments that support Web Crypto
 * (Cloudflare Workers, Node.js >= 16, modern browsers).
 */
function decodeBase64Url(input: string): Uint8Array<ArrayBuffer> {
  // Normalise base64url → base64 (RFC 4648 §5 → §4)
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  // Pad to a multiple of 4 characters
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  // Use ArrayBuffer explicitly so the type is Uint8Array<ArrayBuffer> —
  // required by @cloudflare/workers-types SubtleCrypto overloads.
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Parses a raw JSON string into a TokenPayload, returning null when any
 * required claim is absent or has the wrong type.
 *
 * Strict validation is intentional — OWASP recommends rejecting tokens
 * that omit expiry or subject claims rather than treating them as "no value".
 */
function parsePayloadClaims(raw: string): TokenPayload | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (typeof parsed !== "object" || parsed === null) return null;

  const obj = parsed as Record<string, unknown>;

  if (typeof obj["sub"] !== "string" || obj["sub"].length === 0) return null;
  if (typeof obj["exp"] !== "number") return null;
  if (typeof obj["iat"] !== "number") return null;

  return { sub: obj["sub"], exp: obj["exp"], iat: obj["iat"] };
}

/**
 * HS256 JWT verifier using the Web Crypto API (SubtleCrypto).
 *
 * Algorithm:
 *   1. Split the compact serialisation into header.payload.signature
 *   2. Import the HMAC-SHA256 key from the raw secret bytes
 *   3. Verify the signature over "header.payload" (the signing input)
 *   4. Decode and validate the payload claims (sub, exp, iat)
 *   5. Check expiration with a 30-second clock-skew allowance
 *
 * Security properties:
 *   - Uses crypto.subtle.verify (constant-time comparison — no timing attacks)
 *   - Rejects tokens with missing exp/iat (OWASP JWT Cheat Sheet §5)
 *   - Rejects tokens with alg:none or mismatched algorithm (§3)
 *   - Returns null for ALL error conditions (no information leakage)
 *
 * OWASP reference: A02:2021 – Cryptographic Failures
 */
export class HmacSha256Verifier implements AuthVerifier {
  private readonly secretBytes: Uint8Array<ArrayBuffer>;

  /**
   * @param secret  The raw HMAC-SHA256 secret.  In production this comes from
   *                a Workers secret binding (`COMPASS_JWT_SECRET`).  The value
   *                must be at least 32 bytes to meet NIST SP 800-107 guidance.
   */
  constructor(secret: string | Uint8Array<ArrayBuffer>) {
    if (typeof secret === "string") {
      // TextEncoder.encode() returns Uint8Array<ArrayBuffer> in strict CF types
      this.secretBytes = new TextEncoder().encode(secret) as Uint8Array<ArrayBuffer>;
    } else {
      this.secretBytes = secret;
    }

    // Warn (never throw) — short secrets degrade security but should not crash
    // the worker at startup.  The condition is checked at runtime so tests that
    // intentionally use short secrets still work.
    if (this.secretBytes.length < 32) {
      console.warn(
        "[compass-auth] COMPASS_JWT_SECRET is shorter than 32 bytes. " +
          "Use a cryptographically random secret of at least 256 bits in production.",
      );
    }
  }

  async verify(token: string): Promise<TokenPayload | null> {
    // 1. Structural check: must be exactly three dot-separated segments
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, sigB64] = parts as [string, string, string];

    // 2. Decode and validate the JOSE header
    let headerRaw: string;
    try {
      headerRaw = new TextDecoder().decode(decodeBase64Url(headerB64));
    } catch {
      return null;
    }

    let header: unknown;
    try {
      header = JSON.parse(headerRaw);
    } catch {
      return null;
    }

    if (typeof header !== "object" || header === null) return null;
    const { alg, typ } = header as Record<string, unknown>;

    // OWASP §3: reject "alg:none" and any algorithm other than HS256
    if (alg !== "HS256") return null;
    // typ is optional but when present must be "JWT"
    if (typ !== undefined && typ !== "JWT") return null;

    // 3. Verify the HMAC-SHA256 signature
    let sigBytes: Uint8Array<ArrayBuffer>;
    try {
      sigBytes = decodeBase64Url(sigB64);
    } catch {
      return null;
    }

    const signingInput = `${headerB64}.${payloadB64}`;
    // Cast needed: TextEncoder.encode() may return Uint8Array<ArrayBufferLike>
    // in older type definitions, but CF Workers types require ArrayBuffer.
    const signingInputBytes = new TextEncoder().encode(signingInput) as Uint8Array<ArrayBuffer>;

    let cryptoKey: CryptoKey;
    try {
      cryptoKey = await crypto.subtle.importKey(
        "raw",
        this.secretBytes,
        { name: "HMAC", hash: "SHA-256" },
        false, // not extractable
        ["verify"],
      );
    } catch {
      return null;
    }

    let signatureValid: boolean;
    try {
      // crypto.subtle.verify uses a constant-time comparison — safe against
      // timing side-channels (OWASP A02:2021).
      signatureValid = await crypto.subtle.verify(
        { name: "HMAC", hash: "SHA-256" },
        cryptoKey,
        sigBytes,
        signingInputBytes,
      );
    } catch {
      return null;
    }

    if (!signatureValid) return null;

    // 4. Decode the payload
    let payloadRaw: string;
    try {
      payloadRaw = new TextDecoder().decode(decodeBase64Url(payloadB64));
    } catch {
      return null;
    }

    const payload = parsePayloadClaims(payloadRaw);
    if (!payload) return null;

    // 5. Validate time-based claims
    // Allow 30 seconds of clock skew (recommended by RFC 7519 §4.1.4).
    const nowSec = Math.floor(Date.now() / 1000);
    const CLOCK_SKEW_SEC = 30;

    if (payload.exp < nowSec - CLOCK_SKEW_SEC) return null; // expired
    if (payload.iat > nowSec + CLOCK_SKEW_SEC) return null; // issued in the future

    return payload;
  }
}

// ---------------------------------------------------------------------------
// Auth-service verifier (Better Auth / mcp-auth)
// ---------------------------------------------------------------------------

/**
 * Delegates token verification to the mcp-auth Better Auth service by calling
 * its `/api/auth/get-session` endpoint.  Used in production when a service
 * binding or base URL is available.
 *
 * This mirrors the pattern in `src/edge-api/main/api/middleware/auth.ts`.
 *
 * When the remote call fails (network error, 503) the verifier returns null
 * rather than throwing — fail securely (OWASP A07:2021).
 */
export class AuthServiceVerifier implements AuthVerifier {
  /**
   * @param fetchSession  A function that accepts a Request and returns the
   *                      raw Response from the auth service.  This is either
   *                      a Cloudflare Workers service binding's `.fetch()`
   *                      method or the global `fetch` pointed at the auth URL.
   */
  constructor(private readonly fetchSession: (req: Request) => Promise<Response>) {}

  async verify(token: string): Promise<TokenPayload | null> {
    const req = new Request("https://auth-mcp.spike.land/api/auth/get-session", {
      headers: {
        authorization: `Bearer ${token}`,
        "X-Forwarded-Host": "compass.spike.land",
        "X-Forwarded-Proto": "https",
      },
    });

    let res: Response;
    try {
      res = await this.fetchSession(req);
    } catch {
      return null;
    }

    if (!res.ok) return null;

    let body: unknown;
    try {
      body = await res.json();
    } catch {
      return null;
    }

    if (typeof body !== "object" || body === null) return null;
    const { session, user } = body as Record<string, unknown>;
    if (!session) return null;
    if (typeof user !== "object" || user === null) return null;

    const { id } = user as Record<string, unknown>;
    if (typeof id !== "string" || id.length === 0) return null;

    // Synthesise a TokenPayload from the session data.
    // exp/iat are not meaningful here but we need a non-zero exp so the
    // middleware can remain type-consistent.
    const nowSec = Math.floor(Date.now() / 1000);
    return { sub: id, iat: nowSec, exp: nowSec + 3600 };
  }
}

// ---------------------------------------------------------------------------
// Middleware factory
// ---------------------------------------------------------------------------

/**
 * Creates a Hono auth middleware bound to the provided {@link AuthVerifier}.
 *
 * ### Production wiring (Cloudflare Worker)
 * ```ts
 * // Option A — delegate to Better Auth via service binding
 * const verifier = new AuthServiceVerifier((req) => env.AUTH_MCP.fetch(req));
 *
 * // Option B — verify HS256 JWTs locally with the shared secret
 * const verifier = new HmacSha256Verifier(env.COMPASS_JWT_SECRET);
 *
 * app.use("/api/*", createAuthMiddleware(verifier));
 * ```
 *
 * ### Test wiring
 * ```ts
 * const verifier: AuthVerifier = {
 *   verify: async (t) => t === "valid-token" ? { sub: "u1", iat: 0, exp: 9e9 } : null,
 * };
 * app.use("/api/*", createAuthMiddleware(verifier));
 * ```
 *
 * OWASP reference: A07:2021 – Identification and Authentication Failures
 */
export function createAuthMiddleware(verifier: AuthVerifier) {
  return async function authMiddleware(
    c: Context<{ Variables: ContextVariables }>,
    next: Next,
  ): Promise<Response | void> {
    const authHeader = c.req.header("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return c.json(
        {
          success: false,
          error: { code: "AUTH_REQUIRED", message: "Bearer token required" },
        },
        401,
      );
    }

    const token = authHeader.slice(7).trim();

    if (token.length === 0) {
      return c.json(
        {
          success: false,
          error: { code: "AUTH_REQUIRED", message: "Bearer token required" },
        },
        401,
      );
    }

    // Delegate all verification logic to the injected verifier.
    // Never surface internal error details to the caller (OWASP A07:2021).
    const payload = await verifier.verify(token);

    if (!payload) {
      return c.json(
        {
          success: false,
          error: { code: "AUTH_INVALID", message: "Invalid or expired token" },
        },
        401,
      );
    }

    c.set("userId", payload.sub);
    return next();
  };
}

// ---------------------------------------------------------------------------
// Default middleware export
// ---------------------------------------------------------------------------

/**
 * Default auth middleware using the `STUB_VERIFIER` — accepts any well-formed
 * JWT-shaped token (three base64url segments) where the middle segment decodes
 * to a JSON object with a non-empty `sub` claim.
 *
 * THIS IS FOR UNIT TESTS AND LOCAL DEVELOPMENT ONLY.
 *
 * In production, wire up {@link HmacSha256Verifier} or
 * {@link AuthServiceVerifier} via {@link createAuthMiddleware} in the Worker
 * entry point where env bindings are available.
 *
 * Security note: this verifier does NOT check the JWT signature or expiry.
 * Deploying it to production would allow anyone to forge tokens.
 *
 * OWASP A07:2021 – Identification and Authentication Failures
 */
const STUB_VERIFIER: AuthVerifier = {
  async verify(token: string): Promise<TokenPayload | null> {
    // Reject the sentinel "invalid" value used in tests
    if (!token || token === "invalid") return null;

    // Must have exactly three dot-separated segments (valid JWT structure)
    const parts = token.split(".");
    if (parts.length !== 3) {
      // Also accept opaque stub tokens (e.g. "stub-token-abc") used in tests
      // by treating them as a userId directly.  Strict structure is not
      // enforced here because this verifier is test-only.
      if (token.length > 0 && token !== "invalid") {
        const nowSec = Math.floor(Date.now() / 1000);
        return { sub: `user:${token.slice(0, 16)}`, iat: nowSec, exp: nowSec + 3600 };
      }
      return null;
    }

    // Attempt to decode the payload segment
    const [, payloadB64] = parts as [string, string, string];
    try {
      const raw = new TextDecoder().decode(decodeBase64Url(payloadB64));
      const parsed = parsePayloadClaims(raw);
      if (parsed) return parsed;
    } catch {
      // Fall through to opaque-token path
    }

    // Opaque token: derive a deterministic userId from the token prefix
    const nowSec = Math.floor(Date.now() / 1000);
    return { sub: `user:${token.slice(0, 16)}`, iat: nowSec, exp: nowSec + 3600 };
  },
};

/**
 * Ready-to-use auth middleware bound to the stub verifier.
 *
 * Exported for backwards compatibility and for use in unit tests via
 * `createApp()`.  Production Workers MUST call {@link createAuthMiddleware}
 * with a real verifier instead.
 *
 * @see createAuthMiddleware
 * @see HmacSha256Verifier
 * @see AuthServiceVerifier
 */
export const authMiddleware = createAuthMiddleware(STUB_VERIFIER);
