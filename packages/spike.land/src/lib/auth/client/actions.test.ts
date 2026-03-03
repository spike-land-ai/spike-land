import { beforeEach, describe, expect, it, vi } from "vitest";

// Use vi.hoisted so mock fns are available inside vi.mock factory
const { mockSignIn, mockSignOut } = vi.hoisted(() => ({
  mockSignIn: vi.fn(),
  mockSignOut: vi.fn(),
}));

vi.mock("@/lib/auth/client", () => ({
  signIn: mockSignIn,
  signOut: mockSignOut,
  useSession: vi.fn(),
  SessionProvider: vi.fn(),
  authClient: {},
}));

import { signIn, signOut } from "./actions";
import type { SignInProvider } from "./actions";

describe("auth client actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("signIn", () => {
    it("delegates to signIn with default provider 'email' when no args", async () => {
      mockSignIn.mockResolvedValue({ ok: true });
      await signIn();
      expect(mockSignIn).toHaveBeenCalledWith("email", undefined);
    });

    it("passes provider to signIn", async () => {
      mockSignIn.mockResolvedValue({ ok: true });
      await signIn("github");
      expect(mockSignIn).toHaveBeenCalledWith("github", undefined);
    });

    it("passes provider and options to signIn", async () => {
      mockSignIn.mockResolvedValue({ ok: true });
      await signIn("google", { callbackUrl: "/dashboard", redirect: true });
      expect(mockSignIn).toHaveBeenCalledWith("google", {
        callbackUrl: "/dashboard",
        redirect: true,
      });
    });

    it("returns the result from signIn", async () => {
      const fakeResult = { ok: true, url: "/dashboard" };
      mockSignIn.mockResolvedValue(fakeResult);
      const result = await signIn("github");
      expect(result).toEqual(fakeResult);
    });

    it("supports all valid SignInProvider values", async () => {
      const providers: SignInProvider[] = [
        "github",
        "google",
        "apple",
        "facebook",
        "email",
        "qr-auth",
        "credentials",
      ];
      for (const provider of providers) {
        mockSignIn.mockResolvedValue({ ok: true });
        await signIn(provider);
        expect(mockSignIn).toHaveBeenCalledWith(provider, undefined);
      }
    });

    it("passes extra options fields through", async () => {
      mockSignIn.mockResolvedValue(null);
      await signIn("email", {
        callbackUrl: "/home",
        redirect: false,
        email: "user@test.com",
      });
      expect(mockSignIn).toHaveBeenCalledWith("email", {
        callbackUrl: "/home",
        redirect: false,
        email: "user@test.com",
      });
    });
  });

  describe("signOut", () => {
    it("delegates to signOut with no args", async () => {
      mockSignOut.mockResolvedValue(undefined);
      await signOut();
      expect(mockSignOut).toHaveBeenCalledWith(undefined);
    });

    it("passes options to signOut", async () => {
      mockSignOut.mockResolvedValue(undefined);
      await signOut({ callbackUrl: "/", redirect: true });
      expect(mockSignOut).toHaveBeenCalledWith({
        callbackUrl: "/",
        redirect: true,
      });
    });

    it("returns result from signOut", async () => {
      mockSignOut.mockResolvedValue({ url: "/" });
      const result = await signOut({ callbackUrl: "/" });
      expect(result).toEqual({ url: "/" });
    });
  });
});
