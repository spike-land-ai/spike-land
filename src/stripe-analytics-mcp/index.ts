#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { wrapServerWithLogging, registerFeedbackTool, createErrorShipper } from "@spike-land-ai/mcp-server-base";
import { StripeClient } from "./clients/stripe-client.js";
import { registerRevenueTools } from "./tools/revenue.js";
import { registerSubscriptionTools } from "./tools/subscriptions.js";
import { registerCustomerTools } from "./tools/customers.js";

const apiKey = process.env.STRIPE_SECRET_KEY;
if (!apiKey) {
  console.error("STRIPE_SECRET_KEY environment variable is required");
  process.exit(1);
}

const server = new McpServer({
  name: "stripe-analytics-mcp",
  version: "0.1.0",
});

const shipper = createErrorShipper();
process.on("uncaughtException", (err) =>
  shipper.shipError({ service_name: "stripe-analytics-mcp", message: err.message, stack_trace: err.stack, severity: "high" }),
);
process.on("unhandledRejection", (err: unknown) =>
  shipper.shipError({
    service_name: "stripe-analytics-mcp",
    message: err instanceof Error ? err.message : String(err),
    stack_trace: err instanceof Error ? err.stack : undefined,
    severity: "high",
  }),
);

wrapServerWithLogging(server, "stripe-analytics-mcp");

const client = new StripeClient(apiKey);

registerRevenueTools(server, client);
registerSubscriptionTools(server, client);
registerCustomerTools(server, client);
registerFeedbackTool(server, { serviceName: "stripe-analytics-mcp", toolName: "stripe_analytics_feedback" });

const transport = new StdioServerTransport();
await server.connect(transport);

console.error("Stripe Analytics MCP Server running on stdio.");
