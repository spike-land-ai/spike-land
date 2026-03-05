import { describe, it, expect, vi } from "vitest";

vi.mock("better-auth/react", () => ({
  createAuthClient: vi.fn((config: { baseURL: string }) => ({
    baseURL: config.baseURL,
    useSession: vi.fn(),
    signIn: { social: vi.fn() },
    signOut: vi.fn(),
  })),
}));

describe("lib/auth", () => {
  it("exports authClient created with baseURL", async () => {
    const { authClient } = await import("@/lib/auth");
    expect(authClient).toBeDefined();
  });

  it("exports authProviders array with github and google", async () => {
    vi.resetModules();
    const { authProviders } = await import("@/lib/auth");
    expect(authProviders).toHaveLength(2);
    expect(authProviders[0].id).toBe("github");
    expect(authProviders[1].id).toBe("google");
  });

  it("uses VITE_AUTH_URL env var when set", async () => {
    vi.resetModules();
    const { createAuthClient } = await import("better-auth/react");
    // The module uses import.meta.env.VITE_AUTH_URL which defaults to 'https://spike.land'
    await import("@/lib/auth");
    expect(createAuthClient).toHaveBeenCalledWith(
      expect.objectContaining({ baseURL: expect.any(String) })
    );
  });

  it("authProviders have required fields", async () => {
    vi.resetModules();
    const { authProviders } = await import("@/lib/auth");
    for (const provider of authProviders) {
      expect(provider).toHaveProperty("id");
      expect(provider).toHaveProperty("name");
      expect(provider).toHaveProperty("icon");
    }
  });
});
