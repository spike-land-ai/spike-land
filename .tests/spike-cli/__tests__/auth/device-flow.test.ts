import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { join } from "node:path";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";

// Mock homedir
const mockHomedir = vi.hoisted(() => vi.fn());

vi.mock("node:os", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:os")>();
  return {
    ...actual,
    default: { ...actual, homedir: mockHomedir, platform: actual.platform },
    homedir: mockHomedir,
    platform: actual.platform,
  };
});

// Mock child_process
vi.mock("node:child_process", () => {
  const mocked = { execFile: vi.fn() };
  return { ...mocked, default: mocked };
});

// Mock fetch
const mockFetch = vi.hoisted(() => vi.fn());
vi.stubGlobal("fetch", mockFetch);

import { deviceCodeLogin } from "../../../../src/spike-cli/auth/device-flow.js";
import * as tokenStore from "../../../../src/spike-cli/auth/token-store.js";

describe("deviceCodeLogin", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "spike-device-test-"));
    vi.clearAllMocks();
    mockHomedir.mockReturnValue(tempDir);
    vi.useFakeTimers();
  });

  afterEach(async () => {
    vi.useRealTimers();
    await rm(tempDir, { recursive: true, force: true });
  });

  const baseUrl = "https://spike.land";

  function mockRegisterResponse(clientId = "new-client-id") {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ client_id: clientId }),
    });
  }

  function mockDeviceCodeResponse(interval = 1) {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        device_code: "dev-code",
        user_code: "ABCD-1234",
        verification_uri: "https://spike.land/device",
        expires_in: 300,
        interval,
      }),
    });
  }

  function mockPollPending() {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "authorization_pending" }),
    });
  }

  function mockPollSuccess() {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: "at-123",
        refresh_token: "rt-456",
        expires_in: 3600,
        token_type: "Bearer",
      }),
    });
  }

  async function driveToCompletion<T>(promise: Promise<T>): Promise<T> {
    // Advance timers repeatedly to drive the polling loop
    for (let i = 0; i < 20; i++) {
      await vi.advanceTimersByTimeAsync(5_000);
    }
    return promise;
  }

  it("registers client, requests device code, polls and returns tokens", async () => {
    mockRegisterResponse();
    mockDeviceCodeResponse();
    mockPollSuccess();

    const onUserCode = vi.fn();
    const promise = deviceCodeLogin({ baseUrl, onUserCode });
    const tokens = await driveToCompletion(promise);

    expect(onUserCode).toHaveBeenCalledWith("ABCD-1234", "https://spike.land/device");
    expect(tokens.accessToken).toBe("at-123");
    expect(tokens.refreshToken).toBe("rt-456");
    expect(tokens.clientId).toBe("new-client-id");
    expect(tokens.baseUrl).toBe(baseUrl);

    // Verify saved to disk
    vi.useRealTimers();
    const saved = await tokenStore.loadTokens();
    expect(saved?.accessToken).toBe("at-123");
  });

  it("handles authorization_pending then success", async () => {
    mockRegisterResponse();
    mockDeviceCodeResponse();
    mockPollPending();
    mockPollSuccess();

    const promise = deviceCodeLogin({ baseUrl });
    const tokens = await driveToCompletion(promise);
    expect(tokens.accessToken).toBe("at-123");
  });

  it("handles slow_down by increasing interval", async () => {
    mockRegisterResponse();
    mockDeviceCodeResponse();

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "slow_down" }),
    });
    mockPollSuccess();

    const promise = deviceCodeLogin({ baseUrl });
    const tokens = await driveToCompletion(promise);
    expect(tokens.accessToken).toBe("at-123");
    // 4 calls: register, device code, slow_down poll, success poll
    expect(mockFetch).toHaveBeenCalledTimes(4);
  });

  it("throws on expired_token", async () => {
    mockRegisterResponse();
    mockDeviceCodeResponse();

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "expired_token" }),
    });

    const promise = deviceCodeLogin({ baseUrl });
    // Attach rejection handler immediately to prevent unhandled rejection
    const caught = promise.catch((e: Error) => e);
    await vi.advanceTimersByTimeAsync(5_000);
    const error = await caught;
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toContain("Device code expired");
  });

  it("opens browser with xdg-open on linux platform", async () => {
    const os = await import("node:os");
    const platformSpy = vi.spyOn(os, "platform").mockReturnValue("linux" as NodeJS.Platform);
    const childProcess = await import("node:child_process");
    const execFileSpy = vi.spyOn(childProcess, "execFile").mockImplementation(() => ({}) as ReturnType<typeof childProcess.execFile>);

    mockRegisterResponse();
    mockDeviceCodeResponse();
    mockPollSuccess();

    const promise = deviceCodeLogin({ baseUrl });
    await driveToCompletion(promise);

    expect(execFileSpy).toHaveBeenCalledWith("xdg-open", expect.any(Array));
    platformSpy.mockRestore();
    execFileSpy.mockRestore();
  });

  it("throws on access_denied", async () => {
    mockRegisterResponse();
    mockDeviceCodeResponse();

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "access_denied" }),
    });

    const promise = deviceCodeLogin({ baseUrl });
    const caught = promise.catch((e: Error) => e);
    await vi.advanceTimersByTimeAsync(5_000);
    const error = await caught;
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toContain("Access denied");
  });

  it("throws on unexpected poll error", async () => {
    mockRegisterResponse();
    mockDeviceCodeResponse();

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "some_unknown_error" }),
    });

    const promise = deviceCodeLogin({ baseUrl });
    const caught = promise.catch((e: Error) => e);
    await vi.advanceTimersByTimeAsync(5_000);
    const error = await caught;
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toContain("Unexpected poll error");
  });

  it("does not open browser on unsupported platform (win32)", async () => {
    const os = await import("node:os");
    const platformSpy = vi.spyOn(os, "platform").mockReturnValue("win32" as NodeJS.Platform);
    const childProcess = await import("node:child_process");
    const execFileSpy = vi.spyOn(childProcess, "execFile").mockImplementation(
      () => ({}) as ReturnType<typeof childProcess.execFile>,
    );

    mockRegisterResponse();
    mockDeviceCodeResponse();
    mockPollSuccess();

    const promise = deviceCodeLogin({ baseUrl });
    await driveToCompletion(promise);

    // Neither "open" nor "xdg-open" should be called on win32
    expect(execFileSpy).not.toHaveBeenCalled();
    platformSpy.mockRestore();
    execFileSpy.mockRestore();
  });

  it("returns tokens without expiresAt when expires_in is not in response", async () => {
    mockRegisterResponse();
    mockDeviceCodeResponse();
    // Token response without expires_in
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: "at-no-expiry",
        token_type: "Bearer",
        // no expires_in
      }),
    });

    const promise = deviceCodeLogin({ baseUrl });
    const tokens = await driveToCompletion(promise);
    expect(tokens.accessToken).toBe("at-no-expiry");
    expect(tokens.expiresAt).toBeUndefined();
  });

  it("throws when client registration fails (non-ok response)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: "Bad Request",
    });

    const promise = deviceCodeLogin({ baseUrl });
    const caught = promise.catch((e: Error) => e);
    await vi.advanceTimersByTimeAsync(5_000);
    const error = await caught;
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toContain("Client registration failed");
  });

  it("throws when device code request fails (non-ok response)", async () => {
    mockRegisterResponse();
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
    });

    const promise = deviceCodeLogin({ baseUrl });
    const caught = promise.catch((e: Error) => e);
    await vi.advanceTimersByTimeAsync(5_000);
    const error = await caught;
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toContain("Device code request failed");
  });

  it("throws 'Device code expired' when polling loop deadline is exceeded", async () => {
    mockRegisterResponse();
    // Device code with short expiry so deadline passes during poll
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        device_code: "dev-code",
        user_code: "ABCD-1234",
        verification_uri: "https://spike.land/device",
        expires_in: 2,
        interval: 1,
      }),
    });
    // Each poll takes 1 sleep(1000ms) + 1 fetch; with expires_in:2, 2 polls exhaust deadline
    mockPollPending();
    mockPollPending();
    // After 2 polls (2 × sleep(1s)), Date.now() >= deadline → loop exits

    const promise = deviceCodeLogin({ baseUrl });
    const caught = promise.catch((e: Error) => e);
    // Advance enough for 1 sleep(1000ms) + fetch to execute, then deadline passes
    await vi.advanceTimersByTimeAsync(10_000);
    const error = await caught;
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toContain("Device code expired");
  });

  it("reuses existing clientId when tokens are already saved", async () => {
    // Mock loadTokens to return existing tokens directly, avoiding
    // async file I/O under fake timers which hangs in CI.
    vi.spyOn(tokenStore, "loadTokens").mockResolvedValueOnce({
      clientId: "existing-client",
      accessToken: "old-token",
      baseUrl,
    });

    // No register mock — goes straight to device code
    mockDeviceCodeResponse();
    mockPollSuccess();

    const promise = deviceCodeLogin({ baseUrl });
    const tokens = await driveToCompletion(promise);

    // Should be 2 calls (device code + poll), not 3 (no register)
    expect(mockFetch).toHaveBeenCalledTimes(2);
    const firstCallUrl = mockFetch.mock.calls[0][0] as string;
    expect(firstCallUrl).toContain("/api/mcp/oauth/device");
    expect(firstCallUrl).not.toContain("/register");
    expect(tokens.clientId).toBe("existing-client");
  });
});
