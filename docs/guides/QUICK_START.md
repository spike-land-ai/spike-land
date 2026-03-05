# Getting Started with spike.land

## What is spike.land?

spike.land is an **MCP registry and tool platform** that hosts 80+ AI tools
accessible via the Model Context Protocol (MCP). Connect any MCP-compatible
client to instantly access tools for code review, image generation, browser
automation, chess, news aggregation, and more.

## Prerequisites

You need an MCP-compatible client. Supported clients include:

- **Claude Desktop** (Anthropic)
- **Cursor** (AI code editor)
- **Claude Code** (CLI)
- Any client that speaks the [Model Context Protocol](https://modelcontextprotocol.io)

## Quick Start

### 1. Configure your MCP client

Point your client at the spike.land MCP endpoint:

```
https://mcp.spike.land/mcp
```

### 2. Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)
or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "spike-land": {
      "url": "https://mcp.spike.land/mcp"
    }
  }
}
```

Restart Claude Desktop after saving.

### 3. Cursor

Create or edit `.cursor/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "spike-land": {
      "url": "https://mcp.spike.land/mcp"
    }
  }
}
```

### 4. Claude Code

```bash
claude mcp add spike-land https://mcp.spike.land/mcp
```

## Verify the connection

Once configured, ask your AI assistant to list available tools. You should see
80+ tools organized by category (AI, code, storage, analytics, etc.).

## Explore tools

- Browse the full tool registry at [spike.land/tools](https://spike.land/tools)
- Each tool has a name, description, input schema, and category
- Tools can be called directly through your MCP client

## Next steps

- [MCP Overview](https://github.com/spike-land-ai/spike-land-ai/blob/main/docs/mcp/DEVELOPMENT_INDEX.md) -- How MCP works on spike.land
- [MCP Tools Reference](https://github.com/spike-land-ai/spike-land-ai/blob/main/docs/mcp/TOOL_GUIDELINES.md) -- Full tool documentation
- [API Reference](https://github.com/spike-land-ai/spike-land-ai/blob/main/docs/api/API_REFERENCE.md) -- REST API docs
- [Architecture](https://github.com/spike-land-ai/spike-land-ai/blob/main/docs/develop/EDGE_STACK.md) -- System design
