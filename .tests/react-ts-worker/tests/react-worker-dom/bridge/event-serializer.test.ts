import { describe, expect, it } from "vitest";
import { serializeEvent } from "../../../../../src/react-ts-worker/react-worker-dom/bridge/event-serializer.js";

describe("serializeEvent", () => {
  it("serializes basic event properties", () => {
    const event = new Event("click", { bubbles: true, cancelable: true });
    const data = serializeEvent(event, 42);

    expect(data.type).toBe("click");
    expect(data.bubbles).toBe(true);
    expect(data.cancelable).toBe(true);
    expect(data.target).toBe(42);
    expect(data.currentTarget).toBe(42);
  });

  it("serializes mouse event properties", () => {
    const event = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      clientX: 100,
      clientY: 200,
      pageX: 110,
      pageY: 210,
      button: 1,
      buttons: 2,
      ctrlKey: true,
      shiftKey: false,
      altKey: true,
      metaKey: false,
    });

    const data = serializeEvent(event, 1);

    expect(data.clientX).toBe(100);
    expect(data.clientY).toBe(200);
    // jsdom may not support pageX/pageY fully
    expect(typeof data.pageX).toBe("number");
    expect(typeof data.pageY).toBe("number");
    expect(data.button).toBe(1);
    expect(data.buttons).toBe(2);
    expect(data.ctrlKey).toBe(true);
    expect(data.shiftKey).toBe(false);
    expect(data.altKey).toBe(true);
    expect(data.metaKey).toBe(false);
  });

  it("serializes keyboard event properties", () => {
    const event = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key: "Enter",
      code: "Enter",
      ctrlKey: true,
      shiftKey: false,
      altKey: false,
      metaKey: false,
    });

    const data = serializeEvent(event, 1);

    expect(data.key).toBe("Enter");
    expect(data.code).toBe("Enter");
    expect(data.ctrlKey).toBe(true);
    expect(data.shiftKey).toBe(false);
  });

  it("does not include clientX for plain Event", () => {
    const event = new Event("scroll", { bubbles: false, cancelable: false });
    const data = serializeEvent(event, 1);

    expect(data.clientX).toBeUndefined();
    expect(data.button).toBeUndefined();
  });

  it("does not include key for plain Event", () => {
    const event = new Event("submit", { bubbles: true, cancelable: true });
    const data = serializeEvent(event, 1);

    expect(data.key).toBeUndefined();
    expect(data.code).toBeUndefined();
  });

  it("includes timeStamp from event", () => {
    const event = new Event("click", { bubbles: true, cancelable: true });
    const data = serializeEvent(event, 5);

    expect(typeof data.timeStamp).toBe("number");
  });

  it("serializes input event with target value", () => {
    // Create an input element with a value to simulate input event
    const input = document.createElement("input");
    input.value = "hello";

    // Create event and manually set target
    const event = new Event("input", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "target", { value: input, writable: false });

    const data = serializeEvent(event, 1) as typeof data & { targetValue?: string };

    expect(data.targetValue).toBe("hello");
  });

  it("serializes change event with target value", () => {
    const input = document.createElement("input");
    input.value = "changed";

    const event = new Event("change", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "target", { value: input, writable: false });

    const data = serializeEvent(event, 1) as typeof data & { targetValue?: string };

    expect(data.targetValue).toBe("changed");
  });

  it("does not add targetValue when target has no value", () => {
    const div = document.createElement("div");

    const event = new Event("input", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "target", { value: div, writable: false });

    const data = serializeEvent(event, 1) as typeof data & { targetValue?: string };

    expect(data.targetValue).toBeUndefined();
  });
});
