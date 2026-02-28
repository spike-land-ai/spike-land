import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Enhanced Image Preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 3600; // Cache for 1 hour

interface ImageProps {
  params: Promise<{ token: string; }>;
}

/**
 * Validates that an image URL is from our allowed R2 domain
 * to prevent SSRF attacks from loading arbitrary external URLs
 */
export function isAllowedImageUrl(url: string): boolean {
  const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;
  if (!publicUrl) return false;
  return url.startsWith(publicUrl);
}

/**
 * Creates a fallback OG image when the actual image is unavailable
 */
function createFallbackImage(): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)",
          color: "white",
          fontSize: 48,
          fontWeight: "bold",
          fontFamily: "sans-serif",
        }}
      >
        Image Not Found
      </div>
    ),
    { ...size },
  );
}

export default async function Image(
  { params }: ImageProps,
): Promise<ImageResponse> {
  try {
    const { token } = await params;

    const image = await prisma.enhancedImage.findUnique({
      where: { shareToken: token },
      include: {
        enhancementJobs: {
          where: {
            status: "COMPLETED",
            enhancedUrl: { not: null },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    const originalUrl = image?.originalUrl;
    const enhancedUrl = image?.enhancementJobs[0]?.enhancedUrl;

    // Validate URLs to prevent SSRF attacks
    const hasValidOriginal = originalUrl && isAllowedImageUrl(originalUrl);
    const hasValidEnhanced = enhancedUrl && isAllowedImageUrl(enhancedUrl);

    // Need at least one valid image
    if (!hasValidOriginal && !hasValidEnhanced) {
      return createFallbackImage();
    }

    // If we have both images, show split comparison
    if (hasValidOriginal && hasValidEnhanced) {
      return new ImageResponse(
        (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              height: "100%",
              background: "#000",
              position: "relative",
            }}
          >
            {/* Split comparison container */}
            <div
              style={{
                display: "flex",
                width: "100%",
                height: "100%",
                position: "relative",
              }}
            >
              {/* Left half - Original */}
              <div
                style={{
                  display: "flex",
                  width: "50%",
                  height: "100%",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <img
                  src={originalUrl}
                  alt="Original"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "200%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
                {/* Before label */}
                <div
                  style={{
                    display: "flex",
                    position: "absolute",
                    top: "30px",
                    left: "30px",
                    background: "rgba(0,0,0,0.7)",
                    color: "#e5e5e5",
                    padding: "8px 24px",
                    borderRadius: "100px",
                    fontSize: "24px",
                    fontWeight: "600",
                    border: "1px solid rgba(255,255,255,0.2)",
                    fontFamily: "sans-serif",
                  }}
                >
                  Before
                </div>
              </div>

              {/* Divider line */}
              <div
                style={{
                  display: "flex",
                  position: "absolute",
                  left: "50%",
                  top: 0,
                  bottom: 0,
                  width: "4px",
                  background: "linear-gradient(to bottom, #22d3ee, #3b82f6)",
                  transform: "translateX(-50%)",
                  boxShadow: "0 0 20px rgba(34,211,238,0.8)",
                  zIndex: 10,
                }}
              />

              {/* Slider handle graphic (centered) */}
              <div
                style={{
                  display: "flex",
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  background: "white",
                  transform: "translate(-50%, -50%)",
                  zIndex: 20,
                  boxShadow: "0 0 20px rgba(0,0,0,0.5)",
                  border: "4px solid #000",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* Arrows */}
                <div style={{ display: "flex", gap: "10px" }}>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="black"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M15 18l-6-6 6-6" />
                    <path d="M21 18l-6-6 6-6" />
                  </svg>
                </div>
              </div>

              {/* Right half - Enhanced */}
              <div
                style={{
                  display: "flex",
                  width: "50%",
                  height: "100%",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <img
                  src={enhancedUrl}
                  alt="Enhanced"
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    width: "200%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
                {/* After label */}
                <div
                  style={{
                    display: "flex",
                    position: "absolute",
                    top: "30px",
                    right: "30px",
                    background: "linear-gradient(135deg, #22d3ee 0%, #3b82f6 100%)",
                    color: "white",
                    padding: "8px 24px",
                    borderRadius: "100px",
                    fontSize: "24px",
                    fontWeight: "800",
                    boxShadow: "0 4px 15px rgba(34,211,238,0.4)",
                    fontFamily: "sans-serif",
                  }}
                >
                  After
                </div>
              </div>
            </div>

            {/* Bottom Branding Bar */}
            <div
              style={{
                display: "flex",
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "120px",
                background: "linear-gradient(transparent, rgba(0,0,0,0.9))",
                alignItems: "flex-end",
                padding: "0 40px 30px",
                justifyContent: "space-between",
              }}
            >
              {/* Branding */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "50px",
                    height: "50px",
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #22d3ee, #06b6d4)",
                    boxShadow: "0 0 15px rgba(34,211,238,0.5)",
                  }}
                >
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="white"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span
                    style={{
                      color: "white",
                      fontSize: "36px",
                      fontWeight: "800",
                      lineHeight: 1,
                      fontFamily: "sans-serif",
                    }}
                  >
                    pixel
                  </span>
                  <span
                    style={{
                      color: "rgba(255,255,255,0.8)",
                      fontSize: "18px",
                      fontWeight: "500",
                      fontFamily: "sans-serif",
                    }}
                  >
                    AI Enhanced
                  </span>
                </div>
              </div>
            </div>
          </div>
        ),
        { ...size },
      );
    }

    // Fallback: show single image (enhanced if available, otherwise original)
    const singleImageUrl = hasValidEnhanced ? enhancedUrl : originalUrl;

    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            background: "#000",
            position: "relative",
          }}
        >
          <img
            src={singleImageUrl}
            alt="Enhanced preview"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />

          {/* Gradient overlay at bottom */}
          <div
            style={{
              display: "flex",
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "150px",
              background: "linear-gradient(transparent, rgba(0,0,0,0.9))",
              alignItems: "flex-end",
              padding: "0 40px 30px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "50px",
                  height: "50px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #22d3ee, #06b6d4)",
                  boxShadow: "0 0 15px rgba(34,211,238,0.5)",
                }}
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="white"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span
                  style={{
                    color: "white",
                    fontSize: "36px",
                    fontWeight: "800",
                    lineHeight: 1,
                    fontFamily: "sans-serif",
                  }}
                >
                  pixel
                </span>
                <span
                  style={{
                    color: "rgba(255,255,255,0.8)",
                    fontSize: "18px",
                    fontWeight: "500",
                    fontFamily: "sans-serif",
                  }}
                >
                  AI Enhanced
                </span>
              </div>
            </div>
          </div>
        </div>
      ),
      { ...size },
    );
  } catch (error) {
    logger.error("Error generating OG image", error);
    return createFallbackImage();
  }
}
