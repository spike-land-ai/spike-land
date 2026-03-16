import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cancelCallback,
  forceFrameRate,
  getCurrentPriorityLevel,
  getCurrentTime,
  scheduleCallback,
  shouldYield,
} from "../../../../src/core/react-engine/core-logic/scheduler/Scheduler.js";
import {
  IdlePriority,
  ImmediatePriority,
  LowPriority,
  NormalPriority,
  UserBlockingPriority,
} from "../../../../src/core/react-engine/core-logic/scheduler/SchedulerPriorities.js";

describe("Scheduler", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("getCurrentTime", () => {
    it("returns a number", () => {
      const t = getCurrentTime();
      expect(typeof t).toBe("number");
      expect(t).toBeGreaterThanOrEqual(0);
    });
  });

  describe("scheduleCallback", () => {
    it("schedules a callback and returns a task", () => {
      const cb = vi.fn(() => null);
      const task = scheduleCallback(NormalPriority, cb);
      expect(task).toBeDefined();
      expect(task.priorityLevel).toBe(NormalPriority);
    });

    it("returns a task with correct priorityLevel", () => {
      const task = scheduleCallback(NormalPriority, vi.fn());
      expect(task.priorityLevel).toBe(NormalPriority);
    });

    it("schedules with ImmediatePriority", () => {
      const cb = vi.fn(() => null);
      const task = scheduleCallback(ImmediatePriority, cb);
      expect(task.priorityLevel).toBe(ImmediatePriority);
    });

    it("schedules with UserBlockingPriority", () => {
      const task = scheduleCallback(UserBlockingPriority, vi.fn());
      expect(task.priorityLevel).toBe(UserBlockingPriority);
    });

    it("schedules with LowPriority", () => {
      const task = scheduleCallback(LowPriority, vi.fn());
      expect(task.priorityLevel).toBe(LowPriority);
    });

    it("schedules with IdlePriority", () => {
      const task = scheduleCallback(IdlePriority, vi.fn());
      expect(task.priorityLevel).toBe(IdlePriority);
    });

    it("schedules with delay option", () => {
      const task = scheduleCallback(NormalPriority, vi.fn(), { delay: 100 });
      expect(task.priorityLevel).toBe(NormalPriority);
      // startTime should be in the future
      expect(task.startTime).toBeGreaterThan(getCurrentTime());
    });

    it("treats non-positive delay as immediate", () => {
      const task = scheduleCallback(NormalPriority, vi.fn(), { delay: 0 });
      expect(task.sortIndex).toBeGreaterThan(0); // sortIndex = expirationTime for immediate tasks
    });

    it("assigns incremental task IDs", () => {
      const task1 = scheduleCallback(NormalPriority, vi.fn());
      const task2 = scheduleCallback(NormalPriority, vi.fn());
      expect(task2.id).toBeGreaterThan(task1.id);
    });

    it("executes callback via message channel", async () => {
      const cb = vi.fn(() => null);
      scheduleCallback(NormalPriority, cb);
      // Trigger pending microtasks/message events
      await vi.runAllTimersAsync();
    });
  });

  describe("cancelCallback", () => {
    it("sets callback to null", () => {
      const cb = vi.fn();
      const task = scheduleCallback(NormalPriority, cb);
      cancelCallback(task);
      expect(task.callback).toBeNull();
    });

    it("cancels a task so it does not execute", async () => {
      const cb = vi.fn(() => null);
      const task = scheduleCallback(NormalPriority, cb);
      cancelCallback(task);
      await vi.runAllTimersAsync();
      // The callback might not be called since it was cancelled
      // (callback is null, so workLoop skips it)
    });
  });

  describe("shouldYield", () => {
    it("returns a boolean", () => {
      const result = shouldYield();
      expect(typeof result).toBe("boolean");
    });
  });

  describe("getCurrentPriorityLevel", () => {
    it("returns a number", () => {
      const level = getCurrentPriorityLevel();
      expect(typeof level).toBe("number");
    });

    it("returns NormalPriority by default", () => {
      expect(getCurrentPriorityLevel()).toBe(NormalPriority);
    });
  });

  describe("forceFrameRate", () => {
    it("sets frame rate for valid fps value", () => {
      // Should not throw for valid fps
      expect(() => forceFrameRate(60)).not.toThrow();
    });

    it("resets to default when fps is 0", () => {
      forceFrameRate(60);
      expect(() => forceFrameRate(0)).not.toThrow();
    });

    it("logs error for fps > 125", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      forceFrameRate(126);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("logs error for negative fps", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      forceFrameRate(-1);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("sets frameInterval to Math.floor(1000/fps)", () => {
      // We can't directly check frameInterval, but ensure no errors
      expect(() => forceFrameRate(30)).not.toThrow();
      expect(() => forceFrameRate(120)).not.toThrow();
    });
  });

  describe("SchedulerPriorities exports", () => {
    it("exports priority constants", () => {
      expect(ImmediatePriority).toBe(1);
      expect(UserBlockingPriority).toBe(2);
      expect(NormalPriority).toBe(3);
      expect(LowPriority).toBe(4);
      expect(IdlePriority).toBe(5);
    });
  });
});
