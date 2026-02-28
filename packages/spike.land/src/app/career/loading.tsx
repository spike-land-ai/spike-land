export default function CareerLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6 animate-pulse">
      <div className="h-10 w-48 rounded-lg bg-zinc-800" />
      <div className="h-6 w-80 rounded-lg bg-zinc-800" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-40 rounded-xl bg-zinc-800" />
        ))}
      </div>
    </div>
  );
}
