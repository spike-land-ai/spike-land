"use client";

import { useMemo, useState } from "react";
import { LayoutTemplate, Loader2, Search } from "lucide-react";
import { TEMPLATES } from "@/components/state-machine/TemplateLibrary";
import type { TemplateDefinition } from "@/components/state-machine/TemplateLibrary";
import { cn } from "@/lib/utils";

interface TemplateGalleryProps {
  onSelectTemplate: (template: TemplateDefinition) => Promise<void>;
  onClose?: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  Basics: "#6366f1",
  "Web & API": "#3b82f6",
  "E-Commerce": "#8b5cf6",
  "IoT & Hardware": "#10b981",
  Gaming: "#f59e0b",
  "DevOps & CI/CD": "#ef4444",
  Healthcare: "#ec4899",
  Communication: "#14b8a6",
  Workflow: "#f97316",
  Finance: "#eab308",
  Embedded: "#64748b",
};

export function TemplateGallery({
  onSelectTemplate,
  onClose,
}: TemplateGalleryProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [loadingTemplate, setLoadingTemplate] = useState<string | null>(null);

  const categories = useMemo(() => {
    const cats = new Set(TEMPLATES.map(t => t.category as string));
    return ["All", ...Array.from(cats)];
  }, []);

  const filtered = useMemo(() => {
    return TEMPLATES.filter(t => {
      const matchesSearch = !search
        || t.name.toLowerCase().includes(search.toLowerCase())
        || t.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === "All"
        || t.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, selectedCategory]);

  const handleSelect = async (template: TemplateDefinition) => {
    setLoadingTemplate(template.name);
    try {
      await onSelectTemplate(template);
      onClose?.();
    } finally {
      setLoadingTemplate(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800/70 shrink-0 bg-zinc-900/30">
        <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
          <LayoutTemplate className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-zinc-100">
            Template Gallery
          </h3>
          <p className="text-[10px] text-zinc-500">
            {TEMPLATES.length} templates
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3 shrink-0 border-b border-zinc-800/50">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/50 border border-zinc-800">
          <Search className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="flex-1 bg-transparent text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Category pills */}
      <div className="flex gap-1.5 px-4 py-2.5 shrink-0 overflow-x-auto border-b border-zinc-800/50 custom-scrollbar">
        {categories.map(cat => {
          const count = cat === "All"
            ? TEMPLATES.length
            : TEMPLATES.filter(t => t.category === cat).length;
          const color = CATEGORY_COLORS[cat] ?? "#6366f1";
          const isActive = selectedCategory === cat;

          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-all border",
                isActive
                  ? "text-white border-transparent"
                  : "text-zinc-500 hover:text-zinc-300 bg-zinc-900/40 border-zinc-800/60 hover:border-zinc-700/60",
              )}
              style={isActive
                ? { background: `${color}20`, borderColor: `${color}40`, color }
                : undefined}
            >
              {cat}
              <span
                className={cn(
                  "px-1 py-0.5 rounded text-[9px] font-bold",
                  isActive ? "bg-white/10" : "bg-zinc-800 text-zinc-500",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Templates list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
        {filtered.length === 0
          ? (
            <div className="py-10 text-center text-zinc-600 text-sm">
              <Search className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p>No templates match your search</p>
            </div>
          )
          : (
            filtered.map(template => {
              const isLoading = loadingTemplate === template.name;
              const color = CATEGORY_COLORS[template.category as string]
                ?? "#6366f1";

              return (
                <button
                  key={template.name}
                  onClick={() => handleSelect(template)}
                  disabled={loadingTemplate !== null}
                  className={cn(
                    "group w-full text-left flex items-start gap-3 p-3 rounded-xl border transition-all duration-200",
                    "hover:scale-[1.005] active:scale-[0.995]",
                    "disabled:opacity-60 disabled:cursor-not-allowed",
                    "hover:shadow-md",
                  )}
                  style={{
                    background: `${color}06`,
                    borderColor: `${color}18`,
                  }}
                >
                  {/* Icon */}
                  <div
                    className="shrink-0 p-2 rounded-lg border"
                    style={{
                      background: `${color}12`,
                      borderColor: `${color}25`,
                      color,
                    }}
                  >
                    {isLoading
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : (
                        <span className="w-4 h-4 flex items-center justify-center text-base leading-none">
                          {template.icon}
                        </span>
                      )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-zinc-100 group-hover:text-white transition-colors truncate">
                        {template.name}
                      </h4>
                      {isLoading && (
                        <span className="text-[9px] text-zinc-500 uppercase tracking-widest animate-pulse shrink-0">
                          Creating...
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed line-clamp-2">
                      {template.description}
                    </p>
                    <div className="flex gap-2 mt-1.5 text-[9px] text-zinc-600 font-medium">
                      <span>{template.states.length} states</span>
                      <span>·</span>
                      <span>{template.transitions.length} transitions</span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
      </div>
    </div>
  );
}
