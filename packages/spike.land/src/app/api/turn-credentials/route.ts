import { auth } from "@/lib/auth";
import { tryCatch } from "@/lib/try-catch";
import { NextResponse } from "next/server";

/**
 * API endpoint to fetch TURN server credentials from Twilio
 * This enables WebRTC connections to work on restrictive networks (4G/5G)
 *
 * Security: Requires an authenticated session to prevent credential leakage
 * and abuse of Twilio quota by unauthenticated callers (OWASP A1 - Broken
 * Access Control).
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    return NextResponse.json(
      { error: "Twilio credentials not configured" },
      { status: 500 },
    );
  }

  // Fetch TURN credentials from Twilio
  const { data: response, error: fetchError } = await tryCatch(
    fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Tokens.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        },
      },
    ),
  );

  if (fetchError || !response.ok) {
    return NextResponse.json(
      { error: "Failed to fetch TURN credentials" },
      { status: 500 },
    );
  }

  const { data, error: jsonError } = await tryCatch(response.json());

  if (jsonError) {
    return NextResponse.json(
      { error: "Failed to parse Twilio response" },
      { status: 500 },
    );
  }

  // Return ICE servers in RTCIceServer format
  return NextResponse.json({
    iceServers: data.ice_servers,
    ttl: data.ttl,
  });
}
