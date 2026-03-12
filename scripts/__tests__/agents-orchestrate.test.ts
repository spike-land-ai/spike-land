import { describe, expect, it } from "vitest";
import {
  buildIncidentBrief,
  buildOutageTriagePrompt,
  extractFirstJsonObject,
  normalizeOutageFinding,
  parseOutageFinding,
  parseRepoSlug,
  type AgentAvailability,
  type BaselineCheck,
} from "../agents/orchestrate-lib";

describe("parseRepoSlug", () => {
  it("parses https remotes", () => {
    expect(parseRepoSlug("https://github.com/spike-land-ai/spike-land-ai.git")).toBe(
      "spike-land-ai/spike-land-ai",
    );
  });

  it("parses ssh remotes", () => {
    expect(parseRepoSlug("git@github.com:spike-land-ai/spike-land-ai.git")).toBe(
      "spike-land-ai/spike-land-ai",
    );
  });
});

describe("extractFirstJsonObject", () => {
  it("extracts the first valid JSON object from noisy output", () => {
    expect(extractFirstJsonObject('noise\n{"ok":true}\ntrailing')).toBe('{"ok":true}');
  });
});

describe("parseOutageFinding", () => {
  it("normalizes a valid model response", () => {
    const result = parseOutageFinding(
      "claude",
      '{"symptoms":["health page"],"evidence":["/api/health returned html"],"probableCause":"Cloudflare challenge on health endpoints","confidence":0.9,"nextChecks":["verify WAF rule"],"blockedActions":["no deploy"]}',
    );

    expect(result.parseError).toBeNull();
    expect(result.finding?.probableCause).toBe("Cloudflare challenge on health endpoints");
    expect(result.finding?.confidence).toBe(0.9);
  });

  it("reports parse failures", () => {
    const result = parseOutageFinding("gemini", "no json here");
    expect(result.finding).toBeNull();
    expect(result.parseError).toContain("No JSON object found");
  });
});

describe("buildOutageTriagePrompt", () => {
  it("includes baseline evidence and repo hints", () => {
    const prompt = buildOutageTriagePrompt({
      targetUrl: "https://spike.land",
      baselineChecks: [
        {
          label: "Main Site",
          method: "GET",
          url: "https://spike.land",
          status: 200,
          contentType: "text/html",
          bodySnippet: "ok",
          notes: [],
        },
      ],
      repoHints: ["health route lives in edge worker"],
    });

    expect(prompt).toContain("https://spike.land");
    expect(prompt).toContain("health route lives in edge worker");
    expect(prompt).toContain('"probableCause": string');
  });
});

describe("buildIncidentBrief", () => {
  it("summarizes findings and queued agents", () => {
    const baselineChecks: BaselineCheck[] = [
      {
        label: "Main Site API health",
        method: "GET",
        url: "https://spike.land/api/health",
        status: 200,
        contentType: "text/html",
        bodySnippet: "Just a moment...",
        notes: ["Cloudflare challenge page returned"],
      },
    ];
    const availability: AgentAvailability[] = [
      {
        agent: "claude",
        installed: true,
        authenticated: true,
        callable: true,
        repoConnected: null,
        status: "ready",
        notes: [],
      },
      {
        agent: "jules",
        installed: true,
        authenticated: true,
        callable: true,
        repoConnected: false,
        status: "limited",
        notes: ["repo not connected"],
      },
    ];

    const brief = buildIncidentBrief({
      targetUrl: "https://spike.land",
      runId: "run-1",
      baselineChecks,
      availability,
      parsedResults: [
        {
          agent: "claude",
          finding: normalizeOutageFinding({
            symptoms: ["health endpoints blocked"],
            evidence: ["/api/health returned challenge page"],
            probableCause: "Cloudflare challenge on machine endpoints",
            confidence: 0.8,
            nextChecks: ["verify firewall/challenge rules"],
            blockedActions: ["no deploy"],
          }),
          parseError: null,
        },
      ],
      queuedAgents: [{ agent: "jules", note: "repo not connected" }],
    });

    expect(brief).toContain("Cloudflare challenge on machine endpoints");
    expect(brief).toContain("Queued / Deferred Agents");
    expect(brief).toContain("jules: repo not connected");
  });
});
