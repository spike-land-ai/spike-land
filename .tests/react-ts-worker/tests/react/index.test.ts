import { describe, expect, it } from "vitest";
import * as ReactAPI from "../../../../src/react-ts-worker/react/index.js";

describe("react/index exports", () => {
  it("exports createElement", () => {
    expect(typeof ReactAPI.createElement).toBe("function");
  });

  it("exports cloneElement", () => {
    expect(typeof ReactAPI.cloneElement).toBe("function");
  });

  it("exports isValidElement", () => {
    expect(typeof ReactAPI.isValidElement).toBe("function");
  });

  it("exports jsx and jsxs", () => {
    expect(typeof ReactAPI.jsx).toBe("function");
    expect(typeof ReactAPI.jsxs).toBe("function");
  });

  it("exports Component and PureComponent", () => {
    expect(typeof ReactAPI.Component).toBe("function");
    expect(typeof ReactAPI.PureComponent).toBe("function");
  });

  it("exports createContext", () => {
    expect(typeof ReactAPI.createContext).toBe("function");
  });

  it("exports memo", () => {
    expect(typeof ReactAPI.memo).toBe("function");
  });

  it("exports forwardRef", () => {
    expect(typeof ReactAPI.forwardRef).toBe("function");
  });

  it("exports lazy", () => {
    expect(typeof ReactAPI.lazy).toBe("function");
  });

  it("exports all hooks", () => {
    expect(typeof ReactAPI.useState).toBe("function");
    expect(typeof ReactAPI.useReducer).toBe("function");
    expect(typeof ReactAPI.useEffect).toBe("function");
    expect(typeof ReactAPI.useLayoutEffect).toBe("function");
    expect(typeof ReactAPI.useInsertionEffect).toBe("function");
    expect(typeof ReactAPI.useCallback).toBe("function");
    expect(typeof ReactAPI.useMemo).toBe("function");
    expect(typeof ReactAPI.useRef).toBe("function");
    expect(typeof ReactAPI.useContext).toBe("function");
    expect(typeof ReactAPI.useImperativeHandle).toBe("function");
    expect(typeof ReactAPI.useDebugValue).toBe("function");
    expect(typeof ReactAPI.useTransition).toBe("function");
    expect(typeof ReactAPI.useDeferredValue).toBe("function");
    expect(typeof ReactAPI.useId).toBe("function");
    expect(typeof ReactAPI.useSyncExternalStore).toBe("function");
    expect(typeof ReactAPI.use).toBe("function");
    expect(typeof ReactAPI.useOptimistic).toBe("function");
    expect(typeof ReactAPI.useActionState).toBe("function");
  });

  it("exports Children utilities", () => {
    expect(ReactAPI.Children).toBeDefined();
    expect(typeof ReactAPI.Children.map).toBe("function");
    expect(typeof ReactAPI.Children.forEach).toBe("function");
    expect(typeof ReactAPI.Children.count).toBe("function");
    expect(typeof ReactAPI.Children.toArray).toBe("function");
    expect(typeof ReactAPI.Children.only).toBe("function");
  });

  it("exports Fragment, Profiler, StrictMode, Suspense symbols", () => {
    expect(ReactAPI.Fragment).toBeDefined();
    expect(ReactAPI.Profiler).toBeDefined();
    expect(ReactAPI.StrictMode).toBeDefined();
    expect(ReactAPI.Suspense).toBeDefined();
  });
});
