import { describe, expect, it, vi } from "vitest";
import {
  addCorsHeadersToResponse,
  createCorsErrorResponse,
  createCorsPreflightResponse,
  getAllowOrigin,
  handleCORS,
  handleRedirectResponse,
  handleUnauthorizedRequest,
  isChunk,
  isUrlFile,
  readRequestBody,
} from "../../src/spike-land-backend/utils";

describe("Utils Functions", () => {
  describe("getAllowOrigin", () => {
    it("returns spike.land when no origin header", () => {
      const req = new Request("https://example.com", { headers: {} });
      expect(getAllowOrigin(req)).toBe("https://spike.land");
    });

    it("returns origin when origin is exactly spike.land", () => {
      const req = new Request("https://example.com", {
        headers: { Origin: "https://spike.land" },
      });
      expect(getAllowOrigin(req)).toBe("https://spike.land");
    });

    it("returns origin when it ends with .spike.land", () => {
      const req = new Request("https://example.com", {
        headers: { Origin: "https://app.spike.land" },
      });
      expect(getAllowOrigin(req)).toBe("https://app.spike.land");
    });

    it("returns origin when it starts with http://localhost:", () => {
      const req = new Request("https://example.com", {
        headers: { Origin: "http://localhost:3000" },
      });
      expect(getAllowOrigin(req)).toBe("http://localhost:3000");
    });

    it("returns spike.land for unknown origins", () => {
      const req = new Request("https://example.com", {
        headers: { Origin: "https://evil.com" },
      });
      expect(getAllowOrigin(req)).toBe("https://spike.land");
    });
  });

  describe("createCorsPreflightResponse", () => {
    it("creates preflight response with CORS headers", () => {
      const req = new Request("https://example.com", {
        headers: { Origin: "https://spike.land" },
      });
      const response = createCorsPreflightResponse(req);
      expect(response.status).toBe(200);
      expect(response.headers.get("Access-Control-Allow-Methods")).toBe("POST, OPTIONS");
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://spike.land");
    });
  });

  describe("addCorsHeadersToResponse", () => {
    it("adds CORS origin header to response", () => {
      const req = new Request("https://example.com", {
        headers: { Origin: "https://spike.land" },
      });
      const original = new Response("body", { status: 200 });
      const result = addCorsHeadersToResponse(original, req);
      expect(result.status).toBe(200);
      expect(result.headers.get("Access-Control-Allow-Origin")).toBe("https://spike.land");
    });
  });

  describe("createCorsErrorResponse", () => {
    it("creates error response with status 500 by default", () => {
      const req = new Request("https://example.com");
      const response = createCorsErrorResponse("error message", "details text", req);
      expect(response.status).toBe(500);
    });

    it("creates error response with custom status", async () => {
      const req = new Request("https://example.com");
      const response = createCorsErrorResponse("Not Found", "Resource missing", req, 404);
      expect(response.status).toBe(404);
      const body = (await response.json()) as { error: string; details: string };
      expect(body.error).toBe("Not Found");
      expect(body.details).toBe("Resource missing");
    });
  });

  describe("isChunk", () => {
    it("should identify chunk files with chunk- prefix", () => {
      expect(isChunk("path/to/chunk-abc123.js")).toBe(true);
    });

    it("should identify chunk files with hash-like pattern", () => {
      expect(isChunk("path/to/file.a1b2c3d4e5.js")).toBe(true);
    });

    it("should return false for non-chunk files", () => {
      expect(isChunk("path/to/regular-file.js")).toBe(false);
    });
  });

  describe("isUrlFile", () => {
    it("should return false for paths without file extension", () => {
      expect(isUrlFile("some/path/without/extension")).toBe(false);
    });

    it("should return false for paths with trailing slash", () => {
      expect(isUrlFile("some/path/")).toBe(false);
    });

    it("should return true for paths with file extensions", () => {
      expect(isUrlFile("some/path/file.txt")).toBe(true);
    });
  });

  describe("handleCORS", () => {
    it("should handle CORS preflight request", () => {
      const mockRequest = {
        headers: {
          get: vi
            .fn()
            .mockReturnValueOnce("http://example.com")
            .mockReturnValueOnce("POST")
            .mockReturnValueOnce("Content-Type"),
        },
      } as unknown as Request;

      const response = handleCORS(mockRequest);

      expect(response.status).toBe(200);
      // getAllowOrigin returns "https://spike.land" for unknown origins
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://spike.land");
      expect(response.headers.get("Access-Control-Allow-Methods")).toBe("POST, OPTIONS");
    });

    it("should handle non-CORS request", () => {
      const mockRequest = {
        headers: {
          get: vi.fn().mockReturnValue(null),
        },
      } as unknown as Request;

      const response = handleCORS(mockRequest);

      expect(response.status).toBe(200);
      expect(response.headers.get("Allow")).toBe("POST, OPTIONS");
    });
  });

  describe("handleUnauthorizedRequest", () => {
    it("should return 401 response", () => {
      const response = handleUnauthorizedRequest();

      expect(response.status).toBe(401);
      expect(response.statusText).toBe("no robots");
    });
  });

  describe("handleRedirectResponse", () => {
    it("should create correct redirect response", () => {
      const mockUrl = new URL("https://example.com");
      const start = "test-start";

      const response = handleRedirectResponse(mockUrl, start);

      expect(response.status).toBe(307);
      expect(response.headers.get("Location")).toBe("https://example.com/live/test-start");
      expect(response.headers.get("Content-Type")).toBe("text/html;charset=UTF-8");
    });
  });

  describe("readRequestBody", () => {
    it("should handle JSON content", async () => {
      const mockRequest = {
        headers: { get: () => "application/json" },
        json: () => Promise.resolve({ key: "value" }),
      } as unknown as Request;

      const result = await readRequestBody(mockRequest);
      expect(result).toEqual({ key: "value" });
    });

    it("should handle text content", async () => {
      const mockRequest = {
        headers: { get: () => "application/text" },
        text: () => Promise.resolve("test text"),
      } as unknown as Request;

      const result = await readRequestBody(mockRequest);
      expect(result).toBe("test text");
    });

    it("should handle form data", async () => {
      const mockFormData = new FormData();
      mockFormData.append("key1", "value1");
      mockFormData.append("key2", "value2");

      const mockRequest = {
        headers: { get: () => "multipart/form-data" },
        formData: () => Promise.resolve(mockFormData),
      } as unknown as Request;

      const result = await readRequestBody(mockRequest);
      expect(result).toEqual({ key1: "value1", key2: "value2" });
    });

    it("should handle other content types", async () => {
      const mockRequest = {
        headers: { get: () => "unknown/type" },
      } as unknown as Request;

      const result = await readRequestBody(mockRequest);
      expect(result).toBe("a file");
    });

    it("should use empty string when content-type header is null (line 125 branch 1)", async () => {
      // When get() returns null, the ?? "" branch fires → contentType = "" → else branch → "a file"
      const mockRequest = {
        headers: { get: () => null },
      } as unknown as Request;

      const result = await readRequestBody(mockRequest);
      expect(result).toBe("a file");
    });
  });
});
