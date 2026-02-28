export default function TabletopSimulatorLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 animate-pulse">
      <div className="w-full max-w-5xl space-y-6">
        {/* Table surface */}
        <div className="aspect-video w-full rounded-2xl bg-zinc-800/60" />
        {/* Player panels row */}
        <div className="flex gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 flex-1 rounded-xl bg-zinc-800/60" />
          ))}
        </div>
      </div>
    </div>
  );
}
