export class ToolRegistry {
  constructor(
    public mcpServer: unknown,
    public userId: string,
  ) {}
  register(_def: unknown) {}
  enableAll() {
    return 0;
  }
  getToolCount() {
    return 0;
  }
  getToolDefinitions(): Array<{
    name: string;
    description?: string | undefined;
    enabled: boolean;
    inputSchema?: Record<string, unknown>;
  }> {
    return [];
  }
  async callToolDirect(
    _name: string,
    _args: Record<string, unknown>,
  ): Promise<{
    content: Array<{ type: string; text?: string; [key: string]: unknown }>;
    isError?: boolean;
  }> {
    return { content: [] };
  }
}
