import { SessionService } from "@/lib/codespace/session-service";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * GET /api/live/[codeSpace]
 * Fetch current code for a codespace (reads directly from DB)
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ codeSpace: string; }>; },
) {
  const { data: params, error: paramsError } = await tryCatch(context.params);
  if (paramsError) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const { codeSpace } = params;

  // Validate codeSpace format (alphanumeric, hyphens, underscores, dots)
  if (!/^[a-zA-Z0-9_.-]+$/.test(codeSpace)) {
    return NextResponse.json(
      { error: "Invalid codeSpace format" },
      { status: 400 },
    );
  }

  const session = await SessionService.getSession(codeSpace);

  if (!session) {
    return NextResponse.json(
      { error: "Codespace not found", codeSpace },
      { status: 404 },
    );
  }

  return NextResponse.json({
    codeSpace,
    code: session.code || "",
    transpiled: session.transpiled || "",
    html: session.html || "",
    css: session.css || "",
    messages: session.messages || [],
  });
}
