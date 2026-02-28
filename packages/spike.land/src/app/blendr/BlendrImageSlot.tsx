"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { processImageForUpload } from "@/lib/images/browser-image-processor";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { Camera, FolderOpen, Loader2, Upload, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";

/** Image selected from gallery (stored image) */
export interface GalleryImage {
  type: "gallery";
  id: string;
  url: string;
  name: string;
  width: number;
  height: number;
}

/** Image uploaded from device (file) */
export interface UploadedImage {
  type: "upload";
  id: string; // Generated unique ID
  url: string; // Object URL for preview
  name: string;
  width: number;
  height: number;
  base64: string;
  mimeType: string;
}

export type SelectedImage = GalleryImage | UploadedImage;

interface BlendrImageSlotProps {
  label: string;
  image: SelectedImage | null;
  onImageSelect: (image: SelectedImage) => void;
  onImageClear: () => void;
  /** Optional for anonymous users who can't access gallery */
  onOpenGallery?: () => void;
  disabled?: boolean;
}

const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export function BlendrImageSlot({
  label,
  image,
  onImageSelect,
  onImageClear,
  onOpenGallery,
  disabled = false,
}: BlendrImageSlotProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File) => {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        alert("Please use an image file (JPEG, PNG, WebP, or GIF)");
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        alert("Image file is too large. Maximum size is 20MB.");
        return;
      }

      setIsProcessing(true);

      try {
        const processed = await processImageForUpload(file);
        const previewUrl = URL.createObjectURL(processed.blob);

        const uploadedImage: UploadedImage = {
          type: "upload",
          id: `upload-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          url: previewUrl,
          name: file.name,
          width: processed.width,
          height: processed.height,
          base64: processed.base64,
          mimeType: processed.mimeType,
        };

        onImageSelect(uploadedImage);
      } catch (error) {
        logger.error("Failed to process image", error);
        alert("Failed to process the image. Please try again.");
      } finally {
        setIsProcessing(false);
      }
    },
    [onImageSelect],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (disabled || isProcessing) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      if (!isDragOver) setIsDragOver(true);
    },
    [disabled, isProcessing, isDragOver],
  );

  const handleDragEnter = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (disabled || isProcessing) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      setIsDragOver(true);
    },
    [disabled, isProcessing],
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const relatedTarget = e.relatedTarget as Node | null;
      const currentTarget = e.currentTarget as Node;
      if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
        setIsDragOver(false);
      }
    },
    [],
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);

      if (disabled || isProcessing || !e.dataTransfer) return;

      const files = Array.from(e.dataTransfer.files);
      const imageFile = files.find(file => ACCEPTED_IMAGE_TYPES.includes(file.type));

      if (imageFile) {
        await processFile(imageFile);
      } else {
        // Checking for standard drop logic if not a file (might be text, etc, ignore)
      }
    },
    [disabled, isProcessing, processFile],
  );

  const handleFileInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        await processFile(file);
      }
      e.target.value = "";
    },
    [processFile],
  );

  const handleContainerClick = useCallback(() => {
    if (disabled || isProcessing || image) return;
    // Trigger dropdown or upload directly if no dropdown
    // But we want to support both gallery & upload if onOpenGallery is present

    // Simplification: If onOpenGallery is provided, we MUST use dropdown to let user choose.
    // If NOT provided (anonymous), we can just open file dialog.
    if (!onOpenGallery) {
      fileInputRef.current?.click();
    }
  }, [disabled, isProcessing, image, onOpenGallery]);

  const handleUploadClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent container click
    fileInputRef.current?.click();
  }, []);

  const handleFolderClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenGallery?.();
  }, [onOpenGallery]);

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (image?.type === "upload") {
        URL.revokeObjectURL(image.url);
      }
      onImageClear();
    },
    [image, onImageClear],
  );

  return (
    <div
      className={cn(
        "group relative w-full h-32 rounded-2xl transition-all duration-300",
        "border border-white/10 overflow-hidden",
        "flex items-center justify-center cursor-pointer",
        !image
          && "glass-1 hover:glass-2 hover:border-white/20 active:scale-[0.98]",
        isDragOver && "ring-2 ring-primary border-primary bg-primary/10",
        disabled && "opacity-50 cursor-not-allowed pointer-events-none",
        image && "bg-black/40 border-transparent",
      )}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleContainerClick}
      onKeyDown={e => (e.key === "Enter" || e.key === " ") && handleContainerClick()}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={image ? "Change image" : "Upload image"}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {isProcessing
        ? (
          <div className="flex flex-col items-center gap-2 text-white/70">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-sm font-medium">Processing...</span>
          </div>
        )
        : image
        ? (
          <>
            <Image
              src={image.url}
              alt={image.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 500px"
              unoptimized={image.type === "upload"}
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />

            <button
              onClick={handleClear}
              className="absolute top-2 right-2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm transition-all hover:scale-110 z-10"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="absolute bottom-2 left-3 flex items-center gap-2 px-2 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
              {image.type === "upload"
                ? <Upload className="h-3 w-3 text-white/70" />
                : <FolderOpen className="h-3 w-3 text-white/70" />}
              <span className="text-xs text-white/90 truncate max-w-[150px]">
                {image.name}
              </span>
            </div>
          </>
        )
        : (
          <div className="flex flex-col items-center justify-center gap-1">
            {onOpenGallery
              ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="flex items-center justify-center w-full h-full absolute inset-0 text-lg font-medium text-white/60 group-hover:text-white transition-colors">
                      {label}
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="center"
                    className="glass-2 border-white/10 text-white"
                  >
                    <DropdownMenuItem onClick={handleUploadClick}>
                      <Camera className="h-4 w-4 mr-2" />
                      Upload from device
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleFolderClick}>
                      <FolderOpen className="h-4 w-4 mr-2" />
                      Choose from gallery
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )
              : (
                <span className="text-lg font-medium text-white/60 group-hover:text-white transition-colors">
                  {label}
                </span>
              )}
          </div>
        )}
    </div>
  );
}
