import { NextResponse } from "next/server";

import { getClaudeClient, isClaudeConfigured } from "@/lib/ai/claude-client";
import { getPoolInfo } from "@/lib/ai/token-pool";
import { auth, verifyAdminAccess } from "@/lib/auth";

export async function POST() {
  const session = await auth();
  const isAdmin = await verifyAdminAccess(session);

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const configured = await isClaudeConfigured();
  if (!configured) {
    return NextResponse.json(
      {
        error: "Claude token not configured (no CLAUDE_CODE_OAUTH_TOKEN env vars)",
      },
      { status: 503 },
    );
  }

  const poolInfo = await getPoolInfo();
  const model = "claude-haiku-4-5-20251001";
  const start = Date.now();

  try {
    const anthropic = await getClaudeClient();
    const response = await anthropic.messages.create({
      model,
      max_tokens: 10,
      messages: [{ role: "user", content: "Say 'ok'" }],
    });

    const latencyMs = Date.now() - start;
    const text = response.content
      .filter(b => b.type === "text")
      .map(b => "text" in b ? (b as { text: string; }).text : "")
      .join("");

    return NextResponse.json({
      success: true,
      pool: poolInfo,
      model,
      responseText: text,
      usage: response.usage,
      latencyMs,
    });
  } catch (err: unknown) {
    const latencyMs = Date.now() - start;
    const status = err instanceof Error && "status" in err
      ? (err as unknown as { status: number; }).status
      : undefined;
    const isAuthErr = status === 401 || status === 403;

    return NextResponse.json(
      {
        success: false,
        pool: poolInfo,
        model,
        error: isAuthErr
          ? "Authentication failed — all tokens invalid or expired"
          : err instanceof Error
          ? err.message
          : "Unknown error",
        latencyMs,
      },
      { status: isAuthErr ? 401 : 500 },
    );
  }
}
