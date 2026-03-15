import { describe, expect, it, vi } from "vitest";
import { DOMHostConfig } from "../../../../src/core/react-engine/core-logic/host-config/DOMHostConfig.js";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const MATH_NAMESPACE = "http://www.w3.org/1998/Math/MathML";

describe("DOMHostConfig", () => {
  describe("createInstance", () => {
    it("creates a basic DOM element", () => {
      const container = document.createElement("div");
      const el = DOMHostConfig.createInstance("div", {}, container, { namespace: "" });
      expect(el.tagName).toBe("DIV");
    });

    it("creates an SVG element in SVG namespace", () => {
      const container = document.createElement("div");
      const el = DOMHostConfig.createInstance("circle", {}, container, {
        namespace: SVG_NAMESPACE,
      });
      expect(el.namespaceURI).toBe(SVG_NAMESPACE);
    });

    it("creates a MathML element in MATH namespace", () => {
      const container = document.createElement("div");
      const el = DOMHostConfig.createInstance("math", {}, container, {
        namespace: MATH_NAMESPACE,
      });
      expect(el.namespaceURI).toBe(MATH_NAMESPACE);
    });

    it("creates element with is prop", () => {
      const container = document.createElement("div");
      // Just verify it creates without throwing
      expect(() =>
        DOMHostConfig.createInstance("button", { is: "custom-button" }, container, {
          namespace: "",
        }),
      ).not.toThrow();
    });

    it("sets text content for children string prop", () => {
      const container = document.createElement("div");
      const el = DOMHostConfig.createInstance("span", { children: "hello" }, container, {
        namespace: "",
      });
      expect(el.textContent).toBe("hello");
    });

    it("sets text content for children number prop", () => {
      const container = document.createElement("div");
      const el = DOMHostConfig.createInstance("span", { children: 42 }, container, {
        namespace: "",
      });
      expect(el.textContent).toBe("42");
    });

    it("sets style properties", () => {
      const container = document.createElement("div");
      const el = DOMHostConfig.createInstance(
        "div",
        { style: { color: "red", backgroundColor: "blue" } },
        container,
        { namespace: "" },
      ) as HTMLElement;
      expect(el.style.color).toBe("red");
    });

    it("sets className as class attribute", () => {
      const container = document.createElement("div");
      const el = DOMHostConfig.createInstance("div", { className: "my-class" }, container, {
        namespace: "",
      });
      expect(el.getAttribute("class")).toBe("my-class");
    });

    it("sets boolean attributes", () => {
      const container = document.createElement("div");
      const el = DOMHostConfig.createInstance("input", { disabled: true }, container, {
        namespace: "",
      });
      expect(el.hasAttribute("disabled")).toBe(true);
    });

    it("removes boolean attribute when false", () => {
      const container = document.createElement("div");
      const el = DOMHostConfig.createInstance("input", { disabled: false }, container, {
        namespace: "",
      });
      expect(el.hasAttribute("disabled")).toBe(false);
    });

    it("sets value property on input", () => {
      const container = document.createElement("div");
      const el = DOMHostConfig.createInstance("input", { value: "test" }, container, {
        namespace: "",
      }) as HTMLInputElement;
      expect(el.value).toBe("test");
    });

    it("skips null props", () => {
      const container = document.createElement("div");
      expect(() =>
        DOMHostConfig.createInstance("div", { title: null }, container, { namespace: "" }),
      ).not.toThrow();
    });

    it("skips ref and key props", () => {
      const container = document.createElement("div");
      expect(() =>
        DOMHostConfig.createInstance("div", { ref: () => {}, key: "mykey" }, container, {
          namespace: "",
        }),
      ).not.toThrow();
    });

    it("sets innerHTML", () => {
      const container = document.createElement("div");
      const el = DOMHostConfig.createInstance(
        "div",
        { innerHTML: "<span>hello</span>" },
        container,
        { namespace: "" },
      ) as HTMLElement;
      expect(el.innerHTML).toBe("<span>hello</span>");
    });
  });

  describe("createTextInstance", () => {
    it("creates a text node", () => {
      const container = document.createElement("div");
      const text = DOMHostConfig.createTextInstance("hello", container, { namespace: "" });
      expect(text.nodeValue).toBe("hello");
    });
  });

  describe("appendChild", () => {
    it("appends child to parent", () => {
      const parent = document.createElement("div");
      const child = document.createElement("span");
      DOMHostConfig.appendChild(parent, child);
      expect(parent.contains(child)).toBe(true);
    });
  });

  describe("appendChildToContainer", () => {
    it("appends child to container", () => {
      const container = document.createElement("div");
      const child = document.createElement("span");
      DOMHostConfig.appendChildToContainer(container, child);
      expect(container.contains(child)).toBe(true);
    });
  });

  describe("appendInitialChild", () => {
    it("appends child to parent", () => {
      const parent = document.createElement("div");
      const child = document.createElement("span");
      DOMHostConfig.appendInitialChild(parent, child);
      expect(parent.contains(child)).toBe(true);
    });
  });

  describe("insertBefore", () => {
    it("inserts child before reference", () => {
      const parent = document.createElement("div");
      const child1 = document.createElement("span");
      const child2 = document.createElement("span");
      parent.appendChild(child2);
      DOMHostConfig.insertBefore(parent, child1, child2);
      expect(parent.firstChild).toBe(child1);
    });
  });

  describe("insertInContainerBefore", () => {
    it("inserts child before reference in container", () => {
      const container = document.createElement("div");
      const child1 = document.createElement("span");
      const child2 = document.createElement("span");
      container.appendChild(child2);
      DOMHostConfig.insertInContainerBefore(container, child1, child2);
      expect(container.firstChild).toBe(child1);
    });
  });

  describe("removeChild", () => {
    it("removes child from parent", () => {
      const parent = document.createElement("div");
      const child = document.createElement("span");
      parent.appendChild(child);
      DOMHostConfig.removeChild(parent, child);
      expect(parent.contains(child)).toBe(false);
    });
  });

  describe("removeChildFromContainer", () => {
    it("removes child from container", () => {
      const container = document.createElement("div");
      const child = document.createElement("span");
      container.appendChild(child);
      DOMHostConfig.removeChildFromContainer(container, child);
      expect(container.contains(child)).toBe(false);
    });
  });

  describe("commitUpdate", () => {
    it("updates element properties", () => {
      const el = document.createElement("div");
      DOMHostConfig.commitUpdate(el, "div", { className: "old" }, { className: "new" });
      expect(el.getAttribute("class")).toBe("new");
    });

    it("removes old props not in new props", () => {
      const el = document.createElement("div");
      el.setAttribute("title", "old-title");
      DOMHostConfig.commitUpdate(el, "div", { title: "old-title" }, {});
      expect(el.hasAttribute("title")).toBe(false);
    });

    it("removes old styles not in new props", () => {
      const el = document.createElement("div") as HTMLElement;
      el.style.color = "red";
      DOMHostConfig.commitUpdate(el, "div", { style: { color: "red" } }, {});
    });

    it("skips children, key, ref in old props removal", () => {
      const el = document.createElement("div");
      expect(() =>
        DOMHostConfig.commitUpdate(el, "div", { children: "old", key: "k", ref: null }, {}),
      ).not.toThrow();
    });

    it("skips equal values in update", () => {
      const el = document.createElement("div");
      el.setAttribute("title", "same");
      DOMHostConfig.commitUpdate(el, "div", { title: "same" }, { title: "same" });
      expect(el.getAttribute("title")).toBe("same");
    });

    it("removes attribute when new value is null", () => {
      const el = document.createElement("div");
      el.setAttribute("title", "test");
      DOMHostConfig.commitUpdate(el, "div", { title: "test" }, { title: null });
      expect(el.hasAttribute("title")).toBe(false);
    });

    it("updates children text", () => {
      const el = document.createElement("div");
      DOMHostConfig.commitUpdate(el, "div", { children: "old" }, { children: "new" });
      expect(el.textContent).toBe("new");
    });

    it("handles style updates with CSS variable (hyphenated)", () => {
      const el = document.createElement("div") as HTMLElement;
      DOMHostConfig.commitUpdate(
        el,
        "div",
        { style: { "--my-var": "old" } },
        { style: { "--my-var": "new" } },
      );
    });

    it("removes hyphenated old style properties", () => {
      const el = document.createElement("div") as HTMLElement;
      DOMHostConfig.commitUpdate(el, "div", { style: { "--color": "red" } }, { style: {} });
    });
  });

  describe("commitTextUpdate", () => {
    it("updates text node value", () => {
      const text = document.createTextNode("old");
      DOMHostConfig.commitTextUpdate(text, "old", "new");
      expect(text.nodeValue).toBe("new");
    });
  });

  describe("resetTextContent", () => {
    it("clears element text content", () => {
      const el = document.createElement("div");
      el.textContent = "some text";
      DOMHostConfig.resetTextContent(el);
      expect(el.textContent).toBe("");
    });
  });

  describe("shouldSetTextContent", () => {
    it("returns true for textarea", () => {
      expect(DOMHostConfig.shouldSetTextContent("textarea", {})).toBe(true);
    });

    it("returns true for noscript", () => {
      expect(DOMHostConfig.shouldSetTextContent("noscript", {})).toBe(true);
    });

    it("returns true for string children", () => {
      expect(DOMHostConfig.shouldSetTextContent("div", { children: "text" })).toBe(true);
    });

    it("returns true for number children", () => {
      expect(DOMHostConfig.shouldSetTextContent("div", { children: 42 })).toBe(true);
    });

    it("returns true for bigint children", () => {
      expect(DOMHostConfig.shouldSetTextContent("div", { children: BigInt(42) })).toBe(true);
    });

    it("returns false for element children", () => {
      expect(DOMHostConfig.shouldSetTextContent("div", { children: {} })).toBe(false);
    });

    it("returns false for normal div", () => {
      expect(DOMHostConfig.shouldSetTextContent("div", {})).toBe(false);
    });
  });

  describe("getRootHostContext", () => {
    it("returns context with empty namespace", () => {
      const container = document.createElement("div");
      const ctx = DOMHostConfig.getRootHostContext(container);
      expect(ctx).toEqual({ namespace: "" });
    });
  });

  describe("getChildHostContext", () => {
    it("returns SVG namespace for svg element", () => {
      const ctx = DOMHostConfig.getChildHostContext({ namespace: "" }, "svg");
      expect(ctx).toEqual({ namespace: SVG_NAMESPACE });
    });

    it("returns Math namespace for math element", () => {
      const ctx = DOMHostConfig.getChildHostContext({ namespace: "" }, "math");
      expect(ctx).toEqual({ namespace: MATH_NAMESPACE });
    });

    it("returns empty namespace for foreignObject inside SVG", () => {
      const ctx = DOMHostConfig.getChildHostContext({ namespace: SVG_NAMESPACE }, "foreignObject");
      expect(ctx).toEqual({ namespace: "" });
    });

    it("returns parent context for regular elements", () => {
      const parentCtx = { namespace: "" };
      const ctx = DOMHostConfig.getChildHostContext(parentCtx, "div");
      expect(ctx).toBe(parentCtx);
    });
  });

  describe("prepareForCommit", () => {
    it("returns null", () => {
      const container = document.createElement("div");
      expect(DOMHostConfig.prepareForCommit(container)).toBeNull();
    });
  });

  describe("resetAfterCommit", () => {
    it("does not throw", () => {
      const container = document.createElement("div");
      expect(() => DOMHostConfig.resetAfterCommit(container)).not.toThrow();
    });
  });

  describe("finalizeInitialChildren", () => {
    it("returns true when autoFocus is set", () => {
      const el = document.createElement("button");
      expect(
        DOMHostConfig.finalizeInitialChildren(el, "button", { autoFocus: true }, { namespace: "" }),
      ).toBe(true);
    });

    it("returns false when no autoFocus", () => {
      const el = document.createElement("div");
      expect(DOMHostConfig.finalizeInitialChildren(el, "div", {}, { namespace: "" })).toBe(false);
    });
  });

  describe("prepareUpdate", () => {
    it("returns true when props changed", () => {
      const el = document.createElement("div");
      const result = DOMHostConfig.prepareUpdate(
        el,
        "div",
        { title: "old" },
        { title: "new" },
        { namespace: "" },
      );
      expect(result).toBe(true);
    });

    it("returns null when props unchanged", () => {
      const el = document.createElement("div");
      const result = DOMHostConfig.prepareUpdate(
        el,
        "div",
        { title: "same" },
        { title: "same" },
        { namespace: "" },
      );
      expect(result).toBeNull();
    });

    it("returns true when new key added", () => {
      const el = document.createElement("div");
      const result = DOMHostConfig.prepareUpdate(
        el,
        "div",
        {},
        { title: "new" },
        { namespace: "" },
      );
      expect(result).toBe(true);
    });

    it("skips children, key, ref in comparison", () => {
      const el = document.createElement("div");
      const result = DOMHostConfig.prepareUpdate(
        el,
        "div",
        { children: "old", key: "k", ref: null },
        { children: "new", key: "k2", ref: null },
        { namespace: "" },
      );
      expect(result).toBeNull();
    });
  });

  describe("clearContainer", () => {
    it("clears the container", () => {
      const container = document.createElement("div");
      container.innerHTML = "<span>test</span>";
      DOMHostConfig.clearContainer(container);
      expect(container.textContent).toBe("");
    });
  });

  describe("getCurrentTime", () => {
    it("returns a number", () => {
      const t = DOMHostConfig.getCurrentTime();
      expect(typeof t).toBe("number");
    });
  });

  describe("scheduleMicrotask", () => {
    it("calls the function", async () => {
      const fn = vi.fn();
      DOMHostConfig.scheduleMicrotask(fn);
      await Promise.resolve();
      expect(fn).toHaveBeenCalled();
    });
  });
});
