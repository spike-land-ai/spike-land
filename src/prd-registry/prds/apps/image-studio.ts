import type { PrdDefinition } from "../../core-logic/types.js";

export const imageStudioPrd: PrdDefinition = {
  id: "app:image-studio",
  level: "app",
  name: "Image Studio",
  summary: "AI image generation, enhancement, albums, and processing pipelines via MCP tools",
  purpose:
    "Full image creation and management app. Generate images with AI, enhance existing photos, organize into albums, and build reusable processing pipelines.",
  constraints: [
    "Image generation must respect content policy",
    "Enhancement jobs are async with progress tracking",
    "Albums support privacy controls and sharing tokens",
    "Pipelines are composable and forkable",
  ],
  acceptance: [
    "Generate an image from text prompt in <30s",
    "Enhancement pipeline processes batch of 10 images",
    "Album sharing via token works for unauthenticated users",
  ],
  toolCategories: [
    "image",
    "gallery",
    "share",
    "album-images",
    "album-management",
    "batch-enhance",
    "enhancement-jobs",
    "pipelines",
  ],
  tools: [],
  composesFrom: ["platform", "domain:app-building", "route:/apps"],
  routePatterns: ["/apps/image-studio"],
  keywords: ["image", "photo", "generate", "enhance", "album", "gallery", "ai art"],
  tokenEstimate: 400,
  version: "1.0.0",
};
