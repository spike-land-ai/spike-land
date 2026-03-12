import type { McpServer, RegisteredTool } from "@modelcontextprotocol/sdk/server/mcp.js";
import { describe, expect, it, vi } from "vitest";
import {
  buildArborBrief,
  buildArborPitch,
  buildArborRiskRegister,
  mapArborContext,
  planArborPilot,
  registerArborTools,
} from "../../../src/edge-api/spike-land/core-logic/tools/arbor";
import { createDb } from "../../../src/edge-api/spike-land/db/db/db-index";
import { ToolRegistry } from "../../../src/edge-api/spike-land/lazy-imports/registry";
import { createMockD1 } from "../__test-utils__/mock-env";

function createMockMcpServer(): McpServer {
  return {
    registerTool: vi.fn((_name: string, _config: unknown, handler: unknown): RegisteredTool => {
      let isEnabled = true;
      return {
        enable: () => {
          isEnabled = true;
        },
        disable: () => {
          isEnabled = false;
        },
        get enabled() {
          return isEnabled;
        },
        update: vi.fn(),
        remove: vi.fn(),
        handler: handler as RegisteredTool["handler"],
      };
    }),
  } as unknown as McpServer;
}

function createRegistry(userId = "user-1") {
  const db = createDb(createMockD1());
  const server = createMockMcpServer();
  const registry = new ToolRegistry(server, userId);

  registerArborTools(registry, userId, db);
  registry.enableAll();

  return { registry, server };
}

function extractText(result: { content: Array<{ type: string; text?: string }> }): string {
  return result.content
    .filter((item) => item.type === "text" && typeof item.text === "string")
    .map((item) => item.text)
    .join("\n");
}

function extractJson(result: { content: Array<{ type: string; text?: string }> }): unknown {
  const jsonText = result.content
    .filter((item) => item.type === "text" && typeof item.text === "string")
    .map((item) => item.text)
    .find((text): text is string => text.trim().startsWith("{"));

  if (!jsonText) {
    throw new Error("Expected JSON payload in MCP result.");
  }

  return JSON.parse(jsonText) as unknown;
}

describe("arbor helpers", () => {
  it("builds an audience-specific brief with selected pillars", () => {
    const brief = buildArborBrief("investor", ["economic_pipeline", "legal_automation"]);

    expect(brief.audience).toBe("investor");
    expect(brief.headline).toContain("economic operating system");
    expect(brief.pillars.map((pillar) => pillar.key)).toEqual([
      "economic_pipeline",
      "legal_automation",
    ]);
  });

  it("prioritizes infrastructure bypass when connectivity is weak", () => {
    const mapped = mapArborContext({
      regionContext: "Rural market towns",
      targetUser: "informal producers",
      constraints: ["internet outages", "state censorship", "low wages"],
      currentSkills: ["repair", "resale"],
      connectivityProfile: "offline_first",
    });

    expect(mapped.pathways).toHaveLength(4);
    expect(mapped.recommendedWedge).toBe("infrastructure_bypass");
    expect(mapped.prioritizedPillars[0]).toBe("infrastructure_bypass");
  });

  it("creates a pilot plan with phased rollout and goal-specific metrics", () => {
    const plan = planArborPilot({
      region: "Nairobi",
      targetUser: "waste pickers",
      pilotGoal: "income_generation",
      partnerModel: "co_op",
      timeHorizonDays: 60,
      localAssets: ["plastic waste", "metal scrap"],
    });

    expect(plan.phases).toHaveLength(3);
    expect(
      plan.successMetrics.some((metric) => metric.name === "producers_with_first_payment"),
    ).toBe(true);
    expect(plan.guardrails[1]).toContain("co-op");
  });

  it("escalates critical risks under hostile operating conditions", () => {
    const register = buildArborRiskRegister({
      jurisdictionSummary: "High-surveillance informal trade environment",
      enforcementRisk: "high",
      connectivityProfile: "offline_first",
      paymentReliability: "low",
      identityRequirements: "high",
      partnerModel: "independent",
      sensitiveActivities: ["cross-border resale"],
    });

    expect(register.risks.some((risk) => risk.severity === "critical")).toBe(true);
    expect(register.guardrails[0]).toContain("local anchor");
  });

  it("builds a concise pitch with the requested ask", () => {
    const pitch = buildArborPitch({
      audience: "pilot_partner",
      format: "one_liner",
      region: "Lagos",
      targetUser: "informal makers",
      ask: "Introduce Arbor to two local operator leads.",
    });

    expect(pitch.pitch).toContain("informal makers");
    expect(pitch.pitch).toContain("Lagos");
    expect(pitch.ask).toBe("Introduce Arbor to two local operator leads.");
  });
});

describe("arbor tools", () => {
  it("registers five Arbor tools", () => {
    const { registry } = createRegistry();
    expect(registry.getToolCount()).toBe(5);
  });

  it("returns structured MCP results for live tool calls", async () => {
    const { registry } = createRegistry();

    const briefResult = await registry.callToolDirect("arbor_get_brief", {
      audience: "operator",
      focus: ["asset_synthesis"],
    });
    expect(extractText(briefResult)).toContain("Project Arbor");
    const briefJson = extractJson(briefResult) as { pillars: Array<{ key: string }> };
    expect(briefJson.pillars).toHaveLength(1);
    expect(briefJson.pillars[0]?.key).toBe("asset_synthesis");

    const pitchResult = await registry.callToolDirect("arbor_write_pitch", {
      audience: "investor",
      format: "thirty_second",
      region: "Accra",
      target_user: "underemployed smartphone workers",
    });
    expect(extractText(pitchResult)).toContain("Project Arbor");
    const pitchJson = extractJson(pitchResult) as { audience: string; format: string };
    expect(pitchJson.audience).toBe("investor");
    expect(pitchJson.format).toBe("thirty_second");
  });
});
