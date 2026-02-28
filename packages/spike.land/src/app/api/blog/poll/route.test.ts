import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUpsert = vi.fn();
const mockFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  default: {
    blogPollVote: {
      upsert: (...args: unknown[]) => mockUpsert(...args),
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
  },
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue({ value: "test-visitor-id" }),
  }),
}));

import { GET, POST } from "./route";

function makeRequest(url: string, options?: RequestInit): Request {
  return new Request(url, options);
}

describe("POST /api/blog/poll", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should reject invalid body", async () => {
    const req = makeRequest("http://localhost/api/blog/poll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invalid: true }),
    });

    const res = await POST(req);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toBe("Invalid request body");
  });

  it("should upsert a vote with valid body", async () => {
    mockUpsert.mockResolvedValue({ id: "test-id" });

    const req = makeRequest("http://localhost/api/blog/poll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        articleSlug: "test-article",
        personaSlug: "ai-indie",
        questionVariant: "Could A/B testing replace your gut instinct?",
        answer: "yes",
      }),
    });

    const res = await POST(req);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockUpsert).toHaveBeenCalledOnce();
  });

  it("should reject invalid answer values", async () => {
    const req = makeRequest("http://localhost/api/blog/poll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        articleSlug: "test-article",
        personaSlug: "ai-indie",
        questionVariant: "Test?",
        answer: "maybe",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

describe("GET /api/blog/poll", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should reject missing slug", async () => {
    const req = makeRequest("http://localhost/api/blog/poll");
    const res = await GET(req);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toBe("Missing slug parameter");
  });

  it("should return aggregated results", async () => {
    mockFindMany.mockResolvedValue([
      { personaSlug: "ai-indie", answer: "yes" },
      { personaSlug: "ai-indie", answer: "yes" },
      { personaSlug: "ai-indie", answer: "no" },
      { personaSlug: "ml-engineer", answer: "no" },
    ]);

    const req = makeRequest("http://localhost/api/blog/poll?slug=test-article");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.personas["ai-indie"].votes_yes).toBe(2);
    expect(json.personas["ai-indie"].votes_no).toBe(1);
    expect(json.personas["ml-engineer"].votes_yes).toBe(0);
    expect(json.personas["ml-engineer"].votes_no).toBe(1);
  });

  it("should return empty personas for no votes", async () => {
    mockFindMany.mockResolvedValue([]);

    const req = makeRequest(
      "http://localhost/api/blog/poll?slug=empty-article",
    );
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.personas).toEqual({});
  });
});
