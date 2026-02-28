import { getAppMcpUrl, type StoreApp } from "./types";

export const PRODUCTIVITY_APPS: StoreApp[] = [
  // ─── 1. Content Hub ───────────────────────────────────────────────
  {
    id: "content-hub",
    slug: "content-hub",
    name: "Content Hub",
    tagline: "Blog publishing platform",
    description: "Write, edit, and publish blog posts from a unified CMS.",
    longDescription:
      "The publishing interface for spike.land's built-in blog system. Manage posts, organize content, and publish directly to your site.",
    category: "productivity",
    cardVariant: "orange",
    icon: "FileText",
    appUrl: "/blog",
    mcpServerUrl: getAppMcpUrl("content-hub"),
    codespaceId: "storeContentHub",
    isCodespaceNative: true,
    isFeatured: false,
    isFirstParty: true,
    toolCount: 7,
    tags: ["blogging", "content-management"],
    color: "orange",
    mcpTools: [
      {
        name: "blog_list_posts",
        category: "blog",
        description: "List published blog posts",
      },
      {
        name: "blog_get_post",
        category: "blog",
        description: "Get details and content of a specific blog post",
      },
      {
        name: "blog_create_draft",
        category: "blog-management",
        description: "Create a new blog post draft with title, content, and tags",
      },
      {
        name: "blog_update_post",
        category: "blog-management",
        description: "Update an existing blog post draft",
      },
      {
        name: "blog_publish_post",
        category: "blog-management",
        description: "Publish a draft post or schedule it for a future date",
      },
      {
        name: "blog_get_analytics",
        category: "blog-management",
        description: "Get analytics for a blog post: views, reading time, and engagement",
      },
      {
        name: "blog_schedule_post",
        category: "blog-management",
        description: "Schedule a post to publish at a specific date and time",
      },
    ],
    features: [
      {
        title: "Blog CMS",
        description: "Manage and publish blog posts",
        icon: "FileText",
      },
      {
        title: "Content Discovery",
        description: "Browse posts by category, tag, or featured status",
        icon: "Search",
      },
    ],
  },

  // ─── 2. Social Autopilot ──────────────────────────────────────────
  {
    id: "social-autopilot",
    slug: "social-autopilot",
    name: "Social Autopilot",
    tagline: "Social media scheduler",
    description: "Schedule posts, find optimal times, and detect content gaps.",
    longDescription:
      "For social media managers who need a steady content cadence. Schedule posts across platforms, let AI find the best posting times, and get alerts when your calendar has gaps.",
    category: "productivity",
    cardVariant: "green",
    icon: "Calendar",
    appUrl: "/apps/social-autopilot",
    mcpServerUrl: getAppMcpUrl("social-autopilot"),
    isFeatured: false,
    isFirstParty: true,
    toolCount: 9,
    tags: ["social-media", "scheduling", "automation"],
    color: "green",
    mcpTools: [
      {
        name: "calendar_schedule_post",
        category: "calendar",
        description: "Schedule a post to be published at a specific time",
      },
      {
        name: "calendar_list_scheduled",
        category: "calendar",
        description: "List all scheduled upcoming posts",
      },
      {
        name: "calendar_cancel_post",
        category: "calendar",
        description: "Cancel a previously scheduled post",
      },
      {
        name: "calendar_get_best_times",
        category: "calendar",
        description: "Analyze the schedule to find optimal posting times",
      },
      {
        name: "calendar_detect_gaps",
        category: "calendar",
        description: "Detect gaps in the content calendar requiring attention",
      },
      {
        name: "calendar_get_analytics",
        category: "calendar-analytics",
        description: "Get content calendar analytics for a date range",
      },
      {
        name: "calendar_suggest_content",
        category: "calendar-analytics",
        description: "Get AI content suggestions for calendar gaps",
      },
      {
        name: "calendar_bulk_schedule",
        category: "calendar-analytics",
        description: "Bulk schedule multiple posts from a content plan",
      },
      {
        name: "calendar_get_performance",
        category: "calendar-analytics",
        description: "Get performance metrics for scheduled posts",
      },
    ],
    features: [
      {
        title: "Content Scheduling",
        description: "Schedule social media posts across platforms",
        icon: "Calendar",
      },
      {
        title: "Smart Insights",
        description: "Find optimal posting times and detect calendar gaps",
        icon: "Sparkles",
      },
    ],
  },
];
