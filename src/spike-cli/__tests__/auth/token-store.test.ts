import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { join } from "node:path";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";

// Mock homedir to use a temp directory
const mockHomedir = vi.hoisted(() => vi.fn());

vi.mock("node:os", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:os")>();
  return {
    ...actual,
    default: { ...actual, homedir: mockHomedir },
    homedir: mockHomedir,
  };
});

import {
  deleteTokens,
  getAuthPath,
  hasValidToken,
  isTokenExpired,
  loadTokens,
  saveTokens,
} from "../../auth/token-store.js";
import type { AuthTokens } from "../../auth/token-store.js";

describe("token-store", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "spike-auth-test-"));
    mockHomedir.mockReturnValue(tempDir);
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  const sampleTokens: AuthTokens = {
    clientId: "test-client-id",
    accessToken: "test-access-token",
    refreshToken: "test-refresh-token",
    baseUrl: "https://spike.land",
    expiresAt: new Date(Date.now() + 3600_000).toISOString(),
  };

  it("getAuthPath returns ~/.spike/auth.json", () => {
    expect(getAuthPath()).toBe(join(tempDir, ".spike", "auth.json"));
  });

  it("loadTokens returns null when file is missing", async () => {
    const result = await loadTokens();
    expect(result).toBeNull();
  });

  it("save/load round-trip preserves tokens", async () => {
    await saveTokens(sampleTokens);
    const loaded = await loadTokens();
    expect(loaded).toEqual(sampleTokens);
  });

  it("saveTokens creates file with mode 0o600", async () => {
    await saveTokens(sampleTokens);
    const stats = await stat(getAuthPath());
    // Check owner-only read/write (0o600 = 0o100600, mask with 0o777)
    expect(stats.mode & 0o777).toBe(0o600);
  });

  it("deleteTokens removes the file", async () => {
    await saveTokens(sampleTokens);
    await deleteTokens();
    const result = await loadTokens();
    expect(result).toBeNull();
  });

  it("deleteTokens does not throw when file is missing", async () => {
    await expect(deleteTokens()).resolves.not.toThrow();
  });

  describe("isTokenExpired", () => {
    it("returns false when no expiresAt", () => {
      expect(isTokenExpired({ ...sampleTokens, expiresAt: undefined })).toBe(false);
    });

    it("returns false when token is still valid", () => {
      const future = new Date(Date.now() + 3600_000).toISOString();
      expect(isTokenExpired({ ...sampleTokens, expiresAt: future })).toBe(false);
    });

    it("returns true when token is expired", () => {
      const past = new Date(Date.now() - 1000).toISOString();
      expect(isTokenExpired({ ...sampleTokens, expiresAt: past })).toBe(true);
    });
  });

  describe("hasValidToken", () => {
    it("returns false when no tokens saved", async () => {
      expect(await hasValidToken()).toBe(false);
    });

    it("returns true when token is valid", async () => {
      await saveTokens(sampleTokens);
      expect(await hasValidToken()).toBe(true);
    });

    it("returns false when token is expired", async () => {
      await saveTokens({
        ...sampleTokens,
        expiresAt: new Date(Date.now() - 1000).toISOString(),
      });
      expect(await hasValidToken()).toBe(false);
    });
  });
});
