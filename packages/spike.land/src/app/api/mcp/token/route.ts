import { auth } from "@/lib/auth";
import { generateTokenPair } from "@/lib/mcp/oauth/token-service";
import { tryCatch } from "@/lib/try-catch";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

const FE_ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes
const FE_CLIENT_ID = "spike-land-frontend";

export async function POST() {
  const { data: session, error: authError } = await tryCatch(auth());
  if (authError || !session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { data: tokenPair, error: tokenError } = await tryCatch(
    generateTokenPair(
      session.user.id,
      FE_CLIENT_ID,
      "mcp",
      undefined,
      FE_ACCESS_TOKEN_TTL_MS,
    ),
  );

  if (tokenError || !tokenPair) {
    logger.error("[MCP_TOKEN_EXCHANGE]", tokenError);
    return new NextResponse("Failed to generate tokens", { status: 500 });
  }

  return NextResponse.json({
    access_token: tokenPair.accessToken,
    refresh_token: tokenPair.refreshToken,
    expires_in: tokenPair.expiresIn,
    token_type: "Bearer",
  });
}
