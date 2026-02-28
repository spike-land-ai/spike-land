"use client";

import { Upload } from "lucide-react";
import { memo } from "react";

export interface FileUploadOverlayProps {
  albumName: string;
}

/**
 * Overlay shown when dragging files over the album
 */
export const FileUploadOverlay = memo(function FileUploadOverlay({
  albumName,
}: FileUploadOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center pointer-events-none">
      <div className="rounded-lg border-2 border-dashed border-primary bg-primary/10 p-12 text-center">
        <Upload className="mx-auto h-16 w-16 text-primary mb-4" />
        <h3 className="text-2xl font-semibold">Drop images here</h3>
        <p className="text-muted-foreground mt-2">
          Images will be uploaded to {albumName}
        </p>
      </div>
    </div>
  );
});
