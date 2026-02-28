"use client";

import { QRCodePanel } from "@/components/canvas";
import {
  type DisplayType,
  DisplayTypeSwitcher,
} from "@/components/enhance/display-type-switcher";
import { ImagePlaceholder } from "@/components/enhance/ImagePlaceholder";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/components/ui/link";
import { MasonryGridUniform } from "@/components/ui/masonry-grid";
import { useZoomLevel, ZoomSlider } from "@/components/ui/zoom-slider";
import { useMultiFileUpload } from "@/hooks/useMultiFileUpload";
import { logger } from "@/lib/logger";
import { ROUTES } from "@/lib/routes";
import { ArrowLeft, ImageIcon, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
  AlbumEmptyState,
  AlbumHeader,
  AlbumImageCard,
  AlbumQRSheet,
  AlbumSettingsDialog,
  FileUploadOverlay,
  ImageSelectionToolbar,
  MoveToAlbumDialog,
} from "./components";
import {
  useAlbumData,
  useBlendDragDrop,
  useFileDragDrop,
  useImageReorder,
  useImageSelection,
  useMoveToAlbum,
} from "./hooks";
import type { AlbumImage } from "./hooks/types";

interface AlbumDetailClientProps {
  albumId: string;
}

export function AlbumDetailClient({ albumId }: AlbumDetailClientProps) {
  const router = useRouter();

  // View controls
  const [zoomLevel, setZoomLevel] = useZoomLevel();
  const [displayType, setDisplayType] = useState<DisplayType>("auto");
  const [showQRSheet, setShowQRSheet] = useState(false);

  // Album data hook
  const {
    album,
    isLoading,
    error,
    editForm,
    setEditForm,
    showSettings,
    setShowSettings,
    isSaving,
    copied,
    copyShareLink,
    fetchAlbum,
    saveSettings,
    deleteAlbum,
    updateLocalAlbum,
  } = useAlbumData(albumId, {
    onDeleteComplete: () => router.push(ROUTES.albums),
    onError: err => {
      logger.error("Album operation error", err);
      alert(err.message);
    },
  });

  // Image selection hook
  const {
    isSelectionMode,
    selectedImages,
    enterSelectionMode,
    exitSelectionMode,
    toggleSelectAll,
    toggleImageSelection,
  } = useImageSelection();

  // Image reorder hook
  const {
    draggedImageId,
    dragOverImageId,
    isSavingOrder,
    handleDragStart: reorderDragStart,
    handleDragOver: reorderDragOver,
    handleDragLeave: reorderDragLeave,
    handleDrop: reorderDrop,
    handleDragEnd: reorderDragEnd,
  } = useImageReorder({
    albumId,
    onError: err => {
      logger.error("Reorder error", err);
      alert("Failed to save image order. Please try again.");
    },
  });

  // Blend drag-drop hook
  const {
    blendDropTargetId,
    blendingImageId,
    handleBlendDragStart,
    handleBlendDragOver,
    handleBlendDrop,
    handleBlendDragEnd,
    isBlendDrag,
  } = useBlendDragDrop({
    onBlendComplete: () => {
      fetchAlbum();
    },
    onBlendError: err => {
      logger.error("Blend error", err);
      alert(err.message);
    },
  });

  // Move to album hook
  const {
    showMoveDialog,
    setShowMoveDialog,
    allAlbums,
    isLoadingAlbums,
    selectedTargetAlbum,
    setSelectedTargetAlbum,
    isMoving,
    openMoveDialog,
    handleMoveImages,
  } = useMoveToAlbum({
    currentAlbumId: albumId,
    onMoveComplete: movedIds => {
      updateLocalAlbum(prev =>
        prev
          ? {
            ...prev,
            images: prev.images.filter(img => !movedIds.includes(img.id)),
            imageCount: prev.imageCount - movedIds.length,
            coverImageId: movedIds.includes(prev.coverImageId || "")
              ? null
              : prev.coverImageId,
          }
          : null
      );
      exitSelectionMode();
    },
    onMoveError: err => {
      logger.error("Move error", err);
      alert("Failed to move images. Please try again.");
    },
  });

  // Multi-file upload hook
  const {
    upload,
    files: uploadingFiles,
    isUploading,
    reset: resetUpload,
  } = useMultiFileUpload({
    albumId,
    maxFiles: 20,
    parallel: false,
    onUploadComplete: () => {
      fetchAlbum();
      setTimeout(() => resetUpload(), 2000);
    },
  });

  // File drag-drop hook
  const {
    isDraggingFiles,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop: handleFileDrop,
    fileInputRef,
    handleUploadClick,
    handleFileInputChange,
  } = useFileDragDrop({
    enabled: album?.isOwner ?? false,
    onFileDrop: async files => {
      if (album?.isOwner) {
        await upload(files);
      }
    },
  });

  // Get image URL based on display type
  const getImageUrl = useCallback(
    (image: AlbumImage): string => {
      switch (displayType) {
        case "original":
          return image.originalUrl;
        case "enhanced":
          return image.enhancedUrl || image.originalUrl;
        case "auto":
        default:
          return image.enhancedUrl || image.originalUrl;
      }
    },
    [displayType],
  );

  // Handle image card drag start
  const handleImageDragStart = useCallback(
    (e: React.DragEvent, image: AlbumImage) => {
      if (isSelectionMode) return;

      if (image.enhancedUrl) {
        handleBlendDragStart(e, image.id, image.enhancedUrl, isSelectionMode);
      } else {
        reorderDragStart(e, image.id);
      }
    },
    [isSelectionMode, handleBlendDragStart, reorderDragStart],
  );

  // Handle image card drag over
  const handleImageDragOver = useCallback(
    (e: React.DragEvent, imageId: string) => {
      reorderDragOver(e, imageId);
      handleBlendDragOver(e, imageId);
    },
    [reorderDragOver, handleBlendDragOver],
  );

  // Handle image card drag leave
  const handleImageDragLeave = useCallback(() => {
    reorderDragLeave();
  }, [reorderDragLeave]);

  // Handle image card drop
  const handleImageDrop = useCallback(
    async (e: React.DragEvent, imageId: string) => {
      if (isBlendDrag(e)) {
        await handleBlendDrop(e, imageId);
      } else if (album) {
        const result = await reorderDrop(e, imageId, album.images);
        if (result) {
          updateLocalAlbum(prev => prev ? { ...prev, images: result.images } : null);
        }
      }
    },
    [isBlendDrag, handleBlendDrop, album, reorderDrop, updateLocalAlbum],
  );

  // Handle image card drag end
  const handleImageDragEnd = useCallback(() => {
    reorderDragEnd();
    handleBlendDragEnd();
  }, [reorderDragEnd, handleBlendDragEnd]);

  // Handle image click
  const handleImageClick = useCallback(
    (imageId: string) => {
      if (!isSelectionMode && !draggedImageId) {
        router.push(ROUTES.imageDetail(imageId, `/albums/${albumId}`));
      }
    },
    [isSelectionMode, draggedImageId, router, albumId],
  );

  // Handle remove selected images
  const handleRemoveSelectedImages = async () => {
    if (selectedImages.size === 0) return;

    const imageCount = selectedImages.size;
    if (
      !confirm(
        `Remove ${imageCount} image${imageCount > 1 ? "s" : ""} from the album?`,
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/albums/${albumId}/images`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageIds: Array.from(selectedImages) }),
      });

      if (!response.ok) throw new Error("Failed to remove images");

      updateLocalAlbum(prev =>
        prev
          ? {
            ...prev,
            images: prev.images.filter(img => !selectedImages.has(img.id)),
            imageCount: prev.imageCount - selectedImages.size,
            coverImageId: selectedImages.has(prev.coverImageId || "")
              ? null
              : prev.coverImageId,
          }
          : null
      );
      exitSelectionMode();
    } catch (err) {
      logger.error("Error removing images", err);
      alert("Failed to remove images. Please try again.");
    }
  };

  // Handle delete album
  const handleDeleteAlbum = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this album? Images will not be deleted.",
      )
    ) {
      return;
    }
    await deleteAlbum();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 pt-24 pb-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !album) {
    return (
      <div className="container mx-auto px-4 pt-24 pb-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {error || "Album not found"}
            </h3>
            <Button asChild>
              <Link href={ROUTES.albums}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Pixel
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="container mx-auto px-4 pt-24 pb-8 relative"
      onDragEnter={album.isOwner ? handleDragEnter : undefined}
      onDragLeave={album.isOwner ? handleDragLeave : undefined}
      onDragOver={album.isOwner ? handleDragOver : undefined}
      onDrop={album.isOwner ? handleFileDrop : undefined}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef as React.RefObject<HTMLInputElement>}
        type="file"
        className="hidden"
        accept="image/*"
        multiple
        onChange={handleFileInputChange}
      />

      {/* File drag overlay */}
      {isDraggingFiles && album.isOwner && <FileUploadOverlay albumName={album.name} />}

      <div className="flex gap-6">
        {/* QR Panel Sidebar - only for shareable albums */}
        {album.shareToken && album.privacy !== "PRIVATE" && album.isOwner && (
          <div className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-4">
              <QRCodePanel
                albumId={album.id}
                shareToken={album.shareToken}
                albumName={album.name}
              />
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="mb-8">
            <AlbumHeader
              album={album}
              copied={copied}
              isUploading={isUploading}
              onCopyShareLink={copyShareLink}
              onShowQRSheet={() => setShowQRSheet(true)}
              onUploadClick={handleUploadClick}
              onShowSettings={() => setShowSettings(true)}
            />

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <p className="text-sm text-muted-foreground">
                  {album.imageCount} {album.imageCount === 1 ? "image" : "images"}
                  {isSavingOrder && (
                    <span className="ml-2 text-muted-foreground">
                      <Loader2 className="inline h-3 w-3 animate-spin mr-1" />
                      Saving order...
                    </span>
                  )}
                </p>
                {/* View controls */}
                <div className="hidden sm:flex items-center gap-4 border-l pl-4">
                  <DisplayTypeSwitcher
                    value={displayType}
                    onChange={setDisplayType}
                  />
                  <ZoomSlider value={zoomLevel} onChange={setZoomLevel} />
                </div>
              </div>

              {album.isOwner && album.images.length > 0 && (
                <div className="flex gap-2">
                  <ImageSelectionToolbar
                    isSelectionMode={isSelectionMode}
                    selectedCount={selectedImages.size}
                    totalCount={album.images.length}
                    onToggleSelectAll={() => toggleSelectAll(album.images)}
                    onMove={() => openMoveDialog(selectedImages)}
                    onRemove={handleRemoveSelectedImages}
                    onCancel={exitSelectionMode}
                    onEnterSelectionMode={enterSelectionMode}
                  />
                </div>
              )}
            </div>
          </div>

          {album.images.length === 0 && uploadingFiles.length === 0
            ? (
              <AlbumEmptyState
                isOwner={album.isOwner}
                onUploadClick={handleUploadClick}
              />
            )
            : (
              <MasonryGridUniform zoomLevel={zoomLevel}>
                {/* Show uploading placeholders first (filter out completed ones already in album) */}
                {uploadingFiles.filter(f => {
                  if (f.status !== "completed") return true;
                  return !f.imageId
                    || !album.images.some(img => img.id === f.imageId);
                }).map(fileStatus => (
                  <ImagePlaceholder
                    key={fileStatus.id}
                    file={fileStatus.file}
                    progress={fileStatus.progress}
                    status={fileStatus.status === "completed"
                      ? "completed"
                      : fileStatus.status === "failed"
                      ? "failed"
                      : "uploading"}
                    error={fileStatus.error}
                  />
                ))}

                {album.images.map(image => (
                  <AlbumImageCard
                    key={image.id}
                    image={image}
                    imageUrl={getImageUrl(image)}
                    isCover={album.coverImageId === image.id}
                    isOwner={album.isOwner}
                    isSelectionMode={isSelectionMode}
                    isSelected={selectedImages.has(image.id)}
                    isDragged={draggedImageId === image.id}
                    isDragOver={dragOverImageId === image.id}
                    isBlendDropTarget={blendDropTargetId === image.id}
                    isBlending={blendingImageId === image.id}
                    showEnhancedBadge={!!image.enhancedUrl
                      && displayType !== "original"}
                    draggable={album.isOwner && !isSelectionMode}
                    onDragStart={handleImageDragStart}
                    onDragOver={handleImageDragOver}
                    onDragLeave={handleImageDragLeave}
                    onDrop={handleImageDrop}
                    onDragEnd={handleImageDragEnd}
                    onClick={handleImageClick}
                    onToggleSelection={toggleImageSelection}
                  />
                ))}
              </MasonryGridUniform>
            )}
        </div>
      </div>

      {/* Settings Dialog */}
      <AlbumSettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
        editForm={editForm}
        onEditFormChange={setEditForm}
        isSaving={isSaving}
        onSave={saveSettings}
        onDelete={handleDeleteAlbum}
      />

      {/* Move to Album Dialog */}
      <MoveToAlbumDialog
        open={showMoveDialog}
        onOpenChange={setShowMoveDialog}
        selectedCount={selectedImages.size}
        allAlbums={allAlbums}
        isLoadingAlbums={isLoadingAlbums}
        selectedTargetAlbum={selectedTargetAlbum}
        onSelectedTargetAlbumChange={setSelectedTargetAlbum}
        isMoving={isMoving}
        onMove={() => handleMoveImages(selectedImages)}
      />

      {/* Mobile QR Sheet */}
      {album.shareToken && album.privacy !== "PRIVATE" && album.isOwner && (
        <AlbumQRSheet
          open={showQRSheet}
          onOpenChange={setShowQRSheet}
          albumId={album.id}
          shareToken={album.shareToken}
          albumName={album.name}
        />
      )}
    </div>
  );
}
