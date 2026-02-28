import { Skeleton } from "@/components/ui/skeleton";

export default function SocialAutopilotLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b px-6 py-4 flex items-center justify-between">
        <Skeleton className="h-7 w-44" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
      </div>
      <div className="flex h-[calc(100vh-57px)]">
        {/* Left: post queue */}
        <div className="w-72 border-r p-4 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-7 w-7 rounded-md" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-12 ml-auto rounded-full" />
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
        {/* Right: analytics dashboard */}
        <div className="flex-1 p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-xl border p-4 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
          <div className="rounded-xl border p-4 space-y-3">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
