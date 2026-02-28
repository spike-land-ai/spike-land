"use client";

import { useCallback, useRef, useState } from "react";

import type { AlbumImage } from "./types";

/**
 * Options for useImageReorder hook
 */
export interface UseImageReorderOptions {
  /**
   * Album ID for saving order to backend
   */
  albumId: string;
  /**
   * Callback when reorder fails
   */
  onError?: (error: Error) => void;
}

/**
 * Reorder result with new image array
 */
export interface ReorderResult {
  images: AlbumImage[];
  newOrder: string[];
}

/**
 * Return type for useImageReorder hook
 */
export interface UseImageReorderReturn {
  /**
   * ID of the image currently being dragged
   */
  draggedImageId: string | null;
  /**
   * ID of the image being hovered over
   */
  dragOverImageId: string | null;
  /**
   * Whether order is being saved
   */
  isSavingOrder: boolean;
  /**
   * Handle drag start
   */
  handleDragStart: (e: React.DragEvent, imageId: string) => void;
  /**
   * Handle drag over
   */
  handleDragOver: (e: React.DragEvent, imageId: string) => void;
  /**
   * Handle drag leave
   */
  handleDragLeave: () => void;
  /**
   * Handle drop and reorder
   */
  handleDrop: (
    e: React.DragEvent,
    targetImageId: string,
    images: AlbumImage[],
  ) => Promise<ReorderResult | null>;
  /**
   * Handle drag end (cleanup)
   */
  handleDragEnd: () => void;
  /**
   * Reset all drag state
   */
  resetDragState: () => void;
  /**
   * Original order reference for rollback
   */
  originalOrderRef: React.RefObject<string[]>;
  /**
   * Set original order (typically after fetch)
   */
  setOriginalOrder: (order: string[]) => void;
}

/**
 * Hook for managing image drag-and-drop reordering
 *
 * @param options - Configuration options
 * @returns Drag state and handlers
 *
 * @example
 * ```tsx
 * function ImageGrid({ images, albumId, onReorder }: Props) {
 *   const {
 *     draggedImageId,
 *     dragOverImageId,
 *     isSavingOrder,
 *     handleDragStart,
 *     handleDragOver,
 *     handleDragLeave,
 *     handleDrop,
 *     handleDragEnd,
 *   } = useImageReorder({ albumId });
 *
 *   return (
 *     <div>
 *       {images.map(img => (
 *         <div
 *           key={img.id}
 *           draggable
 *           onDragStart={(e) => handleDragStart(e, img.id)}
 *           onDragOver={(e) => handleDragOver(e, img.id)}
 *           onDragLeave={handleDragLeave}
 *           onDrop={(e) => handleDrop(e, img.id, images).then(result => {
 *             if (result) onReorder(result.images);
 *           })}
 *           onDragEnd={handleDragEnd}
 *           className={`
 *             ${draggedImageId === img.id ? 'opacity-50' : ''}
 *             ${dragOverImageId === img.id ? 'ring-2' : ''}
 *           `}
 *         />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useImageReorder(
  options: UseImageReorderOptions,
): UseImageReorderReturn {
  const { albumId, onError } = options;

  const [draggedImageId, setDraggedImageId] = useState<string | null>(null);
  const [dragOverImageId, setDragOverImageId] = useState<string | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const originalOrderRef = useRef<string[]>([]);

  const setOriginalOrder = useCallback((order: string[]) => {
    originalOrderRef.current = order;
  }, []);

  const handleDragStart = useCallback(
    (e: React.DragEvent, imageId: string) => {
      e.dataTransfer.effectAllowed = "move";
      setDraggedImageId(imageId);
    },
    [],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, imageId: string) => {
      e.preventDefault();
      if (draggedImageId && draggedImageId !== imageId) {
        setDragOverImageId(imageId);
      }
    },
    [draggedImageId],
  );

  const handleDragLeave = useCallback(() => {
    setDragOverImageId(null);
  }, []);

  const resetDragState = useCallback(() => {
    setDraggedImageId(null);
    setDragOverImageId(null);
  }, []);

  const handleDrop = useCallback(
    async (
      e: React.DragEvent,
      targetImageId: string,
      images: AlbumImage[],
    ): Promise<ReorderResult | null> => {
      e.preventDefault();
      setDragOverImageId(null);

      if (!draggedImageId || draggedImageId === targetImageId) {
        setDraggedImageId(null);
        return null;
      }

      const imagesCopy = [...images];
      const draggedIndex = imagesCopy.findIndex(
        img => img.id === draggedImageId,
      );
      const targetIndex = imagesCopy.findIndex(
        img => img.id === targetImageId,
      );

      if (draggedIndex === -1 || targetIndex === -1) {
        setDraggedImageId(null);
        return null;
      }

      // Reorder the array
      const draggedImage = imagesCopy.splice(draggedIndex, 1)[0];
      if (!draggedImage) {
        setDraggedImageId(null);
        return null;
      }
      imagesCopy.splice(targetIndex, 0, draggedImage);

      // Update sortOrder for each image
      const reorderedImages = imagesCopy.map((img, idx) => ({
        ...img,
        sortOrder: idx,
      }));
      const newOrder = reorderedImages.map(img => img.id);

      setDraggedImageId(null);

      // Save the new order to the backend
      setIsSavingOrder(true);
      try {
        const response = await fetch(`/api/albums/${albumId}/images`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageOrder: newOrder }),
        });

        if (!response.ok) {
          throw new Error("Failed to save image order");
        }

        originalOrderRef.current = newOrder;
        return { images: reorderedImages, newOrder };
      } catch (err) {
        const error = err instanceof Error
          ? err
          : new Error("Failed to save image order");
        onError?.(error);
        // Return null to indicate failure - caller should revert
        return null;
      } finally {
        setIsSavingOrder(false);
      }
    },
    [albumId, draggedImageId, onError],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedImageId(null);
    setDragOverImageId(null);
  }, []);

  return {
    draggedImageId,
    dragOverImageId,
    isSavingOrder,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    resetDragState,
    originalOrderRef,
    setOriginalOrder,
  };
}
