import type { AppCategoryGroup } from "../../hooks/useApps";

interface CategoryRailProps {
  groups: AppCategoryGroup[];
  activeCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

export function CategoryRail({ groups, activeCategory, onSelectCategory }: CategoryRailProps) {
  return (
    <nav className="flex flex-col space-y-1">
      <button
        type="button"
        onClick={() => onSelectCategory(null)}
        className={`flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
          activeCategory === null
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        }`}
      >
        <span>Discover</span>
      </button>

      <div className="my-2 h-px w-full bg-border/40" />

      {groups.map((group) => {
        const isActive = activeCategory === group.category;
        return (
          <button
            key={group.category}
            type="button"
            onClick={() => onSelectCategory(group.category)}
            className={`flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
              isActive
                ? "bg-muted text-foreground shadow-sm ring-1 ring-border"
                : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
            }`}
          >
            <span className="truncate">{group.category}</span>
            {isActive && (
              <span className="ml-2 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-background text-[10px] ring-1 ring-border/50">
                {group.apps.length}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
