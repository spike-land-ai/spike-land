import { describe, it, expect } from "vitest";
import { fnv1a } from "../../../src/core/shared-utils/core-logic/hash.js";
import { tryCatch } from "../../../src/core/shared-utils/core-logic/try-catch.js";

// ── FNV-1a hash ──────────────────────────────────────────────────────────────

describe("fnv1a", () => {
  it("returns a number", () => {
    expect(typeof fnv1a("hello")).toBe("number");
  });

  it("is deterministic for the same input", () => {
    expect(fnv1a("test-string")).toBe(fnv1a("test-string"));
  });

  it("returns different values for different inputs", () => {
    expect(fnv1a("abc")).not.toBe(fnv1a("abd"));
  });

  it("handles an empty string without throwing", () => {
    const result = fnv1a("");
    // The FNV offset basis is returned unchanged for empty input
    expect(result).toBe(0x811c9dc5);
  });

  it("returns a 32-bit unsigned integer (0 to 2^32 - 1)", () => {
    const inputs = ["hello", "world", "foo", "bar", "spike.land", "a".repeat(100)];
    for (const input of inputs) {
      const hash = fnv1a(input);
      expect(hash).toBeGreaterThanOrEqual(0);
      expect(hash).toBeLessThanOrEqual(0xffffffff);
    }
  });

  it("produces good distribution for similar strings", () => {
    const hashes = ["key1", "key2", "key3", "key4", "key5"].map(fnv1a);
    const unique = new Set(hashes);
    // All five should hash to different values
    expect(unique.size).toBe(5);
  });

  it("is consistent with known output for 'hello' (implementation-defined)", () => {
    // The implementation uses the FNV-1a offset basis 0x811c9dc5 and prime 0x01000193.
    // Verified by running the function: fnv1a("hello") = 2821698721
    expect(fnv1a("hello")).toBe(2821698721);
  });
});

// ── tryCatch ─────────────────────────────────────────────────────────────────

describe("tryCatch", () => {
  it("returns { data, error: null } on success", async () => {
    const { data, error } = await tryCatch(Promise.resolve(42));
    expect(data).toBe(42);
    expect(error).toBeNull();
  });

  it("returns { data: null, error } on rejection", async () => {
    const thrown = new Error("boom");
    const { data, error } = await tryCatch(Promise.reject(thrown));
    expect(data).toBeNull();
    expect(error).toBe(thrown);
  });

  it("works with string values", async () => {
    const { data, error } = await tryCatch(Promise.resolve("hello"));
    expect(data).toBe("hello");
    expect(error).toBeNull();
  });

  it("works with object values", async () => {
    const obj = { id: 1, name: "spike" };
    const { data } = await tryCatch(Promise.resolve(obj));
    expect(data).toEqual(obj);
  });

  it("works with null resolved values", async () => {
    const { data, error } = await tryCatch(Promise.resolve(null));
    expect(data).toBeNull();
    expect(error).toBeNull();
  });

  it("handles non-Error thrown values (e.g. string)", async () => {
    const { data, error } = await tryCatch<never, string>(Promise.reject("string error"));
    expect(data).toBeNull();
    expect(error).toBe("string error");
  });

  it("handles async functions naturally", async () => {
    async function fetchData(): Promise<number> {
      return 99;
    }
    const { data, error } = await tryCatch(fetchData());
    expect(data).toBe(99);
    expect(error).toBeNull();
  });

  it("allows narrowing: data is available only when error is null", async () => {
    const result = await tryCatch(Promise.resolve("value"));
    if (result.error === null) {
      // TypeScript would narrow data to string here
      expect(result.data).toBe("value");
    }
  });
});
