import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useBrandCommandMcp } from "./useBrandCommandMcp";

const { mockUseMcpMutation } = vi.hoisted(() => ({
  mockUseMcpMutation: vi.fn(),
}));

vi.mock("@/lib/mcp/client/hooks/use-mcp-mutation", () => ({
  useMcpMutation: mockUseMcpMutation,
}));

const mockMutationFactory = () => ({
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
  data: undefined,
  error: undefined,
  isLoading: false,
  reset: vi.fn(),
});

describe("useBrandCommandMcp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMcpMutation.mockImplementation(mockMutationFactory);
  });

  it("calls useMcpMutation with correct tool names", () => {
    renderHook(() => useBrandCommandMcp());

    const calledNames = mockUseMcpMutation.mock.calls.map(
      (call: any[]) => call[0],
    );

    expect(calledNames).toContain("brand_score_content");
    expect(calledNames).toContain("brand_get_guardrails");
    expect(calledNames).toContain("brand_check_policy");
    expect(calledNames).toContain("relay_generate_drafts");
    expect(calledNames).toContain("scout_list_competitors");
    expect(calledNames).toContain("scout_list_topics");
    expect(calledNames).toContain("scout_get_insights");
  });

  it("returns mutations object with all expected keys", () => {
    const { result } = renderHook(() => useBrandCommandMcp());

    expect(result.current.mutations).toHaveProperty("analyzeBrandVoice");
    expect(result.current.mutations).toHaveProperty("generateBrandGuidelines");
    expect(result.current.mutations).toHaveProperty("brandConsistencyCheck");
    expect(result.current.mutations).toHaveProperty("generateAdCopy");
    expect(result.current.mutations).toHaveProperty("createEmailTemplate");
    expect(result.current.mutations).toHaveProperty("generateTaglines");
    expect(result.current.mutations).toHaveProperty("competitorAnalysis");
    expect(result.current.mutations).toHaveProperty("trendDetection");
    expect(result.current.mutations).toHaveProperty("audienceInsights");
  });

  it("each mutation has mutate, mutateAsync, data, error, isLoading, reset", () => {
    const { result } = renderHook(() => useBrandCommandMcp());
    const { mutations } = result.current;

    for (const key of Object.keys(mutations)) {
      const mutation = mutations[key as keyof typeof mutations];
      expect(typeof mutation.mutate).toBe("function");
      expect(typeof mutation.mutateAsync).toBe("function");
      expect(typeof mutation.reset).toBe("function");
      expect(mutation.data).toBeUndefined();
      expect(mutation.error).toBeUndefined();
      expect(mutation.isLoading).toBe(false);
    }
  });

  it("useMcpMutation is called 9 times (once per mutation)", () => {
    renderHook(() => useBrandCommandMcp());
    expect(mockUseMcpMutation).toHaveBeenCalledTimes(9);
  });

  it("generateAdCopy, createEmailTemplate, generateTaglines all use relay_generate_drafts", () => {
    renderHook(() => useBrandCommandMcp());

    const calledNames = mockUseMcpMutation.mock.calls.map(
      (call: any[]) => call[0],
    );
    const relayCount = calledNames.filter(
      (name: string) => name === "relay_generate_drafts",
    ).length;

    expect(relayCount).toBe(3);
  });
});
