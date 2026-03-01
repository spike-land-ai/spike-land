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

async function buildRegistry(userId: string): Promise<ProxyToolRegistry> {
  const registry = new ProxyToolRegistry();
  await registerAllTools(registry as unknown as ToolRegistry, userId);
  return registry;
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

  const userId = (!authError && session?.user?.id)
    ? session.user.id
    : "anonymous";

  try {
    const registry = await buildRegistry(userId);
    const result = await registry.callTool(tool, params);

    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
