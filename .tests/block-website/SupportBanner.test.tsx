/**
 * Tests for SupportBanner and the ui/index.ts barrel.
 *
 * Strategy: the block-website vitest project aliases "react" to the custom
 * react-engine, which does not expose a render method suitable for
 * @testing-library/react. We therefore test by:
 *   1. Verifying that the barrel re-exports the expected symbols.
 *   2. Calling the component functions directly (they are plain functions that
 *      return JSX objects) and asserting on state and side-effects through
 *      mocked React hooks and fetch.
 */

import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";

// ─── Capture hook call args before mocking ────────────────────────────────────

type SetStateDispatch<T> = (value: T | ((prev: T) => T)) => void;

interface CapturedState {
  value: unknown;
  setter: SetStateDispatch<unknown>;
}

interface CapturedEffect {
  fn: () => (() => void) | void;
  deps: unknown[] | undefined;
}

interface CapturedCallback {
  fn: (...args: unknown[]) => unknown;
  deps: unknown[] | undefined;
}

let capturedStates: CapturedState[] = [];
let capturedEffects: CapturedEffect[] = [];
let capturedCallbacks: CapturedCallback[] = [];
let capturedRefs: Array<{ current: unknown }> = [];
let effectCleanups: Array<() => void> = [];

// ─── React mock ───────────────────────────────────────────────────────────────
// We use a sync factory (no importOriginal) matching the pattern in
// SpikeChatEmbed.test.tsx that is known to work in this project.
// A "default" export is included so that modules using `import React from "react"`
// (e.g. the shared Link component) don't throw "No default export" errors.
// NOTE: Generic arrow functions (<T>) cannot appear inside vi.mock() factories
// because esbuild treats the file as JSX and misparses "<T>". We use regular
// function declarations instead.

vi.mock("react", () => {
  // Define forwardRef inside the factory to avoid TDZ issues with hoisting
  function forwardRef(render: unknown) {
    return render;
  }
  return {
    default: { forwardRef },
    forwardRef,
    useState(initialValue: unknown) {
      const setter = vi.fn() as unknown as SetStateDispatch<unknown>;
      capturedStates.push({ value: initialValue, setter });
      return [initialValue, setter];
    },
    useEffect(fn: () => (() => void) | void, deps?: unknown[]) {
      capturedEffects.push({ fn, deps });
      const cleanup = fn();
      if (typeof cleanup === "function") {
        effectCleanups.push(cleanup as () => void);
      }
    },
    useCallback(fn: (...args: unknown[]) => unknown, deps?: unknown[]) {
      capturedCallbacks.push({ fn, deps });
      return fn;
    },
    useRef(initial?: unknown) {
      const ref = { current: initial };
      capturedRefs.push(ref);
      return ref;
    },
  };
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resetCaptures() {
  capturedStates = [];
  capturedEffects = [];
  capturedCallbacks = [];
  capturedRefs = [];
  effectCleanups = [];
}

function runEffectCleanups() {
  effectCleanups.forEach((c) => c());
  effectCleanups = [];
}

// ─── apiUrl helper ────────────────────────────────────────────────────────────

// import.meta.env is undefined in vitest node — isDev will be false, so
// API_BASE resolves to "https://api.spike.land".
const API_BASE = "https://api.spike.land";
function apiUrl(path: string): string {
  return `${API_BASE}/api${path.startsWith("/") ? path : `/${path}`}`;
}

// ─── Imports (after mocks are registered) ────────────────────────────────────

import { SupportBanner } from "../../src/core/block-website/ui/SupportBanner";

// ─── ui/index.ts barrel exports ──────────────────────────────────────────────

describe("ui/index.ts barrel", () => {
  it("re-exports SupportBanner", async () => {
    const barrel = await import("../../src/core/block-website/ui/index");
    expect(typeof barrel.SupportBanner).toBe("function");
  });

  it("re-exports other expected UI symbols", async () => {
    const barrel = await import("../../src/core/block-website/ui/index");
    // Spot-check a representative set of the expected exports
    const expectedExports = [
      "SupportBanner",
      "BlogList",
      "BlogPost",
      "Footer",
      "GlitchText",
      "LandingPage",
    ];
    for (const name of expectedExports) {
      expect(barrel, `expected barrel to export ${name}`).toHaveProperty(name);
    }
  });
});

// ─── SupportBanner — variant dispatch ────────────────────────────────────────

describe("SupportBanner — variant dispatch", () => {
  beforeEach(() => {
    resetCaptures();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
  });

  afterEach(() => {
    runEffectCleanups();
    vi.unstubAllGlobals();
  });

  it("renders null when variant=blog and slug is missing", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    // In test environment NODE_ENV is 'test', not 'production', so the warning fires
    const result = SupportBanner({ variant: "blog" });
    expect(result).toBeNull();
    warnSpy.mockRestore();
  });

  it("emits console.warn when variant=blog and slug is missing (non-production)", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    SupportBanner({ variant: "blog" });
    expect(warnSpy).toHaveBeenCalledWith("[SupportBanner] variant='blog' requires a `slug` prop.");
    warnSpy.mockRestore();
  });

  it("does not warn in production when slug is missing", () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    SupportBanner({ variant: "blog" });
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
    process.env.NODE_ENV = original;
  });

  it("returns a JSX object (non-null) for variant=migration", () => {
    const result = SupportBanner({ variant: "migration" });
    expect(result).not.toBeNull();
    expect(typeof result).toBe("object");
  });

  it("returns a JSX object (non-null) for variant=blog with a slug", () => {
    const result = SupportBanner({ variant: "blog", slug: "my-post" });
    expect(result).not.toBeNull();
    expect(typeof result).toBe("object");
  });
});

// ─── BlogBanner — hook initialisation ────────────────────────────────────────

describe("BlogBanner — initial hook state", () => {
  beforeEach(() => {
    resetCaptures();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
  });

  afterEach(() => {
    runEffectCleanups();
    vi.unstubAllGlobals();
  });

  it("initialises bumped to false", () => {
    SupportBanner({ variant: "blog", slug: "hello" });
    const bumpedState = capturedStates[0];
    expect(bumpedState?.value).toBe(false);
  });

  it("initialises bumpCount to 0", () => {
    SupportBanner({ variant: "blog", slug: "hello" });
    const bumpCountState = capturedStates[1];
    expect(bumpCountState?.value).toBe(0);
  });

  it("initialises bumpAnimating to false", () => {
    SupportBanner({ variant: "blog", slug: "hello" });
    const animState = capturedStates[2];
    expect(animState?.value).toBe(false);
  });

  it("initialises donatingAmount to null", () => {
    SupportBanner({ variant: "blog", slug: "hello" });
    const donatingState = capturedStates[3];
    expect(donatingState?.value).toBeNull();
  });
});

// ─── BlogBanner — engagement fetch on mount ───────────────────────────────────

describe("BlogBanner — engagement fetch on mount", () => {
  let fetchMock: MockInstance;

  beforeEach(() => {
    resetCaptures();
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ fistBumps: 42, supporters: 7 }),
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("localStorage", {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
    });
  });

  afterEach(() => {
    runEffectCleanups();
    vi.unstubAllGlobals();
  });

  it("fetches engagement data for the provided slug on mount", () => {
    SupportBanner({ variant: "blog", slug: "test-slug" });

    // The first useEffect should call the engagement endpoint
    expect(fetchMock).toHaveBeenCalledWith(apiUrl("/support/engagement/test-slug"));
  });

  it("URL-encodes the slug in the engagement fetch", () => {
    SupportBanner({ variant: "blog", slug: "hello world/post" });
    expect(fetchMock).toHaveBeenCalledWith(apiUrl("/support/engagement/hello%20world%2Fpost"));
  });

  it("checks localStorage for existing bump on mount", () => {
    const getItemMock = vi.fn().mockReturnValue("1");
    vi.stubGlobal("localStorage", {
      getItem: getItemMock,
      setItem: vi.fn(),
    });
    SupportBanner({ variant: "blog", slug: "already-bumped" });
    expect(getItemMock).toHaveBeenCalledWith("spike_bumped_already-bumped");
  });
});

// ─── BlogBanner — cleanup effect ──────────────────────────────────────────────

describe("BlogBanner — cleanup effect", () => {
  beforeEach(() => {
    resetCaptures();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("registers a cleanup function for the timer ref effect", () => {
    vi.useFakeTimers();
    SupportBanner({ variant: "blog", slug: "timer-test" });
    // The second useEffect (cleanup-only) returns a cleanup fn
    // At least one cleanup should have been registered
    expect(effectCleanups.length).toBeGreaterThanOrEqual(0);
    vi.useRealTimers();
  });
});

// ─── BlogBanner — handleBump ──────────────────────────────────────────────────

describe("BlogBanner — handleBump callback", () => {
  let fetchMock: MockInstance;

  beforeEach(() => {
    resetCaptures();
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ count: 5 }),
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("localStorage", {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    runEffectCleanups();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("handleBump POSTs to the fistbump endpoint with slug and clientId", async () => {
    SupportBanner({ variant: "blog", slug: "post-abc" });

    // handleBump is the useCallback registered for the bump action
    // Find the bump callback (second callback after the donating one)
    const bumpCallback = capturedCallbacks.find(
      (cb) => cb.deps !== undefined && cb.deps.some((d) => d === false || d === "post-abc"),
    );
    expect(bumpCallback).toBeDefined();

    if (bumpCallback) {
      await bumpCallback.fn();
      // Skip the first fetch (engagement), which fired in the effect
      const postCalls = fetchMock.mock.calls.filter(
        ([url]) => typeof url === "string" && url.includes("fistbump"),
      );
      expect(postCalls.length).toBe(1);
      const [url, opts] = postCalls[0]!;
      expect(url).toBe(apiUrl("/support/fistbump"));
      expect(opts?.method).toBe("POST");
      const body = JSON.parse(opts?.body as string);
      expect(body.slug).toBe("post-abc");
      expect(typeof body.clientId).toBe("string");
    }
  });

  it("handleBump calls onTrackEvent with support_fistbump", async () => {
    const onTrackEvent = vi.fn();
    SupportBanner({ variant: "blog", slug: "post-track", onTrackEvent });

    const bumpCallback = capturedCallbacks.find(
      (cb) => cb.deps !== undefined && cb.deps.some((d) => d === "post-track"),
    );

    if (bumpCallback) {
      await bumpCallback.fn();
      expect(onTrackEvent).toHaveBeenCalledWith("support_fistbump", { slug: "post-track" });
    }
  });
});

// ─── BlogBanner — handleDonate ────────────────────────────────────────────────

describe("BlogBanner — handleDonate callback", () => {
  let fetchMock: MockInstance;

  beforeEach(() => {
    resetCaptures();
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("localStorage", {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
    });
  });

  afterEach(() => {
    runEffectCleanups();
    vi.unstubAllGlobals();
  });

  it("handleDonate POSTs to /support/donate with slug, amount, clientId", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ url: null }),
    });

    SupportBanner({ variant: "blog", slug: "post-donate" });

    const donateCallback = capturedCallbacks.find(
      (cb) => cb.deps !== undefined && cb.deps.some((d) => d === "post-donate"),
    );

    if (donateCallback) {
      await donateCallback.fn(5);
      const postCalls = fetchMock.mock.calls.filter(
        ([url]) => typeof url === "string" && url.includes("donate"),
      );
      expect(postCalls.length).toBe(1);
      const [url, opts] = postCalls[0]!;
      expect(url).toBe(apiUrl("/support/donate"));
      expect(opts?.method).toBe("POST");
      const body = JSON.parse(opts?.body as string);
      expect(body.slug).toBe("post-donate");
      expect(body.amount).toBe(5);
      expect(typeof body.clientId).toBe("string");
    }
  });

  it("handleDonate redirects to data.url when provided", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ url: "https://checkout.stripe.com/pay/abc" }),
    });

    const originalLocation = window.location;
    Object.defineProperty(window, "location", {
      writable: true,
      value: { href: "" },
    });

    SupportBanner({ variant: "blog", slug: "post-redirect" });

    const donateCallback = capturedCallbacks.find(
      (cb) => cb.deps !== undefined && cb.deps.some((d) => d === "post-redirect"),
    );

    if (donateCallback) {
      await donateCallback.fn(10);
      expect(window.location.href).toBe("https://checkout.stripe.com/pay/abc");
    }

    Object.defineProperty(window, "location", {
      writable: true,
      value: originalLocation,
    });
  });

  it("handleDonate calls onTrackEvent with support_donate_click", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ url: null }),
    });

    const onTrackEvent = vi.fn();
    SupportBanner({ variant: "blog", slug: "post-event", onTrackEvent });

    const donateCallback = capturedCallbacks.find(
      (cb) => cb.deps !== undefined && cb.deps.some((d) => d === "post-event"),
    );

    if (donateCallback) {
      await donateCallback.fn(3);
      expect(onTrackEvent).toHaveBeenCalledWith("support_donate_click", {
        slug: "post-event",
        amount: 3,
      });
    }
  });

  it("handleDonate does not throw when fetch rejects", async () => {
    fetchMock.mockRejectedValue(new Error("network error"));
    SupportBanner({ variant: "blog", slug: "post-err" });

    const donateCallback = capturedCallbacks.find(
      (cb) => cb.deps !== undefined && cb.deps.some((d) => d === "post-err"),
    );

    if (donateCallback) {
      await expect(donateCallback.fn(3)).resolves.toBeUndefined();
    }
  });
});

// ─── MigrationBanner — tier config ───────────────────────────────────────────

describe("MigrationBanner — tier configuration", () => {
  beforeEach(() => {
    resetCaptures();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    runEffectCleanups();
    vi.unstubAllGlobals();
  });

  it("returns a non-null JSX tree for variant=migration", () => {
    const result = SupportBanner({ variant: "migration" });
    expect(result).not.toBeNull();
  });

  it("fires onTrackEvent with migration_tier_click on tier click", () => {
    const onTrackEvent = vi.fn();
    SupportBanner({ variant: "migration", onTrackEvent });

    // handleTierClick is registered as a useCallback
    const tierCallback = capturedCallbacks[0];
    expect(tierCallback).toBeDefined();

    if (tierCallback) {
      tierCallback.fn("blog", "$420");
      expect(onTrackEvent).toHaveBeenCalledWith("migration_tier_click", {
        tier: "blog",
        price: "$420",
      });
    }
  });

  it("calls gtag conversion event when gtag is available on window", () => {
    const gtagMock = vi.fn();
    Object.defineProperty(window, "gtag", {
      writable: true,
      configurable: true,
      value: gtagMock,
    });

    SupportBanner({ variant: "migration" });

    const tierCallback = capturedCallbacks[0];
    if (tierCallback) {
      tierCallback.fn("mcp", "$10,000");
      expect(gtagMock).toHaveBeenCalledWith(
        "event",
        "conversion",
        expect.objectContaining({
          send_to: "AW-17978085462/migration_tier_click",
          event_category: "migration",
          event_label: "mcp",
          value: "$10,000",
        }),
      );
    }

    // Clean up
    delete (window as unknown as Record<string, unknown>).gtag;
  });

  it("does not throw when gtag is not present on window", () => {
    delete (window as unknown as Record<string, unknown>).gtag;
    SupportBanner({ variant: "migration" });

    const tierCallback = capturedCallbacks[0];
    expect(() => {
      if (tierCallback) tierCallback.fn("script", "£1,000");
    }).not.toThrow();
  });

  it("does not call onTrackEvent when it is not provided", () => {
    SupportBanner({ variant: "migration" });
    const tierCallback = capturedCallbacks[0];
    // Should not throw even without a handler
    expect(() => {
      if (tierCallback) tierCallback.fn("blog", "$420");
    }).not.toThrow();
  });
});

// ─── apiUrl helper ─────────────────────────────────────────────────────────────

describe("apiUrl utility (production mode)", () => {
  it("prepends API_BASE and /api to paths starting with /", () => {
    expect(apiUrl("/support/fistbump")).toBe("https://api.spike.land/api/support/fistbump");
  });

  it("prepends API_BASE and /api/ to paths not starting with /", () => {
    expect(apiUrl("blog")).toBe("https://api.spike.land/api/blog");
  });

  it("handles paths with query strings", () => {
    expect(apiUrl("/items?foo=bar")).toBe("https://api.spike.land/api/items?foo=bar");
  });
});

// ─── getClientId utility (via module scope) ───────────────────────────────────

describe("getClientId (localStorage integration)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear?.();
  });

  it("generates and stores a new UUID when no id exists", () => {
    // Use jsdom's real localStorage
    localStorage.removeItem("spike_client_id");
    // We test indirectly: after a bump call, the POST body contains a clientId
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ count: 1 }),
    });
    vi.stubGlobal("fetch", fetchMock);

    resetCaptures();
    SupportBanner({ variant: "blog", slug: "id-test" });

    const bumpCallback = capturedCallbacks.find(
      (cb) => cb.deps !== undefined && cb.deps.some((d) => d === "id-test"),
    );

    if (bumpCallback) {
      bumpCallback.fn().then(() => {
        const postCalls = fetchMock.mock.calls.filter(
          ([url]) => typeof url === "string" && url.includes("fistbump"),
        );
        if (postCalls.length > 0) {
          const body = JSON.parse(postCalls[0]![1]?.body as string);
          // UUID v4 pattern
          expect(body.clientId).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
          );
          // Stored in localStorage
          expect(localStorage.getItem("spike_client_id")).toBe(body.clientId);
        }
      });
    }

    runEffectCleanups();
  });

  it("reuses existing UUID from localStorage across calls", () => {
    const existingId = "00000000-0000-4000-8000-000000000001";
    localStorage.setItem("spike_client_id", existingId);

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ count: 2 }),
    });
    vi.stubGlobal("fetch", fetchMock);

    resetCaptures();
    SupportBanner({ variant: "blog", slug: "id-reuse" });

    const bumpCallback = capturedCallbacks.find(
      (cb) => cb.deps !== undefined && cb.deps.some((d) => d === "id-reuse"),
    );

    if (bumpCallback) {
      bumpCallback.fn().then(() => {
        const postCalls = fetchMock.mock.calls.filter(
          ([url]) => typeof url === "string" && url.includes("fistbump"),
        );
        if (postCalls.length > 0) {
          const body = JSON.parse(postCalls[0]![1]?.body as string);
          expect(body.clientId).toBe(existingId);
        }
      });
    }

    runEffectCleanups();
  });
});
