/**
 * IWD Spotlight MCP Server — Types, constants & brand theme.
 */

import type { CallToolResult } from "@spike-land-ai/mcp-server-base";

// ─── ToolClient Interface ─────────────────────────────────────────────────────

/**
 * Abstraction for calling downstream MCP tools.
 * Injected into every handler; mocked in tests.
 */
export interface ToolClient {
  callTool(name: string, args: Record<string, unknown>): Promise<CallToolResult>;
}

// ─── IWD Brand ────────────────────────────────────────────────────────────────

export const IWD_BRAND = {
  purple: "#A020F0",
  green: "#44B78B",
  white: "#FFFFFF",
  tagline: "International Women's Day 2026",
  hashtags: ["#IWD2026", "#WomenInTech", "#BreakTheBias"],
} as const;

// ─── IWD Milestones ───────────────────────────────────────────────────────────

export interface Milestone {
  year: number;
  title: string;
  description: string;
}

export const IWD_MILESTONES: Milestone[] = [
  { year: 1843, title: "Ada Lovelace", description: "Published the first algorithm intended for machine processing" },
  { year: 1906, title: "Grace Hopper Born", description: "Pioneer of computer programming, invented the first compiler" },
  { year: 1962, title: "NASA Hidden Figures", description: "Katherine Johnson's orbital calculations enabled John Glenn's spaceflight" },
  { year: 1972, title: "Adele Goldberg", description: "Co-developed Smalltalk, influenced modern GUI design" },
  { year: 1985, title: "Radia Perlman", description: "Invented the Spanning Tree Protocol, enabling modern networks" },
  { year: 1995, title: "Marissa Mayer at Google", description: "First female engineer at Google, shaped early search products" },
  { year: 1999, title: "Megan Smith", description: "VP at Google, later became US CTO under President Obama" },
  { year: 2012, title: "Sheryl Sandberg", description: "Published 'Lean In', sparking global conversation on women in leadership" },
  { year: 2014, title: "#ILookLikeAnEngineer", description: "Isis Anchalee's campaign challenged stereotypes of engineers" },
  { year: 2018, title: "Fei-Fei Li", description: "Co-founded Stanford HAI, pioneering ethical AI research" },
  { year: 2023, title: "Mira Murati", description: "Led the launch of ChatGPT as CTO of OpenAI" },
  { year: 2026, title: "International Women's Day", description: "Celebrating women who continue to shape technology" },
];

// ─── Search Terms ─────────────────────────────────────────────────────────────

export const IWD_SEARCH_TERMS = [
  "women in tech",
  "female founder",
  "woman engineer",
  "women in STEM",
  "diversity tech",
  "women leadership tech",
  "female CTO",
  "women open source",
];

// ─── Prompt Templates ─────────────────────────────────────────────────────────

export function spotlightPrompt(name: string, role: string, achievement: string): string {
  return [
    `Create a vibrant celebration card for ${name}, ${role}.`,
    `Achievement: ${achievement}.`,
    `Style: modern, bold, empowering. Use purple (#A020F0) and green (#44B78B) accents.`,
    `Include text "${IWD_BRAND.tagline}" and sparkle/star decorations.`,
    `Professional portrait style with abstract geometric background.`,
  ].join(" ");
}

export function bannerPrompt(title: string): string {
  return [
    `Create a wide social media banner for "${title}".`,
    `Theme: International Women's Day 2026.`,
    `Colors: purple (#A020F0), green (#44B78B), white.`,
    `Bold typography, geometric patterns, empowering energy.`,
    `Include hashtags: ${IWD_BRAND.hashtags.join(" ")}`,
  ].join(" ");
}

export function timelinePrompt(): string {
  return [
    "Create a visual timeline diagram of Women in Technology milestones.",
    "Style: infographic, purple (#A020F0) accent line, green (#44B78B) nodes.",
    "Clean, modern, readable. Include years and key names.",
    `Title: "${IWD_BRAND.tagline} — Milestones"`,
  ].join(" ");
}

// ─── Re-exports ───────────────────────────────────────────────────────────────

export { type CallToolResult, jsonResult, errorResult } from "@spike-land-ai/mcp-server-base";
