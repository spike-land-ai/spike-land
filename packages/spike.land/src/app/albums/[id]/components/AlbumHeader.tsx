"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { ROUTES } from "@/lib/routes";
import {
  ArrowLeft,
  Check,
  Copy,
  Globe,
  Link as LinkIcon,
  Loader2,
  Lock,
  QrCode,
  Settings,
  Upload,
} from "lucide-react";
import { memo } from "react";
import type { Album, AlbumPrivacy } from "../hooks/types";

export interface AlbumHeaderProps {
  album: Album;
  copied: boolean;
  isUploading: boolean;
  onCopyShareLink: () => void;
  onShowQRSheet: () => void;
  onUploadClick: () => void;
  onShowSettings: () => void;
}

/**
 * Get privacy icon for album privacy level
 */
function getPrivacyIcon(privacy: AlbumPrivacy) {
  switch (privacy) {
    case "PUBLIC":
      return <Globe className="h-4 w-4" />;
    case "UNLISTED":
      return <LinkIcon className="h-4 w-4" />;
    default:
      return <Lock className="h-4 w-4" />;
  }
}

/**
 * Get privacy label for album privacy level
 */
function getPrivacyLabel(privacy: AlbumPrivacy): string {
  switch (privacy) {
    case "PUBLIC":
      return "Public";
    case "UNLISTED":
      return "Unlisted";
    default:
      return "Private";
  }
}

/**
 * Album header component with title, description, and action buttons
 */
export const AlbumHeader = memo(function AlbumHeader({
  album,
  copied,
  isUploading,
  onCopyShareLink,
  onShowQRSheet,
  onUploadClick,
  onShowSettings,
}: AlbumHeaderProps) {
  const showShareButtons = album.shareToken && album.privacy !== "PRIVATE";

  return (
    <div className="flex items-center gap-4 mb-4">
      <Button variant="ghost" size="icon" asChild>
        <Link href={ROUTES.albums}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </Button>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight">{album.name}</h1>
          <Badge variant="secondary" className="gap-1">
            {getPrivacyIcon(album.privacy)}
            {getPrivacyLabel(album.privacy)}
          </Badge>
        </div>
        {album.description && <p className="mt-2 text-muted-foreground">{album.description}</p>}
      </div>
      {album.isOwner && (
        <div className="flex gap-2">
          {showShareButtons && (
            <>
              <Button variant="outline" size="sm" onClick={onCopyShareLink}>
                {copied
                  ? <Check className="mr-2 h-4 w-4" />
                  : <Copy className="mr-2 h-4 w-4" />}
                {copied ? "Copied!" : "Copy Link"}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="lg:hidden"
                onClick={onShowQRSheet}
                aria-label="Show QR code for Canvas display"
              >
                <QrCode className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button
            variant="default"
            size="sm"
            onClick={onUploadClick}
            disabled={isUploading}
          >
            {isUploading
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              : <Upload className="mr-2 h-4 w-4" />}
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onShowSettings}
            aria-label="Album settings"
            data-testid="album-settings-button"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
});
