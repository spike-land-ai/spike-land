import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SharePageClient } from "./SharePageClient";

interface SharePageProps {
  params: Promise<{ token: string; }>;
}

async function getImageByShareToken(token: string) {
  const image = await prisma.enhancedImage.findUnique({
    where: {
      shareToken: token,
    },
    include: {
      enhancementJobs: {
        where: {
          status: "COMPLETED",
          enhancedUrl: {
            not: null,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  });

  return image;
}

async function incrementViewCount(imageId: string) {
  try {
    await prisma.enhancedImage.update({
      where: { id: imageId },
      data: { viewCount: { increment: 1 } },
    });
  } catch (error) {
    logger.error("Failed to increment view count", error);
  }
}

export async function generateMetadata({
  params,
}: SharePageProps): Promise<Metadata> {
  const { token } = await params;
  const image = await getImageByShareToken(token);

  if (!image) {
    return {
      title: "Image Not Found - Pixel",
      description: "The requested image could not be found.",
    };
  }

  // Construct absolute URL for the OG image
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    || process.env.NEXT_PUBLIC_APP_URL
    || "http://localhost:3000";
  const protocol = baseUrl.startsWith("http") ? "" : "https://";
  const ogImageUrl = `${protocol}${baseUrl}/share/${token}/opengraph-image`;

  return {
    title: `${image.name} - Enhanced with Pixel`,
    description: image.description
      ?? `View this AI-enhanced image created with Pixel`,
    openGraph: {
      title: `${image.name} - Enhanced with Pixel`,
      description: image.description
        ?? `View this AI-enhanced image created with Pixel`,
      type: "website",
      siteName: "Pixel - AI Image Enhancement",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${image.name} - Before and After`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${image.name} - Enhanced with Pixel`,
      description: image.description
        ?? `View this AI-enhanced image created with Pixel`,
      images: [ogImageUrl],
    },
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;

  const image = await getImageByShareToken(token);

  if (!image) {
    notFound();
  }

  const latestEnhancement = image.enhancementJobs[0];

  if (!latestEnhancement?.enhancedUrl) {
    notFound();
  }

  await incrementViewCount(image.id);

  return (
    <SharePageClient
      imageName={image.name}
      description={image.description}
      originalUrl={image.originalUrl}
      enhancedUrl={latestEnhancement.enhancedUrl}
      originalWidth={image.originalWidth}
      originalHeight={image.originalHeight}
      enhancedWidth={latestEnhancement.enhancedWidth}
      enhancedHeight={latestEnhancement.enhancedHeight}
      shareToken={token}
    />
  );
}
