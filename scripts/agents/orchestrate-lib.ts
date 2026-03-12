export type AgentName = "claude" | "gemini" | "jules";

export interface BaselineCheck {
  label: string;
  method: "GET";
  url: string;
  status: number | null;
  contentType: string | null;
  bodySnippet: string;
  notes: string[];
}

export interface AgentAvailability {
  agent: AgentName;
  installed: boolean;
  authenticated: boolean;
  callable: boolean;
  repoConnected: boolean | null;
  status: "ready" | "limited" | "unavailable";
  notes: string[];
}

export interface OutageFinding {
  symptoms: string[];
  evidence: string[];
  probableCause: string;
  confidence: number;
  nextChecks: string[];
  blockedActions: string[];
}

export interface ParsedAgentResult {
  agent: AgentName;
  finding: OutageFinding | null;
  parseError: string | null;
}

export function parseRepoSlug(remoteUrl: string | null | undefined): string | null {
  if (!remoteUrl) return null;

  const trimmed = remoteUrl.trim();
  if (!trimmed) return null;

  const normalized = trimmed
    .replace(/^git@github\.com:/, "")
    .replace(/^https:\/\/github\.com\//, "")
    .replace(/\.git$/, "");

  return normalized.includes("/") ? normalized : null;
}

function summarizeBaselineCheck(check: BaselineCheck): string {
  const parts = [
    `${check.label}: ${check.method} ${check.url}`,
    check.status === null ? "status=unreachable" : `status=${check.status}`,
    check.contentType ? `content-type=${check.contentType}` : "content-type=unknown",
  ];

  if (check.notes.length > 0) {
    parts.push(`notes=${check.notes.join("; ")}`);
  }

  if (check.bodySnippet) {
    parts.push(`snippet=${JSON.stringify(check.bodySnippet)}`);
  }

  return `- ${parts.join(" | ")}`;
}

export function buildOutageTriagePrompt(input: {
  targetUrl: string;
  baselineChecks: BaselineCheck[];
  repoHints: string[];
}): string {
  const { targetUrl, baselineChecks, repoHints } = input;

  return [
    `Read-only production outage triage for ${targetUrl}.`,
    "",
    "Work rules:",
    "- Read-only only. Do not edit files, deploy, restart services, or propose mutating commands as already-run.",
    "- Use the local repository to inspect the relevant codepaths and compare expected behavior to the observed HTTP evidence.",
    "- Focus on the most probable root cause, not a broad audit.",
    "",
    "Observed baseline evidence:",
    ...baselineChecks.map(summarizeBaselineCheck),
    "",
    "Repo hints:",
    ...repoHints.map((hint) => `- ${hint}`),
    "",
    "Return strict JSON with exactly these keys:",
    "{",
    '  "symptoms": string[],',
    '  "evidence": string[],',
    '  "probableCause": string,',
    '  "confidence": number,',
    '  "nextChecks": string[],',
    '  "blockedActions": string[]',
    "}",
    "",
    "Rules for the JSON:",
    "- No markdown fences.",
    "- confidence must be between 0 and 1.",
    "- evidence must cite the observed baseline and/or concrete repo paths.",
    "- nextChecks must be actionable read-only checks or the smallest safe manual follow-up.",
  ].join("\n");
}

export function extractFirstJsonObject(text: string): string | null {
  for (let start = 0; start < text.length; start += 1) {
    if (text[start] !== "{") continue;

    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let index = start; index < text.length; index += 1) {
      const char = text[index];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === "\\") {
        escaped = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (inString) continue;

      if (char === "{") depth += 1;
      if (char === "}") depth -= 1;

      if (depth === 0) {
        const candidate = text.slice(start, index + 1);
        try {
          JSON.parse(candidate);
          return candidate;
        } catch {
          break;
        }
      }
    }
  }

  return null;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

export function normalizeOutageFinding(value: unknown): OutageFinding {
  const record =
    typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
  const confidenceValue = typeof record.confidence === "number" ? record.confidence : 0;

  return {
    symptoms: toStringArray(record.symptoms),
    evidence: toStringArray(record.evidence),
    probableCause:
      typeof record.probableCause === "string" && record.probableCause.trim().length > 0
        ? record.probableCause
        : "Unknown",
    confidence: Math.max(0, Math.min(1, confidenceValue)),
    nextChecks: toStringArray(record.nextChecks),
    blockedActions: toStringArray(record.blockedActions),
  };
}

export function parseOutageFinding(agent: AgentName, rawOutput: string): ParsedAgentResult {
  const jsonText = extractFirstJsonObject(rawOutput);
  if (!jsonText) {
    return {
      agent,
      finding: null,
      parseError: "No JSON object found in agent output.",
    };
  }

  try {
    const parsed = JSON.parse(jsonText) as unknown;
    return {
      agent,
      finding: normalizeOutageFinding(parsed),
      parseError: null,
    };
  } catch (error) {
    return {
      agent,
      finding: null,
      parseError: error instanceof Error ? error.message : "Failed to parse JSON.",
    };
  }
}

export function buildIncidentBrief(input: {
  targetUrl: string;
  runId: string;
  baselineChecks: BaselineCheck[];
  availability: AgentAvailability[];
  parsedResults: ParsedAgentResult[];
  queuedAgents: Array<{ agent: AgentName; note: string }>;
}): string {
  const { targetUrl, runId, baselineChecks, availability, parsedResults, queuedAgents } = input;
  const successful = parsedResults.filter((result) => result.finding);
  const probableCauses = new Map<string, number>();

  for (const result of successful) {
    probableCauses.set(
      result.finding?.probableCause,
      (probableCauses.get(result.finding?.probableCause) ?? 0) + 1,
    );
  }

  const leadingCause =
    [...probableCauses.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ??
    "No consensus yet";

  return [
    `# Outage Triage Brief`,
    "",
    `- Target: \`${targetUrl}\``,
    `- Run ID: \`${runId}\``,
    `- Leading probable cause: ${leadingCause}`,
    "",
    "## Agent Availability",
    ...availability.map(
      (entry) =>
        `- ${entry.agent}: ${entry.status} (installed=${entry.installed}, authenticated=${entry.authenticated}, repoConnected=${entry.repoConnected ?? "n/a"})`,
    ),
    "",
    "## Baseline Evidence",
    ...baselineChecks.map(summarizeBaselineCheck),
    "",
    "## Agent Findings",
    ...parsedResults.map((result) => {
      if (!result.finding) {
        return `- ${result.agent}: parse failed (${result.parseError})`;
      }

      return [
        `- ${result.agent}: probableCause=${result.finding.probableCause} confidence=${result.finding.confidence.toFixed(2)}`,
        `  symptoms=${result.finding.symptoms.join(" | ") || "none"}`,
        `  nextChecks=${result.finding.nextChecks.join(" | ") || "none"}`,
      ].join("\n");
    }),
    ...(queuedAgents.length > 0
      ? [
          "",
          "## Queued / Deferred Agents",
          ...queuedAgents.map((item) => `- ${item.agent}: ${item.note}`),
        ]
      : []),
  ].join("\n");
}
