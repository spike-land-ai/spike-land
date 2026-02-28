"use client";

import { useCallback, useRef, useState } from "react";
import { CheckCircle2, FileAudio, Upload, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const ALLOWED_EXTENSIONS = ["wav", "mp3", "webm", "ogg", "flac", "aac", "m4a"];
const ALLOWED_MIME = ALLOWED_EXTENSIONS.map(ext => `audio/${ext}`);

interface TrackUploaderProps {
  onUpload: (file: File) => Promise<void>;
  progress: number;
  isUploading: boolean;
  hasActiveProject: boolean;
}

export function TrackUploader({
  onUpload,
  progress,
  isUploading,
  hasActiveProject,
}: TrackUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndUpload = useCallback(async (file: File) => {
    setError(null);
    setUploadedFile(null);

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError(
        `Unsupported format: .${ext}. Use ${ALLOWED_EXTENSIONS.join(", ")}.`,
      );
      return;
    }

    try {
      await onUpload(file);
      setUploadedFile(file.name);
      setTimeout(() => setUploadedFile(null), 3000);
    } catch {
      setError("Upload failed. Please try again.");
    }
  }, [onUpload]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) validateAndUpload(file);
    },
    [validateAndUpload],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) validateAndUpload(file);
      if (inputRef.current) inputRef.current.value = "";
    },
    [validateAndUpload],
  );

  if (!hasActiveProject) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-8 text-center">
        <p className="text-sm text-zinc-500">
          Select or create a project to upload tracks
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-6 transition-all cursor-pointer ${
          isDragOver
            ? "border-emerald-400 bg-emerald-500/10 scale-[1.01]"
            : isUploading
            ? "border-blue-400/50 bg-blue-500/5"
            : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
        }`}
        onDragOver={e => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !isUploading && inputRef.current?.click()}
        onKeyDown={e => {
          if ((e.key === "Enter" || e.key === " ") && !isUploading) {
            inputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Upload audio track"
        id="track-upload-zone"
      >
        {isUploading
          ? (
            <div className="flex flex-col items-center gap-3 w-full max-w-xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20 animate-pulse">
                <Upload className="h-5 w-5 text-blue-400" />
              </div>
              <div className="w-full">
                <Progress value={progress} className="h-2" />
                <p className="mt-1.5 text-xs text-blue-300 text-center font-mono">
                  {progress}% uploading…
                </p>
              </div>
            </div>
          )
          : uploadedFile
          ? (
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-medium">
                {uploadedFile} uploaded!
              </span>
            </div>
          )
          : (
            <>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                  isDragOver ? "bg-emerald-500/20" : "bg-white/5"
                }`}
              >
                <FileAudio
                  className={`h-5 w-5 ${isDragOver ? "text-emerald-400" : "text-zinc-400"}`}
                />
              </div>
              <div className="text-center">
                <p className="text-sm text-zinc-300">
                  <span className="font-medium text-emerald-400">
                    Click to upload
                  </span>{" "}
                  or drag and drop
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  {ALLOWED_EXTENSIONS.map(e => e.toUpperCase()).join(", ")} • Max 500MB
                </p>
              </div>
            </>
          )}
      </div>

      {error && (
        <div className="mt-2 flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">
          <X className="h-4 w-4 text-red-400 shrink-0" />
          <p className="text-xs text-red-300">{error}</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_MIME.join(",")}
        className="hidden"
        onChange={handleFileChange}
        id="track-file-input"
      />
    </div>
  );
}
