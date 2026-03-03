import { describe, it, expect, beforeEach } from "vitest";
import {
  createMachine,
  addState,
  addTransition,
  sendEvent,
  getState,
  resetMachine,
  clearMachines,
} from "./engine.js";

describe("Advanced Traffic Light machine", () => {
  let mId: string;

  beforeEach(() => {
    clearMachines();

    const machine = createMachine({
      name: "Advanced Traffic Light",
      userId: "user-123",
      initial: "system",
    });

    mId = machine.definition.id;

    addState(mId, {
      id: "system",
      type: "compound",
      initial: "normal",
    });

    addState(mId, {
      id: "normal",
      type: "atomic",
      parent: "system",
    });

    addState(mId, {
      id: "maintenance",
      type: "parallel",
      parent: "system",
    });

    addState(mId, { id: "diagnostics", type: "compound", parent: "maintenance", initial: "idle" });
    addState(mId, { id: "idle", type: "atomic", parent: "diagnostics" });
    addState(mId, { id: "running", type: "atomic", parent: "diagnostics" });

    addState(mId, {
      id: "lights",
      type: "compound",
      parent: "maintenance",
      initial: "flashing_yellow",
    });
    addState(mId, { id: "flashing_yellow", type: "atomic", parent: "lights" });

    addTransition(mId, {
      source: "normal",
      target: "maintenance",
      event: "MAINTENANCE_START",
      actions: [],
      internal: false,
    });

    addTransition(mId, {
      source: "maintenance",
      target: "normal",
      event: "MAINTENANCE_END",
      actions: [],
      internal: false,
    });

    addTransition(mId, {
      source: "idle",
      target: "running",
      event: "START_DIAG",
      actions: [],
      internal: false,
    });

    resetMachine(mId);
  });

  it("starts in normal state", () => {
    expect(getState(mId).activeStates).toContain("normal");
    expect(getState(mId).activeStates).toContain("system");
  });

  it("enters maintenance mode on MAINTENANCE_START", () => {
    sendEvent(mId, "MAINTENANCE_START");
    const { activeStates } = getState(mId);
    expect(activeStates).toContain("maintenance");
    expect(activeStates).toContain("diagnostics");
    expect(activeStates).toContain("idle");
    expect(activeStates).toContain("lights");
    expect(activeStates).toContain("flashing_yellow");
  });

  it("transitions diagnostics from idle to running on START_DIAG during maintenance", () => {
    sendEvent(mId, "MAINTENANCE_START");
    sendEvent(mId, "START_DIAG");
    const { activeStates } = getState(mId);
    expect(activeStates).toContain("running");
    expect(activeStates).toContain("maintenance");
  });

  it("returns to normal on MAINTENANCE_END", () => {
    sendEvent(mId, "MAINTENANCE_START");
    sendEvent(mId, "MAINTENANCE_END");
    const { activeStates } = getState(mId);
    expect(activeStates).toContain("normal");
    expect(activeStates).not.toContain("maintenance");
  });
});
