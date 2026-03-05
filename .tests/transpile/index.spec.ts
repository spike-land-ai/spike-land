import { beforeEach, describe, expect, it, vi } from "vitest";

// Set up mocks before importing the module
const mockBuild = vi.fn();
const mockTranspile = vi.fn();

vi.mock("@spike-land-ai/code/src/@/lib/transpile", () => ({
  build: mockBuild,
  transpile: mockTranspile,
  wasmFile: "mock-wasm",
}));

// Mock the Cloudflare Workers `caches` global
const mockCachePut = vi.fn().mockResolvedValue(undefined);
const mockCacheMatch = vi.fn().mockResolvedValue(undefined);
const mockCache = {
  put: mockCachePut,
  match: mockCacheMatch,
  delete: vi.fn().mockResolvedValue(false),
};

Object.defineProperty(globalThis, "caches", {
  value: { default: mockCache },
  writable: true,
  configurable: true,
});

// Import the worker after setting up mocks
let worker: { fetch: (request: Request, _env: unknown, ctx: ExecutionContext) => Promise<Response> };

beforeEach(async () => {
  vi.clearAllMocks();
  mockCacheMatch.mockResolvedValue(undefined);
  mockCachePut.mockResolvedValue(undefined);
  vi.resetModules();

  vi.mock("@spike-land-ai/code/src/@/lib/transpile", () => ({
    build: mockBuild,
    transpile: mockTranspile,
    wasmFile: "mock-wasm",
  }));

  const mod = await import("../../src/transpile/index");
  worker = mod.default as typeof worker;
});

// Helper to create a minimal ExecutionContext mock
const makeCtx = (): ExecutionContext => ({
  waitUntil: vi.fn(),
  passThroughOnException: vi.fn(),
  props: {},
});

describe("globalThis.performance setup", () => {
  it("sets performance.now on globalThis and it returns a number", async () => {
    const result = (globalThis as { performance?: { now: () => number } }).performance?.now();
    expect(typeof result).toBe("number");
  });
});

describe("js.spike.land worker", () => {
  describe("health endpoint", () => {
    it("returns 200 JSON for GET /health", async () => {
      const request = new Request("https://js.spike.land/health", { method: "GET" });
      const response = await worker.fetch(request, {}, makeCtx());
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("application/json");
      const json = await response.json() as { status: string; service: string; timestamp: string };
      expect(json.status).toBe("ok");
      expect(json.service).toBe("transpile");
      expect(typeof json.timestamp).toBe("string");
    });
  });

  describe("fetch handler - unsupported methods", () => {
    it("returns 405 for DELETE method", async () => {
      const request = new Request("https://js.spike.land/", { method: "DELETE" });
      const response = await worker.fetch(request, {}, makeCtx());
      expect(response.status).toBe(405);
      const text = await response.text();
      expect(text).toContain("Method not allowed");
    });

    it("returns 405 for PUT method", async () => {
      const request = new Request("https://js.spike.land/", { method: "PUT" });
      const response = await worker.fetch(request, {}, makeCtx());
      expect(response.status).toBe(405);
    });

    it("returns 405 for PATCH method", async () => {
      const request = new Request("https://js.spike.land/", { method: "PATCH" });
      const response = await worker.fetch(request, {}, makeCtx());
      expect(response.status).toBe(405);
    });

    it("includes CORS headers in 405 response for spike.land origin", async () => {
      const request = new Request("https://spike.land/page", { method: "DELETE" });
      const response = await worker.fetch(request, {}, makeCtx());
      expect(response.headers.get("Access-Control-Allow-Headers")).toBe("*");
    });

    it("includes CORS headers in 405 response for non-spike.land origin", async () => {
      const request = new Request("https://js.spike.land/", { method: "DELETE" });
      const response = await worker.fetch(request, {}, makeCtx());
      expect(response.headers.get("Access-Control-Allow-Headers")).toBe("*");
    });
  });

  describe("fetch handler - GET requests", () => {
    it("calls build with codeSpace from query params", async () => {
      mockBuild.mockResolvedValueOnce("console.log('hello');");
      const request = new Request("https://js.spike.land/?codeSpace=my-space", { method: "GET" });
      await worker.fetch(request, {}, makeCtx());
      expect(mockBuild).toHaveBeenCalledWith(
        expect.objectContaining({ codeSpace: "my-space" }),
      );
    });

    it("uses default codeSpace 'empty' when not provided", async () => {
      mockBuild.mockResolvedValueOnce("console.log('hello');");
      const request = new Request("https://js.spike.land/", { method: "GET" });
      await worker.fetch(request, {}, makeCtx());
      expect(mockBuild).toHaveBeenCalledWith(
        expect.objectContaining({ codeSpace: "empty" }),
      );
    });

    it("uses testing.spike.land origin when origin param is 'testing'", async () => {
      mockBuild.mockResolvedValueOnce("console.log('hello');");
      const request = new Request("https://js.spike.land/?origin=testing", { method: "GET" });
      await worker.fetch(request, {}, makeCtx());
      expect(mockBuild).toHaveBeenCalledWith(
        expect.objectContaining({ origin: "https://testing.spike.land" }),
      );
    });

    it("uses spike.land origin for any other origin param value", async () => {
      mockBuild.mockResolvedValueOnce("console.log('hello');");
      const request = new Request("https://js.spike.land/?origin=production", { method: "GET" });
      await worker.fetch(request, {}, makeCtx());
      expect(mockBuild).toHaveBeenCalledWith(
        expect.objectContaining({ origin: "https://spike.land" }),
      );
    });

    it("returns 404 when build returns null/falsy", async () => {
      mockBuild.mockResolvedValueOnce(null);
      const request = new Request("https://js.spike.land/?codeSpace=test", { method: "GET" });
      const response = await worker.fetch(request, {}, makeCtx());
      expect(response.status).toBe(404);
      const text = await response.text();
      expect(text).toBe("No results");
    });

    it("returns 404 when build returns undefined", async () => {
      mockBuild.mockResolvedValueOnce(undefined);
      const request = new Request("https://js.spike.land/?codeSpace=test", { method: "GET" });
      const response = await worker.fetch(request, {}, makeCtx());
      expect(response.status).toBe(404);
    });

    it("returns JS response with correct content-type when build returns a string", async () => {
      const jsCode = "export default function() { return 42; }";
      mockBuild.mockResolvedValueOnce(jsCode);
      const request = new Request("https://js.spike.land/?codeSpace=test", { method: "GET" });
      const response = await worker.fetch(request, {}, makeCtx());
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("application/javascript");
      const text = await response.text();
      expect(text).toBe(jsCode);
    });

    it("includes CORS headers when build returns a string", async () => {
      mockBuild.mockResolvedValueOnce("export {};");
      const request = new Request("https://js.spike.land/?codeSpace=test", { method: "GET" });
      const response = await worker.fetch(request, {}, makeCtx());
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://spike.land");
      expect(response.headers.get("Access-Control-Allow-Headers")).toBe("*");
      expect(response.headers.get("cache-control")).toBe("no-cache");
    });

    it("returns JSON response when build returns an object (non-string)", async () => {
      const buildResult = [{ path: "out.js", text: "export {};", contents: new Uint8Array() }];
      mockBuild.mockResolvedValueOnce(buildResult);
      const request = new Request("https://js.spike.land/?codeSpace=test", { method: "GET" });
      const response = await worker.fetch(request, {}, makeCtx());
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("application/json");
      const json = await response.json() as unknown[];
      expect(json).toHaveLength(1);
    });

    it("returns 500 when build throws an Error", async () => {
      mockBuild.mockRejectedValueOnce(new Error("Build failed: module not found"));
      const request = new Request("https://js.spike.land/?codeSpace=bad-space", { method: "GET" });
      const response = await worker.fetch(request, {}, makeCtx());
      expect(response.status).toBe(500);
      const text = await response.text();
      expect(text).toBe("Build failed: module not found");
    });

    it("returns 500 when build throws a non-Error value", async () => {
      mockBuild.mockRejectedValueOnce("string error");
      const request = new Request("https://js.spike.land/?codeSpace=bad", { method: "GET" });
      const response = await worker.fetch(request, {}, makeCtx());
      expect(response.status).toBe(500);
      const text = await response.text();
      expect(text).toBe("string error");
    });

    it("passes correct build options including format, splitting, and external", async () => {
      mockBuild.mockResolvedValueOnce("export {};");
      const request = new Request("https://js.spike.land/?codeSpace=my-app", { method: "GET" });
      await worker.fetch(request, {}, makeCtx());
      expect(mockBuild).toHaveBeenCalledWith(
        expect.objectContaining({
          format: "esm",
          splitting: false,
          external: ["/*"],
          wasmModule: "mock-wasm",
        }),
      );
    });
  });

  describe("fetch handler - POST requests", () => {
    it("transpiles code from request body and returns JS", async () => {
      const inputCode = "const x: number = 42;";
      const outputCode = "const x = 42;";
      mockTranspile.mockResolvedValueOnce(outputCode);
      const request = new Request("https://js.spike.land/", {
        method: "POST",
        body: inputCode,
        headers: { "Content-Type": "text/plain" },
      });
      const response = await worker.fetch(request, {}, makeCtx());
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("application/javascript");
      const text = await response.text();
      expect(text).toBe(outputCode);
    });

    it("passes TR_ORIGIN header to transpile as originToUse", async () => {
      mockTranspile.mockResolvedValueOnce("export {};");
      const request = new Request("https://js.spike.land/", {
        method: "POST",
        body: "const x = 1;",
        headers: { "TR_ORIGIN": "https://custom.spike.land" },
      });
      await worker.fetch(request, {}, makeCtx());
      expect(mockTranspile).toHaveBeenCalledWith(
        expect.objectContaining({ originToUse: "https://custom.spike.land" }),
      );
    });

    it("uses empty string as originToUse when TR_ORIGIN header is missing", async () => {
      mockTranspile.mockResolvedValueOnce("export {};");
      const request = new Request("https://js.spike.land/", {
        method: "POST",
        body: "const x = 1;",
      });
      await worker.fetch(request, {}, makeCtx());
      expect(mockTranspile).toHaveBeenCalledWith(
        expect.objectContaining({ originToUse: "" }),
      );
    });

    it("passes wasmModule to transpile", async () => {
      mockTranspile.mockResolvedValueOnce("export {};");
      const request = new Request("https://js.spike.land/", {
        method: "POST",
        body: "const x = 1;",
      });
      await worker.fetch(request, {}, makeCtx());
      expect(mockTranspile).toHaveBeenCalledWith(
        expect.objectContaining({ wasmModule: "mock-wasm" }),
      );
    });

    it("includes CORS headers matching request origin for localhost", async () => {
      mockTranspile.mockResolvedValueOnce("export {};");
      const request = new Request("http://localhost:3000/api/transpile", {
        method: "POST",
        body: "const x = 1;",
      });
      const response = await worker.fetch(request, {}, makeCtx());
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:3000");
    });

    it("includes CORS headers matching request origin for spike.land subdomain", async () => {
      mockTranspile.mockResolvedValueOnce("export {};");
      const request = new Request("https://staging.spike.land/api/transpile", {
        method: "POST",
        body: "const x = 1;",
      });
      const response = await worker.fetch(request, {}, makeCtx());
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://staging.spike.land");
    });

    it("uses default spike.land origin for non-matching request origin", async () => {
      mockTranspile.mockResolvedValueOnce("export {};");
      const request = new Request("https://other-domain.com/api", {
        method: "POST",
        body: "const x = 1;",
      });
      const response = await worker.fetch(request, {}, makeCtx());
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://spike.land");
    });

    it("returns 500 when transpile throws an Error", async () => {
      mockTranspile.mockRejectedValueOnce(new Error("Syntax error at line 1"));
      const request = new Request("https://js.spike.land/", {
        method: "POST",
        body: "const x = ???;",
      });
      const response = await worker.fetch(request, {}, makeCtx());
      expect(response.status).toBe(500);
      const text = await response.text();
      expect(text).toBe("Syntax error at line 1");
    });

    it("returns 500 with error message when transpile throws a non-Error string", async () => {
      mockTranspile.mockRejectedValueOnce("unexpected failure");
      const request = new Request("https://js.spike.land/", {
        method: "POST",
        body: "broken",
      });
      const response = await worker.fetch(request, {}, makeCtx());
      expect(response.status).toBe(500);
      const text = await response.text();
      expect(text).toBe("unexpected failure");
    });

    it("returns 500 with 'Unknown error' when transpile throws an Error with empty message", async () => {
      mockTranspile.mockRejectedValueOnce(new Error(""));
      const request = new Request("https://js.spike.land/", {
        method: "POST",
        body: "broken",
      });
      const response = await worker.fetch(request, {}, makeCtx());
      expect(response.status).toBe(500);
      const text = await response.text();
      expect(text).toBe("Unknown error");
    });

    it("returns cached response when cache hit occurs", async () => {
      const cachedResponse = new Response("cached output", {
        headers: { "Content-Type": "application/javascript" },
      });
      mockCacheMatch.mockResolvedValueOnce(cachedResponse);
      const request = new Request("https://js.spike.land/", {
        method: "POST",
        body: "const x = 1;",
      });
      const response = await worker.fetch(request, {}, makeCtx());
      expect(mockTranspile).not.toHaveBeenCalled();
      const text = await response.text();
      expect(text).toBe("cached output");
    });

    it("puts response in cache after successful transpile", async () => {
      mockTranspile.mockResolvedValueOnce("const x = 1;");
      const ctx = makeCtx();
      const request = new Request("https://js.spike.land/", {
        method: "POST",
        body: "const x: number = 1;",
      });
      await worker.fetch(request, {}, ctx);
      expect(ctx.waitUntil).toHaveBeenCalled();
    });

    it("handles ctx.waitUntil throwing without failing the response", async () => {
      mockTranspile.mockResolvedValueOnce("export {};");
      const ctxWithThrow = {
        waitUntil: vi.fn().mockImplementation(() => {
          throw new Error("waitUntil not available");
        }),
        passThroughOnException: vi.fn(),
        props: {},
      } as unknown as ExecutionContext;
      const request = new Request("https://js.spike.land/", {
        method: "POST",
        body: "const x = 1;",
      });
      // Should not throw even if waitUntil throws
      const response = await worker.fetch(request, {}, ctxWithThrow);
      expect(response.status).toBe(200);
    });

    it("includes Cache-Control immutable header on successful transpile", async () => {
      mockTranspile.mockResolvedValueOnce("export {};");
      const request = new Request("https://js.spike.land/", {
        method: "POST",
        body: "const x = 1;",
      });
      const response = await worker.fetch(request, {}, makeCtx());
      expect(response.headers.get("Cache-Control")).toContain("public, max-age=86400, immutable");
    });
  });

  describe("CORS header logic", () => {
    it("allows spike.land subdomain origin on POST", async () => {
      mockTranspile.mockResolvedValueOnce("export {};");
      const request = new Request("https://app.spike.land/transpile", {
        method: "POST",
        body: "x",
      });
      const response = await worker.fetch(request, {}, makeCtx());
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://app.spike.land");
    });

    it("uses default https://spike.land for 405 on non-spike.land origin", async () => {
      const request = new Request("https://example.com/", { method: "DELETE" });
      const response = await worker.fetch(request, {}, makeCtx());
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://spike.land");
    });

    it("GET request returns default CORS origin (no requestUrl passed to getCorsHeaders)", async () => {
      mockBuild.mockResolvedValueOnce("export {};");
      // GET uses getCorsHeaders() with no argument -> always "https://spike.land"
      const request = new Request("https://example.com/?codeSpace=test", { method: "GET" });
      const response = await worker.fetch(request, {}, makeCtx());
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://spike.land");
    });
  });

  describe("hashCode function coverage", () => {
    it("produces consistent hashes for same input (cache hit on second request)", async () => {
      const code = "const y = 99;";
      mockTranspile.mockResolvedValue("const y = 99;");

      const request1 = new Request("https://js.spike.land/", {
        method: "POST",
        body: code,
      });
      await worker.fetch(request1, {}, makeCtx());

      // Simulate cache hit on second request with same body
      const cachedResponse = new Response("const y = 99;", {
        headers: { "Content-Type": "application/javascript" },
      });
      mockCacheMatch.mockResolvedValueOnce(cachedResponse);
      const request2 = new Request("https://js.spike.land/", {
        method: "POST",
        body: code,
      });
      const response2 = await worker.fetch(request2, {}, makeCtx());
      // Second call hits cache - transpile only called once
      expect(mockTranspile).toHaveBeenCalledTimes(1);
      const text = await response2.text();
      expect(text).toBe("const y = 99;");
    });
  });
});
