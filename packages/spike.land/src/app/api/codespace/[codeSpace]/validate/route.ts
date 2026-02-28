import {
  parseTranspileErrors,
  transpileCode,
} from "@/lib/codespace/transpiler";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
) {
  let body: { code: string; };
  try {
    body = await request.json() as { code: string; };
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, {
      status: 400,
    });
  }

  if (!body.code || typeof body.code !== "string") {
    return NextResponse.json({
      success: false,
      error: "Missing or invalid 'code' field",
    }, { status: 400 });
  }

  try {
    const origin = new URL(request.url).origin;
    await transpileCode(body.code, origin);

    return NextResponse.json({
      success: true,
      valid: true,
      errors: [],
      warnings: [],
    });
  } catch (error) {
    const errorMessage = error instanceof Error
      ? error.message
      : "Transpilation failed";
    const parsedErrors = parseTranspileErrors(errorMessage);

    return NextResponse.json({
      success: false,
      valid: false,
      errors: parsedErrors,
      warnings: [],
    });
  }
}
