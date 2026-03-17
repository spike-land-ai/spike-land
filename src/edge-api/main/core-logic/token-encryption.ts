/**
 * AES-256-GCM encryption for donated API keys.
 *
 * Two usage patterns are provided:
 *
 * Pattern A — base64 master key (TOKEN_BANK_KEY, 32-byte random secret):
 *   importMasterKey(base64Key) -> CryptoKey
 *   encryptToken(plaintext, masterKey) -> base64(iv + ciphertext)
 *   decryptToken(stored, masterKey) -> plaintext
 *
 * Pattern B — PBKDF2 derivation from arbitrary secret string (TOKEN_ENCRYPTION_KEY):
 *   encryptApiKey(plaintext, secret) -> base64(iv + ciphertext)
 *   decryptApiKey(encrypted, secret) -> plaintext
 *
 * Security properties:
 * - AES-256-GCM provides authenticated encryption (confidentiality + integrity)
 * - Each encrypt() call generates a unique random 12-byte IV (never reused)
 * - PBKDF2 derives a strong per-deployment key from the TOKEN_ENCRYPTION_KEY secret
 * - The stored blob is: base64(iv || ciphertext || auth_tag) — all in one opaque string
 * - Decryption failure (wrong key, tampered ciphertext) throws — callers must handle
 *
 * OWASP A02:2021 — Cryptographic Failures
 * OWASP A04:2021 — Insecure Design (defence-in-depth: even a full DB dump leaks nothing)
 *
 * Runtime: Cloudflare Workers (Web Crypto API — no Node crypto)
 */

/** Number of PBKDF2 iterations. NIST recommends ≥ 210 000 for SHA-256 as of 2023. */
const PBKDF2_ITERATIONS = 210_000;

/** Salt is fixed per-deployment (derived from the secret itself).
 *  Using a deterministic salt is acceptable here because PBKDF2 is only called
 *  once per worker cold start and the secret itself provides the entropy.
 *  We use a stable, known value so that rotating the secret (via TOKEN_ENCRYPTION_KEY)
 *  is the re-keying mechanism. */
const PBKDF2_SALT = new TextEncoder().encode("spike-land-token-encryption-v1");

/** Cache the derived CryptoKey per secret string to avoid repeated PBKDF2 on
 *  every encrypt/decrypt in the same isolate lifetime. */
const keyCache = new Map<string, CryptoKey>();

/**
 * Derive an AES-256-GCM CryptoKey from the raw secret string via PBKDF2.
 * Result is cached for the isolate lifetime (one Cloudflare Worker instance).
 */
async function deriveKey(secret: string): Promise<CryptoKey> {
  const cached = keyCache.get(secret);
  if (cached) return cached;

  // Import the raw secret as a PBKDF2 key material
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "PBKDF2" },
    false, // not extractable
    ["deriveKey"],
  );

  // Derive AES-256-GCM key
  const aesKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: PBKDF2_SALT,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false, // not extractable — key material never leaves the runtime
    ["encrypt", "decrypt"],
  );

  keyCache.set(secret, aesKey);
  return aesKey;
}

/**
 * Encrypt a plaintext API key.
 *
 * @param plaintext  The raw API key string. Never logged.
 * @param secret     The TOKEN_ENCRYPTION_KEY env var value.
 * @returns          An opaque base64 string: base64url(iv || ciphertext+tag)
 *                   Safe to store in D1 TEXT column.
 */
export async function encryptApiKey(plaintext: string, secret: string): Promise<string> {
  const key = await deriveKey(secret);

  // Generate a fresh random 96-bit IV for every encryption.
  // AES-GCM MUST use a unique IV per (key, message) pair.
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encoded = new TextEncoder().encode(plaintext);

  // AES-GCM appends the 128-bit auth tag to the ciphertext automatically
  const cipherBuffer = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);

  // Concatenate iv (12 bytes) + ciphertext+tag into one buffer
  const combined = new Uint8Array(iv.byteLength + cipherBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipherBuffer), iv.byteLength);

  // Encode as standard base64 for D1 TEXT storage
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt an encrypted API key blob produced by encryptApiKey().
 *
 * @param encrypted  The base64 blob from D1.
 * @param secret     The TOKEN_ENCRYPTION_KEY env var value.
 * @returns          The original plaintext API key string.
 * @throws           If the ciphertext is tampered, truncated, or the wrong key is used.
 *                   Callers must catch and treat as an invalid/unusable key.
 */
export async function decryptApiKey(encrypted: string, secret: string): Promise<string> {
  const key = await deriveKey(secret);

  // Decode base64 → raw bytes
  let combined: Uint8Array;
  try {
    combined = Uint8Array.from(atob(encrypted), (c) => c.charCodeAt(0));
  } catch {
    throw new Error("token_decryption_failed: invalid base64 encoding");
  }

  if (combined.byteLength < 12 + 16) {
    // Must be at least IV (12) + auth tag (16) bytes
    throw new Error("token_decryption_failed: ciphertext too short");
  }

  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  let plainBuffer: ArrayBuffer;
  try {
    plainBuffer = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  } catch {
    // Do NOT include any ciphertext bytes in the error — no oracle leakage
    throw new Error("token_decryption_failed: authentication failed");
  }

  return new TextDecoder().decode(plainBuffer);
}

/**
 * Return true if the given string looks like it was produced by encryptApiKey().
 * This is a structural check only — it does NOT attempt decryption.
 * Use to distinguish legacy plaintext rows from encrypted ones during migration.
 *
 * Heuristic: encrypted blobs are base64, at minimum 28 chars (12 IV + 16 tag → 28 base64 chars),
 * and contain only base64 alphabet characters.
 */
export function isEncryptedBlob(value: string): boolean {
  if (value.length < 28) return false;
  return /^[A-Za-z0-9+/]+=*$/.test(value);
}

// ── Pattern A: base64 master key (TOKEN_BANK_KEY) ────────────────────

/**
 * Import a 32-byte base64-encoded master key as an AES-256-GCM CryptoKey.
 * Use with TOKEN_BANK_KEY: a 256-bit random secret stored as a Worker secret.
 * Generate with: openssl rand -base64 32
 */
export async function importMasterKey(base64Key: string): Promise<CryptoKey> {
  const raw = Uint8Array.from(atob(base64Key), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM", length: 256 }, false, [
    "encrypt",
    "decrypt",
  ]);
}

/**
 * Encrypt a plaintext string with the given AES-256-GCM CryptoKey.
 * Generates a fresh 12-byte random IV per call.
 *
 * @returns base64(iv || ciphertext+tag)
 */
export async function encryptToken(plaintext: string, masterKey: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const cipherBuffer = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, masterKey, encoded);

  const combined = new Uint8Array(12 + cipherBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipherBuffer), 12);

  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt a blob produced by encryptToken().
 *
 * @param stored  base64(iv || ciphertext+tag)
 * @throws        If the ciphertext is tampered or the wrong key is used.
 */
export async function decryptToken(stored: string, masterKey: CryptoKey): Promise<string> {
  let combined: Uint8Array;
  try {
    combined = Uint8Array.from(atob(stored), (c) => c.charCodeAt(0));
  } catch {
    throw new Error("token_decryption_failed: invalid base64");
  }

  if (combined.byteLength < 12 + 16) {
    throw new Error("token_decryption_failed: ciphertext too short");
  }

  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  let plainBuffer: ArrayBuffer;
  try {
    plainBuffer = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, masterKey, ciphertext);
  } catch {
    throw new Error("token_decryption_failed: authentication failed");
  }

  return new TextDecoder().decode(plainBuffer);
}
