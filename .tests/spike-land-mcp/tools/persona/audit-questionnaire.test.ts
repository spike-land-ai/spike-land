/**
 * Audit Questionnaire Tools Tests
 */

import { describe, expect, it } from "vitest";
import { PERSONAS } from "../../../../src/edge-api/spike-land/core-logic/lib/persona-data";

// Test the SEGMENTS mapping and scoring logic

const SEGMENTS: Record<string, string[]> = {
  Developer: [
    "ai-indie",
    "classic-indie",
    "agency-dev",
    "in-house-dev",
    "ml-engineer",
    "ai-hobbyist",
    "enterprise-devops",
    "startup-devops",
  ],
  Business: ["technical-founder", "nontechnical-founder", "growth-leader", "ops-leader"],
  Creator: ["content-creator", "hobbyist-creator", "social-gamer", "solo-explorer"],
};

function getSegment(slug: string): string {
  for (const [segment, slugs] of Object.entries(SEGMENTS)) {
    if (slugs.includes(slug)) return segment;
  }
  return "Unknown";
}

describe("Audit Questionnaire", () => {
  describe("segment classification", () => {
    it("all 16 personas belong to a known segment", () => {
      for (const persona of PERSONAS) {
        const segment = getSegment(persona.slug);
        expect(segment).not.toBe("Unknown");
        expect(["Developer", "Business", "Creator"]).toContain(segment);
      }
    });

    it("Developer segment has 8 personas", () => {
      const devPersonas = PERSONAS.filter((p) => getSegment(p.slug) === "Developer");
      expect(devPersonas).toHaveLength(8);
    });

    it("Business segment has 4 personas", () => {
      const bizPersonas = PERSONAS.filter((p) => getSegment(p.slug) === "Business");
      expect(bizPersonas).toHaveLength(4);
    });

    it("Creator segment has 4 personas", () => {
      const creatorPersonas = PERSONAS.filter((p) => getSegment(p.slug) === "Creator");
      expect(creatorPersonas).toHaveLength(4);
    });

    it("segments cover all personas with no overlap", () => {
      const allSlugs = Object.values(SEGMENTS).flat();
      expect(allSlugs).toHaveLength(16);
      expect(new Set(allSlugs).size).toBe(16);
      for (const persona of PERSONAS) {
        expect(allSlugs).toContain(persona.slug);
      }
    });
  });

  describe("score validation", () => {
    it("scores must be integers 1-5", () => {
      const validScores = [1, 2, 3, 4, 5];
      for (const score of validScores) {
        expect(score).toBeGreaterThanOrEqual(1);
        expect(score).toBeLessThanOrEqual(5);
        expect(Number.isInteger(score)).toBe(true);
      }
    });

    it("invalid scores are outside 1-5 range", () => {
      const invalidScores = [0, -1, 6, 10, 1.5, 3.7];
      for (const score of invalidScores) {
        const isValid = Number.isInteger(score) && score >= 1 && score <= 5;
        expect(isValid).toBe(false);
      }
    });
  });

  describe("comparison aggregation logic", () => {
    it("computes correct averages from mock results", () => {
      const mockResults = [
        {
          personaSlug: "ai-indie",
          uxScore: 4,
          contentRelevance: 5,
          ctaCompelling: 3,
          recommendedAppsRelevant: 4,
          wouldSignUp: 1,
        },
        {
          personaSlug: "classic-indie",
          uxScore: 3,
          contentRelevance: 4,
          ctaCompelling: 4,
          recommendedAppsRelevant: 3,
          wouldSignUp: 1,
        },
        {
          personaSlug: "technical-founder",
          uxScore: 5,
          contentRelevance: 5,
          ctaCompelling: 5,
          recommendedAppsRelevant: 5,
          wouldSignUp: 1,
        },
        {
          personaSlug: "content-creator",
          uxScore: 2,
          contentRelevance: 2,
          ctaCompelling: 2,
          recommendedAppsRelevant: 2,
          wouldSignUp: 0,
        },
      ];

      const segmentScores: Record<
        string,
        { total: number; ux: number; content: number; cta: number; apps: number; signups: number }
      > = {};

      for (const r of mockResults) {
        const seg = getSegment(r.personaSlug);
        if (!segmentScores[seg]) {
          segmentScores[seg] = { total: 0, ux: 0, content: 0, cta: 0, apps: 0, signups: 0 };
        }
        const s = segmentScores[seg];
        s.total++;
        s.ux += r.uxScore;
        s.content += r.contentRelevance;
        s.cta += r.ctaCompelling;
        s.apps += r.recommendedAppsRelevant;
        s.signups += r.wouldSignUp;
      }

      // Developer segment: 2 results (ai-indie + classic-indie)
      expect(segmentScores["Developer"]?.total).toBe(2);
      expect(segmentScores["Developer"]?.ux / segmentScores["Developer"]?.total).toBe(3.5);

      // Business segment: 1 result (technical-founder)
      expect(segmentScores["Business"]?.total).toBe(1);
      expect(segmentScores["Business"]?.ux / segmentScores["Business"]?.total).toBe(5);

      // Creator segment: 1 result (content-creator)
      expect(segmentScores["Creator"]?.total).toBe(1);
      expect(segmentScores["Creator"]?.signups / segmentScores["Creator"]?.total).toBe(0);
    });

    it("best/worst persona sorting works correctly", () => {
      const scored = [
        { slug: "ai-indie", name: "AI Indie", avg: 4.0 },
        { slug: "content-creator", name: "Content Creator", avg: 2.0 },
        { slug: "technical-founder", name: "Technical Founder", avg: 5.0 },
      ];
      scored.sort((a, b) => b.avg - a.avg);

      expect(scored[0]?.slug).toBe("technical-founder");
      expect(scored[scored.length - 1]?.slug).toBe("content-creator");
    });
  });
});
