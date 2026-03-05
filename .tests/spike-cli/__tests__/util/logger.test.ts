import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { error, isVerbose, log, setVerbose, warn } from "../../../../src/spike-cli/util/logger.js";

describe("logger", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    setVerbose(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("log()", () => {
    it("is silent by default", () => {
      log("test message");
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it("outputs when verbose=true", () => {
      setVerbose(true);
      log("test");
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("test"));
    });

    it("includes [spike] prefix when verbose", () => {
      setVerbose(true);
      log("hello");
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("[spike]"));
    });

    it("is silent again after setVerbose(false)", () => {
      setVerbose(true);
      setVerbose(false);
      log("should not appear");
      expect(errorSpy).not.toHaveBeenCalled();
    });
  });

  describe("warn()", () => {
    it("always outputs regardless of verbose setting", () => {
      warn("warning message");
      expect(errorSpy).toHaveBeenCalled();
    });

    it("includes [spike WARN] prefix", () => {
      warn("something wrong");
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("[spike WARN]"),
        // no extra args in this call
      );
    });
  });

  describe("error()", () => {
    it("always outputs regardless of verbose setting", () => {
      error("error message");
      expect(errorSpy).toHaveBeenCalled();
    });

    it("includes [spike ERROR] prefix", () => {
      error("something broke");
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("[spike ERROR]"));
    });
  });

  describe("isVerbose()", () => {
    it("returns false when verbose is not set", () => {
      setVerbose(false);
      expect(isVerbose()).toBe(false);
    });

    it("returns true after setVerbose(true)", () => {
      setVerbose(true);
      expect(isVerbose()).toBe(true);
    });
  });
});
