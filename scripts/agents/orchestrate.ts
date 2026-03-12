import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "node:child_process";
import process from "node:process";
import {
  buildIncidentBrief,
  buildOutageTriagePrompt,
  parseOutageFinding,
  parseRepoSlug,
  type AgentAvailability,
  type AgentName,
  type BaselineCheck,
  type OutageFinding,
} from "./orchestrate-lib.js";

interface ProcessResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timedOut: boolean;
}

interface OrchestratorRunSpec {
  id: string;
  taskType: "outage-triage";
  repo: string | null;
  targetEnv: "production";
  targetUrl: string;
  readOnly: true;
  agents: AgentName[];
  expectedArtifacts: string[];
  createdAt: string;
}

interface AgentRunResult {
  agent: AgentName;
  status: "completed" | "queued" | "skipped" | "failed";
  startedAt: string;
  endedAt: string;
  latencyMs: number;
  artifacts: string[];
  summary: string;
  rawOutputPath: string | null;
  rawErrorPath: string | null;
  finding: OutageFinding | null;
  parseError: string | null;
}

const ROOT = process.cwd();
const HISTORY_ROOT = join(ROOT, ".prompt-history");
const RUNS_ROOT = join(HISTORY_ROOT, "runs");
const REPO_HINTS = [
  "src/edge-api/main/api/routes/health.ts defines GET /health and GET /api/health, returning JSON status based on R2 and D1 checks, with deep checks for auth and MCP service bindings.",
  "src/edge-api/status/core-logic/monitor.ts treats https://spike.land/health, https://api.spike.land/health, and https://mcp.spike.land/health as canonical health probes.",
  "src/app/api/health/detailed/route.ts exists separately in the Next app and returns process metrics, so there are at least two distinct health surfaces in the repo.",
];

async function runProcess(
  command: string,
  args: string[],
  options: {
    cwd?: string;
    env?: NodeJS.ProcessEnv;
    timeoutMs?: number;
  } = {},
): Promise<ProcessResult> {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? ROOT,
      env: options.env ?? process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });

    const timer =
      options.timeoutMs !== undefined
        ? setTimeout(() => {
            timedOut = true;
            child.kill("SIGTERM");
          }, options.timeoutMs)
        : null;

    child.on("close", (exitCode) => {
      if (timer) clearTimeout(timer);
      resolve({ stdout, stderr, exitCode, timedOut });
    });

    child.on("error", (error) => {
      if (timer) clearTimeout(timer);
      resolve({
        stdout,
        stderr: `${stderr}${error instanceof Error ? error.message : String(error)}`,
        exitCode: null,
        timedOut,
      });
    });
  });
}

async function ensureRunDir(runId: string): Promise<string> {
  const day = new Date().toISOString().slice(0, 10);
  const runDir = join(RUNS_ROOT, day, runId);
  await mkdir(runDir, { recursive: true });
  return runDir;
}

function createRunId(taskType: string): string {
  return `${taskType}-${new Date().toISOString().replace(/[:.]/g, "-")}`;
}

async function getOriginRepoSlug(): Promise<string | null> {
  const result = await runProcess("git", ["remote", "get-url", "origin"], {
    cwd: ROOT,
    timeoutMs: 5000,
  });
  if (result.exitCode !== 0) return null;
  return parseRepoSlug(result.stdout.trim());
}

async function detectClaude(): Promise<AgentAvailability> {
  const version = await runProcess("bash", ["-lc", "command -v claude"], {
    cwd: ROOT,
    timeoutMs: 5000,
  });
  if (version.exitCode !== 0 || !version.stdout.trim()) {
    return {
      agent: "claude",
      installed: false,
      authenticated: false,
      callable: false,
      repoConnected: null,
      status: "unavailable",
      notes: ["claude not found on PATH"],
    };
  }

  const auth = await runProcess("claude", ["auth", "status"], { cwd: ROOT, timeoutMs: 15000 });
  const authenticated = auth.exitCode === 0 && auth.stdout.includes('"loggedIn": true');

  return {
    agent: "claude",
    installed: true,
    authenticated,
    callable: authenticated,
    repoConnected: null,
    status: authenticated ? "ready" : "unavailable",
    notes: authenticated ? [] : ["claude auth status did not report loggedIn=true"],
  };
}

async function detectGemini(): Promise<AgentAvailability> {
  const version = await runProcess("bash", ["-lc", "command -v gemini"], {
    cwd: ROOT,
    timeoutMs: 5000,
  });
  if (version.exitCode !== 0 || !version.stdout.trim()) {
    return {
      agent: "gemini",
      installed: false,
      authenticated: false,
      callable: false,
      repoConnected: null,
      status: "unavailable",
      notes: ["gemini not found on PATH"],
    };
  }

  const sessions = await runProcess("gemini", ["--list-sessions"], { cwd: ROOT, timeoutMs: 20000 });
  const authenticated = sessions.exitCode === 0;

  return {
    agent: "gemini",
    installed: true,
    authenticated,
    callable: authenticated,
    repoConnected: null,
    status: authenticated ? "ready" : "unavailable",
    notes: authenticated ? [] : ["gemini --list-sessions failed"],
  };
}

async function detectJules(repoSlug: string | null): Promise<AgentAvailability> {
  const version = await runProcess("bash", ["-lc", "command -v jules"], {
    cwd: ROOT,
    timeoutMs: 5000,
  });
  if (version.exitCode !== 0 || !version.stdout.trim()) {
    return {
      agent: "jules",
      installed: false,
      authenticated: false,
      callable: false,
      repoConnected: false,
      status: "unavailable",
      notes: ["jules not found on PATH"],
    };
  }

  const repos = await runProcess("jules", ["remote", "list", "--repo"], {
    cwd: ROOT,
    timeoutMs: 15000,
  });
  const authenticated = repos.exitCode === 0;
  const connectedRepos = repos.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const repoConnected = repoSlug ? connectedRepos.includes(repoSlug) : false;

  return {
    agent: "jules",
    installed: true,
    authenticated,
    callable: authenticated,
    repoConnected,
    status: authenticated && repoConnected ? "ready" : authenticated ? "limited" : "unavailable",
    notes:
      authenticated && repoConnected
        ? []
        : authenticated
          ? [`repo ${repoSlug ?? "unknown"} is not connected in Jules`]
          : ["jules remote list --repo failed"],
  };
}

async function collectAvailability(repoSlug: string | null): Promise<AgentAvailability[]> {
  return Promise.all([detectClaude(), detectGemini(), detectJules(repoSlug)]);
}

function summarizeHtmlSnippet(text: string): string {
  return text.replace(/\s+/g, " ").trim().slice(0, 220);
}

async function fetchBaselineCheck(label: string, url: string): Promise<BaselineCheck> {
  const notes: string[] = [];

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "user-agent": "spike-land-ai-orchestrator/1.0",
        accept: "application/json,text/html;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    });

    const contentType = response.headers.get("content-type");
    const body = await response.text();
    const bodySnippet = summarizeHtmlSnippet(body);

    if (body.includes("Just a moment...")) {
      notes.push("Cloudflare challenge page returned");
    }
    if (url.includes("health") && !(contentType ?? "").includes("application/json")) {
      notes.push("health endpoint did not return JSON");
    }

    return {
      label,
      method: "GET",
      url,
      status: response.status,
      contentType,
      bodySnippet,
      notes,
    };
  } catch (error) {
    notes.push(error instanceof Error ? error.message : "Unknown fetch error");
    return {
      label,
      method: "GET",
      url,
      status: null,
      contentType: null,
      bodySnippet: "",
      notes,
    };
  }
}

async function collectOutageBaseline(targetUrl: string): Promise<BaselineCheck[]> {
  return Promise.all([
    fetchBaselineCheck("Main Site", targetUrl),
    fetchBaselineCheck("Main Site API health", `${targetUrl.replace(/\/$/, "")}/api/health`),
    fetchBaselineCheck("Edge API health", "https://api.spike.land/api/health"),
    fetchBaselineCheck("MCP Registry health", "https://mcp.spike.land/health"),
  ]);
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function appendJsonl(path: string, value: unknown): Promise<void> {
  const line = `${JSON.stringify(value)}\n`;
  let existing = "";
  try {
    existing = await readFile(path, "utf8");
  } catch {
    existing = "";
  }
  await writeFile(path, `${existing}${line}`, "utf8");
}

async function runLocalWrapper(
  agent: Extract<AgentName, "claude" | "gemini">,
  prompt: string,
  runDir: string,
): Promise<AgentRunResult> {
  const started = Date.now();
  const startedAt = new Date(started).toISOString();
  const scriptName = agent === "claude" ? "claude-plan.sh" : "gemini-plan.sh";
  const result = await runProcess("bash", [join("scripts", "agents", scriptName), prompt], {
    cwd: ROOT,
    timeoutMs: 5 * 60 * 1000,
  });
  const ended = Date.now();
  const endedAt = new Date(ended).toISOString();
  const stdoutPath = join(runDir, `${agent}.stdout.txt`);
  const stderrPath = join(runDir, `${agent}.stderr.txt`);

  await writeFile(stdoutPath, result.stdout, "utf8");
  await writeFile(stderrPath, result.stderr, "utf8");

  if (result.exitCode !== 0) {
    return {
      agent,
      status: "failed",
      startedAt,
      endedAt,
      latencyMs: ended - started,
      artifacts: [stdoutPath, stderrPath],
      summary: `${agent} exited with code ${result.exitCode ?? "null"}`,
      rawOutputPath: stdoutPath,
      rawErrorPath: stderrPath,
      finding: null,
      parseError: `Agent command failed with code ${result.exitCode ?? "null"}`,
    };
  }

  const parsed = parseOutageFinding(agent, result.stdout);
  const parsedPath = join(runDir, `${agent}.finding.json`);
  await writeJson(
    parsedPath,
    parsed.finding ?? { parseError: parsed.parseError, rawOutputPath: stdoutPath },
  );

  return {
    agent,
    status: "completed",
    startedAt,
    endedAt,
    latencyMs: ended - started,
    artifacts: [stdoutPath, stderrPath, parsedPath],
    summary: parsed.finding?.probableCause ?? parsed.parseError ?? `${agent} completed`,
    rawOutputPath: stdoutPath,
    rawErrorPath: stderrPath,
    finding: parsed.finding,
    parseError: parsed.parseError,
  };
}

function parseJulesSession(stdout: string): { id: string | null; url: string | null } {
  const idMatch = stdout.match(/^ID:\s+(\d+)/m);
  const urlMatch = stdout.match(/^URL:\s+(https:\/\/\S+)/m);
  return {
    id: idMatch?.[1] ?? null,
    url: urlMatch?.[1] ?? null,
  };
}

async function runJulesWrapper(
  repoSlug: string,
  prompt: string,
  runDir: string,
): Promise<AgentRunResult> {
  const started = Date.now();
  const startedAt = new Date(started).toISOString();
  const result = await runProcess(
    "bash",
    [join("scripts", "agents", "jules-new.sh"), "--repo", repoSlug, prompt],
    {
      cwd: ROOT,
      timeoutMs: 60 * 1000,
    },
  );
  const ended = Date.now();
  const endedAt = new Date(ended).toISOString();
  const stdoutPath = join(runDir, "jules.stdout.txt");
  const stderrPath = join(runDir, "jules.stderr.txt");

  await writeFile(stdoutPath, result.stdout, "utf8");
  await writeFile(stderrPath, result.stderr, "utf8");

  if (result.exitCode !== 0) {
    return {
      agent: "jules",
      status: "failed",
      startedAt,
      endedAt,
      latencyMs: ended - started,
      artifacts: [stdoutPath, stderrPath],
      summary: "Jules session creation failed",
      rawOutputPath: stdoutPath,
      rawErrorPath: stderrPath,
      finding: null,
      parseError: `Jules exited with code ${result.exitCode ?? "null"}`,
    };
  }

  const session = parseJulesSession(result.stdout);
  const parsedPath = join(runDir, "jules.session.json");
  await writeJson(parsedPath, session);

  return {
    agent: "jules",
    status: "queued",
    startedAt,
    endedAt,
    latencyMs: ended - started,
    artifacts: [stdoutPath, stderrPath, parsedPath],
    summary:
      session.id && session.url ? `Queued Jules session ${session.id}` : "Queued Jules session",
    rawOutputPath: stdoutPath,
    rawErrorPath: stderrPath,
    finding: null,
    parseError: null,
  };
}

async function runStatus(): Promise<number> {
  const repoSlug = await getOriginRepoSlug();
  const availability = await collectAvailability(repoSlug);
  console.log(JSON.stringify({ repoSlug, availability }, null, 2));
  return 0;
}

async function runOutageTriage(targetUrl: string): Promise<number> {
  const repoSlug = await getOriginRepoSlug();
  const availability = await collectAvailability(repoSlug);
  const runId = createRunId("outage-triage");
  const runDir = await ensureRunDir(runId);

  const spec: OrchestratorRunSpec = {
    id: runId,
    taskType: "outage-triage",
    repo: repoSlug,
    targetEnv: "production",
    targetUrl,
    readOnly: true,
    agents: ["claude", "gemini", "jules"],
    expectedArtifacts: [
      "run-spec.json",
      "availability.json",
      "baseline.json",
      "incident-brief.md",
      "incident-brief.json",
    ],
    createdAt: new Date().toISOString(),
  };

  const baselineChecks = await collectOutageBaseline(targetUrl);
  const prompt = buildOutageTriagePrompt({
    targetUrl,
    baselineChecks,
    repoHints: REPO_HINTS,
  });

  await writeJson(join(runDir, "run-spec.json"), spec);
  await writeJson(join(runDir, "availability.json"), availability);
  await writeJson(join(runDir, "baseline.json"), baselineChecks);
  await writeFile(join(runDir, "triage.prompt.txt"), `${prompt}\n`, "utf8");

  const eventsPath = join(runDir, "events.jsonl");
  await appendJsonl(eventsPath, {
    type: "run-started",
    at: new Date().toISOString(),
    runId,
    targetUrl,
  });

  const readyAgents = availability.filter((entry) => entry.status === "ready");
  const immediateAgents = readyAgents.filter((entry) => entry.agent !== "jules");
  const queuedAgents: Array<{ agent: AgentName; note: string }> = [];

  const tasks = immediateAgents.map((entry) =>
    runLocalWrapper(entry.agent as "claude" | "gemini", prompt, runDir),
  );

  const julesAvailability = availability.find((entry) => entry.agent === "jules");
  if (julesAvailability?.status === "ready" && repoSlug) {
    tasks.push(runJulesWrapper(repoSlug, prompt, runDir));
  } else if (julesAvailability) {
    queuedAgents.push({
      agent: "jules",
      note: julesAvailability.notes.join("; ") || "Not available for this repo",
    });
  }

  const runResults = await Promise.all(tasks);

  for (const result of runResults) {
    await appendJsonl(eventsPath, {
      type: "agent-finished",
      at: new Date().toISOString(),
      agent: result.agent,
      status: result.status,
      summary: result.summary,
      latencyMs: result.latencyMs,
    });
  }

  const parsedResults = runResults
    .filter((result) => result.agent !== "jules")
    .map((result) => ({
      agent: result.agent,
      finding: result.finding,
      parseError: result.parseError,
    }));

  const incidentBrief = buildIncidentBrief({
    targetUrl,
    runId,
    baselineChecks,
    availability,
    parsedResults,
    queuedAgents,
  });

  const incidentJson = {
    runId,
    targetUrl,
    availability,
    baselineChecks,
    results: runResults,
    queuedAgents,
  };

  await writeFile(join(runDir, "incident-brief.md"), `${incidentBrief}\n`, "utf8");
  await writeJson(join(runDir, "incident-brief.json"), incidentJson);
  await appendJsonl(eventsPath, {
    type: "run-completed",
    at: new Date().toISOString(),
    runId,
    runDir,
  });

  console.log(incidentBrief);
  console.log(`\nArtifacts written to ${runDir}`);

  return 0;
}

function printUsage(): void {
  console.log(
    [
      "Usage:",
      "  npx tsx scripts/agents/orchestrate.ts status",
      "  npx tsx scripts/agents/orchestrate.ts triage-outage --url https://spike.land",
    ].join("\n"),
  );
}

async function main(): Promise<number> {
  const [, , command, ...rest] = process.argv;

  if (!command || command === "--help" || command === "-h") {
    printUsage();
    return 0;
  }

  if (command === "status") {
    return runStatus();
  }

  if (command === "triage-outage") {
    let targetUrl = "https://spike.land";
    for (let index = 0; index < rest.length; index += 1) {
      if (rest[index] === "--url" && rest[index + 1]) {
        targetUrl = rest[index + 1];
        index += 1;
      }
    }

    return runOutageTriage(targetUrl);
  }

  printUsage();
  return 1;
}

void main().then((code) => {
  process.exitCode = code;
});
