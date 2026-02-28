export default function OccupationDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6 animate-pulse">
      <div className="h-10 w-64 rounded-lg bg-zinc-800" />
      <div className="h-4 w-40 rounded bg-zinc-800" />
      {/* Tab bar */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 w-24 rounded-md bg-zinc-800" />
        ))}
      </div>
      {/* Content cards */}
      <div className="h-60 w-full rounded-xl bg-zinc-800" />
      <div className="h-40 w-full rounded-xl bg-zinc-800" />
    </div>
  );
}
