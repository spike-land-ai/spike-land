import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockHandlers = vi.hoisted(() => ({
  GET: vi.fn(),
  POST: vi.fn(),
}));

const mockLogger = vi.hoisted(() => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

vi.mock("@/auth", () => ({ handlers: mockHandlers }));
vi.mock("@/lib/errors/structured-logger", () => mockLogger);

import { POST } from "./route";

function makeRequest(
  contentType: string,
  body: string = "csrfToken=test",
): NextRequest {
  return new NextRequest(
    "http://localhost:3000/api/auth/callback/credentials",
    {
      method: "POST",
      headers: { "Content-Type": contentType },
      body,
    },
  );
}

describe("POST /api/auth/[...nextauth]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHandlers.POST.mockResolvedValue(new Response("ok", { status: 200 }));
  });

  it("allows application/x-www-form-urlencoded and delegates to handlers", async () => {
    const request = makeRequest("application/x-www-form-urlencoded");
    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(mockHandlers.POST).toHaveBeenCalledWith(request);
  });

  it("allows multipart/form-data and delegates to handlers", async () => {
    const boundary = "----TestBoundary";
    const body =
      `------TestBoundary\r\nContent-Disposition: form-data; name="csrf"\r\n\r\ntoken\r\n------TestBoundary--\r\n`;
    const request = makeRequest(
      `multipart/form-data; boundary=${boundary}`,
      body,
    );
    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(mockHandlers.POST).toHaveBeenCalled();
  });

  it("rejects application/json with 415", async () => {
    const request = makeRequest(
      "application/json",
      JSON.stringify({ foo: "bar" }),
    );
    const response = await POST(request);
    expect(response.status).toBe(415);
    const data = await response.json();
    expect(data.error).toBe("Unsupported Content-Type");
    expect(mockHandlers.POST).not.toHaveBeenCalled();
  });

  it("rejects text/plain with 415", async () => {
    const request = makeRequest("text/plain", "hello");
    const response = await POST(request);
    expect(response.status).toBe(415);
    expect(mockHandlers.POST).not.toHaveBeenCalled();
  });

  it("rejects requests with no content-type with 415", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/auth/callback/credentials",
      { method: "POST", body: "test" },
    );
    const response = await POST(request);
    expect(response.status).toBe(415);
    expect(mockHandlers.POST).not.toHaveBeenCalled();
  });

  it("catches FormData parse errors and returns 400", async () => {
    mockHandlers.POST.mockRejectedValue(
      new TypeError("Failed to parse body as FormData"),
    );

    const request = makeRequest(
      "application/x-www-form-urlencoded",
      "bad body",
    );
    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Malformed request body");
    expect(mockLogger.logger.warn).toHaveBeenCalled();
  });

  it("catches boundary-related errors and returns 400", async () => {
    mockHandlers.POST.mockRejectedValue(
      new TypeError("expected a value starting with -- and the boundary"),
    );

    const request = makeRequest("multipart/form-data", "not-multipart");
    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Malformed request body");
  });

  it("re-throws non-FormData errors", async () => {
    const otherError = new Error("Database connection failed");
    mockHandlers.POST.mockRejectedValue(otherError);

    const request = makeRequest("application/x-www-form-urlencoded");
    await expect(POST(request)).rejects.toThrow("Database connection failed");
  });
});
