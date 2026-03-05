import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Mock the authClient before importing useAuth
vi.mock("@/lib/auth", () => ({
  authClient: {
    useSession: vi.fn(),
    signIn: {
      social: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
    signOut: vi.fn().mockResolvedValue({}),
  },
  authProviders: [
    { id: "github", name: "GitHub", icon: "github" },
    { id: "google", name: "Google", icon: "google" },
  ],
}));

const { authClient } = await import("@/lib/auth");
const { useAuth } = await import("@/hooks/useAuth");

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns loading state when session is pending", () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: null,
      isPending: true,
      error: null,
    } as never);

    const { result } = renderHook(() => useAuth());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it("returns authenticated state when session has user", () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: "u1", name: "Alice", email: "alice@example.com", image: null } },
      isPending: false,
      error: null,
    } as never);

    const { result } = renderHook(() => useAuth());
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.user).toEqual({
      sub: "u1",
      name: "Alice",
      email: "alice@example.com",
      picture: null,
      preferred_username: "Alice",
    });
  });

  it("maps user fields correctly including image as picture", () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: {
        user: { id: "u2", name: "Bob", email: "bob@test.com", image: "https://avatar.url/bob.png" },
      },
      isPending: false,
      error: null,
    } as never);

    const { result } = renderHook(() => useAuth());
    expect(result.current.user?.picture).toBe("https://avatar.url/bob.png");
  });

  it("returns null user when not authenticated", () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: null,
      isPending: false,
      error: null,
    } as never);

    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("login() calls authClient.signIn.social with github by default", async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: null,
      isPending: false,
      error: null,
    } as never);

    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.login();
    });

    expect(authClient.signIn.social).toHaveBeenCalledWith({
      provider: "github",
      callbackURL: "/",
    });
  });

  it("login() uses specified provider", async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: null,
      isPending: false,
      error: null,
    } as never);

    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.login("google");
    });

    expect(authClient.signIn.social).toHaveBeenCalledWith({
      provider: "google",
      callbackURL: "/",
    });
  });

  it("logout() calls authClient.signOut", async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: "u1", name: "Alice", email: "alice@test.com", image: null } },
      isPending: false,
      error: null,
    } as never);

    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.logout();
    });

    expect(authClient.signOut).toHaveBeenCalledOnce();
  });

  it("returns error when session has an error", () => {
    const sessionError = new Error("Session expired");
    vi.mocked(authClient.useSession).mockReturnValue({
      data: null,
      isPending: false,
      error: sessionError,
    } as never);

    const { result } = renderHook(() => useAuth());
    expect(result.current.error).toEqual(sessionError);
  });

  it("captures auth error in state via useSafeSession", async () => {
    const sessionError = new Error("Auth failure");
    vi.mocked(authClient.useSession).mockReturnValue({
      data: null,
      isPending: false,
      error: sessionError,
    } as never);

    const { result } = renderHook(() => useAuth());
    // After error is captured, isLoading should be false
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
  });
});
