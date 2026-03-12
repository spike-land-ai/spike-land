import type { PrdDefinition } from "../../core-logic/types.js";

export const learningDomain: PrdDefinition = {
  id: "domain:learning",
  level: "domain",
  name: "Learning & Career",
  summary: "AI-powered wiki, career tools, tutorials, quizzes, and badge-based progression",
  purpose:
    "Domain for educational content and career development. Includes the LearnIt knowledge base, career growth tools, and gamified learning paths with badges.",
  constraints: [
    "Content must be accurate and up-to-date",
    "Learning paths must track progress persistently",
    "Badge criteria must be clearly defined and verifiable",
  ],
  acceptance: [
    "Users can navigate topic graph and find related content",
    "Career tools return relevant job matches and salary data",
  ],
  toolCategories: ["learnit", "career", "career-growth"],
  tools: [],
  composesFrom: ["platform"],
  routePatterns: [],
  keywords: [
    "learn",
    "tutorial",
    "quiz",
    "badge",
    "career",
    "resume",
    "knowledge",
    "wiki",
    "education",
    "course",
  ],
  tokenEstimate: 250,
  version: "1.0.0",
};
