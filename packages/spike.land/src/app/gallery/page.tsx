import { GalleryClient } from "./GalleryClient";

export const metadata = {
  title: "Public Gallery | Spike Land",
  description: "Explore AI-enhanced images created by the community.",
};

export default function GalleryPage() {
  return (
    <div className="container py-12 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Community Gallery</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Explore the best AI-enhanced images created by our users.
        </p>
      </div>

      <GalleryClient />
    </div>
  );
}
