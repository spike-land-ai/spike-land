import { describe, expect, it } from "vitest";

import { cn } from "../../src/block-website/src/lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "not-this", "always")).toBe("base always");
  });

  it("merges tailwind conflicts (last wins)", () => {
    const result = cn("p-4", "p-8");
    expect(result).toBe("p-8");
  });

  it("handles arrays of classes", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
  });

  it("returns empty string for no args", () => {
    expect(cn()).toBe("");
  });

  it("handles undefined and null gracefully", () => {
    expect(cn(undefined, null, "valid")).toBe("valid");
  });

  it("handles object syntax for conditional classes", () => {
    const result = cn({ active: true, disabled: false });
    expect(result).toBe("active");
  });

  it("merges conflicting tailwind text utilities (last wins)", () => {
    expect(cn("text-sm", "text-lg")).toBe("text-lg");
  });

  it("deduplicates identical classes", () => {
    const result = cn("flex", "flex");
    // tailwind-merge deduplicates, result should be "flex"
    expect(result).toBe("flex");
  });
});
