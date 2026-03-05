import { describe, expect, it } from "vitest";
import { createDelta, applyDelta } from "@/lib/text-delta";

describe("createDelta", () => {
  it("returns empty array when objects are identical", () => {
    const obj = { code: "hello", html: "<p>hello</p>", css: "" };
    const delta = createDelta(obj, obj);
    expect(Array.isArray(delta)).toBe(true);
    expect((delta as unknown[]).length).toBe(0);
  });

  it("returns a delta when objects differ", () => {
    const oldObj = { code: "hello", html: "", css: "" };
    const newObj = { code: "world", html: "", css: "" };
    const delta = createDelta(oldObj, newObj);
    // jsondiffpatch returns an object (not an array) when there are diffs
    expect(Array.isArray(delta)).toBe(false);
    expect(delta).toBeTruthy();
  });

  it("returns empty array for identical primitives nested in objects", () => {
    const a = { x: 1, y: 2 };
    const b = { x: 1, y: 2 };
    const delta = createDelta(a, b);
    expect(Array.isArray(delta)).toBe(true);
  });
});

describe("applyDelta", () => {
  it("returns clone unchanged when delta is an array (no-op)", () => {
    const obj = { code: "hello", html: "<p>hello</p>" };
    const emptyDelta = [] as unknown as import("jsondiffpatch").Delta;
    const result = applyDelta(obj, emptyDelta);
    expect(result).toEqual(obj);
    // Should be a different reference (deep clone)
    expect(result).not.toBe(obj);
  });

  it("applies a real delta to produce patched object", () => {
    const oldObj = { code: "hello", html: "", css: "" };
    const newObj = { code: "world", html: "", css: "" };
    const delta = createDelta(oldObj, newObj);
    const patched = applyDelta(oldObj, delta);
    expect(patched.code).toBe("world");
  });

  it("does not mutate the original object", () => {
    const oldObj = { code: "hello", count: 1 };
    const newObj = { code: "changed", count: 2 };
    const delta = createDelta(oldObj, newObj);
    applyDelta(oldObj, delta);
    expect(oldObj.code).toBe("hello");
    expect(oldObj.count).toBe(1);
  });

  it("round-trips: apply(createDelta(a, b)) equals b", () => {
    const a = { name: "Alice", score: 10 };
    const b = { name: "Bob", score: 20 };
    const delta = createDelta(a, b);
    const result = applyDelta(a, delta);
    expect(result).toEqual(b);
  });
});
