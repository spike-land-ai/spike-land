import { describe, it, expect } from "vitest";
import {
  mapChildren,
  forEachChildren,
  countChildren,
  toArray,
  onlyChild,
} from "../../react/ReactChildren.js";
import { createElement, isValidElement } from "../../react/ReactElement.js";

describe("mapChildren", () => {
  it("returns null for null children", () => {
    expect(mapChildren(null, (c) => c)).toBeNull();
  });

  it("returns undefined for undefined children", () => {
    expect(mapChildren(undefined, (c) => c)).toBeUndefined();
  });

  it("maps a single element", () => {
    const el = createElement("div", null);
    const result = mapChildren(el, (child) => child);
    expect(result).toHaveLength(1);
    expect(isValidElement(result![0])).toBe(true);
  });

  it("maps an array of elements", () => {
    const children = [
      createElement("div", null),
      createElement("span", null),
    ];
    const result = mapChildren(children, (child) => child);
    expect(result).toHaveLength(2);
  });

  it("maps string children", () => {
    const result = mapChildren("hello", (child) => child);
    expect(result).toHaveLength(1);
    expect(result![0]).toBe("hello");
  });

  it("maps number children", () => {
    const result = mapChildren(42, (child) => child);
    expect(result).toHaveLength(1);
    expect(result![0]).toBe(42);
  });

  it("provides correct index to callback", () => {
    const children = [
      createElement("div", null),
      createElement("span", null),
      createElement("p", null),
    ];
    const indices: number[] = [];
    mapChildren(children, (child, index) => {
      indices.push(index);
      return child;
    });
    expect(indices).toEqual([0, 1, 2]);
  });

  it("callback transform is applied", () => {
    const el = createElement("div", null);
    const result = mapChildren(el, () => createElement("span", null));
    expect(result).toHaveLength(1);
    expect((result![0] as { type: string }).type).toBe("span");
  });

  it("skips null returns from callback", () => {
    const children = [
      createElement("div", null),
      createElement("span", null),
    ];
    const result = mapChildren(children, (_child, index) =>
      index === 0 ? null : _child,
    );
    // null returns are skipped
    expect(result).toHaveLength(1);
  });

  it("handles boolean children by treating as null (skipped when callback returns null)", () => {
    // Booleans become null internally; callback receives null and returns null,
    // which mapIntoArray does not push (null is falsy check: mappedChild != null fails)
    const result = mapChildren(true as unknown as null, (child) => child);
    expect(result).toHaveLength(0);
  });

  it("throws for plain object children", () => {
    expect(() => {
      mapChildren({ key: "value" } as unknown as null, (c) => c);
    }).toThrow();
  });
});

describe("forEachChildren", () => {
  it("calls callback for each child", () => {
    const children = [
      createElement("div", null),
      createElement("span", null),
    ];
    const visited: unknown[] = [];
    forEachChildren(children, (child) => visited.push(child));
    expect(visited).toHaveLength(2);
  });

  it("returns void (not the children)", () => {
    const result = forEachChildren(createElement("div", null), () => {});
    expect(result).toBeUndefined();
  });

  it("handles null children gracefully", () => {
    expect(() => forEachChildren(null, () => {})).not.toThrow();
  });

  it("provides index to callback", () => {
    const indices: number[] = [];
    forEachChildren(
      [createElement("a", null), createElement("b", null)],
      (_child, index) => indices.push(index),
    );
    expect(indices).toEqual([0, 1]);
  });
});

describe("countChildren", () => {
  it("returns 0 for null", () => {
    expect(countChildren(null)).toBe(0);
  });

  it("returns 1 for a single element", () => {
    expect(countChildren(createElement("div", null))).toBe(1);
  });

  it("returns correct count for array", () => {
    const children = [
      createElement("div", null),
      createElement("span", null),
      createElement("p", null),
    ];
    expect(countChildren(children)).toBe(3);
  });

  it("returns 1 for a string child", () => {
    expect(countChildren("hello")).toBe(1);
  });

  it("returns 1 for a number child", () => {
    expect(countChildren(42)).toBe(1);
  });

  it("counts nested array children", () => {
    const nested = [
      createElement("div", null),
      [createElement("span", null), createElement("p", null)],
    ];
    expect(countChildren(nested)).toBe(3);
  });
});

describe("toArray", () => {
  it("returns empty array for null", () => {
    expect(toArray(null)).toEqual([]);
  });

  it("returns empty array for undefined", () => {
    expect(toArray(undefined)).toEqual([]);
  });

  it("returns array with single element for single child", () => {
    const el = createElement("div", null);
    const result = toArray(el);
    expect(result).toHaveLength(1);
    expect(isValidElement(result[0])).toBe(true);
  });

  it("flattens array children", () => {
    const children = [
      createElement("div", null),
      createElement("span", null),
    ];
    const result = toArray(children);
    expect(result).toHaveLength(2);
  });

  it("returns array type", () => {
    const result = toArray(createElement("div", null));
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("onlyChild", () => {
  it("returns the single child element", () => {
    const el = createElement("div", null);
    expect(onlyChild(el)).toBe(el);
  });

  it("throws for non-element children", () => {
    expect(() => onlyChild("text" as unknown as null)).toThrow(
      "React.Children.only expected to receive a single React element child.",
    );
  });

  it("throws for null", () => {
    expect(() => onlyChild(null)).toThrow();
  });

  it("throws for number", () => {
    expect(() => onlyChild(42 as unknown as null)).toThrow();
  });
});
