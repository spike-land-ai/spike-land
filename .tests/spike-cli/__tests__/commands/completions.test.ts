/**
 * Tests for commands/completions.ts covering the commander action branches.
 * Lines 40-41: uninstall with unknown shell → console.error + process.exit(1)
 * Line 48: uninstall when no completions found → console.error with "No completions"
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Command } from "commander";
import { registerCompletionsCommand } from "../../../../src/spike-cli/commands/completions.js";

// Mock the installer module
const mockDetectShell = vi.hoisted(() => vi.fn().mockReturnValue("bash"));
const mockInstallCompletions = vi.hoisted(() =>
  vi.fn().mockReturnValue({
    path: "/home/user/.spike/completions/spike.bash",
    instructions: "source the file",
  }),
);
const mockUninstallCompletions = vi.hoisted(() => vi.fn().mockReturnValue(false));

vi.mock("../../../../src/spike-cli/completions/installer.js", () => ({
  detectShell: mockDetectShell,
  installCompletions: mockInstallCompletions,
  uninstallCompletions: mockUninstallCompletions,
}));

describe("completions command", () => {
  let program: Command;
  const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
    throw new Error("process.exit called");
  });
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  beforeEach(() => {
    vi.clearAllMocks();
    program = new Command();
    program.exitOverride();
    registerCompletionsCommand(program);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("completions uninstall", () => {
    it("exits with error when shell is unknown on uninstall (lines 40-41)", async () => {
      mockDetectShell.mockReturnValue("unknown");

      await expect(
        program.parseAsync(["completions", "uninstall"], { from: "user" }),
      ).rejects.toThrow("process.exit called");

      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Could not detect shell"),
      );
    });

    it("shows 'No completions found' when uninstall returns false (line 48)", async () => {
      mockDetectShell.mockReturnValue("bash");
      mockUninstallCompletions.mockReturnValue(false);

      await program.parseAsync(["completions", "uninstall"], { from: "user" });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("No completions found"),
      );
    });

    it("shows removal confirmation when uninstall returns true", async () => {
      mockDetectShell.mockReturnValue("bash");
      mockUninstallCompletions.mockReturnValue(true);

      await program.parseAsync(["completions", "uninstall"], { from: "user" });

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("removed"));
    });
  });

  describe("completions install", () => {
    it("exits with error when shell is unknown on install (lines 17-19)", async () => {
      mockDetectShell.mockReturnValue("unknown");

      await expect(
        program.parseAsync(["completions", "install"], { from: "user" }),
      ).rejects.toThrow("process.exit called");

      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it("installs completions for detected shell", async () => {
      mockDetectShell.mockReturnValue("bash");

      await program.parseAsync(["completions", "install"], { from: "user" });

      expect(mockInstallCompletions).toHaveBeenCalledWith("bash");
    });

    it("handles install error with instanceof Error (line 27)", async () => {
      mockDetectShell.mockReturnValue("bash");
      mockInstallCompletions.mockImplementationOnce(() => {
        throw new Error("permission denied");
      });

      await expect(
        program.parseAsync(["completions", "install"], { from: "user" }),
      ).rejects.toThrow("process.exit called");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("permission denied"),
      );
    });

    it("handles install error with non-Error value (line 27 String branch)", async () => {
      mockDetectShell.mockReturnValue("bash");
      mockInstallCompletions.mockImplementationOnce(() => {
        const nonError: unknown = "string error";
        throw nonError;
      });

      await expect(
        program.parseAsync(["completions", "install"], { from: "user" }),
      ).rejects.toThrow("process.exit called");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("string error"),
      );
    });
  });
});
