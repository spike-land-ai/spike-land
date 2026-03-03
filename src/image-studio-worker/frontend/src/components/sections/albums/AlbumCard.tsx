import { FolderOpen, Trash2, Copy } from "lucide-react";
import { Badge } from "@/components/ui";
import type { Album } from "./albumTypes";

interface AlbumCardProps {
  album: Album;
  onOpen: () => void;
  onDelete: () => void;
  onShare: () => void;
}

export function AlbumCard({ album, onOpen, onDelete, onShare }: AlbumCardProps) {
  const imageCount = album._count?.albumImages ?? album.imageCount ?? 0;

  return (
    <div className="group relative bg-obsidian-900 rounded-[1.5rem] border border-white/5 hover:border-white/20 overflow-hidden transition-all duration-500 shadow-lg hover:shadow-2xl hover:scale-[1.02]">
      {/* Cover image / placeholder */}
      <button
        onClick={onOpen}
        className="block w-full aspect-[4/3] relative overflow-hidden bg-obsidian-950 cursor-pointer"
      >
        {album.coverUrl ? (
          <img
            src={album.coverUrl}
            alt={album.name}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-white/3 border border-white/5 flex items-center justify-center">
              <FolderOpen className="w-6 h-6 text-gray-700" />
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
      </button>

      {/* Info */}
      <div className="p-4 bg-obsidian-900/60 backdrop-blur-xl border-t border-white/5">
        <div className="flex-1 min-w-0">
          <button onClick={onOpen} className="text-left w-full">
            <p className="text-sm font-black text-white uppercase tracking-tight truncate hover:text-amber-neon transition-colors">
              {album.name}
            </p>
          </button>
          <div className="flex items-center gap-2 mt-1.5">
            <Badge
              variant={
                album.privacy === "PUBLIC"
                  ? "success"
                  : album.privacy === "UNLISTED"
                    ? "warning"
                    : "default"
              }
            >
              {album.privacy}
            </Badge>
            <span className="text-[8px] font-black uppercase tracking-widest text-gray-600">
              {imageCount} {imageCount === 1 ? "image" : "images"}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-white/5">
          <button
            onClick={onOpen}
            className="flex-1 py-1.5 px-3 rounded-xl bg-white/5 hover:bg-amber-neon hover:text-obsidian-950 text-gray-400 text-[9px] font-black uppercase tracking-widest transition-all duration-300 text-center"
          >
            Open
          </button>
          {album.privacy === "PUBLIC" && (
            <button
              onClick={onShare}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-emerald-neon/10 hover:border-emerald-neon/20 border border-transparent text-gray-500 hover:text-emerald-neon transition-all duration-300"
              title="Copy public link"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onDelete}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-red-500/10 hover:border-red-500/20 border border-transparent text-gray-500 hover:text-red-400 transition-all duration-300"
            title="Delete album"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
