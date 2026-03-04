import {
  createContext,
  type DragEvent,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import { eventBus } from "../services/event-bus";

type DropZoneType = "chat" | "gallery" | "canvas" | null;

interface DragDropContextValue {
  isDragging: boolean;
  activeZone: DropZoneType;
  registerZone: (id: string, type: DropZoneType, element: HTMLElement) => void;
  unregisterZone: (id: string) => void;
}

const DragDropCtx = createContext<DragDropContextValue>({
  isDragging: false,
  activeZone: null,
  registerZone: () => {},
  unregisterZone: () => {},
});

export function useDragDrop() {
  return useContext(DragDropCtx);
}

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"];
const MAX_SIZE_MB = 50;

interface ZoneInfo {
  type: DropZoneType;
  element: HTMLElement;
}

export function DragDropProvider({ children }: { children: ReactNode }) {
  const [isDragging, setIsDragging] = useState(false);
  const [activeZone, setActiveZone] = useState<DropZoneType>(null);
  const [zones] = useState(() => new Map<string, ZoneInfo>());
  const [dragCounter, setDragCounter] = useState(0);

  const registerZone = useCallback(
    (id: string, type: DropZoneType, element: HTMLElement) => {
      zones.set(id, { type, element });
    },
    [zones],
  );

  const unregisterZone = useCallback(
    (id: string) => {
      zones.delete(id);
    },
    [zones],
  );

  const detectZone = useCallback(
    (e: DragEvent): DropZoneType => {
      const target = e.target as HTMLElement;
      for (const [, zone] of zones) {
        if (zone.element.contains(target)) {
          return zone.type;
        }
      }
      return "gallery";
    },
    [zones],
  );

  const validateFiles = (files: FileList): File[] => {
    return Array.from(files).filter((file) => {
      if (!ACCEPTED_TYPES.includes(file.type)) return false;
      if (file.size > MAX_SIZE_MB * 1024 * 1024) return false;
      return true;
    });
  };

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragCounter((c) => c + 1);
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragCounter((c) => {
      const next = c - 1;
      if (next <= 0) {
        setIsDragging(false);
        setActiveZone(null);
        return 0;
      }
      return next;
    });
  }, []);

  const handleDragOver = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      const zone = detectZone(e);
      setActiveZone(zone);
    },
    [detectZone],
  );

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      setActiveZone(null);
      setDragCounter(0);

      const files = validateFiles(e.dataTransfer.files);
      if (files.length === 0) return;

      const zone = detectZone(e);

      for (const file of files) {
        switch (zone) {
          case "chat":
            eventBus.emit("chat:image-attached", { file });
            break;
          case "gallery":
            uploadToGallery(file);
            break;
          case "canvas":
            eventBus.emit("image:uploaded", {
              imageId: "",
              url: URL.createObjectURL(file),
              name: file.name,
            });
            break;
          default:
            uploadToGallery(file);
        }
      }
    },
    [detectZone],
  );

  // Suppress unused variable warning — dragCounter is used internally via setDragCounter
  void dragCounter;

  return (
    <DragDropCtx.Provider value={{ isDragging, activeZone, registerZone, unregisterZone }}>
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="contents"
      >
        {children}
        {isDragging && (
          <div className="fixed inset-0 z-[200] pointer-events-none">
            <div className="absolute inset-0 bg-obsidian-950/60 backdrop-blur-sm" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-obsidian-900/90 border-2 border-dashed border-amber-neon/50 shadow-2xl">
                <div className="w-16 h-16 rounded-2xl bg-amber-neon/10 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-amber-neon"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-white uppercase tracking-tight">
                    {activeZone === "chat" && "Attach to Chat"}
                    {activeZone === "canvas" && "Add to Canvas"}
                    {(activeZone === "gallery" || !activeZone) && "Upload to Gallery"}
                  </p>
                  <p className="text-[10px] text-gray-500 font-medium mt-1">
                    Drop image files here
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DragDropCtx.Provider>
  );
}

async function uploadToGallery(file: File) {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", file.name);

    const geminiKey = localStorage.getItem("gemini_api_key");
    const res = await fetch("/api/gallery/upload", {
      method: "POST",
      headers: {
        ...(geminiKey ? { "X-Gemini-Key": geminiKey } : {}),
      },
      body: formData,
    });

    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    const data = (await res.json()) as {
      image: { id: string; name: string };
      url: string;
    };
    eventBus.emit("image:uploaded", {
      imageId: data.image.id,
      url: data.url,
      name: data.image.name,
    });
    eventBus.emit("gallery:updated", { reason: "upload" });
  } catch (err) {
    console.error("Gallery upload failed:", err);
  }
}
