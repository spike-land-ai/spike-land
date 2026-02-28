"use client";

import { useCallback, useMemo, useState } from "react";
import {
  MCP_SUPER_CATEGORIES,
  MCP_TOOLS,
  type McpSubcategory,
  type McpSuperCategory,
  type McpToolDef,
  searchToolsSemantic,
} from "@/components/mcp/mcp-tool-registry";
import { useFavorites, useRecentTools } from "@/components/mcp/useMcpHistory";

export interface ToolExecutionResult {
  response: unknown;
  error: string | null;
  isExecuting: boolean;
  toolName: string | null;
}

export interface McpExplorerState {
  search: string;
  selectedSuperCategory: string | null;
  selectedSubcategory: string | null;
  selectedCategory: string | null;
  activeTool: McpToolDef | null;
  executionResult: ToolExecutionResult;
  viewMode: "grid" | "list";
}

const INITIAL_EXECUTION: ToolExecutionResult = {
  response: null,
  error: null,
  isExecuting: false,
  toolName: null,
};

const toolMap = new Map(MCP_TOOLS.map(t => [t.name, t]));

export function useMcpExplorer() {
  const [state, setState] = useState<McpExplorerState>({
    search: "",
    selectedSuperCategory: null,
    selectedSubcategory: null,
    selectedCategory: null,
    activeTool: null,
    executionResult: INITIAL_EXECUTION,
    viewMode: "grid",
  });

  const { recent } = useRecentTools();
  const { isFavorite, toggleFavorite, favorites } = useFavorites();

  // ── Derived data ─────────────────────────────────────────────────

  const recentTools = useMemo(
    () =>
      recent
        .map(name => toolMap.get(name))
        .filter((t): t is McpToolDef => t !== undefined)
        .slice(0, 6),
    [recent],
  );

  const favoriteTools = useMemo(
    () =>
      favorites
        .map(name => toolMap.get(name))
        .filter((t): t is McpToolDef => t !== undefined),
    [favorites],
  );

  const filteredTools = useMemo(() => {
    if (state.search.trim()) {
      return searchToolsSemantic(state.search, 50).map(r => r.tool);
    }

    let tools = MCP_TOOLS;

    if (state.selectedCategory) {
      tools = tools.filter(t => t.category === state.selectedCategory);
    } else if (state.selectedSubcategory) {
      const supCat = MCP_SUPER_CATEGORIES.find(s =>
        s.subcategories.some(sub => sub.id === state.selectedSubcategory)
      );
      const sub = supCat?.subcategories.find(
        s => s.id === state.selectedSubcategory,
      );
      if (sub) {
        const categoryIds = new Set(sub.categoryIds);
        tools = tools.filter(t => categoryIds.has(t.category));
      }
    } else if (state.selectedSuperCategory) {
      const supCat = MCP_SUPER_CATEGORIES.find(
        s => s.id === state.selectedSuperCategory,
      );
      if (supCat) {
        const categoryIds = new Set(
          supCat.subcategories.flatMap(sub => sub.categoryIds),
        );
        tools = tools.filter(t => categoryIds.has(t.category));
      }
    }

    return tools;
  }, [
    state.search,
    state.selectedCategory,
    state.selectedSubcategory,
    state.selectedSuperCategory,
  ]);

  // Resolved super category from current selection
  const activeSuperCategory = useMemo((): McpSuperCategory | null => {
    if (!state.selectedSuperCategory) return null;
    return (
      MCP_SUPER_CATEGORIES.find(s => s.id === state.selectedSuperCategory)
        ?? null
    );
  }, [state.selectedSuperCategory]);

  // Resolved subcategory from current selection
  const activeSubcategory = useMemo((): McpSubcategory | null => {
    if (!state.selectedSubcategory || !activeSuperCategory) return null;
    return (
      activeSuperCategory.subcategories.find(
        s => s.id === state.selectedSubcategory,
      ) ?? null
    );
  }, [state.selectedSubcategory, activeSuperCategory]);

  // ── Actions ──────────────────────────────────────────────────────

  const setSearch = useCallback((search: string) => {
    setState(prev => ({
      ...prev,
      search,
      selectedSuperCategory: null,
      selectedSubcategory: null,
      selectedCategory: null,
    }));
  }, []);

  const selectSuperCategory = useCallback((id: string | null) => {
    setState(prev => ({
      ...prev,
      selectedSuperCategory: id,
      selectedSubcategory: null,
      selectedCategory: null,
      search: "",
    }));
  }, []);

  const selectSubcategory = useCallback((id: string | null) => {
    setState(prev => ({
      ...prev,
      selectedSubcategory: id,
      selectedCategory: null,
      search: "",
    }));
  }, []);

  const selectCategory = useCallback((id: string | null) => {
    setState(prev => ({
      ...prev,
      selectedCategory: id,
      search: "",
    }));
  }, []);

  const openTool = useCallback((tool: McpToolDef) => {
    setState(prev => ({
      ...prev,
      activeTool: tool,
      executionResult: INITIAL_EXECUTION,
    }));
  }, []);

  const closeTool = useCallback(() => {
    setState(prev => ({
      ...prev,
      activeTool: null,
      executionResult: INITIAL_EXECUTION,
    }));
  }, []);

  const setViewMode = useCallback((viewMode: "grid" | "list") => {
    setState(prev => ({ ...prev, viewMode }));
  }, []);

  const setExecutionResult = useCallback((result: ToolExecutionResult) => {
    setState(prev => ({ ...prev, executionResult: result }));
  }, []);

  const clearFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      search: "",
      selectedSuperCategory: null,
      selectedSubcategory: null,
      selectedCategory: null,
    }));
  }, []);

  return {
    // State
    ...state,
    // Derived
    recentTools,
    favoriteTools,
    filteredTools,
    activeSuperCategory,
    activeSubcategory,
    superCategories: MCP_SUPER_CATEGORIES,
    totalToolCount: MCP_TOOLS.length,
    // Favorites
    isFavorite,
    toggleFavorite,
    // Actions
    setSearch,
    selectSuperCategory,
    selectSubcategory,
    selectCategory,
    openTool,
    closeTool,
    setViewMode,
    setExecutionResult,
    clearFilters,
  } as const;
}
