import { describe, expect, it } from "vitest";
import {
  getAllNativeEvents,
  getNativeEventsForReactEvent,
  getReactNameFromPropKey,
  getReactNamesForNativeEvent,
  isDiscreteEvent,
  isNonBubblingEvent,
} from "../../../../../src/core/react-engine/core-logic/react-dom/events/EventRegistry.js";

describe("EventRegistry", () => {
  describe("getReactNamesForNativeEvent", () => {
    it("returns react names for known native events", () => {
      const names = getReactNamesForNativeEvent("click");
      expect(names).toContain("onClick");
    });

    it("returns empty array for unknown events", () => {
      const names = getReactNamesForNativeEvent("unknownevent");
      expect(names).toEqual([]);
    });

    it("returns multiple react names when applicable", () => {
      const names = getReactNamesForNativeEvent("input");
      expect(names.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("getNativeEventsForReactEvent", () => {
    it("returns native events for onClick", () => {
      const events = getNativeEventsForReactEvent("onClick");
      expect(events).toContain("click");
    });

    it("returns native events for onChange", () => {
      const events = getNativeEventsForReactEvent("onChange");
      expect(events.length).toBeGreaterThanOrEqual(1);
    });

    it("returns empty array for unknown event", () => {
      const events = getNativeEventsForReactEvent("onUnknown");
      expect(events).toEqual([]);
    });
  });

  describe("isDiscreteEvent", () => {
    it("click is a discrete event", () => {
      expect(isDiscreteEvent("click")).toBe(true);
    });

    it("keydown is a discrete event", () => {
      expect(isDiscreteEvent("keydown")).toBe(true);
    });

    it("mousemove is not a discrete event", () => {
      expect(isDiscreteEvent("mousemove")).toBe(false);
    });

    it("scroll is not a discrete event", () => {
      expect(isDiscreteEvent("scroll")).toBe(false);
    });

    it("touchstart is a discrete event", () => {
      expect(isDiscreteEvent("touchstart")).toBe(true);
    });

    it("input is a discrete event", () => {
      expect(isDiscreteEvent("input")).toBe(true);
    });

    it("submit is a discrete event", () => {
      expect(isDiscreteEvent("submit")).toBe(true);
    });

    it("unknown event is not discrete", () => {
      expect(isDiscreteEvent("unknownevent")).toBe(false);
    });
  });

  describe("isNonBubblingEvent", () => {
    it("scroll is non-bubbling", () => {
      expect(isNonBubblingEvent("scroll")).toBe(true);
    });

    it("load is non-bubbling", () => {
      expect(isNonBubblingEvent("load")).toBe(true);
    });

    it("error is non-bubbling", () => {
      expect(isNonBubblingEvent("error")).toBe(true);
    });

    it("mouseenter is non-bubbling", () => {
      expect(isNonBubblingEvent("mouseenter")).toBe(true);
    });

    it("mouseleave is non-bubbling", () => {
      expect(isNonBubblingEvent("mouseleave")).toBe(true);
    });

    it("click is bubbling", () => {
      expect(isNonBubblingEvent("click")).toBe(false);
    });
  });

  describe("getAllNativeEvents", () => {
    it("returns a Set of native event names", () => {
      const events = getAllNativeEvents();
      expect(events instanceof Set).toBe(true);
    });

    it("includes common events", () => {
      const events = getAllNativeEvents();
      expect(events.has("click")).toBe(true);
      expect(events.has("keydown")).toBe(true);
      expect(events.has("mousemove")).toBe(true);
    });

    it("returns non-empty set", () => {
      const events = getAllNativeEvents();
      expect(events.size).toBeGreaterThan(10);
    });
  });

  describe("getReactNameFromPropKey", () => {
    it("returns same key for valid react event prop", () => {
      expect(getReactNameFromPropKey("onClick")).toBe("onClick");
    });

    it("returns base name for Capture events", () => {
      expect(getReactNameFromPropKey("onClickCapture")).toBe("onClick");
    });

    it("returns null for non-event props", () => {
      expect(getReactNameFromPropKey("className")).toBeNull();
    });

    it("returns null for unknown capture events", () => {
      expect(getReactNameFromPropKey("onUnknownCapture")).toBeNull();
    });

    it("handles onDoubleClick", () => {
      expect(getReactNameFromPropKey("onDoubleClick")).toBe("onDoubleClick");
    });

    it("handles onDoubleClickCapture", () => {
      expect(getReactNameFromPropKey("onDoubleClickCapture")).toBe("onDoubleClick");
    });

    it("returns null for Capture suffix without base", () => {
      expect(getReactNameFromPropKey("Capture")).toBeNull();
    });
  });
});
