import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { cn } from "@spike-land-ai/shared";
import { getPersonaSlug, getContentVariant } from "../core-logic/persona-content-variants";
import { apiUrl } from "../core-logic/api";

interface Tool {
  name: string;
  description: string;
  category: string;
}

const TOOL_CATEGORY_MAP: Record<string, string> = {
  "state-machine": "core",
  chess: "core",
  crdt: "core",
  netsim: "core",
  bft: "core",
  causality: "core",
  "mcp-registry": "mcp-tools",
  "gateway-meta": "mcp-tools",
  codegen: "frontend",
  apps: "frontend",
  store: "frontend",
  "ai-gateway": "edge-api",
  auth: "edge-api",
  storage: "edge-api",
  chat: "edge-api",
  esbuild: "utilities",
  diff: "utilities",
  "configuration-tools": "utilities",
  session: "cli",
  orchestrator: "cli",
  tts: "media",
  "image-studio": "media",
  reactions: "media",
  quiz: "learn",
  learnit: "learn",
  "skill-store": "learn",
  blog: "learn",
};

const CATEGORY_META: Record<string, { label: string; colorClass: string; dotClass: string }> = {
  core: {
    label: "Core",
    colorClass: "bg-slate-500/10 border-slate-500/20 text-slate-400",
    dotClass: "bg-slate-500",
  },
  "mcp-tools": {
    label: "MCP Tools",
    colorClass: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    dotClass: "bg-blue-500",
  },
  frontend: {
    label: "Frontend",
    colorClass: "bg-violet-500/10 border-violet-500/20 text-violet-400",
    dotClass: "bg-violet-500",
  },
  "edge-api": {
    label: "Edge API",
    colorClass: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    dotClass: "bg-amber-500",
  },
  utilities: {
    label: "Utilities",
    colorClass: "bg-teal-500/10 border-teal-500/20 text-teal-400",
    dotClass: "bg-teal-500",
  },
  cli: {
    label: "CLI",
    colorClass: "bg-green-500/10 border-green-500/20 text-green-400",
    dotClass: "bg-green-500",
  },
  media: {
    label: "Media",
    colorClass: "bg-rose-500/10 border-rose-500/20 text-rose-400",
    dotClass: "bg-rose-500",
  },
  learn: {
    label: "Learn",
    colorClass: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
    dotClass: "bg-indigo-500",
  },
};

const CATEGORY_ORDER = [
  "core",
  "mcp-tools",
  "frontend",
  "edge-api",
  "utilities",
  "cli",
  "media",
  "learn",
];

function groupToolsByCategory(tools: Tool[]): Record<string, Tool[]> {
  const groups: Record<string, Tool[]> = {};
  for (const tool of tools) {
    const category = TOOL_CATEGORY_MAP[tool.category] ?? tool.category;
    if (!groups[category]) groups[category] = [];
    groups[category].push(tool);
  }
  return groups;
}

function SkeletonCard() {
  return (
    <div className="rounded-[2rem] border border-border/50 bg-card p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="size-3 rounded-full bg-muted" />
          <div className="h-5 w-24 bg-muted rounded-lg" />
        </div>
        <div className="h-5 w-8 bg-muted rounded-full" />
      </div>
    </div>
  );
}

interface CategoryCardProps {
  category: string;
  tools: Tool[];
  defaultExpanded: boolean;
}

function CategoryCard({ category, tools, defaultExpanded }: CategoryCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const meta = CATEGORY_META[category];

  if (!meta) return null;

  return (
    <div
      className={cn(
        "rounded-[2rem] border bg-card shadow-sm transition-all duration-200",
        meta.colorClass,
      )}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between p-6 text-left"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3">
          <span className={cn("size-3 rounded-full shrink-0", meta.dotClass)} />
          <span className="text-base font-black tracking-tight">{meta.label}</span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-background/60 border border-current/20">
            {tools.length}
          </span>
        </div>
        {expanded ? (
          <ChevronUp size={18} className="opacity-60 shrink-0" />
        ) : (
          <ChevronDown size={18} className="opacity-60 shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-6 pb-6 space-y-3 border-t border-current/10 pt-4">
          {tools.map((tool) => (
            <div key={tool.name} className="flex items-start justify-between gap-4 group">
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{tool.name}</p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5 line-clamp-2">
                  {tool.description}
                </p>
              </div>
              <a
                href="/tools"
                className="shrink-0 flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.24em] opacity-60 hover:opacity-100 transition-opacity mt-0.5"
                aria-label={`Try ${tool.name}`}
              >
                Try it
                <ExternalLink size={10} />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ToolsByCategoryGrid() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

  const personaSlug = getPersonaSlug();
  const variant = getContentVariant(personaSlug);
  const expandedCategories = new Set(variant.expandedCategories);

  useEffect(() => {
    fetch(apiUrl("/tools"))
      .then((r): Promise<Tool[]> => (r.ok ? (r.json() as Promise<Tool[]>) : Promise.resolve([])))
      .then((data) => setTools(Array.isArray(data) ? data : []))
      .catch(() => setTools([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  const grouped = groupToolsByCategory(tools);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {CATEGORY_ORDER.map((category) => {
        const categoryTools = grouped[category] ?? [];
        if (categoryTools.length === 0) return null;
        return (
          <CategoryCard
            key={category}
            category={category}
            tools={categoryTools}
            defaultExpanded={expandedCategories.has(category)}
          />
        );
      })}
    </div>
  );
}
