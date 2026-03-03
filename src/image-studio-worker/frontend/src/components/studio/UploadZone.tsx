import { useCallback } from "react";
import { Upload, FolderPlus } from "lucide-react";
import { toast } from "sonner";
import { eventBus } from "../../services/event-bus";

interface UploadZoneProps {
  onUploadComplete: (asset: {
    id: string;
    type: "image" | "cluster";
    url: string;
    name: string;
  }) => void;
}

export function UploadZone({ onUploadComplete }: UploadZoneProps) {
  const onDrop = useCallback(
    async (files: File[]) => {
      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} is not an image`);
          continue;
        }

        const toastId = toast.loading(`Uploading ${file.name}...`);

        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("name", file.name);

          const res = await fetch("/api/gallery/upload", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) throw new Error(`Upload failed: ${res.status}`);

          const data = (await res.json()) as { image: { id: string; name: string }; url: string };

          onUploadComplete({
            id: data.image.id,
            type: "image",
            url: data.url,
            name: data.image.name,
          });

          eventBus.emit("image:uploaded", {
            imageId: data.image.id,
            url: data.url,
            name: data.image.name,
          });
          eventBus.emit("gallery:updated", { reason: "upload" });

          toast.success(`${file.name} uploaded`, { id: toastId });
        } catch (err) {
          toast.error(err instanceof Error ? err.message : `Failed to upload ${file.name}`, {
            id: toastId,
          });
        }
      }
    },
    [onUploadComplete],
  );

  return (
    <div className="flex items-center gap-2">
      <label className="p-3 rounded-xl hover:bg-white/10 text-gray-400 hover:text-emerald-neon transition-all cursor-pointer group">
        <Upload className="w-5 h-5 group-hover:scale-110 transition-transform" />
        <input
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) onDrop(Array.from(e.target.files));
          }}
        />
      </label>
      <button
        className="p-3 rounded-xl hover:bg-white/10 text-gray-400 hover:text-blue-400 transition-all group"
        title="Upload Album"
      >
        <FolderPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
      </button>
    </div>
  );
}
