import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getClientId, hashClientId, sendGA4Events } from "../../../src/spike-edge/lib/ga4.js";

describe("hashClientId", () => {
  it("returns consistent hex hash for same input", async () => {
    const hash1 = await hashClientId("192.168.1.1");
    const hash2 = await hashClientId("192.168.1.1");
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[0-9a-f]{64}$/);
  });

  it("returns different hash for different inputs", async () => {
    const hash1 = await hashClientId("192.168.1.1");
    const hash2 = await hashClientId("10.0.0.1");
    expect(hash1).not.toBe(hash2);
  });
});

describe("getClientId", () => {
  it("uses cf-connecting-ip header when present", async () => {
    const request = new Request("https://example.com", {
      headers: { "cf-connecting-ip": "203.0.113.42" },
    });
    const clientId = await getClientId(request);
    const expectedHash = await hashClientId("203.0.113.42");
    expect(clientId).toBe(expectedHash);
  });

  it("falls back to random UUID when no cf-connecting-ip header", async () => {
    const request = new Request("https://example.com");
    const clientId = await getClientId(request);
    // Should still be a valid hex hash (64 chars from SHA-256)
    expect(clientId).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("sendGA4Events", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn().mockResolvedValue(new Response("", { status: 200 }));
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const env = { GA_MEASUREMENT_ID: "G-TEST123", GA_API_SECRET: "secret123" };

  it("sends correct payload to GA4 endpoint", async () => {
    await sendGA4Events(env, "client-abc", [
      { name: "page_view", params: { page: "/home" } },
    ]);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0]!;
    expect(url).toContain("google-analytics.com/mp/collect");
    expect(url).toContain("measurement_id=G-TEST123");
    expect(url).toContain("api_secret=secret123");
    expect(init.method).toBe("POST");
    expect(init.headers["Content-Type"]).toBe("application/json");

    const body = JSON.parse(init.body);
    expect(body.client_id).toBe("client-abc");
    expect(body.events).toHaveLength(1);
    expect(body.events[0].name).toBe("page_view");
    expect(body.events[0].params.page).toBe("/home");
  });

  it("batches events >25 into multiple requests", async () => {
    const events = Array.from({ length: 30 }, (_, i) => ({
      name: `event_${i}`,
      params: { index: i },
    }));

    await sendGA4Events(env, "client-abc", events);

    expect(mockFetch).toHaveBeenCalledTimes(2);

    const batch1 = JSON.parse(mockFetch.mock.calls[0]![1].body);
    expect(batch1.events).toHaveLength(25);

    const batch2 = JSON.parse(mockFetch.mock.calls[1]![1].body);
    expect(batch2.events).toHaveLength(5);
  });

  it("skips when credentials missing (no fetch called)", async () => {
    await sendGA4Events({ GA_MEASUREMENT_ID: "", GA_API_SECRET: "secret" }, "client", [
      { name: "test", params: {} },
    ]);
    expect(mockFetch).not.toHaveBeenCalled();

    await sendGA4Events({ GA_MEASUREMENT_ID: "G-X", GA_API_SECRET: "" }, "client", [
      { name: "test", params: {} },
    ]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("truncates strings longer than 500 chars", async () => {
    const longString = "x".repeat(600);
    await sendGA4Events(env, "client-abc", [
      { name: "test", params: { value: longString } },
    ]);

    const body = JSON.parse(mockFetch.mock.calls[0]![1].body);
    expect(body.events[0].params.value).toHaveLength(500);
  });

  it("propagates fetch failure (no internal catch)", async () => {
    mockFetch.mockRejectedValue(new Error("network error"));

    // The current implementation does not catch fetch errors — they propagate.
    // The caller (analytics route) wraps this in waitUntil, so failures are
    // silently swallowed at the Workers runtime level.
    await expect(
      sendGA4Events(env, "client-abc", [
        { name: "test", params: {} },
      ]),
    ).rejects.toThrow("network error");
  });
});
