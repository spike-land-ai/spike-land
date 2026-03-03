import { describe, expect, it } from "vitest";
import { createContext } from "../../react/ReactContext.js";
import { REACT_CONSUMER_TYPE, REACT_CONTEXT_TYPE } from "../../react/ReactSymbols.js";

describe("createContext", () => {
  it("creates context with correct $$typeof", () => {
    const ctx = createContext("default");
    expect(ctx.$$typeof).toBe(REACT_CONTEXT_TYPE);
  });

  it("stores default value in _currentValue", () => {
    const ctx = createContext(42);
    expect(ctx._currentValue).toBe(42);
  });

  it("stores default value in _currentValue2", () => {
    const ctx = createContext("hello");
    expect(ctx._currentValue2).toBe("hello");
  });

  it("Provider is the context itself", () => {
    const ctx = createContext(null);
    expect(ctx.Provider).toBe(ctx);
  });

  it("Consumer has correct $$typeof", () => {
    const ctx = createContext(0);
    expect(ctx.Consumer.$$typeof).toBe(REACT_CONSUMER_TYPE);
  });

  it("Consumer references the context", () => {
    const ctx = createContext(true);
    expect(ctx.Consumer._context).toBe(ctx);
  });

  it("works with object default value", () => {
    const defaultVal = { user: "anonymous", role: "guest" };
    const ctx = createContext(defaultVal);
    expect(ctx._currentValue).toStrictEqual(defaultVal);
  });

  it("works with null default value", () => {
    const ctx = createContext(null);
    expect(ctx._currentValue).toBeNull();
  });

  it("works with undefined default value", () => {
    const ctx = createContext(undefined);
    expect(ctx._currentValue).toBeUndefined();
  });

  it("each call creates an independent context", () => {
    const ctx1 = createContext("a");
    const ctx2 = createContext("b");
    expect(ctx1).not.toBe(ctx2);
    expect(ctx1._currentValue).toBe("a");
    expect(ctx2._currentValue).toBe("b");
  });

  it("allows direct mutation of _currentValue (as React does internally)", () => {
    const ctx = createContext(10);
    ctx._currentValue = 99;
    expect(ctx._currentValue).toBe(99);
  });
});
