"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  getAppsByCategory,
  STORE_CATEGORIES,
} from "@/app/store/data/store-apps";
import { getStoreIcon } from "./store-icon-map";
import { cn } from "@/lib/utils";

export function StoreCategoryTabs() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const activeCategory = searchParams.get("category") || "all";

  const handleCategoryChange = (categoryId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (categoryId === "all") {
      params.delete("category");
    } else {
      params.set("category", categoryId);
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-wrap justify-center items-center gap-2 pb-1">
      {STORE_CATEGORIES.map(category => {
        const Icon = getStoreIcon(category.icon);
        const isActive = activeCategory === category.id;
        const count = getAppsByCategory(category.id).length;
        return (
          <button
            key={category.id}
            type="button"
            onClick={() => handleCategoryChange(category.id)}
            className={cn(
              "flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300 border",
              isActive
                ? "bg-foreground text-background border-foreground shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-105"
                : "bg-card/50 text-muted-foreground border-border hover:text-foreground hover:bg-muted hover:border-border/80 hover:scale-105 backdrop-blur-sm shadow-sm",
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4 transition-colors",
                isActive
                  ? "text-blue-600"
                  : "text-muted-foreground group-hover:text-foreground/80",
              )}
            />
            {category.label}
            <span
              className={cn(
                "ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-semibold",
                isActive
                  ? "bg-background/30 text-background"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
