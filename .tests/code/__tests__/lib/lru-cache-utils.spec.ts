import { describe, expect, it, vi, afterEach } from "vitest";
import { perf, emitSimplifiedWarning, isPosInt } from "@/lib/lru-cache/utils";

describe("perf", () => {
  it("has a now() function returning a number", () => {
    const t = perf.now();
    expect(typeof t).toBe("number");
    expect(t).toBeGreaterThanOrEqual(0);
  });
});

describe("emitSimplifiedWarning", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls console.warn with formatted message", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    emitSimplifiedWarning("test warning message", "UNIQUE_CODE_XYZ");
    expect(warnSpy).toHaveBeenCalledWith("[LRUCache:UNIQUE_CODE_XYZ] test warning message");
  });

  it("does not emit duplicate warnings for the same code", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    emitSimplifiedWarning("msg1", "DEDUPE_CODE_ABC");
    emitSimplifiedWarning("msg2", "DEDUPE_CODE_ABC");
    // Only first call should produce a warning
    const calls = warnSpy.mock.calls.filter((c) => String(c[0]).includes("DEDUPE_CODE_ABC"));
    expect(calls.length).toBe(1);
  });
});

describe("isPosInt", () => {
  it("returns true for positive integers", () => {
    expect(isPosInt(1)).toBe(true);
    expect(isPosInt(100)).toBe(true);
    expect(isPosInt(Number.MAX_SAFE_INTEGER)).toBe(true);
  });

  it("returns false for 0", () => {
    expect(isPosInt(0)).toBe(false);
  });

  it("returns false for negative numbers", () => {
    expect(isPosInt(-1)).toBe(false);
    expect(isPosInt(-100)).toBe(false);
  });

  it("returns false for floats", () => {
    expect(isPosInt(1.5)).toBe(false);
    expect(isPosInt(0.1)).toBe(false);
  });

  it("returns false for Infinity", () => {
    expect(isPosInt(Infinity)).toBe(false);
  });

  it("returns false for NaN", () => {
    expect(isPosInt(NaN)).toBe(false);
  });

  it("returns false for non-number types", () => {
    expect(isPosInt("1")).toBe(false);
    expect(isPosInt(null)).toBe(false);
    expect(isPosInt(undefined)).toBe(false);
    expect(isPosInt({})).toBe(false);
  });
});
