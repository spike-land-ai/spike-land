import { auth } from "@/lib/auth";
import { approveQRAuth } from "@/lib/auth/qr-auth-service";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  // Require authenticated session
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await request.json() as { token?: string; };
  if (!body.token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const result = await approveQRAuth(body.token, session.user.id);
  if (!result) {
    return NextResponse.json({ error: "Invalid or expired QR session" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
