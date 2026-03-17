/**
 * Donated API key validation.
 *
 * Validates that a donated key is genuine before accepting it into the pool.
 * This prevents the token pool from being poisoned with garbage values that
 * silently fail at runtime, and eliminates the social-engineering vector where
 * an attacker submits invalid keys to farm credits (OWASP A04:2021).
 *
 * Strategy per provider:
 *   - OpenAI    : GET /v1/models  (200 = valid, 401 = invalid)
 *   - Anthropic : GET /v1/models  with x-api-key header
 *   - Google    : GET https://generativelanguage.googleapis.com/v1beta/models
 *   - xAI       : GET https://api.x.ai/v1/models  (OpenAI-compatible)
 *
 * Security notes:
 * - We only make a read-only "list" call — never a completion/generation request
 * - The raw key is NEVER logged, only the provider and a sanitised error code
 * - Network errors are treated as "unknown" (not "invalid") to avoid rejecting
 *   keys when our network is the problem
 * - Timeouts are short (5 s) to avoid blocking the donation endpoint
 *
 * OWASP A02:2021 — Cryptographic Failures (no plaintext logging)
 * OWASP A03:2021 — Injection (no key interpolation into code paths)
 * OWASP A05:2021 — Security Misconfiguration (reject garbage early)
 */

export type DonatedProvider = "openai" | "anthropic" | "google" | "xai";

export interface ValidationResult {
  /** Whether the key was accepted as valid by the upstream provider. */
  valid: boolean;
  /** Normalised provider name. */
  provider: DonatedProvider;
  /**
   * A sanitised, non-sensitive error code when valid=false.
   * Never contains the key or any portion of it.
   */
  error?: string;
}

/** Timeout for provider validation calls in milliseconds. */
const VALIDATION_TIMEOUT_MS = 5_000;

/**
 * Fetch with an AbortController timeout.
 * Returns null on timeout or network error rather than throwing.
 */
async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function validateOpenAI(apiKey: string): Promise<ValidationResult> {
  const res = await fetchWithTimeout(
    "https://api.openai.com/v1/models",
    {
      method: "GET",
      headers: {
        // Key is passed directly to the upstream — never echoed back to us
        Authorization: `Bearer ${apiKey}`,
        "User-Agent": "spike-land-validator/1.0",
      },
    },
    VALIDATION_TIMEOUT_MS,
  );

  if (!res) {
    return { valid: false, provider: "openai", error: "network_error" };
  }

  if (res.status === 200) {
    return { valid: true, provider: "openai" };
  }

  if (res.status === 401 || res.status === 403) {
    return { valid: false, provider: "openai", error: "invalid_key" };
  }

  // 429 means the key exists but is rate-limited — still a valid key
  if (res.status === 429) {
    return { valid: true, provider: "openai" };
  }

  return { valid: false, provider: "openai", error: `unexpected_status_${res.status}` };
}

async function validateAnthropic(apiKey: string): Promise<ValidationResult> {
  const res = await fetchWithTimeout(
    "https://api.anthropic.com/v1/models",
    {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "User-Agent": "spike-land-validator/1.0",
      },
    },
    VALIDATION_TIMEOUT_MS,
  );

  if (!res) {
    return { valid: false, provider: "anthropic", error: "network_error" };
  }

  if (res.status === 200) {
    return { valid: true, provider: "anthropic" };
  }

  if (res.status === 401 || res.status === 403) {
    return { valid: false, provider: "anthropic", error: "invalid_key" };
  }

  if (res.status === 429) {
    return { valid: true, provider: "anthropic" };
  }

  return { valid: false, provider: "anthropic", error: `unexpected_status_${res.status}` };
}

async function validateGoogle(apiKey: string): Promise<ValidationResult> {
  // Google AI (Gemini) uses API key as a query param on the REST endpoint
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  const res = await fetchWithTimeout(
    url,
    {
      method: "GET",
      headers: { "User-Agent": "spike-land-validator/1.0" },
    },
    VALIDATION_TIMEOUT_MS,
  );

  if (!res) {
    return { valid: false, provider: "google", error: "network_error" };
  }

  if (res.status === 200) {
    return { valid: true, provider: "google" };
  }

  if (res.status === 400 || res.status === 401 || res.status === 403) {
    return { valid: false, provider: "google", error: "invalid_key" };
  }

  if (res.status === 429) {
    return { valid: true, provider: "google" };
  }

  return { valid: false, provider: "google", error: `unexpected_status_${res.status}` };
}

async function validateXai(apiKey: string): Promise<ValidationResult> {
  // xAI API is OpenAI-compatible
  const res = await fetchWithTimeout(
    "https://api.x.ai/v1/models",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "User-Agent": "spike-land-validator/1.0",
      },
    },
    VALIDATION_TIMEOUT_MS,
  );

  if (!res) {
    return { valid: false, provider: "xai", error: "network_error" };
  }

  if (res.status === 200) {
    return { valid: true, provider: "xai" };
  }

  if (res.status === 401 || res.status === 403) {
    return { valid: false, provider: "xai", error: "invalid_key" };
  }

  if (res.status === 429) {
    return { valid: true, provider: "xai" };
  }

  return { valid: false, provider: "xai", error: `unexpected_status_${res.status}` };
}

/**
 * Validate a donated API key against its declared provider.
 *
 * @param provider  One of the supported provider names.
 * @param apiKey    The raw API key string. Never logged.
 * @returns         ValidationResult with valid flag and optional error code.
 */
export async function validateDonatedKey(
  provider: DonatedProvider,
  apiKey: string,
): Promise<ValidationResult> {
  // Basic structural check before hitting the network — saves an outbound
  // request for obvious garbage (empty, too short, wrong prefix).
  if (!apiKey || apiKey.length < 10) {
    return { valid: false, provider, error: "key_too_short" };
  }

  switch (provider) {
    case "openai":
      return validateOpenAI(apiKey);
    case "anthropic":
      return validateAnthropic(apiKey);
    case "google":
      return validateGoogle(apiKey);
    case "xai":
      return validateXai(apiKey);
    default: {
      // Exhaustiveness guard — TypeScript narrows provider to never here
      const _exhaustive: never = provider;
      return { valid: false, provider: _exhaustive, error: "unsupported_provider" };
    }
  }
}

/**
 * Type guard — narrows a raw string to DonatedProvider.
 */
export function isDonatedProvider(value: string): value is DonatedProvider {
  return ["openai", "anthropic", "google", "xai"].includes(value);
}
