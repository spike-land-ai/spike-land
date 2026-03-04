import { useAuth } from "@/hooks/useAuth";
import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";

export function LoginButton() {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  if (isLoading) {
    return <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />;
  }

  if (!isAuthenticated || !user) {
    return (
      <button
        onClick={() => login()}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Sign in
      </button>
    );
  }

  const initials = (user.name ?? user.email ?? "U")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-muted text-foreground"
        aria-label={`Account menu for ${user.name ?? user.email ?? "User"}`}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
      >
        {user.picture ? (
          <img src={user.picture} alt="" className="h-8 w-8 rounded-full" />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
            {initials}
          </div>
        )}
        <span className="hidden text-sm font-medium sm:inline">
          {user.name ?? user.preferred_username ?? "User"}
        </span>
      </button>

      {menuOpen && (
        <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-border bg-card py-1 shadow-lg">
          <div className="border-b border-border px-4 py-2">
            <p className="truncate text-sm font-medium text-foreground">{user.name ?? "User"}</p>
            {user.email && <p className="truncate text-xs text-muted-foreground">{user.email}</p>}
          </div>
          <Link
            to="/settings"
            onClick={() => setMenuOpen(false)}
            className="block px-4 py-2 text-sm text-foreground hover:bg-muted"
          >
            Settings
          </Link>
          <button
            onClick={() => {
              setMenuOpen(false);
              logout();
            }}
            className="block w-full px-4 py-2 text-left text-sm text-destructive hover:bg-muted"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
