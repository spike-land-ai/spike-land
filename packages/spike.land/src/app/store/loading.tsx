export default function StoreLoading() {
  return (
    <div className="min-h-screen bg-black">
      {/* Hero skeleton */}
      <div className="animate-pulse bg-gradient-to-b from-zinc-900 to-black px-4 py-16 text-center">
        <div className="mx-auto h-8 w-48 rounded-full bg-white/10 mb-4" />
        <div className="mx-auto h-12 w-96 rounded-xl bg-white/10 mb-3" />
        <div className="mx-auto h-6 w-64 rounded-lg bg-white/5" />
      </div>
      {/* Grid skeleton */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from(
            { length: 12 },
            (_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl bg-white/5 p-4 flex flex-col gap-3"
              >
                <div className="h-12 w-12 rounded-xl bg-white/10" />
                <div className="h-5 w-3/4 rounded bg-white/10" />
                <div className="h-4 w-full rounded bg-white/5" />
                <div className="h-4 w-5/6 rounded bg-white/5" />
                {/* Rating row */}
                <div className="h-3 w-2/3 rounded bg-white/5" />
                {/* Install count row */}
                <div className="h-3 w-1/2 rounded bg-white/5" />
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
