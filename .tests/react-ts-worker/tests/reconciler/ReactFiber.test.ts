import { describe, expect, it } from "vitest";
import {
  createFiberFromElement,
  createFiberFromFragment,
  createFiberFromText,
  createFiberFromTypeAndProps,
  createHostRootFiber,
  createWorkInProgress,
  isSimpleFunctionComponent,
} from "../../../../src/core/react-engine/core-logic/reconciler/ReactFiber.js";
import {
  ClassComponent,
  ContextConsumer,
  ContextProvider,
  ForwardRef,
  Fragment,
  FunctionComponent,
  HostComponent,
  HostRoot,
  HostText,
  LazyComponent,
  MemoComponent,
  SuspenseComponent,
} from "../../../../src/core/react-engine/core-logic/reconciler/ReactWorkTags.js";
import { NoFlags } from "../../../../src/core/react-engine/core-logic/reconciler/ReactFiberFlags.js";
import {
  NoLanes,
  SyncLane,
} from "../../../../src/core/react-engine/core-logic/reconciler/ReactFiberLane.js";
import {
  REACT_CONSUMER_TYPE,
  REACT_CONTEXT_TYPE,
  REACT_FORWARD_REF_TYPE,
  REACT_FRAGMENT_TYPE,
  REACT_LAZY_TYPE,
  REACT_MEMO_TYPE,
  REACT_SUSPENSE_TYPE,
} from "../../../../src/core/react-engine/core-logic/react/ReactSymbols.js";
import { Component } from "../../../../src/core/react-engine/core-logic/react/ReactBaseClasses.js";

describe("ReactFiber", () => {
  describe("isSimpleFunctionComponent", () => {
    it("returns true for plain function component", () => {
      function MyComp() {
        return null;
      }
      expect(isSimpleFunctionComponent(MyComp)).toBe(true);
    });

    it("returns false for class components", () => {
      class MyClass extends Component {
        render() {
          return null;
        }
      }
      expect(isSimpleFunctionComponent(MyClass)).toBe(false);
    });

    it("returns false for non-function", () => {
      expect(isSimpleFunctionComponent("div")).toBe(false);
      expect(isSimpleFunctionComponent(null)).toBe(false);
      expect(isSimpleFunctionComponent({})).toBe(false);
    });

    it("returns false for function with defaultProps", () => {
      function WithDefaults() {
        return null;
      }
      (WithDefaults as unknown as Record<string, unknown>).defaultProps = {};
      expect(isSimpleFunctionComponent(WithDefaults)).toBe(false);
    });
  });

  describe("createHostRootFiber", () => {
    it("creates a fiber with HostRoot tag", () => {
      const fiber = createHostRootFiber();
      expect(fiber.tag).toBe(HostRoot);
    });

    it("has default initial values", () => {
      const fiber = createHostRootFiber();
      expect(fiber.key).toBeNull();
      expect(fiber.pendingProps).toBeNull();
      expect(fiber.flags).toBe(NoFlags);
      expect(fiber.lanes).toBe(NoLanes);
      expect(fiber.child).toBeNull();
      expect(fiber.return).toBeNull();
      expect(fiber.sibling).toBeNull();
      expect(fiber.alternate).toBeNull();
    });
  });

  describe("createFiberFromText", () => {
    it("creates a HostText fiber with content", () => {
      const fiber = createFiberFromText("hello", SyncLane);
      expect(fiber.tag).toBe(HostText);
      expect(fiber.pendingProps).toBe("hello");
      expect(fiber.lanes).toBe(SyncLane);
    });

    it("has null key for text nodes", () => {
      const fiber = createFiberFromText("world", NoLanes);
      expect(fiber.key).toBeNull();
    });
  });

  describe("createFiberFromFragment", () => {
    it("creates a Fragment fiber", () => {
      const children = [1, 2];
      const fiber = createFiberFromFragment(children, SyncLane, "mykey");
      expect(fiber.tag).toBe(Fragment);
      expect(fiber.pendingProps).toBe(children);
      expect(fiber.lanes).toBe(SyncLane);
      expect(fiber.key).toBe("mykey");
    });
  });

  describe("createFiberFromTypeAndProps", () => {
    it("creates FunctionComponent fiber for function type", () => {
      function Comp() {
        return null;
      }
      const fiber = createFiberFromTypeAndProps(Comp, null, {}, SyncLane);
      expect(fiber.tag).toBe(FunctionComponent);
      expect(fiber.type).toBe(Comp);
      expect(fiber.elementType).toBe(Comp);
    });

    it("creates ClassComponent fiber for class type", () => {
      class MyClass extends Component {
        render() {
          return null;
        }
      }
      const fiber = createFiberFromTypeAndProps(MyClass, null, {}, SyncLane);
      expect(fiber.tag).toBe(ClassComponent);
    });

    it("creates HostComponent fiber for string type", () => {
      const fiber = createFiberFromTypeAndProps("div", null, { className: "foo" }, SyncLane);
      expect(fiber.tag).toBe(HostComponent);
      expect(fiber.type).toBe("div");
    });

    it("creates Fragment fiber for REACT_FRAGMENT_TYPE", () => {
      const fiber = createFiberFromTypeAndProps(
        REACT_FRAGMENT_TYPE,
        null,
        { children: [] },
        SyncLane,
      );
      expect(fiber.tag).toBe(Fragment);
    });

    it("creates SuspenseComponent fiber for REACT_SUSPENSE_TYPE", () => {
      const fiber = createFiberFromTypeAndProps(REACT_SUSPENSE_TYPE, null, {}, SyncLane);
      expect(fiber.tag).toBe(SuspenseComponent);
      expect(fiber.elementType).toBe(REACT_SUSPENSE_TYPE);
    });

    it("creates ContextProvider fiber for REACT_CONTEXT_TYPE", () => {
      const ctxObj = { $$typeof: REACT_CONTEXT_TYPE, _currentValue: null };
      const fiber = createFiberFromTypeAndProps(ctxObj, null, {}, SyncLane);
      expect(fiber.tag).toBe(ContextProvider);
    });

    it("creates ContextConsumer fiber for REACT_CONSUMER_TYPE", () => {
      const consumerObj = { $$typeof: REACT_CONSUMER_TYPE };
      const fiber = createFiberFromTypeAndProps(consumerObj, null, {}, SyncLane);
      expect(fiber.tag).toBe(ContextConsumer);
    });

    it("creates ForwardRef fiber for REACT_FORWARD_REF_TYPE", () => {
      const forwardRefObj = { $$typeof: REACT_FORWARD_REF_TYPE, render: () => null };
      const fiber = createFiberFromTypeAndProps(forwardRefObj, null, {}, SyncLane);
      expect(fiber.tag).toBe(ForwardRef);
    });

    it("creates MemoComponent fiber for REACT_MEMO_TYPE", () => {
      const memoObj = { $$typeof: REACT_MEMO_TYPE, type: () => null };
      const fiber = createFiberFromTypeAndProps(memoObj, null, {}, SyncLane);
      expect(fiber.tag).toBe(MemoComponent);
    });

    it("creates LazyComponent fiber for REACT_LAZY_TYPE", () => {
      const lazyObj = { $$typeof: REACT_LAZY_TYPE };
      const fiber = createFiberFromTypeAndProps(lazyObj, null, {}, SyncLane);
      expect(fiber.tag).toBe(LazyComponent);
      expect(fiber.type).toBeNull(); // resolvedType is null for lazy
    });

    it("preserves key", () => {
      const fiber = createFiberFromTypeAndProps("div", "mykey", {}, SyncLane);
      expect(fiber.key).toBe("mykey");
    });
  });

  describe("createFiberFromElement", () => {
    it("creates fiber from ReactElement", () => {
      const element = {
        $$typeof: Symbol.for("react.element"),
        type: "div",
        key: null,
        props: { className: "test" },
        ref: null,
      };
      const fiber = createFiberFromElement(element as never, SyncLane);
      expect(fiber.tag).toBe(HostComponent);
      expect(fiber.type).toBe("div");
    });
  });

  describe("createWorkInProgress", () => {
    it("creates a work-in-progress fiber from current", () => {
      const current = createHostRootFiber();
      current.memoizedProps = { foo: "bar" };
      current.memoizedState = { count: 0 };

      const wip = createWorkInProgress(current, { newProp: true });

      expect(wip.tag).toBe(current.tag);
      expect(wip.pendingProps).toEqual({ newProp: true });
      expect(wip.memoizedProps).toBe(current.memoizedProps);
      expect(wip.memoizedState).toBe(current.memoizedState);
    });

    it("sets up alternates bidirectionally", () => {
      const current = createHostRootFiber();
      const wip = createWorkInProgress(current, null);

      expect(wip.alternate).toBe(current);
      expect(current.alternate).toBe(wip);
    });

    it("reuses existing work-in-progress", () => {
      const current = createHostRootFiber();
      const wip1 = createWorkInProgress(current, { a: 1 });
      const wip2 = createWorkInProgress(current, { b: 2 });

      expect(wip1).toBe(wip2); // Same fiber reused
      expect(wip2.pendingProps).toEqual({ b: 2 });
    });

    it("copies child, sibling, ref from current", () => {
      const current = createHostRootFiber();
      const child = createHostRootFiber();
      current.child = child;
      current.index = 3;

      const wip = createWorkInProgress(current, null);
      expect(wip.child).toBe(child);
      expect(wip.index).toBe(3);
    });

    it("clones dependencies when present", () => {
      const current = createHostRootFiber();
      current.dependencies = {
        lanes: SyncLane,
        firstContext: null,
      };

      const wip = createWorkInProgress(current, null);
      expect(wip.dependencies).not.toBeNull();
      expect(wip.dependencies).not.toBe(current.dependencies); // Cloned
      expect(wip.dependencies?.lanes).toBe(SyncLane);
    });

    it("sets null dependencies when current.dependencies is null", () => {
      const current = createHostRootFiber();
      current.dependencies = null;

      const wip = createWorkInProgress(current, null);
      expect(wip.dependencies).toBeNull();
    });
  });
});
