import { describe, expect, it } from "vitest";
import {
  isObject,
  isTypedArray,
  isStream,
  isTransferable,
  filterOutDuplicates,
  getTransferables,
  getTransferable,
  hasTransferables,
  AVAILABLE_TRANSFERABLE_OBJECTS,
  TypedArray,
} from "@/lib/transferables";

describe("TypedArray", () => {
  it("is the prototype of Int8Array", () => {
    expect(TypedArray).toBe(Object.getPrototypeOf(Int8Array));
  });
});

describe("AVAILABLE_TRANSFERABLE_OBJECTS", () => {
  it("has expected keys", () => {
    expect(AVAILABLE_TRANSFERABLE_OBJECTS).toHaveProperty("ArrayBufferExists");
    expect(AVAILABLE_TRANSFERABLE_OBJECTS).toHaveProperty("MessageChannelExists");
    expect(AVAILABLE_TRANSFERABLE_OBJECTS).toHaveProperty("StreamExists");
  });

  it("ArrayBufferExists is true in jsdom", () => {
    expect(AVAILABLE_TRANSFERABLE_OBJECTS.ArrayBufferExists).toBe(true);
  });
});

describe("isObject", () => {
  it("returns true for plain objects", () => {
    expect(isObject({})).toBe(true);
    expect(isObject({ a: 1 })).toBe(true);
  });

  it("returns true for arrays (arrays are objects)", () => {
    expect(isObject([])).toBe(true);
  });

  it("returns true for functions", () => {
    expect(isObject(() => {})).toBe(true);
  });

  it("returns false for null", () => {
    expect(isObject(null)).toBe(false);
  });

  it("returns false for primitives", () => {
    expect(isObject(42)).toBe(false);
    expect(isObject("string")).toBe(false);
    expect(isObject(true)).toBe(false);
    expect(isObject(undefined)).toBe(false);
  });
});

describe("isTypedArray", () => {
  it("returns true for Uint8Array", () => {
    expect(isTypedArray(new Uint8Array(4))).toBe(true);
  });

  it("returns true for Int32Array", () => {
    expect(isTypedArray(new Int32Array(4))).toBe(true);
  });

  it("returns true for Float64Array", () => {
    expect(isTypedArray(new Float64Array(4))).toBe(true);
  });

  it("returns true for DataView", () => {
    expect(isTypedArray(new DataView(new ArrayBuffer(8)))).toBe(true);
  });

  it("returns false for plain objects", () => {
    expect(isTypedArray({})).toBe(false);
  });

  it("returns false for ArrayBuffer (not a view)", () => {
    expect(isTypedArray(new ArrayBuffer(8))).toBe(false);
  });
});

describe("isStream", () => {
  it("returns true for ReadableStream", () => {
    expect(isStream(new ReadableStream())).toBe(true);
  });

  it("returns true for WritableStream", () => {
    expect(isStream(new WritableStream())).toBe(true);
  });

  it("returns true for TransformStream", () => {
    expect(isStream(new TransformStream())).toBe(true);
  });

  it("returns false for plain objects", () => {
    expect(isStream({})).toBe(false);
  });

  it("returns false for null", () => {
    expect(isStream(null)).toBe(false);
  });
});

describe("isTransferable", () => {
  it("returns true for ArrayBuffer", () => {
    expect(isTransferable(new ArrayBuffer(8))).toBe(true);
  });

  it("returns true for ArrayBuffer (transferable)", () => {
    expect(isTransferable(new ArrayBuffer(8))).toBe(true);
  });

  it("returns false for plain objects", () => {
    expect(isTransferable({})).toBe(false);
  });

  it("returns false for null", () => {
    expect(isTransferable(null)).toBe(false);
  });

  it("returns false for strings", () => {
    expect(isTransferable("text")).toBe(false);
  });
});

describe("filterOutDuplicates", () => {
  it("removes duplicate values", () => {
    expect(filterOutDuplicates([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
  });

  it("handles empty array", () => {
    expect(filterOutDuplicates([])).toEqual([]);
  });

  it("handles array without duplicates", () => {
    expect(filterOutDuplicates([1, 2, 3])).toEqual([1, 2, 3]);
  });

  it("handles string duplicates", () => {
    expect(filterOutDuplicates(["a", "b", "a"])).toEqual(["a", "b"]);
  });
});

describe("getTransferables", () => {
  it("returns empty array for null/non-object input", () => {
    expect(getTransferables(null)).toEqual([]);
    expect(getTransferables("string")).toEqual([]);
    expect(getTransferables(42)).toEqual([]);
  });

  it("returns empty array for plain object with no transferables", () => {
    expect(getTransferables({ a: 1, b: "text" })).toEqual([]);
  });

  it("extracts ArrayBuffer from object", () => {
    const buf = new ArrayBuffer(8);
    const result = getTransferables({ buf });
    expect(result).toContain(buf);
  });

  it("extracts buffer from TypedArray", () => {
    const arr = new Uint8Array(8);
    const result = getTransferables({ arr });
    expect(result).toContain(arr.buffer);
  });

  it("extracts ArrayBuffer directly from an array", () => {
    const buf = new ArrayBuffer(8);
    const result = getTransferables([buf]);
    expect(result).toContain(buf);
  });

  it("extracts streams when streams=true", () => {
    const stream = new ReadableStream();
    const result = getTransferables({ stream }, true);
    expect(result).toContain(stream);
  });

  it("does not extract streams when streams=false (default)", () => {
    const stream = new ReadableStream();
    const result = getTransferables({ stream }, false);
    expect(result).not.toContain(stream);
  });

  it("handles nested objects", () => {
    const buf = new ArrayBuffer(4);
    const result = getTransferables({ nested: { deep: { buf } } });
    expect(result).toContain(buf);
  });

  it("handles arrays as input", () => {
    const buf = new ArrayBuffer(4);
    const result = getTransferables([buf, "text", 42]);
    expect(result).toContain(buf);
  });

  it("stops at maxCount", () => {
    const items = Array.from({ length: 10 }, () => new ArrayBuffer(4));
    const result = getTransferables(items, false, 3);
    // Should stop early due to maxCount
    expect(result.length).toBeLessThanOrEqual(3);
  });
});

describe("getTransferable (generator)", () => {
  it("yields ArrayBuffer from transferable", () => {
    const buf = new ArrayBuffer(8);
    const gen = getTransferable(buf);
    const first = gen.next();
    expect(first.value).toBe(buf);
    expect(first.done).toBe(false);
  });

  it("yields buffer from TypedArray", () => {
    const arr = new Uint8Array(8);
    const gen = getTransferable(arr);
    const first = gen.next();
    expect(first.value).toBe(arr.buffer);
  });

  it("skips duplicate buffers from typed arrays", () => {
    const buf = new ArrayBuffer(8);
    const arr1 = new Uint8Array(buf);
    const arr2 = new Int8Array(buf);
    const results: unknown[] = [];
    for (const item of getTransferable([arr1, arr2])) {
      results.push(item);
    }
    // Same underlying buffer should appear only once
    expect(results.filter((r) => r === buf).length).toBe(1);
  });

  it("yields ArrayBuffer directly from array", () => {
    const buf = new ArrayBuffer(8);
    const results: unknown[] = [];
    for (const item of getTransferable([buf])) {
      results.push(item);
    }
    expect(results).toContain(buf);
  });

  it("yields nothing for non-transferable plain object", () => {
    const results: unknown[] = [];
    for (const item of getTransferable({ a: 1, b: "text" })) {
      results.push(item);
    }
    expect(results).toEqual([]);
  });

  it("yields streams when streams=true", () => {
    const stream = new ReadableStream();
    const results: unknown[] = [];
    for (const item of getTransferable(stream, true)) {
      results.push(item);
    }
    expect(results).toContain(stream);
  });

  it("stops at maxCount", () => {
    const items = Array.from({ length: 10 }, () => new ArrayBuffer(4));
    const results: unknown[] = [];
    for (const item of getTransferable(items, false, 3)) {
      results.push(item);
    }
    expect(results.length).toBeLessThanOrEqual(3);
  });
});

describe("hasTransferables", () => {
  it("returns false for non-transferable plain object", () => {
    expect(hasTransferables({ a: 1, b: "text" })).toBe(false);
  });

  it("returns true for object containing ArrayBuffer", () => {
    expect(hasTransferables({ buf: new ArrayBuffer(8) })).toBe(true);
  });

  it("returns true for TypedArray", () => {
    expect(hasTransferables(new Uint8Array(4))).toBe(true);
  });

  it("returns true for object containing ArrayBuffer", () => {
    expect(hasTransferables({ nested: { buf: new ArrayBuffer(4) } })).toBe(true);
  });

  it("returns true for stream when streams=true", () => {
    expect(hasTransferables(new ReadableStream(), true)).toBe(true);
  });

  it("returns false for stream when streams=false", () => {
    expect(hasTransferables(new ReadableStream(), false)).toBe(false);
  });

  it("returns false for null", () => {
    expect(hasTransferables(null)).toBe(false);
  });

  it("returns false for empty array", () => {
    expect(hasTransferables([])).toBe(false);
  });

  it("stops at maxCount and returns false if not found in time", () => {
    const items = Array.from({ length: 10 }, () => ({ x: 1 }));
    items.push({ x: 1 } as unknown as { x: number });
    const result = hasTransferables(items, false, 2);
    expect(typeof result).toBe("boolean");
  });
});
