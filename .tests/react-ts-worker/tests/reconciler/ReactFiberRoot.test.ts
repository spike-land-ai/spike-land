import { describe, expect, it, vi } from "vitest";
import { createFiberRoot } from "../../../../src/core/react-engine/core-logic/reconciler/ReactFiberRoot.js";
import { HostRoot } from "../../../../src/core/react-engine/core-logic/reconciler/ReactWorkTags.js";
import { NoLanes } from "../../../../src/core/react-engine/core-logic/reconciler/ReactFiberLane.js";
import type { HostConfig } from "../../../../src/core/react-engine/core-logic/host-config/HostConfigInterface.js";

function makeHostConfig(): HostConfig {
  return {
    getRootHostContext: vi.fn(() => {}),
    getChildHostContext: vi.fn(() => {}),
    createInstance: vi.fn(() => document.createElement("div")),
    createTextInstance: vi.fn(() => document.createTextNode("")),
    appendInitialChild: vi.fn(),
    appendChild: vi.fn(),
    appendChildToContainer: vi.fn(),
    insertBefore: vi.fn(),
    insertInContainerBefore: vi.fn(),
    removeChild: vi.fn(),
    removeChildFromContainer: vi.fn(),
    commitUpdate: vi.fn(),
    commitTextUpdate: vi.fn(),
    resetTextContent: vi.fn(),
    hideInstance: vi.fn(),
    unhideInstance: vi.fn(),
    hideTextInstance: vi.fn(),
    unhideTextInstance: vi.fn(),
    clearContainer: vi.fn(),
    shouldSetTextContent: vi.fn(() => false),
    finalizeInitialChildren: vi.fn(() => false),
    prepareUpdate: vi.fn(() => ({})),
    prepareForCommit: vi.fn(() => null),
    resetAfterCommit: vi.fn(),
    supportsHydration: false,
  } as unknown as HostConfig;
}

describe("ReactFiberRoot", () => {
  describe("createFiberRoot", () => {
    it("creates a fiber root with container info", () => {
      const container = document.createElement("div");
      const hostConfig = makeHostConfig();
      const root = createFiberRoot(container, hostConfig);

      expect(root.containerInfo).toBe(container);
    });

    it("creates with a current HostRoot fiber", () => {
      const container = document.createElement("div");
      const hostConfig = makeHostConfig();
      const root = createFiberRoot(container, hostConfig);

      expect(root.current).toBeDefined();
      expect(root.current.tag).toBe(HostRoot);
    });

    it("current fiber stateNode points back to root", () => {
      const container = document.createElement("div");
      const hostConfig = makeHostConfig();
      const root = createFiberRoot(container, hostConfig);

      expect(root.current.stateNode).toBe(root);
    });

    it("initializes lanes to NoLanes", () => {
      const container = document.createElement("div");
      const hostConfig = makeHostConfig();
      const root = createFiberRoot(container, hostConfig);

      expect(root.pendingLanes).toBe(NoLanes);
      expect(root.suspendedLanes).toBe(NoLanes);
      expect(root.pingedLanes).toBe(NoLanes);
      expect(root.expiredLanes).toBe(NoLanes);
      expect(root.entangledLanes).toBe(NoLanes);
    });

    it("initializes entanglements as an array", () => {
      const container = document.createElement("div");
      const hostConfig = makeHostConfig();
      const root = createFiberRoot(container, hostConfig);

      expect(Array.isArray(root.entanglements)).toBe(true);
      expect(root.entanglements.length).toBe(31); // TotalLanes
    });

    it("initializes pending passive effects", () => {
      const container = document.createElement("div");
      const hostConfig = makeHostConfig();
      const root = createFiberRoot(container, hostConfig);

      expect(root.pendingPassiveEffects).toBeDefined();
      expect(root.pendingPassiveEffects.unmount).toEqual([]);
      expect(root.pendingPassiveEffects.mount).toEqual([]);
      expect(root.pendingPassiveEffects.update).toEqual([]);
    });

    it("initializes finishedWork to null", () => {
      const container = document.createElement("div");
      const hostConfig = makeHostConfig();
      const root = createFiberRoot(container, hostConfig);

      expect(root.finishedWork).toBeNull();
    });

    it("has hostConfig stored", () => {
      const container = document.createElement("div");
      const hostConfig = makeHostConfig();
      const root = createFiberRoot(container, hostConfig);

      expect(root.hostConfig).toBe(hostConfig);
    });

    it("current fiber has an update queue", () => {
      const container = document.createElement("div");
      const hostConfig = makeHostConfig();
      const root = createFiberRoot(container, hostConfig);

      expect(root.current.updateQueue).toBeDefined();
      expect(root.current.updateQueue).not.toBeNull();
    });

    it("initializes with empty identifier prefix", () => {
      const container = document.createElement("div");
      const hostConfig = makeHostConfig();
      const root = createFiberRoot(container, hostConfig);

      expect(root.identifierPrefix).toBe("");
      expect(root.identifierCount).toBe(0);
    });
  });
});
