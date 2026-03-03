import { FolderOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui";
import type { Album } from "./albumTypes";
import { AlbumCard } from "./AlbumCard";

interface AlbumGridProps {
  albums: Album[];
  loading: boolean;
  onOpen: (album: Album) => void;
  onDelete: (album: Album) => void;
  onShare: (album: Album) => void;
  onCreateClick: () => void;
}

export function AlbumGrid({
  albums,
  loading,
  onOpen,
  onDelete,
  onShare,
  onCreateClick,
}: AlbumGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 animate-delayed-show">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-obsidian-900 rounded-[1.5rem] border border-white/5 animate-pulse"
          >
            <div className="aspect-[4/3] bg-obsidian-950 rounded-t-[1.5rem]" />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-obsidian-800 rounded-lg w-3/4" />
              <div className="h-3 bg-obsidian-800 rounded-lg w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (albums.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 rounded-[1.5rem] border border-white/5 bg-obsidian-900/40">
        <div className="w-16 h-16 rounded-2xl bg-amber-neon/5 border border-amber-neon/10 flex items-center justify-center mb-4">
          <FolderOpen className="w-8 h-8 text-amber-neon/60" />
        </div>
        <p className="text-gray-400 font-black uppercase tracking-widest text-sm">No albums yet</p>
        <p className="text-gray-600 text-xs mt-1">
          Create your first album to organize your images
        </p>
        <Button className="mt-6" onClick={onCreateClick}>
          <Plus className="w-4 h-4" />
          New Album
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
      {albums.map((album) => (
        <AlbumCard
          key={album.id}
          album={album}
          onOpen={() => onOpen(album)}
          onDelete={() => onDelete(album)}
          onShare={() => onShare(album)}
        />
      ))}
    </div>
  );
}
