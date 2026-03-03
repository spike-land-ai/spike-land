import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useReducer,
  useContext,
  useDebugValue,
  useId,
  useLayoutEffect,
} from "../../react/ReactHooks.js";
import ReactSharedInternals from "../../react/ReactSharedInternals.js";
import type { Dispatcher, ReactContext } from "../../react/ReactTypes.js";
import { createContext } from "../../react/ReactContext.js";

function makeDispatcher(overrides: Partial<Dispatcher> = {}): Dispatcher {
  return {
    useState: vi.fn((init) => [typeof init === "function" ? (init as () => unknown)() : init, vi.fn()]),
    useReducer: vi.fn((reducer, init, initFn) => [
      initFn ? initFn(init) : init,
      vi.fn(),
    ]) as unknown as Dispatcher["useReducer"],
    useEffect: vi.fn(),
    useLayoutEffect: vi.fn(),
    useInsertionEffect: vi.fn(),
    useCallback: vi.fn((cb) => cb),
    useMemo: vi.fn((create) => create()),
    useRef: vi.fn((init) => ({ current: init })),
    useContext: vi.fn((ctx: ReactContext<unknown>) => ctx._currentValue),
    useImperativeHandle: vi.fn(),
    useDebugValue: vi.fn(),
    useTransition: vi.fn(() => [false, vi.fn()]),
    useDeferredValue: vi.fn((value) => value),
    useId: vi.fn(() => ":r0:"),
    useSyncExternalStore: vi.fn((_, getSnapshot) => getSnapshot()),
    use: vi.fn(),
    useOptimistic: vi.fn((passthrough) => [passthrough, vi.fn()]),
    useActionState: vi.fn((_, initialState) => [initialState, vi.fn(), false]),
    ...overrides,
  };
}

describe("React Hooks (via mock dispatcher)", () => {
  let savedDispatcher: typeof ReactSharedInternals.H;

  beforeEach(() => {
    savedDispatcher = ReactSharedInternals.H;
  });

  afterEach(() => {
    ReactSharedInternals.H = savedDispatcher;
  });

  describe("useState", () => {
    it("returns initial value and setter", () => {
      const dispatcher = makeDispatcher();
      ReactSharedInternals.H = dispatcher;
      const [state, setter] = useState(0);
      expect(state).toBe(0);
      expect(typeof setter).toBe("function");
      expect(dispatcher.useState).toHaveBeenCalledWith(0);
    });

    it("calls initializer function when passed function", () => {
      const dispatcher = makeDispatcher();
      ReactSharedInternals.H = dispatcher;
      const init = vi.fn(() => 42);
      const [state] = useState(init);
      expect(dispatcher.useState).toHaveBeenCalledWith(init);
      expect(state).toBe(42);
    });

    it("works with string initial state", () => {
      const dispatcher = makeDispatcher();
      ReactSharedInternals.H = dispatcher;
      const [state] = useState("hello");
      expect(state).toBe("hello");
    });

    it("works with object initial state", () => {
      const dispatcher = makeDispatcher();
      ReactSharedInternals.H = dispatcher;
      const initial = { count: 0 };
      const [state] = useState(initial);
      expect(state).toStrictEqual(initial);
    });
  });

  describe("useReducer", () => {
    it("calls dispatcher.useReducer with reducer and initialArg", () => {
      const dispatcher = makeDispatcher();
      ReactSharedInternals.H = dispatcher;
      const reducer = (state: number, action: string) =>
        action === "inc" ? state + 1 : state;
      const [state, dispatch] = useReducer(reducer, 0);
      expect(state).toBe(0);
      expect(typeof dispatch).toBe("function");
    });

    it("calls init function when provided", () => {
      const dispatcher = makeDispatcher();
      ReactSharedInternals.H = dispatcher;
      const reducer = (state: number, _action: unknown) => state;
      const init = (arg: number) => arg * 2;
      const [state] = useReducer(reducer, 5, init);
      expect(state).toBe(10);
    });
  });

  describe("useEffect", () => {
    it("calls dispatcher.useEffect with create and deps", () => {
      const dispatcher = makeDispatcher();
      ReactSharedInternals.H = dispatcher;
      const create = vi.fn();
      const deps = [1, 2];
      useEffect(create, deps);
      expect(dispatcher.useEffect).toHaveBeenCalledWith(create, deps);
    });

    it("calls dispatcher.useEffect without deps", () => {
      const dispatcher = makeDispatcher();
      ReactSharedInternals.H = dispatcher;
      const create = vi.fn();
      useEffect(create);
      expect(dispatcher.useEffect).toHaveBeenCalledWith(create, undefined);
    });
  });

  describe("useLayoutEffect", () => {
    it("calls dispatcher.useLayoutEffect", () => {
      const dispatcher = makeDispatcher();
      ReactSharedInternals.H = dispatcher;
      const create = vi.fn();
      const deps = [1];
      useLayoutEffect(create, deps);
      expect(dispatcher.useLayoutEffect).toHaveBeenCalledWith(create, deps);
    });
  });

  describe("useRef", () => {
    it("returns ref object with current", () => {
      const dispatcher = makeDispatcher();
      ReactSharedInternals.H = dispatcher;
      const ref = useRef(null);
      expect(ref).toHaveProperty("current");
      expect(ref.current).toBeNull();
    });

    it("initializes current to provided value", () => {
      const dispatcher = makeDispatcher();
      ReactSharedInternals.H = dispatcher;
      const ref = useRef(42);
      expect(ref.current).toBe(42);
    });

    it("calls dispatcher.useRef with initialValue", () => {
      const dispatcher = makeDispatcher();
      ReactSharedInternals.H = dispatcher;
      useRef("initial");
      expect(dispatcher.useRef).toHaveBeenCalledWith("initial");
    });
  });

  describe("useMemo", () => {
    it("calls create function and returns result", () => {
      const dispatcher = makeDispatcher();
      ReactSharedInternals.H = dispatcher;
      const create = vi.fn(() => "computed");
      const result = useMemo(create, []);
      expect(result).toBe("computed");
      expect(dispatcher.useMemo).toHaveBeenCalledWith(create, []);
    });

    it("passes deps to dispatcher", () => {
      const dispatcher = makeDispatcher();
      ReactSharedInternals.H = dispatcher;
      const deps = [1, 2, 3];
      useMemo(() => 0, deps);
      expect(dispatcher.useMemo).toHaveBeenCalledWith(expect.any(Function), deps);
    });
  });

  describe("useCallback", () => {
    it("returns the callback", () => {
      const dispatcher = makeDispatcher();
      ReactSharedInternals.H = dispatcher;
      const cb = vi.fn();
      const result = useCallback(cb, []);
      expect(result).toBe(cb);
      expect(dispatcher.useCallback).toHaveBeenCalledWith(cb, []);
    });
  });

  describe("useContext", () => {
    it("returns context _currentValue", () => {
      const dispatcher = makeDispatcher();
      ReactSharedInternals.H = dispatcher;
      const ctx = createContext("defaultValue");
      const value = useContext(ctx);
      expect(value).toBe("defaultValue");
    });

    it("calls dispatcher.useContext with context object", () => {
      const dispatcher = makeDispatcher();
      ReactSharedInternals.H = dispatcher;
      const ctx = createContext(42);
      useContext(ctx);
      expect(dispatcher.useContext).toHaveBeenCalledWith(ctx);
    });
  });

  describe("useId", () => {
    it("returns id string from dispatcher", () => {
      const dispatcher = makeDispatcher();
      ReactSharedInternals.H = dispatcher;
      const id = useId();
      expect(typeof id).toBe("string");
      expect(id).toBe(":r0:");
    });
  });

  describe("useDebugValue", () => {
    it("is a no-op that does not throw", () => {
      // useDebugValue doesn't use dispatcher - it's a no-op in production
      expect(() => useDebugValue("debug info")).not.toThrow();
      expect(() => useDebugValue({ value: 42 }, (v) => v.value)).not.toThrow();
    });
  });
});
