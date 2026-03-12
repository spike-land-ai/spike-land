import type { PrdDefinition } from "../../core-logic/types.js";

export const blogRoute: PrdDefinition = {
  id: "route:/blog",
  level: "route",
  name: "Blog",
  summary: "Published MDX blog posts with syntax highlighting, TTS, and reader controls",
  purpose:
    "Blog listing and individual post pages. Posts are MDX with YAML frontmatter, rendered with syntax highlighting and optional text-to-speech playback.",
  constraints: [
    "Posts must have valid frontmatter (title, date, slug, description)",
    "Code blocks must use syntax highlighting",
    "TTS controls only shown when ElevenLabs is available",
  ],
  acceptance: [
    "Blog listing sorted by date, newest first",
    "Individual posts render MDX correctly including code blocks",
  ],
  toolCategories: ["blog", "blog-management", "tts"],
  tools: [],
  composesFrom: ["platform", "domain:content"],
  routePatterns: ["/blog", "/blog/*", "/blog/$slug"],
  keywords: ["blog", "article", "post", "read", "write", "publish"],
  tokenEstimate: 180,
  version: "1.0.0",
};
