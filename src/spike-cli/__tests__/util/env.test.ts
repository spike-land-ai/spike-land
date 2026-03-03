import { afterEach, describe, expect, it, vi } from "vitest";
import { expandEnvRecord, expandEnvVars } from "../../util/env.js";
import * as logger from "../../util/logger.js";

describe("expandEnvVars", () => {
  const testEnv: Record<string, string> = {
    HOME: "/home/user",
    TOKEN: "secret123",
    EMPTY: "",
  };

  it("expands a single variable", () => {
    expect(expandEnvVars("${HOME}/config", testEnv)).toBe("/home/user/config");
  });

  it("expands multiple variables", () => {
    expect(expandEnvVars("${HOME}/${TOKEN}", testEnv)).toBe("/home/user/secret123");
  });

  it("returns empty string for undefined variables", () => {
    expect(expandEnvVars("${UNDEFINED_VAR}", testEnv)).toBe("");
  });

  it("returns empty string for defined but empty variables", () => {
    expect(expandEnvVars("prefix${EMPTY}suffix", testEnv)).toBe("prefixsuffix");
  });

  it("returns string unchanged if no variables present", () => {
    expect(expandEnvVars("no variables here", testEnv)).toBe("no variables here");
  });

  it("handles adjacent variables", () => {
    expect(expandEnvVars("${HOME}${TOKEN}", testEnv)).toBe("/home/usersecret123");
  });
});

describe("expandEnvRecord", () => {
  it("expands all values in a record", () => {
    const env = { API_KEY: "abc" };
    const record = {
      AUTH: "Bearer ${API_KEY}",
      PLAIN: "no-vars",
    };
    expect(expandEnvRecord(record, env)).toEqual({
      AUTH: "Bearer abc",
      PLAIN: "no-vars",
    });
  });

  it("handles empty record", () => {
    expect(expandEnvRecord({}, {})).toEqual({});
  });
});

describe("expandEnvVars warnings", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("warns when env variable is missing", () => {
    const warnSpy = vi.spyOn(logger, "warn").mockImplementation(() => {});
    expandEnvVars("${MISSING_VAR}", {});
    expect(warnSpy).toHaveBeenCalledOnce();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("MISSING_VAR"));
  });

  it("does not warn when env variable is set", () => {
    const warnSpy = vi.spyOn(logger, "warn").mockImplementation(() => {});
    expandEnvVars("${MY_VAR}", { MY_VAR: "value" });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("does not warn when env variable is empty string but present", () => {
    const warnSpy = vi.spyOn(logger, "warn").mockImplementation(() => {});
    expandEnvVars("${MY_VAR}", { MY_VAR: "" });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("expandEnvRecord warns for each missing var", () => {
    const warnSpy = vi.spyOn(logger, "warn").mockImplementation(() => {});
    const record = {
      A: "${MISSING_A}",
      B: "${MISSING_B}",
    };
    expandEnvRecord(record, {});
    expect(warnSpy).toHaveBeenCalledTimes(2);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("MISSING_A"));
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("MISSING_B"));
  });
});
