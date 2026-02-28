"use client";

import { useCallback, useState } from "react";
import type React from "react";
import {
  BookOpen,
  ChevronLeft,
  Cpu,
  FileCode2,
  GitFork,
  LayoutPanelLeft,
  X,
} from "lucide-react";
import { ICON_MAP } from "@/components/mcp/mcp-icon-map";
import { MCP_CATEGORIES } from "@/components/mcp/mcp-tool-registry";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoryTree } from "./CategoryTree";
import { ToolBrowser } from "./ToolBrowser";
import { ToolExecutor } from "./ToolExecutor";
import { SchemaViewer } from "./SchemaViewer";
import { SetupGuide } from "./SetupGuide";
import { useMcpExplorer } from "../hooks/useMcpExplorer";

const categoryMap = new Map(MCP_CATEGORIES.map(c => [c.id, c]));

type RightPanelTab = "execute" | "schema" | "setup";

export function McpPlaygroundClient() {
  const explorer = useMcpExplorer();
  const [rightTab, setRightTab] = useState<RightPanelTab>("execute");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const hasActiveFilters = !!explorer.selectedSuperCategory
    || !!explorer.selectedSubcategory
    || !!explorer.selectedCategory;

  const handleSelectTool = useCallback(
    (tool: (typeof explorer.filteredTools)[0]) => {
      explorer.openTool(tool);
      // Auto-switch to execute tab on tool select
      setRightTab("execute");
    },
    [explorer],
  );

  const handleTryIt = useCallback(
    (tool: (typeof explorer.filteredTools)[0]) => {
      explorer.openTool(tool);
      setRightTab("execute");
    },
    [explorer],
  );

  const activeCat = explorer.activeTool
    ? categoryMap.get(explorer.activeTool.category)
    : null;

  const ActiveToolIcon = (
    activeCat?.icon ? ICON_MAP[activeCat.icon] : null
  ) as React.ComponentType<{ className?: string; }> | null;

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-zinc-950 overflow-hidden">
      {/* Left sidebar: Category Tree */}
      {sidebarOpen && (
        <aside className="w-60 shrink-0 border-r border-white/[0.06] flex flex-col bg-zinc-950/80 backdrop-blur-sm">
          <div className="flex items-center justify-between px-3 py-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <GitFork className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-semibold text-white">
                MCP Explorer
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
              className="p-1 rounded-lg text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            <CategoryTree
              superCategories={explorer.superCategories}
              selectedSuperCategory={explorer.selectedSuperCategory}
              selectedSubcategory={explorer.selectedSubcategory}
              selectedCategory={explorer.selectedCategory}
              onSelectSuperCategory={explorer.selectSuperCategory}
              onSelectSubcategory={explorer.selectSubcategory}
              onSelectCategory={explorer.selectCategory}
            />
          </div>
        </aside>
      )}

      {/* Center: Tool Browser */}
      <div className="flex-1 min-w-0 flex flex-col border-r border-white/[0.06]">
        {!sidebarOpen && (
          <div className="px-3 py-2 border-b border-white/[0.06]">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              aria-label="Open sidebar"
            >
              <LayoutPanelLeft className="w-3.5 h-3.5" />
              Categories
            </button>
          </div>
        )}

        <div className="flex-1 overflow-hidden">
          <ToolBrowser
            tools={explorer.filteredTools}
            search={explorer.search}
            viewMode={explorer.viewMode}
            onSearch={explorer.setSearch}
            onViewMode={explorer.setViewMode}
            onSelectTool={handleSelectTool}
            onTryIt={handleTryIt}
            isFavorite={explorer.isFavorite}
            onToggleFavorite={explorer.toggleFavorite}
            activeTool={explorer.activeTool}
            recentTools={explorer.recentTools}
            favoriteTools={explorer.favoriteTools}
            onClearFilters={explorer.clearFilters}
            hasActiveFilters={hasActiveFilters}
          />
        </div>
      </div>

      {/* Right panel: Tool detail / Execute / Schema / Setup */}
      <aside className="w-[480px] shrink-0 flex flex-col bg-zinc-950/80">
        {explorer.activeTool
          ? (
            <>
              {/* Tool header */}
              <div className="flex items-start gap-3 px-4 py-3 border-b border-white/[0.06] shrink-0">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center shrink-0">
                  {ActiveToolIcon
                    ? <ActiveToolIcon className="w-4 h-4 text-cyan-400" />
                    : (
                      <span className="text-cyan-400 text-[10px] font-bold">
                        {explorer.activeTool.displayName[0]}
                      </span>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono text-white font-semibold leading-tight truncate">
                    {explorer.activeTool.name}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {explorer.activeTool.displayName}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {activeCat && (
                      <Badge
                        variant="secondary"
                        className="text-[9px] px-1.5 py-0"
                      >
                        {activeCat.name}
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className={`text-[9px] px-1.5 py-0 ${
                        explorer.activeTool.tier === "free"
                          ? "text-green-400 border-green-400/30"
                          : "text-amber-400 border-amber-400/30"
                      }`}
                    >
                      {explorer.activeTool.tier === "free" ? "Free" : "Pro"}
                    </Badge>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={explorer.closeTool}
                  aria-label="Close tool"
                  className="p-1 rounded-lg text-zinc-600 hover:text-zinc-400 transition-colors shrink-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              {/* Tool description */}
              {explorer.activeTool.description && (
                <p className="px-4 pt-2 pb-0 text-xs text-zinc-400 leading-relaxed shrink-0">
                  {explorer.activeTool.description}
                </p>
              )}

              {/* Tabs */}
              <Tabs
                value={rightTab}
                onValueChange={v => setRightTab(v as RightPanelTab)}
                className="flex flex-col flex-1 min-h-0"
              >
                <TabsList className="bg-transparent border-b border-white/[0.06] rounded-none px-4 justify-start h-9 shrink-0 gap-1">
                  <TabsTrigger
                    value="execute"
                    className="text-xs h-7 px-3 data-[state=active]:bg-white/[0.06] rounded-lg gap-1.5"
                  >
                    <Cpu className="w-3 h-3" />
                    Execute
                  </TabsTrigger>
                  <TabsTrigger
                    value="schema"
                    className="text-xs h-7 px-3 data-[state=active]:bg-white/[0.06] rounded-lg gap-1.5"
                  >
                    <FileCode2 className="w-3 h-3" />
                    Schema
                  </TabsTrigger>
                </TabsList>

                <TabsContent
                  value="execute"
                  className="flex-1 min-h-0 mt-0 data-[state=active]:flex data-[state=active]:flex-col"
                >
                  <ToolExecutor
                    tool={explorer.activeTool}
                    result={explorer.executionResult}
                    onExecute={explorer.setExecutionResult}
                    onClose={explorer.closeTool}
                  />
                </TabsContent>

                <TabsContent
                  value="schema"
                  className="flex-1 min-h-0 mt-0 data-[state=active]:flex data-[state=active]:flex-col"
                >
                  <SchemaViewer tool={explorer.activeTool} />
                </TabsContent>
              </Tabs>
            </>
          )
          : (
            /* No tool selected: show Setup Guide */
            <Tabs
              value={rightTab === "setup" ? "setup" : "setup"}
              className="flex flex-col h-full"
            >
              <div className="px-4 py-3 border-b border-white/[0.06] shrink-0">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-semibold text-white">
                    Setup & Docs
                  </span>
                  <Badge
                    variant="secondary"
                    className="text-[9px] px-1.5 py-0 ml-auto text-zinc-500"
                  >
                    Select a tool to start
                  </Badge>
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <SetupGuide />
              </div>
            </Tabs>
          )}
      </aside>
    </div>
  );
}
