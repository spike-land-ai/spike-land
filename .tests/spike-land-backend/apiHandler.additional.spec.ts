/**
 * Additional apiHandler tests for uncovered branches
 */
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { handleApiRequest } from "../../src/spike-land-backend/apiHandler.js";
import type Env from "../../src/spike-land-backend/env.js";

vi.mock("@spike-land-ai/code", () => ({
  HTML: Promise.resolve("<html>mock html</html>"),
  routes: {},
  importMap: {},
}));

describe("apiHandler additional coverage", () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let mockEnv: Partial<Env>;

  beforeEach(() => {
    vi.resetAllMocks();
    mockFetch = vi.fn();
    global.fetch = mockFetch;
    mockEnv = {
      CODE: {
        newUniqueId: vi.fn().mockReturnValue({ toString: () => "new-unique-id" }),
        idFromString: vi.fn().mockReturnValue("id-from-string"),
        idFromName: vi.fn().mockReturnValue("id-from-name"),
        get: vi.fn().mockReturnValue({
          fetch: vi.fn().mockResolvedValue(new Response("room response")),
        }),
      } as unknown as DurableObjectNamespace,
    };
  });

  describe("isAllowedUrl — SSRF protection", () => {
    it("blocks localhost URL", async () => {
      const req = new Request("https://example.com/server-fetch", {
        method: "POST",
        body: JSON.stringify({ url: "http://localhost/secret", options: {} }),
      });
      const response = await handleApiRequest(["server-fetch"], req, mockEnv as Env);
      expect(response.status).toBe(403);
      expect(await response.text()).toBe("URL not allowed");
    });

    it("blocks 127.0.0.1 URL", async () => {
      const req = new Request("https://example.com/server-fetch", {
        method: "POST",
        body: JSON.stringify({ url: "http://127.0.0.1/secret", options: {} }),
      });
      const response = await handleApiRequest(["server-fetch"], req, mockEnv as Env);
      expect(response.status).toBe(403);
    });

    it("blocks 169.254.169.254 (AWS metadata) URL", async () => {
      const req = new Request("https://example.com/server-fetch", {
        method: "POST",
        body: JSON.stringify({ url: "http://169.254.169.254/latest/meta-data/", options: {} }),
      });
      const response = await handleApiRequest(["server-fetch"], req, mockEnv as Env);
      expect(response.status).toBe(403);
    });

    it("blocks private 10.x.x.x range", async () => {
      const req = new Request("https://example.com/server-fetch", {
        method: "POST",
        body: JSON.stringify({ url: "http://10.0.0.1/internal", options: {} }),
      });
      const response = await handleApiRequest(["server-fetch"], req, mockEnv as Env);
      expect(response.status).toBe(403);
    });

    it("blocks private 172.16.x.x range", async () => {
      const req = new Request("https://example.com/server-fetch", {
        method: "POST",
        body: JSON.stringify({ url: "http://172.16.0.1/internal", options: {} }),
      });
      const response = await handleApiRequest(["server-fetch"], req, mockEnv as Env);
      expect(response.status).toBe(403);
    });

    it("blocks private 192.168.x.x range", async () => {
      const req = new Request("https://example.com/server-fetch", {
        method: "POST",
        body: JSON.stringify({ url: "http://192.168.1.1/internal", options: {} }),
      });
      const response = await handleApiRequest(["server-fetch"], req, mockEnv as Env);
      expect(response.status).toBe(403);
    });

    it("allows 192.x.x.x where x is not 168 (line 47 false branch)", async () => {
      // 192.1.x.x is not a private range — line 47 if-false branch
      global.fetch = vi.fn().mockResolvedValue(new Response("public response", { status: 200 }));
      const req = new Request("https://example.com/server-fetch", {
        method: "POST",
        body: JSON.stringify({ url: "http://192.1.1.1/public", options: {} }),
      });
      const response = await handleApiRequest(["server-fetch"], req, mockEnv as Env);
      // 192.1.1.1 is not a private address, so should be allowed (200 or proxied)
      expect(response.status).not.toBe(403);
    });

    it("blocks link-local 169.254.x.x range", async () => {
      const req = new Request("https://example.com/server-fetch", {
        method: "POST",
        body: JSON.stringify({ url: "http://169.254.0.1/link-local", options: {} }),
      });
      const response = await handleApiRequest(["server-fetch"], req, mockEnv as Env);
      expect(response.status).toBe(403);
    });

    it("blocks non-http protocols (file://)", async () => {
      const req = new Request("https://example.com/server-fetch", {
        method: "POST",
        body: JSON.stringify({ url: "file:///etc/passwd", options: {} }),
      });
      const response = await handleApiRequest(["server-fetch"], req, mockEnv as Env);
      expect(response.status).toBe(403);
    });

    it("blocks metadata.google.internal", async () => {
      const req = new Request("https://example.com/server-fetch", {
        method: "POST",
        body: JSON.stringify({ url: "http://metadata.google.internal/", options: {} }),
      });
      const response = await handleApiRequest(["server-fetch"], req, mockEnv as Env);
      expect(response.status).toBe(403);
    });

    it("returns 403 for an invalid URL string that cannot be parsed (line 55 catch)", async () => {
      const req = new Request("https://example.com/server-fetch", {
        method: "POST",
        body: JSON.stringify({ url: "not a valid url ::::", options: {} }),
      });
      const response = await handleApiRequest(["server-fetch"], req, mockEnv as Env);
      expect(response.status).toBe(403);
      expect(await response.text()).toBe("URL not allowed");
    });
  });

  describe("server-fetch non-POST method", () => {
    it("returns 405 for GET on server-fetch", async () => {
      const req = new Request("https://example.com/server-fetch", { method: "GET" });
      const response = await handleApiRequest(["server-fetch"], req, mockEnv as Env);
      expect(response.status).toBe(405);
      expect(await response.text()).toBe("Method not allowed");
    });
  });

  describe("room routing with Sec-Fetch-Dest: script", () => {
    it("appends /index to pathname when Sec-Fetch-Dest is script", async () => {
      const mockRoomFetch = vi.fn().mockResolvedValue(new Response("script response"));
      (mockEnv.CODE!.get as Mock).mockReturnValue({ fetch: mockRoomFetch });
      (mockEnv.CODE!.idFromName as Mock).mockReturnValue("id-1");

      const req = new Request("https://example.com/room/myspace", {
        headers: { "Sec-Fetch-Dest": "script" },
      });
      await handleApiRequest(["room", "myspace"], req, mockEnv as Env);

      const calledRequest = mockRoomFetch.mock.calls[0][0] as Request;
      expect(new URL(calledRequest.url).pathname).toContain("/index");
    });
  });

  describe("default 404 case", () => {
    it("returns 404 for unknown path", async () => {
      const req = new Request("https://example.com/unknown-path");
      const response = await handleApiRequest(["unknown-path"], req, mockEnv as Env);
      expect(response.status).toBe(404);
      expect(await response.text()).toBe("Not found");
    });
  });
});
