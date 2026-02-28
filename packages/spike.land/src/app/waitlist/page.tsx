import { WaitlistInlineForm } from "@/components/waitlist/WaitlistInlineForm";
import toolsManifest from "@/lib/docs/generated/tools-manifest.json";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Join the Waitlist | spike.land — Lazy-Load MCP Tools",
  description:
    "spike-cli multiplexes MCP servers and lazy-loads tool definitions — AI agents only see what they need.",
};

export default function WaitlistPage() {
  const count = toolsManifest.tools.length;

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/30 via-zinc-950 to-fuchsia-950/20" />
      <div className="relative z-10 flex flex-col items-center gap-8 px-4 max-w-lg w-full text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
          Your AI. Your tools. Zero wasted context.
        </h1>
        <p className="text-lg text-zinc-400 leading-relaxed">
          spike-cli lazy-loads MCP tool definitions into on-demand toolsets. Your AI agent sees only
          the tools it needs — smaller context windows, sharper responses, lower cost. Join the
          waitlist for early access.
        </p>

        <WaitlistInlineForm source="waitlist" className="w-full max-w-sm" />

        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-500 mt-4">
          <span>Lazy-load toolsets</span>
          <span className="w-px h-4 bg-zinc-700" />
          <span>{count}+ MCP tools</span>
          <span className="w-px h-4 bg-zinc-700" />
          <span>100% open source</span>
        </div>
      </div>
    </div>
  );
}
