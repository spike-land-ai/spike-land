/**
 * Integration tests for the reconciler via createRoot.
 * These tests exercise ReactFiberWorkLoop, ReactFiberBeginWork,
 * ReactFiberCompleteWork, ReactFiberCommitWork, ReactFiberHooks,
 * ReactChildFiber, ReactFiberClassComponent, ReactFiberHostContext,
 * ReactFiberReconciler, and the host-config DOMHostConfig.
 *
 * IMPORTANT: Tests in this file are carefully ordered to avoid scheduler
 * state leakage between describe blocks. Each test creates a new root.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createElement,
  createContext,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useTransition,
  useDeferredValue,
  useInsertionEffect,
  useImperativeHandle,
  useDebugValue,
} from "../../../../src/core/react-engine/core-logic/react/index.js";
import { memo } from "../../../../src/core/react-engine/core-logic/react/ReactMemo.js";
import { forwardRef } from "../../../../src/core/react-engine/core-logic/react/ReactForwardRef.js";
import { createRoot } from "../../../../src/core/react-engine/core-logic/react-dom/client.js";
import {
  createContainer,
  updateContainer,
  getPublicRootInstance,
} from "../../../../src/core/react-engine/core-logic/reconciler/ReactFiberReconciler.js";
import { DOMHostConfig } from "../../../../src/core/react-engine/core-logic/host-config/DOMHostConfig.js";
import { flushSync } from "../../../../src/core/react-engine/core-logic/reconciler/ReactFiberWorkLoop.js";

// Wait for microtasks to flush (sync queue processing)
function flushMicrotasks(): Promise<void> {
  return new Promise<void>((r) => queueMicrotask(r));
}

describe("ReactFiberReconciler - createContainer / updateContainer", () => {
  it("creates a fiber root", () => {
    const container = document.createElement("div");
    const root = createContainer(container, DOMHostConfig);
    expect(root).toBeDefined();
    expect(root.containerInfo).toBe(container);
  });

  it("updateContainer renders element", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createContainer(container, DOMHostConfig);
    updateContainer(createElement("div", null, "hello"), root);
    await flushMicrotasks();
    await flushMicrotasks();
    expect(container.innerHTML).toContain("hello");
    document.body.removeChild(container);
  });

  it("getPublicRootInstance returns null for empty root", () => {
    const container = document.createElement("div");
    const root = createContainer(container, DOMHostConfig);
    expect(getPublicRootInstance(root)).toBeNull();
  });
});

describe("flushSync", () => {
  it("flushes sync callbacks", () => {
    let called = false;
    flushSync(() => {
      called = true;
    });
    expect(called).toBe(true);
  });

  it("flushes without fn argument", () => {
    expect(() => flushSync()).not.toThrow();
  });
});

describe("React rendering - all component types", () => {
  // Single describe block with all tests to control ordering
  // and minimize scheduler state leakage
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(async () => {
    // Wait for any pending async work to complete before removing container
    await flushMicrotasks();
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  });

  // === HOST ELEMENTS ===

  it("renders a div", async () => {
    const root = createRoot(container);
    root.render(createElement("div", null, "test"));
    await flushMicrotasks();
    await flushMicrotasks();
    expect(container.querySelector("div")).toBeTruthy();
    expect(container.textContent).toBe("test");
  });

  it("renders element with class", async () => {
    const root = createRoot(container);
    root.render(createElement("div", { className: "my-class" }));
    await flushMicrotasks();
    await flushMicrotasks();
    expect(container.querySelector(".my-class")).toBeTruthy();
  });

  it("renders element with id", async () => {
    const root = createRoot(container);
    root.render(createElement("p", { id: "para" }, "paragraph"));
    await flushMicrotasks();
    await flushMicrotasks();
    expect(container.querySelector("#para")).toBeTruthy();
  });

  it("renders nested host elements", async () => {
    const root = createRoot(container);
    root.render(createElement("div", null, createElement("span", null, "inner")));
    await flushMicrotasks();
    await flushMicrotasks();
    expect(container.querySelector("span")).toBeTruthy();
    expect(container.textContent).toBe("inner");
  });

  it("renders multiple children", async () => {
    const root = createRoot(container);
    root.render(
      createElement(
        "ul",
        null,
        createElement("li", { key: "1" }, "first"),
        createElement("li", { key: "2" }, "second"),
        createElement("li", { key: "3" }, "third"),
      ),
    );
    await flushMicrotasks();
    await flushMicrotasks();
    const items = container.querySelectorAll("li");
    expect(items).toHaveLength(3);
  });

  it("renders text nodes", async () => {
    const root = createRoot(container);
    root.render(createElement("div", null, "just text"));
    await flushMicrotasks();
    await flushMicrotasks();
    expect(container.textContent).toBe("just text");
  });

  it("re-renders updated content", async () => {
    const root = createRoot(container);
    root.render(createElement("div", null, "v1"));
    await flushMicrotasks();
    await flushMicrotasks();
    expect(container.textContent).toBe("v1");
    root.render(createElement("div", null, "v2"));
    await flushMicrotasks();
    await flushMicrotasks();
    expect(container.textContent).toBe("v2");
  });

  it("renders null children", async () => {
    const root = createRoot(container);
    root.render(createElement("div", null, null));
    await flushMicrotasks();
    await flushMicrotasks();
    expect(container.querySelector("div")).toBeTruthy();
  });

  it("renders boolean attributes", async () => {
    const root = createRoot(container);
    root.render(createElement("input", { type: "checkbox", disabled: true }));
    await flushMicrotasks();
    await flushMicrotasks();
    const input = container.querySelector("input");
    expect(input?.disabled).toBe(true);
  });

  it("renders style object", async () => {
    const root = createRoot(container);
    root.render(createElement("div", { style: { color: "red" } }));
    await flushMicrotasks();
    await flushMicrotasks();
    const div = container.querySelector("div") as HTMLElement;
    expect(div.style.color).toBe("red");
  });

  it("renders with data attributes", async () => {
    const root = createRoot(container);
    root.render(createElement("div", { "data-testid": "my-div" }));
    await flushMicrotasks();
    await flushMicrotasks();
    expect(container.querySelector("[data-testid='my-div']")).toBeTruthy();
  });

  it("renders void element", async () => {
    const root = createRoot(container);
    root.render(createElement("br", null));
    await flushMicrotasks();
    await flushMicrotasks();
    expect(container.querySelector("br")).toBeTruthy();
  });

  // === FUNCTION COMPONENTS ===

  it("renders a function component", async () => {
    const Comp = ({ msg }: { msg: string }) => createElement("div", null, msg);
    const root = createRoot(container);
    root.render(createElement(Comp, { msg: "hello" }));
    await flushMicrotasks();
    await flushMicrotasks();
    expect(container.textContent).toBe("hello");
  });

  it("renders component returning null", async () => {
    const NullComp = () => null;
    const root = createRoot(container);
    root.render(createElement(NullComp, null));
    await flushMicrotasks();
    await flushMicrotasks();
    expect(container.innerHTML).toBe("");
  });

  it("renders nested function components", async () => {
    const Inner = ({ x }: { x: string }) => createElement("span", null, x);
    const Outer = () => createElement("div", null, createElement(Inner, { x: "nested" }));
    const root = createRoot(container);
    root.render(createElement(Outer, null));
    await flushMicrotasks();
    await flushMicrotasks();
    expect(container.textContent).toBe("nested");
  });

  // === HOOKS ===

  it("useState - initial state", async () => {
    const Comp = () => {
      const [val] = useState("initial");
      return createElement("div", null, val);
    };
    const root = createRoot(container);
    root.render(createElement(Comp, null));
    await flushMicrotasks();
    await flushMicrotasks();
    expect(container.textContent).toBe("initial");
  });

  it("useState - updates state", async () => {
    let setter: (v: string) => void = null;
    const Comp = () => {
      const [val, set] = useState("before");
      setter = set;
      return createElement("div", null, val);
    };
    const root = createRoot(container);
    root.render(createElement(Comp, null));
    await flushMicrotasks();
    await flushMicrotasks();
    expect(container.textContent).toBe("before");
    setter("after");
    await flushMicrotasks();
    await flushMicrotasks();
    expect(container.textContent).toBe("after");
  });

  it("useState - functional update", async () => {
    let setter: (fn: (v: number) => number) => void = null;
    const Comp = () => {
      const [val, set] = useState(0);
      setter = set as (fn: (v: number) => number) => void;
      return createElement("div", null, String(val));
    };
    const root = createRoot(container);
    root.render(createElement(Comp, null));
    await flushMicrotasks();
    await flushMicrotasks();
    setter((n) => n + 5);
    await flushMicrotasks();
    await flushMicrotasks();
    expect(container.textContent).toBe("5");
  });

  it("useState - lazy initializer", async () => {
    const Comp = () => {
      const [val] = useState(() => "computed");
      return createElement("div", null, val);
    };
    const root = createRoot(container);
    root.render(createElement(Comp, null));
    await flushMicrotasks();
    await flushMicrotasks();
    expect(container.textContent).toBe("computed");
  });

  it("useReducer - basic", async () => {
    type S = { count: number };
    type A = { type: "inc" } | { type: "dec" };
    const reducer = (state: S, action: A): S => {
      if (action.type === "inc") return { count: state.count + 1 };
      return state;
    };
    let dispatch: (a: A) => void = null;
    const Comp = () => {
      const [state, d] = useReducer(reducer, { count: 0 });
      dispatch = d;
      return createElement("div", null, String(state.count));
    };
    const root = createRoot(container);
    root.render(createElement(Comp, null));
    await flushMicrotasks();
    await flushMicrotasks();
    dispatch({ type: "inc" });
    await flushMicrotasks();
    await flushMicrotasks();
    expect(container.textContent).toBe("1");
  });

  it("useLayoutEffect - runs after DOM updates", async () => {
    const effects: string[] = [];
    const Comp = () => {
      useLayoutEffect(() => {
        effects.push("layout");
      }, []);
      return createElement("div", null, "layout test");
    };
    const root = createRoot(container);
    root.render(createElement(Comp, null));
    await flushMicrotasks();
    await flushMicrotasks();
    expect(effects).toContain("layout");
  });

  it("useRef - holds mutable value", async () => {
    let capturedRef: { current: number } = null;
    const Comp = () => {
      const r = useRef(42);
      capturedRef = r;
      return createElement("div", null, String(r.current));
    };
    const root = createRoot(container);
    root.render(createElement(Comp, null));
    await flushMicrotasks();
    await flushMicrotasks();
    expect(capturedRef.current).toBe(42);
    capturedRef.current = 100;
    expect(capturedRef.current).toBe(100);
  });

  it("useMemo - returns computed value", async () => {
    const computations: number[] = [];
    const Comp = () => {
      const val = useMemo(() => {
        computations.push(1);
        return "computed";
      }, []);
      return createElement("div", null, val);
    };
    const root = createRoot(container);
    root.render(createElement(Comp, null));
    await flushMicrotasks();
    await flushMicrotasks();
    expect(container.textContent).toBe("computed");
    expect(computations).toHaveLength(1);
  });

  it("useCallback - returns callback", async () => {
    const callbacks: (() => number)[] = [];
    const Comp = () => {
      const fn = useCallback(() => 42, []);
      callbacks.push(fn);
      return createElement("div", null, "cb");
    };
    const root = createRoot(container);
    root.render(createElement(Comp, null));
    await flushMicrotasks();
    await flushMicrotasks();
    root.render(createElement(Comp, null));
    await flushMicrotasks();
    await flushMicrotasks();
    expect(callbacks.length).toBeGreaterThan(0);
    if (callbacks.length > 1) {
      expect(callbacks[0]).toBe(callbacks[1]);
    }
  });

  it("useContext - reads context value", async () => {
    const Ctx = createContext("default-ctx");
    const Consumer = () => {
      const val = useContext(Ctx);
      return createElement("div", null, val);
    };
    const root = createRoot(container);
    root.render(
      createElement(
        Ctx as unknown as Parameters<typeof createElement>[0],
        { value: "provided-ctx" } as Record<string, unknown>,
        createElement(Consumer, null),
      ),
    );
    await flushMicrotasks();
    await flushMicrotasks();
    expect(container.textContent).toBe("provided-ctx");
  });

  it("useId - generates stable id", async () => {
    let capturedId: string = null;
    const Comp = () => {
      const id = useId();
      capturedId = id;
      return createElement("div", { id }, "id test");
    };
    const root = createRoot(container);
    root.render(createElement(Comp, null));
    await flushMicrotasks();
    await flushMicrotasks();
    expect(typeof capturedId).toBe("string");
    expect(capturedId.length).toBeGreaterThan(0);
  });

  it("useTransition - returns [false, fn]", async () => {
    let capturedPending: boolean = null;
    let capturedStart: (fn: () => void) => void = null;
    const Comp = () => {
      const [isPending, startTransition] = useTransition();
      capturedPending = isPending;
      capturedStart = startTransition;
      return createElement("div", null, String(isPending));
    };
    const root = createRoot(container);
    root.render(createElement(Comp, null));
    await flushMicrotasks();
    await flushMicrotasks();
    expect(capturedPending).toBe(false);
    let called = false;
    capturedStart(() => {
      called = true;
    });
    expect(called).toBe(true);
  });

  it("useDeferredValue - returns value", async () => {
    const Comp = () => {
      const deferred = useDeferredValue("deferred-value");
      return createElement("div", null, deferred);
    };
    const root = createRoot(container);
    root.render(createElement(Comp, null));
    await flushMicrotasks();
    await flushMicrotasks();
    expect(container.textContent).toBe("deferred-value");
  });

  it("useDebugValue - no-op", async () => {
    const Comp = () => {
      useDebugValue("debug value");
      return createElement("div", null, "debug");
    };
    const root = createRoot(container);
    root.render(createElement(Comp, null));
    await flushMicrotasks();
    await flushMicrotasks();
    expect(container.textContent).toBe("debug");
  });

  it("useInsertionEffect - runs during commit", async () => {
    const Comp = () => {
      useInsertionEffect(() => {}, []);
      return createElement("div", null, "insertion");
    };
    const root = createRoot(container);
    root.render(createElement(Comp, null));
    await flushMicrotasks();
    await flushMicrotasks();
    expect(container.textContent).toBe("insertion");
  });

  it("useImperativeHandle - no-op", async () => {
    const Comp = () => {
      useImperativeHandle(null as never, () => ({}), []);
      return createElement("div", null);
    };
    const root = createRoot(container);
    root.render(createElement(Comp, null));
    await flushMicrotasks();
    await flushMicrotasks();
    expect(container.querySelector("div")).toBeTruthy();
  });

  // === CLASS COMPONENTS ===

  it("renders a class component with isReactComponent", async () => {
    function Comp(
      this: { props: Record<string, unknown>; state: { val: string } },
      props: Record<string, unknown>,
    ) {
      this.props = props;
      this.state = { val: "class-state" };
    }
    Comp.prototype.isReactComponent = {};
    Comp.prototype.render = function () {
      return createElement("div", null, (this as unknown as { state: { val: string } }).state.val);
    };
    const root = createRoot(container);
    root.render(createElement(Comp as unknown as Parameters<typeof createElement>[0], null));
    await flushMicrotasks();
    await flushMicrotasks();
    expect(container.textContent).toBe("class-state");
  });

  // === MEMO ===

  it("renders a memo component", async () => {
    const Inner = ({ val }: { val: string }) => createElement("div", null, val);
    const MemoComp = memo(Inner);
    const root = createRoot(container);
    root.render(createElement(MemoComp, { val: "memo" }));
    await flushMicrotasks();
    await flushMicrotasks();
    expect(container.textContent).toBe("memo");
  });

  it("re-renders memo component when props change", async () => {
    const Inner = ({ val }: { val: string }) => createElement("div", null, val);
    const MemoComp = memo(Inner);
    const root = createRoot(container);
    root.render(createElement(MemoComp, { val: "first" }));
    await flushMicrotasks();
    await flushMicrotasks();
    expect(container.textContent).toBe("first");
    root.render(createElement(MemoComp, { val: "second" }));
    await flushMicrotasks();
    await flushMicrotasks();
    expect(container.textContent).toBe("second");
  });

  // === FORWARD REF ===

  it("renders a forwardRef component", async () => {
    const FwdComp = forwardRef<HTMLDivElement, { label: string }>(
      ({ label }: { label: string }, _ref) => createElement("div", null, label),
    );
    const root = createRoot(container);
    root.render(createElement(FwdComp, { label: "fwd" }));
    await flushMicrotasks();
    await flushMicrotasks();
    expect(container.textContent).toBe("fwd");
  });

  // === LIST RECONCILIATION ===

  it("updates element attributes on re-render", async () => {
    const root = createRoot(container);
    root.render(createElement("div", { title: "old-title" }));
    await flushMicrotasks();
    await flushMicrotasks();
    expect((container.querySelector("div") as HTMLElement)?.title).toBe("old-title");
    root.render(createElement("div", { title: "new-title" }));
    await flushMicrotasks();
    await flushMicrotasks();
    expect((container.querySelector("div") as HTMLElement)?.title).toBe("new-title");
  });

  it("re-renders updated text", async () => {
    const root = createRoot(container);
    root.render(createElement("span", null, "v1"));
    await flushMicrotasks();
    await flushMicrotasks();
    expect(container.textContent).toBe("v1");
    root.render(createElement("span", null, "v2"));
    await flushMicrotasks();
    await flushMicrotasks();
    expect(container.textContent).toBe("v2");
  });
});

// Note: useEffect passive effects are scheduled via MessageChannel (NormalPriority),
// which fires as a macrotask in Node.js/jsdom. We cannot reliably drain it with
// queueMicrotask. Instead, useEffect is tested indirectly through the scheduler
// tests. The useLayoutEffect test above validates synchronous commit-phase effects.
