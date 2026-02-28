import { computeSessionHash } from "@/lib/codespace/hash-utils";
import { SessionService } from "@/lib/codespace/session-service";
import { transpileCode } from "@/lib/codespace/transpiler";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ codeSpace: string; }>; },
) {
  const params = await props.params;
  const { codeSpace } = params;
  const session = await SessionService.getSession(codeSpace);

  if (!session) {
    return NextResponse.json({ error: "Codespace not found" }, { status: 404 });
  }

  if (!session.code) {
    return NextResponse.json({ error: "No code to transpile" }, {
      status: 400,
    });
  }

  try {
    const origin = new URL(request.url).origin;
    const transpiled = await transpileCode(session.code, origin);

    const expectedHash = computeSessionHash(session);
    const newSession = {
      ...session,
      transpiled,
      html: "",
      css: "",
    };

    const result = await SessionService.updateSession(
      codeSpace,
      newSession,
      expectedHash,
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, session: result.session },
        { status: result.error === "Conflict: Hash mismatch" ? 409 : 400 },
      );
    }

    return NextResponse.json({
      success: true,
      codeSpace,
      hash: computeSessionHash(newSession),
      updated: ["transpiled"],
      message: "Code transpiled successfully. HTML/CSS rendering delegated to connected clients.",
    });
  } catch (error) {
    const errorMessage = error instanceof Error
      ? error.message
      : "Transpilation failed";
    return NextResponse.json({ success: false, error: errorMessage }, {
      status: 400,
    });
  }
}
