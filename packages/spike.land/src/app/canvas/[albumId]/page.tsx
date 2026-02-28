import type { GalleryImage } from "@/lib/canvas/types";
import prisma from "@/lib/prisma";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CanvasClient } from "./CanvasClient";

interface PageProps {
  params: Promise<{ albumId: string; }>;
  searchParams: Promise<{
    token?: string;
    rotation?: string;
    order?: string;
    interval?: string;
  }>;
}

type RotationValue = 0 | 90 | 180 | 270;
type OrderValue = "album" | "random";

function parseRotation(value: string | undefined): RotationValue {
  const validRotations: RotationValue[] = [0, 90, 180, 270];
  const parsed = parseInt(value || "0", 10);
  return validRotations.includes(parsed as RotationValue)
    ? (parsed as RotationValue)
    : 0;
}

function parseOrder(value: string | undefined): OrderValue {
  return value === "random" ? "random" : "album";
}

function parseInterval(value: string | undefined): number {
  const parsed = parseInt(value || "10", 10);
  if (isNaN(parsed) || parsed < 5) return 5;
  if (parsed > 60) return 60;
  return parsed;
}

async function getAlbumWithImages(albumId: string) {
  return prisma.album.findUnique({
    where: { id: albumId },
    include: {
      albumImages: {
        orderBy: { sortOrder: "asc" },
        include: {
          image: {
            include: {
              enhancementJobs: {
                where: { status: "COMPLETED", enhancedUrl: { not: null } },
                orderBy: { createdAt: "desc" },
                take: 1,
              },
            },
          },
        },
      },
    },
  });
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { albumId } = await params;
  const album = await getAlbumWithImages(albumId);

  if (!album) {
    return {
      title: "Album Not Found - Spike Land Canvas",
      description: "The requested album could not be found.",
    };
  }

  return {
    title: `${album.name} - Canvas Display`,
    description: `Viewing ${album.name} on Canvas`,
  };
}

export default async function CanvasPage({ params, searchParams }: PageProps) {
  const { albumId } = await params;
  const { token, rotation, order, interval } = await searchParams;

  const album = await getAlbumWithImages(albumId);

  if (!album) {
    notFound();
  }

  // Access control based on privacy setting
  const isPublic = album.privacy === "PUBLIC";
  const isUnlisted = album.privacy === "UNLISTED";
  const isPrivate = album.privacy === "PRIVATE";

  // PUBLIC: open to all
  // UNLISTED: require valid token in searchParams
  // PRIVATE: require valid token
  if (isPrivate || isUnlisted) {
    const hasValidToken = token && album.shareToken
      && token === album.shareToken;
    if (!hasValidToken) {
      notFound();
    }
  }

  // If explicitly public, no token needed
  if (!isPublic && !isUnlisted && !isPrivate) {
    // This shouldn't happen based on schema, but guard against it
    notFound();
  }

  // Parse settings from URL params
  const settings = {
    rotation: parseRotation(rotation),
    order: parseOrder(order),
    interval: parseInterval(interval),
  };

  // Transform album images to GalleryImage format with both URLs
  const images: GalleryImage[] = album.albumImages.map(ai => {
    // Get the best completed enhancement job
    const enhancedJob = ai.image.enhancementJobs.find(
      job => job.status === "COMPLETED" && job.enhancedUrl,
    );

    // Use enhanced dimensions if available, otherwise original
    const width = enhancedJob?.enhancedWidth || ai.image.originalWidth;
    const height = enhancedJob?.enhancedHeight || ai.image.originalHeight;

    return {
      id: ai.image.id,
      // url field for backward compatibility (uses enhanced if available)
      url: enhancedJob?.enhancedUrl || ai.image.originalUrl,
      name: ai.image.name,
      width,
      height,
      // New fields for Smart Gallery
      originalUrl: ai.image.originalUrl,
      enhancedUrl: enhancedJob?.enhancedUrl || null,
    };
  });

  return (
    <CanvasClient
      images={images}
      settings={settings}
      albumName={album.name}
    />
  );
}
