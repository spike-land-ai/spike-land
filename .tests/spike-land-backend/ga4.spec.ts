import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hashClientId, sendGA4Events } from "../../src/spike-land-backend/lib/ga4.js";
import type { GA4Event } from "../../src/spike-land-backend/lib/ga4.js";

describe("ga4", () => {
  describe("hashClientId", () => {
    it("returns a hex string", async () => {
      const result = await hashClientId("test-client-id");
      expect(result).toMatch(/^[0-9a-f]{64}$/);
    });

    it("returns consistent hash for the same input", async () => {
      const result1 = await hashClientId("consistent-id");
      const result2 = await hashClientId("consistent-id");
      expect(result1).toBe(result2);
    });

    it("returns different hashes for different inputs", async () => {
      const result1 = await hashClientId("id-one");
      const result2 = await hashClientId("id-two");
      expect(result1).not.toBe(result2);
    });

    it("handles empty string", async () => {
      const result = await hashClientId("");
      expect(result).toMatch(/^[0-9a-f]{64}$/);
    });

    it("handles unicode strings", async () => {
      const result = await hashClientId("emoji-test-🚀");
      expect(result).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe("sendGA4Events", () => {
    let mockFetch: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      mockFetch = vi.fn().mockResolvedValue(new Response("", { status: 200 }));
      global.fetch = mockFetch;
    });

    afterEach(() => {
      vi.resetAllMocks();
    });

    it("returns early without fetching when measurementId is empty", async () => {
      const localFetch = vi.fn();
      global.fetch = localFetch;
      await sendGA4Events("", "secret", "client-123", [{ name: "test", params: {} }]);
      expect(localFetch).not.toHaveBeenCalled();
      global.fetch = mockFetch;
    });

    it("returns early without fetching when apiSecret is empty", async () => {
      const localFetch = vi.fn();
      global.fetch = localFetch;
      await sendGA4Events("G-TEST123", "", "client-123", [{ name: "test", params: {} }]);
      expect(localFetch).not.toHaveBeenCalled();
      global.fetch = mockFetch;
    });

    it("sends events to GA4 endpoint", async () => {
      const events: GA4Event[] = [
        { name: "page_view", params: { page: "/home", value: 1, active: true } },
      ];

      await sendGA4Events("G-TEST123", "api-secret", "client-abc", events);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toContain("measurement_id=G-TEST123");
      expect(url).toContain("api_secret=api-secret");

      const body = JSON.parse(options.body as string);
      expect(body.client_id).toBe("client-abc");
      expect(body.events).toHaveLength(1);
      expect(body.events[0].name).toBe("page_view");
    });

    it("truncates string values longer than 500 characters", async () => {
      const longString = "x".repeat(600);
      const events: GA4Event[] = [{ name: "test", params: { long_param: longString } }];

      await sendGA4Events("G-TEST123", "api-secret", "client-abc", events);

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);
      expect(body.events[0].params.long_param).toHaveLength(500);
    });

    it("does not truncate strings at 500 characters", async () => {
      const exactString = "y".repeat(500);
      const events: GA4Event[] = [{ name: "test", params: { exact_param: exactString } }];

      await sendGA4Events("G-TEST123", "api-secret", "client-abc", events);

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);
      expect(body.events[0].params.exact_param).toHaveLength(500);
    });

    it("does not truncate number values", async () => {
      const events: GA4Event[] = [{ name: "test", params: { count: 12345 } }];

      await sendGA4Events("G-TEST123", "api-secret", "client-abc", events);

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);
      expect(body.events[0].params.count).toBe(12345);
    });

    it("does not truncate boolean values", async () => {
      const events: GA4Event[] = [{ name: "test", params: { active: false } }];

      await sendGA4Events("G-TEST123", "api-secret", "client-abc", events);

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);
      expect(body.events[0].params.active).toBe(false);
    });

    it("limits to 25 events (MAX_BATCH_SIZE)", async () => {
      const events: GA4Event[] = Array.from({ length: 30 }, (_, i) => ({
        name: `event_${i}`,
        params: {},
      }));

      await sendGA4Events("G-TEST123", "api-secret", "client-abc", events);

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);
      expect(body.events).toHaveLength(25);
    });

    it("sends correct Content-Type header", async () => {
      await sendGA4Events("G-TEST123", "api-secret", "client-abc", [
        { name: "test", params: {} },
      ]);

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect((options.headers as Record<string, string>)["Content-Type"]).toBe("application/json");
    });

    it("sends events with empty params", async () => {
      const events: GA4Event[] = [{ name: "empty_params", params: {} }];
      await sendGA4Events("G-TEST123", "api-secret", "client-abc", events);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);
      expect(body.events[0].params).toEqual({});
    });

    it("uses POST method", async () => {
      await sendGA4Events("G-TEST123", "api-secret", "client-abc", [
        { name: "test", params: {} },
      ]);

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(options.method).toBe("POST");
    });

    it("encodes special characters in measurement ID and secret", async () => {
      await sendGA4Events("G-TEST/123", "api&secret", "client-abc", [
        { name: "test", params: {} },
      ]);

      const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toContain("measurement_id=G-TEST%2F123");
      expect(url).toContain("api_secret=api%26secret");
    });
  });
});
