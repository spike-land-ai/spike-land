export default function MusicCreatorLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col gap-4 p-6 animate-pulse">
      {/* Top toolbar */}
      <div className="h-14 w-full rounded-xl bg-zinc-800/60" />
      {/* Piano roll / sequencer area */}
      <div className="flex-1 min-h-[400px] w-full rounded-xl bg-zinc-800/60" />
      {/* Bottom controls */}
      <div className="h-20 w-full rounded-xl bg-zinc-800/60" />
    </div>
  );
}
