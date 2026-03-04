import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFetch = vi.hoisted(() => vi.fn());
vi.stubGlobal("fetch", mockFetch);

import { getRegistryServer, searchRegistry } from "../../../../src/spike-cli/registry/client.js";

describe("registry client", () => {
  const baseUrl = "https://spike.land";
  const token = "test-token";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("searchRegistry", () => {
    it("returns search results", async () => {
      const servers = [
        {
          id: "vitest",
          name: "Vitest",
          description: "Test runner",
          tags: ["testing"],
        },
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => servers,
      });

      const result = await searchRegistry("test", baseUrl, token);
      expect(result).toEqual(servers);
    });

    it("sends Authorization header", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await searchRegistry("query", baseUrl, token);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/mcp/registry/search?q=query"),
        expect.objectContaining({
          headers: { Authorization: `Bearer ${token}` },
        }),
      );
    });

    it("throws on non-ok response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      await expect(searchRegistry("q", baseUrl, token)).rejects.toThrow("Registry search failed");
    });
  });

  describe("getRegistryServer", () => {
    it("returns server details", async () => {
      const server = {
        id: "vitest",
        name: "Vitest",
        description: "Test runner",
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => server,
      });

      const result = await getRegistryServer("vitest", baseUrl, token);
      expect(result).toEqual(server);
    });

    it("returns null on 404", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await getRegistryServer("missing", baseUrl, token);
      expect(result).toBeNull();
    });

    it("sends Authorization header", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "x", name: "X", description: "X" }),
      });

      await getRegistryServer("x", baseUrl, token);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/mcp/registry/x"),
        expect.objectContaining({
          headers: { Authorization: `Bearer ${token}` },
        }),
      );
    });

    it("throws on non-ok non-404 response (line 43)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      await expect(
        getRegistryServer("some-id", baseUrl, token),
      ).rejects.toThrow("Registry fetch failed: 500 Internal Server Error");
    });
  });
});
