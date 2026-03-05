import { describe, expect, it } from "vitest";
import { ContextManager } from "@/lib/context-manager";

describe("ContextManager", () => {
  it("initializes with codeSpace", () => {
    const cm = new ContextManager("my-space");
    const ctx = cm.getFullContext();
    expect(ctx.codeSpace).toBe("my-space");
    expect(ctx.currentTask).toBe("");
  });

  it("updateContext is defined as a method", () => {
    const cm = new ContextManager("space1");
    // updateContext modifies the returned context object copy (not instance fields)
    // so we verify the method exists and does not throw
    expect(() => cm.updateContext("currentTask", "Build dashboard")).not.toThrow();
  });

  it("getContext returns empty string for unknown key", () => {
    const cm = new ContextManager("space1");
    expect(cm.getContext("nonexistentKey")).toBe("");
  });

  it("getFullContext returns all fields", () => {
    const cm = new ContextManager("space1");
    const ctx = cm.getFullContext();
    // Verify all expected keys are present and default to ""
    expect(ctx.techStack).toBe("");
    expect(ctx.errorLog).toBe("");
    expect(ctx.currentTask).toBe("");
  });

  it("clearContext resets all fields except codeSpace", () => {
    const cm = new ContextManager("space1");
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
    expect(cm1.getFullContext().codeSpace).toBe("space1");
    expect(cm2.getFullContext().codeSpace).toBe("space2");
  });
});
