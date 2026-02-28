"use client";

import { PipelineSelector } from "@/components/enhance/PipelineSelector";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Globe, Link as LinkIcon, Loader2, Lock, Trash2 } from "lucide-react";
import { memo } from "react";
import type { AlbumPrivacy, EditFormState } from "../hooks/types";

export interface AlbumSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editForm: EditFormState;
  onEditFormChange: React.Dispatch<React.SetStateAction<EditFormState>>;
  isSaving: boolean;
  onSave: () => void;
  onDelete: () => void;
}

/**
 * Album settings dialog for editing name, description, privacy, and pipeline
 */
export const AlbumSettingsDialog = memo(function AlbumSettingsDialog({
  open,
  onOpenChange,
  editForm,
  onEditFormChange,
  isSaving,
  onSave,
  onDelete,
}: AlbumSettingsDialogProps) {
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onEditFormChange(prev => ({ ...prev, name: e.target.value }));
  };

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    onEditFormChange(prev => ({ ...prev, description: e.target.value }));
  };

  const handlePrivacyChange = (value: AlbumPrivacy) => {
    onEditFormChange(prev => ({ ...prev, privacy: value }));
  };

  const handlePipelineChange = (pipelineId: string | null) => {
    onEditFormChange(prev => ({ ...prev, pipelineId }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Album Settings</DialogTitle>
          <DialogDescription>
            Update your album details and privacy settings.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-name">Album Name</Label>
            <Input
              id="edit-name"
              value={editForm.name}
              onChange={handleNameChange}
              maxLength={100}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={editForm.description}
              onChange={handleDescriptionChange}
              placeholder="Optional description..."
              rows={3}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-privacy">Privacy</Label>
            <Select
              value={editForm.privacy}
              onValueChange={handlePrivacyChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PRIVATE">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Private
                  </div>
                </SelectItem>
                <SelectItem value="UNLISTED">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    Unlisted
                  </div>
                </SelectItem>
                <SelectItem value="PUBLIC">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Public
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Enhancement Pipeline</Label>
            <PipelineSelector
              value={editForm.pipelineId}
              onChange={handlePipelineChange}
              showManageLink
            />
            <p className="text-xs text-muted-foreground">
              Select a pipeline to use for enhancing images in this album.
            </p>
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="destructive"
            onClick={onDelete}
            className="sm:mr-auto"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Album
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={!editForm.name.trim() || isSaving}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
