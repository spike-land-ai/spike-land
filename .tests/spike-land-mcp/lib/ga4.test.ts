/**
 * Tests for lib/ga4.ts
 */
import { describe, expect, it, vi, afterEach } from "vitest";
import { hashClientId, sendGA4Events, type GA4Event } from "../../../src/spike-land-mcp/lib/ga4";

describe("hashClientId", () => {
  it("returns a hex string of length 64", async () => {
    const hash = await hashClientId("user-123");
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });

  it("is deterministic for the same input", async () => {
    const hash1 = await hashClientId("same-input");
    const hash2 = await hashClientId("same-input");
    expect(hash1).toBe(hash2);
  });

  it("produces different hashes for different inputs", async () => {
    const hash1 = await hashClientId("user-a");
    const hash2 = await hashClientId("user-b");
    expect(hash1).not.toBe(hash2);
  });

  it("handles empty string input", async () => {
    const hash = await hashClientId("");
    expect(hash).toHaveLength(64);
  });
});

describe("sendGA4Events", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("skips sending when GA_MEASUREMENT_ID is missing", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await sendGA4Events(
      { GA_MEASUREMENT_ID: "", GA_API_SECRET: "secret" },
      "client-1",
      [{ name: "test_event", params: { key: "value" } }],
    );

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("skips sending when GA_API_SECRET is missing", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await sendGA4Events(
      { GA_MEASUREMENT_ID: "G-TEST", GA_API_SECRET: "" },
      "client-1",
      [{ name: "test_event", params: { key: "value" } }],
    );

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("sends events when credentials are present", async () => {
    const mockFetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("{}", { status: 200 }),
    );

    const events: GA4Event[] = [{ name: "page_view", params: { page: "/home" } }];

    await sendGA4Events(
      { GA_MEASUREMENT_ID: "G-TEST123", GA_API_SECRET: "my-secret" },
      "client-abc",
      events,
    );

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("G-TEST123");
    expect(url).toContain("my-secret");
    expect(options.method).toBe("POST");
    const body = JSON.parse(options.body as string) as { client_id: string; events: unknown[] };
    expect(body.client_id).toBe("client-abc");
    expect(body.events).toHaveLength(1);
  });

  it("batches events in groups of 25", async () => {
    const mockFetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("{}", { status: 200 }),
    );

    // Create 30 events (should result in 2 batches)
    const events: GA4Event[] = Array.from({ length: 30 }, (_, i) => ({
      name: `event_${i}`,
      params: { index: i },
    }));

    await sendGA4Events(
      { GA_MEASUREMENT_ID: "G-TEST", GA_API_SECRET: "secret" },
      "client-1",
      events,
    );

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("truncates event name to 40 characters", async () => {
    const mockFetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("{}", { status: 200 }),
    );

    const longName = "a".repeat(100);
    await sendGA4Events(
      { GA_MEASUREMENT_ID: "G-TEST", GA_API_SECRET: "secret" },
      "client-1",
      [{ name: longName, params: {} }],
    );

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string) as { events: Array<{ name: string }> };
    expect(body.events[0]?.name).toHaveLength(40);
  });

  it("truncates string params to 500 characters", async () => {
    const mockFetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("{}", { status: 200 }),
    );

    const longValue = "x".repeat(600);
    await sendGA4Events(
      { GA_MEASUREMENT_ID: "G-TEST", GA_API_SECRET: "secret" },
      "client-1",
      [{ name: "test", params: { long_param: longValue } }],
    );

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string) as { events: Array<{ params: Record<string, string> }> };
    expect(body.events[0]?.params["long_param"]).toHaveLength(500);
  });

  it("truncates param key to 40 characters", async () => {
    const mockFetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("{}", { status: 200 }),
    );

    const longKey = "k".repeat(60);
    await sendGA4Events(
      { GA_MEASUREMENT_ID: "G-TEST", GA_API_SECRET: "secret" },
      "client-1",
      [{ name: "test", params: { [longKey]: "value" } }],
    );

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string) as { events: Array<{ params: Record<string, string> }> };
    const paramKeys = Object.keys(body.events[0]?.params ?? {});
    expect(paramKeys[0]).toHaveLength(40);
  });

  it("preserves non-string param values unchanged", async () => {
    const mockFetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("{}", { status: 200 }),
    );

    await sendGA4Events(
      { GA_MEASUREMENT_ID: "G-TEST", GA_API_SECRET: "secret" },
      "client-1",
      [{ name: "test", params: { count: 42, enabled: true } }],
    );

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string) as { events: Array<{ params: Record<string, unknown> }> };
    expect(body.events[0]?.params["count"]).toBe(42);
    expect(body.events[0]?.params["enabled"]).toBe(true);
  });

  it("logs error when fetch fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Bad Request", { status: 400, statusText: "Bad Request" }),
    );
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await sendGA4Events(
      { GA_MEASUREMENT_ID: "G-TEST", GA_API_SECRET: "secret" },
      "client-1",
      [{ name: "test", params: {} }],
    );

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("[ga4] send failed"));
  });
});
