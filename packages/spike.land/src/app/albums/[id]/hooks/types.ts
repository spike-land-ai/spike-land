/**
 * Shared types for album detail hooks
 */

/**
 * Image in an album
 */
export interface AlbumImage {
  id: string;
  name: string;
  description: string | null;
  originalUrl: string;
  enhancedUrl?: string;
  enhancementTier?: string;
  width: number;
  height: number;
  sortOrder: number;
  createdAt: string;
}

/**
 * Album with full details
 */
export interface Album {
  id: string;
  name: string;
  description: string | null;
  privacy: AlbumPrivacy;
  coverImageId: string | null;
  pipelineId: string | null;
  shareToken?: string;
  imageCount: number;
  isOwner: boolean;
  images: AlbumImage[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Album privacy level
 */
export type AlbumPrivacy = "PRIVATE" | "UNLISTED" | "PUBLIC";

/**
 * Album list item (for move dialog)
 */
export interface AlbumListItem {
  id: string;
  name: string;
  imageCount: number;
}

/**
 * Edit form state for album settings
 */
export interface EditFormState {
  name: string;
  description: string;
  privacy: AlbumPrivacy;
  pipelineId: string | null;
}
