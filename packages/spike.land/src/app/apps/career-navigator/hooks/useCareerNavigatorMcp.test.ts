import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

const mockUseMcpMutation = vi.hoisted(() => vi.fn());

vi.mock("@/lib/mcp/client/hooks/use-mcp-mutation", () => ({
  useMcpMutation: mockUseMcpMutation,
}));

import { useCareerNavigatorMcp } from "./useCareerNavigatorMcp";

function makeMutation(overrides: Partial<ReturnType<typeof mockUseMcpMutation>> = {}) {
  return {
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    data: undefined,
    error: undefined,
    isLoading: false,
    reset: vi.fn(),
    ...overrides,
  };
}

describe("useCareerNavigatorMcp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMcpMutation.mockReturnValue(makeMutation());
  });

  describe("hook initialization", () => {
    it("returns all expected mutation keys", () => {
      const { result } = renderHook(() => useCareerNavigatorMcp());

      const { mutations } = result.current;
      expect(mutations).toHaveProperty("analyzeSkills");
      expect(mutations).toHaveProperty("findSkillGaps");
      expect(mutations).toHaveProperty("suggestLearningPath");
      expect(mutations).toHaveProperty("matchJobs");
      expect(mutations).toHaveProperty("generateResume");
      expect(mutations).toHaveProperty("salaryEstimate");
      expect(mutations).toHaveProperty("industryTrends");
      expect(mutations).toHaveProperty("searchOccupations");
      expect(mutations).toHaveProperty("getSalary");
      expect(mutations).toHaveProperty("getJobs");
      expect(mutations).toHaveProperty("assessSkills");
    });

    it("returns the async helper functions", () => {
      const { result } = renderHook(() => useCareerNavigatorMcp());

      expect(typeof result.current.searchOccupationsAsync).toBe("function");
      expect(typeof result.current.fetchSalaryAsync).toBe("function");
      expect(typeof result.current.searchJobsAsync).toBe("function");
      expect(typeof result.current.assessSkillsAsync).toBe("function");
    });

    it("registers all 11 MCP mutations", () => {
      renderHook(() => useCareerNavigatorMcp());
      expect(mockUseMcpMutation).toHaveBeenCalledTimes(11);
    });

    it("calls useMcpMutation with correct tool names", () => {
      renderHook(() => useCareerNavigatorMcp());

      const calledNames = mockUseMcpMutation.mock.calls.map(
        (call: unknown[]) => call[0],
      );
      expect(calledNames).toContain("career_search_occupations");
      expect(calledNames).toContain("career_get_salary");
      expect(calledNames).toContain("career_get_jobs");
      expect(calledNames).toContain("career_assess_skills");
      expect(calledNames).toContain("analyze_skills");
      expect(calledNames).toContain("find_skill_gaps");
      expect(calledNames).toContain("suggest_learning_path");
      expect(calledNames).toContain("match_jobs");
      expect(calledNames).toContain("generate_resume");
      expect(calledNames).toContain("salary_estimate");
      expect(calledNames).toContain("industry_trends");
    });
  });

  describe("searchOccupationsAsync", () => {
    it("calls mutateAsync with correct params", async () => {
      const mutateAsync = vi.fn().mockResolvedValue([]);
      mockUseMcpMutation.mockReturnValue(makeMutation({ mutateAsync }));

      const { result } = renderHook(() => useCareerNavigatorMcp());

      await act(async () => {
        await result.current.searchOccupationsAsync("Software Developer");
      });

      expect(mutateAsync).toHaveBeenCalledWith({ query: "Software Developer", limit: 20 });
    });

    it("returns array result directly when tool returns array", async () => {
      const occupations = [
        { uri: "esco:123", title: "Software Developer", className: "Occupation" },
      ];
      const mutateAsync = vi.fn().mockResolvedValue(occupations);
      mockUseMcpMutation.mockReturnValue(makeMutation({ mutateAsync }));

      const { result } = renderHook(() => useCareerNavigatorMcp());

      let returned: unknown;
      await act(async () => {
        returned = await result.current.searchOccupationsAsync("Dev");
      });

      expect(returned).toEqual(occupations);
    });

    it("extracts results from object wrapper when tool returns { results: [...] }", async () => {
      const occupations = [
        { uri: "esco:456", title: "Data Scientist", className: "Occupation" },
      ];
      const mutateAsync = vi.fn().mockResolvedValue({ results: occupations });
      mockUseMcpMutation.mockReturnValue(makeMutation({ mutateAsync }));

      const { result } = renderHook(() => useCareerNavigatorMcp());

      let returned: unknown;
      await act(async () => {
        returned = await result.current.searchOccupationsAsync("Data");
      });

      expect(returned).toEqual(occupations);
    });

    it("returns empty array when tool returns null", async () => {
      const mutateAsync = vi.fn().mockResolvedValue(null);
      mockUseMcpMutation.mockReturnValue(makeMutation({ mutateAsync }));

      const { result } = renderHook(() => useCareerNavigatorMcp());

      let returned: unknown;
      await act(async () => {
        returned = await result.current.searchOccupationsAsync("something");
      });

      expect(returned).toEqual([]);
    });
  });

  describe("fetchSalaryAsync", () => {
    it("calls mutateAsync with correct params", async () => {
      const mutateAsync = vi.fn().mockResolvedValue(null);
      mockUseMcpMutation.mockReturnValue(makeMutation({ mutateAsync }));

      const { result } = renderHook(() => useCareerNavigatorMcp());

      await act(async () => {
        await result.current.fetchSalaryAsync("Software Engineer", "gb");
      });

      expect(mutateAsync).toHaveBeenCalledWith({
        occupationTitle: "Software Engineer",
        countryCode: "gb",
      });
    });

    it("returns SalaryDataPoint directly when tool returns it", async () => {
      const salaryData = {
        occupationTitle: "Engineer",
        median: 80000,
        p25: 60000,
        p75: 100000,
        currency: "GBP",
        location: "UK",
        source: "Adzuna",
      };
      const mutateAsync = vi.fn().mockResolvedValue(salaryData);
      mockUseMcpMutation.mockReturnValue(makeMutation({ mutateAsync }));

      const { result } = renderHook(() => useCareerNavigatorMcp());

      let returned: unknown;
      await act(async () => {
        returned = await result.current.fetchSalaryAsync("Engineer", "gb");
      });

      expect(returned).toEqual(salaryData);
    });

    it("extracts salary from { salary: {...} } wrapper", async () => {
      const salaryData = {
        occupationTitle: "Engineer",
        median: 80000,
        p25: 60000,
        p75: 100000,
        currency: "GBP",
        location: "UK",
        source: "Adzuna",
      };
      const mutateAsync = vi.fn().mockResolvedValue({ salary: salaryData });
      mockUseMcpMutation.mockReturnValue(makeMutation({ mutateAsync }));

      const { result } = renderHook(() => useCareerNavigatorMcp());

      let returned: unknown;
      await act(async () => {
        returned = await result.current.fetchSalaryAsync("Engineer", "gb");
      });

      expect(returned).toEqual(salaryData);
    });

    it("returns null when tool returns null", async () => {
      const mutateAsync = vi.fn().mockResolvedValue(null);
      mockUseMcpMutation.mockReturnValue(makeMutation({ mutateAsync }));

      const { result } = renderHook(() => useCareerNavigatorMcp());

      let returned: unknown;
      await act(async () => {
        returned = await result.current.fetchSalaryAsync("Unknown", "us");
      });

      expect(returned).toBeNull();
    });
  });

  describe("searchJobsAsync", () => {
    it("calls mutateAsync with correct params", async () => {
      const mutateAsync = vi.fn().mockResolvedValue({ jobs: [], total: 0 });
      mockUseMcpMutation.mockReturnValue(makeMutation({ mutateAsync }));

      const { result } = renderHook(() => useCareerNavigatorMcp());

      await act(async () => {
        await result.current.searchJobsAsync("React Developer", "London", "gb", 1);
      });

      expect(mutateAsync).toHaveBeenCalledWith({
        query: "React Developer",
        location: "London",
        countryCode: "gb",
        page: 1,
        limit: 10,
      });
    });

    it("returns jobs and total from direct result", async () => {
      const jobs = [
        {
          id: "j1",
          title: "React Dev",
          company: "Acme",
          location: "London",
          salary_min: 60000,
          salary_max: 80000,
          currency: "GBP",
          description: "A great job",
          url: "https://example.com",
          created: "2026-01-01",
          category: "IT",
        },
      ];
      const mutateAsync = vi.fn().mockResolvedValue({ jobs, total: 1 });
      mockUseMcpMutation.mockReturnValue(makeMutation({ mutateAsync }));

      const { result } = renderHook(() => useCareerNavigatorMcp());

      let returned: unknown;
      await act(async () => {
        returned = await result.current.searchJobsAsync("React", "", "gb", 1);
      });

      expect(returned).toEqual({ jobs, total: 1 });
    });

    it("returns { jobs: [] } when tool returns null", async () => {
      const mutateAsync = vi.fn().mockResolvedValue(null);
      mockUseMcpMutation.mockReturnValue(makeMutation({ mutateAsync }));

      const { result } = renderHook(() => useCareerNavigatorMcp());

      let returned: unknown;
      await act(async () => {
        returned = await result.current.searchJobsAsync("React", "", "gb", 1);
      });

      expect(returned).toEqual({ jobs: [] });
    });

    it("extracts jobs from object wrapper when tool returns { jobs: [...], total: N }", async () => {
      const jobs = [
        {
          id: "j2",
          title: "TS Dev",
          company: "Corp",
          location: "Remote",
          salary_min: null,
          salary_max: null,
          currency: "GBP",
          description: "TypeScript role",
          url: "https://corp.com",
          created: "2026-02-01",
          category: "IT",
        },
      ];
      const mutateAsync = vi.fn().mockResolvedValue({ jobs, total: 42 });
      mockUseMcpMutation.mockReturnValue(makeMutation({ mutateAsync }));

      const { result } = renderHook(() => useCareerNavigatorMcp());

      let returned: unknown;
      await act(async () => {
        returned = await result.current.searchJobsAsync("TS", "", "gb", 2);
      });

      expect(returned).toEqual({ jobs, total: 42 });
    });
  });

  describe("assessSkillsAsync", () => {
    const mockSkills = [
      { uri: "user:react", title: "React", proficiency: 4 },
      { uri: "user:typescript", title: "TypeScript", proficiency: 5 },
    ];

    it("calls mutateAsync with correct params", async () => {
      const mutateAsync = vi.fn().mockResolvedValue([]);
      mockUseMcpMutation.mockReturnValue(makeMutation({ mutateAsync }));

      const { result } = renderHook(() => useCareerNavigatorMcp());

      await act(async () => {
        await result.current.assessSkillsAsync(mockSkills);
      });

      expect(mutateAsync).toHaveBeenCalledWith({ skills: mockSkills, limit: 10 });
    });

    it("returns array result directly", async () => {
      const matches = [
        {
          uri: "esco:software-dev",
          title: "Software Developer",
          score: 90,
          matchedSkills: 5,
          totalRequired: 6,
          gaps: [],
        },
      ];
      const mutateAsync = vi.fn().mockResolvedValue(matches);
      mockUseMcpMutation.mockReturnValue(makeMutation({ mutateAsync }));

      const { result } = renderHook(() => useCareerNavigatorMcp());

      let returned: unknown;
      await act(async () => {
        returned = await result.current.assessSkillsAsync(mockSkills);
      });

      expect(returned).toEqual(matches);
    });

    it("extracts matches from { matches: [...] } wrapper", async () => {
      const matches = [
        {
          uri: "esco:fullstack",
          title: "Full Stack Developer",
          score: 85,
          matchedSkills: 4,
          totalRequired: 5,
          gaps: [{ skill: { title: "Docker" }, priority: "medium" as const, gap: 2 }],
        },
      ];
      const mutateAsync = vi.fn().mockResolvedValue({ matches });
      mockUseMcpMutation.mockReturnValue(makeMutation({ mutateAsync }));

      const { result } = renderHook(() => useCareerNavigatorMcp());

      let returned: unknown;
      await act(async () => {
        returned = await result.current.assessSkillsAsync(mockSkills);
      });

      expect(returned).toEqual(matches);
    });

    it("returns empty array when tool returns null", async () => {
      const mutateAsync = vi.fn().mockResolvedValue(null);
      mockUseMcpMutation.mockReturnValue(makeMutation({ mutateAsync }));

      const { result } = renderHook(() => useCareerNavigatorMcp());

      let returned: unknown;
      await act(async () => {
        returned = await result.current.assessSkillsAsync(mockSkills);
      });

      expect(returned).toEqual([]);
    });
  });
});
