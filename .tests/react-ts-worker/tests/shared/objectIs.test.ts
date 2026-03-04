import { describe, expect, it } from "vitest";
import objectIs from "../../../../src/react-ts-worker/shared/objectIs.js";

describe("objectIs", () => {
  it("returns true for same primitive values", () => {
    expect(objectIs(1, 1)).toBe(true);
    expect(objectIs("a", "a")).toBe(true);
    expect(objectIs(true, true)).toBe(true);
    expect(objectIs(null, null)).toBe(true);
    expect(objectIs(undefined, undefined)).toBe(true);
  });

  it("returns false for different primitive values", () => {
    expect(objectIs(1, 2)).toBe(false);
    expect(objectIs("a", "b")).toBe(false);
    expect(objectIs(true, false)).toBe(false);
  });

  it("handles NaN correctly (NaN === NaN)", () => {
    expect(objectIs(NaN, NaN)).toBe(true);
  });

  it("distinguishes +0 and -0", () => {
    expect(objectIs(0, -0)).toBe(false);
    expect(objectIs(-0, 0)).toBe(false);
    expect(objectIs(0, 0)).toBe(true);
    expect(objectIs(-0, -0)).toBe(true);
  });

  it("returns false for null vs undefined", () => {
    expect(objectIs(null, undefined)).toBe(false);
  });

  it("returns true for same object reference", () => {
    const obj = {};
    expect(objectIs(obj, obj)).toBe(true);
  });

  it("returns false for different object references", () => {
    expect(objectIs({}, {})).toBe(false);
  });

  it("returns false for 0 vs false", () => {
    expect(objectIs(0, false)).toBe(false);
  });
});
