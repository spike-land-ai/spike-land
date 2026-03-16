import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Search, Zap, Loader2 } from "lucide-react";
import { useMcpTools } from "../../src/hooks/useMcp";
import { formatIdentifier } from "../../components/tool-surface/formatting";

export function ToolsIndexPage() {
  const { data, isLoading } = useMcpTools();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const tools = data?.tools ?? [];

  const categories = useMemo(() => {
    const cats = new Set<string>();
    for (const t of tools) {
      if (t.category) cats.add(t.category);
    }
    return Array.from(cats).sort();
  }, [tools]);

  const filtered = useMemo(() => {
    let list = tools;
    if (selectedCategory) {
      list = list.filter((t) => t.category === selectedCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.category?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [tools, search, selectedCategory]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const t of filtered) {
      const cat = t.category || "other";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(t);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <div className="rubik-container rubik-page rubik-stack">
      <section className="rubik-panel-strong flex flex-col gap-6 p-6 sm:p-8">
        <div className="max-w-3xl space-y-4">
          <span className="rubik-eyebrow">Tool Playground</span>
          <div className="space-y-3">
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
              {tools.length}+ MCP tools. Try them live.
            </h1>
            <p className="rubik-lede">
              No signup. No API key. Pick a tool, fill the form, hit execute.
              Every tool runs on Cloudflare Workers edge.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search tools..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`rubik-chip px-2.5 py-1 text-[11px] cursor-pointer transition-colors ${
                !selectedCategory ? "bg-primary/10 text-primary" : "hover:bg-muted"
              }`}
            >
              All ({tools.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                className={`rubik-chip px-2.5 py-1 text-[11px] cursor-pointer transition-colors ${
                  cat === selectedCategory ? "bg-primary/10 text-primary" : "hover:bg-muted"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading tools from MCP registry...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rubik-panel p-8 text-center text-muted-foreground">
          <p className="text-sm">No tools match your search.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(([category, categoryTools]) => (
            <section key={category}>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
                {category} ({categoryTools.length})
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {categoryTools.map((tool) => (
                  <Link
                    key={tool.name}
                    to="/tool/$toolName"
                    params={{ toolName: tool.name }}
                    className="rubik-panel flex flex-col gap-2 p-4 text-left transition-all hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Zap className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-semibold text-sm text-foreground tracking-tight truncate">
                        {formatIdentifier(tool.name)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {tool.description}
                    </p>
                    <div className="flex items-center gap-2 mt-auto pt-1">
                      <span className="rubik-chip px-2 py-0.5 text-[10px]">{tool.category}</span>
                      <span className="text-[10px] text-primary font-semibold ml-auto">
                        Try it &rarr;
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
