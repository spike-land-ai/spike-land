/**
 * Route handler tests.
 *
 * All engine dependencies are provided as mocks — no real DB, AI, or network
 * calls happen.  Auth middleware is bypassed by injecting a valid stub token.
 */
import { describe, it, expect, vi } from "vitest";
import { createApp } from "../app.js";
import type { CompassEngines } from "../app.js";
import type {
  Session,
  EligibilityResult,
  Program,
  NavigationStatus,
  NavigationChecklist,
  NavigationMessage,
  Rights,
  RejectionAnalysis,
  LegalResource,
} from "../types.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** A Bearer token that passes the stub verifier in auth.ts */
const VALID_TOKEN = "Bearer stub-token-abc";

function authHeaders(): Record<string, string> {
  return { authorization: VALID_TOKEN };
}

function jsonHeaders(): Record<string, string> {
  return { ...authHeaders(), "content-type": "application/json" };
}

// ---------------------------------------------------------------------------
// Mock engine factories
// ---------------------------------------------------------------------------

function makeSessionEngine(): CompassEngines["sessions"] {
  const session: Session = {
    id: "sess-1",
    locale: "en",
    jurisdiction: "CA",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    status: "active",
  };
  return {
    create: vi.fn().mockResolvedValue(session),
    get: vi.fn().mockImplementation(async (id: string) => (id === "sess-1" ? session : null)),
    end: vi
      .fn()
      .mockImplementation(async (id: string) =>
        id === "sess-1" ? { ...session, status: "ended" as const } : null,
      ),
  };
}

function makeEligibilityEngine(): CompassEngines["eligibility"] {
  const result: EligibilityResult = {
    eligible: true,
    programs: [],
    reasons: ["income threshold met"],
  };
  const program: Program = {
    id: "prog-1",
    name: "Test Program",
    description: "A test program",
    jurisdiction: "CA",
    domain: "immigration",
    requirements: [],
    documents: [],
  };
  return {
    check: vi.fn().mockResolvedValue(result),
    listPrograms: vi.fn().mockResolvedValue({ items: [program], total: 1 }),
    getProgram: vi
      .fn()
      .mockImplementation(async (id: string) => (id === "prog-1" ? program : null)),
  };
}

function makeNavigationEngine(): CompassEngines["navigation"] {
  const status: NavigationStatus = {
    sessionId: "sess-1",
    programId: "prog-1",
    currentStep: "step-1",
    completedSteps: [],
    totalSteps: 5,
    percentComplete: 0,
  };
  const checklist: NavigationChecklist = {
    sessionId: "sess-1",
    items: [],
  };
  const message: NavigationMessage = {
    id: "msg-1",
    sessionId: "sess-1",
    role: "assistant",
    content: "Hello",
    timestamp: "2026-01-01T00:00:00Z",
  };
  return {
    start: vi.fn().mockResolvedValue(status),
    sendMessage: vi.fn().mockResolvedValue(message),
    getStatus: vi.fn().mockImplementation(async (id: string) => (id === "sess-1" ? status : null)),
    getChecklist: vi
      .fn()
      .mockImplementation(async (id: string) => (id === "sess-1" ? checklist : null)),
  };
}

function makeRightsEngine(): CompassEngines["rights"] {
  const rights: Rights = {
    jurisdiction: "CA",
    domain: "immigration",
    rights: [],
  };
  const analysis: RejectionAnalysis = {
    rejected: true,
    reasons: ["documentation missing"],
    appealable: true,
    appealDeadlineDays: 30,
    recommendedActions: ["file appeal"],
  };
  const resource: LegalResource = {
    id: "res-1",
    title: "Immigration Legal Aid",
    url: "https://example.com",
    type: "organization",
    jurisdiction: "CA",
    languages: ["en", "fr"],
  };
  return {
    getRights: vi
      .fn()
      .mockImplementation(async (j: string, d: string) =>
        j === "CA" && d === "immigration" ? rights : null,
      ),
    analyzeRejection: vi.fn().mockResolvedValue(analysis),
    getLegalResources: vi.fn().mockResolvedValue({ items: [resource], total: 1 }),
  };
}

function makeSearchEngine(): CompassEngines["search"] {
  return {
    searchPrograms: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    searchProcesses: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    searchRights: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  };
}

function buildApp() {
  const engines: CompassEngines = {
    sessions: makeSessionEngine(),
    eligibility: makeEligibilityEngine(),
    navigation: makeNavigationEngine(),
    rights: makeRightsEngine(),
    search: makeSearchEngine(),
  };
  return { app: createApp(engines), engines };
}

// ---------------------------------------------------------------------------
// Health / root
// ---------------------------------------------------------------------------

describe("GET /", () => {
  it("returns 200 with service info (no auth required)", async () => {
    const { app } = buildApp();
    const res = await app.request("/");
    expect(res.status).toBe(200);
    const body = await res.json<{ success: boolean; data: { service: string } }>();
    expect(body.success).toBe(true);
    expect(body.data.service).toBe("compass-api");
  });
});

describe("GET /health", () => {
  it("returns 200", async () => {
    const { app } = buildApp();
    const res = await app.request("/health");
    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// Auth middleware
// ---------------------------------------------------------------------------

describe("Auth middleware", () => {
  it("returns 401 when no authorization header is provided", async () => {
    const { app } = buildApp();
    const res = await app.request("/api/sessions", { method: "GET" });
    expect(res.status).toBe(401);
    const body = await res.json<{ success: boolean; error: { code: string } }>();
    expect(body.error.code).toBe("AUTH_REQUIRED");
  });

  it("returns 401 for an invalid token", async () => {
    const { app } = buildApp();
    const res = await app.request("/api/sessions/sess-1", {
      headers: { authorization: "Bearer invalid" },
    });
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// Sessions routes
// ---------------------------------------------------------------------------

describe("POST /api/sessions", () => {
  it("creates a session and returns 201", async () => {
    const { app } = buildApp();
    const res = await app.request("/api/sessions", {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ locale: "en", jurisdiction: "CA" }),
    });
    expect(res.status).toBe(201);
    const body = await res.json<{ success: boolean; data: Session }>();
    expect(body.success).toBe(true);
    expect(body.data.locale).toBe("en");
  });

  it("returns 422 when locale is missing", async () => {
    const { app } = buildApp();
    const res = await app.request("/api/sessions", {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ jurisdiction: "CA" }),
    });
    expect(res.status).toBe(422);
  });

  it("returns 400 on malformed JSON", async () => {
    const { app } = buildApp();
    const res = await app.request("/api/sessions", {
      method: "POST",
      headers: { ...authHeaders(), "content-type": "application/json" },
      body: "not-json",
    });
    expect(res.status).toBe(400);
  });
});

describe("GET /api/sessions/:id", () => {
  it("returns the session", async () => {
    const { app } = buildApp();
    const res = await app.request("/api/sessions/sess-1", {
      headers: authHeaders(),
    });
    expect(res.status).toBe(200);
    const body = await res.json<{ success: boolean; data: Session }>();
    expect(body.data.id).toBe("sess-1");
  });

  it("returns 404 for unknown id", async () => {
    const { app } = buildApp();
    const res = await app.request("/api/sessions/unknown", {
      headers: authHeaders(),
    });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/sessions/:id", () => {
  it("ends the session", async () => {
    const { app } = buildApp();
    const res = await app.request("/api/sessions/sess-1", {
      method: "DELETE",
      headers: authHeaders(),
    });
    expect(res.status).toBe(200);
    const body = await res.json<{ success: boolean; data: Session }>();
    expect(body.data.status).toBe("ended");
  });
});

// ---------------------------------------------------------------------------
// Eligibility routes
// ---------------------------------------------------------------------------

describe("POST /api/eligibility/check", () => {
  it("returns eligibility result", async () => {
    const { app } = buildApp();
    const res = await app.request("/api/eligibility/check", {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ profile: { income: 30000 }, jurisdiction: "CA" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json<{ success: boolean; data: EligibilityResult }>();
    expect(body.data.eligible).toBe(true);
  });

  it("returns 422 when jurisdiction is missing", async () => {
    const { app } = buildApp();
    const res = await app.request("/api/eligibility/check", {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ profile: {} }),
    });
    expect(res.status).toBe(422);
  });
});

describe("GET /api/eligibility/programs/:jurisdiction", () => {
  it("returns paginated programs", async () => {
    const { app } = buildApp();
    const res = await app.request("/api/eligibility/programs/CA", {
      headers: authHeaders(),
    });
    expect(res.status).toBe(200);
    const body = await res.json<{ success: boolean; total: number }>();
    expect(body.success).toBe(true);
    expect(body.total).toBe(1);
  });
});

describe("GET /api/eligibility/program/:id", () => {
  it("returns a program", async () => {
    const { app } = buildApp();
    const res = await app.request("/api/eligibility/program/prog-1", {
      headers: authHeaders(),
    });
    expect(res.status).toBe(200);
  });

  it("returns 404 for unknown program", async () => {
    const { app } = buildApp();
    const res = await app.request("/api/eligibility/program/nope", {
      headers: authHeaders(),
    });
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// Navigation routes
// ---------------------------------------------------------------------------

describe("POST /api/navigation/start", () => {
  it("starts navigation and returns 201", async () => {
    const { app } = buildApp();
    const res = await app.request("/api/navigation/start", {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ sessionId: "sess-1", programId: "prog-1" }),
    });
    expect(res.status).toBe(201);
    const body = await res.json<{ success: boolean; data: NavigationStatus }>();
    expect(body.data.sessionId).toBe("sess-1");
  });

  it("returns 422 when programId is missing", async () => {
    const { app } = buildApp();
    const res = await app.request("/api/navigation/start", {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ sessionId: "sess-1" }),
    });
    expect(res.status).toBe(422);
  });
});

describe("POST /api/navigation/message", () => {
  it("sends a message and returns assistant reply", async () => {
    const { app } = buildApp();
    const res = await app.request("/api/navigation/message", {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ sessionId: "sess-1", content: "Hello" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json<{ success: boolean; data: NavigationMessage }>();
    expect(body.data.role).toBe("assistant");
  });
});

describe("GET /api/navigation/:sessionId/status", () => {
  it("returns navigation status", async () => {
    const { app } = buildApp();
    const res = await app.request("/api/navigation/sess-1/status", {
      headers: authHeaders(),
    });
    expect(res.status).toBe(200);
  });

  it("returns 404 for unknown session", async () => {
    const { app } = buildApp();
    const res = await app.request("/api/navigation/unknown/status", {
      headers: authHeaders(),
    });
    expect(res.status).toBe(404);
  });
});

describe("GET /api/navigation/:sessionId/checklist", () => {
  it("returns the document checklist", async () => {
    const { app } = buildApp();
    const res = await app.request("/api/navigation/sess-1/checklist", {
      headers: authHeaders(),
    });
    expect(res.status).toBe(200);
    const body = await res.json<{ success: boolean; data: NavigationChecklist }>();
    expect(body.data.sessionId).toBe("sess-1");
  });
});

// ---------------------------------------------------------------------------
// Rights routes
// ---------------------------------------------------------------------------

describe("GET /api/rights/:jurisdiction/:domain", () => {
  it("returns rights data", async () => {
    const { app } = buildApp();
    const res = await app.request("/api/rights/CA/immigration", {
      headers: authHeaders(),
    });
    expect(res.status).toBe(200);
    const body = await res.json<{ success: boolean; data: Rights }>();
    expect(body.data.jurisdiction).toBe("CA");
  });

  it("returns 404 for unknown jurisdiction/domain", async () => {
    const { app } = buildApp();
    const res = await app.request("/api/rights/XX/unknown", {
      headers: authHeaders(),
    });
    expect(res.status).toBe(404);
  });
});

describe("POST /api/rights/analyze-rejection", () => {
  it("returns rejection analysis", async () => {
    const { app } = buildApp();
    const res = await app.request("/api/rights/analyze-rejection", {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ decision: "denied", reason: "missing docs" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json<{ success: boolean; data: RejectionAnalysis }>();
    expect(body.data.appealable).toBe(true);
  });
});

describe("GET /api/rights/resources/:jurisdiction", () => {
  it("returns legal resources", async () => {
    const { app } = buildApp();
    const res = await app.request("/api/rights/resources/CA", {
      headers: authHeaders(),
    });
    expect(res.status).toBe(200);
    const body = await res.json<{ success: boolean; total: number }>();
    expect(body.total).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Search routes
// ---------------------------------------------------------------------------

describe("GET /api/search/programs", () => {
  it("returns search results", async () => {
    const { app } = buildApp();
    const res = await app.request("/api/search/programs?query=housing", {
      headers: authHeaders(),
    });
    expect(res.status).toBe(200);
    const body = await res.json<{ success: boolean }>();
    expect(body.success).toBe(true);
  });

  it("returns 422 when query is missing", async () => {
    const { app } = buildApp();
    const res = await app.request("/api/search/programs", {
      headers: authHeaders(),
    });
    expect(res.status).toBe(422);
  });
});

describe("GET /api/search/processes", () => {
  it("returns search results", async () => {
    const { app } = buildApp();
    const res = await app.request("/api/search/processes?query=visa", {
      headers: authHeaders(),
    });
    expect(res.status).toBe(200);
  });
});

describe("GET /api/search/rights", () => {
  it("returns search results", async () => {
    const { app } = buildApp();
    const res = await app.request("/api/search/rights?query=appeal", {
      headers: authHeaders(),
    });
    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// 404 fallthrough
// ---------------------------------------------------------------------------

describe("404 fallthrough", () => {
  it("returns 404 for unknown routes", async () => {
    const { app } = buildApp();
    const res = await app.request("/api/nonexistent", {
      headers: authHeaders(),
    });
    expect(res.status).toBe(404);
    const body = await res.json<{ success: boolean; error: { code: string } }>();
    expect(body.error.code).toBe("NOT_FOUND");
  });
});
