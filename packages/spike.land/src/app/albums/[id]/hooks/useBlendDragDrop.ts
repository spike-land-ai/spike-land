"use client";

import { tryCatch } from "@/lib/try-catch";
import { useCallback, useState } from "react";

/**
 * Options for useBlendDragDrop hook
 */
export interface UseBlendDragDropOptions {
  /**
   * Callback when blend enhancement starts
   */
  onBlendStart?: (sourceId: string, targetId: string) => void;
  /**
   * Callback when blend enhancement completes
   */
  onBlendComplete?: (targetId: string) => void;
  /**
   * Callback on blend error
   */
  onBlendError?: (error: Error) => void;
}

/**
 * Return type for useBlendDragDrop hook
 */
export interface UseBlendDragDropReturn {
  // State
  blendDragSourceId: string | null;
  blendDropTargetId: string | null;
  blendingImageId: string | null;

  // Handlers
  handleBlendDragStart: (
    e: React.DragEvent,
    imageId: string,
    enhancedUrl: string,
    isSelectionMode: boolean,
  ) => void;
  handleBlendDragOver: (e: React.DragEvent, targetImageId: string) => void;
  handleBlendDrop: (e: React.DragEvent, targetImageId: string) => Promise<void>;
  handleBlendDragEnd: () => void;
  resetBlendState: () => void;

  // Helpers
  isBlendDrag: (e: React.DragEvent) => boolean;
}

const BLEND_DATA_TYPE = "application/x-blend-image";

/**
 * Hook for managing blend drag-drop operations
 *
 * Blend operations allow dropping an enhanced image onto another image
 * to blend the enhancement style.
 *
 * @param options - Optional callbacks for blend events
 * @returns Blend drag-drop state and handlers
 *
 * @example
 * ```tsx
 * const {
 *   blendDragSourceId,
 *   blendDropTargetId,
 *   blendingImageId,
 *   handleBlendDragStart,
 *   handleBlendDragOver,
 *   handleBlendDrop,
 *   handleBlendDragEnd,
 *   isBlendDrag,
 * } = useBlendDragDrop({
 *   onBlendComplete: () => fetchAlbum(),
 * });
 *
 * // On an enhanced image
 * <div
 *   draggable
 *   onDragStart={(e) => handleBlendDragStart(e, image.id, image.enhancedUrl, isSelectionMode)}
 *   onDragEnd={handleBlendDragEnd}
 * />
 *
 * // On any image
 * <div
 *   onDragOver={(e) => handleBlendDragOver(e, image.id)}
 *   onDrop={(e) => isBlendDrag(e) && handleBlendDrop(e, image.id)}
 * />
 * ```
 */
export function useBlendDragDrop(
  options: UseBlendDragDropOptions = {},
): UseBlendDragDropReturn {
  const { onBlendStart, onBlendComplete, onBlendError } = options;

  const [blendDragSourceId, setBlendDragSourceId] = useState<string | null>(
    null,
  );
  const [blendDropTargetId, setBlendDropTargetId] = useState<string | null>(
    null,
  );
  const [blendingImageId, setBlendingImageId] = useState<string | null>(null);

  /**
   * Fetch image URL and convert to base64 via API proxy
   */
  const fetchImageAsBase64 = useCallback(
    async (url: string): Promise<{ base64: string; mimeType: string; }> => {
      const { data, error } = await tryCatch(
        fetch("/api/images/fetch-base64", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        }),
      );

      if (error || !data.ok) {
        throw new Error("Failed to fetch image");
      }

      return data.json();
    },
    [],
  );

  /**
   * Check if this is a blend drag operation
   */
  const isBlendDrag = useCallback((e: React.DragEvent) => {
    return e.dataTransfer?.types?.includes(BLEND_DATA_TYPE) ?? false;
  }, []);

  /**
   * Handle blend drag start (from enhanced image)
   */
  const handleBlendDragStart = useCallback(
    (
      e: React.DragEvent,
      imageId: string,
      enhancedUrl: string,
      isSelectionMode: boolean,
    ) => {
      if (isSelectionMode) return;

      e.dataTransfer.setData(
        BLEND_DATA_TYPE,
        JSON.stringify({ imageId, enhancedUrl }),
      );
      e.dataTransfer.effectAllowed = "copy";
      setBlendDragSourceId(imageId);
    },
    [],
  );

  /**
   * Handle blend drag over
   */
  const handleBlendDragOver = useCallback(
    (e: React.DragEvent, targetImageId: string) => {
      if (!isBlendDrag(e)) return;

      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";

      if (blendDragSourceId && blendDragSourceId !== targetImageId) {
        setBlendDropTargetId(targetImageId);
      }
    },
    [blendDragSourceId, isBlendDrag],
  );

  /**
   * Handle blend drop
   */
  const handleBlendDrop = useCallback(
    async (e: React.DragEvent, targetImageId: string) => {
      e.preventDefault();

      const blendData = e.dataTransfer.getData(BLEND_DATA_TYPE);
      if (!blendData) {
        setBlendDropTargetId(null);
        return;
      }

      try {
        const { imageId: sourceImageId, enhancedUrl } = JSON.parse(blendData);

        // Don't blend with self
        if (sourceImageId === targetImageId) {
          setBlendDropTargetId(null);
          setBlendDragSourceId(null);
          return;
        }

        // Set blending state for visual feedback
        setBlendingImageId(targetImageId);
        setBlendDropTargetId(null);
        setBlendDragSourceId(null);

        onBlendStart?.(sourceImageId, targetImageId);

        // Fetch the enhanced image as base64
        const { base64, mimeType } = await fetchImageAsBase64(enhancedUrl);

        // Call enhance API with blend source
        const { data: response, error: fetchError } = await tryCatch(
          fetch("/api/images/enhance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageId: targetImageId,
              tier: "TIER_1K",
              blendSource: { base64, mimeType },
            }),
          }),
        );

        if (fetchError || !response.ok) {
          const errorData = response
            ? await response.json().catch(() => ({}))
            : {};
          throw new Error(errorData.error || "Enhancement failed");
        }

        // Notify completion after a delay for the async enhancement to start
        setTimeout(() => {
          onBlendComplete?.(targetImageId);
        }, 2000);
      } catch (error) {
        onBlendError?.(
          error instanceof Error
            ? error
            : new Error("Blend enhancement failed"),
        );
      } finally {
        setBlendingImageId(null);
      }
    },
    [fetchImageAsBase64, onBlendStart, onBlendComplete, onBlendError],
  );

  /**
   * Handle blend drag end
   */
  const handleBlendDragEnd = useCallback(() => {
    setBlendDragSourceId(null);
    setBlendDropTargetId(null);
  }, []);

  /**
   * Reset all blend state
   */
  const resetBlendState = useCallback(() => {
    setBlendDragSourceId(null);
    setBlendDropTargetId(null);
    setBlendingImageId(null);
  }, []);

  return {
    blendDragSourceId,
    blendDropTargetId,
    blendingImageId,
    handleBlendDragStart,
    handleBlendDragOver,
    handleBlendDrop,
    handleBlendDragEnd,
    resetBlendState,
    isBlendDrag,
  };
}
