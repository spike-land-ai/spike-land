"use client";

import type React from "react";
import { useCallback, useMemo } from "react";
import {
  ArrowRight,
  Clock,
  Grid3x3,
  LayoutList,
  Search,
  SlidersHorizontal,
  Star,
  X,
} from "lucide-react";
import { ICON_MAP } from "@/components/mcp/mcp-icon-map";
import type { McpToolDef } from "@/components/mcp/mcp-tool-registry";
import { MCP_CATEGORIES } from "@/components/mcp/mcp-tool-registry";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ToolBrowserProps {
  tools: McpToolDef[];
  search: string;
  viewMode: "grid" | "list";
  onSearch: (q: string) => void;
  onViewMode: (mode: "grid" | "list") => void;
  onSelectTool: (tool: McpToolDef) => void;
  onTryIt: (tool: McpToolDef) => void;
  isFavorite: (name: string) => boolean;
  onToggleFavorite: (name: string) => void;
  activeTool: McpToolDef | null;
  recentTools: McpToolDef[];
  favoriteTools: McpToolDef[];
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

const categoryMap = new Map(MCP_CATEGORIES.map(c => [c.id, c]));

interface ToolCardProps {
  tool: McpToolDef;
  isActive: boolean;
  isFavorite: boolean;
  onSelect: (tool: McpToolDef) => void;
  onTryIt: (tool: McpToolDef) => void;
  onToggleFavorite: (name: string) => void;
  viewMode: "grid" | "list";
}

function ToolCard({
  tool,
  isActive,
  isFavorite,
  onSelect,
  onTryIt,
  onToggleFavorite,
  viewMode,
}: ToolCardProps) {
  const cat = categoryMap.get(tool.category);
  const Icon = (cat?.icon ? ICON_MAP[cat.icon] : null) as
    | React.ComponentType<{ className?: string; }>
    | null;

  const handleToggleFavorite = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleFavorite(tool.name);
    },
    [tool.name, onToggleFavorite],
  );

  const handleTryIt = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onTryIt(tool);
    },
    [tool, onTryIt],
  );

  if (viewMode === "list") {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelect(tool)}
        onKeyDown={e => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect(tool);
          }
        }}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-150 border-b border-white/[0.04] last:border-0 cursor-pointer ${
          isActive
            ? "bg-cyan-500/[0.06] border-l-2 border-l-cyan-500"
            : "hover:bg-white/[0.03]"
        }`}
      >
        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center shrink-0">
          {Icon
            ? <Icon className="w-4 h-4 text-cyan-400" />
            : (
              <span className="text-cyan-400 text-[10px] font-bold">
                {tool.displayName[0]}
              </span>
            )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-mono text-white font-semibold truncate">
            {tool.name}
          </p>
          <p className="text-[11px] text-zinc-500 truncate">
            {tool.description}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge
            variant={tool.tier === "free" ? "outline" : "secondary"}
            className={`text-[9px] px-1.5 py-0 ${
              tool.tier === "free"
                ? "text-green-400 border-green-400/30"
                : "text-amber-400 border-amber-400/30"
            }`}
          >
            {tool.tier === "free" ? "Free" : "Pro"}
          </Badge>
          <button
            type="button"
            onClick={handleToggleFavorite}
            aria-label={isFavorite
              ? `Remove ${tool.displayName} from favorites`
              : `Add ${tool.displayName} to favorites`}
            aria-pressed={isFavorite}
            className="p-1 rounded transition-colors hover:bg-white/[0.06]"
          >
            <Star
              className={`w-3.5 h-3.5 ${
                isFavorite
                  ? "fill-amber-400 text-amber-400"
                  : "text-zinc-700 hover:text-zinc-500"
              }`}
            />
          </button>
          <button
            type="button"
            onClick={handleTryIt}
            className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
          >
            Try
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(tool)}
      onKeyDown={e => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(tool);
        }
      }}
      className={`group relative flex flex-col gap-2.5 rounded-2xl border p-4 text-left transition-all duration-200 cursor-pointer ${
        isActive
          ? "bg-cyan-500/[0.08] border-cyan-500/30"
          : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.10]"
      }`}
    >
      {/* Favorite */}
      <button
        type="button"
        onClick={handleToggleFavorite}
        aria-label={isFavorite
          ? `Remove ${tool.displayName} from favorites`
          : `Add ${tool.displayName} to favorites`}
        aria-pressed={isFavorite}
        className="absolute top-3 right-3 p-1 rounded-lg transition-colors hover:bg-white/[0.06]"
      >
        <Star
          className={`w-3.5 h-3.5 transition-colors ${
            isFavorite
              ? "fill-amber-400 text-amber-400"
              : "text-zinc-700 group-hover:text-zinc-500"
          }`}
        />
      </button>

      {/* Icon + name */}
      <div className="flex items-center gap-2.5 pr-8">
        <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center shrink-0">
          {Icon
            ? <Icon className="w-4 h-4 text-cyan-400" />
            : (
              <span className="text-cyan-400 text-[10px] font-bold">
                {tool.displayName[0]}
              </span>
            )}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-mono text-white font-semibold leading-tight truncate">
            {tool.name}
          </p>
          <p className="text-[10px] text-zinc-500 mt-0.5">{tool.displayName}</p>
        </div>
      </div>

      {/* Description */}
      <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2 flex-1">
        {tool.description}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-1.5">
          <Badge
            variant={tool.tier === "free" ? "outline" : "secondary"}
            className={`text-[9px] px-1.5 py-0 ${
              tool.tier === "free"
                ? "text-green-400 border-green-400/30"
                : "text-amber-400 border-amber-400/30"
            }`}
          >
            {tool.tier === "free" ? "Free" : "Pro"}
          </Badge>
          {tool.params.length > 0 && (
            <span className="text-[10px] text-zinc-600">
              {tool.params.length}p
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleTryIt}
          className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
        >
          Try it
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

interface ToolGroupProps {
  label: string;
  icon: React.ReactNode;
  tools: McpToolDef[];
  viewMode: "grid" | "list";
  activeTool: McpToolDef | null;
  isFavorite: (name: string) => boolean;
  onSelect: (tool: McpToolDef) => void;
  onTryIt: (tool: McpToolDef) => void;
  onToggleFavorite: (name: string) => void;
}

function ToolGroup({
  label,
  icon,
  tools,
  viewMode,
  activeTool,
  isFavorite,
  onSelect,
  onTryIt,
  onToggleFavorite,
}: ToolGroupProps) {
  if (tools.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3 px-1">
        {icon}
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          {label}
        </span>
        <span className="text-xs text-zinc-600 font-mono">{tools.length}</span>
      </div>

      {viewMode === "list"
        ? (
          <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
            {tools.map(tool => (
              <ToolCard
                key={tool.name}
                tool={tool}
                isActive={activeTool?.name === tool.name}
                isFavorite={isFavorite(tool.name)}
                onSelect={onSelect}
                onTryIt={onTryIt}
                onToggleFavorite={onToggleFavorite}
                viewMode="list"
              />
            ))}
          </div>
        )
        : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
            {tools.map(tool => (
              <ToolCard
                key={tool.name}
                tool={tool}
                isActive={activeTool?.name === tool.name}
                isFavorite={isFavorite(tool.name)}
                onSelect={onSelect}
                onTryIt={onTryIt}
                onToggleFavorite={onToggleFavorite}
                viewMode="grid"
              />
            ))}
          </div>
        )}
    </div>
  );
}

export function ToolBrowser({
  tools,
  search,
  viewMode,
  onSearch,
  onViewMode,
  onSelectTool,
  onTryIt,
  isFavorite,
  onToggleFavorite,
  activeTool,
  recentTools,
  favoriteTools,
  onClearFilters,
  hasActiveFilters,
}: ToolBrowserProps) {
  // When there's no search/filter, show grouped sections
  const showGrouped = !search && !hasActiveFilters;

  const mainTools = useMemo(() => {
    if (showGrouped) return tools;
    return tools;
  }, [tools, showGrouped]);

  const recentNames = useMemo(
    () => new Set(recentTools.map(t => t.name)),
    [recentTools],
  );
  const favoriteNames = useMemo(
    () => new Set(favoriteTools.map(t => t.name)),
    [favoriteTools],
  );

  const filteredMainTools = useMemo(() => {
    if (!showGrouped) return mainTools;
    return mainTools.filter(
      t => !recentNames.has(t.name) && !favoriteNames.has(t.name),
    );
  }, [mainTools, showGrouped, recentNames, favoriteNames]);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
          <Input
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder="Search tools..."
            className="pl-9 h-8 text-sm bg-white/[0.03] border-white/[0.08] focus:border-cyan-500/50 focus:ring-0"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="flex items-center gap-1.5 h-8 px-3 text-xs text-zinc-400 hover:text-zinc-200 border border-white/[0.08] rounded-lg transition-colors hover:bg-white/[0.03]"
          >
            <SlidersHorizontal className="w-3 h-3" />
            Clear filters
          </button>
        )}

        <div className="flex items-center border border-white/[0.06] rounded-lg overflow-hidden shrink-0">
          <button
            type="button"
            onClick={() => onViewMode("grid")}
            aria-label="Grid view"
            aria-pressed={viewMode === "grid"}
            className={`p-1.5 transition-colors ${
              viewMode === "grid"
                ? "bg-white/[0.08] text-white"
                : "text-zinc-600 hover:text-zinc-400"
            }`}
          >
            <Grid3x3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onViewMode("list")}
            aria-label="List view"
            aria-pressed={viewMode === "list"}
            className={`p-1.5 transition-colors ${
              viewMode === "list"
                ? "bg-white/[0.08] text-white"
                : "text-zinc-600 hover:text-zinc-400"
            }`}
          >
            <LayoutList className="w-3.5 h-3.5" />
          </button>
        </div>

        <span className="text-xs text-zinc-600 font-mono shrink-0">
          {tools.length} tools
        </span>
      </div>

      {/* Tool list */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {tools.length === 0
            ? (
              <div className="flex flex-col items-center justify-center py-16 text-zinc-600 gap-3">
                <Search className="w-10 h-10 opacity-40" />
                <div className="text-center">
                  <p className="text-sm font-medium text-zinc-400">
                    No tools found
                  </p>
                  <p className="text-xs mt-1">
                    Try a different search or clear filters
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClearFilters}
                  className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            )
            : showGrouped
            ? (
              <>
                <ToolGroup
                  label="Favorites"
                  icon={<Star className="w-3.5 h-3.5 text-amber-400" />}
                  tools={favoriteTools}
                  viewMode={viewMode}
                  activeTool={activeTool}
                  isFavorite={isFavorite}
                  onSelect={onSelectTool}
                  onTryIt={onTryIt}
                  onToggleFavorite={onToggleFavorite}
                />
                <ToolGroup
                  label="Recently Used"
                  icon={<Clock className="w-3.5 h-3.5 text-cyan-400" />}
                  tools={recentTools}
                  viewMode={viewMode}
                  activeTool={activeTool}
                  isFavorite={isFavorite}
                  onSelect={onSelectTool}
                  onTryIt={onTryIt}
                  onToggleFavorite={onToggleFavorite}
                />
                <ToolGroup
                  label="All Tools"
                  icon={<Grid3x3 className="w-3.5 h-3.5 text-zinc-400" />}
                  tools={filteredMainTools}
                  viewMode={viewMode}
                  activeTool={activeTool}
                  isFavorite={isFavorite}
                  onSelect={onSelectTool}
                  onTryIt={onTryIt}
                  onToggleFavorite={onToggleFavorite}
                />
              </>
            )
            : (
              <ToolGroup
                label={search ? `Results for "${search}"` : "Filtered Tools"}
                icon={<Search className="w-3.5 h-3.5 text-zinc-400" />}
                tools={mainTools}
                viewMode={viewMode}
                activeTool={activeTool}
                isFavorite={isFavorite}
                onSelect={onSelectTool}
                onTryIt={onTryIt}
                onToggleFavorite={onToggleFavorite}
              />
            )}
        </div>
      </ScrollArea>
    </div>
  );
}
