import type { Metadata } from "next";
import toolsManifest from "@/lib/docs/generated/tools-manifest.json";

export const metadata: Metadata = {
  title: "Connect | spike.land",
  description:
    `Connect with the spike.land MCP multiplexer. spike-cli lazy-loads ${toolsManifest.tools.length}+ tool definitions — AI agents see only the tools they need.`,
};

export default function ConnectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">
      <main className="flex-1">{children}</main>
    </div>
  );
}
