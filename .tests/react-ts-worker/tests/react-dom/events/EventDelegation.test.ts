import { describe, expect, it, vi } from "vitest";
import {
  listenToAllSupportedEvents,
  setFiberOnNode,
  setPropsOnNode,
} from "../../../../../src/core/react-engine/core-logic/react-dom/events/EventDelegation.js";
import { HostComponent } from "../../../../../src/core/react-engine/core-logic/reconciler/ReactWorkTags.js";

describe("EventDelegation", () => {
  describe("setFiberOnNode", () => {
    it("sets fiber reference on DOM node", () => {
      const node = document.createElement("div");
      const fiber = { tag: HostComponent, stateNode: node, return: null, memoizedProps: {} };

      setFiberOnNode(node, fiber);

      const key = Object.keys(node).find((k) => k.startsWith("__reactFiber$"));
      expect(key).toBeTruthy();
    });
  });

  describe("setPropsOnNode", () => {
    it("sets props on DOM node", () => {
      const node = document.createElement("div");
      const props = { onClick: vi.fn(), className: "test" };

      setPropsOnNode(node, props);

      const key = Object.keys(node).find((k) => k.startsWith("__reactProps$"));
      expect(key).toBeTruthy();
    });
  });

  describe("listenToAllSupportedEvents", () => {
    it("adds event listeners to container", () => {
      const container = document.createElement("div");
      const addEventListenerSpy = vi.spyOn(container, "addEventListener");

      listenToAllSupportedEvents(container);

      expect(addEventListenerSpy).toHaveBeenCalled();
      addEventListenerSpy.mockRestore();
    });

    it("does not add listeners twice for same container", () => {
      const container = document.createElement("div");
      const addEventListenerSpy = vi.spyOn(container, "addEventListener");

      listenToAllSupportedEvents(container);
      const firstCallCount = addEventListenerSpy.mock.calls.length;

      listenToAllSupportedEvents(container);
      // Should not add more listeners
      expect(addEventListenerSpy.mock.calls.length).toBe(firstCallCount);

      addEventListenerSpy.mockRestore();
    });

    it("listens for click events", () => {
      const container = document.createElement("div");
      const addEventListenerSpy = vi.spyOn(container, "addEventListener");

      listenToAllSupportedEvents(container);

      const eventNames = addEventListenerSpy.mock.calls.map((call) => call[0]);
      expect(eventNames).toContain("click");

      addEventListenerSpy.mockRestore();
    });

    it("dispatches click event to handler on fiber", () => {
      const container = document.createElement("div");
      document.body.appendChild(container);

      const target = document.createElement("button");
      container.appendChild(target);

      const clickHandler = vi.fn();
      const fiber = {
        tag: HostComponent,
        stateNode: target,
        return: null,
        memoizedProps: { onClick: clickHandler },
      };

      setFiberOnNode(target, fiber);
      setPropsOnNode(target, { onClick: clickHandler });
      listenToAllSupportedEvents(container);

      const clickEvent = new MouseEvent("click", { bubbles: true });
      target.dispatchEvent(clickEvent);

      expect(clickHandler).toHaveBeenCalled();

      document.body.removeChild(container);
    });

    it("dispatches to capture phase handlers", () => {
      const container = document.createElement("div");
      document.body.appendChild(container);

      const target = document.createElement("button");
      container.appendChild(target);

      const captureHandler = vi.fn();
      const fiber = {
        tag: HostComponent,
        stateNode: target,
        return: null,
        memoizedProps: { onClickCapture: captureHandler },
      };

      setFiberOnNode(target, fiber);
      setPropsOnNode(target, { onClickCapture: captureHandler });
      listenToAllSupportedEvents(container);

      const clickEvent = new MouseEvent("click", { bubbles: true });
      target.dispatchEvent(clickEvent);

      expect(captureHandler).toHaveBeenCalled();

      document.body.removeChild(container);
    });

    it("handles event when no fiber found on target", () => {
      const container2 = document.createElement("div");
      document.body.appendChild(container2);

      listenToAllSupportedEvents(container2);

      const target = document.createElement("button");
      container2.appendChild(target);

      // No fiber set on target - should not throw
      expect(() => {
        target.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      }).not.toThrow();

      document.body.removeChild(container2);
    });

    it("stops propagation when handler calls stopPropagation", () => {
      const container = document.createElement("div");
      document.body.appendChild(container);

      const target = document.createElement("button");
      container.appendChild(target);

      const innerHandler = vi.fn((e: { stopPropagation: () => void }) => {
        e.stopPropagation();
      });
      const outerHandler = vi.fn();

      const outerDiv = document.createElement("div");
      container.appendChild(outerDiv);
      outerDiv.appendChild(target);

      const targetFiber = {
        tag: HostComponent,
        stateNode: target,
        return: null,
        memoizedProps: { onClick: innerHandler },
      };
      const outerFiber = {
        tag: HostComponent,
        stateNode: outerDiv,
        return: null,
        memoizedProps: { onClick: outerHandler },
      };
      targetFiber.return = outerFiber as never;

      setFiberOnNode(target, targetFiber);
      setPropsOnNode(target, { onClick: innerHandler });

      setFiberOnNode(outerDiv, outerFiber);
      setPropsOnNode(outerDiv, { onClick: outerHandler });

      listenToAllSupportedEvents(container);

      target.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      expect(innerHandler).toHaveBeenCalled();
      expect(outerHandler).not.toHaveBeenCalled();

      document.body.removeChild(container);
    });
  });
});
