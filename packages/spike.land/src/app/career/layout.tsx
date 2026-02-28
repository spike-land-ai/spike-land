import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Career Navigator | spike.land",
  description:
    "Explore career paths and opportunities with spike.land. AI-powered career navigation and skill development tools.",
};

export default function CareerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <main className="flex-1">{children}</main>
    </div>
  );
}
