export type HealthStatus = "ok" | "degraded";

export interface HealthPayload {
  status: HealthStatus;
  r2: HealthStatus;
  d1: HealthStatus;
  timestamp: string;
  authMcp?: HealthStatus;
  mcpService?: HealthStatus;
}

export interface HealthFetchBinding {
  fetch(request: Request, init?: RequestInit): Promise<Response>;
}

export interface HealthPayloadOptions {
  r2: HealthStatus;
  d1: HealthStatus;
  authMcp?: HealthStatus | undefined;
  mcpService?: HealthStatus | undefined;
  timestamp?: string | undefined;
}

export async function checkDependencyHealth(check: () => Promise<unknown>): Promise<HealthStatus> {
  try {
    await check();
    return "ok";
  } catch {
    return "degraded";
  }
}

export async function checkFetchBindingHealth(
  binding: HealthFetchBinding,
  options: {
    requestUrl?: string;
    timeoutMs?: number;
  } = {},
): Promise<HealthStatus> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 3_000);

  try {
    const response = await binding.fetch(
      new Request(options.requestUrl ?? "https://internal/health"),
      {
        signal: controller.signal,
      },
    );
    return response.ok ? "ok" : "degraded";
  } catch {
    return "degraded";
  } finally {
    clearTimeout(timeout);
  }
}

export function getOverallHealthStatus(statuses: HealthStatus[]): HealthStatus {
  return statuses.every((status) => status === "ok") ? "ok" : "degraded";
}

export function buildHealthPayload(options: HealthPayloadOptions): HealthPayload {
  const statusFields: HealthStatus[] = [options.r2, options.d1];

  if (options.authMcp) {
    statusFields.push(options.authMcp);
  }

  if (options.mcpService) {
    statusFields.push(options.mcpService);
  }

  return {
    status: getOverallHealthStatus(statusFields),
    r2: options.r2,
    d1: options.d1,
    timestamp: options.timestamp ?? new Date().toISOString(),
    ...(options.authMcp ? { authMcp: options.authMcp } : {}),
    ...(options.mcpService ? { mcpService: options.mcpService } : {}),
  };
}

export function getHealthHttpStatus(payload: Pick<HealthPayload, "status">): 200 | 503 {
  return payload.status === "ok" ? 200 : 503;
}
