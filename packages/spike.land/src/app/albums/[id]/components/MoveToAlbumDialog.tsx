"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { memo } from "react";
import type { AlbumListItem } from "../hooks/types";

export interface MoveToAlbumDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  allAlbums: AlbumListItem[];
  isLoadingAlbums: boolean;
  selectedTargetAlbum: string;
  onSelectedTargetAlbumChange: (albumId: string) => void;
  isMoving: boolean;
  onMove: () => void;
}

/**
 * Dialog for moving selected images to another album
 */
export const MoveToAlbumDialog = memo(function MoveToAlbumDialog({
  open,
  onOpenChange,
  selectedCount,
  allAlbums,
  isLoadingAlbums,
  selectedTargetAlbum,
  onSelectedTargetAlbumChange,
  isMoving,
  onMove,
}: MoveToAlbumDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move Images to Album</DialogTitle>
          <DialogDescription>
            Select an album to move {selectedCount} image
            {selectedCount > 1 ? "s" : ""} to.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {isLoadingAlbums
            ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )
            : allAlbums.length === 0
            ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No other albums available. Create a new album first.
              </p>
            )
            : (
              <div className="grid gap-2">
                <Label htmlFor="target-album">Target Album</Label>
                <Select
                  value={selectedTargetAlbum}
                  onValueChange={onSelectedTargetAlbumChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an album..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allAlbums.map(a => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name} ({a.imageCount} images)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onMove}
            disabled={!selectedTargetAlbum || isMoving}
          >
            {isMoving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Move Images
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
