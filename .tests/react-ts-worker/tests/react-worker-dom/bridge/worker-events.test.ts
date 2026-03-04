import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  setupWorkerEventReceiver,
  WorkerEventRegistry,
} from "../../../../../src/react-ts-worker/react-worker-dom/bridge/worker-events.js";
import { WorkerNodeImpl } from "../../../../../src/react-ts-worker/react-worker-dom/bridge/worker-document.js";

describe("WorkerEventRegistry", () => {
  describe("setHandler", () => {
    it("registers event handler for a node", () => {
      const registry = new WorkerEventRegistry();
      const handler = vi.fn();

      registry.setHandler(1, "onClick", handler);

      // Dispatch to verify handler is registered
      const node = new WorkerNodeImpl();
      Object.defineProperty(node, "__nodeId", { value: 1 });
      const nodeMap = new Map([[1, node]]);

      registry.dispatch(
        {
          type: "click",
          bubbles: true,
          cancelable: true,
          target: 1,
          currentTarget: 1,
          timeStamp: 100,
        },
        nodeMap,
      );

      expect(handler).toHaveBeenCalled();
    });

    it("ignores invalid prop names", () => {
      const registry = new WorkerEventRegistry();
      const handler = vi.fn();

      // Should not throw for invalid prop names
      expect(() => registry.setHandler(1, "className", handler)).not.toThrow();
      expect(() => registry.setHandler(1, "on", handler)).not.toThrow();
    });

    it("overwrites existing handler", () => {
      const registry = new WorkerEventRegistry();
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      registry.setHandler(1, "onClick", handler1);
      registry.setHandler(1, "onClick", handler2);

      const node = new WorkerNodeImpl();
      Object.defineProperty(node, "__nodeId", { value: 1 });
      const nodeMap = new Map([[1, node]]);

      registry.dispatch(
        {
          type: "click",
          bubbles: true,
          cancelable: true,
          target: 1,
          currentTarget: 1,
          timeStamp: 100,
        },
        nodeMap,
      );

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });
  });

  describe("removeHandler", () => {
    it("removes handler for a node", () => {
      const registry = new WorkerEventRegistry();
      const handler = vi.fn();

      registry.setHandler(1, "onClick", handler);
      registry.removeHandler(1, "onClick");

      const node = new WorkerNodeImpl();
      Object.defineProperty(node, "__nodeId", { value: 1 });
      const nodeMap = new Map([[1, node]]);

      registry.dispatch(
        {
          type: "click",
          bubbles: true,
          cancelable: true,
          target: 1,
          currentTarget: 1,
          timeStamp: 100,
        },
        nodeMap,
      );

      expect(handler).not.toHaveBeenCalled();
    });

    it("removes node handlers map when last handler removed", () => {
      const registry = new WorkerEventRegistry();
      const handler = vi.fn();

      registry.setHandler(1, "onClick", handler);
      registry.removeHandler(1, "onClick");

      // Remove non-existent should not throw
      expect(() => registry.removeHandler(1, "onClick")).not.toThrow();
    });

    it("ignores removeHandler for non-existent node", () => {
      const registry = new WorkerEventRegistry();
      expect(() => registry.removeHandler(999, "onClick")).not.toThrow();
    });

    it("ignores invalid prop name in removeHandler", () => {
      const registry = new WorkerEventRegistry();
      expect(() => registry.removeHandler(1, "className")).not.toThrow();
    });
  });

  describe("dispatch", () => {
    it("creates synthetic event with all data fields", () => {
      const registry = new WorkerEventRegistry();
      let receivedEvent: unknown = null;
      const handler = vi.fn((e) => { receivedEvent = e; });

      registry.setHandler(1, "onClick", handler);

      const node = new WorkerNodeImpl();
      Object.defineProperty(node, "__nodeId", { value: 1 });
      const nodeMap = new Map([[1, node]]);

      registry.dispatch(
        {
          type: "click",
          bubbles: true,
          cancelable: true,
          target: 1,
          currentTarget: 1,
          timeStamp: 150,
          clientX: 10,
          clientY: 20,
          key: "a",
          ctrlKey: true,
        },
        nodeMap,
      );

      expect(handler).toHaveBeenCalled();
      expect((receivedEvent as Record<string, unknown>)["timeStamp"]).toBe(150);
      expect((receivedEvent as Record<string, unknown>)["clientX"]).toBe(10);
    });

    it("bubbles event up parent chain", () => {
      const registry = new WorkerEventRegistry();
      const parentHandler = vi.fn();

      registry.setHandler(2, "onClick", parentHandler);

      const child = new WorkerNodeImpl();
      Object.defineProperty(child, "__nodeId", { value: 1 });

      const parent = new WorkerNodeImpl();
      Object.defineProperty(parent, "__nodeId", { value: 2 });
      child.parentNode = parent;

      const nodeMap = new Map([[1, child], [2, parent]]);

      registry.dispatch(
        {
          type: "click",
          bubbles: true,
          cancelable: true,
          target: 1,
          currentTarget: 1,
          timeStamp: 100,
        },
        nodeMap,
      );

      expect(parentHandler).toHaveBeenCalled();
    });

    it("stopPropagation prevents further bubbling", () => {
      const registry = new WorkerEventRegistry();
      const childHandler = vi.fn((e) => { e.stopPropagation(); });
      const parentHandler = vi.fn();

      registry.setHandler(1, "onClick", childHandler);
      registry.setHandler(2, "onClick", parentHandler);

      const child = new WorkerNodeImpl();
      Object.defineProperty(child, "__nodeId", { value: 1 });

      const parent = new WorkerNodeImpl();
      Object.defineProperty(parent, "__nodeId", { value: 2 });
      child.parentNode = parent;

      const nodeMap = new Map([[1, child], [2, parent]]);

      registry.dispatch(
        {
          type: "click",
          bubbles: true,
          cancelable: true,
          target: 1,
          currentTarget: 1,
          timeStamp: 100,
        },
        nodeMap,
      );

      expect(childHandler).toHaveBeenCalled();
      expect(parentHandler).not.toHaveBeenCalled();
    });

    it("handles target not in nodeMap", () => {
      const registry = new WorkerEventRegistry();
      const nodeMap = new Map<number, WorkerNodeImpl>();

      // Should not throw
      expect(() => registry.dispatch(
        {
          type: "click",
          bubbles: true,
          cancelable: true,
          target: 999,
          currentTarget: 999,
          timeStamp: 100,
        },
        nodeMap,
      )).not.toThrow();
    });

    it("preventDefault sets defaultPrevented", () => {
      const registry = new WorkerEventRegistry();
      let receivedEvent: unknown = null;
      const handler = vi.fn((e) => {
        e.preventDefault();
        receivedEvent = e;
      });

      registry.setHandler(1, "onClick", handler);

      const node = new WorkerNodeImpl();
      Object.defineProperty(node, "__nodeId", { value: 1 });
      const nodeMap = new Map([[1, node]]);

      registry.dispatch(
        {
          type: "click",
          bubbles: true,
          cancelable: true,
          target: 1,
          currentTarget: 1,
          timeStamp: 100,
        },
        nodeMap,
      );

      expect((receivedEvent as Record<string, unknown>)["defaultPrevented"]).toBe(true);
    });

    it("sets currentTarget to current node during dispatch", () => {
      const registry = new WorkerEventRegistry();
      let currentTargetDuringCall: unknown = undefined;

      const handler = vi.fn((e) => {
        currentTargetDuringCall = e.currentTarget;
      });

      registry.setHandler(1, "onClick", handler);

      const node = new WorkerNodeImpl();
      Object.defineProperty(node, "__nodeId", { value: 1 });
      const nodeMap = new Map([[1, node]]);

      registry.dispatch(
        {
          type: "click",
          bubbles: true,
          cancelable: true,
          target: 1,
          currentTarget: 1,
          timeStamp: 100,
        },
        nodeMap,
      );

      expect(currentTargetDuringCall).toBe(node);
    });
  });
});

describe("setupWorkerEventReceiver", () => {
  beforeEach(() => {
    vi.stubGlobal("self", {
      addEventListener: vi.fn(),
      postMessage: vi.fn(),
    });
  });

  it("adds message listener to self", () => {
    const registry = new WorkerEventRegistry();
    const nodeMap = new Map<number, WorkerNodeImpl>();

    setupWorkerEventReceiver(registry, nodeMap);

    expect((self as unknown as Record<string, unknown>).addEventListener).toHaveBeenCalledWith(
      "message",
      expect.any(Function),
    );
  });

  it("dispatches event messages to registry", () => {
    const registry = new WorkerEventRegistry();
    const dispatchSpy = vi.spyOn(registry, "dispatch");
    const nodeMap = new Map<number, WorkerNodeImpl>();

    let messageHandler: ((ev: MessageEvent) => void) | null = null;
    vi.stubGlobal("self", {
      addEventListener: vi.fn((event, handler) => {
        if (event === "message") messageHandler = handler;
      }),
      postMessage: vi.fn(),
    });

    setupWorkerEventReceiver(registry, nodeMap);

    const eventData = {
      type: "click",
      bubbles: true,
      cancelable: true,
      target: 1,
      currentTarget: 1,
      timeStamp: 100,
    };

    messageHandler?.({
      data: { kind: "event", event: eventData },
    } as MessageEvent);

    expect(dispatchSpy).toHaveBeenCalledWith(eventData, nodeMap);
  });

  it("ignores non-event messages", () => {
    const registry = new WorkerEventRegistry();
    const dispatchSpy = vi.spyOn(registry, "dispatch");
    const nodeMap = new Map<number, WorkerNodeImpl>();

    let messageHandler: ((ev: MessageEvent) => void) | null = null;
    vi.stubGlobal("self", {
      addEventListener: vi.fn((event, handler) => {
        if (event === "message") messageHandler = handler;
      }),
      postMessage: vi.fn(),
    });

    setupWorkerEventReceiver(registry, nodeMap);

    messageHandler?.({
      data: { kind: "mutations", mutations: [] },
    } as MessageEvent);

    expect(dispatchSpy).not.toHaveBeenCalled();
  });
});
