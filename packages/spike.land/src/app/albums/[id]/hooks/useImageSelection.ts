"use client";

import { useCallback, useState } from "react";

import type { AlbumImage } from "./types";

/**
 * Options for useImageSelection hook
 */
export interface UseImageSelectionOptions {
  /**
   * Initial selection mode state
   */
  initialSelectionMode?: boolean;
}

/**
 * Return type for useImageSelection hook
 */
export interface UseImageSelectionReturn {
  /**
   * Whether selection mode is active
   */
  isSelectionMode: boolean;
  /**
   * Set of selected image IDs
   */
  selectedImages: Set<string>;
  /**
   * Enter selection mode
   */
  enterSelectionMode: () => void;
  /**
   * Exit selection mode and clear selections
   */
  exitSelectionMode: () => void;
  /**
   * Toggle all images selected/deselected
   */
  toggleSelectAll: (images: AlbumImage[]) => void;
  /**
   * Toggle a single image's selection
   */
  toggleImageSelection: (imageId: string) => void;
  /**
   * Clear all selections without exiting selection mode
   */
  clearSelections: () => void;
  /**
   * Number of selected images
   */
  selectedCount: number;
}

/**
 * Hook for managing image selection mode and selected images
 *
 * @param options - Configuration options
 * @returns Selection state and handlers
 *
 * @example
 * ```tsx
 * function AlbumGallery({ images }: { images: AlbumImage[] }) {
 *   const {
 *     isSelectionMode,
 *     selectedImages,
 *     enterSelectionMode,
 *     exitSelectionMode,
 *     toggleSelectAll,
 *     toggleImageSelection,
 *   } = useImageSelection();
 *
 *   return (
 *     <div>
 *       <button onClick={isSelectionMode ? exitSelectionMode : enterSelectionMode}>
 *         {isSelectionMode ? 'Cancel' : 'Select'}
 *       </button>
 *       {isSelectionMode && (
 *         <button onClick={() => toggleSelectAll(images)}>
 *           Select All
 *         </button>
 *       )}
 *       {images.map(img => (
 *         <img
 *           key={img.id}
 *           onClick={() => isSelectionMode && toggleImageSelection(img.id)}
 *           className={selectedImages.has(img.id) ? 'selected' : ''}
 *         />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useImageSelection(
  options: UseImageSelectionOptions = {},
): UseImageSelectionReturn {
  const { initialSelectionMode = false } = options;

  const [isSelectionMode, setIsSelectionMode] = useState(initialSelectionMode);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());

  const enterSelectionMode = useCallback(() => {
    setIsSelectionMode(true);
  }, []);

  const exitSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedImages(new Set());
  }, []);

  const toggleSelectAll = useCallback((images: AlbumImage[]) => {
    setSelectedImages(prev => {
      if (prev.size === images.length) {
        // All selected, deselect all
        return new Set();
      }
      // Select all
      return new Set(images.map(img => img.id));
    });
  }, []);

  const toggleImageSelection = useCallback((imageId: string) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(imageId)) {
        newSet.delete(imageId);
      } else {
        newSet.add(imageId);
      }
      return newSet;
    });
  }, []);

  const clearSelections = useCallback(() => {
    setSelectedImages(new Set());
  }, []);

  return {
    isSelectionMode,
    selectedImages,
    enterSelectionMode,
    exitSelectionMode,
    toggleSelectAll,
    toggleImageSelection,
    clearSelections,
    selectedCount: selectedImages.size,
  };
}
