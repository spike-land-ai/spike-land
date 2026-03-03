import { describe, expect, it } from "vitest";
import { cloneElement, createElement, isValidElement } from "../../react/ReactElement.js";
import { REACT_ELEMENT_TYPE } from "../../react/ReactSymbols.js";

describe("createElement", () => {
  it("creates element with string type", () => {
    const el = createElement("div", null);
    expect(el.$$typeof).toBe(REACT_ELEMENT_TYPE);
    expect(el.type).toBe("div");
    expect(el.key).toBeNull();
    expect(el.ref).toBeNull();
    expect(el._owner).toBeNull();
  });

  it("creates element with function type", () => {
    const MyComponent = () => null;
    const el = createElement(MyComponent, null);
    expect(el.type).toBe(MyComponent);
  });

  it("extracts key from config as string", () => {
    const el = createElement("div", { key: 42 });
    expect(el.key).toBe("42");
  });

  it("extracts ref from config", () => {
    const ref = { current: null };
    const el = createElement("div", { ref });
    expect(el.ref).toBe(ref);
  });

  it("excludes key and ref from props", () => {
    const ref = { current: null };
    const el = createElement("div", { key: "k", ref, className: "foo" });
    expect((el.props as Record<string, unknown>).key).toBeUndefined();
    expect((el.props as Record<string, unknown>).ref).toBeUndefined();
    expect((el.props as Record<string, unknown>).className).toBe("foo");
  });

  it("excludes __self and __source from props", () => {
    const el = createElement("div", {
      __self: "self",
      __source: "source",
      id: "x",
    });
    expect((el.props as Record<string, unknown>).__self).toBeUndefined();
    expect((el.props as Record<string, unknown>).__source).toBeUndefined();
    expect((el.props as Record<string, unknown>).id).toBe("x");
  });

  it("handles null config", () => {
    const el = createElement("div", null);
    expect(el.props).toEqual({});
  });

  it("handles undefined config", () => {
    const el = createElement("div", undefined);
    expect(el.props).toEqual({});
  });

  it("sets single child in props.children", () => {
    const child = createElement("span", null);
    const el = createElement("div", null, child);
    expect((el.props as Record<string, unknown>).children).toBe(child);
  });

  it("sets multiple children as array in props.children", () => {
    const child1 = createElement("span", null);
    const child2 = createElement("p", null);
    const el = createElement("div", null, child1, child2);
    const children = (el.props as Record<string, unknown>).children as unknown[];
    expect(Array.isArray(children)).toBe(true);
    expect(children).toHaveLength(2);
    expect(children[0]).toBe(child1);
    expect(children[1]).toBe(child2);
  });

  it("no children means no children prop", () => {
    const el = createElement("div", { id: "x" });
    expect((el.props as Record<string, unknown>).children).toBeUndefined();
  });

  it("applies defaultProps for missing props on object type", () => {
    // createElement only applies defaultProps when typeof type === "object"
    // (i.e. class-like objects, not plain functions)
    const MyComp = {
      defaultProps: { color: "red", size: 10 },
      render: () => null,
    };
    const el = createElement(MyComp, { size: 20 });
    expect((el.props as Record<string, unknown>).color).toBe("red");
    expect((el.props as Record<string, unknown>).size).toBe(20);
  });

  it("does not override provided props with defaultProps", () => {
    const MyComp = { defaultProps: { value: "default" }, render: () => null };
    const el = createElement(MyComp, { value: "provided" });
    expect((el.props as Record<string, unknown>).value).toBe("provided");
  });

  it("string children are set directly", () => {
    const el = createElement("div", null, "hello");
    expect((el.props as Record<string, unknown>).children).toBe("hello");
  });

  it("number children are set directly", () => {
    const el = createElement("div", null, 42);
    expect((el.props as Record<string, unknown>).children).toBe(42);
  });
});

describe("isValidElement", () => {
  it("returns true for valid React elements", () => {
    const el = createElement("div", null);
    expect(isValidElement(el)).toBe(true);
  });

  it("returns false for null", () => {
    expect(isValidElement(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isValidElement(undefined)).toBe(false);
  });

  it("returns false for plain objects", () => {
    expect(isValidElement({ type: "div" })).toBe(false);
  });

  it("returns false for strings", () => {
    expect(isValidElement("div")).toBe(false);
  });

  it("returns false for numbers", () => {
    expect(isValidElement(42)).toBe(false);
  });

  it("returns false for objects with wrong $$typeof", () => {
    expect(isValidElement({ $$typeof: Symbol.for("not.react") })).toBe(false);
  });
});

describe("cloneElement", () => {
  it("clones a basic element preserving type", () => {
    const original = createElement("div", { className: "foo" });
    const cloned = cloneElement(original, null);
    expect(cloned.type).toBe("div");
    expect(cloned.$$typeof).toBe(REACT_ELEMENT_TYPE);
  });

  it("merges new props over existing ones", () => {
    const original = createElement("div", { className: "foo", id: "bar" });
    const cloned = cloneElement(original, { id: "baz" });
    expect((cloned.props as Record<string, unknown>).className).toBe("foo");
    expect((cloned.props as Record<string, unknown>).id).toBe("baz");
  });

  it("overrides key from config", () => {
    const original = createElement("div", { key: "old" });
    const cloned = cloneElement(original, { key: "new" });
    expect(cloned.key).toBe("new");
  });

  it("overrides ref from config", () => {
    const oldRef = { current: null };
    const newRef = { current: null };
    const original = createElement("div", { ref: oldRef });
    const cloned = cloneElement(original, { ref: newRef });
    expect(cloned.ref).toBe(newRef);
  });

  it("preserves original key when config has no key", () => {
    const original = createElement("div", { key: "mykey" });
    const cloned = cloneElement(original, { className: "foo" });
    expect(cloned.key).toBe("mykey");
  });

  it("replaces children when passed as extra args", () => {
    const original = createElement("div", null, createElement("span", null));
    const newChild = createElement("p", null);
    const cloned = cloneElement(original, null, newChild);
    expect((cloned.props as Record<string, unknown>).children).toBe(newChild);
  });

  it("sets multiple children when multiple extra args passed", () => {
    const original = createElement("div", null);
    const c1 = createElement("span", null);
    const c2 = createElement("p", null);
    const cloned = cloneElement(original, null, c1, c2);
    const children = (cloned.props as Record<string, unknown>).children as unknown[];
    expect(Array.isArray(children)).toBe(true);
    expect(children).toHaveLength(2);
  });

  it("throws when element is null", () => {
    expect(() => cloneElement(null as never, null)).toThrow();
  });

  it("throws when element is undefined", () => {
    expect(() => cloneElement(undefined as never, null)).toThrow();
  });

  it("excludes key and ref from merged props", () => {
    const original = createElement("div", { className: "foo" });
    const cloned = cloneElement(original, { key: "k", className: "bar" });
    expect((cloned.props as Record<string, unknown>).key).toBeUndefined();
  });
});
