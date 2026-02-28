"use client";

import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useDebounce } from "use-debounce";

interface StoreSearchProps {
  placeholder?: string;
  className?: string;
}

export function StoreSearch({
  placeholder = "Search apps, tools, categories...",
  className,
}: StoreSearchProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialSearch = searchParams.get("search") || "";

  const inputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [debouncedSearch] = useDebounce(searchTerm, 300);

  // Focus input on Cmd+K / Ctrl+K, blur on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === "Escape") {
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Sync URL with debounced search
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedSearch) {
      params.set("search", debouncedSearch);
    } else {
      params.delete("search");
    }

    // Only push if changed
    if (params.get("search") !== searchParams.get("search")) {
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  }, [debouncedSearch, router, searchParams]);

  return (
    <div className={`relative w-full max-w-lg ${className ?? ""}`}>
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
        <Search className="h-4 w-4" />
      </div>
      <Input
        ref={inputRef}
        placeholder={placeholder}
        className="pl-11 pr-20 bg-card/30 border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary/30 focus-visible:border-primary/30 transition-all rounded-2xl h-12 text-base"
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
        {searchTerm
          ? (
            <button
              onClick={() => setSearchTerm("")}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )
          : (
            <kbd className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-border bg-card/30 px-2 py-0.5 text-[11px] font-medium text-muted-foreground/60">
              ⌘K
            </kbd>
          )}
      </div>
    </div>
  );
}
