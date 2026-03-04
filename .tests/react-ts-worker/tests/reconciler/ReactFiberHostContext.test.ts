import { describe, expect, it } from "vitest";
import {
  getRootHostContainer,
  getHostContext,
  pushHostContainer,
  popHostContainer,
  pushHostContext,
  popHostContext,
} from "../../../../src/react-ts-worker/reconciler/ReactFiberHostContext.js";
import type { Fiber, FiberRoot } from "../../../../src/react-ts-worker/reconciler/ReactFiberTypes.js";
import { DOMHostConfig } from "../../../../src/react-ts-worker/host-config/DOMHostConfig.js";
import { HostRoot } from "../../../../src/react-ts-worker/reconciler/ReactWorkTags.js";

function makeHostRootFiber(container: HTMLElement): Fiber {
  const fiberRoot: Partial<FiberRoot> = {
    containerInfo: container,
    hostConfig: DOMHostConfig,
  };
  return {
    tag: HostRoot,
    stateNode: fiberRoot,
    type: null,
    key: null,
    return: null,
    child: null,
    sibling: null,
    index: 0,
    ref: null,
    pendingProps: {},
    memoizedProps: {},
    memoizedState: null,
    updateQueue: null,
    flags: 0,
    subtreeFlags: 0,
    deletions: null,
    lanes: 0,
    childLanes: 0,
    alternate: null,
    mode: 0,
  } as unknown as Fiber;
}

function makeChildFiber(parent: Fiber, typeName: string): Fiber {
  return {
    tag: 5, // HostComponent
    type: typeName,
    stateNode: null,
    key: null,
    return: parent,
    child: null,
    sibling: null,
    index: 0,
    ref: null,
    pendingProps: {},
    memoizedProps: {},
    memoizedState: null,
    updateQueue: null,
    flags: 0,
    subtreeFlags: 0,
    deletions: null,
    lanes: 0,
    childLanes: 0,
    alternate: null,
    mode: 0,
  } as unknown as Fiber;
}

describe("ReactFiberHostContext", () => {
  describe("pushHostContainer / popHostContainer", () => {
    it("sets and unsets root host container", () => {
      const container = document.createElement("div");
      const fiber = makeHostRootFiber(container);

      pushHostContainer(fiber);
      expect(getRootHostContainer()).toBe(container);

      popHostContainer(fiber);
      expect(getRootHostContainer()).toBeNull();
    });
  });

  describe("pushHostContext / popHostContext", () => {
    it("pushes and pops context for HostComponent", () => {
      const container = document.createElement("div");
      const rootFiber = makeHostRootFiber(container);
      pushHostContainer(rootFiber);

      const childFiber = makeChildFiber(rootFiber, "div");
      expect(() => pushHostContext(childFiber)).not.toThrow();
      expect(() => popHostContext(childFiber)).not.toThrow();

      popHostContainer(rootFiber);
    });

    it("pushes context for function component fiber", () => {
      const container = document.createElement("div");
      const rootFiber = makeHostRootFiber(container);
      pushHostContainer(rootFiber);

      // Function component fiber (type is a function)
      const fnFiber = {
        ...makeChildFiber(rootFiber, "div"),
        type: function MyComp() { return null; },
      } as unknown as Fiber;

      expect(() => pushHostContext(fnFiber)).not.toThrow();
      expect(() => popHostContext(fnFiber)).not.toThrow();

      popHostContainer(rootFiber);
    });

    it("pushes context for fiber with object type", () => {
      const container = document.createElement("div");
      const rootFiber = makeHostRootFiber(container);
      pushHostContainer(rootFiber);

      // Fiber with object type (e.g., context provider)
      const objFiber = {
        ...makeChildFiber(rootFiber, "div"),
        type: { $$typeof: Symbol() },
      } as unknown as Fiber;

      expect(() => pushHostContext(objFiber)).not.toThrow();
      expect(() => popHostContext(objFiber)).not.toThrow();

      popHostContainer(rootFiber);
    });
  });

  describe("getHostContext", () => {
    it("returns null initially", () => {
      expect(getHostContext()).toBeNull();
    });
  });
});
