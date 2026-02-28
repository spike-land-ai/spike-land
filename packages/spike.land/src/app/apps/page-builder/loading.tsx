import { Skeleton } from "@/components/ui/skeleton";

export default function PageBuilderLoading() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Toolbar */}
      <div className="border-b px-4 py-3 flex items-center gap-3">
        <Skeleton className="h-7 w-36" />
        <div className="flex-1" />
        <Skeleton className="h-8 w-20 rounded-md" />
        <Skeleton className="h-8 w-20 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
      <div className="flex flex-1 overflow-hidden">
        {/* Left component palette */}
        <div className="w-56 border-r p-3 space-y-2 hidden md:block">
          <Skeleton className="h-4 w-20 mb-3" />
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 p-2">
              <Skeleton className="h-6 w-6 rounded" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
        {/* Canvas */}
        <div className="flex-1 bg-muted/30 p-6 flex items-center justify-center">
          <div className="w-full max-w-2xl space-y-4">
            <Skeleton className="h-12 w-3/4 mx-auto rounded-xl" />
            <Skeleton className="h-6 w-1/2 mx-auto rounded-lg" />
            <Skeleton className="h-48 w-full rounded-2xl" />
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
          </div>
        </div>
        {/* Right properties panel */}
        <div className="w-64 border-l p-4 space-y-3 hidden lg:block">
          <Skeleton className="h-4 w-24 mb-3" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-8 w-full rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
