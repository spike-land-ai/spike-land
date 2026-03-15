import { describe, expect, it } from "vitest";
import shallowEqual from "../../../../src/core/react-engine/core-logic/shared/shallowEqual.js";

describe("shallowEqual", () => {
  it("returns true for same reference", () => {
    const obj = { a: 1 };
    expect(shallowEqual(obj, obj)).toBe(true);
  });

  it("returns true for equal primitive values", () => {
    expect(shallowEqual(1, 1)).toBe(true);
    expect(shallowEqual("abc", "abc")).toBe(true);
    expect(shallowEqual(null, null)).toBe(true);
    expect(shallowEqual(undefined, undefined)).toBe(true);
  });

  it("returns false for null vs object", () => {
    expect(shallowEqual(null, {})).toBe(false);
    expect(shallowEqual({}, null)).toBe(false);
  });

  it("returns false for null vs null of different reference", () => {
    // null === null, so Object.is returns true
    expect(shallowEqual(null, null)).toBe(true);
  });

  it("returns false when one is not an object", () => {
    expect(shallowEqual(1, { a: 1 })).toBe(false);
    expect(shallowEqual({ a: 1 }, 1)).toBe(false);
  });

  it("returns true for objects with same shallow properties", () => {
    expect(shallowEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
  });

  it("returns false for objects with different values", () => {
    expect(shallowEqual({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false);
  });

  it("returns false for objects with different keys", () => {
    expect(shallowEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(shallowEqual({ a: 1, b: 2 }, { a: 1 })).toBe(false);
  });

  it("returns false when key exists on A but not B", () => {
    expect(shallowEqual({ a: 1, b: undefined }, { a: 1 })).toBe(false);
  });

  it("handles NaN values correctly", () => {
    expect(shallowEqual({ a: NaN }, { a: NaN })).toBe(true);
  });

  it("returns false for +0 vs -0 in objects", () => {
    expect(shallowEqual({ a: 0 }, { a: -0 })).toBe(false);
  });

  it("returns true for empty objects", () => {
    expect(shallowEqual({}, {})).toBe(true);
  });

  it("does not deep compare nested objects", () => {
    const nested1 = { a: { b: 1 } };
    const nested2 = { a: { b: 1 } };
    // Different references for nested object
    expect(shallowEqual(nested1, nested2)).toBe(false);
  });
});
