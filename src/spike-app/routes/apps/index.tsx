import { Link } from "@tanstack/react-router";
import { AppCard } from "@/components/AppCard";
import type { AppStatus } from "@/components/StatusBadge";

interface McpToolEntry {
  id: string;
  name: string;
  description: string;
  status: AppStatus;
  category: "mcp" | "utility" | "game" | "tool" | "social" | "other";
  ownerName: string;
  createdAt: string;
  toolCount: number;
}

const mcpTools: McpToolEntry[] = [
  {
    id: "chess-engine",
    name: "Chess Engine",
    description: "ELO-rated chess with game, player, and challenge management via MCP tools",
    status: "live",
    category: "mcp",
    ownerName: "spike-team",
    createdAt: "2025-12-01T00:00:00Z",
    toolCount: 5,
  },
  {
    id: "qa-studio",
    name: "QA Studio",
    description: "Browser automation and testing utilities powered by Playwright via MCP",
    status: "live",
    category: "mcp",
    ownerName: "spike-team",
    createdAt: "2025-11-15T00:00:00Z",
    toolCount: 10,
  },
  {
    id: "audio-mixer",
    name: "Audio Mixer",
    description: "Audio track creation, effects processing, and mixing via MCP tools",
    status: "drafting",
    category: "mcp",
    ownerName: "community",
    createdAt: "2026-01-10T00:00:00Z",
    toolCount: 4,
  },
];

export function AppsIndexPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">MCP Tools</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Model Context Protocol tools you can use via terminal or API
          </p>
        </div>
        <Link
          to="/apps/new"
          search={{ prompt: "" }}
          className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        >
          Create Tool
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mcpTools.map((tool) => (
          <AppCard
            key={tool.id}
            id={tool.id}
            name={tool.name}
            description={tool.description}
            status={tool.status}
            category={tool.category}
            ownerName={tool.ownerName}
            createdAt={tool.createdAt}
            toolCount={tool.toolCount}
          />
        ))}
      </div>
    </div>
  );
}
