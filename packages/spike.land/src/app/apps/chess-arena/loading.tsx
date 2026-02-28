export default function ChessArenaLoading() {
  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-zinc-950 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl space-y-6 animate-pulse">
        {/* Board placeholder */}
        <div className="aspect-square max-w-md mx-auto rounded-xl bg-zinc-800/60" />
        {/* Controls row */}
        <div className="flex gap-3 justify-center">
          <div className="h-10 w-28 rounded-lg bg-zinc-800/60" />
          <div className="h-10 w-28 rounded-lg bg-zinc-800/60" />
        </div>
      </div>
    </div>
  );
}
