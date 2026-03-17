import { describe, expect, it } from "vitest";
import {
  Fragment,
  jsx,
  jsxs,
} from "../../../../src/core/react-engine/core-logic/react/jsx-runtime.js";
import {
  REACT_ELEMENT_TYPE,
  REACT_FRAGMENT_TYPE,
} from "../../../../src/core/react-engine/core-logic/react/ReactSymbols.js";

describe("jsx runtime", () => {
  describe("jsx", () => {
    it("creates element with correct $$typeof", () => {
      const el = jsx("div", {});
      expect(el.$$typeof).toBe(REACT_ELEMENT_TYPE);
    });

    it("creates element with correct type", () => {
      const el = jsx("span", {});
      expect(el.type).toBe("span");
    });

    it("passes props to element", () => {
      const el = jsx("div", { className: "foo", id: "bar" });
      expect((el.props as Record<string, unknown>).className).toBe("foo");
      expect((el.props as Record<string, unknown>).id).toBe("bar");
    });

    it("key is null when not provided", () => {
      const el = jsx("div", {});
      expect(el.key).toBeNull();
    });

    it("key from maybeKey argument takes precedence", () => {
      const el = jsx("div", {}, "outer-key");
      expect(el.key).toBe("outer-key");
    });

    it("key from config.key is used when maybeKey is undefined", () => {
      const el = jsx("div", { key: "config-key" });
      expect(el.key).toBe("config-key");
    });

    it("key is coerced to string from config", () => {
      const el = jsx("div", { key: 123 });
      expect(el.key).toBe("123");
    });

    it("key is coerced to string from maybeKey", () => {
      const el = jsx("div", {}, 456);
      expect(el.key).toBe("456");
    });

    it("excludes key from props", () => {
      const el = jsx("div", { key: "k", className: "foo" });
      expect((el.props as Record<string, unknown>).key).toBeUndefined();
      expect((el.props as Record<string, unknown>).className).toBe("foo");
    });

    it("ref is extracted from props", () => {
      const ref = { current: null };
      const el = jsx("div", { ref });
      expect(el.ref).toBe(ref);
    });

    it("_owner is null", () => {
      const el = jsx("div", {});
      expect(el._owner).toBeNull();
    });

    it("works with function component type", () => {
      const MyComp = (_props: { name: string }) => null;
      const el = jsx(MyComp, { name: "test" });
      expect(el.type).toBe(MyComp);
    });

    it("children passed via props object", () => {
      const child = jsx("span", {});
      const el = jsx("div", { children: child });
      expect((el.props as Record<string, unknown>).children).toBe(child);
    });
  });

  describe("jsxs", () => {
    it("is the same as jsx (both are jsxProd)", () => {
      // jsxs is the same function as jsx in production builds
      const el1 = jsx("div", { className: "foo" });
      const el2 = jsxs("div", { className: "foo" });
      expect(el1.$$typeof).toBe(el2.$$typeof);
      expect(el1.type).toBe(el2.type);
      expect(el1.props).toEqual(el2.props);
    });

    it("creates element for multiple children", () => {
      const children = [jsx("span", {}), jsx("p", {})];
      const el = jsxs("div", { children });
      expect(Array.isArray((el.props as Record<string, unknown>).children)).toBe(true);
    });
  });

  describe("Fragment", () => {
    it("Fragment is the react.fragment symbol", () => {
      expect(Fragment).toBe(REACT_FRAGMENT_TYPE);
    });

    it("can be used as jsx type", () => {
      const el = jsx(Fragment, { children: jsx("div", {}) });
      expect(el.type).toBe(REACT_FRAGMENT_TYPE);
    });
  });
});
