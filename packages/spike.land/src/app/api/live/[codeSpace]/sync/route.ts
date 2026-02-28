import { transpileCode } from "@/lib/codespace/transpiler";
import { SessionService } from "@/lib/codespace/session-service";
import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

/**
 * POST /api/live/[codeSpace]/sync
 * Sync code to the codespace (transpile + save to DB)
 */
export async function POST(
  request: NextRequest,
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

  const { data: body, error: bodyError } = await tryCatch(request.json());
  if (bodyError) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { code } = body;
  if (typeof code !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid 'code' field" },
      { status: 400 },
    );
  }

  // 1. Get current session to have the hash for optimistic locking
  const currentSession = await SessionService.getSession(codeSpace);
  if (!currentSession) {
    return NextResponse.json(
      { error: "Codespace not found" },
      { status: 404 },
    );
  }

  // 2. Transpile the new code
  const { data: transpiled, error: transpileError } = await tryCatch(
    transpileCode(code, codeSpace),
  );

  if (transpileError) {
    return NextResponse.json(
      { error: `Transpilation failed: ${transpileError.message}` },
      { status: 422 },
    );
  }

  // 3. Update the session
  const newSessionData = {
    ...currentSession,
    code,
    transpiled: transpiled,
    html: "",
    css: "",
  };

  // We need the hash for the update. Since we just fetched it, we use it.
  // In a real high-concurrency scenario, this might need retries,
  // but for a single-user "sync", it's usually fine.
  const dbSession = await prisma.codespaceSession.findUnique({
    where: { codeSpace },
    select: { hash: true },
  });

  if (!dbSession) {
    return NextResponse.json({ error: "Session disappeared" }, { status: 404 });
  }

  const result = await SessionService.updateSession(
    codeSpace,
    newSessionData,
    dbSession.hash,
  );

  if (!result.success) {
    return NextResponse.json(
      { error: result.error || "Failed to update session" },
      { status: 409 },
    );
  }

  // 4. Sync with testing.spike.land worker
  try {
    const { syncCodespaceWithWorker } = await import(
      "@/lib/create/codespace-service"
    );
    syncCodespaceWithWorker(codeSpace, code).catch(err => {
      logger.error(
        `[Sync Route] Background sync failed for ${codeSpace}:`,
        err,
      );
    });
  } catch (err) {
    logger.error(`[Sync Route] Failed to import syncCodespaceWithWorker:`, err);
  }

  return NextResponse.json({
    success: true,
    codeSpace,
    syncedAt: new Date().toISOString(),
  });
}
