/**
 * Shared MCP tool catalog utilities used by spike-chat, chat, and openai-compatible routes.
 */

export interface ToolCatalogItem {
  name: string;
  description: string;
  category?: string;
  inputSchema?: unknown;
}

export function scoreTool(query: string, tool: ToolCatalogItem): number {
  const lowerQuery = query.toLowerCase();
  const queryTokens = lowerQuery
    .split(/[^a-z0-9_]+/i)
    .map((token) => token.trim())
    .filter(Boolean);

  const lowerName = tool.name.toLowerCase();
  const lowerDescription = tool.description.toLowerCase();
  const lowerCategory = (tool.category ?? "").toLowerCase();

  let score = 0;
  if (lowerName.includes(lowerQuery)) score += 12;
  if (lowerDescription.includes(lowerQuery)) {
    // openai-compatible uses 8, spike-chat/chat use 6; use 8 as the unified value
    score += 8;
  }

  for (const token of queryTokens) {
    if (lowerName.includes(token)) score += 4;
    if (lowerDescription.includes(token)) score += 2;
    if (lowerCategory.includes(token)) score += 2;
  }

  return score;
}

export function searchToolCatalog(
  query: string,
  toolCatalog: ToolCatalogItem[],
  maxResults = 8,
): ToolCatalogItem[] {
  return toolCatalog
    .map((tool) => ({ tool, score: scoreTool(query, tool) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.tool.name.localeCompare(b.tool.name);
    })
    .slice(0, maxResults)
    .map(({ tool }) => tool);
}

export async function fetchToolCatalog(
  mcpService: Fetcher,
  requestId: string,
): Promise<ToolCatalogItem[]> {
  try {
    const toolsRes = await mcpService.fetch(
      new Request("https://mcp.spike.land/tools", {
        headers: { "X-Request-Id": requestId },
      }),
    );

    if (!toolsRes.ok) return [];

    const data = await toolsRes.json<{
      tools?: Array<{
        name: string;
        description: string;
        category?: string;
        inputSchema?: unknown;
      }>;
    }>();

    return (data.tools ?? []).map(
      (tool): ToolCatalogItem => ({
        name: tool.name,
        description: tool.description,
        ...(tool.category ? { category: tool.category } : {}),
        ...(tool.inputSchema
          ? { inputSchema: tool.inputSchema }
          : { inputSchema: { type: "object", properties: {} } }),
      }),
    );
  } catch {
    return [];
  }
}

export async function callMcpTool(
  mcpService: Fetcher,
  requestId: string,
  name: string,
  args: Record<string, unknown>,
): Promise<string> {
  const rpcRes = await mcpService.fetch(
    new Request("https://mcp.spike.land/mcp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Request-Id": requestId,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: crypto.randomUUID(),
        method: "tools/call",
        params: { name, arguments: args },
      }),
    }),
  );

  if (!rpcRes.ok) {
    throw new Error(`MCP tool call failed with status ${rpcRes.status}`);
  }

  const rpcData = await rpcRes.json<{
    result?: { content?: Array<{ text?: string }> };
    error?: { message: string };
  }>();

  if (rpcData.error) {
    throw new Error(rpcData.error.message);
  }

  if (rpcData.result?.content?.length) {
    return rpcData.result.content.map((item) => item.text ?? "").join("\n");
  }

  return "Tool completed successfully.";
}
