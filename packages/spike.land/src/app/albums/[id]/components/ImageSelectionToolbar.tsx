"use client";

import { Button } from "@/components/ui/button";
import {
  CheckSquare,
  FolderInput,
  Sparkles,
  Square,
  Trash2,
  X,
} from "lucide-react";
import { memo } from "react";

export interface ImageSelectionToolbarProps {
  isSelectionMode: boolean;
  selectedCount: number;
  totalCount: number;
  onToggleSelectAll: () => void;
  onMove: () => void;
  onRemove: () => void;
  onCancel: () => void;
  onEnterSelectionMode: () => void;
  onEnhanceSelected?: () => void;
}

/**
 * Toolbar for image selection mode with select all, move, remove, enhance, and cancel actions
 */
export const ImageSelectionToolbar = memo(function ImageSelectionToolbar({
  isSelectionMode,
  selectedCount,
  totalCount,
  onToggleSelectAll,
  onMove,
  onRemove,
  onCancel,
  onEnterSelectionMode,
  onEnhanceSelected,
}: ImageSelectionToolbarProps) {
  if (!isSelectionMode) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onEnterSelectionMode}
        data-testid="enter-selection-mode-button"
      >
        <CheckSquare className="mr-2 h-4 w-4" />
        Select
      </Button>
    );
  }

  const allSelected = selectedCount === totalCount;

  return (
    <div className="flex items-center gap-2" data-testid="selection-toolbar">
      {/* Selected count indicator */}
      {selectedCount > 0 && (
        <span
          className="text-sm text-muted-foreground"
          data-testid="selected-count"
        >
          {selectedCount} selected
        </span>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={onToggleSelectAll}
        data-testid="toggle-select-all-button"
      >
        {allSelected
          ? (
            <>
              <Square className="mr-2 h-4 w-4" />
              Deselect All
            </>
          )
          : (
            <>
              <CheckSquare className="mr-2 h-4 w-4" />
              Select All
            </>
          )}
      </Button>
      {selectedCount > 0 && (
        <>
          {onEnhanceSelected && (
            <Button
              variant="default"
              size="sm"
              onClick={onEnhanceSelected}
              data-testid="enhance-selected-button"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Enhance Selected
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onMove}
            data-testid="move-selected-button"
          >
            <FolderInput className="mr-2 h-4 w-4" />
            Move ({selectedCount})
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onRemove}
            data-testid="remove-selected-button"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Remove ({selectedCount})
          </Button>
        </>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={onCancel}
        data-testid="cancel-selection-button"
      >
        <X className="mr-2 h-4 w-4" />
        Cancel
      </Button>
    </div>
  );
});
