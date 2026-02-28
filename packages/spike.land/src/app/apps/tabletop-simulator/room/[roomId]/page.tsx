import RoomClient from "./RoomClient";

// Ensure the page takes valid Next.js params
interface PageProps {
  params: Promise<{ roomId: string; }>;
}

export default async function RoomPage({ params }: PageProps) {
  const { roomId } = await params;
  return <RoomClient roomId={roomId} />;
}
