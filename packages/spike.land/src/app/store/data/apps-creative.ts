import { getAppMcpUrl, type StoreApp } from "./types";

export const CREATIVE_APPS: StoreApp[] = [
  // ─── 1. Audio Studio ───────────────────────────────────────────────
  {
    id: "audio-studio",
    slug: "audio-studio",
    name: "Audio Studio",
    tagline: "Multi-track audio mixing studio",
    description: "Upload, layer, and mix multi-track audio projects in the browser.",
    longDescription:
      "A browser-based audio production suite for podcasters, musicians, and content creators. Upload tracks, arrange layers, adjust levels, and export a polished mix — no desktop software required.",
    category: "creative",
    cardVariant: "green",
    icon: "Music",
    appUrl: "/apps/audio-mixer",
    mcpServerUrl: getAppMcpUrl("audio-studio"),
    isFeatured: false,
    isFirstParty: true,
    toolCount: 13,
    tags: ["audio", "mixing", "multi-track"],
    color: "green",
    mcpTools: [
      {
        name: "audio_create_project",
        category: "audio",
        description: "Create a new multi-track audio project",
      },
      {
        name: "audio_list_projects",
        category: "audio",
        description: "List all your audio projects",
      },
      {
        name: "audio_delete_project",
        category: "audio",
        description: "Delete an audio project and all its tracks",
      },
      {
        name: "audio_upload",
        category: "audio",
        description: "Upload an audio file to your workspace",
      },
      {
        name: "audio_list_tracks",
        category: "audio",
        description: "List all uploaded audio tracks",
      },
      {
        name: "audio_get_track",
        category: "audio",
        description: "Get details for a specific audio track",
      },
      {
        name: "audio_update_track",
        category: "audio",
        description: "Update metadata for an audio track",
      },
      {
        name: "audio_delete_track",
        category: "audio",
        description: "Delete an audio track from a project",
      },
      {
        name: "audio_apply_effect",
        category: "audio-effects",
        description:
          "Apply an audio effect (reverb, delay, eq, compressor, normalize, fade) to a track",
      },
      {
        name: "audio_export_mix",
        category: "audio-effects",
        description: "Export the final mix of a project to wav, mp3, flac, or ogg",
      },
      {
        name: "audio_get_waveform",
        category: "audio-effects",
        description: "Get waveform amplitude data for visualization",
      },
      {
        name: "audio_duplicate_track",
        category: "audio-effects",
        description: "Duplicate an audio track within the same project",
      },
      {
        name: "audio_reorder_tracks",
        category: "audio-effects",
        description: "Reorder tracks in a project by providing the new ordered list",
      },
    ],
    features: [
      {
        title: "Multi-Track Mixing",
        description: "Layer and mix audio tracks with professional controls",
        icon: "Music",
      },
      {
        title: "Track Management",
        description: "Upload and organize audio assets in one place",
        icon: "List",
      },
    ],
  },

  // ─── 2. Page Builder ───────────────────────────────────────────────
  {
    id: "page-builder",
    slug: "page-builder",
    name: "Page Builder",
    tagline: "Visual web page builder",
    description: "Create, publish, and manage web pages without writing code.",
    longDescription:
      "Build landing pages, portfolios, and marketing sites using a visual layout editor. Draft, publish, clone, and iterate — all within spike.land.",
    category: "creative",
    cardVariant: "purple",
    icon: "Layout",
    appUrl: "/apps/page-builder",
    mcpServerUrl: getAppMcpUrl("page-builder"),
    codespaceId: "storePageBuild",
    isCodespaceNative: true,
    isFeatured: false,
    isFirstParty: true,
    toolCount: 11,
    tags: ["page-builder", "visual-editor", "themes"],
    color: "purple",
    mcpTools: [
      {
        name: "pages_create",
        category: "pages",
        description: "Create a new page with a title and layout",
      },
      {
        name: "pages_get",
        category: "pages",
        description: "Retrieve a specific page's details and configuration",
      },
      {
        name: "pages_list",
        category: "pages",
        description: "List all created pages",
      },
      {
        name: "pages_update",
        category: "pages",
        description: "Update an existing page's metadata and layout settings",
      },
      {
        name: "pages_delete",
        category: "pages",
        description: "Delete an existing page",
      },
      {
        name: "pages_publish",
        category: "pages",
        description: "Publish a draft page to make it publicly accessible",
      },
      {
        name: "pages_clone",
        category: "pages",
        description: "Clone an existing page and its configuration",
      },
      {
        name: "pages_list_templates",
        category: "page-templates",
        description: "List available page templates filtered by category",
      },
      {
        name: "pages_apply_template",
        category: "page-templates",
        description: "Apply a template to create a fully configured page",
      },
      {
        name: "pages_get_seo",
        category: "page-templates",
        description: "Get SEO metadata for a page",
      },
      {
        name: "pages_set_seo",
        category: "page-templates",
        description: "Set or update SEO metadata for a page",
      },
    ],
    features: [
      {
        title: "Visual Editor",
        description: "Compose and arrange page layouts visually",
        icon: "Layout",
      },
      {
        title: "Publishing Workflow",
        description: "Draft, review, and publish pages instantly",
        icon: "Send",
      },
      {
        title: "Page Cloning",
        description: "Duplicate top-performing pages for consistent layouts",
        icon: "Copy",
      },
    ],
  },

  // ─── 4. Brand Command ─────────────────────────────────────────────
  {
    id: "brand-command",
    slug: "brand-command",
    name: "Brand Command",
    tagline: "Brand voice control center",
    description:
      "Score content for brand consistency, generate on-brand copy, and track competitors.",
    longDescription:
      "For brand managers and marketing teams. Analyze content tone against your brand guidelines, generate ad copy and taglines that stay on-voice, and monitor competitor campaigns in real time.",
    category: "creative",
    cardVariant: "fuchsia",
    icon: "Megaphone",
    appUrl: "/apps/brand-command",
    mcpServerUrl: getAppMcpUrl("brand-command"),
    isFeatured: false,
    isFirstParty: true,
    toolCount: 10,
    tags: ["branding", "copywriting", "competitor-analysis", "marketing"],
    color: "fuchsia",
    mcpTools: [
      {
        name: "brand_score_content",
        category: "brand-brain",
        description: "Score content for brand voice consistency and tone alignment",
      },
      {
        name: "brand_get_guardrails",
        category: "brand-brain",
        description: "Generate brand guidelines and voice guardrails from existing content",
      },
      {
        name: "brand_check_policy",
        category: "brand-brain",
        description: "Check content against brand policy rules for compliance",
      },
      {
        name: "relay_generate_drafts",
        category: "creative",
        description: "Generate on-brand ad copy, email templates, and taglines",
      },
      {
        name: "scout_list_competitors",
        category: "scout",
        description: "List and analyze competitor brands, campaigns, and market positioning",
      },
      {
        name: "scout_get_insights",
        category: "scout",
        description: "Get audience insights and trending market keywords",
      },
      {
        name: "brand_create_campaign",
        category: "brand-campaigns",
        description: "Create a marketing campaign with platform, budget, and start date",
      },
      {
        name: "brand_list_campaigns",
        category: "brand-campaigns",
        description: "List all marketing campaigns with optional status and platform filters",
      },
      {
        name: "brand_get_campaign_stats",
        category: "brand-campaigns",
        description: "Get performance metrics: impressions, clicks, engagement rate, and reach",
      },
      {
        name: "brand_generate_variants",
        category: "brand-campaigns",
        description: "Generate A/B copy variants with headlines and CTAs",
      },
    ],
    features: [
      {
        title: "Brand Voice Scoring",
        description: "Score content for tone consistency and brand alignment",
        icon: "ShieldCheck",
      },
      {
        title: "AI Copywriting",
        description: "Generate on-brand ad copy, taglines, and emails",
        icon: "PenTool",
      },
      {
        title: "Competitor Intelligence",
        description: "Monitor competitor campaigns and market trends live",
        icon: "TrendingUp",
      },
      {
        title: "Market Pulse",
        description: "Track trending keywords and audience insights",
        icon: "Activity",
      },
    ],
  },
];
