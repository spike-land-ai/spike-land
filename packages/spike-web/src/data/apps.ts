export interface AppCatalogEntry {
  id: string;
  name: string;
  description: string;
  accent: string;
  accentBg: string;
  iconPath: string;
  status: "Live" | "Beta";
  category: string;
}

export const appCatalog: AppCatalogEntry[] = [
  {
    id: "codespace",
    name: "CodeSpace",
    description:
      "Instant browser-based dev environments pre-configured for AI orchestration and TypeScript strict mode.",
    accent: "#2563eb",
    accentBg: "rgba(37,99,235,0.1)",
    iconPath: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4",
    status: "Live",
    category: "Environment",
  },
  {
    id: "spike-chat",
    name: "Spike Chat",
    description:
      "AI chat assistant with Bayesian memory, a four-stage execution pipeline, and MCP-native tool use.",
    accent: "#0f766e",
    accentBg: "rgba(15,118,110,0.1)",
    iconPath: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
    status: "Live",
    category: "AI & Chat",
  },
  {
    id: "qa-studio",
    name: "QA Studio",
    description:
      "Automate testing with a 16-persona BAZDMEG agent team navigating your app around the clock.",
    accent: "#16a34a",
    accentBg: "rgba(22,163,74,0.1)",
    iconPath: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    status: "Live",
    category: "Testing",
  },
  {
    id: "ops-dash",
    name: "Ops Dashboard",
    description:
      "Real-time telemetry, agent metrics, and pipeline status in one unified command center.",
    accent: "#9333ea",
    accentBg: "rgba(147,51,234,0.1)",
    iconPath: "M13 10V3L4 14h7v7l9-11h-7z",
    status: "Live",
    category: "Ops",
  },
  {
    id: "app-creator",
    name: "App Creator",
    description:
      "Visually compose agent workflows and deploy full-stack apps without managing infrastructure.",
    accent: "#ea580c",
    accentBg: "rgba(234,88,12,0.1)",
    iconPath:
      "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z",
    status: "Beta",
    category: "Builder",
  },
];

export function getAppById(appId: string | undefined): AppCatalogEntry | undefined {
  return appCatalog.find((app) => app.id === appId);
}
