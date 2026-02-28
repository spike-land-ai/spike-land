import { PhysicsBackgroundDynamic } from "@/components/landing/PhysicsBackgroundDynamic";

export default function PhysicsDemoPage() {
  return (
    <main className="relative min-h-screen w-full bg-zinc-950 text-white flex flex-col items-center justify-center overflow-hidden">
      {/* The background we want to see isolated */}
      <PhysicsBackgroundDynamic disabled={false} />

      <div className="z-10 text-center pointer-events-none space-y-4">
        <h1 className="text-5xl md:text-7xl font-black tracking-tight drop-shadow-2xl">
          Physics Background
        </h1>
        <p className="text-zinc-400 text-xl font-medium max-w-lg mx-auto drop-shadow-md">
          Isolated codespace for testing physics and WebGL performance.
        </p>
      </div>
    </main>
  );
}
