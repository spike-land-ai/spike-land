/**
 * Tests for token-validation.ts
 *
 * All outbound fetch() calls are mocked — no real network requests are made.
 * We test the decision logic: how does validateDonatedKey() respond to different
 * HTTP status codes from the upstream provider?
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { validateDonatedKey, isDonatedProvider } from "../token-validation";

// ── Helpers ───────────────────────────────────────────────────────────────────

function mockFetch(status: number, body = "{}"): void {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(body, { status })));
}

function mockFetchNetworkError(): void {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network failure")));
}

afterEach(() => {
  vi.restoreAllMocks();
});

// ── isDonatedProvider ─────────────────────────────────────────────────────────

describe("isDonatedProvider", () => {
  it("accepts known providers", () => {
    expect(isDonatedProvider("openai")).toBe(true);
    expect(isDonatedProvider("anthropic")).toBe(true);
    expect(isDonatedProvider("google")).toBe(true);
    expect(isDonatedProvider("xai")).toBe(true);
  });

  it("rejects unknown values", () => {
    expect(isDonatedProvider("cohere")).toBe(false);
    expect(isDonatedProvider("")).toBe(false);
    expect(isDonatedProvider("OPENAI")).toBe(false); // case-sensitive
  });
});

// ── validateDonatedKey — structural guards ────────────────────────────────────

describe("validateDonatedKey — structural guards", () => {
  it("rejects keys shorter than 10 characters without calling fetch", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await validateDonatedKey("openai", "short");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("key_too_short");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects an empty key without calling fetch", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await validateDonatedKey("openai", "");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("key_too_short");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

// ── OpenAI ────────────────────────────────────────────────────────────────────

describe("validateDonatedKey — openai", () => {
  const KEY = "sk-test-1234567890abcdef";

  it("returns valid=true on HTTP 200", async () => {
    mockFetch(200, JSON.stringify({ object: "list" }));
    const r = await validateDonatedKey("openai", KEY);
    expect(r.valid).toBe(true);
    expect(r.provider).toBe("openai");
    expect(r.error).toBeUndefined();
  });

  it("returns valid=false on HTTP 401", async () => {
    mockFetch(401, JSON.stringify({ error: { code: "invalid_api_key" } }));
    const r = await validateDonatedKey("openai", KEY);
    expect(r.valid).toBe(false);
    expect(r.error).toBe("invalid_key");
  });

  it("returns valid=false on HTTP 403", async () => {
    mockFetch(403);
    const r = await validateDonatedKey("openai", KEY);
    expect(r.valid).toBe(false);
    expect(r.error).toBe("invalid_key");
  });

  it("returns valid=true on HTTP 429 (rate-limited but real key)", async () => {
    mockFetch(429);
    const r = await validateDonatedKey("openai", KEY);
    expect(r.valid).toBe(true);
    expect(r.provider).toBe("openai");
  });

  it("returns valid=false with network_error on fetch failure", async () => {
    mockFetchNetworkError();
    const r = await validateDonatedKey("openai", KEY);
    expect(r.valid).toBe(false);
    expect(r.error).toBe("network_error");
  });

  it("returns valid=false with unexpected_status for other codes", async () => {
    mockFetch(500);
    const r = await validateDonatedKey("openai", KEY);
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/unexpected_status/);
  });

  it("passes the key in the Authorization header, not as a query param", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await validateDonatedKey("openai", KEY);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("api.openai.com");
    const headers = init.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe(`Bearer ${KEY}`);
    // Key must NOT appear in the URL
    expect(url).not.toContain(KEY);
  });
});

// ── Anthropic ─────────────────────────────────────────────────────────────────

describe("validateDonatedKey — anthropic", () => {
  const KEY = "sk-ant-test-1234567890abcdef";

  it("returns valid=true on HTTP 200", async () => {
    mockFetch(200);
    const r = await validateDonatedKey("anthropic", KEY);
    expect(r.valid).toBe(true);
    expect(r.provider).toBe("anthropic");
  });

  it("returns valid=false on HTTP 401", async () => {
    mockFetch(401);
    const r = await validateDonatedKey("anthropic", KEY);
    expect(r.valid).toBe(false);
    expect(r.error).toBe("invalid_key");
  });

  it("returns valid=true on HTTP 429", async () => {
    mockFetch(429);
    const r = await validateDonatedKey("anthropic", KEY);
    expect(r.valid).toBe(true);
  });

  it("passes the key in x-api-key header", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await validateDonatedKey("anthropic", KEY);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("api.anthropic.com");
    const headers = init.headers as Record<string, string>;
    expect(headers["x-api-key"]).toBe(KEY);
    expect(url).not.toContain(KEY);
  });
});

// ── Google ────────────────────────────────────────────────────────────────────

describe("validateDonatedKey — google", () => {
  const KEY = "AIzaSyTestKey1234567890abcdef";

  it("returns valid=true on HTTP 200", async () => {
    mockFetch(200);
    const r = await validateDonatedKey("google", KEY);
    expect(r.valid).toBe(true);
    expect(r.provider).toBe("google");
  });

  it("returns valid=false on HTTP 400 (Google returns 400 for bad keys)", async () => {
    mockFetch(400);
    const r = await validateDonatedKey("google", KEY);
    expect(r.valid).toBe(false);
    expect(r.error).toBe("invalid_key");
  });

  it("returns valid=false on HTTP 403", async () => {
    mockFetch(403);
    const r = await validateDonatedKey("google", KEY);
    expect(r.valid).toBe(false);
    expect(r.error).toBe("invalid_key");
  });

  it("returns valid=true on HTTP 429", async () => {
    mockFetch(429);
    const r = await validateDonatedKey("google", KEY);
    expect(r.valid).toBe(true);
  });
});

// ── xAI ──────────────────────────────────────────────────────────────────────

describe("validateDonatedKey — xai", () => {
  const KEY = "xai-test-1234567890abcdef";

  it("returns valid=true on HTTP 200", async () => {
    mockFetch(200);
    const r = await validateDonatedKey("xai", KEY);
    expect(r.valid).toBe(true);
    expect(r.provider).toBe("xai");
  });

  it("returns valid=false on HTTP 401", async () => {
    mockFetch(401);
    const r = await validateDonatedKey("xai", KEY);
    expect(r.valid).toBe(false);
    expect(r.error).toBe("invalid_key");
  });

  it("passes the key in Authorization header", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await validateDonatedKey("xai", KEY);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("api.x.ai");
    const headers = init.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe(`Bearer ${KEY}`);
    expect(url).not.toContain(KEY);
  });
});
