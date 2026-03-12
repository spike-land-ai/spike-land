import { describe, expect, it } from "vitest";
import { lazy } from "../../../../src/core/react-engine/react/ReactLazy.js";
import { REACT_LAZY_TYPE } from "../../../../src/core/react-engine/react/ReactSymbols.js";

describe("lazy", () => {
  it("creates lazy component with correct $$typeof", () => {
    const lazyComp = lazy(() => Promise.resolve({ default: () => null }));
    expect(lazyComp.$$typeof).toBe(REACT_LAZY_TYPE);
  });

  it("has _payload and _init", () => {
    const lazyComp = lazy(() => Promise.resolve({ default: () => null }));
    expect(lazyComp._payload).toBeDefined();
    expect(typeof lazyComp._init).toBe("function");
  });

  it("_payload starts in uninitialized state (-1)", () => {
    const lazyComp = lazy(() => Promise.resolve({ default: () => null }));
    expect(lazyComp._payload._status).toBe(-1);
  });

  it("calling _init triggers the loader and throws (pending promise)", () => {
    let resolveFn: (val: { default: () => null }) => void;
    const loader = () =>
      new Promise<{ default: () => null }>((resolve) => {
        resolveFn = resolve;
      });
    const lazyComp = lazy(loader);
    // First call should throw (the promise) since it's pending
    expect(() => lazyComp._init(lazyComp._payload)).toThrow();
    // Status should now be 0 (Pending) or 1 (Resolved) depending on timing
    expect(lazyComp._payload._status).toBeGreaterThanOrEqual(0);
    // Suppress unhandled promise rejection
    resolveFn({ default: () => null });
  });

  it("resolves after promise resolves", async () => {
    const MyComp = () => null;
    const lazyComp = lazy(() => Promise.resolve({ default: MyComp }));

    // First call initializes (throws promise)
    try {
      lazyComp._init(lazyComp._payload);
    } catch (_e) {
      // expected to throw the pending promise
    }

    // Wait for microtasks
    await Promise.resolve();
    await Promise.resolve();

    // Now should be resolved (status = 1)
    expect(lazyComp._payload._status).toBe(1);
    const result = lazyComp._init(lazyComp._payload);
    expect(result).toBe(MyComp);
  });

  it("rejects on loader failure", async () => {
    const err = new Error("load failed");
    const lazyComp = lazy(() => Promise.reject(err));

    // First call initializes (throws promise)
    try {
      lazyComp._init(lazyComp._payload);
    } catch (_e) {
      // expected
    }

    await Promise.resolve();
    await Promise.resolve();

    // Status should be 2 (Rejected)
    expect(lazyComp._payload._status).toBe(2);
    expect(() => lazyComp._init(lazyComp._payload)).toThrow(err);
  });

  it("each lazy() call is independent", () => {
    const comp1 = lazy(() => Promise.resolve({ default: () => null }));
    const comp2 = lazy(() => Promise.resolve({ default: () => null }));
    expect(comp1._payload).not.toBe(comp2._payload);
  });
});
