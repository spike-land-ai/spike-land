import { toast } from "sonner";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui";
import type { Album } from "./albumTypes";
import { albumFetch } from "./albumTypes";
import { AlbumGrid } from "./AlbumGrid";
import { AlbumDetail } from "./AlbumDetail";
import { AlbumCreateModal } from "./AlbumCreateModal";
import { AlbumDeleteModal } from "./AlbumDeleteModal";
import { callTool } from "@/api/client";

export function Albums() {
  const queryClient = useQueryClient();

  // Create modal state
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPrivacy, setNewPrivacy] = useState("PRIVATE");
  const [creating, setCreating] = useState(false);

  // Selected album for detail view
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);

  // Delete confirm (from grid view)
  const [deleteTarget, setDeleteTarget] = useState<Album | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: albumsData, isLoading: loading } = useQuery({
    queryKey: ["albums"],
    queryFn: async () => {
      const data = await albumFetch<{ albums: Album[] }>("/api/gallery/albums");
      return data.albums ?? [];
    },
  });
  const albums = albumsData ?? [];

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await albumFetch("/api/gallery/album", {
        method: "POST",
        body: JSON.stringify({
          name: newName,
          description: newDesc || undefined,
          privacy: newPrivacy,
        }),
      });
      setShowCreate(false);
      setNewName("");
      setNewDesc("");
      queryClient.invalidateQueries({ queryKey: ["albums"] });
      toast.success("Album created!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Create failed");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await callTool("img_album_delete", { album_handle: deleteTarget.handle });
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["albums"] });
      toast.success("Album deleted!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const handleShareAlbum = async (album: Album) => {
    const url = `${window.location.origin}/gallery/${album.handle}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Public link copied!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  if (selectedAlbum) {
    return (
      <AlbumDetail
        selectedAlbum={selectedAlbum}
        albums={albums}
        onBack={() => setSelectedAlbum(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Albums</h2>
          <p className="text-gray-500 text-sm mt-1 font-black uppercase tracking-widest">
            {albums.length} {albums.length === 1 ? "album" : "albums"}
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" />
          New Album
        </Button>
      </div>

      <AlbumGrid
        albums={albums}
        loading={loading}
        onOpen={(album) => setSelectedAlbum(album)}
        onDelete={(album) => setDeleteTarget(album)}
        onShare={handleShareAlbum}
        onCreateClick={() => setShowCreate(true)}
      />

      <AlbumCreateModal
        open={showCreate}
        creating={creating}
        newName={newName}
        newDesc={newDesc}
        newPrivacy={newPrivacy}
        onClose={() => setShowCreate(false)}
        onNameChange={setNewName}
        onDescChange={setNewDesc}
        onPrivacyChange={setNewPrivacy}
        onCreate={handleCreate}
      />

      <AlbumDeleteModal
        deleteTarget={deleteTarget}
        deleting={deleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
