const API_BASE = "";
const TOKEN = import.meta.env.VITE_DEMO_TOKEN ?? "demo";

export interface ToolResult {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}

export interface ToolInputSchema {
  type: "object";
  properties: Record<
    string,
    {
      type?: string;
      enum?: string[];
      description?: string;
      items?: { type: string };
      default?: unknown;
    }
  >;
  required?: string[];
}

export interface ToolInfo {
  name: string;
  description: string;
  category: string;
  tier: string;
  inputSchema?: ToolInputSchema;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const geminiKey = localStorage.getItem("gemini_api_key");
  const imageModel = localStorage.getItem("pref_image_model");
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
      ...(geminiKey ? { "X-Gemini-Key": geminiKey } : {}),
      ...(imageModel ? { "X-Image-Model": imageModel } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function callTool(
  name: string,
  args: Record<string, unknown> = {},
): Promise<ToolResult> {
  const { result } = await apiFetch<{ result: ToolResult }>("/api/tool", {
    method: "POST",
    body: JSON.stringify({ name, arguments: args }),
  });
  return result;
}

export function parseToolResult<T = unknown>(result: ToolResult): T {
  if (result.isError) {
    const text = result.content[0]?.text ?? "Unknown error";
    throw new Error(text);
  }
  const text = result.content[0]?.text;
  if (!text) throw new Error("Empty result");
  return JSON.parse(text) as T;
}

export async function listTools(): Promise<ToolInfo[]> {
  const { tools } = await apiFetch<{ tools: ToolInfo[] }>("/api/tools");
  return tools;
}

// ── Gallery API ──

export interface GalleryImage {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  originalUrl: string;
  originalWidth: number;
  originalHeight: number;
  originalSizeBytes: number;
  originalFormat: string;
  isPublic: boolean;
  viewCount: number;
  tags: string[];
  shareToken: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GalleryAlbum {
  id: string;
  handle: string;
  name: string;
}

export interface GalleryResponse {
  album: GalleryAlbum;
  images: GalleryImage[];
  nextCursor: string | null;
}

export async function fetchGallery(opts: {
  cursor?: string;
  limit?: number;
  search?: string;
  tag?: string;
}): Promise<GalleryResponse> {
  const params = new URLSearchParams();
  if (opts.cursor) params.set("cursor", opts.cursor);
  if (opts.limit) params.set("limit", String(opts.limit));
  if (opts.search) params.set("search", opts.search);
  if (opts.tag) params.set("tag", opts.tag);
  const qs = params.toString();
  return apiFetch<GalleryResponse>(`/api/gallery${qs ? `?${qs}` : ""}`);
}

export async function uploadToGallery(
  file: File,
  opts?: { name?: string; tags?: string[]; albumId?: string },
): Promise<{ image: GalleryImage; url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  if (opts?.name) formData.append("name", opts.name);
  if (opts?.tags?.length) formData.append("tags", JSON.stringify(opts.tags));
  if (opts?.albumId) formData.append("albumId", opts.albumId);

  const geminiKey = localStorage.getItem("gemini_api_key");
  const res = await fetch(`${API_BASE}/api/gallery/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      ...(geminiKey ? { "X-Gemini-Key": geminiKey } : {}),
    },
    body: formData,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed ${res.status}: ${text}`);
  }
  return res.json();
}

export async function deleteGalleryImage(imageId: string): Promise<void> {
  await apiFetch(`/api/gallery/image/${imageId}`, { method: "DELETE" });
}
