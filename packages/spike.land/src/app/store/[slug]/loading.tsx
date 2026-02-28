export default function AppDetailLoading() {
  return (
    <div className="min-h-screen bg-black animate-pulse">
      <div className="mx-auto max-w-4xl px-4 py-12">
        {/* Header */}
        <div className="flex items-start gap-6 mb-8">
          <div className="h-20 w-20 rounded-2xl bg-white/10 flex-shrink-0" />
          <div className="flex flex-col gap-2 flex-1">
            <div className="h-8 w-56 rounded-lg bg-white/10" />
            <div className="h-5 w-80 rounded bg-white/5" />
            <div className="mt-2 flex gap-2">
              <div className="h-10 w-28 rounded-xl bg-white/10" />
              <div className="h-10 w-10 rounded-xl bg-white/5" />
            </div>
          </div>
        </div>
        {/* Description */}
        <div className="flex flex-col gap-2 mb-8">
          <div className="h-4 w-full rounded bg-white/5" />
          <div className="h-4 w-5/6 rounded bg-white/5" />
          <div className="h-4 w-4/5 rounded bg-white/5" />
        </div>
        {/* Features grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
          {[1, 2, 3].map(i => <div key={i} className="rounded-xl bg-white/5 p-4 h-24" />)}
        </div>
        {/* Rating section */}
        <div className="h-24 w-64 rounded-xl bg-white/5 mb-8" />
        {/* Reviews */}
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => <div key={i} className="rounded-xl bg-white/5 h-24" />)}
        </div>
      </div>
    </div>
  );
}
