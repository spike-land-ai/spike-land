import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Apps | Spike Land",
  description: "Explore interactive applications built with Next.js",
};

export default function AppsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
