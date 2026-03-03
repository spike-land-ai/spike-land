import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// We must mock readline before importing the module so that the mock is in
// place when the module is first evaluated.
const mockRlQuestion = vi.hoisted(() => vi.fn());
const mockRlClose = vi.hoisted(() => vi.fn());
const mockCreateInterface = vi.hoisted(() =>
  vi.fn(() => ({
    question: mockRlQuestion,
    close: mockRlClose,
  })),
);

vi.mock("node:readline", () => ({
  createInterface: mockCreateInterface,
}));

// Mock global fetch for submitOnboarding tests
const mockFetch = vi.hoisted(() => vi.fn());
vi.stubGlobal("fetch", mockFetch);

import { runOnboardingWizard, submitOnboarding } from "../../onboarding/wizard.js";

describe("runOnboardingWizard", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  /**
   * Helper: sets up readline mock to respond to each question in order.
   * The answers array maps to ONBOARDING_QUESTIONS by index.
   */
  function setupAnswers(answers: string[]): void {
    let callIndex = 0;
    mockRlQuestion.mockImplementation((_prompt: string, callback: (answer: string) => void) => {
      callback(answers[callIndex++] ?? "n");
    });
  }

  it("returns all-false persona (id 0) when all answers are no", async () => {
    setupAnswers(["n", "n", "n", "n"]);

    const result = await runOnboardingWizard();

    expect(result.personaId).toBe(0);
    expect(result.personaSlug).toBe("curious-explorer");
    expect(result.personaName).toBe("Curious Explorer");
    expect(result.answers).toEqual([false, false, false, false]);
    expect(result.completedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("returns all-true persona (id 15) when all answers are yes", async () => {
    setupAnswers(["y", "y", "y", "y"]);

    const result = await runOnboardingWizard();

    expect(result.personaId).toBe(15);
    expect(result.personaSlug).toBe("ai-engineering-lead");
    expect(result.personaName).toBe("AI Engineering Lead");
    expect(result.answers).toEqual([true, true, true, true]);
  });

  it("treats answers starting with 'y' as truthy", async () => {
    setupAnswers(["yes", "yep", "Y", "YES"]);

    const result = await runOnboardingWizard();

    expect(result.answers).toEqual([true, true, true, true]);
  });

  it("treats answers not starting with 'y' as falsy", async () => {
    setupAnswers(["no", "nope", "N", "maybe"]);

    const result = await runOnboardingWizard();

    expect(result.answers).toEqual([false, false, false, false]);
  });

  it("produces the hobbyist coder persona (id 8) for coder-only", async () => {
    // [true, false, false, false] → id 8
    setupAnswers(["y", "n", "n", "n"]);

    const result = await runOnboardingWizard();

    expect(result.personaId).toBe(8);
    expect(result.personaSlug).toBe("hobbyist-coder");
  });

  it("produces the indie-shipper persona (id 5) for [false, true, false, true]", async () => {
    // [false, true, false, true] → 0 + 4 + 0 + 1 = 5
    setupAnswers(["n", "y", "n", "y"]);

    const result = await runOnboardingWizard();

    expect(result.personaId).toBe(5);
    expect(result.personaSlug).toBe("indie-shipper");
  });

  it("closes the readline interface after wizard completes", async () => {
    setupAnswers(["n", "n", "n", "n"]);

    await runOnboardingWizard();

    expect(mockRlClose).toHaveBeenCalled();
  });

  it("closes readline even if an error occurs mid-wizard", async () => {
    let callIndex = 0;
    mockRlQuestion.mockImplementation((_prompt: string, callback: (answer: string) => void) => {
      callIndex++;
      if (callIndex === 2) {
        throw new Error("readline exploded");
      }
      callback("n");
    });

    await expect(runOnboardingWizard()).rejects.toThrow("readline exploded");
    expect(mockRlClose).toHaveBeenCalled();
  });

  it("prints welcome message to stderr", async () => {
    setupAnswers(["n", "n", "n", "n"]);

    await runOnboardingWizard();

    const output = errorSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(output).toContain("personalize");
  });

  it("asks exactly 4 questions", async () => {
    setupAnswers(["n", "n", "n", "n"]);

    await runOnboardingWizard();

    expect(mockRlQuestion).toHaveBeenCalledTimes(4);
  });
});

describe("submitOnboarding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({ ok: true });
  });

  const sampleResult = {
    personaId: 15,
    personaSlug: "ai-engineering-lead",
    personaName: "AI Engineering Lead",
    answers: [true, true, true, true],
    completedAt: "2024-01-01T00:00:00.000Z",
  };

  it("POSTs to the correct endpoint", async () => {
    await submitOnboarding(sampleResult, "https://spike.land", "my-token");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://spike.land/api/onboarding",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("sends Authorization header with bearer token", async () => {
    await submitOnboarding(sampleResult, "https://spike.land", "my-token");

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)["Authorization"]).toBe("Bearer my-token");
  });

  it("sends Content-Type application/json", async () => {
    await submitOnboarding(sampleResult, "https://spike.land", "tok");

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe("application/json");
  });

  it("sends the result payload as JSON body", async () => {
    await submitOnboarding(sampleResult, "https://spike.land", "tok");

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as typeof sampleResult;
    expect(body.personaId).toBe(15);
    expect(body.personaSlug).toBe("ai-engineering-lead");
  });

  it("uses the provided baseUrl in the request", async () => {
    await submitOnboarding(sampleResult, "https://custom.example.com", "tok");

    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toContain("https://custom.example.com");
  });
});
