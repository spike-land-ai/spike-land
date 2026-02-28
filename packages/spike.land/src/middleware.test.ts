import { beforeEach, describe, expect, it, vi } from "vitest";
import { isProtectedPath, shouldRewriteToGenerate } from "./proxy";

// Mock next-auth to avoid real auth calls in proxy tests
vi.mock("next-auth", () => ({
  default: () => ({ auth: vi.fn() }),
}));

vi.mock("@/auth.config", () => ({
  authConfig: { providers: [], callbacks: {} },
}));

vi.mock("@/lib/security/csp-nonce", () => ({
  CSP_NONCE_HEADER: "x-nonce",
  generateNonce: () => "test-nonce",
}));

vi.mock("@/lib/security/timing", () => ({
  secureCompare: vi.fn().mockReturnValue(false),
}));

describe("shouldRewriteToGenerate", () => {
  it("does not rewrite root path", () => {
    expect(shouldRewriteToGenerate("/")).toBe(false);
  });

  it("does not rewrite known routes", () => {
    const knownRoutes = [
      "/about",
      "/apps/spike-land-admin",
      "/api/auth",
      "/create/test",
      "/settings",
    ];
    for (const route of knownRoutes) {
      expect(shouldRewriteToGenerate(route)).toBe(false);
    }
  });

  it("does not rewrite /g/ routes", () => {
    expect(shouldRewriteToGenerate("/g/cooking/thai-curry")).toBe(false);
  });

  it("rewrites unknown routes", () => {
    expect(shouldRewriteToGenerate("/cooking/thai-curry")).toBe(true);
    expect(shouldRewriteToGenerate("/random-app")).toBe(true);
    expect(shouldRewriteToGenerate("/some/nested/path")).toBe(true);
  });

  it("does not rewrite static files", () => {
    expect(shouldRewriteToGenerate("/favicon.ico")).toBe(false);
    expect(shouldRewriteToGenerate("/image.png")).toBe(false);
  });

  it("does not rewrite paths with file extensions in nested segments", () => {
    expect(shouldRewriteToGenerate("/docs-data/search-index.json")).toBe(false);
    expect(shouldRewriteToGenerate("/some-path/file.css")).toBe(false);
    expect(shouldRewriteToGenerate("/assets/logo.svg")).toBe(false);
  });
});

describe("isProtectedPath", () => {
  it("returns false for public paths", () => {
    expect(isProtectedPath("/")).toBe(false);
    expect(isProtectedPath("/auth/signin")).toBe(false);
    expect(isProtectedPath("/auth/error")).toBe(false);
    expect(isProtectedPath("/api/auth")).toBe(false);
    expect(isProtectedPath("/apps")).toBe(false);
  });

  it("returns true for protected paths", () => {
    expect(isProtectedPath("/settings")).toBe(true);
    expect(isProtectedPath("/profile")).toBe(true);
    expect(isProtectedPath("/admin")).toBe(true);
  });
});

describe("proxy POST redirect for auth pages", () => {
  let proxy: typeof import("./proxy").proxy;

  beforeEach(async () => {
    vi.resetModules();

    vi.doMock("next-auth", () => ({
      default: () => ({ auth: vi.fn().mockResolvedValue(null) }),
    }));
    vi.doMock("@/auth.config", () => ({
      authConfig: { providers: [], callbacks: {} },
    }));
    vi.doMock("@/lib/security/csp-nonce", () => ({
      CSP_NONCE_HEADER: "x-nonce",
      generateNonce: () => "test-nonce",
    }));
    vi.doMock("@/lib/security/timing", () => ({
      secureCompare: vi.fn().mockReturnValue(false),
    }));

    const mod = await import("./proxy");
    proxy = mod.proxy;
  });

  it("redirects POST /auth/signin to GET with 303 status", async () => {
    const { NextRequest } = await import("next/server");
    const request = new NextRequest("http://localhost:3000/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ foo: "bar" }),
    });

    const response = await proxy(request);

    expect(response.status).toBe(303);
    const location = response.headers.get("location");
    expect(location).toContain("/auth/signin");
  });

  it("redirects POST /auth/error to GET with 303 status", async () => {
    const { NextRequest } = await import("next/server");
    const request = new NextRequest("http://localhost:3000/auth/error", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: "invalid body",
    });

    const response = await proxy(request);

    expect(response.status).toBe(303);
    const location = response.headers.get("location");
    expect(location).toContain("/auth/error");
  });

  it("does not redirect GET /auth/signin", async () => {
    const { NextRequest } = await import("next/server");
    const request = new NextRequest("http://localhost:3000/auth/signin", {
      method: "GET",
    });

    const response = await proxy(request);

    // Should not be a 303 redirect
    expect(response.status).not.toBe(303);
  });

  it("does not redirect POST to /api/auth routes", async () => {
    const { NextRequest } = await import("next/server");
    const request = new NextRequest("http://localhost:3000/api/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "csrfToken=test",
    });

    const response = await proxy(request);

    // Should not be a 303 redirect (api routes handle POST normally)
    expect(response.status).not.toBe(303);
  });
});
