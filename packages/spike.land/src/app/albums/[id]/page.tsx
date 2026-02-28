import { AlbumDetailClient } from "./AlbumDetailClient";

interface PageProps {
  params: Promise<{ id: string; }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return {
    title: `Album - Spike Land`,
    description: `View album ${id}`,
  };
}

export default async function AlbumDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <AlbumDetailClient albumId={id} />;
}
