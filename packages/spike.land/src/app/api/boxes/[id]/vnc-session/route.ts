import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { tryCatch } from "@/lib/try-catch";
import prisma from "@/lib/prisma";
import { BoxStatus } from "@prisma/client";
import { SignJWT } from "jose";
import { NextResponse } from "next/server";

/**
 * Short-lived token duration for VNC session access.
 * 5 minutes is intentionally tight — the client must open the VNC URL
 * promptly. The token is scoped to a single box and user.
 */
const TOKEN_EXPIRY = "5m";

/**
 * Expected URL scheme for tunnel URLs. Only HTTPS tunnels are permitted to
 * prevent JWT tokens from being sent over plaintext connections.
 */
const ALLOWED_TUNNEL_SCHEME = "https:";

/**
 * Validates that a tunnel URL is safe to redirect to.
 *
 * Criteria:
 * - Must be a well-formed URL (parseable by the URL constructor)
 * - Must use HTTPS (prevents token leakage over plaintext)
 * - Must not be a loopback/private address (localhost, 127.x, 10.x, 192.168.x)
 *   unless the app is running in development mode
 *
 * Returns the validated URL object, or null if validation fails.
 */
function validateTunnelUrl(raw: string): URL | null {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }

  if (parsed.protocol !== ALLOWED_TUNNEL_SCHEME) {
    return null;
  }

  // Block private/loopback addresses in production to prevent SSRF-like
  // token exfiltration to internal infrastructure.
  if (process.env.NODE_ENV !== "development") {
    const host = parsed.hostname;
    const isPrivate = host === "localhost"
      || /^127\./.test(host)
      || /^10\./.test(host)
      || /^172\.(1[6-9]|2\d|3[01])\./.test(host)
      || /^192\.168\./.test(host)
      || /^169\.254\./.test(host)
      || /^0\./.test(host)
      || host === "::1"
      || host.endsWith(".local");

    if (isPrivate) {
      return null;
    }
  }

  return parsed;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; }>; },
) {
  const { data: session, error: authError } = await tryCatch(auth());
  if (authError || !session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { data: paramsData, error: paramsError } = await tryCatch(params);
  if (paramsError) {
    return new NextResponse("Invalid parameters", { status: 400 });
  }
  const { id } = paramsData;

  const { data: box, error: boxError } = await tryCatch(
    prisma.box.findUnique({
      where: {
        id,
        userId: session.user.id,
        // Exclude soft-deleted boxes explicitly so callers cannot obtain
        // VNC tokens for boxes they have already terminated.
        deletedAt: null,
      },
      select: {
        id: true,
        status: true,
        tunnelUrl: true,
        publicIp: true,
      },
    }),
  );

  if (boxError) {
    logger.error("[VNC_SESSION] Database error during box lookup", boxError);
    return new NextResponse("Internal Error", { status: 500 });
  }

  if (!box) {
    return new NextResponse("Not Found", { status: 404 });
  }

  if (box.status !== BoxStatus.RUNNING) {
    return NextResponse.json(
      { error: "Box is not running" },
      { status: 409 },
    );
  }

  if (!box.tunnelUrl) {
    return NextResponse.json(
      { error: "Box has no tunnel URL configured" },
      { status: 503 },
    );
  }

  // Validate the tunnel URL before embedding a signed JWT in it.
  // An invalid or non-HTTPS URL would ship the JWT to an unintended host.
  const tunnelUrl = validateTunnelUrl(box.tunnelUrl);
  if (!tunnelUrl) {
    logger.error("[VNC_SESSION] Tunnel URL failed validation", undefined, {
      boxId: box.id,
      // Do not log the raw tunnelUrl — it may contain credentials.
    });
    return NextResponse.json(
      { error: "Box tunnel URL is not available" },
      { status: 503 },
    );
  }

  const vncTokenSecret = process.env.BOX_VNC_TOKEN_SECRET;
  if (!vncTokenSecret) {
    logger.error("[VNC_SESSION] BOX_VNC_TOKEN_SECRET is not configured");
    return new NextResponse("Internal Error", { status: 500 });
  }

  const secret = new TextEncoder().encode(vncTokenSecret);

  const { data: token, error: tokenError } = await tryCatch(
    new SignJWT({ boxId: box.id, userId: session.user.id })
      .setProtectedHeader({ alg: "HS256" })
      // Issuer identifies this platform as the token origin so VNC proxies
      // can reject tokens signed by unrelated services sharing the secret.
      .setIssuer("spike.land")
      // Audience scopes the token to the VNC proxy service only.
      .setAudience("vnc-proxy")
      .setExpirationTime(TOKEN_EXPIRY)
      .setIssuedAt()
      .sign(secret),
  );

  if (tokenError) {
    logger.error("[VNC_SESSION] Failed to sign JWT", tokenError);
    return new NextResponse("Internal Error", { status: 500 });
  }

  // Append the token as a query parameter on the validated tunnel URL.
  // NOTE: Embedding tokens in URLs is a known trade-off for browser-based
  // VNC clients that cannot use Authorization headers. The 5-minute expiry
  // and HTTPS enforcement limit the blast radius of accidental exposure.
  tunnelUrl.pathname = "/vnc.html";
  tunnelUrl.searchParams.set("autoconnect", "true");
  tunnelUrl.searchParams.set("token", token);

  return NextResponse.json({ url: tunnelUrl.toString() });
}
