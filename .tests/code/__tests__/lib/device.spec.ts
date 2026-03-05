import { describe, expect, it, vi, afterEach } from "vitest";
import { detectSlowDevice } from "@/lib/device";

describe("detectSlowDevice", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns false when hardwareConcurrency >= 4 and deviceMemory >= 4", () => {
    vi.stubGlobal("navigator", {
      hardwareConcurrency: 8,
      deviceMemory: 8,
    });
    expect(detectSlowDevice()).toBe(false);
  });

  it("returns true when hardwareConcurrency < 4", () => {
    vi.stubGlobal("navigator", {
      hardwareConcurrency: 2,
      deviceMemory: 8,
    });
    expect(detectSlowDevice()).toBe(true);
  });

  it("returns true when deviceMemory < 4", () => {
    vi.stubGlobal("navigator", {
      hardwareConcurrency: 8,
      deviceMemory: 2,
    });
    expect(detectSlowDevice()).toBe(true);
  });

  it("defaults hardwareConcurrency to 4 when undefined (not slow)", () => {
    vi.stubGlobal("navigator", {
      hardwareConcurrency: undefined,
      deviceMemory: 8,
    });
    expect(detectSlowDevice()).toBe(false);
  });

  it("defaults deviceMemory to 4 when undefined (not slow)", () => {
    vi.stubGlobal("navigator", {
      hardwareConcurrency: 8,
      deviceMemory: undefined,
    });
    expect(detectSlowDevice()).toBe(false);
  });

  it("returns false when navigator is undefined", () => {
    vi.stubGlobal("navigator", undefined);
    expect(detectSlowDevice()).toBe(false);
  });

  it("returns true when both concurrency and memory are low", () => {
    vi.stubGlobal("navigator", {
      hardwareConcurrency: 1,
      deviceMemory: 1,
    });
    expect(detectSlowDevice()).toBe(true);
  });
});
