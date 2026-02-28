"use client";

import { QRCodePanel } from "@/components/canvas";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { memo } from "react";

export interface AlbumQRSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  albumId: string;
  shareToken: string;
  albumName: string;
}

/**
 * Mobile sheet for showing QR code
 */
export const AlbumQRSheet = memo(function AlbumQRSheet({
  open,
  onOpenChange,
  albumId,
  shareToken,
  albumName,
}: AlbumQRSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[80vh]">
        <SheetHeader>
          <SheetTitle>Canvas Display</SheetTitle>
        </SheetHeader>
        <div className="pt-4">
          <QRCodePanel
            albumId={albumId}
            shareToken={shareToken}
            albumName={albumName}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
});
