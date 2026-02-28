export default function AudioStudioLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col gap-4 p-6 animate-pulse">
      {/* Transport bar */}
      <div className="h-16 w-full rounded-xl bg-zinc-800/60" />
      {/* Track list */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-20 w-full rounded-xl bg-zinc-800/60" />
      ))}
      {/* Waveform */}
      <div className="h-32 w-full rounded-xl bg-zinc-800/60" />
    </div>
  );
}
