import { describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import type { Env } from "../../../src/spike-edge/env.js";
import { blog, rowToPost, getBlogPostRow } from "../../../src/spike-edge/routes/blog.js";

const SAMPLE_ROW = {
  slug: "hello-world",
  title: "Hello World",
  description: "A test post",
  primer: "Intro text",
  date: "2025-01-01",
  author: "Alice",
  category: "tech",
  tags: '["typescript","testing"]',
  featured: 1,
  hero_image: "/images/hero.png",
  content: "# Hello\nWorld",
  created_at: 1700000000000,
  updated_at: 1700000000000,
};

function createMockEnv(overrides: Partial<Env> = {}): Env {
  return {
    R2: {} as R2Bucket,
    SPA_ASSETS: {
      get: vi.fn().mockResolvedValue(null),
    } as unknown as R2Bucket,
    DB: {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockResolvedValue({ results: [] }),
        first: vi.fn().mockResolvedValue(null),
        run: vi.fn().mockResolvedValue({}),
      }),
      batch: vi.fn().mockResolvedValue([]),
    } as unknown as D1Database,
    AUTH_MCP: { fetch: vi.fn() } as unknown as Fetcher,
    MCP_SERVICE: { fetch: vi.fn() } as unknown as Fetcher,
    LIMITERS: {} as DurableObjectNamespace,
    STRIPE_SECRET_KEY: "sk_test",
    STRIPE_WEBHOOK_SECRET: "whsec",
    GEMINI_API_KEY: "key",
    CLAUDE_OAUTH_TOKEN: "token",
    GITHUB_TOKEN: "ghp",
    ALLOWED_ORIGINS: "https://spike.land",
    QUIZ_BADGE_SECRET: "secret",
    GA_MEASUREMENT_ID: "G-TEST",
    CACHE_VERSION: "v1",
    GA_API_SECRET: "ga",
    INTERNAL_SERVICE_SECRET: "internal",
    WHATSAPP_APP_SECRET: "wa",
    WHATSAPP_ACCESS_TOKEN: "token",
    WHATSAPP_PHONE_NUMBER_ID: "phone",
    WHATSAPP_VERIFY_TOKEN: "verify",
    MCP_INTERNAL_SECRET: "mcp",
    ...overrides,
  };
}

function makeApp() {
  const app = new Hono<{ Bindings: Env }>();
  app.route("/", blog);
  return app;
}

// ─── rowToPost ───────────────────────────────────────────────────────────────

describe("rowToPost", () => {
  it("converts a row to a post object without content by default", () => {
    const post = rowToPost(SAMPLE_ROW);
    expect(post.slug).toBe("hello-world");
    expect(post.title).toBe("Hello World");
    expect(post.tags).toEqual(["typescript", "testing"]);
    expect(post.featured).toBe(true);
    expect(post.heroImage).toBe("/images/hero.png");
    expect(post).not.toHaveProperty("content");
  });

  it("includes content when includeContent=true", () => {
    const post = rowToPost(SAMPLE_ROW, true);
    expect(post.content).toBe("# Hello\nWorld");
  });

  it("handles null hero_image", () => {
    const post = rowToPost({ ...SAMPLE_ROW, hero_image: null });
    expect(post.heroImage).toBeNull();
  });

  it("converts featured=0 to false", () => {
    const post = rowToPost({ ...SAMPLE_ROW, featured: 0 });
    expect(post.featured).toBe(false);
  });
});

// ─── GET /api/blog ───────────────────────────────────────────────────────────

describe("GET /api/blog", () => {
  it("returns 404 when no posts", async () => {
    const env = createMockEnv();
    const app = makeApp();
    const res = await app.request("/api/blog", {}, env);
    expect(res.status).toBe(404);
    const body = await res.json<{ error: string }>();
    expect(body.error).toBe("Blog index not found");
  });

  it("returns list of posts from D1 (cache fallback path)", async () => {
    const db = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockResolvedValue({ results: [SAMPLE_ROW] }),
        first: vi.fn().mockResolvedValue(null),
        run: vi.fn().mockResolvedValue({}),
      }),
      batch: vi.fn().mockResolvedValue([]),
    } as unknown as D1Database;
    const env = createMockEnv({ DB: db });
    const app = makeApp();
    const res = await app.request("/api/blog", {}, env);
    // Cache API not available in test → falls back to direct D1
    expect(res.status).toBe(200);
    const body = await res.json<Array<{ slug: string }>>();
    expect(body[0].slug).toBe("hello-world");
  });
});

// ─── GET /api/blog/:slug ─────────────────────────────────────────────────────

describe("GET /api/blog/:slug", () => {
  it("returns 404 when post not found", async () => {
    const env = createMockEnv();
    const app = makeApp();
    const res = await app.request("/api/blog/nonexistent", {}, env);
    expect(res.status).toBe(404);
    const body = await res.json<{ error: string }>();
    expect(body.error).toBe("Post not found");
  });

  it("returns post with content when found", async () => {
    const db = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockResolvedValue({ results: [] }),
        first: vi.fn().mockResolvedValue(SAMPLE_ROW),
        run: vi.fn().mockResolvedValue({}),
      }),
      batch: vi.fn().mockResolvedValue([]),
    } as unknown as D1Database;
    const env = createMockEnv({ DB: db });
    const app = makeApp();
    const res = await app.request("/api/blog/hello-world", {}, env);
    expect(res.status).toBe(200);
    const body = await res.json<{ slug: string; content: string }>();
    expect(body.slug).toBe("hello-world");
    expect(body.content).toBe("# Hello\nWorld");
  });
});

// ─── GET /api/blog-images/:slug/:filename ────────────────────────────────────

describe("GET /api/blog-images/:slug/:filename", () => {
  it("returns 404 when image not in R2", async () => {
    const env = createMockEnv();
    const app = makeApp();
    const res = await app.request("/api/blog-images/my-post/hero.png", {}, env);
    expect(res.status).toBe(404);
  });

  it("serves image with correct content-type when found", async () => {
    const fakeBody = new ReadableStream();
    const env = createMockEnv({
      SPA_ASSETS: {
        get: vi.fn().mockResolvedValue({
          body: fakeBody,
        }),
      } as unknown as R2Bucket,
    });
    const app = makeApp();
    const res = await app.request("/api/blog-images/my-post/hero.png", {}, env);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/png");
    expect(res.headers.get("Cache-Control")).toContain("immutable");
  });

  it("serves webp with correct content-type", async () => {
    const env = createMockEnv({
      SPA_ASSETS: {
        get: vi.fn().mockResolvedValue({ body: new ReadableStream() }),
      } as unknown as R2Bucket,
    });
    const app = makeApp();
    const res = await app.request("/api/blog-images/post/image.webp", {}, env);
    expect(res.headers.get("Content-Type")).toBe("image/webp");
  });

  it("uses application/octet-stream for unknown extension", async () => {
    const env = createMockEnv({
      SPA_ASSETS: {
        get: vi.fn().mockResolvedValue({ body: new ReadableStream() }),
      } as unknown as R2Bucket,
    });
    const app = makeApp();
    const res = await app.request("/api/blog-images/post/file.xyz", {}, env);
    expect(res.headers.get("Content-Type")).toBe("application/octet-stream");
  });
});

// ─── GET /blog/:slug/:filename ───────────────────────────────────────────────

describe("GET /blog/:slug/:filename (backward compat images)", () => {
  it("passes through non-image extensions", async () => {
    const env = createMockEnv();
    const app = makeApp();
    // Non-image extension — route calls next() and falls through (404 from hono)
    const res = await app.request("/blog/my-post/file.pdf", {}, env);
    expect(res.status).toBe(404);
  });

  it("returns 404 when image not in R2", async () => {
    const env = createMockEnv({
      SPA_ASSETS: {
        get: vi.fn().mockResolvedValue(null),
      } as unknown as R2Bucket,
    });
    const app = makeApp();
    const res = await app.request("/blog/my-post/hero.png", {}, env);
    // next() falls through, returns 404
    expect(res.status).toBe(404);
  });

  it("serves image when found in R2", async () => {
    const env = createMockEnv({
      SPA_ASSETS: {
        get: vi.fn().mockResolvedValue({ body: new ReadableStream() }),
      } as unknown as R2Bucket,
    });
    const app = makeApp();
    const res = await app.request("/blog/my-post/hero.jpg", {}, env);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/jpeg");
  });
});

// ─── getBlogPostRow ──────────────────────────────────────────────────────────

describe("getBlogPostRow", () => {
  it("returns null when not found", async () => {
    const db = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      }),
    } as unknown as D1Database;
    const result = await getBlogPostRow(db, "missing");
    expect(result).toBeNull();
  });

  it("returns row when found", async () => {
    const db = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(SAMPLE_ROW),
      }),
    } as unknown as D1Database;
    const result = await getBlogPostRow(db, "hello-world");
    expect(result?.slug).toBe("hello-world");
  });
});
