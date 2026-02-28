import { SessionService } from "@/lib/codespace/session-service";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  props: { params: Promise<{ codeSpace: string; }>; },
) {
  try {
    const params = await props.params;
    const { codeSpace } = params;
    const session = await SessionService.getSession(codeSpace);

    if (!session) {
      return NextResponse.json({ error: "Codespace not found" }, { status: 404 });
    }

    return NextResponse.json({ code: session.code });
  } catch (error) {
    logger.error("[codespace/code] GET error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve codespace code" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ codeSpace: string; }>; },
) {
  try {
    const params = await props.params;
    const { codeSpace } = params;

    let body: { code?: unknown; hash?: unknown; };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { code, hash } = body;

    if (!code || !hash) {
      return NextResponse.json({ error: "Missing code or hash" }, {
        status: 400,
      });
    }

    const currentSession = await SessionService.getSession(codeSpace);
    if (!currentSession) {
      return NextResponse.json({ error: "Codespace not found" }, { status: 404 });
    }

    const newSession = { ...currentSession, code: code as string };
    const result = await SessionService.updateSession(
      codeSpace,
      newSession,
      hash as string,
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, session: result.session },
        { status: result.error === "Conflict: Hash mismatch" ? 409 : 400 },
      );
    }

    return NextResponse.json({ success: true, session: result.session });
  } catch (error) {
    logger.error("[codespace/code] PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update codespace code" },
      { status: 500 },
    );
  }
}
