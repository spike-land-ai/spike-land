#!/usr/bin/env node
/**
 * Google Ads MCP Server — Campaign management, reporting, and keyword insights.
 */

import {
  createMcpServer,
  startMcpServer,
  wrapServerWithLogging,
  registerFeedbackTool,
  createErrorShipper,
} from "@spike-land-ai/mcp-server-base";
import { GoogleAdsAuthClient } from "./auth/google-oauth.js";
import { GoogleAdsClient } from "./clients/ads-client.js";
import { registerCampaignTools } from "./tools/campaigns.js";
import { registerReportingTools } from "./tools/reporting.js";
import { registerKeywordTools } from "./tools/keywords.js";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const auth = new GoogleAdsAuthClient({
  clientId: requireEnv("GOOGLE_CLIENT_ID"),
  clientSecret: requireEnv("GOOGLE_CLIENT_SECRET"),
  refreshToken: requireEnv("GOOGLE_REFRESH_TOKEN"),
  developerToken: requireEnv("GOOGLE_ADS_DEVELOPER_TOKEN"),
  customerId: requireEnv("GOOGLE_ADS_CUSTOMER_ID"),
  ...(process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID ? { loginCustomerId: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID } : {}),
});

const client = new GoogleAdsClient(auth);

const server = createMcpServer({ name: "google-ads-mcp", version: "0.1.0" });

const shipper = createErrorShipper();
process.on("uncaughtException", (err) =>
  shipper.shipError({
    service_name: "google-ads-mcp",
    message: err.message,
    stack_trace: err.stack,
    severity: "high",
  }),
);
process.on("unhandledRejection", (err: unknown) =>
  shipper.shipError({
    service_name: "google-ads-mcp",
    message: err instanceof Error ? err.message : String(err),
    stack_trace: err instanceof Error ? err.stack : undefined,
    severity: "high",
  }),
);

wrapServerWithLogging(server, "google-ads-mcp");

registerCampaignTools(server, client);
registerReportingTools(server, client);
registerKeywordTools(server, client);
registerFeedbackTool(server, { serviceName: "google-ads-mcp", toolName: "google_ads_feedback" });

await startMcpServer(server);

console.error("Google Ads MCP Server running on stdio.");
