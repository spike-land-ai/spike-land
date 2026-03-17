import { describe, expect, it } from "vitest";
import {
  createElement,
  createContext,
} from "../../../../src/core/react-engine/core-logic/react/index.js";
import { memo } from "../../../../src/core/react-engine/core-logic/react/ReactMemo.js";
import { forwardRef } from "../../../../src/core/react-engine/core-logic/react/ReactForwardRef.js";
import { lazy } from "../../../../src/core/react-engine/core-logic/react/ReactLazy.js";
import {
  renderToString,
  renderToReadableStream,
} from "../../../../src/core/react-engine/core-logic/server/ReactFizzServer.js";
import {
  REACT_ELEMENT_TYPE,
  REACT_FRAGMENT_TYPE,
  REACT_SUSPENSE_TYPE,
} from "../../../../src/core/react-engine/core-logic/react/ReactSymbols.js";

describe("renderToString", () => {
  it("renders a simple host element", () => {
    const el = createElement("div", null);
    const html = renderToString(el);
    expect(html).toBe("<div></div>");
  });

  it("renders element with text content", () => {
    const el = createElement("p", null, "Hello");
    const html = renderToString(el);
    expect(html).toContain("Hello");
  });

  it("renders element with number content", () => {
    const el = createElement("span", null, 42);
    const html = renderToString(el);
    expect(html).toContain("42");
  });

  it("renders nested elements", () => {
    const el = createElement("div", null, createElement("span", null, "child"));
    const html = renderToString(el);
    expect(html).toContain("<div>");
    expect(html).toContain("<span>");
    expect(html).toContain("child");
    expect(html).toContain("</span>");
    expect(html).toContain("</div>");
  });

  it("renders null as empty string", () => {
    const html = renderToString(null);
    expect(html).toBe("");
  });

  it("renders undefined as empty string", () => {
    const html = renderToString(undefined);
    expect(html).toBe("");
  });

  it("renders boolean as empty string", () => {
    expect(renderToString(true as unknown as null)).toBe("");
    expect(renderToString(false as unknown as null)).toBe("");
  });

  it("renders string node directly", () => {
    const html = renderToString("Hello World" as unknown as null);
    expect(html).toBe("Hello World");
  });

  it("renders number node", () => {
    const html = renderToString(42 as unknown as null);
    expect(html).toBe("42");
  });

  it("renders array of elements", () => {
    const el = [createElement("div", { key: "a" }, "A"), createElement("span", { key: "b" }, "B")];
    const html = renderToString(el as unknown as null);
    expect(html).toContain("<div>");
    expect(html).toContain("<span>");
  });

  it("renders fragment", () => {
    const el = createElement(
      REACT_FRAGMENT_TYPE,
      null,
      createElement("div", null, "Fragment child"),
    );
    const html = renderToString(el);
    expect(html).toContain("Fragment child");
    expect(html).not.toContain("fragment");
  });

  it("renders function component", () => {
    const MyComp = ({ name }: { name: string }) => createElement("p", null, `Hello ${name}`);
    const el = createElement(MyComp, { name: "World" });
    const html = renderToString(el);
    expect(html).toContain("Hello World");
  });

  it("renders Suspense children", () => {
    const el = {
      $$typeof: REACT_ELEMENT_TYPE,
      type: REACT_SUSPENSE_TYPE,
      key: null,
      ref: null,
      props: {
        children: createElement("div", null, "loaded"),
        fallback: createElement("div", null, "loading"),
      },
      _owner: null,
    };
    const html = renderToString(el as unknown as null);
    expect(html).toContain("loaded");
    expect(html).not.toContain("loading");
  });

  it("renders Suspense fallback on error", () => {
    const ThrowComp = () => {
      throw new Error("oops");
    };
    const el = {
      $$typeof: REACT_ELEMENT_TYPE,
      type: REACT_SUSPENSE_TYPE,
      key: null,
      ref: null,
      props: {
        children: createElement(ThrowComp, null),
        fallback: createElement("div", null, "fallback content"),
      },
      _owner: null,
    };
    const html = renderToString(el as unknown as null);
    expect(html).toContain("fallback content");
  });

  it("renders memo component", () => {
    const Inner = ({ value }: { value: string }) => createElement("span", null, value);
    const MemoComp = memo(Inner);
    const html = renderToString(createElement(MemoComp, { value: "memo-value" }));
    expect(html).toContain("memo-value");
  });

  it("renders forwardRef component", () => {
    const FwdComp = forwardRef<HTMLDivElement, { text: string }>(
      ({ text }: { text: string }, _ref) => createElement("div", null, text),
    );
    const html = renderToString(createElement(FwdComp, { text: "fwd-text" }));
    expect(html).toContain("fwd-text");
  });

  it("renders context provider", () => {
    const Ctx = createContext("default");
    const Consumer = () => {
      // In server rendering, use ServerDispatcher.useContext
      return createElement("div", null, Ctx._currentValue as string);
    };
    const el = createElement(
      Ctx as unknown as Parameters<typeof createElement>[0],
      { value: "provided" } as Record<string, unknown>,
      createElement(Consumer, null),
    );
    const html = renderToString(el);
    expect(html).toContain("provided");
  });

  it("renders void elements without closing tag", () => {
    const el = createElement("br", null);
    const html = renderToString(el);
    expect(html).toContain("<br");
    expect(html).not.toContain("</br>");
  });

  it("renders input void element", () => {
    const el = createElement("input", { type: "text", value: "test" });
    const html = renderToString(el);
    expect(html).toContain("<input");
    expect(html).not.toContain("</input>");
  });

  it("renders bigint node", () => {
    const html = renderToString(BigInt(123) as unknown as null);
    expect(html).toBe("123");
  });

  it("renders iterable", () => {
    function* gen() {
      yield createElement("li", { key: "1" }, "item1");
      yield createElement("li", { key: "2" }, "item2");
    }
    const html = renderToString(gen() as unknown as null);
    expect(html).toContain("item1");
    expect(html).toContain("item2");
  });

  it("renders class component", () => {
    class MyClass {
      props: Record<string, unknown>;
      state = null;
      constructor(props: Record<string, unknown>) {
        this.props = props;
      }
      render() {
        return createElement("div", null, `class:${this.props.value}`);
      }
    }
    Object.assign(MyClass.prototype, { isReactComponent: {} });
    const html = renderToString(
      createElement(MyClass as unknown as Parameters<typeof createElement>[0], { value: "test" }),
    );
    expect(html).toContain("class:test");
  });

  it("renders lazy component (already resolved)", () => {
    const Inner = ({ msg }: { msg: string }) => createElement("span", null, msg);
    const LazyComp = lazy(() => Promise.resolve({ default: Inner }));
    // Pre-resolve the lazy component
    (LazyComp as unknown as Record<string, unknown>)._payload = {
      status: "fulfilled",
      value: Inner,
    };
    (LazyComp as unknown as Record<string, unknown>)._init = (p: { value: unknown }) => p.value;
    const html = renderToString(createElement(LazyComp, { msg: "lazy-msg" }));
    expect(html).toContain("lazy-msg");
  });

  it("throws for promise node", () => {
    const promise = Promise.resolve("value");
    expect(() => renderToString(promise as unknown as null)).toThrow("Promises are not supported");
  });

  it("throws for invalid element type", () => {
    const badEl = {
      $$typeof: REACT_ELEMENT_TYPE,
      type: 123,
      key: null,
      ref: null,
      props: {},
      _owner: null,
    };
    expect(() => renderToString(badEl as unknown as null)).toThrow();
  });
});

describe("renderToReadableStream", () => {
  async function streamToString(stream: ReadableStream<Uint8Array>): Promise<string> {
    const decoder = new TextDecoder();
    let result = "";
    const reader = stream.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      result += decoder.decode(value);
    }
    return result;
  }

  it("renders simple element to stream", async () => {
    const el = createElement("div", null, "streaming");
    const stream = renderToReadableStream(el);
    const html = await streamToString(stream);
    expect(html).toContain("streaming");
  });

  it("adds bootstrap scripts", async () => {
    const el = createElement("div", null);
    const stream = renderToReadableStream(el, {
      bootstrapScripts: ["/app.js"],
    });
    const html = await streamToString(stream);
    expect(html).toContain('<script src="/app.js"');
  });

  it("adds bootstrap modules", async () => {
    const el = createElement("div", null);
    const stream = renderToReadableStream(el, {
      bootstrapModules: ["/app.mjs"],
    });
    const html = await streamToString(stream);
    expect(html).toContain('type="module"');
    expect(html).toContain("/app.mjs");
  });

  it("calls onError on render error", async () => {
    const ThrowComp = () => {
      throw new Error("stream error");
    };
    const errors: unknown[] = [];
    const stream = renderToReadableStream(createElement(ThrowComp, null), {
      onError: (err) => {
        errors.push(err);
      },
    });
    try {
      await streamToString(stream);
    } catch {
      // Expected error
    }
    expect(errors).toHaveLength(1);
  });
});
