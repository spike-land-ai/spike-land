"use client";

import { useMcpMutation } from "@/lib/mcp/client/hooks/use-mcp-mutation";
import { useCallback } from "react";
import type { OccupationResult } from "../components/OccupationBrowser";
import type { SalaryDataPoint } from "../components/SalaryChart";
import type { JobListing } from "../components/JobListings";
import type { AssessedSkill, OccupationMatch } from "../components/AssessmentWizard";

export interface JobSearchResult {
  jobs: JobListing[];
  total?: number;
}

export function useCareerNavigatorMcp() {
  const analyzeSkills = useMcpMutation("analyze_skills");
  const findSkillGaps = useMcpMutation("find_skill_gaps");
  const suggestLearningPath = useMcpMutation("suggest_learning_path");
  const matchJobs = useMcpMutation("match_jobs");
  const generateResume = useMcpMutation("generate_resume");
  const salaryEstimate = useMcpMutation("salary_estimate");
  const industryTrends = useMcpMutation("industry_trends");

  const searchOccupations = useMcpMutation<OccupationResult[]>("career_search_occupations");
  const getSalary = useMcpMutation<SalaryDataPoint | null>("career_get_salary");
  const getJobs = useMcpMutation<JobSearchResult>("career_get_jobs");
  const assessSkills = useMcpMutation<OccupationMatch[]>("career_assess_skills");

  const searchOccupationsAsync = useCallback(
    async (query: string): Promise<OccupationResult[]> => {
      const result = await searchOccupations.mutateAsync({ query, limit: 20 });
      if (Array.isArray(result)) return result;
      const typed = result as { results?: OccupationResult[]; } | null;
      return typed?.results ?? [];
    },
    [searchOccupations],
  );

  const fetchSalaryAsync = useCallback(
    async (
      occupationTitle: string,
      countryCode: string,
    ): Promise<SalaryDataPoint | null> => {
      const result = await getSalary.mutateAsync({ occupationTitle, countryCode });
      if (!result) return null;
      if (typeof result === "object" && "median" in (result as object)) {
        return result as SalaryDataPoint;
      }
      const typed = result as { salary?: SalaryDataPoint; } | null;
      return typed?.salary ?? null;
    },
    [getSalary],
  );

  const searchJobsAsync = useCallback(
    async (
      query: string,
      location: string,
      countryCode: string,
      page: number,
    ): Promise<JobSearchResult> => {
      const result = await getJobs.mutateAsync({ query, location, countryCode, page, limit: 10 });
      if (!result) return { jobs: [] };
      if (Array.isArray((result as JobSearchResult).jobs)) return result as JobSearchResult;
      const typed = result as { jobs?: JobListing[]; total?: number; } | null;
      return { jobs: typed?.jobs ?? [], total: typed?.total };
    },
    [getJobs],
  );

  const assessSkillsAsync = useCallback(
    async (skills: AssessedSkill[]): Promise<OccupationMatch[]> => {
      const result = await assessSkills.mutateAsync({ skills, limit: 10 });
      if (Array.isArray(result)) return result;
      const typed = result as { matches?: OccupationMatch[]; } | null;
      return typed?.matches ?? [];
    },
    [assessSkills],
  );

  return {
    mutations: {
      analyzeSkills,
      findSkillGaps,
      suggestLearningPath,
      matchJobs,
      generateResume,
      salaryEstimate,
      industryTrends,
      searchOccupations,
      getSalary,
      getJobs,
      assessSkills,
    },
    searchOccupationsAsync,
    fetchSalaryAsync,
    searchJobsAsync,
    assessSkillsAsync,
  };
}
