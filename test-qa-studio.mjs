import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function runTests() {
  console.log("Starting QA Studio test script...");

  const transport = new StdioClientTransport({
    command: "node",
    args: ["packages/qa-studio/dist/mcp-server.js"],
  });

  const client = new Client(
    { name: "test-client", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  await client.connect(transport);
  console.log("Connected to QA Studio MCP server.");

  // 1. web_navigate
  console.log("\\n--- Testing web_navigate ---");
  const navResult = await client.callTool({
    name: "web_navigate",
    arguments: { url: "https://spike.land" },
  });
  console.log("Navigation Result:", navResult.content[0].text.substring(0, 500) + "...");

  // 2. web_read
  console.log("\\n--- Testing web_read ---");
  const readResult = await client.callTool({
    name: "web_read",
    arguments: { detail: "compact" },
  });
  console.log("Read Result:", readResult.content[0].text.substring(0, 500) + "...");

  // 3. web_tabs (list)
  console.log("\\n--- Testing web_tabs (list) ---");
  const tabsResult = await client.callTool({
    name: "web_tabs",
    arguments: { action: "list" },
  });
  console.log("Tabs Result:", tabsResult.content[0].text);

  // 4. web_forms
  console.log("\\n--- Testing web_forms ---");
  const formsResult = await client.callTool({
    name: "web_forms",
    arguments: {},
  });
  console.log("Forms Result:", formsResult.content[0].text);

  // 5. web_screenshot
  console.log("\\n--- Testing web_screenshot ---");
  const screenshotResult = await client.callTool({
    name: "web_screenshot",
    arguments: { full_page: false },
  });
  const screenshotData = screenshotResult.content[0];
  console.log("Screenshot Result:", screenshotData.type, screenshotData.mimeType, `(Base64 string length: ${screenshotData.data.length})`);

  // Close server
  process.exit(0);
}

runTests().catch(console.error);
