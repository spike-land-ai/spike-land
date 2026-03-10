// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ── Module-level reset ────────────────────────────────────────────────────────
// We re-import after each reset so the module-level constants
// (CONVERSION_LABEL, PURCHASE_LABEL) are evaluated fresh per test block.

describe("google-ads", () => {
  let gtagMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    gtagMock = vi.fn();
    vi.stubGlobal("gtag", gtagMock);
    localStorage.clear();

    // Default: no GCLID in URL
    Object.defineProperty(window, "location", {
      value: { search: "", pathname: "/", hostname: "localhost", href: "http://localhost/" },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
    localStorage.clear();
  });

  // ── captureGclid / initGoogleAds ─────────────────────────────────────────

  describe("initGoogleAds / captureGclid", () => {
    it("stores gclid in localStorage when present in query string", async () => {
      Object.defineProperty(window, "location", {
        value: { search: "?gclid=test-gclid-123", pathname: "/" },
        writable: true,
        configurable: true,
      });

      const { initGoogleAds } = await import("@/core-logic/google-ads");
      initGoogleAds();

      expect(localStorage.getItem("spike_gclid")).toBe("test-gclid-123");
      expect(localStorage.getItem("spike_gclid_exp")).toBeTruthy();
    });

    it("does not store gclid when not present in query string", async () => {
      Object.defineProperty(window, "location", {
        value: { search: "", pathname: "/" },
        writable: true,
        configurable: true,
      });

      const { initGoogleAds } = await import("@/core-logic/google-ads");
      initGoogleAds();

      expect(localStorage.getItem("spike_gclid")).toBeNull();
    });

    it("overwrites existing gclid if new one arrives", async () => {
      localStorage.setItem("spike_gclid", "old-gclid");

      Object.defineProperty(window, "location", {
        value: { search: "?gclid=new-gclid-456", pathname: "/" },
        writable: true,
        configurable: true,
      });

      const { initGoogleAds } = await import("@/core-logic/google-ads");
      initGoogleAds();

      expect(localStorage.getItem("spike_gclid")).toBe("new-gclid-456");
    });

    it("stores expiry 90 days from now", async () => {
      const before = Date.now();
      Object.defineProperty(window, "location", {
        value: { search: "?gclid=ttl-test", pathname: "/" },
        writable: true,
        configurable: true,
      });

      const { initGoogleAds } = await import("@/core-logic/google-ads");
      initGoogleAds();

      const expiry = Number(localStorage.getItem("spike_gclid_exp"));
      const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
      expect(expiry).toBeGreaterThanOrEqual(before + ninetyDaysMs);
      expect(expiry).toBeLessThanOrEqual(Date.now() + ninetyDaysMs + 1000);
    });

    it("does not throw when localStorage is unavailable", async () => {
      const originalSetItem = localStorage.setItem.bind(localStorage);
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("localStorage unavailable");
      });

      Object.defineProperty(window, "location", {
        value: { search: "?gclid=safe", pathname: "/" },
        writable: true,
        configurable: true,
      });

      const { initGoogleAds } = await import("@/core-logic/google-ads");
      expect(() => initGoogleAds()).not.toThrow();

      vi.spyOn(Storage.prototype, "setItem").mockImplementation(originalSetItem);
    });
  });

  // ── getStoredGclid ────────────────────────────────────────────────────────

  describe("getStoredGclid", () => {
    it("returns gclid when valid and within attribution window", async () => {
      const futureExpiry = String(Date.now() + 1_000_000);
      localStorage.setItem("spike_gclid", "valid-gclid");
      localStorage.setItem("spike_gclid_exp", futureExpiry);

      const { getStoredGclid } = await import("@/core-logic/google-ads");
      expect(getStoredGclid()).toBe("valid-gclid");
    });

    it("returns null when gclid is missing", async () => {
      const { getStoredGclid } = await import("@/core-logic/google-ads");
      expect(getStoredGclid()).toBeNull();
    });

    it("returns null and clears storage when gclid has expired", async () => {
      const pastExpiry = String(Date.now() - 1000);
      localStorage.setItem("spike_gclid", "expired-gclid");
      localStorage.setItem("spike_gclid_exp", pastExpiry);

      const { getStoredGclid } = await import("@/core-logic/google-ads");
      const result = getStoredGclid();

      expect(result).toBeNull();
      expect(localStorage.getItem("spike_gclid")).toBeNull();
      expect(localStorage.getItem("spike_gclid_exp")).toBeNull();
    });

    it("returns null when expiry key is missing but gclid exists", async () => {
      localStorage.setItem("spike_gclid", "orphaned-gclid");

      const { getStoredGclid } = await import("@/core-logic/google-ads");
      expect(getStoredGclid()).toBeNull();
    });

    it("returns null when localStorage throws", async () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("quota exceeded");
      });

      const { getStoredGclid } = await import("@/core-logic/google-ads");
      expect(getStoredGclid()).toBeNull();

      vi.restoreAllMocks();
    });
  });

  // ── trackSignUpConversion ─────────────────────────────────────────────────

  describe("trackSignUpConversion", () => {
    it("does not call gtag when CONVERSION_LABEL is undefined", async () => {
      // The env var is not set in test environment, so CONVERSION_LABEL is undefined
      const { trackSignUpConversion } = await import("@/core-logic/google-ads");
      trackSignUpConversion();
      expect(gtagMock).not.toHaveBeenCalled();
    });

    it("does not call gtag when window.gtag is not a function", async () => {
      vi.stubGlobal("gtag", undefined);
      const { trackSignUpConversion } = await import("@/core-logic/google-ads");
      trackSignUpConversion();
      expect(gtagMock).not.toHaveBeenCalled();
    });
  });

  // ── trackPurchaseConversion ───────────────────────────────────────────────

  describe("trackPurchaseConversion", () => {
    it("does not call gtag when PURCHASE_LABEL is undefined", async () => {
      const { trackPurchaseConversion } = await import("@/core-logic/google-ads");
      trackPurchaseConversion(99, "USD");
      expect(gtagMock).not.toHaveBeenCalled();
    });

    it("does not call gtag when window.gtag is missing", async () => {
      vi.stubGlobal("gtag", null);
      const { trackPurchaseConversion } = await import("@/core-logic/google-ads");
      trackPurchaseConversion(49.99);
      expect(gtagMock).not.toHaveBeenCalled();
    });
  });

  // ── trackMigrationConversion ──────────────────────────────────────────────

  describe("trackMigrationConversion", () => {
    it("calls gtag with blog tier parameters", async () => {
      const { trackMigrationConversion } = await import("@/core-logic/google-ads");
      trackMigrationConversion("blog", 420, "USD");

      expect(gtagMock).toHaveBeenCalledWith("event", "conversion", {
        send_to: "AW-17978085462/migration_blog_checkout",
        value: 420,
        currency: "USD",
        migration_tier: "blog",
      });
    });

    it("calls gtag with script tier parameters", async () => {
      const { trackMigrationConversion } = await import("@/core-logic/google-ads");
      trackMigrationConversion("script", 1000, "GBP");

      expect(gtagMock).toHaveBeenCalledWith("event", "conversion", {
        send_to: "AW-17978085462/migration_script_checkout",
        value: 1000,
        currency: "GBP",
        migration_tier: "script",
      });
    });

    it("calls gtag with mcp tier parameters", async () => {
      const { trackMigrationConversion } = await import("@/core-logic/google-ads");
      trackMigrationConversion("mcp", 10000, "USD");

      expect(gtagMock).toHaveBeenCalledWith("event", "conversion", {
        send_to: "AW-17978085462/migration_mcp_checkout",
        value: 10000,
        currency: "USD",
        migration_tier: "mcp",
      });
    });

    it("defaults currency to USD when not provided", async () => {
      const { trackMigrationConversion } = await import("@/core-logic/google-ads");
      trackMigrationConversion("blog", 420);

      expect(gtagMock).toHaveBeenCalledWith(
        "event",
        "conversion",
        expect.objectContaining({ currency: "USD" }),
      );
    });

    it("does not call gtag when window.gtag is not a function", async () => {
      vi.stubGlobal("gtag", undefined);
      const { trackMigrationConversion } = await import("@/core-logic/google-ads");
      trackMigrationConversion("blog", 420);
      expect(gtagMock).not.toHaveBeenCalled();
    });
  });

  // ── trackGoogleAdsEvent ───────────────────────────────────────────────────

  describe("trackGoogleAdsEvent", () => {
    it("calls gtag with the provided event name and params", async () => {
      const { trackGoogleAdsEvent } = await import("@/core-logic/google-ads");
      trackGoogleAdsEvent("migration_page_view", { page: "/migrate" });

      expect(gtagMock).toHaveBeenCalledWith("event", "migration_page_view", {
        page: "/migrate",
      });
    });

    it("calls gtag with no params when omitted", async () => {
      const { trackGoogleAdsEvent } = await import("@/core-logic/google-ads");
      trackGoogleAdsEvent("generic_event");

      expect(gtagMock).toHaveBeenCalledWith("event", "generic_event", undefined);
    });

    it("does not throw when window.gtag is undefined", async () => {
      vi.stubGlobal("gtag", undefined);
      const { trackGoogleAdsEvent } = await import("@/core-logic/google-ads");
      expect(() => trackGoogleAdsEvent("some_event")).not.toThrow();
    });

    it("passes arbitrary extra params through to gtag", async () => {
      const { trackGoogleAdsEvent } = await import("@/core-logic/google-ads");
      const params = { user_id: "u123", plan: "pro", value: 99 };
      trackGoogleAdsEvent("checkout_started", params);

      expect(gtagMock).toHaveBeenCalledWith("event", "checkout_started", params);
    });
  });
});
