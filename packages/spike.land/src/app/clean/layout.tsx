import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "CleanSweep | Spike Land",
  description: "ADHD-friendly gamified cleaning assistant",
};

export default function CleanLayout({ children }: { children: ReactNode; }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="container max-w-2xl px-4 py-6 flex-1">{children}</main>
    </div>
  );
}
