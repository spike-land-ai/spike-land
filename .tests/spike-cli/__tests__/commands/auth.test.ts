/**
 * Tests for commands/auth.ts covering uncovered branches:
 * Line 68: `${expired ? "expired" : "valid"}` — expired token branch
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockLoadTokens = vi.hoisted(() => vi.fn());
const mockIsTokenExpired = vi.hoisted(() => vi.fn());
const mockDeleteTokens = vi.hoisted(() => vi.fn());
const mockDeviceCodeLogin = vi.hoisted(() => vi.fn());
const mockRunOnboardingWizard = vi.hoisted(() => vi.fn());
const mockSubmitOnboarding = vi.hoisted(() => vi.fn());

vi.mock("../../../../src/spike-cli/auth/token-store.js", () => ({
  loadTokens: mockLoadTokens,
  isTokenExpired: mockIsTokenExpired,
  deleteTokens: mockDeleteTokens,
}));

vi.mock("../../../../src/spike-cli/auth/device-flow.js", () => ({
  deviceCodeLogin: mockDeviceCodeLogin,
}));

vi.mock("../../../../src/spike-cli/onboarding/wizard.js", () => ({
  runOnboardingWizard: mockRunOnboardingWizard,
  submitOnboarding: mockSubmitOnboarding,
}));

import { registerAuthCommand } from "../../../../src/spike-cli/commands/auth.js";

describe("auth status command", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  async function runAuthStatus(args: string[] = []) {
    const { Command } = await import("commander");
    const program = new Command("spike");
    program.exitOverride();
    registerAuthCommand(program);
    await program.parseAsync(["auth", "status", ...args], { from: "user" });
  }

  it("shows 'valid' when token is not expired (line 68 false branch)", async () => {
    mockLoadTokens.mockResolvedValue({
      baseUrl: "https://spike.land",
      accessToken: "tok",
    });
    mockIsTokenExpired.mockReturnValue(false);

    await runAuthStatus();

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("valid"));
    expect(errorSpy).not.toHaveBeenCalledWith(expect.stringContaining("expired"));
  });

  it("shows 'expired' when token is expired (line 68 true branch)", async () => {
    mockLoadTokens.mockResolvedValue({
      baseUrl: "https://spike.land",
      accessToken: "tok",
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    });
    mockIsTokenExpired.mockReturnValue(true);

    await runAuthStatus();

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("expired"));
  });

  it("shows 'Not logged in' when no tokens", async () => {
    mockLoadTokens.mockResolvedValue(null);

    await runAuthStatus();

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Not logged in"));
  });

  it("shows expiresAt when present", async () => {
    const expiresAt = "2026-12-31T00:00:00.000Z";
    mockLoadTokens.mockResolvedValue({
      baseUrl: "https://spike.land",
      accessToken: "tok",
      expiresAt,
    });
    mockIsTokenExpired.mockReturnValue(false);

    await runAuthStatus();

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Expires at"));
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining(expiresAt));
  });
});

describe("auth logout command", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockDeleteTokens.mockResolvedValue(undefined);
  });

  it("deletes tokens and prints confirmation", async () => {
    const { Command } = await import("commander");
    const program = new Command("spike");
    program.exitOverride();
    registerAuthCommand(program);
    await program.parseAsync(["auth", "logout"], { from: "user" });

    expect(mockDeleteTokens).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith("Logged out.");
  });
});
