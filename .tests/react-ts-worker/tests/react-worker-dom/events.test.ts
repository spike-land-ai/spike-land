import { describe, expect, it } from "vitest";
import {
  CAPTURED_EVENTS,
  createEventFromTransfer,
  setupEventForwarding,
} from "../../../../src/react-ts-worker/react-worker-dom/events.js";
import type { TransferrableEventData } from "../../../../src/react-ts-worker/react-worker-dom/events.js";

describe("react-worker-dom events", () => {
  describe("createEventFromTransfer", () => {
    it("creates an Event with correct type", () => {
      const data: TransferrableEventData = {
        type: "click",
        bubbles: true,
        cancelable: true,
        target: 1,
        currentTarget: 1,
        timeStamp: 100,
      };
      const event = createEventFromTransfer(data);
      expect(event.type).toBe("click");
    });

    it("sets bubbles and cancelable from data", () => {
      const data: TransferrableEventData = {
        type: "submit",
        bubbles: false,
        cancelable: true,
        target: 1,
        currentTarget: 1,
        timeStamp: 200,
      };
      const event = createEventFromTransfer(data);
      expect(event.bubbles).toBe(false);
      expect(event.cancelable).toBe(true);
    });

    it("copies mouse event properties with defaults", () => {
      const data: TransferrableEventData = {
        type: "click",
        bubbles: true,
        cancelable: true,
        target: 1,
        currentTarget: 1,
        timeStamp: 100,
        clientX: 50,
        clientY: 60,
        pageX: 70,
        pageY: 80,
        button: 1,
        buttons: 2,
      };
      const event = createEventFromTransfer(data);
      expect((event as MouseEvent & { clientX: number }).clientX).toBe(50);
      expect((event as unknown as Record<string, number>)["clientY"]).toBe(60);
    });

    it("uses default values when mouse props missing", () => {
      const data: TransferrableEventData = {
        type: "click",
        bubbles: true,
        cancelable: true,
        target: 1,
        currentTarget: 1,
        timeStamp: 100,
      };
      const event = createEventFromTransfer(data);
      const ev = event as unknown as Record<string, number>;
      expect(ev["clientX"]).toBe(0);
      expect(ev["button"]).toBe(0);
    });

    it("copies keyboard event properties", () => {
      const data: TransferrableEventData = {
        type: "keydown",
        bubbles: true,
        cancelable: true,
        target: 1,
        currentTarget: 1,
        timeStamp: 100,
        key: "Enter",
        code: "Enter",
        keyCode: 13,
        charCode: 0,
        which: 13,
      };
      const event = createEventFromTransfer(data);
      const ev = event as unknown as Record<string, unknown>;
      expect(ev["key"]).toBe("Enter");
      expect(ev["code"]).toBe("Enter");
      expect(ev["keyCode"]).toBe(13);
    });

    it("copies modifier keys", () => {
      const data: TransferrableEventData = {
        type: "click",
        bubbles: true,
        cancelable: true,
        target: 1,
        currentTarget: 1,
        timeStamp: 100,
        ctrlKey: true,
        shiftKey: true,
        altKey: false,
        metaKey: false,
      };
      const event = createEventFromTransfer(data);
      const ev = event as unknown as Record<string, boolean>;
      expect(ev["ctrlKey"]).toBe(true);
      expect(ev["shiftKey"]).toBe(true);
      expect(ev["altKey"]).toBe(false);
    });
  });

  describe("setupEventForwarding", () => {
    it("returns a function", () => {
      const forwarder = setupEventForwarding((event, targetNodeId) => {
        void event;
        void targetNodeId;
      });
      expect(typeof forwarder).toBe("function");
    });

    it("calls onEvent with created event and target id", () => {
      let receivedEvent: Event | null = null;
      let receivedTargetId: number | null = null;

      const forwarder = setupEventForwarding((event, targetNodeId) => {
        receivedEvent = event;
        receivedTargetId = targetNodeId;
      });

      const data: TransferrableEventData = {
        type: "click",
        bubbles: true,
        cancelable: true,
        target: 42,
        currentTarget: 42,
        timeStamp: 100,
      };

      forwarder(data);

      expect(receivedEvent).not.toBeNull();
      expect(receivedTargetId).toBe(42);
    });

    it("passes event type correctly", () => {
      let receivedEvent: Event | null = null;

      const forwarder = setupEventForwarding((event) => {
        receivedEvent = event;
      });

      const data: TransferrableEventData = {
        type: "keydown",
        bubbles: true,
        cancelable: true,
        target: 5,
        currentTarget: 5,
        timeStamp: 200,
        key: "a",
      };

      forwarder(data);

      expect(receivedEvent?.type).toBe("keydown");
    });
  });

  describe("CAPTURED_EVENTS", () => {
    it("is a readonly array", () => {
      expect(Array.isArray(CAPTURED_EVENTS)).toBe(true);
    });

    it("includes common events", () => {
      expect(CAPTURED_EVENTS).toContain("click");
      expect(CAPTURED_EVENTS).toContain("keydown");
      expect(CAPTURED_EVENTS).toContain("touchstart");
      expect(CAPTURED_EVENTS).toContain("focus");
    });

    it("has more than 10 events", () => {
      expect(CAPTURED_EVENTS.length).toBeGreaterThan(10);
    });
  });
});
