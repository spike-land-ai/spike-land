"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ImageIcon, Upload } from "lucide-react";
import { memo } from "react";

export interface AlbumEmptyStateProps {
  isOwner: boolean;
  onUploadClick: () => void;
}

/**
 * Empty state shown when album has no images
 */
export const AlbumEmptyState = memo(function AlbumEmptyState({
  isOwner,
  onUploadClick,
}: AlbumEmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No images yet</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {isOwner
            ? "Drag and drop images here or click Upload"
            : "This album has no images yet"}
        </p>
        {isOwner && (
          <Button onClick={onUploadClick}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Images
          </Button>
        )}
      </CardContent>
    </Card>
  );
});
