import { describe, expect, it, vi, beforeEach } from "vitest";
import worker from "./index";

const mockCache = {
  match: vi.fn().mockResolvedValue(undefined),
  put: vi.fn().mockResolvedValue(undefined),
};

(globalThis as Record<string, unknown>).caches = {
  default: mockCache,
};

function makeRequest(path: string, options: RequestInit & { headers?: Record<string, string> } = {}): Request {
  return new Request(`https://esm.spike.land${path}`, options);
}

const mockCtx = {
  waitUntil: vi.fn(),
  passThroughOnException: vi.fn(),
} as unknown as ExecutionContext;

describe("esm-cdn worker", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockCache.match.mockResolvedValue(undefined);
    mockCache.put.mockResolvedValue(undefined);
    (mockCtx.waitUntil as ReturnType<typeof vi.fn>).mockReset();
  });

  describe("GET /health", () => {
    it("returns 200 JSON", async () => {
      const res = await worker.fetch(makeRequest("/health"), {}, mockCtx);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ status: "ok", service: "esm-cdn" });
    });
  });

  describe("OPTIONS preflight", () => {
    it("returns 204 with CORS headers", async () => {
      const res = await worker.fetch(
        makeRequest("/react@19.2.4", {
          method: "OPTIONS",
          headers: { Origin: "https://spike.land" },
        }),
        {},
        mockCtx,
      );
      expect(res.status).toBe(204);
      expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://spike.land");
      expect(res.headers.get("Access-Control-Allow-Methods")).toContain("GET");
    });
  });

  describe("CORS headers", () => {
    it("allows *.spike.land origins", async () => {
      const res = await worker.fetch(
        makeRequest("/health", {
          headers: { Origin: "https://app.spike.land" },
        }),
        {},
        mockCtx,
      );
      expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://app.spike.land");
    });

    it("allows localhost origins", async () => {
      const res = await worker.fetch(
        makeRequest("/health", {
          headers: { Origin: "http://localhost:5173" },
        }),
        {},
        mockCtx,
      );
      expect(res.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:5173");
    });

    it("defaults to spike.land for unknown origins", async () => {
      const res = await worker.fetch(
        makeRequest("/health", {
          headers: { Origin: "https://evil.com" },
        }),
        {},
        mockCtx,
      );
      expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://spike.land");
    });
  });

  describe("proxy routing", () => {
    it("proxies versioned URLs to esm.sh", async () => {
      const mockResponse = new Response("export default {};", {
        status: 200,
        headers: { "Content-Type": "application/javascript" },
      });
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse);

      const res = await worker.fetch(makeRequest("/react@19.2.4"), {}, mockCtx);

      expect(fetchSpy).toHaveBeenCalledWith(
        "https://esm.sh/react@19.2.4",
        { redirect: "follow" },
      );
      expect(res.status).toBe(200);
      expect(res.headers.get("Cache-Control")).toBe("public, max-age=31536000, immutable");
    });

    it("proxies /min/ paths to jsdelivr", async () => {
      const mockResponse = new Response("// worker", {
        status: 200,
        headers: { "Content-Type": "application/javascript" },
      });
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse);

      const res = await worker.fetch(
        makeRequest("/monaco-editor@0.55.1/min/vs/editor/editor.worker.js"),
        {},
        mockCtx,
      );

      expect(fetchSpy).toHaveBeenCalledWith(
        "https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs/editor/editor.worker.js",
        { redirect: "follow" },
      );
      expect(res.status).toBe(200);
    });

    it("sets short cache for unversioned URLs", async () => {
      const mockResponse = new Response("export default {};", {
        status: 200,
        headers: { "Content-Type": "application/javascript" },
      });
      vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse);

      const res = await worker.fetch(makeRequest("/react"), {}, mockCtx);

      expect(res.headers.get("Cache-Control")).toBe("public, max-age=3600");
    });
  });

  describe("error handling", () => {
    it("forwards non-2xx without caching", async () => {
      const mockResponse = new Response("Not Found", {
        status: 404,
        headers: { "Content-Type": "text/plain" },
      });
      vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse);

      const res = await worker.fetch(makeRequest("/nonexistent-pkg@1.0.0"), {}, mockCtx);

      expect(res.status).toBe(404);
      expect(mockCtx.waitUntil).not.toHaveBeenCalled();
    });

    it("rejects non-GET methods", async () => {
      const res = await worker.fetch(
        makeRequest("/react@19.2.4", { method: "POST" }),
        {},
        mockCtx,
      );
      expect(res.status).toBe(405);
    });
  });
});
