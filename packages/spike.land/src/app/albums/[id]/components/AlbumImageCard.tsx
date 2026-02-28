"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { GripVertical, Layers, Loader2, Sparkles, Star } from "lucide-react";
import Image from "next/image";
import { memo, useCallback } from "react";
import type { AlbumImage } from "../hooks/types";

export interface AlbumImageCardProps {
  image: AlbumImage;
  imageUrl: string;
  isCover: boolean;
  isOwner: boolean;
  isSelectionMode: boolean;
  isSelected: boolean;
  isDragged: boolean;
  isDragOver: boolean;
  isBlendDropTarget: boolean;
  isBlending: boolean;
  showEnhancedBadge: boolean;
  draggable: boolean;
  onDragStart: (e: React.DragEvent, image: AlbumImage) => void;
  onDragOver: (e: React.DragEvent, imageId: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, imageId: string) => void;
  onDragEnd: () => void;
  onClick: (imageId: string) => void;
  onToggleSelection: (imageId: string) => void;
}

/**
 * Single image card in the album grid
 */
export const AlbumImageCard = memo(function AlbumImageCard({
  image,
  imageUrl,
  isCover,
  isOwner,
  isSelectionMode,
  isSelected,
  isDragged,
  isDragOver,
  isBlendDropTarget,
  isBlending,
  showEnhancedBadge,
  draggable,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onClick,
  onToggleSelection,
}: AlbumImageCardProps) {
  // Optimization: Internal handlers using useCallback to prevent re-renders
  // when parent passes stable handler references.

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      onDragStart(e, image);
    },
    [onDragStart, image],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      onDragOver(e, image.id);
    },
    [onDragOver, image.id],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      onDrop(e, image.id);
    },
    [onDrop, image.id],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isSelectionMode) {
        e.stopPropagation();
        onToggleSelection(image.id);
      } else {
        onClick(image.id);
      }
    },
    [isSelectionMode, onClick, onToggleSelection, image.id],
  );

  const handleCheckboxClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleSelection(image.id);
    },
    [onToggleSelection, image.id],
  );

  const handleCheckedChange = useCallback(() => {
    onToggleSelection(image.id);
  }, [onToggleSelection, image.id]);

  const className = [
    "overflow-hidden group relative transition-all cursor-pointer",
    isDragged ? "opacity-50" : "",
    isDragOver ? "ring-2 ring-primary" : "",
    isSelected ? "ring-2 ring-primary" : "",
    isBlendDropTarget ? "ring-2 ring-purple-500 scale-105" : "",
    isBlending ? "animate-pulse" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Card
      className={className}
      data-testid="album-image"
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={onDragLeave}
      onDrop={handleDrop}
      onDragEnd={onDragEnd}
      onClick={handleClick}
    >
      <div className="relative aspect-square bg-muted">
        <Image
          src={imageUrl}
          alt={image.name || "Album image"}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />

        {/* Enhanced badge */}
        {showEnhancedBadge && (
          <Badge className="absolute top-2 right-2 bg-green-500">
            <Sparkles className="h-3 w-3 mr-1" />
            Enhanced
          </Badge>
        )}

        {/* Cover badge */}
        {isCover && (
          <Badge className="absolute top-2 left-2 bg-black/60 text-white hover:bg-black/70 border-none backdrop-blur-[2px]">
            <Star className="h-3 w-3 mr-1 fill-current" />
            Cover
          </Badge>
        )}

        {/* Blend drop target overlay */}
        {isBlendDropTarget && (
          <div className="absolute inset-0 bg-purple-500/30 backdrop-blur-sm flex items-center justify-center pointer-events-none z-10">
            <div className="bg-background/95 rounded-lg p-3 text-center shadow-lg border">
              <Layers className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <p className="text-sm font-medium">Drop to Blend</p>
            </div>
          </div>
        )}

        {/* Blending in progress overlay */}
        {isBlending && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center pointer-events-none z-10">
            <div className="text-center">
              <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-purple-500" />
              <Badge className="bg-purple-500">
                <Sparkles className="h-3 w-3 mr-1" />
                Enhancing...
              </Badge>
            </div>
          </div>
        )}

        {/* Drag handle */}
        {isOwner && !isSelectionMode && (
          <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
            <GripVertical className="h-5 w-5 text-white drop-shadow-lg" />
          </div>
        )}

        {/* Selection checkbox */}
        {isSelectionMode && (
          <div
            className="absolute inset-0 bg-black/20 flex items-start justify-start p-3 cursor-pointer"
            onClick={handleCheckboxClick}
            onKeyDown={e =>
              (e.key === "Enter" || e.key === " ")
              && handleCheckboxClick(e as unknown as React.MouseEvent)}
            role="button"
            tabIndex={0}
            aria-label={`Toggle selection for ${image.name || "image"}`}
          >
            <Checkbox
              checked={isSelected}
              onCheckedChange={handleCheckedChange}
              className="h-5 w-5 bg-white border-white"
              aria-label={`Select ${image.name || "image"}`}
            />
          </div>
        )}
      </div>

      <CardContent className="p-3">
        <p className="text-sm font-medium truncate">
          {image.name || "Untitled"}
        </p>
        <p className="text-xs text-muted-foreground">
          {image.width} x {image.height}
        </p>
      </CardContent>
    </Card>
  );
});
