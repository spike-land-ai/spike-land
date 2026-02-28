import { Skeleton } from "@/components/ui/skeleton";

export default function QaStudioLoading() {
  return (
    <div className="min-h-screen">
      <div className="space-y-6 p-8 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-32" />
        </div>
        {/* Dashboard grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
        {/* Browser automation panel */}
        <div className="border-t border-border/30 pt-6 space-y-3">
          <Skeleton className="h-4 w-36" />
          <div className="rounded-xl border p-4 space-y-3">
            <div className="flex gap-2">
              <Skeleton className="h-9 flex-1 rounded-md" />
              <Skeleton className="h-9 w-24 rounded-md" />
            </div>
            <Skeleton className="h-32 w-full rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
