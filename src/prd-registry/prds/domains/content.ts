import type { PrdDefinition } from "../../core-logic/types.js";

export const contentDomain: PrdDefinition = {
  id: "domain:content",
  level: "domain",
  name: "Content & Publishing",
  summary: "Blog, documentation, dynamic pages, and content strategy for the platform",
  purpose:
    "Domain for content creation and publishing. Covers blog posts (MDX), dynamic pages, content strategy, SEO optimization, and the persona-driven content approach.",
  constraints: [
    "Blog posts use MDX format with YAML frontmatter",
    "SEO metadata required on all public pages",
    "Content must match the Rubik persona voice",
    "Images must have alt text and be optimized",
  ],
  acceptance: [
    "Published content renders correctly with syntax highlighting",
    "Blog posts are indexed and searchable",
  ],
  toolCategories: [
    "blog",
    "blog-management",
    "pages",
    "blocks",
    "page-ai",
    "page-templates",
    "page-review",
    "newsletter",
  ],
  tools: [],
  composesFrom: ["platform"],
  routePatterns: [],
  keywords: [
    "blog",
    "content",
    "article",
    "post",
    "page",
    "seo",
    "docs",
    "documentation",
    "publish",
    "persona",
    "strategy",
    "newsletter",
  ],
  tokenEstimate: 280,
  version: "1.0.0",
};
