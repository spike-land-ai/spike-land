import { describe, expect, it } from "vitest";
import {
  getIteratorFn,
  REACT_CONSUMER_TYPE,
  REACT_CONTEXT_TYPE,
  REACT_ELEMENT_TYPE,
  REACT_FORWARD_REF_TYPE,
  REACT_FRAGMENT_TYPE,
  REACT_LAZY_TYPE,
  REACT_MEMO_TYPE,
  REACT_PORTAL_TYPE,
  REACT_PROFILER_TYPE,
  REACT_STRICT_MODE_TYPE,
  REACT_SUSPENSE_TYPE,
} from "../../../../src/core/react-engine/core-logic/react/ReactSymbols.js";

describe("React Symbols", () => {
  it("REACT_ELEMENT_TYPE is a well-known symbol", () => {
    expect(typeof REACT_ELEMENT_TYPE).toBe("symbol");
    expect(REACT_ELEMENT_TYPE).toBe(Symbol.for("react.transitional.element"));
  });

  it("REACT_PORTAL_TYPE is a well-known symbol", () => {
    expect(REACT_PORTAL_TYPE).toBe(Symbol.for("react.portal"));
  });

  it("REACT_FRAGMENT_TYPE is a well-known symbol", () => {
    expect(REACT_FRAGMENT_TYPE).toBe(Symbol.for("react.fragment"));
  });

  it("REACT_STRICT_MODE_TYPE is a well-known symbol", () => {
    expect(REACT_STRICT_MODE_TYPE).toBe(Symbol.for("react.strict_mode"));
  });

  it("REACT_PROFILER_TYPE is a well-known symbol", () => {
    expect(REACT_PROFILER_TYPE).toBe(Symbol.for("react.profiler"));
  });

  it("REACT_CONSUMER_TYPE is a well-known symbol", () => {
    expect(REACT_CONSUMER_TYPE).toBe(Symbol.for("react.consumer"));
  });

  it("REACT_CONTEXT_TYPE is a well-known symbol", () => {
    expect(REACT_CONTEXT_TYPE).toBe(Symbol.for("react.context"));
  });

  it("REACT_FORWARD_REF_TYPE is a well-known symbol", () => {
    expect(REACT_FORWARD_REF_TYPE).toBe(Symbol.for("react.forward_ref"));
  });

  it("REACT_SUSPENSE_TYPE is a well-known symbol", () => {
    expect(REACT_SUSPENSE_TYPE).toBe(Symbol.for("react.suspense"));
  });

  it("REACT_MEMO_TYPE is a well-known symbol", () => {
    expect(REACT_MEMO_TYPE).toBe(Symbol.for("react.memo"));
  });

  it("REACT_LAZY_TYPE is a well-known symbol", () => {
    expect(REACT_LAZY_TYPE).toBe(Symbol.for("react.lazy"));
  });

  it("all symbols are unique", () => {
    const symbols = [
      REACT_ELEMENT_TYPE,
      REACT_PORTAL_TYPE,
      REACT_FRAGMENT_TYPE,
      REACT_STRICT_MODE_TYPE,
      REACT_PROFILER_TYPE,
      REACT_CONSUMER_TYPE,
      REACT_CONTEXT_TYPE,
      REACT_FORWARD_REF_TYPE,
      REACT_SUSPENSE_TYPE,
      REACT_MEMO_TYPE,
      REACT_LAZY_TYPE,
    ];
    const unique = new Set(symbols);
    expect(unique.size).toBe(symbols.length);
  });
});

describe("getIteratorFn", () => {
  it("returns null for null input", () => {
    expect(getIteratorFn(null)).toBeNull();
  });

  it("returns null for strings (primitive)", () => {
    // strings are iterable but not objects
    expect(getIteratorFn("hello")).toBeNull();
  });

  it("returns null for numbers", () => {
    expect(getIteratorFn(42)).toBeNull();
  });

  it("returns iterator function for arrays", () => {
    const fn = getIteratorFn([1, 2, 3]);
    expect(typeof fn).toBe("function");
  });

  it("returns iterator function for Sets", () => {
    const fn = getIteratorFn(new Set([1, 2]));
    expect(typeof fn).toBe("function");
  });

  it("returns iterator function for Maps", () => {
    const fn = getIteratorFn(new Map([["a", 1]]));
    expect(typeof fn).toBe("function");
  });

  it("returns iterator function for custom iterables", () => {
    const iterable = {
      [Symbol.iterator]() {
        let done = false;
        return {
          next() {
            if (!done) {
              done = true;
              return { value: 1, done: false };
            }
            return { value: undefined, done: true };
          },
        };
      },
    };
    const fn = getIteratorFn(iterable);
    expect(typeof fn).toBe("function");
  });

  it("returns null for plain objects without iterator", () => {
    expect(getIteratorFn({ a: 1 })).toBeNull();
  });
});
