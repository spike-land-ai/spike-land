import { Skeleton } from "@/components/ui/skeleton";

export default function AiOrchestratorLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b px-6 py-4 flex items-center justify-between">
        <Skeleton className="h-7 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
      </div>
      <div className="flex h-[calc(100vh-57px)]">
        {/* Pipeline panel */}
        <div className="w-72 border-r p-4 space-y-4">
          <Skeleton className="h-5 w-24 mb-2" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          ))}
        </div>
        {/* Canvas / output area */}
        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
            <div className="rounded-xl border p-4 space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-32 w-full rounded-lg" />
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>
            <div className="rounded-xl border p-4 space-y-3">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-48 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
