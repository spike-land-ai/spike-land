import { useState, useRef, useEffect } from "react";
import { Box, Archive, Cpu, Share2, Settings, Activity, Zap, LogOut, Grid } from "lucide-react";

export type Workspace = "studio" | "gallery" | "archive" | "intelligence" | "showcase" | "settings";

interface NavItem {
  id: Workspace;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const WORKSPACES: NavItem[] = [
  { id: "studio", label: "Studio", icon: Zap },
  { id: "gallery", label: "Gallery", icon: Grid },
  { id: "archive", label: "Archive", icon: Archive },
  { id: "intelligence", label: "Intelligence", icon: Cpu },
  { id: "showcase", label: "Showcase", icon: Share2 },
];

interface SidebarUser {
  name: string | null;
  email: string | null;
  image: string | null;
}

interface SidebarProps {
  active: Workspace;
  onNavigate: (workspace: unknown) => void;
  user?: SidebarUser | null;
  onLogout?: () => void;
}

function getInitial(user: SidebarUser): string {
  if (user.name) return user.name[0].toUpperCase();
  if (user.email) return user.email[0].toUpperCase();
  return "?";
}

function UserAvatar({
  user,
  size = "md",
  onClick,
}: {
  user: SidebarUser;
  size?: "sm" | "md";
  onClick?: () => void;
}) {
  const dim = size === "sm" ? "w-8 h-8" : "w-10 h-10";
  const textSize = size === "sm" ? "text-xs" : "text-sm";
  if (user.image) {
    return (
      <button
        onClick={onClick}
        className={`${dim} rounded-xl overflow-hidden hover:ring-2 ring-amber-neon/50 transition-all cursor-pointer`}
      >
        <img
          src={user.image}
          alt=""
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      className={`${dim} rounded-xl bg-gradient-to-tr from-amber-neon to-emerald-neon flex items-center justify-center hover:ring-2 ring-amber-neon/50 transition-all cursor-pointer`}
    >
      <span className={`${textSize} font-bold text-obsidian-950`}>{getInitial(user)}</span>
    </button>
  );
}

export function Sidebar({ active, onNavigate, user, onLogout }: SidebarProps) {
  const [showPopover, setShowPopover] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowPopover(false);
      }
    }
    if (showPopover) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPopover]);
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex absolute top-0 left-0 bottom-0 w-16 glass-panel flex-col items-center py-6 z-50 border-y-0 border-l-0 rounded-r-[2rem] my-4 shadow-[30px_0_60px_-15px_rgba(0,0,0,0.5)]">
        <div className="w-10 h-10 rounded-xl bg-amber-neon flex items-center justify-center mb-10 shadow-lg shadow-amber-neon/20">
          <Box className="w-6 h-6 text-obsidian-950 stroke-[2.5]" />
        </div>

        <nav className="flex-1 space-y-4">
          {WORKSPACES.map(({ id, label, icon: Icon }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className={`group relative p-3 rounded-xl transition-all duration-300 ${
                  isActive
                    ? "bg-amber-neon/10 text-amber-neon"
                    : "text-gray-500 hover:text-gray-200 hover:bg-white/5"
                }`}
                title={label}
                aria-label={label}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  className={`w-5 h-5 ${isActive ? "drop-shadow-[0_0_8px_rgba(255,184,0,0.5)]" : ""}`}
                />
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-amber-neon rounded-r-full shadow-[0_0_8px_rgba(255,184,0,0.8)]" />
                )}

                {/* Tooltip */}
                <div className="absolute left-16 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-obsidian-900 border border-white/10 text-[10px] font-black uppercase tracking-widest text-gray-200 opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-[-10px] group-hover:translate-x-0 whitespace-nowrap z-50 shadow-2xl">
                  {label}
                </div>
              </button>
            );
          })}
        </nav>

        <div className="space-y-3">
          <button
            className="p-3 rounded-xl text-gray-500 hover:text-emerald-neon hover:bg-white/5 transition-all"
            aria-label="Activity"
          >
            <Activity className="w-5 h-5" />
          </button>
          <button
            onClick={() => onNavigate("settings")}
            className={`p-3 rounded-xl transition-all ${
              active === "settings"
                ? "bg-white/10 text-white"
                : "text-gray-500 hover:text-white hover:bg-white/5"
            }`}
            aria-label="Settings"
            aria-current={active === "settings" ? "page" : undefined}
          >
            <Settings className="w-5 h-5" />
          </button>
          {user && (
            <div className="relative pt-2" ref={popoverRef}>
              <UserAvatar user={user} size="sm" onClick={() => setShowPopover(!showPopover)} />
              {showPopover && (
                <div className="absolute left-14 bottom-0 w-52 rounded-2xl bg-obsidian-900 border border-white/10 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-200">
                  <div className="mb-3 px-1">
                    {user.name && (
                      <div className="text-[11px] font-bold text-white truncate">{user.name}</div>
                    )}
                    {user.email && (
                      <div className="text-[9px] text-gray-500 truncate font-medium">
                        {user.email}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setShowPopover(false);
                      onLogout?.();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-500/5 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[calc(3.5rem+env(safe-area-inset-bottom))] glass-panel border-t border-white/10 flex items-start justify-around px-4 pt-2 pb-[env(safe-area-inset-bottom)] z-[100] rounded-t-[1.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        {WORKSPACES.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`flex flex-col items-center gap-1 transition-all duration-300 ${
                isActive ? "text-amber-neon scale-105" : "text-gray-600 hover:text-gray-400"
              }`}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
            >
              <div className={`p-2 rounded-xl transition-all ${isActive ? "bg-amber-neon/5" : ""}`}>
                <Icon
                  className={`w-5 h-5 ${isActive ? "drop-shadow-[0_0_8px_rgba(255,184,0,0.5)]" : ""}`}
                />
              </div>
              <span className="text-[7px] font-black uppercase tracking-[0.2em]">{label}</span>
            </button>
          );
        })}
        <button
          onClick={() => onNavigate("settings")}
          className={`flex flex-col items-center gap-1 transition-all ${
            active === "settings" ? "text-white scale-105" : "text-gray-600 hover:text-gray-400"
          }`}
          aria-label="Settings"
          aria-current={active === "settings" ? "page" : undefined}
        >
          <div
            className={`p-2 rounded-xl transition-all ${active === "settings" ? "bg-white/5" : ""}`}
          >
            <Settings className="w-5 h-5" />
          </div>
          <span className="text-[7px] font-black uppercase tracking-[0.2em]">Settings</span>
        </button>
      </nav>
    </>
  );
}
