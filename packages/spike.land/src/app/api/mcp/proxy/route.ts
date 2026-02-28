import { auth } from "@/lib/auth";
import { tryCatch } from "@/lib/try-catch";
import { ProxyToolRegistry } from "@/lib/mcp/server/proxy-tool-registry";
import { registerAllTools } from "@/lib/mcp/server/tool-manifest";
import type { ToolRegistry } from "@/lib/mcp/server/tool-registry";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface ProxyRequestBody {
  tool: string;
  params: Record<string, unknown>;
}

/**
 * Build a ProxyToolRegistry for a given userId.
 * This registers all MCP tool handlers so they can be invoked directly.
 * Cast to ToolRegistry since tool modules type their param as ToolRegistry
 * but only call register() — which ProxyToolRegistry implements.
 */
function buildRegistry(userId: string): ProxyToolRegistry {
  const registry = new ProxyToolRegistry();
  registerAllTools(registry as unknown as ToolRegistry, userId);
  return registry;
}

/** Wrap JSON data in the MCP response shape the frontend expects. */
function wrapJsonResult(data: unknown) {
  return NextResponse.json({
    result: { content: [{ type: "text", text: JSON.stringify(data) }] },
  });
}

export async function POST(request: Request) {
  const { data: session, error: authError } = await tryCatch(auth());

  const { data: body, error: parseError } = await tryCatch(
    request.json() as Promise<ProxyRequestBody>,
  );
  if (parseError || !body?.tool) {
    return NextResponse.json(
      { error: "Invalid request body: expected { tool, params }" },
      { status: 400 },
    );
  }

  const { tool, params = {} } = body;

  // Allow all tools through with optional auth. Tools that need auth
  // (DB-backed ones) will fail at the service layer with meaningful errors.
  // In-memory tools (state-machine, audio, etc.) work for everyone.
  const userId = (!authError && session?.user?.id)
    ? session.user.id
    : "anonymous";

  try {
    // ── Special cases needing cookie-based API proxying ───────
    switch (tool) {
      case "generate_image": {
        // Safe: URL is constructed from request.url's own origin, not from user input
        const origin = new URL(request.url).origin;
        const res = await fetch(`${origin}/api/mcp/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            cookie: request.headers.get("cookie") ?? "",
          },
          body: JSON.stringify(params),
        });
        const data = await res.json();
        return wrapJsonResult(data);
      }

      case "modify_image": {
        // Safe: URL is constructed from request.url's own origin, not from user input
        const origin = new URL(request.url).origin;
        const res = await fetch(`${origin}/api/mcp/modify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            cookie: request.headers.get("cookie") ?? "",
          },
          body: JSON.stringify(params),
        });
        const data = await res.json();
        return wrapJsonResult(data);
      }

      case "check_job": {
        const jobId = String(params.job_id ?? "");
        if (!jobId) {
          return NextResponse.json({ error: "job_id is required" }, {
            status: 400,
          });
        }
        // Safe: URL is constructed from request.url's own origin, not from user input
        const origin = new URL(request.url).origin;
        const res = await fetch(
          `${origin}/api/mcp/jobs/${encodeURIComponent(jobId)}`,
          {
            headers: { cookie: request.headers.get("cookie") ?? "" },
          },
        );
        const data = await res.json();
        return wrapJsonResult(data);
      }
    }

    // ── All other tools: invoke via ProxyToolRegistry ─────────
    const registry = buildRegistry(userId);
    const result = await registry.callTool(tool, params);

    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
