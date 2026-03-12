import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAuth } from "../../src/edge-api/auth/db-auth/auth.js";
import type { Env } from "../../src/edge-api/auth/db-auth/auth.js";

// Mock drizzle-orm/d1
vi.mock("drizzle-orm/d1", () => ({
  drizzle: vi.fn(() => ({
    query: {
      user: {
        findFirst: vi.fn(),
      },
    },
  })),
}));

// Mock better-auth
vi.mock("better-auth", () => ({
  betterAuth: vi.fn((config: Record<string, unknown>) => ({
    _config: config,
    handler: vi.fn(async (_req: Request) => new Response("auth handler", { status: 200 })),
    api: {
      getSession: vi.fn(async () => null),
    },
  })),
}));

// Mock @better-auth/drizzle-adapter
vi.mock("@better-auth/drizzle-adapter", () => ({
  drizzleAdapter: vi.fn((_db: unknown, _opts: unknown) => ({
    type: "drizzle-adapter",
  })),
}));

// Mock better-auth/plugins
vi.mock("better-auth/plugins", () => ({
  magicLink: vi.fn((_opts: unknown) => ({ id: "magic-link" })),
}));

// Mock better-auth/api
vi.mock("better-auth/api", () => ({
  createAuthEndpoint: vi.fn((_path: string, _opts: unknown, handler: unknown) => handler),
}));

const makeEnv = (overrides: Partial<Env> = {}): Env => ({
  AUTH_DB: {} as D1Database,
  BETTER_AUTH_SECRET: "test-secret",
  APP_URL: "https://example.com",
  GOOGLE_CLIENT_ID: "google-id",
  GOOGLE_CLIENT_SECRET: "google-secret",
  GITHUB_CLIENT_ID: "github-id",
  GITHUB_CLIENT_SECRET: "github-secret",
  APPLE_CLIENT_ID: "apple-id",
  APPLE_CLIENT_SECRET: "apple-secret",
  ...overrides,
});

describe("createAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an auth instance with handler and api", () => {
    const env = makeEnv();
    const auth = createAuth(env);
    expect(auth).toBeDefined();
    expect(typeof auth.handler).toBe("function");
    expect(auth.api).toBeDefined();
    expect(typeof auth.api.getSession).toBe("function");
  });

  it("calls betterAuth with the secret from env", async () => {
    const { betterAuth } = await import("better-auth");
    const env = makeEnv({ BETTER_AUTH_SECRET: "my-secret-123" });
    createAuth(env);
    expect(betterAuth).toHaveBeenCalledOnce();
    const callArg = vi.mocked(betterAuth).mock.calls[0][0] as Record<string, unknown>;
    expect(callArg.secret).toBe("my-secret-123");
  });

  it("uses APP_URL when provided", async () => {
    const { betterAuth } = await import("better-auth");
    const env = makeEnv({ APP_URL: "https://myapp.example.com" });
    createAuth(env);
    const callArg = vi.mocked(betterAuth).mock.calls[0][0] as Record<string, unknown>;
    expect(callArg.baseURL).toBe("https://myapp.example.com");
  });

  it("falls back to https://auth-mcp.spike.land when APP_URL is not provided", async () => {
    const { betterAuth } = await import("better-auth");
    const env = makeEnv({ APP_URL: undefined });
    createAuth(env);
    const callArg = vi.mocked(betterAuth).mock.calls[0][0] as Record<string, unknown>;
    expect(callArg.baseURL).toBe("https://auth-mcp.spike.land");
  });

  it("trusts analytics.spike.land as a first-party origin", async () => {
    const { betterAuth } = await import("better-auth");
    const env = makeEnv();
    createAuth(env);
    const callArg = vi.mocked(betterAuth).mock.calls[0][0] as { trustedOrigins: string[] };
    expect(callArg.trustedOrigins).toContain("https://analytics.spike.land");
  });

  it("configures social providers with env values", async () => {
    const { betterAuth } = await import("better-auth");
    const env = makeEnv({
      GOOGLE_CLIENT_ID: "gid",
      GOOGLE_CLIENT_SECRET: "gsecret",
      GITHUB_CLIENT_ID: "ghid",
      GITHUB_CLIENT_SECRET: "ghsecret",
      APPLE_CLIENT_ID: "aid",
      APPLE_CLIENT_SECRET: "asecret",
    });
    createAuth(env);
    const callArg = vi.mocked(betterAuth).mock.calls[0][0] as Record<string, unknown>;
    expect(callArg.socialProviders.google.clientId).toBe("gid");
    expect(callArg.socialProviders.google.clientSecret).toBe("gsecret");
    expect(callArg.socialProviders.github.clientId).toBe("ghid");
    expect(callArg.socialProviders.github.clientSecret).toBe("ghsecret");
    expect(callArg.socialProviders.apple.clientId).toBe("aid");
    expect(callArg.socialProviders.apple.clientSecret).toBe("asecret");
  });

  it("defaults social provider secrets to undefined (omitted) when not provided", async () => {
    const { betterAuth } = await import("better-auth");
    const env = makeEnv({
      GOOGLE_CLIENT_ID: undefined,
      GOOGLE_CLIENT_SECRET: undefined,
      GITHUB_CLIENT_ID: undefined,
      GITHUB_CLIENT_SECRET: undefined,
      APPLE_CLIENT_ID: undefined,
      APPLE_CLIENT_SECRET: undefined,
    });
    createAuth(env);
    const callArg = vi.mocked(betterAuth).mock.calls[0][0] as {
      socialProviders: Record<string, unknown>;
    };
    expect(callArg.socialProviders.google).toBeUndefined();
    expect(callArg.socialProviders.github).toBeUndefined();
    expect(callArg.socialProviders.apple).toBeUndefined();
  });

  it("enables email and password auth", async () => {
    const { betterAuth } = await import("better-auth");
    const env = makeEnv();
    createAuth(env);
    const callArg = vi.mocked(betterAuth).mock.calls[0][0] as Record<string, unknown>;
    expect(callArg.emailAndPassword.enabled).toBe(true);
  });

  it("configures session cookie cache with maxAge 60", async () => {
    const { betterAuth } = await import("better-auth");
    const env = makeEnv();
    createAuth(env);
    const callArg = vi.mocked(betterAuth).mock.calls[0][0] as Record<string, unknown>;
    expect(callArg.session.cookieCache.enabled).toBe(true);
    expect(callArg.session.cookieCache.maxAge).toBe(60);
  });

  it("configures user additional fields with role", async () => {
    const { betterAuth } = await import("better-auth");
    const env = makeEnv();
    createAuth(env);
    const callArg = vi.mocked(betterAuth).mock.calls[0][0] as Record<string, unknown>;
    expect(callArg.user.additionalFields.role.type).toBe("string");
  });

  it("includes magicLink and qr-auth plugins", async () => {
    const { betterAuth } = await import("better-auth");
    const env = makeEnv();
    createAuth(env);
    const callArg = vi.mocked(betterAuth).mock.calls[0][0] as Record<string, unknown>;
    expect(Array.isArray(callArg.plugins)).toBe(true);
    expect(callArg.plugins.length).toBeGreaterThanOrEqual(2);
    // qr-auth plugin has id field
    const qrPlugin = callArg.plugins.find((p: { id?: string }) => p.id === "qr-auth");
    expect(qrPlugin).toBeDefined();
  });

  it("QR auth endpoint returns 501 not implemented", async () => {
    const { betterAuth } = await import("better-auth");
    const env = makeEnv();
    createAuth(env);
    const callArg = vi.mocked(betterAuth).mock.calls[0][0] as Record<string, unknown>;
    const qrPlugin = callArg.plugins.find((p: { id?: string }) => p.id === "qr-auth") as {
      id: string;
      endpoints: {
        signInQR: (ctx: {
          body: { qrHash: string; qrOneTimeCode: string };
          request: Request;
          json: (data: unknown, options?: { status: number }) => Response;
          context: {
            internalAdapter: {
              createSession: (userId: string, request: Request) => Promise<unknown>;
            };
          };
        }) => Promise<Response>;
      };
    };
    expect(qrPlugin).toBeDefined();

    // Since createAuthEndpoint is mocked to return the handler directly,
    // signInQR IS the handler function — invoke it to cover line 120
    const mockJson = (data: unknown, options?: { status: number }) =>
      new Response(JSON.stringify(data), { status: options?.status ?? 200 });

    const ctx = {
      body: { qrHash: "test-hash", qrOneTimeCode: "test-code" },
      request: new Request("https://example.com/sign-in/qr", { method: "POST" }),
      json: mockJson,
      context: {
        internalAdapter: {
          createSession: async () => ({ id: "session-1" }),
        },
      },
    };

    const response = await qrPlugin.endpoints.signInQR(ctx);
    expect(response.status).toBe(501);
    const body = (await response.json()) as { error: string };
    expect(body.error).toContain("not yet implemented");
  });

  it("magicLink sendMagicLink callback exists and is callable", async () => {
    const { magicLink } = await import("better-auth/plugins");
    const env = makeEnv();
    createAuth(env);
    expect(magicLink).toHaveBeenCalledOnce();
    // Get the config passed to magicLink
    const magicLinkConfig = vi.mocked(magicLink).mock.calls[0][0] as {
      sendMagicLink: () => Promise<void>;
    };
    expect(typeof magicLinkConfig.sendMagicLink).toBe("function");
    // Call the sendMagicLink callback to cover the empty function body
    await expect(magicLinkConfig.sendMagicLink()).resolves.toBeUndefined();
  });

  it("configures drizzle adapter with sqlite provider", async () => {
    const { drizzleAdapter } = await import("@better-auth/drizzle-adapter");
    const env = makeEnv();
    createAuth(env);
    expect(drizzleAdapter).toHaveBeenCalledOnce();
    const adapterArgs = vi.mocked(drizzleAdapter).mock.calls[0] as unknown[];
    expect(adapterArgs[1]).toEqual({ provider: "sqlite" });
  });

  it("uses drizzle-orm/d1 with the AUTH_DB from env", async () => {
    const { drizzle } = await import("drizzle-orm/d1");
    const mockDb = { name: "mock-d1" } as unknown as D1Database;
    const env = makeEnv({ AUTH_DB: mockDb });
    createAuth(env);
    expect(drizzle).toHaveBeenCalledWith(
      mockDb,
      expect.objectContaining({ schema: expect.any(Object) }),
    );
  });

  it("auth handler responds to requests", async () => {
    const env = makeEnv();
    const auth = createAuth(env);
    const req = new Request("https://example.com/api/auth/session");
    const response = await auth.handler(req);
    expect(response.status).toBe(200);
  });
});

describe("Env interface shape", () => {
  it("accepts minimal env with only required fields", () => {
    const env: Env = {
      AUTH_DB: {} as D1Database,
      BETTER_AUTH_SECRET: "secret",
    };
    expect(env.BETTER_AUTH_SECRET).toBe("secret");
    expect(env.APP_URL).toBeUndefined();
  });

  it("accepts full env with all optional fields", () => {
    const env: Env = {
      AUTH_DB: {} as D1Database,
      BETTER_AUTH_SECRET: "secret",
      APP_URL: "https://app.example.com",
      GOOGLE_CLIENT_ID: "google-id",
      GOOGLE_CLIENT_SECRET: "google-secret",
      GITHUB_CLIENT_ID: "github-id",
      GITHUB_CLIENT_SECRET: "github-secret",
      APPLE_CLIENT_ID: "apple-id",
      APPLE_CLIENT_SECRET: "apple-secret",
    };
    expect(env.APP_URL).toBe("https://app.example.com");
    expect(env.GOOGLE_CLIENT_ID).toBe("google-id");
    expect(env.GITHUB_CLIENT_ID).toBe("github-id");
    expect(env.APPLE_CLIENT_ID).toBe("apple-id");
  });
});
