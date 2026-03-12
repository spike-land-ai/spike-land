import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

type CommandName = "build" | "start" | "stop" | "status" | "logs" | "attach" | "help";

interface Options {
  command: CommandName;
  image: string;
  name: string;
  port: number;
  workspace: string;
  rebuild: boolean;
}

const DEFAULT_IMAGE = "spike-land/qa-studio-local";
const DEFAULT_NAME = "qa-studio-local";
const DEFAULT_PORT = 3310;
const DEFAULT_WORKSPACE = process.cwd();
const CONTAINER_PORT = 3100;

function parseArgs(argv: string[]): Options {
  const args = [...argv];
  const command = (args.shift() ?? "help") as CommandName;

  let image = DEFAULT_IMAGE;
  let name = DEFAULT_NAME;
  let port = DEFAULT_PORT;
  let workspace = DEFAULT_WORKSPACE;
  let rebuild = false;

  while (args.length > 0) {
    const arg = args.shift();
    if (!arg) break;

    if (arg === "--image") {
      image = args.shift() ?? image;
      continue;
    }
    if (arg === "--name") {
      name = args.shift() ?? name;
      continue;
    }
    if (arg === "--port") {
      const value = Number.parseInt(args.shift() ?? "", 10);
      if (!Number.isNaN(value) && value > 0) {
        port = value;
      }
      continue;
    }
    if (arg === "--workspace") {
      workspace = resolve(args.shift() ?? workspace);
      continue;
    }
    if (arg === "--rebuild") {
      rebuild = true;
      continue;
    }
  }

  return { command, image, name, port, workspace, rebuild };
}

function runDocker(args: string[], interactive: boolean = false): number {
  const result = spawnSync("docker", args, {
    stdio: interactive ? "inherit" : ["inherit", "pipe", "pipe"],
    encoding: "utf8",
  });

  if (!interactive) {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
  }

  return result.status ?? 1;
}

function getContainerId(name: string): string | null {
  const result = spawnSync("docker", ["ps", "-aq", "--filter", `name=^${name}$`], {
    encoding: "utf8",
  });
  if (result.status !== 0) return null;
  const id = result.stdout.trim();
  return id.length > 0 ? id : null;
}

function imageExists(image: string): boolean {
  const result = spawnSync("docker", ["image", "inspect", image], {
    stdio: "ignore",
  });
  return result.status === 0;
}

function ensureWorkspace(workspace: string): void {
  if (!existsSync(workspace)) {
    throw new Error(`Workspace path does not exist: ${workspace}`);
  }
}

function printHelp(): void {
  process.stdout.write(
    [
      "QA Studio local Docker runner",
      "",
      "Commands:",
      "  build                Build the local QA Studio image",
      "  start [--rebuild]    Start the QA Studio MCP HTTP server in Docker",
      "  stop                 Stop the running container",
      "  status               Show container status and MCP URL",
      "  logs                 Tail container logs",
      "  attach               Open an interactive shell in the container",
      "",
      "Options:",
      `  --image <name>       Docker image name (default: ${DEFAULT_IMAGE})`,
      `  --name <name>        Container name (default: ${DEFAULT_NAME})`,
      `  --port <port>        Host port for MCP HTTP server (default: ${DEFAULT_PORT})`,
      `  --workspace <path>   Local workspace mounted read-only at /workspace (default: cwd)`,
    ].join("\n"),
  );
}

function buildImage(image: string): number {
  return runDocker(["build", "-f", "scripts/qa-studio-local.Dockerfile", "-t", image, "."], true);
}

function stopContainer(name: string): number {
  const id = getContainerId(name);
  if (!id) {
    process.stdout.write(`No container named "${name}" is running.\n`);
    return 0;
  }
  return runDocker(["rm", "-f", id], true);
}

function startContainer(options: Options): number {
  ensureWorkspace(options.workspace);

  if (options.rebuild || !imageExists(options.image)) {
    const built = buildImage(options.image);
    if (built !== 0) return built;
  }

  const existing = getContainerId(options.name);
  if (existing) {
    const stopped = stopContainer(options.name);
    if (stopped !== 0) return stopped;
  }

  const exitCode = runDocker(
    [
      "run",
      "-d",
      "--rm",
      "--name",
      options.name,
      "-p",
      `${options.port}:${CONTAINER_PORT}`,
      "-v",
      `${options.workspace}:/workspace:ro`,
      options.image,
    ],
    true,
  );

  if (exitCode === 0) {
    process.stdout.write(`QA Studio MCP available at http://127.0.0.1:${options.port}/mcp\n`);
  }

  return exitCode;
}

function showStatus(options: Options): number {
  const id = getContainerId(options.name);
  if (!id) {
    process.stdout.write(`Container "${options.name}" is not running.\n`);
    return 0;
  }

  const inspect = spawnSync(
    "docker",
    [
      "inspect",
      options.name,
      "--format",
      "{{.Name}}|{{.State.Status}}|{{range $p, $cfg := .NetworkSettings.Ports}}{{$p}}={{(index $cfg 0).HostPort}}{{end}}",
    ],
    { encoding: "utf8" },
  );

  if (inspect.status !== 0) {
    if (inspect.stderr) process.stderr.write(inspect.stderr);
    return inspect.status ?? 1;
  }

  const [rawName, state, ports] = inspect.stdout.trim().split("|");
  process.stdout.write(
    [
      `Container: ${rawName.replace(/^\//, "")}`,
      `State: ${state}`,
      `Ports: ${ports || `${CONTAINER_PORT}/tcp=${options.port}`}`,
      `MCP URL: http://127.0.0.1:${options.port}/mcp`,
      `Workspace mount: ${options.workspace} -> /workspace (read-only)`,
    ].join("\n") + "\n",
  );
  return 0;
}

function showLogs(name: string): number {
  return runDocker(["logs", "-f", name], true);
}

function attachToContainer(name: string): number {
  const id = getContainerId(name);
  if (!id) {
    process.stderr.write(`Container "${name}" is not running.\n`);
    return 1;
  }
  return runDocker(["exec", "-it", name, "bash"], true);
}

function main(): number {
  const options = parseArgs(process.argv.slice(2));

  switch (options.command) {
    case "build":
      return buildImage(options.image);
    case "start":
      return startContainer(options);
    case "stop":
      return stopContainer(options.name);
    case "status":
      return showStatus(options);
    case "logs":
      return showLogs(options.name);
    case "attach":
      return attachToContainer(options.name);
    case "help":
    default:
      printHelp();
      return 0;
  }
}

process.exitCode = main();
