import { describe, expect, it } from "vitest";
import { ContextManager } from "@/lib/context-manager";

describe("ContextManager", () => {
  it("initializes with codeSpace", () => {
    const cm = new ContextManager("my-space");
    const ctx = cm.getFullContext();
    expect(ctx.codeSpace).toBe("my-space");
    expect(ctx.currentTask).toBe("");
  });

  it("updateContext sets a key", () => {
    const cm = new ContextManager("space1");
    cm.updateContext("currentTask", "Build dashboard");
    expect(cm.getContext("currentTask")).toBe("Build dashboard");
  });

  it("getContext returns empty string for unknown key", () => {
    const cm = new ContextManager("space1");
    expect(cm.getContext("nonexistentKey")).toBe("");
  });

  it("getFullContext returns all fields", () => {
    const cm = new ContextManager("space1");
    cm.updateContext("techStack", "React + TypeScript");
    cm.updateContext("errorLog", "TypeError: undefined");
    const ctx = cm.getFullContext();
    expect(ctx.techStack).toBe("React + TypeScript");
    expect(ctx.errorLog).toBe("TypeError: undefined");
  });

  it("clearContext resets all fields except codeSpace", () => {
    const cm = new ContextManager("space1");
    cm.updateContext("currentTask", "Task A");
    cm.updateContext("techStack", "Vue");
    cm.updateContext("completionCriteria", "All tests pass");
    cm.updateContext("codeStructure", "MVC");
    cm.updateContext("currentDraft", "draft v1");
    cm.updateContext("adaptiveInstructions", "use hooks");
    cm.updateContext("errorLog", "some error");
    cm.updateContext("progressTracker", "50%");
    cm.clearContext();

    const ctx = cm.getFullContext();
    expect(ctx.currentTask).toBe("");
    expect(ctx.techStack).toBe("");
    expect(ctx.completionCriteria).toBe("");
    expect(ctx.codeStructure).toBe("");
    expect(ctx.currentDraft).toBe("");
    expect(ctx.adaptiveInstructions).toBe("");
    expect(ctx.errorLog).toBe("");
    expect(ctx.progressTracker).toBe("");
  });

  it("multiple instances are independent", () => {
    const cm1 = new ContextManager("space1");
    const cm2 = new ContextManager("space2");
    cm1.updateContext("currentTask", "Task from space1");
    expect(cm2.getContext("currentTask")).toBe("");
  });
});
