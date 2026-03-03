export interface Album {
  id: string;
  handle: string;
  name: string;
  description?: string;
  privacy: string;
  imageCount?: number;
  coverUrl?: string | null;
  coverImageId?: string | null;
  _count?: { albumImages: number };
}

export interface AlbumImage {
  image_id: string;
  imageId?: string;
  name?: string;
  url?: string;
  originalUrl?: string;
  sort_order: number;
  image?: { id: string; name: string; originalUrl: string };
}

// Token used for authorization header (mirrors client.ts)
const TOKEN = import.meta.env.VITE_DEMO_TOKEN ?? "demo";

export async function albumFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export const privacyBadgeVariant = (p: string) =>
  p === "PUBLIC" ? "success" : p === "UNLISTED" ? "warning" : "default";
