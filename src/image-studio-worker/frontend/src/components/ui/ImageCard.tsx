import { Edit3, MoreVertical } from "lucide-react";
import { type ReactNode, useState } from "react";

interface ImageCardProps {
  id: string;
  name: string;
  url: string;
  width?: number;
  height?: number;
  selected?: boolean;
  onSelect?: () => void;
  onClick?: () => void;
  onEdit?: () => void;
  actions?: Array<{ label: string; onClick: () => void; danger?: boolean }>;
  badge?: ReactNode;
  tags?: string[];
  description?: string;
}

export function ImageCard({
  id: _id,
  name,
  url,
  width,
  height,
  selected,
  onSelect,
  onClick,
  onEdit,
  actions,
  badge,
  tags,
  description,
}: ImageCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className={`group relative bg-obsidian-900 rounded-[1.5rem] border overflow-hidden transition-all duration-500 hover:border-white/20 shadow-lg ${
        selected
          ? "border-amber-neon ring-2 ring-amber-neon/20 scale-[1.02]"
          : "border-white/5 hover:shadow-2xl"
      }`}
    >
      <div
        className="aspect-square relative cursor-pointer group/img"
        onClick={onClick ?? onSelect}
      >
        <img
          src={url}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-1000 group-hover/img:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950/80 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-all duration-500" />

        {onEdit && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-neon/20 hover:bg-amber-neon/30 border border-amber-neon/50 text-amber-neon text-[10px] font-black uppercase tracking-widest backdrop-blur-md transition-all hover:scale-105 active:scale-95 shadow-xl shadow-amber-neon/20"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit
            </button>
          </div>
        )}

        {onSelect && (
          <div
            className={`absolute top-2.5 left-2.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-all z-20 ${
              selected
                ? "bg-amber-neon border-amber-neon shadow-lg shadow-amber-neon/30 scale-110"
                : "border-white/30 bg-black/30 opacity-0 group-hover/img:opacity-100 backdrop-blur-md"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
          >
            {selected && <span className="text-obsidian-950 text-[10px] font-black">✓</span>}
          </div>
        )}
        {badge && <div className="absolute top-2.5 right-2.5 z-20">{badge}</div>}
      </div>

      <div className="p-3.5 bg-obsidian-900/40 backdrop-blur-xl border-t border-white/5 relative z-30">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate uppercase tracking-tight">{name}</p>
            {description && (
              <p className="text-[8px] text-gray-500 truncate mt-0.5 font-bold uppercase tracking-widest">
                {description}
              </p>
            )}
          </div>
          {actions && actions.length > 0 && (
            <div className="relative shrink-0">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className={`p-1.5 rounded-lg transition-all ${
                  menuOpen
                    ? "bg-amber-neon text-obsidian-950"
                    : "hover:bg-white/10 text-gray-500 hover:text-white"
                }`}
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-[100]" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 bottom-10 md:bottom-auto md:top-10 z-[110] bg-obsidian-900 border border-white/10 rounded-xl shadow-2xl py-1.5 min-w-[140px] animate-in fade-in zoom-in-95 duration-200">
                    {actions.map((action) => (
                      <button
                        key={action.label}
                        onClick={() => {
                          action.onClick();
                          setMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-[9px] font-black uppercase tracking-widest transition-colors ${
                          action.danger
                            ? "text-red-400 hover:bg-red-500/5"
                            : "text-gray-400 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {(tags && tags.length > 0) || (width && height) ? (
          <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-white/5">
            <div className="flex flex-wrap gap-1 flex-1">
              {tags?.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="text-[7px] font-black uppercase tracking-[0.1em] px-1.5 py-0.5 rounded-md bg-white/5 text-gray-400 border border-white/5"
                >
                  {tag}
                </span>
              ))}
            </div>
            {width && height && (
              <span className="text-[8px] font-mono text-gray-600 font-black">
                {width}×{height}
              </span>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
