/**
 * Image Studio Types
 *
 * Plain TypeScript interfaces for image-related SpacetimeDB tables.
 * Replaces the auto-generated module_bindings type inference.
 */

export interface Image {
  id: string;
  userIdentity: string;
  name: string;
  description: string | null;
  originalUrl: string;
  originalR2Key: string;
  originalWidth: number;
  originalHeight: number;
  originalSizeBytes: bigint;
  originalFormat: string;
  isPublic: boolean;
  viewCount: bigint;
  tags: string[];
  shareToken: string | null;
  createdAt: bigint;
  updatedAt: bigint;
}

export interface Album {
  id: bigint;
  handle: string;
  userIdentity: string;
  name: string;
  description: string | null;
  coverImageId: string | null;
  privacy: string;
  defaultTier: string;
  shareToken: string | null;
  sortOrder: number;
  pipelineId: string | null;
  createdAt: bigint;
  updatedAt: bigint;
}

export interface AlbumImage {
  id: bigint;
  albumId: bigint;
  imageId: string;
  sortOrder: number;
  addedAt: bigint;
}

export interface Pipeline {
  id: string;
  userIdentity: string | null;
  name: string;
  description: string | null;
  visibility: string;
  shareToken: string | null;
  tier: string;
  analysisConfigJson: string | null;
  autoCropConfigJson: string | null;
  promptConfigJson: string | null;
  generationConfigJson: string | null;
  usageCount: bigint;
  createdAt: bigint;
  updatedAt: bigint;
}

export interface EnhancementJob {
  id: string;
  imageId: string;
  userIdentity: string;
  tier: string;
  creditsCost: number;
  status: string;
  enhancedUrl: string | null;
  enhancedR2Key: string | null;
  enhancedWidth: number | null;
  enhancedHeight: number | null;
  enhancedSizeBytes: bigint | null;
  errorMessage: string | null;
  retryCount: number;
  metadataJson: string | null;
  processingStartedAt: bigint | null;
  processingCompletedAt: bigint | null;
  createdAt: bigint;
  updatedAt: bigint;
}

export interface GenerationJob {
  id: string;
  userIdentity: string;
  jobType: string;
  tier: string;
  creditsCost: number;
  status: string;
  prompt: string;
  inputImageUrl: string | null;
  outputImageUrl: string | null;
  outputWidth: number | null;
  outputHeight: number | null;
  outputSizeBytes: bigint | null;
  errorMessage: string | null;
  createdAt: bigint;
  updatedAt: bigint;
}

export interface Subject {
  id: bigint;
  userIdentity: string;
  imageId: string;
  label: string;
  subjectType: string;
  description: string | null;
  createdAt: bigint;
}

export interface Credits {
  userIdentity: string;
  balance: bigint;
  updatedAt: bigint;
}
