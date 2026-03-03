import { useState } from "react";
import {
  FolderOpen,
  Plus,
  Trash2,
  GripVertical,
  ArrowLeft,
  Share2,
  Images,
  Star,
  MoreVertical,
  CheckCircle2,
} from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type { DropResult } from "@hello-pangea/dnd";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button, Modal, ImagePicker, Badge } from "@/components/ui";
import { useLightbox } from "@/contexts/LightboxContext";
import { callTool } from "@/api/client";
import type { Album, AlbumImage } from "./albumTypes";
import { albumFetch, privacyBadgeVariant } from "./albumTypes";
import { AlbumDeleteModal } from "./AlbumDeleteModal";

interface AlbumDetailProps {
  selectedAlbum: Album;
  albums: Album[];
  onBack: () => void;
}

export function AlbumDetail({ selectedAlbum, albums, onBack }: AlbumDetailProps) {
  const queryClient = useQueryClient();
  const { openLightbox } = useLightbox();

  const [showAddImage, setShowAddImage] = useState(false);
  const [addImageId, setAddImageId] = useState("");
  const [addingImage, setAddingImage] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Album | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [imageMenu, setImageMenu] = useState<string | null>(null);
  const [settingCover, setSettingCover] = useState<string | null>(null);
  const [dragOverAlbumId, setDragOverAlbumId] = useState<string | null>(null);
  const [currentAlbum, setCurrentAlbum] = useState<Album>(selectedAlbum);

  const { data: albumDetailData, isLoading: loadingImages } = useQuery({
    queryKey: ["albumDetail", currentAlbum.id],
    queryFn: async () => {
      const data = await albumFetch<{
        album: Album;
        images: Array<{
          imageId: string;
          sortOrder: number;
          image: { id: string; name: string; originalUrl: string };
        }>;
      }>(`/api/gallery/album/${currentAlbum.id}`);
      return data;
    },
  });

  const albumImages: AlbumImage[] = (albumDetailData?.images ?? []).map((item) => ({
    image_id: item.imageId,
    imageId: item.imageId,
    name: item.image.name,
    url: item.image.originalUrl,
    sort_order: item.sortOrder,
    image: item.image,
  }));

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await callTool("img_album_delete", { album_handle: deleteTarget.handle });
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["albums"] });
      toast.success("Album deleted!");
      onBack();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const handleAddImage = async () => {
    if (!addImageId.trim()) return;
    setAddingImage(true);
    try {
      await albumFetch(`/api/gallery/album/${currentAlbum.id}/images`, {
        method: "POST",
        body: JSON.stringify({ imageIds: [addImageId] }),
      });
      setShowAddImage(false);
      setAddImageId("");
      queryClient.invalidateQueries({ queryKey: ["albumDetail", currentAlbum.id] });
      queryClient.invalidateQueries({ queryKey: ["albums"] });
      toast.success("Image added to album");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add image");
    } finally {
      setAddingImage(false);
    }
  };

  const handleRemoveImage = async (imageId: string) => {
    try {
      await albumFetch(`/api/gallery/album/${currentAlbum.id}/images`, {
        method: "DELETE",
        body: JSON.stringify({ imageIds: [imageId] }),
      });
      queryClient.invalidateQueries({ queryKey: ["albumDetail", currentAlbum.id] });
      queryClient.invalidateQueries({ queryKey: ["albums"] });
      toast.success("Image removed from album");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Remove failed");
    }
  };

  const handleSetCover = async (imageId: string) => {
    setSettingCover(imageId);
    setImageMenu(null);
    try {
      await albumFetch(`/api/gallery/album/${currentAlbum.id}`, {
        method: "PATCH",
        body: JSON.stringify({ coverImageId: imageId }),
      });
      const img = albumImages.find((i) => i.image_id === imageId);
      const coverUrl = img?.url ?? img?.image?.originalUrl ?? null;
      setCurrentAlbum((prev) => ({ ...prev, coverImageId: imageId, coverUrl }));
      queryClient.invalidateQueries({ queryKey: ["albums"] });
      toast.success("Cover image set!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to set cover");
    } finally {
      setSettingCover(null);
    }
  };

  const handleShareAlbum = async () => {
    const url = `${window.location.origin}/gallery/${currentAlbum.handle}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Public link copied!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const onDragEnd = async (result: DropResult) => {
    setDragOverAlbumId(null);
    if (!result.destination) return;

    const destId = result.destination.droppableId;

    if (destId.startsWith("album-target-")) {
      const targetAlbumId = destId.replace("album-target-", "");
      const imageId = result.draggableId;
      const targetAlbum = albums.find((a) => a.id === targetAlbumId);
      if (!targetAlbum) return;
      try {
        await albumFetch(`/api/gallery/album/${targetAlbumId}/images`, {
          method: "POST",
          body: JSON.stringify({ imageIds: [imageId] }),
        });
        queryClient.invalidateQueries({ queryKey: ["albums"] });
        toast.success(`Added to "${targetAlbum.name}"`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Move failed");
      }
      return;
    }

    if (destId === "album-images") {
      const newImages = Array.from(albumImages);
      const [moved] = newImages.splice(result.source.index, 1);
      newImages.splice(result.destination.index, 0, moved);
      queryClient.setQueryData(["albumDetail", currentAlbum.id], {
        ...albumDetailData,
        images: newImages.map((img, i) => ({
          imageId: img.image_id,
          sortOrder: i,
          image: img.image ?? {
            id: img.image_id,
            name: img.name ?? "",
            originalUrl: img.url ?? "",
          },
        })),
      });
    }
  };

  const otherAlbums = albums.filter((a) => a.id !== currentAlbum.id);

  return (
    <DragDropContext
      onDragEnd={onDragEnd}
      onDragUpdate={(update) => {
        const destId = update.destination?.droppableId;
        if (destId?.startsWith("album-target-")) {
          setDragOverAlbumId(destId.replace("album-target-", ""));
        } else {
          setDragOverAlbumId(null);
        }
      }}
    >
      <div className="flex gap-6">
        {/* Main image area */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white transition-all duration-300"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                  {currentAlbum.name}
                </h2>
                {currentAlbum.description && (
                  <p className="text-gray-400 text-sm mt-0.5">{currentAlbum.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={privacyBadgeVariant(currentAlbum.privacy)}>
                {currentAlbum.privacy}
              </Badge>
              {currentAlbum.privacy === "PUBLIC" && (
                <Button variant="secondary" size="sm" onClick={handleShareAlbum}>
                  <Share2 className="w-3.5 h-3.5" />
                  Share
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={() => setShowAddImage(true)}>
                <Plus className="w-3.5 h-3.5" />
                Add Image
              </Button>
              <Button variant="danger" size="sm" onClick={() => setDeleteTarget(currentAlbum)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Image grid */}
          {loadingImages ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-delayed-show">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square bg-obsidian-900 rounded-[1.5rem] animate-pulse border border-white/5"
                />
              ))}
            </div>
          ) : albumImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 rounded-[1.5rem] border border-white/5 bg-obsidian-900/40">
              <FolderOpen className="w-12 h-12 text-gray-600 mb-4" />
              <p className="text-gray-500 font-black uppercase tracking-widest text-sm">
                No images yet
              </p>
              <p className="text-gray-600 text-xs mt-1">Add images to this album</p>
              <Button className="mt-6" size="sm" onClick={() => setShowAddImage(true)}>
                <Plus className="w-3.5 h-3.5" />
                Add Image
              </Button>
            </div>
          ) : (
            <Droppable droppableId="album-images" direction="horizontal">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                >
                  {albumImages.map((img, index) => {
                    const isCover =
                      currentAlbum.coverImageId === img.image_id ||
                      (!currentAlbum.coverImageId && index === 0);

                    return (
                      <Draggable key={img.image_id} draggableId={img.image_id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`group relative bg-obsidian-900 border rounded-[1.5rem] overflow-hidden transition-all duration-300 shadow-lg ${
                              snapshot.isDragging
                                ? "border-amber-neon/50 shadow-amber-neon/10 scale-105 rotate-1"
                                : "border-white/5 hover:border-white/20 hover:shadow-2xl"
                            }`}
                          >
                            {/* Drag handle */}
                            <div
                              {...provided.dragHandleProps}
                              className="absolute top-3 left-3 p-1.5 bg-black/60 rounded-lg backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity cursor-grab z-10 border border-white/10"
                            >
                              <GripVertical className="w-3.5 h-3.5 text-white" />
                            </div>

                            {/* Cover star badge */}
                            {isCover && (
                              <div className="absolute top-3 right-3 z-10">
                                <div className="p-1 rounded-lg bg-amber-neon/20 border border-amber-neon/40 backdrop-blur-md">
                                  <Star className="w-3 h-3 fill-amber-neon text-amber-neon" />
                                </div>
                              </div>
                            )}

                            {/* Image */}
                            {img.url ? (
                              <div
                                className="aspect-square cursor-pointer relative overflow-hidden"
                                onClick={() => {
                                  const slides = albumImages
                                    .map((i) => ({ src: i.url ?? "", alt: i.name ?? "" }))
                                    .filter((s) => s.src);
                                  openLightbox(index, slides);
                                }}
                              >
                                <img
                                  src={img.url}
                                  alt={img.name ?? ""}
                                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
                              </div>
                            ) : (
                              <div className="aspect-square bg-obsidian-950 flex items-center justify-center">
                                <Images className="w-8 h-8 text-gray-700" />
                              </div>
                            )}

                            {/* Footer */}
                            <div className="p-3 bg-obsidian-900/40 backdrop-blur-xl border-t border-white/5">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 truncate">
                                  {img.name ?? img.image_id.slice(0, 8)}
                                </span>
                                <div className="relative shrink-0">
                                  <button
                                    onClick={() =>
                                      setImageMenu(
                                        imageMenu === img.image_id ? null : img.image_id,
                                      )
                                    }
                                    className={`p-1 rounded-lg transition-all ${
                                      imageMenu === img.image_id
                                        ? "bg-amber-neon text-obsidian-950"
                                        : "text-gray-600 hover:text-white hover:bg-white/10"
                                    }`}
                                  >
                                    <MoreVertical className="w-3 h-3" />
                                  </button>
                                  {imageMenu === img.image_id && (
                                    <>
                                      <div
                                        className="fixed inset-0 z-[100]"
                                        onClick={() => setImageMenu(null)}
                                      />
                                      <div className="absolute right-0 bottom-8 z-[110] bg-obsidian-900 border border-white/10 rounded-xl shadow-2xl py-1.5 min-w-[160px]">
                                        <button
                                          onClick={() => handleSetCover(img.image_id)}
                                          disabled={settingCover === img.image_id}
                                          className="w-full text-left px-3 py-2 text-[9px] font-black uppercase tracking-widest text-amber-neon hover:bg-amber-neon/5 flex items-center gap-2 disabled:opacity-50"
                                        >
                                          {settingCover === img.image_id ? (
                                            <CheckCircle2 className="w-3 h-3" />
                                          ) : (
                                            <Star className="w-3 h-3" />
                                          )}
                                          Set as Cover
                                        </button>
                                        <button
                                          onClick={() => {
                                            setImageMenu(null);
                                            handleRemoveImage(img.image_id);
                                          }}
                                          className="w-full text-left px-3 py-2 text-[9px] font-black uppercase tracking-widest text-red-400 hover:bg-red-500/5 flex items-center gap-2"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                          Remove
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          )}
        </div>

        {/* Album sidebar: drag targets for cross-album move */}
        {otherAlbums.length > 0 && (
          <div className="w-52 shrink-0 space-y-2">
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-600 px-1 pb-1">
              Drag image to add to album
            </p>
            {otherAlbums.map((album) => (
              <Droppable key={album.id} droppableId={`album-target-${album.id}`}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`relative rounded-2xl border p-3 transition-all duration-200 min-h-[60px] ${
                      dragOverAlbumId === album.id
                        ? "border-amber-neon/60 bg-amber-neon/5 shadow-lg shadow-amber-neon/10"
                        : "border-white/5 bg-obsidian-900/40 hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {album.coverUrl ? (
                        <img
                          src={album.coverUrl}
                          alt={album.name}
                          className="w-8 h-8 rounded-lg object-cover shrink-0 border border-white/10"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-obsidian-950 flex items-center justify-center border border-white/5 shrink-0">
                          <FolderOpen className="w-4 h-4 text-gray-700" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-300 truncate">
                          {album.name}
                        </p>
                        <p className="text-[7px] font-black uppercase tracking-widest text-gray-600 mt-0.5">
                          {album._count?.albumImages ?? album.imageCount ?? 0} images
                        </p>
                      </div>
                    </div>
                    {/* Hidden placeholder keeps droppable functional */}
                    <div className="hidden">{provided.placeholder}</div>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        )}
      </div>

      {/* Add Image Modal */}
      <Modal open={showAddImage} onClose={() => setShowAddImage(false)} title="Add Image to Album">
        <div className="space-y-4">
          <ImagePicker
            label="Select Image"
            value={addImageId}
            onChange={setAddImageId}
            placeholder="Choose an image..."
          />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowAddImage(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddImage} loading={addingImage} disabled={!addImageId.trim()}>
              Add
            </Button>
          </div>
        </div>
      </Modal>

      <AlbumDeleteModal
        deleteTarget={deleteTarget}
        deleting={deleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </DragDropContext>
  );
}
