"use client";

import type React from "react";
import { useCallback } from "react";
import { ChevronRight, X } from "lucide-react";
import { ICON_MAP } from "@/components/mcp/mcp-icon-map";
import type {
  McpSubcategory,
  McpSuperCategory,
} from "@/components/mcp/mcp-tool-registry";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CategoryTreeProps {
  superCategories: McpSuperCategory[];
  selectedSuperCategory: string | null;
  selectedSubcategory: string | null;
  selectedCategory: string | null;
  onSelectSuperCategory: (id: string | null) => void;
  onSelectSubcategory: (id: string | null) => void;
  onSelectCategory: (id: string | null) => void;
}

const COLOR_CLASSES: Record<
  string,
  { icon: string; bg: string; border: string; }
> = {
  blue: {
    icon: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
  },
  green: {
    icon: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/30",
  },
  orange: {
    icon: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
  },
  fuchsia: {
    icon: "text-fuchsia-400",
    bg: "bg-fuchsia-500/10",
    border: "border-fuchsia-500/30",
  },
  purple: {
    icon: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
  },
  pink: {
    icon: "text-pink-400",
    bg: "bg-pink-500/10",
    border: "border-pink-500/30",
  },
  layers: {
    icon: "text-zinc-400",
    bg: "bg-zinc-500/10",
    border: "border-zinc-500/30",
  },
};

function getFallbackColors() {
  return {
    icon: "text-zinc-400",
    bg: "bg-zinc-500/10",
    border: "border-zinc-500/30",
  };
}

interface SuperCategoryItemProps {
  sup: McpSuperCategory;
  isSelected: boolean;
  selectedSubcategory: string | null;
  selectedCategory: string | null;
  onSelect: (id: string | null) => void;
  onSelectSubcategory: (id: string | null) => void;
  onSelectCategory: (id: string | null) => void;
}

function SuperCategoryItem({
  sup,
  isSelected,
  selectedSubcategory,
  selectedCategory,
  onSelect,
  onSelectSubcategory,
  onSelectCategory,
}: SuperCategoryItemProps) {
  const colors = COLOR_CLASSES[sup.color] ?? getFallbackColors();
  const Icon = ICON_MAP[sup.icon] as
    | React.ComponentType<{ className?: string; }>
    | undefined;

  const handleClick = useCallback(() => {
    onSelect(isSelected ? null : sup.id);
  }, [isSelected, sup.id, onSelect]);

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all duration-150 group ${
          isSelected
            ? `${colors.bg} border ${colors.border}`
            : "hover:bg-white/[0.04] border border-transparent"
        }`}
        aria-expanded={isSelected}
      >
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${colors.bg}`}
        >
          {Icon && <Icon className={`w-4 h-4 ${colors.icon}`} />}
        </div>

        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-white block truncate">
            {sup.name}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Badge
            variant="secondary"
            className="text-[9px] px-1.5 py-0 h-4 font-mono"
          >
            {sup.toolCount}
          </Badge>
          <ChevronRight
            className={`w-3.5 h-3.5 text-zinc-600 transition-transform duration-150 ${
              isSelected ? "rotate-90" : "group-hover:translate-x-0.5"
            }`}
          />
        </div>
      </button>

      {isSelected && (
        <div className="ml-3 mt-1 pl-3 border-l border-white/[0.06] space-y-1">
          {sup.subcategories.map(sub => (
            <SubcategoryItem
              key={sub.id}
              sub={sub}
              isSelected={selectedSubcategory === sub.id}
              selectedCategory={selectedCategory}
              onSelectSubcategory={onSelectSubcategory}
              onSelectCategory={onSelectCategory}
              colors={colors}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface SubcategoryItemProps {
  sub: McpSubcategory;
  isSelected: boolean;
  selectedCategory: string | null;
  onSelectSubcategory: (id: string | null) => void;
  onSelectCategory: (id: string | null) => void;
  colors: { icon: string; bg: string; border: string; };
}

function SubcategoryItem({
  sub,
  isSelected,
  selectedCategory,
  onSelectSubcategory,
  onSelectCategory,
  colors,
}: SubcategoryItemProps) {
  const SubIcon = ICON_MAP[sub.icon] as
    | React.ComponentType<{ className?: string; }>
    | undefined;

  const handleClick = useCallback(() => {
    onSelectSubcategory(isSelected ? null : sub.id);
  }, [isSelected, sub.id, onSelectSubcategory]);

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all duration-150 ${
          isSelected
            ? `${colors.bg} border ${colors.border}`
            : "hover:bg-white/[0.03] border border-transparent"
        }`}
        aria-expanded={isSelected}
      >
        {SubIcon && <SubIcon className={`w-3.5 h-3.5 ${colors.icon} shrink-0`} />}
        <span className="text-xs text-zinc-300 truncate flex-1">
          {sub.name}
        </span>
        <span className="text-[10px] text-zinc-600 font-mono shrink-0">
          {sub.toolCount}
        </span>
        <ChevronRight
          className={`w-3 h-3 text-zinc-700 transition-transform duration-150 ${
            isSelected ? "rotate-90" : ""
          }`}
        />
      </button>

      {isSelected && sub.categories.length > 1 && (
        <div className="ml-2 mt-1 pl-2 border-l border-white/[0.04] space-y-0.5">
          {sub.categories.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() =>
                onSelectCategory(
                  selectedCategory === cat.id ? null : cat.id,
                )}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all duration-150 ${
                selectedCategory === cat.id
                  ? `${colors.bg} border ${colors.border}`
                  : "hover:bg-white/[0.03] border border-transparent"
              }`}
            >
              <span className="text-[11px] text-zinc-400 truncate flex-1">
                {cat.name}
              </span>
              <span className="text-[10px] text-zinc-600 font-mono shrink-0">
                {cat.toolCount}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function CategoryTree({
  superCategories,
  selectedSuperCategory,
  selectedSubcategory,
  selectedCategory,
  onSelectSuperCategory,
  onSelectSubcategory,
  onSelectCategory,
}: CategoryTreeProps) {
  const hasSelection = selectedSuperCategory || selectedSubcategory
    || selectedCategory;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-3 border-b border-white/[0.06]">
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          Categories
        </h3>
        {hasSelection && (
          <button
            type="button"
            onClick={() => {
              onSelectSuperCategory(null);
              onSelectSubcategory(null);
              onSelectCategory(null);
            }}
            className="flex items-center gap-1 text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
            aria-label="Clear category filter"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {superCategories.map(sup => (
            <SuperCategoryItem
              key={sup.id}
              sup={sup}
              isSelected={selectedSuperCategory === sup.id}
              selectedSubcategory={selectedSubcategory}
              selectedCategory={selectedCategory}
              onSelect={onSelectSuperCategory}
              onSelectSubcategory={onSelectSubcategory}
              onSelectCategory={onSelectCategory}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
