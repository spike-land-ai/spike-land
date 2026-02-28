"use client";

import { useMcpMutation } from "@/lib/mcp/client/hooks/use-mcp-mutation";

export function useBrandCommandMcp() {
  // Brand Brain Mutations
  const analyzeBrandVoice = useMcpMutation("brand_score_content");
  const generateBrandGuidelines = useMcpMutation("brand_get_guardrails");
  const brandConsistencyCheck = useMcpMutation("brand_check_policy");

  // Creative Mutations (relay tools)
  const generateAdCopy = useMcpMutation("relay_generate_drafts");
  const createEmailTemplate = useMcpMutation("relay_generate_drafts");
  const generateTaglines = useMcpMutation("relay_generate_drafts");

  // Scout Mutations
  const competitorAnalysis = useMcpMutation("scout_list_competitors");
  const trendDetection = useMcpMutation("scout_list_topics");
  const audienceInsights = useMcpMutation("scout_get_insights");

  return {
    mutations: {
      analyzeBrandVoice,
      generateBrandGuidelines,
      brandConsistencyCheck,
      generateAdCopy,
      createEmailTemplate,
      generateTaglines,
      competitorAnalysis,
      trendDetection,
      audienceInsights,
    },
  };
}
